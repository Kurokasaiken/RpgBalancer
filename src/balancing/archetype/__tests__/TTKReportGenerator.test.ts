import { TTKReportGenerator } from '../TTKReportGenerator';
import { TTKValidation, TTKResult, TTKTarget } from '../types';

describe('TTKReportGenerator', () => {
    const mockResult: TTKResult = {
        matchup: { archetypeA: 'tank', archetypeB: 'dps' },
        budget: 50,
        totalSimulations: 100,
        winnerCounts: { A: 80, B: 20 },
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

    const mockValidation: TTKValidation = {
        result: mockResult,
        target: mockTarget,
        isValid: true,
        deviations: { roundsDeviation: 0.5, roundsDeviationPercent: 6.25, winnerMismatch: false },
        warnings: [],
        errors: []
    };

    const invalidValidation: TTKValidation = {
        ...mockValidation,
        isValid: false,
        errors: ['Rounds too high']
    };

    it('should generate markdown report', () => {
        const report = TTKReportGenerator.generateMarkdownReport([mockValidation, invalidValidation]);
        expect(report).toContain('# TTK Balance Report');
        expect(report).toContain('Total Matchups: 2');
        expect(report).toContain('Valid: 1 (50.0%)');
        expect(report).toContain('Critical Issues');
        expect(report).toContain('Rounds too high');
    });

    it('should generate CSV', () => {
        const csv = TTKReportGenerator.generateCSV([mockResult]);
        expect(csv).toContain('archetypeA,archetypeB,budget');
        expect(csv).toContain('tank,dps,50,8.50');
    });
});
