/**
 * PLAN-067 T-B1 (R-234, SC-1 = A) — the launch command. The frozen kit's `.da-tira` button fell into
 * the flow 170px under the dial (the global `.wanderlust-artifact { position: relative }` beat its
 * `position: absolute`) and the board hid it: «non ha il pulsante per lanciare». Host override, kit
 * untouched: the button is a transparent ≥32px target over the star, a breathing ring says «press
 * here», and an engraved label under the dial says what the gesture is — only while armed.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { applyChoice, createRun, type ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import type { QuestCheckBridge } from '@/ui/idleVillage/questS1Lab/questRunStore';

vi.mock('react-i18next', async (orig) => ({
  ...(await orig<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit', () => ({
  DestinyAstrolabeV62Standalone: React.forwardRef(function AstroStub(
    _props: Record<string, unknown>,
    ref: React.Ref<unknown>,
  ) {
    const [state, setState] = React.useState('idle');
    React.useImperativeHandle(ref, () => ({
      throw: () => {
        
        setState('the-spin');
      },
      skipToResult: vi.fn(),
      roll: vi.fn(),
      redrawOnce: vi.fn(),
    }));
    return <div data-suite data-state={state} />;
  }),
}));

import { QuestSkillCheckColumn } from '@/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn';
import '@testing-library/jest-dom';

const bridgeFor = (check: ResolvedCheck): QuestCheckBridge => ({
  beatId: `beat-${check.checkSeq}`,
  check,
  mode: 'win',
  autoThrow: false,
  handle: { current: null },
  onResolved: vi.fn(),
  onDismiss: vi.fn(),
});

const mount = () => {
  const run = createRun(GOBLIN_PRESETS[0].id, 7, 'goblin');
  applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
  return render(<QuestSkillCheckColumn bridge={bridgeFor(run.checkQueue[0]!)} run={run} />);
};

describe('QuestSkillCheckColumn — the launch command (R-234, SC-1 = A)', () => {
  // INV:R-234-launch-command — the kit button is pinned over the star as a ≥32px target (the
  // global relative-position rule loses), a breathing ring marks it (still under reduced motion),
  // and an engraved label under the dial appears only while the throw is armed.
  it('pins the kit button over the star and rings it, still under reduced motion', () => {
    const { container } = mount();
    const css = Array.from(container.querySelectorAll('style')).map((s) => s.textContent ?? '').join('\n');
    const rule = /\.da-tira\.wanderlust-artifact\s*\{([^}]*)\}/.exec(css);
    expect(rule, 'host rule for the kit button').toBeTruthy();
    expect(rule![1]).toMatch(/position:\s*absolute/);
    expect(rule![1]).toMatch(/width:\s*(9\d|1\d\d)px/);
    expect(css).toMatch(/\.da-tira::before[^}]*animation:\s*questThrowBreath/s);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[^}]*\.da-tira::before[^}]*animation:\s*none/s);
  }, 30000);

  it('shows the engraved label only while the kit button exists', async () => {
    mount();
    expect(screen.queryByTestId('quest-check-throw-label')).toBeNull();
    const board = screen.getByTestId('quest-check-board');
    const btn = document.createElement('button');
    btn.className = 'da-tira wanderlust-artifact';
    await act(async () => { board.appendChild(btn); });
    await waitFor(() => expect(screen.getByTestId('quest-check-throw-label')).toHaveTextContent('gameFrame.questWindow.checkOverlay.throwLabel'));
    await act(async () => { btn.remove(); });
    await waitFor(() => expect(screen.queryByTestId('quest-check-throw-label')).toBeNull());
  }, 30000);
});
