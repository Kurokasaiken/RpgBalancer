import { useEffect, useState } from 'react';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

/**
 * True when the viewport is too narrow for the full top row (resource trends, place
 * name): the detail moves to tooltips so the three top plaques never overlap.
 */
export function useCompactTop(): boolean {
  const limit = DEFAULT_GAME_FRAME_CONFIG.breakpoints.compactTopPx;
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.innerWidth < limit);
  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < limit);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [limit]);
  return compact;
}
