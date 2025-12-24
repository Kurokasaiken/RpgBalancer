// src/balancing/config/idleVillage/schemas.ts
// Zod schemas for IdleVillageConfig. These validate the config shape
// without enforcing any specific domain content (no fixed job/quest lists).

import { z } from 'zod';
import { BuildingDefinitionSchema } from './buildingSchemas';
import { APP_NAV_TAB_IDS, type AppNavTabId } from '@/shared/navigation/navConfig';

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

export const StatRequirementSchema = z.object({
  allOf: z.array(z.string()).optional(),
  anyOf: z.array(z.string()).optional(),
  noneOf: z.array(z.string()).optional(),
  label: z.string().optional(),
});

const SlotModifierSchema = z.object({
  fatigueMult: z.number().optional(),
  riskMult: z.number().optional(),
  yieldMult: z.number().optional(),
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
    statRequirement: StatRequirementSchema.optional(),
    allowedDifficultyCategoryIds: z.array(z.string()).optional(),
    allowedRewardCategoryIds: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    maxSlots: z.union([z.number().int().min(1), z.literal('infinite')]).optional(),
    slotModifiers: z.record(z.string(), SlotModifierSchema).optional(),
  });



export const PassiveEffectDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  verbToneId: z.string().optional(),
  slotId: z.string().optional(),
  slotTags: z.array(z.string()).optional(),
  timeUnitsBetweenTicks: z.number().optional(),
  frequencyFormula: z.string().optional(),
  resourceDeltas: z.array(ResourceDeltaDefinitionSchema).optional(),
  statRequirements: StatRequirementSchema.optional(),
  unlockConditionIds: z.array(z.string()).optional(),
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

export const InjuryTierDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  recoveryTimeInDays: z.number().int().min(1),
  jobEfficiencyMultiplier: z.number().optional(),
  questEligibility: z.enum(['full', 'limited', 'none']).optional(),
  fatigueGainMultiplier: z.number().optional(),
  colorClass: z.string().optional(),
});

export const DeathRulesSchema = z.object({
  baseDeathChanceAtMaxDanger: z.number().min(0),
  dangerDeathMultiplierPerPoint: z.number().min(0),
  injuryTierMultipliers: z.record(z.string(), z.number().min(0)).optional(),
  questOutcomeAdjustments: z.record(z.string(), z.number()).optional(),
  starvationDeathChancePerDay: z.number().min(0).max(1).optional(),
});

export const MapLayoutDefinitionSchema = z.object({
  pixelWidth: z.number().positive(),
  pixelHeight: z.number().positive(),
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
  icon: z.string().optional(),
  colorClass: z.string().optional(),
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
  secondsPerTimeUnit: z.number().optional(),
  fatigueYellowThreshold: z.number(),
  fatigueRedThreshold: z.number(),
  baseLightInjuryChanceAtMaxFatigue: z.number(),
  dangerInjuryMultiplierPerPoint: z.number(),
  injuryTiers: z.record(z.string(), InjuryTierDefinitionSchema),
  deathRules: DeathRulesSchema.optional(),
  foodConsumptionPerResidentPerDay: z.number(),
  baseFoodPriceInGold: z.number(),
  startingResources: z.record(z.string(), z.number()).optional(),
  questXpFormula: z.string().min(1),
  maxActiveQuests: z.number().int().min(0),
  questSpawnEveryNDays: z.number().int().min(1),
  maxGlobalQuestOffers: z.number().int().min(0),
  maxQuestOffersPerSlot: z.number().int().min(0),
  verbToneColors: z
    .object({
      neutral: z.string().optional(),
      job: z.string().optional(),
      quest: z.string().optional(),
      danger: z.string().optional(),
      system: z.string().optional(),
    })
    .optional(),
  defaultRandomSeed: z.number().optional(),
});

export const OverlayWidgetSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
  order: z.number().int().min(0),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const OverlaySettingsSchema = z.object({
  enabled: z.boolean(),
  defaultPosition: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  defaultSize: z.enum(['compact', 'medium', 'wide']),
  defaultZoom: z.number().min(0.5).max(2.0),
  alwaysOnTop: z.boolean(),
  transparency: z.boolean(),
  enabledWidgets: z.array(OverlayWidgetSchema),
  autoHideTimeoutSeconds: z.number().int().min(0),
  showSystemTrayIcon: z.boolean(),
});



const AppNavTabIdSchema = z.custom<AppNavTabId>(
  (val) => typeof val === 'string' && (APP_NAV_TAB_IDS as readonly string[]).includes(val),
  { message: 'Unknown app navigation tab id' }
);

export const IdleVillageUiPreferencesSchema = z.object({
  defaultAppTabId: AppNavTabIdSchema.optional(),
});



export const IdleVillageConfigSchema = z.object({
  version: z.string().min(1),
  resources: z.record(z.string(), ResourceDefinitionSchema),
  activities: z.record(z.string(), ActivityDefinitionSchema),
  mapSlots: z.record(z.string(), MapSlotDefinitionSchema),
  mapLayout: MapLayoutDefinitionSchema.optional(),
  passiveEffects: z.record(z.string(), PassiveEffectDefinitionSchema), // Added
  buildings: z.record(z.string(), BuildingDefinitionSchema),
  founders: z.record(z.string(), FounderPresetSchema),
  variance: ActivityVarianceConfigSchema,
  globalRules: GlobalRulesSchema,
  overlaySettings: OverlaySettingsSchema,
  uiPreferences: IdleVillageUiPreferencesSchema.optional(),
});

export type IdleVillageConfigSchemaType = z.infer<typeof IdleVillageConfigSchema>;
