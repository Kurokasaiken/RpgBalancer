import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
// A/B comparison route (R-075) — same exemption as /game-frame.
// eslint-disable-next-line no-restricted-imports
import {
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
 * `/gameframe-living-atlas` — variant A of the R-075 review's A/B ask.
 *
 * Review verdict (2026-09-22): "Living Atlas è attualmente il candidato più
 * solido, ma deve prendere da Cartographer's Desk la materialità degli
 * oggetti. Non approverei ancora una convergenza definitiva senza
 * confrontare visivamente almeno queste due direzioni."
 *
 * This is that comparison's first half: `GameFrame` at `variant="atlas"` —
 * thin minimal-line ribbons, no bevel, flat readouts. Everything else
 * (wiring, data, world dressing) is identical to `/gameframe-cartographer`
 * on purpose, so the only variable between the two tabs is ribbon material.
 * `/game-frame` remains the production route and is untouched by this file.
 */
export default function GameFrameLivingAtlasPage() {
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
        variant="atlas"
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
          showGlass={worldDressing.showGlass}
          visualStateOverrides={worldOverrides}
        />
      </GameFrame>
    </div>
  );
}
