import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
// GameFrame is a fresh, not-yet-kitted composition (R-075) — the
// `no-restricted-imports` nudge toward `frozen/kits/*` does not apply to it.
// eslint-disable-next-line no-restricted-imports
import {
  FloatingWorldOrnaments,
  GameFrame,
  HudGlyph,
  HudHangingTag,
  ResourceReadout,
  SpeedControl,
  WhenWhereCluster,
} from '@/ui/idleVillage/components/gameFrame';
import {
  WorldSurfaceStandalone,
  type WorldSurfaceVisualStateOverride,
} from '@/ui/idleVillage/frozen/kits/worldSurfaceKit';
import { atmosphereAssets } from '@/ui/idleVillage/config/atmosphereAssets';
import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

/**
 * `/game-frame` — GameFrame reference wiring (R-075 v3).
 *
 * v3 adopts the composition of the Director's reference mockup — shaped
 * ribbons, a hung tag, world full-bleed — while taking none of its
 * mechanics: no weather, no notification bell, no crystal/stone resources.
 * Every value on screen is real state from `useMinimalGameplayWithIdleVillageConfig`
 * except the invasion countdown, which is still the R-071 fixture because no
 * presence system exists yet to feed it.
 *
 * The map's own painted frame and border layers are switched off here (see
 * `worldDressing` in `gameFrameConfig`) so this shell is the only frame, and
 * the sea is pushed toward the chrome's teal so map and UI read as one image.
 *
 * Not wired into `/minimal-gameplay` yet — see RICHIESTE.md R-075.
 */
export default function GameFramePage() {
  const { t } = useTranslation('idleVillage');
  const gameplay = useMinimalGameplayWithIdleVillageConfig();
  const { state, config } = gameplay;

  const [activeNavId, setActiveNavId] = useState('map');
  // Fixture: no real presence/countdown system exists yet (R-071).
  const [daysLeft, setDaysLeft] = useState(5);

  const availableSpeeds = [1, 2, 4, 8].filter((s) => s <= config.loop.maxSpeedMultiplier);

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
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#02060a' }}>
      <GameFrame
        title={t('gameFrame.title')}
        subtitle={t('gameFrame.subtitle')}
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
          />
        }
        resourcesSlot={
          <ResourceReadout
            items={[
              {
                id: 'gold',
                icon: <HudGlyph iconId="gold" label={t('gameFrame.resources.gold')} />,
                label: t('gameFrame.resources.gold'),
                value: state.gold,
              },
              {
                id: 'food',
                icon: <HudGlyph iconId="food" label={t('gameFrame.resources.food')} />,
                label: t('gameFrame.resources.food'),
                value: `${state.food}/${state.maxFood}`,
              },
              {
                id: 'wood',
                icon: <HudGlyph iconId="wood" label={t('gameFrame.resources.wood')} />,
                label: t('gameFrame.resources.wood'),
                value: state.wood,
              },
            ]}
          />
        }
        hangingSlot={
          daysLeft > 0 ? (
            <button
              type="button"
              onClick={() => setDaysLeft((d) => Math.max(0, d - 1))}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <HudHangingTag eyebrow={t('world.goblinInvasion.invasion')}>
                {t('gameFrame.invasion.body', { count: daysLeft })}
              </HudHangingTag>
            </button>
          ) : undefined
        }
        utilitySlot={
          <SpeedControl
            speedMultiplier={state.speedMultiplier}
            availableSpeeds={availableSpeeds}
            onSpeedChange={gameplay.setSpeedMultiplier}
          />
        }
        floatingSlot={<FloatingWorldOrnaments />}
      >
        <WorldSurfaceStandalone
          manifestPath={worldDressing.manifestPath}
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
          showGlass={worldDressing.showGlass}
          visualStateOverrides={worldOverrides}
        />
      </GameFrame>
    </div>
  );
}
