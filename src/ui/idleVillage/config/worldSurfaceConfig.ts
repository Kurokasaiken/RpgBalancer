import { z } from 'zod';

/**
 * Zod schemas and TypeScript types for the World Surface Runtime.
 *
 * The manifest is the single source of truth for a world variant: layers,
 * parallax, visual states, anchors, regions and camera bounds.
 */

export const AssetResolutionPolicySchema = z.enum([
  'runtime_only',
  'prefer_hd',
  'adaptive',
]);

export const AssetPolicySchema = z.object({
  resolution: AssetResolutionPolicySchema,
});

export const Vector2Schema = z.object({
  x: z.number(),
  y: z.number(),
});

export const BoundsSchema = z.object({
  minX: z.number(),
  maxX: z.number(),
  minY: z.number(),
  maxY: z.number(),
});

export const SizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export const CoordinateSystemSchema = z.object({
  space: z.enum(['world_pixels', 'viewport_pixels', 'normalized']),
  origin: z.enum(['top_left', 'center', 'bottom_left']),
  unit: z.enum(['px', '%']),
  canvas: SizeSchema,
});

export const ResolutionHintSchema = z.object({
  runtime: SizeSchema,
  source: SizeSchema.optional(),
  scaleTarget: z.number().positive().optional(),
});

export const CameraConfigSchema = z.object({
  minZoom: z.number().positive(),
  maxZoom: z.number().positive(),
  defaultZoom: z.number().positive(),
  panEnabled: z.boolean(),
  zoomEnabled: z.boolean(),
  bounds: BoundsSchema.optional(),
});

export const WorldSurfaceRendererConfigSchema = z.object({
  mode: z.enum(['auto', 'dom', 'webgl']).default('auto'),
  domObjectThreshold: z.number().nonnegative().default(50),
  enableForParticles: z.boolean().default(true),
  enableForShaders: z.boolean().default(true),
  fallbackToDom: z.boolean().default(true),
  imageFit: z.enum(['fill', 'cover', 'contain', 'none']).default('fill'),
  autoFit: z.boolean().default(false),
  webglOptions: z
    .object({
      antialias: z.boolean().optional(),
      backgroundAlpha: z.number().min(0).max(1).optional(),
      resolution: z.number().positive().optional(),
      pixelRatio: z.boolean().optional(),
    })
    .optional(),
});

export type WorldSurfaceRendererConfig = z.infer<typeof WorldSurfaceRendererConfigSchema>;

export const BlendModeSchema = z.enum([
  'normal',
  'multiply',
  'screen',
  'overlay',
  'additive',
]);

export const LayerTypeSchema = z.enum([
  'texture',
  'animated_texture',
  'particle_system',
  'ui_overlay',
]);

export const AnimationModeSchema = z.enum([
  'none',
  'wave',
  'pulse',
  'drift',
]);

export const AnimationImplementationSchema = z.enum([
  'css',
  'transform',
  'shader',
]);

export const AnimationDirectionSchema = z.enum([
  'left',
  'right',
  'up',
  'down',
  'both',
]);

export const LayerAnimationSchema = z.object({
  mode: AnimationModeSchema,
  implementation: AnimationImplementationSchema,
  direction: AnimationDirectionSchema.default('left'),
  speed: z.number().nonnegative().default(0),
  amplitude: z.number().nonnegative().default(0),
});

export const LayerConditionSchema = z.object({
  id: z.string(),
  tint: z.string().optional(),
  blendMode: BlendModeSchema.optional(),
  opacity: z.number().min(0).max(1).optional(),
  grayscale: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

export const ParallaxConfigSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
});

export const WorldSurfaceLayerSchema = z.object({
  id: z.string(),
  file: z.string(),
  type: LayerTypeSchema,
  zIndex: z.number().int(),
  opacity: z.number().min(0).max(1).default(1),
  blendMode: BlendModeSchema.default('normal'),
  scale: z.number().positive().default(1),
  offsetX: z.number().default(0),
  offsetY: z.number().default(0),
  parallax: ParallaxConfigSchema.default({ x: 0, y: 0 }),
  animation: LayerAnimationSchema.default({
    mode: 'none',
    implementation: 'transform',
    direction: 'left',
    speed: 0,
    amplitude: 0,
  }),
  conditions: z.record(z.string(), LayerConditionSchema).default({}),
  tags: z.array(z.string()).default([]),
});

export const OverrideTypeSchema = z.enum([
  'apply_condition',
  'set_visibility',
  'set_opacity',
  'tint_layer',
  'set_animation',
]);

export const WorldSurfaceVisualStateOverrideSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('apply_condition'),
    layerId: z.string(),
    conditionId: z.string(),
  }),
  z.object({
    type: z.literal('set_visibility'),
    layerId: z.string(),
    visible: z.boolean(),
  }),
  z.object({
    type: z.literal('set_opacity'),
    layerId: z.string(),
    opacity: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('tint_layer'),
    layerId: z.string(),
    tint: z.string(),
  }),
  z.object({
    type: z.literal('set_animation'),
    layerId: z.string(),
    animation: LayerAnimationSchema,
  }),
]);

export const VisualStateActivationSchema = z.object({
  condition: z.enum(['event', 'state', 'biome', 'manual']),
  eventId: z.string().optional(),
  state: z.string().optional(),
  biome: z.string().optional(),
});

export const WorldSurfaceVisualStateSchema = z.object({
  id: z.string(),
  labelKey: z.string(),
  base: z.boolean().default(false),
  overrides: z.array(WorldSurfaceVisualStateOverrideSchema).default([]),
  activation: VisualStateActivationSchema.optional(),
});

export const WorldSurfaceRegionSchema = z.object({
  id: z.string(),
  nameKey: z.string(),
  bounds: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  tags: z.array(z.string()).default([]),
});

export const WorldSurfaceAnchorSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  type: z.string(),
  targetId: z.string().optional(),
  labelKey: z.string().optional(),
});

export const WorldSurfaceManifestSchema = z.object({
  version: z.string(),
  world: z.string(),
  variant: z.string(),
  coordinateSystem: CoordinateSystemSchema,
  resolutionHint: ResolutionHintSchema,
  assetPolicy: AssetPolicySchema,
  camera: CameraConfigSchema,
  renderer: WorldSurfaceRendererConfigSchema.optional(),
  surfaceLayers: z.array(WorldSurfaceLayerSchema).default([]),
  atmosphereLayers: z.array(WorldSurfaceLayerSchema).default([]),
  visualStates: z.array(WorldSurfaceVisualStateSchema).default([]),
  regions: z.array(WorldSurfaceRegionSchema).default([]),
  anchors: z.array(WorldSurfaceAnchorSchema).default([]),
  tags: z.array(z.string()).default([]),
});

export type AssetResolutionPolicy = z.infer<typeof AssetResolutionPolicySchema>;
export type AssetPolicy = z.infer<typeof AssetPolicySchema>;
export type Vector2 = z.infer<typeof Vector2Schema>;
export type Bounds = z.infer<typeof BoundsSchema>;
export type Size = z.infer<typeof SizeSchema>;
export type CoordinateSystem = z.infer<typeof CoordinateSystemSchema>;
export type ResolutionHint = z.infer<typeof ResolutionHintSchema>;
export type CameraConfig = z.infer<typeof CameraConfigSchema>;
export type BlendMode = z.infer<typeof BlendModeSchema>;
export type LayerType = z.infer<typeof LayerTypeSchema>;
export type AnimationMode = z.infer<typeof AnimationModeSchema>;
export type AnimationImplementation = z.infer<typeof AnimationImplementationSchema>;
export type AnimationDirection = z.infer<typeof AnimationDirectionSchema>;
export type LayerAnimation = z.infer<typeof LayerAnimationSchema>;
export type LayerCondition = z.infer<typeof LayerConditionSchema>;
export type ParallaxConfig = z.infer<typeof ParallaxConfigSchema>;
export type WorldSurfaceLayer = z.infer<typeof WorldSurfaceLayerSchema>;
export type OverrideType = z.infer<typeof OverrideTypeSchema>;
export type WorldSurfaceVisualStateOverride = z.infer<typeof WorldSurfaceVisualStateOverrideSchema>;
export type VisualStateActivation = z.infer<typeof VisualStateActivationSchema>;
export type WorldSurfaceVisualState = z.infer<typeof WorldSurfaceVisualStateSchema>;
export type WorldSurfaceRegion = z.infer<typeof WorldSurfaceRegionSchema>;
export type WorldSurfaceAnchor = z.infer<typeof WorldSurfaceAnchorSchema>;
export type WorldSurfaceManifest = z.infer<typeof WorldSurfaceManifestSchema>;

export interface RendererSelectionInput {
  objectCount: number;
  hasParticleObjects: boolean;
  hasParticleLayers: boolean;
  hasShaderLayers: boolean;
  webglSupported: boolean;
}

/**
 * Decide whether the World Surface should use the WebGL (Pixi) renderer or the
 * DOM renderer based on config and runtime characteristics.
 */
export function selectWorldSurfaceRenderer(
  config: WorldSurfaceRendererConfig | undefined,
  input: RendererSelectionInput,
): 'dom' | 'webgl' {
  const resolved = config ?? WorldSurfaceRendererConfigSchema.parse({});

  if (resolved.mode === 'dom') {
    return 'dom';
  }

  if (resolved.mode === 'webgl') {
    if (resolved.fallbackToDom && !input.webglSupported) {
      return 'dom';
    }
    return 'webgl';
  }

  if (resolved.enableForShaders && input.hasShaderLayers) {
    if (input.webglSupported || !resolved.fallbackToDom) {
      return 'webgl';
    }
    return 'dom';
  }

  if (resolved.enableForParticles && (input.hasParticleObjects || input.hasParticleLayers)) {
    if (input.webglSupported || !resolved.fallbackToDom) {
      return 'webgl';
    }
    return 'dom';
  }

  if (input.objectCount > resolved.domObjectThreshold) {
    if (input.webglSupported || !resolved.fallbackToDom) {
      return 'webgl';
    }
    return 'dom';
  }

  return 'dom';
}

/**
 * Breathing animation configuration for World Surface layers.
 * S0 spike: forest_1_top_left as test layer.
 */
export const BREATHING_CONFIG = {
  enabled: true,
  layers: {
    forest_1_top_left: {
      enabled: true,
      frequency: 0.060,     // Hz (fastest: 16.7s per cycle)
      magnitude: 1,         // screen px
      phase: 0,
      field: '/assets/ui/glass_displacement.png',
    },
    mountain_zone_north: {
      enabled: true,
      frequency: 0.050,     // Hz (medium: 20s per cycle)
      magnitude: 1,
      phase: 0,
      field: '/assets/ui/glass_displacement.png',
    },
    background: {
      enabled: true,
      frequency: 0.035,     // Hz (slowest: 28.6s per cycle)
      magnitude: 1,
      phase: 0,
      field: '/assets/ui/glass_displacement.png',
    },
  },
} as const;
