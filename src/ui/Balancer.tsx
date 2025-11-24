import React, { useState, useEffect } from 'react';
import { DEFAULT_STATS } from '../balancing/types';
import type { StatBlock, LockedParameter } from '../balancing/types';
import { BalancingSolver } from '../balancing/solver';
import { calculateStatBlockCost } from '../balancing/costs';
import { CriticalCard } from './CriticalCard';
import { MitigationCard } from './MitigationCard';
import { SmartInput } from './components/SmartInput';
import { CardWrapper } from './components/CardWrapper';
import { PARAM_DEFINITIONS } from '../balancing/registry';
import { HitChanceCard } from './HitChanceCard';

const STORAGE_KEY = 'balancer_state';

export const Balancer: React.FC = () => {
    const [stats, setStats] = useState<StatBlock>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...DEFAULT_STATS, ...parsed };
            } catch {
                return DEFAULT_STATS;
            }
        }
        return DEFAULT_STATS;
    });
    const [lockedParam, setLockedParam] = useState<LockedParameter>('none');

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
        setStats(DEFAULT_STATS);
        setLockedParam('none');
    };

    return (
        <div className="p-2 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-base font-bold text-blue-400">Game Balancing</h2>
                <div className="flex gap-1">
                    <button
                        onClick={handleResetAll}
                        className="px-2 py-1 rounded text-xs bg-orange-900 text-orange-400 hover:bg-orange-800 font-bold"
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
                        className="px-2 py-1 rounded text-xs bg-blue-900 text-blue-400 hover:bg-blue-800"
                        title="Export Settings"
                    >
                        💾 Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Critical Module */}
                <CriticalCard
                    stats={stats}
                    onParamChange={handleParamChange}
                    lockedParam={lockedParam}
                    onLockToggle={handleLockToggle}
                    onResetParam={handleResetParam}
                    onResetCard={() => handleResetCard(['critChance', 'critMult', 'critTxCBonus', 'failChance', 'failMult', 'failTxCMalus'])}
                />

                {/* Mitigation Module */}
                <MitigationCard
                    stats={stats}
                    onParamChange={handleParamChange}
                    lockedParam={lockedParam}
                    onLockToggle={handleLockToggle}
                    onResetParam={handleResetParam}
                    onResetCard={() => handleResetCard(['armor', 'resistance', 'armorPen', 'penPercent'])}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-start">
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
                        />
                    </div>
                </CardWrapper>

                {/* HIT CHANCE CARD */}
                <CardWrapper
                    title="Hit Chance"
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
                        />

                        <SmartInput
                            paramId="attacksPerKo" value={stats.attacksPerKo} onChange={(v) => handleParamChange('attacksPerKo', v)}
                            onReset={() => handleResetParam('attacksPerKo')}
                            lockedParam={lockedParam} onLockToggle={handleLockToggle}
                            min={1} max={50} step={0.1}
                        />
                    </div>
                </CardWrapper>

                {/* CRITICAL CARD */}
                <CriticalCard
                    stats={stats}
                    lockedParam={lockedParam}
                    onParamChange={handleParamChange}
                    onLockToggle={handleLockToggle}
                    onResetParam={handleResetParam}
                    onResetCard={() => handleResetCard(['critChance', 'critMult', 'critTxCBonus', 'failChance', 'failMult', 'failTxCMalus'])}
                />

                {/* MITIGATION CARD */}
                <MitigationCard
                    stats={stats}
                    lockedParam={lockedParam}
                    onParamChange={handleParamChange}
                    onLockToggle={handleLockToggle}
                    onResetParam={handleResetParam}
                    onResetCard={() => handleResetCard(['armor', 'resistance', 'armorPen', 'penPercent'])}
                />

                {/* SPELL MODIFIERS CARD */}
            </div>

            <div className="mt-2 p-1.5 bg-gray-900 rounded text-xs text-gray-400 text-center flex justify-between items-center px-4">
                <span><strong>Lock:</strong> {lockedParam}</span>
                <span className="text-yellow-500 font-bold">Points: {calculateStatBlockCost(stats)}</span>
                <span className="text-green-400">Auto-saved</span>
            </div>
        </div>
    );
};
