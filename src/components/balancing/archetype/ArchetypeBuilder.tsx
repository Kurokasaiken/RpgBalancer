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
import type { ArchetypeCategory } from '../../../balancing/archetype/types';
import type { StatBlock } from '../../../balancing/types';
import { ArchetypeBuilder as Builder } from '../../../balancing/archetype/ArchetypeBuilder';
import { NORMALIZED_WEIGHTS } from '../../../balancing/statWeights';
import { ArchetypePreview } from './ArchetypePreview';
import {
    gildedPageBg,
    gildedSurface,
    gildedCard,
    gildedInput,
    gildedTextarea,
    gildedDivider,
    gildedLabel
} from './gildedTheme';

const CATEGORIES: ArchetypeCategory[] = ['Tank', 'DPS', 'Assassin', 'Bruiser', 'Support', 'Hybrid'];

type Allocation = Record<string, number>;

const DEFAULT_ALLOCATION: Allocation = {
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
    const [allocation, setAllocation] = useState<Allocation>(DEFAULT_ALLOCATION);
    const [archetypeName, setArchetypeName] = useState<string>('Custom Archetype');
    const [description, setDescription] = useState<string>('');

    // Calculate stats in real-time
    const statBlock = React.useMemo<StatBlock | null>(() => {
        try {
            return Builder.calculateStatValues(allocation, budget, NORMALIZED_WEIGHTS);
        } catch {
            return null;
        }
    }, [allocation, budget]);

    // Validation
    const allocationSum = Object.values(allocation).reduce<number>((a, b) => a + b, 0);
    const isValid = Math.abs(allocationSum - 100) < 0.01;

    const handleAllocationChange = (stat: keyof Allocation, value: number) => {
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

    const primaryButton =
        'inline-flex flex-1 items-center justify-center rounded-2xl border border-[#c9a227]/50 bg-[#c9a227]/10 px-4 py-3 text-sm font-semibold text-[#f6f3e4] hover:bg-[#c9a227]/20 transition-all disabled:opacity-40';

    const secondaryButton =
        'inline-flex items-center justify-center rounded-2xl border border-[#3b4b4d] px-4 py-3 text-sm font-semibold text-[#f6f3e4] hover:border-[#c9a227]/60 hover:text-[#c9a227] transition-all';

    const categoryButton = (isActive: boolean) =>
        `rounded-2xl px-3 py-2 text-sm font-semibold tracking-wide transition-all ${
            isActive
                ? 'bg-[#c9a227]/20 border border-[#c9a227]/60 text-[#f6f3e4]'
                : 'border border-transparent text-[#8db3a5] hover:border-[#3b4b4d] hover:text-[#f6f3e4]'
        }`;

    const sliderTrack = 'w-full h-2 rounded-full bg-[#1b282b] appearance-none cursor-pointer';
    return (
        <div className={`${gildedPageBg}`}>
            <div className="max-w-6xl mx-auto space-y-8">
                <section className={`${gildedSurface}`}>
                    <p className={gildedLabel}>Builder</p>
                    <h1 className="text-4xl font-display text-[#f6f3e4] mt-3">Archetype Forge</h1>
                    <p className="text-sm text-[#aeb8b4] mt-2">
                        Distribuisci il budget e visualizza in tempo reale lo StatBlock risultante. Tutte le modifiche saranno salvate nel catalogo JSON.
                    </p>
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                        <div className={gildedCard}>
                            <h2 className="text-2xl font-display text-[#f6f3e4] mb-4">Identità</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className={gildedLabel}>Nome</label>
                                    <input
                                        value={archetypeName}
                                        onChange={(e) => setArchetypeName(e.target.value)}
                                        placeholder="Es. Obsidian Vanguard"
                                        className={`${gildedInput} mt-2`}
                                    />
                                </div>

                                <div>
                                    <label className={gildedLabel}>Descrizione</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        placeholder="Descrivi ruolo, forza e punti deboli"
                                        className={`${gildedTextarea} mt-2`}
                                    />
                                </div>

                                <div>
                                    <label className={gildedLabel}>Categoria</label>
                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setCategory(cat)}
                                                type="button"
                                                className={categoryButton(category === cat)}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs text-[#8db3a5]">
                                        <span className="uppercase tracking-[0.3em]">Budget</span>
                                        <span>{budget} HP</span>
                                    </div>
                                    <div className="mt-2">
                                        <input
                                            type="range"
                                            min={10}
                                            max={100}
                                            step={5}
                                            value={budget}
                                            onChange={(e) => setBudget(Number(e.target.value))}
                                            className={sliderTrack}
                                            style={{
                                                background: `linear-gradient(to right, #c9a227 0%, #c9a227 ${((budget - 10) / 90) * 100}%, #1b282b ${((budget - 10) / 90) * 100}%, #1b282b 100%)`
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-[#6b7a78] mt-1">
                                        <span>10 HP</span>
                                        <span>100 HP</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={gildedCard}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className={gildedLabel}>Allocazione Stat</p>
                                    <h2 className="text-xl font-display text-[#f6f3e4]">Distribuisci 100%</h2>
                                </div>
                                <div className={`text-sm font-mono ${isValid ? 'text-[#8db3a5]' : 'text-[#f58c8c]'}`}>
                                    {allocationSum.toFixed(1)}% / 100%
                                </div>
                            </div>
                            <div className={`${gildedDivider} mb-4`} />
                            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                                {Object.keys(allocation).map(statKey => {
                                    const stat = statKey as keyof Allocation;
                                    return (
                                        <div key={stat} className="rounded-xl border border-[#2c3737] bg-[#0c1517]/60 p-3">
                                            <div className="flex items-center justify-between text-xs text-[#aeb8b4]">
                                                <span className="uppercase tracking-[0.2em]">{stat}</span>
                                                <span className="font-mono text-[#f6f3e4]">{allocation[stat]}%</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    step="1"
                                                    value={allocation[stat]}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                        handleAllocationChange(stat, Number(e.target.value))
                                                    }
                                                    className={sliderTrack}
                                                    style={{
                                                        background: `linear-gradient(to right, #8db3a5 0%, #8db3a5 ${allocation[stat]}%, #1b282b ${allocation[stat]}%, #1b282b 100%)`
                                                    }}
                                                />
                                                <input
                                                    type="number"
                                                    value={allocation[stat]}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                        handleAllocationChange(stat, Number(e.target.value))
                                                    }
                                                    className="w-16 rounded-2xl border border-[#3b4b4d] bg-[#0c1517]/70 px-2 py-1 text-right text-sm font-mono text-[#f6f3e4]"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button onClick={handleSave} className={primaryButton} disabled={!isValid}>
                                Salva Archetipo
                            </button>
                            <button onClick={() => setAllocation(DEFAULT_ALLOCATION)} className={secondaryButton}>
                                Reset
                            </button>
                        </div>
                    </div>

                    <ArchetypePreview statBlock={statBlock} budget={budget} isValid={isValid} />
                </div>
            </div>
        </div>
    );
};
