import type { CombatConfig, CombatResult, TurnData, RNG } from './types';
import { Entity } from '../../engine/core/entity';
import { createCombatState } from '../../engine/combat/state';
import { resolveCombatRound } from '../../engine/combat/logic';
import { BASELINE_STATS } from '../baseline';
import type { StatBlock } from '../types';

/**
 * Combat Simulator - Turn-based 1v1 combat engine
 * 
 * CRITICAL: This simulator INHERITS from existing combat engine.
 * ZERO formula implementation - all logic from src/engine/combat/logic.ts
 * 
 * @see src/engine/combat/logic.ts for combat engine
 * @see src/balancing/baseline.ts for baseline stats
 * @see src/balancing/modules/* for all combat formulas
 */
export class CombatSimulator {
    private rng: RNG;

    /**
     * Create a new CombatSimulator con RNG deterministico
     * @param rng Random Number Generator function (deve essere esplicito)
     */
    constructor(rng: RNG) {
        this.rng = rng;
    }

    /**
     * Run a single combat simulation (Static Wrapper)
     * RNG deve essere esplicito: nessun fallback a Math.random
     */
    static simulate(config: CombatConfig, rng: RNG): CombatResult {
        return new CombatSimulator(rng).simulate(config);
    }

    /**
     * Run a single combat simulation
     * 
     * @param config Combat configuration (entities, turn limit, logging)
     * @returns Combat result with winner, turns, damage stats, HP remaining, etc.
     */
    simulate(config: CombatConfig): CombatResult {
        const { entity1, entity2, turnLimit, enableDetailedLogging = false } = config;

        // Convert EntityStats to StatBlock format
        const statBlock1 = this.entityToStatBlock(entity1);
        const statBlock2 = this.entityToStatBlock(entity2);

        // Create Entity instances using fromStatBlock factory
        // This bypasses Attributes system and uses pure StatBlock
        const fighter1 = Entity.fromStatBlock('entity1', entity1.name || 'Entity 1', statBlock1);
        const fighter2 = Entity.fromStatBlock('entity2', entity2.name || 'Entity 2', statBlock2);

        // Create combat state using EXISTING combat system
        let state = createCombatState([fighter1], [fighter2]);

        // Track total damage dealt by each entity
        let totalDamage1 = 0;
        let totalDamage2 = 0;
        const initialHP1 = fighter1.currentHp;
        const initialHP2 = fighter2.currentHp;

        // Run combat loop using EXISTING engine
        while (!state.isFinished && state.turn < turnLimit) {
            // Track HP before turn
            const hpBefore1 = fighter1.currentHp;
            const hpBefore2 = fighter2.currentHp;

            // Resolve combat round using EXISTING logic
            // CRITICAL: Pass the seeded RNG to the logic engine
            state = resolveCombatRound(state, this.rng);

            // Calculate damage dealt this turn
            const damageTaken1 = hpBefore1 - fighter1.currentHp;
            const damageTaken2 = hpBefore2 - fighter2.currentHp;

            // Track cumulative damage (damage dealt TO opponent)
            totalDamage2 += damageTaken1; // Entity2 dealt damage to Entity1
            totalDamage1 += damageTaken2; // Entity1 dealt damage to Entity2
        }

        // Determine winner
        let winner: 'entity1' | 'entity2' | 'draw';
        if (state.winner === 'teamA') {
            winner = 'entity1';
        } else if (state.winner === 'teamB') {
            winner = 'entity2';
        } else {
            winner = 'draw';
        }

        // Calculate overkill (damage dealt after opponent reached 0 HP)
        // Overkill = total damage dealt - initial HP (if entity died)
        const hp1 = Math.max(0, fighter1.currentHp);
        const hp2 = Math.max(0, fighter2.currentHp);

        let overkill1 = 0;
        let overkill2 = 0;

        // Entity1's overkill = damage dealt to entity2 beyond its HP
        if (hp2 === 0 && totalDamage1 > initialHP2) {
            overkill1 = totalDamage1 - initialHP2;
        }

        // Entity2's overkill = damage dealt to entity1 beyond its HP
        if (hp1 === 0 && totalDamage2 > initialHP1) {
            overkill2 = totalDamage2 - initialHP1;
        }

        // Extract turn-by-turn log if requested
        const turnByTurnLog = enableDetailedLogging ? this.extractTurnLog(state) : undefined;

        return {
            winner,
            turns: state.turn,
            damageDealt: {
                entity1: totalDamage1,
                entity2: totalDamage2,
            },
            hpRemaining: {
                entity1: hp1,
                entity2: hp2,
            },
            overkill: {
                entity1: overkill1,
                entity2: overkill2,
            },
            turnByTurnLog,

            // Enhanced Metrics (Phase 9)
            initiativeRolls: {
                entity1: state.metrics.initiativeRolls.get(fighter1.id) || [],
                entity2: state.metrics.initiativeRolls.get(fighter2.id) || [],
            },
            hitRate: {
                entity1: (state.metrics.hits.get(fighter1.id) || 0) / Math.max(1, state.metrics.attacks.get(fighter1.id) || 1),
                entity2: (state.metrics.hits.get(fighter2.id) || 0) / Math.max(1, state.metrics.attacks.get(fighter2.id) || 1),
            },
            critRate: {
                entity1: (state.metrics.crits.get(fighter1.id) || 0) / Math.max(1, state.metrics.hits.get(fighter1.id) || 1),
                entity2: (state.metrics.crits.get(fighter2.id) || 0) / Math.max(1, state.metrics.hits.get(fighter2.id) || 1),
            },
            statusEffectsApplied: {
                entity1: state.metrics.statusApplied.get(fighter1.id) || 0,
                entity2: state.metrics.statusApplied.get(fighter2.id) || 0,
            },
            turnsStunned: {
                entity1: state.metrics.turnsStunned.get(fighter1.id) || 0,
                entity2: state.metrics.turnsStunned.get(fighter2.id) || 0,
            },
        };
    }

    /**
     * Convert EntityStats to StatBlock format required by combat engine
     * 
     * Uses BASELINE_STATS as reference for missing values
     */
    private entityToStatBlock(entity: any): StatBlock {
        // ✅ INHERIT baseline stats, override only what's provided
        return {
            ...BASELINE_STATS, // Start with validated baseline

            // Override with entity-specific stats
            hp: entity.hp ?? BASELINE_STATS.hp,
            damage: entity.attack ?? entity.damage ?? BASELINE_STATS.damage,
            armor: entity.defense ?? entity.armor ?? BASELINE_STATS.armor,
            resistance: entity.resistance ?? BASELINE_STATS.resistance,

            // Hit chance stats
            txc: entity.txc ?? BASELINE_STATS.txc,
            evasion: entity.evasion ?? BASELINE_STATS.evasion,

            // Critical stats
            critChance: entity.critChance ?? BASELINE_STATS.critChance,
            critMult: entity.critMult ?? BASELINE_STATS.critMult,
            critTxCBonus: entity.critTxCBonus ?? BASELINE_STATS.critTxCBonus,

            // Fail stats
            failChance: entity.failChance ?? BASELINE_STATS.failChance,
            failMult: entity.failMult ?? BASELINE_STATS.failMult,
            failTxCMalus: entity.failTxCMalus ?? BASELINE_STATS.failTxCMalus,

            // Penetration stats
            armorPen: entity.armorPen ?? BASELINE_STATS.armorPen,
            penPercent: entity.penPercent ?? BASELINE_STATS.penPercent,

            // Config flags
            configFlatFirst: entity.configFlatFirst ?? BASELINE_STATS.configFlatFirst,
            configApplyBeforeCrit: entity.configApplyBeforeCrit ?? BASELINE_STATS.configApplyBeforeCrit,
        } as StatBlock;
    }

    /**
   * Extract turn-by-turn data from combat log
   */
    private extractTurnLog(state: any): TurnData[] {
        const turnLog: TurnData[] = [];

        // Parse combat log for attack entries
        let currentTurn = 0;

        for (const entry of state.log) {
            // Track turn markers
            if (entry.message.startsWith('--- Turn')) {
                currentTurn = entry.turn;
                continue;
            }

            // Parse attack messages
            if (entry.type === 'attack' && entry.message.includes('attacks')) {
                // Example: "Entity 1 attacks Entity 2 for 25 damage. (75/100 HP left)"
                const match = entry.message.match(/attacks .+ for (\d+) damage\. \((\d+)\/\d+ HP left\)/);

                if (match) {
                    const damageDealt = parseInt(match[1]);
                    const defenderHPRemaining = parseInt(match[2]);

                    // Determine attacker based on message
                    const isEntity1Attacking = entry.message.startsWith('Entity 1') || entry.message.startsWith('entity1');

                    turnLog.push({
                        turnNumber: currentTurn,
                        attacker: isEntity1Attacking ? 'entity1' : 'entity2',
                        defender: isEntity1Attacking ? 'entity2' : 'entity1',
                        damageDealt,
                        defenderHPRemaining,
                    });
                }
            }
        }

        return turnLog;
    }
}
