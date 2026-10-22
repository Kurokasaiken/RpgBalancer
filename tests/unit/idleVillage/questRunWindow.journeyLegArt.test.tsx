/**
 * PLAN-053/R-263 journey leg art — a travel fase owns no scenario node, so
 * `run.nodeId` still points at the last arrived node and the theatre would
 * sit on stale art for the whole leg. While the beat queue is drained the
 * stage must show the leg painting (`JOURNEY_LEG_ART`): andata → the open
 * gate, ritorno → the valley home. A mounted scene beat always wins, and
 * an ended run keeps the authored arrival art.
 *
 * Contract: `quest-run-window.INV-6` (theatre art during travel fasi).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import type { QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import type { QuestFase } from '@/ui/idleVillage/quests/questJourney';
import { JOURNEY_LEG_ART } from '@/ui/idleVillage/questS1Lab/questArt';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';

const PRESET = GOBLIN_PRESETS[0].id;

/** Fabricate the `run.journey` carrier the engine would have launched with —
 *  the window only reads `journal.currentFase`; the rest satisfies the type. */
const withJourneyFase = (run: QuestRunState, fase: QuestFase): QuestRunState => {
  run.journey = {
    snapshot: {
      travelDays: 2,
      ticksPerDay: 96,
      route: { points: [{ x: 0, y: 0 }, { x: 1, y: 0 }], cumulativeLengths: [0, 1], totalLength: 1 },
      pins: {},
      runSeed: run.seed,
      engineSchemaVersion: 1,
      scenarioHash: 'test',
      journeyEnabled: true,
      fasePlans: { andata: [], ritorno: [] },
      svolgimentoEntryNodeId: 'gob-esplora',
    },
    journal: {
      currentFase: fase,
      faseStartedAtTick: 0,
      processedUpToTick: 0,
      accumulatedParkedTicks: 0,
      parkedNodeId: null,
      beats: [],
    },
  };
  return run;
};

const renderWindow = (run: QuestRunState, queuedBeats: QuestBeat[] = []) =>
  render(
    <Tooltip.Provider>
      <QuestRunWindow
        run={run}
        phases={[emptyPhase(0)]}
        beats={GOBLIN_SCENARIO.beats}
        queuedBeats={queuedBeats}
        beatTiming={{ sceneMs: 60000, checkMs: 60000, harmMs: 60000, endMs: 60000, recapMs: 60000 }}
        title={GOBLIN_SCENARIO.title}
        flavour={GOBLIN_SCENARIO.flavour}
        artFor={(nodeId) => `/art/${nodeId}.webp`}
        time={{ progress: 0, label: 'Giorno 1 di 2' }}
        onChoose={() => undefined}
        armedFlags={new Set()}
        onToggleArmedFlag={() => undefined}
        onClose={vi.fn()}
        anchor={{ left: 0, top: 0 }}
        widthPx={640}
        theaterAspect={2.9}
        tooltipLines={6}
      />
    </Tooltip.Provider>,
  );

const stageSrc = (container: HTMLElement): string | null => {
  const frame = container.querySelector('[data-testid="quest-theatre-frame"]');
  return frame?.querySelector('img')?.getAttribute('src') ?? null;
};

describe('QuestRunWindow — journey leg art (R-263)', () => {
  it('andata travel with a drained queue shows the outbound leg painting', () => {
    const run = withJourneyFase(createRun(PRESET, 42, 'goblin'), 'andata');
    const { container } = renderWindow(run);
    expect(stageSrc(container)).toBe(JOURNEY_LEG_ART.andata.src);
  });

  it('ritorno travel with a drained queue shows the homebound leg painting', () => {
    const run = withJourneyFase(createRun(PRESET, 42, 'goblin'), 'ritorno');
    const { container } = renderWindow(run);
    expect(stageSrc(container)).toBe(JOURNEY_LEG_ART.ritorno.src);
  });

  it('svolgimento keeps the node art — the leg override never fires', () => {
    const run = withJourneyFase(createRun(PRESET, 42, 'goblin'), 'svolgimento');
    const { container } = renderWindow(run);
    expect(stageSrc(container)).toBe(`/art/${run.nodeId}.webp`);
  });

  it('a mounted scene beat always wins over the leg painting', () => {
    const run = withJourneyFase(createRun(PRESET, 42, 'goblin'), 'andata');
    const nodeId = run.nodeId;
    const sceneBeat: QuestBeat = {
      id: 'scene-1',
      kind: 'scene',
      nodeId,
      title: GOBLIN_SCENARIO.nodes[nodeId].title,
    };
    const { container } = renderWindow(run, [sceneBeat]);
    expect(stageSrc(container)).toBe(`/art/${nodeId}.webp`);
  });

  it('an ended run keeps the authored arrival art — the leg art disengages', () => {
    const run = withJourneyFase(createRun(PRESET, 42, 'goblin'), 'ritorno');
    run.ended = true;
    const { container } = renderWindow(run);
    expect(stageSrc(container)).toBe(`/art/${run.nodeId}.webp`);
  });
});
