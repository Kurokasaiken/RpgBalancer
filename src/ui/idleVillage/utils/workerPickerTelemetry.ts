import type { InteractionSource } from '@/ui/idleVillage/hooks/useSandboxInteractionMode';
import { createSandboxDiagnostics, type PickerDiagnosticsPayload } from '@/ui/idleVillage/utils/sandboxDiagnostics';

const MAX_EVENTS = 100;

/**
 * Telemetry event fired by {@link WorkerPickerSheet} when notable UX actions occur.
 */
export type WorkerPickerTelemetryEvent =
  | { type: 'open'; slotId: string | null; candidateCount: number; timestamp?: number }
  | { type: 'candidate_count'; slotId: string | null; candidateCount: number; timestamp?: number }
  | {
      type: 'assignment_attempt';
      slotId: string | null;
      residentId: string;
      compatibilityScore: number;
      tapCount?: number;
      timestamp?: number;
    }
  | {
      type: 'assignment_success';
      slotId: string | null;
      residentId: string;
      latencyMs?: number;
      compatibilityScore?: number;
      tapCount?: number;
      timestamp?: number;
    }
  | {
      type: 'assignment_cancel';
      slotId: string | null;
      reason: 'close_button' | 'backdrop' | 'esc' | InteractionSource | null;
      timestamp?: number;
    }
  | {
      type: 'close';
      slotId: string | null;
      closeDurationMs?: number;
      closedWithinThreshold?: boolean;
      timestamp?: number;
    }
  | { type: 'close_timeout'; slotId: string | null; timestamp?: number }
  | { 
      type: 'share_link_session'; 
      slotId: string; 
      candidateCount: number; 
      metadata?: {
        sessionTag: string;
        timestamp: number;
        userAgent?: string;
      };
      timestamp?: number;
    }
  | { 
      type: 'share_consent_given'; 
      slotId: string; 
      candidateCount: number; 
      metadata?: {
        sessionTag: string;
        timestamp: number;
      };
      timestamp?: number;
    }
  | { 
      type: 'share_consent_denied'; 
      slotId: string; 
      candidateCount: number; 
      metadata?: {
        sessionTag?: string;
        timestamp: number;
      };
      timestamp?: number;
    };

/**
 * Event for tracking assignment interaction methods (tap vs drag).
 */
export type AssignmentInteractionEvent = {
  method: 'tap' | 'drag';
  slotId: string | null;
  residentId: string;
  timestamp: number;
};

/**
 * Aggregated worker picker metrics exposed to Playwright + dashboards.
 */
export interface WorkerPickerTelemetryMetrics {
  /** Running average latency between tap and assignment confirmation (ms). */
  assignment_latency_ms: number | null;
  /** Number of successful assignment latency samples collected. */
  assignment_samples: number;
  /** Ratio of closes that happened within the required SLA (0 - 100). */
  picker_close_rate: number | null;
  /** Number of close samples collected. */
  picker_close_samples: number;
  /** Number of close samples that met the SLA threshold. */
  picker_close_within_target: number;
}

const DEFAULT_METRICS: WorkerPickerTelemetryMetrics = {
  assignment_latency_ms: null,
  assignment_samples: 0,
  picker_close_rate: null,
  picker_close_samples: 0,
  picker_close_within_target: 0,
};

export interface WorkerPickerTelemetryStore {
  events: WorkerPickerTelemetryEvent[];
  metrics: WorkerPickerTelemetryMetrics;
  tapCount?: number;
  risk?: { injuryAvg: number; deathAvg: number };
  assignmentInteraction: AssignmentInteractionEvent[];
}

declare global {
  interface Window {
    __sandboxTelemetry?: WorkerPickerTelemetryStore;
  }
}

const isTelemetryStore = (value: unknown): value is WorkerPickerTelemetryStore =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as WorkerPickerTelemetryStore).events) &&
  typeof (value as WorkerPickerTelemetryStore).metrics === 'object';

const ensureTelemetryStore = (): WorkerPickerTelemetryStore | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const candidate = window.__sandboxTelemetry;
  if (isTelemetryStore(candidate)) {
    if (!candidate.metrics) {
      candidate.metrics = { ...DEFAULT_METRICS };
    }
    return candidate;
  }

  const store: WorkerPickerTelemetryStore = {
    events: [],
    metrics: { ...DEFAULT_METRICS },
    tapCount: 0,
    assignmentInteraction: [],
  };
  window.__sandboxTelemetry = store;
  return store;
};

const appendEvent = (store: WorkerPickerTelemetryStore, event: WorkerPickerTelemetryEvent) => {
  const timestamped: WorkerPickerTelemetryEvent = event.timestamp ? event : { ...event, timestamp: Date.now() };
  const nextEvents =
    store.events.length >= MAX_EVENTS
      ? [...store.events.slice(store.events.length - (MAX_EVENTS - 1)), timestamped]
      : [...store.events, timestamped];
  store.events = nextEvents;
};

const applyMetrics = (
  store: WorkerPickerTelemetryStore,
  updater: (metrics: WorkerPickerTelemetryMetrics) => WorkerPickerTelemetryMetrics,
) => {
  store.metrics = updater(store.metrics ?? { ...DEFAULT_METRICS });
};

/**
 * Records a telemetry event and keeps the FIFO buffer trimmed.
 */
export const recordWorkerPickerEvent = (event: WorkerPickerTelemetryEvent): void => {
  const store = ensureTelemetryStore();
  if (!store) {
    return;
  }
  appendEvent(store, event);
};

/**
 * Tracks a latency sample and updates the running average.
 */
export const trackAssignmentLatencySample = (latencyMs: number | undefined): void => {
  if (typeof latencyMs !== 'number' || Number.isNaN(latencyMs) || latencyMs < 0) {
    return;
  }
  const store = ensureTelemetryStore();
  if (!store) {
    return;
  }
  applyMetrics(store, (metrics) => {
    const samples = metrics.assignment_samples + 1;
    const prevTotal = (metrics.assignment_latency_ms ?? 0) * metrics.assignment_samples;
    const nextAvg = (prevTotal + latencyMs) / samples;
    return {
      ...metrics,
      assignment_samples: samples,
      assignment_latency_ms: Math.round(nextAvg),
    };
  });
};

/**
 * Tracks whether a picker close satisfied the SLA threshold.
 */
export const trackPickerCloseSample = (
  closedWithinThreshold: boolean,
  options?: { closeDurationMs?: number },
): void => {
  const store = ensureTelemetryStore();
  if (!store) {
    return;
  }
  applyMetrics(store, (metrics) => {
    const samples = metrics.picker_close_samples + 1;
    const within = metrics.picker_close_within_target + (closedWithinThreshold ? 1 : 0);
    const closeRate = samples > 0 ? Number(((within / samples) * 100).toFixed(2)) : null;
    return {
      ...metrics,
      picker_close_samples: samples,
      picker_close_within_target: within,
      picker_close_rate: closeRate,
    };
  });

  if (options?.closeDurationMs != null) {
    appendEvent(store, {
      type: 'close',
      slotId: null,
      closeDurationMs: options.closeDurationMs,
      closedWithinThreshold,
      timestamp: Date.now(),
    });
  }
};

/**
 * Aggregates tap counts recorded during worker picker assignments.
 */
export const accumulateTapSamples = (tapCount: number): void => {
  if (typeof tapCount !== 'number' || Number.isNaN(tapCount) || tapCount < 0) {
    return;
  }
  const store = ensureTelemetryStore();
  if (!store) {
    return;
  }
  store.tapCount = (store.tapCount ?? 0) + tapCount;
};

/**
 * Records an assignment interaction event (tap or drag).
 */
export const recordAssignmentInteractionEvent = (event: AssignmentInteractionEvent): void => {
  const store = ensureTelemetryStore();
  if (!store) {
    return;
  }
  store.assignmentInteraction.push(event);
  const diagnostics = createSandboxDiagnostics<PickerDiagnosticsPayload>('AssignmentInteraction', 'picker');
  diagnostics.debug('Recorded assignment interaction', event);
};

const cloneStore = (store: WorkerPickerTelemetryStore): WorkerPickerTelemetryStore => ({
  events: [...store.events],
  metrics: { ...store.metrics },
  tapCount: store.tapCount,
  risk: store.risk ? { ...store.risk } : undefined,
  assignmentInteraction: [...store.assignmentInteraction],
});

/**
 * Returns the current telemetry snapshot, optionally cloning it to avoid mutations.
 */
export const getTelemetrySnapshot = (
  options?: { clone?: boolean },
): WorkerPickerTelemetryStore | null => {
  const store = ensureTelemetryStore();
  if (!store) {
    return null;
  }
  if (options?.clone) {
    return cloneStore(store);
  }
  return store;
};

/**
 * Aggregated data for assignment heatmap visualization.
 */
export interface AssignmentHeatmapData {
  /** Matrix of slot×resident assignment counts */
  matrix: Record<string, Record<string, AssignmentCounts>>;
  /** All unique slot IDs found in telemetry */
  slotIds: string[];
  /** All unique resident IDs found in telemetry */
  residentIds: string[];
  /** Total events processed */
  totalEvents: number;
}

/**
 * Assignment counts for a specific slot/resident combination.
 */
export interface AssignmentCounts {
  /** Number of assignment attempts */
  attempts: number;
  /** Number of successful assignments */
  successes: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Latest timestamp for this combination */
  lastAttempt: number | null;
}

/**
 * Aggregates telemetry events into a heatmap matrix for assignment analysis.
 * Produces slot×resident matrix with attempt/success/ratio counts.
 *
 * @param events - Array of telemetry events to aggregate
 * @param options - Optional filtering options
 * @returns Aggregated heatmap data
 */
export function aggregateAssignmentHeatmap(
  events: WorkerPickerTelemetryEvent[],
  options?: {
    /** Minimum timestamp to include (milliseconds since epoch) */
    since?: number;
    /** Maximum number of events to process (for performance) */
    maxEvents?: number;
  }
): AssignmentHeatmapData {
  const matrix: Record<string, Record<string, AssignmentCounts>> = {};
  const slotIds = new Set<string>();
  const residentIds = new Set<string>();
  
  // Filter events by time if specified
  let filteredEvents = events;
  const since = options?.since;
  if (typeof since === 'number') {
    filteredEvents = events.filter((event) => !event.timestamp || event.timestamp >= since);
  }
  
  // Limit events for performance if specified
  if (options?.maxEvents) {
    filteredEvents = filteredEvents.slice(-options.maxEvents);
  }

  // Process each event
  for (const event of filteredEvents) {
    if (event.type === 'assignment_attempt') {
      const slotId = event.slotId || 'unknown';
      const residentId = event.residentId;
      
      slotIds.add(slotId);
      residentIds.add(residentId);
      
      if (!matrix[slotId]) {
        matrix[slotId] = {};
      }
      if (!matrix[slotId][residentId]) {
        matrix[slotId][residentId] = {
          attempts: 0,
          successes: 0,
          successRate: 0,
          lastAttempt: null,
        };
      }
      
      matrix[slotId][residentId].attempts++;
      matrix[slotId][residentId].lastAttempt = event.timestamp ?? null;
      
    } else if (event.type === 'assignment_success') {
      const slotId = event.slotId || 'unknown';
      const residentId = event.residentId;
      
      if (matrix[slotId]?.[residentId]) {
        matrix[slotId][residentId].successes++;
      }
    }
  }

  // Calculate success rates
  for (const slotId in matrix) {
    for (const residentId in matrix[slotId]) {
      const counts = matrix[slotId][residentId];
      counts.successRate = counts.attempts > 0 ? counts.successes / counts.attempts : 0;
    }
  }

  return {
    matrix,
    slotIds: Array.from(slotIds).sort(),
    residentIds: Array.from(residentIds).sort(),
    totalEvents: filteredEvents.length,
  };
}

/**
 * Actions that can be replayed for WorkerPicker telemetry events.
 */
export type ReplayAction =
  | { type: 'open_picker'; slotId: string }
  | { type: 'attempt_assignment'; slotId: string; residentId: string }
  | { type: 'confirm_assignment'; slotId: string; residentId: string }
  | { type: 'cancel_assignment' }
  | { type: 'close_picker' };

/**
 * Pure helper that converts a telemetry event into a list of replay actions.
 * This allows testing replay logic without side effects.
 *
 * @param event The telemetry event to replay
 * @returns List of actions to execute in order
 */
export function getReplayActions(event: WorkerPickerTelemetryEvent): ReplayAction[] {
  switch (event.type) {
    case 'open':
      if (event.slotId) {
        return [{ type: 'open_picker', slotId: event.slotId }];
      }
      return [];

    case 'assignment_attempt':
      if (event.slotId && event.residentId) {
        return [{ type: 'attempt_assignment', slotId: event.slotId, residentId: event.residentId }];
      }
      return [];

    case 'assignment_success':
      if (event.slotId && event.residentId) {
        return [{ type: 'confirm_assignment', slotId: event.slotId, residentId: event.residentId }];
      }
      return [];

    case 'assignment_cancel':
      return [{ type: 'cancel_assignment' }];

    case 'close':
      return [{ type: 'close_picker' }];

    default:
      return [];
  }
}
