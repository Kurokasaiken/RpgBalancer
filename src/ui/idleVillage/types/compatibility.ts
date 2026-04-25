/**
 * Shared compatibility diagnostics describing how residents align with a target slot.
 * These structures are config-first and reuse the validation helpers exposed by the
 * sandbox drag controller to avoid duplicating business rules across UI layers.
 */
import type { AssignmentFailureReason } from '@/ui/idleVillage/slots/residentSlotValidators';

/**
 * Canonical reason identifiers returned by compatibility diagnostics.
 */
export type SlotCompatibilityReason = 'valid' | AssignmentFailureReason;

/**
 * Structured compatibility record emitted for each resident when the picker is opened.
 */
export interface SlotCompatibilityDiagnosticsEntry {
  /** Resident identifier evaluated for the selected slot. */
  residentId: string;
  /** Normalized reason coming from the validator ("valid" represents success). */
  reason: SlotCompatibilityReason;
  /**
   * Heuristic score in the [0,1] range that the UI can use to sort residents.
   * Higher values indicate better matches (1 = perfect / valid assignment).
   */
  score: number;
  /** Optional human-readable details describing why the resident ranked as they did. */
  details?: string | null;
}
