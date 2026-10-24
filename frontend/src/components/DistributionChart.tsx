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
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 h-80 flex items-center justify-center animate-pulse">
        <span className="text-xs text-slate-400">Loading error distribution...</span>
      </div>
    );
  }

  const bins = activeTab === 'error' ? data.error_bins : data.shortfall_bins;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-2 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {activeTab === 'error'
              ? 'Signed Error Frequency Distribution (Actual - Forecast)'
              : 'Downside Shortfall Frequency Distribution'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === 'error'
              ? 'Negative values represent wind deficits; positive values represent wind surplus.'
              : 'Magnitude of deficit hours where actual generation fell short of day-ahead forecast.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('error')}
            className={`py-1 px-3 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'error'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Signed Error
          </button>
          <button
            onClick={() => setActiveTab('shortfall')}
            className={`py-1 px-3 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'shortfall'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Downside Shortfall
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="bin_center"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              unit=" MW"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              unit=" hrs"
              width={55}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as DistributionBin;
                return (
                  <div className="bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-xs space-y-1 border border-slate-800">
                    <p className="font-bold border-b border-slate-700 pb-1 text-slate-200">
                      Range: {d.bin_start} to {d.bin_end} MW
                    </p>
                    <div className="space-y-0.5 pt-1">
                      <div>
                        <span className="text-slate-400">Occurrences:</span>{' '}
                        <span className="font-mono text-white font-bold">{d.count} hours</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Frequency:</span>{' '}
                        <span className="font-mono text-teal-300">{d.frequency_pct}%</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              name="Hours"
              fill={activeTab === 'error' ? '#0f766e' : '#f59e0b'}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
