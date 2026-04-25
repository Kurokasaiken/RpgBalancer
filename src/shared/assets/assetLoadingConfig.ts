/**
 * Asset Loading Configuration
 * 
 * Config-first configuration for lazy loading assets with progressive loading.
 * Defines image quality levels, loading strategies, and cache integration.
 * 
 * @since NP-214 – Character Portrait Lazy Loading
 */

import { z } from 'zod';

/**
 * Image quality level
 */
export type ImageQuality = 'tiny' | 'low' | 'medium' | 'full';

/**
 * Loading strategy
 */
export type LoadingStrategy = 'lazy' | 'eager' | 'progressive';

/**
 * Asset loading configuration
 */
export interface AssetLoadingConfig {
  /** Enable lazy loading */
  enabled: boolean;
  /** Loading strategy */
  strategy: LoadingStrategy;
  /** IntersectionObserver options */
  observer: {
    /** Root margin for triggering load */
    rootMargin: string;
    /** Intersection threshold */
    threshold: number;
  };
  /** Progressive loading settings */
  progressive: {
    /** Enable progressive loading */
    enabled: boolean;
    /** Quality levels to load */
    qualities: ImageQuality[];
    /** Delay between quality upgrades (ms) */
    upgradeDelayMs: number;
    /** Enable blur-up effect */
    enableBlurUp: boolean;
    /** Blur amount for placeholder */
    blurAmount: number;
  };
  /** Preload hints */
  preload: {
    /** Enable preload hints */
    enabled: boolean;
    /** Number of images to preload */
    count: number;
    /** Preload quality level */
    quality: ImageQuality;
  };
  /** Cache integration */
  cache: {
    /** Enable service worker cache */
    enableSWCache: boolean;
    /** Cache strategy */
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    /** Cache TTL in seconds */
    ttlSeconds: number;
  };
  /** Performance */
  performance: {
    /** Maximum concurrent loads */
    maxConcurrent: number;
    /** Timeout for image load (ms) */
    loadTimeoutMs: number;
    /** Enable performance monitoring */
    enableMonitoring: boolean;
  };
  /** Telemetry */
  telemetry: {
    /** Enable telemetry */
    enabled: boolean;
    /** Track load times */
    trackLoadTimes: boolean;
    /** Track quality upgrades */
    trackUpgrades: boolean;
  };
}

/**
 * Image source set
 */
export interface ImageSourceSet {
  /** Tiny placeholder (base64 or very small) */
  tiny?: string;
  /** Low quality version */
  low?: string;
  /** Medium quality version */
  medium?: string;
  /** Full quality version */
  full: string;
  /** Alt text */
  alt: string;
}

/**
 * Zod schemas
 */
export const ImageQualitySchema = z.enum(['tiny', 'low', 'medium', 'full']);

export const LoadingStrategySchema = z.enum(['lazy', 'eager', 'progressive']);

export const AssetLoadingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  strategy: LoadingStrategySchema.default('progressive'),
  observer: z.object({
    rootMargin: z.string().default('50px'),
    threshold: z.number().min(0).max(1).default(0.01),
  }),
  progressive: z.object({
    enabled: z.boolean().default(true),
    qualities: z.array(ImageQualitySchema).default(['tiny', 'low', 'full']),
    upgradeDelayMs: z.number().min(0).max(5000).default(100),
    enableBlurUp: z.boolean().default(true),
    blurAmount: z.number().min(0).max(50).default(20),
  }),
  preload: z.object({
    enabled: z.boolean().default(true),
    count: z.number().min(0).max(10).default(3),
    quality: ImageQualitySchema.default('low'),
  }),
  cache: z.object({
    enableSWCache: z.boolean().default(true),
    strategy: z.enum(['cache-first', 'network-first', 'stale-while-revalidate']).default('cache-first'),
    ttlSeconds: z.number().min(0).max(31536000).default(86400),
  }),
  performance: z.object({
    maxConcurrent: z.number().min(1).max(20).default(6),
    loadTimeoutMs: z.number().min(1000).max(60000).default(10000),
    enableMonitoring: z.boolean().default(true),
  }),
  telemetry: z.object({
    enabled: z.boolean().default(true),
    trackLoadTimes: z.boolean().default(true),
    trackUpgrades: z.boolean().default(true),
  }),
});

export const ImageSourceSetSchema = z.object({
  tiny: z.string().optional(),
  low: z.string().optional(),
  medium: z.string().optional(),
  full: z.string(),
  alt: z.string(),
});

/**
 * Default configuration
 */
export const DEFAULT_ASSET_LOADING_CONFIG: AssetLoadingConfig = {
  enabled: true,
  strategy: 'progressive',
  observer: {
    rootMargin: '50px',
    threshold: 0.01,
  },
  progressive: {
    enabled: true,
    qualities: ['tiny', 'low', 'full'],
    upgradeDelayMs: 100,
    enableBlurUp: true,
    blurAmount: 20,
  },
  preload: {
    enabled: true,
    count: 3,
    quality: 'low',
  },
  cache: {
    enableSWCache: true,
    strategy: 'cache-first',
    ttlSeconds: 86400, // 24 hours
  },
  performance: {
    maxConcurrent: 6,
    loadTimeoutMs: 10000,
    enableMonitoring: true,
  },
  telemetry: {
    enabled: true,
    trackLoadTimes: true,
    trackUpgrades: true,
  },
};

/**
 * Get image URL for quality level
 */
export function getImageUrl(sources: ImageSourceSet, quality: ImageQuality): string {
  switch (quality) {
    case 'tiny':
      return sources.tiny || sources.low || sources.full;
    case 'low':
      return sources.low || sources.medium || sources.full;
    case 'medium':
      return sources.medium || sources.full;
    case 'full':
      return sources.full;
  }
}

/**
 * Generate srcset string
 */
export function generateSrcSet(sources: ImageSourceSet): string {
  const srcset: string[] = [];
  
  if (sources.low) srcset.push(`${sources.low} 400w`);
  if (sources.medium) srcset.push(`${sources.medium} 800w`);
  srcset.push(`${sources.full} 1200w`);
  
  return srcset.join(', ');
}
