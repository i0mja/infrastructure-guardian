import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock,
  CheckCircle2,
  Play,
  Plus
} from 'lucide-react';
import { useDashboardOverview, useReportDefinitions, useReportExecutions } from '@/hooks/api';

export default function ReportsPage() {
  const { data: overview } = useDashboardOverview();
  const { data: definitions, isLoading: definitionsLoading, refetch: refetchDefinitions } = useReportDefinitions();
  const { data: executions, isLoading: executionsLoading, refetch: refetchExecutions } = useReportExecutions();

  const formatSize = (size?: number | null) => {
    if (!size) return '—';
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleRefresh = () => {
    void Promise.all([refetchDefinitions(), refetchExecutions()]);
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Reports" 
        subtitle="Generated from stored data only — no live syncs"
        lastUpdated={overview?.lastSync ? new Date(overview.lastSync).toLocaleString() : undefined}
        onRefresh={handleRefresh}
      />
      
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Report Types Grid */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Report Definitions</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-3 h-3" />
              New Schedule
            </Button>
          </div>
          {definitionsLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading report definitions…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
              {definitions?.map((report) => (
                <div 
                  key={report.id} 
                  className="bg-card p-4 hover:bg-accent/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-domain-reports/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-domain-reports" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">{report.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{report.schedule || 'On demand'}</span>
                      </div>
                      {report.formats && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {report.formats.map((format) => (
                            <span key={format} className="px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                              {format.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!definitions?.length && (
                <div className="col-span-full p-4 text-sm text-muted-foreground">
                  No report definitions available.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Reports */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Recent Reports</h3>
            <Button size="sm" className="gap-2">
              <Play className="w-3 h-3" />
              Generate Now
            </Button>
          </div>
          {executionsLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading reports…</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Generated</th>
                  <th>Format</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {executions?.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-domain-reports" />
                        <span className="text-sm font-medium text-foreground">{report.name || report.id}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{report.startedAt ? new Date(report.startedAt).toLocaleString() : '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded">
                        {(report.format || 'N/A').toUpperCase()}
                      </span>
                    </td>
                    <td className="text-sm text-muted-foreground">
                      {formatSize(report.sizeBytes)}
                    </td>
                    <td>
                      <StatusBadge 
                        status={report.status === 'completed' ? 'success' : report.status === 'failed' ? 'error' : 'pending'}
                        label={report.status}
                        size="sm"
                        pulse={report.status === 'generating'}
                      />
                    </td>
                    <td>
                      {report.status === 'completed' && report.downloadUrl && (
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => window.open(report.downloadUrl || '#', '_blank')}>
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {!executions?.length && (
                  <tr>
                    <td colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                      No report executions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Reports Never Trigger Syncs</h4>
              <p className="text-sm text-muted-foreground">
                All reports are generated exclusively from stored data snapshots. They will never initiate 
                inventory syncs, API calls to external systems, or job executions. This ensures reports 
                can be generated safely at any time without impacting production systems.
              </p>
              <div className="flex gap-2 mt-4">
                <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">HTML</span>
                <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">CSV</span>
                <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">JSON</span>
                <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">XLSX</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
