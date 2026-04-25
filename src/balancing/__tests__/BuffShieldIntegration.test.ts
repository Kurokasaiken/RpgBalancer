/**
 * Buff/Shield Integration Test
 * 
 * Tests complete DoT/Buff/Shield system in combat scenarios
 */

import { describe, it, expect } from 'vitest';
import { Entity } from '../../engine/core/entity';
import { createCombatState, type CombatState } from '../../engine/combat/state';
import { resolveCombatRound } from '../../engine/combat/logic';
import {
    StatusEffectFactory,
    StatusEffectManager,
    type EffectedCharacter,
    type ShieldEffect,
    type AnyStatusEffect,
} from '../statusEffects/StatusEffectManager';
import { DEFAULT_STATS } from '../types';
import type { StatBlock } from '../types';
import { createTestRNG } from '../utils/TestRNG';
import type { Entity as CombatEntity } from '../../engine/core/entity';

const deterministicRng = createTestRNG(1);

let entityCounter = 0;

function createTestEntity(name: string, stats: Partial<StatBlock> = {}) {
    const fullStats: StatBlock = {
        ...DEFAULT_STATS,
        critChance: 0, // Disable crit for deterministic testing
        failChance: 0, // Disable fail for deterministic testing
        ...stats
    };
    const id = `test_${name}_${entityCounter++}`;
    return Entity.fromStatBlock(id, name, fullStats);
}

describe('DoT/Buff/Shield Integration', () => {
    const effectManager = new StatusEffectManager();

    const findEntity = (state: CombatState, targetId: string): CombatEntity | undefined => {
        return [...state.teamA, ...state.teamB].find(entity => entity.id === targetId);
    };

    const applyEffect = (state: CombatState, targetId: string, effect: AnyStatusEffect) => {
        const targetEntity = findEntity(state, targetId);
        if (!targetEntity) {
            throw new Error(`Entity ${targetId} not found in combat state`);
        }

        const currentEffects = state.entityEffects.get(targetId) ?? [];
        const adapter: EffectedCharacter = {
            id: targetEntity.id,
            name: targetEntity.name,
            baseStats: targetEntity.statBlock ?? DEFAULT_STATS,
            statusEffects: currentEffects,
        };

        effectManager.applyEffect(adapter, effect);
        state.entityEffects.set(targetId, adapter.statusEffects);
    };

    describe('Buff Stat Modifiers', () => {
        it('should apply damage buff to attacker', () => {
            const attacker = createTestEntity('Buffed', {
                hp: 100,
                damage: 20,
                armor: 0,
                txc: 100 // Ensure hit
            });

            const defender = createTestEntity('Defender', {
                ...DEFAULT_STATS,
                hp: 100,
                damage: 0,
                armor: 0,
                txc: -100 // Ensure miss (no return damage)
            });

            const state = createCombatState([attacker], [defender]);

            // Add +10 damage buff to attacker
            const damageBuff = StatusEffectFactory.createBuff({ damage: 10 }, 3, 'Damage Boost', 'Test Spell');
            applyEffect(state, attacker.id, damageBuff);

            // Initial HP
            const initialHp = defender.currentHp;

            // Resolve one round
            resolveCombatRound(state, deterministicRng);

            // Should deal 30 damage (20 base + 10 buff)
            const damageTaken = initialHp - defender.currentHp;
            expect(damageTaken).toBeGreaterThanOrEqual(28); // Account for variance
            expect(damageTaken).toBeLessThanOrEqual(32);
        });

        it('should apply armor debuff to defender', () => {
            const attacker = createTestEntity('Attacker', {
                ...DEFAULT_STATS,
                hp: 100,
                damage: 50,
                armor: 0
            });

            const defender = createTestEntity('Debuffed', {
                ...DEFAULT_STATS,
                hp: 100,
                damage: 0,
                armor: 20, // Should be reduced
                txc: -100 // Ensure miss
            });

            const state = createCombatState([attacker], [defender]);

            // Add -10 armor debuff to defender
            const armorDebuff = StatusEffectFactory.createDebuff({ armor: -10 }, 3, 'Armor Shred', 'Curse');
            applyEffect(state, defender.id, armorDebuff);

            // Resolve round
            const initialHp = defender.currentHp;
            resolveCombatRound(state, deterministicRng);

            // Debuffed armor (10 instead of 20) = more damage taken
            const damageTaken = initialHp - defender.currentHp;
            expect(damageTaken).toBeGreaterThan(0);

            // Check combat log mentions the attack
            const attackLogs = state.log.filter(l => l.type === 'attack');
            expect(attackLogs.length).toBeGreaterThan(0);
        });
    });

    describe('Shield Absorption', () => {
        it('should absorb damage with shields before HP damage', () => {
            const attacker = createTestEntity('Attacker', {
                ...DEFAULT_STATS,
                hp: 100,
                damage: 50,
                armor: 0
            });

            const shielded = createTestEntity('Shielded', {
                ...DEFAULT_STATS,
                hp: 100,
                damage: 0,
                armor: 0
            });

            const state = createCombatState([attacker], [shielded]);

            // Add shield buff
            const shield = StatusEffectFactory.createShield('Shield Spell', 30, 5, 'Shield Spell');
            applyEffect(state, shielded.id, shield);

            const initialHp = shielded.currentHp;

            // Resolve round - 50 damage, 30 absorbed by shield
            resolveCombatRound(state, deterministicRng);

            // HP should only lose 20 (50 - 30 shield)
            const hpLost = initialHp - shielded.currentHp;
            expect(hpLost).toBeLessThanOrEqual(25); // 20 + variance

            // Check shield absorption logged
            const shieldLogs = state.log.filter(l => l.message.includes('shield absorbs'));
            expect(shieldLogs.length).toBeGreaterThan(0);

            const remainingShields = (state.entityEffects.get(shielded.id) ?? []).filter(
                effect => effect.type === 'shield',
            );
            expect(remainingShields).toHaveLength(0);
        });

        it('should deplete shield and overflow to HP', () => {
            const attacker = createTestEntity('Attacker', {
                ...DEFAULT_STATS,
                hp: 100,
                damage: 100,
                armor: 0,
                txc: 100 // Ensure hit
            });

            const shielded = createTestEntity('Shielded', {
                ...DEFAULT_STATS,
                hp: 100,
                damage: 0,
                armor: 0,
                txc: -100 // Ensure miss
            });

            const state = createCombatState([attacker], [shielded]);

            // Small shield
            applyEffect(
                state,
                shielded.id,
                StatusEffectFactory.createShield('Shield Spell', 20, 5, 'Shield Spell'),
            );

            const initialHp = shielded.currentHp;

            // 100 damage - 20 shield = 80 to HP
            resolveCombatRound(state, deterministicRng);

            const hpLost = initialHp - shielded.currentHp;
            expect(hpLost).toBeGreaterThanOrEqual(75);
            expect(hpLost).toBeLessThanOrEqual(85);

            // Shield should be depleted (removed from buffs)
            const remainingShield = (state.entityEffects.get(shielded.id) ?? []).find(
                effect => effect.type === 'shield' && (effect as ShieldEffect).currentShield,
            );
            expect(remainingShield).toBeUndefined();
        });

        it('should stack shields when effect is marked as stackable', () => {
            const attacker = createTestEntity('Burst', {
                ...DEFAULT_STATS,
                hp: 100,
                damage: 60,
                armor: 0,
                txc: 100 // Ensure hit
            });

            const shielded = createTestEntity('Layered', {
                ...DEFAULT_STATS,
                hp: 100,
                damage: 0,
                armor: 0,
                txc: -100 // Ensure miss
            });

            const state = createCombatState([attacker], [shielded]);

            const firstShield = {
                ...StatusEffectFactory.createShield('Layered Shield', 20, 5, 'Shield Spell'),
                id: 'stackable_shield_1',
                stackable: true
            };

            const secondShield = {
                ...StatusEffectFactory.createShield('Layered Shield', 20, 5, 'Shield Spell'),
                id: 'stackable_shield_2',
                stackable: true
            };

            applyEffect(state, shielded.id, firstShield);
            applyEffect(state, shielded.id, secondShield);

            const shields = (state.entityEffects.get(shielded.id) ?? []).filter(
                effect => effect.type === 'shield',
            );
            expect(shields).toHaveLength(2);
            expect(
                shields.every(shield => (shield as ShieldEffect).currentShield === 20),
            ).toBe(true);

            const initialHp = shielded.currentHp;
            resolveCombatRound(state, deterministicRng);

            const hpLost = initialHp - shielded.currentHp;
            expect(hpLost).toBeGreaterThanOrEqual(15);
            expect(hpLost).toBeLessThanOrEqual(25);

            const shieldLogs = state.log.filter(l => l.message.includes('shield absorbs'));
            expect(shieldLogs.length).toBeGreaterThan(0);
        });
    });

    describe('DoT Ticks', () => {
        it('should apply DoT damage at turn start', () => {
            const entity1 = createTestEntity('Entity1', { ...DEFAULT_STATS, hp: 100, damage: 0, txc: -100 });
            const entity2 = createTestEntity('Entity2', { ...DEFAULT_STATS, hp: 100, damage: 0, txc: -100 });
            const state = createCombatState([entity1], [entity2]);

            // Add poison DoT to entity1
            const poison = StatusEffectFactory.createDoT(5, 3, 'Poison Cloud', 'Poison Cloud');
            applyEffect(state, entity1.id, poison);

            const initialHp = entity1.currentHp;

            // Resolve round
            resolveCombatRound(state, deterministicRng);

            // Should have lost 5 HP from poison
            const hpLost = initialHp - entity1.currentHp;
            expect(hpLost).toBe(5);

            // Check DoT logged
            const dotLogs = state.log.filter(l => l.type === 'dot' && l.targetId === entity1.id);
            expect(dotLogs.length).toBeGreaterThan(0);
        });
    });

    describe('Full Scenario: Buff + Shield + DoT', () => {
        it('should handle complex interactions correctly', () => {
            const mage = createTestEntity('Mage', {
                ...DEFAULT_STATS,
                hp: 100,
                damage: 30,
                armor: 0,
                txc: 100 // Ensure hit
            });

            const warrior = createTestEntity('Warrior', {
                ...DEFAULT_STATS,
                hp: 100,
                damage: 0,
                armor: 10,
                txc: -100 // Ensure miss
            });

            const state = createCombatState([mage], [warrior]);

            // Mage has: +20 damage buff
            applyEffect(
                state,
                mage.id,
                StatusEffectFactory.createBuff({ damage: 20 }, 5, 'Power Surge', 'Spell'),
            );

            // Warrior has: Shield + Poison DoT
            applyEffect(
                state,
                warrior.id,
                StatusEffectFactory.createShield('Shield', 25, 5, 'Shield'),
            );

            applyEffect(
                state,
                warrior.id,
                StatusEffectFactory.createDoT(3, 4, 'Poison', 'Poison'),
            );

            const initialHp = warrior.currentHp;

            // Resolve round
            // 1. Poison tick: -3 HP
            // 2. Mage attacks for 50 (30+20 buff), shield absorbs 25, HP takes 25
            resolveCombatRound(state, deterministicRng);

            const totalHpLost = initialHp - warrior.currentHp;

            // Should be around 28 (3 poison + 25 from attack after shield)
            expect(totalHpLost).toBeGreaterThanOrEqual(25);
            expect(totalHpLost).toBeLessThanOrEqual(32);

            // Verify logs
            expect(state.log.filter(l => l.type === 'dot').length).toBeGreaterThan(0);
            expect(state.log.filter(l => l.message.includes('shield')).length).toBeGreaterThan(0);
        });
    });
});
