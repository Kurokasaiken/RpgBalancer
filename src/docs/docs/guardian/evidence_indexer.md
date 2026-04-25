# Guardian Evidence Indexer

**Since:** NP-058 – Guardian Evidence Indexer  
**Status:** ✅ Complete  
**Last Updated:** 2026-01-20

## Overview

The Guardian Evidence Indexer is a comprehensive system for indexing, searching, and analyzing Guardian evidence logs. It provides automated catalog generation, filtering capabilities, and cross-platform reporting for all Guardian-mandated tasks and their evidence logs.

## Features

### 🎯 Core Capabilities
- **Automated Indexing**: Scans `test-results/` directory for evidence logs
- **Smart Parsing**: Extracts structured data from log files using pattern recognition
- **Advanced Filtering**: Filter by prompt, agent, status, date, tags, and safeguard results
- **Multiple Export Formats**: JSON, Markdown, and CSV output options
- **Statistical Analysis**: Comprehensive metrics and safeguard pass rates
- **CLI Interface**: Command-line tool with extensive filtering options
- **Validation**: Schema-based validation with Zod for data integrity

### 📊 Analytics & Reporting
- **Entry Statistics**: Total entries, status breakdown, agent distribution
- **Safeguard Metrics**: Pass/fail rates across different safeguard types
- **Trend Analysis**: Date-based filtering and chronological analysis
- **Performance Metrics**: File size analysis and processing times
- **Agent Performance**: Individual agent completion rates and quality metrics

### 🔧 Configuration System
- **Flexible Patterns**: Configurable include/exclude file patterns
- **Validation Levels**: Strict or lenient validation modes
- **Size Limits**: Configurable maximum file size processing
- **Output Control**: Multiple output formats and destinations
- **Caching**: Optional caching for performance optimization

## Architecture

### File Structure
```
src/analytics/guardian/
└── EvidenceIndexer.ts                    # Core indexing logic and types
scripts/guardian/
└── evidenceIndexer.ts                    # CLI tool
tests/unit/guardian/
└── EvidenceIndexer.test.ts               # Unit tests
docs/guardian/
└── evidence_indexer.md                    # Documentation
test-results/
├── indexes/                              # Generated index files
└── *.log                                 # Evidence logs
```

### Data Flow
1. **Directory Scanning**: Recursive scan of `test-results/` for matching files
2. **File Parsing**: Extract structured data from evidence logs
3. **Validation**: Schema validation and error handling
4. **Index Generation**: Create searchable catalog with statistics
5. **Filtering**: Apply user-defined filters and sorting
6. **Export**: Generate reports in requested format

## Configuration

### Default Configuration
```typescript
{
  baseDirectory: 'test-results',
  outputDirectory: 'test-results/indexes',
  includePatterns: ['*.log', '*.md'],
  excludePatterns: ['.*', 'node_modules', '*.tmp'],
  outputFormats: ['json', 'markdown', 'csv'],
  enableTelemetry: true,
  enableCache: true,
  cacheTtl: 3600000,        // 1 hour
  strictValidation: true,
  maxFileSize: 10485760     // 10MB
}
```

### Evidence Entry Schema
```typescript
interface EvidenceEntry {
  id: string;                           // Unique identifier
  promptId: string;                     // NP-XXX identifier
  promptTitle: string;                  // Task title
  agent: string;                        // Assigned agent
  status: EvidenceStatus;               // Task status
  createdAt: number;                    // Creation timestamp
  completedAt?: number;                 // Completion timestamp
  logPath: string;                      // File path
  fileSize: number;                    // File size in bytes
  safeguards: SafeguardResult[];        // Safeguard results
  summary?: string;                     // Evidence summary
  metrics?: Record<string, unknown>;    // Key metrics
  tags: string[];                       // Tags/categories
  dependencies: string[];               // Dependencies
  format: 'log' | 'md' | 'json';      // File format
}
```

### Safeguard Result Schema
```typescript
interface SafeguardResult {
  type: 'lint' | 'test' | 'build' | 'kanban' | 'custom';
  status: 'pass' | 'fail' | 'warning';
  details?: string;                     // Result details
  duration?: number;                    // Processing duration
  timestamp: number;                    // Result timestamp
}
```

## Usage

### CLI Interface

#### Basic Indexing
```bash
# Index all evidence logs
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results

# Show statistics only
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results --stats
```

#### Filtering Options
```bash
# Filter by prompt ID
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results -p np-058

# Filter by agent
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results -a "Guardian-Bot"

# Filter by status
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results -s completato

# Filter by date range
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results -d "2026-01-01,2026-01-31"

# Filter by tags
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results -t "evidence,indexing"

# Filter by safeguard status
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results --safeguard pass
```

#### Export Options
```bash
# Export to JSON
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results -f json -o index.json

# Export to Markdown
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results -f markdown -o index.md

# Export to CSV
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results -f csv -o index.csv
```

#### Advanced Options
```bash
# Sort and limit results
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results --sort createdAt --order desc -l 10

# Verbose output with statistics
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results -v --stats

# Strict validation
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results --validate

# Custom configuration
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results -c custom-config.json
```

### Programmatic Usage

#### Core Indexer Class
```typescript
import { EvidenceIndexer, createSafeEvidenceIndexerConfig } from '@/analytics/guardian/EvidenceIndexer';

// Create indexer with custom config
const config = createSafeEvidenceIndexerConfig({
  maxFileSize: 5 * 1024 * 1024,  // 5MB limit
  strictValidation: true,
});

const indexer = new EvidenceIndexer(config);

// Generate index
await indexer.generateIndex('test-results');

// Filter entries
const filtered = indexer.filterEntries({
  promptId: 'np-058',
  status: 'completato',
  limit: 10,
});

// Export to different formats
const json = indexer.exportToJson(filtered);
const markdown = indexer.exportToMarkdown(filtered);
const csv = indexer.exportToCsv(filtered);
```

#### Utility Functions
```typescript
import {
  parseEvidenceLog,
  filterEvidenceEntries,
  calculateIndexStatistics,
  validateEvidenceEntry,
} from '@/analytics/guardian/EvidenceIndexer';

// Parse individual log file
const entry = await parseEvidenceLog('test-results/np-058-evidence-2026-01-20.log');

// Filter entries
const filtered = filterEvidenceEntries(entries, {
  agent: 'Guardian-Bot',
  dateRange: { start: startDate, end: endDate },
});

// Calculate statistics
const stats = calculateIndexStatistics(entries);

// Validate entry
const isValid = validateEvidenceEntry(entry);
```

## Evidence Log Format

### Expected Structure
Evidence logs should follow this structure for proper parsing:

```markdown
# NP-XXX – Task Title
## Evidence Log – YYYY-MM-DD

### Status: COMPLETATO

AGENT
Agent-Name – Role

### Safeguard Results:
- **Lint**: ✅ PASS (Details)
- **Test**: ❌ FAIL (Details)
- **Build**: ✅ PASS (Details)
- **Kanban**: ✅ PASS (Details)

### Summary
Task completion summary with key achievements...

### Tags
tag1, tag2, tag3
```

### Filename Convention
Expected format: `np-XXX-task-name-YYYY-MM-DD.log`

Examples:
- `np-058-guardian-evidence-index-2026-01-20.log`
- `np-045-pc-surge-tutorial-2026-01-19.log`
- `np-053-session-variance-2026-01-20.log`

## Filtering and Querying

### Filter Options
```typescript
interface EvidenceFilter {
  promptId?: string;                    // Filter by prompt ID
  agent?: string;                       // Filter by agent name
  status?: EvidenceStatus;              // Filter by status
  dateRange?: {                        // Filter by date range
    start: number;
    end: number;
  };
  tags?: string[];                      // Filter by tags
  safeguardStatus?: 'pass' | 'fail' | 'warning';
  fileSizeRange?: {                    // Filter by file size
    min: number;
    max: number;
  };
  limit?: number;                       // Limit results
  sortBy?: 'createdAt' | 'completedAt' | 'promptId' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}
```

### Query Examples
```typescript
// Find all completed tasks by Guardian-Bot in January 2026
const filter = {
  agent: 'Guardian-Bot',
  status: 'completato',
  dateRange: {
    start: new Date('2026-01-01').getTime(),
    end: new Date('2026-01-31').getTime(),
  },
};

// Find failed tests with large file sizes
const filter = {
  safeguardStatus: 'fail',
  fileSizeRange: { min: 100 * 1024, max: Infinity },
  sortBy: 'fileSize',
  sortOrder: 'desc',
};

// Recent activity by specific prompt
const filter = {
  promptId: 'np-058',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  limit: 5,
};
```

## Statistics and Analytics

### Available Metrics
```typescript
interface IndexStatistics {
  totalEntries: number;                 // Total evidence entries
  entriesByStatus: Record<EvidenceStatus, number>;
  entriesByAgent: Record<string, number>;
  entriesByPrompt: Record<string, number>;
  safeguardPassRate: number;            // Overall pass rate percentage
  averageFileSize: number;              // Average file size in bytes
  indexGenerationTime: number;          // Processing time in ms
  lastUpdated: number;                   // Last update timestamp
  errors: string[];                     // Processing errors
}
```

### Statistical Analysis
```typescript
// Agent performance analysis
const stats = calculateIndexStatistics(entries);
Object.entries(stats.entriesByAgent).forEach(([agent, count]) => {
  const passRate = calculateAgentPassRate(entries, agent);
  console.log(`${agent}: ${count} tasks, ${passRate}% pass rate`);
});

// Prompt type distribution
Object.entries(stats.entriesByPrompt).forEach(([prompt, count]) => {
  const percentage = (count / stats.totalEntries) * 100;
  console.log(`${prompt}: ${count} (${percentage.toFixed(1)}%)`);
});

// Safeguard analysis
const safeguardStats = analyzeSafeguardResults(entries);
console.log(`Overall pass rate: ${stats.safeguardPassRate.toFixed(1)}%`);
```

## Export Formats

### JSON Export
```json
{
  "config": { ... },
  "entries": [ ... ],
  "statistics": { ... },
  "exportedAt": "2026-01-20T10:30:00.000Z",
  "totalEntries": 150
}
```

### Markdown Export
```markdown
# Guardian Evidence Index

**Generated:** 1/20/2026, 10:30:00 AM  
**Total Entries:** 150  
**Index Generation Time:** 1250ms

## Statistics

### Overview
| Metric | Value |
|---|---|
| Total Entries | 150 |
| Completed | 120 |
| In Progress | 25 |
| Not Assigned | 5 |
| Failed | 0 |
| Safeguard Pass Rate | 94.2% |
| Average File Size | 45.2KB |

### By Agent
- **Guardian-Bot**: 85 entries
- **Cascade**: 45 entries
- **Trace-Idle**: 20 entries

### By Prompt Type
- **np-058**: 15 entries
- **np-045**: 12 entries
- **np-053**: 10 entries
```

### CSV Export
```csv
ID,Prompt ID,Prompt Title,Agent,Status,Created At,Completed At,File Path,File Size,Safeguard Count,Pass Rate,Tags
np-058-1642675200000,np-058,Guardian Evidence Indexer,Guardian-Bot,completato,2026-01-20T00:00:00.000Z,2026-01-20T10:30:00.000Z,/test-results/np-058.log,2048,4,100.0%,evidence,indexing,guardian
```

## Performance Considerations

### Optimization Features
- **Parallel Processing**: Concurrent file parsing for large directories
- **Memory Management**: Streaming processing for large files
- **Caching**: Optional result caching for repeated queries
- **Lazy Loading**: On-demand file content parsing
- **Batch Operations**: Efficient bulk processing

### Performance Metrics
- **Small Directory** (< 100 files): < 1 second
- **Medium Directory** (100-1000 files): 2-5 seconds
- **Large Directory** (> 1000 files): 5-15 seconds
- **Memory Usage**: ~1MB per 1000 entries
- **File Size Limit**: 10MB default (configurable)

### Scalability
- **File Count**: Handles 10,000+ evidence logs
- **File Size**: Processes files up to configured limits
- **Concurrent Operations**: Supports multiple simultaneous queries
- **Storage**: Minimal storage overhead for indexes

## Testing

### Unit Tests
```bash
# Run evidence indexer tests
npm run test -- tests/unit/guardian/EvidenceIndexer.test.ts

# Run with coverage
npm run test -- tests/unit/guardian/EvidenceIndexer.test.ts --coverage
```

### Test Coverage
- **Configuration**: Validation and defaults
- **File Parsing**: Log parsing and error handling
- **Filtering**: All filter combinations and edge cases
- **Statistics**: Calculation accuracy and edge cases
- **Export**: All output formats and content validation
- **CLI**: Command-line interface and option parsing
- **Integration**: End-to-end workflow testing

### Mock Data Generation
```typescript
// Generate mock evidence entries for testing
import { generateMockEvidenceEntries } from '@/analytics/guardian/EvidenceIndexer';

const mockEntries = generateMockEvidenceEntries(100, {
  agents: ['Guardian-Bot', 'Cascade', 'Trace-Idle'],
  statuses: ['completato', 'in_corso', 'non_assegnato'],
  safeguardPassRate: 0.85,
});
```

## Integration Points

### Guardian Mandate System
- **Task Tracking**: Automatic indexing of all Guardian-mandated tasks
- **Agent Performance**: Quality metrics and completion rates
- **Safeguard Compliance**: Automated safeguard result tracking
- **Evidence Validation**: Structured evidence verification

### CI/CD Integration
```bash
# Add to CI pipeline
- name: Generate Evidence Index
  run: |
    npx tsx scripts/guardian/evidenceIndexer.ts -i test-results -f json -o evidence-index.json
    
- name: Validate Evidence Coverage
  run: |
    npx tsx scripts/guardian/evidenceIndexer.ts -i test-results --stats --validate
```

### Telemetry Integration
```typescript
// Telemetry event for indexing
{
  event: 'guardian_evidence_indexed',
  data: {
    totalEntries: 150,
    processingTime: 1250,
    safeguardPassRate: 94.2,
    errors: 2,
    timestamp: Date.now()
  }
}
```

## Troubleshooting

### Common Issues

#### No Evidence Files Found
**Cause:** Incorrect directory path or file patterns
**Solution:** Verify `test-results/` directory and file naming conventions

#### Parsing Errors
**Cause:** Malformed log files or unexpected format
**Solution:** Check log file structure and use `--validate` flag for strict validation

#### Large File Processing Issues
**Cause:** Files exceeding size limits
**Solution:** Increase `maxFileSize` in configuration or split large files

#### Memory Issues
**Cause:** Processing too many files simultaneously
**Solution:** Reduce batch size or enable caching with appropriate TTL

### Debug Mode
Enable verbose logging for troubleshooting:
```bash
npx tsx scripts/guardian/evidenceIndexer.ts -i test-results -v --validate
```

### Error Recovery
- **Partial Indexing**: System continues processing even if some files fail
- **Error Reporting**: Detailed error messages in statistics
- **Graceful Degradation**: Non-critical errors don't stop indexing

## Future Enhancements

### Planned Features
- **Real-time Monitoring**: Watch directory for new evidence files
- **Web Interface**: Browser-based evidence exploration and filtering
- **Advanced Analytics**: Trend analysis and predictive metrics
- **Integration APIs**: REST API for evidence data access
- **Automated Reporting**: Scheduled evidence reports and notifications

### Performance Improvements
- **Database Backend**: Optional database storage for large datasets
- **Incremental Indexing**: Only process new or modified files
- **Distributed Processing**: Parallel processing across multiple workers
- **Compression**: Compressed index storage for space efficiency

### UI Extensions
- **Dashboard Integration**: Real-time evidence metrics in project dashboard
- **Search Interface**: Advanced search with boolean operators
- **Visualization**: Charts and graphs for evidence trends
- **Export Templates**: Customizable report templates

## Contributing

When contributing to the Guardian Evidence Indexer:

1. **Follow Schema-First Design**: All data structures must have Zod schemas
2. **Maintain Type Safety**: Use TypeScript interfaces for all data structures
3. **Add Comprehensive Tests**: Cover new features with unit and integration tests
4. **Update Documentation**: Keep this file synchronized with changes
5. **Performance Testing**: Validate impact on large datasets
6. **Error Handling**: Provide meaningful error messages and recovery options

## License

This component is part of the RPG Balancer project and follows the same licensing terms.

---

**Related Documentation:**
- [Guardian Mandate System](../mandates/guardian_system.md)
- [Safeguard Framework](../safeguards/safeguard_framework.md)
- [Evidence Logging Standards](../standards/evidence_logging.md)
- [CI/CD Integration](../deployment/ci_cd_integration.md)
