
import React, { useState } from 'react';
import { BASELINE_STATS } from '../../balancing/baseline';
import { toast } from 'sonner';
import { SpellInfoForm } from '../spell/components/SpellInfoForm';
import { StatsGrid } from '../spell/components/StatsGrid';
import { ActionsBar } from '../spell/components/ActionsBar';
import { SpellIdentityCard } from '../spell/components/SpellIdentityCard';
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

    // Balance calculation: sum of selected weights - target budget
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

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, field: string) => {
        e.dataTransfer.setData('text/plain', field);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetField: string) => {
        e.preventDefault();
        const draggedField = e.dataTransfer.getData('text/plain');
        if (draggedField === targetField) return;

        setStatOrder(prev => {
            const newOrder = [...prev];
            const draggedIdx = newOrder.indexOf(draggedField);
            const targetIdx = newOrder.indexOf(targetField);
            if (draggedIdx !== -1 && targetIdx !== -1) {
                newOrder.splice(draggedIdx, 1);
                newOrder.splice(targetIdx, 0, draggedField);
            }
            return newOrder;
        });
    };

    // Stat step management
    const getStatSteps = (field: string) => statSteps[field] || [{ value: (spell as any)[field] || 0, weight: 1 }];

    const updateStatStep = (field: string, idx: number, step: { value: number; weight: number }) => {
        setStatSteps(prev => {
            const steps = [...(prev[field] || [{ value: (spell as any)[field] || 0, weight: 1 }])];
            steps[idx] = step;
            return { ...prev, [field]: steps };
        });
        const currentTick = selectedTicks[field] || 0;
        if (idx === currentTick) {
            updateField(field as keyof Spell, step.value);
        }
    };

    const handleSelectTick = (field: string, idx: number) => {
        setSelectedTicks(prev => ({ ...prev, [field]: idx }));
        const steps = statSteps[field] || [{ value: (spell as any)[field] || 0, weight: 1 }];
        if (steps[idx]) {
            updateField(field as keyof Spell, steps[idx].value);
        }
    };

    const addStatStep = (field: string, idx: number) => {
        setStatSteps(prev => {
            const steps = [...(prev[field] || [{ value: (spell as any)[field] || 0, weight: 1 }])];
            steps.splice(idx + 1, 0, { value: 0, weight: 1 });
            return { ...prev, [field]: steps };
        });
    };

    const removeStatStep = (field: string, idx: number) => {
        setStatSteps(prev => {
            const steps = [...(prev[field] || [{ value: (spell as any)[field] || 0, weight: 1 }])];
            if (steps.length > 3) steps.splice(idx, 1);
            return { ...prev, [field]: steps };
        });
    };

    // Cost calculation using user baseline AND custom weights from sliders
    const getUserBaseline = (): Partial<Spell> => {
        try {
            const savedBaseline = localStorage.getItem('userSpellBaseline');
            if (savedBaseline) {
                return JSON.parse(savedBaseline);
            }
        } catch { }
        return getBaselineSpell();
    };

    const getCustomWeights = (): Record<string, number> => {
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
        return weights;
    };

    const cost = calculateSpellBudget(spell, getCustomWeights(), getUserBaseline());

    // Calcolo danno preview: effect% × damageBase × eco
    const previewDamage = (spell: Spell) => {
        const damageBase = BASELINE_STATS.damage;
        const effectPercent = spell.effect / 100;
        return (effectPercent * damageBase * spell.eco).toFixed(1);
    };

    const updateField = (field: keyof Spell, value: any) => {
        setSpell(prev => ({ ...prev, [field]: value }));
    };

    // Rimosso custom weight/baseline logic

    // Rimosso handleSaveConfig

    const handleSave = () => {
        // Get the default spell (basic attack) for comparison
        const defaultSpell = DEFAULT_SPELLS[0];
        // Build a minimal spell object keeping only fields that differ from defaults
        const minimalSpell: Partial<Spell> = { id: spell.id, name: spell.name, type: spell.type };
        (Object.keys(spell) as (keyof Spell)[]).forEach((key) => {
            if (key === 'id' || key === 'name' || key === 'type') return; // always keep these

            const value = spell[key];
            const defaultValue = (defaultSpell as any)[key];
            if (value !== undefined && value !== defaultValue) {
                (minimalSpell as any)[key] = value;
            }
        });
        const finalSpell = { ...minimalSpell, spellLevel: Math.round(cost) } as Spell;
        upsertSpell(finalSpell);
        toast.success('Spell saved successfully!', {
            description: `"${finalSpell.name}" has been added to your library`
        });
        setSpell(createEmptySpell());
        // setCustomWeights({});
    };

    const handleReset = () => {
        resetToDefaults();
    };

    const handleSaveDefault = () => {
        const success = saveDefaultConfig({
            spell,
            statOrder,
            collapsedStats,
            statSteps,
            selectedTicks
        });

        if (success) {
            toast.success('Configuration saved as default!', {
                description: 'Spell, card order, collapsed states, and slider positions saved'
            });
        } else {
            toast.error('Failed to save default', {
                description: 'Please try again or check console for errors'
            });
        }
    };



    const toggleCollapse = (field: string) => {
        setCollapsedStats(prev => {
            const next = new Set(prev);
            if (next.has(field)) {
                next.delete(field);
            } else {
                next.add(field);
            }
            // Salva anche in spellBalanceConfig per persistenza avanzata
            localStorage.setItem('spellCollapsedStats', JSON.stringify(Array.from(next)));
            localStorage.setItem('spellBalanceConfig', JSON.stringify({ collapsedStats: Array.from(next) }));
            return next;
        });
    };

    // handleRangeChange rimosso (non usato)

    // Dynamic label for stats based on spell type
    const getStatLabel = (field: string): string => {
        if (spell.type === 'buff' || spell.type === 'debuff') {
            if (field === 'eco') return 'Duration (Turns)';
            if (field === 'effect') return 'Modification %';
        }
        return field;
    };

    return (
        <div className="h-full overflow-y-auto p-4 relative pb-20">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl top-10 -left-20 animate-pulse" />
                <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl bottom-10 -right-20 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <div className="max-w-7xl mx-auto relative z-10">

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">🔮 Spell Creation</h1>
                    <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md">
                        <span className="text-sm uppercase tracking-wider text-gray-400 font-semibold">Balance</span>
                        <span className={`text - 2xl font - bold font - mono drop - shadow - [0_0_8px_currentColor] ${balance === 0 ? 'text-emerald-400' : 'text-red-400'} `}>
                            {balance > 0 ? '+' : ''}{balance.toFixed(2)}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-stretch gap-4 mb-4">
                    {/* Left Card: Cost & Balance (New Component) */}
                    <div className="w-full md:w-5/12">
                        <SpellIdentityCard
                            spell={spell}
                            updateField={updateField}
                            targetBudget={targetBudget}
                            setTargetBudget={setTargetBudget}
                            targetStatOptions={Array.from(BUFFABLE_STATS)}
                        />
                    </div>

                    {/* Right Card: Preview Spell */}
                    <div className="w-full md:w-7/12 min-w-[300px]">
                        <div className="backdrop-blur-md bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 h-full shadow-[0_4px_16px_rgba(6,182,212,0.15)] overflow-y-auto">
                            <div className="flex justify-between items-center text-lg font-bold text-cyan-100 mb-2 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)] border-b border-cyan-500/20 pb-1">
                                <span>Preview Spell</span>
                                {spell.type === 'damage' && (
                                    <span className="text-sm font-mono text-cyan-400">
                                        {previewDamage(spell)}
                                        <span className="text-xs text-cyan-300 ml-2">({spell.effect}% × {BASELINE_STATS.damage} × {spell.eco})</span>
                                    </span>
                                )}
                                {(spell.type === 'buff' || spell.type === 'debuff') && (
                                    <span className="text-sm font-mono text-cyan-400">
                                        {spell.type === 'buff' ? '⬆️ Buff' : '⬇️ Debuff'} for {spell.eco || 1} turn{(spell.eco || 1) > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            {(spell.type === 'buff' || spell.type === 'debuff') && (
                                <div className="mt-2 p-2 bg-gray-800/50 rounded border border-gray-700">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className={spell.type === 'buff' ? 'text-green-400' : 'text-red-400'}>
                                            {spell.type === 'buff' ? 'Increases' : 'Decreases'} {spell.targetStat || 'damage'}
                                        </span>
                                        <span className="text-gray-500">by</span>
                                        <span className="font-bold text-white">{Math.abs(spell.effect)}%</span>
                                        <span className="text-gray-500">for</span>
                                        <span className="font-bold text-white">{spell.eco} turns</span>
                                    </div>
                                </div>
                            )}

                            <ul className="text-xs text-cyan-50 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                                {/* Always show Effect first */}
                                {spell.effect !== undefined && (
                                    <li className="flex justify-between items-center hover:bg-cyan-500/10 p-0.5 rounded transition-colors border-b border-cyan-500/10">
                                        <span className="font-medium text-cyan-300/70 capitalize truncate mr-2">
                                            {spell.type === 'buff' || spell.type === 'debuff' ? 'Modification %' : 'Effect'}
                                        </span>
                                        <span className="font-mono text-cyan-300 font-bold drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]">{spell.effect}</span>
                                    </li>
                                )}
                                {Object.entries(spell)
                                    .filter(([key, value]) => {
                                        const defaultSpell = DEFAULT_SPELLS[0];
                                        return key !== 'id' && key !== 'name' && key !== 'type' && key !== 'effect' && key !== 'targetStat' && value !== undefined && value !== (defaultSpell as any)[key] && typeof value !== 'object';
                                    })
                                    .map(([key, value]) => (
                                        <li key={key} className="flex justify-between items-center hover:bg-cyan-500/10 p-0.5 rounded transition-colors border-b border-cyan-500/10">
                                            <span className="font-medium text-cyan-300/70 capitalize truncate mr-2" title={key}>
                                                {key === 'eco' && (spell.type === 'buff' || spell.type === 'debuff') ? 'Duration (Turns)' : key.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <span className="font-mono text-cyan-300 font-bold drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]">{String(value)}</span>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8" />

                <StatsGrid
                    statOrder={statOrder}
                    getStatDescription={getStatDescription}
                    isMalus={isMalus}
                    collapsedStats={collapsedStats}
                    toggleCollapse={toggleCollapse}
                    getStatSteps={getStatSteps}
                    updateStatStep={updateStatStep}
                    addStatStep={addStatStep}
                    removeStatStep={removeStatStep}
                    selectedTicks={selectedTicks}
                    onSelectTick={handleSelectTick}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    getStatLabel={getStatLabel}
                />

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8" />

                <SpellInfoForm spell={spell} updateField={updateField} />

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8" />

                <ActionsBar onReset={handleReset} onSave={handleSave} onSaveDefault={handleSaveDefault} balance={balance} />
            </div>
        </div>
    );
}
