/**
 * Stress Heatmap Renderer Tests - NP-123
 * 
 * Test suite for heatmap rendering functionality.
 * 
 * @since 2026-01-24
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StressHeatmapRenderer, createHeatmapRenderer } from '@/balancing/stressTesting/StressHeatmapRenderer';
import type { MarginalUtilityAnalysis } from '@/balancing/stressTesting/MarginalUtilityTypes';
import { DEFAULT_HEATMAP_CONFIG } from '@/balancing/config/stressTesting/heatmapConfig';

// Mock analysis data
const mockAnalysis: MarginalUtilityAnalysis = {
  id: 'test-analysis-001',
  config: {
    simulationCount: 1000,
    seed: 12345,
    thresholds: {
      opThreshold: 1.15,
      weakThreshold: 0.95,
    },
  },
  statMetrics: [
    {
      statId: 'hp',
      avgWinRate: 0.55,
      stdDeviation: 0.05,
      matchupCount: 3,
      bestMatchup: { opponentStat: 'damage', winRate: 0.65 },
      worstMatchup: { opponentStat: 'speed', winRate: 0.45 },
      ranking: 1,
      confidenceInterval: { lower: 0.50, upper: 0.60 },
    },
    {
      statId: 'damage',
      avgWinRate: 0.50,
      stdDeviation: 0.04,
      matchupCount: 3,
      bestMatchup: { opponentStat: 'speed', winRate: 0.60 },
      worstMatchup: { opponentStat: 'hp', winRate: 0.35 },
      ranking: 2,
      confidenceInterval: { lower: 0.46, upper: 0.54 },
    },
    {
      statId: 'speed',
      avgWinRate: 0.45,
      stdDeviation: 0.06,
      matchupCount: 3,
      bestMatchup: { opponentStat: 'hp', winRate: 0.55 },
      worstMatchup: { opponentStat: 'damage', winRate: 0.40 },
      ranking: 3,
      confidenceInterval: { lower: 0.39, upper: 0.51 },
    },
  ],
  synergyAnalyses: [
    {
      pairId: 'hp-damage',
      statIds: ['hp', 'damage'],
      observedWinRate: 0.70,
      expectedWinRate: 0.525,
      synergyMultiplier: 1.33,
      isOpSynergy: true,
      isWeakSynergy: false,
      isSignificant: true,
      pValue: 0.001,
      effectSize: 0.8,
    },
    {
      pairId: 'hp-speed',
      statIds: ['hp', 'speed'],
      observedWinRate: 0.48,
      expectedWinRate: 0.50,
      synergyMultiplier: 0.96,
      isOpSynergy: false,
      isWeakSynergy: false,
      isSignificant: false,
      pValue: 0.15,
      effectSize: 0.2,
    },
    {
      pairId: 'damage-speed',
      statIds: ['damage', 'speed'],
      observedWinRate: 0.42,
      expectedWinRate: 0.475,
      synergyMultiplier: 0.88,
      isOpSynergy: false,
      isWeakSynergy: true,
      isSignificant: true,
      pValue: 0.005,
      effectSize: 0.6,
    },
  ],
  summary: {
    totalSimulations: 9000,
    totalRuntimeMs: 5000,
    avgSimulationsPerSecond: 1800,
    opSynergiesCount: 1,
    weakSynergiesCount: 1,
    significantSynergiesCount: 2,
  },
  timestamp: Date.now(),
};

describe('StressHeatmapRenderer', () => {
  let renderer: StressHeatmapRenderer;

  beforeEach(() => {
    renderer = new StressHeatmapRenderer();
  });

  describe('Constructor', () => {
    it('should create renderer with default config', () => {
      expect(renderer).toBeDefined();
      expect(renderer.getConfig()).toEqual(DEFAULT_HEATMAP_CONFIG);
    });

    it('should create renderer with custom config', () => {
      const customConfig = {
        title: 'Custom Title',
        sortBy: 'winRate' as const,
      };
      const customRenderer = new StressHeatmapRenderer(customConfig);
      expect(customRenderer.getConfig().title).toBe('Custom Title');
      expect(customRenderer.getConfig().sortBy).toBe('winRate');
    });
  });

  describe('buildMatrix', () => {
    it('should build matrix from analysis results', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      
      expect(matrix.stats).toHaveLength(3);
      expect(matrix.stats).toContain('hp');
      expect(matrix.stats).toContain('damage');
      expect(matrix.stats).toContain('speed');
      
      expect(matrix.cells).toHaveLength(3);
      expect(matrix.cells[0]).toHaveLength(3);
    });

    it('should sort stats alphabetically by default', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      expect(matrix.stats).toEqual(['damage', 'hp', 'speed']);
    });

    it('should populate cells with synergy data', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      
      // Find hp-damage cell
      const hpIndex = matrix.stats.indexOf('hp');
      const damageIndex = matrix.stats.indexOf('damage');
      const cell = matrix.cells[hpIndex][damageIndex];
      
      expect(cell.multiplier).toBeCloseTo(1.33, 2);
      expect(cell.classification).toBe('OP');
    });

    it('should mark diagonal cells as neutral', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      
      for (let i = 0; i < matrix.stats.length; i++) {
        const cell = matrix.cells[i][i];
        expect(cell.multiplier).toBe(1.0);
        expect(cell.classification).toBe('Neutral');
      }
    });

    it('should include timestamp', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      expect(matrix.timestamp).toBeGreaterThan(0);
    });
  });

  describe('renderASCII', () => {
    it('should render ASCII heatmap', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      const output = renderer.renderASCII(matrix);
      
      expect(output.format).toBe('ascii');
      expect(output.content).toBeDefined();
      expect(output.content.length).toBeGreaterThan(0);
    });

    it('should include title in output', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      const output = renderer.renderASCII(matrix);
      
      expect(output.content).toContain('Marginal Utility Heatmap');
    });

    it('should include legend when enabled', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      const output = renderer.renderASCII(matrix);
      
      expect(output.content).toContain('Legend:');
      expect(output.content).toContain('Weak');
      expect(output.content).toContain('OP');
    });

    it('should include stat labels', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      const output = renderer.renderASCII(matrix);
      
      expect(output.content).toContain('hp');
      expect(output.content).toContain('damage');
      expect(output.content).toContain('speed');
    });

    it('should include timestamp when enabled', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      const output = renderer.renderASCII(matrix);
      
      expect(output.content).toContain('Generated:');
    });

    it('should calculate correct metadata', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      const output = renderer.renderASCII(matrix);
      
      expect(output.metadata.cellCount).toBe(9);
      expect(output.metadata.opCount).toBeGreaterThan(0);
      expect(output.metadata.weakCount).toBeGreaterThan(0);
    });

    it('should respect compact mode', () => {
      renderer.updateConfig({
        ascii: {
          ...DEFAULT_HEATMAP_CONFIG.ascii,
          compactMode: true,
          cellWidth: 4,
        },
      });
      
      const matrix = renderer.buildMatrix(mockAnalysis);
      const output = renderer.renderASCII(matrix);
      
      expect(output.width).toBeLessThan(100);
    });
  });

  describe('exportJSON', () => {
    it('should export matrix as JSON', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      const json = renderer.exportJSON(matrix);
      
      expect(json).toBeDefined();
      expect(() => JSON.parse(json)).not.toThrow();
      
      const parsed = JSON.parse(json);
      expect(parsed.stats).toBeDefined();
      expect(parsed.cells).toBeDefined();
    });
  });

  describe('exportCSV', () => {
    it('should export matrix as CSV', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      const csv = renderer.exportCSV(matrix);
      
      expect(csv).toBeDefined();
      expect(csv).toContain('Stat');
      expect(csv).toContain('hp');
      expect(csv).toContain('damage');
      expect(csv).toContain('speed');
    });

    it('should have correct number of rows', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      const csv = renderer.exportCSV(matrix);
      
      const lines = csv.split('\n');
      expect(lines).toHaveLength(4); // Header + 3 data rows
    });

    it('should have correct number of columns', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      const csv = renderer.exportCSV(matrix);
      
      const lines = csv.split('\n');
      const headerCols = lines[0].split(',');
      expect(headerCols).toHaveLength(4); // Stat label + 3 stats
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        title: 'Updated Title',
        showTimestamp: false,
      };
      
      renderer.updateConfig(newConfig);
      
      expect(renderer.getConfig().title).toBe('Updated Title');
      expect(renderer.getConfig().showTimestamp).toBe(false);
    });

    it('should preserve other config values', () => {
      const originalPalette = renderer.getConfig().palette;
      
      renderer.updateConfig({ title: 'New Title' });
      
      expect(renderer.getConfig().palette).toEqual(originalPalette);
    });
  });

  describe('Factory: createHeatmapRenderer', () => {
    it('should create default renderer', () => {
      const defaultRenderer = createHeatmapRenderer('default');
      expect(defaultRenderer).toBeDefined();
    });

    it('should create compact renderer', () => {
      const compactRenderer = createHeatmapRenderer('compact');
      expect(compactRenderer.getConfig().ascii.compactMode).toBe(true);
      expect(compactRenderer.getConfig().ascii.cellWidth).toBeLessThan(DEFAULT_HEATMAP_CONFIG.ascii.cellWidth);
    });

    it('should create detailed renderer', () => {
      const detailedRenderer = createHeatmapRenderer('detailed');
      expect(detailedRenderer.getConfig().ascii.cellWidth).toBeGreaterThan(DEFAULT_HEATMAP_CONFIG.ascii.cellWidth);
      expect(detailedRenderer.getConfig().ascii.showGrid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty analysis', () => {
      const emptyAnalysis: MarginalUtilityAnalysis = {
        ...mockAnalysis,
        statMetrics: [],
        synergyAnalyses: [],
      };
      
      const matrix = renderer.buildMatrix(emptyAnalysis);
      expect(matrix.stats).toHaveLength(0);
      expect(matrix.cells).toHaveLength(0);
    });

    it('should handle single stat', () => {
      const singleStatAnalysis: MarginalUtilityAnalysis = {
        ...mockAnalysis,
        statMetrics: [mockAnalysis.statMetrics[0]],
        synergyAnalyses: [],
      };
      
      const matrix = renderer.buildMatrix(singleStatAnalysis);
      expect(matrix.stats).toHaveLength(0);
    });

    it('should handle missing synergy data', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      
      // All cells should have valid data (either synergy or diagonal)
      matrix.cells.forEach(row => {
        row.forEach(cell => {
          expect(cell.multiplier).toBeGreaterThanOrEqual(0);
          expect(cell.classification).toBeDefined();
        });
      });
    });
  });

  describe('Classification', () => {
    it('should classify OP synergies correctly', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      
      // Find hp-damage cell (multiplier 1.33 > 1.15)
      const hpIndex = matrix.stats.indexOf('hp');
      const damageIndex = matrix.stats.indexOf('damage');
      const cell = matrix.cells[hpIndex][damageIndex];
      
      expect(cell.classification).toBe('OP');
    });

    it('should classify weak synergies correctly', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      
      // Find damage-speed cell (multiplier 0.88 < 0.95)
      const damageIndex = matrix.stats.indexOf('damage');
      const speedIndex = matrix.stats.indexOf('speed');
      const cell = matrix.cells[damageIndex][speedIndex];
      
      expect(cell.classification).toBe('Weak');
    });

    it('should classify neutral synergies correctly', () => {
      const matrix = renderer.buildMatrix(mockAnalysis);
      
      // Find hp-speed cell (multiplier 0.96, between 0.95 and 1.05)
      const hpIndex = matrix.stats.indexOf('hp');
      const speedIndex = matrix.stats.indexOf('speed');
      const cell = matrix.cells[hpIndex][speedIndex];
      
      expect(cell.classification).toBe('Neutral');
    });
  });
});
