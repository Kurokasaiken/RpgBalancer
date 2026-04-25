import type { DragDropEventType, DragDropTelemetryPayload } from '@/ui/idleVillage/utils/dragDropTelemetry';

/**
 * Visual phase used to cluster timeline events by operation type.
 */
export type DropTimelinePhase = 'drag' | 'validation' | 'drop' | 'feedback' | 'other';

const EVENT_PHASE_MAP: Record<DragDropEventType, DropTimelinePhase> = {
  drag_start: 'drag',
  drag_end: 'drag',
  drop_start: 'drag',
  drop_apply: 'drop',
  drop_block: 'drop',
  drop_cancel: 'drop',
  validation_start: 'validation',
  validation_end: 'validation',
  feedback_shown: 'feedback',
  feedback_clicked: 'feedback',
  feedback_dismissed: 'feedback',
};

const DROP_RESULT_PRIORITY: Array<DragDropEventType> = ['drop_apply', 'drop_block', 'drop_cancel'];

const DEFAULT_CONTEXTS: Array<NonNullable<DragDropTelemetryPayload['context']>> = [
  'map_drag',
  'roster_drag',
  'theater_drag',
  'unknown',
];

/**
 * Clamp helper to keep percentage values within bounds.
 */
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const DEFAULT_TIME_WINDOW_HOURS = 24;

/**
 * Filter state used by the drop timeline analytics pipeline.
 */
export interface DropTimelineFilters {
  /** Resident IDs that should remain visible. Empty = all. */
  residentIds: string[];
  /** Activity IDs or target locations to highlight. Empty = all. */
  activityIds: string[];
  /** Context filters, defaults to all map/roster/theater contexts. */
  contexts: Array<NonNullable<DragDropTelemetryPayload['context']>>;
  /** Whether to show only sessions that ended with a blocked drop. */
  showBlockedOnly: boolean;
  /** Limit sessions considered in analytics (null = unlimited). */
  sessionLimit: number | null;
  /** Optional sliding time window. Null = use all data. */
  timeWindowHours: number | null;
}

/**
 * Baseline filters applied by the hook/UI.
 */
export const DEFAULT_DROP_TIMELINE_FILTERS: DropTimelineFilters = {
  residentIds: [],
  activityIds: [],
  contexts: DEFAULT_CONTEXTS,
  showBlockedOnly: false,
  sessionLimit: 50,
  timeWindowHours: DEFAULT_TIME_WINDOW_HOURS,
};

/**
 * Enriched drag/drop telemetry record decorated for charting.
 */
export interface DropTimelineEvent extends DragDropTelemetryPayload {
  phase: DropTimelinePhase;
  /** Human friendly label used by the UI. */
  displayLabel: string;
  /** Normalized position inside the session duration (0-100). */
  offsetPct: number;
  /** Event timestamp relative to the first event in the session. */
  relativeMs: number;
}

/**
 * Derived KPIs for a drag/drop session.
 */
export interface DropTimelineSessionSummary {
  durationMs: number;
  validationLatencyMs?: number;
  applyLatencyMs?: number;
  dropResult: 'applied' | 'blocked' | 'cancelled' | 'unknown';
  eventsCount: number;
}

/**
 * Session composed of the ordered events emitted for a single drag/drop attempt.
 */
export interface DropTimelineSession {
  sessionId: string;
  residentId: string;
  activityId?: string;
  context: NonNullable<DragDropTelemetryPayload['context']>;
  startedAt: number;
  endedAt: number;
  events: DropTimelineEvent[];
  summary: DropTimelineSessionSummary;
}

/**
 * Aggregate metrics displayed in the panel header.
 */
export interface DropTimelineMetrics {
  totalEvents: number;
  sessionCount: number;
  validDrops: number;
  blockedDrops: number;
  cancelledDrops: number;
  averageValidationMs: number;
  averageApplyMs: number;
}

/**
 * Final structure returned by the analytics module.
 */
export interface DropTimelineData {
  sessions: DropTimelineSession[];
  metrics: DropTimelineMetrics;
  range: {
    start: number | null;
    end: number | null;
  };
  catalog: {
    residents: string[];
    activities: string[];
    contexts: Array<NonNullable<DragDropTelemetryPayload['context']>>;
  };
}

const DROP_RESULT_LABEL: Record<DropTimelineSessionSummary['dropResult'], string> = {
  applied: 'drop_apply',
  blocked: 'drop_block',
  cancelled: 'drop_cancel',
  unknown: 'unknown',
};

/**
 * Produce human readable labels for known events.
 */
const buildDisplayLabel = (event: DragDropTelemetryPayload): string => {
  switch (event.eventType) {
    case 'drag_start':
      return 'Drag started';
    case 'drop_start':
      return 'Drop started';
    case 'validation_start':
      return 'Validation started';
    case 'validation_end':
      return event.validationResult?.isValid ? 'Validation success' : 'Validation failed';
    case 'drop_apply':
      return 'Drop applied';
    case 'drop_block':
      return 'Drop blocked';
    case 'drop_cancel':
      return 'Drop cancelled';
    case 'feedback_shown':
      return 'Feedback shown';
    case 'feedback_clicked':
      return 'Feedback clicked';
    case 'feedback_dismissed':
      return 'Feedback dismissed';
    default:
      return event.eventType;
  }
};

/**
 * Sanitize raw telemetry payloads prior to grouping.
 */
const normalizeEvents = (events: DragDropTelemetryPayload[]): DropTimelineEvent[] => {
  return events
    .filter((event) => typeof event.timestamp === 'number' && Boolean(event.sessionId))
    .map((event) => ({
      ...event,
      phase: EVENT_PHASE_MAP[event.eventType] ?? 'other',
      displayLabel: buildDisplayLabel(event),
      offsetPct: 0,
      relativeMs: 0,
      context: event.context ?? 'unknown',
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Determine the terminal outcome for a session based on event priority.
 */
const deriveDropResult = (events: DropTimelineEvent[]): DropTimelineSessionSummary['dropResult'] => {
  const terminal = DROP_RESULT_PRIORITY.find((type) => events.some((event) => event.eventType === type));
  switch (terminal) {
    case 'drop_apply':
      return 'applied';
    case 'drop_block':
      return 'blocked';
    case 'drop_cancel':
      return 'cancelled';
    default:
      return 'unknown';
  }
};

/**
 * Build summary stats such as durations and counts for a session.
 */
const computeSummary = (events: DropTimelineEvent[]): DropTimelineSessionSummary => {
  if (events.length === 0) {
    return {
      durationMs: 0,
      dropResult: 'unknown',
      eventsCount: 0,
    };
  }

  const first = events[0].timestamp;
  const last = events[events.length - 1].timestamp;
  const validationEnd = events.find((event) => event.eventType === 'validation_end');
  const validationStart = events.find((event) => event.eventType === 'validation_start');
  const dropApply = events.find((event) => event.eventType === 'drop_apply');

  return {
    durationMs: Math.max(last - first, 0),
    validationLatencyMs:
      validationStart && validationEnd ? validationEnd.timestamp - validationStart.timestamp : undefined,
    applyLatencyMs: validationEnd && dropApply ? dropApply.timestamp - validationEnd.timestamp : undefined,
    dropResult: deriveDropResult(events),
    eventsCount: events.length,
  };
};

/**
 * Determine whether the event respects user filters and retention window.
 */
const passesFilters = (event: DropTimelineEvent, filters: DropTimelineFilters, minTimestamp: number | null) => {
  if (minTimestamp && event.timestamp < minTimestamp) {
    return false;
  }

  if (filters.residentIds.length > 0 && event.residentId && !filters.residentIds.includes(event.residentId)) {
    return false;
  }

  if (
    filters.activityIds.length > 0 &&
    (event.activityId || event.targetLocation) &&
    !filters.activityIds.includes(event.activityId ?? event.targetLocation ?? '')
  ) {
    return false;
  }

  if (filters.contexts.length > 0 && !filters.contexts.includes(event.context ?? 'unknown')) {
    return false;
  }

  return true;
};

/**
 * Normalize raw drag/drop telemetry into grouped sessions and metrics.
 */
export function buildDropTimelineData(
  rawEvents: DragDropTelemetryPayload[],
  filters: DropTimelineFilters = DEFAULT_DROP_TIMELINE_FILTERS,
): DropTimelineData {
  const normalized = normalizeEvents(rawEvents);
  const catalogResidents = new Set<string>();
  const catalogActivities = new Set<string>();
  normalized.forEach((event) => {
    if (event.residentId) catalogResidents.add(event.residentId);
    if (event.activityId) catalogActivities.add(event.activityId);
    if (!event.activityId && event.targetLocation) catalogActivities.add(event.targetLocation);
  });

  const now = Date.now();
  const minTimestamp = filters.timeWindowHours ? now - filters.timeWindowHours * 60 * 60 * 1000 : null;

  const filteredEvents = normalized.filter((event) => passesFilters(event, filters, minTimestamp));

  const sessionsMap = new Map<string, DropTimelineSession>();

  filteredEvents.forEach((event) => {
    const sessionKey = event.sessionId ?? `${event.residentId}-${event.timestamp}`;
    if (!sessionsMap.has(sessionKey)) {
      sessionsMap.set(sessionKey, {
        sessionId: event.sessionId || sessionKey,
        residentId: event.residentId || 'unknown_resident',
        activityId: event.activityId ?? event.targetLocation,
        context: event.context ?? 'unknown',
        startedAt: event.timestamp,
        endedAt: event.timestamp,
        events: [],
        summary: {
          durationMs: 0,
          dropResult: 'unknown',
          eventsCount: 0,
        },
      });
    }

    const session = sessionsMap.get(sessionKey)!;
    session.events.push(event);
    session.startedAt = Math.min(session.startedAt, event.timestamp);
    session.endedAt = Math.max(session.endedAt, event.timestamp);
  });

  const sessions = Array.from(sessionsMap.values())
    .map((session) => {
      const duration = Math.max(session.endedAt - session.startedAt, 1);
      session.events = session.events
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((event) => ({
          ...event,
          offsetPct: clamp(((event.timestamp - session.startedAt) / duration) * 100, 0, 100),
          relativeMs: event.timestamp - session.startedAt,
        }));

      session.summary = computeSummary(session.events);

      if (filters.showBlockedOnly && session.summary.dropResult !== 'blocked') {
        return null;
      }

      return session;
    })
    .filter((session): session is DropTimelineSession => Boolean(session))
    .sort((a, b) => b.startedAt - a.startedAt);

  const limitedSessions = filters.sessionLimit ? sessions.slice(0, filters.sessionLimit) : sessions;

  const metrics = calculateMetrics(limitedSessions);

  const timestamps = limitedSessions.flatMap((session) => [session.startedAt, session.endedAt]);
  const range = {
    start: timestamps.length ? Math.min(...timestamps) : null,
    end: timestamps.length ? Math.max(...timestamps) : null,
  };

  return {
    sessions: limitedSessions,
    metrics,
    range,
    catalog: {
      residents: Array.from(catalogResidents).sort(),
      activities: Array.from(catalogActivities).sort(),
      contexts: DEFAULT_CONTEXTS,
    },
  };
}

/**
 * Compute aggregate KPIs for the visible session set.
 */
const calculateMetrics = (sessions: DropTimelineSession[]): DropTimelineMetrics => {
  if (sessions.length === 0) {
    return {
      totalEvents: 0,
      sessionCount: 0,
      validDrops: 0,
      blockedDrops: 0,
      cancelledDrops: 0,
      averageValidationMs: 0,
      averageApplyMs: 0,
    };
  }

  let totalEvents = 0;
  let validDrops = 0;
  let blockedDrops = 0;
  let cancelledDrops = 0;
  let validationSum = 0;
  let validationCount = 0;
  let applySum = 0;
  let applyCount = 0;

  sessions.forEach((session) => {
    totalEvents += session.events.length;
    switch (session.summary.dropResult) {
      case 'applied':
        validDrops += 1;
        break;
      case 'blocked':
        blockedDrops += 1;
        break;
      case 'cancelled':
        cancelledDrops += 1;
        break;
      default:
        break;
    }

    if (typeof session.summary.validationLatencyMs === 'number') {
      validationSum += session.summary.validationLatencyMs;
      validationCount += 1;
    }

    if (typeof session.summary.applyLatencyMs === 'number') {
      applySum += session.summary.applyLatencyMs;
      applyCount += 1;
    }
  });

  return {
    totalEvents,
    sessionCount: sessions.length,
    validDrops,
    blockedDrops,
    cancelledDrops,
    averageValidationMs: validationCount ? Math.round(validationSum / validationCount) : 0,
    averageApplyMs: applyCount ? Math.round(applySum / applyCount) : 0,
  };
};

/**
 * Serialize analytics data as JSON for diagnostics/export.
 */
export const exportDropTimelineJSON = (data: DropTimelineData): string => {
  return JSON.stringify(
    {
      generatedAt: Date.now(),
      range: data.range,
      metrics: data.metrics,
      sessions: data.sessions.map((session) => ({
        ...session,
        events: session.events.map((event) => ({
          eventType: event.eventType,
          timestamp: event.timestamp,
          offsetPct: event.offsetPct,
          residentId: event.residentId,
          activityId: event.activityId,
          targetLocation: event.targetLocation,
          validationResult: event.validationResult,
          performance: event.performance,
          context: event.context,
        })),
      })),
    },
    2,
  );
};

/**
 * Export analytics data as CSV (session x event rows).
 */
export const exportDropTimelineCSV = (data: DropTimelineData): string => {
  const header = [
    'session_id',
    'resident_id',
    'activity_id',
    'context',
    'event_type',
    'timestamp',
    'offset_pct',
    'validation_result',
    'validation_rule',
    'is_valid',
  ];

  const rows = data.sessions.flatMap((session) =>
    session.events.map((event) => [
      session.sessionId,
      session.residentId,
      session.activityId ?? '',
      session.context,
      event.eventType,
      new Date(event.timestamp).toISOString(),
      event.offsetPct.toFixed(2),
      event.displayLabel,
      event.validationResult?.rule ?? '',
      typeof event.validationResult?.isValid === 'boolean' ? String(event.validationResult.isValid) : '',
    ]),
  );

  return [header.join(','), ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');
};

/**
 * Telemetry events emitted by the panel.
 */
export type DropTimelineTelemetryEvent = 'idle_drop_timeline_viewed' | 'idle_drop_timeline_exported';

/**
 * Dispatch telemetry describing panel usage to the diagnostics bus.
 */
export const emitDropTimelineTelemetry = (
  eventType: DropTimelineTelemetryEvent,
  detail: Record<string, unknown>,
): void => {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent(eventType, {
        detail: {
          timestamp: Date.now(),
          ...detail,
        },
      }),
    );
  } catch {
    /* noop */
  }
};
