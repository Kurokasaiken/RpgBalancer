import { z } from 'zod';

/**
 * Supported Style Lab pillars for Skin presets.
 */
export const StyleLabPillarSchema = z.enum(['frontier', 'wilderness', 'empire']);
export type StyleLabPillar = z.infer<typeof StyleLabPillarSchema>;

/**
 * Vision modes derived from style-lab-flexibility plan.
 */
export const VisionModeSchema = z.enum([
  'standard',
  'deuteranopia',
  'protanopia',
  'tritanopia',
  'grayscale',
  'high_contrast',
]);

/**
 * Motion levels derived from style-lab-flexibility objectives.
 */
export const MotionLevelSchema = z.enum(['full', 'reduced', 'minimal']);

/**
 * Density presets aligned with Style Lab tokens.
 */
export const DensityModeSchema = z.enum(['compact', 'cozy', 'spacious']);

/**
 * Focus styles supported by Style Lab accessibility overrides.
 */
export const FocusStyleSchema = z.enum(['default', 'enhanced']);

/**
 * Compact schema for user-overridable Style Lab parameters.
 */
export const SkinStyleLabOverridesSchema = z.object({
  colorFilters: z
    .object({
      visionMode: VisionModeSchema,
    })
    .optional(),
  typographyScale: z.union([z.literal(1), z.literal(1.2), z.literal(1.4)]).optional(),
  densityMode: DensityModeSchema.optional(),
  motionLevel: MotionLevelSchema.optional(),
  focusStyle: FocusStyleSchema.optional(),
  palettePreset: z.string().optional(),
  interactionPhysics: z
    .object({
      mass: z.number().min(0.2).max(3),
      damping: z.number().min(0.01).max(1),
      stiffness: z.number().min(50).max(600),
      shadowDepth: z.enum(['shallow', 'medium', 'deep']).default('medium'),
      bloomIntensity: z.number().min(0).max(2).default(1),
      audioProfile: z.string().default('observatory'),
    })
    .optional(),
});
export type SkinStyleLabOverrides = z.infer<typeof SkinStyleLabOverridesSchema>;

/**
 * Palette description for a skin preset.
 */
export const SkinPaletteSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  glow: z.string(),
  background: z.string(),
  text: z.string(),
});
export type SkinPalette = z.infer<typeof SkinPaletteSchema>;

/**
 * Component theme mapping for UI wrappers.
 */
export const SkinComponentThemeSchema = z.object({
  roster: z.string(),
  slotRack: z.string(),
  timeStrip: z.string(),
  hud: z.string(),
  capsule: z.string(),
  halo: z.string(),
  pgCard: z.string().optional(),
});
export type SkinComponentThemes = z.infer<typeof SkinComponentThemeSchema>;

/**
 * Telemetry metadata for skin-aware surfaces.
 */
export const SkinTelemetryConfigSchema = z
  .object({
    presetChangedEvent: z.string().default('skin_preset_changed'),
    renderedEvent: z.string().default('skin_rendered'),
    context: z.string().default('idle_village'),
  })
  .default(() => ({
    presetChangedEvent: 'skin_preset_changed',
    renderedEvent: 'skin_rendered',
    context: 'idle_village',
  }));
export type SkinTelemetryConfig = z.infer<typeof SkinTelemetryConfigSchema>;

/**
 * Config definition for each skin preset entry in the registry.
 */
export const SkinPresetConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  version: z.number().int().positive().default(1),
  defaultPillar: StyleLabPillarSchema,
  supportedPillars: z.array(StyleLabPillarSchema).nonempty(),
  exposure: z.enum(['public', 'internal']).default('public'),
  palette: SkinPaletteSchema,
  densityMode: DensityModeSchema.default('compact'),
  motionLevel: MotionLevelSchema.default('full'),
  typographyScale: z.union([z.literal(1), z.literal(1.1), z.literal(1.2), z.literal(1.3)]).default(1),
  componentThemes: SkinComponentThemeSchema,
  interactionPhysics: z.object({
    mass: z.number().min(0.2).max(3),
    damping: z.number().min(0.01).max(1),
    stiffness: z.number().min(50).max(600),
    shadowDepth: z.enum(['shallow', 'medium', 'deep']),
    bloomIntensity: z.number().min(0).max(2),
    audioProfile: z.string(),
  }),
  styleLabOverrides: SkinStyleLabOverridesSchema.optional(),
  telemetry: SkinTelemetryConfigSchema.default(() => ({
    presetChangedEvent: 'skin_preset_changed',
    renderedEvent: 'skin_rendered',
    context: 'idle_village',
  })),
  documentation: z.array(z.string()).default([]),
});
export type SkinPresetConfig = z.infer<typeof SkinPresetConfigSchema>;

/**
 * Registry schema covering all presets keyed by ID.
 */
export const SkinRegistrySchema = z.record(z.string(), SkinPresetConfigSchema);
export type SkinRegistry = z.infer<typeof SkinRegistrySchema>;

/**
 * Preferences persisted via PersistenceService.
 */
export const SkinPreferencesSchema = z.object({
  presetId: z.string().min(1),
  pillar: StyleLabPillarSchema,
  overrides: SkinStyleLabOverridesSchema.optional(),
});
export type SkinPreferences = z.infer<typeof SkinPreferencesSchema>;

/**
 * Medal style configuration for SlottedMedal component.
 */
const GradientStopSchema = z.object({
  offset: z.number().min(0).max(1),
  color: z.string(),
  opacity: z.number().min(0).max(1).optional(),
});

const MedalGradientSchema = z.object({
  type: z.enum(['linear', 'radial']).default('radial'),
  x1: z.string().optional(),
  y1: z.string().optional(),
  x2: z.string().optional(),
  y2: z.string().optional(),
  cx: z.string().optional(),
  cy: z.string().optional(),
  r: z.string().optional(),
  fx: z.string().optional(),
  fy: z.string().optional(),
  gradientUnits: z.enum(['objectBoundingBox', 'userSpaceOnUse']).default('objectBoundingBox'),
  stops: z.array(GradientStopSchema).min(2),
});

const MedalOverlaySchema = z.object({
  fill: z.string(),
  opacity: z.number().min(0).max(1).default(0.4),
  blendMode: z.string().optional(),
});

const MedalGlassLayerSchema = z.object({
  tint: z.string(),
  highlight: z.string(),
  opacity: z.number().min(0).max(1).default(0.45),
  blurPx: z.number().min(0).max(50).default(8),
});

const MedalGemSchema = z.object({
  enabled: z.boolean().default(false),
  bodyGradient: MedalGradientSchema,
  glowColor: z.string().optional(),
  clawColor: z.string().optional(),
  position: z.object({
    x: z.string().default('50%'),
    y: z.string().default('85%'),
  }).default({ x: '50%', y: '85%' }),
  size: z.string().default('18px'),
  animationDurationMs: z.number().min(100).max(10000).default(2600),
});

export const MedalStyleConfigSchema = z.object({
  depth: z.number().min(1).max(20).default(4),
  shadowBlur: z.number().min(0).max(50).default(8),
  shadowOpacity: z.number().min(0).max(1).default(0.3),
  rimThickness: z.number().min(1).max(10).default(2),
  rimColor: z.string(),
  faceColor: z.string(),
  highlightColor: z.string(),
  gradients: z
    .object({
      rim: MedalGradientSchema.optional(),
      face: MedalGradientSchema.optional(),
      innerRing: MedalGradientSchema.optional(),
      field: MedalGradientSchema.optional(),
      glass: MedalGradientSchema.optional(),
    })
    .optional(),
  overlays: z
    .object({
      patina: MedalOverlaySchema.optional(),
      oxidation: MedalOverlaySchema.optional(),
      scratches: MedalOverlaySchema.optional(),
    })
    .optional(),
  glassLayer: MedalGlassLayerSchema.optional(),
  glow: z
    .object({
      color: z.string(),
      blur: z.number().min(0).max(80).default(24),
      opacity: z.number().min(0).max(1).default(0.5),
    })
    .optional(),
  glyphStyle: z
    .object({
      fill: z.string(),
      stroke: z.string().optional(),
      shadow: z.string().optional(),
      fontFamily: z.string().optional(),
    })
    .optional(),
  gem: MedalGemSchema.optional(),
});
export type MedalStyleConfig = z.infer<typeof MedalStyleConfigSchema>;
export type MedalGradientDefinition = z.infer<typeof MedalGradientSchema>;
export type MedalGradientStop = z.infer<typeof GradientStopSchema>;

const RackMotionStateSchema = z
  .object({
    opacity: z.number().min(0).max(1).optional(),
    scale: z.number().min(0).max(2).optional(),
    y: z.union([z.number(), z.string()]).optional(),
  })
  .optional();

const RackMotionTransitionSchema = z
  .object({
    type: z.enum(['spring', 'tween']).optional(),
    duration: z.number().min(0).max(5).optional(),
    ease: z.string().optional(),
    mass: z.number().min(0.1).max(5).optional(),
    damping: z.number().min(0.01).max(1).optional(),
    stiffness: z.number().min(50).max(600).optional(),
  })
  .optional();

export const RackMotionConfigSchema = z
  .object({
    type: z.enum(['spring', 'fade', 'none']).default('spring'),
    initial: RackMotionStateSchema,
    animate: RackMotionStateSchema,
    transition: RackMotionTransitionSchema,
  })
  .optional();
export type RackMotionConfig = z.infer<typeof RackMotionConfigSchema>;

/**
 * Slot rack specific skin configuration.
 */
export const SlotRackSkinConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  version: z.number().int().positive().default(1),
  supportedPresets: z.array(z.string()).nonempty(),
  
  // Grid layout and spacing
  grid: z.object({
    gap: z.string(),
    padding: z.string(),
    borderRadius: z.string(),
    background: z.string(),
    border: z.string(),
  }),
  
  // Slot container styling
  slotContainer: z.object({
    background: z.string(),
    border: z.string(),
    borderRadius: z.string(),
    padding: z.string(),
    transition: z.string(),
  }),
  
  // Navigation controls
  navigation: z.object({
    buttonBackground: z.string(),
    buttonBorder: z.string(),
    buttonHoverBackground: z.string(),
    iconColor: z.string(),
    iconSize: z.string(),
  }),
  
  // SlottedMedal styling bridge
  medalStyle: z.object({
    defaultPreset: z.enum(['minimal', 'enhanced', 'ceremonial']).default('minimal'),
    variants: z.record(z.string(), MedalStyleConfigSchema),
  }),
  
  // Interaction physics for SlottedMedal + motion bridges
  interactionPhysics: z.object({
    mass: z.number().min(0.2).max(3),
    damping: z.number().min(0.01).max(1),
    stiffness: z.number().min(50).max(600),
    shadowDepth: z.enum(['shallow', 'medium', 'deep']),
    bloomIntensity: z.number().min(0).max(2),
  }),

  // Optional rack motion overrides
  rackMotion: RackMotionConfigSchema,
  
  // Audio profile mapping
  audioProfile: z.string(),
  
  // CSS custom properties
  cssVars: z.record(z.string(), z.string()),
  
  // Documentation references
  documentation: z.array(z.string()).default([]),
});
export type SlotRackSkinConfig = z.infer<typeof SlotRackSkinConfigSchema>;

/**
 * Generic skin config type for component-specific configurations.
 */
export type SkinConfig = SlotRackSkinConfig;
