import type { StatBlock } from './types';

export const STAT_COSTS: Record<string, number> = {
    hp: 1,
    damage: 4,
    txc: 2,
    evasion: 2,

    // Critical
    critChance: 5, // 1% Crit = 5 HP? (Needs tuning)
    critMult: 20, // +0.1x Crit Mult = 2 HP
    critTxCBonus: 1,

    // Mitigation
    armor: 3,
    resistance: 5, // 1% Res = 5 HP
    armorPen: 3,
    penPercent: 5
};

export const calculateStatBlockCost = (stats: StatBlock): number => {
    let cost = 0;

    cost += stats.hp * (STAT_COSTS.hp || 1);
    cost += stats.damage * (STAT_COSTS.damage || 1);
    cost += stats.txc * (STAT_COSTS.txc || 1);
    cost += stats.evasion * (STAT_COSTS.evasion || 1);

    cost += stats.critChance * (STAT_COSTS.critChance || 1);
    // Base crit mult is usually 2.0, so we pay for the excess
    cost += Math.max(0, stats.critMult - 2.0) * 10 * (STAT_COSTS.critMult || 1);
    cost += stats.critTxCBonus * (STAT_COSTS.critTxCBonus || 1);

    cost += stats.armor * (STAT_COSTS.armor || 1);
    cost += stats.resistance * (STAT_COSTS.resistance || 1);
    cost += stats.armorPen * (STAT_COSTS.armorPen || 1);
    cost += stats.penPercent * (STAT_COSTS.penPercent || 1);

    return Math.round(cost);
};
