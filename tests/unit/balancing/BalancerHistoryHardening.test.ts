import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BalancerHistoryStore } from '@/balancing/config/BalancerHistoryStore';
import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';
import type { BalancerConfig } from '@/balancing/config/types';

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
  clearData: vi.fn(),
}));

const mockSaveData = vi.mocked(saveData);
const mockLoadData = vi.mocked(loadData);

describe('BalancerHistoryStore - CF-Phase10-Hardening', () => {
  let store: BalancerHistoryStore;
  let testConfig: BalancerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    store = new BalancerHistoryStore({
      maxSnapshots: 3,
      storageKey: 'testHistory',
      autoSave: false, // Disable auto-save for testing
      maxRetries: 2,
      retryDelayMs: 10,
      enableDeduplication: true,
      maxRecentOperations: 10,
      enableChecksumValidation: true,
      enableCorruptionDetection: true,
    });

    testConfig = {
      version: '1.0.0',
      stats: {
        hp: { id: 'hp', label: 'HP', weight: 1.0, defaultValue: 100, isCore: true },
        damage: { id: 'damage', label: 'Damage', weight: 1.0, defaultValue: 10, isCore: true },
      },
      cards: {},
      presets: {},
      activePresetId: null,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Enhanced Configuration', () => {
    it('should initialize with enhanced safety features', () => {
      const state = store.getState();
      
      expect(state.healthDiagnostics).toBeDefined();
      expect(state.healthDiagnostics.health).toBe('healthy');
      expect(state.operationStats).toBeDefined();
      expect(state.operationStats.totalOperations).toBe(0);
      expect(state.lastError).toBeNull();
    });

    it('should respect configuration options', () => {
      const customStore = new BalancerHistoryStore({
        maxRetries: 5,
        retryDelayMs: 200,
        enableDeduplication: false,
        maxRecentOperations: 50,
        enableChecksumValidation: false,
        enableCorruptionDetection: false,
      });

      const state = customStore.getState();
      expect(state.healthDiagnostics).toBeDefined();
      expect(state.operationStats).toBeDefined();
    });
  });

  describe('Checksum Validation', () => {
    it('should generate consistent checksums for identical data', () => {
      const checksum1 = (store as any).generateChecksum(testConfig);
      const checksum2 = (store as any).generateChecksum(testConfig);
      
      expect(checksum1).toBe(checksum2);
      expect(typeof checksum1).toBe('string');
      expect(checksum1.length).toBeGreaterThan(0);
    });

    it('should generate different checksums for different data', () => {
      const checksum1 = (store as any).generateChecksum(testConfig);
      const differentConfig = { ...testConfig, activePresetId: 'different' };
      const checksum2 = (store as any).generateChecksum(differentConfig);
      
      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('Corruption Detection', () => {
    it('should detect corrupted snapshots', () => {
      const validSnapshot = {
        timestamp: Date.now(),
        config: testConfig,
        description: 'Valid snapshot',
      };

      const corruptedSnapshot = {
        timestamp: Date.now(),
        config: null, // Missing config
        description: 'Corrupted snapshot',
      };

      expect((store as any).detectCorruption(validSnapshot)).toBe(false);
      expect((store as any).detectCorruption(corruptedSnapshot)).toBe(true);
    });

    it('should detect snapshots with missing required properties', () => {
      const incompleteSnapshot = {
        timestamp: Date.now(),
        // Missing config and description
      };

      expect((store as any).detectCorruption(incompleteSnapshot)).toBe(true);
    });

    it('should detect snapshots with invalid timestamps', () => {
      const invalidTimestampSnapshot = {
        timestamp: -1, // Invalid timestamp
        config: testConfig,
        description: 'Invalid timestamp',
      };

      expect((store as any).detectCorruption(invalidTimestampSnapshot)).toBe(true);
    });
  });

  describe('Deduplication', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should prevent duplicate consecutive snapshots', async () => {
      await store.pushSnapshot(testConfig, 'First snapshot');
      await store.pushSnapshot(testConfig, 'Duplicate snapshot');
      
      const state = store.getState();
      expect(state.snapshots).toHaveLength(1); // Should deduplicate
      expect(state.snapshots[0].description).toBe('First snapshot');
    });

    it('should allow different snapshots', async () => {
      await store.pushSnapshot(testConfig, 'First snapshot');
      const differentConfig = { ...testConfig, activePresetId: 'different' };
      await store.pushSnapshot(differentConfig, 'Different snapshot');
      
      const state = store.getState();
      expect(state.snapshots).toHaveLength(2);
    });

    it('should respect deduplication setting', async () => {
      const noDedupStore = new BalancerHistoryStore({
        enableDeduplication: false,
        autoSave: false,
      });
      await noDedupStore.initialize();
      
      await noDedupStore.pushSnapshot(testConfig, 'First');
      await noDedupStore.pushSnapshot(testConfig, 'Duplicate');
      
      const state = noDedupStore.getState();
      expect(state.snapshots).toHaveLength(2); // Should not deduplicate
    });
  });

  describe('Retry Logic', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should retry failed operations', async () => {
      let attemptCount = 0;
      const mockOperation = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve('success');
      });

      // Access private method through type assertion
      const executeOperation = (store as any).executeOperation.bind(store);
      const result = await executeOperation('test-op', mockOperation);
      
      expect(result).toBe('success');
      expect(attemptCount).toBe(2); // Should have retried once
    });

    it('should fail after max retries', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Persistent failure'));
      
      // Access private method through type assertion
      const executeOperation = (store as any).executeOperation.bind(store);
      
      await expect(executeOperation('test-op', mockOperation)).rejects.toThrow('Persistent failure');
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Health Diagnostics', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should track operation statistics', async () => {
      await store.pushSnapshot(testConfig, 'Test snapshot');
      
      const stats = store.getOperationStats();
      expect(stats.totalOperations).toBe(1);
      expect(stats.successfulOperations).toBe(1);
      expect(stats.failedOperations).toBe(0);
      expect(stats.averageDuration).toBeGreaterThan(0);
    });

    it('should update health status based on performance', async () => {
      // Simulate slow operations
      const originalExecuteOperation = (store as any).executeOperation;
      (store as any).executeOperation = vi.fn().mockImplementation(async (id, operation) => {
        // Simulate slow operation
        await new Promise(resolve => setTimeout(resolve, 1100));
        return originalExecuteOperation(id, operation);
      });
      
      await store.pushSnapshot(testConfig, 'Slow operation');
      
      const diagnostics = store.getHealthDiagnostics();
      expect(diagnostics.health).toBe('degraded');
      expect(diagnostics.recommendations).toContain('Consider reducing operation complexity');
    });

    it('should track storage usage', async () => {
      await store.pushSnapshot(testConfig, 'Test snapshot');
      
      const diagnostics = store.getHealthDiagnostics();
      expect(diagnostics.storageUsage).toBeGreaterThan(0);
      expect(diagnostics.storageUsage).toBeLessThan(100); // Should be reasonable
    });
  });

  describe('Enhanced Error Handling', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should handle persistence errors gracefully', async () => {
      mockSaveData.mockRejectedValue(new Error('Storage failed'));
      
      const autoSaveStore = new BalancerHistoryStore({
        autoSave: true,
        storageKey: 'errorTest',
      });
      await autoSaveStore.initialize();
      
      // Should not throw
      await expect(autoSaveStore.pushSnapshot(testConfig, 'Test')).resolves.toBeUndefined();
      
      const diagnostics = autoSaveStore.getHealthDiagnostics();
      expect(diagnostics.errorCount).toBeGreaterThan(0);
    });

    it('should track last error timestamp', async () => {
      const errorStore = new BalancerHistoryStore({
        autoSave: true,
        storageKey: 'errorTest',
      });
      await errorStore.initialize();
      
      mockSaveData.mockRejectedValue(new Error('Storage failed'));
      
      const beforeError = Date.now();
      await errorStore.pushSnapshot(testConfig, 'Test');
      const afterError = Date.now();
      
      const state = errorStore.getState();
      expect(state.lastError).toBeGreaterThanOrEqual(beforeError);
      expect(state.lastError).toBeLessThanOrEqual(afterError);
    });
  });

  describe('Concurrent Operation Protection', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should prevent duplicate operation IDs', async () => {
      const operationId = 'test-operation';
      
      // Start first operation
      const firstOperation = (store as any).executeOperation(operationId, async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'first';
      });
      
      // Second operation with same ID should fail
      const secondOperation = (store as any).executeOperation(operationId, async () => {
        return 'second';
      });
      
      await expect(firstOperation).resolves.toBe('first');
      await expect(secondOperation).rejects.toThrow('is already in progress');
    });

    it('should clean up operation promises after completion', async () => {
      const operationId = 'test-cleanup';
      
      await (store as any).executeOperation(operationId, async () => {
        return 'completed';
      });
      
      // Operation promise should be cleaned up
      expect((store as any).operationPromises.has(operationId)).toBe(false);
    });
  });

  describe('Storage Usage Monitoring', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should calculate storage usage percentage', () => {
      const usage = (store as any).getStorageUsage();
      expect(typeof usage).toBe('number');
      expect(usage).toBeGreaterThanOrEqual(0);
      expect(usage).toBeLessThanOrEqual(100);
    });

    it('should handle storage calculation errors gracefully', () => {
      // Mock JSON.stringify to throw error
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn().mockImplementation(() => {
        throw new Error('Stringify failed');
      });
      
      const usage = (store as any).getStorageUsage();
      expect(usage).toBe(0);
      
      // Restore
      JSON.stringify = originalStringify;
    });
  });

  describe('Integration with Existing Features', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should maintain undo/redo functionality with enhanced safety', async () => {
      await store.pushSnapshot(testConfig, 'First');
      const config2 = { ...testConfig, activePresetId: 'second' };
      await store.pushSnapshot(config2, 'Second');
      
      // Test undo
      const undoneConfig = await store.undo();
      expect(undoneConfig?.activePresetId).toBeNull();
      
      // Test redo
      const redoneConfig = await store.redo();
      expect(redoneConfig?.activePresetId).toBe('second');
      
      // Verify health tracking
      const stats = store.getOperationStats();
      expect(stats.totalOperations).toBeGreaterThan(0);
      expect(stats.successfulOperations).toBeGreaterThan(0);
    });

    it('should maintain history display with enhanced metadata', async () => {
      await store.pushSnapshot(testConfig, 'Test snapshot');
      
      const history = store.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].checksum).toBeDefined();
      expect(history[0].timestamp).toBeGreaterThan(0);
    });
  });

  describe('Performance Characteristics', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should handle rapid operations efficiently', async () => {
      const startTime = performance.now();
      
      // Perform 10 rapid operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        const config = { ...testConfig, activePresetId: `test-${i}` };
        operations.push(store.pushSnapshot(config, `Test ${i}`));
      }
      
      await Promise.all(operations);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      const stats = store.getOperationStats();
      expect(stats.averageDuration).toBeLessThan(100); // Average should be reasonable
    });

    it('should maintain performance with corruption detection enabled', async () => {
      const startTime = performance.now();
      
      // Add snapshots with corruption detection
      for (let i = 0; i < 5; i++) {
        await store.pushSnapshot(testConfig, `Test ${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500); // Should still be fast with detection
    });
  });
});
