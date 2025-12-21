import React, { useState, useRef } from 'react';
import { CombatGrid } from '../grid/CombatGrid';
import { CharacterSelector } from '../grid/CharacterSelector';
import type { CombatState } from '../../engine/grid/gridTypes';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { SavedCharacter } from '../../engine/idle/characterStorage';
import { Entity } from '../../engine/core/entity';
import { CombatTextOverlay, type CombatTextInstance } from '../effects/CombatText';
import { FantasyLayout } from './FantasyLayout';
import { FantasyCard } from './atoms/FantasyCard';
import { FantasyButton } from './atoms/FantasyButton';

interface GridArenaProps {
    playerEntity?: Entity;
    enemyEntities?: Entity[];
    onCombatEnd?: (result: 'victory' | 'defeat') => void;
}

export const FantasyGridArena: React.FC<GridArenaProps> = ({ playerEntity, enemyEntities, onCombatEnd }) => {
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
                lastAction: {
                    sourceId: activeEntity.id,
                    targetId: target.id,
                    damage: damage,
                    type: 'damage'
                }
            };
        });

        setTimeout(() => {
            setCombatState(prev => {
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

    // Effect to trigger combat text
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
        return (
            <FantasyLayout activeTab="gridArena" onTabChange={() => { }}>
                <div className="flex justify-center items-center h-full">
                    <CharacterSelector onCharactersSelected={handleCharactersSelected} />
                </div>
            </FantasyLayout>
        );
    }

    return (
        <FantasyLayout activeTab="gridArena" onTabChange={() => { }}>
            <div className="flex flex-col lg:flex-row h-full gap-6 pb-20">
                {/* Main Arena Area */}
                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-amber-100 font-serif drop-shadow-md">Battle Arena</h2>
                        <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-lg border border-amber-900/50 backdrop-blur-md">
                            <span
                                className="text-amber-400 font-bold"
                                data-testid="grid-turn-indicator"
                            >
                                Turn {combatState.turn}
                            </span>
                            <div className="h-4 w-px bg-amber-900/50 mx-2" />
                            <div className="flex gap-2">
                                <FantasyButton
                                    size="sm"
                                    variant={isPaused ? 'primary' : 'secondary'}
                                    onClick={() => setIsPaused(!isPaused)}
                                >
                                    {isPaused ? 'RESUME' : 'PAUSE'}
                                </FantasyButton>
                                <select
                                    value={autoSpeed}
                                    onChange={(e) => setAutoSpeed(Number(e.target.value))}
                                    className="bg-black/40 text-amber-100 text-sm rounded border border-amber-900/50 px-2 py-1 focus:outline-none focus:border-amber-500"
                                >
                                    <option value={0.5}>0.5x</option>
                                    <option value={1}>1x</option>
                                    <option value={2}>2x</option>
                                    <option value={5}>5x</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div
                        ref={containerRef}
                        className={`flex-1 relative overflow-hidden rounded-xl border-2 border-amber-900/30 bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] ${shake ? 'animate-shake' : ''}`}
                    >
                        <style>{`
                            @keyframes shake {
                                10%, 90% { transform: translate3d(-1px, 0, 0); }
                                20%, 80% { transform: translate3d(2px, 0, 0); }
                                30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                                40%, 60% { transform: translate3d(4px, 0, 0); }
                            }
                            .animate-shake {
                                animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
                            }
                        `}</style>

                        <div className="absolute inset-0 flex items-center justify-center p-8">
                            <CombatGrid
                                state={combatState}
                                onTileClick={handleTileClick}
                                onEntityClick={handleEntityClick}
                            />
                        </div>

                        <CombatTextOverlay items={combatTexts} onComplete={(id) => setCombatTexts(prev => prev.filter(t => t.id !== id))} />

                        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                            <span className="bg-black/60 text-amber-200/60 text-xs px-3 py-1 rounded-full backdrop-blur-sm border border-amber-900/30">
                                {isPaused ? '⏸️ Simulation Paused' : '⚔️ Battle in Progress'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Logs & Stats */}
                <div className="w-full lg:w-80 flex flex-col gap-4">
                    <FantasyCard title="Combat Log" className="flex-1 min-h-[300px] flex flex-col">
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 font-mono text-xs max-h-[400px]">
                            {combatState.logs.map((log, i) => (
                                <div key={i} className="border-l-2 border-amber-600 pl-3 py-1.5 bg-black/20 rounded-r text-amber-100/80">
                                    {log}
                                </div>
                            ))}
                        </div>
                    </FantasyCard>

                    <FantasyCard title="Combatants">
                        <div className="space-y-4">
                            {combatState.entities.map((entity) => (
                                <div key={entity.id} className="bg-black/20 p-3 rounded border border-amber-900/20">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-bold ${entity.team === 'player' ? 'text-cyan-400' : 'text-red-400'}`}>
                                            {entity.name}
                                        </span>
                                        <span className="text-xs text-amber-100/60">
                                            {entity.currentHp}/{entity.maxHp} HP
                                        </span>
                                    </div>
                                    <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full transition-all duration-300 ${entity.team === 'player' ? 'bg-cyan-600' : 'bg-red-600'}`}
                                            style={{ width: `${(entity.currentHp / entity.maxHp) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FantasyCard>
                </div>
            </div>
        </FantasyLayout>
    );
};
