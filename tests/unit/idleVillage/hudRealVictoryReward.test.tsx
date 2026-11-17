/**
 * R-348 — `HudRealVictoryReward`: the signed pergamena end-of-run report on
 * /game (ruling «approvato, battezza» 2026-11-16). Baptized frame + DOM zones
 * on painted affordances; same behaviour contract as `QuestRewardPopup`:
 * staged reveal hurried by click/key, Escape closes, every close path
 * convoglia su `onClose` — the settlement commit boundary (R-260).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { applyChoice, availableOptions, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { HudRealVictoryReward } from '@/ui/idleVillage/hudReal/HudRealVictoryReward';

const PRESET = GOBLIN_PRESETS[0].id;
const STAGE_MS = 400;

/** A real ended run: drive greedy until the engine terminates. */
const endedRun = (seed: number): QuestRunState => {
  const run = createRun(PRESET, seed, 'goblin');
  for (let step = 0; step < 80 && !run.ended; step += 1) {
    const options = availableOptions(run).filter((o) => !o.disabled);
    if (!options.length) break;
    applyChoice(run, options[0].id);
  }
  return run;
};

const renderReward = (run: QuestRunState, onClose = vi.fn()) =>
  render(<HudRealVictoryReward run={run} scenario={GOBLIN_SCENARIO} stageMs={STAGE_MS} onClose={onClose} />);

/** Hurry the reveal to the last stage (CTA unlatched). */
const revealAll = () => {
  for (let i = 0; i < 4; i += 1) act(() => vi.advanceTimersByTime(STAGE_MS + 10));
};

describe('HudRealVictoryReward — baptized pergamena report (R-348)', () => {
  // INV:hudreal-victory-reward.INV-1
  it('mounts on the baptized frame with a dialog role', () => {
    renderReward(endedRun(7));
    const root = screen.getByTestId('hudreal-victory-reward');
    expect(root.querySelector('[role="dialog"]')).not.toBeNull();
    const frame = root.querySelector('img');
    expect(frame?.getAttribute('src')).toBe('/assets/ui/hud-real/victory/frame.webp');
    // INV:R-234-report-one-title — the report says its title once.
    const titles = screen.getAllByText('Expedition report');
    expect(titles).toHaveLength(1);
  });

  // INV:hudreal-victory-reward.INV-4
  it('reveals in stages: ribbon → crew → rewards → echoes → CTA', () => {
    vi.useFakeTimers();
    try {
      const run = endedRun(7);
      renderReward(run);
      // Stage 0 — outcome ribbon only; zones still closed.
      expect(screen.queryByTestId('hudreal-victory-crew')).toBeNull();
      expect(screen.queryByTestId('quest-reward-collect')).toBeNull();
      act(() => vi.advanceTimersByTime(STAGE_MS + 10));
      expect(screen.getByTestId('hudreal-victory-crew')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(STAGE_MS + 10));
      expect(screen.getByTestId('hudreal-victory-rewards')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(STAGE_MS + 10));
      expect(screen.getByTestId('hudreal-victory-echoes')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(STAGE_MS + 10));
      expect(screen.getByTestId('quest-reward-collect')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  // INV:hudreal-victory-reward.INV-3
  it('paints one crew row per party member with state and real data', () => {
    vi.useFakeTimers();
    try {
      const run = endedRun(7);
      renderReward(run);
      act(() => vi.advanceTimersByTime(STAGE_MS + 10));
      const crew = screen.getByTestId('hudreal-victory-crew');
      const rows = crew.querySelectorAll('[data-crew-state]');
      expect(rows.length).toBe(run.party.length);
      for (const m of run.party) {
        const row = crew.querySelector(`[data-testid="hudreal-crew-${m.id}"]`);
        expect(row).not.toBeNull();
        expect(row?.getAttribute('data-crew-state')).toBe(
          m.dead ? 'fallen' : m.wounded ? 'wounded' : 'returned',
        );
      }
    } finally {
      vi.useRealTimers();
    }
  });

  // INV:hudreal-victory-reward.INV-2
  it('every close path convoglia su onClose — CTA, Escape, X', () => {
    vi.useFakeTimers();
    try {
      const run = endedRun(7);
      const onClose = vi.fn();
      renderReward(run, onClose);
      revealAll();
      fireEvent.click(screen.getByTestId('quest-reward-collect'));
      expect(onClose).toHaveBeenCalledTimes(1);
      fireEvent.keyDown(screen.getByTestId('hudreal-victory-reward').querySelector('[role="dialog"]')!, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
      fireEvent.click(screen.getByLabelText('Close'));
      expect(onClose).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });
});
