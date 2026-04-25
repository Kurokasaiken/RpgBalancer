# STS CI Matrix Runner Documentation

## Overview

The STS CI Matrix Runner (`scripts/ci/stsMatrixRunner.ts`) is a comprehensive tool for executing multiple STS simulator presets in CI/CD environments. It provides parallel execution, result aggregation, and CI-friendly output formats for automated testing and regression analysis.

## Features

### Core Functionality
- **Parallel Execution**: Run multiple presets simultaneously with configurable concurrency
- **Deterministic Testing**: Use fixed seeds for reproducible results
- **Multiple Output Formats**: JSON, JUnit XML, and human-readable summaries
- **Error Handling**: Continue on failure or fail-fast based on configuration
- **Progress Tracking**: Real-time progress reporting and status updates
- **Result Aggregation**: Comprehensive statistics and performance metrics

### CI Integration
- **Environment Variables**: Support for CI-specific environment configuration
- **Exit Codes**: Proper exit codes for CI pipeline integration
- **Output Directories**: Structured output for artifact collection
- **Timeout Management**: Configurable timeouts to prevent hanging builds
- **Resource Management**: Memory and CPU usage optimization

## Usage

### Basic Usage

```bash
# Run default matrix configuration
npm run sts:matrix

# Run specific presets
npm run sts:matrix --presets "ironclad-basic,silent-advanced"

# Dry run to see execution plan
npm run sts:matrix --dry-run

# Verbose output
npm run sts:matrix --verbose
```

### Advanced Configuration

```bash
# Custom configuration file
npm run sts:matrix --config ./ci/matrix-config.json

# Custom iterations and parallelism
npm run sts:matrix --iterations 50 --parallel 8

# Custom timeout and output directory
npm run sts:matrix --timeout 60000 --output ./ci-results

# JUnit output for CI systems
npm run sts:matrix --format junit

# Fail fast on first error
npm run sts:matrix --fail-fast
```

## Configuration

### Default Configuration

The matrix runner includes a default configuration with three test presets:

```typescript
{
  "presets": [
    {
      "id": "ironclad-basic",
      "name": "Ironclad Basic",
      "deck": "ironclad-starter",
      "enemy": "cultist",
      "seeds": [42, 123, 456, 789, 999],
      "iterations": 10,
      "priority": 1,
      "tags": ["basic", "ironclad"]
    },
    {
      "id": "silent-advanced",
      "name": "Silent Advanced",
      "deck": "silent-poise",
      "enemy": "time-eater",
      "seeds": [111, 222, 333, 444, 555],
      "iterations": 15,
      "priority": 2,
      "tags": ["advanced", "silent"]
    },
    {
      "id": "defect-stress",
      "name": "Defect Stress Test",
      "deck": "defect-claw",
      "enemy": "awakened-one",
      "seeds": [777, 888, 999, 111, 222],
      "iterations": 20,
      "priority": 3,
      "tags": ["stress", "defect"]
    }
  ],
  "global": {
    "iterations": 10,
    "parallel": 4,
    "timeout": 30000,
    "failFast": false,
    "continueOnError": true,
    "outputDir": "./matrix-results",
    "format": "json",
    "environment": {
      "NODE_ENV": "production",
      "CI": "true"
    }
  }
}
```

### Custom Configuration File

Create a custom configuration file (e.g., `ci/matrix-config.json`):

```json
{
  "presets": [
    {
      "id": "custom-preset-1",
      "name": "Custom Test 1",
      "deck": "custom-deck",
      "enemy": "custom-enemy",
      "seeds": [1001, 1002, 1003, 1004, 1005],
      "iterations": 25,
      "timeout": 45000,
      "priority": 1,
      "tags": ["custom", "regression"]
    },
    {
      "id": "performance-test",
      "name": "Performance Benchmark",
      "deck": "ironclad-optimized",
      "enemy": "boss-rush",
      "seeds": [2001, 2002, 2003],
      "iterations": 100,
      "timeout": 120000,
      "priority": 2,
      "tags": ["performance", "benchmark"]
    }
  ],
  "global": {
    "iterations": 20,
    "parallel": 6,
    "timeout": 60000,
    "failFast": true,
    "continueOnError": false,
    "outputDir": "./ci-artifacts/matrix",
    "format": "junit",
    "environment": {
      "NODE_ENV": "production",
      "CI": "true",
      "PERFORMANCE_MODE": "true"
    }
  }
}
```

## Configuration Reference

### Preset Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier for the preset |
| `name` | string | ✅ | Human-readable name |
| `deck` | string | ✅ | Deck configuration ID |
| `enemy` | string | ✅ | Enemy configuration ID |
| `seeds` | number[] | ❌ | Fixed seeds for deterministic testing |
| `iterations` | number | ❌ | Iterations per seed (default: 1) |
| `timeout` | number | ❌ | Timeout per simulation in ms (default: global) |
| `priority` | number | ❌ | Execution priority (lower = first) |
| `tags` | string[] | ❌ | Tags for filtering and categorization |

### Global Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `iterations` | number | 10 | Default iterations per preset |
| `parallel` | number | 4 | Number of parallel processes |
| `timeout` | number | 30000 | Default timeout per simulation (ms) |
| `failFast` | boolean | false | Stop on first failure |
| `continueOnError` | boolean | true | Continue matrix if some presets fail |
| `outputDir` | string | "./matrix-results" | Output directory |
| `format` | string | "json" | Output format (json, junit, summary) |
| `environment` | object | {} | Environment variables |

## Output Formats

### JSON Format

```json
{
  "matrixId": "matrix-1641894400000",
  "timestamp": "2026-01-11T22:00:00.000Z",
  "totalPresets": 3,
  "totalRuns": 150,
  "successfulRuns": 145,
  "failedRuns": 5,
  "overallSuccess": true,
  "totalDuration": 45230,
  "averageDuration": 301.5,
  "results": [
    {
      "presetId": "ironclad-basic",
      "presetName": "Ironclad Basic",
      "success": true,
      "totalRuns": 50,
      "successfulRuns": 48,
      "failedRuns": 2,
      "averageDuration": 285.2,
      "results": [...],
      "errors": []
    }
  ]
}
```

### JUnit XML Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="STS Matrix" tests="150" failures="5" time="45.23">
    <properties>
      <property name="matrixId" value="matrix-1641894400000" />
      <property name="timestamp" value="2026-01-11T22:00:00.000Z" />
    </properties>
    <testsuite name="Ironclad Basic" tests="50" failures="2" time="0.285">
      <testcase name="seed-42" classname="ironclad-basic" time="0.285">
        <failure message="Simulation failed">
          Timeout exceeded
        </failure>
      </testcase>
    </testsuite>
  </testsuite>
</testsuites>
```

### Summary Format

```
STS CI Matrix Results
====================

Matrix ID: matrix-1641894400000
Timestamp: 2026-01-11T22:00:00.000Z
Overall Success: PASS

Summary Statistics:
  Total Presets: 3
  Total Runs: 150
  Successful: 145
  Failed: 5
  Success Rate: 96.7%
  Total Duration: 45.2s
  Avg Duration: 0.3s

Preset Results:
  Ironclad Basic (ironclad-basic): PASS
    Runs: 50, Success: 48, Failed: 2
    Avg Duration: 0.3s

  Silent Advanced (silent-advanced): PASS
    Runs: 75, Success: 75, Failed: 0
    Avg Duration: 0.4s

  Defect Stress Test (defect-stress): FAIL
    Runs: 25, Success: 22, Failed: 3
    Avg Duration: 0.2s
    Errors: 3
```

## CI Integration Examples

### GitHub Actions

```yaml
name: STS Matrix Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  sts-matrix:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run STS Matrix Tests
      run: npm run sts:matrix --format junit --output ./matrix-results
    
    - name: Upload Test Results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: sts-matrix-results
        path: ./matrix-results/
    
    - name: Publish Test Results
      uses: dorny/test-reporter@v1
      if: always()
      with:
        name: STS Matrix Tests
        path: ./matrix-results/matrix-results.xml
        reporter: java-junit
```

### GitLab CI

```yaml
sts_matrix:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm run sts:matrix --format junit --output ./matrix-results
  artifacts:
    when: always
    reports:
      junit: ./matrix-results/matrix-results.xml
    paths:
      - ./matrix-results/
    expire_in: 1 week
  only:
    - merge_requests
    - main
    - develop
```

### Jenkins Pipeline

```groovy
pipeline {
  agent any
  
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    
    stage('Setup') {
      steps {
        sh 'npm ci'
      }
    }
    
    stage('STS Matrix') {
      steps {
        sh 'npm run sts:matrix --format junit --output ./matrix-results'
      }
      
      post {
        always {
          publishTestResults testResultsPattern: './matrix-results/matrix-results.xml'
          archiveArtifacts artifacts: './matrix-results/**/*'
        }
      }
    }
  }
}
```

## Command Line Options

### Global Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--config` | `-c` | Matrix configuration file | Built-in defaults |
| `--presets` | `-p` | Comma-separated preset IDs | All presets |
| `--iterations` | `-i` | Iterations per preset | 10 |
| `--parallel` | | Parallel processes | 4 |
| `--timeout` | | Timeout per simulation (ms) | 30000 |
| `--output` | `-o` | Output directory | ./matrix-results |
| `--format` | `-f` | Output format | json |
| `--fail-fast` | | Stop on first failure | false |
| `--continue-on-error` | | Continue on errors | true |
| `--dry-run` | | Show execution plan | false |
| `--verbose` | | Verbose logging | false |

### Environment Variables

The matrix runner sets these environment variables for all simulations:

```bash
NODE_ENV=production
CI=true
```

Additional environment variables can be configured in the global configuration.

## Performance Considerations

### Resource Usage

- **Memory**: Each simulation uses approximately 10-50MB of RAM
- **CPU**: Parallel execution is CPU-intensive, monitor system load
- **Disk**: Results are written to disk, ensure adequate space

### Optimization Tips

1. **Adjust Parallelism**: Use fewer parallel processes on limited resources
2. **Timeout Management**: Set appropriate timeouts to prevent hanging
3. **Seed Management**: Use fewer seeds for faster matrix execution
4. **Output Format**: Use summary format for faster execution

### Monitoring

Monitor these metrics during matrix execution:

- **CPU Usage**: Should not exceed 80% sustained
- **Memory Usage**: Watch for memory leaks in long-running matrices
- **Disk I/O**: Ensure adequate disk space for results
- **Network**: Minimal network usage (offline execution)

## Troubleshooting

### Common Issues

#### Simulation Timeout
```
Error: Simulation failed for seed 123, iteration 1: Command timed out
```
**Solution**: Increase timeout with `--timeout` or reduce iterations

#### Preset Not Found
```
Error: Cannot find preset 'unknown-preset'
```
**Solution**: Check preset IDs in configuration or use `--dry-run` to verify

#### Memory Exhaustion
```
Error: JavaScript heap out of memory
```
**Solution**: Reduce parallel processes or iterations per preset

#### Permission Denied
```
Error: EACCES: permission denied, mkdir './matrix-results'
```
**Solution**: Check directory permissions or use different output directory

### Debug Mode

Enable verbose logging for detailed troubleshooting:

```bash
npm run sts:matrix --verbose --dry-run
```

This shows:
- Execution plan with all presets and seeds
- Resource allocation and timing estimates
- Configuration validation results
- Environment setup details

## Best Practices

### Configuration Management

1. **Version Control**: Store matrix configurations in version control
2. **Environment Specific**: Use different configs for different environments
3. **Tagging**: Use tags to categorize presets (regression, performance, stress)
4. **Priority**: Set appropriate priorities for critical tests

### CI Pipeline Integration

1. **Artifact Collection**: Always collect matrix results as artifacts
2. **Test Reporting**: Use JUnit format for CI integration
3. **Fail Fast**: Use `--fail-fast` for critical regression testing
4. **Parallel Execution**: Adjust parallelism based on CI resources

### Monitoring and Alerting

1. **Success Rate Tracking**: Monitor success rates over time
2. **Performance Regression**: Track execution time changes
3. **Error Pattern Analysis**: Identify common failure patterns
4. **Resource Utilization**: Monitor CI resource usage

## Examples and Templates

### Basic Regression Matrix

```json
{
  "presets": [
    {
      "id": "regression-basic",
      "name": "Basic Regression",
      "deck": "ironclad-starter",
      "enemy": "cultist",
      "seeds": [42, 123, 456],
      "iterations": 5,
      "priority": 1,
      "tags": ["regression", "basic"]
    }
  ],
  "global": {
    "failFast": true,
    "parallel": 2,
    "format": "junit"
  }
}
```

### Performance Benchmark Matrix

```json
{
  "presets": [
    {
      "id": "perf-ironclad",
      "name": "Ironclad Performance",
      "deck": "ironclad-optimized",
      "enemy": "boss-rush",
      "seeds": [1001, 1002, 1003],
      "iterations": 100,
      "timeout": 120000,
      "priority": 1,
      "tags": ["performance", "ironclad"]
    }
  ],
  "global": {
    "parallel": 1,
    "continueOnError": false,
    "format": "json",
    "environment": {
      "PERFORMANCE_MODE": "true"
    }
  }
}
```

### Stress Test Matrix

```json
{
  "presets": [
    {
      "id": "stress-defect",
      "name": "Defect Stress Test",
      "deck": "defect-claw",
      "enemy": "awakened-one",
      "seeds": [2001, 2002, 2003, 2004, 2005],
      "iterations": 50,
      "timeout": 180000,
      "priority": 3,
      "tags": ["stress", "defect"]
    }
  ],
  "global": {
    "parallel": 1,
    "continueOnError": true,
    "format": "summary",
    "environment": {
      "STRESS_MODE": "true"
    }
  }
}
```

## Integration with Existing Tools

### STS CLI Integration

The matrix runner uses the existing STS CLI (`npm run sts:simulate`) under the hood. This ensures:

- **Consistency**: Same simulation logic across all tools
- **Maintainability**: Single source of truth for simulation logic
- **Compatibility**: Works with existing STS configurations

### Telemetry Integration

Matrix results can be integrated with existing STS telemetry systems:

```bash
# Upload matrix results to telemetry system
npm run sts:upload --file ./matrix-results/matrix-results.json
```

### Storage Testing Integration

Matrix results can be validated using the storage testing framework:

```bash
# Test matrix result storage
npm run test:storage --matrix ./matrix-results
```

## Future Enhancements

### Planned Features

1. **Dynamic Configuration**: Runtime configuration updates
2. **Distributed Execution**: Multi-machine matrix execution
3. **Real-time Monitoring**: Web-based monitoring dashboard
4. **Advanced Analytics**: Statistical analysis of matrix results
5. **Integration APIs**: REST API for matrix management

### Extension Points

The matrix runner is designed to be extensible:

- **Custom Output Formats**: Add new output format handlers
- **Custom Preset Types**: Support for different preset configurations
- **Custom Metrics**: Add custom performance metrics
- **Custom Validators**: Add result validation rules

---

## Support and Contributing

For issues, questions, or contributions to the STS CI Matrix Runner:

1. **Documentation**: Check this documentation first
2. **Issues**: File issues in the project repository
3. **Examples**: Share useful configurations and CI setups
4. **Contributions**: Follow the project contribution guidelines

The matrix runner is part of the KS-081 STS CLI tools suite and follows the same development and contribution guidelines.
