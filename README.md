# UK Day-Ahead Wind Forecast Evaluation Platform

> **Take-Home Assessment for UK Energy Utility**  
> Physical Delivery Scope: **January 2026** (GB Wholesale Electricity Market)  
> Data Source: **Elexon BMRS** (`FUELHH` Actuals & `WINDFOR` Forecasts)  
> Live App Deployment: `[PENDING DEPLOYMENT — See Deployment Guide Below]`

---

## 1. Project Overview & Commercial Context

In the Great Britain wholesale electricity market, commercial buying teams at energy utilities must make day-ahead power purchasing decisions (e.g. contracting thermal generation or market hedges) to balance consumer demand beyond intermittent wind generation.

Because wind is weather-dependent, these purchase decisions are finalized on day $D - 1$ prior to gate closure (default **09:00 UK local time / GMT**). 

This production-grade platform addresses two critical commercial requirements:
1. **Forecast Transparency & Zero Data Leakage**: Isolates the **latest available wind forecast** published strictly prior to the day-ahead decision cutoff for each delivery target hour in January 2026.
2. **Actionable Shortfall Hedging**: Rather than merely reporting symmetric errors, the platform computes downside shortfall risk and outputs an actionable **P90 Shortfall Reserve Buffer (MW)**, informing buyers how much thermal capacity to reserve with 90% confidence.

---

## 2. Statement on AI Tooling

In accordance with project guidelines, this repository was developed utilizing modern AI-assisted engineering practices and plugins:
- **Google Antigravity**: Orchestrated the architectural planning, development, and multi-stage testing cycles.
- **Get Shit Done (GSD)**: Directed the phased decomposition (`.gsd/SPEC.md`, `.gsd/ROADMAP.md`, `.gsd/STATE.md`), enforcing planning locks and atomic commits per task.
- **CodeRabbit CLI**: Performed code review passes on staged changes, resolving syntax, typing, and configuration findings (recorded in `docs/REVIEW_NOTES.md`).
- **Ralph Loop**: Systematically applied as a test-driven self-correction loop to eliminate edge-case failures across anti-leakage invariants, granularity harmonization, and metric quantiles.

---

## 3. Core Assumptions & Mathematical Conventions

| Dimension | Standard Assumption | Operational Rationale |
|---|---|---|
| **Decision Cutoff** | **09:00 GMT on Day $D - 1$** (Configurable in UI/API) | Day-ahead market decisions for day $D$ delivery are finalized on $D - 1$. Only forecasts published before cutoff are eligible. Post-cutoff forecasts are strictly excluded. |
| **Timezone** | **Greenwich Mean Time (GMT / UTC)** | In January, UK local time is GMT (UTC+0). All internal timestamps are stored and evaluated in standard ISO-8601 UTC. |
| **Granularity Harmonization** | **Hourly Mean** ($:00$ and $:30$) | Elexon `WINDFOR` forecasts are hourly (`:00`), whereas `FUELHH` actuals are 30-minute settlement periods. The standard view averages both half-hours: $A(H) = \frac{A(H:00) + A(H:30)}{2}$, matching physical energy delivery (MWh). Exact $:00$ matching is also supported. |
| **Signed Error** | **$e_i = A_i - F_i$ (MW)** | **Positive ($>0$)** = Wind Surplus (Long).<br/>**Negative ($<0$)** = Wind Deficit (Short). |
| **Forecast Bias** | **$\text{Bias} = \frac{1}{N} \sum (A_i - F_i)$** | Negative bias indicates the forecast systematically over-predicts wind generation. |
| **P90 Shortfall Buffer** | **$\text{Quantile}_{0.90}(\{ \max(0, F_i - A_i) \})$** | Downside deficit in MW. Indicates that with 90% confidence, wind will not fall short of forecast by more than this amount, setting the buyer's thermal hedge volume. |

For full mathematical proofs and worked examples, see [docs/METHODOLOGY.md](docs/METHODOLOGY.md).

---

## 4. Repository Structure

```
assessment/
├── .gsd/                      # GSD protocol specifications, roadmap, and state memory
│   ├── SPEC.md
│   ├── ROADMAP.md
│   └── STATE.md
├── backend/                   # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py            # FastAPI entrypoint & static mount
│   │   ├── config.py          # Application settings & data paths
│   │   ├── models/schemas.py  # Strictly typed Pydantic models
│   │   ├── services/
│   │   │   ├── data_loader.py       # Parquet/JSON cached loader
│   │   │   ├── forecast_selector.py # Core anti-leakage selection engine
│   │   │   └── metrics_engine.py    # Vectorized metrics & shortfall buffer
│   │   └── api/endpoints.py   # REST API routes (/api/wind/*)
│   ├── tests/                 # Pytest test suite (15 unit & integration tests)
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/                  # React 18 + TypeScript + Vite Dashboard
│   ├── src/
│   │   ├── components/        # UI components (Header, KpiCards, Charts, Table)
│   │   ├── services/api.ts    # API client
│   │   ├── types/index.ts     # TypeScript interface contracts
│   │   ├── App.tsx            # Main state orchestrator
│   │   └── index.css          # Design tokens (Energy utility palette, WCAG AA)
│   ├── package.json
│   └── tailwind.config.js
├── data/                      # Cached January 2026 datasets (Parquet & JSON)
│   ├── actuals_jan_2026.parquet
│   ├── actuals_jan_2026.json
│   ├── forecasts_jan_2026.parquet
│   └── forecasts_jan_2026.json
├── scripts/                   # Ingestion & verification scripts
│   ├── fetch_data.py          # Elexon BMRS fetcher with exponential backoff
│   └── verify_data.py         # Empirical verification suite
├── docs/                      # Architectural & methodology documentation
│   ├── ARCHITECTURE.md        # System components, data flow Mermaid diagram, API specs
│   ├── METHODOLOGY.md         # Mathematical formulas and hand-computed worked example
│   ├── REVIEW_NOTES.md        # CodeRabbit findings and Ralph Loop report
│   ├── VIDEO_SCRIPT.md        # Client pitch & Tech Lead code tour scripts
│   └── CHECKLIST.md           # Production verification checklist
├── Dockerfile                 # Multi-stage container build (Node 22 + Python 3.12)
├── docker-compose.yml         # Single-command start
├── vercel.json                # Vercel serverless deployment config
├── api/index.py               # Vercel serverless function entrypoint
├── heroku.yml                 # Heroku container deployment config
└── README.md                  # This file
```

---

## 5. How to Run Locally

### Prerequisites
- Python 3.12+
- Node.js v20+ / npm 10+
- (Optional) Docker & Docker Compose

### 5.1 Standard Local Execution

#### 1. Backend Service
```bash
# From project root
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

#### 2. Frontend Dashboard
```bash
# In a new terminal window
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`. The Vite proxy will automatically forward `/api` and `/health` requests to port `8000`.

---

## 6. How to Run via Docker (Single Command)

To build and run the entire platform as a unified containerized service:

```bash
docker-compose up --build
```
Once started, access the complete application at `http://localhost:8000`. The container health check verifies readiness automatically via `/health`.

---

## 7. How to Run Tests

### Run Backend Unit & Integration Tests
```bash
python -m pytest backend/tests -v
```
All 15 tests verify anti-leakage invariants, numerical edge cases, and API endpoint contracts against hand-computed examples.

### Run Empirical Data Verification
```bash
python scripts/verify_data.py
```
Validates record counts, non-negative bounds, 31-day January coverage, and 100% matched target periods under the default cutoff.

### Run Frontend TypeScript Compilation & Build
```bash
cd frontend
npm run build
```

---

## 8. How to Refresh Data from Elexon BMRS

The repository ships with cleaned, validated January 2026 data in `data/`. To re-fetch or refresh the raw datasets directly from Elexon BMRS:

```bash
python scripts/fetch_data.py
```
This fetches in 7-day chunks with exponential backoff and jitter, filters to FUELHH WIND and WINDFOR January targets, and writes clean Parquet and JSON files to `data/`.

---

## 9. Deployment Guide

### Deployment Options

#### Option A: Vercel (Recommended for Serverless)
- Vercel provides seamless static frontend hosting combined with Python serverless functions.
- The project is pre-configured with `vercel.json` and `api/index.py`.
- **Deploy Steps**:
  1. Push this repository to GitHub.
  2. Import the project in the [Vercel Dashboard](https://vercel.com).
  3. Deploy! Vercel builds the frontend via `frontend/dist` and routes `/api/*` to `api/index.py`.

#### Option B: Heroku / Container Platforms (Docker)
- Configured via `heroku.yml` using container deployment:
  ```bash
  heroku create my-wind-eval-app --manifest
  git push heroku master
  ```

---

## 10. Known Limitations & Edge Cases

1. **Intraday Gate Closures**: The platform currently focuses on day-ahead procurement ($D - 1$ at configured cutoff). Intraday balancing market adjustments ($D - 1\text{ to } D - 1\text{ hour}$) are outside the day-ahead scope.
2. **Extreme Low Generation MAPE**: During calm periods where actual wind generation drops below 100 MW, percentage error metrics (MAPE) become hypersensitive. The platform guards against division by zero and surfaces **WAPE (Weighted Absolute Percentage Error)** as the primary reliability metric.
