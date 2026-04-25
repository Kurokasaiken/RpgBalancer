# STS Intent Forecast Accuracy Reporter

## Overview

The STS Intent Forecast Accuracy Reporter is an analytics system for comparing predicted vs actual STS (Slay the Spire) combat intents. It calculates accuracy, precision, and recall metrics with CLI export capabilities.

## Features

- **Forecast Dataset Management**: Add, retrieve, and manage forecast datasets
- **Accuracy Metrics**: Calculate precision, recall, and accuracy by intent type and severity
- **Confusion Matrix**: Generate confusion matrices for detailed analysis
- **Multiple Export Formats**: JSON, CSV, and markdown reports
- **CLI Interface**: Command-line tool for batch processing and analysis
- **Zod Validation**: Schema validation for data integrity
- **Telemetry Integration**: Ready for analytics pipeline integration

## Architecture

### Core Components

1. **STSIntentForecastReporter** - Main analytics class
2. **IntentForecast** - Individual forecast prediction data structure
3. **ForecastDataset** - Collection of forecasts with metadata
4. **CLI Tool** - Command-line interface for reports

### Data Structures

#### IntentForecast
```typescript
interface IntentForecast {
  id: string;
  runId: string;
  roundNumber: number;
  predictedIntent: {
    type: IntentType;
    label: string;
    severity: IntentSeverity;
    confidence: number; // 0-1
    metadata?: Record<string, unknown>;
  };
  actualIntent?: {
    type: IntentType;
    label: string;
    severity: IntentSeverity;
    metadata?: Record<string, unknown>;
  };
  forecastTimestamp: number;
  actualTimestamp?: number;
  isCorrect?: boolean;
}
```

#### ForecastDataset
```typescript
interface ForecastDataset {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  sourceRunIds: string[];
  forecasts: IntentForecast[];
  metrics?: ForecastAccuracyMetrics;
}
```

#### ForecastAccuracyMetrics
```typescript
interface ForecastAccuracyMetrics {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  precisionByType: Record<IntentType, number>;
  recallByType: Record<IntentType, number>;
  precisionBySeverity: Record<IntentSeverity, number>;
  recallBySeverity: Record<IntentSeverity, number>;
  avgConfidenceCorrect: number;
  avgConfidenceIncorrect: number;
  confusionMatrix: {
    predicted: IntentType;
    actual: IntentType;
    count: number;
  }[];
}
```

## Intent Types and Severities

### Intent Types
- `ATTACK` - Direct damage intent
- `DEFEND` - Defensive/blocking intent
- `BUFF` - Self-buffing intent
- `DEBUFF` - Enemy debuffing intent
- `SKILL` - Special skill intent

### Severity Levels
- `LOW` - Low threat level
- `MEDIUM` - Medium threat level
- `HIGH` - High threat level
- `CRITICAL` - Critical threat level

## Usage

### Programmatic API

```typescript
import { stsIntentForecastReporter, IntentType, IntentSeverity } from '@/analytics/stsIntentForecastReporter';

// Create a forecast dataset
const dataset = {
  id: 'my-dataset',
  name: 'Test Run Analysis',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  sourceRunIds: ['run-001'],
  forecasts: [
    {
      id: 'forecast-1',
      runId: 'run-001',
      roundNumber: 1,
      predictedIntent: {
        type: IntentType.ATTACK,
        label: 'Attack',
        severity: IntentSeverity.HIGH,
        confidence: 0.85,
      },
      actualIntent: {
        type: IntentType.ATTACK,
        label: 'Attack',
        severity: IntentSeverity.HIGH,
      },
      forecastTimestamp: Date.now(),
      actualTimestamp: Date.now(),
      isCorrect: true,
    },
    // ... more forecasts
  ],
};

// Add dataset
stsIntentForecastReporter.addDataset(dataset);

// Calculate metrics
const metrics = stsIntentForecastReporter.calculateMetrics('my-dataset');
console.log(`Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);

// Export to different formats
const jsonReport = stsIntentForecastReporter.exportToJSON('my-dataset');
const csvReport = stsIntentForecastReporter.exportToCSV('my-dataset');
const markdownReport = stsIntentForecastReporter.generateMarkdownReport('my-dataset');
```

### CLI Usage

#### Generate Sample Data
```bash
npx tsx scripts/sts/intentForecastReport.ts generate-sample
```

#### List Datasets
```bash
npx tsx scripts/sts/intentForecastReport.ts list
```

#### Calculate Metrics
```bash
npx tsx scripts/sts/intentForecastReport.ts metrics <dataset-id>
```

#### Export Reports
```bash
# Export to JSON
npx tsx scripts/sts/intentForecastReport.ts export <dataset-id> --format json

# Export to CSV
npx tsx scripts/sts/intentForecastReport.ts export <dataset-id> --format csv

# Export to Markdown
npx tsx scripts/sts/intentForecastReport.ts export <dataset-id> --format markdown

# Generate all formats
npx tsx scripts/sts/intentForecastReport.ts report <dataset-id> --output-dir test-results
```

#### Show Summary
```bash
npx tsx scripts/sts/intentForecastReport.ts summary
```

## Integration with STS Simulator

### Hook Integration (Optional)

```typescript
// In your STS overlay component
import { stsIntentForecastReporter } from '@/analytics/stsIntentForecastReporter';

const useIntentForecastTracking = () => {
  const [currentForecasts, setCurrentForecasts] = useState<IntentForecast[]>([]);

  // Record prediction when made
  const recordPrediction = useCallback((round: number, prediction: PredictedIntent) => {
    const forecast: IntentForecast = {
      id: `forecast-${Date.now()}-${round}`,
      runId: currentRunId,
      roundNumber: round,
      predictedIntent: {
        type: prediction.type,
        label: prediction.label,
        severity: prediction.severity,
        confidence: prediction.confidence,
        metadata: { source: 'overlay' },
      },
      forecastTimestamp: Date.now(),
    };

    setCurrentForecasts(prev => [...prev, forecast]);
    
    // Emit telemetry event
    diagnostics.info('Intent forecast recorded', {
      round,
      prediction: prediction.type,
      confidence: prediction.confidence,
    });
  }, [currentRunId]);

  // Record actual when determined
  const recordActual = useCallback((round: number, actual: ActualIntent) => {
    setCurrentForecasts(prev => prev.map(f => {
      if (f.roundNumber === round) {
        const updated = {
          ...f,
          actualIntent: {
            type: actual.type,
            label: actual.label,
            severity: actual.severity,
            metadata: { source: 'overlay' },
          },
          actualTimestamp: Date.now(),
          isCorrect: f.predictedIntent.type === actual.type,
        };

        // Emit telemetry event
        diagnostics.info('Intent actual recorded', {
          round,
          actual: actual.type,
          predicted: f.predictedIntent.type,
          isCorrect: updated.isCorrect,
        });

        return updated;
      }
      return f;
    }));
  }, []);

  return { recordPrediction, recordActual, currentForecasts };
};
```

### Telemetry Events

The system integrates with the existing telemetry framework:

```typescript
// Forecast recorded event
{
  type: 'sts_intent_forecast_recorded',
  timestamp: 1641894400000,
  data: {
    runId: 'run-001',
    roundNumber: 5,
    predictedType: 'attack',
    actualType: 'defend',
    confidence: 0.85,
    isCorrect: false,
  }
}
```

## Report Examples

### Markdown Report Sample

```markdown
# STS Intent Forecast Accuracy Report

**Dataset:** Test Run Analysis
**Generated:** 2026-01-19T20:00:00.000Z
**Total Forecasts:** 12
**Accuracy:** 83.33%

## Metrics by Intent Type

| Type | Precision | Recall |
|------|-----------|--------|
| attack | 85.71% | 85.71% |
| defend | 75.00% | 100.00% |
| buff | 100.00% | 66.67% |
| debuff | 100.00% | 100.00% |
| skill | 0.00% | 0.00% |

## Metrics by Severity

| Severity | Precision | Recall |
|---------|-----------|--------|
| low | 100.00% | 100.00% |
| medium | 80.00% | 80.00% |
| high | 85.71% | 85.71% |
| critical | 100.00% | 100.00% |

## Confidence Analysis

- **Avg Confidence (Correct):** 87.50%
- **Avg Confidence (Incorrect):** 65.00%

## Confusion Matrix

| Predicted \ Actual | attack | defend | buff | debuff | skill |
|-------------------|--------|--------|------|--------|-------|
| attack | 6 | 1 | 0 | 0 | 0 |
| defend | 0 | 3 | 0 | 0 | 0 |
| buff | 0 | 0 | 2 | 0 | 1 |
| debuff | 0 | 0 | 0 | 1 | 0 |
| skill | 0 | 0 | 0 | 0 | 0 |
```

### CSV Export Sample

```csv
id,runId,roundNumber,predictedType,predictedLabel,predictedSeverity,predictedConfidence,actualType,actualLabel,actualSeverity,isCorrect,forecastTimestamp,actualTimestamp
forecast-1,run-001,1,attack,Attack,high,0.85,attack,Attack,high,true,1641894400000,1641894430000
forecast-2,run-001,2,defend,Defend,medium,0.75,attack,Attack,high,false,1641894401000,1641894440000
```

## Performance Considerations

### Dataset Size
- **Small datasets** (< 100 forecasts): Instant processing
- **Medium datasets** (100-1000 forecasts): < 100ms processing
- **Large datasets** (> 1000 forecasts): < 500ms processing

### Memory Usage
- Each forecast: ~200 bytes
- Typical run (12 rounds): ~2.4KB
- 1000 runs: ~2.4MB

### Export Performance
- **JSON**: Fastest, full data preservation
- **CSV**: Medium speed, tabular format
- **Markdown**: Slowest, formatted report

## Configuration

### Default Settings
```typescript
// No configuration required - uses sensible defaults
// All validation handled by Zod schemas
// Export formats are standardized
```

### Custom Validation
```typescript
import { IntentForecastSchema } from '@/analytics/stsIntentForecastReporter';

// Extend with custom validation
const customForecastSchema = IntentForecastSchema.extend({
  customField: z.string().optional(),
});
```

## Testing

### Unit Tests
```bash
npm run test -- tests/unit/sts/IntentForecastReporter.test.ts
```

### CLI Tests
```bash
# Generate sample data
npx tsx scripts/sts/intentForecastReport.ts generate-sample

# Test metrics calculation
npx tsx scripts/sts/intentForecastReport.ts metrics sample-dataset-001

# Test export formats
npx tsx scripts/sts/intentForecastReport.ts report sample-dataset-001
```

## File Structure

```
src/analytics/
└── stsIntentForecastReporter.ts          # Main analytics module

scripts/sts/
└── intentForecastReport.ts              # CLI tool

tests/unit/sts/
└── IntentForecastReporter.test.ts       # Unit tests

docs/analytics/
└── sts_intent_accuracy.md               # This documentation

test-results/
└── sts-intent-forecast-*.json/csv/md   # Generated reports
```

## Best Practices

### Data Collection
1. **Record predictions immediately** when they're made
2. **Record actuals as soon as** they're determined
3. **Include confidence scores** for all predictions
4. **Use consistent severity classification**

### Analysis
1. **Focus on severity-specific metrics** for threat assessment
2. **Monitor confidence calibration** - high confidence should correlate with accuracy
3. **Track confusion patterns** to identify systematic prediction errors
4. **Compare across different runs** to identify patterns

### Performance
1. **Batch process large datasets** for efficiency
2. **Use JSON for data exchange** between systems
3. **Generate markdown reports** for human consumption
4. **Export CSV** for spreadsheet analysis

## Integration Points

### STS Simulator
- Hook into intent prediction system
- Record both predicted and actual intents
- Track confidence scores and timing

### Telemetry Pipeline
- Emit forecast events for real-time monitoring
- Aggregate metrics for dashboard display
- Store historical data for trend analysis

### Dashboard Integration
- Display accuracy metrics in real-time
- Show confusion matrix visualizations
- Provide confidence distribution charts

## Troubleshooting

### Common Issues

#### Dataset Validation Errors
```typescript
// Ensure all required fields are present
const forecast = {
  id: 'required',
  runId: 'required', 
  roundNumber: 1, // Must be positive integer
  predictedIntent: {
    type: 'attack', // Must be valid enum value
    label: 'required',
    severity: 'high', // Must be valid enum value
    confidence: 0.5, // Must be 0-1
  },
  forecastTimestamp: Date.now(), // Required
};
```

#### Low Accuracy
- Check confidence calibration
- Verify intent classification consistency
- Review prediction logic
- Ensure actual intents are correctly recorded

#### Memory Issues
- Clear datasets after processing: `reporter.clear()`
- Process in batches for large datasets
- Use streaming for very large exports

### Debug Mode
```typescript
// Enable verbose logging
const diagnostics = createSandboxDiagnostics('STSIntentForecast', 'analytics', { verbose: true });
```

## Future Enhancements

### Planned Features
- **Real-time accuracy monitoring** in STS overlay
- **Trend analysis** across multiple runs
- **Predictive model training** based on collected data
- **Advanced visualizations** in dashboard
- **Automated report generation** on schedule

### Extension Points
- **Custom metrics** calculation
- **Additional export formats** (Excel, PDF)
- **Integration with ML pipelines**
- **Cross-dataset comparison** tools

## API Reference

### STSIntentForecastReporter Class

#### Methods
- `addDataset(dataset: ForecastDataset): void`
- `getDataset(id: string): ForecastDataset | undefined`
- `listDatasets(): string[]`
- `calculateMetrics(datasetId: string): ForecastAccuracyMetrics`
- `exportToJSON(datasetId: string, includeMetrics?: boolean): string`
- `exportToCSV(datasetId: string): string`
- `generateMarkdownReport(datasetId: string): string`
- `clear(): void`
- `getSummaryStats(): SummaryStats`

### CLI Commands

#### `generate-sample`
Generate sample forecast data for testing.

#### `list`
List all available datasets.

#### `summary`
Show summary statistics across all datasets.

#### `metrics <datasetId>`
Calculate and show metrics for a specific dataset.

#### `export <datasetId>`
Export dataset to specified format (json, csv, markdown).

#### `report <datasetId>`
Generate comprehensive report in all formats.

#### `clear`
Clear all datasets from memory.

## License

This module is part of the RPG Balancer project and follows the same licensing terms.
