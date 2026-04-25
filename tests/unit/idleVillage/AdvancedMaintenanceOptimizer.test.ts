/**
 * Enhanced Maintenance Optimizer Test Suite
 * 
 * Comprehensive tests for advanced maintenance insights including
 * predictive analytics, cost-benefit analysis, and optimization strategies.
 */

import { renderHook, act } from '@testing-library/react';
import { useAdvancedMaintenanceInsights } from '@/ui/idleVillage/hooks/useAdvancedMaintenanceInsights';
import { useMaintenanceInsights } from '@/ui/idleVillage/hooks/useMaintenanceInsights';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { CrewSchedulerConfig } from '@/ui/idleVillage/hooks/useCrewScheduler';
import type { ActivityTelemetryEvent } from '@/ui/idleVillage/utils/activityTelemetry';

// Mock dependencies
jest.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

// Test data fixtures
const mockResidents: ResidentState[] = [
  {
    id: 'resident-1',
    name: 'Test Resident 1',
    stats: { strength: 10, agility: 8, intelligence: 6 },
    fatigue: 0.3,
    currentActivity: 'food_preparation',
    location: 'kitchen',
  },
  {
    id: 'resident-2',
    name: 'Test Resident 2',
    stats: { strength: 7, agility: 9, intelligence: 8 },
    fatigue: 0.6,
    currentActivity: 'repair',
    location: 'workshop',
  },
  {
    id: 'resident-3',
    name: 'Test Resident 3',
    stats: { strength: 5, agility: 6, intelligence: 9 },
    fatigue: 0.8,
    currentActivity: null,
    location: 'rest_area',
  },
] as ResidentState[];

const mockActivities: ActivityDefinition[] = [
  {
    id: 'food_preparation',
    name: 'Food Preparation',
    type: 'maintenance',
    duration: 30,
    resourceCost: 2,
    requirements: { strength: 5 },
    outputs: { food: 10 },
  },
  {
    id: 'repair',
    name: 'Equipment Repair',
    type: 'maintenance',
    duration: 45,
    resourceCost: 4,
    requirements: { intelligence: 6 },
    outputs: { equipment_health: 20 },
  },
  {
    id: 'cleaning',
    name: 'Facility Cleaning',
    type: 'maintenance',
    duration: 20,
    resourceCost: 1,
    requirements: { agility: 4 },
    outputs: { cleanliness: 15 },
  },
] as ActivityDefinition[];

const mockCrewSchedulerConfig: CrewSchedulerConfig = {
  maxConcurrentActivities: 3,
  priorityWeights: {
    efficiency: 0.4,
    satisfaction: 0.3,
    risk: 0.3,
  },
  restPeriods: {
    minRestTime: 60,
    maxWorkTime: 240,
  },
};

const mockTelemetryEvents: ActivityTelemetryEvent[] = [
  {
    id: 'event-1',
    activityId: 'food_preparation',
    activityType: 'food_preparation',
    residentId: 'resident-1',
    timestamp: Date.now() - 1000 * 60 * 30,
    status: 'completed',
    duration: 30000,
    resourceCost: 2,
  },
  {
    id: 'event-2',
    activityId: 'repair',
    activityType: 'repair',
    residentId: 'resident-2',
    timestamp: Date.now() - 1000 * 60 * 15,
    status: 'failed',
    duration: 60000,
    resourceCost: 4,
  },
  {
    id: 'event-3',
    activityId: 'cleaning',
    activityType: 'cleaning',
    residentId: 'resident-3',
    timestamp: Date.now() - 1000 * 60 * 5,
    status: 'completed',
    duration: 20000,
    resourceCost: 1,
  },
];

describe('useAdvancedMaintenanceInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Predictive Analytics', () => {
    it('should calculate predictive metrics from historical data', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents
        )
      );

      const { result: advancedResult } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          result.current.insights,
          result.current.resourceMetrics,
          result.current.efficiencyMetrics,
          mockTelemetryEvents,
          mockResidents,
          result.current.state
        )
      );

      expect(advancedResult.current.predictiveMetrics).toBeDefined();
      expect(advancedResult.current.predictiveMetrics.confidence).toBeGreaterThan(0);
      expect(advancedResult.current.predictiveMetrics.predictedConsumption).toBeDefined();
      expect(advancedResult.current.predictiveMetrics.failureProbability).toBeDefined();
    });

    it('should handle empty telemetry data gracefully', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          []
        )
      );

      const { result: advancedResult } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          result.current.insights,
          result.current.resourceMetrics,
          result.current.efficiencyMetrics,
          [],
          mockResidents,
          result.current.state
        )
      );

      expect(advancedResult.current.predictiveMetrics.confidence).toBeLessThan(0.5);
    });
  });

  describe('Cost-Benefit Analysis', () => {
    it('should perform cost-benefit analysis for insights', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents
        )
      );

      const { result: advancedResult } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          result.current.insights,
          result.current.resourceMetrics,
          result.current.efficiencyMetrics,
          mockTelemetryEvents,
          mockResidents,
          result.current.state
        )
      );

      const enhancedInsights = advancedResult.current.enhancedInsights;
      expect(enhancedInsights.length).toBeGreaterThan(0);
      
      const insightWithCostBenefit = enhancedInsights.find(i => i.costBenefit);
      if (insightWithCostBenefit) {
        expect(insightWithCostBenefit.costBenefit.totalCost).toBeGreaterThan(0);
        expect(insightWithCostBenefit.costBenefit.roi).toBeDefined();
        expect(insightWithCostBenefit.costBenefit.paybackPeriod).toBeGreaterThan(0);
        expect(['low', 'medium', 'high', 'critical']).toContain(insightWithCostBenefit.costBenefit.riskLevel);
      }
    });

    it('should calculate ROI correctly', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents
        )
      );

      const { result: advancedResult } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          result.current.insights,
          result.current.resourceMetrics,
          result.current.efficiencyMetrics,
          mockTelemetryEvents,
          mockResidents,
          result.current.state
        )
      );

      const totalSavings = advancedResult.current.totalPotentialSavings;
      const averageROI = advancedResult.current.averageROI;
      
      expect(totalSavings).toBeGreaterThanOrEqual(0);
      expect(averageROI).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Enhanced Insights', () => {
    it('should enhance base insights with predictive analytics', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents
        )
      );

      const { result: advancedResult } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          result.current.insights,
          result.current.resourceMetrics,
          result.current.efficiencyMetrics,
          mockTelemetryEvents,
          mockResidents,
          result.current.state
        )
      );

      const enhancedInsights = advancedResult.current.enhancedInsights;
      const baseInsights = result.current.insights;
      
      expect(enhancedInsights.length).toBe(baseInsights.length);
      
      enhancedInsights.forEach(insight => {
        expect(insight.predictiveMetrics).toBeDefined();
        expect(insight.costBenefit).toBeDefined();
        expect(insight.recommendedTimeline).toBeDefined();
        expect(['immediate', 'within_day', 'within_week', 'within_month']).toContain(insight.recommendedTimeline);
      });
    });

    it('should add cross-impact analysis to insights', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents
        )
      );

      const { result: advancedResult } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          result.current.insights,
          result.current.resourceMetrics,
          result.current.efficiencyMetrics,
          mockTelemetryEvents,
          mockResidents,
          result.current.state
        )
      );

      const enhancedInsights = advancedResult.current.enhancedInsights;
      enhancedInsights.forEach(insight => {
        expect(insight.crossImpact).toBeDefined();
        expect(Array.isArray(insight.crossImpact)).toBe(true);
        if (insight.crossImpact.length > 0) {
          expect(insight.crossImpact[0]).toHave('area');
          expect(insight.crossImpact[0]).toHave('impact');
          expect(insight.crossImpact[0]).toHave('magnitude');
        }
      });
    });
  });

  describe('Optimization Strategies', () => {
    it('should generate optimization strategies based on insights', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents
        )
      );

      const { result: advancedResult } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          result.current.insights,
          result.current.resourceMetrics,
          result.current.efficiencyMetrics,
          mockTelemetryEvents,
          mockResidents,
          result.current.state
        )
      );

      const strategies = advancedResult.current.optimizationStrategies;
      expect(Array.isArray(strategies)).toBe(true);
      
      if (strategies.length > 0) {
        strategies.forEach(strategy => {
          expect(strategy.id).toBeDefined();
          expect(strategy.name).toBeDefined();
          expect(strategy.description).toBeDefined();
          expect(strategy.expectedOutcomes).toBeDefined();
          expect(strategy.requiredResources).toBeDefined();
          expect(strategy.implementationSteps).toBeDefined();
          expect(strategy.successMetrics).toBeDefined();
          
          expect(strategy.expectedOutcomes.resourceSavings).toBeGreaterThanOrEqual(0);
          expect(strategy.expectedOutcomes.efficiencyGain).toBeGreaterThanOrEqual(0);
          expect(strategy.expectedOutcomes.riskReduction).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it('should generate food optimization strategy when food insights are high severity', () => {
      // Create mock insights with high severity food issues
      const mockFoodInsights = [
        {
          id: 'food-insight-1',
          category: 'food' as const,
          severity: 'high' as const,
          title: 'High Food Consumption',
          description: 'Food consumption is above target',
          impact: { resourceSavings: 20, timeSavings: 10, riskReduction: 5 },
          recommendations: ['Optimize food schedules'],
          data: { current: 1.5, target: 1.0, trend: 'stable', confidence: 0.8 },
          timestamp: Date.now(),
        },
      ];

      const { result } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          mockFoodInsights,
          { foodConsumption: 1.5, medicalConsumption: 1.0, repairConsumption: 1.0, cleaningConsumption: 1.0, securityConsumption: 1.0 },
          { actionsPerHour: 8, resourceUtilization: 0.7, satisfactionImpact: 0.6, errorRate: 0.1, averageActionTime: 30000 },
          mockTelemetryEvents,
          mockResidents,
          { analysisWindow: 100, confidenceThreshold: 0.7, efficiencyTargets: { food: 0.85, medical: 0.9, repair: 0.8, cleaning: 0.75, security: 0.95 }, priorityWeights: { resourceEfficiency: 0.3, timeEfficiency: 0.25, riskReduction: 0.3, crewSatisfaction: 0.15 } }
        )
      );

      const strategies = result.current.optimizationStrategies;
      const foodStrategy = strategies.find(s => s.id === 'food-optimization');
      
      expect(foodStrategy).toBeDefined();
      if (foodStrategy) {
        expect(foodStrategy.name).toBe('Food Production Optimization');
        expect(foodStrategy.expectedOutcomes.resourceSavings).toBe(25);
      }
    });
  });

  describe('Utility Functions', () => {
    it('should get highest ROI insights correctly', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents
        )
      );

      const { result: advancedResult } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          result.current.insights,
          result.current.resourceMetrics,
          result.current.efficiencyMetrics,
          mockTelemetryEvents,
          mockResidents,
          result.current.state
        )
      );

      const highestROI = advancedResult.current.getHighestROIInsights(3);
      expect(Array.isArray(highestROI)).toBe(true);
      expect(highestROI.length).toBeLessThanOrEqual(3);
      
      // Should be sorted by ROI (highest first)
      if (highestROI.length > 1) {
        for (let i = 0; i < highestROI.length - 1; i++) {
          const currentROI = highestROI[i].costBenefit?.roi || 0;
          const nextROI = highestROI[i + 1].costBenefit?.roi || 0;
          expect(currentROI).toBeGreaterThanOrEqual(nextROI);
        }
      }
    });

    it('should get critical insights correctly', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents
        )
      );

      const { result: advancedResult } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          result.current.insights,
          result.current.resourceMetrics,
          result.current.efficiencyMetrics,
          mockTelemetryEvents,
          mockResidents,
          result.current.state
        )
      );

      const criticalInsights = advancedResult.current.getCriticalInsights();
      expect(Array.isArray(criticalInsights)).toBe(true);
      
      criticalInsights.forEach(insight => {
        expect(['critical', 'high', 'medium', 'low']).toContain(insight.severity);
        const isCriticalBySeverity = insight.severity === 'critical';
        const isCriticalByRisk = insight.costBenefit?.riskLevel === 'critical';
        expect(isCriticalBySeverity || isCriticalByRisk).toBe(true);
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large numbers of telemetry events efficiently', () => {
      // Create a large number of events
      const largeEvents: ActivityTelemetryEvent[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `event-${i}`,
        activityId: 'food_preparation',
        activityType: 'food_preparation',
        residentId: 'resident-1',
        timestamp: Date.now() - (i * 1000 * 60),
        status: i % 10 === 0 ? 'failed' : 'completed',
        duration: 30000,
        resourceCost: 2,
      }));

      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          largeEvents
        )
      );

      const { result: advancedResult } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          result.current.insights,
          result.current.resourceMetrics,
          result.current.efficiencyMetrics,
          largeEvents,
          mockResidents,
          result.current.state
        )
      );

      expect(advancedResult.current.predictiveMetrics.confidence).toBeGreaterThan(0.8);
      expect(advancedResult.current.enhancedInsights.length).toBeGreaterThan(0);
    });

    it('should handle zero residents gracefully', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          [],
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents
        )
      );

      const { result: advancedResult } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          result.current.insights,
          result.current.resourceMetrics,
          result.current.efficiencyMetrics,
          mockTelemetryEvents,
          [],
          result.current.state
        )
      );

      expect(advancedResult.current.predictiveMetrics.predictedUtilization).toBe(0);
      expect(advancedResult.current.totalPotentialSavings).toBeGreaterThanOrEqual(0);
    });

    it('should handle failed events in predictive calculations', () => {
      const eventsWithFailures: ActivityTelemetryEvent[] = [
        ...mockTelemetryEvents,
        ...Array.from({ length: 50 }, (_, i) => ({
          id: `failed-event-${i}`,
          activityId: 'repair',
          activityType: 'repair',
          residentId: 'resident-2',
          timestamp: Date.now() - (i * 1000 * 60 * 10),
          status: 'failed' as const,
          duration: 60000,
          resourceCost: 4,
        })),
      ];

      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          eventsWithFailures
        )
      );

      const { result: advancedResult } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          result.current.insights,
          result.current.resourceMetrics,
          result.current.efficiencyMetrics,
          eventsWithFailures,
          mockResidents,
          result.current.state
        )
      );

      expect(advancedResult.current.predictiveMetrics.failureProbability.equipment).toBeGreaterThan(0.1);
    });
  });

  describe('Integration with Base Hook', () => {
    it('should work seamlessly with useMaintenanceInsights output', () => {
      const { result: baseResult } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents
        )
      );

      const { result: advancedResult } = renderHook(() =>
        useAdvancedMaintenanceInsights(
          baseResult.current.insights,
          baseResult.current.resourceMetrics,
          baseResult.current.efficiencyMetrics,
          mockTelemetryEvents,
          mockResidents,
          baseResult.current.state
        )
      );

      // Verify that the advanced hook can process the base hook output
      expect(advancedResult.current.enhancedInsights).toBeDefined();
      expect(advancedResult.current.enhancedInsights.length).toBe(baseResult.current.insights.length);
      
      // Verify that all enhanced insights have the additional properties
      advancedResult.current.enhancedInsights.forEach(insight => {
        expect(insight.predictiveMetrics).toBeDefined();
        expect(insight.costBenefit).toBeDefined();
        expect(insight.recommendedTimeline).toBeDefined();
      });
    });
  });
});
