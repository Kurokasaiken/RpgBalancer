/**
 * R-253 #1/#2 — the skill check board paints the REAL check data.
 *
 * Director (2026-10-22): «lo skill check prende i dati correttamente dalla
 * quest o no? io vedo sempre la stessa forma» + «non mostra l'icona della
 * stat relativa».
 * Root cause: the column passed `skills=[{stat: check.score, difficulty: 50}]`
 * — ONE skill → `skillAxes=[5]` → all five astrolabe axes on the same value →
 * identical regular star on every check, and `ResolvedCheck` carried no
 * `stats` for icons. Fix: `ResolvedCheck.stats` (authored tested stats) +
 * a display-only `axisProfile` (engine radii only — `skills` still owns the
 * landing-angle skill pick, verdict semantics untouched) + stat icons in the
 * title row.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { applyChoice, createRun, type ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import type { QuestCheckBridge } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { QuestSkillCheckColumn, checkAxisProfile } from '@/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn';

const astroSpy = vi.fn();

/* jsdom has no canvas: the stub captures the props the column hands the
 * astrolabe so the axisProfile contract is assertable. */
vi.mock('@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit', () => ({
  DestinyAstrolabeV62Standalone: React.forwardRef(function AstroStub(
    props: { axisProfile?: unknown; onResolve?: () => void },
    ref: React.Ref<unknown>,
  ) {
    astroSpy(props);
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

function runWithCheck(): { run: ReturnType<typeof createRun>; check: ResolvedCheck } {
  const run = createRun(GOBLIN_PRESETS[0].id, 42, 'goblin');
  applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
  return { run, check: run.checkQueue[0] };
}

describe('QuestSkillCheckColumn — real check data on the board (R-253)', () => {
  // INV:R-253-check-real-data — `resolveCheck` records the authored tested
  // stats on the ResolvedCheck so the board and the icons read real data.
  it('ResolvedCheck carries the node\'s tested stats', () => {
    const { check } = runWithCheck();
    expect(Array.isArray(check.stats)).toBe(true);
    expect(check.stats!.length).toBeGreaterThan(0);
  });

  // INV:R-253-check-real-data — the axis profile is NOT the flat
  // single-skill placeholder: tested stats lead at the party's best
  // living value, remaining axes take the party's next best stats
  // descending; all five obelisks sit on the authored baseline.
  it('checkAxisProfile leads with the tested stats at party best values', () => {
    const { run, check } = runWithCheck();
    const profile = checkAxisProfile(check, run);
    expect(profile).toHaveLength(5);
    const alive = run.party.filter((m) => !m.dead);
    const best = (s: string) => Math.max(...alive.map((m) => (m.stats as Record<string, number>)[s] ?? 0));
    const tested = check.stats!;
    for (let i = 0; i < tested.length; i += 1) {
      expect(profile[i].stat).toBe(best(tested[i]));
      expect(profile[i].difficulty).toBe(50);
    }
    /* distinct stats → a NON-regular star: at least two axis radii differ
     * for a heterogeneous party (the preset parties are). */
    const radii = new Set(profile.map((p) => p.stat));
    expect(radii.size).toBeGreaterThan(1);
  });

  // INV:R-253-check-real-data — the profile reaches the engine as a
  // display-only override; `skills` still carries the single verdict skill
  // (the landing-angle pick is untouched).
  it('the column hands axisProfile to the astrolabe while skills keeps the verdict skill', () => {
    astroSpy.mockClear();
    const { run, check } = runWithCheck();
    render(<QuestSkillCheckColumn bridge={bridgeFor(check)} run={run} />);
    const props = astroSpy.mock.calls.at(-1)?.[0] as { axisProfile?: { stat: number }[]; skills?: unknown[] };
    expect(props.axisProfile).toBeDefined();
    expect(props.axisProfile).toHaveLength(5);
    expect(props.skills).toHaveLength(1);
  });

  // INV:R-253-check-stat-icons — the title row shows one icon per tested
  // stat (`quest-check-stat-<stat>`), i18n tooltip via
  // `questExpedition.statName.*`.
  it('the title row paints one stat icon per tested stat', () => {
    const { run, check } = runWithCheck();
    render(<QuestSkillCheckColumn bridge={bridgeFor(check)} run={run} />);
    for (const s of check.stats!) {
      expect(screen.getByTestId(`quest-check-stat-${s}`)).toBeTruthy();
    }
  });
});
