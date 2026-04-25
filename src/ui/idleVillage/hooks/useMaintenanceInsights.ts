/**
 * Maintenance Optimizer Insights Hook – Phase 12
 * 
 * Provides comprehensive maintenance optimization insights for Idle Village
 * including food consumption, injury rates, resource efficiency, and crew
 * scheduling recommendations. Integrates with crew scheduler and activity
 * telemetry to generate actionable insights for village management.
 * 
 * @since Phase 12
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import type { CrewSchedulerConfig, AssignmentFactors } from './useCrewScheduler';
import type { ActivityTelemetryEvent } from '../utils/activityTelemetry';

/**
 * Maintenance activity categories for optimization analysis
 */
export type MaintenanceCategory = 'food' | 'injury' | 'repair' | 'cleaning' | 'security';

/**
 * Resource consumption metrics for maintenance activities
 */
export interface ResourceMetrics {
  /** Food consumption per maintenance action */
  foodConsumption: number;
  /** Medical supplies consumption per injury treatment */
  medicalConsumption: number;
  /** Repair materials consumption per repair action */
  repairConsumption: number;
  /** Cleaning supplies consumption per cleaning action */
  cleaningConsumption: number;
  /** Security equipment consumption per security action */
  securityConsumption: number;
}

/**
 * Efficiency metrics for maintenance operations
 */
export interface EfficiencyMetrics {
  /** Actions completed per unit time */
  actionsPerHour: number;
  /** Resource utilization efficiency (0-1) */
  resourceUtilization: number;
  /** Crew satisfaction impact (0-1) */
  satisfactionImpact: number;
  /** Error rate or failure rate (0-1) */
  errorRate: number;
  /** Average time per maintenance action */
  averageActionTime: number;
}

/**
 * Maintenance insight severity levels
 */
export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Individual maintenance insight with recommendations
 */
export interface MaintenanceInsight {
  /** Unique insight identifier */
  id: string;
  /** Insight category */
  category: MaintenanceCategory;
  /** Severity level */
  severity: InsightSeverity;
  /** Insight title */
  title: string;
  /** Detailed description */
  description: string;
  /** Quantified impact */
  impact: {
    /** Resource savings potential (percentage) */
    resourceSavings: number;
    /** Time savings potential (percentage) */
    timeSavings: number;
    /** Risk reduction potential (percentage) */
    riskReduction: number;
  };
  /** Actionable recommendations */
  recommendations: string[];
  /** Supporting data points */
  data: {
    /** Current metric value */
    current: number;
    /** Target metric value */
    target: number;
    /** Historical trend */
    trend: 'improving' | 'stable' | 'declining';
    /** Confidence level (0-1) */
    confidence: number;
  };
  /** Timestamp when insight was generated */
  timestamp: number;
}

/**
 * Maintenance optimization configuration
 */
export interface MaintenanceOptimizerConfig {
  /** Analysis window in time units */
  analysisWindow: number;
  /** Minimum confidence threshold for insights */
  confidenceThreshold: number;
  /** Resource efficiency targets */
  efficiencyTargets: {
    food: number;
    medical: number;
    repair: number;
    cleaning: number;
    security: number;
  };
  /** Priority weights for insight scoring */
  priorityWeights: {
    resourceEfficiency: number;
    timeEfficiency: number;
    riskReduction: number;
    crewSatisfaction: number;
  };
}

/**
 * Complete maintenance insights state
 */
export interface MaintenanceInsightsState {
  /** Current insights */
  insights: MaintenanceInsight[];
  /** Resource metrics */
  resourceMetrics: ResourceMetrics;
  /** Efficiency metrics */
  efficiencyMetrics: EfficiencyMetrics;
  /** Historical trends */
  trends: {
    foodConsumption: number[];
    injuryRates: number[];
    repairFrequency: number[];
    cleaningFrequency: number[];
    securityIncidents: number[];
  };
  /** Optimization recommendations */
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  /** Last analysis timestamp */
  lastAnalysis: number;
  /** Analysis in progress flag */
  analyzing: boolean;
}

/**
 * Default maintenance optimizer configuration
 */
export const DEFAULT_MAINTENANCE_CONFIG: MaintenanceOptimizerConfig = {
  analysisWindow: 100, // 100 time units
  confidenceThreshold: 0.7,
  efficiencyTargets: {
    food: 0.85,
    medical: 0.90,
    repair: 0.80,
    cleaning: 0.75,
    security: 0.95,
  },
  priorityWeights: {
    resourceEfficiency: 0.3,
    timeEfficiency: 0.25,
    riskReduction: 0.3,
    crewSatisfaction: 0.15,
  },
};

/**
 * Hook for maintenance optimization insights
 */
export function useMaintenanceInsights(
  residents: ResidentState[],
  activities: ActivityDefinition[],
  crewSchedulerConfig: CrewSchedulerConfig,
  telemetryEvents: ActivityTelemetryEvent[],
  config: Partial<MaintenanceOptimizerConfig> = {}
) {
  const diagnostics = createSandboxDiagnostics('MaintenanceOptimizer');
  const [state, setState] = useState<MaintenanceInsightsState>({
    insights: [],
    resourceMetrics: {
      foodConsumption: 0,
      medicalConsumption: 0,
      repairConsumption: 0,
      cleaningConsumption: 0,
      securityConsumption: 0,
    },
    efficiencyMetrics: {
      actionsPerHour: 0,
      resourceUtilization: 0,
      satisfactionImpact: 0,
      errorRate: 0,
      averageActionTime: 0,
    },
    trends: {
      foodConsumption: [],
      injuryRates: [],
      repairFrequency: [],
      cleaningFrequency: [],
      securityIncidents: [],
    },
    recommendations: {
      immediate: [],
      shortTerm: [],
      longTerm: [],
    },
    lastAnalysis: 0,
    analyzing: false,
  });

  const optimizerConfig = useMemo(() => ({
    ...DEFAULT_MAINTENANCE_CONFIG,
    ...config,
  }), [config]);

  /**
   * Calculate resource consumption metrics from telemetry
   */
  const calculateResourceMetrics = useCallback((
    events: ActivityTelemetryEvent[],
    window: number
  ): ResourceMetrics => {
    const recentEvents = events.filter(
      event => Date.now() - event.timestamp < window
    );

    const metrics: ResourceMetrics = {
      foodConsumption: 0,
      medicalConsumption: 0,
      repairConsumption: 0,
      cleaningConsumption: 0,
      securityConsumption: 0,
    };

    recentEvents.forEach(event => {
      switch (event.activityType) {
        case 'food_preparation':
        case 'food_distribution':
          metrics.foodConsumption += event.resourceCost || 1;
          break;
        case 'injury_treatment':
        case 'medical_care':
          metrics.medicalConsumption += event.resourceCost || 1;
          break;
        case 'repair':
        case 'maintenance':
          metrics.repairConsumption += event.resourceCost || 1;
          break;
        case 'cleaning':
        case 'sanitation':
          metrics.cleaningConsumption += event.resourceCost || 1;
          break;
        case 'security':
        case 'patrol':
          metrics.securityConsumption += event.resourceCost || 1;
          break;
      }
    });

    // Normalize per hour
    const hoursInWindow = window / (1000 * 60 * 60);
    const factor = hoursInWindow > 0 ? 1 / hoursInWindow : 1;

    return Object.fromEntries(
      Object.entries(metrics).map(([key, value]) => [key, value * factor])
    ) as ResourceMetrics;
  }, []);

  /**
   * Calculate efficiency metrics from crew performance
   */
  const calculateEfficiencyMetrics = useCallback((
    events: ActivityTelemetryEvent[],
    residents: ResidentState[]
  ): EfficiencyMetrics => {
    const completedEvents = events.filter(event => event.status === 'completed');
    const totalEvents = events.length;
    const totalTime = events.reduce((sum, event) => sum + (event.duration || 0), 0);

    const actionsPerHour = totalTime > 0 ? (completedEvents.length / totalTime) * 3600000 : 0;
    const errorRate = totalEvents > 0 ? (totalEvents - completedEvents.length) / totalEvents : 0;
    const averageActionTime = completedEvents.length > 0 ? totalTime / completedEvents.length : 0;

    // Calculate resource utilization based on crew assignment efficiency
    const assignedResidents = residents.filter(r => r.currentActivity);
    const resourceUtilization = residents.length > 0 ? assignedResidents.length / residents.length : 0;

    // Estimate satisfaction impact based on fatigue and workload balance
    const avgFatigue = residents.reduce((sum, r) => sum + r.fatigue, 0) / residents.length;
    const satisfactionImpact = Math.max(0, 1 - avgFatigue);

    return {
      actionsPerHour,
      resourceUtilization,
      satisfactionImpact,
      errorRate,
      averageActionTime,
    };
  }, []);

  /**
   * Generate maintenance insights based on analysis
   */
  const generateInsights = useCallback((
    resourceMetrics: ResourceMetrics,
    efficiencyMetrics: EfficiencyMetrics,
    config: MaintenanceOptimizerConfig
  ): MaintenanceInsight[] => {
    const insights: MaintenanceInsight[] = [];
    const timestamp = Date.now();

    // Food consumption insights
    if (resourceMetrics.foodConsumption > config.efficiencyTargets.food * 1.2) {
      insights.push({
        id: `food-overshoot-${timestamp}`,
        category: 'food',
        severity: resourceMetrics.foodConsumption > config.efficiencyTargets.food * 1.5 ? 'high' : 'medium',
        title: 'High Food Consumption Detected',
        description: `Food consumption is ${(resourceMetrics.foodConsumption / config.efficiencyTargets.food * 100 - 100).toFixed(1)}% above target`,
        impact: {
          resourceSavings: Math.min(20, (resourceMetrics.foodConsumption / config.efficiencyTargets.food - 1) * 100),
          timeSavings: 10,
          riskReduction: 5,
        },
        recommendations: [
          'Optimize food preparation schedules',
          'Review resident dietary requirements',
          'Consider bulk preparation methods',
        ],
        data: {
          current: resourceMetrics.foodConsumption,
          target: config.efficiencyTargets.food,
          trend: 'declining',
          confidence: 0.8,
        },
        timestamp,
      });
    }

    // Medical consumption insights
    if (resourceMetrics.medicalConsumption > config.efficiencyTargets.medical * 1.1) {
      insights.push({
        id: `medical-overshoot-${timestamp}`,
        category: 'injury',
        severity: resourceMetrics.medicalConsumption > config.efficiencyTargets.medical * 1.3 ? 'critical' : 'high',
        title: 'Elevated Medical Supply Usage',
        description: `Medical supply consumption is ${(resourceMetrics.medicalConsumption / config.efficiencyTargets.medical * 100 - 100).toFixed(1)}% above target`,
        impact: {
          resourceSavings: Math.min(25, (resourceMetrics.medicalConsumption / config.efficiencyTargets.medical - 1) * 100),
          timeSavings: 15,
          riskReduction: 30,
        },
        recommendations: [
          'Investigate injury prevention measures',
          'Review safety protocols',
          'Consider preventive maintenance schedules',
        ],
        data: {
          current: resourceMetrics.medicalConsumption,
          target: config.efficiencyTargets.medical,
          trend: 'declining',
          confidence: 0.9,
        },
        timestamp,
      });
    }

    // Efficiency insights
    if (efficiencyMetrics.actionsPerHour < 10) {
      insights.push({
        id: `efficiency-low-${timestamp}`,
        category: 'repair',
        severity: efficiencyMetrics.actionsPerHour < 5 ? 'high' : 'medium',
        title: 'Low Maintenance Throughput',
        description: `Maintenance actions per hour is ${efficiencyMetrics.actionsPerHour.toFixed(1)}, below optimal range`,
        impact: {
          resourceSavings: 15,
          timeSavings: Math.min(40, (10 - efficiencyMetrics.actionsPerHour) * 10),
          riskReduction: 10,
        },
        recommendations: [
          'Optimize crew assignment priorities',
          'Review maintenance procedures',
          'Consider automation opportunities',
        ],
        data: {
          current: efficiencyMetrics.actionsPerHour,
          target: 10,
          trend: 'stable',
          confidence: 0.75,
        },
        timestamp,
      });
    }

    // Crew satisfaction insights
    if (efficiencyMetrics.satisfactionImpact < 0.7) {
      insights.push({
        id: `satisfaction-low-${timestamp}`,
        category: 'cleaning',
        severity: efficiencyMetrics.satisfactionImpact < 0.5 ? 'high' : 'medium',
        title: 'Crew Satisfaction Concerns',
        description: `Crew satisfaction impact is ${(efficiencyMetrics.satisfactionImpact * 100).toFixed(1)}%, below target`,
        impact: {
          resourceSavings: 10,
          timeSavings: 20,
          riskReduction: 15,
        },
        recommendations: [
          'Review workload distribution',
          'Implement rest periods',
          'Consider rotating assignments',
        ],
        data: {
          current: efficiencyMetrics.satisfactionImpact,
          target: 0.8,
          trend: 'declining',
          confidence: 0.7,
        },
        timestamp,
      });
    }

    // Error rate insights
    if (efficiencyMetrics.errorRate > 0.1) {
      insights.push({
        id: `error-high-${timestamp}`,
        category: 'security',
        severity: efficiencyMetrics.errorRate > 0.2 ? 'critical' : 'high',
        title: 'High Maintenance Error Rate',
        description: `Maintenance error rate is ${(efficiencyMetrics.errorRate * 100).toFixed(1)}%, above acceptable threshold`,
        impact: {
          resourceSavings: 20,
          timeSavings: 25,
          riskReduction: 35,
        },
        recommendations: [
          'Review maintenance procedures',
          'Provide additional training',
          'Implement quality checks',
        ],
        data: {
          current: efficiencyMetrics.errorRate,
          target: 0.05,
          trend: 'increasing',
          confidence: 0.85,
        },
        timestamp,
      });
    }

    return insights.filter(insight => insight.data.confidence >= config.confidenceThreshold);
  }, []);

  /**
   * Generate prioritized recommendations
   */
  const generateRecommendations = useCallback((
    insights: MaintenanceInsight[]
  ): { immediate: string[]; shortTerm: string[]; longTerm: string[] } => {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Sort insights by severity and impact
    const sortedInsights = insights.sort((a, b) => {
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const aWeight = severityWeight[a.severity] * (a.impact.resourceSavings + a.impact.riskReduction);
      const bWeight = severityWeight[b.severity] * (b.impact.resourceSavings + b.impact.riskReduction);
      return bWeight - aWeight;
    });

    sortedInsights.forEach(insight => {
      insight.recommendations.forEach(rec => {
        if (insight.severity === 'critical') {
          immediate.push(rec);
        } else if (insight.severity === 'high') {
          shortTerm.push(rec);
        } else {
          longTerm.push(rec);
        }
      });
    });

    return {
      immediate: [...new Set(immediate)].slice(0, 5), // Top 5 immediate actions
      shortTerm: [...new Set(shortTerm)].slice(0, 10), // Top 10 short-term actions
      longTerm: [...new Set(longTerm)].slice(0, 15), // Top 15 long-term actions
    };
  }, []);

  /**
   * Run complete maintenance analysis
   */
  const runAnalysis = useCallback(async () => {
    setState(prev => ({ ...prev, analyzing: true }));

    try {
      diagnostics.info('Starting maintenance optimizer analysis');

      const resourceMetrics = calculateResourceMetrics(telemetryEvents, optimizerConfig.analysisWindow);
      const efficiencyMetrics = calculateEfficiencyMetrics(telemetryEvents, residents);
      const insights = generateInsights(resourceMetrics, efficiencyMetrics, optimizerConfig);
      const recommendations = generateRecommendations(insights);

      setState({
        insights,
        resourceMetrics,
        efficiencyMetrics,
        trends: state.trends, // Would calculate from historical data
        recommendations,
        lastAnalysis: Date.now(),
        analyzing: false,
      });

      diagnostics.info(`Analysis complete: ${insights.length} insights generated`);
    } catch (error) {
      diagnostics.error('Maintenance analysis failed', error);
      setState(prev => ({ ...prev, analyzing: false }));
    }
  }, [
    telemetryEvents,
    residents,
    optimizerConfig,
    calculateResourceMetrics,
    calculateEfficiencyMetrics,
    generateInsights,
    generateRecommendations,
    state.trends,
    diagnostics,
  ]);

  /**
   * Get insights by category
   */
  const getInsightsByCategory = useCallback((category: MaintenanceCategory) => {
    return state.insights.filter(insight => insight.category === category);
  }, [state.insights]);

  /**
   * Get insights by severity
   */
  const getInsightsBySeverity = useCallback((severity: InsightSeverity) => {
    return state.insights.filter(insight => insight.severity === severity);
  }, [state.insights]);

  /**
   * Get top priority insights
   */
  const getTopInsights = useCallback((limit: number = 10) => {
    return state.insights
      .sort((a, b) => {
        const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const aWeight = severityWeight[a.severity] * (a.impact.resourceSavings + a.impact.riskReduction);
        const bWeight = severityWeight[b.severity] * (b.impact.resourceSavings + b.impact.riskReduction);
        return bWeight - aWeight;
      })
      .slice(0, limit);
  }, [state.insights]);

  // Auto-run analysis when dependencies change
  useEffect(() => {
    if (telemetryEvents.length > 0 && residents.length > 0) {
      runAnalysis();
    }
  }, [telemetryEvents.length, residents.length, runAnalysis]);

  return {
    // State
    state,
    
    // Computed values
    insights: state.insights,
    resourceMetrics: state.resourceMetrics,
    efficiencyMetrics: state.efficiencyMetrics,
    recommendations: state.recommendations,
    
    // Actions
    runAnalysis,
    getInsightsByCategory,
    getInsightsBySeverity,
    getTopInsights,
    
    // Status
    analyzing: state.analyzing,
    lastAnalysis: state.lastAnalysis,
  };
}
