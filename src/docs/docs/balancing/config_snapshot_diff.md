# Config Snapshot Diff Tool Documentation

## Overview

The Config Snapshot Diff Tool provides semantic comparison and impact analysis for balancer configuration snapshots. It enables designers to understand the impact of configuration changes before deployment.

**Task**: NP-122 – Config Snapshot Diff Tool  
**Agent**: Vector-Balancer – Snapshot Diff  
**Estimated Duration**: 140 minutes  
**Dependencies**: BalancerConfigStore

## Features

### Core Functionality
- **Semantic Comparison**: Deep diff with configurable comparison rules
- **Impact Analysis**: Automatic severity assessment for changes
- **Breaking Change Detection**: Identifies changes that may break existing systems
- **Formula Analysis**: Tracks formula changes and dependencies
- **Weight Analysis**: Monitors weight changes and affected archetypes
- **CLI Tool**: Command-line interface for automation
- **React Component**: Visual diff report for UI integration

### Comparison Features
- Float precision tolerance
- Metadata filtering
- Timestamp ignoring
- Semantic rules for specific paths
- Wildcard path matching

### Impact Levels
- **Critical** 🔴: Breaking changes, major formula rewrites
- **High** 🟠: Significant changes to core mechanics
- **Medium** 🟡: Moderate changes to balance
- **Low** 🟢: Minor tweaks and adjustments
- **None** ⚪: Cosmetic or metadata changes

## Architecture

### Components

#### `snapshotDiffConfig.ts`
Configuration and types for diff system:
- Diff entry structures
- Impact severity levels
- Change categories
- Semantic comparison rules
- Utility functions

#### `configSnapshotDiff.ts`
CLI tool for generating diff reports:
- Snapshot loading from BalancerConfigStore
- Deep diff algorithm
- Impact analysis engine
- Report formatting (JSON/Markdown)
- Export functionality

#### `SnapshotDiffReport.tsx`
React component for visual diff reports:
- Summary statistics
- Breaking changes display
- Categorized changes
- Filtering and sorting
- Interactive UI

## Usage

### CLI Tool

**Compare Latest Two Snapshots**:
```bash
tsx scripts/balancer/configSnapshotDiff.ts --latest
```

**Compare Specific Snapshots**:
```bash
tsx scripts/balancer/configSnapshotDiff.ts \
  --snapshot1 1706048400000 \
  --snapshot2 1706052000000
```

**Export to File**:
```bash
tsx scripts/balancer/configSnapshotDiff.ts \
  --latest \
  --export report.md \
  --format markdown
```

**Filter by Impact**:
```bash
tsx scripts/balancer/configSnapshotDiff.ts \
  --latest \
  --min-impact high \
  --verbose
```

**Disable Analysis**:
```bash
tsx scripts/balancer/configSnapshotDiff.ts \
  --latest \
  --no-analysis
```

### React Component

```typescript
import { SnapshotDiffReport } from '@/ui/balancing/SnapshotDiffReport';
import type { DiffReport } from '@/balancing/config/snapshotDiffConfig';

function MyComponent() {
  const [report, setReport] = useState<DiffReport | null>(null);

  // Load report from CLI output or generate programmatically
  
  return (
    <SnapshotDiffReport
      report={report}
      onClose={() => setReport(null)}
    />
  );
}
```

## Configuration

### Default Config

```typescript
{
  comparison: {
    ignoreMetadata: false,
    ignoreTimestamps: true,
    ignoreDescriptions: true,
    floatPrecision: 0.0001,
    semanticComparison: true,
  },
  impact: {
    enableAnalysis: true,
    detectBreakingChanges: true,
    analyzeFormulas: true,
    analyzeWeights: true,
    weightChangeThreshold: 10, // 10% change
  },
  output: {
    format: 'markdown',
    includeUnchanged: false,
    groupByCategory: true,
    sortBy: 'impact',
    colorize: true,
  },
  filters: {
    minImpact: 'none',
    categories: ['stat', 'card', 'preset', 'formula', 'weight', 'metadata'],
    changeTypes: ['added', 'removed', 'modified'],
  },
}
```

### Semantic Rules

Semantic rules define custom comparison logic for specific paths:

```typescript
{
  path: 'stats.*.weight',
  comparator: (a, b) => Math.abs(a - b) < 0.0001,
  impactCalculator: (a, b) => {
    const change = Math.abs((b - a) / a) * 100;
    if (change > 50) return 'critical';
    if (change > 25) return 'high';
    if (change > 10) return 'medium';
    return 'low';
  },
}
```

**Default Rules**:
- `stats.*.weight`: Float comparison with impact based on percentage change
- `stats.*.formula`: String comparison with similarity-based impact
- `stats.*.baseStat`: Boolean comparison (always high impact)
- `stats.*.isDerived`: Boolean comparison (always high impact)

## Diff Report Structure

### Report Schema

```typescript
{
  timestamp: number;
  snapshotA: {
    timestamp: number;
    description: string;
    checksum?: string;
  };
  snapshotB: {
    timestamp: number;
    description: string;
    checksum?: string;
  };
  summary: {
    totalChanges: number;
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
    criticalImpact: number;
    highImpact: number;
    mediumImpact: number;
    lowImpact: number;
    categoryCounts: Record<ChangeCategory, number>;
  };
  changes: DiffEntry[];
  impactAnalysis: {
    affectedStats: string[];
    affectedCards: string[];
    affectedPresets: string[];
    formulaChanges: FormulaImpact[];
    weightChanges: WeightImpact[];
    breakingChanges: BreakingChange[];
    recommendations: string[];
  };
}
```

### Diff Entry

```typescript
{
  path: string;                    // e.g., "stats.strength.weight"
  category: ChangeCategory;        // stat, card, preset, formula, weight, metadata
  changeType: DiffChangeType;      // added, removed, modified, unchanged
  oldValue: unknown;
  newValue: unknown;
  impact: ImpactSeverity;          // critical, high, medium, low, none
  description: string;             // Human-readable description
  affectedItems: string[];         // IDs of affected items
}
```

## Impact Analysis

### Formula Impact

Tracks formula changes with dependency analysis:

```typescript
{
  statId: string;
  oldFormula: string;
  newFormula: string;
  dependentStats: string[];        // Stats that depend on this formula
  complexity: 'simple' | 'moderate' | 'complex';
  risk: ImpactSeverity;
}
```

### Weight Impact

Monitors weight changes exceeding threshold:

```typescript
{
  statId: string;
  oldWeight: number;
  newWeight: number;
  percentageChange: number;
  affectedArchetypes: string[];    // Archetypes using this stat
}
```

### Breaking Changes

Detects changes that may break existing systems:

```typescript
{
  path: string;
  reason: string;
  severity: ImpactSeverity;
  migration: string;               // Migration instructions
}
```

## Algorithms

### Deep Diff Algorithm

1. **Null/Undefined Handling**: Detect additions/removals
2. **Primitive Comparison**: Use semantic rules or default equality
3. **Array Diff**: Index-based comparison with additions/removals
4. **Object Diff**: Key-based comparison with nested recursion

### Impact Calculation

1. **Apply Semantic Rules**: Check if path matches any rule patterns
2. **Calculate Impact**: Use rule's impact calculator
3. **Default Impact**: Fall back to category-based defaults
4. **Aggregate**: Collect all impacts for summary

### Similarity Calculation

Uses Levenshtein distance for formula comparison:

```typescript
similarity = (longer.length - editDistance) / longer.length

if (similarity < 0.3) return 'critical';
if (similarity < 0.6) return 'high';
if (similarity < 0.9) return 'medium';
return 'low';
```

## Integration

### With BalancerConfigStore

```typescript
import { BalancerConfigStore } from '@/balancing/config/BalancerConfigStore';

// Load snapshots
await BalancerConfigStore.load();
const history = BalancerConfigStore.getHistory();

// Get specific snapshots
const snapshotA = history.find(s => s.timestamp === timestamp1);
const snapshotB = history.find(s => s.timestamp === timestamp2);

// Generate diff
const report = generateDiffReport(snapshotA, snapshotB, config);
```

### With CI/CD Pipeline

```bash
# In CI pipeline
tsx scripts/balancer/configSnapshotDiff.ts \
  --latest \
  --min-impact high \
  --export diff-report.md

# Check for breaking changes
if grep -q "Breaking Changes" diff-report.md; then
  echo "⚠️ Breaking changes detected!"
  exit 1
fi
```

### With Git Hooks

```bash
# pre-commit hook
#!/bin/bash
tsx scripts/balancer/configSnapshotDiff.ts \
  --latest \
  --min-impact critical

if [ $? -ne 0 ]; then
  echo "Critical changes detected. Review required."
  exit 1
fi
```

## Output Formats

### Markdown

```markdown
# Config Snapshot Diff Report

## Summary
- **Total Changes**: 42
- **Added**: 5
- **Removed**: 2
- **Modified**: 35

### Impact Distribution
- 🔴 **Critical**: 2
- 🟠 **High**: 8
- 🟡 **Medium**: 15
- 🟢 **Low**: 17

## ⚠️ Breaking Changes

### stats.strength.formula
- **Severity**: critical
- **Reason**: Formula changed significantly
- **Migration**: Review and test formula: stats.strength.formula
```

### JSON

```json
{
  "timestamp": 1706052000000,
  "snapshotA": { ... },
  "snapshotB": { ... },
  "summary": { ... },
  "changes": [ ... ],
  "impactAnalysis": { ... }
}
```

## Performance

### Optimization Strategies
- **Lazy Evaluation**: Only analyze when needed
- **Memoization**: Cache comparison results
- **Parallel Processing**: Compare independent paths concurrently
- **Early Exit**: Stop on first critical change (optional)

### Performance Targets
- **Small Configs** (<100 stats): <100ms
- **Medium Configs** (100-500 stats): <500ms
- **Large Configs** (500+ stats): <2s
- **Memory Usage**: <50MB for typical configs

## Troubleshooting

### Common Issues

**No snapshots found**
- Ensure BalancerConfigStore has been used to save configs
- Check that history is not empty
- Verify storage keys are correct

**Incorrect impact levels**
- Review semantic rules configuration
- Check if custom rules are being applied
- Verify impact calculator logic

**Missing changes**
- Check filter settings (minImpact, categories)
- Ensure includeUnchanged is set correctly
- Verify comparison precision for floats

**Performance issues**
- Reduce config size or split into chunks
- Disable unnecessary analysis features
- Use filters to limit scope

## Best Practices

### When to Use
- ✅ Before deploying config changes
- ✅ During code review process
- ✅ When investigating balance issues
- ✅ For documentation and auditing
- ✅ In automated testing pipelines

### Configuration Tips
- Set appropriate float precision for your domain
- Define semantic rules for critical paths
- Use meaningful snapshot descriptions
- Keep history size manageable (10-20 snapshots)
- Export reports for important changes

### Review Workflow
1. Generate diff report
2. Review breaking changes first
3. Check high-impact changes
4. Validate formula changes
5. Test affected archetypes
6. Document migration steps
7. Deploy incrementally

## Future Enhancements

### Planned Features
- [ ] Dependency graph visualization
- [ ] Archetype impact simulation
- [ ] Automatic migration script generation
- [ ] Diff merging and conflict resolution
- [ ] Historical trend analysis
- [ ] Custom rule editor UI
- [ ] Export to other formats (HTML, PDF)
- [ ] Integration with version control

### Integration Opportunities
- [ ] Slack/Discord notifications for critical changes
- [ ] GitHub PR comments with diff summary
- [ ] Jira ticket creation for breaking changes
- [ ] Datadog/Grafana metrics integration

## References

- **BalancerConfigStore**: `src/balancing/config/BalancerConfigStore.ts`
- **Config Types**: `src/balancing/config/types.ts`
- **Formula Engine**: `src/balancing/config/FormulaEngine.ts`
- **Snapshot Testing**: `src/balancing/config/__tests__/BalancerConfigStore.test.ts`

---

**Last Updated**: 2026-01-23  
**Version**: 1.0.0  
**Status**: ✅ Implemented
