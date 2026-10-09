/**
 * T-010 combat legibility (E7): while the frontier is a combat node the
 * window shows the horde still standing, the hits coming back, and each
 * member's chance of taking the next one; a harm beat lands the -HP floater
 * on the hit member's own cell — who paid is visible, not a line of text.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import type { HarmBeat, QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';

const PRESET = GOBLIN_PRESETS[0].id;

/** Stands the run at the F4 combat node, frontier waiting for the order. */
const atCombat = (seed: number, goblinLeft = 5): QuestRunState => {
  const run = createRun(PRESET, seed, 'goblin');
  run.nodeId = 'gob-combattimento';
  run.visitedNodes.push('gob-combattimento');
  run.frontier = { status: 'waiting', startedAt: 0, readyAt: 0 };
  run.goblinLeft = goblinLeft;
  return run;
};

const harmOn = (memberId: string, amount = 12, kind: HarmBeat['harm']['kind'] = 'wound'): QuestBeat => ({
  id: `harm-t-${memberId}`,
  kind: 'harm',
  harm: { seq: 99, memberId, amount, kind, hpBefore: 60, hpAfter: 60 - amount },
  memberName: memberId,
  line: 'Colpito.',
});

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

describe('QuestRunWindow — combat strip (T-010)', () => {
  it('shows the horde still standing and the hits coming back', () => {
    renderWindow(atCombat(42, 5));
    const strip = screen.getByTestId('quest-combat-strip');
    // 6 authored enemies, 5 left → 5 filled pips + the incoming-hit readout.
    const pips = within(strip).getByTestId('combat-enemy-pips');
    expect(pips.children).toHaveLength(6);
    expect([...pips.children].filter((p) => p.getAttribute('data-filled') === 'true')).toHaveLength(5);
    expect(within(strip).getByText(/hit|colp/i)).toBeInTheDocument();
  });

  it('every living member carries a visible exposure chance that sums to ~100%', () => {
    renderWindow(atCombat(42));
    const chips = ['g1', 'g2', 'g3', 'g4'].map((id) =>
      within(screen.getByTestId(`combat-member-${id}`)).getByTestId(`combat-exposure-${id}`),
    );
    const total = chips.reduce((sum, c) => sum + Number(c.textContent!.replace('%', '')), 0);
    expect(total).toBeGreaterThanOrEqual(98);
    expect(total).toBeLessThanOrEqual(102);
  });

  it('does not render outside combat nodes', () => {
    const run = createRun(PRESET, 11, 'goblin');
    renderWindow(run);
    expect(screen.queryByTestId('quest-combat-strip')).toBeNull();
  });

  it('a harm beat lands the -HP floater on the hit member\'s own cell', () => {
    renderWindow(atCombat(42), [harmOn('g2', 12)]);
    const cell = screen.getByTestId('combat-member-g2');
    expect(within(cell).getByText('-12')).toBeInTheDocument();
    // …and on nobody else's.
    expect(within(screen.getByTestId('combat-member-g1')).queryByText(/-\d+/)).toBeNull();
  });
});
