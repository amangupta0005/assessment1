"""
backend/tests/test_metrics_engine.py
====================================
Unit tests for Mathematical Metrics Engine against hand-calculated values.
"""

import math
import numpy as np
import pandas as pd
import pytest

from backend.app.services.metrics_engine import (
    calculate_distributions,
    calculate_horizon_analysis,
    calculate_hourly_profile,
    calculate_overall_kpis,
)


def test_hand_computed_metrics():
    """
    Hand-calculated test scenario:
    5 periods:
      i=1: Actual=1000, Forecast=800  -> Error = +200, AbsError = 200, Shortfall = 0
      i=2: Actual=2000, Forecast=2500 -> Error = -500, AbsError = 500, Shortfall = 500
      i=3: Actual=1500, Forecast=1500 -> Error = 0,    AbsError = 0,   Shortfall = 0
      i=4: Actual=3000, Forecast=2000 -> Error = +1000,AbsError = 1000,Shortfall = 0
      i=5: Actual=2500, Forecast=2800 -> Error = -300, AbsError = 300, Shortfall = 300

    Sums and Averages:
      Sum Actual = 10000, Mean Actual = 2000.0
      Sum Forecast = 9600, Mean Forecast = 1920.0
      Errors = [+200, -500, 0, +1000, -300]
      Mean Error (Bias) = (200 - 500 + 0 + 1000 - 300) / 5 = 400 / 5 = +80.0 MW
      Abs Errors = [200, 500, 0, 1000, 300]
      MAE = (200 + 500 + 0 + 1000 + 300) / 5 = 2000 / 5 = 400.0 MW
      Squared Errors = [40000, 250000, 0, 1000000, 90000] = 1380000
      MSE = 1380000 / 5 = 276000
      RMSE = sqrt(276000) = 525.3569... -> round to 525.4 MW
      WAPE = sum(AbsError) / sum(Actual) = 2000 / 10000 = 20.0%
      Shortfalls = [0, 500, 0, 0, 300]
      Shortfall frequency = 2 / 5 = 40.0%
    """
    data = [
        {"status": "MATCHED", "actual_mw": 1000.0, "forecast_mw": 800.0, "error_mw": 200.0, "abs_error_mw": 200.0, "shortfall_mw": 0.0, "horizon_hours": 20.0, "hour_of_day": 0},
        {"status": "MATCHED", "actual_mw": 2000.0, "forecast_mw": 2500.0, "error_mw": -500.0, "abs_error_mw": 500.0, "shortfall_mw": 500.0, "horizon_hours": 22.0, "hour_of_day": 1},
        {"status": "MATCHED", "actual_mw": 1500.0, "forecast_mw": 1500.0, "error_mw": 0.0, "abs_error_mw": 0.0, "shortfall_mw": 0.0, "horizon_hours": 24.0, "hour_of_day": 2},
        {"status": "MATCHED", "actual_mw": 3000.0, "forecast_mw": 2000.0, "error_mw": 1000.0, "abs_error_mw": 1000.0, "shortfall_mw": 0.0, "horizon_hours": 26.0, "hour_of_day": 3},
        {"status": "MATCHED", "actual_mw": 2500.0, "forecast_mw": 2800.0, "error_mw": -300.0, "abs_error_mw": 300.0, "shortfall_mw": 300.0, "horizon_hours": 28.0, "hour_of_day": 4},
    ]
    df = pd.DataFrame(data)

    kpis = calculate_overall_kpis(df)

    assert kpis.total_periods == 5
    assert kpis.matched_periods == 5
    assert kpis.missing_periods == 0
    assert kpis.data_completeness_pct == 100.0
    assert kpis.mean_actual_mw == 2000.0
    assert kpis.mean_forecast_mw == 1920.0
    assert kpis.bias_mw == 80.0
    assert kpis.mae_mw == 400.0
    assert abs(kpis.rmse_mw - 525.4) < 0.1
    assert kpis.wape_pct == 20.0
    assert kpis.shortfall_frequency_pct == 40.0

    # Test P50 of absolute errors [0, 200, 300, 500, 1000] -> median is 300
    assert kpis.p50_error_mw == 300.0


def test_mape_zero_division_guard():
    """Verify MAPE guards against zero division when actual generation is zero."""
    data = [
        {"status": "MATCHED", "actual_mw": 0.0, "forecast_mw": 100.0, "error_mw": -100.0, "abs_error_mw": 100.0, "shortfall_mw": 100.0, "horizon_hours": 20.0, "hour_of_day": 0},
        {"status": "MATCHED", "actual_mw": 500.0, "forecast_mw": 550.0, "error_mw": -50.0, "abs_error_mw": 50.0, "shortfall_mw": 50.0, "horizon_hours": 20.0, "hour_of_day": 1},
    ]
    df = pd.DataFrame(data)

    kpis = calculate_overall_kpis(df)
    # Period 1 (actual=0) should be excluded from guarded MAPE
    # Period 2 has actual=500, error=50 -> 50 / 500 = 10.0%
    assert kpis.mape_pct == 10.0


def test_horizon_analysis_grouping():
    """Verify horizon bucket grouping and aggregation."""
    data = [
        {"status": "MATCHED", "actual_mw": 1000.0, "forecast_mw": 1050.0, "error_mw": -50.0, "abs_error_mw": 50.0, "shortfall_mw": 50.0, "horizon_hours": 17.0},
        {"status": "MATCHED", "actual_mw": 1000.0, "forecast_mw": 1100.0, "error_mw": -100.0, "abs_error_mw": 100.0, "shortfall_mw": 100.0, "horizon_hours": 20.0},
        {"status": "MATCHED", "actual_mw": 1000.0, "forecast_mw": 1200.0, "error_mw": -200.0, "abs_error_mw": 200.0, "shortfall_mw": 200.0, "horizon_hours": 32.0},
    ]
    df = pd.DataFrame(data)

    buckets = calculate_horizon_analysis(df)
    labels = [b.bucket_label for b in buckets]
    assert "< 18h" in labels
    assert "18-24h" in labels
    assert "30-36h" in labels


def test_distributions():
    """Verify error and shortfall histogram generation."""
    data = [
        {"status": "MATCHED", "actual_mw": 1000.0, "forecast_mw": 900.0, "error_mw": 100.0, "shortfall_mw": 0.0},
        {"status": "MATCHED", "actual_mw": 1000.0, "forecast_mw": 1100.0, "error_mw": -100.0, "shortfall_mw": 100.0},
        {"status": "MATCHED", "actual_mw": 1000.0, "forecast_mw": 1000.0, "error_mw": 0.0, "shortfall_mw": 0.0},
    ]
    df = pd.DataFrame(data)
    dist = calculate_distributions(df, num_bins=5)
    assert len(dist.error_bins) > 0
    assert len(dist.shortfall_bins) > 0
