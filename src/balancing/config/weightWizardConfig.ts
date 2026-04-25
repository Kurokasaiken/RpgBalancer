/**
 * Weight Calibration Wizard Configuration
 * 
 * Config-first configuration for the stat weight calibration wizard.
 * Defines wizard steps, validation rules, simulation parameters, and UI settings.
 * 
 * @since NP-121 – Stat Weight Calibration Wizard
 */

import { z } from 'zod';
import type { StatDefinition } from './types';

/**
 * Wizard step definitions
 */
export const WIZARD_STEPS = [
  'select-stats',
  'set-targets', 
  'configure-simulation',
  'run-calibration',
  'review-results'
] as const;

export type WizardStep = typeof WIZARD_STEPS[number];

/**
 * Calibration strategy types
 */
export const CALIBRATION_STRATEGIES = [
  'target-turns',
  'win-rate',
  'damage-output',
  'survivability',
  'balanced'
] as const;

export type CalibrationStrategy = typeof CALIBRATION_STRATEGIES[number];

/**
 * Simulation preset configurations
 */
export const SIMULATION_PRESETS = {
  quick: {
    iterations: 1000,
    targetTurns: 10,
    seed: 42,
    timeoutMs: 5000,
  },
  standard: {
    iterations: 5000,
    targetTurns: 15,
    seed: 42,
    timeoutMs: 15000,
  },
  thorough: {
    iterations: 10000,
    targetTurns: 20,
    seed: 42,
    timeoutMs: 30000,
  },
  custom: {
    iterations: 5000,
    targetTurns: 15,
    seed: 42,
    timeoutMs: 15000,
  }
} as const;

export type SimulationPreset = keyof typeof SIMULATION_PRESETS;

/**
 * Weight validation schema
 */
export const WeightValidationSchema = z.object({
  statId: z.string().min(1, 'Stat ID is required'),
  weight: z.number().min(0.1, 'Weight must be at least 0.1').max(5.0, 'Weight cannot exceed 5.0'),
  priority: z.number().min(1, 'Priority must be at least 1').max(10, 'Priority cannot exceed 10'),
  locked: z.boolean().default(false),
  description: z.string().optional(),
});

/**
 * Calibration target schema
 */
export const CalibrationTargetSchema = z.object({
  strategy: z.enum(CALIBRATION_STRATEGIES),
  targetValue: z.number().min(0, 'Target value must be positive'),
  tolerance: z.number().min(0, 'Tolerance must be non-negative').max(1, 'Tolerance cannot exceed 100%'),
  priority: z.number().min(1, 'Priority must be at least 1').max(10, 'Priority cannot exceed 10'),
});

/**
 * Simulation configuration schema
 */
export const SimulationConfigSchema = z.object({
  preset: z.enum(['quick', 'standard', 'thorough', 'custom'] as const),
  iterations: z.number().min(100, 'Minimum 100 iterations').max(50000, 'Maximum 50,000 iterations'),
  targetTurns: z.number().min(5, 'Minimum 5 turns').max(50, 'Maximum 50 turns'),
  seed: z.number().int().min(0, 'Seed must be non-negative'),
  timeoutMs: z.number().min(1000, 'Minimum 1 second timeout').max(300000, 'Maximum 5 minutes timeout'),
  parallelRuns: z.number().min(1, 'At least 1 parallel run').max(10, 'Maximum 10 parallel runs').default(1),
});

/**
 * Wizard state schema
 */
export const WizardStateSchema = z.object({
  currentStep: z.enum(WIZARD_STEPS),
  selectedStats: z.array(z.string()).min(1, 'At least one stat must be selected'),
  weights: z.array(WeightValidationSchema),
  targets: z.array(CalibrationTargetSchema).min(1, 'At least one target must be configured'),
  simulationConfig: SimulationConfigSchema,
  results: z.object({
    calibrationResults: z.array(z.object({
      statId: z.string(),
      originalWeight: z.number(),
      calibratedWeight: z.number(),
      improvement: z.number(),
      confidence: z.number(),
      iterations: z.number(),
    })).optional(),
    simulationResults: z.array(z.object({
      runId: z.string(),
      timestamp: z.number(),
      weights: z.record(z.number()),
      metrics: z.record(z.number()),
      success: z.boolean(),
    })).optional(),
    summary: z.object({
      totalImprovement: z.number(),
      averageConfidence: z.number(),
      targetsMet: z.number(),
      totalTargets: z.number(),
      recommendedWeights: z.record(z.number()),
    }).optional(),
  }),
  isRunning: z.boolean().default(false),
  progress: z.number().min(0).max(1).default(0),
  errors: z.array(z.string()).default([]),
});

export type WeightValidation = z.infer<typeof WeightValidationSchema>;
export type CalibrationTarget = z.infer<typeof CalibrationTargetSchema>;
export type SimulationConfig = z.infer<typeof SimulationConfigSchema>;
export type WizardState = z.infer<typeof WizardStateSchema>;

/**
 * Default wizard configuration
 */
export const DEFAULT_WIZARD_CONFIG: WizardState = {
  currentStep: 'select-stats',
  selectedStats: [],
  weights: [],
  targets: [],
  simulationConfig: {
    preset: 'standard',
    ...SIMULATION_PRESETS.standard,
    parallelRuns: 1,
  },
  results: {},
  isRunning: false,
  progress: 0,
  errors: [],
};

/**
 * Stat weight recommendations based on stat type
 */
export const STAT_WEIGHT_RECOMMENDATIONS = {
  core: {
    min: 0.8,
    max: 2.0,
    default: 1.0,
    step: 0.1,
  },
  secondary: {
    min: 0.5,
    max: 1.5,
    default: 0.8,
    step: 0.1,
  },
  derived: {
    min: 0.3,
    max: 1.0,
    default: 0.5,
    step: 0.05,
  },
  penalty: {
    min: 0.1,
    max: 0.8,
    default: 0.3,
    step: 0.05,
  },
} as const;

/**
 * Calibration strategy configurations
 */
export const CALIBRATION_STRATEGY_CONFIGS = {
  'target-turns': {
    label: 'Target Turns',
    description: 'Optimize weights to achieve specific turn count goals',
    metric: 'averageTurns',
    targetRange: { min: 5, max: 50 },
    tolerance: 0.1,
    priority: 1,
  },
  'win-rate': {
    label: 'Win Rate',
    description: 'Maximize victory percentage within turn constraints',
    metric: 'winRate',
    targetRange: { min: 0.5, max: 1.0 },
    tolerance: 0.05,
    priority: 2,
  },
  'damage-output': {
    label: 'Damage Output',
    description: 'Optimize for maximum damage per turn',
    metric: 'damagePerTurn',
    targetRange: { min: 10, max: 1000 },
    tolerance: 0.1,
    priority: 3,
  },
  'survivability': {
    label: 'Survivability',
    description: 'Maximize HP remaining and damage mitigation',
    metric: 'hpRemaining',
    targetRange: { min: 0, max: 100 },
    tolerance: 0.15,
    priority: 4,
  },
  'balanced': {
    label: 'Balanced',
    description: 'Equal optimization across all metrics',
    metric: 'balancedScore',
    targetRange: { min: 0, max: 1 },
    tolerance: 0.1,
    priority: 5,
  },
} as const;

/**
 * UI configuration for wizard components
 */
export const WIZARD_UI_CONFIG = {
  maxSelectedStats: 10,
  minSelectedStats: 1,
  maxTargets: 5,
  minTargets: 1,
  progressBarSteps: WIZARD_STEPS.length,
  animationDuration: 300,
  debounceMs: 500,
  refreshIntervalMs: 1000,
  maxConcurrentSimulations: 3,
} as const;

/**
 * Validation rules for wizard steps
 */
export const WIZARD_STEP_VALIDATION = {
  'select-stats': {
    required: ['selectedStats'],
    validators: {
      selectedStats: (value: string[]) => 
        value.length >= WIZARD_UI_CONFIG.minSelectedStats && 
        value.length <= WIZARD_UI_CONFIG.maxSelectedStats,
    },
    errors: {
      selectedStats: `Select between ${WIZARD_UI_CONFIG.minSelectedStats} and ${WIZARD_UI_CONFIG.maxSelectedStats} stats`,
    },
  },
  'set-targets': {
    required: ['weights', 'targets'],
    validators: {
      weights: (weights: WeightValidation[]) => 
        weights.length > 0 && weights.every(w => w.weight > 0),
      targets: (targets: CalibrationTarget[]) => 
        targets.length >= WIZARD_UI_CONFIG.minTargets && 
        targets.length <= WIZARD_UI_CONFIG.maxTargets,
    },
    errors: {
      weights: 'Configure weights for selected stats',
      targets: `Configure between ${WIZARD_UI_CONFIG.minTargets} and ${WIZARD_UI_CONFIG.maxTargets} targets`,
    },
  },
  'configure-simulation': {
    required: ['simulationConfig'],
    validators: {
      simulationConfig: (config: SimulationConfig) => 
        config.iterations >= 100 && config.iterations <= 50000,
    },
    errors: {
      simulationConfig: 'Configure valid simulation parameters',
    },
  },
  'run-calibration': {
    required: [],
    validators: {},
    errors: {},
  },
  'review-results': {
    required: ['results'],
    validators: {
      results: (results: WizardState['results']) => 
        results.calibrationResults && results.calibrationResults.length > 0,
    },
    errors: {
      results: 'Complete calibration before reviewing results',
    },
  },
} as const;

/**
 * Helper functions for wizard configuration
 */

/**
 * Get stat weight recommendation based on stat definition
 */
export function getStatWeightRecommendation(stat: StatDefinition) {
  if (stat.isPenalty) return STAT_WEIGHT_RECOMMENDATIONS.penalty;
  if (stat.isDerived) return STAT_WEIGHT_RECOMMENDATIONS.derived;
  if (stat.isCore) return STAT_WEIGHT_RECOMMENDATIONS.core;
  return STAT_WEIGHT_RECOMMENDATIONS.secondary;
}

/**
 * Validate wizard step configuration
 */
export function validateWizardStep(step: WizardStep, state: Partial<WizardState>): string[] {
  const stepConfig = WIZARD_STEP_VALIDATION[step];
  const errors: string[] = [];

  for (const field of stepConfig.required) {
    if (!state[field]) {
      errors.push(stepConfig.errors[field as keyof typeof stepConfig.errors]);
      continue;
    }

    const validator = stepConfig.validators[field as keyof typeof stepConfig.validators];
    if (validator && !validator(state[field as keyof WizardState])) {
      errors.push(stepConfig.errors[field as keyof typeof stepConfig.errors]);
    }
  }

  return errors;
}

/**
 * Get next wizard step
 */
export function getNextWizardStep(currentStep: WizardStep): WizardStep | null {
  const currentIndex = WIZARD_STEPS.indexOf(currentStep);
  return currentIndex < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[currentIndex + 1] : null;
}

/**
 * Get previous wizard step
 */
export function getPreviousWizardStep(currentStep: WizardStep): WizardStep | null {
  const currentIndex = WIZARD_STEPS.indexOf(currentStep);
  return currentIndex > 0 ? WIZARD_STEPS[currentIndex - 1] : null;
}

/**
 * Check if wizard step is accessible
 */
export function isWizardStepAccessible(step: WizardStep, state: Partial<WizardState>): boolean {
  const stepIndex = WIZARD_STEPS.indexOf(step);
  
  // First step is always accessible
  if (stepIndex === 0) return true;
  
  // Check if previous steps are valid
  for (let i = 0; i < stepIndex; i++) {
    const previousStep = WIZARD_STEPS[i];
    const errors = validateWizardStep(previousStep, state);
    if (errors.length > 0) return false;
  }
  
  return true;
}

/**
 * Create safe wizard state from partial data
 */
export function createSafeWizardState(data: Partial<WizardState>): WizardState {
  const result = WizardStateSchema.safeParse(data);
  
  if (result.success) {
    return result.data;
  }
  
  // Return default state with merged valid data
  return {
    ...DEFAULT_WIZARD_CONFIG,
    ...data,
  };
}

/**
 * Export configuration for external usage
 */
export const WEIGHT_WIZARD_CONFIG = {
  steps: WIZARD_STEPS,
  strategies: CALIBRATION_STRATEGIES,
  presets: SIMULATION_PRESETS,
  recommendations: STAT_WEIGHT_RECOMMENDATIONS,
  strategyConfigs: CALIBRATION_STRATEGY_CONFIGS,
  uiConfig: WIZARD_UI_CONFIG,
  validation: WIZARD_STEP_VALIDATION,
  default: DEFAULT_WIZARD_CONFIG,
} as const;
