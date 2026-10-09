/**
 * questExpedition — pure launch-boundary logic (PLAN-019-S2.4 T-3).
 *
 * `buildExpeditionParty` is the authoritative re-validation the «Invia
 * spedizione» commit runs at the write boundary: slot completeness and
 * EVERY member's eligibility are recomputed from the freshest roster +
 * run state — a stale render can never smuggle a dead, away or
 * already-out resident into a frozen party.
 */
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { StatRequirement } from '@/balancing/config/idleVillage/types';
import { questResidentEligibility, residentInExpedition } from '@/ui/idleVillage/questS1Lab/questEligibility';
import { residentToQuestMember } from '@/ui/idleVillage/questS1Lab/residentToQuestMember';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';

/** Slot shape the boundary needs — decoupled from the controller's view
 *  model so tests build it directly. */
export interface ExpeditionSlotSpec {
  /** Blueprint id — the `assignments` map key. */
  blueprintId: string;
  required: boolean;
  role?: string;
  requirement?: StatRequirement;
}

/**
 * Builds the frozen party for launch, or `null` when any precondition
 * fails. Every member is re-validated: status per `QUEST_ELIGIBILITY`
 * (injured admitted), the union `inExpedition` lock across `activeRuns`,
 * and the slot's own stat requirement.
 */
export function buildExpeditionParty(
  slots: ExpeditionSlotSpec[],
  assignments: Record<string, string | null>,
  residentsById: Record<string, ResidentState | undefined>,
  activeRuns: ReadonlyArray<QuestRunState | null>,
): LabMember[] | null {
  if (!slots.some((s) => s.required)) return null;
  const members: LabMember[] = [];
  for (const slot of slots) {
    const residentId = assignments[slot.blueprintId];
    const resident = residentId ? residentsById[residentId] : undefined;
    if (slot.required && !resident) return null;
    if (!resident) continue;
    const base = questResidentEligibility(resident, slot.requirement, null);
    if (!base.eligible) return null;
    if (activeRuns.some((run) => residentInExpedition(resident.id, run))) return null;
    const role = (slot.role === 'leader' || slot.role === 'bodyguard' ? slot.role : 'member') as LabMember['role'];
    members.push(residentToQuestMember(resident, role));
  }
  if (!members.some((m) => m.role === 'leader')) return null;
  return members;
}
