import React, { useState, useMemo } from 'react';
import { ForecastEvaluationPoint } from '../types';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface DataTableProps {
  data: ForecastEvaluationPoint[];
  isLoading: boolean;
}

type SortField = 'target_start_time' | 'actual_mw' | 'forecast_mw' | 'error_mw' | 'shortfall_mw' | 'horizon_hours';
type SortDirection = 'asc' | 'desc';

export const DataTable: React.FC<DataTableProps> = ({ data, isLoading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('target_start_time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (row) =>
          row.target_start_time.toLowerCase().includes(term) ||
          row.settlement_date.toLowerCase().includes(term) ||
          row.status.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string') {
        const cmp = (aVal as string).localeCompare(bVal as string);
        return sortDirection === 'asc' ? cmp : -cmp;
      }

      const diff = (aVal as number) - (bVal as number);
      return sortDirection === 'asc' ? diff : -diff;
    });

    return result;
  }, [data, searchTerm, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 animate-pulse h-64" />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-12">
      {/* Table Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Delivery Period Evaluation Audit Log
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Full audit trail of physical delivery hours, verified against gate closure publish timestamps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search date (e.g. 2026-01-15)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 w-48 sm:w-64"
            />
          </div>

          {/* Rows per page selector */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value={15}>15 rows</option>
            <option value={30}>30 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th
                onClick={() => handleSort('target_start_time')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Target Time (UTC)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('actual_mw')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Actual Outturn</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('forecast_mw')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Day-Ahead Forecast</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('error_mw')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Error (A - F)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('shortfall_mw')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Shortfall Deficit</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('horizon_hours')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Lead Horizon</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Forecast Published</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.map((row) => {
              const isDeficit = (row.error_mw ?? 0) < 0;
              return (
                <tr key={row.target_start_time} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                    {row.target_start_time.replace('T', ' ').replace('Z', ' UTC')}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                    {row.actual_mw !== null ? `${row.actual_mw.toLocaleString()} MW` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-teal-700">
                    {row.forecast_mw !== null ? `${row.forecast_mw.toLocaleString()} MW` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold">
                    {row.error_mw !== null ? (
                      <span className={isDeficit ? 'text-rose-600' : 'text-emerald-600'}>
                        {row.error_mw > 0 ? `+${row.error_mw}` : row.error_mw} MW
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700">
                    {row.shortfall_mw !== null ? (
                      row.shortfall_mw > 0 ? (
                        `+${row.shortfall_mw} MW`
                      ) : (
                        <span className="text-slate-400 font-normal">0 MW</span>
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                    {row.horizon_hours !== null ? `${row.horizon_hours}h` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-slate-500 text-[11px]">
                    {row.publish_time ? row.publish_time.replace('T', ' ').replace('Z', '') : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        row.status === 'MATCHED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-900">
            {filteredAndSortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-900">
            {Math.min(currentPage * pageSize, filteredAndSortedData.length)}
          </span>{' '}
          of <span className="font-semibold text-slate-900">{filteredAndSortedData.length}</span>{' '}
          periods
        </div>

        <div className="flex items-center gap-1.5 self-center sm:self-auto">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="px-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
