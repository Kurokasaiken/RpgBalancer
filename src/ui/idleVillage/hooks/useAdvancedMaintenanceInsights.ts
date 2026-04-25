/**
 * Advanced Maintenance Insights Enhancement
 * 
 * Extends the existing maintenance optimizer with predictive analytics,
 * cost-benefit analysis, and advanced optimization recommendations.
 */

import { useCallback, useMemo } from 'react';
import type { 
  MaintenanceInsight, 
  ResourceMetrics, 
  EfficiencyMetrics,
  MaintenanceOptimizerConfig 
} from './useMaintenanceInsights';
import type { ActivityTelemetryEvent } from '../utils/activityTelemetry';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * Predictive maintenance metrics
 */
export interface PredictiveMetrics {
  /** Predicted resource consumption for next period */
  predictedConsumption: ResourceMetrics;
  /** Predicted failure probability for equipment */
  failureProbability: Record<string, number>;
  /** Predicted maintenance backlog */
  predictedBacklog: number;
  /** Predicted crew utilization */
  predictedUtilization: number;
  /** Confidence score for predictions (0-1) */
  confidence: number;
}

/**
 * Cost-benefit analysis for maintenance actions
 */
export interface CostBenefitAnalysis {
  /** Total cost of proposed action */
  totalCost: number;
  /** Expected benefit (resource savings + risk reduction) */
  expectedBenefit: number;
  /** Return on investment percentage */
  roi: number;
  /** Payback period in time units */
  paybackPeriod: number;
  /** Risk level of not taking action */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Advanced maintenance insight with predictive analytics
 */
export interface AdvancedMaintenanceInsight extends MaintenanceInsight {
  /** Predictive metrics for this insight */
  predictiveMetrics?: PredictiveMetrics;
  /** Cost-benefit analysis */
  costBenefit?: CostBenefitAnalysis;
  /** Recommended action timeline */
  recommendedTimeline: 'immediate' | 'within_day' | 'within_week' | 'within_month';
  /** Dependencies on other actions */
  dependencies?: string[];
  /** Impact on other maintenance areas */
  crossImpact?: {
    area: string;
    impact: 'positive' | 'negative' | 'neutral';
    magnitude: number;
  }[];
}

/**
 * Optimization strategy recommendations
 */
export interface OptimizationStrategy {
  /** Strategy identifier */
  id: string;
  /** Strategy name */
  name: string;
  /** Strategy description */
  description: string;
  /** Expected outcomes */
  expectedOutcomes: {
    resourceSavings: number;
    efficiencyGain: number;
    riskReduction: number;
  };
  /** Required resources */
  requiredResources: {
    time: number;
    materials: number;
    crew: number;
  };
  /** Implementation steps */
  implementationSteps: string[];
  /** Success metrics */
  successMetrics: string[];
}

/**
 * Hook for advanced maintenance insights and optimization
 */
export function useAdvancedMaintenanceInsights(
  baseInsights: MaintenanceInsight[],
  resourceMetrics: ResourceMetrics,
  efficiencyMetrics: EfficiencyMetrics,
  telemetryEvents: ActivityTelemetryEvent[],
  residents: ResidentState[],
  config: MaintenanceOptimizerConfig
) {
  /**
   * Calculate predictive metrics using historical trends
   */
  const calculatePredictiveMetrics = useCallback((
    events: ActivityTelemetryEvent[],
    window: number
  ): PredictiveMetrics => {
    // Get historical data for trend analysis
    const historicalWindow = window * 2; // Look back twice the analysis window
    const historicalEvents = events.filter(
      event => Date.now() - event.timestamp < historicalWindow
    );

    // Calculate trends for each resource category
    const trends = {
      food: calculateTrend(historicalEvents.filter(e => 
        e.activityType === 'food_preparation' || e.activityType === 'food_distribution'
      )),
      medical: calculateTrend(historicalEvents.filter(e => 
        e.activityType === 'injury_treatment' || e.activityType === 'medical_care'
      )),
      repair: calculateTrend(historicalEvents.filter(e => 
        e.activityType === 'repair' || e.activityType === 'maintenance'
      )),
      cleaning: calculateTrend(historicalEvents.filter(e => 
        e.activityType === 'cleaning' || e.activityType === 'sanitation'
      )),
      security: calculateTrend(historicalEvents.filter(e => 
        e.activityType === 'security' || e.activityType === 'patrol'
      )),
    };

    // Predict future consumption based on trends
    const predictedConsumption: ResourceMetrics = {
      foodConsumption: Math.max(0, resourceMetrics.foodConsumption * (1 + trends.food)),
      medicalConsumption: Math.max(0, resourceMetrics.medicalConsumption * (1 + trends.medical)),
      repairConsumption: Math.max(0, resourceMetrics.repairConsumption * (1 + trends.repair)),
      cleaningConsumption: Math.max(0, resourceMetrics.cleaningConsumption * (1 + trends.cleaning)),
      securityConsumption: Math.max(0, resourceMetrics.securityConsumption * (1 + trends.security)),
    };

    // Calculate failure probabilities based on age and usage
    const failureProbability = calculateFailureProbability(events, residents);

    // Predict maintenance backlog
    const predictedBacklog = predictBacklog(events, trends);

    // Predict crew utilization
    const predictedUtilization = predictCrewUtilization(residents, trends);

    // Calculate confidence based on data quality and quantity
    const confidence = calculatePredictionConfidence(historicalEvents, window);

    return {
      predictedConsumption,
      failureProbability,
      predictedBacklog,
      predictedUtilization,
      confidence,
    };
  }, [resourceMetrics, telemetryEvents, residents]);

  /**
   * Perform cost-benefit analysis for maintenance actions
   */
  const performCostBenefitAnalysis = useCallback((
    insight: MaintenanceInsight,
    predictiveMetrics: PredictiveMetrics
  ): CostBenefitAnalysis => {
    // Calculate implementation cost
    const totalCost = calculateImplementationCost(insight, residents);

    // Calculate expected benefits
    const resourceSavings = insight.impact.resourceSavings;
    const riskReduction = insight.impact.riskReduction;
    const expectedBenefit = resourceSavings + riskReduction;

    // Calculate ROI
    const roi = totalCost > 0 ? ((expectedBenefit - totalCost) / totalCost) * 100 : 0;

    // Calculate payback period
    const paybackPeriod = totalCost > 0 ? totalCost / (expectedBenefit / 30) : 0; // 30 time units per period

    // Assess risk level
    const riskLevel = assessRiskLevel(insight, predictiveMetrics);

    return {
      totalCost,
      expectedBenefit,
      roi,
      paybackPeriod,
      riskLevel,
    };
  }, [residents]);

  /**
   * Generate optimization strategies
   */
  const generateOptimizationStrategies = useCallback((
    insights: AdvancedMaintenanceInsight[]
  ): OptimizationStrategy[] => {
    const strategies: OptimizationStrategy[] = [];

    // Resource optimization strategy
    if (insights.some(i => i.category === 'food' && i.severity === 'high')) {
      strategies.push({
        id: 'food-optimization',
        name: 'Food Production Optimization',
        description: 'Optimize food production and distribution to reduce waste and improve efficiency',
        expectedOutcomes: {
          resourceSavings: 25,
          efficiencyGain: 30,
          riskReduction: 15,
        },
        requiredResources: {
          time: 20,
          materials: 50,
          crew: 2,
        },
        implementationSteps: [
          'Analyze current food production patterns',
          'Identify bottlenecks and inefficiencies',
          'Implement batch production methods',
          'Optimize distribution schedules',
          'Monitor and adjust based on results',
        ],
        successMetrics: [
          'Food consumption reduced by 20%',
          'Production efficiency increased by 30%',
          'Waste reduced by 40%',
        ],
      });
    }

    // Preventive maintenance strategy
    if (insights.some(i => i.category === 'repair' && i.severity === 'critical')) {
      strategies.push({
        id: 'preventive-maintenance',
        name: 'Preventive Maintenance Program',
        description: 'Implement preventive maintenance to reduce emergency repairs and downtime',
        expectedOutcomes: {
          resourceSavings: 35,
          efficiencyGain: 40,
          riskReduction: 50,
        },
        requiredResources: {
          time: 40,
          materials: 100,
          crew: 3,
        },
        implementationSteps: [
          'Create equipment maintenance schedule',
          'Train crew on preventive procedures',
          'Implement monitoring systems',
          'Establish maintenance protocols',
          'Review and optimize schedules regularly',
        ],
        successMetrics: [
          'Emergency repairs reduced by 60%',
          'Equipment uptime increased by 25%',
          'Maintenance costs reduced by 30%',
        ],
      });
    }

    // Crew optimization strategy
    if (insights.some(i => i.category === 'cleaning' && i.severity === 'medium')) {
      strategies.push({
        id: 'crew-optimization',
        name: 'Crew Workload Optimization',
        description: 'Optimize crew assignments and workload distribution to improve satisfaction and efficiency',
        expectedOutcomes: {
          resourceSavings: 15,
          efficiencyGain: 25,
          riskReduction: 20,
        },
        requiredResources: {
          time: 15,
          materials: 20,
          crew: 1,
        },
        implementationSteps: [
          'Analyze current workload distribution',
          'Identify overworked and underutilized crew members',
          'Implement balanced assignment system',
          'Add regular rest periods',
          'Monitor crew satisfaction metrics',
        ],
        successMetrics: [
          'Crew satisfaction increased by 30%',
          'Workload balance improved by 40%',
          'Efficiency increased by 20%',
        ],
      });
    }

    return strategies;
  }, []);

  /**
   * Enhance insights with predictive analytics and cost-benefit analysis
   */
  const enhancedInsights = useMemo(() => {
    const predictiveMetrics = calculatePredictiveMetrics(telemetryEvents, config.analysisWindow);
    
    return baseInsights.map(insight => {
      const costBenefit = performCostBenefitAnalysis(insight, predictiveMetrics);
      const recommendedTimeline = determineTimeline(insight, costBenefit);
      const dependencies = identifyDependencies(insight, baseInsights);
      const crossImpact = analyzeCrossImpact(insight, baseInsights);

      return {
        ...insight,
        predictiveMetrics,
        costBenefit,
        recommendedTimeline,
        dependencies,
        crossImpact,
      } as AdvancedMaintenanceInsight;
    });
  }, [baseInsights, telemetryEvents, config, calculatePredictiveMetrics, performCostBenefitAnalysis]);

  /**
   * Get prioritized optimization strategies
   */
  const optimizationStrategies = useMemo(() => {
    return generateOptimizationStrategies(enhancedInsights);
  }, [enhancedInsights, generateOptimizationStrategies]);

  /**
   * Get insights with highest ROI
   */
  const getHighestROIInsights = useCallback((limit: number = 5) => {
    return enhancedInsights
      .filter(insight => insight.costBenefit && insight.costBenefit.roi > 0)
      .sort((a, b) => (b.costBenefit?.roi || 0) - (a.costBenefit?.roi || 0))
      .slice(0, limit);
  }, [enhancedInsights]);

  /**
   * Get critical insights requiring immediate attention
   */
  const getCriticalInsights = useCallback(() => {
    return enhancedInsights.filter(insight => 
      insight.severity === 'critical' || 
      (insight.costBenefit && insight.costBenefit.riskLevel === 'critical')
    );
  }, [enhancedInsights]);

  return {
    // Enhanced insights
    enhancedInsights,
    optimizationStrategies,
    
    // Analytics
    predictiveMetrics: calculatePredictiveMetrics(telemetryEvents, config.analysisWindow),
    
    // Utility functions
    getHighestROIInsights,
    getCriticalInsights,
    
    // Metrics
    totalPotentialSavings: enhancedInsights.reduce((sum, insight) => 
      sum + (insight.costBenefit?.expectedBenefit || 0), 0
    ),
    averageROI: enhancedInsights.length > 0 
      ? enhancedInsights.reduce((sum, insight) => sum + (insight.costBenefit?.roi || 0), 0) / enhancedInsights.length
      : 0,
  };
}

// Helper functions (would be implemented with actual logic)

function calculateTrend(events: ActivityTelemetryEvent[]): number {
  // Simple linear trend calculation
  if (events.length < 2) return 0;
  
  const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);
  const halfPoint = Math.floor(sortedEvents.length / 2);
  
  const firstHalf = sortedEvents.slice(0, halfPoint);
  const secondHalf = sortedEvents.slice(halfPoint);
  
  const firstAvg = firstHalf.reduce((sum, e) => sum + (e.resourceCost || 1), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, e) => sum + (e.resourceCost || 1), 0) / secondHalf.length;
  
  return (secondAvg - firstAvg) / firstAvg;
}

function calculateFailureProbability(events: ActivityTelemetryEvent[], residents: ResidentState[]): Record<string, number> {
  // Simplified failure probability calculation
  const failureEvents = events.filter(e => e.status === 'failed');
  const totalEvents = events.length;
  
  return {
    equipment: totalEvents > 0 ? failureEvents.length / totalEvents : 0.1,
    crew: residents.reduce((sum, r) => sum + (r.fatigue > 0.8 ? 1 : 0), 0) / residents.length,
    facilities: 0.05, // Base facility failure rate
  };
}

function predictBacklog(events: ActivityTelemetryEvent[], trends: Record<string, number>): number {
  const currentBacklog = events.filter(e => e.status === 'pending').length;
  const trendFactor = Object.values(trends).reduce((sum, trend) => sum + Math.abs(trend), 0) / Object.keys(trends).length;
  return Math.max(0, currentBacklog * (1 + trendFactor));
}

function predictCrewUtilization(residents: ResidentState[], trends: Record<string, number>): number {
  const currentUtilization = residents.filter(r => r.currentActivity).length / residents.length;
  const trendFactor = Object.values(trends).reduce((sum, trend) => sum + trend, 0) / Object.keys(trends).length;
  return Math.max(0, Math.min(1, currentUtilization * (1 + trendFactor)));
}

function calculatePredictionConfidence(events: ActivityTelemetryEvent[], window: number): number {
  const dataPoints = events.length;
  const minDataPoints = 10;
  
  if (dataPoints < minDataPoints) return 0.3;
  if (dataPoints < minDataPoints * 2) return 0.6;
  if (dataPoints < minDataPoints * 5) return 0.8;
  return 0.9;
}

function calculateImplementationCost(insight: MaintenanceInsight, residents: ResidentState[]): number {
  // Simplified cost calculation based on insight severity and crew size
  const severityMultiplier = { critical: 2, high: 1.5, medium: 1, low: 0.5 };
  const baseCost = 50;
  const crewCost = residents.length * 10;
  
  return baseCost * (severityMultiplier[insight.severity] || 1) + crewCost;
}

function assessRiskLevel(insight: MaintenanceInsight, predictiveMetrics: PredictiveMetrics): 'low' | 'medium' | 'high' | 'critical' {
  if (insight.severity === 'critical') return 'critical';
  if (predictiveMetrics.confidence < 0.5) return 'high';
  if (insight.severity === 'high') return 'high';
  if (insight.severity === 'medium') return 'medium';
  return 'low';
}

function determineTimeline(insight: MaintenanceInsight, costBenefit: CostBenefitAnalysis): 'immediate' | 'within_day' | 'within_week' | 'within_month' {
  if (insight.severity === 'critical' || costBenefit.riskLevel === 'critical') return 'immediate';
  if (insight.severity === 'high' || costBenefit.paybackPeriod < 1) return 'within_day';
  if (costBenefit.paybackPeriod < 7) return 'within_week';
  return 'within_month';
}

function identifyDependencies(insight: MaintenanceInsight, allInsights: MaintenanceInsight[]): string[] {
  // Simplified dependency identification
  return allInsights
    .filter(other => other.id !== insight.id && other.category === insight.category)
    .map(other => other.id);
}

function analyzeCrossImpact(insight: MaintenanceInsight, allInsights: MaintenanceInsight[]) {
  // Simplified cross-impact analysis
  return [
    {
      area: 'overall_efficiency',
      impact: insight.impact.resourceSavings > 15 ? 'positive' : 'neutral',
      magnitude: Math.abs(insight.impact.resourceSavings) / 100,
    },
  ];
}
