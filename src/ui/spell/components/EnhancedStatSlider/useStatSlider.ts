import { useCallback, useMemo } from 'react';
import type { StatTick } from './types';

interface UseStatSliderParams {
  ticks: StatTick[];
  onSelectTick: (index: number) => void;
}

export const useStatSlider = ({ ticks, onSelectTick }: UseStatSliderParams) => {
  const handleRangeChange = useCallback(
    (value: number) => {
      onSelectTick(value);
    },
    [onSelectTick]
  );

  const canRemoveTick = useMemo(() => ticks.length > 3, [ticks.length]);

  return {
    handleRangeChange,
    canRemoveTick
  };
};
