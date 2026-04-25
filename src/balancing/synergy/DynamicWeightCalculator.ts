import { DEFAULT_STATS, type StatBlock } from '../types';
import { EHPCalculator } from '../ehp/EHPCalculator';

export interface StatWeightResult {
    stat: keyof StatBlock;
    baseWeight: number;
    dynamicWeight: number;
    synergyBonus: number; // percent
}

export class DynamicWeightCalculator {
    private ehpCalc: EHPCalculator;

    constructor(baseline: StatBlock = DEFAULT_STATS) {
        // baseline currently unused: reserved for future Monte Carlo wiring
        void baseline;
        this.ehpCalc = new EHPCalculator();
    }

    /**
     * Calculate the dynamic value of all stats for a given build
     * NOW USING EHP-BASED ANALYTICAL CALCULATION (MUCH FASTER!)
     * @param currentStats The current stat block of the entity
     * @param baseWeights The theoretical base weights (HP per point) - used for synergy comparison
     */
    async calculateWeights(
        currentStats: StatBlock,
        baseWeights: Record<string, number>
    ): Promise<StatWeightResult[]> {
        const results: StatWeightResult[] = [];
        const statsToCheck = Object.keys(baseWeights) as Array<keyof StatBlock>;

        for (const stat of statsToCheck) {
            // Use EHP Calculator for defensive stats
            if (this.isDefensiveStat(stat)) {
                const dynamicWeight = this.ehpCalc.calculateMarginalEHPValue(currentStats, stat);
                const baseWeight = baseWeights[stat] || 0;
                const safeBase = baseWeight === 0 ? 1 : baseWeight;
                const synergyBonus = ((dynamicWeight - baseWeight) / safeBase) * 100;

                results.push({
                    stat,
                    baseWeight,
                    dynamicWeight,
                    synergyBonus
                });
            } else {
                // Offensive/utility stats Monte Carlo branch is not wired yet.
                // Skip these stats for now to keep the module type-safe.
                continue;
            }
        }

        return results.sort((a, b) => b.dynamicWeight - a.dynamicWeight);
    }

    private isDefensiveStat(stat: keyof StatBlock): boolean {
        return ['hp', 'armor', 'resistance', 'evasion', 'ward', 'block'].includes(stat as string);
    }
}
