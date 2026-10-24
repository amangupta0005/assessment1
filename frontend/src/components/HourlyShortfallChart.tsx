import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { HourlyProfile } from '../types';

interface HourlyShortfallChartProps {
  data: HourlyProfile[];
  isLoading: boolean;
}

export const HourlyShortfallChart: React.FC<HourlyShortfallChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 h-80 flex items-center justify-center animate-pulse">
        <span className="text-xs text-slate-400">Loading hourly profile...</span>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    hourLabel: `${String(d.hour).padStart(2, '0')}:00`,
  }));

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-2 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Shortfall Risk & Thermal Reserve Buffer by Hour of Day
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            P90 Shortfall Buffer (MW) tells buyers how much thermal reserve covers wind deficit with 90% confidence.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="w-3 h-2 bg-amber-500 inline-block rounded-xs" />
            <span>P90 Shortfall Buffer (MW)</span>
          </span>
          <span className="flex items-center gap-1.5 text-teal-700">
            <span className="w-3 h-0.5 bg-teal-600 inline-block" />
            <span>MAE (MW)</span>
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="hourLabel"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              unit=" MW"
              width={65}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as HourlyProfile & { hourLabel: string };
                return (
                  <div className="bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-xs space-y-1 border border-slate-800">
                    <p className="font-bold border-b border-slate-700 pb-1 text-slate-200">
                      Hour: {d.hourLabel} (GB Grid)
                    </p>
                    <div className="space-y-0.5 pt-1">
                      <div>
                        <span className="text-amber-400 font-semibold">P90 Shortfall Reserve:</span>{' '}
                        <span className="font-mono font-bold text-white">
                          +{d.p90_shortfall_buffer_mw} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Mean Actual:</span>{' '}
                        <span className="font-mono text-slate-200">{d.mean_actual_mw} MW</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Mean Forecast:</span>{' '}
                        <span className="font-mono text-slate-200">{d.mean_forecast_mw} MW</span>
                      </div>
                      <div>
                        <span className="text-slate-400">MAE / RMSE:</span>{' '}
                        <span className="font-mono text-teal-300">
                          {d.mae_mw} / {d.rmse_mw} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Bias:</span>{' '}
                        <span
                          className={`font-mono ${
                            d.bias_mw >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {d.bias_mw > 0 ? `+${d.bias_mw}` : d.bias_mw} MW
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="p90_shortfall_buffer_mw"
              name="P90 Shortfall Buffer (MW)"
              fill="#f59e0b"
              radius={[3, 3, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="mae_mw"
              name="MAE (MW)"
              stroke="#0f766e"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
