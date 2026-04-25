/**
 * NP-032 – Idle Village Weather Impact Simulation
 * 
 * Weather telemetry system for tracking weather events,
 * impacts, performance metrics, and analytics.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import {
  WeatherCondition,
  WeatherImpactResult,
  WeatherTelemetryData,
  WeatherTelemetryEvent,
  WeatherTelemetryMetric,
  WeatherTelemetryPerformance,
  WeatherTelemetryError,
  WeatherStatistics,
} from '../types/weatherSimulation';

// Telemetry configuration
export interface WeatherTelemetryConfig {
  enabled: boolean;
  events: boolean;
  metrics: boolean;
  performance: boolean;
  exportInterval: number; // milliseconds
  maxEvents: number;
  maxMetrics: number;
  maxErrors: number;
  batchSize: number;
  compressionEnabled: boolean;
}

// Telemetry manager
export class WeatherTelemetryManager {
  private config: WeatherTelemetryConfig;
  private data: WeatherTelemetryData;
  private exportTimer: NodeJS.Timeout | null = null;
  private performanceStart: number;

  constructor(config: Partial<WeatherTelemetryConfig> = {}) {
    this.config = {
      enabled: true,
      events: true,
      metrics: true,
      performance: true,
      exportInterval: 60000, // 1 minute
      maxEvents: 10000,
      maxMetrics: 5000,
      maxErrors: 1000,
      batchSize: 100,
      compressionEnabled: true,
      ...config,
    };

    this.data = {
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
    };

    this.performanceStart = performance.now();
    this.startExportTimer();
  }

  /**
   * Track weather event
   */
  trackEvent(type: WeatherTelemetryEvent['type'], data: any, metadata?: Partial<WeatherTelemetryEvent['metadata']>): void {
    if (!this.config.enabled || !this.config.events) return;

    const event: WeatherTelemetryEvent = {
      id: this.generateId('event'),
      timestamp: Date.now(),
      type,
      data,
      metadata: {
        source: 'weather-telemetry',
        version: '1.0.0',
        tags: ['weather', 'simulation'],
        ...metadata,
      },
    };

    this.addEvent(event);
  }

  /**
   * Track weather metric
   */
  trackMetric(name: string, value: number, unit: string, dimensions: Record<string, string> = {}, metadata?: Partial<WeatherTelemetryMetric['metadata']>): void {
    if (!this.config.enabled || !this.config.metrics) return;

    const metric: WeatherTelemetryMetric = {
      id: this.generateId('metric'),
      name,
      timestamp: Date.now(),
      value,
      unit,
      type: 'gauge',
      dimensions,
      metadata: {
        tags: ['weather', 'simulation'],
        ...metadata,
      },
    };

    this.addMetric(metric);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(type: 'simulation' | 'rendering', operation: string, duration: number, metadata?: Record<string, any>): void {
    if (!this.config.enabled || !this.config.performance) return;

    const perf = this.data.performance;
    
    if (type === 'simulation') {
      perf.simulation.totalCalculations++;
      perf.simulation.averageCalculationTime = 
        (perf.simulation.averageCalculationTime * (perf.simulation.totalCalculations - 1) + duration) / 
        perf.simulation.totalCalculations;
      
      this.trackMetric(`simulation_${operation}_duration`, duration, 'ms', {
        operation,
        type: 'performance',
      });
    } else if (type === 'rendering') {
      perf.rendering.totalRenders++;
      perf.rendering.averageRenderTime = 
        (perf.rendering.averageRenderTime * (perf.rendering.totalRenders - 1) + duration) / 
        perf.rendering.totalRenders;
      
      this.trackMetric(`rendering_${operation}_duration`, duration, 'ms', {
        operation,
        type: 'performance',
      });
    }

    // Update memory usage
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize;
      perf.memory.used = memoryUsage;
      perf.memory.peak = Math.max(perf.memory.peak, memoryUsage);
      perf.memory.allocations++;
      
      this.trackMetric('memory_used', memoryUsage, 'bytes', {
        type: 'memory',
      });
    }
  }

  /**
   * Track error
   */
  trackError(type: WeatherTelemetryError['type'], message: string, context?: any, severity: WeatherTelemetryError['severity'] = 'medium'): void {
    if (!this.config.enabled) return;

    const error: WeatherTelemetryError = {
      id: this.generateId('error'),
      timestamp: Date.now(),
      type,
      message,
      stack: new Error().stack,
      context,
      severity,
      resolved: false,
    };

    this.addError(error);
  }

  /**
   * Track weather change
   */
  trackWeatherChange(fromCondition: WeatherCondition, toCondition: WeatherCondition): void {
    this.trackEvent('weather_change', {
      from: fromCondition,
      to: toCondition,
      change: {
        type: fromCondition.type !== toCondition.type ? 'type_change' : 'property_change',
        severity: fromCondition.severity !== toCondition.severity ? 'severity_change' : 'same',
        temperatureDelta: toCondition.temperature.current - fromCondition.temperature.current,
        windDelta: toCondition.wind.speed - fromCondition.wind.speed,
        humidityDelta: toCondition.humidity.current - fromCondition.humidity.current,
      },
    });

    // Track weather metrics
    this.trackMetric('weather_temperature', toCondition.temperature.current, 'celsius', {
      type: toCondition.type,
      severity: toCondition.severity,
    });

    this.trackMetric('weather_humidity', toCondition.humidity.current, 'percent', {
      type: toCondition.type,
      severity: toCondition.severity,
    });

    this.trackMetric('weather_wind_speed', toCondition.wind.speed, 'km/h', {
      type: toCondition.type,
      severity: toCondition.severity,
    });

    this.trackMetric('weather_visibility', toCondition.visibility.current, 'meters', {
      type: toCondition.type,
      severity: toCondition.severity,
    });
  }

  /**
   * Track impact calculation
   */
  trackImpactCalculation(impact: WeatherImpactResult, calculationTime: number): void {
    this.trackEvent('impact_calculated', {
      impact,
      calculationTime,
    });

    this.trackPerformance('simulation', 'impact_calculation', calculationTime, {
      targetType: impact.targetType,
      weatherType: impact.weatherCondition.type,
      confidence: impact.confidence,
    });

    // Track impact metrics
    this.trackMetric('impact_success_rate_modifier', impact.impacts.successRate.modifier, 'ratio', {
      targetType: impact.targetType,
      weatherType: impact.weatherCondition.type,
    });

    this.trackMetric('impact_fatigue_modifier', impact.impacts.fatigue.modifier, 'ratio', {
      targetType: impact.targetType,
      weatherType: impact.weatherCondition.type,
    });

    this.trackMetric('impact_confidence', impact.confidence, 'ratio', {
      targetType: impact.targetType,
      weatherType: impact.weatherCondition.type,
    });
  }

  /**
   * Track special effect trigger
   */
  trackSpecialEffectTrigger(effectId: string, effectName: string, target: string, magnitude: number): void {
    this.trackEvent('effect_triggered', {
      effectId,
      effectName,
      target,
      magnitude,
    });

    this.trackMetric('special_effect_triggered', 1, 'count', {
      effectId,
      effectName,
      target,
    });
  }

  /**
   * Track simulation event
   */
  trackSimulationEvent(event: string, data?: any): void {
    this.trackEvent('simulation_event', {
      event,
      data,
    });

    this.trackMetric('simulation_event', 1, 'count', {
      event,
    });
  }

  /**
   * Get telemetry data
   */
  getTelemetryData(): WeatherTelemetryData {
    return { ...this.data };
  }

  /**
   * Get events by type
   */
  getEventsByType(type: WeatherTelemetryEvent['type']): WeatherTelemetryEvent[] {
    return this.data.events.filter(event => event.type === type);
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): WeatherTelemetryMetric[] {
    return this.data.metrics.filter(metric => metric.name === name);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: WeatherTelemetryError['severity']): WeatherTelemetryError[] {
    return this.data.errors.filter(error => error.severity === severity);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): WeatherTelemetryPerformance {
    return { ...this.data.performance };
  }

  /**
   * Get statistics summary
   */
  getStatisticsSummary(): {
    uptime: number;
    eventsPerMinute: number;
    metricsPerMinute: number;
    errorsPerMinute: number;
    averageEventSize: number;
    averageMetricSize: number;
  } {
    const now = Date.now();
    const uptime = now - this.data.metadata.collectionStartTime;
    const minutes = uptime / 60000;

    return {
      uptime,
      eventsPerMinute: minutes > 0 ? this.data.metadata.totalEvents / minutes : 0,
      metricsPerMinute: minutes > 0 ? this.data.metadata.totalMetrics / minutes : 0,
      errorsPerMinute: minutes > 0 ? this.data.metadata.totalErrors / minutes : 0,
      averageEventSize: this.data.events.length > 0 ? 
        this.data.events.reduce((sum, event) => sum + JSON.stringify(event).length, 0) / this.data.events.length : 0,
      averageMetricSize: this.data.metrics.length > 0 ? 
        this.data.metrics.reduce((sum, metric) => sum + JSON.stringify(metric).length, 0) / this.data.metrics.length : 0,
    };
  }

  /**
   * Export telemetry data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        config: this.config,
        summary: this.getStatisticsSummary(),
      },
      data: this.data,
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(exportData);
    }

    return JSON.stringify(exportData);
  }

  /**
   * Clear telemetry data
   */
  clearData(): void {
    this.data = {
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
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WeatherTelemetryConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart export timer if interval changed
    if (config.exportInterval) {
      this.stopExportTimer();
      this.startExportTimer();
    }
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (!enabled) {
      this.stopExportTimer();
    } else {
      this.startExportTimer();
    }
  }

  /**
   * Get configuration
   */
  getConfig(): WeatherTelemetryConfig {
    return { ...this.config };
  }

  /**
   * Add event to data
   */
  private addEvent(event: WeatherTelemetryEvent): void {
    this.data.events.push(event);
    this.data.metadata.totalEvents++;
    this.data.metadata.lastUpdateTime = Date.now();

    // Maintain max events limit
    if (this.data.events.length > this.config.maxEvents) {
      this.data.events = this.data.events.slice(-this.config.maxEvents);
    }
  }

  /**
   * Add metric to data
   */
  private addMetric(metric: WeatherTelemetryMetric): void {
    this.data.metrics.push(metric);
    this.data.metadata.totalMetrics++;
    this.data.metadata.lastUpdateTime = Date.now();

    // Maintain max metrics limit
    if (this.data.metrics.length > this.config.maxMetrics) {
      this.data.metrics = this.data.metrics.slice(-this.config.maxMetrics);
    }
  }

  /**
   * Add error to data
   */
  private addError(error: WeatherTelemetryError): void {
    this.data.errors.push(error);
    this.data.metadata.totalErrors++;
    this.data.metadata.lastUpdateTime = Date.now();

    // Maintain max errors limit
    if (this.data.errors.length > this.config.maxErrors) {
      this.data.errors = this.data.errors.slice(-this.config.maxErrors);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start export timer
   */
  private startExportTimer(): void {
    if (this.exportTimer) return;

    this.exportTimer = setInterval(() => {
      this.performAutoExport();
    }, this.config.exportInterval);
  }

  /**
   * Stop export timer
   */
  private stopExportTimer(): void {
    if (this.exportTimer) {
      clearInterval(this.exportTimer);
      this.exportTimer = null;
    }
  }

  /**
   * Perform automatic export
   */
  private performAutoExport(): void {
    // In a real implementation, this would export to external storage
    console.log('Auto-exporting telemetry data:', {
      events: this.data.events.length,
      metrics: this.data.metrics.length,
      errors: this.data.errors.length,
    });
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    const csvRows: string[] = [];
    
    // Events CSV
    if (data.data.events.length > 0) {
      csvRows.push('EVENTS');
      csvRows.push('id,timestamp,type,data');
      data.data.events.forEach((event: WeatherTelemetryEvent) => {
        csvRows.push(`${event.id},${event.timestamp},${event.type},"${JSON.stringify(event.data).replace(/"/g, '""')}"`);
      });
      csvRows.push('');
    }

    // Metrics CSV
    if (data.data.metrics.length > 0) {
      csvRows.push('METRICS');
      csvRows.push('id,name,timestamp,value,unit,type,dimensions');
      data.data.metrics.forEach((metric: WeatherTelemetryMetric) => {
        const dimensions = JSON.stringify(metric.dimensions).replace(/"/g, '""');
        csvRows.push(`${metric.id},${metric.name},${metric.timestamp},${metric.value},${metric.unit},${metric.type},"${dimensions}"`);
      });
      csvRows.push('');
    }

    // Errors CSV
    if (data.data.errors.length > 0) {
      csvRows.push('ERRORS');
      csvRows.push('id,timestamp,type,message,severity,resolved');
      data.data.errors.forEach((error: WeatherTelemetryError) => {
        csvRows.push(`${error.id},${error.timestamp},${error.type},"${error.message.replace(/"/g, '""')}",${error.severity},${error.resolved}`);
      });
    }

    return csvRows.join('\n');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopExportTimer();
    this.clearData();
  }
}

// Default telemetry manager instance
export const defaultWeatherTelemetry = new WeatherTelemetryManager();

// Utility functions
export function createWeatherTelemetryManager(config?: Partial<WeatherTelemetryConfig>): WeatherTelemetryManager {
  return new WeatherTelemetryManager(config);
}

export function trackWeatherEvent(type: WeatherTelemetryEvent['type'], data: any): void {
  defaultWeatherTelemetry.trackEvent(type, data);
}

export function trackWeatherMetric(name: string, value: number, unit: string, dimensions?: Record<string, string>): void {
  defaultWeatherTelemetry.trackMetric(name, value, unit, dimensions);
}

export function trackWeatherPerformance(type: 'simulation' | 'rendering', operation: string, duration: number): void {
  defaultWeatherTelemetry.trackPerformance(type, operation, duration);
}

export function trackWeatherError(type: WeatherTelemetryError['type'], message: string, context?: any): void {
  defaultWeatherTelemetry.trackError(type, message, context);
}

export function getWeatherTelemetryData(): WeatherTelemetryData {
  return defaultWeatherTelemetry.getTelemetryData();
}

export function exportWeatherTelemetry(format: 'json' | 'csv' = 'json'): string {
  return defaultWeatherTelemetry.exportData(format);
}
