/**
 * PLAN-071 T-A8 (R-239) — the check owns the quest window while it is held.
 *
 * Video audit (Director, 2026-10-21): two broken paths when the window goes
 * away mid-check —
 *   C1 minimised: the astrolabe column kept painting at its last wing
 *     geometry, orphaned over the map (the cluster never learned the window
 *     had collapsed to a strip);
 *   C2 closed: the X unmounted the window → the published bridge cleared →
 *     no surface could paint the check at all (evaporation, only the outcome
 *     toast remained).
 *
 * Contract:
 * - the window reports its minimised state upward (`onMinimisedChange`) so
 *   the cluster can drop the wings and let the overlay fallback mount;
 * - the close button is disabled while a check beat is held — the check's
 *   presentation survives until dismissed (the verdict lives on the check
 *   surface until the player has seen it).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { applyChoice, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import type { QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';

const PRESET = GOBLIN_PRESETS[0].id;

/** A run that just committed a check — `checkQueue[0]` is the resolved check
 *  a held check-beat presents. */
const runWithCheck = (seed: number): { run: QuestRunState; checkBeat: QuestBeat } => {
  const run = createRun(PRESET, seed, 'goblin');
  applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
  const check = run.checkQueue[0];
  if (!check) throw new Error('fixture: choice did not produce a check');
  return { run, checkBeat: { id: check.id, kind: 'check', check } };
};

const renderWindow = (run: QuestRunState, queuedBeats: QuestBeat[], onClose = vi.fn(), onMinimisedChange?: (m: boolean) => void) =>
  render(
    <Tooltip.Provider>
      <QuestRunWindow
        run={run}
        phases={[emptyPhase(0)]}
        beats={GOBLIN_SCENARIO.beats}
        queuedBeats={queuedBeats}
        /* Held: the check beat parks until dismissed — astroActive stays on. */
        beatTiming={{ sceneMs: 60000, checkMs: 60000, harmMs: 60000, endMs: 60000, recapMs: 60000 }}
        title={GOBLIN_SCENARIO.title}
        flavour={GOBLIN_SCENARIO.flavour}
        artFor={() => undefined}
        time={{ progress: 0, label: 'Giorno 1 di 2' }}
        onChoose={() => undefined}
        armedFlags={new Set()}
        onToggleArmedFlag={() => undefined}
        onClose={onClose}
        onMinimisedChange={onMinimisedChange}
        anchor={{ left: 0, top: 0 }}
        widthPx={640}
        theaterAspect={2.9}
        tooltipLines={6}
      />
    </Tooltip.Provider>,
  );

describe('QuestRunWindow — a held check owns the window (R-239)', () => {
  // INV:R-239-check-held-window — while a check beat is held the close button
  // is disabled and says why: closing would evaporate the check presentation
  // (the bridge dies with the window and no fallback surface can mount).
  it('disables the close button while a check beat is held', () => {
    const onClose = vi.fn();
    const { run, checkBeat } = runWithCheck(42);
    renderWindow(run, [checkBeat], onClose);
    const close = screen.getByRole('button', { name: /close panel/i });
    expect(close).toBeDisabled();
    expect(close.getAttribute('title')).toBeTruthy();
    fireEvent.click(close);
    expect(onClose).not.toHaveBeenCalled();
  });

  // INV:R-239-check-held-window — with no held check the close button works.
  it('lets the close button work when no check is held', () => {
    const onClose = vi.fn();
    const { run } = runWithCheck(42);
    renderWindow(run, [], onClose);
    const close = screen.getByRole('button', { name: /close panel/i });
    expect(close).not.toBeDisabled();
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // INV:R-239-check-held-window — the strip state is published so the cluster
  // can drop orphaned wings: report on mount, on minimise, on restore, and
  // false again on unmount.
  it('reports the minimised state upward (mount/minimise/restore/unmount)', () => {
    const spy = vi.fn();
    const { run, checkBeat } = runWithCheck(42);
    const { unmount } = renderWindow(run, [checkBeat], vi.fn(), spy);
    expect(spy).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByRole('button', { name: /minimise/i }));
    expect(spy).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: /reopen/i }));
    expect(spy).toHaveBeenLastCalledWith(false);
    unmount();
    expect(spy).toHaveBeenLastCalledWith(false);
  });
});
