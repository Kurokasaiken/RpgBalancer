import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useMilestoneEngine,
  type MilestoneEvent,
} from '@/ui/idleVillage/hooks/useMilestoneEngine';

const MILESTONES = [2000, 4000, 6000];

interface HookProps {
  elapsedMs: number;
  active: boolean;
  onMilestone: (event: MilestoneEvent) => void;
  milestones?: number[];
}

const setup = (initial: HookProps) =>
  renderHook(
    ({ elapsedMs, active, onMilestone, milestones = MILESTONES }: HookProps) =>
      useMilestoneEngine({ elapsedMs, milestones, active, onMilestone }),
    { initialProps: initial },
  );

describe('useMilestoneEngine', () => {
  it('does not fire before the first threshold', () => {
    const onMilestone = vi.fn();
    setup({ elapsedMs: 1999, active: true, onMilestone });
    expect(onMilestone).not.toHaveBeenCalled();
  });

  it('fires exactly on the threshold', () => {
    const onMilestone = vi.fn();
    setup({ elapsedMs: 2000, active: true, onMilestone });
    expect(onMilestone).toHaveBeenCalledTimes(1);
    expect(onMilestone.mock.calls[0][0]).toMatchObject({
      milestoneIndex: 0,
      thresholdMs: 2000,
    });
  });

  it('fires a milestone once and only once as time keeps advancing', () => {
    const onMilestone = vi.fn();
    const { rerender } = setup({ elapsedMs: 2000, active: true, onMilestone });
    expect(onMilestone).toHaveBeenCalledTimes(1);

    rerender({ elapsedMs: 2500, active: true, onMilestone });
    rerender({ elapsedMs: 3000, active: true, onMilestone });
    rerender({ elapsedMs: 3999, active: true, onMilestone });

    expect(onMilestone).toHaveBeenCalledTimes(1);
  });

  it('fires each milestone in turn across a full run', () => {
    const onMilestone = vi.fn();
    const { rerender } = setup({ elapsedMs: 0, active: true, onMilestone });

    rerender({ elapsedMs: 2000, active: true, onMilestone });
    rerender({ elapsedMs: 4000, active: true, onMilestone });
    rerender({ elapsedMs: 6000, active: true, onMilestone });

    expect(onMilestone.mock.calls.map(([event]) => event.milestoneIndex)).toEqual([0, 1, 2]);
  });

  it('fires every crossed milestone in order when time jumps at high clock speed', () => {
    const onMilestone = vi.fn();
    setup({ elapsedMs: 6000, active: true, onMilestone });

    expect(onMilestone).toHaveBeenCalledTimes(3);
    expect(onMilestone.mock.calls.map(([event]) => event.milestoneIndex)).toEqual([0, 1, 2]);
  });

  it('stays silent while the quest is not running', () => {
    const onMilestone = vi.fn();
    const { rerender } = setup({ elapsedMs: 0, active: false, onMilestone });
    rerender({ elapsedMs: 6000, active: false, onMilestone });
    expect(onMilestone).not.toHaveBeenCalled();
  });

  it('rearms when a new run starts, so the same thresholds fire again', () => {
    const onMilestone = vi.fn();
    const { rerender } = setup({ elapsedMs: 2000, active: true, onMilestone });
    expect(onMilestone).toHaveBeenCalledTimes(1);

    // Quest ends, everything resets, a second expedition sets out.
    rerender({ elapsedMs: 0, active: false, onMilestone });
    rerender({ elapsedMs: 2000, active: true, onMilestone });

    expect(onMilestone).toHaveBeenCalledTimes(2);
  });

  it('reports how many milestones have fired', () => {
    const onMilestone = vi.fn();
    const { result, rerender } = setup({ elapsedMs: 0, active: true, onMilestone });
    expect(result.current.firedCount).toBe(0);

    rerender({ elapsedMs: 4000, active: true, onMilestone });
    expect(result.current.firedCount).toBe(2);
  });

  it('does not re-fire when only the callback identity changes', () => {
    const calls: number[] = [];
    const { rerender } = setup({
      elapsedMs: 2000,
      active: true,
      onMilestone: (event) => calls.push(event.milestoneIndex),
    });
    expect(calls).toEqual([0]);

    // A fresh closure every render is the normal React case.
    rerender({
      elapsedMs: 2000,
      active: true,
      onMilestone: (event) => calls.push(event.milestoneIndex),
    });

    expect(calls).toEqual([0]);
  });

  it('fires nothing when a quest has no phases', () => {
    const onMilestone = vi.fn();
    setup({ elapsedMs: 9999, active: true, onMilestone, milestones: [] });
    expect(onMilestone).not.toHaveBeenCalled();
  });
});
