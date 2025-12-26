import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Network, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const mockPrefixes = [
  {
    id: 'prefix-1',
    cidr: '10.45.0.0/16',
    description: 'Production Network - US East',
    site: 'US-EAST-01',
    vlan: 100,
    utilization: 67,
    status: 'active' as const,
    assignments: 847,
  },
  {
    id: 'prefix-2',
    cidr: '10.46.0.0/16',
    description: 'Production Network - EU West',
    site: 'EU-WEST-02',
    vlan: 200,
    utilization: 45,
    status: 'active' as const,
    assignments: 512,
  },
  {
    id: 'prefix-3',
    cidr: '10.47.0.0/16',
    description: 'DR Network - US West',
    site: 'US-WEST-03',
    vlan: 300,
    utilization: 23,
    status: 'active' as const,
    assignments: 234,
  },
  {
    id: 'prefix-4',
    cidr: '192.168.100.0/24',
    description: 'Management Network',
    site: 'GLOBAL',
    vlan: 1000,
    utilization: 82,
    status: 'active' as const,
    assignments: 198,
  },
];

const mockFindings = [
  {
    id: 'finding-1',
    type: 'duplicate_usage',
    severity: 'error' as const,
    address: '10.45.12.100',
    description: 'IP assigned to multiple hosts',
    detectedAt: '2 hours ago',
  },
  {
    id: 'finding-2',
    type: 'seen_not_planned',
    severity: 'warning' as const,
    address: '10.45.15.55',
    description: 'Active IP not in assignment records',
    detectedAt: '4 hours ago',
  },
  {
    id: 'finding-3',
    type: 'stale_usage',
    severity: 'info' as const,
    address: '10.46.8.12',
    description: 'Assignment not seen in 30+ days',
    detectedAt: '1 day ago',
  },
];

export default function IPAMPage() {
  const getUtilizationColor = (util: number) => {
    if (util >= 80) return 'bg-status-error';
    if (util >= 60) return 'bg-status-warning';
    return 'bg-status-success';
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="IP Address Management" 
        subtitle="Authoritative IPAM with evidence layer"
        lastUpdated="10 min ago"
        onRefresh={() => console.log('Refresh')}
      />
      
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Network className="w-4 h-4 text-domain-ipam" />
              <span className="text-sm">Prefixes</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{mockPrefixes.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span className="text-sm">Assignments</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {mockPrefixes.reduce((acc, p) => acc + p.assignments, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              <span className="text-sm">Active Findings</span>
            </div>
            <p className="text-2xl font-semibold text-status-warning">{mockFindings.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <span className="text-sm">Avg Utilization</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {Math.round(mockPrefixes.reduce((acc, p) => acc + p.utilization, 0) / mockPrefixes.length)}%
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search IPs, prefixes, hostnames... (supports CIDR notation)" 
            className="pl-9 bg-card border-border"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prefix List */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">IP Prefixes</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Prefix</th>
                  <th>Description</th>
                  <th>Site</th>
                  <th>VLAN</th>
                  <th>Utilization</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockPrefixes.map((prefix) => (
                  <tr key={prefix.id} className="cursor-pointer">
                    <td>
                      <span className="font-mono text-sm text-foreground">{prefix.cidr}</span>
                    </td>
                    <td className="text-sm text-muted-foreground">{prefix.description}</td>
                    <td className="text-sm text-muted-foreground">{prefix.site}</td>
                    <td className="text-sm font-mono text-muted-foreground">{prefix.vlan}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${getUtilizationColor(prefix.utilization)}`}
                            style={{ width: `${prefix.utilization}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{prefix.utilization}%</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status="success" label={prefix.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Findings */}
          <div className="bg-card border border-border rounded-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">IPAM Findings</h3>
              <StatusBadge status="warning" label={`${mockFindings.length} active`} size="sm" />
            </div>
            <div className="divide-y divide-border">
              {mockFindings.map((finding) => (
                <div key={finding.id} className="p-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                      finding.severity === 'error' ? 'text-status-error' :
                      finding.severity === 'warning' ? 'text-status-warning' : 'text-status-info'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-foreground">{finding.address}</span>
                        <StatusBadge 
                          status={finding.severity === 'error' ? 'error' : finding.severity === 'warning' ? 'warning' : 'info'}
                          label={finding.type.replace('_', ' ')}
                          size="sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{finding.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Detected {finding.detectedAt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
