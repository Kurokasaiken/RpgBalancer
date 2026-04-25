/**
 * Unit tests for BalancerHistoryStore
 * Tests undo/redo functionality, persistence, and snapshot management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BalancerHistoryStore } from '../../../src/balancing/config/BalancerHistoryStore';
import type { BalancerConfig, ConfigSnapshot } from '../../../src/balancing/config/types';
import { saveData, loadData, clearData } from '../../../src/shared/persistence/PersistenceService';

// Mock PersistenceService
vi.mock('../../../src/shared/persistence/PersistenceService');

const mockSaveData = vi.mocked(saveData);
const mockLoadData = vi.mocked(loadData);
const mockClearData = vi.mocked(clearData);

describe('BalancerHistoryStore', () => {
  let store: BalancerHistoryStore;
  let mockConfig: BalancerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    store = new BalancerHistoryStore({
      maxSnapshots: 3,
      storageKey: 'test-history',
      autoSave: false, // Disable auto-save for testing
    });

    mockConfig = {
      version: '1.0.0',
      stats: {
        hp: {
          id: 'hp',
          label: 'Health',
          description: 'Health points',
          type: 'number',
          min: 1,
          max: 100,
          step: 1,
          defaultValue: 50,
          weight: 1.0,
          isCore: true,
          isDerived: false,
        },
        damage: {
          id: 'damage',
          label: 'Damage',
          description: 'Attack damage',
          type: 'number',
          min: 0,
          max: 50,
          step: 1,
          defaultValue: 10,
          weight: 1.0,
          isCore: true,
          isDerived: false,
        },
      },
      cards: {
        core: {
          id: 'core',
          title: 'Core Stats',
          color: '#333',
          statIds: ['hp', 'damage'],
          isCore: true,
          order: 0,
        },
      },
      presets: {
        default: {
          id: 'default',
          name: 'Default',
          description: 'Default preset',
          weights: { hp: 1.0, damage: 1.0 },
          isBuiltIn: true,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        },
      },
      activePresetId: 'default',
    };
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

    it('should load persisted state on initialization', async () => {
      const persistedState = {
        snapshots: [
          {
            timestamp: Date.now(),
            config: mockConfig,
            description: 'Initial state',
          },
        ],
        currentIndex: 0,
        canUndo: false,
        canRedo: false,
      };

      mockLoadData.mockResolvedValue(persistedState);

      await store.initialize();

      const state = store.getState();
      expect(state.snapshots).toHaveLength(1);
      expect(state.currentIndex).toBe(0);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });

    it('should sanitize invalid snapshots on load', async () => {
      const invalidState = {
        snapshots: [
          { timestamp: Date.now(), config: mockConfig, description: 'Valid' },
          { timestamp: Date.now(), config: null, description: 'Invalid' },
          { timestamp: 'invalid', config: mockConfig, description: 'Invalid timestamp' },
          'not-an-object',
        ],
        currentIndex: 0,
        canUndo: false,
        canRedo: false,
      };

      mockLoadData.mockResolvedValue(invalidState);

      await store.initialize();

      const state = store.getState();
      expect(state.snapshots).toHaveLength(1); // Only valid snapshot remains
      expect(state.snapshots[0].description).toBe('Valid');
    });

    it('should enforce max snapshot limit on load', async () => {
      const snapshots: ConfigSnapshot[] = Array.from({ length: 5 }, (_, i) => ({
        timestamp: Date.now() - i * 1000,
        config: { ...mockConfig, version: `${i + 1}.0.0` },
        description: `Snapshot ${i + 1}`,
      }));

      mockLoadData.mockResolvedValue({
        snapshots,
        currentIndex: 0,
        canUndo: true,
        canRedo: false,
      });

      await store.initialize();

      const state = store.getState();
      expect(state.snapshots).toHaveLength(3); // Limited to maxSnapshots
    });
  });

  describe('Snapshot Management', () => {
    beforeEach(async () => {
      mockLoadData.mockResolvedValue({
        snapshots: [],
        currentIndex: -1,
        canUndo: false,
        canRedo: false,
      });
      await store.initialize();
    });

    it('should add snapshot to history', async () => {
      await store.pushSnapshot(mockConfig, 'Initial setup');

      const state = store.getState();
      expect(state.snapshots).toHaveLength(1);
      expect(state.snapshots[0].description).toBe('Initial setup');
      expect(state.snapshots[0].config).toEqual(mockConfig);
      expect(state.currentIndex).toBe(0);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });

    it('should maintain max snapshot limit', async () => {
      // Add 4 snapshots (exceeds limit of 3)
      for (let i = 0; i < 4; i++) {
        await store.pushSnapshot(
          { ...mockConfig, version: `${i + 1}.0.0` },
          `Snapshot ${i + 1}`
        );
      }

      const state = store.getState();
      expect(state.snapshots).toHaveLength(3);
      expect(state.snapshots[0].description).toBe('Snapshot 4'); // Newest
      expect(state.snapshots[1].description).toBe('Snapshot 3');
      expect(state.snapshots[2].description).toBe('Snapshot 2'); // Oldest kept
    });

    it('should clear redo stack when adding new snapshot', async () => {
      // Add initial snapshots
      await store.pushSnapshot(mockConfig, 'Snapshot 1');
      await store.pushSnapshot({ ...mockConfig, version: '2.0.0' }, 'Snapshot 2');

      // Undo to position 1
      await store.undo();
      expect(store.getState().currentIndex).toBe(1);

      // Add new snapshot - should clear redo stack
      await store.pushSnapshot({ ...mockConfig, version: '3.0.0' }, 'Snapshot 3');

      const state = store.getState();
      expect(state.snapshots).toHaveLength(2); // Old redo stack cleared
      expect(state.currentIndex).toBe(0);
      expect(state.canRedo).toBe(false);
    });

    it('should deep clone config to prevent mutations', async () => {
      await store.pushSnapshot(mockConfig, 'Initial');

      // Modify original config
      mockConfig.version = '2.0.0';

      const snapshot = store.getState().snapshots[0];
      expect(snapshot.config.version).toBe('1.0.0'); // Should not be affected
    });
  });

  describe('Undo/Redo Operations', () => {
    beforeEach(async () => {
      mockLoadData.mockResolvedValue({
        snapshots: [],
        currentIndex: -1,
        canUndo: false,
        canRedo: false,
      });
      await store.initialize();

      // Add test snapshots
      await store.pushSnapshot(mockConfig, 'Snapshot 1');
      await store.pushSnapshot({ ...mockConfig, version: '2.0.0' }, 'Snapshot 2');
      await store.pushSnapshot({ ...mockConfig, version: '3.0.0' }, 'Snapshot 3');
    });

    it('should undo to previous snapshot', async () => {
      const result = await store.undo();

      expect(result).toBeDefined();
      expect(result!.version).toBe('2.0.0');

      const state = store.getState();
      expect(state.currentIndex).toBe(1);
      expect(state.canUndo).toBe(true);
      expect(state.canRedo).toBe(true);
    });

    it('should redo to next snapshot', async () => {
      // First undo
      await store.undo();
      expect(store.getState().currentIndex).toBe(1);

      // Then redo
      const result = await store.redo();

      expect(result).toBeDefined();
      expect(result!.version).toBe('3.0.0');

      const state = store.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });

    it('should return null when undo is not available', async () => {
      // Undo to oldest
      await store.undo(); // To snapshot 2
      await store.undo(); // To snapshot 1
      await store.undo(); // To snapshot 3 (oldest)

      const result = await store.undo();
      expect(result).toBeNull();

      const state = store.getState();
      expect(state.canUndo).toBe(false);
    });

    it('should return null when redo is not available', async () => {
      const result = await store.redo();
      expect(result).toBeNull();

      const state = store.getState();
      expect(state.canRedo).toBe(false);
    });

    it('should handle multiple undo operations', async () => {
      // Undo all the way to oldest
      await store.undo(); // To snapshot 2
      expect(store.getState().currentIndex).toBe(1);

      await store.undo(); // To snapshot 1
      expect(store.getState().currentIndex).toBe(2);

      await store.undo(); // To snapshot 3 (oldest)
      expect(store.getState().currentIndex).toBe(2);

      const state = store.getState();
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(true);
    });

    it('should handle multiple redo operations', async () => {
      // Undo to oldest, then redo back to newest
      await store.undo(); // To snapshot 2
      await store.undo(); // To snapshot 1
      await store.undo(); // To snapshot 3 (oldest)

      await store.redo(); // To snapshot 1
      expect(store.getState().currentIndex).toBe(1);

      await store.redo(); // To snapshot 2
      expect(store.getState().currentIndex).toBe(0);

      await store.redo(); // To snapshot 3 (newest)
      expect(store.getState().currentIndex).toBe(-1); // Reset to newest position

      const state = store.getState();
      expect(state.canRedo).toBe(false);
      expect(state.canUndo).toBe(false);
    });
  });

  describe('Persistence', () => {
    beforeEach(async () => {
      mockLoadData.mockResolvedValue({
        snapshots: [],
        currentIndex: -1,
        canUndo: false,
        canRedo: false,
      });
      await store.initialize();
    });

    it('should persist state when autoSave is enabled', async () => {
      const autoSaveStore = new BalancerHistoryStore({
        maxSnapshots: 3,
        storageKey: 'test-history',
        autoSave: true,
      });

      mockLoadData.mockResolvedValue({
        snapshots: [],
        currentIndex: -1,
        canUndo: false,
        canRedo: false,
      });

      await autoSaveStore.initialize();

      await autoSaveStore.pushSnapshot(mockConfig, 'Test snapshot');

      expect(mockSaveData).toHaveBeenCalledWith('test-history', expect.any(Object));
    });

    it('should not persist when autoSave is disabled', async () => {
      await store.pushSnapshot(mockConfig, 'Test snapshot');

      expect(mockSaveData).not.toHaveBeenCalled();
    });

    it('should persist on undo/redo when autoSave is enabled', async () => {
      const autoSaveStore = new BalancerHistoryStore({
        maxSnapshots: 3,
        storageKey: 'test-history',
        autoSave: true,
      });

      mockLoadData.mockResolvedValue({
        snapshots: [],
        currentIndex: -1,
        canUndo: false,
        canRedo: false,
      });

      await autoSaveStore.initialize();
      await autoSaveStore.pushSnapshot(mockConfig, 'Snapshot 1');
      await autoSaveStore.pushSnapshot({ ...mockConfig, version: '2.0.0' }, 'Snapshot 2');

      mockSaveData.mockClear();

      await autoSaveStore.undo();
      expect(mockSaveData).toHaveBeenCalledTimes(1);

      await autoSaveStore.redo();
      expect(mockSaveData).toHaveBeenCalledTimes(2);
    });
  });

  describe('Utility Methods', () => {
    beforeEach(async () => {
      mockLoadData.mockResolvedValue({
        snapshots: [],
        currentIndex: -1,
        canUndo: false,
        canRedo: false,
      });
      await store.initialize();
    });

    it('should get current config', async () => {
      await store.pushSnapshot(mockConfig, 'Test');

      const current = store.getCurrentConfig();
      expect(current).toEqual(mockConfig);
    });

    it('should return null when no current config', () => {
      const current = store.getCurrentConfig();
      expect(current).toBeNull();
    });

    it('should get history with diff summaries', async () => {
      await store.pushSnapshot(mockConfig, 'Snapshot 1');
      await store.pushSnapshot({ ...mockConfig, version: '2.0.0' }, 'Snapshot 2');

      const history = store.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].description).toBe('Snapshot 2');
      expect(history[1].description).toBe('Snapshot 1');
      expect('diffSummary' in history[1]).toBe(true); // Should have diff summary
    });

    it('should clear all history', async () => {
      await store.pushSnapshot(mockConfig, 'Snapshot 1');
      await store.pushSnapshot({ ...mockConfig, version: '2.0.0' }, 'Snapshot 2');

      await store.clear();

      const state = store.getState();
      expect(state.snapshots).toEqual([]);
      expect(state.currentIndex).toBe(-1);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });

    it('should provide storage statistics', async () => {
      await store.pushSnapshot(mockConfig, 'Snapshot 1');
      await store.pushSnapshot({ ...mockConfig, version: '2.0.0' }, 'Snapshot 2');

      const stats = store.getStorageStats();
      expect(stats.snapshotCount).toBe(2);
      expect(stats.currentIndex).toBe(0);
      expect(stats.canUndo).toBe(false);
      expect(stats.canRedo).toBe(false);
      expect(stats.oldestTimestamp).toBeDefined();
      expect(stats.newestTimestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle persistence errors gracefully', async () => {
      mockLoadData.mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(store.initialize()).resolves.toBeUndefined();

      const state = store.getState();
      expect(state.snapshots).toEqual([]);
    });

    it('should handle save errors when autoSave is enabled', async () => {
      const autoSaveStore = new BalancerHistoryStore({
        maxSnapshots: 3,
        storageKey: 'test-history',
        autoSave: true,
      });

      mockLoadData.mockResolvedValue({
        snapshots: [],
        currentIndex: -1,
        canUndo: false,
        canRedo: false,
      });

      mockSaveData.mockRejectedValue(new Error('Save failed'));

      await autoSaveStore.initialize();

      // Should not throw
      await expect(autoSaveStore.pushSnapshot(mockConfig, 'Test')).resolves.toBeUndefined();
    });
  });
});
