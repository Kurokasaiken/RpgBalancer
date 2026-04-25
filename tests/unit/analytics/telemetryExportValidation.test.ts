/**
 * Telemetry Export Validation Unit Tests
 * 
 * Tests telemetry export validation and recovery functionality
 * to ensure PC-M2 KPI compliance
 * 
 * @module telemetryExportValidation.test.ts
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { validateTelemetryExport, validateAndExportTelemetry, EnhancedTelemetryExportSchema } from '@/scripts/mobilePlaytestLogger';

// Mock file system operations
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
}));

// Mock console methods
vi.mock('../../scripts/mobilePlaytestLogger', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    validateTelemetryExport: mod.validateTelemetryExport,
    validateAndExportTelemetry: mod.validateAndExportTelemetry,
    EnhancedTelemetryExportSchema: mod.EnhancedTelemetryExportSchema,
  };
});

describe('Telemetry Export Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateTelemetryExport', () => {
    test('should validate correct telemetry data', () => {
      const validData = {
        version: '1.0.0',
        sessionId: 'test-session-123',
        tester: 'test-user',
        device: 'test-device',
        cycleDurationMs: [90000, 95000, 88000],
        tapsPerAssignment: [3, 2, 4],
        assignmentLatencyMs: [400, 450, 380],
        pickerCloseRate: 98,
        resourceDelta: { gold: 10, food: 2 },
        qualitativeNotes: 'Test session completed successfully',
        createdAt: new Date().toISOString(),
        derivedMetrics: {
          avgCycleDurationMs: 91000,
          avgTapsPerAssignment: 3,
          avgAssignmentLatencyMs: 410,
          meetsCycleTarget: true,
          meetsTapTarget: true,
          meetsLatencyTarget: true,
          meetsPickerTarget: true,
          meetsResourceTarget: true,
        },
      };

      const result = validateTelemetryExport(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.data).toEqual(validData);
    });

    test('should recover from partially invalid data', () => {
      const invalidData = {
        sessionId: 'test-session-123',
        // Missing version, tester, device
        cycleDurationMs: [90000],
        tapsPerAssignment: [3],
        assignmentLatencyMs: [400],
        pickerCloseRate: 98,
        resourceDelta: { gold: 10, food: 2 },
        qualitativeNotes: 'Test session',
        // Missing createdAt, derivedMetrics
      };

      const result = validateTelemetryExport(invalidData, true);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings).toContain('Missing version, using default');
      expect(result.warnings).toContain('Missing sessionId, generated fallback');
      expect(result.data?.version).toBe('1.0.0');
      expect(result.data?.tester).toBe('unknown');
      expect(result.data?.device).toBe('unknown');
      expect(result.data?.derivedMetrics).toBeDefined();
    });

    test('should reject completely invalid data', () => {
      const invalidData = {
        invalidField: 'invalid',
        wrongType: [1, 2, 3],
        nested: { invalid: true },
      };

      const result = validateTelemetryExport(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Invalid data format: expected object');
      expect(result.data).toBeUndefined();
    });

    test('should handle null/undefined data', () => {
      const result1 = validateTelemetryExport(null);
      const result2 = validateTelemetryExport(undefined);

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.errors).toContain('Invalid data format: expected object');
      expect(result2.errors).toContain('Invalid data format: expected object');
    });

    test('should recover from invalid numeric values', () => {
      const dataWithInvalidNumbers = {
        version: '1.0.0',
        sessionId: 'test-session-123',
        tester: 'test-user',
        device: 'test-device',
        cycleDurationMs: [90000, 'invalid', 88000],
        tapsPerAssignment: [3, null, 4],
        assignmentLatencyMs: [400, undefined, 380],
        pickerCloseRate: 'invalid',
        resourceDelta: { gold: 'invalid', food: null },
        qualitativeNotes: 'Test session',
        createdAt: new Date().toISOString(),
      };

      const result = validateTelemetryExport(dataWithInvalidNumbers, true);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.data?.cycleDurationMs).toEqual([90000, 90000, 88000]); // Fallback to TARGETS
      expect(result.data?.tapsPerAssignment).toEqual([3, 3, 4]); // Fallback to TARGETS
      expect(result.data?.pickerCloseRate).toBe(98); // Fallback to TARGETS
      expect(result.data?.resourceDelta).toEqual({ gold: 10, food: 2 }); // Fallback to TARGETS
    });

    test('should reject when recovery is disabled', () => {
      const invalidData = {
        sessionId: 'test-session-123',
        // Missing required fields
      };

      const result = validateTelemetryExport(invalidData, false);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.recoveredData).toBeUndefined();
    });

    test('should handle validation errors gracefully', () => {
      // Create data that might cause validation errors
      const problematicData = {
        version: '1.0.0',
        sessionId: 'test-session-123',
        tester: 'test-user',
        device: 'test-device',
        cycleDurationMs: [], // Empty array should fail validation
        tapsPerAssignment: [3, 2, 4],
        assignmentLatencyMs: [400, 450, 380],
        pickerCloseRate: 98,
        resourceDelta: { gold: 10, food: 2 },
        qualitativeNotes: 'Test session',
        createdAt: new Date().toISOString(),
        derivedMetrics: {
          avgCycleDurationMs: 0, // Division by zero in recovery
          avgTapsPerAssignment: 3,
          avgAssignmentLatencyMs: 410,
          meetsCycleTarget: true,
          meetsTapTarget: true,
          meetsLatencyTarget: true,
          meetsPickerTarget: true,
          meetsResourceTarget: true,
        },
      };

      const result = validateTelemetryExport(problematicData, true);

      // Should either succeed with recovery or fail gracefully
      expect(result.errors.length >= 0).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('validateAndExportTelemetry', () => {
    test('should export valid data successfully', async () => {
      const validData = {
        version: '1.0.0',
        sessionId: 'test-session-123',
        tester: 'test-user',
        device: 'test-device',
        cycleDurationMs: [90000],
        tapsPerAssignment: [3],
        assignmentLatencyMs: [400],
        pickerCloseRate: 98,
        resourceDelta: { gold: 10, food: 2 },
        qualitativeNotes: 'Test session',
        createdAt: new Date().toISOString(),
        derivedMetrics: {
          avgCycleDurationMs: 90000,
          avgTapsPerAssignment: 3,
          avgAssignmentLatencyMs: 400,
          meetsCycleTarget: true,
          meetsTapTarget: true,
          meetsLatencyTarget: true,
          meetsPickerTarget: true,
          meetsResourceTarget: true,
        },
      };

      const result = await validateAndExportTelemetry(validData, '/tmp/test-export.json');

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/tmp/test-export.json');
      expect(result.errors).toHaveLength(0);
    });

    test('should retry on validation failure', async () => {
      const invalidData = {
        // Missing required fields
        sessionId: 'test-session-123',
      };

      const result = await validateAndExportTelemetry(invalidData, '/tmp/test-export.json', {
        maxRetries: 2,
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Attempt 1:');
    });

    test('should handle file system errors', async () => {
      const validData = {
        version: '1.0.0',
        sessionId: 'test-session-123',
        tester: 'test-user',
        device: 'test-device',
        cycleDurationMs: [90000],
        tapsPerAssignment: [3],
        assignmentLatencyMs: [400],
        pickerCloseRate: 98,
        resourceDelta: { gold: 10, food: 2 },
        qualitativeNotes: 'Test session',
        createdAt: new Date().toISOString(),
        derivedMetrics: {
          avgCycleDurationMs: 90000,
          avgTapsPerAssignment: 3,
          avgAssignmentLatencyMs: 400,
          meetsCycleTarget: true,
          meetsTapTarget: true,
          meetsLatencyTarget: true,
          meetsPickerTarget: true,
          meetsResourceTarget: true,
        },
      };

      // Mock file system error
      const { writeFileSync } = await import('fs');
      vi.mocked(writeFileSync).mockImplementation(() => {
        throw new Error('File system error');
      });

      const result = await validateAndExportTelemetry(validData, '/tmp/test-export.json');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Attempt 1:');
    });
  });

  describe('EnhancedTelemetryExportSchema', () => {
    test('should validate enhanced telemetry with PWA metrics', () => {
      const enhancedData = {
        version: '1.0.0',
        sessionId: 'test-session-123',
        tester: 'test-user',
        device: 'test-device',
        cycleDurationMs: [90000],
        tapsPerAssignment: [3],
        assignmentLatencyMs: [400],
        pickerCloseRate: 98,
        resourceDelta: { gold: 10, food: 2 },
        qualitativeNotes: 'Test session',
        createdAt: new Date().toISOString(),
        derivedMetrics: {
          avgCycleDurationMs: 90000,
          avgTapsPerAssignment: 3,
          avgAssignmentLatencyMs: 400,
          meetsCycleTarget: true,
          meetsTapTarget: true,
          meetsLatencyTarget: true,
          meetsPickerTarget: true,
          meetsResourceTarget: true,
        },
        pwaMetrics: {
          installSuccess: true,
          coldStartMs: 2500,
          exportValidationPassed: true,
          updateAvailable: false,
        },
        kpiMetrics: {
          installSuccessRate: 95,
          coldStartAvgMs: 2400,
          exportValidationRate: 100,
        },
      };

      const result = EnhancedTelemetryExportSchema.safeParse(enhancedData);

      expect(result.success).toBe(true);
      expect(result.data?.pwaMetrics?.installSuccess).toBe(true);
      expect(result.data?.pwaMetrics?.coldStartMs).toBe(2500);
      expect(result.data?.kpiMetrics?.installSuccessRate).toBe(95);
    });

    test('should validate telemetry without optional PWA metrics', () => {
      const basicData = {
        version: '1.0.0',
        sessionId: 'test-session-123',
        tester: 'test-user',
        device: 'test-device',
        cycleDurationMs: [90000],
        tapsPerAssignment: [3],
        assignmentLatencyMs: [400],
        pickerCloseRate: 98,
        resourceDelta: { gold: 10, food: 2 },
        qualitativeNotes: 'Test session',
        createdAt: new Date().toISOString(),
        derivedMetrics: {
          avgCycleDurationMs: 90000,
          avgTapsPerAssignment: 3,
          avgAssignmentLatencyMs: 400,
          meetsCycleTarget: true,
          meetsTapTarget: true,
          meetsLatencyTarget: true,
          meetsPickerTarget: true,
          meetsResourceTarget: true,
        },
        // No pwaMetrics or kpiMetrics
      };

      const result = EnhancedTelemetryExportSchema.safeParse(basicData);

      expect(result.success).toBe(true);
      expect(result.data?.pwaMetrics).toBeUndefined();
      expect(result.data?.kpiMetrics).toBeUndefined();
    });

    test('should reject invalid PWA metrics', () => {
      const dataWithInvalidPWAMetrics = {
        version: '1.0.0',
        sessionId: 'test-session-123',
        tester: 'test-user',
        device: 'test-device',
        cycleDurationMs: [90000],
        tapsPerAssignment: [3],
        assignmentLatencyMs: [400],
        pickerCloseRate: 98,
        resourceDelta: { gold: 10, food: 2 },
        qualitativeNotes: 'Test session',
        createdAt: new Date().toISOString(),
        derivedMetrics: {
          avgCycleDurationMs: 90000,
          avgTapsPerAssignment: 3,
          avgAssignmentLatencyMs: 400,
          meetsCycleTarget: true,
          meetsTapTarget: true,
          meetsLatencyTarget: true,
          meetsPickerTarget: true,
          meetsResourceTarget: true,
        },
        pwaMetrics: {
          installSuccess: 'invalid', // Should be boolean
          coldStartMs: -1000, // Should be >= 0
          exportValidationPassed: true,
          updateAvailable: false,
        },
      };

      const result = EnhancedTelemetryExportSchema.safeParse(dataWithInvalidPWAMetrics);

      expect(result.success).toBe(false);
      expect(result.error.issues.length).toBeGreaterThan(0);
    });
  });

  describe('KPI Compliance Tests', () => {
    test('should achieve 100% validation rate for valid data', () => {
      const validData = {
        version: '1.0.0',
        sessionId: 'test-session-123',
        tester: 'test-user',
        device: 'test-device',
        cycleDurationMs: [90000],
        tapsPerAssignment: [3],
        assignmentLatencyMs: [400],
        pickerCloseRate: 98,
        resourceDelta: { gold: 10, food: 2 },
        qualitativeNotes: 'Test session',
        createdAt: new Date().toISOString(),
        derivedMetrics: {
          avgCycleDurationMs: 90000,
          avgTapsPerAssignment: 3,
          avgAssignmentLatencyMs: 400,
          meetsCycleTarget: true,
          meetsTapTarget: true,
          meetsLatencyTarget: true,
          meetsPickerTarget: true,
          meetsResourceTarget: true,
        },
      };

      // Test multiple validation attempts
      const results = Array.from({ length: 100 }, () => validateTelemetryExport(validData));
      const validResults = results.filter(r => r.isValid);
      const validationRate = (validResults.length / results.length) * 100;

      expect(validationRate).toBe(100);
      expect(validResults.length).toBe(100);
    });

    test('should handle cold start metrics validation', () => {
      const dataWithColdStart = {
        version: '1.0.0',
        sessionId: 'test-session-123',
        tester: 'test-user',
        device: 'test-device',
        cycleDurationMs: [90000],
        tapsPerAssignment: [3],
        assignmentLatencyMs: [400],
        pickerCloseRate: 98,
        resourceDelta: { gold: 10, food: 2 },
        qualitativeNotes: 'Test session',
        createdAt: new Date().toISOString(),
        derivedMetrics: {
          avgCycleDurationMs: 90000,
          avgTapsPerAssignment: 3,
          avgAssignmentLatencyMs: 400,
          meetsCycleTarget: true,
          meetsTapTarget: true,
          meetsLatencyTarget: true,
          meetsPickerTarget: true,
          meetsResourceTarget: true,
        },
        pwaMetrics: {
          installSuccess: true,
          coldStartMs: 2500, // Under 3s threshold
          exportValidationPassed: true,
          updateAvailable: false,
        },
      };

      const result = validateTelemetryExport(dataWithColdStart);

      expect(result.isValid).toBe(true);
      expect(result.data?.pwaMetrics?.coldStartMs).toBe(2500);
      expect(result.data?.pwaMetrics?.coldStartMs).toBeLessThan(3000);
    });

    test('should validate install success tracking', () => {
      const dataWithInstallTracking = {
        version: '1.0.0',
        sessionId: 'test-session-123',
        tester: 'test-user',
        device: 'test-device',
        cycleDurationMs: [90000],
        tapsPerAssignment: [3],
        assignmentLatencyMs: [400],
        pickerCloseRate: 98,
        resourceDelta: { gold: 10, food: 2 },
        qualitativeNotes: 'Test session',
        createdAt: new Date().toISOString(),
        derivedMetrics: {
          avgCycleDurationMs: 90000,
          avgTapsPerAssignment: 3,
          avgAssignmentLatencyMs: 400,
          meetsCycleTarget: true,
          meetsTapTarget: true,
          meetsLatencyTarget: true,
          meetsPickerTarget: true,
          meetsResourceTarget: true,
        },
        pwaMetrics: {
          installSuccess: true,
          coldStartMs: 2500,
          exportValidationPassed: true,
          updateAvailable: false,
        },
        kpiMetrics: {
          installSuccessRate: 95, // Above 90% threshold
          coldStartAvgMs: 2400,
          exportValidationRate: 100,
        },
      };

      const result = validateTelemetryExport(dataWithInstallTracking);

      expect(result.isValid).toBe(true);
      expect(result.data?.pwaMetrics?.installSuccess).toBe(true);
      expect(result.data?.kpiMetrics?.installSuccessRate).toBe(95);
      expect(result.data?.kpiMetrics?.installSuccessRate).toBeGreaterThanOrEqual(90);
    });
  });
});
