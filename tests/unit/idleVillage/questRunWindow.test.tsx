/**
 * R-106 playtest fixes for the running-quest window on /game:
 * nothing spent unasked, verdicts speak through their authored lines,
 * no duplicated text, and the check summary never denies HP damage.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { applyChoice, availableOptions, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_BEATS, GOBLIN_META, GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questScenarioGoblin';
import { useQuestRun } from '@/ui/idleVillage/questS1Lab/useQuestRun';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';

const PRESET = GOBLIN_PRESETS[0].id;

/** Departs and stands at F1 (the exploration choice). */
const atExploration = (seed: number): QuestRunState => {
  const run = createRun(PRESET, seed, 'goblin');
  applyChoice(run, availableOptions(run)[0].id);
  return run;
};

const renderWindow = (run: QuestRunState) =>
  render(
    <Tooltip.Provider>
      <QuestRunWindow
        run={run}
        phases={[emptyPhase(0)]}
        beats={GOBLIN_BEATS}
        queuedBeats={[]}
        beatTiming={{ sceneMs: 1600, checkMs: 1800, harmMs: 1200, endMs: 1600, recapMs: 1800 }}
        title={GOBLIN_META.title}
        flavour={GOBLIN_META.flavour}
        artFor={() => undefined}
        time={{ progress: 0, label: 'Giorno 1 di 2' }}
        onChoose={() => undefined}
        armed={false}
        onToggleArmed={() => undefined}
        onUseHealing={() => undefined}
        onDrinkPotion={() => undefined}
        onClose={() => undefined}
        anchor={{ left: 0, top: 0 }}
        widthPx={460}
        theaterAspect={2.76}
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
});

describe('QuestRunWindow — what the player reads', () => {
  it('shows the quest flavour once at departure, never repeated as "what happened"', () => {
    renderWindow(createRun(PRESET, 11, 'goblin'));
    expect(screen.getAllByText(GOBLIN_META.flavour)).toHaveLength(1);
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
      const body = screen.getAllByText(/Il bosco tace/);
      expect(body).toHaveLength(1);
      unmount();
    }
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
        const greedy = options.find((o) => /Frugare|Incalz|Arrampic|Prendere/.test(o.label)) ?? options[0];
        applyChoice(run, greedy.id);
        expect(run.ended || run.party.some((m) => !m.dead)).toBe(true);
      }
      if (run.outcome === 'wipe') wipes += 1;
    }
    expect(wipes).toBeGreaterThan(0);
  });
});

describe('check summary honesty', () => {
  it('never says «Nessuna conseguenza fisica» for a check that took HP', () => {
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
          expect(run.lastEvent).not.toContain('Nessuna conseguenza fisica');
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
