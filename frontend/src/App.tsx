import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HelpModal } from './components/HelpModal';
import { FilterBar } from './components/FilterBar';
import { KpiCards } from './components/KpiCards';
import { MainTimeseriesChart } from './components/MainTimeseriesChart';
import { HourlyShortfallChart } from './components/HourlyShortfallChart';
import { HorizonChart } from './components/HorizonChart';
import { DistributionChart } from './components/DistributionChart';
import { DataTable } from './components/DataTable';
import {
  DistributionResponse,
  FilterState,
  ForecastEvaluationPoint,
  HorizonBucketSummary,
  HourlyProfile,
  OverallSummaryKPIs,
} from './types';
import {
  fetchDistributions,
  fetchHorizonAnalysis,
  fetchHourlyProfile,
  fetchSummary,
  fetchTimeseries,
} from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    cutoffTime: '09:00',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    granularity: 'hourly',
  });

  const [kpis, setKpis] = useState<OverallSummaryKPIs | null>(null);
  const [timeseries, setTimeseries] = useState<ForecastEvaluationPoint[]>([]);
  const [hourlyProfile, setHourlyProfile] = useState<HourlyProfile[]>([]);
  const [horizonBuckets, setHorizonBuckets] = useState<HorizonBucketSummary[]>([]);
  const [distributions, setDistributions] = useState<DistributionResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [kpisRes, timeseriesRes, hourlyRes, horizonRes, distRes] = await Promise.all([
        fetchSummary(filters),
        fetchTimeseries(filters),
        fetchHourlyProfile(filters),
        fetchHorizonAnalysis(filters),
        fetchDistributions(filters),
      ]);

      setKpis(kpisRes);
      setTimeseries(timeseriesRes);
      setHourlyProfile(hourlyRes);
      setHorizonBuckets(horizonRes);
      setDistributions(distRes);
    } catch (err: any) {
      console.error('Data fetching error:', err);
      setError(err?.message || 'An unexpected error occurred while loading forecast data.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Header */}
      <Header cutoffTime={filters.cutoffTime} onOpenHelp={() => setIsHelpOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Controls Bar */}
        <FilterBar filters={filters} onChange={setFilters} isLoading={isLoading} />

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-rose-800 text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <p className="font-bold">Failed to load platform data</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
            <button
              onClick={loadAllData}
              className="inline-flex items-center gap-1 px-3 py-1 bg-rose-600 text-white rounded-md font-semibold hover:bg-rose-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <KpiCards kpis={kpis} isLoading={isLoading} />

        {/* Main Forecast vs Actual Time Series */}
        <MainTimeseriesChart data={timeseries} isLoading={isLoading} />

        {/* Secondary Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Hourly Shortfall & Buffer */}
          <HourlyShortfallChart data={hourlyProfile} isLoading={isLoading} />

          {/* Lead-Time Horizon Error */}
          <HorizonChart data={horizonBuckets} isLoading={isLoading} />
        </div>

        {/* Distribution Analysis */}
        <div className="mb-6">
          <DistributionChart data={distributions} isLoading={isLoading} />
        </div>

        {/* Detailed Audit Table */}
        <DataTable data={timeseries} isLoading={isLoading} />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 UK Energy Utility • Day-Ahead Commercial Power Procurement Desk</p>
          <p className="text-slate-500 font-mono text-[11px]">
            Data Source: Elexon BMRS (FUELHH & WINDFOR) • Strictly January 2026
          </p>
        </div>
      </footer>

      {/* Methodology & Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;
