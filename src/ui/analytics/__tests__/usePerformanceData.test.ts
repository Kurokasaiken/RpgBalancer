import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePerformanceData } from '../hooks/usePerformanceData';
import type { TimeTrackingData, DashboardFilters } from '../types';

// Mock fetch
global.fetch = vi.fn();

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

describe('usePerformanceData', () => {
  const mockTimeData: TimeTrackingData = {
    entries: [
      {
        taskId: 'KS-001',
        taskDescription: 'Test Task',
        agent: 'Test Agent',
        startTime: '2026-01-07T10:00:00.000Z',
        endTime: '2026-01-07T11:00:00.000Z',
        duration: 60,
        estimatedDuration: 50,
        category: 'development',
        status: 'completed',
        notes: 'Test notes',
        createdAt: '2026-01-07T10:00:00.000Z',
        updatedAt: '2026-01-07T11:00:00.000Z'
      }
    ],
    metadata: {
      version: '1.0.0',
      lastUpdated: '2026-01-08T00:00:00.000Z',
      totalTasks: 1,
      totalCompletedTasks: 1,
      totalTrackedMinutes: 60
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTimeData
    } as Response);

    const { result } = renderHook(() => usePerformanceData());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockTimeData);
    expect(result.current.error).toBe(null);
    expect(result.current.metrics).not.toBeNull();
  });

  it('should handle fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    } as Response);

    const { result } = renderHook(() => usePerformanceData());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Failed to load time tracking data: 404');
    expect(result.current.metrics).toBe(null);
  });

  it('should filter entries by agent', async () => {
    const dataWithMultipleAgents: TimeTrackingData = {
      entries: [
        { ...mockTimeData.entries[0], agent: 'Agent1' },
        { ...mockTimeData.entries[0], taskId: 'KS-002', agent: 'Agent2' }
      ],
      metadata: mockTimeData.metadata
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithMultipleAgents
    } as Response);

    const filters: DashboardFilters = { agent: 'Agent1' };
    const { result } = renderHook(() => usePerformanceData(filters));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0].agent).toBe('Agent1');
  });

  it('should filter entries by category', async () => {
    const dataWithMultipleCategories: TimeTrackingData = {
      entries: [
        { ...mockTimeData.entries[0], category: 'development' },
        { ...mockTimeData.entries[0], taskId: 'KS-002', category: 'testing' }
      ],
      metadata: mockTimeData.metadata
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithMultipleCategories
    } as Response);

    const filters: DashboardFilters = { category: 'development' };
    const { result } = renderHook(() => usePerformanceData(filters));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0].category).toBe('development');
  });

  it('should filter entries by status', async () => {
    const dataWithMultipleStatuses: TimeTrackingData = {
      entries: [
        { ...mockTimeData.entries[0], status: 'completed' },
        { ...mockTimeData.entries[0], taskId: 'KS-002', status: 'in_progress' }
      ],
      metadata: mockTimeData.metadata
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithMultipleStatuses
    } as Response);

    const filters: DashboardFilters = { status: 'completed' };
    const { result } = renderHook(() => usePerformanceData(filters));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.filteredEntries).toHaveLength(1);
    expect(result.current.filteredEntries[0].status).toBe('completed');
  });

  it('should calculate metrics correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTimeData
    } as Response);

    const { result } = renderHook(() => usePerformanceData());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const metrics = result.current.metrics;
    expect(metrics).not.toBeNull();
    expect(metrics!.totalTasks).toBe(1);
    expect(metrics!.completedTasks).toBe(1);
    expect(metrics!.completionRate).toBe(100);
    expect(metrics!.totalTrackedMinutes).toBe(60);
    expect(metrics!.averageDuration).toBe(60);
  });

  it('should handle refetch', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTimeData
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockTimeData, metadata: { ...mockTimeData.metadata, totalTasks: 2 } })
      } as Response);

    const { result } = renderHook(() => usePerformanceData());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data?.metadata.totalTasks).toBe(1);

    await act(async () => {
      result.current.refetch();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data?.metadata.totalTasks).toBe(2);
  });

  it('should handle empty data', async () => {
    const emptyData: TimeTrackingData = {
      entries: [],
      metadata: {
        version: '1.0.0',
        lastUpdated: '2026-01-08T00:00:00.000Z',
        totalTasks: 0,
        totalCompletedTasks: 0,
        totalTrackedMinutes: 0
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => emptyData
    } as Response);

    const { result } = renderHook(() => usePerformanceData());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.metrics).toBeNull();
    expect(result.current.filteredEntries).toHaveLength(0);
  });
});
