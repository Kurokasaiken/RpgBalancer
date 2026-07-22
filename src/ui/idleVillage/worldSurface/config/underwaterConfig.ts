```typescript
import { z } from 'zod';

const underwaterConfigSchema = z.object({
  // TODO: Define underwater config schema
});

const UNDERWATER_CONFIG = underwaterConfigSchema.parse({
  // TODO: Define default underwater config values
});

export default UNDERWATER_CONFIG;