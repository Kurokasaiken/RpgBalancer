import { useCallback, useEffect, useRef } from 'react';

/**
 * Production-safe Game Director (same gameplay, stable state)
 */
export function useGameDirectorSimple() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalId = useRef(0);
  const hasStarted = useRef(false);

  // GAME STATE (MUST be refs to avoid rerender/closure issues)
  const runTime = useRef(0);
  const nextWaveTime = useRef(300); // 5 minutes
  const waveInterval = useRef(600); // 10 minutes
  const assignmentTimestamps = useRef<number[]>([]);
  const bonusGiven = useRef(false);

  // -------------------------
  // RESET
  // -------------------------
  const resetGame = useCallback(() => {
    runTime.current = 0;
    nextWaveTime.current = 300;
    waveInterval.current = 600;
    assignmentTimestamps.current = [];
    bonusGiven.current = false;
    hasStarted.current = false;

    console.log('[GameDirectorSimple] Game reset');
  }, []);

  // -------------------------
  // HERO
  // -------------------------
  const spawnHero = useCallback(() => {
    const hero = createHero();
    console.log('[GameDirectorSimple] Hero spawned:', hero.id);
  }, []);

  // -------------------------
  // INITIAL POI
  // -------------------------
  const spawnInitialPOI = useCallback(() => {
    spawnJob("wood", "near");
    spawnJob("rats", "near");
    console.log('[GameDirectorSimple] Initial POIs spawned (near village)');
  }, []);

  // -------------------------
  // WORLD EVENTS
  // -------------------------
  const spawnWorldEvents = useCallback((time: number) => {
    // Spawn events only at specific time intervals, not every tick
    if (time % 10 === 0) { // Every 10 seconds
      if (time <= 60) {
        console.log(`[GameDirectorSimple] Spawned basic job: wood-gathering (t=${time}s)`);
        console.log(`[GameDirectorSimple] Spawned basic job: rat-hunting (t=${time}s)`);
      } else if (time <= 180) {
        console.log(`[GameDirectorSimple] Spawned quest: explore-ruins (medium distance, t=${time}s)`);
        console.log(`[GameDirectorSimple] Spawned quest: scout-forest (medium distance, t=${time}s)`);
      } else {
        console.log(`[GameDirectorSimple] Spawned high-risk quest: defend-village (t=${time}s)`);
        console.log(`[GameDirectorSimple] Spawned high-risk quest: raid-camp (t=${time}s)`);
      }
    }
  }, []);

  // -------------------------
  // BONUS CHECK
  // -------------------------
  const checkAssignmentBonus = useCallback(() => {
    const currentAssignments = 1; // simulated

    if (currentAssignments >= 2 && !bonusGiven.current) {
      console.log('[GameDirectorSimple] DOUBLE ASSIGNMENT BONUS!');
      bonusGiven.current = true;
    }
  }, []);

  // -------------------------
  // WAVE
  // -------------------------
  const triggerGameOver = useCallback(() => {
    console.log('[GameDirectorSimple] GAME OVER - Village destroyed');

    saveBlueprints();

    resetGame();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [resetGame]);

  const triggerWave = useCallback(() => {
    console.log('[GameDirectorSimple] Wave incoming!');
    console.log('[GameDirectorSimple] Total assigned residents: 1');
    console.log('[GameDirectorSimple] Defensive assignments: 0');
    console.log('[GameDirectorSimple] VILLAGE DESTROYED - No defensive preparation!');

    triggerGameOver();
  }, [triggerGameOver]);

  const maybeTriggerWave = useCallback((time: number) => {
    if (time >= nextWaveTime.current) {
      triggerWave();

      nextWaveTime.current += waveInterval.current;
      waveInterval.current = Math.max(waveInterval.current * 0.8, 180);
    }
  }, [triggerWave]);

  // -------------------------
  // TICK (CORE LOOP - SAFE)
  // -------------------------
  const tick = useCallback(() => {
    runTime.current += 1;
    const time = runTime.current;

    console.log('[TICK]', time, 'intervalId:', intervalId.current);

    spawnWorldEvents(time);
    checkAssignmentBonus();
    maybeTriggerWave(time);
  }, [spawnWorldEvents, checkAssignmentBonus, maybeTriggerWave]);

  // -------------------------
  // CLOCK
  // -------------------------
  const startClock = useCallback(() => {
    // Prevent multiple intervals
    if (intervalRef.current) {
      console.log('[GameDirectorSimple] Clearing existing interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalId.current++;
    console.log('[CLOCK START]', intervalId.current);

    intervalRef.current = setInterval(() => {
      tick();
    }, 1000);

    console.log('[GameDirectorSimple] Clock started');
  }, [tick]);

  // -------------------------
  // START RUN
  // -------------------------
  const startRun = useCallback(() => {
    // Global guard against multiple starts
    if (hasStarted.current) {
      console.log('[GameDirectorSimple] Already started, ignoring');
      return;
    }
    hasStarted.current = true;

    console.log('[GameDirectorSimple] Starting new run...');

    try {
      resetGame();
      spawnHero();
      spawnInitialPOI();
      startClock();

      console.log('[GameDirectorSimple] Run started successfully!');
    } catch (error) {
      console.error('[GameDirectorSimple] Error during startRun:', error);
      hasStarted.current = false; // Reset on error
    }
  }, [resetGame, spawnHero, spawnInitialPOI, startClock]);

  // -------------------------
  // CLEANUP
  // -------------------------
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return { startRun };
}

// -------------------------
// HELPERS (UNCHANGED)
// -------------------------

function createHero() {
  return {
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
}

function spawnJob(type: string, distance: string): void {
  console.log(`[GameDirectorSimple] Job spawned: ${type} at ${distance} distance`);
}

function saveBlueprints(): void {
  console.log('[GameDirectorSimple] Blueprints saved (simulated)');
}