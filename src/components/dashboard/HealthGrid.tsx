import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { HealthItem } from '@/lib/api';

interface HealthGridProps {
  items?: HealthItem[];
  isLoading?: boolean;
}

export function HealthGrid({ items = [], isLoading = false }: HealthGridProps) {
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
      {isLoading ? (
        <div className="p-4 text-sm text-muted-foreground">Loading health checks…</div>
      ) : (
        <div className="p-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <div 
              key={item.component}
              className={cn(
                "p-3 rounded-lg border transition-colors cursor-default",
                getStatusBg(item.status)
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(item.status)}
                <span className="text-sm font-medium text-foreground">{item.component}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {item.message || (item.lastCheck ? `Checked ${item.lastCheck}` : 'No recent check recorded')}
              </p>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-sm text-muted-foreground">
              No health data available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
