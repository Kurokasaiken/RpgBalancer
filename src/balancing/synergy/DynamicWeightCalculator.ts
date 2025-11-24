import { DEFAULT_STATS, type StatBlock } from '../types';
import { SynergyAnalyzer } from './index';
import { EHPCalculator } from '../ehp/EHPCalculator';

export interface StatWeightResult {
    stat: keyof StatBlock;
    baseWeight: number;
    dynamicWeight: number;
    synergyBonus: number; // percent
}

export class DynamicWeightCalculator {
    private analyzer: SynergyAnalyzer;
    private ehpCalc: EHPCalculator;

    constructor(baseline: StatBlock = DEFAULT_STATS) {
        this.analyzer = new SynergyAnalyzer(baseline);
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
                // For offensive/utility stats, fall back to Monte Carlo
                const delta = this.getDeltaForStat(stat);
                if (delta === 0) continue;

                const currentPower = await this.analyzer.findHPEquivalent(currentStats);

                const modifiedStats = { ...currentStats };
                if (typeof modifiedStats[stat] === 'number') {
                    (modifiedStats as unknown as Record<string, number>)[stat] = (modifiedStats[stat] as number) + delta;
                }

                const newPower = await this.analyzer.findHPEquivalent(modifiedStats);
                const valueOfDelta = newPower - currentPower;
                const dynamicWeight = valueOfDelta / delta;
                const baseWeight = baseWeights[stat] || 0;
                const safeBase = baseWeight === 0 ? 1 : baseWeight;
                const synergyBonus = ((dynamicWeight - baseWeight) / safeBase) * 100;

                results.push({
                    stat,
                    baseWeight,
                    dynamicWeight,
                    synergyBonus
                });
            }
        }

        return results.sort((a, b) => b.dynamicWeight - a.dynamicWeight);
    }

    private isDefensiveStat(stat: keyof StatBlock): boolean {
        return ['hp', 'armor', 'resistance', 'evasion', 'ward', 'block'].includes(stat as string);
    }

    private getDeltaForStat(stat: string): number {
        // Use a reasonable delta to get a stable signal
        switch (stat) {
            case 'hp': return 50;
            case 'damage': return 5;
            case 'armor': return 5;
            case 'resistance': return 5;
            case 'penetration': return 5;
            case 'blockChance': return 5;
            case 'critChance': return 5;
            case 'critMultiplier': return 0.2; // 20%
            case 'lifesteal': return 5;
            case 'regen': return 5;
            case 'dodge': return 5;
            case 'attacksPerKo': return 0.5;
            default: return 0;
        }
    }
}
