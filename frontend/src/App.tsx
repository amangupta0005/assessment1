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
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Header */}
      <Header cutoffTime={filters.cutoffTime} onOpenHelp={() => setIsHelpOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Controls Bar */}
        <FilterBar filters={filters} onChange={setFilters} isLoading={isLoading} />

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-start justify-between gap-3 text-rose-900 text-[14px] shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-rose-950">Failed to load platform data</p>
                <p className="mt-0.5 text-rose-800">{error}</p>
              </div>
            </div>
            <button
              onClick={loadAllData}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-rose-700 text-white rounded-lg text-[13px] font-semibold hover:bg-rose-800 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
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
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 text-[13px] py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-300">© 2026 UK Energy Utility • Day-Ahead Commercial Power Procurement Desk</p>
          <p className="text-[#C9D6E8] text-[13px]">
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
