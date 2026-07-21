import { z } from 'zod';

export const EngineConfigSchema = z.object({
  evaluationOrder: z.array(z.string()),
  maxStackDepth: z.number(),
  enableTelemetry: z.boolean(),
});

export const defaultEngineConfig: z.infer<typeof EngineConfigSchema> = {
  evaluationOrder: ['scope', 'priority', 'duration'],
  maxStackDepth: 50,
  enableTelemetry: true,
};

export const EngineConfig = {
  schema: EngineConfigSchema,
  default: defaultEngineConfig,
};