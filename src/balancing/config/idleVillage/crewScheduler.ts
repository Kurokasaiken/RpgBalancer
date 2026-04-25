/**
 * Crew Scheduler Configuration – WS3 Deterministic Queue
 * 
 * Provides priority weights and deterministic seeding for the Idle Village
 * crew scheduling system. All priority calculations are config-first to
 * enable designers to tune assignment behavior without code changes.
 * 
 * @since WS3
 */

/**
 * Priority weight categories for crew task assignment.
 * Higher values increase the likelihood of being selected first.
 */
export interface CrewSchedulerPriorityWeights {
  /** Weight for stat tag matching (e.g., strength, agility) */
  statTagMatch: number;
  /** Weight for resident fatigue level (higher fatigue = lower priority) */
  fatiguePenalty: number;
  /** Weight for quest urgency (time-sensitive quests get priority) */
  questUrgency: number;
  /** Weight for resident specialization (preferred activities) */
  specializationBonus: number;
  /** Weight for activity difficulty (harder tasks may get priority) */
  difficultyBonus: number;
  /** Base weight applied to all assignments */
  baseWeight: number;
}

/**
 * Deterministic seeding configuration for reproducible scheduling.
 */
export interface CrewSchedulerSeeding {
  /** LCG seed for deterministic randomization */
  lcgSeed: number;
  /** Whether to use deterministic ordering (tests) vs production randomness */
  deterministic: boolean;
  /** Seed strategy for generating deterministic seeds */
  seedStrategy?: 'fixed' | 'timestamp' | 'hash' | 'entropy';
  /** Context for hash-based seed generation */
  seedContext?: {
    timestamp?: number;
    input?: string;
    entropy?: number;
  };
}

/**
 * Thresholds for priority calculation decisions.
 */
export interface CrewSchedulerThresholds {
  /** Fatigue level above which penalty is applied (0-1) */
  fatiguePenaltyThreshold: number;
  /** Quest time remaining below which urgency bonus applies (in time units) */
  questUrgencyThreshold: number;
  /** Minimum stat tag match score to qualify for bonus */
  statTagMatchThreshold: number;
}

/**
 * Complete crew scheduler configuration.
 */
export interface CrewSchedulerAnalyticsConfig {
  /** Whether to emit events into the analytics channel */
  enableChannel: boolean;
}

/**
 * Time travel configuration for crew scheduler snapshots.
 */
export interface CrewSchedulerTimeTravelConfig {
  /** Whether time travel is enabled */
  enabled: boolean;
  /** Maximum number of snapshots to keep in history */
  maxSnapshots: number;
  /** Whether to auto-capture snapshots on state changes */
  autoCapture: boolean;
  /** Snapshot trigger events */
  captureOn: {
    enqueueTask: boolean;
    processQueue: boolean;
    rebalanceQueue: boolean;
    consumeAssignment: boolean;
  };
}

export interface CrewSchedulerConfig {
  /** Priority weights for different factors */
  priorityWeights: CrewSchedulerPriorityWeights;
  /** Deterministic seeding configuration */
  seeding: CrewSchedulerSeeding;
  /** Thresholds for priority decisions */
  thresholds: CrewSchedulerThresholds;
  /** Maximum queue size before rebalancing occurs */
  maxQueueSize: number;
  /** Whether to log scheduling decisions to diagnostics */
  enableDiagnostics: boolean;
  /** Analytics channel configuration */
  analytics?: CrewSchedulerAnalyticsConfig;
  /** Time travel configuration for snapshots */
  timeTravel?: CrewSchedulerTimeTravelConfig;
}

/**
 * Default crew scheduler configuration optimized for Punch Club gameplay.
 * 
 * Design rationale:
 * - Stat tag matching is heavily weighted to encourage specialization
 * - Fatigue penalty prevents overworking residents
 * - Quest urgency ensures time-sensitive tasks are prioritized
 * - Specialization bonus rewards residents for preferred activities
 */
export const DEFAULT_CREW_SCHEDULER_CONFIG: CrewSchedulerConfig = {
  priorityWeights: {
    statTagMatch: 10.0,
    fatiguePenalty: -8.0,
    questUrgency: 12.0,
    specializationBonus: 5.0,
    difficultyBonus: 2.0,
    baseWeight: 1.0,
  },
  seeding: {
    lcgSeed: 1337,
    deterministic: false, // Production uses true randomness
    seedStrategy: 'timestamp',
  },
  thresholds: {
    fatiguePenaltyThreshold: 0.7,
    questUrgencyThreshold: 3.0,
    statTagMatchThreshold: 0.5,
  },
  maxQueueSize: 50,
  enableDiagnostics: true,
  analytics: {
    enableChannel: true,
  },
  timeTravel: {
    enabled: true,
    maxSnapshots: 20,
    autoCapture: true,
    captureOn: {
      enqueueTask: true,
      processQueue: true,
      rebalanceQueue: true,
      consumeAssignment: true,
    },
  },
};

/**
 * Test configuration with deterministic seeding for reproducible results.
 * Used by unit tests and CI pipelines to ensure consistent scheduling behavior.
 */
export const TEST_CREW_SCHEDULER_CONFIG: CrewSchedulerConfig = {
  ...DEFAULT_CREW_SCHEDULER_CONFIG,
  seeding: {
    lcgSeed: 42,
    deterministic: true,
    seedStrategy: 'fixed',
  },
  enableDiagnostics: true,
  timeTravel: {
    enabled: true,
    maxSnapshots: 10,
    autoCapture: true,
    captureOn: {
      enqueueTask: true,
      processQueue: true,
      rebalanceQueue: true,
      consumeAssignment: true,
    },
  },
};

/**
 * Validates a crew scheduler configuration.
 * 
 * @param config - Configuration to validate
 * @returns True if configuration is valid
 */
export function validateCrewSchedulerConfig(config: CrewSchedulerConfig): boolean {
  const { priorityWeights, seeding, thresholds, maxQueueSize, analytics, timeTravel } = config;
  
  // Check weight ranges (allow negative for penalties)
  const weights = Object.values(priorityWeights);
  if (weights.some(w => !Number.isFinite(w))) {
    return false;
  }
  
  // Check seeding
  if (!Number.isInteger(seeding.lcgSeed) || seeding.lcgSeed < 0) {
    return false;
  }
  
  // Check seed strategy
  const validStrategies: ('fixed' | 'timestamp' | 'hash' | 'entropy')[] = ['fixed', 'timestamp', 'hash', 'entropy'];
  if (seeding.seedStrategy && !validStrategies.includes(seeding.seedStrategy)) {
    return false;
  }
  
  // Check seed context for hash strategy
  if (seeding.seedStrategy === 'hash' && !seeding.seedContext?.input) {
    return false;
  }
  
  // Check thresholds (should be 0-1 for percentages, positive for time)
  if (thresholds.fatiguePenaltyThreshold < 0 || thresholds.fatiguePenaltyThreshold > 1) {
    return false;
  }
  if (thresholds.questUrgencyThreshold < 0) {
    return false;
  }
  if (thresholds.statTagMatchThreshold < 0 || thresholds.statTagMatchThreshold > 1) {
    return false;
  }
  
  // Check queue size
  if (!Number.isInteger(maxQueueSize) || maxQueueSize <= 0) {
    return false;
  }
  if (analytics && typeof analytics.enableChannel !== 'boolean') {
    return false;
  }

  // Check time travel config
  if (timeTravel) {
    if (!Number.isInteger(timeTravel.maxSnapshots) || timeTravel.maxSnapshots < 0) {
      return false;
    }
    if (typeof timeTravel.enabled !== 'boolean' ||
        typeof timeTravel.autoCapture !== 'boolean') {
      return false;
    }
    if (typeof timeTravel.captureOn !== 'object' ||
        Object.values(timeTravel.captureOn).some(v => typeof v !== 'boolean')) {
      return false;
    }
  }
  
  return true;
}

/**
 * Creates a deterministic LCG (Linear Congruential Generator) for reproducible
 * randomization in crew scheduling decisions.
 * 
 * @param seed - Initial seed value
 * @returns Deterministic random function (0-1)
 */
export function createDeterministicRng(seed: number): () => number {
  let currentSeed = seed >>> 0; // Ensure unsigned 32-bit
  
  return () => {
    currentSeed = (1664525 * currentSeed + 1013904223) >>> 0;
    return currentSeed / 0xffffffff;
  };
}

/**
 * Calculates priority score for a resident-activity assignment.
 * Higher scores indicate higher priority for selection.
 * 
 * @param weights - Priority weights from config
 * @param thresholds - Decision thresholds
 * @param factors - Assignment factors (stat match, fatigue, etc.)
 * @returns Priority score (higher = more priority)
 */
export function calculateAssignmentPriority(
  weights: CrewSchedulerPriorityWeights,
  thresholds: CrewSchedulerThresholds,
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
 * Type for scheduling decision diagnostics logged when enableDiagnostics is true.
 */
export interface CrewSchedulerDiagnostics {
  timestamp: number;
  residentId: string;
  activityId: string;
  priorityScore: number;
  factors: {
    statTagMatch: number;
    fatigue: number;
    questUrgency: number;
    specialization: number;
    difficulty: number;
  };
  decision: 'queued' | 'assigned' | 'skipped';
  reason?: string;
}
