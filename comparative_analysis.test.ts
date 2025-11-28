import { BatchTestRunner } from './src/balancing/archetype/BatchTestRunner';
import { TTKReportGenerator } from './src/balancing/archetype/TTKReportGenerator';
import { TTKValidator } from './src/balancing/archetype/TTKValidator';
import { DEFAULT_ARCHETYPES } from './src/balancing/archetype/constants';
import { TTKTarget } from './src/balancing/archetype/types';
import { BalanceConfigManager } from './src/balancing/BalanceConfigManager';

// Script to run comparative analysis between presets
describe('Comparative Balance Analysis', () => {

    const runSimulationForPreset = async (presetId: string) => {
        console.log(`\n\n🚀 Starting Simulation for Preset: ${presetId.toUpperCase()}...`);
        BalanceConfigManager.setPreset(presetId);

        const results = await BatchTestRunner.runBatch(
            DEFAULT_ARCHETYPES,
            [50],
            50, // 50 sims for speed
        );

        // Analyze Tank vs DPS specifically
        const tankVsDps = results.find(r =>
            r.matchup.archetypeA === 'tank_juggernaut' &&
            r.matchup.archetypeB === 'dps_berserker'
        );

        if (tankVsDps) {
            console.log(`[${presetId}] Tank vs DPS:`);
            console.log(`  Winner: ${tankVsDps.winRate.A > 0.5 ? 'Tank' : 'DPS'} (${(Math.max(tankVsDps.winRate.A, tankVsDps.winRate.B) * 100).toFixed(1)}%)`);
            console.log(`  Avg Rounds: ${tankVsDps.roundsToKill.avg.toFixed(2)}`);
        }

        return results;
    };

    it('should compare Standard vs Tank Meta', async () => {
        // 1. Run Standard
        await runSimulationForPreset('standard');

        // 2. Run Tank Meta
        await runSimulationForPreset('tank_meta');

        // 3. Run High Lethality
        await runSimulationForPreset('high_lethality');
    }, 120000); // 2 min timeout
});
