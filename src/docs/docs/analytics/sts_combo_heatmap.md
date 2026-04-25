# STS Combo Efficiency Heatmap Analytics

## Overview

The STS Combo Efficiency Heatmap provides interactive visualization of card combo efficiency based on Monte Carlo simulations. This document outlines the KPI flow, usage patterns, and analytics integration.

## Features

### Core Functionality
- **Interactive Heatmap**: Grid-based visualization of combo efficiency with color-coded ratings
- **Real-time Filtering**: Filter by efficiency range, combo types, sample size, and tags
- **Tooltips**: Detailed combo information on hover with efficiency metrics
- **Statistics Panel**: Live statistics showing combo distribution and averages
- **Export Capabilities**: Export data in JSON, CSV, or Markdown formats

### Data Sources
- **Scenario Runner**: Monte Carlo simulation results from `scripts/balancer/scenarioRunner.ts`
- **Combo Weights**: Config-driven combo definitions from `src/balancing/config/sts/comboWeights.ts`
- **Presets**: Template configurations from `data/presets/sts/combo_heatmap_template.json`

## KPI Flow

### Data Pipeline
1. **Simulation Input**: Scenario runner processes Monte Carlo simulations with configurable parameters
2. **Combo Discovery**: System identifies card combinations and calculates efficiency metrics
3. **Data Processing**: Hook aggregates and processes data for visualization
4. **Visualization**: Component renders heatmap with interactive features
5. **Analytics**: Telemetry events track user interactions and system performance

### Key Metrics
- **Total Combos Analyzed**: Number of unique combinations discovered
- **OP Combos**: Count of combos with efficiency ≥ 2.0x
- **Strong Combos**: Count of combos with efficiency ≥ 1.5x
- **Balanced Combos**: Count of combos with efficiency ≥ 1.0x
- **Average Efficiency**: Mean efficiency across all combos
- **Sample Size**: Number of simulations per combo for statistical significance

## Telemetry Events

### User Interaction Events
```typescript
// Heatmap viewed
{
  eventType: 'sts_combo_heatmap_viewed',
  data: {
    timestamp: number,
    comboCount: number,
    filters: ComboHeatmapFilters,
    config: STSComboHeatmapConfig,
  }
}

// Filters changed
{
  eventType: 'sts_combo_heatmap_filters_changed',
  data: {
    timestamp: number,
    filters: ComboHeatmapFilters,
    filteredCount: number,
  }
}

// Combo cell clicked
{
  eventType: 'sts_combo_heatmap_cell_clicked',
  data: {
    timestamp: number,
    comboId: string,
    efficiency: number,
    rating: string,
    position: { row: number, col: number },
  }
}

// Data exported
{
  eventType: 'sts_combo_heatmap_exported',
  data: {
    timestamp: number,
    format: 'json' | 'csv' | 'markdown',
    comboCount: number,
    filters: ComboHeatmapFilters,
  }
}
```

### System Performance Events
```typescript
// Data refreshed
{
  eventType: 'sts_combo_heatmap_refreshed',
  data: {
    timestamp: number,
    comboCount: number,
    processingTimeMs: number,
    memoryUsageMB: number,
  }
}

// Render performance
{
  eventType: 'sts_combo_heatmap_rendered',
  data: {
    timestamp: number,
    cellCount: number,
    renderTimeMs: number,
    filterCount: number,
  }
}
```

## Usage Patterns

### Typical Workflow
1. **Load Preset**: User selects or loads a combo analysis preset
2. **Configure Filters**: Adjust efficiency range, combo types, and other filters
3. **Analyze Heatmap**: Review color-coded grid for high-efficiency combos
4. **Investigate Combos**: Hover/click cells for detailed information
5. **Export Results**: Export filtered data for further analysis

### Power User Features
- **Custom Filters**: Advanced filtering by tags, archetypes, and sample sizes
- **Performance Mode**: Optimized rendering for large datasets
- **High Contrast Mode**: Enhanced accessibility with distinct colors
- **Batch Export**: Export multiple filter configurations

## Configuration

### Heatmap Configuration
```typescript
const config: STSComboHeatmapConfig = {
  colorScheme: {
    opColor: '#10b981',      // emerald-500
    strongColor: '#f59e0b',  // amber-500
    balancedColor: '#3b82f6', // blue-500
    weakColor: '#8b5cf6',    // violet-500
    poorColor: '#ef4444',    // red-500
    noDataColor: '#6b7280',   // gray-500
  },
  thresholds: {
    opThreshold: 2.0,
    strongThreshold: 1.5,
    balancedThreshold: 1.0,
    weakThreshold: 0.7,
    minSampleSize: 100,
    minConfidence: 0.8,
  },
  visualization: {
    cellSize: 40,
    borderWidth: 1,
    fontSize: 12,
    showTooltips: true,
    animationDuration: 300,
    colorIntensity: 0.8,
  },
  filters: {
    minEfficiency: 0.0,
    maxEfficiency: 3.0,
    allowedTypes: ['pair', 'triple', 'sequence', 'synergy'],
    minSampleSizeFilter: 50,
    includeTags: [],
    excludeTags: [],
  },
};
```

### Preset Structure
```json
{
  "id": "combo_heatmap_template",
  "name": "Combo Heatmap Template",
  "scenario": "basic-1v1",
  "config": {
    "iterations": 10000,
    "seed": 12345,
    "targetTurns": 20,
    "archetypes": ["warrior", "mage", "rogue", "cleric"],
    "cardPool": ["strike", "defend", "bash", "anger", ...],
    "comboTypes": ["pair", "triple", "sequence"],
    "minSampleSize": 100,
    "confidenceThreshold": 0.8
  },
  "heatmapConfig": { ... },
  "sampleCombos": [ ... ],
  "analysisMetadata": { ... }
}
```

## Performance Considerations

### Optimization Strategies
- **Virtual Scrolling**: For large datasets (>1000 combos)
- **Memoization**: Cached processed data to avoid re-computation
- **Debounced Filtering**: Delay filter updates for better responsiveness
- **Lazy Loading**: Load combo data on demand for large scenarios

### Memory Management
- **Data Paging**: Process combos in chunks for memory efficiency
- **Cache Cleanup**: Automatic cleanup of unused cached data
- **Performance Monitoring**: Track memory usage and render times

## Integration Points

### Scenario Runner Integration
```typescript
// Load combo data from scenario runner
const comboData = await loadScenarioResults('basic-1v1', {
  iterations: 10000,
  seed: 12345,
  targetTurns: 20,
});

// Process for heatmap
const processedData = processComboData(comboData, filters, config);
```

### Persistence Integration
```typescript
// Save last used configuration
await saveData('sts-combo-heatmap-config', {
  filters: currentFilters,
  config: currentConfig,
  lastUpdated: Date.now(),
});

// Load saved configuration
const savedConfig = await loadData('sts-combo-heatmap-config');
```

### Analytics Integration
```typescript
// Track user interactions
emitTelemetryEvent('sts_combo_heatmap_viewed', {
  timestamp: Date.now(),
  comboCount: processedData.length,
  filters: currentFilters,
});
```

## Troubleshooting

### Common Issues
1. **Empty Heatmap**: Check scenario runner output and preset configuration
2. **Performance Issues**: Reduce dataset size or enable performance mode
3. **Incorrect Colors**: Verify color scheme configuration and thresholds
4. **Missing Toololtips**: Ensure tooltip configuration is enabled

### Debug Information
```typescript
// Enable debug mode
const debugConfig = {
  ...DEFAULT_COMBO_HEATMAP_CONFIG,
  debug: {
    enableLogging: true,
    showPerformanceMetrics: true,
    logDataProcessing: true,
  },
};

// Check data integrity
console.log('Combo data integrity:', {
  totalCombos: comboData.length,
  validCombos: comboData.filter(c => validateComboWeight(c)).length,
  averageEfficiency: comboData.reduce((sum, c) => sum + c.efficiencyMultiplier, 0) / comboData.length,
});
```

## Future Enhancements

### Planned Features
- **Real-time Updates**: Live simulation results streaming
- **Advanced Analytics**: Machine learning combo recommendations
- **Collaborative Features**: Shared presets and annotations
- **Mobile Optimization**: Touch-friendly interface for mobile devices

### API Extensions
- **Custom Metrics**: User-defined efficiency calculations
- **Plugin System**: Extensible combo analysis modules
- **Export Formats**: Additional export formats (PDF, Excel)
- **Integration APIs**: External tool integrations

## Documentation

### Related Documents
- [STS Simulator UI Redesign Plan](../plans/sts_simulator_ui_redesign_plan.md)
- [Scenario Runner Documentation](../../scripts/balancer/scenarioRunner.ts)
- [Combo Weights Configuration](../../balancing/config/sts/comboWeights.ts)

### Code Examples
- [ComboHeatmap Component](../../ui/tools/sts/components/ComboHeatmap.tsx)
- [useComboHeatmapData Hook](../../ui/tools/sts/hooks/useComboHeatmapData.ts)
- [Unit Tests](../../../tests/unit/sts/ComboHeatmap.test.tsx)

---

*Last updated: 2026-01-16*
*Version: 1.0.0*
