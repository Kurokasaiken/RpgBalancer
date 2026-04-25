import type { QueuedAssignment, SchedulingDecision } from '../hooks/useCrewScheduler';
import type { DropFeedbackType } from '../config/dropFeedbackConfig';

/**
 * Base interface for all crew scheduler analytics events.
 */
interface BaseAnalyticsEvent {
  /** Event timestamp in milliseconds. */
  timestamp: number;
}

/**
 * Snapshot emitted whenever the crew queue changes.
 */
export interface CrewQueueSnapshotEvent extends BaseAnalyticsEvent {
  type: 'queue_snapshot';
  queueStats: {
    total: number;
    avgPriority: number;
    maxSize: number;
    byActivity: Record<string, number>;
  };
  avgFatigue: number;
  avgStatMatch: number;
}

/**
 * Event emitted for every scheduling decision.
 */
export interface CrewDecisionEvent extends BaseAnalyticsEvent {
  type: 'decision';
  decision: SchedulingDecision;
}

/**
 * Event emitted whenever a drop feedback result is shown.
 */
export interface CrewDropFeedbackEvent extends BaseAnalyticsEvent {
  type: 'drop_feedback';
  feedbackType: DropFeedbackType;
  validationRule?: string;
  residentId?: string;
  activityId?: string;
  context?: string;
}

export type CrewSchedulerAnalyticsEvent =
  | CrewQueueSnapshotEvent
  | CrewDecisionEvent
  | CrewDropFeedbackEvent;

type AnalyticsListener = (event: CrewSchedulerAnalyticsEvent) => void;

const listeners = new Set<AnalyticsListener>();
const history: CrewSchedulerAnalyticsEvent[] = [];
const MAX_HISTORY = 500;

/**
 * Publishes an analytics event to all listeners and caches it in history.
 */
function publish(event: CrewSchedulerAnalyticsEvent): void {
  history.push(event);
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
  listeners.forEach((listener) => listener(event));
}

/**
 * Subscribes to analytics events.
 */
export function subscribeToCrewSchedulerAnalytics(listener: AnalyticsListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Returns a shallow copy of the analytics history.
 */
export function getCrewSchedulerAnalyticsHistory(): CrewSchedulerAnalyticsEvent[] {
  return [...history];
}

/**
 * Clears the analytics history. Intended for testing.
 */
export function clearCrewSchedulerAnalyticsHistory(): void {
  history.length = 0;
}

/**
 * Emits a queue snapshot event for the provided queue.
 */
export function recordCrewQueueSnapshot(
  queue: QueuedAssignment[],
  queueStats: CrewQueueSnapshotEvent['queueStats'],
): void {
  const avgFatigue =
    queue.length > 0
      ? queue.reduce((sum, assignment) => sum + assignment.factors.fatigue, 0) / queue.length
      : 0;

  const avgStatMatch =
    queue.length > 0
      ? queue.reduce((sum, assignment) => sum + assignment.factors.statTagMatch, 0) / queue.length
      : 0;

  publish({
    type: 'queue_snapshot',
    timestamp: Date.now(),
    queueStats,
    avgFatigue,
    avgStatMatch,
  });
}

/**
 * Emits a decision event for analytics consumers.
 */
export function recordCrewDecision(decision: SchedulingDecision): void {
  publish({
    type: 'decision',
    timestamp: Date.now(),
    decision,
  });
}

/**
 * Emits a drop feedback event that can be used to measure drop failure rate.
 */
export function recordCrewDropFeedback(event: Omit<CrewDropFeedbackEvent, 'type' | 'timestamp'>): void {
  publish({
    type: 'drop_feedback',
    timestamp: Date.now(),
    ...event,
  });
}
