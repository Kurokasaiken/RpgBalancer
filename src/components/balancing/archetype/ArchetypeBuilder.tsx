/**
 * ArchetypeBuilder Component
 * 
 * Interactive UI for creating custom archetypes:
 * - Category selection
 * - Budget slider
 * - Stat allocation sliders with pie chart
 * - Real-time stat preview
 */

import React, { useState } from 'react';
import type { ArchetypeCategory, StatAllocation } from '../../../balancing/archetype/types';
import { ArchetypeBuilder as Builder } from '../../../balancing/archetype/ArchetypeBuilder';
import { NORMALIZED_WEIGHTS } from '../../../balancing/statWeights';
import { GlassCard } from '../../../ui/atoms/GlassCard';
import { GlassButton } from '../../../ui/atoms/GlassButton';
import { GlassInput } from '../../../ui/atoms/GlassInput';
import { GlassSlider } from '../../../ui/atoms/GlassSlider';
import { ArchetypePreview } from './ArchetypePreview';

const CATEGORIES: ArchetypeCategory[] = ['Tank', 'DPS', 'Assassin', 'Bruiser', 'Support', 'Hybrid'];

const DEFAULT_ALLOCATION: StatAllocation = {
    damage: 20,
    hp: 20,
    armor: 10,
    resistance: 5,
    txc: 10,
    evasion: 5,
    critChance: 5,
    critMult: 5,
    lifesteal: 5,
    regen: 5,
    ward: 5,
    block: 5,
    armorPen: 0,
    penPercent: 0
};

export const ArchetypeBuilder: React.FC = () => {
    const [category, setCategory] = useState<ArchetypeCategory>('Hybrid');
    const [budget, setBudget] = useState<number>(50);
    const [allocation, setAllocation] = useState<StatAllocation>(DEFAULT_ALLOCATION);
    const [archetypeName, setArchetypeName] = useState<string>('Custom Archetype');
    const [description, setDescription] = useState<string>('');

    // Calculate stats in real-time
    const statBlock = React.useMemo(() => {
        try {
            return Builder.calculateStatValues(allocation, budget, NORMALIZED_WEIGHTS);
        } catch {
            return null;
        }
    }, [allocation, budget]);

    // Validation
    const allocationSum = Object.values(allocation).reduce((a, b) => a + b, 0);
    const isValid = Math.abs(allocationSum - 100) < 0.01;

    const handleAllocationChange = (stat: keyof StatAllocation, value: number) => {
        setAllocation(prev => ({ ...prev, [stat]: value }));
    };

    const handleSave = () => {
        if (!isValid || !statBlock) {
            alert('Invalid allocation - must sum to 100%');
            return;
        }

        // TODO: Save to registry
        console.log('Saving archetype:', {
            name: archetypeName,
            description,
            category,
            allocation,
            budget,
            statBlock
        });

        alert(`Archetype "${archetypeName}" saved!`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <GlassCard variant="neon" className="mb-6">
                    <h1 className="text-3xl font-bold text-cyan-100 mb-2">Archetype Builder</h1>
                    <p className="text-gray-400">Design custom character archetypes by distributing stats</p>
                </GlassCard>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Configuration */}
                    <div className="space-y-6">
                        {/* Identity */}
                        <GlassCard variant="default">
                            <h2 className="text-xl font-bold text-cyan-100 mb-4">Identity</h2>

                            <div className="space-y-4">
                                <GlassInput
                                    label="Name"
                                    value={archetypeName}
                                    onChange={(e) => setArchetypeName(e.target.value)}
                                    placeholder="Enter archetype name"
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full bg-black/20 border border-cyan-500/30 rounded px-3 py-2 text-cyan-50 focus:outline-none focus:border-cyan-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {CATEGORIES.map(cat => (
                                            <GlassButton
                                                key={cat}
                                                onClick={() => setCategory(cat)}
                                                variant={category === cat ? 'primary' : 'ghost'}
                                                size="sm"
                                            >
                                                {cat}
                                            </GlassButton>
                                        ))}
                                    </div>
                                </div>

                                <GlassSlider
                                    label={`Budget: ${budget} HP`}
                                    min={10}
                                    max={100}
                                    step={5}
                                    value={budget}
                                    onChange={(e) => setBudget(Number(e.target.value))}
                                    minLabel="10 HP"
                                    maxLabel="100 HP"
                                />
                            </div>
                        </GlassCard>

                        {/* Stat Allocation */}
                        <GlassCard variant="default">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-cyan-100">Stat Allocation</h2>
                                <div className={`text-sm font-mono ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                                    {allocationSum.toFixed(1)}% / 100%
                                </div>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {(Object.keys(allocation) as (keyof StatAllocation)[]).map(stat => (
                                    <div key={stat} className="flex items-center gap-3">
                                        <label className="w-24 text-sm text-gray-300 capitalize">{stat}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={allocation[stat]}
                                            onChange={(e) => handleAllocationChange(stat, Number(e.target.value))}
                                            className="flex-1"
                                        />
                                        <input
                                            type="number"
                                            value={allocation[stat]}
                                            onChange={(e) => handleAllocationChange(stat, Number(e.target.value))}
                                            className="w-16 bg-black/20 border border-cyan-500/30 rounded px-2 py-1 text-cyan-50 text-sm text-right"
                                        />
                                        <span className="text-xs text-gray-500">%</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <GlassButton
                                onClick={handleSave}
                                disabled={!isValid}
                                variant="primary"
                                className="flex-1"
                            >
                                Save Archetype
                            </GlassButton>
                            <GlassButton
                                onClick={() => setAllocation(DEFAULT_ALLOCATION)}
                                variant="secondary"
                            >
                                Reset
                            </GlassButton>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div>
                        <ArchetypePreview
                            statBlock={statBlock}
                            budget={budget}
                            isValid={isValid}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
