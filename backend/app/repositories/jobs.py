from typing import Any, Dict, List, Optional
from uuid import UUID

from psycopg import AsyncConnection

class JobRepository:
    async def list_jobs(self, conn: AsyncConnection, *, limit: int = 100) -> List[Dict[str, Any]]:
        cursor = await conn.execute(
            """
            SELECT * FROM jobs
            ORDER BY created_at DESC
            LIMIT %s
            """,
            (limit,),
        )
        return await cursor.fetchall()

    async def get_job_with_details(
        self, conn: AsyncConnection, job_id: UUID
    ) -> Optional[Dict[str, Any]]:
        job_cursor = await conn.execute("SELECT * FROM jobs WHERE id = %s", (job_id,))
        job = await job_cursor.fetchone()
        if job is None:
            return None

        steps_cursor = await conn.execute(
            """
            SELECT * FROM job_steps
            WHERE job_id = %s
            ORDER BY sequence ASC
            """,
            (job_id,),
        )
        steps = await steps_cursor.fetchall()

        events_cursor = await conn.execute(
            """
            SELECT * FROM job_events
            WHERE job_id = %s
            ORDER BY timestamp DESC
            LIMIT 200
            """,
            (job_id,),
        )
        events = await events_cursor.fetchall()

        job["steps"] = steps
        job["events"] = events
        return job

    async def create_vcenter_sync_job(
        self, conn: AsyncConnection, vcenter_id: UUID
    ) -> Optional[Dict[str, Any]]:
        vcenter_cursor = await conn.execute(
            "SELECT id, site_id, name FROM vcenters WHERE id = %s",
            (vcenter_id,),
        )
        vcenter = await vcenter_cursor.fetchone()
        if vcenter is None:
            return None

        job_cursor = await conn.execute(
            """
            INSERT INTO jobs (
                type, name, description, status, priority, site_id, target_type,
                target_ids, service_identity_id, initiated_by_user, approved_by_user,
                policy, scheduled_at, started_at, completed_at, progress,
                current_step, total_steps, external_task_ids
            )
            VALUES (
                'inventory_sync',
                %s,
                'Triggered via API',
                'pending',
                0,
                %s,
                'vcenter',
                ARRAY[%s]::text[],
                NULL,
                NULL,
                NULL,
                '{}',
                NULL,
                NULL,
                NULL,
                0,
                0,
                0,
                ARRAY[]::text[]
            )
            RETURNING *
            """,
            (f"Inventory sync: {vcenter['name']}", vcenter["site_id"], str(vcenter_id)),
        )
        job = await job_cursor.fetchone()
        return job

    async def get_queue_depth(self, conn: AsyncConnection) -> int:
        cursor = await conn.execute(
            """
            SELECT COUNT(*) AS depth
            FROM jobs
            WHERE status IN ('pending', 'scheduled')
            """
        )
        record = await cursor.fetchone()
        return int(record["depth"]) if record else 0

    async def latest_worker_heartbeat(
        self, conn: AsyncConnection
    ) -> Optional[Dict[str, Any]]:
        cursor = await conn.execute(
            """
            SELECT *
            FROM worker_heartbeats
            ORDER BY last_seen DESC
            LIMIT 1
            """
        )
        return await cursor.fetchone()


jobs = JobRepository()
