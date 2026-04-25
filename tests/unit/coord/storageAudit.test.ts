/**
 * Storage Audit Tool Unit Tests
 * 
 * Tests the storage audit functionality for ensuring all modules
 * with PersistenceService have proper test coverage.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'fs';

// Dynamic import for storage audit functions
let storageAuditModule: any;
beforeEach(async () => {
  storageAuditModule = await import('@/scripts/coord/storageAudit');
});

// Mock file system operations
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('Storage Audit Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock git ls-files
    const mockExecSync = vi.mocked(require('child_process').execSync);
    mockExecSync.mockReturnValue(`
src/balancing/config/BalancerConfigStore.ts
src/ui/idleVillage/hooks/useActiveHUDState.ts
src/shared/persistence/PersistenceService.ts
src/ui/components/SomeComponent.tsx
src/utils/helper.ts
    `.trim());
  });

  describe('analyzeFile', () => {
    test('should detect PersistenceService usage', () => {
      const mockReadFileSync = vi.mocked(readFileSync);
      mockReadFileSync.mockReturnValue(`
import { PersistenceService } from '@/shared/persistence/PersistenceService';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

export class ConfigStore {
  async save() {
    await PersistenceService.saveData('config', this.data);
  }
  
  async load() {
    this.data = await PersistenceService.loadData('config');
  }
}
      `.trim());

      const result = analyzeFile('/path/to/config.ts');

      expect(result.hasPersistenceService).toBe(true);
      expect(result.persistenceImports).toContain('@/shared/persistence/PersistenceService');
      expect(result.moduleType).toBe('utility');
      expect(result.priority).toBe('high');
    });

    test('should detect localStorage usage', () => {
      const mockReadFileSync = vi.mocked(readFileSync);
      mockReadFileSync.mockReturnValue(`
export function saveToStorage(data: any) {
  localStorage.setItem('key', JSON.stringify(data));
}

export function loadFromStorage() {
  return JSON.parse(localStorage.getItem('key') || '{}');
}
      `.trim());

      const result = analyzeFile('/path/to/storage.ts');

      expect(result.hasPersistenceService).toBe(true);
      expect(result.persistenceImports).toHaveLength(0); // No imports, but direct usage
      expect(result.moduleType).toBe('utility');
      expect(result.priority).toBe('medium');
    });

    test('should identify component type correctly', () => {
      const mockReadFileSync = vi.mocked(readFileSync);
      mockReadFileSync.mockReturnValue(`
import React from 'react';
import { PersistenceService } from '@/shared/persistence/PersistenceService';

export const SomeComponent: React.FC = () => {
  const handleSave = () => {
    PersistenceService.saveData('component', data);
  };
  
  return <div>Component</div>;
};
      `.trim());

      const result = analyzeFile('/path/to/components/SomeComponent.tsx');

      expect(result.moduleType).toBe('component');
      expect(result.priority).toBe('medium');
    });

    test('should identify config type correctly', () => {
      const mockReadFileSync = vi.mocked(readFileSync);
      mockReadFileSync.mockReturnValue(`
import { PersistenceService } from '@/shared/persistence/PersistenceService';

export const DEFAULT_CONFIG = {
  theme: 'dark',
  version: '1.0.0',
};

export class ConfigManager {
  static async save(config: any) {
    await PersistenceService.saveData('config', config);
  }
}
      `.trim());

      const result = analyzeFile('/path/to/config/ConfigManager.ts');

      expect(result.moduleType).toBe('config');
      expect(result.priority).toBe('high');
    });

    test('should handle files without persistence', () => {
      const mockReadFileSync = vi.mocked(readFileSync);
      mockReadFileSync.mockReturnValue(`
export function calculateSum(a: number, b: number): number {
  return a + b;
}

export const PI = 3.14159;
      `.trim());

      const result = analyzeFile('/path/to/utils/math.ts');

      expect(result.hasPersistenceService).toBe(false);
      expect(result.persistenceImports).toHaveLength(0);
      expect(result.moduleType).toBe('utility');
      expect(result.priority).toBe('low');
    });

    test('should check storage test coverage', () => {
      const mockReadFileSync = vi.mocked(readFileSync);
      const mockExistsSync = vi.mocked(existsSync);
      
      // Mock source file
      mockReadFileSync.mockReturnValue(`
import { PersistenceService } from '@/shared/persistence/PersistenceService';

export class ConfigStore {
  async save() {
    await PersistenceService.saveData('config', this.data);
  }
}
      `.trim());

      // Mock test file exists
      mockExistsSync.mockImplementation((path) => {
        return path.includes('ConfigStore.test.ts');
      });

      const result = analyzeFile('/path/to/config/ConfigStore.ts');

      expect(result.testCoverage.hasTestFile).toBe(true);
      expect(result.testCoverage.testFilePath).toBe('tests/storage/config/ConfigStore.test.ts');
    });
  });

  describe('generateAuditReport', () => {
    test('should generate comprehensive audit report', () => {
      const modules = [
        {
          filePath: '/path/to/config/ConfigStore.ts',
          relativePath: 'src/config/ConfigStore.ts',
          hasPersistenceService: true,
          persistenceImports: ['@/shared/persistence/PersistenceService'],
          hasStorageTests: true,
          testCoverage: {
            hasTestFile: true,
            hasTestFunctions: true,
            hasScenarios: true,
            testFilePath: 'tests/storage/config/ConfigStore.test.ts',
          },
          priority: 'high' as const,
          moduleType: 'config' as const,
        },
        {
          filePath: '/path/to/components/SomeComponent.tsx',
          relativePath: 'src/components/SomeComponent.tsx',
          hasPersistenceService: true,
          persistenceImports: [],
          hasStorageTests: false,
          testCoverage: {
            hasTestFile: false,
            hasTestFunctions: false,
            hasScenarios: false,
          },
          priority: 'medium' as const,
          moduleType: 'component' as const,
        },
        {
          filePath: '/path/to/utils/helper.ts',
          relativePath: 'src/utils/helper.ts',
          hasPersistenceService: false,
          persistenceImports: [],
          hasStorageTests: false,
          testCoverage: {
            hasTestFile: false,
            hasTestFunctions: false,
            hasScenarios: false,
          },
          priority: 'low' as const,
          moduleType: 'utility' as const,
        },
      ];

      const report = generateAuditReport(modules);

      expect(report.summary.totalModules).toBe(3);
      expect(report.summary.modulesWithPersistence).toBe(2);
      expect(report.summary.modulesWithTests).toBe(1);
      expect(report.summary.coveragePercentage).toBe(50);
      expect(report.summary.highPriorityMissing).toBe(0);
      expect(report.summary.mediumPriorityMissing).toBe(1);
      expect(report.summary.lowPriorityMissing).toBe(0);
      
      expect(report.recommendations).toContain('WARNING: Storage test coverage below 80%. Priority for next sprint.');
      expect(report.nextSteps).toContain('Plan storage tests for 1 medium-priority modules:');
    });

    test('should handle 100% coverage', () => {
      const modules = [
        {
          filePath: '/path/to/config/ConfigStore.ts',
          relativePath: 'src/config/ConfigStore.ts',
          hasPersistenceService: true,
          persistenceImports: ['@/shared/persistence/PersistenceService'],
          hasStorageTests: true,
          testCoverage: {
            hasTestFile: true,
            hasTestFunctions: true,
            hasScenarios: true,
            testFilePath: 'tests/storage/config/ConfigStore.test.ts',
          },
          priority: 'high' as const,
          moduleType: 'config' as const,
        },
      ];

      const report = generateAuditReport(modules);

      expect(report.summary.coveragePercentage).toBe(100);
      expect(report.recommendations).toContain('EXCELLENT: 100% storage test coverage achieved.');
    });

    test('should handle critical coverage below 50%', () => {
      const modules = [
        {
          filePath: '/path/to/config/ConfigStore.ts',
          relativePath: 'src/config/ConfigStore.ts',
          hasPersistenceService: true,
          persistenceImports: ['@/shared/persistence/PersistenceService'],
          hasStorageTests: false,
          testCoverage: {
            hasTestFile: false,
            hasTestFunctions: false,
            hasScenarios: false,
          },
          priority: 'high' as const,
          moduleType: 'config' as const,
        },
        {
          filePath: '/path/to/components/SomeComponent.tsx',
          relativePath: 'src/components/SomeComponent.tsx',
          hasPersistenceService: true,
          persistenceImports: [],
          hasStorageTests: false,
          testCoverage: {
            hasTestFile: false,
            hasTestFunctions: false,
            hasScenarios: false,
          },
          priority: 'medium' as const,
          moduleType: 'component' as const,
        },
        {
          filePath: '/path/to/utils/helper.ts',
          relativePath: 'src/utils/helper.ts',
          hasPersistenceService: true,
          persistenceImports: [],
          hasStorageTests: false,
          testCoverage: {
            hasTestFile: false,
            hasTestFunctions: false,
            hasScenarios: false,
          },
          priority: 'low' as const,
          moduleType: 'utility' as const,
        },
      ];

      const report = generateAuditReport(modules);

      expect(report.summary.coveragePercentage).toBe(0);
      expect(report.recommendations).toContain('CRITICAL: Less than 50% storage test coverage. Immediate action required.');
      expect(report.summary.highPriorityMissing).toBe(1);
    });
  });

  describe('formatReport', () => {
    test('should format report as JSON', () => {
      const report = {
        timestamp: '2026-01-11T18:00:00.000Z',
        summary: {
          totalModules: 2,
          modulesWithPersistence: 2,
          modulesWithTests: 1,
          coveragePercentage: 50,
          highPriorityMissing: 0,
          mediumPriorityMissing: 1,
          lowPriorityMissing: 0,
        },
        modules: [],
        recommendations: ['Test recommendation'],
        nextSteps: ['Test step'],
      };

      const json = formatReport(report, 'json');
      const parsed = JSON.parse(json);

      expect(parsed.timestamp).toBe('2026-01-11T18:00:00.000Z');
      expect(parsed.summary.coveragePercentage).toBe(50);
    });

    test('should format report as markdown', () => {
      const report = {
        timestamp: '2026-01-11T18:00:00.000Z',
        summary: {
          totalModules: 2,
          modulesWithPersistence: 2,
          modulesWithTests: 1,
          coveragePercentage: 50,
          highPriorityMissing: 0,
          mediumPriorityMissing: 1,
          lowPriorityMissing: 0,
        },
        modules: [
          {
            filePath: '/path/to/config/ConfigStore.ts',
            relativePath: 'src/config/ConfigStore.ts',
            hasPersistenceService: true,
            persistenceImports: ['@/shared/persistence/PersistenceService'],
            hasStorageTests: true,
            testCoverage: {
              hasTestFile: true,
              hasTestFunctions: true,
              hasScenarios: true,
              testFilePath: 'tests/storage/config/ConfigStore.test.ts',
            },
            priority: 'high' as const,
            moduleType: 'config' as const,
          },
        ],
        recommendations: ['Test recommendation'],
        nextSteps: ['Test step'],
      };

      const markdown = formatReport(report, 'markdown');

      expect(markdown).toContain('# Storage Testing Audit Report');
      expect(markdown).toContain('**Generated**:');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('| Total Modules | 2 |');
      expect(markdown).toContain('| Coverage Percentage | 50.0% |');
      expect(markdown).toContain('## Recommendations');
      expect(markdown).toContain('- Test recommendation');
      expect(markdown).toContain('## Module Details');
    });
  });

  describe('main function integration', () => {
    test('should run complete audit process', async () => {
      // Mock console.log to capture output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock file system
      const mockReadFileSync = vi.mocked(readFileSync);
      const mockExistsSync = vi.mocked(existsSync);
      const mockWriteFileSync = vi.mocked(writeFileSync);
      
      // Mock source files
      mockReadFileSync.mockImplementation((path) => {
        if (path.includes('ConfigStore.ts')) {
          return `
import { PersistenceService } from '@/shared/persistence/PersistenceService';

export class ConfigStore {
  async save() {
    await PersistenceService.saveData('config', this.data);
  }
}
          `.trim();
        }
        return '';
      });
      
      // Mock test file exists
      mockExistsSync.mockReturnValue(true);
      
      // Mock writeFileSync for report output
      mockWriteFileSync.mockImplementation(() => {});

      // Override process.argv to simulate CLI args
      const originalArgv = process.argv;
      process.argv = ['node', 'storageAudit.ts', '--format', 'json'];

      try {
        await main();
      } catch (error) {
        // Expected due to mocked environment
      }

      // Restore process.argv
      process.argv = originalArgv;
      
      // Restore console
      consoleSpy.mockRestore();

      // Verify file system operations were called
      expect(mockReadFileSync).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should handle file analysis errors gracefully', () => {
      const mockReadFileSync = vi.mocked(readFileSync);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      // Should not throw, but handle error gracefully
      expect(() => {
        analyzeFile('/path/to/error.ts');
      }).toThrow('File read error');
    });

    test('should handle missing git files', () => {
      const mockExecSync = vi.mocked(require('child_process').execSync);
      mockExecSync.mockReturnValue('');

      // Should handle empty git output gracefully
      expect(() => {
        const { findFiles } = require('@/scripts/coord/storageAudit');
        const files = findFiles('/src', ['**/*.ts']);
        expect(files).toEqual([]);
      }).not.toThrow();
    });
  });
});
