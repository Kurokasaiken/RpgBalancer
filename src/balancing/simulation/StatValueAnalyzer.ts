import { mean, standardDeviation } from 'simple-statistics';
import { MonteCarloSimulation } from './MonteCarloSimulation';
import { BASELINE_STATS } from '../baseline';
import type { StatBlock } from '../types';

export interface CalibrationResult {
    stat: string;
    weight: number;
    confidence: number; // 0.0 to 1.0
    linearity: number; // 0.0 to 1.0
    sampleSize: number;
    timestamp: string;
}

/**
 * Stat Value Analyzer - Auto-Calibration System
 * 
 * Uses binary search and Monte Carlo simulations to determine the
 * exact HP value of any stat.
 * 
 * Methodology:
 * 1. Create a "Challenger" entity with +X of a stat
 * 2. Use Binary Search to find how much HP the "Baseline" needs to achieve 50% win rate
 * 3. Calculate Weight = HP_Delta / Stat_Delta
 */
export class StatValueAnalyzer {
    /**
     * Calibrate a single stat
     * 
     * @param stat The stat key to calibrate (e.g., 'damage', 'armor')
     * @param increment The amount of stat to add for testing (default: 10)
     * @param iterations Number of simulations per step (default: 5000)
     */
    static calibrateStat(
        stat: keyof StatBlock,
        increment: number = 10,
        iterations: number = 5000
    ): CalibrationResult {
        console.log(`🔬 Calibrating ${stat} (+${increment})...`);

        // Run multiple calibration passes to ensure stability
        const weights: number[] = [];
        const numPasses = 5;

        for (let i = 0; i < numPasses; i++) {
            const weight = this.runSingleCalibration(stat, increment, iterations);
            weights.push(weight);
        }

        const avgWeight = mean(weights);
        const stdDev = standardDeviation(weights);

        // Confidence based on standard deviation (lower is better)
        // If stdDev is < 5% of weight, confidence is high
        const relativeStdDev = stdDev / (avgWeight || 1); // Avoid div by zero
        const confidence = Math.max(0, 1.0 - (relativeStdDev * 10)); // Heuristic

        // Linearity check (simplified: check if weight holds at 2x increment)
        const weightAt2x = this.runSingleCalibration(stat, increment * 2, iterations);
        const linearity = 1.0 - Math.min(1, Math.abs(avgWeight - weightAt2x) / (avgWeight || 1));

        return {
            stat,
            weight: Number(avgWeight.toFixed(2)),
            confidence: Number(confidence.toFixed(2)),
            linearity: Number(linearity.toFixed(2)),
            sampleSize: iterations * numPasses,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Run a single calibration pass using Binary Search
     */
    private static runSingleCalibration(
        stat: keyof StatBlock,
        increment: number,
        iterations: number
    ): number {
        // 1. Setup Challenger
        const challenger = {
            ...BASELINE_STATS,
            name: 'Challenger',
            [stat]: (BASELINE_STATS[stat] as number) + increment
        };

        // 2. Binary Search for Equilibrium HP
        // Range: Baseline HP to Baseline HP + (Increment * Estimated_Max_Weight)
        // Assume max weight is 20 HP per point for safety
        let low = BASELINE_STATS.hp;
        let high = BASELINE_STATS.hp + (increment * 20);

        // Optimization: Narrow search if we have a guess (could add later)

        while (high - low > 1) {
            const mid = Math.floor((low + high) / 2);

            // Defender has adjusted HP
            const defender = {
                ...BASELINE_STATS,
                name: 'Baseline',
                hp: mid
            };

            const result = MonteCarloSimulation.run({
                combat: {
                    entity1: defender as any,
                    entity2: challenger as any,
                    turnLimit: 100
                },
                iterations: iterations // Use passed iterations
            });

            const winRate = result.summary.winRates.entity1;

            if (winRate < 0.48) {
                // Defender losing -> Needs more HP
                low = mid;
            } else if (winRate > 0.52) {
                // Defender winning -> Needs less HP
                high = mid;
            } else {
                // Close enough!
                low = mid;
                high = mid;
                break;
            }
        }

        const equilibriumHP = Math.floor((low + high) / 2);
        const hpDelta = equilibriumHP - BASELINE_STATS.hp;

        // Weight = HP / Stat
        return hpDelta / increment;
    }
}
