import { z } from 'zod';

/**
 * Runtime configuration for portrait preloading / ghosting.
 */
export interface PortraitPreloadConfig {
  /** Maximum number of cached portrait bitmaps kept in memory. */
  maxPortraits: number;
  /** Fallback timeout (ms) after which we consider the portrait decoded. */
  decodeTimeoutMs: number;
  /** Whether to inject <link rel="preload"> tags for portraits. */
  enableLinkPreload: boolean;
  /** Optional eager resident ids that should be preloaded during boot. */
  eagerResidentIds: string[];
  /** Placeholder styling for ghost state while portraits decode. */
  placeholder: {
    /** CSS color or gradient for the placeholder base. */
    baseFill: string;
    /** Accent color used for swirl/texture overlays. */
    accentFill: string;
  };
}

export const PortraitPreloadConfigSchema = z.object({
  maxPortraits: z.number().min(1).max(256),
  decodeTimeoutMs: z.number().min(0).max(10_000),
  enableLinkPreload: z.boolean(),
  eagerResidentIds: z.array(z.string()),
  placeholder: z.object({
    baseFill: z.string(),
    accentFill: z.string(),
  }),
});

/**
 * Default configuration aligned with Wanderlust "Dark Luxury" aesthetic.
 */
export const DEFAULT_PORTRAIT_PRELOAD_CONFIG: PortraitPreloadConfig = {
  maxPortraits: 32,
  decodeTimeoutMs: 450,
  enableLinkPreload: true,
  eagerResidentIds: [],
  placeholder: {
    baseFill: 'radial-gradient(circle at 30% 25%, rgba(15,12,24,0.92), rgba(4,3,8,0.96))',
    accentFill: 'linear-gradient(135deg, rgba(69,54,32,0.65), rgba(18,14,9,0.85))',
  },
};

/**
 * Utility that merges overrides with defaults while validating via Zod.
 */
export function createPortraitPreloadConfig(
  overrides?: Partial<PortraitPreloadConfig>,
): PortraitPreloadConfig {
  if (!overrides) {
    return DEFAULT_PORTRAIT_PRELOAD_CONFIG;
  }

  const merged = {
    ...DEFAULT_PORTRAIT_PRELOAD_CONFIG,
    ...overrides,
    placeholder: {
      ...DEFAULT_PORTRAIT_PRELOAD_CONFIG.placeholder,
      ...overrides.placeholder,
    },
  };

  return PortraitPreloadConfigSchema.parse(merged);
}
