import type { CombatConfig, CombatResult, TurnData } from './types';
import { calculateDamage } from '../../engine/combat/damageCalcul

ator';
import type { StatBlock } from '../statTypes';

/**
 * Combat Simulator - Turn-based 1v1 combat engine
 * 
 * CRITICAL: This simulator INHERITS all formulas from existing balancing modules.
 * Zero hardcoding - all damage/defense calculations use existing functions.
 * 
 * @see src/engine/combat/damageCalculator.ts for damage formulas
 * @see src/balancing/modules/mitigation.ts for defensive formulas
 */
export class CombatSimulator {
    /**
     * Run a single combat simulation
     * 
     * @param config Combat configuration (entities, turn limit, logging)
     * @returns Combat result with winner, turns, damage stats, HP remaining, etc.
     */
    static simulate(config: CombatConfig): CombatResult {
        const { entity1, entity2, turnLimit, enableDetailedLogging = false } = config;

        // Initialize combat state
        let hp1 = entity1.hp;
        let hp2 = entity2.hp;
        let totalDamage1 = 0;
        let totalDamage2 = 0;
        let turnCount = 0;
        const turnLog: TurnData[] = [];

        // Convert entity stats to StatBlock format (required by damage calculator)
        const stats1 = this.entityToStatBlock(entity1);
        const stats2 = this.entityToStatBlock(entity2);

        // Turn-based combat loop (alternating initiative)
        while (hp1 > 0 && hp2 > 0 && turnCount < turnLimit) {
            turnCount++;

            // Determine attacker/defender for this turn
            const isE1Attack = turnCount % 2 === 1; // Entity 1 attacks on odd turns
            const attacker = isE1Attack ? stats1 : stats2;
            const defender = isE1Attack ? stats2 : stats1;
            const attackerName = isE1Attack ? 'entity1' : 'entity2';
            const defenderName = isE1Attack ? 'entity2' : 'entity1';

            // Calculate damage using EXISTING formula (zero hardcoding)
            const damageResult = calculateDamage(attacker, defender);
            const damageDealt = damageResult.totalDamage;

            // Apply damage to defender
            if (isE1Attack) {
                hp2 -= damageDealt;
                totalDamage1 += damageDealt;
            } else {
                hp1 -= damageDealt;
                totalDamage2 += damageDealt;
            }

            // Log turn data if enabled
            if (enableDetailedLogging) {
                turnLog.push({
                    turnNumber: turnCount,
                    attacker: attackerName,
                    defender: defenderName,
                    damageDealt,
                    defenderHPRemaining: isE1Attack ? Math.max(0, hp2) : Math.max(0, hp1),
                });
            }
        }

        // Determine winner
        let winner: 'entity1' | 'entity2' | 'draw';
        if (hp1 > 0 && hp2 <= 0) {
            winner = 'entity1';
        } else if (hp2 > 0 && hp1 <= 0) {
            winner = 'entity2';
        } else {
            winner = 'draw'; // Turn limit reached
        }

        // Calculate overkill (damage dealt after opponent reached 0 HP)
        const overkill1 = hp2 < 0 ? Math.abs(hp2) : 0;
        const overkill2 = hp1 < 0 ? Math.abs(hp1) : 0;

        return {
            winner,
            turns: turnCount,
            damageDealt: {
                entity1: totalDamage1,
                entity2: totalDamage2,
            },
            hpRemaining: {
                entity1: Math.max(0, hp1),
                entity2: Math.max(0, hp2),
            },
            overkill: {
                entity1: overkill1,
                entity2: overkill2,
            },
            turnByTurnLog: enableDetailedLogging ? turnLog : undefined,
        };
    }

    /**
     * Convert EntityStats to StatBlock format required by damage calculator
     * 
     * This is a simple mapping. Extend as needed for your stat structure.
     */
    private static entityToStatBlock(entity: any): StatBlock {
        // TODO: Map your entity stats to StatBlock format
        // For now, using a basic mapping. Adjust based on your actual stat structure.
        return {
            // Base stats
            hp: entity.hp || 100,
            damage: entity.attack || 10,
            armor: entity.defense || 0,
            resistance: entity.resistance || 0,

            // Hit chance stats
            txc: entity.txc || 100, // "To-Cross": accuracy stat
            evasion: entity.evasion || 0,

            // Critical stats
            critChance: entity.critChance || 5,
            critMult: entity.critMult || 1.5,
            critTxCBonus: entity.critTxCBonus || 0,

            // Fail stats
            failChance: entity.failChance || 5,
            failMult: entity.failMult || 0.5,

            // Penetration stats
            armorPen: entity.armorPen || 0,
            penPercent: entity.penPercent || 0,

            // Config flags
            configFlatFirst: entity.configFlatFirst ?? false,
            configApplyBeforeCrit: entity.configApplyBeforeCrit ?? true,

            // Derived/calculated stats (not used in simple simulation, but required by StatBlock)
            htk: 0,
            hitChance: 0,
            attacksPerKo: 0,
            effectiveDamage: 0,
        } as StatBlock;
    }
}
