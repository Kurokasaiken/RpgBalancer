/**
 * PLAN-067 T-A4 (R-234) — the verdict is said in ONE place (quest UI guide §1:
 * the verdict replaces the zone's content, it is not an extra band). In the
 * /game cluster the right-wing Verdict Card carries verdict + flavor + authored
 * consequences, so the window's check beat keeps only the attempt (title,
 * transit). Outside the cluster — or with «skip the whole check», where no
 * astrolabe paints — the window beat stays the verdict's only home.
 */
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { applyChoice, createRun } from '@/ui/idleVillage/questS1Lab/questRun';
import { publishQuestRun, useQuestRunStore } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import type { CheckBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';
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

const TIMING = { sceneMs: 1600, checkMs: 1800, harmMs: 1200, endMs: 1600, recapMs: 1800, checkHoldMs: 60000, checkVerdictMs: 100 };

/** The cluster's right wing, as `game-frame-pixi` mounts it from the published bridge. */
const RightWing: React.FC = () => {
  const bridge = useQuestRunStore((s) => s.bridges.goblin);
  const run = useQuestRunStore((s) => s.runs.goblin);
  return bridge && run ? <QuestSkillCheckColumn bridge={bridge} run={run} /> : null;
};

afterEach(() => publishQuestRun('goblin', null));

describe('QuestRunWindow — verdict said once (R-234, guide §1)', () => {
  // INV:R-234-verdict-once — in the cluster, a resolved check's verdict, flavor and authored
  // consequences live in the right-wing Verdict Card only; the window beat keeps the attempt's title.
  it('in the cluster the window beat does not repeat the Verdict Card', () => {
    const run = createRun(GOBLIN_PRESETS[0].id, 42, 'goblin');
    applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
    const check = run.checkQueue[0];
    const told = check.flavor || check.authoredText;
    expect(told).toBeTruthy();
    const beat: CheckBeat = { id: check.id, kind: 'check', check };
    publishQuestRun('goblin', run);
    render(
      <Tooltip.Provider>
        <QuestRunWindow
          run={run}
          phases={[emptyPhase(0)]}
          beats={GOBLIN_SCENARIO.beats}
          queuedBeats={[beat]}
          beatTiming={TIMING}
          title={GOBLIN_SCENARIO.title}
          flavour={GOBLIN_SCENARIO.flavour}
          artFor={() => undefined}
          time={{ progress: 0, label: 'Giorno 1 di 5' }}
          onChoose={() => undefined}
          onClose={() => undefined}
          anchor={{ left: 0, top: 0 }}
          widthPx={820}
          theaterAspect={2.4}
          tooltipLines={6}
          inCluster
        />
        <RightWing />
      </Tooltip.Provider>,
    );
    fireEvent.click(screen.getByTestId('astro-resolve'));

    expect(screen.getByTestId('quest-verdict-card').textContent).toContain(told);
    const windowBeat = screen.getByTestId('quest-window-beat');
    expect(windowBeat.textContent).not.toContain(told);
    expect(windowBeat.textContent).toContain(check.title);
  });
});
