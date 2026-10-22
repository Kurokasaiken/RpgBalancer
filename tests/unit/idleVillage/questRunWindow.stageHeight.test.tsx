/**
 * R-259 (supersedes R-241 B2 / quest-run-window.INV-2) — the narrative
 * stage hugs its copy; text length changes the box height up to the
 * `stageMaxHeightPx` cap, then scrolls INSIDE.
 *
 * Director (2026-10-22): «allinea i pulsanti alla fine del testo … solo il
 * box del testo devo poter scorrere, nn tutto il componente». The R-241
 * fixed-height slot left a dead band between short copy and the choice
 * rows; the box now auto-sizes (maxHeight cap + `overflowX: hidden` +
 * `flexShrink: 1` for short-viewport pressure).
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
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

const PRESET = GOBLIN_PRESETS[0].id;
const CAP = `${DEFAULT_GAME_FRAME_CONFIG.questWindow.stageMaxHeightPx}px`;

const renderWindow = (run: QuestRunState, queuedBeats: QuestBeat[]) =>
  render(
    <Tooltip.Provider>
      <QuestRunWindow
        run={run}
        phases={[emptyPhase(0)]}
        beats={GOBLIN_SCENARIO.beats}
        queuedBeats={queuedBeats}
        beatTiming={{ sceneMs: 60_000, checkMs: 60_000, harmMs: 60_000, endMs: 60_000, recapMs: 60_000 }}
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

describe('QuestRunWindow — narrative box hugs copy, capped (R-259)', () => {
  // INV:R-259-textbox-fit — the resting stage caps at `maxHeight` (NOT a
  // fixed `height`): short copy shrinks the box so the choices glue to the
  // end of the text; overflow scrolls inside (`overflowY: auto`,
  // `overflowX: hidden`) — the ONLY scrollable surface.
  it('caps the resting stage at maxHeight with internal scroll only', () => {
    const run = createRun(PRESET, 42, 'goblin');
    const { container } = renderWindow(run, []);
    const stage = container.querySelector('[data-testid="quest-window-stage"]');
    expect(stage).toBeTruthy();
    expect(stage).toHaveStyle({ maxHeight: CAP, overflowY: 'auto', overflowX: 'hidden' });
    expect((stage as HTMLElement).style.height).toBe('');
  });

  // INV:R-259-textbox-fit — the beat stage shares the same cap so
  // presenting↔resting keeps the choices glued to the copy.
  it('caps the beat stage at the same maxHeight', () => {
    const run = createRun(PRESET, 42, 'goblin');
    const beat: QuestBeat = { id: 'scene-0', kind: 'scene', nodeId: run.nodeId, title: 'Esplora', body: 'x'.repeat(400) };
    const { container } = renderWindow(run, [beat]);
    const stage = container.querySelector('[data-testid="quest-window-beat"]');
    expect(stage).toBeTruthy();
    expect(stage).toHaveStyle({ maxHeight: CAP, overflowY: 'auto', overflowX: 'hidden' });
    expect((stage as HTMLElement).style.height).toBe('');
  });
});
