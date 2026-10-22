import { cloneElement, isValidElement, startTransition, useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { stageExpeditionLost } from '@/ui/idleVillage/components/gameFrame/expeditionLostStaging';
import { DndContext, MeasuringStrategy } from '@dnd-kit/core';
import { getCurrentDragConfig } from '@/ui/idleVillage/config/dragConfig';
import { createMagneticSlotCollision } from '@/ui/idleVillage/interaction/magneticCollision';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { GameFrameScreen } from './game-frame';
import { DEFAULT_MAP_TUNE, PixiWorldMap, type PixiBootProgress, type PixiMapAnchor, type PixiRegion, type PixiRegionHover } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { GameBootScreen, type GameBootPhase } from '@/ui/idleVillage/components/gameFrame/GameBootScreen';
import { GameFrameDragCursor } from '@/ui/idleVillage/components/gameFrame/GameFrameDragCursor';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { installGamePerfProbe } from '@/ui/idleVillage/utils/gamePerfProbe';
import { GAME_PERF_BUDGETS } from '@/ui/idleVillage/config/gamePerfBudgets';
import { warmGameAssets } from '@/ui/idleVillage/utils/gameAssetWarmup';
import { isSkillCheckWarmEnabled, prewarmQuestSkillCheck } from '@/ui/idleVillage/components/gameFrame/questSkillCheckWarm';
import { CONSUMED_POIS_KEY, INVASION_KEY, clearGameProgress } from '@/ui/idleVillage/components/gameFrame/questInitialState';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { MatericRosterComponentV2 } from '@/ui/idleVillage/rosterV2';
import { applySkinCssVariables } from '@/ui/idleVillage/skins/skinCssVariables';
import { getSkinPresetConfig, type SkinPresetId } from '@/ui/idleVillage/skins/skinConfigRegistry';
import { COMPARABLE_SKIN_IDS, resolveInitialSkinPresetId } from '@/ui/idleVillage/skins/resolveInitialSkin';
import { questAvailability, type QuestAvailability } from '@/ui/idleVillage/components/gameFrame/questAvailability';
import { useStableValue, useThrottledValue } from '@/ui/idleVillage/hooks/useThrottledValue';
import { DEFAULT_SEA_PATTERN_CONFIG } from '@/ui/idleVillage/components/WorldSurfaceSeaPatternOverlay';
import { DEFAULT_COAST_FOAM_CONFIG } from '@/ui/idleVillage/components/WorldSurfaceCoastFoam';
import { resolveWorldManifestPath } from '@/ui/idleVillage/components/gameFrame/resolveWorldManifest';
import { RosterKitShell, useRosterKitData, type RosterDropVerdict } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { useQuestPoiSession } from '@/ui/idleVillage/quests/useQuestPoiSession';
import { WorldSurfaceEventShroud } from '@/ui/idleVillage/components/WorldSurfaceEventShroud';
import { WorldSurfaceEventCard } from '@/ui/idleVillage/components/WorldSurfaceEventCard';
import { questRunTimeLabel, timeBarModel } from '@/ui/idleVillage/questS1Lab/questTickCounter';
import { SettlementLostOverlay } from '@/ui/idleVillage/components/SettlementLostOverlay';
import { useQuestRun } from '@/ui/idleVillage/questS1Lab/useQuestRun';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { type QuestId, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { runIdOf } from '@/ui/idleVillage/quests/questSettlement';
import { NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';
import { isPoiConsumed, poiConsumesOnReportClose, QUEST_HALO_RENDER_MS, QUEST_HALO_STEPS, QUEST_POIS, questPoiById, type QuestPoi } from '@/balancing/config/idleVillage/quests/questPois';
import { useQuestExpeditionSession } from '@/ui/idleVillage/quests/useQuestExpeditionSession';
import { composeRosterCompatibility } from '@/ui/idleVillage/quests/rosterCompatibility';
import { scenarioForQuest } from '@/ui/idleVillage/questS1Lab/questOffer';
import { questHaloProgress, questRemainingTicks } from '@/ui/idleVillage/questS1Lab/questSchedule';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
// GameFrame is a fresh, not-yet-kitted composition (R-075).
// eslint-disable-next-line no-restricted-imports
import { EXPIRE_FADE_MS, MAP_QUEST_POI_TARGET, MapQuestPoi } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';
import { DirectorPanel, type DirectorAction } from '@/ui/idleVillage/components/gameFrame/DirectorPanel';
import { isQuestPoiRevealed, questRevealSchedule } from '@/ui/idleVillage/components/gameFrame/questRevealSchedule';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import goblinStickerImage from '@/assets/ui/idleVillage/goblin-march-trasparente.webp';
import { initializeMinimalGameplayStore, useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { DEFAULT_HUD_BAND_PX, setHudBandPx, useHudBandPx } from '@/ui/idleVillage/skins/primitives';
import { useHudScale } from '@/ui/idleVillage/components/gameFrame/useHudScale';
import { MapDemoPoi, QuestJourneyRoute, QuestOverlays, QuestRewardPopup, QuestRunWindow, RegionTooltip, TuningPanel, useHeroSheet, useHudPanels, usePanelWhileOpen, VillageScreenView, type HeroSheetApi, type HudEvent, type HudPanelId, type HudPanelsApi, type TuningField, type VillageScreenViewHandle } from '@/ui/idleVillage/components/gameFrame';
import { resolveQuestShellLayout, solveQuestClusterGeometry } from '@/ui/idleVillage/components/gameFrame/questShellLayout';
import { QuestStageCluster } from '@/ui/idleVillage/components/gameFrame/QuestStageCluster';
import { QuestSkillCheckColumn } from '@/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn';
import { checkEventOf, isStaleCheckEvent, useCheckBridge } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { VillageStashPanel } from '@/ui/idleVillage/components/gameFrame/VillageStashPanel';
import { useVillageStashStore } from '@/ui/idleVillage/store/useVillageStashStore';
import { MerchantPanel } from '@/ui/idleVillage/components/gameFrame/MerchantPanel';
import {
  GameStageProvider,
  StagePanelEscape,
  StagePanelFrame,
  StageRejectedToast,
  StageStripsLayer,
  isStageManagedPanel,
  useGameStageZonesState,
} from '@/ui/idleVillage/components/gameFrame/stageZones/useGameStageZones';
import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';
import { MERCHANT_CONFIG } from '@/balancing/config/idleVillage/merchantConfig';
import { runHeroLevelUpStaging } from '@/ui/idleVillage/rosterV2/runHeroLevelUpStaging';
import { runStagingOpeningRoster } from '@/ui/idleVillage/rosterV2/runStagingOpeningRoster';
import { HeroLevelCeremony } from '@/ui/idleVillage/rosterV2/HeroLevelCeremony';
import { playLevelUpCue } from '@/ui/idleVillage/rosterV2/heroLevelCue';

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
/** The card in the viewport: 1 = its 460px design width, so it reads at a player's screen size. */
const INVASION_SCREEN_SCALE = 1;
/** The goblin walks from where it lands to the village over this many game days (PLAN-033 T-004). */
const INVASION_MARCH_DAYS = 30;
/** Normalised map points: where the sticker lands on the forest, and the village it marches on. */
const INVASION_LAND = { x: 0.239, y: 0.417 } as const;
const INVASION_VILLAGE = { x: 0.486, y: 0.554 } as const;
const TUNING_KEY = 'hud_tuning_v1';
/** POIs whose quest has run to completion: once the expedition report is
 *  dismissed the marker leaves the map for good (PLAN-019-S2.5 terminal
 *  table: every outcome ⇒ «POI chiude»). */

/** Exact hit first, then the nearest slot within the config's magnet radius (PLAN-043 T1.2).
 *  `slotRadiusPx` is the slot-scoped override (PLAN-043 WS-1 T1.3): it applies
 *  only to `data.type === 'slot'` droppables inside the resolver — every other
 *  droppable kind keeps exact-hit behaviour. */
const SLOT_MAGNET = createMagneticSlotCollision(getCurrentDragConfig().magnetism.slotRadiusPx);

export default function GameFramePixiPage() {
  const slotMagnet = SLOT_MAGNET;
  const hudScale = useHudScale();
  /* PLAN-043 WS-2: the three-zone stage — reducer-owned occupancy solved by
   *  `solveStageLayout`. Runs before `useHudPanels` so the registry's
   *  shortcut/menu path can route zone-managed ids straight into it. */
  const stage = useGameStageZonesState();
  const { worldDressing, questPois, debug, questWindow, insets, questReveal, stageZones } = DEFAULT_GAME_FRAME_CONFIG;
  const baseSafeFit = worldDressing.safeFit.enabled ? worldDressing.safeFit : undefined;
  // Dev tuning (Tuning panel): overrides on top of the config, applied when a slider is released.
  const [tuned, setTuned] = useState<Record<string, number>>({});
  // Tuning survives reloads: every change is saved at once, and the Save button saves (and copies the values) on demand.
  const bandNow = useHudBandPx();
  const [tuningLoaded, setTuningLoaded] = useState(false);
  const [tuningSaved, setTuningSaved] = useState(false);
  // «Save» also bakes the values into the shipped defaults via the dev endpoint; this flags a failed write (R-181).
  const [tuningBakeFailed, setTuningBakeFailed] = useState(false);
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
  const { t, ready: i18nReady } = useTranslation('idleVillage');
  /* PLAN-043 WS-5 D9: V2 (Lacquer Atlas) is the only roster — the V1
   *  Materic fallback was retired (Director ruling). */
  const Roster = MatericRosterComponentV2;
  /* R-200 (PLAN-037): «Show quest» is a one-way Director trigger — it jumps
   *  the reveal queue, never hides a POI back. The offers also reveal
   *  themselves: `autoRevealedIds` is the stagger's own memory, one entry per
   *  offer, `staggerMs` of wall clock apart, starting once the boot veil is
   *  gone; `revealCycle` re-arms the sequence (Director «Reset» replays the
   *  entrances for a new take). */
  const [questShown, setQuestShown] = useState(false);
  const [autoRevealedIds, setAutoRevealedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [revealCycle, setRevealCycle] = useState(0);
  // Dev comparison of the two skins from the Director panel (`?skin=` sets the starting one).
  const [skinId, setSkinId] = useState<SkinPresetId>(resolveInitialSkinPresetId);
  useEffect(() => {
    applySkinCssVariables(skinId);
    document.documentElement.setAttribute('data-skin-preset', skinId);
  }, [skinId]);
  const [poiDemo, setPoiDemo] = useState(false);
  /* R-180: «POI types» reviews the whole marker family — the golden quest
   *  POI rides along as the REAL offer (never a fake exemplar, R-143), so
   *  clicking it opens the actual expedition planner. «Show quest» stays
   *  the quest-only gate. */
  const questRevealed = questShown || poiDemo;
  const [wonderRequest, setWonderRequest] = useState(0);
  /* PLAN-067 T-C2 (R-234): the Director «Expedition lost» beat — a defeat COPY shown in the report; the live run is never touched. */
  const [expeditionLostRun, setExpeditionLostRun] = useState<QuestRunState | null>(null);
  const [regionHover, setRegionHover] = useState<PixiRegionHover | null>(null);
  const [invasion, setInvasion] = useState<{ dueDay: number; startDay: number } | null>(null);
  /* BV-4/R-119 (Director, 2026-10-19, option A): the clock DOES hydrate — `initializeMinimalGameplayStore`
   * restores `currentDay`/`currentTick` at save-time — so a confirmed invasion is restored on reload: marker
   * at `(currentDay - startDay)/30` and ledger row present. The announcement theatre (shroud, card, sticker
   * peel) is transient and is never replayed; a reload mid-sequence resumes post-confirmation. The key is
   * read only after clock hydration resolves, so the marker mounts at the right position with no jump.
   * `invasionLoadedRef` gates the save below until that read settles — otherwise the mount render would
   * write `null` and erase the record before it is read. */
  const invasionLoadedRef = useRef(false);
  // False only between the player's confirmation and the sticker landing.
  const [goblinLanded, setGoblinLanded] = useState(true);
  // The invasion's ledger row exists from the confirmation but stays hidden until the announcement card has folded into it.
  const [rowArriving, setRowArriving] = useState(false);
  useEffect(() => {
    if (!invasionLoadedRef.current) return;
    void saveData(INVASION_KEY, invasion);
  }, [invasion]);
  // Goblin invasion, as on /world-surface: the parchment curtains close over the map, the announcement card
  // appears at the peak, and confirming it opens the curtains and puts the threat in the ledger.
  const [shroudCovered, setShroudCovered] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  useEffect(() => {
    if (!shroudCovered) return undefined;
    const timer = window.setTimeout(() => setCardOpen(true), DEFAULT_GAME_FRAME_CONFIG.eventTheatre.cardDelayMs);
    return () => window.clearTimeout(timer);
  }, [shroudCovered]);

  /* Event theatre holds the clock (Director, 2026-10-12): from the moment the
   * curtains start closing until they've fully reopened — card at the peak,
   * click, curtains open — time stands still. The snapshot taken at trigger is
   * restored when the theatre ends: a running clock resumes at the speed it had
   * (the multiplier is never touched), a paused one stays paused. The goblin
   * march that follows is a world event, not theatre: the clock is already back
   * when it walks. While frozen, the player's own pause/speed inputs are muted
   * (`timeInputLocked`) so nothing can unpause under the curtains. */
  const [timeFrozen, setTimeFrozen] = useState(false);
  const timeFreezeSnapshot = useRef<{ wasPaused: boolean } | null>(null);
  useEffect(() => {
    if (shroudCovered) {
      setTimeFrozen(true);
      if (!timeFreezeSnapshot.current) {
        const gameplay = useMinimalGameplayStore.getState();
        timeFreezeSnapshot.current = { wasPaused: gameplay.state.isPaused };
        if (!gameplay.state.isPaused) gameplay.pauseGame('auto');
      }
      return undefined;
    }
    if (!timeFreezeSnapshot.current) return undefined;
    // The curtains need ~900ms to reopen (trailer.css transition): the hold
    // releases a beat after the sequence ends so the world never ticks under
    // half-drawn curtains.
    const release = globalThis.setTimeout(() => {
      const snap = timeFreezeSnapshot.current;
      timeFreezeSnapshot.current = null;
      setTimeFrozen(false);
      if (snap && !snap.wasPaused) useMinimalGameplayStore.getState().resumeGame('auto');
    }, DEFAULT_GAME_FRAME_CONFIG.eventTheatre.freezeReleaseMs);
    return () => globalThis.clearTimeout(release);
  }, [shroudCovered]);

  /* Event wake for the HUD: the theatre bumping in calls the chrome back even
   * over a deliberately hidden HUD — the world asking for attention. */
  const [hudWakeSignal, setHudWakeSignal] = useState(0);
  const prevShroudCovered = useRef(shroudCovered);
  useEffect(() => {
    if (shroudCovered && !prevShroudCovered.current) setHudWakeSignal((n) => n + 1);
    prevShroudCovered.current = shroudCovered;
  }, [shroudCovered]);

  /* Contemplation reward (Director): a sea wonder surfaces only when the chrome
   * slid away on its own (idle) — a hand-hidden HUD is a deliberate clean view,
   * not contemplation. `wonderRequest` is the live channel the Director button uses. */
  const [hudIdleHidden, setHudIdleHidden] = useState(false);
  useEffect(() => {
    if (hudIdleHidden && DEFAULT_GAME_FRAME_CONFIG.hudHide.wonderOnHide) setWonderRequest((n) => n + 1);
  }, [hudIdleHidden]);
  // Test / trailer tooling: F10 shows or hides it (hide it for a clean capture).
  // Director 2026-10-15: the panels ship on the Vercel production deploy too —
  // it is the Director's own dogfood surface, not a public Steam build.
  const directorEnabled = debug.directorPanel;
  /* PLAN-032 SP-1: the hero sheet's machine is its single transition owner.
   * `interceptToggle` routes every registry call for it (menu, game menu, the
   * `p` shortcut) into `useHeroSheet`; the registry flag only reflects. */
  const heroSheetApiRef = useRef<HeroSheetApi>(null);
  /* Zone-managed ids (roster/events/villageStash/merchant/quest)
   *  never enter `panels.visible` — `panelsForScreen.visible` below merges the
   *  reducer's derived occupancy over it, so the legacy `visible` surface and
   *  the stage can't drift apart. */
  const panels = useHudPanels({
    interceptToggle: useCallback(
      (id: HudPanelId) => {
        if (isStageManagedPanel(stageZones, id)) {
          stage.api.toggle(id);
          return true;
        }
        if (id === 'heroSheet') {
          heroSheetApiRef.current?.toggle();
          return true;
        }
        return false;
      },
      [stage.api, stageZones],
    ),
  });
  // The map never moves for a panel (Director, 2026-10-14): Roster, ledger, quest detail and every other panel the
  // player can move or close may cover the land. Only the fixed chrome reserves space (`baseSafeFit` insets top/bottom).
  const safeFit = useMemo(() => {
    if (!baseSafeFit) return undefined;
    /* Map-fit consumes device px, while `baseSafeFit.insets` declares the
     * chrome bands in HUD layout px. Browser interface-size zoom scales the
     * fixed chrome by `hudScale.cssZoom` (1 under native Tauri zoom), so the
     * protected area must reserve the same scaled bands. */
    const chromeZoom = hudScale.cssZoom;
    return {
      ...baseSafeFit,
      insets: {
        ...baseSafeFit.insets,
        top: baseSafeFit.insets.top * chromeZoom,
        bottom: baseSafeFit.insets.bottom * chromeZoom,
      },
    };
  }, [baseSafeFit, hudScale.cssZoom]);
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
  /* E2E seam: reveal the quest offers exactly like the Director's «Mostra
   *  quest» — needed under `?capture=1`, where the panel itself is hidden. */
  useEffect(() => {
    const hooks = ((window as unknown as { __idleVillageTestHooks?: Record<string, unknown> }).__idleVillageTestHooks ??= {});
    hooks.revealQuestPois = () => setQuestShown(true);
    // E2E seam: close the shroud and let the announcement card open at its peak, as the Director's invasion does.
    hooks.startInvasion = () => setShroudCovered(true);
    return () => {
      delete hooks.revealQuestPois;
      delete hooks.startInvasion;
    };
  }, []);

  /* PLAN-043 WS-2: no corridor math here — the planner's first-open rect is
   *  the solver's `questDetail` occupant rect (centerStage zone). The stage
   *  frame wraps the node, so its geometry is authoritative; this position is
   *  only a pre-solver mount hint for `useQuestExpeditionDetail`. */
  const questDetailPosition = useMemo(() => {
    const rect = stage.layout?.panels.questDetail.rect;
    return rect ? { x: rect.x, y: rect.y } : undefined;
  }, [stage.layout]);

  const session = useQuestPoiSession({
    poiFlightTargetSelector: MAP_QUEST_POI_TARGET,
    initialActivityId: poi?.activityId,
    detail: { position: questDetailPosition, showTelemetry: false, hudSurface: true },
  });

  /* Canonical game clock on /game (Director decision 2026-10-10): hydrate the
   * persisted snapshot so quest tick stamps (`launchedAtTick`, `readyAt`)
   * stay in the same epoch across reloads, then drive the shared 1s loop.
   * No offline progression: hydration restores the tick AT save time —
   * wall-clock time elapsed while the game was closed is never credited.
   * The single tick driver lives in GameFrameScreen (`useTimeEngineLoop`) —
   * mounting a second loop here would double the clock rate. */
  useEffect(() => {
    let cancelled = false;
    initializeMinimalGameplayStore()
      .then(() => {
        if (cancelled) return undefined;
        const gameplay = useMinimalGameplayStore.getState();
        if (gameplay.state.isPaused) gameplay.resumeGame('auto');
        /* R-119: read the invasion only now — the clock is hydrated, so the
         * marker mounts directly at the saved march progress, no jump. */
        return loadData<{ dueDay: number; startDay: number } | null>(INVASION_KEY, null);
      })
      .then((stored) => {
        if (cancelled || stored === undefined) return;
        invasionLoadedRef.current = true;
        if (stored) setInvasion(stored);
      })
      .catch((err) => {
        console.error('[GameFrame] minimal gameplay init failed:', err);
        invasionLoadedRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentDay = session.gameplay.state.currentDay;
  const invasionDaysLeft = invasion ? Math.max(0, invasion.dueDay - currentDay) : 0;
  /* PLAN-034 T-010: the Director's Settlement Lost trigger lights its button
   * while the takeover is on screen (read-only flag — the state itself lives in
   * the gameplay store's gameOverState). */
  const settlementLostActive = useMinimalGameplayStore(
    (s) => s.gameOverState.isGameOver && s.gameOverState.reason === 'settlement_lost',
  );
  // E2E seam: the march state the marker is drawn from (dev/playwright builds read it; production builds carry it harmlessly).
  useEffect(() => {
    const hooks = ((window as unknown as { __idleVillageTestHooks?: Record<string, unknown> }).__idleVillageTestHooks ??= {});
    hooks.getInvasion = () =>
      invasion
        ? { startDay: invasion.startDay, dueDay: invasion.dueDay, currentDay, progress: Math.min(1, Math.max(0, (currentDay - invasion.startDay) / INVASION_MARCH_DAYS)) }
        : null;
    return () => {
      delete hooks.getInvasion;
    };
  }, [invasion, currentDay]);
  const dayLengthTicks = session.gameplay.config.globalRules?.dayLengthInTimeUnits ?? 60;
  const currentTick = session.gameplay.state.currentTick ?? 0;

/* Structural equality for throttled offer availability (PLAN-034 T-005). */
const availEqual = (a: QuestAvailability | undefined, b: QuestAvailability | undefined): boolean =>
  a === b || (!!a && !!b && a.state === b.state && a.progress === b.progress);

  /** Window left on a real quest offer, on the game clock. */
  const offerAvailability = useCallback(
    (p: QuestPoi) =>
      p.availableUntilDay === undefined
        ? { progress: 1, state: 'available' as const }
        : questAvailability(currentTick, (p.availableFromDay ?? 0) * dayLengthTicks, dayLengthTicks, p.availableUntilDay - (p.availableFromDay ?? 0)),
    [currentTick, dayLengthTicks],
  );

  /* Per-POI offer availability, quantised to the seal's letter grid and held
   * referentially stable (PLAN-034 T-005/RC-1): the raw values move on every
   * game tick, so every consumer below — the anchors memo, extraEvents — would
   * rebuild the marker subtree with them. Between visible steps these stay
   * identical objects and React skips the whole branch. */
  const quantizeAvail = useCallback(
    (p: QuestPoi | undefined): QuestAvailability | undefined => {
      if (!p) return undefined;
      const a = offerAvailability(p);
      return { ...a, progress: Math.round(a.progress * QUEST_HALO_STEPS) / QUEST_HALO_STEPS };
    },
    [offerAvailability],
  );
  const availGoblin = useStableValue(
    useMemo(() => quantizeAvail(questPoiById('poi-goblin')), [quantizeAvail]),
    availEqual,
  );
  const availRovine = useStableValue(
    useMemo(() => quantizeAvail(questPoiById('poi-rovine')), [quantizeAvail]),
    availEqual,
  );
  const questPoiAvailability = useMemo(() => {
    const map = new Map<string, QuestAvailability>();
    if (availGoblin) map.set('poi-goblin', availGoblin);
    if (availRovine) map.set('poi-rovine', availRovine);
    return map;
  }, [availGoblin, availRovine]);

  // Time of day on the map, only at normal speed: at x2/x4 the light holds still (a day lasts seconds there, and the map
  // would flicker), while paused it keeps whatever light it had.
  const { isDayPhase, cycleProgress, speedMultiplier, isPaused: clockPaused } = session.gameplay.state;
  /* R-264: live dead-resident count — lights the Director «revive» action only
   *  while the settlement's terminal consequence is actually on the roster. */
  const deadResidentCount = session.gameplay.state.residents.reduce((n, r) => n + (r.isDead ? 1 : 0), 0);
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

  // The running quests (R-106 + PLAN-019-S2.4): one persisted run per questId,
  // started ONLY by an expedition's «Invia spedizione» — opening the window
  // never spawns a run (the panels menu just reveals the surface).
  const questRun = useQuestRun('goblin');
  const questRunRovine = useQuestRun('rovine');
  const questRuns = useMemo(() => ({ goblin: questRun, rovine: questRunRovine }), [questRun, questRunRovine]);
  const journeyRouteRuns = useMemo(
    () =>
      [questRun.run, questRunRovine.run].filter(
        (run): run is QuestRunState => Boolean(run?.journey && !run.ended),
      ),
    [questRun.run, questRunRovine.run],
  );
  const [activeQuestId, setActiveQuestId] = useState<QuestId>('goblin');
  const activeQuestRun = questRuns[activeQuestId];
  // The game clock matures timed nodes (v27): paused game = paused quest;
  // a late open catches up deterministically to the first waiting frontier —
  // for EVERY active run, window open or not.
  useEffect(() => {
    questRun.syncClock(currentTick);
    questRunRovine.syncClock(currentTick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTick]);

  /* Real quest POIs (S2.4): each is a live planning surface + launchpad.
   * `activeRuns` = every non-terminal persisted run — the global launch gate
   * and the source of the derived `inExpedition` lock. */
  const activeRuns = useMemo(
    () => [questRun.run, questRunRovine.run].filter((r): r is NonNullable<typeof r> => Boolean(r)),
    [questRun.run, questRunRovine.run],
  );
  /* useCallback, not a plain closure: this reaches `poiView.handlePoiClick` —
   *  an unstable identity here rebuilt the marker's session object (and the
   *  whole medallion subtree) on every render (PLAN-034 T-005). */
  const openRunWindow = useCallback((questId: QuestId) => {
    setActiveQuestId(questId);
    stage.api.open('quest');
  }, [stage.api]);
  const poiGoblin = questPoiById('poi-goblin');
  const poiRovine = questPoiById('poi-rovine');
  /* WS-2: the planner mounts inside its stage frame — suspension treatment +
   *  zone-aware drag claim — while keeping its own dnd-kit drag and absolute
   *  rect (positioned=false: the detail self-positions). */
  const wrapQuestDetail = useCallback(
    (node: ReactNode) => (
      <StagePanelFrame panelId="questDetail" positioned={false} className="hud-panel">
        {node}
      </StagePanelFrame>
    ),
    [],
  );
  const buildingOpenerRef = useRef<HTMLElement | null>(null);
  /** Open the canonical Village Stash from the planner and restore focus to its trigger on close. */
  const openQuestStash = useCallback((trigger: HTMLElement) => {
    buildingOpenerRef.current = trigger;
    if (!stage.isOpen('villageStash')) stage.api.open('villageStash');
    else document.querySelector<HTMLElement>('[data-hud-panel="villageStash"]')?.focus();
  }, [stage.api, stage.isOpen]);
  const expeditionGoblin = useQuestExpeditionSession({
    poi: poiGoblin!,
    questRun,
    activeRuns,
    currentTick,
    onOpenRun: openRunWindow,
    onOpenStash: openQuestStash,
    detailPosition: questDetailPosition,
    wrapDetail: wrapQuestDetail,
  });
  const expeditionRovine = useQuestExpeditionSession({
    poi: poiRovine!,
    questRun: questRunRovine,
    activeRuns,
    currentTick,
    onOpenRun: openRunWindow,
    onOpenStash: openQuestStash,
    detailPosition: questDetailPosition,
    wrapDetail: wrapQuestDetail,
  });
  const expeditions = [expeditionGoblin, expeditionRovine];
  /* R-241 B5 (INV-3): the roster's compatibility resolver is ONE composed
   *  function — while any session's quest context is live (an unsettled
   *  expedition run, the POI quest running or uncollected) the whole chain
   *  abstains so cards paint resident statuses, not planner noise. */
  const rosterCompatibility = useMemo(
    () =>
      composeRosterCompatibility([
        { contextActive: !!expeditionGoblin.run, getResidentCompatibility: expeditionGoblin.getResidentCompatibility },
        { contextActive: !!expeditionRovine.run, getResidentCompatibility: expeditionRovine.getResidentCompatibility },
        { contextActive: session.isQuestRunning || !!session.embarkResult, getResidentCompatibility: session.getResidentCompatibility },
      ]),
    [
      expeditionGoblin.run,
      expeditionGoblin.getResidentCompatibility,
      expeditionRovine.run,
      expeditionRovine.getResidentCompatibility,
      session.isQuestRunning,
      session.embarkResult,
      session.getResidentCompatibility,
    ],
  );
  const anyExpeditionDetailOpen = expeditions.some((exp) => exp.isDetailOpen && (!exp.run || exp.run.ended));
  /* PLAN-073 warehouse ledger: hydrate once at page level — the UI gates
   *  mutations on `hydration === 'ready'` so nothing writes before load. */
  useEffect(() => {
    void useVillageStashStore.getState().hydrate();
  }, []);
  /* Binding lifecycle (D-1): the planner that opens the shelf claims it
   *  (session-side `bindStash`); a shelf opened via `v`/menu while exactly
   *  ONE planner is open auto-binds to it; a shelf with no/ambiguous
   *  planner stays read-only. The binding dies with the shelf or with its
   *  planner — a stale owner could mutate the wrong bag. */
  const openPlannerKey = expeditions
    .filter((exp) => exp.isDetailOpen && (!exp.run || exp.run.ended))
    .map((exp) => exp.poi.id)
    .join(',');
  const activeStashOwner = useVillageStashStore((s) => s.activeStashOwner);
  const stashPanelOpen = stage.isOpen('villageStash');
  useEffect(() => {
    const stash = useVillageStashStore.getState();
    const openPlannerIds = openPlannerKey ? openPlannerKey.split(',') : [];
    if (!stashPanelOpen) {
      if (stash.activeStashOwner) stash.bindStash(null);
      return;
    }
    if (stash.activeStashOwner && !openPlannerIds.includes(stash.activeStashOwner)) {
      stash.bindStash(null);
      return;
    }
    if (!stash.activeStashOwner && openPlannerIds.length === 1) stash.bindStash(openPlannerIds[0]);
  }, [stashPanelOpen, activeStashOwner, openPlannerKey]);
  /* WS-2: the planner is a stage occupant — `isDetailOpen` (which any POI may
   *  flip via a medallion click) is the session truth; the stage mirrors it.
   *  During `run` the detail retires per its runPolicy via REGIME_CHANGED. */
  useEffect(() => {
    stage.api.setOpen('questDetail', anyExpeditionDetailOpen);
  }, [stage.api, anyExpeditionDetailOpen]);
  /* Reconciliation: `quest` occupancy means "a run is on stage". A cleared
   *  run (abandon, dismiss from another path) must release the whole stage —
   *  otherwise the `run` regime would keep every other panel suspended
   *  against an empty occupant. */
  useEffect(() => {
    if (!activeQuestRun.run && stage.isOpen('quest')) stage.api.close('quest');
  }, [stage.api, stage, activeQuestRun.run]);
  /* Read inside StagePanelEscape callbacks without re-binding the hooks. */
  const expeditionsRef = useRef(expeditions);
  expeditionsRef.current = expeditions;
  /* Escape on the planner closes whichever expedition detail is open — the
   *  sessions own `isDetailOpen`; the stage mirrors via the effect above. */
  const closeAnyExpeditionDetail = useCallback(() => {
    expeditionsRef.current.forEach((exp) => {
      if (exp.isDetailOpen) exp.closeDetail();
    });
  }, []);
  /* The api the shell sees: `heroSheet` calls route into the machine (reflect,
   *  never drive — the internal `p` shortcut is already intercepted), zone-
   *  managed ids route into the stage (WS-2), everything else hits `panels`.
   *  Managed `visible` values come pre-synced from `GameStageProvider`. */
  const panelsForScreen = useMemo<HudPanelsApi>(() => {
    /* Managed ids are stage-owned: their `visible` mirrors occupancy (open,
     *  strip or suspended — the frame decides presentation and keeps the node
     *  mounted-hidden so DOM-level reads still see it). This is the sync the
     *  header comment promises — without it `rosterSlot` never mounts because
     *  `toggle` is intercepted before `panels.visible` flips. */
    const visible = { ...panels.visible };
    for (const id of Object.keys(stageZones.panels) as HudPanelId[]) {
      if (isStageManagedPanel(stageZones, id)) {
        visible[id] = stage.isOpen(id);
      }
    }
    return {
      visible,
      set: (id, value) => {
        if (isStageManagedPanel(stageZones, id)) {
          stage.api.setOpen(id, value);
          return;
        }
        if (id === 'heroSheet') {
          if (value) heroSheetApiRef.current?.open();
          else heroSheetApiRef.current?.close('toggle');
          return;
        }
        panels.set(id, value);
      },
      toggle: (id) => {
        if (isStageManagedPanel(stageZones, id)) {
          stage.api.toggle(id);
          return;
        }
        if (id === 'heroSheet') {
          heroSheetApiRef.current?.toggle();
          return;
        }
        panels.toggle(id);
      },
    };
  }, [panels, stage, stageZones]);
  /* R-184: a POI detail (the quest planner) always has the roster beside it —
   *  opened if it was closed, closed again when the detail goes if it was
   *  closed before. Same visibility rule the planner overlay uses — routed
   *  through `panelsForScreen` so the stage owns the occupancy write. */
  usePanelWhileOpen(panelsForScreen, 'roster', anyExpeditionDetailOpen);

  /* PLAN-032 SP-1: the hero sheet. The roster's data bundle is the same the kit
   * feeds its cards with, so the plaque always reads canonical values. The
   * quest window keeps clear of it via `questBounds` (WCAG 2.4.11). */
  const { residentsById } = useRosterKitData();
  const draggingResidentId =
    session.draggingResidentId ?? expeditionGoblin.draggingResidentId ?? expeditionRovine.draggingResidentId;
  /* PLAN-043 WS-4: the quest cluster — one solver owns CompanionLeft /
   *  window / SkillCheckColumn. The page holds the two pieces of intent the
   *  solver needs: the requested left tab (`questPill`) and the live beat's
   *  `expanded` tag (reported up by the window). The right wing's request
   *  comes from the published check bridge (engine-first: the overlay
   *  never recomputes the outcome). */
  const [questPill, setQuestPill] = useState<'party' | 'bag' | 'log' | null>(null);
  const [questExpandedStage, setQuestExpandedStage] = useState(false);
  /* R-239: the window reports its strip state — while minimised the wings
   *  have no window to dock to (the check column would orphan on the map at
   *  its last wing geometry), so the check falls back to the centered
   *  `QuestSkillCheckOverlay` (the bridge stays live — the window is still
   *  mounted, only collapsed). */
  const [questMinimised, setQuestMinimised] = useState(false);
  const checkBridge = useCheckBridge(activeQuestId);
  const liveCheckEvent = activeQuestRun.run && checkBridge ? checkEventOf(activeQuestRun.run, checkBridge.check) : null;
  const checkLive = !!liveCheckEvent && !isStaleCheckEvent(liveCheckEvent, activeQuestRun.run);
  const clusterEnvelope = stage.layout.clusterEnvelope;
  const clusterGeometry = useMemo(() => {
    if (!clusterEnvelope || !activeQuestRun.run || !panelsForScreen.visible.quest) return null;
    return solveQuestClusterGeometry(
      stage.state.viewport,
      clusterEnvelope,
      { userCenterX: stage.state.userCenterX, userTopY: stage.state.userTopY },
      { leftOpen: questPill !== null && !questMinimised, rightOpen: checkLive && !questMinimised, expanded: questExpandedStage },
    );
  }, [clusterEnvelope, activeQuestRun.run, panelsForScreen.visible.quest, stage.state.viewport, stage.state.userCenterX, stage.state.userTopY, questPill, checkLive, questExpandedStage, questMinimised]);

  const questWindowBounds = useMemo(
    () => {
      if (!stage.isOpen('quest') || !activeQuestRun.run) return null;
      /* WS-4: the hero sheet keeps clear of the whole CLUSTER union —
       * window + whichever wings the solver mounted. */
      if (clusterGeometry) {
        const rects = [clusterGeometry.window, clusterGeometry.leftWing, clusterGeometry.leftTab, clusterGeometry.rightWing].filter(
          (r): r is NonNullable<typeof r> => !!r,
        );
        return {
          left: Math.min(...rects.map((r) => r.x)),
          top: Math.min(...rects.map((r) => r.y)),
          right: Math.max(...rects.map((r) => r.x + r.w)),
          bottom: Math.max(...rects.map((r) => r.y + r.h)),
        };
      }
      const layout = resolveQuestShellLayout(window.innerWidth, questWindow);
      const sideSpan = layout.companionsFit ? layout.effectiveSideWidth + questWindow.sidePanelGapPx : 0;
      const vw = window.innerWidth;
      const centered = Math.round((vw - questWindow.widthPx) / 2);
      const minLeft = sideSpan + questWindow.edgeInsetPx;
      const left = Math.min(Math.max(minLeft, centered), Math.max(minLeft, vw - questWindow.widthPx - minLeft));
      return {
        left: left - sideSpan,
        top: questWindow.topPx,
        right: left + questWindow.widthPx + sideSpan,
        bottom: window.innerHeight,
      };
    },
    [stage, activeQuestRun.run, questWindow, clusterGeometry],
  );
  const heroSheet = useHeroSheet({
    config: DEFAULT_GAME_FRAME_CONFIG.heroSheet,
    residentsById,
    panels: panelsForScreen,
    dragActive: draggingResidentId != null,
    questBounds: questWindowBounds,
    zIndex: DEFAULT_GAME_FRAME_CONFIG.zLayers.panels,
    /* the sheet never enters the fixed chrome: the top bar / menu and the bottom navigation */
    chromeInsets: { top: insets.hangingTopPx, bottom: baseSafeFit?.insets.bottom ?? 0 },
  });
  heroSheetApiRef.current = heroSheet;

  /* PLAN-035: building markers left the continent map — the stash and merchant
   *  panels open from the Village view's tooltip actions (and the Panels menu /
   *  `v` / `m` shortcuts). `buildingOpenerRef` records the opener element so
   *  closing the panel returns focus to it (menu/shortcut paths leave it null →
   *  focus falls back to the Panels-menu trigger, never to body). `panels`
   *  itself is unstable across renders, so callbacks read it through a ref. */
  const panelsApiRef = useRef(panelsForScreen);
  panelsApiRef.current = panelsForScreen;
  const openVillagePanel = useCallback((panelId: 'villageStash' | 'merchant', trigger: HTMLElement) => {
    buildingOpenerRef.current = trigger;
    const p = panelsApiRef.current;
    if (!p.visible[panelId]) p.set(panelId, true);
    else document.querySelector<HTMLElement>(`[data-hud-panel="${panelId}"]`)?.focus();
  }, []);
  /* SP-3 generalizes the stash's close path into the single focus-return rule
   *  every building panel shares: back to the marker that opened it if still
   *  mounted, else to the Panels-menu trigger — never to body. */
  const closeBuildingPanel = useCallback((panelId: HudPanelId) => {
    panelsApiRef.current.set(panelId, false);
    const opener = buildingOpenerRef.current;
    buildingOpenerRef.current = null;
    window.requestAnimationFrame(() => {
      const fallback = document.querySelector<HTMLElement>('[data-hud-panels-trigger]');
      /* An opener that is mid-exiting (anchor ghost) is still connected but no
       * longer a valid focus target — the marker re-mounts fresh next time. */
      (opener && opener.isConnected && !opener.hasAttribute('data-exiting') ? opener : fallback)?.focus();
    });
  }, []);
  const closeVillageStash = useCallback(() => {
    closeBuildingPanel('villageStash');
    /* PLAN-073: closing the shelf drops the planner binding — the next
     *  open re-derives it (planner click or D-1 auto-bind). */
    useVillageStashStore.getState().bindStash(null);
  }, [closeBuildingPanel]);
  const closeMerchant = useCallback(() => closeBuildingPanel('merchant'), [closeBuildingPanel]);

  /* PLAN-035 (Desiderata v30, artifact r005): the Village view — a full-area
   *  mode inside GameFrame, entered from the nav plinth or the painted village
   *  region. `goToView` is the ONLY writer of the view: nav select, region
   *  select, shroud transitions and the village back action all funnel through
   *  it, so no competing update can split the transition. */
  const [viewMode, setViewMode] = useState<'map' | 'village'>('map');
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;
  const villageViewRef = useRef<VillageScreenViewHandle>(null);
  const goToView = useCallback((view: 'map' | 'village', opts?: { focusMap?: boolean }) => {
    setViewMode(view);
    /* Region hover is transient map state: clear it on every transition so the
     * village never inherits a stale name chip and the map re-enters clean. */
    setRegionHover(null);
    if (view === 'map' && opts?.focusMap) {
      window.requestAnimationFrame(() => {
        /* A higher-priority surface may legitimately own focus right now (hero
         * sheet, quest window): never steal it back. */
        const active = document.activeElement as HTMLElement | null;
        if (active?.closest('[data-hud-panel]')) return;
        document.querySelector<HTMLElement>('[data-nav-id="map"]')?.focus();
      });
    }
  }, []);
  const handleRegionSelect = useCallback(
    (region: PixiRegion) => {
      if (region.id === 'village') goToView('village');
    },
    [goToView],
  );
  /* CTR-game-004: the invasion theatre always plays on the map — a rising
   * shroud pulls the view back, whatever the player was looking at. */
  useEffect(() => {
    if (shroudCovered) goToView('map');
  }, [shroudCovered, goToView]);
  /* Escape arbitration (artifact r005) — ONE window-bubble listener owned by
   * the page; order inside the same keypress:
   * 1. Hero sheet: document capture upstream already preventDefault-ed it.
   * 2. Quest window: a LIVE quest stage occupant — WS-2 keeps the node mounted
   *    while suspended, so DOM presence is no longer the test; the solver's
   *    `expanded` resolution is (same arbitration intent, presence→live).
   * 3. Village tooltip: the view's imperative escape() (close + focus the pin).
   * 4. Village exit → map, focus returning to the Map nav button.
   * Stash/merchant panels register no Escape handler and never suppress the
   * exit. One keypress = exactly one dismissal. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (stage.resolution('quest').presentationEffective === 'expanded') return;
      if (viewModeRef.current !== 'village') return;
      event.preventDefault();
      if (villageViewRef.current?.escape()) return;
      goToView('map', { focusMap: true });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goToView, stage]);

  // Open opportunities live in the calendar like any other dated event: the quest is a row in the ledger.
  const extraEvents = useMemo<HudEvent[]>(() => {
    const list: HudEvent[] = [];
    if (invasion) list.push({ id: 'invasion', typeId: 'threat', title: t('gameFrame.events.fixtures.invasion'), daysLeft: invasionDaysLeft, at: { x: 0.486, y: 0.554 }, arriving: rowArriving });
    const goblinAvail = questPoiAvailability.get('poi-goblin');
    /* The ledger row rides the same reveal as the marker — auto-stagger,
     *  Director force or a live run all count (R-200). */
    const goblinRevealed = isQuestPoiRevealed(poiGoblin.id, {
      revealAll: questRevealed,
      autoRevealedIds,
      hasLiveRun: !!expeditionGoblin.run,
    });
    /* The ledger counts down a window; an offer with no window has nothing to count. */
    if (goblinRevealed && poiGoblin.availableUntilDay !== undefined && expeditionGoblin.poiView.questStatus === 'available' && goblinAvail && goblinAvail.state !== 'expired') {
      const daysLeft = Math.max(0, Math.ceil(goblinAvail.progress * (poiGoblin.availableUntilDay - (poiGoblin.availableFromDay ?? 0))));
      list.push({ id: 'quest-open', typeId: 'quest', title: expeditionGoblin.poiView.activity.label, daysLeft, at: { x: poiGoblin.x / 4240, y: poiGoblin.y / 2828 } });
    }
    return list;
  }, [invasion, invasionDaysLeft, rowArriving, questRevealed, autoRevealedIds, expeditionGoblin.poiView, expeditionGoblin.run, questPoiAvailability, poiGoblin, t]);

  /* Consumed quest POIs (persisted): a POI whose run ended, settled and had
   *  its report dismissed leaves the map — it never comes back, even across
   *  reloads. Loaded before the markers are composed so a consumed POI does
   *  not flash in for a frame on boot. */
  const [consumedPoiIds, setConsumedPoiIds] = useState<string[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    void loadData<string[]>(CONSUMED_POIS_KEY, []).then((stored) => {
      if (!cancelled) setConsumedPoiIds(Array.isArray(stored) ? stored : []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* R-199 pt.14: the run's report lives OUTSIDE the window — the page-level
   *  `QuestRewardPopup` opens once the run ended AND the window's beats have
   *  all presented (or the window is closed — nothing left to watch). Its
   *  dismissal is the same «report closed» cue as the window's X. */
  const [questPresenting, setQuestPresenting] = useState(false);
  const [rewardDismissed, setRewardDismissed] = useState(false);
  const rewardRunId = activeQuestRun.run ? runIdOf(activeQuestRun.run) : null;
  const prevRewardRunId = useRef(rewardRunId);
  if (prevRewardRunId.current !== rewardRunId) {
    prevRewardRunId.current = rewardRunId;
    setRewardDismissed(false);
  }
  const rewardVisible = Boolean(
    activeQuestRun.run?.ended &&
    !rewardDismissed &&
    (!panelsForScreen.visible.quest || !questPresenting),
  );

  /* Dismissal of the expedition report is the POI's exit cue: when the quest
   *  window transitions visible→closed on an ended+settled run, the run is
   *  cleared (bag released, save removed) and the POI is consumed. Any close
   *  path lands here — the window's X, «Chiudi il rapporto», the panels menu,
   *  the Q key — and, R-199, the reward popup's close (same semantics: the
   *  report is dismissed). A live or unsettled run is untouched. */
  const dismissSettledRun = useCallback(() => {
    const run = activeQuestRun.run;
    if (!run?.ended || run.settlement?.status !== 'settled') return;
    const consumedPoi = QUEST_POIS.find((p) => p.questId === activeQuestId);
    /* D-S4-6: one-shot by default — a `repeatable` offer is never consumed:
     * clearing the run returns it to `available` while its window lasts. */
    if (consumedPoi && poiConsumesOnReportClose(consumedPoi) && consumedPoiIds && !consumedPoiIds.includes(consumedPoi.id)) {
      const next = [...consumedPoiIds, consumedPoi.id];
      setConsumedPoiIds(next);
      void saveData(CONSUMED_POIS_KEY, next);
    }
    activeQuestRun.clear();
  }, [activeQuestRun, activeQuestId, consumedPoiIds]);
  const prevQuestPanelVisible = useRef(panelsForScreen.visible.quest);
  useEffect(() => {
    const wasVisible = prevQuestPanelVisible.current;
    prevQuestPanelVisible.current = panelsForScreen.visible.quest;
    if (!wasVisible || panelsForScreen.visible.quest) return;
    dismissSettledRun();
  }, [panelsForScreen, dismissSettledRun]);
  /* R-260: the report's dismissal COMMITS the settlement — every close path
   *  (Collect CTA, Escape, the X on the title row) funnels through
   *  `onClose` here, so this single call is the whole contract. Resources,
   *  consequences and the loadout release land now, not at arrival. */
  const closeReward = useCallback(() => {
    setRewardDismissed(true);
    if (panelsForScreen.visible.quest) panelsForScreen.set('quest', false);
    void expeditions.find((exp) => exp.run && exp.run === activeQuestRun.run)?.commitSettlement();
  }, [panelsForScreen, expeditions, activeQuestRun.run]);
  /* The run clears once the commit has landed — `dismissSettledRun` reads
   *  the settled marker, so it waits on the commit's re-render instead of
   *  inspecting the pre-commit run object. */
  useEffect(() => {
    if (!rewardDismissed) return;
    dismissSettledRun();
  }, [rewardDismissed, activeQuestRun.run, dismissSettledRun]);

  // R-196: bag arming is per-item and lives in `useQuestRun.armedFlags` — the
  // window toggles flags through `toggleArmedFlag`, nothing is spent unasked.
  /* R-196: the shell anchors centred — companion columns (roster/belt left,
   * chronicle right) flank it inside the same drag union, so the left edge
   * leaves room for the fit span on both sides. */
  const questAnchor = useMemo(() => {
    const vw = typeof window === 'undefined' ? 1440 : window.innerWidth;
    const layout = resolveQuestShellLayout(vw, questWindow);
    const sideSpan = layout.companionsFit ? layout.effectiveSideWidth + questWindow.sidePanelGapPx : 0;
    const centered = Math.round((vw - questWindow.widthPx) / 2);
    const minLeft = sideSpan + questWindow.edgeInsetPx;
    const left = Math.min(Math.max(minLeft, centered), Math.max(minLeft, vw - questWindow.widthPx - minLeft));
    return { left, top: questWindow.topPx };
  }, [questWindow]);
  /* The window's time bar reads the same D-J projection the POI halo does:
   *  elapsed ticks over the live duration (extends past the estimate when
   *  the path outgrows it). The legacy day-label stays for preset-started
   *  runs that carry no POI offer. */
  const activePoi = useMemo(
    () => QUEST_POIS.find((p) => p.questId === activeQuestId),
    [activeQuestId],
  );
  const questRunTime = useMemo(() => {
    const run = activeQuestRun.run;
    if (run && activePoi) {
      const halo = questHaloProgress(run, activePoi, currentTick);
      /* R-239: `pieno-in-attesa` (bar full, run not landed) read as
       *  "110/110 TICKS" — saturated and ambiguous. Days while marching,
       *  a named awaiting state at saturation, outcome when resolved. */
      const { key, params } = questRunTimeLabel(halo, run, dayLengthTicks);
      /* QW-1 = B (R-234): real time on a stretching scale — never full before the end. */
      const model = timeBarModel(halo, run, questRemainingTicks(run, activePoi));
      return { progress: model.progress, overrunFrom: model.overrunFrom, label: t(key, params) };
    }
    const span = questWindow.durationDays * dayLengthTicks;
    const elapsed = Math.max(0, currentTick - (run?.launchedAtTick ?? 0));
    const progress = run?.ended ? 1 : Math.min(1, elapsed / span);
    const label = run?.ended
      ? t(run.outcome === 'wipe' ? 'gameFrame.questWindow.noneReturned' : 'gameFrame.questWindow.returned')
      : t('gameFrame.questWindow.day', { day: Math.min(questWindow.durationDays, Math.floor(elapsed / dayLengthTicks) + 1), total: questWindow.durationDays });
    return { progress, label };
  }, [activeQuestRun.run, activePoi, currentTick, questWindow.durationDays, dayLengthTicks, t]);
  /* Halo cadence for the window's time bar too: without it every game tick
   * rebuilds the element and the whole 900-line window re-renders (PLAN-034
   * T-005). At ≤500ms cadence the countdown still reads as alive. */
  const questRunTimeView = useThrottledValue(questRunTime, QUEST_HALO_RENDER_MS);

  const anchors = useMemo<PixiMapAnchor[]>(() => {
    const list: PixiMapAnchor[] = [];
    if (invasion) {
      // The goblin is on the map from the day it lands: it walks from the landing point to the village in
      // INVASION_MARCH_DAYS game days. Progress is clamped, so after the march it waits at the village.
      const progress = Math.min(1, Math.max(0, (currentDay - invasion.startDay) / INVASION_MARCH_DAYS));
      list.push({
        id: 'invasion-goblin',
        x: (INVASION_LAND.x + (INVASION_VILLAGE.x - INVASION_LAND.x) * progress) * 4240,
        y: (INVASION_LAND.y + (INVASION_VILLAGE.y - INVASION_LAND.y) * progress) * 2828,
        node: <img data-testid="invasion-goblin-marker" src={goblinStickerImage} alt="" style={{ width: 300, pointerEvents: 'none', opacity: goblinLanded ? 1 : 0, filter: 'drop-shadow(0 12px 22px rgba(0,0,0,0.55))' }} />,
      });
    }
    /* Real quest POIs (S2.4 + R-127/R-143/R-180): the medallion is the planning
     *  entry and, once launched, the run's halo clock. Nothing pins at boot —
     *  a marker mounts only while a Director toggle reveals the real
     *  offers/runs; an offer past its window with no run leaves the map. Every
     *  exit plays through `anchorsWithGhosts` instead of popping off. A quest
     *  marker is NEVER a demo exemplar: under «POI types» the goblin/rovine
     *  POI mounted is the REAL offer (R-180 — the family review includes the
     *  golden type, real content A→Z); only job/event, the types without real
     *  content yet, stay fake exemplars. */
    for (const exp of expeditions) {
      const p = exp.poi;
      const avail = questPoiAvailability.get(p.id);
      /* A repeatable offer ignores a stale consumed record (authored after
       *  the POI was already consumed — D-S4-6 migration honesty). */
      if (isPoiConsumed(p, consumedPoiIds)) continue;
      /* R-200: per-POI reveal — the stagger clock, a Director force, the
       *  family review or a live run each mount the marker, and nothing on
       *  this path hides it back (only expiry/consumption still exit it). */
      if (!isQuestPoiRevealed(p.id, { revealAll: questRevealed, autoRevealedIds, hasLiveRun: !!exp.run }) || (!exp.run && avail?.state === 'expired')) continue;
      list.push({
        id: p.id,
        x: p.x,
        y: p.y,
        node: <MapQuestPoi session={exp.poiView} sizePx={p.sizePx} availability={avail} />,
      });
    }
    if (poiDemo) {
      // Job and event exemplars in different territories (canvas 4240 x 2828): southern forest, northern forest.
      const demos = [
        { type: 'job', x: 0.38, y: 0.66 },
        { type: 'event', x: 0.35, y: 0.37 },
      ] as const;
      for (const demo of demos) {
        list.push({ id: `demo-${demo.type}`, x: demo.x * 4240, y: demo.y * 2828, node: <MapDemoPoi type={demo.type} sizePx={poi?.sizePx ?? 55} /> });
      }
    }
    /* PLAN-035: no building markers on the continent — Warehouse and Emporium
     *  open from the Village view's building tooltips instead. */
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poi, questRevealed, autoRevealedIds, poiDemo, questPoiAvailability, consumedPoiIds, expeditionGoblin.poiView, expeditionGoblin.run, expeditionRovine.poiView, expeditionRovine.run, invasion, currentDay, goblinLanded]);

  /* Exit transformation (R-127): an anchor that leaves the set stays mounted
   *  one beat longer — its node re-rendered with `exiting` plays the same
   *  fade+shrink it entered with, so a POI never pops off the map when a
   *  Director toggle hides it, an offer expires, or a report consumes it.
   *  Ghosts are derived DURING render (adjust-state-on-prop-change pattern):
   *  on the very commit where an id leaves, the ghost is already in the keyed
   *  anchor list, the DOM node survives and the exit transition animates —
   *  an effect would run too late, after React already unmounted it. */
  const [prevAnchors, setPrevAnchors] = useState<PixiMapAnchor[]>(anchors);
  const [anchorGhosts, setAnchorGhosts] = useState<ReadonlyMap<string, PixiMapAnchor>>(() => new Map());
  /* The memo hands out a fresh array on many renders (session deps), so the
   *  adjustment compares the id SET — identity alone would loop forever. */
  const anchorIdsEqual = (a: PixiMapAnchor[], b: PixiMapAnchor[]) =>
    a.length === b.length && a.every((x, i) => x.id === b[i].id);
  if (!anchorIdsEqual(prevAnchors, anchors)) {
    setPrevAnchors(anchors);
    const liveIds = new Set(anchors.map((a) => a.id));
    const leaving = prevAnchors.filter((a) => !liveIds.has(a.id));
    if (leaving.length > 0) {
      setAnchorGhosts((ghosts) => {
        const next = new Map(ghosts);
        for (const anchor of leaving) next.set(anchor.id, anchor);
        return next;
      });
    }
  }
  /* Ghosts expire together one fade after the last leaver — a slightly longer
   *  invisible tail is harmless; timers may only be scheduled in an effect. */
  useEffect(() => {
    if (anchorGhosts.size === 0) return undefined;
    const timer = window.setTimeout(() => setAnchorGhosts(new Map()), EXPIRE_FADE_MS + 100);
    return () => window.clearTimeout(timer);
  }, [anchorGhosts]);
  const anchorsWithGhosts = useMemo<PixiMapAnchor[]>(() => {
    if (anchorGhosts.size === 0) return anchors;
    const liveIds = new Set(anchors.map((a) => a.id));
    const list = [...anchors];
    for (const [id, anchor] of anchorGhosts) {
      if (liveIds.has(id) || !isValidElement(anchor.node)) continue;
      list.push({ ...anchor, node: cloneElement(anchor.node as ReactElement<{ exiting?: boolean }>, { exiting: true }) });
    }
    return list;
  }, [anchors, anchorGhosts]);

  /* Title veil (PLAN-031 T-A1): real progress from the map's parallel boot
   * pipeline plus the page-level gates — tuning, consumed POIs, i18n — so the
   * reveal never shows a half-built world. `veilGone` latches: tuning/panel
   * changes may rebuild the map and re-fire onReady, but the veil never returns. */
  const [boot, setBoot] = useState<{ phase: GameBootPhase; loaded: number; total: number }>({ phase: 'manifest', loaded: 0, total: 0 });
  const [mapReady, setMapReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [warmDone, setWarmDone] = useState(false);
  const [veilGone, setVeilGone] = useState(false);
  const bootMarksRef = useRef(new Set<string>(['manifest']));
  const bootStartedAtRef = useRef(performance.now());
  useEffect(() => {
    try {
      performance.mark('game-boot:start');
    } catch {
      /* marks are best-effort */
    }
  }, []);
  /* `window.__gamePerf` (PLAN-031 T-B1): the perf probe the e2e spec and manual
   * runs drive — dev builds and the playwright preview only, never production. */
  useEffect(() => {
    if (!(import.meta.env.DEV || import.meta.env.MODE === 'playwright')) return;
    installGamePerfProbe();
  }, []);
  /* Progress lands in a ref and flushes 10x/s: a setState per resolved asset
   * would re-render the whole page dozens of times exactly while the main
   * thread is busiest decoding. */
  const bootRef = useRef(boot);
  const handleBootProgress = useCallback((progress: PixiBootProgress) => {
    bootRef.current = { phase: progress.phase, loaded: progress.loaded, total: progress.total };
    if (!bootMarksRef.current.has(progress.phase)) {
      bootMarksRef.current.add(progress.phase);
      try {
        performance.mark(`game-boot:${progress.phase}`);
      } catch {
        /* marks are best-effort */
      }
    }
  }, []);
  useEffect(() => {
    if (veilGone) return undefined;
    const flush = window.setInterval(() => {
      const next = bootRef.current;
      setBoot((prev) => (prev.phase === next.phase && prev.loaded === next.loaded && prev.total === next.total ? prev : next));
    }, 100);
    return () => window.clearInterval(flush);
  }, [veilGone]);
  const handleMapReady = useCallback(() => setMapReady(true), []);
  const handleBootError = useCallback((message: string) => setBootError(message), []);
  const bootGatesReady = tuningLoaded && consumedPoiIds !== null && mapReady && i18nReady;
  /* Assets the first interaction needs but the boot DOM does not render: portraits
   * (roster, hero sheet and medallion are closed panels at boot) and the brass
   * cursors (fetched on first use — cold, the system white hand shows). Started at
   * mount so it loads alongside the map; the veil waits for it below. */
  const assetWarmupRef = useRef<Promise<void> | null>(null);
  if (assetWarmupRef.current === null && typeof window !== 'undefined') assetWarmupRef.current = warmGameAssets();

  /* DOM warm-up behind the veil (T-A5): roster/medal images decoded and fonts
   * settled, so the first drag of a PG card pays nothing cold. */
  useEffect(() => {
    if (!bootGatesReady || warmDone) return undefined;
    let cancelled = false;
    const decodes = Array.from(document.querySelectorAll('img'))
      .slice(0, 120)
      .map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined)));
    void Promise.allSettled([...decodes, assetWarmupRef.current, document.fonts?.ready ?? Promise.resolve()]).then(() => {
      if (!cancelled) setWarmDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [bootGatesReady, warmDone]);
  const bootDone = bootGatesReady && warmDone;

  /* Boot timing evidence (T-A6): a dev-readable handle the perf harness reads
   * for the first-interactive metric, plus one telemetry event per boot. */
  const bootReportedRef = useRef(false);
  useEffect(() => {
    if (!veilGone || bootReportedRef.current) return;
    bootReportedRef.current = true;
    const interactiveMs = Math.round(performance.now() - bootStartedAtRef.current);
    (window as unknown as { __gameBoot?: Record<string, number> }).__gameBoot = { interactiveMs };
    trackTelemetryEvent('game_boot_complete', { interactiveMs });
  }, [veilGone]);

  /* PLAN-040 T-004: pre-warm the skill-check astrolabe in the boot slack —
   *  after the map's `prepare.upload` + first frames (`mapReady`), while the
   *  veil keeps its minimum display time. Runs only when enabled (measured
   *  gate, `skillCheck.warmEnabled`/`?warmcheck=1`), only with real boot
   *  slack left under the ≤4s budget, inside an idle slice, bounded by its
   *  own ~600ms guard — it never delays `onReady` or `bootDone`. */
  useEffect(() => {
    if (!mapReady || !isSkillCheckWarmEnabled()) return undefined;
    const cfg = DEFAULT_GAME_FRAME_CONFIG.questWindow.skillCheck;
    const slackMs = GAME_PERF_BUDGETS.budgets.firstInteractiveMaxMs - (performance.now() - bootStartedAtRef.current);
    if (slackMs < cfg.warmSlackMinMs) return undefined;
    const ctl = new AbortController();
    void prewarmQuestSkillCheck({ signal: ctl.signal });
    return () => ctl.abort();
  }, [mapReady]);

  /* Auto-reveal (R-200): the authored offers mount one at a time once the
   *  veil is gone — `questRevealSchedule` owns the pacing (initialDelayMs +
   *  i×staggerMs, wall clock). Additive only: a reveal never removes an id.
   *  `revealCycle` re-arms the whole sequence after a Director «Reset»; every
   *  timer is cleared on teardown/re-cycle, so StrictMode's double effect
   *  leaves exactly one armed set. */
  useEffect(() => {
    if (!veilGone || !questReveal.enabled) return undefined;
    const timers = questRevealSchedule(QUEST_POIS, questReveal).map((entry) =>
      window.setTimeout(() => {
        setAutoRevealedIds((prev) => {
          if (prev.has(entry.poiId)) return prev;
          const next = new Set(prev);
          next.add(entry.poiId);
          return next;
        });
      }, entry.delayMs),
    );
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [veilGone, revealCycle, questReveal]);

  /* The run window as a memoised element: while the clock ticks the page
   * re-renders, but an identical element reference lets React skip the whole
   * 900-line subtree on the ticks where nothing visible changed — the ticking
   * time bar itself is sampled at the halo cadence (PLAN-034 T-005). */
  const questWindowNode = useMemo(
    () =>
      activeQuestRun.run && panelsForScreen.visible.quest ? (
        <QuestRunWindow
          run={activeQuestRun.run}
          phases={activeQuestRun.phases}
          beats={scenarioForQuest(activeQuestId)?.beats ?? GOBLIN_SCENARIO.beats}
          queuedBeats={activeQuestRun.beats}
          beatCursorRef={activeQuestRun.beatCursorRef}
          beatTiming={questWindow.beats}
          title={scenarioForQuest(activeQuestId)?.title ?? GOBLIN_SCENARIO.title}
          flavour={scenarioForQuest(activeQuestId)?.flavour ?? ''}
          scenario={scenarioForQuest(activeQuestId)}
          artFor={(nodeId) => NODE_ART[nodeId]?.src}
          time={questRunTimeView}
          journeySvolgimentoTicks={activePoi?.estimatedDurationTicks}
          onChoose={(optionId) => activeQuestRun.choose(optionId)}
          nowTick={currentTick}
          onAbandon={activeQuestRun.abandon}
          onPresentingChange={setQuestPresenting}
          onExpandedStageChange={setQuestExpandedStage}
          onMinimisedChange={setQuestMinimised}
          armedFlags={activeQuestRun.armedFlags}
          onToggleArmedFlag={activeQuestRun.toggleArmedFlag}
          onClose={() => panelsForScreen.set('quest', false)}
          anchor={questAnchor}
          widthPx={questWindow.widthPx}
          theaterAspect={questWindow.theaterAspect}
          tooltipLines={questWindow.tooltipLines}
          companions={{ widthPx: questWindow.sidePanelWidthPx, gapPx: questWindow.sidePanelGapPx, minWidthPx: questWindow.minSidePanelWidthPx, edgeInsetPx: questWindow.edgeInsetPx }}
          zIndex={DEFAULT_GAME_FRAME_CONFIG.zLayers.panels}
        />
      ) : null,
    [activeQuestRun, activeQuestId, activePoi, panelsForScreen, currentTick, questRunTimeView, questAnchor, questWindow],
  );

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
        /* R-143/R-180 + R-200: the quest-only reveal of the REAL quest offers
         *  (goblin + rovine) — a quest marker is never a demo exemplar.
         *  «POI types» also surfaces them (family review). The offers now
         *  reveal themselves on a stagger after the veil lifts; this action
         *  is a one-way «reveal now» — it jumps the queue, it can never hide
         *  a POI back. Pressed once every authored offer is on the map. */
        id: 'quest',
        label: t('gameFrame.director.quest'),
        active: questShown || QUEST_POIS.every((p) => autoRevealedIds.has(p.id)),
        onTrigger: () => setQuestShown(true),
      },
      {
        /* Director «Stato iniziale»: wipes the game's progress (clock, village,
         *  quests, drafts) and reloads — the page boots as a new game and
         *  nothing stays in memory. Preferences (HUD, skin, tuning) are kept. */
        id: 'resetInitial',
        label: t('gameFrame.director.resetInitial'),
        onTrigger: () => {
          void clearGameProgress().finally(() => window.location.reload());
        },
      },
      {
        id: 'questRun',
        label: t('gameFrame.director.questRun'),
        active: !!questRun.run && !questRun.run.ended,
        /* Real launch path only: the Director stages a one-click expedition
         *  through the SAME canonical boundary the player crosses (offer
         *  resolution, slot eligibility, party freeze, loadout reservation,
         *  settlement) — no lab-preset run. A run can't be launched twice:
         *  on an existing goblin run the button opens its canonical window
         *  instead, the same surface the map marker routes to. */
        onTrigger: () => {
          if (questRun.run) openRunWindow('goblin');
          else expeditionGoblin.demoLaunch();
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
        /* PLAN-032 SP-5: the level-up staging beat — mock presentation only.
         *  The command itself decides accept/reject (invalid config, non-hero
         *  targets, or no mounted hero card all reject with no telemetry/cue). */
        id: 'levelup',
        label: t('gameFrame.director.levelUp'),
      {
        /* PLAN-067 T-C2 (R-234, EXP = A): the defeat report staged on a COPY of the run — nothing settles. */
        id: 'expeditionLost',
        label: t('gameFrame.director.expeditionLost'),
        onTrigger: () => {
          const current = activeQuestRun.run;
          if (current) setExpeditionLostRun(stageExpeditionLost(current));
        },
      },
        /* T-C1 (R-234): never silent — a closed roster is opened and the command retried until a card mounts. */
        onTrigger: () => runStagingOpeningRoster({
          run: () => runHeroLevelUpStaging({ residentsById, playCue: playLevelUpCue }),
          openRoster: () => panelsForScreen.set('roster', true),
        }),
      },
      {
        /* PLAN-034 T-010: the settlement-lost takeover, staged on demand for
         *  trailer takes. This is a DIRECTOR trigger only — the canonical
         *  day-30 loss path is explicitly out of scope (no GameOverService). */
        id: 'settlementLost',
        label: t('gameFrame.director.settlementLost'),
        active: settlementLostActive,
        onTrigger: () => useMinimalGameplayStore.getState().triggerSettlementLost(),
      },
      {
        /* R-264: Director-only revive — clears `isDead` on store residents so
         *  the canonical roster shows them again. Permanent death is a player
         *  rule (desiderata); this is playtest tooling on the Director surface.
         *  The settlement ledger keeps its `dead:` keys, so a replay can never
         *  re-kill a revived resident. Lit up only while someone is dead. */
        id: 'reviveFallen',
        label: t('gameFrame.director.reviveFallen'),
        active: deadResidentCount > 0,
        onTrigger: () => useMinimalGameplayStore.getState().reviveDeadResidents(),
      },
      {
        id: 'skin',
        label: t('gameFrame.director.skin', { name: getSkinPresetConfig(skinId).label }),
        onTrigger: () =>
          setSkinId((current) => COMPARABLE_SKIN_IDS[(COMPARABLE_SKIN_IDS.indexOf(current) + 1) % COMPARABLE_SKIN_IDS.length]),
      },
    ],
    [invasion, questShown, autoRevealedIds, poiDemo, currentDay, t, skinId, session.gameplay.state.currentTick, questRun, panels, panelsForScreen, residentsById, questWindow.consumablesArmedByDefault, expeditionGoblin, settlementLostActive, openRunWindow, residentsById, deadResidentCount],
  );

  return (
    <TooltipProvider>
      {!veilGone && (
        <GameBootScreen
          phase={boot.phase}
          indeterminate={boot.total === 0}
          fraction={boot.total > 0 ? boot.loaded / boot.total : 0}
          done={bootDone}
          error={bootError}
          onExited={() => setVeilGone(true)}
        />
      )}
      <RosterKitShell>
        <DndContext
          sensors={session.sensors}
          collisionDetection={slotMagnet}
          /* Pre-measure droppable rects while idle (BeforeDragging): the default
           * WhileDragging defers all getBoundingClientRect reads to the activation
           * frame, where they land as one forced-layout spike (~1 long frame at
           * pickup, PLAN-031 T-B4). Droppables don't move mid-drag, so cached
           * rects keep collision detection correct. */
          measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
          onDragStart={(event: DragStartEvent) => {
            /* Drag-start re-renders the whole page (anchors, roster, HUD). Marking
             * it a transition makes that render interruptible — React splits it
             * across frames instead of one ~117ms block at pickup (PLAN-031 T-B4).
             * A slotted token (slot↔slot swap, R-183) is the exception: its
             * swap-preview bloom must paint WHILE the token is in the air —
             * scheduled as a transition it can starve behind the drag's
             * continuous updates and never render. The token path is light, so
             * it stays synchronous. */
            if (event.active.data.current?.type === 'slot-token') {
              expeditions.forEach((exp) => exp.handleDragStart(event));
              return;
            }
            startTransition(() => {
              session.handleDragStart(event);
              expeditions.forEach((exp) => exp.handleDragStart(event));
            });
          }}
          onDragCancel={() => {
            session.setDraggingResidentId(null);
            expeditions.forEach((exp) => exp.setDraggingResidentId(null));
          }}
        >
          <GameFrameDragCursor />
          <GameStageProvider value={stage}>
          <GameFrameScreen
            panels={panelsForScreen}
            stageMode
            devPanels={directorEnabled}
            scaleControl={hudScale}
            hudWakeSignal={hudWakeSignal}
            timeInputLocked={timeFrozen}
            activeNavId={viewMode}
            onNavSelect={(id) => goToView(id === 'village' ? 'village' : 'map')}
            onHudHiddenChange={(hidden, cause) => setHudIdleHidden(hidden && cause === 'idle')}
            rosterSlot={({ onClose }) => (
              /* WS-2: the stage frame supplies the leftWing rect + suspension;
               * SP-1: the rail wrapper is the delegation boundary — pointer/focus
               * events on the cards reach the hero-sheet machine here; the frozen
               * roster inside is untouched. */
              <StagePanelFrame panelId="roster">
              <div ref={heroSheet.railRef} {...heroSheet.railProps}>
              <Roster
                onClose={onClose}
                componentId="game-frame-roster"
                density="compact"
                useExternalDndContext
                onDragEnd={(event: DragEndEvent) => {
                  /* Ownership by droppable id: an expedition slot consumes
                   * the drop; anything else falls to the activity session.
                   * `false` (rejected) is a verdict too — it must not fall
                   * through, or a refused drop would land elsewhere.
                   * The drop commits the same page-wide render as drag-start —
                   * the transition splits it across frames (PLAN-031 T-B4).
                   * `startTransition` runs its scope synchronously, so the
                   * verdict is still captured in time. */
                  let verdict: RosterDropVerdict;
                  /* Every drag-start marks every session, but only the owner
                   * receives drag-end when a verdict stops the chain. Clear all
                   * of them synchronously before scheduling the drop commit:
                   * in the transition the roster would keep rendering the
                   * stale forced overlay at viewport center after release. */
                  session.setDraggingResidentId(null);
                  expeditionGoblin.setDraggingResidentId(null);
                  expeditionRovine.setDraggingResidentId(null);
                  startTransition(() => {
                    verdict =
                      expeditionGoblin.handleDragEnd(event) ??
                      expeditionRovine.handleDragEnd(event) ??
                      session.handleDragEnd(event);
                  });
                  return verdict!;
                }}
                onFlightComplete={(residentId, slotId) => {
                  const owner = expeditions.find((exp) => exp.ownsSlotId(slotId));
                  if (owner) owner.handleFlightComplete(residentId, slotId);
                  else session.handleFlightComplete(residentId, slotId);
                }}
                onResidentSelect={(residentId) => {
                  if (expeditionGoblin.handleResidentSelect(residentId)) return;
                  if (expeditionRovine.handleResidentSelect(residentId)) return;
                  session.handleResidentSelect(residentId);
                }}
                /* R-241 B5 (game-frame-pixi.INV-3): while ANY quest context
                   is live — an expedition run unsettled, the POI quest
                   running or uncollected — the whole chain abstains so the
                   roster paints resident statuses, never planner noise like
                   «Nessuno slot compatibile». */
                getResidentCompatibility={rosterCompatibility}
                lockedResidentIds={[
                  ...new Set([
                    ...session.lockedResidentIds,
                    ...expeditionGoblin.lockedResidentIds,
                    ...expeditionRovine.lockedResidentIds,
                  ]),
                ]}
                lockedStatusLabel={session.t('roster.status.assigned')}
                activeResidentId={draggingResidentId}
              />
              </div>
              </StagePanelFrame>
            )}
            extraEvents={extraEvents}
            fixtureEvents={false}
            overlaySlot={
              <>
                {/* The announcement lives in the viewport, centred on the free area the HUD leaves (not on the world canvas,
                 *  which sits under the chrome). `safeFit` is the same inset set that frames the land. */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 13 }}>
                  <WorldSurfaceEventCard
                    visible={cardOpen}
                    zIndex={1}
                {/* T-C1 (R-234): the level-up ceremony plates (one per hero). */}
                <HeroLevelCeremony residentsById={residentsById} />
                    screenAnchor={{
                      left: `calc(${safeFit?.insets.left ?? 0}px + (100% - ${(safeFit?.insets.left ?? 0) + (safeFit?.insets.right ?? 0)}px) / 2)`,
                      top: `calc(${safeFit?.insets.top ?? 0}px + (100% - ${(safeFit?.insets.top ?? 0) + (safeFit?.insets.bottom ?? 0)}px) / 2)`,
                    }}
                    screenScale={INVASION_SCREEN_SCALE}
                    worldCenter={{ x: 4240 / 2, y: 2828 / 2 }}
                    canvasSize={{ width: 4240, height: 2828 }}
                    camera={{ panX: 0, panY: 0, zoom: 1 }}
                    fallTarget={{ x: Math.round(4240 * INVASION_LAND.x), y: Math.round(2828 * INVASION_LAND.y) }}
                    marchTarget={{ x: Math.round(4240 * INVASION_VILLAGE.x), y: Math.round(2828 * INVASION_VILLAGE.y) }}
                    daysRemaining={INVASION_WARNING_DAYS}
                    showReminder={false}
                    warm={bootDone}
                    landingSelector="[data-testid='invasion-goblin-marker']"
                    onLand={() => setGoblinLanded(true)}
                    rowSelector="[data-event-id='invasion']"
                    onArrive={() => setRowArriving(false)}
                    cardSize={INVASION_CARD_SIZE}
                    onComplete={() => {
                      setShroudCovered(false);
                      // The marker mounts now but stays hidden until the sticker lands on it.
                      setGoblinLanded(false);
                      setInvasion({ dueDay: currentDay + INVASION_WARNING_DAYS, startDay: currentDay });
                      // The threat lands in the ledger: it opens and stays open, the card folds into the new row.
                      // The player closes it when they want.
                      setRowArriving(true);
                      if (!panelsForScreen.visible.events) panelsForScreen.set('events', true);
                    }}
                    onClose={() => {
                      setCardOpen(false);
                      setRowArriving(false);
                    }}
                  />
                </div>
                {/* PLAN-043 WS-5 DEF-06: browser interface-size zoom — the
                 *  chrome/overlays layer carries the CSS `zoom` factor
                 *  (`hudScale.cssZoom`, 1 in the desktop app where the native
                 *  webview zoom covers it). `pointerEvents: none` on the
                 *  layer itself; every panel root re-arms it explicitly. */}
                <div data-hud-zoom-layer="" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zoom: hudScale.cssZoom }}>
                {session.overlays}
                {expeditionGoblin.overlays}
                {expeditionRovine.overlays}
                {/* SP-1: the hero sheet floats over the map, rail-adjacent to the
                 *  card under the pointer. */}
                {heroSheet.panelNode}
                {/* SP-2: the village stash mock panel — WS-2 moves it into the
                 *  leftWing zone; the stage frame supplies the rect and the
                 *  suspension treatment, the panel fills it. */}
                {stage.isOpen('villageStash') && (
                  <StagePanelFrame panelId="villageStash" positioned={false}>
                    {(res) => (
                      <VillageStashPanel
                        config={VILLAGE_STASH_CONFIG}
                        left={res.rect?.x ?? 0}
                        top={res.rect?.y ?? 0}
                        widthPx={res.rect?.w ?? VILLAGE_STASH_CONFIG.panel.widthPx}
                        maxHeightPx={res.rect?.h}
                        zIndex={DEFAULT_GAME_FRAME_CONFIG.zLayers.panels}
                        onClose={closeVillageStash}
                      />
                    )}
                  </StagePanelFrame>
                )}
                {/* SP-3: the merchant mock panel — same zone convention via the
                 *  stage frame (rightWing occupant). */}
                {stage.isOpen('merchant') && (
                  <StagePanelFrame panelId="merchant" positioned={false}>
                    {(res) => (
                      <MerchantPanel
                        config={MERCHANT_CONFIG}
                        left={res.rect?.x ?? 0}
                        top={res.rect?.y ?? 0}
                        widthPx={res.rect?.w ?? MERCHANT_CONFIG.panel.widthPx}
                        zIndex={DEFAULT_GAME_FRAME_CONFIG.zLayers.panels}
                        onClose={closeMerchant}
                      />
                    )}
                  </StagePanelFrame>
                )}
                {/* PLAN-034 T-010: dev/Director staging of the loss takeover —
                 *  fires only when `gameOverState` says so; no canonical
                 *  day-30 path exists yet. */}
                <SettlementLostOverlay />
                {/* WS-2/WS-4: in `run` regime the QuestStageCluster owns the
                    whole-stage geometry — the window fills the solver's center
                    slot, the right wing hosts the naked Astrolabe + Verdict
                    Card, and the left companion paints inside the window shell
                    at the solver's reserved slot (folded → roster tab). The
                    group drag commits only `userCenterX`/`userTopY` intent. */}
                {questWindowNode &&
                  (clusterGeometry && clusterEnvelope ? (
                    <QuestStageCluster
                      viewport={stage.state.viewport}
                      envelope={clusterEnvelope}
                      intent={{ userCenterX: stage.state.userCenterX, userTopY: stage.state.userTopY }}
                      onCommitIntent={(userCenterX, userTopY) => stage.api.stageDrag(userCenterX, userTopY)}
                      wings={{ leftOpen: questPill !== null && !questMinimised, rightOpen: checkLive && !questMinimised, expanded: questExpandedStage }}
                      renderWindow={() =>
                        cloneElement(questWindowNode, {
                          inCluster: true,
                          activePill: questPill,
                          onPillToggle: setQuestPill,
                          companionFolded: clusterGeometry.leftFolded,
                          expandedStage: clusterGeometry.expandedEffective,
                        })
                      }
                      renderRightWing={
                        checkLive && checkBridge && activeQuestRun.run && !questMinimised
                          ? () => <QuestSkillCheckColumn bridge={checkBridge} run={activeQuestRun.run} />
                          : undefined
                      }
                      zIndex={DEFAULT_GAME_FRAME_CONFIG.zLayers.panels}
                    />
                  ) : (
                    <StagePanelFrame panelId="quest" positioned={false}>
                      {questWindowNode}
                    </StagePanelFrame>
                  ))}
                {/* PLAN-040 T-003a → WS-4: the centered check overlay is now
                    only the `skipCheck` fallback — the normal flow paints the
                    check in the cluster's right wing. The outcome toast still
                    portals into `#game-modal-root`. */}
                <QuestOverlays questId={activeQuestId} onDismissOutcome={activeQuestRun.dismissOutcome} checkInColumn={!!clusterGeometry && !questMinimised} />
                {/* R-199 pt.14: the end-of-run report is its own floating
                    plaque OUTSIDE the quest window's DOM — staged reveal,
                    skippable, draggable, non-modal. */}
                {(expeditionLostRun || (rewardVisible && activeQuestRun.run)) && (
                  <QuestRewardPopup
                    run={(expeditionLostRun ?? activeQuestRun.run)!}
                    scenario={scenarioForQuest(activeQuestId)}
                    widthPx={questWindow.rewardPopup.widthPx}
                    stageMs={questWindow.rewardPopup.stageMs}
                    edgeInsetPx={questWindow.rewardPopup.edgeInsetPx}
                    onClose={() => {
                      if (expeditionLostRun) setExpeditionLostRun(null);
                      else closeReward();
                    }}
                  />
                )}
                {directorEnabled && panels.visible.tuning && (
                  <TuningPanel
                    fields={tuningFields}
                    notice={tuningBakeFailed ? t('gameFrame.tuning.bakeFailed') : reducedMotion ? 'Reduce motion is ON in the system settings: forest sway, smoke, cloud drift and sea wonders are off.' : undefined}
                    onCommit={(id, value) => (id === 'plaqueBand' ? setHudBandPx(value) : setTuned((current) => ({ ...current, [id]: value })))}
                    onReset={() => {
                      setTuned({});
                      setHudBandPx(DEFAULT_HUD_BAND_PX);
                    }}
                    saved={tuningSaved}
                    onSave={() => {
                      void saveData(TUNING_KEY, { tuned, band: bandNow });
                      void navigator.clipboard?.writeText(tuningFields.map((field) => `${field.id}: ${field.value}`).join(', '));
                      /* R-181: «Save» also bakes the tuned values into the shipped defaults — the dev endpoint
                       * rewrites worldDressing.motion/seabed, DEFAULT_MAP_TUNE and DEFAULT_HUD_BAND_PX, so the
                       * chosen look is the default on every surface and session, not just this browser's
                       * storage. The storage save above stays as the runtime fallback for non-dev surfaces. */
                      setTuningBakeFailed(false);
                      void fetch('/__hud-tuning-default', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ values: Object.fromEntries(tuningFields.map((field) => [field.id, field.value])) }),
                      })
                        .then((res) => setTuningBakeFailed(!res.ok))
                        .catch(() => setTuningBakeFailed(true));
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
                      /* R-200: re-arm the stagger — the revealed markers ghost
                       *  out, then the offers re-enter one every staggerMs
                       *  (a fresh take of the reveal sequence). */
                      setQuestShown(false);
                      setAutoRevealedIds(new Set());
                      setRevealCycle((cycle) => cycle + 1);
                    }}
                  />
                )}
                {/* WS-2 stage chrome: wing rails + strip tabs, the run-regime
                 *  rejection toast, and Escape bindings for the zone-managed
                 *  panels (the run cluster keeps its own overlay arbitration;
                 *  heroSheet is overlay-exempt and manages Escape itself). */}
                <StagePanelEscape panelId="roster" onEscape={() => panelsForScreen.set('roster', false)} />
                <StagePanelEscape panelId="events" onEscape={() => panelsForScreen.set('events', false)} />
                <StagePanelEscape panelId="villageStash" onEscape={closeVillageStash} />
                <StagePanelEscape panelId="merchant" onEscape={closeMerchant} />
                <StagePanelEscape panelId="questDetail" onEscape={closeAnyExpeditionDetail} />
                <StageStripsLayer />
                <StageRejectedToast />
                </div>
              </>
            }
            renderMap={({ recenterSignal, focusRequest }) => (
              <div style={{ position: 'absolute', inset: 0, isolation: 'isolate' }}>
                {/* CTR-game-001/REG-001: the map NEVER unmounts in village view —
                 *  the WebGL context, ticker and camera stay alive under an
                 *  opaque-hidden layer that is also inert and aria-hidden so
                 *  nothing inside is clickable or reachable by keyboard. */}
                <div
                  data-testid="world-map-layer"
                  aria-hidden={viewMode !== 'map' || undefined}
                  inert={viewMode !== 'map' ? true : undefined}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: viewMode === 'map' ? 1 : 0,
                    pointerEvents: viewMode === 'map' ? 'auto' : 'none',
                    transition: 'opacity 240ms ease-out',
                  }}
                >
                  <PixiWorldMap
                    manifestPath={resolveWorldManifestPath(worldDressing)}
                    hiddenLayerIds={worldDressing.hiddenLayerIds}
                    safeFit={safeFit}
                    recenterSignal={recenterSignal}
                    focusRequest={focusRequest}
                    anchors={anchorsWithGhosts}
                    worldOverlay={
                      journeyRouteRuns.length
                        ? (canvas) =>
                            journeyRouteRuns.map((run) => (
                              <QuestJourneyRoute key={runIdOf(run)} run={run} canvas={canvas} />
                            ))
                        : undefined
                    }
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
                    regions={{ assetBase: '/assets/world/wanderlust/base', onHover: setRegionHover, onSelect: handleRegionSelect }}
                    onBootProgress={handleBootProgress}
                    onReady={handleMapReady}
                    onBootError={handleBootError}
                  />
                  {viewMode === 'map' && regionHover && <RegionTooltip name={t(`gameFrame.regions.${regionHover.region.id}`)} x={regionHover.x} y={regionHover.y} />}
                  <WorldSurfaceEventShroud covered={shroudCovered} zIndex={6} />
                </div>
                {viewMode === 'village' && (
                  <VillageScreenView
                    ref={villageViewRef}
                    onOpenStash={(trigger) => openVillagePanel('villageStash', trigger)}
                    onOpenMerchant={(trigger) => openVillagePanel('merchant', trigger)}
                  />
                )}
              </div>
            )}
          />
          </GameStageProvider>
        </DndContext>
      </RosterKitShell>
    </TooltipProvider>
  );
}
