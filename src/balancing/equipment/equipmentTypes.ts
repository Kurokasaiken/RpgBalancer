/**
 * Canonical equipment type definitions for the Balancer.
 *
 * Equipment follows the same weight-based creator pattern as spells:
 * each stat is edited via configurable ticks { value, weight }.
 */

import { z } from 'zod';

export const EquipmentTypeSchema = z.enum([
  'weapon',
  'armor',
  'offhand',
  'trinket',
  'ring',
  'mount',
]);

export const EquipmentRaritySchema = z.enum([
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'poor',
  'masterpiece',
]);

export type EquipmentType = z.infer<typeof EquipmentTypeSchema>;
export type EquipmentRarity = z.infer<typeof EquipmentRaritySchema>;

export const EquipmentStatTickSchema = z.object({
  value: z.number(),
  weight: z.number(),
});

export const EquipmentTypeConfigSchema = z.object({
  slot: z.string(),
  grantedSkillIds: z.array(z.string()).default([]),
  unlockedStats: z.array(z.string()),
  baseline: z.record(z.number()).default({}),
});

export const EquipmentRarityConfigSchema = z.object({
  label: z.string(),
  extraPoints: z.number(),
});

export const EquipmentBalancingConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  baseBudget: z.number().default(10),
  /** Weights for each equip stat relative to HP equivalent. */
  weights: z.record(z.number()).default({}),
  /** Default ticks per stat when no override exists. */
  defaultTicks: z.record(z.array(EquipmentStatTickSchema)).default({}),
  /** Per-stat ranges used to generate default ticks. */
  ranges: z
    .record(
      z.object({
        min: z.number(),
        max: z.number(),
        step: z.number(),
        tickCount: z.number().default(5),
      })
    )
    .default({}),
  descriptions: z.record(z.string()).default({}),
  types: z.record(EquipmentTypeConfigSchema).default({}),
  rarities: z.record(EquipmentRarityConfigSchema).default({}),
});

export type EquipmentStatTick = z.infer<typeof EquipmentStatTickSchema>;
export type EquipmentTypeConfig = z.infer<typeof EquipmentTypeConfigSchema>;
export type EquipmentRarityConfig = z.infer<typeof EquipmentRarityConfigSchema>;
export type EquipmentBalancingConfig = z.infer<typeof EquipmentBalancingConfigSchema>;

export const EquipmentItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: EquipmentTypeSchema,
  slot: z.string(),
  rarity: EquipmentRaritySchema,
  stats: z.record(z.number()).default({}),
  grantedSkillIds: z.array(z.string()).default([]),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type EquipmentItem = z.infer<typeof EquipmentItemSchema>;
