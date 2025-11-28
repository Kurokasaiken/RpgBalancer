import { mean, median, min, max } from 'simple-statistics';
import { CombatSimulator } from './CombatSimulator';
import type { SimulationConfig, SimulationResults, CombatResult } from './types';

/**
 * Monte Carlo Simulation - Batch Combat Runner
 * 
 * Runs thousands of combat simulations and aggregates statistical results.
 * Used for balancing validation and stat value equivalency analysis.
 * 
 * Based on industry best practices:
 * - 10,000 iterations for robust results
 * - 95% confidence intervals
 * - Histogram distributions for outlier detection
 */
export class MonteCarloSimulation {
    /**
     * Run batch simulation with statistical analysis
     * 
     * @param config Simulation configuration (combat setup, iteration count)
     * @param onProgress Optional callback for progress updates (0.0 to 1.0)
     * @returns Comprehensive simulation results with statistics
     */
    static run(
        config: SimulationConfig,
        onProgress?: (progress: number) => void
    ): SimulationResults {
        const { combat, iterations, logSampleSize = 10 } = config;
        const results: CombatResult[] = [];

        // Track turn counts for distribution
        const turnCounts: number[] = [];

        // Track wins
        let wins1 = 0;
        let wins2 = 0;
        let draws = 0;

        // Track damage metrics
        const damage1Array: number[] = [];
        const damage2Array: number[] = [];
        const dpt1Array: number[] = []; // Damage Per Turn
        const dpt2Array: number[] = [];

        // Track overkill
        const overkill1Array: number[] = [];
        const overkill2Array: number[] = [];

        // Track HP efficiency (damage dealt vs HP lost)
        const efficiency1Array: number[] = [];
        const efficiency2Array: number[] = [];

        // Run simulations
        for (let i = 0; i < iterations; i++) {
            // Optional: enable detailed logging for sample combats
            const enableLogging = i < logSampleSize;
            const combatConfig = { ...combat, enableDetailedLogging: enableLogging };

            const result = CombatSimulator.simulate(combatConfig);

            // Store sample combats
            if (enableLogging) {
                results.push(result);
            }

            // Count wins
            if (result.winner === 'entity1') wins1++;
            else if (result.winner === 'entity2') wins2++;
            else draws++;

            // Track turns
            turnCounts.push(result.turns);

            // Track damage
            damage1Array.push(result.damageDealt.entity1);
            damage2Array.push(result.damageDealt.entity2);

            // Calculate DPT (Damage Per Turn)
            dpt1Array.push(result.damageDealt.entity1 / result.turns);
            dpt2Array.push(result.damageDealt.entity2 / result.turns);

            // Track overkill
            overkill1Array.push(result.overkill.entity1);
            overkill2Array.push(result.overkill.entity2);

            // Calculate HP efficiency (damage dealt / HP lost)
            const hpLost1 = combat.entity1.hp - result.hpRemaining.entity1;
            const hpLost2 = combat.entity2.hp - result.hpRemaining.entity2;
            efficiency1Array.push(hpLost1 > 0 ? result.damageDealt.entity1 / hpLost1 : 0);
            efficiency2Array.push(hpLost2 > 0 ? result.damageDealt.entity2 / hpLost2 : 0);

            // Report progress
            if (onProgress && (i + 1) % 1000 === 0) {
                onProgress((i + 1) / iterations);
            }
        }

        // Calculate statistics
        const winRate1 = wins1 / iterations;
        const winRate2 = wins2 / iterations;
        const drawRate = draws / iterations;

        // Calculate 95% confidence intervals
        const ci1 = this.calculate95CI(winRate1, iterations);
        const ci2 = this.calculate95CI(winRate2, iterations);

        // Calculate turn distribution histogram
        const turnDistribution: Record<number, number> = {};
        turnCounts.forEach(turns => {
            turnDistribution[turns] = (turnDistribution[turns] || 0) + 1;
        });

        return {
            summary: {
                totalSimulations: iterations,
                winRates: {
                    entity1: winRate1,
                    entity2: winRate2,
                    draws: drawRate,
                },
                confidenceIntervals: {
                    entity1: ci1,
                    entity2: ci2,
                },
            },

            combatStatistics: {
                averageTurns: mean(turnCounts),
                medianTurns: median(turnCounts),
                minTurns: min(turnCounts),
                maxTurns: max(turnCounts),
                turnDistribution,
            },

            damageMetrics: {
                entity1: {
                    average: mean(dpt1Array),
                    median: median(dpt1Array),
                    min: min(dpt1Array),
                    max: max(dpt1Array),
                },
                entity2: {
                    average: mean(dpt2Array),
                    median: median(dpt2Array),
                    min: min(dpt2Array),
                    max: max(dpt2Array),
                },
                averageOverkill: {
                    entity1: mean(overkill1Array),
                    entity2: mean(overkill2Array),
                },
            },

            hpEfficiency: {
                entity1: mean(efficiency1Array),
                entity2: mean(efficiency2Array),
            },

            sampleCombats: results,
        };
    }

    /**
     * Calculate 95% confidence interval for a proportion
     * 
     * Formula: p̂ ± z × √(p̂(1-p̂)/n)
     * Where z = 1.96 for 95% CI
     * 
     * @param proportion Win rate (0.0 to 1.0)
     * @param n Number of trials
     * @returns [lower bound, upper bound]
     */
    private static calculate95CI(proportion: number, n: number): [number, number] {
        const z = 1.96; // 95% confidence level
        const standardError = Math.sqrt((proportion * (1 - proportion)) / n);
        const marginOfError = z * standardError;

        return [
            Math.max(0, proportion - marginOfError),
            Math.min(1, proportion + marginOfError),
        ];
    }
}
