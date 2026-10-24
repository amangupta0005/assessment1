import React from 'react';
import { OverallSummaryKPIs } from '../types';
import { Activity, BarChart3, TrendingUp, CheckCircle, ShieldAlert } from 'lucide-react';

interface KpiCardsProps {
  kpis: OverallSummaryKPIs | null;
  isLoading: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis, isLoading }) => {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6 mb-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`bg-white rounded-xl p-6 shadow-xs border border-slate-200 animate-pulse h-36 ${
              i === 0 ? 'md:col-span-2 xl:col-span-2' : ''
            }`}
          />
        ))}
      </div>
    );
  }

  const isOverForecasting = kpis.bias_mw < 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6 mb-6">
      {/* 1. Trader Buying Buffer (P90 Shortfall) - Highlight Card */}
      <div
        className="bg-amber-50/90 rounded-xl p-6 border-2 border-amber-400 shadow-xs relative overflow-hidden md:col-span-2 xl:col-span-2 flex flex-col justify-between"
        title="P90 Shortfall Buffer: with 90% confidence, wind generation will not fall short of the day-ahead forecast by more than this volume."
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-2 text-[14px] font-semibold text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>P90 Shortfall Reserve Buffer</span>
            </span>
            <span className="bg-amber-200/90 text-amber-950 text-[13px] px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap">
              Trader key metric
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[36px] font-bold text-amber-950 tabular-nums tracking-tight leading-none">
              +{Math.round(kpis.p90_shortfall_buffer_mw).toLocaleString()}
            </span>
            <span className="text-[16px] font-medium text-[#7A4B00]">MW</span>
          </div>
        </div>

        <p className="text-[13px] text-[#7A4B00] mt-3 font-medium leading-relaxed">
          With 90% confidence, wind will not fall short by more than this volume. Add as thermal hedge.
        </p>
      </div>

      {/* 2. MAE */}
      <div
        className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between"
        title="Mean Absolute Error (MAE): average magnitude of forecast errors without considering direction."
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-800">
              <Activity className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>MAE</span>
            </span>
            <span className="text-[13px] text-slate-600 font-semibold tabular-nums">
              WAPE {kpis.wape_pct}%
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-[36px] font-bold text-slate-900 tabular-nums tracking-tight leading-none">
              {Math.round(kpis.mae_mw).toLocaleString()}
            </span>
            <span className="text-[16px] font-medium text-slate-500">MW</span>
          </div>
        </div>

        <p className="text-[13px] text-slate-600 mt-3 font-normal leading-normal">
          Mean absolute error across evaluated hours
        </p>
      </div>

      {/* 3. RMSE */}
      <div
        className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between"
        title="Root Mean Squared Error (RMSE): penalizes larger deviations more heavily than MAE."
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-800">
              <BarChart3 className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>RMSE</span>
            </span>
            <span className="text-[13px] text-slate-600 font-medium tabular-nums">
              P95: {Math.round(kpis.p95_error_mw).toLocaleString()} MW
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-[36px] font-bold text-slate-900 tabular-nums tracking-tight leading-none">
              {Math.round(kpis.rmse_mw).toLocaleString()}
            </span>
            <span className="text-[16px] font-medium text-slate-500">MW</span>
          </div>
        </div>

        <p className="text-[13px] text-slate-600 mt-3 font-normal leading-normal">
          Variance penalty for large forecast deviations
        </p>
      </div>

      {/* 4. Forecast Bias */}
      <div
        className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between"
        title="Forecast Bias (Mean Error = Actual - Forecast): indicates systematic over- or under-forecasting."
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-800">
              <TrendingUp className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>Forecast Bias</span>
            </span>
            <span
              className={`text-[13px] px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                isOverForecasting
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isOverForecasting ? 'Over-predicting' : 'Under-predicting'}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-2">
            <span
              className={`text-[36px] font-bold tabular-nums tracking-tight leading-none ${
                isOverForecasting ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {kpis.bias_mw > 0
                ? `+${Math.round(kpis.bias_mw).toLocaleString()}`
                : Math.round(kpis.bias_mw).toLocaleString()}
            </span>
            <span className="text-[16px] font-medium text-slate-500">MW</span>
          </div>
        </div>

        <p className="text-[13px] text-slate-600 mt-3 font-normal leading-normal">
          Actual minus forecast (systematic tilt)
        </p>
      </div>

      {/* 5. Data Coverage */}
      <div
        className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between"
        title="Data Completeness: percentage of target delivery hours with verified pre-cutoff forecasts."
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-800">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Completeness</span>
            </span>
            <span className="text-[13px] text-emerald-800 font-semibold tabular-nums">
              {kpis.data_completeness_pct}%
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-[36px] font-bold text-slate-900 tabular-nums tracking-tight leading-none">
              {kpis.matched_periods}
            </span>
            <span className="text-[16px] font-medium text-slate-500">
              / {kpis.total_periods} hrs
            </span>
          </div>
        </div>

        <p className="text-[13px] text-slate-600 mt-3 font-normal leading-normal">
          {kpis.missing_periods === 0 ? 'Zero missing forecasts' : `${kpis.missing_periods} missing`}
        </p>
      </div>
    </div>
  );
};
