# Contributing Guidelines

## Development Philosophy

This codebase follows domain-driven design with explicit separation of concerns. Before contributing, read and understand:

1. `AGENTS.md` — Critical rules for Codex/AI tools
2. `docs/ARCHITECTURE.md` — System design and domain model
3. `docs/API_CONTRACT.md` — REST API specifications

## Code Organization

```
backend/
  api/           # HTTP handlers only — no business logic
  services/      # Business logic — no DB access
  repositories/  # Data access — SQL only
  workers/       # Background processing

integrations/
  vcenter/       # pyVmomi integration
  idrac/         # Redfish + WSMan

frontend/
  src/
    components/  # Reusable UI components
    pages/       # Route-level components
    types/       # TypeScript domain types
```

## Golden Rules

### Backend

1. **API layer** — HTTP only, delegates to services
2. **Service layer** — Business logic, no direct DB access
3. **Repository layer** — SQL queries, returns domain objects
4. **Workers** — Long-running operations with checkpointing

### Frontend

1. **No database access** in React components
2. **No per-row API calls** — use aggregate endpoints
3. **Show last-updated timestamps** on all data
4. **Explain inferred data** (confidence, source)

### Integrations

1. **vCenter** — Use pyVmomi only, no invented REST
2. **iDRAC** — Use Redfish with WSMan fallback
3. **Capability discovery** before operations
4. **Record driver choice** per job step

## Commit Standards

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat` — New feature
- `fix` — Bug fix
- `refactor` — Code restructuring
- `docs` — Documentation
- `test` — Tests
- `chore` — Maintenance

### Scopes
- `api` — Backend API
- `ui` — Frontend
- `vcenter` — vCenter integration
- `idrac` — Dell integration
- `ipam` — IP management
- `jobs` — Orchestration
- `reports` — Reporting

### Examples
```
feat(vcenter): add PropertyCollector bulk sync

Implements bulk inventory retrieval using PropertyCollector 
with ContainerView for efficient VM enumeration.

Closes #123
```

```
fix(jobs): handle DRS evacuation blocked state

When DRS cannot migrate VMs, job now pauses correctly
and records blocking VMs with reasons.
```

## Pull Request Process

1. **Branch naming**: `<type>/<scope>-<description>`
   - Example: `feat/vcenter-property-collector`

2. **PR description must include**:
   - Summary of changes
   - Affected domains
   - Testing performed
   - Documentation updates

3. **Required checks**:
   - All tests pass
   - Linting passes
   - Type checking passes
   - Documentation updated if API changed

4. **Review requirements**:
   - 1 approval for non-critical changes
   - 2 approvals for API changes
   - Security review for auth/credential changes

## Testing Standards

### Backend
```python
# Unit tests for services
def test_job_policy_validates_vm_shutdown():
    policy = JobPolicy(allow_vm_shutdown=False)
    assert policy.can_shutdown_vm() == False

# Integration tests for repositories
def test_prefix_query_uses_cidr_operators():
    result = prefix_repo.find_containing("10.45.12.0/24")
    assert result.cidr == "10.45.0.0/16"
```

### Frontend
```typescript
// Component tests
describe('MetricCard', () => {
  it('displays value with trend indicator', () => {
    render(<MetricCard value={156} trend={{ value: 2.5, direction: 'up' }} />);
    expect(screen.getByText('156')).toBeInTheDocument();
    expect(screen.getByText('2.5%')).toBeInTheDocument();
  });
});
```

## Documentation Requirements

### When to Update Docs

1. **API changes** → Update `docs/API_CONTRACT.md`
2. **Architecture changes** → Update `docs/ARCHITECTURE.md`
3. **Operational changes** → Update `docs/RUNBOOK.md`
4. **Critical rule changes** → Update `AGENTS.md`

### Documentation Format

- Use markdown with proper headings
- Include code examples
- Document error cases
- Keep examples up to date with code

## Security Considerations

### Never Commit
- API keys or secrets
- Production URLs
- User credentials
- PII data samples

### Always Use
- Service identities for automation
- Encrypted credential storage
- Audit logging for sensitive operations
- Explicit approvals for destructive actions

## Getting Help

- Check existing documentation first
- Search closed PRs for similar changes
- Open a discussion for design questions
- Tag appropriate reviewers for domain expertise
