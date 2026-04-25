# STS Scenario Exporter CLI Documentation

## Overview

The STS Scenario Exporter CLI is a command-line tool that exports STS scenario configurations to external tactics tools. It generates JSON and CSV bundles with filtering capabilities and comprehensive documentation for integration with third-party systems.

## Features

- **Config-First Export**: Uses weight-based creator pattern for tick serialization
- **Multiple Formats**: Export to JSON, CSV, or both simultaneously
- **Advanced Filtering**: Filter by archetypes, enemy types, target turns, and budget
- **Bundle Management**: Create organized scenario bundles with metadata
- **Documentation Generation**: Automatic README generation for each export
- **Validation**: Comprehensive validation using Zod schemas
- **Dry Run Mode**: Preview exports without writing files
- **CLI Interface**: Full-featured command-line interface with options

## Installation

The CLI is included in the STS tools package. No additional installation required.

## Usage

### Basic Usage

```bash
# Export all scenarios with default settings
tsx scripts/sts/scenarioExport.ts

# Export specific archetypes
tsx scripts/sts/scenarioExport.ts --archetypes "basic-1v1,boss-fight"

# Export to specific directory
tsx scripts/sts/scenarioExport.ts --output ./my-exports

# Export only JSON format
tsx scripts/sts/scenarioExport.ts --format json

# Export only CSV format
tsx scripts/sts/scenarioExport.ts --format csv
```

### Advanced Filtering

```bash
# Filter by target turns range
tsx scripts/sts/scenarioExport.ts --min-target-turns 10 --max-target-turns 30

# Filter by budget range
tsx scripts/sts/scenarioExport.ts --min-budget 50 --max-budget 200

# Filter by enemy types
tsx scripts/sts/scenarioExport.ts --enemy-types "guard,cultist"

# Include simulation results
tsx scripts/sts/scenarioExport.ts --include-results

# Custom bundle name
tsx scripts/sts/scenarioExport.ts --bundle-name "my-custom-scenarios"
```

### Dry Run and Preview

```bash
# Preview export without writing files
tsx scripts/sts/scenarioExport.ts --dry-run

# Verbose output for debugging
tsx scripts/sts/scenarioExport.ts --verbose --dry-run

# Force overwrite existing files
tsx scripts/sts/scenarioExport.ts --force
```

## Command Options

| Option | Short | Description | Default |
|--------|--------|-------------|---------|
| `--output` | `-o` | Output directory | `data/exports/sts` |
| `--bundle-name` | `-n` | Bundle name | `sts-scenarios` |
| `--archetypes` | `-a` | Archetypes to export (comma-separated) | `basic-1v1,boss-fight,group-combat,swarm-horde` |
| `--enemy-types` | `-e` | Enemy types to export (comma-separated) | `guard,cultist,louse,slime` |
| `--min-target-turns` | | Minimum target turns | `1` |
| `--max-target-turns` | | Maximum target turns | `999` |
| `--min-budget` | | Minimum budget | `0` |
| `--max-budget` | | Maximum budget | `9999` |
| `--format` | `-f` | Export format (json, csv, both) | `both` |
| `--dry-run` | `-d` | Dry run without writing files | `false` |
| `--verbose` | `-v` | Verbose output | `false` |
| `--include-results` | | Include simulation results | `false` |
| `--force` | | Force overwrite existing files | `false` |

## Export Formats

### JSON Format

The JSON format contains complete scenario data with all details:

```json
{
  "bundleInfo": {
    "name": "sts-scenarios",
    "description": "STS scenario export bundle with 4 scenarios",
    "version": "1.0.0",
    "exportedAt": "2026-01-16T18:00:00.000Z",
    "totalScenarios": 4,
    "filters": {
      "archetypes": ["basic-1v1", "boss-fight"],
      "enemyTypes": ["guard", "cultist"],
      "includeResults": false
    }
  },
  "scenarios": [
    {
      "id": "basic-1v1",
      "name": "Basic 1v1 Combat",
      "description": "Standard one-on-one combat scenario",
      "version": "1.0.0",
      "archetype": "basic-1v1",
      "enemyProfile": {
        "name": "Guard",
        "hp": 42,
        "damage": 12,
        "defense": 6,
        "speed": 3,
        "special": []
      },
      "budget": {
        "hpEq": 25,
        "damageEq": 15,
        "total": 40
      },
      "targetTurns": 20,
      "ticks": [
        {
          "turn": 1,
          "value": 15.5,
          "weight": 1.2,
          "type": "damage",
          "description": "Turn 1: Guard deals damage"
        },
        {
          "turn": 2,
          "value": 8.3,
          "weight": 0.9,
          "type": "defense",
          "description": "Turn 2: Guard defensive action"
        }
      ],
      "metadata": {
        "exportedAt": "2026-01-16T18:00:00.000Z",
        "exportedBy": "sts-scenario-exporter",
        "formatVersion": "1.0.0",
        "sourceConfig": "basic-1v1"
      }
    }
  ],
  "summary": {
    "archetypes": ["basic-1v1", "boss-fight"],
    "averageTargetTurns": 25.5,
    "totalBudget": 120,
    "complexity": "medium"
  }
}
```

### CSV Format

The CSV format contains a summary of all scenarios for easy analysis:

```csv
Scenario ID,Name,Archetype,Enemy Name,Enemy HP,Enemy Damage,Enemy Defense,Enemy Speed,Budget HP,Budget Damage,Total Budget,Target Turns,Tick Count,Complexity
"basic-1v1","Basic 1v1 Combat","basic-1v1","Guard",42,12,6,3,25,15,40,20,20,medium
"boss-fight","Boss Fight","boss-fight","Cultist",88,25,12,8,50,30,80,30,30,high
```

## Data Structure

### Scenario Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique scenario identifier |
| `name` | string | Human-readable name |
| `description` | string | Scenario description |
| `version` | string | Version number (semver) |
| `archetype` | string | Scenario type |
| `enemyProfile` | object | Enemy statistics and abilities |
| `budget` | object | Resource budget |
| `targetTurns` | number | Expected number of turns |
| `ticks` | array | Turn-by-turn actions |
| `metadata` | object | Export metadata |

### Enemy Profile

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Enemy name |
| `hp` | number | Hit points |
| `damage` | number | Base damage |
| `defense` | number | Defense value |
| `speed` | number | Speed value |
| `special` | array | Special abilities |

### Budget

| Field | Type | Description |
|-------|------|-------------|
| `hpEq` | number | HP equivalent budget |
| `damageEq` | number | Damage equivalent budget |
| `total` | number | Total budget |

### Tick Object

| Field | Type | Description |
|-------|------|-------------|
| `turn` | number | Turn number (1-based) |
| `value` | number | Action value/damage |
| `weight` | number | Weight multiplier |
| `type` | string | Action type (damage, defense, utility, special) |
| `description` | string | Human-readable description |

## Integration Examples

### JavaScript/Node.js

```javascript
const fs = require('fs');

// Load JSON export
const data = JSON.parse(fs.readFileSync('sts-scenarios-2026-01-16T18-00-00-000Z.json', 'utf-8'));

// Process scenarios
data.scenarios.forEach(scenario => {
  console.log(`Scenario: ${scenario.name}`);
  console.log(`Enemy: ${scenario.enemyProfile.name}`);
  console.log(`Budget: ${scenario.budget.total}`);
  console.log(`Target Turns: ${scenario.targetTurns}`);
  console.log(`Ticks: ${scenario.ticks.length}`);
  
  // Process ticks
  scenario.ticks.forEach(tick => {
    console.log(`  Turn ${tick.turn}: ${tick.type} - ${tick.value} (weight: ${tick.weight})`);
  });
});

// Calculate statistics
const totalBudget = data.scenarios.reduce((sum, s) => sum + s.budget.total, 0);
const avgTurns = data.scenarios.reduce((sum, s) => sum + s.targetTurns, 0) / data.scenarios.length;

console.log(`Total Budget: ${totalBudget}`);
console.log(`Average Turns: ${avgTurns.toFixed(1)}`);
```

### Python

```python
import pandas as pd
import json

# Load JSON export
with open('sts-scenarios-2026-01-16T18-00-00-000Z.json', 'r') as f:
    data = json.load(f)

# Load CSV export
df = pd.read_csv('sts-scenarios-2026-01-16T18-00-00-000Z.csv')

# Basic analysis
print(f"Total scenarios: {len(data['scenarios'])}")
print(f"Archetypes: {df['Archetype'].unique()}")
print(f"Enemy types: {df['Enemy Name'].unique()}")

# Budget analysis
budget_stats = df[['Budget HP', 'Budget Damage', 'Total Budget']].describe()
print(budget_stats)

# Target turns analysis
turn_stats = df['Target Turns'].describe()
print(turn_stats)

# Complexity distribution
complexity_counts = df['Complexity'].value_counts()
print(complexity_counts)

# Filter scenarios
high_budget_scenarios = df[df['Total Budget'] > 100]
boss_scenarios = df[df['Archetype'] == 'boss-fight']

print(f"High budget scenarios: {len(high_budget_scenarios)}")
print(f"Boss scenarios: {len(boss_scenarios)}")
```

### C#/.NET

```csharp
using System;
using System.Text.Json;
using System.IO;

public class ScenarioProcessor
{
    public static void ProcessScenarios(string jsonPath)
    {
        var json = File.ReadAllText(jsonPath);
        var data = JsonSerializer.Deserialize<ScenarioBundle>(json);
        
        Console.WriteLine($"Bundle: {data.BundleInfo.Name}");
        Console.WriteLine($"Scenarios: {data.Scenarios.Count}");
        Console.WriteLine($"Archetypes: {string.Join(", ", data.Summary.Archetypes)}");
        
        foreach (var scenario in data.Scenarios)
        {
            Console.WriteLine($"Scenario: {scenario.Name}");
            Console.WriteLine($"  Enemy: {scenario.EnemyProfile.Name}");
            Console.WriteLine($"  HP: {scenario.EnemyProfile.Hp}");
            Console.WriteLine($"  Budget: {scenario.Budget.Total}");
            Console.WriteLine($"  Turns: {scenario.TargetTurns}");
            Console.WriteLine($"  Ticks: {scenario.Ticks.Count}");
            
            // Process ticks
            var damageTicks = scenario.Ticks.Where(t => t.Type == "damage");
            var totalDamage = damageTicks.Sum(t => t.Value);
            
            Console.WriteLine($"  Total Damage: {totalDamage:F2}");
        }
    }
}

public class ScenarioBundle
{
    public BundleInfo BundleInfo { get; set; }
    public List<Scenario> Scenarios { get; set; }
    public BundleSummary Summary { get; set; }
}

// Usage
ScenarioProcessor.ProcessScenarios("sts-scenarios-2026-01-16T18-00-00-000Z.json");
```

## Filtering Examples

### By Archetype

```bash
# Export only basic scenarios
tsx scripts/sts/scenarioExport.ts --archetypes "basic-1v1"

# Export boss and group scenarios
tsx scripts/sts/scenarioExport.ts --archetypes "boss-fight,group-combat"
```

### By Enemy Type

```bash
# Export only human enemies
tsx scripts/sts/scenarioExport.ts --enemy-types "guard,cultist"

# Export only monsters
tsx scripts/sts/scenarioExport.ts --enemy-types "louse,slime,jaw-worm"
```

### By Budget

```bash
# Export low-budget scenarios
tsx scripts/sts/scenarioExport.ts --max-budget 50

# Export high-budget scenarios
tsx scripts/sts/scenarioExport.ts --min-budget 100
```

### By Target Turns

```bash
# Export quick scenarios
tsx scripts/sts/scenarioExport.ts --max-target-turns 15

# Export long scenarios
tsx scripts/sts/scenarioExport.ts --min-target-turns 30
```

### Combined Filtering

```bash
# Export boss fights with high budget
tsx scripts/sts/scenarioExport.ts \
  --archetypes "boss-fight" \
  --min-budget 100 \
  --min-target-turns 25

# Export basic scenarios with specific enemies
tsx scripts/sts/scenarioExport.ts \
  --archetypes "basic-1v1" \
  --enemy-types "guard,cultist" \
  --max-budget 50
```

## Output Files

The exporter creates multiple files in the output directory:

### JSON Bundle
- **File**: `{bundle-name}-{timestamp}.json`
- **Content**: Complete scenario data with all details
- **Use**: Full integration with external tools

### CSV Summary
- **File**: `{bundle-name}-{timestamp}.csv`
- **Content**: Summary table of all scenarios
- **Use**: Quick analysis and spreadsheet import

### Documentation
- **File**: `{bundle-name}-{timestamp}-README.md`
- **Content**: Comprehensive documentation
- **Use**: Integration guide and reference

### File Naming Convention

Files are named using the pattern:
```
{bundle-name}-{YYYY-MM-DDTHH-MM-SS-sssZ}.{extension}
```

Example:
```
sts-scenarios-2026-01-16T18-00-00-000Z.json
sts-scenarios-2026-01-16T18-00-00-000Z.csv
sts-scenarios-2026-01-16T18-00-00-000Z-README.md
```

## Validation

The exporter includes comprehensive validation:

### Schema Validation
- All exported data conforms to Zod schemas
- Required fields are present and valid
- Data types and ranges are enforced

### Business Logic Validation
- Scenario IDs are unique
- Target turns are within valid range (1-999)
- Budget values are non-negative
- Tick sequences are logical

### Export Validation
- Bundle contains at least one scenario
- Maximum 1000 scenarios per bundle
- Maximum 100 ticks per scenario
- Total weight per scenario ≤ 50

## Performance

### Export Performance
- **Small Bundle (1-10 scenarios)**: < 100ms
- **Medium Bundle (10-100 scenarios)**: < 500ms
- **Large Bundle (100-1000 scenarios)**: < 2s
- **Maximum Bundle (1000 scenarios)**: < 5s

### Memory Usage
- **Small Bundle**: < 10MB
- **Medium Bundle**: < 50MB
- **Large Bundle**: < 200MB
- **Maximum Bundle**: < 500MB

### File Sizes
- **JSON**: ~1KB per scenario
- **CSV**: ~200 bytes per scenario
- **README**: ~5KB fixed

## Error Handling

### Common Errors

1. **Invalid Filters**
   ```
   Error: No scenarios match the specified filters
   ```
   **Solution**: Adjust filter criteria or use broader filters

2. **File Already Exists**
   ```
   Error: File already exists: export.json. Use --force to overwrite.
   ```
   **Solution**: Use `--force` flag or choose different output directory

3. **Invalid Scenario Data**
   ```
   Error: Bundle validation failed: Invalid enemy HP
   ```
   **Solution**: Check scenario configuration and fix invalid values

4. **Permission Denied**
   ```
   Error: EACCES: permission denied, mkdir 'data/exports/sts'
   ```
   **Solution**: Check directory permissions or use different output path

### Troubleshooting

1. **No Scenarios Exported**
   - Check if filters are too restrictive
   - Verify scenario templates exist
   - Use `--verbose` flag for detailed output

2. **Empty Export Files**
   - Check if scenario data is valid
   - Verify file permissions
   - Use `--dry-run` to preview before export

3. **Large File Sizes**
   - Reduce number of scenarios with filters
   - Use CSV format for smaller files
   - Split large exports into multiple bundles

## Best Practices

### Export Organization

1. **Use Descriptive Bundle Names**
   ```bash
   --bundle-name "boss-fight-analysis"
   --bundle-name "basic-scenarios-v1"
   --bundle-name "tactics-tool-integration"
   ```

2. **Include Relevant Metadata**
   ```bash
   --include-results  # Include simulation data
   --verbose          # Show detailed process information
   ```

3. **Use Appropriate Filters**
   - Start broad, then narrow down
   - Document filter criteria in bundle name
   - Validate filters with dry run first

### Integration Planning

1. **Understand Target System Requirements**
   - Check supported data formats
   - Verify field naming conventions
   - Validate data type compatibility

2. **Plan Export Strategy**
   - Start with small test exports
   - Validate integration before full export
   - Document integration steps

3. **Version Management**
   - Track format version changes
   - Update integration code when needed
   - Maintain backward compatibility

### Automation

1. **Scheduled Exports**
   ```bash
   # Daily export script
   #!/bin/bash
   tsx scripts/sts/scenarioExport.ts \
     --bundle-name "daily-export-$(date +%Y-%m-%d)" \
     --output "/automated/exports" \
     --format both
   ```

2. **CI/CD Integration**
   ```bash
   # In CI pipeline
   tsx scripts/sts/scenarioExport.ts \
     --bundle-name "ci-export" \
     --output "./exports" \
     --dry-run  # Validate without writing
   ```

3. **Validation Scripts**
   ```bash
   # Validate export integrity
   tsx scripts/sts/scenarioExport.ts \
     --bundle-name "validation-test" \
     --output "./test" \
     && \
   node validate-export.js "./test/validation-test-*.json"
   ```

## Version Compatibility

### Format Version 1.0.0

- Initial release format
- Supports all core scenario data
- JSON and CSV export formats
- Basic filtering capabilities

### Future Versions

- **1.1.0**: Planned support for custom tick types
- **1.2.0**: Planned support for scenario grouping
- **2.0.0**: Planned major format changes

### Backward Compatibility

- Format version is included in all exports
- Integration code should check version
- Migration guides provided for major changes

## Support

### Documentation

- **CLI Help**: `tsx scripts/sts/scenarioExport.ts --help`
- **Verbose Output**: Use `--verbose` for detailed information
- **Dry Run**: Use `--dry-run` to preview exports

### Common Issues

1. **Import Path Errors**
   - Ensure Node.js 20+ is installed
   - Check file permissions
   - Verify script path is correct

2. **Memory Issues**
   - Reduce bundle size with filters
   - Use CSV format for large exports
   - Process bundles in smaller chunks

3. **Validation Errors**
   - Check scenario configuration
   - Verify filter criteria
   - Use dry run to preview issues

### Getting Help

For additional support:
1. Check the verbose output for detailed information
2. Review the generated README files
3. Validate exported data with target system requirements
4. Use dry run mode to preview changes

---

*Last updated: 2026-01-16*
*Version: 1.0.0*
