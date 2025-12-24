import { DEFAULT_STATS, type StatBlock } from './types';
import { STAT_COSTS } from './costs';

export type Archetype = 'balanced' | 'tank' | 'glass_cannon' | 'evasive';

/**
 * Generates a stat block for a given archetype and budget points.
 */
export const generateStatBlock = (archetype: Archetype, points: number): StatBlock => {
    const stats: StatBlock = { ...DEFAULT_STATS };

    // Reset base stats that we want to allocate
    // We keep some minimums to avoid broken chars
    stats.hp = 10;
    stats.damage = 1;
    stats.txc = 0;
    stats.evasion = 0;
    stats.armor = 0;
    stats.resistance = 0;
    stats.critChance = 0;

    // Calculate remaining budget after base costs
    // (Assuming base stats cost something, but here we start from near zero)
    let budget = points;

    // Allocation Ratios (must sum to ~1.0)
    const ratios: Record<Archetype, Record<string, number>> = {
        balanced: { hp: 0.3, damage: 0.3, txc: 0.2, evasion: 0.2 },
        tank: { hp: 0.5, damage: 0.1, armor: 0.3, resistance: 0.1 },
        glass_cannon: { hp: 0.1, damage: 0.5, txc: 0.2, critChance: 0.2 },
        evasive: { hp: 0.2, damage: 0.2, txc: 0.1, evasion: 0.5 }
    };

    const ratio = ratios[archetype];

    // Distribute points
    for (const [stat, weight] of Object.entries(ratio)) {
        const statBudget = Math.floor(points * weight);
        const costPerPoint = STAT_COSTS[stat] || 1;
        const valueToAdd = Math.floor(statBudget / costPerPoint);

        (stats as any)[stat] += valueToAdd;
        budget -= valueToAdd * costPerPoint;
    }

    // Dump remaining dust into HP
    if (budget > 0) {
        stats.hp += Math.floor(budget / STAT_COSTS.hp);
    }

    return stats;
};
