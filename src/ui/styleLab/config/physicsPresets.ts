import { z } from 'zod';

/** Unique identifiers for supported Physics Lab presets. */
export const PhysicsPresetIdSchema = z.enum([
  'minimalFrontier',
  'obsidianVault',
  'blizzardRift',
]);

/** Inferred union of preset identifiers. */
export type PhysicsPresetId = z.infer<typeof PhysicsPresetIdSchema>;

/** Eligible cursor trail styles for the Physics Lab micro-app. */
export const CursorTrailSchema = z.enum(['ember', 'aether', 'frost']);

/** Eligible cursor preset styles for PL-FX implementation. */
export const CursorPresetSchema = z.enum(['gauntlet', 'arcaneWand', 'sword']);

/** Eligible FX profile identifiers used for future PL-FX hooks. */
export const FxProfileIdSchema = z.enum(['gildedObservatory', 'obsidianPulse', 'blizzardVeil']);

/** Schema describing the slot glow configuration. */
export const SlotGlowSchema = z.object({
  /** Base glow intensity applied to the slot highlight. */
  intensity: z.number().min(0).max(1),
  /** Additional chroma multiplier for accent color blending. */
  chroma: z.number().min(0).max(1),
});

/** Schema describing the cursor trail configuration. */
export const CursorProfileSchema = z.object({
  /** Visual style for the cursor trail. */
  trail: CursorTrailSchema,
  /** Velocity multiplier applied to parallax offsets. */
  velocityScale: z.number().min(0.1).max(5),
  /** Whether to display ember particles on drag. */
  emittersEnabled: z.boolean(),
  /** Cursor preset configuration for PL-FX */
  preset: CursorPresetSchema,
  /** Trail length multiplier */
  trailLength: z.number().min(0.5).max(3),
  /** Glow intensity multiplier */
  glowIntensity: z.number().min(0).max(1),
  /** Easing function for cursor movement */
  easing: z.enum(['linear', 'ease-out', 'ease-in-out', 'bounce']),
});

/** Schema describing FX profile metadata. */
export const FxProfileSchema = z.object({
  /** Identifier consumed by upcoming PL-FX hooks. */
  id: FxProfileIdSchema,
  /** Density multiplier for ambient particles. */
  particleDensity: z.number().min(0).max(1),
  /** Strength applied to vignette overlays. */
  vignetteStrength: z.number().min(0).max(1),
  /** Particle engine configuration */
  particleEngine: z.object({
    /** Particle density multiplier (0-1) */
    density: z.number().min(0).max(1),
    /** Particle lifetime in milliseconds */
    lifetime: z.number().min(100).max(5000),
    /** Particle color as hex string */
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    /** Draw mode for particles */
    drawMode: z.enum(['points', 'lines', 'triangles']),
  }),
  /** Performance mode flag */
  performanceMode: z.boolean(),
});

/** Schema describing audio profile metadata for PL-AUD integration. */
export const AudioProfileSchema = z.object({
  /** Sound pack selection for audio cues. */
  soundPack: z.enum(['gilded', 'obsidian', 'blizzard']),
  /** Master volume level (0-1). */
  masterVolume: z.number().min(0).max(1),
  /** Maximum concurrent audio cues. */
  maxConcurrentCues: z.number().min(1).max(8),
  /** Audio ducking configuration. */
  ducking: z.object({
    enabled: z.boolean(),
    amount: z.number().min(0).max(1),
    fadeTimeMs: z.number().min(10).max(500),
  }),
});

/** Schema describing metadata persisted with each preset. */
export const PhysicsPresetMetadataSchema = z.object({
  /** Human readable description shown in the UI. */
  summary: z.string(),
  /** Optional Guardian evidence hash attached via usePhysicsLabSync. */
  lastEvidenceHash: z.string().optional(),
});

/** Core schema describing a Physics Lab preset. */
export const PhysicsPresetSchema = z.object({
  id: PhysicsPresetIdSchema,
  label: z.string(),
  description: z.string(),
  liftScale: z.number().min(0.8).max(1.5),
  spring: z.object({
    stiffness: z.number().min(10).max(800),
    tiltIntensity: z.number().min(0).max(45),
  }),
  mass: z.number().min(0.1).max(10),
  damping: z.object({
    coefficient: z.number().min(0).max(120),
    friction: z.number().min(0).max(1),
  }),
  buttonSquash: z.number().min(0.6).max(1),
  slotGlow: SlotGlowSchema,
  cursor: CursorProfileSchema,
  fxProfile: FxProfileSchema,
  audioProfile: AudioProfileSchema,
  metadata: PhysicsPresetMetadataSchema,
});

/** Type inferred from the PhysicsPreset schema. */
export type PhysicsPreset = z.infer<typeof PhysicsPresetSchema>;

/** Record schema for validating persisted preset maps. */
export const PhysicsPresetMapSchema = z.record(PhysicsPresetIdSchema, PhysicsPresetSchema);

/**
 * Default preset map anchoring the micro-app to three ritual sets.
 *
 * The values were ported from physics-lab.html and tuned to match
 * Minimal Frontier, Obsidian Vault, and Blizzard Rift aesthetics.
 */
export const physicsPresets: Record<PhysicsPresetId, PhysicsPreset> = {
  minimalFrontier: {
    id: 'minimalFrontier',
    label: 'Minimal Frontier',
    description: 'Baseline Wanderlust feel with balanced lift and glow.',
    liftScale: 1.08,
    spring: {
      stiffness: 180,
      tiltIntensity: 8,
    },
    mass: 1.2,
    damping: {
      coefficient: 22,
      friction: 0.32,
    },
    buttonSquash: 0.94,
    slotGlow: {
      intensity: 0.6,
      chroma: 0.42,
    },
    cursor: {
      trail: 'ember',
      velocityScale: 1.2,
      emittersEnabled: true,
      preset: 'gauntlet',
      trailLength: 1.5,
      glowIntensity: 0.7,
      easing: 'ease-out',
    },
    fxProfile: {
      id: 'gildedObservatory',
      particleDensity: 0.45,
      vignetteStrength: 0.35,
      particleEngine: {
        density: 0.4,
        lifetime: 2000,
        color: '#c8a030',
        drawMode: 'points',
      },
      performanceMode: false,
    },
    audioProfile: {
      soundPack: 'gilded',
      masterVolume: 0.8,
      maxConcurrentCues: 4,
      ducking: {
        enabled: true,
        amount: 0.3,
        fadeTimeMs: 100,
      },
    },
    metadata: {
      summary: 'Default control rig tuned for Minimal Frontier ritual set.',
    },
  },
  obsidianVault: {
    id: 'obsidianVault',
    label: 'Obsidian Vault',
    description: 'Heavier drag feel with deep slot glow and subdued lift.',
    liftScale: 1.02,
    spring: {
      stiffness: 260,
      tiltIntensity: 5,
    },
    mass: 2.3,
    damping: {
      coefficient: 36,
      friction: 0.48,
    },
    buttonSquash: 0.9,
    slotGlow: {
      intensity: 0.78,
      chroma: 0.3,
    },
    cursor: {
      trail: 'aether',
      velocityScale: 0.9,
      emittersEnabled: false,
      preset: 'arcaneWand',
      trailLength: 2.0,
      glowIntensity: 0.5,
      easing: 'ease-in-out',
    },
    fxProfile: {
      id: 'obsidianPulse',
      particleDensity: 0.32,
      vignetteStrength: 0.55,
      particleEngine: {
        density: 0.3,
        lifetime: 3000,
        color: '#4a5568',
        drawMode: 'lines',
      },
      performanceMode: false,
    },
    audioProfile: {
      soundPack: 'obsidian',
      masterVolume: 0.7,
      maxConcurrentCues: 3,
      ducking: {
        enabled: true,
        amount: 0.4,
        fadeTimeMs: 150,
      },
    },
    metadata: {
      summary: 'Dense tactile rig inspired by Obsidian preset typography.',
    },
  },
  blizzardRift: {
    id: 'blizzardRift',
    label: 'Blizzard Rift',
    description: 'Ultra-responsive, low-mass profile with icy cursor trails.',
    liftScale: 1.16,
    spring: {
      stiffness: 120,
      tiltIntensity: 12,
    },
    mass: 0.8,
    damping: {
      coefficient: 14,
      friction: 0.18,
    },
    buttonSquash: 0.97,
    slotGlow: {
      intensity: 0.52,
      chroma: 0.68,
    },
    cursor: {
      trail: 'frost',
      velocityScale: 1.5,
      emittersEnabled: true,
      preset: 'sword',
      trailLength: 1.0,
      glowIntensity: 0.8,
      easing: 'linear',
    },
    fxProfile: {
      id: 'blizzardVeil',
      particleDensity: 0.62,
      vignetteStrength: 0.28,
      particleEngine: {
        density: 0.6,
        lifetime: 1500,
        color: '#e0f2fe',
        drawMode: 'triangles',
      },
      performanceMode: false,
    },
    audioProfile: {
      soundPack: 'blizzard',
      masterVolume: 0.9,
      maxConcurrentCues: 5,
      ducking: {
        enabled: false,
        amount: 0.2,
        fadeTimeMs: 80,
      },
    },
    metadata: {
      summary: 'High-lift experiment for Blizzard ritual references.',
    },
  },
};

/** Default preset identifier consumed by the Physics Lab hook. */
export const DEFAULT_PHYSICS_PRESET_ID: PhysicsPresetId = 'minimalFrontier';

/** Default preset instance used when persistence has no data. */
export const DEFAULT_PHYSICS_PRESET = physicsPresets[DEFAULT_PHYSICS_PRESET_ID];
