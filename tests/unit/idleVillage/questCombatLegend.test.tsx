/**
 * PLAN-071 T-B1 (R-239) — combat/check legibility: every number or icon
 * must read without a forced tooltip.
 *
 * Video audit (Director, 2026-10-21):
 * - the enemy pip row (`●●○○`) gave no hint of its polarity — downed vs
 *   standing looked the same class of mark;
 * - the check score chip read a bare `85/50` — the «vs» relation was only
 *   in the tooltip.
 *
 * Contract:
 * - a downed enemy renders a `✕` mark (standing stays a filled dot) and the
 *   pip strip exposes `enemiesLeft` on `title` too;
 * - the score chip visibly reads `{score} vs {difficulty}`.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { applyChoice, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import type { QuestCheckBridge } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';
import { QuestSkillCheckColumn } from '@/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn';
import enIdleVillage from '../../../public/locales/en/idleVillage.json';

/* jsdom has no canvas: the stub only lets the column paint. */
vi.mock('@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit', () => ({
  DestinyAstrolabeV62Standalone: React.forwardRef(function AstroStub(
    props: { onResolve?: () => void },
    ref: React.Ref<unknown>,
  ) {
    React.useImperativeHandle(ref, () => ({ throw: vi.fn(), skipToResult: () => props.onResolve?.(), roll: vi.fn() }));
    return <button type="button" data-testid="astro-resolve" onClick={() => props.onResolve?.()} />;
  }),
}));

const PRESET = GOBLIN_PRESETS[0].id;

/** Stands the run at the F4 combat node with some goblins already downed. */
const atCombat = (seed: number, goblinLeft: number): QuestRunState => {
  const run = createRun(PRESET, seed, 'goblin');
  run.nodeId = 'gob-combattimento';
  run.visitedNodes.push('gob-combattimento');
  run.frontier = { status: 'waiting', startedAt: 0, readyAt: 0 };
  run.goblinLeft = goblinLeft;
  return run;
};

const renderWindow = (run: QuestRunState) =>
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
        onClose={() => undefined}
        anchor={{ left: 0, top: 0 }}
        widthPx={640}
        theaterAspect={2.9}
        tooltipLines={6}
      />
    </Tooltip.Provider>,
  );

describe('combat strip — pip legend (R-239)', () => {
  // INV:R-239-combat-legend — downed enemies read as ✕, standing as filled dots,
  // and the strip names the track on title (not only aria).
  it('downed enemies paint a ✕ mark and the strip names the count on title', () => {
    renderWindow(atCombat(42, 3));
    const pips = screen.getByTestId('combat-enemy-pips');
    const downed = [...pips.children].filter((p) => p.getAttribute('data-filled') === 'false');
    expect(downed.length).toBeGreaterThan(0);
    downed.forEach((p) => expect(p.textContent).toBe('✕'));
    expect(pips.getAttribute('title')).toContain('goblin');
  });
});

describe('check score chip — readable format (R-239)', () => {
  // INV:R-239-combat-legend — the chip reads «score vs difficulty», not «score/difficulty».
  it('the title chip reads «{score} vs {difficulty}»', () => {
    const run = createRun(PRESET, 42, 'goblin');
    applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
    const check = run.checkQueue[0];
    if (!check) throw new Error('fixture: no check queued');
    const bridge: QuestCheckBridge = {
      beatId: 'beat-1',
      check,
      mode: 'fail_wound',
      autoThrow: false,
      handle: { current: null },
      onResolved: vi.fn(),
      onDismiss: vi.fn(),
    };
    render(<QuestSkillCheckColumn bridge={bridge} run={run} />);
    expect(screen.getByText(`${check.score} vs 50`)).toBeInTheDocument();
    expect(screen.queryByText(`${check.score}/50`)).toBeNull();
  });
});
