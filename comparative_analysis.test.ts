import { describe, it, expect } from 'vitest';
import { BatchTestRunner } from './src/balancing/archetype/BatchTestRunner';
import { DEFAULT_ARCHETYPES } from './src/balancing/archetype/constants';
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

        const expectedMatchups = DEFAULT_ARCHETYPES.length * DEFAULT_ARCHETYPES.length;
        expect(results.length).toBe(expectedMatchups);

        results.forEach((r) => {
            expect(r.totalSimulations).toBeGreaterThan(0);
            expect(r.roundsToKill.avg).toBeGreaterThan(0);
            // TTKTestRunner defaults maxRounds to 100, so avg should be within a sane range
            expect(r.roundsToKill.avg).toBeLessThanOrEqual(100);
        });

        // Analyze Tank vs DPS specifically
        const tankVsDps = results.find(r =>
            r.matchup.archetypeA === 'tank_juggernaut' &&
            r.matchup.archetypeB === 'dps_berserker'
        );

        expect(tankVsDps).toBeDefined();

        if (tankVsDps) {
            console.log(`[${presetId}] Tank vs DPS:`);
            console.log(`  Winner: ${tankVsDps.winRate.A > 0.5 ? 'Tank' : 'DPS'} (${(Math.max(tankVsDps.winRate.A, tankVsDps.winRate.B) * 100).toFixed(1)}%)`);
            console.log(`  Avg Rounds: ${tankVsDps.roundsToKill.avg.toFixed(2)}`);
        }

        return results;
    };

    it('should compare Standard vs Tank Meta', async () => {
        // 1. Run Standard
        const standardResults = await runSimulationForPreset('standard');

        // 2. Run Tank Meta
        const tankMetaResults = await runSimulationForPreset('tank_meta');

        // 3. Run High Lethality
        const highLethalityResults = await runSimulationForPreset('high_lethality');

        // All presets should produce the same matrix shape
        expect(tankMetaResults.length).toBe(standardResults.length);
        expect(highLethalityResults.length).toBe(standardResults.length);
    }, 120000); // 2 min timeout
});
