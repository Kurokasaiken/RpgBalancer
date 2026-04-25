/**
 * Configuration system for Idle Village Map Activity Density Heatmap
 * 
 * This module provides config-first tile weights, color palettes, and thresholds
 * for rendering activity density heatmaps on the village map.
 * 
 * @fileoverview Map heatmap configuration with Style Laboratory colors
 * @module IdleVillageMapHeatmapConfig
 * @since 2026-01-12
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Base configuration for tile weights in heatmap calculation
 */
export interface TileWeights {
  /** Weight for job activities (forest, mine, quarry) */
  jobs: number;
  /** Weight for quest activities */
  quests: number;
  /** Weight for maintenance activities (food, injury) */
  maintenance: number;
  /** Weight for resident presence/traffic */
  residents: number;
}

/**
 * Color palette configuration following Gilded Observatory theme
 */
export interface HeatmapColorPalette {
  /** Color for no activity (transparent) */
  empty: string;
  /** Color for low activity density */
  low: string;
  /** Color for medium activity density */
  medium: string;
  /** Color for high activity density */
  high: string;
  /** Color for maximum activity density */
  maximum: string;
}

/**
 * Threshold configuration for density mapping
 */
export interface HeatmapThresholds {
  /** Minimum value to show any color (exclusive) */
  minThreshold: number;
  /** Low to medium boundary (inclusive) */
  lowThreshold: number;
  /** Medium to high boundary (inclusive) */
  mediumThreshold: number;
  /** High to maximum boundary (inclusive) */
  highThreshold: number;
}

/**
 * Rendering configuration for heatmap overlay
 */
export interface HeatmapRenderingConfig {
  /** Size of each tile in pixels */
  tileSize: number;
  /** Opacity multiplier for overlay (0-1) */
  baseOpacity: number;
  /** Enable smoothing between adjacent tiles */
  enableSmoothing: boolean;
  /** Smoothing factor (0-1, higher = more smoothing) */
  smoothingFactor: number;
  /** Border width between tiles */
  tileBorderWidth: number;
  /** Border color for tiles */
  tileBorderColor: string;
}

/**
 * Performance configuration
 */
export interface HeatmapPerformanceConfig {
  /** Enable caching of aggregated data */
  enableCache: boolean;
  /** Cache TTL in milliseconds */
  cacheTtlMs: number;
  /** Maximum number of cached tile states */
  maxCacheSize: number;
  /** Enable performance telemetry */
  enableTelemetry: boolean;
  /** Frame rate target for rendering */
  targetFps: number;
}

/**
 * Complete heatmap configuration
 */
export interface MapHeatmapConfig {
  /** Tile weights for activity calculation */
  tileWeights: TileWeights;
  /** Color palette for density visualization */
  colorPalette: HeatmapColorPalette;
  /** Thresholds for density mapping */
  thresholds: HeatmapThresholds;
  /** Rendering settings */
  rendering: HeatmapRenderingConfig;
  /** Performance settings */
  performance: HeatmapPerformanceConfig;
  /** Enable/disable heatmap */
  enabled: boolean;
  /** Default visibility state */
  defaultVisible: boolean;
}

/**
 * Zod schema for configuration validation
 */
export const MapHeatmapConfigSchema = z.object({
  tileWeights: z.object({
    jobs: z.number().min(0).max(10),
    quests: z.number().min(0).max(10),
    maintenance: z.number().min(0).max(10),
    residents: z.number().min(0).max(10),
  }),
  colorPalette: z.object({
    empty: z.string().regex(/^#[0-9A-Fa-f]{6}$|^transparent$/),
    low: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    medium: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    high: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    maximum: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  thresholds: z.object({
    minThreshold: z.number().min(0),
    lowThreshold: z.number().min(0),
    mediumThreshold: z.number().min(0),
    highThreshold: z.number().min(0),
  }),
  rendering: z.object({
    tileSize: z.number().min(4).max(64),
    baseOpacity: z.number().min(0).max(1),
    enableSmoothing: z.boolean(),
    smoothingFactor: z.number().min(0).max(1),
    tileBorderWidth: z.number().min(0).max(4),
    tileBorderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  performance: z.object({
    enableCache: z.boolean(),
    cacheTtlMs: z.number().min(1000),
    maxCacheSize: z.number().min(10),
    enableTelemetry: z.boolean(),
    targetFps: z.number().min(15).max(120),
  }),
  enabled: z.boolean(),
  defaultVisible: z.boolean(),
});

/**
 * Default configuration following Gilded Observatory theme
 */
export const DEFAULT_MAP_HEATMAP_CONFIG: MapHeatmapConfig = {
  tileWeights: {
    jobs: 2.0,        // Jobs have moderate weight
    quests: 3.0,      // Quests are important
    maintenance: 1.5, // Maintenance is lower priority
    residents: 1.0,   // Resident traffic has lowest weight
  },
  colorPalette: {
    empty: 'transparent',
    low: 'rgba(139, 179, 165, 0.3)',      // teal-300 with opacity
    medium: 'rgba(139, 179, 165, 0.6)',   // teal-300 with higher opacity
    high: 'rgba(201, 162, 39, 0.7)',      // amber-500 with opacity
    maximum: 'rgba(239, 68, 68, 0.8)',    // red-500 with opacity
  },
  thresholds: {
    minThreshold: 0.1,    // Below this = transparent
    lowThreshold: 0.3,     // 0.1-0.3 = low density
    mediumThreshold: 0.6, // 0.3-0.6 = medium density
    highThreshold: 0.8,   // 0.6-0.8 = high density
    // Above 0.8 = maximum density
  },
  rendering: {
    tileSize: 32,           // 32x32 pixel tiles
    baseOpacity: 0.8,       // Base opacity for overlay
    enableSmoothing: true,  // Smooth transitions between tiles
    smoothingFactor: 0.3,   // Moderate smoothing
    tileBorderWidth: 1,     // Thin borders between tiles
    tileBorderColor: '#3b4b4d', // slate-600 from Gilded theme
  },
  performance: {
    enableCache: true,
    cacheTtlMs: 5000,      // 5 second cache
    maxCacheSize: 100,     // Cache up to 100 tile states
    enableTelemetry: true,
    targetFps: 30,          // Target 30 FPS for smooth rendering
  },
  enabled: true,
  defaultVisible: false,   // Start hidden, user can toggle
};

/**
 * Validates a heatmap configuration
 * 
 * @param config - Configuration to validate
 * @returns Validation result with error details if invalid
 */
export function validateMapHeatmapConfig(config: unknown): {
  isValid: boolean;
  errors?: string[];
} {
  const result = MapHeatmapConfigSchema.safeParse(config);
  
  if (result.success) {
    return { isValid: true };
  }
  
  const errors = result.error.issues.map(issue => 
    `${issue.path.join('.')}: ${issue.message}`
  );
  
  return { isValid: false, errors };
}

/**
 * Gets color for density value based on thresholds
 * 
 * @param density - Normalized density value (0-1)
 * @param palette - Color palette to use
 * @param thresholds - Threshold configuration
 * @returns Color string for the density value
 */
export function getDensityColor(
  density: number,
  palette: HeatmapColorPalette,
  thresholds: HeatmapThresholds
): string {
  if (density <= thresholds.minThreshold) {
    return palette.empty;
  }
  
  if (density <= thresholds.lowThreshold) {
    return palette.low;
  }
  
  if (density <= thresholds.mediumThreshold) {
    return palette.medium;
  }
  
  if (density <= thresholds.highThreshold) {
    return palette.high;
  }
  
  return palette.maximum;
}

/**
 * Type guard for heatmap configuration
 * 
 * @param config - Unknown value to check
 * @returns True if value matches MapHeatmapConfig interface
 */
export function isMapHeatmapConfig(config: unknown): config is MapHeatmapConfig {
  return validateMapHeatmapConfig(config).isValid;
}
