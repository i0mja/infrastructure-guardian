import { cn } from '@/lib/utils';

export interface InventoryCategory {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  subItems: { label: string; count: number }[];
}

interface InventoryOverviewProps {
  categories: InventoryCategory[];
  isLoading?: boolean;
}

export function InventoryOverview({ categories, isLoading = false }: InventoryOverviewProps) {
  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Inventory Overview</h3>
      </div>
      {isLoading ? (
        <div className="p-4 text-sm text-muted-foreground">Loading inventory overview…</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
          {categories.map((category) => {
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
          {categories.length === 0 && (
            <div className="col-span-full p-4 text-sm text-muted-foreground">
              No inventory data available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
