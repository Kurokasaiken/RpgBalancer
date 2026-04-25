// src/balancing/config/idleVillage/heatmapConfig.ts
// Config-first heatmap configuration for Idle Village activity density visualization

/**
 * Color palette for heatmap visualization following Gilded Observatory theme.
 */
export interface HeatmapColorPalette {
  /** Color for low density areas (cold) */
  low: string;
  /** Color for medium density areas (warm) */
  medium: string;
  /** Color for high density areas (hot) */
  high: string;
  /** Background color for transparent areas */
  background: string;
  /** Border color for heatmap overlay */
  border: string;
}

/**
 * Thresholds for density calculation and color mapping.
 */
export interface HeatmapThresholds {
  /** Minimum activity count to show any color */
  minActivityThreshold: number;
  /** Activity count for medium density coloring */
  mediumThreshold: number;
  /** Activity count for high density coloring */
  highThreshold: number;
  /** Maximum activity count for color scaling (prevents overflow) */
  maxActivityCount: number;
}

/**
 * Visual rendering configuration for the heatmap overlay.
 */
export interface HeatmapVisualConfig {
  /** Base opacity for the heatmap overlay */
  baseOpacity: number;
  /** Blur radius for smooth transitions */
  blurRadius: number;
  /** Size of each heatmap cell in pixels */
  cellSize: number;
  /** Spacing between cells */
  cellSpacing: number;
  /** Border radius for cells */
  borderRadius: number;
  /** Animation duration for transitions */
  animationDuration: number;
  /** Enable hover effects on cells */
  enableHover: boolean;
  /** Enable pulse animation for active areas */
  enablePulse: boolean;
}

/**
 * Legend configuration for the heatmap display.
 */
export interface HeatmapLegendConfig {
  /** Show legend in the HUD */
  showLegend: boolean;
  /** Legend position relative to HUD */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Legend orientation */
  orientation: 'horizontal' | 'vertical';
  /** Show numeric values in legend */
  showValues: boolean;
  /** Compact mode for small screens */
  compact: boolean;
}

/**
 * Complete heatmap configuration following config-first principles.
 */
export interface HeatmapConfig {
  /** Color palette for visualization */
  colors: HeatmapColorPalette;
  /** Density thresholds for color mapping */
  thresholds: HeatmapThresholds;
  /** Visual rendering settings */
  visual: HeatmapVisualConfig;
  /** Legend display configuration */
  legend: HeatmapLegendConfig;
  /** Enable heatmap by default */
  enabled: boolean;
  /** Update interval in milliseconds (for real-time updates) */
  updateInterval: number;
  /** Enable telemetry for heatmap interactions */
  enableTelemetry: boolean;
}

/**
 * Default heatmap configuration with Gilded Observatory theme colors.
 */
export const DEFAULT_HEATMAP_CONFIG: HeatmapConfig = {
  colors: {
    low: 'rgba(34, 197, 94, 0.3)',      // emerald-500 with low opacity
    medium: 'rgba(251, 191, 36, 0.5)',    // amber-400 with medium opacity
    high: 'rgba(239, 68, 68, 0.7)',      // red-500 with high opacity
    background: 'rgba(0, 0, 0, 0.1)',    // transparent black
    border: 'rgba(251, 191, 36, 0.2)',   // amber-400 with low opacity
  },
  thresholds: {
    minActivityThreshold: 1,
    mediumThreshold: 3,
    highThreshold: 5,
    maxActivityCount: 10,
  },
  visual: {
    baseOpacity: 0.6,
    blurRadius: 8,
    cellSize: 40,
    cellSpacing: 2,
    borderRadius: 4,
    animationDuration: 300,
    enableHover: true,
    enablePulse: true,
  },
  legend: {
    showLegend: true,
    position: 'top-right',
    orientation: 'vertical',
    showValues: true,
    compact: false,
  },
  enabled: true,
  updateInterval: 1000,
  enableTelemetry: true,
};

/**
 * Activity type weights for density calculation.
 * Different activity types can have different impact on the heatmap.
 */
export interface ActivityTypeWeights {
  jobs: number;
  quests: number;
  maintenance: number;
  training: number;
  default: number;
}

/**
 * Default activity type weights.
 */
export const DEFAULT_ACTIVITY_WEIGHTS: ActivityTypeWeights = {
  jobs: 1.0,
  quests: 1.5,        // Quests have higher impact
  maintenance: 0.8,   // Maintenance has lower impact
  training: 0.6,      // Training has lowest impact
  default: 1.0,
};

/**
 * Heatmap data point for a specific map tile.
 */
export interface HeatmapDataPoint {
  /** X coordinate of the tile */
  x: number;
  /** Y coordinate of the tile */
  y: number;
  /** Calculated density value for this tile */
  density: number;
  /** Activity count contributing to this density */
  activityCount: number;
  /** Activity types present in this tile */
  activityTypes: string[];
  /** Color calculated from density */
  color: string;
  /** Whether this tile is currently active (has running activities) */
  isActive: boolean;
}

/**
 * Complete heatmap state for the map overlay.
 */
export interface HeatmapState {
  /** Array of heatmap data points */
  data: HeatmapDataPoint[];
  /** Current configuration */
  config: HeatmapConfig;
  /** Whether heatmap is currently visible */
  isVisible: boolean;
  /** Last update timestamp */
  lastUpdate: number;
  /** Map dimensions for grid calculation */
  mapDimensions: {
    width: number;
    height: number;
    cellSize: number;
    cols: number;
    rows: number;
  };
}

/**
 * Props for useMapHeatmapData hook.
 */
export interface UseMapHeatmapDataProps {
  /** Current village state from TimeEngine */
  villageState: any;
  /** Active HUD state with activities */
  hudState: any;
  /** Current configuration */
  config: HeatmapConfig;
  /** Map dimensions for grid calculation */
  mapDimensions: {
    width: number;
    height: number;
  };
  /** Activity type weights for density calculation */
  activityWeights?: ActivityTypeWeights;
}

/**
 * Calculate density color based on value and thresholds.
 */
export function calculateDensityColor(
  density: number,
  thresholds: HeatmapThresholds,
  colors: HeatmapColorPalette
): string {
  if (density < thresholds.minActivityThreshold) {
    return colors.background;
  }
  
  const normalizedValue = Math.min(density / thresholds.maxActivityCount, 1);
  
  if (density < thresholds.mediumThreshold) {
    // Interpolate between low and medium
    const ratio = (density - thresholds.minActivityThreshold) / (thresholds.mediumThreshold - thresholds.minActivityThreshold);
    return interpolateColor(colors.low, colors.medium, ratio);
  } else if (density < thresholds.highThreshold) {
    // Interpolate between medium and high
    const ratio = (density - thresholds.mediumThreshold) / (thresholds.highThreshold - thresholds.mediumThreshold);
    return interpolateColor(colors.medium, colors.high, ratio);
  } else {
    // Use high color for maximum density
    return colors.high;
  }
}

/**
 * Interpolate between two colors.
 */
function interpolateColor(color1: string, color2: string, ratio: number): string {
  // Simple color interpolation for rgba values
  // This is a basic implementation - can be enhanced for better color blending
  const parseColor = (color: string) => {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/i);
    if (!match) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: parseFloat(match[4]),
    };
  };
  
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);
  
  const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
  const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
  const b = Math.round(c1.b + (c2.b - c1.b) * ratio);
  const a = c1.a + (c2.a - c1.a) * ratio;
  
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
