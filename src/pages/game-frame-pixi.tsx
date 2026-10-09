import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, pointerWithin } from '@dnd-kit/core';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { GameFrameScreen } from './game-frame';
import { DEFAULT_MAP_TUNE, PixiWorldMap, type PixiMapAnchor, type PixiRegionHover } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
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
import { useQuestRun } from '@/ui/idleVillage/questS1Lab/useQuestRun';
import { GOBLIN_BEATS, GOBLIN_META, GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questScenarioGoblin';
import { nodeDurationTicks } from '@/ui/idleVillage/questS1Lab/questRun';
import { NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';
// GameFrame is a fresh, not-yet-kitted composition (R-075).
// eslint-disable-next-line no-restricted-imports
import { MAP_QUEST_POI_TARGET, MapQuestPoi } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';
import { DirectorPanel, type DirectorAction } from '@/ui/idleVillage/components/gameFrame/DirectorPanel';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { DEFAULT_HUD_BAND_PX, setHudBandPx, useHudBandPx } from '@/ui/idleVillage/skins/primitives';
import { MapDemoPoi, QuestRunWindow, RegionTooltip, TuningPanel, useHudPanels, type HudEvent, type TuningField } from '@/ui/idleVillage/components/gameFrame';

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
/** The announcement card against the map: smaller than on World Surface, where the map is shown closer. */
const INVASION_CARD_SIZE = 0.75;
const TUNING_KEY = 'hud_tuning_v1';
/** Share of an open side panel's width the map fit keeps clear. */
const PANEL_FIT_SHARE = 0.6;

export default function GameFramePixiPage() {
  const { worldDressing, questPois, debug, roster, questDetail, questWindow, insets } = DEFAULT_GAME_FRAME_CONFIG;
  const baseSafeFit = worldDressing.safeFit.enabled ? worldDressing.safeFit : undefined;
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
    return { ...m, cloudShadowOpacity: pick('cloudShadowOpacity'), cloudShadowOffsetX: pick('cloudShadowOffsetX'), cloudShadowOffsetY: pick('cloudShadowOffsetY'), cloudSpeed: pick('cloudSpeed'), seaLineOpacity: pick('seaLineOpacity'), seaMotionAmount: pick('seaMotionAmount'), seaMotionPeriod: pick('seaMotionPeriod'), foamStrength: pick('foamStrength'), foamCrestSpeed: pick('foamCrestSpeed') };
  }, [worldDressing.motion, tuned]);
  const seabed = useMemo(
    () => (worldDressing.seabed ? { opacity: tuned.seabedOpacity ?? worldDressing.seabed.opacity, parallax: tuned.seabedParallax ?? worldDressing.seabed.parallax } : undefined),
    [worldDressing.seabed, tuned],
  );
  const bandPx = bandNow;
  const reducedMotion = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, []);
  const tuneNow = useMemo(() => {
    const t = { ...DEFAULT_MAP_TUNE };
    for (const key of Object.keys(t) as (keyof typeof t)[]) if (typeof tuned[key] === 'number') t[key] = tuned[key];
    return t;
  }, [tuned]);
  const tuningFields = useMemo<TuningField[]>(
    () => [
      { id: 'cloudShadowOpacity', group: 'Clouds', label: 'Cloud shadow opacity', hint: 'How dark the ground shadow under each cloud is. 0 = no shadows.', value: motion.cloudShadowOpacity, min: 0, max: 1, step: 0.02 },
      { id: 'cloudShadowOffsetX', group: 'Clouds', label: 'Shadow offset X', hint: 'How far (world px) the shadow falls to the right of its cloud: the taller the cloud, the further.', value: motion.cloudShadowOffsetX, min: 0, max: 300, step: 10 },
      { id: 'cloudShadowOffsetY', group: 'Clouds', label: 'Shadow offset Y', hint: 'How far (world px) the shadow falls below its cloud.', value: motion.cloudShadowOffsetY, min: 0, max: 300, step: 10 },
      { id: 'cloudSpeed', group: 'Clouds', label: 'Cloud speed', hint: 'Speed multiplier of every cloud and shadow. 1 = a crossing of the world takes 12-35 minutes; 10 = 1-4 minutes.', value: motion.cloudSpeed, min: 1, max: 20, step: 1 },
      { id: 'cloudParallax', group: 'Clouds', label: 'Cloud parallax', hint: 'How much higher clouds slide against the ground when you pan the map. 0 = glued to the ground, 1 = default, 2 = very high clouds.', value: tuneNow.cloudParallax, min: 0, max: 2, step: 0.1 },
      { id: 'cloudMorph', group: 'Clouds', label: 'Cloud shape drift', hint: 'How much each cloud slowly swells, narrows and tilts as it drifts. 0 = rigid sprites.', value: tuneNow.cloudMorph, min: 0, max: 3, step: 0.1 },
      { id: 'seaLineOpacity', group: 'Sea', label: 'Sea lines opacity', hint: 'Strength of the pale line pattern drawn on open water.', value: motion.seaLineOpacity, min: 0, max: 0.6, step: 0.02 },
      { id: 'seaMotionAmount', group: 'Sea', label: 'Sea sway amount', hint: 'How far (world px) the sea line pattern slides back and forth. Lower = calmer sea.', value: motion.seaMotionAmount, min: 0, max: 80, step: 2 },
      { id: 'seaMotionPeriod', group: 'Sea', label: 'Sea sway period (s)', hint: 'Seconds for one full back-and-forth of the sea pattern. Higher = slower, calmer water.', value: motion.seaMotionPeriod, min: 3, max: 40, step: 1 },
      { id: 'foamStrength', group: 'Sea', label: 'Coast foam', hint: 'Brightness of the foam lines washing onto the shores.', value: motion.foamStrength, min: 0, max: 1.5, step: 0.05 },
      { id: 'foamCrestSpeed', group: 'Sea', label: 'Coast foam speed', hint: 'How fast the foam crests travel toward the shore (world px per second). Original look: 9.', value: motion.foamCrestSpeed, min: 0, max: 40, step: 1 },
      { id: 'markSpacingPx', group: 'Sea', label: 'Wave spacing (px)', hint: 'No two painted waves or sea marks play at once closer than this. Higher = sparser, calmer sea.', value: tuneNow.markSpacingPx, min: 300, max: 1800, step: 50 },
      { id: 'wonderEveryS', group: 'Sea', label: 'Sea wonder every (s)', hint: 'Average wait between sea wonders (kraken, whale, ship), in real seconds. Default 600 = one every 10 minutes; a wait varies between 0.6x and 1.4x of it.', value: tuneNow.wonderEveryS, min: 30, max: 1800, step: 30 },
      { id: 'forestSway', group: 'Land', label: 'Forest sway (px)', hint: 'How far (world px) the forest crowns sway in the wind. 0 = still forests (and the original, unsplit base). At the normal map zoom 4 px is about 1 screen px: try 10-16 to see it clearly.', value: tuneNow.forestSway, min: 0, max: 20, step: 0.5 },
      { id: 'forestSwaySpeed', group: 'Land', label: 'Forest wind speed', hint: 'How fast the gusts roll over the forests. 1 = a gust every ~8 s, 2 = twice as fast.', value: tuneNow.forestSwaySpeed, min: 0.2, max: 4, step: 0.1 },
      { id: 'regionLinePx', group: 'Regions', label: 'Region border (px)', hint: 'Thickness of the black ink border of a hovered territory, in world px (about a quarter on screen at normal zoom).', value: tuneNow.regionLinePx, min: 3, max: 30, step: 1 },
      { id: 'smokeAmount', group: 'Land', label: 'Village smoke', hint: 'Opacity of the smoke rising from the village roofs. 0 = off.', value: tuneNow.smokeAmount, min: 0, max: 2, step: 0.1 },
      { id: 'deepSeaFadePx', group: 'Sea', label: 'Deep sea distance (px)', hint: 'How far the painted sea colour holds beyond the map edge before turning to deep water and fog.', value: tuneNow.deepSeaFadePx, min: 200, max: 1500, step: 50 },
      { id: 'regionHoverDelayS', group: 'Regions', label: 'Region hover delay (s)', hint: 'How long the pointer must rest on a territory before it lights up and shows its name.', value: tuneNow.regionHoverDelayS, min: 0, max: 3, step: 0.1 },
      { id: 'seabedOpacity', group: 'Sea', label: 'Seabed opacity', hint: 'How clear the water becomes while you drag the map (0 = never see the bed).', value: seabed?.opacity ?? 0, min: 0, max: 1, step: 0.05 },
      { id: 'seabedParallax', group: 'Sea', label: 'Seabed parallax (1 = glued)', hint: 'How much slower the seabed slides than the map while dragging. Lower = deeper.', value: seabed?.parallax ?? 1, min: 0.5, max: 1, step: 0.02 },
      { id: 'plaqueBand', group: 'HUD', label: 'Plaque gold band (px)', hint: 'Thickness of the gold rim of every HUD plaque.', value: bandPx, min: 1, max: 6, step: 0.5 },
    ],
    [motion, seabed, bandPx, tuneNow],
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
  const [wonderRequest, setWonderRequest] = useState(0);
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
  const directorEnabled = import.meta.env.DEV && debug.directorPanel;
  const panels = useHudPanels();
  // The land is framed to keep clear of the open side panels: the fit reserves most of their width (they sit over the
  // coastal corners, so a full reservation would shrink the island for nothing).
  const safeFit = useMemo(() => {
    if (!baseSafeFit) return undefined;
    const left = panels.visible.roster ? Math.round((roster.leftPx + roster.widthPx) * PANEL_FIT_SHARE) : 0;
    const right = panels.visible.events ? Math.round((questDetail.ledgerWidthPx + insets.edgeInsetPx) * PANEL_FIT_SHARE) : 0;
    return { ...baseSafeFit, insets: { ...baseSafeFit.insets, left, right } };
  }, [baseSafeFit, panels.visible.roster, panels.visible.events, roster.leftPx, roster.widthPx, questDetail.ledgerWidthPx, insets.edgeInsetPx]);
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

  const currentDay = session.gameplay.state.currentDay;
  const invasionDaysLeft = invasion ? Math.max(0, invasion.dueDay - currentDay) : 0;
  const dayLengthTicks = session.gameplay.config.globalRules?.dayLengthInTimeUnits ?? 60;
  const availability = useMemo(
    () => (poi ? questAvailability(session.gameplay.state.currentTick ?? 0, questAppearedTick, dayLengthTicks, poi.availableDays) : undefined),
    [poi, session.gameplay.state.currentTick, questAppearedTick, dayLengthTicks],
  );

  // Open opportunities live in the calendar like any other dated event: the quest is a row in the ledger.
  const extraEvents = useMemo<HudEvent[]>(() => {
    const list: HudEvent[] = [];
    if (invasion) list.push({ id: 'invasion', typeId: 'threat', title: t('gameFrame.events.fixtures.invasion'), daysLeft: invasionDaysLeft, at: { x: 0.486, y: 0.554 } });
    if (poi && questShown && session.questStatus === 'available' && availability && availability.state !== 'expired') {
      const daysLeft = Math.max(0, Math.ceil(availability.progress * poi.availableDays));
      list.push({ id: 'quest-open', typeId: 'quest', title: session.activity.label, daysLeft, at: { x: poi.x / 4240, y: poi.y / 2828 } });
    }
    return list;
  }, [invasion, invasionDaysLeft, poi, questShown, session.questStatus, session.activity.label, availability, t]);

  // Time of day on the map, only at normal speed: at x2/x4 the light holds still (a day lasts seconds there, and the map
  // would flicker), while paused it keeps whatever light it had.
  const { isDayPhase, cycleProgress, speedMultiplier, isPaused: clockPaused } = session.gameplay.state;
  const lastAmbient = useRef({ light: 1, warm: 0 });
  // `?tod=night|dusk|day` previews a time of day (dev), whatever the clock says.
  const todPreview = useMemo(() => new URLSearchParams(window.location.search).get('tod'), []);
  const ambient = useMemo(() => {
    if (todPreview === 'night') return { light: 0.35, warm: 0 };
    if (todPreview === 'dusk') return { light: 0.7, warm: 1 };
    if (todPreview === 'day') return { light: 1, warm: 0 };
    if (clockPaused) return lastAmbient.current;
    if (speedMultiplier !== 1) return (lastAmbient.current = { light: 1, warm: 0 });
    const p = cycleProgress ?? 0;
    const ramp = (a: number, b: number, x: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));
    const next = isDayPhase
      ? { light: 1 - 0.65 * ramp(0.8, 1, p), warm: ramp(0.65, 0.85, p) * (1 - ramp(0.95, 1, p)) }
      : { light: 0.35 + 0.65 * ramp(0.8, 1, p), warm: ramp(0.8, 0.92, p) * (1 - ramp(0.97, 1, p)) };
    return (lastAmbient.current = next);
  }, [todPreview, clockPaused, speedMultiplier, isDayPhase, cycleProgress]);

  // The running quest (R-106): the authored goblin quest in its floating window, timed on the game clock.
  const questRun = useQuestRun('goblin');
  const [questRunStartTick, setQuestRunStartTick] = useState(0);
  // Opening "Quest in progress" from the Panels menu (or Q) with nothing running starts the goblin quest, as the
  // Director button does: otherwise the menu ticked the panel on and nothing appeared.
  const questPanelOpen = panels.visible.quest;
  const currentTick = session.gameplay.state.currentTick ?? 0;
  useEffect(() => {
    if (!questPanelOpen || questRun.run) return;
    // v27 frontier (PLAN-025 T-004): the quest's authored days are shared
    // evenly across its maturable nodes; the session clock is the tick source.
    questRun.start(GOBLIN_PRESETS[0].id, {
      nodeTicks: nodeDurationTicks('goblin', questWindow.durationDays * dayLengthTicks),
      startTick: currentTick,
    });
    setQuestRunStartTick(currentTick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questPanelOpen]);
  // The game clock matures timed nodes (v27): paused game = paused quest;
  // a late open catches up deterministically to the first waiting frontier.
  useEffect(() => {
    questRun.syncClock(currentTick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTick]);
  // Bag arming is the player's call: nothing is spent on a check unless armed.
  const [questArmed, setQuestArmed] = useState(questWindow.consumablesArmedByDefault);
  const questRunTime = useMemo(() => {
    const span = questWindow.durationDays * dayLengthTicks;
    const elapsed = Math.max(0, (session.gameplay.state.currentTick ?? 0) - questRunStartTick);
    const progress = questRun.run?.ended ? 1 : Math.min(1, elapsed / span);
    const label = questRun.run?.ended
      ? t(questRun.run.outcome === 'wipe' ? 'gameFrame.questWindow.noneReturned' : 'gameFrame.questWindow.returned')
      : t('gameFrame.questWindow.day', { day: Math.min(questWindow.durationDays, Math.floor(elapsed / dayLengthTicks) + 1), total: questWindow.durationDays });
    return { progress, label };
  }, [questWindow.durationDays, dayLengthTicks, session.gameplay.state.currentTick, questRunStartTick, questRun.run?.ended, questRun.run?.outcome, t]);

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
        id: 'questRun',
        label: t('gameFrame.director.questRun'),
        active: !!questRun.run && !questRun.run.ended,
        onTrigger: () => {
          questRun.start(GOBLIN_PRESETS[0].id);
          setQuestArmed(questWindow.consumablesArmedByDefault);
          setQuestRunStartTick(session.gameplay.state.currentTick ?? 0);
          panels.set('quest', true);
        },
      },
      {
        id: 'poitypes',
        label: t('gameFrame.director.poiTypes'),
        active: poiDemo,
        onTrigger: () => setPoiDemo((on) => !on),
      },
      {
        id: 'wonder',
        label: t('gameFrame.director.wonder'),
        onTrigger: () => setWonderRequest((n) => n + 1),
      },
      {
        id: 'skin',
        label: t('gameFrame.director.skin', { name: getSkinPresetConfig(skinId).label }),
        onTrigger: () =>
          setSkinId((current) => COMPARABLE_SKIN_IDS[(COMPARABLE_SKIN_IDS.indexOf(current) + 1) % COMPARABLE_SKIN_IDS.length]),
      },
    ],
    [invasion, questShown, poiDemo, currentDay, t, skinId, session.gameplay.state.currentTick, questRun, panels, questWindow.consumablesArmedByDefault],
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
            overlaySlot={
              <>
                {session.overlays}
                {questRun.run && panels.visible.quest && (
                  <QuestRunWindow
                    run={questRun.run}
                    phases={questRun.phases}
                    beats={GOBLIN_BEATS}
                    queuedBeats={questRun.beats}
                    beatTiming={questWindow.beats}
                    title={GOBLIN_META.title}
                    flavour={GOBLIN_META.flavour}
                    artFor={(nodeId) => NODE_ART[nodeId]?.src}
                    time={questRunTime}
                    onChoose={(optionId) => questRun.choose(optionId, { useConsumable: questArmed })}
                    armed={questArmed}
                    onToggleArmed={() => setQuestArmed((on) => !on)}
                    onUseHealing={questRun.useHealing}
                    onDrinkPotion={questRun.drinkPotion}
                    onClose={() => panels.set('quest', false)}
                    anchor={{ left: roster.leftPx + roster.widthPx + questDetail.gapPx, top: questWindow.topPx }}
                    widthPx={questWindow.widthPx}
                    theaterAspect={questWindow.theaterAspect}
                    tooltipLines={questWindow.tooltipLines}
                    zIndex={DEFAULT_GAME_FRAME_CONFIG.zLayers.panels}
                  />
                )}
                {directorEnabled && panels.visible.tuning && (
                  <TuningPanel
                    fields={tuningFields}
                    notice={reducedMotion ? 'Reduce motion is ON in the system settings: forest sway, smoke, cloud drift and sea wonders are off.' : undefined}
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
                  tune={tuneNow}
                  ambient={ambient}
                  wonderRequest={wonderRequest}
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
                        cardSize={INVASION_CARD_SIZE}
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
