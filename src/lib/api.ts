import type { Job, JobStatus, JobType } from "@/types/domain";

type ApiEnvelope<T> = {
  data: T;
  meta?: {
    timestamp?: string;
    request_id?: string;
  };
  pagination?: {
    cursor?: string;
    has_more?: boolean;
    total_count?: number;
  };
};

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(init?.headers || {}),
  };

  if (API_TOKEN) {
    headers.Authorization = `Bearer ${API_TOKEN}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: init?.method || "GET",
    headers,
  });

  const text = await response.text();
  let payload: ApiEnvelope<T> | ApiErrorPayload | null = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new Error(`Failed to parse response from ${path}: ${String(error)}`);
    }
  }

  if (!response.ok) {
    const message = (payload as ApiErrorPayload | null)?.error?.message;
    throw new Error(message || `Request to ${path} failed (${response.status})`);
  }

  if (!payload) {
    throw new Error(`Empty response received from ${path}`);
  }

  const envelope = payload as ApiEnvelope<T>;
  if (typeof envelope.data !== "undefined") {
    return envelope.data;
  }

  return payload as unknown as T;
}

export type DashboardMetrics = {
  totalHosts: number;
  totalVMs: number;
  totalServers: number;
  totalPrefixes: number;
  activeJobs: number;
  pendingApprovals: number;
  criticalFindings: number;
  lastSync?: string;
};

export type HealthItem = {
  component: string;
  status: "healthy" | "degraded" | "unhealthy";
  lastCheck?: string;
  message?: string;
};

export type DashboardOverview = {
  metrics: DashboardMetrics;
  health: HealthItem[];
  lastSync?: string;
};

type DashboardOverviewResponse = {
  metrics: {
    total_hosts: number;
    total_vms: number;
    total_servers: number;
    total_prefixes: number;
    active_jobs: number;
    pending_approvals: number;
    critical_findings: number;
  };
  health?: {
    component: string;
    status: "healthy" | "degraded" | "unhealthy";
    last_check?: string;
    message?: string;
  }[];
  last_sync?: string;
};

export type VCenterInstanceSummary = {
  id: string;
  name: string;
  version: string;
  siteId?: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  counts: {
    datacenters: number;
    clusters: number;
    hosts: number;
    vms: number;
  };
};

type VCenterInstancesResponse = {
  id: string;
  name: string;
  version: string;
  site_id?: string;
  status: "connected" | "disconnected" | "error";
  last_sync?: string;
  counts: {
    datacenters: number;
    clusters: number;
    hosts: number;
    vms: number;
  };
}[];

export type DellEndpointSummary = {
  id: string;
  hostname: string;
  ipAddress: string;
  generation: string;
  serviceTag?: string;
  model?: string;
  status: string;
  firmwareVersion?: string;
  health?: string;
  mappedHost?: string | null;
  mappingConfidence?: number;
};

type DellEndpointsResponse = {
  id: string;
  hostname: string;
  ip_address: string;
  generation: string;
  service_tag?: string;
  model?: string;
  status: string;
  firmware_version?: string;
  health?: string;
  mapping?: {
    esxi_host_id?: string;
    esxi_host_name?: string;
    confidence?: number;
  } | null;
}[];

export type IpamPrefixSummary = {
  id: string;
  cidr: string;
  description?: string;
  siteId?: string | null;
  vlanId?: number | null;
  utilization?: number;
  status?: "active" | "reserved" | "deprecated";
  assignments?: number;
};

type IpamPrefixesResponse = {
  id: string;
  cidr: string;
  description?: string;
  site_id?: string | null;
  vlan_id?: number | null;
  utilization?: number;
  status?: "active" | "reserved" | "deprecated";
  assignments?: number;
}[];

export type IpamFindingSummary = {
  id: string;
  type: string;
  severity: "info" | "warning" | "error";
  address: string;
  description?: string;
  detectedAt?: string;
};

type IpamFindingsResponse = {
  id: string;
  type: string;
  severity: "info" | "warning" | "error";
  address: string;
  description?: string;
  detected_at?: string;
}[];

export type JobSummary = Job & {
  name: string;
  currentStepLabel?: string | null;
};

type JobsResponse = {
  id: string;
  type: JobType;
  name: string;
  description?: string;
  status: JobStatus;
  priority?: number;
  site_id?: string;
  target_ids?: string[];
  target_type?: "host" | "server" | "cluster";
  created_by?: string;
  approved_by?: string | null;
  service_identity_id?: string;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  progress?: number;
  current_step?: string | number | null;
  total_steps?: number;
  policy?: Job["policy"];
}[];

export type ReportDefinitionSummary = {
  id: string;
  type: string;
  name: string;
  schedule?: string | null;
  formats?: string[];
};

type ReportDefinitionsResponse = {
  id: string;
  type: string;
  name: string;
  schedule?: string | null;
  formats?: string[];
}[];

export type ReportExecutionSummary = {
  id: string;
  definitionId?: string;
  status: string;
  startedAt?: string;
  completedAt?: string | null;
  format?: string;
  sizeBytes?: number | null;
  downloadUrl?: string | null;
  name?: string;
};

type ReportExecutionsResponse = {
  id: string;
  definition_id?: string;
  status: string;
  started_at?: string;
  completed_at?: string | null;
  format?: string;
  size_bytes?: number | null;
  download_url?: string | null;
  name?: string;
}[];

export type SiteSummary = {
  id: string;
  name: string;
  code?: string;
  status?: "active" | "maintenance" | "offline";
  region?: string;
  country?: string;
};

type SitesResponse = {
  id: string;
  name: string;
  code?: string;
  status?: "active" | "maintenance" | "offline";
  region?: string;
  country?: string;
}[];

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const response = await apiGet<DashboardOverviewResponse>("/dashboard/overview");
  const metrics = response.metrics;

  return {
    metrics: {
      totalHosts: metrics.total_hosts,
      totalVMs: metrics.total_vms,
      totalServers: metrics.total_servers,
      totalPrefixes: metrics.total_prefixes,
      activeJobs: metrics.active_jobs,
      pendingApprovals: metrics.pending_approvals,
      criticalFindings: metrics.critical_findings,
      lastSync: response.last_sync,
    },
    health: (response.health || []).map((item) => ({
      component: item.component,
      status: item.status,
      lastCheck: item.last_check,
      message: item.message,
    })),
    lastSync: response.last_sync,
  };
}

export async function fetchVCenterInstances(): Promise<VCenterInstanceSummary[]> {
  const response = await apiGet<VCenterInstancesResponse>("/vcenter/instances");
  return response.map((vc) => ({
    id: vc.id,
    name: vc.name,
    version: vc.version,
    siteId: vc.site_id,
    status: vc.status,
    lastSync: vc.last_sync,
    counts: {
      datacenters: vc.counts.datacenters,
      clusters: vc.counts.clusters,
      hosts: vc.counts.hosts,
      vms: vc.counts.vms,
    },
  }));
}

export async function fetchDellEndpoints(): Promise<DellEndpointSummary[]> {
  const response = await apiGet<DellEndpointsResponse>("/dell/endpoints");
  return response.map((endpoint) => ({
    id: endpoint.id,
    hostname: endpoint.hostname,
    ipAddress: endpoint.ip_address,
    generation: endpoint.generation,
    serviceTag: endpoint.service_tag,
    model: endpoint.model,
    status: endpoint.status,
    firmwareVersion: endpoint.firmware_version,
    health: endpoint.health,
    mappedHost: endpoint.mapping?.esxi_host_name || null,
    mappingConfidence: endpoint.mapping?.confidence,
  }));
}

export async function fetchIpamPrefixes(): Promise<IpamPrefixSummary[]> {
  const response = await apiGet<IpamPrefixesResponse>("/ipam/prefixes");
  return response.map((prefix) => ({
    id: prefix.id,
    cidr: prefix.cidr,
    description: prefix.description,
    siteId: prefix.site_id,
    vlanId: prefix.vlan_id,
    utilization: prefix.utilization,
    status: prefix.status,
    assignments: prefix.assignments,
  }));
}

export async function fetchIpamFindings(): Promise<IpamFindingSummary[]> {
  const response = await apiGet<IpamFindingsResponse>("/ipam/findings");
  return response.map((finding) => ({
    id: finding.id,
    type: finding.type,
    severity: finding.severity,
    address: finding.address,
    description: finding.description,
    detectedAt: finding.detected_at,
  }));
}

export async function fetchJobs(): Promise<JobSummary[]> {
  const response = await apiGet<JobsResponse>("/jobs");
  return response.map((job) => ({
    id: job.id,
    type: job.type,
    name: job.name,
    description: job.description || "",
    status: job.status,
    priority: job.priority || 0,
    siteId: job.site_id || "",
    targetIds: job.target_ids || [],
    targetType: job.target_type || "host",
    createdBy: job.created_by || "system",
    approvedBy: job.approved_by || null,
    serviceIdentityId: job.service_identity_id || "",
    scheduledAt: job.scheduled_at || null,
    startedAt: job.started_at || null,
    completedAt: job.completed_at || null,
    progress: job.progress ?? 0,
    currentStep: typeof job.current_step === "number" ? job.current_step : 0,
    currentStepLabel: typeof job.current_step === "string" ? job.current_step : null,
    totalSteps: job.total_steps || 0,
    policy: job.policy || {
      allowVmShutdown: false,
      allowHardPoweroff: false,
      vmLimit: 0,
      shutdownTimeoutSeconds: 0,
      tagFilters: [],
      folderFilters: [],
      abortOnError: false,
      requireApproval: false,
    },
  }));
}

export async function fetchReportDefinitions(): Promise<ReportDefinitionSummary[]> {
  const response = await apiGet<ReportDefinitionsResponse>("/reports/definitions");
  return response.map((definition) => ({
    id: definition.id,
    type: definition.type,
    name: definition.name,
    schedule: definition.schedule,
    formats: definition.formats,
  }));
}

export async function fetchReportExecutions(): Promise<ReportExecutionSummary[]> {
  const response = await apiGet<ReportExecutionsResponse>("/reports/executions");
  return response.map((execution) => ({
    id: execution.id,
    definitionId: execution.definition_id,
    status: execution.status,
    startedAt: execution.started_at,
    completedAt: execution.completed_at,
    format: execution.format,
    sizeBytes: execution.size_bytes,
    downloadUrl: execution.download_url,
    name: execution.name,
  }));
}

export async function fetchSites(): Promise<SiteSummary[]> {
  const response = await apiGet<SitesResponse>("/sites");
  return response.map((site) => ({
    id: site.id,
    name: site.name,
    code: site.code,
    status: site.status,
    region: site.region,
    country: site.country,
  }));
}
