import { z } from 'zod';

export const StackConfigSchema = z.object({
  cleanupInterval: z.number(),
  maxDuration: z.number(),
  conflictResolution: z.string(),
});

export const defaultStackConfig: z.infer<typeof StackConfigSchema> = {
  cleanupInterval: 1000,
  maxDuration: 3600000,
  conflictResolution: 'override',
};

export const StackConfig = {
  schema: StackConfigSchema,
  default: defaultStackConfig,
};