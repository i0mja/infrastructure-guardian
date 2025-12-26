import { Server, HardDrive, Cpu, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryCategory {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  subItems: { label: string; count: number }[];
}

const inventoryData: InventoryCategory[] = [
  {
    label: 'vCenter',
    count: 3,
    icon: Server,
    color: 'text-domain-vcenter',
    subItems: [
      { label: 'Datacenters', count: 8 },
      { label: 'Clusters', count: 24 },
      { label: 'Hosts', count: 156 },
      { label: 'VMs', count: 2847 },
    ]
  },
  {
    label: 'Dell Servers',
    count: 189,
    icon: HardDrive,
    color: 'text-domain-dell',
    subItems: [
      { label: 'iDRAC9', count: 124 },
      { label: 'iDRAC8', count: 52 },
      { label: 'iDRAC7', count: 13 },
      { label: 'Mapped', count: 156 },
    ]
  },
  {
    label: 'IP Prefixes',
    count: 847,
    icon: Database,
    color: 'text-domain-ipam',
    subItems: [
      { label: 'Active', count: 812 },
      { label: 'Reserved', count: 28 },
      { label: 'Deprecated', count: 7 },
      { label: 'Findings', count: 14 },
    ]
  },
  {
    label: 'Sites',
    count: 12,
    icon: Cpu,
    color: 'text-primary',
    subItems: [
      { label: 'Active', count: 11 },
      { label: 'Maintenance', count: 1 },
      { label: 'Regions', count: 4 },
      { label: 'Countries', count: 8 },
    ]
  },
];

export function InventoryOverview() {
  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Inventory Overview</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
        {inventoryData.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.label} className="p-4 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={cn("w-4 h-4", category.color)} />
                <span className="text-sm font-medium text-foreground">{category.label}</span>
              </div>
              <p className={cn("text-2xl font-semibold mb-3", category.color)}>
                {category.count.toLocaleString()}
              </p>
              <div className="space-y-1.5">
                {category.subItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono text-foreground">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
