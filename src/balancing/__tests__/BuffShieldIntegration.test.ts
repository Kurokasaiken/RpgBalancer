/**
 * Buff/Shield Integration Test
 * 
 * Tests complete DoT/Buff/Shield system in combat scenarios
 */

import { describe, it, expect } from 'vitest';
import { Entity } from '../../engine/core/entity';
import { createCombatState } from '../../engine/combat/state';
import { resolveCombatRound } from '../../engine/combat/logic';
import { DotModule, type PeriodicEffect } from '../modules/dot';
import { BuffModule, type Buff } from '../modules/buffs';
import { DEFAULT_STATS } from '../types';
import { createTestRNG } from './TestRNG';
import type { StatBlock } from '../types';

function createTestEntity(name: string, stats: Partial<StatBlock> = {}) {
    const fullStats: StatBlock = {
        ...DEFAULT_STATS,
        critChance: 0, // Disable crit for deterministic testing
        failChance: 0, // Disable fail for deterministic testing
        ...stats
    };
    const rng = createTestRNG(1);
    const id = `test_${name}_${rng().toString(36).substr(2, 9)}`;
    return Entity.fromStatBlock(id, name, fullStats);
}

describe('DoT/Buff/Shield Integration', () => {
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
            const damageBuff: Buff = {
                id: 'damage_boost',
                source: 'Test Spell',
                type: 'stat_modifier',
                stat: 'damage',
                value: 10,
                mode: 'additive',
                duration: 3,
            };

            const attackerEffects = state.entityEffects.get(attacker.id);
            if (attackerEffects) {
                attackerEffects.buffs = BuffModule.addBuff(attackerEffects.buffs, damageBuff);
            }

            // Initial HP
            const initialHp = defender.currentHp;

            // Resolve one round
            resolveCombatRound(state);

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
            const armorDebuff: Buff = {
                id: 'armor_shred',
                source: 'Curse',
                type: 'stat_modifier',
                stat: 'armor',
                value: -10, // Negative = debuff!
                mode: 'additive',
                duration: 3,
            };

            const defenderEffects = state.entityEffects.get(defender.id);
            if (defenderEffects) {
                defenderEffects.buffs = BuffModule.addBuff(defenderEffects.buffs, armorDebuff);
            }

            // Resolve round
            const initialHp = defender.currentHp;
            resolveCombatRound(state);

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
            const shield: Buff = {
                id: 'shield',
                source: 'Shield Spell',
                type: 'shield',
                shieldAmount: 30,
                currentShield: 30,
                duration: 5,
            };

            const shieldedEffects = state.entityEffects.get(shielded.id);
            if (shieldedEffects) {
                shieldedEffects.buffs = BuffModule.addBuff(shieldedEffects.buffs, shield);
            }

            const initialHp = shielded.currentHp;

            // Resolve round - 50 damage, 30 absorbed by shield
            resolveCombatRound(state);

            // HP should only lose 20 (50 - 30 shield)
            const hpLost = initialHp - shielded.currentHp;
            expect(hpLost).toBeLessThanOrEqual(25); // 20 + variance

            // Check shield absorption logged
            const shieldLogs = state.log.filter(l => l.message.includes('shield absorbs'));
            expect(shieldLogs.length).toBeGreaterThan(0);
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
            const shield: Buff = {
                id: 'shield',
                source: 'Shield Spell',
                type: 'shield',
                shieldAmount: 20,
                currentShield: 20,
                duration: 5,
            };

            const shieldedEffects = state.entityEffects.get(shielded.id);
            if (shieldedEffects) {
                shieldedEffects.buffs = BuffModule.addBuff(shieldedEffects.buffs, shield);
            }

            const initialHp = shielded.currentHp;

            // 100 damage - 20 shield = 80 to HP
            resolveCombatRound(state);

            const hpLost = initialHp - shielded.currentHp;
            expect(hpLost).toBeGreaterThanOrEqual(75);
            expect(hpLost).toBeLessThanOrEqual(85);

            // Shield should be depleted (removed from buffs)
            if (shieldedEffects) {
                const remainingShields = shieldedEffects.buffs.filter(b => b.type === 'shield');
                expect(remainingShields.length).toBe(0);
            }
        });
    });

    describe('DoT Ticks', () => {
        it('should apply DoT damage at turn start', () => {
            const entity1 = createTestEntity('Entity1', { ...DEFAULT_STATS, hp: 100, damage: 0, txc: -100 });
            const entity2 = createTestEntity('Entity2', { ...DEFAULT_STATS, hp: 100, damage: 0, txc: -100 });

            const state = createCombatState([entity1], [entity2]);

            // Add poison DoT to entity1
            const poison: PeriodicEffect = {
                id: 'poison',
                source: 'Poison Cloud',
                type: 'damage',
                amountPerTurn: -5,
                duration: 3,
                currentStacks: 1
            };

            const effects = state.entityEffects.get(entity1.id);
            if (effects) {
                effects.dots = DotModule.addEffect(effects.dots, poison);
            }

            const initialHp = entity1.currentHp;

            // Resolve round
            resolveCombatRound(state);

            // Should have lost 5 HP from poison
            const hpLost = initialHp - entity1.currentHp;
            expect(hpLost).toBe(5);

            // Check DoT logged
            const dotLogs = state.log.filter(l => l.message.includes('takes') && l.message.includes('Poison'));
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
            const mageEffects = state.entityEffects.get(mage.id);
            if (mageEffects) {
                mageEffects.buffs = BuffModule.addBuff(mageEffects.buffs, {
                    id: 'power',
                    source: 'Spell',
                    type: 'stat_modifier',
                    stat: 'damage',
                    value: 20,
                    mode: 'additive',
                    duration: 5,
                });
            }

            // Warrior has: Shield + Poison DoT
            const warriorEffects = state.entityEffects.get(warrior.id);
            if (warriorEffects) {
                // Shield
                warriorEffects.buffs = BuffModule.addBuff(warriorEffects.buffs, {
                    id: 'shield',
                    source: 'Shield',
                    type: 'shield',
                    shieldAmount: 25,
                    currentShield: 25,
                    duration: 5,
                });

                // Poison
                warriorEffects.dots = DotModule.addEffect(warriorEffects.dots, {
                    id: 'poison',
                    source: 'Poison',
                    type: 'damage',
                    amountPerTurn: -3,
                    duration: 4,
                    currentStacks: 1
                });
            }

            const initialHp = warrior.currentHp;

            // Resolve round
            // 1. Poison tick: -3 HP
            // 2. Mage attacks for 50 (30+20 buff), shield absorbs 25, HP takes 25
            resolveCombatRound(state);

            const totalHpLost = initialHp - warrior.currentHp;

            // Should be around 28 (3 poison + 25 from attack after shield)
            expect(totalHpLost).toBeGreaterThanOrEqual(25);
            expect(totalHpLost).toBeLessThanOrEqual(32);

            // Verify logs
            expect(state.log.filter(l => l.message.includes('Poison')).length).toBeGreaterThan(0);
            expect(state.log.filter(l => l.message.includes('shield')).length).toBeGreaterThan(0);
        });
    });
});
