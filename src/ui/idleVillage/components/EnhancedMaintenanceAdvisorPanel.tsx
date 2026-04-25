/**
 * Enhanced Maintenance Advisor Panel
 * 
 * Advanced UI component for displaying maintenance optimization insights
 * with predictive analytics, cost-benefit analysis, and optimization strategies.
 */

import React, { useState, useMemo } from 'react';
import { useAdvancedMaintenanceInsights } from './useAdvancedMaintenanceInsights';
import { useMaintenanceInsights } from './useMaintenanceInsights';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { Resident } from '@/engine/game/idleVillage/types';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/activities';
import type { CrewSchedulerConfig } from './useCrewScheduler';
import type { ActivityTelemetryEvent } from '../utils/activityTelemetry';
import type { AdvancedMaintenanceInsight, OptimizationStrategy } from './useAdvancedMaintenanceInsights';

/**
 * Props for the Enhanced Maintenance Advisor Panel
 */
export interface EnhancedMaintenanceAdvisorPanelProps {
  /** Current village state */
  villageState: VillageState;
  /** Available residents */
  residents: Resident[];
  /** Available activity definitions */
  activities: ActivityDefinition[];
  /** Crew scheduler configuration */
  crewSchedulerConfig: CrewSchedulerConfig;
  /** Telemetry events for analysis */
  telemetryEvents: ActivityTelemetryEvent[];
  /** Whether to show advanced analytics */
  showAdvanced?: boolean;
  /** Maximum number of insights to display */
  maxInsights?: number;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Enhanced Maintenance Advisor Panel with predictive analytics
 */
export const EnhancedMaintenanceAdvisorPanel: React.FC<EnhancedMaintenanceAdvisorPanelProps> = ({
  villageState,
  residents,
  activities,
  crewSchedulerConfig,
  telemetryEvents,
  showAdvanced = true,
  maxInsights = 10,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'strategies' | 'analytics'>('insights');
  const [selectedInsight, setSelectedInsight] = useState<AdvancedMaintenanceInsight | null>(null);

  // Base maintenance insights
  const {
    insights: baseInsights,
    resourceMetrics,
    efficiencyMetrics,
    analyzing,
  } = useMaintenanceInsights(
    residents,
    activities,
    crewSchedulerConfig,
    telemetryEvents
  );

  // Advanced insights with predictive analytics
  const {
    enhancedInsights,
    optimizationStrategies,
    predictiveMetrics,
    getHighestROIInsights,
    getCriticalInsights,
    totalPotentialSavings,
    averageROI,
  } = useAdvancedMaintenanceInsights(
    baseInsights,
    resourceMetrics,
    efficiencyMetrics,
    telemetryEvents,
    residents,
    crewSchedulerConfig
  );

  // Get filtered insights based on active tab
  const displayInsights = useMemo(() => {
    let insights = enhancedInsights;
    
    if (activeTab === 'insights') {
      insights = insights.slice(0, maxInsights);
    } else if (activeTab === 'analytics') {
      insights = getHighestROIInsights(maxInsights);
    }
    
    return insights;
  }, [enhancedInsights, activeTab, maxInsights, getHighestROIInsights]);

  // Priority color mapping
  const getPriorityColor = (severity: string) => {
    const colors = {
      critical: 'text-red-400 bg-red-900/20 border-red-700',
      high: 'text-orange-400 bg-orange-900/20 border-orange-700',
      medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-700',
      low: 'text-green-400 bg-green-900/20 border-green-700',
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  // Timeline color mapping
  const getTimelineColor = (timeline: string) => {
    const colors = {
      immediate: 'text-red-300',
      within_day: 'text-orange-300',
      within_week: 'text-yellow-300',
      within_month: 'text-blue-300',
    };
    return colors[timeline as keyof typeof colors] || colors.within_month;
  };

  if (analyzing) {
    return (
      <div className={`p-6 bg-slate-800 rounded-lg border border-slate-700 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-green-400">Analyzing maintenance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-lg border border-slate-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-xl font-bold text-green-400 mb-2">Maintenance Optimizer</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Potential Savings</p>
            <p className="text-green-400 font-bold">${totalPotentialSavings.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-slate-400">Average ROI</p>
            <p className="text-green-400 font-bold">{averageROI.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-slate-400">Critical Issues</p>
            <p className="text-red-400 font-bold">{getCriticalInsights().length}</p>
          </div>
          <div>
            <p className="text-slate-400">Strategies</p>
            <p className="text-blue-400 font-bold">{optimizationStrategies.length}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'insights'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Insights ({enhancedInsights.length})
        </button>
        <button
          onClick={() => setActiveTab('strategies')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'strategies'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Strategies ({optimizationStrategies.length})
        </button>
        {showAdvanced && (
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'analytics'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Analytics
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {displayInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border ${getPriorityColor(insight.severity)} cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => setSelectedInsight(insight)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white">{insight.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${getTimelineColor(insight.recommendedTimeline)}`}>
                    {insight.recommendedTimeline.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-slate-300 text-sm mb-3">{insight.description}</p>
                
                {showAdvanced && insight.costBenefit && (
                  <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                    <div>
                      <p className="text-slate-400">Cost</p>
                      <p className="text-white font-bold">${insight.costBenefit.totalCost.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">ROI</p>
                      <p className="text-green-400 font-bold">{insight.costBenefit.roi.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Payback</p>
                      <p className="text-blue-400 font-bold">{insight.costBenefit.paybackPeriod.toFixed(1)}d</p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1">
                  {insight.recommendations.slice(0, 3).map((rec, index) => (
                    <span key={index} className="text-xs bg-slate-700 px-2 py-1 rounded">
                      {rec}
                    </span>
                  ))}
                  {insight.recommendations.length > 3 && (
                    <span className="text-xs text-slate-400 px-2 py-1">
                      +{insight.recommendations.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'strategies' && (
          <div className="space-y-4">
            {optimizationStrategies.map((strategy) => (
              <div key={strategy.id} className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                <h3 className="font-semibold text-green-400 mb-2">{strategy.name}</h3>
                <p className="text-slate-300 text-sm mb-3">{strategy.description}</p>
                
                <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                  <div>
                    <p className="text-slate-400">Resource Savings</p>
                    <p className="text-green-400 font-bold">{strategy.expectedOutcomes.resourceSavings}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Efficiency Gain</p>
                    <p className="text-blue-400 font-bold">{strategy.expectedOutcomes.efficiencyGain}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Risk Reduction</p>
                    <p className="text-yellow-400 font-bold">{strategy.expectedOutcomes.riskReduction}%</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-400">
                    Requires: {strategy.requiredResources.crew} crew, {strategy.requiredResources.time} time units
                  </div>
                  <button className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white">
                    Implement
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && showAdvanced && (
          <div className="space-y-6">
            {/* Predictive Metrics */}
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Predictive Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-700 p-3 rounded">
                  <p className="text-slate-400 text-xs">Predicted Food Consumption</p>
                  <p className="text-white font-bold">{predictiveMetrics.predictedConsumption.foodConsumption.toFixed(1)}/hr</p>
                  <p className="text-xs text-slate-500">Confidence: {(predictiveMetrics.confidence * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-slate-700 p-3 rounded">
                  <p className="text-slate-400 text-xs">Failure Probability</p>
                  <p className="text-orange-400 font-bold">{(predictiveMetrics.failureProbability.equipment * 100).toFixed(1)}%</p>
                  <p className="text-xs text-slate-500">Equipment risk</p>
                </div>
                <div className="bg-slate-700 p-3 rounded">
                  <p className="text-slate-400 text-xs">Predicted Backlog</p>
                  <p className="text-yellow-400 font-bold">{predictiveMetrics.predictedBacklog.toFixed(0)} tasks</p>
                  <p className="text-xs text-slate-500">Next period</p>
                </div>
              </div>
            </div>

            {/* Top ROI Insights */}
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Highest ROI Opportunities</h3>
              <div className="space-y-2">
                {getHighestROIInsights(5).map((insight, index) => (
                  <div key={insight.id} className="flex justify-between items-center bg-slate-700 p-3 rounded">
                    <div>
                      <p className="text-white font-medium">{insight.title}</p>
                      <p className="text-slate-400 text-xs">{insight.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">{insight.costBenefit?.roi.toFixed(1)}%</p>
                      <p className="text-slate-400 text-xs">ROI</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{selectedInsight.title}</h3>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-slate-300 mb-4">{selectedInsight.description}</p>
              
              {selectedInsight.costBenefit && (
                <div className="bg-slate-700 p-4 rounded mb-4">
                  <h4 className="font-semibold text-green-400 mb-2">Cost-Benefit Analysis</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Total Cost</p>
                      <p className="text-white font-bold">${selectedInsight.costBenefit.totalCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Expected Benefit</p>
                      <p className="text-green-400 font-bold">${selectedInsight.costBenefit.expectedBenefit.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">ROI</p>
                      <p className="text-green-400 font-bold">{selectedInsight.costBenefit.roi.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Payback Period</p>
                      <p className="text-blue-400 font-bold">{selectedInsight.costBenefit.paybackPeriod.toFixed(1)} days</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-slate-700 p-4 rounded mb-4">
                <h4 className="font-semibold text-green-400 mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {selectedInsight.recommendations.map((rec, index) => (
                    <li key={index} className="text-slate-300 text-sm">• {rec}</li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded text-white"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white">
                  Implement Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
