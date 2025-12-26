import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { HardDrive, RefreshCw, ChevronRight, AlertTriangle, CheckCircle2, Link2 } from 'lucide-react';
import { useDashboardOverview, useDellEndpoints } from '@/hooks/api';

export default function DellPage() {
  const { data: overview } = useDashboardOverview();
  const { data: endpoints, isLoading, refetch } = useDellEndpoints();

  const mapped = endpoints?.filter((endpoint) => endpoint.mappedHost).length || 0;
  const needsAttention = endpoints?.filter((endpoint) => endpoint.health && endpoint.health !== 'ok' || endpoint.status !== 'reachable').length || 0;
  const healthCounts = endpoints?.reduce<Record<string, number>>((acc, endpoint) => {
    const health = endpoint.health || 'unknown';
    acc[health] = (acc[health] || 0) + 1;
    return acc;
  }, {}) || {};

  const generationBreakdown = ['iDRAC9', 'iDRAC8', 'iDRAC7'].map((gen) => {
    const count = endpoints?.filter((endpoint) => endpoint.generation === gen).length || 0;
    const percentage = endpoints && endpoints.length > 0 ? (count / endpoints.length) * 100 : 0;
    return { gen, count, percentage };
  });

  const getHealthIcon = (health?: string) => {
    switch (health) {
      case 'ok':
        return <CheckCircle2 className="w-4 h-4 text-status-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-status-warning" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-status-error" />;
    }
  };

  const handleRefresh = () => {
    void refetch();
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Dell iDRAC Inventory" 
        subtitle="Physical server management via Redfish"
        lastUpdated={overview?.lastSync ? new Date(overview.lastSync).toLocaleString() : undefined}
        onRefresh={handleRefresh}
      />
      
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <HardDrive className="w-4 h-4 text-domain-dell" />
              <span className="text-sm">Total Servers</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{endpoints?.length ?? '—'}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span className="text-sm">Healthy</span>
            </div>
            <p className="text-2xl font-semibold text-status-success">
              {healthCounts['ok'] || 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Link2 className="w-4 h-4" />
              <span className="text-sm">Mapped to ESXi</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {mapped}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              <span className="text-sm">Needs Attention</span>
            </div>
            <p className="text-2xl font-semibold text-status-warning">
              {needsAttention}
            </p>
          </div>
        </div>

        {/* Generation Breakdown */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">iDRAC Generations</h3>
          <div className="flex gap-4">
            {generationBreakdown.map(({ gen, count, percentage }) => (
              <div key={gen} className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{gen}</span>
                  <span className="text-sm font-medium text-foreground">{count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-domain-dell h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Server List */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">iDRAC Endpoints</h3>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className="w-3 h-3" />
              Discover
            </Button>
          </div>
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading iDRAC endpoints…</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Server</th>
                  <th>Generation</th>
                  <th>Model</th>
                  <th>Health</th>
                  <th>Status</th>
                  <th>ESXi Mapping</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {endpoints?.map((idrac) => (
                  <tr key={idrac.id} className="group cursor-pointer">
                    <td>
                      <div>
                        <p className="text-sm font-medium text-foreground font-mono">{idrac.hostname}</p>
                        <p className="text-xs text-muted-foreground">{idrac.ipAddress} {idrac.serviceTag ? `• ${idrac.serviceTag}` : ''}</p>
                      </div>
                    </td>
                    <td>
                      <span className="px-2 py-1 text-xs font-medium bg-domain-dell/10 text-domain-dell rounded">
                        {idrac.generation}
                      </span>
                    </td>
                    <td className="text-sm text-muted-foreground">{idrac.model || '—'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getHealthIcon(idrac.health)}
                        <span className="text-sm capitalize">{idrac.health || 'unknown'}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge 
                        status={idrac.status === 'reachable' ? 'success' : 'error'} 
                        label={idrac.status}
                        size="sm"
                      />
                    </td>
                    <td>
                      {idrac.mappedHost ? (
                        <span className="text-xs text-muted-foreground font-mono">{idrac.mappedHost}</span>
                      ) : (
                        <span className="text-xs text-status-warning">Unmapped</span>
                      )}
                    </td>
                    <td>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </td>
                  </tr>
                ))}
                {!endpoints?.length && (
                  <tr>
                    <td colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                      No endpoints discovered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
