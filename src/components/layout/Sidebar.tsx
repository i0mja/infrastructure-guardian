import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Server, 
  HardDrive, 
  Network, 
  Play, 
  FileText, 
  Settings, 
  Users, 
  ChevronLeft,
  ChevronRight,
  Activity,
  Shield,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  domain?: 'vcenter' | 'dell' | 'ipam' | 'jobs' | 'reports';
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'vCenter', icon: Server, href: '/vcenter', domain: 'vcenter' },
  { label: 'Dell iDRAC', icon: HardDrive, href: '/dell', domain: 'dell' },
  { label: 'IPAM', icon: Network, href: '/ipam', domain: 'ipam' },
  { label: 'Jobs', icon: Play, href: '/jobs', badge: 3, domain: 'jobs' },
  { label: 'Reports', icon: FileText, href: '/reports', domain: 'reports' },
];

const secondaryNavItems: NavItem[] = [
  { label: 'Sites', icon: MapPin, href: '/sites' },
  { label: 'Users & RBAC', icon: Users, href: '/users' },
  { label: 'Service Identities', icon: Shield, href: '/service-identities' },
  { label: 'System Health', icon: Activity, href: '/health' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const getDomainColor = (domain?: string) => {
    switch (domain) {
      case 'vcenter': return 'text-domain-vcenter';
      case 'dell': return 'text-domain-dell';
      case 'ipam': return 'text-domain-ipam';
      case 'jobs': return 'text-domain-jobs';
      case 'reports': return 'text-domain-reports';
      default: return 'text-sidebar-foreground';
    }
  };

  const getDomainBg = (domain?: string) => {
    switch (domain) {
      case 'vcenter': return 'bg-domain-vcenter/10';
      case 'dell': return 'bg-domain-dell/10';
      case 'ipam': return 'bg-domain-ipam/10';
      case 'jobs': return 'bg-domain-jobs/10';
      case 'reports': return 'bg-domain-reports/10';
      default: return 'bg-sidebar-accent';
    }
  };

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Server className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-sidebar-accent-foreground">EIO</h1>
              <p className="text-[10px] text-muted-foreground">v2.0</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Domains
          </p>
        )}
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? cn("bg-sidebar-accent", getDomainBg(item.domain))
                  : "hover:bg-sidebar-accent/50",
                collapsed && "justify-center"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  isActive ? getDomainColor(item.domain) : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                )} 
              />
              {!collapsed && (
                <>
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                  )}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-status-warning text-status-warning-foreground rounded">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-medium bg-status-warning text-status-warning-foreground rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="my-4 border-t border-sidebar-border" />

        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            System
          </p>
        )}
        {secondaryNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "p-4 border-t border-sidebar-border",
        collapsed && "flex justify-center"
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">admin@enterprise.local</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">AD</span>
          </div>
        )}
      </div>
    </aside>
  );
}
