/**
 * raceMiniera — the first NARRATED race imprint (PLAN-026 T4, second
 * narrated artifact): the stage-race skeleton dressed by provider-written
 * copy on the `miniera` domain vocab. The kit literal is a generated
 * artifact (`race-miniera.kit.ts`) — mechanics are emitted by the
 * skeleton, so this scenario differs from `gen-race-passo-montano` ONLY
 * in what the player reads.
 */

import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { generateRaceScenario } from '../raceGimmick';
import { MINIERA_RACE_KIT } from './race-miniera.kit';

export { MINIERA_RACE_KIT } from './race-miniera.kit';

/** Emit the miniera race scenario — parsed + schema-validated at import. */
export function generateRaceMiniera(tuning?: Parameters<typeof generateRaceScenario>[1]): QuestScenario {
  return generateRaceScenario(MINIERA_RACE_KIT, tuning);
}

/** Parsed + validated narrated imprint — «Corsa nella Galleria Bassa». */
export const RACE_MINIERA_SCENARIO: QuestScenario = generateRaceMiniera();
