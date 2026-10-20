import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { faseAt, pointAt, reversedRoute, type JourneyPolyline, type WorldPoint } from '@/ui/idleVillage/quests/questJourney';
import { QUEST_JOURNEY_ROUTE_CONFIG } from '@/ui/idleVillage/config/questJourneyRouteConfig';
import { EngravedIcon } from './engravedIcons';

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

/** Small seal anchored to the party marker: a disc plus a centered glyph
 *  child. Colours follow the skin tokens exactly like the route stroke. */
function MarkerBadge({
  point,
  dy,
  label,
  testId,
  children,
}: {
  point: WorldPoint;
  dy: number;
  label: string;
  testId: string;
  children: ReactNode;
}) {
  const { markerBadgeRadiusWorldPx: r, partyStrokeWidthWorldPx: sw } = QUEST_JOURNEY_ROUTE_CONFIG;
  return (
    <g
      aria-label={label}
      data-testid={testId}
      role="img"
      transform={`translate(${point.x} ${point.y + dy})`}
    >
      <circle r={r} fill="var(--skin-hud-lacquer-deep)" stroke="var(--skin-title-color)" strokeWidth={sw * 0.7} />
      {children}
    </g>
  );
}

/** Crossroads glyph for a parked frontier — two roads meeting. */
function CrossroadsGlyph() {
  const g = QUEST_JOURNEY_ROUTE_CONFIG.markerBadgeGlyphWorldPx / 2;
  return (
    <path
      d={`M${-g} ${-g} L${g} ${g} M${-g} ${g} L${g} ${-g} M${-g} 0 L${g} 0`}
      stroke="var(--skin-status-unmet)"
      strokeWidth={g * 0.45}
      strokeLinecap="round"
      fill="none"
    />
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
      {view.parked && (
        <MarkerBadge
          point={frontier}
          dy={-QUEST_JOURNEY_ROUTE_CONFIG.markerBadgeOffsetWorldPx}
          label={t('gameFrame.questJourney.parkedBadge')}
          testId="quest-journey-route-badge-parked"
        >
          <CrossroadsGlyph />
        </MarkerBadge>
      )}
      {phase === 'ritorno' && (run.loot?.length ?? 0) > 0 && (
        <MarkerBadge
          point={frontier}
          dy={QUEST_JOURNEY_ROUTE_CONFIG.markerBadgeOffsetWorldPx}
          label={t('gameFrame.questJourney.lootBadge', { count: run.loot.length })}
          testId="quest-journey-route-badge-loot"
        >
          <EngravedIcon
            id="ico-pouch"
            size={QUEST_JOURNEY_ROUTE_CONFIG.markerBadgeGlyphWorldPx}
            x={-QUEST_JOURNEY_ROUTE_CONFIG.markerBadgeGlyphWorldPx / 2}
            y={-QUEST_JOURNEY_ROUTE_CONFIG.markerBadgeGlyphWorldPx / 2}
            color="var(--skin-label-primary)"
            aria-hidden
          />
        </MarkerBadge>
      )}
    </svg>
  );
}
