import React, { useState, useEffect } from 'react';
import { SpellInfoForm } from './components/SpellInfoForm';
import { StatsGrid } from './components/StatsGrid';
import { ActionsBar } from './components/ActionsBar';
import type { Spell } from '../../balancing/spellTypes';
import { createEmptySpell } from '../../balancing/spellTypes';
import { DEFAULT_SPELLS } from '../../balancing/defaultSpells';
import {
    calculateSpellBudget,
    getStatWeight,
    getStatRange,
    getStatDescription,
    isMalus,
    SPELL_CONFIG,
    updateConfig,
    updateRange,
    getBaselineSpell
} from '../../balancing/spellBalancingConfig';
import { upsertSpell } from '../../balancing/spellStorage';

export const SpellCreation: React.FC = () => {
        // Stato per gli step di ogni stat
        const [statSteps, setStatSteps] = useState<Record<string, Array<{ value: number; weight: number }>>>({});

        // Funzione per ottenere gli step di una stat
        const getStatSteps = (field: string) => statSteps[field] || [{ value: (spell as any)[field] || 0, weight: getStatWeight(field) }];

        // Funzione per aggiornare uno step
        const updateStatStep = (field: string, idx: number, step: { value: number; weight: number }) => {
            setStatSteps(prev => {
                const steps = [...(prev[field] || [{ value: (spell as any)[field] || 0, weight: getStatWeight(field) }])];
                steps[idx] = step;
                return { ...prev, [field]: steps };
            });
        };

        // Funzione per aggiungere uno step
        const addStatStep = (field: string, idx: number) => {
            setStatSteps(prev => {
                const steps = [...(prev[field] || [{ value: (spell as any)[field] || 0, weight: getStatWeight(field) }])];
                steps.splice(idx + 1, 0, { value: 0, weight: getStatWeight(field) });
                return { ...prev, [field]: steps };
            });
        };

        // Funzione per rimuovere uno step
        const removeStatStep = (field: string, idx: number) => {
            setStatSteps(prev => {
                const steps = [...(prev[field] || [{ value: (spell as any)[field] || 0, weight: getStatWeight(field) }])];
                if (steps.length > 1) steps.splice(idx, 1);
                return { ...prev, [field]: steps };
            });
        };
    // Main component for spell creation logic
    const [spell, setSpell] = useState<Spell>(createEmptySpell());
    const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
    const [customBaselines, setCustomBaselines] = useState<Partial<Spell>>({});
    const [targetBudget, setTargetBudget] = useState<number>(0);
    const [collapsedStats, setCollapsedStats] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('spellCollapsedStats');
        if (saved) {
            try {
                return new Set(JSON.parse(saved));
            } catch {
                return new Set();
            }
        }
        return new Set();
    });

    // Initialize custom baselines from config on mount
    useEffect(() => {
        setCustomBaselines(getBaselineSpell());
    }, []);

    const cost = calculateSpellBudget(
        spell,
        Object.keys(customWeights).length > 0 ? customWeights : undefined,
        Object.keys(customBaselines).length > 0 ? customBaselines : undefined
    );
    const balance = cost - targetBudget;

    const updateField = (field: keyof Spell, value: any) => {
        setSpell(prev => ({ ...prev, [field]: value }));
    };

    const updateWeight = (field: string, value: number) => {
        setCustomWeights(prev => ({ ...prev, [field]: value }));
    };

    const updateBaseline = (field: string, value: number) => {
        setCustomBaselines(prev => ({ ...prev, [field]: value }));
    };

    const getEffectiveWeight = (field: string): number => {
        return customWeights[field] !== undefined ? customWeights[field] : getStatWeight(field);
    };

    const getEffectiveBaseline = (field: string): number => {
        return (customBaselines as any)[field] !== undefined ? (customBaselines as any)[field] : (getBaselineSpell() as any)[field] || 0;
    };

    const handleSaveConfig = () => {
        if (confirm('Save current weights and baselines as the new default configuration?')) {
            const newConfig = {
                ...SPELL_CONFIG,
                weights: { ...SPELL_CONFIG.weights, ...customWeights },
                baseline: { ...SPELL_CONFIG.baseline, ...customBaselines }
            };
            updateConfig(newConfig);
            alert('Configuration saved as new default!');
            setCustomWeights({}); // Clear custom weights as they are now default
            // Baselines remain in state but match default now
        }
    };

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
        setCustomWeights({});
    };

    const handleReset = () => {
        setSpell(createEmptySpell());
        setCustomWeights({});
    };

    const coreStats = ['effect', 'eco', 'dangerous'];
    const advancedStats = ['scale', 'precision'];
    const optionalStats = ['aoe', 'cooldown', 'range', 'priority', 'manaCost'];
    // Somma dei pesi di tutte le stat
    const totalWeight = [
        ...coreStats,
        ...advancedStats,
        ...optionalStats
    ].reduce((sum, stat) => sum + getStatWeight(stat), 0);

    const toggleCollapse = (field: string) => {
        setCollapsedStats(prev => {
            const next = new Set(prev);
            if (next.has(field)) {
                next.delete(field);
            } else {
                next.add(field);
            }
            localStorage.setItem('spellCollapsedStats', JSON.stringify(Array.from(next)));
            return next;
        });
    };

    const handleRangeChange = (field: string, newRange: { min: number; max: number; step: number }) => {
        if (confirm(`Update range configuration for ${field}? This will affect all spells.`)) {
            updateRange(field, newRange);
            // Force re-render or update local state if needed, but config update should be enough if component re-reads it
            // However, getStatRange reads from SPELL_CONFIG which is updated in memory
            // We might need to force update or just rely on React re-rendering parent
            // Let's force a re-render by updating a dummy state or just alerting
            alert(`Range for ${field} updated!`);
        }
    };



    return (
        <div className="h-full overflow-y-auto bg-gray-900 p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-2">🔮 Spell Creation</h1>
                <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-lg">Cost =</span>
                        <input
                            type="number"
                            value={targetBudget}
                            onChange={e => setTargetBudget(Number(e.target.value))}
                            className="w-20 bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 text-lg font-bold"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-lg">Somma pesi:</span>
                        <span className="text-lg font-bold text-blue-400">{totalWeight.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-lg">Bilanciamento:</span>
                        <span className={`text-lg font-bold ${balance === 0 ? 'text-green-400' : 'text-red-400'}`}>{balance.toFixed(2)}</span>
                    </div>
                </div>
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
                />
                <SpellInfoForm spell={spell} updateField={updateField} />
                <ActionsBar onReset={handleReset} onSave={handleSave} balance={balance} />
            </div>
        </div>
    );
}
