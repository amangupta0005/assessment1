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
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 flex-1">
          {/* Decision Cutoff Selector */}
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

          {/* Date Range Selection */}
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
                className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-3 text-[14px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-shadow"
              />
              <span className="text-slate-500 text-[14px] font-medium px-1">to</span>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={filters.endDate}
                onChange={handleEndDateChange}
                disabled={isLoading}
                aria-label="End date"
                className="w-full h-10 bg-slate-50 border border-slate-300 rounded-lg px-3 text-[14px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-shadow"
              />
            </div>
          </div>

          {/* Granularity & Mode Toggle */}
          <div>
            <label className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-800 mb-2">
              <Layers className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>Actuals Harmonization</span>
            </label>
            <div className="inline-flex h-10 rounded-lg border border-slate-300 bg-slate-100 p-1 w-full">
              <button
                type="button"
                onClick={() => handleGranularityToggle('hourly')}
                className={`flex-1 text-center py-1.5 px-3 text-[13px] font-medium rounded-md transition-all ${
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
                className={`flex-1 text-center py-1.5 px-3 text-[13px] font-medium rounded-md transition-all ${
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

        {/* Action Buttons: Presets & CSV Export */}
        <div className="flex flex-wrap items-center gap-2 pt-2 xl:pt-0 xl:border-l xl:border-slate-200 xl:pl-5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPreset('2026-01-01', '2026-01-31')}
              className="h-10 px-3 text-[13px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              Full Jan
            </button>
            <button
              onClick={() => setPreset('2026-01-01', '2026-01-07')}
              className="h-10 px-2.5 text-[13px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              W1
            </button>
            <button
              onClick={() => setPreset('2026-01-08', '2026-01-14')}
              className="h-10 px-2.5 text-[13px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              W2
            </button>
            <button
              onClick={() => setPreset('2026-01-15', '2026-01-21')}
              className="h-10 px-2.5 text-[13px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              W3
            </button>
            <button
              onClick={() => setPreset('2026-01-22', '2026-01-31')}
              className="h-10 px-2.5 text-[13px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              W4+
            </button>
          </div>

          <a
            href={getExportUrl(filters)}
            download
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[14px] font-semibold shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ml-1"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>
    </div>
  );
};
