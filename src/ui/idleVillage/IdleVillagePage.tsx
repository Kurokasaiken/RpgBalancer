/**
 * Minimal Idle Village Game UI (Cultist Simulator-style lanes + drag&drop)
 * This is a barebones prototype to allow testing the time+activity+job+quest engines.
 * Uses the Gilded Observatory theme and follows config-first principles.
 */

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
  type ChangeEvent,
} from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { Pause, Play, Briefcase, ScrollText } from 'lucide-react';
import idleVillageMap from '@/assets/ui/idleVillage/idle-village-map.jpg';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { createVillageStateFromConfig, scheduleActivity } from '@/engine/game/idleVillage/TimeEngine';
import type {
  VillageState,
  ResidentState,
  ScheduledActivity,
  VillageEvent,
} from '@/engine/game/idleVillage/TimeEngine';
import { tickIdleVillage } from '@/engine/game/idleVillage/IdleVillageEngine';
import type { ActivityDefinition, FounderPreset } from '@/balancing/config/idleVillage/types';
import { buyFoodWithGold } from '@/engine/game/idleVillage/MarketEngine';
import VerbCard, { type VerbTone } from '@/ui/idleVillage/VerbCard';
import {
  DEFAULT_SECONDS_PER_TIME_UNIT,
  buildCompletedVerbSummary,
  buildQuestOfferSummary,
  buildScheduledVerbSummary,
  buildSystemVerbSummary,
  type VerbSummary,
} from '@/ui/idleVillage/verbSummaries';

// Minimal deterministic RNG for reproducible testing
const simpleRng = (() => {
  let seed = 12345;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
})();

const HUNGER_FX_KEYFRAMES = `
@keyframes idleVillageHungerFlight {
  0% {
    transform: translate3d(-40px, 10px, 0);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate3d(40px, -18px, 0);
    opacity: 0;
  }
}
@keyframes verbResourceEject {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate3d(72px, -48px, 0) scale(0.65);
    opacity: 0;
  }
}
@keyframes verbResourceAttract {
  0% {
    transform: translate3d(-56px, 48px, 0) scale(0.6);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 1;
  }
}
`;

const DEFAULT_VERB_TONE_COLORS: Record<VerbTone, string> = {
  neutral: '#94A3B8',
  job: '#3B82F6',
  quest: '#34D399',
  danger: '#F87171',
  system: '#38BDF8',
};

const FOUNDER_STORAGE_KEY = 'idleVillagePreferredFounderId';

function getStoredFounderId(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(FOUNDER_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredFounderId(founderId: string | null) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (founderId) {
      window.localStorage.setItem(FOUNDER_STORAGE_KEY, founderId);
    } else {
      window.localStorage.removeItem(FOUNDER_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors for now
  }
}

function pickFounderPreset(
  config: ReturnType<typeof useIdleVillageConfig>['config'],
  preferredId?: string,
): FounderPreset | null {
  const founders = config?.founders ?? {};
  const founderValues = Object.values(founders);
  if (preferredId && founders[preferredId]) return founders[preferredId];
  const standard = founderValues.find((preset) => preset.difficultyTag === 'standard');
  return standard ?? founderValues[0] ?? null;
}

interface ResidentCardProps {
  resident: ResidentState;
  getFatigueColor: (fatigue: number) => string;
}

function ResidentCard({ resident, getFatigueColor }: ResidentCardProps) {
  const isAvailable = resident.status === 'available';

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `resident-${resident.id}`,
    data: { type: 'resident', residentId: resident.id },
    disabled: !isAvailable,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const cardClasses = [
    'default-card flex flex-col gap-0.5 cursor-grab active:cursor-grabbing transition-opacity px-1.5 py-1 max-w-[160px]',
    !isAvailable ? 'opacity-40 cursor-not-allowed' : '',
    isDragging ? 'opacity-0 pointer-events-none' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cardClasses}
    >
      <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-200">
        {resident.id}
      </div>
      <div
        className="h-1.5 w-24 sm:w-28 bg-slate-700 rounded overflow-hidden mt-1"
        title={`Fatigue: ${resident.fatigue}/100`}
      >
        <div
          className={getFatigueColor(resident.fatigue) + ' h-1.5 transition-all duration-200'}
          style={{ width: `${Math.min(100, Math.max(0, resident.fatigue))}%` }}
        />
      </div>
    </div>
  );
}

interface SummaryTokenEntry extends SummaryTokenProps {
  key: string;
}

interface SummaryTokenProps {
  label: string;
  icon?: ReactNode;
  tone?: VerbTone;
  subtitle?: string | null;
  meta?: string | null;
  toneColorMap?: Partial<Record<VerbTone, string>>;
  actionLabel?: string;
  onAction?: () => void;
}

function SummaryToken({
  label,
  icon,
  tone = 'neutral',
  subtitle,
  meta,
  toneColorMap,
  actionLabel,
  onAction,
}: SummaryTokenProps) {
  const toneColor = toneColorMap?.[tone] ?? DEFAULT_VERB_TONE_COLORS[tone];

  return (
    <div
      className="inline-flex items-center gap-2 rounded-2xl border px-3 py-1 bg-slate-950/75 text-[10px] uppercase tracking-[0.16em]"
      style={{ borderColor: toneColor }}
    >
      {icon && (
        <span aria-hidden className="text-xs" style={{ color: toneColor }}>
          {icon}
        </span>
      )}
      <div className="flex flex-col leading-tight">
        <span className="font-semibold text-ivory">{label}</span>
        {(subtitle || meta) && (
          <span className="text-[9px] text-slate-300 normal-case tracking-normal">
            {subtitle}
            {subtitle && meta ? ' · ' : ''}
            {meta && <span className="font-mono text-slate-200">{meta}</span>}
          </span>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="ml-1 rounded-full border border-amber-400/60 px-2 py-0.5 text-[9px] text-amber-200 hover:bg-amber-400/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

interface MapSlotVerbClusterProps {
  slot: { id: string; label: string; icon?: string };
  left: number;
  top: number;
  verbs: VerbSummary[];
  questOffers: VerbSummary[];
  onSelect: () => void;
  isSelected: boolean;
}

function MapSlotVerbCluster({ slot, left, top, verbs, questOffers, onSelect, isSelected }: MapSlotVerbClusterProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slot.id}`,
    data: { type: 'mapSlot', slotId: slot.id },
  });

  const dropState = isOver ? 'valid' : 'idle';
  const hasContent = verbs.length > 0 || questOffers.length > 0;
  const renderSummaryCard = (summary: VerbSummary) => (
    <VerbCard
      key={summary.key}
      icon={summary.icon}
      progressFraction={summary.progressFraction}
      elapsedSeconds={summary.elapsedSeconds}
      totalDuration={summary.totalDurationSeconds}
      injuryPercentage={summary.injuryPercentage}
      deathPercentage={summary.deathPercentage}
      assignedCount={summary.assignedCount}
      totalSlots={summary.totalSlots}
      isInteractive
      dropState={dropState}
      onClick={onSelect}
      visualVariant={summary.visualVariant}
      progressStyle={summary.progressStyle}
      className="scale-[0.62] origin-top"
    />
  );

  return (
    <div
      ref={setNodeRef}
      className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center gap-2 pointer-events-auto"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <button
        type="button"
        onClick={onSelect}
        className={[
          'rounded-3xl border border-slate-900/70 bg-black/40 px-3 py-2 transition-all duration-200',
          isSelected || isOver ? 'ring-2 ring-amber-300/60 shadow-[0_0_25px_rgba(251,191,36,0.35)]' : 'ring-1 ring-slate-900/50',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex flex-col items-center gap-2">
          {(hasContent
            ? verbs.map((verb) => (
                renderSummaryCard(verb)
              ))
            : [
                <div
                  key="placeholder"
                  className="flex flex-col items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-300 px-4 py-3"
                >
                  <span className="text-base">{slot.icon ?? '⌀'}</span>
                  <span>{slot.label}</span>
                </div>,
              ])}
          {questOffers.map((offer) => renderSummaryCard(offer))}
        </div>
      </button>
      <div className="text-[10px] uppercase tracking-[0.2em] text-amber-100 drop-shadow">{slot.label}</div>
    </div>
  );
}

interface DayCycleRingProps {
  totalSegments: number;
  filledSegments: number;
  isNight: boolean;
}

function DayCycleRing({ totalSegments, filledSegments, isNight }: DayCycleRingProps) {
  const clampedTotal = Math.max(1, totalSegments);
  const clampedFilled = Math.max(0, Math.min(clampedTotal, filledSegments));
  const segmentSize = 100 / clampedTotal;

  const stops: string[] = [];
  for (let i = 0; i < clampedTotal; i += 1) {
    const start = i * segmentSize;
    const end = (i + 1) * segmentSize;
    const color =
      i < clampedFilled
        ? isNight
          ? 'rgba(129, 140, 248, 1)'
          : 'rgba(45, 212, 191, 1)'
        : 'rgba(15, 23, 42, 0.85)';
    stops.push(`${color} ${start}% ${end}%`);
  }

  const backgroundImage = `conic-gradient(${stops.join(', ')})`;

  return (
    <div
      className="relative w-8 h-8 rounded-full border border-gold/60 shadow-inner bg-slate-950 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage }}
      />
      <div className="absolute inset-1.5 rounded-full bg-black/90 border border-slate-800 flex items-center justify-center text-[10px] text-slate-200">
        {isNight ? '☾' : '☼'}
      </div>
    </div>
  );
}

export default function IdleVillagePage() {
  const { config } = useIdleVillageConfig();
  const [preferredFounderId, setPreferredFounderId] = useState<string | null>(() => getStoredFounderId());

  const founderOptions = useMemo(() => Object.values(config?.founders ?? {}), [config?.founders]);

  useEffect(() => {
    if (!config) return;
    if (preferredFounderId && !config.founders?.[preferredFounderId]) {
      setPreferredFounderId(null);
      setStoredFounderId(null);
    }
  }, [config, preferredFounderId]);

  const selectedFounder = useMemo(
    () => pickFounderPreset(config, preferredFounderId ?? undefined),
    [config, preferredFounderId],
  );

  const [villageState, setVillageState] = useState<VillageState>(() =>
    createVillageStateFromConfig({ config, founderPreset: selectedFounder }),
  );
  const lastFounderIdRef = useRef<string | null>(selectedFounder?.id ?? null);

  useEffect(() => {
    if (!config) return;
    const newFounderId = selectedFounder?.id ?? null;
    if (lastFounderIdRef.current === newFounderId) return;
    lastFounderIdRef.current = newFounderId;
    setVillageState(createVillageStateFromConfig({ config, founderPreset: selectedFounder }));
  }, [config, selectedFounder]);
  const [activeResidentId, setActiveResidentId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [resourceDeltas, setResourceDeltas] = useState<Record<string, number>>({});
  const resourceDeltaTimeoutRef = useRef<number | null>(null);
  const [showJobsAndQuests, setShowJobsAndQuests] = useState(true);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [marketUnits, setMarketUnits] = useState(0);
  const [lastHungerEventId, setLastHungerEventId] = useState<number | null>(null);
  const [hungerFx, setHungerFx] = useState<{ amount: number; id: number } | null>(null);
  const [lastInjuryEventId, setLastInjuryEventId] = useState<number | null>(null);
  const [completedVerbs, setCompletedVerbs] = useState<VerbSummary[]>([]);

  const handleFounderChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const nextId = event.target.value || null;
      setPreferredFounderId(nextId);
      setStoredFounderId(nextId);
    },
    [],
  );

  const secondsPerTimeUnit = config?.globalRules.secondsPerTimeUnit ?? DEFAULT_SECONDS_PER_TIME_UNIT;
  const dayLengthSetting = config?.globalRules.dayLengthInTimeUnits || 5;

  const verbToneColors = useMemo<Record<VerbTone, string>>(() => {
    const overrides = config.globalRules.verbToneColors ?? {};
    return {
      neutral: overrides.neutral ?? DEFAULT_VERB_TONE_COLORS.neutral,
      job: overrides.job ?? DEFAULT_VERB_TONE_COLORS.job,
      quest: overrides.quest ?? DEFAULT_VERB_TONE_COLORS.quest,
      danger: overrides.danger ?? DEFAULT_VERB_TONE_COLORS.danger,
      system: overrides.system ?? DEFAULT_VERB_TONE_COLORS.system,
    };
  }, [config.globalRules.verbToneColors]);

  const getResourceLabel = useCallback(
    (resourceId: string) => {
      if (!config) return resourceId;
      const def = config.resources?.[resourceId];
      return def?.label ?? resourceId;
    },
    [config],
  );

  // Schedule an activity (drag&drop simulation via button for now)
  const handleSchedule = useCallback(
    (activityId: string, residentId?: string, explicitSlotId?: string) => {
      if (!config) return;
      const availableResidents = Object.values(villageState.residents).filter(
        (r) => r.status === 'available',
      );
      const chosenResidentId = residentId ?? availableResidents[0]?.id;
      if (!chosenResidentId) {
        console.warn('No available resident to assign to activity');
        return;
      }

      const activityDef = config.activities[activityId] as ActivityDefinition | undefined;
      if (!activityDef) {
        console.warn('Activity not found in config:', activityId);
        return;
      }

      let slotId: string | undefined = explicitSlotId;
      const meta = (activityDef.metadata ?? {}) as { mapSlotId?: string } | undefined;

      if (!slotId && selectedSlotId) {
        slotId = selectedSlotId;
      } else if (!slotId && meta?.mapSlotId) {
        slotId = meta.mapSlotId;
      } else if (!slotId) {
        const allSlots = Object.values(config.mapSlots ?? {});
        const compatible = allSlots.find((slot) =>
          slot.slotTags?.some((tag: string) => activityDef.slotTags.includes(tag)),
        );
        slotId = compatible?.id;
      }

      if (!slotId) {
        console.warn('No suitable map slot found for activity', activityId);
        return;
      }

      try {
        const result = scheduleActivity(
          { config, rng: simpleRng },
          villageState,
          { activityId, characterIds: [chosenResidentId], slotId },
        );
        setVillageState(result.state);
      } catch (e) {
        console.error('Failed to schedule activity', e);
      }
    },
    [config, villageState, selectedSlotId]
  );

  const handleAssignResidentToSlot = useCallback(
    (slotId: string, residentId: string) => {
      if (!config) return;

      const slotDef = config.mapSlots[slotId];
      if (!slotDef) {
        console.warn('No map slot in config with id', slotId);
        return;
      }

      const allActivities = Object.values(config.activities ?? {}) as ActivityDefinition[];
      const candidates = allActivities.filter((activity) => {
        if (!activity.tags?.includes('job')) return false;
        const meta = (activity.metadata ?? {}) as { mapSlotId?: string } | undefined;
        if (meta?.mapSlotId && meta.mapSlotId !== slotId) return false;
        if (!activity.slotTags || activity.slotTags.length === 0) return false;
        const acceptsTag = activity.slotTags.some((tag) => slotDef.slotTags.includes(tag));
        return acceptsTag;
      });

      if (candidates.length === 0) {
        console.warn('No job activity configured for slot', slotId);
        return;
      }

      // Prefer continuous jobs first when multiple jobs exist for a slot.
      candidates.sort((a, b) => {
        const metaA = (a.metadata ?? {}) as { continuousJob?: boolean } | undefined;
        const metaB = (b.metadata ?? {}) as { continuousJob?: boolean } | undefined;
        const aCont = metaA?.continuousJob ? 1 : 0;
        const bCont = metaB?.continuousJob ? 1 : 0;
        return bCont - aCont;
      });

      const chosen = candidates[0];
      handleSchedule(chosen.id, residentId, slotId);
    },
    [config, handleSchedule],
  );

  const advanceTimeBy = useCallback(
    (delta: number) => {
      if (!config) return;
      let shouldOpenMarket = false;
      const newlyCompletedVerbs: VerbSummary[] = [];
      setVillageState((prev) => {
        const result = tickIdleVillage({ config, rng: simpleRng }, prev, delta);
        let nextState = result.state;

        if (result.completedJobs.length > 0) {
          for (const job of result.completedJobs) {
            const activity = config.activities[job.activityId] as ActivityDefinition | undefined;
            if (!activity) continue;

            const jobMeta = (activity.metadata ?? {}) as { marketJob?: boolean } | undefined;
            if (jobMeta?.marketJob) {
              shouldOpenMarket = true;
            }

            const metadata = (activity.metadata ?? {}) as { supportsAutoRepeat?: boolean; continuousJob?: boolean };
            const isContinuous = !!metadata.continuousJob;
            const supportsAuto = !!metadata.supportsAutoRepeat;
            const isAutoOn = isContinuous || supportsAuto;
            const scheduled = nextState.activities[job.scheduledId];
            if (scheduled) {
              const assignedNames = scheduled.characterIds.map(
                (cid) => nextState.residents[cid]?.id ?? cid,
              );

              const completedSummary = buildCompletedVerbSummary({
                scheduled,
                activity,
                rewards: job.rewards ?? [],
                resourceLabeler: getResourceLabel,
                secondsPerTimeUnit,
                assigneeNames: assignedNames,
              });
              newlyCompletedVerbs.push(completedSummary);

              if (isAutoOn) {
                const schedResult = scheduleActivity(
                  { config, rng: simpleRng },
                  nextState,
                  {
                    activityId: scheduled.activityId,
                    characterIds: [...scheduled.characterIds],
                    slotId: scheduled.slotId,
                  },
                );
                nextState = schedResult.state;
              }
            }
          }
        }

        if (result.completedQuests.length > 0) {
          for (const quest of result.completedQuests) {
            const activity = config.activities[quest.activityId] as ActivityDefinition | undefined;
            if (!activity) continue;

            const scheduled = nextState.activities[quest.scheduledId];
            if (!scheduled) continue;

            const assignedNames = scheduled.characterIds.map(
              (cid) => nextState.residents[cid]?.id ?? cid,
            );

            const completedSummary = buildCompletedVerbSummary({
              scheduled,
              activity,
              rewards: quest.rewards ?? [],
              resourceLabeler: getResourceLabel,
              secondsPerTimeUnit,
              assigneeNames: assignedNames,
            });
            newlyCompletedVerbs.push(completedSummary);
          }
        }

        // Compute per-resource delta for this tick (to drive +X overlays)
        const diffs: Record<string, number> = {};
        const allResourceIds = new Set([
          ...Object.keys(prev.resources ?? {}),
          ...Object.keys(nextState.resources ?? {}),
        ]);
        allResourceIds.forEach((id) => {
          const before = prev.resources[id] ?? 0;
          const after = nextState.resources[id] ?? 0;
          const deltaVal = after - before;
          if (deltaVal !== 0) {
            diffs[id] = (diffs[id] ?? 0) + deltaVal;
          }
        });

        if (Object.keys(diffs).length > 0) {
          setResourceDeltas(diffs);
          if (resourceDeltaTimeoutRef.current !== null) {
            window.clearTimeout(resourceDeltaTimeoutRef.current);
          }
          resourceDeltaTimeoutRef.current = window.setTimeout(() => {
            setResourceDeltas({});
          }, 600);
        }

        // Detect new system events to drive Hunger/Injury verb FX.
        const prevEvents = prev.eventLog ?? [];
        const nextEvents = nextState.eventLog ?? [];
        if (nextEvents.length > prevEvents.length) {
          const newEvents = nextEvents.slice(prevEvents.length) as VillageEvent[];

          const hungerEvents = newEvents.filter((e) => e.type === 'food_consumed_daily');
          if (hungerEvents.length > 0) {
            const total = hungerEvents.reduce((sum, e) => {
              const payload = e.payload as { amount?: unknown };
              const amount = typeof payload.amount === 'number' ? payload.amount : 0;
              return sum + amount;
            }, 0);
            if (total > 0) {
              const eventId = Date.now();
              setLastHungerEventId(eventId);
              setHungerFx({ amount: total, id: eventId });
            }
          }

          const injuryEvents = newEvents.filter((e) => e.type === 'injury_applied');
          if (injuryEvents.length > 0) {
            const eventId = Date.now();
            setLastInjuryEventId(eventId);
          }
        }

        return nextState;
      });
      if (shouldOpenMarket) {
        setShowMarketModal(true);
      }
      if (newlyCompletedVerbs.length > 0) {
        setCompletedVerbs((prev) => [...prev, ...newlyCompletedVerbs]);
      }
    },
    [config, getResourceLabel, secondsPerTimeUnit],
  );

  // Real-time ticking when playing
  useEffect(() => {
    if (!isPlaying || !config) return undefined;

    const tickMs = 1000;
    const id = window.setInterval(() => {
      advanceTimeBy(1);
    }, tickMs);

    return () => window.clearInterval(id);
  }, [isPlaying, config, advanceTimeBy]);

  // Spacebar hotkey to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.key !== ' ') return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return;

      event.preventDefault();
      setIsPlaying((prev) => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Auto-clear Hunger FX overlay after a short animation window.
  useEffect(() => {
    if (!hungerFx) return;
    const timeoutId = window.setTimeout(() => {
      setHungerFx((current) => (current && current.id === hungerFx.id ? null : current));
    }, 800);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hungerFx]);

  const handleCollectVerb = useCallback((key: string) => {
    setCompletedVerbs((prev) => prev.filter((v) => v.key !== key));
  }, []);

  interface QuestOfferDropTargetProps {
    offerId: string;
    children: ReactNode;
  }

  function QuestOfferDropTarget({ offerId, children }: QuestOfferDropTargetProps) {
    const { setNodeRef, isOver } = useDroppable({
      id: `quest-offer-${offerId}`,
      data: { type: 'questOffer', offerId },
    });

    const wrapperClass = isOver
      ? 'ring-1 ring-amber-300 rounded-md transition-shadow duration-150'
      : undefined;

    return (
      <div ref={setNodeRef} className={wrapperClass}>
        {children}
      </div>
    );
  }

  const handleAcceptQuestOffer = useCallback(
    (offerId: string, residentId?: string) => {
      if (!config) return;
      setVillageState((prev) => {
        const offer = prev.questOffers?.[offerId];
        if (!offer) return prev;

        const availableResidents = Object.values(prev.residents).filter(
          (r) => r.status === 'available',
        );
        const chosenResidentId = residentId ?? availableResidents[0]?.id;
        if (!chosenResidentId) {
          return prev;
        }

        let resultState: VillageState = prev;
        try {
          const result = scheduleActivity(
            { config, rng: simpleRng },
            prev,
            {
              activityId: offer.activityId,
              characterIds: [chosenResidentId],
              slotId: offer.slotId,
            },
          );
          resultState = result.state;
        } catch {
          // Scheduling failed; keep previous state.
          return prev;
        }

        const nextOffers = { ...(resultState.questOffers ?? {}) };
        delete nextOffers[offerId];

        return {
          ...resultState,
          questOffers: nextOffers,
        };
      });
    },
    [config],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeType = active.data.current?.type;
    const residentId = active.data.current?.residentId as string | undefined;

    if (activeType === 'resident' && residentId) {
      setActiveResidentId(residentId);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveResidentId(null);
      if (!over) return;

      const activeType = active.data.current?.type;
      const overType = over.data.current?.type;
      const residentId = active.data.current?.residentId as string | undefined;

      if (activeType === 'resident' && residentId) {
        if (overType === 'mapSlot') {
          const slotId = over.data.current?.slotId as string | undefined;
          if (slotId) {
            handleAssignResidentToSlot(slotId, residentId);
          }
        } else if (overType === 'questOffer') {
          const offerId = over.data.current?.offerId as string | undefined;
          if (offerId) {
            handleAcceptQuestOffer(offerId, residentId);
          }
        } else {
          const activityId = over.data.current?.activityId as string | undefined;
          if (activityId) {
            handleSchedule(activityId, residentId);
          }
        }
      }
    },
    [handleAssignResidentToSlot, handleSchedule, handleAcceptQuestOffer],
  );

  // Simple activity list from config (used for per-location descriptions)
  const mapSlots = useMemo(() => {
    if (!config) {
      return [] as {
        id: string;
        x: number;
        y: number;
        slotTags: string[];
        label: string;
        icon?: string;
        colorClass?: string;
      }[];
    }
    return Object.values(config.mapSlots ?? {}) as {
      id: string;
      x: number;
      y: number;
      slotTags: string[];
      label: string;
      icon?: string;
      colorClass?: string;
    }[];
  }, [config]);

  const mapSlotLayout = useMemo(() => {
    if (mapSlots.length === 0) return [] as { slot: (typeof mapSlots)[number]; left: number; top: number }[];
    return mapSlots.map((slot) => {
      // x/y are treated as logical coordinates on a 0-10 grid and converted to percentages.
      const normX = slot.x / 10;
      const normY = slot.y / 10;
      // Keep markers within a comfortable frame over the map background and away from the bottom jobs panel.
      const left = 8 + normX * 80;
      const top = 12 + normY * 55;
      return { slot, left, top };
    });
  }, [mapSlots]);

  const questOffers = useMemo(() => Object.values(villageState.questOffers ?? {}), [villageState.questOffers]);

  const activeActivities = useMemo(() => {
    const all = Object.values(villageState.activities) as ScheduledActivity[];
    return all
      .filter((activity) => activity.status === 'pending' || activity.status === 'running')
      .sort((a, b) => {
        if (a.endTime === b.endTime) return a.startTime - b.startTime;
        return a.endTime - b.endTime;
      });
  }, [villageState.activities]);

  const scheduledVerbSummaries = useMemo(() => {
    if (!config) return [] as VerbSummary[];
    return activeActivities
      .map((scheduled) => {
        const activity = config.activities[scheduled.activityId] as ActivityDefinition | undefined;
        if (!activity) return null;
        const slotIcon = scheduled.slotId ? config.mapSlots?.[scheduled.slotId]?.icon : undefined;
        const assigneeNames = scheduled.characterIds.map(
          (cid) => villageState.residents[cid]?.id ?? cid,
        );
        return buildScheduledVerbSummary({
          scheduled,
          activity,
          slotIcon,
          resourceLabeler: getResourceLabel,
          currentTime: villageState.currentTime,
          secondsPerTimeUnit,
          dayLength: dayLengthSetting,
          assigneeNames,
        });
      })
      .filter(Boolean) as VerbSummary[];
  }, [
    config,
    activeActivities,
    getResourceLabel,
    villageState.currentTime,
    villageState.residents,
    secondsPerTimeUnit,
    dayLengthSetting,
  ]);

  const questOfferSummaries = useMemo(() => {
    if (!config) return [] as VerbSummary[];
    return questOffers
      .map((offer) => {
        const activity = config.activities[offer.activityId] as ActivityDefinition | undefined;
        if (!activity) return null;
        const slotIcon = config.mapSlots?.[offer.slotId]?.icon;
        return buildQuestOfferSummary({
          offer,
          activity,
          slotIcon,
          resourceLabeler: getResourceLabel,
          currentTime: villageState.currentTime,
          secondsPerTimeUnit,
          dayLength: dayLengthSetting,
        });
      })
      .filter(Boolean) as VerbSummary[];
  }, [config, questOffers, getResourceLabel, villageState.currentTime, secondsPerTimeUnit, dayLengthSetting]);

  const verbsBySlot = useMemo(() => {
    const grouped: Record<string, VerbSummary[]> = {};
    scheduledVerbSummaries.forEach((summary) => {
      if (!summary.slotId) return;
      if (!grouped[summary.slotId]) grouped[summary.slotId] = [];
      grouped[summary.slotId].push(summary);
    });
    return grouped;
  }, [scheduledVerbSummaries]);

  const questOffersBySlot = useMemo(() => {
    const grouped: Record<string, VerbSummary[]> = {};
    questOfferSummaries.forEach((summary) => {
      if (!summary.slotId) return;
      if (!grouped[summary.slotId]) grouped[summary.slotId] = [];
      grouped[summary.slotId].push(summary);
    });
    return grouped;
  }, [questOfferSummaries]);

  const activeJobsCount = useMemo(
    () => scheduledVerbSummaries.filter((summary) => summary.isJob).length,
    [scheduledVerbSummaries],
  );

  const activeQuestsCount = useMemo(
    () => scheduledVerbSummaries.filter((summary) => summary.isQuest).length,
    [scheduledVerbSummaries],
  );
  const livingResidentsCount = useMemo(
    () => Object.values(villageState.residents).filter((r) => r.status !== 'dead').length,
    [villageState.residents],
  );
  const injuredResidents = useMemo(
    () => Object.values(villageState.residents).filter((r) => r.status === 'injured'),
    [villageState.residents],
  );
  const systemVerbSummaries = useMemo(() => {
    if (!config) return [] as VerbSummary[];
    const durationUnits = dayLengthSetting || 1;
    const cycleSeconds = Math.max(1, durationUnits) * secondsPerTimeUnit;

    const { injuryProgressFraction, injuryDeadlineLabel } = (() => {
      if (injuredResidents.length === 0) return { injuryProgressFraction: 0, injuryDeadlineLabel: null as string | null };
      const soonest = injuredResidents.reduce((best, resident) => {
        if (typeof resident.injuryRecoveryTime !== 'number') return best;
        if (!best || (typeof best.injuryRecoveryTime === 'number' && resident.injuryRecoveryTime < best.injuryRecoveryTime)) {
          return resident;
        }
        return best;
      }, null as ResidentState | null);

      if (!soonest || typeof soonest.injuryRecoveryTime !== 'number') {
        return { injuryProgressFraction: 0, injuryDeadlineLabel: null };
      }

      const recoveryTime = soonest.injuryRecoveryTime;
      const approxStart = recoveryTime - durationUnits;
      const elapsed = villageState.currentTime - approxStart;
      const progress = Math.max(0, Math.min(1, elapsed / durationUnits));

      const remaining = Math.max(0, recoveryTime - villageState.currentTime);
      let deadline: string | null = null;
      if (remaining > 0) {
        if (remaining >= durationUnits) {
          const days = Math.floor(remaining / durationUnits);
          deadline = `${days}d to recover`;
        } else {
          deadline = `${remaining}u to recover`;
        }
      } else {
        deadline = 'Recovering soon';
      }

      return { injuryProgressFraction: progress, injuryDeadlineLabel: deadline };
    })();

    const foodPerResidentPerDay = config.globalRules.foodConsumptionPerResidentPerDay;
    const dailyFoodUpkeep = livingResidentsCount * foodPerResidentPerDay;
    const hungerProgressFraction =
      dayLengthSetting > 0 ? (villageState.currentTime % dayLengthSetting) / dayLengthSetting : 0;

    const summaries: VerbSummary[] = [];

    if (foodPerResidentPerDay > 0 && livingResidentsCount > 0) {
      const hungerIcon = config.resources?.food?.icon ? (
        <span aria-hidden className="text-xs">{config.resources.food.icon}</span>
      ) : (
        <span aria-hidden className="text-xs">🍖</span>
      );
      summaries.push(
        buildSystemVerbSummary({
          key: lastHungerEventId ? `system-hunger-${lastHungerEventId}` : 'system-hunger',
          label: `${getResourceLabel('food')} Hunger`,
          icon: hungerIcon,
          kindLabel: 'Upkeep',
          tone: 'system',
          progressFraction: hungerProgressFraction,
          elapsedSeconds: hungerProgressFraction * cycleSeconds,
          totalDurationSeconds: cycleSeconds,
          rewardLabel: dailyFoodUpkeep > 0 ? `-${dailyFoodUpkeep} / day` : null,
          deadlineLabel: null,
          notes: livingResidentsCount > 0 ? `Feeding ${livingResidentsCount} workers` : null,
        }),
      );
    }

    if (injuredResidents.length > 0) {
      summaries.push(
        buildSystemVerbSummary({
          key: lastInjuryEventId ? `system-injury-${lastInjuryEventId}` : 'system-injury',
          label: 'Injury Ward',
          icon: <span aria-hidden className="text-xs">🩹</span>,
          kindLabel: 'Care',
          tone: 'danger',
          progressFraction: injuryProgressFraction,
          elapsedSeconds: injuryProgressFraction * cycleSeconds,
          totalDurationSeconds: cycleSeconds,
          rewardLabel: null,
          deadlineLabel: injuryDeadlineLabel,
          notes: injuredResidents.map((resident) => resident.id).join(', ') || null,
        }),
      );
    }

    return summaries;
  }, [
    config,
    dayLengthSetting,
    secondsPerTimeUnit,
    villageState.currentTime,
    livingResidentsCount,
    injuredResidents,
    lastHungerEventId,
    lastInjuryEventId,
    getResourceLabel,
  ]);

  const goldAmount = villageState.resources.gold ?? 0;
  const foodAmount = villageState.resources.food ?? 0;
  const foodPrice = config?.globalRules.baseFoodPriceInGold ?? 0;
  const maxAffordableFood = foodPrice > 0 ? Math.floor(goldAmount / foodPrice) : 0;

  useEffect(() => {
    if (showMarketModal) {
      if (maxAffordableFood <= 0) {
        setMarketUnits(0);
      } else if (marketUnits <= 0 || marketUnits > maxAffordableFood) {
        setMarketUnits(Math.min(5, maxAffordableFood));
      }
    }
  }, [showMarketModal, maxAffordableFood, marketUnits]);

  // Render
  if (!config) {
    return <div className="p-4 text-ivory">Loading Idle Village config...</div>;
  }

  const { fatigueYellowThreshold, fatigueRedThreshold } = config.globalRules;

  const getFatigueColor = (fatigue: number) => {
    if (fatigue >= fatigueRedThreshold) return 'bg-red-600';
    if (fatigue >= fatigueYellowThreshold) return 'bg-amber-400';
    return 'bg-emerald-500';
  };

  const resourceDefinitions = config.resources ?? {};

  // Day/night segmentation based on config-global day length
  const dayLength = dayLengthSetting;
  const currentTime = villageState.currentTime;
  const currentDayIndex = dayLength > 0 ? Math.floor(currentTime / dayLength) : 0;
  const currentDayNumber = currentDayIndex + 1;
  const currentSegmentIndex = dayLength > 0 ? currentTime % dayLength : 0;
  const isNightSegment = dayLength > 0 && currentSegmentIndex === dayLength - 1;

  // Hunger / daily food upkeep verb support (data already computed above)

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <style>{HUNGER_FX_KEYFRAMES}</style>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#020617_0,#020617_55%,#000000_100%)] text-ivory flex items-center">
        <section className="relative w-full aspect-video">
          {/* Map background filling the whole main content area */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${idleVillageMap})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="absolute inset-0 bg-obsidian/45" aria-hidden="true" />

          {/* Map slot markers (jobs/quests) layered over the map */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {mapSlotLayout.map(({ slot, left, top }) => {
              const slotVerbs = verbsBySlot[slot.id] ?? [];
              const slotOffers = questOffersBySlot[slot.id] ?? [];
              return (
                <MapSlotVerbCluster
                  key={slot.id}
                  slot={{ id: slot.id, label: slot.label, icon: slot.icon }}
                  left={left}
                  top={top}
                  verbs={slotVerbs}
                  questOffers={slotOffers}
                  onSelect={() => setSelectedSlotId(slot.id)}
                  isSelected={selectedSlotId === slot.id}
                />
              );
            })}
          </div>

          {/* Foreground content stacked on top of the map */}
          <div className="relative z-20 flex flex-col h-full">
            {/* Top overlay: time/resources + events row, residents below */}
            <div className="p-4">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
                {/* Compact time/resources + day/night ring and transport controls */}
                <div className="inline-flex flex-wrap items-center gap-3 rounded-full bg-black/80 border border-gold/40 shadow-md px-3 py-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setIsPlaying((prev) => !prev)}
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900/90 border border-slate-600 text-ivory hover:bg-slate-800"
                    title="Spacebar: play/pause"
                  >
                    {isPlaying ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <DayCycleRing
                      totalSegments={dayLength}
                      filledSegments={currentSegmentIndex + 1}
                      isNight={isNightSegment}
                    />
                    <div className="flex flex-col leading-tight min-w-[72px]">
                      <span className="uppercase tracking-[0.18em] text-ivory">
                        Day
                        {' '}
                        {currentDayNumber}
                      </span>
                      <span className="text-[9px] text-slate-300">
                        t=
                        {villageState.currentTime}
                      </span>
                    </div>
                  </div>
                  <span className="mx-1 h-3 w-px bg-slate-600/80" aria-hidden="true" />
                  {founderOptions.length > 0 && (
                    <label className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                      Founder
                      <select
                        value={preferredFounderId ?? selectedFounder?.id ?? ''}
                        onChange={handleFounderChange}
                        className="bg-slate-900/90 border border-slate-700 text-ivory px-1 py-0.5 rounded text-[10px] tracking-[0.12em]"
                      >
                        {founderOptions.map((founder) => (
                          <option key={founder.id} value={founder.id}>
                            {founder.label} ({founder.difficultyTag})
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 max-w-xs relative">
                    {Object.entries(villageState.resources).map(([id, value]) => {
                      const def = resourceDefinitions[id];
                      const colorClass = def?.colorClass ?? 'text-amber-200';
                      const delta = resourceDeltas[id] ?? 0;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-950/85 text-[10px] tracking-[0.12em] text-ivory border border-slate-700/80 shadow-sm"
                        >
                          {def?.icon && (
                            <span aria-hidden className="text-xs">
                              {def.icon}
                            </span>
                          )}
                          <span className={`font-semibold ${colorClass}`}>
                            {getResourceLabel(id)}
                          </span>
                          <span className="font-mono text-slate-100 text-[10px]">
                            {value}
                          </span>
                          {delta !== 0 && (
                            <span
                              className={`ml-1 font-mono text-[9px] ${
                                delta > 0 ? 'text-emerald-300' : 'text-red-300'
                              }`}
                            >
                              {delta > 0 ? `+${delta}` : `${delta}`}
                            </span>
                          )}
                        </span>
                      );
                    })}
                    {Object.keys(villageState.resources).length === 0 && (
                      <span className="text-[10px] text-slate-300">No resources yet</span>
                    )}
                    {hungerFx && (
                      <div
                        key={hungerFx.id}
                        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 flex items-center text-[9px] font-mono text-red-300"
                        style={{ animation: 'idleVillageHungerFlight 0.75s ease-out forwards' }}
                      >
                        <span className="mr-0.5 text-xs" aria-hidden>
                          {resourceDefinitions.food?.icon ?? '🍖'}
                        </span>
                        <span>
                          -
                          {hungerFx.amount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Events panel (aligned to the right of the bar) */}
                <div className="mt-3 lg:mt-0 w-full lg:w-1/2 max-w-md">
                  <DefaultSection
                    title="Jobs & Quests in progress"
                    actions={(
                      <button
                        type="button"
                        className="flex items-center justify-center w-4 h-4 rounded text-slate-400 hover:text-amber-200"
                        title={showJobsAndQuests ? 'Nascondi lista' : 'Mostra lista'}
                        onClick={() => setShowJobsAndQuests((prev) => !prev)}
                      >
                        <Eye className="w-3 h-3" />
                        <span className="sr-only">Toggle Jobs and Quests visibility</span>
                      </button>
                    )}
                  >
                    {showJobsAndQuests && (
                      <>
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-slate-300">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700">
                            <Briefcase className="w-3 h-3 text-teal-300" />
                            <span>Jobs: {activeJobsCount}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700">
                            <ScrollText className="w-3 h-3 text-amber-300" />
                            <span>Quests: {activeQuestsCount}</span>
                          </span>
                        </div>
                        {systemVerbSummaries.length > 0 && (
                          <div className="mb-1.5 space-y-1">
                            {systemVerbSummaries.map((summary) => (
                              <VerbSummaryRow
                                key={summary.key}
                                summary={summary}
                                toneColorMap={verbToneColors}
                              />
                            ))}
                          </div>
                        )}
                        {questOffers.length > 0 && (
                          <div className="mb-1.5 space-y-1">
                            {questOfferSummaries.map((summary) => {
                              const offerId = summary.offer?.id;
                              if (!offerId) return null;
                              return (
                                <QuestOfferDropTarget key={summary.key} offerId={offerId}>
                                  <VerbSummaryRow
                                    summary={summary}
                                    primaryActionLabel="Accept"
                                    onPrimaryAction={() => handleAcceptQuestOffer(offerId)}
                                    toneColorMap={verbToneColors}
                                  />
                                </QuestOfferDropTarget>
                              );
                            })}
                          </div>
                        )}
                        {completedVerbs.length > 0 && (
                          <div className="mb-1.5 space-y-1">
                            {completedVerbs.map((verb) => (
                              <VerbSummaryRow
                                key={verb.key}
                                summary={verb}
                                primaryActionLabel="Collect"
                                onPrimaryAction={() => handleCollectVerb(verb.key)}
                                toneColorMap={verbToneColors}
                              />
                            ))}
                          </div>
                        )}
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-[10px]">
                          {scheduledVerbSummaries.length > 0 ? (
                            scheduledVerbSummaries.map((summary) => (
                              <VerbSummaryRow
                                key={summary.key}
                                summary={summary}
                                toneColorMap={verbToneColors}
                              />
                            ))
                          ) : (
                            <p className="text-[10px] text-slate-400">No active events.</p>
                          )}
                        </div>
                      </>
                    )}
                  </DefaultSection>
                </div>
              </div>

              {/* Residents list under the bar */}
              <div className="mt-4 space-y-2 pr-1 max-w-xs">
                {Object.values(villageState.residents).map((r) => (
                  <ResidentCard
                    key={r.id}
                    resident={r}
                    getFatigueColor={getFatigueColor}
                  />
                ))}
                {Object.values(villageState.residents).length === 0 && (
                  <p className="text-xs text-slate-300">No residents defined yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {showMarketModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="default-card w-80 max-w-sm p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-700/70 pb-2">
              <h3 className="text-sm font-cinzel tracking-[0.2em] uppercase text-ivory">Village Market</h3>
              <button
                type="button"
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
                onClick={() => setShowMarketModal(false)}
              >
                Close
              </button>
            </div>
            <p className="text-[11px] text-slate-300">
              Trade gold for food at the base price configured in Idle Village rules.
            </p>
            <div className="text-[11px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300">Gold</span>
                <span className="font-mono text-amber-200">{goldAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Food</span>
                <span className="font-mono text-emerald-200">{foodAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Price per Food</span>
                <span className="font-mono text-slate-100">{foodPrice}</span>
              </div>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <label className="flex items-center justify-between gap-2">
                <span className="text-slate-300">Units to buy</span>
                <input
                  type="number"
                  min={0}
                  max={Math.max(0, maxAffordableFood)}
                  value={marketUnits}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parsed = raw === '' ? 0 : Number(raw);
                    if (!Number.isFinite(parsed) || parsed < 0) return;
                    setMarketUnits(parsed);
                  }}
                  className="w-20 px-2 py-0.5 bg-obsidian border border-slate rounded text-ivory text-[10px] font-mono text-right"
                />
              </label>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Max affordable</span>
                <span className="font-mono">{maxAffordableFood}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="px-3 py-1 rounded-full bg-slate-800 text-slate-200 text-[11px] hover:bg-slate-700"
                onClick={() => setShowMarketModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded-full bg-emerald-500 text-obsidian text-[11px] font-semibold tracking-[0.16em] uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400"
                disabled={marketUnits <= 0 || maxAffordableFood <= 0}
                onClick={() => {
                  const cappedUnits = Math.min(Math.floor(marketUnits), maxAffordableFood);
                  if (cappedUnits <= 0) return;
                  setVillageState((prev) => {
                    const result = buyFoodWithGold(config, prev.resources, { units: cappedUnits });
                    return {
                      ...prev,
                      resources: result.resources,
                    };
                  });
                  setShowMarketModal(false);
                }}
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      )}

      <DragOverlay>
        {activeResidentId && villageState.residents[activeResidentId] ? (
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-gold/70 shadow-lg flex items-center justify-center text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-100">
              {villageState.residents[activeResidentId].id.slice(0, 2)}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
