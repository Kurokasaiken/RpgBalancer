import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useQuestRun } from '@/ui/idleVillage/questS1Lab/useQuestRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questScenarioGoblin';

/** World-pixel position of the theatre POI — distinct from the real quest POI. */
const THEATRE_POI = { x: 2900, y: 1250, sizePx: 64 };
/** Local tick: one second of wall time = one tick; a maturable node breathes
 *  for THEATRE_NODE_TICKS seconds (same pacing as the window lab). */
const THEATRE_NODE_TICKS = 3;

/**
 * `/game-frame-theatre` — QuestTheatre driven by the REAL quest engine
 * (PLAN-025 T-007, D-F: the theatre converges inside `QuestRunWindow`; this
 * route keeps it mounted in parallel on the same runtime until acceptance).
 *
 * The world runs the real session (clock, world loop, roster, real quest POI)
 * while `useQuestRun` + `createQuestRunAdapter` feed the theatre a real
 * `TheatreRunView`: pending nodes mature on a local 1s tick, decision nodes
 * wait, `fight-turn` plays combat. Closing the panel parks the run — it does
 * not retreat.
 */
export default function GameFrameTheatrePage() {
  const { worldDressing, questPois } = DEFAULT_GAME_FRAME_CONFIG;
  const safeFit = worldDressing.safeFit.enabled ? worldDressing.safeFit : undefined;
  const poi = questPois[0];
  const { t } = useTranslation('idleVillage');
  const [questShown, setQuestShown] = useState(false);
  const [theatreOpen, setTheatreOpen] = useState(true);
  const [clockOn, setClockOn] = useState(true);

  const session = useQuestPoiSession({
    poiFlightTargetSelector: MAP_QUEST_POI_TARGET,
    initialActivityId: poi?.activityId,
  });

  // Real engine: same adapter + frontier the canonical window consumes.
  const questRun = useQuestRun('goblin');
  const tickRef = useRef(0);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!clockOn) return;
    const id = window.setInterval(() => {
      tickRef.current += 1;
      setTick(tickRef.current);
      questRun.syncClock(tickRef.current);
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clockOn, questRun.syncClock]);

  const snapshot = useMemo(
    () => questRun.adapter.getSnapshot(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questRun.adapter, questRun.run, tick],
  );

  const directorActions = useMemo<DirectorAction[]>(
    () => [
      {
        id: 'theatre-open',
        label: `Teatro: ${theatreOpen ? 'aperto' : 'chiuso'}`,
        active: theatreOpen,
        onTrigger: () => setTheatreOpen((o) => !o),
      },
      {
        id: 'theatre-clock',
        label: `Orologio teatro: ${clockOn ? 'on' : 'off'}`,
        active: clockOn,
        onTrigger: () => setClockOn((c) => !c),
      },
      {
        id: 'theatre-start',
        label: questRun.run ? 'Riavvia quest goblin' : 'Avvia quest goblin',
        onTrigger: () => {
          questRun.clear();
          questRun.start(GOBLIN_PRESETS[0].id, { nodeTicks: THEATRE_NODE_TICKS, startTick: tickRef.current });
        },
      },
      { id: 'theatre-clear', label: 'Cancella run', onTrigger: questRun.clear },
      { id: 'quest', label: 'Mostra quest reale', active: questShown, onTrigger: () => setQuestShown(true) },
    ],
    [theatreOpen, clockOn, questRun.run, questRun.clear, questRun.start, questShown],
  );

  const needsAttention = snapshot.nodes.some((n) => n.state === 'awaitingPlayer');
  const handleDirectorReset = () => {
    setQuestShown(false);
    questRun.clear();
  };

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
                {theatreOpen && questRun.run && (
                  <QuestTheatre
                    snapshot={snapshot}
                    dispatch={questRun.adapter.dispatch}
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
