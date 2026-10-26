import { useEffect, useState } from 'react';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { settlementLostConfig } from '@/balancing/config/idleVillage/settlementLostConfig';
import { useReducedMotion } from './useReducedMotion';

/** Own DOM id: the overlay mounts its own filter under `settlementLostConfig.filterId`. */
export const SETTLEMENT_LOST_WORLD_FILTER_ID = `${settlementLostConfig.filterId}-world`;

const TICK_MS = 33;

/**
 * Grade progress for the run-ending takeover, shared by pages that host the
 * world surface. 0 while the run is alive; climbs 0→1 over
 * `settlementLostConfig.irisDurationMs` (the same clock as the iris sweep) once
 * `gameOverState` says `settlement_lost`; jumps straight to 1 under reduced
 * motion. A `setInterval` clock, not rAF: rAF stalls in a hidden pane.
 */
export function useSettlementLostGrade(): number {
  const active = useMinimalGameplayStore(
    (s) => s.gameOverState.isGameOver && s.gameOverState.reason === 'settlement_lost',
  );
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return undefined;
    }
    if (reducedMotion) {
      setProgress(1);
      return undefined;
    }
    const start = performance.now();
    const id = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / settlementLostConfig.irisDurationMs);
      setProgress(p);
      if (p >= 1) window.clearInterval(id);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [active, reducedMotion]);

  return active ? progress : 0;
}
