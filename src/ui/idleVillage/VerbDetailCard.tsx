import { useMemo } from 'react';
import type { ActivityDefinition, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

export interface VerbDetailAssignment {
  resident: ResidentState;
  isSelected: boolean;
  onToggle: (residentId: string) => void;
}

export interface VerbDetailPreview {
  rewards: ResourceDeltaDefinition[];
  injuryPercentage: number;
  deathPercentage: number;
  note?: string;
}

export interface VerbDetailCardProps {
  title: string;
  subtitle?: string;
  activity: ActivityDefinition;
  description?: string;
  preview: VerbDetailPreview;
  assignments: VerbDetailAssignment[];
  slotLabel?: string;
  mockWarning?: string;
  onStart?: () => void;
  onClose?: () => void;
  startDisabled?: boolean;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export default function VerbDetailCard({
  title,
  subtitle,
  activity,
  description,
  preview,
  assignments,
  slotLabel,
  mockWarning,
  onStart,
  onClose,
  startDisabled,
}: VerbDetailCardProps) {
  const riskHeights = useMemo(() => {
    const injury = clampPercent(preview.injuryPercentage);
    const death = clampPercent(preview.deathPercentage);
    const injuryOnly = Math.max(0, injury - death);
    const safe = Math.max(0, 100 - death - injuryOnly);
    return { death, injuryOnly, safe };
  }, [preview.deathPercentage, preview.injuryPercentage]);

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-amber-400/40 bg-slate-950/95 text-ivory shadow-[0_40px_90px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between border-b border-amber-400/30 px-6 py-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-amber-200/80">{subtitle ?? 'Quest Detail'}</div>
          <div className="text-xl font-semibold leading-tight">{title}</div>
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
            {slotLabel && <span>Location · {slotLabel}</span>}
            {activity.level != null && <span>Level · {activity.level}</span>}
            {activity.dangerRating != null && <span>Danger · {activity.dangerRating}</span>}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300 hover:bg-slate-900"
          >
            Close
          </button>
        )}
      </div>

      <div className="space-y-5 px-6 py-5 text-[12px]">
        {description && <p className="text-slate-200">{description}</p>}

        {activity.tags && activity.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
            {activity.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-slate-700 px-2 py-0.5 text-[9px]">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1 space-y-2">
            <div className="text-[9px] uppercase tracking-[0.25em] text-slate-400">Reward Preview (Mock)</div>
            {preview.rewards.length ? (
              <div className="flex flex-wrap gap-2">
                {preview.rewards.map((reward) => (
                  <div
                    key={reward.resourceId}
                    className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-2 py-1 text-[11px]"
                  >
                    <span className="font-semibold text-amber-200">{reward.resourceId}</span>
                    <span className="font-mono text-slate-100">{reward.amountFormula}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500">No explicit rewards configured.</div>
            )}
            {preview.note && <div className="text-[10px] text-slate-400">{preview.note}</div>}
          </div>
          <div className="flex items-center gap-3 md:flex-col">
            <div className="flex h-28 w-10 flex-col overflow-hidden rounded-sm border border-slate-800">
              <div className="bg-rose-600" style={{ height: `${riskHeights.death}%` }} />
              <div className="bg-amber-400" style={{ height: `${riskHeights.injuryOnly}%` }} />
              <div className="flex-1 bg-emerald-700/40" />
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300">
              <div className="text-amber-200">Injury {clampPercent(preview.injuryPercentage)}%</div>
              <div className="text-rose-300">Death {clampPercent(preview.deathPercentage)}%</div>
            </div>
          </div>
        </div>

        {mockWarning && (
          <div className="rounded border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-100">
            {mockWarning}
          </div>
        )}

        <div className="space-y-2 border-t border-slate-800 pt-4">
          <div className="text-[9px] uppercase tracking-[0.25em] text-slate-400">Assigned Characters</div>
          <div className="flex flex-wrap gap-2">
            {assignments.map((assignment) => {
              const { resident, isSelected } = assignment;
              const disabled = !isSelected && resident.status !== 'available';
              return (
                <button
                  key={resident.id}
                  type="button"
                  onClick={() => assignment.onToggle(resident.id)}
                  disabled={disabled}
                  className={[
                    'rounded-full border px-3 py-1 text-[11px]',
                    isSelected
                      ? 'border-emerald-400 text-emerald-200 bg-emerald-500/10'
                      : disabled
                        ? 'border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'border-slate-600 text-slate-100 hover:border-emerald-400/60',
                  ].join(' ')}
                >
                  <span className="font-semibold">{resident.id}</span>
                  <span className="ml-1 text-[9px] uppercase tracking-[0.18em] text-slate-400">{resident.status}</span>
                </button>
              );
            })}
            {!assignments.length && <div className="text-[10px] text-slate-500">No residents available.</div>}
          </div>
          <div className="rounded border border-dashed border-slate-700 bg-slate-900/40 px-3 py-2 text-[10px] text-slate-400">
            Drag-and-drop tokens coming soon. Use the toggles above while the SkillCheckEngine is in development.
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-700 px-4 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-200 hover:bg-slate-900"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onStart}
            disabled={startDisabled}
            className="rounded-full border border-emerald-400/70 bg-emerald-500/20 px-5 py-1 text-[10px] uppercase tracking-[0.3em] text-emerald-100 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
