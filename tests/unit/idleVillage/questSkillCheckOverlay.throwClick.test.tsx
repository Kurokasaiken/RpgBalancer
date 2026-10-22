/**
 * R-241 B3 (quest-skill-check-overlay.INV-1) — same throw-then-skip policy
 * on the floating overlay surface: the board click must throw the ball
 * before it may skip the spin.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { applyChoice, createRun, type ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import type { QuestCheckBridge } from '@/ui/idleVillage/questS1Lab/questRunStore';

const { astroThrow, astroSkip } = vi.hoisted(() => ({ astroThrow: vi.fn(), astroSkip: vi.fn() }));

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

import { QuestSkillCheckOverlay } from '@/ui/idleVillage/components/gameFrame/QuestSkillCheckOverlay';

const bridgeFor = (check: ResolvedCheck): QuestCheckBridge => ({
  beatId: `beat-${check.checkSeq}`,
  check,
  mode: 'win',
  autoThrow: false,
  handle: { current: null },
  onResolved: vi.fn(),
  onDismiss: vi.fn(),
});

describe('QuestSkillCheckOverlay — board click throws the ball (R-241)', () => {
  // INV:quest-skill-check-overlay.INV-1 — a board click while the engine is
  // not spinning calls `throw()`; only mid-spin does a click skip.
  it('first board click throws; a click during the spin skips to the verdict', () => {
    const run = createRun(GOBLIN_PRESETS[0].id, 11, 'goblin');
    applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
    const check = run.checkQueue[0]!;
    render(<QuestSkillCheckOverlay bridge={bridgeFor(check)} run={run} />);
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
});
