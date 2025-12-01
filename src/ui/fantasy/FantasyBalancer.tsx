import React, { useState, useEffect } from 'react';
import { DEFAULT_STATS } from '../../balancing/types';
import type { StatBlock, LockedParameter } from '../../balancing/types';
import { BalancingSolver } from '../../balancing/solver';
import { calculateStatBlockCost } from '../../balancing/costs';
import { FantasyCard } from './atoms/FantasyCard';
import { FantasyInput } from './atoms/FantasyInput';
import { FantasySlider } from './atoms/FantasySlider';
import { FantasyButton } from './atoms/FantasyButton';

const STORAGE_KEY = 'balancer_state';

export const FantasyBalancer: React.FC = () => {
    const [stats, setStats] = useState<StatBlock>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        let initialStats = DEFAULT_STATS;
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                initialStats = { ...DEFAULT_STATS, ...parsed };
            } catch { }
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

    const handleResetAll = () => {
        setStats(BalancingSolver.recalculate(DEFAULT_STATS));
        setLockedParam('none');
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="font-fantasy-header text-3xl text-[var(--fantasy-text-bronze)]">Balance Scales</h2>
                    <p className="font-fantasy-body text-[var(--fantasy-text-light)] opacity-80">Adjust the core parameters of the realm.</p>
                </div>
                <div className="flex gap-4">
                    <FantasyButton onClick={handleResetAll} variant="secondary">↺ Reset</FantasyButton>
                    <FantasyButton onClick={() => { }} variant="primary">💾 Save</FantasyButton>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CORE STATS */}
                <FantasyCard title="Vitality (Core)">
                    <div className="space-y-4">
                        <FantasyInput
                            label="Health Points (HP)"
                            type="number"
                            value={stats.hp}
                            onChange={(e) => handleParamChange('hp', Number(e.target.value))}
                        />
                        <FantasySlider
                            label="Damage"
                            value={stats.damage}
                            min={1} max={200}
                            onChange={(v) => handleParamChange('damage', v)}
                        />
                        <FantasyInput
                            label="Hits to Kill (HTK)"
                            type="number" step="0.1"
                            value={stats.htk}
                            onChange={(e) => handleParamChange('htk', Number(e.target.value))}
                        />
                    </div>
                </FantasyCard>

                {/* OFFENSE */}
                <FantasyCard title="Precision (Offense)">
                    <div className="space-y-4">
                        <FantasySlider
                            label="Hit Chance (%)"
                            value={stats.hitChance}
                            min={0} max={100}
                            onChange={(v) => handleParamChange('hitChance', v)}
                        />
                        <FantasySlider
                            label="Crit Chance (%)"
                            value={stats.critChance}
                            min={0} max={100}
                            onChange={(v) => handleParamChange('critChance', v)}
                        />
                        <FantasyInput
                            label="Crit Multiplier (x)"
                            type="number" step="0.1"
                            value={stats.critMult}
                            onChange={(e) => handleParamChange('critMult', Number(e.target.value))}
                        />
                    </div>
                </FantasyCard>

                {/* DEFENSE */}
                <FantasyCard title="Resilience (Defense)">
                    <div className="space-y-4">
                        <FantasyInput
                            label="Armor"
                            type="number"
                            value={stats.armor}
                            onChange={(e) => handleParamChange('armor', Number(e.target.value))}
                        />
                        <FantasyInput
                            label="Magic Resist"
                            type="number"
                            value={stats.resistance}
                            onChange={(e) => handleParamChange('resistance', Number(e.target.value))}
                        />
                        <FantasySlider
                            label="Evasion (%)"
                            value={stats.evasion}
                            min={0} max={80}
                            onChange={(v) => handleParamChange('evasion', v)}
                        />
                    </div>
                </FantasyCard>
            </div>

            {/* SUMMARY BAR */}
            <div className="p-4 rounded bg-[var(--fantasy-bg-wood-light)] border border-[var(--fantasy-text-bronze)] flex justify-between items-center shadow-lg">
                <span className="font-fantasy-ui font-bold text-[var(--fantasy-text-light)]">
                    Locked: <span className="text-[var(--fantasy-secondary)] uppercase">{lockedParam}</span>
                </span>
                <span className="font-fantasy-header text-xl text-[var(--fantasy-text-bronze)]">
                    Total Cost: {calculateStatBlockCost(stats)} pts
                </span>
            </div>
        </div>
    );
};
