
import { describe, it } from 'vitest';
import { Entity } from '../../engine/core/entity';
import { resolveCombatRound } from '../../engine/combat/logic';
import type { CombatState } from '../../engine/combat/state';
import { createCombatState } from '../../engine/combat/state';
import type { RNG } from '../../balancing/simulation/types';
import { DEFAULT_STATS } from '../types';

describe('Debug Battle', () => {
    it('should log a full battle between Damage vs HP builds', () => {
        // Attacker: +10 Damage (Total 35), 150 HP
        const attacker = Entity.fromStatBlock('attacker', 'Attacker', {
            ...DEFAULT_STATS,
            damage: DEFAULT_STATS.damage + 10
        });

        // Defender: +300 HP (Total 450), 25 Damage
        const defender = Entity.fromStatBlock('defender', 'Defender', {
            ...DEFAULT_STATS,
            hp: DEFAULT_STATS.hp + 300
        });

        console.log('--- BATTLE START ---');
        console.log(`Attacker: HP ${attacker.currentHp}, Dmg ${attacker.statBlock?.damage}`);
        console.log(`Defender: HP ${defender.currentHp}, Dmg ${defender.statBlock?.damage}`);

        let state: CombatState = createCombatState([attacker], [defender]);
        const rng: RNG = () => 0.5;

        while (!state.isFinished && state.turn < 20) {
            state = resolveCombatRound(state, rng);

            // Print last few logs
            const newLogs = state.log.filter(l => l.turn === state.turn);
            newLogs.forEach(l => console.log(`[T${l.turn}] ${l.message}`));
        }

        console.log('--- BATTLE END ---');
        console.log(`Winner: ${state.winner}`);
        console.log(`Attacker HP: ${attacker.currentHp}`);
        console.log(`Defender HP: ${defender.currentHp}`);
    });
});
