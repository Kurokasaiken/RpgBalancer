// src/balancing/config/idleVillage/schemas.ts
// Zod schemas for IdleVillageConfig. These validate the config shape
// without enforcing any specific domain content (no fixed job/quest lists).

import { z } from 'zod';
import { BuildingDefinitionSchema } from './buildingSchemas';

export const ResourceDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  colorClass: z.string().optional(),
  isCore: z.boolean().optional(),
});

export const ResourceDeltaDefinitionSchema = z.object({
  resourceId: z.string().min(1),
  amountFormula: z.string().min(1),
});

export const ActivityDefinitionSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    slotTags: z.array(z.string()).default([]),
    resolutionEngineId: z.string().min(1),
    level: z.number().int().min(1).optional(),
    dangerRating: z.number().min(0).optional(),
    durationFormula: z.string().optional(),
    travelTimeToFormula: z.string().optional(),
    travelTimeFromFormula: z.string().optional(),
    costs: z.array(ResourceDeltaDefinitionSchema).optional(),
    rewards: z.array(ResourceDeltaDefinitionSchema).optional(),
    baseXpFormula: z.string().optional(),
    allowedDifficultyCategoryIds: z.array(z.string()).optional(),
    allowedRewardCategoryIds: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  });

export const ActivityRollCategorySchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    description: z.string().optional(),
    colorClass: z.string().optional(),
    icon: z.string().optional(),
    tooltip: z.string().optional(),
    minMultiplier: z.number(),
    maxMultiplier: z.number(),
    weight: z.number(),
  })
  .refine(
    (data) => data.minMultiplier <= data.maxMultiplier,
    { message: 'minMultiplier must be <= maxMultiplier', path: ['minMultiplier'] },
  );

export const ActivityVarianceConfigSchema = z.object({
  difficultyCategories: z.record(z.string(), ActivityRollCategorySchema),
  rewardCategories: z.record(z.string(), ActivityRollCategorySchema),
});

export const MapSlotDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  x: z.number(),
  y: z.number(),
  slotTags: z.array(z.string()).default([]),
  isInitiallyUnlocked: z.boolean(),
  unlockConditionIds: z.array(z.string()).optional(),
});

export const FounderPresetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  archetypeId: z.string().min(1),
  difficultyTag: z.string().min(1),
  statAdjustmentFormula: z.string().optional(),
});

export const GlobalRulesSchema = z.object({
  maxFatigueBeforeExhausted: z.number(),
  fatigueRecoveryPerDay: z.number(),
  dayLengthInTimeUnits: z.number(),
  fatigueYellowThreshold: z.number(),
  fatigueRedThreshold: z.number(),
  baseLightInjuryChanceAtMaxFatigue: z.number(),
  dangerInjuryMultiplierPerPoint: z.number(),
  questXpFormula: z.string().min(1),
  maxActiveQuests: z.number().int().min(0),
  defaultRandomSeed: z.number().optional(),
});

export const IdleVillageConfigSchema = z.object({
  version: z.string().min(1),
  resources: z.record(z.string(), ResourceDefinitionSchema),
  activities: z.record(z.string(), ActivityDefinitionSchema),
  mapSlots: z.record(z.string(), MapSlotDefinitionSchema),
  buildings: z.record(z.string(), BuildingDefinitionSchema),
  founders: z.record(z.string(), FounderPresetSchema),
  variance: ActivityVarianceConfigSchema,
  globalRules: GlobalRulesSchema,
});

export type IdleVillageConfigSchemaType = z.infer<typeof IdleVillageConfigSchema>;
