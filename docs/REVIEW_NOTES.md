# Review Notes: CodeRabbit & Ralph Loop Methodology

This document tracks automated code reviews, findings, intentional architectural choices, and the application of the Ralph Loop across project development.

---

## 1. CodeRabbit Review Audit & Findings

### 1.1 Local CodeRabbit CLI Audit
The CodeRabbit CLI (v0.9.0) was initialized and executed against git staged changes.
- **CLI Doctor Check**: Passed environment validation, storage write checks, and dependency verification.
- **Authentication State**: CodeRabbit CLI requires interactive browser OAuth sign-in (`coderabbit auth login`) or a cloud API key. For headless automated runs without user token injection, code quality, typing, and linting gates were enforced locally via `pytest`, TypeScript compiler (`tsc`), and strict static assertions.
- **Self-Review Audit Findings & Resolutions**:
  1. *Finding*: Syntax error in `backend/app/config.py` (`from pydantic_settings import BaseSettings if False else object`).
     - *Resolution*: Removed invalid inline conditional import and created clean `Settings` class with explicit path defaults.
  2. *Finding*: Missing `@types/react`, `@types/react-dom`, and `@vitejs/plugin-react` during initial frontend compilation.
     - *Resolution*: Installed required type packages and plugins; configured `compilerOptions.types` in `tsconfig.json`.
  3. *Finding*: Tailwind CSS v4 separation of PostCSS plugin (`@tailwindcss/postcss`).
     - *Resolution*: Installed `@tailwindcss/postcss`, updated `postcss.config.js`, and standardized `index.css` to `@import "tailwindcss";`.
  4. *Finding*: Division by zero in MAPE when actual generation approaches zero.
     - *Resolution*: Guarded MAPE to only evaluate periods where $A_i \ge 100\text{ MW}$, and introduced WAPE (Weighted Absolute Percentage Error), which is the standard power utility metric.

---

## 2. Ralph Loop Methodology & Application

### 2.1 What is the Ralph Loop?
The **Ralph Loop** is a rigorous, test-driven self-correction paradigm used in agentic software engineering:
$$\text{Hypothesize} \longrightarrow \text{Execute} \longrightarrow \text{Observe} \longrightarrow \text{Reflect \& Repair}$$

Rather than assuming code works because it was written cleanly, the Ralph Loop forces the engineer to author empirical verification tests, subject edge cases to stress vectors, capture physical outputs, and iteratively eliminate failure modes before claiming completion.

### 2.2 How the Ralph Loop Helped in This Project

1. **Anti-Leakage Verification Loop**:
   - *Hypothesis*: Selecting forecasts with `publishTime <= Cutoff(D-1 at 09:00)` might accidentally pick a forecast published on day $D$ if date arithmetic treats cutoff relative to target time rather than target calendar date.
   - *Observation*: Initial hand simulation revealed that for a target delivery at `2026-01-01 00:00:00 UTC`, cutoff must be `2025-12-31 09:00:00 UTC` (exactly 15 hours prior).
   - *Refinement*: Coded `test_anti_leakage_invariant_on_cached_data` to assert that across all 744 target hours in January 2026, `publish_time <= cutoff_time` holds with zero exceptions ($0$ leaks detected across $100\%$ of periods).
   
2. **Granularity Harmonization Discovery**:
   - *Hypothesis*: Both `FUELHH` and `WINDFOR` would have 30-minute intervals.
   - *Observation*: Live API testing of Elexon BMRS revealed `WINDFOR` is published only at 1-hour intervals (`HH:00`), whereas `FUELHH` is 30-minute intervals (`:00` and `:30`).
   - *Refinement*: Instead of discarding half the actual data or interpolating forecasts artificially, implemented hourly energy-weighted averaging: $A(H) = \frac{A(H:00) + A(H:30)}{2}$, matching the physics of power delivery (MW to MWh).
   
3. **Shortfall Buffer Mathematical Grounding**:
   - *Hypothesis*: Typical dashboards only display MAE and RMSE, which are symmetric and fail to inform an asymmetric buying decision.
   - *Observation*: Power trading desks care primarily about downside deficit ($A < F$) because unexpected wind deficits force utilities to purchase expensive spot thermal power or pay imbalance cashout penalties.
   - *Refinement*: Added explicit `shortfall_mw = max(0, F - A)` metric and computed the **P90 Shortfall Buffer**. Tested with hand-computed edge cases in `test_hand_computed_metrics`.
