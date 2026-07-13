/**
 * @fileoverview Config-driven frame system for PgCard portrait medallions.
 *
 * Heroes deserve a heroic frame. This module exposes frame variants that can be
 * applied to both `PgCard` and the portrait medallion inside it, keeping the
 * look configurable from a single source of truth.
 */
import type { CSSProperties } from 'react';

/** Supported frame variants for PgCard portrait medallions. */
export type PgCardFrameType =
  | 'none'
  | 'medallion'
  | 'heroic'
  | 'veteran'
  | 'legendary'
  | 'iron';

/**
 * Visual tokens for a single frame variant.
 */
export interface PgCardFrameTokens {
  /** Human readable label for the frame. */
  label: string;
  /** Border color (CSS color). */
  borderColor: string;
  /** Background fill behind the portrait. */
  backgroundColor: string;
  /** Outer glow / shadow. */
  boxShadow: string;
  /** Optional accent color for corner decorations. */
  accentColor: string;
  /** Border width in pixels. */
  borderWidth: number;
  /** Border radius strategy: `full` for circular, `rounded` for soft, `sharp` for angular. */
  borderRadius: 'full' | 'rounded' | 'sharp';
  /** Whether to render decorative corner marks. */
  hasCornerDecorations: boolean;
  /** Whether to render an inner bevel highlight. */
  hasInnerBevel: boolean;
  /** CSS class suffix applied to the medallion wrapper. */
  classSuffix: string;
}

/**
 * Default frame configuration for PgCard medallions.
 */
export const PG_CARD_FRAME_CONFIG: Record<PgCardFrameType, PgCardFrameTokens> = {
  none: {
    label: 'No frame',
    borderColor: 'transparent',
    backgroundColor: 'var(--skin-surface-base, rgba(0,0,0,0.35))',
    boxShadow: 'none',
    accentColor: 'transparent',
    borderWidth: 0,
    borderRadius: 'rounded',
    hasCornerDecorations: false,
    hasInnerBevel: false,
    classSuffix: 'none',
  },
  medallion: {
    label: 'Medallion',
    borderColor: 'var(--skin-frame-border, rgba(216,177,62,0.55))',
    backgroundColor: 'var(--skin-surface-base, rgba(12,11,9,0.85))',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
    accentColor: 'var(--skin-gold-accent, #c9a227)',
    borderWidth: 2,
    borderRadius: 'full',
    hasCornerDecorations: true,
    hasInnerBevel: true,
    classSuffix: 'medallion',
  },
  heroic: {
    label: 'Heroic',
    borderColor: 'var(--skin-heroic-frame-border, #c9a227)',
    backgroundColor: 'var(--skin-surface-base, rgba(12,11,9,0.9))',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 0 12px rgba(201,162,39,0.35), 0 4px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
    accentColor: 'var(--skin-gold-accent, #c9a227)',
    borderWidth: 3,
    borderRadius: 'full',
    hasCornerDecorations: true,
    hasInnerBevel: true,
    classSuffix: 'heroic',
  },
  veteran: {
    label: 'Veteran',
    borderColor: 'var(--skin-veteran-frame-border, #8db3a5)',
    backgroundColor: 'var(--skin-surface-base, rgba(9,14,13,0.9))',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 0 12px rgba(141,179,165,0.3), 0 4px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
    accentColor: 'var(--skin-teal-accent, #8db3a5)',
    borderWidth: 3,
    borderRadius: 'rounded',
    hasCornerDecorations: true,
    hasInnerBevel: true,
    classSuffix: 'veteran',
  },
  legendary: {
    label: 'Legendary',
    borderColor: 'var(--skin-legendary-frame-border, #b14fff)',
    backgroundColor: 'var(--skin-surface-base, rgba(18,10,24,0.92))',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 0 18px rgba(177,79,255,0.45), 0 6px 14px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
    accentColor: 'var(--skin-legendary-accent, #b14fff)',
    borderWidth: 4,
    borderRadius: 'full',
    hasCornerDecorations: true,
    hasInnerBevel: true,
    classSuffix: 'legendary',
  },
  iron: {
    label: 'Iron',
    borderColor: 'var(--skin-iron-frame-border, #6b7280)',
    backgroundColor: 'var(--skin-surface-base, rgba(12,12,13,0.9))',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
    accentColor: 'var(--skin-iron-accent, #9ca3af)',
    borderWidth: 2,
    borderRadius: 'sharp',
    hasCornerDecorations: false,
    hasInnerBevel: true,
    classSuffix: 'iron',
  },
};

/**
 * Returns the token set for the requested frame type.
 */
export function getPgCardFrameTokens(frameType: PgCardFrameType): PgCardFrameTokens {
  return PG_CARD_FRAME_CONFIG[frameType] ?? PG_CARD_FRAME_CONFIG.heroic;
}

/**
 * Returns the CSS border radius value for a frame variant.
 */
export function getPgCardFrameBorderRadius(
  frameType: PgCardFrameType,
  size: 'horizontal' | 'vertical'
): string {
  const tokens = getPgCardFrameTokens(frameType);
  const hasPortrait = true;
  if (tokens.borderRadius === 'full') {
    return hasPortrait ? '9999px' : '9999px';
  }
  if (tokens.borderRadius === 'sharp') {
    return size === 'horizontal' ? '4px' : '6px';
  }
  return size === 'horizontal' ? '12px' : '14px';
}

/**
 * Returns CSS style object for the medallion frame wrapper.
 */
export function getPgCardFrameStyle(
  frameType: PgCardFrameType,
  size: 'horizontal' | 'vertical'
): CSSProperties {
  const tokens = getPgCardFrameTokens(frameType);
  return {
    borderRadius: getPgCardFrameBorderRadius(frameType, size),
    border: `${tokens.borderWidth}px solid ${tokens.borderColor}`,
    backgroundColor: tokens.backgroundColor,
    boxShadow: tokens.boxShadow,
    '--pgcard-frame-accent-color': tokens.accentColor,
  } as CSSProperties;
}
