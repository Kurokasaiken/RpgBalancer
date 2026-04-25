import type { Page } from '@playwright/test';
import { waitForPickerState, dragResidentCard } from '../fixtures/villageSandbox';
import type {
  AssignmentInteractionEvent,
  WorkerPickerTelemetryMetrics,
  WorkerPickerTelemetryEvent,
} from '../../src/ui/idleVillage/utils/workerPickerTelemetry';

/**
 * Opens the worker picker by clicking on a slot.
 */
export async function openWorkerPicker(page: Page, slotId: string): Promise<void> {
  const slot = page.locator(`[data-slot-id="${slotId}"]`);
  await slot.click();
  await waitForPickerState(page, 'open');
}

/**
 * Assigns a resident via the picker.
 */
export async function assignViaPicker(page: Page, residentId: string): Promise<void> {
  const candidate = page.locator(`[data-sandbox-worker-id="${residentId}"]`);
  await candidate.click();
  await waitForPickerState(page, 'closed');
}

/**
 * Drags a resident to a slot.
 */
export async function dragResidentToSlot(page: Page, residentId: string, slotId: string): Promise<void> {
  const residentSelector = `[data-sandbox-resident-id="${residentId}"]`;
  const slotSelector = `[data-slot-id="${slotId}"]`;
  await dragResidentCard(page, residentSelector, slotSelector);
}

const EMPTY_METRICS: WorkerPickerTelemetryMetrics = {
  assignment_latency_ms: null,
  assignment_samples: 0,
  picker_close_rate: null,
  picker_close_samples: 0,
  picker_close_within_target: 0,
};

/**
 * Collects the telemetry snapshot (events + metrics) from the sandbox.
 */
interface PickerTelemetrySummary {
  events: WorkerPickerTelemetryEvent[];
  metrics: WorkerPickerTelemetryMetrics;
  tapCount: number;
  assignmentInteraction: AssignmentInteractionEvent[];
}

type SandboxTelemetryWindow = Window & {
  __sandboxTelemetry?: {
    events?: WorkerPickerTelemetryEvent[];
    metrics?: WorkerPickerTelemetryMetrics;
    tapCount?: number;
    assignmentInteraction?: AssignmentInteractionEvent[];
  };
};

export async function collectTelemetrySnapshot(page: Page): Promise<PickerTelemetrySummary> {
  return page.evaluate<PickerTelemetrySummary, WorkerPickerTelemetryMetrics>(
    (fallbackMetrics) => {
      const snapshot = (window as SandboxTelemetryWindow).__sandboxTelemetry;
      if (!snapshot) {
        return {
          events: [],
          metrics: fallbackMetrics,
          tapCount: 0,
          assignmentInteraction: [],
        };
      }

      return {
        events: snapshot.events ?? [],
        metrics: {
          assignment_latency_ms: snapshot.metrics?.assignment_latency_ms ?? fallbackMetrics.assignment_latency_ms,
          assignment_samples: snapshot.metrics?.assignment_samples ?? fallbackMetrics.assignment_samples,
          picker_close_rate: snapshot.metrics?.picker_close_rate ?? fallbackMetrics.picker_close_rate,
          picker_close_samples: snapshot.metrics?.picker_close_samples ?? fallbackMetrics.picker_close_samples,
          picker_close_within_target:
            snapshot.metrics?.picker_close_within_target ?? fallbackMetrics.picker_close_within_target,
        },
        tapCount: snapshot.tapCount ?? 0,
        assignmentInteraction: snapshot.assignmentInteraction ?? [],
      };
    },
    EMPTY_METRICS,
  );
}
