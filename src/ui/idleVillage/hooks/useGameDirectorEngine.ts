import { useCallback, useEffect, useRef } from 'react';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';

type GameEvent =
  | 'INITIAL_SPAWN'
  | 'MID_GAME_EVENTS'
  | 'LATE_GAME_EVENTS'
  | 'WAVE';

/**
 * Production-safe Game Director Engine (Event-based, deterministic)
 * Transforms from "tick + if" to mini Event Engine with one-shot triggers
 */
export function useGameDirectorSimple() {
  const hasStarted = useRef(false);
  const lastProcessedTime = useRef(0);

  // EVENT SYSTEM (one-shot triggers)
  const firedEvents = useRef<Set<GameEvent>>(new Set());

  // WAVE SYSTEM
  const nextWaveTime = useRef(300); // 5 minutes
  const waveInterval = useRef(600); // 10 minutes

  // Store-driven time source
  const gameplayState = useMinimalGameplayStore();

  // -------------------------
  // GAME RESET
  // -------------------------
  const resetGame = useCallback(() => {
    firedEvents.current.clear();
    hasStarted.current = false;
    lastProcessedTime.current = 0;

    nextWaveTime.current = 300;
    waveInterval.current = 600;

    console.log('[ENGINE] Game reset complete');
  }, []);

  // -------------------------
  // GAME OVER (store-driven)
  // -------------------------
  const triggerGameOver = useCallback(() => {
    console.log('[ENGINE] GAME OVER - Village destroyed');
    saveBlueprints();
    resetGame();
    // No interval cleanup - store drives timing
  }, [resetGame]);

  // -------------------------
  // EVENT DISPATCHER
  // -------------------------
  const fireEvent = useCallback((event: GameEvent) => {
    if (firedEvents.current.has(event)) {
      console.log(`[ENGINE] Event ${event} already fired, skipping`);
      return;
    }

    firedEvents.current.add(event);

    switch (event) {
      case 'INITIAL_SPAWN':
        console.log('[ENGINE] INITIAL_SPAWN triggered');
        spawnJob("wood", "near");
        spawnJob("rats", "near");
        break;

      case 'MID_GAME_EVENTS':
        console.log('[ENGINE] MID_GAME_EVENTS triggered');
        console.log('[ENGINE] Quest: explore-ruins (medium distance)');
        console.log('[ENGINE] Quest: scout-forest (medium distance)');
        break;

      case 'LATE_GAME_EVENTS':
        console.log('[ENGINE] LATE_GAME_EVENTS triggered');
        console.log('[ENGINE] Quest: defend-village (high risk)');
        console.log('[ENGINE] Quest: raid-camp (high risk)');
        break;

      case 'WAVE':
        console.log('[ENGINE] WAVE triggered');
        console.log('[ENGINE] Total assigned residents: 1');
        console.log('[ENGINE] Defensive assignments: 0');
        console.log('[ENGINE] VILLAGE DESTROYED - No defensive preparation!');
        triggerGameOver();
        break;
    }
  }, [triggerGameOver]);

  // -------------------------
  // WAVE CHECK (clean, deterministic)
  // -------------------------
  const checkWave = useCallback(() => {
    const storeTime = gameplayState.state.currentTime;
    if (storeTime >= nextWaveTime.current) {
      fireEvent('WAVE');

      nextWaveTime.current += waveInterval.current;
      waveInterval.current = Math.max(waveInterval.current * 0.8, 180);
    }
  }, [fireEvent, gameplayState.state.currentTime]);

  // -------------------------
  // TIME-BASED EVENT TRIGGERS (ONCE ONLY)
  // -------------------------
  const checkEvents = useCallback(() => {
    const t = gameplayState.state.currentTime;

    // Event triggers based on time thresholds
    if (t >= 0) fireEvent('INITIAL_SPAWN');
    if (t >= 60) fireEvent('MID_GAME_EVENTS');
    if (t >= 180) fireEvent('LATE_GAME_EVENTS');
  }, [fireEvent, gameplayState.state.currentTime]);

  // -------------------------
  // STORE-DRIVEN EVENT CHECK (no independent timing)
  // -------------------------
  const processStoreTime = useCallback(() => {
    const storeTime = gameplayState.state.currentTime;
    
    // Only process if time has advanced
    if (storeTime <= lastProcessedTime.current) {
      return;
    }
    
    lastProcessedTime.current = storeTime;
    
    console.log('[ENGINE] PROCESSING STORE TIME', storeTime, 'events fired:', firedEvents.current.size);

    checkEvents();
    checkWave();
  }, [checkEvents, checkWave, gameplayState.state.currentTime]);

  // -------------------------
  // STORE WATCHER (replaces independent clock)
  // -------------------------
  useEffect(() => {
    if (!hasStarted.current) {
      return;
    }
    
    // Process store time whenever it changes
    processStoreTime();
  }, [gameplayState.state.currentTime, processStoreTime]);

  // -------------------------
  // START RUN (store-driven)
  // -------------------------
  const startRun = useCallback(() => {
    // Global guard against multiple starts
    if (hasStarted.current) {
      console.log('[ENGINE] Already started, ignoring');
      return;
    }
    hasStarted.current = true;

    console.log('[ENGINE] Starting new run (store-driven)...');

    try {
      resetGame();
      spawnHero();
      // No startClock() - store drives timing
      lastProcessedTime.current = gameplayState.state.currentTime;

      console.log('[ENGINE] Run started successfully (store-driven)!');
    } catch (error) {
      console.error('[ENGINE] Error during startRun:', error);
      hasStarted.current = false; // Reset on error
    }
  }, [resetGame, gameplayState.state.currentTime]);

  // -------------------------
  // CLEANUP (store-driven - no intervals to clean)
  // -------------------------
  // No cleanup needed - store drives all timing

  return { startRun };
}

// -------------------------
// HELPERS
// -------------------------

function spawnHero() {
  const hero = {
    id: 'hero-001',
    stats: {
      hp: 100,
      damage: 10,
      speed: 5,
      defense: 5
    },
    status: 'available',
    location: 'village',
    currentActivity: null,
    inventory: {}
  };
  console.log('[ENGINE] Hero spawned:', hero.id);
}

function spawnJob(type: string, distance: string): void {
  console.log(`[ENGINE] Job spawned: ${type} at ${distance} distance`);
}

function saveBlueprints(): void {
  console.log('[ENGINE] Blueprints saved (simulated)');
}
