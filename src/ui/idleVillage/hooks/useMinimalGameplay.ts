import { useEffect, useMemo, useRef, useState } from 'react';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { calculateDaysRemaining } from '@/engine/game/idleVillage/SurvivalEngine';
import { DEFAULT_SURVIVAL_CONFIG } from '@/balancing/config/idleVillage/survivalConfig';
import { MINIMAL_GAMEPLAY_CONFIG } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import {
  useGameplayStore,
  selectEconomyState,
  selectQuestState,
  selectSurvivalState,
  selectResidents,
  selectMetaState,
  selectEventLog,
  selectLocationStates,
  GAMEPLAY_STORE_KEY,
  getGameplaySnapshot,
} from '../store/gameplayStore';
import type { GameplayViewState, GameplayActions } from '../types/gameplayTypes';
import type { GameplayStoreState } from '../store/gameplayStore';
import { useGameplayActions } from './useGameplayActions';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import type { GameplayStorePersistedState } from '../store/gameplayStore';

interface MinimalGameplayTraceEntry {
  ts: number;
  label: string;
  payload?: Record<string, unknown>;
}

declare global {
  interface Window {
    __MINIMAL_GAMEPLAY_TRACE__?: MinimalGameplayTraceEntry[];
  }
}

const traceMinimalGameplay = (label: string, payload?: Record<string, unknown>) => {
  if (!import.meta.env.DEV) {
    return;
  }
  const entry: MinimalGameplayTraceEntry = {
    ts: Date.now(),
    label,
    payload,
  };
  if (typeof window !== 'undefined') {
    const buffer = (window.__MINIMAL_GAMEPLAY_TRACE__ ??= []);
    buffer.push(entry);
  }
  console.debug(`[MinimalGameplayTrace] ${label}`, payload);
};

interface UseMinimalGameplayReturn {
  state: GameplayViewState;
  actions: GameplayActions;
  isLoading: boolean;
  error: Error | null;
}

const AUTO_SAVE_INTERVAL_MS = MINIMAL_GAMEPLAY_CONFIG.loop.autosaveIntervalMs;
const LOOP_TICK_INTERVAL_MS = Math.max(500, MINIMAL_GAMEPLAY_CONFIG.loop.tickIntervalMs);
const TELEMETRY_SOURCE = 'useMinimalGameplay';
const IS_TEST_ENV = import.meta.env.MODE === 'test';

const shouldEmitGameplayTelemetry = (): boolean => {
  if (!IS_TEST_ENV) {
    return true;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.__ENABLE_MINIMAL_GAMEPLAY_TELEMETRY__);
};

declare global {
  interface Window {
    __ENABLE_MINIMAL_GAMEPLAY_TELEMETRY__?: boolean;
  }
}

const telemetryEnabled = shouldEmitGameplayTelemetry();

/**
 * Composes derived gameplay state, persistence wiring, autosave, and telemetry suitable for the Minimal Gameplay page.
 */
export function useMinimalGameplay(): UseMinimalGameplayReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveActiveRef = useRef(false);
  const tickActiveRef = useRef(false);
  const hydrationAttemptedRef = useRef(false);

  traceMinimalGameplay('useMinimalGameplay.render.start', {
    isLoading,
    hasError: Boolean(error),
  });

  const economyState = useGameplayStore(selectEconomyState);
  const questState = useGameplayStore(selectQuestState);
  const survivalState = useGameplayStore(selectSurvivalState);
  const residents = useGameplayStore(selectResidents);
  const meta = useGameplayStore(selectMetaState);
  const eventLog = useGameplayStore(selectEventLog);
  const locationStates = useGameplayStore(selectLocationStates);

  const actions = useGameplayActions();

  traceMinimalGameplay('useMinimalGameplay.storeSelectors', {
    gold: economyState.playerGold,
    residents: residents.length,
    isPaused: meta.isPaused,
    events: eventLog.length,
    locations: Object.keys(locationStates).length,
  });

  const derivedState = useMemo<GameplayViewState>(() => {
    const currentFood = survivalState.food.currentFood;
    const maxFood = survivalState.food.maxFood;
    const warningLevel = survivalState.food.warningLevel;

    const daysRemainingResult = calculateDaysRemaining(
      currentFood,
      residents.map((resident) => ({
        residentId: resident.id,
        isWorking: resident.isWorking,
        isInjured: resident.isInjured,
      })),
      DEFAULT_SURVIVAL_CONFIG.consumptionRate
    );

    const activeQuests = questState.activeQuests.map((quest) => quest.questId);

    const nextState = {
      gold: economyState.playerGold,
      food: currentFood,
      maxFood,
      warningLevel,
      daysRemaining: daysRemainingResult.daysRemaining,
      currentDay: survivalState.currentDay,
      residents,
      activeQuests,
      isPaused: meta.isPaused,
      speedMultiplier: meta.speedMultiplier,
      eventLog,
      locationStates,
      gameOver: survivalState.gameOver,
    };

    traceMinimalGameplay('useMinimalGameplay.derivedState', {
      gold: nextState.gold,
      residents: nextState.residents.length,
      isPaused: nextState.isPaused,
    });

    return nextState;
  }, [
    economyState.playerGold,
    meta.isPaused,
    meta.speedMultiplier,
    questState.activeQuests,
    residents,
    survivalState.currentDay,
    survivalState.food,
    survivalState.gameOver,
    eventLog,
    locationStates,
    DEFAULT_SURVIVAL_CONFIG.consumptionRate,
  ]);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return undefined;
    }

    const unsubscribe = useGameplayStore.subscribe((state, prevState) => {
      const changedKeys = Object.keys(state).filter((key) => {
        const typedKey = key as keyof GameplayStoreState;
        return state[typedKey] !== prevState[typedKey];
      });

      traceMinimalGameplay('useMinimalGameplay.gameplayStoreUpdate', {
        changedKeys,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (hydrationAttemptedRef.current) {
      traceMinimalGameplay('useMinimalGameplay.hydration.skip');
      setIsLoading(false);
      return undefined;
    }
    hydrationAttemptedRef.current = true;

    let isMounted = true;
    const hydrateFromPersistence = async () => {
      traceMinimalGameplay('useMinimalGameplay.hydration.start');
      try {
        const snapshot = await loadData<GameplayStorePersistedState | null>(GAMEPLAY_STORE_KEY, null);
        if (snapshot) {
          traceMinimalGameplay('useMinimalGameplay.hydration.applySnapshot', {
            hasResidents: Boolean(snapshot.residents?.length),
            currentDay: snapshot.currentDay,
          });
          useGameplayStore.getState().hydrateFromSnapshot(snapshot);
          if (telemetryEnabled) {
            trackTelemetryEvent('gameplay_state_loaded', {
              source: TELEMETRY_SOURCE,
              timestamp: Date.now(),
              currentDay: snapshot.currentDay,
              residentCount: snapshot.residents?.length ?? 0,
              eventCount: snapshot.eventLog?.length ?? 0,
            });
          }
        }
      } catch (err) {
        if (telemetryEnabled) {
          trackTelemetryEvent('gameplay_state_load_error', {
            source: TELEMETRY_SOURCE,
            timestamp: Date.now(),
            error: err instanceof Error ? err.message : String(err),
          });
        }
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          traceMinimalGameplay('useMinimalGameplay.hydration.complete', {
            hasError: Boolean(error),
          });
          setIsLoading(false);
        }
      }
    };

    hydrateFromPersistence();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (IS_TEST_ENV || autoSaveActiveRef.current) {
      traceMinimalGameplay('useMinimalGameplay.autosave.skip', {
        isTest: IS_TEST_ENV,
        alreadyActive: autoSaveActiveRef.current,
      });
      return undefined;
    }

    autoSaveActiveRef.current = true;
    traceMinimalGameplay('useMinimalGameplay.autosave.start', {
      interval: AUTO_SAVE_INTERVAL_MS,
    });
    autoSaveTimerRef.current = setInterval(async () => {
      const snapshot = getGameplaySnapshot(useGameplayStore.getState());
      try {
        await saveData(GAMEPLAY_STORE_KEY, snapshot);
        useGameplayStore.getState().setLastSavedAt(Date.now());
        if (telemetryEnabled) {
          trackTelemetryEvent('gameplay_state_saved', {
            source: TELEMETRY_SOURCE,
            timestamp: Date.now(),
            currentDay: snapshot.currentDay,
            residentCount: snapshot.residents.length,
          });
        }
      } catch (err) {
        if (telemetryEnabled) {
          trackTelemetryEvent('gameplay_state_save_error', {
            source: TELEMETRY_SOURCE,
            timestamp: Date.now(),
            error: err instanceof Error ? err.message : String(err),
          });
        }
        setError(err as Error);
      }
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      autoSaveActiveRef.current = false;
      traceMinimalGameplay('useMinimalGameplay.autosave.cleanup');
    };
  }, [AUTO_SAVE_INTERVAL_MS]);

  useEffect(() => {
    if (IS_TEST_ENV || tickActiveRef.current) {
      traceMinimalGameplay('useMinimalGameplay.tick.skip', {
        isTest: IS_TEST_ENV,
        alreadyActive: tickActiveRef.current,
      });
      return undefined;
    }

    tickActiveRef.current = true;
    traceMinimalGameplay('useMinimalGameplay.tick.start', {
      interval: LOOP_TICK_INTERVAL_MS,
    });
    tickTimerRef.current = setInterval(() => {
      const snapshot = getGameplaySnapshot(useGameplayStore.getState());
      if (telemetryEnabled) {
        trackTelemetryEvent('minimal_gameplay_tick', {
          source: TELEMETRY_SOURCE,
          timestamp: Date.now(),
          currentDay: snapshot.currentDay,
          gold: snapshot.gold,
          food: snapshot.food,
          residentCount: snapshot.residents.length,
        });
      }
    }, LOOP_TICK_INTERVAL_MS);

    return () => {
      if (tickTimerRef.current) {
        clearInterval(tickTimerRef.current);
      }
      tickActiveRef.current = false;
      traceMinimalGameplay('useMinimalGameplay.tick.cleanup');
    };
  }, [LOOP_TICK_INTERVAL_MS]);

  traceMinimalGameplay('useMinimalGameplay.render.complete');

  return {
    state: derivedState,
    actions,
    isLoading,
    error,
  };
}
