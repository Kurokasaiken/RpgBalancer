/**
 * PLAN-067 T-C2 (R-234, EXP = A) — the defeat report. Before: a see-through plaque (the text behind
 * showed), the title twice, a violet tombstone. Now: an opaque plaque, one headline, one tombstone per
 * fallen resident (name, day), and the lost bag items as ember tiles.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { QuestRewardPopup } from '@/ui/idleVillage/components/gameFrame/QuestRewardPopup';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { createRun } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { lostReportModel } from '@/ui/idleVillage/components/gameFrame/expeditionLost';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => (o ? `${k}|${Object.values(o).join(',')}` : k) }),
}));

const wiped = () => {
  const run = createRun(GOBLIN_PRESETS[0].id, 7, 'goblin');
  Object.assign(run, { outcome: 'wipe', ended: true });
  run.party[1].dead = true;
  run.party[2].dead = true;
  return run;
};

describe('lostReportModel (R-234, T-C2)', () => {
  // INV:R-234-expedition-lost-tombs — one tombstone per fallen resident, and no tombstone when nobody died.
  it('builds one tombstone per fallen member, and none without a death', () => {
    const run = wiped();
    const m = lostReportModel(run);
    expect(m.tombs).toHaveLength(2);
    expect(m.tombs[0]).toEqual(expect.objectContaining({ name: run.party[1].name }));
    const alive = createRun(GOBLIN_PRESETS[0].id, 7, 'goblin');
    Object.assign(alive, { outcome: 'wipe', ended: true });
    expect(lostReportModel(alive).tombs).toEqual([]);
  });
});

describe('defeat report (R-234, T-C2)', () => {
  // INV:R-234-expedition-lost-opaque — the plaque is opaque (no see-through), one headline, no violet.
  it('paints an opaque plaque with a single headline and no violet', () => {
    vi.useFakeTimers();
    const run = wiped();
    const { container } = render(
      <Tooltip.Provider>
        <QuestRewardPopup run={run} scenario={GOBLIN_SCENARIO} widthPx={400} stageMs={1} onClose={() => {}} />
      </Tooltip.Provider>,
    );
    const plaque = screen.getByTestId('quest-reward-popup');
    expect(getComputedStyle(plaque).backgroundColor).not.toMatch(/rgba\(.*,\s*0?\.\d+\)$/);
    const headings = container.querySelectorAll('h2');
    expect(headings).toHaveLength(1);
    expect(container.innerHTML).not.toMatch(/6d3fb0|5a3a8f|585a9e/);
    vi.useRealTimers();
  });
});
