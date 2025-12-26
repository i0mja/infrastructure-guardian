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
import { useDashboardOverview, useJobs } from '@/hooks/api';

export default function JobsPage() {
  const { data: overview } = useDashboardOverview();
  const { data: jobs, isLoading, refetch } = useJobs();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-status-info" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-status-warning" />;
      case 'pending':
      case 'scheduled':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-status-success" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-status-error" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeType = (status: string): 'success' | 'warning' | 'error' | 'info' | 'pending' | 'neutral' => {
    switch (status) {
      case 'running': return 'info';
      case 'paused': return 'warning';
      case 'pending': 
      case 'scheduled': return 'neutral';
      case 'completed': return 'success';
      case 'failed': 
      case 'cancelled': return 'error';
      default: return 'neutral';
    }
  };

  const countByStatus = (status: string) => (jobs || []).filter((job) => job.status === status).length;
  const pausedJobs = countByStatus('paused');

  const handleRefresh = () => {
    void refetch();
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Jobs & Orchestration" 
        subtitle="Resumable state machines with explicit approvals"
        lastUpdated={overview?.lastSync ? new Date(overview.lastSync).toLocaleString() : undefined}
        onRefresh={handleRefresh}
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
              {countByStatus('running')}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Pause className="w-4 h-4 text-status-warning" />
              <span className="text-sm">Paused</span>
            </div>
            <p className="text-2xl font-semibold text-status-warning">
              {pausedJobs}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Pending</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {countByStatus('pending') + countByStatus('scheduled')}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span className="text-sm">Completed</span>
            </div>
            <p className="text-2xl font-semibold text-status-success">
              {countByStatus('completed')}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <XCircle className="w-4 h-4 text-status-error" />
              <span className="text-sm">Failed</span>
            </div>
            <p className="text-2xl font-semibold text-status-error">
              {countByStatus('failed') + countByStatus('cancelled')}
            </p>
          </div>
        </div>

        {/* Paused Jobs Alert */}
        {pausedJobs > 0 && (
          <div className="bg-status-warning/10 border border-status-warning/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Jobs Require Attention</p>
              <p className="text-sm text-muted-foreground mt-1">
                {pausedJobs} job(s) are paused and waiting for operator decision.
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
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading jobs…</div>
          ) : (
            <div className="divide-y divide-border">
              {(jobs || []).map((job) => (
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
                          status={getStatusBadgeType(job.status)}
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
                      <p className="text-xs text-muted-foreground mb-2">
                        {job.currentStepLabel || `Step ${job.currentStep} of ${job.totalSteps || 'N/A'}`}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{job.siteId || 'GLOBAL'}</span>
                        <span>•</span>
                        <span>{job.targetIds.length} target(s)</span>
                        <span>•</span>
                        <span>{job.createdBy}</span>
                        {job.startedAt && (
                          <>
                            <span>•</span>
                            <span>Started: {new Date(job.startedAt).toLocaleString()}</span>
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
              {!jobs?.length && (
                <div className="p-4 text-sm text-muted-foreground">No jobs available.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
