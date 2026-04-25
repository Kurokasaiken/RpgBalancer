import { useCallback, useState } from 'react';
import type { MarginalUtilityMetrics, PairSynergyMetrics } from '../../balancing/testing/metrics';
import { runStatStressTestsForConfig } from '../../balancing/testing/runStatStressTestsForConfig';
import { useBalancerConfig } from '../../balancing/hooks/useBalancerConfig';

interface UseStressTestingState {
  singleStats: MarginalUtilityMetrics[];
  pairStats: PairSynergyMetrics[];
  isRunning: boolean;
  hasRun: boolean;
  error?: string;
}

export function useStressTesting() {
  const { config } = useBalancerConfig();
  const STRESS_TEST_SEED = 987654;
  const [state, setState] = useState<UseStressTestingState>({
    singleStats: [],
    pairStats: [],
    isRunning: false,
    hasRun: false,
  });

  const runTests = useCallback(
    async (iterations: number = 5000) => {
      setState((prev) => ({ ...prev, isRunning: true, error: undefined }));
      try {
        const results = await runStatStressTestsForConfig(config, iterations, STRESS_TEST_SEED);
        setState({ ...results, isRunning: false, hasRun: true });
      } catch (e) {
        setState((prev) => ({ ...prev, isRunning: false, error: (e as Error).message }));
      }
    },
    [config],
  );

  return {
    singleStats: state.singleStats,
    pairStats: state.pairStats,
    isRunning: state.isRunning,
    hasRun: state.hasRun,
    error: state.error,
    runTests,
  };
}
