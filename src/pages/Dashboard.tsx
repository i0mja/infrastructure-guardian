import { Header } from '@/components/layout/Header';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ActivityFeed, type ActivityItem } from '@/components/dashboard/ActivityFeed';
import { HealthGrid } from '@/components/dashboard/HealthGrid';
import { JobsQueue } from '@/components/dashboard/JobsQueue';
import { InventoryOverview, type InventoryCategory } from '@/components/dashboard/InventoryOverview';
import { 
  Server, 
  HardDrive, 
  Network, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Cpu
} from 'lucide-react';
import { useDashboardOverview, useDellEndpoints, useIpamFindings, useIpamPrefixes, useJobs, useSites, useVCenterInstances } from '@/hooks/api';

export default function Dashboard() {
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useDashboardOverview();
  const { data: vcenters, isLoading: vcenterLoading, refetch: refetchVcenters } = useVCenterInstances();
  const { data: dellEndpoints, isLoading: dellLoading, refetch: refetchDell } = useDellEndpoints();
  const { data: ipamPrefixes, isLoading: ipamPrefixesLoading, refetch: refetchPrefixes } = useIpamPrefixes();
  const { data: ipamFindings, isLoading: ipamFindingsLoading, refetch: refetchFindings } = useIpamFindings();
  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useJobs();
  const { data: sites, isLoading: sitesLoading, refetch: refetchSites } = useSites();

  const formatTimestamp = (value?: string) => value ? new Date(value).toLocaleString() : undefined;

  const vcCounts = (vcenters || []).reduce((acc, vc) => {
    acc.datacenters += vc.counts.datacenters;
    acc.clusters += vc.counts.clusters;
    acc.hosts += vc.counts.hosts;
    acc.vms += vc.counts.vms;
    return acc;
  }, { datacenters: 0, clusters: 0, hosts: 0, vms: 0 });

  const generationCounts = (dellEndpoints || []).reduce<Record<string, number>>((acc, endpoint) => {
    acc[endpoint.generation] = (acc[endpoint.generation] || 0) + 1;
    return acc;
  }, {});
  const mappedServers = (dellEndpoints || []).filter((endpoint) => endpoint.mappedHost).length;
  const mappingCoverage = dellEndpoints && dellEndpoints.length > 0
    ? Math.round((mappedServers / dellEndpoints.length) * 100)
    : 0;

  const prefixStatusCounts = (ipamPrefixes || []).reduce<Record<string, number>>((acc, prefix) => {
    const status = prefix.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const totalAssignments = ipamPrefixes?.reduce((acc, prefix) => acc + (prefix.assignments || 0), 0);

  const sitesByStatus = (sites || []).reduce<Record<string, number>>((acc, site) => {
    const status = site.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const inventoryCategories: InventoryCategory[] = [
    {
      label: 'vCenter',
      count: vcenters?.length || 0,
      icon: Server,
      color: 'text-domain-vcenter',
      subItems: [
        { label: 'Datacenters', count: vcCounts.datacenters },
        { label: 'Clusters', count: vcCounts.clusters },
        { label: 'Hosts', count: vcCounts.hosts },
        { label: 'VMs', count: vcCounts.vms },
      ]
    },
    {
      label: 'Dell Servers',
      count: dellEndpoints?.length || 0,
      icon: HardDrive,
      color: 'text-domain-dell',
      subItems: [
        { label: 'iDRAC9', count: generationCounts['iDRAC9'] || 0 },
        { label: 'iDRAC8', count: generationCounts['iDRAC8'] || 0 },
        { label: 'iDRAC7', count: generationCounts['iDRAC7'] || 0 },
        { label: 'Mapped', count: mappedServers },
      ]
    },
    {
      label: 'IP Prefixes',
      count: ipamPrefixes?.length || 0,
      icon: Database,
      color: 'text-domain-ipam',
      subItems: [
        { label: 'Active', count: prefixStatusCounts['active'] || 0 },
        { label: 'Reserved', count: prefixStatusCounts['reserved'] || 0 },
        { label: 'Deprecated', count: prefixStatusCounts['deprecated'] || 0 },
        { label: 'Findings', count: ipamFindings?.length || 0 },
      ]
    },
    {
      label: 'Sites',
      count: sites?.length || 0,
      icon: Cpu,
      color: 'text-primary',
      subItems: [
        { label: 'Active', count: sitesByStatus['active'] || 0 },
        { label: 'Maintenance', count: sitesByStatus['maintenance'] || 0 },
        { label: 'Offline', count: sitesByStatus['offline'] || 0 },
        { label: 'Unknown', count: sitesByStatus['unknown'] || 0 },
      ]
    },
  ];

  const activeJobs = (jobs || []).filter((job) => ['running', 'pending', 'paused'].includes(job.status));

  const activityItems: ActivityItem[] = (jobs || [])
    .map((job) => {
      const timestamp = job.completedAt || job.startedAt || job.scheduledAt || '';
      return {
        sortValue: timestamp ? new Date(timestamp).getTime() : 0,
        item: {
          id: job.id,
          type: job.status === 'failed' ? 'error' : job.status === 'paused' ? 'warning' : job.status === 'completed' ? 'success' : 'info',
          domain: 'jobs' as const,
          message: job.name,
          timestamp: timestamp ? formatTimestamp(timestamp) : undefined,
          details: job.currentStepLabel || job.description,
        },
      };
    })
    .sort((a, b) => b.sortValue - a.sortValue)
    .slice(0, 5)
    .map((entry) => entry.item);

  const handleRefresh = () => {
    void Promise.all([
      refetchOverview(),
      refetchVcenters(),
      refetchDell(),
      refetchPrefixes(),
      refetchFindings(),
      refetchJobs(),
      refetchSites(),
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Dashboard" 
        subtitle="Enterprise Infrastructure Orchestrator"
        lastUpdated={formatTimestamp(overview?.lastSync || overview?.metrics.lastSync)}
        onRefresh={handleRefresh}
      />
      
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Hosts"
            value={overview?.metrics.totalHosts ?? '—'}
            subtitle={`Across ${vcenters?.length || 0} vCenters`}
            icon={<Server className="w-5 h-5" />}
            status="success"
          />
          <MetricCard
            title="Physical Servers"
            value={overview?.metrics.totalServers ?? '—'}
            subtitle="Dell PowerEdge"
            icon={<HardDrive className="w-5 h-5" />}
            status="info"
          />
          <MetricCard
            title="IP Assignments"
            value={totalAssignments ?? overview?.metrics.totalPrefixes ?? '—'}
            subtitle={`${overview?.metrics.totalPrefixes ?? ipamPrefixes?.length ?? 0} prefixes`}
            icon={<Network className="w-5 h-5" />}
          />
          <MetricCard
            title="Active Findings"
            value={ipamFindings?.length ?? overview?.metrics.criticalFindings ?? '—'}
            subtitle="Current open items"
            icon={<AlertTriangle className="w-5 h-5" />}
            status="warning"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Pending Approvals"
            value={overview?.metrics.pendingApprovals ?? '—'}
            subtitle="Requires approver action"
            icon={<Clock className="w-5 h-5" />}
            status="warning"
          />
          <MetricCard
            title="Active Jobs"
            value={overview?.metrics.activeJobs ?? activeJobs.length}
            subtitle="Running or waiting"
            icon={<CheckCircle2 className="w-5 h-5" />}
            status="info"
          />
          <MetricCard
            title="Mapping Coverage"
            value={`${mappingCoverage}%`}
            subtitle={`${mappedServers} of ${dellEndpoints?.length || 0} servers mapped`}
            icon={<Server className="w-5 h-5" />}
            status="info"
          />
        </div>

        {/* Inventory Overview */}
        <InventoryOverview 
          categories={inventoryCategories} 
          isLoading={vcenterLoading || dellLoading || ipamPrefixesLoading || ipamFindingsLoading || sitesLoading}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Activity & Health */}
          <div className="lg:col-span-2 space-y-6">
            <HealthGrid 
              items={overview?.health || []} 
              isLoading={overviewLoading}
            />
            <ActivityFeed items={activityItems} isLoading={jobsLoading} />
          </div>

          {/* Right Column - Jobs */}
          <div>
            <JobsQueue jobs={activeJobs} isLoading={jobsLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
