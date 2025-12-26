from typing import Any, Dict, List, Optional
from uuid import UUID

from psycopg import AsyncConnection

class InventoryRepository:
    async def list_vms(
        self,
        conn: AsyncConnection,
        *,
        vcenter_id: Optional[UUID] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        query = [
            "SELECT * FROM vcenter_vms_current",
        ]
        params = []
        if vcenter_id:
            query.append("WHERE vcenter_id = %s")
            params.append(vcenter_id)

        query.append("ORDER BY observed_at DESC LIMIT %s OFFSET %s")
        params.extend([limit, offset])

        sql = " ".join(query)
        cursor = await conn.execute(sql, tuple(params))
        return await cursor.fetchall()


inventory = InventoryRepository()
