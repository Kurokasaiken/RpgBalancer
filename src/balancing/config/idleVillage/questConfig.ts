/**
 * @deprecated
 *
 * Reference: ADR-001 — Quest Engine Reconciliation & Opportunity Foundation
 *
 * C1 quest configuration is deprecated. The new C2 ActivityDefinition-based quest system should be used.
 * Types are still consumed by QuestChainProgressTracker and telemetry, so exports are preserved.
 *
 * @module questConfig
 */

import { z } from 'zod';
import type {
  QuestConfig,
  SkillCheck,
  SkillRequirement,
  QuestReward,
  QuestRisk,
  QuestState,
} from './types/questTypes';

/**
 * Zod schema for Skill Requirement
 */
export const SkillRequirementSchema = z.object({
  statId: z.string(),
  minValue: z.number().nonnegative(),
  maxValue: z.number().positive().optional(),
  weight: z.number().min(0).max(1).optional(),
});

/**
 * Zod schema for Skill Check
 */
export const SkillCheckSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  requirements: z.array(SkillRequirementSchema),
  difficultyMultiplier: z.number().positive(),
});

/**
 * Zod schema for Quest Reward
 */
export const QuestRewardSchema = z.object({
  gold: z.number().nonnegative().optional(),
  items: z.record(z.string(), z.number().int().positive()).optional(),
  experience: z.number().nonnegative().optional(),
  reputation: z.record(z.string(), z.number()).optional(),
});

/**
 * Zod schema for Quest Risk
 */
export const QuestRiskSchema = z.object({
  injuryChance: z.number().min(0).max(1),
  deathChance: z.number().min(0).max(1),
  fatigueCost: z.number().nonnegative(),
  resourceCost: z.record(z.string(), z.number().nonnegative()).optional(),
});

/**
 * Zod schema for Quest Config
 */
export const QuestConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  skillChecks: z.array(SkillCheckSchema),
  rewards: QuestRewardSchema,
  risks: QuestRiskSchema,
  durationHours: z.number().positive(),
  cooldownHours: z.number().nonnegative(),
  minLevel: z.number().int().nonnegative().optional(),
  maxParticipants: z.number().int().positive(),
  visual: z.object({
    icon: z.string(),
    color: z.string(),
    backgroundColor: z.string(),
  }),
});

/**
 * Zod schema for Quest State
 */
export const QuestStateSchema = z.object({
  activeQuests: z.array(z.object({
    questId: z.string(),
    status: z.enum(['available', 'in_progress', 'completed', 'failed']),
    assignedResidents: z.array(z.string()),
    startTime: z.number().optional(),
    completionTime: z.number().optional(),
    progress: z.number().min(0).max(1),
    skillCheckResults: z.record(z.string(), z.boolean()).optional(),
  })),
  history: z.array(z.any()),
  cooldowns: z.record(z.string(), z.number()),
  lastUpdate: z.number(),
});

/**
 * Default quest configurations
 * Uses Gilded Observatory color palette
 */
export const DEFAULT_QUESTS: QuestConfig[] = [
  {
    id: 'forest-patrol',
    name: 'Forest Patrol',
    description: 'Scout the forest perimeter for threats and gather intelligence',
    category: 'exploration',
    skillChecks: [
      {
        id: 'perception-check',
        name: 'Perception',
        description: 'Spot hidden dangers and track movements',
        requirements: [
          { statId: 'perception', minValue: 5, weight: 0.7 },
          { statId: 'agility', minValue: 3, weight: 0.3 },
        ],
        difficultyMultiplier: 1.0,
      },
    ],
    rewards: {
      gold: 20,
      experience: 50,
      items: { 'forest-herb': 3 },
    },
    risks: {
      injuryChance: 0.15,
      deathChance: 0.02,
      fatigueCost: 20,
    },
    durationHours: 2,
    cooldownHours: 4,
    maxParticipants: 2,
    visual: {
      icon: '🌲',
      color: 'rgb(34, 197, 94)', // green-500
      backgroundColor: 'rgb(15, 26, 29)',
    },
  },
  {
    id: 'bandit-hunt',
    name: 'Bandit Hunt',
    description: 'Track down and eliminate bandit camps threatening the village',
    category: 'combat',
    skillChecks: [
      {
        id: 'combat-check',
        name: 'Combat Prowess',
        description: 'Engage and defeat hostile enemies',
        requirements: [
          { statId: 'strength', minValue: 8, weight: 0.5 },
          { statId: 'endurance', minValue: 6, weight: 0.3 },
          { statId: 'agility', minValue: 5, weight: 0.2 },
        ],
        difficultyMultiplier: 1.5,
      },
      {
        id: 'tactics-check',
        name: 'Tactical Planning',
        description: 'Plan and execute effective combat strategies',
        requirements: [
          { statId: 'intelligence', minValue: 5, weight: 0.6 },
          { statId: 'perception', minValue: 4, weight: 0.4 },
        ],
        difficultyMultiplier: 1.2,
      },
    ],
    rewards: {
      gold: 50,
      experience: 100,
      items: { 'bandit-loot': 1 },
      reputation: { 'village-guard': 10 },
    },
    risks: {
      injuryChance: 0.35,
      deathChance: 0.08,
      fatigueCost: 40,
    },
    durationHours: 4,
    cooldownHours: 12,
    minLevel: 3,
    maxParticipants: 3,
    visual: {
      icon: '⚔️',
      color: 'rgb(239, 68, 68)', // red-500
      backgroundColor: 'rgb(15, 26, 29)',
    },
  },
  {
    id: 'ancient-ruins',
    name: 'Ancient Ruins Expedition',
    description: 'Explore mysterious ruins and uncover ancient secrets',
    category: 'exploration',
    skillChecks: [
      {
        id: 'knowledge-check',
        name: 'Ancient Knowledge',
        description: 'Decipher ancient texts and understand artifacts',
        requirements: [
          { statId: 'intelligence', minValue: 10, weight: 0.7 },
          { statId: 'perception', minValue: 6, weight: 0.3 },
        ],
        difficultyMultiplier: 1.8,
      },
      {
        id: 'survival-check',
        name: 'Survival Skills',
        description: 'Navigate dangerous terrain and avoid traps',
        requirements: [
          { statId: 'agility', minValue: 7, weight: 0.5 },
          { statId: 'endurance', minValue: 8, weight: 0.5 },
        ],
        difficultyMultiplier: 1.4,
      },
    ],
    rewards: {
      gold: 100,
      experience: 200,
      items: { 'ancient-artifact': 1, 'rare-scroll': 2 },
      reputation: { 'scholars-guild': 20 },
    },
    risks: {
      injuryChance: 0.25,
      deathChance: 0.05,
      fatigueCost: 50,
      resourceCost: { 'torch': 3, 'rope': 2 },
    },
    durationHours: 6,
    cooldownHours: 24,
    minLevel: 5,
    maxParticipants: 4,
    visual: {
      icon: '🏛️',
      color: 'rgb(168, 85, 247)', // purple-500
      backgroundColor: 'rgb(15, 26, 29)',
    },
  },
  {
    id: 'herb-gathering',
    name: 'Herb Gathering',
    description: 'Collect medicinal herbs from the surrounding wilderness',
    category: 'gathering',
    skillChecks: [
      {
        id: 'herbalism-check',
        name: 'Herbalism',
        description: 'Identify and safely harvest medicinal plants',
        requirements: [
          { statId: 'intelligence', minValue: 4, weight: 0.6 },
          { statId: 'perception', minValue: 5, weight: 0.4 },
        ],
        difficultyMultiplier: 0.8,
      },
    ],
    rewards: {
      gold: 15,
      experience: 30,
      items: { 'healing-herb': 5, 'rare-herb': 1 },
    },
    risks: {
      injuryChance: 0.05,
      deathChance: 0.01,
      fatigueCost: 15,
    },
    durationHours: 3,
    cooldownHours: 6,
    maxParticipants: 3,
    visual: {
      icon: '🌿',
      color: 'rgb(34, 197, 94)', // green-500
      backgroundColor: 'rgb(15, 26, 29)',
    },
  },
];

/**
 * Default initial quest state
 */
export const DEFAULT_QUEST_STATE: QuestState = {
  activeQuests: [],
  history: [],
  cooldowns: {},
  lastUpdate: Date.now(),
};

/**
 * Quest system configuration container
 */
export interface QuestSystemConfig {
  quests: QuestConfig[];
  initialState: QuestState;
  globalSettings: {
    /** Base success chance before modifiers */
    baseSuccessChance: number;
    /** Level bonus per resident level */
    levelBonusPercent: number;
    /** Fatigue penalty per point */
    fatiguePenaltyPercent: number;
    /** Maximum success chance cap */
    maxSuccessChance: number;
    /** Minimum success chance floor */
    minSuccessChance: number;
  };
}

/**
 * Default quest system configuration
 */
export const DEFAULT_QUEST_SYSTEM_CONFIG: QuestSystemConfig = {
  quests: DEFAULT_QUESTS,
  initialState: DEFAULT_QUEST_STATE,
  globalSettings: {
    baseSuccessChance: 0.5,
    levelBonusPercent: 0.05,
    fatiguePenaltyPercent: 0.01,
    maxSuccessChance: 0.95,
    minSuccessChance: 0.05,
  },
};

/**
 * Validates quest configuration
 * 
 * @param config - Configuration to validate
 * @returns Validation result
 */
export function validateQuestConfig(config: unknown): {
  valid: boolean;
  errors?: z.ZodError;
} {
  const result = QuestConfigSchema.safeParse(config);
  
  if (result.success) {
    return { valid: true };
  }
  
  return {
    valid: false,
    errors: result.error,
  };
}

/**
 * Gets quest by ID
 * 
 * @param questId - Quest identifier
 * @param quests - Quest list (defaults to DEFAULT_QUESTS)
 * @returns Quest configuration or undefined
 */
export function getQuestById(
  questId: string,
  quests: QuestConfig[] = DEFAULT_QUESTS
): QuestConfig | undefined {
  return quests.find((q) => q.id === questId);
}

/**
 * Gets quests by category
 * 
 * @param category - Quest category
 * @param quests - Quest list (defaults to DEFAULT_QUESTS)
 * @returns Filtered quest list
 */
export function getQuestsByCategory(
  category: string,
  quests: QuestConfig[] = DEFAULT_QUESTS
): QuestConfig[] {
  return quests.filter((q) => q.category === category);
}
