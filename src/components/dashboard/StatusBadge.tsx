import { cn } from '@/lib/utils';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'neutral';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, pulse = false, size = 'md' }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'success':
        return 'bg-status-success/10 text-status-success border-status-success/20';
      case 'warning':
        return 'bg-status-warning/10 text-status-warning border-status-warning/20';
      case 'error':
        return 'bg-status-error/10 text-status-error border-status-error/20';
      case 'info':
        return 'bg-status-info/10 text-status-info border-status-info/20';
      case 'pending':
        return 'bg-status-pending/10 text-status-pending border-status-pending/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'success': return 'bg-status-success';
      case 'warning': return 'bg-status-warning';
      case 'error': return 'bg-status-error';
      case 'info': return 'bg-status-info';
      case 'pending': return 'bg-status-pending';
      default: return 'bg-muted-foreground';
    }
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 border rounded-full font-medium",
      getStatusStyles(),
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        getDotColor(),
        pulse && "animate-pulse"
      )} />
      {label}
    </span>
  );
}
