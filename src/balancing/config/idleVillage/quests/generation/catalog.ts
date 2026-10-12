/**
 * Generated-quest catalog v0 (PLAN-026): the offline, pre-generated
 * scenarios the v0 prototype ships as data — every entry is a parsed,
 * schema-validated `QuestScenario` riding the 'gen' engine profile.
 *
 * Catalog shape today: two gimmicks (gara-di-avanzamento,
 * volta-che-allaga) × three hand domain kits (passo-montano, palude,
 * miniera) + two NARRATED imprints (flood × mare, race × miniera — copy
 * written by provider runs, mechanics emitted by the skeletons).
 */

import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { RACE_TO_PASS_SCENARIO } from './raceToPass';
import { RACE_TO_MARSH_SCENARIO } from './raceToMarsh';
import { FLOOD_MINIERA_SCENARIO } from './floodMiniera';
import { FLOOD_MARE_SCENARIO } from './narrated/floodMare';
import { RACE_MINIERA_SCENARIO } from './narrated/raceMiniera';
import { IMPR002_PALUDE_SCENARIO } from './impr002Palude';
import { IMPR002_MARE_SCENARIO } from './impr002Mare';
import { IMPR002_MINIERA_SCENARIO } from './impr002Miniera';
import { IMPR002_MINIERA_IT } from './impr002Miniera.it';
import { applyImprintLocale, type ImprintLocaleOverlay } from './imprintLocale';

export { RACE_TO_PASS_SCENARIO } from './raceToPass';
export { RACE_TO_MARSH_SCENARIO } from './raceToMarsh';
export { FLOOD_MINIERA_SCENARIO } from './floodMiniera';
export { FLOOD_MARE_SCENARIO, MARE_FLOOD_KIT } from './narrated/floodMare';
export { RACE_MINIERA_SCENARIO, MINIERA_RACE_KIT } from './narrated/raceMiniera';
export { IMPR002_PALUDE_SCENARIO } from './impr002Palude';
export { IMPR002_MARE_SCENARIO } from './impr002Mare';
export { IMPR002_MINIERA_SCENARIO } from './impr002Miniera';
export { generateRaceScenario, type RaceDomainKit, type RaceTuning } from './raceGimmick';
export { generateFloodVault, type FloodDomainKit, type FloodTuning } from './floodVault';
export { PASSO_MONTANO_KIT, PALUDE_KIT } from './kits';
export { MINIERA_FLOOD_KIT } from './floodMiniera';

/** The v0 generated catalog, keyed by scenario id. */
export const GENERATED_CATALOG: Readonly<Record<string, QuestScenario>> = {
  [RACE_TO_PASS_SCENARIO.id]: RACE_TO_PASS_SCENARIO,
  [RACE_TO_MARSH_SCENARIO.id]: RACE_TO_MARSH_SCENARIO,
  [FLOOD_MINIERA_SCENARIO.id]: FLOOD_MINIERA_SCENARIO,
  [FLOOD_MARE_SCENARIO.id]: FLOOD_MARE_SCENARIO,
  [RACE_MINIERA_SCENARIO.id]: RACE_MINIERA_SCENARIO,
  /* R-152: imprint-compiled scenario (authored spine, 'gen' profile) —
   * `gen-impr002-*` is NOT a skeleton×kit generation: no GimmickId prefix,
   * so lab kits never attach it; it is discoverable via `generatedScenarioById`. */
  [IMPR002_PALUDE_SCENARIO.id]: IMPR002_PALUDE_SCENARIO,
  /* R-159: second compiled instance — same IMPR-002 spine, kit mare. */
  [IMPR002_MARE_SCENARIO.id]: IMPR002_MARE_SCENARIO,
  /* R-161: third compiled instance — same IMPR-002 spine, kit miniera. */
  [IMPR002_MINIERA_SCENARIO.id]: IMPR002_MINIERA_SCENARIO,
};

/** Lookup a generated scenario by catalog id. */
export function generatedScenarioById(id: string): QuestScenario | undefined {
  return GENERATED_CATALOG[id];
}

/** Locales a catalog scenario can be rendered in. English is canonical. */
export type ScenarioLocale = 'en' | 'it';

/**
 * Facts-locked locale overlays registered per catalog scenario (R-168).
 * An overlay is a peer render of the canonical EN copy — never a
 * different scenario: ids, flags, vars and routing are untranslatable.
 */
const SCENARIO_LOCALE_OVERLAYS: Partial<
  Record<string, Partial<Record<ScenarioLocale, ImprintLocaleOverlay>>>
> = {
  'gen-impr002-miniera': { it: IMPR002_MINIERA_IT },
};

/**
 * Lookup a catalog scenario rendered in the requested locale. Falls back
 * to the canonical English copy when no overlay is registered for the
 * pair — the causal spine is identical either way.
 */
export function localizedScenarioById(
  id: string,
  locale: ScenarioLocale = 'en',
): QuestScenario | undefined {
  const scenario = GENERATED_CATALOG[id];
  if (!scenario) return undefined;
  const overlay = locale === 'en' ? undefined : SCENARIO_LOCALE_OVERLAYS[id]?.[locale];
  return overlay ? applyImprintLocale(scenario, overlay) : scenario;
}
