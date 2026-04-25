/**
 * Heatmap Configuration for Stress Testing - NP-123
 * 
 * Config-first palette and threshold definitions for marginal utility heatmaps.
 * Supports ASCII and PNG rendering with configurable color schemes.
 * 
 * @since 2026-01-24
 */

import { z } from 'zod';

/**
 * Color palette for heatmap visualization
 */
export const HeatmapPaletteSchema = z.object({
  weak: z.string(),
  neutral: z.string(),
  strong: z.string(),
  op: z.string(),
  background: z.string(),
  text: z.string(),
  border: z.string(),
  grid: z.string(),
});

export type HeatmapPalette = z.infer<typeof HeatmapPaletteSchema>;

/**
 * Threshold configuration for synergy classification
 */
export const HeatmapThresholdsSchema = z.object({
  weakThreshold: z.number().min(0).max(1),
  neutralLower: z.number().min(0).max(1),
  neutralUpper: z.number().min(0).max(1),
  strongThreshold: z.number().min(1),
  opThreshold: z.number().min(1),
});

export type HeatmapThresholds = z.infer<typeof HeatmapThresholdsSchema>;

/**
 * ASCII rendering configuration
 */
export const ASCIIRenderConfigSchema = z.object({
  cellWidth: z.number().int().positive(),
  cellHeight: z.number().int().positive(),
  showLabels: z.boolean(),
  showLegend: z.boolean(),
  showGrid: z.boolean(),
  compactMode: z.boolean(),
  colorMode: z.enum(['ansi', 'plain', 'unicode']),
});

export type ASCIIRenderConfig = z.infer<typeof ASCIIRenderConfigSchema>;

/**
 * PNG rendering configuration
 */
export const PNGRenderConfigSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  cellSize: z.number().int().positive(),
  fontSize: z.number().int().positive(),
  showLabels: z.boolean(),
  showLegend: z.boolean(),
  showGrid: z.boolean(),
  showValues: z.boolean(),
  antiAlias: z.boolean(),
});

export type PNGRenderConfig = z.infer<typeof PNGRenderConfigSchema>;

/**
 * Main heatmap configuration
 */
export const HeatmapConfigSchema = z.object({
  palette: HeatmapPaletteSchema,
  thresholds: HeatmapThresholdsSchema,
  ascii: ASCIIRenderConfigSchema,
  png: PNGRenderConfigSchema,
  title: z.string(),
  subtitle: z.string().optional(),
  showTimestamp: z.boolean(),
  sortBy: z.enum(['alphabetical', 'winRate', 'synergy', 'custom']),
  highlightOP: z.boolean(),
  highlightWeak: z.boolean(),
});

export type HeatmapConfig = z.infer<typeof HeatmapConfigSchema>;

/**
 * Default color palette (Gilded Observatory theme)
 */
export const DEFAULT_HEATMAP_PALETTE: HeatmapPalette = {
  weak: '#ef4444',        // red-500 - weak synergies (<0.95)
  neutral: '#6b7280',     // gray-500 - neutral (0.95-1.05)
  strong: '#10b981',      // green-500 - strong (1.05-1.15)
  op: '#f59e0b',          // amber-500 - OP synergies (>1.15)
  background: '#1e293b',  // slate-800
  text: '#f1f5f9',        // slate-100
  border: '#475569',      // slate-600
  grid: '#334155',        // slate-700
};

/**
 * Default thresholds based on Phase 10.5 spec
 */
export const DEFAULT_HEATMAP_THRESHOLDS: HeatmapThresholds = {
  weakThreshold: 0.95,    // Below this = weak synergy
  neutralLower: 0.95,     // Neutral range lower bound
  neutralUpper: 1.05,     // Neutral range upper bound
  strongThreshold: 1.05,  // Above this = strong synergy
  opThreshold: 1.15,      // Above this = OP synergy
};

/**
 * Default ASCII rendering configuration
 */
export const DEFAULT_ASCII_CONFIG: ASCIIRenderConfig = {
  cellWidth: 8,
  cellHeight: 3,
  showLabels: true,
  showLegend: true,
  showGrid: true,
  compactMode: false,
  colorMode: 'ansi',
};

/**
 * Default PNG rendering configuration
 */
export const DEFAULT_PNG_CONFIG: PNGRenderConfig = {
  width: 1200,
  height: 1200,
  cellSize: 80,
  fontSize: 12,
  showLabels: true,
  showLegend: true,
  showGrid: true,
  showValues: true,
  antiAlias: true,
};

/**
 * Default heatmap configuration
 */
export const DEFAULT_HEATMAP_CONFIG: HeatmapConfig = {
  palette: DEFAULT_HEATMAP_PALETTE,
  thresholds: DEFAULT_HEATMAP_THRESHOLDS,
  ascii: DEFAULT_ASCII_CONFIG,
  png: DEFAULT_PNG_CONFIG,
  title: 'Marginal Utility Heatmap',
  subtitle: 'Phase 10.5 Stress Testing Results',
  showTimestamp: true,
  sortBy: 'alphabetical',
  highlightOP: true,
  highlightWeak: true,
};

/**
 * ASCII color codes for ANSI mode
 */
export const ANSI_COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
  
  // Bright foreground
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
} as const;

/**
 * Unicode box drawing characters
 */
export const BOX_CHARS = {
  horizontal: '─',
  vertical: '│',
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  cross: '┼',
  teeDown: '┬',
  teeUp: '┴',
  teeRight: '├',
  teeLeft: '┤',
  
  // Double lines
  doubleHorizontal: '═',
  doubleVertical: '║',
  doubleTopLeft: '╔',
  doubleTopRight: '╗',
  doubleBottomLeft: '╚',
  doubleBottomRight: '╝',
} as const;

/**
 * Utility: Get color for synergy multiplier
 */
export function getColorForMultiplier(
  multiplier: number,
  config: HeatmapConfig = DEFAULT_HEATMAP_CONFIG
): string {
  const { thresholds, palette } = config;
  
  if (multiplier >= thresholds.opThreshold) return palette.op;
  if (multiplier >= thresholds.strongThreshold) return palette.strong;
  if (multiplier <= thresholds.weakThreshold) return palette.weak;
  return palette.neutral;
}

/**
 * Utility: Get ANSI color code for synergy multiplier
 */
export function getANSIColorForMultiplier(
  multiplier: number,
  config: HeatmapConfig = DEFAULT_HEATMAP_CONFIG
): string {
  const { thresholds } = config;
  
  if (multiplier >= thresholds.opThreshold) return ANSI_COLORS.brightYellow;
  if (multiplier >= thresholds.strongThreshold) return ANSI_COLORS.brightGreen;
  if (multiplier <= thresholds.weakThreshold) return ANSI_COLORS.brightRed;
  return ANSI_COLORS.white;
}

/**
 * Utility: Get classification label for synergy
 */
export function getClassificationLabel(
  multiplier: number,
  config: HeatmapConfig = DEFAULT_HEATMAP_CONFIG
): 'OP' | 'Strong' | 'Neutral' | 'Weak' {
  const { thresholds } = config;
  
  if (multiplier >= thresholds.opThreshold) return 'OP';
  if (multiplier >= thresholds.strongThreshold) return 'Strong';
  if (multiplier <= thresholds.weakThreshold) return 'Weak';
  return 'Neutral';
}

/**
 * Utility: Format multiplier for display
 */
export function formatMultiplier(multiplier: number, decimals: number = 2): string {
  return multiplier.toFixed(decimals);
}

/**
 * Utility: Validate heatmap configuration
 */
export function validateHeatmapConfig(
  config: unknown
): { valid: boolean; errors: string[] } {
  const result = HeatmapConfigSchema.safeParse(config);
  
  if (result.success) {
    return { valid: true, errors: [] };
  }
  
  return {
    valid: false,
    errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`),
  };
}

/**
 * Utility: Create custom palette from hex colors
 */
export function createCustomPalette(colors: {
  weak: string;
  neutral: string;
  strong: string;
  op: string;
}): HeatmapPalette {
  return {
    ...colors,
    background: DEFAULT_HEATMAP_PALETTE.background,
    text: DEFAULT_HEATMAP_PALETTE.text,
    border: DEFAULT_HEATMAP_PALETTE.border,
    grid: DEFAULT_HEATMAP_PALETTE.grid,
  };
}

/**
 * Utility: Create config with custom thresholds
 */
export function createConfigWithThresholds(
  weakThreshold: number,
  opThreshold: number
): HeatmapConfig {
  return {
    ...DEFAULT_HEATMAP_CONFIG,
    thresholds: {
      weakThreshold,
      neutralLower: weakThreshold,
      neutralUpper: 1.0 + (opThreshold - 1.0) / 2,
      strongThreshold: 1.0 + (opThreshold - 1.0) / 2,
      opThreshold,
    },
  };
}
