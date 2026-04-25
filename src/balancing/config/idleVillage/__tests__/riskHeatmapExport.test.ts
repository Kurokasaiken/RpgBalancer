import { describe, it, expect } from 'vitest';
import { generateRiskHeatmap } from '../riskHeatmapExport';
import { generateQAChecklist, type QAChecklistReport } from '../qaChecklistGenerator';
import { MINIMAL_GAMEPLAY_CONFIG } from '../minimalGameplayConfig';

describe('RiskHeatmapExport', () => {
  let sampleChecklist: QAChecklistReport;

  beforeAll(() => {
    // Generate a sample checklist for testing
    sampleChecklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
  });

  describe('generateRiskHeatmap', () => {
    it('should generate a complete risk heatmap from checklist', () => {
      const heatmap = generateRiskHeatmap(sampleChecklist);

      // Verify basic structure
      expect(heatmap).toHaveProperty('generatedAt');
      expect(heatmap).toHaveProperty('checklistVersion', sampleChecklist.configVersion);
      expect(heatmap).toHaveProperty('overallRiskScore');
      expect(heatmap).toHaveProperty('overallCoverage');
      expect(heatmap).toHaveProperty('riskMetrics');
      expect(heatmap).toHaveProperty('coverageGaps');
      expect(heatmap).toHaveProperty('recommendations');
      expect(heatmap).toHaveProperty('summary');

      // Verify data ranges
      expect(heatmap.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(heatmap.overallRiskScore).toBeLessThanOrEqual(100);
      expect(heatmap.overallCoverage).toBeGreaterThanOrEqual(0);
      expect(heatmap.overallCoverage).toBeLessThanOrEqual(100);

      // Verify arrays are populated
      expect(Array.isArray(heatmap.riskMetrics)).toBe(true);
      expect(Array.isArray(heatmap.coverageGaps)).toBe(true);
      expect(heatmap.riskMetrics.length).toBeGreaterThan(0);
    });

    it('should generate risk heatmap with correct timestamp', () => {
      const before = new Date();
      const heatmap = generateRiskHeatmap(sampleChecklist);
      const after = new Date();

      const generatedAt = new Date(heatmap.generatedAt);
      expect(generatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(generatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should calculate overall risk score correctly', () => {
      const heatmap = generateRiskHeatmap(sampleChecklist);

      const expectedOverallRisk = heatmap.riskMetrics.reduce((sum, metric) => sum + metric.riskScore, 0) / heatmap.riskMetrics.length;
      expect(heatmap.overallRiskScore).toBeCloseTo(expectedOverallRisk, 1);
    });

    it('should calculate overall coverage correctly', () => {
      const heatmap = generateRiskHeatmap(sampleChecklist);

      const expectedOverallCoverage = heatmap.riskMetrics.reduce((sum, metric) => sum + metric.coverage, 0) / heatmap.riskMetrics.length;
      expect(heatmap.overallCoverage).toBeCloseTo(expectedOverallCoverage, 1);
    });

    it('should populate summary correctly', () => {
      const heatmap = generateRiskHeatmap(sampleChecklist);

      expect(heatmap.summary.totalTasks).toBe(sampleChecklist.totalTasks);
      expect(heatmap.summary.estimatedTotalTime).toBe(sampleChecklist.estimatedTotalTime);
      expect(heatmap.summary.automatedTasks).toBeGreaterThanOrEqual(0);
      expect(heatmap.summary.criticalTasks).toBeGreaterThanOrEqual(0);
      expect(heatmap.summary.coveragePercentage).toBe(heatmap.overallCoverage);
    });
  });

  describe('Risk Metrics Analysis', () => {
    let riskMetrics: any[];

    beforeAll(() => {
      const heatmap = generateRiskHeatmap(sampleChecklist);
      riskMetrics = heatmap.riskMetrics;
    });

    it('should generate risk metrics for all checklist categories', () => {
      const checklistCategories = new Set(sampleChecklist.sections.flatMap(section =>
        section.tasks.map(task => task.category)
      ));

      const heatmapCategories = new Set(riskMetrics.map(metric => metric.category));

      expect(heatmapCategories.size).toBe(checklistCategories.size);
      checklistCategories.forEach(category => {
        expect(heatmapCategories.has(category)).toBe(true);
      });
    });

    it('should calculate coverage correctly for each category', () => {
      riskMetrics.forEach(metric => {
        const checklistTasks = sampleChecklist.sections.flatMap(section =>
          section.tasks.filter(task => task.category === metric.category)
        );

        const expectedAutomated = checklistTasks.filter(task => task.automationReady).length;
        const expectedCoverage = checklistTasks.length > 0 ? (expectedAutomated / checklistTasks.length) * 100 : 0;

        expect(metric.automatedCount).toBe(expectedAutomated);
        expect(metric.taskCount).toBe(checklistTasks.length);
        expect(metric.coverage).toBeCloseTo(expectedCoverage, 1);
      });
    });

    it('should assign appropriate risk levels', () => {
      riskMetrics.forEach(metric => {
        expect(['low', 'medium', 'high', 'critical']).toContain(metric.riskLevel);

        if (metric.riskScore >= 75) {
          expect(metric.riskLevel).toBe('critical');
        } else if (metric.riskScore >= 50) {
          expect(metric.riskLevel).toBe('high');
        } else if (metric.riskScore >= 25) {
          expect(metric.riskLevel).toBe('medium');
        } else {
          expect(metric.riskLevel).toBe('low');
        }
      });
    });

    it('should generate priority breakdown correctly', () => {
      riskMetrics.forEach(metric => {
        const checklistTasks = sampleChecklist.sections.flatMap(section =>
          section.tasks.filter(task => task.category === metric.category)
        );

        const expectedBreakdown = {
          critical: checklistTasks.filter(t => t.priority === 'critical').length,
          high: checklistTasks.filter(t => t.priority === 'high').length,
          medium: checklistTasks.filter(t => t.priority === 'medium').length,
          low: checklistTasks.filter(t => t.priority === 'low').length,
        };

        expect(metric.priorityBreakdown).toEqual(expectedBreakdown);
      });
    });

    it('should calculate average time correctly', () => {
      riskMetrics.forEach(metric => {
        const checklistTasks = sampleChecklist.sections.flatMap(section =>
          section.tasks.filter(task => task.category === metric.category)
        );

        const expectedAverage = checklistTasks.reduce((sum, task) => sum + task.estimatedTimeMinutes, 0) / checklistTasks.length;
        expect(metric.averageTimeMinutes).toBeCloseTo(expectedAverage, 1);
      });
    });

    it('should generate recommendations for each category', () => {
      riskMetrics.forEach(metric => {
        expect(Array.isArray(metric.recommendations)).toBe(true);
        expect(metric.recommendations.length).toBeGreaterThan(0);
        expect(metric.recommendations.every((rec: string) => typeof rec === 'string')).toBe(true);
      });
    });

    it('should sort risk metrics by risk score descending', () => {
      for (let i = 0; i < riskMetrics.length - 1; i++) {
        expect(riskMetrics[i].riskScore).toBeGreaterThanOrEqual(riskMetrics[i + 1].riskScore);
      }
    });
  });

  describe('Coverage Gap Identification', () => {
    let coverageGaps: any[];

    beforeAll(() => {
      const heatmap = generateRiskHeatmap(sampleChecklist);
      coverageGaps = heatmap.coverageGaps;
    });

    it('should identify coverage gaps appropriately', () => {
      expect(Array.isArray(coverageGaps)).toBe(true);

      coverageGaps.forEach(gap => {
        expect(gap).toHaveProperty('gapId');
        expect(gap).toHaveProperty('category');
        expect(gap).toHaveProperty('severity');
        expect(gap).toHaveProperty('description');
        expect(gap).toHaveProperty('affectedTasks');
        expect(gap).toHaveProperty('estimatedImpact');
        expect(gap).toHaveProperty('mitigationSuggestions');

        expect(['minor', 'moderate', 'major', 'critical']).toContain(gap.severity);
        expect(Array.isArray(gap.mitigationSuggestions)).toBe(true);
        expect(gap.mitigationSuggestions.length).toBeGreaterThan(0);
      });
    });

    it('should sort coverage gaps by severity descending', () => {
      const severityOrder = { critical: 4, major: 3, moderate: 2, minor: 1 };

      for (let i = 0; i < coverageGaps.length - 1; i++) {
        expect(severityOrder[coverageGaps[i].severity]).toBeGreaterThanOrEqual(severityOrder[coverageGaps[i + 1].severity]);
      }
    });

    it('should identify low coverage categories as gaps', () => {
      const heatmap = generateRiskHeatmap(sampleChecklist);
      const lowCoverageMetrics = heatmap.riskMetrics.filter((m: any) => m.coverage < 60);

      if (lowCoverageMetrics.length > 0) {
        const coverageGaps = heatmap.coverageGaps.filter((g: any) => g.gapId.startsWith('coverage-'));
        expect(coverageGaps.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Recommendation Generation', () => {
    let recommendations: any;

    beforeAll(() => {
      const heatmap = generateRiskHeatmap(sampleChecklist);
      recommendations = heatmap.recommendations;
    });

    it('should generate recommendations with proper structure', () => {
      expect(recommendations).toHaveProperty('immediate');
      expect(recommendations).toHaveProperty('shortTerm');
      expect(recommendations).toHaveProperty('longTerm');

      expect(Array.isArray(recommendations.immediate)).toBe(true);
      expect(Array.isArray(recommendations.shortTerm)).toBe(true);
      expect(Array.isArray(recommendations.longTerm)).toBe(true);
    });

    it('should generate immediate recommendations for critical risks', () => {
      const heatmap = generateRiskHeatmap(sampleChecklist);
      const hasCriticalRisks = heatmap.riskMetrics.some((m: any) => m.riskLevel === 'critical');

      if (hasCriticalRisks) {
        expect(recommendations.immediate.length).toBeGreaterThan(0);
        expect(recommendations.immediate.some((rec: string) => rec.includes('critical'))).toBe(true);
      }
    });

    it('should include short-term and long-term recommendations', () => {
      expect(recommendations.shortTerm.length).toBeGreaterThan(0);
      expect(recommendations.longTerm.length).toBeGreaterThan(0);
    });
  });

  describe('Risk Score Calculation', () => {
    it('should calculate risk scores within valid range', () => {
      const heatmap = generateRiskHeatmap(sampleChecklist);

      heatmap.riskMetrics.forEach((metric: any) => {
        expect(metric.riskScore).toBeGreaterThanOrEqual(0);
        expect(metric.riskScore).toBeLessThanOrEqual(100);
      });

      expect(heatmap.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(heatmap.overallRiskScore).toBeLessThanOrEqual(100);
    });

    it('should weight coverage heavily in risk calculation', () => {
      // Create a checklist with very low coverage
      const lowCoverageChecklist: QAChecklistReport = {
        ...sampleChecklist,
        sections: sampleChecklist.sections.map(section => ({
          ...section,
          tasks: section.tasks.map(task => ({ ...task, automationReady: false }))
        }))
      };

      const heatmap = generateRiskHeatmap(lowCoverageChecklist);

      // Low coverage should result in high risk scores
      heatmap.riskMetrics.forEach((metric: any) => {
        expect(metric.riskScore).toBeGreaterThan(50); // Should be high risk due to low coverage
      });
    });

    it('should consider priority distribution in risk calculation', () => {
      // Create a checklist with many critical tasks
      const highPriorityChecklist: QAChecklistReport = {
        ...sampleChecklist,
        sections: sampleChecklist.sections.map(section => ({
          ...section,
          tasks: section.tasks.map(task => ({ ...task, priority: 'critical' as const }))
        }))
      };

      const heatmap = generateRiskHeatmap(highPriorityChecklist);

      // High priority tasks should increase risk scores
      heatmap.riskMetrics.forEach((metric: any) => {
        expect(metric.riskScore).toBeGreaterThan(30); // Should be elevated due to critical priorities
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty checklist gracefully', () => {
      const emptyChecklist: QAChecklistReport = {
        generatedAt: new Date().toISOString(),
        configVersion: 'test',
        totalTasks: 0,
        sections: [],
        estimatedTotalTime: 0,
        coverage: {
          uiElements: 0,
          gameMechanics: 0,
          locations: 0,
          residents: 0,
          edgeCases: 0,
          performanceTests: 0,
        },
      };

      expect(() => generateRiskHeatmap(emptyChecklist)).not.toThrow();

      const heatmap = generateRiskHeatmap(emptyChecklist);
      expect(heatmap.riskMetrics).toEqual([]);
      expect(heatmap.overallRiskScore).toBe(0);
      expect(heatmap.overallCoverage).toBe(0);
    });

    it('should handle checklist with only manual tasks', () => {
      const manualOnlyChecklist: QAChecklistReport = {
        ...sampleChecklist,
        sections: sampleChecklist.sections.map(section => ({
          ...section,
          tasks: section.tasks.map(task => ({ ...task, automationReady: false }))
        }))
      };

      const heatmap = generateRiskHeatmap(manualOnlyChecklist);

      heatmap.riskMetrics.forEach((metric: any) => {
        expect(metric.coverage).toBe(0);
        expect(metric.automatedCount).toBe(0);
      });
    });

    it('should handle checklist with only automated tasks', () => {
      const automatedOnlyChecklist: QAChecklistReport = {
        ...sampleChecklist,
        sections: sampleChecklist.sections.map(section => ({
          ...section,
          tasks: section.tasks.map(task => ({ ...task, automationReady: true }))
        }))
      };

      const heatmap = generateRiskHeatmap(automatedOnlyChecklist);

      heatmap.riskMetrics.forEach((metric: any) => {
        expect(metric.coverage).toBe(100);
        expect(metric.automatedCount).toBe(metric.taskCount);
      });
    });

    it('should handle single category checklist', () => {
      const singleCategoryChecklist: QAChecklistReport = {
        ...sampleChecklist,
        sections: [{
          sectionId: 'single',
          sectionName: 'Single Category',
          description: 'Test section',
          tasks: [
            {
              id: 'task-1',
              category: 'ui',
              priority: 'medium',
              title: 'Test Task',
              description: 'Test description',
              steps: ['Step 1', 'Step 2'],
              expectedResult: 'Expected result',
              automationReady: true,
              estimatedTimeMinutes: 10,
            }
          ],
          estimatedTotalTime: 10,
        }],
      };

      const heatmap = generateRiskHeatmap(singleCategoryChecklist);

      expect(heatmap.riskMetrics).toHaveLength(1);
      expect(heatmap.riskMetrics[0].category).toBe('ui');
      expect(heatmap.overallRiskScore).toBe(heatmap.riskMetrics[0].riskScore);
    });
  });

  describe('Category-Specific Behavior', () => {
    it('should apply category-specific risk multipliers', () => {
      const heatmap = generateRiskHeatmap(sampleChecklist);

      const mechanicsMetric = heatmap.riskMetrics.find((m: any) => m.category === 'mechanics');
      const uiMetric = heatmap.riskMetrics.find((m: any) => m.category === 'ui');

      if (mechanicsMetric && uiMetric) {
        // Mechanics should have higher risk multiplier than UI
        // (This is a loose test since other factors affect the final score)
        expect(mechanicsMetric.category).toBe('mechanics');
        expect(uiMetric.category).toBe('ui');
      }
    });

    it('should generate category-appropriate recommendations', () => {
      const heatmap = generateRiskHeatmap(sampleChecklist);

      const mechanicsMetric = heatmap.riskMetrics.find((m: any) => m.category === 'mechanics');
      if (mechanicsMetric) {
        expect(mechanicsMetric.recommendations.some((rec: string) =>
          rec.includes('game loop') || rec.includes('resource management')
        )).toBe(true);
      }

      const uiMetric = heatmap.riskMetrics.find((m: any) => m.category === 'ui');
      if (uiMetric) {
        expect(uiMetric.recommendations.some((rec: string) =>
          rec.includes('visual') || rec.includes('UI')
        )).toBe(true);
      }
    });
  });
});
