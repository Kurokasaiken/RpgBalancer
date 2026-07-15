import { useCallback, useMemo } from 'react';
import type { StatTick } from './types';

/**
 * Params for useStatSlider hook
 */
interface UseStatSliderParams {
  ticks: StatTick[];
  onSelectTick: (index: number) => void;
}

/**
 * Custom hook for EnhancedStatSlider logic
 * 
 * Provides handlers for range changes and determines if ticks can be removed.
 * 
 * @param params - Hook parameters
 * @returns Hook return value with handlers and state
 */
export const useStatSlider = ({ ticks, onSelectTick }: UseStatSliderParams) => {
  /**
   * Handler for range input change
   * Converts value to number and calls onSelectTick
   */
  const handleRangeChange = useCallback(
    (value: number) => {
      onSelectTick(value);
    },
    [onSelectTick]
  );

  /**
   * Determines if a tick can be removed
   * Requires at least 3 ticks to maintain functionality
   */
  const canRemoveTick = useMemo(() => ticks.length > 3, [ticks.length]);

  return {
    handleRangeChange,
    canRemoveTick
  };
};
