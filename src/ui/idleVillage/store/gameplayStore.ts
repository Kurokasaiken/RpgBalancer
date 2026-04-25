/**
 * Gameplay Store
 *
 * Global Zustand store for Minimal Gameplay Page state.
 * Integrates PersistenceService for storage and exposes
 * selectors for performant UI updates.
 */

import { create, type StateCreator } from 'zustand';
import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { DEFAULT_ECONOMY_STATE } from '@/balancing/config/idleVillage/economyConfig';
import type { EconomyState } from '@/balancing/config/idleVillage/types/economyTypes';
import { DEFAULT_QUEST_STATE } from '@/balancing/config/idleVillage/questConfig';
import type { QuestState } from '@/balancing/config/idleVillage/types/questTypes';
import { DEFAULT_SURVIVAL_STATE } from '@/balancing/config/idleVillage/survivalConfig';
import type { SurvivalState } from '@/balancing/config/idleVillage/types/survivalTypes';
import type { VillageEvent } from '@/engine/game/idleVillage/TimeEngine';
import {
  MINIMAL_GAMEPLAY_CONFIG,
  MINIMAL_GAMEPLAY_RESIDENTS,
  type MinimalGameplayResidentDefinition,
} from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type { LocationStateMap, MinimalResident } from '../types/gameplayTypes';
import type { LocationDropState } from '../map/validators/locationDropValidators';
import type { Job } from '../types/jobTypes';

export const GAMEPLAY_STORE_KEY = 'minimal-gameplay-state';

const toMinimalResident = (definition: MinimalGameplayResidentDefinition): MinimalResident => ({
  id: definition.id,
  name: definition.name,
  stats: { ...definition.stats },
  fatigue: definition.fatigue,
  isWorking: false,
  isInjured: Boolean(definition.isInjured),
  level: definition.level,
});

const DEFAULT_RESIDENTS: MinimalResident[] = MINIMAL_GAMEPLAY_RESIDENTS.map(toMinimalResident);

const EVENT_LOG_LIMIT = MINIMAL_GAMEPLAY_CONFIG.ui.logDisplayLimit ?? 10;

const DEFAULT_EVENT_LOG: VillageEvent[] = MINIMAL_GAMEPLAY_CONFIG.defaultEventLog ?? [];

const createDefaultLocationStateMap = (): LocationStateMap => {
  const baseState: LocationStateMap = {};
  MINIMAL_GAMEPLAY_CONFIG.locations.forEach((location) => {
    if (location.slotId) {
      baseState[location.slotId] = 'idle';
    }
  });
  return baseState;
};

export interface GameplayStoreState {
  economyState: EconomyState;
  questState: QuestState;
  survivalState: SurvivalState;
  residents: MinimalResident[];
  jobs: Job[];
  eventLog: VillageEvent[];
  locationStates: LocationStateMap;
  isPaused: boolean;
  speedMultiplier: number;
  currentDay: number;
  lastSavedAt?: number;
  setEconomyState: (updater: EconomyState | ((prev: EconomyState) => EconomyState)) => void;
  setQuestState: (updater: QuestState | ((prev: QuestState) => QuestState)) => void;
  setSurvivalState: (updater: SurvivalState | ((prev: SurvivalState) => SurvivalState)) => void;
  setResidents: (residents: MinimalResident[]) => void;
  addJob: (job: Job) => void;
  setPauseState: (paused: boolean) => void;
  setSpeedMultiplier: (multiplier: number) => void;
  appendEvent: (event: VillageEvent) => void;
  pruneEventLog: (limit: number) => void;
  setLocationState: (locationId: string, state: LocationDropState) => void;
  resetLocationStates: () => void;
  incrementDay: () => void;
  resetAll: () => void;
  setLastSavedAt: (timestamp: number) => void;
  hydrateFromSnapshot: (snapshot: Partial<GameplayStorePersistedState>) => void;
}

export interface GameplayStorePersistedState {
  gold: number;
  food: number;
  maxFood: number;
  warningLevel: SurvivalState['food']['warningLevel'];
  residents: MinimalResident[];
  eventLog: VillageEvent[];
  currentDay: number;
  isPaused: boolean;
  speedMultiplier: number;
  gameOver?: SurvivalState['gameOver'];
  lastSavedAt?: number;
}

const cloneEconomyState = (): EconomyState => ({
  ...DEFAULT_ECONOMY_STATE,
  marketStock: { ...DEFAULT_ECONOMY_STATE.marketStock },
  transactionHistory: [...DEFAULT_ECONOMY_STATE.transactionHistory],
  lastUpdate: Date.now(),
});

const cloneQuestState = (): QuestState => ({
  ...DEFAULT_QUEST_STATE,
  activeQuests: [...DEFAULT_QUEST_STATE.activeQuests],
  history: [...DEFAULT_QUEST_STATE.history],
  cooldowns: { ...DEFAULT_QUEST_STATE.cooldowns },
  lastUpdate: Date.now(),
});

const cloneSurvivalState = (): SurvivalState => ({
  ...DEFAULT_SURVIVAL_STATE,
  food: { ...DEFAULT_SURVIVAL_STATE.food },
  dayConfig: { ...DEFAULT_SURVIVAL_STATE.dayConfig },
  gameOver: { ...DEFAULT_SURVIVAL_STATE.gameOver },
  currentDay: 0,
  lastUpdate: Date.now(),
});

const INITIAL_STATE: GameplayStoreState = {
  economyState: cloneEconomyState(),
  questState: cloneQuestState(),
  survivalState: cloneSurvivalState(),
  residents: DEFAULT_RESIDENTS.map((resident) => ({ ...resident })),
  jobs: [],
  eventLog: [...DEFAULT_EVENT_LOG],
  locationStates: createDefaultLocationStateMap(),
  isPaused: false,
  speedMultiplier: MINIMAL_GAMEPLAY_CONFIG.loop.defaultSpeedMultiplier,
  currentDay: 0,
  lastSavedAt: undefined,
};

export const getGameplaySnapshot = (
  state: GameplayStoreState
): GameplayStorePersistedState => ({
  gold: state.economyState.playerGold,
  food: state.survivalState.food.currentFood,
  maxFood: state.survivalState.food.maxFood,
  warningLevel: state.survivalState.food.warningLevel,
  residents: state.residents,
  eventLog: state.eventLog.slice(-EVENT_LOG_LIMIT),
  currentDay: state.currentDay,
  isPaused: state.isPaused,
  speedMultiplier: state.speedMultiplier,
  gameOver: state.survivalState.gameOver,
  lastSavedAt: state.lastSavedAt,
});

const gameplayStoreInitializer: StateCreator<GameplayStoreState> = (set, get) => ({
  ...INITIAL_STATE,
  setEconomyState: (updater) =>
    set((state) => ({
      economyState:
        typeof updater === 'function'
          ? (updater as (prev: EconomyState) => EconomyState)(state.economyState)
          : updater,
    })),
  setQuestState: (updater) =>
    set((state) => ({
      questState:
        typeof updater === 'function'
          ? (updater as (prev: QuestState) => QuestState)(state.questState)
          : updater,
    })),
  setSurvivalState: (updater) =>
    set((state) => ({
      survivalState:
        typeof updater === 'function'
          ? (updater as (prev: SurvivalState) => SurvivalState)(state.survivalState)
          : updater,
    })),
  setResidents: (residents) => set({ residents }),
  addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
  setPauseState: (paused) => set({ isPaused: paused }),
  setSpeedMultiplier: (multiplier) => set({ speedMultiplier: multiplier }),
  appendEvent: (event) =>
    set((state) => {
      const nextLog = [...state.eventLog, event];
      if (nextLog.length > EVENT_LOG_LIMIT) {
        return { eventLog: nextLog.slice(-EVENT_LOG_LIMIT) };
      }
      return { eventLog: nextLog };
    }),
  pruneEventLog: (limit) =>
    set((state) => ({ eventLog: limit > 0 ? state.eventLog.slice(-limit) : [] })),
  setLocationState: (locationId, locationState) =>
    set((state) => ({
      locationStates: {
        ...state.locationStates,
        [locationId]: locationState,
      },
    })),
  resetLocationStates: () => set({ locationStates: createDefaultLocationStateMap() }),
  incrementDay: () => set((state) => ({ currentDay: state.currentDay + 1 })),
  resetAll: () => {
    set(() => ({
      ...INITIAL_STATE,
      economyState: cloneEconomyState(),
      questState: cloneQuestState(),
      survivalState: cloneSurvivalState(),
    }));
    clearData(GAMEPLAY_STORE_KEY).catch((error) => {
      console.warn('[GameplayStore] Failed to clear persisted state:', error);
    });
  },
  setLastSavedAt: (timestamp) => set({ lastSavedAt: timestamp }),
  hydrateFromSnapshot: (snapshot) => {
    if (!snapshot) return;
    set((state) => {
      const nextEconomyState: EconomyState = {
        ...state.economyState,
        playerGold: snapshot.gold ?? state.economyState.playerGold,
      };

      const nextSurvivalFood: SurvivalState['food'] = {
        ...state.survivalState.food,
        currentFood: snapshot.food ?? state.survivalState.food.currentFood,
        maxFood: snapshot.maxFood ?? state.survivalState.food.maxFood,
        warningLevel: snapshot.warningLevel ?? state.survivalState.food.warningLevel,
      };

      const nextSurvivalState: SurvivalState = {
        ...state.survivalState,
        food: nextSurvivalFood,
        currentDay: snapshot.currentDay ?? state.survivalState.currentDay,
        gameOver: snapshot.gameOver ?? state.survivalState.gameOver,
      };

      return {
        ...state,
        economyState: nextEconomyState,
        survivalState: nextSurvivalState,
        residents: snapshot.residents ?? state.residents,
        jobs: [],
        eventLog: snapshot.eventLog ? snapshot.eventLog.slice(-EVENT_LOG_LIMIT) : state.eventLog,
        isPaused: snapshot.isPaused ?? state.isPaused,
        speedMultiplier: snapshot.speedMultiplier ?? state.speedMultiplier,
        currentDay: snapshot.currentDay ?? state.currentDay,
        lastSavedAt: snapshot.lastSavedAt ?? state.lastSavedAt,
      };
    });
  },
});

export const useGameplayStore = create<GameplayStoreState>()(gameplayStoreInitializer);

function mergeLocationStates(snapshotStates?: LocationStateMap): LocationStateMap {
  const baseline = createDefaultLocationStateMap();
  if (!snapshotStates) {
    return baseline;
  }
  return {
    ...baseline,
    ...snapshotStates,
  };
}

export const selectEconomyState = (state: GameplayStoreState) => state.economyState;
export const selectQuestState = (state: GameplayStoreState) => state.questState;
export const selectSurvivalState = (state: GameplayStoreState) => state.survivalState;
export const selectResidents = (state: GameplayStoreState) => state.residents;
export const selectJobs = (state: GameplayStoreState) => state.jobs;
export const selectMetaState = (state: GameplayStoreState) => ({
  isPaused: state.isPaused,
  speedMultiplier: state.speedMultiplier,
  currentDay: state.currentDay,
  lastSavedAt: state.lastSavedAt,
});
export const selectEventLog = (state: GameplayStoreState) => state.eventLog;
export const selectLocationStates = (state: GameplayStoreState) => state.locationStates;

export default useGameplayStore;
