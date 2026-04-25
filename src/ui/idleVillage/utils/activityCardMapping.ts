import type { ReactNode } from 'react';
import type {
  ActivityCardKind,
  ActivityDefinition,
  IdleVillageConfig,
  MapSlotDefinition,
} from '@/balancing/config/idleVillage/types';
import type {
  ResidentState,
  ScheduledActivity,
  VillageState,
} from '@/engine/game/idleVillage/TimeEngine';
import { evaluateActivityDuration } from '@/engine/game/idleVillage/TimeEngine';
import type {
  ActionCardAssignee,
  ActionCardMetric,
  ActionCardProps,
  ActionCardStatus,
} from '@/ui/idleVillage/map/actionCards/ActionCard';
import type { DropState } from '@/ui/idleVillage/legacy/VerbCard';
import { buildTimeMetrics, resolveMetrics } from '@/ui/idleVillage/map/actionCards/wrappers/shared';
import {
  deriveIcon,
  deriveRisk,
  deriveTone,
  deriveVisualVariant,
  formatRewardLabel,
  toneToVariantMap,
} from '@/ui/idleVillage/verbSummaries';

const DEFAULT_SECONDS_PER_TIME_UNIT = 60;

const CARD_KIND_INFERENCE: Array<{ tag: string; kind: ActivityCardKind }> = [
  { tag: 'quest', kind: 'quest' },
  { tag: 'training', kind: 'training' },
  { tag: 'maintenance', kind: 'maintenance' },
  { tag: 'job', kind: 'job' },
];

const resolveCardKind = (activity: ActivityDefinition): ActivityCardKind => {
  if (activity.cardKind) {
    return activity.cardKind;
  }
  const normalizedTags = activity.tags?.map((tag) => tag.toLowerCase()) ?? [];
  const inferred = CARD_KIND_INFERENCE.find(({ tag }) => normalizedTags.includes(tag));
  return inferred?.kind ?? 'job';
};

const clamp01 = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const deriveStatusFromScheduled = (scheduled?: ScheduledActivity): ActionCardStatus => {
  if (!scheduled) return 'idle';
  if (scheduled.status === 'completed') return 'completed';
  if (scheduled.status === 'running') return 'active';
  return 'idle';
};

const buildAssignees = (
  scheduled: ScheduledActivity | undefined,
  residents: Record<string, ResidentState> | undefined,
): ActionCardAssignee[] | undefined => {
  if (!scheduled || !scheduled.characterIds.length) {
    return undefined;
  }
  return scheduled.characterIds.map((characterId) => {
    const resident = residents?.[characterId];
    return {
      id: characterId,
      name: resident?.displayName ?? characterId,
      portraitUrl: resident?.portraitUrl,
      subtitle: resident?.statTags?.join(' · '),
      statusLabel: resident?.status,
    } satisfies ActionCardAssignee;
  });
};

const deriveSlotMetadata = (
  activity: ActivityDefinition,
  mapSlots: Record<string, MapSlotDefinition> | undefined,
): { slotId?: string | null; slotIcon?: string } => {
  if (!mapSlots) return { slotId: null };
  const metaSlotId = ((activity.metadata ?? {}) as { mapSlotId?: string }).mapSlotId;
  if (metaSlotId && mapSlots[metaSlotId]) {
    return { slotId: metaSlotId, slotIcon: mapSlots[metaSlotId]?.icon };
  }
  if (activity.slotTags?.length) {
    const match = Object.values(mapSlots).find((slot) =>
      slot.slotTags?.some((tag) => activity.slotTags?.includes(tag)),
    );
    if (match) {
      return { slotId: match.id, slotIcon: match.icon };
    }
  }
  return { slotId: null };
};

const deriveProgress = (
  scheduled: ScheduledActivity | undefined,
  activity: ActivityDefinition,
  currentTime: number,
  secondsPerTimeUnit: number,
) => {
  if (!scheduled) {
    const durationUnits = Math.max(1, evaluateActivityDuration(activity));
    const totalDurationSeconds = durationUnits * secondsPerTimeUnit;
    return { progressFraction: 0, elapsedSeconds: 0, totalDurationSeconds };
  }

  const durationUnits = Math.max(1, scheduled.endTime - scheduled.startTime || evaluateActivityDuration(activity));
  const elapsedUnits = Math.max(0, Math.min(durationUnits, currentTime - scheduled.startTime));
  const progressFraction = clamp01(durationUnits === 0 ? 0 : elapsedUnits / durationUnits);
  const elapsedSeconds = elapsedUnits * secondsPerTimeUnit;
  const totalDurationSeconds = durationUnits * secondsPerTimeUnit;
  return { progressFraction, elapsedSeconds, totalDurationSeconds };
};

export interface ResolveActionCardPropsParams {
  activity: ActivityDefinition;
  scheduled?: ScheduledActivity;
  config: IdleVillageConfig;
  residents?: Record<string, ResidentState>;
  mapSlots?: Record<string, MapSlotDefinition>;
  currentTime?: number;
  secondsPerTimeUnit?: number;
  dropState?: DropState;
  helperTextOverride?: string;
  iconOverride?: ReactNode;
  statusOverride?: ActionCardStatus;
  metrics?: ActionCardMetric[];
  assignees?: ActionCardAssignee[];
  collectLabel?: string;
  collectDisabled?: boolean;
  onCollect?: () => void;
  dataTestId?: string;
  resourceLabeler?: (resourceId: string) => string;
}

export interface ResolvedActionCardDescriptor {
  cardKind: ActivityCardKind;
  props: ActionCardProps;
}

export function resolveActionCardProps(params: ResolveActionCardPropsParams): ResolvedActionCardDescriptor {
  const {
    activity,
    scheduled,
    config,
    residents,
    mapSlots = config.mapSlots,
    currentTime = 0,
    secondsPerTimeUnit = config.globalRules.secondsPerTimeUnit ?? DEFAULT_SECONDS_PER_TIME_UNIT,
    dropState,
    helperTextOverride,
    iconOverride,
    statusOverride,
    metrics,
    assignees,
    collectLabel,
    collectDisabled,
    onCollect,
    dataTestId,
    resourceLabeler = (id) => id,
  } = params;

  const cardKind = resolveCardKind(activity);
  const status = statusOverride ?? deriveStatusFromScheduled(scheduled);
  const isPlaying = status === 'active';
  const { slotId: metaSlotId, slotIcon } = deriveSlotMetadata(activity, mapSlots);
  const scheduledSlotId = scheduled?.slotId;
  const icon = iconOverride ?? (deriveIcon(activity, slotIcon) as ReactNode);
  const { progressFraction, elapsedSeconds, totalDurationSeconds } = deriveProgress(
    scheduled,
    activity,
    currentTime,
    secondsPerTimeUnit,
  );
  const helperText = helperTextOverride ?? formatRewardLabel(activity.rewards, resourceLabeler);
  const risk = deriveRisk(activity);
  const assigneeList = assignees ?? buildAssignees(scheduled, residents);
  const fallbackMetrics = buildTimeMetrics(progressFraction, elapsedSeconds, totalDurationSeconds);

  const props: ActionCardProps = {
    label: activity.label ?? activity.id,
    subtitle: activity.statRequirement?.label,
    helperText: helperText ?? undefined,
    icon,
    progressFraction,
    elapsedSeconds,
    totalDurationSeconds,
    isPlaying,
    status,
    variant: toneToVariantMap[deriveTone(activity)] ?? deriveVisualVariant(activity),
    dropState,
    injuryPercentage: risk.injury,
    deathPercentage: risk.death,
    assignees: assigneeList,
    onCollect,
    collectLabel,
    collectDisabled,
    dataTestId: dataTestId ?? activity.id,
    metrics: resolveMetrics(metrics, fallbackMetrics),
  };

  if (!dataTestId && (scheduledSlotId ?? metaSlotId)) {
    props.dataTestId = `${scheduledSlotId ?? metaSlotId}-${activity.id}-card`;
  }

  return {
    cardKind,
    props,
  };
}

export const resolveActionCardDescriptorsForVillageState = (params: {
  config: IdleVillageConfig;
  villageState: VillageState;
  residents?: Record<string, ResidentState>;
  secondsPerTimeUnit?: number;
  resourceLabeler?: (resourceId: string) => string;
  dropStates?: Record<string, DropState | undefined>;
}): ResolvedActionCardDescriptor[] => {
  const { config, villageState, residents, secondsPerTimeUnit, resourceLabeler, dropStates } = params;
  return Object.values(villageState.activities).map((scheduled) =>
    resolveActionCardProps({
      activity: config.activities[scheduled.activityId],
      scheduled,
      config,
      residents,
      currentTime: villageState.currentTime,
      secondsPerTimeUnit,
      resourceLabeler,
      dropState: dropStates?.[scheduled.slotId ?? scheduled.id],
    }),
  );
};

