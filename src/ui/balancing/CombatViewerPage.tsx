import React, { useMemo, useState } from 'react';
import { ArchetypeRegistry } from '../../balancing/archetype/ArchetypeRegistry';
import { ArchetypeBuilder } from '../../balancing/archetype/ArchetypeBuilder';
import type { ArchetypeTemplate } from '../../balancing/archetype/types';
import type { StatBlock } from '../../balancing/types';
import { DEFAULT_STATS } from '../../balancing/types';
import type { CombatConfig, CombatTimelineFrame, CombatActorSnapshot, EntityStats } from '../../balancing/simulation/types';
import { useCombatPlayback } from '../../balancing/hooks/useCombatPlayback';
import { useCombatAnimator } from '../../balancing/hooks/useCombatAnimator';
import type { ActorAnimatorState, ActiveFxInstance } from '../../balancing/hooks/useCombatAnimator';
import { resolveSpriteForArchetype } from '../../balancing/config/combatSprites';
import { CombatStage } from './CombatStage';
import { CombatAvatar } from './CombatAvatar';
import { CombatFxLayer } from './CombatFxLayer';
import { CombatTimelineHud } from './CombatTimelineHud';
import { DEFAULT_COMBAT_STAGE } from '../../balancing/config/combatStage';
import type { CombatStageSlot } from '../../balancing/config/combatStage';
import { useEasedValue } from '../../hooks/useEasedValue';
import clsx from 'clsx';

type FighterSide = 'A' | 'B';

interface FighterSelection {
    archetypeId: string;
    budget: number;
}

const FALLBACK_CONFIG: CombatConfig = {
    entity1: statBlockToEntityStats(DEFAULT_STATS, { name: 'Baseline A' }),
    entity2: statBlockToEntityStats(DEFAULT_STATS, { name: 'Baseline B' }),
    turnLimit: 40,
    enableDetailedLogging: true
};

function statBlockToEntityStats(block: StatBlock, opts: { name: string; template?: ArchetypeTemplate }): EntityStats {
    const { name, template } = opts;
    const spriteBinding = resolveSpriteForArchetype({
        spriteId: template?.spriteId,
        tags: template?.tags
    });

    return {
        name,
        hp: block.hp,
        damage: block.damage,
        attack: block.damage,
        defense: block.armor,
        armor: block.armor,
        resistance: block.resistance,
        txc: block.txc,
        evasion: block.evasion,
        critChance: block.critChance,
        critMult: block.critMult,
        armorPen: block.armorPen,
        penPercent: block.penPercent,
        lifesteal: block.lifesteal,
        regen: block.regen,
        spriteId: spriteBinding.spriteId,
        spritePalette: spriteBinding.palette,
        tags: template?.tags ?? []
    };
}

function clampBudget(template: ArchetypeTemplate | undefined, budget: number): number {
    if (!template) return budget;
    if (budget < template.minBudget) return template.minBudget;
    if (budget > template.maxBudget) return template.maxBudget;
    return budget;
}

export const CombatViewerPage: React.FC = () => {
    const archetypes = useMemo(() => new ArchetypeRegistry().listAll(), []);

    const [fighters, setFighters] = useState<Record<FighterSide, FighterSelection>>({
        A: { archetypeId: archetypes[0]?.id ?? '', budget: archetypes[0]?.minBudget ?? 50 },
        B: { archetypeId: archetypes[1]?.id ?? archetypes[0]?.id ?? '', budget: archetypes[1]?.minBudget ?? 50 }
    });

    const selectedTemplates = {
        A: archetypes.find(a => a.id === fighters.A.archetypeId),
        B: archetypes.find(a => a.id === fighters.B.archetypeId)
    };

    const statBlocks: Record<FighterSide, StatBlock | null> = {
        A: useMemo(() => buildStatBlock(selectedTemplates.A, fighters.A.budget), [selectedTemplates.A, fighters.A.budget]),
        B: useMemo(() => buildStatBlock(selectedTemplates.B, fighters.B.budget), [selectedTemplates.B, fighters.B.budget])
    };

    const combatConfig: CombatConfig | null = useMemo(() => {
        if (!statBlocks.A || !statBlocks.B || !selectedTemplates.A || !selectedTemplates.B) {
            return null;
        }

        return {
            entity1: statBlockToEntityStats(statBlocks.A, { name: selectedTemplates.A.name, template: selectedTemplates.A }),
            entity2: statBlockToEntityStats(statBlocks.B, { name: selectedTemplates.B.name, template: selectedTemplates.B }),
            turnLimit: 60,
            enableDetailedLogging: true
        };
    }, [statBlocks.A, statBlocks.B, selectedTemplates.A, selectedTemplates.B]);

    const playback = useCombatPlayback(combatConfig ?? FALLBACK_CONFIG, {
        autoPlay: true,
        speedMs: 900
    });

    const rosterByTeam = useMemo(() => {
        const current = playback.currentFrame ?? playback.frames[0];
        if (!current) return { A: [], B: [] };
        const snapshot = current.endSnapshot ?? current.startSnapshot;
        const a = snapshot.find(team => team.teamId === 'A')?.members ?? [];
        const b = snapshot.find(team => team.teamId === 'B')?.members ?? [];
        return { A: a, B: b };
    }, [playback.currentFrame, playback.frames]);

    const handleSelectionChange = (side: FighterSide, updater: (prev: FighterSelection) => FighterSelection) => {
        setFighters(prev => {
            const next = updater(prev[side]);
            const template = archetypes.find(a => a.id === next.archetypeId);
            const adjustedBudget = clampBudget(template, next.budget);
            return {
                ...prev,
                [side]: { ...next, budget: adjustedBudget }
            };
        });
    };

    return (
        <div className="observatory-page min-h-screen p-6 space-y-6">
            <header className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-white tracking-wide">⚔️ Combat Viewer</h1>
                        <p className="text-sm text-slate-400">Seleziona due archetipi configurabili e visualizza ogni turno del combattimento 1v1.</p>
                    </div>
                    <div className="flex gap-3">
                        <SummaryBadge title="Winner" value={playback.summary.result.winner.toUpperCase()} accent="gold" />
                        <SummaryBadge title="Turns" value={playback.summary.result.turns.toString()} accent="cyan" />
                        <SummaryBadge title="Seed" value={playback.seed.toString()} accent="violet" />
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <FighterConfigurator
                    side="A"
                    archetypes={archetypes}
                    selection={fighters.A}
                    template={selectedTemplates.A}
                    onChange={(updater) => handleSelectionChange('A', updater)}
                    roster={rosterByTeam.A}
                />

                <div className="xl:col-span-2 space-y-4">
                    <PlaybackArena
                        playback={playback}
                        roster={rosterByTeam}
                        templates={selectedTemplates}
                    />
                    <TimelineControls playback={playback} />
                </div>

                <FighterConfigurator
                    side="B"
                    archetypes={archetypes}
                    selection={fighters.B}
                    template={selectedTemplates.B}
                    onChange={(updater) => handleSelectionChange('B', updater)}
                    roster={rosterByTeam.B}
                />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EventFeed frame={playback.currentFrame} />
                <MetricsPanel playback={playback} />
            </section>
        </div>
    );
};

type FighterConfiguratorProps = {
    side: FighterSide;
    archetypes: ArchetypeTemplate[];
    selection: FighterSelection;
    template?: ArchetypeTemplate;
    onChange: (updater: (prev: FighterSelection) => FighterSelection) => void;
    roster: CombatTimelineFrame['startSnapshot'][number]['members'];
};

const FighterConfigurator: React.FC<FighterConfiguratorProps> = ({
    side,
    archetypes,
    selection,
    template,
    onChange,
    roster
}) => {
    return (
        <div className="default-card h-full space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500">Fighter {side}</p>
                    <h2 className="text-lg font-semibold text-white">{template?.name ?? 'Select archetype'}</h2>
                </div>
                <span className={clsx('px-2 py-1 text-xs rounded uppercase tracking-wider',
                    side === 'A' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-rose-500/20 text-rose-300')}>
                    Team {side}
                </span>
            </div>

            <label className="text-xs text-slate-500 uppercase tracking-wide">Archetype</label>
            <select
                value={selection.archetypeId}
                onChange={(e) => onChange(() => ({ ...selection, archetypeId: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
                {archetypes.map(arch => (
                    <option key={arch.id} value={arch.id}>
                        {arch.name} • {arch.category}
                    </option>
                ))}
            </select>

            <div>
                <div className="flex justify-between text-xs text-slate-500 uppercase mb-1">
                    <span>Budget ({selection.budget})</span>
                    <span>{template ? `${template.minBudget}–${template.maxBudget}` : 'N/A'}</span>
                </div>
                <input
                    type="range"
                    min={template?.minBudget ?? 10}
                    max={template?.maxBudget ?? 100}
                    value={selection.budget}
                    onChange={(e) => onChange(() => ({ ...selection, budget: Number(e.target.value) }))}
                    className="w-full accent-cyan-400"
                />
            </div>

            {template ? (
                <div className="space-y-2 text-sm text-slate-300">
                    <p className="text-slate-400 text-xs uppercase">Tags</p>
                    <div className="flex flex-wrap gap-2">
                        {template.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 text-xs rounded bg-slate-800 border border-slate-700">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="text-xs text-slate-500">Select an archetype to view details.</p>
            )}

            <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-500 uppercase">Live state</p>
                {roster.length === 0 ? (
                    <p className="text-slate-500 text-xs">Ancora nessun turno giocato.</p>
                ) : (
                    roster.map(member => (
                        <div key={member.id} className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>{member.name}</span>
                                <span>{Math.round(member.hp)} / {member.maxHp} HP</span>
                            </div>
                            <div className="h-1 bg-slate-800 rounded">
                                <div
                                    className={clsx('h-full rounded',
                                        side === 'A' ? 'bg-cyan-400' : 'bg-rose-400')}
                                    style={{ width: `${(member.hp / member.maxHp) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

type PlaybackArenaProps = {
    playback: ReturnType<typeof useCombatPlayback>;
    roster: { A: CombatTimelineFrame['startSnapshot'][number]['members']; B: CombatTimelineFrame['startSnapshot'][number]['members']; };
    templates: Record<FighterSide, ArchetypeTemplate | undefined>;
};

const PlaybackArena: React.FC<PlaybackArenaProps> = ({ playback, roster, templates }) => {
    const currentFrame = playback.currentFrame ?? playback.frames[0];
    const stageConfig = DEFAULT_COMBAT_STAGE;
    const animator = useCombatAnimator({
        frames: playback.frames,
        frameIndex: playback.frameIndex,
        isPlaying: playback.isPlaying,
        speedMs: playback.speedMs
    });

    const slotAssignments = useMemo(() => {
        const counters: Record<FighterSide, number> = { A: 0, B: 0 };
        const map = new Map<string, CombatActorSnapshot | undefined>();

        stageConfig.slots.forEach(slot => {
            const actor = roster[slot.team][counters[slot.team]] ?? undefined;
            map.set(slot.id, actor);
            counters[slot.team] = counters[slot.team] + 1;
        });

        return map;
    }, [roster]);

    const actorSlotLookup = useMemo(() => {
        const lookup = new Map<string, (typeof stageConfig)['slots'][number]>();
        slotAssignments.forEach((actor, slotId) => {
            if (!actor) return;
            const slotConfig = stageConfig.slots.find(s => s.id === slotId);
            if (slotConfig) {
                lookup.set(actor.id, slotConfig);
            }
        });
        return lookup;
    }, [slotAssignments, stageConfig.slots]);

    const renderSlot = (slot: (typeof stageConfig)['slots'][number]) => {
        const actor = slotAssignments.get(slot.id);
        if (!actor) {
            return (
                <div className="pointer-events-auto rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-[10px] tracking-[0.25em] text-slate-500">
                    EMPTY
                </div>
            );
        }

        const palette = actor.spritePalette;
        const actorState = animator.actorStates[actor.id];
        const slotFx = animator.activeFx.filter(fx => fx.actorId === actor.id || fx.targetId === actor.id);

        return (
            <div className="pointer-events-auto flex flex-col items-center gap-3 text-[11px]">
                <div className="relative rounded-3xl border border-white/15 bg-slate-950/70 px-4 pb-3 pt-4 shadow-[0_25px_45px_rgba(0,0,0,0.65)] backdrop-blur">
                    <div
                        className="absolute inset-x-3 top-2 h-px opacity-60"
                        style={{ background: palette?.accent ?? 'rgba(255,255,255,0.3)' }}
                    />
                    <CombatAvatar spriteId={actor.spriteId} actorState={actorState} className="mx-auto" size={140} />
                    <div className="mt-3 text-center font-semibold text-slate-200">
                        {actor.name}
                    </div>
                    {slotFx.length > 0 && (
                        <div className="mt-2 flex flex-wrap justify-center gap-2 text-[9px] uppercase tracking-[0.3em] text-slate-300">
                            {slotFx.map(fx => (
                                <span
                                    key={fx.id}
                                    className={clsx(
                                        'rounded-full px-2 py-1',
                                        fx.type === 'crit' && 'bg-rose-500/20 text-rose-200 border border-rose-400/40',
                                        fx.type === 'shield' && 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/30',
                                        fx.type === 'heal' && 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30',
                                        fx.type === 'shake' && 'bg-amber-500/15 text-amber-200 border border-amber-400/30',
                                        fx.type === 'status' && 'bg-violet-500/15 text-violet-200 border border-violet-400/30'
                                    )}
                                >
                                    {fx.type.toUpperCase()}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <SlotHpMeter actor={actor} slot={slot} fx={slotFx} actorState={actorState} />
            </div>
        );
    };

    interface SlotHpMeterProps {
        actor: CombatActorSnapshot;
        slot: CombatStageSlot;
        fx: ActiveFxInstance[];
        actorState?: ActorAnimatorState;
    }

    const SlotHpMeter: React.FC<SlotHpMeterProps> = ({ actor, slot, fx }) => {
        const easedHp = useEasedValue(actor.hp, { durationMs: 520 });
        const maxHp = Math.max(actor.maxHp, 1);
        const hpPercent = Math.max(0, Math.min(100, (easedHp / maxHp) * 100));

        const latestFx = [...fx]
            .sort((a, b) => b.expiresAt - a.expiresAt)
            .find(instance => ['attack', 'crit', 'shake', 'heal', 'miss'].includes(instance.type));

        const magnitude =
            typeof latestFx?.metadata?.damage === 'number'
                ? Number(latestFx.metadata.damage)
                : typeof latestFx?.metadata?.hpLost === 'number'
                    ? Number(latestFx.metadata.hpLost)
                    : typeof latestFx?.metadata?.amount === 'number'
                        ? Number(latestFx.metadata.amount)
                        : undefined;

        const isHeal = latestFx?.type === 'heal';
        const accentBar = slot.team === 'A' ? 'from-cyan-400 to-cyan-300' : 'from-rose-400 to-rose-300';

        return (
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                <span>HP</span>
                <div className="relative h-3 w-28 overflow-hidden rounded-full border border-white/10 bg-slate-900/70">
                    <div
                        className={clsx(
                            'absolute inset-y-0 left-0 rounded-full bg-linear-to-r transition-[width] duration-500',
                            accentBar,
                            latestFx && !isHeal && 'shadow-[0_0_18px_rgba(248,113,113,0.45)]',
                            latestFx && isHeal && 'shadow-[0_0_18px_rgba(16,185,129,0.45)]'
                        )}
                        style={{ width: `${hpPercent}%` }}
                    />
                </div>
                <span className="text-[9px] tracking-normal text-slate-200">{Math.round(easedHp)}</span>
                {typeof magnitude === 'number' && magnitude > 0 && (
                    <span
                        className={clsx(
                            'text-[10px] font-bold tracking-normal',
                            isHeal ? 'text-emerald-300' : 'text-rose-300'
                        )}
                    >
                        {isHeal ? '+' : '-'}
                        {Math.round(Math.abs(magnitude))}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="default-card p-0 overflow-hidden">
            <div className="border-b border-slate-800 bg-slate-950/60 px-4 py-3 flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Turn {currentFrame?.turn ?? 0}</p>
                    <p className="text-sm text-slate-300">Phase: {animator.currentEvent?.phase ?? currentFrame?.phases?.[0]?.phase ?? 'waiting'}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        className="text-xs px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                        onClick={playback.togglePlay}
                    >
                        {playback.isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button
                        className="text-xs px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                        onClick={() => playback.reroll()}
                    >
                        Re-roll seed
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-4">
                <CombatTimelineHud events={animator.currentScript?.events ?? []} cursor={animator.eventCursor} />
                <CombatStage
                    config={stageConfig}
                    renderSlot={renderSlot}
                    overlay={<CombatFxLayer fx={animator.activeFx} slotLookup={actorSlotLookup} />}
                >
                    <div className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
                        {templates.A?.name ?? 'Team A'} vs {templates.B?.name ?? 'Team B'}
                    </div>
                </CombatStage>
            </div>
        </div>
    );
};

const TimelineControls: React.FC<{ playback: ReturnType<typeof useCombatPlayback> }> = ({ playback }) => {
    return (
        <div className="default-card">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Timeline</span>
                <span>{playback.frameIndex + 1} / {Math.max(playback.frames.length, 1)}</span>
            </div>
            <input
                type="range"
                min={0}
                max={Math.max(playback.frames.length - 1, 0)}
                value={playback.frameIndex}
                onChange={(e) => playback.seek(Number(e.target.value))}
                className="w-full accent-cyan-400"
            />
            <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                <button onClick={playback.stepBackward} className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 transition">-1</button>
                <button onClick={playback.stepForward} className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 transition">+1</button>
                <div className="flex items-center gap-2">
                    <span>Speed</span>
                    <select
                        value={playback.speedMs}
                        onChange={(e) => playback.setSpeed(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
                    >
                        {[400, 700, 900, 1200].map(speed => (
                            <option key={speed} value={speed}>{(speed / 1000).toFixed(1)}s</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

const EventFeed: React.FC<{ frame: CombatTimelineFrame | null }> = ({ frame }) => {
    const events = frame?.phases.flatMap(phase =>
        phase.events.map(event => ({ ...event, phase: phase.phase }))
    ) ?? [];

    if (!events.length) {
        return (
            <div className="default-card">
                <p className="text-slate-400 text-sm">Nessun evento registrato per questo turno.</p>
            </div>
        );
    }

    return (
        <div className="default-card space-y-3 max-h-64 overflow-y-auto">
            <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Turn {frame?.turn}</p>
                <h3 className="text-lg text-white font-semibold">Event log</h3>
            </div>
            <ul className="space-y-2">
                {events.map((event, idx) => (
                    <li key={`${event.message}-${idx}`} className="text-sm text-slate-300 border border-slate-800 rounded px-3 py-2">
                        <p className="text-xs text-slate-500 uppercase">{event.phase}</p>
                        <p className="text-white">{event.message}</p>
                        {event.payload && (
                            <p className="text-xs text-slate-500 mt-1">{JSON.stringify(event.payload)}</p>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const MetricsPanel: React.FC<{ playback: ReturnType<typeof useCombatPlayback> }> = ({ playback }) => {
    const { result, metadata } = playback.summary;
    return (
        <div className="default-card grid grid-cols-2 gap-4 text-sm text-slate-300">
            <Metric title="Damage Dealt (A)" value={result.damageDealt.entity1.toFixed(0)} accent="cyan" />
            <Metric title="Damage Dealt (B)" value={result.damageDealt.entity2.toFixed(0)} accent="rose" />
            <Metric title="HP Remaining (A)" value={result.hpRemaining.entity1.toFixed(0)} accent="cyan" />
            <Metric title="HP Remaining (B)" value={result.hpRemaining.entity2.toFixed(0)} accent="rose" />
            <Metric title="Hit Rate (A)" value={`${Math.round((metadata?.hitRate?.entity1 ?? 0) * 100)}%`} accent="cyan" />
            <Metric title="Hit Rate (B)" value={`${Math.round((metadata?.hitRate?.entity2 ?? 0) * 100)}%`} accent="rose" />
        </div>
    );
};

const Metric: React.FC<{ title: string; value: string; accent: 'cyan' | 'rose' | 'gold' | 'violet'; }> = ({ title, value, accent }) => (
    <div className="bg-slate-950/60 rounded-lg p-4 border border-slate-900">
        <p className="text-xs text-slate-500 uppercase">{title}</p>
        <p className={clsx('text-xl font-semibold', {
            'text-cyan-300': accent === 'cyan',
            'text-rose-300': accent === 'rose',
            'text-amber-300': accent === 'gold',
            'text-violet-300': accent === 'violet'
        })}>
            {value}
        </p>
    </div>
);

const SummaryBadge: React.FC<{ title: string; value: string; accent: 'gold' | 'cyan' | 'violet'; }> = ({ title, value, accent }) => (
    <div className={clsx('px-4 py-2 rounded-lg border', {
        'border-amber-500/30 bg-amber-500/10 text-amber-200': accent === 'gold',
        'border-cyan-500/30 bg-cyan-500/10 text-cyan-200': accent === 'cyan',
        'border-violet-500/30 bg-violet-500/10 text-violet-200': accent === 'violet'
    })}>
        <p className="text-xs uppercase tracking-wide">{title}</p>
        <p className="text-lg font-semibold">{value}</p>
    </div>
);

function buildStatBlock(template: ArchetypeTemplate | undefined, budget: number): StatBlock | null {
    if (!template) return null;
    try {
        return ArchetypeBuilder.buildArchetype(template, budget);
    } catch (error) {
        console.error('Failed to build archetype', error);
        return null;
    }
}

export default CombatViewerPage;
