import type { ReactNode } from 'react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { TradeResult, TradeRoute, MigrationRequest } from '@/ui/idleVillage/state/VillageRegistry';
import type { UseVillageSandboxReturn } from '@/ui/idleVillage/hooks/useVillageSandbox';
import type { ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';
import type { ActivityResolutionResult } from '@/ui/idleVillage/hooks/useActivityScheduler';
import type { HudEntry } from '@/ui/idleVillage/selectors/useHudSelectors';
import type { AggregatedTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import type { QuestResult } from '@/engine/quest/types';

/** Snapshot describing Idle Village resources exposed via test hooks. */
export type IdleVillageResourceSnapshot = {
  summary: {
    gold: number;
    food: number;
    population: number;
  };
  panel: Record<string, number>;
};

/** Snapshot representing the Action Detail Harness runtime state. */
export type ActionDetailHarnessState = {
  slotId: string | null;
  dropState: 'idle' | 'valid' | 'invalid';
  assignedResidentId: string | null;
  assignedResidentName: string | null;
  progressFraction: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  totalDurationSeconds: number;
  isPlaying: boolean;
};

type DemoPanelHandlers = NonNullable<UseVillageSandboxReturn['demoPanelHandlers']>;

/** Names of demo panel handlers exposed via {@link IdleVillageTestHooks}. */
export type DemoPanelHandlerName = keyof DemoPanelHandlers;

export type ResidentRosterEntry = {
  id: string;
  status: string;
  statTags: string[];
  fatigue: number;
};

/** Argument mapping for {@link DemoPanelHandlerName}. */
export type DemoPanelHandlerArgs<TName extends DemoPanelHandlerName> = DemoPanelHandlers[TName] extends (
  ...innerArgs: infer TArgs
) => void
  ? TArgs
  : never;

/** Snapshot of the trade routes and migration queue exposed to tests. */
export type TradeRoutesSnapshot = {
  tradeRoutes: TradeRoute[];
  migrationQueue: MigrationRequest[];
  lastTradeResult: TradeResult | null;
};

/** Diagnostics describing the active shell preset and available presets inside the Idle Village shell. */
export interface ShellPresetDiagnostics {
  activeShellPresetId: string;
  shellPresetOptions: Array<{
    id: string;
    label: string;
    isEditor: boolean;
  }>;
  availableActivityIds: string[];
}

/** Telemetry events captured from the scheduler to help diagnose balancing tests. */
export type SchedulerTelemetryEvent =
  | {
      type: 'activity_complete';
      timestamp: number;
      result: ActivityResolutionResult;
    }
  | {
      type: 'resource_change';
      timestamp: number;
      snapshot: Record<string, number>;
      changes: ResourceDeltaDefinition[];
    };

/** Union describing drag/drop intent states for sandbox dropzones. */
export type SandboxDropState = 'idle' | 'valid' | 'invalid' | 'locked';

/** Alias for drop state used in action detail harness. */
export type DropState = SandboxDropState;

/** Props interface for the useActionDetailHarness hook. */
export interface UseActionDetailHarnessProps {
  jobDropState: DropState;
  jobAssignedResidentId: string | null;
  jobAssignedResidentName: string | null;
  jobHelperText: string;
  slotDropStates: Record<string, SandboxDropState>;
  jobIsPlaying: boolean;
  jobProgressFraction: number;
  jobElapsedSeconds: number | null;
  jobTotalDurationSeconds: number;
  jobRemainingSeconds: number;
  handleWorkerDrop: (activityId: string, residentId: string | null) => void;
  handleDragOver: (slotId: string) => void;
  formatCycleSeconds: (seconds: number) => string;
}

/**
 * Shared Idle Village test hooks contract exposed on `window.__idleVillageTestHooks`.
 * Provides deterministic access to seeding helpers, diagnostics, and state snapshots.
 */
export interface IdleVillageTestHooks {
  seedResidents?: (residents: ResidentState[]) => void;
  invokeDemoHandler?: <TName extends DemoPanelHandlerName>(
    handlerName: TName,
    ...args: DemoPanelHandlerArgs<TName>
  ) => void;
  advanceTimeUnits?: (deltaUnits: number) => void;
  assignResidentToActivity?: (activityId: string, residentId: string) => void;
  /**
   * Assigns a resident to the primary job slot (e.g. Punch Club Gym Shift) and optionally auto-starts the activity.
   * Returns `true` if the resident was queued successfully.
   */
  assignResidentToJobSlot?: (residentId: string, autoStart?: boolean) => boolean;
  /**
   * Advances the scheduler by an explicit amount of wall-clock seconds, mirroring real time elapse.
   * Use together with {@link advanceTimeUnits} when a test needs both unit + second deltas.
   */
  advanceTimeSeconds?: (deltaSeconds: number) => void;
  /**
   * Forces the specified slot to start or resume its activity, optionally overriding the assigned resident.
   *
   * Implementations must try the sandbox controller first, then fall back to the quick work-shift helper (only for the
   * primary job slot) and finally defer to the Punch Club demo handler (`startJob`). Returns `true` only when the slot
   * successfully enters a playing state, otherwise `false`.
   */
  startSlotActivity: (slotId: string, residentId?: string | null) => boolean;
  getManagedActivityHandles?: () => {
    jobActivityId: string | null;
    questActivityId: string | null;
    residentIds: string[];
    slotAssignments: Record<string, string | null>;
  };
  getSlotAssignments?: () => Record<string, string | null>;
  getResidentRosterSnapshot?: () => ResidentRosterEntry[];
  getActivityDefinition?: (
    activityId: string,
  ) => {
    id: string;
    label?: string;
    dangerRating?: number;
    statRequirement?: {
      allOf?: string[];
      anyOf?: string[];
      noneOf?: string[];
    };
    rewards?: ResourceDeltaDefinition[];
    icon?: ReactNode;
  } | null;
  getAssignmentDiagnostics?: (residentId: string, activityId: string) => {
    residentId: string;
    activityId: string;
    canAssign: boolean;
    reason: string;
    metadata?: Record<string, unknown>;
  } | null;
  getAssignmentFeedback?: () => string | null;
  getResourceSnapshot?: () => IdleVillageResourceSnapshot;
  /**
   * Returns the latest snapshot from the Action Detail Harness (Punch Club detail debugger).
   */
  getActionDetailHarnessState?: () => ActionDetailHarnessState | null;
  /**
   * Returns the aggregate drop state for the Location dropzone (`idle`, `valid`, `invalid`, `locked`).
   */
  getLocationDropState?: () => SandboxDropState;
  /**
   * Returns the slot identifiers currently mounted inside the active Location card stack.
   */
  getLocationSlotIds?: () => string[];
  seedTradeRoutes?: (routes: TradeRoute[], lastResult?: TradeResult) => void;
  seedMigrationQueue?: (requests: MigrationRequest[]) => void;
  getTradeRoutesSnapshot?: () => TradeRoutesSnapshot;
  getShellPresetDiagnostics?: () => ShellPresetDiagnostics;
  getSchedulerTelemetry?: () => {
    events: SchedulerTelemetryEvent[];
  };
  /**
   * Forces the current drag context to treat `residentId` as the active item (or clears when null).
   */
  setDraggingResidentId?: (residentId: string | null) => void;
  /**
   * Helper that simulaes the beginning of a drag operation for deterministic testing.
   */
  beginDrag?: (residentId: string) => void;
  /**
   * Helper that clears any drag override produced by {@link beginDrag}.
   */
  endDrag?: () => void;
  /**
   * Returns the aggregate drop state for the Location dropzone (`idle`, `valid`, `invalid`).
   */
  getSlotDropStates: () => Record<string, SandboxDropState>;
  getDraggingResidentId?: () => string | null;
  /**
   * Returns a derived snapshot of current HUD entries (ActiveActivityHUD source of truth).
   */
  getHudEntries?: () => HudEntry[];
  isDayPhase?: () => boolean;
  /**
   * Provides the latest aggregated quest telemetry snapshot rendered in the QuestTelemetryPanel.
   */
  getQuestTelemetrySnapshot?: () => AggregatedTelemetry;
  /**
   * Records a quest result into the telemetry store for deterministic test scenarios.
   */
  recordQuestTelemetryResult?: (result: QuestResult) => void;
  /**
   * Clears all persisted quest telemetry data.
   */
  clearQuestTelemetry?: () => void;
  /**
   * Forces the ActionDetailHarness to open for a specific slot ID (for testing playing state).
   */
  setSelectedSlot?: (slotId: string) => void;
  /**
   * Returns the current village state snapshot.
   */
  getVillageState?: () => import('@/engine/game/idleVillage/TimeEngine').VillageState;
  /**
   * Advances time by the specified delta (alias for advanceTimeSeconds).
   */
  advanceTime?: (delta: number) => void;
  /**
   * Toggles rest mode on/off.
   */
  toggleRestMode?: (enabled: boolean) => void;
}
