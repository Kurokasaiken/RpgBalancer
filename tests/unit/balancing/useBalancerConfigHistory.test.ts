/**
 * Integration tests for useBalancerConfig hook with history functionality
 * Tests stat changes, undo/redo operations, and history persistence
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBalancerConfig } from '../../../src/balancing/hooks/useBalancerConfig';
import { BalancerConfigStore } from '../../../src/balancing/config/BalancerConfigStore';
import { BalancerHistoryStore, defaultHistoryStore } from '../../../src/balancing/config/BalancerHistoryStore';
import type { BalancerConfig, StatDefinition } from '../../../src/balancing/config/types';
import BALANCER_DEFAULT_JSON from '../../../src/balancing/config/balancer-default-config.json';

// Mock stores
vi.mock('../../../src/balancing/config/BalancerConfigStore');
vi.mock('../../../src/balancing/config/BalancerHistoryStore');

const mockBalancerConfigStore = vi.mocked(BalancerConfigStore);
const mockHistoryStore = vi.mocked(BalancerHistoryStore);
const mockDefaultHistoryStore = vi.mocked(defaultHistoryStore);

describe('useBalancerConfig History Integration', () => {
  let mockConfig: BalancerConfig;
  let mockHistoryStoreInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockConfig = BALANCER_DEFAULT_JSON as unknown as BalancerConfig;

    // Mock BalancerConfigStore
    mockBalancerConfigStore.load = vi.fn().mockResolvedValue(mockConfig);
    mockBalancerConfigStore.save = vi.fn().mockResolvedValue(undefined);
    mockBalancerConfigStore.export = vi.fn().mockReturnValue(JSON.stringify(mockConfig));
    mockBalancerConfigStore.import = vi.fn().mockResolvedValue(undefined);
    mockBalancerConfigStore.reset = vi.fn().mockResolvedValue(undefined);
    mockBalancerConfigStore.getHistory = vi.fn().mockReturnValue([]);

    // Mock BalancerHistoryStore
    mockHistoryStoreInstance = {
      initialize: vi.fn().mockResolvedValue(undefined),
      pushSnapshot: vi.fn().mockResolvedValue(undefined),
      undo: vi.fn().mockResolvedValue(mockConfig),
      redo: vi.fn().mockResolvedValue(mockConfig),
      getState: vi.fn().mockReturnValue({
        snapshots: [],
        currentIndex: -1,
        canUndo: false,
        canRedo: false,
      }),
      getHistory: vi.fn().mockReturnValue([]),
      clear: vi.fn().mockResolvedValue(undefined),
      getCurrentConfig: vi.fn().mockReturnValue(null),
      getStorageStats: vi.fn().mockReturnValue({
        snapshotCount: 0,
        currentIndex: -1,
        canUndo: false,
        canRedo: false,
        oldestTimestamp: null,
        newestTimestamp: null,
      }),
    };

    mockDefaultHistoryStore.mockImplementation(() => mockHistoryStoreInstance);
  });

  it('should initialize history store on mount', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.history).toEqual([]);
  });

  it('should add snapshot when stat is added', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    const newStat: Omit<StatDefinition, 'isCore'> = {
      id: 'test-stat',
      label: 'Test Stat',
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 50,
      weight: 1.0,
      isDerived: false,
    };

    act(() => {
      const addResult = result.current.addStat('core', newStat);
      expect(addResult.success).toBe(true);
    });

    expect(mockHistoryStoreInstance.pushSnapshot).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('Added stat')
    );
  });

  it('should add snapshot when stat is updated', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    act(() => {
      const updateResult = result.current.updateStat('hp', { weight: 1.5 });
      expect(updateResult.success).toBe(true);
    });

    expect(mockHistoryStoreInstance.pushSnapshot).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('Updated')
    );
  });

  it('should add snapshot when stat is deleted', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    // First add a non-core stat to delete
    const newStat: Omit<StatDefinition, 'isCore'> = {
      id: 'temp-stat',
      label: 'Temp Stat',
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 50,
      weight: 1.0,
      isDerived: false,
    };

    act(() => {
      result.current.addStat('core', newStat);
    });

    act(() => {
      const deleteResult = result.current.deleteStat('temp-stat');
      expect(deleteResult.success).toBe(true);
    });

    expect(mockHistoryStoreInstance.pushSnapshot).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('Removed stat')
    );
  });

  it('should add snapshot when card is added', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    act(() => {
      const addResult = result.current.addCard({
        id: 'test-card',
        title: 'Test Card',
        color: '#ff0000',
        statIds: [],
      });
      expect(addResult.success).toBe(true);
    });

    expect(mockHistoryStoreInstance.pushSnapshot).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('Added card')
    );
  });

  it('should add snapshot when preset is switched', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    act(() => {
      result.current.switchPreset('default');
    });

    expect(mockHistoryStoreInstance.pushSnapshot).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('Switched preset')
    );
  });

  it('should undo configuration change', async () => {
    const previousConfig = { ...mockConfig, version: '1.0.0' };
    mockHistoryStoreInstance.undo.mockResolvedValue(previousConfig);
    mockHistoryStoreInstance.getState.mockReturnValue({
      snapshots: [],
      currentIndex: 0,
      canUndo: true,
      canRedo: true,
    });

    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(mockHistoryStoreInstance.undo).toHaveBeenCalled();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);
  });

  it('should redo configuration change', async () => {
    const nextConfig = { ...mockConfig, version: '2.0.0' };
    mockHistoryStoreInstance.redo.mockResolvedValue(nextConfig);
    mockHistoryStoreInstance.getState.mockReturnValue({
      snapshots: [],
      currentIndex: -1,
      canUndo: false,
      canRedo: false,
    });

    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.redo();
    });

    expect(mockHistoryStoreInstance.redo).toHaveBeenCalled();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should update history state after undo/redo', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    // Simulate undo state change
    mockHistoryStoreInstance.undo.mockResolvedValue(mockConfig);
    mockHistoryStoreInstance.getState.mockReturnValue({
      snapshots: [
        {
          timestamp: Date.now(),
          config: mockConfig,
          description: 'Previous state',
        },
      ],
      currentIndex: 0,
      canUndo: true,
      canRedo: true,
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);
  });

  it('should handle undo when not available', async () => {
    mockHistoryStoreInstance.undo.mockResolvedValue(null);
    mockHistoryStoreInstance.getState.mockReturnValue({
      snapshots: [],
      currentIndex: 2,
      canUndo: false,
      canRedo: false,
    });

    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(mockHistoryStoreInstance.undo).toHaveBeenCalled();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should handle redo when not available', async () => {
    mockHistoryStoreInstance.redo.mockResolvedValue(null);
    mockHistoryStoreInstance.getState.mockReturnValue({
      snapshots: [],
      currentIndex: -1,
      canUndo: false,
      canRedo: false,
    });

    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.redo();
    });

    expect(mockHistoryStoreInstance.redo).toHaveBeenCalled();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should add snapshot on config reset', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.resetConfig();
    });

    expect(mockHistoryStoreInstance.pushSnapshot).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('Reset')
    );
  });

  it('should add snapshot on config import', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    const importJson = JSON.stringify(mockConfig);

    await act(async () => {
      const importResult = await result.current.importConfig(importJson);
      expect(importResult.success).toBe(true);
    });

    expect(mockHistoryStoreInstance.pushSnapshot).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('Imported')
    );
  });

  it('should handle import errors without adding snapshot', async () => {
    mockBalancerConfigStore.import.mockRejectedValue(new Error('Invalid JSON'));

    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    await act(async () => {
      const importResult = await result.current.importConfig('invalid json');
      expect(importResult.success).toBe(false);
    });

    expect(mockHistoryStoreInstance.pushSnapshot).not.toHaveBeenCalled();
  });

  it('should add snapshot on stat reset to initial', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    await act(async () => {
      const resetResult = await result.current.resetStatToInitial('hp');
      expect(resetResult.success).toBe(true);
    });

    expect(mockHistoryStoreInstance.pushSnapshot).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('Reset stat')
    );
  });

  it('should add snapshot on card reset to initial', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    await act(async () => {
      const resetResult = await result.current.resetCardToInitial('core');
      expect(resetResult.success).toBe(true);
    });

    expect(mockHistoryStoreInstance.pushSnapshot).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('Reset card')
    );
  });

  it('should handle stat reset errors without adding snapshot', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    await act(async () => {
      const resetResult = await result.current.resetStatToInitial('nonexistent');
      expect(resetResult.success).toBe(false);
    });

    expect(mockHistoryStoreInstance.pushSnapshot).not.toHaveBeenCalled();
  });

  it('should handle card reset errors without adding snapshot', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    await act(async () => {
      const resetResult = await result.current.resetCardToInitial('nonexistent');
      expect(resetResult.success).toBe(false);
    });

    expect(mockHistoryStoreInstance.pushSnapshot).not.toHaveBeenCalled();
  });

  it('should update history when history store state changes', async () => {
    const { result } = renderHook(() => useBalancerConfig());

    await waitFor(() => {
      expect(mockHistoryStoreInstance.initialize).toHaveBeenCalled();
    });

    // Simulate history store state change
    const mockHistory = [
      {
        timestamp: Date.now(),
        config: mockConfig,
        description: 'Test snapshot',
      },
    ];

    mockHistoryStoreInstance.getHistory.mockReturnValue(mockHistory);

    // Trigger a state update
    act(() => {
      result.current.addStat('core', {
        id: 'test',
        label: 'Test',
        type: 'number',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        weight: 1.0,
        isDerived: false,
      });
    });

    expect(result.current.history).toEqual(mockHistory);
  });
});
