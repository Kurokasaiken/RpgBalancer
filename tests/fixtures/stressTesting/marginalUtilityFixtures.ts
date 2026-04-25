/**
 * Test fixtures for Phase 10.5 Marginal Utility stress testing
 * 
 * Provides mock data and configurations for testing the stress testing pipeline
 * including archetypes, configurations, and expected results.
 */

import type { StressTestArchetype } from '../../../src/balancing/stressTesting/types';
import type { BalancerConfig } from '../../../src/balancing/config/types';
import type { MarginalUtilityConfig } from '../../../src/balancing/config/stressTesting/marginalUtilityConfig';

/**
 * Mock BalancerConfig for testing
 */
export const MOCK_BALANCER_CONFIG: BalancerConfig = {
  version: '1.0.0',
  stats: {
    hp: {
      id: 'hp',
      label: 'Health Points',
      type: 'number',
      min: 0,
      max: 999,
      step: 1,
      defaultValue: 100,
      weight: 1.0,
      isCore: true,
      isDerived: false,
      isVisible: true,
      isEditable: true,
      description: 'Total health points',
    },
    damage: {
      id: 'damage',
      label: 'Damage',
      type: 'number',
      min: 0,
      max: 999,
      step: 1,
      defaultValue: 10,
      weight: 1.0,
      isCore: true,
      isDerived: false,
      isVisible: true,
      isEditable: true,
      description: 'Base damage output',
    },
    speed: {
      id: 'speed',
      label: 'Speed',
      type: 'number',
      min: 0,
      max: 999,
      step: 1,
      defaultValue: 5,
      weight: 0.8,
      isCore: false,
      isDerived: false,
      isVisible: true,
      isEditable: true,
      description: 'Combat speed modifier',
    },
    armor: {
      id: 'armor',
      label: 'Armor',
      type: 'number',
      min: 0,
      max: 999,
      step: 1,
      defaultValue: 5,
      weight: 0.6,
      isCore: false,
      isDerived: false,
      isVisible: true,
      isEditable: true,
      description: 'Damage reduction',
    },
    crit: {
      id: 'crit',
      label: 'Critical Hit',
      type: 'percentage',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 5,
      weight: 0.5,
      isCore: false,
      isDerived: false,
      isVisible: true,
      isEditable: true,
      description: 'Critical hit chance',
    },
    derived_defense: {
      id: 'derived_defense',
      label: 'Derived Defense',
      type: 'number',
      min: 0,
      max: 999,
      step: 1,
      defaultValue: 10,
      weight: 0.0,
      isCore: false,
      isDerived: true,
      isVisible: false,
      isEditable: false,
      description: 'Derived from armor + hp/10',
    },
  },
  cards: {
    core: {
      id: 'core',
      name: 'Core Stats',
      description: 'Core character attributes',
      stats: ['hp', 'damage'],
      color: '#3b82f6',
      isCore: true,
      isDeletable: false,
    },
    combat: {
      id: 'combat',
      name: 'Combat',
      description: 'Combat-focused attributes',
      stats: ['speed', 'crit'],
      color: '#ef4444',
      isCore: false,
      isDeletable: true,
    },
    defense: {
      id: 'defense',
      name: 'Defense',
      description: 'Defensive attributes',
      stats: ['armor'],
      color: '#22c55e',
      isCore: false,
      isDeletable: true,
    },
  },
  presets: {
    balanced: {
      id: 'balanced',
      name: 'Balanced',
      description: 'Balanced character build',
      stats: {
        hp: 100,
        damage: 10,
        speed: 5,
        armor: 5,
        crit: 5,
      },
    },
    tank: {
      id: 'tank',
      name: 'Tank',
      description: 'High defense build',
      stats: {
        hp: 150,
        damage: 8,
        speed: 3,
        armor: 15,
        crit: 2,
      },
    },
  },
  targetTurns: 10,
  scenarioBudget: 100,
};

/**
 * Mock baseline archetype
 */
export const MOCK_BASELINE_ARCHETYPE: StressTestArchetype = {
  id: 'baseline',
  name: 'Baseline',
  description: 'Baseline archetype for testing',
  stats: {
    hp: 100,
    damage: 10,
    speed: 5,
    armor: 5,
    crit: 5,
  },
  testedStats: [],
  pointsPerStat: 0,
  seed: 12345,
  type: 'baseline',
};

/**
 * Mock single-stat archetypes
 */
export const MOCK_SINGLE_STAT_ARCHETYPES: StressTestArchetype[] = [
  {
    id: 'single_hp',
    name: 'HP +25',
    description: 'Single stat archetype with hp boosted',
    stats: {
      hp: 125,
      damage: 10,
      speed: 5,
      armor: 5,
      crit: 5,
    },
    testedStats: ['hp'],
    pointsPerStat: 25,
    seed: 12345,
    type: 'single',
  },
  {
    id: 'single_damage',
    name: 'Damage +25',
    description: 'Single stat archetype with damage boosted',
    stats: {
      hp: 100,
      damage: 35,
      speed: 5,
      armor: 5,
      crit: 5,
    },
    testedStats: ['damage'],
    pointsPerStat: 25,
    seed: 12345,
    type: 'single',
  },
  {
    id: 'single_speed',
    name: 'Speed +25',
    description: 'Single stat archetype with speed boosted',
    stats: {
      hp: 100,
      damage: 10,
      speed: 25,
      armor: 5,
      crit: 5,
    },
    testedStats: ['speed'],
    pointsPerStat: 25,
    seed: 12345,
    type: 'single',
  },
  {
    id: 'single_armor',
    name: 'Armor +25',
    description: 'Single stat archetype with armor boosted',
    stats: {
      hp: 100,
      damage: 10,
      speed: 5,
      armor: 20,
      crit: 5,
    },
    testedStats: ['armor'],
    pointsPerStat: 25,
    seed: 12345,
    type: 'single',
  },
  {
    id: 'single_crit',
    name: 'Crit +25',
    description: 'Single stat archetype with crit boosted',
    stats: {
      hp: 100,
      damage: 10,
      speed: 5,
      armor: 5,
      crit: 17,
    },
    testedStats: ['crit'],
    pointsPerStat: 25,
    seed: 12345,
    type: 'single',
  },
];

/**
 * Mock pair-stat archetypes
 */
export const MOCK_PAIR_STAT_ARCHETYPES: StressTestArchetype[] = [
  {
    id: 'pair_hp_damage',
    name: 'HP +25 & Damage +25',
    description: 'Pair stat archetype with hp and damage boosted',
    stats: {
      hp: 125,
      damage: 35,
      speed: 5,
      armor: 5,
      crit: 5,
    },
    testedStats: ['hp', 'damage'],
    pointsPerStat: 25,
    seed: 12345,
    type: 'pair',
  },
  {
    id: 'pair_hp_speed',
    name: 'HP +25 & Speed +25',
    description: 'Pair stat archetype with hp and speed boosted',
    stats: {
      hp: 125,
      damage: 10,
      speed: 25,
      armor: 5,
      crit: 5,
    },
    testedStats: ['hp', 'speed'],
    pointsPerStat: 25,
    seed: 12345,
    type: 'pair',
  },
  {
    id: 'pair_damage_speed',
    name: 'Damage +25 & Speed +25',
    description: 'Pair stat archetype with damage and speed boosted',
    stats: {
      hp: 100,
      damage: 35,
      speed: 25,
      armor: 5,
      crit: 5,
    },
    testedStats: ['damage', 'speed'],
    pointsPerStat: 25,
    seed: 12345,
    type: 'pair',
  },
  {
    id: 'pair_armor_crit',
    name: 'Armor +25 & Crit +25',
    description: 'Pair stat archetype with armor and crit boosted',
    stats: {
      hp: 100,
      damage: 10,
      speed: 5,
      armor: 20,
      crit: 17,
    },
    testedStats: ['armor', 'crit'],
    pointsPerStat: 25,
    seed: 12345,
    type: 'pair',
  },
];

/**
 * Mock marginal utility configuration for testing
 */
export const MOCK_MARGINAL_UTILITY_CONFIG: MarginalUtilityConfig = {
  thresholds: {
    opThreshold: 1.15,
    weakThreshold: 0.95,
  },
  simulation: {
    simulationCount: 1000, // Reduced for faster testing
    concurrencyLimit: 2,
    seed: 12345,
  },
  export: {
    enableJson: true,
    enableCsv: true,
    enableMarkdown: true,
    exportPath: '/tmp/test-exports/stressTesting/marginalUtility',
  },
  enableLogging: false, // Disable logging for cleaner test output
  enableCaching: false, // Disable caching for deterministic tests
};

/**
 * Expected analysis results for testing
 */
export const MOCK_EXPECTED_RESULTS = {
  statMetrics: [
    {
      statId: 'hp',
      avgWinRate: 0.55,
      stdDeviation: 0.12,
      matchupCount: 4,
      bestMatchup: { opponentStat: 'crit', winRate: 0.65 },
      worstMatchup: { opponentStat: 'damage', winRate: 0.45 },
      ranking: 2,
      confidenceInterval: { lower: 0.48, upper: 0.62 },
    },
    {
      statId: 'damage',
      avgWinRate: 0.58,
      stdDeviation: 0.15,
      matchupCount: 4,
      bestMatchup: { opponentStat: 'armor', winRate: 0.72 },
      worstMatchup: { opponentStat: 'hp', winRate: 0.48 },
      ranking: 1,
      confidenceInterval: { lower: 0.49, upper: 0.67 },
    },
  ],
  synergyAnalyses: [
    {
      pairId: 'pair_hp_damage',
      statIds: ['hp', 'damage'],
      observedWinRate: 0.62,
      expectedWinRate: 0.565,
      synergyMultiplier: 1.097,
      isOpSynergy: false,
      isWeakSynergy: false,
      isSignificant: false,
      pValue: 0.12,
      effectSize: 0.097,
    },
  ],
  summary: {
    totalSimulations: 4000,
    totalRuntimeMs: 1500,
    avgSimulationsPerSecond: 2666,
    opSynergiesCount: 0,
    weakSynergiesCount: 0,
    significantSynergiesCount: 0,
  },
};

/**
 * Mock stress testing scenario
 */
export const MOCK_STRESS_TEST_SCENARIO = {
  id: 'test-scenario-1',
  name: 'Test Scenario 1',
  description: 'Test scenario for marginal utility analysis',
  config: MOCK_BALANCER_CONFIG,
  archetypes: [
    MOCK_BASELINE_ARCHETYPE,
    ...MOCK_SINGLE_STAT_ARCHETYPES,
    ...MOCK_PAIR_STAT_ARCHETYPES,
  ],
  seed: 12345,
  createdAt: new Date('2026-01-11T15:00:00Z'),
};

/**
 * Utility functions for test fixtures
 */
export const FIXTURE_UTILS = {
  /**
   * Create a mock archetype with custom stats
   */
  createMockArchetype: (
    id: string,
    name: string,
    stats: Record<string, number>,
    testedStats: string[],
    type: 'baseline' | 'single' | 'pair' = 'single'
  ): StressTestArchetype => ({
    id,
    name,
    description: `Mock archetype for ${name}`,
    stats,
    testedStats,
    pointsPerStat: 25,
    seed: 12345,
    type,
  }),

  /**
   * Create mock archetypes for all stat combinations
   */
  createAllMockArchetypes: (): StressTestArchetype[] => [
    MOCK_BASELINE_ARCHETYPE,
    ...MOCK_SINGLE_STAT_ARCHETYPES,
    ...MOCK_PAIR_STAT_ARCHETYPES,
  ],

  /**
   * Create a mock marginal utility config with custom values
   */
  createMockConfig: (overrides: Partial<MarginalUtilityConfig> = {}): MarginalUtilityConfig => ({
    ...MOCK_MARGINAL_UTILITY_CONFIG,
    ...overrides,
  }),

  /**
   * Validate mock data consistency
   */
  validateMockData: (): boolean => {
    // Check that all single stat archetypes have exactly one tested stat
    const singleStatsValid = MOCK_SINGLE_STAT_ARCHETYPES.every(
      archetype => archetype.testedStats.length === 1
    );

    // Check that all pair stat archetypes have exactly two tested stats
    const pairStatsValid = MOCK_PAIR_STAT_ARCHETYPES.every(
      archetype => archetype.testedStats.length === 2
    );

    // Check that all tested stats exist in the config
    const allTestedStats = [
      ...MOCK_SINGLE_STAT_ARCHETYPES.flatMap(a => a.testedStats),
      ...MOCK_PAIR_STAT_ARCHETYPES.flatMap(a => a.testedStats),
    ];
    const configStatsValid = allTestedStats.every(stat => 
      Object.keys(MOCK_BALANCER_CONFIG.stats).includes(stat)
    );

    return singleStatsValid && pairStatsValid && configStatsValid;
  },
};
