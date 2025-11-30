import { describe, it, expect } from 'vitest';
import { InitiativeModule } from '../initiative';

describe('InitiativeModule', () => {
    describe('calculateInitiative', () => {
        it('should calculate initiative with zero variance', () => {
            const result = InitiativeModule.calculateInitiative(50, 0);
            expect(result).toBe(50);
        });

        it('should calculate initiative with max variance', () => {
            const result = InitiativeModule.calculateInitiative(50, 1.0);
            expect(result).toBe(60); // 50 + (1.0 × 10)
        });

        it('should calculate initiative with mid variance', () => {
            const result = InitiativeModule.calculateInitiative(50, 0.5);
            expect(result).toBe(55); // 50 + (0.5 × 10)
        });

        it('should scale with different agility values', () => {
            expect(InitiativeModule.calculateInitiative(30, 0.5)).toBe(35);
            expect(InitiativeModule.calculateInitiative(80, 0.5)).toBe(85);
        });
    });

    describe('generateTurnOrder', () => {
        it('should order by base agility when variance is zero', () => {
            const characters = [
                { id: 'slow', agility: 30 },
                { id: 'fast', agility: 70 }
            ];

            const order = InitiativeModule.generateTurnOrder(
                characters,
                () => 0 // Zero variance
            );

            expect(order).toEqual(['fast', 'slow']);
        });

        it('should maintain stable order for ties', () => {
            const characters = [
                { id: 'char1', agility: 50 },
                { id: 'char2', agility: 50 },
                { id: 'char3', agility: 50 }
            ];

            const order = InitiativeModule.generateTurnOrder(
                characters,
                () => 0.5 // Same variance for all
            );

            // Should maintain input order when initiatives are equal
            expect(order).toEqual(['char1', 'char2', 'char3']);
        });

        it('should use seeded RNG consistently', () => {
            const characters = [
                { id: 'hero', agility: 50 },
                { id: 'enemy', agility: 50 }
            ];

            // Seeded RNG that alternates values
            let callCount = 0;
            const seededRng = () => {
                callCount++;
                return callCount % 2 === 0 ? 0.2 : 0.8;
            };

            const order = InitiativeModule.generateTurnOrder(characters, seededRng);

            // hero gets 0.8 variance (58), enemy gets 0.2 variance (52)
            expect(order).toEqual(['hero', 'enemy']);
        });

        it('should handle single character', () => {
            const characters = [{ id: 'solo', agility: 60 }];
            const order = InitiativeModule.generateTurnOrder(characters, () => 0.5);

            expect(order).toEqual(['solo']);
        });

        it('should handle multiple characters with varying agility', () => {
            const characters = [
                { id: 'tank', agility: 30 },
                { id: 'rogue', agility: 80 },
                { id: 'mage', agility: 50 },
                { id: 'warrior', agility: 40 }
            ];

            const order = InitiativeModule.generateTurnOrder(
                characters,
                () => 0.5 // Mid variance for all
            );

            // Expected order: rogue(85) > mage(55) > warrior(45) > tank(35)
            expect(order).toEqual(['rogue', 'mage', 'warrior', 'tank']);
        });
    });

    describe('generateDetailedRolls', () => {
        it('should return detailed initiative data', () => {
            const characters = [
                { id: 'hero', agility: 50 },
                { id: 'enemy', agility: 40 }
            ];

            const rolls = InitiativeModule.generateDetailedRolls(
                characters,
                () => 0.5
            );

            expect(rolls).toHaveLength(2);

            // Sorted by initiative descending
            expect(rolls[0].characterId).toBe('hero');
            expect(rolls[0].baseAgility).toBe(50);
            expect(rolls[0].variance).toBe(0.5);
            expect(rolls[0].totalInitiative).toBe(55);

            expect(rolls[1].characterId).toBe('enemy');
            expect(rolls[1].baseAgility).toBe(40);
            expect(rolls[1].totalInitiative).toBe(45);
        });

        it('should preserve all roll data for analysis', () => {
            const characters = [{ id: 'test', agility: 60 }];

            const rolls = InitiativeModule.generateDetailedRolls(
                characters,
                () => 0.3
            );

            expect(rolls[0]).toMatchObject({
                characterId: 'test',
                baseAgility: 60,
                variance: 0.3,
                totalInitiative: 63 // 60 + (0.3 × 10)
            });
        });
    });

    describe('variance edge cases', () => {
        it('should handle negative variance gracefully', () => {
            // Edge case: if RNG malfunctions and returns negative
            const result = InitiativeModule.calculateInitiative(50, -0.5);
            expect(result).toBe(45); // 50 + (-0.5 × 10)
        });

        it('should handle variance > 1', () => {
            // Edge case: if RNG returns value > 1
            const result = InitiativeModule.calculateInitiative(50, 1.5);
            expect(result).toBe(65); // 50 + (1.5 × 10)
        });

        it('should handle very low agility', () => {
            const result = InitiativeModule.calculateInitiative(0, 0.5);
            expect(result).toBe(5); // 0 + (0.5 × 10)
        });

        it('should handle very high agility', () => {
            const result = InitiativeModule.calculateInitiative(100, 0.5);
            expect(result).toBe(105); // 100 + (0.5 × 10)
        });
    });
});
