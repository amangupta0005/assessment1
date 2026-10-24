"""
scripts/fetch_data.py
======================
Production data ingestion script for UK National Grid Wind Actuals & Forecasts.
Pulls from official Elexon BMRS API (v1) stream endpoints:
  - Actuals: /datasets/FUELHH/stream (filtered by fuelType=WIND)
  - Forecasts: /datasets/WINDFOR/stream

Features:
  - Temporal chunking (7-day intervals) to prevent timeouts and payload truncation
  - Exponential backoff retry logic with jitter
  - Response validation and deduplication
  - Dual persistence (Parquet for high performance, JSON for human/inspection portability)
  - Strict scope: Targets delivery days in January 2026
"""

from __future__ import annotations

import argparse
import json
import logging
import random
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List
import urllib.parse
import urllib.request
import urllib.error

import pandas as pd

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("fetch_data")

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# Temporal bounds
# Forecasts published from late Dec 2025 cover Jan 1 2026 delivery
FORECAST_PUBLISH_START = datetime(2025, 12, 28, 0, 0, 0, tzinfo=timezone.utc)
FORECAST_PUBLISH_END = datetime(2026, 2, 1, 0, 0, 0, tzinfo=timezone.utc)

# Actuals published for January 2026 delivery
ACTUALS_PUBLISH_START = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
ACTUALS_PUBLISH_END = datetime(2026, 2, 1, 2, 0, 0, tzinfo=timezone.utc)

TARGET_START_MIN = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
TARGET_START_MAX = datetime(2026, 1, 31, 23, 59, 59, tzinfo=timezone.utc)


def fetch_with_retry(
    url: str,
    max_retries: int = 5,
    initial_delay: float = 1.0,
    timeout: float = 30.0,
) -> List[Dict[str, Any]]:
    """
    Fetch JSON array from URL with exponential backoff and jitter.

    Args:
        url: Full request URL
        max_retries: Maximum number of retry attempts
        initial_delay: Initial sleep delay in seconds
        timeout: Socket timeout in seconds

    Returns:
        Parsed list of records
    """
    delay = initial_delay
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "UK-Wind-Evaluation-Platform/1.0",
            "Accept": "application/json",
        },
    )

    for attempt in range(1, max_retries + 1):
        try:
            logger.debug("Requesting (attempt %d/%d): %s", attempt, max_retries, url)
            with urllib.request.urlopen(req, timeout=timeout) as response:
                if response.status != 200:
                    raise urllib.error.HTTPError(
                        url, response.status, f"Unexpected HTTP status {response.status}", response.headers, None
                    )
                raw_data = response.read().decode("utf-8")
                records = json.loads(raw_data)
                if not isinstance(records, list):
                    raise ValueError(f"Expected JSON list, received {type(records)}")
                return records

        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            logger.warning("Attempt %d/%d failed: %s", attempt, max_retries, str(exc))
            if attempt == max_retries:
                logger.error("Exhausted all %d retries for %s", max_retries, url)
                raise
            jitter = random.uniform(0.1, 0.5)
            sleep_time = delay + jitter
            time.sleep(sleep_time)
            delay *= 2.0

    return []


def fetch_fuelhh_actuals(
    start_dt: datetime,
    end_dt: datetime,
    chunk_days: int = 7,
) -> pd.DataFrame:
    """
    Fetch FUELHH stream dataset filtered to WIND in chunks.
    """
    logger.info("Starting FUELHH actuals ingestion [%s to %s]", start_dt.isoformat(), end_dt.isoformat())
    current_start = start_dt
    all_records: List[Dict[str, Any]] = []

    while current_start < end_dt:
        current_end = min(current_start + timedelta(days=chunk_days), end_dt)
        params = {
            "publishDateTimeFrom": current_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "publishDateTimeTo": current_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "fuelType": "WIND",
        }
        query_string = urllib.parse.urlencode(params)
        url = f"{BASE_URL}/datasets/FUELHH/stream?{query_string}"

        logger.info(
            "Fetching FUELHH chunk: %s -> %s",
            params["publishDateTimeFrom"],
            params["publishDateTimeTo"],
        )
        chunk_data = fetch_with_retry(url)
        logger.info("Received %d FUELHH records for chunk", len(chunk_data))
        all_records.extend(chunk_data)
        current_start = current_end

    if not all_records:
        raise RuntimeError("No FUELHH actuals records retrieved from Elexon BMRS API")

    df = pd.DataFrame(all_records)

    # Standardize and filter
    required_cols = ["startTime", "publishTime", "generation"]
    for col in required_cols:
        if col not in df.columns:
            raise KeyError(f"Expected column {col} missing from FUELHH response")

    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")

    # Filter strictly to delivery in January 2026
    df = df[(df["startTime"] >= TARGET_START_MIN) & (df["startTime"] <= TARGET_START_MAX)]
    
    # Keep only fuelType WIND if present
    if "fuelType" in df.columns:
        df = df[df["fuelType"] == "WIND"]

    # Deduplicate by startTime, keeping latest publishTime if multiple
    df = df.sort_values(by=["startTime", "publishTime"]).drop_duplicates(subset=["startTime"], keep="last")
    df = df.sort_values(by="startTime").reset_index(drop=True)

    logger.info("Cleaned FUELHH actuals count for Jan 2026: %d periods", len(df))
    return df


def fetch_windfor_forecasts(
    start_dt: datetime,
    end_dt: datetime,
    chunk_days: int = 5,
) -> pd.DataFrame:
    """
    Fetch WINDFOR stream dataset in chunks.
    """
    logger.info("Starting WINDFOR forecasts ingestion [%s to %s]", start_dt.isoformat(), end_dt.isoformat())
    current_start = start_dt
    all_records: List[Dict[str, Any]] = []

    while current_start < end_dt:
        current_end = min(current_start + timedelta(days=chunk_days), end_dt)
        params = {
            "publishDateTimeFrom": current_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "publishDateTimeTo": current_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        query_string = urllib.parse.urlencode(params)
        url = f"{BASE_URL}/datasets/WINDFOR/stream?{query_string}"

        logger.info(
            "Fetching WINDFOR chunk: %s -> %s",
            params["publishDateTimeFrom"],
            params["publishDateTimeTo"],
        )
        chunk_data = fetch_with_retry(url)
        logger.info("Received %d WINDFOR records for chunk", len(chunk_data))
        all_records.extend(chunk_data)
        current_start = current_end

    if not all_records:
        raise RuntimeError("No WINDFOR forecasts retrieved from Elexon BMRS API")

    df = pd.DataFrame(all_records)

    required_cols = ["startTime", "publishTime", "generation"]
    for col in required_cols:
        if col not in df.columns:
            raise KeyError(f"Expected column {col} missing from WINDFOR response")

    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")

    # Filter forecasts whose target startTime is within January 2026
    df = df[(df["startTime"] >= TARGET_START_MIN) & (df["startTime"] <= TARGET_START_MAX)]

    # Deduplicate identical (startTime, publishTime) entries
    df = df.drop_duplicates(subset=["startTime", "publishTime"]).sort_values(by=["startTime", "publishTime"]).reset_index(drop=True)

    logger.info("Cleaned WINDFOR forecasts targeting Jan 2026: %d records", len(df))
    return df


def save_dataset(df: pd.DataFrame, base_name: str, target_dir: Path) -> None:
    """
    Save DataFrame in both Parquet and JSON formats.
    """
    target_dir.mkdir(parents=True, exist_ok=True)
    parquet_path = target_dir / f"{base_name}.parquet"
    json_path = target_dir / f"{base_name}.json"

    # Save Parquet
    df.to_parquet(parquet_path, engine="pyarrow", index=False)
    logger.info("Saved Parquet: %s (%.2f KB)", parquet_path, parquet_path.stat().st_size / 1024)

    # Save JSON with ISO string timestamps
    df_json = df.copy()
    for col in df_json.columns:
        if pd.api.types.is_datetime64_any_dtype(df_json[col]):
            df_json[col] = df_json[col].dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(df_json.to_dict(orient="records"), f, indent=2)
    logger.info("Saved JSON: %s (%.2f KB)", json_path, json_path.stat().st_size / 1024)


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch and cache Elexon BMRS January 2026 wind data.")
    parser.add_argument("--output-dir", type=str, default=str(DATA_DIR), help="Output directory for data files")
    args = parser.parse_args()

    out_dir = Path(args.output_dir)
    logger.info("Target data directory: %s", out_dir)

    try:
        # 1. Actuals
        df_actuals = fetch_fuelhh_actuals(ACTUALS_PUBLISH_START, ACTUALS_PUBLISH_END)
        save_dataset(df_actuals, "actuals_jan_2026", out_dir)

        # 2. Forecasts
        df_forecasts = fetch_windfor_forecasts(FORECAST_PUBLISH_START, FORECAST_PUBLISH_END)
        save_dataset(df_forecasts, "forecasts_jan_2026", out_dir)

        logger.info("Data ingestion completed successfully.")
        return 0

    except Exception as exc:
        logger.exception("Data ingestion failed: %s", exc)
        return 1


if __name__ == "__main__":
    sys.exit(main())
