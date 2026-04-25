import type { StatBlock } from '../types';

/**
 * Service for calculating 1v1 combat metrics
 */
export class CombatMetrics {

    /**
     * Calculate Effective Damage Per Turn (EDPT)
     * Logic:
     * 1. Hit Chance (Linear: Base + Acc - Eva)
     * 2. Crit (Linear: Chance * Bonus)
     * 3. Mitigation:
     *    - Armor (Stat 'armor'): Percentage reduction (Standard Formula: X / (X + 50))
     *    - Ward (Stat 'ward'): FLAT Armor (subtracts from damage)
     * 4. Sustain: Regen + Lifesteal
     */
    static calculateEDPT(attacker: StatBlock, defender: StatBlock): number {
        // 1. Hit Chance (Linear)
        // Base 90% + (Acc - Eva)%
        const baseHit = 0.9;
        const hitVal = Math.max(0, Math.min(1, baseHit + (attacker.txc - defender.evasion) * 0.01));

        // 2. Crit (Linear)
        const critBonus = (attacker.critChance / 100) * (attacker.critMult - 1);

        // Raw Incoming Damage
        const rawDamage = attacker.damage * hitVal * (1 + critBonus);

        // 3. Percentage Mitigation
        // Armor (Stat) -> Treated as % Mitigation Source (using MOBA formula for scaling)
        const armorMitigationPercent = defender.armor / (defender.armor + 50);

        // Total % Multiplier (Only Armor now)
        const percentMitigationMult = (1 - armorMitigationPercent);

        const damageAfterPercent = rawDamage * percentMitigationMult;

        // 4. Flat Mitigation (Ward = Armor Flat)
        const flatArmor = defender.ward;

        const damageAfterFlat = Math.max(0, damageAfterPercent - flatArmor);

        // 5. Sustain (Regen + Lifesteal)
        // Lifesteal approximation (Defender vs Attacker)
        // Assuming Defender deals same damage as Attacker (Self vs Self context)
        const defenderEstimatedDmg = attacker.damage;
        const lifestealHeal = defenderEstimatedDmg * (defender.lifesteal / 100);
        const sustain = defender.regen + lifestealHeal;

        // Final EDPT
        return Math.max(0, damageAfterFlat - sustain);
    }

    /**
     * Calculate Time To Kill (TTK)
     */
    static calculateTTK(defenderHp: number, edpt: number): number {
        if (edpt <= 0) return 999; // Infinite
        return defenderHp / edpt;
    }

    /**
     * Calculate Stat Weight Impact (SWI)
     */
    static calculateSWI(
        baseStats: StatBlock,
        opponentStats: StatBlock,
        delta: number = 5
    ): Record<string, number> {
        const swi: Record<string, number> = {};
        const baseEDPT = this.calculateEDPT(baseStats, opponentStats);
        const baseTTK = this.calculateTTK(opponentStats.hp, baseEDPT);

        // Stats to analyze (must exist in StatBlock)
        const stats: (keyof StatBlock)[] = ['damage', 'hp', 'armor', 'critChance', 'critMult', 'txc', 'evasion', 'regen', 'lifesteal', 'ward'];

        stats.forEach(stat => {
            // Helper to safely add delta
            const addDelta = (block: StatBlock, key: keyof StatBlock): StatBlock => {
                const val = block[key];
                if (typeof val === 'number') {
                    return { ...block, [key]: val + delta };
                }
                return block;
            };

            let newTTK = 0;
            if (['hp', 'armor', 'evasion', 'regen', 'ward'].includes(stat)) {
                // Defensive Stat: Modify Me (Defender)
                const modDefender = addDelta(baseStats, stat);
                const enemyEDPT = this.calculateEDPT(opponentStats, modDefender);
                newTTK = this.calculateTTK(modDefender.hp, enemyEDPT);

                // SWI = Change in Survival Time
                const currentSurvival = this.calculateTTK(baseStats.hp, this.calculateEDPT(opponentStats, baseStats));
                swi[stat] = (newTTK - currentSurvival) / delta;
            } else {
                // Offensive Stat: Modify Me (Attacker)
                const modAttacker = addDelta(baseStats, stat);
                const myEDPT = this.calculateEDPT(modAttacker, opponentStats);
                newTTK = this.calculateTTK(opponentStats.hp, myEDPT);

                // SWI = Change in Kill Time
                swi[stat] = (newTTK - baseTTK) / delta;
            }
        });

        return swi;
    }

    /**
     * Calculate Early Impact (Damage in first 3 turns)
     */
    static calculateEarlyImpact(attacker: StatBlock, defender: StatBlock, turns: number = 3): number {
        const edpt = this.calculateEDPT(attacker, defender);
        return edpt * turns;
    }
}
