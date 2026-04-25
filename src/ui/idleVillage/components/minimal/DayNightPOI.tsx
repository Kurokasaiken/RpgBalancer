import type { JSX } from 'react';
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
 * @component
 * @returns A visual-only POI indicator for day/night cycle state
 */
export default function DayNightPOI(): JSX.Element {
  const gameplayState = useMinimalGameplayWithIdleVillageConfig();

  return (
    <DayNightPoiSkin
      isDayPhase={gameplayState.state.isDayPhase}
      cycleProgress={gameplayState.state.cycleProgress || 0}
      isPaused={gameplayState.state.isPaused}
    />
  );
}
