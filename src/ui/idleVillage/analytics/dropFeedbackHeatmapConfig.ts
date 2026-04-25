/**
 * Drop Feedback Heatmap Configuration
 * 
 * Config-first design for heatmap visualization using Style Laboratory colors.
 * Defines color gradients, bucket thresholds, and display options.
 * 
 * @module idleVillage/analytics/dropFeedbackHeatmapConfig
 */

/**
 * Color gradient configuration for heatmap cells
 */
export interface HeatmapGradientConfig {
  /** Minimum value color (cold) */
  minColor: string;
  /** Maximum value color (hot) */
  maxColor: string;
  /** Intermediate gradient stops */
  stops?: Array<{ value: number; color: string }>;
}

/**
 * Bucket configuration for aggregating feedback counts
 */
export interface HeatmapBucketConfig {
  /** Minimum count for this bucket */
  min: number;
  /** Maximum count for this bucket (exclusive) */
  max: number;
  /** Label for this bucket */
  label: string;
  /** Color for this bucket */
  color: string;
}

/**
 * Complete heatmap configuration
 */
export interface DropFeedbackHeatmapConfig {
  /** Color gradients for each feedback type */
  gradients: {
    valid: HeatmapGradientConfig;
    invalid: HeatmapGradientConfig;
    warning: HeatmapGradientConfig;
    blocked: HeatmapGradientConfig;
    combined: HeatmapGradientConfig;
  };
  /** Bucket definitions for categorizing counts */
  buckets: HeatmapBucketConfig[];
  /** Display options */
  display: {
    /** Show cell values as text */
    showValues: boolean;
    /** Show legend */
    showLegend: boolean;
    /** Cell size in pixels */
    cellSize: number;
    /** Gap between cells in pixels */
    cellGap: number;
    /** Border radius for cells */
    borderRadius: number;
    /** Font size for cell values */
    fontSize: number;
  };
  /** Export options */
  export: {
    /** Include ASCII representation in exports */
    includeASCII: boolean;
    /** Directory for exports */
    exportDir: string;
  };
}

/**
 * Default heatmap configuration using Style Laboratory colors
 */
export const DEFAULT_HEATMAP_CONFIG: DropFeedbackHeatmapConfig = {
  gradients: {
    valid: {
      minColor: 'rgb(220, 252, 231)', // green-100
      maxColor: 'rgb(22, 163, 74)',   // green-600
      stops: [
        { value: 0.25, color: 'rgb(187, 247, 208)' }, // green-200
        { value: 0.5, color: 'rgb(134, 239, 172)' },  // green-300
        { value: 0.75, color: 'rgb(74, 222, 128)' },  // green-400
      ],
    },
    invalid: {
      minColor: 'rgb(254, 226, 226)', // red-100
      maxColor: 'rgb(220, 38, 38)',   // red-600
      stops: [
        { value: 0.25, color: 'rgb(254, 202, 202)' }, // red-200
        { value: 0.5, color: 'rgb(252, 165, 165)' },  // red-300
        { value: 0.75, color: 'rgb(248, 113, 113)' }, // red-400
      ],
    },
    warning: {
      minColor: 'rgb(254, 243, 199)', // amber-100
      maxColor: 'rgb(217, 119, 6)',   // amber-600
      stops: [
        { value: 0.25, color: 'rgb(253, 230, 138)' }, // amber-200
        { value: 0.5, color: 'rgb(252, 211, 77)' },   // amber-300
        { value: 0.75, color: 'rgb(251, 191, 36)' },  // amber-400
      ],
    },
    blocked: {
      minColor: 'rgb(241, 245, 249)', // slate-100
      maxColor: 'rgb(71, 85, 105)',   // slate-600
      stops: [
        { value: 0.25, color: 'rgb(226, 232, 240)' }, // slate-200
        { value: 0.5, color: 'rgb(203, 213, 225)' },  // slate-300
        { value: 0.75, color: 'rgb(148, 163, 184)' }, // slate-400
      ],
    },
    combined: {
      minColor: 'rgb(243, 244, 246)', // gray-100
      maxColor: 'rgb(31, 41, 55)',    // gray-800
      stops: [
        { value: 0.25, color: 'rgb(229, 231, 235)' }, // gray-200
        { value: 0.5, color: 'rgb(209, 213, 219)' },  // gray-300
        { value: 0.75, color: 'rgb(156, 163, 175)' }, // gray-400
      ],
    },
  },
  buckets: [
    { min: 0, max: 1, label: 'None', color: 'rgb(243, 244, 246)' },      // gray-100
    { min: 1, max: 5, label: 'Low', color: 'rgb(187, 247, 208)' },       // green-200
    { min: 5, max: 20, label: 'Medium', color: 'rgb(251, 191, 36)' },    // amber-400
    { min: 20, max: 50, label: 'High', color: 'rgb(248, 113, 113)' },    // red-400
    { min: 50, max: Infinity, label: 'Critical', color: 'rgb(220, 38, 38)' }, // red-600
  ],
  display: {
    showValues: true,
    showLegend: true,
    cellSize: 60,
    cellGap: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  export: {
    includeASCII: true,
    exportDir: 'data/exports/idleVillage',
  },
};

/**
 * Get color for a given value using gradient configuration
 * 
 * @param value - Normalized value (0-1)
 * @param gradient - Gradient configuration
 * @returns RGB color string
 */
export function getGradientColor(value: number, gradient: HeatmapGradientConfig): string {
  // Clamp value to 0-1
  const clampedValue = Math.max(0, Math.min(1, value));

  if (clampedValue === 0) return gradient.minColor;
  if (clampedValue === 1) return gradient.maxColor;

  // Find appropriate gradient stop
  if (gradient.stops) {
    for (let i = 0; i < gradient.stops.length; i++) {
      const stop = gradient.stops[i];
      if (clampedValue <= stop.value) {
        const prevStop = i === 0 
          ? { value: 0, color: gradient.minColor }
          : gradient.stops[i - 1];
        
        // Interpolate between stops
        const range = stop.value - prevStop.value;
        const position = (clampedValue - prevStop.value) / range;
        
        return interpolateColor(prevStop.color, stop.color, position);
      }
    }
  }

  // Fallback: interpolate between min and max
  return interpolateColor(gradient.minColor, gradient.maxColor, clampedValue);
}

/**
 * Interpolate between two RGB colors
 * 
 * @param color1 - Start color (rgb string)
 * @param color2 - End color (rgb string)
 * @param position - Position between colors (0-1)
 * @returns Interpolated RGB color string
 */
function interpolateColor(color1: string, color2: string, position: number): string {
  const rgb1 = parseRGB(color1);
  const rgb2 = parseRGB(color2);

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * position);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * position);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * position);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Parse RGB string to components
 * 
 * @param rgbString - RGB color string
 * @returns RGB components
 */
function parseRGB(rgbString: string): { r: number; g: number; b: number } {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) {
    return { r: 0, g: 0, b: 0 };
  }

  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
  };
}

/**
 * Get bucket for a given count value
 * 
 * @param count - Feedback count
 * @param buckets - Bucket configuration
 * @returns Matching bucket or undefined
 */
export function getBucketForCount(
  count: number,
  buckets: HeatmapBucketConfig[]
): HeatmapBucketConfig | undefined {
  return buckets.find(bucket => count >= bucket.min && count < bucket.max);
}

/**
 * Generate ASCII representation of heatmap
 * 
 * @param data - Heatmap data matrix
 * @param labels - Row/column labels
 * @returns ASCII string representation
 */
export function generateASCIIHeatmap(
  data: number[][],
  labels: { rows: string[]; cols: string[] }
): string {
  const maxValue = Math.max(...data.flat());
  const chars = [' ', '░', '▒', '▓', '█'];

  let ascii = '    ';
  labels.cols.forEach(col => {
    ascii += col.padEnd(4);
  });
  ascii += '\n';

  data.forEach((row, i) => {
    ascii += labels.rows[i].padEnd(4);
    row.forEach(value => {
      const normalized = maxValue > 0 ? value / maxValue : 0;
      const charIndex = Math.floor(normalized * (chars.length - 1));
      ascii += chars[charIndex].repeat(3) + ' ';
    });
    ascii += '\n';
  });

  return ascii;
}
