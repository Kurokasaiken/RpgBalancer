/**
 * labGenConfig — lab generation pickers config (PLAN-029 SP-2 T-5).
 *
 * `kitsByGimmick` is the explicit kit→gimmick compatibility table: a kit
 * is NOT assumed compatible from its type alone — each entry is listed
 * deliberately. Narrated localized kits resolve to their `it` flat
 * variant (the locale the shipped narrated scenarios were generated
 * from; locale-invariant fields are identical across locales).
 */

import type {
  FloodDomainKit,
  RaceDomainKit,
} from '@/balancing/config/idleVillage/quests/generation/catalog';
import {
  MARE_FLOOD_KIT,
  MINIERA_FLOOD_KIT,
  MINIERA_RACE_KIT,
  PALUDE_KIT,
  PASSO_MONTANO_KIT,
} from '@/balancing/config/idleVillage/quests/generation/catalog';
import type { GimmickId } from '@/balancing/config/idleVillage/quests/generation/gimmickRegistry';

/** A kit the generation picker can hand to a gimmick row. */
export interface PickerKit {
  readonly kitId: string;
  /** The flat kit literal — the value passed to `generate`. */
  readonly kit: RaceDomainKit | FloodDomainKit;
}

/** Exhaustive kit→gimmick compatibility table for the picker. */
export const kitsByGimmick: Record<GimmickId, readonly PickerKit[]> = {
  race: [
    { kitId: 'passo-montano', kit: PASSO_MONTANO_KIT },
    { kitId: 'palude', kit: PALUDE_KIT },
    { kitId: 'miniera', kit: MINIERA_RACE_KIT.it },
  ],
  'flood-vault': [
    { kitId: 'miniera', kit: MINIERA_FLOOD_KIT },
    { kitId: 'mare', kit: MARE_FLOOD_KIT },
  ],
};
