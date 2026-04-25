# Synergy Heatmap UI Documentation

## Overview

The Synergy Heatmap UI is an advanced visualization component for displaying synergy data between stats and archetypes in the RPG Balancer system. It provides interactive heatmap visualization, comprehensive filtering, and export capabilities following the RPG Balancer philosophy of config-first design.

## Features

### Core Features
- **Interactive Heatmap**: Visual matrix showing synergy multipliers with color-coded ratings
- **Advanced Filtering**: Filter by multiplier range, synergy rating, stat pairs, and search queries
- **Export Capabilities**: Export data in JSON, CSV, and Markdown formats
- **Real-time Statistics**: Live statistics panel showing synergy distribution
- **Telemetry Integration**: Comprehensive interaction tracking
- **Gilded Observatory Theme**: Consistent visual design with the project theme

### Enhanced Features (NP-038)
- **Config-First Design**: All colors, thresholds, and behaviors configurable
- **Enhanced Hook**: Advanced data processing with memoization and performance optimization
- **Multiple Export Formats**: JSON, CSV, and Markdown export with metadata
- **Telemetry Events**: Detailed interaction tracking for analytics
- **Responsive Design**: Mobile-friendly with compact mode support
- **Virtualization Support**: Performance optimization for large datasets

## Architecture

### Components

#### `SynergyHeatmapEnhanced`
The main React component that renders the complete synergy analysis interface.

**Props:**
```typescript
interface SynergyHeatmapEnhancedProps {
  synergies: SynergyResult[];           // Synergy data from stress testing
  marginalUtilities: MarginalUtilityResult[]; // Marginal utility data
  statLabels: Record<string, string>;  // Display labels for stats
  config?: Partial<SynergyHeatmapConfig>; // Configuration overrides
  initialFilters?: Partial<EnhancedSynergyFilterOptions>; // Initial filter state
  showStatistics?: boolean;            // Show statistics panel
  showExportControls?: boolean;        // Show export controls
  showSearch?: boolean;                // Show search bar
  compact?: boolean;                  // Compact mode for small displays
  className?: string;                  // Additional CSS classes
}
```

#### `useSynergyHeatmapEnhanced`
Enhanced React hook that manages data processing, filtering, and state management.

**Return Value:**
```typescript
interface UseSynergyHeatmapEnhancedResult {
  heatmapData: HeatmapCell[][];        // Processed heatmap matrix
  tableData: SynergyTableRow[];       // Filtered table data
  filters: EnhancedSynergyFilterOptions; // Current filter state
  updateFilters: (filters) => void;   // Update filters
  resetFilters: () => void;           // Reset to defaults
  getStatistics: () => Statistics;     // Get data statistics
  exportData: (format) => string;     // Export in specified format
  searchSynergies: (query) => SynergyTableRow[]; // Search functionality
  getColorScheme: () => ColorScheme;  // Get current color scheme
  getConfig: () => SynergyHeatmapConfig; // Get current config
  updateConfig: (config) => void;     // Update configuration
  trackInteraction: (type, data) => void; // Telemetry tracking
}
```

### Configuration

#### `SynergyHeatmapConfig`
Complete configuration object for the heatmap UI.

```typescript
interface SynergyHeatmapConfig {
  colorScheme: 'warm' | 'cool' | 'monochrome' | 'gilded';
  colors: SynergyColorSchemeConfig;     // Color definitions
  thresholds: SynergyThresholdConfig;   // Rating thresholds
  interactions: SynergyInteractionConfig; // UI interaction settings
  export: SynergyExportConfig;           // Export configuration
  performance: SynergyPerformanceConfig; // Performance settings
  defaultFilters: SynergyFilterOptions; // Default filter values
}
```

#### Default Configuration
```typescript
const DEFAULT_SYNERGY_HEATMAP_CONFIG = {
  colorScheme: 'gilded',
  thresholds: {
    opThreshold: 1.15,        // OP synergy threshold
    strongThreshold: 1.05,    // Strong synergy threshold
    weakThreshold: 0.95,       // Weak synergy threshold
    underpoweredThreshold: 0.85, // Underpowered threshold
  },
  interactions: {
    enableTooltips: true,
    enableSelection: true,
    enableClicking: true,
    hoverDebounceMs: 50,
    animationDurationMs: 200,
    maxNonVirtualizedCells: 2500,
  },
  export: {
    formats: ['json', 'csv', 'markdown'],
    includeMetadata: true,
    includeStatistics: true,
    includeRawData: true,
    csvDelimiter: ',',
    jsonIndent: 2,
    filenameTemplate: 'synergy-heatmap-{timestamp}',
  },
  performance: {
    enableVirtualization: true,
    cellSize: 40,
    maxVisibleRows: 50,
    maxVisibleColumns: 50,
    filterDebounceMs: 300,
    enableMemoization: true,
  },
};
```

## Usage

### Basic Usage

```typescript
import SynergyHeatmapEnhanced from '@/ui/balancing/components/SynergyHeatmapEnhanced';
import { mockSynergies, mockMarginalUtilities, mockStatLabels } from './data';

function SynergyAnalysisPage() {
  return (
    <SynergyHeatmapEnhanced
      synergies={mockSynergies}
      marginalUtilities={mockMarginalUtilities}
      statLabels={mockStatLabels}
    />
  );
}
```

### Advanced Usage with Custom Configuration

```typescript
import { DEFAULT_SYNERGY_HEATMAP_CONFIG } from '@/ui/balancing/config/synergyHeatmapConfig';

function CustomSynergyAnalysis() {
  const customConfig = {
    ...DEFAULT_SYNERGY_HEATMAP_CONFIG,
    colorScheme: 'cool' as const,
    thresholds: {
      ...DEFAULT_SYNERGY_HEATMAP_CONFIG.thresholds,
      opThreshold: 1.20,  // Higher OP threshold
    },
  };

  const initialFilters = {
    minMultiplier: 0.8,
    maxMultiplier: 2.0,
    rating: 'op' as const,
  };

  return (
    <SynergyHeatmapEnhanced
      synergies={synergies}
      marginalUtilities={marginalUtilities}
      statLabels={statLabels}
      config={customConfig}
      initialFilters={initialFilters}
      compact={true}
      showExportControls={true}
    />
  );
}
```

### Using the Hook Directly

```typescript
import { useSynergyHeatmapEnhanced } from '@/ui/balancing/hooks/useSynergyHeatmapEnhanced';

function CustomSynergyComponent() {
  const {
    heatmapData,
    tableData,
    filters,
    updateFilters,
    getStatistics,
    exportData,
  } = useSynergyHeatmapEnhanced({
    synergies,
    marginalUtilities,
    statLabels,
  });

  // Custom rendering logic
  return (
    <div>
      <div>Statistics: {JSON.stringify(getStatistics())}</div>
      <div>Filtered Results: {tableData.length}</div>
    </div>
  );
}
```

## Data Formats

### SynergyResult Input Format

```typescript
interface SynergyResult {
  statIds: [string, string];           // Pair of stat IDs
  synergyMultiplier: number;           // Synergy multiplier
  expectedScore: number;              // Expected combined score
  pairScore: number;                  // Actual combined score
  isOpSynergy: boolean;               // Whether synergy is OP
  isWeakSynergy: boolean;             // Whether synergy is weak
  runtimeMs?: number;                 // Optional runtime performance
  sampleSize?: number;                // Optional sample size
}
```

### Export Formats

#### JSON Export
```json
{
  "metadata": {
    "exportedAt": "2026-01-19T10:30:00.000Z",
    "totalSynergies": 150,
    "filteredSynergies": 25,
    "config": { ... },
    "filters": { ... },
    "statistics": { ... }
  },
  "synergies": [
    {
      "statPair": "Health Points × Attack Power",
      "stat1Id": "hp",
      "stat2Id": "damage",
      "synergy": { ... },
      "combinedScore": 1.25,
      "rank": 1
    }
  ],
  "rawSynergies": [ ... ],
  "matrix": { ... }
}
```

#### CSV Export
```csv
Stat Pair,Multiplier,Rating,Expected Score,Stat 1,Stat 2,Combined Score,Runtime (ms),Sample Size
Health Points × Attack Power,1.2500,op,0.8500,Health Points,Attack Power,1.2500,45,1000
```

#### Markdown Export
```markdown
# Synergy Heatmap Export

**Generated:** January 19, 2026, 10:30 AM
**Total Synergies:** 150
**Filtered Synergies:** 25

## Statistics

- Average Multiplier: 0.9834x
- Highest Multiplier: 1.2500x
- Lowest Multiplier: 0.7500x
- OP Synergies: 12
- Strong Synergies: 8
- Balanced Synergies: 20
- Weak Synergies: 15
- Underpowered Synergies: 5

## Top Synergies

| Stat Pair | Multiplier | Rating | Expected Score |
|-----------|------------|--------|----------------|
| Health Points × Attack Power | 1.25x | op | 0.8500 |
| Defense × Speed | 1.18x | strong | 0.9200 |
```

## Color Schemes

### Gilded (Default)
- **OP**: Red (`rgba(239, 68, 68, 0.8)`)
- **Strong**: Orange (`rgba(251, 146, 60, 0.8)`)
- **Balanced**: Green (`rgba(34, 197, 94, 0.8)`)
- **Weak**: Blue (`rgba(59, 130, 246, 0.8)`)
- **Underpowered**: Purple (`rgba(147, 51, 234, 0.8)`)
- **Neutral**: Gray (`rgba(107, 114, 128, 0.4)`)

### Cool Scheme
- **OP**: Blue (`rgba(59, 130, 246, 0.8)`)
- **Strong**: Indigo (`rgba(99, 102, 241, 0.8)`)
- **Balanced**: Purple (`rgba(139, 92, 246, 0.8)`)
- **Weak**: Light Purple (`rgba(168, 85, 247, 0.8)`)
- **Underpowered**: Light Gray (`rgba(196, 181, 253, 0.8)`)

### Warm Scheme
- **OP**: Red (`rgba(220, 38, 38, 0.8)`)
- **Strong**: Orange (`rgba(249, 115, 22, 0.8)`)
- **Balanced**: Yellow (`rgba(245, 158, 11, 0.8)`)
- **Weak**: Light Yellow (`rgba(251, 191, 36, 0.8)`)
- **Underpowered**: Light Yellow (`rgba(254, 240, 138, 0.8)`)

## Performance Considerations

### Virtualization
The component supports virtualization for large datasets. Enable it in the configuration:

```typescript
const config = {
  performance: {
    enableVirtualization: true,
    maxVisibleRows: 50,
    maxVisibleColumns: 50,
    cellSize: 40,
  }
};
```

### Memoization
The hook uses React.memo and useMemo for performance optimization. Key memoized values:
- Processed synergy data
- Filtered and sorted table data
- Color scheme calculations
- Statistics calculations

### Debouncing
Filter changes are debounced to prevent excessive re-renders:
- Filter updates: 300ms debounce
- Hover events: 50ms debounce

## Telemetry Events

The component emits telemetry events for user interactions:

```typescript
// Cell interaction
trackInteraction('cell_click', { 
  stat1: 'hp', 
  stat2: 'damage', 
  multiplier: 1.25 
});

// Filter change
trackInteraction('filter_change', { 
  rating: 'op', 
  minMultiplier: 1.0 
});

// Export
trackInteraction('export', { 
  format: 'csv', 
  recordCount: 25 
});
```

Listen for events:
```typescript
window.addEventListener('synergy_heatmap_interaction', (event) => {
  const { type, timestamp, data } = event.detail;
  console.log(`Synergy interaction: ${type}`, data);
});
```

## Testing

### Unit Tests
The component includes comprehensive unit tests covering:
- Component rendering
- Filter functionality
- Export functionality
- Search functionality
- Configuration changes
- Telemetry events

Run tests:
```bash
npm run test -- tests/unit/balancing/SynergyHeatmapEnhanced.test.tsx
```

### Integration Tests
Test the component with real data:
```typescript
import { render, screen } from '@testing-library/react';
import SynergyHeatmapEnhanced from '@/ui/balancing/components/SynergyHeatmapEnhanced';

test('renders with real synergy data', () => {
  render(
    <SynergyHeatmapEnhanced
      synergies={realSynergies}
      marginalUtilities={realMarginalUtilities}
      statLabels={realStatLabels}
    />
  );
  
  expect(screen.getByText('Synergy Analysis')).toBeInTheDocument();
});
```

## Troubleshooting

### Common Issues

#### Empty Heatmap
- **Cause**: No synergy data provided
- **Solution**: Ensure `synergies` prop contains valid `SynergyResult` objects

#### Colors Not Displaying
- **Cause**: Incorrect color scheme configuration
- **Solution**: Verify `colorScheme` in config matches available schemes

#### Export Not Working
- **Cause**: Missing export data or incorrect format
- **Solution**: Check `exportData` function returns valid string for format

#### Performance Issues
- **Cause**: Large dataset without virtualization
- **Solution**: Enable virtualization in performance config

### Debug Mode
Enable debug logging:
```typescript
const config = {
  interactions: {
    enableTooltips: true,
    // Add debug flag
  }
};

// Check console for debug information
```

## Integration Examples

### With Monte Carlo Results
```typescript
import { calculateSynergies } from '@/balancing/synergy/SynergyCalculator';

function MonteCarloSynergyAnalysis({ results }) {
  const synergies = calculateSynergies(results.archetypePerformance, results.baseWeights);
  
  return (
    <SynergyHeatmapEnhanced
      synergies={synergies}
      marginalUtilities={results.marginalUtilities}
      statLabels={results.statLabels}
    />
  );
}
```

### With Stress Testing
```typescript
import { useStressTesting } from '@/ui/balancing/hooks/useStressTesting';

function StressTestSynergyView() {
  const { results } = useStressTesting();
  
  return (
    <SynergyHeatmapEnhanced
      synergies={results.synergies}
      marginalUtilities={results.marginalUtilities}
      statLabels={results.statLabels}
      config={{
        colorScheme: 'warm',
        thresholds: {
          opThreshold: 1.10,  // Lower threshold for stress testing
        }
      }}
    />
  );
}
```

## Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Analytics**: Statistical significance testing
- **Custom Themes**: User-defined color schemes
- **Collaboration Features**: Shared views and annotations
- **Mobile App**: React Native implementation

### Extension Points
The component is designed for extensibility:
- Custom cell renderers
- Additional export formats
- Custom filter components
- Plugin architecture for analytics

## API Reference

### Components

#### SynergyHeatmapEnhanced
```typescript
<SynergyHeatmapEnhanced
  synergies={SynergyResult[]}
  marginalUtilities={MarginalUtilityResult[]}
  statLabels={Record<string, string>}
  config={Partial<SynergyHeatmapConfig>}
  initialFilters={Partial<EnhancedSynergyFilterOptions>}
  showStatistics={boolean}
  showExportControls={boolean}
  showSearch={boolean}
  compact={boolean}
  className={string}
/>
```

### Hooks

#### useSynergyHeatmapEnhanced
```typescript
const result = useSynergyHeatmapEnhanced({
  synergies: SynergyResult[],
  marginalUtilities: MarginalUtilityResult[],
  statLabels: Record<string, string>,
  config?: Partial<SynergyHeatmapConfig>,
});
```

### Types

#### SynergyHeatmapConfig
```typescript
interface SynergyHeatmapConfig {
  colorScheme: 'warm' | 'cool' | 'monochrome' | 'gilded';
  colors: SynergyColorSchemeConfig;
  thresholds: SynergyThresholdConfig;
  interactions: SynergyInteractionConfig;
  export: SynergyExportConfig;
  performance: SynergyPerformanceConfig;
  defaultFilters: SynergyFilterOptions;
}
```

#### EnhancedSynergyFilterOptions
```typescript
interface EnhancedSynergyFilterOptions {
  minMultiplier: number;
  maxMultiplier: number;
  rating: 'all' | 'op' | 'strong' | 'balanced' | 'weak' | 'underpowered';
  archetypePairs: [string, string][];
  statPairs: [string, string][];
  sortBy: 'multiplier' | 'score' | 'stat1' | 'stat2';
  sortDirection: 'asc' | 'desc';
  searchQuery: string;
  minSampleSize?: number;
  maxRuntimeMs?: number;
  statisticallySignificantOnly?: boolean;
}
```

## Contributing

When contributing to the Synergy Heatmap UI:

1. **Follow RPG Balancer Philosophy**: Config-first design, no hardcoding
2. **Add Tests**: Cover new features with unit tests
3. **Update Documentation**: Keep this documentation current
4. **Performance**: Consider performance implications for large datasets
5. **Accessibility**: Ensure components are accessible
6. **Telemetry**: Add telemetry events for new interactions

### Development Setup
```bash
# Install dependencies
npm install

# Run tests
npm run test -- tests/unit/balancing/SynergyHeatmapEnhanced.test.tsx

# Run linting
npm run lint -- src/ui/balancing/components/SynergyHeatmapEnhanced.tsx

# Build check
npm run build:check
```

## License

This component is part of the RPG Balancer project and follows the same licensing terms.
