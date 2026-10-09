/**
 * Generated-quest catalog v0 (PLAN-026): the offline, pre-generated
 * scenarios the v0 prototype ships as data — every entry is a parsed,
 * schema-validated `QuestScenario` riding the 'gen' engine profile.
 *
 * Catalog shape today: two gimmicks (gara-di-avanzamento,
 * volta-che-allaga) × three domain kits (passo-montano, palude, miniera)
 * — the kit-swap and the gimmick-swap are both demonstrated.
 */

import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { RACE_TO_PASS_SCENARIO } from './raceToPass';
import { RACE_TO_MARSH_SCENARIO } from './raceToMarsh';
import { FLOOD_MINIERA_SCENARIO } from './floodMiniera';

export { RACE_TO_PASS_SCENARIO } from './raceToPass';
export { RACE_TO_MARSH_SCENARIO } from './raceToMarsh';
export { FLOOD_MINIERA_SCENARIO } from './floodMiniera';
export { generateRaceScenario, type RaceDomainKit, type RaceTuning } from './raceGimmick';
export { generateFloodVault, type FloodDomainKit, type FloodTuning } from './floodVault';
export { PASSO_MONTANO_KIT, PALUDE_KIT } from './kits';
export { MINIERA_FLOOD_KIT } from './floodMiniera';

/** The v0 generated catalog, keyed by scenario id. */
export const GENERATED_CATALOG: Readonly<Record<string, QuestScenario>> = {
  [RACE_TO_PASS_SCENARIO.id]: RACE_TO_PASS_SCENARIO,
  [RACE_TO_MARSH_SCENARIO.id]: RACE_TO_MARSH_SCENARIO,
  [FLOOD_MINIERA_SCENARIO.id]: FLOOD_MINIERA_SCENARIO,
};

/** Lookup a generated scenario by catalog id. */
export function generatedScenarioById(id: string): QuestScenario | undefined {
  return GENERATED_CATALOG[id];
}
