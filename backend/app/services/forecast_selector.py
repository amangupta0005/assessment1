"""
backend/app/services/forecast_selector.py
=========================================
Core Day-Ahead Forecast Selection Engine.
Guarantees:
  1. Strict anti-leakage: publishTime <= Cutoff(D-1 at configured HH:MM).
  2. Latest available forecast selection: max(publishTime) among eligible.
  3. Clean handling of missing forecasts.
  4. Precise granularity aggregation (hourly mean of settlement periods).
"""

from __future__ import annotations

import logging
from datetime import datetime, time, timedelta, timezone
from typing import Optional, Tuple
import numpy as np
import pandas as pd

from backend.app.services.data_loader import load_actuals, load_forecasts

logger = logging.getLogger("forecast_selector")


def parse_cutoff_time(cutoff_str: str) -> time:
    """Parse HH:MM string to datetime.time."""
    parts = cutoff_str.strip().split(":")
    if len(parts) != 2:
        raise ValueError(f"Invalid cutoff time format: '{cutoff_str}'. Expected 'HH:MM'.")
    hour = int(parts[0])
    minute = int(parts[1])
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise ValueError(f"Cutoff time out of bounds: hour={hour}, minute={minute}")
    return time(hour, minute, 0)


def build_evaluation_dataset(
    cutoff_time_str: str = "09:00",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    granularity: str = "hourly",  # "hourly" (default) or "exact"
) -> pd.DataFrame:
    """
    Build the joined evaluation dataset matching each target delivery period to its
    latest pre-cutoff forecast.

    Args:
        cutoff_time_str: "HH:MM" day-ahead decision cutoff on D-1 (e.g. "09:00").
        start_date: "YYYY-MM-DD" start filter for delivery date.
        end_date: "YYYY-MM-DD" end filter for delivery date.
        granularity: "hourly" (aggregates :00 and :30 actuals) or "exact" (:00 only).

    Returns:
        pd.DataFrame containing matched evaluation points with strict anti-leakage guarantees.
    """
    cutoff_t = parse_cutoff_time(cutoff_time_str)

    df_act_raw = load_actuals()
    df_fc_raw = load_forecasts()

    # 1. Harmonize Actuals
    if granularity == "hourly":
        # Create an hour floor for each actual reading
        df_act = df_act_raw.copy()
        df_act["target_hour"] = df_act["startTime"].dt.floor("h")
        
        # Group by target_hour and compute the arithmetic mean generation
        # (each hour contains two 30-min settlement periods)
        df_act_hourly = (
            df_act.groupby("target_hour")
            .agg(
                actual_mw=("generation", "mean"),
                periods_count=("generation", "count"),
            )
            .reset_index()
            .rename(columns={"target_hour": "target_start_time"})
        )
    else:
        # Exact :00 matching
        df_act = df_act_raw.copy()
        df_act_hourly = (
            df_act[df_act["startTime"].dt.minute == 0][["startTime", "generation"]]
            .rename(columns={"startTime": "target_start_time", "generation": "actual_mw"})
            .reset_index(drop=True)
        )

    # 2. Filter target date range if requested
    if start_date:
        start_dt = pd.to_datetime(start_date, utc=True)
        df_act_hourly = df_act_hourly[df_act_hourly["target_start_time"] >= start_dt]
    if end_date:
        end_dt = pd.to_datetime(end_date, utc=True) + pd.Timedelta(days=1) - pd.Timedelta(nanoseconds=1)
        df_act_hourly = df_act_hourly[df_act_hourly["target_start_time"] <= end_dt]

    df_act_hourly = df_act_hourly.sort_values(by="target_start_time").reset_index(drop=True)

    # 3. For each target delivery time, compute Day D-1 Cutoff and find latest forecast
    results = []
    
    # Sort forecasts by publishTime descending so first match is latest
    df_fc_sorted = df_fc_raw.sort_values(by="publishTime", ascending=False)

    # Group forecasts by target startTime for fast O(1) indexed lookup
    fc_by_target = {}
    for st, group in df_fc_sorted.groupby("startTime"):
        fc_by_target[st] = group[["publishTime", "generation"]].to_dict(orient="records")

    for _, row in df_act_hourly.iterrows():
        target_st = row["target_start_time"]
        actual_val = float(row["actual_mw"])
        
        target_date = target_st.date()
        cutoff_date = target_date - timedelta(days=1)
        cutoff_dt = datetime.combine(cutoff_date, cutoff_t, tzinfo=timezone.utc)
        cutoff_pd = pd.Timestamp(cutoff_dt)

        matched_fc_val: Optional[float] = None
        matched_pub_time: Optional[pd.Timestamp] = None
        status = "MISSING_FORECAST"

        cands = fc_by_target.get(target_st, [])
        for f in cands:
            pub_t = f["publishTime"]
            if pub_t <= cutoff_pd:
                # Anti-leakage verified: greatest publishTime <= cutoff_dt
                matched_fc_val = float(f["generation"])
                matched_pub_time = pub_t
                status = "MATCHED"
                break

        horizon_hours: Optional[float] = None
        error_mw: Optional[float] = None
        abs_error_mw: Optional[float] = None
        shortfall_mw: Optional[float] = None
        pct_error: Optional[float] = None

        if status == "MATCHED" and matched_fc_val is not None and matched_pub_time is not None:
            horizon_hours = (target_st - matched_pub_time).total_seconds() / 3600.0
            error_mw = actual_val - matched_fc_val  # Signed error: Actual - Forecast
            abs_error_mw = abs(error_mw)
            # Shortfall: How much wind fell short of forecast (downside deficit)
            shortfall_mw = max(0.0, matched_fc_val - actual_val)
            if actual_val > 0:
                pct_error = (abs_error_mw / actual_val) * 100.0

        results.append({
            "target_start_time": target_st,
            "settlement_date": target_date.strftime("%Y-%m-%d"),
            "hour_of_day": target_st.hour,
            "actual_mw": actual_val,
            "forecast_mw": matched_fc_val,
            "publish_time": matched_pub_time,
            "cutoff_time": cutoff_pd,
            "horizon_hours": horizon_hours,
            "error_mw": error_mw,
            "abs_error_mw": abs_error_mw,
            "shortfall_mw": shortfall_mw,
            "percentage_error": pct_error,
            "status": status,
        })

    df_out = pd.DataFrame(results)
    return df_out
