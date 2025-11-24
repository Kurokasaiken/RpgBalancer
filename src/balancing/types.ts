export interface StatBlock {
    hp: number;
    damage: number;
    txc: number; // Flat value
    evasion: number; // Flat value

    // Derived
    htk: number; // Pure HTK: hp / damage
    hitChance: number; // %: txc + 50 - evasion
    attacksPerKo: number; // htk / (hitChance / 100)
    effectiveDamage: number; // Damage after mitigation (simple, no crit)

    // Critical Module
    critChance: number; // %
    critMult: number; // Multiplier (e.g. 2.0)
    critTxCBonus: number; // Flat bonus

    failChance: number; // %
    failMult: number; // Multiplier (e.g. 0.0)
    failTxCMalus: number; // Flat malus

    // Mitigation Module
    armor: number; // Flat
    resistance: number; // %
    armorPen: number; // Flat
    penPercent: number; // %

    // Sustain Module
    lifesteal: number; // %
    regen: number; // Flat per turn
    ward: number; // Flat shield
    block: number; // %
    energyShield: number; // Flat
    thorns: number; // Flat or % (let's say Flat for now)

    // Timing/Speed Stats (NEW - ⚠️ NOT YET BALANCED)
    cooldownReduction: number; // % - Global CDR (formula: ?)
    castSpeed: number; // % - Faster casting (formula: ?)
    movementSpeed: number; // % - Movement/positioning (formula: ?, PvE only)

    // Config Flags (Not strictly stats, but part of the state)
    configFlatFirst: boolean; // true = (Dmg - Armor) * Res; false = (Dmg * Res) - Armor
    configApplyBeforeCrit: boolean; // true = Mitigate Base Dmg then Crit; false = Crit Dmg then Mitigate
}

export const DEFAULT_STATS: StatBlock = {
    hp: 150,  // ⬆️ Increased from 100 to extend combat duration
    damage: 25,
    txc: 25,
    evasion: 0,
    htk: 6,  // Updated: 150 / 25 = 6 (was 4)
    hitChance: 75,
    attacksPerKo: 8,  // Updated: 6 / 0.75 = 8 (was 5.33)
    effectiveDamage: 25,

    critChance: 5,
    critMult: 2.0,
    critTxCBonus: 20,

    failChance: 5,
    failMult: 0.0,
    failTxCMalus: 20,

    armor: 0,
    resistance: 0,
    armorPen: 0,
    penPercent: 0,

    lifesteal: 0,
    regen: 0,
    ward: 0,
    block: 0,
    energyShield: 0,
    thorns: 0,

    // Timing/Speed (NEW - not yet balanced)
    cooldownReduction: 0,  // ⚠️ Formula: ? (disabled)
    castSpeed: 0,          // ⚠️ Formula: ? (disabled)
    movementSpeed: 100,    // ⚠️ Base 100%, formula: ? (disabled, PvE only)

    configFlatFirst: true,
    configApplyBeforeCrit: false
};

export type LockedParameter = 'none' | 'hp' | 'damage' | 'htk' | 'txc' | 'evasion' | 'attacksPerKo' | 'effectiveDamage';
