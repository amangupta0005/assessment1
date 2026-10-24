import React from 'react';
import { Wind, HelpCircle, ShieldCheck, Clock } from 'lucide-react';

interface HeaderProps {
  cutoffTime: string;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ cutoffTime, onOpenHelp }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title and Context */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 bg-teal-600 rounded-lg shadow-inner text-white flex-shrink-0 mt-1 sm:mt-0">
              <Wind className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-white leading-tight">
                  UK Day-Ahead Wind Forecast Evaluation Platform
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-semibold bg-teal-900/90 text-teal-200 border border-teal-700/80">
                  January 2026
                </span>
              </div>
              <p className="text-[14px] sm:text-[15px] text-[#C9D6E8] mt-1 font-normal leading-normal">
                Day-ahead power trading intelligence • Elexon BMRS WINDFOR vs FUELHH • Zero data leakage
              </p>
            </div>
          </div>

          {/* Header Action Badges */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto pt-1 lg:pt-0">
            {/* Cutoff Badge: Tabular nums, Inter font, min-h 40px, no monospace */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-[14px] font-medium text-slate-100 min-h-[40px] shadow-xs"
              title="Only forecasts published prior to this gate closure are eligible for selection"
            >
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-slate-300">Gate Closure:</span>
              <span className="font-semibold text-white tabular-nums">{cutoffTime} GMT (D-1)</span>
            </div>

            {/* Anti-Leakage Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-950/70 border border-emerald-800/80 text-[14px] font-medium text-emerald-200 min-h-[40px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Strict Anti-Leakage</span>
            </div>

            {/* Help Button: Accessible, 14px, 40px touch target */}
            <button
              onClick={onOpenHelp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-[14px] font-medium transition-colors border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[40px]"
              aria-label="How to read this dashboard"
            >
              <HelpCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>How to Read</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
