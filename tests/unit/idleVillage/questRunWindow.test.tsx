/**
 * R-106 playtest fixes for the running-quest window on /game:
 * nothing spent unasked, verdicts speak through their authored lines,
 * no duplicated text, and the check summary never denies HP damage.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, renderHook, act, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';
import * as Tooltip from '@radix-ui/react-tooltip';
import { applyChoice, availableOptions, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { useQuestRun } from '@/ui/idleVillage/questS1Lab/useQuestRun';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import type { QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';

const PRESET = GOBLIN_PRESETS[0].id;

/** Departs and stands at F1 (the exploration choice). */
const atExploration = (seed: number): QuestRunState => {
  const run = createRun(PRESET, seed, 'goblin');
  applyChoice(run, availableOptions(run)[0].id);
  return run;
};

interface WindowOpts {
  queuedBeats?: QuestBeat[];
  nowTick?: number;
  onAbandon?: () => void;
  artFor?: (nodeId: string) => string | undefined;
}

const renderWindow = (run: QuestRunState, opts: WindowOpts = {}) =>
  render(
    <Tooltip.Provider>
      <QuestRunWindow
        run={run}
        phases={[emptyPhase(0)]}
        beats={GOBLIN_SCENARIO.beats}
        queuedBeats={opts.queuedBeats ?? []}
        beatTiming={{ sceneMs: 1600, checkMs: 1800, harmMs: 1200, endMs: 1600, recapMs: 1800 }}
        title={GOBLIN_SCENARIO.title}
        flavour={GOBLIN_SCENARIO.flavour}
        artFor={opts.artFor ?? (() => undefined)}
        time={{ progress: 0, label: 'Giorno 1 di 2' }}
        onChoose={() => undefined}
        nowTick={opts.nowTick}
        onAbandon={opts.onAbandon}
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

describe('useQuestRun — bag items are the player\'s call', () => {
  it('does not spend the Perception bonus on a PER check unless armed', () => {
    const { result } = renderHook(() => useQuestRun('goblin'));
    act(() => result.current.start(PRESET));
    act(() => result.current.choose(availableOptions(result.current.run!)[0].id));
    expect(result.current.run!.flags).toContain('hasBonusPerc');
    act(() => result.current.choose('gob-cerca-tracce', { useConsumable: false }));
    expect(result.current.run!.flags).toContain('hasBonusPerc');
  });

  it('spends it when the player armed the bag', () => {
    const { result } = renderHook(() => useQuestRun('goblin'));
    act(() => result.current.start(PRESET));
    act(() => result.current.choose(availableOptions(result.current.run!)[0].id));
    act(() => result.current.choose('gob-cerca-tracce', { useConsumable: true }));
    expect(result.current.run!.flags).not.toContain('hasBonusPerc');
  });

  /* R-196 per-item path: no opts → the hook's armedFlags set drives. */
  it('spends ONLY the armed item — unarmed packed siblings stay in the bag', () => {
    const { result } = renderHook(() => useQuestRun('goblin'));
    act(() => result.current.start(PRESET));
    act(() => result.current.choose(availableOptions(result.current.run!)[0].id));
    // Arm the perc item only; the forza sibling stays packed even though
    // the perc check would not use it anyway, and shadowed items never burn.
    act(() => result.current.toggleArmedFlag('hasBonusPerc'));
    expect(result.current.armedFlags.has('hasBonusPerc')).toBe(true);
    act(() => result.current.choose('gob-cerca-tracce'));
    expect(result.current.run!.flags).not.toContain('hasBonusPerc');
    expect(result.current.armedFlags.has('hasBonusPerc')).toBe(false); // reconciled out
    expect(result.current.run!.flags).toContain('hasBonusForza');
  });

  it('nothing armed → nothing spent (armedFlags replace the boolean)', () => {
    const { result } = renderHook(() => useQuestRun('goblin'));
    act(() => result.current.start(PRESET));
    act(() => result.current.choose(availableOptions(result.current.run!)[0].id));
    act(() => result.current.choose('gob-cerca-tracce'));
    expect(result.current.run!.flags).toContain('hasBonusPerc');
  });

  it('toggleArmedFlag is idempotent per item and rejects unheld/passive flags', () => {
    const { result } = renderHook(() => useQuestRun('goblin'));
    act(() => result.current.start(PRESET));
    act(() => result.current.toggleArmedFlag('hasBonusPerc'));
    act(() => result.current.toggleArmedFlag('hasBonusPerc'));
    expect(result.current.armedFlags.has('hasBonusPerc')).toBe(false);
    // Not in the bag → never arms.
    act(() => result.current.toggleArmedFlag('hasCorda'));
    expect(result.current.armedFlags.has('hasCorda')).toBe(false);
  });
});

describe('QuestRunWindow — what the player reads', () => {
  it('shows the quest flavour once at departure, never repeated as "what happened"', () => {
    renderWindow(createRun(PRESET, 11, 'goblin'));
    expect(screen.getAllByText(GOBLIN_SCENARIO.flavour)).toHaveLength(1);
  });

  it('speaks a resolved check through its authored verdict line, not "TITLE — VERDICT."', () => {
    const run = atExploration(42);
    applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
    const check = run.checkQueue[0];
    expect(check.flavor).toBeTruthy();
    renderWindow(run);
    expect(screen.getByText(check.flavor!)).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`${check.title} — ${check.verdict.toUpperCase()}`))).not.toBeInTheDocument();
  });

  it('never prints the scene body twice', () => {
    for (const seed of [3, 17, 58]) {
      const run = atExploration(seed);
      const { unmount } = renderWindow(run);
      const body = screen.getAllByText(/The wood is silent/);
      expect(body).toHaveLength(1);
      unmount();
    }
  });
});

describe('R-199 — no skip button, companions closed, frontier gating', () => {
  it('there is NO skip/continue button: clicking the beat or any key advances it', () => {
    const beats: QuestBeat[] = [
      { id: 's1', kind: 'scene', nodeId: 'gob-esplora', title: 'Uno' },
      { id: 's2', kind: 'scene', nodeId: 'gob-esplora', title: 'Due' },
    ];
    renderWindow(atExploration(42), { queuedBeats: beats });
    expect(screen.queryByRole('button', { name: /skip|continue|avanti|salta/i })).toBeNull();
    expect(screen.getByTestId('quest-window-beat')).toHaveTextContent('Uno');
    fireEvent.click(screen.getByTestId('quest-window-beat'));
    expect(screen.getByTestId('quest-window-beat')).toHaveTextContent('Due');
    fireEvent.keyDown(window, { key: 'x' });
    expect(screen.queryByTestId('quest-window-beat')).toBeNull();
  });

  it('companion panels are closed by default; the belt trigger sits beside the choices', () => {
    renderWindow(atExploration(42));
    expect(screen.queryByTestId('quest-companion-left')).toBeNull();
    expect(screen.queryByTestId('quest-companion-right')).toBeNull();
    // The bag/belt icon lives in the action strip next to the numbered choices.
    const strip = screen.getByTestId('quest-action-strip');
    expect(within(strip).getByTestId('quest-belt-toggle')).toBeInTheDocument();
  });

  it('«abbandona quest» asks inline before routing to the engine flee', () => {
    const onAbandon = vi.fn();
    renderWindow(atExploration(42), { onAbandon });
    fireEvent.click(screen.getByTestId('quest-abandon-toggle'));
    expect(screen.getByTestId('quest-abandon-confirm')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('quest-abandon-stay'));
    expect(onAbandon).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('quest-abandon-toggle'));
    fireEvent.click(screen.getByTestId('quest-abandon-yes'));
    expect(onAbandon).toHaveBeenCalledTimes(1);
  });

  it('a frontier whose slot has not come locks its options — visible, not committable', () => {
    // nodeTicks=10: after the first choice the next frontier opens at tick 10.
    const run = createRun(PRESET, 42, 'goblin', undefined, { nodeTicks: 10, startTick: 0 });
    applyChoice(run, availableOptions(run)[0].id);
    expect(run.frontier.readyAt).toBeGreaterThan(0);
    renderWindow(run, { nowTick: run.frontier.readyAt - 1 });
    expect(screen.getByTestId('quest-window-locked')).toBeInTheDocument();
    for (const c of screen.getAllByTestId('quest-window-choice')) expect(c).toBeDisabled();
  });

  it('the same frontier is committable once its slot on the bar has come', () => {
    const run = createRun(PRESET, 42, 'goblin', undefined, { nodeTicks: 10, startTick: 0 });
    applyChoice(run, availableOptions(run)[0].id);
    renderWindow(run, { nowTick: run.frontier.readyAt });
    expect(screen.queryByTestId('quest-window-locked')).toBeNull();
    for (const c of screen.getAllByTestId('quest-window-choice')) expect(c).not.toBeDisabled();
  });

  it('the theatre shows the node art via artFor', () => {
    const { container } = renderWindow(atExploration(42), { artFor: () => '/assets/idle_village/quest-goblin/scene.jpg' });
    const img = container.querySelector('img[src="/assets/idle_village/quest-goblin/scene.jpg"]');
    expect(img).toBeInTheDocument();
  });
});

describe('engine — a party killed by an outcome toll ends the run', () => {
  it('never leaves a running quest with nobody alive (F6 search, F5 toll, F1 fall)', () => {
    let wipes = 0;
    for (let seed = 1; seed <= 400; seed += 1) {
      const run = createRun(PRESET, seed, 'goblin');
      for (let step = 0; step < 80 && !run.ended; step += 1) {
        const options = availableOptions(run).filter((o) => !o.disabled);
        if (!options.length) break;
        const greedy = options.find((o) => /loot|Pursue|Climb|Take|Fight/i.test(o.label)) ?? options[0];
        applyChoice(run, greedy.id);
        expect(run.ended || run.party.some((m) => !m.dead)).toBe(true);
      }
      if (run.outcome === 'wipe') wipes += 1;
    }
    expect(wipes).toBeGreaterThan(0);
  });
});

describe('check summary honesty', () => {
  it('never says «No physical consequences» for a check that took HP', () => {
    let checked = 0;
    for (let seed = 1; seed <= 300; seed += 1) {
      const run = createRun(PRESET, seed, 'goblin');
      for (let step = 0; step < 80 && !run.ended; step += 1) {
        const options = availableOptions(run).filter((o) => !o.disabled);
        if (!options.length) break;
        applyChoice(run, options[options.length - 1].id);
        const first = run.checkQueue[0];
        if (first && first.harms.length > 0 && run.lastEvent.startsWith(`${first.title} —`)) {
          checked += 1;
          expect(run.lastEvent).not.toContain('No physical consequences');
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
