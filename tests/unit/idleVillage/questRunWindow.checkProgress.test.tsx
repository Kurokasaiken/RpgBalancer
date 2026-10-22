/**
 * R-241 B3 (quest-run-window.INV-3) — clicking the stage while a check beat
 * is held must PROGRESS the astrolabe (throw → spin → skip), never jump
 * straight to `skipToResult` before the ball has flown.
 *
 * Director (2026-10-21): «quando clicco lo skill check nn parte l'animazione
 * della pallina». Root cause: `advancePresentation` called
 * `checkHandleRef.current?.skipToResult()` unconditionally — the verdict
 * landed instantly and the spin never played. Fix: the imperative channel
 * gains `progress()` (throw if not spinning, skip if spinning) and the
 * window calls it here.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { applyChoice, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import type { QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import { useQuestRunStore, type QuestCheckOverlayHandle } from '@/ui/idleVillage/questS1Lab/questRunStore';
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

describe('QuestRunWindow — held check: a click progresses the astrolabe (R-241)', () => {
  // INV:quest-run-window.INV-3 — while the held check is unsettled the
  // click-through calls `progress()` (throw → skip), not `skipToResult()`.
  it('routes the stage click to progress(), not straight to skipToResult()', () => {
    const run = createRun(PRESET, 42, 'goblin');
    applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
    const check = run.checkQueue[0];
    expect(check).toBeDefined();
    const beat: QuestBeat = { id: check.id, kind: 'check', check };
    const { container } = renderWindow(run, [beat]);

    /* The window published the check bridge; inject the imperative handle a
     * mounted presenter (column/overlay) would have filled. */
    const bridge = useQuestRunStore.getState().bridges[run.questId];
    expect(bridge).toBeTruthy();
    const progress = vi.fn();
    const skipToResult = vi.fn();
    bridge!.handle.current = { progress, skipToResult, throwNow: vi.fn() } as unknown as QuestCheckOverlayHandle;

    fireEvent.click(container.querySelector('[data-testid="quest-window-beat"]')!);

    expect(progress).toHaveBeenCalledTimes(1);
    expect(skipToResult).not.toHaveBeenCalled();
  });
});
