import { useEffect, useMemo, useRef, type ComponentProps } from 'react';
import { TimeEngineStrip } from './TimeEngineStrip';
import DayNightPoiSkin from './DayNightPoiSkin';
import type { ActiveHUDState } from '@/ui/idleVillage/hooks/useActiveHUDState';
import {
  useMinimalGameplayWithIdleVillageConfig,
} from '@/store/useMinimalGameplay';

const EMPTY_HUD_STATE: ActiveHUDState = {
  activities: [],
  totalActive: 0,
  totalCompleted: 0,
  counts: { jobs: 0, quests: 0, maintenance: 0, total: 0 },
  hasActiveActivities: false,
  persistence: {
    lastSaveTime: null,
    isDirty: false,
    preferences: {
      collapsed: false,
      maxVisible: 5,
      sortBy: 'remaining-time',
      showTypeBadges: true,
      compactMode: false,
    },
    uiState: {
      selectedTypeFilter: 'all',
      telemetryPanelOpen: false,
      position: 'top',
    },
    metadata: {
      lastSaved: 0,
      version: '1.0.0',
    },
  },
};

const EMPTY_VILLAGE_STATE = { resources: { gold: 0, wood: 0, stone: 0 } };

export interface DayNightTimeEngineStripProps
  extends Omit<
    ComponentProps<typeof TimeEngineStrip>,
    'phaseIcon' | 'isPlaying' | 'progressFraction' | 'totalSeconds' | 'onToggle' | 'clockProps' | 'hudState' | 'villageState' | 'secondsPerTimeUnit' | 'temporalDisplay'
  > {
  /**
   * Gameplay source. When omitted the hook is called internally, which is fine
   * because the Zustand store is shared. Passing it explicitly lets pages that
   * already call the hook avoid a double subscription.
   */
  gameplay?: ReturnType<typeof useMinimalGameplayWithIdleVillageConfig>;
  label?: string;
  compact?: boolean;
}

/**
 * Drop-in day/night time engine strip.
 *
 * Reads the canonical minimal gameplay store, computes the 24-hour day/night
 * cycle progress from config, and renders a `TimeEngineStrip` with the correct
 * `DayNightPoiSkin` phase icon and color. Use it in any page as a single line:
 *
 * ```tsx
 * import { DayNightTimeEngineStrip } from '@/ui/idleVillage/frozen/kits/clockKit';
 * import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
 *
 * export function MyPage() {
 *   const gameplay = useMinimalGameplayWithIdleVillageConfig();
 *   return <DayNightTimeEngineStrip gameplay={gameplay} compact />;
 * }
 * ```
 */
export function DayNightTimeEngineStrip({
  gameplay: gameplayProp,
  label = 'Day/Night Cycle',
  compact = false,
  ...rest
}: DayNightTimeEngineStripProps) {
  const gameplay = gameplayProp ?? useMinimalGameplayWithIdleVillageConfig();
  const { state: gameState, pauseGame, resumeGame, setSpeedMultiplier, config } = gameplay;
  const isPaused = gameState.isPaused;
  const speed = gameState.speedMultiplier;
  const isDayPhase = gameState.isDayPhase;
  const currentDay = gameState.currentDay;
  const currentTick = gameState.currentTick;

  const dayNightProgress = useMemo(() => {
    const dayNightCycle = config.globalRules.dayNightCycle;
    if (!dayNightCycle || dayNightCycle.dayTimeUnits + dayNightCycle.nightTimeUnits === 0) {
      return 0;
    }
    const totalCycleTicks = dayNightCycle.dayTimeUnits + dayNightCycle.nightTimeUnits;
    return (Math.max(0, currentTick) % totalCycleTicks) / totalCycleTicks;
  }, [currentTick, config]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (isPaused) {
        resumeGame('keyboard');
      } else {
        pauseGame('keyboard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, pauseGame, resumeGame]);

  // Canonical time engine loop: when the strip is visible, time advances.
  // tick() is stored in a ref so the interval doesn't reset on gameplay object
  // reference changes.
  const tick = gameplay.tick;
  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    if (isPaused) return undefined;
    const intervalMs = gameplay.config.loop.tickIntervalMs ?? 1000;
    const intervalId = setInterval(() => {
      tickRef.current(intervalMs, 'auto');
    }, intervalMs);
    return () => clearInterval(intervalId);
  }, [isPaused, gameplay.config.loop.tickIntervalMs]);

  return (
    <TimeEngineStrip
      phaseIcon={
        <DayNightPoiSkin
          isDayPhase={isDayPhase}
          cycleProgress={dayNightProgress}
          isPaused={isPaused}
        />
      }
      isPlaying={!isPaused}
      progressFraction={dayNightProgress}
      totalSeconds={86400}
      onToggle={() => (isPaused ? resumeGame('user') : pauseGame('user'))}
      label={label}
      clockProps={{
        currentDay,
        isPaused,
        speedMultiplier: speed,
        defaultSpeedMultiplier: 1,
        maxSpeedMultiplier: 8,
        tickIntervalMs: 1000,
        warmupDelayMs: 0,
        accentHex: '#f59e0b',
        onSpeedChange: setSpeedMultiplier,
        availableSpeeds: [1, 2, 4, 8],
      }}
      hudState={EMPTY_HUD_STATE}
      villageState={EMPTY_VILLAGE_STATE}
      secondsPerTimeUnit={config.globalRules.secondsPerTimeUnit ?? 1}
      temporalDisplay={{
        year: `GIORNO ${currentDay}`,
        season: isDayPhase ? 'GIORNO' : 'NOTTE',
        time: `TICK ${currentTick}`,
      }}
      compact={compact}
      {...rest}
    />
  );
}
