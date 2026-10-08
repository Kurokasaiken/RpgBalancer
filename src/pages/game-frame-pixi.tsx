import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, pointerWithin } from '@dnd-kit/core';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { GameFrameScreen } from './game-frame';
import { PixiWorldMap, type PixiMapAnchor, type PixiRegionHover } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
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
import { WorldSurfaceEventShroud } from '@/ui/idleVillage/components/WorldSurfaceEventShroud';
import { WorldSurfaceEventCard } from '@/ui/idleVillage/components/WorldSurfaceEventCard';
// GameFrame is a fresh, not-yet-kitted composition (R-075).
// eslint-disable-next-line no-restricted-imports
import { MAP_QUEST_POI_TARGET, MapQuestPoi } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';
import { DirectorPanel, type DirectorAction } from '@/ui/idleVillage/components/gameFrame/DirectorPanel';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { DEFAULT_HUD_BAND_PX, setHudBandPx, useHudBandPx } from '@/ui/idleVillage/skins/primitives';
import { MapDemoPoi, RegionTooltip, TuningPanel, useHudPanels, type HudEvent, type HudObjective, type TuningField } from '@/ui/idleVillage/components/gameFrame';

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
/** Days the player has between the announcement and the goblin host reaching the village. */
const INVASION_WARNING_DAYS = 5;
const TUNING_KEY = 'hud_tuning_v1';

export default function GameFramePixiPage() {
  const { worldDressing, questPois, debug, roster, questDetail, insets } = DEFAULT_GAME_FRAME_CONFIG;
  const safeFit = worldDressing.safeFit.enabled ? worldDressing.safeFit : undefined;
  // Dev tuning (Tuning panel): overrides on top of the config, applied when a slider is released.
  const [tuned, setTuned] = useState<Record<string, number>>({});
  // Tuning survives reloads: every change is saved at once, and the Save button saves (and copies the values) on demand.
  const bandNow = useHudBandPx();
  const [tuningLoaded, setTuningLoaded] = useState(false);
  const [tuningSaved, setTuningSaved] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadData<{ tuned?: Record<string, number>; band?: number }>(TUNING_KEY, {}).then((stored) => {
      if (cancelled) return;
      if (stored.tuned) setTuned(stored.tuned);
      if (typeof stored.band === 'number') setHudBandPx(stored.band);
      setTuningLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!tuningLoaded) return;
    void saveData(TUNING_KEY, { tuned, band: bandNow });
  }, [tuned, bandNow, tuningLoaded]);
  const motion = useMemo(() => {
    const m = worldDressing.motion;
    const pick = (key: keyof typeof m) => tuned[key] ?? m[key];
    return { ...m, cloudShadowOpacity: pick('cloudShadowOpacity'), cloudShadowOffsetX: pick('cloudShadowOffsetX'), cloudShadowOffsetY: pick('cloudShadowOffsetY'), cloudSpeed: pick('cloudSpeed'), seaLineOpacity: pick('seaLineOpacity'), seaMotionAmount: pick('seaMotionAmount'), foamStrength: pick('foamStrength') };
  }, [worldDressing.motion, tuned]);
  const seabed = useMemo(
    () => (worldDressing.seabed ? { opacity: tuned.seabedOpacity ?? worldDressing.seabed.opacity, parallax: tuned.seabedParallax ?? worldDressing.seabed.parallax } : undefined),
    [worldDressing.seabed, tuned],
  );
  const bandPx = bandNow;
  const tuningFields = useMemo<TuningField[]>(
    () => [
      { id: 'plaqueBand', label: 'Plaque gold band (px)', value: bandPx, min: 1, max: 6, step: 0.5 },
      { id: 'cloudShadowOpacity', label: 'Cloud shadow opacity', value: motion.cloudShadowOpacity, min: 0, max: 1, step: 0.02 },
      { id: 'cloudShadowOffsetX', label: 'Shadow offset X', value: motion.cloudShadowOffsetX, min: 0, max: 300, step: 10 },
      { id: 'cloudShadowOffsetY', label: 'Shadow offset Y', value: motion.cloudShadowOffsetY, min: 0, max: 300, step: 10 },
      { id: 'cloudSpeed', label: 'Cloud speed', value: motion.cloudSpeed, min: 1, max: 20, step: 1 },
      { id: 'seaLineOpacity', label: 'Sea lines opacity', value: motion.seaLineOpacity, min: 0, max: 0.6, step: 0.02 },
      { id: 'seaMotionAmount', label: 'Sea motion amount', value: motion.seaMotionAmount, min: 0, max: 80, step: 2 },
      { id: 'foamStrength', label: 'Coast foam', value: motion.foamStrength, min: 0, max: 1.5, step: 0.05 },
      { id: 'seabedOpacity', label: 'Seabed opacity', value: seabed?.opacity ?? 0, min: 0, max: 1, step: 0.05 },
      { id: 'seabedParallax', label: 'Seabed parallax (1 = glued)', value: seabed?.parallax ?? 1, min: 0.5, max: 1, step: 0.02 },
    ],
    [motion, seabed, bandPx],
  );
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
  const [poiDemo, setPoiDemo] = useState(false);
  const [regionHover, setRegionHover] = useState<PixiRegionHover | null>(null);
  const [invasion, setInvasion] = useState<{ dueDay: number } | null>(null);
  // Goblin invasion, as on /world-surface: the parchment curtains close over the map, the announcement card
  // appears at the peak, and confirming it opens the curtains and puts the threat in the ledger.
  const [shroudCovered, setShroudCovered] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  useEffect(() => {
    if (!shroudCovered) return undefined;
    const timer = window.setTimeout(() => setCardOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [shroudCovered]);
  // Test / trailer tooling: dev builds only, F10 shows or hides it (hide it for a clean capture).
  // `?capture=1` starts a clean shot: no Director, no panel menu.
  const capture = useMemo(() => new URLSearchParams(window.location.search).get('capture') === '1', []);
  const directorEnabled = import.meta.env.DEV && debug.directorPanel && !capture;
  const panels = useHudPanels();
  useEffect(() => {
    if (!directorEnabled) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'F10') return;
      event.preventDefault();
      panels.toggle('director');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [directorEnabled, panels]);

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
    () => (invasion ? [{ id: 'invasion', typeId: 'threat', title: t('gameFrame.events.fixtures.invasion'), daysLeft: invasionDaysLeft, at: { x: 0.486, y: 0.554 } }] : []),
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

  const anchors = useMemo<PixiMapAnchor[]>(() => {
    const list: PixiMapAnchor[] = [];
    if (poi && questShown) list.push({ id: poi.id, x: poi.x, y: poi.y, node: <MapQuestPoi session={session} sizePx={poi.sizePx} availability={availability} /> });
    if (poiDemo) {
      // One of each family in a different territory (canvas 4240 x 2828): eastern mountains, southern forest, northern forest.
      const demos = [
        { type: 'quest', x: 0.7, y: 0.5 },
        { type: 'job', x: 0.38, y: 0.66 },
        { type: 'event', x: 0.35, y: 0.37 },
      ] as const;
      for (const demo of demos) {
        list.push({ id: `demo-${demo.type}`, x: demo.x * 4240, y: demo.y * 2828, node: <MapDemoPoi type={demo.type} sizePx={poi?.sizePx ?? 55} /> });
      }
    }
    return list;
  }, [poi, questShown, session, availability, poiDemo]);

  const directorActions = useMemo<DirectorAction[]>(
    () => [
      {
        id: 'invasion',
        label: t('gameFrame.director.invasion'),
        active: !!invasion,
        onTrigger: () => {
          setCardOpen(false);
          setShroudCovered(true);
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
        id: 'poitypes',
        label: t('gameFrame.director.poiTypes'),
        active: poiDemo,
        onTrigger: () => setPoiDemo((on) => !on),
      },
      {
        id: 'skin',
        label: t('gameFrame.director.skin', { name: getSkinPresetConfig(skinId).label }),
        onTrigger: () =>
          setSkinId((current) => COMPARABLE_SKIN_IDS[(COMPARABLE_SKIN_IDS.indexOf(current) + 1) % COMPARABLE_SKIN_IDS.length]),
      },
    ],
    [invasion, questShown, poiDemo, currentDay, t, skinId, session.gameplay.state.currentTick],
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
            panels={panels}
            devPanels={directorEnabled}
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
                {directorEnabled && panels.visible.tuning && (
                  <TuningPanel
                    fields={tuningFields}
                    onCommit={(id, value) => (id === 'plaqueBand' ? setHudBandPx(value) : setTuned((current) => ({ ...current, [id]: value })))}
                    onReset={() => {
                      setTuned({});
                      setHudBandPx(DEFAULT_HUD_BAND_PX);
                    }}
                    saved={tuningSaved}
                    onSave={() => {
                      void saveData(TUNING_KEY, { tuned, band: bandNow });
                      void navigator.clipboard?.writeText(tuningFields.map((field) => `${field.id}: ${field.value}`).join(', '));
                      setTuningSaved(true);
                      window.setTimeout(() => setTuningSaved(false), 1800);
                    }}
                    onClose={() => panels.set('tuning', false)}
                  />
                )}
                {directorEnabled && panels.visible.director && (
                  <DirectorPanel
                    actions={directorActions}
                    onClose={() => panels.set('director', false)}
                    onReset={() => {
                      setInvasion(null);
                      setShroudCovered(false);
                      setCardOpen(false);
                      setQuestShown(false);
                    }}
                  />
                )}
              </>
            }
            renderMap={({ recenterSignal, focusRequest }) => (
              <div style={{ position: 'absolute', inset: 0, isolation: 'isolate' }}>
                <PixiWorldMap
                  manifestPath={resolveWorldManifestPath(worldDressing)}
                  hiddenLayerIds={worldDressing.hiddenLayerIds}
                  safeFit={safeFit}
                  recenterSignal={recenterSignal}
                  focusRequest={focusRequest}
                  anchors={anchors}
                  stageColor={worldDressing.stageColor}
                  seaPatternConfig={seaPatternConfig}
                  coastFoamConfig={coastFoamConfig}
                  cloudShadowOpacity={motion.cloudShadowOpacity}
                  cloudShadowOffset={shadowOffset}
                  cloudSpeed={motion.cloudSpeed}
                  seabed={seabed}
                  regions={{ assetBase: '/assets/world/wanderlust/base', onHover: setRegionHover }}
                  worldLayer={(canvas) => (
                    <div style={{ pointerEvents: 'auto' }}>
                      <WorldSurfaceEventCard
                        visible={cardOpen}
                        zIndex={5}
                        worldCenter={{ x: canvas.width / 2, y: canvas.height / 2 }}
                        canvasSize={canvas}
                        camera={{ panX: 0, panY: 0, zoom: 1 }}
                        fallTarget={{ x: Math.round(canvas.width * 0.239), y: Math.round(canvas.height * 0.417) }}
                        marchTarget={{ x: Math.round(canvas.width * 0.486), y: Math.round(canvas.height * 0.554) }}
                        daysRemaining={INVASION_WARNING_DAYS}
                        showReminder={false}
                        onComplete={() => {
                          setShroudCovered(false);
                          setInvasion({ dueDay: currentDay + INVASION_WARNING_DAYS });
                        }}
                        onClose={() => setCardOpen(false)}
                      />
                    </div>
                  )}
                />
                {regionHover && <RegionTooltip name={t(`gameFrame.regions.${regionHover.region.id}`)} x={regionHover.x} y={regionHover.y} />}
                <WorldSurfaceEventShroud covered={shroudCovered} zIndex={6} />
              </div>
            )}
          />
        </DndContext>
      </RosterKitShell>
    </TooltipProvider>
  );
}
