/**
 * Default Enemy Intent Profiles
 * 
 * Enemy AI configurations for the STS-like numeric simulator.
 * These define the behavior patterns and intent distributions for different enemy types.
 */

import type { EnemyIntentProfile, EnemyIntentAction } from '../types';

/**
 * Basic attack intent
 */
const basicAttack: EnemyIntentAction = {
  id: 'basic_attack',
  label: 'Basic Attack',
  type: 'attack',
  weight: 40,
  baselineValue: 12,
  variance: 3,
  severity: 'info',
};

/**
 * Basic block intent
 */
const basicBlock: EnemyIntentAction = {
  id: 'basic_block',
  label: 'Basic Block',
  type: 'block',
  weight: 20,
  baselineValue: 8,
  variance: 2,
  severity: 'info',
};

/**
 * Power-up buff intent
 */
const powerUp: EnemyIntentAction = {
  id: 'power_up',
  label: 'Power Up',
  type: 'buff',
  weight: 20,
  baselineValue: 3,
  variance: 1,
  severity: 'info',
};

/**
 * Special multi-hit attack
 */
const multiStrike: EnemyIntentAction = {
  id: 'multi_strike',
  label: 'Multi Strike',
  type: 'special',
  weight: 20,
  baselineValue: 6,
  variance: 2,
  statusEffect: 'weaken',
  severity: 'lethal',
};

/**
 * Ironclad-like enemy profile - balanced mix of attacks and defenses
 */
export const IRONCLAD_PROFILE: EnemyIntentProfile = {
  id: 'ironclad',
  label: 'Ironclad',
  maxHp: 80,
  intents: [basicAttack, basicBlock, powerUp, multiStrike],
  reactiveModifiers: [
    {
      condition: 'playerLowHp',
      threshold: 30,
      type: 'multiply',
      targetIntentId: 'basic_attack',
      factor: 1.5
    }
  ],
  pacingCaps: {
    minTurns: 3,
    maxTurns: 20
  }
};

/**
 * Silent-like enemy profile - focused on poison and debuffs
 */
const poisonStrike: EnemyIntentAction = {
  id: 'poison_strike',
  label: 'Poison Strike',
  type: 'attack',
  weight: 35,
  baselineValue: 8,
  variance: 2,
  statusEffect: 'poison',
  severity: 'warning',
};

const evade: EnemyIntentAction = {
  id: 'evade',
  label: 'Evade',
  type: 'special',
  weight: 25,
  baselineValue: 0,
  variance: 0,
  severity: 'info',
};

export const SILENT_PROFILE: EnemyIntentProfile = {
  id: 'silent',
  label: 'Silent',
  maxHp: 70,
  intents: [basicAttack, poisonStrike, evade, powerUp],
  reactiveModifiers: [
    {
      condition: 'enemyLowHp',
      threshold: 25,
      type: 'multiply',
      targetIntentId: 'poison_strike',
      factor: 2.0
    }
  ],
  pacingCaps: {
    minTurns: 4,
    maxTurns: 18
  }
};

/**
 * Guardian-like enemy profile - heavily defensive
 */
const heavyBlock: EnemyIntentAction = {
  id: 'heavy_block',
  label: 'Heavy Block',
  type: 'block',
  weight: 35,
  baselineValue: 15,
  variance: 3,
  severity: 'info',
};

const fortify: EnemyIntentAction = {
  id: 'fortify',
  label: 'Fortify',
  type: 'buff',
  weight: 25,
  baselineValue: 5,
  variance: 1,
  statusEffect: 'fortify',
  severity: 'info',
};

export const GUARDIAN_PROFILE: EnemyIntentProfile = {
  id: 'guardian',
  label: 'Guardian',
  maxHp: 100,
  intents: [basicAttack, heavyBlock, fortify, multiStrike],
  reactiveModifiers: [
    {
      condition: 'playerLowHp',
      threshold: 25,
      type: 'multiply',
      targetIntentId: 'heavy_block',
      factor: 1.8
    }
  ],
  pacingCaps: {
    minTurns: 5,
    maxTurns: 25
  }
};

/**
 * Beginner-friendly enemy profile for tutorial/testing
 */
export const TUTORIAL_PROFILE: EnemyIntentProfile = {
  id: 'tutorial',
  label: 'Tutorial Enemy',
  maxHp: 50,
  intents: [
    {
      id: 'weak_attack',
      label: 'Weak Attack',
      type: 'attack',
      weight: 60,
      baselineValue: 6,
      variance: 1,
      severity: 'info',
    },
    {
      id: 'weak_block',
      label: 'Weak Block',
      type: 'block',
      weight: 40,
      baselineValue: 4,
      variance: 1,
      severity: 'info',
    }
  ],
  pacingCaps: {
    minTurns: 3,
    maxTurns: 15
  }
};

// Export all enemy profiles as a map for easy lookup
export const DEFAULT_ENEMY_PROFILES: Record<string, EnemyIntentProfile> = {
  ironclad: IRONCLAD_PROFILE,
  silent: SILENT_PROFILE,
  guardian: GUARDIAN_PROFILE,
  tutorial: TUTORIAL_PROFILE,
};
