# Operations Runbook

## System Overview

Enterprise Infrastructure Orchestrator (EIO) v2 manages Dell iDRAC endpoints, VMware vCenter instances, IP address management, and orchestrated maintenance jobs.

---

## Health Monitoring

### Health Check Endpoints

```bash
# Overall system health
curl -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/health

# Worker pool status
curl -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/health/workers
```

### Key Metrics to Monitor

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Job queue depth | > 50 | > 200 |
| Worker utilization | > 80% | > 95% |
| vCenter sync age | > 30 min | > 2 hours |
| iDRAC unreachable % | > 5% | > 20% |
| Failed jobs (24h) | > 5 | > 20 |

### Logs

Structured JSON logs with correlation IDs:
```json
{
  "timestamp": "2024-01-15T14:30:00Z",
  "level": "info",
  "message": "Job step completed",
  "job_id": "job-001",
  "step_id": "step-003",
  "external_task_id": "task-vcenter-12345",
  "duration_ms": 1250
}
```

---

## Common Operational Procedures

### 1. Triggering Manual Sync

#### vCenter Inventory Sync
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"instance_ids": ["vc-001"], "sync_type": "full"}' \
  https://eio.enterprise.local/api/v1/vcenter/sync
```

#### Dell Endpoint Discovery
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"site_ids": ["site-001"]}' \
  https://eio.enterprise.local/api/v1/dell/discover
```

### 2. Job Management

#### Cancel a Running Job
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/jobs/job-001/cancel
```

#### Resume a Paused Job
```bash
# Resume with VM shutdown for specific VMs
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "shutdown_vms", "vm_ids": ["vm-001", "vm-002"]}' \
  https://eio.enterprise.local/api/v1/jobs/job-001/resume
```

### 3. Emergency Stop (Kill Switch)

```bash
# Activate kill switch - stops all running jobs
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/system/kill-switch/activate

# Deactivate kill switch
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/system/kill-switch/deactivate
```

---

## Troubleshooting

### Issue: vCenter Sync Failing

**Symptoms:**
- Last sync time > 2 hours
- Health check shows vcenter_api degraded

**Diagnosis:**
```bash
# Check vCenter connectivity
curl -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/vcenter/instances/vc-001

# Check recent sync errors
grep "vcenter" /var/log/eio/worker.log | grep "error" | tail -20
```

**Resolution:**
1. Verify vCenter is accessible from worker nodes
2. Check service identity credentials are valid
3. Verify SSL certificate validity
4. Check PropertyCollector session limits

### Issue: iDRAC Endpoints Unreachable

**Symptoms:**
- Multiple endpoints showing "unreachable" status
- Discovery jobs failing

**Diagnosis:**
```bash
# Check endpoint connectivity from worker
curl -k https://10.45.12.101/redfish/v1/

# Check capability discovery results
curl -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/dell/endpoints/idrac-001
```

**Resolution:**
1. Verify network path to management network
2. Check iDRAC credentials in service identity
3. For legacy iDRAC7/8: verify TLS 1.0/1.1 support if required
4. Check firewall rules for Redfish (443) and WSMan (5986)

### Issue: Job Stuck in "Paused" State

**Symptoms:**
- Job shows "paused" status
- DRS evacuation blocked

**Diagnosis:**
```bash
# Get job details with blocking VMs
curl -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/jobs/job-001

# Check blocking VMs
curl -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/jobs/job-001/blocking-vms
```

**Resolution:**
1. Review blocking VM list and reasons
2. Options:
   - Cancel job and reschedule
   - Manually migrate blocking VMs
   - Resume with `shutdown_vms` action (requires policy)
   - Resume with `suspend_vms` action

### Issue: IPAM Duplicate Detection False Positives

**Symptoms:**
- `duplicate_usage` findings for legitimate multi-homed hosts

**Diagnosis:**
```bash
# Get observation details
curl -H "Authorization: Bearer $TOKEN" \
  "https://eio.enterprise.local/api/v1/ipam/observations?address=10.45.12.100"
```

**Resolution:**
1. Review observation sources
2. Add exception for known multi-homed hosts
3. Mark finding as resolved with explanation

---

## Database Operations

### Backup Procedures
```bash
# Full backup
pg_dump -Fc eio_production > eio_backup_$(date +%Y%m%d).dump

# Verify backup
pg_restore --list eio_backup_$(date +%Y%m%d).dump
```

### Applying Migrations Locally

For a local developer database (PostgreSQL or Supabase Postgres), apply migrations in order using `psql`. Update `DATABASE_URL` with your connection string.

```bash
psql "$DATABASE_URL" -f db/migrations/001_create_core_tables.sql
psql "$DATABASE_URL" -f db/seed/001_seed.sql
```

If you are using Supabase, set `DATABASE_URL` to the Supabase Postgres connection URL (not the HTTP API key) before running the commands.

### Read Replica Lag
```sql
SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replication_lag
FROM pg_stat_replication;
```

### Vacuum Status
```sql
SELECT schemaname, relname, n_live_tup, n_dead_tup,
       last_vacuum, last_autovacuum, last_analyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

---

## Service Identity Management

### Rotate Credentials
```bash
# Generate new credentials
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/service-identities/si-001/rotate

# Verify new credentials work
curl -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/service-identities/si-001/verify
```

### View Credential Usage
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/service-identities/si-001/activity
```

---

## Worker Pool Management

### Scale Workers
```bash
# View current worker count
kubectl get pods -l app=eio-worker

# Scale up
kubectl scale deployment eio-worker --replicas=8

# Scale down (graceful)
kubectl scale deployment eio-worker --replicas=4
```

### Drain a Worker
```bash
# Mark worker for drain (finishes current job, takes no new work)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/workers/worker-001/drain
```

---

## Scheduled Maintenance

### Pre-Maintenance Checklist
- [ ] Kill switch tested and accessible
- [ ] Recent backup verified
- [ ] Pending approvals cleared or deferred
- [ ] Affected sites notified
- [ ] Rollback procedure reviewed

### Maintenance Window Procedure
1. Pause job scheduler
2. Wait for running jobs to complete (or cancel if urgent)
3. Perform maintenance
4. Verify health endpoints
5. Resume job scheduler
6. Monitor for 15 minutes

### Post-Maintenance Verification
```bash
# Full health check
curl -H "Authorization: Bearer $TOKEN" \
  https://eio.enterprise.local/api/v1/health

# Trigger test sync
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"instance_ids": ["vc-001"], "sync_type": "delta"}' \
  https://eio.enterprise.local/api/v1/vcenter/sync

# Check job execution
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "health_check", "target_ids": ["test-target"]}' \
  https://eio.enterprise.local/api/v1/jobs
```

---

## Escalation Contacts

| Level | Scope | Contact |
|-------|-------|---------|
| L1 | Dashboard alerts, basic troubleshooting | Platform Team |
| L2 | Job failures, sync issues | Infrastructure Team |
| L3 | Database, security, architecture | Platform Engineering |
