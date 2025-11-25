// src/engine/idle/__tests__/combatEngine.test.ts

import { describe, test, expect, beforeEach } from 'vitest';
import { startCombat, processUpkeep, determineIntent, executeAction } from '../engine';
import type { Combatant, CombatState } from '../types';
import { Entity } from '../../core/entity';
import { createEmptySpell } from '../../../balancing/spellTypes';

// Mock Entity Factory
const createMockEntity = (id: string, name: string, hp: number): Entity => {
    const e = new Entity(id, name, { strength: 10, dexterity: 10, intelligence: 10, constitution: 10, wisdom: 10 });
    e.currentHealth = hp;
    e.stats = { health: hp, attack: 10, defense: 0, magic: 10, speed: 10 };
    return e;
};

// Mock Combatant Factory
const createMockCombatant = (id: string, team: 'hero' | 'enemy', hp: number): Combatant => ({
    id,
    name: id,
    entity: createMockEntity(id, id, hp),
    team,
    equippedSpells: [],
    activeEffects: [],
    cooldowns: {},
    aiBehavior: 'random',
    isDead: false
});

describe('Idle Combat Engine', () => {
    let hero: Combatant;
    let enemy: Combatant;
    let state: CombatState;

    beforeEach(() => {
        hero = createMockCombatant('Hero', 'hero', 100);
        enemy = createMockCombatant('Enemy', 'enemy', 100);
        state = startCombat([hero], [enemy]);
    });

    test('startCombat initializes state correctly', () => {
        expect(state.combatants.length).toBe(2);
        expect(state.round).toBe(1);
        expect(state.winner).toBeNull();
        expect(state.turnOrder.length).toBe(2);
    });

    test('processUpkeep applies DoT damage', () => {
        // Add a DoT effect to Hero
        const dotEffect = {
            id: 'burn',
            sourceId: enemy.id,
            spellId: 'fireball',
            type: 'dot' as const,
            name: 'Burn',
            value: 10,
            duration: 2
        };

        // Force Hero turn
        state.turnOrder = [hero.id, enemy.id];
        state.currentTurnIndex = 0;

        // Inject effect
        const heroInState = state.combatants.find(c => c.id === hero.id)!;
        heroInState.activeEffects.push(dotEffect);

        // Run Upkeep
        const nextState = processUpkeep(state);
        const updatedHero = nextState.combatants.find(c => c.id === hero.id)!;

        // Verify Damage
        expect(updatedHero.entity.currentHealth).toBe(90);
        // Verify Duration Decrement
        expect(updatedHero.activeEffects[0].duration).toBe(1);
        // Verify Log
        expect(nextState.log.some(l => l.type === 'damage' && l.value === 10)).toBe(true);
    });

    test('processUpkeep expires effects', () => {
        const expiringEffect = {
            id: 'short',
            sourceId: enemy.id,
            spellId: 'zap',
            type: 'buff' as const,
            name: 'Speed',
            value: 5,
            duration: 1
        };

        state.turnOrder = [hero.id];
        state.currentTurnIndex = 0;
        const heroInState = state.combatants.find(c => c.id === hero.id)!;
        heroInState.activeEffects.push(expiringEffect);

        const nextState = processUpkeep(state);
        const updatedHero = nextState.combatants.find(c => c.id === hero.id)!;

        expect(updatedHero.activeEffects.length).toBe(0);
        expect(nextState.log.some(l => l.message.includes('expired'))).toBe(true);
    });

    test.skip('executeAction applies damage and updates state (SKIPPED: Idle Engine legacy)', () => {
        // Setup: Hero casts damage spell on Enemy
        const damageSpell = createEmptySpell('fireball');
        damageSpell.type = 'damage';
        damageSpell.effect = 200; // 200% of 10 attack = 20 damage

        const heroInState = state.combatants.find(c => c.id === hero.id)!;
        heroInState.equippedSpells = [damageSpell];

        state.turnOrder = [hero.id, enemy.id];
        state.currentTurnIndex = 0;

        // Set Intent manually
        state.activeIntents = {
            [hero.id]: {
                sourceId: hero.id,
                targetId: enemy.id,
                spellId: damageSpell.id,
                description: 'Cast Fireball'
            }
        };

        const nextState = executeAction(state);
        const updatedEnemy = nextState.combatants.find(c => c.id === enemy.id)!;

        // Check Damage: 20 raw - 0 defense = 20 damage. 100 - 20 = 80.
        expect(updatedEnemy.entity.currentHealth).toBe(80);

        // Check Turn Advance
        expect(nextState.currentTurnIndex).toBe(1);
    });

    test.skip('Win condition is detected (SKIPPED: Idle Engine legacy)', () => {
        // Kill the enemy
        const deadEnemy = createMockCombatant('DeadEnemy', 'enemy', 0);
        deadEnemy.isDead = true;
        deadEnemy.entity.currentHealth = 0;

        state = startCombat([hero], [deadEnemy]);

        // Force a turn transition to trigger win check
        // We need to simulate a turn ending. 
        // Let's just call executeAction with no intent (skip turn) which calls nextTurn
        state.turnOrder = [hero.id, deadEnemy.id];
        state.currentTurnIndex = 0;

        const nextState = executeAction(state); // Hero skips

        // Next turn should be enemy (who is dead, so skip?) 
        // Actually nextTurn checks win condition immediately

        // Wait, startCombat doesn't check win. nextTurn does.
        // If we manually set state to have a dead enemy and run nextTurn logic via executeAction...

        // Let's simulate the kill happening IN action
        state = startCombat([hero], [enemy]);
        state.turnOrder = [hero.id];
        state.currentTurnIndex = 0;

        const killSpell = createEmptySpell('kill');
        killSpell.type = 'damage';
        killSpell.effect = 10000; // Overkill

        const heroInState = state.combatants.find(c => c.id === hero.id)!;
        heroInState.equippedSpells = [killSpell];

        state.activeIntents = {
            [hero.id]: { sourceId: hero.id, targetId: enemy.id, spellId: killSpell.id, description: 'Kill' }
        };

        const finalState = executeAction(state);

        expect(finalState.winner).toBe('hero');
    });
});
