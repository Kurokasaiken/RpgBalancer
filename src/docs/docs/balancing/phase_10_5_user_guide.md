# Phase 10.5 Stat Stress Testing User Guide

## Overview

Phase 10.5 Stat Stress Testing is a comprehensive analysis system that generates archetypes with enhanced stats and tests all combinations to identify synergies and marginal utility. This guide will help you understand and use the complete visualization suite for making informed balancing decisions.

## Core Concepts

### Stress Testing
- **Single-Stat Archetypes**: For each stat, create baseline + (weight × 25) points
- **Pair-Stat Archetypes**: Test all C(n,2) combinations (e.g., +25 HP + 25 Damage)
- **Marginal Utility**: Empirical value measurement via 10k simulations
- **Synergy Analysis**: Identify OP (>1.15x) and weak (<0.95x) combinations

### Key Metrics
- **pairScore**: wins_col / totalSimulations (archetype win rate vs baseline)
- **expectedScore**: Average of single stat win rates
- **synergyMultiplier**: pairScore / expectedScore
- **Thresholds**: OP (>1.15x), Weak (<0.95x), Balanced (0.95-1.15x)

## Getting Started

### 1. Access the Stress Testing Dashboard

From the main Balancer interface:
1. Click the **"Stress Test"** button in the header
2. Or navigate directly to the Stress Testing tab

### 2. Generate Archetypes

1. Click **"Generate Archetypes"** to create baseline and test archetypes
2. The system automatically:
   - Creates a baseline archetype with default stats
   - Generates single-stat archetypes for each available stat
   - Creates pair-stat archetypes for all combinations
   - Uses deterministic LCG seeding for reproducible results

### 3. Run Analysis

1. Click **"Run Analysis"** to perform marginal utility and synergy calculations
2. The system will:
   - Calculate marginal utilities for each archetype
   - Analyze synergies between stat pairs
   - Generate heatmap data for visualization
   - Provide detailed statistics and classifications

## Visualization Components

### Synergy Heatmap

The **Synergy Heatmap** provides an interactive matrix visualization of stat pair synergies:

#### Features
- **Interactive Grid**: Click any cell to see detailed synergy information
- **Color Coding**: 
  - 🔴 Red: OP synergies (>1.15x multiplier)
  - 🟠 Orange: Strong synergies (1.05-1.15x)
  - 🟢 Green: Balanced synergies (0.95-1.05x)
  - 🔵 Blue: Weak synergies (0.85-0.95x)
  - 🟣 Purple: Underpowered (<0.85x)
  - 🔘 Gray: No data
- **Statistics Panel**: Shows total synergies, OP/weak counts, and average multiplier
- **Export Functionality**: Download heatmap data as JSON

#### Usage
1. **Hover** over cells to see quick stats
2. **Click** cells to view detailed information
3. **Toggle** thresholds legend to understand color scheme
4. **Export** data for further analysis

### Stat Profile Radar

The **Stat Profile Radar** provides comparative visualization of stat profiles:

#### Features
- **SVG Radar Chart**: Multi-stat comparison with smooth animations
- **Interactive Profiles**: Click profiles to highlight and compare
- **Baseline Comparison**: Automatically includes baseline for reference
- **Configurable Display**: Toggle grid, labels, and visual elements
- **Stat Details**: Hover over stat labels to see values across profiles

#### Usage
1. **View** up to 8 stats in radar format for optimal readability
2. **Select** profiles to highlight and compare
3. **Hover** over stat labels for detailed information
4. **Toggle** grid and labels for cleaner visualization
5. **Export** radar data for documentation

### Marginal Utility Table

The **Marginal Utility Table** shows detailed marginal utility analysis:

#### Features
- **Sorted Results**: Archetypes sorted by marginal utility
- **Performance Metrics**: Average score, marginal utility, standard deviation
- **Classification**: OP, Strong, Balanced, Weak, Underpowered
- **Simulation Count**: Number of simulations run for each archetype

#### Usage
1. **Review** top-performing and underperforming archetypes
2. **Identify** stats with highest marginal utility
3. **Compare** expected vs actual performance
4. **Export** results for balancing decisions

## Advanced Features

### Progress Tracking

For long-running analyses, the system provides:
- **Real-time Progress**: Shows current operation and estimated time remaining
- **Cancellation Support**: Cancel operations if needed
- **Stage Tracking**: Monitor generation, analysis, and synergy calculation

### Historical Tracking

Save and compare results over time:
- **Save to History**: Store complete analysis results with configuration
- **Load from History**: Restore previous analyses for comparison
- **Configuration Tracking**: See how different settings affect results
- **Performance Metrics**: Track runtime and summary statistics

### What-If Scenarios

Create and test custom configurations:
- **Scenario Creation**: Define custom point allocations and thresholds
- **Scenario Testing**: Run analyses with different configurations
- **Comparative Analysis**: Compare results across scenarios
- **Configuration Management**: Save and reuse scenario settings

### Custom Configuration

Advanced users can customize:
- **Point Allocation**: Set custom points per stat instead of default +25
- **Simulation Count**: Adjust number of simulations for accuracy vs speed
- **Thresholds**: Modify OP/weak synergy thresholds
- **Progress Tracking**: Enable/disable progress indicators
- **Cancellation**: Allow operation cancellation

## Export Options

### JSON Export
Complete data export including:
- Archetype definitions
- Marginal utility results
- Synergy analysis data
- Configuration metadata
- Timestamp and runtime information

### CSV Export
Spreadsheet-ready data for:
- Marginal utility tables
- Synergy analysis tables
- Statistical summaries
- Performance metrics

### Markdown Export
Human-readable documentation including:
- Configuration summary
- Results tables
- Statistical analysis
- Timestamp and metadata

## Best Practices

### For Balancing Decisions

1. **Start with Default**: Use default +25 point allocation for initial analysis
2. **Review Synergies**: Identify OP and weak stat combinations
3. **Check Marginal Utility**: Focus on stats with highest marginal utility
4. **Validate with Scenarios**: Test custom configurations for edge cases
5. **Document Results**: Export and save important analyses

### For Performance Optimization

1. **Use Appropriate Simulation Count**: 10k simulations for accuracy, reduce for speed
2. **Limit Stat Count**: Focus on 8 most important stats for radar charts
3. **Enable Progress Tracking**: Monitor long-running operations
4. **Use Cancellation**: Stop operations if configuration is incorrect

### For Reproducible Results

1. **Note Configuration**: Document custom settings used
2. **Save to History**: Store important analyses
3. **Export Data**: Keep JSON exports for reference
4. **Use Deterministic Seeding**: Results are reproducible with same configuration

## Troubleshooting

### Common Issues

**No Archetypes Generated**
- Ensure you have stats defined in your BalancerConfig
- Check that stats are not marked as derived or hidden
- Verify configuration is valid

**Analysis Takes Too Long**
- Reduce simulation count in configuration
- Limit number of stats being tested
- Enable progress tracking to monitor

**Unexpected Results**
- Check stat weights in configuration
- Verify synergy thresholds
- Review archetype generation logic

**Export Issues**
- Ensure analysis has completed before exporting
- Check that you have results in cache
- Verify format compatibility

### Performance Tips

- **Cache Results**: System caches results to avoid re-computation
- **Use Filters**: Filter by selected stats/pairs for focused analysis
- **Batch Operations**: Generate all archetypes before running analysis
- **Monitor Progress**: Use progress tracking for long operations

## Integration with Balancer

The Stress Testing system integrates seamlessly with the Balancer:

### Configuration Sharing
- Uses same BalancerConfig as main balancer
- Inherits stat definitions and weights
- Shares simulation engine with combat system

### Data Flow
- Real-time updates when config changes
- Automatic cache invalidation
- Consistent stat definitions across components

### UI Integration
- Accessible from main Balancer interface
- Consistent Gilded Observatory theme
- Responsive design for all screen sizes

## Advanced Usage Examples

### Custom Point Allocation

```typescript
const customConfig = {
  pointsPerStat: 30,
  customPointAllocation: true,
  customPointsPerStat: {
    'hp': 40,
    'damage': 20,
    'defense': 30,
  },
  simulationCount: 15000,
  opSynergyThreshold: 1.2,
  weakSynergyThreshold: 0.9,
};
```

### Scenario Comparison

1. **Create Baseline**: Run analysis with default configuration
2. **Save to History**: Store baseline results
3. **Create Scenario**: Define custom configuration
4. **Run Scenario**: Test custom configuration
5. **Compare Results**: Use saved history for comparison

### Historical Analysis

1. **Run Multiple Analyses**: Test different configurations over time
2. **Save Each Result**: Build historical database
3. **Load and Compare**: Review trends and patterns
4. **Export Summary**: Create comprehensive reports

## Conclusion

Phase 10.5 Stat Stress Testing provides a comprehensive suite of tools for analyzing stat synergies and marginal utility. By following this guide, you can make informed balancing decisions based on empirical data rather than intuition.

The system is designed to be:
- **Configurable**: Adapt to different balancing needs
- **Reproducible**: Consistent results with same configuration
- **Extensible**: Easy to add new analysis types
- **User-Friendly**: Intuitive interface with clear visualizations

Use these tools to create balanced, engaging gameplay experiences backed by solid statistical analysis.
