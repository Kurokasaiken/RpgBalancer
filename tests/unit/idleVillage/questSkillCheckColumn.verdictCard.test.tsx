/**
 * PLAN-067 T-A2 (R-234) — the column's external Verdict Card says each
 * consequence once. The engine's `outcomeText` is the toast/chronicle summary
 * (`harmLines` + authored lines); the card already carries the authored lines
 * (`authoredText`) and the harm on its visual channel (chips), so painting
 * `outcomeText` too doubled every authored line and put HP in prose
 * (quest UI guide §4). Audit F2: duplicate line on 7/7 cards.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { applyChoice, createRun, type ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import type { QuestCheckBridge } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { QuestSkillCheckColumn } from '@/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn';

/* jsdom has no canvas: the stub only lets the test paint the verdict. */
vi.mock('@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit', () => ({
  DestinyAstrolabeV62Standalone: React.forwardRef(function AstroStub(
    props: { onResolve?: () => void },
    ref: React.Ref<unknown>,
  ) {
    React.useImperativeHandle(ref, () => ({ throw: vi.fn(), skipToResult: () => props.onResolve?.(), roll: vi.fn() }));
    return <button type="button" data-testid="astro-resolve" onClick={() => props.onResolve?.()} />;
  }),
}));

const bridgeFor = (check: ResolvedCheck): QuestCheckBridge => ({
  beatId: 'beat-1',
  check,
  mode: 'fail_wound',
  autoThrow: false,
  handle: { current: null },
  onResolved: vi.fn(),
  onDismiss: vi.fn(),
});

describe('QuestSkillCheckColumn — verdict card', () => {
  // INV:R-234-verdict-card-once — the verdict card shows each authored
  // consequence line once and never states HP in prose: harm reaches it only as chips.
  it('paints each authored line once and keeps HP out of the prose (R-234)', () => {
    const run = createRun(GOBLIN_PRESETS[0].id, 42, 'goblin');
    applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
    const base = run.checkQueue[0];
    const check: ResolvedCheck = {
      ...base,
      harm: 'wound',
      flavor: 'The trail bends into the brambles.',
      harmLines: ['Bram takes 12 damage (83 → 71 HP).'],
      authoredText: 'You find a torn goblin rag.',
      outcomeText: 'Bram takes 12 damage (83 → 71 HP). You find a torn goblin rag.',
    };
    render(<QuestSkillCheckColumn bridge={bridgeFor(check)} run={run} />);
    fireEvent.click(screen.getByTestId('astro-resolve'));

    const card = screen.getByTestId('quest-verdict-card');
    const text = card.textContent ?? '';
    expect(text.split('You find a torn goblin rag.')).toHaveLength(2);
    expect(text).not.toMatch(/\bHP\b/);
    expect(text).toContain('The trail bends into the brambles.');
  });
});
