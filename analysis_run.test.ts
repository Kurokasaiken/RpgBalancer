import { BatchTestRunner } from './src/balancing/archetype/BatchTestRunner';
import { TTKReportGenerator } from './src/balancing/archetype/TTKReportGenerator';
import { TTKValidator } from './src/balancing/archetype/TTKValidator';
import { DEFAULT_ARCHETYPES } from './src/balancing/archetype/constants';
import { TTKTarget } from './src/balancing/archetype/types';

// Simple script to run analysis via vitest
describe('Balance Analysis Run', () => {
    it('should generate full balance report', async () => {
        console.log('🚀 Starting Balance Analysis Simulation...');
        console.log(`Testing ${DEFAULT_ARCHETYPES.length} archetypes against each other...`);

        // Run simulation at Budget 50 (Standard Balanced Tier)
        const results = await BatchTestRunner.runBatch(
            DEFAULT_ARCHETYPES,
            [50], // Budget 50 only for this analysis
            100,  // 100 sims per matchup (fast but statistically significant enough for trends)
            (completed, total) => {
                if (completed % 50 === 0) {
                    console.log(`Progress: ${completed}/${total} matchups simulated`);
                }
            }
        );

        // Generate Targets dynamically for validation (generic targets)
        // In a real scenario, these would come from config
        const targets: TTKTarget[] = results.map(r => ({
            matchup: r.matchup,
            budget: r.budget,
            minRounds: 4,
            targetRounds: 8,
            maxRounds: 15,
            tolerance: 2,
            expectedWinner: 'Either' // We just want to see raw data first
        }));

        // Validate
        const validations = TTKValidator.validateAll(results, targets);

        // Generate Report
        const report = TTKReportGenerator.generateMarkdownReport(validations);
        const csv = TTKReportGenerator.generateCSV(results);

        console.log('\n\n================ BALANCE REPORT ================\n');
        console.log(report);
        console.log('\n================================================\n');

        // Also log some specific interesting matchups
        const tankVsDps = results.find(r =>
            r.matchup.archetypeA.includes('tank') &&
            r.matchup.archetypeB.includes('dps')
        );

        if (tankVsDps) {
            console.log('\n🔍 Deep Dive: Tank vs DPS');
            console.log(`Winner: ${tankVsDps.winRate.A > 0.5 ? 'Tank' : 'DPS'} (${(Math.max(tankVsDps.winRate.A, tankVsDps.winRate.B) * 100).toFixed(1)}%)`);
            console.log(`Avg Rounds: ${tankVsDps.roundsToKill.avg.toFixed(2)}`);
        }

    }, 60000); // 60s timeout
});
