import React from 'react';
import type { StatBlock, LockedParameter } from '../balancing/types';

interface HitChanceCardProps {
    stats: StatBlock;
    lockedParam: LockedParameter;
    onParamChange: (param: keyof StatBlock, value: number) => void;
    onLockChange: (param: LockedParameter) => void;
}

export const HitChanceCard: React.FC<HitChanceCardProps> = ({ stats, lockedParam, onParamChange, onLockChange }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-purple-400">Tiro Per Colpire</h3>

            <div className="space-y-6">
                {/* TxC Input */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-sm text-gray-300">Tiro x Colpire (TxC)</label>
                        <span className="font-mono text-purple-300">{stats.txc.toFixed(0)}</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="100"
                        value={stats.txc}
                        onChange={(e) => onParamChange('txc', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        disabled={lockedParam === 'txc'} // Usually we don't lock inputs, but for consistency
                    />
                </div>

                {/* Evasione Input */}
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-sm text-gray-300">Evasione</label>
                        <span className="font-mono text-purple-300">{stats.evasion.toFixed(0)}</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="100"
                        value={stats.evasion}
                        onChange={(e) => onParamChange('evasion', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        disabled={lockedParam === 'evasion'}
                    />
                </div>

                {/* Hit Chance Display */}
                <div className="bg-gray-900 p-3 rounded text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Probabilità di Colpire</div>
                    <div className="text-2xl font-bold text-white">
                        {stats.hitChance.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                        {stats.txc.toFixed(0)} + 50 - {stats.evasion.toFixed(0)}
                    </div>
                </div>

                {/* Attacks Per KO (Effective HTK) */}
                <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-yellow-400">Attacchi Per KO</label>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-mono text-yellow-300">{stats.attacksPerKo.toFixed(2)}</span>
                            <button
                                onClick={() => onLockChange(lockedParam === 'attacksPerKo' ? 'none' : 'attacksPerKo')}
                                className={`p-1.5 rounded ${lockedParam === 'attacksPerKo' ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                                title="Lock Attacks Per KO"
                            >
                                {lockedParam === 'attacksPerKo' ? '🔒' : '🔓'}
                            </button>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                        HP / (Dmg * Chance%)
                    </div>
                </div>
            </div>
        </div>
    );
};
