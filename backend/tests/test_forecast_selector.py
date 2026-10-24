"""
backend/tests/test_forecast_selector.py
=======================================
Unit tests for Day-Ahead Forecast Selection Logic and Anti-Leakage Invariants.
"""

from datetime import datetime, timezone
import pandas as pd
import pytest

from backend.app.services.forecast_selector import (
    build_evaluation_dataset,
    parse_cutoff_time,
)


def test_parse_cutoff_time():
    """Verify cutoff time parsing and error handling."""
    t = parse_cutoff_time("09:00")
    assert t.hour == 9
    assert t.minute == 0

    t2 = parse_cutoff_time("14:30")
    assert t2.hour == 14
    assert t2.minute == 30

    with pytest.raises(ValueError):
        parse_cutoff_time("invalid")

    with pytest.raises(ValueError):
        parse_cutoff_time("25:00")


def test_anti_leakage_invariant_on_cached_data():
    """
    CRITICAL QUALITY GATE:
    Assert that across all 744 target hours in January 2026,
    NO selected forecast has publishTime > Cutoff(D-1 at 09:00).
    """
    df = build_evaluation_dataset(cutoff_time_str="09:00")
    assert len(df) == 744, f"Expected 744 hourly target periods in January 2026, got {len(df)}"

    matched = df[df["status"] == "MATCHED"]
    assert len(matched) == 744, f"Expected all 744 periods to be matched, got {len(matched)}"

    # Check anti-leakage invariant for every single row
    for idx, row in matched.iterrows():
        pub = row["publish_time"]
        cut = row["cutoff_time"]
        target = row["target_start_time"]
        assert pub <= cut, (
            f"DATA LEAKAGE DETECTED at target {target}! "
            f"publishTime ({pub}) is strictly after cutoffTime ({cut})"
        )


def test_forecast_selection_precedence_and_cutoff_boundary():
    """
    Verify selection logic with a synthetic controlled dataset:
    1. Earlier forecast before cutoff
    2. Later forecast before cutoff (should be selected)
    3. Forecast published exactly AT the cutoff (eligible)
    4. Forecast published AFTER cutoff (must be ignored)
    """
    from backend.app.services import forecast_selector

    target_dt = pd.Timestamp("2026-01-05 12:00:00+00:00")
    # Cutoff for 2026-01-05 delivery is 2026-01-04 09:00:00+00:00

    mock_actuals = pd.DataFrame([
        {"startTime": target_dt, "publishTime": target_dt + pd.Timedelta(minutes=30), "generation": 10000.0},
        {"startTime": target_dt + pd.Timedelta(minutes=30), "publishTime": target_dt + pd.Timedelta(hours=1), "generation": 10200.0},
    ])

    mock_forecasts = pd.DataFrame([
        # Published Jan 3 20:00 (too early, should be superseded)
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-03 20:00:00+00:00"), "generation": 8000.0},
        # Published Jan 4 08:30 (latest before cutoff - SHOULD BE SELECTED)
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-04 08:30:00+00:00"), "generation": 9500.0},
        # Published Jan 4 09:30 (leakage! published AFTER cutoff - MUST NOT BE SELECTED)
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-04 09:30:00+00:00"), "generation": 9999.0},
        # Published Jan 5 06:00 (intraday - MUST NOT BE SELECTED)
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-05 06:00:00+00:00"), "generation": 10000.0},
    ])

    # Monkeypatch loader functions
    orig_act = forecast_selector.load_actuals
    orig_fc = forecast_selector.load_forecasts
    forecast_selector.load_actuals = lambda: mock_actuals
    forecast_selector.load_forecasts = lambda: mock_forecasts

    try:
        df = forecast_selector.build_evaluation_dataset(cutoff_time_str="09:00")
        assert len(df) == 1
        row = df.iloc[0]

        # Expected actual: mean of 10000 and 10200 = 10100 MW
        assert row["actual_mw"] == 10100.0
        # Expected selected forecast: 9500 MW (published at 08:30)
        assert row["forecast_mw"] == 9500.0
        assert row["publish_time"] == pd.Timestamp("2026-01-04 08:30:00+00:00")
        assert row["status"] == "MATCHED"

        # Check error: Actual - Forecast = 10100 - 9500 = 600 MW
        assert row["error_mw"] == 600.0
        # Shortfall: max(0, Forecast - Actual) = max(0, -600) = 0 MW
        assert row["shortfall_mw"] == 0.0

        # Lead time: Jan 5 12:00 - Jan 4 08:30 = 27.5 hours
        assert row["horizon_hours"] == 27.5
    finally:
        forecast_selector.load_actuals = orig_act
        forecast_selector.load_forecasts = orig_fc


def test_missing_forecast_handling():
    """Verify that targets without pre-cutoff forecasts are flagged as MISSING_FORECAST without errors."""
    from backend.app.services import forecast_selector

    target_dt = pd.Timestamp("2026-01-10 14:00:00+00:00")
    # All forecasts published after cutoff
    mock_actuals = pd.DataFrame([
        {"startTime": target_dt, "publishTime": target_dt, "generation": 5000.0},
    ])
    mock_forecasts = pd.DataFrame([
        # Published Jan 9 10:00 (after 09:00 cutoff)
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-09 10:00:00+00:00"), "generation": 6000.0},
    ])

    orig_act = forecast_selector.load_actuals
    orig_fc = forecast_selector.load_forecasts
    forecast_selector.load_actuals = lambda: mock_actuals
    forecast_selector.load_forecasts = lambda: mock_forecasts

    try:
        df = forecast_selector.build_evaluation_dataset(cutoff_time_str="09:00")
        assert len(df) == 1
        row = df.iloc[0]
        assert row["status"] == "MISSING_FORECAST"
        assert row["forecast_mw"] is None
        assert row["error_mw"] is None
        assert row["shortfall_mw"] is None
    finally:
        forecast_selector.load_actuals = orig_act
        forecast_selector.load_forecasts = orig_fc
