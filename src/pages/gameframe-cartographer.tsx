import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
// A/B comparison route (R-075) — same exemption as /game-frame.
// eslint-disable-next-line no-restricted-imports
import {
  GameFrame,
  HudGlyph,
  HudHangingTag,
  SpeedControl,
  WhenWhereCluster,
} from '@/ui/idleVillage/components/gameFrame';
// eslint-disable-next-line no-restricted-imports -- same R-075 exemption as the GameFrame barrel above.
import { ResourceMedallionRow } from '@/ui/idleVillage/components/gameFrame/ResourceMedallion';
import {
  WorldSurfaceStandalone,
  type WorldSurfaceVisualStateOverride,
} from '@/ui/idleVillage/frozen/kits/worldSurfaceKit';
import { atmosphereAssets } from '@/ui/idleVillage/config/atmosphereAssets';
import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

/**
 * `/gameframe-cartographer` — variant B of the R-075 review's A/B ask.
 *
 * Same structure, same slots, same config as `/gameframe-living-atlas` —
 * only the material changes:
 *   - `GameFrame variant="cartographer"` gives every ribbon a carved bevel
 *     (inset highlight + inset shadow) instead of a flat fill.
 *   - Resources render as `ResourceMedallionRow` — small sigil discs "set on
 *     the desk" next to the map — instead of an inline icon+label row.
 *
 * This is deliberately NOT a second shell: it reuses `GameFrame`,
 * `HudRibbon`, `HudHangingTag`, `WhenWhereCluster`, `SpeedControl` verbatim,
 * because the review's candidate is Living Atlas *structure* carrying
 * Cartographer's Desk *materiality* — not two competing component trees.
 */
export default function GameFrameCartographerPage() {
  const { t } = useTranslation('idleVillage');
  const gameplay = useMinimalGameplayWithIdleVillageConfig();
  const { state, config } = gameplay;

  const [activeNavId, setActiveNavId] = useState('map');
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
        variant="cartographer"
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
          <ResourceMedallionRow
            items={[
              {
                id: 'gold',
                icon: <HudGlyph iconId="gold" label={t('gameFrame.resources.gold')} size={16} />,
                label: t('gameFrame.resources.gold'),
                value: state.gold,
              },
              {
                id: 'food',
                icon: <HudGlyph iconId="food" label={t('gameFrame.resources.food')} size={16} />,
                label: t('gameFrame.resources.food'),
                value: `${state.food}/${state.maxFood}`,
              },
              {
                id: 'wood',
                icon: <HudGlyph iconId="wood" label={t('gameFrame.resources.wood')} size={16} />,
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
        />
      </GameFrame>
    </div>
  );
}
