import { useMemo } from 'react';
import type { ActivityDefinition, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

export interface VerbDetailAssignment {
  resident: ResidentState;
  isSelected: boolean;
  onToggle: (residentId: string) => void;
}

export interface VerbSlotState {
  id: string;
  label: string;
  statHint?: string;
  required?: boolean;
  requiredStatId?: string;
  assignedResidentId?: string | null;
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
  slots?: VerbSlotState[];
  durationSeconds?: number;
  elapsedSeconds?: number;
  isActive?: boolean;
  mockWarning?: string;
  onStart?: () => void;
  onClose?: () => void;
  onSlotClick?: (slotId: string) => void;
  startDisabled?: boolean;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function clampRatio(value: number | undefined): number {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Math.max(0, Math.min(1, value ?? 0));
}

function formatDuration(seconds?: number): string {
  if (!Number.isFinite(seconds ?? NaN)) return '—';
  const whole = Math.max(0, Math.round(seconds ?? 0));
  if (whole < 60) return `${whole}s`;
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export default function VerbDetailCard({
  title,
  subtitle,
  activity,
  description,
  preview,
  assignments,
  slotLabel,
  slots = [],
  durationSeconds,
  elapsedSeconds = 0,
  isActive,
  mockWarning,
  onStart,
  onClose,
  onSlotClick,
  startDisabled,
}: VerbDetailCardProps) {
  const riskHeights = useMemo(() => {
    const injury = clampPercent(preview.injuryPercentage);
    const death = clampPercent(preview.deathPercentage);
    const injuryOnly = Math.max(0, injury - death);
    const safe = Math.max(0, 100 - death - injuryOnly);
    return { death, injuryOnly, safe };
  }, [preview.deathPercentage, preview.injuryPercentage]);

  const progressRatio = useMemo(() => {
    if (!durationSeconds || !isActive) return 0;
    return clampRatio(elapsedSeconds / durationSeconds);
  }, [durationSeconds, elapsedSeconds, isActive]);

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-amber-400/40 bg-slate-950/95 text-ivory shadow-[0_40px_90px_rgba(0,0,0,0.8)]">
      <div className="space-y-3 border-b border-amber-400/30 px-6 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-amber-200/80">{subtitle ?? 'Verb'}</div>
            <div className="text-xl font-semibold leading-tight">{title}</div>
            <div className="text-xs text-slate-400">
              {slotLabel ?? 'Unassigned slot'} · Danger {activity.dangerRating ?? '—'} · Level {activity.level ?? '—'}
            </div>
          </div>
          {durationSeconds && (
            <div className="text-right text-xs text-slate-300">
              <div className="uppercase tracking-[0.2em] text-slate-500">Duration</div>
              <div className="text-lg font-mono text-amber-200">{formatDuration(durationSeconds)}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-300">
                {isActive ? 'In progress' : 'Ready'}
              </div>
            </div>
          )}
        </div>
        {durationSeconds && (
          <div className="relative h-2 overflow-hidden rounded-full bg-slate-900">
            <div
              className={`h-full transition-all duration-300 ${
                isActive ? 'bg-linear-to-r from-emerald-500 via-amber-400 to-rose-500' : 'bg-slate-700'
              }`}
              style={{ width: `${isActive ? progressRatio * 100 : 0}%` }}
            />
            {isActive && (
              <div className="absolute inset-y-0 right-3 flex items-center text-[10px] font-mono text-slate-200">
                {(progressRatio * 100).toFixed(0)}%
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6 px-6 py-6 text-[12px]">
        {description && <p className="text-slate-200">{description}</p>}

        {slots.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-slate-400">
              <span>Slot Requirements</span>
              <span>Drag cards/residents into each slot</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {slots.map((slot) => {
                const assignedLabel = slot.assignedResidentId ?? 'Empty';
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onSlotClick?.(slot.id)}
                    className="group rounded-xl border border-dashed border-slate-700 bg-slate-950/70 px-3 py-3 text-left transition hover:border-amber-400/70"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
                      <span>{slot.label}</span>
                      {slot.required && <span className="text-amber-300 text-[10px] uppercase tracking-[0.2em]">Required</span>}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                      {slot.statHint ?? 'Any Stat'}
                    </div>
                    <div
                      className={`mt-2 flex h-16 items-center justify-center rounded-lg border text-sm font-medium ${
                        slot.assignedResidentId
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100'
                          : 'border-slate-800 bg-slate-900/40 text-slate-500 group-hover:text-slate-200'
                      }`}
                    >
                      {assignedLabel}
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">
                      {slot.assignedResidentId ? 'Tap to replace or clear.' : 'Drop a compatible resident to satisfy this slot.'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Reward Preview (mock)</div>
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
              <div className="rounded border border-slate-800 px-3 py-2 text-slate-500">
                No explicit rewards configured in config.
              </div>
            )}

            {mockWarning && (
              <div className="rounded border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-100">
                {mockWarning}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Risk Stripe</div>
            <div className="flex items-center gap-3">
              <div className="flex h-28 w-10 flex-col overflow-hidden rounded-sm border border-slate-800">
                <div className="bg-rose-600" style={{ height: `${riskHeights.death}%` }} />
                <div className="bg-amber-400" style={{ height: `${riskHeights.injuryOnly}%` }} />
                <div className="flex-1 bg-emerald-700/40" />
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300 space-y-1">
                <div className="text-amber-200">Injury {clampPercent(preview.injuryPercentage)}%</div>
                <div className="text-rose-300">Death {clampPercent(preview.deathPercentage)}%</div>
                {preview.note && <div className="text-slate-500 normal-case tracking-normal">{preview.note}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-800 pt-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Staging Pool</div>
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
            Drag from the staging pool to each slot. Drag-and-drop wiring will replace this placeholder once the SkillCheck engine ships.
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
