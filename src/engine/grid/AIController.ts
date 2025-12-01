import type { GridCombatState, GridCombatCharacter, AIDecision } from './combatTypes';
import { findPath } from '../pathfinding/AStar';
import { RangeCalculator } from './RangeCalculator';

export class AIController {
    static decide(character: GridCombatCharacter, state: GridCombatState): AIDecision {
        // 1. Find enemies
        const enemies = state.characters.filter(c => c.team !== character.team && c.currentHp > 0);
        if (enemies.length === 0) {
            return {
                action: { characterId: character.id, type: 'wait' },
                reasoning: 'No enemies found',
                priority: 0
            };
        }

        // 2. Sort enemies by distance
        enemies.sort((a, b) => {
            const distA = RangeCalculator.getDistance(character.position, a.position);
            const distB = RangeCalculator.getDistance(character.position, b.position);
            return distA - distB;
        });
        const target = enemies[0];

        // 3. Check spells (Attack if possible)
        // Assume first damaging spell is "Attack" or use best spell
        const attackSpell = character.equippedSpells.find(s => s.type === 'damage' && (character.cooldowns.get(s.id) || 0) === 0);

        if (attackSpell) {
            const range = attackSpell.range || 1; // Default melee
            const dist = RangeCalculator.getDistance(character.position, target.position);

            if (dist <= range && RangeCalculator.hasLineOfSight(character.position, target.position, state.grid)) {
                return {
                    action: {
                        characterId: character.id,
                        type: 'spell',
                        spellId: attackSpell.id,
                        targetId: target.id,
                        targetPosition: target.position
                    },
                    reasoning: `Attacking ${target.name} with ${attackSpell.name}`,
                    priority: 10
                };
            }
        }

        // 4. Move towards target
        // ignoreBlockersAtGoal = true because we want to path TO the enemy even if they block the goal tile
        const path = findPath(character.position, target.position, state.grid, true);

        if (path && path.length > 1) {
            // Move to next tile (or as far as movement allows)
            // Assume movement = 5 tiles (standard D&D/RPG speed)
            const movement = 5;

            // We need to find the furthest reachable tile on path that is NOT occupied.
            // path[0] is start. path[1] is first step.
            let bestTile = character.position;

            for (let i = 1; i <= movement && i < path.length; i++) {
                const tile = path[i];
                // Check if occupied by ANY living character
                const occupied = state.characters.some(c => c.position.x === tile.x && c.position.y === tile.y && c.currentHp > 0);

                if (occupied) {
                    // If occupied by the target and we are at range 1, that's fine (we stop adjacent)
                    // But if occupied by ally or obstacle, we stop before it.
                    break;
                }
                bestTile = tile;
            }

            if (bestTile.x !== character.position.x || bestTile.y !== character.position.y) {
                return {
                    action: {
                        characterId: character.id,
                        type: 'move',
                        moveToPosition: bestTile
                    },
                    reasoning: `Moving towards ${target.name}`,
                    priority: 5
                };
            }
        }

        return {
            action: { characterId: character.id, type: 'wait' },
            reasoning: 'No valid action',
            priority: 0
        };
    }
}
