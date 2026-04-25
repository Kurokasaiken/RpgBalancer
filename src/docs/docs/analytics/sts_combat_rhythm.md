# STS Combat Rhythm Heatmap

## Overview

The STS Combat Rhythm Heatmap provides comprehensive visualization of combat rhythm patterns in Slay the Spire. It analyzes combat telemetry data to identify BPM patterns, burst windows, and rhythm stability, helping players and developers understand combat flow and optimize strategies.

## Features

### 🔍 Rhythm Analysis
- **BPM Calculation**: Real-time beats-per-minute calculation from card play patterns
- **Burst Detection**: Identifies high-intensity combat periods
- **Stability Assessment**: Evaluates rhythm consistency and variance
- **Pattern Recognition**: Classifies rhythm patterns (regular, irregular, burst-heavy, slow-steady)

### 📊 Visualization
- **Canvas Rendering**: High-performance canvas-based heatmap visualization
- **Color Schemes**: Multiple color palettes (viridis, plasma, inferno, magma, cividis, warm, cool, spectral)
- **Interactive Tooltips**: Detailed information on hover
- **Responsive Design**: Adapts to different screen sizes and performance requirements

### 📈 Metrics & KPI
- **Average BPM**: Overall combat pace
- **Peak BPM**: Maximum intensity moments
- **Variance Analysis**: Rhythm stability metrics
- **Burst Metrics**: Frequency and duration of high-intensity periods
- **Time Span Analysis**: Combat duration and event distribution

### 📤 Export Capabilities
- **JSON Export**: Machine-readable data with full analysis results
- **Markdown Reports**: Human-readable reports with tables and summaries
- **CSV Export**: Spreadsheet-compatible format for data analysis
- **Telemetry Integration**: Automatic event emission for monitoring

## Architecture

### Core Components

#### CombatRhythmHeatmap Component
Main React component for rendering the heatmap visualization.

```typescript
import CombatRhythmHeatmap from '@/ui/tools/sts/components/CombatRhythmHeatmap';
import { useCombatRhythmData } from '@/ui/tools/sts/hooks/useCombatRhythmData';

function CombatRhythmAnalyzer() {
  const { buckets, metrics, isLoading, error, addEvent } = useCombatRhythmData({
    enableRealTime: true,
    config: {
      timeBuckets: { bucketSize: 1000, adaptiveSizing: true },
      colorPalette: { scheme: 'plasma', intensityRange: { min: 0.2, max: 0.8 } },
    },
  });

  return (
    <CombatRhythmHeatmap
      buckets={buckets}
      metrics={metrics}
      isLoading={isLoading}
      error={error}
      width={800}
      height={400}
      onBucketClick={(bucket) => console.log('Bucket clicked:', bucket)}
      onBucketHover={(bucket) => console.log('Bucket hovered:', bucket)}
    />
  );
}
```

#### useCombatRhythmData Hook
Core data processing hook for rhythm analysis.

```typescript
import { useCombatRhythmData } from '@/ui/tools/sts/hooks/useCombatRhythmData';

function useCombatAnalysis() {
  const rhythmData = useCombatRhythmData({
    enableRealTime: true,
    aggregationInterval: 1000,
    maxEvents: 10000,
    config: {
      timeBuckets: {
        bucketSize: 1000,
        maxTimeWindow: 60000,
        minEventsPerBucket: 1,
        adaptiveSizing: false,
      },
      thresholds: {
        bpm: { slow: 60, normal: 120, fast: 180, extreme: 240 },
        burst: { minEventsPerSecond: 5, duration: 3, intensityMultiplier: 2.0 },
        variance: { low: 0.1, high: 0.3 },
      },
    },
  });

  return {
    // Data
    events: rhythmData.events,
    buckets: rhythmData.buckets,
    metrics: rhythmData.metrics,
    
    // State
    isLoading: rhythmData.isLoading,
    error: rhythmData.error,
    lastUpdated: rhythmData.lastUpdated,
    
    // Actions
    addEvent: rhythmData.addEvent,
    addEvents: rhythmData.addEvents,
    clearEvents: rhythmData.clearEvents,
    updateConfig: rhythmData.updateConfig,
    exportData: rhythmData.exportData,
    
    // Utilities
    getBpmAtTime: rhythmData.getBpmAtTime,
    getIntensityAtTime: rhythmData.getIntensityAtTime,
    isBurstAtTime: rhythmData.isBurstAtTime,
  };
}
```

#### Configuration Schema
Comprehensive configuration system with Zod validation.

```typescript
import type { CombatRhythmConfig } from '@/ui/tools/sts/config/combatRhythmConfig';

const config: CombatRhythmConfig = {
  timeBuckets: {
    bucketSize: 1000,              // 1 second buckets
    maxTimeWindow: 60000,          // 1 minute max window
    minEventsPerBucket: 1,         // Minimum events per bucket
    adaptiveSizing: false,          // Enable adaptive bucket sizing
  },
  colorPalette: {
    scheme: 'viridis',             // Color scheme
    intensityRange: { min: 0, max: 1 }, // Intensity mapping range
    interpolation: true,           // Enable color interpolation
    scaleType: 'linear',          // Scale type (linear/logarithmic/exponential)
  },
  thresholds: {
    bpm: {
      slow: 60,                    // Slow BPM threshold
      normal: 120,                 // Normal BPM threshold
      fast: 180,                   // Fast BPM threshold
      extreme: 240,                 // Extreme BPM threshold
    },
    burst: {
      minEventsPerSecond: 5,        // Minimum events per second for burst
      duration: 3,                  // Burst duration in seconds
      intensityMultiplier: 2.0,     // Burst intensity multiplier
    },
    variance: {
      low: 0.1,                    // Low variance threshold
      high: 0.3,                   // High variance threshold
    },
  },
  visualization: {
    mode: 'canvas',                // Rendering mode (canvas/svg/webgl)
    dimensions: { width: 800, height: 400, margin: 40 },
    grid: { show: true, color: '#333333', width: 1, opacity: 0.3 },
    axes: { show: true, xLabel: 'Time (seconds)', yLabel: 'Intensity', fontSize: 12, fontColor: '#666666' },
    tooltip: { show: true, backgroundColor: '#000000', textColor: '#FFFFFF', fontSize: 11, borderRadius: 4, padding: 8 },
    performance: { hardwareAcceleration: true, maxRenderTime: 16, progressiveRendering: true, chunkSize: 1000 },
  },
  export: {
    formats: ['json', 'markdown'], // Export formats
    includeRawData: false,         // Include raw event data
    includeMetadata: true,          // Include metadata
    imageQuality: 0.9,              // Image export quality
    csvDelimiter: ',',              // CSV delimiter
    markdownFormat: 'github',       // Markdown table format
  },
  enableTelemetry: true,           // Enable telemetry emission
  debug: false,                    // Debug mode
};
```

### Data Structures

#### Combat Event
```typescript
interface CombatEvent {
  timestamp: number;                    // Event timestamp
  eventType: 'card_played' | 'combat_start' | 'combat_end' | 'turn_start' | 'turn_end';
  cardId?: string;                      // Card identifier (for card_played events)
  playerAction?: string;                // Player action description
  metadata?: Record<string, any>;       // Additional metadata
}
```

#### Time Bucket
```typescript
interface TimeBucket {
  startTime: number;                    // Bucket start time
  endTime: number;                      // Bucket end time
  eventCount: number;                   // Number of events in bucket
  intensity: number;                    // Intensity value (0-1)
  bpm: number;                          // Beats per minute
  variance: number;                     // Variance in timing
  events: CombatEvent[];                // Events in this bucket
  isBurst: boolean;                     // Whether this is a burst period
}
```

#### Rhythm Metrics
```typescript
interface RhythmMetrics {
  averageBpm: number;                   // Average BPM across all buckets
  peakBpm: number;                      // Maximum BPM recorded
  minBpm: number;                       // Minimum BPM recorded
  variance: number;                     // BPM variance
  stability: 'stable' | 'moderate' | 'unstable'; // Rhythm stability
  burstCount: number;                   // Number of burst periods
  burstDuration: number;                 // Total burst duration in seconds
  totalEvents: number;                  // Total events processed
  timeSpan: number;                     // Total time span in seconds
  rhythmPattern: 'regular' | 'irregular' | 'burst-heavy' | 'slow-steady'; // Rhythm pattern
}
```

## Usage Examples

### Basic Usage
```typescript
import CombatRhythmHeatmap from '@/ui/tools/sts/components/CombatRhythmHeatmap';
import { useCombatRhythmData } from '@/ui/tools/sts/hooks/useCombatRhythmData';

function BasicHeatmap() {
  const { buckets, metrics, isLoading, error } = useCombatRhythmData();
  
  return (
    <CombatRhythmHeatmap
      buckets={buckets}
      metrics={metrics}
      isLoading={isLoading}
      error={error}
      width={800}
      height={400}
    />
  );
}
```

### Real-Time Analysis
```typescript
function RealTimeAnalysis() {
  const { buckets, metrics, addEvent, isLoading } = useCombatRhythmData({
    enableRealTime: true,
    aggregationInterval: 500,
  });
  
  // Add events from telemetry
  useEffect(() => {
    const handleCombatEvent = (event: CombatEvent) => {
      addEvent(event);
    };
    
    // Subscribe to combat events
    window.addEventListener('combat_event', handleCombatEvent);
    
    return () => {
      window.removeEventListener('combat_event', handleCombatEvent);
    };
  }, [addEvent]);
  
  return (
    <div>
      <CombatRhythmHeatmap
        buckets={buckets}
        metrics={metrics}
        isLoading={isLoading}
        width={1200}
        height={600}
      />
      
      <div className="metrics-panel">
        <h3>Combat Rhythm Metrics</h3>
        <p>Average BPM: {metrics.averageBpm}</p>
        <p>Peak BPM: {metrics.peakBpm}</p>
        <p>Stability: {metrics.stability}</p>
        <p>Burst Count: {metrics.burstCount}</p>
        <p>Pattern: {metrics.rhythmPattern}</p>
      </div>
    </div>
  );
}
```

### Custom Configuration
```typescript
function CustomConfiguredHeatmap() {
  const customConfig = {
    timeBuckets: {
      bucketSize: 500,               // 0.5 second buckets for higher resolution
      adaptiveSizing: true,          // Enable adaptive sizing
    },
    colorPalette: {
      scheme: 'plasma',              // Use plasma color scheme
      intensityRange: { min: 0.2, max: 0.8 }, // Adjust intensity range
      scaleType: 'logarithmic',      // Use logarithmic scaling
    },
    thresholds: {
      bpm: { slow: 40, normal: 100, fast: 160, extreme: 220 }, // Custom BPM thresholds
      burst: { minEventsPerSecond: 8, duration: 2, intensityMultiplier: 2.5 },
    },
    visualization: {
      mode: 'canvas',
      dimensions: { width: 1000, height: 500, margin: 50 },
      grid: { show: true, color: '#444444', width: 2, opacity: 0.4 },
    },
  };
  
  const { buckets, metrics, isLoading } = useCombatRhythmData({
    config: customConfig,
  });
  
  return (
    <CombatRhythmHeatmap
      buckets={buckets}
      metrics={metrics}
      isLoading={isLoading}
      config={customConfig}
      width={1000}
      height={500}
    />
  );
}
```

### Export Functionality
```typescript
import { exportAndDownload } from '@/ui/tools/sts/utils/combatRhythmExport';

function ExportableHeatmap() {
  const { buckets, metrics, events } = useCombatRhythmData();
  const config = useCombatRhythmConfig();
  
  const handleExport = async (format: 'json' | 'markdown' | 'csv') => {
    try {
      await exportAndDownload(events, buckets, metrics, config, {
        format,
        includeRawData: true,
        includeMetadata: true,
        filename: `combat-rhythm-${Date.now()}.${format}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  return (
    <div>
      <CombatRhythmHeatmap
        buckets={buckets}
        metrics={metrics}
        width={800}
        height={400}
      />
      
      <div className="export-controls">
        <button onClick={() => handleExport('json')}>Export JSON</button>
        <button onClick={() => handleExport('markdown')}>Export Markdown</button>
        <button onClick={() => handleExport('csv')}>Export CSV</button>
      </div>
    </div>
  );
}
```

### Interactive Analysis
```typescript
function InteractiveHeatmap() {
  const { buckets, metrics, getBpmAtTime, getIntensityAtTime, isBurstAtTime } = useCombatRhythmData();
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [hoveredBucket, setHoveredBucket] = useState<TimeBucket | null>(null);
  
  const handleBucketClick = (bucket: TimeBucket) => {
    setSelectedTime(bucket.startTime);
  };
  
  const handleBucketHover = (bucket: TimeBucket | null) => {
    setHoveredBucket(bucket);
  };
  
  const selectedBpm = selectedTime ? getBpmAtTime(selectedTime) : 0;
  const selectedIntensity = selectedTime ? getIntensityAtTime(selectedTime) : 0;
  const selectedBurst = selectedTime ? isBurstAtTime(selectedTime) : false;
  
  return (
    <div>
      <CombatRhythmHeatmap
        buckets={buckets}
        metrics={metrics}
        onBucketClick={handleBucketClick}
        onBucketHover={handleBucketHover}
        width={800}
        height={400}
      />
      
      {selectedTime && (
        <div className="analysis-panel">
          <h3>Time Analysis</h3>
          <p>Selected Time: {new Date(selectedTime).toLocaleTimeString()}</p>
          <p>BPM: {selectedBpm}</p>
          <p>Intensity: {(selectedIntensity * 100).toFixed(1)}%</p>
          <p>Burst Period: {selectedBurst ? 'Yes' : 'No'}</p>
        </div>
      )}
      
      {hoveredBucket && (
        <div className="tooltip-panel">
          <h4>Bucket Details</h4>
          <p>Time: {new Date(hoveredBucket.startTime).toLocaleTimeString()} - {new Date(hoveredBucket.endTime).toLocaleTimeString()}</p>
          <p>Events: {hoveredBucket.eventCount}</p>
          <p>BPM: {hoveredBucket.bpm}</p>
          <p>Intensity: {(hoveredBucket.intensity * 100).toFixed(1)}%</p>
          <p>Variance: {(hoveredBucket.variance * 100).toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
}
```

## Configuration Reference

### Time Bucket Configuration
```typescript
interface TimeBucketConfig {
  bucketSize: number;              // Bucket size in milliseconds (100-10000)
  maxTimeWindow: number;           // Maximum time window in milliseconds (10000-300000)
  minEventsPerBucket: number;      // Minimum events required for valid bucket (0-10)
  adaptiveSizing: boolean;         // Enable adaptive bucket sizing
  adaptiveRange?: {                // Adaptive bucket size range
    min: number;                   // Minimum bucket size (50-1000)
    max: number;                   // Maximum bucket size (500-5000)
  };
}
```

### Color Palette Configuration
```typescript
interface ColorPaletteConfig {
  scheme: 'viridis' | 'plasma' | 'inferno' | 'magma' | 'cividis' | 'warm' | 'cool' | 'spectral';
  customStops?: Array<{           // Custom color stops
    position: number;              // Position (0-1)
    color: string;                // Color hex code
  }>;
  intensityRange: {              // Intensity mapping range
    min: number;                  // Minimum intensity (0-1)
    max: number;                  // Maximum intensity (0-1)
  };
  interpolation: boolean;          // Enable color interpolation
  scaleType: 'linear' | 'logarithmic' | 'exponential'; // Scale type
}
```

### Threshold Configuration
```typescript
interface ThresholdConfig {
  bpm: {                          // BPM thresholds
    slow: number;                  // Slow BPM threshold (20-120)
    normal: number;                // Normal BPM threshold (60-180)
    fast: number;                  // Fast BPM threshold (120-300)
    extreme: number;               // Extreme BPM threshold (180-400)
  };
  burst: {                        // Burst detection thresholds
    minEventsPerSecond: number;     // Minimum events per second (1-20)
    duration: number;              // Burst duration in seconds (1-10)
    intensityMultiplier: number;    // Burst intensity multiplier (1.1-5)
  };
  variance: {                     // Variance thresholds
    low: number;                   // Low variance threshold (0-0.5)
    high: number;                  // High variance threshold (0.1-1)
  };
}
```

### Visualization Configuration
```typescript
interface VisualizationConfig {
  mode: 'canvas' | 'svg' | 'webgl'; // Rendering mode
  dimensions: {                    // Dimensions
    width: number;                 // Width in pixels (200-2000)
    height: number;                // Height in pixels (100-1000)
    margin: number;                // Margin in pixels (0-100)
  };
  grid: {                         // Grid configuration
    show: boolean;                 // Show grid lines
    color: string;                 // Grid line color (hex)
    width: number;                 // Grid line width (0.1-5)
    opacity: number;               // Grid opacity (0-1)
  };
  axes: {                          // Axes configuration
    show: boolean;                 // Show axes
    xLabel: string;                // X-axis label
    yLabel: string;                // Y-axis label
    fontSize: number;               // Font size (8-24)
    fontColor: string;              // Font color (hex)
  };
  tooltip: {                       // Tooltip configuration
    show: boolean;                 // Show tooltips
    backgroundColor: string;       // Background color (hex)
    textColor: string;              // Text color (hex)
    fontSize: number;               // Font size (8-16)
    borderRadius: number;           // Border radius (0-10)
    padding: number;                // Padding (2-20)
  };
  performance: {                   // Performance settings
    hardwareAcceleration: boolean;  // Enable hardware acceleration
    maxRenderTime: number;          // Max render time per frame in ms (8-100)
    progressiveRendering: boolean;  // Enable progressive rendering
    chunkSize: number;              // Chunk size for progressive rendering (100-10000)
  };
}
```

## Color Schemes

### Available Schemes
- **Viridis**: Blue-green gradient (default)
- **Plasma**: Purple-pink gradient
- **Inferno**: Red-yellow gradient
- **Magma**: Red-orange gradient
- **Cividis**: Blue-green gradient (colorblind friendly)
- **Warm**: Warm colors gradient
- **Cool**: Cool colors gradient
- **Spectral**: Full spectrum gradient

### Custom Color Schemes
```typescript
const customConfig = {
  colorPalette: {
    scheme: 'viridis',
    customStops: [
      { position: 0, color: '#000000' },
      { position: 0.25, color: '#440154' },
      { position: 0.5, color: '#31688e' },
      { position: 0.75, color: '#35b779' },
      { position: 1, color: '#fde725' },
    ],
    intensityRange: { min: 0, max: 1 },
    interpolation: true,
    scaleType: 'linear',
  },
};
```

## Performance Optimization

### Hardware Acceleration
```typescript
const performanceConfig = {
  visualization: {
    performance: {
      hardwareAcceleration: true,  // Enable GPU acceleration
      maxRenderTime: 16,            // Target 60 FPS
      progressiveRendering: true,   // Enable progressive rendering
      chunkSize: 1000,              // Process in chunks of 1000 buckets
    },
  },
};
```

### Progressive Rendering
For large datasets (>1000 buckets), the heatmap uses progressive rendering to maintain smooth performance:

```typescript
const largeDatasetConfig = {
  visualization: {
    performance: {
      progressiveRendering: true,   // Enable for large datasets
      chunkSize: 500,               // Smaller chunks for smoother rendering
      maxRenderTime: 32,            // Allow more time per frame
    },
  },
};
```

### Memory Management
```typescript
const memoryConfig = {
  timeBuckets: {
    maxTimeWindow: 30000,           // Limit time window to reduce memory
    minEventsPerBucket: 2,          // Filter out low-activity buckets
  },
  // Limit stored events
  maxEvents: 5000,
};
```

## Telemetry Integration

### Event Emission
The heatmap automatically emits telemetry events for monitoring:

```typescript
// Viewed event
window.dispatchEvent(new CustomEvent('sts_combat_rhythm_viewed', {
  detail: {
    bucketCount: 150,
    metrics: { averageBpm: 120, peakBpm: 180, ... },
    config: visualizationConfig,
    timestamp: Date.now(),
  }
}));

// Exported event
window.dispatchEvent(new CustomEvent('sts_combat_rhythm_exported', {
  detail: {
    format: 'json',
    dataSize: 25000,
    eventCount: 500,
    bucketCount: 150,
    timestamp: Date.now(),
  }
}));

// Processed event
window.dispatchEvent(new CustomEvent('sts_combat_rhythm_processed', {
  detail: {
    eventCount: 500,
    bucketCount: 150,
    metrics: { averageBpm: 120, ... },
    timestamp: Date.now(),
  }
}));
```

### Monitoring Setup
```typescript
// Set up telemetry monitoring
window.addEventListener('sts_combat_rhythm_viewed', (event) => {
  const { bucketCount, metrics } = event.detail;
  analytics.track('combat_rhythm_viewed', {
    bucketCount,
    averageBpm: metrics.averageBpm,
    peakBpm: metrics.peakBpm,
    stability: metrics.stability,
  });
});

window.addEventListener('sts_combat_rhythm_exported', (event) => {
  const { format, dataSize, eventCount } = event.detail;
  analytics.track('combat_rhythm_exported', {
    format,
    dataSize,
    eventCount,
  });
});
```

## Accessibility

### ARIA Support
```typescript
<CombatRhythmHeatmap
  buckets={buckets}
  metrics={metrics}
  aria-label="Combat rhythm heatmap showing BPM intensity over time"
  aria-describedby="heatmap-description"
/>

<div id="heatmap-description">
  Visual representation of combat rhythm patterns. Time is shown on the horizontal axis,
  intensity on the vertical axis. Warmer colors indicate higher intensity periods.
  Burst periods are highlighted with red borders.
</div>
```

### Keyboard Navigation
```typescript
function AccessibleHeatmap() {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight' && focusedIndex < buckets.length - 1) {
      setFocusedIndex(focusedIndex + 1);
    } else if (event.key === 'ArrowLeft' && focusedIndex > 0) {
      setFocusedIndex(focusedIndex - 1);
    }
  };
  
  return (
    <div onKeyDown={handleKeyDown} tabIndex={0}>
      <CombatRhythmHeatmap
        buckets={buckets}
        metrics={metrics}
        focusedBucket={focusedIndex >= 0 ? buckets[focusedIndex] : null}
      />
    </div>
  );
}
```

### Screen Reader Support
```typescript
function ScreenReaderHeatmap() {
  const { buckets, metrics } = useCombatRhythmData();
  
  return (
    <div>
      <CombatRhythmHeatmap
        buckets={buckets}
        metrics={metrics}
        aria-label="Combat rhythm heatmap"
      />
      
      {/* Screen reader summary */}
      <div aria-live="polite" className="sr-only">
        Combat rhythm analysis: Average BPM {metrics.averageBpm},
        Peak BPM {metrics.peakBpm}, {metrics.burstCount} burst periods detected.
        Rhythm pattern: {metrics.rhythmPattern}, Stability: {metrics.stability}.
      </div>
    </div>
  );
}
```

## Testing

### Unit Tests
```typescript
import { render, screen } from '@testing-library/react';
import CombatRhythmHeatmap from '@/ui/tools/sts/components/CombatRhythmHeatmap';

describe('CombatRhythmHeatmap', () => {
  it('should render heatmap with data', () => {
    const mockBuckets = [
      { startTime: 0, endTime: 1000, eventCount: 5, intensity: 0.5, bpm: 120, variance: 0.1, events: [], isBurst: false },
    ];
    
    const mockMetrics = {
      averageBpm: 120,
      peakBpm: 120,
      minBpm: 120,
      variance: 0.1,
      stability: 'stable' as const,
      burstCount: 0,
      burstDuration: 0,
      totalEvents: 5,
      timeSpan: 1,
      rhythmPattern: 'regular' as const,
    };
    
    render(
      <CombatRhythmHeatmap
        buckets={mockBuckets}
        metrics={mockMetrics}
        width={800}
        height={400}
      />
    );
    
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByText('Avg BPM: 120')).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
import { renderHook, act } from '@testing-library/react';
import { useCombatRhythmData } from '@/ui/tools/sts/hooks/useCombatRhythmData';

describe('useCombatRhythmData', () => {
  it('should process events and calculate metrics', async () => {
    const { result } = renderHook(() => useCombatRhythmData());
    
    act(() => {
      result.current.addEvent({
        timestamp: Date.now(),
        eventType: 'card_played',
        cardId: 'test-card',
      });
    });
    
    expect(result.current.events).toHaveLength(1);
    // Wait for processing
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(result.current.buckets.length).toBeGreaterThan(0);
  });
});
```

### Performance Tests
```typescript
describe('Performance', () => {
  it('should handle large datasets efficiently', async () => {
    const { result } = renderHook(() => useCombatRhythmData());
    
    const startTime = performance.now();
    
    act(() => {
      // Add 10,000 events
      for (let i = 0; i < 10000; i++) {
        result.current.addEvent({
          timestamp: Date.now() + i * 100,
          eventType: 'card_played',
          cardId: `card-${i}`,
        });
      }
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    });
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    expect(processingTime).toBeLessThan(5000); // Should process within 5 seconds
    expect(result.current.buckets.length).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Common Issues

#### Performance Problems
**Problem**: Heatmap rendering is slow with large datasets
**Solution**: Enable progressive rendering and reduce chunk size:
```typescript
const config = {
  visualization: {
    performance: {
      progressiveRendering: true,
      chunkSize: 500,
      maxRenderTime: 32,
    },
  },
};
```

#### Memory Issues
**Problem**: High memory usage with long combat sessions
**Solution**: Limit time window and event count:
```typescript
const config = {
  timeBuckets: {
    maxTimeWindow: 30000,           // 30 seconds max
    minEventsPerBucket: 2,          // Filter low-activity buckets
  },
  maxEvents: 5000,                  // Limit stored events
};
```

#### Color Rendering Issues
**Problem**: Colors don't look right or are too dark/light
**Solution**: Adjust intensity range and color scheme:
```typescript
const config = {
  colorPalette: {
    scheme: 'plasma',              // Try different scheme
    intensityRange: { min: 0.2, max: 0.8 }, // Adjust range
    scaleType: 'logarithmic',      // Try different scale
  },
};
```

#### Burst Detection Issues
**Problem**: Too many or too few burst periods detected
**Solution**: Adjust burst thresholds:
```typescript
const config = {
  thresholds: {
    burst: {
      minEventsPerSecond: 8,        // Increase for fewer bursts
      duration: 2,                  // Adjust duration
      intensityMultiplier: 2.5,     // Adjust multiplier
    },
  },
};
```

### Debug Mode
Enable debug mode for additional logging:
```typescript
const config = {
  debug: true,                     // Enable debug logging
  enableTelemetry: true,          // Enable telemetry for monitoring
};
```

### Performance Monitoring
Monitor performance with built-in metrics:
```typescript
const { buckets, metrics, lastUpdated } = useCombatRhythmData({
  enableRealTime: true,
  aggregationInterval: 1000,
});

// Monitor processing time
useEffect(() => {
  if (lastUpdated) {
    console.log('Last updated:', new Date(lastUpdated));
    console.log('Bucket count:', buckets.length);
    console.log('Average BPM:', metrics.averageBpm);
  }
}, [lastUpdated, buckets.length, metrics.averageBpm]);
```

## Best Practices

### Configuration Optimization
1. **Choose appropriate bucket size**: Smaller buckets for detailed analysis, larger for overview
2. **Adjust intensity range**: Match range to your data characteristics
3. **Select appropriate color scheme**: Consider colorblind accessibility
4. **Enable progressive rendering**: For datasets with >1000 buckets
5. **Limit time window**: For long combat sessions to maintain performance

### Performance Guidelines
1. **Use hardware acceleration**: Enable for better performance
2. **Limit event count**: Set reasonable maxEvents for memory management
3. **Optimize aggregation interval**: Balance between responsiveness and performance
4. **Monitor memory usage**: Watch for memory leaks in long-running applications

### Accessibility Guidelines
1. **Provide ARIA labels**: Describe the visualization for screen readers
2. **Include keyboard navigation**: Allow keyboard interaction
3. **Use colorblind-friendly palettes**: Consider cividis scheme
4. **Provide text alternatives**: Include textual summaries of key metrics

### Data Quality Guidelines
1. **Validate events**: Ensure events have proper timestamps and types
2. **Handle missing data**: Gracefully handle incomplete or invalid data
3. **Filter noise**: Use minEventsPerBucket to filter low-activity periods
4. **Monitor data quality**: Track variance and stability metrics

## Future Enhancements

### Planned Features
- [ ] **SVG Rendering**: Full SVG implementation for vector graphics
- [ ] **WebGL Rendering**: GPU-accelerated rendering for large datasets
- [ ] **Advanced Analytics**: Machine learning-based pattern recognition
- [ ] **Real-time Streaming**: WebSocket support for live data streams
- [ ] **Comparative Analysis**: Multiple combat session comparison
- [ ] **Predictive Modeling**: Rhythm prediction and optimization suggestions

### API Extensions
- [ ] **REST API**: Remote analysis and configuration
- [ ] **GraphQL Interface**: Complex query support
- [ ] **Webhook Integration**: Automated reporting and alerts
- [ ] **Plugin System**: Custom analyzers and visualizations

### Advanced Visualizations
- [ ] **3D Heatmaps**: Multi-dimensional rhythm visualization
- [ ] **Animated Transitions**: Smooth animations between states
- [ ] **Interactive Filters**: Real-time filtering and exploration
- [ ] **Comparative Overlays**: Side-by-side comparison views

### Performance Improvements
- [ ] **Web Workers**: Background processing for large datasets
- [ ] **Memory Pooling**: Efficient memory management
- [ ] **Incremental Updates**: Update only changed portions
- [ ] **Caching Strategy**: Intelligent caching of processed data

## Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Run tests
npm run test -- tests/unit/sts/CombatRhythmHeatmap.test.tsx

# Run with coverage
npm run test -- tests/unit/sts/CombatRhythmHeatmap.test.tsx --coverage
```

### Code Style
- Follow existing TypeScript patterns
- Use JSDoc for all public APIs
- Include comprehensive error handling
- Maintain test coverage above 90%

### Testing Requirements
- All public APIs must have tests
- Edge cases must be covered
- Performance benchmarks for large datasets
- Integration tests with real combat data
- Accessibility testing with screen readers

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

This heatmap system is part of the RPG Balancer project and follows the same licensing terms.

## Support

For issues, questions, or contributions:
- Create an issue in the project repository
- Check existing issues for similar problems
- Review documentation for troubleshooting
- Contact the development team

---

**Last Updated:** 2026-01-20  
**Version:** 1.0.0  
**Maintainer:** Aurora-STS – Rhythm Ops
