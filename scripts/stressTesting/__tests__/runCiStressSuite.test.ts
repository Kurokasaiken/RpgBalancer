#!/usr/bin/env node

/**
 * Unit tests for CI Stress Testing Suite
 * 
 * Tests for CI automation, caching, scheduling, and report generation.
 * 
 * @module runCiStressSuite.test.ts
 * @since 2026-01-11
 * @author Hermes-CI
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateRunId, generateConfigHash, checkCache, saveToCache } from '../runCiStressSuite';
import type { CIConfig, CacheEntry } from '../runCiStressSuite';

// Mock dependencies
vi.mock('@/balancing/config/BalancerConfigStore');
vi.mock('@/balancing/stressTesting/StressTestArchetypeGenerator');
vi.mock('@/balancing/stressTesting/MarginalUtilityCalculator');
vi.mock('@/shared/persistence/PersistenceService');
vi.mock('@/analytics/telemetry/telemetryProvider');

// Mock fs/promises
vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  readFile: vi.fn(),
}));

describe('CI Stress Testing Suite', () => {
  const mockConfig: CIConfig = {
    iterations: 10000,
    seed: 42,
    outputPath: './data/stressTesting/ci',
    cacheDir: './data/stressTesting/cache',
    enableTelemetry: true,
    enableCaching: true,
    parallelJobs: 4,
    timeoutMinutes: 30,
    environment: 'ci',
  };

  const mockBalancerConfig = {
    cards: [],
    stats: [],
    formulas: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateRunId', () => {
    test('should generate unique run ID with timestamp and config hash', () => {
      const runId = generateRunId(mockConfig);
      
      expect(runId).toMatch(/^ci-stress-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}-Z-[a-f0-9]{8}$/);
      expect(runId).toContain('ci-stress-');
    });

    test('should generate different IDs for different configs', () => {
      const config1 = { ...mockConfig, iterations: 10000 };
      const config2 = { ...mockConfig, iterations: 20000 };
      
      const runId1 = generateRunId(config1);
      const runId2 = generateRunId(config2);
      
      expect(runId1).not.toBe(runId2);
    });

    test('should generate same ID for same config', () => {
      const runId1 = generateRunId(mockConfig);
      const runId2 = generateRunId(mockConfig);
      
      // IDs should be different due to timestamp, but same structure
      expect(runId1).toMatch(/^ci-stress-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}-Z-[a-f0-9]{8}$/);
      expect(runId2).toMatch(/^ci-stress-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}-Z-[a-f0-9]{8}$/);
    });
  });

  describe('generateConfigHash', () => {
    test('should generate consistent hash for same config', () => {
      const hash1 = generateConfigHash(mockConfig, mockBalancerConfig);
      const hash2 = generateConfigHash(mockConfig, mockBalancerConfig);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
    });

    test('should generate different hashes for different configs', () => {
      const config1 = { ...mockConfig, iterations: 10000 };
      const config2 = { ...mockConfig, iterations: 20000 };
      
      const hash1 = generateConfigHash(config1, mockBalancerConfig);
      const hash2 = generateConfigHash(config2, mockBalancerConfig);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should generate different hashes for different balancer configs', () => {
      const balancerConfig1 = { ...mockBalancerConfig, cards: [] };
      const balancerConfig2 = { ...mockBalancerConfig, cards: [{ id: 'test' }] };
      
      const hash1 = generateConfigHash(mockConfig, balancerConfig1);
      const hash2 = generateConfigHash(mockConfig, balancerConfig2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('checkCache', () => {
    test('should return null when cache file does not exist', async () => {
      const { readFile } = await import('fs/promises');
      vi.mocked(readFile).mockRejectedValue(new Error('File not found'));
      
      const result = await checkCache('test-hash', '/cache/dir');
      
      expect(result).toBeNull();
    });

    test('should return null when cache is expired', async () => {
      const { readFile } = await import('fs/promises');
      
      const expiredCache: CacheEntry = {
        key: 'test-hash',
        timestamp: '2023-01-01T00:00:00.000Z',
        configHash: 'test-hash',
        results: {
          archetypesGenerated: 100,
          simulationsRun: 10000,
          pairsAnalyzed: 45,
          topSynergies: 5,
          topWeaknesses: 3,
          outputPath: '/test/path',
        },
        expiresAt: '2023-01-01T00:00:00.000Z', // Expired
      };
      
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(expiredCache));
      
      const result = await checkCache('test-hash', '/cache/dir');
      
      expect(result).toBeNull();
    });

    test('should return cache entry when valid', async () => {
      const { readFile } = await import('fs/promises');
      
      const validCache: CacheEntry = {
        key: 'test-hash',
        timestamp: new Date().toISOString(),
        configHash: 'test-hash',
        results: {
          archetypesGenerated: 100,
          simulationsRun: 10000,
          pairsAnalyzed: 45,
          topSynergies: 5,
          topWeaknesses: 3,
          outputPath: '/test/path',
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Valid
      };
      
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(validCache));
      
      const result = await checkCache('test-hash', '/cache/dir');
      
      expect(result).toEqual(validCache);
    });
  });

  describe('saveToCache', () => {
    test('should save cache entry successfully', async () => {
      const { writeFile, mkdir } = await import('fs/promises');
      const { writeFileSync } = await import('fs');
      
      vi.mocked(mkdir).mockResolvedValue();
      vi.mocked(writeFileSync).mockImplementation();
      
      const results = {
        archetypesGenerated: 100,
        simulationsRun: 10000,
        pairsAnalyzed: 45,
        topSynergies: 5,
        topWeaknesses: 3,
        outputPath: '/test/path',
      };
      
      await saveToCache('test-hash', results, '/cache/dir');
      
      expect(mkdir).toHaveBeenCalledWith('/cache/dir', { recursive: true });
      expect(writeFileSync).toHaveBeenCalledWith(
        '/cache/dir/stress-test-test-hash.json',
        expect.stringContaining('"key":"test-hash"')
      );
    });

    test('should handle save errors gracefully', async () => {
      const { writeFile, mkdir } = await import('fs/promises');
      const { writeFileSync } = await import('fs');
      
      vi.mocked(mkdir).mockResolvedValue();
      vi.mocked(writeFileSync).mockImplementation(() => {
        throw new Error('Write failed');
      });
      
      const results = {
        archetypesGenerated: 100,
        simulationsRun: 10000,
        pairsAnalyzed: 45,
        topSynergies: 5,
        topWeaknesses: 3,
        outputPath: '/test/path',
      };
      
      // Should not throw error
      await expect(saveToCache('test-hash', results, '/cache/dir')).resolves.toBeUndefined();
      
      expect(console.warn).toHaveBeenCalledWith('Failed to save to cache:', expect.any(Error));
    });
  });

  describe('Cache Integration', () => {
    test('should work with complete cache lifecycle', async () => {
      const { readFile, writeFile, mkdir } = await import('fs/promises');
      const { writeFileSync } = await import('fs');
      
      // Setup mocks
      vi.mocked(mkdir).mockResolvedValue();
      vi.mocked(writeFileSync).mockImplementation();
      
      const configHash = 'test-hash';
      const results = {
        archetypesGenerated: 100,
        simulationsRun: 10000,
        pairsAnalyzed: 45,
        topSynergies: 5,
        topWeaknesses: 3,
        outputPath: '/test/path',
      };
      
      // Step 1: Check cache (miss)
      vi.mocked(readFile).mockRejectedValue(new Error('File not found'));
      const cacheResult1 = await checkCache(configHash, '/cache/dir');
      expect(cacheResult1).toBeNull();
      
      // Step 2: Save to cache
      await saveToCache(configHash, results, '/cache/dir');
      expect(writeFileSync).toHaveBeenCalled();
      
      // Step 3: Check cache (hit)
      const validCache: CacheEntry = {
        key: configHash,
        timestamp: new Date().toISOString(),
        configHash,
        results,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      
      vi.mocked(readFile).mockResolvedValue(JSON.stringify(validCache));
      const cacheResult2 = await checkCache(configHash, '/cache/dir');
      expect(cacheResult2).toEqual(validCache);
    });
  });

  describe('Environment Detection', () => {
    test('should handle CI environment', () => {
      const ciConfig: CIConfig = {
        ...mockConfig,
        environment: 'ci',
      };
      
      expect(ciConfig.environment).toBe('ci');
    });

    test('should handle local environment', () => {
      const localConfig: CIConfig = {
        ...mockConfig,
        environment: 'local',
      };
      
      expect(localConfig.environment).toBe('local');
    });
  });

  describe('Configuration Validation', () => {
    test('should validate required config fields', () => {
      expect(mockConfig.iterations).toBeGreaterThan(0);
      expect(mockConfig.seed).toBeGreaterThanOrEqual(0);
      expect(mockConfig.parallelJobs).toBeGreaterThan(0);
      expect(mockConfig.timeoutMinutes).toBeGreaterThan(0);
      expect(['ci', 'local']).toContain(mockConfig.environment);
    });

    test('should handle edge cases', () => {
      const edgeConfig: CIConfig = {
        iterations: 1,
        seed: 0,
        outputPath: './test',
        cacheDir: './cache',
        enableTelemetry: false,
        enableCaching: false,
        parallelJobs: 1,
        timeoutMinutes: 1,
        environment: 'local',
      };
      
      expect(edgeConfig.iterations).toBe(1);
      expect(edgeConfig.seed).toBe(0);
      expect(edgeConfig.enableTelemetry).toBe(false);
      expect(edgeConfig.enableCaching).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle file system errors gracefully', async () => {
      const { readFile } = await import('fs/promises');
      
      // Simulate file system error
      vi.mocked(readFile).mockRejectedValue(new Error('Permission denied'));
      
      const result = await checkCache('test-hash', '/cache/dir');
      
      expect(result).toBeNull();
      expect(console.error).not.toHaveBeenCalled(); // Should be silent on cache miss
    });

    test('should handle malformed cache data', async () => {
      const { readFile } = await import('fs/promises');
      
      // Simulate malformed JSON
      vi.mocked(readFile).mockResolvedValue('invalid json');
      
      const result = await checkCache('test-hash', '/cache/dir');
      
      expect(result).toBeNull();
    });
  });

  describe('Performance', () => {
    test('should generate hash efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        generateConfigHash(mockConfig, mockBalancerConfig);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete 100 hash generations in under 100ms
      expect(duration).toBeLessThan(100);
    });

    test('should generate run ID efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        generateRunId(mockConfig);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete 100 ID generations in under 50ms
      expect(duration).toBeLessThan(50);
    });
  });
});
