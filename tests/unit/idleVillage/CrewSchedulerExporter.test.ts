/**
 * Crew Scheduler Export Controller Tests
 * 
 * Tests for the crew scheduler export functionality including
 * filtering, telemetry, and data validation.
 * 
 * @since NP-018
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrewSchedulerExporter, createCrewSchedulerExporter, exportSchedulerData } from '@/ui/idleVillage/controllers/CrewSchedulerExporter';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import type { ExportOptions, SchedulerExport } from '@/ui/idleVillage/controllers/CrewSchedulerExporter';
import type { SchedulerSnapshot } from '@/balancing/config/idleVillage/crewSchedulerDeterminismGuard';

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn()
}));

const mockSaveData = vi.mocked(saveData);
const mockLoadData = vi.mocked(loadData);

describe('CrewSchedulerExporter', () => {
  let exporter: CrewSchedulerExporter;
  let mockSnapshot: SchedulerSnapshot;

  beforeEach(() => {
    exporter = createCrewSchedulerExporter();
    vi.clearAllMocks();
    
    // Create mock snapshot
    mockSnapshot = {
      timestamp: Date.now(),
      seed: 42,
      config: {
        priorityWeights: {
          statTagMatch: 10.0,
          fatiguePenalty: -8.0,
          questUrgency: 12.0,
          specializationBonus: 5.0,
          difficultyBonus: 2.0,
          baseWeight: 1.0,
        },
        seeding: {
          lcgSeed: 42,
          deterministic: true,
          seedStrategy: 'fixed'
        },
        thresholds: {
          fatiguePenaltyThreshold: 0.7,
          questUrgencyThreshold: 3.0,
          statTagMatchThreshold: 0.5,
        },
        maxQueueSize: 50,
        enableDiagnostics: true,
        timeTravel: {
          enabled: true,
          maxSnapshots: 20,
          autoCapture: true,
          captureOn: {
            enqueueTask: true,
            processQueue: true,
            rebalanceQueue: true,
            consumeAssignment: true,
          },
        },
      },
      queue: [
        {
          id: 'assignment-1',
          residentId: 'resident-1',
          activityId: 'forest-work',
          priorityScore: 85.5,
          factors: {
            statTagMatch: 0.8,
            fatigue: 0.3,
            questUrgency: 5,
            specialization: 0.7,
            difficulty: 0.4,
          },
          timestamp: Date.now() - 10000,
        },
        {
          id: 'assignment-2',
          residentId: 'resident-2',
          activityId: 'mining-operation',
          priorityScore: 72.3,
          factors: {
            statTagMatch: 0.6,
            fatigue: 0.5,
            questUrgency: 3,
            specialization: 0.9,
            difficulty: 0.8,
          },
          timestamp: Date.now() - 5000,
        },
      ],
      villageState: {
        residents: {
          'resident-1': {
            id: 'resident-1',
            name: 'Alice',
            stats: {
              strength: 15,
              agility: 12,
              intelligence: 8,
            },
            fatigue: 0.3,
            currentActivity: null,
          },
          'resident-2': {
            id: 'resident-2',
            name: 'Bob',
            stats: {
              strength: 10,
              agility: 14,
              intelligence: 12,
            },
            fatigue: 0.5,
            currentActivity: null,
          },
        },
        activities: {
          'forest-work': {
            id: 'forest-work',
            name: 'Forest Work',
            requiredStats: {
              strength: 10,
              agility: 8,
            },
            duration: 3600,
            rewards: {
              wood: 10,
            },
          },
          'mining-operation': {
            id: 'mining-operation',
            name: 'Mining Operation',
            requiredStats: {
              strength: 12,
              agility: 6,
            },
            duration: 4800,
            rewards: {
              stone: 15,
            },
          },
        },
        currentTime: Date.now(),
      },
      validation: {
        deterministic: true,
        deviation: 0,
        expectedQueue: [],
        actualQueue: [],
        timestamp: Date.now(),
        seed: 42,
        errors: [],
      },
      entropy: {
        randomSeed: 12345,
        timestamp: Date.now(),
        processId: 1234,
      },
    };
  });

  describe('exportData', () => {
    it('should export scheduler data successfully', async () => {
      // Arrange
      mockLoadData.mockResolvedValue(mockSnapshot);
      mockSaveData.mockResolvedValue();
      
      const options: ExportOptions = {
        format: 'json',
        outputPath: 'test-export.json',
      };

      // Act
      const result = await exporter.exportData(options);

      // Assert
      expect(result).toBeDefined();
      expect(result.metadata.totalAssignments).toBe(2);
      expect(result.queue).toHaveLength(2);
      expect(result.timeline).toHaveLength(2);
      expect(result.statistics.totalAssignments).toBe(2);
      expect(mockSaveData).toHaveBeenCalledTimes(2); // Once for export, once for telemetry
    });

    it('should apply slot filter correctly', async () => {
      // Arrange
      mockLoadData.mockResolvedValue(mockSnapshot);
      mockSaveData.mockResolvedValue();
      
      const options: ExportOptions = {
        format: 'json',
        outputPath: 'test-export.json',
        slot: 'forest',
      };

      // Act
      const result = await exporter.exportData(options);

      // Assert
      expect(result.queue).toHaveLength(1);
      expect(result.queue[0].activityId).toBe('forest-work');
      expect(result.timeline).toHaveLength(1);
      expect(result.metadata.totalAssignments).toBe(1);
    });

    it('should apply resident filter correctly', async () => {
      // Arrange
      mockLoadData.mockResolvedValue(mockSnapshot);
      mockSaveData.mockResolvedValue();
      
      const options: ExportOptions = {
        format: 'json',
        outputPath: 'test-export.json',
        resident: 'resident-1',
      };

      // Act
      const result = await exporter.exportData(options);

      // Assert
      expect(result.queue).toHaveLength(1);
      expect(result.queue[0].residentId).toBe('resident-1');
      expect(result.timeline).toHaveLength(1);
      expect(result.metadata.totalAssignments).toBe(1);
    });

    it('should apply timeframe filter correctly', async () => {
      // Arrange
      mockLoadData.mockResolvedValue(mockSnapshot);
      mockSaveData.mockResolvedValue();
      
      const now = Date.now();
      const oldSnapshot = {
        ...mockSnapshot,
        queue: [
          {
            ...mockSnapshot.queue[0],
            timestamp: now - (8 * 24 * 60 * 60 * 1000), // 8 days ago
          },
          {
            ...mockSnapshot.queue[1],
            timestamp: now - (2 * 24 * 60 * 60 * 1000), // 2 days ago
          },
        ],
      };
      mockLoadData.mockResolvedValue(oldSnapshot);
      
      const options: ExportOptions = {
        format: 'json',
        outputPath: 'test-export.json',
        timeframe: 'week',
      };

      // Act
      const result = await exporter.exportData(options);

      // Assert
      expect(result.timeline).toHaveLength(1); // Only the 2-day-old entry
      expect(result.timeline[0].timestamp).toBeGreaterThan(now - (7 * 24 * 60 * 60 * 1000));
    });

    it('should throw error when no snapshot found', async () => {
      // Arrange
      mockLoadData.mockResolvedValue(null);
      
      const options: ExportOptions = {
        format: 'json',
        outputPath: 'test-export.json',
      };

      // Act & Assert
      await expect(exporter.exportData(options)).rejects.toThrow(
        'No scheduler snapshot found. Ensure scheduler has run and snapshots are enabled.'
      );
    });

    it('should emit telemetry on successful export', async () => {
      // Arrange
      mockLoadData.mockResolvedValue(mockSnapshot);
      mockSaveData.mockResolvedValue();
      
      const options: ExportOptions = {
        format: 'json',
        outputPath: 'test-export.json',
      };

      // Act
      await exporter.exportData(options);

      // Assert
      expect(mockSaveData).toHaveBeenCalledWith(
        expect.stringMatching(/^telemetry_crew_scheduler_export_/),
        expect.objectContaining({
          eventType: 'crew_scheduler_export',
          data: expect.objectContaining({
            exportId: expect.stringMatching(/^export_\d+_[a-z0-9]+$/),
            format: 'json',
            totalRecords: 2,
            duration: expect.any(Number),
            filters: options,
            timestamp: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('getAvailableExports', () => {
    it('should return empty array (placeholder implementation)', async () => {
      // Act
      const result = await exporter.getAvailableExports();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('loadExport', () => {
    it('should load export by ID', async () => {
      // Arrange
      const exportId = 'test-export-123';
      const mockExport: SchedulerExport = {
        metadata: {
          exportTime: new Date().toISOString(),
          version: '1.0.0',
          totalAssignments: 2,
          filters: {},
          exportDuration: 100,
        },
        config: mockSnapshot.config,
        queue: mockSnapshot.queue,
        residents: mockSnapshot.villageState.residents,
        activities: mockSnapshot.villageState.activities,
        timeline: [],
        rejections: [],
        statistics: {
          totalAssignments: 2,
          totalRejections: 0,
          averagePriorityScore: 78.9,
          mostActiveResident: 'resident-1',
          mostRequestedActivity: 'forest-work',
          rejectionRate: 0,
          timeRange: { start: Date.now() - 10000, end: Date.now() },
        },
      };
      
      mockLoadData.mockResolvedValue(mockExport);

      // Act
      const result = await exporter.loadExport(exportId);

      // Assert
      expect(result).toEqual(mockExport);
      expect(mockLoadData).toHaveBeenCalledWith(`crew_scheduler_export_${exportId}`, null);
    });

    it('should return null for non-existent export', async () => {
      // Arrange
      const exportId = 'non-existent';
      mockLoadData.mockResolvedValue(null);

      // Act
      const result = await exporter.loadExport(exportId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createCrewSchedulerExporter', () => {
    it('should create exporter instance', () => {
      // Act
      const result = createCrewSchedulerExporter();

      // Assert
      expect(result).toBeInstanceOf(CrewSchedulerExporter);
    });
  });

  describe('exportSchedulerData utility', () => {
    it('should export data using utility function', async () => {
      // Arrange
      mockLoadData.mockResolvedValue(mockSnapshot);
      mockSaveData.mockResolvedValue();
      
      const options: ExportOptions = {
        format: 'json',
        outputPath: 'test-export.json',
      };

      // Act
      const result = await exportSchedulerData(options);

      // Assert
      expect(result).toBeDefined();
      expect(result.metadata.totalAssignments).toBe(2);
    });
  });

  describe('statistics calculation', () => {
    it('should calculate correct statistics', async () => {
      // Arrange
      mockLoadData.mockResolvedValue(mockSnapshot);
      mockSaveData.mockResolvedValue();
      
      const options: ExportOptions = {
        format: 'json',
        outputPath: 'test-export.json',
      };

      // Act
      const result = await exporter.exportData(options);

      // Assert
      const stats = result.statistics;
      expect(stats.totalAssignments).toBe(2);
      expect(stats.totalRejections).toBe(0);
      expect(stats.averagePriorityScore).toBeCloseTo(78.9, 1);
      expect(stats.mostActiveResident).toBe('resident-1'); // Both have 1, first wins
      expect(stats.mostRequestedActivity).toBe('forest-work'); // Both have 1, first wins
      expect(stats.rejectionRate).toBe(0);
      expect(stats.timeRange.start).toBeLessThanOrEqual(stats.timeRange.end);
    });
  });

  describe('error handling', () => {
    it('should handle load errors gracefully', async () => {
      // Arrange
      mockLoadData.mockRejectedValue(new Error('Persistence error'));
      
      const options: ExportOptions = {
        format: 'json',
        outputPath: 'test-export.json',
      };

      // Act & Assert
      await expect(exporter.exportData(options)).rejects.toThrow('Persistence error');
    });
  });
});
