/**
 * Minimal Gameplay Risk Heatmap Export
 *
 * Analyzes QA checklist data to generate risk heatmaps and coverage analysis.
 * Identifies high-risk areas and coverage gaps for QA prioritization.
 */

import type { QAChecklistReport, QAChecklistTask, QAChecklistSection } from '@/balancing/config/idleVillage/qaChecklistGenerator';

export interface RiskMetric {
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  coverage: number; // 0-100 percentage
  taskCount: number;
  automatedCount: number;
  priorityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  averageTimeMinutes: number;
  riskScore: number; // Calculated risk score 0-100
  recommendations: string[];
}

export interface CoverageGap {
  gapId: string;
  category: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  affectedTasks: number;
  estimatedImpact: string;
  mitigationSuggestions: string[];
}

export interface RiskHeatmapData {
  generatedAt: string;
  checklistVersion: string;
  overallRiskScore: number;
  overallCoverage: number;
  riskMetrics: RiskMetric[];
  coverageGaps: CoverageGap[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  summary: {
    totalTasks: number;
    automatedTasks: number;
    criticalTasks: number;
    coveragePercentage: number;
    estimatedTotalTime: number;
  };
}

/**
 * Generates risk heatmap data from QA checklist analysis
 */
export function generateRiskHeatmap(checklist: QAChecklistReport): RiskHeatmapData {
  const riskMetrics = analyzeRiskMetrics(checklist);
  const coverageGaps = identifyCoverageGaps(checklist, riskMetrics);
  const recommendations = generateRecommendations(riskMetrics, coverageGaps);

  const overallRiskScore = calculateOverallRiskScore(riskMetrics);
  const overallCoverage = calculateOverallCoverage(riskMetrics);

  const summary = {
    totalTasks: checklist.totalTasks,
    automatedTasks: checklist.sections.reduce((sum, section) =>
      sum + section.tasks.filter(t => t.automationReady).length, 0),
    criticalTasks: checklist.sections.reduce((sum, section) =>
      sum + section.tasks.filter(t => t.priority === 'critical').length, 0),
    coveragePercentage: overallCoverage,
    estimatedTotalTime: checklist.estimatedTotalTime,
  };

  return {
    generatedAt: new Date().toISOString(),
    checklistVersion: checklist.configVersion,
    overallRiskScore,
    overallCoverage,
    riskMetrics,
    coverageGaps,
    recommendations,
    summary,
  };
}

/**
 * Analyzes risk metrics for each category
 */
function analyzeRiskMetrics(checklist: QAChecklistReport): RiskMetric[] {
  const categoryMap = new Map<string, QAChecklistTask[]>();

  // Group tasks by category
  checklist.sections.forEach(section => {
    section.tasks.forEach(task => {
      if (!categoryMap.has(task.category)) {
        categoryMap.set(task.category, []);
      }
      categoryMap.get(task.category)!.push(task);
    });
  });

  const riskMetrics: RiskMetric[] = [];

  categoryMap.forEach((tasks, category) => {
    const taskCount = tasks.length;
    const automatedCount = tasks.filter(t => t.automationReady).length;
    const coverage = taskCount > 0 ? (automatedCount / taskCount) * 100 : 0;

    const priorityBreakdown = {
      critical: tasks.filter(t => t.priority === 'critical').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };

    const averageTimeMinutes = tasks.reduce((sum, t) => sum + t.estimatedTimeMinutes, 0) / taskCount;

    // Calculate risk score based on multiple factors
    const riskScore = calculateCategoryRiskScore(category, coverage, priorityBreakdown, averageTimeMinutes);

    const riskLevel = getRiskLevel(riskScore);
    const recommendations = generateCategoryRecommendations(category, coverage, priorityBreakdown);

    riskMetrics.push({
      category,
      riskLevel,
      coverage,
      taskCount,
      automatedCount,
      priorityBreakdown,
      averageTimeMinutes,
      riskScore,
      recommendations,
    });
  });

  return riskMetrics.sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Calculates risk score for a category
 */
function calculateCategoryRiskScore(
  category: string,
  coverage: number,
  priorityBreakdown: RiskMetric['priorityBreakdown'],
  averageTimeMinutes: number
): number {
  // Base risk factors
  const coverageFactor = (100 - coverage) / 100; // Higher risk with lower coverage
  const priorityFactor = (
    priorityBreakdown.critical * 1.0 +
    priorityBreakdown.high * 0.7 +
    priorityBreakdown.medium * 0.4 +
    priorityBreakdown.low * 0.1
  ) / Math.max(1, priorityBreakdown.critical + priorityBreakdown.high + priorityBreakdown.medium + priorityBreakdown.low);

  // Category-specific multipliers
  const categoryMultipliers: Record<string, number> = {
    'mechanics': 1.2,    // Core gameplay mechanics are high risk
    'ui': 0.8,           // UI issues are visible but often less critical
    'locations': 1.0,    // Activity execution is core functionality
    'residents': 1.0,    // Resident mechanics are important
    'performance': 1.1,  // Performance issues affect user experience
    'edge-cases': 0.9,   // Edge cases are important but less frequent
  };

  const categoryMultiplier = categoryMultipliers[category] || 1.0;

  // Time complexity factor (longer tasks might indicate complexity)
  const timeFactor = Math.min(averageTimeMinutes / 30, 1); // Cap at 30 minutes

  // Calculate weighted risk score
  const riskScore = (
    coverageFactor * 40 +      // 40% weight on coverage
    priorityFactor * 35 +      // 35% weight on priority
    timeFactor * 15 +          // 15% weight on complexity
    categoryMultiplier * 10    // 10% weight on category
  );

  return Math.min(100, Math.max(0, riskScore));
}

/**
 * Determines risk level from risk score
 */
function getRiskLevel(riskScore: number): RiskMetric['riskLevel'] {
  if (riskScore >= 75) return 'critical';
  if (riskScore >= 50) return 'high';
  if (riskScore >= 25) return 'medium';
  return 'low';
}

/**
 * Generates recommendations for a category
 */
function generateCategoryRecommendations(
  category: string,
  coverage: number,
  priorityBreakdown: RiskMetric['priorityBreakdown']
): string[] {
  const recommendations: string[] = [];

  if (coverage < 50) {
    recommendations.push(`Increase automated test coverage for ${category} from ${coverage.toFixed(1)}% to at least 70%`);
  }

  if (priorityBreakdown.critical > 0) {
    recommendations.push(`Prioritize testing of ${priorityBreakdown.critical} critical ${category} tasks`);
  }

  if (priorityBreakdown.high > priorityBreakdown.critical) {
    recommendations.push(`Address ${priorityBreakdown.high} high-priority ${category} tasks in next sprint`);
  }

  // Category-specific recommendations
  switch (category) {
    case 'mechanics':
      recommendations.push('Focus on game loop stability and resource management testing');
      break;
    case 'ui':
      recommendations.push('Ensure visual regression testing for UI components');
      break;
    case 'locations':
      recommendations.push('Test activity execution flows and reward calculations');
      break;
    case 'residents':
      recommendations.push('Validate stat-based mechanics and fatigue systems');
      break;
    case 'performance':
      recommendations.push('Implement performance monitoring and benchmarking');
      break;
    case 'edge-cases':
      recommendations.push('Create comprehensive edge case test scenarios');
      break;
  }

  return recommendations;
}

/**
 * Identifies coverage gaps in the QA checklist
 */
function identifyCoverageGaps(checklist: QAChecklistReport, riskMetrics: RiskMetric[]): CoverageGap[] {
  const gaps: CoverageGap[] = [];

  // Check for categories with low coverage
  riskMetrics.forEach(metric => {
    if (metric.coverage < 60) {
      const severity = metric.riskLevel === 'critical' ? 'critical' :
                      metric.riskLevel === 'high' ? 'major' : 'moderate';

      gaps.push({
        gapId: `coverage-${metric.category}`,
        category: metric.category,
        severity: severity as CoverageGap['severity'],
        description: `${metric.category} has only ${metric.coverage.toFixed(1)}% test coverage`,
        affectedTasks: metric.taskCount,
        estimatedImpact: `High risk of undetected ${metric.category} issues in production`,
        mitigationSuggestions: [
          `Implement automated tests for ${metric.taskCount - metric.automatedCount} manual tasks`,
          'Create test templates for common ' + metric.category + ' scenarios',
          'Review and prioritize remaining manual test cases',
        ],
      });
    }
  });

  // Check for missing critical functionality tests
  const criticalTasks = checklist.sections.reduce((sum, section) =>
    sum + section.tasks.filter(t => t.priority === 'critical').length, 0);

  if (criticalTasks === 0) {
    gaps.push({
      gapId: 'no-critical-tests',
      category: 'general',
      severity: 'critical',
      description: 'No critical-priority test cases identified',
      affectedTasks: 0,
      estimatedImpact: 'Core functionality lacks adequate testing coverage',
      mitigationSuggestions: [
        'Review QA checklist generation for missing critical tasks',
        'Manually identify and add critical test scenarios',
        'Implement automated smoke tests for core functionality',
      ],
    });
  }

  // Check for automation gaps
  const lowAutomationCategories = riskMetrics.filter(m => m.coverage < 30);
  if (lowAutomationCategories.length > 2) {
    gaps.push({
      gapId: 'automation-gap',
      category: 'automation',
      severity: 'major',
      description: `${lowAutomationCategories.length} categories have less than 30% automation coverage`,
      affectedTasks: lowAutomationCategories.reduce((sum, m) => sum + m.taskCount, 0),
      estimatedImpact: 'Heavy reliance on manual testing increases risk of human error',
      mitigationSuggestions: [
        'Invest in test automation framework improvements',
        'Prioritize automation for high-risk, repetitive test scenarios',
        'Train team on automated testing best practices',
      ],
    });
  }

  // Check for time estimation gaps
  const longRunningTasks = checklist.sections.reduce((sum, section) =>
    sum + section.tasks.filter(t => t.estimatedTimeMinutes > 20).length, 0);

  if (longRunningTasks > checklist.totalTasks * 0.2) {
    gaps.push({
      gapId: 'complexity-gap',
      category: 'complexity',
      severity: 'moderate',
      description: `${longRunningTasks} tasks take more than 20 minutes each`,
      affectedTasks: longRunningTasks,
      estimatedImpact: 'Extended testing cycles and potential tester fatigue',
      mitigationSuggestions: [
        'Break down complex test scenarios into smaller, focused tests',
        'Implement parallel test execution where possible',
        'Review and optimize lengthy test procedures',
      ],
    });
  }

  return gaps.sort((a, b) => {
    const severityOrder = { critical: 4, major: 3, moderate: 2, minor: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

/**
 * Generates overall recommendations
 */
function generateRecommendations(riskMetrics: RiskMetric[], coverageGaps: CoverageGap[]): RiskHeatmapData['recommendations'] {
  const immediate: string[] = [];
  const shortTerm: string[] = [];
  const longTerm: string[] = [];

  // Immediate actions for critical risks
  const criticalMetrics = riskMetrics.filter(m => m.riskLevel === 'critical');
  if (criticalMetrics.length > 0) {
    immediate.push(`Address ${criticalMetrics.length} critical risk areas immediately`);
    criticalMetrics.forEach(metric => {
      immediate.push(`Fix ${metric.category} coverage (${metric.coverage.toFixed(1)}%)`);
    });
  }

  // Immediate actions for major gaps
  const majorGaps = coverageGaps.filter(g => g.severity === 'major' || g.severity === 'critical');
  majorGaps.forEach(gap => {
    immediate.push(gap.mitigationSuggestions[0]); // Take first suggestion
  });

  // Short-term improvements
  const mediumRiskMetrics = riskMetrics.filter(m => m.riskLevel === 'medium');
  if (mediumRiskMetrics.length > 0) {
    shortTerm.push(`Improve ${mediumRiskMetrics.length} medium-risk areas within 2 weeks`);
  }

  shortTerm.push('Implement automated test reporting and dashboards');
  shortTerm.push('Establish QA coverage metrics and monitoring');

  // Long-term strategic improvements
  longTerm.push('Develop comprehensive test automation framework');
  longTerm.push('Implement shift-left testing practices');
  longTerm.push('Establish continuous testing in CI/CD pipeline');
  longTerm.push('Create test data management and environment strategy');

  // Add specific recommendations based on gaps
  if (coverageGaps.some(g => g.gapId === 'automation-gap')) {
    longTerm.push('Invest in test automation tooling and training');
  }

  return { immediate, shortTerm, longTerm };
}

/**
 * Calculates overall risk score
 */
function calculateOverallRiskScore(riskMetrics: RiskMetric[]): number {
  if (riskMetrics.length === 0) return 0;

  const totalScore = riskMetrics.reduce((sum, metric) => sum + metric.riskScore, 0);
  return totalScore / riskMetrics.length;
}

/**
 * Calculates overall coverage percentage
 */
function calculateOverallCoverage(riskMetrics: RiskMetric[]): number {
  if (riskMetrics.length === 0) return 0;

  const totalCoverage = riskMetrics.reduce((sum, metric) => sum + metric.coverage, 0);
  return totalCoverage / riskMetrics.length;
}
