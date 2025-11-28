import { ArchetypeTemplate, TTKResult } from './types';
import { TTKTestRunner } from './TTKTestRunner';

export class BatchTestRunner {
    /**
     * Run full matrix of tests across multiple budgets
     */
    public static async runBatch(
        archetypes: ArchetypeTemplate[],
        budgets: number[],
        numSimulations: number = 100,
        onProgress?: (completed: number, total: number) => void
    ): Promise<TTKResult[]> {
        const results: TTKResult[] = [];
        const totalTests = budgets.length * archetypes.length * archetypes.length;
        let completed = 0;

        for (const budget of budgets) {
            for (const archA of archetypes) {
                for (const archB of archetypes) {
                    // Run simulation
                    const result = TTKTestRunner.runMatchup({
                        archetypeA: archA,
                        archetypeB: archB,
                        budget,
                        numSimulations
                    });

                    results.push(result);
                    completed++;

                    // Report progress
                    if (onProgress) {
                        onProgress(completed, totalTests);
                    }

                    // Yield to event loop every 10 tests to prevent freezing
                    if (completed % 10 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }
            }
        }

        return results;
    }
}
