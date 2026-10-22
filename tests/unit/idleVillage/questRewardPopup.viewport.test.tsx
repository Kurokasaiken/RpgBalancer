/**
 * PLAN-071 T-A1 (R-239) — the end-of-run report stays inside the viewport.
 *
 * The video audit (Director, 2026-10-21) caught the report growing past the
 * top screen edge once the staged reveal completed (TITLES + ECHOES): the
 * title row and the close button left the visible area. Root cause: the
 * plaque is anchored `50%/50%` centred and had no height cap nor internal
 * scroll, so the longest reveal state overflowed the viewport on both sides.
 *
 * Contract: the plaque's `maxHeight` never exceeds `viewportH/zoom −
 * 2·edgeInsetPx` (chrome units), the title row is pinned (`flexShrink: 0`),
 * and the reveal body is the scrollable part (`overflowY: auto`,
 * `minHeight: 0`) — the close affordance stays reachable at any reveal stage,
 * at any window size and any HUD zoom factor.
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { applyChoice, availableOptions, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { QuestRewardPopup } from '@/ui/idleVillage/components/gameFrame/QuestRewardPopup';
import { getHudZoomFactor, setHudZoomFactor } from '@/ui/idleVillage/components/gameFrame/hudScale';

const EDGE_INSET = 12;

const endedRun = (seed: number): QuestRunState => {
  const run = createRun(GOBLIN_PRESETS[0].id, seed, 'goblin');
  for (let step = 0; step < 80 && !run.ended; step += 1) {
    const options = availableOptions(run).filter((o) => !o.disabled);
    if (!options.length) break;
    applyChoice(run, options[0].id);
  }
  return run;
};

const setInnerHeight = (h: number) => {
  Object.defineProperty(window, 'innerHeight', { value: h, configurable: true, writable: true });
};

/** Styles read off the rendered plaque + body. */
const readLayout = () => {
  const plaque = screen.getByTestId('quest-reward-popup') as HTMLElement;
  const body = plaque.querySelector('[data-reward-body]') as HTMLElement;
  const titleRow = plaque.querySelector('h2')!.closest('div') as HTMLElement;
  return { plaque, body, titleRow };
};

describe('QuestRewardPopup — viewport containment (R-239)', () => {
  afterEach(() => {
    setHudZoomFactor(1);
    setInnerHeight(768);
  });

  // INV:R-239-reward-viewport — the plaque is height-capped to the viewport
  // (chrome units: innerHeight / hud zoom − 2·edgeInset) so the fully
  // revealed report can never leave the screen; the reveal body scrolls
  // internally and the title row stays pinned.
  it('caps the plaque at viewport−2·edgeInset and scrolls the reveal body', () => {
    setHudZoomFactor(1);
    setInnerHeight(500);
    render(
      <Tooltip.Provider>
        <QuestRewardPopup run={endedRun(7)} scenario={GOBLIN_SCENARIO} widthPx={400} stageMs={1} edgeInsetPx={EDGE_INSET} onClose={() => {}} />
      </Tooltip.Provider>,
    );
    const { plaque, body, titleRow } = readLayout();
    const cap = 500 - EDGE_INSET * 2;
    expect(plaque.style.maxHeight).toBe(`${cap}px`);
    expect(body.style.overflowY).toBe('auto');
    expect(body.style.minHeight).toBe('0');
    expect(titleRow.style.flexShrink).toBe('0');
  });

  // INV:R-239-reward-viewport — the cap is in CHROME units: under css zoom
  // the layout viewport the plaque sees is innerHeight/zoom.
  it('converts the cap into chrome units under hud zoom', () => {
    setHudZoomFactor(2);
    setInnerHeight(1000);
    render(
      <Tooltip.Provider>
        <QuestRewardPopup run={endedRun(11)} scenario={GOBLIN_SCENARIO} widthPx={400} stageMs={1} edgeInsetPx={EDGE_INSET} onClose={() => {}} />
      </Tooltip.Provider>,
    );
    const { plaque } = readLayout();
    expect(plaque.style.maxHeight).toBe(`${1000 / 2 - EDGE_INSET * 2}px`);
  });

  // INV:R-239-reward-viewport — the cap is live: a resized window re-caps
  // the plaque while the reveal is still running.
  it('re-caps on viewport resize', () => {
    setHudZoomFactor(1);
    setInnerHeight(900);
    render(
      <Tooltip.Provider>
        <QuestRewardPopup run={endedRun(13)} scenario={GOBLIN_SCENARIO} widthPx={400} stageMs={1} edgeInsetPx={EDGE_INSET} onClose={() => {}} />
      </Tooltip.Provider>,
    );
    expect(readLayout().plaque.style.maxHeight).toBe(`${900 - EDGE_INSET * 2}px`);
    act(() => {
      setInnerHeight(400);
      window.dispatchEvent(new Event('resize'));
    });
    expect(readLayout().plaque.style.maxHeight).toBe(`${400 - EDGE_INSET * 2}px`);
  });

  // INV:R-239-reward-viewport — the cap survives the FULL reveal: title and
  // close button never leave the screen because the plaque height is capped
  // before the last section lands.
  it('keeps the cap after the reveal completes', () => {
    setHudZoomFactor(1);
    setInnerHeight(500);
    vi.useFakeTimers();
    try {
      render(
        <Tooltip.Provider>
          <QuestRewardPopup run={endedRun(17)} scenario={GOBLIN_SCENARIO} widthPx={400} stageMs={1} edgeInsetPx={EDGE_INSET} onClose={() => {}} />
        </Tooltip.Provider>,
      );
      const { plaque, body } = readLayout();
      for (let i = 0; i < 14; i += 1) {
        act(() => {
          fireEvent.click(body);
          vi.advanceTimersByTime(50);
        });
      }
      expect(plaque.querySelectorAll('[data-epilogue-section]').length).toBeGreaterThan(0);
      expect(plaque.style.maxHeight).toBe(`${500 - EDGE_INSET * 2}px`);
      expect(screen.getByTestId('quest-reward-collect')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('sanity: hud zoom factor is settable in tests', () => {
    setHudZoomFactor(1.5);
    expect(getHudZoomFactor()).toBe(1.5);
  });
});
