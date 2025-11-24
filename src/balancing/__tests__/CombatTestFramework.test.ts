import { describe, it, expect } from 'vitest';
import { CombatTestFramework, BASELINE_TESTS } from './CombatTestFramework';
import { DEFAULT_STATS } from '../types';

describe('Combat Test Framework', () => {
    const framework = new CombatTestFramework();

    describe('Baseline Tests', () => {
        it('should run all baseline tests', () => {
            const results = framework.runBatch(BASELINE_TESTS, DEFAULT_STATS);

            // All tests should complete
            expect(results).toHaveLength(BASELINE_TESTS.length);

            // Log results for debugging
            results.forEach(result => {
                console.log(`${result.passed ? '✅' : '❌'} ${result.scenario}: ${(result.winrateA * 100).toFixed(1)}% vs ${(result.winrateB * 100).toFixed(1)}%`);
                if (!result.passed && result.errorMessage) {
                    console.log(`  Error: ${result.errorMessage}`);
                }
            });

            // Generate report
            const report = framework.generateReport(results);
            console.log('\n' + report);
        });

        it('Symmetry Test should pass', () => {
            const symmetryTest = BASELINE_TESTS.find(t => t.name === 'Symmetry Test')!;
            const result = framework.runScenario(symmetryTest, DEFAULT_STATS);

            expect(result.passed).toBe(true);
            expect(Math.abs(result.winrateA - 0.5)).toBeLessThan(0.02);
        });

        it('HP Scaling Test should show advantage', () => {
            const hpTest = BASELINE_TESTS.find(t => t.name.includes('HP Scaling'))!;
            const result = framework.runScenario(hpTest, DEFAULT_STATS);

            // Entity A with +100 HP should win majority
            expect(result.winrateA).toBeGreaterThan(0.7);
        });

        it('Damage Scaling Test should show advantage', () => {
            const damageTest = BASELINE_TESTS.find(t => t.name.includes('Damage Scaling'))!;
            const result = framework.runScenario(damageTest, DEFAULT_STATS);

            // Entity A with +20 damage should win majority
            expect(result.winrateA).toBeGreaterThan(0.7);
        });
    });

    describe('Custom Scenarios', () => {
        it('should handle extreme HP difference', () => {
            const extremeHPTest = {
                name: 'Extreme HP Test',
                description: 'Massive HP advantage',
                entityA: { hp: 500 },
                entityB: {},
                expectedOutcome: 'A_WINS' as const,
                simulations: 100 // Fewer sims for speed
            };

            const result = framework.runScenario(extremeHPTest, DEFAULT_STATS);

            expect(result.passed).toBe(true);
            expect(result.winrateA).toBeGreaterThan(0.95); // Should dominate
        });

        it('should detect unbalanced scenarios', () => {
            const unbalancedTest = {
                name: 'Unbalanced Test',
                description: 'Testing detection of imbalance',
                entityA: { hp: 50, damage: 10 },
                entityB: {},
                expectedWinrate: 0.5, // Claim balanced but isn't
                tolerance: 0.01,
                simulations: 500
            };

            const result = framework.runScenario(unbalancedTest, DEFAULT_STATS);

            // Should fail because A has advantages
            expect(result.passed).toBe(false);
            expect(result.errorMessage).toBeDefined();
        });
    });

    describe('Report Generation', () => {
        it('should generate valid markdown report', () => {
            const results = framework.runBatch(BASELINE_TESTS.slice(0, 3), DEFAULT_STATS);
            const report = framework.generateReport(results);

            expect(report).toContain('# Combat Test Report');
            expect(report).toContain('Tests Run:');
            expect(report).toContain('Passed:');
            expect(report).toContain('Symmetry Test');
        });

        it('should generate valid CSV export', () => {
            const results = framework.runBatch(BASELINE_TESTS.slice(0, 2), DEFAULT_STATS);
            const csv = framework.generateCSV(results);

            expect(csv).toContain('Scenario,Passed,WinrateA');
            expect(csv.split('\n').length).toBeGreaterThan(2); // Header + data rows
        });
    });
});
