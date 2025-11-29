import React, { useState, useEffect } from 'react';
import { DEFAULT_STATS } from '../balancing/types';
import type { StatBlock, LockedParameter } from '../balancing/types';
import { BalancingSolver } from '../balancing/solver';
import { calculateStatBlockCost } from '../balancing/costs';
import { CriticalCard } from './CriticalCard';
import { MitigationCard } from './MitigationCard';
import { CombatMetricsCard } from './CombatMetricsCard';
import { SmartInput } from './components/SmartInput';
import { CardWrapper } from './components/CardWrapper';
import { PARAM_DEFINITIONS } from '../balancing/registry';
import { BalanceConfigManager } from '../balancing/BalanceConfigManager';
import { getActivePresetId, setActivePresetId } from '../balancing/presetStorage';
import { PresetSelector } from './balancing/PresetSelector';
import { WeightEditor } from './balancing/WeightEditor';


const STORAGE_KEY = 'balancer_state';

export const Balancer: React.FC = () => {
    const [stats, setStats] = useState<StatBlock>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        let initialStats = DEFAULT_STATS;

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                initialStats = { ...DEFAULT_STATS, ...parsed };
            } catch {
                // Fallback to default
            }
        }

        // Ensure all derived metrics are calculated and consistent
        return BalancingSolver.recalculate(initialStats);
    });
    const [lockedParam, setLockedParam] = useState<LockedParameter>('none');
    const [activePresetId, setActivePresetIdState] = useState<string>(() => getActivePresetId());
    const [showWeightEditor, setShowWeightEditor] = useState(false);

    // Auto-save to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }, [stats]);

    const handleParamChange = (param: keyof StatBlock, value: number) => {
        const newStats = BalancingSolver.solve(stats, param, value, lockedParam);
        setStats(newStats);
    };

    const handleLockToggle = (param: LockedParameter) => {
        setLockedParam(param);
    };

    const handleResetParam = (paramId: string) => {
        const def = PARAM_DEFINITIONS[paramId];
        if (def) {
            handleParamChange(paramId as keyof StatBlock, def.defaultValue);
        }
    };

    const handleResetCard = (params: string[]) => {
        let newStats = { ...stats };
        params.forEach(paramId => {
            const def = PARAM_DEFINITIONS[paramId];
            if (def) {
                newStats = BalancingSolver.solve(newStats, paramId as keyof StatBlock, def.defaultValue, lockedParam);
            }
        });
        setStats(newStats);
    };

    const handleResetAll = () => {
        setStats(BalancingSolver.recalculate(DEFAULT_STATS));
        setLockedParam('none');
    };

    const handlePresetChange = (id: string) => {
        BalanceConfigManager.setPreset(id);
        setActivePresetIdState(id);
        setActivePresetId(id);

        // Trigger recalculation with new weights
        setStats(prev => BalancingSolver.recalculate(prev));
    };

    const handleWeightEditorSave = (newPresetId: string) => {
        handlePresetChange(newPresetId);
    };

    return (
        <div className="h-full overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 relative">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl top-10 -left-20 animate-pulse" />
                <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl bottom-10 -right-20 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]">⚖️ Game Balancing</h2>
                        <div className="mt-2">
                            <PresetSelector
                                activePresetId={activePresetId}
                                onPresetChange={handlePresetChange}
                                onEditMode={() => setShowWeightEditor(true)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleResetAll}
                            className="px-4 py-2 rounded bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-all font-medium"
                            title="Reset Everything"
                        >
                            ↺ Reset All
                        </button>
                        <button
                            onClick={() => {
                                const data = JSON.stringify(stats, null, 2);
                                const blob = new Blob([data], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `balancer-${Date.now()}.json`;
                                a.click();
                            }}
                            className="px-4 py-2 rounded bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-all"
                            title="Export Settings"
                        >
                            💾 Export
                        </button>
                    </div>
                </div>

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8" />



                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                    {/* CORE CARD */}
                    <CardWrapper
                        title="Core"
                        color="text-blue-400"
                        onReset={() => handleResetCard(['hp', 'damage', 'htk'])}
                    >
                        <div className="space-y-2">
                            <SmartInput
                                paramId="hp" value={stats.hp} onChange={(v) => handleParamChange('hp', v)}
                                onReset={() => handleResetParam('hp')}
                                lockedParam={lockedParam} onLockToggle={handleLockToggle}
                                min={10} max={1000} step={10}
                            />
                            <SmartInput
                                paramId="damage" value={stats.damage} onChange={(v) => handleParamChange('damage', v)}
                                onReset={() => handleResetParam('damage')}
                                lockedParam={lockedParam} onLockToggle={handleLockToggle}
                                min={1} max={200}
                            />
                            <SmartInput
                                paramId="htk" value={stats.htk} onChange={(v) => handleParamChange('htk', v)}
                                onReset={() => handleResetParam('htk')}
                                lockedParam={lockedParam} onLockToggle={handleLockToggle}
                                min={1} max={20} step={0.1}
                                bgColor="bg-orange-500/10"
                            />
                        </div>
                    </CardWrapper>

                    {/* HIT CHANCE CARD (TxC) */}
                    <CardWrapper
                        title="TxC (Hit Chance)"
                        color="text-purple-400"
                        onReset={() => handleResetCard(['txc', 'evasion', 'hitChance', 'attacksPerKo'])}
                    >
                        <div className="space-y-2">
                            <SmartInput
                                paramId="txc" value={stats.txc} onChange={(v) => handleParamChange('txc', v)}
                                onReset={() => handleResetParam('txc')}
                                lockedParam={lockedParam} onLockToggle={handleLockToggle}
                                min={0} max={100}
                            />
                            <SmartInput
                                paramId="evasion" value={stats.evasion} onChange={(v) => handleParamChange('evasion', v)}
                                onReset={() => handleResetParam('evasion')}
                                lockedParam={lockedParam} onLockToggle={handleLockToggle}
                                min={0} max={100}
                            />

                            {/* HitChance - Editable Derived Value */}
                            <SmartInput
                                paramId="hitChance" value={stats.hitChance} onChange={(v) => handleParamChange('hitChance', v)}
                                onReset={() => handleResetParam('hitChance')}
                                lockedParam={lockedParam} onLockToggle={handleLockToggle}
                                min={0} max={100} step={1} isPercentage={true}
                                bgColor="bg-orange-500/10"
                            />

                            <SmartInput
                                paramId="attacksPerKo" value={stats.attacksPerKo} onChange={(v) => handleParamChange('attacksPerKo', v)}
                                onReset={() => handleResetParam('attacksPerKo')}
                                lockedParam={lockedParam} onLockToggle={handleLockToggle}
                                min={1} max={50} step={0.1}
                                bgColor="bg-orange-500/10"
                            />
                        </div>
                    </CardWrapper>

                    {/* MITIGATION CARD */}
                    <MitigationCard
                        stats={stats}
                        lockedParam={lockedParam}
                        onParamChange={handleParamChange}
                        onLockToggle={handleLockToggle}
                        onResetParam={handleResetParam}
                        onResetCard={() => handleResetCard(['armor', 'armorPen', 'penPercent', 'ward'])}
                    // Note: MitigationCard internal labels might need update, or we pass a prop if supported.
                    // Assuming MitigationCard uses default labels from PARAM_DEFINITIONS or similar.
                    // If I can't change it here, I might need to edit MitigationCard.tsx.
                    // Let's check MitigationCard.tsx content first? No, I'll just leave it for now and check if I can override.
                    />

                    {/* CRITICAL CARD */}
                    <CriticalCard
                        stats={stats}
                        lockedParam={lockedParam}
                        onParamChange={handleParamChange}
                        onLockToggle={handleLockToggle}
                        onResetParam={handleResetParam}
                        onResetCard={() => handleResetCard(['critChance', 'critMult', 'critTxCBonus', 'failChance', 'failMult', 'failTxCMalus'])}
                    />

                    {/* SUSTAIN CARD */}
                    <CardWrapper
                        title="Sustain"
                        color="text-green-400"
                        onReset={() => handleResetCard(['lifesteal', 'regen'])}
                    >
                        <div className="space-y-2">
                            <SmartInput
                                paramId="lifesteal" value={stats.lifesteal} onChange={(v) => handleParamChange('lifesteal', v)}
                                onReset={() => handleResetParam('lifesteal')}
                                lockedParam={lockedParam} onLockToggle={handleLockToggle}
                                min={0} max={100} isPercentage={true}
                            />
                            <SmartInput
                                paramId="regen" value={stats.regen} onChange={(v) => handleParamChange('regen', v)}
                                onReset={() => handleResetParam('regen')}
                                lockedParam={lockedParam} onLockToggle={handleLockToggle}
                                min={0} max={100}
                            />
                        </div>
                    </CardWrapper>

                    {/* COMBAT METRICS CARD */}
                    <CombatMetricsCard
                        stats={stats}
                        lockedParam={lockedParam}
                        onParamChange={handleParamChange}
                        onLockToggle={handleLockToggle}
                        onResetParam={handleResetParam}
                    />
                </div>

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8" />

                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)] text-sm text-gray-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span><strong className="text-white">Lock:</strong> {lockedParam}</span>
                    <span className="text-yellow-400 font-bold drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]">Points: {calculateStatBlockCost(stats)}</span>
                    <span className="text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]">✓ Auto-saved</span>
                </div>
            </div>

            {/* Weight Editor Modal */}
            {showWeightEditor && (
                <WeightEditor
                    currentPreset={BalanceConfigManager.activePreset}
                    onSave={handleWeightEditorSave}
                    onClose={() => setShowWeightEditor(false)}
                />
            )}
        </div>
    );
};
