import { StatusBadge } from './StatusBadge';
import { Play, Pause, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JobSummary } from '@/lib/api';

type QueuedJob = JobSummary & {
  status: 'running' | 'pending' | 'paused' | 'completed';
};

interface JobsQueueProps {
  jobs?: JobSummary[];
  isLoading?: boolean;
}

export function JobsQueue({ jobs = [], isLoading = false }: JobsQueueProps) {
  const getStatusBadge = (status: QueuedJob['status']) => {
    switch (status) {
      case 'running':
        return <StatusBadge status="info" label="Running" pulse />;
      case 'pending':
        return <StatusBadge status="neutral" label="Pending" />;
      case 'paused':
        return <StatusBadge status="warning" label="Paused" />;
      case 'completed':
        return <StatusBadge status="success" label="Completed" />;
    }
  };

  const getStatusIcon = (status: QueuedJob['status']) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-status-info" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-status-warning" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-status-success" />;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Active Jobs</h3>
        <span className="text-xs text-muted-foreground">{jobs.length} jobs</span>
      </div>
      {isLoading ? (
        <div className="p-4 text-sm text-muted-foreground">Loading jobs…</div>
      ) : (
        <>
          <div className="divide-y divide-border">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 hover:bg-accent/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getStatusIcon(job.status as QueuedJob['status'])}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground truncate">
                        {job.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(job.status as QueuedJob['status'])}
                      {job.siteId && (
                        <span className="text-xs text-muted-foreground">{job.siteId}</span>
                      )}
                      {job.scheduledAt && (
                        <span className="text-xs text-muted-foreground">
                          • Scheduled: {new Date(job.scheduledAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {job.progress !== undefined && (
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            job.status === 'running' ? 'bg-status-info' : 'bg-status-warning'
                          )}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{job.id}</span>
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">No active jobs.</div>
            )}
          </div>
          <div className="p-3 border-t border-border">
            <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
              View all jobs →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
