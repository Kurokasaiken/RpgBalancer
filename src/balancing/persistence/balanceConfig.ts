/**
 * Balance Configuration Schema
 * Defines the complete structure of a balance configuration.
 */

export interface BalanceConfig {
    version: string; // Semantic version (e.g., "1.0.0")

    // Stat weights (in HP equivalents)
    weights: {
        hp: number;
        damage: number;
        txc: number;
        evasion: number;
        agility: number;
        critChance: number;
        critMult: number;
        critTxCBonus: number;
        failChance: number;
        failMult: number;
        failTxCMalus: number;
        armor: number;
        resistance: number;
        armorPen: number;
        penPercent: number;
        lifesteal: number;
        regen: number;
        ward: number;
        block: number;
        energyShield: number;
        thorns: number;
        cooldownReduction: number;
        castSpeed: number;
        movementSpeed: number;
    };

    // Formula configurations (for future customization)
    formulas?: {
        hitChanceFormula?: string;
        critDamageFormula?: string;
        mitigationFormula?: string;
    };

    // Metadata
    metadata: {
        name: string;
        author?: string;
        description?: string;
        tags?: string[];
        createdAt: number;
        modifiedAt: number;
    };
}

/**
 * Get default balance config based on current system values.
 */
export function getDefaultBalanceConfig(): BalanceConfig {
    return {
        version: '1.0.0',
        weights: {
            hp: 1.0,
            damage: 5.0,
            txc: 0.2,
            evasion: 0.2,
            agility: 0.5,
            critChance: 0.05,
            critMult: 0.5,
            critTxCBonus: 0.1,
            failChance: 0.05,
            failMult: 0.0,
            failTxCMalus: 0.1,
            armor: 5.0,
            resistance: 20.0,
            armorPen: 5.0,
            penPercent: 20.0,
            lifesteal: 10.0,
            regen: 2.0,
            ward: 1.0,
            block: 10.0,
            energyShield: 1.0,
            thorns: 3.0,
            cooldownReduction: 0.0,
            castSpeed: 0.0,
            movementSpeed: 0.0
        },
        metadata: {
            name: 'Default Configuration',
            description: 'Standard balance weights',
            createdAt: Date.now(),
            modifiedAt: Date.now()
        }
    };
}
