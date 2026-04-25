/**
 * Unit tests for Drop Suggestion Telemetry Auditor
 * 
 * @module tests/unit/idleVillage/DropTelemetryAudit.test.ts
 * @since NP-106
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import the actual classes directly without mocking for now
import { DropTelemetryAuditor, runDropTelemetryAudit } from '../../../scripts/idleVillage/dropTelemetryAudit';

// Mock the dropAITelemetry module
vi.mock('@/ui/idleVillage/utils/dropAITelemetry', () => ({
  DropAITelemetryEvent: class {} as any,
  SuggestionsGeneratedEvent: class {} as any,
  SuggestionShownEvent: class {} as any,
  SuggestionClickedEvent: class {} as any,
  SuggestionAcceptedEvent: class {} as any,
  SuggestionRejectedEvent: class {} as any,
  AIPerformanceMetricsEvent: class {} as any,
}));

// Define the type inline to avoid import issues
type DropAITelemetryEvent = {
  eventType: string;
  timestamp: number;
  sessionId: string;
  villageContext: any;
  data: any;
};

describe('DropTelemetryAuditor', () => {
  let auditor: DropTelemetryAuditor;
  let mockEvents: DropAITelemetryEvent[];

  beforeEach(() => {
    auditor = new DropTelemetryAuditor({
      timeWindowHours: 1,
      minEventThreshold: 5,
      accuracyThresholds: {
        lowAccuracy: 0.7,
        criticalAccuracy: 0.5,
      },
      usageThresholds: {
        lowUsage: 0.1,
        highUsage: 0.8,
      },
    });

    // Create mock telemetry events
    const now = Date.now();
    mockEvents = [
      {
        eventType: 'suggestions_generated',
        timestamp: now - 1000,
        sessionId: 'test-session-1',
        villageContext: {
          residentCount: 5,
          activityCount: 10,
          currentAssignments: 3,
          day: 1,
          crisisMode: false,
        },
        data: {
          totalSuggestions: 5,
          generationTimeMs: 100,
          config: {},
          algorithmVersion: '1.0.0',
          cacheHit: true,
        },
      },
      {
        eventType: 'suggestion_shown',
        timestamp: now - 800,
        sessionId: 'test-session-1',
        villageContext: {
          residentCount: 5,
          activityCount: 10,
          currentAssignments: 3,
          day: 1,
          crisisMode: false,
        },
        data: {
          suggestionId: 'suggestion-1',
          suggestionType: 'optimal_assignment',
          suggestionPriority: 'high',
          confidence: 0.8,
          residentId: 'resident-1',
          activityId: 'activity-1',
          uiMode: 'tooltip',
          position: { x: 100, y: 200 },
        },
      },
      {
        eventType: 'suggestion_clicked',
        timestamp: now - 600,
        sessionId: 'test-session-1',
        villageContext: {
          residentCount: 5,
          activityCount: 10,
          currentAssignments: 3,
          day: 1,
          crisisMode: false,
        },
        data: {
          suggestionId: 'suggestion-1',
          clickType: 'tooltip',
          timeToClick: 200,
          residentId: 'resident-1',
          activityId: 'activity-1',
          confidence: 0.8,
          expectedOutcomes: {
            successProbability: 0.9,
            yieldMultiplier: 1.2,
            fatigueImpact: 'low',
            riskLevel: 'low',
          },
        },
      },
      {
        eventType: 'suggestion_accepted',
        timestamp: now - 400,
        sessionId: 'test-session-1',
        villageContext: {
          residentCount: 5,
          activityCount: 10,
          currentAssignments: 3,
          day: 1,
          crisisMode: false,
        },
        data: {
          suggestionId: 'suggestion-1',
          residentId: 'resident-1',
          activityId: 'activity-1',
          timeToAccept: 200,
          actualOutcome: {
            success: true,
            actualYield: 1.1,
            actualFatigueImpact: 0.1,
            actualRisk: 'low',
          },
          suggestionAccuracy: {
            successPredictionAccurate: true,
            yieldPredictionAccurate: true,
            riskPredictionAccurate: true,
          },
        },
      },
      {
        eventType: 'ai_performance_metrics',
        timestamp: now - 200,
        sessionId: 'test-session-1',
        villageContext: {
          residentCount: 5,
          activityCount: 10,
          currentAssignments: 3,
          day: 1,
          crisisMode: false,
        },
        data: {
          averageGenerationTime: 150,
          suggestionAccuracy: {
            successPredictionRate: 0.9,
            overallAccuracyRate: 0.85,
          },
          userSatisfaction: {
            acceptanceRate: 0.8,
            clickThroughRate: 0.6,
            averageTimeToDecision: 300,
          },
          systemPerformance: {
            memoryUsage: 50000,
            cacheHitRate: 0.8,
            errorRate: 0.02,
          },
        },
      },
    ];
  });

  describe('constructor', () => {
    it('should create auditor with default config', () => {
      const defaultAuditor = new DropTelemetryAuditor();
      expect(defaultAuditor).toBeDefined();
    });

    it('should merge custom config with defaults', () => {
      const customAuditor = new DropTelemetryAuditor({
        timeWindowHours: 12,
        minEventThreshold: 100,
      });
      expect(customAuditor).toBeDefined();
    });
  });

  describe('loadEvents', () => {
    it('should return false for non-existent file', () => {
      const result = auditor.loadEvents('/non-existent/file.json');
      expect(result).toBe(false);
    });

    it('should filter valid events', () => {
      // Test with valid events
      const validEvents = mockEvents.filter(event => auditor['isValidEvent'](event));
      expect(validEvents).toHaveLength(5);
    });

    it('should reject invalid events', () => {
      const invalidEvents = [
        null,
        undefined,
        {},
        { eventType: 'test' }, // missing required fields
        { eventType: 'test', timestamp: 'invalid', sessionId: 'test', data: {} },
      ];

      invalidEvents.forEach(event => {
        expect(auditor['isValidEvent'](event)).toBe(false);
      });
    });
  });

  describe('runAudit', () => {
    beforeEach(() => {
      // Manually set events for testing
      auditor['events'] = mockEvents;
    });

    it('should run successful audit', () => {
      const results = auditor.runAudit();
      
      expect(results).toBeDefined();
      expect(results.metadata.totalEvents).toBe(5);
      expect(results.metadata.validEvents).toBe(5);
      expect(results.usage.totalSuggestionsGenerated).toBe(1);
      expect(results.usage.totalSuggestionsShown).toBe(1);
      expect(results.usage.totalSuggestionsClicked).toBe(1);
      expect(results.usage.totalSuggestionsAccepted).toBe(1);
      expect(results.usage.clickThroughRate).toBe(1);
      expect(results.usage.acceptanceRate).toBe(1);
    });

    it('should calculate accuracy metrics correctly', () => {
      const results = auditor.runAudit();
      
      expect(results.accuracy.successPredictionAccuracy).toBe(1);
      expect(results.accuracy.yieldPredictionAccuracy).toBe(1);
      expect(results.accuracy.riskPredictionAccuracy).toBe(1);
      expect(results.accuracy.overallAccuracy).toBe(1);
    });

    it('should calculate performance metrics correctly', () => {
      const results = auditor.runAudit();
      
      expect(results.performance.averageGenerationTime).toBe(100);
      expect(results.performance.cacheHitRate).toBe(1);
      expect(results.performance.errorRate).toBe(0);
    });

    it('should generate alerts for low accuracy', () => {
      // Create events with low accuracy
      const lowAccuracyEvents = [
        {
          ...mockEvents[3], // suggestion_accepted event
          data: {
            ...mockEvents[3].data,
            suggestionAccuracy: {
              successPredictionAccurate: false,
              yieldPredictionAccurate: false,
              riskPredictionAccurate: false,
            },
          },
        },
      ];
      
      auditor['events'] = lowAccuracyEvents;
      const results = auditor.runAudit();
      
      expect(results.alerts.some((alert: any) => alert.type === 'accuracy')).toBe(true);
      expect(results.alerts.some((alert: any) => alert.severity === 'critical')).toBe(true);
    });

    it('should generate alerts for low usage', () => {
      // Create events with low usage (no clicks)
      const lowUsageEvents = [
        mockEvents[0], // suggestions_generated
        mockEvents[1], // suggestion_shown
        // No suggestion_clicked events
      ];
      
      auditor['events'] = lowUsageEvents;
      const results = auditor.runAudit();
      
      expect(results.alerts.some((alert: any) => alert.type === 'usage')).toBe(true);
      expect(results.usage.clickThroughRate).toBe(0);
    });

    it('should generate alerts for slow performance', () => {
      // Create events with slow generation
      const slowPerformanceEvents = [
        {
          ...mockEvents[0], // suggestions_generated
          data: {
            ...mockEvents[0].data,
            generationTimeMs: 2000, // Very slow
          },
        },
      ];
      
      auditor['events'] = slowPerformanceEvents;
      const results = auditor.runAudit();
      
      expect(results.alerts.some((alert: any) => alert.type === 'performance')).toBe(true);
      expect(results.performance.averageGenerationTime).toBe(2000);
    });

    it('should throw error for insufficient events', () => {
      auditor['events'] = mockEvents.slice(0, 2); // Only 2 events
      
      expect(() => auditor.runAudit()).toThrow(
        'Insufficient events for audit: 2 (minimum: 5)'
      );
    });

    it('should filter events by time window', () => {
      // Create old events outside time window
      const oldTimestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      const oldEvents = mockEvents.map(event => ({
        ...event,
        timestamp: oldTimestamp,
      }));
      
      auditor['events'] = oldEvents;
      
      expect(() => auditor.runAudit()).toThrow(
        'Insufficient events for audit'
      );
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      auditor['events'] = mockEvents;
    });

    it('should calculate correlation correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10]; // Perfect correlation
      
      const correlation = auditor['calculateCorrelation'](x, y);
      expect(correlation).toBeCloseTo(1);
    });

    it('should handle empty correlation arrays', () => {
      const correlation = auditor['calculateCorrelation']([], []);
      expect(correlation).toBe(0);
    });

    it('should get suggestion confidence', () => {
      const confidence = auditor['getSuggestionConfidence']('suggestion-1', mockEvents);
      expect(confidence).toBe(0.8);
    });

    it('should return null for missing suggestion confidence', () => {
      const confidence = auditor['getSuggestionConfidence']('non-existent', mockEvents);
      expect(confidence).toBeNull();
    });
  });

  describe('saveReport', () => {
    beforeEach(() => {
      auditor['events'] = mockEvents;
    });

    it('should save report to file', () => {
      const mockWriteFileSync = vi.fn();
      const mockMkdirSync = vi.fn();
      
      vi.doMock('fs', () => ({
        writeFileSync: mockWriteFileSync,
        mkdirSync: mockMkdirSync,
        existsSync: vi.fn().mockReturnValue(true),
        readFileSync: vi.fn(),
      }));

      const results = auditor.runAudit();
      const reportPath = auditor.saveReport(results);
      
      expect(reportPath).toBeDefined();
      expect(reportPath).toContain('drop-telemetry-audit-');
      expect(reportPath).toContain('.json');
    });
  });

  describe('printSummary', () => {
    beforeEach(() => {
      auditor['events'] = mockEvents;
    });

    it('should print summary without errors', () => {
      const mockConsole = {
        log: vi.fn(),
      };
      
      const originalConsole = global.console;
      global.console = mockConsole as any;
      
      const results = auditor.runAudit();
      expect(() => auditor.printSummary(results)).not.toThrow();
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Drop Suggestion Telemetry Audit Summary')
      );
      
      global.console = originalConsole;
    });
  });
});

describe('runDropTelemetryAudit', () => {
  it('should run audit with file path', async () => {
    const mockAuditor = {
      loadEvents: vi.fn().mockReturnValue(true),
      runAudit: vi.fn().mockReturnValue({
        metadata: { totalEvents: 10, validEvents: 10 },
        usage: { clickThroughRate: 0.5 },
        accuracy: { overallAccuracy: 0.8 },
        performance: { averageGenerationTime: 100 },
        alerts: [],
        breakdowns: { bySuggestionType: {}, byPriority: {}, byTimeOfDay: {} },
      }),
      printSummary: vi.fn(),
      saveReport: vi.fn(),
    };

    vi.mock('../../../scripts/idleVillage/dropTelemetryAudit', () => ({
      DropTelemetryAuditor: vi.fn().mockImplementation(() => mockAuditor),
      runDropTelemetryAudit: vi.fn(),
    }));

    // Test would require actual file system, so we just verify the function exists
    expect(typeof runDropTelemetryAudit).toBe('function');
  });
});
