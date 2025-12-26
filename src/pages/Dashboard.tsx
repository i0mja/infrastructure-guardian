import { Header } from '@/components/layout/Header';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { HealthGrid } from '@/components/dashboard/HealthGrid';
import { JobsQueue } from '@/components/dashboard/JobsQueue';
import { InventoryOverview } from '@/components/dashboard/InventoryOverview';
import { 
  Server, 
  HardDrive, 
  Network, 
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Dashboard" 
        subtitle="Enterprise Infrastructure Orchestrator"
        lastUpdated="2 min ago"
        onRefresh={() => console.log('Refresh')}
      />
      
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Hosts"
            value="156"
            subtitle="Across 3 vCenters"
            icon={<Server className="w-5 h-5" />}
            trend={{ value: 2.5, direction: 'up', label: 'vs last week' }}
            status="success"
          />
          <MetricCard
            title="Physical Servers"
            value="189"
            subtitle="Dell PowerEdge"
            icon={<HardDrive className="w-5 h-5" />}
            trend={{ value: 0, direction: 'neutral', label: 'no change' }}
            status="info"
          />
          <MetricCard
            title="IP Assignments"
            value="12,847"
            subtitle="847 prefixes"
            icon={<Network className="w-5 h-5" />}
            trend={{ value: 1.2, direction: 'up', label: 'new allocations' }}
          />
          <MetricCard
            title="Active Findings"
            value="14"
            subtitle="3 critical, 11 warning"
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={{ value: 4, direction: 'down', label: 'resolved' }}
            status="warning"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Pending Approvals"
            value="5"
            subtitle="Requires approver action"
            icon={<Clock className="w-5 h-5" />}
            status="warning"
          />
          <MetricCard
            title="Firmware Compliance"
            value="94%"
            subtitle="11 servers need updates"
            icon={<CheckCircle2 className="w-5 h-5" />}
            status="success"
          />
          <MetricCard
            title="Mapping Coverage"
            value="82%"
            subtitle="156 of 189 servers mapped"
            icon={<Server className="w-5 h-5" />}
            status="info"
          />
        </div>

        {/* Inventory Overview */}
        <InventoryOverview />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Activity & Health */}
          <div className="lg:col-span-2 space-y-6">
            <HealthGrid />
            <ActivityFeed />
          </div>

          {/* Right Column - Jobs */}
          <div>
            <JobsQueue />
          </div>
        </div>
      </div>
    </div>
  );
}
