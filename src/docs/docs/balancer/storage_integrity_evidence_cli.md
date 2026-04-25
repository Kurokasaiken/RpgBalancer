# Balancer Storage Integrity Evidence CLI

## Overview

The Balancer Storage Integrity Evidence CLI (NP-098) is a comprehensive tool for collecting, validating, and packaging storage testing evidence from the Balancer storage systems. It executes the Storage Testing Framework across multiple storage targets, generates signed evidence bundles, and produces reports according to KS-005 standards.

## Features

- **Multi-Target Testing**: Tests multiple storage systems in parallel or sequentially
- **Configurable Thresholds**: Customizable success criteria and performance limits
- **Multiple Export Formats**: JSON, Markdown, and CSV reports
- **Signed Bundles**: SHA-256 checksums for evidence integrity
- **Telemetry Integration**: Emits `balancer_storage_evidence_generated` events
- **Preset Configurations**: Quick, comprehensive, and performance testing profiles
- **Evidence Logging**: KS-005 compliant evidence logs

## Installation

The CLI is included in the RPG Balancer project. No additional installation required.

## Usage

### Basic Usage

```bash
# Run with default configuration
node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts

# Use a preset configuration
node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts --preset quick

# Verbose output
node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts --preset comprehensive --verbose
```

### Advanced Usage

```bash
# Custom output directory and formats
node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts \
  --output ./custom-evidence \
  --format json,markdown,csv

# Test specific targets only
node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts \
  --targets balancer-config,spell-storage

# Custom retry and timeout settings
node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts \
  --retries 5 \
  --timeout 120000

# Dry run to see what would be executed
node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts --dry-run --verbose
```

## Command Line Options

| Option | Type | Description |
|--------|------|-------------|
| `--preset` | string | Configuration preset (quick, comprehensive, performance) |
| `--output` | string | Output directory for evidence files |
| `--targets` | string | Comma-separated list of target IDs to test |
| `--format` | string | Output formats (json,markdown,csv) |
| `--retries` | number | Number of retry attempts for failed tests |
| `--timeout` | number | Total timeout in milliseconds |
| `--verbose` | boolean | Enable verbose logging |
| `--dry-run` | boolean | Show what would be done without executing |
| `--help` | boolean | Show help information |

## Configuration

### Default Configuration

The CLI comes with a comprehensive default configuration that tests three main storage systems:

1. **Balancer Configuration Store** (`balancer-config`)
2. **Spell Storage System** (`spell-storage`)
3. **Preset Storage System** (`preset-storage`)

### Presets

#### Quick Preset
- **Purpose**: Fast validation for CI/CD pipelines
- **Targets**: 1 (balancer-config only)
- **Retries**: 1
- **Success Rate**: 90%
- **Timeout**: 30 seconds

#### Comprehensive Preset
- **Purpose**: Full validation suite for release testing
- **Targets**: All 3 storage systems
- **Retries**: 5
- **Success Rate**: 98%
- **Timeout**: 120 seconds

#### Performance Preset
- **Purpose**: Performance and regression testing
- **Targets**: All 3 storage systems
- **Max Execution Time**: 2 seconds per test
- **Memory Limit**: 50MB
- **Performance Regression**: 5% threshold

### Custom Configuration

You can create custom configurations by modifying the `storageEvidenceConfig.ts` file:

```typescript
export const CUSTOM_CONFIG: StorageEvidenceConfig = {
  name: 'Custom Storage Evidence',
  description: 'Custom testing configuration',
  targets: [
    {
      id: 'custom-target',
      name: 'Custom Storage Target',
      adapter: myCustomAdapter,
      testData: { key: 'value' },
      priority: 1,
      enabled: true,
    },
  ],
  execution: {
    maxRetries: 3,
    retryDelay: 1000,
    parallelExecution: true,
    maxConcurrentOps: 5,
    totalTimeout: 60000,
    continueOnFailure: false,
    verbose: false,
  },
  thresholds: {
    maxExecutionTime: 5000,
    minSuccessRate: 0.95,
    maxFailures: 3,
    maxMemoryUsage: 100,
    performanceRegressionThreshold: 10,
    dataIntegrityThreshold: 1.0,
  },
  output: {
    outputDir: 'test-results',
    createTimestampedFilenames: true,
    formats: ['json', 'markdown', 'csv'],
    includeDetailedResults: true,
    includePerformanceMetrics: true,
    includeRawLogs: false,
  },
};
```

## Storage Targets

### Adding New Targets

To add a new storage target, extend the configuration:

```typescript
{
  id: 'my-storage-system',
  name: 'My Storage System',
  adapter: {
    async get(key: string) { /* implementation */ },
    async set(key: string, value: any) { /* implementation */ },
    async clear(key: string) { /* implementation */ },
  },
  testData: { testKey: 'testValue' },
  alternateData: { testKey: 'alternateValue' },
  priority: 1,
  enabled: true,
}
```

### Storage Adapter Interface

Storage adapters must implement the following interface:

```typescript
interface StorageAdapter {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<boolean>;
  clear(key: string): Promise<boolean>;
}
```

## Output Formats

### JSON Export

Complete evidence bundle with all test results, metrics, and metadata:

```json
{
  "id": "storage-evidence-1642694400000",
  "name": "Balancer Storage Integrity Evidence",
  "timestamp": "2026-01-21T10:00:00.000Z",
  "duration": 1250,
  "config": { ... },
  "results": [ ... ],
  "summary": {
    "totalTargets": 3,
    "successfulTargets": 2,
    "failedTargets": 1,
    "overallSuccessRate": 0.667,
    "totalDuration": 1250,
    "checksum": "sha256:abc123..."
  },
  "telemetry": { ... }
}
```

### Markdown Export

Human-readable report with summary tables and detailed results:

```markdown
# Balancer Storage Integrity Evidence

**Description**: Comprehensive storage testing evidence for Balancer systems
**Timestamp**: 2026-01-21T10:00:00.000Z
**Duration**: 1250ms
**Evidence ID**: storage-evidence-1642694400000
**Checksum**: `sha256:abc123...`

## Summary

- **Total Targets**: 3
- **Successful**: 2
- **Failed**: 1
- **Success Rate**: 66.7%
- **Total Duration**: 1250ms

## Results

| Target | Status | Tests | Pass Rate | Duration | Memory |
|--------|--------|-------|-----------|----------|--------|
| Balancer Config | ✅ | 10 | 100.0% | 425.1ms | 2KB |
| Spell Storage | ✅ | 10 | 100.0% | 512.3ms | 3KB |
| Preset Storage | ❌ | 10 | 80.0% | 312.6ms | 2KB |
```

### CSV Export

Tabular data for spreadsheet analysis:

```csv
Target ID,Target Name,Status,Total Tests,Passed Tests,Failed Tests,Success Rate,Duration (ms),Memory Usage (KB)
balancer-config,Balancer Config,PASS,10,10,0,100.00,425.1,2
spell-storage,Spell Storage,PASS,10,10,0,100.00,512.3,3
preset-storage,Preset Storage,FAIL,10,8,2,80.00,312.6,2
```

## Telemetry

The CLI emits telemetry events for monitoring and analytics:

### Event: `balancer_storage_evidence_generated`

```json
{
  "eventId": "evt-1642694400000-abc123",
  "timestamp": "2026-01-21T10:00:00.000Z",
  "metadata": {
    "bundleId": "storage-evidence-1642694400000",
    "targets": 3,
    "successRate": 66.7,
    "duration": 1250,
    "version": "1.0.0",
    "nodeVersion": "v20.19.6",
    "platform": "darwin"
  }
}
```

## Evidence Logging

KS-005 compliant evidence logs are automatically generated:

```
# NP-098 – Balancer Storage Integrity Evidence CLI

## Evidence Log – 2026-01-21T10:00:00.000Z

### Status: COMPLETATO

### Bundle Information
- **Bundle ID**: storage-evidence-1642694400000
- **Name**: Balancer Storage Integrity Evidence
- **Checksum**: sha256:abc123...
- **Timestamp**: 2026-01-21T10:00:00.000Z
- **Duration**: 1250ms

### Results Summary
- **Total Targets**: 3
- **Successful**: 2
- **Failed**: 1
- **Success Rate**: 66.7%

### Exit Code: 0

### Files Generated
- storage-evidence-1642694400000.json
- storage-evidence-1642694400000.md
- storage-evidence-1642694400000.csv

### Telemetry Event
- **Event**: balancer_storage_evidence_generated
- **Event ID**: evt-1642694400000-abc123
- **Timestamp**: 2026-01-21T10:00:00.000Z
```

## Exit Codes

| Exit Code | Meaning |
|-----------|---------|
| 0 | Success - All tests passed thresholds |
| 1 | Failure - Some tests failed or below thresholds |
| 2 | Error - CLI execution error |

## Integration

### CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Run Storage Integrity Tests
  run: |
    node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts \
      --preset quick \
      --format json,markdown \
      --output ./storage-evidence
```

### npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:storage:evidence": "node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts --preset comprehensive",
    "test:storage:quick": "node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts --preset quick",
    "test:storage:performance": "node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts --preset performance"
  }
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure the output directory is writable
2. **Storage Adapter Errors**: Check adapter implementation and permissions
3. **Timeout Issues**: Increase timeout values or reduce target complexity
4. **Memory Issues**: Lower `maxConcurrentOps` or use sequential execution

### Debug Mode

Use verbose logging for detailed troubleshooting:

```bash
node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts --verbose --dry-run
```

### Performance Tips

1. Use `quick` preset for fast validation
2. Enable parallel execution for multiple targets
3. Adjust `maxConcurrentOps` based on system resources
4. Use `performance` preset for regression testing

## Security Considerations

- Evidence bundles are signed with SHA-256 checksums
- Test data should not contain sensitive information
- Output files should be stored in secure locations
- Access to storage adapters should be properly controlled

## Maintenance

### Regular Tasks

1. Update storage adapters as systems evolve
2. Review and adjust thresholds based on performance data
3. Add new storage targets as they're implemented
4. Monitor telemetry for anomalies

### Version Updates

When updating the CLI:

1. Update version in configuration
2. Test with all presets
3. Verify backward compatibility
4. Update documentation

## Examples

### Example 1: Quick CI/CD Validation

```bash
node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts \
  --preset quick \
  --format json \
  --output ./ci-evidence
```

### Example 2: Full Release Validation

```bash
node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts \
  --preset comprehensive \
  --verbose \
  --format json,markdown,csv \
  --output ./release-evidence
```

### Example 3: Performance Regression Testing

```bash
node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts \
  --preset performance \
  --targets balancer-config,spell-storage \
  --retries 5 \
  --timeout 180000
```

### Example 4: Custom Target Testing

```bash
node --import tsx/esm scripts/balancer/storageIntegrityEvidence.ts \
  --targets balancer-config \
  --format markdown \
  --verbose \
  --dry-run
```

## API Reference

### Configuration Schema

See `src/analytics/balancer/storageEvidenceConfig.ts` for complete schema definitions.

### Storage Test Framework

See `src/shared/testing/StorageTestFramework.ts` for testing framework details.

## Contributing

When contributing to the Storage Evidence CLI:

1. Follow the existing code style and patterns
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Test with all presets and configurations
5. Ensure KS-005 compliance for evidence logging

## License

This CLI is part of the RPG Balancer project and follows the same licensing terms.
