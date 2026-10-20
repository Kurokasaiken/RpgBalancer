import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { QuestJourneyRoute } from '@/ui/idleVillage/components/gameFrame/QuestJourneyRoute';
import { QuestJourneyRouteConfigSchema } from '@/ui/idleVillage/config/questJourneyRouteConfig';
import { buildJourneyPolyline } from '@/ui/idleVillage/quests/questJourney';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) => {
      if (key === 'gameFrame.questJourney.phase.andata') return 'outbound';
      return `${key}:${values?.phase ?? ''}:${values?.progress ?? ''}`;
    },
  }),
}));

const ROUTE = buildJourneyPolyline({ x: 10, y: 20 }, { x: 110, y: 220 });
const CANVAS = { width: 4240, height: 2828 };

/** Builds the smallest journey carrier consumed by the SVG route overlay. */
function makeRun(
  fase: 'andata' | 'svolgimento' | 'ritorno',
  processedUpToTick: number,
  accumulatedParkedTicks = 0,
  ended = false,
): QuestRunState {
  return {
    questId: 'goblin',
    ended,
    journey: {
      snapshot: {
        route: ROUTE,
        travelDays: 2,
        ticksPerDay: 10,
        pins: {},
        runSeed: 42,
        engineSchemaVersion: 2,
        scenarioHash: 'test-hash',
        journeyEnabled: true,
        fasePlans: { andata: [], ritorno: [] },
        svolgimentoEntryNodeId: 'gob-inizio',
      },
      journal: {
        currentFase: fase,
        faseStartedAtTick: 0,
        processedUpToTick,
        accumulatedParkedTicks,
        parkedNodeId: accumulatedParkedTicks > 0 ? 'road-choice' : null,
        beats: [],
      },
    },
  } as unknown as QuestRunState;
}

/** Renders the route component without mounting PixiJS or a browser canvas. */
function markup(run: QuestRunState): string {
  return renderToStaticMarkup(<QuestJourneyRoute run={run} canvas={CANVAS} />);
}

describe('QuestJourneyRoute', () => {
  // INV:quest-journey-route.INV-1
  it('draws a continuous route fill and puts the party at the authoritative progress frontier', () => {
    const html = markup(makeRun('andata', 5));

    expect(html).toContain('data-fase="andata"');
    expect(html).toContain('data-route-progress="0.2500"');
    expect(html).toContain('stroke-dasharray="55.90169943749474 223.60679774997897"');
    expect(html).toContain('d="M 10 20 L 110 220"');
    expect(html).toContain('translate(35 70)');
    expect(html).toContain('stroke-linecap="butt"');
    expect(html).toContain('aria-label="gameFrame.questJourney.routeProgress:outbound:25"');
  });

  it('parks the marker by subtracting accumulated waiting time from route travel', () => {
    const html = markup(makeRun('andata', 10, 4));

    expect(html).toContain('data-parked="true"');
    expect(html).toContain('data-route-progress="0.3000"');
    expect(html).toContain('translate(40 80)');
  });

  it('reverses the same polyline on ritorno and anchors the party at its reverse frontier', () => {
    const html = markup(makeRun('ritorno', 5));

    expect(html).toContain('data-fase="ritorno"');
    expect(html).toContain('d="M 110 220 L 10 20"');
    expect(html).toContain('translate(85 170)');
  });

  it('holds the party at the POI during svolgimento and hides settled or legacy runs', () => {
    const atPoi = markup(makeRun('svolgimento', 5));

    expect(atPoi).toContain('data-route-progress="1.0000"');
    expect(atPoi).toContain('translate(110 220)');
    expect(markup(makeRun('ritorno', 5, 0, true))).toBe('');
    expect(renderToStaticMarkup(<QuestJourneyRoute run={{ questId: 'goblin', ended: false } as QuestRunState} canvas={CANVAS} />)).toBe('');
  });

  it('validates the route visual dimensions and rejects a casing narrower than its fill', () => {
    expect(() =>
      QuestJourneyRouteConfigSchema.parse({
        casingWidthWorldPx: 2,
        guideWidthWorldPx: 1,
        guideDashWorldPx: 1,
        guideGapWorldPx: 2,
        progressWidthWorldPx: 3,
        highlightWidthWorldPx: 1,
        endpointRadiusWorldPx: 4,
        endpointCoreRadiusWorldPx: 2,
        endpointStrokeWidthWorldPx: 1,
        partyHaloRadiusWorldPx: 8,
        partyCoreRadiusWorldPx: 4,
        partyStrokeWidthWorldPx: 1,
        partyGlyphScale: 1,
      }),
    ).toThrow();
  });
});
