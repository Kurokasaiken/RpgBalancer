import { describe, it, expect, beforeEach } from 'vitest';
import {
    StatusEffectManager,
    StatusEffectFactory,
    type EffectedCharacter
} from '../StatusEffectManager';
import { BASELINE_STATS } from '../../baseline';

describe('StatusEffectManager', () => {
    let manager: StatusEffectManager;
    let character: EffectedCharacter;

    beforeEach(() => {
        manager = new StatusEffectManager();
        character = {
            id: 'test_char',
            name: 'Test Character',
            baseStats: { ...BASELINE_STATS },
            statusEffects: []
        };
    });

    describe('Stun Effect', () => {
        it('should apply a stun effect', () => {
            const stun = StatusEffectFactory.createStun(2);

            const applied = manager.applyEffect(character, stun);

            expect(applied).toBe(true);
            expect(character.statusEffects).toHaveLength(1);
            expect(character.statusEffects[0].type).toBe('stun');
            expect(character.statusEffects[0].duration).toBe(2);
        });

        it('should prevent character from acting when stunned', () => {
            const stun = StatusEffectFactory.createStun(1);
            manager.applyEffect(character, stun);

            const result = manager.processEffects(character);

            expect(result.canAct).toBe(false);
            expect(result.canMove).toBe(false);
            expect(result.canCast).toBe(false);
        });

        it('should refresh stun duration instead of stacking', () => {
            const stun1 = StatusEffectFactory.createStun(2);
            const stun2 = StatusEffectFactory.createStun(5);

            manager.applyEffect(character, stun1);
            manager.applyEffect(character, stun2);

            // Should have only 1 stun with duration 5 (the longer one)
            expect(character.statusEffects).toHaveLength(1);
            expect(character.statusEffects[0].duration).toBe(5);
        });

        it('should tick down stun duration', () => {
            const stun = StatusEffectFactory.createStun(3);
            manager.applyEffect(character, stun);

            manager.tickDuration(character);
            expect(character.statusEffects[0].duration).toBe(2);

            manager.tickDuration(character);
            expect(character.statusEffects[0].duration).toBe(1);

            manager.tickDuration(character);
            // Should be removed at duration 0
            expect(character.statusEffects).toHaveLength(0);
        });
    });

    describe('Buff/Debuff Effects', () => {
        it('should apply a damage buff', () => {
            const buff = StatusEffectFactory.createBuff(
                { damage: 20 },
                3,
                'Strength Potion'
            );

            manager.applyEffect(character, buff);

            const effectiveStats = manager.getEffectiveStats(character);
            expect(effectiveStats.damage).toBe(BASELINE_STATS.damage + 20);
        });

        it('should apply an armor debuff', () => {
            const debuff = StatusEffectFactory.createDebuff(
                { armor: -50 },
                2,
                'Armor Break'
            );

            manager.applyEffect(character, debuff);

            const effectiveStats = manager.getEffectiveStats(character);
            expect(effectiveStats.armor).toBe(BASELINE_STATS.armor - 50);
        });

        it('should stack multiple different buffs', () => {
            const damageBuff = StatusEffectFactory.createBuff({ damage: 10 }, 3, 'Strength');
            const agilityBuff = StatusEffectFactory.createBuff({ agility: 20 }, 3, 'Speed');

            manager.applyEffect(character, damageBuff);
            manager.applyEffect(character, agilityBuff);

            const stats = manager.getEffectiveStats(character);
            expect(stats.damage).toBe(BASELINE_STATS.damage + 10);
            expect(stats.agility).toBe(BASELINE_STATS.agility + 20);
        });

        it('should return modified stats in processEffects', () => {
            const buff = StatusEffectFactory.createBuff({ damage: 15, txc: 10 }, 2);
            manager.applyEffect(character, buff);

            const result = manager.processEffects(character);

            expect(result.modifiedStats?.damage).toBe(15);
            expect(result.modifiedStats?.txc).toBe(10);
        });
    });

    describe('Damage/Healing Over Time', () => {
        it('should apply DoT damage each turn', () => {
            const poison = StatusEffectFactory.createDoT(5, 3, 'Poison');
            manager.applyEffect(character, poison);

            const result = manager.processEffects(character);

            expect(result.damageReceived).toBe(5);
        });

        it('should apply HoT healing each turn', () => {
            const regen = StatusEffectFactory.createHoT(10, 5, 'Regeneration');
            manager.applyEffect(character, regen);

            const result = manager.processEffects(character);

            expect(result.healingReceived).toBe(10);
        });

        it('should stack multiple DoTs', () => {
            const poison = StatusEffectFactory.createDoT(5, 3, 'Poison');
            const bleed = StatusEffectFactory.createDoT(8, 2, 'Bleed');

            manager.applyEffect(character, poison);
            manager.applyEffect(character, bleed);

            const result = manager.processEffects(character);

            expect(result.damageReceived).toBe(13); // 5 + 8
            expect(character.statusEffects).toHaveLength(2);
        });
    });

    describe('Root Effect', () => {
        it('should prevent movement but allow actions', () => {
            const root = StatusEffectFactory.createRoot(2);
            manager.applyEffect(character, root);

            const result = manager.processEffects(character);

            expect(result.canMove).toBe(false);
            expect(result.canAct).toBe(true); // Can still attack
            expect(result.canCast).toBe(true); // Can still cast
        });
    });

    describe('Complex Scenarios', () => {
        it('should handle stun + DoT combo', () => {
            const stun = StatusEffectFactory.createStun(2);
            const poison = StatusEffectFactory.createDoT(7, 3, 'Poison');

            manager.applyEffect(character, stun);
            manager.applyEffect(character, poison);

            const result = manager.processEffects(character);

            expect(result.canAct).toBe(false); // Stunned
            expect(result.damageReceived).toBe(7); // Still takes poison damage
        });

        it('should handle buff + debuff canceling out', () => {
            const damageBuff = StatusEffectFactory.createBuff({ damage: 20 }, 3);
            const damageDebuff = StatusEffectFactory.createDebuff({ damage: -20 }, 2);

            manager.applyEffect(character, damageBuff);
            manager.applyEffect(character, damageDebuff);

            const stats = manager.getEffectiveStats(character);
            expect(stats.damage).toBe(BASELINE_STATS.damage); // +20 -20 = 0
        });

        it('should process multiple effects in sequence', () => {
            const buff = StatusEffectFactory.createBuff({ damage: 10 }, 3);
            const dot = StatusEffectFactory.createDoT(5, 2);
            const hot = StatusEffectFactory.createHoT(3, 4);

            manager.applyEffect(character, buff);
            manager.applyEffect(character, dot);
            manager.applyEffect(character, hot);

            const result = manager.processEffects(character);

            expect(result.damageReceived).toBe(5);
            expect(result.healingReceived).toBe(3);
            expect(result.modifiedStats?.damage).toBe(10);
        });

        it('should expire effects independently', () => {
            const shortStun = StatusEffectFactory.createStun(1);
            const longPoison = StatusEffectFactory.createDoT(5, 5, 'Poison');

            manager.applyEffect(character, shortStun);
            manager.applyEffect(character, longPoison);

            expect(character.statusEffects).toHaveLength(2);

            manager.tickDuration(character);
            // Stun expires, poison has 4 turns left
            expect(character.statusEffects).toHaveLength(1);
            expect(character.statusEffects[0].type).toBe('dot');
            expect(character.statusEffects[0].duration).toBe(4);
        });
    });

    describe('Helper Methods', () => {
        it('should check if character has a specific effect', () => {
            const stun = StatusEffectFactory.createStun(2);
            manager.applyEffect(character, stun);

            expect(manager.hasEffect(character, 'stun')).toBe(true);
            expect(manager.hasEffect(character, 'buff')).toBe(false);
        });

        it('should get effects by type', () => {
            const poison = StatusEffectFactory.createDoT(5, 3, 'Poison');
            const bleed = StatusEffectFactory.createDoT(8, 2, 'Bleed');
            const buff = StatusEffectFactory.createBuff({ damage: 10 }, 3);

            manager.applyEffect(character, poison);
            manager.applyEffect(character, bleed);
            manager.applyEffect(character, buff);

            const dots = manager.getEffectsByType(character, 'dot');
            expect(dots).toHaveLength(2);
            expect(dots.every(e => e.type === 'dot')).toBe(true);
        });

        it('should remove effects by type', () => {
            const stun = StatusEffectFactory.createStun(2);
            const poison = StatusEffectFactory.createDoT(5, 3);

            manager.applyEffect(character, stun);
            manager.applyEffect(character, poison);

            manager.removeEffectsByType(character, 'stun');

            expect(character.statusEffects).toHaveLength(1);
            expect(character.statusEffects[0].type).toBe('dot');
        });

        it('should remove effect by ID', () => {
            const stun = StatusEffectFactory.createStun(2);
            manager.applyEffect(character, stun);

            const stunId = character.statusEffects[0].id;
            manager.removeEffectById(character, stunId);

            expect(character.statusEffects).toHaveLength(0);
        });
    });
});
