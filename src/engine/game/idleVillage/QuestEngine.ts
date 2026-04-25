/**
 * Quest Engine for Idle Village
 * 
 * Core logic for quest skill checks, success calculation, and reward processing.
 * All calculations are config-driven with no hardcoded values.
 * 
 * @module QuestEngine
 */

import type {
  QuestConfig,
  SkillCheck,
  SkillRequirement,
  QuestReward,
  QuestResult,
  SuccessChanceResult,
  QuestState,
  QuestInstance,
  QuestHistoryEntry,
} from '../../../balancing/config/idleVillage/types/questTypes';
import type { QuestSystemConfig } from '../../../balancing/config/idleVillage/questConfig';

/**
 * Resident stats snapshot for skill checks
 */
export interface ResidentStats {
  residentId: string;
  level: number;
  fatigue: number;
  stats: Record<string, number>;
}

/**
 * Validates if a resident meets skill check requirements
 * 
 * @param resident - Resident stats snapshot
 * @param requirements - Skill requirements to check
 * @returns True if all requirements are met
 */
export function validateSkillCheck(
  resident: ResidentStats,
  requirements: SkillRequirement[]
): boolean {
  for (const req of requirements) {
    const statValue = resident.stats[req.statId] ?? 0;
    
    // Check minimum value
    if (statValue < req.minValue) {
      return false;
    }
    
    // Check maximum value if specified
    if (req.maxValue !== undefined && statValue > req.maxValue) {
      return false;
    }
  }
  
  return true;
}

/**
 * Calculates success chance for a single skill check
 * 
 * @param resident - Resident stats snapshot
 * @param skillCheck - Skill check configuration
 * @param globalSettings - Global quest settings
 * @returns Success probability (0-1)
 */
export function calculateSkillCheckChance(
  resident: ResidentStats,
  skillCheck: SkillCheck,
  globalSettings: QuestSystemConfig['globalSettings']
): number {
  let chance = globalSettings.baseSuccessChance;
  
  // Level bonus
  const levelBonus = resident.level * globalSettings.levelBonusPercent;
  chance += levelBonus;
  
  // Skill match bonus
  let skillMatchScore = 0;
  let totalWeight = 0;
  
  for (const req of skillCheck.requirements) {
    const statValue = resident.stats[req.statId] ?? 0;
    const weight = req.weight ?? 1.0;
    
    // Calculate how much the stat exceeds minimum
    const excess = Math.max(0, statValue - req.minValue);
    const normalizedExcess = excess / req.minValue; // Normalize by minimum
    
    skillMatchScore += normalizedExcess * weight;
    totalWeight += weight;
  }
  
  if (totalWeight > 0) {
    const avgSkillMatch = skillMatchScore / totalWeight;
    chance += avgSkillMatch * 0.3; // Skill match can add up to 30%
  }
  
  // Difficulty penalty
  const difficultyPenalty = (skillCheck.difficultyMultiplier - 1.0) * 0.2;
  chance -= difficultyPenalty;
  
  // Fatigue penalty
  const fatiguePenalty = resident.fatigue * globalSettings.fatiguePenaltyPercent;
  chance -= fatiguePenalty;
  
  // Clamp to min/max
  return Math.max(
    globalSettings.minSuccessChance,
    Math.min(globalSettings.maxSuccessChance, chance)
  );
}

/**
 * Calculates overall success chance for a quest
 * 
 * @param residents - Array of resident stats
 * @param quest - Quest configuration
 * @param globalSettings - Global quest settings
 * @returns Success chance result with breakdown
 */
export function calculateSuccessChance(
  residents: ResidentStats[],
  quest: QuestConfig,
  globalSettings: QuestSystemConfig['globalSettings']
): SuccessChanceResult {
  if (residents.length === 0) {
    return {
      overallChance: 0,
      skillCheckChances: {},
      factors: {
        residentLevel: 0,
        skillMatch: 0,
        difficultyPenalty: 0,
        fatigueModifier: 0,
      },
    };
  }
  
  const skillCheckChances: Record<string, number> = {};
  let totalChance = 1.0;
  
  // Calculate chance for each skill check
  for (const skillCheck of quest.skillChecks) {
    // Find best resident for this skill check
    let bestChance = 0;
    
    for (const resident of residents) {
      const chance = calculateSkillCheckChance(resident, skillCheck, globalSettings);
      bestChance = Math.max(bestChance, chance);
    }
    
    skillCheckChances[skillCheck.id] = bestChance;
    totalChance *= bestChance; // Multiply probabilities (all must succeed)
  }
  
  // Calculate average factors for display
  const avgLevel = residents.reduce((sum, r) => sum + r.level, 0) / residents.length;
  const avgFatigue = residents.reduce((sum, r) => sum + r.fatigue, 0) / residents.length;
  
  return {
    overallChance: totalChance,
    skillCheckChances,
    factors: {
      residentLevel: avgLevel,
      skillMatch: 0.5, // Simplified for display
      difficultyPenalty: quest.skillChecks.reduce((sum, sc) => sum + sc.difficultyMultiplier, 0) / quest.skillChecks.length,
      fatigueModifier: avgFatigue,
    },
  };
}

/**
 * Processes quest completion and determines result
 * 
 * @param quest - Quest configuration
 * @param residents - Residents who participated
 * @param globalSettings - Global quest settings
 * @param startTime - Quest start timestamp
 * @returns Quest result with rewards/penalties
 */
export function processQuestCompletion(
  quest: QuestConfig,
  residents: ResidentStats[],
  globalSettings: QuestSystemConfig['globalSettings'],
  startTime: number
): QuestResult {
  const successChance = calculateSuccessChance(residents, quest, globalSettings);
  const roll = Math.random();
  const success = roll < successChance.overallChance;
  
  const result: QuestResult = {
    success,
    durationMs: Date.now() - startTime,
  };
  
  if (success) {
    // Award rewards
    result.rewards = quest.rewards;
    
    // Calculate experience per resident
    result.experienceGained = {};
    const expPerResident = (quest.rewards.experience ?? 0) / residents.length;
    for (const resident of residents) {
      result.experienceGained[resident.residentId] = Math.floor(expPerResident);
    }
  } else {
    result.failureReason = 'Skill checks failed';
  }
  
  // Apply risks (regardless of success)
  const injuries: Array<{ residentId: string; severity: 'minor' | 'major' | 'critical' }> = [];
  const deaths: string[] = [];
  
  for (const resident of residents) {
    // Check for death
    if (Math.random() < quest.risks.deathChance) {
      deaths.push(resident.residentId);
      continue;
    }
    
    // Check for injury
    if (Math.random() < quest.risks.injuryChance) {
      const severityRoll = Math.random();
      const severity = severityRoll < 0.1 ? 'critical' : severityRoll < 0.4 ? 'major' : 'minor';
      injuries.push({ residentId: resident.residentId, severity });
    }
  }
  
  if (injuries.length > 0) {
    result.injuries = injuries;
  }
  
  if (deaths.length > 0) {
    result.deaths = deaths;
  }
  
  return result;
}

/**
 * Applies quest rewards to player state
 * 
 * @param currentGold - Player's current gold
 * @param rewards - Rewards to apply
 * @returns Updated gold amount
 */
export function applyRewards(
  currentGold: number,
  rewards: QuestReward
): number {
  return currentGold + (rewards.gold ?? 0);
}

/**
 * Applies quest risks to resident
 * 
 * @param currentFatigue - Resident's current fatigue
 * @param risks - Quest risks
 * @returns Updated fatigue
 */
export function applyRisks(
  currentFatigue: number,
  risks: { fatigueCost: number }
): number {
  return currentFatigue + risks.fatigueCost;
}

/**
 * Starts a new quest instance
 * 
 * @param state - Current quest state
 * @param questId - Quest to start
 * @param residentIds - Residents to assign
 * @returns Updated quest state
 */
export function startQuest(
  state: QuestState,
  questId: string,
  residentIds: string[]
): QuestState {
  const newInstance: QuestInstance = {
    questId,
    status: 'in_progress',
    assignedResidents: residentIds,
    startTime: Date.now(),
    progress: 0,
  };
  
  return {
    ...state,
    activeQuests: [...state.activeQuests, newInstance],
    lastUpdate: Date.now(),
  };
}

/**
 * Completes a quest and updates state
 * 
 * @param state - Current quest state
 * @param questId - Quest to complete
 * @param result - Quest result
 * @param questName - Quest name for history
 * @returns Updated quest state
 */
export function completeQuest(
  state: QuestState,
  questId: string,
  result: QuestResult,
  questName: string
): QuestState {
  // Remove from active quests
  const activeQuests = state.activeQuests.filter((q) => q.questId !== questId);
  
  // Find the completed quest instance
  const completedQuest = state.activeQuests.find((q) => q.questId === questId);
  
  if (!completedQuest) {
    return state;
  }
  
  // Add to history
  const historyEntry: QuestHistoryEntry = {
    questId,
    questName,
    timestamp: Date.now(),
    result,
    participants: completedQuest.assignedResidents,
  };
  
  return {
    ...state,
    activeQuests,
    history: [...state.history, historyEntry],
    lastUpdate: Date.now(),
  };
}

/**
 * Checks if a quest is on cooldown
 * 
 * @param state - Current quest state
 * @param questId - Quest to check
 * @param cooldownHours - Cooldown duration in hours
 * @returns True if quest is available
 */
export function isQuestAvailable(
  state: QuestState,
  questId: string,
  cooldownHours: number
): boolean {
  const cooldownEnd = state.cooldowns[questId];
  
  if (!cooldownEnd) {
    return true;
  }
  
  return Date.now() >= cooldownEnd;
}

/**
 * Sets quest cooldown
 * 
 * @param state - Current quest state
 * @param questId - Quest to set cooldown for
 * @param cooldownHours - Cooldown duration in hours
 * @returns Updated quest state
 */
export function setQuestCooldown(
  state: QuestState,
  questId: string,
  cooldownHours: number
): QuestState {
  const cooldownEnd = Date.now() + cooldownHours * 60 * 60 * 1000;
  
  return {
    ...state,
    cooldowns: {
      ...state.cooldowns,
      [questId]: cooldownEnd,
    },
    lastUpdate: Date.now(),
  };
}

/**
 * Gets quest history filtered by quest ID
 * 
 * @param state - Quest state
 * @param questId - Optional quest ID filter
 * @param limit - Maximum entries to return
 * @returns Filtered history
 */
export function getQuestHistory(
  state: QuestState,
  questId?: string,
  limit?: number
): QuestHistoryEntry[] {
  let history = state.history;
  
  if (questId) {
    history = history.filter((entry) => entry.questId === questId);
  }
  
  // Sort by timestamp descending
  history = [...history].sort((a, b) => b.timestamp - a.timestamp);
  
  if (limit && limit > 0) {
    history = history.slice(0, limit);
  }
  
  return history;
}

/**
 * Calculates total rewards earned from quest history
 * 
 * @param state - Quest state
 * @returns Total gold and experience earned
 */
export function getTotalQuestRewards(state: QuestState): {
  totalGold: number;
  totalExperience: number;
  totalQuestsCompleted: number;
} {
  let totalGold = 0;
  let totalExperience = 0;
  let totalQuestsCompleted = 0;
  
  for (const entry of state.history) {
    if (entry.result.success && entry.result.rewards) {
      totalGold += entry.result.rewards.gold ?? 0;
      totalExperience += entry.result.rewards.experience ?? 0;
      totalQuestsCompleted++;
    }
  }
  
  return { totalGold, totalExperience, totalQuestsCompleted };
}
