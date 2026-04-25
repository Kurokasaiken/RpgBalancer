/**
 * React Hook for Phase 10.5 Radar Chart Visualization
 * 
 * Provides data processing, state management, and interaction handling
 * for radar chart visualization of archetype stat profiles.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { BalancerConfig } from '../config/types';
import type { StressTestArchetype, MarginalUtilityResult, SynergyResult } from '../stressTesting/types';
import type { 
  RadarChartConfig, 
  RadarChartState, 
  RadarChartDataset, 
  RadarChartStat
} from '../config/stressTesting/radarChartConfig';
import { 
  DEFAULT_RADAR_CHART_CONFIG,
  getColorScheme,
  processBalancerConfigForRadar
} from '../config/stressTesting/radarChartConfig';

/**
 * Hook options for radar chart
 */
export interface UseRadarChartOptions {
  /** Initial configuration */
  initialConfig?: Partial<RadarChartConfig>;
  /** Archetype data */
  archetypes?: StressTestArchetype[];
  /** Marginal utility results */
  marginalUtilities?: MarginalUtilityResult[];
  /** Synergy results */
  synergies?: SynergyResult[];
  /** Balancer config */
  balancerConfig?: BalancerConfig;
  /** Maximum number of stats to display */
  maxStats?: number;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Color scheme */
  colorScheme?: RadarChartConfig['visual']['colorScheme'];
}

/**
 * Hook return value
 */
export interface UseRadarChartReturn {
  /** Current radar chart state */
  state: RadarChartState;
  /** Update configuration */
  updateConfig: (config: Partial<RadarChartConfig>) => void;
  /** Toggle dataset visibility */
  toggleDataset: (datasetId: string) => void;
  /** Select dataset */
  selectDataset: (datasetId?: string) => void;
  /** Update hover state */
  updateHover: (hover: Partial<RadarChartState['hoverState']>) => void;
  /** Export data */
  exportData: (format: 'json' | 'csv') => string;
  /** Reset to default state */
  reset: () => void;
  /** Processed data for rendering */
  processedData: {
    svgPoints: Record<string, string>;
    gridPoints: string[];
    labelPositions: Array<{ id: string; x: number; y: number; label: string }>;
    datasetPaths: Record<string, string>;
  };
}

/**
 * React hook for radar chart visualization
 */
export function useRadarChart(options: UseRadarChartOptions = {}): UseRadarChartReturn {
  const {
    initialConfig = {},
    archetypes = [],
    marginalUtilities = [],
    synergies = [],
    balancerConfig,
    maxStats = 12,
    enableAnimations = true,
    colorScheme = 'default'
  } = options;

  // Merge configuration with defaults
  const config = useMemo(() => ({
    ...DEFAULT_RADAR_CHART_CONFIG,
    ...initialConfig,
    visual: {
      ...DEFAULT_RADAR_CHART_CONFIG.visual,
      ...initialConfig.visual,
      colorScheme
    },
    animation: {
      ...DEFAULT_RADAR_CHART_CONFIG.animation,
      enabled: enableAnimations,
      ...initialConfig.animation
    },
    data: {
      ...DEFAULT_RADAR_CHART_CONFIG.data,
      maxStats,
      ...initialConfig.data
    }
  }), [initialConfig, enableAnimations, colorScheme, maxStats]);

  // State management
  const [state, setState] = useState<RadarChartState>(() => ({
    config,
    stats: [],
    datasets: [],
    selectedDataset: undefined,
    hoverState: {},
    animationState: {
      isAnimating: false,
      progress: 1
    }
  }));

  // Animation ref
  const animationRef = useRef<number | undefined>();

  // Process stats from balancer config
  const processedStats = useMemo(() => {
    if (!balancerConfig) return [];
    
    return processBalancerConfigForRadar(balancerConfig, {
      maxStats: config.data.maxStats,
      excludeDerived: true
    });
  }, [balancerConfig, config.data.maxStats]);

  // Process datasets from archetypes and results
  const processedDatasets = useMemo(() => {
    const datasets: RadarChartDataset[] = [];
    const colorPalette = getColorScheme(config.visual.colorScheme);
    let colorIndex = 0;

    // Add baseline dataset if enabled
    if (config.data.showBaseline && balancerConfig) {
      const baselineValues: Record<string, number> = {};
      processedStats.forEach(stat => {
        baselineValues[stat.id] = 50; // Normalized baseline value
      });

      datasets.push({
        id: 'baseline',
        name: 'Baseline',
        values: baselineValues,
        color: colorPalette.baseline,
        visible: true,
        type: 'baseline',
        metadata: {
          description: 'Baseline archetype with no stat modifications'
        }
      });
      colorIndex++;
    }

    // Add archetype datasets
    archetypes.forEach((archetype, index) => {
      const values: Record<string, number> = {};
      processedStats.forEach(stat => {
        const statValue = archetype.stats[stat.id] || 0;
        // Normalize to 0-100 scale based on config
        const normalizedValue = config.data.normalizeValues 
          ? (statValue / config.data.maxStatValue) * 100
          : statValue;
        values[stat.id] = Math.max(0, Math.min(100, normalizedValue));
      });

      const colors = [colorPalette.primary, colorPalette.secondary, colorPalette.tertiary, colorPalette.quaternary];
      const color = colors[colorIndex % colors.length];

      datasets.push({
        id: archetype.id,
        name: archetype.name,
        values,
        color,
        visible: true,
        type: 'archetype',
        metadata: {
          archetypeType: archetype.type,
          description: archetype.description
        }
      });
      colorIndex++;
    });

    // Add average dataset if enabled
    if (config.data.showAverage && datasets.length > 1) {
      const averageValues: Record<string, number> = {};
      processedStats.forEach(stat => {
        const sum = datasets
          .filter(ds => ds.type === 'archetype')
          .reduce((acc, ds) => acc + (ds.values[stat.id] || 0), 0);
        const count = datasets.filter(ds => ds.type === 'archetype').length;
        averageValues[stat.id] = count > 0 ? sum / count : 0;
      });

      datasets.push({
        id: 'average',
        name: 'Average',
        values: averageValues,
        color: colorPalette.average,
        visible: true,
        type: 'average',
        metadata: {
          description: 'Average of all archetype values'
        }
      });
    }

    return datasets;
  }, [archetypes, balancerConfig, config, processedStats]);

  // Update state when processed data changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      config,
      stats: processedStats,
      datasets: processedDatasets
    }));
  }, [config, processedStats, processedDatasets]);

  // Calculate SVG points for rendering
  const processedData = useMemo(() => {
    const { width, height, padding, centerRadius, maxRadius } = config.dimensions;
    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate points for each stat
    const svgPoints: Record<string, string> = {};
    const labelPositions: Array<{ id: string; x: number; y: number; label: string }> = [];

    state.stats.forEach(stat => {
      const angleRad = (stat.angle * Math.PI) / 180;
      const x = centerX + Math.cos(angleRad - Math.PI / 2) * maxRadius;
      const y = centerY + Math.sin(angleRad - Math.PI / 2) * maxRadius;
      
      svgPoints[stat.id] = `${x},${y}`;
      
      // Calculate label position (slightly outside the chart)
      const labelDistance = maxRadius + config.labels.labelDistance;
      const labelX = centerX + Math.cos(angleRad - Math.PI / 2) * labelDistance;
      const labelY = centerY + Math.sin(angleRad - Math.PI / 2) * labelDistance;
      
      labelPositions.push({
        id: stat.id,
        x: labelX,
        y: labelY,
        label: stat.name
      });
    });

    // Calculate grid points
    const gridPoints: string[] = [];
    for (let level = 1; level <= config.grid.levels; level++) {
      const levelRadius = (maxRadius / config.grid.levels) * level;
      const levelPoints: string[] = [];
      
      state.stats.forEach(stat => {
        const angleRad = (stat.angle * Math.PI) / 180;
        const x = centerX + Math.cos(angleRad - Math.PI / 2) * levelRadius;
        const y = centerY + Math.sin(angleRad - Math.PI / 2) * levelRadius;
        levelPoints.push(`${x},${y}`);
      });
      
      gridPoints.push(levelPoints.join(' '));
    }

    // Calculate dataset paths
    const datasetPaths: Record<string, string> = {};
    state.datasets.forEach(dataset => {
      if (!dataset.visible) return;
      
      const pathPoints: string[] = [];
      state.stats.forEach(stat => {
        const value = dataset.values[stat.id] || 0;
        const radius = centerRadius + ((maxRadius - centerRadius) * value) / 100;
        const angleRad = (stat.angle * Math.PI) / 180;
        const x = centerX + Math.cos(angleRad - Math.PI / 2) * radius;
        const y = centerY + Math.sin(angleRad - Math.PI / 2) * radius;
        pathPoints.push(`${x},${y}`);
      });
      
      datasetPaths[dataset.id] = pathPoints.join(' ');
    });

    return {
      svgPoints,
      gridPoints,
      labelPositions,
      datasetPaths
    };
  }, [state, config]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<RadarChartConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...newConfig }
    }));
  }, []);

  // Toggle dataset visibility
  const toggleDataset = useCallback((datasetId: string) => {
    setState(prev => ({
      ...prev,
      datasets: prev.datasets.map(ds =>
        ds.id === datasetId ? { ...ds, visible: !ds.visible } : ds
      )
    }));
  }, []);

  // Select dataset
  const selectDataset = useCallback((datasetId?: string) => {
    setState(prev => ({
      ...prev,
      selectedDataset: datasetId
    }));
  }, []);

  // Update hover state
  const updateHover = useCallback((hover: Partial<RadarChartState['hoverState']>) => {
    setState(prev => ({
      ...prev,
      hoverState: { ...prev.hoverState, ...hover }
    }));
  }, []);

  // Export data
  const exportData = useCallback((format: 'json' | 'csv') => {
    if (format === 'json') {
      return JSON.stringify({
        config: state.config,
        stats: state.stats,
        datasets: state.datasets,
        timestamp: Date.now()
      }, null, 2);
    }

    if (format === 'csv') {
      const headers = ['Dataset', 'Type', ...state.stats.map(s => s.name)];
      const rows = state.datasets.map(ds => [
        ds.name,
        ds.type,
        ...state.stats.map(s => ds.values[s.id] || 0)
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return '';
  }, [state]);

  // Reset to default state
  const reset = useCallback(() => {
    setState({
      config,
      stats: processedStats,
      datasets: processedDatasets,
      selectedDataset: undefined,
      hoverState: {},
      animationState: {
        isAnimating: false,
        progress: 1
      }
    });
  }, [config, processedStats, processedDatasets]);

  return {
    state,
    updateConfig,
    toggleDataset,
    selectDataset,
    updateHover,
    exportData,
    reset,
    processedData
  };
}
