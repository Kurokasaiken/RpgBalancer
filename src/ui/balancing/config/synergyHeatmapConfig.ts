/**
 * Synergy Heatmap Configuration for Balancer
 * 
 * Config-first settings for synergy heatmap visualization, including
 * color schemes, thresholds, filters, and export options.
 * 
 * @since NP-038 – Balancer Archetype Synergy Heatmap UI
 */

import { z } from 'zod';

/**
 * Color scheme options for the heatmap
 */
export type SynergyColorScheme = 'warm' | 'cool' | 'monochrome' | 'gilded';

/**
 * Synergy rating levels
 */
export type SynergyRating = 'op' | 'strong' | 'balanced' | 'weak' | 'underpowered' | 'neutral';

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv' | 'markdown';

/**
 * Filter options for synergy data
 */
export interface SynergyFilterOptions {
  /** Minimum synergy multiplier */
  minMultiplier: number;
  /** Maximum synergy multiplier */
  maxMultiplier: number;
  /** Filter by synergy rating */
  rating: 'all' | SynergyRating;
  /** Filter by archetype pairs */
  archetypePairs: Array<[string, string]>;
  /** Filter by stat pairs */
  statPairs: Array<[string, string]>;
  /** Sort order */
  sortBy: 'multiplier' | 'score' | 'archetype1' | 'archetype2' | 'stat1' | 'stat2';
  /** Sort direction */
  sortDirection: 'asc' | 'desc';
  /** Search query */
  searchQuery: string;
}

/**
 * Color configuration for different synergy levels
 */
export interface SynergyColorConfig {
  /** Background color */
  bg: string;
  /** Border color */
  border: string;
  /** Text color */
  text: string;
  /** Hover background color */
  hoverBg?: string;
  /** Selected background color */
  selectedBg?: string;
}

/**
 * Color scheme definitions
 */
export interface SynergyColorSchemeConfig {
  /** Color for OP synergies */
  op: SynergyColorConfig;
  /** Color for strong synergies */
  strong: SynergyColorConfig;
  /** Color for balanced synergies */
  balanced: SynergyColorConfig;
  /** Color for weak synergies */
  weak: SynergyColorConfig;
  /** Color for underpowered synergies */
  underpowered: SynergyColorConfig;
  /** Color for neutral/no data */
  neutral: SynergyColorConfig;
}

/**
 * Threshold configuration for synergy ratings
 */
export interface SynergyThresholdConfig {
  /** OP synergy threshold */
  opThreshold: number;
  /** Strong synergy threshold */
  strongThreshold: number;
  /** Weak synergy threshold */
  weakThreshold: number;
  /** Underpowered synergy threshold */
  underpoweredThreshold: number;
}

/**
 * Interaction configuration
 */
export interface SynergyInteractionConfig {
  /** Enable cell hover tooltips */
  enableTooltips: boolean;
  /** Enable cell selection */
  enableSelection: boolean;
  /** Enable cell clicking */
  enableClicking: boolean;
  /** Debounce time for hover events (ms) */
  hoverDebounceMs: number;
  /** Animation duration for transitions (ms) */
  animationDurationMs: number;
  /** Maximum cells to render without virtualization */
  maxNonVirtualizedCells: number;
}

/**
 * Export configuration
 */
export interface SynergyExportConfig {
  /** Available export formats */
  formats: ExportFormat[];
  /** Include metadata in exports */
  includeMetadata: boolean;
  /** Include statistics in exports */
  includeStatistics: boolean;
  /** Include raw data in exports */
  includeRawData: boolean;
  /** CSV delimiter */
  csvDelimiter: string;
  /** JSON indentation spaces */
  jsonIndent: number;
  /** Export filename template */
  filenameTemplate: string;
}

/**
 * Performance configuration
 */
export interface SynergyPerformanceConfig {
  /** Enable virtual scrolling for large datasets */
  enableVirtualization: boolean;
  /** Cell size in pixels */
  cellSize: number;
  /** Maximum visible rows */
  maxVisibleRows: number;
  /** Maximum visible columns */
  maxVisibleColumns: number;
  /** Debounce time for filter updates (ms) */
  filterDebounceMs: number;
  /** Enable memoization */
  enableMemoization: boolean;
}

/**
 * Complete synergy heatmap configuration
 */
export interface SynergyHeatmapConfig {
  /** Color scheme to use */
  colorScheme: SynergyColorScheme;
  /** Color definitions */
  colors: SynergyColorSchemeConfig;
  /** Threshold values */
  thresholds: SynergyThresholdConfig;
  /** Interaction settings */
  interactions: SynergyInteractionConfig;
  /** Export settings */
  export: SynergyExportConfig;
  /** Performance settings */
  performance: SynergyPerformanceConfig;
  /** Default filter options */
  defaultFilters: SynergyFilterOptions;
}

/**
 * Zod schema for synergy filter options
 */
export const SynergyFilterOptionsSchema = z.object({
  minMultiplier: z.number().min(0).max(10).default(0),
  maxMultiplier: z.number().min(0).max(10).default(10),
  rating: z.enum(['all', 'op', 'strong', 'balanced', 'weak', 'underpowered', 'neutral']).default('all'),
  archetypePairs: z.array(z.tuple([z.string(), z.string()])).default([]),
  statPairs: z.array(z.tuple([z.string(), z.string()])).default([]),
  sortBy: z.enum(['multiplier', 'score', 'archetype1', 'archetype2', 'stat1', 'stat2']).default('multiplier'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
  searchQuery: z.string().default(''),
});

/**
 * Zod schema for color configuration
 */
export const SynergyColorConfigSchema = z.object({
  bg: z.string(),
  border: z.string(),
  text: z.string(),
  hoverBg: z.string().optional(),
  selectedBg: z.string().optional(),
});

/**
 * Zod schema for color scheme configuration
 */
export const SynergyColorSchemeConfigSchema = z.object({
  op: SynergyColorConfigSchema,
  strong: SynergyColorConfigSchema,
  balanced: SynergyColorConfigSchema,
  weak: SynergyColorConfigSchema,
  underpowered: SynergyColorConfigSchema,
  neutral: SynergyColorConfigSchema,
});

/**
 * Zod schema for threshold configuration
 */
export const SynergyThresholdConfigSchema = z.object({
  opThreshold: z.number().min(1).max(5).default(1.15),
  strongThreshold: z.number().min(1).max(2).default(1.05),
  weakThreshold: z.number().min(0.5).max(1).default(0.95),
  underpoweredThreshold: z.number().min(0).max(1).default(0.85),
});

/**
 * Zod schema for interaction configuration
 */
export const SynergyInteractionConfigSchema = z.object({
  enableTooltips: z.boolean().default(true),
  enableSelection: z.boolean().default(true),
  enableClicking: z.boolean().default(true),
  hoverDebounceMs: z.number().min(0).max(1000).default(50),
  animationDurationMs: z.number().min(0).max(1000).default(200),
  maxNonVirtualizedCells: z.number().min(100).max(10000).default(2500),
});

/**
 * Zod schema for export configuration
 */
export const SynergyExportConfigSchema = z.object({
  formats: z.array(z.enum(['json', 'csv', 'markdown'])).default(['json', 'csv']),
  includeMetadata: z.boolean().default(true),
  includeStatistics: z.boolean().default(true),
  includeRawData: z.boolean().default(true),
  csvDelimiter: z.string().default(','),
  jsonIndent: z.number().min(0).max(8).default(2),
  filenameTemplate: z.string().default('synergy-heatmap-{timestamp}'),
});

/**
 * Zod schema for performance configuration
 */
export const SynergyPerformanceConfigSchema = z.object({
  enableVirtualization: z.boolean().default(true),
  cellSize: z.number().min(20).max(100).default(40),
  maxVisibleRows: z.number().min(10).max(200).default(50),
  maxVisibleColumns: z.number().min(10).max(200).default(50),
  filterDebounceMs: z.number().min(0).max(1000).default(300),
  enableMemoization: z.boolean().default(true),
});

/**
 * Zod schema for complete synergy heatmap configuration
 */
export const SynergyHeatmapConfigSchema = z.object({
  colorScheme: z.enum(['warm', 'cool', 'monochrome', 'gilded']).default('gilded'),
  colors: SynergyColorSchemeConfigSchema,
  thresholds: SynergyThresholdConfigSchema,
  interactions: SynergyInteractionConfigSchema,
  export: SynergyExportConfigSchema,
  performance: SynergyPerformanceConfigSchema,
  defaultFilters: SynergyFilterOptionsSchema,
});

/**
 * Gilded Observatory color scheme
 */
export const GILDED_COLOR_SCHEME: SynergyColorSchemeConfig = {
  op: {
    bg: 'rgba(239, 68, 68, 0.8)',
    border: 'rgb(239, 68, 68)',
    text: 'white',
    hoverBg: 'rgba(239, 68, 68, 0.9)',
    selectedBg: 'rgba(239, 68, 68, 1)',
  },
  strong: {
    bg: 'rgba(251, 146, 60, 0.8)',
    border: 'rgb(251, 146, 60)',
    text: 'white',
    hoverBg: 'rgba(251, 146, 60, 0.9)',
    selectedBg: 'rgba(251, 146, 60, 1)',
  },
  balanced: {
    bg: 'rgba(34, 197, 94, 0.8)',
    border: 'rgb(34, 197, 94)',
    text: 'white',
    hoverBg: 'rgba(34, 197, 94, 0.9)',
    selectedBg: 'rgba(34, 197, 94, 1)',
  },
  weak: {
    bg: 'rgba(59, 130, 246, 0.8)',
    border: 'rgb(59, 130, 246)',
    text: 'white',
    hoverBg: 'rgba(59, 130, 246, 0.9)',
    selectedBg: 'rgba(59, 130, 246, 1)',
  },
  underpowered: {
    bg: 'rgba(147, 51, 234, 0.8)',
    border: 'rgb(147, 51, 234)',
    text: 'white',
    hoverBg: 'rgba(147, 51, 234, 0.9)',
    selectedBg: 'rgba(147, 51, 234, 1)',
  },
  neutral: {
    bg: 'rgba(107, 114, 128, 0.4)',
    border: 'rgb(107, 114, 128)',
    text: 'white',
    hoverBg: 'rgba(107, 114, 128, 0.5)',
    selectedBg: 'rgba(107, 114, 128, 0.6)',
  },
};

/**
 * Warm color scheme
 */
export const WARM_COLOR_SCHEME: SynergyColorSchemeConfig = {
  op: { bg: 'rgba(220, 38, 38, 0.8)', border: 'rgb(220, 38, 38)', text: 'white' },
  strong: { bg: 'rgba(249, 115, 22, 0.8)', border: 'rgb(249, 115, 22)', text: 'white' },
  balanced: { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgb(245, 158, 11)', text: 'white' },
  weak: { bg: 'rgba(251, 191, 36, 0.8)', border: 'rgb(251, 191, 36)', text: 'black' },
  underpowered: { bg: 'rgba(254, 240, 138, 0.8)', border: 'rgb(254, 240, 138)', text: 'black' },
  neutral: { bg: 'rgba(229, 231, 235, 0.4)', border: 'rgb(229, 231, 235)', text: 'black' },
};

/**
 * Cool color scheme
 */
export const COOL_COLOR_SCHEME: SynergyColorSchemeConfig = {
  op: { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgb(59, 130, 246)', text: 'white' },
  strong: { bg: 'rgba(99, 102, 241, 0.8)', border: 'rgb(99, 102, 241)', text: 'white' },
  balanced: { bg: 'rgba(139, 92, 246, 0.8)', border: 'rgb(139, 92, 246)', text: 'white' },
  weak: { bg: 'rgba(168, 85, 247, 0.8)', border: 'rgb(168, 85, 247)', text: 'white' },
  underpowered: { bg: 'rgba(196, 181, 253, 0.8)', border: 'rgb(196, 181, 253)', text: 'black' },
  neutral: { bg: 'rgba(229, 231, 235, 0.4)', border: 'rgb(229, 231, 235)', text: 'black' },
};

/**
 * Monochrome color scheme
 */
export const MONOCHROME_COLOR_SCHEME: SynergyColorSchemeConfig = {
  op: { bg: 'rgba(17, 24, 39, 0.9)', border: 'rgb(17, 24, 39)', text: 'white' },
  strong: { bg: 'rgba(31, 41, 55, 0.8)', border: 'rgb(31, 41, 55)', text: 'white' },
  balanced: { bg: 'rgba(75, 85, 99, 0.8)', border: 'rgb(75, 85, 99)', text: 'white' },
  weak: { bg: 'rgba(156, 163, 175, 0.8)', border: 'rgb(156, 163, 175)', text: 'black' },
  underpowered: { bg: 'rgba(209, 213, 219, 0.8)', border: 'rgb(209, 213, 219)', text: 'black' },
  neutral: { bg: 'rgba(243, 244, 246, 0.4)', border: 'rgb(243, 244, 246)', text: 'black' },
};

/**
 * Get color scheme by name
 */
export function getColorScheme(scheme: SynergyColorScheme): SynergyColorSchemeConfig {
  switch (scheme) {
    case 'gilded':
      return GILDED_COLOR_SCHEME;
    case 'warm':
      return WARM_COLOR_SCHEME;
    case 'cool':
      return COOL_COLOR_SCHEME;
    case 'monochrome':
      return MONOCHROME_COLOR_SCHEME;
    default:
      return GILDED_COLOR_SCHEME;
  }
}

/**
 * Get synergy rating from multiplier
 */
export function getSynergyRating(
  multiplier: number,
  thresholds: SynergyThresholdConfig
): SynergyRating {
  if (multiplier >= thresholds.opThreshold) return 'op';
  if (multiplier >= thresholds.strongThreshold) return 'strong';
  if (multiplier >= thresholds.weakThreshold) return 'balanced';
  if (multiplier >= thresholds.underpoweredThreshold) return 'weak';
  return 'underpowered';
}

/**
 * Default synergy heatmap configuration
 */
export const DEFAULT_SYNERGY_HEATMAP_CONFIG: SynergyHeatmapConfig = {
  colorScheme: 'gilded',
  colors: GILDED_COLOR_SCHEME,
  thresholds: {
    opThreshold: 1.15,
    strongThreshold: 1.05,
    weakThreshold: 0.95,
    underpoweredThreshold: 0.85,
  },
  interactions: {
    enableTooltips: true,
    enableSelection: true,
    enableClicking: true,
    hoverDebounceMs: 50,
    animationDurationMs: 200,
    maxNonVirtualizedCells: 2500,
  },
  export: {
    formats: ['json', 'csv', 'markdown'],
    includeMetadata: true,
    includeStatistics: true,
    includeRawData: true,
    csvDelimiter: ',',
    jsonIndent: 2,
    filenameTemplate: 'synergy-heatmap-{timestamp}',
  },
  performance: {
    enableVirtualization: true,
    cellSize: 40,
    maxVisibleRows: 50,
    maxVisibleColumns: 50,
    filterDebounceMs: 300,
    enableMemoization: true,
  },
  defaultFilters: {
    minMultiplier: 0,
    maxMultiplier: 10,
    rating: 'all' as const,
    archetypePairs: [] as [string, string][],
    statPairs: [] as [string, string][],
    sortBy: 'multiplier' as const,
    sortDirection: 'desc' as const,
    searchQuery: '',
  },
};

/**
 * Type guard for configuration validation
 */
export function isValidSynergyHeatmapConfig(config: unknown): config is SynergyHeatmapConfig {
  return SynergyHeatmapConfigSchema.safeParse(config).success;
}

/**
 * Create a safe configuration with defaults
 */
export function createSafeSynergyHeatmapConfig(
  config: Partial<SynergyHeatmapConfig> = {}
): SynergyHeatmapConfig {
  const result = SynergyHeatmapConfigSchema.safeParse({
    ...DEFAULT_SYNERGY_HEATMAP_CONFIG,
    ...config,
  });
  
  if (result.success) {
    return result.data;
  }
  
  // Fallback to defaults if validation fails
  console.error('Invalid synergy heatmap config:', result.error);
  return DEFAULT_SYNERGY_HEATMAP_CONFIG;
}
