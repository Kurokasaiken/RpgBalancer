/**
 * Marginal Utility Report Exporter Test Suite
 * 
 * Comprehensive tests for the export functionality including JSON, CSV,
 * and Markdown export formats, validation, error handling, and edge cases.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  MarginalUtilityReportExporter,
  exportMarginalUtilityReport,
  exportAndDownloadReport,
  type ExportConfig,
  type ExportResult
} from '@/balancing/stressTesting/MarginalUtilityReportExporter';
import type { 
  MarginalUtilityAnalysis,
  MarginalUtilityMetrics,
  SynergyAnalysis,
  ExportFormat
} from '@/balancing/stressTesting/MarginalUtilityTypes';
import { DEFAULT_MARGINAL_UTILITY_CONFIG } from '@/balancing/config/stressTesting/marginalUtilityConfig';

// Mock DOM methods for file download
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();

// Mock URL and document globals
global.URL = {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
} as any;

global.document = {
  createElement: mockCreateElement,
  body: {
    appendChild: mockAppendChild,
    removeChild: mockRemoveChild,
  },
} as any;

global.Blob = vi.fn().mockImplementation((content: any, options: any) => ({
  content,
  type: options?.type || 'text/plain',
  size: content ? content.toString().length : 0,
}));

// Test data fixtures
const createMockStatMetrics = (): MarginalUtilityMetrics[] => [
  {
    statId: 'strength',
    avgWinRate: 0.65,
    stdDeviation: 0.12,
    matchupCount: 5,
    bestMatchup: { opponentStat: 'agility', winRate: 0.85 },
    worstMatchup: { opponentStat: 'intelligence', winRate: 0.45 },
    ranking: 1,
    confidenceInterval: { lower: 0.58, upper: 0.72 },
  },
  {
    statId: 'agility',
    avgWinRate: 0.58,
    stdDeviation: 0.15,
    matchupCount: 5,
    bestMatchup: { opponentStat: 'intelligence', winRate: 0.78 },
    worstMatchup: { opponentStat: 'strength', winRate: 0.38 },
    ranking: 2,
    confidenceInterval: { lower: 0.50, upper: 0.66 },
  },
  {
    statId: 'intelligence',
    avgWinRate: 0.47,
    stdDeviation: 0.18,
    matchupCount: 5,
    bestMatchup: { opponentStat: 'strength', winRate: 0.55 },
    worstMatchup: { opponentStat: 'agility', winRate: 0.22 },
    ranking: 3,
    confidenceInterval: { lower: 0.38, upper: 0.56 },
  },
];

const createMockSynergyAnalyses = (): SynergyAnalysis[] => [
  {
    pairId: 'strength-agility',
    statIds: ['strength', 'agility'],
    observedWinRate: 0.82,
    expectedWinRate: 0.615,
    synergyMultiplier: 1.33,
    isOpSynergy: true,
    isWeakSynergy: false,
    isSignificant: true,
    pValue: 0.002,
    effectSize: 0.85,
  },
  {
    pairId: 'strength-intelligence',
    statIds: ['strength', 'intelligence'],
    observedWinRate: 0.55,
    expectedWinRate: 0.56,
    synergyMultiplier: 0.98,
    isOpSynergy: false,
    isWeakSynergy: true,
    isSignificant: false,
    pValue: 0.45,
    effectSize: 0.12,
  },
  {
    pairId: 'agility-intelligence',
    statIds: ['agility', 'intelligence'],
    observedWinRate: 0.68,
    expectedWinRate: 0.525,
    synergyMultiplier: 1.29,
    isOpSynergy: false,
    isWeakSynergy: false,
    isSignificant: true,
    pValue: 0.018,
    effectSize: 0.67,
  },
];

const createMockAnalysis = (): MarginalUtilityAnalysis => ({
  id: 'test-analysis-123',
  config: {
    simulationCount: 1000,
    seed: 42,
    thresholds: {
      opThreshold: 1.15,
      weakThreshold: 0.95,
    },
  },
  statMetrics: createMockStatMetrics(),
  synergyAnalyses: createMockSynergyAnalyses(),
  summary: {
    totalSimulations: 3000,
    totalRuntimeMs: 1250,
    avgSimulationsPerSecond: 2400,
    opSynergiesCount: 1,
    weakSynergiesCount: 1,
    significantSynergiesCount: 2,
  },
  timestamp: Date.now(),
});

describe('MarginalUtilityReportExporter', () => {
  let exporter: MarginalUtilityReportExporter;
  let mockAnalysis: MarginalUtilityAnalysis;

  beforeEach(() => {
    vi.clearAllMocks();
    exporter = new MarginalUtilityReportExporter();
    mockAnalysis = createMockAnalysis();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default configuration', () => {
      const defaultConfig = exporter.getDefaultConfig();
      expect(defaultConfig.format).toBe('json');
      expect(defaultConfig.includeRawData).toBe(false);
      expect(defaultConfig.includeMetadata).toBe(true);
      expect(defaultConfig.csvDelimiter).toBe(',');
      expect(defaultConfig.precision).toBe(4);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<ExportConfig> = {
        format: 'csv',
        precision: 2,
        csvDelimiter: ';',
        includeMetadata: false,
      };
      
      const customExporter = new MarginalUtilityReportExporter(customConfig);
      const config = customExporter.getDefaultConfig();
      
      expect(config.format).toBe('csv');
      expect(config.precision).toBe(2);
      expect(config.csvDelimiter).toBe(';');
      expect(config.includeMetadata).toBe(false);
    });

    it('should return supported formats', () => {
      const formats = exporter.getSupportedFormats();
      expect(formats).toEqual(['json', 'csv', 'markdown']);
    });
  });

  describe('JSON Export', () => {
    it('should export analysis to JSON format', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'json' });
      
      expect(result.format).toBe('json');
      expect(result.filename).toMatch(/\.json$/);
      expect(result.content).toContain('"format": "json"');
      expect(result.content).toContain('"analysis":');
      expect(result.content).toContain('"metadata":');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should validate JSON export structure', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'json' });
      const parsed = JSON.parse(result.content);
      
      expect(parsed).toHaveProperty('format', 'json');
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('analysis');
      expect(parsed).toHaveProperty('metadata');
      expect(parsed.analysis).toHaveProperty('id', mockAnalysis.id);
      expect(parsed.analysis).toHaveProperty('statMetrics');
      expect(parsed.analysis).toHaveProperty('synergyAnalyses');
    });

    it('should sanitize numeric values to specified precision', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { 
        format: 'json', 
        precision: 2 
      });
      
      const parsed = JSON.parse(result.content);
      const metric = parsed.analysis.statMetrics[0];
      
      expect(metric.avgWinRate).toBe(0.65); // Should be exactly 0.65 with 2 decimal places
      expect(metric.stdDeviation).toBe(0.12);
    });

    it('should include metadata when enabled', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { 
        format: 'json',
        includeMetadata: true 
      });
      
      const parsed = JSON.parse(result.content);
      expect(parsed.metadata).toHaveProperty('version', '1.0.0');
      expect(parsed.metadata).toHaveProperty('config');
      expect(parsed.metadata).toHaveProperty('exportPath');
    });

    it('should exclude metadata when disabled', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { 
        format: 'json',
        includeMetadata: false 
      });
      
      const parsed = JSON.parse(result.content);
      expect(parsed.metadata).toBeUndefined();
    });
  });

  describe('CSV Export', () => {
    it('should export analysis to CSV format', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'csv' });
      
      expect(result.format).toBe('csv');
      expect(result.filename).toMatch(/\.csv$/);
      expect(result.content).toContain('# Marginal Utility Analysis Export');
      expect(result.content).toContain('# Stat Metrics');
      expect(result.content).toContain('# Synergy Analysis');
      expect(result.content).toContain('# Summary Statistics');
    });

    it('should include proper CSV headers', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'csv' });
      
      expect(result.content).toContain('Rank,Stat ID,Win Rate,Std Deviation');
      expect(result.content).toContain('Pair ID,Stat A,Stat B,Observed Win Rate');
    });

    it('should format numeric values with specified precision', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { 
        format: 'csv',
        precision: 2 
      });
      
      const lines = result.content.split('\n');
      const statDataRow = lines.find(line => line.includes('strength') && !line.startsWith('#'));
      
      expect(statDataRow).toContain('0.65'); // avgWinRate with 2 decimal places
      expect(statDataRow).toContain('0.12'); // stdDeviation with 2 decimal places
    });

    it('should use custom CSV delimiter', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { 
        format: 'csv',
        csvDelimiter: ';' 
      });
      
      expect(result.content).toContain('Rank;Stat ID;Win Rate;Std Deviation');
      expect(result.content).toContain('strength;0.65;0.12');
    });

    it('should include confidence intervals when enabled', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { 
        format: 'csv',
        includeConfidenceIntervals: true 
      });
      
      expect(result.content).toContain('Confidence Lower,Confidence Upper');
      expect(result.content).toContain('0.58,0.72'); // confidence interval values
    });

    it('should exclude confidence intervals when disabled', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { 
        format: 'csv',
        includeConfidenceIntervals: false 
      });
      
      expect(result.content).not.toContain('Confidence Lower');
      expect(result.content).not.toContain('0.58,0.72');
    });

    it('should include significance tests when enabled', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { 
        format: 'csv',
        includeSignificanceTests: true 
      });
      
      expect(result.content).toContain('P-Value,Effect Size');
      expect(result.content).toContain('0.0020,0.8500'); // p-value and effect size
    });

    it('should include summary statistics', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'csv' });
      
      expect(result.content).toContain('# Summary Statistics');
      expect(result.content).toContain('Total Simulations,3000');
      expect(result.content).toContain('OP Synergies Count,1');
      expect(result.content).toContain('Weak Synergies Count,1');
    });
  });

  describe('Markdown Export', () => {
    it('should export analysis to Markdown format', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'markdown' });
      
      expect(result.format).toBe('markdown');
      expect(result.filename).toMatch(/\.md$/);
      expect(result.content).toContain('# Marginal Utility Analysis Report');
      expect(result.content).toContain('## Overview');
      expect(result.content).toContain('## Executive Summary');
      expect(result.content).toContain('## Stat Performance Rankings');
      expect(result.content).toContain('## Synergy Analysis');
    });

    it('should include proper Markdown table formatting', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'markdown' });
      
      expect(result.content).toContain('| Rank | Stat | Win Rate | Std Dev |');
      expect(result.content).toContain('|------|------|----------|----------|');
      expect(result.content).toContain('| Pair | Observed | Expected | Multiplier |');
      expect(result.content).toContain('|------|----------|----------|-----------|');
    });

    it('should format percentages correctly', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'markdown' });
      
      expect(result.content).toContain('65.0%'); // 0.65 * 100
      expect(result.content).toContain('58.0%'); // 0.58 * 100
    });

    it('should include key insights section', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'markdown' });
      
      expect(result.content).toContain('## Key Insights');
      expect(result.content).toContain('### 🏆 Top Performing Stats');
      expect(result.content).toContain('### 🔥 Overpowered Synergies');
      expect(result.content).toContain('### ⚠️ Weak Synergies');
    });

    it('should include configuration when metadata enabled', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { 
        format: 'markdown',
        includeMetadata: true 
      });
      
      expect(result.content).toContain('## Analysis Configuration');
      expect(result.content).toContain('```json');
    });

    it('should include statistical notes when significance tests enabled', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { 
        format: 'markdown',
        includeSignificanceTests: true 
      });
      
      expect(result.content).toContain('## Statistical Notes');
      expect(result.content).toContain('**Significance Threshold**: p < 0.05');
      expect(result.content).toContain('**OP Threshold**: > 1.15x multiplier');
    });

    it('should highlight OP and weak synergies with emojis', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'markdown' });
      
      expect(result.content).toContain('🔥 **OP**'); // OP synergy
      expect(result.content).toContain('⚠️ **Weak**'); // Weak synergy
    });
  });

  describe('File Download', () => {
    it('should download file successfully', async () => {
      const mockUrl = 'blob:mock-url';
      mockCreateObjectURL.mockReturnValue(mockUrl);
      
      const mockLink = {
        href: mockUrl,
        download: '',
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);
      
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'json' });
      await exporter.downloadFile(result);
      
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    it('should handle download errors gracefully', async () => {
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error('Failed to create object URL');
      });
      
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'json' });
      
      await expect(exporter.downloadFile(result)).rejects.toThrow('Failed to create object URL');
    });
  });

  describe('Export and Download Combined', () => {
    it('should export and download in one operation', async () => {
      const mockUrl = 'blob:mock-url';
      mockCreateObjectURL.mockReturnValue(mockUrl);
      
      const mockLink = {
        href: mockUrl,
        download: '',
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);
      
      const result = await exporter.exportAndDownload(mockAnalysis, { format: 'csv' });
      
      expect(result.format).toBe('csv');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('Batch Export', () => {
    it('should export to multiple formats', async () => {
      const formats: ExportFormat[] = ['json', 'csv', 'markdown'];
      const results = await exporter.batchExport(mockAnalysis, formats);
      
      expect(results).toHaveLength(3);
      expect(results[0].format).toBe('json');
      expect(results[1].format).toBe('csv');
      expect(results[2].format).toBe('markdown');
      
      results.forEach(result => {
        expect(result.fileSize).toBeGreaterThan(0);
        expect(result.timestamp).toBeGreaterThan(0);
      });
    });

    it('should handle empty formats array', async () => {
      const results = await exporter.batchExport(mockAnalysis, []);
      expect(results).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid analysis data', async () => {
      const invalidAnalysis = {
        ...mockAnalysis,
        id: '',
        statMetrics: [],
      } as any;
      
      await expect(exporter.exportAnalysis(invalidAnalysis, { format: 'json' }))
        .rejects.toThrow('Invalid export data: missing analysis ID');
    });

    it('should handle missing stat metrics', async () => {
      const invalidAnalysis = {
        ...mockAnalysis,
        statMetrics: undefined,
      } as any;
      
      await expect(exporter.exportAnalysis(invalidAnalysis, { format: 'json' }))
        .rejects.toThrow('Invalid export data: no stat metrics found');
    });

    it('should handle missing synergy analyses', async () => {
      const invalidAnalysis = {
        ...mockAnalysis,
        synergyAnalyses: undefined,
      } as any;
      
      await expect(exporter.exportAnalysis(invalidAnalysis, { format: 'json' }))
        .rejects.toThrow('Invalid export data: no synergy analyses found');
    });

    it('should handle unsupported export format', async () => {
      await expect(exporter.exportAnalysis(mockAnalysis, { 
        format: 'unsupported' as any 
      })).rejects.toThrow('Unsupported export format: unsupported');
    });
  });

  describe('Validation and Schema', () => {
    it('should validate stat metric structure', async () => {
      const invalidAnalysis = {
        ...mockAnalysis,
        statMetrics: [
          {
            ...mockAnalysis.statMetrics[0],
            statId: '',
            avgWinRate: 'invalid' as any,
          },
        ],
      };
      
      await expect(exporter.exportAnalysis(invalidAnalysis, { format: 'json' }))
        .rejects.toThrow('Invalid stat metric');
    });

    it('should validate synergy analysis structure', async () => {
      const invalidAnalysis = {
        ...mockAnalysis,
        synergyAnalyses: [
          {
            ...mockAnalysis.synergyAnalyses[0],
            pairId: '',
            statIds: null as any,
          },
        ],
      };
      
      await expect(exporter.exportAnalysis(invalidAnalysis, { format: 'json' }))
        .rejects.toThrow('Invalid synergy analysis');
    });
  });

  describe('Metadata and Checksums', () => {
    it('should include export metadata', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'json' });
      
      expect(result.metadata).toHaveProperty('exportDuration');
      expect(result.metadata).toHaveProperty('recordCount');
      expect(result.metadata).toHaveProperty('formatVersion');
      expect(result.metadata).toHaveProperty('checksum');
      
      expect(result.metadata.exportDuration).toBeGreaterThanOrEqual(0);
      expect(result.metadata.recordCount).toBe(6); // 3 stats + 3 synergies
      expect(result.metadata.formatVersion).toBe('1.0.0');
      expect(result.metadata.checksum).toMatch(/^[a-f0-9]+$/);
    });

    it('should calculate consistent checksums', async () => {
      const result1 = await exporter.exportAnalysis(mockAnalysis, { format: 'json' });
      const result2 = await exporter.exportAnalysis(mockAnalysis, { format: 'json' });
      
      expect(result1.metadata.checksum).toBe(result2.metadata.checksum);
    });

    it('should generate different checksums for different content', async () => {
      const result1 = await exporter.exportAnalysis(mockAnalysis, { format: 'json' });
      const result2 = await exporter.exportAnalysis(mockAnalysis, { format: 'csv' });
      
      expect(result1.metadata.checksum).not.toBe(result2.metadata.checksum);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large analysis datasets', async () => {
      const largeAnalysis: MarginalUtilityAnalysis = {
        ...mockAnalysis,
        statMetrics: Array.from({ length: 100 }, (_, i) => ({
          statId: `stat-${i}`,
          avgWinRate: Math.random(),
          stdDeviation: Math.random() * 0.2,
          matchupCount: 50,
          bestMatchup: { opponentStat: 'strength', winRate: Math.random() },
          worstMatchup: { opponentStat: 'agility', winRate: Math.random() },
          ranking: i + 1,
          confidenceInterval: { lower: 0, upper: 1 },
        })),
        synergyAnalyses: Array.from({ length: 4950 }, (_, i) => ({
          pairId: `pair-${i}`,
          statIds: [`stat-${i % 100}`, `stat-${(i + 1) % 100}`],
          observedWinRate: Math.random(),
          expectedWinRate: Math.random(),
          synergyMultiplier: Math.random() * 2,
          isOpSynergy: Math.random() > 0.8,
          isWeakSynergy: Math.random() < 0.2,
          isSignificant: Math.random() > 0.5,
          pValue: Math.random(),
          effectSize: Math.random(),
        })),
      };
      
      const startTime = Date.now();
      const result = await exporter.exportAnalysis(largeAnalysis, { format: 'json' });
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.fileSize).toBeGreaterThan(1000000); // Should be substantial file
      expect(result.metadata.exportDuration).toBeLessThan(1000);
    });

    it('should handle empty analysis gracefully', async () => {
      const emptyAnalysis: MarginalUtilityAnalysis = {
        ...mockAnalysis,
        statMetrics: [],
        synergyAnalyses: [],
        summary: {
          ...mockAnalysis.summary,
          opSynergiesCount: 0,
          weakSynergiesCount: 0,
          significantSynergiesCount: 0,
        },
      };
      
      const result = await exporter.exportAnalysis(emptyAnalysis, { format: 'json' });
      
      expect(result.content).toContain('"statMetrics":[]');
      expect(result.content).toContain('"synergyAnalyses":[]');
      expect(result.metadata.recordCount).toBe(0);
    });

    it('should handle extreme precision values', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { 
        format: 'json',
        precision: 10 
      });
      
      const parsed = JSON.parse(result.content);
      const metric = parsed.analysis.statMetrics[0];
      
      expect(metric.avgWinRate).toBe(0.65); // Should be exact for simple decimals
      expect(metric.stdDeviation).toBe(0.12);
    });
  });

  describe('Convenience Functions', () => {
    it('should export using convenience function', async () => {
      const result = await exportMarginalUtilityReport(mockAnalysis, 'csv');
      
      expect(result.format).toBe('csv');
      expect(result.filename).toMatch(/\.csv$/);
    });

    it('should export and download using convenience function', async () => {
      const mockUrl = 'blob:mock-url';
      mockCreateObjectURL.mockReturnValue(mockUrl);
      
      const mockLink = {
        href: mockUrl,
        download: '',
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockLink);
      
      const result = await exportAndDownloadReport(mockAnalysis, 'markdown');
      
      expect(result.format).toBe('markdown');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    it('should use default format in convenience function', async () => {
      const result = await exportMarginalUtilityReport(mockAnalysis);
      
      expect(result.format).toBe('json');
    });
  });

  describe('Filename Generation', () => {
    it('should generate timestamped filenames', async () => {
      const result = await exporter.exportAnalysis(mockAnalysis, { format: 'json' });
      
      expect(result.filename).toMatch(/^marginal-utility-analysis-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.json$/);
    });

    it('should use custom filename template', async () => {
      const customTemplate = 'my-custom-report';
      const result = await exporter.exportAnalysis(mockAnalysis, { 
        format: 'csv',
        filenameTemplate: customTemplate 
      });
      
      expect(result.filename).toMatch(new RegExp(`^${customTemplate}-\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z\\.csv$`));
    });

    it('should generate different filenames for different formats', async () => {
      const jsonResult = await exporter.exportAnalysis(mockAnalysis, { format: 'json' });
      const csvResult = await exporter.exportAnalysis(mockAnalysis, { format: 'csv' });
      
      expect(jsonResult.filename).not.toBe(csvResult.filename);
      expect(jsonResult.filename).toMatch(/\.json$/);
      expect(csvResult.filename).toMatch(/\.csv$/);
    });
  });
});
