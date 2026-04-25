import { DEFAULT_PINBALL_PHYSICS_CONFIG } from '@/ui/testing/pinballPhysics';

/**
 * Configuration surface for the pinball watchdog/monitor.
 * Values are designed to align with the cinematic Alt Visuals v6 animation
 * timings and should only be tweaked via config (never inline).
 */
export interface PinballMonitorConfig {
  /** Polling cadence for reading the animation bridge (ms). */
  pollingIntervalMs: number;
  /** Threshold before the watchdog considers the ball stuck (ms). */
  ballStuckThresholdMs: number;
  /** Grace period after full pillar landing before ball auto-launch must start (ms). */
  autoLaunchGraceMs: number;
  /** Max idle time without new pillar progress before triggering a relaunch (ms). */
  pillarStallThresholdMs: number;
  /** Max number of telemetry events kept in-memory. */
  maxEventHistory: number;
  /** Custom event name used for telemetry dispatch. */
  telemetryEventName: string;
  /** Enable verbose diagnostics (console + payload exposure). */
  diagnostics: boolean;
}

export const DEFAULT_PINBALL_MONITOR_CONFIG: PinballMonitorConfig = {
  pollingIntervalMs: 250,
  ballStuckThresholdMs: DEFAULT_PINBALL_PHYSICS_CONFIG.maxSteps * 25, // approx. 4.5s timeline
  autoLaunchGraceMs: 1500,
  pillarStallThresholdMs: 2000,
  maxEventHistory: 20,
  telemetryEventName: 'alt_visual_pinball_watchdog',
  diagnostics: false,
};

/**
 * Utility for merging partial overrides while preserving the canonical defaults.
 */
export function resolvePinballMonitorConfig(
  overrides?: Partial<PinballMonitorConfig>,
): PinballMonitorConfig {
  return {
    ...DEFAULT_PINBALL_MONITOR_CONFIG,
    ...overrides,
  };
}
