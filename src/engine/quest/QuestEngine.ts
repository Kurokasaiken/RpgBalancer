/**
 * Quest Engine with Branching Support
 *
 * Deterministic execution of quests with branching logic, choice handling,
 * and comprehensive telemetry for analysis and replayability.
 *
 * Uses LCG seeding for deterministic outcomes while maintaining replayability.
 */

import type {
  QuestDefinition,
  QuestPhase,
  QuestState,
  BranchDecision,
  QuestResult,
  BranchOutcome,
  QuestTelemetry,
  DialoguePhase,
  BranchPhase,
  TimedChoicePhase,
  BranchCondition,
} from './types';

/**
 * Deterministic random number generator using Linear Congruential Generator.
 * Ensures replayable quest outcomes.
 */
class LCG {
  public seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  /**
   * Generate next random number between 0 and 1.
   */
  next(): number {
    // Parameters for a good LCG (Numerical Recipes)
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  /**
   * Generate random integer in range [min, max).
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

export interface QuestEngineConfig {
  telemetryEnabled: boolean;
  telemetryEmitInterval: number; // ms between telemetry emissions
  maxTelemetryHistory: number;
  enableDetailedLogging: boolean;
}

export interface QuestTelemetryEvent {
  type: 'quest_started' | 'phase_completed' | 'choice_made' | 'quest_completed' | 'branch_taken';
  questId: string;
  phaseId?: string;
  choiceId?: string;
  branchId?: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export type QuestTelemetryCallback = (event: QuestTelemetryEvent) => void;

/**
 * Helper to extract quest type from ID (e.g., 'quest-combat-001' -> 'combat')
 */
function extractQuestType(questId: string): string {
  const parts = questId.split('-');
  return parts.length > 1 ? parts[1] : 'unknown';
}

/**
 * Quest Engine for executing quests with branching logic.
 */
export class QuestEngine {
  private rng: LCG;
  private config: QuestEngineConfig;
  private telemetryCallbacks: QuestTelemetryCallback[] = [];
  private lastTelemetryEmit = 0;

  constructor(seed?: number, config?: Partial<QuestEngineConfig>) {
    this.rng = new LCG(seed);
    this.config = {
      telemetryEnabled: true,
      telemetryEmitInterval: 100, // Emit telemetry at most every 100ms
      maxTelemetryHistory: 100,
      enableDetailedLogging: false,
      ...config,
    };
  }

  /**
   * Add a telemetry callback for real-time telemetry emission.
   */
  onTelemetry(callback: QuestTelemetryCallback): () => void {
    this.telemetryCallbacks.push(callback);
    return () => {
      const index = this.telemetryCallbacks.indexOf(callback);
      if (index > -1) {
        this.telemetryCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit a telemetry event to all registered callbacks.
   */
  private emitTelemetry(event: QuestTelemetryEvent): void {
    if (!this.config.telemetryEnabled) return;

    const now = Date.now();
    if (now - this.lastTelemetryEmit < this.config.telemetryEmitInterval) return;

    this.lastTelemetryEmit = now;

    for (const callback of this.telemetryCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.warn('QuestEngine: Telemetry callback failed:', error);
      }
    }

    if (this.config.enableDetailedLogging) {
      console.log('QuestEngine: Telemetry event:', event);
    }
  }

  /**
   * Initialize a new quest state.
   */
  initializeQuest(quest: QuestDefinition): QuestState {
    const now = Date.now();
    const state = {
      questId: quest.id,
      currentPhaseId: quest.startPhaseId,
      completedPhaseIds: [],
      branchHistory: [],
      effectsApplied: [],
      startTime: now,
      lastActivityTime: now,
      metadata: {},
    };

    // Emit quest started event
    this.emitTelemetry({
      type: 'quest_started',
      questId: quest.id,
      timestamp: now,
      metadata: {
        questType: extractQuestType(quest.id),
        totalPhases: quest.phases.length,
        startPhaseId: quest.startPhaseId,
      },
    });

    return state;
  }

  /**
   * Execute a quest phase and return the next state.
   */
  executePhase(
    quest: QuestDefinition,
    state: QuestState,
    choiceId?: string,
    timeSpentSeconds?: number
  ): { newState: QuestState; result?: QuestResult } {
    const currentPhase = this.findPhaseById(quest, state.currentPhaseId);
    if (!currentPhase) {
      throw new Error(`Phase ${state.currentPhaseId} not found in quest ${quest.id}`);
    }

    const now = Date.now();
    const decision: BranchDecision = {
      phaseId: currentPhase.id,
      choiceId,
      timestamp: now,
      randomSeed: this.rng.seed,
      outcome: this.determineOutcome(currentPhase, choiceId),
    };

    // Emit choice made event if applicable
    if (choiceId) {
      this.emitTelemetry({
        type: 'choice_made',
        questId: state.questId,
        phaseId: currentPhase.id,
        choiceId,
        timestamp: now,
        metadata: {
          phaseType: currentPhase.type,
          timeSpentSeconds,
          choiceMade: decision.outcome.metadata?.choiceMade,
        },
      });
    }

    // Emit branch taken event for branching phases
    if (currentPhase.type === 'branch' || currentPhase.type === 'dialogue' || currentPhase.type === 'timedChoice') {
      this.emitTelemetry({
        type: 'branch_taken',
        questId: state.questId,
        phaseId: currentPhase.id,
        branchId: currentPhase.type,
        timestamp: now,
        metadata: {
          branchType: currentPhase.type,
          conditionMet: currentPhase.type === 'branch',
          nextPhaseIds: decision.outcome.nextPhaseIds,
          randomSeed: decision.randomSeed,
        },
      });
    }

    // Apply effects
    const newEffects = decision.outcome.effects || [];
    const updatedState: QuestState = {
      ...state,
      completedPhaseIds: [...state.completedPhaseIds, currentPhase.id],
      branchHistory: [...state.branchHistory, decision],
      effectsApplied: [...state.effectsApplied, ...newEffects],
      lastActivityTime: now,
      metadata: {
        ...state.metadata,
        ...(decision.outcome.metadata || {}),
        lastChoiceTime: timeSpentSeconds,
      },
    };

    // Check if quest is complete
    const isSuccess = quest.successPhaseIds.includes(state.currentPhaseId);
    const isFailure = quest.failurePhaseIds.includes(state.currentPhaseId);

    if (isSuccess || isFailure || decision.outcome.nextPhaseIds.length === 0) {
      // Quest complete
      const result: QuestResult = {
        questId: quest.id,
        success: isSuccess,
        completedPhases: updatedState.completedPhaseIds.length,
        totalPhases: quest.phases.length,
        durationSeconds: (now - state.startTime) / 1000,
        branchDecisions: updatedState.branchHistory,
        finalEffects: updatedState.effectsApplied,
        telemetryData: this.generateTelemetry(updatedState),
      };

      // Emit quest completed event
      this.emitTelemetry({
        type: 'quest_completed',
        questId: quest.id,
        timestamp: now,
        metadata: {
          success: isSuccess,
          durationSeconds: result.durationSeconds,
          completedPhases: result.completedPhases,
          totalBranches: result.telemetryData.totalBranches,
          heroicMoments: result.telemetryData.heroicMoments,
        },
      });

      return { newState: updatedState, result };
    }

    // Continue to next phase(s) - for simplicity, take the first path
    // In a full implementation, this could support parallel branches
    updatedState.currentPhaseId = decision.outcome.nextPhaseIds[0];

    // Emit phase completed event
    this.emitTelemetry({
      type: 'phase_completed',
      questId: quest.id,
      phaseId: currentPhase.id,
      timestamp: now,
      metadata: {
        phaseType: currentPhase.type,
        nextPhaseId: updatedState.currentPhaseId,
        timeSpentSeconds,
        effectsApplied: newEffects.length,
      },
    });

    return { newState: updatedState };
  }

  /**
   * Determine the outcome of a phase based on its type and inputs.
   */
  private determineOutcome(phase: QuestPhase, choiceId?: string): BranchOutcome {
    switch (phase.type) {
      case 'dialogue':
        return this.handleDialoguePhase(phase, choiceId);
      case 'branch':
        return this.handleBranchPhase(phase);
      case 'timedChoice':
        return this.handleTimedChoicePhase(phase, choiceId);
      case 'check':
      case 'fight':
      case 'stealth':
      case 'trap':
      case 'explore':
        // Simple phases - always succeed for now
        return {
          nextPhaseIds: [this.getNextPhaseId(phase.id)],
          metadata: { phaseType: phase.type, result: 'success' },
        };
      default:
        throw new Error(`Unknown phase type: ${(phase as { type?: unknown }).type}`);
    }
  }

  private handleDialoguePhase(phase: DialoguePhase, choiceId?: string): BranchOutcome {
    if (!choiceId) {
      // Default to first choice if none specified
      return phase.choices[0]?.outcome || { nextPhaseIds: [] };
    }

    const choice = phase.choices.find(c => c.id === choiceId);
    if (!choice) {
      throw new Error(`Choice ${choiceId} not found in dialogue phase ${phase.id}`);
    }

    return {
      ...choice.outcome,
      metadata: {
        ...choice.outcome.metadata,
        choiceMade: choice.text,
        dialoguePhase: phase.title,
      },
    };
  }

  private handleBranchPhase(phase: BranchPhase): BranchOutcome {
    for (const condition of phase.conditions) {
      if (this.evaluateCondition(condition)) {
        return {
          ...condition.outcome,
          metadata: {
            ...condition.outcome.metadata,
            branchReason: `Condition: ${condition.type}`,
            conditionId: condition.type,
          },
        };
      }
    }

    return {
      ...phase.defaultOutcome,
      metadata: {
        ...phase.defaultOutcome.metadata,
        branchReason: 'Default outcome',
      },
    };
  }

  private handleTimedChoicePhase(phase: TimedChoicePhase, choiceId?: string): BranchOutcome {
    if (!choiceId) {
      // Timeout occurred
      return {
        ...phase.timeoutOutcome,
        metadata: {
          ...phase.timeoutOutcome.metadata,
          timedOut: true,
          choiceMade: 'timeout',
        },
      };
    }

    const choice = phase.choices.find(c => c.id === choiceId);
    if (!choice) {
      throw new Error(`Choice ${choiceId} not found in timed choice phase ${phase.id}`);
    }

    return {
      ...choice.outcome,
      metadata: {
        ...choice.outcome.metadata,
        choiceMade: choice.text,
        timeCostSeconds: choice.timeCostSeconds,
        timedChoicePhase: phase.title,
      },
    };
  }

  private evaluateCondition(condition: BranchCondition): boolean {
    switch (condition.type) {
      case 'random_chance':
        return this.rng.next() < (condition.chance || 0);
      case 'stat_check':
        // For now, assume stats are always sufficient
        // In a full implementation, this would check actual resident stats
        return true;
      case 'quest_state':
        // Check quest metadata flags
        return false; // Placeholder
      case 'resident_count':
        // Check party size
        return true; // Placeholder
      default:
        return false;
    }
  }

  private findPhaseById(quest: QuestDefinition, phaseId: string): QuestPhase | undefined {
    return quest.phases.find(p => p.id === phaseId);
  }

  private getNextPhaseId(currentPhaseId: string): string {
    // Simple sequential progression - in practice, this would come from quest definition
    const phaseNum = parseInt(currentPhaseId.split('-')[1] || '0');
    return `phase-${phaseNum + 1}`;
  }

  private generateTelemetry(state: QuestState): QuestTelemetry {
    const decisions = state.branchHistory;
    const choiceTimes = decisions
      .map(d => (d.outcome.metadata?.lastChoiceTime as number) || 0)
      .filter(t => t > 0);

    return {
      totalBranchesTaken: decisions.length,
      averageChoiceTime: choiceTimes.length > 0
        ? choiceTimes.reduce((a, b) => a + b, 0) / choiceTimes.length
        : 0,
      heroicMoments: decisions.filter(d => d.outcome.metadata?.heroicThreshold).length,
      failurePoints: decisions
        .filter(d => d.outcome.nextPhaseIds.some(id => id.includes('failure')))
        .map(d => d.phaseId),
      successPath: decisions
        .filter(d => d.outcome.nextPhaseIds.some(id => id.includes('success')))
        .map(d => d.phaseId),
      playerChoices: decisions
        .map(d => d.outcome.metadata?.choiceMade as string)
        .filter(Boolean),
    };
  }

  /**
   * Get available choices for the current phase.
   */
  getAvailableChoices(quest: QuestDefinition, state: QuestState): string[] {
    const currentPhase = this.findPhaseById(quest, state.currentPhaseId);
    if (!currentPhase) return [];

    switch (currentPhase.type) {
      case 'dialogue':
        return currentPhase.choices.map(c => c.id);
      case 'timedChoice':
        return currentPhase.choices.map(c => c.id);
      default:
        return [];
    }
  }

  /**
   * Check if a phase requires player input.
   */
  requiresInput(quest: QuestDefinition, state: QuestState): boolean {
    const currentPhase = this.findPhaseById(quest, state.currentPhaseId);
    if (!currentPhase) return false;

    return ['dialogue', 'timedChoice'].includes(currentPhase.type);
  }
}
