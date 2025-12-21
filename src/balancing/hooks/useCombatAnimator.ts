import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
    CombatAnimationEvent,
    CombatAnimationEventType,
    CombatAnimationScript,
    CombatTimelineFrame
} from '../simulation/types';
import { buildAnimationQueue } from '../simulation/animatorUtils';

const BASE_TIMELINE_SPEED_MS = 800;

export type ActorPose = 'idle' | 'windup' | 'attack' | 'hit' | 'status' | 'defeated';

export interface ActorAnimatorState {
    actorId: string;
    pose: ActorPose;
    lastEvent?: CombatAnimationEvent;
    metadata?: CombatAnimationEvent['metadata'];
    updatedAt: number;
}

export interface ActiveFxInstance {
    id: string;
    type: CombatAnimationEventType;
    actorId?: string;
    targetId?: string;
    metadata?: CombatAnimationEvent['metadata'];
    expiresAt: number;
}

export interface UseCombatAnimatorParams {
    frames: CombatTimelineFrame[];
    frameIndex: number;
    isPlaying: boolean;
    speedMs: number;
}

export interface UseCombatAnimatorReturn {
    scripts: CombatAnimationScript[];
    animationQueue: ReturnType<typeof buildAnimationQueue>['queue'];
    currentScript: CombatAnimationScript | null;
    currentScriptLength: number;
    eventCursor: number;
    actorStates: Record<string, ActorAnimatorState>;
    activeFx: ActiveFxInstance[];
    currentEvent: CombatAnimationEvent | null;
    reset: () => void;
}

const FX_EVENT_TYPES: CombatAnimationEventType[] = ['attack', 'miss', 'crit', 'shield', 'shake', 'heal', 'status'];
const FX_DURATION_MS: Partial<Record<CombatAnimationEventType, number>> = {
    attack: 520,
    miss: 520,
    crit: 420,
    shield: 360,
    shake: 280,
    heal: 520,
    status: 320
};

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

function poseFromEvent(type: CombatAnimationEventType): ActorPose {
    switch (type) {
        case 'attack':
        case 'crit':
        case 'miss':
            return 'attack';
        case 'shake':
            return 'hit';
        case 'shield':
        case 'heal':
        case 'status':
            return 'status';
        case 'death':
            return 'defeated';
        default:
            return 'idle';
    }
}

export function useCombatAnimator({ frames, frameIndex, isPlaying, speedMs }: UseCombatAnimatorParams): UseCombatAnimatorReturn {
    const { scripts, queue } = useMemo(() => buildAnimationQueue(frames), [frames]);
    const currentScript = scripts[frameIndex] ?? null;
    const [actorStates, setActorStates] = useState<Record<string, ActorAnimatorState>>({});
    const [activeFx, setActiveFx] = useState<ActiveFxInstance[]>([]);
    const [currentEvent, setCurrentEvent] = useState<CombatAnimationEvent | null>(null);
    const [eventCursor, setEventCursor] = useState(0);

    const eventIndexRef = useRef(0);
    const elapsedRef = useRef(0);
    const lastTimestampRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    const reset = useCallback(() => {
        eventIndexRef.current = 0;
        elapsedRef.current = 0;
        lastTimestampRef.current = null;
        setCurrentEvent(null);
        setActorStates({});
        setActiveFx([]);
        setEventCursor(0);
    }, []);

    useEffect(() => {
        reset();
    }, [reset, frameIndex, currentScript]);

    const applyEvent = useCallback((evt: CombatAnimationEvent) => {
        setCurrentEvent(evt);
        const targetActorId = evt.actorId ?? evt.targetId;
        if (targetActorId) {
            setActorStates(prev => ({
                ...prev,
                [targetActorId]: {
                    actorId: targetActorId,
                    pose: poseFromEvent(evt.type),
                    lastEvent: evt,
                    metadata: evt.metadata,
                    updatedAt: now()
                }
            }));
        }

        if (FX_EVENT_TYPES.includes(evt.type)) {
            const ttl = FX_DURATION_MS[evt.type] ?? evt.durationMs;
            setActiveFx(prev => [
                ...prev.filter(fx => fx.id !== evt.id),
                {
                    id: evt.id,
                    type: evt.type,
                    actorId: evt.actorId,
                    targetId: evt.targetId,
                    metadata: evt.metadata,
                    expiresAt: now() + ttl
                }
            ]);
        }
    }, []);

    const tick = useCallback((timestamp: number) => {
        if (!currentScript) return;
        if (lastTimestampRef.current === null) {
            lastTimestampRef.current = timestamp;
        }
        const delta = timestamp - lastTimestampRef.current;
        lastTimestampRef.current = timestamp;

        const speedFactor = speedMs > 0 ? speedMs / BASE_TIMELINE_SPEED_MS : 1;
        elapsedRef.current += delta;

        while (currentScript.events[eventIndexRef.current]) {
            const event = currentScript.events[eventIndexRef.current];
            const scaledDuration = Math.max(60, event.durationMs * speedFactor);
            if (elapsedRef.current < scaledDuration) {
                break;
            }

            elapsedRef.current -= scaledDuration;
            applyEvent(event);
            eventIndexRef.current += 1;
            setEventCursor(eventIndexRef.current);
        }

        // prune FX instances
        const threshold = now();
        setActiveFx(prev => prev.filter(fx => fx.expiresAt > threshold));

        if (eventIndexRef.current < currentScript.events.length) {
            rafRef.current = requestAnimationFrame(tick);
        }
    }, [applyEvent, currentScript, speedMs]);

    useEffect(() => {
        if (!currentScript || !isPlaying) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            lastTimestampRef.current = null;
            return;
        }

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [currentScript, isPlaying, tick]);

    return {
        scripts,
        animationQueue: queue,
        currentScript,
        currentScriptLength: currentScript?.events.length ?? 0,
        eventCursor,
        actorStates,
        activeFx,
        currentEvent,
        reset
    };
}
