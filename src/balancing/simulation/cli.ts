import { StatValueAnalyzer } from './StatValueAnalyzer';
import { runMatrix } from '../1v1/matrixRunner';
import type { StatBlock } from '../types';

/**
 * CLI Tool for Balancing System
 * 
 * Commands:
 * 1. Calibrate Stat (Legacy/Default)
 *    npm run calibrate <stat> [increment] [iterations]
 * 
 * 2. Run Matrix
 *    npm run calibrate matrix [archetypes] [--seed=N] [--fast]
 */

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        printUsage();
        process.exit(1);
    }

    const command = args[0];

    // Check if first argument is 'matrix'
    if (command === 'matrix') {
        await handleMatrixCommand(args.slice(1));
    } else {
        // Default to calibration mode
        await handleCalibrationCommand(args);
    }
}

async function handleMatrixCommand(args: string[]) {
    // Import test archetypes
    const { getAllArchetypeIds } = await import('../1v1/testArchetypes');


    // Parse arguments
    const archetypesArg = args[0] || 'all';

    // Parse flags
    const seedArg = args.find(a => a.startsWith('--seed='));
    const seed = seedArg ? parseInt(seedArg.split('=')[1]) : Date.now();

    const fast = args.includes('--fast');

    console.log(`\n🚀 Starting Matrix Simulation...`);
    console.log(`   Archetypes: ${archetypesArg}`);
    console.log(`   Seed:       ${seed}`);
    console.log(`   Mode:       ${fast ? 'FAST' : 'FULL'}`);
    console.log('----------------------------------------');

    // Resolve archetypes
    let archetypeIds: string[] = [];
    if (archetypesArg === 'all') {
        archetypeIds = getAllArchetypeIds();
    } else {
        archetypeIds = archetypesArg.split(',').map(s => s.trim());
    }

    try {
        const result = await runMatrix(archetypeIds, {
            seed,
            fast,
            onProgress: (current, total, info) => {
                process.stdout.write(`\rProgress: ${current}/${total} (${info})   `);
            }
        });

        console.log('\n\n✅ MATRIX RUN COMPLETE');
        console.log('----------------------------------------');

        // Print Summary Table
        console.table(result.matrix.map(m => ({
            Row: m.row,
            Col: m.col,
            'Win%': (m.win_rate_row * 100).toFixed(1) + '%',
            'Turns': m.avg_TTK_row_win.toFixed(1),
            'Draws': m.draws
        })));

        console.log('----------------------------------------');
        console.log(`Run ID: ${result.runMeta.runId}`);

    } catch (error) {
        console.error('\n❌ Error during matrix run:', error);
        process.exit(1);
    }
}

async function handleCalibrationCommand(args: string[]) {
    const stat = args[0] as keyof StatBlock;
    const increment = args[1] ? parseFloat(args[1]) : 10;
    const iterations = args[2] ? parseInt(args[2]) : 5000;

    console.log(`\n🚀 Starting calibration for '${stat}'...`);
    console.log(`   Increment: +${increment}`);
    console.log(`   Iterations: ${iterations}`);
    console.log('----------------------------------------');

    try {
        const result = StatValueAnalyzer.calibrateStat(stat, increment, iterations);

        console.log('\n✅ CALIBRATION COMPLETE');
        console.log('----------------------------------------');
        console.log(`Stat:       ${result.stat}`);
        console.log(`Weight:     ${result.weight.toFixed(2)} HP`);
        console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
        console.log(`Linearity:  ${(result.linearity * 100).toFixed(0)}%`);
        console.log('----------------------------------------');

        // Suggest update
        console.log(`\nTo update weights, edit src/balancing/statWeights.ts:`);
        console.log(`
    ${stat}: {
        stat: '${stat}',
        avgRatio: ${result.weight.toFixed(1)},
        confidence: ${result.confidence.toFixed(2)},
        linearityScore: ${result.linearity.toFixed(2)},
        // ...
    },
        `);

    } catch (error) {
        console.error('\n❌ Error during calibration:', error);
        process.exit(1);
    }
}

function printUsage() {
    console.log(`
Usage: 
  1. Calibration: npm run calibrate <stat> [increment] [iterations]
  2. Matrix:      npm run calibrate matrix [archetypes] [--seed=N] [--fast]

Examples:
  npm run calibrate damage 10 5000
  npm run calibrate matrix all --seed=123 --fast
    `);
}

main();
