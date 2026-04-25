/**
 * NP-033 – Idle Village Quest Narrative Telemetry Correlator
 * 
 * React hook for narrative-outcome correlation analysis with
 * dashboard visualization, CSV export, and real-time updates.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  NarrativeData,
  QuestOutcomeData,
  CorrelationData,
  CorrelationAnalysis,
  CorrelationDashboardConfig,
  CorrelationExportConfig,
  NarrativeType,
  NarrativeTone,
  NarrativeStyle,
  QuestOutcome,
  QuestDifficulty,
  QuestCategory,
  createNarrativeData,
  createQuestOutcomeData,
  createCorrelationData,
} from '../types/narrativeCorrelation';
import { NarrativeOutcomeCorrelator, CorrelationCalculationContext } from '../correlation/narrativeOutcomeCorrelator';

export interface UseNarrativeCorrelationOptions {
  initialNarratives?: NarrativeData[];
  initialOutcomes?: QuestOutcomeData[];
  autoAnalyze?: boolean;
  analysisInterval?: number;
  enableCache?: boolean;
  enableTelemetry?: boolean;
  dashboardConfig?: Partial<CorrelationDashboardConfig>;
  exportConfig?: Partial<CorrelationExportConfig>;
}

export function useNarrativeCorrelation(options: UseNarrativeCorrelationOptions = {}) {
  const {
    initialNarratives = [],
    initialOutcomes = [],
    autoAnalyze = true,
    analysisInterval = 300000, // 5 minutes
    enableCache = true,
    enableTelemetry = true,
    dashboardConfig = {},
    exportConfig = {},
  } = options;

  // Core state
  const [narratives, setNarratives] = useState<NarrativeData[]>(initialNarratives);
  const [outcomes, setOutcomes] = useState<QuestOutcomeData[]>(initialOutcomes);
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
  const [analysis, setAnalysis] = useState<CorrelationAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<number>(Date.now());

  // Dashboard and export state
  const [dashboardConfig, setDashboardConfig] = useState<CorrelationDashboardConfig>({
    id: 'default-dashboard',
    name: 'Narrative-Outcome Correlation Dashboard',
    description: 'Dashboard for analyzing narrative-outcome correlations',
    enabled: true,
    layout: {
      type: 'grid',
      columns: 3,
      rows: 2,
      gaps: 16,
    },
    widgets: [],
    filters: {
      timeRange: {
        enabled: true,
        default: '7d',
      },
      narrative: {
        enabled: true,
        types: ['quest_start', 'quest_progress', 'quest_complete', 'quest_fail'],
        tones: ['positive', 'neutral', 'negative'],
        styles: ['descriptive', 'dialogue', 'action'],
      },
      quest: {
        enabled: true,
        categories: ['combat', 'exploration', 'social', 'crafting'],
        difficulties: ['easy', 'normal', 'hard'],
        outcomes: ['success', 'failure', 'partial_success'],
      },
      correlation: {
        enabled: true,
        minStrength: 0.3,
        minSignificance: 0.05,
        methods: ['pearson', 'spearman'],
      },
    },
    export: {
      formats: ['csv', 'json'],
      autoExport: false,
      schedule: '0 0 * * *',
      destination: '/exports/correlation',
    },
    refresh: {
      enabled: true,
      interval: 300000,
      realTime: false,
    },
    theme: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#1e293b',
      accent: '#f59e0b',
    },
    metadata: {
      version: '1.0.0',
      tags: ['default', 'correlation', 'dashboard'],
      category: 'analytics',
    },
    ...dashboardConfig,
  });

  const [exportConfigState, setExportConfig] = useState<CorrelationExportConfig>({
    id: 'default-export',
    name: 'Default Correlation Export',
    format: 'csv',
    data: {
      sources: ['correlations', 'narratives', 'outcomes'],
      filters: {},
      columns: ['timestamp', 'narrativeId', 'outcomeId', 'correlation.strength', 'correlation.direction', 'correlation.significance'],
      aggregations: {},
      sorting: {
        column: 'timestamp',
        direction: 'desc',
      },
      limits: {
        offset: 0,
        count: 10000,
      },
    },
    formatting: {
      headers: true,
      dateFormat: 'YYYY-MM-DD HH:mm:ss',
      numberFormat: 'en-US',
      precision: 4,
      locale: 'en-US',
    },
    compression: {
      enabled: false,
      algorithm: 'gzip',
      level: 6,
    },
    delivery: {
      method: 'download',
      destination: '/downloads',
      retry: {
        enabled: true,
        attempts: 3,
        delay: 1000,
      },
    },
    metadata: {
      version: '1.0.0',
      tags: ['default', 'export', 'correlation'],
      category: 'export',
    },
    ...exportConfig,
  });

  // Refs
  const correlatorRef = useRef<NarrativeOutcomeCorrelator>(new NarrativeOutcomeCorrelator());
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Add narrative data
   */
  const addNarrative = useCallback((narrative: NarrativeData) => {
    setNarratives(prev => [...prev, narrative]);
    
    if (enableTelemetry) {
      console.log('Narrative added:', narrative.id);
    }
  }, [enableTelemetry]);

  /**
   * Add quest outcome data
   */
  const addOutcome = useCallback((outcome: QuestOutcomeData) => {
    setOutcomes(prev => [...prev, outcome]);
    
    if (enableTelemetry) {
      console.log('Outcome added:', outcome.id);
    }
  }, [enableTelemetry]);

  /**
   * Add multiple narratives
   */
  const addNarratives = useCallback((newNarratives: NarrativeData[]) => {
    setNarratives(prev => [...prev, ...newNarratives]);
    
    if (enableTelemetry) {
      console.log(`${newNarratives.length} narratives added`);
    }
  }, [enableTelemetry]);

  /**
   * Add multiple outcomes
   */
  const addOutcomes = useCallback((newOutcomes: QuestOutcomeData[]) => {
    setOutcomes(prev => [...prev, ...newOutcomes]);
    
    if (enableTelemetry) {
      console.log(`${newOutcomes.length} outcomes added`);
    }
  }, [enableTelemetry]);

  /**
   * Remove narrative
   */
  const removeNarrative = useCallback((id: string) => {
    setNarratives(prev => prev.filter(n => n.id !== id));
  }, []);

  /**
   * Remove outcome
   */
  const removeOutcome = useCallback((id: string) => {
    setOutcomes(prev => prev.filter(o => o.id !== id));
  }, []);

  /**
   * Update narrative
   */
  const updateNarrative = useCallback((id: string, updates: Partial<NarrativeData>) => {
    setNarratives(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  }, []);

  /**
   * Update outcome
   */
  const updateOutcome = useCallback((id: string, updates: Partial<QuestOutcomeData>) => {
    setOutcomes(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  /**
   * Perform correlation analysis
   */
  const analyzeCorrelations = useCallback(async (parameters?: {
    methods?: string[];
    minSampleSize?: number;
    significanceThreshold?: number;
    confidenceLevel?: number;
    multipleTestingCorrection?: boolean;
    filters?: {
      timeRange?: { start: number; end: number };
      narrativeTypes?: NarrativeType[];
      questCategories?: QuestCategory[];
      difficulties?: QuestDifficulty[];
      outcomes?: QuestOutcome[];
      tones?: NarrativeTone[];
      styles?: NarrativeStyle[];
    };
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const correlator = correlatorRef.current;
      
      const context: CorrelationCalculationContext = {
        narratives,
        outcomes,
        parameters: {
          methods: parameters?.methods || ['pearson', 'spearman'],
          minSampleSize: parameters?.minSampleSize || 10,
          significanceThreshold: parameters?.significanceThreshold || 0.05,
          confidenceLevel: parameters?.confidenceLevel || 0.95,
          multipleTestingCorrection: parameters?.multipleTestingCorrection || true,
        },
        filters: parameters?.filters || {},
        metadata: {
          timestamp: Date.now(),
          calculationId: `analysis-${Date.now()}`,
          version: '1.0.0',
        },
      };

      const result = correlator.calculateCorrelations(context);
      
      setCorrelations(result.correlations);
      setAnalysis({
        id: result.id,
        timestamp: result.timestamp,
        parameters: {
          timeRange: parameters?.filters?.timeRange || { start: 0, end: Date.now() },
          filters: parameters?.filters || {},
          thresholds: {
            minCorrelation: dashboardConfig.filters.correlation.minStrength,
            minSignificance: dashboardConfig.filters.correlation.minSignificance,
            minSampleSize: parameters?.minSampleSize || 10,
            maxPValue: parameters?.significanceThreshold || 0.05,
          },
          methods: parameters?.methods || ['pearson', 'spearman'],
        },
        results: result.summary,
        insights: result.insights,
        trends: {
          improving: [],
          declining: [],
          stable: [],
          volatile: [],
        },
        performance: result.performance,
        metadata: result.metadata,
      });
      
      setLastAnalysis(Date.now());

      if (enableTelemetry) {
        console.log('Correlation analysis completed:', {
          correlations: result.correlations.length,
          significant: result.summary.significantCorrelations,
          processingTime: result.performance.calculationTime,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Correlation analysis failed:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [narratives, outcomes, dashboardConfig.filters.correlation, enableTelemetry]);

  /**
   * Export correlations to CSV
   */
  const exportToCSV = useCallback(async (config?: Partial<CorrelationExportConfig>): Promise<string> => {
    const exportConfigFinal = { ...exportConfigState, ...config };
    
    try {
      // Filter correlations based on dashboard filters
      const filteredCorrelations = correlations.filter(correlation => {
        if (dashboardConfig.filters.correlation.minStrength > 0) {
          return correlation.correlation.strength >= dashboardConfig.filters.correlation.minStrength;
        }
        return true;
      });

      // Generate CSV content
      const headers = exportConfigFinal.data.columns;
      const rows = filteredCorrelations.map(correlation => {
        const row: Record<string, any> = {};
        
        headers.forEach(header => {
          switch (header) {
            case 'timestamp':
              row[header] = new Date(correlation.timestamp).toISOString();
              break;
            case 'narrativeId':
              row[header] = correlation.narrativeId;
              break;
            case 'outcomeId':
              row[header] = correlation.outcomeId;
              break;
            case 'correlation.strength':
              row[header] = correlation.correlation.strength.toFixed(exportConfigFinal.formatting.precision);
              break;
            case 'correlation.direction':
              row[header] = correlation.correlation.direction;
              break;
            case 'correlation.significance':
              row[header] = correlation.correlation.significance.toFixed(exportConfigFinal.formatting.precision);
              break;
            case 'analysis.method':
              row[header] = correlation.analysis.method;
              break;
            case 'analysis.sampleSize':
              row[header] = correlation.analysis.sampleSize;
              break;
            case 'analysis.pValue':
              row[header] = correlation.analysis.pValue.toFixed(exportConfigFinal.formatting.precision);
              break;
            default:
              row[header] = '';
          }
        });
        
        return row;
      });

      // Convert to CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => headers.map(header => row[header]).join(','))
      ].join('\n');

      if (enableTelemetry) {
        console.log('CSV export completed:', {
          rows: rows.length,
          columns: headers.length,
          config: exportConfigFinal,
        });
      }

      return csvContent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('CSV export failed:', errorMessage);
      throw new Error(`CSV export failed: ${errorMessage}`);
    }
  }, [correlations, dashboardConfig.filters.correlation, exportConfigState, enableTelemetry]);

  /**
   * Export correlations to JSON
   */
  const exportToJSON = useCallback(async (config?: Partial<CorrelationExportConfig>): Promise<string> => {
    const exportConfigFinal = { ...exportConfigState, ...config };
    
    try {
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          config: exportConfigFinal,
          summary: {
            totalCorrelations: correlations.length,
            significantCorrelations: correlations.filter(c => c.correlation.significance > 0.5).length,
            averageCorrelation: correlations.reduce((sum, c) => sum + c.correlation.strength, 0) / correlations.length,
          },
        },
        correlations,
        analysis,
        dashboardConfig,
      };

      const jsonContent = JSON.stringify(exportData, null, 2);

      if (enableTelemetry) {
        console.log('JSON export completed:', {
          correlations: correlations.length,
          config: exportConfigFinal,
        });
      }

      return jsonContent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('JSON export failed:', errorMessage);
      throw new Error(`JSON export failed: ${errorMessage}`);
    }
  }, [correlations, analysis, dashboardConfig, exportConfigState, enableTelemetry]);

  /**
   * Get correlation statistics
   */
  const getCorrelationStatistics = useCallback(() => {
    if (correlations.length === 0) {
      return {
        total: 0,
        significant: 0,
        strong: 0,
        positive: 0,
        negative: 0,
        averageStrength: 0,
        averageSignificance: 0,
      };
    }

    const significant = correlations.filter(c => c.correlation.significance > 0.5);
    const strong = correlations.filter(c => c.correlation.strength > 0.7);
    const positive = correlations.filter(c => c.correlation.direction === 'positive');
    const negative = correlations.filter(c => c.correlation.direction === 'negative');

    return {
      total: correlations.length,
      significant: significant.length,
      strong: strong.length,
      positive: positive.length,
      negative: negative.length,
      averageStrength: correlations.reduce((sum, c) => sum + c.correlation.strength, 0) / correlations.length,
      averageSignificance: correlations.reduce((sum, c) => sum + c.correlation.significance, 0) / correlations.length,
    };
  }, [correlations]);

  /**
   * Get top correlations
   */
  const getTopCorrelations = useCallback((limit: number = 10, direction?: 'positive' | 'negative') => {
    let filtered = correlations;
    
    if (direction) {
      filtered = correlations.filter(c => c.correlation.direction === direction);
    }
    
    return filtered
      .sort((a, b) => b.correlation.strength - a.correlation.strength)
      .slice(0, limit);
  }, [correlations]);

  /**
   * Get correlations by method
   */
  const getCorrelationsByMethod = useCallback((method: string) => {
    return correlations.filter(c => c.analysis.method === method);
  }, [correlations]);

  /**
   * Filter correlations
   */
  const filterCorrelations = useCallback((filters: {
    minStrength?: number;
    maxStrength?: number;
    minSignificance?: number;
    maxSignificance?: number;
    direction?: 'positive' | 'negative' | 'neutral';
    method?: string;
  }) => {
    return correlations.filter(correlation => {
      if (filters.minStrength !== undefined && correlation.correlation.strength < filters.minStrength) {
        return false;
      }
      if (filters.maxStrength !== undefined && correlation.correlation.strength > filters.maxStrength) {
        return false;
      }
      if (filters.minSignificance !== undefined && correlation.correlation.significance < filters.minSignificance) {
        return false;
      }
      if (filters.maxSignificance !== undefined && correlation.correlation.significance > filters.maxSignificance) {
        return false;
      }
      if (filters.direction && correlation.correlation.direction !== filters.direction) {
        return false;
      }
      if (filters.method && correlation.analysis.method !== filters.method) {
        return false;
      }
      return true;
    });
  }, [correlations]);

  /**
   * Update dashboard configuration
   */
  const updateDashboardConfig = useCallback((updates: Partial<CorrelationDashboardConfig>) => {
    setDashboardConfig(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Update export configuration
   */
  const updateExportConfig = useCallback((updates: Partial<CorrelationExportConfig>) => {
    setExportConfig(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Reset all data
   */
  const resetData = useCallback(() => {
    setNarratives([]);
    setOutcomes([]);
    setCorrelations([]);
    setAnalysis(null);
    setError(null);
    setLastAnalysis(Date.now());
  }, []);

  /**
   * Get correlator statistics
   */
  const getCorrelatorStatistics = useCallback(() => {
    return correlatorRef.current.getStatistics();
  }, []);

  // Effects
  useEffect(() => {
    // Auto-analyze when data changes
    if (autoAnalyze && narratives.length > 0 && outcomes.length > 0) {
      const timeSinceLastAnalysis = Date.now() - lastAnalysis;
      if (timeSinceLastAnalysis >= analysisInterval) {
        analyzeCorrelations();
      }
    }
  }, [narratives, outcomes, autoAnalyze, analysisInterval, lastAnalysis, analyzeCorrelations]);

  useEffect(() => {
    // Set up periodic analysis
    if (autoAnalyze && dashboardConfig.refresh.enabled) {
      analysisIntervalRef.current = setInterval(() => {
        if (narratives.length > 0 && outcomes.length > 0) {
          analyzeCorrelations();
        }
      }, dashboardConfig.refresh.interval);
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [autoAnalyze, dashboardConfig.refresh, narratives.length, outcomes.length, analyzeCorrelations]);

  // Memoized values
  const correlationStatistics = useMemo(() => getCorrelationStatistics(), [getCorrelationStatistics]);
  const topCorrelations = useMemo(() => getTopCorrelations(), [getTopCorrelations]);
  const correlatorStatistics = useMemo(() => getCorrelatorStatistics(), [getCorrelatorStatistics]);

  return {
    // State
    narratives,
    outcomes,
    correlations,
    analysis,
    isLoading,
    error,
    lastAnalysis,
    
    // Configuration
    dashboardConfig,
    exportConfig: exportConfigState,
    
    // Data methods
    addNarrative,
    addOutcome,
    addNarratives,
    addOutcomes,
    removeNarrative,
    removeOutcome,
    updateNarrative,
    updateOutcome,
    
    // Analysis methods
    analyzeCorrelations,
    getCorrelationStatistics,
    getTopCorrelations,
    getCorrelationsByMethod,
    filterCorrelations,
    
    // Export methods
    exportToCSV,
    exportToJSON,
    
    // Configuration methods
    updateDashboardConfig,
    updateExportConfig,
    
    // Utility methods
    resetData,
    getCorrelatorStatistics,
    
    // Statistics
    correlationStatistics,
    topCorrelations,
    correlatorStatistics,
    
    // Options
    options,
  };
}
