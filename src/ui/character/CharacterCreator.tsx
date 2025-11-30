/**
 * Character Creator
 * 
 * Main page for creating and editing characters with:
 * - Point budget input
 * - Archetype selection
 * - Variant naming
 * - Stat allocation
 * - Combat metrics summary
 * - Spell slot management
 * - Save/Load JSON functionality
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Character } from '../../balancing/character/types';
import type { StatBlock } from '../../balancing/types';
import type { ArchetypeTemplate } from '../../balancing/archetype/types';
import { CharacterBuilder } from '../../balancing/character/builder';
import { upsertCharacter, exportCharacterJSON, importCharacterJSON } from '../../balancing/character/storage';
import { ArchetypeRegistry } from '../../balancing/archetype/ArchetypeRegistry';
import { DEFAULT_ARCHETYPES } from '../../balancing/archetype/constants';
import { CharacterSummary } from './components/CharacterSummary';
import { StatAllocationCard } from './components/StatAllocationCard';
import { SpellSlotManager } from './components/SpellSlotManager';



// Stat groupings
const STAT_GROUPS = {
    core: ['hp', 'damage', 'txc'],
    offensive: ['critChance', 'critMult', 'armorPen', 'penPercent'],
    defensive: ['armor', 'resistance', 'evasion', 'ward', 'block'],
    sustain: ['lifesteal', 'regen']
};

export const CharacterCreator: React.FC = () => {
    // Archetype state (loaded from registry)
    const [archetypes, setArchetypes] = useState<ArchetypeTemplate[]>([]);
    const [loadingArchetypes, setLoadingArchetypes] = useState(true);

    const [character, setCharacter] = useState<Character>(() =>
        CharacterBuilder.createEmpty(DEFAULT_ARCHETYPES[0]?.id || 'balanced')
    );

    const [pointBudget, setPointBudget] = useState<number>(0);
    const [statAllocations, setStatAllocations] = useState<Partial<Record<keyof StatBlock, number>>>({});
    const [customWeights, setCustomWeights] = useState<Partial<Record<keyof StatBlock, number>>>({});

    // Load archetypes from registry on mount
    useEffect(() => {
        const registry = new ArchetypeRegistry();
        setArchetypes(registry.listAll());
        setLoadingArchetypes(false);
    }, []);

    // Calculate remaining points
    const usedPoints = CharacterBuilder.calculatePointCost(statAllocations);
    const remainingPoints = pointBudget - usedPoints;

    const handleNameChange = (name: string) => {
        setCharacter(prev => ({ ...prev, name }));
    };

    const handleArchetypeChange = (archetype: string) => {
        setCharacter(prev => ({ ...prev, archetype }));
    };

    const handleVariantChange = (variantName: string) => {
        setCharacter(prev => ({ ...prev, variantName: variantName || undefined }));
    };

    const handleStatAllocationChange = (statName: keyof StatBlock, points: number) => {
        setStatAllocations(prev => ({
            ...prev,
            [statName]: points
        }));
    };

    const handleBudgetChange = (budget: number) => {
        setPointBudget(Math.max(0, budget));
    };

    const handleSpellsChange = (spells: any[]) => {
        setCharacter(prev => ({ ...prev, equippedSpells: spells }));
    };

    const handleWeightChange = (statName: keyof StatBlock, weight: number) => {
        setCustomWeights(prev => ({
            ...prev,
            [statName]: weight
        }));
    };

    const handleSave = () => {
        // Build final character
        const finalCharacter = CharacterBuilder.buildCharacter({
            name: character.name,
            archetype: character.archetype,
            variantName: character.variantName,
            pointBudget,
            statAllocations,
            customWeights,
            equippedSpells: character.equippedSpells
        });

        // Validate
        const validation = CharacterBuilder.validateCharacter(finalCharacter);
        if (!validation.isValid) {
            toast.error('Character validation failed', {
                description: validation.errors.join(', ')
            });
            return;
        }

        // Show warnings if any
        if (validation.warnings.length > 0) {
            validation.warnings.forEach(warning => {
                toast.warning(warning);
            });
        }

        // Save
        upsertCharacter(finalCharacter);
        toast.success('Character saved!', {
            description: `"${finalCharacter.name}" has been saved successfully`
        });

        // Update local state with saved character
        setCharacter(finalCharacter);
    };

    const handleExportJSON = () => {
        try {
            const finalCharacter = CharacterBuilder.buildCharacter({
                name: character.name,
                archetype: character.archetype,
                variantName: character.variantName,
                pointBudget,
                statAllocations,
                customWeights,
                equippedSpells: character.equippedSpells
            });

            const json = exportCharacterJSON(finalCharacter);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${character.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            toast.success('Character exported!', {
                description: 'JSON file downloaded'
            });
        } catch (error) {
            toast.error('Export failed', {
                description: (error as Error).message
            });
        }
    };

    const handleImportJSON = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = event.target?.result as string;
                    const imported = importCharacterJSON(json);

                    setCharacter(imported);
                    setPointBudget(imported.pointBudget);
                    setStatAllocations(imported.statAllocations);
                    setCustomWeights((imported as any).customWeights || {});

                    toast.success('Character imported!', {
                        description: `"${imported.name}" loaded successfully`
                    });
                } catch (error) {
                    toast.error('Import failed', {
                        description: (error as Error).message
                    });
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleReset = () => {
        setCharacter(CharacterBuilder.createEmpty('balanced'));
        setPointBudget(0);
        setStatAllocations({});
        setCustomWeights({});
        toast.info('Reset complete', {
            description: 'All fields have been reset'
        });
    };

    // Build current character for preview
    const previewCharacter = {
        ...character,
        pointBudget,
        statAllocations,
        stats: CharacterBuilder.buildCharacter({
            name: character.name,
            archetype: character.archetype,
            variantName: character.variantName,
            pointBudget,
            statAllocations,
            customWeights,
            equippedSpells: character.equippedSpells
        }).stats
    };

    return (
        <div className="h-full overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 relative">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl top-10 -left-20 animate-pulse" />
                <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl bottom-10 -right-20 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white fantasy-glow-arcane">
                        ⚔️ Character Creator
                    </h1>

                    {/* Point budget display */}
                    <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md">
                        <span className="text-sm uppercase tracking-wider text-gray-400 font-semibold">Remaining</span>
                        <span className={`text-2xl font-bold font-mono fantasy-glow-wealth ${remainingPoints < 0 ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                            {remainingPoints}
                        </span>
                        <span className="text-sm text-gray-400">/ {pointBudget}</span>
                    </div>
                </div>

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-6" />

                {/* Main content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column - Character Info & Budget */}
                    <div className="space-y-4">
                        {/* Character Info Card */}
                        <div className="fantasy-glass rounded-lg p-4 space-y-3">
                            <h3 className="text-lg font-bold text-white fantasy-glow-water border-b border-white/10 pb-2">
                                📝 Character Info
                            </h3>

                            {/* Name */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={character.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Enter character name..."
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                                />
                            </div>

                            {/* Archetype */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Archetype</label>
                                {loadingArchetypes ? (
                                    <div className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-gray-500">
                                        Loading archetypes...
                                    </div>
                                ) : (
                                    <select
                                        value={character.archetype}
                                        onChange={(e) => handleArchetypeChange(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500/50"
                                    >
                                        {archetypes.length === 0 ? (
                                            <option value="" className="bg-gray-800">No archetypes available</option>
                                        ) : (
                                            archetypes.map(arch => (
                                                <option key={arch.id} value={arch.id} className="bg-gray-800">
                                                    {arch.name} - {arch.description}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                )}
                            </div>

                            {/* Variant */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Variant <span className="text-gray-600 italic">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={character.variantName || ''}
                                    onChange={(e) => handleVariantChange(e.target.value)}
                                    placeholder="Leave empty for main archetype..."
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500/50"
                                />
                            </div>

                            {/* Point Budget */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Point Budget</label>
                                <input
                                    type="number"
                                    value={pointBudget}
                                    onChange={(e) => handleBudgetChange(Number(e.target.value))}
                                    min="0"
                                    step="10"
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-yellow-500/50"
                                />
                            </div>
                        </div>

                        {/* Combat Metrics */}
                        <CharacterSummary character={previewCharacter as Character} />

                        {/* Spell Slots */}
                        <SpellSlotManager
                            equippedSpells={character.equippedSpells}
                            onSpellsChange={handleSpellsChange}
                        />
                    </div>

                    {/* Center & Right columns - Stat Allocations */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Core Stats */}
                        <div>
                            <h3 className="text-xl font-bold text-red-400 fantasy-glow-fire mb-3">
                                ⚡ Core Stats
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {STAT_GROUPS.core.map(stat => (
                                    <StatAllocationCard
                                        key={stat}
                                        statName={stat}
                                        allocatedPoints={statAllocations[stat as keyof StatBlock] || 0}
                                        onPointsChange={(points) => handleStatAllocationChange(stat as keyof StatBlock, points)}
                                        maxPoints={pointBudget}
                                        statType="core"
                                        customWeight={customWeights[stat as keyof StatBlock]}
                                        onWeightChange={(weight) => handleWeightChange(stat as keyof StatBlock, weight)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Offensive Stats */}
                        <div>
                            <h3 className="text-xl font-bold text-purple-400 fantasy-glow-arcane mb-3">
                                ⚔️ Offensive Stats
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {STAT_GROUPS.offensive.map(stat => (
                                    <StatAllocationCard
                                        key={stat}
                                        statName={stat}
                                        allocatedPoints={statAllocations[stat as keyof StatBlock] || 0}
                                        onPointsChange={(points) => handleStatAllocationChange(stat as keyof StatBlock, points)}
                                        maxPoints={pointBudget}
                                        statType="offensive"
                                        customWeight={customWeights[stat as keyof StatBlock]}
                                        onWeightChange={(weight) => handleWeightChange(stat as keyof StatBlock, weight)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Defensive Stats */}
                        <div>
                            <h3 className="text-xl font-bold text-green-400 fantasy-glow-nature mb-3">
                                🛡️ Defensive Stats
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {STAT_GROUPS.defensive.map(stat => (
                                    <StatAllocationCard
                                        key={stat}
                                        statName={stat}
                                        allocatedPoints={statAllocations[stat as keyof StatBlock] || 0}
                                        onPointsChange={(points) => handleStatAllocationChange(stat as keyof StatBlock, points)}
                                        maxPoints={pointBudget}
                                        statType="defensive"
                                        customWeight={customWeights[stat as keyof StatBlock]}
                                        onWeightChange={(weight) => handleWeightChange(stat as keyof StatBlock, weight)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Sustain Stats */}
                        <div>
                            <h3 className="text-xl font-bold text-cyan-400 fantasy-glow-water mb-3">
                                💚 Sustain Stats
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {STAT_GROUPS.sustain.map(stat => (
                                    <StatAllocationCard
                                        key={stat}
                                        statName={stat}
                                        allocatedPoints={statAllocations[stat as keyof StatBlock] || 0}
                                        onPointsChange={(points) => handleStatAllocationChange(stat as keyof StatBlock, points)}
                                        maxPoints={pointBudget}
                                        statType="sustain"
                                        customWeight={customWeights[stat as keyof StatBlock]}
                                        onWeightChange={(weight) => handleWeightChange(stat as keyof StatBlock, weight)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8" />

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 justify-center">
                    <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all fantasy-hover-glow-nature"
                    >
                        💾 Save Character
                    </button>

                    <button
                        onClick={handleExportJSON}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all fantasy-hover-glow-water"
                    >
                        📥 Export JSON
                    </button>

                    <button
                        onClick={handleImportJSON}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold rounded-lg transition-all fantasy-hover-glow-arcane"
                    >
                        📤 Import JSON
                    </button>

                    <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold rounded-lg transition-all"
                    >
                        ↺ Reset
                    </button>
                </div>
            </div>
        </div>
    );
};
