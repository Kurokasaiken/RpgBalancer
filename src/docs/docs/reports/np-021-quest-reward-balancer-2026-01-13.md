# NP-021 – Idle Village Quest Reward Balancer

## Overview

The Idle Village Quest Reward Balancer is a comprehensive weight-based calibration system for quest rewards. It provides KPI tracking, economic analysis, and JSON export functionality to ensure balanced and engaging quest rewards throughout the game.

## Features

### Core Functionality
- **Weight-Based Reward Calibration**: Configurable weight system for different reward types
- **KPI Tracking & Analysis**: Comprehensive metrics for quest performance and balance
- **Economic Impact Assessment**: Resource inflation and rarity distribution analysis
- **JSON Export System**: Multiple export formats with validation and compression
- **Trend Analysis**: Anomaly detection and performance trend monitoring
- **Benchmark Comparison**: Quest type benchmarks and percentile analysis

### Reward Types Supported
- **Resources**: Gold, materials, consumables
- **Experience**: Character progression and skill points
- **Items**: Equipment, weapons, special items
- **Reputation**: Social standing and faction relationships
- **Skills**: Ability improvements and new abilities
- **Special**: Unique rewards and rare items

### KPI Metrics
- **Balance Score**: Overall reward balance quality (0-1)
- **Reward Efficiency**: Rewards per minute of gameplay
- **Success Rate**: Quest completion success percentage
- **Risk-Reward Ratio**: Difficulty vs reward balance
- **Resource Inflation**: Economic impact assessment
- **Player Satisfaction**: Estimated player engagement
- **Rarity Score**: Uniqueness and specialness of rewards

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test questRewardBalancer.test.ts
```

## Usage

### Basic Reward Balancing

```typescript
import { QuestRewardBalancer } from './questRewardBalancer';

// Create balancer with custom configuration
const balancer = new QuestRewardBalancer({
  targetRewardEfficiency: 12, // 12 reward value per minute
  maxRewardVariance: 0.25, // 25% variance allowed
  difficultyScaling: true,
});

// Balance quest rewards
const result = balancer.balanceRewards(quest, originalRewards);

console.log(`Balanced rewards:`, result.balancedRewards);
console.log(`Balance score:`, result.kpi.balanceScore);
console.log(`Confidence:`, result.confidence);
```

### KPI Tracking

```typescript
import { QuestRewardKPITracker } from './questRewardKPITracker';

const tracker = new QuestRewardKPITracker();

// Add KPI data
tracker.addKPIData('quest-001', kpiData);

// Analyze trends
const trends = tracker.analyzeTrends('quest-001');
if (trends) {
  console.log(`Balance trend:`, trends.balanceScoreTrend.direction);
  console.log(`Insights:`, trends.insights);
  console.log(`Recommendations:`, trends.recommendations);
}

// Get aggregation across all quests
const aggregation = tracker.aggregateKPIs();
console.log(`Average balance score:`, aggregation.overallMetrics.averageBalanceScore);
```

### Export Functionality

```typescript
import { QuestRewardBalancerExportManager } from './questRewardBalancerExport';

const exportManager = new QuestRewardBalancerExportManager();

// Export complete data
const exportData = exportManager.exportFull(
  balancer.getConfig(),
  quests,
  originalRewards,
  balancedRewards,
  kpiData,
  calibrationResults
);

// Serialize to JSON
const jsonString = exportManager.serialize(exportData);

// Export to file
await exportManager.exportToFile(exportData, 'quest-rewards-2026-01-13.json');

// Export to CSV
const csvData = exportManager.exportToCSV(exportData);
```

## Configuration

### Default Balancer Configuration

```typescript
const DEFAULT_CONFIG = {
  rewardWeights: {
    resources: {
      type: 'resources',
      weight: 1.0,
      baseValue: 100,
      variance: 0.2,
      scaling: {
        difficulty: 1.5,
        duration: 0.8,
        complexity: 1.2,
      },
      constraints: {
        minValue: 10,
        maxValue: 1000,
        cap: 5000,
      },
    },
    // ... other reward types
  },
  targetRewardEfficiency: 10, // 10 reward value per minute
  maxRewardVariance: 0.3, // 30% variance allowed
  difficultyScaling: true,
  kpiThresholds: {
    minBalanceScore: 0.7,
    maxOverpoweredIndex: 0.3,
    maxUnderpoweredIndex: 0.3,
    minSuccessRate: 0.4,
    maxResourceInflation: 0.2,
  },
  economicConstraints: {
    maxTotalRewardsPerHour: 10000,
    maxRareRewardsPerHour: 1000,
    resourceSinkRatio: 0.8,
  },
};
```

### KPI Tracking Configuration

```typescript
const DEFAULT_KPI_CONFIG = {
  retentionDays: 90,
  maxDataPointsPerQuest: 1000,
  trendAnalysisWindow: 30, // days
  minimumDataPointsForTrend: 10,
  anomalyThreshold: 2.0, // standard deviations
  benchmarkSampleSize: 100,
  benchmarkUpdateFrequency: 7, // days
  aggregationRefreshInterval: 60, // minutes
  performanceThresholds: {
    excellent: 0.9,
    good: 0.75,
    average: 0.6,
  },
};
```

### Export Configuration

```typescript
const DEFAULT_EXPORT_CONFIG = {
  includeConfig: true,
  includeQuestData: true,
  includeKPIData: true,
  includeCalibrationResults: true,
  includeSessionData: false,
  includeEconomicSummary: true,
  includeValidation: true,
  format: 'json',
  prettyPrint: true,
  includeMetadata: true,
  compress: false,
  compressionLevel: 6,
};
```

## API Reference

### QuestRewardBalancer Class

#### Constructor
```typescript
constructor(config?: Partial<QuestRewardBalancerConfig>)
```

#### Methods

##### balanceRewards(quest, originalRewards, historicalResults?): RewardCalculationResult
Balances quest rewards using weight-based calibration algorithm.

##### calculateQuestDifficulty(quest, telemetry?): QuestDifficulty
Calculates difficulty assessment for a quest.

##### estimateQuestDuration(quest): number
Estimates quest completion time based on historical data.

##### calculateKPI(quest, rewards, difficulty, duration, historicalResults?): QuestRewardKPI
Calculates comprehensive KPI metrics.

##### addHistoricalData(questId, results): void
Adds historical quest results for improved calibration.

##### updateConfig(newConfig): void
Updates balancer configuration.

##### getConfig(): QuestRewardBalancerConfig
Returns current configuration.

### QuestRewardKPITracker Class

#### Constructor
```typescript
constructor(config?: Partial<KPITrackingConfig>)
```

#### Methods

##### addKPIData(questId, kpi): void
Adds KPI data for tracking and analysis.

##### analyzeTrends(questId): KPITrendAnalysis | null
Analyzes performance trends for a quest.

##### updateBenchmarks(allKPIs): void
Updates quest type benchmarks.

##### aggregateKPIs(): KPIAggregation
Aggregates KPI data across all quests.

##### exportData(): ExportData
Exports all tracked KPI data.

##### cleanupOldData(): void
Cleans up old data based on retention policy.

### QuestRewardBalancerExportManager Class

#### Constructor
```typescript
constructor(config?: Partial<ExportConfig>)
```

#### Methods

##### exportFull(config, quests, originalRewards, balancedRewards, kpiData, calibrationResults?): QuestRewardBalancerExport
Exports complete quest reward balancer data.

##### exportKPIOnly(kpiData, trends?, benchmarks?, aggregation?): QuestRewardBalancerExport
Exports only KPI data.

##### exportConfigOnly(config): QuestRewardBalancerExport
Exports only configuration.

##### serialize(data): string
Serializes export data to JSON string.

##### deserialize(jsonString): QuestRewardBalancerExport
Deserializes JSON string to export data.

##### exportToFile(data, filePath): Promise<void>
Exports data to file (Node.js environment).

##### exportToCSV(data): string
Exports data to CSV format.

## Data Structures

### QuestRewardKPI

```typescript
interface QuestRewardKPI {
  questId: string;
  questType: string;
  difficulty: QuestDifficulty;
  estimatedDuration: number;
  participantCount: number;
  totalRewardValue: number;
  rewardDistribution: Record<RewardType, number>;
  rewardEfficiency: number;
  riskRewardRatio: number;
  successRate: number;
  averageCompletionTime: number;
  playerSatisfactionScore: number;
  resourceInflation: number;
  rarityScore: number;
  repeatValue: number;
  balanceScore: number;
  overpoweredIndex: number;
  underpoweredIndex: number;
}
```

### RewardCalculationResult

```typescript
interface RewardCalculationResult {
  questId: string;
  originalRewards: QuestEffect[];
  balancedRewards: QuestEffect[];
  kpi: QuestRewardKPI;
  adjustments: Record<RewardType, number>;
  confidence: number;
  metadata: {
    algorithm: string;
    iterations: number;
    convergenceTime: number;
    warnings: string[];
  };
}
```

### QuestRewardBalancerExport

```typescript
interface QuestRewardBalancerExport {
  version: ExportVersion;
  exportTimestamp: number;
  exportType: 'full' | 'kpi_only' | 'config_only' | 'session';
  config?: QuestRewardBalancerConfig;
  quests?: QuestExportData[];
  kpiData?: {
    individual: Record<string, QuestRewardKPI[]>;
    trends: Record<string, KPITrendAnalysis>;
    benchmarks: Record<string, KPIBenchmark>;
    aggregation: KPIAggregation;
  };
  calibrationResults?: RewardCalculationResult[];
  session?: CalibrationSession;
  economicSummary?: EconomicSummary;
  validation?: ValidationResult;
}
```

## Advanced Usage

### Custom Reward Weights

```typescript
const customConfig = {
  rewardWeights: {
    resources: {
      type: 'resources',
      weight: 1.5, // Higher weight for resources
      baseValue: 150,
      variance: 0.3,
      scaling: {
        difficulty: 2.0, // More scaling with difficulty
        duration: 0.6,
        complexity: 1.5,
      },
      constraints: {
        minValue: 20,
        maxValue: 2000,
        cap: 10000,
      },
    },
    // ... other reward types
  },
};

const balancer = new QuestRewardBalancer(customConfig);
```

### Batch Processing

```typescript
// Process multiple quests
const quests = [quest1, quest2, quest3];
const results = quests.map(quest => 
  balancer.balanceRewards(quest, quest.rewards)
);

// Analyze overall results
const averageBalanceScore = results.reduce((sum, r) => sum + r.kpi.balanceScore, 0) / results.length;
const lowBalanceQuests = results.filter(r => r.kpi.balanceScore < 0.6);

console.log(`Average balance score: ${averageBalanceScore.toFixed(2)}`);
console.log(`Quests needing review: ${lowBalanceQuests.length}`);
```

### Economic Analysis

```typescript
const aggregation = tracker.aggregateKPIs();

// Check economic impact
const { economicImpact } = aggregation;
console.log(`Total rewards per hour: ${economicImpact.totalRewardsPerHour}`);
console.log(`Resource inflation rate: ${(economicImpact.resourceInflation * 100).toFixed(1)}%`);

// Analyze rarity distribution
console.log('Rarity distribution:', economicImpact.rarityDistribution);
```

### Trend Monitoring

```typescript
// Set up automated trend analysis
const monitorQuest = (questId: string) => {
  const trends = tracker.analyzeTrends(questId);
  if (!trends) return;

  // Check for concerning trends
  if (trends.balanceScoreTrend.direction === 'decreasing' && trends.balanceScoreTrend.confidence > 0.7) {
    console.warn(`Quest ${questId} balance score is declining significantly`);
  }

  // Check for anomalies
  if (trends.anomalies.length > 0) {
    console.warn(`Quest ${questId} has ${trends.anomalies.length} anomalies detected`);
  }
};
```

## Performance Considerations

### Memory Usage
- **Historical Data**: Limited by configuration (default: 1000 points per quest)
- **KPI Storage**: Automatic cleanup based on retention policy
- **Export Data**: Compression available for large datasets

### Algorithm Performance
- **Balancing Algorithm**: O(n) where n is number of rewards
- **KPI Calculation**: O(1) for individual quests
- **Trend Analysis**: O(m) where m is data points (minimum 10 required)
- **Aggregation**: O(p) where p is total KPI data points

### Optimization Tips
- Use appropriate data retention periods
- Limit benchmark sample sizes for large datasets
- Enable compression for large exports
- Cache aggregation results when possible

## Troubleshooting

### Common Issues

#### Low Balance Scores
- Check reward weight configuration
- Verify difficulty scaling settings
- Review economic constraints
- Adjust target reward efficiency

#### High Resource Inflation
- Reduce reward caps
- Increase resource sink ratio
- Adjust reward distribution
- Review quest frequency

#### Poor Trend Analysis
- Ensure sufficient historical data (minimum 10 points)
- Check trend analysis window settings
- Verify data quality and consistency
- Adjust anomaly detection thresholds

#### Export Failures
- Validate data structure before export
- Check file permissions for file exports
- Ensure sufficient memory for large datasets
- Verify JSON serialization for complex objects

### Debug Mode

```typescript
// Enable detailed logging
const balancer = new QuestRewardBalancer({
  algorithmSettings: {
    iterations: 200, // More iterations for convergence
    convergenceThreshold: 0.0001, // Stricter convergence
    useHistoricalData: true,
  },
});

// Check intermediate results
const result = balancer.balanceRewards(quest, rewards);
console.log('Adjustments applied:', result.adjustments);
console.log('Warnings:', result.metadata.warnings);
console.log('Confidence:', result.confidence);
```

## Integration Examples

### With Quest Engine

```typescript
import { QuestEngine } from '@/engine/quest/QuestEngine';

const questEngine = new QuestEngine();
const balancer = new QuestRewardBalancer();

// Balance rewards when quest is created
questEngine.on('quest_created', (quest) => {
  const balancedRewards = balancer.balanceRewards(quest, quest.rewards);
  quest.rewards = balancedRewards.balancedRewards;
});

// Track KPI when quest is completed
questEngine.on('quest_completed', (result) => {
  const kpi = balancer.calculateKPI(result.quest, result.finalEffects);
  tracker.addKPIData(result.quest.id, kpi);
});
```

### With Game Economy System

```typescript
// Monitor economic impact
const checkEconomicHealth = () => {
  const aggregation = tracker.aggregateKPIs();
  const { resourceInflation } = aggregation.overallMetrics;
  
  if (resourceInflation > 0.3) {
    // Apply economic adjustments
    balancer.updateConfig({
      economicConstraints: {
        ...balancer.getConfig().economicConstraints,
        maxTotalRewardsPerHour: 8000, // Reduce rewards
      },
    });
  }
};
```

## Testing

### Unit Tests

```bash
# Run all tests
npm run test questRewardBalancer.test.ts

# Run with coverage
npm run test -- questRewardBalancer.test.ts --coverage

# Run specific test suites
npm run test -- --grep "QuestRewardBalancer"
npm run test -- --grep "KPITracker"
npm run test -- --grep "ExportManager"
```

### Integration Tests

```typescript
// Test complete workflow
describe('Complete Workflow', () => {
  it('should balance, track, and export quest rewards', () => {
    const balancer = new QuestRewardBalancer();
    const tracker = new QuestRewardKPITracker();
    const exportManager = new QuestRewardBalancerExportManager();

    // Complete workflow implementation
    // ... test steps
  });
});
```

## Contributing

### Development Guidelines
- Follow TypeScript best practices
- Maintain test coverage > 90%
- Add comprehensive documentation
- Use config-first architecture
- Implement proper error handling

### Code Style
- Use descriptive variable names
- Add JSDoc comments for public APIs
- Follow existing naming conventions
- Include type annotations

### Testing Requirements
- Unit tests for all public methods
- Integration tests for workflows
- Edge case and error handling tests
- Performance benchmarks for critical paths

## License

This project is part of the Idle Village game system and follows the project's licensing terms.

## Changelog

### v1.0.0 (Current)
- Initial implementation of quest reward balancer
- Weight-based calibration algorithms
- KPI tracking and analysis system
- JSON export functionality
- Comprehensive test suite
- Complete documentation

### Future Enhancements
- Machine learning reward optimization
- Real-time economic monitoring
- Advanced visualization dashboard
- Mobile app integration
- Multi-language support
