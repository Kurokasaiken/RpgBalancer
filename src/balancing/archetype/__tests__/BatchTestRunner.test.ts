import { BatchTestRunner } from '../BatchTestRunner';
import { DEFAULT_ARCHETYPES } from '../constants';

describe('BatchTestRunner', () => {
    it('should run a small batch', async () => {
        // Use a tiny subset for testing
        const subset = DEFAULT_ARCHETYPES.slice(0, 2); // 2 archetypes
        const budgets = [20, 50]; // 2 budgets

        // Total tests = 2 budgets * 2 * 2 matchups = 8 tests

        let progressCalls = 0;
        const results = await BatchTestRunner.runBatch(
            subset,
            budgets,
            10, // Low sims for speed
            (completed, total) => {
                progressCalls++;
                expect(total).toBe(8);
            }
        );

        expect(results.length).toBe(8);
        expect(progressCalls).toBe(8);

        // Verify structure
        expect(results[0].budget).toBe(20);
        expect(results[4].budget).toBe(50);
    });
});
