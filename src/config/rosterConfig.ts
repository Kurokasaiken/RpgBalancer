import { z } from 'zod';

export const rosterConfigSchema = z.object({
  maxWorkers: z.number(),
  showWarnings: z.boolean(),
  enableDragPrep: z.boolean(),
});

export type RosterConfig = z.infer<typeof rosterConfigSchema>;