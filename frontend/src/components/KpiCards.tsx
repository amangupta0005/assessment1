import React from 'react';
import { OverallSummaryKPIs } from '../types';
import { Activity, AlertCircle, ShieldAlert, BarChart3, TrendingUp, CheckCircle } from 'lucide-react';

interface KpiCardsProps {
  kpis: OverallSummaryKPIs | null;
  isLoading: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis, isLoading }) => {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const isOverForecasting = kpis.bias_mw < 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
      {/* 1. Trader Buying Buffer (P90 Shortfall) - Highlight Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl p-4 border-2 border-amber-400/80 shadow-sm relative overflow-hidden sm:col-span-2 lg:col-span-2">
        <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>P90 Shortfall Reserve Buffer</span>
          </span>
          <span className="bg-amber-200/80 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
            TRADER KEY METRIC
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-extrabold text-amber-950 font-mono tracking-tight">
            +{kpis.p90_shortfall_buffer_mw.toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-amber-800">MW</span>
        </div>
        <p className="text-[11px] text-amber-800/90 mt-1 leading-tight">
          With 90% confidence, wind will not fall short by more than this volume. Add as thermal reserve.
        </p>
      </div>

      {/* 2. MAE */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
          <span className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>MAE</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">WAPE {kpis.wape_pct}%</span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {kpis.mae_mw.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-500">MW</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Mean Absolute Error across periods</p>
      </div>

      {/* 3. RMSE */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>RMSE</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">P95: {kpis.p95_error_mw} MW</span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {kpis.rmse_mw.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-500">MW</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Root Mean Squared Error (variance penalty)</p>
      </div>

      {/* 4. Forecast Bias */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span>Forecast Bias</span>
          </span>
          <span
            className={`text-[10px] px-1 py-0.2 rounded font-semibold ${
              isOverForecasting
                ? 'bg-rose-100 text-rose-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {isOverForecasting ? 'Over-predicting' : 'Under-predicting'}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span
            className={`text-2xl font-bold font-mono ${
              isOverForecasting ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {kpis.bias_mw > 0 ? `+${kpis.bias_mw}` : kpis.bias_mw}
          </span>
          <span className="text-xs font-medium text-slate-500">MW</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Actual - Forecast (Systematic tilt)</p>
      </div>

      {/* 5. Data Coverage */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Completeness</span>
          </span>
          <span className="text-[10px] text-emerald-700 font-bold font-mono">
            {kpis.data_completeness_pct}%
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {kpis.matched_periods}
          </span>
          <span className="text-xs font-medium text-slate-500">/ {kpis.total_periods} hrs</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {kpis.missing_periods === 0 ? 'Zero missing forecasts' : `${kpis.missing_periods} missing`}
        </p>
      </div>
    </div>
  );
};
