import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';

/**
 * Boot guard telemetry event types emitted by the multi-app guard orchestrator.
 */
export type BootGuardEventType = 'boot_guard_run' | 'boot_guard_failure' | 'boot_guard_recovery';

/**
 * Payload recorded with each telemetry event.
 */
export interface BootGuardTelemetryPayload {
  /** Page identifier from devBootGuardConfig */
  pageId: string;
  /** Human-friendly label for readability */
  label: string;
  /** Relative route targeted by the guard */
  route: string;
  /** Current attempt number (1-based) */
  attempt: number;
  /** Maximum attempts configured for the page */
  maxAttempts: number;
  /** Execution status summary */
  status: 'success' | 'failure' | 'retrying';
  /** Optional error information */
  errorMessage?: string;
  /** Additional metadata (e.g., artifact paths) */
  metadata?: Record<string, unknown>;
}

const diagnostics = createHeadlessDiagnostics('MultiAppBootGuard');

/** Persistence key for guard state tracking */
const BOOT_GUARD_STATE_KEY = 'multi_app_boot_guard_state';

/**
 * Per-page execution metadata persisted across runs.
 */
export interface BootGuardPageState {
  lastStatus: 'success' | 'failure';
  lastRunAt: number;
  retries: number;
  lastError?: string;
}

/**
 * Shape persisted through PersistenceService for the Multi-App Boot Guard.
 */
export interface BootGuardState {
  pages: Record<string, BootGuardPageState>;
  lastRunId?: string;
}

const DEFAULT_BOOT_GUARD_STATE: BootGuardState = {
  pages: {},
  lastRunId: undefined,
};

/**
 * Emits telemetry for the guard, leveraging sandbox diagnostics for traceability.
 */
export function trackBootGuardEvent(
  type: BootGuardEventType,
  payload: BootGuardTelemetryPayload,
): void {
  if (diagnostics.isEnabled()) {
    diagnostics.info(`Boot guard event: ${type}`, payload, ['multi-app-boot-guard', type, payload.pageId]);
  }

  if (typeof window !== 'undefined') {
    const globalKey = '__bootGuardEvents';
    type WindowWithBootGuard = typeof window & {
      [globalKey]?: Array<{ type: BootGuardEventType; payload: BootGuardTelemetryPayload; timestamp: number }>;
    };
    const win = window as WindowWithBootGuard;
    if (!Array.isArray(win[globalKey])) {
      win[globalKey] = [];
    }
    win[globalKey]?.push({ type, payload, timestamp: Date.now() });
  }
}

/**
 * Loads persisted guard state, defaulting to an empty structure if unavailable.
 */
export async function loadBootGuardState(): Promise<BootGuardState> {
  return loadData<BootGuardState>(BOOT_GUARD_STATE_KEY, DEFAULT_BOOT_GUARD_STATE);
}

/**
 * Persists the provided guard state snapshot.
 */
export async function saveBootGuardState(state: BootGuardState): Promise<void> {
  await saveData(BOOT_GUARD_STATE_KEY, state);
}

/**
 * Updates the stored metadata for a page and writes it back to persistence.
 */
export async function recordBootGuardPageState(
  pageId: string,
  partial: Partial<BootGuardPageState>,
): Promise<BootGuardState> {
  const current = await loadBootGuardState();
  const existing = current.pages[pageId] ?? {
    lastStatus: 'failure' as const,
    lastRunAt: 0,
    retries: 0,
    lastError: undefined,
  };

  const merged: BootGuardPageState = {
    ...existing,
    ...partial,
    lastRunAt: partial.lastRunAt ?? Date.now(),
  };

  current.pages[pageId] = merged;
  await saveBootGuardState(current);
  return current;
}
