/**
 * R-241 B3/B4 (quest-skill-check-column.INV-1 / INV-2).
 *
 * B3 — Director (2026-10-21): «quando clicco lo skill check nn parte
 *  l'animazione della pallina». Root cause: the board click called
 *  `skipToResult()` unconditionally — the verdict landed instantly; the
 *  engine's own `#launch` listener is dead (`#launch` is not in the V6
 *  markup). Fix: a board click is PROGRESS — `throw()` while the engine is
 *  not spinning (idle/armed/reveal), `skipToResult()` only mid-spin.
 *
 * B4 — Director: «quando da l'esito le "luci" si fermano, voglio che solo
 *  quelle continuino a girare lentamente». Root cause:
 *  `[data-astro-idle="parked"] * { animation-play-state: paused }` froze the
 *  `.rays` loop too. Fix: `.rays` re-runs under `parked` at the configured
 *  slower duration (`questWindow.skillCheck.parkedRaysDurationMs`).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { applyChoice, createRun, type ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import type { QuestCheckBridge } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

const { astroThrow, astroSkip } = vi.hoisted(() => ({ astroThrow: vi.fn(), astroSkip: vi.fn() }));

/* jsdom has no canvas; the stub exposes the imperative handle and a live
 * `data-suite` state channel — `throw()` flips it to `the-spin`, exactly
 * what the real engine writes on the same DOM node. */
vi.mock('@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit', () => ({
  DestinyAstrolabeV62Standalone: React.forwardRef(function AstroStub(
    _props: Record<string, unknown>,
    ref: React.Ref<unknown>,
  ) {
    const [state, setState] = React.useState('idle');
    React.useImperativeHandle(ref, () => ({
      throw: () => {
        astroThrow();
        setState('the-spin');
      },
      skipToResult: astroSkip,
      roll: vi.fn(),
      redrawOnce: vi.fn(),
    }));
    return <div data-suite data-state={state} />;
  }),
}));

import { QuestSkillCheckColumn } from '@/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn';

const bridgeFor = (check: ResolvedCheck): QuestCheckBridge => ({
  beatId: `beat-${check.checkSeq}`,
  check,
  mode: 'win',
  autoThrow: false,
  handle: { current: null },
  onResolved: vi.fn(),
  onDismiss: vi.fn(),
});

const runFor = (seed: number) => {
  const run = createRun(GOBLIN_PRESETS[0].id, seed, 'goblin');
  applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
  return run;
};

describe('QuestSkillCheckColumn — board click throws the ball (R-241)', () => {
  // INV:quest-skill-check-column.INV-1 — a board click while the engine is
  // not spinning calls `throw()`; only a click during `the-spin` /
  // `magnetic-snap` may call `skipToResult()`.
  it('first board click throws; a click during the spin skips to the verdict', () => {
    const run = runFor(7);
    const check = run.checkQueue[0]!;
    render(<QuestSkillCheckColumn bridge={bridgeFor(check)} run={run} />);
    const board = screen.getByTestId('quest-check-board');

    astroThrow.mockClear();
    astroSkip.mockClear();
    fireEvent.click(board);
    expect(astroThrow).toHaveBeenCalledTimes(1);
    expect(astroSkip).not.toHaveBeenCalled();

    fireEvent.click(board);
    expect(astroThrow).toHaveBeenCalledTimes(1);
    expect(astroSkip).toHaveBeenCalledTimes(1);
  });

  // INV:quest-skill-check-column.INV-1 — the imperative channel the window
  // drives exposes the same throw-then-skip policy as `progress()`.
  it('publishes progress() on the bridge handle with the same policy', () => {
    const run = runFor(19);
    const check = run.checkQueue[0]!;
    const bridge = bridgeFor(check);
    render(<QuestSkillCheckColumn bridge={bridge} run={run} />);

    astroThrow.mockClear();
    astroSkip.mockClear();
    bridge.handle.current!.progress();
    expect(astroThrow).toHaveBeenCalledTimes(1);
    expect(astroSkip).not.toHaveBeenCalled();

    bridge.handle.current!.progress();
    expect(astroSkip).toHaveBeenCalledTimes(1);
  });
});

describe('QuestSkillCheckColumn — parked lights keep turning (R-241)', () => {
  // INV:quest-skill-check-column.INV-2 — under `data-astro-idle="parked"`
  // the ambient `.rays` (the astrolabe's lights) keep `animation-play-state:
  // running` at the slowed configured duration; everything else stays parked.
  it('keeps .rays running at the slowed configured duration while parked', () => {
    const run = runFor(31);
    const check = run.checkQueue[0]!;
    const { container } = render(<QuestSkillCheckColumn bridge={bridgeFor(check)} run={run} />);
    const css = Array.from(container.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    const expectedMs = DEFAULT_GAME_FRAME_CONFIG.questWindow.skillCheck.parkedRaysDurationMs;
    expect(css).toMatch(/\[data-astro-idle="parked"\]\s+\.rays\s*\{[^}]*animation-play-state:\s*running/s);
    expect(css).toContain(`animation-duration: ${expectedMs}ms`);
  });
});
