/// <reference types="node" />
import { BalanceConfigManager } from '../BalanceConfigManager';
import { BatchTestRunner } from './BatchTestRunner';
import { TTKReportGenerator } from './TTKReportGenerator';
import { DEFAULT_ARCHETYPES } from './constants';
import { TTKTestRunner } from './TTKTestRunner';

// Helper to parse args
const args = process.argv.slice(2);
const command = args[0];

/**
 * Main entry point for the CLI tool.
 */
async function main() {
    if (!command) {
        printHelp();
        return;
    }

    try {
        switch (command) {
            case 'run-balance':
                await runBalance(args[1]);
                break;
            case 'compare':
                await comparePresets(args[1], args[2]);
                break;
            case 'analyze':
                await analyzeMatchup(args[1], args[2], args[3]);
                break;
            case 'list-presets':
                listPresets();
                break;
            default:
                console.error(`Unknown command: ${command}`);
                printHelp();
        }
    } catch (error) {
        console.error('Error executing command:', error);
    }
}

/**
 * Prints help information to the console.
 */
function printHelp() {
    console.log(`
RPG Balancer CLI
================

Usage:
  npm run balance run-balance [preset]       Run full simulation for a preset
  npm run balance compare [presetA] [presetB] Compare two presets
  npm run balance analyze [archA] [archB]    Deep dive into a specific matchup
  npm run balance list-presets               List available balance presets

Examples:
  npm run balance run-balance standard
  npm run balance compare standard tank_meta
  npm run balance analyze tank_juggernaut dps_berserker
    `);
}

/**
 * Lists available balance presets.
 */
function listPresets() {
    console.log('\nAvailable Presets:');
    // We need to access the presets from the manager, but they are private or we need a getter
    // For now, I'll just try to access them via a known list or if I exposed them
    // Looking at BalanceConfigManager, I didn't expose the list.
    // I'll just list the known ones for now.
    console.log('- standard');
    console.log('- tank_meta');
    console.log('- high_lethality');
}

/**
 * Runs a full balance simulation for a given preset.
 * @param presetId The ID of the preset to run the simulation for (default: 'standard').
 */
async function runBalance(presetId: string = 'standard') {
    console.log(`\n🚀 Running Balance Simulation for preset: ${presetId}...`);
    BalanceConfigManager.setPreset(presetId);

    const startTime = Date.now();
    const results = await BatchTestRunner.runBatch(
        DEFAULT_ARCHETYPES,
        [50], // Default to 50 budget for quick check
        100,  // 100 sims
        (completed, total) => {
            if (completed % 50 === 0) {
                process.stdout.write(`\rProgress: ${Math.round(completed / total * 100)}% (${completed}/${total})`);
            }
        }
    );
    console.log('\nSimulation complete!');
    console.log(`Time taken: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

    // Generate Report (Optional, for future use)
    TTKReportGenerator.generateMarkdownReport([]);

    // Custom CLI Report
    console.log('\n=== SUMMARY ===');
    const tankVsDps = results.filter(r =>
        r.matchup.archetypeA.includes('tank') &&
        r.matchup.archetypeB.includes('dps')
    );

    if (tankVsDps.length > 0) {
        const avgWinRate = tankVsDps.reduce((sum, r) => sum + r.winRate.A, 0) / tankVsDps.length;
        console.log(`Tank Win Rate vs DPS: ${(avgWinRate * 100).toFixed(1)}%`);
    }

    const avgTTK = results.reduce((sum, r) => sum + r.roundsToKill.avg, 0) / results.length;
    console.log(`Global Average TTK: ${avgTTK.toFixed(2)} rounds`);
}

/**
 * Compares two balance presets by running simulations.
 */
async function comparePresets(presetA: string, presetB: string) {
    if (!presetA || !presetB) {
        console.error('Please provide two presets to compare.');
        return;
    }

    console.log(`\n⚔️ Comparing ${presetA} vs ${presetB}...\n`);

    // Run A
    process.stdout.write(`Simulating ${presetA}... `);
    BalanceConfigManager.setPreset(presetA);
    const resultsA = await BatchTestRunner.runBatch(DEFAULT_ARCHETYPES, [50], 50);
    console.log('Done.');

    // Run B
    process.stdout.write(`Simulating ${presetB}... `);
    BalanceConfigManager.setPreset(presetB);
    const resultsB = await BatchTestRunner.runBatch(DEFAULT_ARCHETYPES, [50], 50);
    console.log('Done.\n');

    // Compare Metrics
    const getAvgTTK = (res: any[]) => res.reduce((s, r) => s + r.roundsToKill.avg, 0) / res.length;
    const getTankWinRate = (res: any[]) => {
        const matches = res.filter(r => r.matchup.archetypeA.includes('tank') && r.matchup.archetypeB.includes('dps'));
        return matches.reduce((s, r) => s + r.winRate.A, 0) / matches.length;
    };

    console.log('Metric             | ' + presetA.padEnd(15) + ' | ' + presetB.padEnd(15) + ' | Diff');
    console.log('-------------------|-----------------|-----------------|-----');

    const ttkA = getAvgTTK(resultsA);
    const ttkB = getAvgTTK(resultsB);
    console.log(`Avg TTK            | ${ttkA.toFixed(2).padEnd(15)} | ${ttkB.toFixed(2).padEnd(15)} | ${(ttkB - ttkA).toFixed(2)}`);

    const tankA = getTankWinRate(resultsA);
    const tankB = getTankWinRate(resultsB);
    console.log(`Tank Win Rate      | ${(tankA * 100).toFixed(1)}%`.padEnd(19) + ` | ${(tankB * 100).toFixed(1)}%`.padEnd(17) + ` | ${((tankB - tankA) * 100).toFixed(1)}%`);
}

/**
 * Analyzes a specific matchup between two archetypes.
 */
async function analyzeMatchup(archAId: string, archBId: string, budgetStr: string = '50') {
    if (!archAId || !archBId) {
        console.error('Please provide two archetype IDs.');
        return;
    }

    // Find archetypes
    const archA = DEFAULT_ARCHETYPES.find(a => a.id === archAId);
    const archB = DEFAULT_ARCHETYPES.find(a => a.id === archBId);

    if (!archA || !archB) {
        console.error('Archetype not found. Available IDs:');
        console.log(DEFAULT_ARCHETYPES.map(a => a.id).join(', '));
        return;
    }

    const budget = parseInt(budgetStr);
    console.log(`\n🔍 Analyzing ${archA.name} vs ${archB.name} at ${budget} Budget...`);

    const result = TTKTestRunner.runMatchup({
        archetypeA: archA,
        archetypeB: archB,
        budget,
        numSimulations: 1000,
        maxRounds: 50
    });

    console.log('\nResults:');
    console.log(`Winner: ${result.winRate.A > result.winRate.B ? archA.name : archB.name}`);
    console.log(`Win Rate A: ${(result.winRate.A * 100).toFixed(1)}%`);
    console.log(`Win Rate B: ${(result.winRate.B * 100).toFixed(1)}%`);
    console.log(`Avg Rounds: ${result.roundsToKill.avg.toFixed(2)}`);
    console.log(`Min/Max: ${result.roundsToKill.min} / ${result.roundsToKill.max}`);
    console.log(`Std Dev: ${result.roundsToKill.stdDev.toFixed(2)}`);
}

// Execute
main();
