from typing import AsyncGenerator, Optional

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from .config import get_settings

pool: Optional[AsyncConnectionPool] = None


async def init_pool() -> AsyncConnectionPool:
    global pool
    settings = get_settings()
    if pool is None:
        pool = AsyncConnectionPool(
            conninfo=settings.database_url,
            min_size=settings.db_pool_min_size,
            max_size=settings.db_pool_max_size,
            open=False,
        )
    if pool.closed:
        await pool.open()
    return pool


async def close_pool() -> None:
    if pool is not None and not pool.closed:
        await pool.close()


async def get_db() -> AsyncGenerator:
    current_pool = await init_pool()
    async with current_pool.connection() as conn:
        conn.row_factory = dict_row
        conn.autocommit = True
        yield conn
