/**
 * Shared bag derivations (PLAN-032 SP-4, artifact r004) — the single source
 * both the BagStrip readout and the title-row bag popover consume, so the
 * two views can never drift apart.
 *
 * Pure functions only: no state, no lifecycle, no presentation. The
 * interactive `ConsumableBelt` keeps its own inline logic and stays the
 * sole bag UI at decision nodes.
 */

import { QUEST_STASH, type StashItem } from '@/balancing/config/idleVillage/quests/questStash';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { TFunction } from 'i18next';

/** The packed items for a run's flags, in stash catalog order. */
export const questBagItems = (flags: string[], stash = QUEST_STASH): StashItem[] =>
  stash.items.filter((item) => flags.includes(item.flag));

/**
 * The belt's short-label idiom, extracted for the strip: `Label — detail`
 * renders as `Label`. Composition order is label → qualify, never the
 * reverse — this helper is forbidden on already-composed strings.
 */
export const bagItemShortLabel = (t: TFunction, item: StashItem): string =>
  t(item.labelKey).split('—')[0].trim();

/**
 * True while the run ever carried a loadout: current flags OR anything
 * already spent (`consumablesUsed` is read ONLY for slot retention, never
 * displayed — every spend path funnels through `consumeFlag`, so
 * flags ∪ consumablesUsed = the packed loadout).
 */
export const bagEverPacked = (run: Pick<QuestRunState, 'flags' | 'consumablesUsed'>): boolean =>
  questBagItems(run.flags).length > 0 || (run.consumablesUsed?.length ?? 0) > 0;

export interface BagStripVisibilityInput {
  bagEmpty: boolean;
  ended: boolean;
  waiting: boolean;
  presenting: boolean;
}

/**
 * Positive enumeration of exactly the non-decision states where the strip
 * shows (mutual exclusion with the belt is structural):
 * - `presenting` (beat playback, incl. `ended && presenting` replay) → strip
 * - `!waiting && !presenting && !ended` (transit/frontier pending) → strip
 * - `waiting && !presenting` (decision) → NEVER — the belt owns that zone
 * - `ended && !presenting` (epilogue owns the stage) → NEVER
 * - empty bag → NEVER
 */
export const bagStripVisible = ({ bagEmpty, ended, waiting, presenting }: BagStripVisibilityInput): boolean =>
  !bagEmpty && (presenting || (!waiting && !ended));
