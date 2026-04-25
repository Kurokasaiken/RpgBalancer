// src/engine/game/idleVillage/ProductionEngine.ts
// Config-first production calculation engine for buildings and jobs.
// Implements diminishing returns, stat bonuses, and building multipliers.

import type { ProductionScalingConfig } from '@/balancing/config/idleVillage/types';

/**
 * Worker data for production calculation.
 */
export interface ProductionWorker {
  /** Relevant stat value for this production (e.g., strength for woodcutting) */
  statValue: number;
  /** Optional individual multiplier (e.g., from equipment, buffs) */
  individualMultiplier?: number;
}

/**
 * Result of production calculation.
 */
export interface ProductionResult {
  /** Total production output */
  totalProduction: number;
  /** Per-worker breakdown for telemetry/debugging */
  workerBreakdown: Array<{
    workerIndex: number;
    baseProduction: number;
    statMultiplier: number;
    diminishingMultiplier: number;
    individualMultiplier: number;
    finalProduction: number;
  }>;
  /** Effective stat multiplier applied (capped if maxStatMultiplier is set) */
  effectiveStatMultiplier: number;
}

/**
 * Calculate production output from multiple workers with config-first scaling.
 * 
 * Formula per worker:
 * - statMultiplier = 1 + (statValue * config.statMultiplierPerPoint)
 * - statMultiplier = min(statMultiplier, config.maxStatMultiplier) if cap is set
 * - diminishingMultiplier = config.diminishingReturnsFactor^workerIndex (if enabled)
 * - workerProduction = baseProduction * statMultiplier * diminishingMultiplier * individualMultiplier
 * 
 * @param baseProduction - Base production per worker (e.g., 3 wood)
 * @param workers - Array of workers with their stat values
 * @param config - Production scaling configuration
 * @param buildingMultiplier - Optional building level multiplier (default: 1.0)
 * @returns Production result with total and per-worker breakdown
 * 
 * @example
 * ```typescript
 * const config = {
 *   diminishingReturnsFactor: 0.8,
 *   statMultiplierPerPoint: 0.1,
 *   applyDiminishingToFirstWorker: false,
 *   maxStatMultiplier: 3.0
 * };
 * 
 * const workers = [
 *   { statValue: 5 },  // strength 5
 *   { statValue: 3 }   // strength 3
 * ];
 * 
 * const result = calculateProduction(3, workers, config);
 * // First worker: 3 * 1.5 * 1.0 = 4.5 → 4
 * // Second worker: 3 * 1.3 * 0.8 = 3.12 → 3
 * // Total: 7 wood
 * ```
 */
export function calculateProduction(
  baseProduction: number,
  workers: ProductionWorker[],
  config: ProductionScalingConfig,
  buildingMultiplier = 1.0
): ProductionResult {
  const workerBreakdown: ProductionResult['workerBreakdown'] = [];
  let totalProduction = 0;

  for (let i = 0; i < workers.length; i++) {
    const worker = workers[i];
    
    // Calculate stat multiplier
    let statMultiplier = 1 + (worker.statValue * config.statMultiplierPerPoint);
    
    // Apply cap if configured
    if (config.maxStatMultiplier !== undefined) {
      statMultiplier = Math.min(statMultiplier, config.maxStatMultiplier);
    }
    
    // Calculate diminishing returns multiplier
    let diminishingMultiplier = 1.0;
    if (config.applyDiminishingToFirstWorker) {
      // Apply diminishing to all workers including first
      diminishingMultiplier = Math.pow(config.diminishingReturnsFactor, i);
    } else {
      // First worker gets full output, diminishing starts from second
      if (i > 0) {
        diminishingMultiplier = Math.pow(config.diminishingReturnsFactor, i);
      }
    }
    
    // Individual multiplier (equipment, buffs, etc.)
    const individualMultiplier = worker.individualMultiplier ?? 1.0;
    
    // Calculate final production for this worker
    const workerProduction = 
      baseProduction * 
      statMultiplier * 
      diminishingMultiplier * 
      individualMultiplier * 
      buildingMultiplier;
    
    // Floor to integer (resources are discrete)
    const finalProduction = Math.floor(workerProduction);
    
    workerBreakdown.push({
      workerIndex: i,
      baseProduction,
      statMultiplier,
      diminishingMultiplier,
      individualMultiplier,
      finalProduction,
    });
    
    totalProduction += finalProduction;
  }

  // Calculate effective stat multiplier for telemetry
  const avgStatValue = workers.reduce((sum, w) => sum + w.statValue, 0) / workers.length;
  let effectiveStatMultiplier = 1 + (avgStatValue * config.statMultiplierPerPoint);
  if (config.maxStatMultiplier !== undefined) {
    effectiveStatMultiplier = Math.min(effectiveStatMultiplier, config.maxStatMultiplier);
  }

  return {
    totalProduction,
    workerBreakdown,
    effectiveStatMultiplier,
  };
}

/**
 * Calculate optimal number of workers for a given production activity.
 * Useful for AI/automation to determine when adding more workers is inefficient.
 * 
 * @param baseProduction - Base production per worker
 * @param availableWorkers - Total workers available
 * @param config - Production scaling configuration
 * @param efficiencyThreshold - Minimum efficiency ratio to consider (default: 0.5 = 50%)
 * @returns Optimal number of workers to assign
 * 
 * @example
 * ```typescript
 * const optimal = calculateOptimalWorkers(3, 10, config, 0.5);
 * // Returns 4 if 5th worker would produce <50% of first worker's output
 * ```
 */
export function calculateOptimalWorkers(
  baseProduction: number,
  availableWorkers: number,
  config: ProductionScalingConfig,
  efficiencyThreshold = 0.5
): number {
  if (availableWorkers === 0) return 0;
  
  // Calculate first worker's output as baseline
  const firstWorkerOutput = baseProduction;
  
  for (let workerCount = 1; workerCount <= availableWorkers; workerCount++) {
    // Calculate what the next worker would produce
    const nextWorkerIndex = workerCount; // 0-indexed
    
    let diminishingMultiplier = 1.0;
    if (config.applyDiminishingToFirstWorker) {
      diminishingMultiplier = Math.pow(config.diminishingReturnsFactor, nextWorkerIndex);
    } else {
      if (nextWorkerIndex > 0) {
        diminishingMultiplier = Math.pow(config.diminishingReturnsFactor, nextWorkerIndex);
      }
    }
    
    const nextWorkerOutput = baseProduction * diminishingMultiplier;
    const efficiency = nextWorkerOutput / firstWorkerOutput;
    
    // If next worker would be below threshold, return current count
    if (efficiency < efficiencyThreshold) {
      return workerCount;
    }
  }
  
  // All workers are above threshold
  return availableWorkers;
}

/**
 * Calculate production rate per time unit (for continuous jobs).
 * 
 * @param baseProductionPerDay - Base production per in-game day
 * @param workers - Array of workers
 * @param config - Production scaling configuration
 * @param timeUnitsPerDay - Time units in one day (from globalRules)
 * @param buildingMultiplier - Optional building level multiplier
 * @returns Production per time unit
 */
export function calculateProductionRate(
  baseProductionPerDay: number,
  workers: ProductionWorker[],
  config: ProductionScalingConfig,
  timeUnitsPerDay: number,
  buildingMultiplier = 1.0
): number {
  const dailyResult = calculateProduction(
    baseProductionPerDay,
    workers,
    config,
    buildingMultiplier
  );
  
  return dailyResult.totalProduction / timeUnitsPerDay;
}

/**
 * Default production scaling config for fallback.
 */
export const DEFAULT_PRODUCTION_SCALING: ProductionScalingConfig = {
  diminishingReturnsFactor: 0.8,
  statMultiplierPerPoint: 0.1,
  applyDiminishingToFirstWorker: false,
  maxStatMultiplier: 3.0,
};
