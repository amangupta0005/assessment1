# Roadmap: UK Day-Ahead Wind Forecast Evaluation Platform

**Status**: In Progress  
**Spec Reference**: [.gsd/SPEC.md](file:///c:/Users/amang/OneDrive/Documents/Desktop/assessment/.gsd/SPEC.md)

---

## Phases Overview

| Phase | Description | Deliverables | Verification Gate |
|---|---|---|---|
| **Phase 1** | **Data Ingestion & Pipeline** | `scripts/fetch_data.py`, `data/*.parquet`/`.json`, verification script | 100% January 2026 actuals & forecasts fetched, cleaned, schema verified, zero missing days |
| **Phase 2** | **Core Analytics Engine & Backend** | FastAPI backend (`backend/`), data models, cutoff logic, metrics calculation, unit tests | All pytest unit tests pass, anti-leakage invariant proven, hand-computed metrics match |
| **Phase 3** | **Interactive Utility Dashboard (Frontend)** | React + TypeScript + Vite + Tailwind CSS + Recharts (`frontend/`) | Responsive layout, WCAG AA contrast, all charts interactive, zero console errors |
| **Phase 4** | **Packaging, Docker & Deployment Setup** | `Dockerfile`, `docker-compose.yml`, Vercel / Heroku configurations | Single command `docker-compose up` runs clean, production build succeeds |
| **Phase 5** | **Documentation, CodeRabbit Review & Delivery** | `README.md`, `docs/ARCHITECTURE.md`, `docs/METHODOLOGY.md`, `docs/REVIEW_NOTES.md`, `docs/VIDEO_SCRIPT.md`, `docs/CHECKLIST.md` | CodeRabbit review passed, 100% checklist items verified, video scripts ready |

---

## Detailed Task Breakdown

### Phase 1: Data Ingestion & Pipeline
- **Task 1.1**: Author `scripts/fetch_data.py` with chunking, timeouts, exponential backoff retries, and comprehensive error handling.
- **Task 1.2**: Execute ingestion for FUELHH (wind actuals) and WINDFOR (forecasts) covering late Dec 2025 through Jan 2026 into `data/`.
- **Task 1.3**: Validate schema integrity, boundary checks, and write `scripts/verify_data.py` to ensure complete coverage (31 days).

### Phase 2: Core Analytics Engine & Backend API
- **Task 2.1**: Implement domain models and forecast selection engine in `backend/app/services/forecast_selector.py` with strict cutoff filter ($T \le \text{Cutoff}$) and missing forecast handling.
- **Task 2.2**: Implement mathematical metrics engine (`backend/app/services/metrics.py`): Bias, MAE, RMSE, MAPE, WAPE, P50/P90/P95, hourly error profiles, horizon bins, and shortfall buffer.
- **Task 2.3**: Build FastAPI REST routes (`backend/app/api/endpoints.py`): `/health`, `/wind/summary`, `/wind/timeseries`, `/wind/by-hour`, `/wind/by-horizon`, `/wind/distribution`, `/wind/export`.
- **Task 2.4**: Author comprehensive unit tests (`tests/test_forecast_selector.py`, `tests/test_metrics.py`, `tests/test_api.py`) verifying anti-leakage invariants and matching hand-calculated edge cases.

### Phase 3: Interactive Energy Utility Dashboard
- **Task 3.1**: Initialize React + TypeScript + Vite frontend with Tailwind CSS design tokens (deep navy, slate, teal, emerald, amber, rose).
- **Task 3.2**: Build Header, Help Drawer ("How to Read"), and Controls Bar (Date Range, Decision Cutoff selector, Granularity toggle).
- **Task 3.3**: Implement KPI Summary Cards (MAE, RMSE, Bias, P95 Error, P90 Shortfall Reserve Buffer) with clear tooltips and sign conventions.
- **Task 3.4**: Implement primary interactive charts using Recharts:
  - Time series (Actual vs Forecast with shortfall shading)
  - Shortfall Risk & Buyer Thermal Reserve Buffer by hour of day
  - Error by Forecast Horizon Lead-Time
  - Error Frequency Distribution (Histogram)
- **Task 3.5**: Implement Paginated Data Table with multi-column sorting, status badges (Normal, Missing, Shortfall), and CSV Download.

### Phase 4: Packaging, Docker & Deployment Setup
- **Task 4.1**: Build multi-stage `Dockerfile` (optimized static build + Python FastAPI backend) and `.dockerignore`.
- **Task 4.2**: Configure `docker-compose.yml` for unified single-command deployment.
- **Task 4.3**: Set up deployment configurations for both Vercel (frontend static + serverless function) and Heroku/Render (`heroku.yml`). Document reproducible setup in `README.md`.

### Phase 5: Documentation, CodeRabbit Audit & Final Delivery
- **Task 5.1**: Author `README.md` with complete architecture overview, AI usage statement, assumptions, quickstart commands, and test instructions.
- **Task 5.2**: Author technical deep-dives:
  - `docs/ARCHITECTURE.md` (System components, data flow Mermaid diagram, API specs)
  - `docs/METHODOLOGY.md` (Selection logic, anti-leakage proof, formulas, worked examples)
- **Task 5.3**: Author `docs/VIDEO_SCRIPT.md` (Part 1: Client Trading Pitch < 5 min; Part 2: Tech Lead Code Tour < 5 min).
- **Task 5.4**: Run CodeRabbit CLI review (`coderabbit review`), apply corrections, document resolutions in `docs/REVIEW_NOTES.md`, and record Ralph Loop applications.
- **Task 5.5**: Populate `docs/CHECKLIST.md` verifying all quality gates.
