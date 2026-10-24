# Project Specification: UK Day-Ahead Wind Forecast Evaluation Platform

**Status: FINALIZED**
**Version: 1.0.0**
**Target Month: January 2026**
**Data Source: National-level UK Wind Generation from Elexon BMRS**

---

## 1. Product Overview & Context

### 1.1 Business Context
The client is a UK energy utility operating in the GB wholesale electricity market. The day-ahead power trading and commercial procurement desk must decide daily how much power to purchase (from thermal dispatchable plants, interconnectors, or market contracts) to balance customer demand beyond expected intermittent wind generation.

Because wind generation is weather-dependent, power purchase decisions are executed on day $D - 1$ ahead of physical delivery on day $D$. Traders must rely exclusively on forecasts available prior to the day-ahead gate closure / decision cutoff.

### 1.2 Core Objectives
1. **Forecast Transparency**: Isolate and display the **latest available wind forecast** that was strictly published prior to the day-ahead trading decision cutoff for each delivery target period in January 2026, guaranteeing **zero data leakage**.
2. **Quantitative Error Evaluation**: Empirically evaluate forecast error against actual outturn wind generation across January 2026.
3. **Actionable Trading Insights**: Translate error statistics into concrete MW buffer recommendations (shortfall risk quantiles like P90/P95) to inform day-ahead thermal hedge volumes.

---

## 2. Strict Scope & Data Specifications

### 2.1 Elexon BMRS API Endpoints (No API key required)
Base URL: `https://data.elexon.co.uk/bmrs/api/v1`

| Dataset | Endpoint | Query Parameters | Description |
|---|---|---|---|
| **Actuals (FUELHH)** | `/datasets/FUELHH/stream` | `publishDateTimeFrom`, `publishDateTimeTo`, `fuelType=WIND` | National half-hourly outturn generation by fuel type. Filtered to `fuelType = "WIND"`. Fields: `startTime` (UTC ISO), `settlementDate`, `settlementPeriod` (1-48), `generation` (MW). |
| **Forecasts (WINDFOR)** | `/datasets/WINDFOR/stream` | `publishDateTimeFrom`, `publishDateTimeTo` | National wind generation forecast time series. Fields: `startTime` (UTC ISO), `publishTime` (UTC ISO), `generation` (MW). |

### 2.2 Temporal Scope
- **Delivery (Target) Scope**: Entire month of January 2026 (`2026-01-01T00:00:00Z` through `2026-01-31T23:59:59Z`).
- **Fetch Horizon for Forecasts**: Because delivery on Jan 1 00:00 relies on decisions taken on Dec 31 09:00 (which use forecasts published on Dec 30/31), forecast fetch spans `2025-12-28T00:00:00Z` to `2026-02-01T00:00:00Z`.
- **Timezone Handling**: January is in Greenwich Mean Time (GMT, UTC+0). UK local time is identical to UTC. All internal timestamps are stored and processed in standard ISO-8601 UTC.

---

## 3. Core Mathematical Logic & Conventions

### 3.1 Decision Cutoff & Anti-Leakage Rule
For any delivery target time $T$ falling on calendar day $D$:
$$\text{Cutoff}(T) = (D - 1\text{ day}) \text{ at } H_{\text{cutoff}}\text{ (default 09:00 UTC)}$$
A forecast $F$ for target startTime $T$ is eligible for selection if and only if:
$$\text{publishTime}(F) \le \text{Cutoff}(T)$$
The selected forecast $F^*(T)$ is:
$$F^*(T) = \arg\max_{F} \{\text{publishTime}(F) \mid F.\text{startTime} = T \land F.\text{publishTime} \le \text{Cutoff}(T)\}$$
**Anti-Leakage Invariant**:
$$\forall T, \quad \text{publishTime}(F^*(T)) \le \text{Cutoff}(T)$$
Any record violating this invariant fails automated test assertions and triggers an alert.

### 3.2 Granularity Alignment
- `WINDFOR` forecasts are issued at **1-hour resolution** (`:00`).
- `FUELHH` actuals are recorded at **30-minute settlement period resolution** (`:00` and `:30`).
- **Standard Alignment (Default)**: Hourly actual is the arithmetic mean of the two half-hourly settlement periods in that hour:
  $$A(H) = \frac{\text{Actual}(H:00) + \text{Actual}(H:30)}{2}$$
- **Direct Matching Option**: Exact `:00` actual matching is also supported and configurable.

### 3.3 Forecast Horizon
$$\text{Horizon}(T) = T.\text{startTime} - F^*(T).\text{publishTime} \quad (\text{hours})$$
Horizon buckets: `<18h`, `18-24h`, `24-30h`, `30-36h`, `>36h`.

### 3.4 Error Metrics & Sign Conventions
Let $A_i$ be actual wind generation (MW), $F_i$ be forecast wind generation (MW), and $N$ be total evaluated periods.
- **Signed Error**: $e_i = A_i - F_i$ (MW)
  - $e_i > 0$: Wind generation exceeded forecast (Surplus / Long).
  - $e_i < 0$: Wind generation fell short of forecast (Deficit / Short).
- **Mean Bias Error (MBE)**: $\text{Bias} = \frac{1}{N} \sum_{i=1}^N (A_i - F_i)$
  - Negative bias indicates the forecast tends to over-predict wind generation.
- **Mean Absolute Error (MAE)**: $\text{MAE} = \frac{1}{N} \sum_{i=1}^N |A_i - F_i|$
- **Root Mean Squared Error (RMSE)**: $\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (A_i - F_i)^2}$
- **Mean Absolute Percentage Error (MAPE)**:
  $$\text{MAPE} = \frac{100\%}{N_{\text{valid}}} \sum_{i: A_i \ge \epsilon} \frac{|A_i - F_i|}{A_i} \quad (\epsilon = 100\text{ MW})$$
- **Weighted Absolute Percentage Error (WAPE)** (Energy Industry Standard):
  $$\text{WAPE} = \frac{\sum_{i=1}^N |A_i - F_i|}{\sum_{i=1}^N A_i} \times 100\%$$
- **Error Quantiles**: P50 (median absolute error), P90, P95.

### 3.5 Buying Decision Shortfall Risk & Buffer Formulation
Wind shortfall represents the downside exposure where actual generation is less than forecast:
$$\text{Shortfall}_i = \max(0, F_i - A_i) \quad (\text{MW})$$
The buyer's required thermal reserve buffer with confidence level $\alpha$ (e.g. 90% or 95%) is:
$$\text{Buffer}_\alpha = \text{Quantile}_\alpha(\{\text{Shortfall}_i\})$$
This yields a clear trading decision statement:
*"With 90% confidence, wind generation will fall short of the day-ahead forecast by no more than $\text{Buffer}_{0.90}$ MW at this hour, allowing the buying desk to reserve exactly that volume of thermal generation."*

---

## 4. Architectural & Technical Specifications

### 4.1 System Topology
- **Backend**: Python 3.12 + FastAPI + Pydantic v2 + NumPy/Pandas/Polars for vectorized metric computation.
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Recharts.
- **Styling & Theme**: Dedicated Energy Utility design tokens (`--color-navy`, `--color-slate`, `--color-teal`, `--color-emerald`, `--color-amber`, `--color-rose`). Zero purple/violet AI templates. WCAG AA compliant.
- **Data Persistence**: Offline cached Parquet / JSON store generated by reproducible script `scripts/fetch_data.py`. No cold start delays or flaky runtime external API dependencies.
- **Containerization**: Multi-stage `Dockerfile` (frontend build + backend) with `docker-compose.yml` single-command spin-up.
- **Deployment Compatibility**: Tested for Docker container deployment (Heroku / Render / local container) and Vercel serverless / static build.

### 4.2 Quality & Review Protocols
- **Atomic Commits**: One commit per completed task (`type(scope): description`).
- **CodeRabbit Integration**: CLI review executions on tracked changes with findings documented in `docs/REVIEW_NOTES.md`.
- **Ralph Loop**: Iterative hypothesis-test-repair loop applied to core logic validation and metric bounds.
