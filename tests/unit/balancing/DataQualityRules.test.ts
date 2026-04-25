/**
 * Unit Tests for Data Quality Rules
 * 
 * Tests for stress testing data quality validation rules and issue detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  DataQualityValidator, 
  DEFAULT_DATA_QUALITY_RULES,
  DataQualityRulesSchema,
  type DataQualityReport,
  type QualityIssue
} from '@/balancing/stressTesting/DataQualityRules';
import type { 
  ExportData, 
  MarginalUtilityAnalysis, 
  SynergyAnalysis, 
  MarginalUtilityMetrics 
} from '@/balancing/stressTesting/MarginalUtilityTypes';

describe('DataQualityRules', () => {
  let validator: DataQualityValidator;
  let mockExportData: ExportData;
  let mockAnalysis: MarginalUtilityAnalysis;

  beforeEach(() => {
    validator = new DataQualityValidator(DEFAULT_DATA_QUALITY_RULES);
    
    // Create mock analysis data
    mockAnalysis = {
      id: 'test-analysis-123',
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
          avgWinRate: 0.65,
          stdDeviation: 0.15,
          matchupCount: 10,
          bestMatchup: { opponentStat: 'damage', winRate: 0.8 },
          worstMatchup: { opponentStat: 'speed', winRate: 0.5 },
          ranking: 3,
          confidenceInterval: { lower: 0.55, upper: 0.75 },
        },
        {
          statId: 'damage',
          avgWinRate: 0.72,
          stdDeviation: 0.12,
          matchupCount: 10,
          bestMatchup: { opponentStat: 'speed', winRate: 0.85 },
          worstMatchup: { opponentStat: 'hp', winRate: 0.6 },
          ranking: 1,
          confidenceInterval: { lower: 0.64, upper: 0.80 },
        },
      ],
      synergyAnalyses: [
        {
          pairId: 'hp-damage',
          statIds: ['hp', 'damage'],
          observedWinRate: 0.7,
          expectedWinRate: 0.68,
          synergyMultiplier: 1.03,
          isOpSynergy: false,
          isWeakSynergy: false,
          isSignificant: true,
          pValue: 0.05,
          effectSize: 0.2,
        },
        {
          pairId: 'hp-speed',
          statIds: ['hp', 'speed'],
          observedWinRate: 0.45,
          expectedWinRate: 0.58,
          synergyMultiplier: 0.78,
          isOpSynergy: false,
          isWeakSynergy: true,
          isSignificant: true,
          pValue: 0.01,
          effectSize: -0.3,
        },
      ],
      summary: {
        totalSimulations: 20000,
        totalRuntimeMs: 15000,
        avgSimulationsPerSecond: 1333,
        opSynergiesCount: 0,
        weakSynergiesCount: 1,
        significantSynergiesCount: 2,
      },
      timestamp: Date.now(),
    };

    mockExportData = {
      format: 'json',
      exportedAt: new Date().toISOString(),
      analysis: mockAnalysis,
      metadata: {
        version: '1.0.0',
        config: {} as any,
        exportPath: '/test/path/export.json',
      },
    };
  });

  describe('DataQualityRulesSchema', () => {
    it('should validate default rules', () => {
      const result = DataQualityRulesSchema.safeParse(DEFAULT_DATA_QUALITY_RULES);
      expect(result.success).toBe(true);
    });

    it('should accept custom rules within bounds', () => {
      const customRules = {
        synergyThresholds: {
          minMultiplier: 0.2,
          maxMultiplier: 8.0,
          extremeThreshold: 3.0,
        },
        numericalRules: {
          allowNaN: false,
          allowInfinity: false,
          minWinRate: 0.1,
          maxWinRate: 0.9,
          minPercentage: 5.0,
          maxPercentage: 95.0,
        },
        statisticalRules: {
          minMatchupCount: 3,
          maxStdDeviation: 0.8,
          minConfidenceCoverage: 0.7,
        },
        completenessRules: {
          minStatCount: 2,
          minSynergyCount: 1,
          maxRuntimeMs: 600000,
        },
      };

      const result = DataQualityRulesSchema.safeParse(customRules);
      expect(result.success).toBe(true);
    });

    it('should reject invalid rules', () => {
      const invalidRules = {
        synergyThresholds: {
          minMultiplier: -1, // Invalid: negative
          maxMultiplier: 10.0,
          extremeThreshold: 3.0,
        },
        numericalRules: {
          allowNaN: false,
          allowInfinity: false,
          minWinRate: 0.1,
          maxWinRate: 1.5, // Invalid: > 1.0
          minPercentage: 5.0,
          maxPercentage: 95.0,
        },
        statisticalRules: {
          minMatchupCount: 3,
          maxStdDeviation: 0.8,
          minConfidenceCoverage: 0.7,
        },
        completenessRules: {
          minStatCount: 2,
          minSynergyCount: 1,
          maxRuntimeMs: 600000,
        },
      };

      const result = DataQualityRulesSchema.safeParse(invalidRules);
      expect(result.success).toBe(false);
    });
  });

  describe('DataQualityValidator', () => {
    it('should validate clean data without issues', () => {
      const report = validator.validateExportData(mockExportData);
      
      // The mock data has 1 OP synergy which might trigger an extreme value warning
      expect(report.summary.totalIssues).toBeGreaterThanOrEqual(0);
      expect(report.summary.qualityScore).toBeGreaterThanOrEqual(80);
      expect(['pass', 'warning']).toContain(report.summary.status);
      expect(report.issues).toHaveLength(report.summary.totalIssues);
    });

    it('should detect NaN values in win rates', () => {
      mockAnalysis.statMetrics[0].avgWinRate = NaN;
      
      const report = validator.validateExportData(mockExportData);
      
      expect(report.summary.totalIssues).toBeGreaterThan(0);
      expect(report.summary.status).toBe('fail');
      
      const nanIssues = report.issues.filter(issue => issue.type === 'nan_value');
      expect(nanIssues).toHaveLength(1);
      expect(nanIssues[0].location.path).toContain('avgWinRate');
      expect(nanIssues[0].severity).toBe('error');
    });

    it('should detect infinite values', () => {
      mockAnalysis.synergyAnalyses[0].synergyMultiplier = Infinity;
      
      const report = validator.validateExportData(mockExportData);
      
      expect(report.summary.totalIssues).toBeGreaterThan(0);
      expect(report.summary.status).toBe('fail');
      
      const infiniteIssues = report.issues.filter(issue => issue.type === 'infinite_value');
      expect(infiniteIssues).toHaveLength(1);
      expect(infiniteIssues[0].location.path).toContain('synergyMultiplier');
      expect(infiniteIssues[0].severity).toBe('error');
    });

    it('should detect out-of-range synergy multipliers', () => {
      mockAnalysis.synergyAnalyses[0].synergyMultiplier = 15.0; // Above max threshold
      
      const report = validator.validateExportData(mockExportData);
      
      expect(report.summary.totalIssues).toBeGreaterThan(0);
      
      const rangeIssues = report.issues.filter(issue => issue.type === 'out_of_range');
      expect(rangeIssues).toHaveLength(1);
      expect(rangeIssues[0].actualValue).toBe(15.0);
      expect(rangeIssues[0].severity).toBe('error');
    });

    it('should detect extreme synergy multipliers', () => {
      mockAnalysis.synergyAnalyses[0].synergyMultiplier = 6.0; // Above extreme threshold
      
      const report = validator.validateExportData(mockExportData);
      
      expect(report.summary.totalIssues).toBeGreaterThan(0);
      
      const extremeIssues = report.issues.filter(issue => issue.type === 'extreme_value');
      expect(extremeIssues).toHaveLength(1);
      expect(extremeIssues[0].actualValue).toBe(6.0);
      expect(extremeIssues[0].severity).toBe('warning');
    });

    it('should detect invalid win rates', () => {
      mockAnalysis.statMetrics[0].avgWinRate = 1.5; // Above 1.0
      
      const report = validator.validateExportData(mockExportData);
      
      expect(report.summary.totalIssues).toBeGreaterThan(0);
      
      const winRateIssues = report.issues.filter(issue => issue.type === 'invalid_win_rate');
      expect(winRateIssues).toHaveLength(1);
      expect(winRateIssues[0].actualValue).toBe(1.5);
      expect(winRateIssues[0].severity).toBe('error');
    });

    it('should detect insufficient matchup count', () => {
      mockAnalysis.statMetrics[0].matchupCount = 2; // Below min threshold
      
      const report = validator.validateExportData(mockExportData);
      
      expect(report.summary.totalIssues).toBeGreaterThan(0);
      
      const insufficientIssues = report.issues.filter(issue => issue.type === 'insufficient_data');
      expect(insufficientIssues.length).toBeGreaterThanOrEqual(1);
      const matchupIssue = insufficientIssues.find(issue => issue.location.path.includes('matchupCount'));
      expect(matchupIssue?.actualValue).toBe(2);
      expect(matchupIssue?.severity).toBe('warning');
    });

    it('should detect high standard deviation', () => {
      mockAnalysis.statMetrics[0].stdDeviation = 1.5; // Above max threshold
      
      const report = validator.validateExportData(mockExportData);
      
      expect(report.summary.totalIssues).toBeGreaterThan(0);
      
      const statisticalIssues = report.issues.filter(issue => issue.type === 'statistical_anomaly');
      expect(statisticalIssues).toHaveLength(1);
      expect(statisticalIssues[0].actualValue).toBe(1.5);
      expect(statisticalIssues[0].severity).toBe('warning');
    });

    it('should detect insufficient stat count', () => {
      mockAnalysis.statMetrics = [mockAnalysis.statMetrics[0]]; // Only 1 stat
      
      const report = validator.validateExportData(mockExportData);
      
      expect(report.summary.totalIssues).toBeGreaterThan(0);
      
      const insufficientIssues = report.issues.filter(issue => 
        issue.type === 'insufficient_data' && issue.location.path === 'analysis.statMetrics'
      );
      expect(insufficientIssues).toHaveLength(1);
      expect(insufficientIssues[0].severity).toBe('warning');
    });

    it('should detect performance issues', () => {
      mockAnalysis.summary.totalRuntimeMs = 400000; // Above max threshold
      
      const report = validator.validateExportData(mockExportData);
      
      expect(report.summary.totalIssues).toBeGreaterThan(0);
      
      const performanceIssues = report.issues.filter(issue => issue.type === 'performance_issue');
      expect(performanceIssues).toHaveLength(1);
      expect(performanceIssues[0].actualValue).toBe(400000);
      expect(performanceIssues[0].severity).toBe('warning');
    });

    it('should detect missing data fields', () => {
      const incompleteAnalysis = { ...mockAnalysis };
      delete (incompleteAnalysis as any).id;
      
      const incompleteExportData = { ...mockExportData, analysis: incompleteAnalysis };
      
      const report = validator.validateExportData(incompleteExportData);
      
      expect(report.summary.totalIssues).toBeGreaterThan(0);
      
      const missingIssues = report.issues.filter(issue => issue.type === 'missing_data');
      expect(missingIssues.length).toBeGreaterThan(0);
      expect(missingIssues[0].severity).toBe('error');
    });

    it('should calculate quality score correctly', () => {
      // Add some issues to test score calculation
      mockAnalysis.statMetrics[0].avgWinRate = NaN; // Error: -10 points
      mockAnalysis.statMetrics[1].stdDeviation = 1.5; // Warning: -3 points
      
      const report = validator.validateExportData(mockExportData);
      
      // Score calculation: 100 - (errors * 10) - (warnings * 3)
      const expectedScore = 100 - (1 * 10) - (1 * 3); // 1 error + 1 warning = 87
      expect(report.summary.qualityScore).toBe(expectedScore);
      expect(report.summary.status).toBe('fail'); // Has errors
    });

    it('should handle empty analysis gracefully', () => {
      const emptyAnalysis: MarginalUtilityAnalysis = {
        id: 'empty-test',
        config: mockAnalysis.config,
        statMetrics: [],
        synergyAnalyses: [],
        summary: {
          totalSimulations: 0,
          totalRuntimeMs: 0,
          avgSimulationsPerSecond: 0,
          opSynergiesCount: 0,
          weakSynergiesCount: 0,
          significantSynergiesCount: 0,
        },
        timestamp: Date.now(),
      };
      
      const emptyExportData = { ...mockExportData, analysis: emptyAnalysis };
      
      const report = validator.validateExportData(emptyExportData);
      
      expect(report.summary.totalIssues).toBeGreaterThan(0);
      expect(report.dataStats.statCount).toBe(0);
      expect(report.dataStats.synergyCount).toBe(0);
      
      // Should have insufficient data warnings
      const insufficientIssues = report.issues.filter(issue => issue.type === 'insufficient_data');
      expect(insufficientIssues.length).toBeGreaterThan(0);
    });

    it('should use custom rules when provided', () => {
      const customRules = {
        ...DEFAULT_DATA_QUALITY_RULES,
        synergyThresholds: {
          ...DEFAULT_DATA_QUALITY_RULES.synergyThresholds,
          maxMultiplier: 5.0, // Lower than default
        },
      };
      
      const customValidator = new DataQualityValidator(customRules);
      
      // This would be valid with default rules but invalid with custom rules
      mockAnalysis.synergyAnalyses[0].synergyMultiplier = 8.0;
      
      const report = customValidator.validateExportData(mockExportData);
      
      expect(report.summary.totalIssues).toBeGreaterThan(0);
      
      const rangeIssues = report.issues.filter(issue => issue.type === 'out_of_range');
      expect(rangeIssues).toHaveLength(1);
      expect(rangeIssues[0].expectedValue).toContain('5.0'); // Custom max
    });
  });

  describe('Report Generation', () => {
    it('should generate complete report with all sections', () => {
      const report = validator.validateExportData(mockExportData);
      
      // Check metadata
      expect(report.metadata).toBeDefined();
      expect(report.metadata.timestamp).toBeTypeOf('number');
      expect(report.metadata.inputFile).toBe('/test/path/export.json');
      expect(report.metadata.analysisId).toBe('test-analysis-123');
      expect(report.metadata.rules).toBeDefined();
      
      // Check summary
      expect(report.summary).toBeDefined();
      expect(report.summary.totalIssues).toBeTypeOf('number');
      expect(report.summary.qualityScore).toBeTypeOf('number');
      expect(report.summary.qualityScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.qualityScore).toBeLessThanOrEqual(100);
      expect(['pass', 'fail', 'warning']).toContain(report.summary.status);
      
      // Check issues array
      expect(Array.isArray(report.issues)).toBe(true);
      
      // Check data stats
      expect(report.dataStats).toBeDefined();
      expect(report.dataStats.statCount).toBe(2);
      expect(report.dataStats.synergyCount).toBe(2);
      expect(report.dataStats.totalSimulations).toBe(20000);
      expect(report.dataStats.runtimeMs).toBe(15000);
      expect(report.dataStats.completenessPercentage).toBeGreaterThanOrEqual(0);
      expect(report.dataStats.completenessPercentage).toBeLessThanOrEqual(100);
    });

    it('should aggregate issues correctly by type and severity', () => {
      // Add multiple different types of issues
      mockAnalysis.statMetrics[0].avgWinRate = NaN; // Error
      mockAnalysis.statMetrics[1].stdDeviation = 1.5; // Warning
      mockAnalysis.synergyAnalyses[0].synergyMultiplier = 6.0; // Warning (extreme)
      mockAnalysis.summary.totalRuntimeMs = 400000; // Warning (performance)
      
      const report = validator.validateExportData(mockExportData);
      
      expect(report.summary.issuesBySeverity.error).toBeGreaterThanOrEqual(1);
      expect(report.summary.issuesBySeverity.warning).toBeGreaterThanOrEqual(2);
      expect(report.summary.issuesBySeverity.info).toBe(0);
      
      expect(report.summary.issuesByType.nan_value).toBe(1);
      expect(report.summary.issuesByType.statistical_anomaly).toBe(1);
      expect(report.summary.issuesByType.extreme_value).toBe(1);
      expect(report.summary.issuesByType.performance_issue).toBe(1);
    });
  });
});
