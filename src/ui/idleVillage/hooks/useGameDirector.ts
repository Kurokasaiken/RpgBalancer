import { useCallback, useEffect, useRef } from 'react';
import { useActivityScheduler } from './useActivityScheduler';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { VillageState, ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { IntentBridge } from '../intent/GameIntent';
import type { GameIntent } from '../intent/GameIntent';

/**
 * Experience-focused game director - NOT a system orchestrator
 * Just manages the player experience: setup -> world events -> waves -> game over
 */
export function useGameDirector() {
  const { config } = useIdleVillageConfig();
  const getState = useMinimalGameplayStore.getState;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create a minimal initial state for the scheduler
  const initialVillageState: VillageState = {
    currentTime: 0,
    residents: {},
    activities: {},
    resources: {
      food: 10,
      gold: 0,
      wood: 0
    },
    eventLog: [],
    questOffers: {}
  };
  
  // Create orchestration functions for Director-only role
  const orchestrateStateUpdate = useCallback(async (updater: (prev: VillageState) => VillageState) => {
    const currentState = useMinimalGameplayStore.getState();
    const newState = updater(currentState as any);
    
    // Director orchestrates - Store persists
    const stateChangeEvent = {
      type: 'state_change_request',
      payload: newState,
      timestamp: Date.now()
    };
    
    // Emit event for Store to handle
    console.log('[GameDirector] Orchestrating state update:', stateChangeEvent);
    // TODO: Implement proper event system for Store coordination
  }, []);

  // Create intent emission function for Director-only role
  const emitIntent = useCallback((type: GameIntent['type'], payload: any) => {
    const intent: GameIntent = {
      type,
      payload,
      timestamp: Date.now()
    };
    
    // Director orchestrates - Store handles
    console.log('[GameDirector] Emitting intent:', intent);
    IntentBridge.sendToStore(intent);
  }, []);
  
  // Convert MinimalGameplayState to VillageState for scheduler
  const convertToVillageState = (state: any): VillageState => ({
    currentTime: state.currentTime || 0,
    residents: state.residents || {},
    activities: state.activities || {},
    resources: state.resources || { food: 10, gold: 0, wood: 0 },
    eventLog: state.eventLog || [],
    questOffers: state.questOffers || {}
  });
  
  const scheduler = useActivityScheduler({
    config,
    initialVillageState,
    isDayPhase: true,
    updateState: orchestrateStateUpdate,
    villageState: convertToVillageState(useMinimalGameplayStore.getState())
  });
  
  let runTime = 0;
  let nextWaveTime = 300; // 5 minutes for first wave
  let waveInterval = 600; // 10 minutes between waves
  let assignmentTimestamps: number[] = [];
  let bonusGiven = false;

  // 1. RESET (orchestration only)
  const resetGame = useCallback(() => {
    const initialState = createInitialGameState();
    // Convert VillageState to MinimalGameplayState format
    const minimalState = {
      ...initialState,
      gold: initialState.resources?.gold || 0,
      food: initialState.resources?.food || 10,
      maxFood: 100,
      currentDay: 1,
      currentTime: 0,
      isPaused: false,
      speedMultiplier: 1,
      residents: Object.values(initialState.residents || {}),
      activeActivities: [],
      completedActivities: [],
      eventLog: initialState.eventLog || [],
      tickIntervalMs: 1000
    };
    
    // Director orchestrates - Store persists
    const resetEvent = {
      type: 'game_reset_request',
      payload: minimalState,
      timestamp: Date.now()
    };
    
    console.log('[GameDirector] Orchestrating game reset:', resetEvent);
    emitIntent('GAME_OVER', minimalState);
    
    // Reset runtime variables (Director can maintain these)
    runTime = 0;
    nextWaveTime = 300;
    assignmentTimestamps = [];
    bonusGiven = false;
    
    console.log('[GameDirector] Game reset orchestrated');
  }, []);

  // 2. SPAWN HERO (orchestration only)
  const spawnHero = useCallback(() => {
    const hero = createHero(); // System creates entity
    
    // Director orchestrates - Store persists
    const heroSpawnEvent = {
      type: 'hero_spawn_request',
      payload: hero,
      timestamp: Date.now()
    };
    
    console.log('[GameDirector] Orchestrating hero spawn:', heroSpawnEvent);
    emitIntent('SPAWN_HERO', hero);
    
    console.log('[GameDirector] Hero spawn orchestrated:', hero.id);
  }, []);

  // 3. SPAWN INITIAL POI (near village, easy)
  const spawnInitialPOI = useCallback(() => {
    const woodJob = { id: 'wood-gathering', type: 'wood', location: 'near' };
    const ratsJob = { id: 'rat-hunting', type: 'rats', location: 'near' };
    
    emitIntent('ENABLE_JOB', woodJob);
    emitIntent('ENABLE_JOB', ratsJob);
    
    console.log('[GameDirector] Initial POIs orchestrated (near village)');
  }, [emitIntent]);

  // 4. SPAWN WORLD EVENTS (progressive, distance = risk)
  const spawnWorldEvents = useCallback((time: number) => {
    const scheduledActivities = scheduler.scheduledActivities || new Map();
    const activeActivityIds = Array.from(scheduledActivities.values()).map(a => a.activityId);
    
    if (time <= 60) {
      // 0-60s: spawn only basic jobs
      if (!activeActivityIds.includes('wood-gathering')) {
        const basicJob = { id: 'wood-gathering', type: 'wood', location: 'near', difficulty: 'basic' };
        emitIntent('ENABLE_JOB', basicJob);
        console.log('[GameDirector] Spawned basic job: wood-gathering');
      }
      if (!activeActivityIds.includes('rat-hunting')) {
        const basicJob = { id: 'rat-hunting', type: 'rats', location: 'near', difficulty: 'basic' };
        emitIntent('ENABLE_JOB', basicJob);
        console.log('[GameDirector] Spawned basic job: rat-hunting');
      }
    } else if (time > 60 && time <= 180) {
      // 60-180s: spawn 1-2 quests
      if (!activeActivityIds.includes('explore-ruins')) {
        const mediumQuest = { id: 'explore-ruins', type: 'quest', location: 'medium', difficulty: 'medium' };
        emitIntent('ENABLE_JOB', mediumQuest);
        console.log('[GameDirector] Spawned quest: explore-ruins (medium distance)');
      }
      if (time > 120 && !activeActivityIds.includes('scout-forest')) {
        const mediumQuest = { id: 'scout-forest', type: 'quest', location: 'medium', difficulty: 'medium' };
        emitIntent('ENABLE_JOB', mediumQuest);
        console.log('[GameDirector] Spawned quest: scout-forest (medium distance)');
      }
    } else if (time > 180) {
      // >180s: spawn higher risk quests or upgrade existing POIs
      if (!activeActivityIds.includes('defend-village')) {
        const highRiskQuest = { id: 'defend-village', type: 'quest', location: 'village', difficulty: 'high' };
        emitIntent('ENABLE_JOB', highRiskQuest);
        console.log('[GameDirector] Spawned high-risk quest: defend-village');
      }
      if (time > 240 && !activeActivityIds.includes('raid-camp')) {
        const highRiskQuest = { id: 'raid-camp', type: 'quest', location: 'far', difficulty: 'high' };
        emitIntent('ENABLE_JOB', highRiskQuest);
        console.log('[GameDirector] Spawned high-risk quest: raid-camp');
      }
    }
  }, [scheduler]);

  // 5. CHECK DOUBLE ASSIGNMENT BONUS (2 residents within 5s)
  const checkAssignmentBonus = useCallback((time: number) => {
    const scheduledActivities = scheduler.scheduledActivities || new Map();
    const currentAssignments = scheduledActivities.size;
    
    // Track assignment timestamps
    if (currentAssignments > assignmentTimestamps.length) {
      assignmentTimestamps.push(time);
      console.log(`[GameDirector] Assignment #${currentAssignments} at t=${time}s`);
    }
    
    // Check for double assignment within 5 seconds
    if (currentAssignments >= 2 && !bonusGiven) {
      const recentAssignments = assignmentTimestamps.filter(ts => time - ts <= 5);
      
      if (recentAssignments.length >= 2) {
        giveBonusGold();
        console.log('[GameDirector] DOUBLE ASSIGNMENT BONUS! 2 residents assigned within 5s');
        console.log(`[GameDirector] Assignment times: ${recentAssignments.join('s, ')}s`);
        bonusGiven = true;
      }
    }
  }, [scheduler]);

  // 8. GAME OVER
  const triggerGameOver = useCallback(() => {
    console.log('[GameDirector] GAME OVER - Village destroyed');
    
    const finalState = {
      reason: 'village_destroyed',
      timestamp: Date.now(),
      runTime: runTime
    };
    
    emitIntent('GAME_OVER', finalState);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [emitIntent]);

  // 7. REAL WAVE (simulation based on assignments)
  const triggerWave = useCallback(() => {
    const scheduledActivities = scheduler.scheduledActivities || new Map();
    const activeAssignments = Array.from(scheduledActivities.values());
    
    // Count residents assigned to defensive/relevant activities
    const defensiveActivities = activeAssignments.filter(activity => 
      activity.activityId === 'defend-village' || 
      activity.activityId === 'raid-camp' ||
      activity.activityId === 'scout-forest'
    );
    
    const totalAssignedResidents = activeAssignments.length;
    const defensiveResidents = defensiveActivities.length;
    
    console.log('[GameDirector] Wave incoming!');
    console.log(`[GameDirector] Total assigned residents: ${totalAssignedResidents}`);
    console.log(`[GameDirector] Defensive assignments: ${defensiveResidents}`);
    
    // Wave data for Store to handle
    const waveData = {
      totalAssignedResidents,
      defensiveResidents,
      timestamp: Date.now(),
      runTime: runTime
    };
    
    // Director orchestrates - Store handles wave logic
    emitIntent('TRIGGER_WAVE', waveData);
    
    // Simple success rule: need at least 1 defensive assignment OR 2+ total assignments
    const villageDestroyed = defensiveResidents === 0 && totalAssignedResidents < 2;
    
    if (villageDestroyed) {
      console.log('[GameDirector] VILLAGE DESTROYED - No defensive preparation!');
      console.log('[GameDirector] Reason: No residents assigned to defensive activities');
      triggerGameOver();
    } else {
      console.log('[GameDirector] Wave orchestrated - Store will handle result');
    }
  }, [scheduler, triggerGameOver, emitIntent]);

  // 6. MAYBE TRIGGER WAVE (progressive, not fixed)
  const maybeTriggerWave = useCallback((time: number) => {
    if (time >= nextWaveTime) {
      triggerWave();
      nextWaveTime += waveInterval;
      waveInterval = Math.max(waveInterval * 0.8, 180); // Waves get closer
    }
  }, [triggerWave]);

  // 9. MAIN TICK (experience director)
  const tick = useCallback((delta: number) => {
    runTime += delta;
    
    spawnWorldEvents(runTime);
    checkAssignmentBonus(runTime);
    maybeTriggerWave(runTime);
  }, [spawnWorldEvents, checkAssignmentBonus, maybeTriggerWave]);

  // 10. START CLOCK
  const startClock = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      scheduler.advanceTimeUnitsDebug(1);
      tick(1); // 1 second passed
    }, 1000);

    console.log('[GameDirector] Clock started');
  }, [scheduler, tick]);

  // Main start function
  const startRun = useCallback(() => {
    console.log('[GameDirector] Starting new run...');
    
    try {
      console.log('[GameDirector] Step 1: Resetting game...');
      resetGame();
      
      console.log('[GameDirector] Step 2: Spawning hero...');
      spawnHero();
      
      console.log('[GameDirector] Step 3: Spawning initial POIs...');
      spawnInitialPOI();
      
      console.log('[GameDirector] Step 4: Starting clock...');
      startClock();
      
      console.log('[GameDirector] Run started successfully!');
    } catch (error) {
      console.error('[GameDirector] Error during startRun:', error);
      console.log('[GameDirector] Run failed - check console for details');
    }
  }, [resetGame, spawnHero, spawnInitialPOI, startClock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { startRun };
}

// Helper functions (hardcoded, simple)

function createInitialGameState(): VillageState {
  return {
    currentTime: 0,
    residents: {},
    activities: {},
    resources: {
      food: 10,
      gold: 0,
      wood: 0
    },
    eventLog: [],
    questOffers: {}
  };
}

function createHero(): ResidentState {
  return {
    id: 'hero-001',
    displayName: 'Hero',
    status: 'available',
    stats: {
      hp: 100,
      damage: 10,
      speed: 5
    },
    fatigue: 0,
    isInjured: false
  };
}

function spawnJob(type: string, distance: string): void {
  console.log(`[GameDirector] Job spawned: ${type} at ${distance} distance`);
  // TODO: Use existing job/quest systems to actually spawn
}

function spawnQuest(difficulty: string, distance: string): void {
  console.log(`[GameDirector] Quest spawned: ${difficulty} at ${distance} distance`);
  // TODO: Use existing quest system to actually spawn
}

function giveBonusGold(): void {
  // Simplified: just log for now
  console.log('[GameDirector] Bonus gold awarded: +10 (simulated)');
}

function simulateDefense(state: any): { defenseSuccess: boolean; villageDestroyed: boolean; villageDamage: number } {
  // Simplified: hardcoded result for testing
  const defenseSuccess = false; // Always fail for testing game over
  const villageDestroyed = !defenseSuccess;
  const villageDamage = defenseSuccess ? 0 : 100;
  
  return { defenseSuccess, villageDestroyed, villageDamage };
}

function saveBlueprints(): void {
  // Simplified: just log for now
  console.log('[GameDirector] Blueprints saved (simulated)');
}
