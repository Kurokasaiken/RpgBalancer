import { nanoid } from 'nanoid';
import { getDragPreviewInstrumentationConfig } from '@/ui/idleVillage/config/dragPreviewInstrumentationConfig';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';

export type DragPreviewMetricChannel = 'drag_preview_metric' | 'drag_preview_alert';

export type DragPreviewMeasurementStatus = 'success' | 'timeout' | 'error';

export type DragPreviewMetricSeverity = 'ok' | 'warning' | 'error';

export type DragPreviewMetricSource =
  | 'pg_card'
  | 'custom_overlay'
  | 'legacy_roster'
  | 'dnd_overlay'
  | 'unknown';

export interface DragPreviewMeasurement {
  /** Time spent constructing and attaching the preview DOM node. */
  creationDurationMs: number;
  /** Animation frame deltas collected immediately after creation. */
  frameDurationsMs: number[];
  /** Time to the first rendered frame once the preview is attached (ms). */
  timeToFirstPaintMs?: number;
  /** Count of frames exceeding the configured long frame threshold. */
  longFrameCount?: number;
  /** Whether the measured frames exceeded the configured frame budget. */
  frameBudgetBreached?: boolean;
}

export interface DragPreviewMetricPayload {
  previewId: string;
  residentId?: string;
  activityId?: string;
  source: DragPreviewMetricSource;
  status: DragPreviewMeasurementStatus;
  measurement: DragPreviewMeasurement;
  errors?: string[];
  metadata?: Record<string, unknown>;
}

export interface DragPreviewMetricEvent extends DragPreviewMetricPayload {
  eventId: string;
  timestamp: number;
  severity: DragPreviewMetricSeverity;
  channel: DragPreviewMetricChannel;
}

export interface DragPreviewAnalyticsSummary {
  totalMeasurements: number;
  okCount: number;
  warningCount: number;
  errorCount: number;
  averageCreationMs: number;
  averageTimeToFirstPaintMs: number;
  averageLongFrameCount: number;
  lastUpdatedAt?: number;
}

export const resolveDragPreviewMetricSeverity = (
  payload: DragPreviewMetricPayload,
): DragPreviewMetricSeverity => {
  const { thresholds } = getDragPreviewInstrumentationConfig();
  const { measurement, status, errors } = payload;
  const { frameBudgetBreached, timeToFirstPaintMs, longFrameCount, creationDurationMs } = measurement;

  if (status === 'error' || errors?.length || frameBudgetBreached) {
    return 'error';
  }

  if (status === 'timeout') {
    return 'warning';
  }

  if (typeof timeToFirstPaintMs === 'number') {
    if (timeToFirstPaintMs >= thresholds.frameErrorBudgetMs) {
      return 'error';
    }

    if (timeToFirstPaintMs >= thresholds.frameWarningBudgetMs) {
      return 'warning';
    }
  }

  if (creationDurationMs >= thresholds.creationBudgetMs) {
    return 'warning';
  }

  if ((longFrameCount ?? 0) > 0) {
    return 'warning';
  }

  return 'ok';
};

export class DragPreviewInstrumentationAnalytics {
  private events: DragPreviewMetricEvent[] = [];
  private diagnostics = createHeadlessDiagnostics('drag-preview-instrumentation', 'instrumentation');

  recordMetric(payload: DragPreviewMetricPayload): DragPreviewMetricEvent {
    const config = getDragPreviewInstrumentationConfig();
    const severity = resolveDragPreviewMetricSeverity(payload);

    const event: DragPreviewMetricEvent = {
      ...payload,
      eventId: nanoid(),
      timestamp: Date.now(),
      severity,
      channel: config.telemetry.channel,
    };

    this.events.push(event);
    if (this.events.length > config.telemetry.maxEvents) {
      this.events.shift();
    }

    this.diagnostics.debug('drag_preview_metric', {
      severity,
      previewId: payload.previewId,
      residentId: payload.residentId,
      status: payload.status,
      measurement: payload.measurement,
      errors: payload.errors,
    });

    return event;
  }

  getEvents(): DragPreviewMetricEvent[] {
    return [...this.events];
  }

  getLatestEvent(): DragPreviewMetricEvent | undefined {
    return this.events.at(-1);
  }

  clearEvents(): void {
    this.events = [];
  }

  getSummary(): DragPreviewAnalyticsSummary {
    if (!this.events.length) {
      return {
        totalMeasurements: 0,
        okCount: 0,
        warningCount: 0,
        errorCount: 0,
        averageCreationMs: 0,
        averageTimeToFirstPaintMs: 0,
        averageLongFrameCount: 0,
      };
    }

    const totals = this.events.reduce(
      (acc, event) => {
        acc.totalMeasurements += 1;
        acc[`${event.severity}Count` as const] += 1;
        acc.totalCreationMs += event.measurement.creationDurationMs;
        acc.totalTimeToFirstPaintMs += event.measurement.timeToFirstPaintMs ?? 0;
        acc.totalLongFrameCount += event.measurement.longFrameCount ?? 0;
        acc.lastUpdatedAt = Math.max(acc.lastUpdatedAt, event.timestamp);
        return acc;
      },
      {
        totalMeasurements: 0,
        okCount: 0,
        warningCount: 0,
        errorCount: 0,
        totalCreationMs: 0,
        totalTimeToFirstPaintMs: 0,
        totalLongFrameCount: 0,
        lastUpdatedAt: 0,
      },
    );

    return {
      totalMeasurements: totals.totalMeasurements,
      okCount: totals.okCount,
      warningCount: totals.warningCount,
      errorCount: totals.errorCount,
      averageCreationMs: totals.totalCreationMs / totals.totalMeasurements,
      averageTimeToFirstPaintMs:
        totals.totalTimeToFirstPaintMs / Math.max(totals.totalMeasurements, 1),
      averageLongFrameCount:
        totals.totalLongFrameCount / Math.max(totals.totalMeasurements, 1),
      lastUpdatedAt: totals.lastUpdatedAt || undefined,
    };
  }

}

export const dragPreviewInstrumentationAnalytics = new DragPreviewInstrumentationAnalytics();
