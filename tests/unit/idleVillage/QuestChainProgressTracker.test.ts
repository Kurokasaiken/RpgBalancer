/**
 * Quest Chain Progress Tracker Tests – NP-141
 * 
 * Unit tests for the quest chain progress tracking system.
 * 
 * @since NP-141
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  QuestChainProgressTracker,
  createQuestChainProgressTracker,
} from '@/engine/game/idleVillage/QuestChainProgressTracker';
import type { PlayerContext } from '@/engine/game/idleVillage/QuestChainProgressTracker';
import type {
  QuestChainConfig,
  QuestConfig,
} from '@/balancing/config/idleVillage/questChainConfig';
import { DEFAULT_QUEST_CHAINS } from '@/balancing/config/idleVillage/questChainConfig';

describe('QuestChainProgressTracker', () => {
  let tracker: QuestChainProgressTracker;
  let testChain: QuestChainConfig;
  let playerContext: PlayerContext;

  beforeEach(() => {
    testChain = {
      id: 'test-chain',
      name: 'Test Quest Chain',
      description: 'A test quest chain',
      quests: [
        {
          id: 'quest-1',
          name: 'First Quest',
          description: 'Complete the first quest',
          objectives: [
            {
              id: 'obj-1',
              description: 'Collect 10 items',
              target: 10,
              current: 0,
              completed: false,
              trackingKey: 'items_collected',
            },
          ],
          milestones: [
            {
              id: 'milestone-1',
              name: 'First Milestone',
              description: 'Complete first objective',
              requiredObjectives: ['obj-1'],
              rewards: [{ type: 'gold', value: 50 }],
              completed: false,
            },
          ],
          rewards: [{ type: 'experience', value: 100 }],
          status: 'available',
          nextQuests: ['quest-2'],
        },
        {
          id: 'quest-2',
          name: 'Second Quest',
          description: 'Complete the second quest',
          objectives: [
            {
              id: 'obj-2',
              description: 'Defeat 5 enemies',
              target: 5,
              current: 0,
              completed: false,
            },
          ],
          milestones: [],
          rewards: [{ type: 'gold', value: 100 }],
          unlockConditions: [{ type: 'quest_completed', value: 'quest-1' }],
          status: 'locked',
        },
      ],
      startingQuests: ['quest-1'],
      completionRewards: [{ type: 'unlock', value: 'special-feature' }],
      completed: false,
    };

    tracker = new QuestChainProgressTracker(testChain);

    playerContext = {
      playerLevel: 5,
      playerStats: { strength: 10, intelligence: 8 },
      ownedItems: ['sword', 'shield'],
    };
  });

  describe('Initialization', () => {
    it('should initialize with default progress state', () => {
      const progress = tracker.getProgressState();

      expect(progress.chainId).toBe('test-chain');
      expect(progress.completedQuests).toEqual([]);
      expect(progress.activeQuests).toEqual([]);
      expect(progress.availableQuests).toEqual(['quest-1']);
      expect(progress.completionPercentage).toBe(0);
      expect(progress.completed).toBe(false);
    });

    it('should initialize quest progress states', () => {
      const progress = tracker.getProgressState();

      expect(progress.questProgress['quest-1'].status).toBe('available');
      expect(progress.questProgress['quest-2'].status).toBe('locked');
    });

    it('should initialize with custom progress state', () => {
      const customProgress = {
        chainId: 'test-chain',
        questProgress: {
          'quest-1': {
            questId: 'quest-1',
            status: 'completed' as const,
            objectives: [],
            completedMilestones: [],
            completedAt: Date.now(),
          },
        },
        completedQuests: ['quest-1'],
        activeQuests: [],
        availableQuests: ['quest-2'],
        completionPercentage: 50,
        completed: false,
      };

      const customTracker = new QuestChainProgressTracker(testChain, customProgress);
      const progress = customTracker.getProgressState();

      expect(progress.completedQuests).toEqual(['quest-1']);
      expect(progress.availableQuests).toEqual(['quest-2']);
    });
  });

  describe('Quest State Management', () => {
    it('should start an available quest', () => {
      const result = tracker.startQuest('quest-1');

      expect(result).toBe(true);

      const progress = tracker.getQuestProgress('quest-1');
      expect(progress?.status).toBe('in_progress');
      expect(progress?.startedAt).toBeDefined();

      const chainProgress = tracker.getProgressState();
      expect(chainProgress.activeQuests).toContain('quest-1');
      expect(chainProgress.availableQuests).not.toContain('quest-1');
    });

    it('should not start a locked quest', () => {
      const result = tracker.startQuest('quest-2');

      expect(result).toBe(false);

      const progress = tracker.getQuestProgress('quest-2');
      expect(progress?.status).toBe('locked');
    });

    it('should not start a non-existent quest', () => {
      const result = tracker.startQuest('non-existent');

      expect(result).toBe(false);
    });

    it('should complete a quest when all objectives are done', () => {
      tracker.startQuest('quest-1');
      tracker.updateObjectiveProgress('quest-1', 'obj-1', 10);

      const progress = tracker.getQuestProgress('quest-1');
      expect(progress?.status).toBe('completed');
      expect(progress?.completedAt).toBeDefined();

      const chainProgress = tracker.getProgressState();
      expect(chainProgress.completedQuests).toContain('quest-1');
      expect(chainProgress.activeQuests).not.toContain('quest-1');
    });

    it('should fail a quest', () => {
      tracker.startQuest('quest-1');
      const result = tracker.failQuest('quest-1', 'timeout');

      expect(result).toBe(true);

      const progress = tracker.getQuestProgress('quest-1');
      expect(progress?.status).toBe('failed');

      const chainProgress = tracker.getProgressState();
      expect(chainProgress.activeQuests).not.toContain('quest-1');
    });
  });

  describe('Objective Progress', () => {
    beforeEach(() => {
      tracker.startQuest('quest-1');
    });

    it('should update objective progress', () => {
      const result = tracker.updateObjectiveProgress('quest-1', 'obj-1', 5);

      expect(result).toBe(true);

      const progress = tracker.getQuestProgress('quest-1');
      const objective = progress?.objectives.find(obj => obj.id === 'obj-1');
      expect(objective?.current).toBe(5);
      expect(objective?.completed).toBe(false);
    });

    it('should complete objective when target is reached', () => {
      tracker.updateObjectiveProgress('quest-1', 'obj-1', 10);

      const progress = tracker.getQuestProgress('quest-1');
      const objective = progress?.objectives.find(obj => obj.id === 'obj-1');
      expect(objective?.current).toBe(10);
      expect(objective?.completed).toBe(true);
    });

    it('should increment objective progress', () => {
      tracker.incrementObjectiveProgress('quest-1', 'obj-1', 3);
      tracker.incrementObjectiveProgress('quest-1', 'obj-1', 2);

      const progress = tracker.getQuestProgress('quest-1');
      const objective = progress?.objectives.find(obj => obj.id === 'obj-1');
      expect(objective?.current).toBe(5);
    });

    it('should not exceed target value', () => {
      tracker.updateObjectiveProgress('quest-1', 'obj-1', 15);

      const progress = tracker.getQuestProgress('quest-1');
      const objective = progress?.objectives.find(obj => obj.id === 'obj-1');
      expect(objective?.current).toBe(10);
    });

    it('should not update progress for non-active quest', () => {
      const result = tracker.updateObjectiveProgress('quest-2', 'obj-2', 5);

      expect(result).toBe(false);
    });
  });

  describe('Milestone Completion', () => {
    beforeEach(() => {
      tracker.startQuest('quest-1');
    });

    it('should complete milestone when requirements are met', () => {
      tracker.updateObjectiveProgress('quest-1', 'obj-1', 10);

      const progress = tracker.getQuestProgress('quest-1');
      expect(progress?.completedMilestones).toContain('milestone-1');
    });

    it('should emit telemetry on milestone completion', () => {
      const eventSpy = vi.fn();
      window.addEventListener('quest_milestone_reached', eventSpy);

      tracker.updateObjectiveProgress('quest-1', 'obj-1', 10);

      expect(eventSpy).toHaveBeenCalled();
      window.removeEventListener('quest_milestone_reached', eventSpy);
    });

    it('should not complete milestone multiple times', () => {
      tracker.updateObjectiveProgress('quest-1', 'obj-1', 10);
      
      const progress1 = tracker.getQuestProgress('quest-1');
      const milestoneCount1 = progress1?.completedMilestones.length;

      tracker.updateObjectiveProgress('quest-1', 'obj-1', 10);

      const progress2 = tracker.getQuestProgress('quest-1');
      const milestoneCount2 = progress2?.completedMilestones.length;

      expect(milestoneCount1).toBe(milestoneCount2);
    });
  });

  describe('Quest Unlocking', () => {
    it('should unlock next quest when current quest is completed', () => {
      tracker.startQuest('quest-1');
      tracker.updateObjectiveProgress('quest-1', 'obj-1', 10);

      const progress = tracker.getQuestProgress('quest-2');
      expect(progress?.status).toBe('available');

      const chainProgress = tracker.getProgressState();
      expect(chainProgress.availableQuests).toContain('quest-2');
    });

    it('should check unlock conditions', () => {
      const isAvailable = tracker.isQuestAvailable('quest-2', playerContext);
      expect(isAvailable).toBe(false);

      tracker.startQuest('quest-1');
      tracker.updateObjectiveProgress('quest-1', 'obj-1', 10);

      const isAvailableNow = tracker.isQuestAvailable('quest-2', playerContext);
      expect(isAvailableNow).toBe(true);
    });

    it('should update available quests based on player context', () => {
      tracker.startQuest('quest-1');
      tracker.completeQuest('quest-1');

      const available = tracker.updateAvailableQuests(playerContext);

      expect(available).toContain('quest-2');
    });
  });

  describe('Branching Paths', () => {
    it('should select a branch', () => {
      const result = tracker.selectBranch('quest-1', 'branch-a');

      expect(result).toBe(true);

      const progress = tracker.getQuestProgress('quest-1');
      expect(progress?.selectedBranch).toBe('branch-a');
    });

    it('should record branch selection event', () => {
      tracker.selectBranch('quest-1', 'branch-a');

      const events = tracker.getEventHistory();
      const branchEvent = events.find(e => e.type === 'branch_selected');

      expect(branchEvent).toBeDefined();
      expect(branchEvent?.data?.branchId).toBe('branch-a');
    });
  });

  describe('Chain Completion', () => {
    it('should calculate chain completion percentage', () => {
      expect(tracker.getChainCompletionPercentage()).toBe(0);

      tracker.startQuest('quest-1');
      tracker.completeQuest('quest-1');

      expect(tracker.getChainCompletionPercentage()).toBe(50);

      tracker.startQuest('quest-2');
      tracker.completeQuest('quest-2');

      expect(tracker.getChainCompletionPercentage()).toBe(100);
    });

    it('should mark chain as completed when all quests are done', () => {
      tracker.startQuest('quest-1');
      tracker.completeQuest('quest-1');
      tracker.startQuest('quest-2');
      tracker.completeQuest('quest-2');

      const progress = tracker.getProgressState();
      expect(progress.completed).toBe(true);
    });

    it('should emit telemetry on chain completion', () => {
      const eventSpy = vi.fn();
      window.addEventListener('quest_chain_completed', eventSpy);

      tracker.startQuest('quest-1');
      tracker.completeQuest('quest-1');
      tracker.startQuest('quest-2');
      tracker.completeQuest('quest-2');

      expect(eventSpy).toHaveBeenCalled();
      window.removeEventListener('quest_chain_completed', eventSpy);
    });
  });

  describe('Quest Completion Percentage', () => {
    it('should calculate quest completion percentage', () => {
      expect(tracker.getQuestCompletionPercentage('quest-1')).toBe(0);

      tracker.startQuest('quest-1');
      const afterStart = tracker.getQuestCompletionPercentage('quest-1');
      expect(afterStart).toBeGreaterThanOrEqual(0);

      tracker.updateObjectiveProgress('quest-1', 'obj-1', 5);
      const afterPartial = tracker.getQuestCompletionPercentage('quest-1');
      expect(afterPartial).toBeGreaterThanOrEqual(0);
      expect(afterPartial).toBeLessThanOrEqual(100);

      tracker.updateObjectiveProgress('quest-1', 'obj-1', 10);
      expect(tracker.getQuestCompletionPercentage('quest-1')).toBe(100);
    });
  });

  describe('Event History', () => {
    it('should record quest started event', () => {
      tracker.startQuest('quest-1');

      const events = tracker.getEventHistory();
      const startEvent = events.find(e => e.type === 'quest_started');

      expect(startEvent).toBeDefined();
      expect(startEvent?.questId).toBe('quest-1');
    });

    it('should record objective progress event', () => {
      tracker.startQuest('quest-1');
      tracker.updateObjectiveProgress('quest-1', 'obj-1', 5);

      const events = tracker.getEventHistory();
      const progressEvent = events.find(e => e.type === 'objective_progress');

      expect(progressEvent).toBeDefined();
      expect(progressEvent?.data?.objectiveId).toBe('obj-1');
    });

    it('should record quest completed event', () => {
      tracker.startQuest('quest-1');
      tracker.completeQuest('quest-1');

      const events = tracker.getEventHistory();
      const completeEvent = events.find(e => e.type === 'quest_completed');

      expect(completeEvent).toBeDefined();
    });

    it('should limit event history size', () => {
      for (let i = 0; i < 150; i++) {
        tracker.startQuest('quest-1');
        tracker.failQuest('quest-1');
      }

      const events = tracker.getEventHistory();
      expect(events.length).toBeLessThanOrEqual(100);
    });

    it('should clear event history', () => {
      tracker.startQuest('quest-1');
      tracker.clearEventHistory();

      const events = tracker.getEventHistory();
      expect(events).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      const stats = tracker.getStatistics();

      expect(stats.totalQuests).toBe(2);
      expect(stats.completedQuests).toBe(0);
      expect(stats.activeQuests).toBe(0);
      expect(stats.availableQuests).toBe(1);
      expect(stats.lockedQuests).toBe(1);
      expect(stats.completionPercentage).toBe(0);
    });

    it('should update statistics as quests progress', () => {
      tracker.startQuest('quest-1');

      let stats = tracker.getStatistics();
      expect(stats.activeQuests).toBe(1);
      expect(stats.availableQuests).toBe(0);

      tracker.completeQuest('quest-1');

      stats = tracker.getStatistics();
      expect(stats.completedQuests).toBe(1);
      expect(stats.activeQuests).toBe(0);
    });

    it('should count milestones correctly', () => {
      tracker.startQuest('quest-1');
      tracker.updateObjectiveProgress('quest-1', 'obj-1', 10);

      const stats = tracker.getStatistics();
      expect(stats.totalMilestones).toBe(1);
      expect(stats.completedMilestones).toBe(1);
    });
  });

  describe('State Persistence', () => {
    it('should export state', () => {
      tracker.startQuest('quest-1');
      tracker.updateObjectiveProgress('quest-1', 'obj-1', 5);

      const state = tracker.exportState();

      expect(state.chainId).toBe('test-chain');
      expect(state.progressState.activeQuests).toContain('quest-1');
      expect(state.eventHistory.length).toBeGreaterThan(0);
    });

    it('should import state', () => {
      const state = {
        progressState: {
          chainId: 'test-chain',
          questProgress: {
            'quest-1': {
              questId: 'quest-1',
              status: 'completed' as const,
              objectives: [],
              completedMilestones: [],
              completedAt: Date.now(),
            },
          },
          completedQuests: ['quest-1'],
          activeQuests: [],
          availableQuests: ['quest-2'],
          completionPercentage: 50,
          completed: false,
        },
        eventHistory: [],
      };

      tracker.importState(state);

      const progress = tracker.getProgressState();
      expect(progress.completedQuests).toContain('quest-1');
      expect(progress.availableQuests).toContain('quest-2');
    });

    it('should reset to initial state', () => {
      tracker.startQuest('quest-1');
      tracker.updateObjectiveProgress('quest-1', 'obj-1', 5);

      tracker.reset();

      const progress = tracker.getProgressState();
      expect(progress.completedQuests).toHaveLength(0);
      expect(progress.activeQuests).toHaveLength(0);
      expect(progress.availableQuests).toEqual(['quest-1']);
    });
  });

  describe('Factory Function', () => {
    it('should create tracker with factory function', () => {
      const newTracker = createQuestChainProgressTracker(testChain);
      expect(newTracker).toBeInstanceOf(QuestChainProgressTracker);
    });

    it('should create tracker with initial progress', () => {
      const initialProgress = {
        chainId: 'test-chain',
        questProgress: {},
        completedQuests: [],
        activeQuests: [],
        availableQuests: ['quest-1'],
        completionPercentage: 0,
        completed: false,
      };

      const newTracker = createQuestChainProgressTracker(testChain, initialProgress);
      const progress = newTracker.getProgressState();

      expect(progress.availableQuests).toEqual(['quest-1']);
    });
  });

  describe('Default Quest Chains', () => {
    it('should load default tutorial chain', () => {
      const tutorialChain = DEFAULT_QUEST_CHAINS[0];
      const tutorialTracker = new QuestChainProgressTracker(tutorialChain);

      const progress = tutorialTracker.getProgressState();
      expect(progress.chainId).toBe('tutorial-chain');
      expect(progress.availableQuests).toContain('tutorial-1');
    });

    it('should complete tutorial chain', () => {
      const tutorialChain = DEFAULT_QUEST_CHAINS[0];
      const tutorialTracker = new QuestChainProgressTracker(tutorialChain);

      tutorialTracker.startQuest('tutorial-1');
      tutorialTracker.updateObjectiveProgress('tutorial-1', 'assign-resident', 1);

      const progress1 = tutorialTracker.getQuestProgress('tutorial-1');
      expect(progress1?.status).toBe('completed');

      tutorialTracker.startQuest('tutorial-2');
      tutorialTracker.updateObjectiveProgress('tutorial-2', 'gather-gold', 50);
      tutorialTracker.updateObjectiveProgress('tutorial-2', 'gather-food', 20);

      const progress2 = tutorialTracker.getQuestProgress('tutorial-2');
      expect(progress2?.status).toBe('completed');

      const chainProgress = tutorialTracker.getProgressState();
      expect(chainProgress.completed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle quest with no objectives', () => {
      const emptyQuest: QuestConfig = {
        id: 'empty-quest',
        name: 'Empty Quest',
        description: 'A quest with no objectives',
        objectives: [],
        milestones: [],
        rewards: [],
        status: 'available',
      };

      const emptyChain: QuestChainConfig = {
        id: 'empty-chain',
        name: 'Empty Chain',
        description: 'Test chain',
        quests: [emptyQuest],
        startingQuests: ['empty-quest'],
        completed: false,
      };

      const emptyTracker = new QuestChainProgressTracker(emptyChain);
      emptyTracker.startQuest('empty-quest');

      const completion = emptyTracker.getQuestCompletionPercentage('empty-quest');
      expect(completion).toBe(0);
    });

    it('should handle invalid quest ID gracefully', () => {
      const result = tracker.updateObjectiveProgress('invalid-quest', 'obj-1', 5);
      expect(result).toBe(false);
    });

    it('should handle invalid objective ID gracefully', () => {
      tracker.startQuest('quest-1');
      const result = tracker.updateObjectiveProgress('quest-1', 'invalid-obj', 5);
      expect(result).toBe(false);
    });
  });
});
