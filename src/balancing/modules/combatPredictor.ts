import { BALANCING_CONFIG } from '../balancingConfig';
import { HitChanceModule } from './hitchance';
import { MitigationModule } from './mitigation';

export interface CombatMetrics {
    ttk: number;      // Turns to Kill Enemy
    ttd: number;      // Turns to Die (Survive)
    winProb: number;  // Estimated Win Probability (0-1)
    dps: number;      // Damage Per Turn (Outgoing)
    dtps: number;     // Damage Taken Per Turn (Incoming Net)
}

export interface PlayerStats {
    hp: number;
    damage: number;
    txc: number;
    armor: number;
    evasion: number;
    critChance: number;
    critMult?: number;
    lifesteal: number;
    regen: number;
    armorPen?: number;
    penPercent?: number;
    configFlatFirst?: boolean;
    configApplyBeforeCrit?: boolean;
}

export const CombatPredictor = {
    /**
     * Calculate combat metrics against a Standard Baseline Enemy
     * NOW ALIGNED WITH ACTUAL COMBAT LOGIC
     */
    predict: (stats: Partial<PlayerStats>): CombatMetrics => {
        // 1. Fill missing stats with defaults
        const s = {
            hp: stats.hp || 0,
            damage: stats.damage || 0,
            txc: stats.txc || 0,
            armor: stats.armor || 0,
            evasion: stats.evasion || 0,
            critChance: stats.critChance || 0,
            critMult: stats.critMult || BALANCING_CONFIG.BASE_CRIT_MULT,
            lifesteal: stats.lifesteal || 0,
            regen: stats.regen || 0,
            armorPen: stats.armorPen || 0,
            penPercent: stats.penPercent || 0,
            configFlatFirst: stats.configFlatFirst !== undefined ? stats.configFlatFirst : true,
            configApplyBeforeCrit: stats.configApplyBeforeCrit !== undefined ? stats.configApplyBeforeCrit : false
        };

        // --- OFFENSIVE (TTK) ---
        // Enemy Stats
        const enemyHp = BALANCING_CONFIG.BASELINE_HP;
        const enemyEvasion = BALANCING_CONFIG.TARGET_EVASION;
        const enemyArmor = BALANCING_CONFIG.BASELINE_ARMOR;
        const enemyResistance = 0; // Assume no resistance on baseline

        // Hit Chance
        const hitChance = HitChanceModule.calculateHitChance(s.txc, enemyEvasion);

        // Crit is applied BEFORE or AFTER mitigation based on configApplyBeforeCrit
        let dmgPerHit: number;

        if (s.configApplyBeforeCrit) {
            // RARE CASE: Mitigation BEFORE Crit
            // First apply mitigation to base damage, then crit multiplier
            const mitigatedBase = MitigationModule.calculateEffectiveDamage(
                s.damage,
                enemyArmor,
                enemyResistance,
                s.armorPen,
                s.penPercent,
                s.configFlatFirst
            );

            // Then apply average crit multiplier
            const avgCritMult = 1 + ((s.critChance / 100) * (s.critMult - 1));
            dmgPerHit = mitigatedBase * avgCritMult;

        } else {
            // STANDARD CASE: Crit BEFORE Mitigation
            // Apply crit to raw damage first
            const avgCritMult = 1 + ((s.critChance / 100) * (s.critMult - 1));
            const rawDmgOut = s.damage * avgCritMult;

            // Then apply mitigation
            dmgPerHit = MitigationModule.calculateEffectiveDamage(
                rawDmgOut,
                enemyArmor,
                enemyResistance,
                s.armorPen,
                s.penPercent,
                s.configFlatFirst
            );
        }

        // Damage Per Turn (DPS) considering hit chance
        const dps = dmgPerHit * (hitChance / 100);

        // TTK
        const ttk = dps > 0 ? enemyHp / dps : 999;


        // --- DEFENSIVE (TTD) ---
        // Enemy Stats
        const enemyDmg = BALANCING_CONFIG.BASELINE_DAMAGE;
        const enemyTxc = BALANCING_CONFIG.BASELINE_TXC;
        const enemyCritChance = 0; // Baseline enemy doesn't crit
        const enemyCritMult = 1.0;
        const enemyArmorPen = 0;
        const enemyPenPercent = 0;

        // Enemy Hit Chance
        const enemyHitChance = HitChanceModule.calculateHitChance(enemyTxc, s.evasion);

        // Enemy damage after my mitigation
        let incomingDmgPerHit: number;

        if (s.configApplyBeforeCrit) {
            // Mitigation before crit (doesn't apply to enemy, but kept for consistency)
            const mitigatedEnemyBase = MitigationModule.calculateEffectiveDamage(
                enemyDmg,
                s.armor,
                0, // Player has no resistance in baseline
                enemyArmorPen,
                enemyPenPercent,
                s.configFlatFirst
            );
            const avgEnemyCritMult = 1 + ((enemyCritChance / 100) * (enemyCritMult - 1));
            incomingDmgPerHit = mitigatedEnemyBase * avgEnemyCritMult;
        } else {
            // Standard: Crit before mitigation
            const avgEnemyCritMult = 1 + ((enemyCritChance / 100) * (enemyCritMult - 1));
            const enemyRawDmg = enemyDmg * avgEnemyCritMult;
            incomingDmgPerHit = MitigationModule.calculateEffectiveDamage(
                enemyRawDmg,
                s.armor,
                0,
                enemyArmorPen,
                enemyPenPercent,
                s.configFlatFirst
            );
        }

        // Incoming Damage Per Turn
        const incomingDmgRaw = incomingDmgPerHit * (enemyHitChance / 100);

        // Sustain
        // Lifesteal is % of OUR DPS (damage we deal)
        const sustainPerTurn = (dps * (s.lifesteal / 100)) + s.regen;

        // Net Damage Taken
        const dtps = incomingDmgRaw - sustainPerTurn;

        // TTD
        // If dtps <= 0, we are immortal (infinite turns)
        const ttd = dtps > 0 ? s.hp / dtps : 999;

        // --- WIN PROBABILITY ---
        // Simple sigmoid based on TTD/TTK ratio
        const ratio = ttk > 0 ? ttd / ttk : 0;
        const winProb = ratio / (ratio + 1);

        return {
            ttk,
            ttd,
            winProb,
            dps,
            dtps
        };
    }
};
