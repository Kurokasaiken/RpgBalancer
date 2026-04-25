import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';
import {
  loadHUDState,
  saveHUDState,
  resetHUDState,
  serializeHUDState,
  deserializeHUDState,
  DEFAULT_HUD_PERSISTENCE_STATE,
  HUD_PERSISTENCE_KEY,
} from '@/ui/idleVillage/utils/hudPersistence';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';

// Mock dependencies
vi.mock('@/shared/persistence/PersistenceService', () => ({
  loadData: vi.fn(),
  saveData: vi.fn(),
}));

vi.mock('@/ui/idleVillage/utils/hudPersistence', () => ({
  loadHUDState: vi.fn(),
  saveHUDState: vi.fn(),
  resetHUDState: vi.fn(),
  serializeHUDState: vi.fn(),
  deserializeHUDState: vi.fn(),
  DEFAULT_HUD_PERSISTENCE_STATE: {
    preferences: {
      collapsed: false,
      maxVisible: 10,
      sortBy: 'remaining-time',
      showTypeBadges: true,
      compactMode: false,
    },
    uiState: {
      selectedTypeFilter: 'all',
      telemetryPanelOpen: false,
      position: 'top',
    },
    metadata: {
      lastSaved: Date.now(),
      version: '1.0.0',
    },
  },
  HUD_PERSISTENCE_KEY: 'idle-village-hud-state',
  createDebouncedHUDSave: vi.fn(() => vi.fn()),
}));

describe('HUD Persistence', () => {
  const mockLoadData = vi.mocked(loadData);
  const mockSaveData = vi.mocked(saveData);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Persistence Helpers', () => {
    describe('loadHUDState', () => {
      it('should load and return saved HUD state', async () => {
        const savedState = {
          ...DEFAULT_HUD_PERSISTENCE_STATE,
          preferences: { ...DEFAULT_HUD_PERSISTENCE_STATE.preferences, collapsed: true },
        };

        mockLoadData.mockResolvedValue(savedState);

        const result = await loadHUDState();
        expect(result).toEqual(savedState);
        expect(mockLoadData).toHaveBeenCalledWith(HUD_PERSISTENCE_KEY, DEFAULT_HUD_PERSISTENCE_STATE);
      });

      it('should return defaults when loading fails', async () => {
        mockLoadData.mockRejectedValue(new Error('Storage error'));

        const result = await loadHUDState();
        expect(result).toEqual(DEFAULT_HUD_PERSISTENCE_STATE);
      });

      it('should migrate old state without metadata', async () => {
        const oldState = {
          preferences: { collapsed: true },
          uiState: { selectedTypeFilter: 'job' },
        };

        mockLoadData.mockResolvedValue(oldState);

        const result = await loadHUDState();
        expect(result.preferences.collapsed).toBe(true);
        expect(result.uiState.selectedTypeFilter).toBe('job');
        expect(result.metadata.version).toBe(DEFAULT_HUD_PERSISTENCE_STATE.metadata.version);
      });
    });

    describe('saveHUDState', () => {
      it('should save HUD state with updated timestamp', async () => {
        const stateToSave = { ...DEFAULT_HUD_PERSISTENCE_STATE };
        const beforeSave = Date.now();

        await saveHUDState(stateToSave);

        expect(mockSaveData).toHaveBeenCalledWith(HUD_PERSISTENCE_KEY, expect.objectContaining({
          metadata: expect.objectContaining({
            lastSaved: expect.any(Number),
            version: '1.0.0',
          }),
        }));

        const savedState = mockSaveData.mock.calls[0][1];
        expect(savedState.metadata.lastSaved).toBeGreaterThanOrEqual(beforeSave);
      });

      it('should handle save errors gracefully', async () => {
        mockSaveData.mockRejectedValue(new Error('Save failed'));

        // Should not throw
        await expect(saveHUDState(DEFAULT_HUD_PERSISTENCE_STATE)).resolves.toBeUndefined();
      });
    });

    describe('resetHUDState', () => {
      it('should save default state', async () => {
        await resetHUDState();

        expect(mockSaveData).toHaveBeenCalledWith(HUD_PERSISTENCE_KEY, DEFAULT_HUD_PERSISTENCE_STATE);
      });
    });

    describe('serializeHUDState and deserializeHUDState', () => {
      it('should serialize and deserialize HUD state correctly', () => {
        const state = { ...DEFAULT_HUD_PERSISTENCE_STATE };
        const serialized = serializeHUDState(state);
        const deserialized = deserializeHUDState(serialized);

        expect(deserialized).toEqual(state);
      });

      it('should handle invalid JSON gracefully', () => {
        const deserialized = deserializeHUDState('invalid json');

        expect(deserialized).toEqual(DEFAULT_HUD_PERSISTENCE_STATE);
      });
    });
  });

  describe('useActiveHUDState Hook', () => {
    const mockConfig = {
      activities: {
        'job-1': {
          label: 'Test Job',
          tags: ['job'],
          metadata: { icon: '🔧' },
        },
        'quest-1': {
          label: 'Test Quest',
          tags: ['quest'],
          metadata: { icon: '⚔️' },
        },
      },
    } as any;

    const mockVillageState = {
      activities: {
        'act-1': {
          id: 'act-1',
          activityId: 'job-1',
          characterIds: ['char-1'],
          slotId: 'slot-1',
          startTime: 0,
          endTime: 100,
          status: 'running' as const,
        },
      },
      residents: {
        'char-1': {
          id: 'char-1',
          displayName: 'Test Character',
        },
      },
    } as any;

    const mockProps = {
      config: mockConfig,
      villageState: mockVillageState,
      secondsPerTimeUnit: 1,
      currentTime: 50,
      getActivityState: vi.fn(() => ({ status: 'running' as const })),
    };

    beforeEach(() => {
      vi.mocked(loadHUDState).mockResolvedValue(DEFAULT_HUD_PERSISTENCE_STATE);
    });

    it('should load persisted state on mount', async () => {
      const customState = {
        ...DEFAULT_HUD_PERSISTENCE_STATE,
        preferences: { ...DEFAULT_HUD_PERSISTENCE_STATE.preferences, maxVisible: 5 },
      };

      vi.mocked(loadHUDState).mockResolvedValue(customState);

      const { result } = renderHook(() => useActiveHUDState(mockProps));

      await waitFor(() => {
        expect(result.current.persistence.preferences.maxVisible).toBe(5);
      });
    });

    it('should provide default state when loading fails', async () => {
      vi.mocked(loadHUDState).mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useActiveHUDState(mockProps));

      await waitFor(() => {
        expect(result.current.persistence).toEqual(DEFAULT_HUD_PERSISTENCE_STATE);
      });
    });

    it('should update preferences', async () => {
      const { result } = renderHook(() => useActiveHUDState(mockProps));

      await waitFor(() => {
        expect(result.current.updatePreferences).toBeDefined();
      });

      act(() => {
        result.current.updatePreferences({ collapsed: true, maxVisible: 5 });
      });

      expect(result.current.persistence.preferences.collapsed).toBe(true);
      expect(result.current.persistence.preferences.maxVisible).toBe(5);
    });

    it('should update UI state', async () => {
      const { result } = renderHook(() => useActiveHUDState(mockProps));

      await waitFor(() => {
        expect(result.current.updateUIState).toBeDefined();
      });

      act(() => {
        result.current.updateUIState({ selectedTypeFilter: 'quest', telemetryPanelOpen: true });
      });

      expect(result.current.persistence.uiState.selectedTypeFilter).toBe('quest');
      expect(result.current.persistence.uiState.telemetryPanelOpen).toBe(true);
    });

    it('should reset preferences to defaults', async () => {
      const { result } = renderHook(() => useActiveHUDState(mockProps));

      await waitFor(() => {
        expect(result.current.resetPreferences).toBeDefined();
      });

      // First modify state
      act(() => {
        result.current.updatePreferences({ collapsed: true });
      });

      expect(result.current.persistence.preferences.collapsed).toBe(true);

      // Then reset
      act(() => {
        result.current.resetPreferences();
      });

      expect(result.current.persistence).toEqual(DEFAULT_HUD_PERSISTENCE_STATE);
    });

    it('should force save state', async () => {
      const { result } = renderHook(() => useActiveHUDState(mockProps));

      await waitFor(() => {
        expect(result.current.saveState).toBeDefined();
      });

      await act(async () => {
        await result.current.saveState();
      });

      expect(saveHUDState).toHaveBeenCalledWith(result.current.persistence);
    });

    it('should apply maxVisible limit to activities', async () => {
      // Create mock with multiple activities
      const multiActivityState = {
        ...mockVillageState,
        activities: {
          'act-1': { ...mockVillageState.activities['act-1'] },
          'act-2': { ...mockVillageState.activities['act-1'], id: 'act-2' },
          'act-3': { ...mockVillageState.activities['act-1'], id: 'act-3' },
        },
      };

      const { result } = renderHook(() =>
        useActiveHUDState({ ...mockProps, villageState: multiActivityState })
      );

      await waitFor(() => {
        expect(result.current.activities).toBeDefined();
      });

      // Update maxVisible to 2
      act(() => {
        result.current.updatePreferences({ maxVisible: 2 });
      });

      expect(result.current.activities).toHaveLength(2);
    });

    it('should sort activities by preference', async () => {
      const { result } = renderHook(() => useActiveHUDState(mockProps));

      await waitFor(() => {
        expect(result.current.activities).toBeDefined();
      });

      // Test different sort options
      act(() => {
        result.current.updatePreferences({ sortBy: 'activity-type' });
      });

      expect(result.current.persistence.preferences.sortBy).toBe('activity-type');

      act(() => {
        result.current.updatePreferences({ sortBy: 'progress' });
      });

      expect(result.current.persistence.preferences.sortBy).toBe('progress');
    });

    it('should calculate activity counts correctly', async () => {
      const mixedActivityState = {
        ...mockVillageState,
        activities: {
          'act-job': {
            id: 'act-job',
            activityId: 'job-1',
            characterIds: ['char-1'],
            slotId: 'slot-1',
            startTime: 0,
            endTime: 100,
            status: 'running' as const,
          },
          'act-quest': {
            id: 'act-quest',
            activityId: 'quest-1',
            characterIds: ['char-2'],
            slotId: 'slot-2',
            startTime: 0,
            endTime: 100,
            status: 'running' as const,
          },
        },
        residents: {
          'char-1': { id: 'char-1', displayName: 'Worker' },
          'char-2': { id: 'char-2', displayName: 'Hero' },
        },
      };

      const { result } = renderHook(() =>
        useActiveHUDState({ ...mockProps, villageState: mixedActivityState })
      );

      await waitFor(() => {
        expect(result.current.counts).toBeDefined();
      });

      expect(result.current.counts.jobs).toBe(1);
      expect(result.current.counts.quests).toBe(1);
      expect(result.current.counts.maintenance).toBe(0);
      expect(result.current.counts.total).toBe(2);
    });

    it('should handle empty activities gracefully', async () => {
      const emptyVillageState = {
        activities: {},
        residents: {},
      } as any;

      const { result } = renderHook(() =>
        useActiveHUDState({ ...mockProps, villageState: emptyVillageState })
      );

      await waitFor(() => {
        expect(result.current.activities).toEqual([]);
        expect(result.current.counts.total).toBe(0);
        expect(result.current.hasActiveActivities).toBe(false);
      });
    });
  });

  describe('Persistence Integration', () => {
    it('should save state when preferences change', async () => {
      vi.mocked(loadHUDState).mockResolvedValue(DEFAULT_HUD_PERSISTENCE_STATE);

      const { result } = renderHook(() => useActiveHUDState({
        config: {} as any,
        villageState: { activities: {}, residents: {} } as any,
        secondsPerTimeUnit: 1,
        currentTime: 0,
        getActivityState: vi.fn(),
      }));

      await waitFor(() => {
        expect(result.current.updatePreferences).toBeDefined();
      });

      act(() => {
        result.current.updatePreferences({ collapsed: true });
      });

      // Wait for debounced save
      await waitFor(() => {
        expect(saveHUDState).toHaveBeenCalled();
      });
    });

    it('should handle persistence errors gracefully', async () => {
      vi.mocked(loadHUDState).mockRejectedValue(new Error('Load failed'));
      vi.mocked(saveHUDState).mockRejectedValue(new Error('Save failed'));

      const { result } = renderHook(() => useActiveHUDState({
        config: {} as any,
        villageState: { activities: {}, residents: {} } as any,
        secondsPerTimeUnit: 1,
        currentTime: 0,
        getActivityState: vi.fn(),
      }));

      // Should not crash even with persistence errors
      await waitFor(() => {
        expect(result.current.persistence).toBeDefined();
      });

      act(() => {
        result.current.updatePreferences({ collapsed: true });
      });

      // Should continue to work despite save errors
      expect(result.current.persistence.preferences.collapsed).toBe(true);
    });
  });

  describe('Activity Filtering and Display', () => {
    const mockConfig = {
      activities: {
        'job-1': { label: 'Farming', tags: ['job'] },
        'quest-1': { label: 'Quest', tags: ['quest'] },
        'maintenance-1': { label: 'Repair', tags: ['maintenance'] },
      },
    } as any;

    const mockVillageState = {
      activities: {
        'act-job': {
          id: 'act-job',
          activityId: 'job-1',
          characterIds: ['char-1'],
          slotId: 'slot-1',
          startTime: 0,
          endTime: 100,
          status: 'running' as const,
        },
        'act-quest': {
          id: 'act-quest',
          activityId: 'quest-1',
          characterIds: ['char-2'],
          slotId: 'slot-2',
          startTime: 0,
          endTime: 100,
          status: 'running' as const,
        },
        'act-maintenance': {
          id: 'act-maintenance',
          activityId: 'maintenance-1',
          characterIds: ['char-3'],
          slotId: 'slot-3',
          startTime: 0,
          endTime: 100,
          status: 'running' as const,
        },
      },
      residents: {
        'char-1': { id: 'char-1', displayName: 'Farmer' },
        'char-2': { id: 'char-2', displayName: 'Hero' },
        'char-3': { id: 'char-3', displayName: 'Engineer' },
      },
    } as any;

    it('should respect maxVisible preference', async () => {
      const { result } = renderHook(() =>
        useActiveHUDState({
          config: mockConfig,
          villageState: mockVillageState,
          secondsPerTimeUnit: 1,
          currentTime: 50,
          getActivityState: vi.fn(() => ({ status: 'running' as const })),
        })
      );

      await waitFor(() => {
        expect(result.current.activities).toHaveLength(10); // Default maxVisible
      });

      act(() => {
        result.current.updatePreferences({ maxVisible: 2 });
      });

      expect(result.current.activities).toHaveLength(2);
    });

    it('should sort by activity type when configured', async () => {
      const { result } = renderHook(() =>
        useActiveHUDState({
          config: mockConfig,
          villageState: mockVillageState,
          secondsPerTimeUnit: 1,
          currentTime: 50,
          getActivityState: vi.fn(() => ({ status: 'running' as const })),
        })
      );

      await waitFor(() => {
        expect(result.current.activities).toBeDefined();
      });

      act(() => {
        result.current.updatePreferences({ sortBy: 'activity-type' });
      });

      // Should be sorted: quest, maintenance, job
      const types = result.current.activities.map(a => a.activityType);
      expect(types).toEqual(['quest', 'maintenance', 'job']);
    });

    it('should sort by progress when configured', async () => {
      const { result } = renderHook(() =>
        useActiveHUDState({
          config: mockConfig,
          villageState: mockVillageState,
          secondsPerTimeUnit: 1,
          currentTime: 50,
          getActivityState: vi.fn(() => ({ status: 'running' as const })),
        })
      );

      await waitFor(() => {
        expect(result.current.activities).toBeDefined();
      });

      act(() => {
        result.current.updatePreferences({ sortBy: 'progress' });
      });

      // All activities should have same progress (0.5), so order shouldn't change much
      expect(result.current.activities).toHaveLength(3);
    });
  });
});
