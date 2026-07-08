/**
 * OutcomeModal Skin Configuration
 * 
 * Config-first skin definitions for OutcomeModal component.
 * Provides visual styling for outcome modal based on skin presets.
 */

import type { StyleLabPillar } from './skinSchemas';

export interface OutcomeModalSkinConfig {
  skinPresetId: string;
  pillar: StyleLabPillar;
  frame: {
    background: string;
    border: string;
    borderRadius: string;
    shadow: string;
  };
  typography: {
    heading: string;
    body: string;
  };
  spacing: {
    padding: string;
    gap: string;
  };
}

/**
 * Default outcome modal skin configuration for Minimal Frontier preset
 */
export const DEFAULT_OUTCOME_MODAL_CONFIG: OutcomeModalSkinConfig = {
  skinPresetId: 'minimal_frontier',
  pillar: 'frontier',
  frame: {
    background: 'linear-gradient(145deg, #1a1d23 0%, #14161a 100%)',
    border: '2px solid #3a2008',
    borderRadius: '16px',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  typography: {
    heading: '#fff',
    body: '#ccc',
  },
  spacing: {
    padding: '24px',
    gap: '16px',
  },
};

/**
 * CSS class generator for outcome modal skin
 */
export function generateOutcomeModalSkinClasses(
  presetId: string,
  pillar: StyleLabPillar
): string {
  return `outcomemodal-skin-${presetId} outcomemodal-skin-${pillar}`;
}
