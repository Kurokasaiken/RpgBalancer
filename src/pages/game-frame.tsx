import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
// GameFrame is a fresh, not-yet-kitted composition (R-075) — the
// `no-restricted-imports` nudge toward `frozen/kits/*` does not apply to it.
// eslint-disable-next-line no-restricted-imports
import {
  buildResourceReadoutItems,
  GameFrame,
  HudEventLedger,
  type HudEvent,
  type HudObjective,
  ObjectiveCartouche,
  HudPanelsMenu,
  useHudPanels,
  ResourceReadout,
  WhenWhereCluster,
} from '@/ui/idleVillage/components/gameFrame';
import {
  WorldSurfaceStandalone,
  type WorldSurfaceVisualStateOverride,
} from '@/ui/idleVillage/frozen/kits/worldSurfaceKit';
import { atmosphereAssets } from '@/ui/idleVillage/config/atmosphereAssets';
import { MatericRosterComponent } from '@/ui/idleVillage/roster';
import { MatericRosterComponentV2 } from '@/ui/idleVillage/rosterV2';
import { useHudMaterial } from '@/ui/idleVillage/components/gameFrame/useHudMaterial';
import { resolveWorldManifestPath } from '@/ui/idleVillage/components/gameFrame/resolveWorldManifest';
import { selectResourceOutlook, useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { HudRecenterButton } from '@/ui/idleVillage/components/gameFrame/HudRecenterButton';
import { useTimeEngineLoop } from '@/ui/idleVillage/hooks/useTimeEngineLoop';

/**
 * The whole /game-frame screen — HUD ribbons, event ledger, roster, instruments —
 * around a map supplied by the caller, so the DOM map and the Pixi map share one HUD.
 * Every value on screen is real state from `useMinimalGameplayWithIdleVillageConfig`
 * except the events, which are fixtures until an event system exists (R-071).
 * The screen drives the game clock itself (`useTimeEngineLoop`): the astrolabe's
 * pause and speed act on it, and so does everything that reads the store.
 */
export interface GameFrameScreenProps {
  renderMap: (opts: { recenterSignal: number }) => ReactNode;
  /** Replaces the default stand-alone roster, e.g. with one wired to quest slots. */
  rosterSlot?: ReactNode | ((api: { onClose: () => void }) => ReactNode);
  /** Screen-level floating UI (quest detail, quest card, skill check, drag flight). */
  overlaySlot?: ReactNode;
  /** Extra events on top of the fixture feed (e.g. a scripted invasion). */
  extraEvents?: HudEvent[];
  /** What the player should do now; the top-left cartouche is hidden without it. */
  objective?: HudObjective;
}

export function GameFrameScreen({ renderMap, rosterSlot, overlaySlot, extraEvents, objective }: GameFrameScreenProps) {
  const { t } = useTranslation('idleVillage');
  const gameplay = useMinimalGameplayWithIdleVillageConfig();
  const { state, config } = gameplay;
  useTimeEngineLoop(gameplay);
  const Roster = useHudMaterial() === 'lacquer' ? MatericRosterComponentV2 : MatericRosterComponent;

  const [activeNavId, setActiveNavId] = useState('map');
  // Fixture: no event system exists yet (R-071). Replace with the real feed when it lands.
  const fixtureEvents = useMemo(
    () => [
      { id: 'wolves', typeId: 'threat', title: t('gameFrame.events.fixtures.wolves'), daysLeft: 2 },
      { id: 'expedition', typeId: 'expedition', title: t('gameFrame.events.fixtures.expedition'), daysLeft: 3 },
      { id: 'granary', typeId: 'construction', title: t('gameFrame.events.fixtures.granary'), daysLeft: 1 },
      { id: 'harvest', typeId: 'harvest', title: t('gameFrame.events.fixtures.harvest'), daysLeft: 4 },
      { id: 'caravan', typeId: 'visit', title: t('gameFrame.events.fixtures.caravan'), daysLeft: 7 },
    ],
    [t],
  );
  const events = useMemo(() => [...(extraEvents ?? []), ...fixtureEvents], [extraEvents, fixtureEvents]);
  const panels = useHudPanels();
  const [recenterSignal, setRecenterSignal] = useState(0);
  const onSpeedChange = (speed: number) => {
    gameplay.setSpeedMultiplier(speed);
    if (state.isPaused) gameplay.resumeGame('user');
  };
  const onTogglePause = () => (state.isPaused ? gameplay.resumeGame('user') : gameplay.pauseGame('user'));

  const availableSpeeds = [1, 2, 4, 8].filter((s) => s <= config.loop.maxSpeedMultiplier);

  // Time shortcuts: Space pauses or resumes, 1-4 pick the speed in order. The ref keeps one listener on the latest handlers.
  const timeKeys = useRef({ onTogglePause, onSpeedChange, availableSpeeds });
  timeKeys.current = { onTogglePause, onSpeedChange, availableSpeeds };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(target.tagName))) return;
      const keys = timeKeys.current;
      if (event.code === 'Space') {
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
        navItems={DEFAULT_GAME_FRAME_CONFIG.navItems}
        activeNavId={activeNavId}
        onNavSelect={setActiveNavId}
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
        resourcesSlot={<ResourceReadout items={buildResourceReadoutItems(selectResourceOutlook(state, config), t)} />}
        hangingSlot={panels.visible.events ? <HudEventLedger events={events} context="game_frame" onClose={() => panels.set('events', false)} /> : undefined}
        utilitySlot={<HudPanelsMenu visible={panels.visible} onToggle={panels.toggle} />}
        rosterSlot={panels.visible.roster ? (typeof rosterSlot === 'function' ? rosterSlot({ onClose: () => panels.set('roster', false) }) : (rosterSlot ?? <Roster componentId="game-frame-roster" density="compact" onClose={() => panels.set('roster', false)} />)) : undefined}
        recenterSlot={<HudRecenterButton onRecenter={() => setRecenterSignal((n) => n + 1)} />}
      >
        {renderMap({ recenterSignal })}
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
  return <GameFrameScreen renderMap={({ recenterSignal }) => <DomWorldMap recenterSignal={recenterSignal} />} />;
}
