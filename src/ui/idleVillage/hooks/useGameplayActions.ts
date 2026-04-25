import { useCallback, useMemo, useRef } from 'react';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import {
  DEFAULT_WARNING_THRESHOLDS,
  DEFAULT_SURVIVAL_STATE,
} from '@/balancing/config/idleVillage/survivalConfig';
import type { WarningThresholds } from '@/balancing/config/idleVillage/types/survivalTypes';
import { addFood, setDayPaused, setDaySpeed } from '@/engine/game/idleVillage/SurvivalEngine';
import { startQuest as startQuestEngine } from '@/engine/game/idleVillage/QuestEngine';
import type { VillageEvent } from '@/engine/game/idleVillage/TimeEngine';
import {
  MINIMAL_GAMEPLAY_CONFIG,
  type MinimalGameplayLocationDefinition,
} from '@/balancing/config/idleVillage/minimalGameplayConfig';
import { useGameplayStore } from '../store/gameplayStore';
import type { GameplayActions } from '../types/gameplayTypes';

const ACTION_EVENT = 'minimal_gameplay_action';
const ACTION_ERROR_EVENT = 'minimal_gameplay_action_error';
const MIN_SPEED_MULTIPLIER = 0.25;
const MAX_SPEED_MULTIPLIER = MINIMAL_GAMEPLAY_CONFIG.loop.maxSpeedMultiplier;
const DEFAULT_SPEED_MULTIPLIER = MINIMAL_GAMEPLAY_CONFIG.loop.defaultSpeedMultiplier;

const now = () => Date.now();

const traceGameplayActions = (label: string, payload?: Record<string, unknown>) => {
  if (!import.meta.env.DEV) {
    return;
  }
  const entry = { ts: now(), label, payload };
  if (typeof window !== 'undefined') {
    const buffer = (window.__MINIMAL_GAMEPLAY_TRACE__ ??= []);
    buffer.push(entry);
  }
  console.debug(`[GameplayActionsTrace] ${label}`, payload);
};

function emit(action: string, payload: Record<string, unknown>) {
  trackTelemetryEvent(ACTION_EVENT, {
    source: 'useGameplayActions',
    action,
    timestamp: now(),
    ...payload,
  });
}

const LOCATION_LOOKUP: Record<string, MinimalGameplayLocationDefinition> = MINIMAL_GAMEPLAY_CONFIG.locations.reduce(
  (acc, location) => {
    acc[location.id] = location;
    acc[location.slotId] = location;
    return acc;
  },
  {} as Record<string, MinimalGameplayLocationDefinition>
);

function emitError(action: string, error: unknown, payload?: Record<string, unknown>) {
  trackTelemetryEvent(ACTION_ERROR_EVENT, {
    source: 'useGameplayActions',
    action,
    timestamp: now(),
    message: error instanceof Error ? error.message : String(error),
    ...payload,
  });
}

export function useGameplayActions(): GameplayActions {
  const { config } = useIdleVillageConfig();
  const renderIdRef = useRef<number>(() => now());

  traceGameplayActions('useGameplayActions.render.start', {
    renderId: renderIdRef.current,
    configVersion: config.meta?.version ?? 'unknown',
  });

  const { baseFoodPriceInGold, maxActiveQuests } = useMemo(() => {
    const fallback = DEFAULT_IDLE_VILLAGE_CONFIG.globalRules;
    return {
      baseFoodPriceInGold: config.globalRules.baseFoodPriceInGold ?? fallback.baseFoodPriceInGold,
      maxActiveQuests: config.globalRules.maxActiveQuests ?? fallback.maxActiveQuests,
    };
  }, [config.globalRules.baseFoodPriceInGold, config.globalRules.maxActiveQuests]);

  traceGameplayActions('useGameplayActions.configDerived', {
    baseFoodPriceInGold,
    maxActiveQuests,
  });

  const warningThresholds = useMemo<WarningThresholds>(() => DEFAULT_WARNING_THRESHOLDS, []);

  const setEconomyState = useGameplayStore((state) => state.setEconomyState);
  const setQuestState = useGameplayStore((state) => state.setQuestState);
  const setSurvivalState = useGameplayStore((state) => state.setSurvivalState);
  const setResidents = useGameplayStore((state) => state.setResidents);
  const setPauseState = useGameplayStore((state) => state.setPauseState);
  const setSpeedMultiplier = useGameplayStore((state) => state.setSpeedMultiplier);
  const setLocationState = useGameplayStore((state) => state.setLocationState);
  const resetLocationStates = useGameplayStore((state) => state.resetLocationStates);
  const appendEvent = useGameplayStore((state) => state.appendEvent);
  const resetAll = useGameplayStore((state) => state.resetAll);

  const wrapSetter = useCallback(
    <T extends (...args: any[]) => any>(label: string, setter: T): T => {
      if (!import.meta.env.DEV) {
        return setter;
      }
      const wrapped = ((...args: Parameters<T>) => {
        traceGameplayActions('useGameplayActions.setter.invoke', {
          renderId: renderIdRef.current,
          setter: label,
        });
        return setter(...args);
      }) as T;
      return wrapped;
    },
    [],
  );

  const setEconomyStateTraced = wrapSetter('setEconomyState', setEconomyState);
  const setQuestStateTraced = wrapSetter('setQuestState', setQuestState);
  const setSurvivalStateTraced = wrapSetter('setSurvivalState', setSurvivalState);
  const setResidentsTraced = wrapSetter('setResidents', setResidents);
  const setPauseStateTraced = wrapSetter('setPauseState', setPauseState);
  const setSpeedMultiplierTraced = wrapSetter('setSpeedMultiplier', setSpeedMultiplier);
  const setLocationStateTraced = wrapSetter('setLocationState', setLocationState);
  const resetLocationStatesTraced = wrapSetter('resetLocationStates', resetLocationStates);
  const appendEventTraced = wrapSetter('appendEvent', appendEvent);
  const resetAllTraced = wrapSetter('resetAll', resetAll);

  const logEvent = useCallback(
    (type: VillageEvent['type'], payload: Record<string, unknown>) => {
      appendEventTraced({
        time: Math.floor(now() / 1000),
        type,
        payload,
      });
    },
    [appendEventTraced]
  );

  const lockAllLocations = useCallback(() => {
    MINIMAL_GAMEPLAY_CONFIG.locations.forEach((location) => {
      setLocationStateTraced(location.slotId, 'locked');
    });
  }, [setLocationStateTraced]);

  const buyFood = useCallback(
    (quantity: number) => {
      try {
        const normalizedQuantity = Math.max(0, Math.floor(quantity));
        if (normalizedQuantity === 0) {
          emit('buyFood', { success: false, reason: 'invalid_quantity', quantity });
          return;
        }

        let applied = 0;
        let goldSpent = 0;

        setEconomyStateTraced((prev) => {
          const currentStock = prev.marketStock.food;
          const hasFiniteStock = typeof currentStock === 'number' && Number.isFinite(currentStock);
          const stockLimitedQuantity = hasFiniteStock
            ? Math.min(normalizedQuantity, Math.max(0, currentStock))
            : normalizedQuantity;

          const affordable = Math.min(
            stockLimitedQuantity,
            Math.floor(prev.playerGold / baseFoodPriceInGold)
          );

          if (affordable <= 0) {
            applied = 0;
            return prev;
          }

          applied = affordable;
          goldSpent = applied * baseFoodPriceInGold;

          const nextStock = hasFiniteStock
            ? Math.max(0, currentStock - applied)
            : currentStock;

          return {
            ...prev,
            playerGold: prev.playerGold - goldSpent,
            marketStock: {
              ...prev.marketStock,
              food: nextStock,
            },
            transactionHistory: [
              ...prev.transactionHistory,
              {
                timestamp: now(),
                type: 'purchase',
                itemId: 'food',
                quantity: applied,
                goldAmount: -goldSpent,
                goldAfter: prev.playerGold - goldSpent,
              },
            ],
            lastUpdate: now(),
          };
        });

        if (applied <= 0) {
          emit('buyFood', { success: false, reason: 'insufficient_resources', quantity });
          return;
        }

        setSurvivalStateTraced((prev) => addFood(prev, applied, warningThresholds));
        logEvent('activity_completed', {
          action: 'buyFood',
          quantity: applied,
          totalCost: goldSpent,
          unitPrice: baseFoodPriceInGold,
        });
        emit('buyFood', {
          success: true,
          quantity: applied,
          totalCost: goldSpent,
          unitPrice: baseFoodPriceInGold,
        });
      } catch (error) {
        emitError('buyFood', error, { quantity });
      }
    },
    [baseFoodPriceInGold, logEvent, setEconomyState, setSurvivalState, warningThresholds]
  );

  const startQuest = useCallback(
    (questId: string, residentIds: string[]) => {
      try {
        if (!questId) {
          emit('startQuest', { success: false, reason: 'missing_quest_id' });
          return;
        }

        let started = false;

        setQuestStateTraced((prev) => {
          if (prev.activeQuests.length >= maxActiveQuests) {
            emit('startQuest', { success: false, reason: 'max_active_reached', questId });
            return prev;
          }

          if (prev.activeQuests.some((quest) => quest.questId === questId)) {
            emit('startQuest', { success: false, reason: 'already_active', questId });
            return prev;
          }

          started = true;
          return startQuestEngine(prev, questId, residentIds);
        });

        if (started) {
          logEvent('activity_started', {
            action: 'startQuest',
            questId,
            residents: residentIds,
          });
        }
        emit('startQuest', {
          success: started,
          questId,
          residents: residentIds,
        });
      } catch (error) {
        emitError('startQuest', error, { questId, residents: residentIds });
      }
    },
    [logEvent, maxActiveQuests, setQuestState]
  );

  const assignWork = useCallback(
    (residentId: string, locationId: string) => {
      try {
        if (!residentId) {
          emit('assignWork', { success: false, reason: 'missing_resident_id', locationId });
          return;
        }

        if (!locationId) {
          emit('assignWork', { success: false, reason: 'missing_location_id', residentId });
          return;
        }

        const locationDefinition = LOCATION_LOOKUP[locationId];
        if (!locationDefinition) {
          emit('assignWork', { success: false, reason: 'invalid_location', residentId, locationId });
          return;
        }

        const currentResidents = useGameplayStore.getState().residents;
        let hasChanges = false;
        const updatedResidents = currentResidents.map((resident) => {
          if (resident.id === residentId) {
            if (!resident.isWorking) {
              hasChanges = true;
            }
            return { ...resident, isWorking: true };
          }
          if (resident.isWorking) {
            hasChanges = true;
            return { ...resident, isWorking: false };
          }
          return resident;
        });

        if (!hasChanges) {
          emit('assignWork', {
            success: false,
            reason: 'no_state_change',
            residentId,
            locationId: locationDefinition.slotId,
          });
          return;
        }

        setResidentsTraced(updatedResidents);
        resetLocationStatesTraced();
        setLocationStateTraced(locationDefinition.slotId, 'valid');

        logEvent('activity_scheduled', {
          action: 'assignWork',
          residentId,
          locationId: locationDefinition.id,
          slotId: locationDefinition.slotId,
          telemetryTags: locationDefinition.telemetryTags ?? [],
        });

        emit('assignWork', {
          success: true,
          residentId,
          locationId: locationDefinition.id,
          slotId: locationDefinition.slotId,
        });
      } catch (error) {
        emitError('assignWork', error, { residentId, locationId });
      }
    },
    [logEvent, resetLocationStates, setLocationState, setResidents]
  );

  const pauseGame = useCallback(() => {
    try {
      setPauseStateTraced(true);
      setSurvivalStateTraced((prev) => setDayPaused(prev, true));
      lockAllLocations();
      logEvent('activity_cancelled', { action: 'pauseGame', timestamp: now() });
      emit('pauseGame', { success: true });
    } catch (error) {
      emitError('pauseGame', error);
    }
  }, [lockAllLocations, logEvent, setPauseState, setSurvivalState]);

  const resumeGame = useCallback(() => {
    try {
      setPauseStateTraced(false);
      setSurvivalStateTraced((prev) => setDayPaused(prev, false));
      resetLocationStatesTraced();
      logEvent('activity_started', { action: 'resumeGame', timestamp: now() });
      emit('resumeGame', { success: true });
    } catch (error) {
      emitError('resumeGame', error);
    }
  }, [logEvent, resetLocationStates, setPauseState, setSurvivalState]);

  const setSpeed = useCallback(
    (multiplier: number) => {
      try {
        const normalizedInput = Number.isFinite(multiplier)
          ? multiplier
          : DEFAULT_SURVIVAL_STATE.dayConfig.speedMultiplier;
        const normalized = Math.min(
          MAX_SPEED_MULTIPLIER,
          Math.max(MIN_SPEED_MULTIPLIER, normalizedInput)
        );
        setSpeedMultiplierTraced(multiplier);
        setSurvivalStateTraced((prev) => setDaySpeed(prev, normalized));
        logEvent('activity_started', {
          action: 'setSpeed',
          speedMultiplier: normalized,
        });
        emit('setSpeed', { success: true, multiplier: normalized });
      } catch (error) {
        console.error('Error setting speed:', error);
        emitError('setSpeed', error, { multiplier });
      }
    },
    [logEvent, setSpeedMultiplier, setSurvivalState]
  );

  const resetGame = useCallback(() => {
    try {
      resetAllTraced();
      logEvent('activity_cancelled', { action: 'resetGame', timestamp: now() });
      emit('resetGame', { success: true });
    } catch (error) {
      emitError('resetGame', error);
    }
  }, [logEvent, resetAll]);

  return {
    buyFood,
    startQuest,
    assignWork,
    pauseGame,
    resumeGame,
    setSpeed,
    resetGame,
  };
}
