from fastapi import FastAPI

from .api.v1.routes import router as api_router
from .db import close_pool, init_pool

app = FastAPI(title="EIO Backend API")

app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def on_startup() -> None:
    await init_pool()


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await close_pool()
