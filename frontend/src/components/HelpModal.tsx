import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, TrendingDown, BookOpen } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden transform transition-all text-slate-800">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-400" />
            <h2 id="modal-title" className="text-base font-bold">
              How to Read This Platform & Core Methodology
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm leading-relaxed max-h-[80vh] overflow-y-auto">
          {/* Section 1: Day-Ahead Cutoff */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>1. Day-Ahead Decision Cutoff & Zero Data Leakage</span>
            </div>
            <p className="text-slate-600">
              For any physical delivery target hour <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs">T</code> on delivery day <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs">D</code>, commercial procurement decisions are finalized on day <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs">D - 1</code> at gate closure (default <strong>09:00 GMT</strong>).
            </p>
            <div className="mt-2 p-2.5 bg-slate-50 border-l-4 border-teal-600 rounded text-xs text-slate-700">
              <strong>Selection Invariant:</strong> Only forecasts published prior to <code className="font-mono">(D-1) 09:00 UTC</code> are eligible. The engine strictly selects the forecast with the greatest publish time satisfying <code className="font-mono">publishTime &le; Cutoff</code>. Forecasts published after gate closure are strictly filtered out to prevent data leakage.
            </div>
          </div>

          {/* Section 2: Sign Convention */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>2. Metric Sign Convention (Actual vs Forecast)</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>
                <strong>Signed Error:</strong> <code className="font-mono font-bold">Error = Actual - Forecast (MW)</code>
              </li>
              <li>
                <span className="text-emerald-700 font-medium">Positive Error (&gt; 0 MW):</span> Wind generation exceeded expectation (Wind Surplus / Long position).
              </li>
              <li>
                <span className="text-rose-700 font-medium">Negative Error (&lt; 0 MW):</span> Wind generation fell short of expectation (Wind Deficit / Short position).
              </li>
              <li>
                <strong>Mean Bias:</strong> Negative bias reveals a systematic tendency for the forecast to over-predict generation.
              </li>
            </ul>
          </div>

          {/* Section 3: Downside Shortfall & Thermal Buffer */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1.5">
              <TrendingDown className="w-4 h-4 text-amber-600" />
              <span>3. Shortfall Risk & Thermal Reserve Buffer (MW)</span>
            </div>
            <p className="text-slate-600">
              Downside shortfall is defined as <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-xs">Shortfall = max(0, Forecast - Actual)</code>.
            </p>
            <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200 rounded-md text-xs text-amber-900">
              <strong>Trader Actionable Rule:</strong> The <strong>P90 Shortfall Buffer</strong> indicates that with 90% confidence, wind generation will not fall short of the day-ahead forecast by more than this MW amount. Buyers can add this exact MW volume as a dispatchable thermal hedge to protect against deficit penalties.
            </div>
          </div>

          {/* Section 4: Granularity & Timezone */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-slate-600" />
              <span>4. Granularity Harmonization & Timezone</span>
            </div>
            <p className="text-slate-600">
              Elexon <code className="text-xs font-mono">WINDFOR</code> forecasts are published at hourly intervals (<code className="text-xs font-mono">:00</code>), while <code className="text-xs font-mono">FUELHH</code> actuals are 30-minute settlement periods. In the standard view, outturn generation is the arithmetic mean of the two half-hours (<code className="text-xs font-mono">:00</code> and <code className="text-xs font-mono">:30</code>) to match energy delivered (MWh). All timestamps are Greenwich Mean Time (GMT = UTC in January).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
