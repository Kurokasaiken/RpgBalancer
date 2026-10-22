/**
 * Shared bag derivation (PLAN-032 SP-4, artifact r004) — the single source
 * the title-row bag popover and the companion `ConsumableBelt` consume, so
 * the two views can never drift apart.
 *
 * Pure functions only: no state, no lifecycle, no presentation.
 */

import { QUEST_STASH, type StashItem } from '@/balancing/config/idleVillage/quests/questStash';

/** The packed items for a run's flags, in stash catalog order. */
export const questBagItems = (flags: string[], stash = QUEST_STASH): StashItem[] =>
  stash.items.filter((item) => flags.includes(item.flag));
