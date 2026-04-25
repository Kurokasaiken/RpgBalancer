/**
 * Quest Chain Configuration – NP-141
 * 
 * Config-first settings for quest chains with milestones, branching paths,
 * and completion rewards.
 * 
 * @since NP-141
 */

import { z } from 'zod';

/**
 * Quest status enum.
 */
export const QuestStatusSchema = z.enum([
  'locked',
  'available',
  'in_progress',
  'completed',
  'failed',
]);
export type QuestStatus = z.infer<typeof QuestStatusSchema>;

/**
 * Reward type enum.
 */
export const RewardTypeSchema = z.enum([
  'gold',
  'food',
  'experience',
  'item',
  'unlock',
  'stat_boost',
]);
export type RewardType = z.infer<typeof RewardTypeSchema>;

/**
 * Quest reward configuration.
 */
export const QuestRewardSchema = z.object({
  /** Reward type */
  type: RewardTypeSchema,
  /** Reward amount or identifier */
  value: z.union([z.number(), z.string()]),
  /** Optional description */
  description: z.string().optional(),
});
export type QuestReward = z.infer<typeof QuestRewardSchema>;

/**
 * Quest objective configuration.
 */
export const QuestObjectiveSchema = z.object({
  /** Objective ID */
  id: z.string(),
  /** Objective description */
  description: z.string(),
  /** Target value */
  target: z.number().int().positive(),
  /** Current progress */
  current: z.number().int().nonnegative().default(0),
  /** Is completed */
  completed: z.boolean().default(false),
  /** Optional tracking key */
  trackingKey: z.string().optional(),
});
export type QuestObjective = z.infer<typeof QuestObjectiveSchema>;

/**
 * Conditional unlock requirement.
 */
export const UnlockConditionSchema = z.object({
  /** Condition type */
  type: z.enum(['quest_completed', 'level_reached', 'stat_threshold', 'item_owned', 'custom']),
  /** Condition value */
  value: z.union([z.string(), z.number()]),
  /** Optional additional parameters */
  params: z.record(z.unknown()).optional(),
});
export type UnlockCondition = z.infer<typeof UnlockConditionSchema>;

/**
 * Quest milestone configuration.
 */
export const QuestMilestoneSchema = z.object({
  /** Milestone ID */
  id: z.string(),
  /** Milestone name */
  name: z.string(),
  /** Milestone description */
  description: z.string(),
  /** Required objectives */
  requiredObjectives: z.array(z.string()),
  /** Milestone rewards */
  rewards: z.array(QuestRewardSchema),
  /** Is completed */
  completed: z.boolean().default(false),
  /** Completion timestamp */
  completedAt: z.number().optional(),
});
export type QuestMilestone = z.infer<typeof QuestMilestoneSchema>;

/**
 * Quest configuration.
 */
export const QuestConfigSchema = z.object({
  /** Quest ID */
  id: z.string(),
  /** Quest name */
  name: z.string(),
  /** Quest description */
  description: z.string(),
  /** Quest objectives */
  objectives: z.array(QuestObjectiveSchema),
  /** Quest milestones */
  milestones: z.array(QuestMilestoneSchema),
  /** Quest rewards */
  rewards: z.array(QuestRewardSchema),
  /** Unlock conditions */
  unlockConditions: z.array(UnlockConditionSchema).optional(),
  /** Next quest IDs (branching) */
  nextQuests: z.array(z.string()).optional(),
  /** Quest status */
  status: QuestStatusSchema.default('locked'),
  /** Start timestamp */
  startedAt: z.number().optional(),
  /** Completion timestamp */
  completedAt: z.number().optional(),
});
export type QuestConfig = z.infer<typeof QuestConfigSchema>;

/**
 * Quest chain configuration.
 */
export const QuestChainConfigSchema = z.object({
  /** Chain ID */
  id: z.string(),
  /** Chain name */
  name: z.string(),
  /** Chain description */
  description: z.string(),
  /** Quests in chain */
  quests: z.array(QuestConfigSchema),
  /** Starting quest IDs */
  startingQuests: z.array(z.string()),
  /** Chain completion rewards */
  completionRewards: z.array(QuestRewardSchema).optional(),
  /** Is chain completed */
  completed: z.boolean().default(false),
});
export type QuestChainConfig = z.infer<typeof QuestChainConfigSchema>;

/**
 * Quest progress state.
 */
export const QuestProgressStateSchema = z.object({
  /** Quest ID */
  questId: z.string(),
  /** Quest status */
  status: QuestStatusSchema,
  /** Objectives progress */
  objectives: z.array(QuestObjectiveSchema),
  /** Completed milestones */
  completedMilestones: z.array(z.string()),
  /** Start timestamp */
  startedAt: z.number().optional(),
  /** Completion timestamp */
  completedAt: z.number().optional(),
  /** Selected branch (for branching quests) */
  selectedBranch: z.string().optional(),
});
export type QuestProgressState = z.infer<typeof QuestProgressStateSchema>;

/**
 * Quest chain progress state.
 */
export const QuestChainProgressStateSchema = z.object({
  /** Chain ID */
  chainId: z.string(),
  /** Quest progress states */
  questProgress: z.record(z.string(), QuestProgressStateSchema),
  /** Completed quest IDs */
  completedQuests: z.array(z.string()),
  /** Active quest IDs */
  activeQuests: z.array(z.string()),
  /** Available quest IDs */
  availableQuests: z.array(z.string()),
  /** Chain completion percentage */
  completionPercentage: z.number().min(0).max(100),
  /** Is chain completed */
  completed: z.boolean(),
});
export type QuestChainProgressState = z.infer<typeof QuestChainProgressStateSchema>;

/**
 * Default quest chain configurations.
 */
export const DEFAULT_QUEST_CHAINS: QuestChainConfig[] = [
  {
    id: 'tutorial-chain',
    name: 'Village Basics',
    description: 'Learn the fundamentals of village management',
    quests: [
      {
        id: 'tutorial-1',
        name: 'First Steps',
        description: 'Complete your first activity assignment',
        objectives: [
          {
            id: 'assign-resident',
            description: 'Assign a resident to an activity',
            target: 1,
            current: 0,
            completed: false,
            trackingKey: 'assignments_made',
          },
        ],
        milestones: [
          {
            id: 'first-assignment',
            name: 'First Assignment',
            description: 'Made your first resident assignment',
            requiredObjectives: ['assign-resident'],
            rewards: [
              { type: 'gold', value: 10, description: '10 gold' },
            ],
            completed: false,
          },
        ],
        rewards: [
          { type: 'experience', value: 50, description: '50 XP' },
        ],
        status: 'available',
        nextQuests: ['tutorial-2'],
      },
      {
        id: 'tutorial-2',
        name: 'Resource Management',
        description: 'Gather resources from activities',
        objectives: [
          {
            id: 'gather-gold',
            description: 'Gather 50 gold',
            target: 50,
            current: 0,
            completed: false,
            trackingKey: 'gold_gathered',
          },
          {
            id: 'gather-food',
            description: 'Gather 20 food',
            target: 20,
            current: 0,
            completed: false,
            trackingKey: 'food_gathered',
          },
        ],
        milestones: [
          {
            id: 'first-gold',
            name: 'First Gold',
            description: 'Gathered your first gold',
            requiredObjectives: ['gather-gold'],
            rewards: [
              { type: 'gold', value: 25, description: '25 bonus gold' },
            ],
            completed: false,
          },
        ],
        rewards: [
          { type: 'experience', value: 100, description: '100 XP' },
          { type: 'unlock', value: 'advanced-activities', description: 'Unlock advanced activities' },
        ],
        unlockConditions: [
          { type: 'quest_completed', value: 'tutorial-1' },
        ],
        status: 'locked',
      },
    ],
    startingQuests: ['tutorial-1'],
    completionRewards: [
      { type: 'gold', value: 100, description: '100 gold bonus' },
      { type: 'unlock', value: 'quest-board', description: 'Unlock quest board' },
    ],
    completed: false,
  },
];

/**
 * Gets quest from chain by ID.
 */
export function getQuestById(chain: QuestChainConfig, questId: string): QuestConfig | undefined {
  return chain.quests.find(q => q.id === questId);
}

/**
 * Gets milestone from quest by ID.
 */
export function getMilestoneById(quest: QuestConfig, milestoneId: string): QuestMilestone | undefined {
  return quest.milestones.find(m => m.id === milestoneId);
}

/**
 * Checks if quest objectives are completed.
 */
export function areObjectivesCompleted(objectives: QuestObjective[]): boolean {
  return objectives.every(obj => obj.completed || obj.current >= obj.target);
}

/**
 * Checks if milestone requirements are met.
 */
export function isMilestoneReady(milestone: QuestMilestone, objectives: QuestObjective[]): boolean {
  return milestone.requiredObjectives.every(reqId => {
    const objective = objectives.find(obj => obj.id === reqId);
    return objective && (objective.completed || objective.current >= objective.target);
  });
}

/**
 * Calculates quest completion percentage.
 */
export function calculateQuestCompletion(quest: QuestConfig, progress: QuestProgressState): number {
  if (progress.status === 'completed') return 100;
  if (progress.status === 'locked' || progress.status === 'available') return 0;

  const totalObjectives = quest.objectives.length;
  const completedObjectives = progress.objectives.filter(obj => 
    obj.completed || obj.current >= obj.target
  ).length;

  return totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;
}

/**
 * Calculates chain completion percentage.
 */
export function calculateChainCompletion(chain: QuestChainConfig, progress: QuestChainProgressState): number {
  const totalQuests = chain.quests.length;
  const completedQuests = progress.completedQuests.length;

  return totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;
}

/**
 * Checks if unlock conditions are met.
 */
export function areUnlockConditionsMet(
  conditions: UnlockCondition[] | undefined,
  context: {
    completedQuests: string[];
    playerLevel: number;
    playerStats: Record<string, number>;
    ownedItems: string[];
  }
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every(condition => {
    switch (condition.type) {
      case 'quest_completed':
        return context.completedQuests.includes(String(condition.value));
      case 'level_reached':
        return context.playerLevel >= Number(condition.value);
      case 'stat_threshold':
        const statName = condition.params?.stat as string;
        const threshold = Number(condition.value);
        return statName && context.playerStats[statName] >= threshold;
      case 'item_owned':
        return context.ownedItems.includes(String(condition.value));
      case 'custom':
        return true;
      default:
        return false;
    }
  });
}

/**
 * Gets next available quests based on completed quests.
 */
export function getNextAvailableQuests(
  chain: QuestChainConfig,
  completedQuests: string[],
  context: {
    playerLevel: number;
    playerStats: Record<string, number>;
    ownedItems: string[];
  }
): string[] {
  const available: string[] = [];

  for (const quest of chain.quests) {
    if (completedQuests.includes(quest.id)) continue;

    const unlockContext = {
      completedQuests,
      ...context,
    };

    if (areUnlockConditionsMet(quest.unlockConditions, unlockContext)) {
      available.push(quest.id);
    }
  }

  return available;
}

/**
 * Validates quest chain configuration.
 */
export function validateQuestChainConfig(config: unknown): QuestChainConfig {
  return QuestChainConfigSchema.parse(config);
}

/**
 * Validates quest progress state.
 */
export function validateQuestProgressState(state: unknown): QuestProgressState {
  return QuestProgressStateSchema.parse(state);
}

/**
 * Validates quest chain progress state.
 */
export function validateQuestChainProgressState(state: unknown): QuestChainProgressState {
  return QuestChainProgressStateSchema.parse(state);
}
