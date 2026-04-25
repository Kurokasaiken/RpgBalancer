import {
  DEFAULT_FATIGUE_ANOMALY_CONFIG,
  getActivityBaseline,
  resolveSegmentId,
  type FatigueAnomalyConfig,
  type FatigueAnomalyRule,
  type FatigueAnomalySeverity,
} from '@/balancing/config/idleVillage/fatigueAnomalyConfig';
import {
  createFatigueTelemetryPayload,
  trackFatigueTelemetry,
  type FatigueTelemetryEventPayload,
  type FatigueTelemetryEventType,
} from '@/analytics/telemetry/telemetryProvider';
import type { ResidentStatus } from '@/engine/game/idleVillage/TimeEngine';

const MILLISECONDS_IN_MINUTE = 60 * 1000;

export interface ResidentFatigueSample {
  residentId: string;
  fatigue: number;
  timestamp: number;
  status?: ResidentStatus;
  activityId?: string;
}

export interface FatigueAnomalyAlert {
  id: string;
  residentId: string;
  severity: FatigueAnomalySeverity;
  ruleId: string;
  triggeredAt: number;
  segmentId: string;
  deltaPercent: number;
  deltaValue: number;
  currentFatigue: number;
  expectedFatigue: number;
  activityId?: string;
  consecutiveBreaches: number;
  windowMinutes: number;
  metadata: {
    tolerance: number;
    criticalDeviation: number;
  };
}

export interface FatigueAnomalyDetectorOptions {
  config?: Partial<FatigueAnomalyConfig>;
  /** Optional telemetry dispatcher (defaults to trackFatigueTelemetry) */
  telemetryTracker?: (
    event: FatigueTelemetryEventType,
    payload: Omit<FatigueTelemetryEventPayload, 'eventType' | 'timestamp'>,
  ) => void;
  /** Useful for testing to control timestamps */
  nowProvider?: () => number;
}

interface EvaluationContext {
  expectedFatigue: number;
  tolerance: number;
  segmentId: string;
  criticalDeviation: number;
}

type RuleKey = `${string}::${string}`;

export class FatigueAnomalyDetector {
  private config: FatigueAnomalyConfig;
  private readonly trackTelemetry:
    | ((
        event: FatigueTelemetryEventType,
        payload: Omit<FatigueTelemetryEventPayload, 'eventType' | 'timestamp'>,
      ) => void)
    | undefined;
  private readonly now: () => number;

  private alertCounter = 0;
  private readonly residentSamples = new Map<string, ResidentFatigueSample[]>();
  private readonly alerts: FatigueAnomalyAlert[] = [];
  private readonly ruleCounters = new Map<RuleKey, number>();
  private readonly lastAlertTimes = new Map<RuleKey, number>();

  constructor(options: FatigueAnomalyDetectorOptions = {}) {
    this.config = {
      ...DEFAULT_FATIGUE_ANOMALY_CONFIG,
      ...options.config,
      residentSegments: {
        ...DEFAULT_FATIGUE_ANOMALY_CONFIG.residentSegments,
        ...options.config?.residentSegments,
      },
      activityBaselines: {
        ...DEFAULT_FATIGUE_ANOMALY_CONFIG.activityBaselines,
        ...options.config?.activityBaselines,
      },
      alertRules: options.config?.alertRules ?? DEFAULT_FATIGUE_ANOMALY_CONFIG.alertRules,
    };
    this.trackTelemetry = options.telemetryTracker ?? trackFatigueTelemetry;
    this.now = options.nowProvider ?? (() => Date.now());
  }

  updateConfig(next: Partial<FatigueAnomalyConfig>): void {
    this.config = {
      ...this.config,
      ...next,
      residentSegments: {
        ...this.config.residentSegments,
        ...next.residentSegments,
      },
      activityBaselines: {
        ...this.config.activityBaselines,
        ...next.activityBaselines,
      },
      alertRules: next.alertRules ?? this.config.alertRules,
    };
  }

  ingestSamples(samples: ResidentFatigueSample[]): FatigueAnomalyAlert[] {
    const newAlerts: FatigueAnomalyAlert[] = [];
    samples.forEach((sample) => {
      if (!Number.isFinite(sample.fatigue)) {
        return;
      }
      const normalizedSample = {
        ...sample,
        timestamp: sample.timestamp ?? this.now(),
      };
      this.storeSample(normalizedSample);
      const context = this.buildEvaluationContext(normalizedSample);
      if (!context) {
        return;
      }

      const absDelta = Math.abs(normalizedSample.fatigue - context.expectedFatigue);
      if (absDelta <= context.tolerance) {
        this.resetRuleCounters(normalizedSample.residentId);
        return;
      }

      const deltaPercent = this.computeDeltaPercent(absDelta, context.expectedFatigue);
      this.config.alertRules.forEach((rule) => {
        if (!this.shouldEvaluateRule(rule, deltaPercent)) {
          this.resetRuleCounter(normalizedSample.residentId, rule.id);
          return;
        }

        const ruleKey = this.getRuleKey(normalizedSample.residentId, rule.id);
        const consecutive = (this.ruleCounters.get(ruleKey) ?? 0) + 1;
        this.ruleCounters.set(ruleKey, consecutive);

        if (consecutive < rule.consecutiveReadings) {
          return;
        }

        if (this.isOnCooldown(ruleKey, normalizedSample.timestamp, rule)) {
          return;
        }

        const severity = this.resolveSeverity(rule, absDelta, context);
        const alert = this.buildAlert(
          normalizedSample,
          context,
          rule,
          deltaPercent,
          absDelta,
          severity,
          consecutive,
        );

        this.alerts.push(alert);
        newAlerts.push(alert);
        this.lastAlertTimes.set(ruleKey, normalizedSample.timestamp);
        this.ruleCounters.set(ruleKey, 0);
        this.emitTelemetry(alert, normalizedSample, context);
      });
    });

    return newAlerts;
  }

  getAlerts(): FatigueAnomalyAlert[] {
    return [...this.alerts];
  }

  clear(): void {
    this.alerts.length = 0;
    this.residentSamples.clear();
    this.ruleCounters.clear();
    this.lastAlertTimes.clear();
  }

  private storeSample(sample: ResidentFatigueSample): void {
    const windowStart = sample.timestamp - this.config.samplingWindowMinutes * MILLISECONDS_IN_MINUTE;
    const existing = this.residentSamples.get(sample.residentId) ?? [];
    const filtered = existing.filter((entry) => entry.timestamp >= windowStart);
    filtered.push(sample);
    this.residentSamples.set(sample.residentId, filtered);
  }

  private buildEvaluationContext(sample: ResidentFatigueSample): EvaluationContext | null {
    const samples = this.residentSamples.get(sample.residentId);
    if (!samples || samples.length < this.config.minSamplesPerResident) {
      return null;
    }

    const segmentId = resolveSegmentId(sample.status, this.config);
    const segment = this.config.residentSegments[segmentId];
    if (!segment) {
      return null;
    }

    const activityBaseline = sample.activityId
      ? getActivityBaseline(sample.activityId, this.config)
      : undefined;

    let expectedFatigue = segment.expectedFatigue;
    let tolerance = segment.tolerance;

    if (activityBaseline) {
      expectedFatigue += activityBaseline.expectedGain;
      tolerance += activityBaseline.tolerance;
    }

    expectedFatigue = Math.min(expectedFatigue, this.config.maxFatigueBeforeExhausted);

    return {
      expectedFatigue,
      tolerance,
      segmentId,
      criticalDeviation: segment.criticalDeviation,
    };
  }

  private computeDeltaPercent(absDelta: number, expectedFatigue: number): number {
    const denominator = expectedFatigue > 0 ? expectedFatigue : this.config.maxFatigueBeforeExhausted;
    if (denominator <= 0) {
      return 0;
    }
    return (absDelta / denominator) * 100;
  }

  private shouldEvaluateRule(rule: FatigueAnomalyRule, deltaPercent: number): boolean {
    return deltaPercent >= rule.deltaPercent;
  }

  private getRuleKey(residentId: string, ruleId: string): RuleKey {
    return `${residentId}::${ruleId}`;
  }

  private resetRuleCounter(residentId: string, ruleId: string): void {
    const key = this.getRuleKey(residentId, ruleId);
    this.ruleCounters.delete(key);
  }

  private resetRuleCounters(residentId: string): void {
    [...this.ruleCounters.keys()].forEach((key) => {
      if (key.startsWith(`${residentId}::`)) {
        this.ruleCounters.delete(key as RuleKey);
      }
    });
  }

  private isOnCooldown(ruleKey: RuleKey, timestamp: number, rule: FatigueAnomalyRule): boolean {
    const lastAlert = this.lastAlertTimes.get(ruleKey);
    if (!lastAlert) {
      return false;
    }
    const cooldownMs = rule.cooldownMinutes * MILLISECONDS_IN_MINUTE;
    return timestamp - lastAlert < cooldownMs;
  }

  private resolveSeverity(
    rule: FatigueAnomalyRule,
    absDelta: number,
    context: EvaluationContext,
  ): FatigueAnomalySeverity {
    if (absDelta >= context.criticalDeviation) {
      return 'critical';
    }
    return rule.severity;
  }

  private buildAlert(
    sample: ResidentFatigueSample,
    context: EvaluationContext,
    rule: FatigueAnomalyRule,
    deltaPercent: number,
    deltaValue: number,
    severity: FatigueAnomalySeverity,
    consecutiveBreaches: number,
  ): FatigueAnomalyAlert {
    return {
      id: `fatigue-alert-${++this.alertCounter}`,
      residentId: sample.residentId,
      severity,
      ruleId: rule.id,
      triggeredAt: sample.timestamp,
      segmentId: context.segmentId,
      deltaPercent,
      deltaValue,
      currentFatigue: sample.fatigue,
      expectedFatigue: context.expectedFatigue,
      activityId: sample.activityId,
      consecutiveBreaches,
      windowMinutes: this.config.samplingWindowMinutes,
      metadata: {
        tolerance: context.tolerance,
        criticalDeviation: context.criticalDeviation,
      },
    };
  }

  private emitTelemetry(
    alert: FatigueAnomalyAlert,
    sample: ResidentFatigueSample,
    context: EvaluationContext,
  ): void {
    if (!this.trackTelemetry) {
      return;
    }

    this.trackTelemetry('fatigue_anomaly_alert', {
      ...createFatigueTelemetryPayload(
        sample.residentId,
        sample.activityId,
        sample.fatigue,
        context.expectedFatigue,
        'fatigue_anomaly_alert',
        {
          ruleId: alert.ruleId,
          deltaPercent: alert.deltaPercent,
          deltaValue: alert.deltaValue,
          segmentId: alert.segmentId,
        },
      ),
      context: 'fatigue_anomaly_alert',
    });
  }
}
