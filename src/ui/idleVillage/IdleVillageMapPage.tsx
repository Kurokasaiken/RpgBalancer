const resolveSlotForActivity = (
  activity: ActivityDefinition,
  mapSlotsRecord: Record<string, MapSlotDefinition>,
): string | null => {
  const meta = (activity.metadata ?? {}) as { mapSlotId?: string };
  if (meta?.mapSlotId && mapSlotsRecord[meta.mapSlotId]) {
    return meta.mapSlotId;
  }
  if (activity.slotTags?.length) {
    const match = Object.values(mapSlotsRecord).find((slot) =>
      slot.slotTags?.some((tag) => activity.slotTags?.includes(tag)),
    );
    if (match) return match.id;
  }
  return null;
};

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import idleVillageMap from '@/assets/ui/idleVillage/idle-village-map.jpg';
import { computeSlotPercentPosition, resolveMapLayout } from '@/ui/idleVillage/mapLayoutUtils';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import {
  createVillageStateFromConfig,
  scheduleActivity,
  type ResidentState,
  type ScheduledActivity,
  type VillageState,
} from '@/engine/game/idleVillage/TimeEngine';
import { tickIdleVillage } from '@/engine/game/idleVillage/IdleVillageEngine';
import type {
  ActivityDefinition,
  FounderPreset,
  IdleVillageConfig,
  MapSlotDefinition,
} from '@/balancing/config/idleVillage/types';
import VerbCard from '@/ui/idleVillage/VerbCard';
import {
  DEFAULT_SECONDS_PER_TIME_UNIT,
  buildActivityBlueprintSummary,
  buildPassiveEffectSummary,
  buildQuestOfferSummary,
  buildScheduledVerbSummary,
  type VerbSummary,
} from '@/ui/idleVillage/verbSummaries';
import ResidentRoster from '@/ui/idleVillage/ResidentRoster';

const DEFAULT_CARD_SCALE = 0.45;
const RESIDENT_DRAG_MIME = 'application/x-idle-resident';

const simpleRng = (() => {
  let seed = 12345;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
})();

const activityMatchesSlot = (activity: ActivityDefinition, slot: MapSlotDefinition): boolean => {
  const meta = (activity.metadata ?? {}) as { mapSlotId?: string } | undefined;
  if (meta?.mapSlotId && meta.mapSlotId === slot.id) {
    return true;
  }
  if (!activity.slotTags?.length) return true;
  if (!slot.slotTags?.length) return false;
  return slot.slotTags.some((tag) => activity.slotTags?.includes(tag));
};

const validateAssignment = (params: {
  resident: ResidentState;
  slot: MapSlotDefinition;
  activity: ActivityDefinition;
  config: IdleVillageConfig;
}):
  | { ok: true }
  | {
      ok: false;
      reason: string;
    } => {
  const { resident, slot, activity, config } = params;
  if (resident.status !== 'available') {
    return { ok: false, reason: `${resident.id} non è disponibile.` };
  }

  const meta = (activity.metadata ?? {}) as { mapSlotId?: string } | undefined;
  const slotAllowed = activityMatchesSlot(activity, slot);
  if (!slotAllowed) {
    return {
      ok: false,
      reason: `${activity.label ?? activity.id} non è compatibile con ${slot.label}.`,
    };
  }

  const { maxFatigueBeforeExhausted } = config.globalRules;
  if (resident.fatigue >= maxFatigueBeforeExhausted) {
    return {
      ok: false,
      reason: `${resident.id} è troppo stanco (${resident.fatigue}/${maxFatigueBeforeExhausted}).`,
    };
  }

  if (!slot.isInitiallyUnlocked) {
    return {
      ok: false,
      reason: `${slot.label} è bloccato e non accetta assegnazioni.`,
    };
  }

  return { ok: true };
};

interface MapSlotVerbClusterProps {
  slotId: string;
  left: number;
  top: number;
  verbs: VerbSummary[];
  cardScale: number;
  isDropMode: boolean;
  canAcceptDrop: boolean;
  isHighlighted: boolean;
  onDropResident: (slotId: string, residentId: string | null) => void;
}

function MapSlotVerbCluster({
  slotId,
  left,
  top,
  verbs,
  cardScale,
  isDropMode,
  canAcceptDrop,
  isHighlighted,
  onDropResident,
}: MapSlotVerbClusterProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isDropMode || !canAcceptDrop) return;
    event.preventDefault();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    if (!isDropMode || !isDragOver) return;
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isDropMode || !canAcceptDrop) return;
    event.preventDefault();
    setIsDragOver(false);
    const residentId =
      event.dataTransfer.getData(RESIDENT_DRAG_MIME) || event.dataTransfer.getData('text/plain') || null;
    onDropResident(slotId, residentId);
  };

  return (
    <div
      className={`absolute -translate-x-1/2 -translate-y-full flex flex-col items-center gap-2 pointer-events-auto transition-all duration-200 ${
        isDropMode && canAcceptDrop ? 'drop-shadow-[0_4px_14px_rgba(251,191,36,0.25)]' : ''
      } ${isDragOver ? 'scale-105' : ''} ${isHighlighted ? 'animate-pulse' : ''}`}
      style={{ left: `${left}%`, top: `${top}%` }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-dropeffect={isDropMode && canAcceptDrop ? 'copy' : undefined}
    >
      <div className="relative flex flex-col items-center gap-2">
        <div
          className={`pointer-events-none absolute -inset-7 rounded-full blur-2xl transition-all duration-300 ${
            isHighlighted ? 'opacity-70 bg-amber-200/40' : 'opacity-0'
          }`}
          aria-hidden
        />
        <div
          className={`pointer-events-none absolute -inset-5 rounded-full blur-xl transition-all duration-200 ${
            isDropMode && canAcceptDrop
              ? isDragOver
                ? 'opacity-80 scale-110 bg-amber-300/55'
                : 'opacity-30 bg-amber-200/30'
              : 'opacity-0'
          }`}
          aria-hidden
        />
        {isDropMode && (
          <span
            className={`text-[10px] uppercase tracking-[0.3em] drop-shadow-lg ${
              canAcceptDrop ? 'text-amber-100' : 'text-slate-500'
            }`}
          >
            {canAcceptDrop ? 'Drop Resident' : 'Slot non attivo'}
          </span>
        )}
        {verbs.map((verb) => (
          <div
            key={verb.key}
            className="origin-top relative"
            style={{ transform: `scale(${cardScale})` }}
          >
            <VerbCard
              icon={verb.icon}
              progressFraction={verb.progressFraction}
              elapsedSeconds={verb.elapsedSeconds}
              totalDuration={verb.totalDurationSeconds}
              injuryPercentage={verb.injuryPercentage}
              deathPercentage={verb.deathPercentage}
              assignedCount={verb.assignedCount}
              totalSlots={verb.totalSlots}
              visualVariant={verb.visualVariant}
              progressStyle={verb.progressStyle}
              isInteractive={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function selectDefaultFounder(config?: IdleVillageConfig | null): FounderPreset | null {
  if (!config) return null;
  const founders = config.founders ?? {};
  return founders.founder_standard ?? Object.values(founders)[0] ?? null;
}

const IdleVillageMapPage: React.FC = () => {
  const { config } = useIdleVillageConfig();
  const defaultFounderPreset = useMemo(() => selectDefaultFounder(config), [config]);
  const [villageState, setVillageState] = useState<VillageState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cardScale, setCardScale] = useState(DEFAULT_CARD_SCALE);
  const [isResidentDragActive, setIsResidentDragActive] = useState(false);
  const [lastDropSlotId, setLastDropSlotId] = useState<string | null>(null);
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);
  const [highlightSlotId, setHighlightSlotId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!config) return;
    setVillageState(createVillageStateFromConfig({ config, founderPreset: defaultFounderPreset }));
  }, [config, defaultFounderPreset]);

  const advanceTimeBy = useCallback(
    (delta: number) => {
      if (!config) return;
      setVillageState((prev) => {
        if (!prev) return prev;
        const result = tickIdleVillage({ config, rng: simpleRng }, prev, delta);
        let nextState = result.state;

        if (result.completedJobs.length > 0) {
          for (const job of result.completedJobs) {
            const activity = config.activities[job.activityId] as ActivityDefinition | undefined;
            if (!activity) continue;

            const metadata = (activity.metadata ?? {}) as {
              supportsAutoRepeat?: boolean;
              continuousJob?: boolean;
            };
            const isContinuous = !!metadata.continuousJob;
            const supportsAuto = !!metadata.supportsAutoRepeat;
            const isAutoOn = isContinuous || supportsAuto;
            const scheduled = nextState.activities[job.scheduledId];
            if (!scheduled || !isAutoOn || scheduled.characterIds.length === 0) {
              continue;
            }

            const { maxFatigueBeforeExhausted } = config.globalRules;
            const assigneesReady = scheduled.characterIds.every((cid) => {
              const resident = nextState.residents[cid];
              if (!resident) return false;
              if (resident.status !== 'available') return false;
              return resident.fatigue < maxFatigueBeforeExhausted;
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
          result.completedQuests.forEach(() => {
            // No extra UI side-effects yet for completed quests.
          });
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
    [config],
  );

  useEffect(() => {
    if (!isPlaying) return undefined;
    const id = window.setInterval(() => {
      advanceTimeBy(1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPlaying, advanceTimeBy]);

  const mapSlots = useMemo(() => {
    if (!config) return [];
    return Object.values(config.mapSlots ?? {});
  }, [config]);

  const mapLayout = useMemo(() => resolveMapLayout(config?.mapLayout), [config?.mapLayout]);

  const mapSlotLayout = useMemo(() => {
    if (mapSlots.length === 0) return [];
    return mapSlots.map((slot) => {
      const { leftPercent, topPercent } = computeSlotPercentPosition(slot, mapLayout);
      return { slot, left: leftPercent, top: topPercent };
    });
  }, [mapSlots, mapLayout]);

  const availableResidents = useMemo(() => {
    if (!villageState) return [] as ResidentState[];
    return Object.values(villageState.residents ?? {}).filter((resident) => resident.status === 'available');
  }, [villageState]);

  const activitiesBySlot = useMemo(() => {
    if (!config) return {} as Record<string, ActivityDefinition[]>;
    const mapSlotsRecord = config.mapSlots ?? {};
    const grouped: Record<string, ActivityDefinition[]> = {};
    Object.values(config.activities ?? {}).forEach((activity) => {
      const slotId = resolveSlotForActivity(activity, mapSlotsRecord);
      if (!slotId) return;
      if (!grouped[slotId]) grouped[slotId] = [];
      grouped[slotId].push(activity);
    });
    return grouped;
  }, [config]);

  const canSlotAcceptDrop = useCallback(
    (slotId: string) => {
      return (activitiesBySlot[slotId]?.length ?? 0) > 0;
    },
    [activitiesBySlot],
  );

  useEffect(() => {
    setIsResidentDragActive(false);
    setDraggingResidentId(null);
    setHighlightSlotId(null);
  }, [mapLayout.pixelWidth, mapLayout.pixelHeight]);

  useEffect(
    () => () => {
      if (highlightTimeoutRef.current !== null) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    },
    [],
  );

  const secondsPerTimeUnit = config?.globalRules.secondsPerTimeUnit ?? DEFAULT_SECONDS_PER_TIME_UNIT;
  const dayLengthSetting = config?.globalRules.dayLengthInTimeUnits || 5;

  const getResourceLabel = useCallback(
    (resourceId: string) => {
      const def = config?.resources?.[resourceId];
      return def?.label ?? resourceId;
    },
    [config],
  );

  const activeActivities = useMemo(() => {
    if (!villageState) return [] as ScheduledActivity[];
    const all = Object.values(villageState.activities) as ScheduledActivity[];
    return all
      .filter((activity) => activity.status === 'pending' || activity.status === 'running')
      .sort((a, b) => {
        if (a.endTime === b.endTime) return a.startTime - b.startTime;
        return a.endTime - b.endTime;
      });
  }, [villageState]);

  const scheduledVerbSummaries = useMemo(() => {
    if (!config || !villageState) return [] as VerbSummary[];
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
    villageState,
    activeActivities,
    getResourceLabel,
    secondsPerTimeUnit,
    dayLengthSetting,
  ]);

  const questOffers = useMemo(
    () => Object.values(villageState?.questOffers ?? {}),
    [villageState?.questOffers],
  );

  const questOfferSummaries = useMemo(() => {
    if (!config || !villageState) return [] as VerbSummary[];
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
  }, [config, questOffers, villageState, getResourceLabel, secondsPerTimeUnit, dayLengthSetting]);

  const passiveEffectSummaries = useMemo(() => {
    if (!config || !villageState) return [] as VerbSummary[];
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
  }, [config, villageState, secondsPerTimeUnit, getResourceLabel]);

  const activityBlueprintSummaries = useMemo(() => {
    if (!config) return [] as VerbSummary[];
    const mapSlotsRecord = config.mapSlots ?? {};
    return Object.values(config.activities ?? {})
      .map((activity) =>
        buildActivityBlueprintSummary({
          activity,
          mapSlots: mapSlotsRecord,
          resourceLabeler: getResourceLabel,
        }),
      )
      .filter(Boolean) as VerbSummary[];
  }, [config, getResourceLabel]);

  const verbsBySlot = useMemo(() => {
    const grouped: Record<string, VerbSummary[]> = {};
    const addSummary = (summary: VerbSummary) => {
      if (!summary.slotId) return;
      if (!grouped[summary.slotId]) grouped[summary.slotId] = [];
      grouped[summary.slotId].push(summary);
    };
    scheduledVerbSummaries.forEach(addSummary);
    passiveEffectSummaries.forEach(addSummary);
    activityBlueprintSummaries.forEach(addSummary);
    return grouped;
  }, [scheduledVerbSummaries, passiveEffectSummaries, activityBlueprintSummaries]);

  const questOffersBySlot = useMemo(() => {
    const grouped: Record<string, VerbSummary[]> = {};
    questOfferSummaries.forEach((summary) => {
      if (!summary.slotId) return;
      if (!grouped[summary.slotId]) grouped[summary.slotId] = [];
      grouped[summary.slotId].push(summary);
    });
    return grouped;
  }, [questOfferSummaries]);

  const handleResidentDragStart = useCallback(
    (residentId: string) => (event: React.DragEvent<HTMLButtonElement>) => {
      event.dataTransfer.setData(RESIDENT_DRAG_MIME, residentId);
      event.dataTransfer.setData('text/plain', residentId);
      event.dataTransfer.effectAllowed = 'copy';
      setIsResidentDragActive(true);
      setDraggingResidentId(residentId);
      setAssignmentFeedback(null);
    },
    [],
  );

  const handleResidentDragEnd = useCallback(() => {
    setIsResidentDragActive(false);
    setDraggingResidentId(null);
  }, []);

  const handleDropResident = useCallback(
    (slotId: string, residentId: string | null) => {
      setIsResidentDragActive(false);
      setDraggingResidentId(null);
      setLastDropSlotId(slotId);
      if (!residentId) {
        setAssignmentFeedback('Seleziona un residente valido da trascinare.');
        return;
      }
      setVillageState((prev) => {
        if (!prev || !config) return prev;
        const resident = prev.residents[residentId];
        if (!resident) {
          setAssignmentFeedback(`Residente ${residentId} non trovato.`);
          return prev;
        }

        const slotDef = config.mapSlots?.[slotId];
        if (!slotDef) {
          setAssignmentFeedback(`Slot ${slotId} non definito in config.`);
          return prev;
        }

        const candidateActivities = activitiesBySlot[slotId] ?? [];
        if (candidateActivities.length === 0) {
          setAssignmentFeedback('Nessuna activity compatibile per questo slot.');
          return prev;
        }

        const selectedActivity =
          candidateActivities.find((activity) => activityMatchesSlot(activity, slotDef)) ??
          candidateActivities[0];

        const validation = validateAssignment({
          resident,
          slot: slotDef,
          activity: selectedActivity,
          config,
        });

        if (!validation.ok) {
          setAssignmentFeedback(validation.reason);
          return prev;
        }

        const { state: nextState } = scheduleActivity(
          { config, rng: simpleRng },
          prev,
          {
            activityId: selectedActivity.id,
            characterIds: [resident.id],
            slotId,
          },
        );
        setAssignmentFeedback(`${resident.id} assegnato a ${selectedActivity.label ?? selectedActivity.id}.`);
        setHighlightSlotId(slotId);
        if (highlightTimeoutRef.current !== null) {
          window.clearTimeout(highlightTimeoutRef.current);
        }
        highlightTimeoutRef.current = window.setTimeout(() => {
          setHighlightSlotId((current) => (current === slotId ? null : current));
        }, 2200);
        return nextState;
      });
    },
    [activitiesBySlot, config],
  );

  if (!config || !villageState) {
    return <div className="p-4 text-ivory">Loading Idle Village map...</div>;
  }

  const dayNightSettings = config.globalRules.dayNightCycle;
  const dayTimeUnits = Math.max(1, dayNightSettings?.dayTimeUnits ?? dayLengthSetting);
  const nightTimeUnits = Math.max(
    1,
    dayNightSettings?.nightTimeUnits ?? Math.max(1, Math.round(dayLengthSetting / 2)),
  );
  const totalCycleUnits = dayTimeUnits + nightTimeUnits;
  const currentCycleUnit = totalCycleUnits > 0 ? villageState.currentTime % totalCycleUnits : 0;
  const cycleProgressFraction =
    totalCycleUnits > 0 ? currentCycleUnit / totalCycleUnits : 0;
  const isDayPhase = currentCycleUnit < dayTimeUnits;
  const cycleElapsedSeconds = currentCycleUnit * secondsPerTimeUnit;
  const cycleTotalSeconds = totalCycleUnits * secondsPerTimeUnit;
  const cycleIcon = isPlaying ? (isDayPhase ? '☀️' : '🌙') : '❚❚';
  const cycleVariant = isDayPhase ? 'solar' : 'amethyst';
  const cyclePhaseLabel = isDayPhase ? 'Fase giorno' : 'Fase notte';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#020617_0,#020617_55%,#000000_100%)] text-ivory flex items-center">
      <section className="relative w-full aspect-video max-w-6xl mx-auto">
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

        <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-3 max-w-5xl">
          <div className="flex flex-row gap-3 items-start">
            <div className="flex flex-col items-center gap-1">
              <VerbCard
                icon={cycleIcon}
                progressFraction={cycleProgressFraction}
                elapsedSeconds={cycleElapsedSeconds}
                totalDuration={cycleTotalSeconds}
                injuryPercentage={0}
                deathPercentage={0}
                assignedCount={isPlaying ? 1 : 0}
                totalSlots={1}
                visualVariant={cycleVariant}
                progressStyle="border"
                isInteractive
                onClick={() => setIsPlaying((prev) => !prev)}
              />
              <div className="text-[9px] uppercase tracking-[0.2em] text-slate-200 text-center">
                {cyclePhaseLabel}
                <span className="ml-1 text-slate-400 lowercase">
                  (t={villageState.currentTime})
                </span>
              </div>
              <div className="text-[9px] text-slate-300">
                {isPlaying ? 'Tap per mettere in pausa' : 'Tap per riprendere'}
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl bg-black/80 border border-gold/40 shadow-md px-4 py-3 text-[10px] min-w-52">
              <label className="flex flex-col gap-1 uppercase tracking-[0.2em] text-slate-300">
                Card Size ({Math.round(cardScale * 100)}%)
                <input
                  type="range"
                  min="0.1"
                  max="1.2"
                  step="0.05"
                  value={cardScale}
                  onChange={(e) => setCardScale(Number(e.target.value))}
                  className="accent-gold"
                />
              </label>
              {lastDropSlotId && (
                <span className="text-[10px] text-emerald-300">
                  Ultimo drop: {config.mapSlots?.[lastDropSlotId]?.label ?? lastDropSlotId}
                </span>
              )}
              {!isResidentDragActive && availableResidents.length === 0 && (
                <span className="text-[10px] text-slate-400">
                  Nessun residente libero: attendi il completamento di una card.
                </span>
              )}
            </div>
          </div>
          <ResidentRoster
            residents={availableResidents}
            activeResidentId={draggingResidentId}
            onDragStart={handleResidentDragStart}
            onDragEnd={handleResidentDragEnd}
            assignmentFeedback={assignmentFeedback}
            maxFatigueBeforeExhausted={config.globalRules.maxFatigueBeforeExhausted}
          />
        </div>

        <div className="absolute inset-0 z-10 pointer-events-none">
          {mapSlotLayout.map(({ slot, left, top }) => {
            const slotVerbs = verbsBySlot[slot.id] ?? [];
            const slotOffers = questOffersBySlot[slot.id] ?? [];
            const combined = [...slotVerbs, ...slotOffers];
            if (combined.length === 0) {
              return null;
            }
            return (
              <MapSlotVerbCluster
                key={slot.id}
                slotId={slot.id}
                left={left}
                top={top}
                verbs={combined}
                cardScale={cardScale}
                isDropMode={isResidentDragActive}
                canAcceptDrop={canSlotAcceptDrop(slot.id)}
                isHighlighted={highlightSlotId === slot.id}
                onDropResident={handleDropResident}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default IdleVillageMapPage;
