/**
 * Generic telemetry system for the RPG Balancer project
 * Provides a unified interface for tracking events across all modules
 */

export interface TelemetryEvent {
  eventName: string;
  payload: Record<string, any>;
  timestamp: number;
}

/**
 * Dispatches a telemetry event with the provided payload
 * Currently logs to console, but can be extended to send to analytics services
 */
export function trackTelemetryEvent(eventName: string, payload: Record<string, any>): void {
  const event: TelemetryEvent = {
    eventName,
    payload: {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    },
    timestamp: Date.now(),
  };

  // TODO: Replace with actual analytics service integration
  console.log(`[Telemetry] ${eventName}:`, event);
}
