# Playwright Test Coverage Reporter – NP-123

## Overview

Config-first system for analyzing Playwright test coverage with gap detection, priority scoring, and actionable recommendations for untested components.

## Features

### Coverage Analysis
- **Component Scanning**: Analyzes all source files in configured directories
- **Test Mapping**: Maps test files to covered components
- **Gap Detection**: Identifies untested components with priority scoring
- **Category Analysis**: Coverage breakdown by component type (page, component, hook, utility, service, config)
- **Test Type Analysis**: Coverage breakdown by test type (e2e, visual, accessibility, smoke, integration, unit)

### Priority Scoring
Components are scored 0-100 based on:
- **Complexity** (25%): Lines of code, functions, conditionals, loops
- **User-Facing** (30%): Dashboard, Panel, Modal, Button, Form, Input, Card components
- **Critical Path** (25%): PersistenceService, BalancerConfigStore, CrewScheduler, DragController
- **Recent Changes** (10%): Days since last modification
- **Dependencies** (10%): Number of import statements

Priority levels:
- **Critical**: Score ≥ 75
- **High**: Score ≥ 50
- **Medium**: Score ≥ 25
- **Low**: Score < 25

### Export Formats
- **JSON**: Complete structured data
- **Markdown**: Human-readable report with tables
- **HTML**: Interactive web report with styling
- **CSV**: Gap analysis for spreadsheet tools

## Usage

### CLI Commands

#### Analyze Coverage
```bash
npm run coverage:analyze

# With options
npm run coverage:analyze -- --output test-results --format json markdown html --min-coverage 70
```

Options:
- `-o, --output <path>`: Output directory (default: test-results)
- `-f, --format <formats...>`: Export formats (default: json, markdown)
- `--min-coverage <number>`: Minimum coverage threshold (default: 70)
- `--verbose`: Verbose output

#### Show Gaps Only
```bash
npm run coverage:gaps

# With filters
npm run coverage:gaps -- --priority critical --category component --limit 10
```

Options:
- `--priority <level>`: Filter by priority (critical, high, medium, low)
- `--category <category>`: Filter by category (page, component, hook, utility, service, config)
- `--limit <number>`: Limit results (default: 20)

#### Show Statistics
```bash
npm run coverage:stats
```

### Programmatic Usage

```typescript
import { createCoverageReporter } from '@/analytics/testing/playwrightCoverageReporter';

const reporter = createCoverageReporter({
  minCoverageThreshold: 80,
  exportFormats: ['json', 'markdown'],
  priorityWeights: {
    complexity: 0.25,
    userFacing: 0.30,
    criticalPath: 0.25,
    recentChanges: 0.10,
    dependencies: 0.10,
  },
});

const report = await reporter.analyze();

console.log(`Coverage: ${report.stats.coveragePercentage.toFixed(2)}%`);
console.log(`Gaps: ${report.gaps.length}`);
```

## Configuration

### Default Configuration

```typescript
{
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
  minCoverageThreshold: 70,
  exportFormats: ['json', 'markdown'],
}
```

### Custom Configuration

```typescript
const reporter = createCoverageReporter({
  sourceDirs: ['src/ui/idleVillage'],
  testDirs: ['tests/e2e/idleVillage'],
  minCoverageThreshold: 80,
  priorityWeights: {
    complexity: 0.20,
    userFacing: 0.40,
    criticalPath: 0.30,
    recentChanges: 0.05,
    dependencies: 0.05,
  },
});
```

## Report Structure

### Coverage Statistics
```typescript
{
  totalComponents: number;
  testedComponents: number;
  untestedComponents: number;
  coveragePercentage: number;
  byCategory: Record<ComponentCategory, {
    total: number;
    tested: number;
    coverage: number;
  }>;
  byTestType: Record<TestType, {
    testCount: number;
    componentsCovered: number;
  }>;
}
```

### Coverage Gap
```typescript
{
  componentPath: string;
  category: ComponentCategory;
  priority: PriorityLevel;
  priorityScore: number;
  reason: string;
  suggestedTests: TestType[];
  relatedComponents: string[];
}
```

### Recommendations
```typescript
{
  priority: PriorityLevel;
  components: string[];
  reason: string;
  estimatedEffort: string;
}
```

## Test Type Suggestions

Based on component category and characteristics:

| Component Type | User-Facing | Critical | Suggested Tests |
|----------------|-------------|----------|-----------------|
| Page | Yes | - | e2e, visual, accessibility |
| Component | Yes | - | integration, visual, accessibility |
| Component | No | - | integration, visual |
| Hook | - | - | unit, integration |
| Service | - | Yes | unit, integration, smoke |
| Utility | - | - | unit |
| Config | - | - | unit |

## Integration

### CI/CD Pipeline
```yaml
- name: Analyze Test Coverage
  run: npm run coverage:analyze -- --min-coverage 70
  continue-on-error: true

- name: Upload Coverage Report
  uses: actions/upload-artifact@v3
  with:
    name: coverage-report
    path: test-results/playwright-coverage-*.md
```

### Pre-commit Hook
```bash
#!/bin/bash
npm run coverage:analyze -- --format json
COVERAGE=$(jq -r '.stats.coveragePercentage' test-results/playwright-coverage-*.json)
if (( $(echo "$COVERAGE < 70" | bc -l) )); then
  echo "Coverage below threshold: $COVERAGE%"
  exit 1
fi
```

## Telemetry

The reporter emits the following telemetry event:

```typescript
window.dispatchEvent(new CustomEvent('playwright_coverage_analyzed', {
  detail: {
    timestamp: number;
    coveragePercentage: number;
    gapsCount: number;
    recommendationsCount: number;
  },
}));
```

## Performance

- **Component Scanning**: ~100ms per 100 components
- **Test Analysis**: ~50ms per 50 test files
- **Report Generation**: <100ms
- **Total Analysis**: <1s for typical project

## Troubleshooting

### High False Positive Rate
- Adjust `excludePatterns` to skip generated files
- Refine `COMPONENT_PATTERNS` in config
- Update `urlToComponentPath` mapping for custom routes

### Low Coverage Scores
- Check `sourceDirs` includes all relevant directories
- Verify `testDirs` includes all test locations
- Review test file naming conventions (must end in `.spec.ts`)

### Incorrect Priority Scores
- Adjust `priorityWeights` to match project priorities
- Update `CRITICAL_PATH_PATTERNS` for project-specific critical components
- Modify `USER_FACING_PATTERNS` for custom UI patterns

## Examples

### Example Report Output
```
📊 Coverage Statistics:
  Total Components: 450
  Tested Components: 315
  Untested Components: 135
  Coverage: 70.00%

📋 Coverage by Category:
  page: 25/30 (83.33%)
  component: 180/250 (72.00%)
  hook: 45/60 (75.00%)
  utility: 40/60 (66.67%)
  service: 20/40 (50.00%)
  config: 5/10 (50.00%)

🧪 Coverage by Test Type:
  e2e: 45 tests, 120 components
  visual: 15 tests, 50 components
  integration: 30 tests, 80 components
  unit: 60 tests, 65 components

🔴 Top 10 Coverage Gaps:
  [CRITICAL] src/shared/persistence/PersistenceService.ts
    Score: 85, Reason: Critical path component
    Suggested: unit, integration, smoke

  [HIGH] src/ui/idleVillage/components/CrewSchedulerPanel.tsx
    Score: 72, Reason: User-facing component, High complexity
    Suggested: integration, visual, accessibility
```

## Related Documentation

- [Playwright Configuration](../../playwright.config.ts)
- [Testing Guidelines](../TESTING_GUIDELINES.md)
- [E2E-VRT-001 Physical Testing System](../plans/physical_e2e_testing_plan.md)
