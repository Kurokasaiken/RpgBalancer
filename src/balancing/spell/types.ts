/**
 * Spell type definitions used throughout the balancing system.
 */

export interface SpellTemplate {
    /** Unique identifier */
    id: string;
    /** Human‑readable name */
    name: string;
    /** Optional description */
    description?: string;

    // Primary allocation stats (percentage‑based where applicable)
    damage: number; // 0‑100 (percentage of budget allocated to raw damage)
    armorPen: number; // flat armor penetration points
    resPen: number; // % resistance penetration
    hitChance: number; // % chance to hit
    critChance: number; // % crit chance
    critMult: number; // multiplier, e.g., 2.0 for double damage on crit

    // Optional configuration flags (mirroring StatBlock config)
    configFlatFirst?: boolean;
    configApplyBeforeCrit?: boolean;
}

/** Runtime instance after budget allocation */
export interface SpellInstance extends SpellTemplate {
    /** HP‑equivalent cost calculated via spellCost module */
    spellPoints: number;
    /** Tier name (S, A, B, C, …) */
    tier: string;
}
