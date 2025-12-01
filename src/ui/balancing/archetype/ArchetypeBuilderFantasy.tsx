/**
 * ArchetypeBuilder - Fantasy UI Version
 * 
 * Interactive interface for creating and editing archetype templates.
 * Uses Fantasy components for medieval RPG aesthetic.
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import type { ArchetypeTemplate, StatAllocation, ArchetypeCategory } from '../../../balancing/archetype/types';
import { ArchetypeBuilder as Builder } from '../../../balancing/archetype/ArchetypeBuilder';
import { ArchetypeRegistry } from '../../../balancing/archetype/ArchetypeRegistry';
import { FantasyCard, FantasyButton, FantasyInput, FantasySlider, FantasySelect } from '../../atoms/index.fantasy';

// Stat names for allocation
const STAT_NAMES: (keyof StatAllocation)[] = [
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

export const ArchetypeBuilderFantasy: React.FC = () => {
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
    const totalAllocation = STAT_NAMES.reduce((sum, stat) => sum + template.allocation[stat], 0);
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
            Builder.validateTemplate(template);
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
        <div className="min-h-screen p-8 relative">
            {/* Background Overlay for better text readability if needed */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-10 text-center">
                    <h1 className="font-display text-5xl font-bold text-gradient-gold drop-shadow-lg mb-3">
                        🏗️ Archetype Forge
                    </h1>
                    <p className="font-body text-xl text-parchment-light/80 italic">
                        Craft balanced archetype templates within the Druid's Grove
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Metadata */}
                    <div className="lg:col-span-1 space-y-6">
                        <FantasyCard variant="ornate" padding="lg">
                            <div className="fantasy-ribbon text-xl">
                                Template Details
                            </div>

                            <div className="space-y-5">
                                <FantasyInput
                                    label="Identifier"
                                    value={template.id}
                                    onChange={(value) => setTemplate(prev => ({ ...prev, id: value }))}
                                    placeholder="tank_high_hp"
                                    fullWidth
                                />

                                <FantasyInput
                                    label="Name"
                                    value={template.name}
                                    onChange={(value) => setTemplate(prev => ({ ...prev, name: value }))}
                                    placeholder="Tank - High HP"
                                    fullWidth
                                />

                                <div>
                                    <label className="block font-display text-sm font-semibold text-wood-dark mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={template.description}
                                        onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Massive health pool focused tank..."
                                        className="w-full font-body text-base bg-parchment-medium text-wood-dark border-2 border-bronze-light rounded-lg px-4 py-3 focus:outline-none focus:border-sage focus:shadow-glow-green resize-none"
                                        rows={4}
                                    />
                                </div>

                                <div className="fantasy-divider" />

                                <FantasySelect
                                    label="Category"
                                    value={template.category}
                                    onChange={(value) => setTemplate(prev => ({ ...prev, category: value as ArchetypeCategory }))}
                                    options={CATEGORIES.map(c => ({ value: c, label: `${getCategoryIcon(c)} ${c}` }))}
                                    fullWidth
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FantasyInput
                                        label="Min Budget"
                                        type="number"
                                        value={template.minBudget.toString()}
                                        onChange={(value) => setTemplate(prev => ({ ...prev, minBudget: Number(value) }))}
                                    />
                                    <FantasyInput
                                        label="Max Budget"
                                        type="number"
                                        value={template.maxBudget.toString()}
                                        onChange={(value) => setTemplate(prev => ({ ...prev, maxBudget: Number(value) }))}
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block font-display text-sm font-semibold text-wood-dark mb-2">
                                        Tags
                                    </label>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                            placeholder="Add tag..."
                                            className="flex-1 font-body text-sm bg-parchment-medium text-wood-dark border-2 border-bronze-light rounded-lg px-3 py-2 focus:outline-none focus:border-sage"
                                        />
                                        <FantasyButton onClick={handleAddTag} variant="primary" size="sm">
                                            Add
                                        </FantasyButton>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {template.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="px-3 py-1 bg-sage/20 border border-forest rounded-lg font-body text-sm text-wood-dark flex items-center gap-2"
                                            >
                                                {tag}
                                                <button
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="hover:text-red-600 transition-colors font-bold"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </FantasyCard>

                        {/* Preview */}
                        <FantasyCard variant="wood" padding="lg">
                            <h2 className="font-display text-2xl font-bold text-parchment-light mb-6 text-center">
                                👁️ Preview
                            </h2>

                            <div className="mb-5">
                                <FantasySlider
                                    label="Budget"
                                    value={previewBudget}
                                    onChange={setPreviewBudget}
                                    min={template.minBudget}
                                    max={template.maxBudget}
                                    showValue
                                />
                            </div>

                            {previewStats ? (
                                <div className="grid grid-cols-2 gap-3 font-ui text-sm">
                                    {Object.entries(previewStats).map(([stat, value]) => (
                                        <div key={stat} className="flex justify-between items-center px-2 py-1 bg-wood-medium rounded border border-bronze">
                                            <span className="text-parchment-medium capitalize">{stat}</span>
                                            <span className="text-gold font-bold font-mono">
                                                {typeof value === 'number' ? value.toFixed(1) : value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="font-body text-parchment-medium/60 italic text-center">
                                    Fill metadata and reach 100% allocation to preview
                                </p>
                            )}
                        </FantasyCard>
                    </div>

                    {/* Middle/Right: Stat Allocations */}
                    <div className="lg:col-span-2">
                        <FantasyCard variant="ornate" padding="lg">
                            <div className="flex justify-between items-center mb-6">
                                <div className="fantasy-ribbon text-2xl px-12">
                                    Stat Distribution
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`font-display text-2xl font-bold ${allocationValid ? 'text-forest' :
                                        totalAllocation > 100 ? 'text-red-600' :
                                            'text-orange-500'
                                        }`}>
                                        {totalAllocation.toFixed(1)}%
                                    </span>
                                    <FantasyButton
                                        onClick={handleAutoDistribute}
                                        variant="secondary"
                                        size="sm"
                                        disabled={totalAllocation >= 100}
                                    >
                                        Auto-Distribute
                                    </FantasyButton>
                                </div>
                            </div>

                            {!allocationValid && (
                                <div className={`mb-6 p-4 rounded-lg border-2 ${totalAllocation > 100
                                    ? 'bg-red-100 border-red-500 text-red-700'
                                    : 'bg-yellow-100 border-yellow-500 text-yellow-700'
                                    }`}>
                                    <p className="font-body font-semibold">
                                        {totalAllocation > 100
                                            ? `⚠️ Over-allocated by ${(totalAllocation - 100).toFixed(1)}%`
                                            : `⚠️ ${(100 - totalAllocation).toFixed(1)}% remaining to allocate`
                                        }
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {STAT_NAMES.map((stat: keyof StatAllocation) => (
                                    <FantasySlider
                                        key={stat}
                                        label={stat.replace(/([A-Z])/g, ' $1').trim()}
                                        value={template.allocation[stat]}
                                        onChange={(value) => handleAllocationChange(stat, value)}
                                        min={0}
                                        max={100}
                                        step={0.5}
                                        showValue
                                    />
                                ))}
                            </div>
                        </FantasyCard>

                        {/* Actions */}
                        <div className="mt-8 flex gap-4 justify-end">
                            <FantasyButton
                                onClick={handleExport}
                                variant="secondary"
                                size="lg"
                                leftIcon="📥"
                            >
                                Export JSON
                            </FantasyButton>
                            <FantasyButton
                                onClick={handleSave}
                                variant="primary"
                                size="lg"
                                disabled={!allocationValid || !template.id || !template.name}
                                leftIcon="💾"
                            >
                                Save to Registry
                            </FantasyButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper to get category icon
function getCategoryIcon(category: ArchetypeCategory): string {
    const icons: Record<ArchetypeCategory, string> = {
        Tank: '🛡️',
        DPS: '⚔️',
        Assassin: '🗡️',
        Bruiser: '🔨',
        Support: '✨',
        Hybrid: '⚡'
    };
    return icons[category] || '📍';
}
