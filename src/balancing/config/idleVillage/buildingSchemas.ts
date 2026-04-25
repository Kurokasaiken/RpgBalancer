import { z } from 'zod';

/**
 * Canonical schema describing how Idle Village building definitions are validated.
 */
export const BuildingDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isInitiallyBuilt: z.boolean(),
  bonuses: z.object({
    fatigueReductionPerDay: z.number().optional(),
    jobRewardMultiplier: z.number().optional(),
    questInjuryChanceReduction: z.number().optional(),
  }).optional(),
  level: z.number().int().min(1).optional(),
  maxLevel: z.number().int().min(1).optional(),
  upgrades: z.array(z.object({
    level: z.number().int().min(1),
    costs: z.record(z.string(), z.number()).optional(),
    notes: z.string().optional(),
  })).optional(),
  icon: z.string().optional(),
  colorClass: z.string().optional(),
});
