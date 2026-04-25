import { useCallback, useRef, useState, useEffect } from 'react';
import type { EnemyIntentProfile, STSDeckPreset } from '../../config/archmage';
import { useSTSDeckConfig } from './useSTSDeckConfig';
import { useSTSEnemyProfile, useSTSIntents } from './useSTSEnemyProfile';
import { useSTSCombatantsConfig } from '../sts/useSTSCombatantsConfig';
import {
  useSTSRunRecorder,
  type STSRunRecorderState,
  type STSRunSummary,
  type STSTurnLog,
} from './useSTSRunRecorder';
import { createSeededRng } from '../../utils/archmage/seededRng';
import type {
  STSSimulatorState,
  SimulatorResult,
  EnemyIntentSnapshot,
} from './stsSimulatorState';
import {
  applyFallbackRitual,
  applyManaGrowth,
  buildInitialHand,
  buildRecorderPlayerState,
  createBaseSimulatorState,
  ensureResonanceRecord,
  formatGameOverLog,
  getCardManaCostTotals,
  resolveCardPlay,
} from './stsSimulatorState';
import type { STSCombatantState, STSIntentPredictionResult, STSBuffSystem } from '../../stressTesting/index';
import { createPlayerStateManager, createEnemyStateManager, createIntentPredictionEngine, createBuffSystem } from '../../stressTesting/index';
import { createSTSCombatLogger, type STSCombatLogger } from './STSCombatLogger';
import { generateIntentTimeline, compareTimelines, type IntentTimeline } from './intentTimelineGenerator';

interface UseSTSSimulatorEngineOptions {
  initialDeckId?: string;
  initialEnemyId?: string;
  initialSeed?: number;
}

interface UseSTSSimulatorEngineResult {
  state: STSSimulatorState;
  summary: STSRunSummary | null;
  deckOptions: ReturnType<typeof useSTSDeckConfig>['deckOptions'];
  enemyOptions: ReturnType<typeof useSTSEnemyProfile>['enemyOptions'];
  selectedDeckId: string;
  selectedEnemyId: string;
  seed: number;
  deck: STSDeckPreset | null;
  enemy: EnemyIntentProfile | null;
  isReady: boolean;
  combatLogger: STSCombatLogger;
  intentTimeline: IntentTimeline | null;
  previousTimeline: IntentTimeline | null;
  setDeckId: (deckId: string) => void;
  setEnemyId: (enemyId: string) => void;
  setSeed: (seed: number) => void;
  startSimulation: () => void;
  resetSimulation: () => void;
  endPlayerTurn: () => void;
  handleCardSelection: (cardIndex: number) => void;
  handleCommand: (input: string) => void;
}

const DEFAULT_DECK_ID = 'starter_deck';
const DEFAULT_ENEMY_ID = 'tutorial';

/**
 * Hook exposing the STS numeric simulator state machine plus convenience actions.
 */
export function useSTSSimulatorEngine(
  options: UseSTSSimulatorEngineOptions = {},
): UseSTSSimulatorEngineResult {
  const [selectedDeckId, setSelectedDeckId] = useState(options.initialDeckId ?? DEFAULT_DECK_ID);
  const [selectedEnemyId, setSelectedEnemyId] = useState(options.initialEnemyId ?? DEFAULT_ENEMY_ID);
  const [seed, setSeed] = useState(() => options.initialSeed ?? Date.now());

  const { config: combatantsConfig } = useSTSCombatantsConfig();

  // Initialize combat logger with state
  const [combatLogger] = useState<STSCombatLogger>(() => 
    createSTSCombatLogger({
      maxEntries: 1000,
      enableDebug: false,
      systemPrefix: 'STS-ENGINE',
    })
  );

  // Initialize intent timeline state
  const [intentTimeline, setIntentTimeline] = useState<IntentTimeline | null>(null);
  const [previousTimeline, setPreviousTimeline] = useState<IntentTimeline | null>(null);

  // Initialize combatant state managers
  const playerStateManager = combatantsConfig ? 
    createPlayerStateManager(combatantsConfig.playerArmor, combatantsConfig.buffDefinitions, combatantsConfig.intentPrediction) : 
    null;
  const enemyStateManager = combatantsConfig ? 
    createEnemyStateManager(combatantsConfig.enemyArmor, combatantsConfig.buffDefinitions, combatantsConfig.intentPrediction) : 
    null;
  const intentEngine = combatantsConfig ? createIntentPredictionEngine(combatantsConfig.intentPrediction) : null;
  const buffSystem = combatantsConfig ? createBuffSystem(combatantsConfig.buffDefinitions) : null;

  // Initialize combatant states
  const [playerState, setPlayerState] = useState<STSCombatantState | null>(null);
  const [enemyState, setEnemyState] = useState<STSCombatantState | null>(null);
  const [intentPredictions, setIntentPredictions] = useState<STSIntentPredictionResult[]>([]);

    const [simState, setSimState] = useState<STSSimulatorState>(() =>
    createBaseSimulatorState(selectedDeckId, selectedEnemyId, seed, combatantsConfig),
  );
  const [summary, setSummary] = useState<STSRunSummary | null>(null);

  const rngRef = useRef<() => number>(() => Math.random());
  const runStateRef = useRef<STSRunRecorderState | null>(null);

  const { deck, deckOptions } = useSTSDeckConfig(selectedDeckId);
  const { enemy, enemyOptions } = useSTSEnemyProfile(selectedEnemyId);
  const { selectIntent } = useSTSIntents(enemy);
  const { startRun, appendTurnLog, finalizeRun } = useSTSRunRecorder();

  const startRecorder = useCallback(
    () => startRun(selectedDeckId, selectedEnemyId, seed),
    [seed, selectedDeckId, selectedEnemyId, startRun],
  );

  // Initialize combatant states when config is available
  useEffect(() => {
    if (combatantsConfig && playerStateManager && enemyStateManager) {
      const initialPlayerState = playerStateManager.createInitialState(75, 75, 1, []);
      const initialEnemyState = enemyStateManager.createInitialState(50, 50, 1, []);
      
      setPlayerState(initialPlayerState);
      setEnemyState(initialEnemyState);
    }
  }, [combatantsConfig, playerStateManager, enemyStateManager]);

  // Buff application handlers
  const applyBuff = useCallback((target: 'player' | 'enemy', buffId: string, source: 'player' | 'enemy' | 'system' = 'system') => {
    if (!buffSystem) return;
    
    const state = target === 'player' ? playerState : enemyState;
    const setState = target === 'player' ? setPlayerState : setEnemyState;
    
    if (state) {
      const newState = { ...state };
      buffSystem.applyBuff(newState.activeBuffs, buffId, source, undefined, state.turnCount);
      setState(newState);
    }
  }, [buffSystem, playerState, enemyState]);

  const removeBuff = useCallback((target: 'player' | 'enemy', buffId: string) => {
    if (!buffSystem) return;
    
    const state = target === 'player' ? playerState : enemyState;
    const setState = target === 'player' ? setPlayerState : setEnemyState;
    
    if (state) {
      const newState = { ...state };
      buffSystem.removeBuff(newState.activeBuffs, buffId);
      setState(newState);
    }
  }, [buffSystem, playerState, enemyState]);

  // Intent prediction handler
  const predictIntents = useCallback((turnCount: number = 3): STSIntentPredictionResult[] => {
    if (!intentEngine || !playerState || !enemyState) return [];
    
    const context = {
      currentTurn: simState.turn,
      playerHpRatio: playerState.hp / playerState.maxHp,
      enemyHpRatio: enemyState.hp / enemyState.maxHp,
      recentIntents: enemyState.intentHistory.slice(-5),
      difficulty: 'normal' as const,
      seed
    };
    
    return intentEngine.predictIntents(context, turnCount);
  }, [intentEngine, playerState, enemyState, simState.turn, seed]);

  const isReady = Boolean(deck && enemy && combatantsConfig);

  const updateRecorder = useCallback(
    (turnLog: Omit<STSTurnLog, 'timestamp'>) => {
      if (!runStateRef.current) return;
      runStateRef.current = appendTurnLog(runStateRef.current, turnLog);
    },
    [appendTurnLog],
  );

  const finalizeSimulation = useCallback(
    (result: SimulatorResult) => {
      setSimState((prev) => {
        if (!prev.isRunning) return prev;
        return {
          ...prev,
          isRunning: false,
          result,
          log: [...prev.log, formatGameOverLog(prev, result)],
        };
      });

      if (runStateRef.current) {
        const summaryResult = finalizeRun(
          runStateRef.current,
          result,
          selectedDeckId,
          selectedEnemyId,
          seed,
        );
        setSummary(summaryResult);
        runStateRef.current = null;
      }
    },
    [finalizeRun, seed, selectedDeckId, selectedEnemyId],
  );

  const executeEnemyTurn = useCallback(() => {
    if (!enemy || !deck) {
      return;
    }
    let turnLog: Omit<STSTurnLog, 'timestamp'> | null = null;
    let outcome: SimulatorResult | null = null;

    setSimState((prev) => {
      if (!prev.isRunning || prev.phase !== 'enemy') {
        return prev;
      }

      const rng = rngRef.current ?? Math.random;
      const intent = selectIntent(rng);

      let newPlayerHp = prev.playerState.hp;
      let newEnemyHp = prev.enemyState.hp;
      let actionLog = `[T${prev.turnNumber + 1}][Enemy] No intent selected`;
      let intentSnapshot: EnemyIntentSnapshot | null = null;

      if (intent) {
        const varianceRoll = intent.variance ?? 0;
        const randomVariance = varianceRoll > 0 ? rng() * varianceRoll * 2 - varianceRoll : 0;
        const appliedValue = Math.max(0, Math.round(intent.baselineValue + randomVariance));
        let description = intent.label;
        if (intent.type === 'attack') {
          newPlayerHp -= appliedValue;
          description = `${intent.label} striking for ${appliedValue} damage`;
        } else if (intent.type === 'block') {
          newEnemyHp += 0; // Block tracking reserved for future systems
          description = `${intent.label} reinforcing defenses`;
        } else if (intent.type === 'buff') {
          description = `${intent.label} empowering future turns`;
        } else if (intent.type === 'special') {
          description = `${intent.label} unleashes a special maneuver`;
        }
        actionLog = `[T${prev.turnNumber + 1}][Enemy] ${intent.label}: ${appliedValue} ${intent.type}`;
        intentSnapshot = {
          type: intent.type,
          label: intent.label,
          value: appliedValue,
          description,
          severity: intent.severity,
        };
      }

      const nextResonance = applyManaGrowth(prev.resonance, deck.manaGrowth);
      const nextInspiration = Math.max(0, prev.inspiration - deck.inspirationDecay);

      let nextLog = [...prev.log, actionLog];
      const deckTurnCap = deck?.maxTurns;
      const enemyTurnCap = enemy?.pacingCaps?.maxTurns;
      const resolvedTurnCap = Math.min(
        deckTurnCap ?? Number.POSITIVE_INFINITY,
        enemyTurnCap ?? Number.POSITIVE_INFINITY,
      );
      const turnCapReached = Number.isFinite(resolvedTurnCap) && prev.turnNumber + 1 >= resolvedTurnCap;

      if (turnCapReached) {
        nextLog = [
          ...nextLog,
          `[System] Turn cap reached (${resolvedTurnCap}) — ending run as timeout`,
        ];
      }

      const nextState: STSSimulatorState = {
        ...prev,
        playerState: {
          ...prev.playerState,
          hp: newPlayerHp,
        },
        enemyState: {
          ...prev.enemyState,
          hp: newEnemyHp,
        },
        turnNumber: prev.turnNumber + 1,
        phase: 'player',
        resonance: nextResonance,
        inspiration: nextInspiration,
        log: nextLog,
        lastEnemyIntent: intentSnapshot ?? prev.lastEnemyIntent,
      };

      turnLog = {
        turnNumber: nextState.turnNumber,
        phase: 'enemy',
        actions: [
          {
            type: 'enemy_intent',
            details: actionLog,
          },
        ],
        playerState: buildRecorderPlayerState(nextState),
        enemyState: {
          hp: nextState.enemyState.hp,
          intent: intent?.label,
        },
      };

      if (newPlayerHp <= 0) {
        outcome = 'defeat';
      } else if (turnCapReached) {
        outcome = 'timeout';
      }

      return nextState;
    });

    if (turnLog) {
      updateRecorder(turnLog);
    }
    if (outcome) {
      finalizeSimulation(outcome);
    }
  }, [deck, enemy, finalizeSimulation, selectIntent, updateRecorder]);

  const handleCardSelection = useCallback(
    (cardNumber: number) => {
      if (!deck) return;
      if (!Number.isFinite(cardNumber) || cardNumber < 1) return;

      let turnLog: Omit<STSTurnLog, 'timestamp'> | null = null;
      let outcome: SimulatorResult | null = null;

      setSimState((prev) => {
        if (!prev.isRunning || prev.phase !== 'player') return prev;
        const cardIndexZero = cardNumber - 1;
        if (!prev.hand[cardIndexZero]) return prev;

        const { card } = prev.hand[cardIndexZero];
        const totals = getCardManaCostTotals(card.manaCost, prev.resonance);
        if (prev.inspiration < totals.inspirationCost) {
          return {
            ...prev,
            log: [
              ...prev.log,
              `Cannot afford ${card.name} (Cost: ${totals.totalCost}, Inspiration: ${prev.inspiration})`,
            ],
          };
        }

        const resolution = resolveCardPlay(prev, cardIndexZero);
        const nextState: STSSimulatorState = {
          ...resolution.nextState,
        };

        turnLog = {
          turnNumber: nextState.turnNumber + 1,
          phase: 'player',
          actions: [
            {
              type: 'play_card',
              details: resolution.logEntry,
              manaSpent: card.manaCost,
            },
          ],
          playerState: buildRecorderPlayerState(nextState),
          enemyState: { hp: nextState.enemyState.hp },
        };

        if (nextState.enemyState.hp <= 0) {
          outcome = 'victory';
        }

        return nextState;
      });

      if (turnLog) {
        updateRecorder(turnLog);
      }
      if (outcome) {
        finalizeSimulation(outcome);
      }
    },
    [deck, finalizeSimulation, updateRecorder],
  );

  const endPlayerTurn = useCallback(() => {
    if (!deck) return;
    let turnLog: Omit<STSTurnLog, 'timestamp'> | null = null;

    setSimState((prev) => {
      if (!prev.isRunning || prev.phase !== 'player') return prev;

      let updatedState = prev;
      if (prev.hand.length === 0 && (prev.resonance.alteration ?? 0) > 0) {
        const fallback = applyFallbackRitual(prev);
        updatedState = {
          ...prev,
          resonance: fallback.resonance,
          inspiration: fallback.inspiration,
          turnNumber: prev.turnNumber + 1,
          phase: 'enemy',
          log: [...prev.log, fallback.logEntry],
        };

        turnLog = {
          turnNumber: updatedState.turnNumber,
          phase: 'player',
          actions: [
            {
              type: 'fallback_ritual',
              details: 'Converted Resonance to Inspiration',
            },
          ],
          playerState: buildRecorderPlayerState(updatedState),
          enemyState: {
            hp: updatedState.enemyHp,
          },
        };
      } else {
        updatedState = {
          ...prev,
          turnNumber: prev.turnNumber + 1,
          phase: 'enemy',
          log: [...prev.log, `[T${prev.turnNumber + 1}][Player] No action taken`],
        };
      }

      return updatedState;
    });

    if (turnLog) {
      updateRecorder(turnLog);
    }

    executeEnemyTurn();
  }, [deck, executeEnemyTurn, updateRecorder]);

  const resetSimulation = useCallback(() => {
    setSeed(Date.now());
    runStateRef.current = null;
    setSummary(null);
    setSimState(createBaseSimulatorState(selectedDeckId, selectedEnemyId, Date.now(), combatantsConfig));
  }, [selectedDeckId, selectedEnemyId, combatantsConfig]);

  const handleCommand = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (trimmed === '') return;

      const cardNumber = parseInt(trimmed, 10);
      if (!Number.isNaN(cardNumber) && cardNumber >= 1 && cardNumber <= 9) {
        handleCardSelection(cardNumber);
        return;
      }

      switch (trimmed.toLowerCase()) {
        case 'end':
        case 'enter':
        case ' ':
          endPlayerTurn();
          break;
        case 'reset':
        case 'r':
          resetSimulation();
          break;
        case 'cancel':
        case 'backspace':
        case 'c':
          break;
        case 'help':
        case '?':
          setSimState((prev) => ({
            ...prev,
            log: [
              ...prev.log,
              '=== Help ===\n1-9: Play card by index\nEnter/Space: End turn\nR: Reset\nC: Cancel\n?: Help',
            ],
          }));
          break;
        default:
          setSimState((prev) => ({
            ...prev,
            log: [...prev.log, `Unknown command: ${trimmed}`],
          }));
      }
    },
    [endPlayerTurn, handleCardSelection, resetSimulation, selectedDeckId, selectedEnemyId],
  );

  const startSimulation = useCallback(() => {
    if (!deck || !enemy) return;
    const runData = startRecorder();
    
    // Store previous timeline for comparison
    if (intentTimeline) {
      setPreviousTimeline(intentTimeline);
    }
    
    // Create new timeline from current state
    const timeline = generateIntentTimeline(simState, runData.turnLogs || []);
    setIntentTimeline(timeline);
    
    // Rest of existing simulation logic...
    const initialPlayerState = playerStateManager?.createInitialState(75, 0, 0, deck.cards) ?? null;
    const initialEnemyState = enemyStateManager?.createInitialState(50, 50, 1, []) ?? null;
    
    if (!initialPlayerState || !initialEnemyState) {
      combatLogger.error('Failed to create initial combatant states');
      return;
    }
    
    const initialHand = buildInitialHand(deck, 5, createSeededRng(seed));
    const resonance = createEmptyResonance();
    
    setSimState({
      ...simState,
      runId: runData.runId,
      playerState: initialPlayerState,
      enemyState: initialEnemyState,
      resonance,
      inspiration: 3,
      hand: initialHand,
      turnNumber: 1,
      phase: 'player',
      isRunning: true,
      result: null,
      turnLogs: runData.turnLogs || [],
    });
    
    combatLogger.info('Simulation started', {
      runId: runData.runId,
      deckId: selectedDeckId,
      enemyId: selectedEnemyId,
      seed,
    });
  }, [deck, enemy, seed, selectedDeckId, selectedEnemyId, startRecorder, intentTimeline, simState, playerStateManager, enemyStateManager, combatLogger]);

  return {
    state: simState,
    summary,
    deckOptions,
    enemyOptions,
    selectedDeckId,
    selectedEnemyId,
    seed,
    deck: deck ?? null,
    enemy: enemy ?? null,
    isReady,
    combatLogger,
    intentTimeline,
    previousTimeline,
    setDeckId: setSelectedDeckId,
    setEnemyId: setSelectedEnemyId,
    setSeed,
    startSimulation,
    resetSimulation,
    endPlayerTurn,
    handleCardSelection,
    handleCommand
  };
}
