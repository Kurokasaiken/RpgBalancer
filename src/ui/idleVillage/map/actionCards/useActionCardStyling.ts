import { useMemo } from 'react';
import type { VerbVisualVariant } from '@/ui/idleVillage/legacy/VerbCard';
import { useStyleLabTokens } from '@/ui/styleLab/hooks/useStyleLabTokens';

type InteractionColorKey = keyof ReturnType<typeof useStyleLabTokens>['interactionColors'];

declare const CSSColorValue: unique symbol; // helps narrow templates in TS <5 satisfying config

type ColorValue = string | (string & { [CSSColorValue]?: never });

const VARIANT_TO_COLOR_KEY: Record<VerbVisualVariant, InteractionColorKey> = {
  azure: 'accentPrimary',
  ember: 'warning',
  jade: 'success',
  amethyst: 'accentSecondary',
  solar: 'accentSecondary',
};

const toPercent = (value: number) => `${Math.round(value * 100)}%`;

const toCssValue = (value: string | number | undefined): string | undefined => {
  if (value == null) return undefined;
  return typeof value === 'number' ? `${value}` : value;
};

const mixWithTransparent = (color: string, alpha: number): string => {
  const clamped = Math.max(0, Math.min(1, alpha));
  return `color-mix(in srgb, ${color} ${toPercent(clamped)}, transparent)`;
};

export interface ActionCardTheme {
  accentColor: ColorValue;
  haloColor: ColorValue;
  glowColor: ColorValue;
  statusColor: ColorValue;
  surface: {
    background?: ColorValue;
    borderColor?: ColorValue;
    borderRadius?: string | number;
    boxShadow?: string;
  };
  drop: {
    valid: string;
    invalid: string;
    idle: string;
  };
}

export type ActionCardFeelPreset = 'default' | 'magical' | 'light' | 'heavy';

const FEEL_PRESET_OVERRIDES: Record<ActionCardFeelPreset, {
  liftScale: number;
  springStiffness: number;
  slotGlowIntensity: number;
  mass: number;
}> = {
  default: { liftScale: 1, springStiffness: 1, slotGlowIntensity: 1, mass: 1 },
  magical: { liftScale: 1.08, springStiffness: 0.92, slotGlowIntensity: 1.1, mass: 0.85 },
  light: { liftScale: 1.05, springStiffness: 1.05, slotGlowIntensity: 0.95, mass: 0.8 },
  heavy: { liftScale: 0.97, springStiffness: 1.15, slotGlowIntensity: 1.2, mass: 1.25 },
};

export interface ActionCardFeel {
  preset: ActionCardFeelPreset;
  liftScale: number;
  springStiffness: number;
  slotGlowIntensity: number;
  mass: number;
  shadowDepth?: string;
}

export function useActionCardTheme(variant: VerbVisualVariant = 'solar'): ActionCardTheme {
  const tokens = useStyleLabTokens();

  return useMemo(() => {
    const colorKey = VARIANT_TO_COLOR_KEY[variant] ?? 'accentPrimary';
    const accentColor = tokens.interactionColors[colorKey] ?? tokens.interactionColors.accentPrimary;
    const successColor = tokens.interactionColors.success;
    const dangerColor = tokens.interactionColors.danger;
    const idleColor = tokens.interactionColors.focusRing;

    return {
      accentColor,
      haloColor: mixWithTransparent(accentColor, 0.75),
      glowColor: mixWithTransparent(accentColor, 0.45),
      statusColor: accentColor,
      surface: {
        background: toCssValue(tokens.preset.surfaces.card.background),
        borderColor: toCssValue(tokens.preset.surfaces.card.borderColor) ?? mixWithTransparent(accentColor, 0.4),
        borderRadius: toCssValue(tokens.preset.surfaces.card.borderRadius),
        boxShadow: toCssValue(tokens.preset.surfaces.card.boxShadow),
      },
      drop: {
        valid: `0 0 0 2px ${mixWithTransparent(successColor, 0.7)}`,
        invalid: `0 0 0 2px ${mixWithTransparent(dangerColor, 0.7)}`,
        idle: `0 0 0 1px ${mixWithTransparent(idleColor, 0.4)}`,
      },
    } satisfies ActionCardTheme;
  }, [tokens, variant]);
}

export function useActionCardFeel(preset: ActionCardFeelPreset = 'default'): ActionCardFeel {
  const tokens = useStyleLabTokens();
  return useMemo(() => {
    const overrides = FEEL_PRESET_OVERRIDES[preset] ?? FEEL_PRESET_OVERRIDES.default;
    return {
      preset,
      liftScale: tokens.interactionPhysics.liftScale * overrides.liftScale,
      springStiffness: tokens.interactionPhysics.springStiffness * overrides.springStiffness,
      slotGlowIntensity: tokens.interactionPhysics.slotGlowIntensity * overrides.slotGlowIntensity,
      mass: tokens.interactionPhysics.mass * overrides.mass,
      shadowDepth: tokens.materialFeel.shadowDepth,
    } satisfies ActionCardFeel;
  }, [preset, tokens]);
}
