# Balancer Undo/Redo Persistence Monitor

## Overview

The Undo/Redo Persistence Monitor provides comprehensive integrity monitoring for the Balancer's undo/redo system. It tracks operations, detects data corruption, monitors performance, and generates detailed reports for maintaining data integrity.

## Features

### 🔍 Integrity Checking
- **Checksum Validation**: Verifies data integrity using configurable checksum algorithms
- **Structure Validation**: Ensures undo/redo snapshots maintain proper structure
- **Timestamp Validation**: Detects invalid or corrupted timestamps
- **History Depth Monitoring**: Tracks and alerts on excessive history accumulation
- **Data Size Monitoring**: Warns when storage size exceeds thresholds

### 📊 Metrics Collection
- **Operation Counts**: Tracks undo/redo operations and success rates
- **Performance Metrics**: Monitors operation durations and identifies slow operations
- **History Metrics**: Tracks current and maximum history depth
- **Data Size Metrics**: Monitors total storage footprint
- **Integrity Issues**: Counts and categorizes detected problems

### 🚨 Alert System
- **Severity Levels**: Low, Medium, High, Critical issue classification
- **Issue Types**: Checksum mismatches, data corruption, structure errors, storage failures
- **Recommendations**: Automated suggestions for resolving detected issues
- **Real-time Monitoring**: Configurable periodic integrity checks

### 📝 Reporting
- **JSON Reports**: Machine-readable detailed reports
- **Markdown Reports**: Human-readable formatted reports
- **CLI Interface**: Command-line tools for automation
- **Export Capabilities**: State export for debugging and analysis

## Architecture

### Core Components

#### UndoRedoPersistenceMonitor
Main monitoring class that orchestrates integrity checking, metrics collection, and state management.

```typescript
import { UndoRedoPersistenceMonitor } from '@/balancing/monitoring/UndoRedoPersistenceMonitor';

const monitor = new UndoRedoPersistenceMonitor({
  maxHistoryDepth: 10,
  checksumAlgorithm: 'simple',
  enableAutoRecovery: false,
});

monitor.startMonitoring();
```

#### Schema Definitions
Comprehensive Zod schemas for type safety and validation:

- `UndoRedoMonitorConfig`: Configuration options
- `UndoRedoIntegrityResult`: Integrity check results
- `IntegrityIssue`: Individual issue definitions
- `UndoRedoMetrics`: Performance and usage metrics

### Integration Points

#### BalancerConfigStore Integration
The monitor integrates seamlessly with the existing `BalancerConfigStore`:

```typescript
// Monitor wraps existing undo/redo operations
monitor.startOperation();
await BalancerConfigStore.undo();
monitor.recordOperation('undo', true);
```

#### Storage Testing Framework
Leverages the existing storage testing infrastructure for validation:

```typescript
import { StorageTestFramework } from '@/shared/testing/StorageTestFramework';

// Test undo/redo persistence
const tester = new StorageTestFramework('undo-redo', adapter);
const results = await tester.runFullTest(testData);
```

## Configuration

### Default Configuration

```typescript
const defaultConfig = {
  maxHistoryDepth: 10,              // Maximum undo history entries
  checksumAlgorithm: 'simple',     // Checksum algorithm (simple|sha256|md5)
  integrityCheckInterval: 0,        // Periodic check interval (ms, 0 = disabled)
  enableAutoRecovery: false,        // Automatic corruption recovery
  maxDataSizeWarning: 1048576,     // Data size warning threshold (1MB)
  enablePerformanceMonitoring: true, // Track operation performance
  slowOperationThreshold: 1000,    // Slow operation threshold (ms)
};
```

### Custom Configuration

```typescript
const monitor = new UndoRedoPersistenceMonitor({
  maxHistoryDepth: 20,
  checksumAlgorithm: 'sha256',
  integrityCheckInterval: 60000, // Check every minute
  enableAutoRecovery: true,
  maxDataSizeWarning: 5 * 1024 * 1024, // 5MB warning
});
```

## Usage

### Basic Monitoring

```typescript
import { UndoRedoPersistenceMonitor } from '@/balancing/monitoring/UndoRedoPersistenceMonitor';

// Create and start monitor
const monitor = new UndoRedoPersistenceMonitor();
monitor.startMonitoring();

// Record operations (typically done in BalancerConfigStore)
monitor.startOperation();
await performUndoOperation();
monitor.recordOperation('undo', true, 'Undo stat change');

// Check integrity
const result = await monitor.performIntegrityCheck();
if (!result.passed) {
  console.warn('Integrity issues detected:', result.issues);
}

// Get metrics
const metrics = monitor.getMetrics();
console.log(`Undo operations: ${metrics.undoCount}`);
console.log(`Average undo time: ${metrics.avgUndoTime}ms`);
```

### CLI Usage

#### Integrity Check

```bash
# Basic integrity check
npx tsx scripts/balancer/undoRedoIntegrityCheck.ts check

# Custom configuration
npx tsx scripts/balancer/undoRedoIntegrityCheck.ts check \
  --max-depth 20 \
  --checksum sha256 \
  --format both \
  --output test-results/balancer-integrity

# Quiet mode for automation
npx tsx scripts/balancer/undoRedoIntegrityCheck.ts check --quiet
```

#### Continuous Monitoring

```bash
# Start monitoring with 30-second intervals
npx tsx scripts/balancer/undoRedoIntegrityCheck.ts monitor \
  --interval 30 \
  --output test-results/monitor

# Export current state
npx tsx scripts/balancer/undoRedoIntegrityCheck.ts export \
  --output test-results/current-state.json
```

### React Integration

```typescript
// Hook for React components
import { useEffect, useState } from 'react';
import { UndoRedoPersistenceMonitor } from '@/balancing/monitoring/UndoRedoPersistenceMonitor';

export function useUndoRedoMonitor() {
  const [monitor] = useState(() => new UndoRedoPersistenceMonitor());
  const [metrics, setMetrics] = useState(monitor.getMetrics());
  const [issues, setIssues] = useState(0);

  useEffect(() => {
    monitor.startMonitoring();

    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
      setIssues(monitor.getLastIntegrityCheck()?.issues.length || 0);
    }, 1000);

    return () => {
      monitor.stopMonitoring();
      clearInterval(interval);
    };
  }, [monitor]);

  return { metrics, issues, monitor };
}
```

## Integrity Issues

### Issue Types

#### checksum_mismatch
**Severity**: Critical  
**Description**: Stored checksum doesn't match calculated checksum  
**Causes**: Data corruption, storage errors, concurrent modifications  
**Resolution**: Restore from backup or repair corrupted data

#### data_corruption
**Severity**: Critical  
**Description**: Missing or invalid configuration data  
**Causes**: Storage failures, incomplete operations  
**Resolution**: Reset to defaults or restore from backup

#### structure_invalid
**Severity**: High  
**Description**: Invalid snapshot structure  
**Causes**: Serialization errors, version incompatibilities  
**Resolution**: Data migration or structure repair

#### history_depth_exceeded
**Severity**: Medium  
**Description**: History exceeds configured maximum depth  
**Causes**: Excessive operations without cleanup  
**Resolution**: Increase max depth or implement cleanup

#### timestamp_invalid
**Severity**: Medium  
**Description**: Invalid timestamps in history  
**Causes**: Clock issues, data corruption  
**Resolution**: Timestamp correction or snapshot removal

#### storage_failure
**Severity**: Low to High  
**Description**: Storage operation failures  
**Causes**: Disk space, permissions, quota exceeded  
**Resolution**: Storage maintenance or quota increase

## Performance Monitoring

### Metrics Tracked

- **Operation Counts**: Total undo/redo operations
- **Average Times**: Mean duration for each operation type
- **History Depth**: Current and maximum history entries
- **Data Size**: Total storage footprint
- **Issue Count**: Number of integrity problems

### Slow Operation Detection

```typescript
// Configure slow operation threshold
monitor.updateConfig({
  slowOperationThreshold: 500, // 500ms threshold
  enablePerformanceMonitoring: true,
});

// Slow operations are automatically logged
console.warn('[UndoRedoMonitor] Slow undo operation: 750ms');
```

### Performance Recommendations

1. **Optimize History Depth**: Keep history depth reasonable (5-20 entries)
2. **Monitor Data Size**: Watch for growing configuration size
3. **Checksum Algorithm**: Use 'simple' for speed, 'sha256' for security
4. **Periodic Cleanup**: Implement history cleanup policies

## CLI Reference

### Commands

#### `check`
Perform one-time integrity check.

```bash
npx tsx scripts/balancer/undoRedoIntegrityCheck.ts check [options]
```

**Options:**
- `-o, --output <path>`: Output file path (default: test-results/undo-redo-integrity.json)
- `-f, --format <format>`: Output format - json|markdown|both (default: both)
- `-q, --quiet`: Suppress console output
- `--max-depth <number>`: Maximum history depth (default: 10)
- `--checksum <algorithm>`: Checksum algorithm - simple|sha256|md5 (default: simple)

#### `monitor`
Start continuous monitoring.

```bash
npx tsx scripts/balancer/undoRedoIntegrityCheck.ts monitor [options]
```

**Options:**
- `-i, --interval <seconds>`: Check interval in seconds (default: 60)
- `-o, --output <path>`: Output directory (default: test-results/undo-redo-monitor)
- `--max-depth <number>`: Maximum history depth (default: 10)

#### `export`
Export current monitor state.

```bash
npx tsx scripts/balancer/undoRedoIntegrityCheck.ts export [options]
```

**Options:**
- `-o, --output <path>`: Output file path (default: test-results/undo-redo-state.json)

### Exit Codes

- `0`: Success (integrity check passed)
- `1`: Failure (integrity check failed or error occurred)

## Testing

### Unit Tests

```bash
# Run monitor tests
npm run test -- tests/unit/balancing/UndoRedoPersistenceMonitor.test.ts

# Run with coverage
npm run test -- tests/unit/balancing/UndoRedoPersistenceMonitor.test.ts --coverage
```

### Integration Tests

```bash
# Test CLI functionality
npx tsx scripts/balancer/undoRedoIntegrityCheck.ts check --quiet

# Test with Storage Testing Framework
npm run test -- tests/unit/shared/StorageIntegration.test.ts
```

### Test Coverage

The test suite covers:
- ✅ Initialization and configuration
- ✅ Monitoring lifecycle management
- ✅ Operation recording and metrics
- ✅ Integrity checking algorithms
- ✅ Error handling and recovery
- ✅ Performance monitoring
- ✅ CLI functionality
- ✅ State management and export

## Troubleshooting

### Common Issues

#### Monitor Not Starting
**Problem**: Monitor fails to start or immediately stops  
**Solution**: Check BalancerConfigStore availability and permissions

#### Integrity Check Failures
**Problem**: Consistent integrity check failures  
**Solution**: Verify storage permissions and check for data corruption

#### Performance Issues
**Problem**: Slow operation warnings  
**Solution**: Increase thresholds or optimize configuration size

#### CLI Errors
**Problem**: Command-line tool fails  
**Solution**: Check Node.js version and file permissions

### Debug Information

```typescript
// Export full state for debugging
const state = monitor.exportState();
console.log('Monitor state:', state);

// Get detailed operation history
const history = monitor.getOperationHistory(10);
console.log('Recent operations:', history);

// Get last integrity check details
const lastCheck = monitor.getLastIntegrityCheck();
console.log('Last check:', lastCheck);
```

### Recovery Procedures

1. **Data Corruption**: Restore from backup or reset to defaults
2. **Storage Issues**: Check permissions and available space
3. **Performance**: Increase thresholds or clean up history
4. **Configuration**: Reset to default configuration

## Best Practices

### Configuration
- Set appropriate `maxHistoryDepth` for your use case
- Choose checksum algorithm based on security vs performance needs
- Enable performance monitoring in development
- Set reasonable data size warnings

### Monitoring
- Start monitoring early in application lifecycle
- Use periodic checks in production environments
- Monitor operation history for unusual patterns
- Set up alerts for critical issues

### Maintenance
- Regularly review integrity check results
- Clean up operation history periodically
- Monitor storage usage and growth
- Update configuration as needs change

### Integration
- Wrap undo/redo operations with monitoring
- Use CLI tools for automated testing
- Integrate with CI/CD pipelines
- Export state for debugging and analysis

## Future Enhancements

### Planned Features
- [ ] Automatic backup creation before risky operations
- [ ] Advanced checksum algorithms (BLAKE3, xxHash)
- [ ] Real-time dashboard for monitoring
- [ ] Integration with external monitoring systems
- [ ] Machine learning for anomaly detection
- [ ] Cross-browser storage synchronization

### API Extensions
- [ ] Webhook notifications for critical issues
- [ ] REST API for remote monitoring
- [ ] GraphQL interface for complex queries
- [ ] WebSocket for real-time updates

## Security Considerations

### Data Protection
- Sensitive configuration data should be encrypted
- Checksum algorithms should be chosen based on security requirements
- Export files should be protected with appropriate permissions

### Access Control
- Monitor should respect existing security boundaries
- CLI tools should validate user permissions
- Export functionality should be rate-limited

### Audit Trail
- All monitor operations should be logged
- Integrity check results should be archived
- Configuration changes should be tracked

## Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Run tests
npm run test

# Run linting
npm run lint -- src/balancing/monitoring

# Build
npm run build:check
```

### Code Style
- Follow existing TypeScript patterns
- Use JSDoc comments for all public APIs
- Include comprehensive unit tests
- Update documentation for API changes

### Testing Requirements
- All new features must have unit tests
- CLI commands must have integration tests
- Performance changes must include benchmarks
- Security changes must include security tests

## License

This monitoring system is part of the RPG Balancer project and follows the same licensing terms.

## Support

For issues, questions, or contributions:
- Create an issue in the project repository
- Check existing documentation and FAQs
- Review test cases for usage examples
- Contact the development team for complex issues
