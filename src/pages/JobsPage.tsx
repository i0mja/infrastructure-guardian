import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Plus,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mockJobs = [
  {
    id: 'job-001',
    name: 'Firmware Update - Cluster-04',
    type: 'firmware_update',
    status: 'running' as const,
    progress: 45,
    site: 'US-EAST-01',
    targetCount: 8,
    currentStep: 'Updating BIOS on server 4 of 8',
    createdBy: 'admin@enterprise.local',
    startedAt: '2024-01-15 14:30:00',
    policy: { allowVmShutdown: false, requireApproval: true },
  },
  {
    id: 'job-002',
    name: 'Maintenance Mode - ESX-PROD-12',
    type: 'maintenance_mode',
    status: 'paused' as const,
    progress: 60,
    site: 'EU-WEST-02',
    targetCount: 1,
    currentStep: 'DRS evacuation blocked - 3 VMs cannot migrate',
    createdBy: 'operator@enterprise.local',
    startedAt: '2024-01-15 13:45:00',
    policy: { allowVmShutdown: true, requireApproval: true },
  },
  {
    id: 'job-003',
    name: 'Inventory Sync - All Sites',
    type: 'inventory_sync',
    status: 'pending' as const,
    progress: 0,
    site: 'GLOBAL',
    targetCount: 3,
    currentStep: 'Scheduled for 03:00 UTC',
    createdBy: 'system',
    scheduledAt: '2024-01-16 03:00:00',
    policy: { allowVmShutdown: false, requireApproval: false },
  },
  {
    id: 'job-004',
    name: 'BIOS Update - DR Cluster',
    type: 'firmware_update',
    status: 'completed' as const,
    progress: 100,
    site: 'US-WEST-03',
    targetCount: 4,
    currentStep: 'Completed successfully',
    createdBy: 'admin@enterprise.local',
    startedAt: '2024-01-15 08:00:00',
    completedAt: '2024-01-15 10:30:00',
    policy: { allowVmShutdown: false, requireApproval: true },
  },
  {
    id: 'job-005',
    name: 'Power Cycle - Storage Servers',
    type: 'power_cycle',
    status: 'failed' as const,
    progress: 25,
    site: 'EU-WEST-02',
    targetCount: 2,
    currentStep: 'Failed: iDRAC unreachable',
    createdBy: 'operator@enterprise.local',
    startedAt: '2024-01-15 11:00:00',
    completedAt: '2024-01-15 11:15:00',
    policy: { allowVmShutdown: true, requireApproval: true },
  },
];

export default function JobsPage() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-status-info" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-status-warning" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-status-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-status-error" />;
      default:
        return null;
    }
  };

  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case 'running': return 'info';
      case 'paused': return 'warning';
      case 'pending': return 'neutral';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'neutral';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Jobs & Orchestration" 
        subtitle="Resumable state machines with explicit approvals"
        lastUpdated="1 min ago"
        onRefresh={() => console.log('Refresh')}
      />
      
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Play className="w-4 h-4 text-status-info" />
              <span className="text-sm">Running</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {mockJobs.filter(j => j.status === 'running').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Pause className="w-4 h-4 text-status-warning" />
              <span className="text-sm">Paused</span>
            </div>
            <p className="text-2xl font-semibold text-status-warning">
              {mockJobs.filter(j => j.status === 'paused').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Pending</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {mockJobs.filter(j => j.status === 'pending').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span className="text-sm">Completed</span>
            </div>
            <p className="text-2xl font-semibold text-status-success">
              {mockJobs.filter(j => j.status === 'completed').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <XCircle className="w-4 h-4 text-status-error" />
              <span className="text-sm">Failed</span>
            </div>
            <p className="text-2xl font-semibold text-status-error">
              {mockJobs.filter(j => j.status === 'failed').length}
            </p>
          </div>
        </div>

        {/* Paused Jobs Alert */}
        {mockJobs.some(j => j.status === 'paused') && (
          <div className="bg-status-warning/10 border border-status-warning/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Jobs Require Attention</p>
              <p className="text-sm text-muted-foreground mt-1">
                {mockJobs.filter(j => j.status === 'paused').length} job(s) are paused and waiting for operator decision.
                DRS evacuation may be blocked by VMs that cannot be migrated.
              </p>
            </div>
          </div>
        )}

        {/* Jobs List */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">All Jobs</h3>
            <Button size="sm" className="gap-2">
              <Plus className="w-3 h-3" />
              New Job
            </Button>
          </div>
          <div className="divide-y divide-border">
            {mockJobs.map((job) => (
              <div 
                key={job.id} 
                className="p-4 hover:bg-accent/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(job.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{job.name}</span>
                      <StatusBadge 
                        status={getStatusBadgeType(job.status) as any}
                        label={job.status}
                        size="sm"
                        pulse={job.status === 'running'}
                      />
                      {job.policy.requireApproval && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                          APPROVAL REQ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{job.currentStep}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{job.site}</span>
                      <span>•</span>
                      <span>{job.targetCount} target(s)</span>
                      <span>•</span>
                      <span>{job.createdBy}</span>
                      {job.startedAt && (
                        <>
                          <span>•</span>
                          <span>Started: {job.startedAt}</span>
                        </>
                      )}
                    </div>
                    {job.progress > 0 && job.status !== 'completed' && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 bg-muted rounded-full h-1.5 max-w-xs">
                          <div 
                            className={cn(
                              "h-1.5 rounded-full transition-all",
                              job.status === 'running' ? 'bg-status-info' :
                              job.status === 'paused' ? 'bg-status-warning' :
                              job.status === 'failed' ? 'bg-status-error' : 'bg-muted-foreground'
                            )}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{job.progress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{job.id}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
