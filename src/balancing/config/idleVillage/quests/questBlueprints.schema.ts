/**
 * Quest Blueprint Schema Module
 * -----------------------------
 * Provides strongly typed Zod schemas + TS types for Quest Blueprint authoring.
 * Designers should rely on these helpers to keep quest data config-first, reusable,
 * and validated at build time.
 */

import { z } from 'zod';

import { ResourceDeltaDefinitionSchema, StatRequirementSchema } from '../schemas';

/** Valid quest phase types aligned with Quest Chronicle + engine modules. */
export const QUEST_PHASE_TYPE_IDS = [
  'check',
  'fight',
  'stealth',
  'trap',
  'explore',
  'dialogue',
  'branch',
  'timedChoice',
] as const;

/** Allowed units for phase duration so engines can translate consistently. */
export const QUEST_DURATION_UNITS = ['ticks', 'hours', 'days'] as const;

/** Difficulty scale shared across design docs to describe quest danger bands. */
export const QUEST_DIFFICULTY_LEVELS = ['story', 'skirmish', 'dangerous', 'heroic'] as const;

const PhaseEffectSchema = z.object({
  /** Optional resource deltas applied when the effect resolves. */
  resources: z.array(ResourceDeltaDefinitionSchema).optional(),
  /** Map of reputation track deltas keyed by faction id. */
  reputation: z.record(z.string(), z.number()).optional(),
  /** Activities unlocked for scheduling after this effect. */
  unlockActivityIds: z.array(z.string()).optional(),
  /** Free-form notes for designers / UI overlays. */
  notes: z.string().optional(),
});

const PhaseCopySchema = z.object({
  summary: z.string().min(1),
  narrative: z.string().min(1),
  callToAction: z.string().optional(),
});

const RiskProfileSchema = z.object({
  injuryChance: z.number().min(0).max(100),
  deathChance: z.number().min(0).max(100),
  fatigueCost: z.number().min(0).optional(),
  threatLabel: z.string().optional(),
});

const TelemetrySettingsSchema = z.object({
  eventId: z.string().min(1),
  enabled: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

const PhaseRequirementsSchema = z.object({
  statRequirement: StatRequirementSchema.optional(),
  encounterId: z.string().optional(),
  skillCheckId: z.string().optional(),
  materials: z.array(ResourceDeltaDefinitionSchema).optional(),
  custom: z.record(z.string(), z.unknown()).optional(),
});

export const QuestPhaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(QUEST_PHASE_TYPE_IDS),
  durationValue: z.number().positive(),
  durationUnits: z.enum(QUEST_DURATION_UNITS),
  requirements: PhaseRequirementsSchema.optional(),
  successEffects: PhaseEffectSchema.optional(),
  failureEffects: PhaseEffectSchema.optional(),
  copy: PhaseCopySchema,
  icon: z.string().optional(),
  telemetryTags: z.array(z.string()).optional(),
  riskProfile: RiskProfileSchema.optional(),
});

export const QuestBlueprintSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  activityId: z.string().min(1),
  slotId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(QUEST_DIFFICULTY_LEVELS).default('story'),
  narrative: z.string().optional(),
  icon: z.string().optional(),
  rewards: z
    .object({
      resources: z.array(ResourceDeltaDefinitionSchema).optional(),
      items: z.record(z.string(), z.number()).optional(),
      unlockActivityIds: z.array(z.string()).optional(),
      reputation: z.record(z.string(), z.number()).optional(),
    })
    .default({}),
  telemetry: TelemetrySettingsSchema,
  phases: z.array(QuestPhaseSchema).min(1),
});

export const QuestBlueprintsSchema = z.record(z.string(), QuestBlueprintSchema);

export type QuestPhase = z.infer<typeof QuestPhaseSchema>;
export type QuestBlueprint = z.infer<typeof QuestBlueprintSchema>;

/**
 * ANTICIPATED QUESTIONS
 * ---------------------
 * Q: How do we attach future callbacks (e.g. branching)?
 * A: Use the `custom` payload inside `requirements` for module-specific data; future schema
 *    revisions can extend the Zod object without breaking existing configs.
 * Q: Where do we flag experimental telemetry tags?
 * A: `telemetry.tags` is a simple array; experiments can append IDs without changing the schema.
 */
