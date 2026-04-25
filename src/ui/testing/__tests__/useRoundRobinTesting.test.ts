import { describe, it, expect, vi, beforeEach, type MockedClass } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoundRobinTesting } from '../useRoundRobinTesting';
import type { BalancerConfig } from '@/balancing/config/types';

// Mock dependencies
vi.mock('@/balancing/hooks/useBalancerConfig', () => ({
  useBalancerConfig: vi.fn(() => ({
    config: { stats: {}, globalRules: {}, activities: {}, questTypes: {}, mapSlots: {}, resources: {} },
    updateStat: vi.fn(),
  })),
}));

vi.mock('@/balancing/testing/RoundRobinRunner', () => ({
  RoundRobinRunner: vi.fn().mockImplementation(() => ({
    runRoundRobin: vi.fn(),
    runAllTiers: vi.fn(),
  })),
}));

const { RoundRobinRunner } = await import('@/balancing/testing/RoundRobinRunner');

type MockRunnerInstance = {
  runRoundRobin: ReturnType<typeof vi.fn>;
  runAllTiers: ReturnType<typeof vi.fn>;
};

describe('useRoundRobinTesting', () => {
  let mockRunner: MockRunnerInstance;
  let RoundRobinRunnerMock: MockedClass<typeof RoundRobinRunner>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRunner = {
      runRoundRobin: vi.fn(),
      runAllTiers: vi.fn(),
    };
    RoundRobinRunnerMock = RoundRobinRunner as MockedClass<typeof RoundRobinRunner>;
    RoundRobinRunnerMock.mockImplementation(function() {
      return mockRunner as unknown as InstanceType<typeof RoundRobinRunner>;
    });
  });

  const mockConfig: BalancerConfig = {
    stats: {},
    version: '1.0.0',
    cards: {},
    presets: {},
    activePresetId: '',
  };

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRoundRobinTesting(mockConfig));

    expect(result.current.aggregatedResults).toBeNull();
    expect(result.current.currentResults).toBeNull();
    expect(result.current.selectedTier).toBeNull();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.runAllTiers).toBe('function');
    expect(typeof result.current.setSelectedTier).toBe('function');
  });

  it('should run all tiers and update state', async () => {
    const mockResults = {
      byTier: {},
      aggregatedEfficiencies: [],
      tiers: [25, 50],
      iterations: 1000,
      timestamp: Date.now(),
    };

    mockRunner.runAllTiers.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useRoundRobinTesting(mockConfig));

    await act(async () => {
      await result.current.runAllTiers(1000);
    });

    expect(mockRunner.runAllTiers).toHaveBeenCalledWith(
      expect.any(Object), // StatsArchetypeGenerator
      [25, 50, 75, 100],
      1000,
      123456
    );
    expect(result.current.aggregatedResults).toEqual(mockResults);
    expect(result.current.isRunning).toBe(false);
  });

  it('should handle errors during testing', async () => {
    const mockError = new Error('Test failed');
    mockRunner.runAllTiers.mockRejectedValue(mockError);

    const { result } = renderHook(() => useRoundRobinTesting(mockConfig));

    await act(async () => {
      await result.current.runAllTiers(1000);
    });

    expect(result.current.error).toBe(mockError.message);
    expect(result.current.isRunning).toBe(false);
  });

  it('should set selected tier', () => {
    const { result } = renderHook(() => useRoundRobinTesting(mockConfig));

    act(() => {
      result.current.setSelectedTier(25);
    });

    expect(result.current.selectedTier).toBe(25);
  });

  it('should compute currentResults based on selectedTier', async () => {
    const mockResults = {
      byTier: {
        25: { efficiencies: [{ statId: 'hp', efficiency: 0.6 }] },
        50: { efficiencies: [{ statId: 'hp', efficiency: 0.7 }] },
      },
      aggregatedEfficiencies: [{ statId: 'hp', efficiency: 0.65 }],
      tiers: [25, 50],
      iterations: 1000,
      timestamp: Date.now(),
    };

    mockRunner.runAllTiers.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useRoundRobinTesting(mockConfig));

    // First run the tests to populate results
    await act(async () => {
      await result.current.runAllTiers(1000);
    });

    // Now test tier selection
    act(() => {
      result.current.setSelectedTier(25);
    });

    expect(result.current.currentResults).toEqual(mockResults.byTier[25]);

    act(() => {
      result.current.setSelectedTier(null);
    });

    expect(result.current.currentResults).toEqual({
      matchups: [],
      efficiencies: mockResults.aggregatedEfficiencies,
      tier: 0,
      iterations: mockResults.iterations,
      timestamp: mockResults.timestamp,
    });
  });
});
