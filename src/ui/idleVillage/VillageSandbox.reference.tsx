/**
 * @reference VillageSandbox legacy implementation (frozen 2025-12-31).
 * Keep this file read-only for consultation during the skeleton rebuild.
 */
// @ts-nocheck
/* eslint-disable */
import { useMemo, useState, useEffect, useCallback, useRef, Fragment } from 'react';
import type { ActivityDefinition, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import {
  createVillageStateFromConfig,
  evaluateActivityDuration,
  type ResidentState,
  type VillageResources,
  type VillageState,
} from '@/engine/game/idleVillage/TimeEngine';
import { loadResidentsFromCharacterManager } from '@/engine/game/idleVillage/characterImport';
import LocationCard from '@/ui/idleVillage/components/LocationCard';
import ActivitySlotCard, { type DropState } from '@/ui/idleVillage/components/ActivitySlot';
import ActivityCardDetail, { type ActivityCardMetric } from '@/ui/idleVillage/components/ActivityCardDetail';
import DragTestContainer from '@/ui/idleVillage/components/DragTestContainer';
import { ActionCardWrapper } from '@/ui/idleVillage/components/ActionCardWrapper';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import LocationDetail from '@/ui/idleVillage/components/LocationDetail';
import ActiveHUD from '@/ui/idleVillage/components/ActiveHUD';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { useAsyncVillageStateStore } from '@/ui/idleVillage/hooks/useAsyncVillageStateStore';
import { useDragContext } from '@/ui/idleVillage/components/DragContextStore';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';
import {
  DEFAULT_SECONDS_PER_TIME_UNIT,
  deriveRisk,
  deriveVisualVariant,
} from '@/ui/idleVillage/verbSummaries';
import { VillageSandboxHeader } from '@/ui/idleVillage/components/VillageSandboxHeader';
import ResourcePanel, { type ResourcePanelItem } from '@/ui/idleVillage/components/ResourcePanel';
import TradeRoutePanel from '@/ui/idleVillage/components/TradeRoutePanel';
import MigrationQueuePanel from '@/ui/idleVillage/components/MigrationQueuePanel';
import QuestTelemetryPanel from '@/ui/idleVillage/components/QuestTelemetryPanel';
import {
  useActivityScheduler,
  type ActivityResolutionResult,
  type ScheduledActivityState,
} from '@/ui/idleVillage/hooks/useActivityScheduler';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import DemoPanel from '@/ui/idleVillage/components/demo/DemoPanel';
import { useSandboxDemoPanel } from '@/ui/idleVillage/hooks/useSandboxDemoPanel';
import type { DemoPanelState, DemoRequirement } from '@/ui/idleVillage/hooks/useSandboxDemoPanel';
import type { MigrationRequest } from '@/ui/idleVillage/state/VillageRegistry';

export interface ActivitySlotData {
  slotId: string;
  label: string;
  iconName: string;
  assignedWorkerId: string | null;
  activity: ActivityDefinition;
  mapSlotLabel?: string;
  visualVariant: VerbVisualVariant;
}

type SandboxVerbTone = 'neutral' | 'job' | 'quest' | 'danger' | 'system';
interface DetailContext {
  slotId: string;
  slot: ActivitySlotData;
  activity: ActivityDefinition;
  summary?: VerbSummary | null;
}

type DemoPanelHandlerName = 'setRequirement' | 'onSlotDrop' | 'onSlotClear' | 'onRemoveAll' | 'onStart';

interface IdleVillageTestHooks {
  seedResidents: (residents: ResidentState[]) => void;
  invokeDemoHandler?: (handlerName: DemoPanelHandlerName, ...args: unknown[]) => void;
  advanceTimeUnits?: (deltaUnits: number) => void;
  assignResidentToActivity?: (activityId: string, residentId: string) => void;
  getManagedActivityHandles?: () => {
    jobActivityId: string | null;
    questActivityId: string | null;
    residentIds: string[];
  };
  seedTradeRoutes?: (routes: TradeRoute[], lastResult?: TradeResult) => void;
  seedMigrationQueue?: (requests: MigrationRequest[]) => void;
}

declare global {
  interface Window {
    __idleVillageTestHooks?: IdleVillageTestHooks;
    __ENABLE_IDLE_VILLAGE_TEST_HOOKS?: boolean;
  }
}

const IS_TEST_ENV =
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
  (typeof import.meta !== 'undefined' && typeof import.meta.env?.MODE === 'string' && import.meta.env.MODE === 'test');

type ActivitySchedulerBridge = {
  canAssignResident: (residentId: string, activityId: string) => boolean;
  getActivityState: (activityId: string, residentId: string) => ScheduledActivityState | null;
};

interface DetailPanelCardProps {
  slotId: string;
  slot: ActivitySlotData;
  activity: ActivityDefinition;
  slotAssignments: Record<string, string | null>;
  residents: Record<string, ResidentState>;
  secondsPerTimeUnit: number;
  draggingResidentId: string | null;
  scheduler: ActivitySchedulerBridge;
  onWorkerDrop: (activityId: string, residentId: string | null, options?: { autoStart?: boolean }) => void;
  onStart: (slotId: string) => boolean | void;
  onClose: (slotId: string) => void;
}

const SLOT_DELIMITER = '-slot-';
const getPrimarySlotId = (activityId: string) => activityId;
const extractActivityIdFromSlot = (slotId: string) => {
  const index = slotId.indexOf(SLOT_DELIMITER);
  return index === -1 ? slotId : slotId.slice(0, index);
};
const deriveAssignmentsForActivity = (
  assignments: Record<string, string | null>,
  activityId: string,
): Record<string, string | null> => {
  const primarySlotId = getPrimarySlotId(activityId);
  const entries = Object.entries(assignments).filter(
    ([slotId]) => extractActivityIdFromSlot(slotId) === activityId,
  );
  if (entries.length === 0) {
    return { [primarySlotId]: assignments[primarySlotId] ?? null };
  }
  return entries.reduce<Record<string, string | null>>((acc, [slotId, residentId]) => {
    acc[slotId] = residentId ?? null;
    return acc;
  }, {});
};

const isQuestActivity = (activity: ActivityDefinition) => activity.tags?.includes('quest') ?? false;

const DetailPanelCard: React.FC<DetailPanelCardProps> = ({
  slotId,
  slot,
  activity,
  slotAssignments,
  residents,
  secondsPerTimeUnit,
  draggingResidentId,
  scheduler,
  onWorkerDrop,
  onStart,
  onClose,
}) => {
  const activityAssignments = useMemo(
    () => deriveAssignmentsForActivity(slotAssignments, activity.id),
    [slotAssignments, activity.id],
  );

  const controller = useResidentSlotController({
    activity,
    assignments: activityAssignments,
    residents,
    hoveredResidentId: draggingResidentId,
    scheduler,
    onAssign: (resolvedSlotId, residentId) => {
      onWorkerDrop(extractActivityIdFromSlot(resolvedSlotId), residentId, { autoStart: false });
    },
    onClear: (resolvedSlotId) => {
      onWorkerDrop(extractActivityIdFromSlot(resolvedSlotId), null, { autoStart: false });
    },
  });

  const risk = useMemo(() => deriveRisk(activity), [activity]);
  const metrics = useMemo<ActivityCardMetric[]>(() => {
    return [
      {
        id: 'engine',
        label: 'Engine',
        value: activity.resolutionEngineId ?? '—',
        tone: 'neutral',
      },
      {
        id: 'danger',
        label: 'Danger',
        value: String(activity.dangerRating ?? '—'),
        tone: activity.dangerRating && activity.dangerRating > 2 ? 'warning' : 'neutral',
      },
    ];
  }, [activity]);

  const durationSeconds = useMemo(() => {
    const durationUnits = evaluateActivityDuration(activity);
    return durationUnits * secondsPerTimeUnit;
  }, [activity, secondsPerTimeUnit]);

  const slotProgress = controller.getSlotProgress(slotId);

  const handleDropResident = useCallback(
    (targetSlotId: string, residentId: string | null) => {
      onWorkerDrop(extractActivityIdFromSlot(targetSlotId), residentId, { autoStart: false });
    },
    [onWorkerDrop],
  );

  const handleRemoveResident = useCallback(
    (targetSlotId: string) => {
      onWorkerDrop(extractActivityIdFromSlot(targetSlotId), null, { autoStart: false });
    },
    [onWorkerDrop],
  );

  const handleStart = useCallback(() => onStart(slotId), [onStart, slotId]);
  const handleClose = useCallback(() => onClose(slotId), [onClose, slotId]);
  const isStartDisabled = !controller.slots.some((slotModel) => slotModel.assignedResidentId);

  return (
    <ActivityCardDetail
      activity={activity}
      slotLabel={slot.label ?? activity.label ?? slotId}
      preview={{
        rewards: activity.rewards ?? [],
        injuryPercentage: risk.injury,
        deathPercentage: risk.death,
      }}
      slotViewModels={controller.slots}
      rewards={activity.rewards ?? []}
      metrics={metrics}
      durationSeconds={durationSeconds}
      elapsedSeconds={slotProgress?.elapsedSeconds ?? 0}
      onStart={handleStart}
      onClose={handleClose}
      onDropResident={handleDropResident}
      onRemoveResident={handleRemoveResident}
      isStartDisabled={isStartDisabled}
      draggingResidentId={draggingResidentId}
    />
  );
};

const deriveVerbToneLegacy = (activity: ActivityDefinition): SandboxVerbTone => {
  if (activity.tags?.includes('quest')) return 'quest';
  if (activity.tags?.includes('job')) return 'job';
  if (activity.tags?.includes('danger')) return 'danger';
  if (activity.tags?.includes('system')) return 'system';
  return 'neutral';
};

const formatRewardLabelLegacy = (activity: ActivityDefinition): string | null => {
  if (!activity.rewards || activity.rewards.length === 0) return null;
  return activity.rewards
    .map((reward) => {
      const amount = reward.amountFormula ?? '';
      return [amount, reward.resourceId].filter(Boolean).join(' ');
    })
    .join(', ');
};

const buildSandboxQuestSummaryLegacy = (params: {
  slot: ActivitySlotData;
  activity: ActivityDefinition;
  assignedName: string | null;
  progressFraction: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
}): VerbSummary => {
  const { slot, activity, assignedName, progressFraction, elapsedSeconds, totalDurationSeconds } = params;
  const tone = deriveVerbToneLegacy(activity);
  const injuryPercentage = Math.min(100, (activity.dangerRating ?? 1) * 15);
  const deathPercentage = Math.round(injuryPercentage / 2);
  const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

  return {
    key: `sandbox_quest_${slot.slotId}`,
    source: 'system',
    activityId: activity.id,
    slotId: slot.slotId,
    label: activity.label ?? slot.slotId,
    kindLabel: tone === 'quest' ? 'Quest' : tone === 'danger' ? 'Encounter' : 'Activity',
    isQuest: tone === 'quest',
    isJob: tone === 'job',
    icon: slot.iconName,
    visualVariant: slot.visualVariant,
    progressStyle: 'halo',
    progressFraction,
    elapsedSeconds,
    totalDurationSeconds,
    remainingSeconds,
    injuryPercentage,
    deathPercentage,
    assignedCount: slot.assignedWorkerId ? 1 : 0,
    totalSlots:
      typeof activity.maxSlots === 'number'
        ? activity.maxSlots
        : activity.maxSlots === 'infinite'
          ? 4
          : 1,
    rewardLabel: formatRewardLabelLegacy(activity),
    tone,
    deadlineLabel: null,
    assigneeNames: assignedName ? [assignedName] : [],
    autoState: null,
  };
};

const useVirtualization = (params: {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) => {
  const { itemCount, itemHeight, containerHeight, overscan = 3 } = params;
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    onScroll: useCallback((event: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(event.currentTarget.scrollTop);
    }, []),
  };
};

const simpleRng = (seed = Date.now()) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const formatRewardSummary = (
  rewards: ResourceDeltaDefinition[],
  resourceLookup: ActivityDefinition['metadata'] extends never ? Record<string, string> : Record<string, string>,
): string | null => {
  if (!rewards || rewards.length === 0) return null;
  const parts = rewards.map((reward) => {
    const amount = reward.amountFormula ?? '';
    const label = resourceLookup[reward.resourceId] ?? reward.resourceId;
    return `${amount} ${label}`.trim();
  });
  return parts.length > 0 ? `Ricompense: ${parts.join(', ')}` : null;
};

const VillageSandboxContent = () => {
  const { activePreset, presets, setPreset, randomizeTheme, resetRandomization, isRandomized } = useThemeSwitcher();
  const { config } = useIdleVillageConfig();
  const { activeId: draggingResidentId, setActiveId } = useDragContext();
  const mapContext = useMapContext();
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);
  const [slotAssignments, setSlotAssignments] = useState<Record<string, string | null>>({});
  const [detailPanelSlotIds, setDetailPanelSlotIds] = useState<string[]>([]);
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [theaterPreviewIds, setTheaterPreviewIds] = useState<string[]>([]);
  const [theaterCloseTimeout, setTheaterCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isCyclePlaying, setIsCyclePlaying] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);

  const initialResidents = useMemo(() => {
    const residents = loadResidentsFromCharacterManager({ config });
    if (residents.length === 0) {
      // Fallback: create a default resident
      const fallbackFatigue = getStartingResidentFatigue(config);
      residents.push({
        id: 'default-founder',
        displayName: 'Founder',
        currentHp: 100,
        maxHp: 100,
        fatigue: fallbackFatigue,
        status: 'available',
        isHero: false,
        isInjured: false,
        statSnapshot: { hp: 100, damage: 10, agility: 10 },
        statTags: ['founder'],
        survivalCount: 0,
        survivalScore: 0,
      });
    }
    return residents;
  }, [config]);
  const {
    state: villageState,
    resetState
  } = useAsyncVillageStateStore(() =>
    createVillageStateFromConfig({ config, initialResidents }),
  );

  // Activity completion handler
  const handleActivityComplete = useCallback(
    (result: ActivityResolutionResult) => {
      console.log('Activity completed:', result);

      const resident = villageState.residents[result.residentId];
      const residentLabel = resident ? formatResidentLabel(resident) : result.residentId;
      const activityLabel = config.activities?.[result.activityId]?.label ?? result.activityId;

      let feedbackMessage: string;
      if (result.success) {
        const resourceLookup = Object.fromEntries(
          Object.entries(config.resources ?? {}).map(([id, resource]) => [id, resource.label ?? id]),
        );
        const rewardSummary = formatRewardSummary(result.rewards, resourceLookup);
        feedbackMessage = rewardSummary
          ? `${residentLabel} ha completato ${activityLabel}! ${rewardSummary}`
          : `${residentLabel} ha completato ${activityLabel}!`;
      } else {
        const fallenCount = result.outcome.fallen.length;
        if (fallenCount > 0) {
          feedbackMessage = `${residentLabel} è morto durante ${activityLabel}!`;
        } else {
          feedbackMessage = `${residentLabel} ha fallito ${activityLabel}.`;
        }
      }
      setAssignmentFeedback(feedbackMessage);

      setSlotAssignments((prev) => {
        const slotId = getPrimarySlotId(result.activityId);
        if (prev[slotId] !== result.residentId) {
          return prev;
        }
        return { ...prev, [slotId]: null };
      });
    },
    [villageState.residents, config.activities, config.resources],
  );

  // Resource change handler
  const handleResourcesChange = useCallback((resources: VillageResources, changes: any[]) => {
    console.log('Resources changed:', resources, changes);
    // Update UI to show resource changes
    // This could trigger a toast or update a resource display
  }, []);

  // Resident state change handler
  const handleResidentStateChange = useCallback((residentId: string, newState: Partial<VillageState['residents'][string]>) => {
    console.log('Resident state changed:', residentId, newState);
    // The village state is already updated by the scheduler
    // This can be used for additional UI updates
  }, []);

  // Pre-calculate day/night phase from villageState for scheduler initialization
  const secondsPerTimeUnit = config.globalRules.secondsPerTimeUnit ?? DEFAULT_SECONDS_PER_TIME_UNIT;
  const dayLengthSetting = config.globalRules.dayLengthInTimeUnits || 5;
  const dayNightSettings = config.globalRules.dayNightCycle ?? {
    dayTimeUnits: dayLengthSetting,
    nightTimeUnits: dayLengthSetting,
  };
  const dayTimeUnits = Math.max(1, dayNightSettings.dayTimeUnits ?? dayLengthSetting);
  const nightTimeUnits = Math.max(1, dayNightSettings.nightTimeUnits ?? dayLengthSetting);
  const totalCycleUnits = dayTimeUnits + nightTimeUnits;

  // Compute preliminary phase from villageState (before scheduler)
  const preliminaryCurrentTimeUnits = villageState.currentTime ?? 0;
  const preliminaryCycleUnit = totalCycleUnits > 0 ? preliminaryCurrentTimeUnits % totalCycleUnits : 0;
  const preliminaryIsDayPhase = preliminaryCycleUnit < dayTimeUnits;

  // Initialize activity scheduler with preliminary phase
  const activityScheduler = useActivityScheduler({
    config,
    initialVillageState: villageState,
    isDayPhase: preliminaryIsDayPhase,
    onActivityComplete: handleActivityComplete,
    onResourcesChange: handleResourcesChange,
    onResidentStateChange: handleResidentStateChange,
  });

  const activities = useMemo<ActivityDefinition[]>(() => Object.values(config.activities ?? {}), [config.activities]);
  const schedulerVillageState = activityScheduler.villageState;
  const sandboxState = schedulerVillageState ?? villageState;
  const showcaseActivities = useMemo<ActivityDefinition[]>(() => {
    const sorted = [...activities].sort((a, b) => (a.label ?? a.id).localeCompare(b.label ?? b.id));
    return sorted.slice(0, 3);
  }, [activities]);
  const questShowcaseActivity = useMemo<ActivityDefinition | null>(() => {
    return activities.find((activity) => activity.tags?.includes('quest')) ?? null;
  }, [activities]);
  const managedActivities = useMemo<ActivityDefinition[]>(() => {
    const map = new Map<string, ActivityDefinition>();
    showcaseActivities.forEach((activity) => map.set(activity.id, activity));
    if (questShowcaseActivity) {
      map.set(questShowcaseActivity.id, questShowcaseActivity);
    }
    return Array.from(map.values());
  }, [showcaseActivities, questShowcaseActivity]);
  const residents = useMemo(() => {
    const source = sandboxState.residents ?? {};
    return Object.values(source)
      .filter((resident) => resident.status !== 'dead')
      .map((resident) => ({
        ...resident,
        // Cache sort key to avoid recalculating during sorting
        _sortKey: (() => {
          const rank = (() => {
            if (resident.isInjured) return 3;
            switch (resident.status) {
              case 'available':
                return 0;
              case 'away':
                return 1;
              case 'exhausted':
                return 4;
              default:
                return 5;
            }
          })();
          const label = formatResidentLabel(resident);
          return `${rank.toString().padStart(2, '0')}_${label}`;
        })(),
      }))
      .sort((a, b) => a._sortKey.localeCompare(b._sortKey));
  }, [schedulerVillageState?.residents, villageState.residents]);
  const selectedResident = useMemo(
    () => residents.find((resident) => resident.id === selectedResidentId) ?? null,
    [residents, selectedResidentId],
  );

  // Day/night cycle calculations using latest sandboxState
  const currentTimeUnits = sandboxState.currentTime ?? 0;
  const currentCycleUnit = totalCycleUnits > 0 ? currentTimeUnits % totalCycleUnits : 0;
  const cycleProgressFraction = totalCycleUnits > 0 ? currentCycleUnit / totalCycleUnits : 0;
  const isDayPhase = currentCycleUnit < dayTimeUnits;
  const cyclePhaseLabel = isDayPhase ? 'Fase giorno' : 'Fase notte';
  const cyclePhaseIcon = isDayPhase ? '☀️' : '🌙';
  const cycleVariant: VerbVisualVariant = isDayPhase ? 'solar' : 'amethyst';
  const totalCycleSeconds = totalCycleUnits * secondsPerTimeUnit;
  const cycleElapsedSeconds = cycleProgressFraction * totalCycleSeconds;

  const refreshResidentsFromCharacterManager = useCallback(async () => {
    const latestResidents = loadResidentsFromCharacterManager({ config });
    if (latestResidents.length === 0) return;
    await resetState(
      () =>
        createVillageStateFromConfig({
          config,
          initialResidents: latestResidents,
        }),
      'VillageSandbox resident refresh',
    );
  }, [config, resetState]);

  useEffect(() => {
    if (residents.length === 0) {
      const latest = loadResidentsFromCharacterManager({ config });
      if (latest.length > 0) {
        (async () => {
          await resetState(
            () =>
              createVillageStateFromConfig({
                config,
                initialResidents: latest,
              }),
            'VillageSandbox auto-import residents',
          );
        })();
      }
      return;
    }
    const hasLegacyFounderNames = residents.some(
      (resident) => !resident.displayName && resident.id?.startsWith('founder-'),
    );
    if (hasLegacyFounderNames) {
      refreshResidentsFromCharacterManager();
    }
  }, [config, residents.length, resetState, refreshResidentsFromCharacterManager]);

  useEffect(() => {
    const latestResidents = loadResidentsFromCharacterManager({ config });
    if (latestResidents.length > residents.length) {
      (async () => {
        await resetState(
          () =>
            createVillageStateFromConfig({
              config,
              initialResidents: latestResidents,
            }),
          'VillageSandbox sync residents',
        );
      })();
    }
  }, [config, residents.length, resetState]);


  useEffect(() => {
    setSlotAssignments((prev) => {
      let changed = false;
      const next: Record<string, string | null> = { ...prev };
      managedActivities.forEach((activity) => {
        const primarySlotId = getPrimarySlotId(activity.id);
        if (next[primarySlotId] === undefined) {
          next[primarySlotId] = prev[activity.id] ?? null;
          changed = true;
        }
        if (next[activity.id] !== undefined) {
          if (next[primarySlotId] == null && next[activity.id] != null) {
            next[primarySlotId] = next[activity.id];
          }
          delete next[activity.id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [managedActivities]);

  // Split slot calculations into focused memoizations
  const dayNightSlot = useMemo<ActivitySlotData>(() => ({
    slotId: 'day-night-cycle',
    label: `${cyclePhaseLabel} · ${isCyclePlaying ? 'In esecuzione' : 'In pausa'}`,
    iconName: isCyclePlaying ? cyclePhaseIcon : '⏸️',
    assignedWorkerId: null,
    activity: {
      id: 'day-night-cycle',
      label: cyclePhaseLabel,
      description: 'Ciclo giorno/notte',
      tags: ['system'],
      slotTags: [],
      resolutionEngineId: 'system',
      durationFormula: String(totalCycleSeconds),
      metadata: {},
      rewards: [],
    },
    visualVariant: cycleVariant,
  }), [cyclePhaseLabel, cyclePhaseIcon, totalCycleSeconds, isCyclePlaying, cycleVariant]);

  const activitySlots = useMemo<ActivitySlotData[]>(() => {
    return managedActivities.map((activity) => {
      const meta = (activity.metadata ?? {}) as { icon?: string; mapSlotId?: string } | undefined;
      const mapSlot = meta?.mapSlotId ? config.mapSlots?.[meta.mapSlotId] : undefined;
      const derivedIcon =
        activity.id === questShowcaseActivity?.id ? '⚔️' : meta?.icon ?? mapSlot?.icon ?? '☆';
      return {
        slotId: activity.id,
        label: activity.label ?? activity.id,
        iconName: derivedIcon,
        assignedWorkerId: slotAssignments[activity.id] ?? null,
        activity,
        mapSlotLabel: mapSlot?.label,
        visualVariant: deriveVisualVariant(activity),
      };
    });
  }, [managedActivities, questShowcaseActivity?.id, slotAssignments, config.mapSlots]);

  const slots = useMemo<ActivitySlotData[]>(() => {
    return [dayNightSlot, ...activitySlots];
  }, [dayNightSlot, activitySlots]);

  const activeSlots = useMemo(() => {
    return slots
      .map(slot => {
        if (slot.slotId === 'day-night-cycle') return null;
        if (!slot.assignedWorkerId) return null;
        const state = activityScheduler.getActivityState(slot.slotId, slot.assignedWorkerId);
        if (!state || state.progress <= 0) return null;
        return { slot, state };
      })
      .filter((entry): entry is { slot: ActivitySlotData; state: ScheduledActivityState } => entry !== null);
  }, [slots, activityScheduler]);


  useEffect(() => {
    if (isCyclePlaying) {
      activityScheduler.resumeTimer();
    } else {
      activityScheduler.pauseTimer();
    }
  }, [isCyclePlaying, activityScheduler]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      event.preventDefault();
      setIsCyclePlaying((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setDetailPanelSlotIds((prev) => prev.filter((slotId) => slots.some((slot) => slot.slotId === slotId)));
  }, [slots]);

  const openDetailPanel = useCallback((slotId: string) => {
    setDetailPanelSlotIds((prev) => {
      if (prev.includes(slotId)) {
        return [...prev.filter((id) => id !== slotId), slotId];
      }
      return [...prev, slotId];
    });
  }, []);

  const closeDetailPanel = useCallback((slotId: string) => {
    setDetailPanelSlotIds((prev) => prev.filter((id) => id !== slotId));
  }, []);

  const theaterPreviewSlots = useMemo<ActivitySlotData[]>(() => {
    return theaterPreviewIds
      .map((slotId) => slots.find((slot) => slot.slotId === slotId) ?? null)
      .filter((slot): slot is ActivitySlotData => Boolean(slot));
  }, [theaterPreviewIds, slots]);
  const theaterPrimarySlot = theaterPreviewSlots[0] ?? null;

  const startSlotActivity = useCallback(
    (slotId: string, residentOverride?: string | null) => {
      if (!theaterPrimarySlot) {
        setAssignmentFeedback('Apri la card attività prima di iniziare.');
        return false;
      }
      const slotAssignment = slots.find((slot) => slot.slotId === theaterPrimarySlot.slotId);
      const assignedResidentId =
        residentOverride ?? slotAssignments[theaterPrimarySlot.slotId] ?? slotAssignment?.assignedWorkerId ?? null;
      if (!assignedResidentId) {
        setAssignmentFeedback('Assegna un residente prima di iniziare l’attività.');
        return false;
      }
      const residentName = assignedResidentId ? formatResidentLabel(sandboxState.residents[assignedResidentId]) : null;
      if (!residentName) {
        setAssignmentFeedback('Assegna un residente prima di iniziare l’attività.');
        return false;
      }
      const activity = config.activities?.[slotId];
      // Fix: Calculate duration in seconds using shared helper and config
      const durationUnits = activity ? evaluateActivityDuration(activity) : 0;
      const duration = durationUnits > 0 ? durationUnits * secondsPerTimeUnit : 90;
      const success = activityScheduler.startActivity(slotId, assignedResidentId, duration);
      if (success) {
        setAssignmentFeedback(`${residentName} ha iniziato ${activity?.label ?? slotId}.`);
        return true;
      }
      setAssignmentFeedback(`Impossibile iniziare ${activity?.label ?? slotId}.`);
      return false;
    },
    [slotAssignments, slots, config.activities, activityScheduler, theaterPrimarySlot, sandboxState.residents, config.globalRules.secondsPerTimeUnit],
  );

  const handleWorkerDrop = useCallback(
    (activityId: string, residentId: string | null, options?: { autoStart?: boolean }) => {
      const autoStart = options?.autoStart ?? true;
      const activity = config.activities?.[activityId];

      if (!residentId) {
        setSlotAssignments((prev) => {
          const next = { ...prev };
          next[activityId] = null;
          return next;
        });
        setAssignmentFeedback(`Slot ${activity?.label ?? activityId} liberato.`);
        return;
      }

      if (!activityScheduler.canAssignResident(residentId, activityId)) {
        setAssignmentFeedback(`Impossibile assegnare ${formatResidentLabel(sandboxState.residents[residentId])} a questa attività.`);
        return;
      }

      setSlotAssignments((prev) => {
        const next: Record<string, string | null> = {};
        Object.entries(prev).forEach(([slotId, current]) => {
          next[slotId] = current === residentId ? null : current;
        });
        next[getPrimarySlotId(activityId)] = residentId;
        return next;
      });

      if (autoStart) {
        setIsCyclePlaying(true); // Auto-start cycle when activity begins
        startSlotActivity(activityId, residentId);
        setActiveId(null);
      } else {
        const residentLabel = formatResidentLabel(villageState.residents[residentId]);
        const activityLabel = activity?.label ?? activityId;
        setAssignmentFeedback(`${residentLabel} è pronto per ${activityLabel}. Premi Start per avviare.`);
      }
    },
    [activityScheduler, config.activities, startSlotActivity, villageState.residents, setActiveId],
  );


  const resolveWorkerName = useCallback(
    (residentId: string | null) => {
      if (!residentId) return null;
      const resident = sandboxState.residents?.[residentId];
      return resident ? formatResidentLabel(resident) : residentId;
    },
    [sandboxState.residents],
  );

  const residentsById = useMemo(() => sandboxState.residents ?? {}, [sandboxState.residents]);

  const updateVillageState = useCallback(async (updater: (prev: VillageState) => VillageState, message: string) => {
    await mapContext.updateState(updater, message);
  }, [mapContext]);

  const { demoPanelHandlers } = useSandboxDemoPanel({
    residentsById,
    updateVillageState,
    formatResidentLabel,
    setAssignmentFeedback,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const shouldExposeHooks = IS_TEST_ENV || Boolean(window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS);
    if (!shouldExposeHooks) {
      return;
    }

    const hooks: IdleVillageTestHooks = {
      seedResidents: async (residents: ResidentState[]) => {
        await resetState(
          () =>
            createVillageStateFromConfig({
              config,
              initialResidents: residents,
            }),
          'Test hook seed residents',
        );
      },
      invokeDemoHandler: (handlerName: DemoPanelHandlerName, ...args: unknown[]) => {
        const handler = demoPanelHandlers[handlerName as keyof typeof demoPanelHandlers];
        if (typeof handler !== 'function') {
          throw new Error(`Demo handler ${handlerName} is not available`);
        }
        (handler as (...innerArgs: unknown[]) => void)(...args);
      },
      advanceTimeUnits: (deltaUnits: number) => {
        if (typeof activityScheduler.advanceTimeUnitsDebug !== 'function') {
          throw new Error('advanceTimeUnitsDebug hook is not available');
        }
        activityScheduler.advanceTimeUnitsDebug(deltaUnits);
      },
      assignResidentToActivity: (activityId: string, residentId: string) => {
        handleWorkerDrop(activityId, residentId, { autoStart: true });
      },
      getManagedActivityHandles: () => ({
        jobActivityId: managedActivities.find((activity) => activity.tags?.includes('job'))?.id ?? null,
        questActivityId: managedActivities.find((activity) => activity.tags?.includes('quest'))?.id ?? null,
        residentIds: residents.map((resident) => resident.id),
      }),
      seedTradeRoutes: (routes: TradeRoute[], lastResult?: TradeResult) => {
        // Seed deterministic trade routes for testing
        mapContext.seedTradeRoutes(routes, lastResult);
      },
      seedMigrationQueue: (requests: MigrationRequest[]) => {
        // Seed deterministic migration queue for testing
        mapContext.seedMigrationQueue(requests);
      },
    };

    window.__idleVillageTestHooks = hooks;

    return () => {
      if (window.__idleVillageTestHooks === hooks) {
        delete window.__idleVillageTestHooks;
      }
    };
  }, [config, demoPanelHandlers, resetState, activityScheduler, handleWorkerDrop, managedActivities, residents]);

  const slotDropStates = useMemo<Record<string, DropState>>(() => {
    if (!draggingResidentId) return {};

    const result: Record<string, DropState> = {};
    // Only calculate for non-system slots to reduce computation
    for (const slot of slots) {
      if (slot.slotId === 'day-night-cycle') continue;
      try {
        result[slot.slotId] = activityScheduler.canAssignResident(draggingResidentId, slot.slotId) ? 'valid' : 'invalid';
      } catch (error) {
        // Fallback to invalid if calculation fails
        result[slot.slotId] = 'invalid';
      }
    }
    return result;
  }, [draggingResidentId, slots, activityScheduler]);

  const detailContexts = useMemo<DetailContext[]>(() => {
    if (detailPanelSlotIds.length === 0) return [];

    return detailPanelSlotIds
      .map((panelSlotId) => {
        const selectedSlot = slots.find((slot) => slot.slotId === panelSlotId);
        if (!selectedSlot) return null;

        const activity =
          config.activities?.[extractActivityIdFromSlot(panelSlotId)] ?? config.activities?.[panelSlotId];
        if (!activity) return null;

        const assignedName = resolveWorkerName(selectedSlot.assignedWorkerId);
        const activityState =
          selectedSlot.assignedWorkerId != null
            ? activityScheduler.getActivityState(selectedSlot.slotId, selectedSlot.assignedWorkerId)
            : null;
        const progressFraction = activityState?.progress ?? 0;
        const elapsedSeconds = activityState?.elapsed ?? 0;
        const totalDurationSeconds =
          activityState?.duration ??
          Math.max(1, Math.round(evaluateActivityDuration(activity) * secondsPerTimeUnit));

        const summary = isQuestActivity(activity)
          ? buildSandboxQuestSummaryLegacy({
            slot: selectedSlot,
            activity,
            assignedName,
            progressFraction,
            elapsedSeconds,
            totalDurationSeconds,
          })
          : null;

        const context: DetailContext = {
          slotId: panelSlotId,
          slot: selectedSlot,
          activity,
          summary,
        };
        return context;
      })
      .filter((context): context is DetailContext => context !== null);
  }, [
    detailPanelSlotIds,
    slots,
    config.activities,
    activityScheduler,
    secondsPerTimeUnit,
    resolveWorkerName,
  ]);

  const theaterVerbs = useMemo<VerbSummary[]>(() => {
    return theaterPreviewSlots.map((slot) => {
      const assignedName = resolveWorkerName(slot.assignedWorkerId);
      const tone = deriveVerbTone(slot.activity);
      const injuryPercentage = Math.min(100, (slot.activity.dangerRating ?? 1) * 15);
      const deathPercentage = Math.round(injuryPercentage / 2);
      const totalSlots =
        typeof slot.activity.maxSlots === 'number'
          ? slot.activity.maxSlots
          : slot.activity.maxSlots === 'infinite'
            ? 4
            : 1;

      return {
        key: `sandbox_theater_${slot.slotId}`,
        source: 'system',
        activityId: slot.slotId,
        slotId: slot.slotId,
        label: slot.activity.label ?? slot.slotId,
        kindLabel: tone === 'job' ? 'Job' : tone === 'quest' ? 'Quest' : 'Activity',
        isQuest: tone === 'quest',
        isJob: tone === 'job',
        icon: slot.iconName,
        visualVariant: 'azure',
        progressStyle: 'ribbon',
        progressFraction: 0,
        elapsedSeconds: 0,
        totalDurationSeconds: Number(slot.activity.durationFormula ?? 0),
        remainingSeconds: 0,
        injuryPercentage,
        deathPercentage,
        assignedCount: slot.assignedWorkerId ? 1 : 0,
        totalSlots,
        rewardLabel: formatRewardLabel(slot.activity),
        tone,
        deadlineLabel: null,
        assigneeNames: assignedName ? [assignedName] : [],
        notes: slot.activity.description ?? null,
      };
    });
  }, [theaterPreviewSlots, resolveWorkerName]);

  const canSlotAcceptDrop = useCallback(
    (slotId: string): boolean => {
      if (!draggingResidentId) return false;
      return activityScheduler.canAssignResident(draggingResidentId, slotId);
    },
    [draggingResidentId, activityScheduler]
  );

  const handleCloseTheater = useCallback(() => {
    setIsTheaterOpen(false);
  }, []);

  const handleResidentSelect = useCallback((residentId: string) => {
    setSelectedResidentId((prev) => (prev === residentId ? null : residentId));
  }, []);

  useEffect(() => {
    if (selectedResidentId && !residents.some((resident) => resident.id === selectedResidentId)) {
      setSelectedResidentId(null);
    }
  }, [residents, selectedResidentId]);

  useEffect(() => {
    if (!isDayPhase && isTheaterOpen) {
      handleCloseTheater();
      setAssignmentFeedback('Notte in corso. Riposo.');
    }
  }, [isDayPhase, isTheaterOpen, handleCloseTheater]);

  const styleLabStatRows = useMemo(
    () => [
      {
        label: 'Surface',
        value: activePreset.tokens['surface-base'] ?? '--',
      },
      {
        label: 'Panel',
        value: activePreset.tokens['panel-surface'] ?? '--',
      },
      {
        label: 'Accent',
        value: activePreset.tokens['accent-color'] ?? '--',
      },
      {
        label: 'Halo',
        value: activePreset.tokens['halo-color'] ?? '--',
      },
    ],
    [activePreset.tokens],
  );

  const styleLabPanelStyle = useMemo(() => {
    const tokens = activePreset.tokens;
    return {
      borderColor: tokens['panel-border'] ?? 'rgba(255, 255, 255, 0.15)',
      background: [
        tokens['panel-sheen'] ?? 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.06), transparent 60%)',
        'linear-gradient(140deg, rgba(255,255,255,0.03), rgba(0,0,0,0.2))',
        tokens['surface-panel'] ?? 'rgba(8,10,16,0.92)',
      ]
        .filter(Boolean)
        .join(', '),
    };
  }, [activePreset.tokens]);
  const findAcceptingSlotId = useCallback(
    (residentId: string) => {
      const acceptingSlot = slots.find((slot) => activityScheduler.canAssignResident(residentId, slot.slotId));
      return acceptingSlot?.slotId ?? null;
    },
    [slots],
  );

  /**
   * Builds the list of theater previews for the inspected location.
   * All slots sharing the same mapSlotId as the primary slot are included (always excluding the day/night card).
   * If fewer than three slots match, we pull additional ones deterministically to keep the view populated.
   */
  const selectTheaterPreviewIds = useCallback(
    (primarySlotId?: string | null): string[] => {
      const playableSlots = slots.filter((slot) => slot.slotId !== 'day-night-cycle');
      if (playableSlots.length === 0) return [];

      const selected: ActivitySlotData[] = [];
      const selectSlot = (slot: ActivitySlotData | undefined | null) => {
        if (!slot) return;
        if (selected.some((entry) => entry.slotId === slot.slotId)) return;
        selected.push(slot);
      };

      const primarySlot =
        (primarySlotId ? playableSlots.find((slot) => slot.slotId === primarySlotId) : playableSlots[0]) ?? null;
      if (primarySlot) {
        selectSlot(primarySlot);
      }

      const targetMapSlotId = primarySlot
        ? ((primarySlot.activity.metadata ?? {}) as { mapSlotId?: string }).mapSlotId
        : undefined;

      if (targetMapSlotId) {
        playableSlots.forEach((slot) => {
          const slotMapSlotId = ((slot.activity.metadata ?? {}) as { mapSlotId?: string }).mapSlotId;
          if (slotMapSlotId === targetMapSlotId) {
            selectSlot(slot);
          }
        });
      }

      const remainingPool = playableSlots.filter(
        (slot) => !selected.some((entry) => entry.slotId === slot.slotId),
      );

      while (selected.length < 3 && remainingPool.length > 0) {
        const randomIndex = Math.floor(simpleRng() * remainingPool.length);
        const [picked] = remainingPool.splice(randomIndex, 1);
        selectSlot(picked);
      }

      return selected.map((slot) => slot.slotId);
    },
    [slots],
  );

  const locationSlots = useMemo<ActivitySlotData[]>(() => {
    const playable = slots.filter((slot) => slot.slotId !== 'day-night-cycle');
    if (playable.length >= 3) return playable.slice(0, 3);
    return playable;
  }, [slots]);
  const locationSlotIds = useMemo(() => locationSlots.map((slot) => slot.slotId), [locationSlots]);

  const openTheaterWithSlotIds = useCallback(
    (slotIds: string[]) => {
      if (!isDayPhase) return;

      const previewSlots = slotIds
        .map((id) => slots.find((slot) => slot.slotId === id) ?? null)
        .filter((slot): slot is ActivitySlotData => {
          if (!slot) return false;
          return slot.slotId !== 'day-night-cycle';
        });
      if (previewSlots.length === 0) return;
      setTheaterPreviewIds(previewSlots.map((slot) => slot.slotId));
      setIsTheaterOpen(true);
    },
    [slots, isDayPhase],
  );

  const openTheaterForSlot = useCallback(
    (slotId: string | null) => {
      const normalizedSlotId = slotId && slotId !== 'day-night-cycle' ? slotId : undefined;
      const previews = selectTheaterPreviewIds(normalizedSlotId);
      openTheaterWithSlotIds(previews);
    },
    [selectTheaterPreviewIds, openTheaterWithSlotIds],
  );


  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isTheaterOpen) {
        handleCloseTheater();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isTheaterOpen, handleCloseTheater]);

  const handleLocationInspect = useCallback(() => {
    if (locationSlotIds.length === 0) return;
    openTheaterWithSlotIds(locationSlotIds);
  }, [locationSlotIds, openTheaterWithSlotIds]);

  const detailOpenTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSlotResidentDragEnter = useCallback(
    (slotId: string, residentId: string | null) => {
      if (detailPanelSlotIds.includes(slotId)) return;
      if (detailOpenTimerRef.current) {
        globalThis.clearTimeout(detailOpenTimerRef.current);
        detailOpenTimerRef.current = null;
      }
      detailOpenTimerRef.current = globalThis.setTimeout(() => {
        openDetailPanel(slotId);
        detailOpenTimerRef.current = null;
      }, 600);
    },
    [detailPanelSlotIds, openDetailPanel],
  );

  const handleSlotResidentDragLeave = useCallback(() => {
    if (detailOpenTimerRef.current) {
      globalThis.clearTimeout(detailOpenTimerRef.current);
      detailOpenTimerRef.current = null;
    }
  }, []);

  const theaterOpenTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLocationDragIntent = useCallback(
    (_residentId: string | null) => {
      // Intent logging or other side effects can remain immediate if needed
      // console.log('handleLocationDragIntent called with residentId:', residentId, 'locationSlotIds:', locationSlotIds);
    },
    [],
  );

  const handleLocationResidentDragEnter = useCallback(
    (residentId: string | null) => {
      if (!residentId || locationSlotIds.length === 0) return;
      if (theaterCloseTimeout) {
        globalThis.clearTimeout(theaterCloseTimeout);
        setTheaterCloseTimeout(null);
      }
      if (isTheaterOpen) return;
      if (theaterOpenTimerRef.current) {
        globalThis.clearTimeout(theaterOpenTimerRef.current);
        theaterOpenTimerRef.current = null;
      }
      theaterOpenTimerRef.current = globalThis.setTimeout(() => {
        setIsTheaterOpen(true);
        openTheaterWithSlotIds(locationSlotIds);
        theaterOpenTimerRef.current = null;
      }, 600);
    },
    [theaterCloseTimeout, isTheaterOpen, locationSlotIds, openTheaterWithSlotIds],
  );

  const handleLocationResidentDragLeave = useCallback(() => {
    if (theaterOpenTimerRef.current) {
      globalThis.clearTimeout(theaterOpenTimerRef.current);
      theaterOpenTimerRef.current = null;
    }

    if (theaterCloseTimeout) {
      globalThis.clearTimeout(theaterCloseTimeout);
    }
    setTheaterCloseTimeout(
      globalThis.setTimeout(() => {
        setIsTheaterOpen(false);
        setTheaterCloseTimeout(null);
      }, 200),
    );
  }, [theaterCloseTimeout]);

  const handleLocationResidentDrop = useCallback(
    (residentId: string) => {
      // Cancel any pending open timer immediately
      if (theaterOpenTimerRef.current) {
        clearTimeout(theaterOpenTimerRef.current);
        theaterOpenTimerRef.current = null;
      }

      const targetSlotId = findAcceptingSlotId(residentId);
      if (!targetSlotId) {
        setAssignmentFeedback('Nessuna attività compatibile in questo luogo.');
        setIsTheaterOpen(false);
        return;
      }
      // Assign to the slot
      handleWorkerDrop(targetSlotId, residentId);
      setIsTheaterOpen(false);
    },
    [findAcceptingSlotId, handleWorkerDrop, setIsTheaterOpen],
  );

  const handleResetSandboxState = useCallback(async () => {
    const latestResidents = loadResidentsFromCharacterManager({ config });
    const nextState = createVillageStateFromConfig({ config, initialResidents: latestResidents });
    await resetState(nextState, 'VillageSandbox manual reset');
    activityScheduler.resetScheduler(nextState);
    setSlotAssignments({});
    setSelectedResidentId(null);
    setDetailPanelSlotIds([]);
    setIsTheaterOpen(false);
    setTheaterPreviewIds([]);
    demoPanelHandlers.onRemoveAll?.();
    setAssignmentFeedback('Sandbox resettato: roster e attività riportati allo stato iniziale.');
  }, [config, resetState, activityScheduler, demoPanelHandlers, setAssignmentFeedback]);

  const locationDropState: DropState = useMemo(() => {
    if (!draggingResidentId) return 'idle';
    return locationSlotIds.some((id) => activityScheduler.canAssignResident(draggingResidentId, id))
      ? 'valid'
      : 'invalid';
  }, [draggingResidentId, locationSlotIds, activityScheduler]);

  const populationCount = residents.length;
  const dayCounter = totalCycleUnits > 0 ? Math.floor((sandboxState.currentTime ?? 0) / totalCycleUnits) + 1 : 1;

  const headerResources = useMemo(
    () => ({
      gold: Math.round(sandboxState.resources.gold ?? 0),
      food: Math.round(sandboxState.resources.food ?? 0),
      population: populationCount,
    }),
    [sandboxState.resources.gold, sandboxState.resources.food, populationCount],
  );

  const resourcePanelItems = useMemo<ResourcePanelItem[]>(() => {
    const configResources = config.resources ?? {};
    const goldDef = configResources.gold;
    const foodDef = configResources.food;
    const items: ResourcePanelItem[] = [];

    items.push({
      id: 'gold',
      label: goldDef?.label ?? 'Gold',
      icon: goldDef?.icon ?? '🪙',
      value: Math.round(sandboxState.resources.gold ?? 0),
      accentClass: goldDef?.colorClass ?? 'text-amber-200',
    });

    items.push({
      id: 'food',
      label: foodDef?.label ?? 'Food',
      icon: foodDef?.icon ?? '🍖',
      value: Math.round(sandboxState.resources.food ?? 0),
      accentClass: foodDef?.colorClass ?? 'text-emerald-200',
    });

    items.push({
      id: 'population',
      label: 'Population',
      icon: '👥',
      value: populationCount,
      accentClass: 'text-slate-100',
    });

    return items;
  }, [config.resources, sandboxState.resources, populationCount]);

  type EventFilter = 'all' | 'job' | 'quest';
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');

  const upcomingEvents = useMemo(() => {
    const filtered = managedActivities.filter((activity) => {
      if (eventFilter === 'quest') return activity.tags?.includes('quest');
      if (eventFilter === 'job') return activity.tags?.includes('job');
      return true;
    });
    return filtered.slice(0, 3).map((activity) => {
      const tone = deriveVerbTone(activity);
      const durationUnits = evaluateActivityDuration(activity);
      return {
        id: activity.id,
        label: activity.label ?? activity.id,
        tone,
        etaLabel: `${Math.max(1, Math.round(durationUnits))} TU`,
      };
    });
  }, [managedActivities, eventFilter]);

  const toneIconMap: Record<SandboxVerbTone | 'system', string> = {
    neutral: '☆',
    job: '⚒️',
    quest: '⚔️',
    danger: '☠️',
    system: '⏱️',
  };

  const toneAccentMap: Record<SandboxVerbTone | 'system', string> = {
    neutral: 'border-slate-400/40 text-slate-200',
    job: 'border-emerald-400/40 text-emerald-200',
    quest: 'border-amber-400/40 text-amber-100',
    danger: 'border-rose-500/50 text-rose-200',
    system: 'border-cyan-400/40 text-cyan-100',
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 text-ivory">
      <VillageSandboxHeader
        gold={headerResources.gold}
        food={headerResources.food}
        population={headerResources.population}
        dayCounter={dayCounter}
        phaseLabel={cyclePhaseLabel}
        phaseIcon={cyclePhaseIcon}
        cycleProgressFraction={cycleProgressFraction}
        onReset={handleResetSandboxState}
        className="sticky top-4 z-30"
      />

        <section className="rounded-3xl border border-white/10 bg-black/60 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-300">Upcoming Highlights</p>
              <p className="text-sm text-slate-100">Controlla gli incarichi imminenti e filtra per tipo.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'job', 'quest'] as EventFilter[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEventFilter(value)}
                  className={[
                    'rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.3em]',
                    value === eventFilter
                      ? 'border border-amber-300/80 bg-amber-500/20 text-amber-100'
                      : 'border border-white/10 text-slate-300 hover:border-amber-200/40',
                  ].join(' ')}
                >
                  {value === 'all' ? 'All' : value === 'job' ? 'Jobs' : 'Quests'}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-300">Nessun evento imminente per il filtro selezionato.</p>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className={[
                    'flex flex-1 min-w-[220px] items-center justify-between rounded-2xl border px-3 py-2 text-sm',
                    toneAccentMap[event.tone],
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="text-lg">
                      {toneIconMap[event.tone] ?? '☆'}
                    </span>
                    <div>
                      <p className="font-semibold">{event.label}</p>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">ETA {event.etaLabel}</p>
                    </div>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.3em]">
                    {event.tone === 'quest' ? 'Quest' : event.tone === 'job' ? 'Job' : 'Event'}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section
          className="rounded-3xl border border-white/10 p-4 shadow-xl backdrop-blur"
          style={{
            background: `linear-gradient(120deg, rgba(255,255,255,0.02), transparent), var(--panel-surface)`,
            boxShadow: `0 30px 60px var(--card-shadow-color)`,
          }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.5em]"
                style={{ color: 'var(--slot-helper-color, rgba(255,255,255,0.55))' }}
              >
                Style Laboratory
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {activePreset.label}
                {isRandomized ? ' + Chaos Mix' : ''} · {activePreset.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => {
                const isPresetActive = activePreset.id === preset.id && !isRandomized;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPreset(preset.id)}
                    className="rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors"
                    style={{
                      border: `1px solid ${isPresetActive ? 'var(--accent-color)' : 'var(--panel-border)'}`,
                      background: isPresetActive ? 'var(--card-highlight)' : 'transparent',
                      color: isPresetActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: isPresetActive ? `0 0 20px var(--halo-color)` : 'none',
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={randomizeTheme}
                className="rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors"
                style={{
                  border: '1px solid var(--accent-strong)',
                  background: 'var(--card-highlight)',
                  color: 'var(--text-primary)',
                }}
              >
                Randomize
              </button>
              {isRandomized && (
                <button
                  type="button"
                  onClick={resetRandomization}
                  className="rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.3em] transition-colors"
                  style={{
                    border: '1px dashed var(--panel-border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="lg:grid lg:grid-cols-[1.6fr_0.8fr] lg:items-start lg:gap-8">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-black/60 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.55)] backdrop-blur">
              <DragTestContainer
                residents={residents}
                onDragStart={(residentId) => setActiveId(residentId)}
                onDragEnd={() => setActiveId(null)}
                onDragStateChange={(residentId, isDragging) => setActiveId(isDragging ? residentId : null)}
                onResidentSelect={handleResidentSelect}
                isDayPhase={isDayPhase}
              />
              {assignmentFeedback && (
                <div className="mt-3 rounded-2xl border border-amber-200/40 bg-[rgba(17,10,0,0.75)] px-4 py-3 text-[11px] uppercase tracking-[0.28em] text-amber-100 shadow-[0_15px_30px_rgba(0,0,0,0.45)]">
                  {assignmentFeedback}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-xs uppercase tracking-[0.35em] text-slate-400">Attività</h2>
              <div className="flex flex-wrap items-start gap-6">
                {slots.map((slot) => {
                  const isDayNightCard = slot.slotId === 'day-night-cycle';
                  const assignedName = isDayNightCard ? null : resolveWorkerName(slot.assignedWorkerId);
                  const activityState =
                    !isDayNightCard && slot.assignedWorkerId
                      ? activityScheduler.getActivityState(slot.slotId, slot.assignedWorkerId)
                      : null;
                  const progressFraction = isDayNightCard ? cycleProgressFraction : activityState?.progress ?? 0;
                  const elapsedSeconds = isDayNightCard ? cycleElapsedSeconds : activityState?.elapsed ?? 0;
                  const activityDuration =
                    !isDayNightCard && slot.activity
                      ? Math.round(evaluateActivityDuration(slot.activity) * secondsPerTimeUnit)
                      : 90;
                  const totalDuration = isDayNightCard ? totalCycleSeconds : activityState?.duration ?? activityDuration;
                  const slotDropState: DropState =
                    isDayNightCard || draggingResidentId == null
                      ? 'idle'
                      : activityScheduler.canAssignResident(draggingResidentId, slot.slotId)
                        ? 'valid'
                        : 'invalid';

                  return (
                    <div key={slot.slotId} className="relative">
                      <ActionCardWrapper
                        activity={slot.activity}
                        config={config}
                        residents={residentsById}
                        currentTime={sandboxState.currentTime ?? 0}
                        onCollect={() => {
                          // Telemetry for capsule collect
                          trackTelemetryEvent('activity_capsule_collect_clicked', {
                            activityId: slot.activity.id,
                            slotId: slot.slotId,
                            event: 'capsule_collect_clicked',
                            timestamp: Date.now(),
                          });
                        }}
                        dataTestId={`activity-card-${slot.slotId}`}
                      />
                      {/* Detail button */}
                      {!isDayNightCard && (
                        <button
                          type="button"
                          className="absolute top-2 right-2 rounded-full border border-white/25 bg-black/40 px-2 py-1 text-[9px] uppercase tracking-[0.25em] text-slate-200 hover:border-amber-200/70 hover:text-amber-100 transition"
                          onClick={openDetailPanel}
                          aria-label={`Apri dettagli ${slot.label}`}
                          data-testid={`activity-detail-trigger-${slot.slotId}`}
                        >
                          Dettaglio
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Luogo attivo</div>
                <LocationCard
                  title="Foresta · Raccolta Bacche"
                  description="Trascina un lavoratore per avviare la spedizione e apri la vista panoramica per controllare più VerbCard."
                  onInspect={handleLocationInspect}
                  onDragIntent={handleLocationDragIntent}
                  onResidentDragEnter={handleLocationResidentDragEnter}
                  onResidentDragLeave={handleLocationResidentDragLeave}
                  onResidentDrop={handleLocationResidentDrop}
                  dropState={locationDropState}
                  isLockedByPhase={!isDayPhase}
                />
              </div>
            </section>
        </div>

        {/* Right Column: HUD & Resources */}
        <div className="space-y-4">
          <ActiveHUD
            activeSlots={activeSlots}
            secondsPerTimeUnit={secondsPerTimeUnit}
          />
          <ResourcePanel
            gold={0} // TODO: get from state
            food={0} // TODO: get from state
            population={Object.keys(residentsById).length}
          />
          <QuestTelemetryPanel />
          <TradeRoutePanel
            villageIds={mapContext.getVillageSummaries().map((v) => v.id)}
            tradeRoutes={mapContext.getTradeRoutes()}
            lastTradeResult={mapContext.getLastTradeResult()}
            onCreateTradeRoute={mapContext.createTradeRoute}
            onExecuteTradeRoute={mapContext.executeTradeRoute}
          />
          <MigrationQueuePanel
            migrationQueue={mapContext.getMigrationQueue()}
            onProcessMigrationTick={mapContext.processMigrationTick}
          />
        </div>
      </div>

      {detailContexts.length > 0 && (
        <div
          className={[
            'pointer-events-none fixed inset-0 z-30 flex items-center justify-center px-4 py-8 sm:px-6',
            isTheaterOpen ? 'lg:justify-start lg:pl-16' : 'lg:justify-center',
          ].join(' ')}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={[
              'pointer-events-none flex w-full max-w-6xl flex-wrap justify-center gap-4',
              isTheaterOpen ? 'lg:justify-start' : 'lg:justify-center',
            ].join(' ')}
            style={{ pointerEvents: 'none' }}
          >
            {detailContexts.map((context) => (
              <div key={context.slotId} className="pointer-events-none flex w-full max-w-[420px] justify-center">
                <div className="pointer-events-auto">
                  <DetailPanelCard
                    slotId={context.slotId}
                    slot={context.slot}
                    activity={context.activity}
                    slotAssignments={slotAssignments}
                    residents={residentsById}
                    secondsPerTimeUnit={secondsPerTimeUnit}
                    draggingResidentId={draggingResidentId}
                    scheduler={{
                      canAssignResident: activityScheduler.canAssignResident,
                      getActivityState: activityScheduler.getActivityState,
                    }}
                    onWorkerDrop={handleWorkerDrop}
                    onStart={startSlotActivity}
                    onClose={closeDetailPanel}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isTheaterOpen && theaterPrimarySlot && theaterVerbs.length > 0 && (
        <LocationDetail
          slotLabel={theaterPrimarySlot.label}
          slotIcon={theaterPrimarySlot.iconName}
          verbs={theaterVerbs}
          onClose={handleCloseTheater}
          acceptResidentDrop={!!draggingResidentId}
          onResidentDrop={(residentId) => {
            console.log('Resident dropped in LocationDetail:', residentId);
            // TODO: bridge resident drop to board slots once ActiveHUD integration is finalized
          }}
        />
      )}
    </div>
  );
};

const VillageSandbox = () => {
  return (
    <DragProvider>
      <VillageSandboxContent />
    </DragProvider>
  );
};

export default VillageSandbox;
