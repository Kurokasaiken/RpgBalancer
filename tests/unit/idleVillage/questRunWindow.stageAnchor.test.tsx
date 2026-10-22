/**
 * R-259 (quest-run-window): centred stack — art+text+choices glued, no
 * component scrollbar.
 *
 * Director (2026-10-22): «allinea i pulsanti alla fine del testo … ci sn le
 * barre sia leaterali che orizzonatli per scorrere di default. nn voglio ce
 * ci siano, deve essere tutto il + centrato possibile, quando possibile, e
 * in caso solo il box del testo devo poter scorrere, nn tutto il
 * componente». The outer column never scrolls; the whole stack centres
 * vertically; the text box is the only scrollable surface.
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

const PRESET = GOBLIN_PRESETS[0].id;

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

describe('QuestRunWindow — centred stack, no component scroll (R-259)', () => {
  // INV:R-259-no-component-scroll — the outer content column NEVER
  // scrolls: `overflow: hidden` on `.quest-s1-scroll`; only the narrative
  // text box may scroll internally.
  it('the outer column never scrolls (overflow hidden)', () => {
    const run = createRun(PRESET, 42, 'goblin');
    const { container } = renderWindow(run, []);
    const column = container.querySelector('.quest-s1-scroll') as HTMLElement;
    expect(column).toBeTruthy();
    expect(column.style.overflow).toBe('hidden');
    expect(column.style.overflowY).not.toBe('auto');
  });

  // INV:R-259-centered-stack — art + text + choices form ONE stack that
  // centres vertically (`justifyContent: center`) so slack splits
  // above/below instead of pooling between text and buttons.
  it('centres the art+text+choices stack vertically', () => {
    const run = createRun(PRESET, 42, 'goblin');
    const { container } = renderWindow(run, []);
    const stage = container.querySelector('[data-testid="quest-window-stage"]') as HTMLElement;
    const stack = stage.parentElement!;
    expect(stack.style.display).toBe('flex');
    expect(stack.style.flexDirection).toBe('column');
    expect(stack.style.justifyContent).toBe('center');
    /* the theatre lives in the same stack — art glued to the text */
    expect(stack.querySelector('[data-testid="quest-theatre"]')).toBeTruthy();
  });

  // INV:R-253-stage-top-flow — the narrative content flows TOP inside the
  // stage box: the Director rejected the bottom-anchor (R-253), so nothing
  // may re-anchor copy to the lower edge (`flex-end`).
  it('flows text top-down inside the stage (no bottom anchor)', () => {
    const run = createRun(PRESET, 42, 'goblin');
    const { container } = renderWindow(run, []);
    const stage = container.querySelector('[data-testid="quest-window-stage"]') as HTMLElement;
    expect(stage.style.justifyContent).not.toBe('flex-end');
    const beat: QuestBeat = { id: 'scene-0', kind: 'scene', nodeId: run.nodeId, title: 'Esplora', body: 'x'.repeat(80) };
    const { container: beatContainer } = renderWindow(run, [beat]);
    const beatStage = beatContainer.querySelector('[data-testid="quest-window-beat"]') as HTMLElement;
    expect(beatStage.style.justifyContent).not.toBe('flex-end');
  });

  // The beat stage also hugs its copy under the R-259-textbox-fit rule
  // (`maxHeight` cap, no fixed `height`) and never produces horizontal
  // scroll — tag kept unique in questRunWindow.stageHeight.test.tsx.
  it('the beat stage hugs its copy under the same cap', () => {
    const run = createRun(PRESET, 42, 'goblin');
    const beat: QuestBeat = { id: 'scene-0', kind: 'scene', nodeId: run.nodeId, title: 'Esplora', body: 'x'.repeat(80) };
    const { container } = renderWindow(run, [beat]);
    const stage = container.querySelector('[data-testid="quest-window-beat"]') as HTMLElement;
    expect(stage).toBeTruthy();
    expect(stage.style.maxHeight).not.toBe('');
    expect(stage.style.height).toBe('');
    expect(stage.style.overflowY).toBe('auto');
    expect(stage.style.overflowX).toBe('hidden');
  });
});
