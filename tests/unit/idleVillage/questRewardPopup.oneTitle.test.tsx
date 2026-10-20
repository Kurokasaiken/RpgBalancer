/**
 * PLAN-067 T-A11 (R-234) — the end-of-run report says its title once. The
 * plaque's title row («EXPEDITION REPORT») and the epilogue's own section
 * label repeated the same words one under the other (audit F5 §7).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { applyChoice, availableOptions, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { QuestRewardPopup } from '@/ui/idleVillage/components/gameFrame/QuestRewardPopup';

const endedRun = (seed: number): QuestRunState => {
  const run = createRun(GOBLIN_PRESETS[0].id, seed, 'goblin');
  for (let step = 0; step < 80 && !run.ended; step += 1) {
    const options = availableOptions(run).filter((o) => !o.disabled);
    if (!options.length) break;
    applyChoice(run, options[0].id);
  }
  return run;
};

describe('QuestRewardPopup — one title (R-234)', () => {
  // INV:R-234-report-one-title — the report's title is painted once (the plaque's title row);
  // the epilogue inside it does not repeat it as a section label.
  it('paints the report title once, revealed in full', () => {
    vi.useFakeTimers();
    try {
      render(
        <Tooltip.Provider>
          <QuestRewardPopup run={endedRun(7)} scenario={GOBLIN_SCENARIO} widthPx={400} stageMs={1} onClose={() => {}} />
        </Tooltip.Provider>,
      );
      const popup = screen.getByTestId('quest-reward-popup');
      const body = popup.querySelector('[data-reward-body]')!;
      for (let i = 0; i < 12; i += 1) { fireEvent.click(body); vi.advanceTimersByTime(50); }
      expect(popup.querySelectorAll('[data-epilogue-section]').length).toBeGreaterThan(0);
      const title = popup.querySelector('h2')!.textContent!.trim();
      expect(title.length).toBeGreaterThan(0);
      const painted = [...popup.querySelectorAll('*')].filter(
        (n) => [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent!.trim() === title),
      );
      expect(painted).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
