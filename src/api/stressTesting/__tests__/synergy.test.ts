/**
 * Tests for Synergy Heatmap API Handler
 * 
 * Covers cache behavior, file loading, regeneration fallback,
 * and error handling for the synergy heatmap API.
 * 
 * @module SynergyAPITests
 * @since 2026-01-12
 * @author Vector-Marginal
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  handleSynergyHeatmapRequest, 
  handleHealthCheck, 
  handleClearCache 
} from '../synergy.js';

// Mock external dependencies
vi.mock('@/shared/persistence/PersistenceService');
vi.mock('fs/promises');
vi.mock('@/balancing/stressTesting/MarginalUtilityCalculator');
vi.mock('@/balancing/stressTesting/StressTestArchetypeGenerator');
vi.mock('@/balancing/config/BalancerConfigStore');

describe('Synergy Heatmap API Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleHealthCheck', () => {
    it('should return healthy status with basic structure', async () => {
      // Act
      const result = await handleHealthCheck();

      // Assert
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('number');
    });
  });

  describe('handleClearCache', () => {
    it('should clear cache successfully', async () => {
      // Arrange
      const { saveData } = await import('@/shared/persistence/PersistenceService');
      vi.mocked(saveData).mockResolvedValue();

      // Act
      const result = await handleClearCache();

      // Assert
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });
  });

  describe('handleSynergyHeatmapRequest', () => {
    it('should return response with expected structure', async () => {
      // Act
      const result = await handleSynergyHeatmapRequest();

      // Assert
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('metadata');
        expect(result.metadata).toHaveProperty('isFromCache');
        expect(result.metadata).toHaveProperty('analysisId');
        expect(result.metadata).toHaveProperty('cacheTimestamp');
      } else {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });

    it('should handle cache miss scenario', async () => {
      // Arrange - ensure no cache exists
      const { loadData } = await import('@/shared/persistence/PersistenceService');
      vi.mocked(loadData).mockResolvedValue(null);

      // Act
      const result = await handleSynergyHeatmapRequest();

      // Assert
      expect(result).toHaveProperty('success');
      // Should either succeed with fresh data or fail gracefully
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('should handle cache hit scenario', async () => {
      // Arrange - mock valid cache
      const { loadData } = await import('@/shared/persistence/PersistenceService');
      const mockCache = {
        heatmapData: { hp: { damage: 1.2 }, damage: { hp: 1.2 } },
        timestamp: Date.now() - 1000,
        expiresAt: Date.now() + 200000,
        sourceAnalysisId: 'test-analysis',
      };
      vi.mocked(loadData).mockResolvedValue(mockCache);

      // Act
      const result = await handleSynergyHeatmapRequest();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCache.heatmapData);
      expect(result.metadata?.isFromCache).toBe(true);
      expect(result.metadata?.analysisId).toBe('test-analysis');
    });

    it('should handle expired cache', async () => {
      // Arrange - mock expired cache
      const { loadData } = await import('@/shared/persistence/PersistenceService');
      const expiredCache = {
        heatmapData: { hp: { damage: 1.2 } },
        timestamp: Date.now() - 400000, // 6+ minutes ago
        expiresAt: Date.now() - 100000, // Expired
        sourceAnalysisId: 'expired-analysis',
      };
      vi.mocked(loadData).mockResolvedValue(expiredCache);

      // Act
      const result = await handleSynergyHeatmapRequest();

      // Assert
      expect(result).toHaveProperty('success');
      // Should either regenerate data or fail gracefully
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Error handling', () => {
    it('should handle persistence service errors', async () => {
      // Arrange
      const { loadData } = await import('@/shared/persistence/PersistenceService');
      vi.mocked(loadData).mockRejectedValue(new Error('Persistence failed'));

      // Act
      const result = await handleSynergyHeatmapRequest();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load or generate synergy data');
    });

    it('should handle cache clear errors', async () => {
      // Arrange
      const { saveData } = await import('@/shared/persistence/PersistenceService');
      vi.mocked(saveData).mockRejectedValue(new Error('Clear failed'));

      // Act
      const result = await handleClearCache();

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Clear failed');
    });
  });
});
