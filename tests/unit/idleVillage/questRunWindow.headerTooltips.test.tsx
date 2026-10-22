/**
 * PLAN-071 T-B4 (R-239) — the quest window header icons carry consistent,
 * styled Radix tooltips (same chrome as the timeline tiles) instead of bare
 * native `title` hints.
 *
 * Video audit (Director, 2026-10-21): the header strip mixes labeled pills and
 * bare icons — the player has to learn by clicking. The contract: every header
 * control announces itself with the same tooltip skin; a disabled control
 * (close while a check is held) still explains itself.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { applyChoice, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import type { QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';

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
        artFor={() => undefined}
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

describe('QuestRunWindow header tooltips (R-239)', () => {
  // INV:R-239-header-tooltips — pills, check-options, minimise and close all
  // surface the same Radix tooltip chrome (a `role="tooltip"` popover naming
  // the control), not just a silent native title.
  it('every header control opens a styled tooltip on focus', async () => {
    renderWindow(createRun(GOBLIN_PRESETS[0].id, 42, 'goblin'));
    const controls = [
      screen.getByTestId('quest-party-toggle'),
      screen.getByTestId('quest-belt-toggle'),
      screen.getByTestId('quest-log-toggle'),
      screen.getByTestId('quest-check-options-toggle'),
      screen.getByRole('button', { name: /minimise|minimize/i }),
      screen.getByRole('button', { name: /close panel/i }),
    ];
    for (const control of controls) {
      // header controls are icon-only — the accessible name is the contract.
      expect(control.getAttribute('aria-label')).toBeTruthy();
      fireEvent.focus(control);
      const tip = await screen.findByRole('tooltip');
      expect(tip.textContent).toBe(control.getAttribute('aria-label'));
      fireEvent.blur(control);
      await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
    }
  });

  // INV:R-239-header-tooltips — a held check disables close; the disabled
  // button swallows pointer events, so the reason rides on the Radix wrapper
  // and the tooltip still opens.
  it('the disabled close button still explains itself', async () => {
    const run = createRun(GOBLIN_PRESETS[0].id, 42, 'goblin');
    applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
    const check = run.checkQueue[0];
    if (!check) throw new Error('fixture: no check produced');
    renderWindow(run, [{ id: check.id, kind: 'check', check }]);
    const close = screen.getByRole('button', { name: /close panel/i });
    expect(close).toBeDisabled();
    // The trigger is the wrapper span (button is disabled): focus it.
    const wrapper = close.closest('span[tabindex]') as HTMLElement;
    expect(wrapper).toBeTruthy();
    fireEvent.focus(wrapper);
    const tip = await screen.findByRole('tooltip');
    expect(tip.textContent?.length).toBeGreaterThan(0);
  });
});
