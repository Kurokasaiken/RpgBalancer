/**
 * Radar Chart Configuration for Phase 10.5 Stat Profile Visualization
 * 
 * Config-first radar chart system for displaying archetype stat profiles
 * with dynamic scaling, color schemes, and interactive features.
 */

import type { BalancerConfig, StatDefinition } from '../../config/types';

/**
 * Radar chart display configuration
 */
export interface RadarChartConfig {
  /** Chart dimensions and sizing */
  dimensions: {
    width: number;
    height: number;
    padding: number;
    centerRadius: number;
    maxRadius: number;
  };
  
  /** Visual styling options */
  visual: {
    /** Color scheme for datasets */
    colorScheme: 'default' | 'warm' | 'cool' | 'monochrome' | 'high-contrast';
    /** Background color */
    backgroundColor: string;
    /** Grid color */
    gridColor: string;
    /** Label color */
    labelColor: string;
    /** Axis color */
    axisColor: string;
    /** Opacity for filled areas */
    fillOpacity: number;
    /** Line width for data lines */
    lineWidth: number;
  };
  
  /** Animation settings */
  animation: {
    /** Enable animations */
    enabled: boolean;
    /** Animation duration in milliseconds */
    duration: number;
    /** Easing function */
    easing: string;
    /** Stagger animation for multiple datasets */
    stagger: boolean;
  };
  
  /** Grid and axis settings */
  grid: {
    /** Number of circular grid levels */
    levels: number;
    /** Show radial grid lines */
    showRadial: boolean;
    /** Show circular grid lines */
    showCircular: boolean;
    /** Grid line style */
    lineStyle: 'solid' | 'dashed' | 'dotted';
    /** Grid dash pattern (for dashed style) */
    dashPattern: number[];
  };
  
  /** Labels and text */
  labels: {
    /** Show stat labels */
    showLabels: boolean;
    /** Font size for labels */
    fontSize: number;
    /** Font family */
    fontFamily: string;
    /** Label distance from edge */
    labelDistance: number;
    /** Show values on labels */
    showValues: boolean;
    /** Value format (decimal, percentage, etc.) */
    valueFormat: 'decimal' | 'percentage' | 'normalized';
  };
  
  /** Interaction settings */
  interaction: {
    /** Enable hover effects */
    enableHover: boolean;
    /** Enable click interactions */
    enableClick: boolean;
    /** Show tooltips */
    showTooltips: boolean;
    /** Highlight on hover */
    highlightOnHover: boolean;
  };
  
  /** Data processing */
  data: {
    /** Maximum number of stats to display */
    maxStats: number;
    /** Minimum stat value for scaling */
    minStatValue: number;
    /** Maximum stat value for scaling */
    maxStatValue: number;
    /** Normalize values to 0-100 scale */
    normalizeValues: boolean;
    /** Show average line */
    showAverage: boolean;
    /** Show baseline archetype */
    showBaseline: boolean;
  };
}

/**
 * Radar chart dataset configuration
 */
export interface RadarChartDataset {
  /** Dataset identifier */
  id: string;
  /** Dataset name for display */
  name: string;
  /** Data values for each stat */
  values: Record<string, number>;
  /** Dataset color */
  color: string;
  /** Fill color (optional) */
  fillColor?: string;
  /** Dataset visibility */
  visible: boolean;
  /** Dataset type */
  type: 'archetype' | 'baseline' | 'average' | 'comparison';
  /** Metadata for tooltips and interactions */
  metadata?: {
    archetypeType?: string;
    score?: number;
    rank?: number;
    description?: string;
  };
}

/**
 * Radar chart stat configuration
 */
export interface RadarChartStat {
  /** Stat identifier */
  id: string;
  /** Display name */
  name: string;
  /** Stat weight from config */
  weight: number;
  /** Stat definition */
  definition: StatDefinition;
  /** Position on radar (angle in degrees) */
  angle: number;
  /** Whether stat is included in visualization */
  included: boolean;
  /** Stat category for grouping */
  category?: string;
}

/**
 * Complete radar chart configuration with processed data
 */
export interface RadarChartState {
  /** Chart configuration */
  config: RadarChartConfig;
  /** Stats to display */
  stats: RadarChartStat[];
  /** Datasets to visualize */
  datasets: RadarChartDataset[];
  /** Selected/highlighted dataset */
  selectedDataset?: string;
  /** Hover state */
  hoverState: {
    statId?: string;
    datasetId?: string;
    x?: number;
    y?: number;
  };
  /** Animation state */
  animationState: {
    isAnimating: boolean;
    progress: number;
    startTime?: number;
  };
}

/**
 * Default radar chart configuration
 */
export const DEFAULT_RADAR_CHART_CONFIG: RadarChartConfig = {
  dimensions: {
    width: 500,
    height: 500,
    padding: 50,
    centerRadius: 20,
    maxRadius: 200,
  },
  
  visual: {
    colorScheme: 'default',
    backgroundColor: 'rgba(15, 23, 42, 0.95)', // slate-900
    gridColor: 'rgba(100, 116, 139, 0.3)', // slate-400
    labelColor: 'rgb(226, 232, 240)', // slate-200
    axisColor: 'rgba(148, 163, 184, 0.5)', // slate-300
    fillOpacity: 0.3,
    lineWidth: 2,
  },
  
  animation: {
    enabled: true,
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    stagger: true,
  },
  
  grid: {
    levels: 5,
    showRadial: true,
    showCircular: true,
    lineStyle: 'solid',
    dashPattern: [5, 5],
  },
  
  labels: {
    showLabels: true,
    fontSize: 12,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    labelDistance: 15,
    showValues: false,
    valueFormat: 'normalized',
  },
  
  interaction: {
    enableHover: true,
    enableClick: true,
    showTooltips: true,
    highlightOnHover: true,
  },
  
  data: {
    maxStats: 12,
    minStatValue: 0,
    maxStatValue: 100,
    normalizeValues: true,
    showAverage: true,
    showBaseline: true,
  },
};

/**
 * Color scheme definitions
 */
export const COLOR_SCHEMES = {
  default: {
    primary: 'rgb(59, 130, 246)', // blue-500
    secondary: 'rgb(16, 185, 129)', // emerald-500
    tertiary: 'rgb(251, 146, 60)', // amber-500
    quaternary: 'rgb(239, 68, 68)', // red-500
    baseline: 'rgb(107, 114, 128)', // gray-500
    average: 'rgb(139, 92, 246)', // violet-500
  },
  
  warm: {
    primary: 'rgb(239, 68, 68)', // red-500
    secondary: 'rgb(251, 146, 60)', // amber-500
    tertiary: 'rgb(251, 191, 36)', // amber-400
    quaternary: 'rgb(245, 158, 11)', // amber-600
    baseline: 'rgb(107, 114, 128)', // gray-500
    average: 'rgb(217, 70, 239)', // purple-500
  },
  
  cool: {
    primary: 'rgb(59, 130, 246)', // blue-500
    secondary: 'rgb(16, 185, 129)', // emerald-500
    tertiary: 'rgb(6, 182, 212)', // cyan-500
    quaternary: 'rgb(139, 92, 246)', // violet-500
    baseline: 'rgb(107, 114, 128)', // gray-500
    average: 'rgb(14, 165, 233)', // sky-500
  },
  
  monochrome: {
    primary: 'rgb(156, 163, 175)', // gray-400
    secondary: 'rgb(107, 114, 128)', // gray-500
    tertiary: 'rgb(75, 85, 99)', // gray-600
    quaternary: 'rgb(55, 65, 81)', // gray-700
    baseline: 'rgb(31, 41, 55)', // gray-800
    average: 'rgb(156, 163, 175)', // gray-400
  },
  
  'high-contrast': {
    primary: 'rgb(255, 255, 255)', // white
    secondary: 'rgb(0, 255, 0)', // lime
    tertiary: 'rgb(255, 255, 0)', // yellow
    quaternary: 'rgb(0, 255, 255)', // cyan
    baseline: 'rgb(128, 128, 128)', // gray
    average: 'rgb(255, 165, 0)', // orange
  },
} as const;

/**
 * Get color scheme by name
 */
export function getColorScheme(scheme: RadarChartConfig['visual']['colorScheme']) {
  return COLOR_SCHEMES[scheme] || COLOR_SCHEMES.default;
}

/**
 * Process balancer config for radar chart display
 */
export function processBalancerConfigForRadar(
  config: BalancerConfig,
  options: {
    maxStats?: number;
    excludeDerived?: boolean;
    categoryFilter?: string[];
  } = {}
): RadarChartStat[] {
  const { maxStats = 12, excludeDerived = true, categoryFilter = [] } = options;
  
  const stats = Object.entries(config.stats)
    .filter(([_, stat]) => {
      // Filter out derived stats if requested
      if (excludeDerived && stat.isDerived) return false;
      
      // Filter by category if specified (using card grouping as category)
      if (categoryFilter.length > 0 && !categoryFilter.includes(stat.id)) {
        return false;
      }
      
      return true;
    })
    .slice(0, maxStats)
    .map(([id, definition], index) => {
      // Calculate angle for even distribution around the circle
      const angle = (index * 360) / Math.min(maxStats, Object.keys(config.stats).length);
      
      return {
        id,
        name: definition.label || id,
        weight: definition.weight || 1,
        definition,
        angle,
        included: true,
        category: definition.id, // Use stat id as category for grouping
      };
    });
  
  return stats;
}
