/**
 * Mock telemetry implementation for Idle Village testing.
 * Provides mock analytics functions that match the telemetry interface used by tests.
 */

/**
 * Mock telemetry event interface.
 */
export interface MockTelemetryEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

/**
 * Mock telemetry analytics interface.
 */
export interface MockTelemetryAnalytics {
  track: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  page: (name?: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
  emit: (event: string, data?: unknown) => void;
}

/**
 * Mock telemetry implementation for testing.
 */
class MockTelemetry implements MockTelemetryAnalytics {
  private events: MockTelemetryEvent[] = [];

  track(event: string, properties?: Record<string, unknown>): void {
    this.events.push({
      event,
      properties,
      timestamp: Date.now(),
    });
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    this.track('user_identified', { userId, ...traits });
  }

  page(name?: string, properties?: Record<string, unknown>): void {
    this.track('page_viewed', { name, ...properties });
  }

  reset(): void {
    this.events = [];
  }

  emit(event: string, data?: Record<string, unknown>): void {
    this.track(event, data);
  }

  /**
   * Get all tracked events for testing assertions.
   */
  getEvents(): MockTelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events for test isolation.
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Get events by event name.
   */
  getEventsByName(eventName: string): MockTelemetryEvent[] {
    return this.events.filter(event => event.event === eventName);
  }

  /**
   * Get the last tracked event.
   */
  getLastEvent(): MockTelemetryEvent | undefined {
    return this.events[this.events.length - 1];
  }

  /**
   * Check if an event was tracked.
   */
  hasEvent(eventName: string): boolean {
    return this.events.some(event => event.event === eventName);
  }

  /**
   * Get event count for a specific event name.
   */
  getEventCount(eventName: string): number {
    return this.events.filter(event => event.event === eventName).length;
  }
}

/**
 * Global mock telemetry instance.
 */
export const mockTelemetry = new MockTelemetry();

/**
 * Mock telemetry factory for creating isolated instances.
 */
export function createMockTelemetry(): MockTelemetry {
  return new MockTelemetry();
}

/**
 * Mock telemetry analytics export that matches the expected interface.
 */
export const telemetry = mockTelemetry;

/**
 * Export mock telemetry as default for compatibility.
 */
export default mockTelemetry;
