# NP-019 – Idle Village Resident Fatigue Predictor

## Overview

The Idle Village Resident Fatigue Predictor is a configurable prediction system that forecasts future fatigue levels for village residents based on historical data, scheduled activities, and multiple prediction algorithms. The system provides both a CLI interface and UI components for visualization and analysis.

## Features

### Core Functionality
- **Multiple Prediction Algorithms**: Linear regression, exponential smoothing, weighted average, and simple machine learning
- **Historical Data Management**: Configurable data windows with automatic cleanup
- **Risk Assessment**: Exhaustion risk calculation with actionable recommendations
- **Trend Analysis**: Pattern detection, anomaly identification, and insights generation
- **CLI Interface**: Command-line tool for predictions and analysis
- **UI Components**: React sparkline component for fatigue visualization

### Prediction Algorithms

#### Linear Regression
- Uses simple linear regression on historical data points
- Configurable recent data weighting
- Minimum data point requirements for accuracy

#### Exponential Smoothing
- Double exponential smoothing with trend detection
- Configurable smoothing factors (alpha, beta)
- Adapts to changing patterns over time

#### Weighted Average
- Activity-specific weight configuration
- Time-based decay for recency
- Confidence-weighted predictions

#### Machine Learning
- Simple neural network implementation
- Feature extraction from historical patterns
- Configurable complexity and training parameters

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test fatiguePredictor.test.ts
```

## Usage

### CLI Interface

```bash
# Basic prediction
node dist/fatiguePredictor.js --resident resident-1 --target-time 1000

# With specific algorithm
node dist/fatiguePredictor.js --resident resident-1 --algorithm weighted --horizon 200

# Save results to file
node dist/fatiguePredictor.js --resident resident-1 --output prediction.json

# Show help
node dist/fatiguePredictor.js --help
```

### Programmatic Usage

```typescript
import { FatiguePredictor } from './fatiguePredictor';

// Create predictor with custom configuration
const predictor = new FatiguePredictor({
  algorithm: 'weighted',
  predictionHorizon: 150,
  confidenceThreshold: 0.8,
});

// Add historical data
predictor.updateHistoricalData('resident-1', {
  timestamp: Date.now(),
  fatigue: 25.5,
  changeType: 'activity',
  activityId: 'forest-work',
  confidence: 0.9,
});

// Make prediction
const prediction = predictor.predictFatigue(
  'resident-1',
  30, // current fatigue
  Date.now() + 100, // target time
  [
    { activityId: 'mining', startTime: Date.now() + 50, duration: 30 }
  ]
);

// Analyze trends
const trends = predictor.analyzeTrends('resident-1');

// Get sparkline data
const sparkline = predictor.getSparklineData('resident-1', 20);
```

### React Component Usage

```typescript
import { FatigueSparkline, FatigueSparklineTooltip } from './FatigueSparkline';

function ResidentFatigueDisplay({ residentId }) {
  const [sparklineData, setSparklineData] = useState([]);
  
  useEffect(() => {
    const predictor = new FatiguePredictor();
    const data = predictor.getSparklineData(residentId);
    setSparklineData(data);
  }, [residentId]);

  return (
    <div>
      <FatigueSparkline
        data={sparklineData}
        width={200}
        height={40}
        showTooltip={true}
        onPointClick={(point, index) => {
          console.log('Clicked point:', point, index);
        }}
      />
      <FatigueSparklineTooltip />
    </div>
  );
}
```

## Configuration

### Default Configuration

```typescript
const DEFAULT_CONFIG = {
  algorithm: 'weighted',
  predictionHorizon: 100, // time units
  historicalWindow: 500, // time units
  confidenceThreshold: 0.7,
  riskThresholds: {
    low: 0.3,
    medium: 0.6,
    high: 0.8,
  },
  algorithmParameters: {
    linear: {
      recentWeight: 0.7,
      minDataPoints: 5,
    },
    exponential: {
      alpha: 0.3,
      beta: 0.1,
    },
    weighted: {
      decayFactor: 0.95,
      activityWeights: {
        'forest-work': 1.2,
        'mining': 1.5,
        'farming': 0.8,
        // ... other activities
      },
    },
    ml: {
      complexity: 'simple',
      iterations: 100,
      learningRate: 0.01,
    },
  },
  visualization: {
    sparklinePoints: 20,
    colorThresholds: {
      green: 0.3,
      yellow: 0.6,
      red: 0.8,
    },
  },
};
```

### Configuration Presets

The system includes three built-in presets:

#### Conservative
- Low risk tolerance
- Higher confidence thresholds
- Frequent rest recommendations
- Suitable for critical residents

#### Balanced (Default)
- Moderate risk tolerance
- Standard parameters
- Balanced recommendations

#### Aggressive
- High risk tolerance
- Lower confidence thresholds
- Minimal intervention
- Suitable for resilient residents

## API Reference

### FatiguePredictor Class

#### Constructor
```typescript
constructor(config?: Partial<FatiguePredictorConfig>)
```

#### Methods

##### updateHistoricalData(residentId: string, dataPoint: FatigueDataPoint): void
Adds a new data point to the historical data for a resident.

##### predictFatigue(residentId, currentFatigue, targetTime, scheduledActivities?): FatiguePrediction
Predicts fatigue at a target time considering scheduled activities.

##### analyzeTrends(residentId: string): FatigueTrendAnalysis
Analyzes historical fatigue patterns and generates insights.

##### getSparklineData(residentId: string, points?: number): number[]
Returns sampled data points for sparkline visualization.

##### updateConfig(newConfig: Partial<FatiguePredictorConfig>): void
Updates predictor configuration.

##### getConfig(): FatiguePredictorConfig
Returns current configuration.

### Data Structures

#### FatigueDataPoint
```typescript
interface FatigueDataPoint {
  timestamp: VillageTimeUnit;
  fatigue: number;
  activityId?: string;
  changeType: 'activity' | 'recovery' | 'baseline';
  confidence: number;
  metadata?: Record<string, unknown>;
}
```

#### FatiguePrediction
```typescript
interface FatiguePrediction {
  residentId: string;
  currentFatigue: number;
  predictedFatigue: number;
  timeline: FatigueDataPoint[];
  algorithm: 'linear' | 'exponential' | 'weighted' | 'ml';
  confidence: number;
  risk: {
    exhaustionRisk: number;
    timeToExhaustion?: VillageTimeUnit;
    recommendations: string[];
  };
  metadata: {
    predictedAt: VillageTimeUnit;
    targetTime: VillageTimeUnit;
    parameters: Record<string, unknown>;
    historicalDataPoints: number;
  };
}
```

#### FatigueTrendAnalysis
```typescript
interface FatigueTrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;
  slope: number;
  seasonal: {
    hasPattern: boolean;
    period?: VillageTimeUnit;
    amplitude?: number;
  };
  anomalies: Array<{
    timestamp: VillageTimeUnit;
    fatigue: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  insights: string[];
}
```

## Testing

The system includes comprehensive test coverage:

```bash
# Run all tests
npm run test

# Run specific test file
npm run test fatiguePredictor.test.ts

# Run with coverage
npm run test -- --coverage
```

### Test Coverage Areas
- Historical data management
- Prediction algorithms
- Risk assessment
- Trend analysis
- Configuration management
- CLI interface
- Edge cases and error handling
- Integration workflows

## Performance Considerations

### Data Management
- Historical data is automatically limited to configured window
- Data points are sorted and cleaned up on each update
- Memory usage scales with number of residents and window size

### Algorithm Performance
- Linear: O(n) - Fast, suitable for real-time
- Exponential: O(n) - Fast, good for trending data
- Weighted: O(n) - Fast, activity-aware
- ML: O(n*m) - Slower, where m is training iterations

### Recommendations
- Use 'weighted' algorithm for balanced performance
- Limit historical window to 500-1000 points
- Cache predictions for repeated queries
- Use 'linear' for high-frequency updates

## Troubleshooting

### Common Issues

#### Low Confidence Scores
- Increase historical data window
- Check data quality and consistency
- Verify activity weights configuration

#### Inaccurate Predictions
- Review algorithm parameters
- Check scheduled activity data
- Verify historical data completeness

#### Memory Usage
- Reduce historical window size
- Clear old resident data
- Use data cleanup intervals

#### CLI Errors
- Verify resident ID format
- Check target time values
- Ensure file permissions for output

### Debug Mode

Enable debug logging:
```typescript
const predictor = new FatiguePredictor({
  // ... config
});

// Access internal data for debugging
const historicalData = predictor.getHistoricalData('resident-id');
const config = predictor.getConfig();
```

## Contributing

### Development Setup
1. Clone repository
2. Install dependencies
3. Create feature branch
4. Add tests for new features
5. Ensure all tests pass
6. Submit pull request

### Code Style
- Follow TypeScript best practices
- Use descriptive variable names
- Add JSDoc comments for public APIs
- Include error handling for edge cases

### Testing Guidelines
- Write unit tests for all new functions
- Include integration tests for workflows
- Test edge cases and error conditions
- Maintain >90% code coverage

## License

This project is part of the Idle Village game system and follows the project's licensing terms.

## Changelog

### v1.0.0 (Current)
- Initial implementation
- Four prediction algorithms
- CLI interface
- React sparkline component
- Configuration management
- Comprehensive test suite
- Documentation

### Future Enhancements
- Advanced ML models
- Real-time prediction streaming
- Mobile app integration
- Advanced visualization options
- Performance optimizations
