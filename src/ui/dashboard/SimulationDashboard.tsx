import React, { useState } from 'react';
import { Entity } from '../../engine/core/entity';
import { createEmptyAttributes } from '../../engine/core/stats';
import { runSimulation } from '../../engine/simulation/runner';
import type { SimulationResult } from '../../engine/simulation/runner';
import { generateStatBlock, type Archetype } from '../../balancing/generator';

interface SimulationDashboardProps {
    entities: Entity[];
}

export const SimulationDashboard: React.FC<SimulationDashboardProps> = ({ entities }) => {
    // Point Buy State
    const [isPointBuyMode, setIsPointBuyMode] = useState(false);
    const [pointBudget, setPointBudget] = useState(100);
    const [archetypeA, setArchetypeA] = useState<Archetype>('balanced');
    const [archetypeB, setArchetypeB] = useState<Archetype>('balanced');
    const [entityAId, setEntityAId] = useState<string>('');
    const [entityBId, setEntityBId] = useState<string>('');
    const [iterations, setIterations] = useState(100);
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<SimulationResult | null>(null);

    const handleRun = async () => {
        let simEntityA: Entity | undefined;
        let simEntityB: Entity | undefined;

        if (isPointBuyMode) {
            // Generate temporary entities
            const statsA = generateStatBlock(archetypeA, pointBudget);
            const statsB = generateStatBlock(archetypeB, pointBudget);

            simEntityA = new Entity('temp_a', `Team A (${archetypeA})`, createEmptyAttributes());
            simEntityA.statBlock = statsA;
            // Sync HP for display
            simEntityA.derivedStats.maxHp = statsA.hp;
            simEntityA.currentHp = statsA.hp;

            simEntityB = new Entity('temp_b', `Team B (${archetypeB})`, createEmptyAttributes());
            simEntityB.statBlock = statsB;
            simEntityB.derivedStats.maxHp = statsB.hp;
            simEntityB.currentHp = statsB.hp;
        } else {
            simEntityA = entities.find(e => e.id === entityAId);
            simEntityB = entities.find(e => e.id === entityBId);
        }

        if (!simEntityA || !simEntityB) {
            alert("Please select two entities or configure point buy settings");
            return;
        }

        setIsRunning(true);

        // Small timeout to let UI update before heavy calculation
        setTimeout(() => {
            if (simEntityA && simEntityB) {
                const res = runSimulation(simEntityA, simEntityB, iterations);
                setResult(res);
            }
            setIsRunning(false);
        }, 100);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Balancing Simulation</h2>
                <div className="flex items-center gap-2">
                    <span className={`text-sm ${!isPointBuyMode ? 'text-white font-bold' : 'text-gray-400'}`}>Standard</span>
                    <button
                        onClick={() => setIsPointBuyMode(!isPointBuyMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPointBuyMode ? 'bg-purple-600' : 'bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPointBuyMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-sm ${isPointBuyMode ? 'text-white font-bold' : 'text-gray-400'}`}>Point Buy</span>
                </div>
            </div>

            {isPointBuyMode ? (
                <div className="bg-gray-700 p-4 rounded mb-6 border border-purple-500/30">
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-purple-300">Point Budget</label>
                        <input
                            type="number"
                            value={pointBudget}
                            onChange={e => setPointBudget(parseInt(e.target.value))}
                            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                            min="10"
                            max="1000"
                            step="10"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Archetype A</label>
                            <select
                                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                                value={archetypeA}
                                onChange={e => setArchetypeA(e.target.value as Archetype)}
                            >
                                <option value="balanced">Balanced</option>
                                <option value="tank">Tank</option>
                                <option value="glass_cannon">Glass Cannon</option>
                                <option value="evasive">Evasive</option>
                            </select>
                        </div>
                        <div className="flex flex-col justify-end text-center">
                            <div className="text-2xl font-bold text-gray-500 mb-2">VS</div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Archetype B</label>
                            <select
                                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                                value={archetypeB}
                                onChange={e => setArchetypeB(e.target.value as Archetype)}
                            >
                                <option value="balanced">Balanced</option>
                                <option value="tank">Tank</option>
                                <option value="glass_cannon">Glass Cannon</option>
                                <option value="evasive">Evasive</option>
                            </select>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Entity A</label>
                        <select
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                            value={entityAId}
                            onChange={e => setEntityAId(e.target.value)}
                        >
                            <option value="">Select Entity...</option>
                            {entities.map(e => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col justify-end text-center">
                        <div className="text-2xl font-bold text-gray-500 mb-2">VS</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Entity B</label>
                        <select
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                            value={entityBId}
                            onChange={e => setEntityBId(e.target.value)}
                        >
                            <option value="">Select Entity...</option>
                            {entities.map(e => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className="mb-6 flex items-end gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">Iterations</label>
                    <input
                        type="number"
                        value={iterations}
                        onChange={e => setIterations(parseInt(e.target.value))}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                        min="1"
                        max="10000"
                    />
                </div>
                <button
                    onClick={handleRun}
                    disabled={isRunning || (!isPointBuyMode && (!entityAId || !entityBId))}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded h-10"
                >
                    {isRunning ? 'Running...' : 'Run Simulation'}
                </button>
            </div>

            {result && (
                <div className="bg-gray-900 p-6 rounded border border-gray-700">
                    <h3 className="text-xl font-bold mb-4 text-center">Results ({result.totalBattles} battles)</h3>

                    <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-400 font-bold w-1/3 text-right pr-4">
                            {isPointBuyMode ? `Team A (${archetypeA})` : entities.find(e => e.id === entityAId)?.name}
                        </span>
                        <span className="text-gray-500 font-mono">vs</span>
                        <span className="text-red-400 font-bold w-1/3 text-left pl-4">
                            {isPointBuyMode ? `Team B (${archetypeB})` : entities.find(e => e.id === entityBId)?.name}
                        </span>
                    </div>

                    <div className="relative h-8 bg-gray-700 rounded overflow-hidden mb-2 flex">
                        <div
                            className="bg-blue-600 h-full flex items-center justify-center text-xs font-bold"
                            style={{ width: `${(result.winsA / result.totalBattles) * 100}%` }}
                        >
                            {result.winsA > 0 && `${((result.winsA / result.totalBattles) * 100).toFixed(1)}%`}
                        </div>
                        <div
                            className="bg-gray-500 h-full flex items-center justify-center text-xs font-bold"
                            style={{ width: `${(result.draws / result.totalBattles) * 100}%` }}
                        >
                            {result.draws > 0 && 'Draw'}
                        </div>
                        <div
                            className="bg-red-600 h-full flex items-center justify-center text-xs font-bold"
                            style={{ width: `${(result.winsB / result.totalBattles) * 100}%` }}
                        >
                            {result.winsB > 0 && `${((result.winsB / result.totalBattles) * 100).toFixed(1)}%`}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center text-sm mt-4">
                        <div>
                            <div className="text-gray-400">Wins A</div>
                            <div className="text-xl font-bold text-blue-400">{result.winsA}</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Draws</div>
                            <div className="text-xl font-bold text-gray-400">{result.draws}</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Wins B</div>
                            <div className="text-xl font-bold text-red-400">{result.winsB}</div>
                        </div>
                    </div>

                    <div className="text-center mt-4 text-gray-500 text-xs">
                        Average Turns per Battle: {result.averageTurns.toFixed(1)}
                    </div>
                </div>
            )}
        </div>
    );
};
