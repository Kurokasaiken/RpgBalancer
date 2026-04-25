/**
 * Telemetry stub per la workspace Wanderlust Triumph.
 * Espone gli stessi simboli usati dai componenti Idle Village ma non invia dati.
 */

export function trackTelemetryEvent(event: string, payload?: Record<string, unknown>): void {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    console.debug('[telemetry:stub]', event, payload);
  }
}

export function trackStressTelemetryEvent(event: string, payload?: Record<string, unknown>): void {
  trackTelemetryEvent(event, payload);
}

export function trackPWATelemetry(event: string, payload?: Record<string, unknown>): void {
  trackTelemetryEvent(event, payload);
}

export const telemetryProviderStub = {
  trackTelemetryEvent,
  trackStressTelemetryEvent,
  trackPWATelemetry,
};
