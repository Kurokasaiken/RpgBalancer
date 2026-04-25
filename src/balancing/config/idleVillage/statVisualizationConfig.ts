/**
 * Idle Village Stat Visualization configuration.
 *
 * Provides palette and style tokens for radar/stat visualizations so UI components
 * can stay config-first and avoid hardcoded color definitions.
 */
export interface StatVisualizationPalette {
  /** Color for metrics considered "low" intensity. */
  valueLow: string;
  /** Color for medium intensity metrics. */
  valueMid: string;
  /** Color for high intensity metrics. */
  valueHigh: string;
  /** Colors applied to archetype datasets (cycled). */
  datasetColors: string[];
  /** Color for baseline dataset overlays. */
  baseline: string;
  /** Color for average dataset overlays. */
  average: string;
}

export interface StatVisualizationStyles {
  /** Background fill for svg canvas. */
  background: string;
  /** Grid stroke color. */
  grid: string;
  /** Label text color. */
  label: string;
}

export interface StatVisualizationConfig {
  /** Palettes organized by chart color scheme. */
  palettes: Record<'default' | 'warm' | 'cool' | 'monochrome', StatVisualizationPalette>;
  /** Style tokens shared across color schemes. */
  styles: StatVisualizationStyles;
}

/**
 * Golden Observatory inspired palette pulled from Idle Village style tokens.
 */
export const STAT_VISUALIZATION_CONFIG: StatVisualizationConfig = {
  palettes: {
    default: {
      valueLow: '#F2BE7C',
      valueMid: '#F4973F',
      valueHigh: '#F27052',
      datasetColors: ['#58A6FF', '#58D3B3', '#F2BE7C', '#F26B8A'],
      baseline: '#7C8CA3',
      average: '#BB86FC',
    },
    warm: {
      valueLow: '#F6C177',
      valueMid: '#F79A63',
      valueHigh: '#F26B6B',
      datasetColors: ['#F26B6B', '#F79A63', '#FFD07C', '#F9C5BD'],
      baseline: '#8E7C6E',
      average: '#E88FB1',
    },
    cool: {
      valueLow: '#7AD3FF',
      valueMid: '#49C6B7',
      valueHigh: '#6D8CFF',
      datasetColors: ['#7AD3FF', '#49C6B7', '#6D8CFF', '#9DAAF2'],
      baseline: '#6C7A89',
      average: '#5ED3FF',
    },
    monochrome: {
      valueLow: '#C7CEDB',
      valueMid: '#9DA7BA',
      valueHigh: '#6B7285',
      datasetColors: ['#C7CEDB', '#A5ADBF', '#8B94AB', '#6B7285'],
      baseline: '#4B5563',
      average: '#D1D5DB',
    },
  },
  styles: {
    background: 'rgba(5, 8, 15, 0.92)',
    grid: 'rgba(94, 106, 130, 0.4)',
    label: '#F0F4FF',
  },
};

/**
 * Returns the palette for the requested color scheme, falling back to the default palette.
 */
export function getVisualizationPalette(
  scheme: keyof typeof STAT_VISUALIZATION_CONFIG.palettes
): StatVisualizationPalette {
  return STAT_VISUALIZATION_CONFIG.palettes[scheme] || STAT_VISUALIZATION_CONFIG.palettes.default;
}
