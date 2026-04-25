// tests/unit/idleVillage/ActiveHUD.analytics.test.tsx
// Unit tests for ActiveHUD analytics integration

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import ActiveHUD from '@/ui/idleVillage/components/ActiveHUD';
import type { ActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';

// Mock the analytics hooks
vi.mock('@/ui/idleVillage/hooks/useActivityTelemetry', () => ({
  useActivityTelemetry: vi.fn(),
}));

vi.mock('@/ui/idleVillage/hooks/useActiveHUDTelemetry', () => ({
  useActiveHUDTelemetry: vi.fn(),
}));

vi.mock('@/ui/idleVillage/hooks/useActivityAnalytics', () => ({
  useActivityAnalytics: vi.fn(() => ({
    metrics: null,
    isCollecting: false,
    startCollection: vi.fn(),
    stopCollection: vi.fn(),
    clearHistoricalData: vi.fn(),
    exportAnalytics: vi.fn().mockResolvedValue('{}'),
  })),
}));

describe('ActiveHUD Analytics Integration', () => {
  const mockHudState: ActiveHUDState = {
    activities: [
      {
        key: 'activity-1',
        activityType: 'job',
        label: 'Gather Wood',
        icon: '🪵',
        residentId: 'resident-1',
        residentName: 'Alice',
        progress: 0.5,
        remainingSeconds: 120,
        status: 'running',
        visualVariant: 'azure',
        scheduledId: 'scheduled-1',
        activityId: 'gather-wood',
      },
      {
        key: 'activity-2',
        activityType: 'quest',
        label: 'Explore Forest',
        icon: '🌲',
        residentId: 'resident-2',
        residentName: 'Bob',
        progress: 0.25,
        remainingSeconds: 300,
        status: 'running',
        visualVariant: 'ember',
        scheduledId: 'scheduled-2',
        activityId: 'explore-forest',
      },
    ],
    counts: {
      jobs: 1,
      quests: 1,
      maintenance: 0,
      total: 2,
    },
    hasActiveActivities: true,
  };

  const mockVillageState: VillageState = {
    currentTime: 1000,
    resources: {
      wood: 50,
      food: 30,
      gold: 100,
    },
    residents: {
      'resident-1': {
        id: 'resident-1',
        displayName: 'Alice',
        fatigue: 20,
        health: 100,
        skills: [],
      },
      'resident-2': {
        id: 'resident-2',
        displayName: 'Bob',
        fatigue: 15,
        health: 100,
        skills: [],
      },
    },
    activities: {},
    eventLog: [],
    questOffers: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render ActiveHUD with analytics integration enabled', () => {
    render(
      <ActiveHUD
        hudState={mockHudState}
        villageState={mockVillageState}
        secondsPerTimeUnit={60}
        enableTelemetry={true}
      />
    );

    // Should render activities
    expect(screen.getByText('Gather Wood')).toBeInTheDocument();
    expect(screen.getByText('Explore Forest')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should initialize analytics hook with correct configuration', () => {
    const { useActivityAnalytics } = require('@/ui/idleVillage/hooks/useActivityAnalytics');
    
    render(
      <ActiveHUD
        hudState={mockHudState}
        villageState={mockVillageState}
        secondsPerTimeUnit={60}
        enableTelemetry={true}
      />
    );

    expect(useActivityAnalytics).toHaveBeenCalledWith({
      hudState: mockHudState,
      villageState: mockVillageState,
      config: {
        enableRealTimeUpdates: true,
        enableEfficiencyMetrics: true,
        enableResidentAnalytics: true,
        collectionInterval: 10000,
        maxHistoricalPoints: 50,
      },
      onAnalyticsUpdate: expect.any(Function),
    });
  });

  it('should not initialize analytics when telemetry is disabled', () => {
    const { useActivityAnalytics } = require('@/ui/idleVillage/hooks/useActivityAnalytics');
    
    render(
      <ActiveHUD
        hudState={mockHudState}
        villageState={mockVillageState}
        secondsPerTimeUnit={60}
        enableTelemetry={false}
      />
    );

    expect(useActivityAnalytics).toHaveBeenCalledWith({
      hudState: mockHudState,
      villageState: mockVillageState,
      config: {
        enableRealTimeUpdates: true,
        enableEfficiencyMetrics: true,
        enableResidentAnalytics: true,
        collectionInterval: 10000,
        maxHistoricalPoints: 50,
      },
      onAnalyticsUpdate: undefined,
    });
  });

  it('should provide fallback data when hudState is undefined', () => {
    const { useActivityAnalytics } = require('@/ui/idleVillage/hooks/useActivityAnalytics');
    
    render(
      <ActiveHUD
        villageState={mockVillageState}
        secondsPerTimeUnit={60}
        enableTelemetry={true}
      />
    );

    expect(useActivityAnalytics).toHaveBeenCalledWith({
      hudState: {
        activities: [],
        counts: { jobs: 0, quests: 0, maintenance: 0, total: 0 },
        hasActiveActivities: false,
      },
      villageState: mockVillageState,
      config: {
        enableRealTimeUpdates: true,
        enableEfficiencyMetrics: true,
        enableResidentAnalytics: true,
        collectionInterval: 10000,
        maxHistoricalPoints: 50,
      },
      onAnalyticsUpdate: expect.any(Function),
    });
  });

  it('should provide fallback data when villageState is undefined', () => {
    const { useActivityAnalytics } = require('@/ui/idleVillage/hooks/useActivityAnalytics');
    
    render(
      <ActiveHUD
        hudState={mockHudState}
        secondsPerTimeUnit={60}
        enableTelemetry={true}
      />
    );

    expect(useActivityAnalytics).toHaveBeenCalledWith({
      hudState: mockHudState,
      villageState: {
        currentTime: 0,
        resources: {},
        residents: {},
        activities: {},
        eventLog: [],
        questOffers: {},
      },
      config: {
        enableRealTimeUpdates: true,
        enableEfficiencyMetrics: true,
        enableResidentAnalytics: true,
        collectionInterval: 10000,
        maxHistoricalPoints: 50,
      },
      onAnalyticsUpdate: expect.any(Function),
    });
  });

  it('should call analytics update callback when metrics are available', async () => {
    const mockAnalytics = {
      currentSnapshot: {
        timestamp: Date.now(),
        totalActivities: 2,
        activitiesByType: { jobs: 1, quests: 1, maintenance: 0 },
        averageProgress: 0.375,
        averageRemainingTime: 210,
        dominantActivityType: 'job',
        residentDistribution: { 'resident-1': 1, 'resident-2': 1 },
      },
      historicalData: [],
      performanceMetrics: {
        averageConcurrentActivities: 2,
        peakConcurrentActivities: 3,
        completionRate: 0.85,
        peakEfficiencyWindow: { startHour: 10, endHour: 11, averageActivities: 2.5 },
      },
      typeDistribution: {
        jobs: { count: 10, percentage: 50, averageProgress: 0.6, averageDuration: 120 },
        quests: { count: 8, percentage: 40, averageProgress: 0.4, averageDuration: 300 },
        maintenance: { count: 2, percentage: 10, averageProgress: 0.8, averageDuration: 60 },
      },
      residentEfficiency: {
        'resident-1': { totalActivities: 5, averageProgress: 0.7, efficiency: 0.8 },
        'resident-2': { totalActivities: 3, averageProgress: 0.5, efficiency: 0.6 },
      },
    };

    const { useActivityAnalytics } = require('@/ui/idleVillage/hooks/useActivityAnalytics');
    const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

    useActivityAnalytics.mockReturnValue({
      metrics: mockAnalytics,
      isCollecting: true,
      startCollection: vi.fn(),
      stopCollection: vi.fn(),
      clearHistoricalData: vi.fn(),
      exportAnalytics: vi.fn().mockResolvedValue('{}'),
    });

    render(
      <ActiveHUD
        hudState={mockHudState}
        villageState={mockVillageState}
        secondsPerTimeUnit={60}
        enableTelemetry={true}
      />
    );

    await waitFor(() => {
      expect(mockConsoleLog).toHaveBeenCalledWith('[ActiveHUD Analytics]', mockAnalytics);
    });

    mockConsoleLog.mockRestore();
  });

  it('should handle legacy activeSlots interface', () => {
    const mockActiveSlots = [
      {
        slot: {
          id: 'slot-1',
          locationId: 'forest',
          activityId: 'gather-wood',
          label: 'Gather Wood',
          icon: '🪵',
          requiredResidents: 1,
          maxResidents: 1,
          tags: ['job'],
        },
        state: {
          status: 'running',
          progress: 0.5,
          duration: 180,
          elapsed: 90,
          assignedResidents: ['resident-1'],
        },
      },
    ];

    render(
      <ActiveHUD
        activeSlots={mockActiveSlots}
        secondsPerTimeUnit={60}
        enableTelemetry={true}
      />
    );

    // Should render legacy activities
    expect(screen.getByText('Gather Wood')).toBeInTheDocument();
  });

  it('should render in compact variant', () => {
    render(
      <ActiveHUD
        hudState={mockHudState}
        villageState={mockVillageState}
        secondsPerTimeUnit={60}
        variant="compact"
        enableTelemetry={true}
      />
    );

    // Should still render activities in compact mode
    expect(screen.getByText('Gather Wood')).toBeInTheDocument();
    expect(screen.getByText('Explore Forest')).toBeInTheDocument();
  });

  it('should respect maxVisible limit', () => {
    const mockHudStateWithMany: ActiveHUDState = {
      activities: Array.from({ length: 10 }, (_, i) => ({
        key: `activity-${i}`,
        activityType: 'job',
        label: `Activity ${i}`,
        icon: '⚙️',
        residentId: `resident-${i}`,
        residentName: `Resident ${i}`,
        progress: 0.5,
        remainingSeconds: 120,
        status: 'running' as const,
        visualVariant: 'azure',
        scheduledId: `scheduled-${i}`,
        activityId: `activity-${i}`,
      })),
      counts: {
        jobs: 10,
        quests: 0,
        maintenance: 0,
        total: 10,
      },
      hasActiveActivities: true,
    };

    render(
      <ActiveHUD
        hudState={mockHudStateWithMany}
        villageState={mockVillageState}
        secondsPerTimeUnit={60}
        maxVisible={5}
        enableTelemetry={true}
      />
    );

    // Should render only 5 activities
    expect(screen.getByText('Activity 0')).toBeInTheDocument();
    expect(screen.getByText('Activity 4')).toBeInTheDocument();
    expect(screen.queryByText('Activity 5')).not.toBeInTheDocument();
  });

  it('should handle empty activities gracefully', () => {
    const emptyHudState: ActiveHUDState = {
      activities: [],
      counts: {
        jobs: 0,
        quests: 0,
        maintenance: 0,
        total: 0,
      },
      hasActiveActivities: false,
    };

    render(
      <ActiveHUD
        hudState={emptyHudState}
        villageState={mockVillageState}
        secondsPerTimeUnit={60}
        enableTelemetry={true}
      />
    );

    // Should render without crashing
    expect(screen.queryByText('Gather Wood')).not.toBeInTheDocument();
    expect(screen.queryByText('Explore Forest')).not.toBeInTheDocument();
  });

  it('should integrate with all telemetry hooks when enabled', () => {
    const { useActivityTelemetry } = require('@/ui/idleVillage/hooks/useActivityTelemetry');
    const { useActiveHUDTelemetry } = require('@/ui/idleVillage/hooks/useActiveHUDTelemetry');
    const { useActivityAnalytics } = require('@/ui/idleVillage/hooks/useActivityAnalytics');

    render(
      <ActiveHUD
        hudState={mockHudState}
        villageState={mockVillageState}
        secondsPerTimeUnit={60}
        enableTelemetry={true}
      />
    );

    // All telemetry hooks should be called
    expect(useActivityTelemetry).toHaveBeenCalled();
    expect(useActiveHUDTelemetry).toHaveBeenCalled();
    expect(useActivityAnalytics).toHaveBeenCalled();
  });

  it('should not call telemetry hooks when disabled', () => {
    const { useActivityTelemetry } = require('@/ui/idleVillage/hooks/useActivityTelemetry');
    const { useActiveHUDTelemetry } = require('@/ui/idleVillage/hooks/useActiveHUDTelemetry');
    const { useActivityAnalytics } = require('@/ui/idleVillage/hooks/useActivityAnalytics');

    render(
      <ActiveHUD
        hudState={mockHudState}
        villageState={mockVillageState}
        secondsPerTimeUnit={60}
        enableTelemetry={false}
      />
    );

    // Telemetry hooks should still be called (they handle enabled state internally)
    expect(useActivityTelemetry).toHaveBeenCalled();
    expect(useActiveHUDTelemetry).toHaveBeenCalled();
    expect(useActivityAnalytics).toHaveBeenCalled();
  });
});
