/**
 * PLAN-067 T-C2 / T-C6 (R-234) — «who came back»: one niche per person with its state in words, and
 * the person's own tooltip (title, illness, character) instead of group lists.
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRun } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { QuestReturnedCrew } from '@/ui/idleVillage/components/gameFrame/QuestReturnedCrew';
import { QuestEpilogue } from '@/ui/idleVillage/components/gameFrame/QuestEpilogue';

const endedRun = () => {
  const run = createRun(GOBLIN_PRESETS[0].id, 7, 'goblin');
  Object.assign(run, { outcome: 'reward', ended: true });
  run.party[0].dead = false; run.party[0].wounded = false;
  run.party[1].wounded = true;
  run.party[2].dead = true;
  return run;
};

describe('QuestReturnedCrew (R-234)', () => {
  // INV:R-234-returned-crew — each person gets a niche whose state is written (returned / wounded /
  // fallen); the person's title lives in THEIR tooltip, and the group lists no longer repeat it.
  it('paints one niche per member with a written state and a per-person tooltip', () => {
    const run = endedRun();
    render(<QuestReturnedCrew run={run} scenario={GOBLIN_SCENARIO} />);
    const niches = screen.getAllByTestId(/^crew-niche-/);
    expect(niches).toHaveLength(run.party.length);
    expect(niches[0]).toHaveAttribute('data-crew-state', 'returned');
    expect(niches[1]).toHaveAttribute('data-crew-state', 'wounded');
    expect(niches[2]).toHaveAttribute('data-crew-state', 'fallen');
    niches.forEach((n) => expect(n.getAttribute('aria-label')).toMatch(/—\s*\S+/));
    fireEvent.focus(niches[0]);
    const tip = screen.getAllByTestId(`crew-tip-${run.party[0].id}`)[0];
    expect(tip.querySelector('[data-crew-tip-titles]')!.textContent).toContain('Goblin Exterminators');
  }, 30000);

  it('the group report no longer repeats per-person lines once the crew is shown', () => {
    const run = endedRun();
    render(<QuestEpilogue run={run} scenario={GOBLIN_SCENARIO} crewShown />);
    expect(document.querySelector('[data-epilogue-section="dead"]')).toBeNull();
    expect(document.querySelector('[data-epilogue-section="wounded"]')).toBeNull();
    expect(document.querySelector('[data-epilogue-section="titles"]')).toBeNull();
  }, 30000);
});
