/**
 * clockKit — frozen re-export of {@link ClockWidget}.
 *
 * Reference page: `MinimalGameplayPage` (audit Day 6 pending — selector below
 * may be revised). Contract subtree: `[data-testid="minimal-clock-widget"]`.
 */

import { useMemo, type ComponentProps } from 'react';
import { DEFAULT_MINIMAL_CONFIG } from '../_infra/CanonicalDataBridge';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';
import { ClockWidget } from '@/ui/idleVillage/components/minimal/ClockWidget';
import { TimeEngineStrip } from '@/ui/idleVillage/components/minimal/TimeEngineStrip';
import { DayNightTimeEngineStrip } from '@/ui/idleVillage/components/minimal/DayNightTimeEngineStrip';

export { ClockWidget } from '@/ui/idleVillage/components/minimal/ClockWidget';
export { TimeEngineStrip } from '@/ui/idleVillage/components/minimal/TimeEngineStrip';
export { DayNightTimeEngineStrip } from '@/ui/idleVillage/components/minimal/DayNightTimeEngineStrip';
export type { ClockWidgetProps } from '@/ui/idleVillage/components/minimal/ClockWidget';
export type { DayNightTimeEngineStripProps } from '@/ui/idleVillage/components/minimal/DayNightTimeEngineStrip';

/** Chain mirrors src/pages/minimal-clock.tsx: SkinSystemProvider → SandboxTimingProvider. */
export const CLOCK_PROVIDER_CHAIN: KitProviderName[] = ['SkinSystemProvider', 'SandboxTimingProvider'];

/** Smart shell: mounts only the providers missing above in the tree. */
export const ClockKitShell = createKitShell(CLOCK_PROVIDER_CHAIN, 'ClockKitShell');

/** Drop-in variant: the canonical ClockWidget pre-wrapped in its smart shell. */
export const ClockWidgetStandalone = withKitShell<ComponentProps<typeof ClockWidget>>(
  ClockWidget,
  CLOCK_PROVIDER_CHAIN,
  'ClockWidgetStandalone'
);

/** Drop-in variant: the day/night clock strip pre-wrapped in its smart shell.
 *  Mounts SkinSystemProvider + SandboxTimingProvider if not already present. */
export const DayNightTimeEngineStripStandalone = withKitShell<ComponentProps<typeof DayNightTimeEngineStrip>>(
  DayNightTimeEngineStrip,
  CLOCK_PROVIDER_CHAIN,
  'DayNightTimeEngineStripStandalone'
);

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
