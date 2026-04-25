/**
 * Quest Types for Idle Village
 * 
 * Defines TypeScript interfaces for the quest system including:
 * - Quest configuration and status
 * - Skill checks and requirements
 * - Rewards and risks
 * - Quest results and history
 */

/**
 * Quest status enum
 */
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'failed';

/**
 * Skill requirement for quest participation
 */
export interface SkillRequirement {
  /** Stat identifier (e.g., 'strength', 'intelligence') */
  statId: string;
  /** Minimum value required */
  minValue: number;
  /** Optional maximum value (for range checks) */
  maxValue?: number;
  /** Weight/importance of this requirement (0-1) */
  weight?: number;
}

/**
 * Skill check configuration
 */
export interface SkillCheck {
  /** Unique identifier for this check */
  id: string;
  /** Display name */
  name: string;
  /** Description of what this check represents */
  description: string;
  /** Required skills for this check */
  requirements: SkillRequirement[];
  /** Difficulty multiplier (1.0 = normal, >1.0 = harder) */
  difficultyMultiplier: number;
}

/**
 * Quest reward configuration
 */
export interface QuestReward {
  /** Gold reward */
  gold?: number;
  /** Item rewards (itemId -> quantity) */
  items?: Record<string, number>;
  /** Experience points */
  experience?: number;
  /** Reputation/faction rewards */
  reputation?: Record<string, number>;
}

/**
 * Quest risk configuration
 */
export interface QuestRisk {
  /** Injury probability (0-1) */
  injuryChance: number;
  /** Death probability (0-1) */
  deathChance: number;
  /** Fatigue cost */
  fatigueCost: number;
  /** Resource consumption */
  resourceCost?: Record<string, number>;
}

/**
 * Quest configuration
 */
export interface QuestConfig {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Quest description */
  description: string;
  /** Quest category/type */
  category: string;
  /** Skill checks required for this quest */
  skillChecks: SkillCheck[];
  /** Rewards for successful completion */
  rewards: QuestReward;
  /** Risks associated with this quest */
  risks: QuestRisk;
  /** Duration in hours */
  durationHours: number;
  /** Cooldown period in hours */
  cooldownHours: number;
  /** Minimum resident level required */
  minLevel?: number;
  /** Maximum number of residents that can participate */
  maxParticipants: number;
  /** Visual configuration */
  visual: {
    icon: string;
    color: string;
    backgroundColor: string;
  };
}

/**
 * Quest instance (runtime state)
 */
export interface QuestInstance {
  /** Quest configuration ID */
  questId: string;
  /** Current status */
  status: QuestStatus;
  /** Assigned resident IDs */
  assignedResidents: string[];
  /** Start timestamp */
  startTime?: number;
  /** Completion timestamp */
  completionTime?: number;
  /** Progress (0-1) */
  progress: number;
  /** Skill check results */
  skillCheckResults?: Record<string, boolean>;
}

/**
 * Quest result after completion
 */
export interface QuestResult {
  /** Whether quest was successful */
  success: boolean;
  /** Rewards earned (if successful) */
  rewards?: QuestReward;
  /** Injuries sustained */
  injuries?: Array<{
    residentId: string;
    severity: 'minor' | 'major' | 'critical';
  }>;
  /** Fatalities */
  deaths?: string[];
  /** Experience gained per resident */
  experienceGained?: Record<string, number>;
  /** Failure reason (if failed) */
  failureReason?: string;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Success chance calculation result
 */
export interface SuccessChanceResult {
  /** Overall success probability (0-1) */
  overallChance: number;
  /** Individual skill check chances */
  skillCheckChances: Record<string, number>;
  /** Factors affecting success */
  factors: {
    residentLevel: number;
    skillMatch: number;
    difficultyPenalty: number;
    fatigueModifier: number;
  };
}

/**
 * Quest history entry
 */
export interface QuestHistoryEntry {
  /** Quest configuration ID */
  questId: string;
  /** Quest name */
  questName: string;
  /** Completion timestamp */
  timestamp: number;
  /** Result of the quest */
  result: QuestResult;
  /** Residents who participated */
  participants: string[];
}

/**
 * Quest state persisted to storage
 */
export interface QuestState {
  /** Active quest instances */
  activeQuests: QuestInstance[];
  /** Completed quest history */
  history: QuestHistoryEntry[];
  /** Quest cooldowns (questId -> timestamp when available) */
  cooldowns: Record<string, number>;
  /** Last update timestamp */
  lastUpdate: number;
}
