import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { DistributionResponse, DistributionBin } from '../types';

interface DistributionChartProps {
  data: DistributionResponse | null;
  isLoading: boolean;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({ data, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'error' | 'shortfall'>('error');

  if (isLoading || !data) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200 h-80 flex items-center justify-center animate-pulse">
        <span className="text-[14px] text-slate-500">Loading error distribution...</span>
      </div>
    );
  }

  const bins = activeTab === 'error' ? data.error_bins : data.shortfall_bins;

  return (
    <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-3 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-[18px] sm:text-[20px] font-semibold text-slate-900 tracking-tight">
            {activeTab === 'error'
              ? 'Signed Error Frequency Distribution (Actual - Forecast)'
              : 'Downside Shortfall Frequency Distribution'}
          </h3>
          <p className="text-[14px] text-slate-600 mt-0.5 font-normal">
            {activeTab === 'error'
              ? 'Negative values represent wind deficits; positive values represent wind surplus.'
              : 'Magnitude of deficit hours where actual generation fell short of day-ahead forecast.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('error')}
            className={`py-1.5 px-3.5 text-[13px] font-medium rounded-md transition-all ${
              activeTab === 'error'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Signed Error
          </button>
          <button
            onClick={() => setActiveTab('shortfall')}
            className={`py-1.5 px-3.5 text-[13px] font-medium rounded-md transition-all ${
              activeTab === 'shortfall'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Downside Shortfall
          </button>
        </div>
      </div>

      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="bin_center"
              tick={{ fontSize: 12, fill: '#475569' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(val: number) => val.toLocaleString()}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#475569' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(val: number) => val.toLocaleString()}
              width={65}
              label={{
                value: 'Frequency (hours)',
                angle: -90,
                position: 'insideLeft',
                offset: -5,
                style: { textAnchor: 'middle', fontSize: 13, fill: '#475569', fontWeight: 500 },
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as DistributionBin;
                return (
                  <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl text-[13px] space-y-1.5 border border-slate-700">
                    <p className="font-semibold border-b border-slate-700 pb-1 text-slate-100">
                      Range: {Math.round(d.bin_start).toLocaleString()} to {Math.round(d.bin_end).toLocaleString()} MW
                    </p>
                    <div className="space-y-1 pt-0.5">
                      <div>
                        <span className="text-slate-300">Occurrences:</span>{' '}
                        <span className="font-semibold text-white tabular-nums">{d.count} hours</span>
                      </div>
                      <div>
                        <span className="text-slate-300">Share of Month:</span>{' '}
                        <span className="text-teal-300 font-semibold tabular-nums">{d.frequency_pct}%</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              name="Hours"
              fill={activeTab === 'error' ? '#0F766E' : '#F59E0B'}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
