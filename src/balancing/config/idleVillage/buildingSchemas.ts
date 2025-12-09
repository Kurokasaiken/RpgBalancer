import { z } from 'zod';

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
  icon: z.string().optional(),
  colorClass: z.string().optional(),
});
