/**
 * Sticky header for the Village Sandbox.
 * Shows title, resource summary, day/night context, and reset controls.
 */
import React from 'react';
import { RotateCcw } from 'lucide-react';
import SummaryStrip, { type SummaryStripProps } from './SummaryStrip';

export interface VillageSandboxHeaderProps extends SummaryStripProps {
  /** Title to display in the header */
  title?: string;
  /** Callback when reset button is clicked */
  onReset?: () => void;
  /** Optional className for styling */
  className?: string;
  /** Current day counter */
  dayCounter: number;
  /** Label for the current phase (e.g. Day/Night) */
  phaseLabel: string;
  /** Icon representing the current phase */
  phaseIcon: string;
  /** Progress of the current cycle (0-1) */
  cycleProgressFraction: number;
}

export const VillageSandboxHeader: React.FC<VillageSandboxHeaderProps> = ({
  title = 'Village Sandbox',
  gold,
  food,
  population,
  onReset,
  className = '',
  dayCounter,
  phaseLabel,
  phaseIcon,
  cycleProgressFraction,
}) => {
  return (
    <header
      data-testid="village-sandbox-header"
      className={`rounded-3xl border border-white/10 bg-black/70 px-5 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur-md ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-500/10 text-2xl">
            <span aria-hidden>{phaseIcon}</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70">{title}</p>
            <p className="text-sm font-semibold text-ivory">
              Giorno {dayCounter} · {phaseLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SummaryStrip
            gold={gold}
            food={food}
            population={population}
            className="hidden md:flex"
          />

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-2 rounded-full border border-red-200/30 bg-red-900/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-red-100 transition hover:border-red-200/60 hover:bg-red-900/50"
              title="Reset Village State"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-linear-to-r from-amber-400 to-amber-200 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, cycleProgressFraction * 100))}%` }}
          />
        </div>
        <span className="text-[11px] uppercase tracking-[0.3em] text-amber-100">
          {(cycleProgressFraction * 100).toFixed(0)}%
        </span>
      </div>

      <div className="mt-3 md:hidden">
        <SummaryStrip gold={gold} food={food} population={population} className="justify-between" />
      </div>
    </header>
  );
};

export default VillageSandboxHeader;
