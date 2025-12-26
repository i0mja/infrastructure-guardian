from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field
from psycopg import AsyncConnection

from ...db import get_db
from ...repositories.inventory import inventory
from ...repositories.jobs import jobs
from ...repositories.vcenters import vcenters

router = APIRouter()


class VCenterCreate(BaseModel):
    site_id: Optional[UUID] = Field(None, description="Owning site id")
    name: str
    fqdn: str
    version: Optional[str] = None
    status: str = "connected"


@router.post("/vcenters")
async def create_vcenter_endpoint(
    payload: VCenterCreate, conn: AsyncConnection = Depends(get_db)
) -> Dict[str, Any]:
    record = await vcenters.create_vcenter(
        conn,
        site_id=payload.site_id,
        name=payload.name,
        fqdn=payload.fqdn,
        version=payload.version,
        status=payload.status,
    )
    return {"data": jsonable_encoder(record)}


@router.post("/vcenters/{vcenter_id}/sync")
async def create_vcenter_sync_job_endpoint(
    vcenter_id: UUID, conn: AsyncConnection = Depends(get_db)
) -> Dict[str, Any]:
    job = await jobs.create_vcenter_sync_job(conn, vcenter_id)
    if job is None:
        raise HTTPException(status_code=404, detail="vCenter not found")
    return {"data": jsonable_encoder(job)}


@router.get("/jobs")
async def list_jobs_endpoint(
    limit: int = Query(100, ge=1, le=500),
    conn: AsyncConnection = Depends(get_db),
) -> Dict[str, Any]:
    records = await jobs.list_jobs(conn, limit=limit)
    return {"data": jsonable_encoder(records)}


@router.get("/jobs/{job_id}")
async def get_job_endpoint(
    job_id: UUID, conn: AsyncConnection = Depends(get_db)
) -> Dict[str, Any]:
    record = await jobs.get_job_with_details(conn, job_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"data": jsonable_encoder(record)}


@router.get("/inventory/vms")
async def list_vms_endpoint(
    vcenter_id: Optional[UUID] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    conn: AsyncConnection = Depends(get_db),
) -> Dict[str, Any]:
    records = await inventory.list_vms(conn, vcenter_id=vcenter_id, limit=limit, offset=offset)
    return {"data": jsonable_encoder(records)}


@router.get("/operator/health")
async def operator_health_endpoint(
    conn: AsyncConnection = Depends(get_db),
) -> Dict[str, Any]:
    heartbeat = await jobs.latest_worker_heartbeat(conn)
    queue_depth = await jobs.get_queue_depth(conn)
    return {
        "data": {
            "last_worker_heartbeat": jsonable_encoder(heartbeat),
            "queue_depth": queue_depth,
        }
    }


@router.get("/health")
async def health_endpoint(conn: AsyncConnection = Depends(get_db)) -> Dict[str, Any]:
    try:
        await conn.execute("SELECT 1")
    except Exception as exc:  # noqa: B902
        raise HTTPException(status_code=503, detail=f"database unavailable: {exc}")

    jobs_cursor = await conn.execute("SELECT COUNT(*) AS total_jobs FROM jobs")
    jobs_count_row = await jobs_cursor.fetchone()
    vcenters_cursor = await conn.execute("SELECT COUNT(*) AS total_vcenters FROM vcenters")
    vcenters_count_row = await vcenters_cursor.fetchone()

    return {
        "data": {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "jobs": jobs_count_row.get("total_jobs", 0) if jobs_count_row else 0,
            "vcenters": vcenters_count_row.get("total_vcenters", 0) if vcenters_count_row else 0,
        }
    }
