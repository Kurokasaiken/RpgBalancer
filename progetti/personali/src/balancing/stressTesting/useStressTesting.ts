/**
 * @fileoverview React hook for managing stress testing and marginal utility analysis.
 * Provides reactive access to archetype generation, simulation running, and results.
 */

import { useState, useCallback, useMemo } from 'react';
import { useBalancerConfig } from '../hooks/useBalancerConfig';
import {
  generateStressTestArchetypes,
  validateStressTestArchetypes,
  type StressTestArchetype
} from './StressTestArchetypeGenerator';
import {
  calculateMarginalUtility,
  type MarginalUtilityAnalysis,
  type MarginalUtilityConfig
} from './MarginalUtilityCalculator';

/**
 * State of stress testing analysis.
 */
export interface StressTestingState {
  /** Whether analysis is currently running */
  isRunning: boolean;
  /** Generated archetypes */
  archetypes: StressTestArchetype[];
  /** Analysis results (null if not run yet) */
  results: MarginalUtilityAnalysis | null;
  /** Last error encountered */
  error: string | null;
  /** Configuration for analysis */
  config: MarginalUtilityConfig;
}

/**
 * Return type for useStressTesting hook.
 */
export interface UseStressTestingReturn extends StressTestingState {
  /** Generate archetypes from current balancer config */
  generateArchetypes: () => Promise<void>;
  /** Run marginal utility analysis */
  runAnalysis: () => Promise<void>;
  /** Update analysis configuration */
  updateConfig: (config: Partial<MarginalUtilityConfig>) => void;
  /** Reset analysis state */
  reset: () => void;
  /** Export results as JSON */
  exportResults: () => string | null;
}

/**
 * Default configuration for stress testing.
 */
const DEFAULT_CONFIG: MarginalUtilityConfig = {
  simulationsPerArchetype: 10000,
  opSynergyThreshold: 1.15,
  weakSynergyThreshold: 0.95,
  confidenceLevel: 0.95,
  randomSeed: 42,
};

/**
 * React hook for stress testing and marginal utility analysis.
 * Manages archetype generation, simulation running, and result presentation.
 *
 * @returns Object containing state and methods for stress testing
 */
export function useStressTesting(): UseStressTestingReturn {
  const { config: balancerConfig } = useBalancerConfig();

  const [state, setState] = useState<StressTestingState>({
    isRunning: false,
    archetypes: [],
    results: null,
    error: null,
    config: DEFAULT_CONFIG,
  });

  /**
   * Generates stress test archetypes from current balancer configuration.
   */
  const generateArchetypes = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRunning: true, error: null }));

      const archetypes = generateStressTestArchetypes(balancerConfig);
      validateStressTestArchetypes(archetypes, balancerConfig);

      setState(prev => ({
        ...prev,
        archetypes,
        isRunning: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate archetypes';
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: errorMessage,
      }));
      console.error('Stress testing archetype generation failed:', error);
    }
  }, [balancerConfig]);

  /**
   * Runs marginal utility analysis on generated archetypes.
   */
  const runAnalysis = useCallback(async () => {
    if (state.archetypes.length === 0) {
      setState(prev => ({ ...prev, error: 'No archetypes generated. Run generateArchetypes first.' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isRunning: true, error: null }));

      const results = calculateMarginalUtility(state.archetypes, state.config);

      setState(prev => ({
        ...prev,
        results,
        isRunning: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to run analysis';
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: errorMessage,
      }));
      console.error('Stress testing analysis failed:', error);
    }
  }, [state.archetypes, state.config]);

  /**
   * Updates analysis configuration.
   */
  const updateConfig = useCallback((configUpdate: Partial<MarginalUtilityConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...configUpdate },
    }));
  }, []);

  /**
   * Resets analysis state.
   */
  const reset = useCallback(() => {
    setState({
      isRunning: false,
      archetypes: [],
      results: null,
      error: null,
      config: DEFAULT_CONFIG,
    });
  }, []);

  /**
   * Exports analysis results as JSON string.
   */
  const exportResults = useCallback((): string | null => {
    if (!state.results) return null;

    const exportData = {
      timestamp: new Date().toISOString(),
      config: state.config,
      balancerConfig: {
        version: balancerConfig.version,
        stats: Object.keys(balancerConfig.stats),
        cards: Object.keys(balancerConfig.cards),
        activePreset: balancerConfig.activePresetId,
      },
      results: state.results,
    };

    return JSON.stringify(exportData, null, 2);
  }, [state.results, state.config, balancerConfig]);

  // Derived values
  const derivedState = useMemo(() => ({
    hasArchetypes: state.archetypes.length > 0,
    hasResults: state.results !== null,
    totalArchetypes: state.archetypes.length,
    singleStatsCount: state.archetypes.filter(a => a.type === 'single').length,
    pairStatsCount: state.archetypes.filter(a => a.type === 'pair').length,
  }), [state.archetypes, state.results]);

  return {
    ...state,
    ...derivedState,
    generateArchetypes,
    runAnalysis,
    updateConfig,
    reset,
    exportResults,
  };
}
