/**
 * questEligibility — resident → quest-slot eligibility (PLAN-019-S2.4 T-1).
 *
 * Single predicate the trusted roster↔slot stack calls when dragging a
 * `PgCard` over a quest `ResidentSlotRack`: stat requirement via
 * `evaluateStatRequirement` (same evaluator as activities), status against
 * `QUEST_ELIGIBILITY.assignableStatuses`, and the `inExpedition` lock —
 * DERIVED from the persisted run's `party[].id` (the residentId written by
 * `residentToQuestMember`), never a separately-written flag.
 *
 * Lock contract (shared with S2.5): a resident is locked while a run record
 * exists and is not settled — `run.ended` alone does NOT release the party
 * (consequences pending). S2.5 owns the terminal/settled transition that
 * releases survivors; `clear`/no run releases everyone.
 */
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import type { StatRequirement } from '@/balancing/config/idleVillage/types';
import { QUEST_ELIGIBILITY, type QuestEligibility } from '@/balancing/config/idleVillage/quests/questEligibility';
import type { QuestRunState } from './questRun';

/** Reason a resident cannot be assigned — drives the slot/rack feedback
 *  copy through i18n keys, never a hardcoded string. */
export type QuestIneligibilityReason =
  | 'status-dead'
  | 'status-away'
  | 'status-exhausted'
  | 'in-expedition'
  | 'stat-requirement';

export interface QuestEligibilityResult {
  eligible: boolean;
  reason?: QuestIneligibilityReason;
  /** Slot requirement tags the resident is missing (reason === 'stat-requirement'). */
  missing?: string[];
}

/**
 * Derived expedition lock: `residentId` is in the party of `activeRun`.
 * `activeRun` = the persisted run for this POI (null = none/settled). The
 * party stays «away» until the run record is released: `ended` alone does
 * not free them — the walk home and the consequences are still pending.
 * S2.5 owns settlement; `clear`/null releases everyone.
 */
export function residentInExpedition(residentId: string, activeRun: QuestRunState | null | undefined): boolean {
  if (!activeRun) return false;
  return activeRun.party.some((m) => m.id === residentId);
}

/**
 * Can `resident` fill a quest slot carrying `requirement`?
 * Order matters for the UX: structural blocks first (dead → away/exhausted
 * → expedition lock), then the slot's stat gate — a resident who could not
 * go anyway never produces a confusing "missing stat" message.
 */
export function questResidentEligibility(
  resident: ResidentState,
  requirement: StatRequirement | undefined,
  activeRun: QuestRunState | null | undefined,
  config: QuestEligibility = QUEST_ELIGIBILITY,
): QuestEligibilityResult {
  if (resident.status === 'dead') return { eligible: false, reason: 'status-dead' };
  if (!config.assignableStatuses.includes(resident.status)) {
    return { eligible: false, reason: resident.status === 'away' ? 'status-away' : 'status-exhausted' };
  }
  if (config.expeditionLocksResident && residentInExpedition(resident.id, activeRun)) {
    return { eligible: false, reason: 'in-expedition' };
  }
  const evalResult = evaluateStatRequirement(resident, requirement);
  if (!evalResult.matches) {
    return {
      eligible: false,
      reason: 'stat-requirement',
      missing: [...evalResult.missingAllOf, ...(evalResult.anyOfMatched ? [] : (requirement?.anyOf ?? []))],
    };
  }
  return { eligible: true };
}
