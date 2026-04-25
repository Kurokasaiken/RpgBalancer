# STS Telemetry Data Lake Connector

## Overview

The STS Telemetry Data Lake Connector provides a robust pipeline for exporting STS (Slay the Spire) simulator telemetry data to a local data lake. It supports multiple output formats, batching, retry logic, and checkpoint-based recovery for reliable data processing.

## Features

- **Config-First Design**: All settings configurable via schema-validated configuration
- **Multiple Formats**: Support for NDJSON, JSON, and Parquet (fallback to JSON)
- **Batch Processing**: Configurable batch sizes with automatic flushing
- **Retry Logic**: Configurable retry attempts with exponential backoff
- **Checkpoint Recovery**: Persistent checkpointing for crash recovery
- **Partitioning**: Flexible partitioning by date, event type, or session ID
- **Validation**: Schema validation and size limits for data integrity
- **CLI Interface**: Command-line tool for data synchronization and management
- **Storage Testing**: Integration with Storage Testing Framework

## Architecture

### Core Components

1. **STSDataLakeConnector**: Main connector class handling data processing
2. **CLI Sync Tool**: Command-line interface for data synchronization
3. **Configuration System**: Zod-based schema validation
4. **Persistence Integration**: Uses PersistenceService for checkpointing

### Data Flow

```
STS Telemetry Events → Validation → Batching → Processing → Output Files
                                    ↓
                              Checkpointing → Recovery
```

## Configuration

### Default Configuration

```typescript
const DEFAULT_DATA_LAKE_CONFIG = {
  enabled: true,
  batchSize: 100,
  maxRetries: 3,
  retryDelayMs: 1000,
  checkpointIntervalMs: 30000,
  outputPath: 'data/exports/sts/data-lake',
  formats: ['ndjson'],
  compression: 'none',
  partitionBy: 'date',
  validation: {
    strict: true,
    maxRecordSize: 102400, // 100KB
  },
};
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | true | Enable/disable the connector |
| `batchSize` | number | 100 | Records per batch (1-1000) |
| `maxRetries` | number | 3 | Maximum retry attempts (0-10) |
| `retryDelayMs` | number | 1000 | Base retry delay in ms (100-10000) |
| `outputPath` | string | 'data/exports/sts/data-lake' | Output directory |
| `formats` | array | ['ndjson'] | Output formats |
| `compression` | string | 'none' | Compression type |
| `partitionBy` | string | 'date' | Partition scheme |
| `validation.strict` | boolean | true | Strict schema validation |
| `validation.maxRecordSize` | number | 102400 | Maximum record size in bytes |

## Usage

### Programmatic Usage

```typescript
import { STSDataLakeConnector } from '@/analytics/stsDataLakeConnector';

// Initialize connector
const connector = new STSDataLakeConnector({
  batchSize: 50,
  formats: ['ndjson', 'json'],
  partitionBy: 'date',
});

await connector.initialize();

// Process single event
await connector.processEvent(stsTelemetryEvent);

// Process multiple events
const results = await connector.processEvents(events);

// Flush remaining events
await connector.flush();

// Get statistics
const stats = await connector.getStatistics();
```

### CLI Usage

#### Basic Sync

```bash
# Sync with mock data
npm run sts-data-lake-sync sync

# Sync from file
npm run sts-data-lake-sync sync --input telemetry.json

# Custom configuration
npm run sts-data-lake-sync sync \
  --input telemetry.ndjson \
  --batch-size 50 \
  --format ndjson,json \
  --partition-by eventType
```

#### Advanced Options

```bash
# Dry run (show what would be processed)
npm run sts-data-lake-sync sync --input telemetry.json --dry-run

# Verbose output
npm run sts-data-lake-sync sync --input telemetry.json --verbose

# Reset connector state
npm run sts-data-lake-sync sync --reset

# Show statistics
npm run sts-data-lake-sync sync --stats
```

#### Generate Mock Data

```bash
# Generate 1000 mock events
npm run sts-data-lake-sync generate-mock --count 1000 --output mock-data.json
```

## Output Formats

### NDJSON Format

```ndjson
{"id":"uuid","timestamp":1640995200000,"sessionId":"session-123","eventType":"sts_mana_surge_detected","data":{...},"processedAt":1640995201000,"batchId":"batch_1640995200000_1","partitionPath":"2023/1/15"}
{"id":"uuid","timestamp":1640995201000,"sessionId":"session-123","eventType":"sts_mana_generated","data":{...},"processedAt":1640995202000,"batchId":"batch_1640995200000_1","partitionPath":"2023/1/15"}
```

### JSON Format

```json
[
  {
    "id": "uuid",
    "timestamp": 1640995200000,
    "sessionId": "session-123",
    "eventType": "sts_mana_surge_detected",
    "data": { ... },
    "processedAt": 1640995201000,
    "batchId": "batch_1640995200000_1",
    "partitionPath": "2023/1/15"
  }
]
```

## Partitioning Schemes

### Date Partitioning

```
data/exports/sts/data-lake/2023/1/15/batch_1640995200000_1.ndjson
data/exports/sts/data-lake/2023/1/16/batch_1640995200000_2.ndjson
```

### Event Type Partitioning

```
data/exports/sts/data-lake/sts_mana_surge_detected/batch_1640995200000_1.ndjson
data/exports/sts/data-lake/sts_mana_generated/batch_1640995200000_2.ndjson
```

### Session ID Partitioning

```
data/exports/sts/data-lake/session-123/batch_1640995200000_1.ndjson
data/exports/sts/data-lake/session-456/batch_1640995200000_2.ndjson
```

## Error Handling and Recovery

### Retry Logic

The connector implements exponential backoff for failed operations:

- **Attempt 1**: Immediate retry
- **Attempt 2**: Wait 2 × retryDelayMs
- **Attempt 3**: Wait 3 × retryDelayMs
- **And so on...**

### Checkpoint Recovery

Checkpoints are saved after each successful batch:

```typescript
interface DataLakeCheckpoint {
  lastProcessedTimestamp: number;
  lastBatchId: string;
  totalRecordsProcessed: number;
  failedRecords: number;
  lastCheckpointTime: number;
}
```

### Failure Scenarios

1. **Network/Storage Failure**: Automatic retry with exponential backoff
2. **Validation Failure**: Record skipped, logged, and counted as failed
3. **Corrupted Data**: Schema validation prevents processing
4. **Size Limits**: Records exceeding max size are rejected

## Performance Considerations

### Batch Size Optimization

- **Small batches** (< 10): Higher overhead, better memory usage
- **Medium batches** (50-200): Balanced performance
- **Large batches** (> 500): Better throughput, higher memory usage

### Format Performance

- **NDJSON**: Fastest for streaming, lowest memory usage
- **JSON**: Slightly slower, better for random access
- **Parquet**: Best for analytics (when implemented)

### Memory Management

- Records are held in memory until batch size is reached
- Use `flush()` to force processing of partial batches
- Monitor `currentBatchSize` in statistics

## Storage Testing

The connector integrates with the Storage Testing Framework for reliability testing:

```typescript
import { testSTSDataLakeConnector } from '@/shared/testing/StorageTestExamples';

// Run comprehensive storage tests
const results = await testSTSDataLakeConnector(testData);
console.log('Storage test results:', results);
```

## Monitoring and Telemetry

### Statistics API

```typescript
const stats = await connector.getStatistics();
// Returns:
// - totalRecordsProcessed
// - failedRecords  
// - currentBatchSize
// - isProcessing
// - lastProcessedTimestamp
// - lastCheckpointTime
```

### Performance Metrics

- **Processing Rate**: Records per second
- **Success Rate**: Percentage of successful records
- **Batch Processing Time**: Time per batch
- **Retry Count**: Number of retry attempts

## Integration Examples

### With STS Telemetry Dashboard

```typescript
import { STSDataLakeConnector } from '@/analytics/stsDataLakeConnector';
import { useSTSTelemetryData } from '@/ui/tools/sts/telemetry/hooks/useSTSTelemetryData';

export function STSTelemetryExporter() {
  const { exportData } = useSTSTelemetryData();
  const [connector] = useState(() => new STSDataLakeConnector());

  const handleExport = async () => {
    const data = await exportData();
    await connector.processEvents(data);
  };

  return <button onClick={handleExport}>Export to Data Lake</button>;
}
```

### With CLI Pipeline

```bash
# Export from STS simulator
npm run sts-export --format json > latest-telemetry.json

# Sync to data lake
npm run sts-data-lake-sync sync --input latest-telemetry.json --verbose

# Generate report
npm run sts-data-lake-sync sync --stats
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure correct relative paths in CLI script
2. **Permission Errors**: Check write permissions for output directory
3. **Memory Issues**: Reduce batch size for large datasets
4. **Validation Failures**: Check event schema compliance

### Debug Mode

Enable verbose logging for detailed troubleshooting:

```bash
npm run sts-data-lake-sync sync --input telemetry.json --verbose
```

### Recovery Procedures

1. **Reset State**: `--reset` flag clears all checkpoints
2. **Partial Recovery**: Connector automatically resumes from last checkpoint
3. **Manual Recovery**: Delete checkpoint files to restart from beginning

## Future Enhancements

### Planned Features

- **Parquet Support**: Native Apache Parquet format
- **Compression**: Gzip and Snappy compression
- **Streaming**: Real-time event streaming
- **Metrics Dashboard**: Web-based monitoring interface
- **Data Validation**: Advanced data quality checks

### Extensibility

The connector is designed for extensibility:

- Custom output formats via plugin system
- Custom partitioning schemes
- Custom validation rules
- Custom retry strategies

## API Reference

### STSDataLakeConnector

#### Constructor

```typescript
constructor(config?: Partial<DataLakeConfig>)
```

#### Methods

- `initialize(): Promise<void>` - Initialize connector
- `processEvent(event: STSTelemetryEvent): Promise<void>` - Process single event
- `processEvents(events: STSTelemetryEvent[]): Promise<BatchResult[]>` - Process multiple events
- `flush(): Promise<BatchResult | null>` - Force flush current batch
- `getStatistics(): Promise<DataLakeCheckpoint & {...}>` - Get statistics
- `reset(): Promise<void>` - Reset connector state

#### Types

```typescript
interface DataLakeConfig {
  enabled: boolean;
  batchSize: number;
  maxRetries: number;
  // ... other config options
}

interface BatchResult {
  batchId: string;
  recordCount: number;
  success: boolean;
  outputPath?: string;
  error?: string;
  processingTimeMs: number;
  retryCount: number;
}
```

## License and Credits

This connector is part of the RPG Balancer project and follows the same licensing terms.

---

**Last Updated**: 2026-01-19  
**Version**: 1.0.0  
**Compatibility**: Node.js 20.19.6+
