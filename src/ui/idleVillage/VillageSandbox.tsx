import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { ActivityDefinition, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import {
  createVillageStateFromConfig,
  evaluateActivityDuration,
  getStartingResidentFatigue,
  type ResidentState,
  type VillageResources,
  type VillageState,
} from '@/engine/game/idleVillage/TimeEngine';
import { useVillageStateStore } from '@/ui/idleVillage/useVillageStateStore';
import { loadResidentsFromCharacterManager } from '@/engine/game/idleVillage/characterImport';
import LocationCard from '@/ui/idleVillage/components/LocationCard';
import ActivitySlotCard, { type ActivitySlotCardProps, type DropState } from '@/ui/idleVillage/components/ActivitySlot';
import ActivityCardDetail, { type ActivityCardMetric } from '@/ui/idleVillage/components/ActivityCardDetail';
import QuestDetailPanel from '@/ui/idleVillage/components/QuestDetailPanel';
import ResidentRoster from '@/ui/idleVillage/ResidentRosterDnd';
import DragTestContainer from '@/ui/idleVillage/components/DragTestContainer';
import ResidentDetailCard from '@/ui/idleVillage/components/ResidentDetailCard';
import TheaterView from '@/ui/idleVillage/components/TheaterView';
import ActiveHUD from '@/ui/idleVillage/components/ActiveHUD';
import { DragProvider, useDragContext } from '@/ui/idleVillage/components/DragContext';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import type { VerbVisualVariant } from '@/ui/idleVillage/VerbCard';
import {
  DEFAULT_SECONDS_PER_TIME_UNIT,
  deriveRisk,
  deriveVisualVariant,
} from '@/ui/idleVillage/verbSummaries';
import {
  useActivityScheduler,
  type ActivityResolutionResult,
  type ScheduledActivityState,
} from '@/ui/idleVillage/hooks/useActivityScheduler';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';

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

const deriveVerbTone = (activity: ActivityDefinition): SandboxVerbTone => {
  if (activity.tags?.includes('quest')) return 'quest';
  if (activity.tags?.includes('job')) return 'job';
  if (activity.tags?.includes('danger')) return 'danger';
  if (activity.tags?.includes('system')) return 'system';
  return 'neutral';
};

const buildSandboxQuestSummary = (params: {
  slot: ActivitySlotData;
  activity: ActivityDefinition;
  assignedName: string | null;
  progressFraction: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
}): VerbSummary => {
  const { slot, activity, assignedName, progressFraction, elapsedSeconds, totalDurationSeconds } = params;
  const tone = deriveVerbTone(activity);
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
    rewardLabel: formatRewardLabel(activity),
    tone,
    deadlineLabel: null,
    assigneeNames: assignedName ? [assignedName] : [],
    autoState: null,
  };
};

const formatRewardLabel = (activity: ActivityDefinition): string | null => {
  if (!activity.rewards || activity.rewards.length === 0) return null;
  return activity.rewards
    .map((reward) => {
      const amount = reward.amountFormula ?? '';
      return [amount, reward.resourceId].filter(Boolean).join(' ');
    })
    .join(', ');
};

const simpleRng = (() => {
  let seed = 13371337;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
})();

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
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);
  const [slotAssignments, setSlotAssignments] = useState<Record<string, string | null>>({});
  const [lastRewards, setLastRewards] = useState<ResourceDeltaDefinition[] | null>(null);
  const [detailPanelSlotIds, setDetailPanelSlotIds] = useState<string[]>([]);
  const [isTheaterOpen, setIsTheaterOpen] = useState(false);
  const [theaterSlotId, setTheaterSlotId] = useState<string | null>(null);
  const [theaterPreviewIds, setTheaterPreviewIds] = useState<string[]>([]);
  const [theaterCloseTimeout, setTheaterCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [rosterCounts, setRosterCounts] = useState<{ filtered: number; total: number }>({ filtered: 0, total: 0 });
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
  const { state: villageState, resetState } = useVillageStateStore(() =>
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
        setLastRewards(result.rewards ?? []);
      } else {
        setLastRewards(null);
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
  const residents = useMemo<ResidentState[]>(() => {
    const source = sandboxState.residents ?? {};
    const entries = Object.values(source).filter((resident) => resident.status !== 'dead');
    const rankResident = (resident: ResidentState): number => {
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
    };
    return entries.sort((a, b) => {
      const rankDiff = rankResident(a) - rankResident(b);
      if (rankDiff !== 0) return rankDiff;
      return formatResidentLabel(a).localeCompare(formatResidentLabel(b));
    });
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

  const refreshResidentsFromCharacterManager = useCallback(() => {
    const latestResidents = loadResidentsFromCharacterManager({ config });
    if (latestResidents.length === 0) return;
    resetState(
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
        resetState(
          () =>
            createVillageStateFromConfig({
              config,
              initialResidents: latest,
            }),
          'VillageSandbox auto-import residents',
        );
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
      resetState(
        () =>
          createVillageStateFromConfig({
            config,
            initialResidents: latestResidents,
          }),
        'VillageSandbox sync residents',
      );
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

  const slots = useMemo<ActivitySlotData[]>(() => {
    const dayNightSlot: ActivitySlotData = {
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
    };
    const activitySlots = managedActivities.map((activity) => {
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
    return [dayNightSlot, ...activitySlots];
  }, [
    managedActivities,
    questShowcaseActivity?.id,
    slotAssignments,
    config.mapSlots,
    cyclePhaseLabel,
    cyclePhaseIcon,
    totalCycleSeconds,
    isCyclePlaying,
  ]);

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
      const duration = activity ? Number(activity.durationFormula) || 90 : 90;
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

  const slotDropStates = useMemo<Record<string, DropState>>(() => {
    if (!draggingResidentId) return {};
    return slots.reduce<Record<string, DropState>>((acc, slot) => {
      acc[slot.slotId] = activityScheduler.canAssignResident(draggingResidentId, slot.slotId) ? 'valid' : 'invalid';
      return acc;
    }, {});
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
          ? buildSandboxQuestSummary({
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

  const theaterSlotCards = useMemo<ActivitySlotCardProps[]>(() => {
    return theaterPreviewSlots.map((slot) => {
      const assignedName = resolveWorkerName(slot.assignedWorkerId);
      const activityState =
        slot.assignedWorkerId != null
          ? activityScheduler.getActivityState(slot.slotId, slot.assignedWorkerId)
          : null;
      const progressFraction = activityState?.progress ?? 0;
      const elapsedSeconds = activityState?.elapsed ?? 0;
      const durationSeconds =
        activityState?.duration ??
        Math.max(1, Math.round(evaluateActivityDuration(slot.activity) * secondsPerTimeUnit));

      return {
        slotId: slot.slotId,
        iconName: slot.iconName,
        label: slot.mapSlotLabel ? `${slot.label} · ${slot.mapSlotLabel}` : slot.label,
        assignedWorkerName: assignedName,
        canAcceptDrop: canSlotAcceptDrop(slot.slotId),
        dropState: slotDropStates[slot.slotId] ?? 'idle',
        onWorkerDrop: (workerId) => handleWorkerDrop(slot.slotId, workerId),
        onInspect: openDetailPanel,
        progressFraction,
        elapsedSeconds,
        totalDuration: durationSeconds,
        isInteractive: true,
        visualVariant: slot.visualVariant,
      };
    });
  }, [
    theaterPreviewSlots,
    resolveWorkerName,
    activityScheduler,
    secondsPerTimeUnit,
    canSlotAcceptDrop,
    slotDropStates,
    handleWorkerDrop,
    openDetailPanel,
  ]);

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
      boxShadow: `0 25px 55px ${tokens['card-shadow-color'] ?? 'rgba(0, 0, 0, 0.55)'}`,
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
   * Returns the first non-day/night slot id, if present.
   */
  const findFirstPlayableSlotId = useCallback(() => {
    return slots.find((slot) => slot.slotId !== 'day-night-cycle')?.slotId ?? null;
  }, [slots]);

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
      setTheaterSlotId(previewSlots[0].slotId);
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
      // If a detail panel is already open for this slot, do nothing
      if (detailPanelSlotIds.includes(slotId)) return;

      // Start the open timer
      if (detailOpenTimerRef.current) clearTimeout(detailOpenTimerRef.current);
      detailOpenTimerRef.current = setTimeout(() => {
        openDetailPanel(slotId);
        detailOpenTimerRef.current = null;
      }, 600); // 600ms hover threshold
    },
    [detailPanelSlotIds, openDetailPanel],
  );

  const handleSlotResidentDragLeave = useCallback(() => {
    // Cancel any pending open timer
    if (detailOpenTimerRef.current) {
      clearTimeout(detailOpenTimerRef.current);
      detailOpenTimerRef.current = null;
    }
  }, []);

  const theaterOpenTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLocationDragIntent = useCallback(
    (residentId: string | null) => {
      // Intent logging or other side effects can remain immediate if needed
      // console.log('handleLocationDragIntent called with residentId:', residentId, 'locationSlotIds:', locationSlotIds);
    },
    [],
  );

  const handleLocationResidentDragEnter = useCallback(
    (residentId: string | null) => {
      if (!residentId || locationSlotIds.length === 0) return;

      // Clear any pending close timer to prevent flickering
      if (theaterCloseTimeout) {
        clearTimeout(theaterCloseTimeout);
        setTheaterCloseTimeout(null);
      }

      // If already open, do nothing
      if (isTheaterOpen) return;

      // Start the open timer
      if (theaterOpenTimerRef.current) clearTimeout(theaterOpenTimerRef.current);
      theaterOpenTimerRef.current = setTimeout(() => {
        setIsTheaterOpen(true);
        openTheaterWithSlotIds(locationSlotIds);
        theaterOpenTimerRef.current = null;
      }, 600); // 600ms hover threshold
    },
    [theaterCloseTimeout, isTheaterOpen, locationSlotIds, openTheaterWithSlotIds],
  );

  const handleLocationResidentDragLeave = useCallback(() => {
    // Cancel any pending open timer
    if (theaterOpenTimerRef.current) {
      clearTimeout(theaterOpenTimerRef.current);
      theaterOpenTimerRef.current = null;
    }

    // Resume standard close behavior
    if (theaterCloseTimeout) clearTimeout(theaterCloseTimeout);
    setTheaterCloseTimeout(setTimeout(() => setIsTheaterOpen(false), 200));
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

  const handleResetSandboxState = useCallback(() => {
    const latestResidents = loadResidentsFromCharacterManager({ config });
    const nextState = createVillageStateFromConfig({ config, initialResidents: latestResidents });
    resetState(() => nextState, 'VillageSandbox manual reset');
    activityScheduler.resetScheduler(nextState);
    setSlotAssignments({});
    setSelectedResidentId(null);
    setDetailPanelSlotIds([]);
    setIsTheaterOpen(false);
    setTheaterSlotId(null);
    setTheaterPreviewIds([]);
  }, [config, resetState, activityScheduler]);

  const locationDropState: DropState = useMemo(() => {
    if (!draggingResidentId) return 'idle';
    return locationSlotIds.some((id) => activityScheduler.canAssignResident(draggingResidentId, id))
      ? 'valid'
      : 'invalid';
  }, [draggingResidentId, locationSlotIds, activityScheduler]);

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 text-ivory">
      <section
        className="rounded-2xl border p-4 shadow-xl backdrop-blur-sm"
        style={{
          borderColor: 'var(--panel-border)',
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

      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-amber-200/70">Village Sandbox</p>
          <p className="text-sm text-slate-300">
            Trascina i lavoratori negli slot attività per vedere le barre reagire e il cerchio Halo evidenziare il drop.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetSandboxState}
          className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-black/40 px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.25)] transition-colors hover:bg-amber-500/20"
        >
          <span aria-hidden>☽</span>
          Reset Page
        </button>
      </header>

      <section className="flex flex-col gap-8 lg:flex-row">
        <div className="space-y-4 lg:w-1/3">
          <DragTestContainer
            residents={residents}
            onCountsChange={setRosterCounts}
            onDragStart={(residentId) => {
              console.log('VillageSandbox drag start:', residentId);
              setActiveId(residentId);
            }}
            onDragEnd={(residentId) => {
              console.log('VillageSandbox drag end:', residentId);
              setActiveId(null);
            }}
            onDragStateChange={(residentId, isDragging) => {
              console.log('VillageSandbox drag state:', residentId, isDragging);
              setActiveId(isDragging ? residentId : null);
            }}
            onResidentSelect={handleResidentSelect}
            isDayPhase={isDayPhase}
          />

          {assignmentFeedback && (
            <div className="rounded-[22px] border border-amber-200/40 bg-[rgba(17,10,0,0.75)] px-4 py-3 text-[11px] uppercase tracking-[0.28em] text-amber-100 shadow-[0_15px_30px_rgba(0,0,0,0.45)]">
              {assignmentFeedback}
            </div>
          )}

          <section className="relative overflow-hidden rounded-[26px] border border-[color:var(--panel-border)] bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.12),rgba(4,7,14,0.9))] p-4 shadow-[0_25px_45px_rgba(0,0,0,0.55)]">
            <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: 'var(--card-surface-radial, radial-gradient(circle at 20% 0%, rgba(255,255,255,0.25), transparent 60%))' }} />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-amber-100">
                <span>Resources</span>
                <span>Eco Pulse</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-[11px] uppercase tracking-[0.3em] text-slate-200">
                <div className="rounded-[18px] border border-amber-300/60 bg-black/40 px-3 py-2 shadow-inner shadow-amber-900/40">
                  <p className="text-[9px] text-amber-200/80">Food</p>
                  <p className="text-xl font-semibold tracking-[0.1em] text-amber-100">{sandboxState.resources.food ?? 0}</p>
                </div>
                <div className="rounded-[18px] border border-emerald-400/50 bg-black/40 px-3 py-2 shadow-inner shadow-emerald-900/40">
                  <p className="text-[9px] text-emerald-200/80">Wood</p>
                  <p className="text-xl font-semibold tracking-[0.1em] text-emerald-100">{sandboxState.resources.wood ?? 0}</p>
                </div>
                <div className="rounded-[18px] border border-slate-400/60 bg-black/40 px-3 py-2 shadow-inner shadow-slate-900/40">
                  <p className="text-[9px] text-slate-300/80">Stone</p>
                  <p className="text-xl font-semibold tracking-[0.1em] text-slate-100">{sandboxState.resources.stone ?? 0}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4 flex-1">
          <h2 className="text-xs uppercase tracking-[0.35em] text-slate-400">Attività</h2>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex flex-wrap items-start gap-6 lg:flex-1">
                {slots.map((slot) => {
                  const isDayNightCard = slot.slotId === 'day-night-cycle';
                  const assignedName = isDayNightCard ? null : resolveWorkerName(slot.assignedWorkerId);
                  const activityState =
                    !isDayNightCard && slot.assignedWorkerId
                      ? activityScheduler.getActivityState(slot.slotId, slot.assignedWorkerId)
                      : null;
                  const progressFraction = isDayNightCard ? cycleProgressFraction : activityState?.progress ?? 0;
                  const elapsedSeconds = isDayNightCard ? cycleElapsedSeconds : activityState?.elapsed ?? 0;
                  const activityDuration = (!isDayNightCard && slot.activity)
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
                    <ActivitySlotCard
                      key={slot.slotId}
                      slotId={slot.slotId}
                      iconName={slot.iconName}
                      label={
                        slot.mapSlotLabel && !isDayNightCard
                          ? `${slot.label} · ${slot.mapSlotLabel}`
                          : slot.label
                      }
                      assignedWorkerName={assignedName}
                      canAcceptDrop={!isDayNightCard && canSlotAcceptDrop(slot.slotId)}
                      dropState={slotDropState}
                      onWorkerDrop={
                        isDayNightCard ? () => { } : (workerId) => handleWorkerDrop(slot.slotId, workerId)
                      }
                      onInspect={isDayNightCard ? undefined : openDetailPanel}
                      onClick={isDayNightCard ? () => setIsCyclePlaying((prev) => !prev) : undefined}
                      progressFraction={progressFraction}
                      elapsedSeconds={elapsedSeconds}
                      totalDuration={totalDuration}
                      isInteractive={isDayNightCard ? true : !isDayNightCard}
                      visualVariant={isDayNightCard ? cycleVariant : (slot.visualVariant ?? 'azure')}
                      isLockedByPhase={!isDayPhase && !isDayNightCard}
                      onResidentDragEnter={!isDayNightCard ? handleSlotResidentDragEnter : undefined}
                      onResidentDragLeave={!isDayNightCard ? handleSlotResidentDragLeave : undefined}
                    />
                  );
                })}
              </div>

              <div className="space-y-3 w-full max-w-[11rem] lg:w-[6.9rem]">
                <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Luogo attivo</div>
                <LocationCard
                  title="Foresta · Raccolta Bacche"
                  description="Trascina un lavoratore per avviare la spedizione e apri la vista panoramica per controllare più VerbCard."
                  onInspect={handleLocationInspect}
                  iconRow={
                    <div className="flex items-center gap-3 text-emerald-200 text-4xl">
                      <span>🌲</span>
                      <span>🌳</span>
                      <span>🌲</span>
                    </div>
                  }
                  onDragIntent={handleLocationDragIntent}
                  onResidentDragEnter={handleLocationResidentDragEnter}
                  onResidentDragLeave={handleLocationResidentDragLeave}
                  onResidentDrop={handleLocationResidentDrop}
                  dropState={locationDropState}
                  isLockedByPhase={!isDayPhase}
                />
                <ActiveHUD
                  activeSlots={activeSlots}
                  secondsPerTimeUnit={secondsPerTimeUnit}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {selectedResident && (
        <div
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center px-4 py-8 sm:px-6"
          aria-live="polite"
        >
          <div className="pointer-events-auto w-full max-w-2xl">
            <ResidentDetailCard resident={selectedResident} onClose={() => setSelectedResidentId(null)} />
          </div>
        </div>
      )}

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
        <TheaterView
          slotLabel={theaterPrimarySlot.label}
          slotIcon={theaterPrimarySlot.iconName}
          verbs={theaterVerbs}
          slotCards={theaterSlotCards}
          onClose={handleCloseTheater}
          acceptResidentDrop={!!draggingResidentId}
          onResidentDrop={(residentId) => {
            console.log('Resident dropped in TheaterView:', residentId);
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
