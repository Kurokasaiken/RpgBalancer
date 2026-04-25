# STS Card Notebook Export Documentation

## Overview

The STS Card Notebook Exporter is a comprehensive tool for exporting Slay the Spire (STS) card data with affinity analysis, synergy detection, and weight calculations. This tool generates both markdown notebooks and JSON datasets for design analysis and reference.

## Features

### Core Functionality
- **Multi-source Card Loading**: Loads cards from archmage deck configurations and preset JSON files
- **Affinity Calculation**: Calculates comprehensive affinity metrics including cost efficiency, tag weights, and synergy potential
- **Synergy Detection**: Identifies card synergies based on tags, types, and special combinations
- **Multiple Export Formats**: Supports both markdown notebooks and structured JSON exports
- **Configurable Filtering**: Filter cards by tags, types, and sorting preferences
- **Telemetry Integration**: Tracks export operations for analytics and monitoring

### Export Formats

#### Markdown Notebook
- Comprehensive card documentation with sections
- Affinity analysis tables and charts
- Synergy analysis with detailed explanations
- Table of contents for easy navigation
- Statistics and summary sections

#### JSON Export
- Structured data for programmatic access
- Complete card metadata and affinity metrics
- Synergy analysis results
- Export configuration and timestamps

## Usage

### Basic Export

```typescript
import { STSCardNotebookExporter } from './scripts/sts/cardNotebookExport';

const exporter = new STSCardNotebookExporter();
const result = await exporter.export();

console.log(`Exported ${result.cardCount} cards in ${result.duration}ms`);
console.log(`Files: ${result.files.join(', ')}`);
```

### Custom Configuration

```typescript
const exporter = new STSCardNotebookExporter({
  outputDir: 'custom/exports',
  includeAffinity: true,
  includeSynergies: true,
  formats: ['markdown', 'json'],
  tagFilters: ['basic', 'damage'],
  typeFilters: ['attack'],
  sortBy: 'affinity',
  sortOrder: 'desc',
});

const result = await exporter.export();
```

### CLI Usage

```bash
# Run with default configuration
npx tsx scripts/sts/cardNotebookExport.ts

# Run with custom configuration (if implemented)
npx tsx scripts/sts/cardNotebookExport.ts --config custom-config.json
```

## Card Sources

### Archmage Deck Configurations
- Located in `src/balancing/config/archmage/decks/`
- Contains `SpellCardConfig` objects with mana costs and effects
- Supports multiple deck presets and custom configurations

### Preset Configurations
- Located in `data/presets/sts/`
- JSON files with `STSCardConfig` objects
- Includes starter decks and custom presets

## Affinity Calculation

### Metrics

The affinity system calculates multiple metrics to evaluate card quality and synergy potential:

#### Total Score (0-100)
Overall card quality score combining all factors:
- Cost Efficiency (30% weight)
- Tag Weight (30% weight)
- Type Affinity (20% weight)
- Rarity Bonus (10% weight)
- Synergy Potential (10% weight)

#### Cost Efficiency
- Inversely proportional to mana cost
- Higher efficiency for lower cost cards
- Bonuses for scaling cards
- Penalties for exhaust cards

#### Tag Weight
- Different tags have different importance weights
- Common tags: `basic` (0.5), `damage` (0.8), `defense` (0.7)
- Special tags: `scaling` (0.9), `combo` (0.8), `support` (0.7)
- Negative tags: `exhaust` (-0.2), `curse` (-0.3)

#### Type Affinity
- Attack cards: 0.8 weight
- Skill cards: 0.7 weight
- Power cards: 0.9 weight
- Curse cards: -0.3 weight
- Status cards: 0.5 weight

#### Rarity Bonus
- Basic: 0 points
- Common: 5 points
- Uncommon: 10 points
- Rare: 15 points
- Special: 20 points

#### Synergy Potential
- Multiple tags: +20 points
- Synergy tags: +15 points each (`combo`, `scaling`, `support`, `draw`)
- Anti-synergy tags: -10 points each (`exhaust`, `curse`)

## Synergy Detection

### Synergy Types

#### Combo Synergies
- Attack + Skill combinations
- Low cost card combinations
- Tag-based combinations

#### Support Synergies
- Defense + Attack combinations
- Resource generation + scaling cards
- Draw + combo cards

#### Scaling Synergies
- Draw enables scaling cards
- Multi-turn synergy potential
- Growth combinations

### Synergy Strength
- Calculated based on multiple factors
- Range: 0-10 points
- Only meaningful synergies (>3 points) are included
- Top 10 synergies per card

## Configuration

### ExportConfig Interface

```typescript
interface ExportConfig {
  outputDir: string;                    // Output directory
  includeAffinity: boolean;            // Include affinity calculations
  includeSynergies: boolean;           // Include synergy analysis
  formats: ('markdown' | 'json')[];    // Export formats
  tagFilters?: string[];               // Filter by tags
  typeFilters?: string[];              // Filter by types
  sortBy?: 'name' | 'cost' | 'affinity' | 'type';  // Sort field
  sortOrder?: 'asc' | 'desc';          // Sort order
}
```

### Default Configuration

```typescript
const DEFAULT_EXPORT_CONFIG = {
  outputDir: 'data/exports/sts',
  includeAffinity: true,
  includeSynergies: true,
  formats: ['markdown', 'json'],
  sortBy: 'name',
  sortOrder: 'asc',
};
```

## Output Structure

### Markdown Files
```
sts_card_notebook_2026-01-19T15-30-00-000Z.md
├── Header with overview and statistics
├── Table of contents
├── Card sections (one per card)
│   ├── Basic info (type, cost, rarity, tags)
│   ├── Affinity analysis
│   └── Synergy information
├── Affinity summary (top cards, statistics)
└── Synergy analysis (tag combinations, clusters)
```

### JSON Files
```json
{
  "metadata": {
    "timestamp": "2026-01-19T15:30:00.000Z",
    "version": "1.0.0",
    "cardCount": 150,
    "exportConfig": { ... }
  },
  "cards": [
    {
      "id": "strike-1",
      "name": "Strike",
      "type": "attack",
      "rarity": "basic",
      "cost": 1,
      "tags": ["basic", "attack", "damage"],
      "affinity": { ... },
      "synergies": [ ... ],
      "source": "archmage"
    }
  ],
  "affinitySummary": { ... },
  "synergyAnalysis": { ... }
}
```

## Telemetry

### Events

The exporter emits telemetry events for monitoring and analytics:

#### `sts_card_notebook_exported`
```typescript
{
  eventType: 'sts_card_notebook_exported',
  data: {
    timestamp: string,
    cardCount: number,
    formats: string[],
    duration: number,
    outputFiles: string[],
    config: ExportConfig,
    affinitySummary: AffinitySummary
  }
}
```

### Monitoring

- Export duration tracking
- Card count monitoring
- Format usage statistics
- Error rate tracking
- Configuration analysis

## Integration

### With STS Simulator
- Use exported data for deck analysis
- Import affinity metrics for AI decision making
- Leverage synergy data for combo detection

### With Design Tools
- Import JSON into design applications
- Use markdown for documentation and reference
- Analyze card balance and distribution

### With Analytics Pipeline
- Export data to data lake
- Integrate with visualization tools
- Support custom analysis workflows

## Performance

### Benchmarks
- **Small datasets** (<50 cards): < 500ms
- **Medium datasets** (50-200 cards): < 2s
- **Large datasets** (200+ cards): < 5s

### Memory Usage
- **Base memory**: ~10MB
- **Per card**: ~50KB
- **Affinity calculations**: ~100KB per card
- **Synergy analysis**: ~200KB per card

### Optimization Tips
- Use filters to reduce dataset size
- Disable affinity/synergy for faster exports
- Export only required formats
- Use JSON for programmatic access

## Troubleshooting

### Common Issues

#### Card Loading Failures
- Check file paths and permissions
- Verify JSON syntax in preset files
- Ensure archmage deck configurations are valid

#### Affinity Calculation Errors
- Verify card data completeness
- Check for missing required fields
- Validate tag and type values

#### Export Failures
- Check output directory permissions
- Verify disk space availability
- Ensure file paths are valid

#### Performance Issues
- Reduce dataset size with filters
- Disable expensive calculations
- Use SSD storage for faster I/O

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=sts:* npx tsx scripts/sts/cardNotebookExport.ts
```

## Examples

### Export Only Attack Cards
```typescript
const exporter = new STSCardNotebookExporter({
  typeFilters: ['attack'],
  sortBy: 'affinity',
  sortOrder: 'desc',
  formats: ['json'],
});

const result = await exporter.export();
```

### Export High-Synergy Cards
```typescript
const exporter = new STSCardNotebookExporter({
  tagFilters: ['combo', 'scaling'],
  includeSynergies: true,
  includeAffinity: true,
  formats: ['markdown'],
});

const result = await exporter.export();
```

### Export for Balance Analysis
```typescript
const exporter = new STSCardNotebookExporter({
  sortBy: 'affinity',
  sortOrder: 'desc',
  includeAffinity: true,
  includeSynergies: true,
  formats: ['markdown', 'json'],
});

const result = await exporter.export();
```

## Future Enhancements

### Planned Features
- **Custom Weight Configuration**: Allow custom affinity weight settings
- **Advanced Synergy Detection**: Machine learning-based synergy prediction
- **Historical Analysis**: Track card changes over time
- **Export Templates**: Customizable export templates
- **Batch Processing**: Process multiple configurations
- **Real-time Updates**: Watch for card changes and auto-export

### Integration Opportunities
- **STS Simulator**: Direct integration for real-time analysis
- **Design Tools**: Plugin for popular design applications
- **Analytics Platform**: Integration with data visualization tools
- **Version Control**: Track card changes in Git repositories

## API Reference

### Classes

#### STSCardNotebookExporter
Main exporter class with configuration and export methods.

### Functions

#### loadAllSTSCards()
Loads all STS cards from available sources.

#### calculateCardAffinity(card)
Calculates affinity metrics for a single card.

#### findCardSynergies(card, allCards)
Finds synergies between a card and all other cards.

### Types

#### STSCardNotebook
Enhanced card structure with affinity and synergy data.

#### CardAffinityMetrics
Affinity calculation results with multiple metrics.

#### CardSynergy
Synergy information between two cards.

#### ExportConfig
Configuration options for the export process.

#### ExportResult
Results of an export operation with metadata.

## Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Run tests
npm run test -- tests/unit/sts/CardNotebookExport.test.ts

# Run linting
npm run lint -- scripts/sts

# Build check
npm run build:check
```

### Code Style
- Use TypeScript for all new code
- Follow project ESLint configuration
- Add JSDoc comments for all public APIs
- Write comprehensive unit tests
- Use meaningful variable and function names

### Testing
- Unit tests for all core functionality
- Integration tests for export workflows
- Performance tests for large datasets
- Error handling tests for edge cases

## License

This tool is part of the RPG Balancer project and follows the same licensing terms.
