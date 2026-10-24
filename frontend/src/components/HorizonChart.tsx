import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { HorizonBucketSummary } from '../types';

interface HorizonChartProps {
  data: HorizonBucketSummary[];
  isLoading: boolean;
}

export const HorizonChart: React.FC<HorizonChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 h-80 flex items-center justify-center animate-pulse">
        <span className="text-xs text-slate-400">Loading horizon analysis...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-2 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Forecast Error by Lead-Time Horizon Bucket
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluates how forecast accuracy degrades as lead time (startTime - publishTime) increases.
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="bucket_label"
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
                const d = payload[0].payload as HorizonBucketSummary;
                return (
                  <div className="bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-xs space-y-1 border border-slate-800">
                    <p className="font-bold border-b border-slate-700 pb-1 text-slate-200">
                      Horizon: {d.bucket_label} (Mean: {d.mean_horizon_hours}h)
                    </p>
                    <div className="space-y-0.5 pt-1">
                      <div>
                        <span className="text-slate-400">Sample Count:</span>{' '}
                        <span className="font-mono text-white">{d.sample_count} periods</span>
                      </div>
                      <div>
                        <span className="text-teal-400 font-semibold">MAE:</span>{' '}
                        <span className="font-mono text-white">{d.mae_mw} MW</span>
                      </div>
                      <div>
                        <span className="text-slate-400">RMSE:</span>{' '}
                        <span className="font-mono text-white">{d.rmse_mw} MW</span>
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
            <Bar dataKey="mae_mw" name="MAE (MW)" fill="#0d9488" radius={[3, 3, 0, 0]} />
            <Bar dataKey="rmse_mw" name="RMSE (MW)" fill="#1e293b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
