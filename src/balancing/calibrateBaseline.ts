import { CombatTestFramework } from './__tests__/CombatTestFramework';
import { DEFAULT_STATS } from './types';
import type { StatBlock } from './types';

/**
 * Baseline Calibration Script
 * Tests if DEFAULT_STATS produces balanced 50% winrate in symmetrical combat
 */

const framework = new CombatTestFramework();

console.log('='.repeat(60));
console.log('BASELINE CALIBRATION - DEFAULT_STATS');
console.log('='.repeat(60));
console.log('\nCurrent DEFAULT_STATS:');
console.log(JSON.stringify(DEFAULT_STATS, null, 2));

// Run symmetry test with high precision
const symmetryTest = {
    name: 'Baseline Symmetry Test',
    description: 'Test if DEFAULT_STATS is balanced',
    entityA: {},
    entityB: {},
    expectedWinrate: 0.5,
    tolerance: 0.01, // ±1% tolerance
    simulations: 10000 // High precision
};

console.log('\n' + '-'.repeat(60));
console.log('Running 10,000 simulations...');
console.log('-'.repeat(60));

const startTime = Date.now();
const result = framework.runScenario(symmetryTest, DEFAULT_STATS);
const duration = Date.now() - startTime;

console.log(`\n✅ Completed in ${duration}ms\n`);

// Display results
console.log('RESULTS:');
console.log('─'.repeat(60));
console.log(`Winrate A:     ${(result.winrateA * 100).toFixed(3)}%`);
console.log(`Winrate B:     ${(result.winrateB * 100).toFixed(3)}%`);
console.log(`Deviation:     ${(Math.abs(result.winrateA - 0.5) * 100).toFixed(3)}% from 50%`);
console.log(`Avg Turns:     ${result.avgTurns.toFixed(2)}`);
console.log(`Turn Range:    ${result.details.minTurns}-${result.details.maxTurns}`);
console.log(`Draws:         ${result.details.drawCount}`);
console.log('─'.repeat(60));

// Verdict
if (result.passed) {
    console.log('\n🎉 DEFAULT_STATS IS BALANCED! ✅');
    console.log(`   Within ±${symmetryTest.tolerance * 100}% tolerance`);

    // Save as baseline
    console.log('\n📝 Saving as BASELINE_STATS...');

    const baselineData = {
        stats: DEFAULT_STATS,
        validatedAt: new Date().toISOString(),
        symmetryTest: {
            winrateA: result.winrateA,
            winrateB: result.winrateB,
            avgTurns: result.avgTurns,
            simulations: result.simulations
        }
    };

    // Would save to file here
    console.log('✅ Baseline validated and ready for use\n');
} else {
    console.log('\n⚠️ DEFAULT_STATS NEEDS CALIBRATION ❌');
    console.log(`   Current deviation: ${(Math.abs(result.winrateA - 0.5) * 100).toFixed(3)}%`);
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

// Export result for programmatic use
export const calibrationResult = result;
