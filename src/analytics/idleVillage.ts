// src/analytics/idleVillage.ts
// Analytics module for Idle Village activity metrics and performance analysis

import type { ActivityAnalyticsMetrics, ActivityAnalyticsDataPoint } from '@/ui/idleVillage/hooks/useActivityAnalytics';
import type { ActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * Comprehensive analytics data for Idle Village operations.
 */
export interface IdleVillageAnalytics {
  /** Current activity state snapshot */
  currentActivityState: ActivityAnalyticsMetrics | null;
  /** Historical activity trends */
  activityTrends: {
    hourly: Record<number, ActivityAnalyticsDataPoint>;
    daily: Record<string, ActivityAnalyticsDataPoint>;
    weekly: Record<string, ActivityAnalyticsDataPoint>;
  };
  /** Resource production analytics */
  resourceAnalytics: {
    productionRates: Record<string, number>;
    consumptionRates: Record<string, number>;
    netProduction: Record<string, number>;
    efficiency: Record<string, number>; // production per activity
  };
  /** Resident performance analytics */
  residentAnalytics: {
    mostEfficient: Array<{
      residentId: string;
      efficiency: number;
      totalActivities: number;
      averageProgress: number;
    }>;
    leastEfficient: Array<{
      residentId: string;
      efficiency: number;
      totalActivities: number;
      averageProgress: number;
    }>;
    utilization: Record<string, number>; // percentage of time spent on activities
  };
  /** Village-wide performance metrics */
  villageMetrics: {
    overallEfficiency: number;
    activityThroughput: number;
    resourceBalance: Record<string, number>; // positive = surplus, negative = deficit
    peakActivityHours: number[];
  };
}

/**
 * Analytics configuration for Idle Village.
 */
export interface IdleVillageAnalyticsConfig {
  /** Enable resource tracking */
  enableResourceAnalytics: boolean;
  /** Enable resident performance tracking */
  enableResidentAnalytics: boolean;
  /** Enable trend analysis */
  enableTrendAnalysis: boolean;
  /** Data retention period in days */
  retentionDays: number;
  /** Enable performance optimization suggestions */
  enableOptimizationSuggestions: boolean;
}

/**
 * Props for Idle Village analytics engine.
 */
export interface IdleVillageAnalyticsProps {
  /** Current Active HUD state */
  hudState: ActiveHUDState;
  /** Current village state */
  villageState: VillageState;
  /** Activity analytics metrics */
  activityMetrics: ActivityAnalyticsMetrics | null;
  /** Analytics configuration */
  config?: Partial<IdleVillageAnalyticsConfig>;
}

/**
 * Default analytics configuration.
 */
const DEFAULT_ANALYTICS_CONFIG: IdleVillageAnalyticsConfig = {
  enableResourceAnalytics: true,
  enableResidentAnalytics: true,
  enableTrendAnalysis: true,
  retentionDays: 30,
  enableOptimizationSuggestions: true,
};

/**
 * Analytics engine for Idle Village operations.
 */
export class IdleVillageAnalyticsEngine {
  private config: IdleVillageAnalyticsConfig;
  private historicalData: Map<string, ActivityAnalyticsDataPoint[]> = new Map();

  constructor(config: Partial<IdleVillageAnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
  }

  /**
   * Calculate analytics for Idle Village operations.
   */
  calculateAnalytics({ activityMetrics, villageState }: IdleVillageAnalyticsProps): IdleVillageAnalytics {
    if (!activityMetrics) {
      return this.createEmptyAnalytics();
    }

    // Calculate resource analytics
    const resourceAnalytics = this.config.enableResourceAnalytics 
      ? this.calculateResourceAnalytics(villageState, activityMetrics)
      : this.createEmptyResourceAnalytics();

    // Calculate resident analytics
    const residentAnalytics = this.config.enableResidentAnalytics
      ? this.calculateResidentAnalytics(activityMetrics)
      : this.createEmptyResidentAnalytics();

    // Calculate activity trends
    const activityTrends = this.config.enableTrendAnalysis
      ? this.calculateActivityTrends(activityMetrics)
      : this.createEmptyActivityTrends();

    // Calculate village-wide metrics
    const villageMetrics = this.calculateVillageMetrics(
      activityMetrics,
      resourceAnalytics,
      residentAnalytics
    );

    return {
      currentActivityState: activityMetrics,
      activityTrends,
      resourceAnalytics,
      residentAnalytics,
      villageMetrics,
    };
  }

  /**
   * Create empty analytics structure.
   */
  private createEmptyAnalytics(): IdleVillageAnalytics {
    return {
      currentActivityState: null,
      activityTrends: this.createEmptyActivityTrends(),
      resourceAnalytics: this.createEmptyResourceAnalytics(),
      residentAnalytics: this.createEmptyResidentAnalytics(),
      villageMetrics: {
        overallEfficiency: 0,
        activityThroughput: 0,
        resourceBalance: {},
        peakActivityHours: [],
      },
    };
  }

  /**
   * Create empty activity trends.
   */
  private createEmptyActivityTrends(): IdleVillageAnalytics['activityTrends'] {
    return {
      hourly: {},
      daily: {},
      weekly: {},
    };
  }

  /**
   * Create empty resource analytics.
   */
  private createEmptyResourceAnalytics(): IdleVillageAnalytics['resourceAnalytics'] {
    return {
      productionRates: {},
      consumptionRates: {},
      netProduction: {},
      efficiency: {},
    };
  }

  /**
   * Create empty resident analytics.
   */
  private createEmptyResidentAnalytics(): IdleVillageAnalytics['residentAnalytics'] {
    return {
      mostEfficient: [],
      leastEfficient: [],
      utilization: {},
    };
  }

  /**
   * Calculate resource production and consumption analytics.
   */
  private calculateResourceAnalytics(
    villageState: VillageState,
    activityMetrics: ActivityAnalyticsMetrics
  ): IdleVillageAnalytics['resourceAnalytics'] {
    const resourceAnalytics: IdleVillageAnalytics['resourceAnalytics'] = {
      productionRates: {},
      consumptionRates: {},
      netProduction: {},
      efficiency: {},
    };

    // Calculate production and consumption rates
    Object.entries(villageState.resources).forEach(([resourceId, amount]) => {
      // For now, assume all resources are produced (no direct consumption tracking)
      const production = amount;
      const consumption = 0; // Would need to be tracked separately
      
      resourceAnalytics.productionRates[resourceId] = production;
      resourceAnalytics.consumptionRates[resourceId] = consumption;
      resourceAnalytics.netProduction[resourceId] = production - consumption;
      
      // Calculate efficiency (production per activity)
      if (activityMetrics && activityMetrics.currentSnapshot.totalActivities > 0) {
        resourceAnalytics.efficiency[resourceId] = 
          production / activityMetrics.currentSnapshot.totalActivities;
      }
    });

    return resourceAnalytics;
  }

  /**
   * Calculate resident performance analytics.
   */
  private calculateResidentAnalytics(
    activityMetrics: ActivityAnalyticsMetrics
  ): IdleVillageAnalytics['residentAnalytics'] {
    const residentAnalytics: IdleVillageAnalytics['residentAnalytics'] = {
      mostEfficient: [],
      leastEfficient: [],
      utilization: {},
    };

    if (!activityMetrics.residentEfficiency) {
      return residentAnalytics;
    }

    // Sort residents by efficiency
    const residents = Object.entries(activityMetrics.residentEfficiency)
      .map(([residentId, data]) => ({
        residentId,
        efficiency: data.efficiency,
        totalActivities: data.totalActivities,
        averageProgress: data.averageProgress,
      }))
      .sort((a, b) => b.efficiency - a.efficiency);

    // Extract top and bottom performers
    residentAnalytics.mostEfficient = residents.slice(0, 5);
    residentAnalytics.leastEfficient = residents.slice(-5).reverse();

    // Calculate utilization (time spent on activities)
    const totalActivities = residents.reduce((sum, r) => sum + r.totalActivities, 0);
    residents.forEach(resident => {
      residentAnalytics.utilization[resident.residentId] = 
        totalActivities > 0 ? (resident.totalActivities / totalActivities) * 100 : 0;
    });

    return residentAnalytics;
  }

  /**
   * Calculate activity trends over time.
   */
  private calculateActivityTrends(
    activityMetrics: ActivityAnalyticsMetrics
  ): IdleVillageAnalytics['activityTrends'] {
    const trends: IdleVillageAnalytics['activityTrends'] = {
      hourly: {},
      daily: {},
      weekly: {},
    };

    // Aggregate by hour
    activityMetrics.historicalData.forEach(point => {
      const hour = new Date(point.timestamp).getHours();
      if (!trends.hourly[hour]) {
        trends.hourly[hour] = { ...point };
      } else {
        // Aggregate data for the same hour
        trends.hourly[hour].totalActivities += point.totalActivities;
        trends.hourly[hour].averageProgress = 
          (trends.hourly[hour].averageProgress + point.averageProgress) / 2;
      }
    });

    // Aggregate by day
    activityMetrics.historicalData.forEach(point => {
      const day = new Date(point.timestamp).toISOString().split('T')[0];
      if (!trends.daily[day]) {
        trends.daily[day] = { ...point };
      } else {
        trends.daily[day].totalActivities += point.totalActivities;
        trends.daily[day].averageProgress = 
          (trends.daily[day].averageProgress + point.averageProgress) / 2;
      }
    });

    // Aggregate by week
    activityMetrics.historicalData.forEach(point => {
      const week = this.getWeekKey(new Date(point.timestamp));
      if (!trends.weekly[week]) {
        trends.weekly[week] = { ...point };
      } else {
        trends.weekly[week].totalActivities += point.totalActivities;
        trends.weekly[week].averageProgress = 
          (trends.weekly[week].averageProgress + point.averageProgress) / 2;
      }
    });

    return trends;
  }

  /**
   * Calculate village-wide performance metrics.
   */
  private calculateVillageMetrics(
    activityMetrics: ActivityAnalyticsMetrics,
    resourceAnalytics: IdleVillageAnalytics['resourceAnalytics'],
    residentAnalytics: IdleVillageAnalytics['residentAnalytics']
  ): IdleVillageAnalytics['villageMetrics'] {
    const metrics: IdleVillageAnalytics['villageMetrics'] = {
      overallEfficiency: 0,
      activityThroughput: 0,
      resourceBalance: {},
      peakActivityHours: [],
    };

    // Calculate overall efficiency
    if (residentAnalytics.utilization) {
      const utilizations = Object.values(residentAnalytics.utilization);
      metrics.overallEfficiency = utilizations.reduce((sum, util) => sum + util, 0) / utilizations.length;
    }

    // Calculate activity throughput
    metrics.activityThroughput = activityMetrics.performanceMetrics.averageConcurrentActivities;

    // Calculate resource balance
    Object.entries(resourceAnalytics.netProduction).forEach(([resource, balance]) => {
      metrics.resourceBalance[resource] = balance;
    });

    // Find peak activity hours
    if (Object.keys(activityMetrics.historicalData).length > 0) {
      const hourlyActivity = activityMetrics.historicalData.reduce((acc, point) => {
        const hour = new Date(point.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + point.totalActivities;
        return acc;
      }, {} as Record<number, number>);

      const avgActivity = Object.values(hourlyActivity).reduce((sum, count) => sum + count, 0) / Object.keys(hourlyActivity).length;
      metrics.peakActivityHours = Object.entries(hourlyActivity)
        .filter(([, count]) => count > avgActivity)
        .map(([hour]) => hour);
    }

    return metrics;
  }

  /**
   * Get week key for date aggregation.
   */
  private getWeekKey(date: Date): string {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    return startOfWeek.toISOString().split('T')[0];
  }

  /**
   * Generate optimization suggestions based on analytics.
   */
  generateOptimizationSuggestions(analytics: IdleVillageAnalytics): string[] {
    const suggestions: string[] = [];

    if (!this.config.enableOptimizationSuggestions) {
      return suggestions;
    }

    // Resource balance suggestions
    Object.entries(analytics.resourceBalance).forEach(([resource, balance]) => {
      if (balance < -10) {
        suggestions.push(`Increase ${resource} production - deficit of ${Math.abs(balance)} units`);
      } else if (balance > 50) {
        suggestions.push(`Consider reducing ${resource} production - surplus of ${balance} units`);
      }
    });

    // Resident efficiency suggestions
    if (analytics.residentAnalytics.leastEfficient.length > 0) {
      const leastEfficient = analytics.residentAnalytics.leastEfficient[0];
      suggestions.push(
        `Resident ${leastEfficient.residentId} has low efficiency (${(leastEfficient.efficiency * 100).toFixed(1)}%). Consider reassigning activities.`
      );
    }

    // Activity throughput suggestions
    if (analytics.villageMetrics.activityThroughput < 2) {
      suggestions.push('Low activity throughput detected. Consider assigning more activities to residents.');
    }

    // Overall efficiency suggestions
    if (analytics.villageMetrics.overallEfficiency < 50) {
      suggestions.push('Low overall village efficiency. Review activity assignments and resource management.');
    }

    return suggestions;
  }

  /**
   * Export analytics data to JSON format.
   */
  exportAnalytics(analytics: IdleVillageAnalytics): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      config: this.config,
      analytics,
      suggestions: this.generateOptimizationSuggestions(analytics),
    }, null, 2);
  }

  /**
   * Import analytics data from JSON format.
   */
  importAnalytics(data: string): IdleVillageAnalytics {
    try {
      const parsed = JSON.parse(data);
      return parsed.analytics;
    } catch (error) {
      console.error('Failed to import analytics data:', error);
      return this.createEmptyAnalytics();
    }
  }
}

/**
 * Factory function to create analytics engine.
 */
export function createIdleVillageAnalyticsEngine(
  config?: Partial<IdleVillageAnalyticsConfig>
): IdleVillageAnalyticsEngine {
  return new IdleVillageAnalyticsEngine(config);
}

/**
 * Default analytics engine instance.
 */
export const defaultAnalyticsEngine = createIdleVillageAnalyticsEngine();
