import { useCallback, useState, useMemo } from 'react';
import type { StressTestArchetype, StressTestConfig, MarginalUtilityResult, SynergyResult } from '@/balancing/stressTesting/types';
import { useBalancerConfig } from '@/balancing/hooks/useBalancerConfig';
import { StressTestArchetypeGenerator } from '@/balancing/stressTesting/StressTestArchetypeGenerator';
import { MarginalUtilityCalculator } from '@/balancing/stressTesting/MarginalUtilityCalculator';
import { PersistenceService } from '@/shared/persistence/PersistenceService';

interface StressTestHistoryEntry {
  id: string;
  timestamp: number;
  config: StressTestConfig;
  archetypes: StressTestArchetype[];
  marginalUtilities: MarginalUtilityResult[];
  synergies: SynergyResult[];
  runtimeMs: number;
}

const STRESS_TEST_CONFIG_KEY = 'stress_test_config';
const STRESS_TEST_RESULTS_KEY = 'stress_test_results';

/**
 * Hook for managing stress testing operations and data
 * 
 * Features:
 * - Load and save stress test configurations
 * - Generate archetypes and run marginal utility analysis
 * - Manage historical results and progress tracking
 * - Config-first design with BalancerConfig integration
 * - Telemetry integration for user interactions
 */
export function useStressTesting(options: {
  enableTelemetry?: boolean;
  enablePersistence?: boolean;
  autoSave?: boolean;
} = {}) {
  const { enableTelemetry = true, enablePersistence = true, autoSave = true } = options;
  const { config } = useBalancerConfig();
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConfig, setCurrentConfig] = useState<StressTestConfig>({
    pointsPerStat: 25,
    simulationCount: 1000,
    opSynergyThreshold: 1.15,
    weakSynergyThreshold: 0.95,
    seed: 12345,
    includeDerived: false,
    includeHidden: false
  });
  
  const [archetypes, setArchetypes] = useState<StressTestArchetype[]>([]);
  const [marginalUtilities, setMarginalUtilities] = useState<MarginalUtilityResult[]>([]);
  const [synergies, setSynergies] = useState<SynergyResult[]>([]);
  const [historicalResults, setHistoricalResults] = useState<StressTestHistoryEntry[]>([]);

  // Generate stat labels from config
  const statLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    Object.entries(config.stats).forEach(([id, stat]) => {
      labels[id] = stat.label;
    });
    return labels;
  }, [config]);

  // Load saved data from persistence
  const loadSavedData = useCallback(async () => {
    if (!enablePersistence) return;
    
    try {
      const savedConfig = await PersistenceService.loadData<StressTestConfig>(STRESS_TEST_CONFIG_KEY, currentConfig);
      const savedResults = await PersistenceService.loadData<StressTestHistoryEntry[]>(STRESS_TEST_RESULTS_KEY, []);
      
      if (savedConfig) setCurrentConfig(savedConfig);
      if (savedResults && Array.isArray(savedResults)) {
        setHistoricalResults(savedResults);
      }
    } catch (error) {
      console.error('Failed to load stress test data:', error);
    }
  }, [currentConfig, enablePersistence]);

  // Save data to persistence
  const saveData = useCallback(async <T,>(data: T, key: string) => {
    if (!enablePersistence) return;
    
    try {
      await PersistenceService.saveData(key, data);
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  }, [enablePersistence]);

  // Generate archetypes
  const generateArchetypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const generator = new StressTestArchetypeGenerator(config);
      const generatedArchetypes = generator.generateArchetypes(currentConfig);
      
      setArchetypes(generatedArchetypes);
      
      if (enableTelemetry) {
        console.log('stress_test_archetypes_generated', {
          archetypeCount: generatedArchetypes.length,
          config: currentConfig
        });
      }
      
      return generatedArchetypes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate archetypes';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [config, currentConfig, enableTelemetry]);

  // Run marginal utility analysis
  const runAnalysis = useCallback(async (archetypesToAnalyze?: StressTestArchetype[]) => {
    setIsLoading(true);
    setError(null);
    
    const targetArchetypes = archetypesToAnalyze || archetypes;
    
    try {
      const calculator = new MarginalUtilityCalculator({
        thresholds: {
          opThreshold: currentConfig.opSynergyThreshold,
          weakThreshold: currentConfig.weakSynergyThreshold,
        },
        simulation: {
          simulationCount: currentConfig.simulationCount,
          concurrencyLimit: 1,
          seed: currentConfig.seed,
        },
        enableLogging: enableTelemetry,
        enableCaching: true,
        export: {
          enableJson: true,
          enableCsv: false,
          enableMarkdown: false,
          exportPath: '/tmp/stress-testing',
        },
      });
      
      // Separate single and pair archetypes
      const singleArchetypes = targetArchetypes.filter(a => a.type === 'single');
      const pairArchetypes = targetArchetypes.filter(a => a.type === 'pair');
      
      // Run marginal utility analysis
      const utilityResults = calculator.analyzeArchetypes(singleArchetypes);
      const synergyResults = calculator.analyzeSynergies(pairArchetypes, utilityResults);
      
      setMarginalUtilities(utilityResults);
      setSynergies(synergyResults);
      
      // Save to historical results if enabled
      if (autoSave && enablePersistence) {
        const result: StressTestHistoryEntry = {
          id: `stress_test_${Date.now()}`,
          timestamp: Date.now(),
          config: currentConfig,
          archetypes: targetArchetypes,
          marginalUtilities: utilityResults,
          synergies: synergyResults,
          runtimeMs: 0 // TODO: Add timing
        };
        
        const updatedHistory = [...historicalResults, result].slice(-50); // Keep last 50 results
        setHistoricalResults(updatedHistory);
        await saveData(updatedHistory, STRESS_TEST_RESULTS_KEY);
      }
      
      if (enableTelemetry) {
        console.log('stress_test_analysis_completed', {
          archetypeCount: targetArchetypes.length,
          utilityResults: utilityResults.length,
          synergyResults: synergyResults.length
        });
      }
      
      return { utilityResults, synergyResults };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to run analysis';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [archetypes, currentConfig, autoSave, enablePersistence, enableTelemetry, historicalResults, saveData]);

  // Export results
  const exportResults = useCallback(async (format: 'json' | 'csv' | 'markdown' = 'json') => {
    const data = {
      config: currentConfig,
      archetypes,
      marginalUtilities,
      synergies,
      timestamp: Date.now()
    };
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stress_test_results_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // TODO: Implement CSV export
      console.log('CSV export not yet implemented');
    } else if (format === 'markdown') {
      // TODO: Implement Markdown export
      console.log('Markdown export not yet implemented');
    }
    
    if (enableTelemetry) {
      console.log('stress_test_results_exported', { format });
    }
  }, [currentConfig, archetypes, marginalUtilities, synergies, enableTelemetry]);

  // Clear all data
  const clearData = useCallback(() => {
    setArchetypes([]);
    setMarginalUtilities([]);
    setSynergies([]);
    setError(null);
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<StressTestConfig>) => {
    const updatedConfig = { ...currentConfig, ...newConfig };
    setCurrentConfig(updatedConfig);
    
    if (autoSave && enablePersistence) {
      saveData(updatedConfig, STRESS_TEST_CONFIG_KEY);
    }
  }, [currentConfig, autoSave, enablePersistence, saveData]);

  // Initialize on mount
  useState(() => {
    loadSavedData();
  });

  return {
    // State
    isLoading,
    error,
    currentConfig,
    archetypes,
    marginalUtilities,
    synergies,
    historicalResults,
    statLabels,
    
    // Actions
    generateArchetypes,
    runAnalysis,
    exportResults,
    clearData,
    updateConfig,
    
    // Computed values
    hasResults: archetypes.length > 0 && marginalUtilities.length > 0,
    totalArchetypes: archetypes.length,
    opSynergies: synergies.filter(s => s.isOpSynergy).length,
    weakSynergies: synergies.filter(s => s.isWeakSynergy).length
  };
}
