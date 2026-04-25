/**
 * Idle Village Resident Drag & Drop Stress Test Harness
 * 
 * Configurable stress testing system for drag & drop operations with
 * performance monitoring, operation generators, and comprehensive metrics.
 * Designed to test 1000+ operations with configurable scenarios.
 * 
 * @since NP-014
 */

import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';

/**
 * Stress test configuration options
 */
export interface StressTestConfig {
  /** Number of operations to perform */
  operationCount: number;
  /** Whether to run in parallel (affects performance) */
  parallel: boolean;
  /** Number of parallel workers (if parallel is true) */
  parallelWorkers: number;
  /** Delay between operations (ms) */
  operationDelay: number;
  /** Whether to enable performance monitoring */
  enableMonitoring: boolean;
  /** Whether to collect detailed metrics */
  collectMetrics: boolean;
  /** Whether to validate each operation */
  enableValidation: boolean;
  /** Maximum time to wait for operations (ms) */
  operationTimeout: number;
  /** Whether to enable progress tracking */
  enableProgressTracking: boolean;
  /** Test scenario to run */
  scenario: StressTestScenario;
}

/**
 * Stress test scenarios
 */
export type StressTestScenario = 
  | 'random_drops'
  | 'sequential_drops'
  | 'capacity_stress'
  | 'fatigue_stress'
  | 'stat_requirement_stress'
  | 'mixed_realistic'
  | 'worst_case'
  | 'edge_cases';

/**
 * Operation types for stress testing
 */
export type OperationType = 
  | 'valid_drop'
  | 'invalid_drop_fatigue'
  | 'invalid_drop_stats'
  | 'invalid_drop_capacity'
  | 'invalid_drop_availability'
  | 'edge_case_empty_data'
  | 'edge_case_null_values';

/**
 * Individual drag & drop operation
 */
export interface DragDropOperation {
  /** Unique operation identifier */
  id: string;
  /** Operation type */
  type: OperationType;
  /** Resident being dragged */
  resident: ResidentState;
  /** Target activity */
  activity: ActivityDefinition;
  /** Current occupants of target */
  currentOccupants: number;
  /** Operation timestamp */
  timestamp: number;
  /** Expected validation result */
  expectedResult: boolean;
  /** Operation metadata */
  metadata: {
    scenario: string;
    iteration: number;
    workerId?: number;
  };
}

/**
 * Performance metrics for stress testing
 */
export interface StressTestMetrics {
  /** Total test duration */
  totalDuration: number;
  /** Average operation duration */
  averageOperationDuration: number;
  /** Fastest operation duration */
  fastestOperationDuration: number;
  /** Slowest operation duration */
  slowestOperationDuration: number;
  /** Operations per second */
  operationsPerSecond: number;
  /** Success rate */
  successRate: number;
  /** Validation accuracy */
  validationAccuracy: number;
  /** Memory usage statistics */
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
    delta: number;
  };
  /** Error statistics */
  errorStats: {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByScenario: Record<string, number>;
  };
  /** Performance percentiles */
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

/**
 * Stress test result
 */
export interface StressTestResult {
  /** Test configuration */
  config: StressTestConfig;
  /** All operations performed */
  operations: DragDropOperation[];
  /** Validation results for each operation */
  validationResults: DropValidationResult[];
  /** Performance metrics */
  metrics: StressTestMetrics;
  /** Test start timestamp */
  startTime: number;
  /** Test end timestamp */
  endTime: number;
  /** Whether test completed successfully */
  completed: boolean;
  /** Test completion status */
  status: 'running' | 'completed' | 'failed' | 'timeout';
  /** Error message if test failed */
  error?: string;
}

/**
 * Progress tracking information
 */
export interface StressTestProgress {
  /** Current operation count */
  completedOperations: number;
  /** Total operation count */
  totalOperations: number;
  /** Current progress percentage */
  progressPercentage: number;
  /** Estimated remaining time (ms) */
  estimatedRemainingTime: number;
  /** Current operations per second */
  currentOpsPerSecond: number;
  /** Error count */
  errorCount: number;
  /** Test status */
  status: StressTestResult['status'];
}

/**
 * Operation generator configuration
 */
export interface OperationGeneratorConfig {
  /** Number of residents to generate */
  residentCount: number;
  /** Number of activities to generate */
  activityCount: number;
  /** Fatigue range for generated residents */
  fatigueRange: { min: number; max: number };
  /** Stat range for generated residents */
  statRange: { min: number; max: number };
  /** Activity capacity range */
  capacityRange: { min: number; max: number };
  /** Percentage of invalid operations */
  invalidOperationPercentage: number;
  /** Random seed for reproducible tests */
  seed?: number;
}

/**
 * Default stress test configuration
 */
export const DEFAULT_STRESS_TEST_CONFIG: StressTestConfig = {
  operationCount: 1000,
  parallel: false,
  parallelWorkers: 4,
  operationDelay: 0,
  enableMonitoring: true,
  collectMetrics: true,
  enableValidation: true,
  operationTimeout: 5000,
  enableProgressTracking: true,
  scenario: 'mixed_realistic',
};

/**
 * Test configuration for different scenarios
 */
export const STRESS_TEST_SCENARIOS: Record<StressTestScenario, Partial<StressTestConfig>> = {
  random_drops: {
    operationCount: 1000,
    parallel: true,
    parallelWorkers: 8,
    operationDelay: 0,
    scenario: 'random_drops',
  },
  sequential_drops: {
    operationCount: 500,
    parallel: false,
    operationDelay: 10,
    scenario: 'sequential_drops',
  },
  capacity_stress: {
    operationCount: 2000,
    parallel: true,
    parallelWorkers: 4,
    invalidOperationPercentage: 0.3,
    scenario: 'capacity_stress',
  },
  fatigue_stress: {
    operationCount: 1500,
    parallel: false,
    operationDelay: 5,
    invalidOperationPercentage: 0.4,
    scenario: 'fatigue_stress',
  },
  stat_requirement_stress: {
    operationCount: 1000,
    parallel: true,
    parallelWorkers: 6,
    invalidOperationPercentage: 0.2,
    scenario: 'stat_requirement_stress',
  },
  mixed_realistic: {
    operationCount: 1000,
    parallel: false,
    operationDelay: 2,
    invalidOperationPercentage: 0.15,
    scenario: 'mixed_realistic',
  },
  worst_case: {
    operationCount: 5000,
    parallel: true,
    parallelWorkers: 8,
    operationDelay: 0,
    invalidOperationPercentage: 0.5,
    scenario: 'worst_case',
  },
  edge_cases: {
    operationCount: 100,
    parallel: false,
    operationDelay: 0,
    invalidOperationPercentage: 0.8,
    scenario: 'edge_cases',
  },
};

/**
 * Validates stress test configuration
 */
export function validateStressTestConfig(config: StressTestConfig): boolean {
  if (config.operationCount <= 0) return false;
  if (config.parallelWorkers <= 0) return false;
  if (config.operationDelay < 0) return false;
  if (config.operationTimeout <= 0) return false;
  if (config.parallel && config.parallelWorkers > config.operationCount) return false;
  
  return true;
}

/**
 * Creates a deterministic random number generator for reproducible tests
 */
export function createTestRNG(seed?: number): () => number {
  let currentSeed = (seed ?? Date.now()) >>> 0;
  
  return () => {
    currentSeed = (1664525 * currentSeed + 1013904223) >>> 0;
    return currentSeed / 0xffffffff;
  };
}

/**
 * Generates test residents for stress testing
 */
export function generateTestResidents(
  config: OperationGeneratorConfig,
  rng: () => number
): ResidentState[] {
  const residents: ResidentState[] = [];
  
  for (let i = 0; i < config.residentCount; i++) {
    const fatigue = config.fatigueRange.min + (rng() * (config.fatigueRange.max - config.fatigueRange.min));
    const strength = config.statRange.min + (rng() * (config.statRange.max - config.statRange.min));
    const agility = config.statRange.min + (rng() * (config.statRange.max - config.statRange.min));
    const intelligence = config.statRange.min + (rng() * (config.statRange.max - config.statRange.min));
    
    residents.push({
      id: `resident-${i}`,
      name: `Test Resident ${i}`,
      fatigue,
      location: 'village',
      currentActivity: null,
      available: fatigue < 80, // 80% fatigue threshold
      status: fatigue < 80 ? 'available' : 'exhausted',
      statSnapshot: {
        strength,
        agility,
        intelligence,
        vitality: strength * 0.8,
        dexterity: agility * 0.9,
        wisdom: intelligence * 0.7,
        charisma: 50 + rng() * 50,
      },
    });
  }
  
  return residents;
}

/**
 * Generates test activities for stress testing
 */
export function generateTestActivities(
  config: OperationGeneratorConfig,
  rng: () => number
): ActivityDefinition[] {
  const activities: ActivityDefinition[] = [];
  const activityTypes = [
    { name: 'Forest Work', tags: ['outdoor', 'physical'], difficulty: 3 },
    { name: 'Mine Work', tags: ['outdoor', 'physical'], difficulty: 4 },
    { name: 'Craft Work', tags: ['indoor', 'mental'], difficulty: 2 },
    { name: 'Farm Work', tags: ['outdoor', 'physical'], difficulty: 3 },
    { name: 'Library Study', tags: ['indoor', 'mental'], difficulty: 1 },
    { name: 'Blacksmith', tags: ['indoor', 'physical'], difficulty: 5 },
    { name: 'Trading Post', tags: ['indoor', 'social'], difficulty: 2 },
    { name: 'Guard Duty', tags: ['outdoor', 'combat'], difficulty: 4 },
  ];
  
  for (let i = 0; i < config.activityCount; i++) {
    const activityType = activityTypes[Math.floor(rng() * activityTypes.length)];
    const capacity = Math.floor(config.capacityRange.min + (rng() * (config.capacityRange.max - config.capacityRange.min)));
    
    // Generate stat requirements
    const statRequirement = rng() > 0.3 ? {
      allOf: [
        `${activityType.tags.includes('physical') ? 'strength' : 'intelligence'}`
      ],
      anyOf: activityType.tags.length > 1 ? activityType.tags.slice(0, 2) : undefined,
      noneOf: rng() > 0.7 ? ['exhausted'] : undefined,
    } : undefined;
    
    activities.push({
      id: `activity-${i}`,
      name: `${activityType.name} ${i}`,
      difficulty: activityType.difficulty,
      duration: 100 + Math.floor(rng() * 200), // 100-300ms
      maxSlots: capacity,
      tags: activityType.tags,
      statRequirement,
      customErrorMessages: {},
    });
  }
  
  return activities;
}

/**
 * Generates drag & drop operations for stress testing
 */
export function generateDragDropOperations(
  config: StressTestConfig,
  generatorConfig: OperationGeneratorConfig,
  residents: ResidentState[],
  activities: ActivityDefinition[],
  rng: () => number
): DragDropOperation[] {
  const operations: DragDropOperation[] = [];
  const invalidPercentage = generatorConfig.invalidOperationPercentage || 0.15;
  
  for (let i = 0; i < config.operationCount; i++) {
    const resident = residents[Math.floor(rng() * residents.length)];
    const activity = activities[Math.floor(rng() * activities.length)];
    const currentOccupants = Math.floor(rng() * (activity.maxSlots || 1));
    
    // Determine operation type based on scenario and invalid percentage
    let type: OperationType;
    let expectedResult: boolean;
    
    if (rng() < invalidPercentage) {
      // Generate invalid operation
      const invalidTypes: OperationType[] = [
        'invalid_drop_fatigue',
        'invalid_drop_stats',
        'invalid_drop_capacity',
        'invalid_drop_availability',
        'edge_case_empty_data',
        'edge_case_null_values',
      ];
      
      type = invalidTypes[Math.floor(rng() * invalidTypes.length)];
      expectedResult = false;
    } else {
      // Generate valid operation
      type = 'valid_drop';
      expectedResult = true;
    }
    
    // Adjust operation based on type
    let adjustedResident = { ...resident };
    let adjustedActivity = { ...activity };
    let adjustedOccupants = currentOccupants;
    
    switch (type) {
      case 'invalid_drop_fatigue':
        adjustedResident.fatigue = 95; // High fatigue
        break;
      case 'invalid_drop_stats':
        // Keep resident with low stats for stat requirements
        break;
      case 'invalid_drop_capacity':
        adjustedOccupants = (activity.maxSlots || 1); // Full capacity
        break;
      case 'invalid_drop_availability':
        adjustedResident.available = false;
        adjustedResident.status = 'busy';
        break;
      case 'edge_case_empty_data':
        // Use minimal data
        adjustedResident = {
          id: '',
          name: '',
          fatigue: 0,
          location: '',
          currentActivity: null,
          available: true,
          status: 'available',
        };
        break;
      case 'edge_case_null_values':
        // Use null/undefined values
        adjustedResident = null as any;
        adjustedActivity = null as any;
        break;
    }
    
    operations.push({
      id: `operation-${i}`,
      type,
      resident: adjustedResident,
      activity: adjustedActivity,
      currentOccupants: adjustedOccupants,
      timestamp: Date.now() + (i * config.operationDelay),
      expectedResult,
      metadata: {
        scenario: config.scenario,
        iteration: i,
      },
    });
  }
  
  return operations;
}

/**
 * Calculates performance metrics from operation results
 */
export function calculateMetrics(
  operations: DragDropOperation[],
  validationResults: DropValidationResult[],
  startTime: number,
  endTime: number,
  initialMemory: number,
  peakMemory: number,
  finalMemory: number
): StressTestMetrics {
  const totalDuration = endTime - startTime;
  const operationDurations = operations.map((op, index) => {
    const validationTime = validationResults[index] ? 1 : 0; // Placeholder
    return validationTime;
  });
  
  const validOperations = validationResults.filter(r => r.isValid).length;
  const expectedValid = operations.filter(op => op.expectedResult).length;
  const expectedInvalid = operations.filter(op => !op.expectedResult).length;
  const actualInvalid = validationResults.filter(r => !r.isValid).length;
  
  // Calculate percentiles
  const sortedDurations = operationDurations.sort((a, b) => a - b);
  const percentiles = {
    p50: sortedDurations[Math.floor(sortedDurations.length * 0.5)] || 0,
    p90: sortedDurations[Math.floor(sortedDurations.length * 0.9)] || 0,
    p95: sortedDurations[Math.floor(sortedDurations.length * 0.95)] || 0,
    p99: sortedDurations[Math.floor(sortedDurations.length * 0.99)] || 0,
  };
  
  // Calculate error statistics
  const errorStats = {
    totalErrors: validationResults.filter(r => !r.isValid).length,
    errorsByType: {} as Record<string, number>,
    errorsByScenario: {} as Record<string, number>,
  };
  
  validationResults.forEach((result, index) => {
    if (!result.isValid) {
      const operation = operations[index];
      const errorType = result.failedRule || 'unknown';
      const scenario = operation.metadata.scenario;
      
      errorStats.errorsByType[errorType] = (errorStats.errorsByType[errorType] || 0) + 1;
      errorStats.errorsByScenario[scenario] = (errorStats.errorsByScenario[scenario] || 0) + 1;
    }
  });
  
  return {
    totalDuration,
    averageOperationDuration: operationDurations.reduce((a, b) => a + b, 0) / operationDurations.length,
    fastestOperationDuration: Math.min(...operationDurations),
    slowestOperationDuration: Math.max(...operationDurations),
    operationsPerSecond: operations.length / (totalDuration / 1000),
    successRate: validOperations / operations.length,
    validationAccuracy: (validOperations === expectedValid && actualInvalid === expectedInvalid) ? 1 : 0,
    memoryUsage: {
      initial: initialMemory,
      peak: peakMemory,
      final: finalMemory,
      delta: finalMemory - initialMemory,
    },
    errorStats,
    percentiles,
  };
}

/**
 * Creates a progress tracker for stress tests
 */
export function createProgressTracker(
  totalOperations: number,
  startTime: number
): {
  update: (completedOperations: number, errorCount: number) => StressTestProgress;
  getCurrentProgress: () => StressTestProgress;
} {
  let completedOperations = 0;
  let errorCount = 0;
  
  const update = (newCompleted: number, newErrorCount: number) => {
    completedOperations = newCompleted;
    errorCount = newErrorCount;
    return getCurrentProgress();
  };
  
  const getCurrentProgress = (): StressTestProgress => {
    const now = Date.now();
    const elapsed = now - startTime;
    const progressPercentage = (completedOperations / totalOperations) * 100;
    const estimatedRemainingTime = completedOperations > 0 
      ? (elapsed / completedOperations) * (totalOperations - completedOperations)
      : 0;
    const currentOpsPerSecond = elapsed > 0 ? (completedOperations / elapsed) * 1000 : 0;
    
    return {
      completedOperations,
      totalOperations,
      progressPercentage,
      estimatedRemainingTime,
      currentOpsPerSecond,
      errorCount,
      status: completedOperations >= totalOperations ? 'completed' : 'running',
    };
  };
  
  return { update, getCurrentProgress };
}

/**
 * Default operation generator configuration
 */
export const DEFAULT_GENERATOR_CONFIG: OperationGeneratorConfig = {
  residentCount: 50,
  activityCount: 20,
  fatigueRange: { min: 0, max: 100 },
  statRange: { min: 10, max: 100 },
  capacityRange: { min: 1, max: 5 },
  invalidOperationPercentage: 0.15,
  seed: 1337,
};
