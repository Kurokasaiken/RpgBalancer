import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CombatAvatar } from '../CombatAvatar';
import type { ActorAnimatorState } from '../../../balancing/hooks/useCombatAnimator';

describe('CombatAvatar', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('cycles through idle frames when sprite has animations', () => {
        render(<CombatAvatar spriteId="tank_obsidian_guard" state="idle" size={120} />);
        const img = screen.getByRole('img', { name: /obsidian guard/i });

        const firstSrc = img.getAttribute('src');
        expect(firstSrc).toContain('character_idle_0');

        act(() => {
            vi.advanceTimersByTime(200);
        });

        const secondSrc = img.getAttribute('src');
        expect(secondSrc).not.toBe(firstSrc);
    });

    it('resets frame index when pose changes via actorState', () => {
        const actorBase: Omit<ActorAnimatorState, 'pose'> = {
            actorId: 'tank',
            updatedAt: 0
        };

        const { rerender } = render(
            <CombatAvatar
                spriteId="tank_obsidian_guard"
                actorState={{ ...actorBase, pose: 'attack', updatedAt: 1 }}
                size={120}
            />
        );
        const img = screen.getByRole('img', { name: /obsidian guard/i });

        act(() => {
            vi.advanceTimersByTime(400);
        });
        const midAttack = img.getAttribute('src');
        expect(midAttack).toContain('character_run_3');

        rerender(
            <CombatAvatar
                spriteId="tank_obsidian_guard"
                actorState={{ ...actorBase, pose: 'hit', updatedAt: 2 }}
                size={120}
            />
        );

        const resetSrc = img.getAttribute('src');
        expect(resetSrc).toContain('character_run_3');
    });
});
