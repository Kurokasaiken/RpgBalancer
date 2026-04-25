import { useState } from 'react';
import { SafeguardReport, SafeguardMonitor, SafeguardMonitorConfig } from '../../../scripts/coordinator/safeguardMonitor';

/**
 * Hook for managing safeguard monitor data
 */
export function useSafeguardMonitor(config?: Partial<SafeguardMonitorConfig>) {
  const [data, setData] = useState<SafeguardReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Run safeguard monitoring
   */
  const runMonitor = async () => {
    setLoading(true);
    setError(null);

    try {
      const monitor = new SafeguardMonitor(config);
      const report = await monitor.run();
      setData(report);
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run safeguard monitor';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate evidence logs
   */
  const validateEvidence = async () => {
    try {
      const monitor = new SafeguardMonitor(config);
      const results = await monitor['harvestEvidence']();
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate evidence';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Clear data and errors
   */
  const clear = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return {
    data,
    loading,
    error,
    runMonitor,
    validateEvidence,
    clear,
  };
}

export default useSafeguardMonitor;
