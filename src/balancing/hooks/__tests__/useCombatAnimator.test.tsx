import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import type { CombatTimelineFrame, CombatActorSnapshot, CombatTeamSnapshot } from '../../simulation/types';
import type { CombatLogEntry } from '../../../engine/combat/state';
import { useCombatAnimator } from '../useCombatAnimator';

const createActor = (overrides: Partial<CombatActorSnapshot> & { id: string; team: 'A' | 'B' }): CombatActorSnapshot => ({
    id: overrides.id,
    name: overrides.name ?? overrides.id,
    team: overrides.team,
    hp: overrides.hp ?? 100,
    maxHp: overrides.maxHp ?? 100,
    isAlive: overrides.isAlive ?? (overrides.hp ?? 100) > 0,
    shieldValue: overrides.shieldValue ?? 0,
    statusEffects: overrides.statusEffects ?? [],
    state: overrides.state ?? 'idle',
    spriteId: overrides.spriteId,
    spritePalette: overrides.spritePalette,
    tags: overrides.tags
});

const createTeamSnapshot = (teamId: 'A' | 'B', members: CombatActorSnapshot[]): CombatTeamSnapshot => ({
    teamId,
    members
});

const createLogEntry = (entry: Partial<CombatLogEntry> & { type: CombatLogEntry['type']; message?: string }): CombatLogEntry => ({
    turn: entry.turn ?? 1,
    type: entry.type,
    message: entry.message ?? '',
    actorId: entry.actorId,
    targetId: entry.targetId,
    payload: entry.payload
});

const attacker = createActor({ id: 'attacker', team: 'A' });
const defenderFull = createActor({ id: 'defender', team: 'B' });
const defenderInjured = createActor({ id: 'defender', team: 'B', hp: 70 });
const defenderHealed = createActor({ id: 'defender', team: 'B', hp: 90 });

const attackPhase: CombatLogEntry = createLogEntry({
    type: 'attack',
    actorId: 'attacker',
    targetId: 'defender',
    payload: {
        damage: 30,
        hpRemaining: 70,
        result: 'hit'
    }
});

const healPhase: CombatLogEntry = createLogEntry({
    type: 'heal',
    actorId: 'defender',
    targetId: 'defender',
    payload: {
        amount: 20,
        source: 'potion'
    }
});

const frames: CombatTimelineFrame[] = [
    {
        turn: 1,
        startSnapshot: [
            createTeamSnapshot('A', [attacker]),
            createTeamSnapshot('B', [defenderFull])
        ],
        endSnapshot: [
            createTeamSnapshot('A', [attacker]),
            createTeamSnapshot('B', [defenderInjured])
        ],
        hpDelta: {
            defender: 30
        },
        phases: [
            {
                phase: 'action',
                events: [attackPhase]
            }
        ]
    },
    {
        turn: 2,
        startSnapshot: [
            createTeamSnapshot('A', [attacker]),
            createTeamSnapshot('B', [defenderInjured])
        ],
        endSnapshot: [
            createTeamSnapshot('A', [attacker]),
            createTeamSnapshot('B', [defenderHealed])
        ],
        hpDelta: {
            defender: -20
        },
        phases: [
            {
                phase: 'resolution',
                events: [healPhase]
            }
        ]
    }
];

describe('useCombatAnimator', () => {
    let rafCallbacks: FrameRequestCallback[];
    let rafTime: number;

    beforeEach(() => {
        rafCallbacks = [];
        rafTime = 0;

        const requestAnimationFrameMock = (cb: FrameRequestCallback) => {
            rafCallbacks.push(cb);
            return rafCallbacks.length;
        };

        const cancelAnimationFrameMock = () => {
            rafCallbacks = [];
        };

        vi.stubGlobal('requestAnimationFrame', requestAnimationFrameMock);
        vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrameMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const flushRaf = (ms = 400) => {
        rafTime += ms;
        const pending = [...rafCallbacks];
        rafCallbacks = [];
        pending.forEach(cb => cb(rafTime));
    };

    const renderHarness = (frameIndex: number, isPlaying = true) => {
        const holder: {
            current: ReturnType<typeof useCombatAnimator> | null;
        } = { current: null };

        const Harness: React.FC<{ index: number; playing: boolean }> = ({ index, playing }) => {
            holder.current = useCombatAnimator({
                frames,
                frameIndex: index,
                isPlaying: playing,
                speedMs: 400
            });
            return null;
        };

        const utils = render(<Harness index={frameIndex} playing={isPlaying} />);
        return { holder, rerender: (nextIndex: number, playing = isPlaying) => utils.rerender(<Harness index={nextIndex} playing={playing} />) };
    };

    it('advances event cursor and spawns FX when playing', () => {
        const { holder } = renderHarness(0, true);

        expect(holder.current?.eventCursor).toBe(0);
        expect(holder.current?.activeFx.length).toBe(0);

        act(() => {
            flushRaf();
        });

        expect(holder.current?.eventCursor).toBeGreaterThan(0);
        expect(holder.current?.currentEvent?.type).toBe('attack');
        expect(holder.current?.activeFx.some(fx => fx.type === 'attack')).toBe(true);
    });

    it('resets cursor and FX when frame index changes', () => {
        const { holder, rerender } = renderHarness(0, true);

        act(() => {
            flushRaf();
        });

        expect(holder.current?.eventCursor).toBeGreaterThan(0);
        expect(holder.current?.activeFx.length).toBeGreaterThan(0);

        act(() => {
            rerender(1, false);
        });

        expect(holder.current?.eventCursor).toBe(0);
        expect(holder.current?.activeFx.length).toBe(0);
        expect(holder.current?.currentEvent).toBeNull();
    });
});
