/**
 * R-259 (quest-skill-check-column): post-verdict auto-advance.
 *
 * Director (2026-10-22): «dopo uno skill check se entro un secondo il
 * giocatore nn ha cliccato nulla si procede in automatico lo stesso cm se
 * avesse cliccato». `questWindow.skillCheck.verdictAutoDismissMs = 1000` —
 * once the verdict is painted the player gets the arm delay + 1s of click
 * window, then the held beat settles exactly as a manual dismiss
 * (`bridge.onDismiss(beatId)` — same code path, same effect).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { applyChoice, createRun, type ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import type { QuestCheckBridge } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

/* jsdom has no canvas; the stub exposes the imperative handle and resolves
 * the verdict when `skipToResult` lands — the real engine calls `onResolve`
 * on the same surface. */
vi.mock('@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit', () => ({
  DestinyAstrolabeV62Standalone: React.forwardRef(function AstroStub(
    props: { onResolve?: () => void },
    ref: React.Ref<unknown>,
  ) {
    const [state, setState] = React.useState('idle');
    React.useImperativeHandle(ref, () => ({
      throw: () => setState('the-spin'),
      skipToResult: () => {
        setState('resolution');
        props.onResolve?.();
      },
      roll: vi.fn(),
      redrawOnce: vi.fn(),
    }));
    return <div data-suite data-state={state} />;
  }),
}));

import { QuestSkillCheckColumn } from '@/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn';

const CFG = DEFAULT_GAME_FRAME_CONFIG.questWindow.skillCheck;

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

describe('QuestSkillCheckColumn — auto-advance after the verdict (R-259)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  // INV:R-259-auto-dismiss — the config gives the player ~1s of click
  // window after the verdict is dismissible.
  it('the configured click window is one second', () => {
    expect(CFG.verdictAutoDismissMs).toBe(1000);
  });

  // INV:R-259-auto-dismiss — verdict painted + no input → the held beat
  // settles through the same `onDismiss` a click would fire.
  it('settles the held beat after armDelay + verdictAutoDismissMs with no input', () => {
    const run = runFor(11);
    const check = run.checkQueue[0]!;
    const bridge = bridgeFor(check);
    render(<QuestSkillCheckColumn bridge={bridge} run={run} />);
    const board = screen.getByTestId('quest-check-board');

    fireEvent.click(board); // throw
    fireEvent.click(board); // skip → stub resolves
    const total = CFG.dismissArmDelayMs + CFG.verdictAutoDismissMs;
    act(() => vi.advanceTimersByTime(total - 1));
    expect(bridge.onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(bridge.onDismiss).toHaveBeenCalledTimes(1);
    expect(bridge.onDismiss).toHaveBeenCalledWith(bridge.beatId);
  });
});
