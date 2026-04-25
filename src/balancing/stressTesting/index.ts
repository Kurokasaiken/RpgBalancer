/**
 * STS Stress Testing Barrel Export
 * 
 * Exports all STS stress testing systems and types
 */

// Combatant State System
export {
  type STSCombatantState,
  type STSActiveBuff,
  type STSArmorResult,
  type STSBuffApplicationResult,
  type STSIntentPredictionResult,
  type STSIntentFactor,
  STSCombatantStateManager,
  createPlayerStateManager,
  createEnemyStateManager
} from './STSCombatantState';

// Intent Prediction System
export {
  type STSIntentType,
  type STSIntentContext,
  STSIntentPredictionEngine,
  createIntentPredictionEngine,
  createDefaultIntentContext
} from './STSIntentPrediction';

// Buff System
export {
  type STSBuffApplicationResult as STSBuffApplication,
  type STSBuffRemovalResult,
  type STSActiveBuff as STSActiveBuffInstance,
  type STSBuffProcessContext,
  STSBuffSystem,
  createBuffSystem,
  createDefaultBuffProcessContext
} from './STSBuffSystem';
