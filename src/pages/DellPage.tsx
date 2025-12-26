import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { HardDrive, RefreshCw, ChevronRight, AlertTriangle, CheckCircle2, Link2 } from 'lucide-react';

const mockIDRACs = [
  {
    id: 'idrac-1',
    hostname: 'idrac-prod-01.enterprise.local',
    ip: '10.45.12.101',
    generation: 'iDRAC9',
    serviceTag: 'ABC1234',
    model: 'PowerEdge R750',
    status: 'reachable' as const,
    firmwareVersion: '6.10.30.00',
    health: 'ok' as const,
    mapped: true,
    esxiHost: 'esx-prod-01.enterprise.local',
  },
  {
    id: 'idrac-2',
    hostname: 'idrac-prod-02.enterprise.local',
    ip: '10.45.12.102',
    generation: 'iDRAC9',
    serviceTag: 'ABC1235',
    model: 'PowerEdge R750',
    status: 'reachable' as const,
    firmwareVersion: '6.10.30.00',
    health: 'warning' as const,
    mapped: true,
    esxiHost: 'esx-prod-02.enterprise.local',
  },
  {
    id: 'idrac-3',
    hostname: 'idrac-prod-03.enterprise.local',
    ip: '10.45.12.103',
    generation: 'iDRAC8',
    serviceTag: 'DEF5678',
    model: 'PowerEdge R730',
    status: 'reachable' as const,
    firmwareVersion: '2.83.83.83',
    health: 'ok' as const,
    mapped: false,
    esxiHost: null,
  },
  {
    id: 'idrac-4',
    hostname: 'idrac-prod-04.enterprise.local',
    ip: '10.45.12.104',
    generation: 'iDRAC7',
    serviceTag: 'GHI9012',
    model: 'PowerEdge R620',
    status: 'unreachable' as const,
    firmwareVersion: '2.63.60.62',
    health: 'critical' as const,
    mapped: true,
    esxiHost: 'esx-legacy-04.enterprise.local',
  },
];

export default function DellPage() {
  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'ok':
        return <CheckCircle2 className="w-4 h-4 text-status-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-status-warning" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-status-error" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Dell iDRAC Inventory" 
        subtitle="Physical server management via Redfish"
        lastUpdated="5 min ago"
        onRefresh={() => console.log('Refresh')}
      />
      
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <HardDrive className="w-4 h-4 text-domain-dell" />
              <span className="text-sm">Total Servers</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{mockIDRACs.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span className="text-sm">Healthy</span>
            </div>
            <p className="text-2xl font-semibold text-status-success">
              {mockIDRACs.filter(i => i.health === 'ok').length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Link2 className="w-4 h-4" />
              <span className="text-sm">Mapped to ESXi</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {mockIDRACs.filter(i => i.mapped).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              <span className="text-sm">Needs Attention</span>
            </div>
            <p className="text-2xl font-semibold text-status-warning">
              {mockIDRACs.filter(i => i.health !== 'ok' || i.status !== 'reachable').length}
            </p>
          </div>
        </div>

        {/* Generation Breakdown */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">iDRAC Generations</h3>
          <div className="flex gap-4">
            {['iDRAC9', 'iDRAC8', 'iDRAC7'].map((gen) => {
              const count = mockIDRACs.filter(i => i.generation === gen).length;
              const percentage = (count / mockIDRACs.length) * 100;
              return (
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
              );
            })}
          </div>
        </div>

        {/* Server List */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">iDRAC Endpoints</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-3 h-3" />
              Discover
            </Button>
          </div>
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
              {mockIDRACs.map((idrac) => (
                <tr key={idrac.id} className="group cursor-pointer">
                  <td>
                    <div>
                      <p className="text-sm font-medium text-foreground font-mono">{idrac.hostname}</p>
                      <p className="text-xs text-muted-foreground">{idrac.ip} • {idrac.serviceTag}</p>
                    </div>
                  </td>
                  <td>
                    <span className="px-2 py-1 text-xs font-medium bg-domain-dell/10 text-domain-dell rounded">
                      {idrac.generation}
                    </span>
                  </td>
                  <td className="text-sm text-muted-foreground">{idrac.model}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {getHealthIcon(idrac.health)}
                      <span className="text-sm capitalize">{idrac.health}</span>
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
                    {idrac.mapped ? (
                      <span className="text-xs text-muted-foreground font-mono">{idrac.esxiHost}</span>
                    ) : (
                      <span className="text-xs text-status-warning">Unmapped</span>
                    )}
                  </td>
                  <td>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
