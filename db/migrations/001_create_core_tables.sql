-- Core schema for minimal end-to-end job execution
-- Applies foundational entities, job orchestration tables, worker visibility,
-- and current-state vCenter caches.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sites catalog
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);

-- vCenter instances
CREATE TABLE IF NOT EXISTS vcenters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  fqdn TEXT NOT NULL UNIQUE,
  version TEXT,
  status TEXT NOT NULL DEFAULT 'connected',
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vcenters_site ON vcenters(site_id);
CREATE INDEX IF NOT EXISTS idx_vcenters_status ON vcenters(status);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','scheduled','running','paused','completed','failed','cancelled')),
  priority INT NOT NULL DEFAULT 0,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  target_type TEXT,
  target_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  service_identity_id UUID,
  initiated_by_user UUID,
  approved_by_user UUID,
  policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress NUMERIC(5,2) NOT NULL DEFAULT 0,
  current_step INT NOT NULL DEFAULT 0,
  total_steps INT NOT NULL DEFAULT 0,
  external_task_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_site ON jobs(site_id);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_at ON jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_jobs_started_at ON jobs(started_at);

-- Job steps
CREATE TABLE IF NOT EXISTS job_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sequence INT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','running','completed','failed','skipped')),
  external_task_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  output JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, sequence)
);
CREATE INDEX IF NOT EXISTS idx_job_steps_job ON job_steps(job_id);
CREATE INDEX IF NOT EXISTS idx_job_steps_status ON job_steps(status);

-- Job events (append-only)
CREATE TABLE IF NOT EXISTS job_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  step_id UUID REFERENCES job_steps(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  level TEXT NOT NULL CHECK (level IN ('info','warning','error')),
  message TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_events_job_ts ON job_events(job_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_job_events_step ON job_events(step_id);
CREATE INDEX IF NOT EXISTS idx_job_events_level ON job_events(level);

CREATE OR REPLACE FUNCTION prevent_job_events_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'job_events is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS job_events_no_update ON job_events;
DROP TRIGGER IF EXISTS job_events_no_delete ON job_events;
CREATE TRIGGER job_events_no_update BEFORE UPDATE ON job_events
FOR EACH ROW EXECUTE FUNCTION prevent_job_events_mutation();
CREATE TRIGGER job_events_no_delete BEFORE DELETE ON job_events
FOR EACH ROW EXECUTE FUNCTION prevent_job_events_mutation();

-- Worker heartbeats
CREATE TABLE IF NOT EXISTS worker_heartbeats (
  worker_id TEXT PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_worker_heartbeats_site_last ON worker_heartbeats(site_id, last_seen DESC);

-- vCenter current-state caches
CREATE TABLE IF NOT EXISTS vcenter_clusters_current (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vcenter_id UUID NOT NULL REFERENCES vcenters(id) ON DELETE CASCADE,
  moid TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  UNIQUE(vcenter_id, moid)
);
CREATE INDEX IF NOT EXISTS idx_vcenter_clusters_vcenter ON vcenter_clusters_current(vcenter_id);
CREATE INDEX IF NOT EXISTS idx_vcenter_clusters_observed ON vcenter_clusters_current(observed_at);
CREATE INDEX IF NOT EXISTS idx_vcenter_clusters_hash ON vcenter_clusters_current(payload_hash);

CREATE TABLE IF NOT EXISTS vcenter_hosts_current (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vcenter_id UUID NOT NULL REFERENCES vcenters(id) ON DELETE CASCADE,
  cluster_moid TEXT,
  moid TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  UNIQUE(vcenter_id, moid)
);
CREATE INDEX IF NOT EXISTS idx_vcenter_hosts_vcenter ON vcenter_hosts_current(vcenter_id);
CREATE INDEX IF NOT EXISTS idx_vcenter_hosts_observed ON vcenter_hosts_current(observed_at);
CREATE INDEX IF NOT EXISTS idx_vcenter_hosts_hash ON vcenter_hosts_current(payload_hash);
CREATE INDEX IF NOT EXISTS idx_vcenter_hosts_cluster_moid ON vcenter_hosts_current(cluster_moid);

CREATE TABLE IF NOT EXISTS vcenter_vms_current (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vcenter_id UUID NOT NULL REFERENCES vcenters(id) ON DELETE CASCADE,
  host_moid TEXT,
  moid TEXT NOT NULL,
  uuid TEXT,
  payload_json JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  UNIQUE(vcenter_id, moid)
);
CREATE INDEX IF NOT EXISTS idx_vcenter_vms_vcenter ON vcenter_vms_current(vcenter_id);
CREATE INDEX IF NOT EXISTS idx_vcenter_vms_observed ON vcenter_vms_current(observed_at);
CREATE INDEX IF NOT EXISTS idx_vcenter_vms_hash ON vcenter_vms_current(payload_hash);
CREATE INDEX IF NOT EXISTS idx_vcenter_vms_host_moid ON vcenter_vms_current(host_moid);
