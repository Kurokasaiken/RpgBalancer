import { useCallback, useState } from 'react';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';
import {
  runRoundRobinTests,
  runAllTiersRoundRobin,
} from '../../balancing/testing/runRoundRobinTests';
import type {
  RoundRobinResults,
  AggregatedRoundRobinResults,
} from '../../balancing/testing/RoundRobinRunner';

interface UseRoundRobinTestingState {
  /** Results for all tiers (aggregated) */
  aggregatedResults: AggregatedRoundRobinResults | null;
  /** Currently selected tier for display (null = aggregated view) */
  selectedTier: number | null;
  isRunning: boolean;
  error?: string;
}

export function useRoundRobinTesting() {
  const { config } = useBalancerConfig();
  const ROUND_ROBIN_SEED = 123456;
  const [state, setState] = useState<UseRoundRobinTestingState>({
    aggregatedResults: null,
    selectedTier: null,
    isRunning: false,
  });

  /**
   * Run all tiers (25, 50, 75, 100) and aggregate results.
   */
  const runAllTiers = useCallback(
    async (iterations: number = 10000) => {
      setState((prev) => ({ ...prev, isRunning: true, error: undefined }));
      
      // Immediate yield to ensure UI updates before starting heavy computation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      try {
        const results = await runAllTiersRoundRobin(config, iterations, ROUND_ROBIN_SEED);
        setState({
          aggregatedResults: results,
          selectedTier: null, // Show aggregated by default
          isRunning: false,
        });
      } catch (e) {
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: (e as Error).message,
        }));
      }
    },
    [config]
  );

  /**
   * Run a single tier only.
   */
  const runSingleTier = useCallback(
    async (tier: number, iterations: number = 10000) => {
      setState((prev) => ({ ...prev, isRunning: true, error: undefined }));
      
      // Immediate yield to ensure UI updates before starting heavy computation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      try {
        const results = await runRoundRobinTests(config, tier, iterations, ROUND_ROBIN_SEED);
        // Store as aggregated with single tier
        setState({
          aggregatedResults: {
            byTier: { [tier]: results },
            aggregatedEfficiencies: results.efficiencies,
            tiers: [tier],
            iterations,
            timestamp: results.timestamp,
          },
          selectedTier: tier,
          isRunning: false,
        });
      } catch (e) {
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: (e as Error).message,
        }));
      }
    },
    [config]
  );

  const setSelectedTier = useCallback((tier: number | null) => {
    setState((prev) => ({ ...prev, selectedTier: tier }));
  }, []);

  /**
   * Get the currently displayed results based on selectedTier.
   */
  const getCurrentResults = (): RoundRobinResults | null => {
    if (!state.aggregatedResults) return null;
    if (state.selectedTier === null) {
      // Return aggregated as a pseudo-RoundRobinResults
      return {
        matchups: [], // Aggregated doesn't have combined matchups
        efficiencies: state.aggregatedResults.aggregatedEfficiencies,
        tier: 0, // Indicates aggregated
        iterations: state.aggregatedResults.iterations,
        timestamp: state.aggregatedResults.timestamp,
      };
    }
    return state.aggregatedResults.byTier[state.selectedTier] ?? null;
  };

  return {
    aggregatedResults: state.aggregatedResults,
    currentResults: getCurrentResults(),
    selectedTier: state.selectedTier,
    isRunning: state.isRunning,
    error: state.error,
    runAllTiers,
    runSingleTier,
    setSelectedTier,
  };
}
