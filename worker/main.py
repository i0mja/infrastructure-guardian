import asyncio
import signal
from datetime import datetime
from typing import Optional
from uuid import UUID

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from worker.config import get_settings

settings = get_settings()
pool: Optional[AsyncConnectionPool] = None
shutdown_event = asyncio.Event()


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
                SELECT id
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

            await conn.execute(
                """
                INSERT INTO job_events (
                    job_id, step_id, timestamp, level, message, data, created_at
                )
                VALUES (%s, %s, now(), 'info', 'Job leased by worker', jsonb_build_object('worker_id', %s), now())
                """,
                (job_id, step_id, settings.worker_id),
            )

            return {"job_id": job_id, "step_id": step_id}


async def worker_loop() -> None:
    await init_pool()
    while not shutdown_event.is_set():
        await write_heartbeat()
        lease_info = await lease_pending_job()
        if lease_info:
            # Placeholder for future execution logic
            pass
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
