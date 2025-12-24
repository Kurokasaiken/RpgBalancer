import type { StatBlock } from './types';
import { calculateItemPower } from './statWeights';
import {
  SCENARIO_CONFIGS,
  type ScenarioType,
  type ScenarioStatKey,
  type ScenarioConfig,
} from './contextWeights';

export type NumericStatMap = Partial<Record<string, number>>;

/**
 * Retrieves the configuration for a specific scenario type.
 */
export function getScenarioConfig(scenarioType: ScenarioType): ScenarioConfig {
  return SCENARIO_CONFIGS[scenarioType];
}

/**
 * Applies scenario-specific stat multipliers to a stat map.
 */
export function applyScenarioMultipliers(
  stats: NumericStatMap,
  scenarioType: ScenarioType,
): NumericStatMap {
  const scenario = SCENARIO_CONFIGS[scenarioType];
  const result: NumericStatMap = {};

  for (const [key, value] of Object.entries(stats)) {
    if (typeof value !== 'number') continue;
    const multiplier = scenario.statEffectiveness[key as ScenarioStatKey] ?? 1;
    result[key] = value * multiplier;
  }

  return result;
}

/**
 * Applies scenario-specific stat multipliers using a provided config.
 */
export function applyScenarioMultipliersWithConfig(
  stats: NumericStatMap,
  scenario: ScenarioConfig,
): NumericStatMap {
  const result: NumericStatMap = {};

  for (const [key, value] of Object.entries(stats)) {
    if (typeof value !== 'number') continue;
    const multiplier = scenario.statEffectiveness[key as ScenarioStatKey] ?? 1;
    result[key] = value * multiplier;
  }

  return result;
}

/**
 * Calculates item power for a stat map adjusted by a scenario config.
 */
export function calculateScenarioItemPowerWithConfig(
  stats: NumericStatMap,
  scenario: ScenarioConfig,
): number {
  const adjustedStats = applyScenarioMultipliersWithConfig(stats, scenario);
  return calculateItemPower(adjustedStats);
}

/**
 * Calculates power map across scenarios for a stat block using provided configs.
 */
export function getScenarioPowerMapForStatBlockWithConfigs(
  stats: StatBlock,
  configs: Record<ScenarioType, ScenarioConfig>,
): Record<ScenarioType, number> {
  const numericStats: NumericStatMap = {};

  (Object.keys(stats) as Array<keyof StatBlock>).forEach((key) => {
    const value = stats[key];
    if (typeof value === 'number') {
      numericStats[key as string] = value;
    }
  });

  const result: Record<ScenarioType, number> = {} as Record<ScenarioType, number>;

  (Object.entries(configs) as Array<[ScenarioType, ScenarioConfig]>).forEach(
    ([type, scenario]) => {
      result[type] = calculateScenarioItemPowerWithConfig(numericStats, scenario);
    },
  );

  return result;
}

/**
 * Calculates item power for a stat map in a specific scenario.
 */
export function calculateScenarioItemPower(
  stats: NumericStatMap,
  scenarioType: ScenarioType,
): number {
  const adjustedStats = applyScenarioMultipliers(stats, scenarioType);
  return calculateItemPower(adjustedStats);
}

/**
 * Calculates scenario power for a full stat block in a specific scenario.
 */
export function calculateScenarioPowerForStatBlock(
  stats: StatBlock,
  scenarioType: ScenarioType,
): number {
  const numericStats: NumericStatMap = {};

  (Object.keys(stats) as Array<keyof StatBlock>).forEach((key) => {
    const value = stats[key];
    if (typeof value === 'number') {
      numericStats[key as string] = value;
    }
  });

  return calculateScenarioItemPower(numericStats, scenarioType);
}

/**
 * Calculates power map across all scenarios for a stat block.
 */
export function getScenarioPowerMapForStatBlock(
  stats: StatBlock,
): Record<ScenarioType, number> {
  const result: Record<ScenarioType, number> = {} as Record<ScenarioType, number>;

  (Object.keys(SCENARIO_CONFIGS) as ScenarioType[]).forEach((scenarioType) => {
    result[scenarioType] = calculateScenarioPowerForStatBlock(stats, scenarioType);
  });

  return result;
}
