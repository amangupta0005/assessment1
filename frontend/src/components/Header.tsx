import React from 'react';
import { Wind, HelpCircle, ShieldCheck, Clock } from 'lucide-react';

interface HeaderProps {
  cutoffTime: string;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ cutoffTime, onOpenHelp }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600 rounded-lg shadow-inner text-white">
              <Wind className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  UK Day-Ahead Wind Forecast Evaluation Platform
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-900/80 text-teal-300 border border-teal-700">
                  January 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Day-ahead power trading intelligence • Elexon BMRS WINDFOR vs FUELHH • Zero data leakage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Cutoff Assumption Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Gate Closure:</span>
              <span className="font-bold text-white font-mono">{cutoffTime} GMT (D-1)</span>
            </div>

            {/* Invariant Verified Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-950/60 border border-emerald-800 text-xs font-medium text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strict Anti-Leakage</span>
            </div>

            {/* Help Button */}
            <button
              onClick={onOpenHelp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="How to read this dashboard"
            >
              <HelpCircle className="w-4 h-4 text-teal-400" />
              <span>How to Read</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
