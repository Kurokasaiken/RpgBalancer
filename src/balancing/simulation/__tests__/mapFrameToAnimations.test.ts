import { describe, it, expect } from 'vitest';
import type { CombatTimelineFrame, CombatPhaseEvent } from '../types';
import { mapFrameToAnimations, mapTimelineToAnimationScripts } from '../mapFrameToAnimations';
import type { CombatActorSnapshot, CombatTeamSnapshot } from '../types';
import type { CombatLogEntry } from '../../../engine/combat/state';

const baseActor = (overrides: Partial<CombatActorSnapshot>): CombatActorSnapshot => ({
    id: 'entity1',
    name: 'Entity 1',
    team: 'A',
    hp: 100,
    maxHp: 100,
    isAlive: true,
    shieldValue: 0,
    state: 'idle',
    statusEffects: [],
    ...overrides
});

const baseTeam = (members: CombatActorSnapshot[], teamId: 'A' | 'B'): CombatTeamSnapshot => ({
    teamId,
    members
});

const logEntry = (entry: Partial<CombatLogEntry>): CombatLogEntry => ({
    turn: 1,
    type: 'info',
    message: '',
    ...entry
});

describe('mapFrameToAnimations', () => {
    const defaultPhase = (phase: CombatPhaseEvent['phase'], events: CombatLogEntry[] = []) => ({
        phase,
        events
    });

    it('maps attack log entries to attack events with metadata', () => {
        const frame: CombatTimelineFrame = {
            turn: 1,
            startSnapshot: [
                baseTeam([baseActor({ id: 'attacker', team: 'A' })], 'A'),
                baseTeam([baseActor({ id: 'defender', team: 'B' })], 'B')
            ],
            endSnapshot: [
                baseTeam([baseActor({ id: 'attacker', team: 'A' })], 'A'),
                baseTeam([baseActor({ id: 'defender', team: 'B', hp: 70 })], 'B')
            ],
            hpDelta: { defender: 30 },
            phases: [
                defaultPhase('action', [
                    logEntry({
                        type: 'attack',
                        message: 'Attacker hits Defender',
                        actorId: 'attacker',
                        targetId: 'defender',
                        payload: {
                            damage: 30,
                            hpRemaining: 70,
                            result: 'hit',
                            phase: 'action'
                        }
                    })
                ])
            ]
        };

        const script = mapFrameToAnimations(frame);
        expect(script.turn).toBe(1);
        const attackEvent = script.events.find(evt => evt.type === 'attack');
        expect(attackEvent).toBeDefined();
        expect(attackEvent?.actorId).toBe('attacker');
        expect(attackEvent?.targetId).toBe('defender');
        expect(attackEvent?.metadata).toMatchObject({ damage: 30, hpRemaining: 70, result: 'hit' });
    });

    it('adds shake FX for large HP deltas and preserves phase markers', () => {
        const frame: CombatTimelineFrame = {
            turn: 2,
            startSnapshot: [
                baseTeam([baseActor({ id: 'entityA', team: 'A' })], 'A'),
                baseTeam([baseActor({ id: 'entityB', team: 'B' })], 'B')
            ],
            endSnapshot: [
                baseTeam([baseActor({ id: 'entityA', team: 'A' })], 'A'),
                baseTeam([baseActor({ id: 'entityB', team: 'B', hp: 20 })], 'B')
            ],
            hpDelta: { entityB: 80 },
            phases: [
                defaultPhase('prep', [
                    logEntry({
                        turn: 2,
                        type: 'info',
                        message: '--- Turn 2 ---',
                        payload: { phase: 'prep', event: 'turnStart' }
                    })
                ]),
                defaultPhase('action', []),
                defaultPhase('resolution', [])
            ]
        };

        const script = mapFrameToAnimations(frame, { damageShakeThreshold: 40 });
        const shakeEvent = script.events.find(evt => evt.type === 'shake');
        expect(shakeEvent).toBeDefined();
        expect(shakeEvent?.metadata).toMatchObject({ hpLost: 80 });

        const phaseMarker = script.events.find(evt => evt.metadata?.phaseMarker === 'prep');
        expect(phaseMarker).toBeDefined();
    });

    it('maps entire timeline to scripts preserving order', () => {
        const frames: CombatTimelineFrame[] = [
            {
                turn: 1,
                startSnapshot: [baseTeam([baseActor({ id: 'e1', team: 'A' })], 'A'), baseTeam([baseActor({ id: 'e2', team: 'B' })], 'B')],
                endSnapshot: [baseTeam([baseActor({ id: 'e1', team: 'A' })], 'A'), baseTeam([baseActor({ id: 'e2', team: 'B' })], 'B')],
                hpDelta: {},
                phases: [defaultPhase('prep', [])]
            },
            {
                turn: 2,
                startSnapshot: [baseTeam([baseActor({ id: 'e1', team: 'A' })], 'A'), baseTeam([baseActor({ id: 'e2', team: 'B' })], 'B')],
                endSnapshot: [baseTeam([baseActor({ id: 'e1', team: 'A' })], 'A'), baseTeam([baseActor({ id: 'e2', team: 'B' })], 'B')],
                hpDelta: {},
                phases: [defaultPhase('prep', [])]
            }
        ];

        const scripts = mapTimelineToAnimationScripts(frames);
        expect(scripts).toHaveLength(2);
        expect(scripts[0].turn).toBe(1);
        expect(scripts[1].turn).toBe(2);
    });
});
