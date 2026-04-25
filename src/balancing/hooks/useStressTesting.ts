import { useCallback, useState, useMemo, useRef } from 'react';
import type { StressTestArchetype, StressTestConfig } from '@/balancing/stressTesting/types';
import { useBalancerConfig } from './useBalancerConfig';
import { StressTestArchetypeGenerator } from '@/balancing/stressTesting/StressTestArchetypeGenerator';
import {
  MarginalUtilityCalculator,
  type MarginalUtilityResult,
  type SynergyResult,
} from '@/balancing/stressTesting/MarginalUtilityCalculator';
import { DEFAULT_1V1_CONFIG } from '@/balancing/1v1/mathEngine';
import { validateStressTestConfig } from '@/balancing/stressTesting/types';

/**
 * Enhanced stress testing configuration
 */
export interface EnhancedStressTestConfig extends StressTestConfig {
  customPointAllocation?: boolean;
  customPointsPerStat?: Record<string, number>;
  enableProgressTracking?: boolean;
  enableCancellation?: boolean;
  enableHistoricalTracking?: boolean;
  enableWhatIfScenarios?: boolean;
}

/**
 * Progress tracking for long-running operations
 */
export interface StressTestProgress {
  stage: 'generating' | 'analyzing' | 'calculating_synergies' | 'completed' | 'error';
  currentStep: number;
  totalSteps: number;
  currentOperation: string;
  estimatedTimeRemaining?: number;
  isCancellable: boolean;
}

/**
 * Historical tracking for results
 */
export interface HistoricalResult {
  id: string;
  timestamp: number;
  config: EnhancedStressTestConfig;
  results: {
    archetypes: StressTestArchetype[];
    marginalUtilities: MarginalUtilityResult[];
    synergies: SynergyResult[];
    heatmapData: Record<string, Record<string, number>>;
  };
  runtimeMs: number;
  summary: {
    totalArchetypes: number;
    opSynergies: number;
    weakSynergies: number;
    avgMultiplier: number;
  };
}

/**
 * What-if scenario configuration
 */
export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  config: Partial<EnhancedStressTestConfig>;
  baselineConfig: string; // Reference to baseline config ID
}

/**
 * Enhanced stress testing results with progress and history
 */
export interface StressTestingResults {
  archetypes: StressTestArchetype[];
  marginalUtilities: MarginalUtilityResult[];
  synergies: SynergyResult[];
  heatmapData: Record<string, Record<string, number>>;
  isLoading: boolean;
  error: string | null;
  progress?: StressTestProgress;
  history: HistoricalResult[];
  scenarios: WhatIfScenario[];
}

export interface StressTestingCache {
  archetypes: Record<string, StressTestArchetype[] | undefined>;
  marginalUtilities: Record<string, MarginalUtilityResult[] | undefined>;
  synergies: Record<string, SynergyResult[] | undefined>;
  heatmapData: Record<string, Record<string, Record<string, number>> | undefined>;
}

const TIMEOUT_MS = 60000; // Increased for complex analyses

export function useStressTesting(
  customConfig?: Partial<EnhancedStressTestConfig>
): StressTestingResults & {
  // Core operations
  generateArchetypes: () => Promise<void>;
  runAnalysis: () => Promise<void>;
  exportResults: (format: 'json' | 'csv' | 'markdown') => string | { marginalCsv: string; synergiesCsv: string };
  
  // Selection and filtering
  selectStat: (statId: string) => void;
  selectPair: (stat1: string, stat2: string) => void;
  selectedStat: string | null;
  selectedPair: { stat1: string; stat2: string } | null;
  refreshData: () => Promise<void>;
  
  // Advanced features
  updateConfig: (config: Partial<EnhancedStressTestConfig>) => void;
  currentConfig: EnhancedStressTestConfig;
  cancelOperation: () => void;
  saveToHistory: (name: string) => void;
  loadFromHistory: (id: string) => void;
  createScenario: (scenario: Omit<WhatIfScenario, 'id'>) => void;
  runScenario: (scenarioId: string) => Promise<void>;
  clearHistory: () => void;
} {
  const { config } = useBalancerConfig();
  const [cache, setCache] = useState<StressTestingCache>({
    archetypes: {},
    marginalUtilities: {},
    synergies: {},
    heatmapData: {},
  });
  
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<{ stat1: string; stat2: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<StressTestProgress | undefined>();
  const [history, setHistory] = useState<HistoricalResult[]>([]);
  const [scenarios, setScenarios] = useState<WhatIfScenario[]>([]);
  const [currentConfig, setCurrentConfig] = useState<EnhancedStressTestConfig>(() => 
    validateStressTestConfig(customConfig || {})
  );
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const operationStartTimeRef = useRef<number>(0);

  const archetypes = useMemo(() => {
    const archs = cache.archetypes['all'] || [];
    if (selectedStat) {
      return archs.filter(a => a.id.includes(`single_${selectedStat}`) || a.id === 'baseline');
    }
    if (selectedPair) {
      return archs.filter(a => a.id.includes(`pair_${selectedPair.stat1}_${selectedPair.stat2}`) || a.id === 'baseline');
    }
    return archs;
  }, [cache.archetypes, selectedStat, selectedPair]);

  const marginalUtilities = useMemo(() => {
    return cache.marginalUtilities['all'] || [];
  }, [cache.marginalUtilities]);

  const synergies = useMemo(() => {
    return cache.synergies['all'] || [];
  }, [cache.synergies]);

  const heatmapData = useMemo(() => {
    return cache.heatmapData['all'] || {};
  }, [cache.heatmapData]);

  const updateProgress = useCallback((stage: StressTestProgress['stage'], currentStep: number, totalSteps: number, operation: string) => {
    if (!currentConfig.enableProgressTracking) return;
    
    const elapsed = Date.now() - operationStartTimeRef.current;
    const avgTimePerStep = elapsed / Math.max(currentStep, 1);
    const estimatedTimeRemaining = (totalSteps - currentStep) * avgTimePerStep;
    
    setProgress({
      stage,
      currentStep,
      totalSteps,
      currentOperation: operation,
      estimatedTimeRemaining,
      isCancellable: currentConfig.enableCancellation || false,
    });
  }, [currentConfig]);

  const withTimeout = <T>(promise: Promise<T>, operation: string): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
    );
    return Promise.race([promise, timeoutPromise]);
  };

  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setError('Operation cancelled by user');
      setProgress(undefined);
    }
  }, []);

  const generateArchetypes = useCallback(async () => {
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);
    operationStartTimeRef.current = Date.now();
    
    try {
      console.log(`[useStressTesting] Starting archetype generation with config:`, currentConfig);
      updateProgress('generating', 0, 1, 'Initializing generator');

      const operationPromise = (async () => {
        const generator = new StressTestArchetypeGenerator(config);
        
        // Apply custom configuration
        if (currentConfig.customPointAllocation && currentConfig.customPointsPerStat) {
          // Custom point allocation logic would go here
          updateProgress('generating', 1, 3, 'Applying custom point allocation');
        }
        
        updateProgress('generating', 2, 3, 'Generating archetypes');
        const archetypes = generator.generateAllStressTestArchetypes();
        
        updateProgress('generating', 3, 3, 'Finalizing archetypes');
        return archetypes;
      })();

      const archetypes = await withTimeout(operationPromise, 'Archetype generation');
      const endTime = Date.now();
      console.log(`[useStressTesting] Archetype generation completed in ${endTime - operationStartTimeRef.current}ms`);

      setCache(prev => ({ 
        ...prev, 
        archetypes: { 
          ...prev.archetypes, 
          'all': archetypes.map(arch => ({
            id: arch.id,
            name: arch.name,
            description: `Stress test variant of ${arch.name}`,
            stats: arch.stats,
            testedStats: Object.keys(arch.stats),
            pointsPerStat: 25,
            seed: 0,
            type: 'single' as const
          }))
        } 
      }));
      updateProgress('completed', 1, 1, 'Archetype generation completed');
      setIsLoading(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[useStressTesting] Archetype generation cancelled');
      } else {
        console.error('[useStressTesting] Archetype generation failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate archetypes');
      }
      setIsLoading(false);
      setProgress(undefined);
    }
  }, [config, currentConfig, updateProgress]);

  const runAnalysis = useCallback(async () => {
    abortControllerRef.current = new AbortController();
    const archs = cache.archetypes['all'];
    if (!archs || archs.length === 0) {
      setError('No archetypes generated. Run generateArchetypes first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    operationStartTimeRef.current = Date.now();
    
    try {
      console.log(`[useStressTesting] Starting analysis with config:`, currentConfig);
      updateProgress('analyzing', 0, 4, 'Initializing analysis');

      const operationPromise = (async () => {
        const generator = new StressTestArchetypeGenerator(config);
        const allArchs = generator.generateAllStressTestArchetypes();
        const baseline = allArchs.find(a => a.id === 'baseline');
        if (!baseline) throw new Error('Baseline not found');

        updateProgress('analyzing', 1, 4, 'Calculating marginal utilities');
        const calculator = new MarginalUtilityCalculator(baseline, DEFAULT_1V1_CONFIG, currentConfig.simulationCount);
        const marginalUtilities = calculator.analyzeArchetypes(archs);

        updateProgress('calculating_synergies', 2, 4, 'Analyzing synergies');
        const pairArchetypes = archs.filter(a => a.id.startsWith('pair_'));
        const synergies = calculator.analyzeSynergies(pairArchetypes, marginalUtilities);

        updateProgress('calculating_synergies', 3, 4, 'Generating heatmap data');
        const heatmapData = calculator.generateSynergyHeatmapData(synergies);

        updateProgress('completed', 4, 4, 'Analysis completed');
        return { marginalUtilities, synergies, heatmapData };
      })();

      const { marginalUtilities, synergies, heatmapData } = await withTimeout(operationPromise, 'Analysis');
      const endTime = Date.now();
      console.log(`[useStressTesting] Analysis completed in ${endTime - operationStartTimeRef.current}ms`);

      setCache(prev => ({
        ...prev,
        marginalUtilities: { ...prev.marginalUtilities, 'all': marginalUtilities },
        synergies: { ...prev.synergies, 'all': synergies },
        heatmapData: { ...prev.heatmapData, 'all': heatmapData },
      }));
      
      setIsLoading(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[useStressTesting] Analysis cancelled');
      } else {
        console.error('[useStressTesting] Analysis failed:', err);
        setError(err instanceof Error ? err.message : 'Analysis failed');
      }
      setIsLoading(false);
      setProgress(undefined);
    }
  }, [config, cache.archetypes, currentConfig, updateProgress]);

  const exportResults = useCallback((format: 'json' | 'csv' | 'markdown') => {
    const archs = cache.archetypes['all'] || [];
    const baseline = archs.find(a => a.id === 'baseline');
    if (!baseline) return format === 'json' ? '{}' : format === 'csv' ? { marginalCsv: '', synergiesCsv: '' } : '';

    const calculator = new MarginalUtilityCalculator(baseline, DEFAULT_1V1_CONFIG, currentConfig.simulationCount);
    
    if (format === 'json') {
      return calculator.toJson({ 
        marginalUtilities: cache.marginalUtilities['all'] || [], 
        synergies: cache.synergies['all'] || [],
      });
    } else if (format === 'csv') {
      return {
        marginalCsv: calculator.exportMarginalUtilitiesToCsv(cache.marginalUtilities['all'] || []),
        synergiesCsv: calculator.exportSynergiesToCsv(cache.synergies['all'] || []),
      };
    } else {
      // Markdown export
      const marginalUtils = cache.marginalUtilities['all'] || [];
      const synergies = cache.synergies['all'] || [];
      
      let markdown = `# Stress Testing Results\n\n`;
      markdown += `Generated: ${new Date().toISOString()}\n`;
      markdown += `Configuration: ${JSON.stringify(currentConfig, null, 2)}\n\n`;
      
      markdown += `## Marginal Utilities\n\n`;
      markdown += `| Archetype | Score | Marginal Utility | Std Dev |\n`;
      markdown += `|-----------|-------|------------------|--------|\n`;
      
      marginalUtils.forEach(result => {
        markdown += `| ${result.archetype.name} | ${result.averageScore.toFixed(4)} | ${result.marginalUtility.toFixed(2)}% | ${result.standardDeviation.toFixed(4)} |\n`;
      });
      
      markdown += `\n## Synergies\n\n`;
      markdown += `| Pair | Multiplier | Classification | Pair Score | Expected |\n`;
      markdown += `|------|------------|----------------|------------|----------|\n`;
      
      synergies.forEach(synergy => {
        const classification = synergy.isOpSynergy ? 'OP' : synergy.isWeakSynergy ? 'Weak' : 'Neutral';
        markdown += `| ${synergy.statIds.join(' + ')} | ${synergy.synergyMultiplier.toFixed(4)}x | ${classification} | ${synergy.pairScore.toFixed(4)} | ${synergy.expectedScore.toFixed(4)} |\n`;
      });
      
      return markdown;
    }
  }, [cache.marginalUtilities, cache.synergies, cache.archetypes, currentConfig]);

  const updateConfig = useCallback((newConfig: Partial<EnhancedStressTestConfig>) => {
    setCurrentConfig(validateStressTestConfig({ ...currentConfig, ...newConfig }));
  }, [currentConfig]);

  const saveToHistory = useCallback((_name: string) => {
    const archs = cache.archetypes['all'] || [];
    const marginalUtils = cache.marginalUtilities['all'] || [];
    const synergyResults = cache.synergies['all'] || [];
    const heatmap = cache.heatmapData['all'] || {};
    
    const historicalResult: HistoricalResult = {
      id: `hist_${Date.now()}`,
      timestamp: Date.now(),
      config: { ...currentConfig },
      results: {
        archetypes: archs,
        marginalUtilities: marginalUtils,
        synergies: synergyResults,
        heatmapData: heatmap,
      },
      runtimeMs: Date.now() - operationStartTimeRef.current,
      summary: {
        totalArchetypes: archs.length,
        opSynergies: synergyResults.filter(s => s.isOpSynergy).length,
        weakSynergies: synergyResults.filter(s => s.isWeakSynergy).length,
        avgMultiplier: synergyResults.length > 0 
          ? synergyResults.reduce((sum, s) => sum + s.synergyMultiplier, 0) / synergyResults.length 
          : 0,
      },
    };
    
    setHistory(prev => [...prev, historicalResult]);
  }, [cache, currentConfig]);

  const loadFromHistory = useCallback((id: string) => {
    const historicalResult = history.find(h => h.id === id);
    if (!historicalResult) {
      setError('Historical result not found');
      return;
    }
    
    setCache(prev => ({
      ...prev,
      archetypes: { ...prev.archetypes, 'all': historicalResult.results.archetypes },
      marginalUtilities: { ...prev.marginalUtilities, 'all': historicalResult.results.marginalUtilities },
      synergies: { ...prev.synergies, 'all': historicalResult.results.synergies },
      heatmapData: { ...prev.heatmapData, 'all': historicalResult.results.heatmapData },
    }));
    
    setCurrentConfig(historicalResult.config);
  }, [history]);

  const createScenario = useCallback((scenario: Omit<WhatIfScenario, 'id'>) => {
    const newScenario: WhatIfScenario = {
      ...scenario,
      id: `scenario_${Date.now()}`,
    };
    
    setScenarios(prev => [...prev, newScenario]);
  }, []);

  const runScenario = useCallback(async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      setError('Scenario not found');
      return;
    }
    
    // Apply scenario configuration
    const scenarioConfig = validateStressTestConfig({ ...currentConfig, ...scenario.config });
    setCurrentConfig(scenarioConfig);
    
    // Re-run analysis with new config
    await runAnalysis();
  }, [scenarios, currentConfig, runAnalysis]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setScenarios([]);
  }, []);

  const selectStat = useCallback((statId: string) => {
    setSelectedStat(statId);
    setSelectedPair(null);
  }, []);

  const selectPair = useCallback((stat1: string, stat2: string) => {
    setSelectedPair({ stat1, stat2 });
    setSelectedStat(null);
  }, []);

  const refreshData = useCallback(async () => {
    setCache(prev => ({
      archetypes: { ...prev.archetypes, 'all': undefined },
      marginalUtilities: { ...prev.marginalUtilities, 'all': undefined },
      synergies: { ...prev.synergies, 'all': undefined },
      heatmapData: { ...prev.heatmapData, 'all': undefined },
    }));
    await generateArchetypes();
  }, [generateArchetypes]);

  return {
    archetypes,
    marginalUtilities,
    synergies,
    heatmapData,
    isLoading,
    error,
    progress,
    history,
    scenarios,
    generateArchetypes,
    runAnalysis,
    exportResults,
    selectStat,
    selectPair,
    selectedStat,
    selectedPair,
    refreshData,
    updateConfig,
    currentConfig,
    cancelOperation,
    saveToHistory,
    loadFromHistory,
    createScenario,
    runScenario,
    clearHistory,
  };
}
