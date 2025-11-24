import { StatBlock, DEFAULT_STATS } from '../types';
import { DynamicWeightCalculator, StatWeightResult } from './DynamicWeightCalculator';
import { STAT_WEIGHTS } from '../statWeights';

export interface Suggestion {
    stat: keyof StatBlock;
    reason: string;
    score: number; // The dynamic weight (HP value per point)
    synergyBonus: number;
}

export class SuggestionEngine {
    private calculator: DynamicWeightCalculator;

    constructor(baseline: StatBlock = DEFAULT_STATS) {
        this.calculator = new DynamicWeightCalculator(baseline);
    }

    /**
     * Get top suggestions for improving the current build
     */
    async getSuggestions(currentStats: StatBlock, count: number = 3): Promise<Suggestion[]> {
        // 1. Calculate dynamic weights for all stats
        const baseWeights: Record<string, number> = {};
        Object.entries(STAT_WEIGHTS).forEach(([key, val]) => {
            baseWeights[key] = val;
        });

        const weights = await this.calculator.calculateWeights(currentStats, baseWeights);

        // 2. Filter and sort
        // We want stats that have high value relative to their base cost
        // DynamicWeightCalculator returns 'dynamicWeight' which is HP Value per point.
        // We should recommend stats with the highest dynamic weight.

        const suggestions: Suggestion[] = weights
            .sort((a, b) => b.dynamicWeight - a.dynamicWeight)
            .slice(0, count)
            .map(w => ({
                stat: w.stat,
                score: w.dynamicWeight,
                synergyBonus: w.synergyBonus,
                reason: this.generateReason(w)
            }));

        return suggestions;
    }

    private generateReason(weight: StatWeightResult): string {
        if (weight.synergyBonus > 50) {
            return `🔥 Incredible Synergy! (+${weight.synergyBonus.toFixed(0)}% value)`;
        }
        if (weight.synergyBonus > 20) {
            return `✨ Great Synergy (+${weight.synergyBonus.toFixed(0)}% value)`;
        }
        if (weight.synergyBonus > 0) {
            return `Good value (+${weight.synergyBonus.toFixed(0)}% synergy)`;
        }
        if (weight.synergyBonus < -20) {
            return `⚠️ Diminishing Returns (${weight.synergyBonus.toFixed(0)}% value)`;
        }
        return 'Solid base stats';
    }
}
