/**
 * Index file for Archmage STS Simulator Hooks
 * 
 * Central export point for all STS simulator React hooks.
 * These hooks provide config-first access to deck data, enemy profiles, and run recording.
 */

// Deck configuration hooks
export { useSTSDeckConfig, useSTSCards } from './useSTSDeckConfig';

// Enemy profile hooks
export { useSTSEnemyProfile, useSTSIntents } from './useSTSEnemyProfile';

// Run recording and telemetry hooks
export { useSTSRunRecorder } from './useSTSRunRecorder';

// Simulator engine
export { useSTSSimulatorEngine } from './useSTSSimulatorEngine';

// Re-export types for convenience
export type {
  STSTurnLog,
  STSRunSummary,
  STSTelemetryEvent,
  STSRunRecorderState,
} from './useSTSRunRecorder';
