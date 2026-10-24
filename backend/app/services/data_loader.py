"""
backend/app/services/data_loader.py
===================================
Robust loader for Elexon BMRS cached datasets with memory caching.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional, Tuple
import pandas as pd

from backend.app.config import settings

logger = logging.getLogger("data_loader")

_cached_actuals: Optional[pd.DataFrame] = None
_cached_forecasts: Optional[pd.DataFrame] = None


def load_actuals(force_reload: bool = False) -> pd.DataFrame:
    """
    Load January 2026 actuals (FUELHH) with memory caching.
    Supports both Parquet and JSON.
    """
    global _cached_actuals
    if _cached_actuals is not None and not force_reload:
        return _cached_actuals

    if settings.ACTUALS_PARQUET.exists():
        logger.info("Loading actuals from Parquet: %s", settings.ACTUALS_PARQUET)
        df = pd.read_parquet(settings.ACTUALS_PARQUET)
    elif settings.ACTUALS_JSON.exists():
        logger.info("Loading actuals from JSON: %s", settings.ACTUALS_JSON)
        df = pd.read_json(settings.ACTUALS_JSON)
    else:
        raise FileNotFoundError(
            f"Actuals data not found at {settings.ACTUALS_PARQUET} or {settings.ACTUALS_JSON}. "
            "Please run `python scripts/fetch_data.py` first."
        )

    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    _cached_actuals = df
    return _cached_actuals


def load_forecasts(force_reload: bool = False) -> pd.DataFrame:
    """
    Load January 2026 forecasts (WINDFOR) with memory caching.
    Supports both Parquet and JSON.
    """
    global _cached_forecasts
    if _cached_forecasts is not None and not force_reload:
        return _cached_forecasts

    if settings.FORECASTS_PARQUET.exists():
        logger.info("Loading forecasts from Parquet: %s", settings.FORECASTS_PARQUET)
        df = pd.read_parquet(settings.FORECASTS_PARQUET)
    elif settings.FORECASTS_JSON.exists():
        logger.info("Loading forecasts from JSON: %s", settings.FORECASTS_JSON)
        df = pd.read_json(settings.FORECASTS_JSON)
    else:
        raise FileNotFoundError(
            f"Forecasts data not found at {settings.FORECASTS_PARQUET} or {settings.FORECASTS_JSON}. "
            "Please run `python scripts/fetch_data.py` first."
        )

    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    _cached_forecasts = df
    return _cached_forecasts


def get_data_counts() -> Tuple[int, int]:
    """Return record counts for loaded actuals and forecasts."""
    try:
        act = load_actuals()
        fc = load_forecasts()
        return len(act), len(fc)
    except Exception:
        return 0, 0
