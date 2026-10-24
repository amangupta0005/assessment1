export interface OverallSummaryKPIs {
  total_periods: number;
  matched_periods: number;
  missing_periods: number;
  data_completeness_pct: number;
  mean_actual_mw: number;
  mean_forecast_mw: number;
  bias_mw: number;
  mae_mw: number;
  rmse_mw: number;
  mape_pct: number | null;
  wape_pct: number;
  p50_error_mw: number;
  p90_error_mw: number;
  p95_error_mw: number;
  max_error_mw: number;
  p90_shortfall_buffer_mw: number;
  p95_shortfall_buffer_mw: number;
  shortfall_frequency_pct: number;
}

export interface ForecastEvaluationPoint {
  target_start_time: string;
  settlement_date: string;
  hour_of_day: number;
  actual_mw: number | null;
  forecast_mw: number | null;
  publish_time: string | null;
  cutoff_time: string;
  horizon_hours: number | null;
  error_mw: number | null;
  abs_error_mw: number | null;
  shortfall_mw: number | null;
  percentage_error: number | null;
  status: string;
}

export interface HourlyProfile {
  hour: number;
  count: number;
  mean_actual_mw: number;
  mean_forecast_mw: number;
  mae_mw: number;
  rmse_mw: number;
  bias_mw: number;
  p90_shortfall_buffer_mw: number;
}

export interface HorizonBucketSummary {
  bucket_label: string;
  min_hours: number;
  max_hours: number;
  sample_count: number;
  mae_mw: number;
  rmse_mw: number;
  bias_mw: number;
  mean_horizon_hours: number;
}

export interface DistributionBin {
  bin_start: number;
  bin_end: number;
  bin_center: number;
  count: number;
  frequency_pct: number;
}

export interface DistributionResponse {
  error_bins: DistributionBin[];
  shortfall_bins: DistributionBin[];
}

export interface FilterState {
  cutoffTime: string;
  startDate: string;
  endDate: string;
  granularity: 'hourly' | 'exact';
}
