"""
backend/app/config.py
=====================
Configuration management for UK Wind Forecast Evaluation Platform.
"""

from pathlib import Path
import os


class Settings:
    PROJECT_NAME: str = "WindWatchGB"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Defaults
    DEFAULT_CUTOFF_TIME: str = "09:00"  # UK local time (GMT) on D-1
    DEFAULT_START_DATE: str = "2026-01-01"
    DEFAULT_END_DATE: str = "2026-01-31"

    @property
    def BASE_DIR(self) -> Path:
        return Path(__file__).resolve().parent.parent.parent

    @property
    def DATA_DIR(self) -> Path:
        candidates = [
            self.BASE_DIR / "data",
            Path.cwd() / "data",
            Path("/var/task/data"),
            Path("/var/task/api/data"),
            Path(__file__).resolve().parent.parent / "data",
        ]
        for c in candidates:
            if c.exists() and ((c / "actuals_jan_2026.parquet").exists() or (c / "actuals_jan_2026.json").exists()):
                return c
        return self.BASE_DIR / "data"

    @property
    def ACTUALS_PARQUET(self) -> Path:
        return self.DATA_DIR / "actuals_jan_2026.parquet"

    @property
    def ACTUALS_JSON(self) -> Path:
        return self.DATA_DIR / "actuals_jan_2026.json"

    @property
    def FORECASTS_PARQUET(self) -> Path:
        return self.DATA_DIR / "forecasts_jan_2026.parquet"

    @property
    def FORECASTS_JSON(self) -> Path:
        return self.DATA_DIR / "forecasts_jan_2026.json"


settings = Settings()
