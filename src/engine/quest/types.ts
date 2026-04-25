/**
 * Advanced Quest Phase System with Branching Support
 *
 * This module defines the types for a deterministic, branching quest system
 * where player/resident choices lead to different outcomes and phase sequences.
 *
 * All quest execution is deterministic using LCG seeding for replayability.
 */

/**
 * Core quest phase types including new branching types.
 */
export type QuestPhaseType =
  // Existing phases
  | 'check'
  | 'fight'
  | 'stealth'
  | 'trap'
  | 'explore'
  // New branching phases
  | 'dialogue'
  | 'branch'
  | 'timedChoice';

/**
 * Dialogue phase: presents choices to the player that affect quest progression.
 */
export interface DialoguePhase {
  type: 'dialogue';
  id: string;
  title: string;
  description: string;
  speaker?: string; // NPC or situation name
  choices: DialogueChoice[];
  timeLimitSeconds?: number; // Optional time pressure
}

/**
 * Individual dialogue choice with branching outcome.
 */
export interface DialogueChoice {
  id: string;
  text: string;
  outcome: BranchOutcome;
  requirements?: DialogueRequirements;
}

/**
 * Branch phase: conditional logic that automatically routes to different outcomes
 * based on quest state, resident stats, or random chance.
 */
export interface BranchPhase {
  type: 'branch';
  id: string;
  title: string;
  description: string;
  conditions: BranchCondition[];
  defaultOutcome: BranchOutcome;
}

/**
 * Timed choice phase: player must make decisions under time pressure.
 */
export interface TimedChoicePhase {
  type: 'timedChoice';
  id: string;
  title: string;
  description: string;
  choices: TimedChoice[];
  timeLimitSeconds: number;
  timeoutOutcome: BranchOutcome;
}

/**
 * Individual timed choice option.
 */
export interface TimedChoice {
  id: string;
  text: string;
  outcome: BranchOutcome;
  timeCostSeconds: number; // How long this choice takes
}

/**
 * Branch condition for automatic routing.
 */
export interface BranchCondition {
  type: 'stat_check' | 'random_chance' | 'quest_state' | 'resident_count';
  statName?: string;
  operator?: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  value?: number;
  chance?: number; // For random_chance (0-1)
  questStateKey?: string;
  expectedValue?: unknown;
  outcome: BranchOutcome;
}

/**
 * Outcome of a branch/choice that determines next phase(s).
 */
export interface BranchOutcome {
  nextPhaseIds: string[]; // Can branch to multiple paths
  effects?: QuestEffect[];
  metadata?: QuestMetadata;
}

/**
 * Effects applied when a branch/choice is taken.
 */
export interface QuestEffect {
  type: 'stat_modifier' | 'resource_grant' | 'resident_modifier' | 'quest_flag';
  target: 'party' | 'leader' | 'random_member' | 'all_members';
  statName?: string;
  modifier?: number;
  resourceType?: string;
  resourceAmount?: number;
  flagKey?: string;
  flagValue?: unknown;
}

/**
 * Metadata for telemetry and UI feedback.
 */
export interface QuestMetadata {
  branchReason?: string; // Why this branch was taken
  choiceMade?: string; // Which choice was selected
  timeTaken?: number; // Time spent on phase
  lastChoiceTime?: number; // Legacy telemetry field for average choice time
  heroicThreshold?: number; // For heroic badge calculation
  narrativeSummary?: string; // Brief description of what happened
  phaseType?: string;
  dialoguePhase?: string;
  conditionId?: string;
  timedOut?: boolean;
  timeCostSeconds?: number;
  timedChoicePhase?: string;
  branchResult?: string;
  timedChoice?: boolean | string;
  result?: 'success' | 'failure';
}

/**
 * Dialogue choice requirements.
 */
export interface DialogueRequirements {
  minStat?: Record<string, number>;
  requiredFlags?: string[];
  maxTimeRemaining?: number;
}

/**
 * Complete quest phase definition.
 */
export type QuestPhase =
  | { type: 'check'; id: string; title: string; description: string; }
  | { type: 'fight'; id: string; title: string; description: string; }
  | { type: 'stealth'; id: string; title: string; description: string; }
  | { type: 'trap'; id: string; title: string; description: string; }
  | { type: 'explore'; id: string; title: string; description: string; }
  | DialoguePhase
  | BranchPhase
  | TimedChoicePhase;

/**
 * Quest definition containing all phases and metadata.
 */
export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  phases: QuestPhase[];
  startPhaseId: string;
  successPhaseIds: string[];
  failurePhaseIds: string[];
  maxDurationSeconds?: number;
  tags?: string[];
}

/**
 * Runtime state of a quest execution.
 */
export interface QuestState {
  questId: string;
  currentPhaseId: string;
  completedPhaseIds: string[];
  branchHistory: BranchDecision[];
  effectsApplied: QuestEffect[];
  startTime: number;
  lastActivityTime: number;
  metadata: Record<string, unknown>;
}

/**
 * Record of branching decisions made during quest execution.
 */
export interface BranchDecision {
  phaseId: string;
  choiceId?: string;
  conditionId?: string;
  outcome: BranchOutcome;
  timestamp: number;
  randomSeed?: number; // For deterministic replay
}

/**
 * Result of quest execution.
 */
export interface QuestResult {
  questId: string;
  success: boolean;
  completedPhases: number;
  totalPhases: number;
  durationSeconds: number;
  branchDecisions: BranchDecision[];
  finalEffects: QuestEffect[];
  telemetryData: QuestTelemetry;
}

/**
 * Telemetry data for quest analysis.
 */
export interface QuestTelemetry {
  totalBranchesTaken: number;
  totalBranches?: number; // Legacy alias for totalBranchesTaken
  averageChoiceTime: number;
  heroicMoments: number;
  failurePoints: string[];
  successPath: string[];
  playerChoices: string[];
}
