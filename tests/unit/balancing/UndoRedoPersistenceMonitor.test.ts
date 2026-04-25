/**
 * Undo/Redo Persistence Monitor Tests
 * 
 * Unit tests for the undo/redo persistence monitoring system.
 * Tests integrity checking, metrics collection, and configuration.
 * 
 * @since 2026-01-19
 * @author Sentinel-Balancer – Persistence Monitor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UndoRedoPersistenceMonitor } from '@/balancing/monitoring/UndoRedoPersistenceMonitor';
import { BalancerConfigStore } from '@/balancing/config/BalancerConfigStore';
import type { UndoRedoMonitorConfig, IntegrityIssue } from '@/balancing/monitoring/undoRedoMonitorSchema';

// Mock BalancerConfigStore
vi.mock('@/balancing/config/BalancerConfigStore', () => ({
  BalancerConfigStore: {
    getHistory: vi.fn(),
    getCurrentConfigSnapshot: vi.fn(),
  },
}));

describe('UndoRedoPersistenceMonitor', () => {
  let monitor: UndoRedoPersistenceMonitor;
  let mockGetHistory: any;
  let mockGetCurrentConfigSnapshot: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Get mocked functions
    mockGetHistory = (BalancerConfigStore.getHistory as any);
    mockGetCurrentConfigSnapshot = (BalancerConfigStore.getCurrentConfigSnapshot as any);
    
    // Default mock implementations
    mockGetHistory.mockReturnValue([]);
    mockGetCurrentConfigSnapshot.mockReturnValue({
      version: '1.0.0',
      stats: {},
      cards: {},
      presets: {},
      activePresetId: 'default',
      targetTurns: {},
      scenarioBudget: {},
    });

    monitor = new UndoRedoPersistenceMonitor();
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const state = monitor.getState();
      
      expect(state.isMonitoring).toBe(false);
      expect(state.metrics.undoCount).toBe(0);
      expect(state.metrics.redoCount).toBe(0);
      expect(state.config.maxHistoryDepth).toBe(10);
      expect(state.config.checksumAlgorithm).toBe('simple');
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<UndoRedoMonitorConfig> = {
        maxHistoryDepth: 20,
        checksumAlgorithm: 'sha256',
        enableAutoRecovery: true,
      };

      const customMonitor = new UndoRedoPersistenceMonitor(customConfig);
      const state = customMonitor.getState();

      expect(state.config.maxHistoryDepth).toBe(20);
      expect(state.config.checksumAlgorithm).toBe('sha256');
      expect(state.config.enableAutoRecovery).toBe(true);
    });
  });

  describe('Monitoring Lifecycle', () => {
    it('should start and stop monitoring', () => {
      expect(monitor.getState().isMonitoring).toBe(false);
      
      monitor.startMonitoring();
      expect(monitor.getState().isMonitoring).toBe(true);
      expect(monitor.getState().startedAt).toBeDefined();
      
      monitor.stopMonitoring();
      expect(monitor.getState().isMonitoring).toBe(false);
    });

    it('should handle multiple start calls gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      monitor.startMonitoring();
      monitor.startMonitoring(); // Second call
      
      expect(consoleSpy).toHaveBeenCalledWith('[UndoRedoMonitor] Already monitoring');
      
      consoleSpy.mockRestore();
    });

    it('should handle stop when not monitoring', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      monitor.stopMonitoring();
      
      expect(consoleSpy).toHaveBeenCalledWith('[UndoRedoMonitor] Not monitoring');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Operation Recording', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should record undo operations', () => {
      monitor.startOperation();
      monitor.recordOperation('undo', true);
      
      const metrics = monitor.getMetrics();
      expect(metrics.undoCount).toBe(1);
      expect(metrics.redoCount).toBe(0);
    });

    it('should record redo operations', () => {
      monitor.startOperation();
      monitor.recordOperation('redo', true);
      
      const metrics = monitor.getMetrics();
      expect(metrics.undoCount).toBe(0);
      expect(metrics.redoCount).toBe(1);
    });

    it('should record failed operations', () => {
      monitor.startOperation();
      monitor.recordOperation('undo', false, 'Test error');
      
      const history = monitor.getOperationHistory();
      expect(history).toHaveLength(1);
      expect(history[0].success).toBe(false);
      expect(history[0].error).toBe('Test error');
    });

    it('should update average times', () => {
      // First operation
      monitor.startOperation();
      setTimeout(() => monitor.recordOperation('undo', true), 10);
      
      // Second operation
      monitor.startOperation();
      setTimeout(() => monitor.recordOperation('undo', true), 20);
      
      // Wait for operations to complete
      setTimeout(() => {
        const metrics = monitor.getMetrics();
        expect(metrics.avgUndoTime).toBeGreaterThan(0);
      }, 50);
    });

    it('should not record when not monitoring', () => {
      monitor.stopMonitoring();
      monitor.recordOperation('undo', true);
      
      const history = monitor.getOperationHistory();
      expect(history).toHaveLength(0);
    });

    it('should limit operation history size', () => {
      // Add more than 100 operations
      for (let i = 0; i < 150; i++) {
        monitor.recordOperation('undo', true);
      }
      
      const history = monitor.getOperationHistory();
      expect(history).toHaveLength(100);
    });
  });

  describe('Integrity Checking', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should pass integrity check with valid data', async () => {
      mockGetHistory.mockReturnValue([
        {
          timestamp: Date.now() - 1000,
          config: { version: '1.0.0', stats: {}, cards: {}, presets: {} },
          description: 'Test snapshot',
        },
      ]);

      const result = await monitor.performIntegrityCheck();
      
      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.snapshotsAnalyzed).toBe(1);
      expect(result.currentChecksum).toBeDefined();
    });

    it('should detect missing current config', async () => {
      mockGetCurrentConfigSnapshot.mockReturnValue(null);
      
      const result = await monitor.performIntegrityCheck();
      
      expect(result.passed).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('data_corruption');
      expect(result.issues[0].severity).toBe('critical');
    });

    it('should detect excessive history depth', async () => {
      const deepHistory = Array.from({ length: 15 }, (_, i) => ({
        timestamp: Date.now() - (i * 1000),
        config: { version: '1.0.0', stats: {}, cards: {}, presets: {} },
        description: `Snapshot ${i}`,
      }));
      
      mockGetHistory.mockReturnValue(deepHistory);
      
      const result = await monitor.performIntegrityCheck();
      
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.type === 'history_depth_exceeded')).toBe(true);
    });

    it('should detect invalid timestamps', async () => {
      const invalidHistory = [
        {
          timestamp: -1, // Invalid timestamp
          config: { version: '1.0.0', stats: {}, cards: {}, presets: {} },
          description: 'Invalid snapshot',
        },
        {
          timestamp: Date.now() + 1000000, // Future timestamp
          config: { version: '1.0.0', stats: {}, cards: {}, presets: {} },
          description: 'Future snapshot',
        },
      ];
      
      mockGetHistory.mockReturnValue(invalidHistory);
      
      const result = await monitor.performIntegrityCheck();
      
      expect(result.passed).toBe(false);
      expect(result.issues.filter(i => i.type === 'timestamp_invalid')).toHaveLength(2);
    });

    it('should detect invalid snapshot structure', async () => {
      const invalidHistory = [
        {
          timestamp: Date.now(),
          config: null, // Missing config
          description: 'Invalid snapshot',
        },
        {
          timestamp: Date.now(),
          config: { version: '1.0.0', stats: {}, cards: {}, presets: {} },
          // Missing description
        },
      ];
      
      mockGetHistory.mockReturnValue(invalidHistory);
      
      const result = await monitor.performIntegrityCheck();
      
      expect(result.passed).toBe(false);
      expect(result.issues.filter(i => i.type === 'structure_invalid')).toHaveLength(2);
    });

    it('should detect large data size', async () => {
      const largeConfig = {
        version: '1.0.0',
        stats: {},
        cards: {},
        presets: {},
        // Add large data to exceed warning threshold
        largeData: 'x'.repeat(2 * 1024 * 1024), // 2MB
      };
      
      mockGetCurrentConfigSnapshot.mockReturnValue(largeConfig);
      
      const result = await monitor.performIntegrityCheck();
      
      expect(result.issues.some(i => i.type === 'storage_failure')).toBe(true);
      expect(result.recommendations.some(r => r.includes('data cleanup'))).toBe(true);
    });

    it('should handle integrity check errors gracefully', async () => {
      mockGetHistory.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const result = await monitor.performIntegrityCheck();
      
      expect(result.passed).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('storage_failure');
      expect(result.issues[0].severity).toBe('critical');
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig: Partial<UndoRedoMonitorConfig> = {
        maxHistoryDepth: 25,
        checksumAlgorithm: 'md5',
      };
      
      monitor.updateConfig(newConfig);
      
      const state = monitor.getState();
      expect(state.config.maxHistoryDepth).toBe(25);
      expect(state.config.checksumAlgorithm).toBe('md5');
    });

    it('should restart integrity check timer when interval changes', () => {
      monitor.startMonitoring();
      
      const initialConfig = monitor.getState().config;
      expect(initialConfig.integrityCheckInterval).toBe(0);
      
      monitor.updateConfig({ integrityCheckInterval: 5000 });
      
      const updatedConfig = monitor.getState().config;
      expect(updatedConfig.integrityCheckInterval).toBe(5000);
    });
  });

  describe('State Management', () => {
    it('should export state', () => {
      monitor.startMonitoring();
      monitor.recordOperation('undo', true);
      
      const exported = monitor.exportState();
      const parsed = JSON.parse(exported);
      
      expect(parsed.state.isMonitoring).toBe(true);
      expect(parsed.state.metrics.undoCount).toBe(1);
      expect(parsed.exportedAt).toBeDefined();
    });

    it('should clear operation history', () => {
      monitor.startMonitoring();
      monitor.recordOperation('undo', true);
      monitor.recordOperation('redo', true);
      
      expect(monitor.getOperationHistory()).toHaveLength(2);
      
      monitor.clearHistory();
      
      expect(monitor.getOperationHistory()).toHaveLength(0);
    });

    it('should get last integrity check result', async () => {
      monitor.startMonitoring();
      
      const result = await monitor.performIntegrityCheck();
      const lastResult = monitor.getLastIntegrityCheck();
      
      expect(lastResult).toBe(result);
      expect(lastResult?.timestamp).toBe(result.timestamp);
    });
  });

  describe('Metrics Collection', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should track history depth', () => {
      mockGetHistory.mockReturnValue([
        { timestamp: Date.now(), config: {}, description: 'Snapshot 1' },
        { timestamp: Date.now(), config: {}, description: 'Snapshot 2' },
        { timestamp: Date.now(), config: {}, description: 'Snapshot 3' },
      ]);
      
      monitor.recordOperation('undo', true);
      
      const metrics = monitor.getMetrics();
      expect(metrics.historyDepth).toBe(3);
      expect(metrics.maxHistoryDepth).toBe(3);
    });

    it('should calculate total data size', () => {
      const config = {
        version: '1.0.0',
        stats: { test: { id: 'test', label: 'Test', type: 'number', min: 0, max: 100, step: 1, defaultValue: 50, weight: 1, isCore: false, isDerived: false } },
        cards: {},
        presets: {},
        activePresetId: 'default',
        targetTurns: {},
        scenarioBudget: {},
      };
      
      mockGetCurrentConfigSnapshot.mockReturnValue(config);
      
      monitor.recordOperation('save', true);
      
      const metrics = monitor.getMetrics();
      expect(metrics.totalDataSize).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing BalancerConfigStore gracefully', async () => {
      mockGetHistory.mockImplementation(() => {
        throw new Error('Store not available');
      });
      
      const result = await monitor.performIntegrityCheck();
      
      expect(result.passed).toBe(false);
      expect(result.issues[0].description).toBe('Integrity check failed with error');
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(() => {
      monitor.startMonitoring();
    });

    it('should log slow operations', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Simulate slow operation
      monitor.startOperation();
      setTimeout(() => {
        monitor.recordOperation('undo', true);
      }, 1100); // Longer than default threshold of 1000ms
      
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Slow undo operation')
        );
        consoleSpy.mockRestore();
      }, 1200);
    });

    it('should disable performance monitoring', () => {
      monitor.updateConfig({ enablePerformanceMonitoring: false });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      monitor.startOperation();
      setTimeout(() => {
        monitor.recordOperation('undo', true);
      }, 1100);
      
      setTimeout(() => {
        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
      }, 1200);
    });
  });
});
