/**
 * Weight Calibration Hook
 * 
 * React hook for managing stat weight calibration workflow.
 * Handles wizard state, Monte Carlo simulations, and result processing.
 * 
 * @since NP-121 – Stat Weight Calibration Wizard
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useBalancerConfig } from './useBalancerConfig';
import { runMonteCarloSimulation } from '../../balancing/monteCarlo/MonteCarloEngine';
import type { ScenarioConfig, ScenarioResult } from '../../balancing/monteCarlo/ScenarioConfig';
import type {
  WizardState,
  WizardStep,
  CalibrationTarget,
} from '../../balancing/config/weightWizardConfig';
import {
  DEFAULT_WIZARD_CONFIG,
  WIZARD_STEPS,
  validateWizardStep,
  getNextWizardStep,
  getPreviousWizardStep,
  isWizardStepAccessible,
  createSafeWizardState,
  CALIBRATION_STRATEGY_CONFIGS,
} from '../../balancing/config/weightWizardConfig';

type CalibrationResultEntry = NonNullable<WizardState['results']['calibrationResults']>[number];
type CalibrationSummary = NonNullable<WizardState['results']['summary']>;
type WeightCalibrationResults = Pick<NonNullable<WizardState['results']>, 'calibrationResults' | 'simulationResults' | 'summary'>;

interface WeightCalibrationSimulationRun {
  metrics?: Record<string, number>;
}

type MonteCarloResult = ScenarioResult & {
  runs?: WeightCalibrationSimulationRun[];
};

/**
 * Weight calibration hook return type
 */
export interface UseWeightCalibrationReturn {
  /** Current wizard state */
  state: WizardState;
  /** Update wizard state */
  updateState: (updates: Partial<WizardState>) => void;
  /** Navigate to next step */
  nextStep: () => boolean;
  /** Navigate to previous step */
  previousStep: () => boolean;
  /** Jump to specific step */
  goToStep: (step: WizardStep) => boolean;
  /** Validate current step */
  validateCurrentStep: () => string[];
  /** Check if step is accessible */
  isStepAccessible: (step: WizardStep) => boolean;
  /** Run calibration simulation */
  runCalibration: () => Promise<void>;
  /** Stop calibration simulation */
  stopCalibration: () => void;
  /** Reset wizard to initial state */
  resetWizard: () => void;
  /** Export calibration results */
  exportResults: () => string;
  /** Import calibration configuration */
  importConfiguration: (config: string) => boolean;
}

/**
 * Hook for managing weight calibration workflow
 */
export function useWeightCalibration(initialState?: Partial<WizardState>): UseWeightCalibrationReturn {
  const { config: balancerConfig } = useBalancerConfig();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Initialize wizard state
  const [state, setState] = useState<WizardState>(() => 
    createSafeWizardState({
      ...DEFAULT_WIZARD_CONFIG,
      ...initialState,
    })
  );

  /**
   * Update wizard state with validation
   */
  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState(prevState => {
      const newState = createSafeWizardState({ ...prevState, ...updates });
      
      // Clear errors when state changes
      if (updates.currentStep || updates.selectedStats || updates.weights || updates.targets) {
        newState.errors = [];
      }
      
      return newState;
    });
  }, []);

  /**
   * Navigate to next wizard step
   */
  const nextStep = useCallback((): boolean => {
    const currentStep = state.currentStep;
    const errors = validateWizardStep(currentStep, state);
    
    if (errors.length > 0) {
      updateState({ errors });
      return false;
    }
    
    const next = getNextWizardStep(currentStep);
    if (next) {
      updateState({ currentStep: next, progress: WIZARD_STEPS.indexOf(next) / (WIZARD_STEPS.length - 1) });
      return true;
    }
    
    return false;
  }, [state, updateState]);

  /**
   * Navigate to previous wizard step
   */
  const previousStep = useCallback((): boolean => {
    const previous = getPreviousWizardStep(state.currentStep);
    if (previous) {
      updateState({ currentStep: previous, progress: WIZARD_STEPS.indexOf(previous) / (WIZARD_STEPS.length - 1) });
      return true;
    }
    return false;
  }, [state.currentStep, updateState]);

  /**
   * Jump to specific wizard step
   */
  const goToStep = useCallback((step: WizardStep): boolean => {
    if (!isWizardStepAccessible(step, state)) {
      return false;
    }
    
    updateState({ currentStep: step, progress: WIZARD_STEPS.indexOf(step) / (WIZARD_STEPS.length - 1) });
    return true;
  }, [state, updateState]);

  /**
   * Validate current wizard step
   */
  const validateCurrentStep = useCallback((): string[] => {
    return validateWizardStep(state.currentStep, state);
  }, [state]);

  /**
   * Check if step is accessible
   */
  const isStepAccessible = useCallback((step: WizardStep): boolean => {
    return isWizardStepAccessible(step, state);
  }, [state]);

  /**
   * Create scenario configuration from wizard state
   */
  const createScenarioConfig = useCallback((): ScenarioConfig => {
    const { simulationConfig, selectedStats, weights } = state;
    
    // Create stat weights map
    const statWeights: Record<string, number> = {};
    weights.forEach(weight => {
      statWeights[weight.statId] = weight.weight;
    });
    
    return {
      id: `weight-calibration-${Date.now()}`,
      name: 'Weight Calibration Scenario',
      description: 'Monte Carlo simulation for weight calibration',
      type: '1v1',
      targetTurns: simulationConfig.targetTurns,
      simulationParams: {
        iterations: simulationConfig.iterations,
        seed: simulationConfig.seed,
        parallelRuns: simulationConfig.parallelRuns,
      },
      statWeights,
      selectedStats,
      metadata: {
        calibrationTargets: state.targets,
        timestamp: Date.now(),
        wizardVersion: '1.0.0',
      },
    } as ScenarioConfig;
  }, [state]);

  /**
   * Process simulation results and calculate calibrated weights
   */
  const processSimulationResults = useCallback((
    simulationResults: WeightCalibrationSimulationRun[],
    targets: CalibrationTarget[]
  ): WeightCalibrationResults => {
    // This is a simplified implementation - in reality this would be more sophisticated
    const calibratedWeights: Record<string, number> = {};
    const calibrationResults: CalibrationResultEntry[] = [];
    
    // Calculate average performance metrics
    const totalRuns = simulationResults.length || 1;
    const avgMetrics = simulationResults.reduce<Record<string, number>>((acc, result) => {
      Object.entries(result.metrics || {}).forEach(([metric, value]) => {
        acc[metric] = (acc[metric] || 0) + (value ?? 0);
      });
      return acc;
    }, {});
    
    Object.keys(avgMetrics).forEach(metric => {
      avgMetrics[metric] /= totalRuns;
    });
    
    // Calculate weight adjustments based on targets
    state.weights.forEach(weight => {
      const originalWeight = weight.weight;
      let calibratedWeight = originalWeight;
      
      // Simple calibration logic - would be more sophisticated in reality
      targets.forEach(target => {
        const strategyConfig = CALIBRATION_STRATEGY_CONFIGS[target.strategy];
        const currentValue = avgMetrics[strategyConfig.metric] || 0;
        const safeTargetValue = target.targetValue || 1;
        
        // Adjust weight based on how close we are to target
        const ratio = currentValue / safeTargetValue;
        if (ratio < 1 - target.tolerance) {
          // Need to increase weight
          calibratedWeight *= 1.1;
        } else if (ratio > 1 + target.tolerance) {
          // Need to decrease weight
          calibratedWeight *= 0.9;
        }
      });
      
      calibratedWeights[weight.statId] = calibratedWeight;
      
      calibrationResults.push({
        statId: weight.statId,
        originalWeight,
        calibratedWeight,
        improvement: ((calibratedWeight - originalWeight) / originalWeight) * 100,
        confidence: Math.min(0.95, totalRuns / 1000), // Simple confidence calculation
        iterations: totalRuns,
      });
    });
    
    // Calculate summary metrics
    const totalImprovement = calibrationResults.reduce((sum, result) => sum + Math.abs(result.improvement), 0);
    const averageConfidence = calibrationResults.length > 0
      ? calibrationResults.reduce((sum, result) => sum + result.confidence, 0) / calibrationResults.length
      : 0;
    const targetsMet = targets.filter(target => {
      const strategyConfig = CALIBRATION_STRATEGY_CONFIGS[target.strategy];
      const currentValue = avgMetrics[strategyConfig.metric] || 0;
      const safeTargetValue = target.targetValue || 1;
      const ratio = currentValue / safeTargetValue;
      return Math.abs(ratio - 1) <= target.tolerance;
    }).length;
    
    const summary: CalibrationSummary = {
      totalImprovement,
      averageConfidence,
      targetsMet,
      totalTargets: targets.length,
      recommendedWeights: calibratedWeights,
    };

    return {
      calibrationResults,
      simulationResults,
      summary,
    };
  }, [state.weights]);

  /**
   * Run calibration simulation
   */
  const runCalibration = useCallback(async (): Promise<void> => {
    if (state.isRunning) {
      return;
    }
    
    try {
      updateState({ isRunning: true, progress: 0, errors: [] });
      
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();
      
      // Create scenario configuration
      const scenarioConfig = createScenarioConfig();
      
      // Update progress
      updateState({ progress: 0.1 });
      
      // Run Monte Carlo simulation
      const result = await runMonteCarloSimulation(
        scenarioConfig,
        balancerConfig,
        false // verbose
      );
      const monteCarloResult = result as MonteCarloResult;
      
      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      // Update progress
      updateState({ progress: 0.8 });
      
      // Process results
      const processedResults = processSimulationResults(monteCarloResult.runs ?? [], state.targets);
      
      // Update state with results
      updateState({
        results: processedResults,
        isRunning: false,
        progress: 1.0,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateState({
        isRunning: false,
        progress: 0,
        errors: [errorMessage],
      });
    } finally {
      abortControllerRef.current = null;
    }
  }, [state, balancerConfig, createScenarioConfig, processSimulationResults, updateState]);

  /**
   * Stop calibration simulation
   */
  const stopCalibration = useCallback((): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    updateState({
      isRunning: false,
      progress: 0,
    });
  }, [updateState]);

  /**
   * Reset wizard to initial state
   */
  const resetWizard = useCallback((): void => {
    stopCalibration();
    setState(createSafeWizardState(DEFAULT_WIZARD_CONFIG));
  }, [stopCalibration]);

  /**
   * Export calibration results
   */
  const exportResults = useCallback((): string => {
    const exportData = {
      wizardState: state,
      timestamp: Date.now(),
      version: '1.0.0',
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [state]);

  /**
   * Import calibration configuration
   */
  const importConfiguration = useCallback((config: string): boolean => {
    try {
      const importedData = JSON.parse(config);
      
      if (importedData.wizardState) {
        setState(createSafeWizardState(importedData.wizardState));
        return true;
      }
      
      return false;
    } catch (parseError) {
      console.error('Failed to import weight calibration config', parseError);
      updateState({ errors: ['Invalid configuration format'] });
      return false;
    }
  }, [updateState]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    state,
    updateState,
    nextStep,
    previousStep,
    goToStep,
    validateCurrentStep,
    isStepAccessible,
    runCalibration,
    stopCalibration,
    resetWizard,
    exportResults,
    importConfiguration,
  };
}

/**
 * Helper hook for weight validation
 */
export function useWeightValidation(statId: string, initialValue: number = 1.0) {
  const [weight, setWeight] = useState(initialValue);
  const [errors, setErrors] = useState<string[]>([]);
  
  const validateWeight = useCallback((value: number): string[] => {
    const newErrors: string[] = [];
    
    if (value < 0.1) {
      newErrors.push('Weight must be at least 0.1');
    }
    if (value > 5.0) {
      newErrors.push('Weight cannot exceed 5.0');
    }
    
    setErrors(newErrors);
    return newErrors;
  }, []);
  
  const updateWeight = useCallback((value: number) => {
    setWeight(value);
    validateWeight(value);
  }, [validateWeight]);
  
  return {
    weight,
    setWeight: updateWeight,
    errors,
    isValid: errors.length === 0,
  };
}

/**
 * Helper hook for simulation progress tracking
 */
export function useSimulationProgress() {
  const [progress, setProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const totalIterationsRef = useRef<number>(0);
  
  const startProgress = useCallback((totalIterations: number) => {
    startTimeRef.current = Date.now();
    totalIterationsRef.current = totalIterations;
    setProgress(0);
    setEstimatedTimeRemaining(0);
  }, []);
  
  const updateProgress = useCallback((currentIteration: number, totalIterations: number) => {
    const safeTotal = totalIterations || totalIterationsRef.current || 1;
    const progressPercent = currentIteration / safeTotal;
    setProgress(progressPercent);
    
    if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      const estimatedTotal = progressPercent > 0 ? elapsed / progressPercent : 0;
      const remaining = estimatedTotal - elapsed;
      setEstimatedTimeRemaining(remaining);
    }
  }, []);
  
  const completeProgress = useCallback(() => {
    setProgress(1);
    setEstimatedTimeRemaining(0);
    startTimeRef.current = null;
  }, []);
  
  return {
    progress,
    estimatedTimeRemaining,
    startProgress,
    updateProgress,
    completeProgress,
  };
}
