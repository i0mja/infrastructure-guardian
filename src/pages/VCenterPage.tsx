import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Server, RefreshCw, ChevronRight, Database, Cpu, HardDrive } from 'lucide-react';
import { useDashboardOverview, useVCenterInstances } from '@/hooks/api';

export default function VCenterPage() {
  const { data: overview } = useDashboardOverview();
  const { data: vcenters, isLoading, refetch } = useVCenterInstances();

  const totals = (vcenters || []).reduce((acc, vc) => {
    acc.datacenters += vc.counts.datacenters;
    acc.clusters += vc.counts.clusters;
    acc.hosts += vc.counts.hosts;
    acc.vms += vc.counts.vms;
    return acc;
  }, { datacenters: 0, clusters: 0, hosts: 0, vms: 0 });

  const handleRefresh = () => {
    void refetch();
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="vCenter Inventory" 
        subtitle="VMware vSphere infrastructure"
        lastUpdated={overview?.lastSync ? new Date(overview.lastSync).toLocaleString() : undefined}
        onRefresh={handleRefresh}
      />
      
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Server className="w-4 h-4 text-domain-vcenter" />
              <span className="text-sm">vCenters</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{vcenters?.length ?? '—'}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Database className="w-4 h-4" />
              <span className="text-sm">Datacenters</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {totals.datacenters}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Cpu className="w-4 h-4" />
              <span className="text-sm">Clusters</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {totals.clusters}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <HardDrive className="w-4 h-4" />
              <span className="text-sm">Total VMs</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {totals.vms.toLocaleString()}
            </p>
          </div>
        </div>

        {/* vCenter List */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">vCenter Instances</h3>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className="w-3 h-3" />
              Sync All
            </Button>
          </div>
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading vCenter instances…</div>
          ) : (
            <div className="divide-y divide-border">
              {vcenters?.map((vc) => (
                <div 
                  key={vc.id} 
                  className="p-4 hover:bg-accent/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-domain-vcenter/10 flex items-center justify-center">
                        <Server className="w-5 h-5 text-domain-vcenter" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground font-mono">
                            {vc.name}
                          </span>
                          <StatusBadge 
                            status={vc.status === 'connected' ? 'success' : 'error'} 
                            label={vc.status} 
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>v{vc.version}</span>
                          <span>•</span>
                          <span>{vc.siteId || 'Unassigned site'}</span>
                          <span>•</span>
                          <span>Last sync: {vc.lastSync ? new Date(vc.lastSync).toLocaleString() : '—'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-lg font-semibold text-foreground">{vc.counts.datacenters}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">DC</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">{vc.counts.clusters}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Clusters</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">{vc.counts.hosts}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Hosts</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">{vc.counts.vms.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">VMs</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
              {!vcenters?.length && (
                <div className="p-4 text-sm text-muted-foreground">No vCenter instances available.</div>
              )}
            </div>
          )}
        </div>

        {/* Placeholder for detailed views */}
        <div className="bg-card border border-border border-dashed rounded-lg p-8 text-center">
          <Server className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Select a vCenter</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Click on a vCenter instance above to view its datacenters, clusters, hosts, and VMs. 
            Use the PropertyCollector API for bulk inventory retrieval.
          </p>
        </div>
      </div>
    </div>
  );
}
