"""
backend/app/config.py
=====================
Configuration management for UK Wind Forecast Evaluation Platform.
"""

from pathlib import Path


class Settings:
    PROJECT_NAME: str = "UK Day-Ahead Wind Forecast Evaluation Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    ACTUALS_PARQUET: Path = DATA_DIR / "actuals_jan_2026.parquet"
    ACTUALS_JSON: Path = DATA_DIR / "actuals_jan_2026.json"
    FORECASTS_PARQUET: Path = DATA_DIR / "forecasts_jan_2026.parquet"
    FORECASTS_JSON: Path = DATA_DIR / "forecasts_jan_2026.json"
    
    # Defaults
    DEFAULT_CUTOFF_TIME: str = "09:00"  # UK local time (GMT) on D-1
    DEFAULT_START_DATE: str = "2026-01-01"
    DEFAULT_END_DATE: str = "2026-01-31"


settings = Settings()
