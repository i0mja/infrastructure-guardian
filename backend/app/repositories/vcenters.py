from typing import Any, Dict, Optional
from uuid import UUID

from psycopg import AsyncConnection

class VCenterRepository:
    async def create_vcenter(
        self,
        conn: AsyncConnection,
        *,
        site_id: Optional[UUID],
        name: str,
        fqdn: str,
        version: Optional[str] = None,
        status: str = "connected",
    ) -> Dict[str, Any]:
        cursor = await conn.execute(
            """
            INSERT INTO vcenters (site_id, name, fqdn, version, status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
            """,
            (site_id, name, fqdn, version, status),
        )
        record = await cursor.fetchone()
        return record


vcenters = VCenterRepository()
