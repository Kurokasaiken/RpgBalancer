import { DEFAULT_STATS } from './types';
import { runMonteCarlo } from './1v1/montecarlo';

/**
 * Baseline Calibration Script
 * Tests if DEFAULT_STATS produces ~50% winrate in symmetrical combat using Monte Carlo.
 */

console.log('='.repeat(60));
console.log('BASELINE CALIBRATION - DEFAULT_STATS');
console.log('='.repeat(60));
console.log('\nCurrent DEFAULT_STATS:');
console.log(JSON.stringify(DEFAULT_STATS, null, 2));

// Run symmetry test with high precision
const symmetryTest = {
    name: 'Baseline Symmetry Test',
    description: 'Test if DEFAULT_STATS is balanced (self vs self)',
    expectedWinrate: 0.5,
    tolerance: 0.01, // ±1% tolerance
    simulations: 10000 // High precision
};

console.log('\n' + '-'.repeat(60));
console.log(`Running ${symmetryTest.simulations.toLocaleString()} simulations (DEFAULT_STATS vs DEFAULT_STATS)...`);
console.log('-'.repeat(60));

const startTime = Date.now();
const seed = Date.now();
const mcResult = runMonteCarlo(DEFAULT_STATS, DEFAULT_STATS, symmetryTest.simulations, seed);
const duration = Date.now() - startTime;

// Map Monte Carlo result to a simpler calibration summary
const winrateA = mcResult.win_rate_row; // Row vs Col, but stats are identical
const winrateB = 1 - winrateA;

const result = {
    winrateA,
    winrateB,
    avgTurns: mcResult.median_TTK,
    draws: mcResult.draws,
    simulations: mcResult.totalSimulations,
    passed: Math.abs(winrateA - symmetryTest.expectedWinrate) <= symmetryTest.tolerance,
};

console.log(`\n✅ Completed in ${duration}ms (seed=${seed})\n`);

// Display results
console.log('RESULTS:');
console.log('─'.repeat(60));
console.log(`Winrate A:     ${(result.winrateA * 100).toFixed(3)}%`);
console.log(`Winrate B:     ${(result.winrateB * 100).toFixed(3)}%`);
console.log(`Deviation:     ${(Math.abs(result.winrateA - symmetryTest.expectedWinrate) * 100).toFixed(3)}% from ${(symmetryTest.expectedWinrate * 100).toFixed(1)}%`);
console.log(`Median TTK:    ${result.avgTurns.toFixed(2)} turns`);
console.log(`Draws:         ${result.draws}`);
console.log('─'.repeat(60));

// Verdict
if (result.passed) {
    console.log('\n🎉 DEFAULT_STATS IS BALANCED! ✅');
    console.log(`   Within ±${symmetryTest.tolerance * 100}% tolerance`);

    // Save as baseline
    console.log('\n📝 Saving as BASELINE_STATS...');

    // Would save to file here
    console.log('✅ Baseline validated and ready for use\n');
} else {
    console.log('\n⚠️ DEFAULT_STATS NEEDS CALIBRATION ❌');
    console.log(`   Current deviation: ${(Math.abs(result.winrateA - symmetryTest.expectedWinrate) * 100).toFixed(3)}%`);
    console.log(`   Required: < ${symmetryTest.tolerance * 100}%`);

    console.log('\n💡 RECOMMENDATIONS:');

    if (result.winrateA > 0.51) {
        console.log('   - Entity A has slight advantage');
        console.log('   - Consider: reducing A\'s starting advantage or increasing B\'s');
    } else if (result.winrateA < 0.49) {
        console.log('   - Entity B has slight advantage');
        console.log('   - Consider: reviewing turn order or first-strike mechanics');
    }

    console.log('\n🔧 NEXT STEPS:');
    console.log('   1. Review combat engine for asymmetries');
    console.log('   2. Adjust DEFAULT_STATS if needed');
    console.log('   3. Re-run this calibration script');
    console.log('');
}

// Export rich result for programmatic use (e.g. from tests or other tools)
export const calibrationResult = {
    summary: result,
    symmetryTest,
    seed,
    raw: mcResult,
};
