/**
 * NP-258 – Playtest Live Bug Snapshotter configuration
 *
 * Config-first settings for capturing canvas snapshots + recent logs during
 * mobile playtests. Keeps alignment with existing PlaytestLogger defaults.
 */

import { z } from 'zod';

export const SnapshotWatermarkSchema = z.object({
  text: z.string().default('Playtest Snapshot'),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).default('bottom-right'),
  opacity: z.number().min(0).max(1).default(0.65),
});

const DEFAULT_SCREENSHOT_OPTIONS = {
  quality: 0.92,
  format: 'png' as const,
  scale: 2,
  backgroundColor: '#050505',
  padding: 16,
};

const DEFAULT_UPLOAD_RETRY = {
  maxAttempts: 4,
  baseDelayMs: 5000,
  jitterRatio: 0.35,
};

const DEFAULT_UPLOAD_OPTIONS = {
  persistenceKey: 'playtest.liveBugSnapshots',
  maxQueuedSnapshots: 8,
  wifiOnly: true,
  minBatteryPercent: 20,
};

const DEFAULT_THROTTLING = {
  minIntervalMs: 15000,
  cooldownAfterFailureMs: 60000,
};

const DEFAULT_LOGGING = {
  includePerformanceMetrics: true,
  maxConsoleLines: 60,
};

export const LiveSnapshotConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxBufferedEvents: z.number().min(5).max(100).default(25),
  screenshot: z
    .object({
      quality: z.number().min(0.1).max(1).default(DEFAULT_SCREENSHOT_OPTIONS.quality),
      format: z.enum(['png', 'jpeg', 'webp']).default(DEFAULT_SCREENSHOT_OPTIONS.format),
      scale: z.number().min(1).max(3).default(DEFAULT_SCREENSHOT_OPTIONS.scale),
      backgroundColor: z.string().default(DEFAULT_SCREENSHOT_OPTIONS.backgroundColor),
      padding: z.number().min(0).max(64).default(DEFAULT_SCREENSHOT_OPTIONS.padding),
      watermark: SnapshotWatermarkSchema.optional(),
    })
    .default(() => ({ ...DEFAULT_SCREENSHOT_OPTIONS })),
  upload: z
    .object({
      persistenceKey: z.string().default(DEFAULT_UPLOAD_OPTIONS.persistenceKey),
      maxQueuedSnapshots: z.number().min(1).max(50).default(DEFAULT_UPLOAD_OPTIONS.maxQueuedSnapshots),
      wifiOnly: z.boolean().default(DEFAULT_UPLOAD_OPTIONS.wifiOnly),
      minBatteryPercent: z.number().min(0).max(100).default(DEFAULT_UPLOAD_OPTIONS.minBatteryPercent),
      retry: z
        .object({
          maxAttempts: z.number().min(1).max(10).default(DEFAULT_UPLOAD_RETRY.maxAttempts),
          baseDelayMs: z.number().min(1000).max(60000).default(DEFAULT_UPLOAD_RETRY.baseDelayMs),
          jitterRatio: z.number().min(0).max(1).default(DEFAULT_UPLOAD_RETRY.jitterRatio),
        })
        .default(() => ({ ...DEFAULT_UPLOAD_RETRY })),
    })
    .default(() => ({
      ...DEFAULT_UPLOAD_OPTIONS,
      retry: { ...DEFAULT_UPLOAD_RETRY },
    })),
  throttling: z
    .object({
      minIntervalMs: z.number().min(1000).max(600000).default(DEFAULT_THROTTLING.minIntervalMs),
      cooldownAfterFailureMs: z.number().min(1000).max(600000).default(DEFAULT_THROTTLING.cooldownAfterFailureMs),
    })
    .default(() => ({ ...DEFAULT_THROTTLING })),
  logging: z
    .object({
      includePerformanceMetrics: z.boolean().default(DEFAULT_LOGGING.includePerformanceMetrics),
      maxConsoleLines: z.number().min(10).max(200).default(DEFAULT_LOGGING.maxConsoleLines),
    })
    .default(() => ({ ...DEFAULT_LOGGING })),
});

export type LiveSnapshotConfig = z.infer<typeof LiveSnapshotConfigSchema>;

const DEFAULT_LIVE_SNAPSHOT_CONFIG_INPUT = {
  enabled: true,
  maxBufferedEvents: 25,
  screenshot: { ...DEFAULT_SCREENSHOT_OPTIONS },
  upload: {
    ...DEFAULT_UPLOAD_OPTIONS,
    retry: { ...DEFAULT_UPLOAD_RETRY },
  },
  throttling: { ...DEFAULT_THROTTLING },
  logging: { ...DEFAULT_LOGGING },
} as const;

export const DEFAULT_LIVE_SNAPSHOT_CONFIG: LiveSnapshotConfig = LiveSnapshotConfigSchema.parse(
  DEFAULT_LIVE_SNAPSHOT_CONFIG_INPUT,
);
