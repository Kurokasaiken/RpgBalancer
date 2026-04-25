import { useCallback, useMemo } from 'react';
import {
  DEFAULT_MINIMAL_CONFIG,
  type MinimalActivity,
  type MinimalConfig,
} from '@/balancing/config/idleVillage/minimalConfig';
import {
  MINIMAL_GAMEPLAY_CONFIG,
  type MinimalGameplayLocationDefinition,
  type MinimalGameplayConfig,
} from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type { MinimalGameplayState } from '@/store/useMinimalGameplay';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';
import type { DropValidationRule } from '@/ui/idleVillage/config/residentDropRules';
import type { DropState } from '@/ui/idleVillage/components/ActivitySlot';
import type { DropFeedbackState } from '@/ui/idleVillage/hooks/useDropFeedback';
import type { UseDropFeedbackTelemetryReturn } from '@/ui/idleVillage/hooks/useDropFeedbackTelemetry';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { computeDropStateForResident } from '@/ui/idleVillage/slots/residentSlotValidators';
import { selectResidentStatus } from '@/store/useMinimalGameplay';
import { useActivitySlotTelemetry } from '@/ui/idleVillage/telemetry/hooks/useActivitySlotTelemetry';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';

const ACTIVITY_VARIANT_MAP: Record<MinimalActivity['type'], VerbVisualVariant> = {
  job: 'azure',
  quest: 'amethyst',
  market: 'solar',
};

const FALLBACK_VARIANTS: VerbVisualVariant[] = ['azure', 'ember', 'jade', 'amethyst', 'solar'];

/**
 * Helper function to build activity map from activities array
 */
function buildActivityMap(activities: MinimalActivity[]): Record<string, MinimalActivity> {
  const map: Record<string, MinimalActivity> = {};
  activities.forEach((activity) => {
    map[activity.id] = activity;
  });
  return map;
}

/**
 * Helper function to normalize locations array
 */
function normalizeLocations(locations?: MinimalGameplayLocationDefinition[]): MinimalGameplayLocationDefinition[] {
  if (!locations) return [];
  return locations;
}

/**
 * Slot metadata derived from Minimal Gameplay config for downstream UI components.
 */
export interface MinimalActivitySlotMetadata {
  locationId: string;
  slotId: string;
  activityId: string;
  label: string;
  icon: string;
  description: string;
  telemetryTags: string[];
  recommendedStatTags: string[];
  durationTicks: number;
  durationSeconds: number;
  cost: MinimalActivity['cost'];
  reward: MinimalActivity['baseReward'];
  statRequirements?: Record<string, number>;
  fatiguePerTick: number;
  hasActivityConfig: boolean;
}

/**
 * ActivitySlot component props interface
 */
export interface MinimalActivitySlotProps {
  slotId: string;
  iconName: string;
  label: string;
  totalDuration: number;
  durationSeconds: number;
  durationTicks: number;
  progressFraction: number;
  elapsedSeconds: number;
  assignedWorkerName: string | null;
  isInteractive: boolean;
  canAcceptDrop: boolean;
  visualVariant: 'azure' | 'ember' | 'jade' | 'amethyst' | 'solar';
  telemetryTags: string[];
  activityId: string;
  description: string;
  cost: MinimalActivity['cost'];
  reward: MinimalActivity['baseReward'];
  fatiguePerTick: number;
  statRequirements?: Record<string, number>;
  onWorkerDrop: (workerId: string | null) => void;
  onInspect?: (slotId: string) => void;
  dropState: DropState;
  showDropFeedback: boolean;
  validationResult?: {
    isValid: boolean;
    message?: string;
    failedRule?: DropValidationRule;
  };
  onResidentDragEnter?: (slotId: string, residentId: string) => void;
  onResidentDragLeave?: (slotId: string) => void;
}

/**
 * Structure returned by {@link useMinimalActivitySlots} exposing slot lists and lookup maps.
 */
export interface UseMinimalActivitySlotsResult {
  slots: MinimalActivitySlotMetadata[];
  slotById: Record<string, MinimalActivitySlotMetadata>;
  slotByActivityId: Record<string, MinimalActivitySlotMetadata>;
}

/**
 * Hook to generate ActivitySlot component props from Minimal Gameplay config and game state
 */
export interface UseMinimalActivitySlotsWithStateOptions {
  minimalConfig?: MinimalConfig;
  gameplayConfig?: MinimalGameplayConfig;
  locations?: MinimalGameplayLocationDefinition[];
  gameState?: MinimalGameplayState['state'];
  onResidentDrop?: (slotId: string, residentId: string | null) => void;
  onSlotInspect?: (slotId: string) => void;
  precomputedSlots?: UseMinimalActivitySlotsResult;
  activeResidentId?: string | null;
  dropFeedbackAdapters?: {
    validateDropWithFeedback?: (params: { resident: ResidentState; activity?: ActivityDefinition }) => {
      isValid: boolean;
      feedbackType: string;
      message: string;
      validationRule?: string;
    };
    showSlotFeedback?: (params: {
      slotId: string;
      feedbackType: string;
      message?: string;
      validationRule?: string;
      residentId?: string;
      activityId?: string;
    }) => void;
    clearSlotFeedback?: (slotId: string) => void;
    slotFeedbackState?: Record<string, DropFeedbackState>;
    telemetry?: UseDropFeedbackTelemetryReturn;
  };
}

export interface UseMinimalActivitySlotsWithStateResult {
  slotProps: MinimalActivitySlotProps[];
  slotMetadata: MinimalActivitySlotMetadata[];
  slotMetadataById: Record<string, MinimalActivitySlotMetadata>;
}

/**
 * Hook to generate ActivitySlot component props from Minimal Gameplay locations and game state
 */
export function useMinimalActivitySlotsWithState({
  minimalConfig,
  gameplayConfig,
  locations,
  gameState,
  onResidentDrop,
  onSlotInspect,
  precomputedSlots,
  activeResidentId,
  dropFeedbackAdapters,
}: UseMinimalActivitySlotsWithStateOptions): UseMinimalActivitySlotsWithStateResult {
  const effectiveGameplayConfig = gameplayConfig ?? MINIMAL_GAMEPLAY_CONFIG;
  const derivedLocations = locations ?? effectiveGameplayConfig.locations;
  const logicConfig = minimalConfig ?? DEFAULT_MINIMAL_CONFIG;

  // Initialize activity slot telemetry hook
  const activitySlotTelemetry = useActivitySlotTelemetry({
    enablePerformanceMonitoring: true,
  });

  const activityById = useMemo(() => {
    const map: Record<string, MinimalActivity | undefined> = {};
    (logicConfig.activities ?? []).forEach((activity) => {
      map[activity.id] = activity;
    });
    return map;
  }, [logicConfig.activities]);

  const slotsResult = precomputedSlots ?? useMinimalActivitySlots(logicConfig, derivedLocations);
  const { slots, slotByActivityId, slotById } = slotsResult;

  const activeActivityMap = useMemo(() => {
    const map: Record<string, MinimalGameplayState['state']['activeActivities'][number]> = {};
    gameState?.activeActivities.forEach((activity) => {
      map[activity.activityId] = activity;
    });
    return map;
  }, [gameState?.activeActivities]);

  const residentNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    gameState?.residents.forEach((resident) => {
      map[resident.id] = resident.name;
    });
    return map;
  }, [gameState?.residents]);

  const residentStatusMap = useMemo(() => {
    return gameState ? selectResidentStatus(gameState) : {};
  }, [gameState]);

  const residentStateMap = useMemo(() => {
    const map: Record<string, ResidentState> = {};
    gameState?.residents.forEach((resident) => {
      const storeStatus = residentStatusMap[resident.id] || 'available';
      const normalizedStatus = storeStatus === 'working' ? 'away' : storeStatus;
      map[resident.id] = {
        id: resident.id,
        displayName: resident.name,
        status: normalizedStatus as ResidentState['status'],
        fatigue: resident.fatigue ?? 0,
        currentHp: 100,
        maxHp: 100,
        isHero: false,
        isInjured: resident.isInjured ?? false,
        survivalCount: 0,
        survivalScore: 0,
        statSnapshot: resident.stats,
      };
    });
    return map;
  }, [gameState?.residents, residentStatusMap]);

  const buildDropHandler = useCallback(
    (slotId: string) => (workerId: string | null) => {
      if (!workerId || !onResidentDrop) {
        return;
      }
      
      onResidentDrop(slotId, workerId);
    },
    [onResidentDrop]
  );

  const buildInspectHandler = useCallback(
    (slotId: string) => () => {
      onSlotInspect?.(slotId);
    },
    [onSlotInspect]
  );

  const slotProps = useMemo(() => {
    return derivedLocations.map((location, index) => {
      const metadata = slotByActivityId[location.activityId];
      const activityDefinition = activityById[location.activityId];
      const activeActivity = activeActivityMap[location.activityId];
      const totalTicks = metadata?.durationTicks ?? activityDefinition?.durationTicks ?? 0;
      const ticksRemaining = activeActivity?.ticksRemaining ?? totalTicks;
      const ticksElapsed = Math.max(0, totalTicks - ticksRemaining);
      const progressFraction = totalTicks > 0 ? Math.min(1, ticksElapsed / totalTicks) : 0;
      const totalDurationSeconds = metadata?.durationSeconds ?? metadata?.durationTicks ?? 0;
      const elapsedSeconds = progressFraction * totalDurationSeconds;
      const visualVariant = metadata?.hasActivityConfig
        ? ACTIVITY_VARIANT_MAP[activityDefinition?.type ?? 'job'] ?? FALLBACK_VARIANTS[0]
        : FALLBACK_VARIANTS[index % FALLBACK_VARIANTS.length];
      const assignedWorkerName = activeActivity
        ? residentNameMap[activeActivity.residentId] ?? null
        : null;
      const baseDropState: DropState = activeActivity ? 'locked' : 'idle';
      let dropState: DropState = baseDropState;
      if (!activeActivity && activeResidentId && activityDefinition) {
        // Create a minimal ActivityDefinition for validation
        const validationActivityDefinition: ActivityDefinition = {
          id: activityDefinition.id,
          label: activityDefinition.name || location.label,
          description: location.description,
          tags: activityDefinition.type === 'job' ? ['job'] : activityDefinition.type === 'quest' ? ['quest'] : ['market'],
          slotTags: ['minimal'],
          resolutionEngineId: activityDefinition.type === 'job' ? 'job' : activityDefinition.type === 'quest' ? 'quest' : 'market',
          durationFormula: activityDefinition.durationTicks.toString(),
          costs: activityDefinition.cost ? [
            { resourceId: 'gold', amountFormula: activityDefinition.cost.gold.toString() },
            { resourceId: 'food', amountFormula: activityDefinition.cost.food.toString() }
          ] : [],
          rewards: activityDefinition.baseReward ? [
            { resourceId: 'gold', amountFormula: activityDefinition.baseReward.gold.toString() },
            { resourceId: 'food', amountFormula: activityDefinition.baseReward.food.toString() }
          ] : [],
          statRequirement: activityDefinition.statRequirements,
          maxSlots: 1,
          dailyFatigueCost: activityDefinition.fatiguePerTick,
        };
        dropState = computeDropStateForResident(
          activeResidentId,
          validationActivityDefinition,
          undefined,
          metadata?.statRequirements,
          residentStateMap,
        );
      }

      const feedbackEntry = dropFeedbackAdapters?.slotFeedbackState?.[location.slotId];
      const validationResult = feedbackEntry?.validationRule
        ? {
            isValid: feedbackEntry.feedbackType === 'valid',
            message: feedbackEntry.message,
            failedRule: feedbackEntry.validationRule as DropValidationRule,
          }
        : undefined;
      const showDropFeedback = Boolean(feedbackEntry?.visible);

      const onResidentDragEnter = dropFeedbackAdapters?.validateDropWithFeedback && activityDefinition
        ? (slotIdParam: string, residentId: string) => {
            const resident = residentStateMap[residentId];
            if (!resident) {
              return;
            }
            // Create a minimal ActivityDefinition from the MinimalActivity data
            const fullActivityDefinition: ActivityDefinition = {
              id: activityDefinition.id,
              label: activityDefinition.name || location.label,
              description: location.description,
              tags: activityDefinition.type === 'job' ? ['job'] : activityDefinition.type === 'quest' ? ['quest'] : ['market'],
              slotTags: ['minimal'],
              resolutionEngineId: activityDefinition.type === 'job' ? 'job' : activityDefinition.type === 'quest' ? 'quest' : 'market',
              durationFormula: activityDefinition.durationTicks.toString(),
              costs: activityDefinition.cost ? [
                { resourceId: 'gold', amountFormula: activityDefinition.cost.gold.toString() },
                { resourceId: 'food', amountFormula: activityDefinition.cost.food.toString() }
              ] : [],
              rewards: activityDefinition.baseReward ? [
                { resourceId: 'gold', amountFormula: activityDefinition.baseReward.gold.toString() },
                { resourceId: 'food', amountFormula: activityDefinition.baseReward.food.toString() }
              ] : [],
              statRequirement: activityDefinition.statRequirements,
              maxSlots: 1,
              dailyFatigueCost: activityDefinition.fatiguePerTick,
            };
            const result = dropFeedbackAdapters.validateDropWithFeedback!({
              resident,
              activity: fullActivityDefinition,
            });
            dropFeedbackAdapters.showSlotFeedback?.({
              slotId: location.slotId,
              feedbackType: result.feedbackType,
              message: result.message,
              validationRule: result.validationRule,
              residentId,
              activityId: location.activityId,
            });
            dropFeedbackAdapters.telemetry?.trackValidation?.({
              residentId,
              activityId: location.activityId,
              isValid: result.isValid,
              reason: result.validationRule,
            });
            dropFeedbackAdapters.telemetry?.trackFeedbackShown?.({
              feedbackType: result.feedbackType as never,
              residentId,
              activityId: location.activityId,
            });
          }
        : undefined;

      const onResidentDragLeave = dropFeedbackAdapters?.clearSlotFeedback
        ? (slotIdParam: string) => {
            dropFeedbackAdapters.clearSlotFeedback?.(location.slotId);
            dropFeedbackAdapters.telemetry?.trackFeedbackHidden?.();
          }
        : undefined;

      return {
        slotId: location.slotId,
        iconName: location.icon,
        label: location.label,
        totalDuration: totalDurationSeconds,
        durationSeconds: totalDurationSeconds,
        durationTicks: totalTicks,
        progressFraction,
        elapsedSeconds,
        assignedWorkerName,
        isInteractive: true,
        canAcceptDrop: !activeActivity,
        visualVariant,
        telemetryTags: metadata?.telemetryTags ?? location.telemetryTags ?? [],
        activityId: location.activityId,
        description: metadata?.description ?? location.description,
        cost: metadata?.cost ?? { gold: 0, food: 0 },
        reward: metadata?.reward ?? { gold: 0, food: 0 },
        fatiguePerTick: metadata?.fatiguePerTick ?? 0,
        statRequirements: metadata?.statRequirements,
        onWorkerDrop: buildDropHandler(location.slotId),
        onInspect: onSlotInspect ? () => onSlotInspect(location.slotId) : undefined,
        dropState,
        showDropFeedback,
        validationResult,
        onResidentDragEnter,
        onResidentDragLeave,
      } satisfies MinimalActivitySlotProps;
    });
  }, [
    derivedLocations,
    slotByActivityId,
    activityById,
    activeActivityMap,
    residentNameMap,
    buildDropHandler,
    onSlotInspect,
    activeResidentId,
    dropFeedbackAdapters,
    residentStateMap,
  ]);

  const slotMetadata = useMemo(() => slots, [slots]);
  const slotMetadataById = useMemo(() => {
    return slots.reduce<Record<string, MinimalActivitySlotMetadata>>((acc, slot) => {
      acc[slot.slotId] = slot;
      return acc;
    }, {});
  }, [slots]);

  return {
    slotProps,
    slotMetadata,
    slotMetadataById,
  };
}

/**
 * Maps Minimal Gameplay config locations to slot metadata consumed by UI + telemetry layers.
 * Keeps ActivitySlot props fully config-driven without inline labels or icons.
 */
export function useMinimalActivitySlots(
  config: MinimalConfig,
  locations?: MinimalGameplayLocationDefinition[]
): UseMinimalActivitySlotsResult {
  return useMemo(() => {
    const secondsPerTick = config.globalRules.secondsPerTimeUnit ?? 1;
    const activityMap = buildActivityMap(config.activities ?? []);
    const derivedLocations = normalizeLocations(locations);

    const slots = derivedLocations.map<MinimalActivitySlotMetadata>((location) => {
      const activity = activityMap[location.activityId];
      const durationTicks = activity?.durationTicks ?? 0;
      const durationSeconds = durationTicks * secondsPerTick;

      return {
        locationId: location.id,
        slotId: location.slotId,
        activityId: location.activityId,
        label: location.label,
        icon: location.icon,
        description: location.description,
        telemetryTags: location.telemetryTags ?? [],
        recommendedStatTags: location.recommendedStatTags ?? [],
        durationTicks,
        durationSeconds,
        cost: activity?.cost ?? { gold: 0, food: 0 },
        reward: activity?.baseReward ?? { gold: 0, food: 0 },
        statRequirements: activity?.statRequirements,
        fatiguePerTick: activity?.fatiguePerTick ?? 0,
        hasActivityConfig: Boolean(activity),
      };
    });

    const slotById = slots.reduce<Record<string, MinimalActivitySlotMetadata>>((acc, slot) => {
      acc[slot.slotId] = slot;
      return acc;
    }, {});

    const slotByActivityId = slots.reduce<Record<string, MinimalActivitySlotMetadata>>((acc, slot) => {
      acc[slot.activityId] = slot;
      return acc;
    }, {});

    return { slots, slotById, slotByActivityId };
  }, [config.activities, config.globalRules.secondsPerTimeUnit, locations]);
}
