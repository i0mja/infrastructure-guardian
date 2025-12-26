import os
from functools import lru_cache
from typing import Optional

class Settings:
    def __init__(
        self,
        database_url: Optional[str] = None,
        db_pool_min_size: int = 1,
        db_pool_max_size: int = 10,
    ) -> None:
        self.database_url = database_url or os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/postgres",
        )
        self.db_pool_min_size = int(os.getenv("DB_POOL_MIN_SIZE", db_pool_min_size))
        self.db_pool_max_size = int(os.getenv("DB_POOL_MAX_SIZE", db_pool_max_size))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
