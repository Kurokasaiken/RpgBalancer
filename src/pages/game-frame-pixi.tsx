import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, pointerWithin } from '@dnd-kit/core';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { GameFrameScreen } from './game-frame';
import { PixiWorldMap, type PixiMapAnchor } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { MatericRosterComponent } from '@/ui/idleVillage/roster';
import { RosterKitShell } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { useQuestPoiSession } from '@/ui/idleVillage/quests/useQuestPoiSession';
import GoblinEventModalV17 from '@/ui/idleVillage/trailer/GoblinEventModalV17';
// GameFrame is a fresh, not-yet-kitted composition (R-075).
// eslint-disable-next-line no-restricted-imports
import { MAP_QUEST_POI_TARGET, MapQuestPoi } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';
import { DirectorPanel } from '@/ui/idleVillage/components/gameFrame/DirectorPanel';
import type { HudEvent } from '@/ui/idleVillage/components/gameFrame';

/**
 * `/game-frame-pixi` — the /game-frame screen (same HUD, roster, instruments) on the
 * PixiJS map, with a playable quest: a `PoiMatericV3_5` quest POI pinned on the map
 * opens the quest detail; roster strips drag into its slots (or onto the POI itself);
 * once launched, the quest runs on the game clock the HUD astrolabe controls.
 *
 * The quest logic is `useQuestPoiSession`, the same session the reference page
 * `/poi-quest-detail-roster-time-clock` runs. One session drives one POI: only the
 * first entry of `gameFrameConfig.questPois` is mounted for now.
 *
 * The Director panel stages beats for tests and the trailer: the goblin invasion (a
 * threat in the ledger plus the announcement) and the quest appearing on the map.
 */
export default function GameFramePixiPage() {
  const { worldDressing, questPois } = DEFAULT_GAME_FRAME_CONFIG;
  const safeFit = worldDressing.safeFit.enabled ? worldDressing.safeFit : undefined;
  const poi = questPois[0];
  const { t } = useTranslation('idleVillage');
  const [questShown, setQuestShown] = useState(false);
  const [invasion, setInvasion] = useState<{ dueDay: number } | null>(null);
  const [invasionOpen, setInvasionOpen] = useState(false);

  const session = useQuestPoiSession({
    poiFlightTargetSelector: MAP_QUEST_POI_TARGET,
    initialActivityId: poi?.activityId,
  });

  const currentDay = session.gameplay.state.currentDay;
  const invasionDaysLeft = invasion ? Math.max(0, invasion.dueDay - currentDay) : 0;
  const extraEvents = useMemo<HudEvent[]>(
    () => (invasion ? [{ id: 'invasion', typeId: 'threat', title: t('gameFrame.events.fixtures.invasion'), daysLeft: invasionDaysLeft }] : []),
    [invasion, invasionDaysLeft, t],
  );

  const anchors = useMemo<PixiMapAnchor[]>(
    () => (poi && questShown ? [{ id: poi.id, x: poi.x, y: poi.y, node: <MapQuestPoi session={session} sizePx={poi.sizePx} /> }] : []),
    [poi, questShown, session],
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
            extraEvents={extraEvents}
            overlaySlot={
              <>
                {session.overlays}
                <DirectorPanel
                  actions={[
                    {
                      id: 'invasion',
                      label: 'Invasione goblin',
                      active: !!invasion,
                      onTrigger: () => {
                        setInvasion({ dueDay: currentDay + 5 });
                        setInvasionOpen(true);
                      },
                    },
                    { id: 'quest', label: 'Mostra quest', active: questShown, onTrigger: () => setQuestShown(true) },
                  ]}
                  onReset={() => {
                    setInvasion(null);
                    setInvasionOpen(false);
                    setQuestShown(false);
                  }}
                />
                {invasionOpen && (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: 'rgba(2,6,10,0.55)' }}>
                    <GoblinEventModalV17 isOpen daysLeft={invasionDaysLeft} onPrepare={() => setInvasionOpen(false)} />
                  </div>
                )}
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
