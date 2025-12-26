# Architecture Documentation

## System Overview

Enterprise Infrastructure Orchestrator (EIO) v2 is a domain-driven platform for managing enterprise infrastructure across multiple systems.

## Architectural Principles

### 1. External Systems as Source of Truth
- vCenter, iDRAC, and OpenManage are authoritative
- Platform stores snapshots, deltas, and execution state
- Database serves as cache + ledger

### 2. Service Identity Model
- Service identities execute automated operations
- Human credentials used only for authentication
- Explicit approvals for destructive operations

### 3. Bulk API Pattern
- No per-VM or per-host polling loops
- PropertyCollector for vCenter bulk operations
- Aggregate endpoints for UI consumption

## Domain Model

### Domain 1: Identity & RBAC
```
User
├── id: UUID
├── email: string
├── role: viewer | operator | approver | admin
└── capabilities: string[]

ServiceIdentity
├── id: UUID
├── name: string
├── encrypted_credentials: bytes
├── rotation_due: timestamp
├── last_success: timestamp
└── last_failure: timestamp
```

### Domain 2: Sites & Geography
```
Region → Country → Site

Site
├── id: UUID
├── country_id: UUID
├── code: string (e.g., "US-EAST-01")
├── timezone: string
└── status: active | maintenance | offline

SiteInference
├── entity_id: UUID
├── site_id: UUID
├── confidence: float
├── method: vcenter | cidr | vlan | dns | manual
└── evidence: jsonb
```

### Domain 3: Inventory

#### vCenter Inventory
```
VCenterInstance → Datacenter → Cluster → ESXiHost → VirtualMachine

VirtualMachine
├── uuid, moid, folder_path
├── vcpu, memory_mb, power_state
├── tools_status, guest_os
├── nics: [{mac, network}]
├── guest_ips: [{ip, confidence}]
├── tags, custom_attributes
├── notes, has_snapshot
└── last_sync: timestamp
```

#### Dell Inventory
```
IDRACEndpoint → PhysicalServer → FirmwareInventory

IDRACEndpoint
├── generation: iDRAC7 | iDRAC8 | iDRAC9
├── capabilities: {simpleUpdate, jobService, ...}
├── driver_preference: redfish | wsman | racadm
└── tls_constraints: jsonb

ServerMapping
├── idrac_id: UUID
├── esxi_host_id: UUID
├── confidence: float
├── method: service_tag | uuid | naming | attribute | manual
└── verified_at: timestamp
```

### Domain 4: IPAM
```
RoutingDomain → Prefix → IPAssignment

Prefix
├── cidr: inet
├── routing_domain_id: UUID
├── site_id: UUID
├── vlan_id: int
├── status: active | reserved | deprecated
└── utilization: computed

IPObservation
├── address: inet
├── source: vcenter_vm | esxi_mgmt | idrac_mgmt
├── mac_address: macaddr
├── confidence: float
└── last_seen: timestamp

IPAMFinding
├── type: duplicate_usage | seen_not_planned | ...
├── severity: info | warning | error
└── resolved_at: timestamp
```

### Domain 5: Jobs & Orchestration
```
Job → JobStep → JobEvent

Job
├── type: firmware_update | maintenance_mode | ...
├── status: pending | scheduled | running | paused | ...
├── service_identity_id: UUID
├── initiated_by_user: UUID
├── approved_by_user: UUID
├── policy: JobPolicy
└── external_task_ids: string[]

JobPolicy
├── allow_vm_shutdown: boolean (default false)
├── allow_hard_poweroff: boolean (default false)
├── vm_limit: int
├── shutdown_timeout_seconds: int
├── require_approval: boolean
└── tag_filters, folder_filters: string[]
```

### Domain 6: Reporting
```
ReportDefinition → ReportExecution

ReportDefinition
├── type: inventory_summary | firmware_compliance | ...
├── schedule: cron expression
├── formats: [html, csv, json, xlsx]
└── filters: jsonb

ReportExecution
├── status: pending | generating | completed | failed
├── format: string
├── size_bytes: bigint
└── storage_path: string
```

## Data Flow

### Sync Flow
```
┌──────────────┐    PropertyCollector    ┌──────────────┐
│   vCenter    │◄────────────────────────│    Worker    │
└──────────────┘                         └──────┬───────┘
                                                │
┌──────────────┐    Redfish/WSMan        ┌──────▼───────┐
│    iDRAC     │◄────────────────────────│  Repository  │
└──────────────┘                         └──────┬───────┘
                                                │
                                         ┌──────▼───────┐
                                         │  PostgreSQL  │
                                         └──────────────┘
```

### UI Data Flow
```
┌──────────────┐    Aggregate Request    ┌──────────────┐
│   React UI   │────────────────────────►│   REST API   │
└──────────────┘                         └──────┬───────┘
       ▲                                        │
       │         Page Model Response     ┌──────▼───────┐
       └─────────────────────────────────│   Service    │
                                         └──────┬───────┘
                                                │
                                         ┌──────▼───────┐
                                         │  Repository  │
                                         └──────────────┘
```

## PostgreSQL Patterns

### CIDR Operations
```sql
-- Prefix containment
SELECT * FROM prefixes WHERE cidr >>= '10.45.12.0/24';

-- Available ranges
SELECT * FROM available_ranges(prefix_id) 
WHERE masklen(range) >= 24;
```

### Fuzzy Search
```sql
-- pg_trgm similarity
SELECT *, similarity(name, $query) AS score
FROM virtual_machines
WHERE name % $query
ORDER BY score DESC;
```

### Audit Trail
```sql
-- Append-only events
INSERT INTO job_events (job_id, step_id, level, message, data)
VALUES ($1, $2, $3, $4, $5);
-- No UPDATE or DELETE on this table
```

## Worker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Worker Pool                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │Worker 1 │  │Worker 2 │  │Worker 3 │  │Worker N │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                          │                                  │
│                   ┌──────▼───────┐                          │
│                   │  Job Queue   │  TTL-based leasing       │
│                   └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘

Constraints:
- Bounded concurrency per site/cluster
- Idempotency keys for duplicate prevention
- Global kill switch for emergency stop
```

## Safety Mechanisms

### Maintenance Mode Gate
```
1. Request maintenance mode
2. Initiate DRS evacuation
3. IF blocked:
   a. Pause job
   b. Display blocking VMs + reasons
   c. Require explicit choice:
      - Cancel
      - Retry
      - Shutdown selected VMs
      - Suspend selected VMs (optional)
4. Default behavior: pause + require manual decision
```

### Unattended Execution Policy
```
JobPolicy {
  allow_vm_shutdown: false,      // Explicit opt-in
  allow_hard_poweroff: false,    // Explicit opt-in
  vm_limit: 10,                  // Max VMs per host
  shutdown_timeout: 300,         // 5 minute timeout
  require_approval: true         // For production clusters
}
```
