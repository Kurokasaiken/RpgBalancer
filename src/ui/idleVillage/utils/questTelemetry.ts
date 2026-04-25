/**
 * Quest Telemetry Utilities
 * 
 * Utility functions for quest telemetry tracking and event emission.
 * Provides a simple interface for tracking quest-related events.
 * 
 * @since IV-Phase12-quest-detail-lens
 * @author Aurora-Quest
 */

import type { QuestTelemetryEvent, QuestTelemetryEventType } from './questTelemetrySystem';

/**
 * Simple quest event tracking function
 * 
 * @param eventType - Type of quest event
 * @param data - Event data payload
 */
export function trackQuestEvent<T = unknown>(
  eventType: QuestTelemetryEventType | string,
  data: T
): void {
  // Create telemetry event
  const event: QuestTelemetryEvent<T> = {
    id: `quest-event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: eventType as QuestTelemetryEventType,
    timestamp: Date.now(),
    sessionId: `session-${Date.now()}`,
    data,
  };

  // Log to console for now (could be enhanced with proper telemetry system)
  console.log('[Quest Telemetry]', event);
}

/**
 * Quest lens specific event types
 */
export type QuestLensEventType = 
  | 'quest_lens_opened'
  | 'quest_lens_closed'
  | 'quest_lens_navigate';

/**
 * Track quest lens specific events
 * 
 * @param eventType - Quest lens event type
 * @param data - Event data
 */
export function trackQuestLensEvent<T = unknown>(
  eventType: QuestLensEventType,
  data: T
): void {
  trackQuestEvent(eventType, data);
}
