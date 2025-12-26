import os
from functools import lru_cache
from typing import Optional

class Settings:
    def __init__(
        self,
        database_url: Optional[str] = None,
        worker_id: Optional[str] = None,
        heartbeat_interval_seconds: int = 10,
    ) -> None:
        self.database_url = database_url or os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/postgres",
        )
        self.worker_id = worker_id or os.getenv("WORKER_ID", os.getenv("HOSTNAME", "worker-1"))
        self.heartbeat_interval_seconds = int(
            os.getenv("HEARTBEAT_INTERVAL_SECONDS", heartbeat_interval_seconds)
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
