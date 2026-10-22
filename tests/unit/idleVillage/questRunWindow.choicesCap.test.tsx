/**
 * PLAN-071 T-A5 (R-239) — the choice fold never cuts a row in half.
 *
 * Video audit (Director, 2026-10-21): at rest, the choice list's fixed
 * `choicesMaxHeightPx` cap clipped the row straddling the fold — a
 * half-visible row. Contract: the cap is rounded DOWN to a multiple of the
 * measured row pitch, and the `frontierLocked` strip is pinned above the
 * scrollable (it is not a row — inside it would break the multiple math).
 */
import React from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';

const PRESET = GOBLIN_PRESETS[0].id;
const ROW_PX = 36;
const ROW_SELECTOR = '[data-testid="quest-window-choice"], [data-testid="quest-window-close-report"]';

/* jsdom has no layout — emulate uniform 36px rows: `offsetTop` = row index
 * × pitch among rows sharing the choices container; `offsetHeight` = pitch. */
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get(this: HTMLElement) {
      if (!this.matches?.(ROW_SELECTOR)) return 0;
      const rows = [...(this.parentElement?.querySelectorAll<HTMLElement>(ROW_SELECTOR) ?? [])];
      const idx = rows.indexOf(this);
      return idx >= 0 ? idx * ROW_PX : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.matches?.(ROW_SELECTOR) ? ROW_PX : 0;
    },
  });
});
afterAll(() => {
  delete (HTMLElement.prototype as Record<string, unknown>).offsetTop;
  delete (HTMLElement.prototype as Record<string, unknown>).offsetHeight;
});

const renderWindow = (run: QuestRunState, nowTick?: number) =>
  render(
    <Tooltip.Provider>
      <QuestRunWindow
        run={run}
        phases={[emptyPhase(0)]}
        beats={GOBLIN_SCENARIO.beats}
        queuedBeats={[]}
        beatTiming={{ sceneMs: 60000, checkMs: 60000, harmMs: 60000, endMs: 60000, recapMs: 60000 }}
        title={GOBLIN_SCENARIO.title}
        flavour={GOBLIN_SCENARIO.flavour}
        artFor={() => undefined}
        time={{ progress: 0, label: 'Giorno 1 di 2' }}
        onChoose={() => undefined}
        armedFlags={new Set()}
        onToggleArmedFlag={() => undefined}
        onClose={vi.fn()}
        anchor={{ left: 0, top: 0 }}
        widthPx={640}
        theaterAspect={2.9}
        tooltipLines={6}
        nowTick={nowTick}
      />
    </Tooltip.Provider>,
  );

describe('QuestRunWindow — choice fold lands on a row boundary (R-239)', () => {
  // INV:R-239-choices-fold — the scrollable cap is a whole multiple of the
  // row pitch (36 here): floor(190/36)·36 = 180, never the raw 190 that cut
  // the 6th row in half.
  it('caps the choices list to a multiple of the measured row pitch', () => {
    const run = createRun(PRESET, 42, 'goblin');
    const { container } = renderWindow(run);
    const list = container.querySelector('[data-hud-choices]') as HTMLElement;
    expect(list).toBeTruthy();
    const cap = parseFloat(list.style.maxHeight);
    const configMax = DEFAULT_GAME_FRAME_CONFIG.questWindow.choicesMaxHeightPx;
    expect(cap).toBe(Math.floor(configMax / ROW_PX) * ROW_PX);
    expect(cap % ROW_PX).toBe(0);
    expect(cap).toBeLessThan(configMax);
  });

  // INV:R-239-choices-fold — the frontier-locked strip is pinned ABOVE the
  // scrollable list, not a row inside it.
  it('pins the locked strip outside the scrollable rows', () => {
    const run = createRun(PRESET, 42, 'goblin');
    run.frontier = { status: 'waiting', startedAt: 0, readyAt: 10 };
    const { container } = renderWindow(run, 0);
    const strip = container.querySelector('[data-testid="quest-window-locked"]');
    const list = container.querySelector('[data-hud-choices]');
    expect(strip).toBeTruthy();
    expect(list?.contains(strip!)).toBe(false);
  });
});
