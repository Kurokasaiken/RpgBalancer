import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';

vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import {
  dragPreviewInstrumentationAnalytics,
  resolveDragPreviewMetricSeverity,
  type DragPreviewMetricPayload,
} from '@/analytics/idleVillageDragInstrumentation';
import {
  overrideDragPreviewInstrumentationConfig,
  resetDragPreviewInstrumentationConfig,
} from '@/ui/idleVillage/config/dragPreviewInstrumentationConfig';

const buildPayload = (overrides: Partial<DragPreviewMetricPayload> = {}): DragPreviewMetricPayload => ({
  previewId: 'preview-1',
  source: 'pg_card',
  status: 'success',
  measurement: {
    creationDurationMs: 2,
    frameDurationsMs: [2, 3, 4],
    timeToFirstPaintMs: 4,
    longFrameCount: 0,
    frameBudgetBreached: false,
  },
  ...overrides,
});

describe('idleVillage drag preview instrumentation analytics', () => {
  beforeEach(() => {
    overrideDragPreviewInstrumentationConfig({
      thresholds: {
        creationBudgetMs: 5,
        frameWarningBudgetMs: 10,
        frameErrorBudgetMs: 15,
        longFrameThresholdMs: 16,
      },
      telemetry: {
        channel: 'drag_preview_alert',
        maxEvents: 2,
      },
    });
    dragPreviewInstrumentationAnalytics.clearEvents();
  });

  afterEach(() => {
    resetDragPreviewInstrumentationConfig();
    dragPreviewInstrumentationAnalytics.clearEvents();
  });

  describe('resolveDragPreviewMetricSeverity', () => {
    it('returns ok for nominal measurements', () => {
      const payload = buildPayload();
      expect(resolveDragPreviewMetricSeverity(payload)).toBe('ok');
    });

    it('returns warning when creation exceeds budget or timeout occurs', () => {
      const creationPayload = buildPayload({
        measurement: {
          ...buildPayload().measurement,
          creationDurationMs: 8,
        },
      });
      expect(resolveDragPreviewMetricSeverity(creationPayload)).toBe('warning');

      const timeoutPayload = buildPayload({ status: 'timeout' });
      expect(resolveDragPreviewMetricSeverity(timeoutPayload)).toBe('warning');
    });

    it('returns error when frame budget breached or explicit errors exist', () => {
      const framePayload = buildPayload({
        measurement: {
          ...buildPayload().measurement,
          timeToFirstPaintMs: 20,
        },
      });
      expect(resolveDragPreviewMetricSeverity(framePayload)).toBe('error');

      const errorPayload = buildPayload({ errors: ['frame_sample_timeout'] });
      expect(resolveDragPreviewMetricSeverity(errorPayload)).toBe('error');
    });
  });

  describe('dragPreviewInstrumentationAnalytics', () => {
    it('records metrics with severity and respects max event retention', () => {
      const first = dragPreviewInstrumentationAnalytics.recordMetric(buildPayload({ previewId: 'a' }));
      const second = dragPreviewInstrumentationAnalytics.recordMetric(
        buildPayload({ previewId: 'b', measurement: { ...buildPayload().measurement, creationDurationMs: 9 } }),
      );
      const third = dragPreviewInstrumentationAnalytics.recordMetric(
        buildPayload({ previewId: 'c', measurement: { ...buildPayload().measurement, timeToFirstPaintMs: 20 } }),
      );

      expect(first.severity).toBe('ok');
      expect(second.severity).toBe('warning');
      expect(third.severity).toBe('error');

      const events = dragPreviewInstrumentationAnalytics.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].previewId).toBe('b');
      expect(events[1].previewId).toBe('c');
      expect(events.every((event) => event.channel === 'drag_preview_alert')).toBe(true);
    });
  });
});
