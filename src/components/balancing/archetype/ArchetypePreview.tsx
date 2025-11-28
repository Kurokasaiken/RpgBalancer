/**
 * ArchetypePreview Component
 * 
 * Shows final StatBlock values with warnings for imbalanced allocations
 */

import React from 'react';
import type { StatBlock } from '../../../balancing/types';

interface ArchetypePreviewProps {
    statBlock: StatBlock | null;
    budget: number;
    isValid: boolean;
}

export const ArchetypePreview: React.FC<ArchetypePreviewProps> = ({
    statBlock,
    budget,
    isValid
}) => {
    if (!isValid) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                <div className="text-center">
                    <div className="text-4xl mb-2">⚠️</div>
                    <h3 className="text-lg font-bold text-red-400 mb-2">Invalid Allocation</h3>
                    <p className="text-sm text-red-300">
                        Stat allocation must sum to exactly 100%
                    </p>
                </div>
            </div>
        );
    }

    if (!statBlock) {
        return (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
                <div className="text-center">
                    <div className="text-4xl mb-2">⏳</div>
                    <h3 className="text-lg font-bold text-yellow-400 mb-2">Calculating...</h3>
                    <p className="text-sm text-yellow-300">
                        Generating stat preview
                    </p>
                </div>
            </div>
        );
    }

    // Calculate "power level" (sum of all stats)
    const powerLevel = Object.values(statBlock).reduce((sum: number, val) => {
        return sum + (typeof val === 'number' ? val : 0);
    }, 0);

    // Group stats by category
    const offensive = ['damage', 'txc', 'critChance', 'critMult', 'armorPen', 'penPercent'];
    const defensive = ['hp', 'armor', 'resistance', 'evasion', 'ward', 'block'];
    const sustain = ['lifesteal', 'regen'];

    const renderStatGroup = (title: string, stats: string[]) => (
        <div className="mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                {title}
            </h4>
            <div className="space-y-1">
                {stats.map(stat => {
                    const value = (statBlock as any)[stat];
                    if (value === undefined || value === 0) return null;

                    return (
                        <div key={stat} className="flex justify-between items-center py-1 border-b border-white/5">
                            <span className="text-sm text-gray-300 capitalize">
                                {stat.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-sm font-mono text-cyan-400">
                                {typeof value === 'number' ? value.toFixed(1) : value}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-cyan-100">Stat Preview</h3>
                <div className="text-xs text-gray-400">
                    Budget: <span className="font-mono text-cyan-400">{budget} HP</span>
                </div>
            </div>

            {/* Power Level Indicator */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg p-4 mb-4">
                <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">Estimated Power Level</div>
                    <div className="text-3xl font-bold text-cyan-100">
                        {powerLevel.toFixed(0)}
                    </div>
                </div>
            </div>

            {/* Stat Groups */}
            {renderStatGroup('Offensive', offensive)}
            {renderStatGroup('Defensive', defensive)}
            {renderStatGroup('Sustain', sustain)}
        </div>
    );
};
