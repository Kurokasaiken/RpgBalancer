/**
 * questPlannerWhyNames.test.tsx — R-258 wing contract:
 * the forecast plaque does NOT render the WHY section at all — neither the
 * risk-source names nor the Monte Carlo attribution («nel X% dei run · Y%
 * delle morti · Z% delle ferite») are player-facing; the fields stay on the
 * sim result, unrendered. And every signed delta badge prints «%» — never
 * «pp».
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { DndContext } from '@dnd-kit/core';
import { QuestExpeditionDetail } from '@/ui/idleVillage/quests/QuestExpeditionDetail';
import type { PartyEstimate } from '@/ui/idleVillage/questS1Lab/questOffer';
import type { QuestSimResult, ForecastDelta } from '@/ui/idleVillage/questS1Lab/questSimulation';
import { ENGINE_TEXT_IT } from '@/ui/idleVillage/questS1Lab/questEngineText';
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
  ],
  whyBySource: [
    { source: 'Ferro e cenere', runsPct: 100, woundSharePct: 82, deathSharePct: 60 },
    { source: 'Dagli la caccia', runsPct: 98, woundSharePct: 9, deathSharePct: 31 },
  ],
};

const READY_ESTIMATE: Exclude<PartyEstimate, 'incomplete'> = {
  sim: SIM,
  bands: { danger: 'low' },
  nSim: 400,
};

const DELTA: ForecastDelta = { rewardPp: 4, woundPp: -2, deathPp: 1, wipePp: 0, days: 0 };

const Detail: React.FC<{ delta?: ForecastDelta | null }> = ({ delta = null }) => (
  <Tooltip.Provider delayDuration={0}>
    <DndContext>
      <QuestExpeditionDetail
        poi={questPoiById('poi-goblin')!}
        scenario={GOBLIN_SCENARIO}
        resolved={null}
        resolvePending={false}
        slots={[]}
        estimate={READY_ESTIMATE}
        forecastDelta={delta}
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

describe('forecast WHY — the whole section is gone from the player UI (R-258)', () => {
  // INV:quest-expedition-detail.INV-2 — sim attribution is internals: no
  // section, no source names, no runs/wound/death shares reach the DOM.
  it('renders no WHY section — not even the source names', () => {
    render(<Detail />);
    expect(screen.queryByTestId('forecast-why')).not.toBeInTheDocument();
    expect(screen.queryByTestId('forecast-why-row')).not.toBeInTheDocument();
    const forecast = screen.getByTestId('quest-expedition-forecast');
    expect(forecast.textContent ?? '').not.toContain('Ferro e cenere');
    expect(forecast.textContent ?? '').not.toContain('Dagli la caccia');
    expect(forecast.textContent ?? '').not.toContain('questExpedition.why');
  });

  // INV:quest-expedition-detail.INV-2 — «%» is the only unit glyph the
  // player ever sees; the forecast deltas never print «pp».
  it('signed forecast deltas print %, never pp', () => {
    render(<Detail delta={DELTA} />);
    const forecast = screen.getByTestId('quest-expedition-forecast');
    expect(forecast).toHaveTextContent('(+4%)');
    expect(forecast).toHaveTextContent('(-2%)');
    expect(forecast.textContent ?? '').not.toMatch(/\bpp\b/i);
  });

  // INV:quest-engine-text.INV-1 — the engine catalogue is player-facing
  // text: no en template or it-IT line may print «pp» (only «%»).
  it('no engine line — en template or it-IT text — prints pp to the player', () => {
    const offenders = ENGINE_TEXT_IT.filter(([en, it]) => /\bpp\b/i.test(en) || /\bpp\b/i.test(it));
    expect(offenders).toEqual([]);
  });
});
