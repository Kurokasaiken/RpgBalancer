/**
 * Stress Test Telemetry Module
 * 
 * Handles telemetry emission for stress test runs in Phase 10.5.
 * Integrates with generic telemetry pipeline for data collection
 * and analysis of marginal utility calculations.
 * 
 * @module StressTelemetry
 * @since 2026-01-11
 * @author Spectrum-Telemetry
 */

// TODO: Replace with generic telemetry system

/**
 * Local interface for stress test telemetry events
 */
export interface StressTestTelemetryEventPayload {
  eventType: string;
  data: {
    testId: string;
    archetypeName: string;
    timestamp: number;
    runId?: string;
    archetypeId?: string;
    statPair?: string;
    winRate?: number;
    synergyMultiplier?: number;
    iterations?: number;
    seed?: number;
    error?: string;
    [key: string]: any;
  };
}

/**
 * Configuration for stress test telemetry
 */
export interface StressTelemetryConfig {
  /** Whether telemetry is enabled */
  enabled: boolean;
  /** Throttle rate for events (ms) */
  throttleMs: number;
  /** Whether to include detailed debug information */
  debug: boolean;
}

/**
 * Default configuration for stress test telemetry
 */
export const DEFAULT_STRESS_TELEMETRY_CONFIG: StressTelemetryConfig = {
  enabled: true,
  throttleMs: 1000, // 1 second throttle
  debug: false,
};

/**
 * Throttle manager for telemetry events
 */
class TelemetryThrottle {
  private lastEmission = new Map<string, number>();
  private config: StressTelemetryConfig;

  constructor(config: StressTelemetryConfig) {
    this.config = config;
  }

  /**
   * Check if an event should be throttled
   * @param key - Throttle key for the event type
   * @returns True if event should be throttled
   */
  shouldThrottle(key: string): boolean {
    const now = Date.now();
    const lastEmission = this.lastEmission.get(key) || 0;
    
    if (now - lastEmission < this.config.throttleMs) {
      return true;
    }
    
    this.lastEmission.set(key, now);
    return false;
  }

  /**
   * Reset throttle state (useful for testing)
   */
  reset(): void {
    this.lastEmission.clear();
  }
}

/**
 * Global telemetry throttle instance
 */
const telemetryThrottle = new TelemetryThrottle(DEFAULT_STRESS_TELEMETRY_CONFIG);

/**
 * Validates stress test telemetry payload
 * @param payload - Payload to validate
 * @returns True if payload is valid
 */
export function validateStressTestPayload(payload: StressTestTelemetryEventPayload): boolean {
  if (!payload) {
    return false;
  }

  // Required fields
  if (!payload.runId || typeof payload.runId !== 'string') {
    return false;
  }

  if (!payload.archetypeId || typeof payload.archetypeId !== 'string') {
    return false;
  }

  if (!payload.statPair || typeof payload.statPair !== 'string') {
    return false;
  }

  // Numeric validation
  if (typeof payload.winRate !== 'number' || payload.winRate < 0 || payload.winRate > 1) {
    return false;
  }

  if (typeof payload.synergyMultiplier !== 'number' || payload.synergyMultiplier < 0) {
    return false;
  }

  if (typeof payload.iterations !== 'number' || payload.iterations <= 0) {
    return false;
  }

  if (typeof payload.seed !== 'number' || payload.seed < 0) {
    return false;
  }

  return true;
}

/**
 * Create a unique run ID for stress test
 * @param archetypeId - Archetype identifier
 * @param statPair - Stat pair being tested
 * @param seed - Random seed
 * @returns Unique run ID
 */
export function createStressTestRunId(archetypeId: string, statPair: string, seed: number): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `stress-${archetypeId}-${statPair}-${seed}-${timestamp}`;
}

/**
 * Emit stress test run completed event
 * @param payload - Telemetry payload for completed run
 */
export function emitStressRunCompleted(payload: StressTestTelemetryEventPayload): void {
  if (!validateStressTestPayload(payload)) {
    console.warn('Invalid stress test telemetry payload, skipping emission', payload);
    return;
  }

  const throttleKey = `completed-${payload.archetypeId}-${payload.statPair}`;
  if (telemetryThrottle.shouldThrottle(throttleKey)) {
    if (DEFAULT_STRESS_TELEMETRY_CONFIG.debug) {
      console.debug('Stress test telemetry throttled', { throttleKey, payload });
    }
    return;
  }

  console.log('Stress test telemetry:', payload);
}

/**
 * Emit stress test run failed event
 * @param payload - Telemetry payload for failed run
 * @param error - Error that caused the failure
 */
export function emitStressRunFailed(
  payload: Omit<StressTestTelemetryEventPayload, 'error'>,
  error: Error
): void {
  const errorPayload: StressTestTelemetryEventPayload = {
    ...payload,
    error: {
      message: error.message,
      stack: error.stack,
    },
  };

  const throttleKey = `failed-${payload.archetypeId}-${payload.statPair}`;
  if (telemetryThrottle.shouldThrottle(throttleKey)) {
    if (DEFAULT_STRESS_TELEMETRY_CONFIG.debug) {
      console.debug('Stress test telemetry throttled', { throttleKey, payload: errorPayload });
    }
    return;
  }

  console.log('Stress test telemetry:', errorPayload);
}

/**
 * Emit stress test batch completed event
 * @param batchId - Batch identifier
 * @param totalRuns - Total number of runs in batch
 * @param completedRuns - Number of completed runs
 * @param durationMs - Total batch duration
 * @param results - Summary of batch results
 */
export function emitStressBatchCompleted(
  batchId: string,
  totalRuns: number,
  completedRuns: number,
  durationMs: number,
  results: {
    avgWinRate: number;
    avgSynergyMultiplier: number;
    topPerformers: Array<{
      archetypeId: string;
      statPair: string;
      winRate: number;
      synergyMultiplier: number;
    }>;
  }
): void {
  const payload: StressTestTelemetryEventPayload = {
    runId: `batch-${batchId}`,
    archetypeId: 'batch',
    statPair: 'multiple',
    winRate: results.avgWinRate,
    synergyMultiplier: results.avgSynergyMultiplier,
    iterations: totalRuns,
    seed: 0, // Not applicable for batches
    durationMs,
    batchInfo: {
      batchId,
      totalRuns,
      currentRun: completedRuns,
    },
  };

  const throttleKey = `batch-${batchId}`;
  if (telemetryThrottle.shouldThrottle(throttleKey)) {
    if (DEFAULT_STRESS_TELEMETRY_CONFIG.debug) {
      console.debug('Stress test batch telemetry throttled', { throttleKey, payload });
    }
    return;
  }

  console.log('Stress test telemetry:', payload);
}

/**
 * Create telemetry payload for a stress test run
 * @param runId - Unique run identifier
 * @param archetypeId - Archetype identifier
 * @param statPair - Stat pair being tested
 * @param winRate - Calculated win rate
 * @param synergyMultiplier - Calculated synergy multiplier
 * @param iterations - Number of simulation iterations
 * @param seed - Random seed used
 * @param durationMs - Simulation duration
 * @param config - Test configuration
 * @returns Complete telemetry payload
 */
export function createStressTestPayload(
  runId: string,
  archetypeId: string,
  statPair: string,
  winRate: number,
  synergyMultiplier: number,
  iterations: number,
  seed: number,
  durationMs?: number,
  config?: {
    pointsPerWeight: number;
    simulationCount: number;
    baselineStats: Record<string, number>;
  }
): StressTestTelemetryEventPayload {
  return {
    runId,
    archetypeId,
    statPair,
    winRate,
    synergyMultiplier,
    iterations,
    seed,
    durationMs,
    config,
  };
}

/**
 * Configure stress test telemetry settings
 * @param config - New configuration
 */
export function configureStressTelemetry(config: Partial<StressTelemetryConfig>): void {
  Object.assign(DEFAULT_STRESS_TELEMETRY_CONFIG, config);
  telemetryThrottle.reset();
}

/**
 * Get current stress test telemetry configuration
 * @returns Current configuration
 */
export function getStressTelemetryConfig(): StressTelemetryConfig {
  return { ...DEFAULT_STRESS_TELEMETRY_CONFIG };
}

/**
 * Reset telemetry throttle state (useful for testing)
 */
export function resetStressTelemetryThrottle(): void {
  telemetryThrottle.reset();
}

/**
 * Check if stress test telemetry is enabled
 * @returns True if telemetry is enabled
 */
export function isStressTestTelemetryEnabled(): boolean {
  return DEFAULT_STRESS_TELEMETRY_CONFIG.enabled;
}

/**
 * Enable or disable stress test telemetry
 * @param enabled - Whether to enable telemetry
 */
export function setStressTestTelemetryEnabled(enabled: boolean): void {
  DEFAULT_STRESS_TELEMETRY_CONFIG.enabled = enabled;
}

/**
 * Batch stress test telemetry manager
 * Handles telemetry for multiple runs in a batch
 */
export class StressTestBatchTelemetry {
  private batchId: string;
  private totalRuns: number;
  private completedRuns: number;
  private startTime: number;
  private results: Array<{
    runId: string;
    archetypeId: string;
    statPair: string;
    winRate: number;
    synergyMultiplier: number;
  }> = [];

  constructor(batchId: string, totalRuns: number) {
    this.batchId = batchId;
    this.totalRuns = totalRuns;
    this.completedRuns = 0;
    this.startTime = Date.now();
  }

  /**
   * Record a completed run in the batch
   * @param runId - Run identifier
   * @param archetypeId - Archetype identifier
   * @param statPair - Stat pair being tested
   * @param winRate - Calculated win rate
   * @param synergyMultiplier - Calculated synergy multiplier
   */
  recordCompletedRun(
    runId: string,
    archetypeId: string,
    statPair: string,
    winRate: number,
    synergyMultiplier: number
  ): void {
    this.completedRuns++;
    this.results.push({
      runId,
      archetypeId,
      statPair,
      winRate,
      synergyMultiplier,
    });

    // Emit individual run completed event
    emitStressRunCompleted(
      createStressTestPayload(runId, archetypeId, statPair, winRate, synergyMultiplier, 0, 0)
    );

    // Emit batch completed if all runs are done
    if (this.completedRuns >= this.totalRuns) {
      const durationMs = Date.now() - this.startTime;
      const avgWinRate = this.results.reduce((sum, r) => sum + r.winRate, 0) / this.results.length;
      const avgSynergyMultiplier = this.results.reduce((sum, r) => sum + r.synergyMultiplier, 0) / this.results.length;
      
      // Sort by winRate to get top performers
      const topPerformers = [...this.results]
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, 5);

      emitStressBatchCompleted(
        this.batchId,
        this.totalRuns,
        this.completedRuns,
        durationMs,
        {
          avgWinRate,
          avgSynergyMultiplier,
          topPerformers,
        }
      );
    }
  }

  /**
   * Get batch progress
   * @returns Progress information
   */
  getProgress(): {
    batchId: string;
    totalRuns: number;
    completedRuns: number;
    progress: number;
    estimatedTimeRemaining: number | null;
  } {
    return {
      batchId: this.batchId,
      totalRuns: this.totalRuns,
      completedRuns: this.completedRuns,
      progress: this.totalRuns > 0 ? this.completedRuns / this.totalRuns : 0,
      estimatedTimeRemaining: this.completedRuns > 0 
        ? ((Date.now() - this.startTime) / this.completedRuns) * (this.totalRuns - this.completedRuns)
        : null,
    };
  }
}
