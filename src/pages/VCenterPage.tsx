import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Server, RefreshCw, ChevronRight, Database, Cpu, HardDrive } from 'lucide-react';

const mockVCenters = [
  {
    id: 'vc-1',
    name: 'vcenter-prod-01.enterprise.local',
    version: '8.0.2',
    site: 'US-EAST-01',
    status: 'connected' as const,
    lastSync: '2 min ago',
    datacenters: 3,
    clusters: 8,
    hosts: 52,
    vms: 1247,
  },
  {
    id: 'vc-2',
    name: 'vcenter-prod-02.enterprise.local',
    version: '8.0.1',
    site: 'EU-WEST-02',
    status: 'connected' as const,
    lastSync: '3 min ago',
    datacenters: 2,
    clusters: 6,
    hosts: 38,
    vms: 892,
  },
  {
    id: 'vc-3',
    name: 'vcenter-dr-01.enterprise.local',
    version: '7.0.3',
    site: 'US-WEST-03',
    status: 'connected' as const,
    lastSync: '5 min ago',
    datacenters: 3,
    clusters: 10,
    hosts: 66,
    vms: 708,
  },
];

export default function VCenterPage() {
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="vCenter Inventory" 
        subtitle="VMware vSphere infrastructure"
        lastUpdated="2 min ago"
        onRefresh={() => console.log('Refresh')}
      />
      
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Server className="w-4 h-4 text-domain-vcenter" />
              <span className="text-sm">vCenters</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{mockVCenters.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Database className="w-4 h-4" />
              <span className="text-sm">Datacenters</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {mockVCenters.reduce((acc, vc) => acc + vc.datacenters, 0)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Cpu className="w-4 h-4" />
              <span className="text-sm">Clusters</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {mockVCenters.reduce((acc, vc) => acc + vc.clusters, 0)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <HardDrive className="w-4 h-4" />
              <span className="text-sm">Total VMs</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {mockVCenters.reduce((acc, vc) => acc + vc.vms, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* vCenter List */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">vCenter Instances</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-3 h-3" />
              Sync All
            </Button>
          </div>
          <div className="divide-y divide-border">
            {mockVCenters.map((vc) => (
              <div 
                key={vc.id} 
                className="p-4 hover:bg-accent/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-domain-vcenter/10 flex items-center justify-center">
                      <Server className="w-5 h-5 text-domain-vcenter" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground font-mono">
                          {vc.name}
                        </span>
                        <StatusBadge 
                          status={vc.status === 'connected' ? 'success' : 'error'} 
                          label={vc.status} 
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>v{vc.version}</span>
                        <span>•</span>
                        <span>{vc.site}</span>
                        <span>•</span>
                        <span>Last sync: {vc.lastSync}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-lg font-semibold text-foreground">{vc.datacenters}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">DC</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">{vc.clusters}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Clusters</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">{vc.hosts}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Hosts</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">{vc.vms.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">VMs</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder for detailed views */}
        <div className="bg-card border border-border border-dashed rounded-lg p-8 text-center">
          <Server className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Select a vCenter</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Click on a vCenter instance above to view its datacenters, clusters, hosts, and VMs. 
            Use the PropertyCollector API for bulk inventory retrieval.
          </p>
        </div>
      </div>
    </div>
  );
}
