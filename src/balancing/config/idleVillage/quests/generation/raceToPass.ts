/**
 * raceToPass — catalog imprint «La Corsa al Passo del Corvo»
 * (gimmick gara-di-avanzamento × kit passo-montano, PLAN-026 T-3).
 *
 * Thin wrapper over `generateRaceScenario(PASSO_MONTANO_KIT)` — the
 * skeleton lives in `raceGimmick.ts`, the dressing in `kits.ts`.
 */

import { generateRaceScenario, type RaceTuning } from './raceGimmick';
import { PASSO_MONTANO_KIT } from './kits';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';

/**
 * Emit the passo-montano race scenario under a tuning override —
 * returns the parsed, schema-validated scenario.
 */
export function generateRaceToPass(tuning?: Partial<RaceTuning>): QuestScenario {
  return generateRaceScenario(PASSO_MONTANO_KIT, tuning);
}

/** Parsed + validated v0 catalog scenario — the «Corsa al Passo» imprint. */
export const RACE_TO_PASS_SCENARIO: QuestScenario = generateRaceToPass();
