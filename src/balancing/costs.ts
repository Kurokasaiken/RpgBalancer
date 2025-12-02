import type { StatBlock } from './types';
import { BalancerConfigStore } from './config/BalancerConfigStore';

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

const getStatWeight = (statId: string): number => {
    try {
        const config = BalancerConfigStore.load();
        const fromConfig = config.stats[statId]?.weight;
        if (typeof fromConfig === 'number') {
            // Active preset override, if present
            const preset = config.presets[config.activePresetId];
            const override = preset?.weights?.[statId];
            return typeof override === 'number' ? override : fromConfig;
        }
    } catch {
        // Fallback to legacy behaviour
    }

    return STAT_COSTS[statId] ?? 1;
};

export const calculateStatBlockCost = (stats: StatBlock): number => {
    let cost = 0;

    cost += stats.hp * getStatWeight('hp');
    cost += stats.damage * getStatWeight('damage');
    cost += stats.txc * getStatWeight('txc');
    cost += stats.evasion * getStatWeight('evasion');

    cost += stats.critChance * getStatWeight('critChance');
    // Base crit mult is usually 2.0, so we pay for the excess
    cost += Math.max(0, stats.critMult - 2.0) * 10 * getStatWeight('critMult');
    cost += stats.critTxCBonus * getStatWeight('critTxCBonus');

    cost += stats.armor * getStatWeight('armor');
    cost += stats.resistance * getStatWeight('resistance');
    cost += stats.armorPen * getStatWeight('armorPen');
    cost += stats.penPercent * getStatWeight('penPercent');

    return Math.round(cost);
};
