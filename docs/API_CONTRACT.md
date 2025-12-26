# API Contract Documentation

## Design Principles

1. **Aggregate Endpoints Only** — UI fetches page models, not individual entities
2. **No Per-Row Calls** — Bulk operations for all mutations
3. **Explicit Pagination** — Cursor-based for large datasets
4. **Structured Errors** — Consistent error response format

## Base URL

```
/api/v1
```

## Authentication

All endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## Common Response Patterns

### Success Response
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T14:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### Paginated Response
```json
{
  "data": [ ... ],
  "pagination": {
    "cursor": "eyJpZCI6MTAwfQ==",
    "has_more": true,
    "total_count": 1247
  },
  "meta": { ... }
}
```

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid CIDR notation",
    "details": {
      "field": "cidr",
      "value": "10.45.0.0/33"
    }
  },
  "meta": { ... }
}
```

---

## Dashboard Endpoints

### GET /api/v1/dashboard/overview
Returns aggregated metrics for the dashboard.

**Response:**
```json
{
  "data": {
    "metrics": {
      "total_hosts": 156,
      "total_vms": 2847,
      "total_servers": 189,
      "total_prefixes": 847,
      "active_jobs": 3,
      "pending_approvals": 5,
      "critical_findings": 3
    },
    "health": [
      {
        "component": "vcenter_api",
        "status": "healthy",
        "last_check": "2024-01-15T14:29:00Z"
      }
    ],
    "last_sync": "2024-01-15T14:28:00Z"
  }
}
```

---

## vCenter Endpoints

### GET /api/v1/vcenter/instances
List all vCenter instances with summary counts.

**Response:**
```json
{
  "data": [
    {
      "id": "vc-001",
      "name": "vcenter-prod-01.enterprise.local",
      "version": "8.0.2",
      "site_id": "site-001",
      "status": "connected",
      "last_sync": "2024-01-15T14:28:00Z",
      "counts": {
        "datacenters": 3,
        "clusters": 8,
        "hosts": 52,
        "vms": 1247
      }
    }
  ]
}
```

### GET /api/v1/vcenter/instances/{id}/inventory
Get full inventory tree for a vCenter instance.

**Query Parameters:**
- `depth`: `datacenter` | `cluster` | `host` | `vm` (default: `cluster`)
- `include_vms`: boolean (default: false for large datasets)

### POST /api/v1/vcenter/sync
Trigger inventory sync for specified vCenters.

**Request:**
```json
{
  "instance_ids": ["vc-001", "vc-002"],
  "sync_type": "delta"
}
```

---

## Dell iDRAC Endpoints

### GET /api/v1/dell/endpoints
List all iDRAC endpoints with mapping status.

**Query Parameters:**
- `generation`: `iDRAC7` | `iDRAC8` | `iDRAC9`
- `mapped`: boolean
- `health`: `ok` | `warning` | `critical`

### GET /api/v1/dell/endpoints/{id}
Get detailed endpoint information including capabilities.

**Response:**
```json
{
  "data": {
    "id": "idrac-001",
    "hostname": "idrac-prod-01.enterprise.local",
    "ip_address": "10.45.12.101",
    "generation": "iDRAC9",
    "capabilities": {
      "simple_update": true,
      "job_service": true,
      "multi_part_update": true,
      "firmware_inventory": true
    },
    "mapping": {
      "esxi_host_id": "host-001",
      "esxi_host_name": "esx-prod-01.enterprise.local",
      "confidence": 0.95,
      "method": "service_tag"
    }
  }
}
```

### POST /api/v1/dell/endpoints/{id}/firmware
Get firmware inventory for an endpoint.

---

## IPAM Endpoints

### GET /api/v1/ipam/prefixes
List prefixes with utilization.

**Query Parameters:**
- `site_id`: UUID
- `utilization_min`: number (0-100)
- `status`: `active` | `reserved` | `deprecated`

### GET /api/v1/ipam/search
Fuzzy search across IPAM entities.

**Query Parameters:**
- `q`: search query (supports CIDR notation)
- `types`: comma-separated list of entity types

**Response:**
```json
{
  "data": {
    "results": [
      {
        "type": "assignment",
        "address": "10.45.12.100",
        "hostname": "server-01.enterprise.local",
        "score": 0.92,
        "highlight": "<em>10.45.12</em>.100"
      }
    ]
  }
}
```

### GET /api/v1/ipam/findings
List active IPAM findings.

**Query Parameters:**
- `severity`: `info` | `warning` | `error`
- `type`: finding type filter
- `resolved`: boolean (default: false)

---

## Jobs Endpoints

### GET /api/v1/jobs
List jobs with filtering.

**Query Parameters:**
- `status`: comma-separated statuses
- `type`: job type filter
- `site_id`: UUID
- `created_after`: ISO timestamp

### POST /api/v1/jobs
Create a new job.

**Request:**
```json
{
  "type": "firmware_update",
  "name": "BIOS Update - Cluster-04",
  "target_ids": ["host-001", "host-002"],
  "target_type": "host",
  "site_id": "site-001",
  "scheduled_at": "2024-01-16T03:00:00Z",
  "policy": {
    "allow_vm_shutdown": false,
    "allow_hard_poweroff": false,
    "require_approval": true,
    "vm_limit": 10,
    "shutdown_timeout_seconds": 300
  }
}
```

### GET /api/v1/jobs/{id}
Get job details with steps and events.

### POST /api/v1/jobs/{id}/approve
Approve a pending job.

### POST /api/v1/jobs/{id}/cancel
Cancel a running or pending job.

### POST /api/v1/jobs/{id}/resume
Resume a paused job with specified action.

**Request:**
```json
{
  "action": "shutdown_vms",
  "vm_ids": ["vm-001", "vm-002"]
}
```

---

## Reports Endpoints

### GET /api/v1/reports/definitions
List report definitions.

### POST /api/v1/reports/generate
Generate a report.

**Request:**
```json
{
  "definition_id": "def-001",
  "format": "html",
  "filters": {
    "site_ids": ["site-001"],
    "date_range": {
      "start": "2024-01-08",
      "end": "2024-01-15"
    }
  }
}
```

### GET /api/v1/reports/executions
List recent report executions.

### GET /api/v1/reports/executions/{id}/download
Download a completed report.

---

## Sites Endpoints

### GET /api/v1/sites
List sites with hierarchy.

### GET /api/v1/sites/{id}/entities
Get all entities assigned to a site.

---

## Health Endpoints

### GET /api/v1/health
System health check.

**Response:**
```json
{
  "status": "healthy",
  "components": {
    "database": "healthy",
    "vcenter_api": "healthy",
    "idrac_endpoints": "degraded",
    "worker_pool": "healthy",
    "job_queue": "healthy"
  },
  "metrics": {
    "active_workers": 4,
    "queued_jobs": 12,
    "avg_job_latency_ms": 1250
  }
}
```

### GET /api/v1/health/workers
Worker pool status.

---

## Rate Limiting

All endpoints are rate-limited:
- Standard: 100 requests/minute
- Sync triggers: 10 requests/minute
- Report generation: 5 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705330800
```

## Idempotency

For POST/PUT/DELETE operations, include an idempotency key:
```
Idempotency-Key: <unique-request-id>
```

Duplicate requests with the same key within 24 hours will return the original response.
