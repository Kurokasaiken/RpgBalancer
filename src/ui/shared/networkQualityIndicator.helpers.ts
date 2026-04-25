import { z } from 'zod';

export const NetworkQualityLevelSchema = z.enum(['excellent', 'good', 'fair', 'poor', 'offline']);
export type NetworkQualityLevel = z.infer<typeof NetworkQualityLevelSchema>;

export const NetworkMetricsSchema = z.object({
  rtt: z.number(),
  jitter: z.number(),
  packetLoss: z.number(),
  bandwidth: z.number().optional(),
  latency: z.number().optional(),
  timestamp: z.number(),
});

export type NetworkMetrics = z.infer<typeof NetworkMetricsSchema>;

export const NetworkQualityConfigSchema = z.object({
  thresholds: z.object({
    excellent: z.object({ rtt: z.number().default(50), jitter: z.number().default(10), packetLoss: z.number().default(0.1) }),
    good: z.object({ rtt: z.number().default(100), jitter: z.number().default(30), packetLoss: z.number().default(0.5) }),
    fair: z.object({ rtt: z.number().default(200), jitter: z.number().default(50), packetLoss: z.number().default(1) }),
    poor: z.object({ rtt: z.number().default(500), jitter: z.number().default(100), packetLoss: z.number().default(3) }),
  }),
  monitoring: z.object({
    interval: z.number().default(5000),
    sampleSize: z.number().default(10),
    timeout: z.number().default(10000),
    retries: z.number().default(3),
  }),
  ui: z.object({
    showDetails: z.boolean().default(true),
    showHistory: z.boolean().default(false),
    position: z.enum(['top-right', 'top-left', 'bottom-right', 'bottom-left']).default('top-right'),
    compact: z.boolean().default(false),
    animated: z.boolean().default(true),
  }),
  adaptive: z.object({
    enabled: z.boolean().default(true),
    qualityBasedLoading: z.boolean().default(true),
    fallbackStrategies: z.array(z.string()).default(['reduce-quality', 'increase-timeout', 'disable-animations']),
  }),
});

export type NetworkQualityConfig = z.infer<typeof NetworkQualityConfigSchema>;

export const DEFAULT_NETWORK_QUALITY_CONFIG: NetworkQualityConfig = {
  thresholds: {
    excellent: { rtt: 50, jitter: 10, packetLoss: 0.1 },
    good: { rtt: 100, jitter: 30, packetLoss: 0.5 },
    fair: { rtt: 200, jitter: 50, packetLoss: 1 },
    poor: { rtt: 500, jitter: 100, packetLoss: 3 },
  },
  monitoring: {
    interval: 5000,
    sampleSize: 10,
    timeout: 10000,
    retries: 3,
  },
  ui: {
    showDetails: true,
    showHistory: false,
    position: 'top-right',
    compact: false,
    animated: true,
  },
  adaptive: {
    enabled: true,
    qualityBasedLoading: true,
    fallbackStrategies: ['reduce-quality', 'increase-timeout', 'disable-animations'],
  },
};

export function getNetworkQualityFromMetrics(
  metrics: NetworkMetrics,
  thresholds: NetworkQualityConfig['thresholds']
): NetworkQualityLevel {
  if (metrics.rtt === -1 || metrics.packetLoss === 100) {
    return 'offline';
  }

  if (
    metrics.rtt <= thresholds.excellent.rtt &&
    metrics.jitter <= thresholds.excellent.jitter &&
    metrics.packetLoss <= thresholds.excellent.packetLoss
  ) {
    return 'excellent';
  }

  if (
    metrics.rtt <= thresholds.good.rtt &&
    metrics.jitter <= thresholds.good.jitter &&
    metrics.packetLoss <= thresholds.good.packetLoss
  ) {
    return 'good';
  }

  if (
    metrics.rtt <= thresholds.fair.rtt &&
    metrics.jitter <= thresholds.fair.jitter &&
    metrics.packetLoss <= thresholds.fair.packetLoss
  ) {
    return 'fair';
  }

  return 'poor';
}

export const NetworkQualityUtils = {
  isQualitySufficient: (quality: NetworkQualityLevel, requiredLevel: NetworkQualityLevel = 'fair'): boolean => {
    const levels: NetworkQualityLevel[] = ['excellent', 'good', 'fair', 'poor', 'offline'];
    return levels.indexOf(quality) <= levels.indexOf(requiredLevel) && quality !== 'offline';
  },

  getRecommendedTimeout: (quality: NetworkQualityLevel): number => {
    const timeouts: Record<NetworkQualityLevel, number> = {
      excellent: 5000,
      good: 10000,
      fair: 15000,
      poor: 30000,
      offline: 60000,
    };

    return timeouts[quality];
  },

  getRecommendedMediaQuality: (quality: NetworkQualityLevel): string => {
    const mediaQualities: Record<NetworkQualityLevel, string> = {
      excellent: 'high',
      good: 'medium',
      fair: 'low',
      poor: 'very-low',
      offline: 'offline',
    };

    return mediaQualities[quality];
  },

  shouldEnableAdaptiveLoading: (quality: NetworkQualityLevel): boolean => {
    return quality === 'poor' || quality === 'fair';
  },
};

export function mergeNetworkQualityConfig(partial?: Partial<NetworkQualityConfig>): NetworkQualityConfig {
  if (!partial) {
    return DEFAULT_NETWORK_QUALITY_CONFIG;
  }

  return {
    thresholds: {
      excellent: { ...DEFAULT_NETWORK_QUALITY_CONFIG.thresholds.excellent, ...(partial.thresholds?.excellent ?? {}) },
      good: { ...DEFAULT_NETWORK_QUALITY_CONFIG.thresholds.good, ...(partial.thresholds?.good ?? {}) },
      fair: { ...DEFAULT_NETWORK_QUALITY_CONFIG.thresholds.fair, ...(partial.thresholds?.fair ?? {}) },
      poor: { ...DEFAULT_NETWORK_QUALITY_CONFIG.thresholds.poor, ...(partial.thresholds?.poor ?? {}) },
    },
    monitoring: {
      ...DEFAULT_NETWORK_QUALITY_CONFIG.monitoring,
      ...(partial.monitoring ?? {}),
    },
    ui: {
      ...DEFAULT_NETWORK_QUALITY_CONFIG.ui,
      ...(partial.ui ?? {}),
    },
    adaptive: {
      ...DEFAULT_NETWORK_QUALITY_CONFIG.adaptive,
      ...(partial.adaptive ?? {}),
      fallbackStrategies: partial.adaptive?.fallbackStrategies ?? DEFAULT_NETWORK_QUALITY_CONFIG.adaptive.fallbackStrategies,
    },
  };
}
