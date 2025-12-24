import type { ArchetypeTemplate } from './types';
import { ArchetypeBuilder } from './ArchetypeBuilder';
import { MonteCarloSimulation } from '../simulation/MonteCarloSimulation';
import type { CombatConfig, SimulationResults, RNG } from '../simulation/types';
import type { Spell } from '../spellTypes';

/**
 * Configuration for running a matchup between two archetypes.
 */
export interface ArchetypeMatchupConfig {
  archetypeA: ArchetypeTemplate;
  archetypeB: ArchetypeTemplate;
  budget: number;
  iterations: number;
  turnLimit: number;
  spellsA?: Spell[];
  spellsB?: Spell[];
  logSampleSize?: number;
  rng?: RNG;
}

/**
 * Result of a matchup simulation between two archetypes.
 */
export interface ArchetypeMatchupResult extends SimulationResults {
  archetypeAId: string;
  archetypeBId: string;
  budget: number;
}

/**
 * Service for running matchup simulations between archetype templates.
 */
export class ArchetypeMatchupService {
  /**
   * Runs a matchup simulation between two archetypes.
   */
  static runMatchup(config: ArchetypeMatchupConfig): ArchetypeMatchupResult {
    const { archetypeA, archetypeB, budget, iterations, turnLimit, spellsA, spellsB, logSampleSize, rng } = config;

    const statBlockA = ArchetypeBuilder.buildArchetype(archetypeA, budget);
    const statBlockB = ArchetypeBuilder.buildArchetype(archetypeB, budget);

    const combatConfig: CombatConfig = {
      entity1: {
        name: archetypeA.name,
        ...statBlockA,
        hp: statBlockA.hp,
        attack: statBlockA.damage,
        defense: statBlockA.armor,
        spells: spellsA,
      },
      entity2: {
        name: archetypeB.name,
        ...statBlockB,
        hp: statBlockB.hp,
        attack: statBlockB.damage,
        defense: statBlockB.armor,
        spells: spellsB,
      },
      turnLimit,
    };

    const results: SimulationResults = MonteCarloSimulation.run({
      combat: combatConfig,
      iterations,
      logSampleSize,
      rng,
    });

    return {
      archetypeAId: archetypeA.id,
      archetypeBId: archetypeB.id,
      budget,
      ...results,
    };
  }
}
