# Idle Village Fatigue Predictor - Analytics Documentation

## Overview

The Idle Village Fatigue Predictor is a comprehensive analytics system that estimates future fatigue levels for residents based on telemetry data and scheduler parameters. This system provides real-time fatigue predictions, risk assessment, and actionable insights for optimal crew management.

## Architecture

### Core Components

1. **FatiguePredictor** - Main prediction engine with configurable algorithms
2. **useFatiguePredictor** - React hook for UI integration with state management
3. **FatiguePredictorPanel** - Interactive UI component with sparkline visualizations
4. **CLI Report Generator** - Command-line tool for batch analysis and export

### Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Historical    │───▶│  FatiguePredictor │───▶│  Predictions     │
│     Data        │    │     Engine        │    │   Results       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Telemetry      │    │  Configuration  │    │   UI Panel      │
│   Events        │    │   Management     │    │   Display       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Prediction Model

### Factors Considered

The fatigue prediction model considers multiple weighted factors:

1. **Current Fatigue** - Resident's current fatigue level (0-100)
2. **Activity Difficulty** - Activity danger rating (1-5 scale)
3. **Activity Duration** - Time-based duration from formula
4. **Environmental Conditions** - Weather, terrain, time of day modifiers
5. **Crew Synergy** - Crew size and composition effects
6. **Historical Accuracy** - Model confidence based on past predictions

### Prediction Formula

```typescript
predictedFatigue = currentFatigue + (
  baseFatigueRate × 
  difficultyWeight × 
  durationWeight × 
  environmentalMultiplier × 
  crewSynergyMultiplier × 
  timeOfDayMultiplier × 
  activityDuration / 100
)
```

### Risk Assessment

Risk levels are determined based on predicted fatigue:

- **Low** (0-40): Normal operation, no intervention needed
- **Medium** (41-60): Monitor closely, consider rest periods
- **High** (61-80): Immediate attention required, schedule rest
- **Critical** (81-100): Emergency intervention, mandatory rest

## Configuration

### Default Configuration

```typescript
export const DEFAULT_FATIGUE_PREDICTION_CONFIG: FatiguePredictionConfig = {
  baseFatigueRate: 0.1,
  difficultyWeights: {
    1: 0.8,  // Very easy
    2: 1.0,  // Easy
    3: 1.3,  // Normal
    4: 1.7,  // Hard
    5: 2.2,  // Very hard
  },
  durationWeights: {
    50: 0.7,   // Very short
    100: 1.0,  // Short
    200: 1.3,  // Medium
    400: 1.6,  // Long
    800: 2.0,  // Very long
  },
  environmentalModifiers: {
    hotWeather: 1.3,
    coldWeather: 1.1,
    roughTerrain: 1.2,
    nightTime: 1.15,
  },
  crewSynergyBonus: {
    workingAlone: 1.2,
    smallCrew: 1.0,
    optimalCrew: 0.8,
    overcrowded: 1.1,
  },
  thresholds: {
    rested: 20,
    normal: 40,
    tired: 60,
    exhausted: 80,
    critical: 95,
  },
  confidenceFactors: {
    dataAvailability: 0.8,
    historicalAccuracy: 0.9,
    modelComplexity: 0.7,
  },
};
```

### Custom Configuration

The system supports runtime configuration updates through the UI hook:

```typescript
const { updateConfig } = useFatiguePredictor();

// Update environmental modifiers for extreme conditions
updateConfig({
  environmentalModifiers: {
    ...config.environmentalModifiers,
    extremeHeat: 1.8,
    blizzard: 1.5,
  }
});
```

## API Reference

### FatiguePredictor Class

#### Constructor
```typescript
new FatiguePredictor(config?: FatiguePredictionConfig)
```

#### Methods

**predictFatigue(resident, activity, context?)**
- Returns fatigue prediction for single resident-activity pair
- Includes confidence score and risk assessment

**predictBatch(predictions)**
- Processes multiple predictions efficiently
- Returns array of prediction results

**getTopRiskResidents(predictions, limit?)**
- Identifies residents at highest risk
- Returns sorted list by risk level

**updateConfig(newConfig)**
- Updates prediction configuration
- Affects all subsequent predictions

### useFatiguePredictor Hook

#### Parameters
```typescript
interface UseFatiguePredictorParams {
  config?: Partial<FatiguePredictionConfig>;
  enableHistoricalData?: boolean;
  enableBatchPrediction?: boolean;
  defaultContext?: {
    environmentalConditions?: string[];
    crewSize?: number;
    timeOfDay?: string;
  };
}
```

#### Return Value
```typescript
interface UseFatiguePredictorReturn {
  predictor: FatiguePredictor;
  config: FatiguePredictionConfig;
  updateConfig: (newConfig: Partial<FatiguePredictionConfig>) => void;
  predictFatigue: (resident, activity, context?) => FatiguePrediction;
  predictBatch: (predictions) => FatiguePrediction[];
  getTopRiskResidents: (predictions, limit?) => FatiguePrediction[];
  exportPredictions: (predictions) => string;
  isLoading: boolean;
  error: string | null;
  historicalData: Array<{...}>;
  addHistoricalData: (activity, fatigueBefore, fatigueAfter) => void;
  clearHistoricalData: () => void;
  saveConfig: () => Promise<void>;
  loadConfig: () => Promise<void>;
}
```

## Event Types

### Prediction Events

The system emits telemetry events for monitoring and analytics:

```typescript
interface FatiguePredictionEvent {
  eventType: 'fatigue_prediction_completed';
  data: {
    residentId: string;
    activityId: string;
    predictedFatigue: number;
    riskLevel: string;
    confidence: number;
    factors: FatigueFactors;
    timestamp: number;
  };
}
```

### Configuration Events

```typescript
interface ConfigurationEvent {
  eventType: 'fatigue_config_updated';
  data: {
    previousConfig: FatiguePredictionConfig;
    newConfig: FatiguePredictionConfig;
    timestamp: number;
  };
}
```

## KPI Metrics

### Core KPIs

| KPI | Description | Target | Calculation |
|-----|-------------|--------|-------------|
| **Prediction Accuracy** | Historical prediction accuracy | ≥85% | correct_predictions / total_predictions |
| **Risk Identification Rate** | High-risk residents correctly identified | ≥90% | true_positives / (true_positives + false_negatives) |
| **Confidence Score** | Average prediction confidence | ≥0.8 | sum(confidence) / count |
| **Fatigue Reduction** | Actual fatigue reduction after interventions | ≥15% | (baseline_fatigue - current_fatigue) / baseline_fatigue |

### Operational KPIs

| KPI | Description | Target | Calculation |
|-----|-------------|--------|-------------|
| **Prediction Latency** | Time to generate predictions | <50ms | end_time - start_time |
| **Data Freshness** | Age of historical data used | <24h | current_time - oldest_data |
| **Model Coverage** | Percentage of residents with predictions | 100% | predicted_residents / total_residents |
| **Alert Response Time** | Time from high-risk alert to action | <5min | action_time - alert_time |

## Integration Examples

### Basic Usage

```typescript
import { useFatiguePredictor } from '@/ui/idleVillage/hooks/useFatiguePredictor';

function CrewManagementPanel() {
  const { predictFatigue, getTopRiskResidents } = useFatiguePredictor({
    enableHistoricalData: true,
    defaultContext: {
      crewSize: 4,
      timeOfDay: 'day',
    },
  });

  const handleResidentAssignment = (resident, activity) => {
    const prediction = predictFatigue(resident, activity);
    
    if (prediction.riskLevel === 'critical') {
      // Show warning and suggest alternative
      showWarning(`${resident.displayName} is at critical fatigue risk!`);
      return false;
    }
    
    return true;
  };
}
```

### Batch Analysis

```typescript
const analyzeCrewFatigue = async (residents, activities) => {
  const predictions = predictBatch(
    residents.map(resident => ({
      resident,
      activity: activities['forest-work'], // Default activity
      context: {
        environmentalConditions: ['normal'],
        crewSize: residents.length,
      },
    }))
  );

  const topRisks = getTopRiskResidents(predictions, 5);
  
  return {
    summary: {
      totalPredictions: predictions.length,
      highRiskCount: predictions.filter(p => p.riskLevel === 'high').length,
      criticalRiskCount: predictions.filter(p => p.riskLevel === 'critical').length,
    },
    topRisks,
    allPredictions: predictions,
  };
};
```

### CLI Usage

```bash
# Generate basic report
tsx scripts/idleVillage/fatiguePredictorReport.ts

# Generate custom report with CSV export
tsx scripts/idleVillage/fatiguePredictorReport.ts \
  --output crew-analysis.json \
  --residents 12 \
  --activities 8 \
  --csv

# Generate report without analytics for faster processing
tsx scripts/idleVillage/fatiguePredictorReport.ts \
  --no-analytics \
  --output quick-snapshot.json
```

## Data Export Formats

### JSON Export

```json
{
  "timestamp": "2026-01-19T10:30:00.000Z",
  "config": { ... },
  "sampleData": {
    "residents": 8,
    "activities": 6
  },
  "summary": {
    "totalResidents": 8,
    "totalActivities": 6,
    "totalPredictions": 48,
    "averageFatigue": 42.3,
    "highRiskResidents": 12,
    "averageConfidence": 0.87
  },
  "predictions": [
    {
      "residentId": "resident-1",
      "residentName": "Alice",
      "activityId": "activity-1",
      "activityName": "Forest Work",
      "prediction": {
        "predictedFatigue": 65.2,
        "fatigueLevel": "tired",
        "riskLevel": "medium",
        "confidence": 0.85,
        "timeToCritical": 3,
        "recommendedRest": 50,
        "factors": { ... },
        "historicalAccuracy": 0.92
      }
    }
  ],
  "analytics": {
    "riskDistribution": {
      "low": 24,
      "medium": 16,
      "high": 6,
      "critical": 2
    },
    "fatigueDistribution": {
      "0-20": 8,
      "21-40": 12,
      "41-60": 18,
      "61-80": 8,
      "81-100": 2
    },
    "topRiskFactors": [
      {
        "factor": "currentFatigue",
        "impact": 0.34,
        "description": "Current resident fatigue level"
      }
    ]
  }
}
```

### CSV Export

```csv
Resident ID,Resident Name,Activity ID,Activity Name,Predicted Fatigue,Fatigue Level,Risk Level,Confidence,Time to Critical,Recommended Rest,Current Fatigue,Activity Difficulty,Environmental Multiplier,Crew Synergy Multiplier
resident-1,Alice,activity-1,Forest Work,65.20,tired,medium,0.850,3,50,30.00,2.00,1.00,1.00
resident-2,Bob,activity-2,Mining,78.50,exhausted,high,0.780,1,150,45.00,4.00,1.20,1.00
```

## Performance Considerations

### Optimization Strategies

1. **Batch Processing** - Use `predictBatch()` for multiple predictions
2. **Caching** - Results are cached for identical inputs
3. **Lazy Loading** - Historical data loaded on demand
4. **Debounced Updates** - Configuration changes debounced to prevent recalculation storms

### Memory Management

- Historical data limited to 1000 entries per resident
- Automatic cleanup of old data points
- Efficient data structures for large datasets

### Performance Benchmarks

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Single Prediction | <5ms | Including factor calculation |
| Batch Prediction (50) | <50ms | Parallel processing |
| Configuration Update | <10ms | No recalculation required |
| Historical Data Query | <20ms | Indexed lookup |
| Export Generation | <100ms | JSON + CSV |

## Troubleshooting

### Common Issues

**Low Prediction Accuracy**
- Check historical data quality
- Verify configuration parameters
- Review environmental conditions

**High Memory Usage**
- Reduce historical data retention
- Clear old data points manually
- Check for memory leaks in UI components

**Slow Performance**
- Enable batch processing
- Reduce prediction frequency
- Optimize configuration updates

### Debug Mode

Enable debug logging for detailed troubleshooting:

```typescript
const { updateConfig } = useFatiguePredictor();

updateConfig({
  debugMode: true,
  logLevel: 'verbose',
});
```

## Future Enhancements

### Planned Features

1. **Machine Learning Integration** - Advanced prediction models
2. **Real-time Telemetry** - Live data streaming
3. **Mobile Alerts** - Push notifications for critical risks
4. **Predictive Analytics** - Trend analysis and forecasting
5. **Multi-village Support** - Cross-village comparisons

### API Extensions

```typescript
// Future: Advanced prediction with ML models
const advancedPrediction = await predictor.predictWithML(
  resident, 
  activity, 
  { model: 'random_forest', features: ['all'] }
);

// Future: Real-time subscription
const subscription = predictor.subscribeToUpdates(
  (predictions) => updateUI(predictions)
);
```

## Support and Maintenance

### Monitoring

- Monitor prediction accuracy trends
- Track performance metrics
- Alert on configuration drift
- Regular data quality checks

### Maintenance Tasks

- Weekly: Review prediction accuracy
- Monthly: Update configuration parameters
- Quarterly: Retrain prediction models
- Annually: Full system audit

### Contact

For technical support or feature requests:
- Create issue in project repository
- Contact analytics team
- Review documentation updates
- Check for known issues
