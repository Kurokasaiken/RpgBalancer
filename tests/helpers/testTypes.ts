import type { AppNavTabId } from '@/shared/navigation/navConfig';

export interface TelemetryEventPayload {
  durationMs?: number;
  tapCount?: number;
  latencyMs?: number;
  closedWithinThreshold?: boolean;
  delta?: {
    gold?: number;
    food?: number;
    [key: string]: number | undefined;
  };
  [key: string]: unknown;
}

export interface SandboxTelemetryEvent {
  type: string;
  slotId?: string;
  residentId?: string;
  latencyMs?: number;
  timestamp: number;
  payload?: TelemetryEventPayload;
  [key: string]: unknown;
}

export interface TelemetrySnapshot {
  sessionId?: string;
  sessionTag?: string;
  events: SandboxTelemetryEvent[];
  metrics?: Record<string, unknown>;
  testInfo?: {
    title: string;
    file: string;
    line: number;
    column: number;
  };
  extractedAt?: string;
}

export interface AppNavControls {
  getActiveTab: () => AppNavTabId;
  setActiveTab: (tabId: AppNavTabId) => void;
}

export interface IdleVillageTestHooks {
  __sandboxTelemetry?: {
    events: SandboxTelemetryEvent[];
    metrics?: Record<string, unknown>;
    sessionId?: string;
  };
  __ENABLE_IDLE_VILLAGE_TEST_HOOKS?: boolean;
  __TEST_RESIDENTS?: Array<Record<string, unknown>>;
  __TEST_INVASION_TYPE?: string;
  __TEST_SEED?: string;
  __appNavControls?: AppNavControls;
}
