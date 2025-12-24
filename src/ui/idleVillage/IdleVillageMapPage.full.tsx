/**
 * Minimal Idle Village Game UI (Cultist Simulator-style lanes + drag&drop)
 * This is a barebones prototype to allow testing the time+activity+job+quest engines.
 * Uses the Gilded Observatory theme and follows config-first principles.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef, startTransition } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { Pause, Play } from 'lucide-react';
import idleVillageMap from '@/assets/ui/idleVillage/idle-village-map.jpg';
import { useVillageStateStore } from './useVillageStateStore';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { ToastContainer, useToast } from '../balancing/Toast';
import {
  createVillageStateFromConfig,
  scheduleActivity,
  buildResidentFromFounder,
} from '@/engine/game/idleVillage/TimeEngine';
import type {
  VillageState,
  ResidentState,
  ScheduledActivity,
  VillageEvent,
} from '@/engine/game/idleVillage/TimeEngine';
import { tickIdleVillage } from '@/engine/game/idleVillage/IdleVillageEngine';
import type { ActivityDefinition, FounderPreset, IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import { buyFoodWithGold } from '@/engine/game/idleVillage/MarketEngine';
import VerbCard from '@/ui/idleVillage/VerbCard';
import {
  DEFAULT_SECONDS_PER_TIME_UNIT,
  buildPassiveEffectSummary,
  buildQuestOfferSummary,
  buildScheduledVerbSummary,
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
    />
  );

  return (
    <div
      ref={setNodeRef}
      className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center gap-3 pointer-events-auto"
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
          {hasContent ? (
            <>
              {verbs.slice(0, 1).map((verb) => renderSummaryCard(verb))}
              {verbs.length > 1 && (
                <span className="text-[10px] text-slate-300">
                  +
                  {verbs.length - 1}
                  {' '}
                  altri incarichi
                </span>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-300 px-4 py-3 min-h-44 min-w-28">
              <span className="text-base">{slot.icon ?? '⌀'}</span>
              <span>{slot.label}</span>
            </div>
          )}
          {questOffers.slice(0, 1).map((offer) => renderSummaryCard(offer))}
          {questOffers.length > 1 && (
            <span className="text-[10px] text-slate-300">
              +
              {questOffers.length - 1}
              {' '}
              altre quest
            </span>
          )}
        </div>
      </button>
      <div className="text-[10px] uppercase tracking-[0.2em] text-amber-100 drop-shadow">{slot.label}</div>
    </div>
  );
}

function selectDefaultFounder(config?: IdleVillageConfig | null): FounderPreset | null {
  if (!config) return null;
  const founders = config.founders ?? {};
  return founders.founder_standard ?? Object.values(founders)[0] ?? null;
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

const IdleVillagePage: React.FC = () => {
  const { config } = useIdleVillageConfig();
  const defaultFounderPreset = useMemo(() => selectDefaultFounder(config), [config]);
  const { state: villageState, updateState, undo, canUndo, exportState, importState, resetState } = useVillageStateStore(() =>
    createVillageStateFromConfig({ config, founderPreset: defaultFounderPreset }),
  );

  const { showToast, toasts, removeToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeResidentId, setActiveResidentId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [resetConfirmPending, setResetConfirmPending] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleExport = () => {
    try {
      const json = exportState();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

      a.download = `idle-village-state-${timestamp}.json`;
      a.click();
      showToast('Village state exported successfully', 'success');
    } catch (e) {
      showToast(`Export error: ${(e as Error).message}`, 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        importState(text, 'Imported state');
        showToast('Village state imported successfully', 'success');
      } catch (err) {
        showToast(`Import error: ${(err as Error).message}`, 'error');
      }
    };
    reader.onerror = () => {
      showToast('File read error', 'error');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetAll = () => {
    if (!resetConfirmPending) {
      setResetConfirmPending(true);
      showToast('Click again to confirm reset', 'info');
      setTimeout(() => setResetConfirmPending(false), 3000);
      return;
    }

    setResetConfirmPending(false);
    try {
      resetState(() => createVillageStateFromConfig({ config, founderPreset: defaultFounderPreset }), 'Reset state');
      showToast('Village state reset to initial', 'success');
    } catch (e) {
      showToast(`Reset error: ${(e as Error).message}`, 'error');
    }
  };

  const handleUndo = () => {
    const undone = undo();
    if (undone) {
      showToast('State undone', 'info');
    } else {
      showToast('No state to undo', 'error');
    }
  };
  const [resourceDeltas, setResourceDeltas] = useState<Record<string, number>>({});
  const resourceDeltaTimeoutRef = useRef<number | null>(null);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [marketUnits, setMarketUnits] = useState(0);
  const [hungerFx, setHungerFx] = useState<{ amount: number; id: number } | null>(null);
  const residentCount = useMemo(() => Object.keys(villageState.residents).length, [villageState.residents]);

  // Ensure at least one resident is available for drag assignments.
  useEffect(() => {
    if (!config) return;
    if (residentCount > 0) return;
    startTransition(() => {
      updateState((prev) => {
        if (Object.keys(prev.residents).length > 0) return prev;
        if (defaultFounderPreset) {
          const founderResident = buildResidentFromFounder(defaultFounderPreset);
          return {
            ...prev,
            residents: {
              ...prev.residents,
              [founderResident.id]: founderResident,
            },
          };
        }
        const fallbackResident: ResidentState = {
          id: 'resident_alpha',
          displayName: 'Resident Alpha',
          status: 'available',
          fatigue: 0,
          statTags: ['generalist'],
          currentHp: 100,
          maxHp: 100,
          isHero: false,
          isInjured: false,
          survivalCount: 0,
          survivalScore: 0,
        };
        return {
          ...prev,
          residents: {
            ...prev.residents,
            [fallbackResident.id]: fallbackResident,
          },
        };
      }, 'Ensure resident availability');
    });
  }, [config, defaultFounderPreset, residentCount]);

  const secondsPerTimeUnit = config?.globalRules.secondsPerTimeUnit ?? DEFAULT_SECONDS_PER_TIME_UNIT;
  const dayLengthSetting = config?.globalRules.dayLengthInTimeUnits || 5;

  const getResourceLabel = useCallback(
    (resourceId: string) => {
      if (!config) return resourceId;
      const def = config.resources?.[resourceId];
      return def?.label ?? resourceId;
    },
    [config, updateState],
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
        updateState(() => result.state, 'Schedule activity');
      } catch (e) {
        console.error('Failed to schedule activity', e);
      }
    },
    [config, villageState, selectedSlotId, updateState],
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
      updateState((prev) => {
        const result = tickIdleVillage({ config, rng: simpleRng }, prev, delta);
        let nextState = result.state;

        if (result.completedJobs.length > 0) {
          for (const job of result.completedJobs) {
            const activity = config.activities[job.activityId] as ActivityDefinition | undefined;
            if (!activity) continue;

            const jobMeta = (activity.metadata ?? {}) as { marketJob?: boolean } | undefined;
            if (jobMeta?.marketJob) {
              setShowMarketModal(true);
            }

            const metadata = (activity.metadata ?? {}) as { supportsAutoRepeat?: boolean; continuousJob?: boolean };
            const isContinuous = !!metadata.continuousJob;
            const supportsAuto = !!metadata.supportsAutoRepeat;
            const isAutoOn = isContinuous || supportsAuto;
            const scheduled = nextState.activities[job.scheduledId];
            if (!scheduled || !isAutoOn || scheduled.characterIds.length === 0) {
              continue;
            }

            const fatigueThreshold = config.globalRules.maxFatigueBeforeExhausted;
            const assigneesReady = scheduled.characterIds.every((cid) => {
              const resident = nextState.residents[cid];
              if (!resident) return false;
              if (resident.status !== 'available') return false;
              return resident.fatigue < fatigueThreshold;
            });
            if (!assigneesReady) {
              continue;
            }

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

        if (result.completedQuests.length > 0) {
          for (const quest of result.completedQuests) {
            const activity = config.activities[quest.activityId] as ActivityDefinition | undefined;
            if (!activity) continue;

            const scheduled = nextState.activities[quest.scheduledId];
            if (!scheduled) continue;

            // Quest completion currently has no extra UI side-effects.
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
              setHungerFx({ amount: total, id: eventId });
            }
          }

          const injuryEvents = newEvents.filter((e) => e.type === 'injury_applied');
          if (injuryEvents.length > 0) {
            // Future injury FX hook placeholder
          }
        }

        const questOffers = nextState.questOffers ?? {};
        const filteredEntries = Object.entries(questOffers).filter(([, offer]) => {
          if (typeof offer.expiresAtTime !== 'number') return true;
          return offer.expiresAtTime > nextState.currentTime;
        });
        if (filteredEntries.length !== Object.keys(questOffers).length) {
          nextState = {
            ...nextState,
            questOffers: Object.fromEntries(filteredEntries),
          };
        }

        return nextState;
      });
    },
    [config, updateState],
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

  const handleAcceptQuestOffer = useCallback(
    (offerId: string, residentId?: string) => {
      if (!config) return;
      updateState((prev) => {
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
      }, 'Accept quest offer');
    },
    [config, updateState],
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

  const passiveEffectSummaries = useMemo(() => {
    if (!config) return [] as VerbSummary[];
    const mapSlotsRecord = config.mapSlots ?? {};
    return Object.values(config.passiveEffects ?? {})
      .map((effect) =>
        buildPassiveEffectSummary({
          effect,
          currentTime: villageState.currentTime,
          secondsPerTimeUnit,
          mapSlots: mapSlotsRecord,
          resourceLabeler: getResourceLabel,
        }),
      )
      .filter(Boolean) as VerbSummary[];
  }, [config, villageState.currentTime, secondsPerTimeUnit, getResourceLabel]);

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
    const addSummary = (summary: VerbSummary) => {
      if (!summary.slotId) return;
      if (!grouped[summary.slotId]) grouped[summary.slotId] = [];
      grouped[summary.slotId].push(summary);
    };
    scheduledVerbSummaries.forEach(addSummary);
    passiveEffectSummaries.forEach(addSummary);
    return grouped;
  }, [scheduledVerbSummaries, passiveEffectSummaries]);

  const questOffersBySlot = useMemo(() => {
    const grouped: Record<string, VerbSummary[]> = {};
    questOfferSummaries.forEach((summary) => {
      if (!summary.slotId) return;
      if (!grouped[summary.slotId]) grouped[summary.slotId] = [];
      grouped[summary.slotId].push(summary);
    });
    return grouped;
  }, [questOfferSummaries]);

  const goldAmount = villageState.resources.gold ?? 0;
  const foodAmount = villageState.resources.food ?? 0;
  const foodPrice = config?.globalRules.baseFoodPriceInGold ?? 0;
  const maxAffordableFood = foodPrice > 0 ? Math.floor(goldAmount / foodPrice) : 0;

  useEffect(() => {
    if (!showMarketModal) return;
    startTransition(() => {
      if (maxAffordableFood <= 0) {
        setMarketUnits(0);
      } else if (marketUnits <= 0 || marketUnits > maxAffordableFood) {
        setMarketUnits(Math.min(5, maxAffordableFood));
      }
    });
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
            {/* Top overlay: time/resources + summary ribbon + residents */}
            <div className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start">
                <div className="flex-1 flex flex-row gap-3 items-center">
                  {/* Compact time/resources + day/night ring and transport controls */}
                  <div className="inline-flex flex-wrap items-center gap-3 rounded-full bg-black/80 border border-gold/40 shadow-md px-3 py-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setIsPlaying((prev) => !prev)}
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900/90 border border-slate-600 text-ivory hover:bg-slate-800"
                      title="Spacebar: play/pause"
                    >
                      {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
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
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 relative">
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
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border transition-colors ${canUndo
                          ? 'border-amber-400/70 text-amber-200 hover:bg-amber-500/15'
                          : 'border-[#2b3434] text-[#4b5555] cursor-not-allowed'
                        }`}
                    >
                      <span aria-hidden className="text-xs">↺</span>
                      <span className="tracking-[0.18em] uppercase">Undo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border transition-colors ${resetConfirmPending
                          ? 'border-red-500/70 text-red-200 bg-red-500/10 animate-pulse'
                          : 'border-rose-500/70 text-rose-200 hover:bg-rose-500/15'
                        }`}
                    >
                      <span aria-hidden className="text-xs">⚠</span>
                      <span className="tracking-[0.18em] uppercase">{resetConfirmPending ? 'Confirm' : 'Reset'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExport}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-emerald-500/70 text-emerald-200 hover:bg-emerald-500/15 transition-colors"
                    >
                      <span aria-hidden className="text-xs">⭳</span>
                      <span className="tracking-[0.18em] uppercase">Export</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleImportClick}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-cyan-500/70 text-cyan-200 hover:bg-cyan-500/15 transition-colors"
                    >
                      <span aria-hidden className="text-xs">⭱</span>
                      <span className="tracking-[0.18em] uppercase">Import</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-2 overflow-x-auto w-full">
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
                  updateState((prev) => {
                    const result = buyFoodWithGold(config, prev.resources, { units: cappedUnits });
                    return {
                      ...prev,
                      resources: result.resources,
                    };
                  }, 'Buy food');
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
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportChange}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </DndContext>
  );
};

export default IdleVillagePage;
