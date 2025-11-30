import { describe, it, expect } from 'vitest';
import { runMatrix } from '../../1v1/matrixRunner';
import { DEFAULT_1V1_CONFIG } from '../../1v1/mathEngine';

describe('Matrix Reproducibility Verification', () => {
    it('should produce identical JSON output for two runs with the same seed', async () => {
        console.log('Starting Matrix Reproducibility Verification...');

        const seed = 12345;
        const archetypeIds = ['ArchetypeA', 'ArchetypeB'];

        const config = {
            ...DEFAULT_1V1_CONFIG,
            nSimFast: 10,
        };

        console.log(`Running Matrix A with seed ${seed}...`);
        const resultA = await runMatrix(archetypeIds, {
            seed,
            fast: true,
            config
        });

        console.log(`Running Matrix B with seed ${seed}...`);
        const resultB = await runMatrix(archetypeIds, {
            seed,
            fast: true,
            config
        });

        // Deep clone and clean
        const cleanA = JSON.parse(JSON.stringify(resultA));
        const cleanB = JSON.parse(JSON.stringify(resultB));

        // Remove time-dependent fields
        cleanA.matrix.forEach((m: any) => delete m.runtimeMs);
        cleanB.matrix.forEach((m: any) => delete m.runtimeMs);
        delete cleanA.runMeta.runId;
        delete cleanA.runMeta.createdAt;
        delete cleanB.runMeta.runId;
        delete cleanB.runMeta.createdAt;

        // Log the JSON for the user to see
        console.log('--- JSON OUTPUT SAMPLE (Run A) ---');
        console.log(JSON.stringify(cleanA.matrix[0], null, 2));

        console.log('--- JSON OUTPUT SAMPLE (Run B) ---');
        console.log(JSON.stringify(cleanB.matrix[0], null, 2));

        expect(cleanA).toEqual(cleanB);
    });
});
