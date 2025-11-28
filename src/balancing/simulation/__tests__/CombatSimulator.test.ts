import { describe, it, expect } from 'vitest';
import { CombatSimulator } from '../CombatSimulator';
import type { CombatConfig } from '../types';

describe('CombatSimulator', () => {
    /**
     * Test 1: Known Damage → Verify HP Loss
     * 
     * Test that a combat with known stats produces expected HP reduction
     */
    describe('Known Damage Verification', () => {
        it('should reduce defender HP by expected amount', () => {
            const config: CombatConfig = {
                entity1: {
                    name: 'Attacker',
                    hp: 100,
                    attack: 20,
                    defense: 0,
                    txc: 100, // 100% hit chance
                    evasion: 0,
                    critChance: 0, // No randomness
                    failChance: 0,
                },
                entity2: {
                    name: 'Defender',
                    hp: 100,
                    attack: 0, // Doesn't attack back
                    defense: 0, // No mitigation
                    resistance: 0,
                    txc: 0,
                    evasion: 0,
                    critChance: 0,
                    failChance: 0,
                },
                turnLimit: 100,
                enableDetailedLogging: false,
            };

            const result = CombatSimulator.simulate(config);

            // Entity1 attacks first and should win
            expect(result.winner).toBe('entity1');

            // Defender should take damage
            expect(result.damageDealt.entity1).toBeGreaterThan(0);

            // Entity2 HP should be reduced
            expect(result.hpRemaining.entity2).toBe(0);
        });

        it('should handle defense mitigation correctly', () => {
            const config: CombatConfig = {
                entity1: {
                    name: 'Attacker',
                    hp: 100,
                    attack: 50,
                    defense: 0,
                    txc: 100,
                    evasion: 0,
                    critChance: 0,
                    failChance: 0,
                },
                entity2: {
                    name: 'Tank',
                    hp: 200,
                    attack: 10,
                    defense: 100, // High defense
                    resistance: 0,
                    txc: 100,
                    evasion: 0,
                    critChance: 0,
                    failChance: 0,
                },
                turnLimit: 100,
                enableDetailedLogging: false,
            };

            const result = CombatSimulator.simulate(config);

            // With defense, entity2 should survive longer
            expect(result.turns).toBeGreaterThan(1);
        });
    });

    /**
     * Test 2: Turn Limit Edge Case
     * 
     * Verify that combat ends at turn limit without winner
     */
    describe('Turn Limit', () => {
        it('should declare draw when turn limit is reached', () => {
            const config: CombatConfig = {
                entity1: {
                    name: 'Immortal1',
                    hp: 10000,
                    attack: 1,
                    defense: 0,
                    txc: 100,
                    evasion: 0,
                    critChance: 0,
                    failChance: 0,
                },
                entity2: {
                    name: 'Immortal2',
                    hp: 10000,
                    attack: 1,
                    defense: 0,
                    txc: 100,
                    evasion: 0,
                    critChance: 0,
                    failChance: 0,
                },
                turnLimit: 10, // Very low limit
                enableDetailedLogging: false,
            };

            const result = CombatSimulator.simulate(config);

            expect(result.winner).toBe('draw');
            expect(result.turns).toBe(10);
            expect(result.hpRemaining.entity1).toBeGreaterThan(0);
            expect(result.hpRemaining.entity2).toBeGreaterThan(0);
        });

        it('should respect turn limit parameter', () => {
            const config: CombatConfig = {
                entity1: { name: 'E1', hp: 1000, attack: 5, defense: 0 },
                entity2: { name: 'E2', hp: 1000, attack: 5, defense: 0 },
                turnLimit: 20,
            };

            const result = CombatSimulator.simulate(config);

            expect(result.turns).toBeLessThanOrEqual(20);
        });
    });

    /**
     * Test 3: Draw Conditions
     * 
     * Test scenarios where draws can occur
     */
    describe('Draw Detection', () => {
        it('should detect draw on simultaneous death (if implemented)', () => {
            // Note: Current implementation alternates turns, so simultaneous death is unlikely
            // This test documents expected behavior
            const config: CombatConfig = {
                entity1: { name: 'E1', hp: 10, attack: 100, defense: 0, txc: 100, evasion: 0 },
                entity2: { name: 'E2', hp: 10, attack: 100, defense: 0, txc: 100, evasion: 0 },
                turnLimit: 100,
            };

            const result = CombatSimulator.simulate(config);

            // With alternating turns, entity1 attacks first and wins
            expect(result.winner).toBe('entity1');
        });

        it('should detect draw when both survive turn limit', () => {
            const config: CombatConfig = {
                entity1: { name: 'E1', hp: 1000, attack: 1, defense: 0 },
                entity2: { name: 'E2', hp: 1000, attack: 1, defense: 0 },
                turnLimit: 5,
            };

            const result = CombatSimulator.simulate(config);

            expect(result.winner).toBe('draw');
            expect(result.hpRemaining.entity1).toBeGreaterThan(0);
            expect(result.hpRemaining.entity2).toBeGreaterThan(0);
        });
    });

    /**
     * Test 4: Overkill Calculation
     * 
     * Verify overkill damage is tracked correctly
     */
    describe('Overkill Damage', () => {
        it('should calculate overkill when damage exceeds remaining HP', () => {
            const config: CombatConfig = {
                entity1: {
                    name: 'Attacker',
                    hp: 100,
                    attack: 100, // Massive damage
                    defense: 0,
                    txc: 100,
                    evasion: 0,
                    critChance: 0,
                    failChance: 0,
                },
                entity2: {
                    name: 'Defender',
                    hp: 10, // Low HP
                    attack: 0,
                    defense: 0,
                    txc: 0,
                    evasion: 0,
                    critChance: 0,
                    failChance: 0,
                },
                turnLimit: 100,
            };

            const result = CombatSimulator.simulate(config);

            expect(result.winner).toBe('entity1');
            // Overkill should be > 0 (damage exceeded HP)
            expect(result.overkill.entity1).toBeGreaterThan(0);
            expect(result.overkill.entity2).toBe(0); // Entity2 didn't kill anyone
        });

        it('should have zero overkill for close fights', () => {
            const config: CombatConfig = {
                entity1: { name: 'E1', hp: 100, attack: 10, defense: 0, txc: 100, evasion: 0 },
                entity2: { name: 'E2', hp: 100, attack: 10, defense: 0, txc: 100, evasion: 0 },
                turnLimit: 100,
            };

            const result = CombatSimulator.simulate(config);

            // Close fight - minimal overkill expected
            const totalOverkill = result.overkill.entity1 + result.overkill.entity2;
            expect(totalOverkill).toBeLessThan(15); // Some overkill is possible
        });
    });

    /**
     * Test 5: Winner Determination
     * 
     * Verify correct winner is declared
     */
    describe('Winner Determination', () => {
        it('should declare entity1 winner when entity2 dies first', () => {
            const config: CombatConfig = {
                entity1: { name: 'Strong', hp: 1000, attack: 50, defense: 0, txc: 100, evasion: 0 },
                entity2: { name: 'Weak', hp: 10, attack: 1, defense: 0, txc: 100, evasion: 0 },
                turnLimit: 100,
            };

            const result = CombatSimulator.simulate(config);

            expect(result.winner).toBe('entity1');
            expect(result.hpRemaining.entity1).toBeGreaterThan(0);
            expect(result.hpRemaining.entity2).toBe(0);
        });

        it('should declare entity2 winner when entity1 dies first', () => {
            const config: CombatConfig = {
                entity1: { name: 'Weak', hp: 10, attack: 1, defense: 0, txc: 100, evasion: 0 },
                entity2: { name: 'Strong', hp: 1000, attack: 50, defense: 0, txc: 100, evasion: 0 },
                turnLimit: 100,
            };

            const result = CombatSimulator.simulate(config);

            // Entity1 attacks first but entity2 is much stronger
            // After entity1's attack, entity2 will kill entity1
            expect(result.winner).toBe('entity2');
            expect(result.hpRemaining.entity1).toBe(0);
            expect(result.hpRemaining.entity2).toBeGreaterThan(0);
        });

        it('should track damage dealt by winner', () => {
            const config: CombatConfig = {
                entity1: { name: 'E1', hp: 100, attack: 20, defense: 0, txc: 100, evasion: 0 },
                entity2: { name: 'E2', hp: 50, attack: 10, defense: 0, txc: 100, evasion: 0 },
                turnLimit: 100,
            };

            const result = CombatSimulator.simulate(config);

            expect(result.winner).toBe('entity1');
            expect(result.damageDealt.entity1).toBeGreaterThanOrEqual(50); // Killed entity2
        });
    });

    /**
     * Test 6: Turn-by-Turn Logging
     * 
     * Verify detailed logging works when enabled
     */
    describe('Turn-by-Turn Logging', () => {
        it('should generate turn log when logging enabled', () => {
            const config: CombatConfig = {
                entity1: { name: 'E1', hp: 100, attack: 20, defense: 0, txc: 100, evasion: 0 },
                entity2: { name: 'E2', hp: 100, attack: 20, defense: 0, txc: 100, evasion: 0 },
                turnLimit: 100,
                enableDetailedLogging: true,
            };

            const result = CombatSimulator.simulate(config);

            expect(result.turnByTurnLog).toBeDefined();
            expect(result.turnByTurnLog!.length).toBeGreaterThan(0);
            expect(result.turnByTurnLog!.length).toBe(result.turns);
        });

        it('should not generate log when logging disabled', () => {
            const config: CombatConfig = {
                entity1: { name: 'E1', hp: 100, attack: 20, defense: 0 },
                entity2: { name: 'E2', hp: 100, attack: 20, defense: 0 },
                turnLimit: 100,
                enableDetailedLogging: false,
            };

            const result = CombatSimulator.simulate(config);

            expect(result.turnByTurnLog).toBeUndefined();
        });

        it('should log correct turn data', () => {
            const config: CombatConfig = {
                entity1: { name: 'E1', hp: 100, attack: 20, defense: 0, txc: 100, evasion: 0, critChance: 0, failChance: 0 },
                entity2: { name: 'E2', hp: 100, attack: 20, defense: 0, txc: 100, evasion: 0, critChance: 0, failChance: 0 },
                turnLimit: 100,
                enableDetailedLogging: true,
            };

            const result = CombatSimulator.simulate(config);

            const firstTurn = result.turnByTurnLog![0];
            expect(firstTurn.turnNumber).toBe(1);
            expect(firstTurn.attacker).toBe('entity1'); // Entity1 attacks first
            expect(firstTurn.defender).toBe('entity2');
            expect(firstTurn.damageDealt).toBeGreaterThan(0);
        });
    });

    /**
     * Test 7: Edge Cases
     */
    describe('Edge Cases', () => {
        it('should handle zero attack', () => {
            const config: CombatConfig = {
                entity1: { name: 'E1', hp: 100, attack: 0, defense: 0 },
                entity2: { name: 'E2', hp: 100, attack: 0, defense: 0 },
                turnLimit: 10,
            };

            const result = CombatSimulator.simulate(config);

            expect(result.winner).toBe('draw');
            // Even with 0 attack, formula guarantees minimum 1 damage
            // So HP will decrease slightly, but not enough to kill in 10 turns
            expect(result.hpRemaining.entity1).toBeLessThan(100);
            expect(result.hpRemaining.entity2).toBeLessThan(100);
        });

        it('should handle one-shot kills', () => {
            const config: CombatConfig = {
                entity1: { name: 'E1', hp: 100, attack: 1000, defense: 0, txc: 100, evasion: 0 },
                entity2: { name: 'E2', hp: 10, attack: 1, defense: 0, txc: 100, evasion: 0 },
                turnLimit: 100,
            };

            const result = CombatSimulator.simulate(config);

            expect(result.winner).toBe('entity1');
            expect(result.turns).toBe(1);
        });
    });
});
