/**
 * raceMiniera — the first NARRATED race imprint (PLAN-026 T4, second
 * narrated artifact; regenerated under PLAN-027 r001): the stage-race
 * skeleton dressed by provider-written copy on the `miniera` domain
 * vocab. The kit literal is a generated artifact (`race-miniera.kit.ts`)
 * carrying both locales — `en` (structural draft) and `it` (facts-locked
 * re-render). The runtime contract is single-locale: the catalog dresses
 * the skeleton with the IT copy until quest-level locale switching
 * exists; `localeParityIssues` keeps the two peers consistent.
 */

import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { generateRaceScenario } from '../raceGimmick';
import { MINIERA_RACE_KIT } from './race-miniera.kit';

export { MINIERA_RACE_KIT } from './race-miniera.kit';

/** Emit the miniera race scenario — parsed + schema-validated at import. */
export function generateRaceMiniera(tuning?: Parameters<typeof generateRaceScenario>[1]): QuestScenario {
  return generateRaceScenario(MINIERA_RACE_KIT.it, tuning);
}

/** Parsed + validated narrated imprint (IT locale active). */
export const RACE_MINIERA_SCENARIO: QuestScenario = generateRaceMiniera();
