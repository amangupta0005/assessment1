import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ForecastEvaluationPoint } from '../types';

interface MainTimeseriesChartProps {
  data: ForecastEvaluationPoint[];
  isLoading: boolean;
}

export const MainTimeseriesChart: React.FC<MainTimeseriesChartProps> = ({ data, isLoading }) => {
  const chartData = useMemo(() => {
    return data.map((pt) => {
      // Date formatting for XAxis: "Jan 05 14:00"
      const date = new Date(pt.target_start_time);
      const label = date.toLocaleDateString('en-GB', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });
      return {
        ...pt,
        formattedTime: label,
      };
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading wind generation time series...</span>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 h-96 flex items-center justify-center">
        <p className="text-slate-500 text-sm">No evaluation points available for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-2 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Day-Ahead Wind Forecast vs Actual Generation (January 2026)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            National GB Wind generation in MW. Latest pre-cutoff forecast compared against outturn generation.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-0.5 bg-slate-900 inline-block" />
            <span>Actual Outturn</span>
          </span>
          <span className="flex items-center gap-1.5 text-teal-700">
            <span className="w-3 h-0.5 bg-teal-600 inline-block stroke-dasharray" />
            <span>Latest Forecast</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-600">
            <span className="w-3 h-2 bg-rose-200 inline-block rounded-xs" />
            <span>Shortfall Deficit</span>
          </span>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="formattedTime"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              unit=" MW"
              width={70}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as ForecastEvaluationPoint & { formattedTime: string };
                return (
                  <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs space-y-1.5 border border-slate-800">
                    <p className="font-bold border-b border-slate-700 pb-1 text-slate-200">
                      Target: {d.target_start_time.replace('T', ' ').replace('Z', ' UTC')}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                      <div>
                        <span className="text-slate-400">Actual Outturn:</span>{' '}
                        <span className="font-mono font-bold text-white">
                          {d.actual_mw?.toLocaleString()} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Day-Ahead Forecast:</span>{' '}
                        <span className="font-mono font-bold text-teal-300">
                          {d.forecast_mw?.toLocaleString()} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Signed Error (A - F):</span>{' '}
                        <span
                          className={`font-mono font-bold ${
                            (d.error_mw ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {(d.error_mw ?? 0) > 0 ? `+${d.error_mw}` : d.error_mw} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Downside Shortfall:</span>{' '}
                        <span className="font-mono font-bold text-amber-300">
                          {d.shortfall_mw?.toLocaleString()} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Lead Horizon:</span>{' '}
                        <span className="font-mono text-slate-300">{d.horizon_hours} hours</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Forecast Published:</span>{' '}
                        <span className="font-mono text-slate-300">
                          {d.publish_time?.replace('T', ' ').replace('Z', ' UTC')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            {/* Shortfall Deficit Shading */}
            <Area
              type="monotone"
              dataKey="shortfall_mw"
              name="Shortfall (MW)"
              fill="#fee2e2"
              stroke="#fca5a5"
              strokeWidth={1}
              fillOpacity={0.6}
            />
            {/* Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecast_mw"
              name="Forecast (MW)"
              stroke="#0d9488"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, stroke: '#0f766e', strokeWidth: 2 }}
            />
            {/* Actual Outturn Line */}
            <Line
              type="monotone"
              dataKey="actual_mw"
              name="Actual (MW)"
              stroke="#0f172a"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#020617', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
