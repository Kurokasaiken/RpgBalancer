import React from 'react';
import type { CombatMetrics } from '../../../balancing/modules/combatPredictor';

interface CombatPreviewProps {
    metrics: CombatMetrics;
}

export const CombatPreview: React.FC<CombatPreviewProps> = ({ metrics }) => {
    const { ttk, ttd, winProb } = metrics;

    // Determine status
    const isWinning = ttd >= ttk;
    const isImmortal = ttd >= 999;
    const isPacifist = ttk >= 999;

    // Formatting
    const formatTurns = (val: number) => val >= 999 ? '∞' : val.toFixed(1);
    const winPercent = (winProb * 100).toFixed(0);

    return (
        <div className="bg-black/40 rounded-lg p-3 border border-white/10 mb-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Combat Simulation (vs Baseline)</h3>
                <div className={`text-xs font-bold px-2 py-0.5 rounded ${isWinning ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {isWinning ? 'WINNING' : 'LOSING'} ({winPercent}%)
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* TTK (Offense) */}
                <div className="flex flex-col">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] text-gray-500 uppercase">Time to Kill</span>
                        <span className={`text-lg font-mono font-bold ${isPacifist ? 'text-gray-500' : 'text-cyan-300'}`}>
                            {formatTurns(ttk)}
                        </span>
                    </div>
                    <div className="w-full bg-gray-800 h-1 mt-1 rounded-full overflow-hidden">
                        {/* Inverse bar: shorter is better */}
                        <div
                            className="h-full bg-cyan-500"
                            style={{ width: `${Math.min(100, (10 / ttk) * 100)}%` }}
                        />
                    </div>
                    <div className="text-[10px] text-gray-600 mt-0.5 text-right">
                        turns
                    </div>
                </div>

                {/* TTD (Defense) */}
                <div className="flex flex-col">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] text-gray-500 uppercase">Time to Die</span>
                        <span className={`text-lg font-mono font-bold ${isImmortal ? 'text-yellow-300' : 'text-purple-300'}`}>
                            {formatTurns(ttd)}
                        </span>
                    </div>
                    <div className="w-full bg-gray-800 h-1 mt-1 rounded-full overflow-hidden">
                        {/* Normal bar: longer is better */}
                        <div
                            className="h-full bg-purple-500"
                            style={{ width: `${Math.min(100, (ttd / 10) * 100)}%` }}
                        />
                    </div>
                    <div className="text-[10px] text-gray-600 mt-0.5 text-right">
                        turns
                    </div>
                </div>
            </div>
        </div>
    );
};
