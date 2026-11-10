import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { PixiWorldMap, type PixiBootProgress } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { MAPPA2_APPROVED_MAP_PROPS, MAPPA2_GAME_GRADE, MAPPA2_REGIONS_BASE, MAPPA2_V2_LAND, MAPPA2_V2_TILES } from '@/ui/idleVillage/config/mappa2ApprovedLook';
import { detectTier, readTierEnv, TIER_PROFILES, tierForQuality, type TierProfile } from '@/ui/idleVillage/config/mappa2Tiers';
import { getGameSettings, subscribeGameSettings } from '@/ui/idleVillage/state/gameSettings';
import { mountainClarityLive, mountainShadeLive, seaGradeLive } from './mappa2-grade';
import { HudRealTimeConnected } from '@/ui/idleVillage/hudReal/HudRealTimeConnected';
import { HudRealResources } from '@/ui/idleVillage/hudReal/HudRealResources';
import { HudRealNav } from '@/ui/idleVillage/hudReal/HudRealNav';
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

const barStyle = (b: BarPlacement): React.CSSProperties => ({
  position: 'absolute', left: b.left, top: b.top, transform: `scale(${b.scale})`, transformOrigin: 'top left',
  zIndex: 5, pointerEvents: 'auto', ['--hud-text-k' as string]: String(b.textK),
});

export default function GameMappa2Page() {
  const { t } = useTranslation('idleVillage');
  const gameplay = useMinimalGameplayWithIdleVillageConfig();
  const { state, config } = gameplay;
  useTimeEngineLoop(gameplay);
  const settings = useSyncExternalStore(subscribeGameSettings, getGameSettings);
  const tier = tierForQuality(settings.mapQuality, DETECTED_TIER, TIER_Q);
  const map = useMemo(() => mapOptionsFor(TIER_PROFILES[tier]), [tier]);

  /* Hydrate the store once (same contract as the old page: the clock resumes where it was saved, no offline progress). */
  useEffect(() => {
    let cancelled = false;
    initializeMinimalGameplayStore()
      .then(() => {
        if (cancelled) return;
        const g = useMinimalGameplayStore.getState();
        if (g.state.isPaused) g.resumeGame('auto');
      })
      .catch((err) => console.error('[game] gameplay init failed:', err));
    return () => { cancelled = true; };
  }, []);

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
  const [ready, setReady] = useState(false);
  const [veilGone, setVeilGone] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const onRecenter = useCallback(() => setRecenterSignal((n) => n + 1), []);

  const resources = buildResourceReadoutItems(selectResourceOutlook(state, config), t);

  return (
    <div data-testid="game-mappa2" data-tier={tier} data-hudreal-lift="" data-view={view} data-map-ready={ready || undefined} style={{ position: 'fixed', inset: 0, background: '#04161c' }}>
      <style>{`[data-hudslot]{filter:drop-shadow(0 2px 5px rgba(1,14,18,.7)) drop-shadow(0 0 1px rgba(1,14,18,.9))}`}</style>

      <div
        data-testid="world-map-layer"
        aria-hidden={view !== 'map' || undefined}
        inert={view !== 'map' ? true : undefined}
        style={{ position: 'absolute', inset: 0, opacity: view === 'map' ? 1 : 0, pointerEvents: view === 'map' ? 'auto' : 'none', transition: 'opacity 240ms ease-out' }}
      >
        <PixiWorldMap
          key={tier /* a new quality reboots the map with that profile (options are read once per boot) */}
          {...MAPPA2_APPROVED_MAP_PROPS}
          effects={map.effects}
          mountainShade={SPLIT_GRADE ? mountainShadeLive : undefined}
          mountainClarity={SPLIT_GRADE ? mountainClarityLive : undefined}
          seaGrade={SPLIT_GRADE ? seaGradeLive : map.grade}
          hiLand={map.hiLand}
          baseTiles={map.tiles}
          gpuLight={map.gpuLight}
          recenterSignal={recenterSignal}
          regions={{ assetBase: MAPPA2_REGIONS_BASE }}
          onBootProgress={setBoot}
          onReady={() => setReady(true)}
          onBootError={(err) => setBootError(err.message)}
        />
      </div>

      {view === 'village' && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <VillageDirectorView />
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

      <div style={{ position: 'absolute', left: 0, top: 0, width: hud.frame.W, height: hud.frame.H, transform: `scale(${hud.frame.scale})`, transformOrigin: 'top left', pointerEvents: 'none' }} data-hud-mode={hud.mode}>
        {/* each signed bar is scaled whole (PLAN-112 §28); --hud-text-k keeps its text at the designed px (hudPx) */}
        <div data-hudslot="time" style={barStyle(hud.time)}>
          <HudRealTimeConnected />
        </div>
        <div data-hudslot="resources" style={barStyle(hud.resources)}>
          <HudRealResources items={resources} />
        </div>
        <div data-hudslot="nav" style={{ ...barStyle(hud.nav), width: 513, height: 131.25 }}>
          <HudRealNav
            navItems={DEFAULT_GAME_FRAME_CONFIG.navItems}
            activeNavId={view}
            onNavSelect={(id) => setView(id === 'village' ? 'village' : 'map')}
            onRecenter={onRecenter}
            labelSpread={hud.navLabelSpread}
          />
        </div>
      </div>
    </div>
  );
}
