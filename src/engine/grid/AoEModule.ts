import type { Position, GridState, GridCombatCharacter } from './combatTypes';

export interface AoEDamageResult {
    targets: GridCombatCharacter[];
    damagePerTarget: number;
    friendlyFireTargets: GridCombatCharacter[];
}

export const AoEModule = {
    /**
     * Resolves AoE spell targets based on shape and position.
     * Filters for friendly fire if needed.
     */
    resolveTargets(
        center: Position,
        shape: 'circle' | 'cone' | 'line',
        radius: number,
        casterTeam: 'team1' | 'team2',
        allCharacters: GridCombatCharacter[],
        grid: GridState,
        friendlyFire: boolean
    ): GridCombatCharacter[] {
        const affectedPositions = this.getAffectedTiles(center, shape, radius, grid);

        const targets = allCharacters.filter(char => {
            if (char.currentHp <= 0) return false;

            // Check if character is on an affected tile
            const isInArea = affectedPositions.some(pos =>
                pos.x === char.position.x && pos.y === char.position.y
            );

            if (!isInArea) return false;

            // Filter by team
            if (friendlyFire) {
                return true; // Hit everyone
            } else {
                return char.team !== casterTeam; // Only enemies
            }
        });

        return targets;
    },

    /**
     * Returns all tile positions affected by AoE shape.
     */
    getAffectedTiles(
        center: Position,
        shape: 'circle' | 'cone' | 'line',
        radius: number,
        grid: GridState
    ): Position[] {
        const tiles: Position[] = [];

        if (shape === 'circle') {
            const rSq = radius * radius;

            for (let y = Math.max(0, center.y - radius); y <= Math.min(grid.height - 1, center.y + radius); y++) {
                for (let x = Math.max(0, center.x - radius); x <= Math.min(grid.width - 1, center.x + radius); x++) {
                    const distSq = Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2);
                    if (distSq <= rSq) {
                        tiles.push({ x, y });
                    }
                }
            }
        } else if (shape === 'line') {
            // Simple horizontal/vertical line for now
            // Just return center for simplicity
            tiles.push(center);
        } else if (shape === 'cone') {
            // Cone is complex, return center for now
            tiles.push(center);
        }

        return tiles;
    },

    /**
     * Calculates damage for AoE spells.
     * Formula: Single-target damage × 0.65 per target
     */
    calculateAoEDamage(baseDamage: number, targetCount: number): number {
        // Single-target damage × 0.65 per target
        return baseDamage * 0.65 * targetCount;
    }
};
