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
  { value: '07:00', label: '07:00 GMT (Early)' },
  { value: '08:00', label: '08:00 GMT (Pre-Auction)' },
  { value: '09:00', label: '09:00 GMT (Default Gate Closure)' },
  { value: '10:00', label: '10:00 GMT' },
  { value: '11:00', label: '11:00 GMT (Auction Close)' },
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
          {/* Decision Cutoff Selector */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Day D-1 Decision Cutoff</span>
            </label>
            <select
              value={filters.cutoffTime}
              onChange={handleCutoffChange}
              disabled={isLoading}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50"
            >
              {CUTOFF_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
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
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={filters.endDate}
                onChange={handleEndDateChange}
                disabled={isLoading}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Granularity & Mode Toggle */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>Actuals Harmonization</span>
            </label>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 w-full">
              <button
                type="button"
                onClick={() => handleGranularityToggle('hourly')}
                className={`flex-1 text-center py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                  filters.granularity === 'hourly'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hourly Mean (:00 & :30)
              </button>
              <button
                type="button"
                onClick={() => handleGranularityToggle('exact')}
                className={`flex-1 text-center py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                  filters.granularity === 'exact'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Exact :00 Only
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons: Presets & CSV Export */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 lg:border-l lg:border-slate-200 lg:pl-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPreset('2026-01-01', '2026-01-31')}
              className="px-2.5 py-1.5 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Full Jan
            </button>
            <button
              onClick={() => setPreset('2026-01-01', '2026-01-07')}
              className="px-2 py-1.5 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              W1
            </button>
            <button
              onClick={() => setPreset('2026-01-08', '2026-01-14')}
              className="px-2 py-1.5 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              W2
            </button>
            <button
              onClick={() => setPreset('2026-01-15', '2026-01-21')}
              className="px-2 py-1.5 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              W3
            </button>
            <button
              onClick={() => setPreset('2026-01-22', '2026-01-31')}
              className="px-2 py-1.5 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              W4+
            </button>
          </div>

          <a
            href={getExportUrl(filters)}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>
    </div>
  );
};
