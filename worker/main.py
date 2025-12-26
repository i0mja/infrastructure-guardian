import asyncio
import hashlib
import json
import random
import signal
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from worker.config import get_settings

settings = get_settings()
pool: Optional[AsyncConnectionPool] = None
shutdown_event = asyncio.Event()


def _hash_payload(payload: Dict[str, Any]) -> str:
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


async def init_pool() -> AsyncConnectionPool:
    global pool
    if pool is None:
        pool = AsyncConnectionPool(
            conninfo=settings.database_url,
            min_size=1,
            max_size=5,
            open=True,
            kwargs={"row_factory": dict_row},
        )
    if pool.closed:
        await pool.open()
    return pool


async def append_event(
    conn,
    job_id: UUID,
    step_id: Optional[UUID],
    level: str,
    message: str,
    data: Optional[Dict[str, Any]] = None,
) -> None:
    await conn.execute(
        """
        INSERT INTO job_events (
            job_id, step_id, timestamp, level, message, data, created_at
        )
        VALUES (%s, %s, now(), %s, %s, %s, now())
        """,
        (job_id, step_id, level, message, json.dumps(data) if data else None),
    )


async def write_heartbeat() -> None:
    conn_pool = await init_pool()
    async with conn_pool.connection() as conn:
        await conn.execute(
            """
            INSERT INTO worker_heartbeats (worker_id, last_seen, payload, updated_at)
            VALUES (%s, now(), jsonb_build_object('status', 'idle'), now())
            ON CONFLICT (worker_id)
            DO UPDATE SET last_seen = EXCLUDED.last_seen,
                          payload = EXCLUDED.payload,
                          updated_at = EXCLUDED.updated_at
            """,
            (settings.worker_id,),
        )
        await conn.commit()


async def lease_pending_job() -> Optional[dict]:
    conn_pool = await init_pool()
    async with conn_pool.connection() as conn:
        async with conn.transaction():
            cursor = await conn.execute(
                """
                SELECT id, type, target_ids
                FROM jobs
                WHERE status IN ('pending', 'scheduled')
                ORDER BY created_at ASC
                FOR UPDATE SKIP LOCKED
                LIMIT 1
                """
            )
            row = await cursor.fetchone()
            if row is None:
                return None
            job_id = row["id"]
            job_type = row["type"]
            target_ids = row.get("target_ids") or []

            await conn.execute(
                """
                UPDATE jobs
                SET status = 'running', started_at = COALESCE(started_at, now()), updated_at = now()
                WHERE id = %s
                """,
                (job_id,),
            )

            step_cursor = await conn.execute(
                """
                INSERT INTO job_steps (
                    job_id, sequence, name, status, started_at, created_at
                )
                VALUES (%s, 1, 'Lease and queue job', 'running', now(), now())
                RETURNING id
                """,
                (job_id,),
            )
            step_row = await step_cursor.fetchone()
            step_id: Optional[UUID] = step_row["id"] if step_row else None

            await append_event(
                conn,
                job_id,
                step_id,
                "info",
                "Job leased by worker",
                {"worker_id": settings.worker_id},
            )

            return {"job_id": job_id, "step_id": step_id, "type": job_type, "target_ids": target_ids}


async def upsert_clusters(conn, vcenter_id: UUID, records: Dict[str, Dict[str, Any]]) -> None:
    for moid, payload in records.items():
        payload_hash = _hash_payload(payload)
        await conn.execute(
            """
            INSERT INTO vcenter_clusters_current (vcenter_id, moid, payload_json, payload_hash, observed_at)
            VALUES (%s, %s, %s, %s, now())
            ON CONFLICT (vcenter_id, moid)
            DO UPDATE SET payload_json = EXCLUDED.payload_json,
                          payload_hash = EXCLUDED.payload_hash,
                          observed_at = EXCLUDED.observed_at
            """,
            (str(vcenter_id), moid, json.dumps(payload), payload_hash),
        )


async def upsert_hosts(conn, vcenter_id: UUID, records: Dict[str, Dict[str, Any]]) -> None:
    for moid, payload in records.items():
        payload_hash = _hash_payload(payload)
        await conn.execute(
            """
            INSERT INTO vcenter_hosts_current (vcenter_id, cluster_moid, moid, payload_json, payload_hash, observed_at)
            VALUES (%s, %s, %s, %s, %s, now())
            ON CONFLICT (vcenter_id, moid)
            DO UPDATE SET payload_json = EXCLUDED.payload_json,
                          payload_hash = EXCLUDED.payload_hash,
                          observed_at = EXCLUDED.observed_at,
                          cluster_moid = EXCLUDED.cluster_moid
            """,
            (str(vcenter_id), payload.get("cluster_moid"), moid, json.dumps(payload), payload_hash),
        )


async def upsert_vms(conn, vcenter_id: UUID, records: Dict[str, Dict[str, Any]]) -> None:
    for moid, payload in records.items():
        payload_hash = _hash_payload(payload)
        await conn.execute(
            """
            INSERT INTO vcenter_vms_current (vcenter_id, host_moid, moid, uuid, payload_json, payload_hash, observed_at)
            VALUES (%s, %s, %s, %s, %s, %s, now())
            ON CONFLICT (vcenter_id, moid)
            DO UPDATE SET payload_json = EXCLUDED.payload_json,
                          payload_hash = EXCLUDED.payload_hash,
                          observed_at = EXCLUDED.observed_at,
                          host_moid = EXCLUDED.host_moid,
                          uuid = EXCLUDED.uuid
            """,
            (
                str(vcenter_id),
                payload.get("host_moid"),
                moid,
                payload.get("uuid"),
                json.dumps(payload),
                payload_hash,
            ),
        )


async def process_vcenter_inventory_job(job: dict) -> None:
    job_id = job["job_id"]
    step_id = job["step_id"]
    targets = job.get("target_ids") or []
    if not targets:
        # No target; mark failed
        await mark_job_failed(job_id, step_id, "Missing vcenter target id")
        return

    vcenter_id = UUID(targets[0])
    conn_pool = await init_pool()
    async with conn_pool.connection() as conn:
        try:
            await append_event(conn, job_id, step_id, "info", "Starting vCenter inventory sync", {"vcenter_id": str(vcenter_id)})
            random.seed(vcenter_id.int & 0xFFFFFFFF)

            cluster_count = 2 + random.randint(0, 2)
            host_count = 3 + random.randint(0, 3)
            vm_count = 5 + random.randint(0, 10)

            clusters: Dict[str, Dict[str, Any]] = {}
            for idx in range(cluster_count):
                moid = f"domain-c{idx+1}"
                payload = {
                    "name": f"Cluster-{idx+1}",
                    "moid": moid,
                    "cpu_usage_percent": random.randint(20, 80),
                    "memory_usage_percent": random.randint(20, 80),
                    "drs_enabled": True,
                    "ha_enabled": bool(random.randint(0, 1)),
                    "observed_at": datetime.utcnow().isoformat() + "Z",
                }
                clusters[moid] = payload

            await upsert_clusters(conn, vcenter_id, clusters)
            await append_event(conn, job_id, step_id, "info", "Clusters synced", {"count": len(clusters)})
            await conn.execute("UPDATE jobs SET progress = 25 WHERE id = %s", (job_id,))
            await conn.commit()
            await asyncio.sleep(1)

            hosts: Dict[str, Dict[str, Any]] = {}
            for idx in range(host_count):
                cluster_moid = random.choice(list(clusters.keys()))
                moid = f"host-{idx+1}"
                payload = {
                    "name": f"esxi-{idx+1}.example.local",
                    "moid": moid,
                    "cluster_moid": cluster_moid,
                    "model": "PowerEdge R750",
                    "version": "8.0.0",
                    "power_state": "on",
                    "observed_at": datetime.utcnow().isoformat() + "Z",
                }
                hosts[moid] = payload

            await upsert_hosts(conn, vcenter_id, hosts)
            await append_event(conn, job_id, step_id, "info", "Hosts synced", {"count": len(hosts)})
            await conn.execute("UPDATE jobs SET progress = 60 WHERE id = %s", (job_id,))
            await conn.commit()
            await asyncio.sleep(1)

            vms: Dict[str, Dict[str, Any]] = {}
            for idx in range(vm_count):
                host_moid = random.choice(list(hosts.keys()))
                moid = f"vm-{idx+1}"
                payload = {
                    "name": f"vm-{idx+1:03d}.example.local",
                    "moid": moid,
                    "host_moid": host_moid,
                    "uuid": str(UUID(int=(vcenter_id.int + idx) & ((1 << 128) - 1))),
                    "power_state": random.choice(["poweredOn", "poweredOff", "suspended"]),
                    "vcpu": random.randint(1, 16),
                    "memory_mb": random.choice([2048, 4096, 8192, 16384]),
                    "observed_at": datetime.utcnow().isoformat() + "Z",
                }
                vms[moid] = payload

            await upsert_vms(conn, vcenter_id, vms)
            await append_event(conn, job_id, step_id, "info", "VMs synced", {"count": len(vms)})
            await conn.execute("UPDATE jobs SET progress = 90 WHERE id = %s", (job_id,))
            await conn.commit()
            await asyncio.sleep(1)

            await conn.execute(
                """
                UPDATE job_steps
                SET status = 'completed', completed_at = now()
                WHERE id = %s
                """,
                (step_id,),
            )
            await conn.execute(
                """
                UPDATE jobs
                SET status = 'completed', completed_at = now(), progress = 100, updated_at = now()
                WHERE id = %s
                """,
                (job_id,),
            )
            await append_event(conn, job_id, step_id, "info", "vCenter inventory sync completed", {"vcenter_id": str(vcenter_id)})
            await conn.commit()
        except Exception as exc:  # noqa: B902
            await conn.execute(
                """
                UPDATE job_steps
                SET status = 'failed', completed_at = now(), error = %s
                WHERE id = %s
                """,
                (str(exc), step_id),
            )
            await conn.execute(
                """
                UPDATE jobs
                SET status = 'failed', completed_at = now(), updated_at = now()
                WHERE id = %s
                """,
                (job_id,),
            )
            await append_event(
                conn,
                job_id,
                step_id,
                "error",
                "vCenter inventory sync failed",
                {"error": str(exc)},
            )
            await conn.commit()


async def mark_job_failed(job_id: UUID, step_id: Optional[UUID], message: str) -> None:
    conn_pool = await init_pool()
    async with conn_pool.connection() as conn:
        await conn.execute(
            """
            UPDATE job_steps
            SET status = 'failed', completed_at = now(), error = %s
            WHERE id = %s
            """,
            (message, step_id),
        )
        await conn.execute(
            """
            UPDATE jobs
            SET status = 'failed', completed_at = now(), updated_at = now()
            WHERE id = %s
            """,
            (job_id,),
        )
        await append_event(conn, job_id, step_id, "error", message)
        await conn.commit()


async def worker_loop() -> None:
    await init_pool()
    while not shutdown_event.is_set():
        await write_heartbeat()
        lease_info = await lease_pending_job()
        if lease_info:
            if lease_info["type"] == "vcenter_inventory_sync":
                await process_vcenter_inventory_job(lease_info)
            else:
                await mark_job_failed(
                    lease_info["job_id"], lease_info["step_id"], f"Unsupported job type {lease_info['type']}"
                )
        try:
            await asyncio.wait_for(
                shutdown_event.wait(),
                timeout=settings.heartbeat_interval_seconds,
            )
        except asyncio.TimeoutError:
            continue


def request_shutdown() -> None:
    shutdown_event.set()


def register_signal_handlers() -> None:
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, request_shutdown)


async def main() -> None:
    register_signal_handlers()
    await worker_loop()
    if pool and not pool.closed:
        await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
