import React, { useState } from 'react';
import type { StatBlock, LockedParameter } from '../balancing/types';
import { CombatMetrics } from '../balancing/metrics/CombatMetrics';
import { CardWrapper } from './components/CardWrapper';
import { SmartInput } from './components/SmartInput';
import { Entity } from '../engine/core/entity';
import { createEmptyAttributes } from '../engine/core/stats';
import { runSimulation } from '../engine/simulation/runner';

interface CombatMetricsCardProps {
    stats: StatBlock;
    lockedParam: LockedParameter;
    onParamChange: (param: keyof StatBlock, value: number) => void;
    onLockToggle: (param: LockedParameter) => void;
    onResetParam: (param: string) => void;
}

export const CombatMetricsCard: React.FC<CombatMetricsCardProps> = ({
    stats,
    lockedParam,
    onParamChange,
    onLockToggle,
    onResetParam
}) => {
    const [simResult, setSimResult] = useState<{ winRate: number, avgTurns: number } | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    // SWI is still calculated on the fly as it's an array/object, not a single scalar
    const swi = CombatMetrics.calculateSWI(stats, stats, 5);

    const handleVerify = async () => {
        setIsSimulating(true);
        // Small timeout to allow UI to update
        setTimeout(() => {
            try {
                // Create two identical entities
                const entityA = new Entity('sim_a', 'Self A', createEmptyAttributes());
                entityA.statBlock = { ...stats };
                entityA.derivedStats.maxHp = stats.hp;
                entityA.currentHp = stats.hp;

                const entityB = new Entity('sim_b', 'Self B', createEmptyAttributes());
                entityB.statBlock = { ...stats };
                entityB.derivedStats.maxHp = stats.hp;
                entityB.currentHp = stats.hp;

                // Run 100 iterations
                const result = runSimulation(entityA, entityB, 100);

                // Calculate win rate for A (should be ~50%)
                const winRate = (result.winsA / result.totalBattles) * 100;
                setSimResult({
                    winRate,
                    avgTurns: result.averageTurns
                });
            } catch (e) {
                console.error("Simulation failed", e);
            } finally {
                setIsSimulating(false);
            }
        }, 50);
    };

    return (
        <CardWrapper title="Combat Metrics (Self vs Self)" color="text-cyan-400">
            <div className="space-y-4">
                {/* Scalar Metrics - Now Editable */}
                <div className="space-y-2">
                    <SmartInput
                        label="Time To Kill (Turns)"
                        paramId="ttk"
                        value={stats.ttk}
                        onChange={(v) => onParamChange('ttk', v)}
                        lockedParam={lockedParam}
                        onLockToggle={onLockToggle}
                        min={0.1} max={100} step={0.1}
                        bgColor="bg-cyan-950/30 border-cyan-500/20"
                    />
                    <SmartInput
                        label="Effective Dmg/Turn"
                        paramId="edpt"
                        value={stats.edpt}
                        onChange={(v) => onParamChange('edpt', v)}
                        lockedParam={lockedParam}
                        onLockToggle={onLockToggle}
                        min={0} max={1000}
                        bgColor="bg-orange-950/30 border-orange-500/20"
                    />
                    <SmartInput
                        label="Early Impact (3 Turns)"
                        paramId="earlyImpact"
                        value={stats.earlyImpact}
                        onChange={(v) => onParamChange('earlyImpact', v)}
                        lockedParam={lockedParam}
                        onLockToggle={onLockToggle}
                        min={0} max={3000}
                        bgColor="bg-purple-950/30 border-purple-500/20"
                    />
                </div>

                {/* Simulation Verification */}
                <div className="pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Verification</h4>
                        <button
                            onClick={handleVerify}
                            disabled={isSimulating}
                            className={`text-xs px-2 py-1 rounded border transition-all ${isSimulating ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-cyan-900/30 text-cyan-300 border-cyan-500/30 hover:bg-cyan-800/50'}`}
                        >
                            {isSimulating ? 'Running...' : '▶ Simulate (100x)'}
                        </button>
                    </div>

                    {simResult && (
                        <div className="grid grid-cols-2 gap-2 text-xs bg-black/20 p-2 rounded border border-white/5">
                            <div>
                                <div className="text-gray-500">Win Rate</div>
                                <div className={`font-mono font-bold ${Math.abs(simResult.winRate - 50) < 10 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {simResult.winRate.toFixed(1)}%
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500">Avg Turns</div>
                                <div className="font-mono font-bold text-white">
                                    {simResult.avgTurns.toFixed(1)}
                                </div>
                                <div className="text-[10px] text-gray-600">
                                    (Pred: {stats.ttk.toFixed(1)})
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* SWI Visualization */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Stat Weight Index (SWI)</h4>
                    <div className="space-y-1.5">
                        {Object.entries(swi)
                            .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                            .slice(0, 8) // Show top 8
                            .map(([stat, impact]) => {
                                const color = impact > 0 ? 'bg-emerald-500' : 'bg-rose-500';
                                const textColor = impact > 0 ? 'text-emerald-400' : 'text-rose-400';
                                return (
                                    <div key={stat} className="flex items-center gap-2 text-xs bg-white/5 p-1.5 rounded border border-white/5">
                                        <span className="w-20 capitalize text-gray-300 truncate" title={stat}>{stat}</span>
                                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${color}`}
                                                style={{ width: `${Math.min(100, Math.abs(impact) * 10)}%` }}
                                            />
                                        </div>
                                        <span className={`w-10 text-right font-mono ${textColor}`}>
                                            {impact > 0 ? '+' : ''}{impact.toFixed(1)}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        </CardWrapper>
    );
};
