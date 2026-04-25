import { z } from 'zod';

/**
 * Risk calibration configuration for interactive calibration tool
 */

/**
 * Smoothing curve configuration for risk percentage calculations
 */
export const RiskSmoothingCurveSchema = z.object({
  type: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out', 'cubic-bezier']),
  factor: z.number().min(0).max(2).describe('Smoothing intensity factor'),
  threshold: z.number().min(0).max(1).describe('Minimum percentage to apply smoothing'),
  customBezier: z.string().optional().describe('Custom cubic-bezier curve'),
});

export type RiskSmoothingCurve = z.infer<typeof RiskSmoothingCurveSchema>;

/**
 * KPI target configuration for risk calibration
 */
export const RiskKPITargetSchema = z.object({
  maxInjuryRate: z.number().min(0).max(1).describe('Maximum acceptable injury rate'),
  maxDeathRate: z.number().min(0).max(0.5).describe('Maximum acceptable death rate'),
  targetOverallRisk: z.number().min(0).max(1).describe('Target overall risk level'),
  riskTolerance: z.enum(['conservative', 'balanced', 'aggressive']).describe('Risk tolerance profile'),
});

export type RiskKPITarget = z.infer<typeof RiskKPITargetSchema>;

/**
 * Color palette configuration for risk stripes
 */
export const RiskColorPaletteSchema = z.object({
  injuryGradient: z.object({
    start: z.string().describe('Start color for injury gradient'),
    end: z.string().describe('End color for injury gradient'),
    stops: z.array(z.object({
      offset: z.number().min(0).max(1),
      color: z.string(),
    })).optional().describe('Gradient stops'),
  }),
  deathGradient: z.object({
    start: z.string().describe('Start color for death gradient'),
    end: z.string().describe('End color for death gradient'),
    stops: z.array(z.object({
      offset: z.number().min(0).max(1),
      color: z.string(),
    })).optional().describe('Gradient stops'),
  }),
  backgroundColor: z.string().describe('Background color for risk display'),
  borderColor: z.string().describe('Border color for risk display'),
  zeroRiskColor: z.string().describe('Color for zero-risk state'),
});

export type RiskColorPalette = z.infer<typeof RiskColorPaletteSchema>;

/**
 * Calibration preset configuration
 */
export const RiskCalibrationPresetSchema = z.object({
  id: z.string().describe('Unique preset identifier'),
  name: z.string().describe('Display name for preset'),
  description: z.string().describe('Preset description'),
  smoothingCurve: RiskSmoothingCurveSchema,
  kpiTargets: RiskKPITargetSchema,
  colorPalette: RiskColorPaletteSchema,
  metadata: z.object({
    author: z.string().describe('Preset author'),
    version: z.string().describe('Preset version'),
    createdAt: z.string().describe('Creation timestamp'),
    tags: z.array(z.string()).optional().describe('Preset tags'),
  }),
});

export type RiskCalibrationPreset = z.infer<typeof RiskCalibrationPresetSchema>;

/**
 * Risk calibration configuration schema
 */
export const RiskCalibrationConfigSchema = z.object({
  presets: z.array(RiskCalibrationPresetSchema).describe('Available calibration presets'),
  activePresetId: z.string().describe('Currently active preset ID'),
  defaultPresetId: z.string().describe('Default preset ID on first load'),
  maxUndoStack: z.number().min(1).max(50).describe('Maximum undo stack size'),
  autoSave: z.boolean().describe('Auto-save changes to preset'),
  telemetry: z.object({
    enabled: z.boolean().describe('Enable telemetry collection'),
    trackChanges: z.boolean().describe('Track calibration changes'),
    trackExports: z.boolean().describe('Track preset exports'),
  }),
  ui: z.object({
    showAdvancedOptions: z.boolean().describe('Show advanced calibration options'),
    enableRealtimePreview: z.boolean().describe('Enable real-time preview updates'),
    chartUpdateThrottleMs: z.number().min(16).max(1000).describe('Chart update throttle in ms'),
  }),
});

export type RiskCalibrationConfig = z.infer<typeof RiskCalibrationConfigSchema>;

/**
 * Default smoothing curves
 */
export const DEFAULT_SMOOTHING_CURVES: Record<string, RiskSmoothingCurve> = {
  linear: {
    type: 'linear',
    factor: 1.0,
    threshold: 0.05,
  },
  gentle: {
    type: 'ease-out',
    factor: 0.8,
    threshold: 0.1,
  },
  aggressive: {
    type: 'ease-in',
    factor: 1.2,
    threshold: 0.02,
  },
  balanced: {
    type: 'ease-in-out',
    factor: 1.0,
    threshold: 0.05,
  },
};

/**
 * Default KPI targets
 */
export const DEFAULT_KPI_TARGETS: Record<string, RiskKPITarget> = {
  conservative: {
    maxInjuryRate: 0.15,
    maxDeathRate: 0.05,
    targetOverallRisk: 0.2,
    riskTolerance: 'conservative',
  },
  balanced: {
    maxInjuryRate: 0.25,
    maxDeathRate: 0.12,
    targetOverallRisk: 0.3,
    riskTolerance: 'balanced',
  },
  aggressive: {
    maxInjuryRate: 0.35,
    maxDeathRate: 0.18,
    targetOverallRisk: 0.4,
    riskTolerance: 'aggressive',
  },
};

/**
 * Default color palettes (Style Laboratory compatible)
 */
export const DEFAULT_COLOR_PALETTES: Record<string, RiskColorPalette> = {
  classic: {
    injuryGradient: {
      start: 'rgb(251, 191, 36)', // amber-400
      end: 'rgb(245, 158, 11)', // amber-600
    },
    deathGradient: {
      start: 'rgb(239, 68, 68)', // red-500
      end: 'rgb(185, 28, 28)', // red-800
    },
    backgroundColor: 'rgb(30, 41, 59)', // slate-800
    borderColor: 'rgb(71, 85, 105)', // slate-600
    zeroRiskColor: 'rgb(100, 116, 139)', // slate-500
  },
  vibrant: {
    injuryGradient: {
      start: 'rgb(251, 146, 60)', // orange-400
      end: 'rgb(234, 88, 12)', // orange-600
    },
    deathGradient: {
      start: 'rgb(248, 113, 113)', // red-400
      end: 'rgb(220, 38, 38)', // red-600
    },
    backgroundColor: 'rgb(17, 24, 39)', // gray-900
    borderColor: 'rgb(55, 65, 81)', // gray-700
    zeroRiskColor: 'rgb(156, 163, 175)', // gray-400
  },
  muted: {
    injuryGradient: {
      start: 'rgb(217, 119, 6)', // amber-600
      end: 'rgb(180, 83, 9)', // amber-700
    },
    deathGradient: {
      start: 'rgb(185, 28, 28)', // red-800
      end: 'rgb(153, 27, 27)', // red-900
    },
    backgroundColor: 'rgb(15, 23, 42)', // slate-900
    borderColor: 'rgb(51, 65, 85)', // slate-700
    zeroRiskColor: 'rgb(71, 85, 105)', // slate-600
  },
};

/**
 * Default calibration presets
 */
export const DEFAULT_CALIBRATION_PRESETS: RiskCalibrationPreset[] = [
  {
    id: 'conservative-classic',
    name: 'Conservative Classic',
    description: 'Safe risk profile with classic styling',
    smoothingCurve: DEFAULT_SMOOTHING_CURVES.gentle,
    kpiTargets: DEFAULT_KPI_TARGETS.conservative,
    colorPalette: DEFAULT_COLOR_PALETTES.classic,
    metadata: {
      author: 'Prism-Idle',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      tags: ['conservative', 'classic', 'safe'],
    },
  },
  {
    id: 'balanced-vibrant',
    name: 'Balanced Vibrant',
    description: 'Balanced risk profile with vibrant colors',
    smoothingCurve: DEFAULT_SMOOTHING_CURVES.balanced,
    kpiTargets: DEFAULT_KPI_TARGETS.balanced,
    colorPalette: DEFAULT_COLOR_PALETTES.vibrant,
    metadata: {
      author: 'Prism-Idle',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      tags: ['balanced', 'vibrant', 'default'],
    },
  },
  {
    id: 'aggressive-muted',
    name: 'Aggressive Muted',
    description: 'High-risk profile with muted styling',
    smoothingCurve: DEFAULT_SMOOTHING_CURVES.aggressive,
    kpiTargets: DEFAULT_KPI_TARGETS.aggressive,
    colorPalette: DEFAULT_COLOR_PALETTES.muted,
    metadata: {
      author: 'Prism-Idle',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      tags: ['aggressive', 'muted', 'high-risk'],
    },
  },
];

/**
 * Default risk calibration configuration
 */
export const DEFAULT_RISK_CALIBRATION_CONFIG: RiskCalibrationConfig = {
  presets: DEFAULT_CALIBRATION_PRESETS,
  activePresetId: 'balanced-vibrant',
  defaultPresetId: 'balanced-vibrant',
  maxUndoStack: 20,
  autoSave: true,
  telemetry: {
    enabled: true,
    trackChanges: true,
    trackExports: true,
  },
  ui: {
    showAdvancedOptions: false,
    enableRealtimePreview: true,
    chartUpdateThrottleMs: 100,
  },
};

/**
 * Get risk calibration configuration
 */
export function getRiskCalibrationConfig(): RiskCalibrationConfig {
  return DEFAULT_RISK_CALIBRATION_CONFIG;
}

/**
 * Get preset by ID
 */
export function getCalibrationPreset(id: string): RiskCalibrationPreset | undefined {
  return DEFAULT_CALIBRATION_PRESETS.find(preset => preset.id === id);
}

/**
 * Validate risk calibration configuration
 */
export function validateRiskCalibrationConfig(config: unknown): RiskCalibrationConfig {
  return RiskCalibrationConfigSchema.parse(config);
}

/**
 * Create custom calibration preset
 */
export function createCalibrationPreset(overrides: Partial<RiskCalibrationPreset>): RiskCalibrationPreset {
  const basePreset = DEFAULT_CALIBRATION_PRESETS[0]; // Use first preset as base
  
  return {
    ...basePreset,
    ...overrides,
    id: overrides.id || `custom-${Date.now()}`,
    metadata: {
      ...basePreset.metadata,
      ...overrides.metadata,
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * Export configuration as JSON for riskDisplayConfig compatibility
 */
export function exportPresetAsRiskDisplayConfig(preset: RiskCalibrationPreset): string {
  const riskDisplayConfig = {
    colors: {
      injuryColor: preset.colorPalette.injuryGradient.start,
      deathColor: preset.colorPalette.deathGradient.start,
      backgroundColor: preset.colorPalette.backgroundColor,
      borderColor: preset.colorPalette.borderColor,
    },
    smoothing: {
      enableSmoothing: preset.smoothingCurve.type !== 'linear',
      smoothingFactor: preset.smoothingCurve.factor,
      smoothingThresholdPercent: preset.smoothingCurve.threshold * 100,
      easingType: preset.smoothingCurve.type,
    },
    kpiTargets: preset.kpiTargets,
  };
  
  return JSON.stringify(riskDisplayConfig, null, 2);
}

/**
 * Import preset from JSON
 */
export function importPresetFromJson(jsonString: string): RiskCalibrationPreset {
  const parsed = JSON.parse(jsonString);
  return validateRiskCalibrationConfig(parsed).presets[0];
}
