import type { ActivityDefinition, ActivitySlotModifier, StatRequirement } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ScheduledActivityState } from '@/ui/idleVillage/hooks/useActivityScheduler';
import type { AssignmentFailureReason } from '@/ui/idleVillage/slots/residentSlotValidators';

/**
 * Drop state for a slot during drag operations.
 * Mirrors location drop states plus a locked state for already-assigned slots.
 */
export type DropState = 'idle' | 'valid' | 'invalid' | 'locked';

// Re-export types for convenience
export type { ActivitySlotModifier, AssignmentFailureReason };

/**
 * Bloom/glow state applied to slot visuals.
 */
export type SlotBloomState = 'idle' | 'valid' | 'invalid' | 'blocked';

/**
 * UI state for slot activity mapping from engine states.
 */
export type SlotActivityUIState = 'idle' | 'active' | 'locked' | 'completing' | 'failed' | 'done';

/**
 * Failure type classification for failed activities.
 */
export type ActivityFailureType = 'injury' | 'death' | 'mission_failure';

/**
 * Complete slot state combining UI state with metadata.
 */
export interface SlotActivityState {
  /** Current UI state for the slot. */
  state: SlotActivityUIState;
  /** Progress between 0 and 1. */
  progress: number;
  /** Remaining seconds until completion (0 for completed/failed). */
  remainingSeconds: number;
  /** Whether the slot is locked by phase (day/night cycle). */
  isLockedByPhase: boolean;
  /** Type of failure (only present when state is 'failed'). */
  failureType?: ActivityFailureType;
  /** Original engine state for reference. */
  engineState?: ScheduledActivityState['status'];
}

/**
 * Lifecycle status for a slot (empty, already assigned, or synthetic placeholder).
 */
export type ResidentSlotStatus = 'empty' | 'assigned' | 'placeholder';

/**
 * Blueprint describing a resident slot’s metadata before runtime assignment is applied.
 */
export interface ResidentSlotBlueprint {
  /** Stable identifier, typically `${activity.id}-slot-${index}`. */
  id: string;
  /** Optional UI label overriding the default “Slot #“. */
  label?: string;
  /** Optional stat hint string shown in UI tooltips. */
  statHint?: string;
  /** Requirement overriding the activity-level stat requirement. */
  requirement?: StatRequirement;
  /** Whether this slot must be filled before the activity can start. */
  required?: boolean;
  /** Human-readable requirement label (falls back to requirement.label). */
  requirementLabel?: string;
  /** Per-slot modifiers applied to fatigue/risk/yield calculations. */
  modifiers?: ActivitySlotModifier;
  /** Semantic role of this slot (e.g. 'combatant', 'support', 'vanguard'). Label/logic only, not a closed enum. */
  role?: string;
  /** Penalty applied to the party-level calculations when this required slot is left empty. */
  emptyPenalty?: QuestSlotEmptyPenalty;
  /** Risk modifiers applied only to the resident occupying this slot (not the whole party). */
  residentRiskModifiers?: QuestSlotResidentRiskModifiers;
}

/** Party-level penalty applied when a required quest slot is left empty. */
export interface QuestSlotEmptyPenalty {
  /** Multiplier applied to the computed party power (e.g. 0.85 = -15%). */
  partyPowerMult?: number;
  /** Percentage points added to the final death chance. */
  extraDeathChance?: number;
  /** Percentage points added to the final injury chance. */
  extraInjuryChance?: number;
}

/** Risk modifiers applied to the resident assigned to a specific quest slot. */
export interface QuestSlotResidentRiskModifiers {
  /** Percentage points added to (or removed from) this resident's injury chance. */
  injuryChanceDelta?: number;
  /** Percentage points added to (or removed from) this resident's death chance. */
  deathChanceDelta?: number;
}

/**
 * Warning surfaced by the slot controller when invariants are not satisfied.
 */
export interface ResidentSlotWarning {
  /** Currently only missing required slots, but future warnings can extend this union. */
  type: 'REQUIRED_SLOTS_MISSING';
  /** List of slot identifiers that violated the invariant. */
  slotIds: string[];
  /** User-facing message describing the warning. */
  message: string;
}

/** Preferred layout policy for slot racks consuming the controller. */
export type SlotOverflowPolicy = 'wrap' | 'scroll';

/**
 * View-model for a resident slot after merging assignments and runtime state.
 */
export interface ResidentSlotViewModel {
  /** Slot identifier (stable across renders). */
  id: string;
  /** Zero-based order index within the rack. */
  index: number;
  /** Display label shown to the user. */
  label: string;
  /** Optional hint or requirement label for tooltips. */
  statHint?: string;
  /** Whether the slot is required before the activity starts. */
  required?: boolean;
  /** Current assigned resident identifier, if any. */
  assignedResidentId: string | null;
  /** Full resident state for convenience (undefined when missing). */
  assignedResident?: ResidentState;
  /** Requirement enforced specifically for this slot. */
  requirement?: StatRequirement;
  /** Per-slot modifiers (fatigue/risk/yield). */
  modifiers?: ActivitySlotModifier;
  /** Semantic role of this slot (e.g. 'combatant', 'support', 'vanguard'). */
  role?: string;
  /** Penalty applied to party-level calculations when this required slot is left empty. */
  emptyPenalty?: QuestSlotEmptyPenalty;
  /** Risk modifiers applied only to the resident occupying this slot. */
  residentRiskModifiers?: QuestSlotResidentRiskModifiers;
  /** True when the slot is a virtual placeholder (infinite slots). */
  isPlaceholder: boolean;
  /** Drop validation state for the currently hovered resident. */
  dropState: DropState;
  /** Bloom state consumed by UI to render glow/highlights. */
  bloomState: SlotBloomState;
  /** Lifecycle status (empty, assigned, placeholder). */
  status: ResidentSlotStatus;
  /** Optional telemetry tags describing slot context (requirement, modifiers, etc.). */
  telemetryTags: string[];
}

/**
 * Result object returned when attempting to assign a resident to a slot.
 * Successful assignments always include the resolved slot id, while failures
 * may optionally reference the slot that triggered the validation error.
 */
export type ResidentSlotAssignResult =
  | { success: true; slotId: string }
  | { success: false; reason: AssignmentFailureReason; details?: string; slotId?: string };

/**
 * Progress data resolved from the scheduler for UI consumption.
 */
export interface SlotProgressData {
  slotId: string;
  residentId: string;
  elapsedSeconds: number;
  totalSeconds: number;
  ratio: number;
  state: ScheduledActivityState;
}

/**
 * Options consumed by the resident slot controller hook.
 */
export interface ResidentSlotControllerOptions {
  /** Activity whose slots are being managed. */
  activity: ActivityDefinition;
  /** Current resident assignments keyed by slot id. */
  assignments: Record<string, string | null>;
  /** Dictionary of available residents keyed by id. */
  residents: Record<string, ResidentState>;
  /** Currently hovered resident id (for drag/drop validation). */
  hoveredResidentId?: string | null;
  /** Optional explicit blueprint list overriding defaults. */
  slotBlueprints?: ResidentSlotBlueprint[];
  /** Optional scheduler bridge for progress and availability checks. */
  scheduler?: {
    canAssignResident?: (residentId: string, activityId: string) => boolean;
    getActivityState?: (activityId: string, residentId: string) => ScheduledActivityState | null;
  };
  /** Callback invoked when an assignment succeeds. */
  onAssign?: (slotId: string, residentId: string) => void;
  /** Callback invoked when a slot is cleared. */
  onClear?: (slotId: string) => void;
  /** Callback invoked whenever warnings change. */
  onWarningsChange?: (warnings: ResidentSlotWarning[]) => void;
  /** Optional fatigue cap forwarded to validation helpers. */
  maxFatigueBeforeExhausted?: number;
  /** Optional hook for rack animations to duplicate placeholders explicitly. */
  onDuplicatePlaceholder?: (slotId?: string) => void;
  /** Optional custom validator (e.g., scenario-specific rules) invoked before assignment. */
  customValidator?: (residentId: string, slotId: string) => ResidentSlotAssignResult | null;
}

/**
 * API exposed by the resident slot controller hook.
 */
export interface ResidentSlotControllerResult {
  /** Derived slot list including placeholders and validation state. */
  slots: ResidentSlotViewModel[];
  /** Attempts to assign a resident to a slot (returns failure if slotId omitted). */
  assignResidentToSlot: (residentId: string, slotId?: string) => ResidentSlotAssignResult;
  /** Clears an assignment by slot id. */
  clearSlot: (slotId: string) => void;
  /** Requests duplication of the trailing placeholder (for infinite slots). */
  duplicatePlaceholder: (slotId?: string) => boolean;
  /** Resolves scheduler progress data for a slot (if available). */
  getSlotProgress: (slotId: string) => SlotProgressData | null;
  /** Returns the bloom state for a slot, defaulting to 'idle'. */
  getBloomState: (slotId: string) => SlotBloomState;
  /** Whether every available slot (finite max) is currently occupied. */
  isSlotFull: () => boolean;
  /** Aggregated drop state for the controller (useful for global overlays). */
  dropState: DropState;
  /** Current warning list. */
  warnings: ResidentSlotWarning[];
}

/**
 * Canonical telemetry payload for resident slot-level analytics.
 */
export interface ResidentSlotTelemetryPayload {
  activityId: string;
  slotId: string;
  slotIndex: number;
  assignedResidentId?: string | null;
  requirementLabel?: string;
  required: boolean;
  bloomState: SlotBloomState;
  dropState: DropState;
  modifiers?: ActivitySlotModifier;
  tags: string[];
}
