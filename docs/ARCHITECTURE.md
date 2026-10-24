# System Architecture: UK Wind Forecast Evaluation Platform

---

## 1. High-Level Architecture & Component Overview

The system is structured as a decoupled, production-grade web application tailored for power utility analytics:

```mermaid
flowchart TD
    subgraph Data Layer
        API["Elexon BMRS API v1<br/>(FUELHH & WINDFOR streams)"]
        Script["scripts/fetch_data.py<br/>(Chunking, Backoff, Deduplication)"]
        Cache[("Cached Data Lake<br/>data/*.parquet & .json")]
        API --> Script
        Script --> Cache
    end

    subgraph Backend Engine (FastAPI)
        Loader["Data Loader<br/>(In-Memory Caching)"]
        Selector["Forecast Selector Engine<br/>(Anti-Leakage Cutoff Logic)"]
        Metrics["Metrics Engine<br/>(Vectorized NumPy/Pandas)"]
        Routes["REST API Endpoints<br/>(/api/wind/*)"]

        Cache --> Loader
        Loader --> Selector
        Selector --> Metrics
        Metrics --> Routes
    end

    subgraph Frontend Application (React 18 + Vite)
        State["App State & Filter Controller"]
        Controls["Filter Bar<br/>(Cutoff, Dates, Granularity)"]
        KPIs["KPI Metrics Cards"]
        Charts["Interactive Visualizations<br/>(Recharts Time Series, Hourly, Horizon, Histogram)"]
        Table["Audit Log Table & CSV Downloader"]

        Routes --> State
        Controls --> State
        State --> KPIs
        State --> Charts
        State --> Table
    end
```

---

## 2. Component Descriptions

### 2.1 Ingestion Pipeline (`scripts/fetch_data.py`)
- Pulls national-level wind data from Elexon BMRS v1 stream endpoints:
  - `FUELHH`: Filtered to `fuelType=WIND`.
  - `WINDFOR`: Filtered to delivery targets in January 2026.
- Implements 7-day chunking to avoid timeouts or truncation.
- Applies exponential backoff retry with random jitter.
- Stores dual formats: Parquet (compact, type-safe) and JSON (portable).

### 2.2 Core Analytics Backend (`backend/app/`)
- **`services/data_loader.py`**: Loads Parquet/JSON data into in-memory cached DataFrames.
- **`services/forecast_selector.py`**: Enforces strict anti-leakage selection. Filters forecasts by `publishTime <= Cutoff(D-1 at HH:MM)`. Sorts candidates and selects the maximum publish timestamp.
- **`services/metrics_engine.py`**: Vectorized computations using NumPy for signed error, bias, MAE, RMSE, WAPE, guarded MAPE, absolute error percentiles (P50/P90/P95), and P90/P95 downside shortfall buffers.
- **`api/endpoints.py`**: Exposes OpenAPI-compliant REST endpoints.
- **`main.py`**: FastAPI entrypoint with CORS and fallback static file serving.

### 2.3 Trading Dashboard (`frontend/`)
- **Technology**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide-react.
- **Design Tokens**: Defined in `src/index.css` using deep navy (`#0B192C`), slate (`#1E293B`), teal (`#0F766E`), amber (`#F59E0B`), and rose (`#EF4444`). Meets WCAG AA contrast standards with zero purple/violet AI templates.
- **Components**:
  - `Header`: Gate closure indicator, anti-leakage status, and help trigger.
  - `HelpModal`: Modal explaining cutoff rules and metrics.
  - `FilterBar`: Cutoff selector, date range, quick week presets, and CSV export.
  - `KpiCards`: Key metrics emphasizing trader P90 shortfall buffer.
  - `MainTimeseriesChart`: Recharts composed chart showing actual vs forecast with shortfall deficit shading.
  - `HourlyShortfallChart`: 24-hour profile with P90 reserve buffer bars.
  - `HorizonChart`: Forecast lead-time degradation.
  - `DistributionChart`: Histogram tabs for signed error and shortfall.
  - `DataTable`: Paginated audit log with sorting.

---

## 3. REST API Specifications

### 3.1 `GET /api/wind/summary`
Calculates overall key performance indicators across the filtered window.

**Query Parameters:**
- `cutoff_time`: string (default `"09:00"`)
- `start_date`: string (optional, e.g. `"2026-01-01"`)
- `end_date`: string (optional, e.g. `"2026-01-31"`)
- `granularity`: string (`"hourly"` or `"exact"`)

**Example Response:**
```json
{
  "total_periods": 744,
  "matched_periods": 744,
  "missing_periods": 0,
  "data_completeness_pct": 100.0,
  "mean_actual_mw": 8945.2,
  "mean_forecast_mw": 9180.4,
  "bias_mw": -235.2,
  "mae_mw": 1650.3,
  "rmse_mw": 2180.7,
  "mape_pct": 21.4,
  "wape_pct": 18.5,
  "p50_error_mw": 1280.0,
  "p90_error_mw": 3450.0,
  "p95_error_mw": 4210.0,
  "max_error_mw": 6890.0,
  "p90_shortfall_buffer_mw": 2840.0,
  "p95_shortfall_buffer_mw": 3720.0,
  "shortfall_frequency_pct": 52.8
}
```

### 3.2 `GET /api/wind/timeseries`
Returns detailed delivery periods with outturn actuals and matched forecasts.

**Example Response Item:**
```json
{
  "target_start_time": "2026-01-01T00:00:00Z",
  "settlement_date": "2026-01-01",
  "hour_of_day": 0,
  "actual_mw": 13814.5,
  "forecast_mw": 19412.0,
  "publish_time": "2025-12-31T07:30:00Z",
  "cutoff_time": "2025-12-31T09:00:00Z",
  "horizon_hours": 16.5,
  "error_mw": -5597.5,
  "abs_error_mw": 5597.5,
  "shortfall_mw": 5597.5,
  "percentage_error": 40.52,
  "status": "MATCHED"
}
```

### 3.3 `GET /api/wind/by-hour`
Aggregates metrics by hour of day (0 to 23).

### 3.4 `GET /api/wind/by-horizon`
Aggregates metrics by lead-time horizon buckets (`< 18h`, `18-24h`, `24-30h`, `30-36h`, `>= 36h`).

### 3.5 `GET /api/wind/distribution`
Returns histogram bin frequencies for signed error and downside shortfall.

### 3.6 `GET /api/wind/export`
Streams dynamic CSV file with Content-Disposition attachment header.

---

## 4. Key Design Decisions & Trade-offs

1. **Pre-Cached Dataset vs Live Runtime Queries**:
   - *Decision*: Cache cleaned January 2026 data in `data/*.parquet` and `data/*.json`, generated via reproducible script `scripts/fetch_data.py`.
   - *Rationale*: Eliminates third-party API latency (5-10s per call), removes cold-start failures, guarantees 100% test reproducibility, and allows the platform to function reliably offline.
2. **Granularity Harmonization**:
   - *Decision*: Average the two 30-minute actual readings in each hour to match 1-hour WINDFOR forecasts.
   - *Rationale*: 1 MW sustained for 1 hour delivers 1 MWh of physical energy. Averaging captures the physical energy integral without synthesizing artificial half-hour forecasts.
3. **Deployment Strategy**:
   - *Local/Dev & Containers*: Multi-stage Dockerfile (`node:22` build + `python:3.12-slim` runner) with `docker-compose.yml`.
   - *Cloud Platforms*: Direct compatibility with Vercel (static frontend + Python serverless `api/index.py`) and Heroku container deployment (`heroku.yml`).
