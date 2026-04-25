import React, { useEffect, useRef } from 'react';
import type { CombatState } from '../../engine/combat/state';

interface BattleViewerProps {
    combatState: CombatState | null;
}

export const BattleViewer: React.FC<BattleViewerProps> = ({ combatState }) => {
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [combatState?.log.length]);

    if (!combatState) {
        return (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center text-gray-400 h-96 flex items-center justify-center">
                No battle active. Start a simulation to see results.
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col h-[600px]">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h2 className="text-xl font-bold text-white">Combat Log</h2>
                <div className="text-sm text-gray-400">
                    Turn: {combatState.turn} | Status: {combatState.isFinished ? `Finished (${combatState.winner} wins)` : 'Ongoing'}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 font-mono text-sm">
                {combatState.log.map((entry, idx) => (
                    <div
                        key={idx}
                        className={`p-2 rounded ${entry.type === 'info' ? 'bg-gray-700 text-gray-300' :
                            entry.type === 'attack' ? 'bg-gray-900 text-white' :
                                entry.type === 'damage' ? 'bg-red-900/30 text-red-200' :
                                    entry.type === 'death' ? 'bg-red-900 text-red-100 font-bold border border-red-700' :
                                        'text-gray-200'
                            }`}
                    >
                        <span className="text-gray-500 mr-2">[{entry.turn}]</span>
                        {entry.message}
                    </div>
                ))}
                <div ref={logEndRef} />
            </div>

            {/* Simple Visualizer of Health */}
            <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4">
                <div>
                    <h3 className="text-blue-400 font-bold mb-2">Team A</h3>
                    {combatState.teamA.map(e => (
                        <div key={e.id} className="mb-1">
                            <div className="flex justify-between text-xs mb-1">
                                <span>{e.name}</span>
                                <span>{e.currentHp}/{e.derivedStats.maxHp}</span>
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded">
                                <div
                                    className={`h-2 rounded ${e.currentHp > 0 ? 'bg-blue-500' : 'bg-gray-600'}`}
                                    style={{ width: `${(e.currentHp / e.derivedStats.maxHp) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div>
                    <h3 className="text-red-400 font-bold mb-2">Team B</h3>
                    {combatState.teamB.map(e => (
                        <div key={e.id} className="mb-1">
                            <div className="flex justify-between text-xs mb-1">
                                <span>{e.name}</span>
                                <span>{e.currentHp}/{e.derivedStats.maxHp}</span>
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded">
                                <div
                                    className={`h-2 rounded ${e.currentHp > 0 ? 'bg-red-500' : 'bg-gray-600'}`}
                                    style={{ width: `${(e.currentHp / e.derivedStats.maxHp) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
