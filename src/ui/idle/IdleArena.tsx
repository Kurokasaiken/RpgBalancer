// src/ui/idle/IdleArena.tsx - Updated to allow flexible team assignment

import React, { useState, useEffect, useRef } from 'react';
import type { Combatant, CombatState } from '../../engine/idle/types';
import { startCombat, processUpkeep, determineIntent, executeAction } from '../../engine/idle/engine';
import { loadCharacters, type SavedCharacter } from '../../engine/idle/characterStorage';
import { Entity } from '../../engine/core/entity';
import { loadSpells } from '../../balancing/spellStorage';

export const IdleArena: React.FC = () => {
    const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
    const [selectedHeroIds, setSelectedHeroIds] = useState<string[]>([]);
    const [selectedEnemyIds, setSelectedEnemyIds] = useState<string[]>([]);
    const [combatState, setCombatState] = useState<CombatState | null>(null);
    const [autoPlay, setAutoPlay] = useState(false);
    const [speed] = useState(1000);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Bulk simulation state
    const [simulationCount, setSimulationCount] = useState(10000);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResults, setSimulationResults] = useState<{
        heroWins: number;
        enemyWins: number;
        total: number;
    } | null>(null);

    useEffect(() => {
        setSavedCharacters(loadCharacters());
    }, []);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [combatState?.log]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (autoPlay && combatState && !combatState.winner) {
            interval = setInterval(() => {
                handleNextStep();
            }, speed);
        }
        return () => clearInterval(interval);
    });

    const convertSavedToCombatant = (saved: SavedCharacter, team: 'hero' | 'enemy'): Combatant => {
        const spells = loadSpells();
        const equippedSpells = saved.equippedSpellIds
            .map(id => spells.find(s => s.id === id))
            .filter((s): s is NonNullable<typeof s> => s !== undefined);

        const entity = Entity.fromStatBlock(saved.id, saved.name, saved.statBlock);

        return {
            id: saved.id,
            name: saved.name,
            entity,
            team,
            equippedSpells,
            activeEffects: [],
            cooldowns: {},
            aiBehavior: saved.aiBehavior,
            isDead: false
        };
    };

    const handleStart = () => {
        const heroes = selectedHeroIds
            .map(id => savedCharacters.find(c => c.id === id))
            .filter((c): c is SavedCharacter => c !== undefined)
            .map(c => convertSavedToCombatant(c, 'hero'));

        const enemies = selectedEnemyIds
            .map(id => savedCharacters.find(c => c.id === id))
            .filter((c): c is SavedCharacter => c !== undefined)
            .map(c => convertSavedToCombatant(c, 'enemy'));

        if (heroes.length === 0 || enemies.length === 0) return;

        const initialState = startCombat(heroes, enemies);
        const withUpkeep = processUpkeep(initialState);
        const withIntent = determineIntent(withUpkeep);
        setCombatState(withIntent);
    };

    const handleNextStep = () => {
        if (!combatState || combatState.winner) return;

        const afterAction = executeAction(combatState);

        if (afterAction.winner) {
            setCombatState(afterAction);
            setAutoPlay(false);
            return;
        }

        const afterUpkeep = processUpkeep(afterAction);
        const afterIntent = determineIntent(afterUpkeep);

        setCombatState(afterIntent);
    };

    const handleReset = () => {
        setCombatState(null);
        setAutoPlay(false);
        setSimulationResults(null);
    };

    const handleBulkSimulation = async () => {
        const heroes = selectedHeroIds
            .map(id => savedCharacters.find(c => c.id === id))
            .filter((c): c is SavedCharacter => c !== undefined)
            .map(c => convertSavedToCombatant(c, 'hero'));

        const enemies = selectedEnemyIds
            .map(id => savedCharacters.find(c => c.id === id))
            .filter((c): c is SavedCharacter => c !== undefined)
            .map(c => convertSavedToCombatant(c, 'enemy'));

        if (heroes.length === 0 || enemies.length === 0) return;

        setIsSimulating(true);
        setSimulationResults(null);

        let heroWins = 0;
        let enemyWins = 0;

        for (let i = 0; i < simulationCount; i++) {
            let state = startCombat(heroes, enemies);

            let maxTurns = 1000;
            let turns = 0;

            while (!state.winner && turns < maxTurns) {
                state = processUpkeep(state);
                state = determineIntent(state);
                state = executeAction(state);
                turns++;
            }

            if (state.winner === 'hero') heroWins++;
            else if (state.winner === 'enemy') enemyWins++;

            if (i % 1000 === 0 && i > 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        setSimulationResults({
            heroWins,
            enemyWins,
            total: simulationCount
        });
        setIsSimulating(false);
    };

    const toggleHeroSelection = (id: string) => {
        // Toggle in hero team (allow duplicates - character can fight itself)
        setSelectedHeroIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleEnemySelection = (id: string) => {
        // Toggle in enemy team (allow duplicates - character can fight itself)
        setSelectedEnemyIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex flex-col h-full p-4 space-y-4">
            {/* Header / Controls */}
            <div className="flex justify-between items-center bg-gray-800 p-4 rounded">
                <h1 className="text-2xl font-bold text-white">Idle Arena</h1>
                <div className="space-x-2">
                    {!combatState && (
                        <>
                            <button
                                onClick={handleStart}
                                disabled={selectedHeroIds.length === 0 || selectedEnemyIds.length === 0}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white font-bold disabled:opacity-50"
                            >
                                Start Combat
                            </button>
                            {selectedHeroIds.length > 0 && selectedEnemyIds.length > 0 && (
                                <>
                                    <input
                                        type="number"
                                        value={simulationCount}
                                        onChange={(e) => setSimulationCount(Number(e.target.value))}
                                        min="1"
                                        max="100000"
                                        className="px-4 py-2 bg-gray-700 text-white rounded w-32"
                                        placeholder="Iterations"
                                    />
                                    <button
                                        onClick={handleBulkSimulation}
                                        disabled={isSimulating}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white font-bold disabled:opacity-50"
                                    >
                                        {isSimulating ? 'Simulating...' : 'Run Simulation'}
                                    </button>
                                </>
                            )}
                        </>
                    )}
                    {combatState && !combatState.winner && (
                        <>
                            <button
                                onClick={() => setAutoPlay(!autoPlay)}
                                className={`px-4 py-2 rounded text-white font-bold ${autoPlay ? 'bg-yellow-600' : 'bg-blue-600'}`}
                            >
                                {autoPlay ? 'Pause' : 'Auto Play'}
                            </button>
                            <button
                                onClick={handleNextStep}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white font-bold"
                            >
                                Step &gt;
                            </button>
                        </>
                    )}
                    {combatState && (
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white font-bold"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            {!combatState ? (
                <div className="flex flex-1 space-x-4 overflow-hidden">
                    {/* Left: Hero Team Selection */}
                    <div className="w-1/2 bg-gray-900 rounded p-4 overflow-y-auto">
                        <h2 className="text-xl font-bold text-blue-400 mb-4">
                            Team 1 - Heroes ({selectedHeroIds.length})
                        </h2>
                        {savedCharacters.length === 0 ? (
                            <div className="text-gray-400 text-center py-8">
                                Nessun personaggio disponibile. Creali in Character Manager!
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {savedCharacters.map(char => {                                        // Skip old characters without statBlock
                                    if (!char.statBlock) return null;

                                    const isSelected = selectedHeroIds.includes(char.id);
                                    const isInEnemyTeam = selectedEnemyIds.includes(char.id);

                                    return (
                                        <div
                                            key={char.id}
                                            onClick={() => toggleHeroSelection(char.id)}
                                            className={`p-3 rounded border-2 cursor-pointer transition-all ${isSelected
                                                ? 'border-blue-500 bg-blue-900'
                                                : isInEnemyTeam
                                                    ? 'border-red-500 bg-gray-800 opacity-50'
                                                    : 'border-gray-700 bg-gray-800 hover:border-blue-600'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-white">{char.name}</span>
                                                <span className="text-xs text-gray-400 capitalize">{char.aiBehavior}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                HP: {char.statBlock.hp} | DMG: {char.statBlock.damage} | Skills: {char.equippedSpellIds.length}/4
                                            </div>
                                            {isInEnemyTeam && (
                                                <div className="text-xs text-red-400 mt-1">In Team 2</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right: Enemy Team Selection */}
                    <div className="w-1/2 bg-gray-900 rounded p-4 overflow-y-auto">
                        <h2 className="text-xl font-bold text-red-400 mb-4">
                            Team 2 - Enemies ({selectedEnemyIds.length})
                        </h2>
                        {savedCharacters.length === 0 ? (
                            <div className="text-gray-400 text-center py-8">
                                Nessun personaggio disponibile. Creali in Character Manager!
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {savedCharacters.map(char => {                                        // Skip old characters without statBlock
                                    if (!char.statBlock) return null;

                                    const isSelected = selectedEnemyIds.includes(char.id);
                                    const isInHeroTeam = selectedHeroIds.includes(char.id);

                                    return (
                                        <div
                                            key={char.id}
                                            onClick={() => toggleEnemySelection(char.id)}
                                            className={`p-3 rounded border-2 cursor-pointer transition-all ${isSelected
                                                ? 'border-red-500 bg-red-900'
                                                : isInHeroTeam
                                                    ? 'border-blue-500 bg-gray-800 opacity-50'
                                                    : 'border-gray-700 bg-gray-800 hover:border-red-600'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-white">{char.name}</span>
                                                <span className="text-xs text-gray-400 capitalize">{char.aiBehavior}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                HP: {char.statBlock.hp} | DMG: {char.statBlock.damage} | Skills: {char.equippedSpellIds.length}/4
                                            </div>
                                            {isInHeroTeam && (
                                                <div className="text-xs text-blue-400 mt-1">In Team 1</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 space-x-4 overflow-hidden">
                    {/* Center: Battlefield */}
                    <div className="flex-1 bg-gray-900 rounded p-4 relative flex flex-col">
                        {combatState.winner && (
                            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
                                <div className="text-4xl font-bold text-yellow-400">
                                    {combatState.winner.toUpperCase()} TEAM WINS!
                                </div>
                            </div>
                        )}

                        <div className="flex-1 flex justify-between items-center px-10">
                            {/* Heroes */}
                            <div className="space-y-4">
                                <h3 className="text-blue-400 font-bold text-center mb-4">TEAM 1</h3>
                                {combatState.combatants.filter(c => c.team === 'hero').map(c => (
                                    <CombatantCard
                                        key={c.id}
                                        combatant={c}
                                        isActive={combatState.turnOrder[combatState.currentTurnIndex] === c.id}
                                        intent={combatState.activeIntents[c.id]}
                                    />
                                ))}
                            </div>

                            {/* VS Divider */}
                            <div className="h-full w-px bg-gray-700 mx-4"></div>

                            {/* Enemies */}
                            <div className="space-y-4">
                                <h3 className="text-red-400 font-bold text-center mb-4">TEAM 2</h3>
                                {combatState.combatants.filter(c => c.team === 'enemy').map(c => (
                                    <CombatantCard
                                        key={c.id}
                                        combatant={c}
                                        isActive={combatState.turnOrder[combatState.currentTurnIndex] === c.id}
                                        intent={combatState.activeIntents[c.id]}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Combat Log */}
                    <div className="w-1/4 bg-black rounded p-2 overflow-y-auto font-mono text-xs text-gray-300">
                        <h3 className="text-white font-bold mb-2 sticky top-0 bg-black pb-2 border-b border-gray-700">Combat Log</h3>
                        {combatState.log.map((entry, idx) => (
                            <div key={idx} className={`mb-1 ${getLogColor(entry.type)}`}>
                                <span className="text-gray-500">[{entry.round}]</span> {entry.message}
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            )}

            {/* Simulation Results */}
            {simulationResults && (
                <div className="bg-gray-800 p-4 rounded">
                    <h2 className="text-xl font-bold text-white mb-4">Simulation Results</h2>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-blue-900 p-4 rounded">
                            <div className="text-2xl font-bold text-blue-300">
                                {simulationResults.heroWins}
                            </div>
                            <div className="text-sm text-gray-300">Team 1 Wins</div>
                            <div className="text-xs text-gray-400">
                                {((simulationResults.heroWins / simulationResults.total) * 100).toFixed(2)}%
                            </div>
                        </div>
                        <div className="bg-gray-700 p-4 rounded">
                            <div className="text-2xl font-bold text-white">
                                {simulationResults.total}
                            </div>
                            <div className="text-sm text-gray-300">Total Battles</div>
                            <div className="text-xs text-gray-400">
                                {Math.abs((simulationResults.heroWins / simulationResults.total) - 0.5) <= 0.01
                                    ? '✓ Within 1% of 50%'
                                    : '✗ Outside 1% margin'}
                            </div>
                        </div>
                        <div className="bg-red-900 p-4 rounded">
                            <div className="text-2xl font-bold text-red-300">
                                {simulationResults.enemyWins}
                            </div>
                            <div className="text-sm text-gray-300">Team 2 Wins</div>
                            <div className="text-xs text-gray-400">
                                {((simulationResults.enemyWins / simulationResults.total) * 100).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CombatantCard: React.FC<{ combatant: Combatant, isActive: boolean, intent?: any }> = ({ combatant, isActive, intent }) => {
    const hpPercent = (combatant.entity.currentHealth / combatant.entity.stats.health) * 100;

    return (
        <div className={`
            w-64 p-3 rounded border-2 relative transition-all
            ${isActive ? 'border-yellow-400 scale-105 shadow-lg shadow-yellow-900' : 'border-gray-700 bg-gray-800'}
            ${combatant.isDead ? 'opacity-50 grayscale' : ''}
        `}>
            <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white">{combatant.name}</span>
                <span className="text-xs text-gray-400 capitalize">{combatant.aiBehavior}</span>
            </div>

            {/* HP Bar */}
            <div className="w-full bg-gray-700 h-2 rounded mb-2 overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${hpPercent < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${hpPercent}%` }}
                />
            </div>
            <div className="text-xs text-right text-gray-400 mb-2">
                {Math.round(combatant.entity.currentHealth)} / {combatant.entity.stats.health} HP
            </div>

            {/* Intent Indicator */}
            {intent && !combatant.isDead && (
                <div className="bg-gray-900 p-2 rounded text-xs border border-gray-600">
                    <div className="text-yellow-300 font-bold mb-1">INTENT:</div>
                    <div className="text-white">{intent.description}</div>
                </div>
            )}

            {/* Active Effects */}
            {combatant.activeEffects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {combatant.activeEffects.map((eff, idx) => (
                        <span key={idx} className="px-1 rounded bg-purple-900 text-purple-200 text-[10px]">
                            {eff.name} ({eff.duration})
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

function getLogColor(type: string): string {
    switch (type) {
        case 'damage': return 'text-red-400';
        case 'heal': return 'text-green-400';
        case 'death': return 'text-red-600 font-bold';
        case 'info': return 'text-blue-300';
        default: return 'text-gray-300';
    }
}
