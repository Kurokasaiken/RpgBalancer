import React, { useState, useEffect } from 'react';
import { DEFAULT_STATS } from '../../balancing/types';
import type { StatBlock, LockedParameter } from '../../balancing/types';
import { BalancingSolver } from '../../balancing/solver';
import { calculateStatBlockCost } from '../../balancing/costs';
import { PARAM_DEFINITIONS } from '../../balancing/registry';
import { useDensity } from '../../contexts/DensityContext';
import {
    CompactCard,
    StatDisplay,
    ProgressBar,
    CompactButton,
    CompactSlider,
} from '../components/compact';

const STORAGE_KEY = 'balancer_state';

// Local param config for UI (min/max/step not in registry)
const PARAM_UI_CONFIG: Record<string, { min: number; max: number; step: number }> = {
    hp: { min: 10, max: 1000, step: 10 },
    damage: { min: 1, max: 200, step: 1 },
    htk: { min: 1, max: 20, step: 0.1 },
    txc: { min: 0, max: 100, step: 1 },
    evasion: { min: 0, max: 100, step: 1 },
    hitChance: { min: 0, max: 100, step: 1 },
    armor: { min: 0, max: 100, step: 1 },
    armorPen: { min: 0, max: 100, step: 1 },
    ward: { min: 0, max: 500, step: 10 },
    critChance: { min: 0, max: 100, step: 1 },
    critMult: { min: 1, max: 5, step: 0.1 },
    lifesteal: { min: 0, max: 100, step: 1 },
    regen: { min: 0, max: 100, step: 1 },
};

// Compact stat input with label
interface StatInputProps {
    paramId: keyof StatBlock;
    value: number;
    onChange: (value: number) => void;
    locked?: boolean;
    onLockToggle?: () => void;
}

const StatInput: React.FC<StatInputProps> = ({ paramId, value, onChange, locked, onLockToggle }) => {
    const def = PARAM_DEFINITIONS[paramId];
    const uiConfig = PARAM_UI_CONFIG[paramId] || { min: 0, max: 100, step: 1 };
    if (!def) return null;

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
                <CompactSlider
                    label={def.name}
                    value={value}
                    onChange={onChange}
                    min={uiConfig.min}
                    max={uiConfig.max}
                    step={uiConfig.step}
                    color={locked ? 'gold' : 'default'}
                />
            </div>
            {onLockToggle && (
                <button
                    onClick={onLockToggle}
                    className={`w-6 h-6 flex items-center justify-center rounded text-xs transition-colors ${
                        locked 
                            ? 'bg-gold/20 text-gold border border-gold/30' 
                            : 'bg-slate-darkest text-teal-muted hover:text-ivory'
                    }`}
                    title={locked ? 'Unlock' : 'Lock'}
                >
                    {locked ? '🔒' : '🔓'}
                </button>
            )}
        </div>
    );
};

export const FantasyBalancerCompact: React.FC = () => {
    const { text, spacing } = useDensity();
    
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
        return BalancingSolver.recalculate(initialStats);
    });
    
    const [lockedParam, setLockedParam] = useState<LockedParameter>('none');

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }, [stats]);

    const handleParamChange = (param: keyof StatBlock, value: number) => {
        const newStats = BalancingSolver.solve(stats, param, value, lockedParam);
        setStats(newStats);
    };

    const handleLockToggle = (param: LockedParameter) => {
        setLockedParam(prev => prev === param ? 'none' : param);
    };

    const handleResetAll = () => {
        setStats(BalancingSolver.recalculate(DEFAULT_STATS));
        setLockedParam('none');
    };

    const totalCost = calculateStatBlockCost(stats);
    const isBalanced = Math.abs(totalCost) < 5;

    return (
        <div className={spacing.section}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                    <h1 className={`${text.heading} text-ivory flex items-center gap-2`}>
                        <span>⚖️</span> Game Balancer
                    </h1>
                    <p className={`${text.small} text-teal-muted mt-0.5`}>
                        Adjust stats while maintaining balance
                    </p>
                </div>
                <div className="flex gap-2">
                    <CompactButton variant="ghost" size="sm" onClick={handleResetAll} icon="↺">
                        Reset
                    </CompactButton>
                    <CompactButton 
                        variant="gold" 
                        size="sm" 
                        icon="💾"
                        onClick={() => {
                            const data = JSON.stringify(stats, null, 2);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `balancer-${Date.now()}.json`;
                            a.click();
                        }}
                    >
                        Export
                    </CompactButton>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <CompactCard variant="glass">
                    <StatDisplay 
                        label="Budget" 
                        value={totalCost.toFixed(1)} 
                        unit="pt" 
                        color={isBalanced ? 'success' : 'warning'} 
                    />
                </CompactCard>
                <CompactCard variant="glass">
                    <StatDisplay label="HP" value={stats.hp} color="default" />
                </CompactCard>
                <CompactCard variant="glass">
                    <StatDisplay label="Damage" value={stats.damage} color="default" />
                </CompactCard>
                <CompactCard variant="glass">
                    <StatDisplay label="Hit%" value={`${stats.hitChance}%`} color="gold" />
                </CompactCard>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Core Stats */}
                <CompactCard title="Core" icon="🜚" variant="default">
                    <div className={spacing.section}>
                        <StatInput
                            paramId="hp"
                            value={stats.hp}
                            onChange={(v) => handleParamChange('hp', v)}
                            locked={lockedParam === 'hp'}
                            onLockToggle={() => handleLockToggle('hp')}
                        />
                        <StatInput
                            paramId="damage"
                            value={stats.damage}
                            onChange={(v) => handleParamChange('damage', v)}
                            locked={lockedParam === 'damage'}
                            onLockToggle={() => handleLockToggle('damage')}
                        />
                        <StatInput
                            paramId="htk"
                            value={stats.htk}
                            onChange={(v) => handleParamChange('htk', v)}
                        />
                    </div>
                </CompactCard>

                {/* Hit Chance */}
                <CompactCard title="Hit Chance" icon="🎯" variant="default">
                    <div className={spacing.section}>
                        <StatInput
                            paramId="txc"
                            value={stats.txc}
                            onChange={(v) => handleParamChange('txc', v)}
                        />
                        <StatInput
                            paramId="evasion"
                            value={stats.evasion}
                            onChange={(v) => handleParamChange('evasion', v)}
                        />
                        <StatInput
                            paramId="hitChance"
                            value={stats.hitChance}
                            onChange={(v) => handleParamChange('hitChance', v)}
                        />
                    </div>
                </CompactCard>

                {/* Mitigation */}
                <CompactCard title="Mitigation" icon="🛡️" variant="default">
                    <div className={spacing.section}>
                        <StatInput
                            paramId="armor"
                            value={stats.armor}
                            onChange={(v) => handleParamChange('armor', v)}
                        />
                        <StatInput
                            paramId="armorPen"
                            value={stats.armorPen}
                            onChange={(v) => handleParamChange('armorPen', v)}
                        />
                        <StatInput
                            paramId="ward"
                            value={stats.ward}
                            onChange={(v) => handleParamChange('ward', v)}
                        />
                    </div>
                </CompactCard>

                {/* Critical */}
                <CompactCard title="Critical" icon="⚡" variant="default">
                    <div className={spacing.section}>
                        <StatInput
                            paramId="critChance"
                            value={stats.critChance}
                            onChange={(v) => handleParamChange('critChance', v)}
                        />
                        <StatInput
                            paramId="critMult"
                            value={stats.critMult}
                            onChange={(v) => handleParamChange('critMult', v)}
                        />
                    </div>
                </CompactCard>

                {/* Sustain */}
                <CompactCard title="Sustain" icon="💚" variant="default">
                    <div className={spacing.section}>
                        <StatInput
                            paramId="lifesteal"
                            value={stats.lifesteal}
                            onChange={(v) => handleParamChange('lifesteal', v)}
                        />
                        <StatInput
                            paramId="regen"
                            value={stats.regen}
                            onChange={(v) => handleParamChange('regen', v)}
                        />
                    </div>
                </CompactCard>

                {/* Combat Metrics */}
                <CompactCard title="Combat Metrics" icon="⚔️" variant="glass">
                    <div className={spacing.section}>
                        <StatDisplay label="EDPT" value={stats.edpt?.toFixed(1) ?? '—'} />
                        <StatDisplay label="TTK" value={stats.ttk?.toFixed(1) ?? '—'} unit="turns" />
                        <StatDisplay label="Attacks/KO" value={stats.attacksPerKo?.toFixed(1) ?? '—'} />
                        <ProgressBar 
                            label="Balance" 
                            value={Math.max(0, 100 - Math.abs(totalCost))} 
                            color={isBalanced ? 'nature' : 'error'} 
                        />
                    </div>
                </CompactCard>
            </div>

            {/* Footer Status */}
            <CompactCard variant="glass" className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-4">
                        <span className={`${text.small} text-teal-muted`}>
                        Lock: <strong className="text-gold">{lockedParam}</strong>
                        </span>
                        <span className={`${text.small} ${isBalanced ? 'text-teal' : 'text-gold'}`}>
                            Budget: <strong>{totalCost.toFixed(1)} pt</strong>
                        </span>
                    </div>
                    <span className={`${text.small} text-teal`}>✓ Auto-saved</span>
                </div>
            </CompactCard>
        </div>
    );
};
