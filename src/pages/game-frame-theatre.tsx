import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, pointerWithin } from '@dnd-kit/core';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { GameFrameScreen } from './game-frame';
import { PixiWorldMap, type PixiMapAnchor } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { MatericRosterComponent } from '@/ui/idleVillage/roster';
import { RosterKitShell } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { useQuestPoiSession } from '@/ui/idleVillage/quests/useQuestPoiSession';
// eslint-disable-next-line no-restricted-imports
import { MAP_QUEST_POI_TARGET, MapQuestPoi } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';
import { DirectorPanel, type DirectorAction } from '@/ui/idleVillage/components/gameFrame/DirectorPanel';
import { QuestTheatre } from '@/ui/idleVillage/questTheatre/QuestTheatre';
import { useFakeTheatreRun } from '@/ui/idleVillage/questTheatre/fakeTheatreRuntime';
import {
  theatreBlockedFixture,
  theatreDemoFixture,
  theatreUnsupportedFixture,
} from '@/ui/idleVillage/questTheatre/fixtures';

const FIXTURES = [theatreDemoFixture, theatreBlockedFixture, theatreUnsupportedFixture];

/** World-pixel position of the fake theatre POI — distinct from the real quest POI. */
const THEATRE_POI = { x: 2900, y: 1250, sizePx: 64 };

/**
 * `/game-frame-theatre` — QuestTheatre preview over the real Game Frame
 * surface (PLAN-021 T-004).
 *
 * The world runs the real session (clock, world loop, roster, real quest POI)
 * while a DISPOSABLE fake adapter drives a fixture through the theatre
 * read-model. The theatre quest has its own POI anchor with a binary
 * attention halo; closing the panel parks the run (it does not retreat).
 * Nothing here is canonical — it exists to watch the theatre over the live
 * map before S2 defines the real runtime contract.
 */
export default function GameFrameTheatrePage() {
  const { worldDressing, questPois } = DEFAULT_GAME_FRAME_CONFIG;
  const safeFit = worldDressing.safeFit.enabled ? worldDressing.safeFit : undefined;
  const poi = questPois[0];
  const { t } = useTranslation('idleVillage');
  const [questShown, setQuestShown] = useState(false);
  const [theatreOpen, setTheatreOpen] = useState(true);
  const [fixtureIndex, setFixtureIndex] = useState(0);

  const session = useQuestPoiSession({
    poiFlightTargetSelector: MAP_QUEST_POI_TARGET,
    initialActivityId: poi?.activityId,
  });

  const fixture = FIXTURES[fixtureIndex];
  const run = useFakeTheatreRun(fixture);

  const handleDirectorReset = useCallback(() => {
    setQuestShown(false);
    run.reset();
  }, [run]);

  const directorActions = useMemo<DirectorAction[]>(
    () => [
      {
        id: 'theatre-open',
        label: `Teatro: ${theatreOpen ? 'aperto' : 'chiuso'}`,
        active: theatreOpen,
        onTrigger: () => setTheatreOpen((o) => !o),
      },
      {
        id: 'theatre-auto',
        label: `Auto-avanzamento: ${run.autoAdvance ? 'on' : 'off'}`,
        active: run.autoAdvance,
        onTrigger: () => run.setAutoAdvance(!run.autoAdvance),
      },
      { id: 'theatre-step', label: 'Avanza nodo temporizzato', onTrigger: run.advanceOnce },
      {
        id: 'theatre-fixture',
        label: `Fixture: ${fixture.id}`,
        onTrigger: () => {
          setFixtureIndex((i) => (i + 1) % FIXTURES.length);
          run.reset();
        },
      },
      { id: 'quest', label: 'Mostra quest reale', active: questShown, onTrigger: () => setQuestShown(true) },
    ],
    [theatreOpen, run, fixture.id, questShown],
  );

  const needsAttention = run.snapshot.nodes.some((n) => n.state === 'awaitingPlayer');

  const anchors = useMemo<PixiMapAnchor[]>(
    () => [
      ...(poi && questShown
        ? [{ id: poi.id, x: poi.x, y: poi.y, node: <MapQuestPoi session={session} sizePx={poi.sizePx} /> }]
        : []),
      {
        id: 'theatre-poi',
        x: THEATRE_POI.x,
        y: THEATRE_POI.y,
        node: (
          <button
            type="button"
            data-testid="theatre-poi"
            aria-label={t('questTheatre.poi.label')}
            onClick={() => setTheatreOpen(true)}
            className="relative flex items-center justify-center rounded-full border border-amber-400/60 bg-slate-950/70 text-lg"
            style={{ width: THEATRE_POI.sizePx, height: THEATRE_POI.sizePx }}
          >
            {needsAttention && !theatreOpen && (
              <span
                data-testid="theatre-poi-halo"
                className="absolute inset-0 animate-ping rounded-full bg-amber-400/30"
              />
            )}
            📜
          </button>
        ),
      },
    ],
    [poi, questShown, session, needsAttention, theatreOpen, t],
  );

  return (
    <TooltipProvider>
      <RosterKitShell>
        <DndContext
          sensors={session.sensors}
          collisionDetection={pointerWithin}
          onDragStart={session.handleDragStart}
          onDragCancel={() => session.setDraggingResidentId(null)}
        >
          <GameFrameScreen
            rosterSlot={
              <MatericRosterComponent
                componentId="game-frame-roster"
                density="compact"
                useExternalDndContext
                onDragEnd={session.handleDragEnd}
                onFlightComplete={session.handleFlightComplete}
                onResidentSelect={session.handleResidentSelect}
                getResidentCompatibility={session.getResidentCompatibility}
                lockedResidentIds={session.lockedResidentIds}
                lockedStatusLabel={session.t('roster.status.assigned')}
                activeResidentId={session.draggingResidentId}
              />
            }
            overlaySlot={
              <>
                {session.overlays}
                {theatreOpen && (
                  <QuestTheatre
                    snapshot={run.snapshot}
                    dispatch={run.dispatch}
                    onClose={() => setTheatreOpen(false)}
                  />
                )}
                <DirectorPanel actions={directorActions} onReset={handleDirectorReset} />
              </>
            }
            renderMap={({ recenterSignal }) => (
              <PixiWorldMap
                manifestPath={worldDressing.manifestPath}
                hiddenLayerIds={worldDressing.hiddenLayerIds}
                safeFit={safeFit}
                recenterSignal={recenterSignal}
                anchors={anchors}
              />
            )}
          />
        </DndContext>
      </RosterKitShell>
    </TooltipProvider>
  );
}
