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

describe('BalancerHistoryStore', () => {
  let store: BalancerHistoryStore;
  let testConfig: BalancerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    store = new BalancerHistoryStore({
      maxSnapshots: 3,
      storageKey: 'testHistory',
      autoSave: false, // Disable auto-save for testing
    });

    testConfig = {
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

  describe('Initialization', () => {
    it('should initialize with empty state', async () => {
      mockLoadData.mockResolvedValue({
        snapshots: [],
        currentIndex: -1,
        canUndo: false,
        canRedo: false,
      });

      await store.initialize();
      const state = store.getState();

      expect(state.snapshots).toEqual([]);
      expect(state.currentIndex).toBe(-1);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });

    it('should handle load errors gracefully', async () => {
      mockLoadData.mockRejectedValue(new Error('Storage error'));

      await store.initialize();
      const state = store.getState();

      expect(state.snapshots).toEqual([]);
      expect(state.currentIndex).toBe(-1);
    });

    it('should validate and sanitize loaded snapshots', async () => {
      mockLoadData.mockResolvedValue({
        snapshots: [
          { timestamp: Date.now(), description: 'Valid', config: testConfig },
          { timestamp: Date.now(), description: 'Invalid', config: null },
          { timestamp: Date.now(), description: 'Another Valid', config: testConfig },
          { timestamp: Date.now(), description: 'Too many', config: testConfig },
        ],
        currentIndex: 0,
        canUndo: false,
        canRedo: false,
      });

      await store.initialize();
      const state = store.getState();

      // Should filter invalid snapshots and enforce max limit
      expect(state.snapshots).toHaveLength(3);
      expect(state.snapshots.every((s: any) => s.config)).toBe(true);
    });
  });

  describe('Snapshot Management', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should push snapshot and update state', async () => {
      await store.pushSnapshot(testConfig, 'Initial config');
      
      const state = store.getState();
      expect(state.snapshots).toHaveLength(1);
      expect(state.currentIndex).toBe(0);
      expect(state.canUndo).toBe(false); // Can't undo from newest
      expect(state.canRedo).toBe(false);
      expect(state.snapshots[0].description).toBe('Initial config');
    });

    it('should enforce maximum snapshot limit', async () => {
      // Add 4 snapshots (max is 3)
      for (let i = 0; i < 4; i++) {
        await store.pushSnapshot(testConfig, `Snapshot ${i}`);
      }

      const state = store.getState();
      expect(state.snapshots).toHaveLength(3);
      expect(state.snapshots[0].description).toBe('Snapshot 3'); // Newest
    });

    it('should clear redo stack when pushing new snapshot', async () => {
      // Add initial snapshots
      await store.pushSnapshot(testConfig, 'Snapshot 1');
      await store.pushSnapshot(testConfig, 'Snapshot 2');
      
      // Undo to create redo stack
      await store.undo();
      expect(store.getState().canRedo).toBe(true);
      
      // Push new snapshot should clear redo stack
      await store.pushSnapshot(testConfig, 'Snapshot 3');
      
      const state = store.getState();
      expect(state.canRedo).toBe(false);
      expect(state.snapshots).toHaveLength(1);
      expect(state.snapshots[0].description).toBe('Snapshot 3');
    });

    it('should generate checksum for snapshots', async () => {
      await store.pushSnapshot(testConfig, 'Test snapshot');
      
      const history = store.getHistory();
      expect(history[0]).toHaveProperty('checksum');
      expect(typeof history[0].checksum).toBe('string');
    });
  });

  describe('Undo/Redo Operations', () => {
    beforeEach(async () => {
      await store.initialize();
      
      // Add test snapshots
      await store.pushSnapshot({ ...testConfig, activePresetId: 'preset1' }, 'Preset 1');
      await store.pushSnapshot({ ...testConfig, activePresetId: 'preset2' }, 'Preset 2');
    });

    it('should undo to previous configuration', async () => {
      const result = await store.undo();
      
      expect(result).toBeTruthy();
      expect(result?.activePresetId).toBe('preset1');
      
      const state = store.getState();
      expect(state.currentIndex).toBe(1);
      expect(state.canUndo).toBe(false); // At oldest snapshot
      expect(state.canRedo).toBe(true);
    });

    it('should redo to next configuration', async () => {
      // First undo to create redo stack
      await store.undo();
      
      const result = await store.redo();
      
      expect(result).toBeTruthy();
      expect(result?.activePresetId).toBe('preset2');
      
      const state = store.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });

    it('should return null when undo not available', async () => {
      // Undo to oldest
      await store.undo();
      
      // Try to undo again
      const result = await store.undo();
      expect(result).toBeNull();
    });

    it('should return null when redo not available', async () => {
      const result = await store.redo();
      expect(result).toBeNull();
    });

    it('should handle concurrent undo operations', async () => {
      const undoPromise1 = store.undo();
      const undoPromise2 = store.undo();
      
      const [result1, result2] = await Promise.all([undoPromise1, undoPromise2]);
      
      expect(result1).toBeTruthy();
      expect(result2).toBeNull(); // Second undo should fail
    });
  });

  describe('History Display', () => {
    beforeEach(async () => {
      await store.initialize();
      
      await store.pushSnapshot({ ...testConfig, activePresetId: 'preset1' }, 'Preset 1');
      await store.pushSnapshot({ ...testConfig, activePresetId: 'preset2' }, 'Preset 2');
    });

    it('should get history with diff summaries', () => {
      const history = store.getHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].description).toBe('Preset 2');
      expect(history[0].diffSummary).toBeUndefined(); // First snapshot has no diff
      
      expect(history[1].description).toBe('Preset 1');
      expect(history[1].diffSummary).toContain('Switched preset');
    });

    it('should generate meaningful diff summaries', async () => {
      const modifiedConfig = {
        ...testConfig,
        stats: {
          ...testConfig.stats,
          hp: { ...testConfig.stats.hp, weight: 1.5 },
          newStat: { id: 'newStat', label: 'New Stat', weight: 0.5, defaultValue: 50, isCore: false },
        },
        activePresetId: 'test',
      };

      await store.pushSnapshot(modifiedConfig, 'Modified config');
      
      const history = store.getHistory();
      const diff = history[0].diffSummary;
      
      expect(diff).toContain('Updated HP weight');
      expect(diff).toContain('Added stat: New Stat');
    });
  });

  describe('Persistence', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should persist state when autoSave is enabled', async () => {
      const autoSaveStore = new BalancerHistoryStore({
        autoSave: true,
        storageKey: 'autoSaveTest',
      });

      await autoSaveStore.initialize();
      await autoSaveStore.pushSnapshot(testConfig, 'Test');

      expect(mockSaveData).toHaveBeenCalledWith('autoSaveTest', expect.any(Object));
    });

    it('should not persist when autoSave is disabled', async () => {
      await store.pushSnapshot(testConfig, 'Test');
      
      expect(mockSaveData).not.toHaveBeenCalled();
    });

    it('should handle persistence errors gracefully', async () => {
      const autoSaveStore = new BalancerHistoryStore({
        autoSave: true,
        storageKey: 'errorTest',
      });

      await autoSaveStore.initialize();
      mockSaveData.mockRejectedValue(new Error('Save failed'));
      
      // Should not throw
      await expect(autoSaveStore.pushSnapshot(testConfig, 'Test')).resolves.toBeUndefined();
    });
  });

  describe('Clear and Reset', () => {
    beforeEach(async () => {
      await store.initialize();
      await store.pushSnapshot(testConfig, 'Test');
    });

    it('should clear all history', async () => {
      await store.clear();
      
      const state = store.getState();
      expect(state.snapshots).toEqual([]);
      expect(state.currentIndex).toBe(-1);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });

    it('should reset to initial state', async () => {
      await store.reset();
      
      const state = store.getState();
      expect(state.snapshots).toEqual([]);
      expect(state.currentIndex).toBe(-1);
    });
  });

  describe('Storage Statistics', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should provide storage statistics', async () => {
      const now = Date.now();
      await store.pushSnapshot(testConfig, 'Snapshot 1');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await store.pushSnapshot(testConfig, 'Snapshot 2');
      
      const stats = store.getStorageStats();
      
      expect(stats.snapshotCount).toBe(2);
      expect(stats.currentIndex).toBe(0);
      expect(stats.canUndo).toBe(false);
      expect(stats.canRedo).toBe(false);
      expect(stats.oldestTimestamp).toBeGreaterThan(now);
      expect(stats.newestTimestamp).toBeGreaterThan(stats.oldestTimestamp);
    });

    it('should handle empty history statistics', () => {
      const stats = store.getStorageStats();
      
      expect(stats.snapshotCount).toBe(0);
      expect(stats.currentIndex).toBe(-1);
      expect(stats.oldestTimestamp).toBeNull();
      expect(stats.newestTimestamp).toBeNull();
    });
  });

  describe('Race Condition Protection', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should handle concurrent snapshot pushes', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(store.pushSnapshot({ ...testConfig, activePresetId: `preset${i}` }, `Snapshot ${i}`));
      }

      await Promise.all(promises);
      
      const state = store.getState();
      expect(state.snapshots).toHaveLength(3); // Max limit enforced
      expect(state.currentIndex).toBe(0);
    });

    it('should handle concurrent undo/redo operations', async () => {
      // Add snapshots
      await store.pushSnapshot(testConfig, 'Snapshot 1');
      await store.pushSnapshot(testConfig, 'Snapshot 2');
      await store.pushSnapshot(testConfig, 'Snapshot 3');
      
      // Run concurrent operations
      const operations = [
        store.undo(),
        store.redo(),
        store.undo(),
        store.redo(),
        store.undo(),
      ];

      const results = await Promise.allSettled(operations);
      
      // Should not throw and all operations should complete
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
    });
  });

  describe('Queue Determinism', () => {
    beforeEach(async () => {
      await store.initialize();
    });

    it('should maintain snapshot order with timestamps', async () => {
      const timestamps = [];
      
      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        await store.pushSnapshot({ ...testConfig, activePresetId: `preset${i}` }, `Snapshot ${i}`);
        const end = Date.now();
        timestamps.push({ start, end });
      }

      const history = store.getHistory();
      
      // Verify timestamps are in descending order (newest first)
      for (let i = 0; i < history.length - 1; i++) {
        expect(history[i].timestamp).toBeGreaterThanOrEqual(history[i + 1].timestamp);
      }
    });

    it('should prevent duplicate consecutive snapshots', async () => {
      await store.pushSnapshot(testConfig, 'Same config');
      await store.pushSnapshot(testConfig, 'Same config');
      
      const state = store.getState();
      expect(state.snapshots).toHaveLength(1); // Should deduplicate
    });
  });
});
