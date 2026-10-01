import { useEffect, useRef } from 'react';
import type { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';

type Gameplay = ReturnType<typeof useMinimalGameplayWithIdleVillageConfig>;

/**
 * Drives the canonical time store: while the game is not paused, calls `tick()`
 * every `config.loop.tickIntervalMs` (the store applies the speed multiplier).
 *
 * Also binds Space to pause/resume anywhere on the page (not while typing or on a
 * focused control that Space already activates).
 *
 * Same loop `DayNightTimeEngineStrip` runs while it is mounted, for screens that
 * show time through other instruments (the GameFrame HUD). Mount exactly one
 * driver per screen, or time advances twice as fast.
 */
export function useTimeEngineLoop(gameplay: Gameplay): void {
  const tickRef = useRef(gameplay.tick);
  useEffect(() => {
    tickRef.current = gameplay.tick;
  }, [gameplay.tick]);

  const isPaused = gameplay.state.isPaused;
  const intervalMs = gameplay.config.loop.tickIntervalMs ?? 1000;
  useEffect(() => {
    if (isPaused) return undefined;
    const id = setInterval(() => tickRef.current(intervalMs, 'auto'), intervalMs);
    return () => clearInterval(id);
  }, [isPaused, intervalMs]);

  const { pauseGame, resumeGame } = gameplay;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('input, textarea, select, button, a, [contenteditable="true"], [role="button"]')) return;
      e.preventDefault();
      if (isPaused) resumeGame('keyboard');
      else pauseGame('keyboard');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPaused, pauseGame, resumeGame]);
}
