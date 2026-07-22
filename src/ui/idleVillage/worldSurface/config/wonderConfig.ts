```typescript
import { z } from 'zod';

const WONDER_TYPES = z.enum(['Kraken', 'Whale', 'Dragon', 'Meteor', 'Aurora', 'Ghost Ship', 'Massive Storm', 'Flock of Birds']);

const wonderConfigSchema = z.object({
  type: WONDER_TYPES,
  interval: z.number().min(10).max(45),
  duration: z.number().min(2).max(20),
  biome: z.string(),
});

export { WONDER_TYPES, wonderConfigSchema };