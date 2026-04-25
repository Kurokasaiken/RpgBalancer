import { useCallback, useMemo, useState } from 'react';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import { deriveCycleConfig, deriveCycleState } from './cycleMath';

export interface IdleVillageTimerDriver {
  pauseTimer: () => void;
  resumeTimer: () => void;
  villageState?: VillageState | null;
}

export interface IdleVillageTickerOptions {
  config: IdleVillageConfig;
  driver: IdleVillageTimerDriver;
}

export interface IdleVillageTicker {
  isPlaying: boolean;
  cycle: ReturnType<typeof deriveCycleState>;
  cycleConfig: ReturnType<typeof deriveCycleConfig>;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
}

/**
 * Hook that exposes the global Idle Village cycle (day/night) state along with play/pause controls.
 * The hook stays purely in charge of UI orchestration: actual time advancement is delegated to the driver
 * (typically returned by useActivityScheduler).
 */
export function useIdleVillageTicker({ config, driver }: IdleVillageTickerOptions): IdleVillageTicker {
  const [isPlaying, setIsPlaying] = useState(false);

  const cycleConfig = useMemo(() => deriveCycleConfig(config), [config]);
  const currentTimeUnits = driver.villageState?.currentTime ?? 0;
  const cycle = useMemo(
    () => deriveCycleState(cycleConfig, currentTimeUnits),
    [cycleConfig, currentTimeUnits],
  );

  const play = useCallback(() => {
    driver.resumeTimer();
    setIsPlaying(true);
  }, [driver]);

  const pause = useCallback(() => {
    driver.pauseTimer();
    setIsPlaying(false);
  }, [driver]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        driver.resumeTimer();
      } else {
        driver.pauseTimer();
      }
      return next;
    });
  }, [driver]);

  return {
    isPlaying,
    cycle,
    cycleConfig,
    togglePlay,
    play,
    pause,
  };
}
