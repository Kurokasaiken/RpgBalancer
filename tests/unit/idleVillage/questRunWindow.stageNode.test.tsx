/**
 * PLAN-071 T-A3 (R-239) — the theatre art must come from the node whose
 * scene beat is on stage. R-245 (Director, 2026-10-21): nothing is ever
 * painted over the artwork — the diegetic caption is removed outright.
 *
 * Video audit (Director, 2026-10-21, ~3:36): the theatre kept showing the
 * previous node's artwork while the caption already named the new node —
 * a (title_B, image_A) intermediate frame. Root cause: the caption read
 * `node.title` off `run.nodeId` (which moves the instant a choice commits)
 * while the image read `artFor(activeSceneNodeId)` (which follows the beat
 * queue — the previous scene beat is still on stage).
 *
 * Contract: while a scene beat of node A is on stage and `run.nodeId` is
 * already B, the theatre `src` is A's art — and the frame paints no text
 * at all (scene identity lives in the narrative column, not on the image).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
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

describe('QuestRunWindow — art follows the staged scene, text never lands on it (R-239 + R-245)', () => {
  // INV:R-239-stage-node-atomic — a scene beat of node A on stage while
  // `run.nodeId` is already B: the theatre still paints A's art.
  // INV:R-245-no-text-on-art — the theatre frame contains no text nodes.
  it('shows node A art while A’s scene beat is on stage — and paints no text over it', () => {
    const run = createRun(PRESET, 42, 'goblin');
    const prevNodeId = run.nodeId; // 'gob-esplora' — "Exploration"
    applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
    expect(run.nodeId).not.toBe(prevNodeId);
    const nodeA = GOBLIN_SCENARIO.nodes[prevNodeId];
    const nodeB = GOBLIN_SCENARIO.nodes[run.nodeId];
    const sceneBeat: QuestBeat = { id: 'scene-prev', kind: 'scene', nodeId: prevNodeId, title: nodeA.title };

    const { container } = renderWindow(run, [sceneBeat]);
    const frame = container.querySelector('[data-testid="quest-theatre-frame"]');
    expect(frame).toBeTruthy();
    const img = frame!.querySelector('img');
    expect(img?.getAttribute('src')).toBe(`/art/${prevNodeId}.webp`);
    /* R-245: nothing is ever painted over the artwork — the frame must hold
     *  no text at all (not node A's title, not node B's, not a caption). */
    expect(frame!.textContent ?? '').toBe('');
    expect(frame!.textContent).not.toContain(nodeA.title);
    expect(frame!.textContent).not.toContain(nodeB.title);
    /* The scene's title still reaches the player — in the narrative column
     *  below the art (BeatStage), never on the image. */
    const beat = container.querySelector('[data-testid="quest-window-beat"]');
    expect(beat?.textContent).toContain(nodeA.title);
  });
});
