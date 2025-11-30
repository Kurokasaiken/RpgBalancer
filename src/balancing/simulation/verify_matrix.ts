import { runMatrix } from '../1v1/matrixRunner';
import { DEFAULT_1V1_CONFIG } from '../1v1/mathEngine';

async function verify() {
    console.log('Starting Matrix Reproducibility Verification...');

    // Use a fixed seed
    const seed = 12345;
    const archetypeIds = ['ArchetypeA', 'ArchetypeB'];

    // Config for fast execution
    const config = {
        ...DEFAULT_1V1_CONFIG,
        nSimFast: 10, // Small number for speed, but enough to test RNG
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

    // Remove runtime-dependent fields for comparison
    const cleanA = JSON.parse(JSON.stringify(resultA));
    const cleanB = JSON.parse(JSON.stringify(resultB));

    // Remove runtimeMs and runMeta.createdAt/runId which are time-dependent
    cleanA.matrix.forEach((m: any) => delete m.runtimeMs);
    cleanB.matrix.forEach((m: any) => delete m.runtimeMs);
    delete cleanA.runMeta.runId;
    delete cleanA.runMeta.createdAt;
    delete cleanB.runMeta.runId;
    delete cleanB.runMeta.createdAt;

    // Compare
    const jsonA = JSON.stringify(cleanA, null, 2);
    const jsonB = JSON.stringify(cleanB, null, 2);

    if (jsonA === jsonB) {
        console.log('\n✅ SUCCESS: Matrix runs are IDENTICAL.');
        console.log('\n--- Output Sample (Run A) ---');
        console.log(JSON.stringify(cleanA.matrix[0], null, 2)); // Show first cell
    } else {
        console.error('\n❌ FAILURE: Matrix runs DIFFER.');
        console.log('Length A:', jsonA.length);
        console.log('Length B:', jsonB.length);
    }
}

verify().catch(console.error);
