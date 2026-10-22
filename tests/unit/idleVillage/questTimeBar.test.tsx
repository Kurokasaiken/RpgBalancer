/**
 * PLAN-067 T-B3 (R-234, QW-1 = B + I1) — the quest bar is REAL time on a scale that stretches.
 * It is never full before the run ends, never goes backwards, marks the overrun in ember, and the
 * phase seals carry no tick / green. (audit F4: «139/110 ticks · phase 5 of 7» — a full bar with
 * three phases to play.)
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { timeBarModel } from '@/ui/idleVillage/questS1Lab/questTickCounter';
import { TimeBar, PhaseTile } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';
import { applyChoice, createRun } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';

vi.mock('react-i18next', async (orig) => ({
  ...(await orig<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('timeBarModel (R-234, QW-1 = B)', () => {
  // INV:R-234-timebar-real-time — real elapsed over a stretching scale: never full before the end,
  // monotone while the scale only grows, ember from the declared estimate once it is passed.
  it('is never full before the run ends, and 1 when it ends', () => {
    expect(timeBarModel({ elapsedTicks: 110, durationTicks: 110 }, { ended: false }, 55).progress).toBeLessThan(1);
    expect(timeBarModel({ elapsedTicks: 500, durationTicks: 110 }, { ended: false }, 1).progress).toBeLessThan(1);
    expect(timeBarModel({ elapsedTicks: 139, durationTicks: 110 }, { ended: true }, 0).progress).toBe(1);
  });

  it('rises monotonically through an overrun while phases remain', () => {
    const at = (e: number) => timeBarModel({ elapsedTicks: e, durationTicks: 110 }, { ended: false }, 40).progress;
    const series = [20, 60, 90, 110, 130, 150].map(at);
    series.forEach((v, i) => { if (i) expect(v).toBeGreaterThanOrEqual(series[i - 1]); });
  });

  it('marks the overrun from the declared estimate, only once it is passed', () => {
    expect(timeBarModel({ elapsedTicks: 60, durationTicks: 110 }, { ended: false }, 40).overrunFrom).toBeUndefined();
    const m = timeBarModel({ elapsedTicks: 139, durationTicks: 110 }, { ended: false }, 40);
    expect(m.overrunFrom).toBeGreaterThan(0);
    expect(m.overrunFrom).toBeLessThan(1);
    expect(m.overrunFrom).toBeCloseTo(110 / (139 + 40), 5);
  });
});

describe('TimeBar (R-234, QW-1 = B)', () => {
  it('never moves backwards and shows the ember overrun and scaled ticks', () => {
    const cps = [1, 2, 3].map((b) => ({ beat: b, label: `p${b}`, fraction: b / 3, reached: false, current: false }));
    const { rerender } = render(<TimeBar progress={0.6} label="l" phase="p" checkpoints={cps} overrunFrom={0.5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
    expect(screen.getByTestId('quest-timebar-overrun')).toBeInTheDocument();
    rerender(<TimeBar progress={0.4} label="l" phase="p" checkpoints={cps} overrunFrom={0.5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
    const last = screen.getAllByTestId('quest-timebar-checkpoint')[2];
    expect(parseFloat(last.style.left)).toBeCloseTo(50, 0);
  });
});

describe('PhaseTile seal (R-234, I1)', () => {
  it('has no tick mark and no green on a clean phase', () => {
    const run = createRun(GOBLIN_PRESETS[0].id, 7, 'goblin');
    applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
    const phase = { beat: 0, choices: ['x'], verdicts: [], lines: [{ kind: 'NODE', text: 'l' }], lootGained: [], harms: [], itemsSpent: [] } as never;
    const { container } = render(
      <Tooltip.Provider><ol><PhaseTile phase={phase} name="Exploration" current={false} run={run} tooltipLines={2} /></ol></Tooltip.Provider>,
    );
    const html = container.innerHTML;
    expect(html).not.toContain('role-bodyguard');
    expect(html).not.toContain('skin-status-met');
    
  });
});
