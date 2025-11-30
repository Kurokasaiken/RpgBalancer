// src/engine/idle/ai.ts

import type { Combatant, CombatState, Intent } from "./types";
import type { Spell } from "../../balancing/spellTypes";

/**
 * Evaluates the battlefield and returns the best Intent for the combatant.
 */
export function evaluateTurn(combatant: Combatant, state: CombatState): Intent {
    // 1. Filter Spells: Must be off cooldown
    const availableSpells = combatant.equippedSpells.filter(spell =>
        (combatant.cooldowns[spell.id] || 0) <= 0
    );

    if (availableSpells.length === 0) {
        // Fallback: Basic Attack (create a dummy spell or skip)
        // For now, return a "Skip" intent if no spells (shouldn't happen with basic attack spell)
        return {
            sourceId: combatant.id,
            targetId: combatant.id, // Self
            spellId: 'skip',
            description: "No available spells. Skipping turn."
        };
    }

    // 2. Identify Targets
    const enemies = state.combatants.filter(c => c.team !== combatant.team && !c.isDead);
    const allies = state.combatants.filter(c => c.team === combatant.team && !c.isDead);

    if (enemies.length === 0) {
        // Victory condition usually handles this, but safe fallback
        return { sourceId: combatant.id, targetId: combatant.id, spellId: 'skip', description: "No enemies left." };
    }

    // 3. Score (Spell, Target) pairs
    let bestScore = -Infinity;
    let bestIntent: Intent | null = null;

    for (const spell of availableSpells) {
        // Determine valid targets based on spell type
        let potentialTargets: Combatant[] = [];
        if (spell.type === 'heal' || spell.type === 'buff' || spell.type === 'shield') {
            potentialTargets = allies;
        } else {
            potentialTargets = enemies;
        }

        for (const target of potentialTargets) {
            const score = scoreAction(combatant, spell, target, state);
            if (score > bestScore) {
                bestScore = score;
                bestIntent = {
                    sourceId: combatant.id,
                    targetId: target.id,
                    spellId: spell.id,
                    description: `Casting ${spell.name} on ${target.name}`
                };
            }
        }
    }

    return bestIntent || { sourceId: combatant.id, targetId: combatant.id, spellId: 'skip', description: "No valid action found." };
}

/**
 * Scores a specific action (Source -> Spell -> Target).
 * Higher score = better action.
 */
function scoreAction(source: Combatant, spell: Spell, target: Combatant, state: CombatState): number {
    let score = 0;

    // --- Role-Based Logic ---

    // TANK: Prioritize protecting allies and taunting dangerous enemies
    if (source.aiBehavior === 'tank') {
        if (spell.type === 'cc' || spell.ccEffect === 'stun') {
            // CC high damage dealers
            score += target.entity.stats.attack * 2;
        } else if (spell.type === 'shield' && target.team === source.team) {
            // Shield low HP allies
            const hpPercent = (target.entity.currentHealth / target.entity.stats.health) * 100;
            if (hpPercent < 50) score += (100 - hpPercent) * 3;
        } else if (spell.type === 'damage') {
            // Attack enemies targeting vulnerable allies (simplified: attack highest DPS)
            score += target.entity.stats.attack;
        }
    }

    // DPS: Prioritize killing low HP enemies or high threat targets
    else if (source.aiBehavior === 'dps') {
        if (spell.type === 'damage') {
            const hpPercent = (target.entity.currentHealth / target.entity.stats.health) * 100;

            // Execute bonus: huge score if it kills
            // (Simplified damage calc for estimation)
            const estimatedDamage = (source.entity.stats.attack * spell.effect) / 100;
            if (target.entity.currentHealth <= estimatedDamage) {
                score += 1000; // Kill confirm
            } else {
                // Focus low HP
                score += (100 - hpPercent) * 2;
                // Focus high threat (glass cannons)
                score += target.entity.stats.attack;
            }
        }
    }

    // SUPPORT: Prioritize healing/buffing allies
    else if (source.aiBehavior === 'support') {
        if (spell.type === 'heal') {
            const hpPercent = (target.entity.currentHealth / target.entity.stats.health) * 100;
            // Only heal if hurt
            if (hpPercent < 100) {
                score += (100 - hpPercent) * 5; // Strong priority on low HP
            } else {
                score -= 100; // Don't heal full HP
            }
        } else if (spell.type === 'buff' || spell.type === 'shield') {
            // Buff/Shield allies under threat (simplified: random or low HP)
            const hpPercent = (target.entity.currentHealth / target.entity.stats.health) * 100;
            score += (100 - hpPercent);
        }
    }

    // RANDOM: Just do whatever (fallback)
    else {
        score += rng() * 50;
    }

    // --- Universal Logic ---

    // Don't use expensive spells on almost dead targets (unless it's a kill confirm logic above)
    // ...

    return score;
}
