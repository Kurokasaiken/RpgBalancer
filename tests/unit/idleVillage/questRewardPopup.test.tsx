/**
 * R-199 pt.14 — `QuestRewardPopup`: the end-of-run report is a floating,
 * NON-modal plaque outside the quest window's DOM. Staged reveal (outcome
 * banner → settlement sections one at a time → close), hurried by click or
 * any key; Escape closes and restores focus.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { applyChoice, availableOptions, createRun, flee, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { buildQuestEpilogue } from '@/ui/idleVillage/quests/questEpilogue';
import { QuestRewardPopup } from '@/ui/idleVillage/components/gameFrame/QuestRewardPopup';

const PRESET = GOBLIN_PRESETS[0].id;
const STAGE_MS = 400;

/** A real ended run: drive greedy until the engine terminates (reward or
 *  wipe — either way the report has sections to reveal). */
const endedRun = (seed: number): QuestRunState => {
  const run = createRun(PRESET, seed, 'goblin');
  for (let step = 0; step < 80 && !run.ended; step += 1) {
    const options = availableOptions(run).filter((o) => !o.disabled);
    if (!options.length) break;
    applyChoice(run, options[0].id);
  }
  return run;
};

const renderPopup = (run: QuestRunState, onClose = vi.fn()) => {
  const utils = render(
    <Tooltip.Provider>
      <QuestRewardPopup run={run} scenario={GOBLIN_SCENARIO} widthPx={400} stageMs={STAGE_MS} onClose={onClose} />
    </Tooltip.Provider>,
  );
  return { ...utils, onClose };
};

const sections = () => document.querySelectorAll('[data-epilogue-section]');

describe('QuestRewardPopup — external, non-modal, staged (R-199 pt.8/14)', () => {
  // INV:CTR-game-009.INV-4
  it('is a floating dialog plaque, never a modal — no backdrop, no aria-modal', () => {
    renderPopup(endedRun(7));
    const popup = screen.getByTestId('quest-reward-popup');
    expect(popup).toHaveAttribute('role', 'dialog');
    expect(popup.getAttribute('aria-modal')).toBeNull();
    // It mounts as its own HUD panel — the quest window is not its ancestor.
    expect(popup.closest('[data-hud-panel="quest-reward"]')).not.toBeNull();
    expect(popup.closest('[data-testid="quest-window"]')).toBeNull();
  });

  // INV:CTR-game-009.INV-4
  it('reveals the report in stages: outcome first, sections one at a time, close last', () => {
    vi.useFakeTimers();
    try {
      const run = endedRun(7);
      const expected = buildQuestEpilogue(run, GOBLIN_SCENARIO).length;
      expect(expected).toBeGreaterThan(0);
      renderPopup(run);
      // Stage 0 — only the outcome banner; the epilogue is still closed.
      expect(sections()).toHaveLength(0);
      expect(screen.queryByTestId('quest-reward-collect')).toBeNull();
      for (let i = 1; i <= expected; i += 1) {
        act(() => vi.advanceTimersByTime(STAGE_MS));
        expect(sections()).toHaveLength(i);
      }
      // Final stage unlatches the collect CTA (PLAN-040 T-006: SkinButton
      // «cta», the rewards collect — not a bare close link).
      act(() => vi.advanceTimersByTime(STAGE_MS));
      const collect = screen.getByTestId('quest-reward-collect');
      expect(collect).toBeInTheDocument();
      expect(collect.dataset.skin).toBe('cta');
    } finally {
      vi.useRealTimers();
    }
  });

  // INV:CTR-game-009.INV-4
  it('a click hurries the reveal by one stage — same progressive skip as the theatre', () => {
    vi.useFakeTimers();
    try {
      const run = endedRun(7);
      if (buildQuestEpilogue(run, GOBLIN_SCENARIO).length < 1) return;
      renderPopup(run);
      fireEvent.click(document.querySelector('[data-reward-body]')!);
      expect(sections()).toHaveLength(1);
      fireEvent.keyDown(document.querySelector('[data-reward-body]')!, { key: 'x' });
      expect(sections()).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  // INV:CTR-game-009.INV-4
  it('moves focus into the plaque on open; Escape closes and restores it', () => {
    const anchor = document.createElement('button');
    document.body.appendChild(anchor);
    anchor.focus();
    const { onClose, unmount } = renderPopup(endedRun(7));
    const body = document.querySelector<HTMLElement>('[data-reward-body]')!;
    expect(document.activeElement).toBe(body);
    fireEvent.keyDown(body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.activeElement).toBe(anchor);
    document.body.removeChild(anchor);
  });

  // INV:CTR-game-009.INV-4
  it('the close row appears only once every stage has landed', () => {
    const run = endedRun(7);
    const count = buildQuestEpilogue(run, GOBLIN_SCENARIO).length;
    const { onClose } = renderPopup(run);
    const body = document.querySelector<HTMLElement>('[data-reward-body]')!;
    for (let i = 0; i <= count; i += 1) fireEvent.click(body);
    const close = screen.getByTestId('quest-reward-collect');
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  /* R-260: every dismissal lands on the same `onClose` — the page's single
   *  commit boundary. Collect, Escape and the title-row X all converge. */
  // INV:quest-reward-popup.INV-3
  it('every dismiss path funnels into the same onClose', () => {
    vi.useFakeTimers();
    try {
      const run = endedRun(7);
      const { onClose, unmount } = renderPopup(run);
      /* X on the title row — reachable before the reveal finishes. */
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalledTimes(1);
      unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  // INV:CTR-game-009.INV-4
  it('a fled run still reports — outcome banner reads fled, not reward', () => {
    const run = createRun(PRESET, 3, 'goblin');
    flee(run);
    expect(run.ended).toBe(true);
    renderPopup(run);
    expect(screen.getByTestId('quest-reward-popup')).toBeInTheDocument();
  });
});
