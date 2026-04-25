/**
 * Playwright Test Coverage Reporter – NP-123
 * 
 * Service for analyzing Playwright test coverage with gap detection,
 * priority scoring, and recommendations for untested components.
 * 
 * @since NP-123
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import type {
  CoverageReport,
  CoverageGap,
  TestCoverageEntry,
  CoverageStats,
  CoverageAnalysisConfig,
  ComponentCategory,
  TestType,
  PriorityLevel,
} from './coverageReportConfig';
import {
  DEFAULT_COVERAGE_CONFIG,
  getComponentCategory,
  isCriticalPath,
  isUserFacing,
  calculatePriorityScore,
  getPriorityLevel,
  suggestTestTypes,
  validateCoverageReport,
} from './coverageReportConfig';

/**
 * Component metadata for analysis.
 */
interface ComponentMetadata {
  filePath: string;
  category: ComponentCategory;
  complexity: number;
  dependencyCount: number;
  lastModified: number;
  isCritical: boolean;
  isUserFacing: boolean;
}

/**
 * Test file metadata.
 */
interface TestMetadata {
  filePath: string;
  testType: TestType;
  coveredComponents: string[];
  testCount: number;
  lastModified: number;
}

/**
 * Playwright Coverage Reporter service.
 */
export class PlaywrightCoverageReporter {
  private config: CoverageAnalysisConfig;
  private components: Map<string, ComponentMetadata> = new Map();
  private tests: Map<string, TestMetadata> = new Map();

  constructor(config?: Partial<CoverageAnalysisConfig>) {
    this.config = { ...DEFAULT_COVERAGE_CONFIG, ...config };
  }

  /**
   * Analyzes test coverage and generates report.
   */
  async analyze(): Promise<CoverageReport> {
    await this.scanComponents();
    await this.scanTests();

    const stats = this.calculateStats();
    const gaps = this.identifyGaps();
    const tests = this.getTestCoverageEntries();
    const recommendations = this.generateRecommendations(gaps);

    const report: CoverageReport = {
      timestamp: Date.now(),
      stats,
      tests,
      gaps,
      recommendations,
    };

    return validateCoverageReport(report);
  }

  /**
   * Scans source directories for components.
   */
  private async scanComponents(): Promise<void> {
    this.components.clear();

    for (const sourceDir of this.config.sourceDirs) {
      const pattern = path.join(sourceDir, '**/*.{ts,tsx}');
      const files = await glob(pattern, {
        ignore: this.config.excludePatterns,
        cwd: process.cwd(),
      });

      for (const file of files) {
        const metadata = await this.analyzeComponent(file);
        if (metadata) {
          this.components.set(file, metadata);
        }
      }
    }
  }

  /**
   * Analyzes a single component file.
   */
  private async analyzeComponent(filePath: string): Promise<ComponentMetadata | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);

      const category = getComponentCategory(filePath);
      const complexity = this.estimateComplexity(content);
      const dependencyCount = this.countDependencies(content);
      const lastModified = stats.mtimeMs;
      const isCritical = isCriticalPath(filePath);
      const userFacing = isUserFacing(filePath);

      return {
        filePath,
        category,
        complexity,
        dependencyCount,
        lastModified,
        isCritical,
        isUserFacing: userFacing,
      };
    } catch (error) {
      console.warn(`Failed to analyze component ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Estimates component complexity based on code metrics.
   */
  private estimateComplexity(content: string): number {
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
    const conditionals = (content.match(/if\s*\(|switch\s*\(|case\s+/g) || []).length;
    const loops = (content.match(/for\s*\(|while\s*\(|\.map\(|\.filter\(|\.reduce\(/g) || []).length;

    return lines + (functions * 2) + (conditionals * 3) + (loops * 2);
  }

  /**
   * Counts import dependencies in a file.
   */
  private countDependencies(content: string): number {
    const imports = content.match(/^import\s+.*from\s+['"].*['"]/gm) || [];
    return imports.length;
  }

  /**
   * Scans test directories for test files.
   */
  private async scanTests(): Promise<void> {
    this.tests.clear();

    for (const testDir of this.config.testDirs) {
      const pattern = path.join(testDir, '**/*.spec.ts');
      const files = await glob(pattern, {
        cwd: process.cwd(),
      });

      for (const file of files) {
        const metadata = await this.analyzeTest(file);
        if (metadata) {
          this.tests.set(file, metadata);
        }
      }
    }
  }

  /**
   * Analyzes a single test file.
   */
  private async analyzeTest(filePath: string): Promise<TestMetadata | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);

      const testType = this.detectTestType(filePath);
      const coveredComponents = this.extractCoveredComponents(content, filePath);
      const testCount = this.countTests(content);
      const lastModified = stats.mtimeMs;

      return {
        filePath,
        testType,
        coveredComponents,
        testCount,
        lastModified,
      };
    } catch (error) {
      console.warn(`Failed to analyze test ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Detects test type from file path.
   */
  private detectTestType(filePath: string): TestType {
    if (filePath.includes('/e2e/')) return 'e2e';
    if (filePath.includes('/visual/')) return 'visual';
    if (filePath.includes('/accessibility/')) return 'accessibility';
    if (filePath.includes('/smoke/')) return 'smoke';
    if (filePath.includes('/integration/')) return 'integration';
    return 'e2e';
  }

  /**
   * Extracts covered components from test file.
   */
  private extractCoveredComponents(content: string, testPath: string): string[] {
    const covered = new Set<string>();

    // Extract from imports
    const imports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
    for (const imp of imports) {
      const match = imp.match(/from\s+['"]([^'"]+)['"]/);
      if (match && match[1].startsWith('@/')) {
        const componentPath = match[1].replace('@/', 'src/');
        covered.add(componentPath);
      }
    }

    // Extract from page.goto URLs
    const gotoMatches = content.match(/page\.goto\(['"]([^'"]+)['"]\)/g) || [];
    for (const goto of gotoMatches) {
      const match = goto.match(/page\.goto\(['"]([^'"]+)['"]\)/);
      if (match) {
        const url = match[1];
        const pagePath = this.urlToComponentPath(url);
        if (pagePath) covered.add(pagePath);
      }
    }

    return Array.from(covered);
  }

  /**
   * Maps URL to component path.
   */
  private urlToComponentPath(url: string): string | null {
    const urlMap: Record<string, string> = {
      '/': 'src/ui/landing/MoodboardLanding.tsx',
      '/balancer': 'src/ui/balancing/BalancerPage.tsx',
      '/village': 'src/ui/idleVillage/IdleVillageMapPage.tsx',
      '/punch-club': 'src/ui/punchClub/PunchClubLanding.tsx',
      '/sts': 'src/ui/tools/sts/STSNumericSimulator.tsx',
    };

    return urlMap[url] || null;
  }

  /**
   * Counts test cases in a file.
   */
  private countTests(content: string): number {
    const testMatches = content.match(/test\(|test\.only\(|test\.skip\(/g) || [];
    return testMatches.length;
  }

  /**
   * Calculates coverage statistics.
   */
  private calculateStats(): CoverageStats {
    const totalComponents = this.components.size;
    const testedComponents = new Set<string>();

    for (const test of this.tests.values()) {
      for (const component of test.coveredComponents) {
        if (this.components.has(component)) {
          testedComponents.add(component);
        }
      }
    }

    const tested = testedComponents.size;
    const untested = totalComponents - tested;
    const coveragePercentage = totalComponents > 0 ? (tested / totalComponents) * 100 : 0;

    const byCategory = this.calculateCategoryStats(testedComponents);
    const byTestType = this.calculateTestTypeStats();

    return {
      totalComponents,
      testedComponents: tested,
      untestedComponents: untested,
      coveragePercentage,
      byCategory,
      byTestType,
    };
  }

  /**
   * Calculates coverage by category.
   */
  private calculateCategoryStats(testedComponents: Set<string>) {
    const stats: Record<string, { total: number; tested: number; coverage: number }> = {};

    for (const [filePath, metadata] of this.components) {
      const category = metadata.category;
      if (!stats[category]) {
        stats[category] = { total: 0, tested: 0, coverage: 0 };
      }
      stats[category].total++;
      if (testedComponents.has(filePath)) {
        stats[category].tested++;
      }
    }

    for (const category in stats) {
      const { total, tested } = stats[category];
      stats[category].coverage = total > 0 ? (tested / total) * 100 : 0;
    }

    return stats;
  }

  /**
   * Calculates coverage by test type.
   */
  private calculateTestTypeStats() {
    const stats: Record<string, { testCount: number; componentsCovered: number }> = {};

    for (const test of this.tests.values()) {
      const testType = test.testType;
      if (!stats[testType]) {
        stats[testType] = { testCount: 0, componentsCovered: 0 };
      }
      stats[testType].testCount += test.testCount;
      stats[testType].componentsCovered += test.coveredComponents.length;
    }

    return stats;
  }

  /**
   * Identifies coverage gaps.
   */
  private identifyGaps(): CoverageGap[] {
    const gaps: CoverageGap[] = [];
    const testedComponents = new Set<string>();

    for (const test of this.tests.values()) {
      for (const component of test.coveredComponents) {
        testedComponents.add(component);
      }
    }

    for (const [filePath, metadata] of this.components) {
      if (!testedComponents.has(filePath)) {
        const gap = this.createGap(filePath, metadata);
        gaps.push(gap);
      }
    }

    return gaps.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Creates a coverage gap entry.
   */
  private createGap(filePath: string, metadata: ComponentMetadata): CoverageGap {
    const daysSinceModified = (Date.now() - metadata.lastModified) / (1000 * 60 * 60 * 24);
    const priorityScore = calculatePriorityScore(
      filePath,
      metadata.complexity,
      metadata.dependencyCount,
      daysSinceModified,
      this.config.priorityWeights
    );
    const priority = getPriorityLevel(priorityScore);
    const suggestedTests = suggestTestTypes(
      metadata.category,
      metadata.isUserFacing,
      metadata.isCritical
    );

    const reason = this.generateGapReason(metadata);
    const relatedComponents = this.findRelatedComponents(filePath);

    return {
      componentPath: filePath,
      category: metadata.category,
      priority,
      priorityScore,
      reason,
      suggestedTests,
      relatedComponents,
    };
  }

  /**
   * Generates reason for coverage gap.
   */
  private generateGapReason(metadata: ComponentMetadata): string {
    const reasons: string[] = [];

    if (metadata.isCritical) {
      reasons.push('Critical path component');
    }
    if (metadata.isUserFacing) {
      reasons.push('User-facing component');
    }
    if (metadata.complexity > 200) {
      reasons.push('High complexity');
    }
    if (metadata.dependencyCount > 5) {
      reasons.push('Many dependencies');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'No test coverage';
  }

  /**
   * Finds related components.
   */
  private findRelatedComponents(filePath: string): string[] {
    const related: string[] = [];
    const dirName = path.dirname(filePath);

    for (const [otherPath] of this.components) {
      if (otherPath !== filePath && path.dirname(otherPath) === dirName) {
        related.push(otherPath);
      }
    }

    return related.slice(0, 5);
  }

  /**
   * Gets test coverage entries.
   */
  private getTestCoverageEntries(): TestCoverageEntry[] {
    return Array.from(this.tests.values()).map(test => ({
      testPath: test.filePath,
      testType: test.testType,
      coveredComponents: test.coveredComponents,
      testCount: test.testCount,
      lastModified: test.lastModified,
    }));
  }

  /**
   * Generates recommendations.
   */
  private generateRecommendations(gaps: CoverageGap[]) {
    const recommendations: Array<{
      priority: PriorityLevel;
      components: string[];
      reason: string;
      estimatedEffort: string;
    }> = [];

    const criticalGaps = gaps.filter(g => g.priority === 'critical');
    if (criticalGaps.length > 0) {
      recommendations.push({
        priority: 'critical',
        components: criticalGaps.slice(0, 5).map(g => g.componentPath),
        reason: 'Critical path components without test coverage',
        estimatedEffort: `${criticalGaps.length * 2}h`,
      });
    }

    const highGaps = gaps.filter(g => g.priority === 'high');
    if (highGaps.length > 0) {
      recommendations.push({
        priority: 'high',
        components: highGaps.slice(0, 10).map(g => g.componentPath),
        reason: 'High-priority components need test coverage',
        estimatedEffort: `${highGaps.length * 1.5}h`,
      });
    }

    const userFacingGaps = gaps.filter(g => g.suggestedTests.includes('accessibility'));
    if (userFacingGaps.length > 0) {
      recommendations.push({
        priority: 'high',
        components: userFacingGaps.slice(0, 10).map(g => g.componentPath),
        reason: 'User-facing components need accessibility tests',
        estimatedEffort: `${userFacingGaps.length}h`,
      });
    }

    return recommendations;
  }
}

/**
 * Creates a coverage reporter instance.
 */
export function createCoverageReporter(
  config?: Partial<CoverageAnalysisConfig>
): PlaywrightCoverageReporter {
  return new PlaywrightCoverageReporter(config);
}
