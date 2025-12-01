import type { GridCombatState, GridCombatCharacter, GridState, CombatAction } from './combatTypes';
import { InitiativeModule } from '../../balancing/modules/initiative';
import { HitChanceModule } from '../../balancing/modules/hitchance';
import { CriticalModule } from '../../balancing/modules/critical';
import { MitigationModule } from '../../balancing/modules/mitigation';
import { AoEModule } from './AoEModule';
import { AIController } from './AIController';
import type { RNG } from '../../balancing/simulation/types';
import type { StatBlock } from '../../balancing/types';

export class GridCombatSimulator {
    /**
     * Simulates a grid-based combat between two teams.
     */
    static simulate(
        team1: GridCombatCharacter[],
        team2: GridCombatCharacter[],
        grid: GridState,
        rng: RNG,
        turnLimit: number = 50
    ): GridCombatState {
        // Initialize state
        const state = this.createInitialState(team1, team2, grid);

        // Combat loop
        while (!state.isFinished && state.turn < turnLimit) {
            state.turn++;

            // Process start of turn effects (DoTs, buffs, etc.)
            this.processStartOfTurn(state, rng);

            // Generate initiative order for this turn
            this.rollInitiative(state, rng);

            // Process each character's turn
            for (const charId of state.turnQueue) {
                const character = state.characters.find(c => c.id === charId);
                if (!character || character.currentHp <= 0) continue;

                // Check if stunned
                const isStunned = character.statusEffects.some(e => e.type === 'stun');
                if (isStunned) {
                    state.log.push({
                        turn: state.turn,
                        message: `${character.name} is stunned!`,
                        type: 'stun'
                    });
                    state.metrics.turnsStunned.set(character.id, (state.metrics.turnsStunned.get(character.id) || 0) + 1);
                    continue;
                }

                // AI decides action
                const decision = AIController.decide(character, state);

                // Execute action
                this.executeAction(state, character, decision.action, rng);

                // Check win condition
                if (this.checkWinCondition(state)) {
                    state.isFinished = true;
                    break;
                }
            }

            // Process end of turn effects
            this.processEndOfTurn(state);
        }

        // Handle draw
        if (!state.winner) {
            state.winner = 'draw';
            state.isFinished = true;
        }

        return state;
    }

    private static createInitialState(
        team1: GridCombatCharacter[],
        team2: GridCombatCharacter[],
        grid: GridState
    ): GridCombatState {
        const allCharacters = [...team1, ...team2];

        const metrics = {
            initiativeRolls: new Map<string, number[]>(),
            attacks: new Map<string, number>(),
            hits: new Map<string, number>(),
            crits: new Map<string, number>(),
            statusApplied: new Map<string, number>(),
            turnsStunned: new Map<string, number>(),
            tilesMoved: new Map<string, number>()
        };

        allCharacters.forEach(char => {
            metrics.initiativeRolls.set(char.id, []);
            metrics.attacks.set(char.id, 0);
            metrics.hits.set(char.id, 0);
            metrics.crits.set(char.id, 0);
            metrics.statusApplied.set(char.id, 0);
            metrics.turnsStunned.set(char.id, 0);
            metrics.tilesMoved.set(char.id, 0);
        });

        return {
            grid,
            characters: allCharacters,
            turn: 0,
            turnQueue: [],
            log: [],
            isFinished: false,
            metrics
        };
    }

    private static rollInitiative(state: GridCombatState, rng: RNG): void {
        const candidates = state.characters
            .filter(c => c.currentHp > 0)
            .map(c => ({
                id: c.id,
                agility: c.baseStats.agility
            }));

        const rolls = InitiativeModule.generateDetailedRolls(candidates, rng);

        // Record rolls
        rolls.forEach(roll => {
            const existing = state.metrics.initiativeRolls.get(roll.characterId) || [];
            existing.push(roll.totalInitiative);
            state.metrics.initiativeRolls.set(roll.characterId, existing);
        });

        // Sort by initiative
        rolls.sort((a, b) => b.totalInitiative - a.totalInitiative);
        state.turnQueue = rolls.map(r => r.characterId);
    }

    private static processStartOfTurn(state: GridCombatState, rng: RNG): void {
        // Process status effect durations
        for (const character of state.characters) {
            if (character.currentHp <= 0) continue;

            // Tick down durations
            character.statusEffects = character.statusEffects.filter(effect => {
                const newDuration = effect.duration - 1;
                if (newDuration <= 0) {
                    state.log.push({
                        turn: state.turn,
                        message: `${effect.name} expired on ${character.name}`,
                        type: 'info'
                    });
                    return false;
                }
                effect.duration = newDuration;
                return true;
            });
        }
    }

    private static processEndOfTurn(state: GridCombatState): void {
        // Tick down cooldowns
        for (const character of state.characters) {
            character.cooldowns.forEach((cd, spellId) => {
                if (cd > 0) {
                    character.cooldowns.set(spellId, cd - 1);
                }
            });
        }
    }

    private static executeAction(state: GridCombatState, character: GridCombatCharacter, action: CombatAction, rng: RNG): void {
        if (action.type === 'wait') {
            return;
        }

        if (action.type === 'move' && action.moveToPosition) {
            const oldPos = character.position;
            character.position = action.moveToPosition;
            const distance = Math.abs(oldPos.x - action.moveToPosition.x) + Math.abs(oldPos.y - action.moveToPosition.y);
            state.metrics.tilesMoved.set(character.id, (state.metrics.tilesMoved.get(character.id) || 0) + distance);

            state.log.push({
                turn: state.turn,
                message: `${character.name} moves to (${action.moveToPosition.x}, ${action.moveToPosition.y})`,
                type: 'info'
            });
            return;
        }

        if (action.type === 'spell' && action.spellId && action.targetId) {
            const spell = character.equippedSpells.find(s => s.id === action.spellId);
            const target = state.characters.find(c => c.id === action.targetId);

            if (!spell || !target || target.currentHp <= 0) return;

            // Execute spell
            if (spell.type === 'damage') {
                this.executeDamageSpell(state, character, target, spell, rng);
            } else if (spell.type === 'heal') {
                this.executeHealSpell(state, character, target, spell);
            } else if (spell.type === 'buff' || spell.type === 'debuff') {
                this.executeBuffDebuff(state, character, target, spell);
            }

            // Set cooldown
            character.cooldowns.set(spell.id, spell.cooldown || 0);
        }
    }

    private static executeDamageSpell(
        state: GridCombatState,
        attacker: GridCombatCharacter,
        defender: GridCombatCharacter,
        spell: any,
        rng: RNG
    ): void {
        const attackerStats = this.getBuffedStats(attacker);

        // Check if this is an AoE spell
        if (spell.aoeShape && spell.aoeRadius) {
            this.executeAoEDamageSpell(state, attacker, defender.position, spell, rng);
            return;
        }

        // Single-target damage
        const defenderStats = this.getBuffedStats(defender);

        state.metrics.attacks.set(attacker.id, (state.metrics.attacks.get(attacker.id) || 0) + 1);

        // Hit check
        const hitChance = HitChanceModule.calculateHitChance(attackerStats.txc, defenderStats.evasion);
        const hitRoll = rng() * 100;
        const isHit = hitRoll <= hitChance;

        if (!isHit) {
            state.log.push({
                turn: state.turn,
                message: `${attacker.name} misses ${defender.name}!`,
                type: 'info'
            });
            return;
        }

        state.metrics.hits.set(attacker.id, (state.metrics.hits.get(attacker.id) || 0) + 1);

        // Crit check
        const critRoll = rng() * 100;
        const isCrit = critRoll <= attackerStats.critChance;

        let damage = attackerStats.damage;
        if (isCrit) {
            damage = CriticalModule.calculateCriticalDamage(damage, attackerStats.critMult);
            state.metrics.crits.set(attacker.id, (state.metrics.crits.get(attacker.id) || 0) + 1);
        }

        // Mitigation
        const finalDamage = MitigationModule.calculateEffectiveDamage(
            damage,
            defenderStats.armor,
            defenderStats.resistance,
            attackerStats.armorPen,
            attackerStats.penPercent,
            defenderStats.configFlatFirst
        );

        defender.currentHp = Math.max(0, defender.currentHp - finalDamage);

        state.log.push({
            turn: state.turn,
            message: `${attacker.name} ${isCrit ? 'CRITS' : 'hits'} ${defender.name} for ${finalDamage.toFixed(1)} damage!`,
            type: 'damage'
        });

        if (defender.currentHp <= 0) {
            state.log.push({
                turn: state.turn,
                message: `${defender.name} has died!`,
                type: 'death'
            });
        }
    }

    private static executeAoEDamageSpell(
        state: GridCombatState,
        attacker: GridCombatCharacter,
        targetPosition: { x: number; y: number },
        spell: any,
        rng: RNG
    ): void {
        const attackerStats = this.getBuffedStats(attacker);

        // Resolve AoE targets
        const targets = AoEModule.resolveTargets(
            targetPosition,
            spell.aoeShape,
            spell.aoeRadius,
            attacker.team,
            state.characters,
            state.grid,
            spell.friendlyFire || false
        );

        if (targets.length === 0) {
            state.log.push({
                turn: state.turn,
                message: `${attacker.name} casts ${spell.name} but hits no one!`,
                type: 'info'
            });
            return;
        }

        // AoE damage = 65% of single-target damage
        const aoeDamageMultiplier = 0.65;

        state.log.push({
            turn: state.turn,
            message: `${attacker.name} casts ${spell.name} (AoE)! Targeting ${targets.length} ${targets.length > 1 ? 'enemies' : 'enemy'}`,
            type: 'info'
        });

        // Apply damage to each target
        for (const target of targets) {
            const defenderStats = this.getBuffedStats(target);

            state.metrics.attacks.set(attacker.id, (state.metrics.attacks.get(attacker.id) || 0) + 1);

            // Hit check (AoE spells can still miss individual targets)
            const hitChance = HitChanceModule.calculateHitChance(attackerStats.txc, defenderStats.evasion);
            const hitRoll = rng() * 100;
            const isHit = hitRoll <= hitChance;

            if (!isHit) {
                state.log.push({
                    turn: state.turn,
                    message: `  ↳ ${target.name} dodges!`,
                    type: 'info'
                });
                continue;
            }

            state.metrics.hits.set(attacker.id, (state.metrics.hits.get(attacker.id) || 0) + 1);

            // Crit check
            const critRoll = rng() * 100;
            const isCrit = critRoll <= attackerStats.critChance;

            let damage = attackerStats.damage * aoeDamageMultiplier;
            if (isCrit) {
                damage = CriticalModule.calculateCriticalDamage(damage, attackerStats.critMult);
                state.metrics.crits.set(attacker.id, (state.metrics.crits.get(attacker.id) || 0) + 1);
            }

            // Mitigation
            const finalDamage = MitigationModule.calculateEffectiveDamage(
                damage,
                defenderStats.armor,
                defenderStats.resistance,
                attackerStats.armorPen,
                attackerStats.penPercent,
                defenderStats.configFlatFirst
            );

            target.currentHp = Math.max(0, target.currentHp - finalDamage);

            const ffIndicator = (spell.friendlyFire && target.team === attacker.team) ? ' [FF]' : '';
            state.log.push({
                turn: state.turn,
                message: `  ↳ ${target.name} takes ${finalDamage.toFixed(1)} damage${isCrit ? ' (CRIT!)' : ''}${ffIndicator}`,
                type: 'damage'
            });

            if (target.currentHp <= 0) {
                state.log.push({
                    turn: state.turn,
                    message: `  ↳ ${target.name} has died!`,
                    type: 'death'
                });
            }
        }
    }

    private static executeHealSpell(state: GridCombatState, caster: GridCombatCharacter, target: GridCombatCharacter, spell: any): void {
        const healAmount = (spell.effect / 100) * caster.baseStats.damage;
        const oldHp = target.currentHp;
        target.currentHp = Math.min(target.baseStats.hp, target.currentHp + healAmount);
        const actualHeal = target.currentHp - oldHp;

        state.log.push({
            turn: state.turn,
            message: `${caster.name} heals ${target.name} for ${actualHeal.toFixed(1)} HP`,
            type: 'heal'
        });
    }

    private static executeBuffDebuff(state: GridCombatState, caster: GridCombatCharacter, target: GridCombatCharacter, spell: any): void {
        // For now, just log the buff/debuff application
        // Full integration with StatusEffectManager would require more complex logic
        state.metrics.statusApplied.set(caster.id, (state.metrics.statusApplied.get(caster.id) || 0) + 1);

        state.log.push({
            turn: state.turn,
            message: `${caster.name} casts ${spell.name} on ${target.name}`,
            type: spell.type === 'buff' ? 'buff' : 'debuff'
        });
    }

    private static getBuffedStats(character: GridCombatCharacter): StatBlock {
        // For now, just return base stats
        // Full stat buffing would require proper StatusEffectManager integration
        return { ...character.baseStats };
    }

    private static checkWinCondition(state: GridCombatState): boolean {
        const team1Alive = state.characters.filter(c => c.team === 'team1' && c.currentHp > 0).length;
        const team2Alive = state.characters.filter(c => c.team === 'team2' && c.currentHp > 0).length;

        if (team1Alive === 0) {
            state.winner = 'team2';
            return true;
        }
        if (team2Alive === 0) {
            state.winner = 'team1';
            return true;
        }
        return false;
    }
}
