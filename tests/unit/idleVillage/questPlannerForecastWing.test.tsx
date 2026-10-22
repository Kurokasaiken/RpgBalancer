/**
 * questPlannerForecastWing.test.tsx — R-248 wing contract:
 * the pinned forecast plaque must not collapse to a one-line state on every
 * party edit (the resize the Director sees on each add/remove). While a
 * fresh sim is in flight — or the party is momentarily incomplete — the
 * LAST completed estimate stays mounted beneath the state line, marked
 * `data-forecast-stale`, so the wing's footprint never oscillates.
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { DndContext } from '@dnd-kit/core';
import { QuestExpeditionDetail } from '@/ui/idleVillage/quests/QuestExpeditionDetail';
import type { PartyEstimate } from '@/ui/idleVillage/questS1Lab/questOffer';
import type { QuestSimResult } from '@/ui/idleVillage/questS1Lab/questSimulation';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { questPoiById } from '@/balancing/config/idleVillage/quests/questPois';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && 'qty' in opts ? `${key}:${opts.qty}` : key,
  }),
}));

const SIM: QuestSimResult = {
  runs: 400,
  outcomePct: { reward: 80, survived: 10, fled: 5, wipe: 5 },
  deathsDistPct: [90, 8, 2],
  zeroDeathsPct: 90,
  anyDeathPct: 10,
  twoPlusDeathsPct: 2,
  avgDeathsOnReward: 0,
  anyWoundPct: 30,
  avgWounded: 0.3,
  leaderWoundPct: 20,
  leaderDeathPct: 5,
  leaderDowntimeDays: 1,
  daysAvg: 20,
  daysMin: 15,
  daysMax: 26,
  daysP50: 20,
  daysP90: 26,
  goldAvg: 100,
  treasureAvg: 10,
  lootAvgCount: 2,
  optionalPct: { relic: 0, guardLoot: 0, chestLoot: 0, viandanteHelped: 0 },
  humanDaysAvg: 20,
  woundedDowntimeAvg: 1,
  perMember: [
    { id: 'r1', name: 'Alfa', role: 'leader', healthyPct: 65, woundPct: 30, deathPct: 5, downtimeDays: 1 },
    { id: 'r2', name: 'Beta', role: 'member', healthyPct: 75, woundPct: 22, deathPct: 3, downtimeDays: 0 },
  ],
  whyBySource: [
    { source: 'Lupo del passo', runsPct: 40, woundSharePct: 60, deathSharePct: 70 },
  ],
};

const READY_ESTIMATE: Exclude<PartyEstimate, 'incomplete'> = {
  sim: SIM,
  bands: { danger: 'low' },
  nSim: 400,
};

const Detail: React.FC<{ estimate: PartyEstimate | 'computing' }> = ({ estimate }) => (
  <Tooltip.Provider delayDuration={0}>
    <DndContext>
      <QuestExpeditionDetail
        poi={questPoiById('poi-goblin')!}
        scenario={GOBLIN_SCENARIO}
        resolved={null}
        resolvePending={false}
        slots={[]}
        estimate={estimate}
        forecastDelta={null}
        intelHints={[]}
        expeditionDuration={{ nodeTicks: 50, estimatedTicks: 250, factor: 1 }}
        requiredFilled={false}
        items={[]}
        selectedItemIds={[]}
        onToggleItem={() => {}}
        onOpenStash={() => {}}
        canSend={false}
        onSend={() => {}}
        onClose={() => {}}
        onSlotClear={() => {}}
      />
    </DndContext>
  </Tooltip.Provider>
);

describe('forecast wing — keeps the last completed estimate while the party edits (R-248)', () => {
  // INV:quest-expedition-detail.INV-1 — 'computing' swaps the whole forecast
  // for a one-line placeholder: the plaque collapses and re-expands on every
  // add. The state must be a marker ON the kept content, never a replacement.
  it('keeps chips and member rows mounted through a computing pass', () => {
    const { rerender } = render(<Detail estimate={READY_ESTIMATE} />);
    expect(screen.getByTestId('forecast-member-r1')).toBeInTheDocument();
    expect(screen.getByTestId('forecast-reward-pct')).toBeInTheDocument();

    rerender(<Detail estimate="computing" />);
    const forecast = screen.getByTestId('quest-expedition-forecast');
    expect(forecast).toHaveAttribute('data-forecast-state', 'computing');
    expect(forecast).toHaveTextContent('questExpedition.forecast.computing');
    expect(screen.getByTestId('forecast-member-r1')).toBeInTheDocument();
    expect(screen.getByTestId('forecast-member-r2')).toBeInTheDocument();
    expect(screen.getByTestId('forecast-reward-pct')).toBeInTheDocument();
    /* The kept numbers are marked stale — they describe the previous
     * configuration, not the one now being computed. */
    expect(forecast).toHaveAttribute('data-forecast-stale', 'true');
  });

  it('keeps the last estimate mounted through an incomplete pass too', () => {
    const { rerender } = render(<Detail estimate={READY_ESTIMATE} />);
    rerender(<Detail estimate="incomplete" />);
    const forecast = screen.getByTestId('quest-expedition-forecast');
    expect(forecast).toHaveAttribute('data-forecast-state', 'incomplete');
    expect(forecast).toHaveTextContent('questExpedition.forecast.incomplete');
    expect(screen.getByTestId('forecast-member-r1')).toBeInTheDocument();
    expect(forecast).toHaveAttribute('data-forecast-stale', 'true');
  });

  it('a fresh sim landing replaces the kept estimate and clears the stale mark', () => {
    const { rerender } = render(<Detail estimate={READY_ESTIMATE} />);
    rerender(<Detail estimate="computing" />);
    const next: Exclude<PartyEstimate, 'incomplete'> = {
      ...READY_ESTIMATE,
      sim: { ...SIM, perMember: [SIM.perMember[0]] },
    };
    rerender(<Detail estimate={next} />);
    const forecast = screen.getByTestId('quest-expedition-forecast');
    expect(forecast).toHaveAttribute('data-forecast-state', 'ready');
    expect(forecast).not.toHaveAttribute('data-forecast-stale');
    expect(screen.getByTestId('forecast-member-r1')).toBeInTheDocument();
    expect(screen.queryByTestId('forecast-member-r2')).toBeNull();
  });

  it('first mount with no completed estimate still shows the plain state', () => {
    render(<Detail estimate="computing" />);
    const forecast = screen.getByTestId('quest-expedition-forecast');
    expect(forecast).toHaveAttribute('data-forecast-state', 'computing');
    expect(forecast).not.toHaveAttribute('data-forecast-stale');
    expect(forecast).toHaveTextContent('questExpedition.forecast.computing');
    expect(screen.queryByTestId('forecast-member-r1')).toBeNull();
  });
});
