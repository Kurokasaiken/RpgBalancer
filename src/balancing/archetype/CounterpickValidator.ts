import type { ArchetypeTemplate, BalanceConfiguration } from './types';
import { ArchetypeMatchupService } from './ArchetypeMatchupService';

export type CounterRelation = 'Strong' | 'Weak' | 'Even';

export interface CounterMatrixValidationOptions {
  archetypes: ArchetypeTemplate[];
  balanceConfig: BalanceConfiguration;
  iterations?: number;
  budgetTierName?: string;
}

export interface CounterpickValidationResult {
  attackerId: string;
  defenderId: string;
  relation: CounterRelation;
  budget: number;
  iterations: number;
  expectedRange: [number, number];
  actualWinRate: number;
  passed: boolean;
}

export class CounterpickValidator {
  static validate(options: CounterMatrixValidationOptions): CounterpickValidationResult[] {
    const { archetypes, balanceConfig } = options;
    const iterations = options.iterations ?? 2000;

    const tiers = balanceConfig.budgetTiers;
    if (!tiers || tiers.length === 0) {
      return [];
    }

    const tier = options.budgetTierName
      ? tiers.find(t => t.name === options.budgetTierName) ?? tiers[tiers.length - 1]
      : tiers[tiers.length - 1];

    const budget = tier.points;
    const tolerancePercent = balanceConfig.winRateTolerance ?? 10;
    const tolerance = tolerancePercent / 100;
    const turnLimit = balanceConfig.maxSimulationRounds ?? 100;

    const results: CounterpickValidationResult[] = [];
    const matrix = balanceConfig.counterMatrix;

    if (!matrix) {
      return results;
    }

    for (const attackerId of Object.keys(matrix)) {
      const attacker = archetypes.find(a => a.id === attackerId);
      if (!attacker) continue;

      const defenders = matrix[attackerId];

      for (const defenderId of Object.keys(defenders)) {
        const defender = archetypes.find(a => a.id === defenderId);
        if (!defender) continue;

        const relation = defenders[defenderId];

        let expectedMin = 0;
        let expectedMax = 1;

        if (relation === 'Strong') {
          expectedMin = 0.5 + tolerance;
          expectedMax = 1;
        } else if (relation === 'Weak') {
          expectedMin = 0;
          expectedMax = 0.5 - tolerance;
        } else {
          expectedMin = 0.5 - tolerance;
          expectedMax = 0.5 + tolerance;
        }

        if (expectedMin < 0) expectedMin = 0;
        if (expectedMax > 1) expectedMax = 1;

        const matchup = ArchetypeMatchupService.runMatchup({
          archetypeA: attacker,
          archetypeB: defender,
          budget,
          iterations,
          turnLimit,
        });

        const winRate = matchup.summary.winRates.entity1;
        const passed = winRate >= expectedMin && winRate <= expectedMax;

        results.push({
          attackerId,
          defenderId,
          relation,
          budget,
          iterations,
          expectedRange: [expectedMin, expectedMax],
          actualWinRate: winRate,
          passed,
        });
      }
    }

    return results;
  }
}
