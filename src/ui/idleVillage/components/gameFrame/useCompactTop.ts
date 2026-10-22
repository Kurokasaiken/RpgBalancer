import { useEffect, useState } from 'react';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { getHudZoomFactor } from './hudScale';

/**
 * True when the viewport is too narrow for the full top row (resource trends, place
 * name): the detail moves to tooltips so the three top plaques never overlap.
 * The breakpoint reads chrome-layer units (DEF-06): the usable width is
 * `innerWidth / zoom` — recomputed per render so a mode change applies at once.
 */
export function useCompactTop(): boolean {
  const limit = DEFAULT_GAME_FRAME_CONFIG.breakpoints.compactTopPx;
  const [, bump] = useState(0);
  useEffect(() => {
    const onResize = () => bump((v) => v + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return typeof window !== 'undefined' && window.innerWidth / getHudZoomFactor() < limit;
}
