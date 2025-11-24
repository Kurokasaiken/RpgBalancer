import React, { useState, useRef } from 'react';
import { CombatGrid } from './CombatGrid';
import { CharacterSelector } from './CharacterSelector';
import type { CombatState } from '../../engine/grid/gridTypes';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { SavedCharacter } from '../../engine/idle/characterStorage';
import { Entity } from '../../engine/core/entity';
import { CombatTextOverlay, type CombatTextInstance } from '../effects/CombatText';

interface GridArenaProps {
    playerEntity?: Entity;
    enemyEntities?: Entity[];
    onCombatEnd?: (result: 'victory' | 'defeat') => void;
}

export const GridArena: React.FC<GridArenaProps> = ({ playerEntity, enemyEntities, onCombatEnd }) => {
    const isMobile = useMediaQuery('(max-width: 767px)');

    // If external entities provided, skip selection
    const [phase, setPhase] = useState<'selection' | 'combat'>(playerEntity ? 'combat' : 'selection');
    const [autoSpeed, setAutoSpeed] = useState(1);
    const [isPaused, setIsPaused] = useState(false);

    // Combat Text State
    const [combatTexts, setCombatTexts] = useState<CombatTextInstance[]>([]);
    const [shake, setShake] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const addCombatText = React.useCallback((text: string, gridPos: { x: number, y: number }, type: 'damage' | 'heal' | 'crit' | 'info', color: string) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();

        // Simplified percentage based approach
        // x: 1..gridSize, y: 1..gridSize
        const gridSize = isMobile ? 6 : 8;
        const xPercent = (gridPos.x - 0.5) / gridSize;
        const yPercent = (gridPos.y - 0.5) / gridSize;

        const pixelX = rect.width * xPercent;
        const pixelY = rect.height * yPercent;

        const newText: CombatTextInstance = {
            id: crypto.randomUUID(),
            text,
            x: pixelX,
            y: pixelY,
            color,
            type
        };

        setCombatTexts(prev => [...prev, newText]);
    }, [isMobile]);

    const gridSize = isMobile ? 6 : 8;

    // Initialize state based on props or defaults
    const getInitialState = (): CombatState => {
        if (playerEntity && enemyEntities) {
            return {
                gridSize,
                entities: [
                    {
                        id: playerEntity.id,
                        name: playerEntity.name,
                        stats: playerEntity.statBlock || { hp: playerEntity.derivedStats.maxHp, damage: playerEntity.derivedStats.attackPower } as unknown as any,
                        position: { x: 1, y: Math.floor(gridSize / 2) },
                        state: 'idle',
                        team: 'player',
                        color: '#3b82f6',
                        maxHp: playerEntity.derivedStats.maxHp,
                        currentHp: playerEntity.currentHp,
                        actionPoints: 2
                    },
                    ...enemyEntities.map((e, i) => ({
                        id: e.id,
                        name: e.name,
                        stats: e.statBlock || { hp: e.derivedStats.maxHp, damage: e.derivedStats.attackPower } as unknown as any,
                        position: { x: gridSize - 2, y: Math.floor(gridSize / 2) + (i % 2 === 0 ? i / 2 : -(i + 1) / 2) }, // Simple spread
                        state: 'idle' as const,
                        team: 'enemy' as const,
                        color: '#ef4444',
                        maxHp: e.derivedStats.maxHp,
                        currentHp: e.currentHp,
                        actionPoints: 2
                    }))
                ],
                turn: 1,
                activeEntityId: playerEntity.id,
                selectedEntityId: null,
                logs: [`Survival Wave Started!`]
            };
        }

        // Default legacy initialization
        const defaultChar1 = {
            id: 'hero-1',
            name: 'Warrior',
            hp: 200,
            damage: 30
        };

        const defaultChar2 = {
            id: 'enemy-1',
            name: 'Orc',
            hp: 150,
            damage: 20
        };

        return {
            gridSize,
            entities: [
                {
                    id: defaultChar1.id,
                    name: defaultChar1.name,
                    stats: { hp: defaultChar1.hp, damage: defaultChar1.damage } as unknown as any,
                    position: { x: isMobile ? 1 : 2, y: isMobile ? 3 : 4 },
                    state: 'idle',
                    team: 'player',
                    color: '#3b82f6',
                    maxHp: defaultChar1.hp,
                    currentHp: defaultChar1.hp,
                    actionPoints: 2
                },
                {
                    id: defaultChar2.id,
                    name: defaultChar2.name,
                    stats: { hp: defaultChar2.hp, damage: defaultChar2.damage } as unknown as any,
                    position: { x: isMobile ? 4 : 5, y: isMobile ? 3 : 4 },
                    state: 'idle',
                    team: 'enemy',
                    color: '#ef4444',
                    maxHp: defaultChar2.hp,
                    currentHp: defaultChar2.hp,
                    actionPoints: 2
                }
            ],
            turn: 1,
            activeEntityId: defaultChar1.id,
            selectedEntityId: null,
            logs: ['Combat started. Select your Warrior.']
        };
    };

    const [combatState, setCombatState] = useState<CombatState>(getInitialState);

    // Effect to detect combat end for external callback
    React.useEffect(() => {
        if (!onCombatEnd) return;

        const playerAlive = combatState.entities.some(e => e.team === 'player' && e.state !== 'dead');
        const enemiesAlive = combatState.entities.some(e => e.team === 'enemy' && e.state !== 'dead');

        if (!playerAlive) {
            onCombatEnd('defeat');
        } else if (!enemiesAlive) {
            onCombatEnd('victory');
        }
    }, [combatState.entities, onCombatEnd]);

    const handleCharactersSelected = (char1: SavedCharacter, char2: SavedCharacter) => {
        setCombatState({
            gridSize,
            entities: [
                {
                    id: char1.id,
                    name: char1.name,
                    stats: char1.statBlock,
                    position: { x: 1, y: Math.floor(gridSize / 2) },
                    state: 'idle',
                    team: 'player',
                    color: '#3b82f6',
                    maxHp: char1.statBlock.hp,
                    currentHp: char1.statBlock.hp,
                    actionPoints: 2
                },
                {
                    id: char2.id,
                    name: char2.name,
                    stats: char2.statBlock,
                    position: { x: gridSize - 2, y: Math.floor(gridSize / 2) },
                    state: 'idle',
                    team: 'enemy',
                    color: '#ef4444',
                    maxHp: char2.statBlock.hp,
                    currentHp: char2.statBlock.hp,
                    actionPoints: 2
                }
            ],
            turn: 1,
            activeEntityId: char1.id,
            selectedEntityId: null,
            logs: [`Battle begins! ${char1.name} vs ${char2.name}`]
        });

        setPhase('combat');
        setTimeout(() => startIdleCombat(), 1000);
    };

    const startIdleCombat = () => {
        setIsPaused(false);
        runIdleTurn();
    };

    const runIdleTurn = () => {
        if (isPaused) return;

        setCombatState(prev => {
            const activeEntity = prev.entities.find(e => e.id === prev.activeEntityId);
            if (!activeEntity || activeEntity.state === 'dead') {
                const nextEntity = prev.entities.find(e => e.state !== 'dead' && e.id !== prev.activeEntityId);
                if (!nextEntity) {
                    return { ...prev, logs: ['Battle ended!', ...prev.logs] };
                }
                return { ...prev, activeEntityId: nextEntity.id };
            }

            const enemies = prev.entities.filter(e => e.team !== activeEntity.team && e.state !== 'dead');
            if (enemies.length === 0) {
                return { ...prev, logs: [`${activeEntity.name} wins!`, ...prev.logs] };
            }

            const target = enemies[0];
            const damage = activeEntity.stats.damage || 20;
            const newHp = Math.max(0, target.currentHp - damage);

            // Trigger Combat Text
            // We need to do this outside the state update or via a side effect.
            // But we can't easily do side effects inside setState updater.
            // We'll use a timeout or just call it here if we can access the ref/state setter.
            // Since we are in a functional update, we can't access current state easily to call addCombatText.
            // However, we can use a separate useEffect to watch for HP changes?
            // Or just break purity slightly for the visual effect (not recommended but common in game loops).
            // Better: Return a flag in state and have an effect process it?
            // Or: Just calculate damage here and call addCombatText in the setTimeout below.

            return {
                ...prev,
                entities: prev.entities.map(e => {
                    if (e.id === target.id) {
                        return { ...e, currentHp: newHp, state: newHp === 0 ? 'dead' : 'hit' };
                    }
                    if (e.id === activeEntity.id) {
                        return { ...e, state: 'attacking' };
                    }
                    return e;
                }),
                logs: [
                    `${activeEntity.name} attacks ${target.name} for ${damage} damage! (${newHp}/${target.maxHp} HP)`,
                    ...prev.logs.slice(0, 9)
                ],
                turn: prev.turn,
                // Store last action for effects
                lastAction: {
                    sourceId: activeEntity.id,
                    targetId: target.id,
                    damage: damage,
                    type: 'damage'
                }
            };
        });

        // Schedule next turn and process effects
        setTimeout(() => {
            // This is where we would ideally trigger the visual effect, but we don't have the *result* of the state update here easily
            // unless we inspect the state.
            // Let's use a useEffect to watch for changes in entities' HP?
            // Or simpler: Just modify the runIdleTurn to be an async function that sets state, waits, then sets state again.

            // For now, let's rely on the state update above. We added `lastAction` to state (we need to add it to type definition or just cast).
            // Actually, let's just hack it for now:
            // We know what happened.

            setCombatState(prev => {
                // Check if we had an action
                // This is tricky because we are inside the timeout from the *previous* turn logic?
                // No, this timeout is scheduled *after* the state update.

                // Let's just use a separate effect for combat text.
                return {
                    ...prev,
                    entities: prev.entities.map(e => ({
                        ...e,
                        state: e.state === 'dead' ? 'dead' : 'idle'
                    })),
                    activeEntityId: prev.entities.find(e =>
                        e.id !== prev.activeEntityId && e.state !== 'dead'
                    )?.id || prev.activeEntityId,
                    turn: prev.turn + 1
                };
            });

            if (!isPaused) {
                setTimeout(() => runIdleTurn(), 1000 / autoSpeed);
            }
        }, 500);
    };

    // Effect to trigger combat text when entities take damage
    // We need a way to track previous HP to know who took damage.
    const prevEntitiesRef = useRef<typeof combatState.entities>([]);

    React.useEffect(() => {
        let damageTaken = false;
        combatState.entities.forEach(entity => {
            const prev = prevEntitiesRef.current.find(e => e.id === entity.id);
            if (prev && prev.currentHp > entity.currentHp) {
                const damage = prev.currentHp - entity.currentHp;
                addCombatText(`-${damage}`, entity.position, 'damage', '#ef4444');
                damageTaken = true;
            }
        });

        if (damageTaken) {
            setShake(true);
            setTimeout(() => setShake(false), 300);
        }

        prevEntitiesRef.current = combatState.entities;
    }, [combatState.entities, addCombatText]);

    const addLog = (msg: string) => {
        setCombatState(prev => ({ ...prev, logs: [msg, ...prev.logs].slice(0, 10) }));
    };

    const handleEntityClick = (id: string) => {
        const entity = combatState.entities.find(e => e.id === id);
        if (entity) {
            addLog(`Selected: ${entity.name} (${entity.currentHp}/${entity.maxHp} HP)`);
        }
    };

    const handleTileClick = () => {
        // Disabled in idle mode
    };

    if (phase === 'selection') {
        return <CharacterSelector onCharactersSelected={handleCharactersSelected} />;
    }

    return (
        <div className="flex flex-col lg:flex-row h-full gap-2 md:gap-4 p-2 md:p-4">
            <div
                ref={containerRef}
                className={`flex-1 flex flex-col items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800 relative overflow-hidden min-h-[400px] md:min-h-0 transition-transform ${shake ? 'translate-x-1 translate-y-1' : ''}`}
                style={shake ? { animation: 'shake 0.3s cubic-bezier(.36,.07,.19,.97) both' } : {}}
            >
                <style>{`
                    @keyframes shake {
                        10%, 90% { transform: translate3d(-1px, 0, 0); }
                        20%, 80% { transform: translate3d(2px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                        40%, 60% { transform: translate3d(4px, 0, 0); }
                    }
                `}</style>
                <CombatTextOverlay items={combatTexts} onComplete={(id) => setCombatTexts(prev => prev.filter(t => t.id !== id))} />

                <div className="absolute top-2 md:top-4 left-2 md:left-4 flex items-center gap-4 z-10">
                    <div className="text-white font-bold text-lg md:text-xl">
                        Turn {combatState.turn}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                        >
                            {isPaused ? '▶️' : '⏸️'}
                        </button>
                        <select
                            value={autoSpeed}
                            onChange={(e) => setAutoSpeed(Number(e.target.value))}
                            className="px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-700"
                        >
                            <option value={0.5}>0.5x</option>
                            <option value={1}>1x</option>
                            <option value={2}>2x</option>
                            <option value={5}>5x</option>
                        </select>
                    </div>
                </div>

                <CombatGrid
                    state={combatState}
                    onTileClick={handleTileClick}
                    onEntityClick={handleEntityClick}
                />

                <div className="mt-4 md:mt-8 text-gray-400 text-xs md:text-sm px-2 text-center">
                    {isPaused ? '⏸️ Paused' : '🤖 Idle combat in progress...'}
                </div>
            </div>

            <div className={`
                ${isMobile ? 'w-full' : 'w-64 md:w-80'}
                bg-gray-800 rounded-xl border border-gray-700 p-3 md:p-4 flex flex-col
                ${isMobile ? 'max-h-64' : ''}
            `}>
                <h3 className="text-white font-bold mb-2 md:mb-4 border-b border-gray-700 pb-2 text-sm md:text-base">
                    Combat Log
                </h3>
                <div className="flex-1 overflow-y-auto space-y-1 md:space-y-2 font-mono text-xs text-gray-300">
                    {combatState.logs.map((log, i) => (
                        <div key={i} className="border-l-2 border-blue-500 pl-2 py-1 bg-gray-900/50 rounded-r">
                            {log}
                        </div>
                    ))}
                </div>

                <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-gray-700 space-y-2">
                    {combatState.entities.map((entity) => (
                        <div key={entity.id} className="text-xs md:text-sm">
                            <div className={`font-bold ${entity.team === 'player' ? 'text-blue-400' : 'text-red-400'}`}>
                                {entity.name}
                            </div>
                            <div className="text-gray-400">
                                HP: {entity.currentHp}/{entity.maxHp}
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded overflow-hidden">
                                <div
                                    className={`h-full ${entity.team === 'player' ? 'bg-blue-500' : 'bg-red-500'}`}
                                    style={{ width: `${(entity.currentHp / entity.maxHp) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
