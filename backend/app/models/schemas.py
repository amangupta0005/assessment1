"""
backend/app/models/schemas.py
=============================
Pydantic schemas for request query parameters and response payloads.
"""

from __future__ import annotations

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    version: str
    data_loaded: bool
    actuals_count: int
    forecasts_count: int


class ForecastEvaluationPoint(BaseModel):
    target_start_time: str = Field(..., description="Target delivery start time (ISO 8601 UTC)")
    settlement_date: str = Field(..., description="Target delivery date (YYYY-MM-DD)")
    hour_of_day: int = Field(..., ge=0, le=23, description="Hour of delivery day (0-23)")
    actual_mw: Optional[float] = Field(None, description="Actual outturn wind generation in MW")
    forecast_mw: Optional[float] = Field(None, description="Latest pre-cutoff wind forecast in MW")
    publish_time: Optional[str] = Field(None, description="Forecast publish timestamp (ISO 8601 UTC)")
    cutoff_time: str = Field(..., description="Decision cutoff timestamp for this target (ISO 8601 UTC)")
    horizon_hours: Optional[float] = Field(None, description="Lead time in hours: target_time - publish_time")
    error_mw: Optional[float] = Field(None, description="Signed error: Actual - Forecast (MW)")
    abs_error_mw: Optional[float] = Field(None, description="Absolute error: |Actual - Forecast| (MW)")
    shortfall_mw: Optional[float] = Field(None, description="Downside shortfall: max(0, Forecast - Actual) (MW)")
    percentage_error: Optional[float] = Field(None, description="Percentage error: |Actual - Forecast| / Actual * 100")
    status: str = Field(..., description="Status: 'MATCHED' or 'MISSING_FORECAST' or 'MISSING_ACTUAL'")


class OverallSummaryKPIs(BaseModel):
    total_periods: int = Field(..., description="Total target delivery hours in evaluated range")
    matched_periods: int = Field(..., description="Count of periods with both actual and valid forecast")
    missing_periods: int = Field(..., description="Count of periods missing forecasts before cutoff")
    data_completeness_pct: float = Field(..., description="Percentage of periods successfully evaluated")
    
    mean_actual_mw: float = Field(..., description="Mean actual wind generation in MW")
    mean_forecast_mw: float = Field(..., description="Mean forecast wind generation in MW")
    
    # Error metrics
    bias_mw: float = Field(..., description="Mean Signed Error: sum(Actual - Forecast) / N (MW)")
    mae_mw: float = Field(..., description="Mean Absolute Error: sum(|Actual - Forecast|) / N (MW)")
    rmse_mw: float = Field(..., description="Root Mean Squared Error (MW)")
    mape_pct: Optional[float] = Field(None, description="Mean Absolute Percentage Error (guarded for Actual >= 100MW)")
    wape_pct: float = Field(..., description="Weighted Absolute Percentage Error: sum(|Error|) / sum(Actual) * 100 (%)")
    
    # Quantiles of absolute error
    p50_error_mw: float = Field(..., description="50th percentile (median) absolute error in MW")
    p90_error_mw: float = Field(..., description="90th percentile absolute error in MW")
    p95_error_mw: float = Field(..., description="95th percentile absolute error in MW")
    max_error_mw: float = Field(..., description="Maximum absolute error in MW")
    
    # Trader Buying Decision Metric (Shortfall Reserve Buffer)
    p90_shortfall_buffer_mw: float = Field(..., description="90% confidence wind shortfall reserve buffer (MW)")
    p95_shortfall_buffer_mw: float = Field(..., description="95% confidence wind shortfall reserve buffer (MW)")
    shortfall_frequency_pct: float = Field(..., description="Percentage of hours where wind fell short of forecast (Actual < Forecast)")


class HourlyProfile(BaseModel):
    hour: int = Field(..., ge=0, le=23, description="Hour of the day (0-23)")
    count: int = Field(..., description="Number of evaluated days for this hour")
    mean_actual_mw: float
    mean_forecast_mw: float
    mae_mw: float
    rmse_mw: float
    bias_mw: float
    p90_shortfall_buffer_mw: float = Field(..., description="Hour-specific P90 shortfall buffer in MW")


class HorizonBucketSummary(BaseModel):
    bucket_label: str = Field(..., description="Horizon bucket label, e.g. '18-24h'")
    min_hours: float
    max_hours: float
    sample_count: int
    mae_mw: float
    rmse_mw: float
    bias_mw: float
    mean_horizon_hours: float


class DistributionBin(BaseModel):
    bin_start: float
    bin_end: float
    bin_center: float
    count: int
    frequency_pct: float


class DistributionResponse(BaseModel):
    error_bins: List[DistributionBin] = Field(..., description="Histogram distribution of signed error (Actual - Forecast)")
    shortfall_bins: List[DistributionBin] = Field(..., description="Histogram distribution of shortfall (Forecast - Actual)")
