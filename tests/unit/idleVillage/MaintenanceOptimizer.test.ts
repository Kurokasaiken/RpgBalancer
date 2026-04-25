/**
 * Maintenance Optimizer Test Suite
 * 
 * Tests for the useMaintenanceInsights hook including resource metrics,
 * efficiency calculations, insight generation, and recommendation prioritization.
 */

import { renderHook, act } from '@testing-library/react';
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
    category: 'food',
    duration: 30,
    resourceCost: 2,
    requirements: { strength: 5 },
  },
  {
    id: 'injury_treatment',
    name: 'Injury Treatment',
    type: 'maintenance',
    category: 'injury',
    duration: 45,
    resourceCost: 3,
    requirements: { intelligence: 6 },
  },
  {
    id: 'repair',
    name: 'Equipment Repair',
    type: 'maintenance',
    category: 'repair',
    duration: 60,
    resourceCost: 4,
    requirements: { strength: 7, agility: 5 },
  },
] as ActivityDefinition[];

const mockCrewSchedulerConfig: CrewSchedulerConfig = {
  priorityWeights: {
    statTagMatch: 0.3,
    fatiguePenalty: 0.2,
    questUrgency: 0.25,
    specializationBonus: 0.15,
    difficultyBonus: 0.1,
    baseWeight: 1.0,
  },
  thresholds: {
    fatiguePenaltyThreshold: 0.5,
    questUrgencyThreshold: 10,
    statTagMatchThreshold: 0.7,
  },
  seeding: {
    lcgSeed: 12345,
    deterministic: true,
  },
};

const mockTelemetryEvents: ActivityTelemetryEvent[] = [
  {
    id: 'event-1',
    activityId: 'food_preparation',
    activityType: 'food_preparation',
    residentId: 'resident-1',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    status: 'completed',
    duration: 30000,
    resourceCost: 2,
  },
  {
    id: 'event-2',
    activityId: 'injury_treatment',
    activityType: 'injury_treatment',
    residentId: 'resident-2',
    timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
    status: 'completed',
    duration: 45000,
    resourceCost: 3,
  },
  {
    id: 'event-3',
    activityId: 'repair',
    activityType: 'repair',
    residentId: 'resident-2',
    timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    status: 'failed',
    duration: 60000,
    resourceCost: 4,
  },
];

describe('useMaintenanceInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          [],
          {}
        )
      );

      expect(result.current.state.insights).toEqual([]);
      expect(result.current.state.analyzing).toBe(false);
      expect(result.current.state.lastAnalysis).toBe(0);
    });

    it('should provide access to computed values', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          {}
        )
      );

      expect(result.current.insights).toBeDefined();
      expect(result.current.resourceMetrics).toBeDefined();
      expect(result.current.efficiencyMetrics).toBeDefined();
      expect(result.current.recommendations).toBeDefined();
    });

    it('should provide action functions', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          [],
          {}
        )
      );

      expect(typeof result.current.runAnalysis).toBe('function');
      expect(typeof result.current.getInsightsByCategory).toBe('function');
      expect(typeof result.current.getInsightsBySeverity).toBe('function');
      expect(typeof result.current.getTopInsights).toBe('function');
    });
  });

  describe('Resource Metrics Calculation', () => {
    it('should calculate resource consumption correctly', async () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          { analysisWindow: 1000 * 60 * 60 } // 1 hour
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.resourceMetrics.foodConsumption).toBeGreaterThan(0);
      expect(result.current.resourceMetrics.medicalConsumption).toBeGreaterThan(0);
      expect(result.current.resourceMetrics.repairConsumption).toBeGreaterThan(0);
    });

    it('should handle empty telemetry events', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          [],
          {}
        )
      );

      expect(result.current.resourceMetrics.foodConsumption).toBe(0);
      expect(result.current.resourceMetrics.medicalConsumption).toBe(0);
      expect(result.current.resourceMetrics.repairConsumption).toBe(0);
    });

    it('should normalize metrics per analysis window', async () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          { analysisWindow: 1000 * 60 * 30 } // 30 minutes
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const shortWindow = result.current.resourceMetrics.foodConsumption;

      // Re-render with longer window
      const { result: result2 } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          { analysisWindow: 1000 * 60 * 60 } // 1 hour
        )
      );

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const longWindow = result2.current.resourceMetrics.foodConsumption;

      // Longer window should have lower per-hour rate
      expect(longWindow).toBeLessThanOrEqual(shortWindow);
    });
  });

  describe('Efficiency Metrics Calculation', () => {
    it('should calculate efficiency metrics correctly', async () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          {}
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.efficiencyMetrics.actionsPerHour).toBeGreaterThanOrEqual(0);
      expect(result.current.efficiencyMetrics.resourceUtilization).toBeGreaterThanOrEqual(0);
      expect(result.current.efficiencyMetrics.satisfactionImpact).toBeGreaterThanOrEqual(0);
      expect(result.current.efficiencyMetrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(result.current.efficiencyMetrics.averageActionTime).toBeGreaterThanOrEqual(0);
    });

    it('should calculate resource utilization from crew assignments', async () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          {}
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // 2 out of 3 residents are assigned
      expect(result.current.efficiencyMetrics.resourceUtilization).toBeCloseTo(2/3, 1);
    });

    it('should calculate error rate from failed events', async () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          {}
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // 1 failed out of 3 total events
      expect(result.current.efficiencyMetrics.errorRate).toBeCloseTo(1/3, 1);
    });

    it('should calculate satisfaction impact from fatigue', async () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          {}
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Average fatigue is (0.3 + 0.6 + 0.8) / 3 = 0.57
      // Satisfaction impact should be 1 - avgFatigue = 0.43
      expect(result.current.efficiencyMetrics.satisfactionImpact).toBeCloseTo(0.43, 1);
    });
  });

  describe('Insight Generation', () => {
    it('should generate insights for high resource consumption', async () => {
      const highConsumptionEvents = [
        ...mockTelemetryEvents,
        ...Array(10).fill(null).map((_, i) => ({
          id: `food-event-${i}`,
          activityId: 'food_preparation',
          activityType: 'food_preparation',
          residentId: 'resident-1',
          timestamp: Date.now() - 1000 * 60 * i,
          status: 'completed' as const,
          duration: 30000,
          resourceCost: 5, // Higher cost
        })),
      ];

      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          highConsumptionEvents,
          { efficiencyTargets: { food: 0.5, medical: 0.9, repair: 0.8, cleaning: 0.75, security: 0.95 } }
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const foodInsights = result.current.getInsightsByCategory('food');
      expect(foodInsights.length).toBeGreaterThan(0);
      expect(foodInsights[0].title).toContain('Food Consumption');
    });

    it('should generate insights for high error rates', async () => {
      const highErrorEvents = [
        ...mockTelemetryEvents,
        ...Array(5).fill(null).map((_, i) => ({
          id: `failed-event-${i}`,
          activityId: 'repair',
          activityType: 'repair',
          residentId: 'resident-2',
          timestamp: Date.now() - 1000 * 60 * i,
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
          highErrorEvents,
          {}
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const errorInsights = result.current.insights.filter(insight => 
        insight.title.includes('Error Rate')
      );
      expect(errorInsights.length).toBeGreaterThan(0);
    });

    it('should generate insights for low efficiency', async () => {
      const lowEfficiencyEvents = [
        ...mockTelemetryEvents,
        ...Array(2).fill(null).map((_, i) => ({
          id: `slow-event-${i}`,
          activityId: 'repair',
          activityType: 'repair',
          residentId: 'resident-2',
          timestamp: Date.now() - 1000 * 60 * 60 * i, // Very spread out
          status: 'completed' as const,
          duration: 120000, // Very slow
          resourceCost: 4,
        })),
      ];

      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          lowEfficiencyEvents,
          { analysisWindow: 1000 * 60 * 60 * 24 } // 24 hours
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const efficiencyInsights = result.current.insights.filter(insight => 
        insight.title.includes('Throughput')
      );
      expect(efficiencyInsights.length).toBeGreaterThan(0);
    });

    it('should filter insights by confidence threshold', async () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          { confidenceThreshold: 0.95 } // High threshold
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // All insights should meet high confidence threshold
      result.current.insights.forEach(insight => {
        expect(insight.data.confidence).toBeGreaterThanOrEqual(0.95);
      });
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate prioritized recommendations', async () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          {}
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.recommendations.immediate).toBeDefined();
      expect(result.current.recommendations.shortTerm).toBeDefined();
      expect(result.current.recommendations.longTerm).toBeDefined();
    });

    it('should limit recommendations by category', async () => {
      // Create many insights to test limiting
      const manyEvents = [
        ...mockTelemetryEvents,
        ...Array(20).fill(null).map((_, i) => ({
          id: `event-${i}`,
          activityId: 'repair',
          activityType: 'repair',
          residentId: 'resident-2',
          timestamp: Date.now() - 1000 * 60 * i,
          status: i % 3 === 0 ? 'failed' as const : 'completed' as const,
          duration: 60000,
          resourceCost: 4,
        })),
      ];

      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          manyEvents,
          {}
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.recommendations.immediate.length).toBeLessThanOrEqual(5);
      expect(result.current.recommendations.shortTerm.length).toBeLessThanOrEqual(10);
      expect(result.current.recommendations.longTerm.length).toBeLessThanOrEqual(15);
    });
  });

  describe('Insight Filtering and Sorting', () => {
    it('should filter insights by category', async () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          {}
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const foodInsights = result.current.getInsightsByCategory('food');
      const injuryInsights = result.current.getInsightsByCategory('injury');

      foodInsights.forEach(insight => {
        expect(insight.category).toBe('food');
      });

      injuryInsights.forEach(insight => {
        expect(insight.category).toBe('injury');
      });
    });

    it('should filter insights by severity', async () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          {}
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const criticalInsights = result.current.getInsightsBySeverity('critical');
      const highInsights = result.current.getInsightsBySeverity('high');

      criticalInsights.forEach(insight => {
        expect(insight.severity).toBe('critical');
      });

      highInsights.forEach(insight => {
        expect(insight.severity).toBe('high');
      });
    });

    it('should return top insights by priority', async () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          {}
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const topInsights = result.current.getTopInsights(5);
      const allInsights = result.current.insights;

      if (allInsights.length > 0) {
        expect(topInsights.length).toBeLessThanOrEqual(5);
        
        // Top insights should be sorted by priority
        for (let i = 0; i < topInsights.length - 1; i++) {
          const currentWeight = getInsightWeight(topInsights[i]);
          const nextWeight = getInsightWeight(topInsights[i + 1]);
          expect(currentWeight).toBeGreaterThanOrEqual(nextWeight);
        }
      }
    });
  });

  describe('Manual Analysis Trigger', () => {
    it('should allow manual analysis trigger', async () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          [],
          {}
        )
      );

      expect(result.current.state.insights.length).toBe(0);

      await act(async () => {
        result.current.runAnalysis();
      });

      // Analysis should complete (even with no data)
      expect(result.current.state.analyzing).toBe(false);
      expect(result.current.state.lastAnalysis).toBeGreaterThan(0);
    });

    it('should set analyzing flag during analysis', async () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          {}
        )
      );

      await act(async () => {
        const analysisPromise = result.current.runAnalysis();
        expect(result.current.analyzing).toBe(true);
        await analysisPromise;
      });

      expect(result.current.analyzing).toBe(false);
    });
  });

  describe('Configuration Customization', () => {
    it('should use custom efficiency targets', async () => {
      const customConfig = {
        efficiencyTargets: {
          food: 0.1, // Very low target
          medical: 0.9,
          repair: 0.8,
          cleaning: 0.75,
          security: 0.95,
        },
      };

      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          customConfig
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should generate food consumption insight due to low target
      const foodInsights = result.current.getInsightsByCategory('food');
      expect(foodInsights.length).toBeGreaterThan(0);
    });

    it('should use custom priority weights', async () => {
      const customConfig = {
        priorityWeights: {
          resourceEfficiency: 0.8, // High weight on resources
          timeEfficiency: 0.1,
          riskReduction: 0.05,
          crewSatisfaction: 0.05,
        },
      };

      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          mockTelemetryEvents,
          customConfig
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should prioritize resource-related insights
      const topInsights = result.current.getTopInsights(3);
      expect(topInsights.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty data gracefully', () => {
      const { result } = renderHook(() =>
        useMaintenanceInsights(
          [],
          [],
          mockCrewSchedulerConfig,
          [],
          {}
        )
      );

      expect(result.current.state.insights).toEqual([]);
      expect(result.current.resourceMetrics).toEqual({
        foodConsumption: 0,
        medicalConsumption: 0,
        repairConsumption: 0,
        cleaningConsumption: 0,
        securityConsumption: 0,
      });
      expect(result.current.efficiencyMetrics).toEqual({
        actionsPerHour: 0,
        resourceUtilization: 0,
        satisfactionImpact: 0,
        errorRate: 0,
        averageActionTime: 0,
      });
    });

    it('should handle malformed telemetry events', async () => {
      const malformedEvents = [
        {
          id: 'malformed-1',
          activityId: 'unknown',
          activityType: 'unknown',
          residentId: 'unknown',
          timestamp: Date.now(),
          status: 'completed' as const,
          // Missing required fields
        },
        ...mockTelemetryEvents,
      ];

      const { result } = renderHook(() =>
        useMaintenanceInsights(
          mockResidents,
          mockActivities,
          mockCrewSchedulerConfig,
          malformedEvents,
          {}
        )
      );

      // Wait for analysis to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should not crash and should process valid events
      expect(result.current.state.insights.length).toBeGreaterThanOrEqual(0);
    });
  });
});

/**
 * Helper function to calculate insight weight for testing priority sorting
 */
function getInsightWeight(insight: any): number {
  const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  return severityWeight[insight.severity] * (insight.impact.resourceSavings + insight.impact.riskReduction);
}
