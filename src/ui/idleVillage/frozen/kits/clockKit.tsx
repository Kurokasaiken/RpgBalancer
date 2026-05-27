/**
 * clockKit — frozen re-export of {@link ClockWidget}.
 *
 * Reference page: `MinimalGameplayPage` (audit Day 6 pending — selector below
 * may be revised). Contract subtree: `[data-testid="minimal-clock-widget"]`.
 */

import { useMemo } from 'react';
import { DEFAULT_MINIMAL_CONFIG } from '../_infra/CanonicalDataBridge';

export { ClockWidget } from '@/ui/idleVillage/components/minimal/ClockWidget';
export type { ClockWidgetProps } from '@/ui/idleVillage/components/minimal/ClockWidget';

/**
 * Canonical defaults for ClockWidget derived from `DEFAULT_MINIMAL_CONFIG`.
 * The page uses these directly so a state-less render is possible.
 */
export function useClockKitData() {
  return useMemo(() => {
    const cfg = (DEFAULT_MINIMAL_CONFIG as unknown as {
      timeEngine?: {
        defaultSpeedMultiplier?: number;
        maxSpeedMultiplier?: number;
        tickIntervalMs?: number;
        warmupDelayMs?: number;
        accentHex?: string;
      };
    }).timeEngine;
    return {
      currentDay: 1,
      isPaused: true,
      speedMultiplier: cfg?.defaultSpeedMultiplier ?? 1,
      defaultSpeedMultiplier: cfg?.defaultSpeedMultiplier ?? 1,
      maxSpeedMultiplier: cfg?.maxSpeedMultiplier ?? 4,
      tickIntervalMs: cfg?.tickIntervalMs ?? 1000,
      warmupDelayMs: cfg?.warmupDelayMs ?? 0,
      accentHex: cfg?.accentHex ?? '#4ECDC4',
    };
  }, []);
}

export * from './clockKit.contract';
