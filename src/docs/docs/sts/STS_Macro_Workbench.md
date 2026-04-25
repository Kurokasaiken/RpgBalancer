# STS Macro Search Engine - Documentation

## Overview

The STS Macro Search Engine provides comprehensive search functionality for STS macros with configurable scoring, indexing, and export capabilities. It includes a React hook for UI integration, a CLI tool for bulk operations, and comprehensive telemetry tracking.

## Architecture

### Components

1. **Search Hook** (`src/ui/tools/sts/hooks/useSTSMacroSearch.ts`) - Core search logic and state management
2. **CLI Tool** (`scripts/stsTelemetry/macroSearchCLI.ts`) - Command-line interface for bulk operations
3. **UI Component** (`src/ui/tools/sts/components/STSMacroSearch.tsx`) - React search interface
4. **Test Suite** (`tests/unit/sts/STSMacroSearch.test.tsx`) - Comprehensive test coverage

### Data Flow

```
Macros → Index Builder → Search Engine → Scoring Algorithm → Results → UI/CLI Export
```

## Features

### Search Capabilities
- **Text Search**: Fuzzy matching on labels, descriptions, tags, and categories
- **Tag Filtering**: Filter by multiple tags with AND logic
- **Category Filtering**: Filter by macro categories
- **Range Filtering**: Filter by cooldown and turn cost ranges
- **Custom/System Filtering**: Separate custom and system macros
- **Configurable Scoring**: Weight-based relevance scoring
- **Multiple Sort Options**: Relevance, name, cooldown, turn cost, frequency

### Indexing System
- **Automatic Indexing**: Builds search index on mount and data changes
- **Frequency Tracking**: Calculates execution frequency from history
- **Tag/Category Maps**: Maintains frequency statistics
- **Performance Optimized**: Fast lookups with Map-based indexing

### Export Capabilities
- **JSON Export**: Structured data with metadata
- **CSV Export**: Spreadsheet-compatible format
- **Search Results**: Include scores and match details
- **Full Library**: Complete macro library with index data

## Usage

### React Hook

```tsx
import { useSTSMacroSearch } from '@/ui/tools/sts/hooks/useSTSMacroSearch';
import { STSMacroSearch } from '@/ui/tools/sts/components/STSMacroSearch';

function MacroSearchPage() {
  const { macros, executionHistory } = useSTSMacroLibrary();
  
  const searchHook = useSTSMacroSearch(macros, {
    labelWeight: 0.4,
    descriptionWeight: 0.2,
    tagWeight: 0.2,
    categoryWeight: 0.1,
    cooldownWeight: 0.05,
    frequencyWeight: 0.05,
    fuzzySearch: true,
    minScoreThreshold: 0.1,
    maxResults: 50,
  }, executionHistory);

  return (
    <STSMacroSearch
      macros={macros}
      executionHistory={executionHistory}
      onMacroSelect={(macro) => console.log('Selected:', macro)}
    />
  );
}
```

### CLI Commands

```bash
# Build search index
tsx scripts/stsTelemetry/macroSearchCLI.ts index

# Search macros
tsx scripts/stsTelemetry/macroSearchCLI.ts search "attack" --tags combat,damage --sort-by relevance

# Export macros
tsx scripts/stsTelemetry/macroSearchCLI.ts export --format json --output macros.json

# Show statistics
tsx scripts/stsTelemetry/macroSearchCLI.ts stats --detailed
```

### Search Configuration

```typescript
const searchConfig: STSMacroSearchConfig = {
  labelWeight: 0.4,        // Weight for label matches
  descriptionWeight: 0.2,  // Weight for description matches
  tagWeight: 0.2,         // Weight for tag matches
  categoryWeight: 0.1,    // Weight for category matches
  cooldownWeight: 0.05,    // Weight for cooldown bonus
  frequencyWeight: 0.05,  // Weight for execution frequency
  fuzzySearch: true,       // Enable fuzzy matching
  minScoreThreshold: 0.1,  // Minimum score to include
  maxResults: 50,          // Maximum results to return
};
```

## Search Algorithm

### Scoring Formula

```
Score = (labelMatch * labelWeight) +
        (descriptionMatch * descriptionWeight) +
        (tagMatch * tagWeight) +
        (categoryMatch * categoryWeight) +
        (cooldownBonus * cooldownWeight) +
        (frequencyBonus * frequencyWeight)
```

### Match Types

- **Exact Match**: 1.0 score
- **Contains Match**: 0.8 score
- **Fuzzy Match**: 0.2-0.8 score based on similarity
- **Cooldown Bonus**: `max(0, 1 - cooldown/60)`
- **Frequency Bonus**: `min(frequency, 1)` where frequency = executions/day

### Search Query

```typescript
interface STSMacroSearchQuery {
  query: string;                    // Search text
  tags?: string[];                  // Filter by tags
  category?: string;               // Filter by category
  cooldownRange?: {                // Filter by cooldown range
    min: number;
    max: number;
  };
  turnCostRange?: {                 // Filter by turn cost range
    min: number;
    max: number;
  };
  customOnly?: boolean;              // Custom macros only
  systemOnly?: boolean;              // System macros only
  sortBy?: 'relevance' | 'label' | 'cooldown' | 'turnCost' | 'frequency';
  sortOrder?: 'asc' | 'desc';
}
```

## Telemetry Events

### Search Events

```typescript
// Index built
createTelemetryEvent('sts_macro_index_built', {
  macroCount: 150,
  tagCount: 25,
  categoryCount: 8,
  buildDuration: 45,
});

// Search performed
createTelemetryEvent('sts_macro_search_performed', {
  query: 'attack',
  filterCount: 3,
  resultCount: 12,
  totalMacros: 150,
  searchDuration: 23,
  sortBy: 'relevance',
  sortOrder: 'desc',
});

// Export performed
createTelemetryEvent('sts_macro_export_cli_performed', {
  macroCount: 150,
  format: 'json',
  includeIndex: false,
});
```

## File Structure

```
src/ui/tools/sts/
├── hooks/
│   └── useSTSMacroSearch.ts           # Search hook (500+ lines)
├── components/
│   └── STSMacroSearch.tsx            # UI component (400+ lines)
└── types.ts                           # Type definitions

scripts/stsTelemetry/
└── macroSearchCLI.ts                  # CLI tool (300+ lines)

tests/unit/sts/
└── STSMacroSearch.test.tsx           # Test suite (200+ lines)
```

## Performance

### Index Building
- **Small Library** (< 100 macros): < 50ms
- **Medium Library** (100-500 macros): < 200ms
- **Large Library** (500+ macros): < 500ms

### Search Performance
- **Simple Query**: < 10ms
- **Complex Query**: < 50ms
- **Large Result Set**: < 100ms

### Memory Usage
- **Index Storage**: ~100KB per 1000 macros
- **Search Results**: ~10KB per 50 results
- **UI Component**: ~50KB base + results

## Configuration

### Default Configuration

```typescript
export const DEFAULT_SEARCH_CONFIG = {
  labelWeight: 0.4,
  descriptionWeight: 0.2,
  tagWeight: 0.2,
  categoryWeight: 0.1,
  cooldownWeight: 0.05,
  frequencyWeight: 0.05,
  fuzzySearch: true,
  minScoreThreshold: 0.1,
  maxResults: 50,
};
```

### Custom Configuration

```typescript
const customConfig = {
  labelWeight: 0.5,        // Emphasize label matching
  descriptionWeight: 0.3,  // Emphasize descriptions
  tagWeight: 0.15,         // Reduce tag importance
  categoryWeight: 0.05,    // Reduce category importance
  cooldownWeight: 0.0,     // Disable cooldown bonus
  frequencyWeight: 0.0,    // Disable frequency bonus
  fuzzySearch: false,       // Disable fuzzy matching
  minScoreThreshold: 0.2,  // Higher threshold
  maxResults: 25,          // Fewer results
};
```

## CLI Reference

### Commands

#### `index`
Build and display macro search index.

```bash
tsx scripts/stsTelemetry/macroSearchCLI.ts index [--stats]
```

**Options:**
- `--stats`: Show detailed index statistics

#### `search`
Search macros with filters and options.

```bash
tsx scripts/stsTelemetry/macroSearchCLI.ts search <query> [options]
```

**Arguments:**
- `query`: Search query string

**Options:**
- `--tags <tags>`: Filter by tags (comma-separated)
- `--category <category>`: Filter by category
- `--cooldown-min <seconds>`: Minimum cooldown
- `--cooldown-max <seconds>`: Maximum cooldown
- `--turn-cost-min <turns>`: Minimum turn cost
- `turn-cost-max <turns>`: Maximum turn cost
- `--custom-only`: Include only custom macros
- `--system-only`: Include only system macros
- `--sort-by <field>`: Sort field (relevance|label|cooldown|turnCost|frequency)
- `--sort-order <order>`: Sort order (asc|desc)
- `--max-results <count>`: Maximum results to return
- `--export <file>`: Export results to file
- `--export-format <format>`: Export format (json|csv)
- `--verbose`: Show detailed match information

#### `export`
Export all macros with search metadata.

```bash
tsx scripts/stsTelemetry/macroSearchCLI.ts export [options]
```

**Options:**
- `--format <format>`: Export format (json|csv)
- `--output <file>`: Output file path
- `--include-index`: Include search index data

#### `stats`
Show macro library statistics.

```bash
tsx scripts/stsTelemetry/macroSearchCLI.ts stats [--detailed]
```

**Options:**
- `--detailed`: Show detailed statistics

## API Reference

### useSTSMacroSearch Hook

```typescript
function useSTSMacroSearch(
  macros: STSMacroDefinitionExtended[],
  config?: Partial<STSMacroSearchConfig>,
  executionHistory?: Record<string, number>
): {
  // State
  searchConfig: STSMacroSearchConfig;
  index: STSMacroIndex | null;
  isIndexing: boolean;
  lastQuery: STSMacroSearchQuery | null;
  results: STSMacroSearchResult[];
  
  // Actions
  search: (query: STSMacroSearchQuery) => Promise<STSMacroSearchResult[]>;
  exportResults: (format: 'json' | 'csv') => string;
  getSearchStats: () => SearchStats | null;
  setSearchConfig: (config: Partial<STSMacroSearchConfig>) => void;
  buildIndex: () => Promise<void>;
}
```

### STSMacroSearch Component

```typescript
interface STSMacroSearchProps {
  macros: STSMacroDefinitionExtended[];
  executionHistory?: Record<string, number>;
  onMacroSelect?: (macro: STSMacroDefinitionExtended) => void;
  compact?: boolean;
}
```

## Integration Examples

### With Macro Library

```tsx
import { useSTSMacroLibrary } from './useSTSMacroLibrary';
import { STSMacroSearch } from './STSMacroSearch';

function MacroLibraryWithSearch() {
  const { macros, executionHistory } = useSTSMacroLibrary();
  
  return (
    <div className="space-y-6">
      <STSMacroSearch
        macros={macros}
        executionHistory={executionHistory}
        onMacroSelect={(macro) => {
          // Handle macro selection
          console.log('Selected macro:', macro.id);
        }}
      />
    </div>
  );
}
```

### With Telemetry Dashboard

```tsx
import { STSMacroSearch } from './STSMacroSearch';

function TelemetryDashboard() {
  const [searchStats, setSearchStats] = useState(null);
  
  return (
    <div>
      <STSMacroSearch
        macros={macros}
        onSearchComplete={(stats) => setSearchStats(stats)}
      />
      
      {searchStats && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3>Search Analytics</h3>
          <p>Total Searches: {searchStats.totalSearches}</p>
          <p>Average Score: {searchStats.averageScore}</p>
          <p>Popular Tags: {searchStats.popularTags.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
```

## Testing

### Test Coverage

The test suite covers:
- Index building and statistics
- Search functionality with various queries
- Scoring algorithm validation
- Export functionality
- Configuration updates
- Error handling
- Performance scenarios

### Running Tests

```bash
# Run search tests
npm run test -- tests/unit/sts/STSMacroSearch.test.tsx

# Run with coverage
npm run test -- tests/unit/sts/STSMacroSearch.test.tsx --coverage
```

### Test Examples

```typescript
// Test basic search
it('should search by query text', async () => {
  const { result } = renderHook(() => 
    useSTSMacroSearch(mockMacros)
  );

  await waitFor(() => {
    expect(result.current.isIndexing).toBe(false);
  });

  await act(async () => {
    await result.current.search({ query: 'attack' });
  });

  expect(result.current.results).toHaveLength(1);
  expect(result.current.results[0].macro.id).toBe('macro_1');
});

// Test scoring
it('should calculate higher score for exact matches', async () => {
  const { result } = renderHook(() => 
    useSTSMacroSearch(mockMacros)
  );

  await waitFor(() => {
    expect(result.current.isIndexing).toBe(false);
  });

  await act(async () => {
    await result.current.search({ query: 'Quick Attack' });
  });

  const searchResult = result.current.results[0];
  expect(searchResult.matches.label).toBeCloseTo(1, 1);
  expect(searchResult.score).toBeGreaterThan(0.8);
});
```

## Troubleshooting

### Common Issues

#### Index Not Building
- Check if macros array is empty
- Verify macro data structure
- Check for TypeScript errors in macro definitions

#### Poor Search Results
- Adjust search configuration weights
- Check if tags and categories are properly set
- Verify execution history data

#### Performance Issues
- Reduce maxResults for large libraries
- Disable fuzzy search for faster results
- Consider debouncing search queries

#### Export Problems
- Check file permissions for output directory
- Verify export format compatibility
- Ensure results array is not empty

### Debug Mode

```typescript
// Enable debug logging
const searchHook = useSTSMacroSearch(macros, {
  ...config,
  // Add debug options
});

// Check index statistics
const stats = searchHook.getSearchStats();
console.log('Index Stats:', stats);

// Inspect search results
console.log('Search Results:', searchHook.results);
```

## Future Enhancements

### Planned Features
- **Advanced Fuzzy Search**: Levenshtein distance algorithm
- **Semantic Search**: Natural language processing
- **Search History**: Recent searches and favorites
- **Auto-complete**: Real-time suggestions
- **Search Analytics**: Detailed usage statistics
- **Performance Monitoring**: Search performance metrics

### Extension Points
- **Custom Scoring**: User-defined scoring functions
- **Custom Filters**: Additional filter types
- **Export Formats**: Additional export formats (XML, YAML)
- **Index Storage**: Persistent index caching
- **Search Plugins**: Extensible search providers

## Best Practices

### Performance
- Use debouncing for search input (300ms delay)
- Limit maxResults for large libraries
- Cache search results when possible
- Build index incrementally for large datasets

### Configuration
- Adjust weights based on user preferences
- Set appropriate score thresholds
- Enable/disable fuzzy search based on data size
- Configure maxResults based on UI constraints

### UI/UX
- Show loading states during indexing
- Provide clear search feedback
- Use progressive enhancement for results
- Implement keyboard shortcuts for power users

### Data Quality
- Ensure consistent tag and category naming
- Validate macro metadata before indexing
- Clean up execution history periodically
- Remove duplicate or invalid macros

## Conclusion

The STS Macro Search Engine provides a comprehensive, configurable, and performant solution for searching STS macros. With its flexible scoring algorithm, extensive filtering options, and multiple export formats, it serves as a powerful tool for macro discovery and management.

The system is designed to be easily extensible and can be integrated into various UI contexts, from simple search bars to complex macro management interfaces. The comprehensive test suite and telemetry integration ensure reliability and observability in production environments.
