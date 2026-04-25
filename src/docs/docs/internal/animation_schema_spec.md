# Animation Schema Specification

## Scope
Define il formato config-first per animazioni sprite 2D nel Tactical/Idle workflow. Lo schema deve:
- Vivere in `src/balancing/config/idleVillage/animation.ts` (single source of truth).
- Essere validato via Zod (`src/balancing/config/schemas/idleVillageAnimations.ts`).
- Supportare applicazioni multiple (unit, spell, creature) riusando clip/atlases condivisi.

## Top-Level Structure
```ts
export interface IdleVillageAnimationConfig {
  version: string;
  atlases: Record<string, AnimationAtlasDefinition>;
  clips: Record<string, AnimationClipDefinition>;
  applications: AnimationApplicationDefinition[];
}
```

### AnimationAtlasDefinition
```ts
interface AnimationAtlasDefinition {
  id: string;            // es. "mage_idle_v1"
  source: 'scenario-seedance' | 'scenario-pixverse' | 'manual' | 'lottie';
  texture: string;       // path relativo in assets (png/webp)
  metadata: string;      // path JSON con frame data
  frameSize: { width: number; height: number };
  fps: number;           // default playback
  colorProfile?: 'gilded-observatory' | 'custom';
  notes?: string;
}
```

### AnimationClipDefinition
```ts
interface AnimationClipDefinition {
  id: string;                // es. "mage_idle_loop"
  atlasId: string;           // FK verso atlases
  frames: number[];          // indici frame o durata custom
  playback: {
    fps?: number;            // override se diverso dall'atlas
    loop: boolean;
    blendPriority: 'idle' | 'move' | 'attack' | 'hit' | 'system';
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
  tags: string[];            // es. ['idle', 'mage', 'teal']
  metadata?: Record<string, unknown>;
}
```

### AnimationApplicationDefinition
```ts
interface AnimationApplicationDefinition {
  id: string;                 // unique per unit/verb
  entityType: 'unit' | 'spell' | 'effect';
  entityId: string;           // es. "founder_magus"
  clips: {
    idle: string;             // clipId
    move?: string;
    attack?: string;
    hit?: string;
    custom?: Record<string, string>; // es. { cast: 'mage_cast_v1' }
  };
  blendRules?: {
    interruptible: string[];  // clip ids che possono interrompere idle
    autoReturnToIdle: boolean;
    transitionMs: number;
  };
  deterministicSeed?: number; // per RNG legato a VFX sync
  notes?: string;
}
```

## Zod Schema Skeleton
```ts
const animationAtlasDefinitionSchema = z.object({
  id: z.string().min(1),
  source: z.enum(['scenario-seedance', 'scenario-pixverse', 'manual', 'lottie']),
  texture: z.string().min(1),
  metadata: z.string().min(1),
  frameSize: z.object({ width: z.number().positive(), height: z.number().positive() }),
  fps: z.number().positive(),
  colorProfile: z.enum(['gilded-observatory', 'custom']).optional(),
  notes: z.string().optional(),
});

const animationClipDefinitionSchema = z.object({
  id: z.string().min(1),
  atlasId: z.string().min(1),
  frames: z.array(z.number().int().nonnegative()).min(1),
  playback: z.object({
    fps: z.number().positive().optional(),
    loop: z.boolean(),
    blendPriority: z.enum(['idle', 'move', 'attack', 'hit', 'system']),
    easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']).optional(),
  }),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

const animationApplicationDefinitionSchema = z.object({
  id: z.string().min(1),
  entityType: z.enum(['unit', 'spell', 'effect']),
  entityId: z.string().min(1),
  clips: z.object({
    idle: z.string().min(1),
    move: z.string().min(1).optional(),
    attack: z.string().min(1).optional(),
    hit: z.string().min(1).optional(),
    custom: z.record(z.string().min(1)).optional(),
  }),
  blendRules: z.object({
    interruptible: z.array(z.string()).default([]),
    autoReturnToIdle: z.boolean().default(true),
    transitionMs: z.number().int().nonnegative().default(120),
  }).optional(),
  deterministicSeed: z.number().int().optional(),
  notes: z.string().optional(),
});

export const idleVillageAnimationConfigSchema = z.object({
  version: z.string().min(1),
  atlases: z.record(animationAtlasDefinitionSchema),
  clips: z.record(animationClipDefinitionSchema),
  applications: z.array(animationApplicationDefinitionSchema),
});
```

## Integration Plan
1. **Config file**: `src/balancing/config/idleVillage/animation.ts` esporta `IDLE_VILLAGE_ANIMATION_CONFIG` conforme all'interfaccia.
2. **Schema**: salvare lo snippet Zod in `src/balancing/config/schemas/idleVillageAnimations.ts` e riutilizzarlo in store/persistence.
3. **Hook**: `useIdleVillageConfig` esteso per fornire `animations` e caching.
4. **Runtime**: IdleVillage UI/engine leggerà `applications` per associare clip ai verb/residenti e instanziare state machine deterministiche.

_Last updated: 2025-12-17_
