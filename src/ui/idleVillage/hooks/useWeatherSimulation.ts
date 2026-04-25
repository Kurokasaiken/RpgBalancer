/**
 * NP-032 – Idle Village Weather Impact Simulation
 * 
 * React hook for weather simulation state management, impact calculation,
 * overlay visualization, and telemetry tracking.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  WeatherCondition,
  WeatherImpactConfig,
  WeatherImpactResult,
  WeatherSimulationState,
  WeatherOverlayConfig,
  WeatherTelemetryData,
  WeatherTelemetryEvent,
  WeatherTelemetryMetric,
  WeatherStatistics,
  createWeatherCondition,
  createWeatherImpactConfig,
  WeatherType,
  WeatherSeverity,
  SeasonType,
  TimeOfDay,
} from '../types/weatherSimulation';
import { WeatherImpactEngine, ImpactCalculationContext } from '../simulation/weatherImpactEngine';

export interface UseWeatherSimulationOptions {
  initialCondition?: Partial<WeatherCondition>;
  autoAdvance?: boolean;
  simulationSpeed?: number;
  maxHistorySize?: number;
  forecastHorizon?: number;
  enableTelemetry?: boolean;
  enableOverlay?: boolean;
  updateInterval?: number;
}

export function useWeatherSimulation(options: UseWeatherSimulationOptions = {}) {
  const {
    initialCondition,
    autoAdvance = true,
    simulationSpeed = 1,
    maxHistorySize = 100,
    forecastHorizon = 24, // hours
    enableTelemetry = true,
    enableOverlay = true,
    updateInterval = 60000, // 1 minute
  } = options;

  // Core state
  const [simulationState, setSimulationState] = useState<WeatherSimulationState>(() => ({
    current: createWeatherCondition(initialCondition || {}),
    history: [],
    forecast: [],
    impacts: [],
    activeEffects: [],
    configuration: [],
    statistics: {
      totalSimulationTime: 0,
      weatherDistribution: {} as Record<WeatherType, number>,
      severityDistribution: {} as Record<WeatherSeverity, number>,
      seasonDistribution: {} as Record<SeasonType, number>,
      averageConditions: {
        temperature: 20,
        humidity: 50,
        windSpeed: 10,
        visibility: 10000,
        pressure: 1013,
      },
      impactSummary: {
        totalImpacts: 0,
        averageSuccessRateModifier: 0,
        averageFatigueModifier: 0,
        averageMoraleModifier: 0,
        averageProductivityModifier: 0,
        extremeWeatherEvents: 0,
        specialEffectsTriggered: 0,
      },
      trends: {
        temperature: 'stable',
        humidity: 'stable',
        pressure: 'stable',
        overall: 'stable',
      },
    },
    telemetry: {
      events: [],
      metrics: [],
      performance: {
        simulation: {
          averageCalculationTime: 0,
          totalCalculations: 0,
          errors: 0,
          cacheHitRate: 0,
        },
        rendering: {
          averageRenderTime: 0,
          totalRenders: 0,
          frameRate: 60,
        },
        memory: {
          used: 0,
          peak: 0,
          allocations: 0,
        },
      },
      errors: [],
      metadata: {
        collectionStartTime: Date.now(),
        lastUpdateTime: Date.now(),
        totalEvents: 0,
        totalMetrics: 0,
        totalErrors: 0,
      },
    },
    metadata: {
      simulationId: `weather-sim-${Date.now()}`,
      startTime: Date.now(),
      currentTime: Date.now(),
      speed: simulationSpeed,
      paused: false,
      autoAdvance,
    },
  }));

  // Engine and refs
  const impactEngineRef = useRef<WeatherImpactEngine>(new WeatherImpactEngine());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const telemetryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Update weather condition
   */
  const updateWeatherCondition = useCallback((condition: Partial<WeatherCondition>) => {
    setSimulationState(prev => {
      const newCondition = createWeatherCondition({ ...prev.current, ...condition });
      
      // Add to history
      const newHistory = [...prev.history, prev.current];
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      // Calculate impacts
      const impacts = calculateImpactsForCondition(newCondition);
      
      // Update statistics
      const updatedStats = updateStatistics(prev.statistics, newCondition, impacts);
      
      // Track telemetry event
      if (enableTelemetry) {
        trackTelemetryEvent('weather_change', {
          weatherCondition: newCondition,
        });
      }
      
      return {
        ...prev,
        current: newCondition,
        history: newHistory,
        impacts,
        statistics: updatedStats,
        metadata: {
          ...prev.metadata,
          currentTime: Date.now(),
        },
      };
    });
  }, [maxHistorySize, enableTelemetry]);

  /**
   * Calculate impacts for weather condition
   */
  const calculateImpactsForCondition = useCallback((condition: WeatherCondition): WeatherImpactResult[] => {
    const engine = impactEngineRef.current;
    const impacts: WeatherImpactResult[] = [];
    
    // Calculate impacts for different target types
    const targetTypes: ImpactCalculationContext['targetType'][] = ['resident', 'building', 'activity', 'resource', 'village'];
    
    targetTypes.forEach(targetType => {
      const context: ImpactCalculationContext = {
        weatherCondition: condition,
        targetId: `sample-${targetType}`,
        targetType,
        baseValues: {
          successRate: 0.8,
          fatigue: 0.3,
          morale: 0.7,
          productivity: 0.75,
          movement: {
            speed: 1.0,
            accuracy: 0.9,
            energy: 1.0,
          },
          resources: {
            consumption: 1.0,
            generation: 1.0,
            storage: 1.0,
          },
        },
        modifiers: {
          equipment: 1.0,
          skills: 1.0,
          environment: 1.0,
          buffs: 1.0,
          debuffs: 1.0,
        },
        metadata: {
          timestamp: Date.now(),
          calculationId: `calc-${Date.now()}-${targetType}`,
          factors: [],
        },
      };
      
      const result = engine.calculateImpact(context);
      
      impacts.push({
        id: result.id,
        timestamp: result.timestamp,
        weatherCondition: condition,
        targetId: context.targetId,
        targetType: context.targetType,
        impacts: result.impacts,
        appliedEffects: result.appliedEffects,
        confidence: result.confidence,
        metadata: result.metadata,
      });
    });
    
    return impacts;
  }, []);

  /**
   * Update statistics
   */
  const updateStatistics = useCallback((stats: WeatherStatistics, condition: WeatherCondition, impacts: WeatherImpactResult[]): WeatherStatistics => {
    const newStats = { ...stats };
    
    // Update weather distribution
    newStats.weatherDistribution[condition.type] = (newStats.weatherDistribution[condition.type] || 0) + 1;
    newStats.severityDistribution[condition.severity] = (newStats.severityDistribution[condition.severity] || 0) + 1;
    newStats.seasonDistribution[condition.season] = (newStats.seasonDistribution[condition.season] || 0) + 1;
    
    // Update average conditions
    const totalConditions = newStats.weatherDistribution[condition.type] || 1;
    newStats.averageConditions = {
      temperature: (newStats.averageConditions.temperature * (totalConditions - 1) + condition.temperature.current) / totalConditions,
      humidity: (newStats.averageConditions.humidity * (totalConditions - 1) + condition.humidity.current) / totalConditions,
      windSpeed: (newStats.averageConditions.windSpeed * (totalConditions - 1) + condition.wind.speed) / totalConditions,
      visibility: (newStats.averageConditions.visibility * (totalConditions - 1) + condition.visibility.current) / totalConditions,
      pressure: (newStats.averageConditions.pressure * (totalConditions - 1) + condition.pressure.current) / totalConditions,
    };
    
    // Update impact summary
    if (impacts.length > 0) {
      const avgSuccessRateModifier = impacts.reduce((sum, impact) => sum + impact.impacts.successRate.modifier, 0) / impacts.length;
      const avgFatigueModifier = impacts.reduce((sum, impact) => sum + impact.impacts.fatigue.modifier, 0) / impacts.length;
      const avgMoraleModifier = impacts.reduce((sum, impact) => sum + impact.impacts.morale.modifier, 0) / impacts.length;
      const avgProductivityModifier = impacts.reduce((sum, impact) => sum + impact.impacts.productivity.modifier, 0) / impacts.length;
      
      newStats.impactSummary = {
        totalImpacts: newStats.impactSummary.totalImpacts + impacts.length,
        averageSuccessRateModifier: (newStats.impactSummary.averageSuccessRateModifier + avgSuccessRateModifier) / 2,
        averageFatigueModifier: (newStats.impactSummary.averageFatigueModifier + avgFatigueModifier) / 2,
        averageMoraleModifier: (newStats.impactSummary.averageMoraleModifier + avgMoraleModifier) / 2,
        averageProductivityModifier: (newStats.impactSummary.averageProductivityModifier + avgProductivityModifier) / 2,
        extremeWeatherEvents: condition.severity === 'extreme' ? newStats.impactSummary.extremeWeatherEvents + 1 : newStats.impactSummary.extremeWeatherEvents,
        specialEffectsTriggered: newStats.impactSummary.specialEffectsTriggered + impacts.reduce((sum, impact) => sum + impact.appliedEffects.length, 0),
      };
    }
    
    // Update trends
    newStats.trends = {
      temperature: condition.temperature.trend === 'rising' ? 'rising' : condition.temperature.trend === 'falling' ? 'falling' : 'stable',
      humidity: condition.humidity.trend === 'rising' ? 'rising' : condition.humidity.trend === 'falling' ? 'falling' : 'stable',
      pressure: condition.pressure.trend === 'rising' ? 'rising' : condition.pressure.trend === 'falling' ? 'falling' : 'stable',
      overall: condition.forecast.trend === 'improving' ? 'improving' : condition.forecast.trend === 'worsening' ? 'worsening' : 'stable',
    };
    
    return newStats;
  }, []);

  /**
   * Track telemetry event
   */
  const trackTelemetryEvent = useCallback((type: WeatherTelemetryEvent['type'], data: any) => {
    if (!enableTelemetry) return;
    
    const event: WeatherTelemetryEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      data,
      metadata: {
        source: 'weather-simulation',
        version: '1.0.0',
        tags: ['weather', 'simulation'],
      },
    };
    
    setSimulationState(prev => ({
      ...prev,
      telemetry: {
        ...prev.telemetry,
        events: [...prev.telemetry.events, event],
        metadata: {
          ...prev.telemetry.metadata,
          totalEvents: prev.telemetry.metadata.totalEvents + 1,
          lastUpdateTime: Date.now(),
        },
      },
    }));
  }, [enableTelemetry]);

  /**
   * Track telemetry metric
   */
  const trackTelemetryMetric = useCallback((name: string, value: number, unit: string, dimensions: Record<string, string> = {}) => {
    if (!enableTelemetry) return;
    
    const metric: WeatherTelemetryMetric = {
      id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp: Date.now(),
      value,
      unit,
      type: 'gauge',
      dimensions,
      metadata: {
        tags: ['weather', 'simulation'],
      },
    };
    
    setSimulationState(prev => ({
      ...prev,
      telemetry: {
        ...prev.telemetry,
        metrics: [...prev.telemetry.metrics, metric],
        metadata: {
          ...prev.telemetry.metadata,
          totalMetrics: prev.telemetry.metadata.totalMetrics + 1,
          lastUpdateTime: Date.now(),
        },
      },
    }));
  }, [enableTelemetry]);

  /**
   * Generate weather forecast
   */
  const generateForecast = useCallback((hours: number = forecastHorizon): WeatherCondition[] => {
    const forecast: WeatherCondition[] = [];
    const current = simulationState.current;
    
    for (let i = 1; i <= hours; i++) {
      const futureTime = Date.now() + (i * 60 * 60 * 1000); // i hours from now
      const futureCondition = generateNextWeatherCondition(current, i);
      futureCondition.timestamp = futureTime;
      forecast.push(futureCondition);
    }
    
    return forecast;
  }, [forecastHorizon, simulationState.current]);

  /**
   * Generate next weather condition
   */
  const generateNextWeatherCondition = useCallback((current: WeatherCondition, hoursAhead: number): WeatherCondition => {
    // Simple weather progression logic
    const types: WeatherType[] = ['clear', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy', 'windy'];
    const severities: WeatherSeverity[] = ['mild', 'moderate', 'severe', 'extreme'];
    
    // Determine next weather type based on current
    let nextType = current.type;
    let nextSeverity = current.severity;
    
    // Simple progression logic
    if (Math.random() < 0.3) { // 30% chance of weather change
      const currentIndex = types.indexOf(current.type);
      const change = Math.random() < 0.5 ? -1 : 1;
      const nextIndex = Math.max(0, Math.min(types.length - 1, currentIndex + change));
      nextType = types[nextIndex];
    }
    
    // Severity changes
    if (Math.random() < 0.2) { // 20% chance of severity change
      const currentSeverityIndex = severities.indexOf(current.severity);
      const change = Math.random() < 0.5 ? -1 : 1;
      const nextSeverityIndex = Math.max(0, Math.min(severities.length - 1, currentSeverityIndex + change));
      nextSeverity = severities[nextSeverityIndex];
    }
    
    // Generate new condition
    const nextCondition = createWeatherCondition({
      ...current,
      id: `weather-${Date.now()}-${hoursAhead}`,
      type: nextType,
      severity: nextSeverity,
      timestamp: Date.now() + (hoursAhead * 60 * 60 * 1000),
      // Modify other properties slightly
      temperature: {
        ...current.temperature,
        current: current.temperature.current + (Math.random() - 0.5) * 5,
        min: current.temperature.min + (Math.random() - 0.5) * 3,
        max: current.temperature.max + (Math.random() - 0.5) * 3,
      },
      humidity: {
        ...current.humidity,
        current: Math.max(0, Math.min(100, current.humidity.current + (Math.random() - 0.5) * 10)),
      },
      wind: {
        ...current.wind,
        speed: Math.max(0, current.wind.speed + (Math.random() - 0.5) * 10),
        gusts: Math.max(0, current.wind.gusts + (Math.random() - 0.5) * 15),
      },
    });
    
    return nextCondition;
  }, []);

  /**
   * Start simulation
   */
  const startSimulation = useCallback(() => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      if (!simulationState.metadata.paused) {
        // Generate next weather condition
        const nextCondition = generateNextWeatherCondition(simulationState.current, 1);
        updateWeatherCondition(nextCondition);
      }
    }, updateInterval / simulationSpeed);
  }, [simulationState.metadata.paused, simulationState.current, updateInterval, simulationSpeed, updateWeatherCondition, generateNextWeatherCondition]);

  /**
   * Stop simulation
   */
  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Pause simulation
   */
  const pauseSimulation = useCallback(() => {
    setSimulationState(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        paused: true,
      },
    }));
  }, []);

  /**
   * Resume simulation
   */
  const resumeSimulation = useCallback(() => {
    setSimulationState(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        paused: false,
      },
    }));
  }, []);

  /**
   * Set simulation speed
   */
  const setSimulationSpeed = useCallback((speed: number) => {
    setSimulationState(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        speed,
      },
    }));
    
    // Restart interval with new speed
    stopSimulation();
    if (autoAdvance) {
      startSimulation();
    }
  }, [autoAdvance, startSimulation, stopSimulation]);

  /**
   * Add impact configuration
   */
  const addImpactConfig = useCallback((config: WeatherImpactConfig) => {
    const engine = impactEngineRef.current;
    engine.addConfig(config);
    
    setSimulationState(prev => ({
      ...prev,
      configuration: [...prev.configuration, config],
    }));
    
    trackTelemetryEvent('impact_config_added', { config });
  }, [trackTelemetryEvent]);

  /**
   * Remove impact configuration
   */
  const removeImpactConfig = useCallback((configId: string) => {
    const engine = impactEngineRef.current;
    engine.removeConfig(configId);
    
    setSimulationState(prev => ({
      ...prev,
      configuration: prev.configuration.filter(config => config.id !== configId),
    }));
    
    trackTelemetryEvent('impact_config_removed', { configId });
  }, [trackTelemetryEvent]);

  /**
   * Calculate impact for specific target
   */
  const calculateImpact = useCallback((context: ImpactCalculationContext) => {
    const engine = impactEngineRef.current;
    const result = engine.calculateImpact(context);
    
    trackTelemetryEvent('impact_calculated', { result });
    
    return result;
  }, [trackTelemetryEvent]);

  /**
   * Get weather statistics
   */
  const getWeatherStatistics = useCallback(() => {
    return simulationState.statistics;
  }, [simulationState.statistics]);

  /**
   * Get engine statistics
   */
  const getEngineStatistics = useCallback(() => {
    const engine = impactEngineRef.current;
    return engine.getStatistics();
  }, []);

  /**
   * Export simulation data
   */
  const exportSimulationData = useCallback(() => {
    return {
      simulationState,
      engineStats: getEngineStatistics(),
      timestamp: Date.now(),
    };
  }, [simulationState, getEngineStatistics]);

  /**
   * Import simulation data
   */
  const importSimulationData = useCallback((data: any) => {
    if (data.simulationState) {
      setSimulationState(data.simulationState);
    }
    
    if (data.engineStats) {
      // Engine stats would need to be restored
      console.log('Engine stats import not implemented');
    }
  }, []);

  /**
   * Reset simulation
   */
  const resetSimulation = useCallback(() => {
    stopSimulation();
    
    setSimulationState(prev => ({
      ...prev,
      current: createWeatherCondition(initialCondition || {}),
      history: [],
      forecast: [],
      impacts: [],
      activeEffects: [],
      statistics: {
        totalSimulationTime: 0,
        weatherDistribution: {} as Record<WeatherType, number>,
        severityDistribution: {} as Record<WeatherSeverity, number>,
        seasonDistribution: {} as Record<SeasonType, number>,
        averageConditions: {
          temperature: 20,
          humidity: 50,
          windSpeed: 10,
          visibility: 10000,
          pressure: 1013,
        },
        impactSummary: {
          totalImpacts: 0,
          averageSuccessRateModifier: 0,
          averageFatigueModifier: 0,
          averageMoraleModifier: 0,
          averageProductivityModifier: 0,
          extremeWeatherEvents: 0,
          specialEffectsTriggered: 0,
        },
        trends: {
          temperature: 'stable',
          humidity: 'stable',
          pressure: 'stable',
          overall: 'stable',
        },
      },
      telemetry: {
        events: [],
        metrics: [],
        performance: {
          simulation: {
            averageCalculationTime: 0,
            totalCalculations: 0,
            errors: 0,
            cacheHitRate: 0,
          },
          rendering: {
            averageRenderTime: 0,
            totalRenders: 0,
            frameRate: 60,
          },
          memory: {
            used: 0,
            peak: 0,
            allocations: 0,
          },
        },
        errors: [],
        metadata: {
          collectionStartTime: Date.now(),
          lastUpdateTime: Date.now(),
          totalEvents: 0,
          totalMetrics: 0,
          totalErrors: 0,
        },
      },
      metadata: {
        ...prev.metadata,
        simulationId: `weather-sim-${Date.now()}`,
        startTime: Date.now(),
        currentTime: Date.now(),
        paused: false,
      },
    }));
    
    // Restart simulation if auto-advance is enabled
    if (autoAdvance) {
      startSimulation();
    }
  }, [initialCondition, autoAdvance, startSimulation, stopSimulation]);

  // Effects
  useEffect(() => {
    // Start simulation if auto-advance is enabled
    if (autoAdvance) {
      startSimulation();
    }
    
    // Start telemetry collection
    if (enableTelemetry) {
      telemetryIntervalRef.current = setInterval(() => {
        trackTelemetryMetric('simulation_uptime', Date.now() - simulationState.metadata.startTime, 'ms');
        trackTelemetryMetric('current_temperature', simulationState.current.temperature.current, 'celsius');
        trackTelemetryMetric('current_humidity', simulationState.current.humidity.current, 'percent');
        trackTelemetryMetric('current_wind_speed', simulationState.current.wind.speed, 'km/h');
        trackTelemetryMetric('total_impacts', simulationState.impacts.length, 'count');
        trackTelemetryMetric('cache_hit_rate', getEngineStatistics().cacheHitRate, 'ratio');
      }, 5000); // Every 5 seconds
    }
    
    return () => {
      stopSimulation();
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current);
      }
    };
  }, [autoAdvance, enableTelemetry, simulationState.metadata.startTime, simulationState.current, simulationState.impacts.length, startSimulation, stopSimulation, trackTelemetryMetric, getEngineStatistics]);

  // Memoized values
  const currentWeather = useMemo(() => simulationState.current, [simulationState.current]);
  const weatherHistory = useMemo(() => simulationState.history, [simulationState.history]);
  const weatherForecast = useMemo(() => simulationState.forecast, [simulationState.forecast]);
  const currentImpacts = useMemo(() => simulationState.impacts, [simulationState.impacts]);
  const weatherStatistics = useMemo(() => simulationState.statistics, [simulationState.statistics]);
  const telemetryData = useMemo(() => simulationState.telemetry, [simulationState.telemetry]);

  return {
    // State
    simulationState,
    currentWeather,
    weatherHistory,
    weatherForecast,
    currentImpacts,
    weatherStatistics,
    telemetryData,
    
    // Actions
    updateWeatherCondition,
    startSimulation,
    stopSimulation,
    pauseSimulation,
    resumeSimulation,
    setSimulationSpeed,
    addImpactConfig,
    removeImpactConfig,
    calculateImpact,
    generateForecast,
    resetSimulation,
    
    // Data
    exportSimulationData,
    importSimulationData,
    getWeatherStatistics,
    getEngineStatistics,
    
    // Options
    options,
  };
}
