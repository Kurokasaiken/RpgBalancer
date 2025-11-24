import { describe, it, expect } from 'vitest';
import { Entity } from '../core/entity';
import { createEmptyAttributes } from '../core/stats';
import { createCombatState } from './state';
import { resolveCombatRound } from './logic';

describe('Combat System', () => {
    it('should resolve a round of combat', () => {
        const attr = createEmptyAttributes();
        attr.strength = 5;
        attr.constitution = 5;

        const fighter1 = new Entity('f1', 'Fighter 1', attr);
        const fighter2 = new Entity('f2', 'Fighter 2', attr);

        // Equip a weapon to ensure damage
        fighter1.equipWeapon({
            id: 'w1', name: 'Test Sword', type: 'weapon', cost: 0,
            damage: 10, attackSpeed: 1, range: 1, description: 'Test'
        });

        let state = createCombatState([fighter1], [fighter2]);

        expect(state.turn).toBe(0);
        expect(state.isFinished).toBe(false);

        state = resolveCombatRound(state);

        expect(state.turn).toBe(1);
        expect(state.log.length).toBeGreaterThan(0);

        // Fighter 2 should have taken damage
        expect(fighter2.currentHp).toBeLessThan(fighter2.derivedStats.maxHp);
    });

    it('should end combat when one side dies', () => {
        const attr = createEmptyAttributes();
        const strong = new Entity('strong', 'Strong', { ...attr, strength: 100 }); // One shot killer
        const weak = new Entity('weak', 'Weak', { ...attr, constitution: 0 });

        strong.equipWeapon({
            id: 'god_sword', name: 'God Sword', type: 'weapon', cost: 0,
            damage: 9999, attackSpeed: 1, range: 1, description: 'OP'
        });

        let state = createCombatState([strong], [weak]);
        state = resolveCombatRound(state);

        expect(state.isFinished).toBe(true);
        expect(state.winner).toBe('teamA');
        expect(weak.isAlive()).toBe(false);
    });
});
