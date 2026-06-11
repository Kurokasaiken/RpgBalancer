/**
 * Unit tests for dual variance system (difficulty + reward) in QuestResolver.
 * @module tests/unit/idleVillage/QuestDualVariance
 */

import { describe, it, expect } from 'vitest';
import { resolveQuest, type QuestResolverDeps } from '@/engine/game/idleVillage/QuestResolver';
import type { VillageState, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import type { IdleVillageConfig, ActivityDefinition, ActivityRollCategory } from '@/balancing/config/idleVillage/types';
import type { QuestOutcome } from '@/engine/game/idleVillage/QuestPowerEngine';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const createMockActivity = (overrides?: Partial<ActivityDefinition>): ActivityDefinition => ({
  id: 'test-quest',
  label: 'Test Quest',
  tags: ['quest'],
  slotTags: ['world_quest'],
  resolutionEngineId: 'quest_dispatch',
  level: 3,
  dangerRating: 2,
  rewards: [
    { resourceId: 'gold', amountFormula: '100' },
    { resourceId: 'xp', amountFormula: '50' },
  ],
  ...overrides,
});

const createMockConfig = (
  difficultyCategories: Record<string, ActivityRollCategory>,
  rewardCategories: Record<string, ActivityRollCategory>,
  activities?: Record<string, ActivityDefinition>,
): IdleVillageConfig => ({
  version: '1.0',
  resources: {
    gold: { id: 'gold', label: 'Gold' },
    xp: { id: 'xp', label: 'XP' },
  },
  activities: activities ?? {},
  questTypes: {},
  mapSlots: {},
  passiveEffects: {},
  buildings: {},
  overlaySettings: {
    enabled: false,
    defaultPosition: 'bottom-right',
    defaultSize: 'compact',
    defaultZoom: 1,
    alwaysOnTop: false,
    transparency: false,
    enabledWidgets: [],
    autoHideTimeoutSeconds: 0,
    showSystemTrayIcon: false,
  },
  globalRules: {
    maxFatigueBeforeExhausted: 100,
    defaultActivityFatigueGain: 10,
    fatigueRecoveryPerDay: 20,
    dayLengthInTimeUnits: 24,
    fatigueYellowThreshold: 60,
    fatigueRedThreshold: 80,
    baseLightInjuryChanceAtMaxFatigue: 0.1,
    dangerInjuryMultiplierPerPoint: 0.05,
    foodConsumptionPerResidentPerDay: 1,
    baseFoodPriceInGold: 5,
    questXpFormula: '10',
    maxActiveQuests: 5,
    questSpawnEveryNDays: 1,
    maxGlobalQuestOffers: 10,
    maxQuestOffersPerSlot: 3,
    injuryTiers: {
      light: {
        id: 'light',
        label: 'Light Injury',
        recoveryTimeInDays: 1,
      },
    },
    questPowerRules: {
      statWeights: { hp: 0.01, damage: 0.04, combat: 0.05 },
      basePowerPerLevel: 10,
      dangerScaling: 0.3,
      heroBonus: 0.2,
      fatiguePenaltyPerPoint: 0.002,
      injuryPenalty: 0.3,
      outcomeBreakpoints: [
        { threshold: 2.0, distribution: { perfect: 50, success: 40, partial: 10, fail: 0, deadly: 0 } },
        { threshold: 1.0, distribution: { perfect: 10, success: 50, partial: 30, fail: 10, deadly: 0 } },
        { threshold: 0.5, distribution: { perfect: 0, success: 20, partial: 50, fail: 25, deadly: 5 } },
        { threshold: 0, distribution: { perfect: 0, success: 0, partial: 20, fail: 60, deadly: 20 } },
      ],
      rewardMultipliers: { perfect: 1.5, success: 1.0, partial: 0.5, fail: 0.1, deadly: 0 },
      injuryChanceByOutcome: { perfect: 0, success: 0.05, partial: 0.15, fail: 0.3, deadly: 0.5 },
      deathChanceByOutcome: { perfect: 0, success: 0, partial: 0.02, fail: 0.1, deadly: 0.3 },
    },
  },
  variance: {
    difficultyCategories,
    rewardCategories,
  },
});

const createMockVillageState = (overrides?: Partial<VillageState>): VillageState => ({
  time: 0,
  resources: { gold: 1000, xp: 500 },
  residents: [
    {
      id: 'resident-1',
      name: 'Test Hero',
      status: 'available',
      statSnapshot: { hp: 100, damage: 20, combat: 15 },
      traits: [],
      level: 5,
      currentExp: 0,
      expToNextLevel: 100,
      fatigue: 0,
      isInjured: false,
      isHero: true,
    },
  ],
  assignments: [],
  scheduledActivities: [],
  buildings: [],
  ...overrides,
});

const createMockScheduledActivity = (overrides?: Partial<ScheduledActivity>): ScheduledActivity => ({
  id: 'scheduled-1',
  activityId: 'test-quest',
  startTime: 0,
  endTime: 100,
  assignedResidentIds: ['resident-1'],
  progress: 100,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Quest Dual Variance System', () => {
  describe('Difficulty Variance Extraction', () => {
    it('should extract difficulty category with weighted random selection', () => {
      const difficultyCategories: Record<string, ActivityRollCategory> = {
        easy: {
          id: 'easy',
          label: 'Easy',
          minMultiplier: 0.7,
          maxMultiplier: 0.9,
          weight: 30,
          colorClass: 'text-green-400',
        },
        normal: {
          id: 'normal',
          label: 'Normal',
          minMultiplier: 0.9,
          maxMultiplier: 1.1,
          weight: 50,
          colorClass: 'text-yellow-400',
        },
        hard: {
          id: 'hard',
          label: 'Hard',
          minMultiplier: 1.1,
          maxMultiplier: 1.4,
          weight: 20,
          colorClass: 'text-red-400',
        },
      };

      const rewardCategories: Record<string, ActivityRollCategory> = {
        normal: {
          id: 'normal',
          label: 'Normal',
          minMultiplier: 0.9,
          maxMultiplier: 1.1,
          weight: 100,
        },
      };

      const activity = createMockActivity();
      const config = createMockConfig(difficultyCategories, rewardCategories, {
        'test-quest': activity,
      });
      const villageState = createMockVillageState();
      const scheduled = createMockScheduledActivity();

      // Deterministic RNG that always picks first category
      let rngCallCount = 0;
      const deterministicRng = () => {
        rngCallCount++;
        return 0.01; // Always pick first category (easy)
      };

      const deps: QuestResolverDeps = { config, rng: deterministicRng };
      const result = resolveQuest(deps, villageState, scheduled);

      expect(result.events[0].payload.difficultyCategory).toBe('easy');
      expect(result.events[0].payload.difficultyMultiplier).toBeGreaterThanOrEqual(0.7);
      expect(result.events[0].payload.difficultyMultiplier).toBeLessThanOrEqual(0.9);
    });

    it('should respect allowedDifficultyCategoryIds whitelist', () => {
      const difficultyCategories: Record<string, ActivityRollCategory> = {
        easy: {
          id: 'easy',
          label: 'Easy',
          minMultiplier: 0.7,
          maxMultiplier: 0.9,
          weight: 30,
        },
        normal: {
          id: 'normal',
          label: 'Normal',
          minMultiplier: 0.9,
          maxMultiplier: 1.1,
          weight: 50,
        },
        hard: {
          id: 'hard',
          label: 'Hard',
          minMultiplier: 1.1,
          maxMultiplier: 1.4,
          weight: 20,
        },
      };

      const rewardCategories: Record<string, ActivityRollCategory> = {
        normal: {
          id: 'normal',
          label: 'Normal',
          minMultiplier: 0.9,
          maxMultiplier: 1.1,
          weight: 100,
        },
      };

      // Activity only allows easy and normal
      const activity = createMockActivity({
        allowedDifficultyCategoryIds: ['easy', 'normal'],
      });

      const config = createMockConfig(difficultyCategories, rewardCategories, {
        'test-quest': activity,
      });

      const villageState = createMockVillageState();
      const scheduled = createMockScheduledActivity();

      const deterministicRng = () => 0.99; // Would pick hard if not filtered

      const deps: QuestResolverDeps = { config, rng: deterministicRng };
      const result = resolveQuest(deps, villageState, scheduled);

      // Should never be 'hard' because it's not in allowed list
      expect(result.events[0].payload.difficultyCategory).not.toBe('hard');
    });

    it('should apply difficulty multiplier to quest difficulty calculation', () => {
      const difficultyCategories: Record<string, ActivityRollCategory> = {
        hard: {
          id: 'hard',
          label: 'Hard',
          minMultiplier: 1.2,
          maxMultiplier: 1.2, // Fixed for deterministic test
          weight: 100,
        },
      };

      const rewardCategories: Record<string, ActivityRollCategory> = {
        normal: {
          id: 'normal',
          label: 'Normal',
          minMultiplier: 1.0,
          maxMultiplier: 1.0,
          weight: 100,
        },
      };

      const activity = createMockActivity();
      const config = createMockConfig(difficultyCategories, rewardCategories, {
        'test-quest': activity,
      });
      const villageState = createMockVillageState();
      const scheduled = createMockScheduledActivity();

      const deps: QuestResolverDeps = { config, rng: () => 0 };
      const result = resolveQuest(deps, villageState, scheduled);

      // With difficultyMultiplier = 1.2, the quest should be harder
      // This should result in a lower power ratio and worse outcomes
      expect(result.events[0].payload.difficultyMultiplier).toBe(1.2);
      expect(result.events[0].payload.powerResult.questDifficulty).toBeGreaterThan(
        3 * 10 * (1 + 2 * 0.3) // base without multiplier
      );
    });
  });

  describe('Reward Variance Extraction', () => {
    it('should extract reward category independently from difficulty', () => {
      const difficultyCategories: Record<string, ActivityRollCategory> = {
        normal: {
          id: 'normal',
          label: 'Normal',
          minMultiplier: 1.0,
          maxMultiplier: 1.0,
          weight: 100,
        },
      };

      const rewardCategories: Record<string, ActivityRollCategory> = {
        lean: {
          id: 'lean',
          label: 'Underpaid',
          minMultiplier: 0.7,
          maxMultiplier: 0.9,
          weight: 30,
        },
        normal: {
          id: 'normal',
          label: 'Normal',
          minMultiplier: 0.9,
          maxMultiplier: 1.1,
          weight: 50,
        },
        generous: {
          id: 'generous',
          label: 'Well Paid',
          minMultiplier: 1.1,
          maxMultiplier: 1.5,
          weight: 20,
        },
      };

      const activity = createMockActivity();
      const config = createMockConfig(difficultyCategories, rewardCategories, {
        'test-quest': activity,
      });
      const villageState = createMockVillageState();
      const scheduled = createMockScheduledActivity();

      // RNG that picks lean reward (0.01) but normal difficulty (0.01 * 30/100 = 0.003)
      let callCount = 0;
      const deterministicRng = () => {
        callCount++;
        if (callCount === 1) return 0.001; // First call: difficulty (picks normal)
        if (callCount === 2) return 0.001; // Second call: difficulty multiplier
        if (callCount === 3) return 0.01; // Third call: reward (picks lean)
        if (callCount === 4) return 0.01; // Fourth call: reward multiplier
        return 0; // For power resolution
      };

      const deps: QuestResolverDeps = { config, rng: deterministicRng };
      const result = resolveQuest(deps, villageState, scheduled);

      // Difficulty should be normal (index 0)
      expect(result.events[0].payload.difficultyCategory).toBe('normal');
      // Reward should be lean (because rng=0.01 < 30/100 = 0.3 weight)
      expect(result.events[0].payload.rewardCategory).toBe('lean');
    });

    it('should apply reward multiplier to final rewards', () => {
      const difficultyCategories: Record<string, ActivityRollCategory> = {
        normal: {
          id: 'normal',
          label: 'Normal',
          minMultiplier: 1.0,
          maxMultiplier: 1.0,
          weight: 100,
        },
      };

      const rewardCategories: Record<string, ActivityRollCategory> = {
        generous: {
          id: 'generous',
          label: 'Well Paid',
          minMultiplier: 1.5,
          maxMultiplier: 1.5, // Fixed for deterministic test
          weight: 100,
        },
      };

      const activity = createMockActivity();
      const config = createMockConfig(difficultyCategories, rewardCategories, {
        'test-quest': activity,
      });
      const villageState = createMockVillageState();
      const scheduled = createMockScheduledActivity();

      const deps: QuestResolverDeps = { config, rng: () => 0 };
      const result = resolveQuest(deps, villageState, scheduled);

      expect(result.events[0].payload.rewardMultiplier).toBe(1.5);

      // Base gold reward is 100, multiplied by outcome reward multiplier + variance (1.5)
      // Outcome can vary (perfect=1.5, success=1.0, partial=0.5, fail=0.1, deadly=0)
      // So final range: 0 to 100 * 1.5 * 1.5 = 225 (if perfect)
      const goldDelta = result.updatedResources.gold - 1000;
      expect(goldDelta).toBeGreaterThanOrEqual(0);
      expect(goldDelta).toBeLessThanOrEqual(225);
    });

    it('should respect allowedRewardCategoryIds whitelist', () => {
      const difficultyCategories: Record<string, ActivityRollCategory> = {
        normal: {
          id: 'normal',
          label: 'Normal',
          minMultiplier: 1.0,
          maxMultiplier: 1.0,
          weight: 100,
        },
      };

      const rewardCategories: Record<string, ActivityRollCategory> = {
        lean: {
          id: 'lean',
          label: 'Underpaid',
          minMultiplier: 0.7,
          maxMultiplier: 0.9,
          weight: 30,
        },
        normal: {
          id: 'normal',
          label: 'Normal',
          minMultiplier: 0.9,
          maxMultiplier: 1.1,
          weight: 50,
        },
        generous: {
          id: 'generous',
          label: 'Well Paid',
          minMultiplier: 1.1,
          maxMultiplier: 1.5,
          weight: 20,
        },
      };

      // Activity only allows lean and normal rewards
      const activity = createMockActivity({
        allowedRewardCategoryIds: ['lean', 'normal'],
      });

      const config = createMockConfig(difficultyCategories, rewardCategories, {
        'test-quest': activity,
      });

      const villageState = createMockVillageState();
      const scheduled = createMockScheduledActivity();

      const deterministicRng = () => 0.99; // Would pick generous if not filtered

      const deps: QuestResolverDeps = { config, rng: deterministicRng };
      const result = resolveQuest(deps, villageState, scheduled);

      // Should never be 'generous' because it's not in allowed list
      expect(result.events[0].payload.rewardCategory).not.toBe('generous');
    });
  });

  describe('Dual Variance Combination', () => {
    it('should allow easy quest with generous rewards (independent selection)', () => {
      const difficultyCategories: Record<string, ActivityRollCategory> = {
        easy: {
          id: 'easy',
          label: 'Easy',
          minMultiplier: 0.7,
          maxMultiplier: 0.8,
          weight: 50,
        },
        hard: {
          id: 'hard',
          label: 'Hard',
          minMultiplier: 1.2,
          maxMultiplier: 1.4,
          weight: 50,
        },
      };

      const rewardCategories: Record<string, ActivityRollCategory> = {
        lean: {
          id: 'lean',
          label: 'Underpaid',
          minMultiplier: 0.7,
          maxMultiplier: 0.8,
          weight: 50,
        },
        generous: {
          id: 'generous',
          label: 'Well Paid',
          minMultiplier: 1.2,
          maxMultiplier: 1.4,
          weight: 50,
        },
      };

      const activity = createMockActivity();
      const config = createMockConfig(difficultyCategories, rewardCategories, {
        'test-quest': activity,
      });
      const villageState = createMockVillageState();
      const scheduled = createMockScheduledActivity();

      // Force easy + generous combination
      let callCount = 0;
      const deterministicRng = () => {
        callCount++;
        // For difficulty: weight 50 each, rng < 0.5 picks easy
        // For reward: weight 50 each, rng >= 0.5 picks generous
        if (callCount === 1) return 0.1; // difficulty picks easy
        if (callCount === 2) return 0.0; // difficulty multiplier = min (0.7)
        if (callCount === 3) return 0.9; // reward picks generous (0.9 * 100 > 50)
        if (callCount === 4) return 0.0; // reward multiplier = min (1.2)
        return 0; // power resolution
      };

      const deps: QuestResolverDeps = { config, rng: deterministicRng };
      const result = resolveQuest(deps, villageState, scheduled);

      // Should be easy quest (low difficulty) with generous rewards (high multiplier)
      expect(result.events[0].payload.difficultyCategory).toBe('easy');
      expect(result.events[0].payload.difficultyMultiplier).toBe(0.7);
      expect(result.events[0].payload.rewardCategory).toBe('generous');
      expect(result.events[0].payload.rewardMultiplier).toBe(1.2);
    });

    it('should allow hard quest with lean rewards (worst combination)', () => {
      const difficultyCategories: Record<string, ActivityRollCategory> = {
        easy: {
          id: 'easy',
          label: 'Easy',
          minMultiplier: 0.7,
          maxMultiplier: 0.8,
          weight: 50,
        },
        hard: {
          id: 'hard',
          label: 'Hard',
          minMultiplier: 1.2,
          maxMultiplier: 1.4,
          weight: 50,
        },
      };

      const rewardCategories: Record<string, ActivityRollCategory> = {
        lean: {
          id: 'lean',
          label: 'Underpaid',
          minMultiplier: 0.7,
          maxMultiplier: 0.8,
          weight: 50,
        },
        generous: {
          id: 'generous',
          label: 'Well Paid',
          minMultiplier: 1.2,
          maxMultiplier: 1.4,
          weight: 50,
        },
      };

      const activity = createMockActivity();
      const config = createMockConfig(difficultyCategories, rewardCategories, {
        'test-quest': activity,
      });
      const villageState = createMockVillageState();
      const scheduled = createMockScheduledActivity();

      // Force hard + lean combination
      let callCount = 0;
      const deterministicRng = () => {
        callCount++;
        if (callCount === 1) return 0.9; // difficulty picks hard
        if (callCount === 2) return 0.0; // difficulty multiplier = min (1.2)
        if (callCount === 3) return 0.1; // reward picks lean
        if (callCount === 4) return 0.0; // reward multiplier = min (0.7)
        return 0; // power resolution
      };

      const deps: QuestResolverDeps = { config, rng: deterministicRng };
      const result = resolveQuest(deps, villageState, scheduled);

      // Should be hard quest with lean rewards
      expect(result.events[0].payload.difficultyCategory).toBe('hard');
      expect(result.events[0].payload.difficultyMultiplier).toBe(1.2);
      expect(result.events[0].payload.rewardCategory).toBe('lean');
      expect(result.events[0].payload.rewardMultiplier).toBe(0.7);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing variance config gracefully', () => {
      const activity = createMockActivity();
      const config = createMockConfig({}, {}, { 'test-quest': activity });
      config.variance = { difficultyCategories: {}, rewardCategories: {} };

      const villageState = createMockVillageState();
      const scheduled = createMockScheduledActivity();

      const deps: QuestResolverDeps = { config, rng: () => 0 };
      const result = resolveQuest(deps, villageState, scheduled);

      // Should still resolve quest without variance
      expect(result.events[0].payload.difficultyCategory).toBeUndefined();
      expect(result.events[0].payload.difficultyMultiplier).toBeUndefined();
      expect(result.events[0].payload.rewardCategory).toBeUndefined();
      expect(result.events[0].payload.rewardMultiplier).toBeUndefined();
    });

    it('should handle empty category lists', () => {
      const activity = createMockActivity();
      const config = createMockConfig(
        {}, // empty difficulty
        { normal: { id: 'normal', label: 'Normal', minMultiplier: 1, maxMultiplier: 1, weight: 100 } },
        { 'test-quest': activity }
      );

      const villageState = createMockVillageState();
      const scheduled = createMockScheduledActivity();

      const deps: QuestResolverDeps = { config, rng: () => 0 };
      const result = resolveQuest(deps, villageState, scheduled);

      // Should still resolve with reward variance but no difficulty variance
      expect(result.events[0].payload.difficultyCategory).toBeUndefined();
      expect(result.events[0].payload.rewardCategory).toBe('normal');
    });

    it('should include both variances in quest completion event payload', () => {
      const difficultyCategories: Record<string, ActivityRollCategory> = {
        hard: {
          id: 'hard',
          label: 'Hard',
          minMultiplier: 1.3,
          maxMultiplier: 1.3,
          weight: 100,
        },
      };

      const rewardCategories: Record<string, ActivityRollCategory> = {
        generous: {
          id: 'generous',
          label: 'Well Paid',
          minMultiplier: 1.4,
          maxMultiplier: 1.4,
          weight: 100,
        },
      };

      const activity = createMockActivity();
      const config = createMockConfig(difficultyCategories, rewardCategories, {
        'test-quest': activity,
      });
      const villageState = createMockVillageState();
      const scheduled = createMockScheduledActivity();

      const deps: QuestResolverDeps = { config, rng: () => 0 };
      const result = resolveQuest(deps, villageState, scheduled);

      const payload = result.events[0].payload;

      // All four variance fields should be present
      expect(payload).toHaveProperty('difficultyCategory', 'hard');
      expect(payload).toHaveProperty('difficultyMultiplier', 1.3);
      expect(payload).toHaveProperty('rewardCategory', 'generous');
      expect(payload).toHaveProperty('rewardMultiplier', 1.4);
    });
  });

  describe('UI Display Integration', () => {
    it('should provide color classes for variance UI indicators', () => {
      const difficultyCategories: Record<string, ActivityRollCategory> = {
        easy: {
          id: 'easy',
          label: 'Easy',
          minMultiplier: 0.8,
          maxMultiplier: 0.9,
          weight: 100,
          colorClass: 'text-emerald-400',
        },
      };

      const rewardCategories: Record<string, ActivityRollCategory> = {
        generous: {
          id: 'generous',
          label: 'Well Paid',
          minMultiplier: 1.2,
          maxMultiplier: 1.5,
          weight: 100,
          colorClass: 'text-amber-400',
        },
      };

      const activity = createMockActivity();
      const config = createMockConfig(difficultyCategories, rewardCategories, { 'test-quest': activity });

      // Config should preserve color classes for UI
      expect(config.variance.difficultyCategories.easy.colorClass).toBe('text-emerald-400');
      expect(config.variance.rewardCategories.generous.colorClass).toBe('text-amber-400');
    });
  });
});
