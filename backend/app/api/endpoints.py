"""
backend/app/api/endpoints.py
============================
FastAPI routes exposing wind forecast evaluation data and metrics.
"""

from __future__ import annotations

import io
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
import pandas as pd

from backend.app.models.schemas import (
    DistributionResponse,
    ForecastEvaluationPoint,
    HorizonBucketSummary,
    HourlyProfile,
    OverallSummaryKPIs,
)
from backend.app.services.forecast_selector import build_evaluation_dataset
from backend.app.services.metrics_engine import (
    calculate_distributions,
    calculate_horizon_analysis,
    calculate_hourly_profile,
    calculate_overall_kpis,
)

router = APIRouter(prefix="/wind", tags=["wind-forecast"])


@router.get("/summary", response_model=OverallSummaryKPIs)
def get_summary(
    cutoff_time: str = Query("09:00", description="Day-ahead decision cutoff on D-1 in HH:MM (GMT/UTC)"),
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    granularity: str = Query("hourly", description="'hourly' (mean of :00 and :30) or 'exact' (:00 only)"),
) -> OverallSummaryKPIs:
    """
    Retrieve aggregate KPIs: MAE, RMSE, Bias, WAPE, MAPE, Quantiles, and P90 Shortfall Buffer.
    """
    try:
        df = build_evaluation_dataset(
            cutoff_time_str=cutoff_time,
            start_date=start_date,
            end_date=end_date,
            granularity=granularity,
        )
        return calculate_overall_kpis(df)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/timeseries", response_model=List[ForecastEvaluationPoint])
def get_timeseries(
    cutoff_time: str = Query("09:00", description="Day-ahead decision cutoff on D-1 in HH:MM (GMT/UTC)"),
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    granularity: str = Query("hourly", description="'hourly' (mean of :00 and :30) or 'exact' (:00 only)"),
) -> List[ForecastEvaluationPoint]:
    """
    Retrieve full time series of actual vs latest forecast, error, shortfall, and lead time.
    """
    try:
        df = build_evaluation_dataset(
            cutoff_time_str=cutoff_time,
            start_date=start_date,
            end_date=end_date,
            granularity=granularity,
        )

        records = []
        for _, row in df.iterrows():
            records.append(
                ForecastEvaluationPoint(
                    target_start_time=row["target_start_time"].strftime("%Y-%m-%dT%H:%M:%SZ"),
                    settlement_date=row["settlement_date"],
                    hour_of_day=int(row["hour_of_day"]),
                    actual_mw=float(row["actual_mw"]) if pd.notnull(row["actual_mw"]) else None,
                    forecast_mw=float(row["forecast_mw"]) if pd.notnull(row["forecast_mw"]) else None,
                    publish_time=row["publish_time"].strftime("%Y-%m-%dT%H:%M:%SZ") if pd.notnull(row["publish_time"]) else None,
                    cutoff_time=row["cutoff_time"].strftime("%Y-%m-%dT%H:%M:%SZ"),
                    horizon_hours=round(float(row["horizon_hours"]), 1) if pd.notnull(row["horizon_hours"]) else None,
                    error_mw=round(float(row["error_mw"]), 1) if pd.notnull(row["error_mw"]) else None,
                    abs_error_mw=round(float(row["abs_error_mw"]), 1) if pd.notnull(row["abs_error_mw"]) else None,
                    shortfall_mw=round(float(row["shortfall_mw"]), 1) if pd.notnull(row["shortfall_mw"]) else None,
                    percentage_error=round(float(row["percentage_error"]), 2) if pd.notnull(row["percentage_error"]) else None,
                    status=row["status"],
                )
            )
        return records
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/by-hour", response_model=List[HourlyProfile])
def get_by_hour(
    cutoff_time: str = Query("09:00", description="Day-ahead decision cutoff on D-1 in HH:MM (GMT/UTC)"),
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    granularity: str = Query("hourly", description="'hourly' or 'exact'"),
) -> List[HourlyProfile]:
    """
    Retrieve hour-of-day profile (0-23) including hourly P90 shortfall buffers.
    """
    try:
        df = build_evaluation_dataset(
            cutoff_time_str=cutoff_time,
            start_date=start_date,
            end_date=end_date,
            granularity=granularity,
        )
        return calculate_hourly_profile(df)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/by-horizon", response_model=List[HorizonBucketSummary])
def get_by_horizon(
    cutoff_time: str = Query("09:00", description="Day-ahead decision cutoff on D-1 in HH:MM (GMT/UTC)"),
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    granularity: str = Query("hourly", description="'hourly' or 'exact'"),
) -> List[HorizonBucketSummary]:
    """
    Retrieve forecast performance aggregated across lead-time horizon buckets.
    """
    try:
        df = build_evaluation_dataset(
            cutoff_time_str=cutoff_time,
            start_date=start_date,
            end_date=end_date,
            granularity=granularity,
        )
        return calculate_horizon_analysis(df)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/distribution", response_model=DistributionResponse)
def get_distribution(
    cutoff_time: str = Query("09:00", description="Day-ahead decision cutoff on D-1 in HH:MM (GMT/UTC)"),
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    granularity: str = Query("hourly", description="'hourly' or 'exact'"),
    num_bins: int = Query(24, ge=5, le=50, description="Number of histogram bins"),
) -> DistributionResponse:
    """
    Retrieve frequency distribution bins for Signed Error and Downside Shortfall.
    """
    try:
        df = build_evaluation_dataset(
            cutoff_time_str=cutoff_time,
            start_date=start_date,
            end_date=end_date,
            granularity=granularity,
        )
        return calculate_distributions(df, num_bins=num_bins)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/export")
def export_csv(
    cutoff_time: str = Query("09:00", description="Day-ahead decision cutoff on D-1 in HH:MM (GMT/UTC)"),
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    granularity: str = Query("hourly", description="'hourly' or 'exact'"),
):
    """
    Export matched forecast evaluation data as a CSV download.
    """
    try:
        df = build_evaluation_dataset(
            cutoff_time_str=cutoff_time,
            start_date=start_date,
            end_date=end_date,
            granularity=granularity,
        )
        
        # Export friendly columns
        export_df = df.copy()
        export_df["target_start_time"] = export_df["target_start_time"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        export_df["cutoff_time"] = export_df["cutoff_time"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        export_df["publish_time"] = export_df["publish_time"].apply(
            lambda x: x.strftime("%Y-%m-%dT%H:%M:%SZ") if pd.notnull(x) else ""
        )

        csv_buffer = io.StringIO()
        export_df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)

        filename = f"wind_forecast_eval_jan_2026_cutoff_{cutoff_time.replace(':', '')}.csv"
        return StreamingResponse(
            io.BytesIO(csv_buffer.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
