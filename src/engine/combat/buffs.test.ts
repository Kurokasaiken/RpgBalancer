
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveCombatRound } from './logic';
import { createCombatState } from './state';
import { Entity } from '../core/entity';
import { DEFAULT_STATS } from '../../balancing/types';
import { createEmptySpell } from '../../balancing/spellTypes';

describe('Combat Logic - Buffs/Debuffs', () => {
    let entityA: Entity;
    let entityB: Entity;
    const rng = () => 0.4; // Deterministic RNG (always < 0.5 for spell cast check)

    beforeEach(() => {
        // Create entities with StatBlock
        entityA = new Entity('A', 'Hero', { strength: 10, dexterity: 10, intelligence: 10, constitution: 10, wisdom: 10 });
        entityA.statBlock = { ...DEFAULT_STATS, damage: 100, hp: 1000 };

        entityB = new Entity('B', 'Villain', { strength: 10, dexterity: 10, intelligence: 10, constitution: 10, wisdom: 10 });
        entityB.statBlock = { ...DEFAULT_STATS, damage: 100, hp: 1000 };
    });

    it('should cast a buff spell and apply it to self', () => {
        // Give Entity A a buff spell
        const buffSpell = createEmptySpell();
        buffSpell.name = 'Rage';
        buffSpell.type = 'buff';
        buffSpell.targetStat = 'damage';
        buffSpell.effect = 50; // +50% damage
        buffSpell.eco = 3; // 3 turns
        entityA.spells = [buffSpell];

        let state = createCombatState([entityA], [entityB]);

        // Run round 1
        // RNG 0.4 < 0.5, so spell should be cast
        state = resolveCombatRound(state, rng);

        // Check log for cast message
        const castLog = state.log.find(l => l.type === 'buff' && l.message.includes('casts Rage'));
        expect(castLog).toBeDefined();

        // Check effects on Entity A
        const effectsA = state.entityEffects.get(entityA.id);
        expect(effectsA).toBeDefined();
        expect(effectsA?.length).toBe(1);
        expect(effectsA?.[0].name).toBe('Rage');
        expect(effectsA?.[0].duration).toBe(3);
    });

    it('should cast a debuff spell and apply it to enemy', () => {
        // Give Entity A a debuff spell
        const debuffSpell = createEmptySpell();
        debuffSpell.name = 'Weaken';
        debuffSpell.type = 'debuff';
        debuffSpell.targetStat = 'damage';
        debuffSpell.effect = 20; // -20% damage (logic handles sign)
        debuffSpell.eco = 2;
        entityA.spells = [debuffSpell];

        let state = createCombatState([entityA], [entityB]);

        // Run round 1
        state = resolveCombatRound(state, rng);

        // Check log
        const castLog = state.log.find(l => l.type === 'debuff' && l.message.includes('casts Weaken'));
        expect(castLog).toBeDefined();

        // Check effects on Entity B (target)
        const effectsB = state.entityEffects.get(entityB.id);
        expect(effectsB).toBeDefined();
        expect(effectsB?.length).toBe(1);
        expect(effectsB?.[0].name).toBe('Weaken');
    });

    it('should modify stats during combat', () => {
        // Give Entity A a buff spell
        const buffSpell = createEmptySpell();
        buffSpell.name = 'Might';
        buffSpell.type = 'buff';
        buffSpell.targetStat = 'damage';
        buffSpell.effect = 100; // +100% damage (doubles damage)
        buffSpell.eco = 2;
        entityA.spells = [buffSpell];

        let state = createCombatState([entityA], [entityB]);

        // Round 1: Cast Buff
        state = resolveCombatRound(state, rng);

        // Clear log for next round
        state.log = [];

        // Remove spell so A attacks in Round 2
        entityA.spells = [];

        // Round 2: Attack with Buff
        // RNG 0.4 means hit (assuming hit chance > 40%)
        state = resolveCombatRound(state, rng);

        // Check damage log
        const attackLog = state.log.find(l => l.type === 'attack');
        expect(attackLog).toBeDefined();
        // Base damage 100. Buff +100% -> 200.
        // B has default armor (0?).
        // Damage should be around 200.
        // Note: Logic applies mitigation. If armor is 0, damage is 200.
        // Let's check the message content roughly
        expect(attackLog?.message).toMatch(/attacks .* for 200 damage/);
    });

    it('should tick down duration', () => {
        const buffSpell = createEmptySpell();
        buffSpell.name = 'Brief';
        buffSpell.type = 'buff';
        buffSpell.targetStat = 'damage';
        buffSpell.effect = 10;
        buffSpell.eco = 1; // 1 turn duration
        entityA.spells = [buffSpell];

        let state = createCombatState([entityA], [entityB]);

        // Round 1: Cast (Duration starts at 1)
        state = resolveCombatRound(state, rng);
        let effectsA = state.entityEffects.get(entityA.id);
        expect(effectsA?.[0].duration).toBe(1);

        // Round 2: Tick down (at end of turn). Duration becomes 0 -> removed.
        // But wait, logic.ts calls tickDuration at START of turn (lines 79-86 in original, now lines 80+ in new).
        // Actually, I placed it inside the loop:
        // effectManager.tickDuration(effectedChar);
        // This happens AFTER processing effects but BEFORE combat action?
        // Let's check logic.ts placement.
        // It's inside the "STATUS EFFECTS" loop at the start of resolveCombatRound.
        // So in Round 2, it will tick down the effect applied in Round 1.
        // If duration was 1, it becomes 0 and is removed.
        // So in Round 2 action, the buff is gone?
        // Let's verify.

        entityA.spells = []; // Prevent recasting
        state = resolveCombatRound(state, rng);

        effectsA = state.entityEffects.get(entityA.id);
        expect(effectsA?.length).toBe(0);
    });
});
