/**
 * Config Compression Tests
 * Comprehensive unit tests for balancer config compression
 * 
 * @see NP-190 – Balancer Config Export Compression
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConfigCompression,
  compressConfig,
  decompressConfig,
} from '../../../src/balancing/export/ConfigCompression';
import {
  DEFAULT_COMPRESSION_CONFIG,
  validateCompressionConfig,
  calculateCompressionRatio,
  formatCompressionRatio,
  formatSize,
  type CompressionConfig,
} from '../../../src/balancing/config/compressionConfig';

describe('ConfigCompression', () => {
  let compression: ConfigCompression;

  beforeEach(() => {
    compression = new ConfigCompression();
  });

  describe('Compression', () => {
    it('should compress data with gzip', () => {
      const data = { test: 'data', value: 123, nested: { key: 'value' } };
      const result = compression.compress(data, { algorithm: 'gzip' });

      expect(result.algorithm).toBe('gzip');
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.compressedSize).toBeGreaterThan(0);
      expect(result.checksum).toBeTruthy();
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should compress data with deflate', () => {
      const data = { test: 'data', value: 123 };
      const result = compression.compress(data, { algorithm: 'deflate' });

      expect(result.algorithm).toBe('deflate');
      expect(result.compressedSize).toBeGreaterThan(0);
    });

    it('should handle uncompressed data', () => {
      const data = { test: 'small' };
      const result = compression.compress(data, { algorithm: 'none' });

      expect(result.algorithm).toBe('none');
      expect(result.compressionRatio).toBe(0);
      expect(result.originalSize).toBe(result.compressedSize);
    });

    it('should compress large data efficiently', () => {
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: 'A'.repeat(100),
          stats: { hp: 100, damage: 50, defense: 30 },
        })),
      };

      const result = compression.compress(largeData, { algorithm: 'gzip' });

      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.compressedSize).toBeLessThan(result.originalSize);
    });

    it('should include metadata when enabled', () => {
      const data = { test: 'data' };
      const result = compression.compress(data, { includeMetadata: true });

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.level).toBeDefined();
      expect(result.metadata?.version).toBeDefined();
    });

    it('should generate valid checksum', () => {
      const data = { test: 'data' };
      const result = compression.compress(data);

      expect(result.checksum).toBeTruthy();
      expect(typeof result.checksum).toBe('string');
      expect(result.checksum.length).toBeGreaterThan(0);
    });

    it('should respect compression level', () => {
      const data = { test: 'data'.repeat(100) };
      
      const resultFast = compression.compress(data, { level: 1 });
      const resultBest = compression.compress(data, { level: 9 });

      expect(resultFast.compressedSize).toBeGreaterThanOrEqual(resultBest.compressedSize);
    });

    it('should handle different output formats', () => {
      const data = { test: 'data' };

      const resultBase64 = compression.compress(data, { format: 'base64' });
      const resultBinary = compression.compress(data, { format: 'binary' });

      expect(typeof resultBase64.compressed).toBe('string');
      expect(resultBinary.compressed).toBeInstanceOf(Uint8Array);
    });

    it('should skip compression for small data', () => {
      const config: CompressionConfig = {
        ...DEFAULT_COMPRESSION_CONFIG,
        options: {
          ...DEFAULT_COMPRESSION_CONFIG.options,
          minSizeForCompression: 10000,
        },
      };

      const smallCompression = new ConfigCompression(config);
      const data = { test: 'small' };
      const result = smallCompression.compress(data);

      expect(result.algorithm).toBe('none');
    });

    it('should throw error for disallowed algorithm', () => {
      const config: CompressionConfig = {
        ...DEFAULT_COMPRESSION_CONFIG,
        validation: {
          ...DEFAULT_COMPRESSION_CONFIG.validation,
          allowedAlgorithms: ['none'],
        },
      };

      const restrictedCompression = new ConfigCompression(config);
      const data = { test: 'data' };

      expect(() => {
        restrictedCompression.compress(data, { algorithm: 'gzip' });
      }).toThrow('Algorithm gzip not allowed');
    });

    it('should throw error for oversized data in strict mode', () => {
      const config: CompressionConfig = {
        ...DEFAULT_COMPRESSION_CONFIG,
        validation: {
          ...DEFAULT_COMPRESSION_CONFIG.validation,
          strictMode: true,
          maxSize: 100,
        },
      };

      const strictCompression = new ConfigCompression(config);
      const largeData = { data: 'x'.repeat(1000) };

      expect(() => {
        strictCompression.compress(largeData);
      }).toThrow('exceeds maximum');
    });
  });

  describe('Decompression', () => {
    it('should decompress gzip data', () => {
      const originalData = { test: 'data', value: 123 };
      const compressed = compression.compress(originalData, { algorithm: 'gzip' });
      const decompressed = compression.decompress(compressed);

      expect(decompressed.data).toEqual(originalData);
      expect(decompressed.checksumValid).toBe(true);
      expect(decompressed.algorithm).toBe('gzip');
    });

    it('should decompress deflate data', () => {
      const originalData = { test: 'data', value: 456 };
      const compressed = compression.compress(originalData, { algorithm: 'deflate' });
      const decompressed = compression.decompress(compressed);

      expect(decompressed.data).toEqual(originalData);
      expect(decompressed.checksumValid).toBe(true);
    });

    it('should decompress uncompressed data', () => {
      const originalData = { test: 'small' };
      const compressed = compression.compress(originalData, { algorithm: 'none' });
      const decompressed = compression.decompress(compressed);

      expect(decompressed.data).toEqual(originalData);
      expect(decompressed.checksumValid).toBe(true);
    });

    it('should validate checksum', () => {
      const originalData = { test: 'data' };
      const compressed = compression.compress(originalData);
      
      // Tamper with checksum
      const tamperedCompressed = {
        ...compressed,
        checksum: 'invalid',
      };

      expect(() => {
        compression.decompress(tamperedCompressed, true);
      }).toThrow('Checksum validation failed');
    });

    it('should skip checksum validation when disabled', () => {
      const originalData = { test: 'data' };
      const compressed = compression.compress(originalData);
      
      // Tamper with checksum
      const tamperedCompressed = {
        ...compressed,
        checksum: 'invalid',
      };

      const decompressed = compression.decompress(tamperedCompressed, false);
      expect(decompressed.data).toEqual(originalData);
      expect(decompressed.checksumValid).toBe(false);
    });

    it('should handle large data decompression', () => {
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          stats: { hp: 100, damage: 50 },
        })),
      };

      const compressed = compression.compress(largeData);
      const decompressed = compression.decompress(compressed);

      expect(decompressed.data).toEqual(largeData);
    });

    it('should preserve data types', () => {
      const originalData = {
        string: 'text',
        number: 123,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: 'value' },
      };

      const compressed = compression.compress(originalData);
      const decompressed = compression.decompress(compressed);

      expect(decompressed.data).toEqual(originalData);
    });

    it('should throw error for invalid compressed data', () => {
      const invalidCompressed = {
        compressed: 'invalid-base64',
        originalSize: 100,
        compressedSize: 50,
        compressionRatio: 50,
        algorithm: 'gzip' as const,
        format: 'base64' as const,
        checksum: 'abc',
        timestamp: Date.now(),
      };

      expect(() => {
        compression.decompress(invalidCompressed);
      }).toThrow('Decompression failed');
    });
  });

  describe('Round-trip', () => {
    it('should preserve data through compress/decompress cycle', () => {
      const testCases = [
        { simple: 'data' },
        { number: 123, string: 'test' },
        { nested: { deep: { value: 'test' } } },
        { array: [1, 2, 3, 4, 5] },
        { mixed: { num: 1, str: 'a', arr: [1, 2], obj: { k: 'v' } } },
      ];

      for (const testData of testCases) {
        const compressed = compression.compress(testData);
        const decompressed = compression.decompress(compressed);
        expect(decompressed.data).toEqual(testData);
      }
    });

    it('should work with different algorithms', () => {
      const data = { test: 'data'.repeat(50) };
      const algorithms = ['gzip', 'deflate', 'none'] as const;

      for (const algorithm of algorithms) {
        const compressed = compression.compress(data, { algorithm });
        const decompressed = compression.decompress(compressed);
        expect(decompressed.data).toEqual(data);
      }
    });

    it('should work with different formats', () => {
      const data = { test: 'data'.repeat(50) };
      const formats = ['base64', 'binary'] as const;

      for (const format of formats) {
        const compressed = compression.compress(data, { format });
        const decompressed = compression.decompress(compressed);
        expect(decompressed.data).toEqual(data);
      }
    });
  });

  describe('Auto-detection', () => {
    it('should detect best algorithm for data', () => {
      const data = { test: 'data'.repeat(100) };
      const bestAlgorithm = compression.autoDetectBestAlgorithm(data);

      expect(['gzip', 'deflate', 'none']).toContain(bestAlgorithm);
    });

    it('should return none for small data', () => {
      const smallData = { test: 'x' };
      const bestAlgorithm = compression.autoDetectBestAlgorithm(smallData);

      expect(bestAlgorithm).toBe('none');
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = compression.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.defaultAlgorithm).toBe('gzip');
    });

    it('should update configuration', () => {
      compression.updateConfig({
        defaultAlgorithm: 'deflate',
        defaultLevel: 9,
      });

      const config = compression.getConfig();
      expect(config.defaultAlgorithm).toBe('deflate');
      expect(config.defaultLevel).toBe(9);
    });

    it('should validate configuration', () => {
      const validConfig = validateCompressionConfig(DEFAULT_COMPRESSION_CONFIG);
      expect(validConfig).toBeTruthy();

      const invalidConfig = validateCompressionConfig({ invalid: 'config' });
      expect(invalidConfig).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should calculate compression ratio', () => {
      const ratio = calculateCompressionRatio(1000, 500);
      expect(ratio).toBe(50);

      const noCompression = calculateCompressionRatio(1000, 1000);
      expect(noCompression).toBe(0);

      const zeroSize = calculateCompressionRatio(0, 0);
      expect(zeroSize).toBe(0);
    });

    it('should format compression ratio', () => {
      expect(formatCompressionRatio(50.5)).toBe('50.50%');
      expect(formatCompressionRatio(0)).toBe('0.00%');
      expect(formatCompressionRatio(100)).toBe('100.00%');
    });

    it('should format size', () => {
      expect(formatSize(500)).toBe('500 B');
      expect(formatSize(1024)).toBe('1.00 KB');
      expect(formatSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatSize(1536)).toBe('1.50 KB');
    });
  });

  describe('Standalone Functions', () => {
    it('should compress using standalone function', () => {
      const data = { test: 'data' };
      const result = compressConfig(data);

      expect(result.algorithm).toBeTruthy();
      expect(result.compressedSize).toBeGreaterThan(0);
    });

    it('should decompress using standalone function', () => {
      const data = { test: 'data' };
      const compressed = compressConfig(data);
      const decompressed = decompressConfig(compressed);

      expect(decompressed.data).toEqual(data);
    });
  });

  describe('Performance', () => {
    it('should compress 100 items in reasonable time', () => {
      const data = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
        })),
      };

      const start = performance.now();
      compression.compress(data);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should decompress in reasonable time', () => {
      const data = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
        })),
      };

      const compressed = compression.compress(data);
      
      const start = performance.now();
      compression.decompress(compressed);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
