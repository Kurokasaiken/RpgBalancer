import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from 'react';
import { CombatSimulator } from '../simulation/CombatSimulator';
import type {
    CombatConfig,
    CombatResult,
    CombatTimelineFrame
} from '../simulation/types';
import { SeededRNG } from '../1v1/montecarlo';

export interface UseCombatPlaybackOptions {
    seed?: number;
    autoPlay?: boolean;
    speedMs?: number;
    loop?: boolean;
}

export interface PlaybackSummary {
    result: Pick<
        CombatResult,
        'winner' | 'turns' | 'damageDealt' | 'hpRemaining' | 'overkill'
    >;
    initiative?: CombatResult['initiativeRolls'];
    metadata?: Omit<CombatResult, 'winner' | 'turns' | 'damageDealt' | 'hpRemaining' | 'overkill' | 'timeline'>;
}

export interface UseCombatPlaybackReturn {
    frames: CombatTimelineFrame[];
    currentFrame: CombatTimelineFrame | null;
    frameIndex: number;
    isPlaying: boolean;
    speedMs: number;
    summary: PlaybackSummary;
    seed: number;
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    seek: (index: number) => void;
    setSpeed: (ms: number) => void;
    reroll: (nextSeed?: number) => void;
}

const DEFAULT_PLAYBACK_SPEED = 800;
const DEFAULT_SEED = 1337;

interface TokenizedState<T> {
    token: string;
    value: T;
}

function resolveNextState<T>(updater: SetStateAction<T>, current: T): T {
    return typeof updater === 'function'
        ? (updater as (value: T) => T)(current)
        : updater;
}

/**
 * Hook that runs a deterministic combat simulation and exposes a timeline for playback controls.
 * Ensures detailed logging is enabled so UI layers can animate per-turn states.
 */
export function useCombatPlayback(
    config: CombatConfig,
    options: UseCombatPlaybackOptions = {}
): UseCombatPlaybackReturn {
    const configKey = useMemo(() => JSON.stringify(config), [config]);
    const [seed, setSeed] = useState<number>(options.seed ?? DEFAULT_SEED);
    const [speedMs, setSpeedMsState] = useState<number>(options.speedMs ?? DEFAULT_PLAYBACK_SPEED);
    const defaultAutoPlay = options.autoPlay ?? false;

    const simulationResult = useMemo(() => {
        const rng = new SeededRNG(seed);
        const detailedConfig: CombatConfig = {
            ...config,
            enableDetailedLogging: true
        };

        return CombatSimulator.simulate(
            detailedConfig,
            () => rng.next()
        );
    }, [config, seed]);

    const frames = simulationResult.timeline ?? [];
    const playbackResetToken = useMemo(
        () => `${configKey}-${seed}-${frames.length}-${simulationResult.turns}-${defaultAutoPlay ? '1' : '0'}`,
        [configKey, seed, frames.length, simulationResult.turns, defaultAutoPlay]
    );

    const [frameIndexState, setFrameIndexState] = useState<TokenizedState<number>>(() => ({
        token: playbackResetToken,
        value: 0
    }));
    const [playState, setPlayState] = useState<TokenizedState<boolean>>(() => ({
        token: playbackResetToken,
        value: defaultAutoPlay
    }));

    const frameIndex = frameIndexState.token === playbackResetToken ? frameIndexState.value : 0;
    const isPlaying = playState.token === playbackResetToken ? playState.value : defaultAutoPlay;

    const updateFrameIndex = useCallback(
        (updater: SetStateAction<number>) => {
            setFrameIndexState(prev => {
                const base =
                    prev.token === playbackResetToken
                        ? prev
                        : { token: playbackResetToken, value: 0 };
                const nextValue = resolveNextState(updater, base.value);
                if (nextValue === base.value && base.token === playbackResetToken) {
                    return base;
                }
                return {
                    token: playbackResetToken,
                    value: nextValue
                };
            });
        },
        [playbackResetToken]
    );

    const updateIsPlaying = useCallback(
        (updater: SetStateAction<boolean>) => {
            setPlayState(prev => {
                const base =
                    prev.token === playbackResetToken
                        ? prev
                        : { token: playbackResetToken, value: defaultAutoPlay };
                const nextValue = resolveNextState(updater, base.value);
                if (nextValue === base.value && base.token === playbackResetToken) {
                    return base;
                }
                return {
                    token: playbackResetToken,
                    value: nextValue
                };
            });
        },
        [playbackResetToken, defaultAutoPlay]
    );

    // Playback interval (client-side only)
    const intervalRef = useRef<number | null>(null);
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        if (!isPlaying || frames.length === 0) return undefined;

        intervalRef.current = window.setInterval(() => {
            updateFrameIndex(prev => {
                const next = prev + 1;
                if (next >= frames.length) {
                    if (options.loop) {
                        return 0;
                    }
                    updateIsPlaying(false);
                    return prev;
                }
                return next;
            });
        }, Math.max(100, speedMs));

        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [frames.length, isPlaying, options.loop, speedMs, updateFrameIndex, updateIsPlaying]);

    const play = useCallback(() => {
        if (frames.length === 0) return;
        updateIsPlaying(true);
    }, [frames.length, updateIsPlaying]);

    const pause = useCallback(() => {
        updateIsPlaying(false);
    }, [updateIsPlaying]);

    const togglePlay = useCallback(() => {
        updateIsPlaying(prev => !prev);
    }, [updateIsPlaying]);

    const stepForward = useCallback(() => {
        updateFrameIndex(prev => Math.min(prev + 1, Math.max(frames.length - 1, 0)));
    }, [frames.length, updateFrameIndex]);

    const stepBackward = useCallback(() => {
        updateFrameIndex(prev => Math.max(prev - 1, 0));
    }, [updateFrameIndex]);

    const seek = useCallback((index: number) => {
        const clamped = Math.max(0, Math.min(index, Math.max(frames.length - 1, 0)));
        updateFrameIndex(clamped);
    }, [frames.length, updateFrameIndex]);

    const setSpeed = useCallback((ms: number) => {
        setSpeedMsState(Math.max(100, ms));
    }, []);

    const reroll = useCallback((nextSeed?: number) => {
        const newSeed = typeof nextSeed === 'number' ? nextSeed : Math.floor(Math.random() * 1_000_000);
        setSeed(newSeed);
    }, []);

    const summary: PlaybackSummary = useMemo(() => ({
        result: {
            winner: simulationResult.winner,
            turns: simulationResult.turns,
            damageDealt: simulationResult.damageDealt,
            hpRemaining: simulationResult.hpRemaining,
            overkill: simulationResult.overkill
        },
        initiative: simulationResult.initiativeRolls,
        metadata: {
            hitRate: simulationResult.hitRate,
            critRate: simulationResult.critRate,
            statusEffectsApplied: simulationResult.statusEffectsApplied,
            turnsStunned: simulationResult.turnsStunned
        }
    }), [simulationResult]);

    return {
        frames,
        currentFrame: frames[frameIndex] ?? null,
        frameIndex,
        isPlaying,
        speedMs,
        summary,
        seed,
        play,
        pause,
        togglePlay,
        stepForward,
        stepBackward,
        seek,
        setSpeed,
        reroll
    };
}
