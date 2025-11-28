import { TTKValidator } from '../TTKValidator';
import { TTKResult, TTKTarget } from '../types';

describe('TTKValidator', () => {
    const mockResult: TTKResult = {
        matchup: { archetypeA: 'tank', archetypeB: 'dps' },
        budget: 50,
        totalSimulations: 1000,
        winnerCounts: { A: 800, B: 200 },
        roundsToKill: { avg: 8.5, median: 8, stdDev: 1, min: 6, max: 12 },
        winRate: { A: 0.8, B: 0.2 }
    };

    const mockTarget: TTKTarget = {
        matchup: { archetypeA: 'tank', archetypeB: 'dps' },
        budget: 50,
        minRounds: 6,
        targetRounds: 8,
        maxRounds: 10,
        tolerance: 1,
        expectedWinner: 'A'
    };

    it('should pass valid result', () => {
        const validation = TTKValidator.validate(mockResult, mockTarget);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
    });

    it('should fail if rounds too low', () => {
        const lowResult = { ...mockResult, roundsToKill: { ...mockResult.roundsToKill, avg: 5 } };
        const validation = TTKValidator.validate(lowResult, mockTarget);
        expect(validation.isValid).toBe(false);
        expect(validation.errors[0]).toContain('Rounds too low');
    });

    it('should fail if rounds too high', () => {
        const highResult = { ...mockResult, roundsToKill: { ...mockResult.roundsToKill, avg: 11 } };
        const validation = TTKValidator.validate(highResult, mockTarget);
        expect(validation.isValid).toBe(false);
        expect(validation.errors[0]).toContain('Rounds too high');
    });

    it('should fail if wrong winner', () => {
        const loseResult = {
            ...mockResult,
            winnerCounts: { A: 200, B: 800 },
            winRate: { A: 0.2, B: 0.8 }
        };
        const validation = TTKValidator.validate(loseResult, mockTarget);
        expect(validation.isValid).toBe(false);
        expect(validation.errors[0]).toContain('Wrong winner');
    });

    it('should warn if deviation outside tolerance but within range', () => {
        // Target 8, Tolerance 1. Avg 9.5 (Range 6-10)
        // 9.5 is > 8+1, so it should warn
        const devResult = { ...mockResult, roundsToKill: { ...mockResult.roundsToKill, avg: 9.5 } };
        const validation = TTKValidator.validate(devResult, mockTarget);
        expect(validation.isValid).toBe(true); // Still valid as it's < maxRounds
        expect(validation.warnings).toHaveLength(1);
        expect(validation.warnings[0]).toContain('deviation');
    });
});
