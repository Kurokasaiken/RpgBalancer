import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FatigueAnomalyDetector,
  type ResidentFatigueSample,
  type FatigueAnomalyAlert,
} from '@/balancing/idleVillage/FatigueAnomalyDetector';
import type { FatigueAnomalyConfig } from '@/balancing/config/idleVillage/fatigueAnomalyConfig';

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
    {
      id: 'test-rule-critical',
      description: 'critical rule',
      severity: 'warning',
      deltaPercent: 30,
      consecutiveReadings: 2,
      cooldownMinutes: 10,
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

describe('FatigueAnomalyDetector', () => {
  const telemetryTracker = vi.fn();
  let now = 1_700_000_000_000;

  const advanceTime = (minutes: number) => {
    now += minutes * 60 * 1000;
  };

  const createSample = (overrides: Partial<ResidentFatigueSample> = {}): ResidentFatigueSample => ({
    residentId: 'resident-1',
    fatigue: 40,
    timestamp: now,
    status: 'available',
    ...overrides,
  });

  let detector: FatigueAnomalyDetector;

  beforeEach(() => {
    telemetryTracker.mockReset();
    now = 1_700_000_000_000;
    detector = new FatigueAnomalyDetector({
      config: BASE_CONFIG,
      telemetryTracker,
      nowProvider: () => now,
    });
  });

  const ingestSamples = (...samples: ResidentFatigueSample[]): FatigueAnomalyAlert[] =>
    detector.ingestSamples(samples);

  it('emits alert when fatigue exceeds tolerance and rule threshold', () => {
    const result = ingestSamples(
      createSample({ fatigue: 60 }), // +20 abs delta => 50% delta
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      residentId: 'resident-1',
      ruleId: 'test-rule-warning',
      severity: 'warning', // rule severity, not critical deviation
    });
    expect(telemetryTracker).toHaveBeenCalledTimes(1);
    expect(telemetryTracker).toHaveBeenCalledWith(
      'fatigue_anomaly_alert',
      expect.objectContaining({
        residentId: 'resident-1',
        metadata: expect.objectContaining({ ruleId: 'test-rule-warning' }),
      }),
    );
  });

  it('requires consecutive breaches per rule', () => {
    const elevatedSample = createSample({ fatigue: 80 }); // Higher delta to trigger critical rule (30% delta)
    // first breach increments counter but rule requires 2
    expect(ingestSamples(elevatedSample)).toHaveLength(0);

    advanceTime(1);
    const result = ingestSamples({ ...elevatedSample, timestamp: now });
    expect(result).toHaveLength(1);
    expect(result[0].ruleId).toBe('test-rule-critical'); // This rule requires 2 consecutive readings
  });

  it('respects cooldowns for rules', () => {
    const sample = createSample({ fatigue: 60 }); // Triggers warning rule with 1 consecutive reading
    const first = ingestSamples(sample);
    expect(first).toHaveLength(1);

    advanceTime(1); // within cooldown window (5 minutes for warning rule)
    const second = ingestSamples({ ...sample, timestamp: now });
    expect(second).toHaveLength(0);

    advanceTime(5); // exit cooldown
    const third = ingestSamples({ ...sample, timestamp: now });
    expect(third).toHaveLength(1);
  });

  it('applies activity baseline adjustments', () => {
    detector.updateConfig({
      activityBaselines: {
        quest_test: {
          activityId: 'quest_test',
          label: 'Quest',
          expectedGain: 15,
          tolerance: 3,
        },
      },
    });

    const baselineSample = createSample({ activityId: 'quest_test', fatigue: 55 });
    // expected = 40 + 15, tolerance = 5 + 3 => no alert
    expect(ingestSamples(baselineSample)).toHaveLength(0);

    advanceTime(1);
    const highSample = { ...baselineSample, fatigue: 75, timestamp: now }; // Higher to exceed adjusted tolerance
    const alerts = ingestSamples(highSample);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].expectedFatigue).toBe(60); // 40 (base) + 15 (activity) = 55, but capped by maxFatigueBeforeExhausted (60)
  });

  it('ignores samples until minimum count reached', () => {
    detector.updateConfig({ minSamplesPerResident: 3 });
    const sample = createSample({ fatigue: 70 });

    expect(ingestSamples(sample)).toHaveLength(0);
    advanceTime(0.5);
    expect(ingestSamples({ ...sample, timestamp: now })).toHaveLength(0);
    advanceTime(0.5);
    const alerts = ingestSamples({ ...sample, timestamp: now });
    expect(alerts).toHaveLength(1);
  });
});
