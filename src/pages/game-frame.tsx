import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
// GameFrame is a fresh, not-yet-kitted composition (R-075) — the
// `no-restricted-imports` nudge toward `frozen/kits/*` does not apply to it.
// eslint-disable-next-line no-restricted-imports
import {
  buildResourceReadoutItems,
  GameFrame,
  HudEventLedger,
  StagePanelFrame,
  type HudEvent,
  type HudObjective,
  ObjectiveCartouche,
  HudGameMenu,
  HudPanelsMenu,
  useHudPanels,
  type HudPanelsApi,
  ResourceReadout,
  type ResourceReadoutDelta,
  WhenWhereCluster,
} from '@/ui/idleVillage/components/gameFrame';
import {
  WorldSurfaceStandalone,
  type WorldSurfaceVisualStateOverride,
} from '@/ui/idleVillage/frozen/kits/worldSurfaceKit';
import { atmosphereAssets } from '@/ui/idleVillage/config/atmosphereAssets';
import { MatericRosterComponentV2 } from '@/ui/idleVillage/rosterV2';
import { resolveWorldManifestPath } from '@/ui/idleVillage/components/gameFrame/resolveWorldManifest';
import { selectResourceOutlook, useMinimalGameplayStore, useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { HudRecenterButton } from '@/ui/idleVillage/components/gameFrame/HudRecenterButton';
import type { HudScaleControl } from '@/ui/idleVillage/components/gameFrame/hudScale';
import { useHudScale } from '@/ui/idleVillage/components/gameFrame/useHudScale';
import { useTimeEngineLoop } from '@/ui/idleVillage/hooks/useTimeEngineLoop';
import { saveNowToManualSlot } from '@/ui/idleVillage/state/gameSaveService';
import { useGameAutosave } from '@/ui/idleVillage/state/useGameAutosave';
import { useGameMenuFlow } from '@/ui/idleVillage/components/gameFrame/menu/useGameMenuFlow';

/**
 * The whole /game-frame screen — HUD ribbons, event ledger, roster, instruments —
 * around a map supplied by the caller, so the DOM map and the Pixi map share one HUD.
 * Every value on screen is real state from `useMinimalGameplayWithIdleVillageConfig`
 * except the events, which are fixtures until an event system exists (R-071).
 * The screen drives the game clock itself (`useTimeEngineLoop`): the astrolabe's
 * pause and speed act on it, and so does everything that reads the store.
 */
export interface GameFrameScreenProps {
  renderMap: (opts: { recenterSignal: number; focusRequest: { x: number; y: number; n: number } | null }) => ReactNode;
  /** Replaces the default stand-alone roster, e.g. with one wired to quest slots. */
  rosterSlot?: ReactNode | ((api: { onClose: () => void }) => ReactNode);
  /** Screen-level floating UI (quest detail, quest card, skill check, drag flight). */
  overlaySlot?: ReactNode;
  /** Extra events on top of the fixture feed (e.g. a scripted invasion). */
  extraEvents?: HudEvent[];
  /** Show the placeholder fixture events (R-071). Off on /game, where only real events may reach the ledger. */
  fixtureEvents?: boolean;
  /** What the player should do now; the top-left cartouche is hidden without it. */
  objective?: HudObjective;
  /** Panels state owned by the page, so page-level panels (Director, Tuning) share the menu. Defaults to its own. */
  panels?: HudPanelsApi;
  /** Offer the dev-only panels in the Panels menu. */
  devPanels?: boolean;
  /** Interface size (desktop app only). */
  scaleControl?: HudScaleControl;
  /** Bump to call the HUD chrome back on the game's behalf (event wake). */
  hudWakeSignal?: number;
  /** While an event theatre holds the clock, pause/speed inputs stay inert. */
  timeInputLocked?: boolean;
  /** Reports HUD chrome visibility changes to the page (ambient effects, ambience cues). */
  onHudHiddenChange?: (hidden: boolean, cause: 'manual' | 'idle') => void;
  /** Controlled nav selection (e.g. the page owns the map/village view switch, PLAN-035). Omit for internal state. */
  activeNavId?: string;
  /** Nav-select callback in controlled mode; receives the clicked item id. */
  onNavSelect?: (id: string) => void;
  /**
   * PLAN-043 WS-2: the three-zone stage owns the roster/ledger anchors — pass
   * the flag so GameFrame mounts those slots unanchored and the page's
   * `StagePanelFrame`s position them (requires a `GameStageContext` provider
   * above; the page wraps panel content in frames itself).
   */
  stageMode?: boolean;
}

export function GameFrameScreen({ renderMap, rosterSlot, overlaySlot, extraEvents, fixtureEvents: withFixtures = true, objective, panels: panelsProp, devPanels = false, scaleControl, hudWakeSignal, timeInputLocked = false, onHudHiddenChange, activeNavId: activeNavIdProp, onNavSelect: onNavSelectProp, stageMode = false }: GameFrameScreenProps) {
  const { t } = useTranslation('idleVillage');
  const gameplay = useMinimalGameplayWithIdleVillageConfig();
  const { state, config } = gameplay;
  useTimeEngineLoop(gameplay, { inputLocked: timeInputLocked });
  /* PLAN-043 WS-5 D9: V2 (Lacquer Atlas) is the only roster — the V1
   *  Materic fallback was retired (Director ruling). */
  const Roster = MatericRosterComponentV2;

  /* Controlled or internal nav (PLAN-035): the page may own the selection so
   * a click on the painted village region can switch the view too. */
  const [internalNavId, setInternalNavId] = useState('map');
  const activeNavId = activeNavIdProp ?? internalNavId;
  const handleNavSelect = (id: string) => {
    if (activeNavIdProp === undefined) setInternalNavId(id);
    onNavSelectProp?.(id);
  };
  // Fixture: no event system exists yet (R-071). Replace with the real feed when it lands.
  const fixtureEvents = useMemo(
    () => [
      { id: 'wolves', typeId: 'threat', title: t('gameFrame.events.fixtures.wolves'), daysLeft: 2, at: { x: 0.24, y: 0.42 } },
      { id: 'expedition', typeId: 'expedition', title: t('gameFrame.events.fixtures.expedition'), daysLeft: 3, at: { x: 0.5, y: 0.12 } },
      { id: 'granary', typeId: 'construction', title: t('gameFrame.events.fixtures.granary'), daysLeft: 1, at: { x: 0.47, y: 0.55 } },
      { id: 'harvest', typeId: 'harvest', title: t('gameFrame.events.fixtures.harvest'), daysLeft: 4, at: { x: 0.4, y: 0.62 } },
      { id: 'caravan', typeId: 'visit', title: t('gameFrame.events.fixtures.caravan'), daysLeft: 7, at: { x: 0.8, y: 0.5 } },
    ],
    [t],
  );
  const events = useMemo(() => [...(extraEvents ?? []), ...(withFixtures ? fixtureEvents : [])], [extraEvents, fixtureEvents, withFixtures]);
  const ownPanels = useHudPanels({ enabled: !panelsProp });
  const panels = panelsProp ?? ownPanels;
  const captureMode = useMemo(() => new URLSearchParams(window.location.search).get('capture') === '1', []);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [focusRequest, setFocusRequest] = useState<{ x: number; y: number; n: number } | null>(null);
  const focusEvent = (event: HudEvent) => {
    if (event.at) setFocusRequest((prev) => ({ ...event.at!, n: (prev?.n ?? 0) + 1 }));
  };
  /* R-260: the settlement-commit stamp — the readout animates the granted
   *  «+N» (gold chip on its tile, XP tray under the readout), then the
   *  stamp clears after the config window. */
  const resourceDelta = useMinimalGameplayStore((s) => s.resourceDelta);
  useEffect(() => {
    if (!resourceDelta) return;
    const timer = window.setTimeout(
      () => useMinimalGameplayStore.getState().clearResourceDelta(),
      DEFAULT_GAME_FRAME_CONFIG.hud.resourceDelta.durationMs,
    );
    return () => window.clearTimeout(timer);
  }, [resourceDelta]);
  const readoutDelta = useMemo<ResourceReadoutDelta | null>(
    () =>
      resourceDelta
        ? {
            chips: resourceDelta.gold > 0 ? { gold: resourceDelta.gold } : undefined,
            tray: resourceDelta.xp > 0 ? { id: 'xp', label: t('gameFrame.resources.xp'), amount: resourceDelta.xp } : undefined,
            at: resourceDelta.at,
          }
        : null,
    [resourceDelta, t],
  );

  const onSpeedChange = (speed: number) => {
    if (timeInputLocked) return;
    gameplay.setSpeedMultiplier(speed);
    if (state.isPaused) gameplay.resumeGame('user');
  };
  const onTogglePause = () => {
    if (timeInputLocked) return;
    if (state.isPaused) gameplay.resumeGame('user');
    else gameplay.pauseGame('user');
  };

  const availableSpeeds = [1, 2, 4, 8].filter((s) => s <= config.loop.maxSpeedMultiplier);

  /* PLAN-076: the autosave slot is refreshed on the config interval; «Salva ora» writes the whole game into a manual slot. */
  const flushGameplay = () => gameplay.saveNow();
  const menuFlow = useGameMenuFlow({ currentTick: state.currentTick, currentDay: state.currentDay, flush: flushGameplay, scale: scaleControl });
  useGameAutosave({ intervalMs: config.loop.autosaveIntervalMs, getTick: () => state.currentTick, flush: flushGameplay, enabled: !captureMode && import.meta.env.MODE !== 'test' });

  // Time shortcuts: Space pauses or resumes, 1-4 pick the speed in order. The ref keeps one listener on the latest handlers.
  const timeKeys = useRef({ onTogglePause, onSpeedChange, availableSpeeds, locked: timeInputLocked });
  useEffect(() => {
    timeKeys.current = { onTogglePause, onSpeedChange, availableSpeeds, locked: timeInputLocked };
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      /* The quest window binds keys in CAPTURE phase and preventDefaults the
       * presses it owns (option selection / beat advance). Honor that claim:
       * speed and pause keys fire only when no selection is pending (R-231). */
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))) return;
      const keys = timeKeys.current;
      if (keys.locked) return;
      if (event.code === 'Space') {
        if (target?.closest('button, a[href], [role="button"]')) return;
        event.preventDefault();
        keys.onTogglePause();
      } else if (/^[1-9]$/.test(event.key)) {
        const speed = keys.availableSpeeds[Number(event.key) - 1];
        if (speed) keys.onSpeedChange(speed);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#02060a' }}>
      <GameFrame
        title={t('gameFrame.title')}
        subtitle={t('gameFrame.subtitle')}
        objectiveSlot={<ObjectiveCartouche objective={objective} />}
        menuSlot={
          <>
            <HudGameMenu
              visible={panels.visible}
              onTogglePanel={panels.toggle}
              onSaveNow={() => saveNowToManualSlot({ flush: flushGameplay })}
              scale={scaleControl}
              includeDev={devPanels}
              {...menuFlow.menuProps}
            />
            {menuFlow.screens}
          </>
        }
        navItems={DEFAULT_GAME_FRAME_CONFIG.navItems}
        activeNavId={activeNavId}
        onNavSelect={handleNavSelect}
        whenWhereSlot={
          <WhenWhereCluster
            isDayPhase={state.isDayPhase}
            cycleProgress={state.cycleProgress}
            isPaused={state.isPaused}
            currentDay={state.currentDay}
            placeName={t('gameFrame.place')}
            speed={{ multiplier: state.speedMultiplier, available: availableSpeeds, onChange: onSpeedChange, onTogglePause }}
          />
        }
        resourcesSlot={<ResourceReadout items={buildResourceReadoutItems(selectResourceOutlook(state, config), t)} delta={readoutDelta} />}
        hangingSlot={
          panels.visible.events ? (
            /* WS-2: under stageMode the frame supplies the rightWing rect and
             *  the suspension treatment; the ledger keeps its own width when
             *  legacied (the hung tag path). */
            stageMode ? (
              <StagePanelFrame panelId="events">
                {(res) => <HudEventLedger events={events} context="game_frame" onSelect={focusEvent} onClose={() => panels.set('events', false)} style={{ width: res.rect?.w }} />}
              </StagePanelFrame>
            ) : (
              <HudEventLedger events={events} context="game_frame" onSelect={focusEvent} onClose={() => panels.set('events', false)} />
            )
          ) : undefined
        }
        utilitySlot={
          // ?capture=1 fades the button out for clean shots; it comes back under the pointer (and the P/R/E/D/T keys still work).
          <div style={captureMode ? { opacity: 0, transition: 'opacity 200ms' } : undefined} onMouseEnter={(e) => captureMode && (e.currentTarget.style.opacity = '1')} onMouseLeave={(e) => captureMode && (e.currentTarget.style.opacity = '0')}>
            <HudPanelsMenu visible={panels.visible} onToggle={panels.toggle} includeDev={devPanels} />
          </div>
        }
        rosterSlot={panels.visible.roster ? (typeof rosterSlot === 'function' ? rosterSlot({ onClose: () => panels.set('roster', false) }) : (rosterSlot ?? <Roster componentId="game-frame-roster" density="compact" onClose={() => panels.set('roster', false)} />)) : undefined}
        recenterSlot={<HudRecenterButton onRecenter={() => setRecenterSignal((n) => n + 1)} />}
        /* A ledger that changes while the chrome is hidden calls it back —
         * `events.length` is part of the wake signal, no bookkeeping needed. */
        hudWakeSignal={(hudWakeSignal ?? 0) + events.length}
        onHudHiddenChange={onHudHiddenChange}
        stageMode={stageMode}
        hudZoom={scaleControl?.cssZoom ?? 1}
      >
        {renderMap({ recenterSignal, focusRequest })}
      </GameFrame>
      {overlaySlot}
    </div>
  );
}

/** The DOM World Surface map, dressed as configured in `gameFrameConfig.worldDressing`. */
function DomWorldMap({ recenterSignal }: { recenterSignal: number }) {
  const { worldDressing } = DEFAULT_GAME_FRAME_CONFIG;
  const worldOverrides = useMemo<WorldSurfaceVisualStateOverride[]>(
    () => [
      ...worldDressing.hiddenLayerIds.map((layerId) => ({
        type: 'set_visibility' as const,
        layerId,
        visible: false,
      })),
      ...(worldDressing.seaGrade.enabled
        ? [
            {
              type: 'filter_layer' as const,
              layerId: worldDressing.seaGrade.layerId,
              filter: worldDressing.seaGrade.filter,
            },
          ]
        : []),
    ],
    [worldDressing],
  );

  return (
    <WorldSurfaceStandalone
      manifestPath={resolveWorldManifestPath(worldDressing)}
      showAtmosphere={worldDressing.showAtmosphere}
      showSeaMarks={worldDressing.showSeaMarks}
      showWaves={worldDressing.showWaves}
      showSeaRipple={worldDressing.showSeaRipple}
      seaRippleConfig={{
        ...atmosphereAssets.seaRipple,
        mode: worldDressing.rippleMode,
        animateFrequency: worldDressing.rippleAnimateFrequency,
        // The sheet that shipped in 0bb46308: 30 frames, 5x6, 59 KB.
        spriteSrc: '/assets/atmosphere/sea/ripples_sprite.webp',
        spriteFrames: 30,
        spriteColumns: 5,
        spriteRows: 6,
        spriteCycleSeconds: 2,
        blendMode: 'overlay',
        opacity: 0.35,
      }}
      breathEnabled={worldDressing.breathEnabled}
      showSeaPattern={worldDressing.showSeaPattern}
      showFoam={worldDressing.showFoam}
      safeFit={worldDressing.safeFit.enabled ? worldDressing.safeFit : undefined}
      showCoastFoam={worldDressing.showCoastFoam}
      showGlass={worldDressing.showGlass}
      visualStateOverrides={worldOverrides}
      recenterSignal={recenterSignal}
    />
  );
}

/**
 * `/game-frame` — GameFrame reference wiring (R-075 v3) on the DOM World Surface map.
 * The map's own painted frame and border are switched off (`worldDressing`) so this
 * shell is the only frame. `/game-frame-pixi` is the same screen on the Pixi map.
 */
export default function GameFramePage() {
  /* The lab page owns its own interface-size control (the pixi page passes
   *  `scaleControl` from its single `useHudScale` instance). */
  const hudScale = useHudScale();
  return <GameFrameScreen scaleControl={hudScale} renderMap={({ recenterSignal }) => <DomWorldMap recenterSignal={recenterSignal} />} />;
}
