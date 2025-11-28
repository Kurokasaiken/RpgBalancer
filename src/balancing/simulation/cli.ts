import { StatValueAnalyzer } from './StatValueAnalyzer';
import type { StatBlock } from '../types';

/**
 * CLI Tool for Stat Calibration
 * 
 * Usage:
 * tsx src/balancing/simulation/cli.ts <stat_name> [increment] [iterations]
 * 
 * Example:
 * tsx src/balancing/simulation/cli.ts damage 10 5000
 */

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
Usage: npm run calibrate <stat> [increment] [iterations]

Available stats:
- damage
- armor
- txc
- evasion
- critChance
- hp
- ... any other StatBlock key
        `);
        process.exit(1);
    }

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

main();
