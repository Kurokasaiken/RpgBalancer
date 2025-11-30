// src/engine/idle/engine.ts

import type { Combatant, CombatState, CombatLogEntry, ActiveEffect } from "./types";
import type { Spell } from "../../balancing/spellTypes";
import { calculateDamage } from '../combat/damageCalculator';
import { evaluateTurn } from './ai';

/**
 * Initializes a new combat state with heroes and enemies.
 */
export function startCombat(heroes: Combatant[], enemies: Combatant[], rng: () => number): CombatState {
    const combatants = [...heroes, ...enemies];

    // Roll initiative: Use speed stat with random tie-breaker
    const turnOrder = combatants
        .map(c => ({
            id: c.id,
            // Speed + small random value for tie-breaking
            initiative: c.entity.stats.speed + (rng() * 0.99)
        }))
        .sort((a, b) => b.initiative - a.initiative) // Higher initiative goes first
        .map(x => x.id);

    return {
        combatants,
        turnOrder,
        currentTurnIndex: 0,
        round: 1,
        log: [{ round: 1, message: "Combat Started!", type: 'info' }],
        activeIntents: {},
        winner: null
    };
}

/**
 * Processes the Upkeep Phase for the current combatant.
 * - Triggers DoTs/HoTs
 * - Reduces effect durations
 * - Reduces cooldowns
 */
export function processUpkeep(state: CombatState): CombatState {
    const currentId = state.turnOrder[state.currentTurnIndex];
    const combatant = state.combatants.find(c => c.id === currentId);
    if (!combatant || combatant.isDead) return state;

    const newLog: CombatLogEntry[] = [];
    const updatedEffects: ActiveEffect[] = [];

    // 1. Process Active Effects
    combatant.activeEffects.forEach(effect => {
        if (effect.type === 'dot') {
            // Apply Damage
            const damage = effect.value;
            combatant.entity.currentHealth = Math.max(0, combatant.entity.currentHealth - damage);
            newLog.push({
                round: state.round,
                sourceId: effect.sourceId,
                targetId: combatant.id,
                message: `${combatant.name} took ${damage} damage from ${effect.name}.`,
                type: 'damage',
                value: damage
            });
        } else if (effect.type === 'hot') {
            // Apply Heal
            const heal = effect.value;
            combatant.entity.currentHealth = Math.min(combatant.entity.stats.health, combatant.entity.currentHealth + heal);
            newLog.push({
                round: state.round,
                sourceId: effect.sourceId,
                targetId: combatant.id,
                message: `${combatant.name} healed ${heal} from ${effect.name}.`,
                type: 'heal',
                value: heal
            });
        }

        // Decrement duration
        if (effect.duration > 1) {
            updatedEffects.push({ ...effect, duration: effect.duration - 1 });
        } else {
            newLog.push({
                round: state.round,
                targetId: combatant.id,
                message: `${effect.name} on ${combatant.name} expired.`,
                type: 'info'
            });
        }
    });

    // 2. Reduce Cooldowns
    const updatedCooldowns: Record<string, number> = {};
    for (const [spellId, cd] of Object.entries(combatant.cooldowns)) {
        if (cd > 0) {
            updatedCooldowns[spellId] = cd - 1;
        }
    }

    // Update Combatant State
    const updatedCombatant = {
        ...combatant,
        activeEffects: updatedEffects,
        cooldowns: updatedCooldowns,
        isDead: combatant.entity.currentHealth <= 0
    };

    // Update Global State
    const updatedCombatants = state.combatants.map(c => c.id === currentId ? updatedCombatant : c);

    return {
        ...state,
        combatants: updatedCombatants,
        log: [...state.log, ...newLog]
    };
}

/**
 * Determines the Intent for the current combatant using AI.
 */
export function determineIntent(state: CombatState): CombatState {
    const currentId = state.turnOrder[state.currentTurnIndex];
    const combatant = state.combatants.find(c => c.id === currentId);
    if (!combatant || combatant.isDead) return state;

    // AI Logic call
    const intent = evaluateTurn(combatant, state);

    return {
        ...state,
        activeIntents: { ...state.activeIntents, [currentId]: intent }
    };
}

/**
 * Executes the declared Intent.
 */
export function executeAction(state: CombatState): CombatState {
    const currentId = state.turnOrder[state.currentTurnIndex];
    const combatant = state.combatants.find(c => c.id === currentId);
    const intent = state.activeIntents[currentId];

    if (!combatant || combatant.isDead || !intent) {
        // Skip turn if dead or no intent
        return nextTurn(state);
    }

    const target = state.combatants.find(c => c.id === intent.targetId);
    if (!target || target.isDead) {
        // Target dead, action fizzles (or retarget logic could go here)
        return {
            ...state,
            log: [...state.log, { round: state.round, message: `${combatant.name}'s target is dead. Action fizzled.`, type: 'info' }]
        };
    }

    const spell = combatant.equippedSpells.find(s => s.id === intent.spellId);
    if (!spell) return nextTurn(state);

    const newLog: CombatLogEntry[] = [];

    // --- Use Balancing Module for Damage Calculation ---
    if (spell.type === 'damage' || spell.type === 'cc') {
        // Both combatants must have StatBlock
        if (!combatant.entity.statBlock || !target.entity.statBlock) {
            console.error('Combatants missing StatBlock - cannot use balancing module');
            return nextTurn(state);
        }

        const damageResult = calculateDamage(
            combatant.entity.statBlock,
            target.entity.statBlock
        );

        if (!damageResult.isHit) {
            newLog.push({
                round: state.round,
                sourceId: combatant.id,
                targetId: target.id,
                message: `${combatant.name} casts ${spell.name} but misses ${target.name}!`,
                type: 'info'
            });
        } else {
            const finalDamage = damageResult.totalDamage;
            target.entity.currentHealth = Math.max(0, target.entity.currentHealth - finalDamage);

            const critText = damageResult.isCritical ? ' (CRITICAL!)' : '';
            newLog.push({
                round: state.round,
                sourceId: combatant.id,
                targetId: target.id,
                message: `${combatant.name} casts ${spell.name} on ${target.name} for ${finalDamage} damage${critText}.`,
                type: 'damage',
                value: finalDamage
            });
        }

        // Apply DoT if eco > 1
        if (spell.eco > 1) {
            target.activeEffects.push({
                id: crypto.randomUUID(),
                name: `${spell.name} (DoT)`,
                type: 'dot',
                value: Math.round(damageResult.totalDamage / spell.eco),
                duration: spell.eco,
                sourceId: combatant.id,
                spellId: spell.id
            });
        }
    } else if (spell.type === 'heal') {
        const healAmount = (combatant.entity.statBlock?.damage || 50) * (spell.effect / 100);
        target.entity.currentHealth = Math.min(
            target.entity.statBlock?.hp || target.entity.stats.health,
            target.entity.currentHealth + healAmount
        );
        newLog.push({
            round: state.round,
            sourceId: combatant.id,
            targetId: target.id,
            message: `${combatant.name} casts ${spell.name} on ${target.name} for ${Math.round(healAmount)} healing.`,
            type: 'heal',
            value: healAmount
        });
    } else if (spell.type === 'buff' || spell.type === 'debuff') {
        // Apply stat modifications as active effect
        if (spell.statModifications && Object.keys(spell.statModifications).length > 0) {
            const statChanges = Object.entries(spell.statModifications)
                .filter(([_, value]) => value !== undefined && value !== 0)
                .map(([stat, value]) => `${stat}: ${value! > 0 ? '+' : ''}${value}`)
                .join(', ');

            target.activeEffects.push({
                id: crypto.randomUUID(),
                name: spell.name,
                type: spell.type, // 'buff' or 'debuff'
                value: 0, // Not used for stat mods
                duration: spell.duration || 1,
                sourceId: combatant.id,
                spellId: spell.id,
                statModifications: spell.statModifications
            });

            newLog.push({
                round: state.round,
                sourceId: combatant.id,
                targetId: target.id,
                message: `${combatant.name} casts ${spell.name} on ${target.name} (${spell.type === 'buff' ? '⬆️' : '⬇️'} ${statChanges} for ${spell.duration || 1} turns)`,
                type: spell.type === 'buff' ? 'heal' : 'damage' // Use heal/damage types for visual consistency
            });
        }
    }

    // Set Cooldown
    const updatedCooldowns = { ...combatant.cooldowns, [spell.id]: spell.cooldown };
    const updatedCombatant = { ...combatant, cooldowns: updatedCooldowns };

    // Update Target state (HP changed)
    const updatedTarget = { ...target, isDead: target.entity.currentHealth <= 0 };
    if (updatedTarget.isDead) {
        newLog.push({ round: state.round, message: `${target.name} has died!`, type: 'death' });
    }

    // Update Combatants Array
    const updatedCombatants = state.combatants.map(c => {
        if (c.id === combatant.id) return updatedCombatant;
        if (c.id === target.id) return updatedTarget;
        return c;
    });

    // Clear Intent
    const { [currentId]: _, ...remainingIntents } = state.activeIntents;

    return nextTurn({
        ...state,
        combatants: updatedCombatants,
        activeIntents: remainingIntents,
        log: [...state.log, ...newLog]
    });
}

/**
 * Advances the turn index.
 */
function nextTurn(state: CombatState): CombatState {
    let nextIndex = state.currentTurnIndex + 1;
    let nextRound = state.round;

    if (nextIndex >= state.turnOrder.length) {
        nextIndex = 0;
        nextRound++;
    }

    // Check Win Condition
    const heroesAlive = state.combatants.some(c => c.team === 'hero' && !c.isDead);
    const enemiesAlive = state.combatants.some(c => c.team === 'enemy' && !c.isDead);
    let winner: 'hero' | 'enemy' | null = null;

    if (!heroesAlive) winner = 'enemy';
    else if (!enemiesAlive) winner = 'hero';

    return {
        ...state,
        currentTurnIndex: nextIndex,
        round: nextRound,
        winner
    };
}
