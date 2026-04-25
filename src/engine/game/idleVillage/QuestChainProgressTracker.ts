/**
 * Quest Chain Progress Tracker – NP-141
 * 
 * Service for tracking quest chain progress with milestones, branching paths,
 * and completion rewards using a state machine pattern.
 * 
 * @since NP-141
 */

import type {
  QuestChainConfig,
  QuestConfig,
  QuestProgressState,
  QuestChainProgressState,
  QuestObjective,
  QuestMilestone,
  QuestStatus,
  UnlockCondition,
} from '@/balancing/config/idleVillage/questChainConfig';
import {
  validateQuestChainConfig,
  validateQuestProgressState,
  validateQuestChainProgressState,
  getQuestById,
  getMilestoneById,
  areObjectivesCompleted,
  isMilestoneReady,
  calculateQuestCompletion,
  calculateChainCompletion,
  areUnlockConditionsMet,
  getNextAvailableQuests,
} from '@/balancing/config/idleVillage/questChainConfig';

/**
 * Quest event type.
 */
export type QuestEventType =
  | 'quest_started'
  | 'quest_completed'
  | 'quest_failed'
  | 'objective_progress'
  | 'milestone_reached'
  | 'chain_completed'
  | 'branch_selected';

/**
 * Quest event data.
 */
export interface QuestEvent {
  type: QuestEventType;
  questId: string;
  chainId: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

/**
 * Player context for unlock conditions.
 */
export interface PlayerContext {
  playerLevel: number;
  playerStats: Record<string, number>;
  ownedItems: string[];
}

/**
 * Quest Chain Progress Tracker service.
 */
export class QuestChainProgressTracker {
  private chain: QuestChainConfig;
  private progressState: QuestChainProgressState;
  private eventHistory: QuestEvent[] = [];
  private maxEventHistory = 100;

  constructor(chain: QuestChainConfig, initialProgress?: QuestChainProgressState) {
    this.chain = validateQuestChainConfig(chain);
    
    if (initialProgress) {
      this.progressState = validateQuestChainProgressState(initialProgress);
    } else {
      this.progressState = this.initializeProgressState();
    }
  }

  /**
   * Initializes progress state for new chain.
   */
  private initializeProgressState(): QuestChainProgressState {
    const questProgress: Record<string, QuestProgressState> = {};

    for (const quest of this.chain.quests) {
      const isStarting = this.chain.startingQuests.includes(quest.id);
      questProgress[quest.id] = {
        questId: quest.id,
        status: isStarting ? 'available' : 'locked',
        objectives: quest.objectives.map(obj => ({ ...obj })),
        completedMilestones: [],
      };
    }

    return {
      chainId: this.chain.id,
      questProgress,
      completedQuests: [],
      activeQuests: [],
      availableQuests: [...this.chain.startingQuests],
      completionPercentage: 0,
      completed: false,
    };
  }

  /**
   * Gets current progress state.
   */
  getProgressState(): QuestChainProgressState {
    return { ...this.progressState };
  }

  /**
   * Gets quest progress by ID.
   */
  getQuestProgress(questId: string): QuestProgressState | undefined {
    return this.progressState.questProgress[questId];
  }

  /**
   * Gets chain configuration.
   */
  getChainConfig(): QuestChainConfig {
    return { ...this.chain };
  }

  /**
   * Starts a quest.
   */
  startQuest(questId: string): boolean {
    const quest = getQuestById(this.chain, questId);
    if (!quest) return false;

    const progress = this.progressState.questProgress[questId];
    if (!progress || progress.status !== 'available') return false;

    progress.status = 'in_progress';
    progress.startedAt = Date.now();

    if (!this.progressState.activeQuests.includes(questId)) {
      this.progressState.activeQuests.push(questId);
    }

    this.progressState.availableQuests = this.progressState.availableQuests.filter(
      id => id !== questId
    );

    this.recordEvent({
      type: 'quest_started',
      questId,
      chainId: this.chain.id,
      timestamp: Date.now(),
    });

    this.emitTelemetry('quest_started', { questId, chainId: this.chain.id });

    return true;
  }

  /**
   * Updates objective progress.
   */
  updateObjectiveProgress(
    questId: string,
    objectiveId: string,
    progress: number
  ): boolean {
    const quest = getQuestById(this.chain, questId);
    if (!quest) return false;

    const questProgress = this.progressState.questProgress[questId];
    if (!questProgress || questProgress.status !== 'in_progress') return false;

    const objective = questProgress.objectives.find(obj => obj.id === objectiveId);
    if (!objective) return false;

    const oldProgress = objective.current;
    objective.current = Math.min(progress, objective.target);
    objective.completed = objective.current >= objective.target;

    if (objective.current !== oldProgress) {
      this.recordEvent({
        type: 'objective_progress',
        questId,
        chainId: this.chain.id,
        timestamp: Date.now(),
        data: {
          objectiveId,
          progress: objective.current,
          target: objective.target,
          completed: objective.completed,
        },
      });
    }

    this.checkMilestones(questId);
    this.checkQuestCompletion(questId);

    return true;
  }

  /**
   * Increments objective progress.
   */
  incrementObjectiveProgress(
    questId: string,
    objectiveId: string,
    amount: number = 1
  ): boolean {
    const questProgress = this.progressState.questProgress[questId];
    if (!questProgress) return false;

    const objective = questProgress.objectives.find(obj => obj.id === objectiveId);
    if (!objective) return false;

    return this.updateObjectiveProgress(questId, objectiveId, objective.current + amount);
  }

  /**
   * Checks and completes milestones.
   */
  private checkMilestones(questId: string): void {
    const quest = getQuestById(this.chain, questId);
    if (!quest) return;

    const questProgress = this.progressState.questProgress[questId];
    if (!questProgress) return;

    for (const milestone of quest.milestones) {
      if (questProgress.completedMilestones.includes(milestone.id)) continue;

      if (isMilestoneReady(milestone, questProgress.objectives)) {
        this.completeMilestone(questId, milestone.id);
      }
    }
  }

  /**
   * Completes a milestone.
   */
  private completeMilestone(questId: string, milestoneId: string): void {
    const quest = getQuestById(this.chain, questId);
    if (!quest) return;

    const milestone = getMilestoneById(quest, milestoneId);
    if (!milestone) return;

    const questProgress = this.progressState.questProgress[questId];
    if (!questProgress) return;

    questProgress.completedMilestones.push(milestoneId);

    this.recordEvent({
      type: 'milestone_reached',
      questId,
      chainId: this.chain.id,
      timestamp: Date.now(),
      data: {
        milestoneId,
        milestoneName: milestone.name,
        rewards: milestone.rewards,
      },
    });

    this.emitTelemetry('quest_milestone_reached', {
      questId,
      chainId: this.chain.id,
      milestoneId,
      milestoneName: milestone.name,
      rewards: milestone.rewards,
    });
  }

  /**
   * Checks and completes quest if all objectives are done.
   */
  private checkQuestCompletion(questId: string): void {
    const quest = getQuestById(this.chain, questId);
    if (!quest) return;

    const questProgress = this.progressState.questProgress[questId];
    if (!questProgress || questProgress.status !== 'in_progress') return;

    if (areObjectivesCompleted(questProgress.objectives)) {
      this.completeQuest(questId);
    }
  }

  /**
   * Completes a quest.
   */
  completeQuest(questId: string): boolean {
    const quest = getQuestById(this.chain, questId);
    if (!quest) return false;

    const questProgress = this.progressState.questProgress[questId];
    if (!questProgress || questProgress.status !== 'in_progress') return false;

    questProgress.status = 'completed';
    questProgress.completedAt = Date.now();

    this.progressState.completedQuests.push(questId);
    this.progressState.activeQuests = this.progressState.activeQuests.filter(
      id => id !== questId
    );

    this.recordEvent({
      type: 'quest_completed',
      questId,
      chainId: this.chain.id,
      timestamp: Date.now(),
      data: {
        rewards: quest.rewards,
      },
    });

    this.emitTelemetry('quest_completed', {
      questId,
      chainId: this.chain.id,
      rewards: quest.rewards,
    });

    this.unlockNextQuests(questId);
    this.updateChainCompletion();

    return true;
  }

  /**
   * Fails a quest.
   */
  failQuest(questId: string, reason?: string): boolean {
    const questProgress = this.progressState.questProgress[questId];
    if (!questProgress || questProgress.status !== 'in_progress') return false;

    questProgress.status = 'failed';

    this.progressState.activeQuests = this.progressState.activeQuests.filter(
      id => id !== questId
    );

    this.recordEvent({
      type: 'quest_failed',
      questId,
      chainId: this.chain.id,
      timestamp: Date.now(),
      data: { reason },
    });

    return true;
  }

  /**
   * Unlocks next quests after completing a quest.
   */
  private unlockNextQuests(completedQuestId: string): void {
    const quest = getQuestById(this.chain, completedQuestId);
    if (!quest || !quest.nextQuests) return;

    for (const nextQuestId of quest.nextQuests) {
      const nextProgress = this.progressState.questProgress[nextQuestId];
      if (nextProgress && nextProgress.status === 'locked') {
        nextProgress.status = 'available';
        
        if (!this.progressState.availableQuests.includes(nextQuestId)) {
          this.progressState.availableQuests.push(nextQuestId);
        }
      }
    }
  }

  /**
   * Updates chain completion status.
   */
  private updateChainCompletion(): void {
    const completionPercentage = calculateChainCompletion(this.chain, this.progressState);
    this.progressState.completionPercentage = completionPercentage;

    if (completionPercentage === 100 && !this.progressState.completed) {
      this.progressState.completed = true;

      this.recordEvent({
        type: 'chain_completed',
        questId: '',
        chainId: this.chain.id,
        timestamp: Date.now(),
        data: {
          rewards: this.chain.completionRewards,
        },
      });

      this.emitTelemetry('quest_chain_completed', {
        chainId: this.chain.id,
        rewards: this.chain.completionRewards,
      });
    }
  }

  /**
   * Selects a branch for branching quest paths.
   */
  selectBranch(questId: string, branchId: string): boolean {
    const questProgress = this.progressState.questProgress[questId];
    if (!questProgress) return false;

    questProgress.selectedBranch = branchId;

    this.recordEvent({
      type: 'branch_selected',
      questId,
      chainId: this.chain.id,
      timestamp: Date.now(),
      data: { branchId },
    });

    return true;
  }

  /**
   * Checks if quest is available based on unlock conditions.
   */
  isQuestAvailable(questId: string, playerContext: PlayerContext): boolean {
    const quest = getQuestById(this.chain, questId);
    if (!quest) return false;

    const context = {
      completedQuests: this.progressState.completedQuests,
      ...playerContext,
    };

    return areUnlockConditionsMet(quest.unlockConditions, context);
  }

  /**
   * Updates available quests based on player context.
   */
  updateAvailableQuests(playerContext: PlayerContext): string[] {
    const available = getNextAvailableQuests(
      this.chain,
      this.progressState.completedQuests,
      playerContext
    );

    for (const questId of available) {
      const progress = this.progressState.questProgress[questId];
      if (progress && progress.status === 'locked') {
        progress.status = 'available';
        
        if (!this.progressState.availableQuests.includes(questId)) {
          this.progressState.availableQuests.push(questId);
        }
      }
    }

    return available;
  }

  /**
   * Gets quest completion percentage.
   */
  getQuestCompletionPercentage(questId: string): number {
    const quest = getQuestById(this.chain, questId);
    const progress = this.progressState.questProgress[questId];
    
    if (!quest || !progress) return 0;

    return calculateQuestCompletion(quest, progress);
  }

  /**
   * Gets chain completion percentage.
   */
  getChainCompletionPercentage(): number {
    return this.progressState.completionPercentage;
  }

  /**
   * Gets event history.
   */
  getEventHistory(): QuestEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Records an event.
   */
  private recordEvent(event: QuestEvent): void {
    this.eventHistory.push(event);

    if (this.eventHistory.length > this.maxEventHistory) {
      this.eventHistory.shift();
    }
  }

  /**
   * Clears event history.
   */
  clearEventHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Exports tracker state for persistence.
   */
  exportState(): {
    chainId: string;
    progressState: QuestChainProgressState;
    eventHistory: QuestEvent[];
  } {
    return {
      chainId: this.chain.id,
      progressState: { ...this.progressState },
      eventHistory: [...this.eventHistory],
    };
  }

  /**
   * Imports tracker state from persistence.
   */
  importState(state: {
    progressState?: QuestChainProgressState;
    eventHistory?: QuestEvent[];
  }): void {
    if (state.progressState) {
      this.progressState = validateQuestChainProgressState(state.progressState);
    }
    if (state.eventHistory) {
      this.eventHistory = state.eventHistory;
    }
  }

  /**
   * Resets tracker to initial state.
   */
  reset(): void {
    this.progressState = this.initializeProgressState();
    this.eventHistory = [];
  }

  /**
   * Gets statistics about quest progress.
   */
  getStatistics(): {
    totalQuests: number;
    completedQuests: number;
    activeQuests: number;
    availableQuests: number;
    lockedQuests: number;
    completionPercentage: number;
    totalMilestones: number;
    completedMilestones: number;
  } {
    const totalMilestones = this.chain.quests.reduce(
      (sum, quest) => sum + quest.milestones.length,
      0
    );
    const completedMilestones = Object.values(this.progressState.questProgress).reduce(
      (sum, progress) => sum + progress.completedMilestones.length,
      0
    );

    return {
      totalQuests: this.chain.quests.length,
      completedQuests: this.progressState.completedQuests.length,
      activeQuests: this.progressState.activeQuests.length,
      availableQuests: this.progressState.availableQuests.length,
      lockedQuests: this.chain.quests.length - 
        this.progressState.completedQuests.length -
        this.progressState.activeQuests.length -
        this.progressState.availableQuests.length,
      completionPercentage: this.progressState.completionPercentage,
      totalMilestones,
      completedMilestones,
    };
  }

  /**
   * Emits telemetry event.
   */
  private emitTelemetry(eventName: string, data: Record<string, unknown>): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: {
            timestamp: Date.now(),
            ...data,
          },
        })
      );
    }
  }
}

/**
 * Creates a quest chain progress tracker instance.
 */
export function createQuestChainProgressTracker(
  chain: QuestChainConfig,
  initialProgress?: QuestChainProgressState
): QuestChainProgressTracker {
  return new QuestChainProgressTracker(chain, initialProgress);
}
