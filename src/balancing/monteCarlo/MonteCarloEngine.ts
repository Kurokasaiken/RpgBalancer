/**
 * Monte Carlo Engine for Balancer Scenario Simulations
 * 
 * Core simulation engine that runs Monte Carlo simulations for different
 * scenario types (1v1, boss, group, swarm) with target turns evaluation.
 */

import { type ScenarioConfig, type ScenarioResult, type ArchetypeResult } from './ScenarioConfig';
import { type BalancerConfig } from '../config/types';
import { runSimulation } from '../core/SimulationEngine';
import { generateArchetypes } from '../archetype/ArchetypeGenerator';
import { calculateSynergies } from '../synergy/SynergyCalculator';

// Simple seeded random implementation
function seededRandom(seed: number): () => number {
  let currentSeed = seed;
  
  return function() {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
}

// Mock optimal weights for testing
const mockOptimalWeights: Record<string, number> = {
  'archetype-1': 1.2,
  'archetype-2': 0.8,
  'archetype-3': 1.0,
  'archetype-4': 0.9,
};

export interface SimulationContext {
  /** Scenario configuration */
  scenario: ScenarioConfig;
  /** Balancer configuration */
  balancerConfig: BalancerConfig;
  /** Random number generator */
  rng: (seed: number) => number;
  /** Current iteration */
  iteration: number;
  /** Verbose logging */
  verbose: boolean;
}

export interface SimulationRun {
  /** Run identifier */
  id: string;
  /** Archetype used */
  archetype: string;
  /** Result of the simulation */
  result: 'victory' | 'defeat' | 'timeout';
  /** Number of turns taken */
  turns: number;
  /** Damage dealt */
  damageDealt: number;
  /** Damage taken */
  damageTaken: number;
  /** HP remaining */
  hpRemaining: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Runs a Monte Carlo simulation for the given scenario
 */
export async function runMonteCarloSimulation(
  scenario: ScenarioConfig,
  balancerConfig: BalancerConfig,
  verbose: boolean = false
): Promise<ScenarioResult> {
  const startTime = Date.now();
  const rng = seededRandom(scenario.simulationParams.seed);
  
  if (verbose) {
    console.log(`🎯 Starting Monte Carlo simulation for ${scenario.name}`);
    console.log(`📊 Target turns: ${scenario.targetTurns}`);
    console.log(`🔄 Iterations: ${scenario.simulationParams.iterations}`);
    console.log(`🎲 Seed: ${scenario.simulationParams.seed}`);
  }

  // Generate archetypes for the scenario
  const archetypes = generateArchetypes(scenario, balancerConfig);
  
  if (verbose) {
    console.log(`👥 Generated ${archetypes.length} archetypes`);
  }

  // Run simulations
  const runs: SimulationRun[] = [];
  
  for (let i = 0; i < scenario.simulationParams.iterations; i++) {
    const rngInstance = seededRandom(scenario.simulationParams.seed + i);
    const run = await runSingleSimulation(scenario, archetypes, rngInstance, verbose);
    runs.push(run);
    
    // Progress reporting
    if (verbose && (i + 1) % 1000 === 0) {
      console.log(`📈 Progress: ${((i + 1) / scenario.simulationParams.iterations * 100).toFixed(1)}%`);
    }
  }

  // Calculate results
  const result = calculateScenarioResults(scenario, runs, archetypes);
  
  if (verbose) {
    console.log(`✅ Simulation completed in ${Date.now() - startTime}ms`);
    console.log(`📊 Win rate: ${(result.winRate * 100).toFixed(2)}%`);
    console.log(`🎯 Avg turns to victory: ${result.avgTurnsToVictory.toFixed(2)}`);
    console.log(`🎯 Avg turns to defeat: ${result.avgTurnsToDefeat.toFixed(2)}`);
  }

  return result;
}

/**
 * Runs a single simulation iteration
 */
async function runSingleSimulation(
  scenario: ScenarioConfig,
  archetypes: string[],
  rng: () => number,
  _verbose: boolean
): Promise<SimulationRun> {
  // Select random archetype
  const archetypeIndex = Math.floor(rng() * archetypes.length);
  const archetype = archetypes[archetypeIndex];
  
  // Configure simulation based on scenario type
  const simulationConfig = configureSimulation(scenario, archetype, rng);
  
  // Run the simulation
  const simulationResult = await runSimulation(simulationConfig);
  
  // Determine result based on target turns
  let result: 'victory' | 'defeat' | 'timeout';
  
  if (simulationResult.turns <= scenario.targetTurns) {
    result = simulationResult.playerWon ? 'victory' : 'defeat';
  } else {
    result = simulationResult.playerWon ? 'timeout' : 'defeat';
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    archetype,
    result,
    turns: simulationResult.turns,
    damageDealt: simulationResult.playerDamageDealt,
    damageTaken: simulationResult.playerDamageTaken,
    hpRemaining: simulationResult.playerHpRemaining,
    timestamp: Date.now(),
  };
}

/**
 * Configures simulation parameters based on scenario type
 */
function configureSimulation(
  scenario: ScenarioConfig,
  archetype: string,
  rng: () => number
): any {
  const baseConfig = {
    archetype,
    enemy: scenario.enemy,
    seed: Math.floor(rng() * 1000000),
    maxTurns: scenario.targetTurns * 2, // Allow double time for timeout detection
    verbose: false,
  };

  // Adjust configuration based on enemy type
  switch (scenario.enemy.type) {
    case 'boss':
      return {
        ...baseConfig,
        enemyCount: 1,
        enemyScaling: 1.5,
        specialAbilities: scenario.enemy.abilities || [],
      };
      
    case 'group':
      return {
        ...baseConfig,
        enemyCount: 3 + Math.floor(rng() * 2), // 3-4 enemies
        enemyScaling: 0.8,
        coordinationBonus: 0.2,
      };
      
    case 'sciame':
      return {
        ...baseConfig,
        enemyCount: 5 + Math.floor(rng() * 5), // 5-9 enemies
        enemyScaling: 0.4,
        swarmBonus: 0.3,
        overwhelmChance: 0.1,
      };
      
    case '1v1':
    default:
      return {
        ...baseConfig,
        enemyCount: 1,
        enemyScaling: 1.0,
      };
  }
}

/**
 * Calculates comprehensive scenario results from simulation runs
 */
function calculateScenarioResults(
  scenario: ScenarioConfig,
  runs: SimulationRun[],
  archetypes: string[]
): ScenarioResult {
  // Basic statistics
  const victories = runs.filter(r => r.result === 'victory').length;
  const defeats = runs.filter(r => r.result === 'defeat').length;
  const timeouts = runs.filter(r => r.result === 'timeout').length;
  
  const winRate = victories / runs.length;
  
  // Turn statistics
  const victoryTurns = runs.filter(r => r.result === 'victory').map(r => r.turns);
  const defeatTurns = runs.filter(r => r.result === 'defeat').map(r => r.turns);
  
  const avgTurnsToVictory = victoryTurns.length > 0 
    ? victoryTurns.reduce((sum, turns) => sum + turns, 0) / victoryTurns.length 
    : 0;
    
  const avgTurnsToDefeat = defeatTurns.length > 0 
    ? defeatTurns.reduce((sum, turns) => sum + turns, 0) / defeatTurns.length 
    : 0;
  
  // Calculate standard deviation
  const allTurns = runs.map(r => r.turns);
  const meanTurns = allTurns.reduce((sum, turns) => sum + turns, 0) / allTurns.length;
  const variance = allTurns.reduce((sum, turns) => sum + Math.pow(turns - meanTurns, 2), 0) / allTurns.length;
  const turnsStdDev = Math.sqrt(variance);
  
  // Damage and HP statistics
  const avgDamageDealt = runs.reduce((sum, r) => sum + r.damageDealt, 0) / runs.length;
  const avgDamageTaken = runs.reduce((sum, r) => sum + r.damageTaken, 0) / runs.length;
  const avgHpRemaining = runs.reduce((sum, r) => sum + r.hpRemaining, 0) / runs.length;
  
  // Calculate archetype performance
  const archetypePerformance = calculateArchetypePerformance(runs, archetypes);
  
  // Calculate synergies
  const synergyAnalysis = calculateSynergies(archetypePerformance, scenario.statWeights);
  
  return {
    scenarioId: scenario.id,
    timestamp: Date.now(),
    iterations: runs.length,
    winRate,
    avgTurnsToVictory,
    avgTurnsToDefeat,
    turnsStdDev,
    statistics: {
      victories,
      defeats,
      timeouts,
      avgDamageDealt,
      avgDamageTaken,
      avgHpRemaining,
    },
    archetypePerformance,
    synergyAnalysis,
  };
}

/**
 * Calculates performance metrics for each archetype
 */
function calculateArchetypePerformance(
  runs: SimulationRun[],
  archetypes: string[]
): Record<string, ArchetypeResult> {
  const performance: Record<string, ArchetypeResult> = {};
  
  archetypes.forEach(archetype => {
    const archetypeRuns = runs.filter(r => r.archetype === archetype);
    
    if (archetypeRuns.length === 0) {
      performance[archetype] = {
        archetype,
        winRate: 0,
        avgTurns: 0,
        stdDev: 0,
        rating: 'Poor',
      };
      return;
    }
    
    const victories = archetypeRuns.filter(r => r.result === 'victory').length;
    const winRate = victories / archetypeRuns.length;
    
    const turns = archetypeRuns.map(r => r.turns);
    const avgTurns = turns.reduce((sum, t) => sum + t, 0) / turns.length;
    
    const meanTurns = avgTurns;
    const variance = turns.reduce((sum, t) => sum + Math.pow(t - meanTurns, 2), 0) / turns.length;
    const stdDev = Math.sqrt(variance);
    
    // Determine rating based on win rate
    let rating: ArchetypeResult['rating'];
    if (winRate >= 0.8) rating = 'OP';
    else if (winRate >= 0.65) rating = 'Good';
    else if (winRate >= 0.5) rating = 'Average';
    else if (winRate >= 0.35) rating = 'Weak';
    else rating = 'Poor';
    
    performance[archetype] = {
      archetypeId: archetype,
      winRate,
      avgTurns,
      stdDev,
      rating,
      optimalWeight: mockOptimalWeights[archetype] || 0,
    };
  });
  
  return performance;
}

/**
 * Validates scenario configuration
 */
export function validateScenario(scenario: ScenarioConfig): string[] {
  const errors: string[] = [];
  
  if (!scenario.id || scenario.id.trim() === '') {
    errors.push('Scenario ID is required');
  }
  
  if (!scenario.name || scenario.name.trim() === '') {
    errors.push('Scenario name is required');
  }
  
  if (scenario.targetTurns <= 0) {
    errors.push('Target turns must be positive');
  }
  
  if (scenario.simulationParams.iterations <= 0) {
    errors.push('Iterations must be positive');
  }
  
  if (!scenario.enemy || !scenario.enemy.type) {
    errors.push('Enemy configuration is required');
  }
  
  if (!scenario.statWeights || Object.keys(scenario.statWeights).length === 0) {
    errors.push('Stat weights are required');
  }
  
  if (!scenario.scenarioBudget || scenario.scenarioBudget.maxStatPoints <= 0) {
    errors.push('Valid scenario budget is required');
  }
  
  return errors;
}

/**
 * Creates a scenario from template with custom overrides
 */
export function createScenarioFromTemplate(
  templateId: keyof typeof SCENARIO_TEMPLATES,
  overrides: Partial<ScenarioConfig>
): ScenarioConfig {
  const template = SCENARIO_TEMPLATES[templateId];
  
  if (!template) {
    throw new Error(`Template '${templateId}' not found`);
  }
  
  const scenario = {
    ...template,
    ...overrides,
    simulationParams: {
      ...template.simulationParams,
      ...(overrides.simulationParams || {}),
    },
    enemy: {
      ...template.enemy,
      ...(overrides.enemy || {}),
      modifiers: {
        ...template.enemy.modifiers,
        ...(overrides.enemy?.modifiers || {}),
      },
    },
    scenarioBudget: {
      ...template.scenarioBudget,
      ...(overrides.scenarioBudget || {}),
    },
  };
  
  const errors = validateScenario(scenario);
  if (errors.length > 0) {
    throw new Error(`Invalid scenario: ${errors.join(', ')}`);
  }
  
  return scenario;
}
