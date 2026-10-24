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
} from 'recharts';
import { HourlyProfile } from '../types';

interface HourlyShortfallChartProps {
  data: HourlyProfile[];
  isLoading: boolean;
}

export const HourlyShortfallChart: React.FC<HourlyShortfallChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 h-80 flex items-center justify-center animate-pulse">
        <span className="text-[14px] text-slate-500">Loading hourly profile...</span>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    hourLabel: `${String(d.hour).padStart(2, '0')}:00`,
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-[18px] sm:text-[20px] font-semibold text-slate-900 tracking-tight">
            Shortfall Risk & Thermal Reserve Buffer by Hour
          </h3>
          <p className="text-[14px] text-slate-600 mt-0.5 font-normal">
            P90 Shortfall Buffer (MW) indicates required thermal hedge by hour of the day.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[13px] font-medium">
          <span className="flex items-center gap-1.5 text-amber-900">
            <span className="w-3.5 h-2.5 bg-amber-500 inline-block rounded-xs" />
            <span>P90 Shortfall Buffer</span>
          </span>
          <span className="flex items-center gap-1.5 text-teal-800">
            <span className="w-3.5 h-[2px] bg-teal-600 inline-block" />
            <span>MAE</span>
          </span>
        </div>
      </div>

      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="hourLabel"
              tick={{ fontSize: 12, fill: '#475569' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#475569' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(val: number) => val.toLocaleString()}
              width={65}
              label={{
                value: 'Capacity (MW)',
                angle: -90,
                position: 'insideLeft',
                offset: -5,
                style: { textAnchor: 'middle', fontSize: 13, fill: '#475569', fontWeight: 500 },
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as HourlyProfile & { hourLabel: string };
                return (
                  <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl text-[13px] space-y-1.5 border border-slate-700">
                    <p className="font-semibold border-b border-slate-700 pb-1 text-slate-100">
                      Hour: {d.hourLabel} (GB Grid)
                    </p>
                    <div className="space-y-1 pt-0.5">
                      <div>
                        <span className="text-amber-300 font-semibold">P90 Shortfall Reserve:</span>{' '}
                        <span className="font-semibold text-white tabular-nums">
                          +{Math.round(d.p90_shortfall_buffer_mw).toLocaleString()} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-300">Mean Actual:</span>{' '}
                        <span className="text-slate-100 tabular-nums">
                          {Math.round(d.mean_actual_mw).toLocaleString()} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-300">Mean Forecast:</span>{' '}
                        <span className="text-slate-100 tabular-nums">
                          {Math.round(d.mean_forecast_mw).toLocaleString()} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-300">MAE / RMSE:</span>{' '}
                        <span className="text-teal-300 tabular-nums">
                          {Math.round(d.mae_mw).toLocaleString()} / {Math.round(d.rmse_mw).toLocaleString()} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-300">Bias:</span>{' '}
                        <span
                          className={`tabular-nums ${
                            d.bias_mw >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {d.bias_mw > 0 ? `+${Math.round(d.bias_mw)}` : Math.round(d.bias_mw)} MW
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
              fill="#F59E0B"
              radius={[3, 3, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="mae_mw"
              name="MAE (MW)"
              stroke="#0F766E"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
