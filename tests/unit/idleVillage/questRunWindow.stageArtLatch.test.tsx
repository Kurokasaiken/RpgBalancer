/**
 * R-241 B1 (quest-run-window.INV-1) — the theatre image changes ONLY when a
 * scene beat reaches the stage, never instantly at the commit that follows.
 *
 * Director (2026-10-21): «quando scelgo qualcosa l'immagine cambia e nn
 * dovrebbe». Root cause: `activeSceneNodeId` fell back to `run.nodeId`
 * whenever the beat on stage was not a scene — but `run.nodeId` is already
 * the arrival node the instant a choice commits, so the art swapped to the
 * next node's image while the previous scene's moments (check, harm) were
 * still playing. Fix: during a non-scene beat the stage keeps the last scene
 * beat the queue showed (a latch over `queuedBeats`), falling back to the
 * previous visited node; with the queue drained it rests on `run.nodeId`.
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, render } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { applyChoice, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import type { QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';

const PRESET = GOBLIN_PRESETS[0].id;

const renderWindow = (run: QuestRunState, queuedBeats: QuestBeat[]) =>
  render(
    <Tooltip.Provider>
      <QuestRunWindow
        run={run}
        phases={[emptyPhase(0)]}
        beats={GOBLIN_SCENARIO.beats}
        queuedBeats={queuedBeats}
        beatTiming={{ sceneMs: 60_000, checkMs: 60_000, harmMs: 60_000, endMs: 60_000, recapMs: 60_000, checkHoldMs: 60_000 }}
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

afterEach(() => {
  vi.useRealTimers();
});

describe('QuestRunWindow — theatre art is latched to the stage scene (R-241)', () => {
  // INV:quest-run-window.INV-1 — while a check beat is on stage the theatre
  // keeps the LAST scene beat's art; it never jumps ahead to `run.nodeId`.
  it('keeps the previous scene art while the check beat spins, then cuts with the arrival scene', () => {
    vi.useFakeTimers();
    const run = createRun(PRESET, 42, 'goblin');
    const prevId = run.nodeId; // 'gob-esplora'
    applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
    const arrivalId = run.nodeId;
    expect(arrivalId).not.toBe(prevId);
    const check = run.checkQueue[0];
    expect(check).toBeDefined();
    const beats: QuestBeat[] = [
      { id: 'scene-0', kind: 'scene', nodeId: prevId, title: GOBLIN_SCENARIO.nodes[prevId].title },
      { id: check.id, kind: 'check', check },
      { id: 'scene-1', kind: 'scene', nodeId: arrivalId, title: GOBLIN_SCENARIO.nodes[arrivalId].title },
    ];
    const { container } = renderWindow(run, beats);
    const img = () => container.querySelector('[data-testid="quest-theatre-frame"] img');

    /* The previous scene is on stage: its art is up. */
    expect(img()?.getAttribute('src')).toBe(`/art/${prevId}.webp`);

    /* Cursor to the check beat: the astrolabe owns the moment — the image
     * must NOT swap to the already-committed arrival node. */
    act(() => vi.advanceTimersByTime(60_000));
    expect(img()?.getAttribute('src')).toBe(`/art/${prevId}.webp`);

    /* The arrival scene beat reaches the stage — NOW the image cuts, with
     * the scene's own transition (not instantly at the click). */
    act(() => vi.advanceTimersByTime(60_000));
    expect(img()?.getAttribute('src')).toBe(`/art/${arrivalId}.webp`);
  });
});
