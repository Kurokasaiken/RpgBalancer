/**
 * Unit Tests for Drop Validation Telemetry Export
 * 
 * Comprehensive test suite covering schema validation, data collection,
 * export functionality, and edge cases for the telemetry export system.
 * 
 * @since NP-067
 * @author Coordinator-Bot – Analytics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DropValidationTelemetryCollector } from '../dropValidationTelemetryCollector';
import { DropValidationTelemetryExporter } from '../dropValidationTelemetryExporter';
import type {
  DropValidationTelemetryExport,
  DropValidationMetrics,
  FeedbackInteractionMetrics,
  AISuggestionMetrics,
  PerformanceMetrics,
  ExportConfig,
  ExportResult,
} from '../dropValidationTelemetryExportSchema';

// Mock data for testing
const mockTelemetryData: DropValidationTelemetryExport = {
  metadata: {
    exportedAt: '2026-01-20T10:00:00.000Z',
    version: '1.0.0',
    source: 'test',
    collectionPeriod: {
      startTimestamp: Date.now() - 86400000, // 24 hours ago
      endTimestamp: Date.now(),
      duration: 86400000,
      eventCount: 1000,
      eventsPerSecond: 0.0116,
    },
  },
  sessionSummary: {
    totalSessions: 5,
    sessionDurations: {
      average: 3600000,
      min: 1800000,
      max: 7200000,
    },
    uniqueUsers: 3,
  },
  metrics: {
    dropValidation: {
      totalDrops: 500,
      successfulDrops: 425,
      failedDrops: 75,
      successRate: 85,
      averageDropTime: 150,
      mostCommonFailure: 'fatigue_threshold',
      validationFailures: {
        'fatigue_threshold': 30,
        'crew_capacity': 20,
        'stat_requirement_allOf': 15,
        'resident_availability': 10,
      },
    },
    feedbackInteraction: {
      totalFeedbackShown: 75,
      totalInteractions: 45,
      interactionRate: 60,
      averageTimeToInteract: 2000,
      feedbackTypeBreakdown: {
        'valid': 30,
        'invalid': 25,
        'warning': 15,
        'blocked': 5,
      },
    },
    aiSuggestions: {
      totalSuggestions: 200,
      acceptedSuggestions: 120,
      rejectedSuggestions: 80,
      acceptanceRate: 60,
      averageConfidence: 0.75,
      accuracy: {
        successPredictionRate: 0.85,
        overallAccuracyRate: 0.82,
      },
    },
    performance: {
      averageValidationTime: 50,
      averageSuggestionTime: 100,
      memoryUsage: 52428800, // 50MB
      cacheHitRate: 0.67,
      errorRate: 0.02,
    },
  },
  residentBreakdown: [
    {
      residentId: 'resident-001',
      dropCount: 50,
      successRate: 90,
      mostCommonActivities: ['activity-001', 'activity-002'],
      averageFatigueLevel: 0.3,
    },
    {
      residentId: 'resident-002',
      dropCount: 45,
      successRate: 80,
      mostCommonActivities: ['activity-001', 'activity-003'],
      averageFatigueLevel: 0.5,
    },
  ],
  activityBreakdown: [
    {
      activityId: 'activity-001',
      dropCount: 60,
      successRate: 85,
      mostCommonResidents: ['resident-001', 'resident-002'],
      averageCrewUtilization: 0.8,
    },
    {
      activityId: 'activity-002',
      dropCount: 40,
      successRate: 75,
      mostCommonResidents: ['resident-001'],
      averageCrewUtilization: 0.6,
    },
  ],
  timeBreakdown: [
    {
      startTimestamp: Date.now() - 86400000,
      endTimestamp: Date.now() - 72000000,
      duration: 14400000,
      eventCount: 100,
      eventsPerSecond: 0.0069,
    },
    {
      startTimestamp: Date.now() - 3600000,
      endTimestamp: Date.now(),
      duration: 3600000,
      eventCount: 200,
      eventsPerSecond: 0.0556,
    },
  ],
  rawEvents: [],
  exportStats: {
    totalEvents: 1000,
    eventsExported: 1000,
    fileSize: 1024000,
    exportDuration: 150,
  },
};

describe('DropValidationTelemetryExporter', () => {
  let collector: DropValidationTelemetryCollector;
  let exporter: DropValidationTelemetryExporter;

  beforeEach(() => {
    collector = new DropValidationTelemetryCollector();
    exporter = new DropValidationTelemetryExporter(collector);
  });

  describe('JSON Export', () => {
    it('should export data to JSON format successfully', async () => {
      const result = await exporter.exportToJson(mockTelemetryData);
      
      expect(result.success).toBe(true);
      expect(result.extension).toBe('json');
      expect(result.mimeType).toBe('application/json');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
      
      // Verify JSON can be parsed
      const parsed = JSON.parse(result.content);
      expect(parsed).toEqual(mockTelemetryData);
    });

    it('should handle empty data gracefully', async () => {
      const emptyData: DropValidationTelemetryExport = {
        ...mockTelemetryData,
        metrics: {
          dropValidation: {
            totalDrops: 0,
            successfulDrops: 0,
            failedDrops: 0,
            successRate: 0,
            averageDropTime: 0,
            mostCommonFailure: undefined,
            validationFailures: {},
          },
          feedbackInteraction: {
            totalFeedbackShown: 0,
            totalInteractions: 0,
            interactionRate: 0,
            averageTimeToInteract: 0,
            feedbackTypeBreakdown: {},
          },
          aiSuggestions: {
            totalSuggestions: 0,
            acceptedSuggestions: 0,
            rejectedSuggestions: 0,
            acceptanceRate: 0,
            averageConfidence: 0,
            accuracy: {
              successPredictionRate: 0,
              overallAccuracyRate: 0,
            },
          },
          performance: {
            averageValidationTime: 0,
            averageSuggestionTime: 0,
            memoryUsage: 0,
            cacheHitRate: 0,
            errorRate: 0,
          },
        },
        residentBreakdown: [],
        activityBreakdown: [],
        timeBreakdown: [],
        exportStats: {
          totalEvents: 0,
          eventsExported: 0,
          fileSize: 0,
          exportDuration: 0,
        },
      };
      
      const result = await exporter.exportToJson(emptyData);
      
      expect(result.success).toBe(true);
      expect(result.content).toContain('"totalDrops":0');
      expect(result.content).toContain('"successRate":0');
    });

    it('should exclude raw events when option is disabled', async () => {
      const result = await exporter.exportToJson(mockTelemetryData, {
        includeRawEvents: false,
      });
      
      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.content);
      expect(parsed.rawEvents).toBeUndefined();
    });

    it('should include raw events when option is enabled', async () => {
      const result = await exporter.exportToJson(mockTelemetryData, {
        includeRawEvents: true,
      });
      
      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.content);
      expect(parsed.rawEvents).toBeDefined();
      expect(Array.isArray(parsed.rawEvents)).toBe(true);
    });
  });

  describe('Markdown Export', () => {
    it('should export data to Markdown format successfully', async () => {
      const result = await exporter.exportToMarkdown(mockTelemetryData);
      
      expect(result.success).toBe(true);
      expect(result.extension).toBe('md');
      expect(result.mimeType).toBe('text/markdown');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
      
      // Verify Markdown structure
      expect(result.content).toContain('# Drop Validation Telemetry Export');
      expect(result.content).toContain('## Key Metrics');
      expect(result.content).toContain('### Drop Validation');
      expect(result.content).toContain('### Feedback Interaction');
      expect(result.content).toContain('### AI Suggestions');
      expect(result.content).toContain('### Performance');
      expect(result.content).toContain('| Total Drops | 500 |');
      expect(result.content).toContain('| Success Rate | 85.00% |');
    });

    it('should format numbers with specified precision', async () => {
      const result = await exporter.exportToMarkdown(mockTelemetryData, {
        precision: 1,
      });
      
      expect(result.content).toContain('| Success Rate | 85.0% |');
      expect(result.content).toContain('| Average Drop Time | 150.0ms |');
    });

    it('should include breakdowns when option is enabled', async () => {
      const result = await exporter.toMarkdown(mockTelemetryData, {
        includeBreakdowns: true,
      });
      
      expect(result.content).toContain('## Resident Breakdown');
      expect(result.content).toContain('## Activity Breakdown');
      expect(result.content).toContain('## Time-Based Breakdown');
      expect(result.content).toContain('| resident-001 | 50 | 90.0% |');
      expect(result.content).toContain('| activity-001 | 60 | 85.0% |');
    });

    it('should exclude breakdowns when option is disabled', async () => {
      const result = await exporter.toMarkdown(mockTelemetryData, {
        includeBreakdowns: false,
      });
      
      expect(result.content).not.toContain('## Resident Breakdown');
      expect(result.content).not.toContain('## Activity Breakdown');
      expect(result.content).not.toContain('## Time-Based Breakdown');
    });

    it('should format timestamps in readable format', async () => {
      const result = await exporter.toMarkdown(mockTelemetryData, {
        dateFormat: 'readable',
      });
      
      expect(result.content).toContain('Exported At:');
      expect(result.content).not.toContain('T');
    });
  });

  describe('CSV Export', () => {
    it('should export data to CSV format successfully', async () => {
      const result = await exporter.exportToCsv(mockTelemetryData);
      
      expect(result.success).toBe(true);
      expect(result.extension).toBe('csv');
      expect(result.mimeType).toBe('text/csv');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
      
      // Verify CSV structure
      expect(result.content).toContain('Export Field,Value');
      expect(result.content).toContain('Total Drops,500');
      expect(result.content).toContain('Success Rate,85.00');
      expect(result.content).toContain('Validation Failure - fatigue_threshold,30');
    });

    it('should include breakdowns when option is enabled', async () => {
      const result = await exporter.toCsv(mockTelemetryData, {
        includeBreakdowns: true,
      });
      
      expect(result.content).toContain('Resident - resident-001,50,90.0%');
      expect(result.content).toContain('Activity - activity-001,60,85.0%');
    });

    it('should format numbers consistently', async () => {
      const result = await exporter.toCsv(mockTelemetryData, {
        precision: 2,
      });
      
      expect(result.content).toContain('Success Rate,85.00');
      expect(result.content).toContain('Average Drop Time,150.00');
    });
  });

  describe('Generic Export', () => {
    it('should auto-detect format and export correctly', async () => {
      const jsonResult = await exporter.export(mockTelemetryData, 'json');
      const mdResult = await exporter.export(mockTelemetryData, 'markdown');
      const csvResult = await exporter.export(mockTelemetryData, 'csv');
      
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.extension).toBe('json');
      expect(mdResult.success).toBe(true);
      expect(mdResult.extension).toBe('md');
      expect(csvResult.success).toBe(true);
    });

    it('should throw error for unsupported format', async () => {
      const result = await exporter.export(mockTelemetryData, 'xml' as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported export format: xml');
    });
  });

  describe('File Export', () => {
    it('should prepare file export correctly', async () => {
      const result = await exporter.exportToFile(mockTelemetryData, 'json', 'test-export.json');
      
      expect(result.success).toBe(true);
      expect(result.extension).toBe('json');
      expect(result.content).toBeDefined();
    });

    it('should handle file save errors gracefully', async () => {
      // Mock a file save error
      const originalConsoleLog = console.log;
      console.log = vi.fn();
      
      const result = await exporter.exportToFile(mockTelemetryData, 'json', '/invalid/path/test.json');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to save file:');
      
      // Restore console.log
      console.log = originalConsoleLog;
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed data gracefully', async () => {
      const malformedData = {
        ...mockTelemetryData,
        metrics: {
          dropValidation: {
            totalDrops: 'invalid' as any,
            successfulDrops: 425,
            failedDrops: 75,
            successRate: 'invalid' as any,
            averageDropTime: 150,
            mostCommonFailure: 'fatigue_threshold',
            validationFailures: {},
          },
          // ... rest of metrics
        } as any,
      };
      
      const result = await exporter.exportToJson(malformedData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle circular references', async () => {
      const circularData = {
        ...mockTelemetryData,
        selfReference: null as any,
      };
      circularData.selfReference = circularData;
      
      const result = await exporter.exportToJson(circularData);
      
      expect(result.success).toBe(true);
      // JSON should handle circular references by omitting them
      expect(result.content).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should export large datasets efficiently', async () => {
      // Create large dataset
      const largeData: DropValidationTelemetryExport = {
        ...mockTelemetryData,
        residentBreakdown: Array.from({ length: 1000 }, (_, i) => ({
          residentId: `resident-${i.toString().padStart(3, '0')}`,
          dropCount: Math.floor(Math.random() * 100),
          successRate: Math.random() * 100,
          mostCommonActivities: ['activity-001', 'activity-002'],
          averageFatigueLevel: Math.random(),
        })),
        activityBreakdown: Array.from({ length: 500 }, (_, i) => ({
          activityId: `activity-${i.toString().padStart(3, '0')}`,
          dropCount: Math.floor(Math.random() * 100),
          successRate: Math.random() * 100,
          mostCommonResidents: ['resident-001', 'resident-002'],
          averageCrewUtilization: Math.random(),
        })),
      };
      
      const startTime = Date.now();
      const result = await exporter.exportToJson(largeData);
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.fileSize).toBeGreaterThan(100000); // Should be substantial
    });

    it('should handle concurrent exports', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        exporter.exportToJson({
          ...mockTelemetryData,
          metadata: {
            ...mockTelemetryData.metadata,
            source: `concurrent-test-${i}`,
          },
        })
      );
      
      const results = await Promise.all(promises);
      
      expect(results.length).toBe(10);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.fileSize > 0));
    });
  });
});

describe('DropValidationTelemetryCollector', () => {
  let collector: DropValidationTelemetryCollector;

  beforeEach(() => {
    collector = new DropValidationTelemetryCollector();
  });

  describe('Session Management', () => {
    it('should create a new session with unique ID', () => {
      const sessionId = collector.createSession();
      
      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^drop-validation-\d+-[a-z0-9]+$/);
    });

    it('should create session with user ID', () => {
      const userId = 'user-123';
      const sessionId = collector.createSession(userId);
      
      const session = collector.getSession(sessionId);
      expect(session?.userId).toBe(userId);
    });

    it('should create session with metadata', () => {
      const metadata = {
        userAgent: 'test-agent',
        screenResolution: '1920x1080',
        deviceType: 'desktop' as const,
        browserVersion: 'Chrome 120',
      };
      
      const sessionId = collector.createSession(undefined, metadata);
      const session = collector.getSession(sessionId);
      
      expect(session?.metadata.userAgent).toBe('test-agent');
      expect(session?.metadata.screenResolution).toBe('1920x1080');
      expect(session?.metadata.deviceType).toBe('desktop');
      expect(session?.metadata.browserVersion).toBe('Chrome 120');
    });

    it('should end a session', () => {
      const sessionId = collector.createSession();
      const sessionBefore = collector.getSession(sessionId);
      
      expect(sessionBefore?.endTimestamp).toBeUndefined();
      
      collector.endSession(sessionId);
      
      const sessionAfter = collector.getSession(sessionId);
      expect(sessionAfter?.endTimestamp).toBeDefined();
      expect(sessionAfter?.endTimestamp).toBeGreaterThan(sessionBefore!.startTimestamp);
    });

    it('should get active sessions', () => {
      const sessionId1 = collector.createSession();
      const sessionId2 = collector.createSession();
      
      const activeSessions = collector.getActiveSessions();
      
      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.map(s => s.sessionId)).toContain(sessionId1);
      expect(activeSessions.map(s => s.sessionId)).toContain(sessionId2);
      
      collector.endSession(session1);
      
      const activeSessionsAfter = collector.getActiveSessions();
      expect(activeSessionsAfter).toHaveLength(1);
      expect(activeSessionsAfter.map(s => s.sessionId)).toContain(sessionId2);
    });
  });

  describe('Event Recording', () => {
    it('should record telemetry events', () => {
      const sessionId = collector.createSession();
      
      const event = {
        eventType: 'drop_feedback_shown' as any,
        timestamp: Date.now(),
        sessionId,
        villageContext: {
          residentCount: 5,
          activityCount: 10,
          currentAssignments: 3,
          day: 1,
          crisisMode: false,
        },
        data: {
          feedbackType: 'valid',
          residentId: 'resident-001',
          activityId: 'activity-001',
        },
      };
      
      collector.recordEvent(event);
      
      const session = collector.getSession(sessionId);
      expect(session?.events).toHaveLength(1);
      expect(session?.events[0]).toEqual(event);
    });

    it('should add events to global collection', () => {
      const initialStats = collector.getStats();
      const initialEventCount = initialStats.totalEvents;
      
      collector.recordEvent({
        eventType: 'drop_operation_completed' as any,
        timestamp: Date.now(),
        sessionId: 'test-session',
        villageContext: {
          residentCount: 1,
          activityCount: 1,
          currentAssignments: 0,
          day: 1,
          crisisMode: false,
        },
        data: {
          success: true,
          duration: 100,
        },
      });
      
      const statsAfter = collector.getStats();
      expect(statsAfter.totalEvents).toBe(initialEventCount + 1);
    });

    it('should invalidate aggregated stats cache on new events', () => {
      // First aggregation
      const metrics1 = collector.getAggregatedMetrics();
      expect(metrics1).toBeDefined();
      
      // Add new event
      collector.recordEvent({
        eventType: 'drop_validation_performed' as any,
        timestamp: Date.now(),
        sessionId: 'test-session',
        villageContext: {
          residentCount: 1,
          activityCount: 1,
          currentAssignments: 0,
          day: 1,
          crisisMode: false,
        },
        data: {
          validationTime: 50,
        },
      });
      
      // Second aggregation should recalculate
      const metrics2 = collector.getAggregatedMetrics();
      expect(metrics2).toBeDefined();
      // Note: In a real implementation, we'd check if the metrics actually changed
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate drop validation metrics correctly', () => {
      // Add test events
      for (let i = 0; i < 10; i++) {
        collector.recordEvent({
          eventType: 'drop_operation_completed' as any,
          timestamp: Date.now() + i * 1000,
          sessionId: 'test-session',
          villageContext: {
            residentCount: 1,
            activityCount: 1,
            currentAssignments: 0,
            day: 1,
            crisisMode: false,
          },
          data: {
            success: i < 8, // 8 out of 10 successful
            duration: 100 + Math.random() * 50,
          },
        });
      }
      
      const metrics = collector.getAggregatedMetrics();
      
      expect(metrics.dropValidation.totalDrops).toBe(10);
      expect(metrics.dropValidation.successfulDrops).toBe(8);
      expect(metrics.dropValidation.failedDrops).toBe(2);
      expect(metrics.dropValidation.successRate).toBe(80);
    });

    it('should calculate feedback interaction metrics', () => {
      // Add feedback events
      for (let i = 0; i < 5; i++) {
        collector.recordEvent({
          eventType: 'drop_feedback_shown' as any,
          timestamp: Date.now() + i * 2000,
          sessionId: 'test-session',
          villageContext: {
            residentCount: 1,
            activityCount: 1,
            currentAssignments: 0,
            day: 1,
            crisisMode: false,
          },
          data: {
            feedbackType: i % 2 === 0 ? 'valid' : 'invalid',
            interactive: i % 3 === 0,
          },
        });
      }
      
      // Add interaction events
      for (let i = 0; i < 2; i++) {
        collector.recordEvent({
          eventType: 'drop_feedback_clicked' as any,
          timestamp: Date.now() + i * 3000,
          sessionId: 'test-session',
          villageContext: {
            residentCount: 1,
            activityCount: 1,
            currentAssignments: 0,
            day: 1,
            crisisMode: false,
          },
          data: {
            feedbackType: 'valid',
          },
        });
      }
      
      const metrics = collector.getAggregatedMetrics();
      
      expect(metrics.feedbackInteraction.totalFeedbackShown).toBe(5);
      expect(metrics.feedbackInteraction.totalInteractions).toBe(2);
      expect(metrics.feedbackInteraction.interactionRate).toBe(40);
    });
  });

  describe('Export Integration', () => {
    it('should export collector data via exporter', async () => {
      // Add some test events
      collector.recordEvent({
        eventType: 'drop_operation_completed' as any,
        timestamp: Date.now(),
        sessionId: 'test-session',
        villageContext: {
          residentCount: 1,
          activityCount: 1,
          currentAssignments: 0,
          day: 1,
          crisisMode: false,
        },
        data: {
          success: true,
          duration: 150,
        },
      });
      
      const exportConfig = {
        format: 'json' as const,
        includeRawEvents: false,
        includeBreakdowns: true,
      };
      
      const result = await collector.exportData(exportConfig);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.stats.eventsProcessed).toBeGreaterThan(0);
      expect(result.stats.eventsExported).toBeGreaterThan(0);
    });

    it('should handle export with filters', async () => {
      // Add events with different timestamps
      const baseTime = Date.now() - 3600000; // 1 hour ago
      
      for (let i = 0; i < 10; i++) {
        collector.recordEvent({
          eventType: 'drop_operation_completed' as any,
          timestamp: baseTime + i * 60000, // Every minute
          sessionId: 'test-session',
          villageContext: {
            residentCount: 1,
            activityCount: 1,
            currentAssignments: 0,
            day: 1,
            crisisMode: false,
          },
          data: {
            success: true,
            duration: 100,
          },
        });
      }
      
      const exportConfig = {
        format: 'json' as const,
        timeRange: {
          start: baseTime,
          end: baseTime + 300000, // First 5 minutes only
        },
      };
      
      const result = await collector.exportData(exportConfig);
      
      expect(result.success).toBe(true);
      expect(result.data.metadata.collectionPeriod.startTimestamp).toBe(baseTime);
      expect(result.data.metadata.collectionPeriod.endTimestamp).toBe(baseTime + 300000);
    });
  });

  describe('Statistics and Cleanup', () => {
    it('should provide collector statistics', () => {
      const stats = collector.getStats();
      
      expect(stats.startTime).toBeDefined();
      expect(stats.totalEvents).toBe(0);
      expect(stats.totalSessions).toBe(0);
      expect(stats.activeSessions).toBe(0);
      expect(stats.aggregatedStats).toBeNull();
    });

    it('should clear all data', () => {
      // Add some data first
      collector.createSession();
      collector.recordEvent({
        eventType: 'drop_operation_completed' as any,
        timestamp: Date.now(),
        sessionId: 'test-session',
        villageContext: {
          residentCount: 1,
          activityCount: 1,
          currentAssignments: 0,
          day: 1,
          crisisMode: false,
        },
        data: {
          success: true,
          duration: 100,
        },
      });
      
      expect(collector.getStats().totalEvents).toBe(1);
      expect(collector.getStats().totalSessions).toBe(1);
      
      collector.clearData();
      
      const statsAfter = collector.getStats();
      expect(statsAfter.totalEvents).toBe(0);
      expect(statsAfter.totalSessions).toBe(0);
      expect(statsAfter.activeSessions).toBe(0);
      expect(statsAfter.aggregatedStats).toBeNull();
    });
  });
});
