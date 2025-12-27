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

type IdleVillageResetOptions = {
  founderId?: string;
};

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import idleVillageMap from '@/assets/ui/idleVillage/idle-village-map.jpg';
import { computeSlotPercentPosition, resolveMapLayout } from '@/ui/idleVillage/mapLayoutUtils';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import {
  createVillageStateFromConfig,
  scheduleActivity,
  resolveActivityOutcome,
  type ResidentState,
  type ScheduledActivity,
  type VillageState,
} from '@/engine/game/idleVillage/TimeEngine';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import { tickIdleVillage } from '@/engine/game/idleVillage/IdleVillageEngine';
import { useToast, ToastContainer } from '@/ui/balancing/Toast';
import type { ActivityDefinition, IdleVillageConfig, MapSlotDefinition, StatRequirement } from '@/balancing/config/idleVillage/types';
import { loadResidentsFromCharacterManager } from '@/engine/game/idleVillage/characterImport';
import MarbleMedallionCard from '@/ui/fantasy/assets/marble-verb-card/MarbleMedallionCard';
import {
  DEFAULT_SECONDS_PER_TIME_UNIT,
  buildActivityBlueprintSummary,
  buildPassiveEffectSummary,
  buildQuestOfferSummary,
  buildScheduledVerbSummary,
  type VerbSummary,
} from '@/ui/idleVillage/verbSummaries';
import ResidentRoster from '@/ui/idleVillage/ResidentRoster';
import MapSlotVerbCluster from '@/ui/idleVillage/components/MapSlotVerbCluster';
import TheaterView from '@/ui/idleVillage/components/TheaterView';
import MapLocationSlot from '@/ui/idleVillage/components/MapLocationSlot';
import ActiveActivityHUD from '@/ui/idleVillage/ActiveActivityHUD';
import QuestDetailPanel from '@/ui/idleVillage/components/QuestDetailPanel';
import type { DropState } from '@/ui/idleVillage/components/ActivitySlot';

interface IdleVillageDebugControls {
  play: () => void;
  pause: () => void;
  advance: (delta: number) => void;
  assign: (slotId: string, residentId: string) => boolean;
  getState: () => VillageState | null;
  getConfig: () => IdleVillageConfig | null;
  reset: (options?: IdleVillageResetOptions) => VillageState | null;
  getAssignmentFeedback: () => string | null;
}

declare global {
  interface Window {
    __idleVillageControls?: IdleVillageDebugControls;
  }
}

const simpleRng = (() => {
  let seed = 12345;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
})();

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const deriveDeathRisk = (activity?: ActivityDefinition): number => {
  if (!activity) return 0;
  const meta = (activity.metadata ?? {}) as { trialOfFireRisk?: number; deathChanceDisplay?: number };
  let risk = typeof meta.trialOfFireRisk === 'number' ? meta.trialOfFireRisk : typeof meta.deathChanceDisplay === 'number' ? meta.deathChanceDisplay : 0;
  if (risk > 1) {
    risk = risk / 100;
  }
  return clamp01(risk);
};

const activityMatchesSlot = (activity: ActivityDefinition, slot: MapSlotDefinition): boolean => {
  const meta = (activity.metadata ?? {}) as { mapSlotId?: string } | undefined;
  if (meta?.mapSlotId && meta.mapSlotId === slot.id) {
    return true;
  }
  if (!activity.slotTags?.length) return true;
  if (!slot.slotTags?.length) return false;
  return slot.slotTags.some((tag) => activity.slotTags?.includes(tag));
};

const formatRequirementFailure = (params: {
  requirement?: StatRequirement;
  missingAllOf: string[];
  anyOfMatched: boolean;
  blockedBy: string[];
}): string | null => {
  const { requirement, missingAllOf, anyOfMatched, blockedBy } = params;
  if (!requirement) return null;

  const parts: string[] = [];
  if (missingAllOf.length > 0) {
    parts.push(`manca ${missingAllOf.join(', ')}`);
  }
  if (!anyOfMatched && (requirement.anyOf?.length ?? 0) > 0) {
    parts.push(`serve uno tra ${requirement.anyOf?.join(', ')}`);
  }
  if (blockedBy.length > 0) {
    parts.push(`vietato avere ${blockedBy.join(', ')}`);
  }

  const label = requirement.label ?? 'requisito';
  if (parts.length === 0) {
    return `${label} non soddisfatto.`;
  }
  return `${label} non soddisfatto: ${parts.join('; ')}.`;
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

  if (activity.statRequirement) {
    const match = evaluateStatRequirement(resident, activity.statRequirement);
    if (!match.matches) {
      return {
        ok: false,
        reason:
          formatRequirementFailure({
            requirement: activity.statRequirement,
            missingAllOf: match.missingAllOf,
            anyOfMatched: match.anyOfMatched,
            blockedBy: match.blockedBy,
          }) ?? `${resident.id} non soddisfa i requisiti richiesti.`,
      };
    }
  }

  return { ok: true };
};

const IdleVillageMapPage: React.FC = () => {
  const { config } = useIdleVillageConfig();
  const [villageState, setVillageState] = useState<VillageState | null>(null);
  const villageStateRef = useRef<VillageState | null>(null);
  const { showToast, toasts, removeToast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [cardScale, setCardScale] = useState(0.9);
  const [isResidentDragActive, setIsResidentDragActive] = useState(false);
  const [lastDropSlotId, setLastDropSlotId] = useState<string | null>(null);
  const [draggingResidentId, setDraggingResidentId] = useState<string | null>(null);
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);
  const [highlightSlotId, setHighlightSlotId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedVerbKey, setSelectedVerbKey] = useState<string | null>(null);
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const lastAssignmentFeedbackRef = useRef<string | null>(null);

  const updateAssignmentFeedback = useCallback(
    (message: string | null, options?: { silent?: boolean }) => {
      lastAssignmentFeedbackRef.current = message;
      if (!options?.silent) {
        setAssignmentFeedback(message);
      }
    },
    [],
  );

  const bootstrapVillageState = useCallback((_options?: IdleVillageResetOptions) => {
    if (!config) return null;
    const initialResidents = loadResidentsFromCharacterManager({ config });
    const freshState = createVillageStateFromConfig({ config, initialResidents });
    setVillageState(freshState);
    villageStateRef.current = freshState;
    updateAssignmentFeedback(null);
    return freshState;
  }, [config, updateAssignmentFeedback]);

  useEffect(() => {
    bootstrapVillageState();
  }, [bootstrapVillageState]);

  const advanceTimeBy = useCallback(
    (delta: number) => {
      if (!config || delta <= 0) return;
      const prev = villageStateRef.current;
      if (!prev) return;

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

      villageStateRef.current = nextState;
      setVillageState(nextState);
    },
    [config],
  );

  useEffect(() => {
    villageStateRef.current = villageState;
  }, [villageState]);

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

  useEffect(() => {
    if (!config) return;
    if (import.meta.env?.DEV) {
      console.debug('[IdleVillageMap] Map slots ready', Object.keys(config.mapSlots ?? {}));
    }
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

  useEffect(() => {
    if (!villageState || !import.meta.env?.DEV) return;
    console.debug('[IdleVillageMap] Available residents snapshot', Object.values(villageState.residents ?? {}));
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

  const assignResidentToSlot = useCallback(
    (slotId: string, residentId: string | null, options?: { silent?: boolean; skipHighlight?: boolean }) => {
      if (!config) {
        updateAssignmentFeedback('Config non caricata, impossibile assegnare.', { silent: options?.silent });
        return false;
      }

      if (!residentId) {
        updateAssignmentFeedback('Seleziona un residente valido da trascinare.', { silent: options?.silent });
        return false;
      }

      const prev = villageStateRef.current;
      if (!prev) {
        updateAssignmentFeedback('Stato del villaggio non pronto.', { silent: options?.silent });
        return false;
      }

      const resident = prev.residents[residentId];
      if (!resident) {
        updateAssignmentFeedback(`Residente ${residentId} non trovato.`, { silent: options?.silent });
        return false;
      }

      const slotDef = config.mapSlots?.[slotId];
      if (!slotDef) {
        updateAssignmentFeedback(`Slot ${slotId} non definito in config.`, { silent: options?.silent });
        return false;
      }

      const candidateActivities = activitiesBySlot[slotId] ?? [];
      if (import.meta.env?.DEV) {
        console.debug('[IdleVillageMap] Drop attempt', {
          slotId,
          residentId,
          candidateCount: candidateActivities.length,
        });
      }
      if (candidateActivities.length === 0) {
        updateAssignmentFeedback('Nessuna activity compatibile per questo slot.', { silent: options?.silent });
        return false;
      }

      let selectedActivity: ActivityDefinition | null = null;
      let lastFailureReason: string | null = null;

      for (const activity of candidateActivities) {
        const validation = validateAssignment({
          resident,
          slot: slotDef,
          activity,
          config,
        });

        if (validation.ok) {
          selectedActivity = activity;
          break;
        }

        if (validation.reason) {
          lastFailureReason = validation.reason;
        }
      }

      if (!selectedActivity) {
        updateAssignmentFeedback(lastFailureReason ?? 'Nessuna activity valida per questo slot.', {
          silent: options?.silent,
        });
        return false;
      }

      const activityMetadata = (selectedActivity.metadata ?? {}) as {
        supportsAutoRepeat?: boolean;
        continuousJob?: boolean;
      };
      const shouldAuto = Boolean(activityMetadata.supportsAutoRepeat || activityMetadata.continuousJob);

      const scheduleResult = scheduleActivity(
        { config, rng: simpleRng },
        prev,
        {
          activityId: selectedActivity.id,
          characterIds: [resident.id],
          slotId,
          isAuto: shouldAuto,
          snapshotDeathRisk: deriveDeathRisk(selectedActivity),
        },
      );

      if (scheduleResult.error) {
        const message =
          scheduleResult.error === 'One or more characters are not available'
            ? `${resident.id} non è disponibile.`
            : `Errore di scheduling: ${scheduleResult.error}`;
        updateAssignmentFeedback(message, { silent: options?.silent });
        return false;
      }

      const nextState = scheduleResult.state;
      villageStateRef.current = nextState;
      setVillageState(nextState);

      const successMessage = `${resident.id} assegnato a ${selectedActivity.label ?? selectedActivity.id}.`;
      updateAssignmentFeedback(successMessage, { silent: options?.silent });

      if (!options?.skipHighlight) {
        setHighlightSlotId(slotId);
        if (highlightTimeoutRef.current !== null) {
          window.clearTimeout(highlightTimeoutRef.current);
        }
        highlightTimeoutRef.current = window.setTimeout(() => {
          setHighlightSlotId((current) => (current === slotId ? null : current));
        }, 2200);
      }

      return true;
    },
    [activitiesBySlot, config, updateAssignmentFeedback],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const controls = {
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      advance: (delta: number) => advanceTimeBy(delta),
      assign: (slotId: string, residentId: string) =>
        assignResidentToSlot(slotId, residentId, { silent: true, skipHighlight: true }),
      getState: () => villageStateRef.current,
      getConfig: () => config ?? null,
      reset: (options?: IdleVillageResetOptions) => bootstrapVillageState(options),
      getAssignmentFeedback: () => lastAssignmentFeedbackRef.current,
    };
    window.__idleVillageControls = controls;
    return () => {
      if (window.__idleVillageControls === controls) {
        delete window.__idleVillageControls;
      }
    };
  }, [advanceTimeBy, assignResidentToSlot, bootstrapVillageState, config, villageState]);

  const canSlotAcceptDrop = useCallback(
    (slotId: string) => {
      return (activitiesBySlot[slotId]?.length ?? 0) > 0;
    },
    [activitiesBySlot],
  );

  const scheduledActivities = useMemo(() => {
    if (!villageState) return [] as ScheduledActivity[];
    return Object.values(villageState.activities ?? {}) as ScheduledActivity[];
  }, [villageState]);

  const activeActivities = useMemo(() => {
    return scheduledActivities
      .filter((activity) => activity.status === 'pending' || activity.status === 'running')
      .sort((a, b) => {
        if (a.endTime === b.endTime) return a.startTime - b.startTime;
        return a.endTime - b.endTime;
      });
  }, [scheduledActivities]);

  const secondsPerTimeUnit = config?.globalRules.secondsPerTimeUnit ?? DEFAULT_SECONDS_PER_TIME_UNIT;
  const dayLengthSetting = config?.globalRules.dayLengthInTimeUnits || 5;

  const getResourceLabel = useCallback(
    (resourceId: string) => {
      const def = config?.resources?.[resourceId];
      return def?.label ?? resourceId;
    },
    [config],
  );

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
  }, [config, villageState, activeActivities, getResourceLabel, secondsPerTimeUnit, dayLengthSetting]);

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

  const combinedVerbsForSlot = useCallback(
    (slotId: string) => {
      const slotVerbs = verbsBySlot[slotId] ?? [];
      const slotOffers = questOffersBySlot[slotId] ?? [];
      return [...slotVerbs, ...slotOffers];
    },
    [verbsBySlot, questOffersBySlot],
  );

  const selectedSlotVerbs = useMemo(() => {
    if (!selectedSlotId) return [] as VerbSummary[];
    return combinedVerbsForSlot(selectedSlotId);
  }, [selectedSlotId, combinedVerbsForSlot]);

  const allVerbSummariesMap = useMemo(() => {
    const map = new Map<string, VerbSummary>();
    scheduledVerbSummaries.forEach((summary) => map.set(summary.key, summary));
    questOfferSummaries.forEach((summary) => map.set(summary.key, summary));
    passiveEffectSummaries.forEach((summary) => map.set(summary.key, summary));
    activityBlueprintSummaries.forEach((summary) => map.set(summary.key, summary));
    return map;
  }, [scheduledVerbSummaries, questOfferSummaries, passiveEffectSummaries, activityBlueprintSummaries]);

  const selectedVerbSummary = useMemo(() => {
    if (selectedVerbKey && allVerbSummariesMap.has(selectedVerbKey)) {
      return allVerbSummariesMap.get(selectedVerbKey)!;
    }
    if (selectedSlotVerbs.length > 0) {
      return selectedSlotVerbs[0];
    }
    return null;
  }, [selectedVerbKey, allVerbSummariesMap, selectedSlotVerbs]);

  const selectedActivityDefinition = useMemo(() => {
    if (!selectedVerbSummary?.activityId || !config?.activities) {
      return null;
    }
    return (config.activities[selectedVerbSummary.activityId] as ActivityDefinition | undefined) ?? null;
  }, [selectedVerbSummary?.activityId, config?.activities]);

  useEffect(() => {
    if (!selectedSlotId) {
      setSelectedVerbKey(null);
      return;
    }
    if (selectedSlotVerbs.length === 0) {
      setSelectedSlotId(null);
      setSelectedVerbKey(null);
      return;
    }
    if (selectedVerbKey && selectedSlotVerbs.some((verb) => verb.key === selectedVerbKey)) {
      return;
    }
    setSelectedVerbKey(selectedSlotVerbs[0].key);
  }, [selectedSlotId, selectedSlotVerbs, selectedVerbKey]);

  const handleCloseTheater = useCallback(() => {
    setSelectedSlotId(null);
    setSelectedVerbKey(null);
  }, []);

  const handleLocationHoverIntent = useCallback((id: string) => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredLocationId(id);
      console.log('Hovered location:', id); // telemetry
    }, 500);
  }, []);

  const handleLocationHoverLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredLocationId(null);
  }, []);

  const handleSelectVerb = useCallback((slotId: string, verb: VerbSummary | null) => {
    setSelectedSlotId(slotId);
    setSelectedVerbKey(verb?.key ?? null);
  }, []);

  const handleFocusSlot = useCallback(
    (slotId: string) => {
      setSelectedSlotId(slotId);
      const verbs = combinedVerbsForSlot(slotId);
      if (verbs.length > 0) {
        setSelectedVerbKey((current) => (current && verbs.some((verb) => verb.key === current) ? current : verbs[0].key));
      } else {
        setSelectedVerbKey(null);
      }
    },
    [combinedVerbsForSlot],
  );

  const handleHudSelectSummary = useCallback((summary: VerbSummary) => {
    if (!summary) return;
    if (summary.slotId) {
      setSelectedSlotId(summary.slotId);
    }
    setSelectedVerbKey(summary.key);
  }, []);

  const selectedSlotDefinition = selectedSlotId ? config?.mapSlots?.[selectedSlotId] ?? null : null;

  const hoveredSlotDefinition = hoveredLocationId ? config?.mapSlots?.[hoveredLocationId] ?? null : null;

  const hoveredSlotVerbs = useMemo(() => {
    if (!hoveredLocationId) return [] as VerbSummary[];
    return combinedVerbsForSlot(hoveredLocationId);
  }, [hoveredLocationId, combinedVerbsForSlot]);

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

  const handleResidentDragStart = useCallback(
    (residentId: string) => (event: React.DragEvent<HTMLElement>) => {
      console.log('Drag iniziato:', residentId);
      event.dataTransfer.setData('text/resident-id', residentId);
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

  const compatibleSlotIds = useMemo(() => {
    if (!draggingResidentId || !villageState || !config) return new Set<string>();
    const resident = villageState.residents[draggingResidentId];
    if (!resident) return new Set<string>();
    const slotsRecord = config.mapSlots ?? {};
    const result = new Set<string>();
    Object.entries(slotsRecord).forEach(([slotId, slotDef]) => {
      const candidateActivities = activitiesBySlot[slotId] ?? [];
      const canAssign = candidateActivities.some((activity) =>
        validateAssignment({
          resident,
          slot: slotDef,
          activity,
          config,
        }).ok,
      );
      if (canAssign) {
        result.add(slotId);
      }
    });
    return result;
  }, [activitiesBySlot, config, draggingResidentId, villageState]);

  const selectedSlotDropStates = useMemo<Record<string, DropState>>(() => {
    if (!draggingResidentId) return {};
    const states: Record<string, DropState> = {};
    selectedSlotVerbs.forEach((verb) => {
      const key = verb.slotId ?? verb.key;
      if (!verb.slotId) {
        states[key] = 'invalid';
        return;
      }
      states[key] = compatibleSlotIds.has(verb.slotId) ? 'valid' : 'invalid';
    });
    return states;
  }, [draggingResidentId, selectedSlotVerbs, compatibleSlotIds]);

  const hoveredSlotDropStates = useMemo<Record<string, DropState>>(() => {
    if (!draggingResidentId) return {};
    const states: Record<string, DropState> = {};
    hoveredSlotVerbs.forEach((verb) => {
      const key = verb.slotId ?? verb.key;
      if (!verb.slotId) {
        states[key] = 'invalid';
        return;
      }
      states[key] = compatibleSlotIds.has(verb.slotId) ? 'valid' : 'invalid';
    });
    return states;
  }, [draggingResidentId, hoveredSlotVerbs, compatibleSlotIds]);

  const handleDropResident = useCallback(
    (slotId: string | null, residentId: string | null) => {
      if (!slotId) return;
      const resolvedResidentId = residentId ?? draggingResidentId;
      setIsResidentDragActive(false);
      setDraggingResidentId(null);
      setLastDropSlotId(slotId);
      assignResidentToSlot(slotId, resolvedResidentId ?? null);
    },
    [assignResidentToSlot, draggingResidentId],
  );

  const handleTheaterVerbDrop = useCallback(
    (verb: VerbSummary, residentId: string | null) => {
      const targetSlot = verb.slotId ?? selectedSlotId;
      if (!targetSlot) return;
      handleDropResident(targetSlot, residentId);
    },
    [handleDropResident, selectedSlotId],
  );

  const handleResolveActivity = useCallback(
    (scheduledId: string) => {
      if (!config) return;
      const prev = villageStateRef.current;
      if (!prev) return;

      const resolution = resolveActivityOutcome({ config, rng: simpleRng }, prev, scheduledId);
      villageStateRef.current = resolution.state;
      setVillageState(resolution.state);

      const outcome = resolution.outcome;
      if (!outcome) {
        return;
      }

      const fallenIds = outcome.fallen.map((entry) => entry.characterId);
      const heroizedIds = outcome.heroizedIds;

      if (fallenIds.length > 0) {
        const message = `Caduti: ${fallenIds.join(', ')}`;
        setAssignmentFeedback(message);
        showToast(message, 'error');
        return;
      }

      if (heroizedIds.length > 0) {
        const message = `Nuovi eroi: ${heroizedIds.join(', ')}`;
        setAssignmentFeedback(message);
        showToast(message, 'success');
        return;
      }

      const neutralMessage = outcome.autoRescheduledId ? 'Attività riavviata automaticamente' : 'Attività risolta';
      setAssignmentFeedback(neutralMessage);
      showToast(neutralMessage, 'info');
    },
    [config, setAssignmentFeedback, showToast],
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
  const cycleIcon = isPlaying ? (isDayPhase ? '☀️' : '🌙') : '❚❚';
  const cyclePhaseLabel = isDayPhase ? 'Fase giorno' : 'Fase notte';

  return (
    <>
      <div
        className="min-h-screen bg-[radial-gradient(circle_at_top,#020617_0,#020617_55%,#000000_100%)] text-ivory flex items-center"
        style={{ perspective: '2000px' }}
      >
        <section
          className="relative w-full aspect-video max-w-6xl mx-auto"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${idleVillageMap})`,
            }}
          >
            <ActiveActivityHUD
              activities={scheduledActivities}
              config={config}
              currentTime={villageState.currentTime}
              secondsPerTimeUnit={secondsPerTimeUnit}
              dayLength={dayLengthSetting}
              residents={villageState.residents}
              getResourceLabel={getResourceLabel}
              onResolve={handleResolveActivity}
              className="pointer-events-auto"
              selectedSummaryId={selectedVerbKey}
              onSelectSummary={handleHudSelectSummary}
            />
            <div className="pointer-events-auto w-72 max-w-full flex flex-col gap-4">
              <QuestDetailPanel
                summary={selectedVerbSummary}
                activity={selectedActivityDefinition ?? undefined}
                config={config ?? null}
              />
              <div className="rounded-2xl bg-black/70 border border-white/10 px-4 py-3 text-center flex flex-col items-center gap-1">
                <MarbleMedallionCard
                  title={cyclePhaseLabel}
                  icon={cycleIcon}
                  progress={cycleProgressFraction}
                  isActive={isPlaying}
                  tone={isDayPhase ? 'day' : 'night'}
                  onClick={() => setIsPlaying((prev) => !prev)}
                />
                <div className="text-[9px] uppercase tracking-[0.2em] text-slate-200">
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

          <div className="absolute inset-0 z-10 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
            {mapSlotLayout.map(({ slot, left, top }) => {
              const combined = combinedVerbsForSlot(slot.id);
              const canAcceptDrop = canSlotAcceptDrop(slot.id);
              const isActiveDropTarget = Boolean(draggingResidentId && compatibleSlotIds.has(slot.id));

              if (combined.length <= 2) {
                return (
                  <MapSlotVerbCluster
                    key={slot.id}
                    slot={slot}
                    left={left}
                    top={top}
                    verbs={combined}
                    cardScale={cardScale}
                    isDropMode={isResidentDragActive}
                    canAcceptDrop={canAcceptDrop}
                    isActiveDropTarget={isActiveDropTarget}
                    isHighlighted={highlightSlotId === slot.id}
                    isSelected={selectedSlotId === slot.id}
                    onDropResident={handleDropResident}
                    onSelectSlot={handleFocusSlot}
                    onSelectVerb={handleSelectVerb}
                  />
                );
              }

              return (
                <MapLocationSlot
                  key={slot.id}
                  slot={slot}
                  left={left}
                  top={top}
                  verbs={combined}
                  isSelected={selectedSlotId === slot.id}
                  isDropMode={isResidentDragActive}
                  isActiveDropTarget={isActiveDropTarget}
                  isHighlighted={highlightSlotId === slot.id}
                  canAcceptDrop={canAcceptDrop}
                  onSelect={handleFocusSlot}
                  onDropResident={handleDropResident}
                  onSelectVerb={handleSelectVerb}
                  onHoverIntent={handleLocationHoverIntent}
                  onHoverLeave={handleLocationHoverLeave}
                />
              );
            })}
          </div>
        </section>
      </div>
      {(selectedSlotId && selectedSlotDefinition) || (hoveredLocationId && hoveredSlotDefinition) ? (
        <TheaterView
          slotLabel={selectedSlotDefinition?.label ?? hoveredSlotDefinition?.label ?? hoveredLocationId ?? ''}
          slotIcon={selectedSlotDefinition?.icon ?? hoveredSlotDefinition?.icon}
          verbs={selectedSlotVerbs.length > 0 ? selectedSlotVerbs : hoveredSlotVerbs}
          onClose={handleCloseTheater}
          acceptResidentDrop={Boolean(
            isResidentDragActive && draggingResidentId && compatibleSlotIds.has(selectedSlotId ?? hoveredLocationId ?? ''),
          )}
          onResidentDrop={(residentId) => handleDropResident(selectedSlotId ?? hoveredLocationId ?? null, residentId)}
          onAssignResident={(slotId, residentId) => handleDropResident(slotId, residentId)}
          slotDropStates={selectedSlotDropStates || hoveredSlotDropStates}
          onVerbDrop={handleTheaterVerbDrop}
        />
      ) : null}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
export default IdleVillageMapPage;
