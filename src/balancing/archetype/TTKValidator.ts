import { TTKResult, TTKTarget, TTKValidation } from './types';

export class TTKValidator {

    /**
     * Validate a single result vs target
     */
    public static validate(result: TTKResult, target: TTKTarget): TTKValidation {
        const warnings: string[] = [];
        const errors: string[] = [];

        // 1. Validate Rounds
        const avgRounds = result.roundsToKill.avg;
        const roundsDeviation = avgRounds - target.targetRounds;
        const roundsDeviationPercent = (roundsDeviation / target.targetRounds) * 100;

        let roundsValid = true;
        if (avgRounds < target.minRounds) {
            roundsValid = false;
            errors.push(`Rounds too low: ${avgRounds.toFixed(1)} < ${target.minRounds}`);
        } else if (avgRounds > target.maxRounds) {
            roundsValid = false;
            errors.push(`Rounds too high: ${avgRounds.toFixed(1)} > ${target.maxRounds}`);
        } else if (Math.abs(roundsDeviation) > target.tolerance) {
            // Within min/max but outside tolerance preference
            warnings.push(`Rounds deviation: ${roundsDeviation.toFixed(1)} (Tolerance: ±${target.tolerance})`);
        }

        // 2. Validate Winner
        let winnerMismatch = false;
        if (target.expectedWinner !== 'Either') {
            const actualWinner = result.winRate.A > result.winRate.B ? 'A' : 'B';
            const winRate = result.winRate[actualWinner];

            // If win rate is close to 50%, it's a draw/either
            const isDraw = Math.abs(result.winRate.A - 0.5) < 0.1; // 40-60% split

            if (target.expectedWinner === 'A' && (actualWinner !== 'A' || isDraw)) {
                winnerMismatch = true;
                errors.push(`Wrong winner: Expected A, got ${isDraw ? 'Draw' : 'B'} (${(result.winRate.B * 100).toFixed(0)}%)`);
            } else if (target.expectedWinner === 'B' && (actualWinner !== 'B' || isDraw)) {
                winnerMismatch = true;
                errors.push(`Wrong winner: Expected B, got ${isDraw ? 'Draw' : 'A'} (${(result.winRate.A * 100).toFixed(0)}%)`);
            }
        }

        const isValid = roundsValid && !winnerMismatch;

        return {
            result,
            target,
            isValid,
            deviations: {
                roundsDeviation,
                roundsDeviationPercent,
                winnerMismatch
            },
            roundsDeviation,
            roundsDeviationPercent,
            winnerMismatch,
            warnings,
            errors
        };
    }

    /**
     * Batch validate all results
     */
    public static validateAll(
        results: TTKResult[],
        targets: TTKTarget[]
    ): TTKValidation[] {
        const validations: TTKValidation[] = [];

        for (const result of results) {
            // Find matching target
            const target = targets.find(t =>
                t.matchup.archetypeA === result.matchup.archetypeA &&
                t.matchup.archetypeB === result.matchup.archetypeB &&
                t.budget === result.budget
            );

            if (target) {
                validations.push(this.validate(result, target));
            } else {
                // No target found - could log warning or skip
                // For now, we skip
            }
        }

        return validations;
    }
}
