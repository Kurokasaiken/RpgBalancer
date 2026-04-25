/**
 * Minimal Gameplay Style Lab Tokens Hook
 *
 * Bridges minimalGameplayConfig.ui tokens to CSS custom properties for Style Lab compliance.
 * Provides a config-first way to apply consistent styling across MinimalGameplayPage
 * and its child components (ActionToolbar, WorkerPanel, ResourceTicker, ActivitySlot).
 */

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { MinimalUIConfig } from '@/balancing/config/idleVillage/minimalConfig';

// Fallback tokens for when config is not available
const DEFAULT_STYLE_LAB_TOKENS: MinimalStyleLabTokens = {
  cssVars: {
    '--minimal-accent-color': '#3b82f6',
    '--minimal-danger-color': '#ef4444',
    '--minimal-card-radius': '8px',
    '--minimal-hero-background': 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    '--minimal-panel-border': 'var(--panel-border)',
    '--minimal-panel-surface': 'var(--panel-surface)',
    '--minimal-card-surface': 'var(--card-surface)',
    '--minimal-card-shadow-color': 'var(--card-shadow-color)',
    '--minimal-text-primary': 'var(--text-primary)',
    '--minimal-text-secondary': 'var(--text-secondary)',
    '--minimal-text-muted': 'var(--text-muted)',
    '--minimal-button-bg': 'var(--button-bg)',
    '--minimal-button-text': 'var(--button-text)',
    '--minimal-accent-strong': 'var(--accent-strong)',
    '--minimal-card-highlight': 'var(--card-highlight)',
    '--minimal-halo-color': 'var(--halo-color)',
  } as Record<string, string>,
  cardRadius: '8px',
  accentColor: '#3b82f6',
  dangerColor: '#ef4444',
  heroBackground: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
};

export interface MinimalStyleLabTokens {
  /** CSS custom properties object to apply via style prop */
  cssVars: Record<string, string>;
  /** Resolved border radius for cards/surfaces */
  cardRadius: string;
  /** Accent color for CTAs and highlights */
  accentColor: string;
  /** Danger/warning color for alerts */
  dangerColor: string;
  /** Background gradient for hero/header blocks */
  heroBackground: string;
}

/**
 * Hook that converts minimalGameplayConfig.ui.tokens into Style Lab CSS custom properties.
 *
 * @param config - Minimal UI config containing tokens
 * @returns Token object with CSS vars and derived values
 */
export function useMinimalStyleLabTokens(config: MinimalUIConfig | undefined): MinimalStyleLabTokens {
  return useMemo(() => {
    if (!config?.tokens) {
      return DEFAULT_STYLE_LAB_TOKENS;
    }

    // Now we can safely destructure tokens
    const { tokens } = config;

    const cssVars: CSSProperties = {
      // Core tokens from config
      '--minimal-accent-color': tokens.accentHex,
      '--minimal-danger-color': tokens.dangerHex,
      '--minimal-card-radius': `${tokens.cardRadiusPx}px`,
      '--minimal-hero-background': tokens.heroBackground,

      // Derived/semantic tokens for consistency
      '--minimal-panel-border': 'var(--panel-border)',
      '--minimal-panel-surface': 'var(--panel-surface)',
      '--minimal-card-surface': 'var(--card-surface)',
      '--minimal-card-shadow-color': 'var(--card-shadow-color)',
      '--minimal-text-primary': 'var(--text-primary)',
      '--minimal-text-secondary': 'var(--text-secondary)',
      '--minimal-text-muted': 'var(--text-muted)',
      '--minimal-button-bg': 'var(--button-bg)',
      '--minimal-button-text': 'var(--button-text)',
      '--minimal-accent-strong': 'var(--accent-strong)',
      '--minimal-card-highlight': 'var(--card-highlight)',
      '--minimal-halo-color': 'var(--halo-color)',
    };

    return {
      cssVars,
      cardRadius: `${tokens.cardRadiusPx}px`,
      accentColor: tokens.accentHex,
      dangerColor: tokens.dangerHex,
      heroBackground: tokens.heroBackground,
    };
  }, [config?.tokens]);
}
