/**
 * QuestTheatre × real adapter (PLAN-025 T-007): the theatre renders a real
 * engine snapshot — pending maturation progress, combat as a decision with
 * telemetry — and its intents drive `submitCommand` on the real run.
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  createRun,
  submitCommand,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import {
  createQuestRunAdapter,
  snapshotQuestRun,
} from '@/ui/idleVillage/questTheatre/questRunAdapter';
import { QuestTheatre } from '@/ui/idleVillage/questTheatre/QuestTheatre';
import type { TheatreRunView } from '@/ui/idleVillage/questTheatre/theatreContract';

const TICKS = 100;
const PARTY = GOBLIN_PRESETS[0].id;

const timedRun = () => createRun(PARTY, 42, 'goblin', undefined, { nodeTicks: TICKS, startTick: 0 });

const atChoice = (state: QuestRunState, nodeId: string, tick = 0) => {
  state.nodeId = nodeId;
  state.visitedNodes.push(nodeId);
  state.frontier = { status: 'waiting', startedAt: tick, readyAt: tick };
};

/** Minimal harness: re-snapshot after every render so intents can advance. */
function TheatreHarness({ run }: { run: QuestRunState }) {
  const adapter = React.useMemo(() => createQuestRunAdapter(() => run), [run]);
  const [snap, setSnap] = React.useState<TheatreRunView>(() => adapter.getSnapshot());
  return (
    <QuestTheatre
      snapshot={snap}
      dispatch={(intent) => {
        const res = adapter.dispatch(intent);
        setSnap(adapter.getSnapshot());
        return res;
      }}
    />
  );
}

describe('QuestTheatre on the real adapter', () => {
  it('renders a real choice frontier and an option click advances the engine', () => {
    const run = timedRun();
    render(<TheatreHarness run={run} />);
    const option = screen.getByTestId('theatre-option-gob-partenza');
    fireEvent.click(option);
    expect(run.nodeId).toBe('gob-esplora');
    expect(run.frontierVersion).toBe(1);
  });

  it('a pending timed node shows the maturation progress and no input', () => {
    const run = timedRun();
    atChoice(run, 'gob-esplora-extra');
    submitCommand(run, 'gob-fermati', { tick: 0 });
    render(<TheatreHarness run={run} />);
    // Snapshot projects pending with the caller tick — progress bar present,
    // zero options (the theatre cannot send commands across time).
    expect(screen.getByTestId('stage-timed')).toBeTruthy();
    expect(screen.queryByTestId('stage-choice')).toBeNull();
    expect(screen.queryByTestId(/theatre-option-/)).toBeNull();
  });

  it('a combat node renders as a decision with live telemetry', () => {
    const run = timedRun();
    atChoice(run, 'gob-combattimento');
    run.goblinLeft = 5;
    render(<TheatreHarness run={run} />);
    expect(screen.getByTestId('stage-combat')).toBeTruthy();
    expect(screen.getByTestId('combat-telemetry')).toBeTruthy();
    const fight = screen.getByTestId('theatre-option-fight-turn');
    fireEvent.click(fight);
    expect(run.combatTurn).toBe(1);
  });

  it('a pending node projects the progress bar when a tick is supplied', () => {
    const run = timedRun();
    atChoice(run, 'gob-esplora-extra');
    submitCommand(run, 'gob-fermati', { tick: 0 });
    const view = snapshotQuestRun(run, { tick: TICKS / 2 });
    render(<QuestTheatre snapshot={view} dispatch={() => ({ status: 'accepted' })} />);
    const bar = screen.getByTestId('stage-pending-progress');
    expect(bar.getAttribute('aria-valuenow')).toBe(String(TICKS / 2));
    expect(bar.getAttribute('aria-valuemax')).toBe(String(TICKS));
  });
});
