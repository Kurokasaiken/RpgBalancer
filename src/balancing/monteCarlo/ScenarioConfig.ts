/**
 * Scenario Configuration for Balancer Monte Carlo simulations
 * 
 * Defines the structure for simulation scenarios including target turns,
 * enemy profiles, stat weights, and budget constraints.
 */

export interface ScenarioConfig {
  /** Unique identifier for the scenario */
  id: string;
  /** Human-readable name for the scenario */
  name: string;
  /** Description of what the scenario tests */
  description: string;
  
  /** Target number of turns for victory/defeat evaluation */
  targetTurns: number;
  
  /** Enemy configuration for the simulation */
  enemy: EnemyProfile;
  
  /** Stat weights for the simulation */
  statWeights: Record<string, number>;
  
  /** Budget constraints for the simulation */
  scenarioBudget: ScenarioBudget;
  
  /** Simulation parameters */
  simulationParams: SimulationParameters;
}

export interface EnemyProfile {
  /** Enemy type identifier */
  type: 'boss' | 'group' | 'sciame' | '1v1';
  
  /** Enemy name/identifier */
  name: string;
  
  /** Base stats for the enemy */
  baseStats: Record<string, number>;
  
  /** Enemy-specific modifiers */
  modifiers: {
    /** Damage multiplier */
    damageMultiplier?: number;
    /** Defense multiplier */
    defenseMultiplier?: number;
    /** HP multiplier */
    hpMultiplier?: number;
    /** Speed modifier */
    speedMultiplier?: number;
  };
  
  /** Special abilities or traits */
  abilities?: string[];
  
  /** Difficulty rating (1-10) */
  difficulty: number;
}

export interface ScenarioBudget {
  /** Maximum stat points available */
  maxStatPoints: number;
  
  /** Cost per stat point */
  statPointCost: number;
  
  /** Minimum points per stat */
  minPointsPerStat: number;
  
  /** Maximum points per stat */
  maxPointsPerStat: number;
  
  /** Available archetype slots */
  archetypeSlots: number;
}

export interface SimulationParameters {
  /** Number of Monte Carlo iterations to run */
  iterations: number;
  
  /** Random seed for reproducibility */
  seed: number;
  
  /** Whether to use deterministic mode for testing */
  deterministic: boolean;
  
  /** Enable detailed logging */
  verbose: boolean;
  
  /** Export results to file */
  exportResults: boolean;
  
  /** Export format */
  exportFormat: 'json' | 'csv' | 'markdown';
}

export interface ScenarioResult {
  /** Scenario identifier */
  scenarioId: string;
  
  /** Simulation timestamp */
  timestamp: number;
  
  /** Number of iterations completed */
  iterations: number;
  
  /** Win rate (0-1) */
  winRate: number;
  
  /** Average turns to victory */
  avgTurnsToVictory: number;
  
  /** Average turns to defeat */
  avgTurnsToDefeat: number;
  
  /** Standard deviation of turns */
  turnsStdDev: number;
  
  /** Detailed statistics */
  statistics: {
    /** Victory count */
    victories: number;
    /** Defeat count */
    defeats: number;
    /** Timeout count */
    timeouts: number;
    /** Average damage dealt */
    avgDamageDealt: number;
    /** Average damage taken */
    avgDamageTaken: number;
    /** Average HP remaining */
    avgHpRemaining: number;
  };
  
  /** Archetype performance data */
  archetypePerformance: Record<string, ArchetypeResult>;
  
  /** Synergy analysis results */
  synergyAnalysis: SynergyResult[];
}

export interface ArchetypeResult {
  /** Archetype identifier */
  archetypeId: string;
  
  /** Win rate for this archetype */
  winRate: number;
  
  /** Average turns to completion */
  avgTurns: number;
  
  /** Standard deviation */
  stdDev: number;
  
  /** Performance rating */
  rating: 'OP' | 'Good' | 'Average' | 'Weak' | 'Poor';
  
  /** Optimal weight for this archetype */
  optimalWeight?: number;
}

export interface SynergyResult {
  /** Pair of archetype IDs */
  archetypePair: [string, string];
  
  /** Combined win rate */
  combinedWinRate: number;
  
  /** Expected win rate (individual average) */
  expectedWinRate: number;
  
  /** Synergy multiplier */
  synergyMultiplier: number;
  
  /** Synergy rating */
  rating: 'OP' | 'Good' | 'Average' | 'Weak' | 'Poor';
  
  /** Sample size */
  sampleSize: number;
}

/**
 * Predefined scenario templates
 */
export const SCENARIO_TEMPLATES = {
  /** Basic 1v1 scenario */
  basic1v1: {
    id: 'basic-1v1',
    name: 'Basic 1v1',
    description: 'Standard one-on-one combat scenario',
    targetTurns: 20,
    enemy: {
      type: '1v1',
      name: 'Basic Enemy',
      baseStats: {
        hp: 100,
        damage: 15,
        defense: 10,
        speed: 10,
      },
      modifiers: {
        damageMultiplier: 1.0,
        defenseMultiplier: 1.0,
        hpMultiplier: 1.0,
        speedMultiplier: 1.0,
      },
      difficulty: 3,
    },
    statWeights: {
      hp: 1.0,
      damage: 1.0,
      defense: 0.8,
      speed: 0.6,
    },
    scenarioBudget: {
      maxStatPoints: 100,
      statPointCost: 1,
      minPointsPerStat: 10,
      maxPointsPerStat: 40,
      archetypeSlots: 4,
    },
    simulationParams: {
      iterations: 10000,
      seed: 12345,
      deterministic: false,
      verbose: true,
      exportResults: true,
      exportFormat: 'json',
    },
  } as ScenarioConfig,
  
  /** Boss scenario */
  boss: {
    id: 'boss-fight',
    name: 'Boss Fight',
    description: 'Challenging boss encounter scenario',
    targetTurns: 30,
    enemy: {
      type: 'boss',
      name: 'Dragon Lord',
      baseStats: {
        hp: 500,
        damage: 40,
        defense: 30,
        speed: 8,
      },
      modifiers: {
        damageMultiplier: 1.5,
        defenseMultiplier: 1.2,
        hpMultiplier: 2.0,
        speedMultiplier: 0.8,
      },
      abilities: ['fire_breath', 'tail_swipe', 'intimidate'],
      difficulty: 8,
    },
    statWeights: {
      hp: 1.2,
      damage: 1.0,
      defense: 0.9,
      speed: 0.7,
    },
    scenarioBudget: {
      maxStatPoints: 150,
      statPointCost: 1,
      minPointsPerStat: 15,
      maxPointsPerStat: 50,
      archetypeSlots: 6,
    },
    simulationParams: {
      iterations: 10000,
      seed: 54321,
      deterministic: false,
      verbose: true,
      exportResults: true,
      exportFormat: 'json',
    },
  } as ScenarioConfig,
  
  /** Group scenario */
  group: {
    id: 'group-combat',
    name: 'Group Combat',
    description: 'Multiple enemies scenario',
    targetTurns: 25,
    enemy: {
      type: 'group',
      name: 'Goblin Patrol',
      baseStats: {
        hp: 80,
        damage: 12,
        defense: 8,
        speed: 12,
      },
      modifiers: {
        damageMultiplier: 1.0,
        defenseMultiplier: 1.0,
        hpMultiplier: 1.0,
        speedMultiplier: 1.0,
      },
      abilities: ['pack_tactics', 'coordinated_attack'],
      difficulty: 5,
    },
    statWeights: {
      hp: 1.0,
      damage: 1.0,
      defense: 0.8,
      speed: 0.8,
    },
    scenarioBudget: {
      maxStatPoints: 120,
      statPointCost: 1,
      minPointsPerStat: 12,
      maxPointsPerStat: 45,
      archetypeSlots: 5,
    },
    simulationParams: {
      iterations: 10000,
      seed: 98765,
      deterministic: false,
      verbose: true,
      exportResults: true,
      exportFormat: 'json',
    },
  } as ScenarioConfig,
  
  /** Swarm scenario */
  swarm: {
    id: 'swarm-horde',
    name: 'Swarm Horde',
    description: 'Large number of weak enemies',
    targetTurns: 40,
    enemy: {
      type: 'sciame',
      name: 'Rat Swarm',
      baseStats: {
        hp: 20,
        damage: 5,
        defense: 2,
        speed: 15,
      },
      modifiers: {
        damageMultiplier: 0.8,
        defenseMultiplier: 0.5,
        hpMultiplier: 0.8,
        speedMultiplier: 1.5,
      },
      abilities: ['overwhelm', 'numbers_advantage'],
      difficulty: 6,
    },
    statWeights: {
      hp: 0.8,
      damage: 1.0,
      defense: 0.6,
      speed: 1.2,
    },
    scenarioBudget: {
      maxStatPoints: 80,
      statPointCost: 1,
      minPointsPerStat: 8,
      maxPointsPerStat: 35,
      archetypeSlots: 4,
    },
    simulationParams: {
      iterations: 10000,
      seed: 24680,
      deterministic: false,
      verbose: true,
      exportResults: true,
      exportFormat: 'json',
    },
  } as ScenarioConfig,
};

/**
 * Default configuration for scenario runner
 */
export const DEFAULT_SCENARIO_CONFIG = {
  outputDir: '/data/exports',
  defaultIterations: 10000,
  defaultSeed: Date.now(),
  defaultExportFormat: 'json' as const,
  enableVerboseLogging: true,
  enableProgressReporting: true,
};
