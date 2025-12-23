import React, { useMemo } from 'react';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ResidentState, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import {
  buildScheduledVerbSummary,
  type VerbSummary,
} from '@/ui/idleVillage/verbSummaries';
import type { VerbVisualVariant } from '@/ui/idleVillage/VerbCard';

const variantAccentMap: Record<VerbVisualVariant, { progress: string; badge: string }> = {
  azure: { progress: 'from-sky-400/80 to-cyan-300/30', badge: 'text-sky-200' },
  jade: { progress: 'from-emerald-400/80 to-lime-300/30', badge: 'text-emerald-200' },
  ember: { progress: 'from-rose-500/80 to-amber-300/40', badge: 'text-rose-200' },
  amethyst: { progress: 'from-purple-400/80 to-fuchsia-300/30', badge: 'text-fuchsia-200' },
  solar: { progress: 'from-amber-300/70 via-orange-400/50 to-yellow-200/20', badge: 'text-amber-100' },
};

const DEFAULT_ACCENT = variantAccentMap.solar;

const formatCompactDuration = (seconds?: number): string => {
  if (!Number.isFinite(seconds ?? NaN)) return '--';
  const whole = Math.max(0, Math.round(seconds ?? 0));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

interface ActiveActivityHUDProps {
  activities: ScheduledActivity[];
  config: IdleVillageConfig;
  currentTime: number;
  secondsPerTimeUnit: number;
  dayLength: number;
  residents: Record<string, ResidentState>;
  getResourceLabel: (resourceId: string) => string;
  onResolve?: (scheduledId: string) => void;
  className?: string;
}

interface HudEntry {
  scheduled: ScheduledActivity;
  summary: VerbSummary;
}

export const ActiveActivityHUD: React.FC<ActiveActivityHUDProps> = ({
  activities,
  config,
  currentTime,
  secondsPerTimeUnit,
  dayLength,
  residents,
  getResourceLabel,
  onResolve,
  className = '',
}) => {
  const hudEntries = useMemo(() => {
    const mapSlots = config.mapSlots ?? {};
    return activities
      .filter((activity) => activity.status === 'running' || activity.status === 'completed')
      .map<HudEntry | null>((scheduled) => {
        const activityDef = config.activities[scheduled.activityId];
        if (!activityDef) return null;
        const slotIcon = scheduled.slotId ? mapSlots[scheduled.slotId]?.icon : undefined;
        const assigneeNames = scheduled.characterIds.map((cid) => residents[cid]?.id ?? cid);
        const summary = buildScheduledVerbSummary({
          scheduled,
          activity: activityDef,
          slotIcon,
          resourceLabeler: getResourceLabel,
          currentTime,
          secondsPerTimeUnit,
          dayLength,
          assigneeNames,
        });
        return { scheduled, summary };
      })
      .filter((entry): entry is HudEntry => Boolean(entry))
      .sort((a, b) => {
        if (a.scheduled.status !== b.scheduled.status) {
          return a.scheduled.status === 'completed' ? -1 : 1;
        }
        return a.scheduled.endTime - b.scheduled.endTime;
      });
  }, [activities, config.activities, config.mapSlots, currentTime, dayLength, getResourceLabel, residents, secondsPerTimeUnit]);

  return (
    <aside
      className={[
        'pointer-events-auto w-72 max-w-full',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Active activities HUD"
    >
      <div className="rounded-3xl border border-amber-400/40 bg-black/70 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.65)] backdrop-blur">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-amber-200/80">Active HUD</div>
            <div className="text-sm font-semibold text-ivory">Monitoraggio attività</div>
          </div>
          <div className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
            {hudEntries.length}
          </div>
        </header>

        <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto pr-1">
          {hudEntries.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/40 px-3 py-4 text-center text-[11px] text-slate-400">
              Nessuna attività in corso.
            </div>
          )}

          {hudEntries.map(({ scheduled, summary }) => {
            const isCompleted = scheduled.status === 'completed';
            const timerLabel = isCompleted ? 'Pronto' : formatCompactDuration(summary.remainingSeconds);
            const accent = variantAccentMap[summary.visualVariant] ?? DEFAULT_ACCENT;
            const assigneeLabel =
              summary.assigneeNames && summary.assigneeNames.length > 0
                ? summary.assigneeNames.join(', ')
                : 'Nessun residente';

            const handleClick = () => {
              if (isCompleted) {
                onResolve?.(scheduled.id);
              }
            };

            return (
              <button
                key={scheduled.id}
                type="button"
                onClick={handleClick}
                disabled={!isCompleted}
                className={[
                  'group w-full rounded-2xl border px-3 py-2 text-left transition-shadow duration-300',
                  isCompleted
                    ? 'border-amber-300/70 bg-amber-400/5 shadow-[0_0_28px_rgba(251,191,36,0.35)] animate-[pulse_2.2s_ease-in-out_infinite]'
                    : 'border-slate-800/70 bg-slate-950/70 hover:border-amber-300/40 hover:bg-slate-900/70',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/90 text-lg">
                    <span className="drop-shadow">{summary.icon}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory">
                      <span className="truncate">{summary.label}</span>
                      <span className={`flex items-center gap-1 text-[10px] ${accent.badge}`}>
                        {scheduled.isAuto && <span title="Auto-repeat" className="text-[12px] leading-none">∞</span>}
                        {timerLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate">{assigneeLabel}</span>
                      <span className="uppercase tracking-[0.3em] text-[9px] text-slate-500">
                        {isCompleted ? 'Collect' : 'Running'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900/80">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full bg-linear-to-r ${accent.progress}`}
                      style={{ width: `${Math.min(100, Math.max(0, summary.progressFraction * 100))}%` }}
                    />
                  </div>
                  <div
                    className="relative h-6 w-1.5 overflow-hidden rounded-full bg-slate-950/60 ring-1 ring-slate-900/60"
                    aria-hidden="true"
                  >
                    {summary.injuryPercentage > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-warning/80"
                        style={{ height: `${Math.min(100, summary.injuryPercentage)}%` }}
                      />
                    )}
                    {summary.deathPercentage > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-error/80"
                        style={{ height: `${Math.min(100, summary.deathPercentage)}%` }}
                      />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default ActiveActivityHUD;
