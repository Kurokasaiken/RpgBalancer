/**
 * Minimal Gameplay Store
 *
 * Config-first Zustand store for Minimal Gameplay Page state.
 * Integrates PersistenceService for storage and exposes selectors for performant UI updates.
 */

import { create, type StateCreator } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useMemo } from 'react';
import {
  clearData,
  saveMinimalGameplaySnapshot,
  loadMinimalGameplaySnapshotData,
} from '@/shared/persistence/PersistenceService';
import { trackTelemetryEvent, traceMinimalGameplay } from '@/analytics/telemetry/telemetryProvider';
import { transformIdleVillageToMinimalConfig } from '@/balancing/config/idleVillage/transformations';
import type { MinimalConfig } from '@/balancing/config/idleVillage/minimalConfig';
import type { MinimalGameplayGameOverReason } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type { MinimalGameplayDropReason } from '@/balancing/config/idleVillage/minimalConfig';
import type { MinimalGameState } from '@/engine/game/idleVillage/minimalSnapshotSerializer';
import type { MinimalResident } from '@/ui/idleVillage/types/gameplayTypes';
import type { MinimalActivityEntry } from '@/ui/idleVillage/config/activityLogPanelConfig';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import {
  canStartActivity as engineCanStartActivity,
  startActivity as engineStartActivity,
  type GameState,
  type ActivityValidationResult,
  MinimalGameplayActionError,
} from '@/engine/game/idleVillage/minimalGameRules';
import { startQuest } from '@/engine/game/idleVillage/QuestEngine';
import type { QuestState } from '@/balancing/config/idleVillage/types/questTypes';
import { ensureMinimalRngState, type MinimalRngState } from '@/engine/game/idleVillage/RandomHelper';
import type { ResidentState as TimeEngineResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { resolveResidentPortrait } from '@/engine/game/idleVillage/residentVisualResolver';
import type { StatBlock } from '@/balancing/types';
import { IntentBridge } from '@/ui/idleVillage/intent/GameIntent';
// import { TEST_RESIDENTS } from '@/balancing/config/idleVillage/testResidents'; // Replaced by TEST_ROSTER_HEROES conversion
import { TEST_ROSTER_HEROES } from '@/balancing/config/idleVillage/testRosterResidents';
import { savedCharacterToResident, residentStateToMinimalResident } from '@/engine/game/idleVillage/characterImport';
import { useCanonicalRosterBundle } from '@/ui/idleVillage/roster/CanonicalRosterBundle';
import type { GameIntent } from '@/ui/idleVillage/intent/GameIntent';

const PERSISTENCE_KEY = 'minimal-gameplay-state';

const EVENT_LOG_LIMIT = 100;
const FALLBACK_RESIDENT_HP = 100;

/**
 * Minimal resident with warning flags for UI display.
 */
export interface MinimalResidentWithWarning extends MinimalResident {
  fatigueWarning?: boolean;
  injuryWarning?: boolean;
}

const deriveDisplayName = (
  residentId: string,
  fallbackName: string,
  _config: MinimalConfig
): string => {
  // MinimalConfig doesn't have residents array, so just use fallback name
  // In the future, this could be enhanced to look up resident definitions
  return fallbackName;
};

const deriveStatTags = (stats?: Record<string, number>): string[] | undefined => {
  if (!stats) return undefined;
  const entries = Object.entries(stats).filter(([, value]) => typeof value === 'number' && Number.isFinite(value as number));
  if (entries.length === 0) {
    return undefined;
  }
  return entries
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 2)
    .map(([key]) => key);
};

const clampPercentage = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
};

const deriveHpValues = (stats: Record<string, number> | undefined, fatiguePercent: number, isInjured: boolean) => {
  const statHp = typeof stats?.hp === 'number' && Number.isFinite(stats.hp) ? Math.max(1, Math.round(stats.hp)) : undefined;
  const maxHp = statHp ?? FALLBACK_RESIDENT_HP;
  const fatigueRatio = clampPercentage(fatiguePercent) / 100;
  const fatiguePenalty = Math.round(maxHp * fatigueRatio * 0.4);
  const injuryPenalty = isInjured ? Math.round(maxHp * 0.25) : 0;
  const currentHp = Math.max(1, Math.min(maxHp, maxHp - fatiguePenalty - injuryPenalty));
  return { currentHp, maxHp };
};

const mapStoreStatusToEngineStatus = (
  status: ResidentStatus | undefined,
  isInjured: boolean
): TimeEngineResidentState['status'] => {
  if (isInjured || status === 'injured') {
    return 'injured';
  }
  if (status === 'working') {
    return 'away';
  }
  return 'available';
};

export function selectResidentRosterStates(
  state: MinimalGameplayState['state'],
  config: MinimalConfig
): TimeEngineResidentState[] {
  const residentStatuses = selectResidentStatus(state);

  return state.residents.map((resident) => {
    const status = mapStoreStatusToEngineStatus(residentStatuses[resident.id], resident.isInjured);
    const fatigue = clampPercentage(resident.fatigue);
    const { currentHp, maxHp } = deriveHpValues(resident.stats, fatigue, resident.isInjured);
    const displayName = deriveDisplayName(resident.id, resident.name, config);
    const statSnapshot = resident.stats && Object.keys(resident.stats).length > 0 ? ({ ...resident.stats } as Partial<StatBlock>) : undefined;
    const statTags = deriveStatTags(resident.stats);

    const baseResident: TimeEngineResidentState = {
      id: resident.id,
      displayName,
      status,
      fatigue,
      currentHp,
      maxHp,
      isHero: resident.isHero,
      isInjured: resident.isInjured,
      survivalCount: 0,
      survivalScore: 0,
      statSnapshot,
      statTags,
    };

    const resolvedPortrait = resolveResidentPortrait(baseResident);

    return {
      ...baseResident,
      portraitUrl: resolvedPortrait.portraitUrl ?? baseResident.portraitUrl,
      fullFigureUrl: resolvedPortrait.fullFigureUrl ?? baseResident.fullFigureUrl,
      portraitCrop: resolvedPortrait.crop ?? baseResident.portraitCrop,
    };
  });
}

/**
 * Activity validation result.
 */
export type StoreActivityValidationResult = ActivityValidationResult;

/**
 * Loop warnings result for banner display.
 */
export interface LoopWarningsResult {
  fatigue: {
    active: boolean;
    message: string;
  };
  food: {
    active: boolean;
    message: string;
  };
  ariaLiveMessage: string;
}

/**
 * Represents an activity currently running in the Minimal Gameplay loop.
 */
export interface ActiveActivityState {
  activityId: string;
  residentId: string;
  ticksRemaining: number;
}

/**
 * Game over state with reason and final statistics.
 */
export interface MinimalGameOverState {
  /** Whether the game is in game over state. */
  isGameOver: boolean;
  /** Reason for the game over. */
  reason?: MinimalGameplayGameOverReason;
  /** Final game statistics. */
  summary?: {
    daysSurvived: number;
    goldEarned: number;
    questsCompleted: number;
    residentsLost: number;
    finalRoster: Array<{
      id: string;
      name: string;
      level: number;
      isInjured?: boolean;
    }>;
  };
  /** Timestamp when game over occurred. */
  gameOverAt?: number;
}

export interface MinimalGameplayState {
  // --- STATE ---
  state: {
    gold: number;
    food: number;
    maxFood: number;
    currentDay: number;
    currentTick: number; // Integer tick count - primary source of truth
    isPaused: boolean;
    speedMultiplier: number;
    residents: MinimalResident[];
    activeActivities: ActiveActivityState[];
    eventLog: MinimalActivityEntry[];
    lastSavedAt?: number;
    rngState?: MinimalRngState;
    // Time engine & day/night cycle state
    isDayPhase: boolean;
    cycleProgress: number; // 0-1 progress through current day/night phase (derived from ticks)
    tickIntervalMs: number;
  };
  config: MinimalConfig;
  isLoading: boolean;
  error: string | null;
  gameOverState: MinimalGameOverState;

  // --- ACTIONS ---
  tick: (deltaMs: number, source?: 'auto' | 'manual') => void;
  pauseGame: (source: 'user' | 'auto') => void;
  resumeGame: (source: 'user' | 'auto') => void;
  resetGame: () => void;
  buyFood: (quantity: number) => { success: boolean; reason?: string; message?: string };
  setSpeedMultiplier: (multiplier: number) => void;
  startActivity: (residentId: string, activityId: string) => void;
  canStartActivity: (residentId: string, activityId: string) => StoreActivityValidationResult;
  startQuestDemo: (activityId: string, residentIds: string[]) => { success: boolean; reason?: string; message?: string };
  addEvent: (event: MinimalActivityEntry) => void;
  clearEvents: () => void;
  daysRemaining: () => number;
  gameOver: () => boolean;
}

/**
 * Persisted state snapshot.
 */
type MinimalGameplaySnapshotData = MinimalGameState & {
  eventLog: MinimalActivityEntry[];
  lastSavedAt?: number;
  rngState?: MinimalRngState;
};

function mapStoreStateToSnapshot(state: MinimalGameplayState['state']): MinimalGameplaySnapshotData {
  return {
    gold: state.gold,
    food: state.food,
    maxFood: state.maxFood,
    currentDay: state.currentDay,
    currentTime: state.currentTick, // Map currentTick to currentTime for backward compatibility
    isPaused: state.isPaused,
    speedMultiplier: state.speedMultiplier,
    residents: state.residents.map((resident) => ({
      id: resident.id,
      name: resident.name,
      level: resident.level,
      stats: resident.stats,
      fatigue: resident.fatigue,
      isWorking: resident.isWorking,
      isInjured: resident.isInjured,
    })),
    activeActivities: state.activeActivities.map((activity) => ({
      activityId: activity.activityId,
      residentId: activity.residentId,
      ticksRemaining: activity.ticksRemaining,
    })),
    eventLog: state.eventLog,
    lastSavedAt: Date.now(),
    rngState: state.rngState,
  };
}

function mapSnapshotToStoreState(
  snapshot: MinimalGameplaySnapshotData,
  fallbackSeed: number
): MinimalGameplayState['state'] {
  return {
    gold: snapshot.gold,
    food: snapshot.food,
    maxFood: snapshot.maxFood,
    currentDay: snapshot.currentDay,
    currentTick: Math.floor(snapshot.currentTime || 0), // Map currentTime back to currentTick (integer)
    isPaused: snapshot.isPaused,
    speedMultiplier: snapshot.speedMultiplier,
    residents: snapshot.residents.map((resident) => ({
      id: resident.id,
      name: resident.name,
      level: resident.level,
      stats: resident.stats,
      fatigue: resident.fatigue,
      isWorking: resident.isWorking,
      isInjured: resident.isInjured,
    })),
    activeActivities: snapshot.activeActivities.map((activity) => ({
      activityId: activity.activityId,
      residentId: activity.residentId,
      ticksRemaining: activity.ticksRemaining,
    })),
    eventLog: snapshot.eventLog ?? [],
    rngState: ensureMinimalRngState(snapshot.rngState, fallbackSeed),
    lastSavedAt: snapshot.lastSavedAt,
  };
}

/**
 * Create initial state from config.
 */
const createInitialState = (config: MinimalConfig) => ({
  gold: config.startingResources.gold,
  food: config.startingResources.food,
  maxFood: config.startingResources.maxFood,
  wood: 0,
  xp: 0,
  currentDay: 0,
  currentTick: 0, // Integer tick count - primary source of truth
  isPaused: true,
  speedMultiplier: config.loop.defaultSpeedMultiplier,
  residents: TEST_ROSTER_HEROES.length > 0 
    ? TEST_ROSTER_HEROES.map((hero) => {
        const resident = savedCharacterToResident(hero, { defaultFatigue: 0 });
        return {
          id: resident.id,
          name: resident.displayName,
          stats: (resident.statSnapshot ? Object.fromEntries(
            Object.entries(resident.statSnapshot).filter(([, value]) => typeof value === 'number')
          ) : {}) as Record<string, number>,
          fatigue: resident.fatigue,
          isWorking: false,
          isInjured: resident.isInjured,
          isHero: resident.isHero,
          level: 1,
        };
      })
    : config.startingResources.residents.map((r) => ({
        id: r.id,
        name: r.name,
        stats: r.stats,
        fatigue: r.fatigue,
        isWorking: false,
        isInjured: r.isInjured,
        level: r.level,
      })),
  activeActivities: [],
  eventLog: [],
  rngState: ensureMinimalRngState(undefined, config.globalRules.rngSeed),
  // Time engine & day/night cycle initialization
  isDayPhase: true, // Start during day
  cycleProgress: 0, // Start at beginning of cycle
  tickIntervalMs: config.loop.tickIntervalMs ?? 1000,
});

/**
 * Create initial state with proper config loading.
 */
const createInitialStateWithConfig = (fallbackConfig: MinimalConfig): MinimalGameplayState['state'] => {
  // TODO: Replace with actual IdleVillageConfig loading when transformation is implemented
  // For now, use documented fallback
  return createInitialState(fallbackConfig);
};

const INITIAL_STATE: MinimalGameplayState = {
  state: {
    ...createInitialStateWithConfig(transformIdleVillageToMinimalConfig({
      version: '1.0.0',
      resources: {},
      activities: {},
      globalRules: {
        maxFatigueBeforeExhausted: 100,
        defaultActivityFatigueGain: 10,
        startingResidentFatigue: 100,
        fatigueRecoveryPerDay: 50,
        dayLengthInTimeUnits: 5,
        dayNightCycle: { dayTimeUnits: 5, nightTimeUnits: 5 },
        secondsPerTimeUnit: 1,
        fatigueYellowThreshold: 33,
        fatigueRedThreshold: 66,
        baseLightInjuryChanceAtMaxFatigue: 0.3,
        dangerInjuryMultiplierPerPoint: 0.1,
        injuryTiers: {},
        deathRules: {
          baseDeathChanceAtMaxDanger: 0.05,
          dangerDeathMultiplierPerPoint: 0.02,
          injuryTierMultipliers: { light: 0.5, moderate: 1, severe: 1.5 },
          questOutcomeAdjustments: { perfect: -0.02, success: -0.01, partial: 0, fail: 0.03, deadly: 0.1 },
          starvationDeathChancePerDay: 0.02,
        },
        foodConsumptionPerResidentPerDay: 1,
        baseFoodPriceInGold: 25,
        startingResources: { gold: 15, food: 8 },
        questXpFormula: 'level * 10',
        maxActiveQuests: 5,
        questSpawnEveryNDays: 1,
        maxGlobalQuestOffers: 4,
        maxQuestOffersPerSlot: 2,
        verbToneColors: {},
        trialOfFire: { highRiskThreshold: 0.4, statBonusMultiplier: 0.15 },
        defaultRandomSeed: 734003,
      },
    })),
    activeActivities: [],
  },
  config: transformIdleVillageToMinimalConfig({
    version: '1.0.0',
    resources: {},
    activities: {},
    globalRules: {
      maxFatigueBeforeExhausted: 100,
      defaultActivityFatigueGain: 10,
      startingResidentFatigue: 100,
      fatigueRecoveryPerDay: 50,
      dayLengthInTimeUnits: 5,
      dayNightCycle: { dayTimeUnits: 5, nightTimeUnits: 5 },
      secondsPerTimeUnit: 1,
      fatigueYellowThreshold: 33,
      fatigueRedThreshold: 66,
      baseLightInjuryChanceAtMaxFatigue: 0.3,
      dangerInjuryMultiplierPerPoint: 0.1,
      injuryTiers: {},
      deathRules: {
        baseDeathChanceAtMaxDanger: 0.05,
        dangerDeathMultiplierPerPoint: 0.02,
        injuryTierMultipliers: { light: 0.5, moderate: 1, severe: 1.5 },
        questOutcomeAdjustments: { perfect: -0.02, success: -0.01, partial: 0, fail: 0.03, deadly: 0.1 },
        starvationDeathChancePerDay: 0.02,
      },
      foodConsumptionPerResidentPerDay: 1,
      baseFoodPriceInGold: 25,
      startingResources: { gold: 15, food: 8 },
      questXpFormula: 'level * 10',
      maxActiveQuests: 5,
      questSpawnEveryNDays: 1,
      maxGlobalQuestOffers: 4,
      maxQuestOffersPerSlot: 2,
      verbToneColors: {},
      trialOfFire: { highRiskThreshold: 0.4, statBonusMultiplier: 0.15 },
      defaultRandomSeed: 734003,
    },
    ui: {
      hud: { fields: [], layout: 'horizontal' },
      actionPanel: { buttons: [], layout: 'horizontal' },
      tooltips: { sections: {} },
      thresholds: { foodDangerDays: 2, fatigueDangerPercent: 75 },
    },
    eventLog: { maxEntries: 100, templates: {} },
    buildings: {},
    nightThreat: { enabled: false, difficulty: 'normal' },
  }),
  isLoading: false,
  error: null,
  gameOverState: {
    isGameOver: false,
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  tick: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  pauseGame: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  resumeGame: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  resetGame: () => {},
  buyFood: () => ({ success: false, reason: 'not_implemented' }),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setSpeedMultiplier: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  startActivity: () => {},
  canStartActivity: () => ({ canStart: false, reasonCode: 'unknown' }),
  startQuestDemo: () => ({ success: false, reason: 'not_implemented' }),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  addEvent: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clearEvents: () => {},
  daysRemaining: () => 0,
  gameOver: () => false,
};

function mapStoreStateToEngineState(state: MinimalGameplayState['state']): GameState {
  return {
    gold: state.gold,
    food: state.food,
    maxFood: state.maxFood,
    residents: state.residents.map((resident) => ({
      id: resident.id,
      name: resident.name,
      level: resident.level,
      stats: resident.stats,
      fatigue: resident.fatigue,
      isInjured: resident.isInjured,
      isWorking: resident.isWorking,
    })),
    activeActivities: state.activeActivities.map((activity) => ({ ...activity })),
    currentDay: state.currentDay,
    isPaused: state.isPaused,
    speedMultiplier: state.speedMultiplier,
    rngState: state.rngState,
  };
}

function mapEngineStateToStoreState(
  engineState: GameState,
  previousState: MinimalGameplayState['state']
): MinimalGameplayState['state'] {
  return {
    ...previousState,
    gold: engineState.gold,
    food: engineState.food,
    maxFood: engineState.maxFood,
    residents: engineState.residents.map((resident) => ({
      id: resident.id,
      name: resident.name,
      stats: resident.stats,
      fatigue: resident.fatigue,
      isWorking: resident.isWorking,
      isInjured: resident.isInjured,
      level: resident.level,
    })),
    activeActivities: engineState.activeActivities.map((activity) => ({
      activityId: activity.activityId,
      residentId: activity.residentId,
      ticksRemaining: activity.ticksRemaining,
    })),
    rngState: engineState.rngState,
  };
}

function mapReasonToDropReason(reason?: string): MinimalGameplayDropReason {
  if (!reason) return 'resident_not_found' as MinimalGameplayDropReason;
  const normalized = reason.toLowerCase();
  if (normalized.includes('resident not found')) return 'resident_not_found';
  if (normalized.includes('activity not found')) return 'activity_not_found';
  if (normalized.includes('already working')) return 'resident_busy';
  if (normalized.includes('injured')) return 'resident_injured';
  if (normalized.includes('exhausted')) return 'resident_exhausted';
  if (normalized.includes('insufficient resources')) return 'insufficient_resources';
  if (normalized.includes('insufficient')) return 'stat_requirement_failed';
  if (normalized.includes('in progress')) return 'activity_in_progress';
  return 'resident_not_found' as MinimalGameplayDropReason;
}

/**
 * Persist state to storage.
 */
async function persistMinimalGameplayState(state: MinimalGameplayState['state']): Promise<void> {
  try {
    const snapshot = mapStoreStateToSnapshot(state);
    await saveMinimalGameplaySnapshot(PERSISTENCE_KEY, snapshot);
  } catch (error) {
    console.warn('[MinimalGameplayStore] Failed to persist state:', error);
  }
}

/**
 * Hydrate state from storage.
 */
async function hydrateMinimalGameplayState(): Promise<MinimalGameplaySnapshotData | null> {
  try {
    const snapshot = await loadMinimalGameplaySnapshotData(PERSISTENCE_KEY);
    return snapshot as MinimalGameplaySnapshotData | null;
  } catch (error) {
    console.warn('[MinimalGameplayStore] Failed to hydrate state:', error);
    return null;
  }
}

/**
 * Store initializer.
 */
const minimalGameplayStoreInitializer: StateCreator<MinimalGameplayState> = (set, get) => ({
  ...INITIAL_STATE,

  tick: (deltaMs, source = 'auto') => {
    const { state, config } = get();
    if (state.isPaused) return;

    // Integer tick model: Add integer ticks based on speed multiplier
    const tickBaseMs = config.loop.tickIntervalMs ?? 1000; // 1 second base
    const speedMultiplier = Math.max(1, state.speedMultiplier || 1);
    
    // Calculate how many integer ticks to add based on elapsed time and speed
    const elapsedSeconds = deltaMs / 1000;
    const ticksToAdd = Math.floor(elapsedSeconds * speedMultiplier);

    if (ticksToAdd <= 0) {
      return;
    }

    set((s) => {
      const nextState = { ...s.state };
      
      // Add integer ticks - this is the primary source of truth
      const previousTick = nextState.currentTick || 0;
      const updatedTick = previousTick + ticksToAdd;
      nextState.currentTick = updatedTick;

      // Derive other time values from integer ticks
      const dayLengthTicks = Math.max(1, config.globalRules.dayLengthInTimeUnits ?? 60);
      const previousDay = nextState.currentDay;
      const nextDay = Math.floor(updatedTick / dayLengthTicks);
      const daysAdvanced = Math.max(0, nextDay - previousDay);

      nextState.currentDay = Math.max(nextDay, 0);

      // FIXED: Recalculate isDayPhase and cycleProgress on EVERY tick, not just transitions
      const dayNightCycle = config.globalRules.dayNightCycle;
      if (dayNightCycle) {
        const totalCycleTicks = dayNightCycle.dayTimeUnits + dayNightCycle.nightTimeUnits;
        const tickInCurrentCycle = updatedTick % totalCycleTicks;
        const wasDayPhase = nextState.isDayPhase;
        
        // Always recalculate these values on every tick
        nextState.isDayPhase = tickInCurrentCycle < dayNightCycle.dayTimeUnits;
        nextState.cycleProgress = nextState.isDayPhase 
          ? tickInCurrentCycle / dayNightCycle.dayTimeUnits
          : (tickInCurrentCycle - dayNightCycle.dayTimeUnits) / dayNightCycle.nightTimeUnits;

        // Track day/night transitions (separate from per-tick calculation)
        if (wasDayPhase !== nextState.isDayPhase) {
          trackTelemetryEvent('day_night_transition', {
            fromPhase: wasDayPhase ? 'day' : 'night',
            toPhase: nextState.isDayPhase ? 'day' : 'night',
            day: nextState.currentDay,
            cycleProgress: nextState.cycleProgress,
          });
        }
      }

      if (daysAdvanced > 0) {
        const residentsCount = Math.max(1, nextState.residents.length);
        const consumptionPerDay = config.globalRules.dailyFoodConsumptionPerResident * residentsCount;
        nextState.food = Math.max(0, nextState.food - consumptionPerDay * daysAdvanced);

        const fatigueRecovery = config.globalRules.fatigueDecayPerRestTick * daysAdvanced;
        nextState.residents = nextState.residents.map((resident) => ({
          ...resident,
          fatigue: Math.max(0, resident.fatigue - fatigueRecovery),
        }));
      }

      trackTelemetryEvent('minimal_gameplay_tick', {
        source,
        deltaMs,
        day: nextState.currentDay,
        currentTick: nextState.currentTick,
        ticksAdded: ticksToAdd,
        gold: nextState.gold,
        food: nextState.food,
        isDayPhase: nextState.isDayPhase,
        cycleProgress: nextState.cycleProgress,
      });

      return { state: nextState };
    });

    // Check for game over conditions after state update (skip during initial hydration)
    queueMicrotask(() => {
      const currentState = get().state;
      // Skip game over check during initial hydration (day 0, tick 0)
      if (currentState.currentDay === 0 && currentState.currentTick === 0) {
        return;
      }

      const isGameOver = currentState.food <= 0 || currentState.residents.every(r => r.isInjured);

      if (isGameOver && !get().gameOverState.isGameOver) {
        const reason: MinimalGameplayGameOverReason = currentState.food <= 0 ? 'food_depleted' : 'all_injured';
        const summary = {
          daysSurvived: currentState.currentDay,
          goldEarned: currentState.gold,
          questsCompleted: 0, // TODO: Track quests when implemented
          residentsLost: currentState.residents.filter(r => r.isInjured).length,
          finalRoster: currentState.residents.map(r => ({
            id: r.id,
            name: r.name,
            level: r.level,
            isInjured: r.isInjured,
          })),
        };

        set({
          gameOverState: {
            isGameOver: true,
            reason,
            summary,
            gameOverAt: Date.now(),
          },
        });

        trackTelemetryEvent('minimal_gameplay_game_over', {
          reason,
          daysSurvived: summary.daysSurvived,
          goldEarned: summary.goldEarned,
          questsCompleted: summary.questsCompleted,
          residentsLost: summary.residentsLost,
        });
      }
    });

    // Schedule persistence
    queueMicrotask(() => {
      const latestState = get().state;
      // Skip game over check during initial hydration (day 0, tick 0)
      if (latestState.currentDay === 0 && latestState.currentTick === 0) {
        persistMinimalGameplayState(latestState).catch((err) => {
          console.error('[MinimalGameplayStore] Persistence failed:', err);
        });
        return;
      }

      // Game over check (only after initial hydration)
      const isGameOver = latestState.food <= 0 || latestState.residents.every(r => r.isInjured);

      if (isGameOver && !get().gameOverState.isGameOver) {
        const reason: MinimalGameplayGameOverReason = latestState.food <= 0 ? 'food_depleted' : 'all_injured';
        const summary = {
          daysSurvived: latestState.currentDay,
          goldEarned: latestState.gold,
          questsCompleted: 0, // TODO: Track quests when implemented
          residentsLost: latestState.residents.filter(r => r.isInjured).length,
          finalRoster: latestState.residents.map(r => ({
            id: r.id,
            name: r.name,
            level: r.level,
            isInjured: r.isInjured,
          })),
        };

        set({
          gameOverState: {
            isGameOver: true,
            reason,
            summary,
            gameOverAt: Date.now(),
          },
        });

        trackTelemetryEvent('minimal_gameplay_game_over', {
          reason,
          daysSurvived: summary.daysSurvived,
          goldEarned: summary.goldEarned,
          questsCompleted: summary.questsCompleted,
          residentsLost: summary.residentsLost,
        });
      }

      persistMinimalGameplayState(latestState).catch((err) => {
        console.error('[MinimalGameplayStore] Persistence failed:', err);
      });
    });
  },

  pauseGame: (source) => {
    const currentState = get().state;
    set({ state: { ...currentState, isPaused: true } });
    trackTelemetryEvent('minimal_gameplay_pause', { 
      source,
      day: currentState.currentDay,
      currentTick: currentState.currentTick,
      isDayPhase: currentState.isDayPhase,
    });
  },

  resumeGame: (source) => {
    const currentState = get().state;
    set({ state: { ...currentState, isPaused: false } });
    trackTelemetryEvent('minimal_gameplay_resume', { 
      source,
      day: currentState.currentDay,
      currentTick: currentState.currentTick,
      isDayPhase: currentState.isDayPhase,
    });
  },

  resetGame: () => {
    const { gameOverState } = get();

    // Save final snapshot before reset if game was over
    if (gameOverState.isGameOver && gameOverState.summary) {
      const finalSnapshot = mapStoreStateToSnapshot(get().state);
      const gameOverSnapshot = {
        ...finalSnapshot,
        gameOverState,
        savedAt: Date.now(),
      };

      // Save game over snapshot for potential recovery/analytics
      saveMinimalGameplaySnapshot(`${PERSISTENCE_KEY}-gameover-${Date.now()}`, gameOverSnapshot).catch((err) => {
        console.warn('[MinimalGameplayStore] Failed to save game over snapshot:', err);
      });
    }

    const { config } = get();
    set({
      state: createInitialState(config),
      error: null,
      gameOverState: {
        isGameOver: false,
      },
    });
    clearData(PERSISTENCE_KEY).catch((err) => {
      console.warn('[MinimalGameplayStore] Failed to clear persisted state:', err);
    });
    trackTelemetryEvent('minimal_gameplay_restart', {
      reason: gameOverState.reason || 'manual',
      daysSurvived: gameOverState.summary?.daysSurvived || 0,
    });
  },

  buyFood: (quantity) => {
    const { state, config } = get();
    const cost = quantity * config.globalRules.baseFoodPriceInGold;

    if (state.gold < cost) {
      const errorMessage = config.ui.errorMessages.insufficientGold;
      traceMinimalGameplay('action_error', {
        action: 'buyFood',
        reason: 'insufficientGold',
        requiredGold: cost,
        availableGold: state.gold,
        quantity,
        message: errorMessage,
      });
      return { success: false, reason: 'insufficientGold', message: errorMessage };
    }

    set((s) => ({
      state: {
        ...s.state,
        gold: s.state.gold - cost,
        food: Math.min(s.state.maxFood, s.state.food + quantity),
      },
    }));

    trackTelemetryEvent('minimal_gameplay_buy_food', {
      quantity,
      cost,
      newGold: state.gold - cost,
    });

    return { success: true };
  },

  setSpeedMultiplier: (multiplier) => {
    const { config } = get();
    const clamped = Math.max(1, Math.min(config.loop.maxSpeedMultiplier, multiplier));
    set((s) => ({
      state: { ...s.state, speedMultiplier: clamped },
    }));
  },

  startActivity: (residentId, activityId) => {
    const { state, config } = get();
    const engineState = mapStoreStateToEngineState(state);

    try {
      const nextEngineState = engineStartActivity(residentId, activityId, engineState, config);
      set((s) => ({
        state: mapEngineStateToStoreState(nextEngineState, s.state),
      }));

      trackTelemetryEvent('minimal_gameplay_start_activity', {
        residentId,
        activityId,
      });

      queueMicrotask(() => {
        const latestState = get().state;
        persistMinimalGameplayState(latestState).catch((err) => {
          console.error('[MinimalGameplayStore] Persistence failed:', err);
        });
      });
    } catch (error) {
      let reasonCode: MinimalGameplayDropReason = 'unknown';
      let errorMessage = 'Unknown activity error';
      if (error instanceof MinimalGameplayActionError) {
        reasonCode = error.reasonCode;
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
        reasonCode = mapReasonToDropReason(errorMessage);
      }
      traceMinimalGameplay('action_error', {
        action: 'startActivity',
        residentId,
        activityId,
        reason: reasonCode,
        error: errorMessage,
      });
      console.warn('[MinimalGameplayStore] Failed to start activity:', error);
    }
  },

  startQuestDemo: (activityId, residentIds) => {
    const { state, config } = get();

    // Check if residents are available (not busy)
    const busyResidents = residentIds.filter(residentId => {
      const resident = state.residents.find(r => r.id === residentId);
      return resident?.isWorking || resident?.isInjured;
    });

    if (busyResidents.length > 0) {
      const errorMessage = config.ui.errorMessages.residentBusy;
      traceMinimalGameplay('action_error', {
        action: 'startQuestDemo',
        activityId,
        residentIds,
        busyResidents,
        reason: 'residentBusy',
        message: errorMessage,
      });
      return { success: false, reason: 'residentBusy', message: errorMessage };
    }

    // Check if activity exists and is a quest
    const activity = config.activities.find(a => a.id === activityId);
    if (!activity || activity.type !== 'quest') {
      const errorMessage = config.ui.errorMessages.questLocked;
      traceMinimalGameplay('action_error', {
        action: 'startQuestDemo',
        activityId,
        residentIds,
        reason: 'questLocked',
        message: errorMessage,
      });
      return { success: false, reason: 'questLocked', message: errorMessage };
    }

    // Check quest limits (maxActiveQuests)
    // Note: For demo, we'll assume quest state is managed separately
    // In a full implementation, we'd check active quests count

    try {
      // Use QuestEngine to start the quest
      const questState: QuestState = {
        activeQuests: [],
        history: [],
        cooldowns: {},
        lastUpdate: Date.now(),
      };
      const updatedQuestState = startQuest(questState, activityId, residentIds);

      // Update resident states to working
      set((s) => ({
        state: {
          ...s.state,
          residents: s.state.residents.map(resident =>
            residentIds.includes(resident.id)
              ? { ...resident, isWorking: true }
              : resident
          ),
        },
      }));

      trackTelemetryEvent('minimal_gameplay_start_activity', {
        activityId,
        residentIds,
        questState: updatedQuestState,
      });

      queueMicrotask(() => {
        const latestState = get().state;
        persistMinimalGameplayState(latestState).catch((err) => {
          console.error('[MinimalGameplayStore] Persistence failed:', err);
        });
      });

      return { success: true };
    } catch (error) {
      const errorMessage = config.ui.errorMessages.questLocked;
      traceMinimalGameplay('action_error', {
        action: 'startQuestDemo',
        activityId,
        residentIds,
        reason: 'questLocked',
        error: error instanceof Error ? error.message : 'Unknown quest error',
        message: errorMessage,
      });
      return { success: false, reason: 'questLocked', message: errorMessage };
    }
  },

  canStartActivity: (residentId, activityId) => {
    const { state, config } = get();
    const engineState = mapStoreStateToEngineState(state);
    const validation = engineCanStartActivity(residentId, activityId, engineState, config);
    return validation;
  },

  addEvent: (event) => {
    set((s) => {
      const nextLog = [...s.state.eventLog, event];
      if (nextLog.length > EVENT_LOG_LIMIT) {
        return { state: { ...s.state, eventLog: nextLog.slice(-EVENT_LOG_LIMIT) } };
      }
      return { state: { ...s.state, eventLog: nextLog } };
    });
    trackTelemetryEvent('minimal_gameplay_event_logged', {
      severity: event.severity,
      message: event.message,
      residentId: event.residentId,
      activityId: event.activityId,
    });
  },

  clearEvents: () => {
    set((s) => ({ state: { ...s.state, eventLog: [] } }));
  },

  daysRemaining: () => {
    const { state, config } = get();
    const dailyConsumption = config.globalRules.dailyFoodConsumptionPerResident * state.residents.length;
    return dailyConsumption > 0 ? Math.floor(state.food / dailyConsumption) : 999;
  },

  gameOver: () => {
    const { state } = get();
    return state.food <= 0;
  },
});

/**
 * Zustand store with selector middleware.
 */
export const useMinimalGameplayStore = create<MinimalGameplayState>()(
  subscribeWithSelector(minimalGameplayStoreInitializer)
);

/**
 * Handle intents from Director - single mutation layer
 */
const handleIntent = (intent: GameIntent) => {
  console.log('[MinimalGameplayStore] Handling intent:', intent);
  
  switch (intent.type) {
    case 'SPAWN_HERO':
      useMinimalGameplayStore.setState((state) => ({
        ...state,
        state: {
          ...state.state,
          residents: {
            ...state.state.residents,
            [intent.payload.id]: intent.payload
          }
        }
      }));
      break;
      
    case 'ENABLE_JOB': {
      useMinimalGameplayStore.setState((state) => ({
        ...state,
        state: {
          ...state.state,
          activeActivities: [
            ...state.state.activeActivities,
            {
              id: intent.payload.id,
              activityId: intent.payload.id,
              residentId: null,
              startTime: null,
              progress: 0,
              status: 'available' as const
            }
          ]
        }
      }));
      break;
    }
      
    case 'TRIGGER_WAVE': {
      useMinimalGameplayStore.setState((state) => ({
        ...state,
        state: {
          ...state.state,
          waveState: {
            active: true,
            timestamp: intent.timestamp,
            totalAssignedResidents: intent.payload.totalAssignedResidents,
            defensiveResidents: intent.payload.defensiveResidents,
            runTime: intent.payload.runTime
          }
        }
      }));
      
      // Check wave success/failure
      const waveData = intent.payload;
      const villageDestroyed = waveData.defensiveResidents === 0 && waveData.totalAssignedResidents < 2;
      
      if (villageDestroyed) {
        console.log('[MinimalGameplayStore] Village destroyed by wave - triggering game over');
        handleIntent({
          type: 'GAME_OVER',
          payload: {
            reason: 'wave_defeat',
            timestamp: Date.now(),
            runTime: waveData.runTime
          },
          timestamp: Date.now()
        });
      } else {
        console.log('[MinimalGameplayStore] Wave survived!');
      }
      break;
    }
      
    case 'GAME_OVER':
      useMinimalGameplayStore.setState((state) => ({
        ...state,
        state: {
          ...state.state,
          gameStatus: 'game_over',
          gameOverTimestamp: intent.timestamp,
          gameOverReason: intent.payload.reason,
          finalState: intent.payload
        }
      }));
      break;
      
    default:
      console.warn('[MinimalGameplayStore] Unknown intent type:', intent.type);
  }
};

/**
 * Initialize the store (hydrate from persistence, start autosave).
 */
/**
 * Check if gameplay state residents are valid for canonical hydration
 */
function isValidHydratedResidents(residents: unknown): residents is MinimalResident[] {
  return Array.isArray(residents) && 
         residents.length > 0 && 
         residents.every(r => 
           r && 
           typeof r === 'object' &&
           'id' in r && typeof r.id === 'string' && r.id.length > 0 &&
           'name' in r && typeof r.name === 'string' && r.name.length > 0 &&
           'level' in r && typeof r.level === 'number' && r.level >= 1 &&
           'fatigue' in r && typeof r.fatigue === 'number' && r.fatigue >= 0 &&
           'isWorking' in r && typeof r.isWorking === 'boolean' &&
           'isInjured' in r && typeof r.isInjured === 'boolean' &&
           'stats' in r && typeof r.stats === 'object' && r.stats !== null
         );
}

export async function initializeMinimalGameplayStore(): Promise<void> {
  try {
    // Register intent handler before hydration
    IntentBridge.registerStoreHandler(handleIntent);
    
    const snapshot = await hydrateMinimalGameplayState();
    if (snapshot) {
      useMinimalGameplayStore.setState((s) => {
        const restoredState = mapSnapshotToStoreState(
          snapshot,
          s.config.globalRules.rngSeed
        );
        
        // REAL STORE-FIRST POLICY: hydrated residents -> config -> fallback
        let finalResidents: MinimalResident[];
        
        // 1. Try to use valid hydrated residents from persisted state
        if (isValidHydratedResidents(snapshot.residents)) {
          finalResidents = snapshot.residents;
          console.log('[MinimalGameplayStore] Bootstrap: Using valid hydrated residents from persisted state');
        } else if (s.config.startingResources.residents.length > 0) {
          // 2. Fallback to config startingResidents
          finalResidents = s.config.startingResources.residents;
          console.log('[MinimalGameplayStore] Bootstrap: Using config startingResidents (no valid hydrated state)');
        } else {
          // 3. Last resort: hardcoded fallback with requested residents
          finalResidents = [
            {
              id: 'sir-spaccaculi',
              name: 'Sir Spaccaculi',
              stats: { strength: 8, endurance: 7, agility: 5, intelligence: 4, perception: 3 },
              fatigue: 0,
              isWorking: false,
              isInjured: false,
              level: 1,
            },
            {
              id: 'salvatrice',
              name: 'Salvatrice',
              stats: { strength: 5, endurance: 6, agility: 7, intelligence: 6, perception: 5 },
              fatigue: 0,
              isWorking: false,
              isInjured: false,
              level: 1,
            },
            {
              id: 'giggiolillo',
              name: 'Giggiolillo',
              stats: { strength: 4, endurance: 5, agility: 6, intelligence: 7, perception: 8 },
              fatigue: 0,
              isWorking: false,
              isInjured: false,
              level: 1,
            },
          ];
          console.log('[MinimalGameplayStore] Bootstrap: Using hardcoded fallback residents (Sir Spaccaculi, Salvatrice, Giggiolillo)');
        }
        
        return {
          state: {
            ...s.state,
            ...restoredState,
            // Apply architectural bootstrap policy for residents
            residents: finalResidents,
            currentTick: Math.floor(
              snapshot.currentTime ??
              snapshot.currentDay * (s.config.globalRules.dayLengthInTimeUnits ?? 60)
            ),
            // Ensure required time engine properties are present
            isDayPhase: restoredState.isDayPhase ?? true,
            cycleProgress: restoredState.cycleProgress ?? 0,
            tickIntervalMs: restoredState.tickIntervalMs ?? s.config.loop.tickIntervalMs ?? 1000,
          },
        };
      });
    } else {
      // No snapshot available - bootstrap directly from config
      console.log('[MinimalGameplayStore] Bootstrap: No hydrated state available, using config bootstrap');
      // Store will use INITIAL_STATE which should already have config residents
    }
  } catch (error) {
    console.error('[MinimalGameplayStore] Initialization failed:', error);
    useMinimalGameplayStore.setState({ error: 'Failed to initialize store' });
  }
}

/**
 * Selector: roster with warnings.
 */
export function selectRosterWithWarnings(
  state: MinimalGameplayState['state'],
  config: MinimalConfig
): MinimalResidentWithWarning[] {
  return state.residents.map((r) => ({
    ...r,
    fatigueWarning: r.fatigue >= (config.ui?.warningThresholds?.fatigueDangerPercent ?? 70),
    injuryWarning: r.isInjured,
  }));
}

/**
 * Resident status for UI display.
 */
export type ResidentStatus = 'available' | 'working' | 'injured';

/**
 * Selector: resident status (Available/Working/Injured).
 */
export function selectResidentStatus(
  state: MinimalGameplayState['state']
): Record<string, ResidentStatus> {
  const statusMap: Record<string, ResidentStatus> = {};

  // First, mark all as available
  state.residents.forEach(resident => {
    statusMap[resident.id] = 'available';
  });

  // Then mark working residents
  state.activeActivities.forEach(activity => {
    if (statusMap[activity.residentId]) {
      statusMap[activity.residentId] = 'working';
    }
  });

  // Finally, mark injured residents (overrides working)
  state.residents.forEach(resident => {
    if (resident.isInjured) {
      statusMap[resident.id] = 'injured';
    }
  });

  return statusMap;
}

/**
 * Selector: roster with status and warnings combined.
 */
export function selectRosterWithStatusAndWarnings(
  state: MinimalGameplayState['state'],
  config: MinimalConfig
): Array<MinimalResidentWithWarning & { status: ResidentStatus }> {
  const residentStatuses = selectResidentStatus(state);

  return state.residents.map((r) => ({
    ...r,
    status: residentStatuses[r.id] || 'available',
    fatigueWarning: r.fatigue >= (config.ui?.warningThresholds?.fatigueDangerPercent ?? 70),
    injuryWarning: r.isInjured,
  }));
}

/**
 * Selector: loop warnings.
 */
export function selectLoopWarnings(
  state: MinimalGameplayState['state'],
  config: MinimalConfig
): LoopWarningsResult {
  // MinimalGameplayConfig doesn't have globalRules, so use documented fallback
  // TODO: Update when IdleVillageConfig transformation is implemented
  const dailyFoodConsumptionPerResident = 1; // From IdleVillageConfig.globalRules.foodConsumptionPerResidentPerDay
  const foodDangerDays = config.ui?.warningThresholds?.foodDangerDays ?? 2;
  const fatigueDangerPercent = config.ui?.warningThresholds?.fatigueDangerPercent ?? 75;
  
  const daysRemaining = Math.floor(
    state.food / (dailyFoodConsumptionPerResident * state.residents.length)
  );
  const avgFatigue =
    state.residents.length > 0
      ? Math.round(state.residents.reduce((sum, r) => sum + r.fatigue, 0) / state.residents.length)
      : 0;

  const fatigueActive = avgFatigue >= fatigueDangerPercent;
  const foodActive = daysRemaining <= foodDangerDays;

  return {
    fatigue: {
      active: fatigueActive,
      message: fatigueActive
        ? `High fatigue detected (${Math.round(avgFatigue * 100)}%)`
        : 'Fatigue levels normal',
    },
    food: {
      active: foodActive,
      message: foodActive
        ? `Low food supply (${daysRemaining} days remaining)`
        : 'Food supply adequate',
    },
    ariaLiveMessage: [
      fatigueActive && `High fatigue detected (${Math.round(avgFatigue * 100)}%)`,
      foodActive && `Low food supply (${daysRemaining} days remaining)`,
    ]
      .filter(Boolean)
      .join('; '),
  };
}

/**
 * Selector: recent events from the event log.
 */
export function selectRecentEvents(
  state: MinimalGameplayState['state'],
  limit: number
): MinimalActivityEntry[] {
  return state.eventLog.slice(-limit);
}

/**
 * Selector: full event log.
 */
export function selectEventLog(state: MinimalGameplayState['state']): MinimalActivityEntry[] {
  return state.eventLog;
}

/**
 * Hook to use MinimalGameplay store with real IdleVillageConfig integration.
 * Replaces DEFAULT_MINIMAL_CONFIG fallback with loaded configuration.
 */
export function useMinimalGameplayWithIdleVillageConfig() {
  const idleVillageConfig = useIdleVillageConfig();
  const store = useMinimalGameplayStore();

  // Memoized config that transforms IdleVillageConfig to MinimalConfig
  const config = useMemo(() => {
    // If IdleVillageConfig is available and initialized, transform it to MinimalConfig
    if (idleVillageConfig.initialized && idleVillageConfig.config) {
      return transformIdleVillageToMinimalConfig(idleVillageConfig.config);
    }
    // Fall back to transformed config if IdleVillageConfig is not available
    return transformIdleVillageToMinimalConfig({
      version: '1.0.0',
      resources: {},
      activities: {},
      globalRules: {
        maxFatigueBeforeExhausted: 100,
        defaultActivityFatigueGain: 10,
        startingResidentFatigue: 100,
        fatigueRecoveryPerDay: 50,
        dayLengthInTimeUnits: 5,
        dayNightCycle: { dayTimeUnits: 5, nightTimeUnits: 5 },
        secondsPerTimeUnit: 1,
        fatigueYellowThreshold: 33,
        fatigueRedThreshold: 66,
        baseLightInjuryChanceAtMaxFatigue: 0.3,
        dangerInjuryMultiplierPerPoint: 0.1,
        injuryTiers: {},
        deathRules: {
          baseDeathChanceAtMaxDanger: 0.05,
          dangerDeathMultiplierPerPoint: 0.02,
          injuryTierMultipliers: { light: 0.5, moderate: 1, severe: 1.5 },
          questOutcomeAdjustments: { perfect: -0.02, success: -0.01, partial: 0, fail: 0.03, deadly: 0.1 },
          starvationDeathChancePerDay: 0.02,
        },
        foodConsumptionPerResidentPerDay: 1,
        baseFoodPriceInGold: 25,
        startingResources: { gold: 15, food: 8 },
        questXpFormula: 'level * 10',
        maxActiveQuests: 5,
        questSpawnEveryNDays: 1,
        maxGlobalQuestOffers: 4,
        maxQuestOffersPerSlot: 2,
        verbToneColors: {},
        trialOfFire: { highRiskThreshold: 0.4, statBonusMultiplier: 0.15 },
        defaultRandomSeed: 734003,
      },
      ui: {
        hud: { fields: [], layout: 'horizontal' },
        actionPanel: { buttons: [], layout: 'horizontal' },
        tooltips: { sections: {} },
        thresholds: { foodDangerDays: 2, fatigueDangerPercent: 75 },
      },
      eventLog: { maxEntries: 100, templates: {} },
      buildings: {},
      nightThreat: { enabled: false, difficulty: 'normal' },
    });
  }, [idleVillageConfig.initialized, idleVillageConfig.config]);

  return {
    ...store,
    config,
  };
}

/**
 * Optimized selector for ResidentRosterPanel that returns TimeEngineResidentState[]
 * with portrait, statTags, and all UI-ready properties.
 * Pure function - no React hooks, suitable for use in React components with useMemo.
 */
export function selectResidentRosterStatesForLab(
  state: MinimalGameplayState['state'],
  config: MinimalConfig
): TimeEngineResidentState[] {
  return selectResidentRosterStates(state, config);
}