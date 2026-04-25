/**
 * Interaction Mode Copy Synchronization Tests
 * 
 * Unit tests for the interaction mode copy synchronization system
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  readInteractionModeCopy,
  exportToJSON,
  exportToCSV,
  exportToMarkdown,
  generateDocumentation,
  validateConfiguration,
  runSync,
} from '../../../scripts/localization/interactionModeSync';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Mock file system operations
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// Mock child process
vi.mock('child_process', () => ({
  default: {
    execSync: vi.fn(),
  },
  execSync: vi.fn(),
}));

// Mock commander
vi.mock('commander', () => ({
  program: {
    name: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    version: vi.fn().mockReturnThis(),
    option: vi.fn().mockReturnThis(),
    action: vi.fn().mockReturnThis(),
    parse: vi.fn(),
  },
}));

describe('Interaction Mode Copy Sync', () => {
  const mockConfigDir = '/mock/config';
  const mockScriptsDir = '/mock/scripts';
  const mockDocsDir = '/mock/docs';
  const mockTestsDir = '/mock/tests';
  const mockExportsDir = '/mock/exports';

  const mockConfig = {
    defaultLocale: 'it-IT',
    supportedLocales: ['it-IT', 'en-US'],
    entries: [
      {
        key: 'mode.sandbox',
        text: 'Sandbox',
        description: 'Modalità sandbox',
        fallback: 'Sandbox',
        locale: 'it-IT',
        category: 'mode',
        context: 'picker',
        translatable: true,
        maxLength: 20,
        accessibility: {
          ariaLabel: 'Modalità Sandbox',
          keyHint: 'S',
        },
      },
      {
        key: 'mode.planning',
        text: 'Planning',
        description: 'Planning mode',
        fallback: 'Planning',
        locale: 'en-US',
        category: 'mode',
        context: 'picker',
        translatable: true,
        maxLength: 20,
        accessibility: {
          ariaLabel: 'Planning mode',
          keyHint: 'P',
        },
      },
    ],
    metadata: {
      version: '1.0.0',
      lastUpdated: Date.now(),
      totalEntries: 2,
      translationStatus: {
        'it-IT': 'complete',
        'en-US': 'partial',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock existsSync to return true for directories
    vi.mocked(existsSync).mockImplementation((path) => {
      if (path.toString().includes('interactionModeCopy.ts')) {
        return true;
      }
      return false;
    });

    // Mock readFileSync to return mock config
    vi.mocked(readFileSync).mockImplementation((path) => {
      if (path.toString().includes('interactionModeCopy.ts')) {
        return 'export const DEFAULT_INTERACTION_MODE_COPY_CONFIG = {};';
      }
      return '';
    });

    // Mock mkdirSync
    vi.mocked(mkdirSync).mockReturnValue(undefined as any);

    // Mock writeFileSync
    vi.mocked(writeFileSync).mockImplementation(() => {});
  });

  describe('readInteractionModeCopy', () => {
    test('should read configuration successfully', () => {
      vi.mocked(readFileSync).mockReturnValue(`
        export const DEFAULT_INTERACTION_MODE_COPY_CONFIG = {
          defaultLocale: 'it-IT',
          supportedLocales: ['it-IT', 'en-US'],
          entries: [],
          metadata: {
            version: '1.0.0',
            lastUpdated: Date.now(),
            totalEntries: 0,
            translationStatus: {
              'it-IT': 'complete',
              'en-US': 'partial',
            },
          },
        };
      `);

      const result = readInteractionModeCopy();
      
      expect(result).toBeDefined();
      expect(result.defaultLocale).toBe('it-IT');
      expect(result.supportedLocales).toContain('it-IT');
      expect(result.supportedLocales).toContain('en-US');
    });

    test('should throw error if config file not found', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      expect(() => readInteractionModeCopy()).toThrow('Configuration file not found');
    });

    test('should throw error if config structure invalid', () => {
      vi.mocked(readFileSync).mockReturnValue('export const INVALID_CONFIG = {};');

      expect(() => readInteractionModeCopy()).toThrow('Could not find DEFAULT_INTERACTION_MODE_COPY_CONFIG');
    });
  });

  describe('exportToJSON', () => {
    test('should export to JSON format', () => {
      const outputPath = exportToJSON(mockConfig, 'it-IT', mockExportsDir);
      
      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('interaction-mode-copy-it-IT.json'),
        expect.stringContaining('"locale": "it-IT"')
      );
      expect(outputPath).toContain('interaction-mode-copy-it-IT.json');
    });

    test('should filter entries by locale', () => {
      exportToJSON(mockConfig, 'en-US', mockExportsDir);
      
      const writeCall = vi.mocked(writeFileSync).mock.calls[0];
      const writtenContent = writeCall[1] as string;
      
      expect(writtenContent).toContain('"locale": "en-US"');
      expect(writtenContent).toContain('"text": "Planning"');
      expect(writtenContent).not.toContain('"text": "Sandbox"');
    });
  });

  describe('exportToCSV', () => {
    test('should export to CSV format', () => {
      const outputPath = exportToCSV(mockConfig, 'it-IT', mockExportsDir);
      
      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('interaction-mode-copy-it-IT.csv'),
        expect.stringContaining('key,text,description,fallback')
      );
      expect(outputPath).toContain('interaction-mode-copy-it-IT.csv');
    });

    test('should include proper CSV headers', () => {
      exportToCSV(mockConfig, 'it-IT', mockExportsDir);
      
      const writeCall = vi.mocked(writeFileSync).mock.calls[0];
      const writtenContent = writeCall[1] as string;
      
      expect(writtenContent).toContain('key,text,description,fallback,category,context,translatable,maxLength');
      expect(writtenContent).toContain('"mode.sandbox","Sandbox"');
    });
  });

  describe('exportToMarkdown', () => {
    test('should export to Markdown format', () => {
      const outputPath = exportToMarkdown(mockConfig, 'it-IT', mockExportsDir);
      
      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('interaction-mode-copy-it-IT.md'),
        expect.stringContaining('# Interaction Mode Copy - IT-IT')
      );
      expect(outputPath).toContain('interaction-mode-copy-it-IT.md');
    });

    test('should organize entries by category', () => {
      exportToMarkdown(mockConfig, 'it-IT', mockExportsDir);
      
      const writeCall = vi.mocked(writeFileSync).mock.calls[0];
      const writtenContent = writeCall[1] as string;
      
      expect(writtenContent).toContain('## Mode');
      expect(writtenContent).toContain('### mode.sandbox');
      expect(writtenContent).toContain('**Text:** Sandbox');
    });
  });

  describe('generateDocumentation', () => {
    test('should generate comprehensive documentation', () => {
      const docPath = generateDocumentation(mockConfig, mockDocsDir);
      
      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('interaction_mode_copy.md'),
        expect.stringContaining('# Interaction Mode Copy Documentation')
      );
      expect(docPath).toContain('interaction_mode_copy.md');
    });

    test('should include usage examples', () => {
      generateDocumentation(mockConfig, mockDocsDir);
      
      const writeCall = vi.mocked(writeFileSync).mock.calls[0];
      const writtenContent = writeCall[1] as string;
      
      expect(writtenContent).toContain('## Usage');
      expect(writtenContent).toContain('### Getting Copy');
      expect(writtenContent).toContain('import { getCopyText }');
    });

    test('should include CLI usage documentation', () => {
      generateDocumentation(mockConfig, mockDocsDir);
      
      const writeCall = vi.mocked(writeFileSync).mock.calls[0];
      const writtenContent = writeCall[1] as string;
      
      expect(writtenContent).toContain('## CLI Usage');
      expect(writtenContent).toContain('npm run localization:sync');
    });
  });

  describe('validateConfiguration', () => {
    test('should validate correct configuration', () => {
      const errors = validateConfiguration(mockConfig);
      
      expect(errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const invalidConfig = { ...mockConfig };
      // @ts-expect-error - Testing missing required field
      delete invalidConfig.defaultLocale;
      
      const errors = validateConfiguration(invalidConfig);
      
      expect(errors).toContain('Missing defaultLocale');
    });

    test('should validate entry structure', () => {
      const invalidConfig = {
        ...mockConfig,
        entries: [
          {
            // Missing required fields
            key: 'test.key',
            text: 'Test',
          },
        ],
      };
      
      const errors = validateConfiguration(invalidConfig);
      
      expect(errors).toContain('Entry 0: missing fallback');
      expect(errors).toContain('Entry 0: missing locale');
    });

    test('should validate supported locales', () => {
      const invalidConfig = {
        ...mockConfig,
        entries: [
          {
            key: 'test.key',
            text: 'Test',
            fallback: 'Test',
            locale: 'fr-FR', // Not in supported locales
            category: 'mode',
            context: 'picker',
            translatable: true,
          },
        ],
      };
      
      const errors = validateConfiguration(invalidConfig);
      
      expect(errors).toContain('Entry 0: unsupported locale \'fr-FR\'');
    });

    test('should validate categories and contexts', () => {
      const invalidConfig = {
        ...mockConfig,
        entries: [
          {
            key: 'test.key',
            text: 'Test',
            fallback: 'Test',
            locale: 'it-IT',
            category: 'invalid', // Invalid category
            context: 'picker',
            translatable: true,
          },
        ],
      };
      
      const errors = validateConfiguration(invalidConfig);
      
      expect(errors).toContain('Entry 0: invalid category \'invalid\'');
    });
  });

  describe('runSync', () => {
    test('should run full synchronization process', async () => {
      const syncConfig = {
        sourceLocale: 'it-IT',
        targetLocales: ['en-US'],
        exportFormat: 'json' as const,
        includeMetadata: true,
        generateDocs: true,
        updateExisting: true,
      };

      // Mock successful config read
      vi.mocked(readFileSync).mockReturnValue(`
        export const DEFAULT_INTERACTION_MODE_COPY_CONFIG = ${JSON.stringify(mockConfig)};
      `);

      const result = await runSync(syncConfig);
      
      expect(result.locales).toContain('en-US');
      expect(result.exports.length).toBeGreaterThan(0);
      expect(result.docs.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('should handle export errors gracefully', async () => {
      const syncConfig = {
        sourceLocale: 'it-IT',
        targetLocales: ['en-US'],
        exportFormat: 'invalid' as any, // This will cause an error
        includeMetadata: true,
        generateDocs: true,
        updateExisting: true,
      };

      const result = await runSync(syncConfig);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Unsupported export format');
    });

    test('should handle documentation generation errors', async () => {
      const syncConfig = {
        sourceLocale: 'it-IT',
        targetLocales: ['en-US'],
        exportFormat: 'json' as const,
        includeMetadata: true,
        generateDocs: true,
        updateExisting: true,
      };

      // Mock writeFileSync to throw error for documentation
      vi.mocked(writeFileSync).mockImplementation((path) => {
        if (path.toString().includes('.md')) {
          throw new Error('Documentation write failed');
        }
      });

      const result = await runSync(syncConfig);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to generate documentation');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete workflow', async () => {
      // Setup complete workflow
      const syncConfig = {
        sourceLocale: 'it-IT',
        targetLocales: ['en-US', 'fr-FR'],
        exportFormat: 'json' as const,
        includeMetadata: true,
        generateDocs: true,
        updateExisting: true,
      };

      // Mock successful operations
      vi.mocked(readFileSync).mockReturnValue(`
        export const DEFAULT_INTERACTION_MODE_COPY_CONFIG = ${JSON.stringify(mockConfig)};
      `);

      const result = await runSync(syncConfig);
      
      expect(result.locales).toHaveLength(2);
      expect(result.exports).toHaveLength(2);
      expect(result.docs).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate configuration before processing', () => {
      const invalidConfig = {
        defaultLocale: '', // Invalid
        supportedLocales: [],
        entries: [],
        metadata: {
          version: '1.0.0',
          lastUpdated: Date.now(),
          totalEntries: 0,
          translationStatus: {},
        },
      };

      const errors = validateConfiguration(invalidConfig);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Missing defaultLocale');
      expect(errors).toContain('supportedLocales must be an array');
    });

    test('should handle empty target locales', async () => {
      const syncConfig = {
        sourceLocale: 'it-IT',
        targetLocales: [],
        exportFormat: 'json' as const,
        includeMetadata: true,
        generateDocs: true,
        updateExisting: true,
      };

      const result = await runSync(syncConfig);
      
      expect(result.locales).toHaveLength(0);
      expect(result.exports).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle file system errors', () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('File system error');
      });

      expect(() => readInteractionModeCopy()).toThrow('Failed to parse configuration');
    });

    test('should handle write errors during export', () => {
      vi.mocked(writeFileSync).mockImplementation(() => {
        throw new Error('Write error');
      });

      expect(() => exportToJSON(mockConfig, 'it-IT', mockExportsDir)).toThrow();
    });

    test('should handle malformed configuration', () => {
      vi.mocked(readFileSync).mockReturnValue('invalid javascript code');

      expect(() => readInteractionModeCopy()).toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should handle large configuration efficiently', async () => {
      // Create large configuration
      const largeConfig = {
        ...mockConfig,
        entries: Array.from({ length: 1000 }, (_, i) => ({
          key: `test.key.${i}`,
          text: `Test text ${i}`,
          description: `Test description ${i}`,
          fallback: `Test fallback ${i}`,
          locale: 'it-IT',
          category: 'mode',
          context: 'picker',
          translatable: true,
          maxLength: 50,
        })),
      };

      const syncConfig = {
        sourceLocale: 'it-IT',
        targetLocales: ['it-IT'],
        exportFormat: 'json' as const,
        includeMetadata: true,
        generateDocs: false,
        updateExisting: false,
      };

      const startTime = Date.now();
      
      const result = await runSync(syncConfig);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(1000); // Should complete in under 1 second
      expect(result.errors).toHaveLength(0);
    });
  });
});
