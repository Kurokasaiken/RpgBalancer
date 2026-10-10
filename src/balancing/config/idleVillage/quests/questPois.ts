/**
 * questPois — canonical POI offer config (PLAN-019-S2.3).
 *
 * A POI on `/game` is the *offer* of a quest: where it sits on the map, the
 * real-time window in which the offer is open (TimeEngine day index), the
 * normative total duration the frontier splits into per-node `readyAt`
 * windows (D-K), and which authored `offer.slots` are required vs optional.
 *
 * Ownership:
 * - Slot *definitions* stay in `questScenario.offer.slots` (S2.1); here the
 *   POI only partitions them by id — a slot id that is not referenced is an
 *   error (coherence tested).
 * - `dangerBands` (R-105) lives here canonically — the provisional table in
 *   `questScenarioConfig.test.ts` was a placeholder pending this module.
 * - `estimatedDurationTicks` is NORMATIVE (r2): it is the value D-K splits
 *   into node windows and D-J renders on the halo; `ticksPerNode` is the
 *   declared quantum — `estimatedDurationTicks = ticksPerNode ×
 *   expectedPathLength` where expectedPathLength is the authored estimate
 *   of nodes a party traverses, tested against the simulated median path
 *   within a declared tolerance (±40% — paths vary by strategy, the loot
 *   loop included).
 */
import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Danger bands (R-105) — CANONICAL values owned here (S2.3).           */
/* ------------------------------------------------------------------ */

/**
 * Band on `anyDeathPct` — P(≥1 party member dies) over a reference sim,
 * the player-visible meaning of «danger». Intervals are half-open
 * `[prevMax, max)`; `max: null` = unbounded top band.
 */
export const DangerBandSchema = z
  .object({
    id: z.string().min(1),
    /** i18n key for the band label (idleVillage namespace) — never a string. */
    i18nKey: z.string().min(1),
    /** Upper bound of `anyDeathPct` (exclusive). null = no upper bound. */
    maxAnyDeathPct: z.number().min(0).max(100).nullable(),
  })
  .strict();
export type DangerBand = z.infer<typeof DangerBandSchema>;

/**
 * Canonical ordered band table — values from the S2.1 provisional table,
 * promoted to config (calibration of the NUMBERS is R-105/S2.5 scope, not
 * this slice: here the band contract and the derivation point exist).
 */
export const DANGER_BANDS: readonly DangerBand[] = z.array(DangerBandSchema).min(1).parse([
  { id: 'bassa', i18nKey: 'idleVillage.questOffer.band.bassa', maxAnyDeathPct: 15 },
  { id: 'media', i18nKey: 'idleVillage.questOffer.band.media', maxAnyDeathPct: 45 },
  { id: 'alta', i18nKey: 'idleVillage.questOffer.band.alta', maxAnyDeathPct: 75 },
  { id: 'letale', i18nKey: 'idleVillage.questOffer.band.letale', maxAnyDeathPct: null },
]);

/** Band id for a measured `anyDeathPct` — the single lookup used by the
 *  offer-band derivation and the S2.1 calibration test. */
export function dangerBandFor(anyDeathPct: number): DangerBand {
  const band = DANGER_BANDS.find((b) => b.maxAnyDeathPct === null || anyDeathPct < b.maxAnyDeathPct);
  return band ?? DANGER_BANDS[DANGER_BANDS.length - 1];
}

/* ------------------------------------------------------------------ */
/* Quest POI — the offer envelope on the map.                           */
/* ------------------------------------------------------------------ */

/**
 * POI offer config. Time fields use the TimeEngine day index (the same
 * `currentDay` the store derives from `currentTick / dayLengthInTimeUnits`):
 * `[availableFromDay, availableUntilDay)` is the open window of the OFFER —
 * once launched, the run's own tick schedule applies (D-K).
 *
 * `slots` partitions the scenario's authored `offer.slots` by id; a POI may
 * declare fewer optional slots than the scenario offers (a weaker posting),
 * never ids the scenario does not define (coherence test).
 */
export const QuestPoiSchema = z
  .object({
    id: z.string().min(1),
    /** Map coordinates in world px (same space as `gameFrameConfig.questPois`). */
    x: z.number(),
    y: z.number(),
    /** Medallion size in px. */
    sizePx: z.number().positive(),
    /** The scenario this offer launches — `QuestId` vocabulary. */
    questId: z.enum(['cassa', 'goblin', 'rovine']),
    /** First day index the offer is open (inclusive). */
    availableFromDay: z.number().int().nonnegative(),
    /** Last day index the offer is open (exclusive). */
    availableUntilDay: z.number().int().nonnegative(),
    /**
     * Normative total duration of the quest in game ticks (1 tick = 1s on
     * the /game clock). D-K splits it into per-node `readyAt` windows along
     * the actual path; D-J renders it as the halo fill. Must equal
     * `ticksPerNode × expectedPathNodes` — coherence tested.
     */
    estimatedDurationTicks: z.number().int().positive(),
    /**
     * Authored duration of ONE node on the run path, in ticks. The frontier
     * applies it at every node arrival: `readyAt = arrivalAtNode +
     * ticksPerNode` (r2 path-relative schedule). Declared range [3, 30]:
     * below 3 the halo reads as instant, above 30 a single step feels stuck.
     */
    ticksPerNode: z.number().int().min(3).max(30),
    /** Authored estimate of how many nodes a party traverses — the value
     *  `estimatedDurationTicks` is built on. Tested vs the simulated median
     *  visited-node count of the reference party (±40% declared). */
    expectedPathNodes: z.number().int().positive(),
    /**
     * Partition of `questScenario.offer.slots` by id: which slots the
     * expedition MUST fill before launch (required) and which the player
     * may leave empty (optional).
     */
    slots: z
      .object({
        required: z.array(z.string().min(1)).min(1),
        optional: z.array(z.string().min(1)),
      })
      .strict(),
    /**
     * Authored repeatability (PLAN-019-S4 T-3, D-S4-6): absent = the offer
     * is one-shot — its report dismissed on an ended+settled run consumes
     * the POI forever (`consumedPoiIds`, persisted). `true` = the offer
     * comes back once the run is cleared, as long as the availability
     * window is still open; a stale consumed record is ignored.
     */
    repeatable: z.boolean().optional(),
  })
  .strict()
  .refine((p) => p.availableUntilDay > p.availableFromDay, {
    message: 'availableUntilDay deve essere > availableFromDay',
    path: ['availableUntilDay'],
  })
  .refine((p) => p.estimatedDurationTicks === p.ticksPerNode * p.expectedPathNodes, {
    message: 'estimatedDurationTicks deve essere ticksPerNode × expectedPathNodes',
    path: ['estimatedDurationTicks'],
  });
export type QuestPoi = z.infer<typeof QuestPoiSchema>;

/**
 * The two offers of the S2 slice. Positions are authored world-px
 * coordinates on the `/game` map (Director may relocate); the windows are
 * generous — availability pressure is not the mechanic being sliced.
 */
export const QUEST_POIS: readonly QuestPoi[] = z.array(QuestPoiSchema).parse([
  {
    id: 'poi-goblin',
    x: 2750,
    y: 1000,
    sizePx: 55,
    questId: 'goblin',
    availableFromDay: 0,
    availableUntilDay: 60,
    estimatedDurationTicks: 250,
    ticksPerNode: 10,
    expectedPathNodes: 25,
    slots: {
      required: ['goblin-slot-leader'],
      optional: ['goblin-slot-member-1', 'goblin-slot-member-2', 'goblin-slot-bodyguard'],
    },
  },
  {
    id: 'poi-rovine',
    x: 3050,
    y: 1450,
    sizePx: 55,
    questId: 'rovine',
    availableFromDay: 0,
    availableUntilDay: 60,
    estimatedDurationTicks: 100,
    ticksPerNode: 10,
    expectedPathNodes: 10,
    slots: {
      required: ['rovine-slot-leader'],
      optional: ['rovine-slot-member-1', 'rovine-slot-member-2', 'rovine-slot-esploratore'],
    },
  },
]);

/** Lookup by POI id — single access point, never scan the array. */
export function questPoiById(id: string): QuestPoi | undefined {
  return QUEST_POIS.find((p) => p.id === id);
}

/**
 * Whether dismissing the report consumes the POI (D-S4-6): one-shot by
 * default, only an authored `repeatable` offer survives its own report.
 */
export function poiConsumesOnReportClose(poi: Pick<QuestPoi, 'repeatable'>): boolean {
  return !poi.repeatable;
}

/**
 * Whether the POI is currently consumed off the map. A `repeatable` offer
 * ignores even a stale consumed record (authored after the POI had already
 * been consumed — migration honesty).
 */
export function isPoiConsumed(
  poi: Pick<QuestPoi, 'id' | 'repeatable'>,
  consumedIds: readonly string[] | null | undefined,
): boolean {
  return !poi.repeatable && !!consumedIds?.includes(poi.id);
}
