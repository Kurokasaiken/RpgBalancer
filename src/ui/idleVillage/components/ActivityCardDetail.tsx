import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Sparkles, X, Play } from 'lucide-react';
import type { ActivityDefinition, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import type { VerbDetailPreview, VerbSlotState } from '@/ui/idleVillage/VerbDetailCard';
import type { DropState } from './ActivitySlot';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';

export type MetricTone = 'neutral' | 'positive' | 'warning' | 'danger';

export interface ActivityCardMetric {
  /** Unique identifier for the metric row. */
  id: string;
  /** Display label. */
  label: string;
  /** Human readable value (already formatted). */
  value: string;
  /** Optional tone used to color the metric. */
  tone?: MetricTone;
  /** Optional helper copy under the value. */
  helperText?: string;
}

export interface ActivityCardSlotAssignment {
  /** Slot metadata derived from config. */
  slot: VerbSlotState;
  /** Friendly resident label (already formatted). */
  residentName?: string | null;
  /** Drop validation state while dragging. */
  dropState?: DropState;
}

export interface ActivityCardDetailProps {
  activity: ActivityDefinition;
  slotLabel?: string;
  preview: VerbDetailPreview;
  assignments: ActivityCardSlotAssignment[];
  rewards?: ResourceDeltaDefinition[];
  metrics?: ActivityCardMetric[];
  durationSeconds?: number;
  elapsedSeconds?: number;
  onStart?: () => void;
  onClose?: () => void;
  onDropResident?: (slotId: string, residentId: string | null) => void;
  onRemoveResident?: (slotId: string) => void;
  isStartDisabled?: boolean;
  draggingResidentId?: string | null;
}

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
};

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const formatTime = (seconds?: number): string => {
  if (!Number.isFinite(seconds ?? NaN)) return '--';
  const clamped = Math.max(0, Math.round(seconds ?? 0));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

/**
 * Floating card detail inspired by the Style Laboratory moodboard.
 * Behaves like a Magic card on a table: draggable, drop targets, halo progress.
 */
const ActivityCardDetail: React.FC<ActivityCardDetailProps> = ({
  activity,
  slotLabel,
  preview,
  assignments,
  rewards = [],
  metrics = [],
  durationSeconds,
  elapsedSeconds = 0,
  onStart,
  onClose,
  onDropResident,
  onRemoveResident,
  isStartDisabled = false,
  draggingResidentId,
}) => {
  const { activePreset } = useThemeSwitcher();
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const remainingSeconds = Math.max(0, (durationSeconds ?? 0) - elapsedSeconds);
  const progressRatio = durationSeconds ? clamp01(elapsedSeconds / durationSeconds) : 0;
  const progressDegrees = progressRatio * 360;
  const haloStartDeg = -90;
  const haloHighlightStartDeg = haloStartDeg + Math.max(progressDegrees - 40, 0);

  const riskDeath = clampPercent(preview.deathPercentage);
  const riskInjuryOnly = Math.max(0, clampPercent(preview.injuryPercentage) - riskDeath);

  const cardFrameStyle: CSSProperties = useMemo(() => {
    const tokens = activePreset.tokens;
    return {
      background: tokens['card-surface'] ?? 'var(--card-surface, rgba(5,7,12,0.95))',
      borderColor: tokens['panel-border'] ?? 'var(--panel-border, rgba(255,215,0,0.35))',
      boxShadow: `0 35px 75px ${tokens['card-shadow-color'] ?? 'rgba(0,0,0,0.65)'}`,
    };
  }, [activePreset]);

  const auraStyle: CSSProperties = useMemo(
    () => ({
      background: activePreset.tokens['card-surface-radial'] ?? 'var(--card-surface-radial, rgba(255,255,255,0.06))',
    }),
    [activePreset],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (event: PointerEvent) => {
      const dx = event.clientX - pointerOriginRef.current.x;
      const dy = event.clientY - pointerOriginRef.current.y;
      setPosition({
        x: dragOriginRef.current.x + dx,
        y: dragOriginRef.current.y + dy,
      });
    };
    const handlePointerUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    pointerOriginRef.current = { x: event.clientX, y: event.clientY };
    dragOriginRef.current = { ...position };
    setIsDragging(true);
  };

  const meterToneClass = (tone?: MetricTone) => {
    switch (tone) {
      case 'positive':
        return 'text-emerald-300';
      case 'warning':
        return 'text-amber-300';
      case 'danger':
        return 'text-rose-300';
      default:
        return 'text-slate-200';
    }
  };

  const handleSlotDrop = (slotId: string) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const residentId =
      event.dataTransfer.getData('text/resident-id') || event.dataTransfer.getData('text/plain') || null;
    onDropResident?.(slotId, residentId);
  };

  const handleSlotDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleClearSlot = (slotId: string) => {
    onRemoveResident?.(slotId);
  };

  const assignmentTitle = slotLabel ?? activity.label;
  const activityIcon =
    ((activity.metadata as { icon?: string } | undefined)?.icon as string | undefined) ?? activity.tags?.[0] ?? '◎';

  return (
    <div
      className="relative pointer-events-auto w-full max-w-[340px] sm:max-w-[340px]"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div className="absolute -inset-5 rounded-[28px] bg-black/30 blur-[28px]" aria-hidden />
      <article
        role="dialog"
        aria-label={`Scheda ${activity.label}`}
        className="relative overflow-hidden rounded-[20px] border px-3.5 py-3.5 backdrop-blur-lg text-[11px] leading-snug"
        style={cardFrameStyle}
      >
        <div className="absolute inset-0 opacity-40" style={auraStyle} aria-hidden />
        <div className="relative z-10 flex flex-col gap-3">
          <header className="flex items-start justify-between gap-2.5">
            <div className="flex-1 space-y-0.5">
              <p className="text-[9px] uppercase tracking-[0.28em] text-slate-500">Activity Detail</p>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-400/40 text-lg">
                  <span aria-hidden>{activityIcon}</span>
                </div>
                <div>
                  <h2 className="font-semibold text-base leading-tight">{activity.label}</h2>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-amber-200/80">
                    {assignmentTitle ?? 'Slot'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onPointerDown={startDrag}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-slate-200 hover:border-amber-300/40"
                aria-label="Trascina la card"
              >
                ⋮⋮
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 bg-white/5 p-1.5 text-slate-200 hover:border-rose-400/50 hover:text-rose-200"
                aria-label="Chiudi scheda"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </header>

          <section className="flex flex-col gap-3">
            <div className="grid grid-cols-[82px_minmax(0,1fr)] gap-3">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-24 w-24">
                    <div className="absolute inset-0.5 rounded-full border border-white/10" />
                    <div
                      className="absolute inset-1 rounded-full opacity-80 blur-[0.4px]"
                      style={{
                        background: `conic-gradient(from ${haloStartDeg}deg, var(--halo-color, rgba(251,191,36,0.65)) 0deg ${progressDegrees}deg, rgba(6,8,16,0.6) ${progressDegrees}deg 360deg)`,
                      }}
                    />
                    <div
                      className="absolute inset-2 rounded-full mix-blend-screen opacity-70"
                      style={{
                        background: `conic-gradient(from ${haloHighlightStartDeg}deg, rgba(255,255,255,0.4), transparent 140deg)`,
                      }}
                    />
                    <div className="absolute inset-[10px] rounded-full border border-dashed border-white/10 opacity-60 animate-[spin_18s_linear_infinite]" />
                  </div>
                </div>
                <div
                  className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full text-2xl text-amber-200 shadow-inner shadow-black/70"
                  style={{ background: 'var(--panel-surface, rgba(8,10,15,0.95))' }}
                >
                  {activityIcon ? <span aria-hidden>{activityIcon}</span> : <Sparkles className="h-5 w-5" />}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-slate-400">
                  <span>Progress</span>
                  <span>{(progressRatio * 100).toFixed(0)}%</span>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">Time</p>
                  <p className="font-mono text-[12px] text-amber-200">
                    {formatTime(remainingSeconds)} · Tot {formatTime(durationSeconds)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onStart}
                  disabled={isStartDisabled}
                  className="inline-flex items-center justify-center gap-1 rounded-full border border-emerald-400/70 bg-emerald-500/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-50 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Play className="h-3 w-3" />
                  Start
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-slate-400">
                  <span>Slot</span>
                  <span>{draggingResidentId ? 'Droppa residente compatibile' : 'Trascina dal roster'}</span>
                </div>
                <div className="space-y-2.5">
                  {assignments.map(({ slot, residentName, dropState }) => (
                    <div
                      key={slot.id}
                      onDragOver={handleSlotDragOver}
                      onDrop={handleSlotDrop(slot.id)}
                      className={[
                        'rounded-lg border px-2.5 py-2 transition-colors backdrop-blur-sm',
                        dropState === 'valid'
                          ? 'border-emerald-400/70 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.45)]'
                          : dropState === 'invalid'
                              ? 'border-rose-400/80 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.35)]'
                              : residentName
                                ? 'border-white/20 bg-white/5'
                                : 'border-dashed border-white/15 bg-black/20 text-slate-300'
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-slate-400">
                        <span>{slot.label}</span>
                        {slot.required && <span className="text-rose-200">Required</span>}
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-slate-200">
                        {residentName ?? 'Slot libero'}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[9px] uppercase tracking-[0.15em]">
                        <span className="text-slate-500">{slot.statHint ?? 'Nessun requisito'}</span>
                        {residentName && (
                          <button
                            type="button"
                            onClick={() => handleClearSlot(slot.id)}
                            className="rounded-full border border-white/20 px-2 py-0.5 text-[8px] tracking-[0.2em] text-slate-200 hover:border-rose-300 hover:text-rose-200"
                          >
                            Rimuovi
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full text-2xl text-amber-200 shadow-inner shadow-black/70"
                style={{ background: 'var(--panel-surface, rgba(8,10,15,0.95))' }}
              >
                {activityIcon ? <span aria-hidden>{activityIcon}</span> : <Sparkles className="h-5 w-5" />}
              </div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-slate-400">Risk</div>
              <div className="flex items-center gap-3">
                <div className="flex h-20 w-6 flex-col overflow-hidden rounded-full border border-white/10">
                  <div className="bg-rose-500" style={{ height: `${riskDeath}%` }} />
                  <div className="bg-amber-400" style={{ height: `${riskInjuryOnly}%` }} />
                  <div className="flex-1 bg-emerald-500/20" />
                </div>
                <div className="space-y-0.5 text-[9px] uppercase tracking-[0.15em]">
                  <p className="text-amber-200">Injury {clampPercent(preview.injuryPercentage)}%</p>
                  <p className="text-rose-200">Death {riskDeath}%</p>
                  {preview.note && (
                    <p className="text-[10px] normal-case text-slate-300 tracking-normal">{preview.note}</p>
                  )}
                </div>
              </div>

              {metrics.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[9px] uppercase tracking-[0.18em] text-slate-400">Metrics</div>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {metrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-left"
                      >
                        <p className="text-[8px] uppercase tracking-[0.15em] text-slate-500">{metric.label}</p>
                        <p className={`text-[11px] font-semibold ${meterToneClass(metric.tone)}`}>{metric.value}</p>
                        {metric.helperText && (
                          <p className="text-[9px] text-slate-500 leading-tight">{metric.helperText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="text-[9px] uppercase tracking-[0.18em] text-slate-400">Rewards</div>
                {rewards.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {rewards.map((reward) => (
                      <span
                        key={`${reward.resourceId}-${reward.amountFormula}`}
                        className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[9px]"
                      >
                        <span className="text-amber-200 font-semibold">{reward.resourceId}</span>{' '}
                        <span className="font-mono text-slate-200 text-[10px]">{reward.amountFormula}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[9px] text-slate-400">
                    Nessuna ricompensa configurata.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
};

export default ActivityCardDetail;
