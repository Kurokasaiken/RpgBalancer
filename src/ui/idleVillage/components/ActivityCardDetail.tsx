import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { X, Play } from 'lucide-react';
import type { ActivityDefinition, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import type { VerbDetailPreview } from '@/ui/idleVillage/VerbDetailCard';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import ResidentSlotRack, { type ResidentSlotRackProps } from '@/ui/idleVillage/slots/ResidentSlotRack';
import type { ResidentSlotViewModel, SlotOverflowPolicy } from '@/ui/idleVillage/slots/useResidentSlotController';

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

export interface ActivityCardDetailProps {
  activity: ActivityDefinition;
  slotLabel?: string;
  preview: VerbDetailPreview;
  slotViewModels: ResidentSlotViewModel[];
  rewards?: ResourceDeltaDefinition[];
  metrics?: ActivityCardMetric[];
  durationSeconds?: number;
  elapsedSeconds?: number;
  onStart?: () => void;
  onClose?: () => void;
  onDropResident?: (slotId: string, residentId: string | null) => void;
  onRemoveResident?: (slotId: string) => void;
  slotOverflowMode?: SlotOverflowPolicy;
  resolveSlotDisplayInfo?: ResidentSlotRackProps['resolveDisplayInfo'];
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

const mapStatLabelToIcon = (label?: string | null): string => {
  if (!label) return '☆';
  const normalized = label.trim().toLowerCase();
  if (normalized.includes('hp') || normalized.includes('vita')) return '❤';
  if (normalized.includes('dmg') || normalized.includes('danno')) return '⚔';
  if (normalized.includes('def')) return '🛡';
  if (normalized.includes('agi') || normalized.includes('spd')) return '➶';
  if (normalized.includes('mag') || normalized.includes('mana')) return '✷';
  return label.trim().charAt(0) || '☆';
};

const DRAG_EXEMPT_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL']);

const isDragExemptTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (DRAG_EXEMPT_TAGS.has(target.tagName)) return true;
  if (target.closest('[data-drag-exempt="true"]')) return true;
  return false;
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
 * Behaves come una carta sul tavolo: draggable, drop targets, metriche compatte.
 */
const ActivityCardDetail: React.FC<ActivityCardDetailProps> = ({
  activity,
  slotLabel,
  preview,
  slotViewModels,
  rewards = [],
  metrics = [],
  durationSeconds,
  elapsedSeconds = 0,
  onStart,
  onClose,
  onDropResident,
  onRemoveResident,
  slotOverflowMode,
  resolveSlotDisplayInfo,
  isStartDisabled = false,
  draggingResidentId,
}) => {
  const { activePreset } = useThemeSwitcher();
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const riskDeath = clampPercent(preview.deathPercentage);
  const riskInjuryOnly = Math.max(0, clampPercent(preview.injuryPercentage) - riskDeath);
  const riskTooltip = `Injury ${clampPercent(preview.injuryPercentage)}% · Death ${riskDeath}%`;
  const hasSlotOverflow = slotViewModels.length > 4;
  const resolvedSlotOverflow = slotOverflowMode ?? (hasSlotOverflow ? 'scroll' : 'wrap');
  const resolvedDurationSeconds =
    Number.isFinite(durationSeconds ?? NaN) && (durationSeconds ?? 0) > 0 ? (durationSeconds as number) : 0;
  const elapsed = Math.max(0, elapsedSeconds ?? 0);
  const progressRatio = resolvedDurationSeconds > 0 ? clamp01(elapsed / resolvedDurationSeconds) : 0;
  const remainingSeconds =
    resolvedDurationSeconds > 0 ? Math.max(0, resolvedDurationSeconds - elapsed) : undefined;

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

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (isDragExemptTarget(event.target)) return;
    // Avoid dragging when selecting text (modifier keys)
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    pointerOriginRef.current = { x: event.clientX, y: event.clientY };
    dragOriginRef.current = { ...position };
    setIsDragging(true);
  };

  const handleRackDrop = useCallback<NonNullable<ResidentSlotRackProps['onSlotDrop']>>(
    (slotId: string, residentId: string | null) => {
      onDropResident?.(slotId, residentId ?? null);
    },
    [onDropResident],
  );

  const handleRackClear = useCallback<NonNullable<ResidentSlotRackProps['onSlotClear']>>(
    (slotId) => {
      onRemoveResident?.(slotId);
    },
    [onRemoveResident],
  );

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

  const assignmentTitle = slotLabel ?? activity.label;

  const resolveDisplayInfo = useCallback<NonNullable<ResidentSlotRackProps['resolveDisplayInfo']>>(
    (slot) => {
      const statLabel = slot.statHint ?? slot.requirement?.label ?? 'Stat';
      return {
        icon: mapStatLabelToIcon(statLabel),
        label: slot.label,
      };
    },
    [],
  );

  const slotDisplayResolver = resolveSlotDisplayInfo ?? resolveDisplayInfo;

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
        onPointerDown={handlePointerDown}
      >
        <div className="absolute inset-0 opacity-40" style={auraStyle} aria-hidden />
        <div className="relative z-10 flex flex-col gap-3">
          <header className="flex items-start justify-between gap-2.5">
            <div className="flex-1 space-y-0.5">
              <h2 className="text-sm font-semibold leading-tight tracking-wide">{activity.label}</h2>
              <p className="text-[9px] uppercase tracking-[0.15em] text-amber-200/80">{assignmentTitle ?? 'Slot'}</p>
            </div>
            <div className="flex items-center gap-1.5" data-drag-exempt="true">
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 rounded-lg border border-white/10 bg-black/15 px-3 py-2">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-slate-400">
                  <span>Progress</span>
                  <span>{(progressRatio * 100).toFixed(0)}%</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-amber-200">
                  <span>{formatTime(remainingSeconds)} rimanenti</span>
                  <span className="text-slate-400">/ {formatTime(durationSeconds)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onStart}
                disabled={isStartDisabled}
                className="inline-flex items-center justify-center gap-1 rounded-full border border-emerald-400/70 bg-emerald-500/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-emerald-50 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play className="h-3 w-3" />
                Start
              </button>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
              <div className="flex-1 space-y-1.5">
                <ResidentSlotRack
                  slots={slotViewModels}
                  variant="detail"
                  overflow={resolvedSlotOverflow}
                  onSlotDrop={handleRackDrop}
                  onSlotClear={handleRackClear}
                  resolveDisplayInfo={slotDisplayResolver}
                  draggingResidentId={draggingResidentId}
                />
                {metrics.length > 0 && (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {metrics.map((metric) => (
                      <div
                        key={metric.id}
                        className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-left"
                      >
                        <p className="text-[8px] uppercase tracking-[0.15em] text-slate-500">
                          {metric.label === 'Engine' ? 'Type' : metric.label}
                        </p>
                        <p className={`text-[11px] font-semibold ${meterToneClass(metric.tone)}`}>{metric.value}</p>
                        {metric.helperText && (
                          <p className="text-[9px] leading-tight text-slate-500">{metric.helperText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-1.5">
                  {rewards.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {rewards.map((reward) => (
                        <span
                          key={`${reward.resourceId}-${reward.amountFormula}`}
                          className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[9px]"
                        >
                          <span className="font-semibold text-amber-200">{reward.resourceId}</span>{' '}
                          <span className="text-[10px] font-mono text-slate-200">{reward.amountFormula}</span>
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
              <div
                className="flex items-center gap-3 md:flex-col md:items-start md:justify-start"
                title={riskTooltip}
              >
                <div className="text-[9px] uppercase tracking-[0.18em] text-slate-400">Risk</div>
                <div className="flex h-20 w-6 flex-col overflow-hidden rounded-full border border-white/10">
                  <div className="bg-rose-500" style={{ height: `${riskDeath}%` }} />
                  <div className="bg-amber-400" style={{ height: `${riskInjuryOnly}%` }} />
                  <div className="flex-1 bg-emerald-500/20" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
};

export default ActivityCardDetail;
