import type { STSManaType } from './types';

/**
 * Thresholds and rolling-window settings used by the STS numeric simulator telemetry pipeline.
 * Config-first so that balancing/design can tune alert sensitivity without touching hook logic.
 */
export interface STSTelemetryConfigSchema {
  agency: {
    /** Number of consecutive idle player turns that constitutes an agency gap. */
    idleTurnThreshold: number;
  };
  pacing: {
    /** Latest turn that still counts as "early game" for pacing reports. */
    earlyTurnCap: number;
    /** Latest turn that still counts as "mid game" (exclusive upper bound for late). */
    midTurnCap: number;
  };
  resourceBalance: {
    /** Amount of snapshots to keep when computing resonance vs inspiration variance. */
    windowSize: number;
    /** Variance threshold that triggers telemetry alerts. */
    varianceAlertThreshold: number;
    /** Optional mana families to track for additional diagnostics. */
    trackedManaTypes: readonly STSManaType[];
  };
}

export const STSTelemetryConfig: STSTelemetryConfigSchema = {
  agency: {
    idleTurnThreshold: 2,
  },
  pacing: {
    earlyTurnCap: 4,
    midTurnCap: 10,
  },
  resourceBalance: {
    windowSize: 4,
    varianceAlertThreshold: 9,
    trackedManaTypes: ['alteration', 'bio', 'wave', 'entropy'],
  },
} as const;
