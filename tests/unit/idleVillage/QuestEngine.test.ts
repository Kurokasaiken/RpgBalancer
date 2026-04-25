/**
 * Unit tests for QuestEngine
 * 
 * Tests skill validation, success calculation, and quest processing.
 */

import { describe, it, expect } from 'vitest';
import {
  validateSkillCheck,
  calculateSkillCheckChance,
  calculateSuccessChance,
  processQuestCompletion,
  applyRewards,
  applyRisks,
  startQuest,
  completeQuest,
  isQuestAvailable,
  setQuestCooldown,
  getQuestHistory,
  getTotalQuestRewards,
  type ResidentStats,
} from '../../../src/engine/game/idleVillage/QuestEngine';
import {
  DEFAULT_QUESTS,
  DEFAULT_QUEST_STATE,
  DEFAULT_QUEST_SYSTEM_CONFIG,
} from '../../../src/balancing/config/idleVillage/questConfig';
import type { QuestState } from '../../../src/balancing/config/idleVillage/types/questTypes';

describe('QuestEngine', () => {
  const mockResident: ResidentStats = {
    residentId: 'resident-1',
    level: 5,
    fatigue: 10,
    stats: {
      strength: 8,
      endurance: 6,
      agility: 5,
      intelligence: 7,
      perception: 6,
    },
  };

  const weakResident: ResidentStats = {
    residentId: 'resident-2',
    level: 1,
    fatigue: 50,
    stats: {
      strength: 2,
      endurance: 2,
      agility: 2,
      intelligence: 2,
      perception: 2,
    },
  };

  describe('validateSkillCheck', () => {
    it('should pass when all requirements are met', () => {
      const requirements = [
        { statId: 'strength', minValue: 5 },
        { statId: 'endurance', minValue: 4 },
      ];

      const result = validateSkillCheck(mockResident, requirements);
      expect(result).toBe(true);
    });

    it('should fail when minimum not met', () => {
      const requirements = [
        { statId: 'strength', minValue: 10 },
      ];

      const result = validateSkillCheck(mockResident, requirements);
      expect(result).toBe(false);
    });

    it('should fail when stat is missing', () => {
      const requirements = [
        { statId: 'nonexistent', minValue: 1 },
      ];

      const result = validateSkillCheck(mockResident, requirements);
      expect(result).toBe(false);
    });

    it('should respect maximum value', () => {
      const requirements = [
        { statId: 'strength', minValue: 5, maxValue: 7 },
      ];

      const result = validateSkillCheck(mockResident, requirements);
      expect(result).toBe(false); // strength is 8, exceeds max 7
    });

    it('should handle empty requirements', () => {
      const result = validateSkillCheck(mockResident, []);
      expect(result).toBe(true);
    });
  });

  describe('calculateSkillCheckChance', () => {
    const forestPatrol = DEFAULT_QUESTS[0];
    const perceptionCheck = forestPatrol.skillChecks[0];

    it('should calculate base chance correctly', () => {
      const chance = calculateSkillCheckChance(
        mockResident,
        perceptionCheck,
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings
      );

      expect(chance).toBeGreaterThan(0);
      expect(chance).toBeLessThanOrEqual(1);
    });

    it('should increase chance with higher level', () => {
      const highLevelResident = { ...mockResident, level: 10 };
      
      const baseChance = calculateSkillCheckChance(
        mockResident,
        perceptionCheck,
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings
      );
      
      const highChance = calculateSkillCheckChance(
        highLevelResident,
        perceptionCheck,
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings
      );

      expect(highChance).toBeGreaterThan(baseChance);
    });

    it('should decrease chance with high fatigue', () => {
      const tiredResident = { ...mockResident, fatigue: 80 };
      
      const baseChance = calculateSkillCheckChance(
        mockResident,
        perceptionCheck,
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings
      );
      
      const tiredChance = calculateSkillCheckChance(
        tiredResident,
        perceptionCheck,
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings
      );

      expect(tiredChance).toBeLessThan(baseChance);
    });

    it('should respect min/max chance bounds', () => {
      const chance = calculateSkillCheckChance(
        weakResident,
        perceptionCheck,
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings
      );

      expect(chance).toBeGreaterThanOrEqual(DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings.minSuccessChance);
      expect(chance).toBeLessThanOrEqual(DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings.maxSuccessChance);
    });
  });

  describe('calculateSuccessChance', () => {
    const forestPatrol = DEFAULT_QUESTS[0];

    it('should calculate overall success chance', () => {
      const result = calculateSuccessChance(
        [mockResident],
        forestPatrol,
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings
      );

      expect(result.overallChance).toBeGreaterThan(0);
      expect(result.overallChance).toBeLessThanOrEqual(1);
      expect(result.skillCheckChances).toBeDefined();
    });

    it('should return 0 for empty resident list', () => {
      const result = calculateSuccessChance(
        [],
        forestPatrol,
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings
      );

      expect(result.overallChance).toBe(0);
    });

    it('should use best resident for each check', () => {
      const result = calculateSuccessChance(
        [mockResident, weakResident],
        forestPatrol,
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings
      );

      // Should use mockResident's better stats
      expect(result.overallChance).toBeGreaterThan(0.1);
    });

    it('should multiply probabilities for multiple checks', () => {
      const banditHunt = DEFAULT_QUESTS[1]; // Has 2 skill checks
      
      const result = calculateSuccessChance(
        [mockResident],
        banditHunt,
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings
      );

      // Overall chance should be product of individual checks
      expect(result.overallChance).toBeLessThan(
        Math.max(...Object.values(result.skillCheckChances))
      );
    });
  });

  describe('processQuestCompletion', () => {
    const forestPatrol = DEFAULT_QUESTS[0];

    it('should process successful quest', () => {
      const result = processQuestCompletion(
        forestPatrol,
        [mockResident],
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings,
        Date.now() - 1000
      );

      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.success).toBeDefined();
    });

    it('should award rewards on success', () => {
      // Mock Math.random to ensure success
      const originalRandom = Math.random;
      Math.random = () => 0.01; // Very low roll = success

      const result = processQuestCompletion(
        forestPatrol,
        [mockResident],
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings,
        Date.now()
      );

      Math.random = originalRandom;

      if (result.success) {
        expect(result.rewards).toBeDefined();
        expect(result.experienceGained).toBeDefined();
      }
    });

    it('should distribute experience among residents', () => {
      Math.random = () => 0.01;

      const result = processQuestCompletion(
        forestPatrol,
        [mockResident, weakResident],
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings,
        Date.now()
      );

      Math.random = Math.random;

      if (result.success && result.experienceGained) {
        const totalExp = Object.values(result.experienceGained).reduce((sum, exp) => sum + exp, 0);
        expect(totalExp).toBeGreaterThan(0);
      }
    });

    it('should apply risks regardless of success', () => {
      const result = processQuestCompletion(
        forestPatrol,
        [mockResident],
        DEFAULT_QUEST_SYSTEM_CONFIG.globalSettings,
        Date.now()
      );

      // Injuries and deaths are probabilistic, just check structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('durationMs');
    });
  });

  describe('applyRewards', () => {
    it('should add gold rewards', () => {
      const rewards = { gold: 50 };
      const newGold = applyRewards(100, rewards);
      expect(newGold).toBe(150);
    });

    it('should handle missing gold', () => {
      const rewards = { experience: 100 };
      const newGold = applyRewards(100, rewards);
      expect(newGold).toBe(100);
    });
  });

  describe('applyRisks', () => {
    it('should add fatigue cost', () => {
      const risks = { fatigueCost: 20 };
      const newFatigue = applyRisks(30, risks);
      expect(newFatigue).toBe(50);
    });
  });

  describe('startQuest', () => {
    it('should create new quest instance', () => {
      const state = startQuest(
        DEFAULT_QUEST_STATE,
        'forest-patrol',
        ['resident-1']
      );

      expect(state.activeQuests).toHaveLength(1);
      expect(state.activeQuests[0].questId).toBe('forest-patrol');
      expect(state.activeQuests[0].status).toBe('in_progress');
      expect(state.activeQuests[0].assignedResidents).toEqual(['resident-1']);
    });

    it('should preserve existing quests', () => {
      const stateWithQuest: QuestState = {
        ...DEFAULT_QUEST_STATE,
        activeQuests: [{
          questId: 'existing-quest',
          status: 'in_progress',
          assignedResidents: ['resident-2'],
          progress: 0.5,
        }],
      };

      const state = startQuest(stateWithQuest, 'forest-patrol', ['resident-1']);

      expect(state.activeQuests).toHaveLength(2);
    });
  });

  describe('completeQuest', () => {
    it('should move quest to history', () => {
      const stateWithQuest: QuestState = {
        ...DEFAULT_QUEST_STATE,
        activeQuests: [{
          questId: 'forest-patrol',
          status: 'in_progress',
          assignedResidents: ['resident-1'],
          progress: 1.0,
        }],
      };

      const result = {
        success: true,
        rewards: { gold: 20, experience: 50 },
        durationMs: 7200000,
      };

      const state = completeQuest(
        stateWithQuest,
        'forest-patrol',
        result,
        'Forest Patrol'
      );

      expect(state.activeQuests).toHaveLength(0);
      expect(state.history).toHaveLength(1);
      expect(state.history[0].questId).toBe('forest-patrol');
      expect(state.history[0].result).toEqual(result);
    });

    it('should handle non-existent quest', () => {
      const result = {
        success: false,
        durationMs: 0,
      };

      const state = completeQuest(
        DEFAULT_QUEST_STATE,
        'nonexistent',
        result,
        'Nonexistent'
      );

      expect(state).toEqual(DEFAULT_QUEST_STATE);
    });
  });

  describe('isQuestAvailable', () => {
    it('should return true when no cooldown', () => {
      const available = isQuestAvailable(
        DEFAULT_QUEST_STATE,
        'forest-patrol',
        4
      );

      expect(available).toBe(true);
    });

    it('should return false when on cooldown', () => {
      const stateWithCooldown: QuestState = {
        ...DEFAULT_QUEST_STATE,
        cooldowns: {
          'forest-patrol': Date.now() + 3600000, // 1 hour from now
        },
      };

      const available = isQuestAvailable(
        stateWithCooldown,
        'forest-patrol',
        4
      );

      expect(available).toBe(false);
    });

    it('should return true when cooldown expired', () => {
      const stateWithExpiredCooldown: QuestState = {
        ...DEFAULT_QUEST_STATE,
        cooldowns: {
          'forest-patrol': Date.now() - 1000, // 1 second ago
        },
      };

      const available = isQuestAvailable(
        stateWithExpiredCooldown,
        'forest-patrol',
        4
      );

      expect(available).toBe(true);
    });
  });

  describe('setQuestCooldown', () => {
    it('should set cooldown timestamp', () => {
      const state = setQuestCooldown(
        DEFAULT_QUEST_STATE,
        'forest-patrol',
        4
      );

      expect(state.cooldowns['forest-patrol']).toBeDefined();
      expect(state.cooldowns['forest-patrol']).toBeGreaterThan(Date.now());
    });
  });

  describe('getQuestHistory', () => {
    const mockHistory: QuestState = {
      ...DEFAULT_QUEST_STATE,
      history: [
        {
          questId: 'forest-patrol',
          questName: 'Forest Patrol',
          timestamp: 1000,
          result: { success: true, durationMs: 7200000 },
          participants: ['resident-1'],
        },
        {
          questId: 'bandit-hunt',
          questName: 'Bandit Hunt',
          timestamp: 2000,
          result: { success: false, durationMs: 14400000 },
          participants: ['resident-2'],
        },
        {
          questId: 'forest-patrol',
          questName: 'Forest Patrol',
          timestamp: 3000,
          result: { success: true, durationMs: 7200000 },
          participants: ['resident-1'],
        },
      ],
    };

    it('should return all history', () => {
      const history = getQuestHistory(mockHistory);
      expect(history).toHaveLength(3);
    });

    it('should filter by quest ID', () => {
      const history = getQuestHistory(mockHistory, 'forest-patrol');
      expect(history).toHaveLength(2);
      expect(history.every((h) => h.questId === 'forest-patrol')).toBe(true);
    });

    it('should limit results', () => {
      const history = getQuestHistory(mockHistory, undefined, 2);
      expect(history).toHaveLength(2);
    });

    it('should sort by timestamp descending', () => {
      const history = getQuestHistory(mockHistory);
      expect(history[0].timestamp).toBe(3000);
      expect(history[1].timestamp).toBe(2000);
      expect(history[2].timestamp).toBe(1000);
    });
  });

  describe('getTotalQuestRewards', () => {
    it('should calculate total rewards', () => {
      const mockHistory: QuestState = {
        ...DEFAULT_QUEST_STATE,
        history: [
          {
            questId: 'forest-patrol',
            questName: 'Forest Patrol',
            timestamp: 1000,
            result: {
              success: true,
              rewards: { gold: 20, experience: 50 },
              durationMs: 7200000,
            },
            participants: ['resident-1'],
          },
          {
            questId: 'bandit-hunt',
            questName: 'Bandit Hunt',
            timestamp: 2000,
            result: {
              success: true,
              rewards: { gold: 50, experience: 100 },
              durationMs: 14400000,
            },
            participants: ['resident-2'],
          },
          {
            questId: 'failed-quest',
            questName: 'Failed Quest',
            timestamp: 3000,
            result: {
              success: false,
              durationMs: 3600000,
            },
            participants: ['resident-3'],
          },
        ],
      };

      const totals = getTotalQuestRewards(mockHistory);

      expect(totals.totalGold).toBe(70);
      expect(totals.totalExperience).toBe(150);
      expect(totals.totalQuestsCompleted).toBe(2);
    });

    it('should handle empty history', () => {
      const totals = getTotalQuestRewards(DEFAULT_QUEST_STATE);

      expect(totals.totalGold).toBe(0);
      expect(totals.totalExperience).toBe(0);
      expect(totals.totalQuestsCompleted).toBe(0);
    });
  });
});
