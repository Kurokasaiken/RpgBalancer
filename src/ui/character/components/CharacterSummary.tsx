/**
 * Character Summary Card
 * 
 * Displays calculated combat metrics for a character:
 * - DPR (Damage Per Round)
 * - EHP (Effective HP)
 * - TTK (Time To Kill)
 * - Survivability Index
 */

import React from 'react';
import type { Character } from '../../../balancing/character/types';
import { CharacterBuilder } from '../../../balancing/character/builder';

interface CharacterSummaryProps {
    character: Character;
}

export const CharacterSummary: React.FC<CharacterSummaryProps> = ({ character }) => {
    const metrics = CharacterBuilder.calculateCombatMetrics(character);

    return (
        <div className="fantasy-glass rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-bold text-white fantasy-glow-arcane border-b border-white/10 pb-2">
                ⚔️ Combat Metrics
            </h3>

            <div className="grid grid-cols-2 gap-3">
                {/* DPR - Damage Per Round */}
                <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg p-3">
                    <div className="text-xs text-red-300/70 uppercase tracking-wider mb-1">
                        DPR
                    </div>
                    <div className="text-2xl font-bold text-red-400 fantasy-glow-fire font-mono">
                        {metrics.dpr}
                    </div>
                    <div className="text-[10px] text-red-300/50 mt-1">
                        Damage × HitChance × (1 + Crit%)
                    </div>
                </div>

                {/* EHP - Effective HP */}
                <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg p-3">
                    <div className="text-xs text-green-300/70 uppercase tracking-wider mb-1">
                        EHP
                    </div>
                    <div className="text-2xl font-bold text-green-400 fantasy-glow-nature font-mono">
                        {metrics.ehp}
                    </div>
                    <div className="text-[10px] text-green-300/50 mt-1">
                        HP × (1 + Armor Reduction)
                    </div>
                </div>

                {/* TTK - Time To Kill */}
                <div className="bg-gradient-to-br from-purple-900/20 to-violet-900/20 border border-purple-500/30 rounded-lg p-3">
                    <div className="text-xs text-purple-300/70 uppercase tracking-wider mb-1">
                        TTK
                    </div>
                    <div className="text-2xl font-bold text-purple-400 fantasy-glow-arcane font-mono">
                        {metrics.ttk === Infinity ? '∞' : metrics.ttk}
                    </div>
                    <div className="text-[10px] text-purple-300/50 mt-1">
                        Rounds to kill baseline enemy
                    </div>
                </div>

                {/* Survivability */}
                <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg p-3">
                    <div className="text-xs text-cyan-300/70 uppercase tracking-wider mb-1">
                        Survivability
                    </div>
                    <div className="text-2xl font-bold text-cyan-400 fantasy-glow-water font-mono">
                        {metrics.survivability}
                    </div>
                    <div className="text-[10px] text-cyan-300/50 mt-1">
                        EHP + Sustain × 10 rounds
                    </div>
                </div>
            </div>

            {/* Formula explanations */}
            <div className="mt-4 pt-3 border-t border-white/10">
                <details className="text-xs text-gray-400">
                    <summary className="cursor-pointer hover:text-gray-300 transition-colors">
                        📐 Formula Details
                    </summary>
                    <div className="mt-2 space-y-2 pl-2 border-l-2 border-white/10">
                        <div>
                            <strong className="text-red-400">DPR:</strong>{' '}
                            <code className="text-xs bg-black/30 px-1 py-0.5 rounded">
                                damage × (hitChance / 100) × (1 + critChance / 100 × (critMult - 1))
                            </code>
                        </div>
                        <div>
                            <strong className="text-green-400">EHP:</strong>{' '}
                            <code className="text-xs bg-black/30 px-1 py-0.5 rounded">
                                hp × (1 + armor / (armor + K × baseDamage))
                            </code>
                        </div>
                        <div>
                            <strong className="text-purple-400">TTK:</strong>{' '}
                            <code className="text-xs bg-black/30 px-1 py-0.5 rounded">
                                ceil(100 / DPR)
                            </code>
                        </div>
                        <div>
                            <strong className="text-cyan-400">Survivability:</strong>{' '}
                            <code className="text-xs bg-black/30 px-1 py-0.5 rounded">
                                EHP + (regen + lifesteal% × DPR) × 10
                            </code>
                        </div>
                    </div>
                </details>
            </div>
        </div>
    );
};
