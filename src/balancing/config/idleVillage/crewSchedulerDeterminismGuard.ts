/**
 * Crew Scheduler Determinism Guard
 * 
 * Provides deterministic seeding, state snapshot, and validation
 * for the Idle Village crew scheduler system. Ensures reproducible
 * scheduling behavior across test runs and production environments.
 * 
 * @since NP-013
 */

import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import type { CrewSchedulerConfig } from './crewScheduler';
import type { QueuedAssignment } from '@/ui/idleVillage/hooks/useCrewScheduler';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';

/**
 * Seed strategy types for deterministic scheduling
 */
export type SeedStrategy = 'fixed' | 'timestamp' | 'hash' | 'entropy';

/**
 * Determinism guard configuration
 */
export interface DeterminismGuardConfig {
  /** Whether determinism guard is enabled */
  enabled: boolean;
  /** Seed strategy for generating deterministic seeds */
  seedStrategy: SeedStrategy;
  /** Fixed seed value for 'fixed' strategy */
  fixedSeed: number;
  /** Whether to validate determinism on each operation */
  validateDeterminism: boolean;
  /** Maximum allowed deviation from expected results */
  maxDeviation: number;
  /** Whether to log determinism violations */
  logViolations: boolean;
  /** Snapshot configuration */
  snapshot: {
    /** Whether to enable automatic snapshots */
    enabled: boolean;
    /** Snapshot interval in milliseconds */
    intervalMs: number;
    /** Maximum number of snapshots to keep */
    maxSnapshots: number;
    /** Snapshot file path pattern */
    filePath: string;
  };
}

/**
 * Scheduler state snapshot for determinism validation
 */
export interface SchedulerSnapshot {
  /** Snapshot timestamp */
  timestamp: number;
  /** Seed used for deterministic operations */
  seed: number;
  /** Complete scheduler configuration */
  config: CrewSchedulerConfig;
  /** Current queue state */
  queue: QueuedAssignment[];
  /** Village state at snapshot time */
  villageState: {
    residents: Record<string, ResidentState>;
    activities: Record<string, ActivityDefinition>;
    currentTime: number;
  };
  /** Determinism validation results */
  validation: {
    expectedQueue: QueuedAssignment[];
    actualQueue: QueuedAssignment[];
    deviation: number;
    deterministic: boolean;
  };
  /** System entropy at snapshot time */
  entropy: {
    randomSeed: number;
    timestamp: number;
    memoryUsage?: number;
    processId?: number;
  };
}

/**
 * Determinism validation result
 */
export interface DeterminismValidationResult {
  /** Whether the operation was deterministic */
  deterministic: boolean;
  /** Deviation from expected results (0-1) */
  deviation: number;
  /** Expected queue state */
  expectedQueue: QueuedAssignment[];
  /** Actual queue state */
  actualQueue: QueuedAssignment[];
  /** Validation timestamp */
  timestamp: number;
  /** Seed used for validation */
  seed: number;
  /** Validation errors if any */
  errors: string[];
}

/**
 * Default determinism guard configuration
 */
export const DEFAULT_DETERMINISM_GUARD_CONFIG: DeterminismGuardConfig = {
  enabled: true,
  seedStrategy: 'timestamp',
  fixedSeed: 1337,
  validateDeterminism: true,
  maxDeviation: 0.001, // 0.1% tolerance
  logViolations: true,
  snapshot: {
    enabled: false,
    intervalMs: 60000, // 1 minute
    maxSnapshots: 10,
    filePath: './scheduler-snapshots',
  },
};

/**
 * Test configuration with strict determinism
 */
export const TEST_DETERMINISM_GUARD_CONFIG: DeterminismGuardConfig = {
  ...DEFAULT_DETERMINISM_GUARD_CONFIG,
  enabled: true,
  seedStrategy: 'fixed',
  fixedSeed: 42,
  validateDeterminism: true,
  maxDeviation: 0.0, // Zero tolerance for tests
  logViolations: true,
  snapshot: {
    enabled: true,
    intervalMs: 1000, // 1 second for tests
    maxSnapshots: 100,
    filePath: './test-scheduler-snapshots',
  },
};

/**
 * Generates deterministic seed based on strategy
 */
export function generateDeterministicSeed(
  strategy: SeedStrategy,
  fixedSeed: number,
  context?: {
    timestamp?: number;
    input?: string;
    entropy?: number;
  }
): number {
  switch (strategy) {
    case 'fixed': {
      return fixedSeed;
    }
      
    case 'timestamp': {
      // Use timestamp with fixed offset for consistency
      const timestamp = context?.timestamp || Date.now();
      return ((timestamp / 1000) | 0) ^ fixedSeed;
    }
      
    case 'hash': {
      // Simple hash function for string inputs
      if (!context?.input) {
        throw new Error('Hash strategy requires input string');
      }
      let hash = 0;
      for (let i = 0; i < context.input.length; i++) {
        const char = context.input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return (hash ^ fixedSeed) >>> 0;
    }
      
    case 'entropy': {
      // Combine multiple entropy sources
      const entropy = context?.entropy || Math.random() * 0xffffffff;
      const timeComponent = (context?.timestamp || Date.now()) & 0xffffffff;
      return ((entropy ^ timeComponent) ^ fixedSeed) >>> 0;
    }
      
    default: {
      throw new Error(`Unknown seed strategy: ${strategy}`);
    }
  }
}

/**
 * Creates a deterministic queue state for validation
 */
export function createDeterministicQueueState(
  seed: number,
  config: CrewSchedulerConfig,
  inputAssignments: Array<{
    residentId: string;
    activityId: string;
    timestamp?: number;
  }>
): QueuedAssignment[] {
  const rng = createDeterministicRng(seed);
  const assignments: QueuedAssignment[] = [];
  
  inputAssignments.forEach((input, index) => {
    const priorityScore = calculateAssignmentPriority(
      config.priorityWeights,
      config.thresholds,
      {
        statTagMatch: 0.5 + rng() * 0.5, // 0.5-1.0
        fatigue: rng() * 0.8, // 0-0.8
        questUrgency: rng() * 5, // 0-5
        specialization: rng() * 0.7, // 0-0.7
        difficulty: rng() * 0.6, // 0-0.6
      }
    );
    
    assignments.push({
      id: `assignment-${index}`,
      residentId: input.residentId,
      activityId: input.activityId,
      priorityScore,
      timestamp: input.timestamp || Date.now(),
      factors: {
        statTagMatch: 0.5 + rng() * 0.5,
        fatigue: rng() * 0.8,
        questUrgency: rng() * 5,
        specialization: rng() * 0.7,
        difficulty: rng() * 0.6,
      },
    });
  });
  
  // Sort by priority (highest first) and then timestamp for tie-breaking
  assignments.sort((a, b) => {
    if (Math.abs(b.priorityScore - a.priorityScore) < 0.001) {
      return a.timestamp - b.timestamp;
    }
    return b.priorityScore - a.priorityScore;
  });
  
  return assignments;
}

/**
 * Validates determinism of scheduling operations
 */
export function validateDeterminism(
  expectedQueue: QueuedAssignment[],
  actualQueue: QueuedAssignment[],
  maxDeviation: number,
  seed: number
): DeterminismValidationResult {
  const errors: string[] = [];
  
  // Check queue length
  if (expectedQueue.length !== actualQueue.length) {
    errors.push(`Queue length mismatch: expected ${expectedQueue.length}, got ${actualQueue.length}`);
  }
  
  // Check each assignment
  let totalDeviation = 0;
  const minLength = Math.min(expectedQueue.length, actualQueue.length);
  
  for (let i = 0; i < minLength; i++) {
    const expected = expectedQueue[i];
    const actual = actualQueue[i];
    
    // Check basic properties
    if (expected.residentId !== actual.residentId) {
      errors.push(`Assignment ${i}: residentId mismatch (expected ${expected.residentId}, got ${actual.residentId})`);
    }
    
    if (expected.activityId !== actual.activityId) {
      errors.push(`Assignment ${i}: activityId mismatch (expected ${expected.activityId}, got ${actual.activityId})`);
    }
    
    // Check priority score deviation
    const scoreDeviation = Math.abs(expected.priorityScore - actual.priorityScore);
    totalDeviation += scoreDeviation;
    
    if (scoreDeviation > maxDeviation) {
      errors.push(`Assignment ${i}: priority score deviation ${scoreDeviation.toFixed(6)} exceeds threshold ${maxDeviation}`);
    }
  }
  
  const averageDeviation = minLength > 0 ? totalDeviation / minLength : 0;
  const deterministic = errors.length === 0 && averageDeviation <= maxDeviation;
  
  return {
    deterministic,
    deviation: averageDeviation,
    expectedQueue,
    actualQueue,
    timestamp: Date.now(),
    seed,
    errors,
  };
}

/**
 * Creates a scheduler state snapshot
 */
export function createSchedulerSnapshot(
  seed: number,
  config: CrewSchedulerConfig,
  queue: QueuedAssignment[],
  villageState: {
    residents: Record<string, ResidentState>;
    activities: Record<string, ActivityDefinition>;
    currentTime: number;
  },
  expectedQueue?: QueuedAssignment[]
): SchedulerSnapshot {
  // Generate expected queue if not provided
  const expected = expectedQueue || createDeterministicQueueState(
    seed,
    config,
    queue.map(a => ({ residentId: a.residentId, activityId: a.activityId }))
  );
  
  // Validate determinism
  const validation = validateDeterminism(expected, queue, 0.001, seed);
  
  return {
    timestamp: Date.now(),
    seed,
    config: JSON.parse(JSON.stringify(config)), // Deep clone
    queue: JSON.parse(JSON.stringify(queue)), // Deep clone
    villageState: JSON.parse(JSON.stringify(villageState)), // Deep clone
    validation,
    entropy: {
      randomSeed: Math.random() * 0xffffffff,
      timestamp: Date.now(),
      processId: typeof process !== 'undefined' ? process.pid : undefined,
    },
  };
}

/**
 * Saves a scheduler snapshot to storage
 */
export async function saveSchedulerSnapshot(
  snapshot: SchedulerSnapshot,
  _filePath: string
): Promise<void> {
  try {
    // Use PersistenceService for storage
    const storageKey = `scheduler_snapshot_${snapshot.timestamp}`;
    await saveData(storageKey, snapshot);
    
    console.log(`[DeterminismGuard] Saved snapshot to storage: ${storageKey}`);
    console.log(`[DeterminismGuard] Snapshot size: ${JSON.stringify(snapshot).length} bytes`);
    console.log(`[DeterminismGuard] Queue size: ${snapshot.queue.length} assignments`);
    console.log(`[DeterminismGuard] Deterministic: ${snapshot.validation.deterministic}`);
    
  } catch (error) {
    console.error('[DeterminismGuard] Failed to save snapshot:', error);
    throw error;
  }
}

/**
 * Loads a scheduler snapshot from storage
 */
export async function loadSchedulerSnapshot(
  filePath: string,
  timestamp?: number
): Promise<SchedulerSnapshot | null> {
  try {
    // Use PersistenceService for loading
    const storageKey = timestamp 
      ? `scheduler_snapshot_${timestamp}`
      : `scheduler_snapshot_${filePath.split('-').pop() || Date.now()}`;
    
    const snapshot = await loadData<SchedulerSnapshot>(storageKey, null);
    
    if (snapshot) {
      console.log(`[DeterminismGuard] Loaded snapshot from storage: ${storageKey}`);
      console.log(`[DeterminismGuard] Queue size: ${snapshot.queue.length} assignments`);
      console.log(`[DeterminismGuard] Deterministic: ${snapshot.validation.deterministic}`);
      return snapshot;
    }
    
    return null;
    
  } catch (error) {
    console.error('[DeterminismGuard] Failed to load snapshot:', error);
    throw error;
  }
}

/**
 * Creates a deterministic RNG from seed (reused from crewScheduler.ts)
 */
export function createDeterministicRng(seed: number): () => number {
  let currentSeed = seed >>> 0; // Ensure unsigned 32-bit
  
  return () => {
    currentSeed = (1664525 * currentSeed + 1013904223) >>> 0;
    return currentSeed / 0xffffffff;
  };
}

/**
 * Calculates assignment priority (reused from crewScheduler.ts)
 */
export function calculateAssignmentPriority(
  weights: CrewSchedulerConfig['priorityWeights'],
  thresholds: CrewSchedulerConfig['thresholds'],
  factors: {
    statTagMatch: number;
    fatigue: number;
    questUrgency: number;
    specialization: number;
    difficulty: number;
  }
): number {
  let score = weights.baseWeight;
  
  // Stat tag matching bonus
  if (factors.statTagMatch >= thresholds.statTagMatchThreshold) {
    score += factors.statTagMatch * weights.statTagMatch;
  }
  
  // Fatigue penalty (negative weight)
  if (factors.fatigue >= thresholds.fatiguePenaltyThreshold) {
    score += factors.fatigue * weights.fatiguePenalty;
  }
  
  // Quest urgency bonus
  if (factors.questUrgency <= thresholds.questUrgencyThreshold) {
    score += (thresholds.questUrgencyThreshold - factors.questUrgency) * weights.questUrgency;
  }
  
  // Specialization bonus
  score += factors.specialization * weights.specializationBonus;
  
  // Difficulty bonus
  score += factors.difficulty * weights.difficultyBonus;
  
  return score;
}

/**
 * Validates determinism guard configuration
 */
export function validateDeterminismGuardConfig(config: DeterminismGuardConfig): boolean {
  // Check seed strategy
  const validStrategies: SeedStrategy[] = ['fixed', 'timestamp', 'hash', 'entropy'];
  if (!validStrategies.includes(config.seedStrategy)) {
    return false;
  }
  
  // Check fixed seed
  if (!Number.isInteger(config.fixedSeed) || config.fixedSeed < 0) {
    return false;
  }
  
  // Check max deviation
  if (config.maxDeviation < 0 || config.maxDeviation > 1) {
    return false;
  }
  
  // Check snapshot configuration
  if (config.snapshot.intervalMs <= 0) {
    return false;
  }
  
  if (config.snapshot.maxSnapshots <= 0) {
    return false;
  }
  
  return true;
}
