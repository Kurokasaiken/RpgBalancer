import type { DragPreviewMetricChannel } from '@/analytics/idleVillageDragInstrumentation';

export interface DragPreviewInstrumentationThresholds {
  /** Target time budget to create and attach the preview DOM (ms). */
  creationBudgetMs: number;
  /** Soft warning threshold for first-frame paint budget (ms). */
  frameWarningBudgetMs: number;
  /** Critical error threshold for first-frame paint budget (ms). */
  frameErrorBudgetMs: number;
  /** Treat frame deltas above this threshold as dropped frames. */
  longFrameThresholdMs: number;
}

export interface DragPreviewIndicatorConfig {
  /** Whether to render the dev-only indicator overlay. */
  enabled: boolean;
  /** Max amount of metrics to retain for inline display. */
  maxSamples: number;
}

export interface DragPreviewTelemetryConfig {
  /** Which channel to use when recording analytics events. */
  channel: DragPreviewMetricChannel;
  /** Limit of in-memory events before older ones are discarded. */
  maxEvents: number;
}

export interface DragPreviewInstrumentationConfig {
  /** Dev-only toggle: instrumentation never auto-enables on production builds. */
  devOnly: boolean;
  /** Default enabled state for dev builds before user preference is loaded. */
  enabledByDefault: boolean;
  /** Persistence key for saving user preference via PersistenceService. */
  persistenceKey: string;
  /** Number of animation frames sampled after preview creation. */
  sampleFrameCount: number;
  /** Timeout (ms) before frame sampling is aborted. */
  sampleTimeoutMs: number;
  /** Maximum number of concurrent measurements to guard against leaks. */
  maxConcurrentMeasurements: number;
  /** Threshold configuration for warnings/errors. */
  thresholds: DragPreviewInstrumentationThresholds;
  /** Inline indicator configuration. */
  indicator: DragPreviewIndicatorConfig;
  /** Telemetry/analytics configuration. */
  telemetry: DragPreviewTelemetryConfig;
}

const DEFAULT_DRAG_PREVIEW_INSTRUMENTATION_CONFIG: DragPreviewInstrumentationConfig = {
  devOnly: true,
  enabledByDefault: true,
  persistenceKey: 'idleVillage.dragPreviewInstrumentation',
  sampleFrameCount: 5,
  sampleTimeoutMs: 750,
  maxConcurrentMeasurements: 8,
  thresholds: {
    creationBudgetMs: 4,
    frameWarningBudgetMs: 12,
    frameErrorBudgetMs: 20,
    longFrameThresholdMs: 24,
  },
  indicator: {
    enabled: true,
    maxSamples: 5,
  },
  telemetry: {
    channel: 'drag_preview_metric',
    maxEvents: 200,
  },
};

let overrideConfig: DragPreviewInstrumentationConfig | null = null;

export const getDragPreviewInstrumentationConfig = (): DragPreviewInstrumentationConfig =>
  overrideConfig ?? DEFAULT_DRAG_PREVIEW_INSTRUMENTATION_CONFIG;

export const overrideDragPreviewInstrumentationConfig = (
  config: Partial<DragPreviewInstrumentationConfig>,
): void => {
  overrideConfig = { ...DEFAULT_DRAG_PREVIEW_INSTRUMENTATION_CONFIG, ...config };
};

export const resetDragPreviewInstrumentationConfig = (): void => {
  overrideConfig = null;
};
