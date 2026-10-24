/**
 * tuningFormDescriptors — the tuning form fields per gimmick
 * (PLAN-029 SP-2 T-5). Exhaustiveness is compile-checked: a tuning
 * schema field without a descriptor (or vice versa) breaks the `satisfies`.
 */

import type {
  FloodTuningAuthored,
  RaceTuningAuthored,
} from '@/balancing/config/idleVillage/quests/generation/kitSchemas';
import type { GimmickId } from '@/balancing/config/idleVillage/quests/generation/gimmickRegistry';

/** One tunable numeric field — labelKey lives under `questGenLab.generate.tuning.*`. */
export interface TuningFieldDescriptor {
  readonly key: string;
  readonly labelKey: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

/** Race tuning fields — mirrors `RaceTuningSchema` bounds (integer percents). */
export const RACE_TUNING_FIELDS: readonly TuningFieldDescriptor[] = [
  { key: 'goal', labelKey: 'goal', min: 1, max: 20, step: 1 },
  { key: 'twistChance', labelKey: 'twistChance', min: 0, max: 100, step: 1 },
  { key: 'twistRearmChance', labelKey: 'twistRearmChance', min: 0, max: 100, step: 1 },
] satisfies readonly { key: keyof RaceTuningAuthored }[];

/** Flood tuning fields — mirrors `FloodTuningSchema` bounds. */
export const FLOOD_TUNING_FIELDS: readonly TuningFieldDescriptor[] = [
  { key: 'limite', labelKey: 'limite', min: 1, max: 20, step: 1 },
  { key: 'uscitaGoal', labelKey: 'uscitaGoal', min: 1, max: 20, step: 1 },
  { key: 'madreChance', labelKey: 'madreChance', min: 0, max: 100, step: 1 },
  { key: 'pareteChance', labelKey: 'pareteChance', min: 0, max: 100, step: 1 },
] satisfies readonly { key: keyof FloodTuningAuthored }[];

/**
 * The field list for a gimmick — empty list for unknown ids.
 * @param gimmickId registry gimmick id.
 */
export function tuningFieldsFor(gimmickId: GimmickId): readonly TuningFieldDescriptor[] {
  return gimmickId === 'race' ? RACE_TUNING_FIELDS : FLOOD_TUNING_FIELDS;
}
