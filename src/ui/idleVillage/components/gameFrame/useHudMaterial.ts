import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

export type HudMaterial = 'legacy' | 'lacquer';

/**
 * Frame construction in use. Config decides; in dev builds `?hud=legacy|lacquer`
 * overrides it so the old and the new look can be compared on the same screen.
 */
export function useHudMaterial(): HudMaterial {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const override = new URLSearchParams(window.location.search).get('hud');
    if (override === 'legacy' || override === 'lacquer') return override;
  }
  return DEFAULT_GAME_FRAME_CONFIG.hud.material;
}
