import { z } from 'zod';

export const warningConfigSchema = z.object({
  lowFoodThreshold: z.number(),
  highFatigueThreshold: z.number(),
  warningInterval: z.number(),
});

export type WarningConfig = z.infer<typeof warningConfigSchema>;