/**
 * Idle Village Risk Stripe Calibration Configuration
 * 
 * Comprehensive configuration system for risk stripe calibration with
 * interactive tools, algorithms, and export functionality.
 * 
 * @module riskStripeCalibrationConfig
 * @since 2026-01-13
 * @author Cascade
 */

import { z } from 'zod';

/**
 * Risk stripe types
 */
export enum RiskStripeType {
  INJURY = 'injury',
  DEATH = 'death',
  COMBINED = 'combined',
  CUSTOM = 'custom',
}

/**
 * Calibration algorithms
 */
export enum CalibrationAlgorithm {
  LINEAR = 'linear',
  LOGARITHMIC = 'logarithmic',
  EXPONENTIAL = 'exponential',
  SIGMOID = 'sigmoid',
  POWER = 'power',
  CUSTOM = 'custom',
}

/**
 * Risk level categories
 */
export enum RiskLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
  EXTREME = 'extreme',
}

/**
 * Calibration preset types
 */
export enum CalibrationPresetType {
  CONSERVATIVE = 'conservative',
  BALANCED = 'balanced',
  AGGRESSIVE = 'aggressive',
  CUSTOM = 'custom',
}

/**
 * Risk stripe configuration
 */
export interface RiskStripeConfig {
  /** Stripe type */
  type: RiskStripeType;
  /** Color configuration */
  color: {
    primary: string;
    secondary?: string;
    gradient?: string;
    opacity: number;
  };
  /** Visual configuration */
  visual: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    borderRadius: number;
    spacing: number;
  };
  /** Animation configuration */
  animation: {
    enabled: boolean;
    duration: number;
    easing: string;
    delay: number;
  };
  /** Label configuration */
  label: {
    show: boolean;
    format: 'percentage' | 'fraction' | 'decimal';
    precision: number;
    position: 'top' | 'bottom' | 'side' | 'overlay';
  };
}

/**
 * Calibration point
 */
export interface CalibrationPoint {
  /** Risk percentage (0-1) */
  riskPercentage: number;
  /** Expected stripe height (pixels) */
  stripeHeight: number;
  /** Risk level */
  riskLevel: RiskLevel;
  /** Description */
  description?: string;
  /** Weight for calibration (0-1) */
  weight: number;
  /** Is reference point */
  isReference: boolean;
}

/**
 * Calibration curve parameters
 */
export interface CalibrationCurveParams {
  /** Algorithm type */
  algorithm: CalibrationAlgorithm;
  /** Curve parameters */
  parameters: {
    /** Linear: slope and intercept */
    slope?: number;
    intercept?: number;
    /** Logarithmic: base and scale */
    base?: number;
    scale?: number;
    /** Exponential: base and scale */
    expBase?: number;
    expScale?: number;
    /** Sigmoid: steepness and midpoint */
    steepness?: number;
    midpoint?: number;
    /** Power: exponent and scale */
    exponent?: number;
    powerScale?: number;
    /** Custom: function string */
    customFunction?: string;
  };
  /** Domain constraints */
  domain: {
    min: number;
    max: number;
  };
  /** Range constraints */
  range: {
    min: number;
    max: number;
  };
}

/**
 * Calibration session
 */
export interface CalibrationSession {
  /** Session ID */
  sessionId: string;
  /** Session name */
  name: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  modifiedAt: number;
  /** Session description */
  description?: string;
  /** Calibration points */
  calibrationPoints: CalibrationPoint[];
  /** Curve parameters */
  curveParams: CalibrationCurveParams;
  /** Stripe configuration */
  stripeConfig: RiskStripeConfig;
  /** Validation results */
  validationResults?: CalibrationValidationResults;
  /** Session metadata */
  metadata: {
    version: string;
    author: string;
    tags: string[];
    category: string;
  };
}

/**
 * Calibration validation results
 */
export interface CalibrationValidationResults {
  /** Overall validation score (0-1) */
  validationScore: number;
  /** Error metrics */
  errors: {
    meanAbsoluteError: number;
    rootMeanSquareError: number;
    maxAbsoluteError: number;
    meanAbsolutePercentageError: number;
  };
  /** Fit quality metrics */
  fitQuality: {
    rSquared: number;
    adjustedRSquared: number;
    residualStandardError: number;
    fStatistic?: number;
    pValue?: number;
  };
  /** Outlier detection */
  outliers: {
    count: number;
    indices: number[];
    threshold: number;
  };
  /** Recommendations */
  recommendations: string[];
  /** Validation timestamp */
  validatedAt: number;
}

/**
 * Calibration export format
 */
export interface CalibrationExport {
  /** Export metadata */
  metadata: {
    version: string;
    exportedAt: number;
    exportedBy: string;
    format: 'json' | 'csv' | 'xml';
    compression?: 'gzip' | 'brotli';
  };
  /** Session data */
  session: CalibrationSession;
  /** Additional data */
  additionalData?: {
    chartData?: any;
    statistics?: any;
    notes?: string;
  };
}

/**
 * Calibration tool configuration
 */
export interface RiskStripeCalibrationToolConfig {
  /** Tool enabled */
  enabled: boolean;
  /** Default stripe configuration */
  defaultStripeConfig: RiskStripeConfig;
  /** Calibration limits */
  calibrationLimits: {
    maxPoints: number;
    minPoints: number;
    maxRiskPercentage: number;
    minRiskPercentage: number;
    maxStripeHeight: number;
    minStripeHeight: number;
  };
  /** Validation settings */
  validation: {
    enabled: boolean;
    autoValidate: boolean;
    validationThreshold: number;
    outlierDetection: boolean;
    outlierThreshold: number;
  };
  /** UI settings */
  ui: {
    showGrid: boolean;
    showLabels: boolean;
    showCurve: boolean;
    showPoints: boolean;
    showErrors: boolean;
    animationSpeed: number;
    precision: number;
  };
  /** Export settings */
  export: {
    defaultFormat: 'json' | 'csv' | 'xml';
    includeMetadata: boolean;
    includeValidation: boolean;
    includeChartData: boolean;
    compression: boolean;
  };
  /** Presets */
  presets: CalibrationPreset[];
}

/**
 * Calibration preset
 */
export interface CalibrationPreset {
  /** Preset ID */
  presetId: string;
  /** Preset name */
  name: string;
  /** Preset type */
  type: CalibrationPresetType;
  /** Preset description */
  description: string;
  /** Default calibration points */
  defaultPoints: CalibrationPoint[];
  /** Default curve parameters */
  defaultCurveParams: CalibrationCurveParams;
  /** Default stripe configuration */
  defaultStripeConfig: RiskStripeConfig;
  /** Preset tags */
  tags: string[];
  /** Is built-in preset */
  isBuiltin: boolean;
}

/**
 * Interactive calibration state
 */
export interface InteractiveCalibrationState {
  /** Current session */
  currentSession: CalibrationSession | null;
  /** Selected point index */
  selectedPointIndex: number | null;
  /** Drag state */
  isDragging: boolean;
  /** Pan state */
  isPanning: boolean;
  /** Zoom level */
  zoomLevel: number;
  /** Viewport bounds */
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Tool mode */
  toolMode: 'select' | 'add' | 'delete' | 'edit';
  /** Snap to grid */
  snapToGrid: boolean;
  /** Grid size */
  gridSize: number;
  /** Show helpers */
  showHelpers: boolean;
}

/**
 * Default stripe configuration
 */
export const DEFAULT_RISK_STRIPE_CONFIG: RiskStripeConfig = {
  type: RiskStripeType.INJURY,
  color: {
    primary: 'rgb(251, 191, 36)', // amber-400
    secondary: 'rgb(245, 158, 11)', // amber-500
    gradient: 'linear-gradient(to bottom, rgb(251, 191, 36), rgb(245, 158, 11))',
    opacity: 0.8,
  },
  visual: {
    minWidth: 20,
    maxWidth: 60,
    minHeight: 2,
    maxHeight: 200,
    borderRadius: 2,
    spacing: 4,
  },
  animation: {
    enabled: true,
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay: 0,
  },
  label: {
    show: true,
    format: 'percentage',
    precision: 1,
    position: 'top',
  },
};

/**
 * Default calibration curve parameters
 */
export const DEFAULT_CALIBRATION_CURVE_PARAMS: CalibrationCurveParams = {
  algorithm: CalibrationAlgorithm.LINEAR,
  parameters: {
    slope: 1.0,
    intercept: 0,
  },
  domain: {
    min: 0,
    max: 1,
  },
  range: {
    min: 0,
    max: 200,
  },
};

/**
 * Default calibration tool configuration
 */
export const DEFAULT_RISK_STRIPE_CALIBRATION_TOOL_CONFIG: RiskStripeCalibrationToolConfig = {
  enabled: true,
  defaultStripeConfig: DEFAULT_RISK_STRIPE_CONFIG,
  calibrationLimits: {
    maxPoints: 20,
    minPoints: 3,
    maxRiskPercentage: 1.0,
    minRiskPercentage: 0,
    maxStripeHeight: 300,
    minStripeHeight: 1,
  },
  validation: {
    enabled: true,
    autoValidate: true,
    validationThreshold: 0.8,
    outlierDetection: true,
    outlierThreshold: 2.0,
  },
  ui: {
    showGrid: true,
    showLabels: true,
    showCurve: true,
    showPoints: true,
    showErrors: false,
    animationSpeed: 1.0,
    precision: 2,
  },
  export: {
    defaultFormat: 'json',
    includeMetadata: true,
    includeValidation: true,
    includeChartData: false,
    compression: false,
  },
  presets: [],
};

/**
 * Built-in calibration presets
 */
export const BUILTIN_CALIBRATION_PRESETS: CalibrationPreset[] = [
  {
    presetId: 'conservative-low-risk',
    name: 'Conservative - Low Risk',
    type: CalibrationPresetType.CONSERVATIVE,
    description: 'Conservative calibration for low-risk scenarios with gentle curves',
    defaultPoints: [
      { riskPercentage: 0.0, stripeHeight: 0, riskLevel: RiskLevel.VERY_LOW, weight: 1.0, isReference: true },
      { riskPercentage: 0.1, stripeHeight: 5, riskLevel: RiskLevel.VERY_LOW, weight: 1.0, isReference: false },
      { riskPercentage: 0.25, stripeHeight: 15, riskLevel: RiskLevel.LOW, weight: 1.0, isReference: false },
      { riskPercentage: 0.5, stripeHeight: 40, riskLevel: RiskLevel.MEDIUM, weight: 1.0, isReference: true },
      { riskPercentage: 0.75, stripeHeight: 80, riskLevel: RiskLevel.HIGH, weight: 1.0, isReference: false },
      { riskPercentage: 1.0, stripeHeight: 150, riskLevel: RiskLevel.VERY_HIGH, weight: 1.0, isReference: true },
    ],
    defaultCurveParams: {
      algorithm: CalibrationAlgorithm.SIGMOID,
      parameters: {
        steepness: 4,
        midpoint: 0.5,
      },
      domain: { min: 0, max: 1 },
      range: { min: 0, max: 150 },
    },
    defaultStripeConfig: DEFAULT_RISK_STRIPE_CONFIG,
    tags: ['conservative', 'low-risk', 'sigmoid'],
    isBuiltin: true,
  },
  {
    presetId: 'balanced-standard',
    name: 'Balanced - Standard',
    type: CalibrationPresetType.BALANCED,
    description: 'Balanced calibration for standard risk scenarios',
    defaultPoints: [
      { riskPercentage: 0.0, stripeHeight: 0, riskLevel: RiskLevel.VERY_LOW, weight: 1.0, isReference: true },
      { riskPercentage: 0.2, stripeHeight: 20, riskLevel: RiskLevel.LOW, weight: 1.0, isReference: false },
      { riskPercentage: 0.4, stripeHeight: 50, riskLevel: RiskLevel.MEDIUM, weight: 1.0, isReference: false },
      { riskPercentage: 0.6, stripeHeight: 90, riskLevel: RiskLevel.HIGH, weight: 1.0, isReference: false },
      { riskPercentage: 0.8, stripeHeight: 140, riskLevel: RiskLevel.VERY_HIGH, weight: 1.0, isReference: false },
      { riskPercentage: 1.0, stripeHeight: 200, riskLevel: RiskLevel.EXTREME, weight: 1.0, isReference: true },
    ],
    defaultCurveParams: {
      algorithm: CalibrationAlgorithm.POWER,
      parameters: {
        exponent: 1.5,
        powerScale: 200,
      },
      domain: { min: 0, max: 1 },
      range: { min: 0, max: 200 },
    },
    defaultStripeConfig: DEFAULT_RISK_STRIPE_CONFIG,
    tags: ['balanced', 'standard', 'power'],
    isBuiltin: true,
  },
  {
    presetId: 'aggressive-high-risk',
    name: 'Aggressive - High Risk',
    type: CalibrationPresetType.AGGRESSIVE,
    description: 'Aggressive calibration for high-risk scenarios with steep curves',
    defaultPoints: [
      { riskPercentage: 0.0, stripeHeight: 0, riskLevel: RiskLevel.VERY_LOW, weight: 1.0, isReference: true },
      { riskPercentage: 0.1, stripeHeight: 2, riskLevel: RiskLevel.VERY_LOW, weight: 1.0, isReference: false },
      { riskPercentage: 0.3, stripeHeight: 10, riskLevel: RiskLevel.LOW, weight: 1.0, isReference: false },
      { riskPercentage: 0.5, stripeHeight: 60, riskLevel: RiskLevel.MEDIUM, weight: 1.0, isReference: true },
      { riskPercentage: 0.7, stripeHeight: 150, riskLevel: RiskLevel.HIGH, weight: 1.0, isReference: false },
      { riskPercentage: 0.9, stripeHeight: 250, riskLevel: RiskLevel.VERY_HIGH, weight: 1.0, isReference: false },
      { riskPercentage: 1.0, stripeHeight: 300, riskLevel: RiskLevel.EXTREME, weight: 1.0, isReference: true },
    ],
    defaultCurveParams: {
      algorithm: CalibrationAlgorithm.EXPONENTIAL,
      parameters: {
        expBase: 2.718, // e
        expScale: 300,
      },
      domain: { min: 0, max: 1 },
      range: { min: 0, max: 300 },
    },
    defaultStripeConfig: {
      ...DEFAULT_RISK_STRIPE_CONFIG,
      color: {
        ...DEFAULT_RISK_STRIPE_CONFIG.color,
        primary: 'rgb(239, 68, 68)', // red-500
        secondary: 'rgb(220, 38, 38)', // red-600
      },
    },
    tags: ['aggressive', 'high-risk', 'exponential'],
    isBuiltin: true,
  },
];

/**
 * Zod schemas for validation
 */
export const RiskStripeConfigSchema = z.object({
  type: z.nativeEnum(RiskStripeType),
  color: z.object({
    primary: z.string().min(1),
    secondary: z.string().optional(),
    gradient: z.string().optional(),
    opacity: z.number().min(0).max(1),
  }),
  visual: z.object({
    minWidth: z.number().min(1),
    maxWidth: z.number().min(1),
    minHeight: z.number().min(1),
    maxHeight: z.number().min(1),
    borderRadius: z.number().min(0),
    spacing: z.number().min(0),
  }),
  animation: z.object({
    enabled: z.boolean(),
    duration: z.number().min(0),
    easing: z.string().min(1),
    delay: z.number().min(0),
  }),
  label: z.object({
    show: z.boolean(),
    format: z.enum(['percentage', 'fraction', 'decimal']),
    precision: z.number().min(0).max(10),
    position: z.enum(['top', 'bottom', 'side', 'overlay']),
  }),
});

export const CalibrationPointSchema = z.object({
  riskPercentage: z.number().min(0).max(1),
  stripeHeight: z.number().min(0),
  riskLevel: z.nativeEnum(RiskLevel),
  description: z.string().optional(),
  weight: z.number().min(0).max(1),
  isReference: z.boolean(),
});

export const CalibrationCurveParamsSchema = z.object({
  algorithm: z.nativeEnum(CalibrationAlgorithm),
  parameters: z.object({
    slope: z.number().optional(),
    intercept: z.number().optional(),
    base: z.number().optional(),
    scale: z.number().optional(),
    expBase: z.number().optional(),
    expScale: z.number().optional(),
    steepness: z.number().optional(),
    midpoint: z.number().optional(),
    exponent: z.number().optional(),
    powerScale: z.number().optional(),
    customFunction: z.string().optional(),
  }),
  domain: z.object({
    min: z.number(),
    max: z.number(),
  }),
  range: z.object({
    min: z.number(),
    max: z.number(),
  }),
});

export const CalibrationValidationResultsSchema = z.object({
  validationScore: z.number().min(0).max(1),
  errors: z.object({
    meanAbsoluteError: z.number().min(0),
    rootMeanSquareError: z.number().min(0),
    maxAbsoluteError: z.number().min(0),
    meanAbsolutePercentageError: z.number().min(0),
  }),
  fitQuality: z.object({
    rSquared: z.number().min(0).max(1),
    adjustedRSquared: z.number().min(0).max(1),
    residualStandardError: z.number().min(0),
    fStatistic: z.number().optional(),
    pValue: z.number().optional(),
  }),
  outliers: z.object({
    count: z.number().min(0),
    indices: z.array(z.number()),
    threshold: z.number().min(0),
  }),
  recommendations: z.array(z.string()),
  validatedAt: z.number(),
});

export const CalibrationSessionSchema = z.object({
  sessionId: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.number().min(0),
  modifiedAt: z.number().min(0),
  description: z.string().optional(),
  calibrationPoints: z.array(CalibrationPointSchema),
  curveParams: CalibrationCurveParamsSchema,
  stripeConfig: RiskStripeConfigSchema,
  validationResults: CalibrationValidationResultsSchema.optional(),
  metadata: z.object({
    version: z.string().min(1),
    author: z.string().min(1),
    tags: z.array(z.string()),
    category: z.string().min(1),
  }),
});

export const CalibrationPresetSchema = z.object({
  presetId: z.string().min(1),
  name: z.string().min(1),
  type: z.nativeEnum(CalibrationPresetType),
  description: z.string().min(1),
  defaultPoints: z.array(CalibrationPointSchema),
  defaultCurveParams: CalibrationCurveParamsSchema,
  defaultStripeConfig: RiskStripeConfigSchema,
  tags: z.array(z.string()),
  isBuiltin: z.boolean(),
});

export const RiskStripeCalibrationToolConfigSchema = z.object({
  enabled: z.boolean(),
  defaultStripeConfig: RiskStripeConfigSchema,
  calibrationLimits: z.object({
    maxPoints: z.number().min(3),
    minPoints: z.number().min(3),
    maxRiskPercentage: z.number().min(0).max(1),
    minRiskPercentage: z.number().min(0).max(1),
    maxStripeHeight: z.number().min(1),
    minStripeHeight: z.number().min(0),
  }),
  validation: z.object({
    enabled: z.boolean(),
    autoValidate: z.boolean(),
    validationThreshold: z.number().min(0).max(1),
    outlierDetection: z.boolean(),
    outlierThreshold: z.number().min(0),
  }),
  ui: z.object({
    showGrid: z.boolean(),
    showLabels: z.boolean(),
    showCurve: true,
    showPoints: z.boolean(),
    showErrors: z.boolean(),
    animationSpeed: z.number().min(0.1).max(5),
    precision: z.number().min(0).max(10),
  }),
  export: z.object({
    defaultFormat: z.enum(['json', 'csv', 'xml']),
    includeMetadata: z.boolean(),
    includeValidation: z.boolean(),
    includeChartData: z.boolean(),
    compression: z.boolean(),
  }),
  presets: z.array(CalibrationPresetSchema),
});

/**
 * Type guards
 */
export function isValidRiskStripeType(value: unknown): value is RiskStripeType {
  return Object.values(RiskStripeType).includes(value as RiskStripeType);
}

export function isValidCalibrationAlgorithm(value: unknown): value is CalibrationAlgorithm {
  return Object.values(CalibrationAlgorithm).includes(value as CalibrationAlgorithm);
}

export function isValidRiskLevel(value: unknown): value is RiskLevel {
  return Object.values(RiskLevel).includes(value as RiskLevel);
}

export function isValidCalibrationPresetType(value: unknown): value is CalibrationPresetType {
  return Object.values(CalibrationPresetType).includes(value as CalibrationPresetType);
}

/**
 * Utility functions
 */
export function createCalibrationSessionId(): string {
  return `calibration-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createCalibrationPoint(
  riskPercentage: number,
  stripeHeight: number,
  riskLevel: RiskLevel,
  weight: number = 1.0,
  isReference: boolean = false,
  description?: string
): CalibrationPoint {
  return {
    riskPercentage,
    stripeHeight,
    riskLevel,
    weight,
    isReference,
    description,
  };
}

export function calculateRiskLevel(riskPercentage: number): RiskLevel {
  if (riskPercentage <= 0.1) return RiskLevel.VERY_LOW;
  if (riskPercentage <= 0.3) return RiskLevel.LOW;
  if (riskPercentage <= 0.5) return RiskLevel.MEDIUM;
  if (riskPercentage <= 0.7) return RiskLevel.HIGH;
  if (riskPercentage <= 0.9) return RiskLevel.VERY_HIGH;
  return RiskLevel.EXTREME;
}

export function formatRiskValue(value: number, format: 'percentage' | 'fraction' | 'decimal', precision: number = 1): string {
  switch (format) {
    case 'percentage':
      return `${(value * 100).toFixed(precision)}%`;
    case 'fraction':
      return `${value.toFixed(precision)}`;
    case 'decimal':
      return value.toFixed(precision);
    default:
      return value.toString();
  }
}

export function validateCalibrationPoint(point: CalibrationPoint, limits: RiskStripeCalibrationToolConfig['calibrationLimits']): boolean {
  return (
    point.riskPercentage >= limits.minRiskPercentage &&
    point.riskPercentage <= limits.maxRiskPercentage &&
    point.stripeHeight >= limits.minStripeHeight &&
    point.stripeHeight <= limits.maxStripeHeight &&
    point.weight >= 0 &&
    point.weight <= 1
  );
}

export function sortCalibrationPoints(points: CalibrationPoint[]): CalibrationPoint[] {
  return [...points].sort((a, b) => a.riskPercentage - b.riskPercentage);
}

export function filterReferencePoints(points: CalibrationPoint[]): CalibrationPoint[] {
  return points.filter(point => point.isReference);
}

export function getCalibrationPresetById(presetId: string, presets: CalibrationPreset[]): CalibrationPreset | null {
  return presets.find(preset => preset.presetId === presetId) || null;
}

export function getCalibrationPresetsByType(type: CalibrationPresetType, presets: CalibrationPreset[]): CalibrationPreset[] {
  return presets.filter(preset => preset.type === type);
}

export function validateCalibrationSession(session: CalibrationSession): boolean {
  try {
    CalibrationSessionSchema.parse(session);
    return true;
  } catch {
    return false;
  }
}
