/**
 * SpellCostModule - Canonical Spell Power and Cost Calculation
 * 
 * ARCHITECTURE: Defines canonical formulas for spell balancing (regolamento)
 * Uses DoT/Buff modules for accurate power calculation
 * 
 * Spell power is calculated in HP-equivalent values for direct comparison
 * with stat investment and combat effectiveness.
 */

import type { Spell } from '../spellTypes';
import { DotModule } from './dot';
import { BuffModule, type Buff } from './buffs';
import { NORMALIZED_WEIGHTS } from '../statWeights';

export interface SpellPowerBreakdown {
    directDamage: number;
    directHeal: number;
    dotPower: number;
    hotPower: number;
    shieldPower: number;
    buffPower: number;
    debuffPower: number;
    aoeMultiplier: number;
    hitChanceAdjustment: number;
    totalPower: number;
}

/**
 * Spell Tier Boundaries (in Spell Points)
 */
export const SPELL_TIERS = {
    COMMON: { min: 0, max: 20, name: 'Common', color: '#9CA3AF', icon: '⚪' },
    UNCOMMON: { min: 21, max: 40, name: 'Uncommon', color: '#60A5FA', icon: '🔵' },
    RARE: { min: 41, max: 60, name: 'Rare', color: '#A78BFA', icon: '🟣' },
    EPIC: { min: 61, max: 80, name: 'Epic', color: '#F59E0B', icon: '🟠' },
    LEGENDARY: { min: 81, max: Infinity, name: 'Legendary', color: '#FBBF24', icon: '🟡' }
} as const;

export const SpellCostModule = {
    /**
     * Calculate total spell power in HP-equivalent
     * 
     * This is the core balancing formula that determines spell strength
     * relative to stat investment.
     */
    calculateSpellPower(
        spell: Spell,
        statWeights = NORMALIZED_WEIGHTS
    ): SpellPowerBreakdown {
        const breakdown: SpellPowerBreakdown = {
            directDamage: 0,
            directHeal: 0,
            dotPower: 0,
            hotPower: 0,
            shieldPower: 0,
            buffPower: 0,
            debuffPower: 0,
            aoeMultiplier: 1.0,
            hitChanceAdjustment: 1.0,
            totalPower: 0
        };

        // 1. Direct Damage/Heal vs DoT/HoT
        // eco = 1: Instant effect (direct)
        // eco > 1: Effect over time (DoT/HoT)
        const baseEffect = spell.effect; // Percentage (100 = base damage)
        const isOverTime = spell.eco && spell.eco > 1;

        if (spell.type === 'damage') {
            if (isOverTime) {
                // DoT: spread damage over turns
                const damagePerTurn = (baseEffect / 100) / spell.eco;
                const totalDotValue = DotModule.calculateTotalValue(
                    damagePerTurn,
                    spell.eco
                );
                breakdown.dotPower = totalDotValue * statWeights.damage;
            } else {
                // Direct damage
                breakdown.directDamage = (baseEffect / 100) * statWeights.damage;
            }
        } else if (spell.type === 'heal') {
            if (isOverTime) {
                // HoT: spread heal over turns
                const healPerTurn = (baseEffect / 100) / spell.eco;
                const totalHotValue = DotModule.calculateTotalValue(
                    healPerTurn,
                    spell.eco
                );
                breakdown.hotPower = totalHotValue * statWeights.hp;
            } else {
                // Direct heal
                breakdown.directHeal = (baseEffect / 100) * statWeights.hp;
            }
        }

        // 2. Shield
        if (spell.type === 'shield') {
            // Shield worth full HP value (no duration decay)
            breakdown.shieldPower = (baseEffect / 100) * statWeights.hp;
        }

        // 3. Buffs/Debuffs (using BuffModule)
        if (spell.type === 'buff' || spell.type === 'debuff') {
            // Create mock buff for power calculation
            const mockBuff: Buff = {
                id: spell.id,
                source: spell.name,
                type: 'stat_modifier',
                stat: 'damage', // Default, would need spell to specify
                value: baseEffect / 100,
                mode: 'multiplicative',
                duration: spell.duration || 3, // Default 3 turns
                stackable: false
            };

            const buffValue = BuffModule.calculateBuffPower(mockBuff, statWeights);

            if (spell.type === 'buff') {
                breakdown.buffPower = buffValue;
            } else {
                breakdown.debuffPower = buffValue;
            }
        }

        // 4. CC (Crowd Control) - treat as powerful offensive effect
        if (spell.type === 'cc') {
            // CC is VERY powerful - uses damage weight with 3x multiplier
            breakdown.buffPower = (baseEffect / 100) * statWeights.damage * 3.0;
        }

        // 5. AoE Multiplier (diminishing returns)
        breakdown.aoeMultiplier = this.calculateAoeMultiplier(spell.aoe);

        // 6. Hit Chance Adjustment
        breakdown.hitChanceAdjustment = (spell.dangerous || 100) / 100;

        // Calculate total
        const basePower =
            breakdown.directDamage +
            breakdown.directHeal +
            breakdown.dotPower +
            breakdown.hotPower +
            breakdown.shieldPower +
            breakdown.buffPower +
            breakdown.debuffPower;

        breakdown.totalPower = basePower * breakdown.aoeMultiplier * breakdown.hitChanceAdjustment;

        return breakdown;
    },

    /**
     * Calculate AoE multiplier with diminishing returns
     * 
     * - 1 target: 1.0x (baseline)
     * - 2-3 targets: 0.8x per target (small AoE DR)
     * - 4-5 targets: 0.6x per target (medium AoE DR)
     * - 6+ targets: 0.5x per target (large AoE heavy DR)
     */
    calculateAoeMultiplier(aoe: number): number {
        if (aoe <= 1) return 1.0;
        if (aoe <= 3) return Math.round(aoe * 0.8 * 10) / 10; // Round to 1 decimal
        if (aoe <= 5) return Math.round(aoe * 0.6 * 10) / 10;
        return Math.round(aoe * 0.5 * 10) / 10;
    },

    /**
     * Calculate balanced mana cost based on spell power
     * 
     * Formula: cost = (power / damagePerMana) * efficiencyMult * cooldownFactor
     */
    calculateManaCost(
        spell: Spell,
        statWeights = NORMALIZED_WEIGHTS
    ): number {
        const { totalPower } = this.calculateSpellPower(spell, statWeights);

        // Baseline: 1 mana = 2 HP damage worth
        const baseDamagePerMana = 2.0;

        // Spell type efficiency (some spell types cheaper/expensive)
        const efficiencyMult = this.getTypeEfficiency(spell.type);

        // Cooldown factor: longer CD = cheaper per use (can use less often)
        const cooldownFactor = spell.cooldown && spell.cooldown > 0
            ? 1.0 - Math.min(0.5, spell.cooldown / 20) // Max 50% discount at 10s CD
            : 1.0;

        // Cast time penalty: longer cast = slightly more expensive (more DPS loss)
        const castTimePenalty = spell.castTime && spell.castTime > 0.5
            ? 1 + (spell.castTime - 0.5) * 0.2
            : 1.0;

        const calculatedCost =
            (totalPower / baseDamagePerMana) *
            efficiencyMult *
            cooldownFactor *
            castTimePenalty;

        // Minimum cost of 1 mana
        return Math.max(1, Math.round(calculatedCost));
    },

    /**
     * Type-specific efficiency multipliers
     */
    getTypeEfficiency(type: Spell['type']): number {
        switch (type) {
            case 'damage': return 1.0;
            case 'heal': return 0.8; // Healing cheaper
            case 'shield': return 0.9; // Shields slightly cheaper
            case 'buff': return 1.1; // Buffs more expensive
            case 'debuff': return 1.2; // Debuffs most expensive
            case 'cc': return 1.5; // CC very expensive
            default: return 1.0;
        }
    },

    /**
     * Check if spell is balanced (power/mana ratio within acceptable range)
     * 
     * Target: 2.0 HP per mana (baseline)
     * Acceptable: 1.6 - 2.4 HP per mana (±20%)
     */
    isBalanced(spell: Spell, tolerance: number = 0.2): boolean {
        if (!spell.manaCost || spell.manaCost === 0) return false;

        const { totalPower } = this.calculateSpellPower(spell);
        const powerPerMana = totalPower / spell.manaCost;

        const targetRatio = 2.0;
        const minRatio = targetRatio * (1 - tolerance);
        const maxRatio = targetRatio * (1 + tolerance);

        return powerPerMana >= minRatio && powerPerMana <= maxRatio;
    },

    /**
     * Get recommended mana cost for a spell
     */
    getRecommendedManaCost(spell: Spell): number {
        return this.calculateManaCost(spell);
    },

    /**
     * Compare spell to stat investment
     * Returns how much HP-equivalent stats you'd need to match spell power
     */
    compareToStatInvestment(spell: Spell): {
        hpEquivalent: number;
        damageEquivalent: number;
        description: string;
    } {
        const { totalPower } = this.calculateSpellPower(spell);
        const damageWeight = NORMALIZED_WEIGHTS.damage;

        return {
            hpEquivalent: totalPower,
            damageEquivalent: totalPower / damageWeight,
            description: `This spell with ${spell.manaCost || 0} mana is worth ${totalPower.toFixed(0)} HP or ${(totalPower / damageWeight).toFixed(1)} damage`
        };
    },

    /**
     * Calculate spell points from HP cost
     * Currently 1:1 mapping, but can be adjusted for game balance
     */
    calculateSpellPoints(spell: Spell): number {
        const { totalPower } = this.calculateSpellPower(spell);
        // Simple 1:1 conversion for now
        // Could add multipliers based on spell category later
        return Math.round(totalPower);
    },

    /**
     * Assign tier based on spell points
     */
    calculateTier(spellPoints: number): 1 | 2 | 3 | 4 | 5 {
        if (spellPoints <= SPELL_TIERS.COMMON.max) return 1;
        if (spellPoints <= SPELL_TIERS.UNCOMMON.max) return 2;
        if (spellPoints <= SPELL_TIERS.RARE.max) return 3;
        if (spellPoints <= SPELL_TIERS.EPIC.max) return 4;
        return 5; // LEGENDARY
    },

    /**
     * Get complete SpellCost object
     */
    getSpellCost(spell: Spell): import('../archetype/types').SpellCost {
        const points = this.calculateSpellPoints(spell);
        const tier = this.calculateTier(points);

        return {
            spellPoints: points,
            tier
        };
    }
};

/**
 * WEIGHT CALIBRATION NOTES
 * 
 * Spell power must match combat effectiveness:
 * - DoT spells use DotModule.calculateTotalValue() for consistency
 * - Buffs use BuffModule.calculateBuffPower() for accuracy
 * - AoE has diminishing returns to prevent abuse
 * - Hit chance scales linearly (risky = less reliable power)
 * 
 * Mana cost baseline (2 HP per mana) assumes:
 * - Average combat: 8 turns
 * - Mana regen: ~5 per turn (entity dependent)
 * - Total mana pool: ~100 (entity dependent)
 * 
 * Type efficiency reflects risk/reward:
 * - Damage: 1.0x (baseline)
 * - Heal: 0.8x (defensive, less valuable)
 * - CC: 1.5x (extremely powerful, expensive)
 */
