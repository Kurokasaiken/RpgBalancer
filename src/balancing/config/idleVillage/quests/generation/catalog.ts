/**
 * Generated-quest catalog v0 (PLAN-026): the offline, pre-generated
 * scenarios the v0 prototype ships as data — every entry is a parsed,
 * schema-validated `QuestScenario` riding the 'gen' engine profile.
 *
 * Catalog shape today: one gimmick (gara-di-avanzamento) × two domain
 * kits (passo-montano, palude) — the kit-swap is the first proof that
 * structure and dressing are separable.
 */

import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { RACE_TO_PASS_SCENARIO } from './raceToPass';
import { RACE_TO_MARSH_SCENARIO } from './raceToMarsh';

export { RACE_TO_PASS_SCENARIO } from './raceToPass';
export { RACE_TO_MARSH_SCENARIO } from './raceToMarsh';
export { generateRaceScenario, type RaceDomainKit, type RaceTuning } from './raceGimmick';
export { PASSO_MONTANO_KIT, PALUDE_KIT } from './kits';

/** The v0 generated catalog, keyed by scenario id. */
export const GENERATED_CATALOG: Readonly<Record<string, QuestScenario>> = {
  [RACE_TO_PASS_SCENARIO.id]: RACE_TO_PASS_SCENARIO,
  [RACE_TO_MARSH_SCENARIO.id]: RACE_TO_MARSH_SCENARIO,
};

/** Lookup a generated scenario by catalog id. */
export function generatedScenarioById(id: string): QuestScenario | undefined {
  return GENERATED_CATALOG[id];
}
