// TODO: Replace with generic telemetry system

interface MinimalGameplayTelemetryBase {
  source?: string;
  timestamp?: number;
}

export interface MinimalGameplayTickPayload extends MinimalGameplayTelemetryBase {
  origin: 'manual' | 'auto';
  currentDay: number;
  gold: number;
  food: number;
  speedMultiplier: number;
}

export interface MinimalGameplayPausePayload extends MinimalGameplayTelemetryBase {
  isPaused: boolean;
  reason: 'user' | 'auto';
  currentDay: number;
  speedMultiplier: number;
}

const DEFAULT_SOURCE = 'minimal_gameplay_loop';

/**
 * Dispatches the tick telemetry event with the provided payload.
 */
export function emitMinimalGameplayTick(payload: MinimalGameplayTickPayload): void {
  // TODO: Replace with generic telemetry system
  console.log('Minimal gameplay tick:', { source: DEFAULT_SOURCE, timestamp: Date.now(), ...payload });
}

/**
 * Dispatches the pause/resume telemetry event with the provided payload.
 */
export function emitMinimalGameplayPauseToggle(payload: MinimalGameplayPausePayload): void {
  // TODO: Replace with generic telemetry system
  console.log('Minimal gameplay pause toggle:', { source: DEFAULT_SOURCE, timestamp: Date.now(), ...payload });
}
