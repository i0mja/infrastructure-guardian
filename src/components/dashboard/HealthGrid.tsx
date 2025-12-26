import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface HealthItem {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: string;
  message?: string;
}

const healthItems: HealthItem[] = [
  { name: 'vCenter API', status: 'healthy', lastCheck: '< 1 min' },
  { name: 'iDRAC Endpoints', status: 'healthy', lastCheck: '< 1 min' },
  { name: 'Database', status: 'healthy', lastCheck: '< 1 min' },
  { name: 'Worker Pool', status: 'healthy', lastCheck: '< 1 min' },
  { name: 'Job Queue', status: 'degraded', lastCheck: '2 min', message: '3 jobs queued' },
  { name: 'Report Generator', status: 'healthy', lastCheck: '< 1 min' },
];

export function HealthGrid() {
  const getStatusIcon = (status: HealthItem['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-4 h-4 text-status-success" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-status-warning" />;
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-status-error" />;
    }
  };

  const getStatusBg = (status: HealthItem['status']) => {
    switch (status) {
      case 'healthy': return 'bg-status-success/5 border-status-success/20 hover:border-status-success/40';
      case 'degraded': return 'bg-status-warning/5 border-status-warning/20 hover:border-status-warning/40';
      case 'unhealthy': return 'bg-status-error/5 border-status-error/20 hover:border-status-error/40';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">System Health</h3>
      </div>
      <div className="p-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
        {healthItems.map((item) => (
          <div 
            key={item.name}
            className={cn(
              "p-3 rounded-lg border transition-colors cursor-default",
              getStatusBg(item.status)
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(item.status)}
              <span className="text-sm font-medium text-foreground">{item.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {item.message || `Checked ${item.lastCheck}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
