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

const reportTypes = [
  { id: 'inventory_summary', name: 'Weekly Inventory Summary', schedule: 'Every Monday 08:00 UTC' },
  { id: 'inventory_changes', name: 'Inventory Changes (Delta)', schedule: 'Daily 06:00 UTC' },
  { id: 'firmware_compliance', name: 'Firmware Compliance', schedule: 'Weekly Sunday 00:00 UTC' },
  { id: 'update_execution', name: 'Update Execution History', schedule: 'On demand' },
  { id: 'unattended_exceptions', name: 'Unattended Maintenance Exceptions', schedule: 'Daily 07:00 UTC' },
  { id: 'ip_utilization', name: 'IP Utilization', schedule: 'Weekly Friday 18:00 UTC' },
  { id: 'ipam_findings', name: 'IPAM Findings', schedule: 'Daily 06:00 UTC' },
  { id: 'operations_summary', name: 'Weekly Operations Summary', schedule: 'Every Monday 09:00 UTC' },
];

const recentReports = [
  {
    id: 'report-001',
    type: 'inventory_summary',
    name: 'Weekly Inventory Summary',
    generatedAt: '2024-01-15 08:00:00',
    status: 'completed' as const,
    format: 'HTML',
    size: '2.4 MB',
  },
  {
    id: 'report-002',
    type: 'firmware_compliance',
    name: 'Firmware Compliance',
    generatedAt: '2024-01-14 00:00:00',
    status: 'completed' as const,
    format: 'CSV',
    size: '156 KB',
  },
  {
    id: 'report-003',
    type: 'ipam_findings',
    name: 'IPAM Findings',
    generatedAt: '2024-01-15 06:00:00',
    status: 'completed' as const,
    format: 'JSON',
    size: '48 KB',
  },
  {
    id: 'report-004',
    type: 'inventory_changes',
    name: 'Inventory Changes (Delta)',
    generatedAt: '2024-01-15 06:00:00',
    status: 'generating' as const,
    format: 'HTML',
    size: null,
  },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Reports" 
        subtitle="Generated from stored data only — no live syncs"
        lastUpdated="1 hour ago"
        onRefresh={() => console.log('Refresh')}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {reportTypes.map((report) => (
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
                      <span>{report.schedule}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              {recentReports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-domain-reports" />
                      <span className="text-sm font-medium text-foreground">{report.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{report.generatedAt}</span>
                    </div>
                  </td>
                  <td>
                    <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded">
                      {report.format}
                    </span>
                  </td>
                  <td className="text-sm text-muted-foreground">
                    {report.size || '—'}
                  </td>
                  <td>
                    <StatusBadge 
                      status={report.status === 'completed' ? 'success' : 'pending'}
                      label={report.status}
                      size="sm"
                      pulse={report.status === 'generating'}
                    />
                  </td>
                  <td>
                    {report.status === 'completed' && (
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
