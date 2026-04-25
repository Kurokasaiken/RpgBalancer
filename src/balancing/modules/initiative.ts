import type { RNG } from '../simulation/types';

/**
 * Initiative Module - Turn Order System
 * 
 * Calculates turn order based on agility stat + random variance.
 * Higher initiative acts first.
 * 
 * @module InitiativeModule
 */

/**
 * Represents the result of an initiative roll for a character.
 */
export interface InitiativeRoll {
    characterId: string;
    baseAgility: number;
    variance: number;
    totalInitiative: number;
}

export const InitiativeModule = {
    /**
     * Calculate initiative for a single character
     * 
     * Formula: Initiative = Agility + (variance × 10)
     * Variance is 0-1 from RNG, giving ±10 point swing
     * 
     * @param agility - Base agility stat
     * @param variance - Random value from RNG (0-1)
     * @returns Initiative value (higher acts first)
     * 
     * @example
     * // Character with 50 agility, variance 0.7
     * calculateInitiative(50, 0.7) // Returns 57
     */
    calculateInitiative(agility: number, variance: number): number {
        return agility + (variance * 10);
    },

    /**
     * Generate turn order for all characters
     * 
     * Rolls initiative for each character and sorts by descending order.
     * In case of ties, maintains original array order (stable sort).
     * 
     * @param characters - Array of character data with id and agility
     * @param rng - Seeded RNG function (returns 0-1)
     * @returns Sorted array of character IDs (highest initiative first)
     * 
     * @example
     * const characters = [
     *   { id: 'hero', agility: 60 },
     *   { id: 'enemy', agility: 40 }
     * ];
     * const order = generateTurnOrder(characters, Math.random);
     * // Returns ['hero', 'enemy'] (most likely, hero has higher base agility)
     */
    generateTurnOrder(
        characters: { id: string; agility: number }[],
        rng: RNG
    ): string[] {
        const rolls: InitiativeRoll[] = characters.map(char => {
            const variance = rng();
            const totalInitiative = this.calculateInitiative(char.agility, variance);

            return {
                characterId: char.id,
                baseAgility: char.agility,
                variance,
                totalInitiative
            };
        });

        // Sort by initiative (descending), stable sort preserves ties
        rolls.sort((a, b) => b.totalInitiative - a.totalInitiative);

        return rolls.map(roll => roll.characterId);
    },

    /**
     * Generate detailed initiative rolls (for logging/analysis)
     * 
     * @param characters - Array of character data
     * @param rng - Seeded RNG function
     * @returns Array of detailed initiative rolls
     */
    generateDetailedRolls(
        characters: { id: string; agility: number }[],
        rng: RNG
    ): InitiativeRoll[] {
        return characters.map(char => {
            const variance = rng();
            const totalInitiative = this.calculateInitiative(char.agility, variance);

            return {
                characterId: char.id,
                baseAgility: char.agility,
                variance,
                totalInitiative
            };
        }).sort((a, b) => b.totalInitiative - a.totalInitiative);
    }
};
