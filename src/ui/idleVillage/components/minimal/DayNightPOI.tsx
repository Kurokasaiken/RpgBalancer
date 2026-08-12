import type { JSX } from 'react';
import { useCallback } from 'react';
import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import DayNightPoiSkin from './DayNightPoiSkin';

/**
 * Day/Night Cycle POI Component
 * 
 * Renders a world-state POI showing the current day/night phase and progress.
 * This component belongs to the POI family and follows the visual grammar
 * of world-state indicators (not interactive detail views).
 * 
 * Reads temporal state from useMinimalGameplay store:
 * - isDayPhase: Current phase (true = day, false = night)
 * - cycleProgress: 0-1 progress through current phase
 * - isPaused: Whether the cycle is paused
 * 
 * Visual states:
 * - Day Running: Gold ring, sun icon, full bloom
 * - Night Running: Purple ring, moon icon, reduced bloom  
 * - Paused: Gray ring, pause icon, minimal bloom
 * 
 * Interaction: Click anywhere on the POI to toggle pause/play state.
 * 
 * @component
 * @returns A visual-only POI indicator for day/night cycle state
 */
export interface DayNightPOIProps {
  /**
   * Drive the phase from the caller's clock instead of the global store.
   * Supply this on surfaces that run their own time engine, so the cycle
   * cannot drift away from the clock the player is actually looking at.
   */
  isDayPhase?: boolean;
  /** Progress 0–1 through the current phase; pairs with `isDayPhase`. */
  cycleProgress?: number;
  /** Whether the caller's clock is paused; pairs with `isDayPhase`. */
  isPaused?: boolean;
  /**
   * Pause/resume handler for the caller's clock. When omitted, clicking falls
   * back to toggling the global store.
   */
  onTogglePause?: () => void;
}

export default function DayNightPOI(props: DayNightPOIProps = {}): JSX.Element {
  const gameplayState = useMinimalGameplayWithIdleVillageConfig();
  const { pauseGame, resumeGame } = gameplayState;

  // Controlled whenever the caller supplies a phase; otherwise store-driven.
  const isControlled = props.isDayPhase !== undefined;
  const isDayPhase = isControlled ? props.isDayPhase! : gameplayState.state.isDayPhase;
  const cycleProgress = isControlled
    ? (props.cycleProgress ?? 0)
    : (gameplayState.state.cycleProgress || 0);
  const isPaused = isControlled
    ? (props.isPaused ?? false)
    : gameplayState.state.isPaused;

  const { onTogglePause } = props;

  const handleClick = useCallback(() => {
    if (onTogglePause) {
      onTogglePause();
      return;
    }
    if (gameplayState.state.isPaused) {
      resumeGame('user');
    } else {
      pauseGame('user');
    }
  }, [onTogglePause, gameplayState.state.isPaused, pauseGame, resumeGame]);

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      <DayNightPoiSkin
        isDayPhase={isDayPhase}
        cycleProgress={cycleProgress}
        isPaused={isPaused}
      />
    </div>
  );
}
