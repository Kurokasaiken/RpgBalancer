/**
 * Playwright Test Coverage Report Configuration – NP-123
 * 
 * Config-first settings for analyzing Playwright test coverage with gap detection,
 * priority scoring, and recommendations for untested components.
 * 
 * @since NP-123
 */

import { z } from 'zod';

/**
 * Component category for coverage analysis.
 */
export const ComponentCategorySchema = z.enum([
  'page',
  'component',
  'hook',
  'utility',
  'service',
  'config',
]);
export type ComponentCategory = z.infer<typeof ComponentCategorySchema>;

/**
 * Test type classification.
 */
export const TestTypeSchema = z.enum([
  'e2e',
  'integration',
  'visual',
  'accessibility',
  'smoke',
  'unit',
]);
export type TestType = z.infer<typeof TestTypeSchema>;

/**
 * Priority level for untested components.
 */
export const PriorityLevelSchema = z.enum(['critical', 'high', 'medium', 'low']);
export type PriorityLevel = z.infer<typeof PriorityLevelSchema>;

/**
 * Coverage gap entry.
 */
export const CoverageGapSchema = z.object({
  /** Component file path */
  componentPath: z.string(),
  /** Component category */
  category: ComponentCategorySchema,
  /** Calculated priority */
  priority: PriorityLevelSchema,
  /** Priority score (0-100) */
  priorityScore: z.number().min(0).max(100),
  /** Reason for gap */
  reason: z.string(),
  /** Suggested test types */
  suggestedTests: z.array(TestTypeSchema),
  /** Related components */
  relatedComponents: z.array(z.string()),
});
export type CoverageGap = z.infer<typeof CoverageGapSchema>;

/**
 * Test coverage entry.
 */
export const TestCoverageEntrySchema = z.object({
  /** Test file path */
  testPath: z.string(),
  /** Test type */
  testType: TestTypeSchema,
  /** Covered components */
  coveredComponents: z.array(z.string()),
  /** Test count */
  testCount: z.number().int().nonnegative(),
  /** Last modified timestamp */
  lastModified: z.number().optional(),
});
export type TestCoverageEntry = z.infer<typeof TestCoverageEntrySchema>;

/**
 * Coverage statistics.
 */
export const CoverageStatsSchema = z.object({
  /** Total components */
  totalComponents: z.number().int().nonnegative(),
  /** Tested components */
  testedComponents: z.number().int().nonnegative(),
  /** Untested components */
  untestedComponents: z.number().int().nonnegative(),
  /** Coverage percentage */
  coveragePercentage: z.number().min(0).max(100),
  /** Coverage by category */
  byCategory: z.record(ComponentCategorySchema, z.object({
    total: z.number().int().nonnegative(),
    tested: z.number().int().nonnegative(),
    coverage: z.number().min(0).max(100),
  })),
  /** Coverage by test type */
  byTestType: z.record(TestTypeSchema, z.object({
    testCount: z.number().int().nonnegative(),
    componentsCovered: z.number().int().nonnegative(),
  })),
});
export type CoverageStats = z.infer<typeof CoverageStatsSchema>;

/**
 * Complete coverage report.
 */
export const CoverageReportSchema = z.object({
  /** Report timestamp */
  timestamp: z.number(),
  /** Coverage statistics */
  stats: CoverageStatsSchema,
  /** Test coverage entries */
  tests: z.array(TestCoverageEntrySchema),
  /** Coverage gaps */
  gaps: z.array(CoverageGapSchema),
  /** Priority recommendations */
  recommendations: z.array(z.object({
    priority: PriorityLevelSchema,
    components: z.array(z.string()),
    reason: z.string(),
    estimatedEffort: z.string(),
  })),
});
export type CoverageReport = z.infer<typeof CoverageReportSchema>;

/**
 * Priority scoring weights.
 */
export const PriorityScoringWeightsSchema = z.object({
  /** Weight for component complexity */
  complexity: z.number().min(0).max(1),
  /** Weight for user-facing components */
  userFacing: z.number().min(0).max(1),
  /** Weight for critical path components */
  criticalPath: z.number().min(0).max(1),
  /** Weight for recent changes */
  recentChanges: z.number().min(0).max(1),
  /** Weight for dependencies */
  dependencies: z.number().min(0).max(1),
});
export type PriorityScoringWeights = z.infer<typeof PriorityScoringWeightsSchema>;

/**
 * Coverage analysis configuration.
 */
export const CoverageAnalysisConfigSchema = z.object({
  /** Source directories to analyze */
  sourceDirs: z.array(z.string()),
  /** Test directories */
  testDirs: z.array(z.string()),
  /** File patterns to include */
  includePatterns: z.array(z.string()),
  /** File patterns to exclude */
  excludePatterns: z.array(z.string()),
  /** Priority scoring weights */
  priorityWeights: PriorityScoringWeightsSchema,
  /** Minimum coverage threshold */
  minCoverageThreshold: z.number().min(0).max(100),
  /** Export formats */
  exportFormats: z.array(z.enum(['json', 'markdown', 'html', 'csv'])),
});
export type CoverageAnalysisConfig = z.infer<typeof CoverageAnalysisConfigSchema>;

/**
 * Default priority scoring weights.
 */
export const DEFAULT_PRIORITY_WEIGHTS: PriorityScoringWeights = {
  complexity: 0.25,
  userFacing: 0.30,
  criticalPath: 0.25,
  recentChanges: 0.10,
  dependencies: 0.10,
};

/**
 * Default coverage analysis configuration.
 */
export const DEFAULT_COVERAGE_CONFIG: CoverageAnalysisConfig = {
  sourceDirs: [
    'src/ui',
    'src/balancing',
    'src/analytics',
    'src/engine',
  ],
  testDirs: [
    'tests',
    'tests/e2e',
    'tests/visual',
    'tests/accessibility',
  ],
  includePatterns: [
    '**/*.tsx',
    '**/*.ts',
  ],
  excludePatterns: [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.d.ts',
    '**/node_modules/**',
    '**/dist/**',
  ],
  priorityWeights: DEFAULT_PRIORITY_WEIGHTS,
  minCoverageThreshold: 70,
  exportFormats: ['json', 'markdown'],
};

/**
 * Component patterns for category detection.
 */
export const COMPONENT_PATTERNS: Record<ComponentCategory, RegExp[]> = {
  page: [
    /\/pages?\//i,
    /Page\.tsx$/,
    /Landing\.tsx$/,
  ],
  component: [
    /\/components?\//i,
    /\.tsx$/,
  ],
  hook: [
    /\/hooks?\//i,
    /^use[A-Z]/,
  ],
  utility: [
    /\/utils?\//i,
    /\/helpers?\//i,
    /Helper\.ts$/,
    /Utils\.ts$/,
  ],
  service: [
    /\/services?\//i,
    /Service\.ts$/,
    /Engine\.ts$/,
    /Manager\.ts$/,
  ],
  config: [
    /\/config\//i,
    /Config\.ts$/,
  ],
};

/**
 * Critical path components (high priority for testing).
 */
export const CRITICAL_PATH_PATTERNS: RegExp[] = [
  /PersistenceService/,
  /BalancerConfigStore/,
  /CrewScheduler/,
  /DragController/,
  /DropValidation/,
  /SessionTagging/,
  /TelemetryExport/,
];

/**
 * User-facing component patterns (high priority for testing).
 */
export const USER_FACING_PATTERNS: RegExp[] = [
  /Dashboard/,
  /Panel/,
  /Modal/,
  /Button/,
  /Form/,
  /Input/,
  /Card/,
  /Landing/,
  /Sandbox/,
];

/**
 * Determines component category from file path.
 */
export function getComponentCategory(filePath: string): ComponentCategory {
  for (const [category, patterns] of Object.entries(COMPONENT_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(filePath))) {
      return category as ComponentCategory;
    }
  }
  return 'utility';
}

/**
 * Checks if component is on critical path.
 */
export function isCriticalPath(filePath: string): boolean {
  return CRITICAL_PATH_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Checks if component is user-facing.
 */
export function isUserFacing(filePath: string): boolean {
  return USER_FACING_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Calculates priority score for a component.
 */
export function calculatePriorityScore(
  filePath: string,
  complexity: number,
  dependencyCount: number,
  daysSinceModified: number,
  weights: PriorityScoringWeights
): number {
  const complexityScore = Math.min(complexity / 100, 1) * weights.complexity;
  const userFacingScore = (isUserFacing(filePath) ? 1 : 0) * weights.userFacing;
  const criticalPathScore = (isCriticalPath(filePath) ? 1 : 0) * weights.criticalPath;
  const recentChangesScore = Math.min(daysSinceModified / 30, 1) * weights.recentChanges;
  const dependenciesScore = Math.min(dependencyCount / 10, 1) * weights.dependencies;

  return Math.round(
    (complexityScore + userFacingScore + criticalPathScore + recentChangesScore + dependenciesScore) * 100
  );
}

/**
 * Determines priority level from score.
 */
export function getPriorityLevel(score: number): PriorityLevel {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

/**
 * Suggests test types for a component.
 */
export function suggestTestTypes(
  category: ComponentCategory,
  isUserFacing: boolean,
  isCritical: boolean
): TestType[] {
  const suggestions: TestType[] = [];

  if (category === 'page' || isUserFacing) {
    suggestions.push('e2e', 'visual', 'accessibility');
  }

  if (category === 'component') {
    suggestions.push('integration', 'visual');
    if (isUserFacing) suggestions.push('accessibility');
  }

  if (category === 'hook' || category === 'service') {
    suggestions.push('unit', 'integration');
  }

  if (category === 'utility' || category === 'config') {
    suggestions.push('unit');
  }

  if (isCritical) {
    suggestions.push('smoke');
  }

  return [...new Set(suggestions)];
}

/**
 * Validates coverage report.
 */
export function validateCoverageReport(report: unknown): CoverageReport {
  return CoverageReportSchema.parse(report);
}
