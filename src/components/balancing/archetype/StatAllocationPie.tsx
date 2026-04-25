/**
 * StatAllocationPie Component
 * 
 * Interactive pie chart showing stat allocation percentages
 * Uses Recharts for visualization
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, type TooltipProps } from 'recharts';
import type { NameType, ValueType, Payload } from 'recharts/types/component/DefaultTooltipContent';
import type { StatAllocation } from '../../../balancing/archetype/types';

/**
 * Props for the StatAllocationPie component.
 */
interface StatAllocationPieProps {
    allocation: StatAllocation;
}

const STAT_LABELS: Record<keyof StatAllocation, string> = {
    damage: 'Damage',
    hp: 'Max HP',
    armor: 'Armor',
    resistance: 'Resistance',
    txc: 'Accuracy (TxC)',
    hitChance: 'Hit Chance',
    evasion: 'Evasion',
    critChance: 'Crit Chance',
    critMult: 'Crit Multiplier',
    lifesteal: 'Lifesteal',
    regen: 'Regeneration',
    ward: 'Ward',
    energyShield: 'Energy Shield',
    block: 'Block',
    armorPen: 'Armor Penetration',
    penPercent: 'Penetration %'
};

const STAT_DESCRIPTIONS: Partial<Record<keyof StatAllocation, string>> = {
    hitChance: 'Accuracy bonus that helps your archetype land attacks against evasive foes.',
    energyShield: 'Arcane barrier that absorbs incoming damage before it reaches HP.'
};

const FORCED_LEGEND_STATS: Array<keyof StatAllocation> = ['hitChance', 'energyShield'];

type AllocationTooltipPayload = Payload<ValueType, NameType>;
type AllocationTooltipProps = TooltipProps<ValueType, NameType> & {
    payload?: ReadonlyArray<AllocationTooltipPayload>;
};

const renderTooltipContent = ({ active, payload }: AllocationTooltipProps) => {
    if (active && payload && payload.length) {
        const { name, value, payload: rawPayload } = payload[0] ?? {};
        const statKey = (rawPayload as { statKey?: keyof StatAllocation } | undefined)?.statKey;
        const description = statKey ? STAT_DESCRIPTIONS[statKey] : undefined;
        return (
            <div className="bg-black/90 border border-white/20 rounded px-3 py-2">
                <p className="text-cyan-100 font-medium">{name}</p>
                <p className="text-cyan-400 font-mono">
                    {typeof value === 'number' ? `${value.toFixed(1)}%` : value}
                </p>
                {description ? (
                    <p className="mt-1 text-[11px] text-slate-200/90">{description}</p>
                ) : null}
            </div>
        );
    }
    return null;
};

// Color palette for stats (following existing UI theme)
const STAT_COLORS: Record<keyof StatAllocation, string> = {
    damage: '#EF4444',      // Red - Offensive
    hp: '#10B981',          // Green - Defensive
    armor: '#3B82F6',       // Blue - Defensive
    resistance: '#8B5CF6',  // Purple - Defensive
    txc: '#F59E0B',         // Amber - Offensive
    hitChance: '#FCD34D',   // Soft Amber - Accuracy
    evasion: '#EC4899',     // Pink - Defensive
    critChance: '#DC2626',  // Dark Red - Offensive
    critMult: '#B91C1C',    // Darker Red - Offensive
    lifesteal: '#14B8A6',   // Teal - Sustain
    regen: '#059669',       // Dark Green - Sustain
    ward: '#6366F1',        // Indigo - Defensive
    energyShield: '#4C1D95',// Deep Violet - Shielding
    block: '#7C3AED',       // Violet - Defensive
    armorPen: '#F97316',    // Orange - Offensive
    penPercent: '#EA580C'   // Dark Orange - Offensive
};

export const StatAllocationPie: React.FC<StatAllocationPieProps> = ({ allocation }) => {
    const entries = Object.entries(allocation) as [keyof StatAllocation, number][];

    const pieData = entries
        .filter(([, value]) => value > 0)
        .map(([stat, value]) => ({
            statKey: stat,
            name: STAT_LABELS[stat],
            value,
            color: STAT_COLORS[stat]
        }));

    const legendItems = React.useMemo(
        () => {
            const statsWithSlices = pieData.map(({ statKey }) => statKey);
            const combined = Array.from(new Set([...statsWithSlices, ...FORCED_LEGEND_STATS]));
            return combined.map((stat) => ({
                statKey: stat,
                color: STAT_COLORS[stat],
                label: STAT_LABELS[stat],
                value: allocation[stat] ?? 0
            }));
        },
        [allocation, pieData]
    );

    const renderLegend = React.useCallback(() => (
        <div className="mt-4 text-xs text-slate-200">
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {legendItems.map((item) => (
                    <div key={item.statKey} className="flex items-center gap-2">
                        <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                            aria-hidden
                        />
                        <div className="flex flex-col">
                            <span>{item.label}</span>
                            <span className="text-[11px] text-slate-400">
                                {item.value.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ), [legendItems]);

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => {
                            const safePercent = percent ?? 0;
                            return `${name} ${(safePercent * 100).toFixed(0)}%`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={renderTooltipContent} />
                    <Legend
                        content={renderLegend}
                        wrapperStyle={{ fontSize: '12px' }}
                        iconType="circle"
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

