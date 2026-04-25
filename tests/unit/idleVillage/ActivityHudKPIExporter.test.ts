/**
 * NP-087 – Activity HUD KPI Exporter Unit Tests
 * 
 * Comprehensive test suite for Activity HUD KPI export functionality,
 * including schema validation, filtering, export formats, and CLI operations.
 * 
 * @since 2026-01-21
 * @author Atlas-Idle – HUD Analytics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ActivityKPISchema,
  ActivityHUDKPIExportSchema,
  ActivityHUDKPIFilterSchema,
  ActivityHUDKPIExportOptionsSchema,
  ActivityHUDExportedTelemetrySchema,
  validateActivityKPI,
  validateActivityHUDKPIExport,
  validateActivityHUDKPIFilter,
  validateActivityHUDKPIExportOptions,
  validateActivityHUDExportedTelemetry,
  createDefaultActivityKPI,
  createDefaultActivityHUDKPIFilter,
  createDefaultActivityHUDKPIExportOptions,
  createActivityHUDExportedTelemetry,
  type ActivityKPI,
  type ActivityHUDKPIExport,
  type ActivityHUDKPIFilter,
  type ActivityHUDKPIExportOptions,
  type ActivityHUDExportedTelemetry,
  type ResidentActivitySummary,
  type LocationActivitySummary
} from '@/ui/idleVillage/activeHud/ActivityHudKPIExporter';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe('ActivityHUDKPIExporter', () => {
  beforeEach(() => {
    // Mock console methods to avoid noise in tests
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    
    vi.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should validate a complete Activity KPI', () => {
      const validKPI: ActivityKPI = {
        id: 'activity-1',
        name: 'Test Activity',
        type: 'job',
        status: 'active',
        locationId: 'forest-1',
        locationName: 'Forest Area 1',
        assignedResidents: ['resident-1', 'resident-2'],
        assignedResidentNames: ['Alice', 'Bob'],
        progress: 75.5,
        estimatedTimeRemainingMin: 30,
        elapsedTimeMin: 45,
        successRate: 85.2,
        dropSuccessRate: 92.1,
        totalDrops: 15,
        successfulDrops: 14,
        failedDrops: 1,
        priority: 7,
        tags: ['outdoor', 'gathering'],
        startedAt: Date.now() - 3600000,
        lastUpdated: Date.now() - 60000,
        completedAt: null,
        performanceScore: 88.5,
        efficiencyScore: 91.2,
      };
      
      const result = validateActivityKPI(validKPI);
      expect(result).toEqual(validKPI);
    });

    it('should reject invalid Activity KPI data', () => {
      const invalidKPI = {
        id: 'activity-1',
        name: 'Test Activity',
        type: 'invalid_type', // Invalid type
        status: 'active',
        progress: 150, // Invalid: > 100
        successRate: -10, // Invalid: < 0
      };
      
      expect(() => validateActivityKPI(invalidKPI)).toThrow();
    });

    it('should validate complete KPI export data', () => {
      const validExport: ActivityHUDKPIExport = {
        exportMetadata: {
          exportedAt: Date.now(),
          version: '1.0.0',
          source: 'manual',
          format: 'json',
          totalRecords: 10,
        },
        summary: {
          totalActiveActivities: 5,
          totalCompletedActivities: 3,
          overallSuccessRate: 85.5,
          overallDropSuccessRate: 90.2,
          averageActivityDurationMin: 45.5,
          totalActiveResidents: 8,
          totalUtilizedLocations: 4,
          globalEfficiencyScore: 87.8,
        },
        activities: [
          createDefaultActivityKPI({ id: 'activity-1', name: 'Test Activity' })
        ],
        residentSummaries: [
          {
            id: 'resident-1',
            name: 'Alice',
            currentActivityId: 'activity-1',
            currentActivityName: 'Test Activity',
            totalCompleted: 5,
            totalFailed: 1,
            averageSuccessRate: 85.0,
            averageCompletionTimeMin: 42.0,
            currentFatigue: 25.5,
            currentHappiness: 75.0,
            activeSkills: ['strength', 'agility'],
            performanceTrend: 'improving',
          }
        ],
        locationSummaries: [
          {
            id: 'forest-1',
            name: 'Forest Area 1',
            type: 'forest',
            totalActivities: 3,
            activeActivities: 2,
            averageSuccessRate: 88.0,
            utilizationRate: 66.7,
            dominantActivityType: 'job',
            efficiencyScore: 90.5,
          }
        ],
      };
      
      const result = validateActivityHUDKPIExport(validExport);
      expect(result).toEqual(validExport);
    });

    it('should validate export filter configuration', () => {
      const validFilter: ActivityHUDKPIFilter = {
        activityTypes: ['job', 'quest'],
        activityStatuses: ['active', 'completed'],
        locationIds: ['forest-1', 'mine-1'],
        residentIds: ['resident-1', 'resident-2'],
        progressRange: { min: 50, max: 100 },
        successRateRange: { min: 80, max: 100 },
        priorityRange: { min: 5, max: 10 },
        tags: ['outdoor', 'critical'],
        performanceScoreRange: { min: 70, max: 100 },
      };
      
      const result = validateActivityHUDKPIFilter(validFilter);
      expect(result).toEqual(validFilter);
    });

    it('should validate export options', () => {
      const validOptions: ActivityHUDKPIExportOptions = {
        format: 'json',
        includeMetadata: true,
        includeResidentSummaries: true,
        includeLocationSummaries: true,
        sortBy: 'progress',
        sortOrder: 'desc',
        limit: 100,
        offset: 0,
        includeInactive: false,
        includeCompleted: true,
        includeFailed: true,
      };
      
      const result = validateActivityHUDKPIExportOptions(validOptions);
      expect(result).toEqual(validOptions);
    });

    it('should validate telemetry event data', () => {
      const baseExport = createDefaultActivityKPIExport();
      const telemetry: ActivityHUDExportedTelemetry = createActivityHUDExportedTelemetry(
        baseExport,
        1500,
        2048
      );
      
      const result = validateActivityHUDExportedTelemetry(telemetry);
      expect(result.eventType).toBe('iv_activity_hud_exported');
      expect(result.timestamp).toBeTypeOf('number');
      expect(result.exportMetadata.totalRecords).toBe(baseExport.activities.length);
    });
  });

  describe('Default Creation Functions', () => {
    it('should create default Activity KPI', () => {
      const defaultKPI = createDefaultActivityKPI();
      
      expect(defaultKPI.id).toMatch(/^activity-\d+$/);
      expect(defaultKPI.name).toBe('New Activity');
      expect(defaultKPI.type).toBe('job');
      expect(defaultKPI.status).toBe('idle');
      expect(defaultKPI.progress).toBe(0);
      expect(defaultKPI.successRate).toBe(0);
      expect(defaultKPI.priority).toBe(5);
      expect(defaultKPI.tags).toEqual([]);
      expect(defaultKPI.startedAt).toBeTypeOf('number');
      expect(defaultKPI.completedAt).toBeNull();
    });

    it('should create default Activity KPI with overrides', () => {
      const overrides = {
        name: 'Custom Activity',
        type: 'quest' as const,
        status: 'active' as const,
        progress: 50,
        priority: 8,
        tags: ['custom', 'test'],
      };
      
      const customKPI = createDefaultActivityKPI(overrides);
      
      expect(customKPI.name).toBe('Custom Activity');
      expect(customKPI.type).toBe('quest');
      expect(customKPI.status).toBe('active');
      expect(customKPI.progress).toBe(50);
      expect(customKPI.priority).toBe(8);
      expect(customKPI.tags).toEqual(['custom', 'test']);
      // Other defaults should remain
      expect(customKPI.locationId).toBe('location-unknown');
      expect(customKPI.assignedResidents).toEqual([]);
    });

    it('should create default export filter', () => {
      const defaultFilter = createDefaultActivityHUDKPIFilter();
      
      expect(defaultFilter).toEqual({});
    });

    it('should create default export options', () => {
      const defaultOptions = createDefaultActivityHUDKPIExportOptions();
      
      expect(defaultOptions.format).toBe('json');
      expect(defaultOptions.includeMetadata).toBe(true);
      expect(defaultOptions.includeResidentSummaries).toBe(true);
      expect(defaultOptions.includeLocationSummaries).toBe(true);
      expect(defaultOptions.sortBy).toBe('name');
      expect(defaultOptions.sortOrder).toBe('asc');
      expect(defaultOptions.includeInactive).toBe(false);
      expect(defaultOptions.includeCompleted).toBe(true);
      expect(defaultOptions.includeFailed).toBe(true);
    });
  });

  describe('Telemetry Creation', () => {
    it('should create telemetry event with basic parameters', () => {
      const baseExport = createDefaultActivityKPIExport();
      const telemetry = createActivityHUDExportedTelemetry(
        baseExport,
        1500, // exportDurationMs
        2048  // fileSizeBytes
      );
      
      expect(telemetry.eventType).toBe('iv_activity_hud_exported');
      expect(telemetry.timestamp).toBeTypeOf('number');
      expect(telemetry.exportMetadata.format).toBe(baseExport.exportMetadata.format);
      expect(telemetry.exportMetadata.totalRecords).toBe(baseExport.activities.length);
      expect(telemetry.exportMetadata.exportDurationMs).toBe(1500);
      expect(telemetry.exportMetadata.fileSizeBytes).toBe(2048);
      expect(telemetry.kpiSummary.totalActiveActivities).toBe(baseExport.summary.totalActiveActivities);
      expect(telemetry.performanceMetrics.exportTimeMs).toBe(1500);
    });

    it('should create telemetry event with custom options', () => {
      const baseExport = createDefaultActivityKPIExport();
      const filter = createDefaultActivityHUDKPIFilter();
      const options = createDefaultActivityHUDKPIExportOptions();
      const customMetrics = {
        dataCollectionTimeMs: 500,
        processingTimeMs: 800,
        memoryUsageMB: 45.5,
      };
      
      const telemetry = createActivityHUDExportedTelemetry(
        baseExport,
        2000,
        4096,
        filter,
        options,
        customMetrics
      );
      
      expect(telemetry.exportMetadata.appliedFilters).toEqual(filter);
      expect(telemetry.exportMetadata.exportOptions).toEqual(options);
      expect(telemetry.performanceMetrics.dataCollectionTimeMs).toBe(500);
      expect(telemetry.performanceMetrics.processingTimeMs).toBe(800);
      expect(telemetry.performanceMetrics.memoryUsageMB).toBe(45.5);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle boundary values in Activity KPI', () => {
      const boundaryKPI = createDefaultActivityKPI({
        progress: 0, // Minimum
        successRate: 100, // Maximum
        dropSuccessRate: 0, // Minimum
        priority: 1, // Minimum
        performanceScore: 100, // Maximum
        efficiencyScore: 0, // Minimum
      });
      
      const result = validateActivityKPI(boundaryKPI);
      expect(result.progress).toBe(0);
      expect(result.successRate).toBe(100);
      expect(result.dropSuccessRate).toBe(0);
      expect(result.priority).toBe(1);
      expect(result.performanceScore).toBe(100);
      expect(result.efficiencyScore).toBe(0);
    });

    it('should handle empty arrays in export data', () => {
      const emptyExport: ActivityHUDKPIExport = {
        exportMetadata: {
          exportedAt: Date.now(),
          version: '1.0.0',
          source: 'test',
          format: 'json',
          totalRecords: 0,
        },
        summary: {
          totalActiveActivities: 0,
          totalCompletedActivities: 0,
          overallSuccessRate: 0,
          overallDropSuccessRate: 0,
          averageActivityDurationMin: 0,
          totalActiveResidents: 0,
          totalUtilizedLocations: 0,
          globalEfficiencyScore: 0,
        },
        activities: [],
        residentSummaries: [],
        locationSummaries: [],
      };
      
      const result = validateActivityHUDKPIExport(emptyExport);
      expect(result.activities).toEqual([]);
      expect(result.residentSummaries).toEqual([]);
      expect(result.locationSummaries).toEqual([]);
      expect(result.summary.totalActiveActivities).toBe(0);
    });

    it('should handle partial filter configuration', () => {
      const partialFilter = {
        activityTypes: ['job'],
        progressRange: { min: 50 },
      };
      
      const result = validateActivityHUDKPIFilter(partialFilter);
      expect(result.activityTypes).toEqual(['job']);
      expect(result.progressRange?.min).toBe(50);
      expect(result.progressRange?.max).toBeUndefined();
      expect(result.activityStatuses).toBeUndefined();
    });

    it('should handle completed activity with completion timestamp', () => {
      const completedKPI = createDefaultActivityKPI({
        status: 'completed',
        progress: 100,
        completedAt: Date.now() - 3600000, // Completed 1 hour ago
      });
      
      const result = validateActivityKPI(completedKPI);
      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);
      expect(result.completedAt).toBeTypeOf('number');
      expect(result.completedAt).toBeGreaterThan(0);
    });

    it('should handle maximum values in ranges', () => {
      const maxFilter = {
        progressRange: { min: 0, max: 100 },
        successRateRange: { min: 0, max: 100 },
        priorityRange: { min: 1, max: 10 },
        performanceScoreRange: { min: 0, max: 100 },
      };
      
      const result = validateActivityHUDKPIFilter(maxFilter);
      expect(result.progressRange?.min).toBe(0);
      expect(result.progressRange?.max).toBe(100);
      expect(result.priorityRange?.min).toBe(1);
      expect(result.priorityRange?.max).toBe(10);
    });
  });

  describe('Data Structure Consistency', () => {
    it('should maintain consistency between activity and resident summaries', () => {
      const activity = createDefaultActivityKPI({
        id: 'activity-1',
        assignedResidents: ['resident-1', 'resident-2'],
        assignedResidentNames: ['Alice', 'Bob'],
        status: 'active',
      });
      
      const residentSummary: ResidentActivitySummary = {
        id: 'resident-1',
        name: 'Alice',
        currentActivityId: 'activity-1',
        currentActivityName: activity.name,
        totalCompleted: 5,
        totalFailed: 1,
        averageSuccessRate: 85.0,
        averageCompletionTimeMin: 42.0,
        currentFatigue: 25.5,
        currentHappiness: 75.0,
        activeSkills: ['strength', 'agility'],
        performanceTrend: 'improving',
      };
      
      // Validate both structures
      const validActivity = validateActivityKPI(activity);
      const validResident = residentSummary; // No validation function for this type
      
      expect(validActivity.assignedResidents).toContain('resident-1');
      expect(validResident.currentActivityId).toBe('activity-1');
      expect(validResident.currentActivityName).toBe(activity.name);
    });

    it('should maintain consistency between activity and location summaries', () => {
      const activity = createDefaultActivityKPI({
        id: 'activity-1',
        locationId: 'forest-1',
        locationName: 'Forest Area 1',
        type: 'job',
        status: 'active',
      });
      
      const locationSummary: LocationActivitySummary = {
        id: 'forest-1',
        name: 'Forest Area 1',
        type: 'forest',
        totalActivities: 3,
        activeActivities: 2,
        averageSuccessRate: 88.0,
        utilizationRate: 66.7,
        dominantActivityType: 'job',
        efficiencyScore: 90.5,
      };
      
      // Validate both structures
      const validActivity = validateActivityKPI(activity);
      const validLocation = locationSummary; // No validation function for this type
      
      expect(validActivity.locationId).toBe('forest-1');
      expect(validActivity.locationName).toBe('Forest Area 1');
      expect(validLocation.id).toBe('forest-1');
      expect(validLocation.name).toBe('Forest Area 1');
      expect(validLocation.dominantActivityType).toBe('job');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of activities efficiently', () => {
      const startTime = performance.now();
      
      // Create 1000 activities
      const activities: ActivityKPI[] = [];
      for (let i = 0; i < 1000; i++) {
        const activity = createDefaultActivityKPI({
          id: `activity-${i}`,
          name: `Activity ${i}`,
          progress: Math.random() * 100,
          successRate: Math.random() * 100,
        });
        activities.push(activity);
      }
      
      // Validate all activities
      const validationStartTime = performance.now();
      activities.forEach(activity => {
        validateActivityKPI(activity);
      });
      const validationEndTime = performance.now();
      
      const totalTime = validationEndTime - startTime;
      const validationTime = validationEndTime - validationStartTime;
      
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(validationTime).toBeLessThan(500); // Validation should be fast
      expect(activities).toHaveLength(1000);
    });

    it('should handle large export data structure', () => {
      const largeExport: ActivityHUDKPIExport = {
        exportMetadata: {
          exportedAt: Date.now(),
          version: '1.0.0',
          source: 'test',
          format: 'json',
          totalRecords: 1000,
        },
        summary: {
          totalActiveActivities: 500,
          totalCompletedActivities: 300,
          overallSuccessRate: 85.5,
          overallDropSuccessRate: 90.2,
          averageActivityDurationMin: 45.5,
          totalActiveResidents: 800,
          totalUtilizedLocations: 50,
          globalEfficiencyScore: 87.8,
        },
        activities: Array.from({ length: 1000 }, (_, i) => 
          createDefaultActivityKPI({ id: `activity-${i}`, name: `Activity ${i}` })
        ),
        residentSummaries: Array.from({ length: 100 }, (_, i) => ({
          id: `resident-${i}`,
          name: `Resident ${i}`,
          currentActivityId: `activity-${i}`,
          currentActivityName: `Activity ${i}`,
          totalCompleted: 5,
          totalFailed: 1,
          averageSuccessRate: 85.0,
          averageCompletionTimeMin: 42.0,
          currentFatigue: 25.5,
          currentHappiness: 75.0,
          activeSkills: ['strength'],
          performanceTrend: 'stable' as const,
        })),
        locationSummaries: Array.from({ length: 50 }, (_, i) => ({
          id: `location-${i}`,
          name: `Location ${i}`,
          type: 'village' as const,
          totalActivities: 20,
          activeActivities: 10,
          averageSuccessRate: 88.0,
          utilizationRate: 50.0,
          dominantActivityType: 'job' as const,
          efficiencyScore: 90.5,
        })),
      };
      
      const startTime = performance.now();
      const result = validateActivityHUDKPIExport(largeExport);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should validate within 100ms
      expect(result.activities).toHaveLength(1000);
      expect(result.residentSummaries).toHaveLength(100);
      expect(result.locationSummaries).toHaveLength(50);
    });
  });

  describe('Error Handling', () => {
    it('should provide detailed validation errors', () => {
      const invalidExport = {
        exportMetadata: {
          // Missing required fields
          exportedAt: 'invalid', // Wrong type
          version: '1.0.0',
          source: 'test',
          format: 'json',
          totalRecords: -1, // Invalid: negative
        },
        summary: {
          // Missing required fields
        },
        activities: [
          {
            // Invalid activity
            id: 123, // Wrong type
            name: 'Test',
            type: 'invalid_type',
            status: 'invalid_status',
            progress: 150, // Invalid range
          },
        ],
        residentSummaries: 'not-array', // Wrong type
        locationSummaries: null, // Wrong type
      };
      
      expect(() => validateActivityHUDKPIExport(invalidExport)).toThrow();
    });

    it('should handle malformed data gracefully', () => {
      const malformedData = {
        // Completely wrong structure
        wrongField: 'value',
        nested: {
          alsoWrong: 123,
        },
        array: [1, 2, 3], // Should be objects
      };
      
      expect(() => validateActivityHUDKPIExport(malformedData)).toThrow();
    });

    it('should handle null and undefined values appropriately', () => {
      const activityWithNulls = createDefaultActivityKPI({
        completedAt: null, // Valid null
        assignedResidents: [], // Valid empty array
        tags: [], // Valid empty array
      });
      
      expect(() => validateActivityKPI(activityWithNulls)).not.toThrow();
      
      // But required fields cannot be null
      const activityWithInvalidNulls = {
        ...activityWithNulls,
        id: null, // Invalid: required field
        name: null, // Invalid: required field
      };
      
      expect(() => validateActivityKPI(activityWithInvalidNulls)).toThrow();
    });
  });
});
