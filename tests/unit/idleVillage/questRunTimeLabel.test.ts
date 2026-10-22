/**
 * PLAN-071 T-A2 (R-239) — the quest window's time bar speaks player-facing.
 *
 * Video audit: at `pieno-in-attesa` (bar full, run still waiting on orders)
 * the label read «110/110 TICKS» — saturated, ambiguous ("is it done?"),
 * and engine jargon. Contract: the bar shows days while marching (the
 * estimate is marked `~` since `durationTicks` grows on extra nodes), a
 * named awaiting state at saturation, and the resolved outcome at the end.
 */
import { describe, it, expect } from 'vitest';
import { questRunTimeLabel } from '@/ui/idleVillage/questS1Lab/questTickCounter';
import type { QuestHaloProgress } from '@/ui/idleVillage/questS1Lab/questSchedule';

const halo = (elapsed: number, duration: number, status: QuestHaloProgress['status']): QuestHaloProgress => ({
  elapsedTicks: elapsed,
  durationTicks: duration,
  fraction: Math.min(1, elapsed / Math.max(1, duration)),
  status,
});

describe('questRunTimeLabel (R-239)', () => {
  // INV:R-239-time-bar-label — while filling the bar shows days, not ticks.
  it('renders marching progress in days with an estimate marker', () => {
    const l = questRunTimeLabel(halo(30, 110, 'filling'), { ended: false }, 60);
    expect(l.key).toBe('gameFrame.questWindow.dayEstimate');
    expect(l.params).toEqual({ day: 1, total: 2 });
  });

  // INV:R-239-time-bar-label — a saturated bar on a live run is the awaiting
  // state, never an ambiguous «110/110».
  it('names the saturated state instead of painting elapsed/total', () => {
    const l = questRunTimeLabel(halo(110, 110, 'pieno-in-attesa'), { ended: false }, 60);
    expect(l.key).toBe('gameFrame.questWindow.awaiting');
    expect(l.params).toBeUndefined();
  });

  // INV:R-239-time-bar-label — the resolved outcome wins over everything.
  it('reports the outcome once the run has ended', () => {
    expect(questRunTimeLabel(halo(200, 110, 'concluso'), { ended: true, outcome: 'success' }, 60).key).toBe(
      'gameFrame.questWindow.returned',
    );
    expect(questRunTimeLabel(halo(200, 110, 'concluso'), { ended: true, outcome: 'wipe' }, 60).key).toBe(
      'gameFrame.questWindow.noneReturned',
    );
  });
});
