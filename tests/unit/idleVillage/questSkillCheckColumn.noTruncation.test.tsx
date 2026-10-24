/**
 * R-270 / LAYOUT-truncation-skillcheck — Sentinel L2-truncation (run
 * sentinel-2026-10-23T0829, 4× exact-match): the check title «Move through
 * the shadows» was single-line truncated (`nowrap` + `ellipsis`) in the
 * column's title row. The title must wrap — the row grows, the text is
 * never cut.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { applyChoice, createRun, type ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import type { QuestCheckBridge } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { QuestSkillCheckColumn } from '@/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn';

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

describe('QuestSkillCheckColumn — check title never truncates (R-270)', () => {
  // INV:quest-skill-check-column.INV-3 — the title span wraps to multiple
  // lines instead of clipping with nowrap+ellipsis (Sentinel L2 defect
  // class: truncated user-facing text).
  it('the check title wraps — no nowrap, no ellipsis', () => {
    const run = createRun(GOBLIN_PRESETS[0].id, 42, 'goblin');
    applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
    const check = { ...run.checkQueue[0], title: 'Move through the shadows' };
    render(<QuestSkillCheckColumn bridge={bridgeFor(check)} run={run} />);
    const title = screen.getByText('Move through the shadows');
    expect(title.style.whiteSpace).not.toBe('nowrap');
    expect(title.style.textOverflow).not.toBe('ellipsis');
    expect(title.style.overflow).not.toBe('hidden');
  });
});
