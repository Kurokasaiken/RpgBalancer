/**
 * raceToMarsh — catalog imprint «La Corsa alle Chiuse Vecchie»
 * (gimmick gara-di-avanzamento × kit palude, PLAN-026 T-3).
 *
 * Same skeleton as the Passo race — the domain kit changes the world:
 * passarelle for the crepa, fango for the orme, remi for the sprint,
 * canale morto for the shortcut, pontile for the choke point.
 */

import { generateRaceScenario, type RaceTuning } from './raceGimmick';
import { PALUDE_KIT } from './kits';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';

/**
 * Emit the palude race scenario under a tuning override —
 * returns the parsed, schema-validated scenario.
 */
export function generateRaceToMarsh(tuning?: Partial<RaceTuning>): QuestScenario {
  return generateRaceScenario(PALUDE_KIT, tuning);
}

/** Parsed + validated v0 catalog scenario — the «Chiuse Vecchie» imprint. */
export const RACE_TO_MARSH_SCENARIO: QuestScenario = generateRaceToMarsh();
