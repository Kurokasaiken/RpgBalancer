/**
 * kitSchemas — Zod schemas for the domain-kit authoring boundary
 * (PLAN-029 SP-1 T-4; contract: context/QUEST_GEN_LAB_CONTRACTS.md §4).
 *
 * The Zod schemas are the authoring-boundary source of truth: a kit or
 * tuning written by hand or by a lab drawer must pass `*.safeParse()`
 * BEFORE `generate` is called. The generator's own param types remain
 * the runtime contract — `z.infer` types here are the compile-time
 * alarm: if an interface drifts, the bidirectional compat checks at the
 * bottom break compilation.
 *
 * Rules (contract):
 * - `copy` is exhaustive: every skeleton node key is REQUIRED, unknown
 *   keys rejected — the TS `Record<NodeKey, NodeCopy>` contract already
 *   enforced this; the schema must not loosen it.
 * - Copy leaves are `.strict()` — real `RaceNodeCopy`/`FloodNodeCopy`
 *   fields incl. optional ones (`transit`, `failHint`, `verdictFlavor`,
 *   `outcomeLog`, `option`, `options`).
 * - Flat kit + `{en,it}` localized wrapper variants both exist in the
 *   wild (audit L-06/L-07) and get distinct schemas.
 * - Tuning has a full schema (drawer `defaultTuning` surface) and a
 *   partial input schema (the `tuning?` param). Integer percent bounds
 *   from the shipped defaults; fractional values are not attested and
 *   are rejected (audit L-04).
 * - No cross-field superRefine — structural only.
 */

import { z } from 'zod';
import type { Verdict } from '@/ui/idleVillage/questS1Lab/questScenario';
import type {
  LocalizedRaceDomainKit,
  RaceDomainKit,
  RaceNodeCopy,
  RaceNodeKey,
  RaceTuning,
} from './raceGimmick';
import type {
  FloodDomainKit,
  FloodNodeCopy,
  FloodNodeKey,
  FloodTuning,
  LocalizedFloodDomainKit,
} from './floodVault';

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

const VERDICTS = ['epicfail', 'fail', 'almost', 'win', 'bigwin'] as const;

const VerdictFlavorSchema = z
  .object(Object.fromEntries(VERDICTS.map((v) => [v, z.string().optional()])) as Record<Verdict, z.ZodOptional<z.ZodString>>)
  .strict();

const OptionPresentationSchema = z
  .object({ label: z.string(), detail: z.string() })
  .strict();

/** One scene's dressing — the shared copy leaf both kits use. */
const NodeCopySchema = z
  .object({
    title: z.string(),
    body: z.string(),
    transit: z.string().optional(),
    failHint: z.string().optional(),
    verdictFlavor: VerdictFlavorSchema.optional(),
    outcomeLog: VerdictFlavorSchema.optional(),
    option: OptionPresentationSchema.optional(),
    /** Choice nodes only: the full option-list copy keyed by option id. */
    options: z.record(z.string(), OptionPresentationSchema).optional(),
  })
  .strict();

/* ------------------------------------------------------------------ */
/* Node-key tuples — compile-time union-equality enforced              */
/* ------------------------------------------------------------------ */

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type AssertTrue<T extends true> = T;

const RACE_NODE_KEYS = [
  'partenza', 'viaA', 'viaB', 'tappa',
  'sprint', 'passo', 'taglio', 'balzo',
  'imboscata', 'vetta', 'sicuro', 'varco',
  'sconfitta', 'fine',
] as const;
type _RaceKeysExhaustive = AssertTrue<Equals<(typeof RACE_NODE_KEYS)[number], RaceNodeKey>>;

const FLOOD_NODE_KEYS = [
  'ingresso', 'gabbia', 'cunicolo', 'crocevia',
  'vena', 'punta', 'camera', 'puntella', 'madre',
  'piena', 'nuoto', 'sacca', 'sbarramento', 'diaframma', 'ultimo',
  'fine',
] as const;
type _FloodKeysExhaustive = AssertTrue<Equals<(typeof FLOOD_NODE_KEYS)[number], FloodNodeKey>>;

/** z.object shape: every node key required, value = strict copy leaf. */
const copyShape = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, NodeCopySchema])) as Record<K, typeof NodeCopySchema>;

const RaceCopySchema = z.object(copyShape(RACE_NODE_KEYS)).strict();
const FloodCopySchema = z.object(copyShape(FLOOD_NODE_KEYS)).strict();

/* ------------------------------------------------------------------ */
/* Kit schemas                                                         */
/* ------------------------------------------------------------------ */

/** Authoring-boundary schema for a race domain kit (flat variant). */
export const RaceDomainKitSchema = z
  .object({
    id: z.string().min(1),
    prefix: z.string().min(1),
    title: z.string(),
    flavour: z.string(),
    names: z
      .object({
        place: z.string(),
        rival: z.string(),
        prize: z.string(),
      })
      .strict(),
    intelId: z.string().min(1),
    objective: z.string(),
    copy: RaceCopySchema,
  })
  .strict();

/** Bilingual wrapper emitted by the narration pipeline. */
export const LocalizedRaceDomainKitSchema = z
  .object({ en: RaceDomainKitSchema, it: RaceDomainKitSchema })
  .strict();

/** Authoring-boundary schema for a flood domain kit (flat variant). */
export const FloodDomainKitSchema = z
  .object({
    id: z.string().min(1),
    prefix: z.string().min(1),
    title: z.string(),
    flavour: z.string(),
    objective: z.string(),
    intelId: z.string().min(1),
    loot: z
      .object({
        pezzo: z.string(),
        cassa: z.string(),
        madre: z.string(),
        lingotto: z.string(),
      })
      .strict(),
    copy: FloodCopySchema,
  })
  .strict();

export const LocalizedFloodDomainKitSchema = z
  .object({ en: FloodDomainKitSchema, it: FloodDomainKitSchema })
  .strict();

/* ------------------------------------------------------------------ */
/* Tuning schemas                                                      */
/* ------------------------------------------------------------------ */

/** Integer percent fields — bounds derived from shipped defaults. */
const pct = (max: number) => z.number().int().min(0).max(max);

/** Full race tuning (the drawer's defaultTuning surface). */
export const RaceTuningSchema = z
  .object({
    goal: z.number().int().min(1),
    twistChance: pct(100),
    twistRearmChance: pct(100),
  })
  .strict();

/** Partial input — the `tuning?` param of `generateRaceScenario`. */
export const RaceTuningPartialSchema = RaceTuningSchema.partial();

export const FloodTuningSchema = z
  .object({
    limite: z.number().int().min(1),
    uscitaGoal: z.number().int().min(1),
    madreChance: pct(100),
    pareteChance: pct(100),
  })
  .strict();

export const FloodTuningPartialSchema = FloodTuningSchema.partial();

/* ------------------------------------------------------------------ */
/* z.infer aliases + bidirectional compat alarms                       */
/* ------------------------------------------------------------------ */

export type RaceDomainKitAuthored = z.infer<typeof RaceDomainKitSchema>;
export type FloodDomainKitAuthored = z.infer<typeof FloodDomainKitSchema>;
export type RaceTuningAuthored = z.infer<typeof RaceTuningSchema>;
export type FloodTuningAuthored = z.infer<typeof FloodTuningSchema>;
export type RaceTuningPartialAuthored = z.infer<typeof RaceTuningPartialSchema>;
export type FloodTuningPartialAuthored = z.infer<typeof FloodTuningPartialSchema>;

/**
 * Assignability check both directions where meaningful: a field
 * renamed/added/removed on either side breaks compilation here — the
 * seam alarm the registry relies on.
 */
type AssertAssignable<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;

type _KitCompatRace = AssertAssignable<RaceDomainKitAuthored, RaceDomainKit>;
type _KitCompatFlood = AssertAssignable<FloodDomainKitAuthored, FloodDomainKit>;
type _TuningCompatRace = AssertAssignable<RaceTuningAuthored, RaceTuning>;
type _TuningCompatFlood = AssertAssignable<FloodTuningAuthored, FloodTuning>;
type _CopyCompatRace = AssertAssignable<z.infer<typeof NodeCopySchema>, RaceNodeCopy>;
type _CopyCompatFlood = AssertAssignable<z.infer<typeof NodeCopySchema>, FloodNodeCopy>;
type _LocCompatRace = AssertAssignable<z.infer<typeof LocalizedRaceDomainKitSchema>, LocalizedRaceDomainKit>;
type _LocCompatFlood = AssertAssignable<z.infer<typeof LocalizedFloodDomainKitSchema>, LocalizedFloodDomainKit>;

/* ------------------------------------------------------------------ */
/* Authoring-boundary parse helpers                                    */
/* ------------------------------------------------------------------ */

/**
 * Parse a race kit at the authoring boundary — malformed copy is
 * rejected here, before `generateRaceScenario` is ever called.
 * @param input raw candidate kit (drawer output, JSON, hand edit).
 * @returns the typed kit on success.
 * @throws ZodError on any structural violation.
 */
export function parseRaceDomainKit(input: unknown): RaceDomainKit {
  return RaceDomainKitSchema.parse(input);
}

/** Flood variant of {@link parseRaceDomainKit}. */
export function parseFloodDomainKit(input: unknown): FloodDomainKit {
  return FloodDomainKitSchema.parse(input);
}
