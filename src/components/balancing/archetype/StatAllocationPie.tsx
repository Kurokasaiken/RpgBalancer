/**
 * StatAllocationPie Component
 * 
 * Interactive pie chart showing stat allocation percentages
 * Uses Recharts for visualization
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { StatAllocation } from '../../../balancing/archetype/types';

interface StatAllocationPieProps {
    allocation: StatAllocation;
}

// Color palette for stats (following existing UI theme)
const STAT_COLORS: Record<keyof StatAllocation, string> = {
    damage: '#EF4444',      // Red - Offensive
    hp: '#10B981',          // Green - Defensive
    armor: '#3B82F6',       // Blue - Defensive
    resistance: '#8B5CF6',  // Purple - Defensive
    txc: '#F59E0B',         // Amber - Offensive
    evasion: '#EC4899',     // Pink - Defensive
    critChance: '#DC2626',  // Dark Red - Offensive
    critMult: '#B91C1C',    // Darker Red - Offensive
    lifesteal: '#14B8A6',   // Teal - Sustain
    regen: '#059669',       // Dark Green - Sustain
    ward: '#6366F1',        // Indigo - Defensive
    block: '#7C3AED',       // Violet - Defensive
    armorPen: '#F97316',    // Orange - Offensive
    penPercent: '#EA580C'   // Dark Orange - Offensive
};

export const StatAllocationPie: React.FC<StatAllocationPieProps> = ({ allocation }) => {
    // Convert allocation to chart data (filter out 0% stats)
    const data = (Object.entries(allocation) as [keyof StatAllocation, number][])
        .filter(([_, value]) => value > 0)
        .map(([stat, value]) => ({
            name: stat.charAt(0).toUpperCase() + stat.slice(1), // Capitalize
            value,
            color: STAT_COLORS[stat]
        }));

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black/90 border border-white/20 rounded px-3 py-2">
                    <p className="text-cyan-100 font-medium">{payload[0].name}</p>
                    <p className="text-cyan-400 font-mono">{payload[0].value.toFixed(1)}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
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
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: '12px' }}
                        iconType="circle"
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
