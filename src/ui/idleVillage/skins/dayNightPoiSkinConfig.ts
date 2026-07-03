/**
 * DayNightPOI visual skin configuration.
 * This is a world-state POI skin, not an activity/detail skin.
 */

/**
 * Color palette and visual properties for a specific day/night state
 */
export interface DayNightPoiStatePalette {
  ringColor: string;
  glowColor: string;
  glowOpacity: [number, number];
  coreColor: string;
  bloomRadius: number;
  bloomIntensity: number;
}

/**
 * Complete configuration for DayNightPOI visual appearance
 */
export interface DayNightPoiConfig {
  /** Size of the POI in pixels */
  size: number;
  /** Width of decorative borders */
  borderWidth: number;
  /** Duration of animations in milliseconds */
  animationDuration: number;
  /** Intensity multiplier for bloom effects */
  bloomIntensity: number;
  /** Opacity for halo effects */
  haloOpacity: number;
  /** Intensity for rim glow effects */
  rimGlowIntensity: number;
  /** Opacity for decorative marks */
  markOpacity: number;
  /** Visual palette for day phase */
  dayRunning: DayNightPoiStatePalette;
  /** Visual palette for night phase */
  nightRunning: DayNightPoiStatePalette;
  /** Visual palette for paused state */
  paused: DayNightPoiStatePalette;
}

/**
 * Complete preset configuration including metadata and CSS variables
 */
export interface DayNightPoiSkinPresetConfig {
  /** Unique identifier for the preset */
  id: string;
  /** Human-readable label */
  label: string;
  /** Description of the preset's purpose */
  description: string;
  /** Version number for compatibility tracking */
  version: number;
  /** List of supported Style Lab preset IDs */
  supportedPresets: string[];
  /** Visual configuration for the preset */
  config: DayNightPoiConfig;
  /** CSS custom properties for the preset */
  cssVars: Record<string, string>;
}

export const defaultDayNightPoiConfig: DayNightPoiConfig = {
  size: 80,
  borderWidth: 2,
  animationDuration: 240,
  bloomIntensity: 1,
  haloOpacity: 0.65,
  rimGlowIntensity: 0.86,
  markOpacity: 0.22,

  dayRunning: {
    ringColor: '#E3B24C',
    glowColor: '#F2C14E',
    glowOpacity: [0.3, 0.42],
    coreColor: '#24170A',
    bloomRadius: 0.5,
    bloomIntensity: 1.15,
  },

  nightRunning: {
    ringColor: '#7C5CFF',
    glowColor: '#8B5CF6',
    glowOpacity: [0.34, 0.48],
    coreColor: '#1A1730',
    bloomRadius: 0.44,
    bloomIntensity: 0.95,
  },

  paused: {
    ringColor: '#E0E0E6',
    glowColor: '#ECEEF2',
    glowOpacity: [0.3, 0.46],
    coreColor: '#20242B',
    bloomRadius: 0.42,
    bloomIntensity: 0.6,
  },
};

export const MINIMAL_FRONTIER_DAYNIGHT_POI_CONFIG: DayNightPoiSkinPresetConfig = {
  id: 'minimal_frontier_daynight_poi',
  label: 'Minimal Frontier Day/Night POI',
  description: 'Circle-only world-state POI showing day/night cycle progress.',
  version: 2,
  supportedPresets: ['minimal_frontier', 'minimal-frontier'],
  config: defaultDayNightPoiConfig,
  cssVars: {
    '--daynight-poi-size': '80px',
    '--daynight-poi-transition-duration': '240ms',
  },
};

/**
 * Gets the DayNightPOI skin preset configuration for a given preset ID
 * @param presetId - Optional Style Lab preset ID
 * @returns The corresponding DayNightPOI skin preset configuration
 */
export function getDayNightPoiSkinForPreset(
  presetId?: string,
): DayNightPoiSkinPresetConfig {
  switch (presetId) {
    case 'minimal_frontier':
    case 'minimal-frontier':
    default:
      return MINIMAL_FRONTIER_DAYNIGHT_POI_CONFIG;
  }
}

/**
 * Resolves a preset ID to the canonical DayNightPOI preset ID
 * @param presetId - Optional Style Lab preset ID to resolve
 * @returns The canonical preset ID for DayNightPOI
 */
export function resolveDayNightPoiPresetId(presetId?: string): string {
  switch (presetId) {
    case 'minimal-frontier':
      return 'minimal_frontier';
    case 'minimal_frontier':
      return 'minimal_frontier';
    default:
      return 'minimal_frontier';
  }
}

