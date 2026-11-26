import { cloneElement, isValidElement, startTransition, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, MeasuringStrategy, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { createMagneticSlotCollision } from '@/ui/idleVillage/interaction/magneticCollision';
import { getCurrentDragConfig } from '@/ui/idleVillage/config/dragConfig';
import { GameFrameDragCursor } from '@/ui/idleVillage/components/gameFrame/GameFrameDragCursor';
import { useQuestPoiSession } from '@/ui/idleVillage/quests/useQuestPoiSession';
import { useQuestRun } from '@/ui/idleVillage/questS1Lab/useQuestRun';
import { type QuestId, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { runIdOf } from '@/ui/idleVillage/quests/questSettlement';
import { NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';
import { isPoiConsumed, poiConsumesOnReportClose, QUEST_HALO_RENDER_MS, QUEST_HALO_STEPS, QUEST_POIS, questPoiById, type QuestPoi } from '@/balancing/config/idleVillage/quests/questPois';
import { placeById } from '@/balancing/config/idleVillage/placesConfig';
import { useQuestExpeditionSession } from '@/ui/idleVillage/quests/useQuestExpeditionSession';
import { HudRealCassettoDetail } from '@/ui/idleVillage/hudReal/HudRealCassettoDetail';
import type { QuestExpeditionDetailProps } from '@/ui/idleVillage/quests/QuestExpeditionDetail';
import { composeRosterCompatibility } from '@/ui/idleVillage/quests/rosterCompatibility';
import { scenarioForQuest } from '@/ui/idleVillage/questS1Lab/questOffer';
import { questHaloProgress, questRemainingTicks } from '@/ui/idleVillage/questS1Lab/questSchedule';
import { questRunTimeLabel, timeBarModel } from '@/ui/idleVillage/questS1Lab/questTickCounter';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { questAvailability, type QuestAvailability } from '@/ui/idleVillage/components/gameFrame/questAvailability';
import { useStableValue, useThrottledValue } from '@/ui/idleVillage/hooks/useThrottledValue';
import { isQuestPoiRevealed, questRevealSchedule } from '@/ui/idleVillage/components/gameFrame/questRevealSchedule';
import { resolveQuestShellLayout, solveQuestClusterGeometry } from '@/ui/idleVillage/components/gameFrame/questShellLayout';
import { stageExpeditionLost } from '@/ui/idleVillage/components/gameFrame/expeditionLostStaging';
import {
  GameStageProvider,
  StagePanelEscape,
  StagePanelFrame,
  StageRejectedToast,
  StageStripsLayer,
  isStageManagedPanel,
  useGameStageZonesState,
} from '@/ui/idleVillage/components/gameFrame/stageZones/useGameStageZones';
import { QuestStageCluster } from '@/ui/idleVillage/components/gameFrame/QuestStageCluster';
import { QuestSkillCheckColumn } from '@/ui/idleVillage/components/gameFrame/QuestSkillCheckColumn';
import { checkEventOf, isStaleCheckEvent, useCheckBridge } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { installGamePerfProbe } from '@/ui/idleVillage/utils/gamePerfProbe';
import { GAME_PERF_BUDGETS } from '@/ui/idleVillage/config/gamePerfBudgets';
import { isSkillCheckWarmEnabled, prewarmQuestSkillCheck } from '@/ui/idleVillage/components/gameFrame/questSkillCheckWarm';
import { runHeroLevelUpStaging } from '@/ui/idleVillage/rosterV2/runHeroLevelUpStaging';
import { runStagingOpeningRoster } from '@/ui/idleVillage/rosterV2/runStagingOpeningRoster';
import { playLevelUpCue } from '@/ui/idleVillage/rosterV2/heroLevelCue';
// eslint-disable-next-line no-restricted-imports
import { EXPIRE_FADE_MS, MAP_QUEST_POI_TARGET, MapQuestPoi } from '@/ui/idleVillage/components/gameFrame/MapQuestPoi';
import { POI_ZANARA_CONFIG } from '@/balancing/config/idleVillage/poiZanaraConfig';
import { PixiWorldMap, type PixiBootProgress, type PixiMapAnchor } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { MAPPA2_APPROVED_MAP_PROPS, MAPPA2_GAME_GRADE, MAPPA2_REGIONS_BASE, MAPPA2_V2_LAND, MAPPA2_V2_TILES } from '@/ui/idleVillage/config/mappa2ApprovedLook';
import { detectTier, readTierEnv, TIER_PROFILES, tierForQuality, type TierProfile } from '@/ui/idleVillage/config/mappa2Tiers';
import { getGameSettings, subscribeGameSettings } from '@/ui/idleVillage/state/gameSettings';
import { mountainClarityLive, mountainShadeLive, seaGradeLive } from './mappa2-grade';
import { HudRealTimeConnected } from '@/ui/idleVillage/hudReal/HudRealTimeConnected';
import { HudRealResources } from '@/ui/idleVillage/hudReal/HudRealResources';
import { HudRealNav } from '@/ui/idleVillage/hudReal/HudRealNav';
import { HudRealVoce } from '@/ui/idleVillage/hudReal/HudRealVoce';
import { voceMessageFor } from '@/ui/idleVillage/hudReal/voceFeed';
import { VOCE_CONFIG } from '@/ui/idleVillage/config/voceConfig';
import { nextEventModel } from '@/ui/idleVillage/components/gameFrame/nextEvent';
import { zoomFor } from '@/ui/idleVillage/hudReal/layout/hudLayoutB';
import { placeGameHud, type BarPlacement } from '@/ui/idleVillage/hudReal/layout/gameHudPlacement';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { buildResourceReadoutItems } from '@/ui/idleVillage/components/gameFrame';
import { VillageDirectorView } from '@/ui/idleVillage/components/gameFrame/VillageDirectorView';
import { GameBootScreen } from '@/ui/idleVillage/components/gameFrame/GameBootScreen';
import {
  initializeMinimalGameplayStore,
  selectResourceOutlook,
  useMinimalGameplayStore,
  useMinimalGameplayWithIdleVillageConfig,
} from '@/store/useMinimalGameplay';
import { useTimeEngineLoop } from '@/ui/idleVillage/hooks/useTimeEngineLoop';
import { HudGameMenu } from '@/ui/idleVillage/components/gameFrame/HudGameMenu';
import { useGameMenuFlow } from '@/ui/idleVillage/components/gameFrame/menu/useGameMenuFlow';
import { MenuDialogDress } from '@/ui/idleVillage/components/gameFrame/menu/GameMenuDialog';
import { useHudPanels } from '@/ui/idleVillage/components/gameFrame/useHudPanels';
import type { HudPanelId } from '@/ui/idleVillage/components/gameFrame/hudPanelRegistry';
import { HudRealRoundButton } from '@/ui/idleVillage/hudReal/HudRealRoundButton';
import { HudRealMenuPanel } from '@/ui/idleVillage/hudReal/HudRealMenuPanel';
import { saveNowToManualSlot } from '@/ui/idleVillage/state/gameSaveService';
import { useGameAutosave } from '@/ui/idleVillage/state/useGameAutosave';
import { ambientForPhase, DAYLIGHT, nightShownAt, offeredSpeeds, type Ambient } from '@/ui/idleVillage/config/timeOfDay';
import { DirectorPanel, type DirectorAction } from '@/ui/idleVillage/components/gameFrame/DirectorPanel';
import { HudRealReliquary } from '@/ui/idleVillage/hudReal/HudRealReliquary';
import { HudRealMerchantPanel } from '@/ui/idleVillage/hudReal/HudRealMerchantPanel';
import { HudRealLedgerPanel } from '@/ui/idleVillage/hudReal/HudRealLedgerPanel';
import { HudRealExpeditionLost } from '@/ui/idleVillage/hudReal/HudRealExpeditionLost';
import { HudRealVictoryReward } from '@/ui/idleVillage/hudReal/HudRealVictoryReward';
import { HudRealLevelUp } from '@/ui/idleVillage/hudReal/HudRealLevelUp';
import { SettlementLostOverlay } from '@/ui/idleVillage/components/SettlementLostOverlay';
import { OxidizedGradeFilter } from '@/ui/idleVillage/components/OxidizedGradeFilter';
import { useSettlementLostGrade, SETTLEMENT_LOST_WORLD_FILTER_ID } from '@/ui/idleVillage/hooks/useSettlementLostGrade';
import { clearGameProgress, CONSUMED_POIS_KEY, INVASION_KEY } from '@/ui/idleVillage/components/gameFrame/questInitialState';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { WorldSurfaceEventShroud } from '@/ui/idleVillage/components/WorldSurfaceEventShroud';
import { WorldSurfaceEventCard } from '@/ui/idleVillage/components/WorldSurfaceEventCard';
import goblinStickerImage from '@/assets/ui/idleVillage/goblin-march-trasparente.webp';
import { applySkinCssVariables } from '@/ui/idleVillage/skins/skinCssVariables';
import { getSkinPresetConfig, type SkinPresetId } from '@/ui/idleVillage/skins/skinConfigRegistry';
import { COMPARABLE_SKIN_IDS, resolveInitialSkinPresetId } from '@/ui/idleVillage/skins/resolveInitialSkin';
import { warmGameAssets } from '@/ui/idleVillage/utils/gameAssetWarmup';
import { MatericRosterComponentV2 } from '@/ui/idleVillage/rosterV2';
import { RosterKitShell, useRosterKitData, type RosterDropVerdict } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { QuestJourneyRoute, QuestOverlays, QuestRunWindow, RegionTooltip, useHeroSheet, type HeroSheetApi, type HudEvent, type HudPanelsApi, type VillageScreenViewHandle } from '@/ui/idleVillage/components/gameFrame';
import { MapDemoPoi } from '@/ui/idleVillage/components/gameFrame/MapDemoPoi';
import { VillageStashPanel } from '@/ui/idleVillage/components/gameFrame/VillageStashPanel';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import { GameTopChrome } from '@/ui/idleVillage/components/gameFrame/GameTopChrome';
import { useVillageStashStore } from '@/ui/idleVillage/store/useVillageStashStore';
import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';
import { MERCHANT_CONFIG } from '@/balancing/config/idleVillage/merchantConfig';
import type { PixiRegionHover } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import '@/ui/idleVillage/components/gameFrame/gameFrameCursors.css';

/**
 * `/game` (2026-11-10) — the approved mappa2 look (`mappa2ApprovedLook`, Director ruling the same day) with the three
 * signed HUD surfaces of `/hud-compose`: time + speed, resources, nav plinth with compass. Placement is the signed
 * blueprint B1 (`hudLayoutB`), the same rects and scale math as `/hud-compose`. The previous game page lives at
 * `/gameOld`.
 *
 * Map cost: the approved grade is drawn as ONE combined multiply + add pair (`MAPPA2_GAME_GRADE`) instead of the
 * lab's four live sheets — same image, two full-world textures and three full-screen passes fewer.
 *
 * Runtime: one time driver (`useTimeEngineLoop`), store hydrated on mount and resumed like the old page. The map is
 * framed like the lab (cover fit, no safe-fit insets) — the framing the Director approved.
 */

/* PLAN-115 F4/D4: the map profile follows the «Qualità grafica» setting (auto = device tier); dev seam `?tier=desktop|deck|mobile`. */
const DEV_Q = import.meta.env.DEV ? new URLSearchParams(window.location.search) : new URLSearchParams();
const TIER_Q = DEV_Q.get('tier');
const DETECTED_TIER = detectTier(readTierEnv());

/* Dev A/B seam for the pixel-identity proof: `?grade=split` draws the four live lab sheets instead of the combined pair. */
const SPLIT_GRADE = DEV_Q.get('grade') === 'split';
/** Dev: `?tod=night|dusk|day` previews a time of day whatever the clock says (same seam as /gameOld). */
const TOD_PREVIEW = DEV_Q.get('tod');
const PAGE = DEFAULT_GAME_FRAME_CONFIG.gamePage;
const TOD = DEFAULT_GAME_FRAME_CONFIG.timeOfDay.map;
const HIDE = DEFAULT_GAME_FRAME_CONFIG.hudHide;
const CORNER = PAGE.corner;
/* Dev A/B seam for the GPU-budget options: `?light=none` or a subset `?light=dist,tile,base,foam,field`; default = the profile's. */
const LIGHT_Q = DEV_Q.get('light');
/* Dev A/B seam for the hi-res base (Director 2026-11-10, «voglio che i player possano zoomare»): `?hires=1`. */
const HI_RES = DEV_Q.get('hires') === '1';
/* PLAN-115 F1 preview seams (dev): `?land=hi` approved base + hi-res detail, `?land=hiclean` same but detail only where the structure agrees, `?land=hiraw` raw hi painting on the land,
 * `?land=hisea` raw hi on land AND sea (Mare hidden, D2 b), `?land=hirawsea` raw hi land + raw hi sea; `?grade=noclarity` drops the mountain clarity plate (D3 b). */
const LAND = DEV_Q.get('land');
/* Look v2 is the default (PLAN-115 ruling 2026-11-10); dev seams: `?look=v1` the previous 2752 look, `?tiles=0` no tiles. */
const LOOK_V1 = DEV_Q.get('look') === 'v1';
const NO_CLARITY = DEV_Q.get('grade') === 'noclarity';

/* Goblin invasion theatre (R-325 slice 4, ported from /gameOld): shroud → announcement
 * card → march marker + ledger row + persistence. The map canvas changed (mappa2 is
 * 2752×1536 vs the old 4240×2828), so the normalized anchors were re-placed on this
 * geography: LAND is the west coast edge (region_ids.png: mainland ends ~x880 @ y700,
 * ridge_forest/sea_west) and VILLAGE the painted village zone centre
 * (fx/village/village.json zone 1260,505,510,390 → 1515,700). The sticker keeps the
 * old world fraction (300px of 4240 → 195px of 2752). */
const INVASION_WARNING_DAYS = 5;
const INVASION_CARD_SIZE = 0.75;
const INVASION_SCREEN_SCALE = 1;
const INVASION_MARCH_DAYS = 30;
const INVASION_LAND = { x: 0.32, y: 0.456 } as const;
const INVASION_VILLAGE = { x: 0.551, y: 0.456 } as const;
const INVASION_MARKER_PX = 195;
const MAPPA2_CANVAS = { w: 2752, h: 1536 } as const;
/* R-325 quest slice: the authored quest offers keep their old-map positions in
 * config (canvas 4240×2828). On Mappa2 the proportional spots land in
 * red_desert / red_canyons — reachable land a march away from the painted
 * village; the re-based copies flow into sessions, markers and the frozen
 * journey route (config stays untouched for /gameOld). */
const MAPPA2_POI_POS: Readonly<Record<string, { x: number; y: number }>> = {
  'poi-goblin': { x: 1785, y: 543 },
  'poi-rovine': { x: 1980, y: 788 },
};
/** Centre of the painted village zone (`fx/village/village.json`) — the journey route's origin. */
const MAPPA2_VILLAGE_ORIGIN = { x: 1515, y: 700 } as const;
/* Real job POIs anchor on the authored village Place
 *  (`place_village_start.worldPoint` in placesConfig — work happens there,
 *  no authored work sites yet): the marker hangs off the painted square's
 *  south-west edge and concurrent jobs fan out sideways so they never stack. */
const JOB_POI_VILLAGE_OFFSET = { x: -95, y: 110 } as const;
const JOB_POI_CLUSTER_SPACING = 92;
/** Returns the config POI re-based on the Mappa2 canvas, or undefined when unmapped. */
const mappa2Poi = (id: string): QuestPoi | undefined => {
  const p = questPoiById(id);
  const pos = MAPPA2_POI_POS[id];
  return p && pos ? { ...p, ...pos } : undefined;
};
const SLOT_MAGNET = createMagneticSlotCollision(getCurrentDragConfig().magnetism.slotRadiusPx);
const EMPTY_QUEST_RUN_TIME: { progress: number; label: string; overrunFrom?: number } = { progress: 0, label: '' };
/** Field-wise equality for the quest-window time model (R-265). */
function questRunTimeEqual(
  a: { progress: number; label: string; overrunFrom?: number },
  b: { progress: number; label: string; overrunFrom?: number },
): boolean {
  return a.progress === b.progress && a.label === b.label && a.overrunFrom === b.overrunFrom;
}
/** Structural equality for throttled offer availability (PLAN-034 T-005). */
const availEqual = (a: QuestAvailability | undefined, b: QuestAvailability | undefined): boolean =>
  a === b || (!!a && !!b && a.state === b.state && a.progress === b.progress);

/* Zanara POI review (PLAN-117, 2026-11-12): «POI types» mounts exemplars of the
 * two baptized families on the real terrain — the ring is driven by the live
 * game clock (90 ticks ≈ 90 s at ×1, faster at ×2/×4, frozen on pause), so the
 * job fills CW, the quests drain CCW and the red shift lands under the 25%
 * provisional threshold. Dev seam: mounted by default on dev builds so the
 * Zanara language is reviewable live; `?poiDemo=0` hides it, `?poiDemo=1`
 * re-enables. Production never mounts it (DEV_Q is empty outside dev).
 * Positions picked per biome: open sea is the worst case for the quest blue. */
const POI_DEMO_CYCLE_TICKS = 90;
/* R-367 (Director 2026-11-24): demo markers wear the emblem cut-outs too —
 *  the same strabordante dioramas the real POIs carry (`iconOverflow`). */
const POI_DEMO_MARKERS = [
  { id: 'demo-job', type: 'job' as const, x: 0.585, y: 0.52, sizePx: 55, offset: 0.15, iconUrl: '/assets/ui/poi/emblems/emblem-forage-128.webp', iconOverflowFactor: 2.3 },
  { id: 'demo-job-64', type: 'job' as const, x: 0.66, y: 0.62, sizePx: 55, offset: 0.65, iconUrl: '/assets/ui/poi/emblems/emblem-logs-128.webp', iconOverflowFactor: 2.2 },
  { id: 'demo-quest-sea', type: 'quest' as const, x: 0.24, y: 0.5, sizePx: 55, offset: 0.55, iconUrl: '/assets/ui/poi/emblems/emblem-goblin-camp-128.webp' },
  { id: 'demo-quest-lagoon', type: 'quest' as const, x: 0.4, y: 0.68, sizePx: 55, offset: 0.85, iconUrl: '/assets/ui/poi/emblems/emblem-ruins-128.webp' },
  { id: 'demo-quest-forest', type: 'quest' as const, x: 0.47, y: 0.36, sizePx: 55, offset: 0.25, iconUrl: '/assets/ui/poi/emblems/emblem-recon-128.webp' },
] as const;
const POI_DEMO_ON = import.meta.env.DEV && DEV_Q.get('poiDemo') !== '0';

/** Every PixiWorldMap option that depends on the device profile (read once per map boot). */
function mapOptionsFor(profile: TierProfile) {
  const gpuLight = LIGHT_Q === null ? profile.gpuLight : (() => {
    const on = new Set(LIGHT_Q.split(','));
    return { halfDistanceMasks: on.has('dist'), halfSeaTile: on.has('tile'), foamBaseFromDisplayed: on.has('base'), halfFoamMasks: on.has('foam'), halfSeaField: on.has('field') };
  })();
  const tiles = LOOK_V1 || LAND || DEV_Q.get('tiles') === '0' ? undefined : { ...MAPPA2_V2_TILES, budget: { ...MAPPA2_V2_TILES.budget, ...profile.tiles } };
  const hiLand = LOOK_V1 ? undefined
    : LAND === null ? { ...MAPPA2_V2_LAND, canopySuffix: profile.canopySuffix }
    : LAND === 'hi' ? { baseFile: 'base_flat.nocanopy.hi.webp', canopySuffix: '.hi' }
    : LAND === 'hiclean' ? { baseFile: 'base_flat.nocanopy.hiclean.webp', canopySuffix: '.hiclean' }
    : LAND === 'hiraw' ? { baseFile: 'base_flat.nocanopy.hiraw.webp', canopySuffix: '.hiraw' }
    : LAND === 'hisea' ? { baseFile: 'base_flat.nocanopy.hi.seahi.webp', canopySuffix: '.hi', revealSeaFile: 'Mare.hisea.webp' }
    : LAND === 'hirawsea' ? { baseFile: 'base_flat.nocanopy.hiraw.seahi.webp', canopySuffix: '.hiraw', revealSeaFile: 'Mare.hisea.webp' }
    : undefined;
  const grade = NO_CLARITY
    ? { ...MAPPA2_GAME_GRADE, multUrl: MAPPA2_GAME_GRADE.multUrl.replace('game-grade-', 'game-grade-noclarity-'), addUrl: MAPPA2_GAME_GRADE.addUrl.replace('game-grade-', 'game-grade-noclarity-') }
    : profile.grade;
  const effects = { ...MAPPA2_APPROVED_MAP_PROPS.effects, seabed: MAPPA2_APPROVED_MAP_PROPS.effects.seabed && profile.seabed, ...(HI_RES ? { hiRes: true } : {}) };
  return { gpuLight, tiles, hiLand, grade, effects };
}

const barStyle = (b: BarPlacement, hidden = false): React.CSSProperties => ({
  position: 'absolute', left: b.left, top: b.top, transform: `scale(${b.scale})`, transformOrigin: 'top left',
  zIndex: 5, pointerEvents: hidden ? 'none' : 'auto', ['--hud-text-k' as string]: String(b.textK),
});

export default function GameMappa2Page() {
  const { t } = useTranslation('idleVillage');
  const gameplay = useMinimalGameplayWithIdleVillageConfig();
  const { state, config } = gameplay;
  /* Goblin invasion theatre (R-325, ported from /gameOld): the Director's shroud
   * covers the map, the announcement card opens at the peak, confirming opens
   * the curtains and puts the threat in the ledger + a march marker on the map.
   * `timeFrozen` lives here because the time loop's `inputLocked` reads it. */
  const [invasion, setInvasion] = useState<{ dueDay: number; startDay: number } | null>(null);
  /* `invasionLoadedRef` gates the save below until the persisted record was read —
   * otherwise the mount render would overwrite it with null before hydrate settles. */
  const invasionLoadedRef = useRef(false);
  const [goblinLanded, setGoblinLanded] = useState(true);
  const [shroudCovered, setShroudCovered] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  /* Event theatre holds the clock (Director, 2026-10-12): the snapshot taken at
   * trigger is restored when the theatre ends; while frozen, the player's own
   * pause/speed inputs are muted (`inputLocked`/`locked`). */
  const [timeFrozen, setTimeFrozen] = useState(false);
  const timeFreezeSnapshot = useRef<{ wasPaused: boolean } | null>(null);
  /* The ledger row exists from the confirmation but stays hidden until the card folds into it. */
  const [rowArriving, setRowArriving] = useState(false);
  useTimeEngineLoop(gameplay, { inputLocked: timeFrozen });
  /* Time of day on the map — curve, preview and max speed from `gameFrameConfig.timeOfDay.map`; while paused the map keeps
   * the light it had; faster than `maxSpeed` it holds daylight (the dial still turns). */
  const { isDayPhase, cycleProgress, speedMultiplier, isPaused: clockPaused } = state;
  const liveAmbient: Ambient =
    TOD_PREVIEW === 'night' || TOD_PREVIEW === 'dusk' || TOD_PREVIEW === 'day'
      ? TOD.preview[TOD_PREVIEW]
      : !nightShownAt(TOD, speedMultiplier)
        ? DAYLIGHT
        : ambientForPhase(TOD, isDayPhase, cycleProgress ?? 0);
  /* While paused the map keeps the light it had: `held` captures the ambient
   * at the pause transition and releases it once the clock resumes (the
   * guarded render-time set — React's adjust-state-during-render pattern). */
  const [held, setHeld] = useState({ paused: false, ambient: liveAmbient });
  if (clockPaused !== held.paused) setHeld({ paused: clockPaused, ambient: liveAmbient });
  const ambient = clockPaused ? held.ambient : liveAmbient;
  /* Keys 1..n pick the configured speeds in order, as on the old page. Space is owned by useTimeEngineLoop.
   * Same guards as the old page: no modifiers, no repeats, no typing targets, and a key another handler already claimed is left alone. */
  const { setSpeedMultiplier, resumeGame } = gameplay;
  useEffect(() => {
    const speeds = offeredSpeeds(PAGE.speeds, gameplay.config.loop.maxSpeedMultiplier);
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))) return;
      if (timeFrozen || !/^[1-9]$/.test(event.key)) return;
      const speed = speeds[Number(event.key) - 1];
      if (!speed) return;
      setSpeedMultiplier(speed);
      if (useMinimalGameplayStore.getState().state.isPaused) resumeGame('user');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameplay.config.loop.maxSpeedMultiplier, setSpeedMultiplier, resumeGame, timeFrozen]);
  const settings = useSyncExternalStore(subscribeGameSettings, getGameSettings);
  const tier = tierForQuality(settings.mapQuality, DETECTED_TIER, TIER_Q);
  const map = useMemo(() => mapOptionsFor(TIER_PROFILES[tier]), [tier]);

  /* Hydrate the store once (same contract as the old page: the clock resumes where it was saved, no offline progress). */
  useEffect(() => {
    let cancelled = false;
    initializeMinimalGameplayStore()
      .then(() => {
        if (cancelled) return undefined;
        const g = useMinimalGameplayStore.getState();
        /* Director 2026-11-11: /game opens paused (`gamePage.startPaused`); the player starts the clock (Space, speeds, keys). */
        if (PAGE.startPaused && !g.state.isPaused) g.pauseGame('auto');
        else if (!PAGE.startPaused && g.state.isPaused) g.resumeGame('auto');
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
        console.error('[game] gameplay init failed:', err);
        invasionLoadedRef.current = true;
      });
    return () => { cancelled = true; };
  }, []);

  /* A confirmed invasion persists (same contract as /gameOld): reloads resume
   * `currentDay`/`currentTick` at save-time, so the marker keeps marching. */
  useEffect(() => {
    if (!invasionLoadedRef.current) return;
    void saveData(INVASION_KEY, invasion);
  }, [invasion]);

  /* The announcement card appears at the shroud's peak, `cardDelayMs` after the
   * curtains start closing (config `eventTheatre`). */
  useEffect(() => {
    if (!shroudCovered) return undefined;
    const timer = window.setTimeout(() => setCardOpen(true), DEFAULT_GAME_FRAME_CONFIG.eventTheatre.cardDelayMs);
    return () => window.clearTimeout(timer);
  }, [shroudCovered]);

  /* The freeze holds from the curtains closing until they've fully reopened;
   * the release waits `freezeReleaseMs` so the world never ticks under
   * half-drawn curtains. */
  useEffect(() => {
    if (shroudCovered) {
      setTimeFrozen(true);
      if (!timeFreezeSnapshot.current) {
        const g = useMinimalGameplayStore.getState();
        timeFreezeSnapshot.current = { wasPaused: g.state.isPaused };
        if (!g.state.isPaused) g.pauseGame('auto');
      }
      return undefined;
    }
    if (!timeFreezeSnapshot.current) return undefined;
    const release = globalThis.setTimeout(() => {
      const snap = timeFreezeSnapshot.current;
      timeFreezeSnapshot.current = null;
      setTimeFrozen(false);
      if (snap && !snap.wasPaused) useMinimalGameplayStore.getState().resumeGame('auto');
    }, DEFAULT_GAME_FRAME_CONFIG.eventTheatre.freezeReleaseMs);
    return () => globalThis.clearTimeout(release);
  }, [shroudCovered]);

  /* E2E seam (same as /gameOld): the march state the marker is drawn from, and
   * a trigger that stages the theatre without the Director panel. */
  useEffect(() => {
    const hooks = ((window as unknown as { __idleVillageTestHooks?: Record<string, unknown> }).__idleVillageTestHooks ??= {});
    hooks.startInvasion = () => setShroudCovered(true);
    /* Registers the threat directly in the ledger (no theatre) — E2E probes
     * that need an eligible event without the card/shroud timing. */
    hooks.confirmInvasion = () => setInvasion({ dueDay: currentDay + INVASION_WARNING_DAYS, startDay: currentDay });
    hooks.getInvasion = () =>
      invasion
        ? { startDay: invasion.startDay, dueDay: invasion.dueDay, currentDay: state.currentDay, progress: Math.min(1, Math.max(0, (state.currentDay - invasion.startDay) / INVASION_MARCH_DAYS)) }
        : null;
    /* Same seam for «POI types»: mounts the Zanara review exemplars under capture. */
    hooks.togglePoiDemo = () => setPoiDemo((on) => !on);
    return () => {
      delete hooks.startInvasion;
      delete hooks.confirmInvasion;
      delete hooks.getInvasion;
      delete hooks.togglePoiDemo;
    };
  }, [invasion, state.currentDay]);

  const [win, setWin] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setWin({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const hud = useMemo(() => placeGameHud(win.w, win.h, zoomFor('auto', win.w, win.h)), [win]);

  const [view, setView] = useState<'map' | 'village'>('map');
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [boot, setBoot] = useState<PixiBootProgress>({ phase: 'assets', loaded: 0, total: 0 });
  /* PLAN-126 T-A2: phase-transition marks consumed by scripts/boot-phase-timing.mjs.
   * Emitted at the page seam (not inside PixiWorldMap — sealed contract surface);
   * the `uploaded` boundary lives in .mw/runs/plan126-boot-bytes/pixiwm-phase-marks.patch. */
  const bootPhaseMarkedRef = useRef(new Set<string>());
  const onBootProgress = useCallback((p: PixiBootProgress) => {
    if (!bootPhaseMarkedRef.current.has(p.phase)) {
      bootPhaseMarkedRef.current.add(p.phase);
      try {
        performance.mark(`game-boot:${p.phase}`);
      } catch {
        /* marks are best-effort */
      }
    }
    setBoot(p);
  }, []);
  const [ready, setReady] = useState(false);
  const [veilGone, setVeilGone] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const onRecenter = useCallback(() => setRecenterSignal((n) => n + 1), []);

  /* Perf/telemetry seams (PLAN-031 T-B1 + T-A6, ported flat): the e2e perf
   *  probe, one boot-timing event, and the skill-check astrolabe pre-warm in
   *  the post-map boot slack — same guards as /gameOld. */
  const bootStartedAtRef = useRef(performance.now());
  useEffect(() => {
    if (!(import.meta.env.DEV || import.meta.env.MODE === 'playwright')) return;
    installGamePerfProbe();
  }, []);
  const bootReportedRef = useRef(false);
  useEffect(() => {
    if (!veilGone || bootReportedRef.current) return;
    bootReportedRef.current = true;
    const interactiveMs = Math.round(performance.now() - bootStartedAtRef.current);
    (window as unknown as { __gameBoot?: Record<string, number> }).__gameBoot = { interactiveMs };
    trackTelemetryEvent('game_boot_complete', { interactiveMs });
  }, [veilGone]);
  useEffect(() => {
    if (!ready || !isSkillCheckWarmEnabled()) return undefined;
    const cfg = DEFAULT_GAME_FRAME_CONFIG.questWindow.skillCheck;
    const slackMs = GAME_PERF_BUDGETS.budgets.firstInteractiveMaxMs - (performance.now() - bootStartedAtRef.current);
    if (slackMs < cfg.warmSlackMinMs) return undefined;
    const ctl = new AbortController();
    void prewarmQuestSkillCheck({ signal: ctl.signal });
    return () => ctl.abort();
  }, [ready]);

  const resources = buildResourceReadoutItems(selectResourceOutlook(state, config), t);

  /* Bottom-right corner (Director 2026-11-11: «Devi portare i menù»): the REAL game menu of /gameOld (save, load,
   * memorial, title, language, settings — useGameMenuFlow) and the hide-HUD toggle, dressed as Zanara round buttons.
   * Panels /game does not have yet stay out of the menu (`gamePage.menuPanels`). Autosave as on the old page. */
  const flushGameplay = useCallback(() => gameplay.saveNow(), [gameplay]);
  const menuFlow = useGameMenuFlow({ currentTick: state.currentTick, currentDay: state.currentDay, flush: flushGameplay });
  useGameAutosave({ intervalMs: config.loop.autosaveIntervalMs, getTick: () => state.currentTick, flush: flushGameplay, enabled: import.meta.env.MODE !== 'test' });
  /* R-325 stage zones (ported from /gameOld): the stage solver owns the
   *  managed panels' occupancy — `visible` mirrors `stage.isOpen`, toggles are
   *  intercepted before `panels.visible` flips (same panelsForScreen contract). */
  const { stageZones } = DEFAULT_GAME_FRAME_CONFIG;
  const stage = useGameStageZonesState();
  const heroSheetApiRef = useRef<HeroSheetApi>(null);
  const basePanels = useHudPanels({
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
  const panels = useMemo<HudPanelsApi>(() => {
    const visible = { ...basePanels.visible };
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
        basePanels.set(id, value);
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
        basePanels.toggle(id);
      },
    };
  }, [basePanels, stage, stageZones]);

  /* ==================== R-325: quest system (ported from /gameOld) ==========
   * Same hooks, same order — the only adaptation is mounting: panels are flat
   * (no stage zone solver on this page), so stage calls become `panels.set`
   * and every stage rect becomes a fixed viewport anchor. POI positions are
   * re-based on the Mappa2 canvas via `mappa2Poi`. */
  const { questPois, questWindow, questReveal } = DEFAULT_GAME_FRAME_CONFIG;
  const poi = questPois[0];
  const [questShown, setQuestShown] = useState(false);
  const [autoRevealedIds, setAutoRevealedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [revealCycle, setRevealCycle] = useState(0);
  /* `poiDemo`/`questRevealed` live with the pre-existing «POI types» state below. */
  const [expeditionLostRun, setExpeditionLostRun] = useState<QuestRunState | null>(null);
  const currentTick = state.currentTick ?? 0;
  const dayLengthTicks = config.globalRules?.dayLengthInTimeUnits ?? 60;

  /* Stage mount: the planner detail and the activity-quest detail share the
   *  solver's `questDetail` rect (the panel self-positions from `position`). */
  const questDetailPosition = stage.layout.panels.questDetail.rect
    ? { x: stage.layout.panels.questDetail.rect.x, y: stage.layout.panels.questDetail.rect.y }
    : undefined;
  /* Stage-owned shell: the detail mounts inside the managed frame (suspension
   *  is presentation, not unmount) — the planner keeps its own fixed shell. */
  const wrapQuestDetail = useCallback(
    (node: ReactNode) => (
      <StagePanelFrame panelId="questDetail" positioned={false} className="hud-panel">
        {/* R-333: the signed cassetto IS the planner detail on /game — fed the
         *  production detail's own props read off the wrapped node (slots,
         *  estimate, items, canSend/send/clear are the real session's).
         *  R-339/PLAN-119 T2: the Detail mounts `ExpeditionDrawer`, so the
         *  docked column also carries its fold contract (collapse chip ⇄
         *  right-edge chip, state preserved). */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
          {isValidElement(node) ? (
            <HudRealCassettoDetail
              {...(node.props as QuestExpeditionDetailProps)}
              /* R-339/PLAN-119 AC4: tap an empty party seat → open the roster
               *  panel so the player picks a member (Claude note: tap member →
               *  fills the slot, existing assign flow). */
              onOpenRoster={() => panels.set('roster', true)}
              resourceItems={resources}
            />
          ) : (
            node
          )}
        </div>
      </StagePanelFrame>
    ),
    [resources, panels],
  );
  const session = useQuestPoiSession({
    poiFlightTargetSelector: MAP_QUEST_POI_TARGET,
    initialActivityId: poi?.activityId,
    detail: { position: questDetailPosition, showTelemetry: false, hudSurface: true },
  });

  const questRun = useQuestRun('goblin');
  const questRunRovine = useQuestRun('rovine');
  const questRuns = useMemo(() => ({ goblin: questRun, rovine: questRunRovine }), [questRun, questRunRovine]);
  const [activeQuestId, setActiveQuestId] = useState<QuestId>('goblin');
  const activeQuestRun = questRuns[activeQuestId];
  useEffect(() => {
    questRun.syncClock(currentTick);
    questRunRovine.syncClock(currentTick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTick]);
  const activeRuns = useMemo(
    () => [questRun.run, questRunRovine.run].filter((r): r is NonNullable<typeof r> => Boolean(r)),
    [questRun.run, questRunRovine.run],
  );
  const openRunWindow = useCallback(
    (questId: QuestId) => {
      setActiveQuestId(questId);
      stage.api.open('quest');
    },
    [stage],
  );
  const poiGoblin = useMemo(() => mappa2Poi('poi-goblin'), []);
  const poiRovine = useMemo(() => mappa2Poi('poi-rovine'), []);
  const openQuestStash = useCallback(
    (_trigger: HTMLElement) => {
      panels.set('villageStash', true);
    },
    [panels],
  );
  const expeditionGoblin = useQuestExpeditionSession({
    poi: poiGoblin!,
    questRun,
    activeRuns,
    currentTick,
    onOpenRun: openRunWindow,
    onOpenStash: openQuestStash,
    journeyOrigin: MAPPA2_VILLAGE_ORIGIN,
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
    journeyOrigin: MAPPA2_VILLAGE_ORIGIN,
    detailPosition: questDetailPosition,
    wrapDetail: wrapQuestDetail,
  });
  const expeditions = [expeditionGoblin, expeditionRovine];
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
  /* Director ruling 2026-11-21: opening a POI mounts ONLY the cassetto — the
   * roster never follows the detail (R-184's `usePanelWhileOpen` auto-open is
   * retired on /game; it still stands on /gameOld). Roster and stash stay
   * always-separate surfaces (Director 2026-11-15): the roster opens on demand
   * — the party-seat › (`onOpenRoster`) or the nav/menu toggle — and the
   * player closes it at will. Re-coupling it to the detail also reintroduces
   * the lock: the hook's effect re-opened the roster on every `panels` api
   * rebuild, so it could not be closed while the detail was up. */
  /* Stage occupancy follows the real surfaces: a planner being open means the
   *  `questDetail` panel is on stage; no run means `quest` must be released. */
  useEffect(() => {
    stage.api.setOpen('questDetail', anyExpeditionDetailOpen);
  }, [anyExpeditionDetailOpen, stage.api]);
  useEffect(() => {
    if (!activeQuestRun.run && stage.isOpen('quest')) {
      stage.api.close('quest');
    }
  }, [activeQuestRun.run, stage]);
  /* Stash binding lifecycle (PLAN-073 D-1, flat port): the planner that opens
   *  the shelf claims it; `v`/menu with exactly one planner open auto-binds. */
  const openPlannerKey = expeditions
    .filter((exp) => exp.isDetailOpen && (!exp.run || exp.run.ended))
    .map((exp) => exp.poi.id)
    .join(',');
  const activeStashOwner = useVillageStashStore((s) => s.activeStashOwner);
  const stashPanelOpen = panels.visible.villageStash;
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
  const expeditionsRef = useRef(expeditions);
  expeditionsRef.current = expeditions;
  const closeAnyExpeditionDetail = useCallback(() => {
    expeditionsRef.current.forEach((exp) => {
      if (exp.isDetailOpen) exp.closeDetail();
    });
  }, []);
  /* Consumed quest POIs (persisted): loaded before the markers compose so a
   *  consumed POI never flashes in for a frame on boot. */
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
  /* Auto-reveal (R-200): offers mount one at a time once the veil is gone. */
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
  /* Per-POI offer availability, quantised to the seal's grid and held
   *  referentially stable (PLAN-034 T-005). */
  const offerAvailability = useCallback(
    (p: QuestPoi) =>
      p.availableUntilDay === undefined
        ? { progress: 1, state: 'available' as const }
        : questAvailability(currentTick, (p.availableFromDay ?? 0) * dayLengthTicks, dayLengthTicks, p.availableUntilDay - (p.availableFromDay ?? 0)),
    [currentTick, dayLengthTicks],
  );
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
  /* R-199 pt.14: the run's report lives OUTSIDE the window — reward popup +
   *  dismissal semantics identical to /gameOld (panels instead of stage). */
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
    (!panels.visible.quest || !questPresenting),
  );
  const dismissSettledRun = useCallback(() => {
    const run = activeQuestRun.run;
    if (!run?.ended || run.settlement?.status !== 'settled') return;
    const consumedPoi = QUEST_POIS.find((p) => p.questId === activeQuestId);
    if (consumedPoi && poiConsumesOnReportClose(consumedPoi) && consumedPoiIds && !consumedPoiIds.includes(consumedPoi.id)) {
      const next = [...consumedPoiIds, consumedPoi.id];
      setConsumedPoiIds(next);
      void saveData(CONSUMED_POIS_KEY, next);
    }
    activeQuestRun.clear();
  }, [activeQuestRun, activeQuestId, consumedPoiIds]);
  const prevQuestPanelVisible = useRef(panels.visible.quest);
  useEffect(() => {
    const wasVisible = prevQuestPanelVisible.current;
    prevQuestPanelVisible.current = panels.visible.quest;
    if (!wasVisible || panels.visible.quest) return;
    dismissSettledRun();
  }, [panels, dismissSettledRun]);
  const closeReward = useCallback(() => {
    setRewardDismissed(true);
    if (panels.visible.quest) panels.set('quest', false);
    void expeditionsRef.current.find((exp) => exp.run && exp.run === activeQuestRun.run)?.commitSettlement();
  }, [panels, activeQuestRun.run]);
  useEffect(() => {
    if (!rewardDismissed) return;
    dismissSettledRun();
  }, [rewardDismissed, activeQuestRun.run, dismissSettledRun]);
  /* R-196: the shell anchors centred — same layout solver as /gameOld. */
  const questAnchor = useMemo(() => {
    const vw = typeof window === 'undefined' ? 1440 : window.innerWidth;
    const layout = resolveQuestShellLayout(vw, questWindow);
    const sideSpan = layout.companionsFit ? layout.effectiveSideWidth + questWindow.sidePanelGapPx : 0;
    const centered = Math.round((vw - questWindow.widthPx) / 2);
    const minLeft = sideSpan + questWindow.edgeInsetPx;
    const left = Math.min(Math.max(minLeft, centered), Math.max(minLeft, vw - questWindow.widthPx - minLeft));
    return { left, top: questWindow.topPx };
  }, [questWindow]);
  const activePoi = useMemo(() => QUEST_POIS.find((p) => p.questId === activeQuestId), [activeQuestId]);
  const questRunTime = useMemo(() => {
    const run = activeQuestRun.run;
    if (!run) return EMPTY_QUEST_RUN_TIME;
    if (run && activePoi) {
      const halo = questHaloProgress(run, activePoi, currentTick);
      const { key, params } = questRunTimeLabel(halo, run, dayLengthTicks);
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
  const questRunTimeStable = useStableValue(questRunTime, questRunTimeEqual);
  const questRunTimeView = useThrottledValue(questRunTimeStable, QUEST_HALO_RENDER_MS);
  const journeyRouteRuns = useMemo(
    () =>
      [questRun.run, questRunRovine.run].filter(
        (r): r is NonNullable<typeof r> => Boolean(r && r.journey && !r.journey.returnedAt),
      ),
    [questRun.run, questRunRovine.run],
  );
  /* PLAN-043 WS-4: the quest cluster — one solver owns CompanionLeft /
   *  window / SkillCheckColumn. The page holds the two pieces of intent the
   *  solver needs: the requested left tab (`questPill`) and the live beat's
   *  `expanded` tag (reported up by the window). The right wing's request
   *  comes from the published check bridge (engine-first). */
  const [questPill, setQuestPill] = useState<'party' | 'bag' | 'log' | null>(null);
  const [questExpandedStage, setQuestExpandedStage] = useState(false);
  /* R-239: the window reports its strip state — while minimised the wings
   *  have no window to dock to, so the check falls back to the centered
   *  `QuestSkillCheckOverlay` (the bridge stays live — the window is still
   *  mounted, only collapsed). */
  const [questMinimised, setQuestMinimised] = useState(false);
  const checkBridge = useCheckBridge(activeQuestId);
  const liveCheckEvent = activeQuestRun.run && checkBridge ? checkEventOf(activeQuestRun.run, checkBridge.check) : null;
  const checkLive = !!liveCheckEvent && !isStaleCheckEvent(liveCheckEvent, activeQuestRun.run);
  const clusterEnvelope = stage.layout.clusterEnvelope;
  const clusterGeometry = useMemo(() => {
    if (!clusterEnvelope || !activeQuestRun.run || !panels.visible.quest) return null;
    return solveQuestClusterGeometry(
      stage.state.viewport,
      clusterEnvelope,
      { userCenterX: stage.state.userCenterX, userTopY: stage.state.userTopY },
      { leftOpen: questPill !== null && !questMinimised, rightOpen: checkLive && !questMinimised, expanded: questExpandedStage },
    );
  }, [clusterEnvelope, activeQuestRun.run, panels.visible.quest, stage.state.viewport, stage.state.userCenterX, stage.state.userTopY, questPill, checkLive, questExpandedStage, questMinimised]);
  /* The quest window's rect — the hero sheet keeps clear of the whole CLUSTER
   *  union (window + whichever wings the solver mounted). */
  const questWindowBounds = useMemo(() => {
    if (!stage.isOpen('quest') || !activeQuestRun.run) return null;
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
  }, [stage, activeQuestRun.run, questWindow, clusterGeometry]);
  /* The run window as a memoised element (same contract as /gameOld). */
  const questWindowNode = useMemo(
    () =>
      activeQuestRun.run && panels.visible.quest ? (
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
          onClose={() => panels.set('quest', false)}
          anchor={questAnchor}
          widthPx={questWindow.widthPx}
          theaterAspect={questWindow.theaterAspect}
          tooltipLines={questWindow.tooltipLines}
          companions={{ widthPx: questWindow.sidePanelWidthPx, gapPx: questWindow.sidePanelGapPx, minWidthPx: questWindow.minSidePanelWidthPx, edgeInsetPx: questWindow.edgeInsetPx }}
          zIndex={DEFAULT_GAME_FRAME_CONFIG.zLayers.panels}
        />
      ) : null,
    [activeQuestRun, activeQuestId, activePoi, panels, currentTick, questRunTimeView, questAnchor, questWindow],
  );
  /* Escape arbitration is stage-owned: `StagePanelEscape` mounts guarantee
   *  one keypress = one dismissal (planner detail first, then the run window).
   *  The menu's own Esc binding claimed the event earlier. */

  const [hudHidden, setHudHidden] = useState(false);
  const toggleHud = useCallback(() => setHudHidden((v) => !v), []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))) return;
      if (event.key.toLowerCase() !== HIDE.shortcut.toLowerCase()) return;
      toggleHud();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleHud]);
  const hideKey = HIDE.shortcut.toUpperCase();
  /* The hidden state fades the bars; `pointerEvents` is resolved per element —
   * it must NEVER be spread onto a full-frame container with an `undefined`
   * value: a plain `undefined` in the style object unmounts a previous
   * `pointerEvents:'none'`, and the invisible frame then eats every map
   * drag/wheel/click (R-325 regression). The frame stays 'none' forever; the
   * bars each get 'none' while hidden; the corner controls take `barsHidden`
   * on a wrapper that has no other pointerEvents rule. */
  const barsHidden: React.CSSProperties = { opacity: hudHidden ? 0 : 1, pointerEvents: hudHidden ? 'none' : undefined, transition: `opacity ${HIDE.slideMs}ms ease` };
  const barsFade: React.CSSProperties = { opacity: hudHidden ? 0 : 1, transition: `opacity ${HIDE.slideMs}ms ease` };

  /* Director tooling (R-325): the full /gameOld beat set — invasion theatre,
   *  quest reveal/run/lost, level-up, reliquary, settlement lost, revive. */
  const directorEnabled = DEFAULT_GAME_FRAME_CONFIG.debug.directorPanel;
  const [wonderRequest, setWonderRequest] = useState(0);
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [skinId, setSkinId] = useState<SkinPresetId>(resolveInitialSkinPresetId);
  const settlementLostGrade = useSettlementLostGrade();
  const settlementLostActive = useMinimalGameplayStore(
    (s) => s.gameOverState.isGameOver && s.gameOverState.reason === 'settlement_lost',
  );
  /* The old game's panels, mounted flat — this page has no stage zone solver, so each panel
   *  gets an explicit anchor. `menuPanels` in gameFrameConfig is INV-locked (import-closure
   *  helper), so the list the menu shows lives page-local until the config can be amended. */
  const [regionHover, setRegionHover] = useState<PixiRegionHover | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ x: number; y: number; n: number; zoom?: number } | null>(null);
  /* «POI types» family review — Zanara exemplars driven by the live clock. */
  const [poiDemo, setPoiDemo] = useState(POI_DEMO_ON);
  /* R-180: «POI types» reviews the marker family — the golden quest POI rides
   *  along as the REAL offer; «Show quest» stays the quest-only gate (R-200). */
  const questRevealed = questShown || poiDemo;
  const currentDay = state.currentDay;
  const invasionDaysLeft = invasion ? Math.max(0, invasion.dueDay - currentDay) : 0;
  const gameEvents = useMemo<HudEvent[]>(() => {
    const list: HudEvent[] = [];
    /* The threat lands in the ledger at the confirmation (`arriving` hides the
     * row until the card folds into it). */
    if (invasion) list.push({ id: 'invasion', typeId: 'threat', title: t('gameFrame.events.fixtures.invasion'), daysLeft: invasionDaysLeft, at: { x: INVASION_VILLAGE.x, y: INVASION_VILLAGE.y }, arriving: rowArriving });
    /* The quest offer rides the same reveal as the marker (R-200); an offer
     *  with no window has nothing to count down. */
    const goblinAvail = questPoiAvailability.get('poi-goblin');
    const goblinRevealed =
      !!poiGoblin &&
      isQuestPoiRevealed(poiGoblin.id, { revealAll: questRevealed, autoRevealedIds, hasLiveRun: !!expeditionGoblin.run });
    if (goblinRevealed && poiGoblin.availableUntilDay !== undefined && expeditionGoblin.poiView.questStatus === 'available' && goblinAvail && goblinAvail.state !== 'expired') {
      const daysLeft = Math.max(0, Math.ceil(goblinAvail.progress * (poiGoblin.availableUntilDay - (poiGoblin.availableFromDay ?? 0))));
      list.push({ id: 'quest-open', typeId: 'quest', title: expeditionGoblin.poiView.activity.label, daysLeft, at: { x: poiGoblin.x / MAPPA2_CANVAS.w, y: poiGoblin.y / MAPPA2_CANVAS.h } });
    }
    return list;
  }, [invasion, invasionDaysLeft, rowArriving, questRevealed, autoRevealedIds, expeditionGoblin.poiView, expeditionGoblin.run, questPoiAvailability, poiGoblin, t]);
  /* R-338: the narrator's plaque reads the same nearest-event model as the ledger —
   *  nothing within its window means the feed is silent and only the bust stands. */
  const voceMessage = useMemo(() => voceMessageFor(nextEventModel(gameEvents), t), [gameEvents, t]);
  const voceMessageId = voceMessage?.id;
  useEffect(() => {
    if (voceMessageId) trackTelemetryEvent('voce_message', { messageId: voceMessageId });
  }, [voceMessageId]);
  /* The goblin walks from where it lands to the village over INVASION_MARCH_DAYS
   * game days (PLAN-033 T-004); progress is clamped, so after the march it waits. */
  const anchors = useMemo<PixiMapAnchor[]>(() => {
    const list: PixiMapAnchor[] = [];
    if (invasion) {
      const progress = Math.min(1, Math.max(0, (currentDay - invasion.startDay) / INVASION_MARCH_DAYS));
      list.push({
        id: 'invasion-goblin',
        x: (INVASION_LAND.x + (INVASION_VILLAGE.x - INVASION_LAND.x) * progress) * MAPPA2_CANVAS.w,
        y: (INVASION_LAND.y + (INVASION_VILLAGE.y - INVASION_LAND.y) * progress) * MAPPA2_CANVAS.h,
        node: <img data-testid="invasion-goblin-marker" src={goblinStickerImage} alt="" style={{ width: INVASION_MARKER_PX, pointerEvents: 'none', opacity: goblinLanded ? 1 : 0, filter: 'drop-shadow(0 12px 22px rgba(0,0,0,0.55))' }} />,
      });
    }
    /* Real quest POIs (S2.4, flat port): the medallion is the planning entry
     *  and, once launched, the run's halo clock. Reveal gates: auto-stagger,
     *  Director force, family review or a live run (R-200); consumption and
     *  expiry exit through `anchorsWithGhosts` instead of popping off. */
    for (const exp of expeditions) {
      const p = exp.poi;
      const avail = questPoiAvailability.get(p.id);
      if (isPoiConsumed(p, consumedPoiIds)) continue;
      if (!isQuestPoiRevealed(p.id, { revealAll: questRevealed, autoRevealedIds, hasLiveRun: !!exp.run }) || (!exp.run && avail?.state === 'expired')) continue;
      list.push({
        id: p.id,
        x: p.x,
        y: p.y,
        node: <MapQuestPoi session={exp.poiView} sizePx={p.sizePx} availability={avail} marker="zanara" />,
        zoomScaleExp: POI_ZANARA_CONFIG.anchorZoomScaleExp,
        zoomLod: POI_ZANARA_CONFIG.farBelowZoomRatio,
      });
    }
    /* Real job POIs (PLAN-117 job family): each running village job
     *  (`activeActivities` entries whose activity is type 'job') mounts the
     *  green Zanara marker on the village — the ring fills CLOCKWISE with the
     *  elapsed share of the canonical ticks (T-07: the marker never owns a
     *  clock; `ticksRemaining` is the single source). Same activity run by
     *  several residents = one marker at the soonest completion. */
    const jobsByActivity = new Map<string, { minRemaining: number; duration: number }>();
    for (const active of state.activeActivities) {
      if (active.residentId == null || typeof active.ticksRemaining !== 'number') continue;
      const def = config.activities.find((a) => a.id === active.activityId);
      if (!def || def.type !== 'job' || def.durationTicks <= 0) continue;
      const prev = jobsByActivity.get(active.activityId);
      if (!prev || active.ticksRemaining < prev.minRemaining) {
        jobsByActivity.set(active.activityId, { minRemaining: active.ticksRemaining, duration: def.durationTicks });
      }
    }
    /* Job anchor = the authored village Place worldPoint (placesConfig) — the
     *  marker is a child of the Place, not a free coordinate. */
    const jobAnchor = placeById('place_village_start')?.worldPoint ?? MAPPA2_VILLAGE_ORIGIN;
    [...jobsByActivity.entries()].forEach(([activityId, job], i, all) => {
      const fraction = Math.min(1, Math.max(0, 1 - job.minRemaining / job.duration));
      list.push({
        id: `job-${activityId}`,
        x: jobAnchor.x + JOB_POI_VILLAGE_OFFSET.x + (i - (all.length - 1) / 2) * JOB_POI_CLUSTER_SPACING,
        y: jobAnchor.y + JOB_POI_VILLAGE_OFFSET.y,
        node: <MapDemoPoi type="job" sizePx={poi?.sizePx ?? 55} fraction={fraction} />,
        zoomScaleExp: POI_ZANARA_CONFIG.anchorZoomScaleExp,
        zoomLod: POI_ZANARA_CONFIG.farBelowZoomRatio,
      });
    });
    if (poiDemo) {
      /* The ring derives from the live tick (source-owned lifecycle, T-07):
       *  job = elapsed share CW; quest = remaining share CCW — a phase offset
       *  per marker puts each at a different point of its countdown, so one of
       *  them is almost always inside the provisional red threshold. */
      const phase = (((state.currentTick % POI_DEMO_CYCLE_TICKS) + POI_DEMO_CYCLE_TICKS) % POI_DEMO_CYCLE_TICKS) / POI_DEMO_CYCLE_TICKS;
      for (const demo of POI_DEMO_MARKERS) {
        const p = (phase + demo.offset) % 1;
        const fraction = demo.type === 'job' ? p : 1 - p;
        list.push({
          id: demo.id,
          x: demo.x * MAPPA2_CANVAS.w,
          y: demo.y * MAPPA2_CANVAS.h,
          node: <MapDemoPoi type={demo.type} sizePx={demo.sizePx} fraction={fraction} iconUrl={demo.iconUrl} iconOverflow iconOverflowFactor={'iconOverflowFactor' in demo ? demo.iconOverflowFactor : undefined} />,
          zoomScaleExp: POI_ZANARA_CONFIG.anchorZoomScaleExp,
          zoomLod: POI_ZANARA_CONFIG.farBelowZoomRatio,
        });
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invasion, currentDay, goblinLanded, poiDemo, state.currentTick, state.activeActivities, config.activities, questRevealed, autoRevealedIds, questPoiAvailability, consumedPoiIds, expeditionGoblin.poiView, expeditionGoblin.run, expeditionRovine.poiView, expeditionRovine.run]);
  /* Exit transformation (R-127): an anchor that leaves the set stays mounted
   *  one beat longer — its node re-rendered with `exiting` plays the same
   *  fade+shrink it entered with, so a POI never pops off the map. Ghosts are
   *  derived DURING render (adjust-state-on-prop-change pattern). */
  const [prevAnchors, setPrevAnchors] = useState<PixiMapAnchor[]>(anchors);
  const [anchorGhosts, setAnchorGhosts] = useState<ReadonlyMap<string, PixiMapAnchor>>(() => new Map());
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
  /* PLAN-073 warehouse ledger: hydrate once at page level, like /gameOld. */
  useEffect(() => {
    void useVillageStashStore.getState().hydrate();
  }, []);
  const PANEL_MENU: HudPanelId[] = ['roster', 'events', 'villageStash', 'merchant', 'director'];
  const panelsZ = DEFAULT_GAME_FRAME_CONFIG.zLayers.panels;
  const focusEvent = useCallback(
    (event: HudEvent) => {
      if (event.at) setFocusRequest({ x: event.at.x, y: event.at.y, n: Date.now() });
      panels.set('events', false);
    },
    [panels],
  );
  /* Village view wiring (flat port): building clicks open the stash/merchant
   *  panels and remember their trigger; closing returns focus to it (or the
   *  Panels-menu fallback) — the same contract as /gameOld. `panels` is
   *  unstable across renders, so callbacks read it through a ref. */
  const villageViewRef = useRef<VillageScreenViewHandle>(null);
  const buildingOpenerRef = useRef<HTMLElement | null>(null);
  const panelsApiRef = useRef(panels);
  panelsApiRef.current = panels;
  const openVillagePanel = useCallback((panelId: 'villageStash' | 'merchant', trigger: HTMLElement) => {
    buildingOpenerRef.current = trigger;
    const p = panelsApiRef.current;
    if (!p.visible[panelId]) p.set(panelId, true);
    else document.querySelector<HTMLElement>(`[data-hud-panel="${panelId}"]`)?.focus();
  }, []);
  const closeBuildingPanel = useCallback((panelId: HudPanelId) => {
    panelsApiRef.current.set(panelId, false);
    const opener = buildingOpenerRef.current;
    buildingOpenerRef.current = null;
    window.requestAnimationFrame(() => {
      const fallback = document.querySelector<HTMLElement>('[data-hud-panels-trigger]');
      (opener && opener.isConnected && !opener.hasAttribute('data-exiting') ? opener : fallback)?.focus();
    });
  }, []);
  const closeVillageStash = useCallback(() => {
    closeBuildingPanel('villageStash');
    /* PLAN-073: closing the shelf drops the planner binding — the next open
     *  re-derives it (planner click or D-1 auto-bind). */
    useVillageStashStore.getState().bindStash(null);
  }, [closeBuildingPanel]);
  const closeMerchant = useCallback(() => closeBuildingPanel('merchant'), [closeBuildingPanel]);
  /* Escape inside the village view exits to the map (the view's own escape
   *  hook gets first refusal — flat port of /gameOld's arbitration). */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (view !== 'village') return;
      /* An expanded run window owns the stage — Escape collapses IT via
       *  StagePanelEscape, never ejects from the village beneath it. */
      if (stage.resolution('quest').presentationEffective === 'expanded') return;
      event.preventDefault();
      if (villageViewRef.current?.escape()) return;
      setView('map');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, stage]);
  /* PLAN-032 SP-1 (port R-325 it.3): the hero sheet — hover/focus on a roster
   *  card opens the plaque beside it. The machine owns transitions and writes
   *  `panels.set('heroSheet', …)` one-way to reflect; `heroSheet` is unlisted
   *  (no key/menu entry), so nothing else drives it — no intercept bridge
   *  needed here (/gameOld's version exists for the stage). No quest window on
   *  this page yet → `questBounds` null; no drag yet → `dragActive` false. */
  const { residentsById } = useRosterKitData();
  /* Page chrome insets (top time bar, bottom nav) — the hero sheet avoids them,
   *  the event card centres on the free area they leave. */
  const heroSheetChrome = {
    top: DEFAULT_GAME_FRAME_CONFIG.insets.hangingTopPx,
    bottom: DEFAULT_GAME_FRAME_CONFIG.worldDressing.safeFit.enabled ? DEFAULT_GAME_FRAME_CONFIG.worldDressing.safeFit.insets.bottom : 0,
  };
  /* Whichever session owns the in-flight drag — painted on the roster card. */
  const draggingResidentId =
    session.draggingResidentId ?? expeditionGoblin.draggingResidentId ?? expeditionRovine.draggingResidentId;
  const heroSheet = useHeroSheet({
    config: DEFAULT_GAME_FRAME_CONFIG.heroSheet,
    residentsById,
    panels,
    dragActive: draggingResidentId != null,
    questBounds: questWindowBounds,
    zIndex: panelsZ,
    chromeInsets: heroSheetChrome,
  });
  /* The stage bridge (`panels.set('heroSheet')`, `interceptToggle`) reads the
   *  machine post-mount — assign in an effect, never during render. */
  useEffect(() => {
    heroSheetApiRef.current = heroSheet;
  });
  const deadResidentCount = useMemo(
    () => (state.residents ?? []).reduce((n, r) => n + (r.isDead ? 1 : 0), 0),
    [state.residents],
  );
  /* R-359: warm the full boot-hidden set — portraits (roster/medallion/hero
   *  sheet), brass cursors and quest scene art — so the first roster open and
   *  every drag preview paint from decoded cache, not a visible fetch. */
  useEffect(() => {
    void warmGameAssets();
  }, []);
  useEffect(() => {
    applySkinCssVariables(skinId);
    document.documentElement.setAttribute('data-skin-preset', skinId);
  }, [skinId]);
  /* F10 shows/hides the Regia panel (same chord as /gameOld; 'd' comes free
   *  from the registry binding inside `useHudPanels`). */
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
  const directorActions = useMemo<DirectorAction[]>(
    () => [
      {
        /* Director «Stato iniziale»: wipes the game's progress (clock, village,
         *  quests, drafts) and reloads — the page boots as a new game. */
        id: 'resetInitial',
        label: t('gameFrame.director.resetInitial'),
        onTrigger: () => {
          void clearGameProgress().finally(() => window.location.reload());
        },
      },
      {
        id: 'wonder',
        label: t('gameFrame.director.wonder'),
        onTrigger: () => setWonderRequest((n) => n + 1),
      },
      {
        /* R-325 slice 4 (ported from /gameOld): stages the whole theatre —
         * curtains close, the announcement card opens at the peak, confirming
         * reopens and arms the march + the ledger row. */
        id: 'invasion',
        label: t('gameFrame.director.invasion'),
        active: !!invasion,
        onTrigger: () => setShroudCovered(true),
      },
      {
        /* R-200: «Show quest» jumps the reveal queue — one-way, never hides. */
        id: 'quest',
        label: t('gameFrame.director.quest'),
        active: questShown || QUEST_POIS.every((p) => autoRevealedIds.has(p.id)),
        onTrigger: () => {
          setQuestShown(true);
          setAutoRevealedIds(new Set(QUEST_POIS.map((p) => p.id)));
        },
      },
      {
        /* Real launch path only: stages a one-click expedition through the
         *  canonical boundary; on an existing run it opens its window. */
        id: 'questRun',
        label: t('gameFrame.director.questRun'),
        active: !!questRun.run && !questRun.run.ended,
        onTrigger: () => {
          if (questRun.run) openRunWindow('goblin');
          else expeditionGoblin.demoLaunch();
        },
      },
      {
        /* PLAN-067 T-C2 (R-234, EXP = A): the defeat report on a COPY — the
         *  live run is never touched, nothing settles. */
        id: 'expeditionLost',
        label: t('gameFrame.director.expeditionLost'),
        onTrigger: () => {
          const current = activeQuestRun.run;
          if (current) setExpeditionLostRun(stageExpeditionLost(current));
        },
      },
      {
        /* PLAN-032 SP-5: level-up staging — the roster opens if closed, the
         *  command decides accept/reject on its own. */
        id: 'levelup',
        label: t('gameFrame.director.levelUp'),
        onTrigger: () =>
          runStagingOpeningRoster({
            run: () => runHeroLevelUpStaging({ residentsById, playCue: playLevelUpCue }),
            openRoster: () => panels.set('roster', true),
          }),
      },
      {
        /* PLAN-117: «POI types» — mounts the baptized Zanara families (job green /
         *  quest sapphire) on the real terrain, ring driven by the live clock. */
        id: 'poitypes',
        label: t('gameFrame.director.poiTypes'),
        active: poiDemo,
        onTrigger: () => setPoiDemo((on) => !on),
      },
      {
        /* PLAN-067 T-C4: the legacy reliquary, slots from the village buildings. */
        id: 'legacy',
        label: t('gameFrame.director.legacy'),
        active: legacyOpen,
        onTrigger: () => setLegacyOpen((v) => !v),
      },
      {
        /* PLAN-034 T-010: the settlement-lost takeover, staged on demand.
         *  DIRECTOR trigger only — the canonical loss path stays out of scope. */
        id: 'settlementLost',
        label: t('gameFrame.director.settlementLost'),
        active: settlementLostActive,
        onTrigger: () => useMinimalGameplayStore.getState().triggerSettlementLost(),
      },
      {
        /* R-264: Director-only revive — clears `isDead` on store residents. */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, legacyOpen, settlementLostActive, deadResidentCount, skinId, invasion, poiDemo, questShown, autoRevealedIds, questRun.run, activeQuestRun.run, expeditionGoblin, residentsById, panels],
  );

  /* R-335/R-336: the ROSTER panel must sit inside `skin-scope` (see the
   * `data-panel="roster"` mount below) so `skinScope.css` matches its native
   * <select>s (INV:drag-test-container-v2.INV-1) and the filter/sort pills
   * paint engraved icons, not value text. It must NOT go on this root: the
   * base rule `.skin-scope :where(button…)` (0,3,0) out-specifies the signed
   * HUD surfaces' own scoped CSS (0,1,1) and turns every transparent button
   * of HudRealTime/HudRealNav into a bronze plate (R-336, Director 2026-11-14:
   * barre "scazzate"). */
  return (
    <div data-testid="game-mappa2" data-tier={tier} data-hudreal-lift="" data-view={view} data-map-ready={ready || undefined} className="game-frame" style={{ position: 'fixed', inset: 0, background: '#04161c' }}>
      <style>{`[data-hudslot]{filter:drop-shadow(0 2px 5px rgba(1,14,18,.7)) drop-shadow(0 0 1px rgba(1,14,18,.9))}`}</style>
      {/* R-325: the shared drag context — roster cards fly into expedition
       *  planner slots / the activity session through the same ownership
       *  chain as /gameOld (expedition → expedition → session). */}
      <RosterKitShell>
      {/* Radix Tooltip context — the quest/expedition primitives assume it
       *  (same outermost wrapper as /gameOld). */}
      <TooltipProvider>
      <DndContext
        sensors={session.sensors}
        collisionDetection={SLOT_MAGNET}
        measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
        onDragStart={(event: DragStartEvent) => {
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
      {/* R-325 stage zones: the solver owns the managed panels' geometry
       *  (occupancy, drag between wings, strips, suspension) — same contract
       *  as /gameOld. */}
      <GameStageProvider value={stage}>
      <GameFrameDragCursor />

      <div
        data-testid="world-map-layer"
        aria-hidden={view !== 'map' || undefined}
        inert={view !== 'map' ? true : undefined}
        style={{
          position: 'absolute', inset: 0, opacity: view === 'map' ? 1 : 0, pointerEvents: view === 'map' ? 'auto' : 'none',
          transition: 'opacity 240ms ease-out', isolation: 'isolate',
          filter: settlementLostGrade > 0 ? `url(#${SETTLEMENT_LOST_WORLD_FILTER_ID})` : undefined,
        }}
      >
        {settlementLostGrade > 0 && (
          <OxidizedGradeFilter progress={settlementLostGrade} filterId={SETTLEMENT_LOST_WORLD_FILTER_ID} />
        )}
        <PixiWorldMap
          key={tier /* a new quality reboots the map with that profile (options are read once per boot) */}
          {...MAPPA2_APPROVED_MAP_PROPS}
          effects={map.effects}
          mountainShade={SPLIT_GRADE ? mountainShadeLive : undefined}
          mountainClarity={SPLIT_GRADE ? mountainClarityLive : undefined}
          seaGrade={SPLIT_GRADE ? seaGradeLive : map.grade}
          ambient={ambient}
          nightLight={TOD.plates}
          hiLand={map.hiLand}
          baseTiles={map.tiles}
          gpuLight={map.gpuLight}
          recenterSignal={recenterSignal}
          wonderRequest={wonderRequest}
          focusRequest={focusRequest}
          regions={{ assetBase: MAPPA2_REGIONS_BASE, onHover: setRegionHover }}
          anchors={anchorsWithGhosts}
          worldOverlay={
            journeyRouteRuns.length
              ? (canvas) =>
                  journeyRouteRuns.map((run) => (
                    <QuestJourneyRoute key={runIdOf(run)} run={run} canvas={canvas} />
                  ))
              : undefined
          }
          onBootProgress={onBootProgress}
          onReady={() => setReady(true)}
          onBootError={(err) => setBootError(err.message)}
        />
        {/* The event theatre's curtains cover the world (map layer only — the HUD
         *  chrome and panels stay above, same z-order as /gameOld). */}
        <WorldSurfaceEventShroud covered={shroudCovered} zIndex={6} />
      </div>

      {view === 'village' && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <VillageDirectorView
            ref={villageViewRef}
            onOpenStash={(trigger) => openVillagePanel('villageStash', trigger)}
            onOpenMerchant={(trigger) => openVillagePanel('merchant', trigger)}
          />
        </div>
      )}

      {!veilGone && (
        <GameBootScreen
          phase={boot.phase}
          indeterminate={boot.total === 0}
          fraction={boot.total > 0 ? boot.loaded / boot.total : 0}
          done={ready}
          error={bootError}
          onExited={() => setVeilGone(true)}
        />
      )}

      {/* pointerEvents is literally 'none' here — never a spread (see the barsHidden note above): this
       *  full-frame layer must let every drag/wheel/click reach the map underneath. */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: hud.frame.W, height: hud.frame.H, transform: `scale(${hud.frame.scale})`, transformOrigin: 'top left', pointerEvents: 'none', ...barsFade }} data-hud-mode={hud.mode} data-hud-hidden={hudHidden || undefined}>
        {/* each signed bar is scaled whole (PLAN-112 §28); --hud-text-k keeps its text at the designed px (hudPx) */}
        {/* R-339/PLAN-119 T6 (D3 + Director ruling D10): in blueprint mode the
         *  slim day banner + resource bar dock left/center and the Events bar docks
         *  in the top-right reserve — GameTopChrome owns placement and publishes
         *  `insets.top`. The signed full bars stay the phone/landscape chrome. */}
        {hud.mode === 'blueprint' ? (
          <GameTopChrome
            frame={hud.frame}
            items={resources}
            locked={timeFrozen}
            visible={!hudHidden}
            events={gameEvents}
            eventsOpen={panels.visible.events}
            onToggleEvents={() => panels.toggle('events')}
            onSelectEvent={focusEvent}
          />
        ) : (
          <>
            <div data-hudslot="time" style={barStyle(hud.time, hudHidden)}>
              <HudRealTimeConnected locked={timeFrozen} />
            </div>
            <div data-hudslot="resources" style={barStyle(hud.resources, hudHidden)}>
              <HudRealResources items={resources} />
            </div>
          </>
        )}
        <div data-hudslot="nav" style={{ ...barStyle(hud.nav, hudHidden), width: 513, height: 131.25 }}>
          <HudRealNav
            navItems={DEFAULT_GAME_FRAME_CONFIG.navItems}
            activeNavId={view}
            alsoActiveNavIds={[...(panels.visible.roster ? ['roster'] : []), ...(panels.visible.villageStash ? ['villageStash'] : [])]}
            /* R-331: il pulsante MAPPA glissa la camera sul villaggio allo zoom di default
             * (cover fit) — zoom/pan utente stanti non sopravvivono (INV-11). */
            onNavSelect={(id) => {
              /* Roster / Stash are panel toggles, not views (Director 2026-11-20): the nav opens or closes them. */
              if (id === 'roster' || id === 'villageStash') {
                panels.toggle(id);
                return;
              }
              setView(id === 'village' ? 'village' : 'map');
              if (id === 'map') {
                const vp = placeById('place_village_start')?.worldPoint ?? MAPPA2_VILLAGE_ORIGIN;
                const fit = Math.max(innerWidth / MAPPA2_CANVAS.w, innerHeight / MAPPA2_CANVAS.h);
                setFocusRequest((prev) => ({ x: vp.x / MAPPA2_CANVAS.w, y: vp.y / MAPPA2_CANVAS.h, n: (prev?.n ?? 0) + 1, zoom: fit }));
              }
            }}
            onRecenter={onRecenter}
            labelSpread={hud.navLabelSpread}
            showLabels={PAGE.navShowLabels}
          />
        </div>
        {hud.voce && (
          <div data-hudslot="voce" style={barStyle(hud.voce, hudHidden)}>
            <HudRealVoce
              title={voceMessage?.title}
              messageKey={voceMessage?.id}
              autoCloseMs={VOCE_CONFIG.autoCloseMs}
              onDismiss={() => voceMessageId && trackTelemetryEvent('voce_dismiss', { messageId: voceMessageId })}
              onReopen={() => voceMessageId && trackTelemetryEvent('voce_reopen', { messageId: voceMessageId })}
              labels={{
                expand: t('gameFrame.voce.labels.expand'),
                collapse: t('gameFrame.voce.labels.collapse'),
                dismiss: t('gameFrame.voce.labels.dismiss'),
                bust: t('gameFrame.voce.labels.bust'),
              }}
            >{voceMessage?.text}</HudRealVoce>
          </div>
        )}
      </div>

      {/* HUD critique run 2026-11-24 (Director picks C2+H2): the three discs sit on a shared enamel
       *  capsule — same family as the resources/nav plaques — and the whole cluster runs at 78%
       *  brightness, second-level chrome so the top chrome leads the hierarchy. Painted on this
       *  element: [data-hud-corner] is deliberately outside .skin-scope (R-336), skin rules never
       *  reach it here. */}
      <div data-hud-corner="" style={{ position: 'absolute', right: `calc(${CORNER.offsetPx}px + env(safe-area-inset-right, 0px))`, bottom: `calc(${CORNER.offsetPx}px + env(safe-area-inset-bottom, 0px))`, zIndex: 6, display: 'flex', alignItems: 'flex-end', gap: CORNER.gapPx, transform: hud.cornerScale !== 1 ? `scale(${hud.cornerScale})` : undefined, transformOrigin: 'bottom right', filter: 'brightness(.78)' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: '-9px -14px', zIndex: -1, borderRadius: 999, border: '1.5px solid #b8933f', background: 'linear-gradient(180deg, #12524b, #08302c 85%)', boxShadow: 'inset 0 0 0 2px rgba(6, 26, 24, 0.9), inset 0 0 12px rgba(0, 0, 0, 0.45), 0 0 0 2px rgba(20, 12, 4, 0.6), 0 6px 14px rgba(0, 0, 0, 0.5)' }} />
        <div style={barsHidden}>
          <HudGameMenu
            visible={panels.visible}
            onTogglePanel={panels.toggle}
            panelIds={PANEL_MENU}
            includeDev={directorEnabled}
            onSaveNow={() => saveNowToManualSlot({ flush: flushGameplay })}
            {...menuFlow.menuProps}
            renderTrigger={({ open, onToggle, label }) => (
              <HudRealRoundButton label={label} shortcut="Esc" active={open} onClick={onToggle} size={CORNER.buttonPx}
                buttonProps={{ 'aria-haspopup': 'menu', 'aria-expanded': open, 'data-testid': 'hud-menu-trigger' }}>
                <img src="/assets/ui/nav/ctl-menu-128.webp" alt="" aria-hidden width={CORNER.iconPx} height={CORNER.iconPx} style={{ display: 'block', objectFit: 'contain' }} />
              </HudRealRoundButton>
            )}
            renderPanel={({ children, panelProps }) => <HudRealMenuPanel panelProps={panelProps}>{children}</HudRealMenuPanel>}
          />
        </div>
        {directorEnabled && (
          <div style={barsHidden}>
            <HudRealRoundButton
              label={t('gameFrame.director.title')}
              shortcut="D"
              active={panels.visible.director}
              onClick={() => panels.toggle('director')}
              size={CORNER.buttonPx}
              buttonProps={{ 'data-testid': 'hud-director-trigger' }}
            >
              <img src="/assets/ui/nav/ctl-director-128.webp" alt="" aria-hidden width={CORNER.iconPx} height={CORNER.iconPx} style={{ display: 'block', objectFit: 'contain' }} />
            </HudRealRoundButton>
          </div>
        )}
        <HudRealRoundButton label={t(hudHidden ? 'gameFrame.hud.show' : 'gameFrame.hud.hide')} shortcut={hideKey} active={hudHidden} onClick={toggleHud} size={CORNER.buttonPx}
          buttonProps={{ 'data-testid': 'hud-hide-toggle' }}>
          <img src="/assets/ui/nav/ctl-eye-128.webp" alt="" aria-hidden width={CORNER.iconPx} height={CORNER.iconPx} style={{ display: 'block', objectFit: 'contain' }} />
        </HudRealRoundButton>
      </div>
      <MenuDialogDress.Provider value="zanara">{menuFlow.screens}</MenuDialogDress.Provider>

      {/* R-325: the old game's panels, stage-managed — the solver owns the
       *  zone rect; shortcuts come from the registry via useHudPanels
       *  (intercepted to `stage.api`), the menu lists the same ids. */}
      {/* The painted panel frame overhangs the panel rect (band above, spine and gems beside it): the stage frame's
       *  default `overflowY:auto` clipped it away entirely, so the thin frame was in the DOM but invisible
       *  (2026-11-20 probe). The roster list scrolls inside itself, so the wrapper can let the frame out. */}
      {panels.visible.roster && (
        <StagePanelFrame panelId="roster" style={{ overflow: 'visible', overflowY: 'visible' }}>
        <div data-panel="roster" className="skin-scope" ref={heroSheet.railRef} {...heroSheet.railProps}>
          <MatericRosterComponentV2
            componentId="game-mappa2-roster"
            density="compact"
            onClose={() => panels.set('roster', false)}
            useExternalDndContext
            onDragEnd={(event: DragEndEvent) => {
              /* Ownership by droppable id — `false` (rejected) is a verdict
               *  too: it must not fall through to another owner (R-241). */
              let verdict: RosterDropVerdict;
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
            onFlightComplete={(residentId: string, slotId: string) => {
              const owner = expeditions.find((exp) => exp.ownsSlotId(slotId));
              if (owner) owner.handleFlightComplete(residentId, slotId);
              else session.handleFlightComplete(residentId, slotId);
            }}
            onResidentSelect={(residentId: string) => {
              if (expeditionGoblin.handleResidentSelect(residentId)) return;
              if (expeditionRovine.handleResidentSelect(residentId)) return;
              session.handleResidentSelect(residentId);
            }}
            getResidentCompatibility={rosterCompatibility}
            lockedResidentIds={[
              ...new Set([
                ...session.lockedResidentIds,
                ...expeditionGoblin.lockedResidentIds,
                ...expeditionRovine.lockedResidentIds,
              ]),
            ]}
            lockedStatusLabel={session.t('roster.status.assigned')}
            activeResidentId={draggingResidentId ?? undefined}
          />
        </div>
        </StagePanelFrame>
      )}
      {panels.visible.events && hud.mode !== 'blueprint' && (
        <StagePanelFrame panelId="events" positioned={false}>
          {(res) => (
            /* R-334ter + PLAN-125 F4: the signed ledger replaces the stock
             *  panel — same real `gameEvents`/`focusEvent` feed, zone-fill
             *  width = right-wing column so the cassetto covers it whole
             *  (D-1). Escape stays stage-owned; the close control mirrors it. */
            <div style={{ position: 'absolute', left: res.rect?.x ?? 0, top: res.rect?.y ?? 0, width: res.rect?.w, zIndex: panelsZ }}>
              <HudRealLedgerPanel events={gameEvents} onSelect={focusEvent} onClose={() => panels.set('events', false)} height={res.rect?.h} />
            </div>
          )}
        </StagePanelFrame>
      )}
      {panels.visible.villageStash && (
        <StagePanelFrame panelId="villageStash" positioned={false}>
          {(res) => (
            <VillageStashPanel
              config={VILLAGE_STASH_CONFIG}
              left={res.rect?.x ?? 0}
              top={res.rect?.y ?? 0}
              widthPx={res.rect?.w ?? VILLAGE_STASH_CONFIG.panel.widthPx}
              maxHeightPx={res.rect?.h}
              zIndex={panelsZ}
              onClose={closeVillageStash}
            />
          )}
        </StagePanelFrame>
      )}
      {panels.visible.merchant && (
        <StagePanelFrame panelId="merchant" positioned={false}>
          {(res) => (
            /* R-334ter: the signed merchant replaces the stock panel — same
             *  `MERCHANT_CONFIG` feed at the stage rect (close stays
             *  stage-owned: Escape → closeMerchant). */
            <div style={{ position: 'absolute', left: res.rect?.x ?? 0, top: res.rect?.y ?? 0, zIndex: panelsZ }}>
              <HudRealMerchantPanel config={MERCHANT_CONFIG} />
            </div>
          )}
        </StagePanelFrame>
      )}
      {/* R-351 (Director ruling 2026-11-15): the expedition surface has NO
       *  resting state — with no quest selected the page mounts nothing at
       *  all. The signed cassetto appears the moment a marker opens a
       *  detail; in the ≤`bottomSheet.maxWidthPx` band the bottom sheet is
       *  the only expedition form (drawer-side guard inside
       *  `ExpeditionDrawer`). */}
      {view === 'map' && regionHover && (
        <RegionTooltip name={t(`gameFrame.regions.${regionHover.region.id}`)} x={regionHover.x} y={regionHover.y} />
      )}

      {/* The announcement lives in the viewport, centred on the free area the HUD
       *  chrome leaves (same contract as /gameOld — no safe-fit solver on this
       *  page, so the insets are the page chrome's own). */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 13 }}>
        <WorldSurfaceEventCard
          visible={cardOpen}
          zIndex={1}
          screenAnchor={{
            left: '50%',
            top: `calc(${heroSheetChrome.top}px + (100% - ${heroSheetChrome.top + heroSheetChrome.bottom}px) / 2)`,
          }}
          screenScale={INVASION_SCREEN_SCALE}
          worldCenter={{ x: MAPPA2_CANVAS.w / 2, y: MAPPA2_CANVAS.h / 2 }}
          canvasSize={{ width: MAPPA2_CANVAS.w, height: MAPPA2_CANVAS.h }}
          camera={{ panX: 0, panY: 0, zoom: 1 }}
          fallTarget={{ x: Math.round(MAPPA2_CANVAS.w * INVASION_LAND.x), y: Math.round(MAPPA2_CANVAS.h * INVASION_LAND.y) }}
          marchTarget={{ x: Math.round(MAPPA2_CANVAS.w * INVASION_VILLAGE.x), y: Math.round(MAPPA2_CANVAS.h * INVASION_VILLAGE.y) }}
          daysRemaining={INVASION_WARNING_DAYS}
          showReminder={false}
          warm={ready}
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
            setRowArriving(true);
            if (!panels.visible.events) panels.set('events', true);
          }}
          onClose={() => {
            setCardOpen(false);
            setRowArriving(false);
          }}
        />
      </div>

      {/* Quest surfaces (flat port of /gameOld): planner details, activity
       *  overlays, expedition overlays — self-positioned at questDetailPosition. */}
      {session.overlays}
      {expeditionGoblin.overlays}
      {expeditionRovine.overlays}
      {/* WS-2/WS-4: in `run` regime the QuestStageCluster owns the whole-stage
       *  geometry — window fills the solver's center slot, right wing hosts the
       *  SkillCheckColumn, left companion paints inside the window shell. */}
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
      <QuestOverlays questId={activeQuestId} onDismissOutcome={activeQuestRun.dismissOutcome} checkInColumn={!!clusterGeometry && !questMinimised} />
      {/* R-199 pt.14: the end-of-run report floats OUTSIDE the window's DOM —
       *  staged reveal, skippable, non-modal. */}
      {/* R-334ter: the signed expedition-lost takeover replaces the stock
       *  popup for the lost path (`lostReportModel` real data). */}
      {expeditionLostRun && (
        <HudRealExpeditionLost
          run={expeditionLostRun}
          questName={scenarioForQuest(activeQuestId)?.title ?? expeditionLostRun.questId}
          onClose={() => setExpeditionLostRun(null)}
        />
      )}
      {/* R-348: the signed pergamena report replaces the stock staged popup —
       *  same run/scenario/onClose contract, same staged reveal and commit
       *  boundary, baptized frame `/assets/ui/hud-real/victory/frame.webp`. */}
      {!expeditionLostRun && rewardVisible && activeQuestRun.run && (
        <HudRealVictoryReward
          run={activeQuestRun.run}
          scenario={scenarioForQuest(activeQuestId)}
          stageMs={questWindow.rewardPopup.stageMs}
          onClose={closeReward}
        />
      )}
      {heroSheet.panelNode}
      {/* T-C1 (R-234) + R-334ter: the signed level-up plates — same
       *  `subscribeHeroLevelUp` source and residentsById feed as the stock
       *  ceremony, Escape per plate included. */}
      <HudRealLevelUp residentsById={residentsById} />
      {/* R-334bis: the signed reliquary replaces the stock panel — same data
       *  source (`legacySlotsFor`/`villageBuildingLevel`), same onClose contract. */}
      {legacyOpen && (
        <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', zIndex: DEFAULT_GAME_FRAME_CONFIG.zLayers.reward }}>
          <div style={{ width: 'min(880px, 64vw)', aspectRatio: '1216 / 762' }}>
            <HudRealReliquary onClose={() => setLegacyOpen(false)} />
          </div>
        </div>
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
            setAutoRevealedIds(new Set());
            setRevealCycle((n) => n + 1);
          }}
        />
      )}
      <SettlementLostOverlay />
      {/* Stage arbitration: one Escape = one dismissal (managed panels only);
       *  strips paint minimised panels; the toast reports an open rejected
       *  under run regime. */}
      <StagePanelEscape panelId="roster" onEscape={() => panels.set('roster', false)} />
      <StagePanelEscape panelId="events" onEscape={() => panels.set('events', false)} />
      <StagePanelEscape panelId="villageStash" onEscape={closeVillageStash} />
      <StagePanelEscape panelId="merchant" onEscape={closeMerchant} />
      <StagePanelEscape panelId="questDetail" onEscape={closeAnyExpeditionDetail} />
      <StageStripsLayer />
      <StageRejectedToast />
      </GameStageProvider>
      </DndContext>
      </TooltipProvider>
      </RosterKitShell>
    </div>
  );
}
