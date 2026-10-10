/**
 * floodMare — the first NARRATED catalog imprint (PLAN-026 T4 / P3):
 * the flooding-vault skeleton dressed by provider-written copy on the
 * `mare` domain vocab. The kit literal is a generated artifact
 * (`flood-mare.kit.ts`) — mechanics are emitted by the skeleton, so
 * this scenario differs from `gen-flood-miniera` ONLY in what the
 * player reads.
 */

import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { generateFloodVault } from '../floodVault';
import { MARE_FLOOD_KIT } from './flood-mare.kit';

export { MARE_FLOOD_KIT } from './flood-mare.kit';

/** Emit the mare flood scenario — parsed + schema-validated at import. */
export function generateFloodMare(tuning?: Parameters<typeof generateFloodVault>[1]): QuestScenario {
  return generateFloodVault(MARE_FLOOD_KIT, tuning);
}

/** Parsed + validated narrated imprint — «Riscopri il Relitto del Mare Oscuro». */
export const FLOOD_MARE_SCENARIO: QuestScenario = generateFloodMare();
