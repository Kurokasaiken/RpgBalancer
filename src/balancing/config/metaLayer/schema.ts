/**
 * Meta-Layer schemas (PLAN-030 / R-164).
 *
 * Canonical Zod schemas for the opportunity layer prototype (Gate A):
 * flat `qualities` world state + transient offer generator + authored
 * milestone nodes. Ratified model: hybrid (qualities + milestone nodes),
 * open config-first arc types, no intel currency, leader-capacity only,
 * dual timers (acceptance/completion), 4 computed gate states.
 *
 * Mirrors `context/QUEST_OPPORTUNITY_LAYER.md` and the PLAN-030 §4
 * contract sketch. Requirements use the *minimal* declaration form —
 * the 4-type taxonomy is deliberately NOT enforced (it stays proposal,
 * to be validated by this prototype); `severity` is an opt-in field
 * for ex-post classification.
 */

import { z } from 'zod';

/** Namespace prefix of a quality key. */
export const QualityPrefixSchema = z.enum([
  'access',
  'contact',
  'intel',
  'clock',
  'capability',
]);
export type QualityPrefix = z.infer<typeof QualityPrefixSchema>;

/** A world-state quality key, e.g. `access:sewers`, `clock:goblin-pressure`. */
export const QualityKeySchema = z
  .string()
  .regex(/^(access|contact|intel|clock|capability):[a-z0-9][a-z0-9-]*$/);
export type QualityKey = z.infer<typeof QualityKeySchema>;

/** How a requirement binds the party/world. */
export const RequirementKindSchema = z.enum([
  'quality',
  'capability',
  'stat',
]);
export type RequirementKind = z.infer<typeof RequirementKindSchema>;

/**
 * Opt-in ex-post classification (proposal taxonomy under validation —
 * OPEN-020). Not required in v0; when absent the engine treats a missing
 * requirement as attemptable-at-risk.
 */
export const RequirementSeveritySchema = z.enum([
  'absolute',
  'capability',
  'cost',
  'optimize',
]);
export type RequirementSeverity = z.infer<typeof RequirementSeveritySchema>;

/** A single requirement on an offer, milestone approach or appearance rule. */
export const RequirementRefSchema = z
  .object({
    kind: RequirementKindSchema,
    /** QualityKey | capability tag | stat name depending on `kind`. */
    key: z.string().min(1),
    /**
     * Minimum value required. `quality`: default 1 (presence). `stat`:
     * required — the stat must be ≥ min. `capability`: ignored (presence).
     */
    min: z.number().int().min(0).optional(),
    severity: RequirementSeveritySchema.optional(),
  })
  .strict();
export type RequirementRef = z.infer<typeof RequirementRefSchema>;

/** A reward/consequence written into world qualities. */
export const QualityDeltaSchema = z
  .object({
    key: QualityKeySchema,
    delta: z.number().int(),
  })
  .strict();
export type QualityDelta = z.infer<typeof QualityDeltaSchema>;

/**
 * Harm conditional on the offer FAILING (fail or epic-fail zone).
 * `death` is rolled first, then `wound`; the remainder is a clean fail.
 * On epic-fail both rates are scaled by `tuning.epicFailHarmScale` and a
 * no-harm roll still lands a wound (an epic fail is never free).
 */
export const HarmProfileSchema = z
  .object({
    wound: z.number().min(0).max(1),
    death: z.number().min(0).max(1),
  })
  .strict()
  .refine((h) => h.wound + h.death <= 1, {
    message: 'harmProfile.wound + death must be <= 1',
  });
export type HarmProfile = z.infer<typeof HarmProfileSchema>;

/** Computed gate state shown on the offer card (ratified). */
export const GateStateSchema = z.enum([
  'locked',
  'underprepared',
  'ready',
  'over-qualified',
]);
export type GateState = z.infer<typeof GateStateSchema>;

/** Time window in which the offer may appear/be accepted. */
export const WindowSchema = z
  .object({
    openAt: z.number().int().min(0),
    closeAt: z.number().int().positive(),
  })
  .strict()
  .refine((w) => w.closeAt > w.openAt, {
    message: 'window.closeAt must be > openAt',
  });
export type OfferWindow = z.infer<typeof WindowSchema>;

/**
 * A transient quest offer definition. Offers are NOT graph nodes: the
 * generator samples them against world state; resolving one writes
 * `provides` back into the qualities.
 */
export const OfferDefSchema = z
  .object({
    id: z.string().min(1),
    family: z.string().min(1),
    tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    /**
     * Conditions for the offer to enter the generation pool. When
     * omitted the offer is always eligible. Distinct from `requires`:
     * an offer may appear while Locked, but never before `appearsWhen`.
     */
    appearsWhen: z.array(RequirementRefSchema).optional(),
    /** What the party/world must satisfy for a clean attempt. */
    requires: z.array(RequirementRefSchema),
    /** Qualities written on win / big win. */
    provides: z.array(QualityDeltaSchema),
    /** Partial write on `almost` outcome (subset semantics). */
    providesOnAlmost: z.array(QualityDeltaSchema).optional(),
    /** Ticks the quest occupies a leader once accepted. */
    durationTicks: z.number().int().positive(),
    /** Ticks the offer stays on the board before expiring. */
    acceptanceTicks: z.number().int().positive(),
    /** Deadline after acceptance: resolve must land within this many ticks. */
    completionTicks: z.number().int().positive(),
    window: WindowSchema.optional(),
    /**
     * Structured unlock route shown while Locked (ratified: the card
     * names the way to unlock). The requirement whose satisfaction
     * would remove the blocking absolute requirement.
     */
    unlockRoute: RequirementRefSchema.optional(),
    /** Raw fail-chance band [lo, hi]; the scout report narrows it. */
    riskBand: z.tuple([
      z.number().min(0).max(1),
      z.number().min(0).max(1),
    ]),
    /** What failure costs the party, conditional on failing (ratified price). */
    harmProfile: HarmProfileSchema,
    /** Base generation weight (before steering bias). */
    weight: z.number().positive(),
    /** If true the offer can be generated again after completion. */
    repeatable: z.boolean().optional(),
    /** Minimum ticks between two appearances of a repeatable offer. */
    repeatCooldownTicks: z.number().int().positive().optional(),
  })
  .strict()
  .refine((o) => o.riskBand[0] <= o.riskBand[1], {
    message: 'riskBand[0] must be <= riskBand[1]',
  });
export type OfferDef = z.infer<typeof OfferDefSchema>;

/**
 * A quest family: signature pressure (the variable), how it stops, and
 * the channels mechanically compatible. Families are pressure classes,
 * not fiction — the swap test applies.
 */
export const FamilyDefSchema = z
  .object({
    id: z.string().min(1),
    /** The pressure variable the family's quests push on. */
    signaturePressure: QualityKeySchema,
    /** When the pressure run ends. */
    stopCondition: z
      .object({
        kind: z.enum(['pressureAtOrAbove', 'pressureAtOrBelow', 'ticks']),
        value: z.number().int(),
      })
      .strict(),
    /** Channel ids mechanically compatible (e.g. stealth, arcana…). */
    compatibleChannels: z.array(z.string().min(1)),
  })
  .strict();
export type FamilyDef = z.infer<typeof FamilyDefSchema>;

/**
 * An authored strategic milestone (the "hybrid" part of the model):
 * visible goal that tracks which approaches are open. Each inner array
 * is ONE approach — a set of requirements that must ALL be satisfied
 * for that approach to be open.
 */
export const MilestoneNodeSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    /** Alternative approaches; ≥2 required by the multi-entry rule. */
    approaches: z.array(z.array(RequirementRefSchema)).min(2),
  })
  .strict();
export type MilestoneNode = z.infer<typeof MilestoneNodeSchema>;

/** A world clock: advances +1 every `periodTicks`; may cap at `max`. */
export const ClockDefSchema = z
  .object({
    key: QualityKeySchema.refine((k) => k.startsWith('clock:'), {
      message: 'ClockDef key must use the clock: prefix',
    }),
    startAt: z.number().int().min(0),
    /** +1 every N ticks of advanceTime. */
    periodTicks: z.number().int().positive(),
    max: z.number().int().positive().optional(),
  })
  .strict();
export type ClockDef = z.infer<typeof ClockDefSchema>;

/** Steering bias: familyId → weight multiplier (visible, never a filter). */
export const SteeringBiasSchema = z.record(
  z.string().min(1),
  z.number().min(0),
);
export type SteeringBias = z.infer<typeof SteeringBiasSchema>;

/** Engine tuning knobs — every number lives here, config-first. */
export const MetaLayerTuningSchema = z
  .object({
    /** Offers on the board after each generation/top-up. */
    boardSize: z.number().int().positive(),
    /** Max fraction of the risk-band width the scout report can remove. */
    scoutNarrowingMax: z.number().min(0).max(1),
    /** Fail-chance added when attempting Underprepared. */
    underpreparedFailPenalty: z.number().min(0).max(1),
    /** Fail-chance removed when Over-qualified. */
    overQualifiedFailBonus: z.number().min(0).max(1),
    /**
     * partyPower = Σstats + powerPerCapability × |capabilities|.
     * Over-qualified when power ≥ overQualifiedPower[tier].
     */
    powerPerCapability: z.number().min(0),
    overQualifiedPower: z
      .object({
        t1: z.number().min(0),
        t2: z.number().min(0),
        t3: z.number().min(0),
      })
      .strict(),
    /** Harm-rate multiplier applied on epic-fail outcomes. */
    epicFailHarmScale: z.number().min(1),
    /** Graduated outcome thresholds on the final fail-chance roll. */
    outcomeTable: z
      .object({
        epicFailBelow: z.number().min(0).max(1),
        bigWinAbove: z.number().min(0).max(1),
        almostBelow: z.number().min(0).max(1),
      })
      .strict(),
  })
  .strict();
export type MetaLayerTuning = z.infer<typeof MetaLayerTuningSchema>;

/** Root config artifact. */
export const MetaLayerConfigSchema = z
  .object({
    version: z.literal(1),
    tuning: MetaLayerTuningSchema,
    families: z.array(FamilyDefSchema).min(1),
    clocks: z.array(ClockDefSchema),
    capabilityTags: z.array(z.string().min(1)),
    offers: z.array(OfferDefSchema).min(1),
    milestones: z.array(MilestoneNodeSchema),
    /** Qualities present at tick 0 (initial world state). */
    initialQualities: z.array(QualityDeltaSchema),
  })
  .strict();
export type MetaLayerConfig = z.infer<typeof MetaLayerConfigSchema>;
