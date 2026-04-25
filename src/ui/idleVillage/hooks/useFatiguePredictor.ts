/**
 * React Hook for Fatigue Predictor - NP-019
 *
 * Provides a convenient React hook interface for the fatigue prediction system
 * with state management, persistence integration, and diagnostics telemetry.
 *
 * @since 2026-01-19
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { FatiguePredictor, DEFAULT_FATIGUE_PREDICTION_CONFIG } from '@/balancing/idleVillage/FatiguePredictor';
import type { FatiguePrediction, FatiguePredictionConfig } from '@/balancing/idleVillage/FatiguePredictor';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import { setSafeTimeout, clearSafeTimeout } from '@/shared/utils/TimerUtils';

type HistoricalDataPoint = {
  activity: ActivityDefinition;
  fatigueBefore: number;
  fatigueAfter: number;
  timestamp: number;
};

type PredictContext = {
  environmentalConditions?: string[];
  crewSize?: number;
  timeOfDay?: string;
  historicalData?: HistoricalDataPoint[];
};

export interface UseFatiguePredictorParams {
  config?: Partial<FatiguePredictionConfig>;
  enableHistoricalData?: boolean;
  defaultContext?: {
    environmentalConditions?: string[];
    crewSize?: number;
    timeOfDay?: string;
  };
}

export interface UseFatiguePredictorReturn {
  predictor: FatiguePredictor;
  config: FatiguePredictionConfig;
  updateConfig: (newConfig: Partial<FatiguePredictionConfig>) => void;
  predictFatigue: (resident: ResidentState, activity: ActivityDefinition, context?: PredictContext) => FatiguePrediction;
  predictBatch: (entries: Array<{ resident: ResidentState; activity: ActivityDefinition; context?: PredictContext }>) => FatiguePrediction[];
  getTopRiskResidents: (predictions: FatiguePrediction[], limit?: number) => FatiguePrediction[];
  exportPredictions: (predictions: FatiguePrediction[]) => string;
  isLoading: boolean;
  error: string | null;
  historicalData: HistoricalDataPoint[];
  addHistoricalData: (activity: ActivityDefinition, fatigueBefore: number, fatigueAfter: number) => void;
  clearHistoricalData: () => void;
  saveConfig: () => Promise<void>;
  loadConfig: () => Promise<void>;
}

const PERSISTENCE_KEY = 'idleVillage.fatiguePredictor.config';
const HISTORICAL_DATA_KEY = 'idleVillage.fatiguePredictor.historicalData';

export function useFatiguePredictor(params: UseFatiguePredictorParams = {}): UseFatiguePredictorReturn {
  const diagnostics = createSandboxDiagnostics('useFatiguePredictor', 'fatigue-predictor');
  const [config, setConfig] = useState<FatiguePredictionConfig>(() => ({
    ...DEFAULT_FATIGUE_PREDICTION_CONFIG,
    ...params.config,
  }));
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predictor = useMemo(() => new FatiguePredictor(config), [config]);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        setIsLoading(true);
        const savedConfig = await loadData(PERSISTENCE_KEY, null);
        if (savedConfig) {
          setConfig(prev => ({ ...prev, ...savedConfig }));
        }
        const savedHistorical = await loadData(HISTORICAL_DATA_KEY, []);
        if (Array.isArray(savedHistorical)) {
          setHistoricalData(savedHistorical);
        }
        diagnostics.info('Configuration and historical data loaded');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load saved data: ${errorMessage}`);
        diagnostics.error('Failed to load saved data', { error: errorMessage });
      } finally {
        setIsLoading(false);
      }
    };

    void loadSavedData();
  }, [diagnostics]);

  useEffect(() => {
    const handle = setSafeTimeout(async () => {
      try {
        await saveData(PERSISTENCE_KEY, config);
        diagnostics.info('Configuration saved');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        diagnostics.error('Failed to save configuration', { error: errorMessage });
      }
    }, 1000);

    return () => clearSafeTimeout(handle);
  }, [config, diagnostics]);

  useEffect(() => {
    const handle = setSafeTimeout(async () => {
      try {
        await saveData(HISTORICAL_DATA_KEY, historicalData);
        diagnostics.info('Historical data saved', { count: historicalData.length });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        diagnostics.error('Failed to save historical data', { error: errorMessage });
      }
    }, 2000);

    return () => clearSafeTimeout(handle);
  }, [historicalData, diagnostics]);

  const mergeContext = useCallback((context: PredictContext = {}): PredictContext => {
    const { environmentalConditions, crewSize, timeOfDay, historicalData: ctxHistory } = context;
    const defaultContext = params.defaultContext ?? {};
    const mergedHistory = ctxHistory && ctxHistory.length > 0
      ? ctxHistory
      : params.enableHistoricalData
        ? historicalData
        : [];

    return {
      environmentalConditions: (environmentalConditions && environmentalConditions.length > 0)
        ? environmentalConditions
        : defaultContext.environmentalConditions || [],
      crewSize: crewSize ?? defaultContext.crewSize ?? 3,
      timeOfDay: timeOfDay ?? defaultContext.timeOfDay ?? 'day',
      historicalData: mergedHistory,
    };
  }, [params.defaultContext, params.enableHistoricalData, historicalData]);

  const predictFatigue = useCallback((resident: ResidentState, activity: ActivityDefinition, context?: PredictContext): FatiguePrediction => {
    try {
      const mergedContext = mergeContext(context);
      const prediction = predictor.predictFatigue(resident, activity, mergedContext);
      diagnostics.info('Fatigue prediction completed', {
        residentId: resident.id,
        activityId: activity.id,
        predictedFatigue: prediction.predictedFatigue,
        riskLevel: prediction.riskLevel,
        confidence: prediction.confidence,
      });
      return prediction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to predict fatigue: ${errorMessage}`);
      diagnostics.error('Failed to predict fatigue', { error: errorMessage });
      return {
        predictedFatigue: resident.fatigue || 0,
        fatigueLevel: 'normal',
        confidence: 0.5,
        riskLevel: 'low',
        timeToCritical: 999,
        recommendedRest: 0,
        factors: {
          currentFatigue: resident.fatigue || 0,
          activityDifficulty: activity.dangerRating || 3,
          activityDuration: 100,
          baseFatigueRate: config.baseFatigueRate,
          environmentalMultiplier: 1,
          crewSynergyMultiplier: 1,
          timeOfDayMultiplier: 1,
        },
        historicalAccuracy: 0.5,
      } satisfies FatiguePrediction;
    }
  }, [predictor, mergeContext, diagnostics, config.baseFatigueRate]);

  const predictBatch = useCallback((entries: Array<{ resident: ResidentState; activity: ActivityDefinition; context?: PredictContext }>): FatiguePrediction[] => {
    try {
      const results = entries.map(entry => predictFatigue(entry.resident, entry.activity, entry.context));
      diagnostics.info('Batch prediction completed', {
        count: entries.length,
        avgConfidence: results.length ? results.reduce((sum, prediction) => sum + prediction.confidence, 0) / results.length : 0,
      });
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to predict batch: ${errorMessage}`);
      diagnostics.error('Failed to predict batch', { error: errorMessage });
      return [];
    }
  }, [predictFatigue, diagnostics]);

  const getTopRiskResidents = useCallback((predictions: FatiguePrediction[], limit: number = 5): FatiguePrediction[] => {
    return predictor.getTopRiskResidents(predictions, limit);
  }, [predictor]);

  const exportPredictions = useCallback((predictions: FatiguePrediction[]): string => {
    try {
      return JSON.stringify({
        timestamp: Date.now(),
        config: predictor.getConfig(),
        predictions,
        historicalData,
      }, null, 2);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to export predictions: ${errorMessage}`);
      diagnostics.error('Failed to export predictions', { error: errorMessage });
      return '{}';
    }
  }, [predictor, historicalData, diagnostics]);

  const addHistoricalData = useCallback((activity: ActivityDefinition, fatigueBefore: number, fatigueAfter: number): void => {
    const entry: HistoricalDataPoint = {
      activity,
      fatigueBefore,
      fatigueAfter,
      timestamp: Date.now(),
    };
    setHistoricalData(prev => [...prev.slice(-999), entry]);
    diagnostics.info('Historical data point added', { activityId: activity.id, fatigueBefore, fatigueAfter });
  }, [diagnostics]);

  const clearHistoricalData = useCallback((): void => {
    setHistoricalData([]);
    diagnostics.info('Historical data cleared');
  }, [diagnostics]);

  const saveConfig = useCallback(async (): Promise<void> => {
    try {
      await saveData(PERSISTENCE_KEY, config);
      diagnostics.info('Configuration saved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      diagnostics.error('Failed to save configuration', { error: errorMessage });
      setError(`Failed to save configuration: ${errorMessage}`);
    }
  }, [config, diagnostics]);

  const loadConfig = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const savedConfig = await loadData(PERSISTENCE_KEY, null);
      if (savedConfig) {
        setConfig(prev => ({ ...prev, ...savedConfig }));
        diagnostics.info('Configuration loaded successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      diagnostics.error('Failed to load configuration', { error: errorMessage });
      setError(`Failed to load config: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [diagnostics]);

  return {
    predictor,
    config,
    updateConfig: (newConfig: Partial<FatiguePredictionConfig>) => setConfig(prev => ({ ...prev, ...newConfig })),
    predictFatigue,
    predictBatch,
    getTopRiskResidents,
    exportPredictions,
    isLoading,
    error,
    historicalData,
    addHistoricalData,
    clearHistoricalData,
    saveConfig,
    loadConfig,
  };
}
