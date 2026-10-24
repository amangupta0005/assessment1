"""
backend/tests/test_api_endpoints.py
===================================
Integration tests for FastAPI REST routes.
"""

from fastapi.testclient import TestClient
import pytest

from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify health endpoint returns status and data counts."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["data_loaded"] is True
    assert data["actuals_count"] > 0
    assert data["forecasts_count"] > 0


def test_api_summary_endpoint():
    """Verify /api/wind/summary returns realistic KPI metrics."""
    response = client.get("/api/wind/summary?cutoff_time=09:00")
    assert response.status_code == 200
    data = response.json()
    assert data["total_periods"] == 744
    assert data["matched_periods"] == 744
    assert data["missing_periods"] == 0
    assert data["data_completeness_pct"] == 100.0
    assert data["mae_mw"] > 0
    assert data["rmse_mw"] > 0
    assert data["p90_shortfall_buffer_mw"] > 0


def test_api_timeseries_endpoint():
    """Verify /api/wind/timeseries returns full January time series."""
    response = client.get("/api/wind/timeseries?cutoff_time=09:00")
    assert response.status_code == 200
    points = response.json()
    assert len(points) == 744
    first_pt = points[0]
    assert "target_start_time" in first_pt
    assert "actual_mw" in first_pt
    assert "forecast_mw" in first_pt
    assert "horizon_hours" in first_pt
    assert "error_mw" in first_pt
    assert "shortfall_mw" in first_pt
    assert first_pt["status"] == "MATCHED"


def test_api_by_hour_endpoint():
    """Verify /api/wind/by-hour returns 24 hourly breakdowns."""
    response = client.get("/api/wind/by-hour?cutoff_time=09:00")
    assert response.status_code == 200
    hourly = response.json()
    assert len(hourly) == 24
    for h_data in hourly:
        assert 0 <= h_data["hour"] <= 23
        assert h_data["count"] == 31  # 31 days in Jan


def test_api_by_horizon_endpoint():
    """Verify /api/wind/by-horizon returns lead-time buckets."""
    response = client.get("/api/wind/by-horizon?cutoff_time=09:00")
    assert response.status_code == 200
    buckets = response.json()
    assert len(buckets) > 0
    for b in buckets:
        assert "bucket_label" in b
        assert "mae_mw" in b
        assert b["sample_count"] > 0


def test_api_distribution_endpoint():
    """Verify /api/wind/distribution returns histogram bins."""
    response = client.get("/api/wind/distribution?cutoff_time=09:00&num_bins=20")
    assert response.status_code == 200
    data = response.json()
    assert len(data["error_bins"]) > 0
    assert len(data["shortfall_bins"]) > 0


def test_api_export_endpoint():
    """Verify /api/wind/export returns CSV content."""
    response = client.get("/api/wind/export?cutoff_time=09:00")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    lines = response.text.strip().split("\n")
    assert len(lines) == 745  # Header + 744 records
    assert "target_start_time" in lines[0]
    assert "actual_mw" in lines[0]
    assert "forecast_mw" in lines[0]
