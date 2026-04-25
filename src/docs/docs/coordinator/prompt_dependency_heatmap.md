# Prompt Dependency Heatmap

**Since:** NP-146 (2026-01-24)  
**Status:** ✅ Complete

## Overview

Config-first analyzer for coordinator prompt dependencies. Reads dependencies from Kanban, builds dependency matrix, detects circular dependencies, and generates heatmap visualizations in JSON and Markdown formats.

## Features

### Dependency Analysis
- **Kanban Parsing**: Extracts prompt entries and dependencies from agent_assignments.md
- **Matrix Building**: Creates adjacency matrix for dependency relationships
- **Weight Calculation**: Computes dependency weights and types (direct/transitive)
- **Cycle Detection**: Identifies circular dependencies using DFS algorithm

### Filtering
- **Status-based**: Filter by Completato, In corso, Non assegnato
- **Time Window**: Analyze dependencies within configurable time window
- **Threshold**: Filter weak dependencies below threshold

### Export Formats
- **JSON**: Complete heatmap data with matrix, relations, and statistics
- **Markdown**: Human-readable report with statistics and visualizations

### Statistics
- Total prompts and dependencies
- Average dependencies per prompt
- Maximum dependencies
- Circular dependency detection
- Top dependencies ranking

## Installation

No installation required. The tool is part of the coordinator tooling suite.

## Usage

### Basic Usage

```bash
npm run coordinator:heatmap
```

### With Options

```bash
# 7-day window, JSON only
npm run coordinator:heatmap -- --window 7 --format json

# Higher threshold, custom output
npm run coordinator:heatmap -- --threshold 0.2 --output ./reports

# Include non-assigned prompts
npm run coordinator:heatmap -- --include-non-assigned

# Exclude completed prompts
npm run coordinator:heatmap -- --no-completed
```

### CLI Options

```
--window <days>              Time window in days (default: 30)
--threshold <value>          Dependency threshold 0-1 (default: 0.1)
--output <path>              Output directory (default: test-results)
--format <type>              Output format: json, markdown, both (default: both)
--no-completed               Exclude completed prompts
--no-in-progress             Exclude in-progress prompts
--include-non-assigned       Include non-assigned prompts
--help                       Show help message
```

## Configuration

### Default Configuration

```typescript
{
  threshold: 0.1,
  window: 30,
  includeCompleted: true,
  includeInProgress: true,
  includeNonAssigned: false,
}
```

### Custom Configuration

```typescript
import { analyzePromptDependencies } from '@/coordinator/promptDependencyAnalyzer';

const result = await analyzePromptDependencies(kanbanPath, {
  threshold: 0.2,
  window: 7,
  includeCompleted: false,
  includeInProgress: true,
  includeNonAssigned: true,
});
```

## API Reference

### analyzePromptDependencies

Analyze prompt dependencies from Kanban file.

```typescript
async function analyzePromptDependencies(
  kanbanPath: string,
  config?: Partial<DependencyConfig>
): Promise<HeatmapData>
```

**Parameters:**
- `kanbanPath`: Path to agent_assignments.md
- `config`: Optional configuration overrides

**Returns:** `HeatmapData` with prompts, dependencies, matrix, labels, and statistics

### parseKanbanFile

Parse Kanban file to extract prompt entries.

```typescript
async function parseKanbanFile(filePath: string): Promise<PromptEntry[]>
```

**Returns:** Array of prompt entries with id, description, status, and dependencies

### buildDependencyMatrix

Build adjacency matrix from prompt entries.

```typescript
function buildDependencyMatrix(prompts: PromptEntry[]): {
  matrix: number[][];
  labels: string[];
}
```

**Returns:** Dependency matrix and prompt labels

### calculateDependencyWeights

Calculate weights for dependency relationships.

```typescript
function calculateDependencyWeights(
  prompts: PromptEntry[],
  matrix: number[][]
): DependencyRelation[]
```

**Returns:** Array of dependency relations with weights

### detectCircularDependencies

Detect circular dependencies using DFS.

```typescript
function detectCircularDependencies(
  prompts: PromptEntry[],
  matrix: number[][]
): string[][]
```

**Returns:** Array of circular dependency chains

### filterPrompts

Filter prompts by configuration.

```typescript
function filterPrompts(
  prompts: PromptEntry[],
  config: DependencyConfig
): PromptEntry[]
```

**Returns:** Filtered prompt array

### calculateStats

Calculate dependency statistics.

```typescript
function calculateStats(
  prompts: PromptEntry[],
  dependencies: DependencyRelation[],
  circularDeps: string[][]
): HeatmapData['stats']
```

**Returns:** Statistics object with totals, averages, and circular dependencies

### exportToJSON

Export heatmap data to JSON file.

```typescript
async function exportToJSON(
  data: HeatmapData,
  outputPath: string
): Promise<void>
```

### exportToMarkdown

Export heatmap data to Markdown file.

```typescript
async function exportToMarkdown(
  data: HeatmapData,
  outputPath: string
): Promise<void>
```

## Data Structures

### PromptEntry

```typescript
interface PromptEntry {
  id: string;
  description: string;
  status: string;
  dependencies: string[];
  agent?: string;
  startTime?: string;
  endTime?: string;
}
```

### DependencyRelation

```typescript
interface DependencyRelation {
  from: string;
  to: string;
  weight: number;
  type: 'direct' | 'transitive';
}
```

### HeatmapData

```typescript
interface HeatmapData {
  prompts: PromptEntry[];
  dependencies: DependencyRelation[];
  matrix: number[][];
  labels: string[];
  stats: {
    totalPrompts: number;
    totalDependencies: number;
    avgDependenciesPerPrompt: number;
    maxDependencies: number;
    circularDependencies: string[][];
  };
}
```

### DependencyConfig

```typescript
interface DependencyConfig {
  threshold: number;        // 0-1
  window: number;           // days
  includeCompleted: boolean;
  includeInProgress: boolean;
  includeNonAssigned: boolean;
}
```

## Output Examples

### JSON Output

```json
{
  "prompts": [
    {
      "id": "NP-001",
      "description": "Test Prompt",
      "status": "Completato",
      "dependencies": []
    }
  ],
  "dependencies": [
    {
      "from": "NP-002",
      "to": "NP-001",
      "weight": 1,
      "type": "direct"
    }
  ],
  "matrix": [
    [0, 0],
    [1, 0]
  ],
  "labels": ["NP-001", "NP-002"],
  "stats": {
    "totalPrompts": 2,
    "totalDependencies": 1,
    "avgDependenciesPerPrompt": 0.5,
    "maxDependencies": 1,
    "circularDependencies": []
  }
}
```

### Markdown Output

```markdown
# Prompt Dependency Heatmap

**Generated**: 2026-01-24T12:00:00.000Z

## Statistics

- **Total Prompts**: 54
- **Total Dependencies**: 87
- **Avg Dependencies per Prompt**: 1.61
- **Max Dependencies**: 5
- **Circular Dependencies**: 0

## Top Dependencies

- **NP-142**: 5 dependencies
- **NP-141**: 4 dependencies
- **NP-140**: 3 dependencies

## Dependency Matrix

```
     NP-001   NP-002   NP-003   NP-004   
NP-001·        ·        ·        ·        
NP-002█        ·        ·        ·        
NP-003█        █        ·        ·        
NP-004·        ·        █        ·        
```
```

## Telemetry

The tool emits `coordinator_prompt_dependency_heatmap` telemetry events:

```json
{
  "eventType": "coordinator_prompt_dependency_heatmap",
  "timestamp": 1706097600000,
  "data": {
    "totalPrompts": 54,
    "totalDependencies": 87,
    "circularDependencies": 0,
    "window": 30,
    "threshold": 0.1,
    "format": "both"
  }
}
```

## Circular Dependency Detection

The analyzer uses Depth-First Search (DFS) to detect circular dependencies:

1. **Initialize**: Create visited and recursion stack sets
2. **Traverse**: Visit each node and its dependencies
3. **Detect**: If a node in recursion stack is revisited, cycle found
4. **Record**: Store the cycle path for reporting

### Example Circular Dependency

```
NP-001 → NP-002 → NP-003 → NP-001
```

This indicates a circular dependency chain that should be resolved.

## Performance

### Benchmarks

- **Parse Kanban**: <100ms (3000+ lines)
- **Build Matrix**: <10ms (100 prompts)
- **Detect Cycles**: <50ms (100 prompts)
- **Export JSON**: <5ms
- **Export Markdown**: <10ms

### Optimization

- Efficient regex parsing for Kanban entries
- Adjacency matrix for O(1) dependency lookup
- DFS with memoization for cycle detection
- Streaming file writes for large outputs

## Integration

### With Coordinator Workflow

```typescript
// In coordinator workflow
import { analyzePromptDependencies } from '@/coordinator/promptDependencyAnalyzer';

const kanbanPath = 'src/docs/docs/coordinator/agent_assignments.md';
const heatmap = await analyzePromptDependencies(kanbanPath);

// Check for circular dependencies
if (heatmap.stats.circularDependencies.length > 0) {
  console.warn('⚠️ Circular dependencies detected!');
  for (const cycle of heatmap.stats.circularDependencies) {
    console.warn(`  ${cycle.join(' → ')}`);
  }
}

// Find prompts with many dependencies
const complex = heatmap.prompts
  .filter(p => p.dependencies.length > 3)
  .map(p => p.id);

console.log('Complex prompts:', complex);
```

### With CI/CD Pipeline

```yaml
# .github/workflows/dependency-check.yml
name: Dependency Check

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run coordinator:heatmap
      - name: Check for circular dependencies
        run: |
          if grep -q "Circular Dependencies: [1-9]" test-results/prompt-dependency-heatmap-*.md; then
            echo "❌ Circular dependencies detected!"
            exit 1
          fi
```

## Troubleshooting

### Issue: No prompts found

**Symptom**: Empty heatmap with 0 prompts

**Solution**: 
1. Verify Kanban file path is correct
2. Check Kanban file format matches expected pattern
3. Ensure prompts have proper table format

### Issue: Incorrect dependencies

**Symptom**: Dependencies not matching Kanban

**Solution**: 
1. Verify dependency format: `NP-XXX, NP-YYY`
2. Check for typos in prompt IDs
3. Ensure dependencies column is not empty (`-` for no deps)

### Issue: Circular dependencies not detected

**Symptom**: Known cycles not reported

**Solution**: 
1. Verify dependency chain is complete
2. Check all prompts in cycle are included in filter
3. Ensure matrix is built correctly

### Issue: Export fails

**Symptom**: Cannot write output files

**Solution**: 
1. Check output directory exists and is writable
2. Verify sufficient disk space
3. Check file permissions

## Future Enhancements

- [ ] PNG/SVG heatmap visualization
- [ ] Interactive HTML report
- [ ] Dependency graph visualization (D3.js)
- [ ] Historical dependency tracking
- [ ] Dependency impact analysis
- [ ] Automated dependency optimization suggestions
- [ ] Integration with prompt status auditor
- [ ] Real-time dependency monitoring

## Related Documentation

- [KS-005 Tooling](../docs/coordinator/agent_assignments.md)
- [NP-135 Evidence Buffer](../docs/coordinator/agent_assignments.md)
- [Coordinator Mandate](../../.windsurf/skills/coordinator-mandate/SKILL.md)

## License

Part of the RPG Balancer project. See main project LICENSE.

---

**Last Updated**: 2026-01-24  
**Maintainer**: Helix-Coordinator – Dependency Viz  
**Status**: Production Ready
