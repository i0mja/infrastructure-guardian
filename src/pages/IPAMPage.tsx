import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Network, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDashboardOverview, useIpamFindings, useIpamPrefixes } from '@/hooks/api';

export default function IPAMPage() {
  const { data: overview } = useDashboardOverview();
  const { data: prefixes, isLoading: prefixesLoading, refetch: refetchPrefixes } = useIpamPrefixes();
  const { data: findings, isLoading: findingsLoading, refetch: refetchFindings } = useIpamFindings();
  const [searchQuery, setSearchQuery] = useState('');

  const getUtilizationColor = (util?: number) => {
    if (util === undefined || util === null) return 'bg-muted-foreground';
    if (util >= 80) return 'bg-status-error';
    if (util >= 60) return 'bg-status-warning';
    return 'bg-status-success';
  };

  const filteredPrefixes = useMemo(() => {
    if (!prefixes) return [];
    if (!searchQuery) return prefixes;
    return prefixes.filter((prefix) =>
      prefix.cidr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prefix.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prefix.siteId || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [prefixes, searchQuery]);

  const totalAssignments = prefixes?.reduce((acc, prefix) => acc + (prefix.assignments || 0), 0) ?? 0;
  const averageUtilization = prefixes && prefixes.length > 0
    ? Math.round(prefixes.reduce((acc, prefix) => acc + (prefix.utilization || 0), 0) / prefixes.length)
    : 0;

  const handleRefresh = () => {
    void Promise.all([refetchPrefixes(), refetchFindings()]);
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="IP Address Management" 
        subtitle="Authoritative IPAM with evidence layer"
        lastUpdated={overview?.lastSync ? new Date(overview.lastSync).toLocaleString() : undefined}
        onRefresh={handleRefresh}
      />
      
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Network className="w-4 h-4 text-domain-ipam" />
              <span className="text-sm">Prefixes</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{prefixes?.length ?? '—'}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span className="text-sm">Assignments</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {totalAssignments.toLocaleString()}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              <span className="text-sm">Active Findings</span>
            </div>
            <p className="text-2xl font-semibold text-status-warning">{findings?.length ?? 0}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <span className="text-sm">Avg Utilization</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {averageUtilization}%
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search IPs, prefixes, hostnames... (supports CIDR notation)" 
            className="pl-9 bg-card border-border"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prefix List */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">IP Prefixes</h3>
              <span className="text-xs text-muted-foreground">{filteredPrefixes.length} records</span>
            </div>
            {prefixesLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading prefixes…</div>
            ) : (
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
                  {filteredPrefixes.map((prefix) => (
                    <tr key={prefix.id} className="cursor-pointer">
                      <td>
                        <span className="font-mono text-sm text-foreground">{prefix.cidr}</span>
                      </td>
                      <td className="text-sm text-muted-foreground">{prefix.description || '—'}</td>
                      <td className="text-sm text-muted-foreground">{prefix.siteId || '—'}</td>
                      <td className="text-sm font-mono text-muted-foreground">{prefix.vlanId ?? '—'}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${getUtilizationColor(prefix.utilization)}`}
                              style={{ width: `${prefix.utilization ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{prefix.utilization ?? 0}%</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge 
                          status={prefix.status === 'active' ? 'success' : prefix.status === 'reserved' ? 'info' : 'warning'} 
                          label={prefix.status || 'unknown'} 
                          size="sm" 
                        />
                      </td>
                    </tr>
                  ))}
                  {!filteredPrefixes.length && (
                    <tr>
                      <td colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                        No prefixes match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Findings */}
          <div className="bg-card border border-border rounded-lg">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">IPAM Findings</h3>
              <StatusBadge status="warning" label={`${findings?.length ?? 0} active`} size="sm" />
            </div>
            {findingsLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading findings…</div>
            ) : (
              <div className="divide-y divide-border">
                {findings?.map((finding) => (
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
                        <p className="text-xs text-muted-foreground">{finding.description || 'No description provided'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Detected {finding.detectedAt ? new Date(finding.detectedAt).toLocaleString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {!findings?.length && (
                  <div className="p-4 text-sm text-muted-foreground">No active findings.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
