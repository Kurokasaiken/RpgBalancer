import { z } from 'zod';

export const StatDefinitionSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'ID must start with letter and contain only letters, numbers, underscores'),
  label: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  type: z.enum(['number', 'percentage']),
  min: z.number(),
  max: z.number(),
  step: z.number().positive(),
  defaultValue: z.number(),
  weight: z.number(),
  isCore: z.boolean(),
  isDerived: z.boolean(),
  formula: z.string().optional(),
  bgColor: z.string().optional(),
})
  .refine((d) => d.min <= d.max, { message: 'min must be <= max', path: ['min'] })
  .refine((d) => d.defaultValue >= d.min && d.defaultValue <= d.max, {
    message: 'defaultValue must be within min/max range',
    path: ['defaultValue'],
  })
  .refine((d) => !d.isDerived || !!d.formula, {
    message: 'Derived stats must have a formula',
    path: ['formula'],
  });

export const CardDefinitionSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  title: z.string().min(1).max(50),
  color: z.string(),
  icon: z.string().optional(),
  statIds: z.array(z.string()),
  isCore: z.boolean(),
  order: z.number().int().min(0),
});

export const BalancerPresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  description: z.string().max(200),
  weights: z.record(z.string(), z.number()),
  isBuiltIn: z.boolean(),
  createdAt: z.string(),
  modifiedAt: z.string(),
});

export const BalancerConfigSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  stats: z.record(z.string(), StatDefinitionSchema),
  cards: z.record(z.string(), CardDefinitionSchema),
  presets: z.record(z.string(), BalancerPresetSchema),
  activePresetId: z.string(),
});
