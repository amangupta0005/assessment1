# Video Presentation Scripts

---

## Part 1: Client Pitch — Commercial Wind Buying Intelligence (< 5 Minutes)

**Target Audience**: Head of Power Trading, Day-Ahead Buying Desk, and Risk Managers at a UK Energy Utility  
**Presenter Tone**: Confident, commercially grounded, value-focused, and concise  
**Estimated Run Time**: 4 minutes 30 seconds  

---

### [0:00 – 0:45] 1. The Commercial Dilemma (Problem Statement)
*(Visual: Opening on dashboard header showing January 2026 title and Gate Closure badge)*

> "Good morning. In the UK wholesale electricity market, day-ahead power trading is a game of managing asymmetric risk. Every morning before gate closure—typically 09:00 GMT on day $D - 1$—our commercial buying team must decide exactly how much thermal power or market volume to procure to balance our customer load.
>
> "Because wind generation is weather-dependent, we rely heavily on national wind forecasts. But here is the problem: if wind under-generates relative to our forecast, our utility is exposed to severe imbalance settlement cashout prices. Conversely, over-hedging locks in unnecessary thermal fuel costs.
>
> "To buy effectively, our desk needs two things: first, complete transparency on the **exact, latest wind forecast available at the moment the buying decision was locked in**; and second, a quantitative way to translate forecast uncertainty into an **actionable MW thermal buffer**. That is what this platform delivers."

---

### [0:45 – 2:00] 2. Live Platform Walkthrough & Features
*(Visual: Screen share navigating the dashboard, demonstrating filter controls, cutoff selector, and KPI cards)*

> "Let's walk through the platform using full data from January 2026, pulled directly from Elexon BMRS.
>
> "At the top, you immediately see our Gate Closure indicator: **09:00 GMT on D-1**. We guarantee **strict zero data leakage**—not a single forecast published after that cutoff is ever included. If gate closure shifts—for example, if our desk trades earlier at 08:00 or participates in a later 11:00 auction—we simply adjust the cutoff selector, and the entire platform recalculates dynamically in real time.
>
> "Looking at the KPI cards: across January 2026, we achieved 100% data completeness over all 744 delivery hours. Our Mean Absolute Error was approximately 1,650 MW, with a Weighted Absolute Percentage Error (WAPE) of 18.5%.
>
> "Notice the Forecast Bias: negative 235 MW. That tells our desk that the day-ahead forecast systematically over-predicted wind generation throughout January. In other words, wind fell short more often than it exceeded expectations."

---

### [2:00 – 3:30] 3. The Core Trader Insight: P90 Shortfall Reserve Buffer
*(Visual: Hovering on the P90 Shortfall Buffer KPI card, then zooming into the Hourly Shortfall Risk chart)*

> "Here is where this tool changes how our buying desk operates. Rather than just reporting symmetric statistical error, we isolate **downside shortfall**—the exact hours where actual wind fell below the forecast.
>
> "Highlighted prominently on the first KPI card is the **P90 Shortfall Reserve Buffer**. For January 2026, this number is approximately **2,840 MW**. 
>
> "What does that mean for a buyer? It means that with **90% statistical confidence**, wind will not fall short of the day-ahead forecast by more than 2,840 MW. A trader can take the day-ahead wind forecast, subtract this buffer, and reserve exactly that volume of dispatchable thermal capacity to cover downside risk.
>
> "Even better, look at our **Shortfall by Hour of Day** chart below. Wind uncertainty is not flat across the day. Between hours 08:00 and 19:00 during peak grid demand, the required buffer varies. Traders can now tailor their thermal hedge hour-by-hour rather than carrying an expensive flat buffer 24/7."

---

### [3:30 – 4:30] 4. Business Value & Conclusion
*(Visual: Demonstrating the full audit table, CSV download, and responsive layout)*

> "Finally, every physical delivery period is fully auditable in the data table below, complete with publish timestamps, lead horizons, and one-click CSV export for downstream risk models.
>
> "In summary: this platform replaces guesswork with empirical confidence. It guarantees zero data leakage, provides hour-specific thermal hedging recommendations, and protects our utility from costly imbalance penalties. Thank you."

---
---

## Part 2: Technical Architecture & Code Tour (< 5 Minutes)

**Target Audience**: Lead Software Architect, Engineering Manager, Senior Full-Stack Reviewers  
**Presenter Tone**: Rigorous, technical, code-grounded, and direct  
**Estimated Run Time**: 4 minutes 45 seconds  

---

### [0:00 – 1:00] 1. Architectural Topology & Ingestion Pipeline
*(Visual: Displaying `docs/ARCHITECTURE.md` Mermaid diagram, then opening `scripts/fetch_data.py`)*

> "Hello. In this technical walkthrough, I will review the architecture, core algorithms, and verification practices behind the UK Wind Forecast Evaluation Platform.
>
> "The repository follows a clean, decoupled full-stack architecture: a React 18 TypeScript frontend built with Vite and Tailwind CSS, backed by a high-performance Python 3.12 FastAPI service.
>
> "Let's begin at the data ingestion layer in `scripts/fetch_data.py`. We ingest two official stream datasets from Elexon BMRS API v1: `FUELHH` for actual outturn generation, filtered to fuel type 'WIND', and `WINDFOR` for wind generation forecasts.
>
> "To ensure enterprise reliability, the fetch script uses 7-day chunking, socket timeouts, and exponential backoff retry with random jitter. It persists cleaned data into dual formats: Parquet for high-speed columnar reads, and JSON for portable inspection.
>
> "Crucially, to cover all delivery days in January 2026, our forecast fetch window starts on December 28, 2025. This ensures that delivery on January 1 at 00:00—which relies on a decision made on December 31 at 09:00—has its complete forecast history available."

---

### [1:00 – 2:15] 2. Core Selection Algorithm & Anti-Leakage Proof
*(Visual: Code tour in `backend/app/services/forecast_selector.py`)*

> "Let's examine the core logic in `backend/app/services/forecast_selector.py`.
>
> "For any delivery target time $T$ on calendar day $D$, the day-ahead decision cutoff is defined strictly as $(D - 1\text{ day})$ at the configured cutoff time (default 09:00 UTC).
>
> "Our selector filters forecasts to those targeting time $T$ whose `publishTime` is strictly less than or equal to that cutoff. From this eligible set, it selects the record with the maximum publish timestamp. Any forecast published at 09:01 or later is strictly ignored.
>
> "We also solved an empirical domain discrepancy: Elexon `WINDFOR` publishes at 1-hour intervals (`HH:00`), whereas `FUELHH` actuals are 30-minute settlement periods (`:00` and `:30`). Rather than interpolating or discarding data, our engine computes the hourly outturn actual as the arithmetic mean of the two half-hours. Because generation is measured in MW, averaging over 1 hour accurately preserves the integral energy delivered in MWh."

---

### [2:15 – 3:30] 3. Metrics Engine & The Ralph Loop
*(Visual: Showing `backend/app/services/metrics_engine.py` and `backend/tests/`)*

> "Moving to `backend/app/services/metrics_engine.py`: all calculations are vectorized using NumPy for microsecond evaluation speed.
>
> "We follow clear sign conventions: `Error = Actual - Forecast`. Positive is surplus; negative is deficit.
>
> "Beyond standard MAE and RMSE, we implemented:
> 1. Guarded MAPE ($A_i \ge 100\text{ MW}$) to prevent division by zero or explosive ratios at low generation.
> 2. WAPE (Weighted Absolute Percentage Error), which is the power market standard.
> 3. Downside Shortfall: $\max(0, F_i - A_i)$, with P90 and P95 quantile buffers.
>
> "In accordance with our engineering discipline, we applied the **Ralph Loop**—an iterative hypothesis-test-repair cycle. We authored unit tests in `backend/tests/test_forecast_selector.py` and `test_metrics_engine.py` verifying hand-calculated test vectors, and proved our anti-leakage invariant across all 744 periods with zero leakage."

---

### [3:30 – 4:45] 4. Frontend Design, Docker & Deployment
*(Visual: Code tour in `frontend/src/` showing design tokens, Dockerfile, and docker-compose.yml)*

> "On the frontend: we implemented a bespoke energy utility design system in Tailwind CSS using deep navy, slate, teal, and amber design tokens. There is zero purple or gradient-heavy AI template styling, and all contrast ratios meet WCAG AA standards.
>
> "We use Recharts for responsive, accessible time series, hourly profiles, lead-time horizon buckets, and histogram frequency distributions.
>
> "For packaging: we provide a multi-stage `Dockerfile` (Node 22 static builder + Python 3.12-slim runtime) and a `docker-compose.yml` allowing the entire platform to start with a single command: `docker-compose up`.
>
> "For cloud deployment, we configured `vercel.json` and `api/index.py` for Vercel static and Python serverless execution, as well as `heroku.yml` for container deployment.
>
> "Every endpoint, component, and assumption is fully documented in `README.md`, `ARCHITECTURE.md`, and `METHODOLOGY.md`. Thank you."
