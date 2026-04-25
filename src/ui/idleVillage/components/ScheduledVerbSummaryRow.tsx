import React, { useMemo } from 'react';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import type { VillageActivityStatus } from '@/engine/game/idleVillage/TimeEngine';

export interface ScheduledVerbSummaryRowProps {
  summary: VerbSummary;
  status: VillageActivityStatus;
  isSelected?: boolean;
  onSelect?: (summary: VerbSummary) => void;
  onResolve?: (summary: VerbSummary) => void;
}

const toneAccentByVariant: Record<
  VerbSummary['visualVariant'],
  { badge: string; progress: string }
> = {
  azure: { badge: 'text-sky-200', progress: 'from-sky-400/80 to-cyan-300/40' },
  ember: { badge: 'text-rose-200', progress: 'from-rose-500/80 to-amber-300/40' },
  jade: { badge: 'text-emerald-200', progress: 'from-emerald-400/80 to-lime-300/30' },
  amethyst: { badge: 'text-fuchsia-200', progress: 'from-purple-400/80 to-pink-300/30' },
  solar: { badge: 'text-amber-200', progress: 'from-amber-300/80 via-orange-400/40 to-yellow-200/30' },
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

const formatTimer = (remainingSeconds?: number) => {
  if (!Number.isFinite(remainingSeconds ?? NaN)) return '--';
  const whole = Math.max(0, Math.round(remainingSeconds ?? 0));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

export const ScheduledVerbSummaryRow: React.FC<ScheduledVerbSummaryRowProps> = ({
  summary,
  status,
  isSelected = false,
  onSelect,
  onResolve,
}) => {
  const accent = toneAccentByVariant[summary.visualVariant] ?? toneAccentByVariant.solar;
  const progressPercent = clamp01(summary.progressFraction) * 100;
  const injuryHeight = Math.min(100, Math.max(0, summary.injuryPercentage));
  const deathHeight = Math.min(100, Math.max(0, summary.deathPercentage));
  const injuryOnlyHeight = Math.max(0, injuryHeight - deathHeight);
  const isCompleted = status === 'completed';
  const isRunning = status === 'running' || status === 'pending';

  const assigneeLabel = useMemo(() => {
    if (!summary.assigneeNames || summary.assigneeNames.length === 0) {
      return 'Nessun residente';
    }
    if (summary.assigneeNames.length === 1) {
      return summary.assigneeNames[0];
    }
    return `${summary.assigneeNames[0]} +${summary.assigneeNames.length - 1}`;
  }, [summary.assigneeNames]);

  const handleClick = () => {
    onSelect?.(summary);
  };

  const handleResolveClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isCompleted) {
      onResolve?.(summary);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'w-full rounded-2xl border px-3 py-2 text-left transition-all duration-200',
        isSelected ? 'border-amber-300/80 shadow-[0_0_28px_rgba(251,191,36,0.45)]' : 'border-slate-800/70 hover:border-amber-200/40',
        isCompleted ? 'bg-emerald-500/10' : 'bg-slate-950/70',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/90 text-lg">
          <span className="drop-shadow">{summary.icon}</span>
          {summary.autoState && (
            <span
              className="absolute -right-1 -top-1 rounded-full bg-slate-900/90 px-1 text-[10px] text-amber-200"
              title={summary.autoState === 'continuous' ? 'Continuous job' : 'Auto-repeat'}
            >
              ∞
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory">
            <span className="truncate">{summary.label}</span>
            <span className={`flex items-center gap-1 text-[10px] ${accent.badge}`}>
              {isCompleted ? 'Pronto' : formatTimer(summary.remainingSeconds)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate">{assigneeLabel}</span>
            <span className="uppercase tracking-[0.3em] text-[9px] text-slate-500">
              {isCompleted ? 'Collect' : isRunning ? 'In progress' : 'Pending'}
            </span>
          </div>
        </div>
        {isCompleted && (
          <div className="flex items-center">
            <span
              role="button"
              tabIndex={0}
              onClick={handleResolveClick}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  handleResolveClick(event as unknown as React.MouseEvent);
                }
              }}
              className="rounded-full border border-emerald-300/60 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-200 hover:bg-emerald-500/20 cursor-pointer"
            >
              Risolvi
            </span>
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900/80">
          <div
            className={`absolute inset-y-0 left-0 rounded-full bg-linear-to-r ${accent.progress}`}
            style={{ width: `${progressPercent}%` }}
            aria-hidden
          />
        </div>
        <div
          className="relative h-6 w-1.5 overflow-hidden rounded-full bg-slate-950/60 ring-1 ring-slate-900/60"
          aria-label={`Injury ${injuryHeight}% Death ${deathHeight}%`}
        >
          {deathHeight > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-error/80" style={{ height: `${deathHeight}%` }} />
          )}
          {injuryOnlyHeight > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-warning/80"
              style={{ height: `${injuryOnlyHeight}%`, marginBottom: `${deathHeight}%` }}
            />
          )}
        </div>
      </div>
    </button>
  );
};

export default ScheduledVerbSummaryRow;
