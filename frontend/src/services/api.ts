import {
  DistributionResponse,
  FilterState,
  ForecastEvaluationPoint,
  HorizonBucketSummary,
  HourlyProfile,
  OverallSummaryKPIs,
} from '../types';

const API_BASE = '/api/wind';

function buildQuery(filters: FilterState): string {
  const params = new URLSearchParams({
    cutoff_time: filters.cutoffTime,
    granularity: filters.granularity,
  });
  if (filters.startDate) params.set('start_date', filters.startDate);
  if (filters.endDate) params.set('end_date', filters.endDate);
  return params.toString();
}

export async function fetchSummary(filters: FilterState): Promise<OverallSummaryKPIs> {
  const res = await fetch(`${API_BASE}/summary?${buildQuery(filters)}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch summary: ${res.status} ${errorText}`);
  }
  return res.json();
}

export async function fetchTimeseries(filters: FilterState): Promise<ForecastEvaluationPoint[]> {
  const res = await fetch(`${API_BASE}/timeseries?${buildQuery(filters)}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch timeseries: ${res.status} ${errorText}`);
  }
  return res.json();
}

export async function fetchHourlyProfile(filters: FilterState): Promise<HourlyProfile[]> {
  const res = await fetch(`${API_BASE}/by-hour?${buildQuery(filters)}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch hourly profile: ${res.status} ${errorText}`);
  }
  return res.json();
}

export async function fetchHorizonAnalysis(filters: FilterState): Promise<HorizonBucketSummary[]> {
  const res = await fetch(`${API_BASE}/by-horizon?${buildQuery(filters)}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch horizon analysis: ${res.status} ${errorText}`);
  }
  return res.json();
}

export async function fetchDistributions(filters: FilterState): Promise<DistributionResponse> {
  const res = await fetch(`${API_BASE}/distribution?${buildQuery(filters)}&num_bins=24`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch distributions: ${res.status} ${errorText}`);
  }
  return res.json();
}

export function getExportUrl(filters: FilterState): string {
  return `${API_BASE}/export?${buildQuery(filters)}`;
}
