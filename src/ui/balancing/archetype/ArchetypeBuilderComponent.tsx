/**
 * ArchetypeBuilder - UI Component
 * 
 * Interactive interface for creating and editing archetype templates.
 * Uses Atomic components for consistent glassmorphism design.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import type { ArchetypeTemplate, StatAllocation, ArchetypeCategory } from '../../../balancing/archetype/types';
import { ArchetypeBuilder as Builder } from '../../../balancing/archetype/ArchetypeBuilder';
import { ArchetypeRegistry } from '../../../balancing/archetype/ArchetypeRegistry';
import { GlassCard } from '../../atoms/GlassCard';
import { GlassInput } from '../../atoms/GlassInput';
import { GlassButton } from '../../atoms/GlassButton';
import { GlassSelect } from '../../atoms/GlassSelect';
import { GlassSlider } from '../../atoms/GlassSlider';

// Stat names for allocation
const STAT_NAMES: (keyof StatAllocation & string)[] = [
    'hp', 'damage', 'armor', 'resistance', 'txc', 'evasion',
    'critChance', 'critMult', 'lifesteal', 'regen', 'ward',
    'block', 'armorPen', 'penPercent'
];

// Categories
const CATEGORIES: ArchetypeCategory[] = ['Tank', 'DPS', 'Assassin', 'Bruiser', 'Support', 'Hybrid'];

// Initial empty allocation
const EMPTY_ALLOCATION: StatAllocation = {
    hp: 0, damage: 0, armor: 0, resistance: 0, txc: 0, evasion: 0,
    critChance: 0, critMult: 0, lifesteal: 0, regen: 0, ward: 0,
    block: 0, armorPen: 0, penPercent: 0
};

export const ArchetypeBuilderComponent: React.FC = () => {
    // Template state
    const [template, setTemplate] = useState<ArchetypeTemplate>({
        id: '',
        name: '',
        description: '',
        category: 'Bruiser',
        allocation: { ...EMPTY_ALLOCATION },
        minBudget: 50,
        maxBudget: 500,
        tags: [],
        version: '1.0.0'
    });

    // UI state
    const [previewBudget, setPreviewBudget] = useState(100);
    const [tagInput, setTagInput] = useState('');

    // Calculate total allocation
    const totalAllocation: number = STAT_NAMES.reduce<number>(
        (sum, stat) => sum + template.allocation[stat],
        0
    );
    const allocationValid = Math.abs(totalAllocation - 100) < 0.01;

    // Update allocation for a stat
    const handleAllocationChange = (stat: keyof StatAllocation, value: number) => {
        setTemplate(prev => ({
            ...prev,
            allocation: {
                ...prev.allocation,
                [stat]: value
            }
        }));
    };

    // Auto-distribute remaining allocation
    const handleAutoDistribute = () => {
        if (totalAllocation >= 100) return;

        const remaining = 100 - totalAllocation;
        const nonZeroStats = STAT_NAMES.filter(s => template.allocation[s] > 0);

        if (nonZeroStats.length === 0) {
            toast.error('Add at least one stat allocation first');
            return;
        }

        const perStat = remaining / nonZeroStats.length;
        const newAllocation = { ...template.allocation };

        nonZeroStats.forEach(stat => {
            newAllocation[stat] += perStat;
        });

        setTemplate(prev => ({ ...prev, allocation: newAllocation }));
        toast.success(`Distributed ${remaining.toFixed(1)}% across ${nonZeroStats.length} stats`);
    };

    // Add tag
    const handleAddTag = () => {
        if (!tagInput.trim()) return;
        if (template.tags.includes(tagInput.trim())) {
            toast.error('Tag already exists');
            return;
        }

        setTemplate(prev => ({
            ...prev,
            tags: [...prev.tags, tagInput.trim()]
        }));
        setTagInput('');
    };

    // Remove tag
    const handleRemoveTag = (tag: string) => {
        setTemplate(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }));
    };

    // Save template
    const handleSave = () => {
        try {
            // Validate
            Builder.validateTemplate(template);

            // Save to registry
            const registry = new ArchetypeRegistry();
            registry.add(template);

            toast.success(`Archetype "${template.name}" saved!`);
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    // Export JSON
    const handleExport = () => {
        const json = JSON.stringify(template, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.id || 'archetype'}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Exported to JSON');
    };

    // Build preview StatBlock
    const previewStats = template.id && allocationValid
        ? Builder.buildArchetype(template, previewBudget)
        : null;

    return (
        <div className="h-full overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        🏗️ Archetype Builder
                    </h1>
                    <p className="text-gray-400">
                        Create balanced archetype templates with stat allocations
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Metadata */}
                    <div className="lg:col-span-1 space-y-4">
                        <GlassCard variant="neon">
                            <h2 className="text-xl font-bold text-cyan-400 mb-4">📝 Metadata</h2>

                            <div className="space-y-3">
                                <GlassInput
                                    label="ID"
                                    value={template.id}
                                    onChange={(e) => setTemplate(prev => ({ ...prev, id: e.target.value }))}
                                    placeholder="tank_high_hp"
                                />

                                <GlassInput
                                    label="Name"
                                    value={template.name}
                                    onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Tank - High HP"
                                />

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Description</label>
                                    <textarea
                                        value={template.description}
                                        onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Massive health pool focused tank"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                                        rows={3}
                                    />
                                </div>

                                <GlassSelect
                                    label="Category"
                                    value={template.category}
                                    onChange={(e) => setTemplate(prev => ({ ...prev, category: e.target.value as ArchetypeCategory }))}
                                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <GlassInput
                                        label="Min Budget"
                                        type="number"
                                        value={template.minBudget}
                                        onChange={(e) => setTemplate(prev => ({ ...prev, minBudget: Number(e.target.value) }))}
                                    />
                                    <GlassInput
                                        label="Max Budget"
                                        type="number"
                                        value={template.maxBudget}
                                        onChange={(e) => setTemplate(prev => ({ ...prev, maxBudget: Number(e.target.value) }))}
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Tags</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                            placeholder="Add tag..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                                        />
                                        <GlassButton onClick={handleAddTag} variant="primary" size="sm">
                                            Add
                                        </GlassButton>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {template.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-300 text-xs flex items-center gap-1"
                                            >
                                                {tag}
                                                <button
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="hover:text-red-400 transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Preview */}
                        <GlassCard variant="default">
                            <h2 className="text-xl font-bold text-white mb-4">👁️ Preview</h2>

                            <div className="mb-3">
                                <label className="block text-sm text-gray-400 mb-2">
                                    Budget: {previewBudget}
                                </label>
                                <input
                                    type="range"
                                    min={template.minBudget}
                                    max={template.maxBudget}
                                    value={previewBudget}
                                    onChange={(e) => setPreviewBudget(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {previewStats ? (
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {Object.entries(previewStats).map(([stat, value]) => (
                                        <div key={stat} className="flex justify-between">
                                            <span className="text-gray-400">{stat}:</span>
                                            <span className="text-white font-mono">{typeof value === 'number' ? value.toFixed(1) : value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Fill in metadata and allocations to preview</p>
                            )}
                        </GlassCard>
                    </div>

                    {/* Middle/Right: Stat Allocations */}
                    <div className="lg:col-span-2">
                        <GlassCard>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white">⚖️ Stat Allocation</h2>
                                <div className="flex items-center gap-3">
                                    <span className={`text-lg font-mono ${allocationValid ? 'text-green-400' :
                                        totalAllocation > 100 ? 'text-red-400' :
                                            'text-yellow-400'
                                        }`}>
                                        {totalAllocation.toFixed(1)}%
                                    </span>
                                    <GlassButton
                                        onClick={handleAutoDistribute}
                                        variant="secondary"
                                        size="sm"
                                        disabled={totalAllocation >= 100}
                                    >
                                        Auto-Distribute
                                    </GlassButton>
                                </div>
                            </div>

                            {!allocationValid && (
                                <div className={`mb-4 p-3 rounded-lg ${totalAllocation > 100
                                    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                    : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                                    }`}>
                                    {totalAllocation > 100
                                        ? `⚠️ Over-allocated by ${(totalAllocation - 100).toFixed(1)}%`
                                        : `⚠️ Under-allocated: ${(100 - totalAllocation).toFixed(1)}% remaining`
                                    }
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {STAT_NAMES.map(stat => (
                                    <div key={stat} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm text-gray-400 capitalize">
                                                {stat.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            <span className="text-white font-mono text-sm">
                                                {template.allocation[stat].toFixed(1)}%
                                            </span>
                                        </div>
                                        <GlassSlider
                                            value={template.allocation[stat]}
                                            onChange={(value) => handleAllocationChange(stat, value)}
                                            min={0}
                                            max={100}
                                            step={0.5}
                                        />
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        {/* Actions */}
                        <div className="mt-6 flex gap-3 justify-end">
                            <GlassButton
                                onClick={handleExport}
                                variant="secondary"
                            >
                                📥 Export JSON
                            </GlassButton>
                            <GlassButton
                                onClick={handleSave}
                                variant="primary"
                                disabled={!allocationValid || !template.id || !template.name}
                            >
                                💾 Save Archetype
                            </GlassButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
