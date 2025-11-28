import React, { useState } from 'react';
import { toast } from 'sonner';
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
import { useDefaultStorage } from '../../shared/hooks/useDefaultStorage';
import { ALL_SPELL_STATS } from '../../balancing/spellStatDefinitions';
import { HitChanceModule } from '../../balancing/modules/hitchance';
import { BALANCING_CONFIG } from '../../balancing/balancingConfig';
import { CombatPredictor } from '../../balancing/modules/combatPredictor';
import { CombatPreview } from './components/CombatPreview';

// Helper component for derived stats
const DerivedStatInput: React.FC<{
    label: string;
    value: number;
    unit: string;
    color: string;
    tooltip: string;
    onChange: (val: number) => void;
}> = ({ label, value, unit, color, tooltip, onChange }) => {
    const colorClasses: Record<string, { text: string, bg: string, border: string, focus: string }> = {
        cyan: { text: 'text-cyan-100', bg: 'bg-cyan-950/30', border: 'border-cyan-500/20', focus: 'focus:border-cyan-400' },
        purple: { text: 'text-purple-100', bg: 'bg-purple-950/30', border: 'border-purple-500/20', focus: 'focus:border-purple-400' },
        yellow: { text: 'text-yellow-100', bg: 'bg-yellow-950/30', border: 'border-yellow-500/20', focus: 'focus:border-yellow-400' },
        red: { text: 'text-red-100', bg: 'bg-red-950/30', border: 'border-red-500/20', focus: 'focus:border-red-400' },
        green: { text: 'text-green-100', bg: 'bg-green-950/30', border: 'border-green-500/20', focus: 'focus:border-green-400' },
    };
    const c = colorClasses[color] || colorClasses.cyan;

    return (
        <div className="flex flex-col">
            <label className={`text-[10px] ${c.text} opacity-70 uppercase tracking-wider mb-0.5`}>
                {label}
            </label>
            <div className="relative group">
                <input
                    type="number"
                    value={Math.round(value * 10) / 10} // Round to 1 decimal
                    onChange={(e) => onChange(Number(e.target.value))}
                    className={`w-full ${c.bg} border ${c.border} rounded px-2 py-1 text-xs ${c.text} ${c.focus} outline-none text-center font-mono`}
                />
                <span className={`absolute right-1 top-1/2 -translate-y-1/2 text-[10px] ${c.text} opacity-50 pointer-events-none`}>{unit}</span>
                {/* Tooltip */}
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black/90 border ${c.border} rounded text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50`}>
                    {tooltip}
                </div>
            </div>
        </div>
    );
};

export const SpellCreation: React.FC = () => {
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

    // Helper to get current stat value from spell
    const getStatValue = (statName: string): number => {
        const fieldValue = (spell as any)[statName];
        if (fieldValue === undefined) return 0;
        return Number(fieldValue) || 0;
    };

    // Calculate Combat Metrics for preview
    const playerStats = {
        hp: 100, // Assume baseline HP for spell context
        damage: getStatValue('damage'),
        txc: getStatValue('txc'),
        armor: getStatValue('armor'),
        evasion: getStatValue('evasion'),
        critChance: getStatValue('critChance'),
        lifesteal: getStatValue('lifesteal'),
        regen: getStatValue('regen'),
    };

    const combatMetrics = CombatPredictor.predict(playerStats);

    return (
        <div className="h-full overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 relative">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl top-10 -left-20 animate-pulse" />
                <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl bottom-10 -right-20 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
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
                        {/* Add Combat Preview here or below? */}
                        <div className="mt-4">
                            <CombatPreview metrics={combatMetrics} />
                        </div>
                    </div>

                    {/* Right Card: Preview Spell */}
                    <div className="w-full md:w-7/12 min-w-[300px]">
                        <div className="backdrop-blur-md bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 h-full shadow-[0_4px_16px_rgba(6,182,212,0.15)] overflow-y-auto">
                            <div className="flex justify-between items-center text-lg font-bold text-cyan-100 mb-2 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)] border-b border-cyan-500/20 pb-1">
                                <span>Preview Spell</span>
                                <span className="text-sm font-mono text-cyan-400">{damageRangeText}</span>
                            </div>
                            <ul className="text-xs text-cyan-50 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
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
                    renderDerivedStats={(field, currentValue, onUpdate) => {
                        // --- TxC: Efficiency & Consistency ---
                        if (field === 'txc') {
                            const evasion = BALANCING_CONFIG.TARGET_EVASION;
                            const htk = BALANCING_CONFIG.BASELINE_HTK;

                            const efficiency = HitChanceModule.calculateEfficiency(currentValue, evasion);
                            const consistency = HitChanceModule.calculateConsistency(currentValue, htk, evasion);

                            return (
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <DerivedStatInput
                                        label="Efficiency"
                                        value={efficiency}
                                        unit="%"
                                        color="cyan"
                                        tooltip="Realized damage potential (Hit Chance)"
                                        onChange={(val) => onUpdate(HitChanceModule.calculateTxcFromEfficiency(val, evasion))}
                                    />
                                    <DerivedStatInput
                                        label="Consistency"
                                        value={consistency}
                                        unit="%"
                                        color="purple"
                                        tooltip={`Probability to kill in ${htk} hits`}
                                        onChange={(val) => onUpdate(HitChanceModule.calculateTxcFromConsistency(val, htk, evasion))}
                                    />
                                </div>
                            );
                        }

                        // --- Armor: EHP Boost ---
                        if (field === 'armor') {
                            // Formula: Reduction = Armor / (Armor + K * Damage)
                            // EHP Mult = 1 / (1 - Reduction)
                            // EHP Mult = 1 + Armor / (K * Damage)
                            const k = BALANCING_CONFIG.ARMOR_CONSTANT; // e.g. 10
                            const dmg = BALANCING_CONFIG.BASELINE_DAMAGE; // e.g. 25
                            const denominator = k * dmg;

                            // EHP Boost % = (EHP Mult - 1) * 100
                            // EHP Boost % = (Armor / denominator) * 100
                            const ehpBoost = (currentValue / denominator) * 100;

                            return (
                                <div className="mt-1">
                                    <DerivedStatInput
                                        label="EHP Boost"
                                        value={ehpBoost}
                                        unit="%"
                                        color="yellow"
                                        tooltip="Effective HP increase against physical damage"
                                        onChange={(val) => {
                                            // val is percentage boost
                                            // Armor = (val / 100) * denominator
                                            const newArmor = (val / 100) * denominator;
                                            onUpdate(newArmor);
                                        }}
                                    />
                                </div>
                            );
                        }

                        // --- Crit Chance: DPS Multiplier ---
                        if (field === 'critChance') {
                            // DPS Mult = 1 + (Chance/100 * (CritMult - 1))
                            // Boost % = (DPS Mult - 1) * 100
                            // Boost % = Chance * (CritMult - 1)
                            const critMult = BALANCING_CONFIG.BASE_CRIT_MULT; // e.g. 2.0
                            const dpsBoost = currentValue * (critMult - 1);

                            return (
                                <div className="mt-1">
                                    <DerivedStatInput
                                        label="DPS Boost"
                                        value={dpsBoost}
                                        unit="%"
                                        color="red"
                                        tooltip="Average damage increase from crits"
                                        onChange={(val) => {
                                            // Chance = val / (CritMult - 1)
                                            const newChance = val / (critMult - 1);
                                            onUpdate(newChance);
                                        }}
                                    />
                                </div>
                            );
                        }

                        // --- Lifesteal: Heal per Hit ---
                        if (field === 'lifesteal') {
                            // Heal = AvgDamage * (Lifesteal / 100)
                            const avgDmg = BALANCING_CONFIG.BASELINE_DAMAGE;
                            const healPerHit = avgDmg * (currentValue / 100);

                            return (
                                <div className="mt-1">
                                    <DerivedStatInput
                                        label="Heal/Hit"
                                        value={healPerHit}
                                        unit="HP"
                                        color="green"
                                        tooltip={`Healing per hit (based on ${avgDmg} dmg)`}
                                        onChange={(val) => {
                                            // Lifesteal = (Heal / AvgDmg) * 100
                                            const newLifesteal = (val / avgDmg) * 100;
                                            onUpdate(newLifesteal);
                                        }}
                                    />
                                </div>
                            );
                        }

                        return null;
                    }}
                />


                <SpellInfoForm spell={spell} updateField={updateField} />

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8" />

                <ActionsBar onReset={handleReset} onSave={handleSave} onSaveDefault={handleSaveDefault} balance={balance} />
            </div >
        </div >
    );
}
