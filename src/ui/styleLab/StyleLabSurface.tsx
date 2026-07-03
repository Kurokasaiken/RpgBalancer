/**
 * Style Lab Surface Component
 *
 * Base surface wrapper that applies Style Lab tokens and provides consistent
 * spacing, borders, and backgrounds for Minimal Gameplay and other surfaces.
 * Replaces legacy Tailwind utilities and inline styles with token-driven design.
 *
 * V8 Integration: When the active preset has materialFeel.frameTreatment === 'chiseled-bronze-frame',
 * automatically applies the .wanderlust-artifact class for eroded bronze borders and
 * simmering obsidian layers.
 *
 * Material Layer Engine: When materialLayer prop is provided, the component
 * operates as a procedural material layer engine, dynamically constructing
 * className strings and CSS variables based on the configuration.
 */

import type { ReactNode } from 'react';
import type { CSSProperties } from 'react';
import { forwardRef } from 'react';
import clsx from 'clsx';
import { useStyleLabTokens } from './hooks/useStyleLabTokens';

/**
 * Configuration for procedural material layering.
 * Enables AAA-style material composition without manual layer management.
 */
export interface MaterialLayerConfig {
  /** Base texture material */
  baseTexture?: 'obsidian' | 'marble' | 'parchment' | 'wood' | 'gold';
  /** Edge treatment for borders */
  edgeTreatment?: 'eroded-bronze' | 'sharp-gold' | 'rough-wood' | 'none';
  /** Emissive halo/glow effect */
  emissiveHalo?: 'emerald' | 'gold' | 'none';
  /** Enable micro-interactions (hover scale, glow transitions) */
  microInteraction?: boolean;
  /** Enable rim light effect (1px soft highlight on top-left edge) */
  rimLight?: boolean;
  /** Enable physical depth (multi-layer shadows for contact + elevation) */
  physicalDepth?: boolean;
  /** Enable heavy feel (weighted easing for physical presence) */
  heavyFeel?: boolean;
  /** Background mode for dynamic rim light calculation */
  backgroundMode?: 'marble' | 'parchment' | 'void' | 'bg';
}

export interface StyleLabSurfaceProps {
  /** Content to render inside the surface */
  children: ReactNode;
  /** Optional className for additional styling */
  className?: string;
  /** Optional style overrides (merged with token styles) */
  style?: CSSProperties;
  /** Surface variant for different visual treatments */
  variant?: 'panel' | 'card' | 'toolbar' | 'ticker';
  /** Whether to apply backdrop blur effect */
  backdropBlur?: boolean;
  /** Test ID for testing utilities */
  testId?: string;
  /** Optional preset ID for V8 skin architecture */
  presetId?: string;
  /** Material layer configuration for procedural AAA-style composition */
  materialLayer?: MaterialLayerConfig;
}

/**
 * Base surface component that applies Style Lab tokens consistently.
 * Use this instead of raw divs with Tailwind utilities for Style Lab compliance.
 */
export const StyleLabSurface = forwardRef<HTMLDivElement, StyleLabSurfaceProps>(
  (
    {
      children,
      className,
      style,
      variant = 'panel',
      backdropBlur = true,
      testId,
      presetId,
      materialLayer,
    },
    ref
  ) => {
    const { materialFeel, cssVars } = useStyleLabTokens({ presetId });

    const isV8ChiseledFrame = materialFeel.frameTreatment === 'chiseled-bronze-frame';
    const hasMaterialLayer = materialLayer !== undefined;

    const variantClasses = {
      panel: 'rounded-2xl border p-6 shadow-xl',
      card: 'rounded-xl border p-4 shadow-lg',
      toolbar: 'rounded-2xl border p-4 shadow-xl',
      ticker: 'rounded-lg border p-3 shadow-md',
    };

    // V8 variant overrides for wanderlust-artifact utilities
    const v8VariantOverrides: Record<typeof variant, string> = {
      panel: '',
      card: 'wa--roomy',
      toolbar: 'wa--wide wa--snug',
      ticker: 'wa--snug',
    };

    // Material Layer Engine: dynamic className construction
    const materialLayerClasses = hasMaterialLayer ? [
      materialLayer.baseTexture && `ml-base-${materialLayer.baseTexture}`,
      materialLayer.edgeTreatment && `ml-edge-${materialLayer.edgeTreatment}`,
      materialLayer.emissiveHalo && `ml-halo-${materialLayer.emissiveHalo}`,
      materialLayer.microInteraction && 'wa--haptic-ready',
      materialLayer.rimLight && (materialLayer.backgroundMode ? 'ml-rim-light-dynamic' : 'ml-rim-light'),
      materialLayer.physicalDepth && 'wa-physical-depth',
      materialLayer.heavyFeel && 'wa--heavy-feel',
    ].filter(Boolean) : [];

    const baseClasses = clsx(
      isV8ChiseledFrame && 'wanderlust-artifact',
      isV8ChiseledFrame && v8VariantOverrides[variant],
      !isV8ChiseledFrame && !hasMaterialLayer && variantClasses[variant],
      backdropBlur && !isV8ChiseledFrame && !hasMaterialLayer && 'backdrop-blur-sm',
      ...materialLayerClasses,
      className
    );

    const variantStyles: Record<typeof variant, CSSProperties> = {
      panel: {
        borderColor: 'var(--minimal-panel-border)',
        background: `linear-gradient(120deg, rgba(255,255,255,0.02), transparent), var(--minimal-panel-surface)`,
        boxShadow: `0 30px 60px var(--minimal-card-shadow-color)`,
        borderRadius: 'var(--minimal-card-radius)',
      },
      card: {
        borderColor: 'var(--minimal-panel-border)',
        background: 'var(--minimal-card-surface)',
        boxShadow: `0 15px 35px var(--minimal-card-shadow-color)`,
        borderRadius: 'var(--minimal-card-radius)',
      },
      toolbar: {
        borderColor: 'var(--minimal-panel-border)',
        background: `linear-gradient(120deg, rgba(255,255,255,0.02), transparent), var(--minimal-panel-surface)`,
        boxShadow: `0 30px 60px var(--minimal-card-shadow-color)`,
        borderRadius: 'var(--minimal-card-radius)',
      },
      ticker: {
        borderColor: 'var(--minimal-panel-border)',
        background: 'var(--minimal-card-surface)',
        boxShadow: `0 8px 20px var(--minimal-card-shadow-color)`,
        borderRadius: 'var(--minimal-card-radius)',
      },
    };

    // Material Layer Engine: CSS variable injection for filters and rim light
    const materialLayerStyle: CSSProperties & Record<string, string> = hasMaterialLayer ? {
      '--stylelab-grain-filter': cssVars['--stylelab-material-grain'] || 'none',
      '--stylelab-edge-filter': cssVars['--stylelab-material-edge-treatment'] || 'none',
      ...(materialLayer.backgroundMode && {
        '--stylelab-rim-light-color': (() => {
          switch (materialLayer.backgroundMode) {
            case 'marble':
              return 'rgba(255, 248, 180, 0.15)'; // Gold for marble
            case 'parchment':
              return 'rgba(205, 127, 50, 0.12)'; // Bronze for parchment
            case 'void':
              return 'rgba(100, 200, 255, 0.10)'; // Cyan for void
            case 'bg':
              return 'rgba(255, 255, 255, 0.08)'; // White for custom bg
            default:
              return 'rgba(255, 248, 180, 0.12)';
          }
        })(),
      }),
    } : {};

    const mergedStyle: CSSProperties = {
      ...(!isV8ChiseledFrame && !hasMaterialLayer && variantStyles[variant]),
      ...cssVars,
      ...materialLayerStyle,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={baseClasses}
        style={mergedStyle}
        data-testid={testId}
        data-variant={variant}
        data-v8-frame={isV8ChiseledFrame}
        data-material-layer={hasMaterialLayer}
      >
        {children}
      </div>
    );
  }
);

StyleLabSurface.displayName = 'StyleLabSurface';
