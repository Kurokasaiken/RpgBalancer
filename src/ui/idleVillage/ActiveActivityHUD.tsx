import React, { useMemo } from 'react';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ResidentState, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import {
  buildScheduledVerbSummary,
  type VerbSummary,
} from '@/ui/idleVillage/verbSummaries';
import ScheduledVerbSummaryRow from '@/ui/idleVillage/components/ScheduledVerbSummaryRow';

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
  selectedSummaryId?: string | null;
  onSelectSummary?: (summary: VerbSummary) => void;
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
  selectedSummaryId,
  onSelectSummary,
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
            return (
              <ScheduledVerbSummaryRow
                key={scheduled.id}
                summary={summary}
                status={scheduled.status}
                isSelected={summary.key === selectedSummaryId}
                onSelect={onSelectSummary}
                onResolve={(rowSummary) => {
                  if (rowSummary.key === summary.key && scheduled.status === 'completed') {
                    onResolve?.(scheduled.id);
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default ActiveActivityHUD;
