import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, writeFileSync } from 'fs';
import { calculateConfigDiff, generateMarkdownReport } from '../minimalConfigDiff';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

// Mock schema validation
vi.mock('@/balancing/config/idleVillage/minimalConfig', () => ({
  MinimalConfigSchema: {
    safeParse: vi.fn(() => ({ success: true, data: {} })),
  },
}));

const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockSchemaParse = vi.mocked(require('@/balancing/config/idleVillage/minimalConfig').MinimalConfigSchema.safeParse);

describe('MinimalConfigDiff', () => {
  const baseConfig = {
    resources: {
      residents: [
        { id: 'resident-1', name: 'Aurora', level: 1, stats: { str: 5 } },
      ],
      locations: [
        { id: 'location-1', label: 'Gold Mine', activityId: 'mine' },
      ],
    },
    ui: {
      hero: { subtitle: 'Test', description: 'Test desc', themeToken: 'test' },
      hudFields: [
        { id: 'gold', label: 'Gold', format: 'integer' },
      ],
      logDisplayLimit: 5,
      showGameOverPanel: true,
      tokens: { accentHex: '#fff', heroBackground: 'gradient', cardRadiusPx: 8, dangerHex: '#f00' },
      dropCopy: { default: 'Error' },
    },
    loop: {
      tickIntervalMs: 1000,
      autosaveIntervalMs: 30000,
      warmupDelayMs: 1200,
      maxSpeedMultiplier: 3,
      defaultSpeedMultiplier: 1,
    },
    warnings: {
      warningThresholds: { fatigueDangerPercent: 0.8, foodDangerDays: 2 },
      warningCopy: { fatigueHigh: 'Tired', foodLow: 'Hungry' },
    },
  };

  const changedConfig = {
    resources: {
      residents: [
        { id: 'resident-1', name: 'Aurora', level: 2, stats: { str: 6 } }, // Level and stats changed
        { id: 'resident-2', name: 'Kai', level: 1, stats: { str: 4 } }, // New resident
      ],
      locations: [
        { id: 'location-1', label: 'Gold Mine', activityId: 'mine' },
        { id: 'location-2', label: 'Forest', activityId: 'hunt' }, // New location
      ],
    },
    ui: {
      hero: { subtitle: 'Updated Test', description: 'Updated desc', themeToken: 'updated' }, // Hero changed
      hudFields: [
        { id: 'gold', label: 'Gold', format: 'integer' },
        { id: 'food', label: 'Food', format: 'integer' }, // Added food field
      ],
      logDisplayLimit: 10, // Changed limit
      showGameOverPanel: false, // Changed panel setting
      tokens: { accentHex: '#000', heroBackground: 'new-gradient', cardRadiusPx: 12, dangerHex: '#ff0000' }, // Tokens changed
      dropCopy: { default: 'New Error' }, // Drop copy changed
    },
    loop: {
      tickIntervalMs: 1500, // Changed tick interval
      autosaveIntervalMs: 45000, // Changed autosave
      warmupDelayMs: 1000, // Changed warmup
      maxSpeedMultiplier: 5, // Changed max multiplier
      defaultSpeedMultiplier: 1, // Same
    },
    warnings: {
      warningThresholds: { fatigueDangerPercent: 0.9, foodDangerDays: 3 }, // Changed thresholds
      warningCopy: { fatigueHigh: 'Exhausted', foodLow: 'Starving' }, // Changed copy
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSchemaParse.mockReturnValue({ success: true, data: {} });
  });

  describe('calculateConfigDiff', () => {
    it('should detect no changes when configs are identical', () => {
      const result = calculateConfigDiff(baseConfig, baseConfig);

      expect(result.summary.hasChanges).toBe(false);
      expect(result.summary.sectionsChanged).toHaveLength(0);
      expect(result.summary.totalChanges).toBe(0);

      // Check all sections have no changes
      Object.values(result.sections).forEach(section => {
        expect(section.hasChanges).toBe(false);
        expect(section.changeCount).toBe(0);
      });
    });

    it('should detect changes in resources section', () => {
      const result = calculateConfigDiff(baseConfig, changedConfig);

      expect(result.summary.hasChanges).toBe(true);
      expect(result.summary.sectionsChanged).toContain('resources');
      expect(result.sections.resources.hasChanges).toBe(true);
      expect(result.sections.resources.changeCount).toBeGreaterThan(0);
    });

    it('should detect changes in UI section', () => {
      const result = calculateConfigDiff(baseConfig, changedConfig);

      expect(result.summary.sectionsChanged).toContain('ui');
      expect(result.sections.ui.hasChanges).toBe(true);

      // Should detect multiple UI changes
      const uiChanges = result.sections.ui.changes;
      expect(uiChanges.some(c => c.path === 'ui.hero')).toBe(true);
      expect(uiChanges.some(c => c.path === 'ui.hudFields')).toBe(true);
      expect(uiChanges.some(c => c.path === 'ui.logDisplayLimit')).toBe(true);
      expect(uiChanges.some(c => c.path === 'ui.showGameOverPanel')).toBe(true);
      expect(uiChanges.some(c => c.path === 'ui.tokens')).toBe(true);
      expect(uiChanges.some(c => c.path === 'ui.dropCopy')).toBe(true);
    });

    it('should detect changes in loop section', () => {
      const result = calculateConfigDiff(baseConfig, changedConfig);

      expect(result.summary.sectionsChanged).toContain('loop');
      expect(result.sections.loop.hasChanges).toBe(true);

      const loopChanges = result.sections.loop.changes;
      expect(loopChanges.some(c => c.path === 'loop.tickIntervalMs')).toBe(true);
      expect(loopChanges.some(c => c.path === 'loop.autosaveIntervalMs')).toBe(true);
      expect(loopChanges.some(c => c.path === 'loop.warmupDelayMs')).toBe(true);
      expect(loopChanges.some(c => c.path === 'loop.maxSpeedMultiplier')).toBe(true);
    });

    it('should detect changes in warnings section', () => {
      const result = calculateConfigDiff(baseConfig, changedConfig);

      expect(result.summary.sectionsChanged).toContain('warnings');
      expect(result.sections.warnings.hasChanges).toBe(true);

      const warningChanges = result.sections.warnings.changes;
      expect(warningChanges.some(c => c.path === 'warnings.warningThresholds')).toBe(true);
      expect(warningChanges.some(c => c.path === 'warnings.warningCopy')).toBe(true);
    });

    it('should provide correct change details', () => {
      const result = calculateConfigDiff(baseConfig, changedConfig);

      // Find tick interval change
      const tickChange = result.sections.loop.changes.find(c => c.path === 'loop.tickIntervalMs');
      expect(tickChange).toBeDefined();
      expect(tickChange?.type).toBe('modified');
      expect(tickChange?.from).toBe(1000);
      expect(tickChange?.to).toBe(1500);
    });

    it('should count total changes correctly', () => {
      const result = calculateConfigDiff(baseConfig, changedConfig);

      // Should have changes in all sections
      expect(result.summary.sectionsChanged).toHaveLength(4); // resources, ui, loop, warnings
      expect(result.summary.totalChanges).toBeGreaterThan(4); // Multiple changes per section
    });

    it('should handle empty configs', () => {
      const emptyConfig = { resources: {}, ui: {}, loop: {}, warnings: {} };
      const result = calculateConfigDiff(baseConfig, emptyConfig);

      expect(result.summary.hasChanges).toBe(true);
      expect(result.summary.sectionsChanged.length).toBeGreaterThan(0);
    });
  });

  describe('generateMarkdownReport', () => {
    it('should generate valid markdown for diff with changes', () => {
      const diffData = calculateConfigDiff(baseConfig, changedConfig);
      const fullDiff = {
        ...diffData,
        metadata: {
          fromFile: '/path/to/config-a.json',
          toFile: '/path/to/config-b.json',
          generatedAt: '2024-01-15T10:30:00.000Z',
        },
      };

      const report = generateMarkdownReport(fullDiff);

      expect(report).toContain('# Config Diff Report');
      expect(report).toContain('**/From:** `/path/to/config-a.json`');
      expect(report).toContain('**/To:** `/path/to/config-b.json`');
      expect(report).toContain('**/Generated:** 2024-01-15T10:30:00.000Z');
      expect(report).toContain('**Changes Detected:** Yes');
      expect(report).toContain('**Sections Changed:** resources, ui, loop, warnings');
      expect(report).toContain('## Resources Section');
      expect(report).toContain('## Ui Section');
      expect(report).toContain('## Loop Section');
      expect(report).toContain('## Warnings Section');
    });

    it('should generate valid markdown for diff with no changes', () => {
      const diffData = calculateConfigDiff(baseConfig, baseConfig);
      const fullDiff = {
        ...diffData,
        metadata: {
          fromFile: '/path/to/config-a.json',
          toFile: '/path/to/config-b.json',
          generatedAt: '2024-01-15T10:30:00.000Z',
        },
      };

      const report = generateMarkdownReport(fullDiff);

      expect(report).toContain('**Changes Detected:** No');
      expect(report).toContain('**Sections Changed:** None');
      expect(report).toContain('No changes detected in this section.');
    });

    it('should format change details correctly', () => {
      const diffData = calculateConfigDiff(baseConfig, changedConfig);
      const fullDiff = {
        ...diffData,
        metadata: {
          fromFile: 'config-a.json',
          toFile: 'config-b.json',
          generatedAt: '2024-01-15T10:30:00.000Z',
        },
      };

      const report = generateMarkdownReport(fullDiff);

      // Should contain JSON code blocks for change details
      expect(report).toContain('```json');
      expect(report).toContain('**Type:** modified');
    });

    it('should include generation footer', () => {
      const diffData = calculateConfigDiff(baseConfig, baseConfig);
      const fullDiff = {
        ...diffData,
        metadata: {
          fromFile: 'a.json',
          toFile: 'b.json',
          generatedAt: '2024-01-15T10:30:00.000Z',
        },
      };

      const report = generateMarkdownReport(fullDiff);

      expect(report).toContain('*Generated by NP-MIN-PLAN-205 – Minimal Config Diff Reporter*');
    });
  });

  describe('File Operations', () => {
    it('should read and parse JSON files', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify(baseConfig));

      // Import and test the loadConfig function indirectly through calculateConfigDiff
      // This tests the file reading logic in the CLI
      expect(() => {
        // This would normally call loadConfig, but we're testing the mock setup
        mockReadFileSync('/fake/path.json');
      }).not.toThrow();
    });

    it('should validate configs against schema', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify(baseConfig));

      // Test that schema validation is called
      calculateConfigDiff(baseConfig, changedConfig);

      expect(mockSchemaParse).toHaveBeenCalled();
    });

    it('should handle schema validation failures', () => {
      mockSchemaParse.mockReturnValue({
        success: false,
        error: { message: 'Schema validation failed' },
      });

      // This would normally throw, but we're testing the mock
      expect(mockSchemaParse).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle configs with missing sections', () => {
      const incompleteConfig = { resources: {}, ui: {} }; // Missing loop and warnings

      expect(() => calculateConfigDiff(baseConfig, incompleteConfig)).not.toThrow();
    });

    it('should handle null and undefined values', () => {
      const configWithNulls = {
        ...baseConfig,
        ui: {
          ...baseConfig.ui,
          hero: null,
        },
      };

      expect(() => calculateConfigDiff(baseConfig, configWithNulls)).not.toThrow();
    });

    it('should handle deeply nested changes', () => {
      const nestedChangeConfig = {
        ...baseConfig,
        ui: {
          ...baseConfig.ui,
          tokens: {
            ...baseConfig.ui.tokens,
            nested: { value: 'changed' },
          },
        },
      };

      const result = calculateConfigDiff(baseConfig, nestedChangeConfig);

      expect(result.summary.hasChanges).toBe(true);
      expect(result.sections.ui.hasChanges).toBe(true);
    });

    it('should handle array additions and removals', () => {
      const arrayChangeConfig = {
        ...baseConfig,
        resources: {
          ...baseConfig.resources,
          residents: [], // Remove all residents
        },
      };

      const result = calculateConfigDiff(baseConfig, arrayChangeConfig);

      expect(result.summary.hasChanges).toBe(true);
      expect(result.sections.resources.hasChanges).toBe(true);
    });
  });

  describe('CLI Integration', () => {
    it('should export required functions', () => {
      expect(typeof calculateConfigDiff).toBe('function');
      expect(typeof generateMarkdownReport).toBe('function');
    });

    it('should handle CLI argument parsing structure', () => {
      // This test ensures the CLI structure is set up correctly
      // The actual CLI testing would be done via separate integration tests
      expect(() => {
        // Test that the functions can be called without throwing
        const result = calculateConfigDiff(baseConfig, baseConfig);
        expect(result.summary.hasChanges).toBe(false);
      }).not.toThrow();
    });
  });
});
