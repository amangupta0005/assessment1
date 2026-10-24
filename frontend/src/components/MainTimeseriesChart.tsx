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
} from 'recharts';
import { ForecastEvaluationPoint } from '../types';

interface MainTimeseriesChartProps {
  data: ForecastEvaluationPoint[];
  isLoading: boolean;
}

export const MainTimeseriesChart: React.FC<MainTimeseriesChartProps> = ({ data, isLoading }) => {
  const chartData = useMemo(() => {
    return data.map((pt) => {
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
      <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-[14px]">Loading wind generation time series...</span>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 h-96 flex items-center justify-center">
        <p className="text-slate-600 text-[15px]">No evaluation points available for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-3 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-[20px] font-semibold text-slate-900 tracking-tight">
            Day-Ahead Wind Forecast vs Actual Generation (January 2026)
          </h2>
          <p className="text-[14px] text-slate-600 mt-1 font-normal">
            National GB wind generation. Latest pre-cutoff forecast compared against outturn generation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium">
          <span className="flex items-center gap-2 text-slate-800">
            <span className="w-3.5 h-[2.5px] bg-[#0F172A] inline-block rounded-xs" />
            <span>Actual Outturn</span>
          </span>
          <span className="flex items-center gap-2 text-teal-800">
            <span className="w-4 h-[2.5px] bg-teal-600 inline-block stroke-dasharray" />
            <span>Latest Forecast</span>
          </span>
          <span className="flex items-center gap-2 text-rose-700">
            <span className="w-3.5 h-2.5 bg-rose-200 border border-rose-300 inline-block rounded-xs" />
            <span>Shortfall Deficit</span>
          </span>
        </div>
      </div>

      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="formattedTime"
              tick={{ fontSize: 12, fill: '#475569' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              minTickGap={45}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#475569' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(val: number) => val.toLocaleString()}
              width={75}
              label={{
                value: 'Wind generation (MW)',
                angle: -90,
                position: 'insideLeft',
                offset: -10,
                style: { textAnchor: 'middle', fontSize: 13, fill: '#475569', fontWeight: 500 },
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as ForecastEvaluationPoint & { formattedTime: string };
                return (
                  <div className="bg-slate-900 text-white rounded-lg p-3.5 shadow-xl text-[13px] space-y-2 border border-slate-700 max-w-sm">
                    <p className="font-semibold border-b border-slate-700 pb-1.5 text-slate-100">
                      Target: {d.target_start_time.replace('T', ' ').replace('Z', ' UTC')}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-0.5">
                      <div>
                        <span className="text-slate-300">Actual Outturn:</span>{' '}
                        <span className="font-semibold text-white tabular-nums">
                          {Math.round(d.actual_mw ?? 0).toLocaleString()} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-300">Day-Ahead Forecast:</span>{' '}
                        <span className="font-semibold text-teal-300 tabular-nums">
                          {Math.round(d.forecast_mw ?? 0).toLocaleString()} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-300">Signed Error (A - F):</span>{' '}
                        <span
                          className={`font-semibold tabular-nums ${
                            (d.error_mw ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {(d.error_mw ?? 0) > 0
                            ? `+${Math.round(d.error_mw ?? 0).toLocaleString()}`
                            : Math.round(d.error_mw ?? 0).toLocaleString()} MW
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-300">Downside Shortfall:</span>{' '}
                        <span className="font-semibold text-amber-300 tabular-nums">
                          {Math.round(d.shortfall_mw ?? 0).toLocaleString()} MW
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-800 text-[12px] text-slate-300 flex justify-between">
                        <span>Lead Horizon: {d.horizon_hours} hours</span>
                        <span>Published: {d.publish_time?.replace('T', ' ').replace('Z', '')}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            {/* Shortfall Deficit Shading - 20% opacity soft red */}
            <Area
              type="monotone"
              dataKey="shortfall_mw"
              name="Shortfall (MW)"
              fill="#EF4444"
              fillOpacity={0.20}
              stroke="#F87171"
              strokeWidth={1}
            />
            {/* Forecast Line: 2.5px dashed teal */}
            <Line
              type="monotone"
              dataKey="forecast_mw"
              name="Forecast (MW)"
              stroke="#0D9488"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 4, stroke: '#0F766E', strokeWidth: 2 }}
            />
            {/* Actual Outturn Line: 2.5px solid navy */}
            <Line
              type="monotone"
              dataKey="actual_mw"
              name="Actual (MW)"
              stroke="#0F172A"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, stroke: '#09111E', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
