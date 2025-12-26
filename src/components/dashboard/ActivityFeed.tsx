import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Server, 
  HardDrive,
  RefreshCw,
  Play
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  domain: 'vcenter' | 'dell' | 'ipam' | 'jobs' | 'system';
  message: string;
  timestamp: string;
  details?: string;
}

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'success',
    domain: 'vcenter',
    message: 'vCenter sync completed',
    timestamp: '2 min ago',
    details: '1,247 VMs, 48 hosts synchronized'
  },
  {
    id: '2',
    type: 'warning',
    domain: 'dell',
    message: 'Firmware update available',
    timestamp: '15 min ago',
    details: '12 servers require BIOS update'
  },
  {
    id: '3',
    type: 'info',
    domain: 'jobs',
    message: 'Scheduled maintenance window',
    timestamp: '1 hour ago',
    details: 'Cluster-04 maintenance at 03:00 UTC'
  },
  {
    id: '4',
    type: 'error',
    domain: 'ipam',
    message: 'IP conflict detected',
    timestamp: '2 hours ago',
    details: '10.45.12.100 assigned to multiple hosts'
  },
  {
    id: '5',
    type: 'success',
    domain: 'jobs',
    message: 'Firmware update completed',
    timestamp: '3 hours ago',
    details: 'Server ESX-PROD-07 updated successfully'
  },
];

export function ActivityFeed() {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-status-success" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-status-warning" />;
      case 'error': return <XCircle className="w-4 h-4 text-status-error" />;
      default: return <Info className="w-4 h-4 text-status-info" />;
    }
  };

  const getDomainIcon = (domain: ActivityItem['domain']) => {
    switch (domain) {
      case 'vcenter': return <Server className="w-3 h-3" />;
      case 'dell': return <HardDrive className="w-3 h-3" />;
      case 'jobs': return <Play className="w-3 h-3" />;
      default: return <RefreshCw className="w-3 h-3" />;
    }
  };

  const getDomainColor = (domain: ActivityItem['domain']) => {
    switch (domain) {
      case 'vcenter': return 'text-domain-vcenter bg-domain-vcenter/10';
      case 'dell': return 'text-domain-dell bg-domain-dell/10';
      case 'jobs': return 'text-domain-jobs bg-domain-jobs/10';
      case 'ipam': return 'text-domain-ipam bg-domain-ipam/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
      </div>
      <div className="divide-y divide-border">
        {mockActivity.map((item) => (
          <div 
            key={item.id} 
            className="p-4 hover:bg-accent/30 transition-colors animate-fade-in"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getIcon(item.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
                    getDomainColor(item.domain)
                  )}>
                    {getDomainIcon(item.domain)}
                    {item.domain}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                </div>
                <p className="text-sm text-foreground">{item.message}</p>
                {item.details && (
                  <p className="text-xs text-muted-foreground mt-1">{item.details}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border">
        <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          View all activity →
        </button>
      </div>
    </div>
  );
}
