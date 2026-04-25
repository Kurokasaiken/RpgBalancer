/**
 * Default STS Deck Presets
 * 
 * Base deck configurations for the STS-like numeric simulator.
 * These are read by the simulator and can be extended with additional presets.
 */

import type { STSDeckPreset, SpellCardConfig } from '../types';

/**
 * Basic attack spell - deals direct damage
 */
const basicAttack: SpellCardConfig = {
  id: 'basic_attack',
  name: 'Basic Attack',
  summary: 'Deal 6 damage',
  manaCost: { alteration: 1 },
  effect: { type: 'attack', value: 6 },
  rebellionTimer: 0,
  tags: ['basic', 'damage']
};

/**
 * Defensive block spell
 */
const basicBlock: SpellCardConfig = {
  id: 'basic_block',
  name: 'Basic Block',
  summary: 'Gain 5 block',
  manaCost: { bio: 1 },
  effect: { type: 'block', value: 5 },
  rebellionTimer: 0,
  tags: ['basic', 'defense']
};

/**
 * Inspiration generation spell
 */
const gatherInspiration: SpellCardConfig = {
  id: 'gather_inspiration',
  name: 'Gather Inspiration',
  summary: 'Gain 2 Inspiration',
  manaCost: { wave: 1 },
  effect: { type: 'inspiration', value: 2 },
  rebellionTimer: 0,
  tags: ['resource', 'inspiration']
};

/**
 * Poison damage spell
 */
const venomStrike: SpellCardConfig = {
  id: 'venom_strike',
  name: 'Venom Strike',
  summary: 'Deal 4 damage + 2 Poison',
  manaCost: { alteration: 1, bio: 1 },
  effect: { type: 'attack', value: 4, statusEffect: 'poison' },
  rebellionTimer: 2,
  tags: ['damage', 'poison', 'combo']
};

/**
 * Draw spell
 */
const quickStudy: SpellCardConfig = {
  id: 'quick_study',
  name: 'Quick Study',
  summary: 'Draw 2 cards',
  manaCost: { entropy: 1 },
  effect: { type: 'draw', value: 2 },
  rebellionTimer: 0,
  tags: ['draw', 'utility']
};

/**
 * Default starter deck - balanced mix of attack, defense, and utility
 */
export const DEFAULT_DECK: STSDeckPreset = {
  id: 'starter_deck',
  label: 'Starter Deck',
  handSize: 5,
  drawPerTurn: 1,
  basePlayerHp: 75,
  baseEnemyHp: 80,
  maxTurns: 20,
  cards: [
    basicAttack,
    basicAttack,
    basicAttack,
    basicAttack,
    basicBlock,
    basicBlock,
    basicBlock,
    gatherInspiration,
    gatherInspiration,
    venomStrike,
    quickStudy,
    quickStudy
  ],
  manaGrowth: {
    alteration: 1,
    bio: 1,
    wave: 1,
    entropy: 1
  },
  inspirationPerTurn: 1,
  inspirationDecay: 1
};

/**
 * Aggressive deck - focused on damage output
 */
export const AGGRESSIVE_DECK: STSDeckPreset = {
  id: 'aggressive_deck',
  label: 'Aggressive Deck',
  handSize: 5,
  drawPerTurn: 1,
  basePlayerHp: 60,
  baseEnemyHp: 80,
  maxTurns: 15,
  cards: [
    basicAttack,
    basicAttack,
    basicAttack,
    basicAttack,
    basicAttack,
    venomStrike,
    venomStrike,
    venomStrike,
    gatherInspiration,
    quickStudy,
    quickStudy,
    quickStudy
  ],
  manaGrowth: {
    alteration: 2,
    bio: 1,
    wave: 1,
    entropy: 1
  },
  inspirationPerTurn: 2,
  inspirationDecay: 1
};

/**
 * Control deck - focused on defense and resources
 */
export const CONTROL_DECK: STSDeckPreset = {
  id: 'control_deck',
  label: 'Control Deck',
  handSize: 6,
  drawPerTurn: 1,
  basePlayerHp: 90,
  baseEnemyHp: 80,
  maxTurns: 25,
  cards: [
    basicAttack,
    basicAttack,
    basicBlock,
    basicBlock,
    basicBlock,
    basicBlock,
    basicBlock,
    gatherInspiration,
    gatherInspiration,
    gatherInspiration,
    quickStudy,
    quickStudy,
    quickStudy
  ],
  manaGrowth: {
    alteration: 1,
    bio: 2,
    wave: 2,
    entropy: 1
  },
  inspirationPerTurn: 1,
  inspirationDecay: 1
};
