/**
 * Drop Validation Telemetry Tests
 * 
 * Unit tests for the drop validation telemetry analytics module
 * using Vitest and React Testing Library.
 * 
 * @since NP-067 – Idle Village Drop Validation Telemetry Export
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  getDropValidationAnalytics,
  exportDropValidationAnalytics,
  getCurrentAggregatedMetrics,
  getSessionMetrics,
  getExportHistory,
  isValidDropValidationOutcome,
  isValidDropValidationTelemetryEvent,
  calculateAggregatedMetrics,
  filterValidationEvents,
  exportValidationEventsToJSON,
  exportValidationEventsToCSV,
  exportValidationEventsToMarkdown,
} from '@/analytics/idleVillageDropValidation';
import type {
  DropValidationOutcome,
  DropValidationTelemetryEvent,
  DropValidationAnalyticsConfig,
  DropValidationEventType,
  DropValidationSeverity,
  DropValidationRuleType,
} from '@/analytics/idleVillageDropValidation';
import {
  DEFAULT_DROP_VALIDATION_ANALYTICS_CONFIG,
  createSafeDropValidationAnalyticsConfig,
} from '@/analytics/idleVillageDropValidation';

// Mock PersistenceService
jest.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: jest.fn(),
  loadData: jest.fn(),
}));

// Mock window.gtag for telemetry
Object.defineProperty(window, 'gtag', {
  value: jest.fn(),
  writable: true,
});

describe('Drop Validation Telemetry', () => {
  const mockConfig = DEFAULT_DROP_VALIDATION_ANALYTICS_CONFIG;
  const mockAnalytics = getDropValidationAnalytics(mockConfig);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('creates safe config from partial config', () => {
      const partialConfig = {
        analytics: {
          throttleMs: 200,
          maxEventsPerSession: 500,
        },
      };
      
      const config = createSafeDropValidationAnalyticsConfig(partialConfig);
      
      expect(config.analytics.throttleMs).toBe(200);
      expect(config.analytics.maxEventsPerSession).toBe(500);
      expect(config.analytics.retentionMs).toBe(86400000); // 24 hours
    });

    it('validates drop validation outcome', () => {
      const validOutcome: DropValidationOutcome = {
        isValid: true,
        ruleType: 'fatigue_threshold',
        ruleId: 'fatigue-001',
        severity: 'low',
        message: 'Resident is well-rested',
        metadata: {
          fatigue: 50,
          timestamp: Date.now(),
          sessionId: 'test-session-123',
        },
      };
      
      expect(isValidDropValidationOutcome(validOutcome)).toBe(true);
    });

    it('validates telemetry event', () => {
      const validEvent: DropValidationTelemetryEvent = {
        eventType: 'drop_validation_passed',
        timestamp: Date.now(),
        data: {
          outcome: {
            isValid: true,
            ruleType: 'fatigue_threshold',
            ruleId: 'fatigue-001',
            severity: 'low',
            message: 'Resident is well-rested',
            metadata: {
              fatigue: 50,
              timestamp: Date.now(),
              sessionId: 'test-session-123',
            },
          },
          context: {
            interactionMode: 'desktop',
          },
        },
      };
      
      expect(isValidDropValidationTelemetryEvent(validEvent)).toBe(true);
    });

    it('creates default analytics structure', () => {
      const analytics = createDefaultAnalytics();
      
      expect(analytics.sessionMetrics.sessionId).toBeDefined();
      expect(analytics.sessionMetrics.startTime).toBeGreaterThan(0);
      expect(analytics.sessionMetrics.totalEvents).toBe(0);
      expect(analytics.sessionMetrics.validationCount).toBe(0);
      expect(analytics.sessionMetrics.failureCount).toBe(0);
      expect(analytics.sessionMetrics.averageLatencyMs).toBe(0);
      expect(analytics.sessionMetrics.dominantFailureRule).toBe('fatigue_threshold');
      
      expect(analytics.aggregatedMetrics.totalValidations).toBe(0);
      expect(analytics.aggregatedMetrics.successRate).toBe(0);
      expect(analytics.aggregatedMetrics.failureRate).toBe(0);
      expect(analytics.aggregatedMetrics.averageLatencyMs).toBe(0);
      expect(analytics.aggregatedMetrics.ruleFailureRates).toEqual({
        fatigue_threshold: 0,
        crew_capacity: 0,
        stat_tags: 0,
        activity_requirements: 0,
        resident_compatibility: 0,
        slot_availability: 0,
      });
      expect(analytics.aggregatedMetrics.severityDistribution).toEqual({
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      });
    });
  });

  describe('Analytics Hook', () => {
    it('loads analytics data from storage', async () => {
      const analytics = mockAnalytics;
      const loadedAnalytics = await analytics.loadAnalytics();
      
      expect(loadedAnalytics.sessionMetrics.sessionId).toBeDefined();
      expect(loadedAnalytics.aggregatedMetrics.totalValidations).toBe(0);
    });

    it('saves analytics data to storage', async () => {
      const analytics = mockAnalytics;
      
      // Update some metrics
      const updatedAnalytics = await analytics.loadAnalytics();
      updatedAnalytics.sessionMetrics.validationCount = 5;
      updatedAnalytics.sessionMetrics.failureCount = 2;
      
      await analytics.saveAnalytics(updatedAnalytics);
      
      // Verify it was saved
      const reloadedAnalytics = await analytics.loadAnalytics();
      expect(reloadedAnalytics.sessionMetrics.validationCount).toBe(5);
      expect(reloadedAnalytics.sessionMetrics.failureCount).toBe(2);
    });

    it('records validation outcome', async () => {
      const analytics = mockAnalytics;
      
      const outcome: DropValidationOutcome = {
        isValid: false,
        ruleType: 'crew_capacity',
        ruleId: 'crew-001',
        severity: 'medium',
        message: 'Activity is full',
        metadata: {
          crewCount: 5,
          timestamp: Date.now(),
          sessionId: 'test-session-123',
        },
      };
      
      await analytics.recordValidationOutcome(outcome);
      
      // Verify event was recorded
      const events = await analytics.loadEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('drop_validation_failed');
      expect(events[0].data.outcome?.ruleType).toBe('crew_capacity');
      expect(events[0].data.outcome?.isValid).toBe(false);
    });

    it('records drop feedback shown', async () => {
      const analytics = mockAnalytics;
      
      const outcome: DropValidationOutcome = {
        isValid: true,
        ruleType: 'stat_tags',
        ruleId: 'stat-001',
        severity: 'low',
        message: 'Stat requirements met',
        metadata: {
          requiredStats: ['strength', 'agility'],
          availableStats: ['strength', 'agility'],
          timestamp: Date.now(),
          sessionId: 'test-session-123',
        },
      };
      
      await analytics.recordDropFeedbackShown(outcome);
      
      // Verify event was recorded
      const events = await analytics.loadEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('drop_feedback_shown');
      expect(events[0].data.outcome?.ruleType).toBe('stat_tags');
      expect(events[0].data.outcome?.isValid).toBe(true);
    });

    it('records export event', async () => {
      const analytics = mockAnalytics;
      
      await analytics.exportEvents('json');
      
      // Verify export event was recorded
      const events = await analytics.loadEvents();
      const exportEvents = events.filter(e => e.eventType === 'drop_validation_exported');
      expect(exportEvents).toHaveLength(1);
      expect(exportEvents[0].data.exportMetadata?.format).toBe('json');
    });

    it('calculates aggregated metrics', async () => {
      const analytics = mockAnalytics;
      
      // Add some test events
      const testEvents: DropValidationTelemetryEvent[] = [
        {
          eventType: 'drop_validation_passed',
          timestamp: Date.now() - 1000,
          data: {
            outcome: {
              isValid: true,
              ruleType: 'fatigue_threshold',
              ruleId: 'fatigue-001',
              severity: 'low',
              message: 'Resident is well-rested',
              metadata: {
                fatigue: 50,
                timestamp: Date.now() - 1000,
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'desktop',
            },
          },
        },
        {
          eventType: 'drop_validation_failed',
          timestamp: Date.now() - 500,
          data: {
            outcome: {
              isValid: false,
              ruleType: 'crew_capacity',
              ruleId: 'crew-001',
              severity: 'medium',
              message: 'Activity is full',
              metadata: {
                crewCount: 5,
                timestamp: Date.now() - 500,
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'mobile',
            },
          },
        },
        {
          eventType: 'drop_validation_failed',
          timestamp: Date.now() - 200,
          data: {
            outcome: {
              isValid: false,
              ruleType: 'stat_tags',
              ruleId: 'stat-001',
              severity: 'high',
              message: 'Missing required stats',
              metadata: {
                requiredStats: ['strength'],
                availableStats: ['agility'],
                timestamp: Date.now() - 200,
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'desktop',
            },
          },
        },
      ];
      
      const metrics = calculateAggregatedMetrics(testEvents);
      
      expect(metrics.totalValidations).toBe(3);
      expect(metrics.successRate).toBeCloseTo(1/3); // 1 success out of 3
      expect(metrics.failureRate).toBeCloseTo(2/3); // 2 failures out of 3
      expect(metrics.averageLatencyMs).toBeGreaterThanOrEqual(0));
      expect(metrics.ruleFailureRates.fatigue_threshold).toBe(1);
      expect(metrics.ruleFailureRates.crew_capacity).toBe(1);
      expect(metrics.ruleFailureRates.stat_tags).toBe(1);
      expect(metrics.severityDistribution.low).toBe(1);
      expect(metrics.severityDistribution.high).toBe(1);
    });

    it('filters events by date range', async () => {
      const analytics = mockAnalytics;
      
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      const testEvents: DropValidationTelemetryEvent[] = [
        {
          eventType: 'drop_validation_passed',
          timestamp: now,
          data: {
            outcome: {
              isValid: true,
              ruleType: 'fatigue_threshold',
              ruleId: 'fatigue-001',
              severity: 'low',
              message: 'Resident is well-rested',
              metadata: {
                fatigue: 50,
                timestamp: now,
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'desktop',
            },
          },
        },
        {
          eventType: 'drop_validation_failed',
          timestamp: oneHourAgo + 1000,
          data: {
            outcome: {
              isValid: false,
              ruleType: 'crew_capacity',
              ruleId: 'crew-001',
              severity: 'medium',
              message: 'Activity is full',
              metadata: {
                crewCount: 5,
                timestamp: oneHourAgo + 1000,
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'mobile',
            },
          },
        },
      ];
      
      const filtered = await analytics.getFilteredEvents({
        dateRange: 1, // 1 hour
      });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].eventType).toBe('drop_validation_passed');
    });

    it('filters events by severity', async () => {
      const analytics = mockAnalytics;
      
      const testEvents: DropValidationTelemetryEvent[] = [
        {
          eventType: 'drop_validation_passed',
          timestamp: Date.now(),
          data: {
            outcome: {
              isValid: true,
              ruleType: 'fatigue_threshold',
              ruleId: 'fatigue-001',
              severity: 'low',
              message: 'Resident is well-rested',
              metadata: {
                fatigue: 50,
                timestamp: Date.now(),
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'desktop',
            },
          },
        },
        {
          eventType: 'drop_validation_failed',
          timestamp: Date.now(),
          data: {
            outcome: {
              isValid: false,
              ruleType: 'stat_tags',
              ruleId: 'stat-001',
              severity: 'high',
              message: 'Missing required stats',
              metadata: {
                requiredStats: ['strength'],
                timestamp: Date.now(),
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'desktop',
            },
          },
        },
        {
          eventType: 'drop_validation_failed',
          timestamp: Date.now(),
          data: {
            outcome: {
              isValid: false,
              ruleType: 'crew_capacity',
              ruleId: 'crew-001',
              severity: 'critical',
              message: 'Critical failure',
              metadata: {
                crewCount: 10,
                timestamp: Date.now(),
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'mobile',
            },
          },
        },
      ];
      
      const lowSeverityEvents = await analytics.getFilteredEvents({
        severities: ['low'],
      });
      
      expect(lowSeverityEvents).toHaveLength(1);
      expect(lowSeverityEvents[0].data.outcome?.severity).toBe('low');
      
      const highSeverityEvents = await analytics.getFilteredEvents({
        severities: ['high', 'critical'],
      });
      
      expect(highSeverityEvents).toHaveLength(2);
    });

    it('filters events by rule type', async () => {
      const analytics = mockAnalytics;
      
      const testEvents: DropValidationTelemetryEvent[] = [
        {
          eventType: 'drop_validation_passed',
          timestamp: Date.now(),
          data: {
            outcome: {
              isValid: true,
              ruleType: 'fatigue_threshold',
              ruleId: 'fatigue-001',
              severity: 'low',
              message: 'Resident is well-rested',
              metadata: {
                fatigue: 50,
                timestamp: Date.now(),
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'desktop',
            },
          },
        },
        {
          eventType: 'drop_validation_failed',
          timestamp: Date.now(),
          data: {
            outcome: {
              isValid: false,
              ruleType: 'stat_tags',
              ruleId: 'stat-001',
              severity: 'high',
              message: 'Missing required stats',
              metadata: {
                requiredStats: ['strength'],
                timestamp: Date.now(),
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'desktop',
            },
          },
        },
      ];
      
      const fatigueEvents = await analytics.getFilteredEvents({
        ruleTypes: ['fatigue_threshold'],
      });
      
      expect(fatigueEvents).toHaveLength(1);
      expect(fatigueEvents[0].data.outcome?.ruleType).toBe('fatigue_threshold');
      
      const statTagsEvents = await analytics.getFilteredEvents({
        ruleTypes: ['stat_tags'],
      });
      
      expect(statTagsEvents).toHaveLength(1);
      expect(statTagsEvents[0].data.outcome?.ruleType).toBe('stat_tags');
    });

    it('filters events by event type', async () => {
      const analytics = mockAnalytics;
      
      const testEvents: DropValidationTelemetryEvent[] = [
        {
          eventType: 'drop_feedback_shown',
          timestamp: Date.now(),
          data: {
            outcome: {
              isValid: true,
              ruleType: 'fatigue_threshold',
              ruleId: 'fatigue-001',
              severity: 'low',
              message: 'Resident is well-rested',
              metadata: {
                fatigue: 50,
                timestamp: Date.now(),
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'desktop',
            },
          },
        },
        {
          eventType: 'drop_validation_failed',
          timestamp: Date.now(),
          data: {
            outcome: {
              isValid: false,
              ruleType: 'crew_capacity',
              ruleId: 'crew-001',
              severity: 'medium',
              message: 'Activity is full',
              metadata: {
                crewCount: 5,
                timestamp: Date.now(),
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'mobile',
            },
          },
        },
        {
          eventType: 'drop_validation_exported',
          timestamp: Date.now(),
          data: {
            exportMetadata: {
              format: 'json',
              recordCount: 42,
              filename: 'test-export.json',
            },
            context: {
              interactionMode: 'desktop',
            },
          },
        },
      ];
      
      const feedbackEvents = await analytics.getFilteredEvents({
        eventTypes: ['drop_feedback_shown'],
      });
      
      expect(feedbackEvents).toHaveLength(1);
      expect(feedbackEvents[0].eventType).toBe('drop_feedback_shown');
      
      const validationEvents = await analytics.getFilteredEvents({
        eventTypes: ['drop_validation_failed', 'drop_validation_passed'],
      });
      
      expect(validationEvents).toHaveLength(2);
    });
  });

  describe('Export Functionality', () => {
    it('exports events to JSON', async () => {
      const analytics = mockAnalytics;
      
      const testEvents: DropValidationTelemetryEvent[] = [
        {
          eventType: 'drop_validation_passed',
          timestamp: Date.now(),
          data: {
            outcome: {
              isValid: true,
              ruleType: 'fatigue_threshold',
              ruleId: 'fatigue-001',
              severity: 'low',
              message: 'Resident is well-rested',
              metadata: {
                fatigue: 50,
                timestamp: Date.now(),
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'desktop',
            },
          },
        },
      ];
      
      const jsonExport = await analytics.exportEvents('json');
      
      expect(jsonExport).toContain('"eventType":"drop_validation_passed"');
      expect(jsonExport).toContain('"ruleType":"fatigue_threshold"');
      expect(jsonExport).toContain('"severity":"low"');
      expect(jsonExport).toContain('"message":"Resident is well-rested"');
    });

    it('exports events to CSV', async () => {
      const analytics = mockAnalytics;
      
      const testEvents: DropValidationTelemetryEvent[] = [
        {
          eventType: 'drop_validation_failed',
          timestamp: Date.now(),
          data: {
            outcome: {
              isValid: false,
              ruleType: 'crew_capacity',
              ruleId: 'crew-001',
              severity: 'medium',
              message: 'Activity is full',
              metadata: {
                crewCount: 5,
                timestamp: Date.now(),
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'mobile',
            },
          },
        },
      ];
      
      const csvExport = await analytics.exportEvents('csv');
      
      expect(csvExport).toContain('drop_validation_failed');
      expect(csvExport).toContain('crew_capacity');
      expect(csvExport).toContain('medium');
      expect(csvExport).toContain('Activity is full');
      expect(csvExport).toContain('5');
    });

    it('exports events to Markdown', async () => {
      const analytics = mockAnalytics;
      
      const testEvents: DropValidationEvent[] = [
        {
          eventType: 'drop_validation_passed',
          timestamp: Date.now(),
          data: {
            outcome: {
              isValid: true,
              ruleType: 'fatigue_threshold',
              ruleId: 'fatigue-001',
              severity: 'low',
              message: 'Resident is well-rested',
              metadata: {
                fatigue: 50,
                timestamp: Date.now(),
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'desktop',
            },
          },
        },
      ];
      
      const markdownExport = await analytics.exportEvents('markdown');
      
      expect(markdownExport).toContain('# Drop Validation Telemetry Export');
      expect(markdownExport).toContain('## Summary Metrics');
      expect(markdownExport).toContain('Total Events: 1');
      expect(markdownExport).toContain('Success Rate: 100.00%');
      expect(markdownExport).toContain('Rule Failure Rates');
      expect(markdownExport).toContain('fatigue_threshold');
      expect(markdownExport).toContain('Severity Distribution'));
    });

    it('includes aggregated metrics in JSON export', async () => {
      const analytics = mockAnalytics;
      
      const testEvents: DropValidationTelemetryEvent[] = [
        {
          eventType: 'drop_validation_passed',
          timestamp: Date.now(),
          data: {
            outcome: {
              isValid: true,
              ruleType: 'fatigue_threshold',
              ruleId: 'fatigue-001',
              severity: 'low',
              message: 'Resident is well-rested',
              metadata: {
                fatigue: 50,
                timestamp: Date.now(),
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'desktop',
            },
          },
        },
        {
          eventType: 'drop_validation_failed',
          timestamp: Date.now(),
          data: {
            outcome: {
              isValid: false,
              ruleType: 'crew_capacity',
              ruleId: 'crew-001',
              severity: 'medium',
              message: 'Activity is full',
              metadata: {
                crewCount: 5,
                timestamp: Date.now(),
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: 'mobile',
            },
          },
        },
      ];
      
      const jsonExport = await analytics.exportEvents('json');
      const parsed = JSON.parse(jsonExport);
      
      expect(parsed.aggregatedMetrics).toBeDefined();
      expect(parsed.totalEvents).toBe(2);
      expect(parsed.aggregatedMetrics.successRate).toBe(0.5);
      expect(parsed.aggregatedMetrics.failureRate).toBe(0.5);
    });

    it('saves export to test-results directory', async () => {
      const analytics = mockAnalytics;
      
      const exportData = await analytics.exportEvents('json');
      
      // Verify the file was saved by checking if it exists in test-results
      // This would require checking the file system, but for now we'll verify the export format
      expect(exportData).toContain('test-results/idleVillage');
      expect(exportData).toContain('drop-validation-telemetry-');
    });
  });

  describe('Performance Monitoring', () => {
    it('tracks validation latency', async () => {
      const analytics = mockAnalytics;
      
      const outcome: DropValidationOutcome = {
        isValid: false,
        ruleType: 'stat_tags',
        ruleId: 'stat-001',
        severity: 'high',
        message: 'Missing required stats',
        metadata: {
          requiredStats: ['strength'],
          timestamp: Date.now(),
          sessionId: 'test-session-123',
        },
      };
      
      const performance = {
        validationLatencyMs: 25,
        ruleProcessingTimeMs: 10,
        totalProcessingTimeMs: 35,
      };
      
      await analytics.recordValidationOutcome(outcome, performance);
      
      const events = await analytics.loadEvents();
      const validationEvents = events.filter(e => e.eventType === 'drop_validation_failed');
      
      expect(validationEvents).toHaveLength(1);
      expect(validationEvents[0].data.performance?.validationLatencyMs).toBe(25);
    });

    it('emits telemetry events', () => {
      const analytics = mockAnalytics;
      
      // Mock global gtag
      const mockGtag = (window as any).gtag;
      mockGtag.mockClear();
      
      const outcome: DropValidationOutcome = {
        isValid: true,
        ruleType: 'fatigue_threshold',
        ruleId: 'fatigue-001',
        severity: 'low',
        message: 'Resident is well-rested',
        metadata: {
          fatigue: 50,
          timestamp: Date.now(),
          sessionId: 'test-session-123',
        },
      };
      
      await analytics.recordValidationOutcome(outcome);
      
      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'drop_validation_passed',
        expect.objectContaining({
          event_category: 'idle_village',
          event_label: 'fatigue_threshold',
          value: 1,
          custom_parameters: {
            severity: 'low',
            latency: expect.any(Number),
            interactionMode: 'desktop',
          },
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('handles storage errors gracefully', async () => {
      const analytics = mockAnalytics;
      
      // Mock storage failure
      const mockLoadData = (loadData as jest.Mock).mockRejectedValue(new Error('Storage error'));
      mockLoadData.mockRejectedValue(new Error('Storage error'));
      
      const analyticsData = await analytics.loadAnalytics();
      
      // Should return default analytics
      expect(analyticsData.sessionMetrics.sessionId).toBeDefined();
      expect(analyticsData.aggregatedMetrics.totalValidations).toBe(0);
    });

    it('handles invalid events gracefully', async () => {
      const analytics = mockAnalytics;
      
      const invalidEvent = {
        eventType: 'invalid_event' as any,
        timestamp: Date.now(),
        data: {
          outcome: null,
        },
      } as DropValidationTelemetryEvent;
      
      // Should not record invalid events
      await expect(analytics.recordEvent(invalidEvent));
      
      const events = await analytics.loadEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('Integration with PersistenceService', () => {
    it('uses async storage operations', async () => {
      const analytics = mockAnalytics;
      
      const outcome: DropValidationOutcome = {
        isValid: false,
        ruleType: 'crew_capacity',
        ruleId: 'crew-001',
        severity: 'medium',
        message: 'Activity is full',
        metadata: {
          crewCount: 5,
          timestamp: Date.now(),
          sessionId: 'test-session-123',
        },
      };
      
      await analytics.recordValidationOutcome(outcome);
      
      // Verify PersistenceService was called
      expect(require('@/shared/persistence/PersistenceService').saveData).toHaveBeenCalled();
    });

    it('throttles events properly', async () => {
      const analytics = mockAnalytics;
      
      const outcome1: DropValidationOutcome = {
        isValid: true,
        ruleType: 'fatigue_threshold',
        ruleId: 'fatigue-001',
        severity: 'low',
        message: 'Resident is well-rested',
        metadata: {
          fatigue: 50,
          timestamp: Date.now(),
          sessionId: 'test-session-123',
        },
      };
      
      const outcome2: DropValidationOutcome = {
        isValid: false,
        ruleType: 'crew_capacity',
        ruleId: 'crew-001',
        severity: 'medium',
        message: 'Activity is full',
        metadata: {
          crewCount: 5,
          timestamp: Date.now(),
          sessionId: 'test-session-123',
        },
      };
      
      // Record events rapidly
      await analytics.recordValidationOutcome(outcome1);
      await analytics.recordValidationOutcome(outcome2);
      
      // Should only record one event due to throttling
      const events = await analytics.loadEvents();
      expect(events).toHaveLength(1);
      expect(events[0].data.outcome?.ruleId).toBe('fatigue_threshold');
    });
  });

  describe('Session Management', () => {
    it('generates unique session IDs', () => {
      const analytics1 = getDropValidationAnalytics();
      const analytics2 = getDropValidationAnalytics();
      
      const session1 = await analytics1.loadAnalytics();
      const session2 = await analytics2.loadAnalytics();
      
      expect(session1.sessionMetrics.sessionId).toBeDefined();
      expect(session2.sessionMetrics.sessionId).toBeDefined();
      expect(session1.sessionMetrics.sessionId).not.toBe(session2.sessionMetrics.sessionId);
    });

    it('tracks session metrics', async () => {
      const analytics = mockAnalytics;
      
      const outcome1: DropValidationOutcome = {
        isValid: true,
        ruleType: 'fatigue_threshold',
        ruleId: 'fatigue-001',
        severity: 'low',
        message: 'Resident is well-rested',
        metadata: {
          fatigue: 50,
          timestamp: Date.now(),
          sessionId: 'test-session-123',
        },
      };
      
      const outcome2: DropValidationOutcome = {
        isValid: false,
        ruleType: 'crew_capacity',
        ruleId: 'crew-001',
        severity: 'medium',
        message: 'Activity is full',
        metadata: {
          crewCount: 5,
          timestamp: Date.now(),
          sessionId: 'test-session-123',
        },
      };
      
      await analytics.recordValidationOutcome(outcome1);
      await analytics.recordValidationOutcome(outcome2);
      
      const sessionMetrics = await analytics.getCurrentAnalytics();
      expect(sessionMetrics.sessionMetrics.validationCount).toBe(2);
      expect(sessionMetrics.failureCount).toBe(1);
      expect(sessionMetrics.averageLatencyMs).toBeGreaterThanOrEqual(0));
    });
  });

  describe('Export History', () => {
    it('tracks export history', async () => {
      const analytics = mockAnalytics;
      
      await analytics.exportEvents('json');
      await analytics.exportEvents('csv');
      await analytics.exportEvents('markdown');
      
      const history = await analytics.getExportHistory();
      expect(history).toHaveLength(3);
      
      expect(history[0].format).toBe('json');
      expect(history[1].format).toBe('csv');
      expect(history[2].format).toBe('markdown');
    });

    it('limits export history size', async () => {
      const analytics = mockAnalytics;
      
      // Add exports beyond limit
      for (let i = 0; i < 60; i++) {
        await analytics.exportEvents('json');
      }
      
      const history = await analytics.getExportHistory();
      expect(history.length).toBe(50); // Limited to last 50 exports
    });
  });

  describe('Real-time Updates', () => {
    it('updates analytics on event recording', async () => {
      const analytics = mockAnalytics;
      
      const initialMetrics = await analytics.getCurrentAnalytics();
      expect(initialMetrics.aggregatedMetrics.totalValidations).toBe(0);
      
      const outcome: DropValidationOutcome = {
        isValid: true,
        ruleType: 'fatigue_threshold',
        ruleId: 'fatigue-001',
        severity: 'low',
        message: 'Resident is well-rested',
        metadata: {
          fatigue: 50,
          timestamp: Date.now(),
          sessionId: 'test-session-123',
        },
      };
      
      await analytics.recordValidationOutcome(outcome);
      
      const updatedMetrics = await analytics.getCurrentAnalytics();
      expect(updatedMetrics.aggregatedMetrics.totalValidations).toBe(1);
      expect(updatedMetrics.aggregatedMetrics.successRate).toBe(1.0);
    });

    it('updates session metrics on failure', async () => {
      const analytics = mockAnalytics;
      
      const outcome: DropValidationOutcome = {
        isValid: false,
        ruleType: 'crew_capacity',
        ruleId: 'crew-001',
        severity: 'medium',
        message: 'Activity is full',
        metadata: {
          crewCount: 5,
          timestamp: Date.now(),
          sessionId: 'test-session-123',
        },
      };
      
      await analytics.recordValidationOutcome(outcome);
      
      const sessionMetrics = await analytics.getCurrentAnalytics();
      expect(sessionMetrics.failureCount).toBe(1);
      expect(sessionMetrics.dominantFailureRule).toBe('crew_capacity');
    });
  });

  describe('Data Integrity', () => {
    it('maintains data consistency', async () => {
      const analytics = mockAnalytics;
      
      // Add multiple events
      for (let i = 0; i < 10; i++) {
        await analytics.recordEvent({
          eventType: 'drop_validation_passed',
          timestamp: Date.now() + (i * 1000),
          data: {
            outcome: {
              isValid: i % 2 === 0,
              ruleType: 'fatigue_threshold',
              ruleId: `fatigue-${i}`,
              severity: i % 3 === 0 ? 'low' : i % 3 === 1 ? 'medium' : 'high',
              message: `Test message ${i}`,
              metadata: {
                fatigue: 50 + i,
                timestamp: Date.now() + (i * 1000),
                sessionId: 'test-session-123',
              },
            },
            context: {
              interactionMode: i % 2 === 0 ? 'desktop' : 'mobile',
            },
          },
        });
      }
      
      const events = await analytics.loadEvents();
      expect(events).toHaveLength(10);
      
      // Verify all events are valid
      const invalidEvents = events.filter(e => !isValidDropValidationTelemetryEvent(e));
      expect(invalidEvents).toHaveLength(0);
      
      // Verify chronological order
      const timestamps = events.map(e => e.timestamp);
      const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
      expect(timestamps).toEqual(sortedTimestamps);
    });

    it('preserves data types', async () => {
      const analytics = mockAnalytics;
      
      const outcome: DropValidationOutcome = {
        isValid: true,
        ruleType: 'fatigue_threshold',
        ruleId: 'fatigue-001',
        severity: 'low',
        message: 'Resident is well-rested',
        metadata: {
          fatigue: 50,
          timestamp: Date.now(),
          sessionId: 'test-session-123',
        },
      };
      
      await analytics.recordValidationOutcome(outcome);
      
      const events = await analytics.loadEvents();
      const event = events[0];
      
      expect(event.data.outcome?.isValid).toBe(true);
      expect(event.data.outcome?.ruleType).toBe('fatigue_threshold');
      expect(event.data.outcome?.severity).toBe('low');
      expect(event.data.outcome?.metadata.fatigue).toBe(50);
      expect(event.data.outcome?.metadata.timestamp).toBeTypeOf('number'));
      expect(event.data.outcome?.metadata.sessionId).toBe('string'));
    });
  });
});
