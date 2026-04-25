/**
 * Performance HUD Constants
 *
 * Shared constants for Performance HUD component to avoid fast refresh issues.
 */

export const DEFAULT_HUD_CONFIG = {
  enabled: true,
  updateIntervalMs: 100,
  defaultVisible: false,
  position: 'top-right' as const,
  theme: 'dark' as const,
};

export type PerformanceHudConfig = Partial<typeof DEFAULT_HUD_CONFIG>;
