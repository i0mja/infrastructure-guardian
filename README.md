# Enterprise Infrastructure Orchestrator v2

Dell iDRAC • VMware vCenter • IPAM • Jobs • Reporting

## Quick Start

```bash
npm install
npm run dev
```

## Documentation

- [AGENTS.md](./AGENTS.md) — Codex entry point
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — System design
- [docs/API_CONTRACT.md](./docs/API_CONTRACT.md) — API specs
- [docs/RUNBOOK.md](./docs/RUNBOOK.md) — Operations
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Dev guidelines

## Principles

1. External systems = source of truth
2. Service identities execute; humans approve
3. Bulk APIs only
4. Database = cache + ledger
