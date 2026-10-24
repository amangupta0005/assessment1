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
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden transform transition-all text-slate-800">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-teal-400 flex-shrink-0" />
            <h2 id="modal-title" className="text-[20px] font-semibold text-white">
              How to Read This Platform & Core Methodology
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-[15px] leading-relaxed max-h-[80vh] overflow-y-auto">
          {/* Section 1: Day-Ahead Cutoff */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-[16px] mb-2">
              <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <span>1. Day-Ahead Decision Cutoff & Zero Data Leakage</span>
            </div>
            <p className="text-slate-700">
              For any physical delivery target hour <span className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-[13px] font-medium">T</span> on delivery day <span className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-[13px] font-medium">D</span>, commercial procurement decisions are finalized on day <span className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-[13px] font-medium">D - 1</span> at gate closure (default <strong>09:00 GMT</strong>).
            </p>
            <div className="mt-3 p-3.5 bg-slate-50 border-l-4 border-teal-600 rounded-r-lg text-[14px] text-slate-800">
              <strong>Selection Invariant:</strong> Only forecasts published prior to <span className="font-semibold">(D-1) 09:00 UTC</span> are eligible. The engine strictly selects the forecast with the greatest publish time satisfying <span className="font-semibold">publishTime &le; Cutoff</span>. Forecasts published after gate closure are strictly filtered out to prevent data leakage.
            </div>
          </div>

          {/* Section 2: Sign Convention */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-[16px] mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>2. Metric Sign Convention (Actual vs Forecast)</span>
            </div>
            <ul className="space-y-2 text-slate-700 list-disc list-inside">
              <li>
                <strong>Signed Error:</strong> <span className="font-semibold text-slate-900">Error = Actual - Forecast (MW)</span>
              </li>
              <li>
                <span className="text-emerald-800 font-semibold">Positive Error (&gt; 0 MW):</span> Wind generation exceeded expectation (Wind Surplus / Long position).
              </li>
              <li>
                <span className="text-rose-800 font-semibold">Negative Error (&lt; 0 MW):</span> Wind generation fell short of expectation (Wind Deficit / Short position).
              </li>
              <li>
                <strong>Mean Bias:</strong> Negative bias reveals a systematic tendency for the forecast to over-predict generation.
              </li>
            </ul>
          </div>

          {/* Section 3: Downside Shortfall & Thermal Buffer */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-[16px] mb-2">
              <TrendingDown className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>3. Shortfall Risk & Thermal Reserve Buffer (MW)</span>
            </div>
            <p className="text-slate-700">
              Downside shortfall is defined as <span className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-[13px] font-medium">Shortfall = max(0, Forecast - Actual)</span>.
            </p>
            <div className="mt-3 p-3.5 bg-amber-50 border border-amber-300 rounded-lg text-[14px] text-[#7A4B00]">
              <strong>Trader Actionable Rule:</strong> The <strong>P90 Shortfall Buffer</strong> indicates that with 90% confidence, wind generation will not fall short of the day-ahead forecast by more than this MW amount. Buyers can add this exact MW volume as a dispatchable thermal hedge to protect against deficit penalties.
            </div>
          </div>

          {/* Section 4: Granularity & Timezone */}
          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-[16px] mb-2">
              <AlertTriangle className="w-5 h-5 text-slate-700 flex-shrink-0" />
              <span>4. Granularity Harmonization & Timezone</span>
            </div>
            <p className="text-slate-700">
              Elexon <span className="text-[13px] font-semibold text-slate-900">WINDFOR</span> forecasts are published at hourly intervals (<span className="text-[13px] font-semibold text-slate-900">:00</span>), while <span className="text-[13px] font-semibold text-slate-900">FUELHH</span> actuals are 30-minute settlement periods. In the standard view, outturn generation is the arithmetic mean of the two half-hours (<span className="text-[13px] font-semibold text-slate-900">:00</span> and <span className="text-[13px] font-semibold text-slate-900">:30</span>) to match energy delivered (MWh). All timestamps are Greenwich Mean Time (GMT = UTC in January).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[14px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
