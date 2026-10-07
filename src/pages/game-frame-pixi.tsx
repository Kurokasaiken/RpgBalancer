import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, pointerWithin } from '@dnd-kit/core';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { GameFrameScreen } from './game-frame';
import { PixiWorldMap, type PixiMapAnchor } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { MatericRosterComponent } from '@/ui/idleVillage/roster';
import { MatericRosterComponentV2 } from '@/ui/idleVillage/rosterV2';
import { useHudMaterial } from '@/ui/idleVillage/components/gameFrame/useHudMaterial';
import { applySkinCssVariables } from '@/ui/idleVillage/skins/skinCssVariables';
import { getSkinPresetConfig, type SkinPresetId } from '@/ui/idleVillage/skins/skinConfigRegistry';
import { COMPARABLE_SKIN_IDS, resolveInitialSkinPresetId } from '@/ui/idleVillage/skins/resolveInitialSkin';
import { questAvailability } from '@/ui/idleVillage/components/gameFrame/questAvailability';
import { EXPIRE_FADE_MS } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';
import { DEFAULT_SEA_PATTERN_CONFIG } from '@/ui/idleVillage/components/WorldSurfaceSeaPatternOverlay';
import { DEFAULT_COAST_FOAM_CONFIG } from '@/ui/idleVillage/components/WorldSurfaceCoastFoam';
import { resolveWorldManifestPath } from '@/ui/idleVillage/components/gameFrame/resolveWorldManifest';
import { RosterKitShell } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { useQuestPoiSession } from '@/ui/idleVillage/quests/useQuestPoiSession';
import GoblinEventModalV17 from '@/ui/idleVillage/trailer/GoblinEventModalV17';
// GameFrame is a fresh, not-yet-kitted composition (R-075).
// eslint-disable-next-line no-restricted-imports
import { MAP_QUEST_POI_TARGET, MapQuestPoi } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';
import { DirectorPanel, type DirectorAction } from '@/ui/idleVillage/components/gameFrame/DirectorPanel';
import type { HudEvent, HudObjective } from '@/ui/idleVillage/components/gameFrame';

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
  const { worldDressing, questPois, debug, roster, questDetail, insets } = DEFAULT_GAME_FRAME_CONFIG;
  const safeFit = worldDressing.safeFit.enabled ? worldDressing.safeFit : undefined;
  const { motion } = worldDressing;
  const shadowOffset = useMemo(() => ({ x: motion.cloudShadowOffsetX, y: motion.cloudShadowOffsetY }), [motion]);
  const seaPatternConfig = useMemo(
    () => ({ ...DEFAULT_SEA_PATTERN_CONFIG, motionAmount: motion.seaMotionAmount, motionPeriod: motion.seaMotionPeriod, lineOpacity: motion.seaLineOpacity }),
    [motion],
  );
  const coastFoamConfig = useMemo(
    () => ({ ...DEFAULT_COAST_FOAM_CONFIG, strength: motion.foamStrength, crestSpeedWorldPxPerSecond: motion.foamCrestSpeed }),
    [motion],
  );
  const poi = questPois[0];
  const { t } = useTranslation('idleVillage');
  const Roster = useHudMaterial() === 'lacquer' ? MatericRosterComponentV2 : MatericRosterComponent;
  const [questShown, setQuestShown] = useState(false);
  // Game tick at which the quest opportunity appeared: its deadline runs on the game clock.
  const [questAppearedTick, setQuestAppearedTick] = useState(0);
  // Dev comparison of the two skins from the Director panel (`?skin=` sets the starting one).
  const [skinId, setSkinId] = useState<SkinPresetId>(resolveInitialSkinPresetId);
  useEffect(() => {
    applySkinCssVariables(skinId);
    document.documentElement.setAttribute('data-skin-preset', skinId);
  }, [skinId]);
  const [invasion, setInvasion] = useState<{ dueDay: number } | null>(null);
  const [invasionOpen, setInvasionOpen] = useState(false);
  // Test / trailer tooling: dev builds only, F10 shows or hides it (hide it for a clean capture).
  const directorEnabled = import.meta.env.DEV && debug.directorPanel;
  const [directorVisible, setDirectorVisible] = useState(true);
  useEffect(() => {
    if (!directorEnabled) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'F10') return;
      event.preventDefault();
      setDirectorVisible((visible) => !visible);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [directorEnabled]);

  // The detail opens between the roster and the ledger, never over either.
  const rosterRight = roster.leftPx + roster.widthPx;
  const ledgerLeft = window.innerWidth - (insets.edgeInsetPx + 8) - questDetail.ledgerWidthPx;
  const corridor = ledgerLeft - questDetail.gapPx - (rosterRight + questDetail.gapPx);
  const questDetailPosition = {
    x: rosterRight + questDetail.gapPx + Math.max(0, (corridor - questDetail.widthPx) / 2),
    y: questDetail.topPx,
  };

  const session = useQuestPoiSession({
    poiFlightTargetSelector: MAP_QUEST_POI_TARGET,
    initialActivityId: poi?.activityId,
    detail: { position: questDetailPosition, showTelemetry: false, hudSurface: true },
  });

  const objective = useMemo<HudObjective | undefined>(() => {
    if (!questShown) return undefined;
    const key = session.questStatus === 'available' ? 'available' : session.questStatus === 'in_progress' ? 'running' : 'done';
    return { text: t(`gameFrame.objective.${key}`, { name: session.activity.label }), onSelect: session.handlePoiClick };
  }, [questShown, session.questStatus, session.activity.label, session.handlePoiClick, t]);

  const currentDay = session.gameplay.state.currentDay;
  const invasionDaysLeft = invasion ? Math.max(0, invasion.dueDay - currentDay) : 0;
  const extraEvents = useMemo<HudEvent[]>(
    () => (invasion ? [{ id: 'invasion', typeId: 'threat', title: t('gameFrame.events.fixtures.invasion'), daysLeft: invasionDaysLeft }] : []),
    [invasion, invasionDaysLeft, t],
  );

  const dayLengthTicks = session.gameplay.config.globalRules?.dayLengthInTimeUnits ?? 60;
  const availability = useMemo(
    () => (poi ? questAvailability(session.gameplay.state.currentTick ?? 0, questAppearedTick, dayLengthTicks, poi.availableDays) : undefined),
    [poi, session.gameplay.state.currentTick, questAppearedTick, dayLengthTicks],
  );

  // An expired opportunity fades (MapQuestPoi), then leaves the map.
  const expiredOpen = availability?.state === 'expired' && session.questStatus === 'available';
  useEffect(() => {
    if (!questShown || !expiredOpen) return undefined;
    const timer = window.setTimeout(() => setQuestShown(false), EXPIRE_FADE_MS + 200);
    return () => window.clearTimeout(timer);
  }, [questShown, expiredOpen]);

  const anchors = useMemo<PixiMapAnchor[]>(
    () => (poi && questShown ? [{ id: poi.id, x: poi.x, y: poi.y, node: <MapQuestPoi session={session} sizePx={poi.sizePx} availability={availability} /> }] : []),
    [poi, questShown, session, availability],
  );

  const directorActions = useMemo<DirectorAction[]>(
    () => [
      {
        id: 'invasion',
        label: t('gameFrame.director.invasion'),
        active: !!invasion,
        onTrigger: () => {
          setInvasion({ dueDay: currentDay + 5 });
          setInvasionOpen(true);
        },
      },
      {
        id: 'quest',
        label: t('gameFrame.director.quest'),
        active: questShown,
        onTrigger: () => {
          setQuestAppearedTick(session.gameplay.state.currentTick ?? 0);
          setQuestShown(true);
        },
      },
      {
        id: 'skin',
        label: t('gameFrame.director.skin', { name: getSkinPresetConfig(skinId).label }),
        onTrigger: () =>
          setSkinId((current) => COMPARABLE_SKIN_IDS[(COMPARABLE_SKIN_IDS.indexOf(current) + 1) % COMPARABLE_SKIN_IDS.length]),
      },
    ],
    [invasion, questShown, currentDay, t, skinId, session.gameplay.state.currentTick],
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
            rosterSlot={({ onClose }) => (
              <Roster
                onClose={onClose}
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
            )}
            extraEvents={extraEvents}
            objective={objective}
            overlaySlot={
              <>
                {session.overlays}
                {directorEnabled && directorVisible && (
                  <DirectorPanel
                    actions={directorActions}
                    onReset={() => {
                      setInvasion(null);
                      setInvasionOpen(false);
                      setQuestShown(false);
                    }}
                  />
                )}
                {invasionOpen && (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: 'rgba(2,6,10,0.55)' }}>
                    <GoblinEventModalV17 isOpen daysLeft={invasionDaysLeft} onPrepare={() => setInvasionOpen(false)} />
                  </div>
                )}
              </>
            }
            renderMap={({ recenterSignal }) => (
              <PixiWorldMap
                manifestPath={resolveWorldManifestPath(worldDressing)}
                hiddenLayerIds={worldDressing.hiddenLayerIds}
                safeFit={safeFit}
                recenterSignal={recenterSignal}
                anchors={anchors}
                stageColor={worldDressing.stageColor}
                seaPatternConfig={seaPatternConfig}
                coastFoamConfig={coastFoamConfig}
                cloudShadowOpacity={motion.cloudShadowOpacity}
                cloudShadowOffset={shadowOffset}
                cloudSpeed={motion.cloudSpeed}
              />
            )}
          />
        </DndContext>
      </RosterKitShell>
    </TooltipProvider>
  );
}
