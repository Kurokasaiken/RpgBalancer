/**
 * Playwright Coverage Reporter Tests – NP-123
 * 
 * Unit tests for the Playwright test coverage reporter system.
 * 
 * @since NP-123
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getComponentCategory,
  isCriticalPath,
  isUserFacing,
  calculatePriorityScore,
  getPriorityLevel,
  suggestTestTypes,
  DEFAULT_PRIORITY_WEIGHTS,
} from '@/analytics/testing/coverageReportConfig';

describe('Coverage Config Utilities', () => {
  describe('getComponentCategory', () => {
    it('should identify page components', () => {
      expect(getComponentCategory('src/ui/landing/MoodboardLanding.tsx')).toBe('page');
      expect(getComponentCategory('src/ui/balancing/BalancerPage.tsx')).toBe('page');
    });

    it('should identify component files', () => {
      expect(getComponentCategory('src/ui/components/Button.tsx')).toBe('component');
      expect(getComponentCategory('src/ui/idleVillage/components/LocationCard.tsx')).toBe('component');
    });

    it('should identify hooks', () => {
      expect(getComponentCategory('src/ui/hooks/useBalancerConfig.ts')).toBe('hook');
      expect(getComponentCategory('src/ui/idleVillage/hooks/useCrewScheduler.ts')).toBe('hook');
    });

    it('should identify utilities', () => {
      expect(getComponentCategory('src/shared/utils/formatters.ts')).toBe('utility');
      expect(getComponentCategory('src/ui/helpers/dragHelper.ts')).toBe('utility');
    });

    it('should identify services', () => {
      expect(getComponentCategory('src/shared/persistence/PersistenceService.ts')).toBe('service');
      expect(getComponentCategory('src/balancing/MonteCarloEngine.ts')).toBe('service');
    });

    it('should identify config files', () => {
      expect(getComponentCategory('src/balancing/config/balancerConfig.ts')).toBe('config');
      expect(getComponentCategory('src/ui/config/themeConfig.ts')).toBe('config');
    });

    it('should default to utility for unknown patterns', () => {
      expect(getComponentCategory('src/unknown/file.ts')).toBe('utility');
    });
  });

  describe('isCriticalPath', () => {
    it('should identify critical path components', () => {
      expect(isCriticalPath('src/shared/persistence/PersistenceService.ts')).toBe(true);
      expect(isCriticalPath('src/balancing/config/BalancerConfigStore.ts')).toBe(true);
      expect(isCriticalPath('src/ui/idleVillage/controllers/CrewScheduler.ts')).toBe(true);
      expect(isCriticalPath('src/ui/idleVillage/hooks/useDragController.ts')).toBe(true);
    });

    it('should return false for non-critical components', () => {
      expect(isCriticalPath('src/ui/components/Button.tsx')).toBe(false);
      expect(isCriticalPath('src/shared/utils/formatters.ts')).toBe(false);
    });
  });

  describe('isUserFacing', () => {
    it('should identify user-facing components', () => {
      expect(isUserFacing('src/ui/components/Dashboard.tsx')).toBe(true);
      expect(isUserFacing('src/ui/balancing/ConfigPanel.tsx')).toBe(true);
      expect(isUserFacing('src/ui/idleVillage/components/LocationCard.tsx')).toBe(true);
      expect(isUserFacing('src/ui/punchClub/PunchClubLanding.tsx')).toBe(true);
    });

    it('should return false for non-user-facing components', () => {
      expect(isUserFacing('src/balancing/config/balancerConfig.ts')).toBe(false);
      expect(isUserFacing('src/shared/utils/formatters.ts')).toBe(false);
    });
  });

  describe('calculatePriorityScore', () => {
    it('should calculate high score for critical, complex components', () => {
      const score = calculatePriorityScore(
        'src/shared/persistence/PersistenceService.ts',
        200, // high complexity
        10, // many dependencies
        5, // recently modified
        DEFAULT_PRIORITY_WEIGHTS
      );
      expect(score).toBeGreaterThan(70);
    });

    it('should calculate low score for simple utilities', () => {
      const score = calculatePriorityScore(
        'src/shared/utils/formatters.ts',
        20, // low complexity
        2, // few dependencies
        100, // old file
        DEFAULT_PRIORITY_WEIGHTS
      );
      expect(score).toBeLessThan(30);
    });

    it('should weight user-facing components higher', () => {
      const userFacingScore = calculatePriorityScore(
        'src/ui/components/Dashboard.tsx',
        100,
        5,
        10,
        DEFAULT_PRIORITY_WEIGHTS
      );
      const nonUserFacingScore = calculatePriorityScore(
        'src/balancing/config/config.ts',
        100,
        5,
        10,
        DEFAULT_PRIORITY_WEIGHTS
      );
      expect(userFacingScore).toBeGreaterThan(nonUserFacingScore);
    });

    it('should weight critical path components higher', () => {
      const criticalScore = calculatePriorityScore(
        'src/shared/persistence/PersistenceService.ts',
        100,
        5,
        10,
        DEFAULT_PRIORITY_WEIGHTS
      );
      const nonCriticalScore = calculatePriorityScore(
        'src/shared/utils/helper.ts',
        100,
        5,
        10,
        DEFAULT_PRIORITY_WEIGHTS
      );
      expect(criticalScore).toBeGreaterThan(nonCriticalScore);
    });

    it('should return score between 0 and 100', () => {
      const score = calculatePriorityScore(
        'src/test.ts',
        1000,
        100,
        1,
        DEFAULT_PRIORITY_WEIGHTS
      );
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getPriorityLevel', () => {
    it('should return critical for scores >= 75', () => {
      expect(getPriorityLevel(75)).toBe('critical');
      expect(getPriorityLevel(90)).toBe('critical');
      expect(getPriorityLevel(100)).toBe('critical');
    });

    it('should return high for scores >= 50', () => {
      expect(getPriorityLevel(50)).toBe('high');
      expect(getPriorityLevel(60)).toBe('high');
      expect(getPriorityLevel(74)).toBe('high');
    });

    it('should return medium for scores >= 25', () => {
      expect(getPriorityLevel(25)).toBe('medium');
      expect(getPriorityLevel(35)).toBe('medium');
      expect(getPriorityLevel(49)).toBe('medium');
    });

    it('should return low for scores < 25', () => {
      expect(getPriorityLevel(0)).toBe('low');
      expect(getPriorityLevel(10)).toBe('low');
      expect(getPriorityLevel(24)).toBe('low');
    });
  });

  describe('suggestTestTypes', () => {
    it('should suggest e2e, visual, accessibility for pages', () => {
      const suggestions = suggestTestTypes('page', true, false);
      expect(suggestions).toContain('e2e');
      expect(suggestions).toContain('visual');
      expect(suggestions).toContain('accessibility');
    });

    it('should suggest integration, visual for components', () => {
      const suggestions = suggestTestTypes('component', false, false);
      expect(suggestions).toContain('integration');
      expect(suggestions).toContain('visual');
    });

    it('should suggest accessibility for user-facing components', () => {
      const suggestions = suggestTestTypes('component', true, false);
      expect(suggestions).toContain('accessibility');
    });

    it('should suggest unit, integration for hooks', () => {
      const suggestions = suggestTestTypes('hook', false, false);
      expect(suggestions).toContain('unit');
      expect(suggestions).toContain('integration');
    });

    it('should suggest unit for utilities', () => {
      const suggestions = suggestTestTypes('utility', false, false);
      expect(suggestions).toContain('unit');
    });

    it('should suggest smoke for critical components', () => {
      const suggestions = suggestTestTypes('service', false, true);
      expect(suggestions).toContain('smoke');
    });

    it('should not have duplicate suggestions', () => {
      const suggestions = suggestTestTypes('page', true, true);
      const unique = new Set(suggestions);
      expect(suggestions.length).toBe(unique.size);
    });
  });
});

describe('Coverage Report Schema Validation', () => {
  it('should validate valid coverage report', () => {
    const { validateCoverageReport } = require('@/analytics/testing/coverageReportConfig');
    
    const validReport = {
      timestamp: Date.now(),
      stats: {
        totalComponents: 100,
        testedComponents: 70,
        untestedComponents: 30,
        coveragePercentage: 70,
        byCategory: {
          page: { total: 10, tested: 8, coverage: 80 },
          component: { total: 50, tested: 35, coverage: 70 },
        },
        byTestType: {
          e2e: { testCount: 20, componentsCovered: 30 },
          unit: { testCount: 50, componentsCovered: 40 },
        },
      },
      tests: [
        {
          testPath: 'tests/example.spec.ts',
          testType: 'e2e',
          coveredComponents: ['src/ui/Page.tsx'],
          testCount: 5,
          lastModified: Date.now(),
        },
      ],
      gaps: [
        {
          componentPath: 'src/ui/Untested.tsx',
          category: 'component',
          priority: 'high',
          priorityScore: 75,
          reason: 'User-facing component',
          suggestedTests: ['e2e', 'visual'],
          relatedComponents: [],
        },
      ],
      recommendations: [
        {
          priority: 'critical',
          components: ['src/ui/Critical.tsx'],
          reason: 'Critical path components',
          estimatedEffort: '4h',
        },
      ],
    };

    expect(() => validateCoverageReport(validReport)).not.toThrow();
  });

  it('should reject invalid coverage report', () => {
    const { validateCoverageReport } = require('@/analytics/testing/coverageReportConfig');
    
    const invalidReport = {
      timestamp: 'invalid',
      stats: {},
    };

    expect(() => validateCoverageReport(invalidReport)).toThrow();
  });
});

describe('Priority Scoring Edge Cases', () => {
  it('should handle zero complexity', () => {
    const score = calculatePriorityScore(
      'src/test.ts',
      0,
      0,
      0,
      DEFAULT_PRIORITY_WEIGHTS
    );
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should handle very high values', () => {
    const score = calculatePriorityScore(
      'src/test.ts',
      10000,
      1000,
      1000,
      DEFAULT_PRIORITY_WEIGHTS
    );
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should handle custom weights', () => {
    const customWeights = {
      complexity: 0.5,
      userFacing: 0.5,
      criticalPath: 0,
      recentChanges: 0,
      dependencies: 0,
    };
    const score = calculatePriorityScore(
      'src/test.ts',
      100,
      5,
      10,
      customWeights
    );
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
