/**
 * Stat Allocation Card
 * 
 * A card for allocating points to a single stat with:
 * - Point allocation slider
 * - Point cost display
 * - Calculated stat value
 * - Visual feedback by stat type
 */

import React from 'react';
import { BalanceConfigManager } from '../../../balancing/BalanceConfigManager';

interface StatAllocationCardProps {
    statName: string;
    allocatedPoints: number;
    onPointsChange: (points: number) => void;
    maxPoints: number;
    statType: 'core' | 'offensive' | 'defensive' | 'sustain';
    customWeight?: number;
    onWeightChange?: (weight: number) => void;
}

const STAT_COLORS = {
    core: {
        bg: 'from-red-900/20 to-orange-900/20',
        border: 'border-red-500/30',
        text: 'text-red-400',
        glow: 'fantasy-glow-fire'
    },
    offensive: {
        bg: 'from-purple-900/20 to-violet-900/20',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        glow: 'fantasy-glow-arcane'
    },
    defensive: {
        bg: 'from-green-900/20 to-emerald-900/20',
        border: 'border-green-500/30',
        text: 'text-green-400',
        glow: 'fantasy-glow-nature'
    },
    sustain: {
        bg: 'from-cyan-900/20 to-blue-900/20',
        border: 'border-cyan-500/30',
        text: 'text-cyan-400',
        glow: 'fantasy-glow-water'
    }
};

const STAT_LABELS: Record<string, string> = {
    hp: 'HP',
    damage: 'Damage',
    txc: 'Accuracy (TxC)',
    evasion: 'Evasion',
    armor: 'Armor',
    resistance: 'Resistance',
    critChance: 'Crit Chance',
    critMult: 'Crit Multiplier',
    lifesteal: 'Lifesteal',
    regen: 'Regen',
    ward: 'Ward',
    block: 'Block',
    armorPen: 'Armor Pen',
    penPercent: 'Resistance Pen'
};

export const StatAllocationCard: React.FC<StatAllocationCardProps> = ({
    statName,
    allocatedPoints,
    onPointsChange,
    maxPoints,
    statType,
    customWeight,
    onWeightChange
}) => {
    const colors = STAT_COLORS[statType];
    const label = STAT_LABELS[statName] || statName;

    // Get weight from custom or config
    const weights = BalanceConfigManager.getWeights();
    const defaultWeight = typeof weights[statName] === 'number'
        ? weights[statName] as number
        : (weights[statName] as any)?.avgRatio || 1;

    const weight = customWeight !== undefined ? customWeight : defaultWeight;

    // Calculate stat value from points
    const statValue = allocatedPoints > 0 ? Math.round((allocatedPoints / weight) * 10) / 10 : 0;

    return (
        <div className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg p-3 transition-all hover:scale-[1.02]`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <span className={`font-semibold ${colors.text} text-sm`}>
                    {label}
                </span>
                <span className={`${colors.text} ${colors.glow} font-mono text-lg font-bold`}>
                    {statValue}
                </span>
            </div>

            {/* Slider */}
            <input
                type="range"
                min="0"
                max={maxPoints}
                value={allocatedPoints}
                onChange={(e) => onPointsChange(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                    background: `linear-gradient(to right, var(--stat-${statName}, ${colors.text}) 0%, var(--stat-${statName}, ${colors.text}) ${(allocatedPoints / maxPoints) * 100}%, rgba(255,255,255,0.1) ${(allocatedPoints / maxPoints) * 100}%, rgba(255,255,255,0.1) 100%)`
                }}
            />

            {/* Point info with editable weight */}
            <div className="flex justify-between items-center mt-2 text-xs gap-2">
                <span className="text-gray-400">Points: {allocatedPoints}</span>
                <div className="flex items-center gap-1">
                    <span className="text-gray-400">Weight:</span>
                    {onWeightChange ? (
                        <input
                            type="number"
                            value={weight}
                            onChange={(e) => onWeightChange(Number(e.target.value))}
                            min="0.01"
                            step="0.1"
                            className="w-16 bg-white/10 border border-white/20 rounded px-1 py-0.5 text-white text-xs font-mono focus:outline-none focus:border-yellow-500/50"
                            title="Edit weight"
                        />
                    ) : (
                        <span className="text-gray-300 font-mono">{weight.toFixed(2)}</span>
                    )}
                    {customWeight !== undefined && customWeight !== defaultWeight && (
                        <button
                            onClick={() => onWeightChange?.(defaultWeight)}
                            className="text-yellow-400 hover:text-yellow-300 text-xs"
                            title={`Reset to default (${defaultWeight.toFixed(2)})`}
                        >
                            ↺
                        </button>
                    )}
                </div>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-1 mt-2">
                <button
                    onClick={() => onPointsChange(0)}
                    className="flex-1 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                    title="Reset to 0"
                >
                    Clear
                </button>
                <button
                    onClick={() => onPointsChange(Math.min(allocatedPoints + 10, maxPoints))}
                    className="flex-1 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                    title="Add 10 points"
                >
                    +10
                </button>
                <button
                    onClick={() => onPointsChange(Math.max(allocatedPoints - 10, 0))}
                    className="flex-1 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors"
                    title="Remove 10 points"
                >
                    -10
                </button>
            </div>
        </div>
    );
};
