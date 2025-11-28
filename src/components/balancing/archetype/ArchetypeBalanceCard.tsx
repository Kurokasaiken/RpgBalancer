import React from 'react';
import type { ArchetypeTemplate } from '../../../balancing/archetype/types';
import { ArchetypeBuilder } from '../../../balancing/archetype/ArchetypeBuilder';
import { CombatMetrics } from '../../../balancing/metrics/CombatMetrics';
import { NORMALIZED_WEIGHTS } from '../../../balancing/statWeights';
import { GlassCard } from '../../../ui/atoms/GlassCard';

interface ArchetypeBalanceCardProps {
    archetype: ArchetypeTemplate;
    budget?: number;
}

export const ArchetypeBalanceCard: React.FC<ArchetypeBalanceCardProps> = ({
    archetype,
    budget = 50
}) => {
    // 1. Build "Me" Stats
    const myStats = ArchetypeBuilder.calculateStatValues(archetype.allocation, budget, NORMALIZED_WEIGHTS);

    // 2. Build "Standard Opponent" (Balanced Build)
    // Assuming a flat balanced allocation
    const opponentStats = ArchetypeBuilder.calculateStatValues({
        hp: 20, damage: 20, armor: 15, txc: 15, evasion: 10, critChance: 10, critMult: 0, regen: 10, lifesteal: 0, ward: 0,
        armorPen: 0, penPercent: 0, block: 0, resistance: 0
    }, budget, NORMALIZED_WEIGHTS);


    // 3. Calculate Metrics
    // Offensive (Me vs Opponent)
    const myEDPT = CombatMetrics.calculateEDPT(myStats, opponentStats);
    const myTTK = CombatMetrics.calculateTTK(opponentStats.hp, myEDPT);
    const earlyImpact = CombatMetrics.calculateEarlyImpact(myStats, opponentStats);

    // Defensive (Opponent vs Me)
    const enemyEDPT = CombatMetrics.calculateEDPT(opponentStats, myStats);
    const survivalTTK = CombatMetrics.calculateTTK(myStats.hp, enemyEDPT);

    // SWI
    const swi = CombatMetrics.calculateSWI(myStats, opponentStats, 5);

    return (
        <GlassCard variant="neon" className="h-full">
            <h2 className="text-xl font-bold text-cyan-100 mb-4 flex items-center gap-2">
                <span>⚔️</span> 1v1 Combat Metrics
                <span className="text-xs font-normal text-gray-400 ml-auto">vs Standard Dummy (@{budget})</span>
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Offensive Metrics */}
                <div className="bg-black/20 p-3 rounded border border-white/5">
                    <h3 className="text-xs font-bold text-red-400 uppercase mb-2">Offense</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">TTK</span>
                            <span className="text-cyan-300 font-mono font-bold">{myTTK.toFixed(1)} turns</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">EDPT</span>
                            <span className="text-cyan-300 font-mono">{myEDPT.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Early Impact</span>
                            <span className="text-cyan-300 font-mono">{earlyImpact.toFixed(0)}</span>
                        </div>
                    </div>
                </div>

                {/* Defensive Metrics */}
                <div className="bg-black/20 p-3 rounded border border-white/5">
                    <h3 className="text-xs font-bold text-blue-400 uppercase mb-2">Defense</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Survival</span>
                            <span className="text-green-300 font-mono font-bold">{survivalTTK.toFixed(1)} turns</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Dmg Taken</span>
                            <span className="text-red-300 font-mono">{enemyEDPT.toFixed(1)} /turn</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SWI Analysis */}
            <div>
                <h3 className="text-xs font-bold text-purple-400 uppercase mb-3">Stat Weight Impact (SWI)</h3>
                <div className="space-y-2">
                    {Object.entries(swi)
                        .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)) // Sort by magnitude
                        .slice(0, 5) // Top 5
                        .map(([stat, impact]) => {
                            const isDefensive = impact > 0; // Positive means extended survival (Good for Def)
                            const isOffensive = impact < 0; // Negative means reduced kill time (Good for Off)
                            // Note: This logic depends on how SWI was calculated. 
                            // In CombatMetrics.ts: 
                            // Def stats -> Change in Survival Time (Positive = Good)
                            // Off stats -> Change in Kill Time (Negative = Good)

                            const color = isDefensive ? 'text-green-400' : (isOffensive ? 'text-red-400' : 'text-gray-400');
                            const barColor = isDefensive ? 'bg-green-500' : 'bg-red-500';

                            return (
                                <div key={stat} className="flex items-center gap-2 text-xs">
                                    <span className="w-16 capitalize text-gray-300 truncate">{stat}</span>
                                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${barColor}`}
                                            style={{ width: `${Math.min(100, Math.abs(impact) * 20)}%` }}
                                        />
                                    </div>
                                    <span className={`w-16 text-right font-mono ${color}`}>
                                        {impact > 0 ? '+' : ''}{impact.toFixed(2)}
                                    </span>
                                </div>
                            );
                        })}
                </div>
            </div>
        </GlassCard>
    );
};
