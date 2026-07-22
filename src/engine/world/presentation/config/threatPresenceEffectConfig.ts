import { z } from 'zod';

const PhaseTicksSchema = z.object({
  safeEnd: z.number().int().min(0).default(4),
  manifestingStart: z.number().int().min(0).default(5),
  manifestingEnd: z.number().int().min(0).default(14),
  threatenedStart: z.number().int().min(0).default(15),
});

const ColorsSchema = z.object({
  manifestingTint: z.string().default('#6a1a1a'),
  threatenedTint: z.string().default('#4a0a0a'),
  markerTint: z.string().default('#c94a4a'),
  markerGlow: z.string().default('#ff6b6b'),
});

const OpacitiesSchema = z.object({
  manifestingLayerOpacity: z.number().min(0).max(1).default(0.45),
  threatenedLayerOpacity: z.number().min(0).max(1).default(0.85),
  manifestingMarkerOpacity: z.number().min(0).max(1).default(0.6),
  threatenedMarkerOpacity: z.number().min(0).max(1).default(1),
});

const MarkerVisualSchema = z.object({
  renderMode: z.enum(['sprite', 'shape', 'text', 'particle']).default('shape'),
  scale: z.number().positive().default(1.2),
  glow: z.boolean().default(true),
});

const VisualStateIdsSchema = z.object({
  safe: z.string().default('default'),
  manifesting: z.string().default('threat_manifesting'),
  threatened: z.string().default('threatened'),
});

/**
 * Validated configuration for the {@link ThreatPresenceEffect}.
 *
 * All timing, color, opacity and marker values are config-driven so the effect
 * remains deterministic and easy to tune without touching runtime code.
 */
export const ThreatPresenceEffectConfigSchema = z.object({
  phaseTicks: PhaseTicksSchema,
  colors: ColorsSchema,
  opacities: OpacitiesSchema,
  originPositions: z.record(
    z.string(),
    z.object({ x: z.number(), y: z.number() }),
  ).default({
    north: { x: 624, y: 120 },
    east: { x: 1128, y: 416 },
    south: { x: 624, y: 712 },
    west: { x: 120, y: 416 },
  }),
  markerVisual: MarkerVisualSchema,
  layerTarget: z.string().default('vignette'),
  visualStateIds: VisualStateIdsSchema,
  markerId: z.string().default('threat-marker'),
  markerType: z.string().default('threat'),
});

export type ThreatPresenceEffectConfig = z.infer<typeof ThreatPresenceEffectConfigSchema>;

/**
 * Default configuration for the threat presence effect.
 */
export const DEFAULT_THREAT_PRESENCE_EFFECT_CONFIG: ThreatPresenceEffectConfig = {
  phaseTicks: PhaseTicksSchema.parse({}),
  colors: ColorsSchema.parse({}),
  opacities: OpacitiesSchema.parse({}),
  originPositions: {
    north: { x: 624, y: 120 },
    east: { x: 1128, y: 416 },
    south: { x: 624, y: 712 },
    west: { x: 120, y: 416 },
  },
  markerVisual: MarkerVisualSchema.parse({}),
  layerTarget: 'vignette',
  visualStateIds: VisualStateIdsSchema.parse({}),
  markerId: 'threat-marker',
  markerType: 'threat',
};

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function mergeWithDefaults(
  defaults: ThreatPresenceEffectConfig,
  input: Record<string, unknown> | undefined,
): ThreatPresenceEffectConfig {
  if (!isRecord(input)) return defaults;

  return {
    ...defaults,
    ...input,
    phaseTicks: isRecord(input.phaseTicks)
      ? { ...defaults.phaseTicks, ...(input.phaseTicks as Record<string, unknown>) }
      : defaults.phaseTicks,
    colors: isRecord(input.colors)
      ? { ...defaults.colors, ...(input.colors as Record<string, unknown>) }
      : defaults.colors,
    opacities: isRecord(input.opacities)
      ? { ...defaults.opacities, ...(input.opacities as Record<string, unknown>) }
      : defaults.opacities,
    markerVisual: isRecord(input.markerVisual)
      ? { ...defaults.markerVisual, ...(input.markerVisual as Record<string, unknown>) }
      : defaults.markerVisual,
    visualStateIds: isRecord(input.visualStateIds)
      ? { ...defaults.visualStateIds, ...(input.visualStateIds as Record<string, unknown>) }
      : defaults.visualStateIds,
    originPositions: isRecord(input.originPositions)
      ? { ...defaults.originPositions, ...(input.originPositions as Record<string, { x: number; y: number }>) }
      : defaults.originPositions,
  };
}

/**
 * Validate and coerce a partial config into a full {@link ThreatPresenceEffectConfig}.
 */
export function validateThreatPresenceEffectConfig(
  input: unknown,
): ThreatPresenceEffectConfig {
  const merged = mergeWithDefaults(DEFAULT_THREAT_PRESENCE_EFFECT_CONFIG, input as Record<string, unknown> | undefined);
  return ThreatPresenceEffectConfigSchema.parse(merged);
}
