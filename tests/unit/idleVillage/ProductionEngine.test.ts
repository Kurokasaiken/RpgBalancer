// tests/unit/idleVillage/ProductionEngine.test.ts
// Test suite for ProductionEngine config-first calculations

import { describe, it, expect } from 'vitest';
import {
  calculateProduction,
  calculateOptimalWorkers,
  calculateProductionRate,
  DEFAULT_PRODUCTION_SCALING,
  type ProductionWorker,
  type ProductionScalingConfig,
} from '@/engine/game/idleVillage/ProductionEngine';

describe('ProductionEngine', () => {
  const defaultConfig: ProductionScalingConfig = {
    diminishingReturnsFactor: 0.8,
    statMultiplierPerPoint: 0.1,
    applyDiminishingToFirstWorker: false,
    maxStatMultiplier: 3.0,
  };

  describe('calculateProduction', () => {
    it('should calculate production for single worker with stat bonus', () => {
      const workers: ProductionWorker[] = [{ statValue: 5 }];
      const result = calculateProduction(3, workers, defaultConfig);

      // 3 * (1 + 5 * 0.1) = 3 * 1.5 = 4.5 → 4
      expect(result.totalProduction).toBe(4);
      expect(result.workerBreakdown).toHaveLength(1);
      expect(result.workerBreakdown[0].statMultiplier).toBe(1.5);
      expect(result.workerBreakdown[0].diminishingMultiplier).toBe(1.0);
    });

    it('should apply diminishing returns to second worker', () => {
      const workers: ProductionWorker[] = [
        { statValue: 5 },
        { statValue: 3 },
      ];
      const result = calculateProduction(3, workers, defaultConfig);

      // First: 3 * 1.5 * 1.0 = 4.5 → 4
      // Second: 3 * 1.3 * 0.8 = 3.12 → 3
      // Total: 7
      expect(result.totalProduction).toBe(7);
      expect(result.workerBreakdown[0].finalProduction).toBe(4);
      expect(result.workerBreakdown[1].finalProduction).toBe(3);
      expect(result.workerBreakdown[1].diminishingMultiplier).toBe(0.8);
    });

    it('should apply diminishing returns to all workers if configured', () => {
      const config: ProductionScalingConfig = {
        ...defaultConfig,
        applyDiminishingToFirstWorker: true,
      };
      const workers: ProductionWorker[] = [
        { statValue: 5 },
        { statValue: 5 },
      ];
      const result = calculateProduction(3, workers, config);

      // First: 3 * 1.5 * 1.0 = 4.5 → 4
      // Second: 3 * 1.5 * 0.8 = 3.6 → 3
      expect(result.workerBreakdown[0].diminishingMultiplier).toBe(1.0);
      expect(result.workerBreakdown[1].diminishingMultiplier).toBe(0.8);
    });

    it('should cap stat multiplier at maxStatMultiplier', () => {
      const workers: ProductionWorker[] = [{ statValue: 50 }];
      const result = calculateProduction(3, workers, defaultConfig);

      // Without cap: 1 + 50 * 0.1 = 6.0
      // With cap: 3.0
      expect(result.workerBreakdown[0].statMultiplier).toBe(3.0);
      expect(result.workerBreakdown[0].finalProduction).toBe(9); // 3 * 3.0 = 9
    });

    it('should apply individual worker multipliers', () => {
      const workers: ProductionWorker[] = [
        { statValue: 5, individualMultiplier: 1.2 },
      ];
      const result = calculateProduction(3, workers, defaultConfig);

      // 3 * 1.5 * 1.0 * 1.2 = 5.4 → 5
      expect(result.totalProduction).toBe(5);
    });

    it('should apply building multiplier', () => {
      const workers: ProductionWorker[] = [{ statValue: 5 }];
      const result = calculateProduction(3, workers, defaultConfig, 1.5);

      // 3 * 1.5 * 1.0 * 1.5 = 6.75 → 6
      expect(result.totalProduction).toBe(6);
    });

    it('should handle zero workers', () => {
      const workers: ProductionWorker[] = [];
      const result = calculateProduction(3, workers, defaultConfig);

      expect(result.totalProduction).toBe(0);
      expect(result.workerBreakdown).toHaveLength(0);
    });

    it('should match example from plan: 1 woodcutter strength 5', () => {
      const workers: ProductionWorker[] = [{ statValue: 5 }];
      const result = calculateProduction(3, workers, defaultConfig);

      // 3 * (1 + 0.5) = 4.5 → 4
      expect(result.totalProduction).toBe(4);
    });

    it('should match example from plan: 2 woodcutters', () => {
      const workers: ProductionWorker[] = [
        { statValue: 5 },
        { statValue: 5 },
      ];
      const result = calculateProduction(3, workers, defaultConfig);

      // First: 3 * 1.5 = 4.5 → 4
      // Second: 3 * 1.5 * 0.8 = 3.6 → 3
      // Total: 7
      expect(result.totalProduction).toBe(7);
    });
  });

  describe('calculateOptimalWorkers', () => {
    it('should return 1 for single available worker', () => {
      const optimal = calculateOptimalWorkers(3, 1, defaultConfig);
      expect(optimal).toBe(1);
    });

    it('should stop when efficiency drops below threshold', () => {
      // With diminishing 0.8, efficiency drops:
      // Worker 1: 100%
      // Worker 2: 80%
      // Worker 3: 64%
      // Worker 4: 51.2%
      // Worker 5: 40.96% < 50% threshold
      const optimal = calculateOptimalWorkers(3, 10, defaultConfig, 0.5);
      expect(optimal).toBe(4);
    });

    it('should return all workers if all above threshold', () => {
      const optimal = calculateOptimalWorkers(3, 3, defaultConfig, 0.5);
      expect(optimal).toBe(3);
    });

    it('should handle zero available workers', () => {
      const optimal = calculateOptimalWorkers(3, 0, defaultConfig);
      expect(optimal).toBe(0);
    });
  });

  describe('calculateProductionRate', () => {
    it('should calculate per-time-unit rate', () => {
      const workers: ProductionWorker[] = [{ statValue: 5 }];
      const rate = calculateProductionRate(20, workers, defaultConfig, 5);

      // Daily: 20 * 1.5 = 30
      // Per time unit: 30 / 5 = 6
      expect(rate).toBe(6);
    });

    it('should apply building multiplier to rate', () => {
      const workers: ProductionWorker[] = [{ statValue: 5 }];
      const rate = calculateProductionRate(20, workers, defaultConfig, 5, 1.5);

      // Daily: 20 * 1.5 * 1.5 = 45
      // Per time unit: 45 / 5 = 9
      expect(rate).toBe(9);
    });
  });

  describe('DEFAULT_PRODUCTION_SCALING', () => {
    it('should match config values', () => {
      expect(DEFAULT_PRODUCTION_SCALING.diminishingReturnsFactor).toBe(0.8);
      expect(DEFAULT_PRODUCTION_SCALING.statMultiplierPerPoint).toBe(0.1);
      expect(DEFAULT_PRODUCTION_SCALING.applyDiminishingToFirstWorker).toBe(false);
      expect(DEFAULT_PRODUCTION_SCALING.maxStatMultiplier).toBe(3.0);
    });
  });

  describe('edge cases', () => {
    it('should handle very high stat values with cap', () => {
      const workers: ProductionWorker[] = [{ statValue: 1000 }];
      const result = calculateProduction(1, workers, defaultConfig);

      // Should be capped at 3.0
      expect(result.workerBreakdown[0].statMultiplier).toBe(3.0);
      expect(result.totalProduction).toBe(3);
    });

    it('should handle zero base production', () => {
      const workers: ProductionWorker[] = [{ statValue: 5 }];
      const result = calculateProduction(0, workers, defaultConfig);

      expect(result.totalProduction).toBe(0);
    });

    it('should handle negative stat values gracefully', () => {
      const workers: ProductionWorker[] = [{ statValue: -5 }];
      const result = calculateProduction(10, workers, defaultConfig);

      // 10 * (1 + (-5) * 0.1) = 10 * 0.5 = 5
      expect(result.totalProduction).toBe(5);
    });

    it('should handle many workers with diminishing returns', () => {
      const workers: ProductionWorker[] = Array(10).fill({ statValue: 5 });
      const result = calculateProduction(3, workers, defaultConfig);

      // Should have 10 worker breakdowns
      expect(result.workerBreakdown).toHaveLength(10);
      // Total should be less than 10 * 4 due to diminishing
      expect(result.totalProduction).toBeLessThan(40);
      expect(result.totalProduction).toBeGreaterThan(0);
    });
  });
});
