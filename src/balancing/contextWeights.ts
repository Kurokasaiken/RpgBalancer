import type { StatBlock } from './types';

export const SCENARIO_TYPES = {
  DUEL_1V1: 'duel_1v1',
  TEAMFIGHT_5V5: 'teamfight_5v5',
  SWARM_1VMANY: 'swarm_1vMany',
  BOSS_1V1_LONG: 'boss_1v1_long',
} as const;

export type ScenarioType = (typeof SCENARIO_TYPES)[keyof typeof SCENARIO_TYPES];

export type ScenarioStatKey = keyof StatBlock;

export interface ScenarioConfig {
  type: ScenarioType;
  name: string;
  icon: string;
  description: string;

  // Combat parameters (high-level, descriptive)
  expectedTurns: number;
  enemyCount: number;
  enemyAvgHP: number;

  // Stat effectiveness multipliers relative to base weights
  statEffectiveness: Partial<Record<ScenarioStatKey, number>>;

  // Stats that are most relevant/visible in this scenario
  relevantStats: ScenarioStatKey[];
}

export const SCENARIO_CONFIGS: Record<ScenarioType, ScenarioConfig> = {
  [SCENARIO_TYPES.DUEL_1V1]: {
    type: SCENARIO_TYPES.DUEL_1V1,
    name: 'Duello 1v1',
    icon: '⚔️',
    description:
      'Combattimento standard tra due singoli avversari. Baseline per il bilanciamento.',

    expectedTurns: 8,
    enemyCount: 1,
    enemyAvgHP: 100,

    statEffectiveness: {
      damage: 1.0,
      txc: 1.0,
      evasion: 1.0,
      armor: 1.0,
      resistance: 1.0,
      lifesteal: 1.0,
      regen: 1.0,
      block: 1.0,
      ward: 1.0,
    },

    relevantStats: [
      'damage',
      'txc',
      'evasion',
      'armor',
      'resistance',
      'lifesteal',
      'regen',
      'block',
      'ward',
    ],
  },

  [SCENARIO_TYPES.SWARM_1VMANY]: {
    type: SCENARIO_TYPES.SWARM_1VMANY,
    name: 'Sciame',
    icon: '🐝',
    description:
      'Combattimento contro molti nemici deboli. AoE e sustain veloce hanno più valore, i fight sono brevi.',

    expectedTurns: 4,
    enemyCount: 15,
    enemyAvgHP: 30,

    statEffectiveness: {
      damage: 0.5, // Single-target damage meno rilevante (overkill)
      txc: 0.9,
      evasion: 0.9,
      armor: 0.8,
      resistance: 0.8,
      lifesteal: 1.5, // Più bersagli = più proc di lifesteal
      regen: 0.4, // Combattimento rapido, poco tempo per tickare
      block: 1.0,
      ward: 1.0,
    },

    relevantStats: [
      'damage',
      'txc',
      'evasion',
      'armor',
      'resistance',
      'lifesteal',
      'regen',
      'block',
      'ward',
    ],
  },

  [SCENARIO_TYPES.BOSS_1V1_LONG]: {
    type: SCENARIO_TYPES.BOSS_1V1_LONG,
    name: 'Boss Fight',
    icon: '👹',
    description:
      'Combattimento lungo contro un singolo nemico molto resistente. Sustain e %HP-like effects brillano.',

    expectedTurns: 25,
    enemyCount: 1,
    enemyAvgHP: 2000,

    statEffectiveness: {
      damage: 1.3,
      txc: 1.0,
      evasion: 1.0,
      armor: 1.2,
      resistance: 1.3,
      lifesteal: 2.5,
      regen: 3.0,
      block: 1.2,
      ward: 1.1,
    },

    relevantStats: [
      'damage',
      'txc',
      'evasion',
      'armor',
      'resistance',
      'lifesteal',
      'regen',
      'block',
      'ward',
    ],
  },

  [SCENARIO_TYPES.TEAMFIGHT_5V5]: {
    type: SCENARIO_TYPES.TEAMFIGHT_5V5,
    name: 'Team Fight 5v5',
    icon: '👥',
    description:
      'Scontro di squadra. AoE e mitigazione di gruppo sono importanti, sustain moderato.',

    expectedTurns: 6,
    enemyCount: 5,
    enemyAvgHP: 100,

    statEffectiveness: {
      damage: 0.8,
      txc: 1.0,
      evasion: 1.0,
      armor: 1.1,
      resistance: 1.1,
      lifesteal: 1.3,
      regen: 0.9,
      block: 1.0,
      ward: 1.0,
    },

    relevantStats: [
      'damage',
      'txc',
      'evasion',
      'armor',
      'resistance',
      'lifesteal',
      'regen',
      'block',
      'ward',
    ],
  },
};
