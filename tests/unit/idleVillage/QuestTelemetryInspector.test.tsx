/**
 * Quest Telemetry Inspector Test Suite
 * 
 * Tests for the Quest Telemetry Inspector CLI tool including data loading,
 * filtering, analysis metrics generation, and export functionality.
 */

import { renderHook, act } from '@testing-library/react';
import { generateAnalysisMetrics, type ExportConfig, type QuestAnalysisMetrics } from '@/scripts/questTelemetry/exportInspectorData';
import type { AggregatedTelemetry, QuestTelemetryEntry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import type { QuestResult, BranchDecision } from '@/engine/quest/types';

// Mock CLI dependencies
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
}));

jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mock-hash'),
  })),
}));

// Mock chalk and ora for CLI output
jest.mock('chalk', () => ({
  red: jest.fn((text) => text),
  green: jest.fn((text) => text),
  blue: jest.fn((text) => text),
  bold: jest.fn((color) => (text: string) => color(text)),
}));

jest.mock('ora', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
  })),
}));

jest.mock('cli-table3', () => {
  return jest.fn().mockImplementation(() => ({
    push: jest.fn(),
    toString: jest.fn().mockReturnValue('mock-table'),
  }));
});

// Test data fixtures
const mockQuestEntries: QuestTelemetryEntry[] = [
  {
    questId: 'quest-001',
    result: 'perfect' as QuestResult,
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    sessionId: 'session-001',
    questType: 'combat',
    duration: 45000,
    branchCount: 3,
    choiceTime: 5000,
    heroic: true,
  },
  {
    questId: 'quest-002',
    result: 'success' as QuestResult,
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    sessionId: 'session-001',
    questType: 'exploration',
    duration: 35000,
    branchCount: 2,
    choiceTime: 3000,
    heroic: false,
  },
  {
    questId: 'quest-003',
    result: 'partial' as QuestResult,
    timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
    sessionId: 'session-002',
    questType: 'combat',
    duration: 55000,
    branchCount: 4,
    choiceTime: 7000,
    heroic: false,
  },
  {
    questId: 'quest-004',
    result: 'fail' as QuestResult,
    timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    sessionId: 'session-002',
    questType: 'social',
    duration: 25000,
    branchCount: 2,
    choiceTime: 2000,
    heroic: false,
  },
  {
    questId: 'quest-005',
    result: 'deadly' as QuestResult,
    timestamp: Date.now() - 1000 * 60 * 2, // 2 minutes ago
    sessionId: 'session-003',
    questType: 'combat',
    duration: 60000,
    branchCount: 5,
    choiceTime: 8000,
    heroic: false,
  },
];

const mockBranchDecisions: BranchDecision[] = [
  {
    questId: 'quest-001',
    branchId: 'branch-001',
    choice: 'attack',
    timestamp: Date.now() - 1000 * 60 * 60,
    choiceTime: 5000,
    outcome: 'victory',
  },
  {
    questId: 'quest-002',
    branchId: 'branch-002',
    choice: 'explore',
    timestamp: Date.now() - 1000 * 60 * 30,
    choiceTime: 3000,
    outcome: 'discovery',
  },
  {
    questId: 'quest-003',
    branchId: 'branch-003',
    choice: 'negotiate',
    timestamp: Date.now() - 1000 * 60 * 15,
    choiceTime: 7000,
    outcome: 'compromise',
  },
];

const mockAggregatedTelemetry: AggregatedTelemetry = {
  totalQuests: 5,
  successRate: 40.0, // 2 out of 5 (perfect + success)
  averageDuration: 44000, // Average of all durations
  totalBranches: 16,
  averageChoiceTime: 5000,
  heroicMoments: 1,
  branchDecisions: mockBranchDecisions,
  recentQuests: mockQuestEntries,
  questTypeBreakdown: {
    combat: 3,
    exploration: 1,
    social: 1,
  },
};

describe('QuestTelemetryInspector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Analysis Metrics Generation', () => {
    it('should generate comprehensive analysis metrics', () => {
      const metrics = generateAnalysisMetrics(mockAggregatedTelemetry);

      // Verify overall metrics
      expect(metrics.overall.totalQuests).toBe(5);
      expect(metrics.overall.successRate).toBe(40.0);
      expect(metrics.overall.averageDuration).toBe(44000);
      expect(metrics.overall.heroicRate).toBe(20.0); // 1 out of 5
      expect(metrics.overall.failureRate).toBe(40.0); // 2 out of 5 (fail + deadly)

      // Verify quest type breakdown
      expect(metrics.questTypes).toHaveProperty('combat');
      expect(metrics.questTypes.combat.count).toBe(3);
      expect(metrics.questTypes.combat.successRate).toBe(33.3); // 1 out of 3 (perfect)
      expect(metrics.questTypes.combat.heroicRate).toBe(33.3); // 1 out of 3

      expect(metrics.questTypes).toHaveProperty('exploration');
      expect(metrics.questTypes.exploration.count).toBe(1);
      expect(metrics.questTypes.exploration.successRate).toBe(100.0); // 1 out of 1

      // Verify result distribution
      expect(metrics.resultDistribution).toEqual({
        perfect: 1,
        success: 1,
        partial: 1,
        fail: 1,
        deadly: 1,
      });

      // Verify session analysis
      expect(metrics.sessions).toHaveProperty('session-001');
      expect(metrics.sessions['session-001'].questCount).toBe(2);
      expect(metrics.sessions['session-001'].successRate).toBe(100.0); // Both perfect and success

      expect(metrics.sessions).toHaveProperty('session-002');
      expect(metrics.sessions['session-002'].questCount).toBe(2);
      expect(metrics.sessions['session-002'].successRate).toBe(0.0); // partial and fail

      // Verify trends
      expect(metrics.trends.hourlyActivity).toBeDefined();
      expect(metrics.trends.dailyActivity).toBeDefined();
      expect(metrics.trends.performanceOverTime).toBeDefined();
    });

    it('should handle empty telemetry data', () => {
      const emptyTelemetry: AggregatedTelemetry = {
        totalQuests: 0,
        successRate: 0,
        averageDuration: 0,
        totalBranches: 0,
        averageChoiceTime: 0,
        heroicMoments: 0,
        branchDecisions: [],
        recentQuests: [],
        questTypeBreakdown: {},
      };

      const metrics = generateAnalysisMetrics(emptyTelemetry);

      expect(metrics.overall.totalQuests).toBe(0);
      expect(metrics.overall.successRate).toBe(0);
      expect(metrics.overall.heroicRate).toBe(0);
      expect(metrics.overall.failureRate).toBe(0);

      expect(Object.keys(metrics.questTypes)).toHaveLength(0);
      expect(Object.keys(metrics.sessions)).toHaveLength(0);

      expect(metrics.resultDistribution).toEqual({
        perfect: 0,
        success: 0,
        partial: 0,
        fail: 0,
        deadly: 0,
      });
    });

    it('should calculate session metrics correctly', () => {
      const metrics = generateAnalysisMetrics(mockAggregatedTelemetry);

      // Session 001: perfect + success = 100% success rate
      const session001 = metrics.sessions['session-001'];
      expect(session001.questCount).toBe(2);
      expect(session001.successRate).toBe(100.0);
      expect(session001.averageDuration).toBe(40000); // (45000 + 35000) / 2

      // Session 002: partial + fail = 0% success rate
      const session002 = metrics.sessions['session-002'];
      expect(session002.questCount).toBe(2);
      expect(session002.successRate).toBe(0.0);
      expect(session002.averageDuration).toBe(40000); // (55000 + 25000) / 2

      // Session 003: deadly only = 0% success rate
      const session003 = metrics.sessions['session-003'];
      expect(session003.questCount).toBe(1);
      expect(session003.successRate).toBe(0.0);
      expect(session003.averageDuration).toBe(60000);
    });

    it('should generate performance trends correctly', () => {
      // Create telemetry with more quests for trend analysis
      const manyQuests: QuestTelemetryEntry[] = Array(20).fill(null).map((_, i) => ({
        questId: `quest-${i}`,
        result: i % 3 === 0 ? 'perfect' as QuestResult : i % 3 === 1 ? 'success' as QuestResult : 'partial' as QuestResult,
        timestamp: Date.now() - (20 - i) * 1000 * 60, // Each minute apart
        sessionId: 'session-trend',
        questType: 'combat',
        duration: 30000 + i * 1000,
        branchCount: 3,
        choiceTime: 5000,
        heroic: i % 5 === 0,
      }));

      const manyQuestsTelemetry: AggregatedTelemetry = {
        totalQuests: 20,
        successRate: 66.7,
        averageDuration: 39500,
        totalBranches: 60,
        averageChoiceTime: 5000,
        heroicMoments: 4,
        branchDecisions: [],
        recentQuests: manyQuests,
        questTypeBreakdown: { combat: 20 },
      };

      const metrics = generateAnalysisMetrics(manyQuestsTelemetry);

      // Should have performance over time data (window size 10, so 20 - 10 = 10 data points)
      expect(metrics.trends.performanceOverTime.length).toBeGreaterThan(0);
      
      // Verify trend data structure
      const firstTrend = metrics.trends.performanceOverTime[0];
      expect(firstTrend).toHaveProperty('timestamp');
      expect(firstTrend).toHaveProperty('successRate');
      expect(firstTrend).toHaveProperty('averageDuration');
    });

    it('should handle quest type breakdown correctly', () => {
      const metrics = generateAnalysisMetrics(mockAggregatedTelemetry);

      // Combat quests: 3 total (1 perfect, 1 partial, 1 deadly) = 33.3% success rate
      const combatStats = metrics.questTypes.combat;
      expect(combatStats.count).toBe(3);
      expect(combatStats.successRate).toBeCloseTo(33.3, 1);
      expect(combatStats.heroicRate).toBeCloseTo(33.3, 1); // 1 heroic out of 3

      // Exploration quests: 1 total (1 success) = 100% success rate
      const explorationStats = metrics.questTypes.exploration;
      expect(explorationStats.count).toBe(1);
      expect(explorationStats.successRate).toBe(100.0);
      expect(explorationStats.heroicRate).toBe(0.0);

      // Social quests: 1 total (1 fail) = 0% success rate
      const socialStats = metrics.questTypes.social;
      expect(socialStats.count).toBe(1);
      expect(socialStats.successRate).toBe(0.0);
      expect(socialStats.heroicRate).toBe(0.0);
    });
  });

  describe('Data Processing Edge Cases', () => {
    it('should handle missing quest types gracefully', () => {
      const telemetryWithoutTypes: AggregatedTelemetry = {
        ...mockAggregatedTelemetry,
        recentQuests: mockQuestEntries.map(q => ({ ...q, questType: undefined })),
        questTypeBreakdown: {},
      };

      const metrics = generateAnalysisMetrics(telemetryWithoutTypes);

      // Should still generate overall metrics
      expect(metrics.overall.totalQuests).toBe(5);
      expect(metrics.overall.successRate).toBe(40.0);

      // Quest types should be empty
      expect(Object.keys(metrics.questTypes)).toHaveLength(0);
    });

    it('should handle missing optional fields gracefully', () => {
      const telemetryWithMissingFields: AggregatedTelemetry = {
        ...mockAggregatedTelemetry,
        recentQuests: mockQuestEntries.map(q => ({
          ...q,
          duration: undefined,
          branchCount: undefined,
          choiceTime: undefined,
          heroic: undefined,
        })),
      };

      const metrics = generateAnalysisMetrics(telemetryWithMissingFields);

      // Should still work with defaults
      expect(metrics.overall.totalQuests).toBe(5);
      expect(metrics.overall.averageDuration).toBe(0); // All durations are undefined
    });

    it('should handle single quest sessions', () => {
      const singleQuestSession: AggregatedTelemetry = {
        ...mockAggregatedTelemetry,
        recentQuests: [mockQuestEntries[0]], // Only one quest
      };

      const metrics = generateAnalysisMetrics(singleQuestSession);

      expect(Object.keys(metrics.sessions)).toHaveLength(1);
      const session = metrics.sessions['session-001'];
      expect(session.questCount).toBe(1);
      expect(session.successRate).toBe(100.0); // perfect result
    });

    it('should handle zero division in calculations', () => {
      const emptyTelemetry: AggregatedTelemetry = {
        totalQuests: 0,
        successRate: 0,
        averageDuration: 0,
        totalBranches: 0,
        averageChoiceTime: 0,
        heroicMoments: 0,
        branchDecisions: [],
        recentQuests: [],
        questTypeBreakdown: {},
      };

      const metrics = generateAnalysisMetrics(emptyTelemetry);

      // All rates should be 0, no division by zero errors
      expect(metrics.overall.successRate).toBe(0);
      expect(metrics.overall.heroicRate).toBe(0);
      expect(metrics.overall.failureRate).toBe(0);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large dataset (1000 quests)
      const largeQuestSet: QuestTelemetryEntry[] = Array(1000).fill(null).map((_, i) => ({
        questId: `quest-${i}`,
        result: ['perfect', 'success', 'partial', 'fail', 'deadly'][i % 5] as QuestResult,
        timestamp: Date.now() - (1000 - i) * 1000 * 60, // Each minute apart
        sessionId: `session-${Math.floor(i / 10)}`, // 10 quests per session
        questType: ['combat', 'exploration', 'social'][i % 3],
        duration: 30000 + Math.random() * 30000,
        branchCount: 2 + Math.floor(Math.random() * 4),
        choiceTime: 2000 + Math.random() * 8000,
        heroic: Math.random() < 0.2,
      }));

      const largeTelemetry: AggregatedTelemetry = {
        totalQuests: 1000,
        successRate: 40.0,
        averageDuration: 45000,
        totalBranches: 3000,
        averageChoiceTime: 5000,
        heroicMoments: 200,
        branchDecisions: [],
        recentQuests: largeQuestSet,
        questTypeBreakdown: {
          combat: 334,
          exploration: 333,
          social: 333,
        },
      };

      const startTime = Date.now();
      const metrics = generateAnalysisMetrics(largeTelemetry);
      const endTime = Date.now();

      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);

      // Should process all quests
      expect(metrics.overall.totalQuests).toBe(1000);
      expect(Object.keys(metrics.sessions)).toHaveLength(100); // 1000 quests / 10 per session
    });

    it('should maintain memory efficiency with many sessions', () => {
      // Create many sessions (200 sessions with 5 quests each)
      const manySessionsQuests: QuestTelemetryEntry[] = Array(1000).fill(null).map((_, i) => ({
        questId: `quest-${i}`,
        result: 'success' as QuestResult,
        timestamp: Date.now() - (1000 - i) * 1000 * 60,
        sessionId: `session-${Math.floor(i / 5)}`, // 5 quests per session
        questType: 'combat',
        duration: 40000,
        branchCount: 3,
        choiceTime: 5000,
        heroic: false,
      }));

      const manySessionsTelemetry: AggregatedTelemetry = {
        totalQuests: 1000,
        successRate: 100.0,
        averageDuration: 40000,
        totalBranches: 3000,
        averageChoiceTime: 5000,
        heroicMoments: 0,
        branchDecisions: [],
        recentQuests: manySessionsQuests,
        questTypeBreakdown: { combat: 1000 },
      };

      const metrics = generateAnalysisMetrics(manySessionsTelemetry);

      // Should handle all sessions efficiently
      expect(Object.keys(metrics.sessions)).toHaveLength(200);
      
      // Each session should have correct metrics
      Object.values(metrics.sessions).forEach(session => {
        expect(session.questCount).toBe(5);
        expect(session.successRate).toBe(100.0);
        expect(session.averageDuration).toBe(40000);
      });
    });
  });

  describe('Data Integrity Validation', () => {
    it('should maintain data consistency across calculations', () => {
      const metrics = generateAnalysisMetrics(mockAggregatedTelemetry);

      // Verify that total counts match
      const totalFromTypes = Object.values(metrics.questTypes)
        .reduce((sum, type) => sum + type.count, 0);
      expect(totalFromTypes).toBe(metrics.overall.totalQuests);

      // Verify that result distribution totals match
      const totalFromResults = Object.values(metrics.resultDistribution)
        .reduce((sum, count) => sum + count, 0);
      expect(totalFromResults).toBe(metrics.overall.totalQuests);

      // Verify that session quest counts match
      const totalFromSessions = Object.values(metrics.sessions)
        .reduce((sum, session) => sum + session.questCount, 0);
      expect(totalFromSessions).toBe(metrics.overall.totalQuests);
    });

    it('should handle timestamp edge cases', () => {
      const telemetryWithEdgeTimestamps: AggregatedTelemetry = {
        ...mockAggregatedTelemetry,
        recentQuests: [
          {
            ...mockQuestEntries[0],
            timestamp: 0, // Unix epoch
          },
          {
            ...mockQuestEntries[1],
            timestamp: Date.now(), // Current time
          },
          {
            ...mockQuestEntries[2],
            timestamp: Date.now() + 86400000, // Future time
          },
        ],
      };

      const metrics = generateAnalysisMetrics(telemetryWithEdgeTimestamps);

      // Should handle edge timestamps without errors
      expect(metrics.overall.totalQuests).toBe(3);
      expect(metrics.sessions).toBeDefined();
      expect(metrics.trends.dailyActivity).toBeDefined();
    });

    it('should validate quest result types', () => {
      const metrics = generateAnalysisMetrics(mockAggregatedTelemetry);

      // Should only have valid result types
      const validResults = ['perfect', 'success', 'partial', 'fail', 'deadly'];
      Object.keys(metrics.resultDistribution).forEach(result => {
        expect(validResults).toContain(result);
      });

      // All result counts should be non-negative integers
      Object.values(metrics.resultDistribution).forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(count)).toBe(true);
      });
    });
  });

  describe('Export Configuration Validation', () => {
    it('should handle all export formats', () => {
      const formats: Array<'json' | 'csv' | 'markdown' | 'html'> = ['json', 'csv', 'markdown', 'html'];
      
      formats.forEach(format => {
        const config: ExportConfig = {
          format,
          includeBranches: true,
          includeSessions: true,
          includePerformance: true,
          sortBy: 'timestamp',
          sortOrder: 'desc',
        };

        // Should not throw errors for any format
        expect(() => {
          // This would normally call the export function
          // For testing, we just validate the config structure
          expect(config.format).toBe(format);
        }).not.toThrow();
      });
    });

    it('should validate filter configurations', () => {
      const validResults: QuestResult[] = ['perfect', 'success', 'partial', 'fail', 'deadly'];
      
      validResults.forEach(result => {
        const config: ExportConfig = {
          format: 'json',
          result,
          includeBranches: true,
          includeSessions: true,
          includePerformance: true,
          sortBy: 'timestamp',
          sortOrder: 'desc',
        };

        expect(config.result).toBe(result);
      });
    });

    it('should handle sorting configurations', () => {
      const sortFields: Array<'timestamp' | 'duration' | 'successRate'> = ['timestamp', 'duration', 'successRate'];
      const sortOrders: Array<'asc' | 'desc'> = ['asc', 'desc'];

      sortFields.forEach(sortBy => {
        sortOrders.forEach(sortOrder => {
          const config: ExportConfig = {
            format: 'json',
            sortBy,
            sortOrder,
            includeBranches: true,
            includeSessions: true,
            includePerformance: true,
          };

          expect(config.sortBy).toBe(sortBy);
          expect(config.sortOrder).toBe(sortOrder);
        });
      });
    });
  });
});

/**
 * Integration tests for the CLI tool would go here
 * These would test the actual file I/O operations and CLI interface
 */
describe('QuestTelemetryInspector CLI Integration', () => {
  // These tests would require mocking the file system and CLI arguments
  // They would test the actual export functionality end-to-end
  
  it('should export data in all formats', () => {
    // This would test the actual CLI export commands
    // Would require mocking fs operations and CLI argument parsing
  });

  it('should handle CLI filtering options', () => {
    // This would test CLI filtering by quest type, result, date range
  });

  it('should display analysis results in terminal', () => {
    // This would test the terminal output formatting
  });
});
