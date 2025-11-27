import React, { useState } from 'react';
import { SpellInfoForm } from './components/SpellInfoForm';
import { StatsGrid } from './components/StatsGrid';
import { ActionsBar } from './components/ActionsBar';
import { SpellIdentityCard } from './components/SpellIdentityCard';
import type { Spell } from '../../balancing/spellTypes';
import { createEmptySpell } from '../../balancing/spellTypes';
import { DEFAULT_SPELLS } from '../../balancing/defaultSpells';
import {
    calculateSpellBudget,
    getStatDescription,
    isMalus,
    getBaselineSpell
} from '../../balancing/spellBalancingConfig';
import { upsertSpell } from '../../balancing/spellStorage';

export const SpellCreation: React.FC = () => {
    // Stato per gli step di ogni stat
    const [statSteps, setStatSteps] = useState<Record<string, Array<{ value: number; weight: number }>>>({});
    const [selectedTicks, setSelectedTicks] = useState<Record<string, number>>({});

    // Initial stat order - load from saved defaults if available
    const [statOrder, setStatOrder] = useState<string[]>(() => {
        try {
            const savedDefault = localStorage.getItem('userDefaultSpell');
            if (savedDefault) {
                const config = JSON.parse(savedDefault);
                if (config.statOrder) return config.statOrder;
            }
        } catch { }
        return [
            'effect', 'eco', 'dangerous', // core
            'scale', 'precision', // advanced
            'aoe', 'cooldown', 'range', 'priority', 'manaCost' // optional
        ];
    });

    const handleDragStart = (e: React.DragEvent, field: string) => {
        e.dataTransfer.setData('text/plain', field);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
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

    // Funzione per ottenere gli step di una stat
    const getStatSteps = (field: string) => statSteps[field] || [{ value: (spell as any)[field] || 0, weight: 1 }];

    // Funzione per aggiornare uno step
    const updateStatStep = (field: string, idx: number, step: { value: number; weight: number }) => {
        setStatSteps(prev => {
            const steps = [...(prev[field] || [{ value: (spell as any)[field] || 0, weight: 1 }])];
            steps[idx] = step;
            return { ...prev, [field]: steps };
        });

        // Se stiamo modificando il tick selezionato, aggiorna anche la spell
        const currentTick = selectedTicks[field] || 0;
        if (idx === currentTick) {
            updateField(field as keyof Spell, step.value);
        }
    };

    const handleSelectTick = (field: string, idx: number) => {
        setSelectedTicks(prev => ({ ...prev, [field]: idx }));
        // Aggiorna il valore nella spell quando cambia il tick selezionato
        const steps = statSteps[field] || [{ value: (spell as any)[field] || 0, weight: 1 }];
        if (steps[idx]) {
            updateField(field as keyof Spell, steps[idx].value);
        }
    };

    // Funzione per aggiungere uno step
    const addStatStep = (field: string, idx: number) => {
        setStatSteps(prev => {
            const steps = [...(prev[field] || [{ value: (spell as any)[field] || 0, weight: 1 }])];
            steps.splice(idx + 1, 0, { value: 0, weight: 1 });
            return { ...prev, [field]: steps };
        });
    };

    // Funzione per rimuovere uno step
    const removeStatStep = (field: string, idx: number) => {
        setStatSteps(prev => {
            const steps = [...(prev[field] || [{ value: (spell as any)[field] || 0, weight: 1 }])];
            if (steps.length > 3) steps.splice(idx, 1);
            return { ...prev, [field]: steps };
        });
    };
    // Main component for spell creation logic
    const [spell, setSpell] = useState<Spell>(() => {
        try {
            const savedDefault = localStorage.getItem('userDefaultSpell');
            if (savedDefault) {
                const config = JSON.parse(savedDefault);
                // Handle both old format (just spell) and new format (full config)
                return config.spell || config;
            }
        } catch { }
        return createEmptySpell();
    });
    // const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
    // const [customBaselines, setCustomBaselines] = useState<Partial<Spell>>({});
    const [targetBudget, setTargetBudget] = useState<number>(0);
    // Carica lo stato collapsed da file di config (es. spellBalanceConfig.json)
    const [collapsedStats, setCollapsedStats] = useState<Set<string>>(() => {
        try {
            // First try to load from userDefaultSpell
            const savedDefault = localStorage.getItem('userDefaultSpell');
            if (savedDefault) {
                const config = JSON.parse(savedDefault);
                if (config.collapsedStats) {
                    return new Set(config.collapsedStats);
                }
            }
            // Fall back to old config
            const config = localStorage.getItem('spellCollapsedStats') || localStorage.getItem('spellBalanceConfig');
            if (config) {
                const parsed = JSON.parse(config);
                if (Array.isArray(parsed.collapsedStats)) {
                    return new Set(parsed.collapsedStats);
                } else if (Array.isArray(parsed)) {
                    return new Set(parsed);
                }
            }
        } catch { }
        return new Set();
    });

    // Initialize custom baselines from config on mount
    // useEffect(() => {
    //     setCustomBaselines(getBaselineSpell());
    // }, []);

    // Define stat arrays first (used in multiple places)
    const coreStats = ['effect', 'eco', 'dangerous'];
    const advancedStats = ['scale', 'precision'];
    const optionalStats = ['aoe', 'cooldown', 'range', 'priority', 'manaCost'];

    // Cost calculation using user baseline AND custom weights from sliders
    const getUserBaseline = (): Partial<Spell> => {
        try {
            const savedBaseline = localStorage.getItem('userSpellBaseline');
            if (savedBaseline) {
                return JSON.parse(savedBaseline);
            }
        } catch { }
        // Fallback to default baseline from config
        return getBaselineSpell();
    };

    // Extract custom weights from selected ticks
    const getCustomWeights = (): Record<string, number> => {
        const weights: Record<string, number> = {};
        const allStats = [...coreStats, ...advancedStats, ...optionalStats];

        allStats.forEach(field => {
            const steps = statSteps[field];
            if (steps && steps.length > 0) {
                const selectedIdx = selectedTicks[field] || 0;
                const selectedStep = steps[selectedIdx];
                weights[field] = selectedStep?.weight || 1;
            } else {
                weights[field] = 1; // Default weight
            }
        });

        return weights;
    };

    // Balance calculation: sum of selected weights - target cost
    // This represents the "cost" of the current configuration
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

    // Keep the old cost calculation for spell level (might be useful later)
    const cost = calculateSpellBudget(spell, getCustomWeights(), getUserBaseline());

    // Calculate damage range for preview (min - max)
    // TODO: Implement full formula: hitChance% * effect * (1 + dangerous/100) * other_modifiers
    const calculateDamageRange = (): { min: number; max: number } | null => {
        // Placeholder - will be implemented with full combat formulas
        // const hitChance = spell.hitChance || 100;
        // const effect = spell.effect || 0;
        // const dangerous = spell.dangerous || 0;
        // const baseDamage = (hitChance / 100) * effect * (1 + dangerous / 100);
        // return { min: Math.floor(baseDamage * 0.9), max: Math.ceil(baseDamage * 1.1) };
        return null; // Return null for now
    };

    const damageRange = calculateDamageRange();
    const damageRangeText = damageRange ? `${damageRange.min} - ${damageRange.max}` : '-- - --';

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
        alert(`Spell "${finalSpell.name}" saved!`);
        setSpell(createEmptySpell());
        // setCustomWeights({});
    };

    const handleReset = () => {
        try {
            const savedDefault = localStorage.getItem('userDefaultSpell');
            if (savedDefault) {
                const config = JSON.parse(savedDefault);
                // Handle both old format (just spell) and new format (full config)
                if (config.spell) {
                    setSpell(config.spell);
                    if (config.statOrder) setStatOrder(config.statOrder);
                    if (config.collapsedStats) setCollapsedStats(new Set(config.collapsedStats));
                    if (config.statSteps) setStatSteps(config.statSteps);
                } else {
                    setSpell(config);
                }
                return;
            }
        } catch { }
        setSpell(createEmptySpell());
    };

    const handleSaveDefault = () => {
        try {
            const defaultConfig = {
                spell,
                statOrder,
                collapsedStats: Array.from(collapsedStats),
                statSteps
            };
            localStorage.setItem('userDefaultSpell', JSON.stringify(defaultConfig));

            // Also save as baseline for budget calculations
            localStorage.setItem('userSpellBaseline', JSON.stringify(spell));

            alert('Configuration saved as default AND baseline for cost calculations!');
        } catch (e) {
            console.error('Failed to save default spell', e);
            alert('Failed to save default.');
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



    return (
        <div className="h-full overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 relative">
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
                        <span className={`text-2xl font-bold font-mono drop-shadow-[0_0_8px_currentColor] ${balance === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
                        />
                    </div>

                    {/* Right Card: Preview Spell */}
                    <div className="w-full md:w-7/12 min-w-[300px]">
                        <div className="backdrop-blur-md bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 h-full shadow-[0_4px_16px_rgba(6,182,212,0.15)] overflow-y-auto">
                            <div className="flex justify-between items-center text-lg font-bold text-cyan-100 mb-2 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)] border-b border-cyan-500/20 pb-1">
                                <span>Preview Spell</span>
                                <span className="text-sm font-mono text-cyan-400">{damageRangeText}</span>
                            </div>
                            <ul className="text-xs text-cyan-50 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                                {/* Always show Effect first */}
                                {spell.effect !== undefined && (
                                    <li className="flex justify-between items-center hover:bg-cyan-500/10 p-0.5 rounded transition-colors border-b border-cyan-500/10">
                                        <span className="font-medium text-cyan-300/70 capitalize truncate mr-2">Effect</span>
                                        <span className="font-mono text-cyan-300 font-bold drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]">{spell.effect}</span>
                                    </li>
                                )}
                                {Object.entries(spell)
                                    .filter(([key, value]) => {
                                        const defaultSpell = DEFAULT_SPELLS[0];
                                        return key !== 'id' && key !== 'name' && key !== 'type' && key !== 'effect' && value !== undefined && value !== (defaultSpell as any)[key];
                                    })
                                    .map(([key, value]) => (
                                        <li key={key} className="flex justify-between items-center hover:bg-cyan-500/10 p-0.5 rounded transition-colors border-b border-cyan-500/10">
                                            <span className="font-medium text-cyan-300/70 capitalize truncate mr-2" title={key}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
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
