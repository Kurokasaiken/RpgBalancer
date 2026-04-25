import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FatigueAnomalyDetector,
  type ResidentFatigueSample,
  type FatigueAnomalyAlert,
} from '@/balancing/idleVillage/FatigueAnomalyDetector';
import type { ResidentState, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import { useFatigueAlerts } from '@/ui/idleVillage/hooks/useFatigueAlerts';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import type { FatigueAnomalyConfig } from '@/balancing/config/idleVillage/fatigueAnomalyConfig';

vi.mock('@/shared/persistence/PersistenceService');
vi.mock('@/balancing/idleVillage/FatigueAnomalyDetector');

const mockLoadData = vi.mocked(loadData);
const mockSaveData = vi.mocked(saveData);
const MockFatigueAnomalyDetector = vi.mocked(FatigueAnomalyDetector);

const BASE_CONFIG: Partial<FatigueAnomalyConfig> = {
  minSamplesPerResident: 1,
  samplingWindowMinutes: 10,
  alertRules: [
    {
      id: 'test-rule-warning',
      description: 'warning rule',
      severity: 'warning',
      deltaPercent: 10,
      consecutiveReadings: 1,
      cooldownMinutes: 5,
    },
  ],
  residentSegments: {
    test: {
      id: 'test',
      label: 'Test Segment',
      expectedFatigue: 40,
      tolerance: 5,
      criticalDeviation: 20,
      applicableStatuses: ['available'],
    },
  },
  defaultSegmentId: 'test',
};

const createMockResident = (overrides: Partial<ResidentState> = {}): ResidentState => ({
  id: 'resident-1',
  status: 'available',
  fatigue: 40,
  currentHp: 100,
  isInjured: false,
  injuryRecoveryTime: 0,
  ...overrides,
});

const createMockActivities = (activities: Record<string, ScheduledActivity> = {}): Record<string, ScheduledActivity> => ({
  'activity-1': {
    scheduledId: 'scheduled-1',
    activityId: 'quest_test',
    characterIds: ['resident-1'],
    startTime: 1000,
    duration: 300,
    status: 'running',
  },
  ...activities,
});

describe('useFatigueAlerts', () => {
  let mockDetector: {
    ingestSamples: ReturnType<typeof vi.fn>;
    updateConfig: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockDetector = {
      ingestSamples: vi.fn().mockReturnValue([]),
      updateConfig: vi.fn(),
    };
    
    MockFatigueAnomalyDetector.mockImplementation(function() {
      return mockDetector as any;
    });
    
    mockLoadData.mockResolvedValue({
      snoozedResidents: {},
    });
    
    mockSaveData.mockResolvedValue();
  });

  const renderHookWithDefaults = (overrides: Partial<Parameters<typeof useFatigueAlerts>[0]> = {}) => {
    return renderHook(() =>
      useFatigueAlerts({
        residents: [createMockResident()],
        activities: createMockActivities(),
        currentTimeUnits: 100,
        secondsPerTimeUnit: 60,
        anomalyConfig: BASE_CONFIG,
        ...overrides,
      }),
    );
  };

  it('initializes detector with merged config', () => {
    renderHookWithDefaults();
    
    expect(MockFatigueAnomalyDetector).toHaveBeenCalledWith({
      config: expect.objectContaining({
        minSamplesPerResident: 1,
        alertRules: expect.arrayContaining([
          expect.objectContaining({ id: 'test-rule-warning' }),
        ]),
      }),
    });
  });

  it('loads preferences from storage on mount', async () => {
    const mockPreferences = { snoozedResidents: { 'resident-1': Date.now() + 60000 } };
    mockLoadData.mockResolvedValue(mockPreferences);
    
    const { result } = renderHookWithDefaults();
    
    await waitFor(() => {
      expect(result.current.preferencesReady).toBe(true);
    });
    
    expect(result.current.snoozedResidents).toEqual(mockPreferences.snoozedResidents);
  });

  it('saves preferences when they change', async () => {
    const { result, rerender } = renderHookWithDefaults();
    
    await waitFor(() => {
      expect(result.current.preferencesReady).toBe(true);
    });
    
    act(() => {
      result.current.snoozeResident('resident-1', 30);
    });
    
    await waitFor(() => {
      expect(mockSaveData).toHaveBeenCalledWith(
        'idle-village-fatigue-alert-preferences',
        expect.objectContaining({
          snoozedResidents: expect.objectContaining({
            'resident-1': expect.any(Number),
          }),
        }),
      );
    });
  });

  it('processes resident fatigue changes through detector', async () => {
    const mockAlert: FatigueAnomalyAlert = {
      id: 'alert-1',
      residentId: 'resident-1',
      severity: 'warning',
      ruleId: 'test-rule-warning',
      triggeredAt: 6000000,
      segmentId: 'test',
      deltaPercent: 15,
      deltaValue: 6,
      currentFatigue: 46,
      expectedFatigue: 40,
      activityId: 'quest_test',
      consecutiveBreaches: 1,
      windowMinutes: 10,
      metadata: {
        tolerance: 5,
        criticalDeviation: 20,
      },
    };
    
    mockDetector.ingestSamples.mockReturnValue([mockAlert]);
    
    const { result } = renderHookWithDefaults();
    
    await waitFor(() => {
      expect(result.current.preferencesReady).toBe(true);
    });
    
    expect(result.current.alerts).toHaveLength(1);
    expect(result.current.alerts[0]).toEqual(mockAlert);
  });

  it('filters out alerts for snoozed residents', async () => {
    const futureTime = Date.now() + 60000;
    mockLoadData.mockResolvedValue({
      snoozedResidents: { 'resident-1': futureTime },
    });
    
    const mockAlert: FatigueAnomalyAlert = {
      id: 'alert-1',
      residentId: 'resident-1',
      severity: 'warning',
      ruleId: 'test-rule-warning',
      triggeredAt: 6000000,
      segmentId: 'test',
      deltaPercent: 15,
      deltaValue: 6,
      currentFatigue: 46,
      expectedFatigue: 40,
      activityId: 'quest_test',
      consecutiveBreaches: 1,
      windowMinutes: 10,
      metadata: {
        tolerance: 5,
        criticalDeviation: 20,
      },
    };
    
    mockDetector.ingestSamples.mockReturnValue([mockAlert]);
    
    const { result } = renderHookWithDefaults();
    
    await waitFor(() => {
      expect(result.current.preferencesReady).toBe(true);
    });
    
    expect(result.current.alerts).toHaveLength(0);
  });

  it('respects toast cooldown to prevent duplicate alerts', async () => {
    const mockAlert: FatigueAnomalyAlert = {
      id: 'alert-1',
      residentId: 'resident-1',
      severity: 'warning',
      ruleId: 'test-rule-warning',
      triggeredAt: 6000000,
      segmentId: 'test',
      deltaPercent: 15,
      deltaValue: 6,
      currentFatigue: 46,
      expectedFatigue: 40,
      activityId: 'quest_test',
      consecutiveBreaches: 1,
      windowMinutes: 10,
      metadata: {
        tolerance: 5,
        criticalDeviation: 20,
      },
    };
    
    mockDetector.ingestSamples.mockReturnValue([mockAlert]);
    
    const { result, rerender } = renderHookWithDefaults({
      toastCooldownMs: 1000,
    });
    
    await waitFor(() => {
      expect(result.current.preferencesReady).toBe(true);
    });
    
    expect(result.current.alerts).toHaveLength(1);
    
    act(() => {
      rerender();
    });
    
    await waitFor(() => {
      expect(result.current.alerts).toHaveLength(1);
    });
  });

  it('dismisses alerts correctly', async () => {
    const mockAlert: FatigueAnomalyAlert = {
      id: 'alert-1',
      residentId: 'resident-1',
      severity: 'warning',
      ruleId: 'test-rule-warning',
      triggeredAt: 6000000,
      segmentId: 'test',
      deltaPercent: 15,
      deltaValue: 6,
      currentFatigue: 46,
      expectedFatigue: 40,
      activityId: 'quest_test',
      consecutiveBreaches: 1,
      windowMinutes: 10,
      metadata: {
        tolerance: 5,
        criticalDeviation: 20,
      },
    };
    
    mockDetector.ingestSamples.mockReturnValue([mockAlert]);
    
    const { result } = renderHookWithDefaults();
    
    await waitFor(() => {
      expect(result.current.preferencesReady).toBe(true);
    });
    
    expect(result.current.alerts).toHaveLength(1);
    
    act(() => {
      result.current.dismissAlert('alert-1');
    });
    
    expect(result.current.alerts).toHaveLength(0);
  });

  it('clears all alerts', async () => {
    const mockAlert1: FatigueAnomalyAlert = {
      id: 'alert-1',
      residentId: 'resident-1',
      severity: 'warning',
      ruleId: 'test-rule-warning',
      triggeredAt: 6000000,
      segmentId: 'test',
      deltaPercent: 15,
      deltaValue: 6,
      currentFatigue: 46,
      expectedFatigue: 40,
      activityId: 'quest_test',
      consecutiveBreaches: 1,
      windowMinutes: 10,
      metadata: {
        tolerance: 5,
        criticalDeviation: 20,
      },
    };
    
    const mockAlert2: FatigueAnomalyAlert = {
      ...mockAlert1,
      id: 'alert-2',
      residentId: 'resident-2',
    };
    
    mockDetector.ingestSamples.mockReturnValue([mockAlert1, mockAlert2]);
    
    const { result } = renderHookWithDefaults({
      residents: [createMockResident(), createMockResident({ id: 'resident-2' })],
    });
    
    await waitFor(() => {
      expect(result.current.preferencesReady).toBe(true);
    });
    
    expect(result.current.alerts).toHaveLength(2);
    
    act(() => {
      result.current.clearAlerts();
    });
    
    expect(result.current.alerts).toHaveLength(0);
  });

  it('checks if resident is snoozed', async () => {
    const futureTime = Date.now() + 60000;
    mockLoadData.mockResolvedValue({
      snoozedResidents: { 'resident-1': futureTime },
    });
    
    const { result } = renderHookWithDefaults();
    
    await waitFor(() => {
      expect(result.current.preferencesReady).toBe(true);
    });
    
    expect(result.current.isResidentSnoozed('resident-1')).toBe(true);
    expect(result.current.isResidentSnoozed('resident-2')).toBe(false);
  });

  it('handles expired snooze correctly', async () => {
    const pastTime = Date.now() - 60000;
    mockLoadData.mockResolvedValue({
      snoozedResidents: { 'resident-1': pastTime },
    });
    
    const { result } = renderHookWithDefaults();
    
    await waitFor(() => {
      expect(result.current.preferencesReady).toBe(true);
    });
    
    expect(result.current.isResidentSnoozed('resident-1')).toBe(false);
  });
});
