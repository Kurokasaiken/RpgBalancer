/**
 * Quest S1 lab — stash / loadout configuration (R-102).
 *
 * The lab's "stash" is the declarative catalog of items the player may pack
 * before departing. In the isolated lab it is a mock pool (no persistence —
 * the real village stash is S2 infrastructure); every entry maps 1:1 to an
 * engine inventory flag (`hasX`) that `consumableBonusFor` / `useHealing` /
 * `drinkPotion` already honour.
 *
 * Numbers are balancing knobs — components read this config, never hardcode.
 */

import { z } from 'zod';
import type { LabStat } from '@/ui/idleVillage/questS1Lab/questScenario';
import { toEngineFlag } from './questItems';

/** One stash item the player may pack into the bag. */
export const StashItemSchema = z.object({
  /** Engine inventory flag added to `QuestRunState.flags` when packed. */
  flag: z.string().min(1),
  /** Existing i18n label key (`questS1Lab.item.*`). */
  labelKey: z.string().min(1),
  /** i18n key for the tooltip effect description (`questS1Lab.stash.desc.*`). */
  descKey: z.string().min(1),
  /** Lucide icon id (resolved via `@/ui/shared/statIconUtils`) on the picker chip and belt. */
  icon: z.string().min(1),
  /** 'check': armed before a check, +bonus when stats match.
   *  'action': used standalone from the belt at a decision node.
   *  'passive' (PLAN-019-S4 T-5): armed by being packed — the engine reads
   *   its effect continuously; the belt never renders it clickable. */
  kind: z.enum(['check', 'action', 'passive']),
  /** Check-bonus magnitude (kind 'check' only). */
  bonus: z.number().optional(),
  /** Which check stats this item helps (drives both engine and tooltip hint). */
  stats: z.array(z.enum(['perc', 'int', 'str', 'con', 'agi', 'cha'])).optional(),
});
export type StashItem = z.infer<typeof StashItemSchema>;

/** Stash config: the catalog plus the bag contract. */
export const QuestStashSchema = z.object({
  /** How many items fit in the bag — the "cosa lascio a casa" decision (D3). */
  bagSlots: z.number().int().min(1).max(8).default(3),
  /** Flags packed when the run starts without an explicit loadout — keeps the
   *  pre-R-102 default behaviour for tests and non-picker call sites. */
  defaultLoadout: z.array(z.string().min(1)),
  /** The stash catalog, in display order. */
  items: z.array(StashItemSchema).min(1),
});

const RAW_QUEST_STASH = {
  bagSlots: 3,
  defaultLoadout: ['hasBonusForza', 'hasBonusPerc', 'hasHealing'],
  items: [
    {
      flag: 'hasBonusForza',
      labelKey: 'questS1Lab.item.bonusForza',
      descKey: 'questS1Lab.stash.desc.bonusForza',
      icon: 'axe',
      kind: 'check',
      bonus: 15,
      stats: ['str'],
    },
    {
      flag: 'hasBonusPerc',
      labelKey: 'questS1Lab.item.bonusPerc',
      descKey: 'questS1Lab.stash.desc.bonusPerc',
      icon: 'crosshair',
      kind: 'check',
      bonus: 15,
      stats: ['perc'],
    },
    {
      flag: 'hasFumogeno',
      labelKey: 'questS1Lab.item.smoke',
      descKey: 'questS1Lab.stash.desc.smoke',
      icon: 'wind',
      kind: 'check',
      bonus: 15,
      stats: ['agi'],
    },
    {
      flag: 'hasCorda',
      labelKey: 'questS1Lab.item.rope',
      descKey: 'questS1Lab.stash.desc.rope',
      icon: 'cable',
      kind: 'check',
      bonus: 15,
      stats: ['con', 'str'],
    },
    {
      flag: 'hasHealing',
      labelKey: 'questS1Lab.item.healing',
      descKey: 'questS1Lab.stash.desc.healing',
      icon: 'heart',
      kind: 'action',
    },
    {
      flag: 'hasPozione',
      labelKey: 'questS1Lab.item.potion',
      descKey: 'questS1Lab.stash.desc.potion',
      icon: 'droplets',
      kind: 'action',
    },
    {
      /* PLAN-019-S4 T-5: the guardian banner — `coverRiskDelta` wired into
       *  the engine (D-S4-3). Passive: packed = armed; the leader bears it
       *  and every other living member's risk bands drop while he stands. */
      flag: 'hasGuardianBanner',
      labelKey: 'missionPlanner.items.guardianBanner',
      descKey: 'questS1Lab.stash.desc.banner',
      icon: 'flag',
      kind: 'passive',
    },
  ],
};

/** Validated stash configuration. */
export const QUEST_STASH = QuestStashSchema.parse(RAW_QUEST_STASH);

/**
 * Resolves a player-picked loadout to engine flags: unknown entries dropped,
 * duplicates removed, result clamped to `bagSlots`. Entries may be catalog
 * item ids or historic engine flags interchangeably (S2.2 T-5 alias).
 * @param loadout - Item ids / engine flags picked in the stash picker
 *   (display order preserved).
 * @param stash - Stash config override (tests).
 * @returns Flag list to seed `QuestRunState.flags` with.
 */
export function resolveStashLoadout(
  loadout: string[] | undefined,
  stash = QUEST_STASH,
): string[] {
  const known = new Set(stash.items.map((i) => i.flag));
  const picked = (loadout ?? stash.defaultLoadout)
    .map(toEngineFlag)
    .filter((f, i, arr) => known.has(f) && arr.indexOf(f) === i);
  return picked.slice(0, stash.bagSlots);
}

/** Stats covered by a loadout — drives the picker hint ("copre STR · AGI"). */
export function loadoutCoverage(
  loadout: string[],
  stash = QUEST_STASH,
): LabStat[] {
  const byFlag = new Map(stash.items.map((i) => [i.flag, i]));
  const covered = new Set<LabStat>();
  for (const f of loadout) {
    for (const s of byFlag.get(f)?.stats ?? []) covered.add(s);
  }
  return [...covered];
}
