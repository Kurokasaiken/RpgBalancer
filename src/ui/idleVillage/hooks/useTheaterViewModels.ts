import { useMemo } from 'react';
import type { ActivityDefinition, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import type { ActivitySlotCardProps, DropState } from '@/ui/idleVillage/components/ActivitySlot';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';
import type { TheaterJobCardPreview } from '@/ui/idleVillage/types/TheaterJobCardPreview';
import { deriveTheaterRiskStripes } from '@/ui/idleVillage/theater/riskStripes';

type ActivitySchedulerBridge = {
  getActivityState: (slotId: string, residentId: string) => ScheduledActivityState | null;
};

interface TheaterDragBridge {
  handleWorkerDrop: (slotId: string, workerId: string | null, options?: { autoStart?: boolean }) => void;
  canSlotAcceptDrop: (slotId: string) => boolean;
  slotDropStates: Record<string, DropState>;
}

export interface UseTheaterViewModelsParams {
  slots: ActivitySlotData[];
  theaterPreviewIds: string[];
  resolveWorkerName: (residentId: string | null) => string | null;
  activityScheduler: ActivitySchedulerBridge;
  secondsPerTimeUnit: number;
  dragBridge: TheaterDragBridge;
  randomFn: () => number;
}

export interface UseTheaterViewModelsResult {
  theaterPreviewSlots: ActivitySlotData[];
  theaterPrimarySlot: ActivitySlotData | null;
  theaterVerbs: VerbSummary[];
  theaterSlotCards: ActivitySlotCardProps[];
  theaterJobCards: TheaterJobCardPreview[];
}

type SandboxVerbTone = VerbSummary['tone'];

const ensureActivityDefinition = (slot: ActivitySlotData): ActivityDefinition =>
  slot.activity ?? {
    id: slot.slotId,
    label: slot.label ?? slot.slotId,
    tags: [],
    slotTags: [],
    resolutionEngineId: 'system',
    metadata: {},
    durationFormula: '0',
  };

/**
 * Derives the verb tone for activities so overlay badges stay config-first.
 */
export const deriveVerbTone = (activity: ActivityDefinition): SandboxVerbTone => {
  if (activity.tags?.includes('quest')) return 'quest';
  if (activity.tags?.includes('job')) return 'job';
  if (activity.tags?.includes('danger')) return 'danger';
  if (activity.tags?.includes('system')) return 'system';
  return 'neutral';
};

/**
 * Formats activity rewards into a compact comma-separated label for HUD display.
 */
export const formatRewardLabel = (rewards: ResourceDeltaDefinition[]): string | null => {
  if (!rewards || rewards.length === 0) {
    return null;
  }
  return rewards.map((reward) => `${reward.amountFormula} ${reward.resourceId}`).join(', ');
};

/**
 * Builds quest summaries for the sandbox detail panel, keeping calculations centralized.
 */
export const buildSandboxQuestSummary = (params: {
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
    rewardLabel: formatRewardLabel(activity.rewards ?? []),
    tone,
    deadlineLabel: null,
    assigneeNames: assignedName ? [assignedName] : [],
    autoState: null,
  };
};

/**
 * Aggregates all the derived data required by the Theater overlay so that the main map context
 * can stay focused on orchestration responsibilities.
 */
export const useTheaterViewModels = ({
  slots,
  theaterPreviewIds,
  resolveWorkerName,
  activityScheduler,
  secondsPerTimeUnit,
  dragBridge,
  randomFn,
}: UseTheaterViewModelsParams): UseTheaterViewModelsResult => {
  const theaterPreviewSlots = useMemo<ActivitySlotData[]>(() => {
    return theaterPreviewIds
      .map((slotId) => slots.find((slot) => slot.slotId === slotId) ?? null)
      .filter((slot): slot is ActivitySlotData => Boolean(slot));
  }, [theaterPreviewIds, slots]);

  const theaterPrimarySlot = theaterPreviewSlots[0] ?? null;

  const theaterVerbs = useMemo<VerbSummary[]>(() => {
    return theaterPreviewSlots.map((slot) => {
      const activity = ensureActivityDefinition(slot);
      const hasActivity = Boolean(slot.activity);
      const assignedName = resolveWorkerName(slot.assignedWorkerId);
      const tone = deriveVerbTone(activity);
      const dangerRating = activity.dangerRating ?? 0;
      const injuryPercentage = Math.min(100, dangerRating * 5);
      const deathPercentage = injuryPercentage / 2;
      const activityState =
        slot.assignedWorkerId != null ? activityScheduler.getActivityState(slot.slotId, slot.assignedWorkerId) : null;
      const progressFraction = activityState?.progress ?? 0;
      const elapsedSeconds = activityState?.elapsed ?? 0;
      const derivedDuration = Number(activity.durationFormula ?? 0);
      const fallbackDurationSeconds = hasActivity
        ? Math.max(1, Math.round(Math.max(0, derivedDuration) * secondsPerTimeUnit))
        : 0;
      const totalDurationSeconds = activityState?.duration ?? fallbackDurationSeconds;
      const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);
      const totalSlots =
        typeof activity.maxSlots === 'number'
          ? activity.maxSlots
          : activity.maxSlots === 'infinite'
            ? 4
            : 1;
      const riskStripeMetrics = deriveTheaterRiskStripes({
        injuryPercentage,
        deathPercentage,
      });

      return {
        key: `sandbox_theater_${slot.slotId}`,
        source: 'system',
        activityId: activity.id,
        slotId: slot.slotId,
        label: slot.label ?? activity.label ?? slot.slotId,
        kindLabel: tone === 'job' ? 'Job' : tone === 'quest' ? 'Quest' : 'Activity',
        isQuest: tone === 'quest',
        isJob: tone === 'job',
        icon: slot.iconName,
        visualVariant: slot.visualVariant,
        progressStyle: 'ribbon',
        progressFraction,
        elapsedSeconds,
        totalDurationSeconds,
        remainingSeconds,
        injuryPercentage,
        deathPercentage,
        assignedCount: slot.assignedWorkerId ? 1 : 0,
        totalSlots,
        rewardLabel: formatRewardLabel(activity.rewards ?? []),
        tone,
        deadlineLabel: null,
        assigneeNames: assignedName ? [assignedName] : [],
        autoState: null,
        riskStripeMetrics,
      };
    });
  }, [activityScheduler, resolveWorkerName, secondsPerTimeUnit, theaterPreviewSlots]);

  const theaterSlotCards = useMemo<ActivitySlotCardProps[]>(() => {
    return theaterPreviewSlots.map((slot) => {
      const activity = ensureActivityDefinition(slot);
      const assignedName = resolveWorkerName(slot.assignedWorkerId);
      const assignedResidentId = slot.assignedWorkerId ?? null;
      const activityState =
        slot.assignedWorkerId != null ? activityScheduler.getActivityState(slot.slotId, slot.assignedWorkerId) : null;
      const progressFraction = activityState?.progress ?? 0;
      const elapsedSeconds = activityState?.elapsed ?? 0;
      const durationSeconds =
        activityState?.duration ??
        Math.max(1, Math.round(Number(activity.durationFormula ?? 0) * secondsPerTimeUnit));

      return {
        slotId: slot.slotId,
        iconName: slot.iconName,
        label: slot.mapSlotLabel ? `${slot.label} · ${slot.mapSlotLabel}` : slot.label,
        assignedWorkerName: assignedName,
        onClick: assignedResidentId
          ? () => dragBridge.handleWorkerDrop(slot.slotId, null, { autoStart: false })
          : undefined,
        canAcceptDrop: dragBridge.canSlotAcceptDrop(slot.slotId),
        dropState: dragBridge.slotDropStates[slot.slotId] ?? 'idle',
        onWorkerDrop: (workerId: string | null) => dragBridge.handleWorkerDrop(slot.slotId, workerId),
        progressFraction,
        elapsedSeconds,
        totalDuration: durationSeconds,
        isInteractive: true,
        visualVariant: slot.visualVariant,
      };
    });
  }, [activityScheduler, dragBridge, resolveWorkerName, secondsPerTimeUnit, theaterPreviewSlots]);

  const theaterJobCards = useMemo<TheaterJobCardPreview[]>(() => {
    const jobSlots = slots.filter((slot) => ensureActivityDefinition(slot).tags?.includes('job'));
    if (jobSlots.length === 0) return [];

    const shuffled = [...jobSlots];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(randomFn() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 3).map((slot) => {
      const activityState =
        slot.assignedWorkerId != null ? activityScheduler.getActivityState(slot.slotId, slot.assignedWorkerId) : null;
      const activity = ensureActivityDefinition(slot);
      const progressFraction = activityState?.progress ?? 0;
      const elapsedSeconds = activityState?.elapsed ?? 0;
      const durationSeconds =
        activityState?.duration ?? Math.max(1, Math.round(Number(activity.durationFormula ?? 0) * secondsPerTimeUnit));
      const metaIcon = ((activity.metadata ?? {}) as { icon?: string }).icon;

      return {
        id: slot.slotId,
        slotId: slot.slotId,
        label: activity.label ?? slot.label,
        icon: metaIcon ?? slot.iconName ?? '⚒️',
        progressFraction,
        elapsedSeconds,
        totalDurationSeconds: durationSeconds,
        isPlaying: activityState?.status === 'running',
      };
    });
  }, [activityScheduler, randomFn, secondsPerTimeUnit, slots]);

  return {
    theaterPreviewSlots,
    theaterPrimarySlot,
    theaterVerbs,
    theaterSlotCards,
    theaterJobCards,
  };
};
