/**
 * Archetype Generator for Balancer Monte Carlo Simulations
 * 
 * Generates archetypes based on scenario configuration and stat weights.
 */

import type { ScenarioConfig } from '../monteCarlo/ScenarioConfig';
import type { BalancerConfig } from '../config/types';

/**
 * Generates archetypes for the given scenario
 */
export function generateArchetypes(
  scenario: ScenarioConfig,
  balancerConfig: BalancerConfig
): string[] {
  const archetypes: string[] = [];
  
  // Generate archetypes based on scenario budget
  const maxArchetypes = scenario.scenarioBudget.archetypeSlots;
  
  for (let i = 0; i < maxArchetypes; i++) {
    const archetypeId = `archetype-${i + 1}`;
    archetypes.push(archetypeId);
  }
  
  return archetypes;
}

/**
 * Creates a mock archetype configuration
 */
export function createArchetypeConfig(
  archetypeId: string,
  scenario: ScenarioConfig
): any {
  // Simple mock configuration for now
  return {
    id: archetypeId,
    name: `Archetype ${archetypeId}`,
    stats: scenario.statWeights,
    budget: scenario.scenarioBudget,
  };
}
