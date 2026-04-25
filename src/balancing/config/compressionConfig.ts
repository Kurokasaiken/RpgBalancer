/**
 * Balancer Config Compression Configuration
 * Config-first compression settings for balancer export optimization
 * 
 * @see NP-190 – Balancer Config Export Compression
 */

import { z } from 'zod';

// Compression algorithms
export const CompressionAlgorithm = {
  GZIP: 'gzip',
  DEFLATE: 'deflate',
  NONE: 'none',
} as const;

export type CompressionAlgorithm = typeof CompressionAlgorithm[keyof typeof CompressionAlgorithm];

// Compression levels (0-9)
export type CompressionLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// Compression format
export const CompressionFormat = {
  JSON: 'json',
  BASE64: 'base64',
  BINARY: 'binary',
} as const;

export type CompressionFormat = typeof CompressionFormat[keyof typeof CompressionFormat];

// Compression result
export interface CompressionResult {
  compressed: string | Uint8Array;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  algorithm: CompressionAlgorithm;
  format: CompressionFormat;
  checksum: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Decompression result
export interface DecompressionResult<T = unknown> {
  data: T;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  algorithm: CompressionAlgorithm;
  checksumValid: boolean;
  timestamp: number;
}

// Compression options
export interface CompressionOptions {
  algorithm: CompressionAlgorithm;
  level: CompressionLevel;
  format: CompressionFormat;
  includeMetadata: boolean;
  validateChecksum: boolean;
}

// Compression configuration
export interface CompressionConfig {
  enabled: boolean;
  defaultAlgorithm: CompressionAlgorithm;
  defaultLevel: CompressionLevel;
  defaultFormat: CompressionFormat;
  options: {
    includeMetadata: boolean;
    validateChecksum: boolean;
    autoDetectBestAlgorithm: boolean;
    minSizeForCompression: number;
  };
  telemetry: {
    enabled: boolean;
    event: string;
  };
  validation: {
    strictMode: boolean;
    maxSize: number;
    allowedAlgorithms: CompressionAlgorithm[];
  };
}

// Zod schemas
export const CompressionResultSchema = z.object({
  compressed: z.union([z.string(), z.instanceof(Uint8Array)]),
  originalSize: z.number(),
  compressedSize: z.number(),
  compressionRatio: z.number(),
  algorithm: z.enum(['gzip', 'deflate', 'none']),
  format: z.enum(['json', 'base64', 'binary']),
  checksum: z.string(),
  timestamp: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export const DecompressionResultSchema = z.object({
  data: z.unknown(),
  originalSize: z.number(),
  compressedSize: z.number(),
  compressionRatio: z.number(),
  algorithm: z.enum(['gzip', 'deflate', 'none']),
  checksumValid: z.boolean(),
  timestamp: z.number(),
});

export const CompressionConfigSchema = z.object({
  enabled: z.boolean(),
  defaultAlgorithm: z.enum(['gzip', 'deflate', 'none']),
  defaultLevel: z.number().min(0).max(9),
  defaultFormat: z.enum(['json', 'base64', 'binary']),
  options: z.object({
    includeMetadata: z.boolean(),
    validateChecksum: z.boolean(),
    autoDetectBestAlgorithm: z.boolean(),
    minSizeForCompression: z.number(),
  }),
  telemetry: z.object({
    enabled: z.boolean(),
    event: z.string(),
  }),
  validation: z.object({
    strictMode: z.boolean(),
    maxSize: z.number(),
    allowedAlgorithms: z.array(z.enum(['gzip', 'deflate', 'none'])),
  }),
});

// Default configuration
export const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
  enabled: true,
  defaultAlgorithm: 'gzip',
  defaultLevel: 5 as CompressionLevel,
  defaultFormat: 'base64',
  options: {
    includeMetadata: true,
    validateChecksum: true,
    autoDetectBestAlgorithm: false,
    minSizeForCompression: 1024,
  },
  telemetry: {
    enabled: true,
    event: 'balancer_config_compressed',
  },
  validation: {
    strictMode: true,
    maxSize: 10 * 1024 * 1024,
    allowedAlgorithms: ['gzip', 'deflate', 'none'],
  },
};

// Utility functions
export function validateCompressionConfig(config: unknown): CompressionConfig | null {
  const result = CompressionConfigSchema.safeParse(config);
  return result.success ? result.data : null;
}

export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0;
  return ((originalSize - compressedSize) / originalSize) * 100;
}

export function formatCompressionRatio(ratio: number): string {
  return `${ratio.toFixed(2)}%`;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
