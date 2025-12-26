# AGENTS.md — Codex Entry Point

This document is the authoritative entry point for OpenAI Codex and any AI-assisted development tools working on this codebase.

## Project Overview

**Enterprise Infrastructure Orchestrator (EIO) v2** is a clean-slate rebuild for managing enterprise infrastructure across Dell iDRAC, VMware vCenter, IPAM, Jobs, and Reporting domains.

## Critical Principles

1. **External systems are the source of truth** — vCenter, iDRAC, OpenManage
2. **Database = cache + ledger** — snapshots, deltas, audit logs
3. **Service identities execute; humans approve** — no end-user credentials for syncs
4. **Bulk APIs only** — no per-VM/host loops, no per-row UI calls

## Documentation Map

| Document | Purpose |
|----------|---------|
| `AGENTS.md` (this file) | Codex entry point, critical rules |
| `docs/ARCHITECTURE.md` | System architecture, domain model, data flow |
| `docs/API_CONTRACT.md` | REST API specifications, endpoint patterns |
| `docs/RUNBOOK.md` | Operational procedures, troubleshooting |
| `CONTRIBUTING.md` | Development workflow, code standards |

## Mandatory Rules for Code Changes

### Never Do

- ❌ Invent REST APIs for vCenter (use pyVmomi/SOAP)
- ❌ Invent REST APIs for Dell iDRAC (use Redfish)
- ❌ Per-VM or per-host polling loops
- ❌ Direct database access in React components
- ❌ Per-row API calls from UI
- ❌ Store user credentials for automation
- ❌ Duplicate logic across services

### Always Do

- ✅ Use PropertyCollector for vCenter bulk operations
- ✅ Use Redfish for iDRAC with capability discovery
- ✅ Use aggregate "page model" endpoints for UI
- ✅ Use service identities for all automated operations
- ✅ Record `executed_by_service_identity`, `initiated_by_user`, `approved_by_user`
- ✅ Persist external task/job IDs for resumability
- ✅ Use PostgreSQL native features (inet/cidr, pg_trgm, GIST)

## Domain Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  React + Tailwind — Aggregate endpoints only, no DB access  │
└────────────────────────────┬────────────────────────────────┘
                             │ REST API
┌────────────────────────────┴────────────────────────────────┐
│                          BACKEND                            │
│  api/ → services/ → repositories/ → PostgreSQL              │
└────────────────────────────┬────────────────────────────────┘
                             │ Workers
┌────────────────────────────┴────────────────────────────────┐
│                       INTEGRATIONS                          │
│  vcenter/ (pyVmomi)  │  idrac/ (Redfish + WSMan fallback)   │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
backend/
  api/           # REST endpoints
  services/      # Business logic
  repositories/  # Data access layer
  workers/       # Background job processing

integrations/
  vcenter/       # pyVmomi only (no invented REST)
  idrac/         # Redfish + WSMan fallback

frontend/
  src/
    components/  # Reusable UI components
    pages/       # Route-level components
    types/       # TypeScript domain types

db/
  migrations/    # PostgreSQL migrations

docs/            # Architecture & API documentation
```

## Quick Reference

### vCenter Integration
- Library: pyVmomi (vSphere SOAP API)
- Features: PropertyCollector, Container views, Task objects
- Sync: WaitForUpdatesEx OR bulk snapshot + hash deltas

### Dell iDRAC Integration
- Protocol: Redfish (/redfish/v1)
- Legacy: WSMan/RACADM fallback for iDRAC7/8
- Constraint: iDRAC7/8 SimpleUpdate = one component at a time

### IPAM
- Address space: Corporate 10/8
- Use PostgreSQL inet/cidr types + GIST indexes
- Evidence layer tracks observations with confidence scores

### Jobs
- Resumable state machines
- Explicit DRS evacuation gate
- Unattended scheduling requires policy approval
