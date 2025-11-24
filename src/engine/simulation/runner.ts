import { Entity } from '../core/entity';
import { createCombatState } from '../combat/state';
import { resolveCombatRound } from '../combat/logic';

export interface SimulationResult {
    winsA: number;
    winsB: number;
    draws: number;
    totalBattles: number;
    averageTurns: number;
}

export function runSimulation(entityA: Entity, entityB: Entity, iterations: number): SimulationResult {
    let winsA = 0;
    let winsB = 0;
    let draws = 0;
    let totalTurns = 0;

    // We need to clone entities for each battle to ensure fresh state
    // Since our Entity class is simple, we can just re-instantiate or reset them.
    // But `Entity` has methods, so JSON.parse/stringify won't work for deep cloning methods.
    // We'll assume the passed entities are "blueprints" and we reset their state manually.

    for (let i = 0; i < iterations; i++) {
        // Reset HP/Mana
        entityA.currentHp = entityA.derivedStats.maxHp;
        entityA.currentMana = entityA.derivedStats.maxMana;
        entityB.currentHp = entityB.derivedStats.maxHp;
        entityB.currentMana = entityB.derivedStats.maxMana;

        let state = createCombatState([entityA], [entityB]);

        // Run battle until finished
        // Optimization: We could have a "fastResolve" that doesn't generate logs
        while (!state.isFinished) {
            state = resolveCombatRound(state);
            // Safety break for infinite loops
            if (state.turn > 100) {
                state.isFinished = true;
                state.winner = 'draw';
            }
        }

        if (state.winner === 'teamA') winsA++;
        else if (state.winner === 'teamB') winsB++;
        else draws++;

        totalTurns += state.turn;
    }

    return {
        winsA,
        winsB,
        draws,
        totalBattles: iterations,
        averageTurns: totalTurns / iterations
    };
}
