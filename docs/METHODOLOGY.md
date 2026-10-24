# Day-Ahead Wind Forecast Evaluation Methodology

**Target Scope**: Physical Delivery Days in January 2026 (GB Wholesale Electricity Market)  
**Data Sources**: Elexon BMRS `FUELHH` (Outturn Generation) & `WINDFOR` (Wind Generation Forecasts)  

---

## 1. Day-Ahead Decision Gate Closure & Anti-Leakage Invariant

### 1.1 The Operational Problem
In the Great Britain (GB) power market, commercial buying desks must lock in purchase decisions for physical delivery on day $D$ by day $D - 1$ ahead of day-ahead market gate closure (default **09:00 UK local time / GMT**).

At the moment the decision is taken, any forecast published after 09:00 GMT on $D - 1$ did not exist in the trading room. Incorporating post-cutoff forecasts into an evaluation represents **data leakage** and produces misleadingly optimistic accuracy figures.

### 1.2 Mathematical Selection Logic
Let:
- $T$ be the physical delivery target hour on delivery calendar date $D$.
- $H_{\text{cutoff}}$ be the configured gate closure hour on $D - 1$ (default `09:00:00 UTC`).
- $\text{Cutoff}(T) = \text{datetime}(D - 1\text{ day}, H_{\text{cutoff}}, 0, 0, \text{UTC})$.
- $\mathcal{F}(T) = \{ F \in \text{WINDFOR} \mid F.\text{startTime} = T \}$ be the set of all forecasts published for target time $T$.

The eligible forecast set $\mathcal{E}(T)$ is defined as:
$$\mathcal{E}(T) = \{ F \in \mathcal{F}(T) \mid F.\text{publishTime} \le \text{Cutoff}(T) \}$$

The engine selects the latest forecast available prior to cutoff:
$$F^*(T) = \begin{cases} 
\arg\max_{F \in \mathcal{E}(T)} (F.\text{publishTime}) & \text{if } \mathcal{E}(T) \neq \emptyset \\ 
\text{NULL} & \text{if } \mathcal{E}(T) = \emptyset 
\end{cases}$$

### 1.3 Anti-Leakage Invariant
Every selected forecast satisfies:
$$\forall T, \quad F^*(T).\text{publishTime} \le \text{Cutoff}(T)$$
If $F^*(T) = \text{NULL}$, the period is tagged with `status = "MISSING_FORECAST"`. In January 2026 under the default 09:00 cutoff, 744 out of 744 target hours (100.0%) possess valid pre-cutoff forecasts.

---

## 2. Granularity Alignment & Timezone Conventions

- **Timezone**: All timestamps are stored and evaluated in **UTC**. In January, the UK operates on Greenwich Mean Time (GMT), which is identically UTC+0.
- **WINDFOR Granularity**: Elexon WINDFOR forecasts are published at **1-hour intervals** (`:00`).
- **FUELHH Granularity**: Elexon FUELHH actuals are recorded per **30-minute settlement period** (`:00` and `:30`).
- **Standard Harmonization (Default)**: Outturn electricity generation across hour $[H, H+1)$ is the arithmetic average of its two half-hour readings:
  $$A(H) = \frac{\text{Actual}(H:00) + \text{Actual}(H:30)}{2}$$
  Because 1 MW sustained for 1 hour produces 1 MWh of energy, averaging two 30-minute MW readings accurately represents the physical energy delivered in that hour.

---

## 3. Forecast Lead-Time Horizon

The forecast lead horizon measures how far in advance the day-ahead forecast was produced:
$$\text{Horizon}(T) = T.\text{startTime} - F^*(T).\text{publishTime} \quad (\text{hours})$$

For decisions taken on day $D - 1$ at 09:00:
- For $T = \text{00:00}$ on day $D$: if published at Dec 31 07:30 UTC, $\text{Horizon} = 16.5\text{ hours}$.
- For $T = \text{23:00}$ on day $D$: $\text{Horizon} = 39.5\text{ hours}$.

---

## 4. Error Metrics & Sign Conventions

Let $A_i$ be actual outturn generation (MW), $F_i$ be the selected day-ahead forecast (MW), and $N$ be the number of matched periods.

### 4.1 Signed Error ($e_i$)
$$e_i = A_i - F_i \quad (\text{MW})$$
- **Positive Error ($e_i > 0$)**: Actual wind generation exceeded the forecast (**Wind Surplus / Long Position**).
- **Negative Error ($e_i < 0$)**: Actual wind generation fell short of the forecast (**Wind Deficit / Short Position**).

### 4.2 Mean Bias Error (Bias)
$$\text{Bias} = \frac{1}{N} \sum_{i=1}^N (A_i - F_i) \quad (\text{MW})$$
- A **negative bias** indicates a systematic tendency for the forecast to **over-predict** wind generation (downside risk for buyers).
- A **positive bias** indicates systematic under-prediction.

### 4.3 Mean Absolute Error (MAE)
$$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |A_i - F_i| \quad (\text{MW})$$

### 4.4 Root Mean Squared Error (RMSE)
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (A_i - F_i)^2} \quad (\text{MW})$$
RMSE penalizes large forecast blunders more heavily than MAE.

### 4.5 Weighted Absolute Percentage Error (WAPE)
$$\text{WAPE} = \frac{\sum_{i=1}^N |A_i - F_i|}{\sum_{i=1}^N A_i} \times 100\%$$
WAPE is the recognized energy trading industry standard because it avoids distortions caused by division by small actual numbers.

### 4.6 Guarded Mean Absolute Percentage Error (MAPE)
$$\text{MAPE} = \frac{100\%}{N_{A \ge 100}} \sum_{i: A_i \ge 100} \frac{|A_i - F_i|}{A_i}$$
Periods with outturn $< 100\text{ MW}$ are guarded to prevent explosive ratios.

### 4.7 Quantiles of Absolute Error
$$P_{50} = \text{Median}(\{|e_i|\}), \quad P_{90} = 90\text{th percentile}(\{|e_i|\}), \quad P_{95} = 95\text{th percentile}(\{|e_i|\})$$

---

## 5. Downside Shortfall Risk & Thermal Reserve Buffer Formulation

For a commercial buying desk, the primary financial hazard is **wind under-generation** ($A_i < F_i$). If the utility buys insufficient thermal power because it expected high wind generation, it must settle the imbalance at punitive Cashout / Imbalance settlement prices.

### 5.1 Downside Shortfall
$$\text{Shortfall}_i = \max(0, F_i - A_i) \quad (\text{MW})$$
- If $A_i \ge F_i$: $\text{Shortfall}_i = 0\text{ MW}$ (no deficit).
- If $A_i < F_i$: $\text{Shortfall}_i = F_i - A_i > 0\text{ MW}$.

### 5.2 P90 Shortfall Reserve Buffer
$$\text{Buffer}_{0.90} = \text{Quantile}_{0.90}(\{ \text{Shortfall}_i \}_{i=1}^N) \quad (\text{MW})$$

**Trader Translation**:
> *"With 90% statistical confidence across January 2026, wind generation will not fall short of the day-ahead forecast by more than $\text{Buffer}_{0.90}$ MW at this hour. Procurement can reserve exactly that volume of dispatchable thermal power to hedge downside cashout exposure."*

---

## 6. Worked Example

Consider 5 physical delivery hours:

| Period $i$ | Target Time | Actual $A_i$ (MW) | Forecast $F_i$ (MW) | Signed Error $A_i - F_i$ | Absolute Error $|e_i|$ | Squared Error $e_i^2$ | Shortfall $\max(0, F_i - A_i)$ |
|---|---|---|---|---|---|---|---|
| 1 | 08:00 UTC | 1,000 | 800 | +200 | 200 | 40,000 | 0 |
| 2 | 09:00 UTC | 2,000 | 2,500 | -500 | 500 | 250,000 | 500 |
| 3 | 10:00 UTC | 1,500 | 1,500 | 0 | 0 | 0 | 0 |
| 4 | 11:00 UTC | 3,000 | 2,000 | +1,000 | 1,000 | 1,000,000 | 0 |
| 5 | 12:00 UTC | 2,500 | 2,800 | -300 | 300 | 90,000 | 300 |

### Computations:
1. **Sum of Actuals**: $1,000 + 2,000 + 1,500 + 3,000 + 2,500 = 10,000\text{ MW}$ (Mean: $2,000.0\text{ MW}$)
2. **Sum of Forecasts**: $800 + 2,500 + 1,500 + 2,000 + 2,800 = 9,600\text{ MW}$ (Mean: $1,920.0\text{ MW}$)
3. **Bias**:
   $$\text{Bias} = \frac{200 - 500 + 0 + 1000 - 300}{5} = \frac{+400}{5} = +80.0\text{ MW}$$
4. **MAE**:
   $$\text{MAE} = \frac{200 + 500 + 0 + 1000 + 300}{5} = \frac{2000}{5} = 400.0\text{ MW}$$
5. **RMSE**:
   $$\text{RMSE} = \sqrt{\frac{40,000 + 250,000 + 0 + 1,000,000 + 90,000}{5}} = \sqrt{\frac{1,380,000}{5}} = \sqrt{276,000} \approx 525.4\text{ MW}$$
6. **WAPE**:
   $$\text{WAPE} = \frac{2,000}{10,000} \times 100\% = 20.0\%$$
7. **Absolute Error Quantiles**:
   Sorted absolute errors: $[0, 200, 300, 500, 1000]$  
   $P_{50} (\text{Median}) = 300.0\text{ MW}$.
8. **Shortfalls**: $[0, 500, 0, 0, 300]$.  
   Shortfall occurred in 2 out of 5 periods (40.0% frequency).
