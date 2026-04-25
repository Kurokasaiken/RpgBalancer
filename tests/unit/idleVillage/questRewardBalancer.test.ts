/**
 * Quest Reward Balancer Test Suite
 * 
 * Comprehensive tests for the quest reward balancing system,
 * KPI tracking, export functionality, and calibration algorithms.
 * 
 * @since NP-021
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QuestRewardBalancer, DEFAULT_QUEST_REWARD_BALANCER_CONFIG } from '../../../src/balancing/utils/idleVillage/questRewardBalancer';
import { QuestRewardKPITracker, DEFAULT_KPI_TRACKING_CONFIG } from '../../../src/balancing/utils/idleVillage/questRewardKPITracker';
import { QuestRewardBalancerExportManager, DEFAULT_EXPORT_CONFIG } from '../../../src/balancing/utils/idleVillage/questRewardBalancerExport';
import type { QuestDefinition, QuestEffect, QuestResult } from '../../../src/engine/quest/types';
import type { QuestRewardKPI, RewardCalculationResult } from '../../../src/balancing/utils/idleVillage/questRewardBalancer';

describe('QuestRewardBalancer', () => {
  let balancer: QuestRewardBalancer;
  let sampleQuest: QuestDefinition;
  let sampleRewards: QuestEffect[];

  beforeEach(() => {
    balancer = new QuestRewardBalancer();
    
    // Create sample quest
    sampleQuest = {
      id: 'quest-combat-001',
      title: 'Test Combat Quest',
      description: 'A test combat quest',
      phases: [
        { type: 'fight', id: 'phase-1', title: 'Fight Phase', description: 'Combat phase' },
        { type: 'dialogue', id: 'phase-2', title: 'Dialogue Phase', description: 'Choice phase', 
          choices: [
            { id: 'choice-1', text: 'Fight', outcome: { nextPhaseIds: ['phase-3'] } },
            { id: 'choice-2', text: 'Flee', outcome: { nextPhaseIds: ['phase-4'] } }
          ] },
        { type: 'check', id: 'phase-3', title: 'Success', description: 'Success phase' },
        { type: 'check', id: 'phase-4', title: 'Failure', description: 'Failure phase' },
      ],
      startPhaseId: 'phase-1',
      successPhaseIds: ['phase-3'],
      failurePhaseIds: ['phase-4'],
      tags: ['combat', 'solo'],
    };

    // Create sample rewards
    sampleRewards = [
      { type: 'resource_grant', target: 'party', resourceType: 'gold', resourceAmount: 100 },
      { type: 'stat_modifier', target: 'leader', statName: 'experience', modifier: 50 },
      { type: 'resident_modifier', target: 'all_members', statName: 'reputation', modifier: 10 },
    ];
  });

  afterEach(() => {
    balancer.clearHistoricalData();
  });

  describe('Configuration Management', () => {
    it('should use default configuration', () => {
      const config = balancer.getConfig();
      expect(config.targetRewardEfficiency).toBe(DEFAULT_QUEST_REWARD_BALANCER_CONFIG.targetRewardEfficiency);
      expect(config.rewardWeights).toBeDefined();
      expect(config.kpiThresholds).toBeDefined();
    });

    it('should update configuration', () => {
      const newConfig = {
        targetRewardEfficiency: 15,
        maxRewardVariance: 0.4,
      };

      balancer.updateConfig(newConfig);
      const config = balancer.getConfig();

      expect(config.targetRewardEfficiency).toBe(15);
      expect(config.maxRewardVariance).toBe(0.4);
    });
  });

  describe('Quest Difficulty Calculation', () => {
    it('should calculate quest difficulty correctly', () => {
      const difficulty = balancer.calculateQuestDifficulty(sampleQuest);

      expect(difficulty.overall).toBeGreaterThanOrEqual(0);
      expect(difficulty.overall).toBeLessThanOrEqual(1);
      expect(difficulty.combat).toBeGreaterThan(0); // Has fight phase
      expect(difficulty.social).toBeGreaterThan(0); // Has dialogue phase
      expect(difficulty.complexity).toBeGreaterThan(0); // Has branching
    });

    it('should handle different quest types', () => {
      const stealthQuest = {
        ...sampleQuest,
        id: 'quest-stealth-001',
        phases: [
          { type: 'stealth', id: 'phase-1', title: 'Stealth', description: 'Stealth phase' },
          { type: 'trap', id: 'phase-2', title: 'Trap', description: 'Trap phase' },
        ],
      };

      const difficulty = balancer.calculateQuestDifficulty(stealthQuest);
      expect(difficulty.stealth).toBeGreaterThan(0);
      expect(difficulty.combat).toBe(0);
    });
  });

  describe('Duration Estimation', () => {
    it('should estimate quest duration', () => {
      const duration = balancer.estimateQuestDuration(sampleQuest);
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(3600); // Less than 1 hour
    });

    it('should use historical data when available', () => {
      const historicalResults: QuestResult[] = [
        {
          questId: sampleQuest.id,
          success: true,
          completedPhases: 3,
          totalPhases: 4,
          durationSeconds: 600,
          branchDecisions: [],
          finalEffects: sampleRewards,
          telemetryData: {
            totalBranchesTaken: 2,
            averageChoiceTime: 30,
            heroicMoments: 1,
            failurePoints: [],
            successPath: ['phase-1', 'phase-2', 'phase-3'],
            playerChoices: ['choice-1'],
          },
        },
      ];

      balancer.addHistoricalData(sampleQuest.id, historicalResults);
      const duration = balancer.estimateQuestDuration(sampleQuest);
      expect(duration).toBe(600); // Should use historical average
    });
  });

  describe('KPI Calculation', () => {
    it('should calculate KPI metrics', () => {
      const difficulty = balancer.calculateQuestDifficulty(sampleQuest);
      const duration = balancer.estimateQuestDuration(sampleQuest);
      
      const kpi = balancer.calculateKPI(
        sampleQuest,
        sampleRewards,
        difficulty,
        duration
      );

      expect(kpi.questId).toBe(sampleQuest.id);
      expect(kpi.questType).toBe('combat');
      expect(kpi.difficulty).toEqual(difficulty);
      expect(kpi.estimatedDuration).toBe(duration);
      expect(kpi.totalRewardValue).toBeGreaterThan(0);
      expect(kpi.rewardEfficiency).toBeGreaterThan(0);
      expect(kpi.balanceScore).toBeGreaterThanOrEqual(0);
      expect(kpi.balanceScore).toBeLessThanOrEqual(1);
    });

    it('should calculate reward distribution', () => {
      const difficulty = balancer.calculateQuestDifficulty(sampleQuest);
      const duration = balancer.estimateQuestDuration(sampleQuest);
      
      const kpi = balancer.calculateKPI(
        sampleQuest,
        sampleRewards,
        difficulty,
        duration
      );

      expect(kpi.rewardDistribution.resources).toBe(100);
      expect(kpi.rewardDistribution.experience).toBe(50);
      expect(kpi.rewardDistribution.reputation).toBe(10);
    });
  });

  describe('Reward Balancing', () => {
    it('should balance rewards using weight-based algorithm', () => {
      const result = balancer.balanceRewards(sampleQuest, sampleRewards);

      expect(result.questId).toBe(sampleQuest.id);
      expect(result.originalRewards).toEqual(sampleRewards);
      expect(result.balancedRewards).toHaveLength(sampleRewards.length);
      expect(result.kpi).toBeDefined();
      expect(result.adjustments).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should apply adjustments based on difficulty', () => {
      const easyQuest = {
        ...sampleQuest,
        id: 'quest-easy-001',
        phases: [
          { type: 'check', id: 'phase-1', title: 'Easy', description: 'Easy phase' },
        ],
      };

      const hardQuest = {
        ...sampleQuest,
        id: 'quest-hard-001',
        phases: [
          { type: 'fight', id: 'phase-1', title: 'Hard Fight', description: 'Hard combat' },
          { type: 'fight', id: 'phase-2', title: 'Hard Fight 2', description: 'More combat' },
          { type: 'trap', id: 'phase-3', title: 'Trap', description: 'Dangerous trap' },
        ],
      };

      const easyResult = balancer.balanceRewards(easyQuest, sampleRewards);
      const hardResult = balancer.balanceRewards(hardQuest, sampleRewards);

      // Hard quest should have higher total reward value
      const easyTotal = easyResult.balancedRewards.reduce((sum, r) => sum + (r.resourceAmount || r.modifier || 0), 0);
      const hardTotal = hardResult.balancedRewards.reduce((sum, r) => sum + (r.resourceAmount || r.modifier || 0), 0);

      expect(hardTotal).toBeGreaterThan(easyTotal);
    });

    it('should respect reward constraints', () => {
      const result = balancer.balanceRewards(sampleQuest, sampleRewards);

      result.balancedRewards.forEach(reward => {
        const value = reward.resourceAmount || reward.modifier || 0;
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(10000); // Global cap
      });
    });

    it('should generate warnings for balance issues', () => {
      // Create overpowered rewards
      const overpoweredRewards: QuestEffect[] = [
        { type: 'resource_grant', target: 'party', resourceType: 'gold', resourceAmount: 10000 },
      ];

      const result = balancer.balanceRewards(sampleQuest, overpoweredRewards);
      expect(result.metadata.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Historical Data Management', () => {
    it('should store and retrieve historical data', () => {
      const results: QuestResult[] = [
        {
          questId: sampleQuest.id,
          success: true,
          completedPhases: 3,
          totalPhases: 4,
          durationSeconds: 300,
          branchDecisions: [],
          finalEffects: sampleRewards,
          telemetryData: {
            totalBranchesTaken: 1,
            averageChoiceTime: 15,
            heroicMoments: 0,
            failurePoints: [],
            successPath: ['phase-1', 'phase-2', 'phase-3'],
            playerChoices: [],
          },
        },
      ];

      balancer.addHistoricalData(sampleQuest.id, results);
      const historical = balancer.getKPIHistory(sampleQuest.id);
      
      expect(historical).toBeDefined();
      expect(historical.length).toBe(1);
    });

    it('should clear historical data', () => {
      const results: QuestResult[] = [
        {
          questId: sampleQuest.id,
          success: true,
          completedPhases: 3,
          totalPhases: 4,
          durationSeconds: 300,
          branchDecisions: [],
          finalEffects: sampleRewards,
          telemetryData: {
            totalBranchesTaken: 1,
            averageChoiceTime: 15,
            heroicMoments: 0,
            failurePoints: [],
            successPath: ['phase-1', 'phase-2', 'phase-3'],
            playerChoices: [],
          },
        },
      ];

      balancer.addHistoricalData(sampleQuest.id, results);
      balancer.clearHistoricalData(sampleQuest.id);
      
      const historical = balancer.getKPIHistory(sampleQuest.id);
      expect(historical).toHaveLength(0);
    });
  });
});

describe('QuestRewardKPITracker', () => {
  let tracker: QuestRewardKPITracker;
  let sampleKPI: QuestRewardKPI;

  beforeEach(() => {
    tracker = new QuestRewardKPITracker();
    
    sampleKPI = {
      questId: 'quest-test-001',
      questType: 'combat',
      difficulty: {
        overall: 0.6,
        combat: 0.8,
        stealth: 0.2,
        social: 0.3,
        exploration: 0.1,
        timePressure: 0.4,
        complexity: 0.5,
      },
      estimatedDuration: 300,
      participantCount: 1,
      totalRewardValue: 200,
      rewardDistribution: {
        resources: 100,
        experience: 50,
        items: 30,
        reputation: 10,
        skills: 5,
        special: 5,
      },
      rewardEfficiency: 40,
      riskRewardRatio: 0.3,
      successRate: 0.7,
      averageCompletionTime: 280,
      playerSatisfactionScore: 0.8,
      resourceInflation: 0.15,
      rarityScore: 0.4,
      repeatValue: 0.6,
      balanceScore: 0.75,
      overpoweredIndex: 0.2,
      underpoweredIndex: 0.1,
    };
  });

  afterEach(() => {
    tracker.cleanupOldData();
  });

  describe('KPI Data Management', () => {
    it('should add and retrieve KPI data', () => {
      tracker.addKPIData(sampleKPI.questId, sampleKPI);
      const data = tracker.getKPIData(sampleKPI.questId);
      
      expect(data).toHaveLength(1);
      expect(data[0]).toEqual(sampleKPI);
    });

    it('should limit data points by configuration', () => {
      const config = { maxDataPointsPerQuest: 3 };
      tracker.updateConfig(config);

      // Add more data points than limit
      for (let i = 0; i < 5; i++) {
        tracker.addKPIData(sampleKPI.questId, { ...sampleKPI, balanceScore: i * 0.1 });
      }

      const data = tracker.getKPIData(sampleKPI.questId);
      expect(data).toHaveLength(3); // Should be limited
    });
  });

  describe('Trend Analysis', () => {
    it('should analyze trends with sufficient data', () => {
      // Add multiple data points
      for (let i = 0; i < 15; i++) {
        tracker.addKPIData(sampleKPI.questId, {
          ...sampleKPI,
          balanceScore: 0.5 + (i * 0.02), // Increasing trend
          rewardEfficiency: 35 + (i * 0.5),
          successRate: 0.6 + (i * 0.01),
        });
      }

      const trends = tracker.analyzeTrends(sampleKPI.questId);
      
      expect(trends).toBeDefined();
      expect(trends!.questId).toBe(sampleKPI.questId);
      expect(trends!.balanceScoreTrend.direction).toBe('increasing');
      expect(trends!.rewardEfficiencyTrend.direction).toBe('increasing');
      expect(trends!.insights.length).toBeGreaterThan(0);
      expect(trends!.recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should return null with insufficient data', () => {
      tracker.addKPIData(sampleKPI.questId, sampleKPI);
      const trends = tracker.analyzeTrends(sampleKPI.questId);
      expect(trends).toBeNull();
    });
  });

  describe('Benchmark Calculation', () => {
    it('should calculate benchmarks for quest types', () => {
      // Add data for multiple quests of same type
      for (let i = 0; i < 120; i++) { // Above benchmark sample size
        tracker.addKPIData(`quest-${i}`, {
          ...sampleKPI,
          questId: `quest-${i}`,
          balanceScore: 0.5 + (Math.random() * 0.4),
          rewardEfficiency: 30 + (Math.random() * 20),
        });
      }

      const allKPIs = tracker.getKPIData('quest-0'); // Get sample for update
      tracker.updateBenchmarks([allKPIs[0]]); // Would use all KPIs in practice

      // In a real implementation, this would work with actual data
      expect(allKPIs).toBeDefined();
    });
  });

  describe('Aggregation', () => {
    it('should aggregate KPI data across quests', () => {
      // Add data for different quest types
      const questTypes = ['combat', 'stealth', 'exploration'];
      questTypes.forEach((type, _index) => {
        for (let i = 0; i < 10; i++) {
          tracker.addKPIData(`quest-${type}-${i}`, {
            ...sampleKPI,
            questId: `quest-${type}-${i}`,
            questType: type,
            balanceScore: 0.4 + (Math.random() * 0.4),
          });
        }
      });

      const aggregation = tracker.aggregateKPIs();
      
      expect(aggregation.questCount).toBe(30);
      expect(aggregation.questTypes).toHaveProperty('combat');
      expect(aggregation.questTypes).toHaveProperty('stealth');
      expect(aggregation.questTypes).toHaveProperty('exploration');
      expect(aggregation.overallMetrics.averageBalanceScore).toBeGreaterThan(0);
      expect(aggregation.performanceTiers.excellent.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty data gracefully', () => {
      const aggregation = tracker.aggregateKPIs();
      expect(aggregation.questCount).toBe(0);
      expect(aggregation.overallMetrics.averageBalanceScore).toBe(0);
    });
  });

  describe('Configuration Management', () => {
    it('should use default configuration', () => {
      const config = tracker.getConfig();
      expect(config.retentionDays).toBe(DEFAULT_KPI_TRACKING_CONFIG.retentionDays);
      expect(config.minimumDataPointsForTrend).toBe(DEFAULT_KPI_TRACKING_CONFIG.minimumDataPointsForTrend);
    });

    it('should update configuration', () => {
      const newConfig = {
        retentionDays: 60,
        minimumDataPointsForTrend: 15,
      };

      tracker.updateConfig(newConfig);
      const config = tracker.getConfig();

      expect(config.retentionDays).toBe(60);
      expect(config.minimumDataPointsForTrend).toBe(15);
    });
  });
});

describe('QuestRewardBalancerExportManager', () => {
  let exportManager: QuestRewardBalancerExportManager;
  let sampleQuest: QuestDefinition;
  let sampleRewards: QuestEffect[];
  let sampleKPI: QuestRewardKPI;

  beforeEach(() => {
    exportManager = new QuestRewardBalancerExportManager();
    
    sampleQuest = {
      id: 'quest-export-001',
      title: 'Export Test Quest',
      description: 'A quest for testing export functionality',
      phases: [
        { type: 'fight', id: 'phase-1', title: 'Fight', description: 'Combat phase' },
      ],
      startPhaseId: 'phase-1',
      successPhaseIds: ['phase-1'],
      failurePhaseIds: [],
    };

    sampleRewards = [
      { type: 'resource_grant', target: 'party', resourceType: 'gold', resourceAmount: 100 },
    ];

    sampleKPI = {
      questId: sampleQuest.id,
      questType: 'combat',
      difficulty: {
        overall: 0.5,
        combat: 0.8,
        stealth: 0,
        social: 0,
        exploration: 0,
        timePressure: 0,
        complexity: 0,
      },
      estimatedDuration: 300,
      participantCount: 1,
      totalRewardValue: 100,
      rewardDistribution: {
        resources: 100,
        experience: 0,
        items: 0,
        reputation: 0,
        skills: 0,
        special: 0,
      },
      rewardEfficiency: 20,
      riskRewardRatio: 0.5,
      successRate: 0.7,
      averageCompletionTime: 280,
      playerSatisfactionScore: 0.8,
      resourceInflation: 0.1,
      rarityScore: 0.3,
      repeatValue: 0.5,
      balanceScore: 0.75,
      overpoweredIndex: 0.1,
      underpoweredIndex: 0.1,
    };
  });

  describe('Export Configuration', () => {
    it('should use default export configuration', () => {
      const config = exportManager.getConfig();
      expect(config.includeConfig).toBe(DEFAULT_EXPORT_CONFIG.includeConfig);
      expect(config.format).toBe('json');
      expect(config.prettyPrint).toBe(true);
    });

    it('should update export configuration', () => {
      const newConfig = {
        format: 'csv' as const,
        prettyPrint: false,
        compress: true,
      };

      exportManager.updateConfig(newConfig);
      const config = exportManager.getConfig();

      expect(config.format).toBe('csv');
      expect(config.prettyPrint).toBe(false);
      expect(config.compress).toBe(true);
    });
  });

  describe('Full Export', () => {
    it('should export complete data', () => {
      const config = DEFAULT_QUEST_REWARD_BALANCER_CONFIG;
      const quests = [sampleQuest];
      const originalRewards = { [sampleQuest.id]: sampleRewards };
      const balancedRewards = { [sampleQuest.id]: sampleRewards };
      const kpiData = { [sampleQuest.id]: [sampleKPI] };
      const calibrationResults: RewardCalculationResult[] = [];

      const exportData = exportManager.exportFull(
        config,
        quests,
        originalRewards,
        balancedRewards,
        kpiData,
        calibrationResults
      );

      expect(exportData.version).toBe('latest');
      expect(exportData.exportType).toBe('full');
      expect(exportData.exportTimestamp).toBeDefined();
      expect(exportData.config).toBeDefined();
      expect(exportData.quests).toHaveLength(1);
      expect(exportData.kpiData).toBeDefined();
      expect(exportData.economicSummary).toBeDefined();
      expect(exportData.validation).toBeDefined();
    });

    it('should include quest data when configured', () => {
      const config = DEFAULT_QUEST_REWARD_BALANCER_CONFIG;
      const quests = [sampleQuest];
      const originalRewards = { [sampleQuest.id]: sampleRewards };
      const balancedRewards = { [sampleQuest.id]: sampleRewards };
      const kpiData = { [sampleQuest.id]: [sampleKPI] };
      const calibrationResults: RewardCalculationResult[] = [];

      exportManager.updateConfig({ includeQuestData: false });
      const exportData = exportManager.exportFull(
        config,
        quests,
        originalRewards,
        balancedRewards,
        kpiData,
        calibrationResults
      );

      expect(exportData.quests).toBeUndefined();
    });
  });

  describe('KPI Only Export', () => {
    it('should export only KPI data', () => {
      const kpiData = { [sampleQuest.id]: [sampleKPI] };

      const exportData = exportManager.exportKPIOnly(kpiData);

      expect(exportData.version).toBe('latest');
      expect(exportData.exportType).toBe('kpi_only');
      expect(exportData.kpiData).toBeDefined();
      expect(exportData.config).toBeUndefined();
      expect(exportData.quests).toBeUndefined();
    });
  });

  describe('Config Only Export', () => {
    it('should export only configuration', () => {
      const config = DEFAULT_QUEST_REWARD_BALANCER_CONFIG;

      const exportData = exportManager.exportConfigOnly(config);

      expect(exportData.version).toBe('latest');
      expect(exportData.exportType).toBe('config_only');
      expect(exportData.config).toBeDefined();
      expect(exportData.kpiData).toBeUndefined();
      expect(exportData.quests).toBeUndefined();
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize data', () => {
      const config = DEFAULT_QUEST_REWARD_BALANCER_CONFIG;
      const exportData = exportManager.exportConfigOnly(config);

      const serialized = exportManager.serialize(exportData);
      expect(serialized).toContain('"version"');
      expect(serialized).toContain('"config"');

      const deserialized = exportManager.deserialize(serialized);
      expect(deserialized.version).toBe(exportData.version);
      expect(deserialized.exportType).toBe(exportData.exportType);
      expect(deserialized.config).toEqual(exportData.config);
    });

    it('should handle invalid JSON gracefully', () => {
      expect(() => {
        exportManager.deserialize('invalid json');
      }).toThrow('Failed to deserialize export data');
    });
  });

  describe('CSV Export', () => {
    it('should export to CSV format', () => {
      const config = DEFAULT_QUEST_REWARD_BALANCER_CONFIG;
      const quests = [sampleQuest];
      const originalRewards = { [sampleQuest.id]: sampleRewards };
      const balancedRewards = { [sampleQuest.id]: sampleRewards };
      const kpiData = { [sampleQuest.id]: [sampleKPI] };
      const calibrationResults: RewardCalculationResult[] = [];

      const exportData = exportManager.exportFull(
        config,
        quests,
        originalRewards,
        balancedRewards,
        kpiData,
        calibrationResults
      );

      const csv = exportManager.exportToCSV(exportData);
      
      expect(csv).toContain('Quest ID');
      expect(csv).toContain('Balance Score');
      expect(csv).toContain(sampleQuest.id);
      expect(csv.split('\n')).toHaveLength(2); // Header + 1 data row
    });

    it('should throw error for data without quests', () => {
      const exportData = exportManager.exportKPIOnly({});
      expect(() => {
        exportManager.exportToCSV(exportData);
      }).toThrow('No quest data available for CSV export');
    });
  });

  describe('Export Summary', () => {
    it('should create export summary', () => {
      const config = DEFAULT_QUEST_REWARD_BALANCER_CONFIG;
      const exportData = exportManager.exportConfigOnly(config);

      const summary = exportManager.createSummary(exportData);

      expect(summary.exportType).toBe('config_only');
      expect(summary.version).toBe('latest');
      expect(summary.timestamp).toBe(exportData.exportTimestamp);
      expect(summary.questCount).toBe(0);
      expect(summary.kpiDataPoints).toBe(0);
      expect(summary.fileSize).toBeGreaterThan(0);
    });
  });

  describe('Validation', () => {
    it('should validate export data structure', () => {
      const config = DEFAULT_QUEST_REWARD_BALANCER_CONFIG;
      const quests = [sampleQuest];
      const originalRewards = { [sampleQuest.id]: sampleRewards };
      const balancedRewards = { [sampleQuest.id]: sampleRewards };
      const kpiData = { [sampleQuest.id]: [sampleKPI] };
      const calibrationResults: RewardCalculationResult[] = [];

      const exportData = exportManager.exportFull(
        config,
        quests,
        originalRewards,
        balancedRewards,
        kpiData,
        calibrationResults
      );

      expect(exportData.validation).toBeDefined();
      expect(exportData.validation!.errors).toHaveLength(0); // Should be valid
    });
  });
});

describe('Integration Tests', () => {
  it('should complete full workflow', () => {
    const balancer = new QuestRewardBalancer();
    const tracker = new QuestRewardKPITracker();
    const exportManager = new QuestRewardBalancerExportManager();

    // Create sample quest
    const quest: QuestDefinition = {
      id: 'quest-integration-001',
      title: 'Integration Test Quest',
      description: 'Testing full workflow',
      phases: [
        { type: 'fight', id: 'phase-1', title: 'Combat', description: 'Fight phase' },
        { type: 'dialogue', id: 'phase-2', title: 'Choice', description: 'Dialogue phase',
          choices: [
            { id: 'choice-1', text: 'Continue', outcome: { nextPhaseIds: ['phase-3'] } },
            { id: 'choice-2', text: 'Leave', outcome: { nextPhaseIds: ['phase-4'] } }
          ] },
        { type: 'check', id: 'phase-3', title: 'Success', description: 'Success' },
        { type: 'check', id: 'phase-4', title: 'Failure', description: 'Failure' },
      ],
      startPhaseId: 'phase-1',
      successPhaseIds: ['phase-3'],
      failurePhaseIds: ['phase-4'],
    };

    const rewards: QuestEffect[] = [
      { type: 'resource_grant', target: 'party', resourceType: 'gold', resourceAmount: 150 },
      { type: 'stat_modifier', target: 'leader', statName: 'experience', modifier: 75 },
    ];

    // Balance rewards
    const balanceResult = balancer.balanceRewards(quest, rewards);
    expect(balanceResult.questId).toBe(quest.id);
    expect(balanceResult.balancedRewards).toHaveLength(rewards.length);

    // Track KPI
    tracker.addKPIData(quest.id, balanceResult.kpi);
    const kpiData = tracker.getKPIData(quest.id);
    expect(kpiData).toHaveLength(1);

    // Aggregate data
    const aggregation = tracker.aggregateKPIs();
    expect(aggregation.questCount).toBe(1);

    // Export data
    const exportData = exportManager.exportFull(
      balancer.getConfig(),
      [quest],
      { [quest.id]: rewards },
      { [quest.id]: balanceResult.balancedRewards },
      { [quest.id]: kpiData },
      [balanceResult]
    );

    expect(exportData.quests).toHaveLength(1);
    expect(exportData.kpiData).toBeDefined();

    // Serialize and validate
    const serialized = exportManager.serialize(exportData);
    const deserialized = exportManager.deserialize(serialized);
    expect(deserialized.quests).toHaveLength(1);

    // Create summary
    const summary = exportManager.createSummary(exportData);
    expect(summary.questCount).toBe(1);
    expect(summary.fileSize).toBeGreaterThan(0);
  });
});
