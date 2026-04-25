/**
 * Simple telemetry mock for STS Card Notebook Export
 */

import type { StressTestArchetype } from './types';

interface TelemetryEventPayload {
  eventType: string;
  data: Record<string, unknown>;
}

export async function emitTelemetryEvent(event: TelemetryEventPayload): Promise<void> {
  // Mock implementation - in real implementation this would send to analytics
  console.log(`[TELEMETRY] ${event.eventType}:`, event.data);
}
