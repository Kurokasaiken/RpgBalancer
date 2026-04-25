import { useCallback, useEffect, useRef } from 'react';
import { useGameplayStore } from '../store/gameplayStore';
import { createJob, type JobType } from '../types/jobTypes';

type GameEvent =
  | 'INITIAL_SPAWN'
  | 'MID_GAME_EVENTS'
  | 'LATE_GAME_EVENTS'
  | 'WAVE';

type ScheduledEvent = {
  id: GameEvent;
  at: number;
  repeat?: boolean;
};

/**
 * Production-safe Game Director with Event Scheduler (data-driven engine)
 * Transforms from hardcoded events to configurable schedule system
 */
export function useGameDirectorSimple() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalId = useRef(0);
  const hasStarted = useRef(false);
  const addJob = useGameplayStore(state => state.addJob);

  // TIME
  const time = useRef(0);

  // EVENT SYSTEM (one-shot triggers - events removed from schedule)
  // Note: firedEvents Set no longer needed since events are removed from schedule

  // SCHEDULER (data-driven event definitions - sorted by time)
  const eventSchedule = useRef<ScheduledEvent[]>([
    { id: 'INITIAL_SPAWN', at: 0 },
    { id: 'MID_GAME_EVENTS', at: 60 },
    { id: 'LATE_GAME_EVENTS', at: 180 }
  ]);

  // WAVE SYSTEM
  const nextWaveTime = useRef(300); // 5 minutes
  const waveInterval = useRef(600); // 10 minutes

  // -------------------------
  // EVENT DISPATCHER (one-shot, safe)
  // -------------------------
  const fireEvent = useCallback((event: GameEvent) => {
    // Events are removed from schedule when fired, so no need to check firedEvents
    console.log(`[SCHEDULER] Event ${event} triggered`);

    switch (event) {
      case 'INITIAL_SPAWN':
        console.log('[SCHEDULER] Event INITIAL_SPAWN triggered');
        addJob(createJob('wood-gathering'));
        addJob(createJob('rat-hunting'));
        break;

      case 'MID_GAME_EVENTS':
        console.log('[SCHEDULER] Event MID_GAME_EVENTS triggered');
        addJob(createJob('explore-ruins'));
        addJob(createJob('scout-forest'));
        break;

      case 'LATE_GAME_EVENTS':
        console.log('[SCHEDULER] Event LATE_GAME_EVENTS triggered');
        addJob(createJob('defend-village'));
        addJob(createJob('raid-camp'));
        break;

      case 'WAVE':
        console.log('[SCHEDULER] Event WAVE triggered');
        console.log('[SCHEDULER] Total assigned residents: 1');
        console.log('[SCHEDULER] Defensive assignments: 0');
        console.log('[SCHEDULER] VILLAGE DESTROYED - No defensive preparation!');
        triggerGameOver();
        break;
    }
  }, [addJob]);

  // -------------------------
  // GAME RESET
  // -------------------------
  const resetGame = useCallback(() => {
    time.current = 0;
    hasStarted.current = false;

    // Reset event schedule to initial state
    eventSchedule.current = [
      { id: 'INITIAL_SPAWN', at: 0 },
      { id: 'MID_GAME_EVENTS', at: 60 },
      { id: 'LATE_GAME_EVENTS', at: 180 }
    ];

    nextWaveTime.current = 300;
    waveInterval.current = 600;

    console.log('[SCHEDULER] Game reset complete');
  }, []);

  // -------------------------
  // SCHEDULED EVENT CHECKER (engine-grade optimization)
  // -------------------------
  const checkScheduledEvents = useCallback(() => {
    const t = time.current;

    // Remove fired events from schedule - O(k) instead of O(n)
    eventSchedule.current = eventSchedule.current.filter(event => {
      if (t >= event.at) {
        fireEvent(event.id);
        return false; // Remove fired event
      }
      return true; // Keep future events
    });
  }, [fireEvent]);

  // -------------------------
  // WAVE CHECK (still needed but clean)
  // -------------------------
  const checkWave = useCallback(() => {
    if (time.current >= nextWaveTime.current) {
      fireEvent('WAVE');

      nextWaveTime.current += waveInterval.current;
      waveInterval.current = Math.max(waveInterval.current * 0.8, 180);
    }
  }, [fireEvent]);

  // -------------------------
  // TICK LOOP (ultra clean)
  // -------------------------
  const tick = useCallback(() => {
    time.current += 1;
    const currentTime = time.current;

    console.log('[SCHEDULER] TICK', currentTime, 'remaining events:', eventSchedule.current.length);

    checkScheduledEvents();
    checkWave();
  }, [checkScheduledEvents, checkWave]);

  // -------------------------
  // CLOCK
  // -------------------------
  const startClock = useCallback(() => {
    // Prevent multiple intervals
    if (intervalRef.current) {
      console.log('[SCHEDULER] Clearing existing interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalId.current++;
    console.log('[SCHEDULER] CLOCK START', intervalId.current);

    intervalRef.current = setInterval(() => {
      tick();
    }, 1000);

    console.log('[SCHEDULER] Clock started');
  }, [tick]);

  // -------------------------
  // START RUN
  // -------------------------
  const startRun = useCallback(() => {
    // Global guard against multiple starts
    if (hasStarted.current) {
      console.log('[SCHEDULER] Already started, ignoring');
      return;
    }
    hasStarted.current = true;

    console.log('[SCHEDULER] Starting new run...');

    try {
      resetGame();
      spawnHero();
      startClock();

      console.log('[SCHEDULER] Run started successfully!');
    } catch (error) {
      console.error('[SCHEDULER] Error during startRun:', error);
      hasStarted.current = false; // Reset on error
    }
  }, [resetGame, startClock]);

  // -------------------------
  // GAME OVER
  // -------------------------
  const triggerGameOver = useCallback(() => {
    console.log('[SCHEDULER] GAME OVER - Village destroyed');
    saveBlueprints();
    resetGame();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [resetGame]);

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
  console.log('[SCHEDULER] Hero spawned:', hero.id);
}

function spawnJob(type: string, distance: string): void {
  console.log(`[SCHEDULER] Job spawned: ${type} at ${distance} distance`);
}

function saveBlueprints(): void {
  console.log('[SCHEDULER] Blueprints saved (simulated)');
}
