/**
 * questMemberStats — the resident → quest-member derivation table
 * (PLAN-019-S2.2 T-1, decision D-C).
 *
 * Single source of truth for converting a resident's real combat
 * `statSnapshot` (`Partial<StatBlock>`, balancer domain) into the six
 * `LabStat` channels the quest engine checks. Channels `str`/`con`/`perc`/
 * `agi` are REAL — they read `damage`/`hp`/`txc`/`evasion`; `int` and `cha`
 * are declared mock channels (`mockChannel: true`) until the Director picks
 * a real derivation — the recorded derogation, same pattern as R-102 items.
 *
 * Every real channel carries an explicit `scale`: the balancer domain
 * (damage ~18-34, hp ~150-300, txc ~22-30, evasion ~6-12) is NOT the LabStat
 * domain (~20-75) the authored scenarios are tuned on — without a scale the
 * pipeline would emit arbitrary numbers and silently break check odds.
 * The `runHp` row maps real hp into the lab HP range (goblin authored:
 * leader 100, members 60 — damages `upfrontDamage`/combat/harm are in lab
 * units, engine unchanged per I-3).
 *
 * Scale values are PROPOSED — T-1b presents the input/output distributions
 * to the Director before the T-4 calibration gate; numbers live here so a
 * re-approval changes config only.
 */

import { z } from 'zod';
import type { LabStat } from '@/ui/idleVillage/questS1Lab/questScenario';

/* ------------------------------------------------------------------------ */
/* Scale primitives                                                          */
/* ------------------------------------------------------------------------ */

const Range = z.tuple([z.number(), z.number()]);

/**
 * How a real stat value maps into the LabStat domain:
 * - `linear`: affine inputRange → outputRange, result clamped to outputRange.
 * - `clamp`: the value itself, clamped into outputRange (same-domain stats).
 * - `thresholds`: step table — first `lte` bound wins.
 */
export const StatScaleSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('linear'), inputRange: Range, outputRange: Range }).strict(),
  z.object({ kind: z.literal('clamp'), outputRange: Range }).strict(),
  z
    .object({
      kind: z.literal('thresholds'),
      thresholds: z.array(z.object({ lte: z.number(), value: z.number() }).strict()).min(1),
      /** Fallback when the input is above every `lte` bound. */
      above: z.number(),
    })
    .strict(),
]);
export type StatScale = z.infer<typeof StatScaleSchema>;

export const StatRoundSchema = z.enum(['round', 'floor', 'ceil', 'none']);
export type StatRound = z.infer<typeof StatRoundSchema>;

/* ------------------------------------------------------------------------ */
/* Channel rows                                                              */
/* ------------------------------------------------------------------------ */

/** A channel fed by a real `StatBlock` field — scale mandatory (r1). */
export const RealChannelSchema = z
  .object({
    from: z.enum(['damage', 'hp', 'txc', 'evasion', 'agility', 'hitChance', 'armor', 'resistance', 'critChance']),
    scale: StatScaleSchema,
    round: StatRoundSchema.default('round'),
    /** Value emitted when the source field is absent/invalid in the snapshot. */
    missing: z.number(),
    mockChannel: z.literal(false).optional(),
  })
  .strict();
export type RealChannel = z.infer<typeof RealChannelSchema>;

/** A channel with no real source yet — declared mock (D-C derogation). */
export const MockChannelSchema = z
  .object({
    mockChannel: z.literal(true),
    /** `value` = flat mock; `mirror` = reuse another channel's derived value
     *  (D-C: `cha` uses the `int` channel). */
    mock: z.union([z.object({ value: z.number() }).strict(), z.object({ mirror: z.enum(['perc', 'int', 'str', 'con', 'agi', 'cha']) }).strict()]),
  })
  .strict();
export type MockChannel = z.infer<typeof MockChannelSchema>;

export const QuestStatChannelSchema = z.union([RealChannelSchema, MockChannelSchema]);
export type QuestStatChannel = z.infer<typeof QuestStatChannelSchema>;

/* ------------------------------------------------------------------------ */
/* Table                                                                     */
/* ------------------------------------------------------------------------ */

export const QuestMemberStatsSchema = z
  .object({
    /** LabStat derivation channels — one row per LabStat. */
    channels: z
      .object({
        str: QuestStatChannelSchema,
        con: QuestStatChannelSchema,
        perc: QuestStatChannelSchema,
        agi: QuestStatChannelSchema,
        int: QuestStatChannelSchema,
        cha: QuestStatChannelSchema,
      })
      .strict(),
    /** Run HP (engine `hp`/`maxHp`) — own scale, constrained to the lab range
     *  the S1 scenarios were validated on (leader 100 / member 60 authored). */
    runHp: z
      .object({
        from: z.literal('hp'),
        scale: StatScaleSchema,
        round: StatRoundSchema.default('round'),
        missing: z.number(),
      })
      .strict(),
    /** Wounded residents are ADMITTED (Director 2026-10-09: «il ferito può
     *  continuare — e ripartire», no dedicated warning). Their penalty lives
     *  in the data: run start HP scales with `currentHp/maxHp`. */
    injured: z
      .object({
        /** Start HP = `runHp × currentHp/maxHp` for a resident arriving hurt
         *  (also covers `isInjured` with reduced `currentHp`). */
        hpFromCurrentRatio: z.boolean(),
        /** Stat modifiers for injured members — declared hook, currently
         *  `null`: InjuryEngine applies status/recovery only and exposes no
         *  numeric stat modifier to read. Wire a real multiplier here when
         *  the engine grows one. */
        statPenalty: z.null(),
      })
      .strict(),
    /** T-4 calibration: the REAL residents the calibration party is built
     *  from (named by roster id; role assigns quest slot order). The
     *  reference is versioned here — independent from the observed output. */
    calibrationResidents: z
      .array(
        z
          .object({
            residentId: z.string().min(1),
            role: z.enum(['leader', 'member', 'bodyguard']),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((cfg, ctx) => {
    // cha mirrors int (D-C) — guard against a future mirror loop.
    const cha = cfg.channels.cha;
    if ('mock' in cha && 'mirror' in cha.mock && cha.mock.mirror === 'cha') {
      ctx.addIssue({ code: 'custom', message: "channels.cha non può specchiare sé stesso" });
    }
    // Real channels must carry a scale (r1: no scale = arbitrary numbers).
    for (const [stat, ch] of Object.entries(cfg.channels)) {
      if (!('mockChannel' in ch && ch.mockChannel) && !('scale' in ch)) {
        ctx.addIssue({ code: 'custom', message: `canale '${stat}' reale senza scale` });
      }
    }
  });

export type QuestMemberStats = z.infer<typeof QuestMemberStatsSchema>;

/* ------------------------------------------------------------------------ */
/* Authored values (PROPOSED — Director gate T-1b)                           */
/* ------------------------------------------------------------------------ */

const RAW_QUEST_MEMBER_STATS = {
  channels: {
    /* damage ~18-34 (test roster) → LabStat 25-75 */
    str: {
      from: 'damage',
      scale: { kind: 'linear', inputRange: [10, 40], outputRange: [25, 75] },
      round: 'round',
      missing: 30,
    },
    /* hp ~150-300 → LabStat 30-75 */
    con: {
      from: 'hp',
      scale: { kind: 'linear', inputRange: [150, 300], outputRange: [30, 75] },
      round: 'round',
      missing: 30,
    },
    /* txc ~22-30 (flat — D-C closed: perc←txc, independent from evasion) */
    perc: {
      from: 'txc',
      scale: { kind: 'linear', inputRange: [15, 35], outputRange: [25, 75] },
      round: 'round',
      missing: 30,
    },
    /* evasion ~6-12 → LabStat 25-70 */
    agi: {
      from: 'evasion',
      scale: { kind: 'linear', inputRange: [0, 20], outputRange: [25, 70] },
      round: 'round',
      missing: 30,
    },
    /* D-C derogation: no real source yet — flat mock values inside the same
     * config-driven pipeline; cha mirrors the int channel. */
    int: { mockChannel: true, mock: { value: 40 } },
    cha: { mockChannel: true, mock: { mirror: 'int' } },
  },
  /* real hp ~150-300 → lab run HP ~45-100 (authored leader 100/member 60). */
  runHp: {
    from: 'hp',
    scale: { kind: 'linear', inputRange: [150, 300], outputRange: [45, 100] },
    round: 'round',
    missing: 50,
  },
  injured: { hpFromCurrentRatio: true, statPenalty: null },
  /* The real roster's reference trio (TEST_ROSTER_HEROES ids): the party the
   *  per-check calibration table is measured against. */
  calibrationResidents: [
    { residentId: 'hero-sir-spaccaculi', role: 'leader' },
    { residentId: 'hero-salvatrice', role: 'member' },
    { residentId: 'hero-giggiolillo', role: 'member' },
  ],
};

/** Validated derivation table — the single source read by the adapter. */
export const QUEST_MEMBER_STATS: QuestMemberStats = QuestMemberStatsSchema.parse(RAW_QUEST_MEMBER_STATS);

/* ------------------------------------------------------------------------ */
/* Application                                                               */
/* ------------------------------------------------------------------------ */

const ROUNDERS: Record<StatRound, (n: number) => number> = {
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  none: (n) => n,
};

/**
 * Applies a {@link StatScale} to a raw input value.
 * @param scale - Scale rule (linear/clamp/thresholds).
 * @param input - Raw stat value.
 * @returns Scaled value, unrounded (rounding is the caller's channel step).
 */
export function applyStatScale(scale: StatScale, input: number): number {
  if (scale.kind === 'linear') {
    const [inMin, inMax] = scale.inputRange;
    const [outMin, outMax] = scale.outputRange;
    if (inMax === inMin) return outMin;
    const t = (input - inMin) / (inMax - inMin);
    const out = outMin + t * (outMax - outMin);
    return Math.min(Math.max(out, Math.min(outMin, outMax)), Math.max(outMin, outMax));
  }
  if (scale.kind === 'clamp') {
    const [lo, hi] = scale.outputRange;
    return Math.min(Math.max(input, lo), hi);
  }
  const hit = scale.thresholds.find((th) => input <= th.lte);
  return hit ? hit.value : scale.above;
}

/**
 * Resolves one channel against a (possibly partial) StatBlock.
 * @param channel - Channel row (real source or declared mock).
 * @param statSnapshot - Resident combat snapshot.
 * @param resolved - Already-resolved channel values (for `mirror` mocks).
 * @returns The channel's LabStat value.
 */
export function resolveStatChannel(
  channel: QuestStatChannel,
  statSnapshot: Partial<Record<string, number>>,
  resolved: Partial<Record<LabStat, number>> = {},
): number {
  if ('mockChannel' in channel && channel.mockChannel) {
    const m = channel.mock;
    if ('mirror' in m) return resolved[m.mirror] ?? 0;
    return m.value;
  }
  const raw = statSnapshot[channel.from];
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return channel.missing;
  return ROUNDERS[channel.round](applyStatScale(channel.scale, raw));
}

/** LabStat order of resolution — `mirror` mocks resolve after their target. */
export const CHANNEL_ORDER: readonly LabStat[] = ['str', 'con', 'perc', 'agi', 'int', 'cha'];

/**
 * Derives the six LabStat values for a resident snapshot.
 * @param statSnapshot - `Partial<StatBlock>` from `ResidentState.statSnapshot`.
 * @param config - Derivation table (defaults to {@link QUEST_MEMBER_STATS}).
 * @returns `Record<LabStat, number>` ready for `LabMember.stats`.
 */
export function deriveQuestStats(
  statSnapshot: Partial<Record<string, number>> | undefined,
  config: QuestMemberStats = QUEST_MEMBER_STATS,
): Record<LabStat, number> {
  const snapshot = statSnapshot ?? {};
  const out = {} as Record<LabStat, number>;
  for (const stat of CHANNEL_ORDER) {
    out[stat] = resolveStatChannel(config.channels[stat], snapshot, out);
  }
  return out;
}

/**
 * Derives the run HP pool for a resident (the engine's `hp`/`maxHp`).
 * Wounded residents (`currentHp < maxHp` or `isInjured`) start scaled down
 * per the `injured` rule — same rule the forecast adapter uses.
 * @param statSnapshot - Resident combat snapshot.
 * @param currentHp - Resident's current HP (for the wounded rule).
 * @param maxHp - Resident's max HP.
 * @param config - Derivation table.
 * @returns Run maxHp for this member (≥1).
 */
export function deriveRunHp(
  statSnapshot: Partial<Record<string, number>> | undefined,
  currentHp: number | undefined,
  maxHp: number | undefined,
  config: QuestMemberStats = QUEST_MEMBER_STATS,
): number {
  const raw = statSnapshot?.[config.runHp.from];
  const base =
    typeof raw === 'number' && Number.isFinite(raw)
      ? ROUNDERS[config.runHp.round](applyStatScale(config.runHp.scale, raw))
      : config.runHp.missing;
  if (!config.injured.hpFromCurrentRatio) return Math.max(1, base);
  const cur = typeof currentHp === 'number' && Number.isFinite(currentHp) ? currentHp : maxHp;
  const max = typeof maxHp === 'number' && Number.isFinite(maxHp) && maxHp > 0 ? maxHp : undefined;
  if (cur === undefined || max === undefined || cur >= max) return Math.max(1, base);
  return Math.max(1, Math.floor(base * (cur / max)));
}
