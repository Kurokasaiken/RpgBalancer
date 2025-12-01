import React, { useState } from 'react';
import { BASELINE_STATS } from '../../balancing/baseline';
import { toast } from 'sonner';
import { FantasyLayout } from './FantasyLayout';
import { FantasyCard } from './atoms/FantasyCard';
import { FantasyInput } from './atoms/FantasyInput';
import { FantasyButton } from './atoms/FantasyButton';
import { FantasySlider } from './atoms/FantasySlider';
import type { Spell } from '../../balancing/spellTypes';
import { createEmptySpell } from '../../balancing/spellTypes';
import { DEFAULT_SPELLS } from '../../balancing/defaultSpells';
import {
    calculateSpellBudget,
    getStatDescription,
    isMalus,
    getBaselineSpell,
    BUFFABLE_STATS
} from '../../balancing/spellBalancingConfig';
import { upsertSpell } from '../../balancing/spellStorage';
import { useDefaultStorage } from '../../shared/hooks/useDefaultStorage';
import { ALL_SPELL_STATS } from '../../balancing/spellStatDefinitions';

export const FantasySpellCreation: React.FC = () => {
    // Use custom hooks for state management
    const {
        spell,
        setSpell,
        statOrder,
        setStatOrder,
        collapsedStats,
        setCollapsedStats,
        statSteps,
        setStatSteps,
        selectedTicks,
        setSelectedTicks,
        saveDefaultConfig,
        resetToDefaults
    } = useDefaultStorage();

    const [targetBudget, setTargetBudget] = useState<number>(0);

    // Define stat arrays for balance calculation
    const coreStats = ['effect', 'eco', 'dangerous'];
    const advancedStats = ['scale', 'precision'];
    const optionalStats = ['aoe', 'cooldown', 'range', 'priority', 'manaCost'];

    // Balance calculation
    const calculateBalance = (): number => {
        const allStats = [...coreStats, ...advancedStats, ...optionalStats];
        const totalWeightCost = allStats.reduce((sum, field) => {
            const steps = statSteps[field];
            if (steps && steps.length > 0) {
                const selectedIdx = selectedTicks[field] || 0;
                const selectedStep = steps[selectedIdx];
                return sum + (selectedStep?.weight || 0);
            }
            return sum;
        }, 0);

        return totalWeightCost - targetBudget;
    };

    const balance = calculateBalance();

    const updateField = (field: keyof Spell, value: any) => {
        setSpell(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        const defaultSpell = DEFAULT_SPELLS[0];
        const minimalSpell: Partial<Spell> = { id: spell.id, name: spell.name, type: spell.type };
        (Object.keys(spell) as (keyof Spell)[]).forEach((key) => {
            if (key === 'id' || key === 'name' || key === 'type') return;
            const value = spell[key];
            const defaultValue = (defaultSpell as any)[key];
            if (value !== undefined && value !== defaultValue) {
                (minimalSpell as any)[key] = value;
            }
        });

        // Calculate cost for spell level
        const weights: Record<string, number> = {};
        ALL_SPELL_STATS.forEach(field => {
            const steps = statSteps[field];
            if (steps && steps.length > 0) {
                const selectedIdx = selectedTicks[field] || 0;
                const selectedStep = steps[selectedIdx];
                weights[field] = selectedStep?.weight || 1;
            } else {
                weights[field] = 1;
            }
        });
        const cost = calculateSpellBudget(spell, weights, getBaselineSpell());

        const finalSpell = { ...minimalSpell, spellLevel: Math.round(cost) } as Spell;
        upsertSpell(finalSpell);
        toast.success('Spell saved successfully!', {
            description: `"${finalSpell.name}" has been added to your Grimoire`
        });
        setSpell(createEmptySpell());
    };

    const handleReset = () => {
        resetToDefaults();
    };

    return (
        <FantasyLayout activeTab="spells" onTabChange={() => { }}>
            <div className="space-y-6 pb-20">
                {/* Header Section */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-amber-100 drop-shadow-md font-serif">Spell Crafting</h1>
                        <p className="text-amber-400/80 italic">Weave magic into new forms</p>
                    </div>
                    <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-lg border border-amber-900/50 backdrop-blur-md">
                        <span className="text-sm uppercase tracking-wider text-amber-500 font-bold">Balance</span>
                        <span className={`text-2xl font-bold font-mono ${balance === 0 ? 'text-emerald-400' : balance > 0 ? 'text-amber-200' : 'text-red-400'}`}>
                            {balance > 0 ? '+' : ''}{balance.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Identity & Core Config */}
                    <div className="lg:col-span-4 space-y-6">
                        <FantasyCard title="Spell Identity" className="h-full">
                            <div className="space-y-4">
                                <FantasyInput
                                    label="Spell Name"
                                    value={spell.name}
                                    onChange={(val) => updateField('name', val)}
                                    placeholder="e.g. Fireball"
                                />

                                <div>
                                    <label className="block text-sm font-bold text-amber-200/80 mb-1 uppercase tracking-wider">School of Magic</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['damage', 'heal', 'buff', 'debuff', 'cc', 'shield'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => updateField('type', type)}
                                                className={`
                                                    px-2 py-2 rounded border transition-all text-xs font-bold uppercase
                                                    ${spell.type === type
                                                        ? 'bg-amber-900/80 border-amber-400 text-amber-100 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                                                        : 'bg-black/40 border-amber-900/30 text-amber-500/60 hover:border-amber-700 hover:text-amber-300'}
                                                `}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-amber-900/30">
                                    <FantasySlider
                                        label={`Target Budget: ${targetBudget}`}
                                        value={targetBudget}
                                        min={0}
                                        max={100}
                                        step={5}
                                        onChange={setTargetBudget}
                                    />
                                </div>
                            </div>
                        </FantasyCard>
                    </div>

                    {/* Right Column: Stats & Preview */}
                    <div className="lg:col-span-8 space-y-6">
                        <FantasyCard title="Magical Properties">
                            <div className="text-center text-amber-400/60 py-12 italic">
                                Stat configuration grid coming soon...
                            </div>
                        </FantasyCard>

                        <div className="flex justify-end gap-4">
                            <FantasyButton variant="secondary" onClick={handleReset}>
                                Reset Ritual
                            </FantasyButton>
                            <FantasyButton variant="primary" onClick={handleSave}>
                                Scribe Spell
                            </FantasyButton>
                        </div>
                    </div>
                </div>
            </div>
        </FantasyLayout>
    );
};
