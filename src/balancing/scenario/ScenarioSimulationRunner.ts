import type { StatBlock } from '../types';
import { MonteCarloSimulation } from '../simulation/MonteCarloSimulation';
import type {
  CombatConfig,
  SimulationResults,
  RNG,
  EntityStats,
} from '../simulation/types';
import { getScenarioConfig } from '../expectedValue';
import type { ScenarioType, ScenarioConfig } from '../contextWeights';

export interface ScenarioMatchupConfig {
  scenarioType: ScenarioType;
  iterations: number;
  attacker: StatBlock;
  defender: StatBlock;
  attackerName?: string;
  defenderName?: string;
  logSampleSize?: number;
  rng?: RNG;
}

export interface ScenarioMatchupResult extends SimulationResults {
  scenarioType: ScenarioType;
}

function toEntityStats(stats: StatBlock, name: string): EntityStats {
  return {
    ...stats,
    name,
    hp: stats.hp,
    attack: stats.damage,
    defense: stats.armor,
  };
}

export interface ScenarioMatchupConfigWithOverride extends ScenarioMatchupConfig {
  scenarioOverride?: ScenarioConfig;
}

export function runScenarioMatchupWithOverride(
  config: ScenarioMatchupConfigWithOverride,
): ScenarioMatchupResult {
  const {
    scenarioType,
    iterations,
    attacker,
    defender,
    attackerName = 'Attacker',
    defenderName = 'Defender',
    logSampleSize,
    rng,
    scenarioOverride,
  } = config;

  const scenario = scenarioOverride ?? getScenarioConfig(scenarioType);

  const combatConfig: CombatConfig = {
    entity1: toEntityStats(attacker, attackerName),
    entity2: toEntityStats(defender, defenderName),
    turnLimit: scenario.expectedTurns,
  };

  const results: SimulationResults = MonteCarloSimulation.run({
    combat: combatConfig,
    iterations,
    logSampleSize,
    rng,
  });

  return {
    scenarioType,
    ...results,
  };
}

export function runScenarioMatchup(config: ScenarioMatchupConfig): ScenarioMatchupResult {
  const {
    scenarioType,
    iterations,
    attacker,
    defender,
    attackerName = 'Attacker',
    defenderName = 'Defender',
    logSampleSize,
    rng,
  } = config;

  const scenario = getScenarioConfig(scenarioType);

  const combatConfig: CombatConfig = {
    entity1: toEntityStats(attacker, attackerName),
    entity2: toEntityStats(defender, defenderName),
    turnLimit: scenario.expectedTurns,
  };

  const results: SimulationResults = MonteCarloSimulation.run({
    combat: combatConfig,
    iterations,
    logSampleSize,
    rng,
  });

  return {
    scenarioType,
    ...results,
  };
}
