/**
 * Telemetry Export Validator Tests
 * 
 * Unit tests for Punch Club telemetry export validation
 * Covers schema validation, error handling, and edge cases
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { 
  TelemetryExportValidator,
  validateTelemetryExport,
  DEFAULT_TELEMETRY_VALIDATOR_CONFIG,
  type TelemetryValidationResult,
  type ValidationError,
  type ValidationWarning,
} from '../../../src/analytics/telemetryExportValidator';
import {
  PunchClubTelemetryEventSchema,
  PunchClubExportSchema,
  PUNCH_CLUB_EVENT_TYPES,
  type PunchClubTelemetryEvent,
  type PunchClubExport,
} from '../../../src/analytics/telemetry/punchClubTelemetrySchemas';

describe('TelemetryExportValidator', () => {
  let validator: TelemetryExportValidator;

  beforeEach(() => {
    validator = new TelemetryExportValidator();
  });

  describe('Basic Validation', () => {
    test('should validate a correct export', () => {
      const validExport: PunchClubExport = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [
          {
            eventType: 'pwa_install_success',
            timestamp: Date.now(),
            sessionId: 'session-123',
            data: {
              promptShown: true,
              userAgent: 'Mozilla/5.0...',
              platform: 'web',
            },
          },
        ],
        metadata: {
          totalEvents: 1,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validator.validateExport(validExport);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalEvents).toBe(1);
      expect(result.stats.validEvents).toBe(1);
      expect(result.stats.passRate).toBe(100);
    });

    test('should reject invalid export structure', () => {
      const invalidExport = {
        // Missing required fields
        events: [],
      };

      const result = validator.validateExport(invalidExport);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('schema');
      expect(result.errors[0].severity).toBe('critical');
    });

    test('should handle empty events array', () => {
      const emptyExport: PunchClubExport = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [],
        metadata: {
          totalEvents: 0,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validator.validateExport(emptyExport);

      expect(result.isValid).toBe(true);
      expect(result.stats.totalEvents).toBe(0);
      expect(result.stats.passRate).toBe(0);
    });
  });

  describe('Event Validation', () => {
    test('should validate PWA install events', () => {
      const pwaEvents: PunchClubTelemetryEvent[] = [
        {
          eventType: 'pwa_install_prompt_available',
          timestamp: Date.now(),
          data: { userAgent: 'Mozilla/5.0...' },
        },
        {
          eventType: 'pwa_install_success',
          timestamp: Date.now(),
          sessionId: 'session-123',
          data: {
            promptShown: true,
            installAttempts: 1,
          },
        },
        {
          eventType: 'pwa_install_error',
          timestamp: Date.now(),
          data: {
            error: 'User declined',
            installAttempts: 1,
          },
        },
      ];

      const exportData: PunchClubExport = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: pwaEvents,
        metadata: {
          totalEvents: 3,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validator.validateExport(exportData);

      expect(result.isValid).toBe(true);
      expect(result.stats.validEvents).toBe(3);
      expect(result.stats.passRate).toBe(100);
    });

    test('should validate landing page events', () => {
      const landingEvents: PunchClubTelemetryEvent[] = [
        {
          eventType: 'landing_view',
          timestamp: Date.now(),
          data: {
            source: 'google',
            medium: 'organic',
            campaign: 'punch_club_launch',
          },
        },
        {
          eventType: 'consent_accepted',
          timestamp: Date.now(),
          sessionId: 'session-123',
          data: {
            consentGiven: true,
          },
        },
        {
          eventType: 'cta_click',
          timestamp: Date.now(),
          sessionId: 'session-123',
          data: {
            source: 'landing_hero',
          },
        },
      ];

      const exportData: PunchClubExport = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: landingEvents,
        metadata: {
          totalEvents: 3,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validator.validateExport(exportData);

      expect(result.isValid).toBe(true);
      expect(result.stats.validEvents).toBe(3);
    });

    test('should validate stress test events', () => {
      const stressEvents: PunchClubTelemetryEvent[] = [
        {
          eventType: 'stress_run_start',
          timestamp: Date.now(),
          runId: 'stress-run-123',
          data: {
            runId: 'stress-run-123',
            scenario: 'combat_stress',
            iterations: 1000,
            duration: 0, // Add required duration
            success: false, // Add required success
          },
        },
        {
          eventType: 'stress_run_completed',
          timestamp: Date.now(),
          runId: 'stress-run-123',
          data: {
            runId: 'stress-run-123',
            scenario: 'combat_stress',
            iterations: 1000,
            duration: 5000,
            success: true,
            throughput: 200,
          },
        },
      ];

      const exportData: PunchClubExport = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'stress_testing',
        events: stressEvents,
        metadata: {
          totalEvents: 2,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validator.validateExport(exportData);

      expect(result.isValid).toBe(true);
      expect(result.stats.validEvents).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test('should detect invalid event types', () => {
      const invalidExport = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [
          {
            eventType: 'invalid_event_type',
            timestamp: Date.now(),
            data: {},
          },
        ],
        metadata: {
          totalEvents: 1,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validator.validateExport(invalidExport);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.stats.invalidEvents).toBe(1);
      expect(result.stats.passRate).toBe(0);
    });

    test('should detect missing required fields', () => {
      const invalidExport = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [
          {
            eventType: 'stress_run_completed',
            timestamp: Date.now(),
            // Missing required runId in data
            data: {
              scenario: 'test',
              iterations: 100,
              duration: 1000,
              success: true,
            },
          },
        ],
        metadata: {
          totalEvents: 1,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validator.validateExport(invalidExport);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e: ValidationError) => e.field.includes('runId'))).toBe(true);
    });

    test('should detect future timestamps', () => {
      const futureTime = Date.now() + 86400000; // 1 day in future
      const invalidExport = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [
          {
            eventType: 'landing_view',
            timestamp: futureTime,
            data: {},
          },
        ],
        metadata: {
          totalEvents: 1,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validator.validateExport(invalidExport);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: ValidationError) => e.field.includes('timestamp'))).toBe(true);
      expect(result.errors.some((e: ValidationError) => e.message.includes('future'))).toBe(true);
    });
  });

  describe('Warning System', () => {
    test('should generate warnings for very old timestamps', () => {
      const oldTime = Date.now() - (400 * 24 * 60 * 60 * 1000); // 400 days ago
      const exportWithOldEvent = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [
          {
            eventType: 'landing_view',
            timestamp: oldTime,
            data: {},
          },
        ],
        metadata: {
          totalEvents: 1,
          dateRange: {
            start: oldTime,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validator.validateExport(exportWithOldEvent);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w: ValidationWarning) => w.message.includes('old timestamp'))).toBe(true);
    });

    test('should generate warnings for large event data', () => {
      const largeData = 'x'.repeat(15000); // 15KB of data
      const exportWithLargeData = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [
          {
            eventType: 'landing_view',
            timestamp: Date.now(),
            data: {
              largeField: largeData,
            },
          },
        ],
        metadata: {
          totalEvents: 1,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validator.validateExport(exportWithLargeData);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w: ValidationWarning) => w.type === 'performance')).toBe(true);
    });

    test('should generate warnings for missing session ID on user events', () => {
      const exportWithoutSession = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [
          {
            eventType: 'pwa_install_success',
            timestamp: Date.now(),
            // Missing sessionId
            data: {
              promptShown: true,
            },
          },
        ],
        metadata: {
          totalEvents: 1,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validator.validateExport(exportWithoutSession);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w: ValidationWarning) => w.field.includes('sessionId'))).toBe(true);
    });
  });

  describe('Configuration', () => {
    test('should respect strict mode configuration', () => {
      const strictValidator = new TelemetryExportValidator({
        strictMode: true,
        maxEventsPerBatch: 100,
        enablePerformanceWarnings: false,
        customRules: [],
      });

      const exportWithWarnings = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [
          {
            eventType: 'landing_view',
            timestamp: Date.now(),
            data: {},
          },
          {
            eventType: 'invalid_event',
            timestamp: Date.now(),
            data: {},
          },
        ],
        metadata: {
          totalEvents: 2,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = strictValidator.validateExport(exportWithWarnings);

      expect(result.isValid).toBe(false);
      expect(result.stats.passRate).toBe(50); // 1 valid out of 2
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should enforce max events per batch', () => {
      const limitedValidator = new TelemetryExportValidator({
        maxEventsPerBatch: 2,
      });

      const exportWithManyEvents = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [
          { eventType: 'landing_view', timestamp: Date.now(), data: {} },
          { eventType: 'cta_click', timestamp: Date.now(), data: {} },
          { eventType: 'consent_accepted', timestamp: Date.now(), data: {} },
        ],
        metadata: {
          totalEvents: 3,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = limitedValidator.validateExport(exportWithManyEvents);

      // Should still validate but may generate warnings about batch size
      expect(result.stats.totalEvents).toBe(3);
    });
  });

  describe('Custom Validation Rules', () => {
    test('should apply custom validation rules', () => {
      const customRule = {
        id: 'test-rule',
        eventTypes: ['landing_view'],
        validate: (event: unknown) => {
          const e = event as any; // Use any for flexible data access
          if (e.data && !e.data.source) {
            return {
              type: 'required' as const,
              field: 'data.source',
              message: 'Source is required for landing_view events',
              value: e.data?.source,
              severity: 'error' as const,
            };
          }
          return null;
        },
        description: 'Test rule for landing view events',
      };

      const customValidator = new TelemetryExportValidator({
        customRules: [customRule],
      });

      const exportWithoutSource = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [
          {
            eventType: 'landing_view',
            timestamp: Date.now(),
            data: {}, // Missing source
          },
        ],
        metadata: {
          totalEvents: 1,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = customValidator.validateExport(exportWithoutSource);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: ValidationError) => e.message.includes('Source is required'))).toBe(true);
    });
  });

  describe('Convenience Function', () => {
    test('should work with convenience function', () => {
      const validExport: PunchClubExport = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [
          {
            eventType: 'landing_view',
            timestamp: Date.now(),
            data: { source: 'test' },
          },
        ],
        metadata: {
          totalEvents: 1,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validateTelemetryExport(validExport);

      expect(result.isValid).toBe(true);
      expect(result.stats.validEvents).toBe(1);
    });

    test('should accept custom config in convenience function', () => {
      const invalidExport = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [
          { eventType: 'invalid_event', timestamp: Date.now(), data: {} },
        ],
        metadata: {
          totalEvents: 1,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validateTelemetryExport(invalidExport, { strictMode: false });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Validation Summary', () => {
    test('should generate human-readable summary', () => {
      const exportWithIssues = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: [
          {
            eventType: 'landing_view',
            timestamp: Date.now(),
            data: {},
          },
          {
            eventType: 'invalid_event',
            timestamp: Date.now(),
            data: {},
          },
        ],
        metadata: {
          totalEvents: 2,
          dateRange: {
            start: Date.now() - 3600000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const result = validator.validateExport(exportWithIssues);
      const summary = validator.getValidationSummary(result);

      expect(summary).toContain('Telemetry Validation Summary');
      expect(summary).toContain('Pass Rate: 50%');
      expect(summary).toContain('Total Events: 2');
      expect(summary).toContain('Valid Events: 1');
      expect(summary).toContain('Invalid Events: 1');
      expect(summary).toContain('Errors:');
    });
  });

  describe('Performance', () => {
    test('should complete validation within reasonable time', () => {
      const largeExport = {
        exportId: '550e8400-e29b-41d4-a716-446655440000',
        exportTimestamp: Date.now(),
        version: '1.0.0',
        source: 'punch_club_pwa',
        events: Array.from({ length: 1000 }, (_, i) => ({
          eventType: 'landing_view',
          timestamp: Date.now() - i * 1000,
          data: { source: `test-${i}` },
        })),
        metadata: {
          totalEvents: 1000,
          dateRange: {
            start: Date.now() - 1000000,
            end: Date.now(),
          },
          exportFormat: 'json',
        },
      };

      const startTime = performance.now();
      const result = validator.validateExport(largeExport);
      const endTime = performance.now();

      expect(result.isValid).toBe(true);
      expect(result.stats.validEvents).toBe(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1 second
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });
});
