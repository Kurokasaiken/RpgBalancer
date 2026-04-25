/**
 * Minimal HUD Token Library
 *
 * Config-first token system for Minimal Gameplay HUD styling.
 * Provides typography, gradients, spacing, badge variants, and warning tokens
 * with type-safe resolution and merging capabilities.
 */

import { z } from 'zod';

/**
 * Typography tokens for HUD text elements.
 */
const TypographyTokensSchema = z.object({
  /** Primary font family for HUD elements. */
  fontFamily: z.string(),
  /** Base font size for HUD text (in px). */
  baseFontSize: z.number(),
  /** Line height multiplier for readable text. */
  lineHeight: z.number(),
  /** Font weight for normal text. */
  fontWeightNormal: z.number(),
  /** Font weight for emphasized text. */
  fontWeightBold: z.number(),
  /** Letter spacing for improved readability. */
  letterSpacing: z.string(),
});

/**
 * Gradient tokens for HUD backgrounds and effects.
 */
const GradientTokensSchema = z.object({
  /** Primary gradient for HUD backgrounds. */
  primary: z.string(),
  /** Secondary gradient for accents. */
  secondary: z.string(),
  /** Warning gradient for caution states. */
  warning: z.string(),
  /** Danger gradient for error states. */
  danger: z.string(),
});

/**
 * Spacing tokens for HUD layout and positioning.
 */
const SpacingTokensSchema = z.object({
  /** Extra small spacing (4px equivalent). */
  xs: z.string(),
  /** Small spacing (8px equivalent). */
  sm: z.string(),
  /** Medium spacing (16px equivalent). */
  md: z.string(),
  /** Large spacing (24px equivalent). */
  lg: z.string(),
  /** Extra large spacing (32px equivalent). */
  xl: z.string(),
});

/**
 * Badge variant tokens for status indicators and labels.
 */
const BadgeVariantTokensSchema = z.object({
  /** Default badge styling. */
  default: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    borderRadius: z.string(),
    padding: z.string(),
  }),
  /** Success badge styling. */
  success: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    borderRadius: z.string(),
    padding: z.string(),
  }),
  /** Warning badge styling. */
  warning: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    borderRadius: z.string(),
    padding: z.string(),
  }),
  /** Danger badge styling. */
  danger: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    borderRadius: z.string(),
    padding: z.string(),
  }),
});

/**
 * Warning token configurations for different severity levels.
 */
const WarningTokensSchema = z.object({
  /** Low severity warning styling. */
  low: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    border: z.string(),
    animation: z.string(),
  }),
  /** Medium severity warning styling. */
  medium: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    border: z.string(),
    animation: z.string(),
  }),
  /** High severity warning styling. */
  high: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    border: z.string(),
    animation: z.string(),
  }),
});

/**
 * Complete Minimal HUD Tokens schema.
 */
export const MinimalHudTokensSchema = z.object({
  /** Typography configuration. */
  typography: TypographyTokensSchema,
  /** Gradient definitions. */
  gradients: GradientTokensSchema,
  /** Spacing scale. */
  spacing: SpacingTokensSchema,
  /** Badge variant styles. */
  badgeVariants: BadgeVariantTokensSchema,
  /** Warning severity styles. */
  warningTokens: WarningTokensSchema,
});

/**
 * Type definition for Minimal HUD Tokens.
 */
export type MinimalHudTokens = z.infer<typeof MinimalHudTokensSchema>;

/**
 * Default Minimal HUD Tokens configuration.
 */
export const defaultMinimalHudTokens: MinimalHudTokens = {
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    baseFontSize: 14,
    lineHeight: 1.5,
    fontWeightNormal: 400,
    fontWeightBold: 600,
    letterSpacing: '0.01em',
  },
  gradients: {
    primary: 'linear-gradient(135deg, rgba(14,22,30,0.92), rgba(7,11,17,0.8))',
    secondary: 'linear-gradient(135deg, rgba(201,162,39,0.1), rgba(201,162,39,0.05))',
    warning: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))',
    danger: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  badgeVariants: {
    default: {
      backgroundColor: 'rgba(156,163,175,0.1)',
      color: '#9ca3af',
      borderRadius: '0.375rem',
      padding: '0.125rem 0.5rem',
    },
    success: {
      backgroundColor: 'rgba(34,197,94,0.1)',
      color: '#22c55e',
      borderRadius: '0.375rem',
      padding: '0.125rem 0.5rem',
    },
    warning: {
      backgroundColor: 'rgba(245,158,11,0.1)',
      color: '#f59e0b',
      borderRadius: '0.375rem',
      padding: '0.125rem 0.5rem',
    },
    danger: {
      backgroundColor: 'rgba(239,68,68,0.1)',
      color: '#ef4444',
      borderRadius: '0.375rem',
      padding: '0.125rem 0.5rem',
    },
  },
  warningTokens: {
    low: {
      backgroundColor: 'rgba(245,158,11,0.05)',
      color: '#f59e0b',
      border: '1px solid rgba(245,158,11,0.2)',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    medium: {
      backgroundColor: 'rgba(245,158,11,0.1)',
      color: '#f59e0b',
      border: '1px solid rgba(245,158,11,0.4)',
      animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },
    high: {
      backgroundColor: 'rgba(239,68,68,0.1)',
      color: '#ef4444',
      border: '1px solid rgba(239,68,68,0.4)',
      animation: 'shake 0.5s ease-in-out',
    },
  },
};

/**
 * Resolve a token value by path with optional fallback.
 *
 * @param path - Dot-separated path to the token (e.g., 'typography.baseFontSize')
 * @param fallback - Optional fallback value if token is not found
 * @returns The resolved token value or fallback
 */
export function resolveHudToken(path: string, fallback?: any): any {
  const keys = path.split('.');
  let current: any = defaultMinimalHudTokens;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      if (fallback !== undefined) {
        console.warn(`[MinimalHudTokens] Token not found: ${path}, using fallback`);
        return fallback;
      }
      console.warn(`[MinimalHudTokens] Token not found: ${path}`);
      return undefined;
    }
  }

  return current;
}

/**
 * Merge base tokens with override tokens for custom configurations.
 *
 * @param base - Base token configuration
 * @param override - Override token configuration
 * @returns Merged token configuration
 */
export function mergeHudTokens(base: MinimalHudTokens, override: Partial<MinimalHudTokens>): MinimalHudTokens {
  return {
    typography: { ...base.typography, ...override.typography },
    gradients: { ...base.gradients, ...override.gradients },
    spacing: { ...base.spacing, ...override.spacing },
    badgeVariants: {
      default: { ...base.badgeVariants.default, ...override.badgeVariants?.default },
      success: { ...base.badgeVariants.success, ...override.badgeVariants?.success },
      warning: { ...base.badgeVariants.warning, ...override.badgeVariants?.warning },
      danger: { ...base.badgeVariants.danger, ...override.badgeVariants?.danger },
    },
    warningTokens: {
      low: { ...base.warningTokens.low, ...override.warningTokens?.low },
      medium: { ...base.warningTokens.medium, ...override.warningTokens?.medium },
      high: { ...base.warningTokens.high, ...override.warningTokens?.high },
    },
  };
}
