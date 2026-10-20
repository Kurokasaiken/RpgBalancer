import { useTranslation } from 'react-i18next';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { faseAt, pointAt, reversedRoute, type JourneyPolyline, type WorldPoint } from '@/ui/idleVillage/quests/questJourney';
import { QUEST_JOURNEY_ROUTE_CONFIG } from '@/ui/idleVillage/config/questJourneyRouteConfig';

/** World-space canvas dimensions matching the active Pixi map manifest. */
export interface QuestJourneyRouteCanvas {
  width: number;
  height: number;
}

/** Props for the non-interactive route overlay, derived only from a live run. */
export interface QuestJourneyRouteProps {
  run: QuestRunState;
  canvas: QuestJourneyRouteCanvas;
}

/**
 * Serializes the frozen route as an SVG polyline path in map-world pixels.
 * Keeping the path linear preserves the authored arc-length fractions used
 * by pins and the party frontier.
 */
function journeyRoutePathData(route: JourneyPolyline): string {
  return route.points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

/** SVG group for the selected party marker's three-figure silhouette. */
function PartyGlyph({ point }: { point: WorldPoint }) {
  const { partyGlyphScale } = QUEST_JOURNEY_ROUTE_CONFIG;
  return (
    <g transform={`translate(${point.x} ${point.y})`}>
      <circle
        r={QUEST_JOURNEY_ROUTE_CONFIG.partyHaloRadiusWorldPx}
        fill="var(--skin-glow-primary)"
        stroke="var(--skin-title-color)"
        strokeWidth={QUEST_JOURNEY_ROUTE_CONFIG.partyStrokeWidthWorldPx}
      />
      <circle
        r={QUEST_JOURNEY_ROUTE_CONFIG.partyCoreRadiusWorldPx}
        fill="var(--skin-astro-shadow-teal)"
        stroke="var(--skin-title-color)"
        strokeWidth={QUEST_JOURNEY_ROUTE_CONFIG.partyStrokeWidthWorldPx}
      />
      <g fill="var(--skin-text-primary)" transform={`scale(${partyGlyphScale})`}>
        <circle cx="-3.5" cy="-1" r="2.2" />
        <circle cx="3.5" cy="-1" r="2.2" />
        <circle cy="-3" r="2.2" />
        <path d="M-6 5 Q-5 1 -2 2 L0 4 L2 2 Q5 1 6 5 Z" />
      </g>
    </g>
  );
}

/**
 * Paints the active party's journey on the world map. The route is the
 * launch-frozen polyline; phase, progress, and parking come only from the
 * persisted journey journal, so the marker cannot drift from the engine.
 */
export function QuestJourneyRoute({ run, canvas }: QuestJourneyRouteProps) {
  const { t } = useTranslation('idleVillage');
  const journey = run.journey;
  if (!journey || run.ended) return null;

  const { snapshot, journal } = journey;
  const phase = journal.currentFase;
  const route = phase === 'ritorno' ? reversedRoute(snapshot.route) : snapshot.route;
  const view = faseAt(snapshot, journal);
  const progress = phase === 'svolgimento' ? 1 : view.routeProgress;
  const frontier = pointAt(route, progress);
  const start = route.points[0];
  const destination = route.points[route.points.length - 1];
  const path = journeyRoutePathData(route);
  const filledLength = route.totalLength * progress;
  const phaseLabel = t(`gameFrame.questJourney.phase.${phase}`);

  return (
    <svg
      aria-hidden="false"
      aria-label={t('gameFrame.questJourney.routeProgress', {
        phase: phaseLabel,
        progress: Math.round(progress * 100),
      })}
      className="quest-journey-route"
      data-fase={phase}
      data-parked={String(view.parked)}
      data-quest-id={run.questId}
      data-route-progress={progress.toFixed(4)}
      data-testid="quest-journey-route"
      focusable="false"
      height={canvas.height}
      role="img"
      style={{ display: 'block', pointerEvents: 'none', overflow: 'visible' }}
      viewBox={`0 0 ${canvas.width} ${canvas.height}`}
      width={canvas.width}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={path}
        fill="none"
        stroke="var(--skin-astro-shadow-teal)"
        strokeWidth={QUEST_JOURNEY_ROUTE_CONFIG.casingWidthWorldPx}
        strokeLinejoin="round"
        strokeLinecap="butt"
      />
      <path
        d={path}
        fill="none"
        opacity="0.58"
        stroke="var(--skin-text-primary)"
        strokeDasharray={`${QUEST_JOURNEY_ROUTE_CONFIG.guideDashWorldPx} ${QUEST_JOURNEY_ROUTE_CONFIG.guideGapWorldPx}`}
        strokeWidth={QUEST_JOURNEY_ROUTE_CONFIG.guideWidthWorldPx}
        strokeLinejoin="round"
        strokeLinecap="butt"
      />
      <path
        data-testid="quest-journey-route-progress"
        d={path}
        fill="none"
        stroke="var(--skin-title-color)"
        strokeDasharray={`${filledLength} ${route.totalLength}`}
        strokeWidth={QUEST_JOURNEY_ROUTE_CONFIG.progressWidthWorldPx}
        strokeLinejoin="round"
        strokeLinecap="butt"
      />
      <path
        d={path}
        fill="none"
        opacity="0.86"
        stroke="var(--skin-text-primary)"
        strokeDasharray={`${filledLength} ${route.totalLength}`}
        strokeWidth={QUEST_JOURNEY_ROUTE_CONFIG.highlightWidthWorldPx}
        strokeLinejoin="round"
        strokeLinecap="butt"
      />
      <g transform={`translate(${start.x} ${start.y})`}>
        <circle
          r={QUEST_JOURNEY_ROUTE_CONFIG.endpointRadiusWorldPx}
          fill="var(--skin-astro-shadow-teal)"
          stroke="var(--skin-title-color)"
          strokeWidth={QUEST_JOURNEY_ROUTE_CONFIG.endpointStrokeWidthWorldPx}
        />
        <circle
          r={QUEST_JOURNEY_ROUTE_CONFIG.endpointCoreRadiusWorldPx}
          fill="var(--skin-title-color)"
        />
      </g>
      <g transform={`translate(${destination.x} ${destination.y})`}>
        <circle
          r={QUEST_JOURNEY_ROUTE_CONFIG.endpointRadiusWorldPx}
          fill="var(--skin-astro-shadow-teal)"
          stroke="var(--skin-title-color)"
          strokeWidth={QUEST_JOURNEY_ROUTE_CONFIG.endpointStrokeWidthWorldPx}
        />
        <circle
          r={QUEST_JOURNEY_ROUTE_CONFIG.endpointCoreRadiusWorldPx}
          fill="var(--skin-title-color)"
        />
      </g>
      <PartyGlyph point={frontier} />
    </svg>
  );
}
