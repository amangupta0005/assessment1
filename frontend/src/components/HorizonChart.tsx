import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { HorizonBucketSummary } from '../types';

interface HorizonChartProps {
  data: HorizonBucketSummary[];
  isLoading: boolean;
}

export const HorizonChart: React.FC<HorizonChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 h-80 flex items-center justify-center animate-pulse">
        <span className="text-[14px] text-slate-500">Loading horizon analysis...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-[18px] sm:text-[20px] font-semibold text-slate-900 tracking-tight">
            Forecast Error by Lead-Time Horizon
          </h3>
          <p className="text-[14px] text-slate-600 mt-0.5 font-normal">
            Evaluates accuracy degradation across forecast lead horizons (startTime - publishTime).
          </p>
        </div>
      </div>

      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="bucket_label"
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
                value: 'Error (MW)',
                angle: -90,
                position: 'insideLeft',
                offset: -5,
                style: { textAnchor: 'middle', fontSize: 13, fill: '#475569', fontWeight: 500 },
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as HorizonBucketSummary;
                return (
                  <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl text-[13px] space-y-1.5 border border-slate-700">
                    <p className="font-semibold border-b border-slate-700 pb-1 text-slate-100">
                      Horizon: {d.bucket_label} (Mean: {d.mean_horizon_hours}h)
                    </p>
                    <div className="space-y-1 pt-0.5">
                      <div>
                        <span className="text-slate-300">Sample Count:</span>{' '}
                        <span className="text-white font-medium tabular-nums">{d.sample_count} periods</span>
                      </div>
                      <div>
                        <span className="text-teal-300 font-semibold">MAE:</span>{' '}
                        <span className="text-white font-semibold tabular-nums">
                          {Math.round(d.mae_mw).toLocaleString()} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-300">RMSE:</span>{' '}
                        <span className="text-white font-medium tabular-nums">
                          {Math.round(d.rmse_mw).toLocaleString()} MW
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
            <Bar dataKey="mae_mw" name="MAE (MW)" fill="#0D9488" radius={[3, 3, 0, 0]} />
            <Bar dataKey="rmse_mw" name="RMSE (MW)" fill="#1E293B" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
