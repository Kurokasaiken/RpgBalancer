import React, { useState, useEffect } from 'react';
import { SpellInfoForm } from './components/SpellInfoForm';
import { StatsGrid } from './components/StatsGrid';
import { ActionsBar } from './components/ActionsBar';
import type { Spell } from '../../balancing/spellTypes';
import { createEmptySpell } from '../../balancing/spellTypes';
import { DEFAULT_SPELLS } from '../../balancing/defaultSpells';
import {
    calculateSpellBudget,
    getStatDescription,
    isMalus,
    SPELL_CONFIG,
    updateConfig,
    updateRange
} from '../../balancing/spellBalancingConfig';
import { upsertSpell } from '../../balancing/spellStorage';

export const SpellCreation: React.FC = () => {
    // Stato per gli step di ogni stat
    const [statSteps, setStatSteps] = useState<Record<string, Array<{ value: number; weight: number }>>>({});
    const [selectedTicks, setSelectedTicks] = useState<Record<string, number>>({});

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
    const [spell, setSpell] = useState<Spell>(createEmptySpell());
    // const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
    // const [customBaselines, setCustomBaselines] = useState<Partial<Spell>>({});
    const [targetBudget, setTargetBudget] = useState<number>(0);
    // Carica lo stato collapsed da file di config (es. spellBalanceConfig.json)
    const [collapsedStats, setCollapsedStats] = useState<Set<string>>(() => {
        try {
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

    const cost = calculateSpellBudget(spell);
    const balance = cost - targetBudget;

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
        setSpell(createEmptySpell());
        // setCustomWeights({});
    };

    const coreStats = ['effect', 'eco', 'dangerous'];
    const advancedStats = ['scale', 'precision'];
    const optionalStats = ['aoe', 'cooldown', 'range', 'priority', 'manaCost'];
    // Somma dei pesi di tutte le stat
    const totalWeight = [...coreStats, ...advancedStats, ...optionalStats].length;

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
                <h1 className="text-3xl font-bold text-white mb-6 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">🔮 Spell Creation</h1>
                <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
                    <div className="flex flex-col gap-3 flex-1 backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-300 text-lg">Cost</span>
                            <input
                                type="number"
                                value={targetBudget}
                                onChange={e => setTargetBudget(Number(e.target.value))}
                                className="w-20 bg-white/5 text-white px-2 py-1 rounded border border-white/10 text-lg font-bold focus:border-blue-400 focus:shadow-[0_0_8px_rgba(96,165,250,0.5)] transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-300 text-lg">Somma pesi:</span>
                            <span className="text-lg font-bold text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.6)]">{totalWeight.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-300 text-lg">Bilanciamento:</span>
                            <span className={`text-lg font-bold drop-shadow-[0_0_6px_currentColor] ${balance === 0 ? 'text-emerald-400' : 'text-red-400'}`}>{balance.toFixed(2)}</span>
                        </div>
                    </div>
                    {/* Preview card a destra */}
                    <div className="flex-1 flex justify-end">
                        <div className="backdrop-blur-lg bg-white/10 border border-purple-400/30 rounded-lg p-4 min-w-[220px] max-w-xs shadow-[0_8px_32px_rgba(139,92,246,0.15)]">
                            <div className="text-lg font-bold text-white mb-2 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]">Preview Spell</div>
                            <ul className="text-sm text-gray-100 space-y-1">
                                {Object.entries(spell)
                                    .filter(([key, value]) => {
                                        const defaultSpell = DEFAULT_SPELLS[0];
                                        return key !== 'id' && key !== 'name' && key !== 'type' && value !== undefined && value !== (defaultSpell as any)[key];
                                    })
                                    .map(([key, value]) => (
                                        <li key={key} className="flex justify-between">
                                            <span className="font-medium text-gray-300">{key}</span>
                                            <span className="font-mono text-blue-300 drop-shadow-[0_0_4px_rgba(96,165,250,0.4)]">{String(value)}</span>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8" />

                <StatsGrid
                    coreStats={coreStats}
                    advancedStats={advancedStats}
                    optionalStats={optionalStats}
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
                />

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8" />

                <SpellInfoForm spell={spell} updateField={updateField} />

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8" />

                <ActionsBar onReset={handleReset} onSave={handleSave} balance={balance} />
            </div>
        </div>
    );
}
