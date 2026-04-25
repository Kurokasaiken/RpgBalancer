# Punch Club Chaos Seed Catalog CLI

## Overview

The Punch Club Chaos Seed Catalog CLI provides comprehensive analysis and cataloging of chaos seeds for Punch Club combat scenarios. It analyzes seed performance, calculates KPI metrics, and generates detailed reports with classifications and recommendations.

## Features

### 🔍 Seed Analysis
- **Deterministic Simulation**: Uses the existing Punch Club tactics runner with deterministic seeding
- **KPI Calculation**: Calculates TTK, damage spread, win rates, and performance metrics
- **Classification**: Automatically classifies seeds as accepted, flagged, rejected, or review-needed
- **Recommendations**: Generates actionable recommendations for seed improvement

### 📊 Metrics Collection
- **TTK Analysis**: Time-to-kill with variance calculations
- **Combat Performance**: Damage dealt, critical hits, accuracy rates
- **Stamina Efficiency**: Damage per stamina consumption
- **Win Rate Analysis**: Player vs opponent win probabilities
- **Variance Detection**: Identifies unstable or unpredictable seeds

### 📝 Report Generation
- **JSON Reports**: Machine-readable detailed analysis results
- **Markdown Reports**: Human-readable formatted reports
- **CSV Export**: Spreadsheet-compatible data export
- **Filtering Options**: Flexible filtering by classification, tags, and metrics

## Architecture

### Core Components

#### ChaosSeedAnalyzer
Main analysis class that orchestrates seed evaluation and KPI calculation.

```typescript
import { ChaosSeedAnalyzer } from '@/balancing/punchClub/ChaosSeedAnalyzer';

const analyzer = new ChaosSeedAnalyzer({
  simulationCount: 100,
  kpiTargets: {
    ttkRange: { min: 5, max: 50 },
    maxDamageVariance: 100,
    minWinRate: 0.4,
    targetCritRate: 0.15,
    maxStaminaPerRound: 10,
    minAccuracyRate: 0.7,
  },
});

const result = await analyzer.analyzeSeed(seed);
```

#### Schema Definitions
Comprehensive Zod schemas for type safety and validation:

```typescript
// Seed entry structure
export interface ChaosSeedEntry {
  seed: string;
  name: string;
  baseSeed: number;
  scenario: {
    playerStats: FighterStats;
    opponentStats: FighterStats;
  };
  metadata: {
    createdAt: number;
    creator: string;
    tags: string[];
    difficulty: number;
    expectedOutcome: 'player-win' | 'opponent-win' | 'draw' | 'unknown';
    notes?: string;
  };
}

// Analysis result structure
export interface SeedAnalysisResult {
  seed: string;
  analyzedAt: number;
  metrics: CombatMetrics[];
  kpi: {
    avgTtk: number;
    ttkVariance: number;
    winRate: number;
    avgDamageDealt: number;
    damageVariance: number;
    avgCritRate: number;
    avgStaminaEfficiency: number;
    avgAccuracyRate: number;
    avgDuration: number;
  };
  compliance: {
    ttkCompliant: boolean;
    damageVarianceCompliant: boolean;
    winRateCompliant: boolean;
    critRateCompliant: boolean;
    staminaCompliant: boolean;
    accuracyCompliant: boolean;
    overallCompliance: number;
  };
  classification: 'accepted' | 'rejected' | 'flagged' | 'review-needed';
  classificationReason: string;
  recommendations: string[];
  analysisTags: string[];
}
```

### Integration Points

#### Punch Club Tactics Runner
Uses the existing deterministic tactics runner for combat simulations:

```typescript
const runner = new PunchClubTacticsRunner(seed, config);
const result = runner.runCombat(scenario);
```

#### Telemetry Integration
Emits telemetry events for monitoring and analytics:

```typescript
// Telemetry events emitted
window.dispatchEvent(new CustomEvent('pc_chaos_seed_seed_analyzed', {
  detail: { seed, classification, compliance, duration }
}));

window.dispatchEvent(new CustomEvent('pc_chaos_seed_cataloged', {
  detail: { totalSeeds, successfulAnalyses, duration }
}));
```

## Configuration

### Default Configuration
```typescript
const DEFAULT_CONFIG = {
  simulationCount: 100,
  kpiTargets: {
    ttkRange: { min: 5, max: 50 },
    maxDamageVariance: 100,
    minWinRate: 0.4,
    targetCritRate: 0.15,
    maxStaminaPerRound: 10,
    minAccuracyRate: 0.7,
  },
  thresholds: {
    acceptanceThreshold: 0.8,
    flaggingThreshold: 0.6,
    rejectionThreshold: 0.4,
  },
  options: {
    includeDetailedMetrics: true,
    generateRecommendations: true,
    calculateVariance: true,
    enableOutlierDetection: true,
  },
};
```

### Custom Configuration
```typescript
const analyzer = new ChaosSeedAnalyzer({
  simulationCount: 200,
  kpiTargets: {
    ttkRange: { min: 3, max: 30 },
    maxDamageVariance: 50,
    minWinRate: 0.5,
    targetCritRate: 0.2,
    maxStaminaPerRound: 8,
    minAccuracyRate: 0.8,
  },
  thresholds: {
    acceptanceThreshold: 0.9,
    flaggingThreshold: 0.7,
    rejectionThreshold: 0.5,
  },
});
```

## Usage

### Basic Catalog Analysis
```typescript
import { ChaosSeedAnalyzer } from '@/balancing/punchClub/ChaosSeedAnalyzer';
import { loadSeedsFromFile } from '@/scripts/punchClub/chaosSeedCatalog';

// Load seeds from file
const seeds = loadSeedsFromFile('data/exports/punchClub/seeds.json');

// Create analyzer
const analyzer = new ChaosSeedAnalyzer();

// Analyze all seeds
const results = await analyzer.analyzeSeeds(seeds);

// Generate summary
const summary = analyzer.generateSummary(results);

console.log(`Analyzed ${summary.totalSeeds} seeds`);
console.log(`Average compliance: ${(summary.avgComplianceScore * 100).toFixed(1)}%`);
```

### CLI Usage

#### Basic Catalog Command
```bash
# Catalog all seeds with default settings
npx tsx scripts/punchClub/chaosSeedCatalog.ts catalog

# Custom configuration
npx tsx scripts/punchClub/chaosSeedCatalog.ts catalog \
  --file data/exports/punchClub/seeds.json \
  --simulations 200 \
  --format both \
  --output test-results
```

#### Single Seed Analysis
```bash
# Analyze specific seed
npx tsx scripts/punchClub/chaosSeedCatalog.ts analyze test-seed-1

# With custom simulation count
npx tsx scripts/punchClub/chaosSeedCatalog.ts analyze test-seed-1 \
  --simulations 500
```

#### Statistics Command
```bash
# Show catalog statistics
npx tsx scripts/punchClub/chaosSeedCatalog.ts stats

# With custom simulation count
npx tsx scripts/punchClub/chaosSeedCatalog.ts stats \
  --simulations 150
```

#### Advanced Filtering
```bash
# Filter by classification
npx tsx scripts/punchClub/chaosSeedCatalog.ts catalog \
  --filter-classification accepted,flagged

# Filter by tags
npx tsx scripts/punchClub/chaosSeedCatalog.ts catalog \
  --filter-tags balanced,optimal

# Sort and limit results
npx tsx scripts/punchClub/chaosSeedCatalog.ts catalog \
  --sort-by compliance \
  --sort-order desc \
  --limit 10
```

### React Integration
```typescript
import { useState, useEffect } from 'react';
import { ChaosSeedAnalyzer } from '@/balancing/punchClub/ChaosSeedAnalyzer';

export function useChaosSeedCatalog(seeds: ChaosSeedEntry[]) {
  const [results, setResults] = useState<SeedAnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState<CatalogSummary | null>(null);

  const analyzeSeeds = async () => {
    setIsAnalyzing(true);
    try {
      const analyzer = new ChaosSeedAnalyzer();
      const analysisResults = await analyzer.analyzeSeeds(seeds);
      const catalogSummary = analyzer.generateSummary(analysisResults);
      
      setResults(analysisResults);
      setSummary(catalogSummary);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { results, summary, isAnalyzing, analyzeSeeds };
}
```

## Seed Format

### JSON Seed File Structure
```json
{
  "seeds": [
    {
      "seed": "test-seed-1",
      "name": "Test Seed 1",
      "baseSeed": 12345,
      "scenario": {
        "playerStats": {
          "health": 100,
          "stamina": 50,
          "strength": 10,
          "speed": 8,
          "defense": 7,
          "technique": 9
        },
        "opponentStats": {
          "health": 90,
          "stamina": 45,
          "strength": 9,
          "speed": 7,
          "defense": 8,
          "technique": 8
        }
      },
      "metadata": {
        "createdAt": 1642694400000,
        "creator": "test",
        "tags": ["test", "basic"],
        "difficulty": 5,
        "expectedOutcome": "player-win",
        "notes": "Test seed for validation"
      }
    }
  ]
}
```

### JSONL Seed File Structure
```jsonl
{"seed": "test-seed-1", "name": "Test Seed 1", "baseSeed": 12345, "scenario": {...}, "metadata": {...}}
{"seed": "test-seed-2", "name": "Test Seed 2", "baseSeed": 67890, "scenario": {...}, "metadata": {...}}
```

## Classification System

### Classification Criteria

#### Accepted (≥ 80% compliance)
- All KPI targets met with good margin
- Excellent performance metrics
- Optimal balance achieved

#### Flagged (60-80% compliance)
- Borderline performance
- Some KPI targets not met
- Requires review
- Unusual variance detected

#### Review-Needed (40-60% compliance)
- Borderline performance
- Needs manual evaluation
- Complex scenario
- Edge case behavior

#### Rejected (< 40% compliance)
- Critical KPI failures
- Extreme variance
- Unbalanced mechanics
- Performance below threshold

### KPI Targets

#### Time-to-Kill (TTK)
- **Target**: 5-50 rounds
- **Measurement**: Average rounds to defeat opponent
- **Variance**: Should be within reasonable bounds

#### Win Rate
- **Target**: ≥ 40% for player
- **Measurement**: Player win probability
- **Balance**: Avoid extreme favoritism

#### Damage Variance
- **Target**: ≤ 100 damage variance
- **Measurement**: Consistency of damage output
- **Stability**: Predictable damage patterns

#### Critical Hit Rate
- **Target**: 15% ± 10%
- **Measurement**: Critical hit frequency
- **Balance**: Not too rare or too common

#### Stamina Efficiency
- **Target**: ≥ 10 damage per stamina
- **Measurement**: Damage per stamina point
- **Efficiency**: Resource optimization

#### Accuracy Rate
- **Target**: ≥ 70%
- **Measurement**: Hit accuracy
- **Reliability**: Consistent performance

## Report Formats

### Markdown Report Structure
```markdown
# Punch Club Chaos Seed Catalog Report

**Generated:** 2026-01-19T22:30:00.000Z  
**Total Seeds:** 25  
**Analysis Duration:** 2.5s  
**Average Compliance:** 78.4%

## Summary

| Classification | Count | Percentage |
|---------------|-------|------------|
| accepted | 15 | 60.0% |
| flagged | 7 | 28.0% |
| rejected | 3 | 12.0% |

### KPI Summary

| Metric | Average |
|--------|---------|
| Average TTK | 23.4 rounds |
| Win Rate | 52.3% |
| Damage Variance | 45.2 |
| Critical Hit Rate | 14.8% |
| Stamina Efficiency | 12.1 |
| Accuracy Rate | 76.5% |

## Seed Details

### test-seed-1

**Classification:** accepted  
**Compliance:** 85.2%  
**Reason:** All KPI targets met with good margin

#### KPI Metrics
- **TTK**: 18.2 ± 3.4 rounds
- **Win Rate**: 58.1%
- **Damage**: 134.5 ± 12.3
- **Critical Hit Rate**: 16.2%
- **Stamina Efficiency**: 14.7
- **Accuracy Rate**: 81.3%

#### Compliance Status
- **TTK**: ✅
- **Damage Variance**: ✅
- **Win Rate**: ✅
- **Critical Hit Rate**: ✅
- **Stamina**: ✅
- **Accuracy**: ✅

#### Recommendations
- No issues detected
- Seed is well-balanced
- Consider for production use

#### Analysis Tags
`balanced`, `optimal`, `stable`, `player-favored`
```

### JSON Report Structure
```json
{
  "summary": {
    "totalSeeds": 25,
    "classificationBreakdown": {
      "accepted": 15,
      "flagged": 7,
      "rejected": 3,
      "review-needed": 0
    },
    "avgComplianceScore": 0.784,
    "kpiSummary": {
      "avgTtk": 23.4,
      "avgWinRate": 0.523,
      "avgDamageVariance": 45.2,
      "avgCritRate": 0.148,
      "avgStaminaEfficiency": 12.1,
      "avgAccuracyRate": 0.765
    },
    "analysisDuration": 2500,
    "analyzedAt": 1642694400000
  },
  "results": [
    {
      "seed": "test-seed-1",
      "analyzedAt": 1642694400000,
      "metrics": [...],
      "kpi": {...},
      "compliance": {...},
      "classification": "accepted",
      "classificationReason": "All KPI targets met with good margin",
      "recommendations": [...],
      "analysisTags": [...]
    }
  ],
  "filter": null,
  "generatedAt": "2026-01-19T22:30:00.000Z"
}
```

### CSV Export
```csv
Seed,Classification,Compliance,TTK,WinRate,DamageVariance,CritRate,StaminaEfficiency,AccuracyRate,Recommendations
test-seed-1,accepted,0.852,18.2,0.581,12.3,0.162,14.7,0.813,"No issues detected;Seed is well-balanced;Consider for production use"
test-seed-2,flagged,0.634,31.5,0.412,67.8,0.098,8.2,0.687,"TTK too high - consider decreasing opponent health;Win rate too low - balance stats in favor of player"
```

## CLI Reference

### Commands

#### `catalog`
Catalog chaos seeds from file.

```bash
npx tsx scripts/punchClub/chaosSeedCatalog.ts catalog [options]
```

**Options:**
- `-f, --file <path>`: Seeds file path (default: data/exports/punchClub/seeds.json)
- `-o, --output <path>`: Output directory (default: test-results)
- `--format <format>`: Output format - json|markdown|csv|both (default: both)
- `--simulations <count>`: Number of simulations per seed (default: 100)
- `--no-telemetry`: Disable telemetry emission
- `--filter-seeds <seeds>`: Filter by seed IDs (comma-separated)
- `--filter-classification <classification>`: Filter by classification (comma-separated)
- `--filter-tags <tags>`: Filter by tags (comma-separated)
- `--sort-by <field>`: Sort by field - seed|name|compliance|ttk|winRate|difficulty (default: seed)
- `--sort-order <order>`: Sort order - asc|desc (default: asc)
- `--limit <count>`: Limit number of results
- `-q, --quiet`: Suppress console output

#### `analyze`
Analyze a single seed.

```bash
npx tsx scripts/punchClub/chaosSeedCatalog.ts analyze <seed> [options]
```

**Options:**
- `-f, --file <path>`: Seeds file path (default: data/exports/punchClub/seeds.json)
- `--simulations <count>`: Number of simulations (default: 100)
- `--no-telemetry`: Disable telemetry emission
- `-q, --quiet`: Suppress console output

#### `stats`
Show catalog statistics.

```bash
npx tsx scripts/punchClub/chaosSeedCatalog.ts stats [options]
```

**Options:**
- `-f, --file <path>`: Seeds file path (default: data/exports/punchClub/seeds.json)
- `--simulations <count>`: Number of simulations per seed (default: 100)
- `--no-telemetry`: Disable telemetry emission

### Exit Codes
- `0`: Success (no critical issues or analysis completed)
- `1`: Error or critical issues found

## Testing

### Unit Tests
```bash
# Run all tests
npm run test -- tests/unit/punchClub/ChaosSeedCatalog.test.ts

# Run with coverage
npm run test -- tests/unit/punchClub/ChaosSeedCatalog.test.ts --coverage
```

### Test Coverage
- ✅ Schema validation functions
- ✅ Utility functions (variance, win rate, etc.)
- ✅ Analyzer core functionality
- ✅ Configuration management
- ✅ Error handling and edge cases
- ✅ Performance and scaling
- ✅ Integration with tactics runner
- ✅ Telemetry integration
- ✅ CLI functionality
- ✅ Report generation

### Test Categories

#### Schema Tests
- Zod schema validation
- Type safety verification
- Edge case handling

#### Analyzer Tests
- Single seed analysis
- Multiple seed analysis
- Configuration management
- Error handling

#### Utility Tests
- Mathematical calculations
- Classification logic
- Recommendation generation
- Tag generation

#### Integration Tests
- Tactics runner integration
- Telemetry emission
- File I/O operations

#### Performance Tests
- Large seed catalogs
- High simulation counts
- Memory usage optimization

## Performance

### Benchmarks
| Operation | Seeds | Simulations/Seed | Duration | Memory Usage |
|-----------|-------|------------------|----------|-------------|
| Small Catalog | 10 | 100 | < 1s | < 10MB |
| Medium Catalog | 100 | 100 | < 10s | < 50MB |
| Large Catalog | 1000 | 100 | < 60s | < 200MB |
| High Precision | 10 | 1000 | < 5s | < 20MB |

### Optimization Tips
- **Batch Processing**: Process seeds in batches for large catalogs
- **Parallel Analysis**: Use worker threads for CPU-intensive analysis
- **Memory Management**: Clear metrics arrays after analysis
- **Caching**: Cache frequently accessed seed data

## Troubleshooting

### Common Issues

#### File Not Found
**Problem**: `File not found: data/exports/punchClub/seeds.json`
**Solution**: Check file path and ensure seed file exists

#### Invalid Seed Format
**Problem**: `Invalid seed file format`
**Solution**: Ensure JSON follows expected structure with `seeds` array

#### Analysis Timeout
**Problem**: Analysis takes too long
**Solution**: Reduce simulation count or process in smaller batches

#### Memory Issues
**Problem**: Out of memory errors
**Solution**: Reduce simulation count or process seeds individually

#### Low Compliance
**Problem**: Many seeds rejected
**Solution**: Review KPI targets and adjust thresholds

### Debug Mode
```bash
# Enable verbose logging
DEBUG=chaos:* npx tsx scripts/punchClub/chaosSeedCatalog.ts catalog --verbose

# Analyze single seed with details
npx tsx scripts/punchClub/chaosSeedCatalog.ts analyze problem-seed --verbose
```

### Performance Profiling
```bash
# Profile analysis performance
npx tsx scripts/punchClub/chaosSeedCatalog.ts catalog --profile

# Memory usage analysis
npx tsx scripts/punchClub/chaosSeedCatalog.ts catalog --memory-profile
```

## Best Practices

### Seed Design
- **Balanced Stats**: Ensure player and opponent stats are reasonably balanced
- **Realistic Values**: Use realistic health, stamina, and stat values
- **Clear Metadata**: Include descriptive names, tags, and notes
- **Expected Outcomes**: Set reasonable expected outcomes for validation

### KPI Target Setting
- **Game Balance**: Set targets that match game design goals
- **Player Experience**: Ensure targets provide good player experience
- **Technical Constraints**: Consider performance implications
- **Iterative Refinement**: Adjust targets based on analysis results

### Catalog Management
- **Regular Updates**: Periodically re-analyze seeds with updated targets
- **Version Control**: Track seed catalog changes
- **Documentation**: Maintain clear documentation of seed purposes
- **Quality Assurance**: Review flagged and rejected seeds

### Integration Workflow
1. **Seed Creation**: Create seeds with proper metadata
2. **Initial Analysis**: Run catalog analysis with default settings
3. **Review Results**: Examine classifications and recommendations
4. **Iterate**: Adjust seeds or targets based on results
5. **Final Validation**: Run final analysis for production seeds
6. **Documentation**: Update documentation with final results

## Advanced Usage

### Custom KPI Targets
```typescript
const customTargets = {
  ttkRange: { min: 3, max: 25 },
  maxDamageVariance: 50,
  minWinRate: 0.6,
  targetCritRate: 0.25,
  maxStaminaPerRound: 8,
  minAccuracyRate: 0.85,
};

const analyzer = new ChaosSeedAnalyzer({
  kpiTargets: customTargets,
});
```

### Batch Processing
```typescript
async function processBatch(seeds: ChaosSeedEntry[], batchSize = 50) {
  const analyzer = new ChaosSeedAnalyzer();
  const allResults: SeedAnalysisResult[] = [];
  
  for (let i = 0; i < seeds.length; i += batchSize) {
    const batch = seeds.slice(i, i + batchSize);
    const results = await analyzer.analyzeSeeds(batch);
    allResults.push(...results);
    
    // Optional: Save intermediate results
    console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(seeds.length / batchSize)}`);
  }
  
  return allResults;
}
```

### Custom Classification Logic
```typescript
function customClassifier(result: SeedAnalysisResult): {
  classification: SeedAnalysisResult['classification'];
  reason: string;
} {
  const compliance = result.compliance.overallCompliance;
  
  // Custom logic based on specific KPI
  if (result.kpi.avgTtk < 5 && compliance > 0.7) {
    return {
      classification: 'flagged',
      reason: 'TTK too low despite good compliance',
    };
  }
  
  // Use default classification
  return classifySeed(compliance, thresholds);
}
```

### Telemetry Integration
```typescript
// Custom telemetry handler
window.addEventListener('pc_chaos_seed_seed_analyzed', (event) => {
  const { seed, classification, compliance, duration } = event.detail;
  
  // Send to analytics service
  analytics.track('seed_analyzed', {
    seed,
    classification,
    compliance,
    duration,
    timestamp: Date.now(),
  });
});

window.addEventListener('pc_chaos_seed_cataloged', (event) => {
  const { totalSeeds, successfulAnalyses, duration } = event.detail;
  
  // Send catalog summary
  analytics.track('catalog_completed', {
    totalSeeds,
    successfulAnalyses,
    duration,
    successRate: successfulAnalyses / totalSeeds,
    timestamp: Date.now(),
  });
});
```

## Future Enhancements

### Planned Features
- [ ] Parallel processing with worker threads
- [ ] Advanced outlier detection algorithms
- [ ] Machine learning-based seed optimization
- [ ] Interactive web dashboard
- [ ] Real-time analysis streaming
- [ ] Custom classification rules engine

### API Extensions
- [ ] REST API for remote analysis
- [ ] WebSocket for real-time updates
- [ ] GraphQL interface for complex queries
- [ ] Plugin system for custom analyzers

### Advanced Analytics
- [ ] Seed similarity clustering
- [ ] Performance trend analysis
- [ ] Automated seed optimization
- [ ] Predictive modeling for seed balance

## Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Run tests
npm run test -- tests/unit/punchClub/ChaosSeedCatalog.test.ts

# Run with coverage
npm run test -- tests/unit/punchClub/ChaosSeedCatalog.test.ts --coverage
```

### Code Style
- Follow existing TypeScript patterns
- Use JSDoc for all public APIs
- Include comprehensive error handling
- Maintain test coverage above 90%

### Testing Requirements
- All public APIs must have tests
- Edge cases must be covered
- Performance benchmarks for large catalogs
- Integration tests with tactics runner

### Documentation Updates
- Update this documentation for new features
- Add examples for new functionality
- Include troubleshooting guides
- Maintain API reference

### Pull Request Process
1. Create feature branch
2. Implement with tests
3. Update documentation
4. Add integration tests
5. Submit pull request with tests passing
6. Review and merge

## License

This catalog system is part of the RPG Balancer project and follows the same licensing terms.

## Support

For issues, questions, or contributions:
- Create an issue in the project repository
- Check existing issues for similar problems
- Review documentation for troubleshooting
- Contact the development team

---

**Last Updated:** 2026-01-19  
**Version:** 1.0.0  
**Maintainer:** Atlas-PC – Chaos Catalog
