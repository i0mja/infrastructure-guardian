// Domain Types for Enterprise Infrastructure Orchestrator

// ============================================
// Identity & RBAC Domain
// ============================================
export type UserRole = 'viewer' | 'operator' | 'approver' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  lastLogin: string;
  createdAt: string;
}

export interface ServiceIdentity {
  id: string;
  name: string;
  description: string;
  lastSuccess: string | null;
  lastFailure: string | null;
  rotationDue: string;
  createdAt: string;
}

// ============================================
// Sites & Geography Domain
// ============================================
export interface Region {
  id: string;
  name: string;
  code: string;
}

export interface Country {
  id: string;
  regionId: string;
  name: string;
  code: string;
}

export interface Site {
  id: string;
  countryId: string;
  name: string;
  code: string;
  timezone: string;
  status: 'active' | 'maintenance' | 'offline';
}

// ============================================
// Inventory Domain - vCenter
// ============================================
export interface VCenterInstance {
  id: string;
  name: string;
  fqdn: string;
  version: string;
  siteId: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  datacenterCount: number;
  clusterCount: number;
  hostCount: number;
  vmCount: number;
}

export interface Datacenter {
  id: string;
  vcenterId: string;
  name: string;
  moId: string;
}

export interface Cluster {
  id: string;
  datacenterId: string;
  name: string;
  moId: string;
  hostCount: number;
  vmCount: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  drsEnabled: boolean;
  haEnabled: boolean;
}

export interface ESXiHost {
  id: string;
  clusterId: string;
  name: string;
  moId: string;
  version: string;
  model: string;
  serialNumber: string;
  cpuCores: number;
  memoryGb: number;
  vmCount: number;
  powerState: 'on' | 'standby' | 'off';
  maintenanceMode: boolean;
  connectionState: 'connected' | 'disconnected' | 'notResponding';
}

export interface VirtualMachine {
  id: string;
  hostId: string;
  name: string;
  moId: string;
  uuid: string;
  guestOs: string;
  powerState: 'poweredOn' | 'poweredOff' | 'suspended';
  vCpus: number;
  memoryMb: number;
  toolsStatus: 'running' | 'notRunning' | 'notInstalled';
  ipAddresses: string[];
  hasSnapshot: boolean;
  folderPath: string;
  tags: string[];
  notes: string | null;
}

// ============================================
// Inventory Domain - Dell
// ============================================
export type IDRACGeneration = 'iDRAC7' | 'iDRAC8' | 'iDRAC9';

export interface IDRACEndpoint {
  id: string;
  siteId: string;
  hostname: string;
  ipAddress: string;
  generation: IDRACGeneration;
  firmwareVersion: string;
  serviceTag: string;
  model: string;
  status: 'reachable' | 'unreachable' | 'auth_failed';
  lastSync: string;
  redfishSupported: boolean;
  capabilities: IDRACCapabilities;
}

export interface IDRACCapabilities {
  simpleUpdate: boolean;
  jobService: boolean;
  multiPartUpdate: boolean;
  firmwareInventory: boolean;
  systemErase: boolean;
}

export interface PhysicalServer {
  id: string;
  idracId: string;
  serviceTag: string;
  model: string;
  biosVersion: string;
  cpuModel: string;
  cpuCount: number;
  totalCores: number;
  memoryGb: number;
  powerState: 'on' | 'off' | 'powering_on' | 'powering_off';
  health: 'ok' | 'warning' | 'critical';
}

export interface FirmwareInventory {
  id: string;
  serverId: string;
  componentName: string;
  currentVersion: string;
  availableVersion: string | null;
  updateAvailable: boolean;
  criticality: 'optional' | 'recommended' | 'critical';
}

// Server Mapping
export interface ServerMapping {
  id: string;
  idracId: string;
  esxiHostId: string;
  confidence: number;
  method: 'service_tag' | 'uuid' | 'naming_rule' | 'attribute' | 'manual';
  verifiedAt: string | null;
}

// ============================================
// IPAM Domain
// ============================================
export interface RoutingDomain {
  id: string;
  name: string;
  description: string;
}

export interface Prefix {
  id: string;
  routingDomainId: string;
  siteId: string | null;
  cidr: string;
  description: string;
  vlanId: number | null;
  utilization: number;
  status: 'active' | 'reserved' | 'deprecated';
}

export interface IPAssignment {
  id: string;
  prefixId: string;
  address: string;
  type: 'static' | 'reservation' | 'exclusion' | 'pool';
  hostname: string | null;
  owner: string | null;
  ticketRef: string | null;
  expiresAt: string | null;
}

export interface IPObservation {
  id: string;
  address: string;
  source: 'vcenter_vm' | 'esxi_mgmt' | 'idrac_mgmt' | 'manual';
  sourceId: string;
  macAddress: string | null;
  lastSeen: string;
  confidence: number;
}

export type IPAMFindingType = 
  | 'duplicate_usage' 
  | 'seen_not_planned' 
  | 'planned_not_seen' 
  | 'wrong_segment' 
  | 'stale_usage'
  | 'outside_prefix';

export interface IPAMFinding {
  id: string;
  address: string;
  type: IPAMFindingType;
  severity: 'info' | 'warning' | 'error';
  description: string;
  detectedAt: string;
  resolvedAt: string | null;
}

// ============================================
// Jobs & Orchestration Domain
// ============================================
export type JobType = 
  | 'firmware_update'
  | 'maintenance_mode'
  | 'drs_evacuation'
  | 'power_cycle'
  | 'inventory_sync';

export type JobStatus = 
  | 'pending'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Job {
  id: string;
  type: JobType;
  name: string;
  description: string;
  status: JobStatus;
  priority: number;
  siteId: string;
  targetIds: string[];
  targetType: 'host' | 'server' | 'cluster';
  createdBy: string;
  approvedBy: string | null;
  serviceIdentityId: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  progress: number;
  currentStep: number;
  totalSteps: number;
  policy: JobPolicy;
}

export interface JobPolicy {
  allowVmShutdown: boolean;
  allowHardPoweroff: boolean;
  vmLimit: number;
  shutdownTimeoutSeconds: number;
  tagFilters: string[];
  folderFilters: string[];
  abortOnError: boolean;
  requireApproval: boolean;
}

export interface JobStep {
  id: string;
  jobId: string;
  sequence: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  externalTaskId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  output: string | null;
  error: string | null;
}

export interface JobEvent {
  id: string;
  jobId: string;
  stepId: string | null;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  data: Record<string, unknown> | null;
}

// ============================================
// Reporting Domain
// ============================================
export type ReportType = 
  | 'inventory_summary'
  | 'inventory_changes'
  | 'firmware_compliance'
  | 'update_execution'
  | 'unattended_exceptions'
  | 'ip_utilization'
  | 'ipam_findings'
  | 'operations_summary';

export type ReportFormat = 'html' | 'csv' | 'json' | 'xlsx';

export interface ReportDefinition {
  id: string;
  type: ReportType;
  name: string;
  description: string;
  schedule: string | null; // cron expression
  formats: ReportFormat[];
  filters: Record<string, unknown>;
  recipients: string[];
}

export interface ReportExecution {
  id: string;
  definitionId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  format: ReportFormat;
  sizeBytes: number | null;
  downloadUrl: string | null;
  error: string | null;
}

// ============================================
// Dashboard & Metrics
// ============================================
export interface SystemMetrics {
  totalHosts: number;
  totalVMs: number;
  totalServers: number;
  totalPrefixes: number;
  activeJobs: number;
  pendingApprovals: number;
  criticalFindings: number;
  lastSyncTime: string;
}

export interface HealthStatus {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  lastCheck: string;
}
