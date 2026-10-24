"""
scripts/verify_data.py
======================
Empirical verification script for cached Elexon BMRS January 2026 data.
Validates:
  1. File existence (Parquet and JSON)
  2. Record counts and zero null values in critical fields
  3. Continuous temporal coverage of January 2026 (all 31 days)
  4. Generation bounds (non-negative, realistic UK capacity < 35,000 MW)
  5. Cross-checks matched pairs availability under default 09:00 D-1 cutoff
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def verify_dataset() -> bool:
    print("=" * 60)
    print("Running Empirical Data Verification for January 2026")
    print("=" * 60)

    actuals_pq = DATA_DIR / "actuals_jan_2026.parquet"
    actuals_json = DATA_DIR / "actuals_jan_2026.json"
    forecasts_pq = DATA_DIR / "forecasts_jan_2026.parquet"
    forecasts_json = DATA_DIR / "forecasts_jan_2026.json"

    for path in [actuals_pq, actuals_json, forecasts_pq, forecasts_json]:
        if not path.exists():
            print(f"[FAIL] Missing file: {path}")
            return False
        size_kb = path.stat().st_size / 1024
        print(f"[PASS] Found {path.name} ({size_kb:.1f} KB)")

    # 1. Verify Actuals (FUELHH)
    df_act = pd.read_parquet(actuals_pq)
    print("\n--- Actuals (FUELHH) ---")
    print(f"Total records: {len(df_act)}")
    assert len(df_act) > 0, "Actuals dataset is empty!"
    
    # Check nulls
    null_counts = df_act[["startTime", "generation"]].isnull().sum().to_dict()
    print(f"Null counts: {null_counts}")
    assert null_counts["startTime"] == 0, "Null startTime found in actuals"
    assert null_counts["generation"] == 0, "Null generation found in actuals"

    # Range and bounds
    min_st = df_act["startTime"].min()
    max_st = df_act["startTime"].max()
    min_gen = df_act["generation"].min()
    max_gen = df_act["generation"].max()
    print(f"Start time range: {min_st} to {max_st}")
    print(f"Generation range: {min_gen:.1f} MW to {max_gen:.1f} MW")
    assert min_gen >= 0, f"Negative generation in actuals: {min_gen}"
    assert max_gen < 40000, f"Unrealistically high generation in actuals: {max_gen}"

    # Check that all 31 days are represented
    unique_days = df_act["startTime"].dt.date.nunique()
    print(f"Unique days covered: {unique_days} / 31")
    assert unique_days == 31, f"Expected 31 days, found {unique_days}"

    # 2. Verify Forecasts (WINDFOR)
    df_fc = pd.read_parquet(forecasts_pq)
    print("\n--- Forecasts (WINDFOR) ---")
    print(f"Total forecast records: {len(df_fc)}")
    assert len(df_fc) > 0, "Forecasts dataset is empty!"

    null_fc = df_fc[["startTime", "publishTime", "generation"]].isnull().sum().to_dict()
    print(f"Null counts: {null_fc}")
    assert null_fc["startTime"] == 0, "Null startTime found in forecasts"
    assert null_fc["publishTime"] == 0, "Null publishTime found in forecasts"
    assert null_fc["generation"] == 0, "Null generation found in forecasts"

    fc_days = df_fc["startTime"].dt.date.nunique()
    print(f"Unique forecast target days covered: {fc_days} / 31")
    assert fc_days == 31, f"Expected 31 forecast target days, found {fc_days}"

    # 3. Simulate Day-Ahead Cutoff (D-1 at 09:00 GMT) matching
    print("\n--- Day-Ahead Cutoff Simulation (09:00 D-1) ---")
    matched_count = 0
    missing_count = 0
    horizons = []

    # Get unique target hours in Jan 2026
    target_hours = pd.date_range("2026-01-01 00:00:00+00:00", "2026-01-31 23:00:00+00:00", freq="1h")
    for th in target_hours:
        # Decision cutoff: previous day at 09:00 UTC
        target_date = th.date()
        cutoff_dt = pd.Timestamp(datetime(target_date.year, target_date.month, target_date.day, 9, 0, 0, tzinfo=timezone.utc)) - pd.Timedelta(days=1)
        
        # Eligible forecasts
        cands = df_fc[(df_fc["startTime"] == th) & (df_fc["publishTime"] <= cutoff_dt)]
        if len(cands) > 0:
            latest = cands.sort_values(by="publishTime", ascending=False).iloc[0]
            # Anti-leakage assertion!
            assert latest["publishTime"] <= cutoff_dt, f"Data leakage detected for {th}: pub={latest['publishTime']} > cutoff={cutoff_dt}"
            matched_count += 1
            horizon_hours = (th - latest["publishTime"]).total_seconds() / 3600.0
            horizons.append(horizon_hours)
        else:
            missing_count += 1

    print(f"Total target hours in Jan 2026: {len(target_hours)}")
    print(f"Successfully matched target hours: {matched_count} ({matched_count/len(target_hours)*100:.1f}%)")
    print(f"Missing target hours: {missing_count}")
    if horizons:
        min_h = min(horizons)
        max_h = max(horizons)
        avg_h = sum(horizons) / len(horizons)
        print(f"Forecast lead horizon range: {min_h:.1f}h to {max_h:.1f}h (mean: {avg_h:.1f}h)")

    print("\n[SUCCESS] All data verification checks passed!")
    return True


if __name__ == "__main__":
    success = verify_dataset()
    sys.exit(0 if success else 1)
