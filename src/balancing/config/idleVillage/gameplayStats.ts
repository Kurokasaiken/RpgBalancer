import type { GameplayStatId } from '@/balancing/types/gameplayModifierTypes';

export interface GameplayStatDefinition {
  id: GameplayStatId;
  label: string;
  description: string;
  tags: string[];
  defaultValue: number;
  unit?: string;
}

const makeStat = (definition: GameplayStatDefinition): GameplayStatDefinition => definition;

export const GAMEPLAY_STAT_DEFINITIONS: GameplayStatDefinition[] = [
  makeStat({
    id: 'stat_core_hp',
    label: 'Health Points',
    description: 'Baseline resident vitality used by injury/death calculators.',
    tags: ['core', 'survival', 'hp'],
    defaultValue: 100,
    unit: 'points',
  }),
  makeStat({
    id: 'stat_core_damage',
    label: 'Damage Output',
    description: 'Average damage dealt per strike in quest/job resolvers.',
    tags: ['core', 'edge'],
    defaultValue: 10,
    unit: 'points',
  }),
  makeStat({
    id: 'stat_core_guard',
    label: 'Guard',
    description: 'Flat mitigation applied before risk multipliers.',
    tags: ['core', 'defense'],
    defaultValue: 5,
    unit: 'points',
  }),
  makeStat({
    id: 'stat_core_focus',
    label: 'Focus',
    description: 'Determines success odds for stealth/dialogue sequences.',
    tags: ['core', 'lantern'],
    defaultValue: 8,
    unit: 'points',
  }),
  makeStat({
    id: 'stat_derived_synergy',
    label: 'Party Synergy',
    description: 'Derived score from stat tag weights to express team cohesion.',
    tags: ['derived', 'team'],
    defaultValue: 1,
  }),
  makeStat({
    id: 'stat_derived_resolve',
    label: 'Resolve',
    description: 'Narrative morale indicator used by drop validation feedback.',
    tags: ['derived', 'morale'],
    defaultValue: 0,
    unit: 'points',
  }),
  makeStat({
    id: 'stat_derived_riskBuffer',
    label: 'Risk Buffer',
    description: 'Temporary reduction of incoming injury chance.',
    tags: ['derived', 'risk'],
    defaultValue: 0,
  }),
  makeStat({
    id: 'stat_derived_outputMultiplier',
    label: 'Output Multiplier',
    description: 'Scalar applied between job base yield and reward multipliers.',
    tags: ['derived', 'economy'],
    defaultValue: 1,
  }),
  makeStat({
    id: 'stat_fatigue_gain',
    label: 'Fatigue Gain',
    description: 'Per-tick fatigue accumulation rate before modifiers.',
    tags: ['fatigue'],
    defaultValue: 100,
    unit: 'points',
  }),
  makeStat({
    id: 'stat_fatigue_recovery',
    label: 'Fatigue Recovery',
    description: 'Per-night fatigue recovery baseline used by tick plan.',
    tags: ['fatigue', 'recovery'],
    defaultValue: 80,
    unit: 'points',
  }),
  makeStat({
    id: 'stat_reward_gold',
    label: 'Gold Reward',
    description: 'Post-engine gold payout scaler.',
    tags: ['reward', 'economy'],
    defaultValue: 0,
    unit: 'gold',
  }),
  makeStat({
    id: 'stat_reward_food',
    label: 'Food Reward',
    description: 'Food production multiplier applied after base yield.',
    tags: ['reward', 'economy'],
    defaultValue: 0,
    unit: 'food',
  }),
  makeStat({
    id: 'stat_reward_xp',
    label: 'XP Reward',
    description: 'Experience reward multiplier applied after quest resolver.',
    tags: ['reward', 'xp'],
    defaultValue: 0,
    unit: 'xp',
  }),
  makeStat({
    id: 'stat_risk_injury',
    label: 'Injury Chance',
    description: 'Probability delta applied to injury roll outcomes.',
    tags: ['risk'],
    defaultValue: 0,
    unit: '%',
  }),
  makeStat({
    id: 'stat_risk_death',
    label: 'Death Chance',
    description: 'Probability delta applied to death roll outcomes.',
    tags: ['risk', 'critical'],
    defaultValue: 0,
    unit: '%',
  }),
];

export const GAMEPLAY_STAT_IDS: GameplayStatId[] = GAMEPLAY_STAT_DEFINITIONS.map((stat) => stat.id);

const definitionMap = new Map<GameplayStatId, GameplayStatDefinition>(
  GAMEPLAY_STAT_DEFINITIONS.map((stat) => [stat.id, stat]),
);

export function getGameplayStatDefinition(id: GameplayStatId): GameplayStatDefinition | undefined {
  return definitionMap.get(id);
}
