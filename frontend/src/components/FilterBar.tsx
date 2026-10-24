import React from 'react';
import { Filter, Calendar, Clock, Download, Layers } from 'lucide-react';
import { FilterState } from '../types';
import { getExportUrl } from '../services/api';

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  isLoading: boolean;
}

const CUTOFF_OPTIONS = [
  { value: '07:00', label: '07:00 GMT (Early morning)' },
  { value: '08:00', label: '08:00 GMT (Pre-auction)' },
  { value: '09:00', label: '09:00 GMT (Default gate closure)' },
  { value: '10:00', label: '10:00 GMT (Mid-morning)' },
  { value: '11:00', label: '11:00 GMT (Auction close)' },
  { value: '12:00', label: '12:00 GMT (Noon)' },
  { value: '14:00', label: '14:00 GMT (Afternoon)' },
];

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, isLoading }) => {
  const handleCutoffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, cutoffTime: e.target.value });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, startDate: e.target.value });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, endDate: e.target.value });
  };

  const handleGranularityToggle = (granularity: 'hourly' | 'exact') => {
    onChange({ ...filters, granularity });
  };

  const setPreset = (start: string, end: string) => {
    onChange({ ...filters, startDate: start, endDate: end });
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 mb-6">
      {/* Primary Filter Selectors Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Decision Cutoff Selector */}
        <div>
          <label className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-800 mb-2">
            <Clock className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Day D-1 Decision Cutoff</span>
          </label>
          <select
            value={filters.cutoffTime}
            onChange={handleCutoffChange}
            disabled={isLoading}
            className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-3 text-[14px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 disabled:opacity-50 transition-shadow"
          >
            {CUTOFF_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Date Range Selection */}
        <div>
          <label className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-800 mb-2">
            <Calendar className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Target Delivery Date Range</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={filters.startDate}
              onChange={handleStartDateChange}
              disabled={isLoading}
              aria-label="Start date"
              className="flex-1 min-w-[130px] h-10 bg-slate-50 border border-slate-300 rounded-lg px-2.5 text-[14px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-shadow"
            />
            <span className="text-slate-500 text-[14px] font-medium flex-shrink-0">to</span>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={filters.endDate}
              onChange={handleEndDateChange}
              disabled={isLoading}
              aria-label="End date"
              className="flex-1 min-w-[130px] h-10 bg-slate-50 border border-slate-300 rounded-lg px-2.5 text-[14px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-shadow"
            />
          </div>
        </div>

        {/* 3. Granularity & Mode Toggle */}
        <div>
          <label className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-800 mb-2">
            <Layers className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Actuals Harmonization</span>
          </label>
          <div className="inline-flex h-10 rounded-lg border border-slate-300 bg-slate-100 p-1 w-full">
            <button
              type="button"
              onClick={() => handleGranularityToggle('hourly')}
              className={`flex-1 text-center py-1.5 px-2 text-[13px] font-medium rounded-md transition-all whitespace-nowrap ${
                filters.granularity === 'hourly'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hourly Mean (:00 & :30)
            </button>
            <button
              type="button"
              onClick={() => handleGranularityToggle('exact')}
              className={`flex-1 text-center py-1.5 px-2 text-[13px] font-medium rounded-md transition-all whitespace-nowrap ${
                filters.granularity === 'exact'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Exact :00 Only
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Row: Quick Presets & Export Button */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-slate-500 font-medium mr-1">Quick date presets:</span>
          <button
            onClick={() => setPreset('2026-01-01', '2026-01-31')}
            className={`h-9 px-3 text-[13px] rounded-lg border transition-colors ${
              filters.startDate === '2026-01-01' && filters.endDate === '2026-01-31'
                ? 'bg-teal-50 border-teal-600 text-teal-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Full Jan
          </button>
          <button
            onClick={() => setPreset('2026-01-01', '2026-01-07')}
            className="h-9 px-3 text-[13px] rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors font-medium"
          >
            Week 1
          </button>
          <button
            onClick={() => setPreset('2026-01-08', '2026-01-14')}
            className="h-9 px-3 text-[13px] rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors font-medium"
          >
            Week 2
          </button>
          <button
            onClick={() => setPreset('2026-01-15', '2026-01-21')}
            className="h-9 px-3 text-[13px] rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors font-medium"
          >
            Week 3
          </button>
          <button
            onClick={() => setPreset('2026-01-22', '2026-01-31')}
            className="h-9 px-3 text-[13px] rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors font-medium"
          >
            Week 4
          </button>
        </div>

        <a
          href={getExportUrl(filters)}
          download
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
        >
          <Download className="w-4 h-4 flex-shrink-0" />
          <span>Export CSV</span>
        </a>
      </div>
    </div>
  );
};
