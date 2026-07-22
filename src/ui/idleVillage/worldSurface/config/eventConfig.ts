```typescript
import { z } from 'zod';

export const WorldEventType = z.enum(['natural', 'manmade']);
export const EventPhase = z.enum(['presage', 'threat', 'event', 'consequence']);

export const eventConfig = {
  WORLD_EVENT_TYPES: WorldEventType,
  EVENT_PHASE_DURATIONS: {
    presage: 5 * 60 * 1000, // 5 minutes
    threat: 1 * 60 * 1000, // 1 minute
    event: 5 * 60 * 1000, // 5 minutes
    consequence: 10 * 60 * 1000, // 10 minutes
  },
};

export default eventConfig;