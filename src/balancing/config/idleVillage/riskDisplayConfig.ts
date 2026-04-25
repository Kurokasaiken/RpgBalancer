/**
 * Quest Risk Display Configuration
 * 
 * Config-first settings for quest risk visualization including polygon stripes,
 * color mappings, and telemetry configuration. All values are configurable
 * to enable designers to tune risk display behavior without code changes.
 * 
 * @since IV-QuestRisk-stripes
 */

import { z } from 'zod';

/**
 * Color configuration for risk display using Style Laboratory tokens.
 */
export interface RiskColorConfig {
  /** Color for injury risk stripe (yellow/orange spectrum) */
  injuryColor: string;
  /** Color for death risk stripe (red spectrum) */
  deathColor: string;
  /** Background color for the risk polygon */
  backgroundColor: string;
  /** Border color for the risk polygon */
  borderColor: string;
  /** Color for zero-risk fallback state */
  zeroRiskColor: string;
}

/**
 * Polygon stripe rendering configuration.
 */
export interface RiskPolygonConfig {
  /** Number of sides for the risk polygon */
  polygonSides: number;
  /** Radius of the risk polygon in pixels */
  polygonRadius: number;
  /** Width of each stripe as percentage of polygon radius */
  stripeWidthPercent: number;
  /** Spacing between stripes as percentage of polygon radius */
  stripeSpacingPercent: number;
  /** Minimum stripe length in pixels (for very small percentages) */
  minStripeLengthPx: number;
  /** Maximum stripe length in pixels (capped at 100%) */
  maxStripeLengthPx: number;
  /** Border radius for stripe corners */
  stripeBorderRadius: string;
}

/**
 * Animation and interaction configuration.
 */
export interface RiskAnimationConfig {
  /** Whether to enable stripe animations */
  enabled: boolean;
  /** Animation duration in milliseconds */
  durationMs: number;
  /** Easing function for animations */
  easing: string;
  /** Whether stripes are clickable for detailed info */
  clickableStripes: boolean;
  /** Hover effect configuration */
  hover: {
    enabled: boolean;
    scale: number;
    opacity: number;
  };
}

/**
 * Telemetry configuration for risk display tracking.
 */
export interface RiskTelemetryConfig {
  /** Whether to enable telemetry tracking */
  enabled: boolean;
  /** Telemetry event prefix */
  eventPrefix: string;
  /** Whether to track stripe clicks */
  trackClicks: boolean;
  /** Whether to track hover events */
  trackHovers: boolean;
  /** Whether to track render events */
  trackRenders: boolean;
}

/**
 * Smoothing curve configuration for visual enhancement.
 */
export interface RiskSmoothingConfig {
  /** Whether to apply smoothing to stripe heights */
  enableSmoothing: boolean;
  /** Smoothing factor (0-1, higher = more smoothing) */
  smoothingFactor: number;
  /** Minimum percentage to apply smoothing (below this, use linear) */
  smoothingThresholdPercent: number;
  /** Type of easing function for smoothing */
  easingType: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

/**
 * Complete risk display configuration.
 */
export interface RiskDisplayConfig {
  /** Color configuration for risk visualization */
  colors: RiskColorConfig;
  /** Polygon and stripe rendering settings */
  polygon: RiskPolygonConfig;
  /** Animation and interaction settings */
  animation: RiskAnimationConfig;
  /** Telemetry tracking configuration */
  telemetry: RiskTelemetryConfig;
  /** Whether to show percentage labels */
  showPercentageLabels: boolean;
  /** Whether to show risk stripes for very low values (< 1%) */
  showMinimalRisk: boolean;
  /** Minimum risk percentage to display stripes */
  minRiskThreshold: number;
}

/**
 * Default risk display configuration optimized for Gilded Observatory theme.
 * 
 * Design rationale:
 * - Polygon shape provides clear visual boundaries for risk assessment
 * - Injury uses amber colors for moderate risk visibility
 * - Death uses red colors for high risk visibility
 * - Minimum stripe length ensures visibility even for tiny percentages
 * - Animations are subtle to avoid distraction
 * - Config-first design enables easy tuning without code changes
 */
export const DEFAULT_RISK_DISPLAY_CONFIG: RiskDisplayConfig = {
  colors: {
    injuryColor: 'rgb(251, 191, 36)', // amber-400
    deathColor: 'rgb(239, 68, 68)',   // red-500
    backgroundColor: 'rgba(30, 41, 59, 0.8)', // slate-800 with transparency
    borderColor: 'rgb(71, 85, 105)',   // slate-600
    zeroRiskColor: 'rgb(71, 85, 105)', // slate-600 (same as border)
  },
  polygon: {
    polygonSides: 6, // Hexagon for balanced visual
    polygonRadius: 60,
    stripeWidthPercent: 15,
    stripeSpacingPercent: 5,
    minStripeLengthPx: 4,
    maxStripeLengthPx: 80,
    stripeBorderRadius: '2px',
  },
  animation: {
    enabled: true,
    durationMs: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    clickableStripes: true,
    hover: {
      enabled: true,
      scale: 1.05,
      opacity: 0.9,
    },
  },
  telemetry: {
    enabled: true,
    eventPrefix: 'quest_risk',
    trackClicks: true,
    trackHovers: true,
    trackRenders: true,
  },
  showPercentageLabels: true,
  showMinimalRisk: false,
  minRiskThreshold: 0.5,
};

/**
 * Test configuration with disabled animations and deterministic behavior.
 */
export const TEST_RISK_DISPLAY_CONFIG: RiskDisplayConfig = {
  ...DEFAULT_RISK_DISPLAY_CONFIG,
  animation: {
    ...DEFAULT_RISK_DISPLAY_CONFIG.animation,
    enabled: false,
  },
  telemetry: {
    ...DEFAULT_RISK_DISPLAY_CONFIG.telemetry,
    enabled: false,
  },
};

/**
 * Validates a risk display configuration.
 * 
 * @param config - Configuration to validate
 * @returns True if configuration is valid
 */
export function validateRiskDisplayConfig(config: RiskDisplayConfig): boolean {
  const { colors, polygon, animation, telemetry } = config;

  // Check color format (basic validation for CSS colors)
  const colorRegex = /^(rgb|hsl|#[0-9a-fA-F])/;
  if (!colorRegex.test(colors.injuryColor) ||
      !colorRegex.test(colors.deathColor) ||
      !colorRegex.test(colors.backgroundColor) ||
      !colorRegex.test(colors.borderColor) ||
      !colorRegex.test(colors.zeroRiskColor)) {
    return false;
  }

  // Check polygon dimensions
  if (polygon.polygonSides < 3 || polygon.polygonSides > 12) {
    return false;
  }
  if (polygon.polygonRadius <= 0) {
    return false;
  }
  if (polygon.minStripeLengthPx < 0 || polygon.maxStripeLengthPx < polygon.minStripeLengthPx) {
    return false;
  }
  if (polygon.stripeWidthPercent <= 0 || polygon.stripeWidthPercent > 100) {
    return false;
  }
  if (polygon.stripeSpacingPercent < 0 || polygon.stripeSpacingPercent > 50) {
    return false;
  }

  // Check animation settings
  if (animation.enabled && animation.durationMs < 0) {
    return false;
  }
  if (animation.hover.scale < 0.8 || animation.hover.scale > 1.5) {
    return false;
  }
  if (animation.hover.opacity < 0 || animation.hover.opacity > 1) {
    return false;
  }

  // Check telemetry settings
  if (telemetry.enabled && !telemetry.eventPrefix) {
    return false;
  }

  // Check thresholds
  if (config.minRiskThreshold < 0 || config.minRiskThreshold > 10) {
    return false;
  }

  return true;
}

/**
 * Calculates stripe length in pixels based on percentage and configuration.
 *
 * @param percentage - Risk percentage (0-100)
 * @param config - Risk display configuration
 * @returns Length in pixels
 */
export function calculateStripeLength(
  percentage: number,
  config: RiskDisplayConfig
): number {
  if (percentage <= config.minRiskThreshold && !config.showMinimalRisk) {
    return 0;
  }

  const normalizedPercentage = Math.max(0, Math.min(100, percentage)) / 100;
  const maxLength = config.polygon.maxStripeLengthPx;
  const minLength = config.polygon.minStripeLengthPx;

  return Math.max(minLength, normalizedPercentage * maxLength);
}

/**
 * Applies smoothing curve to percentage value.
 * 
 * @param percentage - Input percentage (0-100)
 * @param smoothing - Smoothing configuration
 * @returns Smoothed percentage
 */
function applySmoothingCurve(
  percentage: number,
  smoothing: RiskSmoothingConfig
): number {
  const { smoothingFactor, easingType } = smoothing;
  
  // Normalize to 0-1 range
  const normalized = percentage / 100;
  
  // Apply easing function
  let eased = normalized;
  switch (easingType) {
    case 'ease-in':
      eased = normalized * normalized;
      break;
    case 'ease-out':
      eased = 1 - Math.pow(1 - normalized, 2);
      break;
    case 'ease-in-out':
      eased = normalized < 0.5 
        ? 2 * normalized * normalized 
        : 1 - Math.pow(-2 * normalized + 2, 2) / 2;
      break;
    // 'linear' uses normalized value directly
  }
  
  // Apply smoothing factor (blend between original and eased)
  const smoothed = normalized * (1 - smoothingFactor) + eased * smoothingFactor;
  
  // Convert back to percentage
  return smoothed * 100;
}

/**
 * Determines if risk stripes should be shown based on configuration.
 *
 * @param injuryPercentage - Injury risk percentage
 * @param deathPercentage - Death risk percentage
 * @param config - Risk display configuration
 * @returns True if stripes should be shown
 */
export function shouldShowRiskStripes(
  injuryPercentage: number,
  deathPercentage: number,
  config: RiskDisplayConfig
): boolean {
  if (config.showMinimalRisk) {
    return true;
  }

  // Show if either risk is above minimum threshold
  return injuryPercentage >= config.minRiskThreshold || deathPercentage >= config.minRiskThreshold;
}

/**
 * Calculate risk level assessment based on percentages.
 */
export function calculateRiskLevel(
  injuryPercentage: number,
  deathPercentage: number
): 'LOW' | 'MED' | 'HIGH' {
  const totalRisk = injuryPercentage + deathPercentage;

  if (totalRisk < 10) return 'LOW';
  if (totalRisk < 25) return 'MED';
  return 'HIGH';
}

/**
 * Generate polygon points for SVG path.
 */
export function generatePolygonPoints(
  sides: number,
  radius: number,
  centerX: number = 0,
  centerY: number = 0
): string {
  const points: string[] = [];

  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2; // Start from top
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return points.join(' ');
}

/**
 * Zod schema for risk display configuration validation.
 */
export const RiskDisplayConfigSchema = z.object({
  colors: z.object({
    injuryColor: z.string(),
    deathColor: z.string(),
    backgroundColor: z.string(),
    borderColor: z.string(),
    zeroRiskColor: z.string(),
  }),
  polygon: z.object({
    polygonSides: z.number().min(3).max(12),
    polygonRadius: z.number().positive(),
    stripeWidthPercent: z.number().min(1).max(50),
    stripeSpacingPercent: z.number().min(0).max(20),
    minStripeLengthPx: z.number().min(1),
    maxStripeLengthPx: z.number().positive(),
    stripeBorderRadius: z.string(),
  }),
  animation: z.object({
    enabled: z.boolean(),
    durationMs: z.number().positive(),
    easing: z.string(),
    clickableStripes: z.boolean(),
    hover: z.object({
      enabled: z.boolean(),
      scale: z.number().min(0.8).max(1.5),
      opacity: z.number().min(0).max(1),
    }),
  }),
  telemetry: z.object({
    enabled: z.boolean(),
    eventPrefix: z.string(),
    trackClicks: z.boolean(),
    trackHovers: z.boolean(),
    trackRenders: z.boolean(),
  }),
  showPercentageLabels: z.boolean(),
  showMinimalRisk: z.boolean(),
  minRiskThreshold: z.number().min(0).max(5),
});

/**
 * Type for risk display diagnostics logged when enabled.
 */
export interface RiskDisplayDiagnostics {
  timestamp: number;
  questId: string;
  injuryPercentage: number;
  deathPercentage: number;
  injuryStripeLength: number;
  deathStripeLength: number;
  polygonRadius: number;
  stripesVisible: boolean;
  riskLevel: 'LOW' | 'MED' | 'HIGH';
  configSource: 'default' | 'test' | 'custom';
  stripeType?: 'injury' | 'death';
  stripePercentage?: number;
}
