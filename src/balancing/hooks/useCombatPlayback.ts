import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
    const [isPlaying, setIsPlaying] = useState<boolean>(options.autoPlay ?? false);
    const [frameIndex, setFrameIndex] = useState<number>(0);

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
    }, [configKey, seed, config]);

    const frames = simulationResult.timeline ?? [];

    // Reset playback when new timeline generated
    useEffect(() => {
        setFrameIndex(0);
        setIsPlaying(options.autoPlay ?? false);
    }, [frames.length, options.autoPlay]);

    // Playback interval (client-side only)
    const intervalRef = useRef<number | null>(null);
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        if (!isPlaying || frames.length === 0) return undefined;

        intervalRef.current = window.setInterval(() => {
            setFrameIndex(prev => {
                const next = prev + 1;
                if (next >= frames.length) {
                    if (options.loop) {
                        return 0;
                    }
                    setIsPlaying(false);
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
    }, [frames.length, isPlaying, options.loop, speedMs]);

    const play = useCallback(() => {
        if (frames.length === 0) return;
        setIsPlaying(true);
    }, [frames.length]);

    const pause = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const togglePlay = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    const stepForward = useCallback(() => {
        setFrameIndex(prev => Math.min(prev + 1, Math.max(frames.length - 1, 0)));
    }, [frames.length]);

    const stepBackward = useCallback(() => {
        setFrameIndex(prev => Math.max(prev - 1, 0));
    }, []);

    const seek = useCallback((index: number) => {
        const clamped = Math.max(0, Math.min(index, Math.max(frames.length - 1, 0)));
        setFrameIndex(clamped);
    }, [frames.length]);

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
