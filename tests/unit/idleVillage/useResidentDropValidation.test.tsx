import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResidentDropValidation } from '@/ui/idleVillage/hooks/useResidentDropValidation';
import { trackFatigueTelemetry, createFatigueTelemetryPayload } from '@/analytics/telemetry/telemetryProvider';
import type { FatigueTelemetryEventPayload } from '@/analytics/telemetry/telemetryProvider';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';

// Mock the telemetry functions
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackFatigueTelemetry: vi.fn(),
  createFatigueTelemetryPayload: vi.fn(),
}));

// Mock diagnostics for telemetry
vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

const mockTrackFatigueTelemetry = vi.mocked(trackFatigueTelemetry);
const mockCreateFatigueTelemetryPayload = vi.mocked(createFatigueTelemetryPayload);

describe('useResidentDropValidation - Fatigue Telemetry', () => {
  const mockResident: ResidentState = {
    id: 'resident-1',
    status: 'available',
    fatigue: 85,
    statSnapshot: {
      hp: 100,
      damage: 15,
      txc: 10,
    },
  } as ResidentState;

  const mockActivity: ActivityDefinition = {
    id: 'forest-work',
    label: 'Forest Work',
    tags: ['job', 'outdoor'],
    slotTags: ['village_job'],
    resolutionEngineId: 'job',
    dangerRating: 0.3,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockCreateFatigueTelemetryPayload.mockImplementation((
      residentId: string,
      activityId: string | undefined,
      currentFatigue: number,
      threshold: number,
      context?: string,
      metadata?: FatigueTelemetryEventPayload['metadata'],
    ) => ({
      residentId,
      activityId,
      currentFatigue,
      threshold,
      context,
      metadata,
    }));
  });

  it('should emit fatigue_threshold_warn when fatigue exceeds threshold', () => {
    const { result } = renderHook(() => useResidentDropValidation({
      enableTelemetry: true,
      config: {
        maxFatigueBeforeExhausted: 80,
        enableFatigueValidation: true,
      },
    }));

    const validationResult = result.current.validateDrop({
      resident: mockResident,
      activity: mockActivity,
      context: 'test-drop',
    });

    // Should fail due to fatigue
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.failedRule).toBe('fatigue_threshold');

    // Should have called telemetry
    expect(mockCreateFatigueTelemetryPayload).toHaveBeenCalledWith(
      'resident-1',
      'forest-work',
      85,
      expect.any(Number), // threshold from config
      'test-drop',
      expect.any(Object) // metadata
    );

    expect(mockTrackFatigueTelemetry).toHaveBeenCalledWith(
      'fatigue_threshold_warn',
      expect.any(Object) // payload
    );
  });

  it('should emit fatigue_threshold_block when fatigue exceeds 1.5x threshold', () => {
    const highFatigueResident = {
      ...mockResident,
      fatigue: 95, // High fatigue
    };

    const { result } = renderHook(() => useResidentDropValidation({
      enableTelemetry: true,
      config: {
        maxFatigueBeforeExhausted: 60,
        enableFatigueValidation: true,
      },
    }));

    const validationResult = result.current.validateDrop({
      resident: highFatigueResident,
      activity: mockActivity,
      context: 'test-drop',
    });

    // Should fail due to fatigue
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.failedRule).toBe('fatigue_threshold');

    // Should have called telemetry with block event
    expect(mockTrackFatigueTelemetry).toHaveBeenCalledWith(
      'fatigue_threshold_block',
      expect.any(Object) // payload
    );
  });

  it('should not emit telemetry when validation passes', () => {
    const lowFatigueResident = {
      ...mockResident,
      fatigue: 30, // Low fatigue
    };

    const { result } = renderHook(() => useResidentDropValidation({
      enableTelemetry: true,
      config: {
        maxFatigueBeforeExhausted: 80,
        enableFatigueValidation: true,
      },
    }));

    const validationResult = result.current.validateDrop({
      resident: lowFatigueResident,
      activity: mockActivity,
      context: 'test-drop',
    });

    // Should pass
    expect(validationResult.isValid).toBe(true);

    // Should not have called fatigue telemetry
    expect(mockTrackFatigueTelemetry).not.toHaveBeenCalled();
  });

  it('should not emit telemetry when enableTelemetry is false', () => {
    const { result } = renderHook(() => useResidentDropValidation({
      enableTelemetry: false,
      config: {
        maxFatigueBeforeExhausted: 80,
        enableFatigueValidation: true,
      },
    }));

    const validationResult = result.current.validateDrop({
      resident: mockResident,
      activity: mockActivity,
      context: 'test-drop',
    });

    // Should fail due to fatigue
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.failedRule).toBe('fatigue_threshold');

    // Should not have called telemetry
    expect(mockTrackFatigueTelemetry).not.toHaveBeenCalled();
  });

  it('should include resident stats in telemetry metadata', () => {
    const { result } = renderHook(() => useResidentDropValidation({
      enableTelemetry: true,
      config: {
        maxFatigueBeforeExhausted: 80,
        enableFatigueValidation: true,
      },
    }));

    result.current.validateDrop({
      resident: mockResident,
      activity: mockActivity,
      context: 'test-drop',
    });

    expect(mockCreateFatigueTelemetryPayload).toHaveBeenCalledWith(
      'resident-1',
      'forest-work',
      85,
      expect.any(Number),
      'test-drop',
      expect.objectContaining({
        residentStats: expect.objectContaining({
          fatigue: 85,
          hp: 100,
          damage: 15,
          txc: 10,
        }),
      })
    );
  });

  it('should include activity type in telemetry metadata', () => {
    const { result } = renderHook(() => useResidentDropValidation({
      enableTelemetry: true,
      config: {
        maxFatigueBeforeExhausted: 80,
        enableFatigueValidation: true,
      },
    }));

    result.current.validateDrop({
      resident: mockResident,
      activity: mockActivity,
      context: 'test-drop',
    });

    expect(mockCreateFatigueTelemetryPayload).toHaveBeenCalledWith(
      'resident-1',
      'forest-work',
      85,
      expect.any(Number),
      'test-drop',
      expect.objectContaining({
        activityType: 'job', // First tag from activity
      })
    );
  });

  it('should handle missing activity gracefully', () => {
    const { result } = renderHook(() => useResidentDropValidation({
      enableTelemetry: true,
      config: {
        maxFatigueBeforeExhausted: 80,
        enableFatigueValidation: true,
      },
    }));

    const validationResult = result.current.validateDrop({
      resident: mockResident,
      activity: undefined,
      context: 'test-drop',
    });

    expect(validationResult.isValid).toBe(false);
    expect(validationResult.failedRule).toBe('fatigue_threshold');

    // Should still emit telemetry with undefined activity
    expect(mockCreateFatigueTelemetryPayload).toHaveBeenCalledWith(
      'resident-1',
      undefined,
      85,
      expect.any(Number),
      'test-drop',
      expect.objectContaining({
        activityType: 'unknown',
      })
    );
  });

  it('should handle missing stat snapshot gracefully', () => {
    const residentWithoutStats = {
      ...mockResident,
      statSnapshot: undefined,
    };

    const { result } = renderHook(() => useResidentDropValidation({
      enableTelemetry: true,
      config: {
        maxFatigueBeforeExhausted: 80,
        enableFatigueValidation: true,
      },
    }));

    result.current.validateDrop({
      resident: residentWithoutStats,
      activity: mockActivity,
      context: 'test-drop',
    });

    expect(mockCreateFatigueTelemetryPayload).toHaveBeenCalledWith(
      'resident-1',
      'forest-work',
      85,
      expect.any(Number),
      'test-drop',
      expect.objectContaining({
        residentStats: expect.objectContaining({
          fatigue: 85,
          status: 'available',
        }),
      })
    );
  });
});
