/**
 * Intent Timeline Generator for STS Intent Visualizer
 * 
 * Converts STS simulator state and turn logs into structured timeline data
 * suitable for visualization in the Intent Visualizer component.
 */

import type { STSSimulatorState, CombatantState, ActiveBuff } from './stsSimulatorState';
import type { STSTurnLog } from './useSTSRunRecorder';
import type { EnemyIntentType, STSIntentSeverity } from '../../config/archmage';
import type {
  IntentTimeline,
  TimelineRound,
  TimelineBuff,
  TimelineIntent,
  TimelineDiff,
  TimelineComparison,
} from '../../../ui/tools/sts/types/intentTimeline';

// Re-export IntentTimeline for use in other modules
export type { IntentTimeline };

/**
 * Converts ActiveBuff to TimelineBuff format
 */
const activeBuffToTimelineBuff = (buff: ActiveBuff): TimelineBuff => ({
  id: buff.id,
  name: buff.definition.name,
  remainingTurns: buff.remainingTurns,
  stacks: buff.stacks,
  isPositive: buff.definition.isPositive ?? true,
  appliedTurn: buff.appliedTurn,
});

/**
 * Creates a TimelineIntent from intent data
 */
const createTimelineIntent = (
  type: EnemyIntentType,
  label: string,
  value: number,
  description: string,
  severity?: STSIntentSeverity,
  isPredicted: boolean = false,
  confidence?: number
): TimelineIntent => ({
  type,
  label,
  value,
  severity,
  description,
  isPredicted,
  confidence,
});

/**
 * Generates timeline data from simulator state and turn logs
 */
export const generateIntentTimeline = (
  state: STSSimulatorState,
  turnLogs: STSTurnLog[]
): IntentTimeline => {
  const rounds: TimelineRound[] = [];
  let currentPlayerState: CombatantState = state.playerState;
  let currentEnemyState: CombatantState = state.enemyState;

  // Process each turn log to build timeline
  turnLogs.forEach((turnLog, index) => {
    const roundNumber = index + 1;

    // Extract player intent/action from turn log
    const playerIntent = turnLog.playerAction
      ? createTimelineIntent(
          'card_play' as EnemyIntentType,
          turnLog.playerAction.cardName || 'Unknown',
          turnLog.playerAction.manaCost || 0,
          `Played ${turnLog.playerAction.cardName}`,
          undefined,
          false
        )
      : null;

    // Extract enemy intent from turn log or state
    const enemyIntent = turnLog.enemyIntent
      ? createTimelineIntent(
          turnLog.enemyIntent.type,
          turnLog.enemyIntent.label,
          turnLog.enemyIntent.value,
          turnLog.enemyIntent.description,
          turnLog.enemyIntent.severity,
          false
        )
      : state.lastEnemyIntent
      ? createTimelineIntent(
          state.lastEnemyIntent.type,
          state.lastEnemyIntent.label,
          state.lastEnemyIntent.value,
          state.lastEnemyIntent.description,
          state.lastEnemyIntent.severity,
          false
        )
      : null;

    // Convert buffs to timeline format
    const playerBuffs = currentPlayerState.buffs
      .filter(buff => buff.definition.isPositive ?? true)
      .map(activeBuffToTimelineBuff);
    
    const playerDebuffs = currentPlayerState.buffs
      .filter(buff => !(buff.definition.isPositive ?? true))
      .map(activeBuffToTimelineBuff);
    
    const enemyBuffs = currentEnemyState.buffs
      .filter(buff => buff.definition.isPositive ?? true)
      .map(activeBuffToTimelineBuff);
    
    const enemyDebuffs = currentEnemyState.buffs
      .filter(buff => !(buff.definition.isPositive ?? true))
      .map(activeBuffToTimelineBuff);

    // Calculate projected damage (simplified - would need actual combat logic)
    const projectedPlayerDamage = enemyIntent?.value || 0;
    const projectedEnemyDamage = playerIntent ? 0 : 0; // Simplified

    // Create round data
    const round: TimelineRound = {
      roundNumber,
      playerIntent,
      enemyIntent,
      playerBuffs,
      playerDebuffs,
      enemyBuffs,
      enemyDebuffs,
      projectedPlayerDamage,
      projectedEnemyDamage,
      playerHpStart: currentPlayerState.hp,
      enemyHpStart: currentEnemyState.hp,
      playerHpEnd: currentPlayerState.hp,
      enemyHpEnd: currentEnemyState.hp,
    };

    rounds.push(round);

    // Update states for next round based on turn log results
    if (turnLog.endState) {
      currentPlayerState = turnLog.endState.playerState || currentPlayerState;
      currentEnemyState = turnLog.endState.enemyState || currentEnemyState;
      
      // Update actual damage in the round
      round.actualPlayerDamage = round.playerHpStart - currentPlayerState.hp;
      round.actualEnemyDamage = round.enemyHpStart - currentEnemyState.hp;
      round.playerHpEnd = currentPlayerState.hp;
      round.enemyHpEnd = currentEnemyState.hp;
    }
  });

  return {
    runId: state.runId || `run-${Date.now()}`,
    deckId: state.deckId,
    enemyId: state.enemyId,
    seed: state.seed,
    rounds,
    result: state.result || 'ongoing',
    totalRounds: rounds.length,
    generatedAt: Date.now(),
  };
};

/**
 * Compares two timelines and generates diff data
 */
export const compareTimelines = (
  current: IntentTimeline,
  previous: IntentTimeline
): TimelineComparison => {
  const diffs: TimelineDiff[] = [];
  const maxRounds = Math.max(current.rounds.length, previous.rounds.length);

  for (let i = 0; i < maxRounds; i++) {
    const currentRound = current.rounds[i];
    const previousRound = previous.rounds[i];

    if (!currentRound && !previousRound) continue;
    if (!currentRound || !previousRound) {
      diffs.push({
        roundNumber: i + 1,
        type: 'hp',
        description: currentRound ? 'Round added' : 'Round removed',
        previousValue: previousRound ? 'exists' : null,
        currentValue: currentRound ? 'exists' : null,
        severity: 'moderate',
      });
      continue;
    }

    // Compare enemy intents
    if (currentRound.enemyIntent?.type !== previousRound.enemyIntent?.type) {
      diffs.push({
        roundNumber: i + 1,
        type: 'intent',
        description: 'Enemy intent changed',
        previousValue: previousRound.enemyIntent?.type || 'none',
        currentValue: currentRound.enemyIntent?.type || 'none',
        severity: 'major',
      });
    }

    // Compare player intents
    if (currentRound.playerIntent?.label !== previousRound.playerIntent?.label) {
      diffs.push({
        roundNumber: i + 1,
        type: 'intent',
        description: 'Player action changed',
        previousValue: previousRound.playerIntent?.label || 'none',
        currentValue: currentRound.playerIntent?.label || 'none',
        severity: 'moderate',
      });
    }

    // Compare damage projections
    if (currentRound.projectedPlayerDamage !== previousRound.projectedPlayerDamage) {
      diffs.push({
        roundNumber: i + 1,
        type: 'damage',
        description: 'Projected player damage changed',
        previousValue: previousRound.projectedPlayerDamage,
        currentValue: currentRound.projectedPlayerDamage,
        severity: 'moderate',
      });
    }

    // Compare HP changes
    if (currentRound.playerHpEnd !== previousRound.playerHpEnd) {
      const hpDiff = currentRound.playerHpEnd - previousRound.playerHpEnd;
      diffs.push({
        roundNumber: i + 1,
        type: 'hp',
        description: `Player HP changed by ${hpDiff > 0 ? '+' : ''}${hpDiff}`,
        previousValue: previousRound.playerHpEnd,
        currentValue: currentRound.playerHpEnd,
        severity: Math.abs(hpDiff) > 10 ? 'major' : Math.abs(hpDiff) > 5 ? 'moderate' : 'minor',
      });
    }

    // Compare buff counts
    const currentBuffCount = currentRound.playerBuffs.length + currentRound.playerDebuffs.length;
    const previousBuffCount = previousRound.playerBuffs.length + previousRound.playerDebuffs.length;
    if (currentBuffCount !== previousBuffCount) {
      diffs.push({
        roundNumber: i + 1,
        type: 'buff',
        description: 'Player buff count changed',
        previousValue: previousBuffCount,
        currentValue: currentBuffCount,
        severity: 'minor',
      });
    }
  }

  return {
    previous,
    current,
    diffs,
    summary: {
      totalDifferences: diffs.length,
      majorChanges: diffs.filter(d => d.severity === 'major').length,
      moderateChanges: diffs.filter(d => d.severity === 'moderate').length,
      minorChanges: diffs.filter(d => d.severity === 'minor').length,
    },
  };
};

/**
 * Creates a mock timeline for testing purposes
 */
export const createMockTimeline = (): IntentTimeline => ({
  runId: 'mock-run-1',
  deckId: 'starter_deck',
  enemyId: 'tutorial',
  seed: 12345,
  rounds: [
    {
      roundNumber: 1,
      playerIntent: createTimelineIntent(
        'card_play' as EnemyIntentType,
        'Strike',
        1,
        'Deal 6 damage'
      ),
      enemyIntent: createTimelineIntent(
        'attack',
        'Strike',
        6,
        'Deal 6 damage',
        'low'
      ),
      playerBuffs: [],
      playerDebuffs: [],
      enemyBuffs: [],
      enemyDebuffs: [],
      projectedPlayerDamage: 6,
      projectedEnemyDamage: 6,
      playerHpStart: 70,
      enemyHpStart: 24,
      playerHpEnd: 64,
      enemyHpEnd: 18,
      actualPlayerDamage: 6,
      actualEnemyDamage: 6,
    },
    {
      roundNumber: 2,
      playerIntent: createTimelineIntent(
        'card_play' as EnemyIntentType,
        'Defend',
        1,
        'Gain 5 block'
      ),
      enemyIntent: createTimelineIntent(
        'defend',
        'Defend',
        5,
        'Gain 5 block',
        'low'
      ),
      playerBuffs: [
        {
          id: 'block-1',
          name: 'Block',
          remainingTurns: 1,
          stacks: 5,
          isPositive: true,
          appliedTurn: 2,
        },
      ],
      playerDebuffs: [],
      enemyBuffs: [
        {
          id: 'block-2',
          name: 'Block',
          remainingTurns: 1,
          stacks: 5,
          isPositive: true,
          appliedTurn: 2,
        },
      ],
      enemyDebuffs: [],
      projectedPlayerDamage: 0,
      projectedEnemyDamage: 0,
      playerHpStart: 64,
      enemyHpStart: 18,
      playerHpEnd: 64,
      enemyHpEnd: 18,
    },
    {
      roundNumber: 3,
      playerIntent: createTimelineIntent(
        'card_play' as EnemyIntentType,
        'Strike',
        1,
        'Deal 6 damage'
      ),
      enemyIntent: createTimelineIntent(
        'attack',
        'Strike',
        8,
        'Deal 8 damage',
        'medium'
      ),
      playerBuffs: [],
      playerDebuffs: [
        {
          id: 'vulnerable-1',
          name: 'Vulnerable',
          remainingTurns: 2,
          stacks: 1,
          isPositive: false,
          appliedTurn: 3,
        },
      ],
      enemyBuffs: [],
      enemyDebuffs: [],
      projectedPlayerDamage: 12, // 8 * 1.5 for vulnerable
      projectedEnemyDamage: 6,
      playerHpStart: 64,
      enemyHpStart: 18,
      playerHpEnd: 52,
      enemyHpEnd: 12,
      actualPlayerDamage: 12,
      actualEnemyDamage: 6,
    },
  ],
  result: 'victory',
  totalRounds: 3,
  generatedAt: Date.now(),
});
