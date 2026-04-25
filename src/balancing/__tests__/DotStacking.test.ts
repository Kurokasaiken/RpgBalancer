/**
 * DoT Stack Mode Testing
 * 
 * Comprehensive tests for all 5 stacking modes to ensure correct behavior
 */

import { describe, it, expect } from 'vitest';
import { DotModule, type PeriodicEffect, type StackMode } from '../modules/dot';

function createTestDot(
    id: string,
    damage: number,
    duration: number,
    stackMode: StackMode,
    maxStacks?: number
): PeriodicEffect {
    return {
        id,
        source: 'Test Spell',
        type: 'damage',
        amountPerTurn: damage,
        duration,
        stackMode,
        maxStacks,
        currentStacks: 1
    };
}

describe('DoT Stack Modes', () => {
    describe('Mode: none (Non-stackable)', () => {
        it('should only refresh duration when reapplied', () => {
            const dot1 = createTestDot('bleed', -5, 3, 'none');
            const dot2 = createTestDot('bleed', -5, 5, 'none');

            let effects: PeriodicEffect[] = [];

            // First application
            effects = DotModule.addEffect(effects, dot1);
            expect(effects).toHaveLength(1);
            expect(effects[0].duration).toBe(3);
            expect(effects[0].currentStacks).toBe(1);

            // Reapplication - should refresh duration
            effects = DotModule.addEffect(effects, dot2);
            expect(effects).toHaveLength(1);
            expect(effects[0].duration).toBe(5); // Refreshed!
            expect(effects[0].currentStacks).toBe(1); // No stack increase
        });
    });

    describe('Mode: separate (Darkest Dungeon)', () => {
        it('should create separate instances with independent durations', () => {
            const dot = createTestDot('bleed', -3, 3, 'separate');

            let effects: PeriodicEffect[] = [];

            // Apply 3 times
            effects = DotModule.addEffect(effects, dot);
            effects = DotModule.addEffect(effects, dot);
            effects = DotModule.addEffect(effects, dot);

            expect(effects).toHaveLength(3);
            effects.forEach(e => {
                expect(e.duration).toBe(3);
                expect(e.currentStacks).toBe(1);
            });

            // Calculate total damage
            const total = DotModule.calculateTotalPerTurn(effects);
            expect(total.damage).toBe(9); // 3 * 3

            // Tick durations
            effects = DotModule.tickDurations(effects);
            expect(effects).toHaveLength(3); // All still active
            effects.forEach(e => expect(e.duration).toBe(2));
        });
    });

    describe('Mode: increment (WoW/PoE - No Refresh)', () => {
        it('should increment stacks but NOT refresh duration', () => {
            const dot = createTestDot('poison', -4, 4, 'increment');

            let effects: PeriodicEffect[] = [];

            // Turn 1: First application
            effects = DotModule.addEffect(effects, dot);
            expect(effects).toHaveLength(1);
            expect(effects[0].currentStacks).toBe(1);
            expect(effects[0].duration).toBe(4);

            // Tick
            effects = DotModule.tickDurations(effects);
            expect(effects[0].duration).toBe(3);

            // Turn 2: Reapplication
            effects = DotModule.addEffect(effects, dot);
            expect(effects).toHaveLength(1);
            expect(effects[0].currentStacks).toBe(2);
            expect(effects[0].duration).toBe(3); // NOT refreshed!

            // Tick
            effects = DotModule.tickDurations(effects);
            expect(effects[0].duration).toBe(2);

            // Turn 3: Another application
            effects = DotModule.addEffect(effects, dot);
            expect(effects[0].currentStacks).toBe(3);
            expect(effects[0].duration).toBe(2); // Still NOT refreshed

            // Calculate damage
            const total = DotModule.calculateTotalPerTurn(effects);
            expect(total.damage).toBe(12); // 4 * 3 stacks

            // Eventually expires completely
            effects = DotModule.tickDurations(effects);
            effects = DotModule.tickDurations(effects);
            expect(effects).toHaveLength(0); // All stacks expired together
        });
    });

    describe('Mode: increment_refresh (League of Legends)', () => {
        it('should increment stacks AND refresh duration', () => {
            const dot = createTestDot('burn', -2, 3, 'increment_refresh');

            let effects: PeriodicEffect[] = [];

            // Apply
            effects = DotModule.addEffect(effects, dot);
            expect(effects[0].currentStacks).toBe(1);
            expect(effects[0].duration).toBe(3);

            // Tick twice
            effects = DotModule.tickDurations(effects);
            effects = DotModule.tickDurations(effects);
            expect(effects[0].duration).toBe(1);

            // Reapply - should refresh!
            effects = DotModule.addEffect(effects, dot);
            expect(effects[0].currentStacks).toBe(2);
            expect(effects[0].duration).toBe(3); // Refreshed!

            // Can maintain high stacks by reapplying
            for (let i = 0; i < 5; i++) {
                effects = DotModule.addEffect(effects, dot);
            }
            expect(effects[0].currentStacks).toBe(7);
            expect(effects[0].duration).toBe(3); // Always refreshed
        });
    });

    describe('Mode: increment_capped (League with Cap)', () => {
        it('should increment stacks + refresh but respect cap', () => {
            const dot = createTestDot('frostbite', -3, 4, 'increment_capped', 5);

            let effects: PeriodicEffect[] = [];

            // Stack to cap
            for (let i = 0; i < 10; i++) {
                effects = DotModule.addEffect(effects, dot);
            }

            expect(effects).toHaveLength(1);
            expect(effects[0].currentStacks).toBe(5); // Capped at 5!
            expect(effects[0].duration).toBe(4); // Refreshed

            // Calculate damage
            const total = DotModule.calculateTotalPerTurn(effects);
            expect(total.damage).toBe(15); // 3 * 5 (capped)
        });

        it('should still refresh duration at cap', () => {
            const dot = createTestDot('shock', -2, 3, 'increment_capped', 3);

            let effects: PeriodicEffect[] = [];

            // Reach cap
            effects = DotModule.addEffect(effects, dot);
            effects = DotModule.addEffect(effects, dot);
            effects = DotModule.addEffect(effects, dot);
            expect(effects[0].currentStacks).toBe(3);

            // Tick down
            effects = DotModule.tickDurations(effects);
            effects = DotModule.tickDurations(effects);
            expect(effects[0].duration).toBe(1);

            // Reapply at cap - duration refreshes but stacks don't increase
            effects = DotModule.addEffect(effects, dot);
            expect(effects[0].currentStacks).toBe(3); // Still 3
            expect(effects[0].duration).toBe(3); // Refreshed!
        });
    });

    describe('Real Combat Scenarios', () => {
        it('should handle mixed stack modes correctly', () => {
            let effects: PeriodicEffect[] = [];

            // Bleed (separate instances)
            const bleed = createTestDot('bleed', -2, 3, 'separate');
            effects = DotModule.addEffect(effects, bleed);
            effects = DotModule.addEffect(effects, bleed);

            // Poison (increment no refresh)
            const poison = createTestDot('poison', -5, 4, 'increment');
            effects = DotModule.addEffect(effects, poison);
            effects = DotModule.addEffect(effects, poison);

            // Total: 2 bleeds + 1 poison (2 stacks)
            expect(effects).toHaveLength(3);

            const total = DotModule.calculateTotalPerTurn(effects);
            // 2 * -2 (bleeds) + 2 * -5 (poison stacks) = -4 + -10 = -14
            expect(total.damage).toBe(14);
        });
    });
});
