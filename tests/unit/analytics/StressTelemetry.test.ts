/**
 * Stress Test Telemetry Unit Tests
 * 
 * Tests for stress test telemetry emission, validation, and throttling.
 * Covers payload validation, event emission, and batch telemetry.
 * 
 * @module StressTelemetryTests
 * @since 2026-01-11
 * @author Spectrum-Telemetry
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateStressTestPayload,
  createStressTestRunId,
  emitStressRunCompleted,
  emitStressRunFailed,
  emitStressBatchCompleted,
  createStressTestPayload,
  configureStressTelemetry,
  getStressTelemetryConfig,
  resetStressTelemetryThrottle,
  isStressTestTelemetryEnabled,
  setStressTestTelemetryEnabled,
  createStressTestContext,
  StressTestBatchTelemetry,
  type StressTestTelemetryEventPayload
} from '@/balancing/stressTesting/StressTelemetry';
import { reportStressTestTelemetry } from '@/analytics/telemetry/telemetryProvider';

// Mock the analytics module
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  reportStressTestTelemetry: vi.fn(),
}));

describe('StressTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStressTelemetryThrottle();
    // Reset to default config
    configureStressTelemetry({
      enabled: true,
      throttleMs: 1000,
      debug: false,
    });
  });

  describe('validateStressTestPayload', () => {
    it('should validate a complete valid payload', () => {
      const payload: StressTestTelemetryEventPayload = {
        runId: 'test-run-123',
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
        seed: 12345,
      };

      expect(validateStressTestPayload(payload)).toBe(true);
    });

    it('should reject payload with missing runId', () => {
      const payload = {
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
        seed: 12345,
      } as StressTestTelemetryEventPayload;

      expect(validateStressTestPayload(payload)).toBe(false);
    });

    it('should reject payload with invalid winRate', () => {
      const payload: StressTestTelemetryEventPayload = {
        runId: 'test-run-123',
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 1.5, // Invalid: > 1
        synergyMultiplier: 1.2,
        iterations: 10000,
        seed: 12345,
      };

      expect(validateStressTestPayload(payload)).toBe(false);
    });

    it('should reject payload with negative iterations', () => {
      const payload: StressTestTelemetryEventPayload = {
        runId: 'test-run-123',
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: -100, // Invalid: negative
        seed: 12345,
      };

      expect(validateStressTestPayload(payload)).toBe(false);
    });

    it('should reject payload with negative seed', () => {
      const payload: StressTestTelemetryEventPayload = {
        runId: 'test-run-123',
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
        seed: -1, // Invalid: negative
      };

      expect(validateStressTestPayload(payload)).toBe(false);
    });

    it('should reject null payload', () => {
      expect(validateStressTestPayload(null)).toBe(false);
      expect(validateStressTestPayload(undefined)).toBe(false);
    });

    it('should accept payload with optional fields', () => {
      const payload: StressTestTelemetryEventPayload = {
        runId: 'test-run-123',
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
        seed: 12345,
        durationMs: 5000,
        config: {
          pointsPerWeight: 25,
          simulationCount: 10000,
          baselineStats: { hp: 100, damage: 10 },
        },
      };

      expect(validateStressTestPayload(payload)).toBe(true);
    });
  });

  describe('createStressTestRunId', () => {
    it('should create a unique run ID with timestamp', () => {
      const runId = createStressTestRunId('archetype-001', 'hp+damage', 12345);
      
      expect(runId).toMatch(/^stress-archetype-001-hp\+damage-12345-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    });

    it('should create different IDs for different parameters', () => {
      const runId1 = createStressTestRunId('archetype-001', 'hp+damage', 12345);
      const runId2 = createStressTestRunId('archetype-002', 'hp+damage', 12345);
      
      expect(runId1).not.toBe(runId2);
    });

    it('should handle special characters in stat pair', () => {
      const runId = createStressTestRunId('archetype-001', 'hp+speed', 12345);
      
      expect(runId).toContain('hp+speed');
    });
  });

  describe('emitStressRunCompleted', () => {
    it('should emit telemetry for valid payload', () => {
      const payload: StressTestTelemetryEventPayload = {
        runId: 'test-run-123',
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
        seed: 12345,
      };

      emitStressRunCompleted(payload);

      expect(reportStressTestTelemetry).toHaveBeenCalledWith('stress_run_completed', payload);
    });

    it('should not emit telemetry for invalid payload', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const invalidPayload = {
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
        seed: 12345,
      } as StressTestTelemetryEventPayload;

      emitStressRunCompleted(invalidPayload);

      expect(reportStressTestTelemetry).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Invalid stress test telemetry payload, skipping emission', invalidPayload);
      
      consoleSpy.mockRestore();
    });

    it('should throttle repeated emissions', () => {
      const payload: StressTestTelemetryEventPayload = {
        runId: 'test-run-123',
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
        seed: 12345,
      };

      // Configure short throttle for testing
      configureStressTelemetry({ throttleMs: 100 });

      emitStressRunCompleted(payload);
      expect(reportStressTestTelemetry).toHaveBeenCalledTimes(1);

      emitStressRunCompleted(payload);
      expect(reportStressTestTelemetry).toHaveBeenCalledTimes(1); // Still 1 due to throttling
    });
  });

  describe('emitStressRunFailed', () => {
    it('should emit telemetry for failed run with error details', () => {
      const payload: Omit<StressTestTelemetryEventPayload, 'error'> = {
        runId: 'test-run-123',
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0,
        synergyMultiplier: 0,
        iterations: 0,
        seed: 12345,
      };

      const error = new Error('Simulation failed');

      emitStressRunFailed(payload, error);

      expect(reportStressTestTelemetry).toHaveBeenCalledWith('stress_run_failed', {
        ...payload,
        error: {
          message: 'Simulation failed',
          stack: error.stack,
        },
      });
    });
  });

  describe('emitStressBatchCompleted', () => {
    it('should emit telemetry for completed batch', () => {
      emitStressBatchCompleted(
        'batch-001',
        10,
        10,
        5000,
        {
          avgWinRate: 0.75,
          avgSynergyMultiplier: 1.1,
          topPerformers: [
            {
              archetypeId: 'archetype-001',
              statPair: 'hp+damage',
              winRate: 0.85,
              synergyMultiplier: 1.3,
            },
          ],
        }
      );

      expect(reportStressTestTelemetry).toHaveBeenCalledWith('stress_batch_completed', {
        runId: 'batch-batch-001',
        archetypeId: 'batch',
        statPair: 'multiple',
        winRate: 0.75,
        synergyMultiplier: 1.1,
        iterations: 10,
        seed: 0,
        durationMs: 5000,
        batchInfo: {
          batchId: 'batch-001',
          totalRuns: 10,
          currentRun: 10,
        },
      });
    });
  });

  describe('createStressTestPayload', () => {
    it('should create a complete payload', () => {
      const payload = createStressTestPayload(
        'run-123',
        'archetype-001',
        'hp+damage',
        0.75,
        1.2,
        10000,
        12345,
        5000,
        {
          pointsPerWeight: 25,
          simulationCount: 10000,
          baselineStats: { hp: 100, damage: 10 },
        }
      );

      expect(payload).toEqual({
        runId: 'run-123',
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
        seed: 12345,
        durationMs: 5000,
        config: {
          pointsPerWeight: 25,
          simulationCount: 10000,
          baselineStats: { hp: 100, damage: 10 },
        },
      });
    });

    it('should create minimal payload without optional fields', () => {
      const payload = createStressTestPayload(
        'run-123',
        'archetype-001',
        'hp+damage',
        0.75,
        1.2,
        10000,
        12345
      );

      expect(payload).toEqual({
        runId: 'run-123',
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
        seed: 12345,
      });
    });
  });

  describe('Telemetry Configuration', () => {
    it('should get current configuration', () => {
      const config = getStressTelemetryConfig();
      
      expect(config).toEqual({
        enabled: true,
        throttleMs: 1000,
        debug: false,
      });
    });

    it('should update configuration', () => {
      configureStressTelemetry({
        enabled: false,
        throttleMs: 500,
        debug: true,
      });

      const config = getStressTelemetryConfig();
      
      expect(config).toEqual({
        enabled: false,
        throttleMs: 500,
        debug: true,
      });
    });

    it('should check if telemetry is enabled', () => {
      expect(isStressTestTelemetryEnabled()).toBe(true);
      
      setStressTestTelemetryEnabled(false);
      expect(isStressTestTelemetryEnabled()).toBe(false);
      
      setStressTestTelemetryEnabled(true);
      expect(isStressTestTelemetryEnabled()).toBe(true);
    });

    it('should not emit when telemetry is disabled', () => {
      setStressTestTelemetryEnabled(false);
      
      const payload: StressTestTelemetryEventPayload = {
        runId: 'test-run-123',
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
        seed: 12345,
      };

      emitStressRunCompleted(payload);

      expect(reportStressTestTelemetry).not.toHaveBeenCalled();
    });
  });

  describe('createStressTestContext', () => {
    it('should create a telemetry context with emit functions', () => {
      const context = createStressTestContext('archetype-001', 'hp+damage', 12345);
      
      expect(context).toHaveProperty('runId');
      expect(context).toHaveProperty('emitCompleted');
      expect(context).toHaveProperty('emitFailed');
      expect(context.runId).toMatch(/^stress-archetype-001-hp\+damage-12345-/);
    });

    it('should emit completed event through context', () => {
      const context = createStressTestContext('archetype-001', 'hp+damage', 12345);
      
      context.emitCompleted({
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
      });

      expect(reportStressTestTelemetry).toHaveBeenCalledWith('stress_run_completed', {
        runId: context.runId,
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        seed: 12345,
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
      });
    });

    it('should emit failed event through context', () => {
      const context = createStressTestContext('archetype-001', 'hp+damage', 12345);
      const error = new Error('Test error');
      
      context.emitFailed({
        winRate: 0,
        synergyMultiplier: 0,
        iterations: 0,
      }, error);

      expect(reportStressTestTelemetry).toHaveBeenCalledWith('stress_run_failed', {
        runId: context.runId,
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        seed: 12345,
        winRate: 0,
        synergyMultiplier: 0,
        iterations: 0,
        error: {
          message: 'Test error',
          stack: error.stack,
        },
      });
    });
  });

  describe('StressTestBatchTelemetry', () => {
    it('should create batch telemetry manager', () => {
      const batch = new StressTestBatchTelemetry('batch-001', 5);
      
      expect(batch.getProgress()).toEqual({
        batchId: 'batch-001',
        totalRuns: 5,
        completedRuns: 0,
        progress: 0,
        estimatedTimeRemaining: null,
      });
    });

    it('should record completed runs and emit batch telemetry when complete', () => {
      const batch = new StressTestBatchTelemetry('batch-001', 2);
      
      // Record first run
      batch.recordCompletedRun('run-1', 'archetype-001', 'hp+damage', 0.75, 1.2);
      
      expect(batch.getProgress().completedRuns).toBe(1);
      expect(batch.getProgress().progress).toBe(0.5);
      
      // Record second run (should trigger batch completion)
      batch.recordCompletedRun('run-2', 'archetype-002', 'hp+speed', 0.65, 1.1);
      
      // Should emit batch completion
      expect(reportStressTestTelemetry).toHaveBeenCalledWith('stress_batch_completed', expect.objectContaining({
        runId: 'batch-batch-001',
        archetypeId: 'batch',
        statPair: 'multiple',
        batchInfo: {
          batchId: 'batch-001',
          totalRuns: 2,
          currentRun: 2,
        },
      }));
    });

    it('should calculate average statistics correctly', () => {
      const batch = new StressTestBatchTelemetry('batch-001', 3);
      
      batch.recordCompletedRun('run-1', 'archetype-001', 'hp+damage', 0.75, 1.2);
      batch.recordCompletedRun('run-2', 'archetype-002', 'hp+speed', 0.65, 1.1);
      batch.recordCompletedRun('run-3', 'archetype-003', 'damage+speed', 0.85, 1.3);
      
      // Check the emitted batch completion event
      const batchCall = (reportStressTestTelemetry as any).mock.calls.find(call => call[0] === 'stress_batch_completed');
      const payload = batchCall[1];
      
      expect(payload.winRate).toBeCloseTo(0.75, 2); // (0.75 + 0.65 + 0.85) / 3
      expect(payload.synergyMultiplier).toBeCloseTo(1.2, 2); // (1.2 + 1.1 + 1.3) / 3
    });

    it('should identify top performers correctly', () => {
      const batch = new StressTestBatchTelemetry('batch-001', 3);
      
      batch.recordCompletedRun('run-1', 'archetype-001', 'hp+damage', 0.75, 1.2);
      batch.recordCompletedRun('run-2', 'archetype-002', 'hp+speed', 0.85, 1.3); // Best win rate
      batch.recordCompletedRun('run-3', 'archetype-003', 'damage+speed', 0.65, 1.1);
      
      const batchCall = (reportStressTestTelemetry as any).mock.calls.find(call => call[0] === 'stress_batch_completed');
      const payload = batchCall[1];
      
      expect(payload.results.topPerformers[0]).toEqual({
        archetypeId: 'archetype-002',
        statPair: 'hp+speed',
        winRate: 0.85,
        synergyMultiplier: 1.3,
      });
    });

    it('should estimate time remaining after some runs', () => {
      const batch = new StressTestBatchTelemetry('batch-001', 2);
      
      // Simulate some time passing
      vi.useFakeTimers();
      vi.advanceTimersBy(1000);
      
      batch.recordCompletedRun('run-1', 'archetype-001', 'hp+damage', 0.75, 1.2);
      
      const progress = batch.getProgress();
      expect(progress.estimatedTimeRemaining).toBe(1000); // Same as first run
      
      vi.useRealTimers();
    });
  });

  describe('Throttling Behavior', () => {
    it('should reset throttle state', () => {
      const payload: StressTestTelemetryEventPayload = {
        runId: 'test-run-123',
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
        seed: 12345,
      };

      // Configure short throttle
      configureStressTelemetry({ throttleMs: 50 });

      emitStressRunCompleted(payload);
      expect(reportStressTestTelemetry).toHaveBeenCalledTimes(1);

      emitStressRunCompleted(payload);
      expect(reportStressTestTelemetry).toHaveBeenCalledTimes(1); // Throttled

      // Reset throttle
      resetStressTelemetryThrottle();

      emitStressRunCompleted(payload);
      expect(reportStressTestTelemetry).toHaveBeenCalledTimes(2); // Should work now
    });

    it('should throttle different event types separately', () => {
      const payload: StressTestTelemetryEventPayload = {
        runId: 'test-run-123',
        archetypeId: 'archetype-001',
        statPair: 'hp+damage',
        winRate: 0.75,
        synergyMultiplier: 1.2,
        iterations: 10000,
        seed: 12345,
      };

      configureStressTelemetry({ throttleMs: 50 });

      emitStressRunCompleted(payload);
      emitStressRunFailed(payload, new Error('Test error'));

      expect(reportStressTestTelemetry).toHaveBeenCalledTimes(2); // Both should work (different throttle keys)
    });
  });
});
