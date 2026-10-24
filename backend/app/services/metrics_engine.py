"""
backend/app/services/metrics_engine.py
======================================
Comprehensive quantitative metrics engine for wind forecast evaluation.
Includes:
  - Bias (Mean Signed Error), MAE, RMSE, Guarded MAPE, WAPE
  - Percentiles (P50, P90, P95) of Absolute Error
  - Buyer Downside Shortfall Risk & Thermal Reserve Buffer (MW)
  - Hourly error profiles (0-23)
  - Horizon lead-time bucket analytics
  - Frequency distribution histograms
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

from backend.app.models.schemas import (
    DistributionBin,
    DistributionResponse,
    HorizonBucketSummary,
    HourlyProfile,
    OverallSummaryKPIs,
)

logger = logging.getLogger("metrics_engine")


def calculate_overall_kpis(df: pd.DataFrame) -> OverallSummaryKPIs:
    """
    Compute aggregate key performance indicators from matched evaluation DataFrame.
    """
    total_periods = len(df)
    matched_df = df[df["status"] == "MATCHED"].copy()
    matched_periods = len(matched_df)
    missing_periods = total_periods - matched_periods

    completeness_pct = (matched_periods / total_periods * 100.0) if total_periods > 0 else 0.0

    if matched_periods == 0:
        return OverallSummaryKPIs(
            total_periods=total_periods,
            matched_periods=0,
            missing_periods=missing_periods,
            data_completeness_pct=completeness_pct,
            mean_actual_mw=0.0,
            mean_forecast_mw=0.0,
            bias_mw=0.0,
            mae_mw=0.0,
            rmse_mw=0.0,
            mape_pct=None,
            wape_pct=0.0,
            p50_error_mw=0.0,
            p90_error_mw=0.0,
            p95_error_mw=0.0,
            max_error_mw=0.0,
            p90_shortfall_buffer_mw=0.0,
            p95_shortfall_buffer_mw=0.0,
            shortfall_frequency_pct=0.0,
        )

    actuals = matched_df["actual_mw"].to_numpy(dtype=float)
    forecasts = matched_df["forecast_mw"].to_numpy(dtype=float)
    errors = matched_df["error_mw"].to_numpy(dtype=float)  # Actual - Forecast
    abs_errors = matched_df["abs_error_mw"].to_numpy(dtype=float)
    shortfalls = matched_df["shortfall_mw"].to_numpy(dtype=float)

    mean_actual = float(np.mean(actuals))
    mean_forecast = float(np.mean(forecasts))

    # Error metrics
    bias = float(np.mean(errors))
    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))

    # Guarded MAPE (exclude periods where actual < 100 MW to avoid division by zero or explosive ratios)
    valid_mape_mask = actuals >= 100.0
    if np.any(valid_mape_mask):
        mape = float(np.mean(abs_errors[valid_mape_mask] / actuals[valid_mape_mask]) * 100.0)
    else:
        mape = None

    # WAPE (Weighted Absolute Percentage Error = sum(|e|) / sum(A) * 100)
    sum_actual = float(np.sum(actuals))
    wape = (float(np.sum(abs_errors)) / sum_actual * 100.0) if sum_actual > 0 else 0.0

    # Quantiles of absolute error
    p50_error = float(np.percentile(abs_errors, 50))
    p90_error = float(np.percentile(abs_errors, 90))
    p95_error = float(np.percentile(abs_errors, 95))
    max_error = float(np.max(abs_errors))

    # Downside Shortfall Reserve Buffer
    # Tells the trader: With 90% confidence, wind will fall short of forecast by at most this MW buffer
    p90_shortfall = float(np.percentile(shortfalls, 90))
    p95_shortfall = float(np.percentile(shortfalls, 95))
    shortfall_freq = float(np.mean(shortfalls > 0) * 100.0)

    return OverallSummaryKPIs(
        total_periods=total_periods,
        matched_periods=matched_periods,
        missing_periods=missing_periods,
        data_completeness_pct=round(completeness_pct, 2),
        mean_actual_mw=round(mean_actual, 1),
        mean_forecast_mw=round(mean_forecast, 1),
        bias_mw=round(bias, 1),
        mae_mw=round(mae, 1),
        rmse_mw=round(rmse, 1),
        mape_pct=round(mape, 2) if mape is not None else None,
        wape_pct=round(wape, 2),
        p50_error_mw=round(p50_error, 1),
        p90_error_mw=round(p90_error, 1),
        p95_error_mw=round(p95_error, 1),
        max_error_mw=round(max_error, 1),
        p90_shortfall_buffer_mw=round(p90_shortfall, 1),
        p95_shortfall_buffer_mw=round(p95_shortfall, 1),
        shortfall_frequency_pct=round(shortfall_freq, 1),
    )


def calculate_hourly_profile(df: pd.DataFrame) -> List[HourlyProfile]:
    """
    Compute hour-of-day profile (0 to 23) across the evaluated month.
    """
    matched_df = df[df["status"] == "MATCHED"].copy()
    profiles: List[HourlyProfile] = []

    for hour in range(24):
        sub = matched_df[matched_df["hour_of_day"] == hour]
        if len(sub) == 0:
            profiles.append(
                HourlyProfile(
                    hour=hour,
                    count=0,
                    mean_actual_mw=0.0,
                    mean_forecast_mw=0.0,
                    mae_mw=0.0,
                    rmse_mw=0.0,
                    bias_mw=0.0,
                    p90_shortfall_buffer_mw=0.0,
                )
            )
            continue

        act = sub["actual_mw"].to_numpy(dtype=float)
        fc = sub["forecast_mw"].to_numpy(dtype=float)
        err = sub["error_mw"].to_numpy(dtype=float)
        abs_err = sub["abs_error_mw"].to_numpy(dtype=float)
        shortfalls = sub["shortfall_mw"].to_numpy(dtype=float)

        profiles.append(
            HourlyProfile(
                hour=hour,
                count=len(sub),
                mean_actual_mw=round(float(np.mean(act)), 1),
                mean_forecast_mw=round(float(np.mean(fc)), 1),
                mae_mw=round(float(np.mean(abs_err)), 1),
                rmse_mw=round(float(np.sqrt(np.mean(err ** 2))), 1),
                bias_mw=round(float(np.mean(err)), 1),
                p90_shortfall_buffer_mw=round(float(np.percentile(shortfalls, 90)), 1),
            )
        )

    return profiles


def calculate_horizon_analysis(df: pd.DataFrame) -> List[HorizonBucketSummary]:
    """
    Analyze error behavior across forecast lead-time horizon buckets.
    """
    matched_df = df[df["status"] == "MATCHED"].copy()
    if len(matched_df) == 0 or matched_df["horizon_hours"].isnull().all():
        return []

    # Define standard lead-time buckets
    bucket_definitions = [
        ("< 18h", 0.0, 18.0),
        ("18-24h", 18.0, 24.0),
        ("24-30h", 24.0, 30.0),
        ("30-36h", 30.0, 36.0),
        (">= 36h", 36.0, 1000.0),
    ]

    summaries: List[HorizonBucketSummary] = []
    for label, min_h, max_h in bucket_definitions:
        sub = matched_df[(matched_df["horizon_hours"] >= min_h) & (matched_df["horizon_hours"] < max_h)]
        if len(sub) == 0:
            continue

        err = sub["error_mw"].to_numpy(dtype=float)
        abs_err = sub["abs_error_mw"].to_numpy(dtype=float)
        horizons = sub["horizon_hours"].to_numpy(dtype=float)

        summaries.append(
            HorizonBucketSummary(
                bucket_label=label,
                min_hours=min_h,
                max_hours=max_h,
                sample_count=len(sub),
                mae_mw=round(float(np.mean(abs_err)), 1),
                rmse_mw=round(float(np.sqrt(np.mean(err ** 2))), 1),
                bias_mw=round(float(np.mean(err)), 1),
                mean_horizon_hours=round(float(np.mean(horizons)), 1),
            )
        )

    return summaries


def calculate_distribution_bins(
    series: np.ndarray,
    num_bins: int = 20,
) -> List[DistributionBin]:
    """
    Generate histogram distribution bins for a numeric series.
    """
    if len(series) == 0:
        return []

    counts, bin_edges = np.histogram(series, bins=num_bins)
    total = len(series)
    bins = []

    for i in range(len(counts)):
        b_start = float(bin_edges[i])
        b_end = float(bin_edges[i + 1])
        b_center = (b_start + b_end) / 2.0
        c = int(counts[i])
        freq = (c / total * 100.0) if total > 0 else 0.0
        bins.append(
            DistributionBin(
                bin_start=round(b_start, 1),
                bin_end=round(b_end, 1),
                bin_center=round(b_center, 1),
                count=c,
                frequency_pct=round(freq, 2),
            )
        )

    return bins


def calculate_distributions(df: pd.DataFrame, num_bins: int = 24) -> DistributionResponse:
    """
    Compute frequency distributions for both Signed Error (A - F) and Downside Shortfall (F - A).
    """
    matched_df = df[df["status"] == "MATCHED"]
    if len(matched_df) == 0:
        return DistributionResponse(error_bins=[], shortfall_bins=[])

    errors = matched_df["error_mw"].to_numpy(dtype=float)
    shortfalls = matched_df["shortfall_mw"].to_numpy(dtype=float)

    error_bins = calculate_distribution_bins(errors, num_bins=num_bins)
    shortfall_bins = calculate_distribution_bins(shortfalls, num_bins=num_bins)

    return DistributionResponse(
        error_bins=error_bins,
        shortfall_bins=shortfall_bins,
    )
