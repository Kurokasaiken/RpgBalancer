/**
 * ArchetypeDetail Component
 * 
 * Detailed view of a single archetype with:
 * - Full stat breakdown
 * - Matchup predictions
 * - Edit/Delete/Clone actions
 */

import React from 'react';
import type { ArchetypeTemplate } from '../../../balancing/archetype/types';
import { ArchetypeBuilder as Builder } from '../../../balancing/archetype/ArchetypeBuilder';
import { NORMALIZED_WEIGHTS } from '../../../balancing/statWeights';
import { GlassCard } from '../../../ui/atoms/GlassCard';
import { GlassButton } from '../../../ui/atoms/GlassButton';
import { StatAllocationPie } from './StatAllocationPie';

interface ArchetypeDetailProps {
    archetype: ArchetypeTemplate;
    onEdit: () => void;
    onClone: () => void;
    onDelete: () => void;
    onClose: () => void;
}

export const ArchetypeDetail: React.FC<ArchetypeDetailProps> = ({
    archetype,
    onEdit,
    onClone,
    onDelete,
    onClose
}) => {
    // Calculate stats at different budget levels
    const budgetLevels = [20, 50, 75, 100];
    const statsByBudget = budgetLevels.map(budget => ({
        budget,
        stats: Builder.calculateStatValues(archetype.allocation, budget, NORMALIZED_WEIGHTS)
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <GlassCard variant="neon" className="mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-cyan-100">{archetype.name}</h1>
                                <span className="px-3 py-1 rounded text-sm font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                    {archetype.category}
                                </span>
                            </div>
                            <p className="text-gray-400">{archetype.description}</p>
                        </div>
                        <GlassButton onClick={onClose} variant="ghost" size="sm">
                            ✕ Close
                        </GlassButton>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-4">
                        <GlassButton onClick={onEdit} variant="primary">
                            Edit
                        </GlassButton>
                        <GlassButton onClick={onClone} variant="secondary">
                            Clone
                        </GlassButton>
                        <GlassButton onClick={onDelete} variant="danger">
                            Delete
                        </GlassButton>
                    </div>
                </GlassCard>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Allocation Visualization */}
                    <GlassCard>
                        <h2 className="text-xl font-bold text-cyan-100 mb-4">Stat Allocation</h2>
                        <StatAllocationPie allocation={archetype.allocation} />

                        {/* Top 5 stats */}
                        <div className="mt-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                                Allocation Breakdown
                            </h3>
                            <div className="space-y-2">
                                {Object.entries(archetype.allocation)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 8)
                                    .map(([stat, value]) => (
                                        <div key={stat} className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm text-gray-300 capitalize">{stat}</span>
                                                    <span className="text-sm font-mono text-cyan-400">{value}%</span>
                                                </div>
                                                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-cyan-500/50 rounded-full"
                                                        style={{ width: `${value}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </GlassCard>

                    {/* Right: Stats by Budget */}
                    <GlassCard>
                        <h2 className="text-xl font-bold text-cyan-100 mb-4">Stats at Different Budgets</h2>

                        <div className="space-y-4">
                            {statsByBudget.map(({ budget, stats }) => (
                                <div key={budget} className="border-b border-white/10 pb-4 last:border-0">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-bold text-gray-300">@ {budget} HP Budget</h3>
                                        <span className="text-xs text-gray-500">Power: {
                                            Object.values(stats).reduce((sum: number, val) =>
                                                sum + (typeof val === 'number' ? val : 0), 0
                                            ).toFixed(0)
                                        }</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                        {Object.entries(stats)
                                            .filter(([, val]) => typeof val === 'number' && val > 0)
                                            .slice(0, 6)
                                            .map(([stat, value]) => (
                                                <div key={stat} className="flex justify-between text-xs">
                                                    <span className="text-gray-400 capitalize">{stat}</span>
                                                    <span className="font-mono text-cyan-300">
                                                        {typeof value === 'number' ? value.toFixed(1) : value}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Metadata */}
                <GlassCard className="mt-6">
                    <h2 className="text-xl font-bold text-cyan-100 mb-4">Metadata</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Min Budget</div>
                            <div className="text-sm font-mono text-cyan-400">{archetype.minBudget} HP</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Max Budget</div>
                            <div className="text-sm font-mono text-cyan-400">{archetype.maxBudget} HP</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Version</div>
                            <div className="text-sm font-mono text-cyan-400">{archetype.version}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Author</div>
                            <div className="text-sm font-mono text-cyan-400">{archetype.author || 'System'}</div>
                        </div>
                    </div>

                    {/* Tags */}
                    {archetype.tags && archetype.tags.length > 0 && (
                        <div className="mt-4">
                            <div className="text-xs text-gray-500 mb-2">Tags</div>
                            <div className="flex flex-wrap gap-2">
                                {archetype.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};
