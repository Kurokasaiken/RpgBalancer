# STS Deck Consistency Monitor

## Overview

The STS Deck Consistency Monitor is a comprehensive tool for analyzing Slay the Spire deck presets to ensure they follow balancing rules and maintain consistency with configured weights and thresholds.

## Features

- **Deck Analysis**: Analyzes individual deck presets for consistency with balancing rules
- **Card-Level Analysis**: Evaluates each card's point allocation vs expected values
- **Multi-Deck Support**: Batch analysis of multiple deck presets
- **Export Formats**: JSON and Markdown report generation
- **CLI Integration**: Command-line tool for automated analysis
- **Telemetry Support**: Integration with STS deck consistency telemetry events
- **Persistence**: Remembers last analyzed preset for interactive mode

## Architecture

### Core Components

1. **Deck Rules Configuration** (`src/balancing/config/sts/deckRules.ts`)
   - Defines consistency thresholds and validation rules
   - Contains card point calculation weights
   - Provides Zod schemas for validation

2. **Deck Consistency Monitor** (`src/balancing/tools/sts/DeckConsistencyMonitor.ts`)
   - Main analysis engine
   - Implements consistency checking algorithms
   - Provides export functionality

3. **CLI Report Tool** (`scripts/sts/deckConsistencyReport.ts`)
   - Command-line interface for deck analysis
   - Supports batch processing and multiple output formats
   - Interactive mode for preset selection

## Configuration

### Default Thresholds

```typescript
export const DEFAULT_DECK_CONSISTENCY_THRESHOLDS = {
  maxCardDeviationPercent: 5.0,    // Max deviation per card
  maxDeckDeviationPercent: 5.0,    // Max deck total deviation
  minDeckSize: 10,                 // Minimum deck size
  maxDeckSize: 50,                 // Maximum deck size
  maxDuplicateCards: 2,            // Max duplicates (excluding basics)
  maxCostDeviationPercent: 10.0,    // Max cost distribution deviation
};
```

### Card Point Weights

The system uses weighted calculations based on card properties:

```typescript
export const CARD_POINT_WEIGHTS = {
  // Basic cards
  strike: { base: 1, costMultiplier: 1.0 },
  defend: { base: 1, costMultiplier: 1.0 },
  
  // Attack cards
  bash: { base: 2, costMultiplier: 1.5 },
  cleave: { base: 3, costMultiplier: 1.2 },
  
  // Type multipliers
  type: {
    attack: 1.0,
    skill: 0.8,
    power: 1.2,
    curse: 0.5,
    status: 0.3,
  },
  
  // Upgraded card bonus
  upgraded: { bonus: 1.5 },
};
```

## Usage

### Programmatic API

```typescript
import { DeckConsistencyMonitor } from '../src/balancing/tools/sts/DeckConsistencyMonitor';

// Initialize monitor
const monitor = new DeckConsistencyMonitor();

// Analyze single deck
const result = await monitor.analyzeDeck(presetData);

// Analyze multiple decks
const results = await monitor.analyzeMultipleDecks([preset1, preset2]);

// Export results
const jsonReport = monitor.exportToJSON(results);
const markdownReport = monitor.exportToMarkdown(results);
```

### CLI Usage

```bash
# Analyze single preset
tsx scripts/sts/deckConsistencyReport.ts -i preset.json

# Analyze directory of presets
tsx scripts/sts/deckConsistencyReport.ts -i data/presets/sts/

# Generate specific format
tsx scripts/sts/deckConsistencyReport.ts -i presets/ -f json

# Strict mode with tighter thresholds
tsx scripts/sts/deckConsistencyReport.ts -i presets/ --strict

# Interactive mode
tsx scripts/sts/deckConsistencyReport.ts -i presets/ --interactive

# Custom output directory
tsx scripts/sts/deckConsistencyReport.ts -i presets/ -o reports/
```

## Analysis Results

### Deck Consistency Result

```typescript
interface DeckConsistencyResult {
  deckId: string;
  deckName: string;
  totalCards: number;
  actualTotalPoints: number;
  expectedTotalPoints: number;
  totalDeviationPercent: number;
  isConsistent: boolean;
  cardResults: CardConsistencyResult[];
  warnings: string[];
  suggestions: string[];
  summary: {
    consistentCards: number;
    inconsistentCards: number;
    totalWarnings: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}
```

### Card Consistency Result

```typescript
interface CardConsistencyResult {
  cardId: string;
  cardName: string;
  actualPoints: number;
  expectedPoints: number;
  deviationPercent: number;
  isConsistent: boolean;
  warnings: string[];
  suggestions: string[];
}
```

## Validation Rules

### Deck-Level Checks

1. **Size Validation**: Ensures deck size is within min/max bounds
2. **Duplicate Check**: Limits duplicate cards (excluding basic strikes/defends)
3. **Cost Distribution**: Validates cost curve distribution
4. **Total Deviation**: Checks overall deck point allocation

### Card-Level Checks

1. **Point Allocation**: Compares actual vs expected points
2. **Quantity Limits**: Validates card quantities
3. **Upgrade Analysis**: Considers upgrade bonuses
4. **Type Balance**: Evaluates card type distribution

## Export Formats

### JSON Export

```json
{
  "exportedAt": "2026-01-16T12:00:00.000Z",
  "config": { /* monitor configuration */ },
  "results": [ /* analysis results */ ],
  "summary": {
    "totalDecks": 5,
    "consistentDecks": 3,
    "inconsistentDecks": 2,
    "averageDeviation": 4.2
  }
}
```

### Markdown Export

```markdown
# STS Deck Consistency Report

Generated: 2026-01-16T12:00:00.000Z
Total Decks: 5

## Summary
| Deck | Cards | Deviation | Status | Severity |
|------|-------|-----------|--------|----------|
| Ironclad Starter | 10 | 3.2% | ✅ Consistent | LOW |
| Advanced Deck | 15 | 7.8% | ❌ Inconsistent | MEDIUM |

## Detailed Analysis
### Ironclad Starter
- **Total Cards**: 10
- **Deviation**: 3.2%
- **Status**: Consistent
- **Severity**: LOW
- **Consistent Cards**: 8/10

**Warnings**:
- ⚠️ Card Bash has 6.7% deviation (threshold: 5.0%)

**Suggestions**:
- 💡 Consider adjusting Bash quantity or cost to reduce 6.7% deviation
```

## Telemetry Integration

The monitor integrates with STS telemetry system:

```typescript
// Telemetry event emitted on analysis
{
  eventType: 'sts_deck_consistency_alert',
  data: {
    deckId: 'starter-ironclad',
    severity: 'medium',
    deviationPercent: 7.2,
    inconsistentCards: 3,
    warnings: ['High deviation on Bash card'],
    timestamp: 1641894400000,
  }
}
```

## Persistence

The system uses PersistenceService for:

- **Last Analyzed Preset**: Stores the most recently analyzed preset for CLI interactive mode
- **Configuration**: Remembers user preferences and custom thresholds
- **Analysis History**: Maintains analysis history for trend tracking

## Performance

- **Single Deck**: < 50ms analysis time
- **Batch Processing**: < 500ms for 10 decks
- **Memory Usage**: < 10MB for typical analysis
- **Large Decks**: Handles 50+ cards efficiently

## Error Handling

The system provides comprehensive error handling:

- **Invalid Preset Structure**: Clear validation errors
- **Missing Card Data**: Graceful degradation
- **Import Failures**: Continues with valid presets
- **Export Errors**: Fallback to console output

## Testing

Comprehensive test suite covers:

- **Basic Analysis**: Core functionality validation
- **Edge Cases**: Invalid data handling
- **Performance**: Large deck processing
- **Export**: Format validation
- **Persistence**: Storage integration
- **CLI**: Command-line interface

Run tests:
```bash
npm run test:unit -- tests/unit/sts/DeckConsistencyMonitor.test.ts
```

## Integration Points

### STS Telemetry Dashboard
- Import analysis results into dashboard
- Real-time consistency monitoring
- Historical trend analysis

### CI/CD Pipeline
- Automated deck validation on preset changes
- PR checks for consistency violations
- Automated report generation

### BalancerConfigStore
- Integration with configuration management
- Threshold customization
- Rule updates

## Future Enhancements

Planned features:

1. **Advanced Analytics**: Statistical analysis of deck patterns
2. **Machine Learning**: Predictive consistency checking
3. **Web Interface**: Browser-based analysis tool
4. **Real-time Monitoring**: Live deck consistency tracking
5. **Custom Rules**: User-defined validation rules
6. **Export Enhancements**: Additional formats (CSV, PDF)

## Troubleshooting

### Common Issues

1. **Import Errors**: Check file paths and structure
2. **Validation Failures**: Verify preset schema compliance
3. **Performance Issues**: Monitor memory usage with large datasets
4. **Export Problems**: Check file permissions and disk space

### Debug Mode

Enable verbose output:
```bash
tsx scripts/sts/deckConsistencyReport.ts -i presets/ --verbose
```

---

*Last updated: 2026-01-16*
*Version: 1.0.0*
