import type { ArchetypeTemplate, TTKResult } from './types';
import { ArchetypeBuilder } from './ArchetypeBuilder';
import { BalanceConfigManager } from '../BalanceConfigManager';
import { Entity } from '../../engine/core/entity';
import { resolveCombatRound } from '../../engine/combat/logic';
import { createCombatState } from '../../engine/combat/state';

// Re-exporting createCombatState from logic if it's not there, or importing from state
// Based on previous view, createCombatState is in state.ts, resolveCombatRound is in logic.ts
// Let's fix imports in the actual file content below.

export interface TTKTestConfig {
    archetypeA: ArchetypeTemplate;
    archetypeB: ArchetypeTemplate;
    budget: number;
    numSimulations?: number; // default 1000
    maxRounds?: number;      // default 100
}

export class TTKTestRunner {

    /**
     * Run Monte Carlo simulation for a single matchup
     */
    public static runMatchup(config: TTKTestConfig): TTKResult {
        const numSimulations = config.numSimulations || 1000;
        const maxRounds = config.maxRounds || 100;
        const weights = BalanceConfigManager.getWeights();

        // 1. Build StatBlocks
        const statsA = ArchetypeBuilder.calculateStatValues(
            config.archetypeA.allocation,
            config.budget,
            weights
        );
        const statsB = ArchetypeBuilder.calculateStatValues(
            config.archetypeB.allocation,
            config.budget,
            weights
        );

        // 2. Run Simulations
        let winsA = 0;
        let winsB = 0;
        const roundsList: number[] = [];

        for (let i = 0; i < numSimulations; i++) {
            const result = this.runSingleCombat(
                statsA,
                statsB,
                config.archetypeA.name,
                config.archetypeB.name,
                maxRounds
            );

            if (result.winner === 'A') winsA++;
            if (result.winner === 'B') winsB++;
            roundsList.push(result.rounds);
        }

        // 3. Calculate Statistics
        roundsList.sort((a, b) => a - b);
        const sum = roundsList.reduce((a, b) => a + b, 0);
        const avg = sum / roundsList.length;
        const min = roundsList[0];
        const max = roundsList[roundsList.length - 1];
        const median = roundsList[Math.floor(roundsList.length / 2)];

        // Standard Deviation
        const squareDiffs = roundsList.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(avgSquareDiff);

        return {
            matchup: {
                archetypeA: config.archetypeA.id,
                archetypeB: config.archetypeB.id
            },
            budget: config.budget,
            totalSimulations: numSimulations,
            winnerCounts: {
                A: winsA,
                B: winsB
            },
            roundsToKill: {
                avg,
                median,
                stdDev,
                min,
                max
            },
            winRate: {
                A: winsA / numSimulations,
                B: winsB / numSimulations
            }
        };
    }

    /**
     * Run matrix: all archetypes vs all archetypes
     */
    public static runMatrix(
        archetypes: ArchetypeTemplate[],
        budget: number,
        numSimulations: number = 100
    ): TTKResult[] {
        const results: TTKResult[] = [];

        for (const archA of archetypes) {
            for (const archB of archetypes) {
                // Optional: Skip mirror matches if desired, but usually good to test
                results.push(this.runMatchup({
                    archetypeA: archA,
                    archetypeB: archB,
                    budget,
                    numSimulations
                }));
            }
        }

        return results;
    }

    /**
     * Helper: Run single combat simulation
     */
    private static runSingleCombat(
        statsA: any, // StatBlock
        statsB: any, // StatBlock
        nameA: string,
        nameB: string,
        maxRounds: number
    ): { winner: 'A' | 'B' | 'Draw', rounds: number } {
        // Create Entities
        // Note: Entity.fromStatBlock creates a fresh entity state
        const entityA = Entity.fromStatBlock('A', nameA, statsA);
        const entityB = Entity.fromStatBlock('B', nameB, statsB);

        // Create Combat State
        // We need to import createCombatState from state.ts
        // But wait, createCombatState is in state.ts, resolveCombatRound is in logic.ts
        // I'll assume imports are handled at top of file correctly
        let state = createCombatState([entityA], [entityB]);

        // Run Loop
        while (!state.isFinished && state.turn < maxRounds) {
            state = resolveCombatRound(state, Math.random);
        }

        let winner: 'A' | 'B' | 'Draw' = 'Draw';
        if (state.winner === 'teamA') winner = 'A';
        if (state.winner === 'teamB') winner = 'B';

        return { winner, rounds: state.turn };
    }
}

