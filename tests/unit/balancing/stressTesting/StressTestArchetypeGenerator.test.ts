/**
 * Test harness wrapper for StressTestArchetypeGenerator
 * 
 * Provides test utilities and wrapper functions for testing the archetype generator
 * with deterministic behavior and comprehensive validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StressTestArchetypeGenerator, generateStressTestArchetypes } from '../../../../src/balancing/stressTesting/StressTestArchetypeGenerator';
import { BalancerConfigStore } from '../../../../src/balancing/config/BalancerConfigStore';
import type { StressTestArchetype } from '../../../../src/balancing/stressTesting/types';
import type { StressTestGeneratorConfig } from '../../../../src/balancing/config/stressTesting/archetypeSeeds';
import { 
  MOCK_BALANCER_CONFIG, 
  MOCK_BASELINE_ARCHETYPE,
  FIXTURE_UTILS 
} from '../../fixtures/stressTesting/marginalUtilityFixtures';

// Mock BalancerConfigStore
vi.mock('../../../src/balancing/config/BalancerConfigStore', () => ({
  BalancerConfigStore: {
    getInstance: vi.fn(() => ({
      getConfig: vi.fn(() => MOCK_BALANCER_CONFIG),
      validateConfig: vi.fn(() => ({ isValid: true, errors: [] })),
    })),
  },
}));

describe('StressTestArchetypeGenerator Test Harness', () => {
  let generator: StressTestArchetypeGenerator;
  let mockConfig: StressTestGeneratorConfig;

  beforeEach(() => {
    mockConfig = {
      pointsPerWeight: 25,
      seed: 12345,
      includeDerived: false,
      includeHidden: false,
      incompatiblePairs: [
        ['armor', 'speed'], // Defensive + speed
        ['hp', 'damage'],  // Core stats (example)
      ],
    };

    generator = new StressTestArchetypeGenerator(mockConfig);
  });

  describe('Baseline Generation', () => {
    it('should generate baseline archetype correctly', () => {
      const baseline = generator.generateBaseline();
      
      expect(baseline).toMatchObject({
        id: 'baseline',
        name: 'Baseline',
        type: 'baseline',
        testedStats: [],
        pointsPerStat: 0,
        seed: mockConfig.seed,
      });
      
      // Check that baseline stats match config defaults
      expect(baseline.stats.hp).toBe(MOCK_BALANCER_CONFIG.stats.hp.defaultValue);
      expect(baseline.stats.damage).toBe(MOCK_BALANCER_CONFIG.stats.damage.defaultValue);
      expect(baseline.stats.speed).toBe(MOCK_BALANCER_CONFIG.stats.speed.defaultValue);
    });

    it('should generate deterministic baseline', () => {
      const baseline1 = generator.generateBaseline();
      const baseline2 = generator.generateBaseline();
      
      expect(baseline1).toEqual(baseline2);
    });
  });

  describe('Single Stat Archetype Generation', () => {
    it('should generate single stat archetypes for all non-derived stats', () => {
      const singleStats = generator.generateSingleStatArchetypes();
      
      // Should exclude derived stats
      const derivedStatIds = Object.entries(MOCK_BALANCER_CONFIG.stats)
        .filter(([_, stat]) => stat.isDerived)
        .map(([id, _]) => id);
      
      singleStats.forEach(archetype => {
        expect(archetype.testedStats).toHaveLength(1);
        expect(derivedStatIds).not.toContain(archetype.testedStats[0]);
      });
    });

    it('should calculate correct stat boosts', () => {
      const singleStats = generator.generateSingleStatArchetypes();
      
      // Find HP archetype
      const hpArchetype = singleStats.find(a => a.testedStats[0] === 'hp');
      expect(hpArchetype).toBeDefined();
      
      const expectedHpBoost = MOCK_BALANCER_CONFIG.stats.hp.weight * mockConfig.pointsPerWeight;
      expect(hpArchetype!.stats.hp).toBe(
        MOCK_BALANCER_CONFIG.stats.hp.defaultValue + expectedHpBoost
      );
    });

    it('should exclude incompatible pairs from single stats', () => {
      const singleStats = generator.generateSingleStatArchetypes();
      const statIds = singleStats.map(a => a.testedStats[0]);
      
      // Should not include stats that are in incompatible pairs
      mockConfig.incompatiblePairs.forEach(pair => {
        pair.forEach(stat => {
          if (statIds.includes(stat)) {
            // If one stat is included, the other should not be
            const otherStat = pair.find(s => s !== stat);
            expect(statIds).not.toContain(otherStat);
          }
        });
      });
    });

    it('should generate deterministic single stat archetypes', () => {
      const singleStats1 = generator.generateSingleStatArchetypes();
      const singleStats2 = generator.generateSingleStatArchetypes();
      
      expect(singleStats1).toEqual(singleStats2);
    });
  });

  describe('Pair Stat Archetype Generation', () => {
    it('should generate pair stat archetypes for valid combinations', () => {
      const pairStats = generator.generatePairStatArchetypes();
      
      pairStats.forEach(archetype => {
        expect(archetype.testedStats).toHaveLength(2);
        expect(archetype.type).toBe('pair');
      });
    });

    it('should exclude incompatible pairs', () => {
      const pairStats = generator.generatePairStatArchetypes();
      const pairCombinations = pairStats.map(a => a.testedStats.sort());
      
      mockConfig.incompatiblePairs.forEach(incompatiblePair => {
        const sortedIncompatible = incompatiblePair.sort();
        expect(pairCombinations).not.toContainEqual(sortedIncompatible);
      });
    });

    it('should calculate correct boosts for both stats', () => {
      const pairStats = generator.generatePairStatArchetypes();
      
      pairStats.forEach(archetype => {
        const [stat1, stat2] = archetype.testedStats;
        
        const expectedBoost1 = MOCK_BALANCER_CONFIG.stats[stat1].weight * mockConfig.pointsPerWeight;
        const expectedBoost2 = MOCK_BALANCER_CONFIG.stats[stat2].weight * mockConfig.pointsPerWeight;
        
        expect(archetype.stats[stat1]).toBe(
          MOCK_BALANCER_CONFIG.stats[stat1].defaultValue + expectedBoost1
        );
        expect(archetype.stats[stat2]).toBe(
          MOCK_BALANCER_CONFIG.stats[stat2].defaultValue + expectedBoost2
        );
      });
    });

    it('should generate deterministic pair stat archetypes', () => {
      const pairStats1 = generator.generatePairStatArchetypes();
      const pairStats2 = generator.generatePairStatArchetypes();
      
      expect(pairStats1).toEqual(pairStats2);
    });
  });

  describe('Complete Archetype Generation', () => {
    it('should generate all archetype types', () => {
      const allArchetypes = generator.generateAllStressTestArchetypes();
      
      const baselineCount = allArchetypes.filter(a => a.type === 'baseline').length;
      const singleCount = allArchetypes.filter(a => a.type === 'single').length;
      const pairCount = allArchetypes.filter(a => a.type === 'pair').length;
      
      expect(baselineCount).toBe(1);
      expect(singleCount).toBeGreaterThan(0);
      expect(pairCount).toBeGreaterThan(0);
    });

    it('should maintain consistent seed across all archetypes', () => {
      const allArchetypes = generator.generateAllStressTestArchetypes();
      
      allArchetypes.forEach(archetype => {
        expect(archetype.seed).toBe(mockConfig.seed);
      });
    });

    it('should generate deterministic complete set', () => {
      const allArchetypes1 = generator.generateAllStressTestArchetypes();
      const allArchetypes2 = generator.generateAllStressTestArchetypes();
      
      expect(allArchetypes1).toEqual(allArchetypes2);
    });
  });

  describe('Configuration Validation', () => {
    it('should handle empty incompatible pairs', () => {
      const configWithoutPairs = { ...mockConfig, incompatiblePairs: [] };
      const generatorWithoutPairs = new StressTestArchetypeGenerator(configWithoutPairs);
      
      expect(() => generatorWithoutPairs.generatePairStatArchetypes()).not.toThrow();
    });

    it('should handle zero points per weight', () => {
      const configWithZeroPoints = { ...mockConfig, pointsPerWeight: 0 };
      const generatorWithZeroPoints = new StressTestArchetypeGenerator(configWithZeroPoints);
      
      const singleStats = generatorWithZeroPoints.generateSingleStatArchetypes();
      singleStats.forEach(archetype => {
        const statId = archetype.testedStats[0];
        expect(archetype.stats[statId]).toBe(MOCK_BALANCER_CONFIG.stats[statId].defaultValue);
      });
    });

    it('should handle negative seed', () => {
      const configWithNegativeSeed = { ...mockConfig, seed: -1 };
      const generatorWithNegativeSeed = new StressTestArchetypeGenerator(configWithNegativeSeed);
      
      expect(() => generatorWithNegativeSeed.generateBaseline()).not.toThrow();
    });
  });

  describe('Integration with Mock Fixtures', () => {
    it('should work with mock fixture data', () => {
      const allArchetypes = generator.generateAllStressTestArchetypes();
      
      // Verify that generated archetypes match expected structure
      expect(allArchetypes).toContainEqual(
        expect.objectContaining(MOCK_BASELINE_ARCHETYPE)
      );
    });

    it('should validate mock data consistency', () => {
      expect(FIXTURE_UTILS.validateMockData()).toBe(true);
    });

    it('should create custom mock archetypes correctly', () => {
      const customArchetype = FIXTURE_UTILS.createMockArchetype(
        'test-custom',
        'Test Custom',
        { hp: 150, damage: 20 },
        ['hp', 'damage'],
        'pair'
      );
      
      expect(customArchetype).toMatchObject({
        id: 'test-custom',
        name: 'Test Custom',
        testedStats: ['hp', 'damage'],
        type: 'pair',
        pointsPerStat: 25,
        seed: 12345,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid stat IDs gracefully', () => {
      // This test ensures the generator doesn't crash with invalid config
      const configWithInvalidStats = {
        ...mockConfig,
        incompatiblePairs: [['invalid_stat', 'another_invalid']],
      };
      
      const generatorWithInvalid = new StressTestArchetypeGenerator(configWithInvalidStats);
      
      expect(() => generatorWithInvalid.generatePairStatArchetypes()).not.toThrow();
    });

    it('should handle missing config gracefully', () => {
      // Mock missing config
      vi.mocked(BalancerConfigStore.getInstance).mockReturnValue({
        getConfig: vi.fn(() => null),
        validateConfig: vi.fn(() => ({ isValid: false, errors: ['Config missing'] })),
      });
      
      expect(() => new StressTestArchetypeGenerator(mockConfig)).not.toThrow();
    });
  });

  describe('Performance and Scaling', () => {
    it('should handle large number of stats efficiently', () => {
      const startTime = Date.now();
      
      // Generate multiple times to test performance
      for (let i = 0; i < 10; i++) {
        generator.generateAllStressTestArchetypes();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should maintain memory efficiency', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate multiple archetype sets
      const archetypeSets = [];
      for (let i = 0; i < 100; i++) {
        archetypeSets.push(generator.generateAllStressTestArchetypes());
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (adjust threshold as needed)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });
  });
});

/**
 * Integration test harness for complete stress testing pipeline
 */
describe('Stress Testing Pipeline Integration', () => {
  it('should integrate with convenience function', () => {
    const archetypes = generateStressTestArchetypes({
      pointsPerWeight: 25,
      seed: 12345,
      includeDerived: false,
      includeHidden: false,
      incompatiblePairs: [],
    });
    
    expect(archetypes).toHaveLength(1); // Only baseline with no compatible pairs
    expect(archetypes[0].type).toBe('baseline');
  });

  it('should work with real BalancerConfigStore', async () => {
    // This test would require actual BalancerConfigStore integration
    // For now, we test with the mocked version
    const generator = new StressTestArchetypeGenerator({
      pointsPerWeight: 25,
      seed: 12345,
      includeDerived: false,
      includeHidden: false,
      incompatiblePairs: [],
    });
    
    const archetypes = generator.generateAllStressTestArchetypes();
    expect(archetypes.length).toBeGreaterThan(0);
  });
});

/**
 * Export test utilities for other test files
 */
export const STRESS_TEST_TEST_UTILS = {
  /**
   * Create a generator with custom configuration
   */
  createGenerator: (config: Partial<StressTestGeneratorConfig> = {}) => {
    const defaultConfig: StressTestGeneratorConfig = {
      pointsPerWeight: 25,
      seed: 12345,
      includeDerived: false,
      includeHidden: false,
      incompatiblePairs: [],
    };
    
    return new StressTestArchetypeGenerator({ ...defaultConfig, ...config });
  },

  /**
   * Generate a complete set of test archetypes
   */
  generateTestArchetypes: (config?: Partial<StressTestGeneratorConfig>) => {
    const generator = STRESS_TEST_TEST_UTILS.createGenerator(config);
    return generator.generateAllStressTestArchetypes();
  },

  /**
   * Validate archetype structure
   */
  validateArchetype: (archetype: StressTestArchetype) => {
    expect(archetype).toHaveProperty('id');
    expect(archetype).toHaveProperty('name');
    expect(archetype).toHaveProperty('description');
    expect(archetype).toHaveProperty('stats');
    expect(archetype).toHaveProperty('testedStats');
    expect(archetype).toHaveProperty('pointsPerStat');
    expect(archetype).toHaveProperty('seed');
    expect(archetype).toHaveProperty('type');
    
    expect(['baseline', 'single', 'pair']).toContain(archetype.type);
    expect(archetype.seed).toBeGreaterThan(0);
    expect(archetype.pointsPerStat).toBeGreaterThanOrEqual(0);
  },

  /**
   * Compare two archetype arrays for equality
   */
  compareArchetypeArrays: (a1: StressTestArchetype[], a2: StressTestArchetype[]) => {
    expect(a1).toHaveLength(a2.length);
    
    a1.forEach((archetype1, index) => {
      const archetype2 = a2[index];
      expect(archetype1).toEqual(archetype2);
    });
  },
};
