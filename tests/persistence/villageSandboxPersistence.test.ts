/**
 * Village Sandbox Persistence Tests
 *
 * Tests for async persistence operations using the PersistenceService.
 * Verifies save/load flows, error handling, and deterministic behavior.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import {
  saveVillageState,
  loadVillageState,
  clearVillageState,
  exportVillageState,
  importVillageState,
  resetVillageState,
  loadHistory,
  undoVillageState,
} from '@/ui/idleVillage/state/PersistenceService';

// Mock the shared PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
  clearData: vi.fn(),
}));

import { saveData, loadData, clearData } from '@/shared/persistence/PersistenceService';

const mockSaveData = vi.mocked(saveData);
const mockLoadData = vi.mocked(loadData);
const mockClearData = vi.mocked(clearData);

describe('Village Sandbox Persistence', () => {
  const mockVillageState: VillageState = {
    currentTime: 100,
    resources: { food: 50, wood: 25, stone: 10 },
    residents: {
      'resident-1': {
        id: 'resident-1',
        displayName: 'Alice',
        currentHp: 100,
        maxHp: 100,
        fatigue: 0,
        status: 'available',
        isHero: false,
        isInjured: false,
        statSnapshot: { hp: 100, damage: 10, agility: 10 },
        statTags: ['founder'],
        survivalCount: 0,
        survivalScore: 0,
      },
    },
    activities: {},
    eventLog: [],
    questOffers: {},
  };

  const createInitialState = (): VillageState => ({
    currentTime: 0,
    resources: { food: 0, wood: 0, stone: 0 },
    residents: {},
    activities: {},
    eventLog: [],
    questOffers: {},
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearVillageState();
  });

  describe('saveVillageState', () => {
    it('should save state with history', async () => {
      mockSaveData.mockResolvedValue(undefined);

      await saveVillageState(mockVillageState, 'Test save');

      expect(mockSaveData).toHaveBeenCalledTimes(2);
      expect(mockSaveData).toHaveBeenCalledWith('idle_village_state', mockVillageState);
      expect(mockSaveData).toHaveBeenCalledWith('idle_village_state_history', expect.any(Array));
    });

    it('should handle save errors gracefully', async () => {
      const error = new Error('Save failed');
      mockSaveData.mockRejectedValue(error);

      await expect(saveVillageState(mockVillageState, 'Test save')).rejects.toThrow('Save failed');
    });
  });

  describe('loadVillageState', () => {
    it('should load valid saved state', async () => {
      mockLoadData.mockResolvedValue(mockVillageState);

      const result = await loadVillageState(createInitialState);

      expect(result).toEqual(mockVillageState);
      expect(mockLoadData).toHaveBeenCalledWith('idle_village_state', expect.any(Object));
    });

    it('should return initial state when no saved data exists', async () => {
      mockLoadData.mockResolvedValue(null);

      const initialState = createInitialState();
      const result = await loadVillageState(() => initialState);

      expect(result).toEqual(initialState);
    });

    it('should return initial state when saved state has no residents', async () => {
      const emptyState = { ...mockVillageState, residents: {} };
      mockLoadData.mockResolvedValue(emptyState);

      const initialState = createInitialState();
      const result = await loadVillageState(() => initialState);

      expect(result).toEqual(initialState);
    });

    it('should handle load errors gracefully', async () => {
      const error = new Error('Load failed');
      mockLoadData.mockRejectedValue(error);

      const initialState = createInitialState();
      const result = await loadVillageState(() => initialState);

      expect(result).toEqual(initialState);
    });
  });

  describe('clearVillageState', () => {
    it('should clear all persistence data', async () => {
      mockClearData.mockResolvedValue(undefined);

      await clearVillageState();

      expect(mockClearData).toHaveBeenCalledTimes(2);
      expect(mockClearData).toHaveBeenCalledWith('idle_village_state');
      expect(mockClearData).toHaveBeenCalledWith('idle_village_state_history');
    });
  });

  describe('exportVillageState', () => {
    it('should export current state as JSON string', async () => {
      mockLoadData.mockResolvedValue(mockVillageState);

      const result = await exportVillageState();

      expect(typeof result).toBe('string');
      expect(JSON.parse(result)).toEqual(mockVillageState);
    });
  });

  describe('importVillageState', () => {
    it('should import state from JSON string', async () => {
      const jsonString = JSON.stringify(mockVillageState);
      mockSaveData.mockResolvedValue(undefined);
      mockLoadData.mockResolvedValue(mockVillageState);

      await importVillageState(jsonString, 'Imported state');

      expect(mockSaveData).toHaveBeenCalledWith('idle_village_state', mockVillageState);
      expect(mockSaveData).toHaveBeenCalledWith('idle_village_state_history', expect.any(Array));
    });

    it('should handle invalid JSON gracefully', async () => {
      await expect(importVillageState('invalid json', 'Test import')).rejects.toThrow();
    });
  });

  describe('resetVillageState', () => {
    it('should reset to initial factory state', async () => {
      const freshState = createInitialState();
      mockSaveData.mockResolvedValue(undefined);

      const result = await resetVillageState(() => freshState, 'Reset state');

      expect(result).toEqual(freshState);
      expect(mockSaveData).toHaveBeenCalledWith('idle_village_state', freshState);
    });
  });

  describe('undoVillageState', () => {
    it('should return null when no history exists', async () => {
      mockLoadData.mockResolvedValue([]);

      const result = await undoVillageState();

      expect(result).toBeNull();
    });

    it('should undo to previous state when history exists', async () => {
      const previousState = createInitialState();
      const history = [{
        timestamp: Date.now() - 1000,
        description: 'Previous state',
        state: previousState,
      }];

      mockLoadData.mockResolvedValue(history);
      mockSaveData.mockResolvedValue(undefined);

      const result = await undoVillageState();

      expect(result).toEqual(previousState);
      expect(mockSaveData).toHaveBeenCalledWith('idle_village_state_history', []);
    });
  });

  describe('loadHistory', () => {
    it('should load history snapshots', async () => {
      const history = [{
        timestamp: Date.now(),
        description: 'Test snapshot',
        state: mockVillageState,
      }];

      mockLoadData.mockResolvedValue(history);

      const result = await loadHistory();

      expect(result).toEqual(history);
    });

    it('should return empty array when no history exists', async () => {
      mockLoadData.mockResolvedValue([]);

      const result = await loadHistory();

      expect(result).toEqual([]);
    });

    it('should handle history load errors gracefully', async () => {
      mockLoadData.mockRejectedValue(new Error('History load failed'));

      const result = await loadHistory();

      expect(result).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain state consistency across save/load cycles', async () => {
      mockSaveData.mockResolvedValue(undefined);
      mockLoadData.mockResolvedValueOnce(null).mockResolvedValueOnce(mockVillageState);

      // Initial save
      await saveVillageState(mockVillageState, 'Initial save');

      // Load should return the saved state
      const loaded = await loadVillageState(createInitialState);
      expect(loaded).toEqual(mockVillageState);
    });

    it('should handle concurrent operations safely', async () => {
      mockSaveData.mockResolvedValue(undefined);
      mockLoadData.mockResolvedValue(mockVillageState);

      // Simulate concurrent saves
      const promises = [
        saveVillageState(mockVillageState, 'Save 1'),
        saveVillageState(mockVillageState, 'Save 2'),
        loadVillageState(createInitialState),
      ];

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should preserve history across operations', async () => {
      const operations = [
        () => saveVillageState(mockVillageState, 'Operation 1'),
        () => saveVillageState(mockVillageState, 'Operation 2'),
        () => loadHistory(),
      ];

      mockSaveData.mockResolvedValue(undefined);
      mockLoadData.mockResolvedValue([]);

      await Promise.all(operations.map(op => op()));

      // Verify history calls
      expect(mockLoadData).toHaveBeenCalledWith('idle_village_state_history', []);
      expect(mockSaveData).toHaveBeenCalledWith('idle_village_state_history', expect.any(Array));
    });
  });
});
