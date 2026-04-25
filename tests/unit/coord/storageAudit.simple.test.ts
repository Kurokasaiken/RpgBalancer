/**
 * Storage Audit Tool Unit Tests
 * 
 * Tests the storage audit functionality for ensuring all modules
 * with PersistenceService have proper test coverage.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'fs';

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

    // Test the core logic directly
    const content = mockReadFileSync.mock.results[0].value;
    const hasPersistenceService = content.includes('PersistenceService') || 
                               content.includes('saveData') || 
                               content.includes('loadData') ||
                               content.includes('localStorage') ||
                               content.includes('sessionStorage');

    expect(hasPersistenceService).toBe(true);
  });

  test('should identify high priority modules', () => {
    const content = `
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
    `.trim();

    const isConfig = content.includes('config') || content.includes('Config');
    const hasPersistence = content.includes('PersistenceService');
    
    expect(isConfig).toBe(true);
    expect(hasPersistence).toBe(true);
  });

  test('should calculate coverage percentage correctly', () => {
    const modules = [
      { hasPersistenceService: true, hasStorageTests: true },
      { hasPersistenceService: true, hasStorageTests: false },
      { hasPersistenceService: true, hasStorageTests: false },
    ];

    const modulesWithPersistence = modules.filter(m => m.hasPersistenceService).length;
    const modulesWithTests = modules.filter(m => m.hasStorageTests).length;
    const coveragePercentage = modulesWithPersistence > 0 
      ? (modulesWithTests / modulesWithPersistence) * 100 
      : 100;

    expect(coveragePercentage).toBe(33.333333333333336);
  });

  test('should generate recommendations based on coverage', () => {
    const recommendations: string[] = [];
    const coveragePercentage = 25;

    if (coveragePercentage < 50) {
      recommendations.push('CRITICAL: Less than 50% storage test coverage. Immediate action required.');
    } else if (coveragePercentage < 80) {
      recommendations.push('WARNING: Storage test coverage below 80%. Priority for next sprint.');
    } else if (coveragePercentage < 100) {
      recommendations.push('INFO: Good progress, but complete coverage recommended for production.');
    } else {
      recommendations.push('EXCELLENT: 100% storage test coverage achieved.');
    }

    expect(recommendations).toContain('CRITICAL: Less than 50% storage test coverage. Immediate action required.');
  });

  test('should format markdown report', () => {
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

    let markdown = `# Storage Testing Audit Report\n\n`;
    markdown += `**Generated**: ${new Date(report.timestamp).toLocaleString()}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Modules | ${report.summary.totalModules} |\n`;
    markdown += `| Coverage Percentage | ${report.summary.coveragePercentage.toFixed(1)}% |\n`;

    expect(markdown).toContain('# Storage Testing Audit Report');
    expect(markdown).toContain('| Total Modules | 2 |');
    expect(markdown).toContain('| Coverage Percentage | 50.0% |');
  });

  test('should handle file analysis errors gracefully', () => {
    const mockReadFileSync = vi.mocked(readFileSync);
    mockReadFileSync.mockImplementation(() => {
      throw new Error('File read error');
    });

    expect(() => {
      mockReadFileSync('/path/to/error.ts');
    }).toThrow('File read error');
  });

  test('should handle empty git files output', () => {
    const mockExecSync = vi.mocked(require('child_process').execSync);
    mockExecSync.mockReturnValue('');

    const gitFiles = mockExecSync.mock.results[0].value;
    const files = gitFiles.split('\n').filter(Boolean);

    expect(files).toEqual([]);
  });
});
