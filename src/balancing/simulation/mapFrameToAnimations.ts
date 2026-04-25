import type { CombatLogEntry } from '../../engine/combat/state';
import type {
    CombatAnimationEvent,
    CombatAnimationEventType,
    CombatAnimationScript,
    CombatTimelineFrame,
    CombatPhaseEvent
} from './types';

const DEFAULT_EVENT_DURATION: Record<CombatAnimationEventType, number> = {
    spawn: 600,
    idle: 400,
    attack: 620,
    miss: 520,
    crit: 320,
    shield: 260,
    shake: 220,
    heal: 360,
    death: 700,
    status: 300
};

interface MapFrameToAnimationsOptions {
    damageShakeThreshold?: number;
}

const DEFAULT_OPTIONS: Required<MapFrameToAnimationsOptions> = {
    damageShakeThreshold: 35
};

export function mapFrameToAnimations(
    frame: CombatTimelineFrame,
    options: MapFrameToAnimationsOptions = {}
): CombatAnimationScript {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const events: CombatAnimationEvent[] = [];
    let eventCounter = 0;

    const createEvent = (
        type: CombatAnimationEventType,
        phase: CombatPhaseEvent['phase'],
        actorId?: string,
        targetId?: string,
        metadata?: CombatAnimationEvent['metadata'],
        durationOverride?: number
    ): CombatAnimationEvent => ({
        id: `${frame.turn}-${phase}-${type}-${eventCounter++}`,
        turn: frame.turn,
        phase,
        type,
        actorId,
        targetId,
        durationMs: durationOverride ?? DEFAULT_EVENT_DURATION[type],
        metadata
    });

    const pushPhaseMarker = (phaseName: CombatPhaseEvent['phase']) => {
        events.push(
            createEvent('status', phaseName, undefined, undefined, {
                phaseMarker: phaseName
            })
        );
    };

    frame.phases.forEach(phaseEvent => {
        pushPhaseMarker(phaseEvent.phase);
        phaseEvent.events.forEach(entry => {
            mapLogEntryToAnimationEvents(entry, phaseEvent.phase, createEvent).forEach(evt => events.push(evt));
        });
    });

    // Add damage-based shake FX to emphasize HP drops
    Object.entries(frame.hpDelta).forEach(([entityId, delta]) => {
        if (delta > opts.damageShakeThreshold) {
            events.push(
                createEvent('shake', 'resolution', entityId, undefined, {
                    hpLost: delta
                })
            );
        }
    });

    // Ensure we always have at least one event per frame (idle fallback)
    if (events.length === 0) {
        events.push(
            createEvent('idle', 'prep', undefined, undefined, {
                reason: 'no_events'
            })
        );
    }

    return {
        turn: frame.turn,
        events
    };
}

export function mapTimelineToAnimationScripts(
    frames: CombatTimelineFrame[],
    options?: MapFrameToAnimationsOptions
): CombatAnimationScript[] {
    return frames.map(frame => mapFrameToAnimations(frame, options));
}

type CreateEventFn = (
    type: CombatAnimationEventType,
    phase: CombatPhaseEvent['phase'],
    actorId?: string,
    targetId?: string,
    metadata?: CombatAnimationEvent['metadata'],
    durationOverride?: number
) => CombatAnimationEvent;

function mapLogEntryToAnimationEvents(
    entry: CombatLogEntry,
    phase: CombatPhaseEvent['phase'],
    createEvent: CreateEventFn
): CombatAnimationEvent[] {
    switch (entry.type) {
        case 'attack': {
            const isMiss = entry.payload?.result === 'miss';
            const type: CombatAnimationEventType = isMiss ? 'miss' : 'attack';
            const metadata = {
                damage: Number(entry.payload?.damage ?? 0),
                hpRemaining: Number(entry.payload?.hpRemaining ?? 0),
                result: String(entry.payload?.result ?? 'hit')
            };
            return [createEvent(type, phase, entry.actorId, entry.targetId, metadata)];
        }
        case 'heal':
        case 'hot': {
            const amount = Number(entry.payload?.amount ?? 0);
            const source = entry.payload?.source ? String(entry.payload.source) : entry.type;
            return [createEvent('heal', phase, entry.actorId, entry.targetId, { amount, source })];
        }
        case 'dot': {
            return [
                createEvent('status', phase, entry.actorId, entry.targetId, {
                    effect: 'dot',
                    amount: Number(entry.payload?.amount ?? 0)
                })
            ];
        }
        case 'buff':
        case 'debuff':
        case 'stun':
        case 'status': {
            return [
                createEvent('status', phase, entry.actorId, entry.targetId, {
                    effect: entry.type,
                    stat: entry.payload?.stat ? String(entry.payload.stat) : '',
                    spell: entry.payload?.spell ? String(entry.payload.spell) : '',
                    result: entry.payload?.effect !== undefined ? String(entry.payload.effect) : ''
                })
            ];
        }
        case 'initiative': {
            return [
                createEvent('status', phase, entry.actorId, entry.targetId, {
                    initiative: entry.message
                })
            ];
        }
        case 'death': {
            return [createEvent('death', phase, entry.actorId, entry.targetId)];
        }
        case 'info': {
            if (entry.payload?.crit) {
                return [createEvent('crit', phase, entry.actorId, entry.targetId)];
            }
            if (entry.payload?.shieldAbsorb) {
                return [
                    createEvent('shield', phase, entry.actorId, entry.targetId, {
                        amount: Number(entry.payload.shieldAbsorb)
                    })
                ];
            }
            if (entry.payload?.phase) {
                return [
                    createEvent('status', phase, entry.actorId, entry.targetId, {
                        phaseMarker: entry.payload.phase
                    })
                ];
            }
            return [];
        }
        default:
            return [];
    }
}
