import type { WorkerPickerTelemetryStore } from '@/ui/idleVillage/utils/workerPickerTelemetry';

/**
 * Creates a fully typed telemetry store for sandbox-related tests.
 */
export const createTelemetryTestStore = (): WorkerPickerTelemetryStore => ({
  events: [],
  metrics: {
    assignment_latency_ms: null,
    assignment_samples: 0,
    picker_close_rate: null,
    picker_close_samples: 0,
    picker_close_within_target: 0,
  },
  tapCount: 0,
  assignmentInteraction: [],
});
