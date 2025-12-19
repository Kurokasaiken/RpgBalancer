const resolveActivitySlotId = (
  activity: ActivityDefinition,
  mapSlots: Record<string, MapSlotDefinition>,
): { slotId: string | null; slotIcon?: string } => {
  const meta = (activity.metadata ?? {}) as { mapSlotId?: string } | undefined;
  if (meta?.mapSlotId && mapSlots[meta.mapSlotId]) {
    return { slotId: meta.mapSlotId, slotIcon: mapSlots[meta.mapSlotId]?.icon };
  }
  if (activity.slotTags && activity.slotTags.length > 0) {
    const match = Object.values(mapSlots).find((slot) =>
      slot.slotTags?.some((tag) => activity.slotTags?.includes(tag)),
    );
    if (match) {
      return { slotId: match.id, slotIcon: match.icon };
    }
  }
  return { slotId: null };
};

import type { ReactNode } from 'react';
import type { ActivityDefinition, MapSlotDefinition, PassiveEffectDefinition } from '@/balancing/config/idleVillage/types';
import type { QuestOffer, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import type { ProgressStyle, VerbTone, VerbVisualVariant } from '@/ui/idleVillage/VerbCard';

export const DEFAULT_SECONDS_PER_TIME_UNIT = 60;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export type VerbSummarySource = 'scheduled' | 'questOffer' | 'system' | 'completed' | 'passive' | 'blueprint';

export interface VerbSummary {
  key: string;
  source: VerbSummarySource;
  slotId: string | null;
  label: string;
  kindLabel: string;
  isQuest: boolean;
  isJob: boolean;
  icon: ReactNode;
  visualVariant: VerbVisualVariant;
  progressStyle: ProgressStyle;
  progressFraction: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  remainingSeconds: number;
  injuryPercentage: number;
  deathPercentage: number;
  assignedCount: number;
  totalSlots: number;
  rewardLabel: string | null;
  riskLabel?: string | null;
  tone: VerbTone;
  deadlineLabel: string | null;
  assigneeNames?: string[];
  scheduled?: ScheduledActivity;
  offer?: QuestOffer;
  notes?: string | null;
}

export function buildActivityBlueprintSummary(params: {
  activity: ActivityDefinition;
  mapSlots: Record<string, MapSlotDefinition>;
  resourceLabeler: (id: string) => string;
}): VerbSummary | null {
  const { activity, mapSlots, resourceLabeler } = params;
  const { slotId, slotIcon } = resolveActivitySlotId(activity, mapSlots);
  if (!slotId) return null;

  const tone = deriveTone(activity);
  const isQuest = activity.tags?.includes('quest') ?? false;
  const isJob = activity.tags?.includes('job') ?? false;
  const rewardsLabel = formatRewardLabel(activity.rewards, resourceLabeler);
  const { injury, death } = deriveRisk(activity);
  const maxCrew =
    ((activity.metadata ?? {}) as { maxCrewSize?: number })?.maxCrewSize ?? (activity.slotTags?.length ? activity.slotTags.length : 1);

  return {
    key: `activity_blueprint_${activity.id}`,
    source: 'blueprint',
    slotId,
    label: activity.label ?? activity.id,
    kindLabel: isQuest ? 'Quest' : isJob ? 'Job' : 'Activity',
    isQuest,
    isJob,
    icon: deriveIcon(activity, slotIcon),
    visualVariant: deriveVisualVariant(activity),
    progressStyle: deriveProgressStyle(activity),
    progressFraction: 0,
    elapsedSeconds: 0,
    totalDurationSeconds: 0,
    remainingSeconds: 0,
    injuryPercentage: injury,
    deathPercentage: death,
    assignedCount: 0,
    totalSlots: maxCrew,
    rewardLabel: rewardsLabel,
    tone,
    deadlineLabel: null,
    assigneeNames: [],
    riskLabel: createRiskLabel(injury, death),
    notes: activity.description ?? null,
  };
}

const toneToVariantMap: Record<VerbTone, VerbVisualVariant> = {
  neutral: 'azure',
  job: 'jade',
  quest: 'amethyst',
  danger: 'ember',
  system: 'solar',
};

const toneToProgressStyleMap: Record<VerbTone, ProgressStyle> = {
  neutral: 'ribbon',
  job: 'border',
  quest: 'halo',
  danger: 'border',
  system: 'ribbon',
};

const coerceVerbTone = (tone?: string | null): VerbTone => {
  if (!tone) return 'system';
  const allowed: VerbTone[] = ['neutral', 'job', 'quest', 'danger', 'system'];
  return allowed.includes(tone as VerbTone) ? (tone as VerbTone) : 'system';
};

const resolvePassiveSlotId = (
  effect: PassiveEffectDefinition,
  mapSlots: Record<string, MapSlotDefinition>,
): { slotId: string | null; slotIcon?: string } => {
  if (effect.slotId && mapSlots[effect.slotId]) {
    return { slotId: effect.slotId, slotIcon: mapSlots[effect.slotId]?.icon };
  }
  if (effect.slotTags && effect.slotTags.length > 0) {
    const match = Object.values(mapSlots).find((slot) =>
      slot.slotTags?.some((tag) => effect.slotTags?.includes(tag)),
    );
    if (match) {
      return { slotId: match.id, slotIcon: match.icon };
    }
  }
  return { slotId: null };
};

const parsePassiveIntervalUnits = (effect: PassiveEffectDefinition): number => {
  if (typeof effect.timeUnitsBetweenTicks === 'number' && effect.timeUnitsBetweenTicks > 0) {
    return effect.timeUnitsBetweenTicks;
  }
  const formula = effect.frequencyFormula?.trim();
  if (formula) {
    const numeric = Number(formula);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }
  return 1;
};

export function buildPassiveEffectSummary(params: {
  effect: PassiveEffectDefinition;
  currentTime: number;
  secondsPerTimeUnit: number;
  mapSlots: Record<string, MapSlotDefinition>;
  resourceLabeler: (id: string) => string;
}): VerbSummary | null {
  const { effect, currentTime, secondsPerTimeUnit, mapSlots, resourceLabeler } = params;
  const { slotId, slotIcon } = resolvePassiveSlotId(effect, mapSlots);
  if (!slotId) {
    // Passive effects should always resolve to a slot; return null to avoid floating cards with no anchor.
    return null;
  }

  const tone = coerceVerbTone(effect.verbToneId);
  const visualVariant = toneToVariantMap[tone] ?? 'solar';
  const progressStyle = toneToProgressStyleMap[tone] ?? 'ribbon';
  const intervalUnits = Math.max(1, parsePassiveIntervalUnits(effect));
  const elapsedUnits = currentTime % intervalUnits;
  const progressFraction = clamp01(elapsedUnits / intervalUnits);
  const elapsedSeconds = elapsedUnits * secondsPerTimeUnit;
  const totalDurationSeconds = intervalUnits * secondsPerTimeUnit;
  const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);
  const rewardLabel = formatRewardLabel(effect.resourceDeltas, resourceLabeler);

  return {
    key: effect.id,
    source: 'passive',
    slotId,
    label: effect.label ?? effect.id,
    kindLabel: 'Passive Effect',
    isQuest: false,
    isJob: false,
    icon: effect.icon ?? slotIcon ?? '◎',
    visualVariant,
    progressStyle,
    progressFraction,
    elapsedSeconds,
    totalDurationSeconds,
    remainingSeconds,
    injuryPercentage: 0,
    deathPercentage: 0,
    assignedCount: 0,
    totalSlots: 0,
    rewardLabel,
    tone,
    deadlineLabel: null,
    assigneeNames: [],
    riskLabel: null,
    notes: effect.description ?? null,
  };
}

const deriveVisualVariant = (activity: ActivityDefinition): VerbVisualVariant => {
  if (activity.tags?.includes('quest')) return 'amethyst';
  if (activity.tags?.includes('danger') || activity.tags?.includes('combat')) return 'ember';
  if (activity.tags?.includes('job')) return 'jade';
  if (activity.tags?.includes('training')) return 'azure';
  return 'solar';
};

const deriveProgressStyle = (activity: ActivityDefinition): ProgressStyle => {
  if (activity.tags?.includes('quest')) return 'halo';
  if (activity.tags?.includes('job')) return 'border';
  return 'ribbon';
};

const deriveTone = (activity: ActivityDefinition): VerbTone => {
  const tone = ((activity.metadata ?? {}) as { verbToneId?: VerbTone }).verbToneId;
  if (tone) return tone;
  if (activity.tags?.includes('quest')) return 'quest';
  if (activity.tags?.includes('job')) return 'job';
  if (activity.tags?.includes('danger') || activity.tags?.includes('combat')) return 'danger';
  return 'neutral';
};

const deriveIcon = (activity: ActivityDefinition, slotIcon?: string): ReactNode => {
  const metaIcon = ((activity.metadata ?? {}) as { icon?: string }).icon;
  if (metaIcon) return metaIcon;
  if (slotIcon && slotIcon.trim().length > 0) return slotIcon;
  if (activity.tags?.includes('quest')) return '📜';
  if (activity.tags?.includes('job')) return '⚒️';
  if (activity.tags?.includes('training')) return '📘';
  if (activity.tags?.includes('combat')) return '⚔️';
  return '◇';
};

const deriveRisk = (activity: ActivityDefinition) => {
  const meta = (activity.metadata ?? {}) as { injuryChanceDisplay?: number; deathChanceDisplay?: number };
  return {
    injury: typeof meta?.injuryChanceDisplay === 'number' ? meta.injuryChanceDisplay : 0,
    death: typeof meta?.deathChanceDisplay === 'number' ? meta.deathChanceDisplay : 0,
  };
};

const deriveDeadlineLabel = (params: {
  activity: ActivityDefinition;
  scheduled: ScheduledActivity;
  currentTime: number;
  dayLength: number;
}): string | null => {
  const meta = (params.activity.metadata ?? {}) as { questDeadlineInDays?: number };
  const questDeadlineDays = meta?.questDeadlineInDays;
  if (!questDeadlineDays || questDeadlineDays <= 0) return null;
  const totalDayLength = params.dayLength || 5;
  const deadlineTime = params.scheduled.startTime + questDeadlineDays * totalDayLength;
  const remainingUnits = Math.max(0, deadlineTime - params.currentTime);
  if (remainingUnits <= 0) return 'Expired';
  const remainingDays = Math.floor(remainingUnits / totalDayLength);
  if (remainingDays >= 1) return `${remainingDays}d left`;
  return `${remainingUnits}u left`;
};

const formatRewardLabel = (
  deltas: { resourceId: string }[] | undefined,
  resourceLabeler: (id: string) => string,
): string | null => {
  if (!deltas || deltas.length === 0) return null;
  return deltas.map((delta) => resourceLabeler(delta.resourceId)).join(', ');
};

const createRiskLabel = (injuryPct: number, deathPct: number): string | null => {
  const parts: string[] = [];
  if (injuryPct > 0) parts.push(`Injury ${injuryPct}%`);
  if (deathPct > 0) parts.push(`Death ${deathPct}%`);
  if (parts.length === 0) return null;
  return parts.join(' · ');
};

export function buildScheduledVerbSummary(params: {
  scheduled: ScheduledActivity;
  activity: ActivityDefinition;
  slotIcon?: string;
  resourceLabeler: (id: string) => string;
  currentTime: number;
  secondsPerTimeUnit: number;
  dayLength: number;
  assigneeNames: string[];
}): VerbSummary {
  const durationUnits = Math.max(1, params.scheduled.endTime - params.scheduled.startTime || 1);
  const elapsedUnits = Math.max(
    0,
    Math.min(durationUnits, params.currentTime - params.scheduled.startTime),
  );
  const progressFraction = clamp01(elapsedUnits / durationUnits);
  const elapsedSeconds = elapsedUnits * params.secondsPerTimeUnit;
  const totalDurationSeconds = durationUnits * params.secondsPerTimeUnit;
  const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

  const { injury, death } = deriveRisk(params.activity);
  const isQuest = params.activity.tags?.includes('quest') ?? false;
  const isJob = params.activity.tags?.includes('job') ?? false;
  const rewardsLabel = formatRewardLabel(params.activity.rewards, params.resourceLabeler);
  const assignedCount = params.scheduled.characterIds.length;
  const totalSlots =
    ((params.activity.metadata ?? {}) as { maxCrewSize?: number })?.maxCrewSize ??
    Math.max(1, assignedCount);

  return {
    key: params.scheduled.id,
    source: 'scheduled',
    scheduled: params.scheduled,
    slotId: params.scheduled.slotId ?? null,
    label: params.activity.label ?? params.scheduled.activityId,
    kindLabel: isQuest ? 'Quest' : isJob ? 'Job' : 'Activity',
    isQuest,
    isJob,
    icon: deriveIcon(params.activity, params.slotIcon),
    visualVariant: deriveVisualVariant(params.activity),
    progressStyle: deriveProgressStyle(params.activity),
    progressFraction,
    elapsedSeconds,
    totalDurationSeconds,
    remainingSeconds,
    injuryPercentage: injury,
    deathPercentage: death,
    assignedCount,
    totalSlots,
    rewardLabel: rewardsLabel,
    riskLabel: createRiskLabel(injury, death),
    tone: deriveTone(params.activity),
    deadlineLabel: deriveDeadlineLabel({
      activity: params.activity,
      scheduled: params.scheduled,
      currentTime: params.currentTime,
      dayLength: params.dayLength,
    }),
    assigneeNames: params.assigneeNames,
  };
}

export function buildQuestOfferSummary(params: {
  offer: QuestOffer;
  activity: ActivityDefinition;
  slotIcon?: string;
  resourceLabeler: (id: string) => string;
  currentTime: number;
  secondsPerTimeUnit: number;
  dayLength: number;
}): VerbSummary {
  const { injury, death } = deriveRisk(params.activity);
  const rewardLabel = formatRewardLabel(params.activity.rewards, params.resourceLabeler);

  let deadlineLabel: string | null = null;
  let remainingSeconds = 0;
  if (typeof params.offer.expiresAtTime === 'number') {
    const remainingUnits = Math.max(0, params.offer.expiresAtTime - params.currentTime);
    remainingSeconds = remainingUnits * params.secondsPerTimeUnit;
    if (remainingUnits > 0) {
      if (remainingUnits >= params.dayLength) {
        deadlineLabel = `${Math.floor(remainingUnits / params.dayLength)}d to expire`;
      } else {
        deadlineLabel = `${remainingUnits}u to expire`;
      }
    } else {
      deadlineLabel = 'Expired';
    }
  }

  return {
    key: params.offer.id,
    source: 'questOffer',
    offer: params.offer,
    slotId: params.offer.slotId ?? null,
    label: params.activity.label ?? params.offer.activityId,
    kindLabel: 'Quest Offer',
    isQuest: params.activity.tags?.includes('quest') ?? false,
    isJob: false,
    icon: deriveIcon(params.activity, params.slotIcon),
    visualVariant: deriveVisualVariant(params.activity),
    progressStyle: deriveProgressStyle(params.activity),
    progressFraction: 0,
    elapsedSeconds: 0,
    totalDurationSeconds: 0,
    remainingSeconds,
    injuryPercentage: injury,
    deathPercentage: death,
    assignedCount: 0,
    totalSlots: ((params.activity.metadata ?? {}) as { maxCrewSize?: number })?.maxCrewSize ?? 1,
    rewardLabel,
    riskLabel: createRiskLabel(injury, death),
    tone: deriveTone(params.activity),
    deadlineLabel,
    assigneeNames: [],
  };
}

export function buildCompletedVerbSummary(params: {
  scheduled: ScheduledActivity;
  activity: ActivityDefinition;
  rewards: { resourceId: string }[];
  resourceLabeler: (id: string) => string;
  secondsPerTimeUnit: number;
  assigneeNames: string[];
}): VerbSummary {
  const { injury, death } = deriveRisk(params.activity);
  const rewardLabel = formatRewardLabel(params.rewards, params.resourceLabeler);

  const durationUnits = Math.max(1, params.scheduled.endTime - params.scheduled.startTime || 1);
  const totalDurationSeconds = durationUnits * params.secondsPerTimeUnit;

  const isQuest = params.activity.tags?.includes('quest') ?? false;
  const isJob = params.activity.tags?.includes('job') ?? false;

  return {
    key: `completed-${params.scheduled.id}`,
    source: 'completed',
    scheduled: params.scheduled,
    slotId: params.scheduled.slotId ?? null,
    label: params.activity.label ?? params.scheduled.activityId,
    kindLabel: isQuest ? 'Quest' : isJob ? 'Job' : 'Activity',
    isQuest,
    isJob,
    icon: deriveIcon(params.activity, undefined),
    visualVariant: deriveVisualVariant(params.activity),
    progressStyle: deriveProgressStyle(params.activity),
    progressFraction: 1,
    elapsedSeconds: totalDurationSeconds,
    totalDurationSeconds,
    remainingSeconds: 0,
    injuryPercentage: injury,
    deathPercentage: death,
    assignedCount: params.assigneeNames.length,
    totalSlots: params.assigneeNames.length,
    rewardLabel,
    riskLabel: createRiskLabel(injury, death),
    tone: deriveTone(params.activity),
    deadlineLabel: null,
    assigneeNames: params.assigneeNames,
  };
}

export function buildSystemVerbSummary(params: {
  key: string;
  label: string;
  icon: ReactNode;
  kindLabel: string;
  tone: VerbTone;
  progressFraction: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  rewardLabel: string | null;
  deadlineLabel: string | null;
  notes?: string | null;
}): VerbSummary {
  const clampedProgress = clamp01(params.progressFraction);

  return {
    key: params.key,
    source: 'system',
    slotId: null,
    label: params.label,
    kindLabel: params.kindLabel,
    isQuest: false,
    isJob: false,
    icon: params.icon,
    visualVariant: params.tone === 'system' ? 'solar' : 'ember',
    progressStyle: 'ribbon',
    progressFraction: clampedProgress,
    elapsedSeconds: params.elapsedSeconds,
    totalDurationSeconds: params.totalDurationSeconds,
    remainingSeconds: Math.max(0, params.totalDurationSeconds - params.elapsedSeconds),
    injuryPercentage: 0,
    deathPercentage: 0,
    assignedCount: 0,
    totalSlots: 0,
    rewardLabel: params.rewardLabel,
    tone: params.tone,
    deadlineLabel: params.deadlineLabel,
    assigneeNames: [],
    riskLabel: null,
    notes: params.notes ?? null,
  };
}
