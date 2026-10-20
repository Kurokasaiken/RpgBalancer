import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { QuestJourneyPhaseStrip } from '@/ui/idleVillage/components/gameFrame/QuestJourneyPhaseStrip';
import { buildJourneyPolyline } from '@/ui/idleVillage/quests/questJourney';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestFase } from '@/ui/idleVillage/quests/questJourney';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) => {
      const fixed: Record<string, string> = {
        'gameFrame.questJourney.phase.andata': 'outbound',
        'gameFrame.questJourney.phase.svolgimento': 'at the quest site',
        'gameFrame.questJourney.phase.ritorno': 'returning',
      };
      if (fixed[key]) return fixed[key];
      return `${key}:${values?.days ?? values?.count ?? ''}`;
    },
  }),
}));

const ROUTE = buildJourneyPolyline({ x: 0, y: 0 }, { x: 100, y: 0 });

/** Minimal journey carrier: 2-day legs at 10 ticks/day, POI estimate 30 ticks. */
function makeRun(
  fase: QuestFase,
  processedUpToTick: number,
  opts: { parked?: boolean; loot?: number; ended?: boolean } = {},
): QuestRunState {
  return {
    questId: 'goblin',
    ended: opts.ended ?? false,
    loot: Array.from({ length: opts.loot ?? 0 }, (_, i) => `item-${i}`),
    journey: {
      snapshot: {
        route: ROUTE,
        travelDays: 2,
        ticksPerDay: 10,
        pins: {},
      },
      journal: {
        currentFase: fase,
        faseStartedAtTick: 0,
        processedUpToTick,
        accumulatedParkedTicks: 0,
        parkedNodeId: opts.parked ? 'road-choice' : null,
        beats: [],
      },
    },
  } as unknown as QuestRunState;
}

/** Renders the strip to static markup — the footer never mounts PixiJS. */
function markup(run: QuestRunState, estimateTicks = 30): string {
  return renderToStaticMarkup(
    <QuestJourneyPhaseStrip run={run} svolgimentoEstimateTicks={estimateTicks} />,
  );
}

describe('QuestJourneyPhaseStrip', () => {
  // INV:quest-journey-phase-strip.INV-1
  it('renders the three legs with exact Nd / estimated ~Nd / exact Nd labels', () => {
    const html = markup(makeRun('andata', 10));

    expect((html.match(/data-testid="quest-journey-fase"/g) ?? []).length).toBe(3);
    expect(html).toContain('gameFrame.questJourney.days:2'); // andata 2d, ritorno 2d
    expect(html).toContain('gameFrame.questJourney.daysEstimate:3'); // 30 ticks / 10 → ~3d
    expect(html).toContain('data-fase="andata" data-current="true"');
    expect(html).toContain('data-fase="andata" data-current="true" data-progress="0.5000"');
    expect(html).toContain('data-fase="svolgimento" data-current="false" data-progress="0.0000"');
    expect(html).toContain('data-fase="ritorno" data-current="false" data-progress="0.0000"');
  });

  it('marks andata complete during svolgimento and fills the live leg against the estimate', () => {
    const html = markup(makeRun('svolgimento', 15));

    expect(html).toContain('data-fase="andata" data-current="false" data-progress="1.0000"');
    expect(html).toContain('data-fase="svolgimento" data-current="true" data-progress="0.5000"');
    expect(html).toContain('data-fase="ritorno" data-current="false" data-progress="0.0000"');
  });

  it('keeps ritorno equal to andata and never regresses elapsed fasi', () => {
    const html = markup(makeRun('ritorno', 5));

    expect(html).toContain('data-fase="andata" data-current="false" data-progress="1.0000"');
    expect(html).toContain('data-fase="svolgimento" data-current="false" data-progress="1.0000"');
    expect(html).toContain('data-fase="ritorno" data-current="true" data-progress="0.2500"');
  });

  it('shows the «waiting for a decision» chip only while parked', () => {
    const parked = markup(makeRun('andata', 5, { parked: true }));
    const free = markup(makeRun('andata', 5));

    expect(parked).toContain('data-parked="true"');
    expect(parked).toContain('quest-journey-parked');
    expect(parked).toContain('gameFrame.questJourney.awaitingDecision');
    expect(free).toContain('data-parked="false"');
    expect(free).not.toContain('quest-journey-parked');
  });

  it('shows the loot count chip on ritorno only', () => {
    const returning = markup(makeRun('ritorno', 5, { loot: 3 }));
    const outbound = markup(makeRun('andata', 5, { loot: 3 }));

    expect(returning).toContain('quest-journey-loot');
    expect(returning).toContain('gameFrame.questJourney.lootChip:3');
    expect(outbound).not.toContain('quest-journey-loot');
  });

  it('renders nothing for legacy runs and settled runs', () => {
    const legacy = renderToStaticMarkup(
      <QuestJourneyPhaseStrip run={{ questId: 'goblin', ended: false, loot: [] } as QuestRunState} />,
    );
    const settled = markup(makeRun('ritorno', 20, { ended: true }));

    expect(legacy).toBe('');
    expect(settled).toBe('');
  });
});
