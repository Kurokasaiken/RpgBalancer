/**
 * Performance Budget Tests
 *
 * Unit tests for performance budget monitoring and gating logic.
 */

import { PerformanceBudgetMonitor, createPerformanceBudgetMonitor, DEFAULT_PERFORMANCE_BUDGET } from '@/ui/styleLab/physicsLab/utils/perfBudget';

describe('PerformanceBudgetMonitor', () => {
  let monitor: PerformanceBudgetMonitor;

  beforeEach(() => {
    monitor = new PerformanceBudgetMonitor();
  });

  describe('Initialization', () => {
    it('should initialize with default budget', () => {
      const state = monitor.getState();
      
      expect(state.current.fps).toBe(0);
      expect(state.current.cpuMs).toBe(0);
      expect(state.current.audioConcurrency).toBe(0);
      expect(state.current.hapticConcurrency).toBe(0);
      expect(state.history).toHaveLength(0);
      expect(state.isBlocked).toBe(false);
      expect(state.blockReason).toBe(null);
      expect(state.blockStartedAt).toBe(null);
    });

    it('should accept custom budget configuration', () => {
      const customBudget = {
        minFps: 30,
        maxCpuMs: 16,
        blockDurationSeconds: 5,
      };
      
      const customMonitor = new PerformanceBudgetMonitor(customBudget);
      const summary = customMonitor.getSummary();
      
      expect(summary.fps.target).toBe(30);
      expect(summary.cpu.target).toBe(16);
      expect(summary.block.budgetDuration).toBe(5);
    });
  });

  describe('Metrics tracking', () => {
    it('should update FPS metrics', () => {
      monitor.updateMetrics({ fps: 60 });
      
      const state = monitor.getState();
      expect(state.current.fps).toBe(60);
      expect(state.history).toHaveLength(1);
      expect(state.history[0].fps).toBe(60);
    });

    it('should update CPU metrics', () => {
      monitor.updateMetrics({ cpuMs: 5.5 });
      
      const state = monitor.getState();
      expect(state.current.cpuMs).toBe(5.5);
      expect(state.history).toHaveLength(1);
      expect(state.history[0].cpuMs).toBe(5.5);
    });

    it('should update concurrency metrics', () => {
      monitor.updateMetrics({ 
        audioConcurrency: 3,
        hapticConcurrency: 1 
      });
      
      const state = monitor.getState();
      expect(state.current.audioConcurrency).toBe(3);
      expect(state.current.hapticConcurrency).toBe(1);
    });

    it('should update memory metrics', () => {
      const memory = {
        usedJSHeapSize: 1024 * 1024 * 10, // 10MB
        totalJSHeapSize: 1024 * 1024 * 50, // 50MB
        jsHeapSizeLimit: 1024 * 1024 * 100, // 100MB
      };
      
      monitor.updateMetrics({ memory });
      
      const state = monitor.getState();
      expect(state.current.memory).toEqual(memory);
    });

    it('should maintain history limit', () => {
      // Add more than 100 metrics
      for (let i = 0; i < 150; i++) {
        monitor.updateMetrics({ fps: 60 + i });
      }
      
      const state = monitor.getState();
      expect(state.history).toHaveLength(100);
      expect(state.history[0].fps).toBe(60 + 50); // First item in history
      expect(state.history[99].fps).toBe(60 + 149); // Last item in history
    });
  });

  describe('Budget enforcement', () => {
    it('should block when FPS drops below threshold', () => {
      // Add several low FPS readings to trigger median calculation
      for (let i = 0; i < 5; i++) {
        monitor.updateMetrics({ fps: 45 }); // Below 60 FPS threshold
      }
      
      const state = monitor.getState();
      expect(state.isBlocked).toBe(true);
      expect(state.blockReason).toBe('low_fps');
      expect(state.blockStartedAt).toBeTruthy();
    });

    it('should block when CPU exceeds threshold', () => {
      // Add several high CPU readings
      for (let i = 0; i < 5; i++) {
        monitor.updateMetrics({ cpuMs: 12 }); // Above 8ms threshold
      }
      
      const state = monitor.getState();
      expect(state.isBlocked).toBe(true);
      expect(state.blockReason).toBe('high_cpu');
      expect(state.blockStartedAt).toBeTruthy();
    });

    it('should unblock when metrics return to acceptable levels', () => {
      // Trigger block
      for (let i = 0; i < 5; i++) {
        monitor.updateMetrics({ fps: 45 });
      }
      
      expect(monitor.getState().isBlocked).toBe(true);
      
      // Return to acceptable levels
      for (let i = 0; i < 5; i++) {
        monitor.updateMetrics({ fps: 75 });
      }
      
      const state = monitor.getState();
      expect(state.isBlocked).toBe(false);
      expect(state.blockReason).toBe(null);
      expect(state.blockStartedAt).toBe(null);
    });

    it('should handle concurrent FPS and CPU violations', () => {
      // Add both FPS and CPU violations
      for (let i = 0; i < 5; i++) {
        monitor.updateMetrics({ fps: 45, cpuMs: 12 });
      }
      
      const state = monitor.getState();
      expect(state.isBlocked).toBe(true);
      expect(state.blockReason).toBe('low_fps'); // FPS checked first
    });
  });

  describe('Export gating', () => {
    beforeEach(() => {
      // Mock Date.now for consistent testing
      const mockDate = new Date('2023-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should allow export when not blocked', () => {
      const result = monitor.shouldBlockExport();
      
      expect(result.blocked).toBe(false);
      expect(result.reason).toBe(null);
      expect(result.durationSeconds).toBe(0);
    });

    it('should block export when recently blocked', () => {
      // Trigger block
      for (let i = 0; i < 5; i++) {
        monitor.updateMetrics({ fps: 45 });
      }
      
      const result = monitor.shouldBlockExport();
      
      expect(result.blocked).toBe(true);
      expect(result.reason).toBe('low_fps');
      expect(result.durationSeconds).toBe(0);
    });

    it('should allow export after block duration expires', () => {
      // Trigger block
      for (let i = 0; i < 5; i++) {
        monitor.updateMetrics({ fps: 45 });
      }
      
      // Advance time past block duration
      const futureDate = new Date('2023-01-01T00:00:04.000Z'); // 4 seconds later
      jest.spyOn(global, 'Date').mockImplementation(() => futureDate);
      
      const result = monitor.shouldBlockExport();
      
      expect(result.blocked).toBe(false);
      expect(result.reason).toBe('low_fps'); // Reason preserved
      expect(result.durationSeconds).toBeGreaterThan(3); // Duration exceeded
    });
  });

  describe('Summary generation', () => {
    it('should generate comprehensive summary', () => {
      // Add some metrics
      monitor.updateMetrics({ fps: 60, cpuMs: 5, audioConcurrency: 2, hapticConcurrency: 1 });
      monitor.updateMetrics({ fps: 55, cpuMs: 7, audioConcurrency: 3, hapticConcurrency: 1 });
      monitor.updateMetrics({ fps: 65, cpuMs: 4, audioConcurrency: 1, hapticConcurrency: 0 });
      
      const summary = monitor.getSummary();
      
      expect(summary.fps.current).toBe(65);
      expect(summary.fps.median).toBe(60);
      expect(summary.fps.target).toBe(60);
      expect(summary.fps.status).toBe('good');
      
      expect(summary.cpu.current).toBe(4);
      expect(summary.cpu.median).toBe(5);
      expect(summary.cpu.target).toBe(8);
      expect(summary.cpu.status).toBe('good');
      
      expect(summary.concurrency.audio.current).toBe(1);
      expect(summary.concurrency.audio.max).toBe(4);
      expect(summary.concurrency.audio.status).toBe('good');
      
      expect(summary.concurrency.haptic.current).toBe(0);
      expect(summary.concurrency.haptic.max).toBe(2);
      expect(summary.concurrency.haptic.status).toBe('good');
      
      expect(summary.block.blocked).toBe(false);
      expect(summary.block.reason).toBe(null);
      expect(summary.block.durationSeconds).toBe(0);
      expect(summary.block.budgetDuration).toBe(3);
    });

    it('should show poor status for failing metrics', () => {
      // Add poor metrics
      for (let i = 0; i < 5; i++) {
        monitor.updateMetrics({ fps: 45, cpuMs: 12 });
      }
      
      const summary = monitor.getSummary();
      
      expect(summary.fps.status).toBe('poor');
      expect(summary.cpu.status).toBe('poor');
      expect(summary.block.blocked).toBe(true);
    });

    it('should show warning status for high concurrency', () => {
      monitor.updateMetrics({ audioConcurrency: 5, hapticConcurrency: 3 });
      
      const summary = monitor.getSummary();
      
      expect(summary.concurrency.audio.status).toBe('warning');
      expect(summary.concurrency.haptic.status).toBe('warning');
    });
  });

  describe('State subscriptions', () => {
    it('should notify subscribers of state changes', () => {
      const callback = jest.fn();
      monitor.subscribe(callback);
      
      monitor.updateMetrics({ fps: 60 });
      
      expect(callback).toHaveBeenCalledWith(monitor.getState());
    });

    it('should allow unsubscribing', () => {
      const callback = jest.fn();
      const unsubscribe = monitor.subscribe(callback);
      
      unsubscribe();
      monitor.updateMetrics({ fps: 60 });
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      monitor.subscribe(callback1);
      monitor.subscribe(callback2);
      
      monitor.updateMetrics({ fps: 60 });
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('Reset functionality', () => {
    it('should reset all state', () => {
      // Add metrics and trigger block
      for (let i = 0; i < 5; i++) {
        monitor.updateMetrics({ fps: 45 });
      }
      
      expect(monitor.getState().isBlocked).toBe(true);
      expect(monitor.getState().history).toHaveLength(5);
      
      monitor.reset();
      
      const state = monitor.getState();
      expect(state.isBlocked).toBe(false);
      expect(state.blockReason).toBe(null);
      expect(state.blockStartedAt).toBe(null);
      expect(state.history).toHaveLength(0);
      expect(state.current.fps).toBe(0);
      expect(state.current.cpuMs).toBe(0);
    });

    it('should notify subscribers on reset', () => {
      const callback = jest.fn();
      monitor.subscribe(callback);
      
      monitor.reset();
      
      expect(callback).toHaveBeenCalledWith(monitor.getState());
    });
  });
});

describe('createPerformanceBudgetMonitor', () => {
  it('should create monitor with default budget', () => {
    const monitor = createPerformanceBudgetMonitor();
    const summary = monitor.getSummary();
    
    expect(summary.fps.target).toBe(DEFAULT_PERFORMANCE_BUDGET.minFps);
    expect(summary.cpu.target).toBe(DEFAULT_PERFORMANCE_BUDGET.maxCpuMs);
    expect(summary.block.budgetDuration).toBe(DEFAULT_PERFORMANCE_BUDGET.blockDurationSeconds);
  });

  it('should create monitor with custom budget', () => {
    const customBudget = {
      minFps: 30,
      maxCpuMs: 16,
      blockDurationSeconds: 5,
    };
    
    const monitor = createPerformanceBudgetMonitor(customBudget);
    const summary = monitor.getSummary();
    
    expect(summary.fps.target).toBe(30);
    expect(summary.cpu.target).toBe(16);
    expect(summary.block.budgetDuration).toBe(5);
  });
});
