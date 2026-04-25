# Guardian Autopush Dry-Run Analyzer - NP-041

## Overview

The Guardian Autopush Dry-Run Analyzer provides a comprehensive tool for analyzing guardian_autopush operations in dry-run mode. It monitors commit/push operations, detects failures, and provides insights for guardian operations with ASCII dashboard visualization and telemetry tracking.

## Features

### Analysis Capabilities
- **Historical Analysis**: Analyze existing guardian logs from `test-results/auto-commit-guardian/`
- **Synthetic Scenarios**: Test with predefined scenarios for failure conditions
- **Real-time Monitoring**: Track guardian operations without affecting production
- **Issue Detection**: Identify diagnostic failures, timeouts, and script errors
- **Performance Metrics**: Monitor operation duration and success rates

### Output Formats
- **ASCII Dashboard**: Terminal-friendly dashboard with visual indicators
- **JSON Export**: Machine-readable format for automation
- **Markdown Export**: Human-readable documentation format

### CLI Commands
- **analyze**: Run dry-run analysis with various filters
- **list**: Browse available guardian logs
- **info**: Show system statistics and recent sessions
- **validate**: Verify guardian configuration and log integrity

## Installation

The CLI is included in the RPG Balancer project. No additional installation required.

```bash
# Ensure Node.js 20+ is active
source ~/.nvm/nvm/sh && nvm use

# Make CLI executable (optional)
chmod +x scripts/guardian/guardianAutopushDryRun.ts
```

## Usage

### Basic Commands

#### Analyze Guardian Operations
```bash
# Run basic analysis
tsx scripts/guardian/guardianAutopushDryRun.ts analyze

# Analyze with verbose output
tsx scripts/guardian/guardianAutopushDryRunRun.ts analyze --verbose

# Include synthetic test scenarios
tsx scripts/guardian/guardianAutopushDryRun.ts analyze --synthetic
```

#### Filter Analysis
```bash
# Filter by branch
tsx scripts/guardian/guardianAutopushDryRun.ts analyze --branch main

# Filter by stage
tsx scripts/guardian/guardAutopushDryRun.ts analyze --stage commit

# Filter by time range
tsx scripts/guardian/guardianAutopushDryRun.ts analyze --time-range 2023-01-01,2023-01-31
```

#### Output Formats
```bash
# Generate ASCII dashboard (default)
tsx scripts/guardian/guardianAutopushDryRun.ts analyze

# Export to JSON
tsx scripts/guardian/guardianAutopushDryRun.ts analyze --format json

# Export to Markdown
tsx scripts/guardian/guardianAutopushDryRun.ts analyze --format markdown
```

#### Dry Run Mode
```bash
# Preview analysis without saving
tsx scripts/guardian/guardianAutopushDryRun.ts analyze --dry-run

# Specify output file
tsx scripts/guardian/guardianAutopushDryRun.ts analyze --output my-analysis.txt
```

### Management Commands

#### List Available Logs
```bash
# List all guardian logs
tsx scripts/guardian/guardianAutopushDryRun.ts list

# Show file sizes and modification dates
tsx scripts/guardian/guardianAutopushDryRun.ts list --verbose
```

#### System Information
```bash
# Show basic system info
tsx scripts/guardian/guardianAutopushDryRun.ts info

# Show detailed statistics
tsx scripts/guardian/guardianAutopushDryRun.ts info --stats

# Show recent sessions
tsx scripts/guardian/guardianAutopushDryRun.ts info --recent 10
```

#### Validate Configuration
```bash
# Validate guardian setup
tsx scripts/guardian/guardianAutopushDryRun.ts validate

# Validate custom log directory
tsx scripts/guardian/guardianopushDryRun.ts validate --log-dir /custom/path
```

### Advanced Usage

#### Custom Synthetic Scenarios
```bash
# Load scenarios from file
tsx scripts/guardian/guardianopushDryRun.ts analyze --synthetic --scenarios my-scenarios.json

# Create custom scenarios file
cat > my-scenarios.json << EOF
[
  {
    "name": "Custom Test",
    "description": "Custom test scenario",
    "stage": "commit",
    "branch": "feature-branch",
    "diagnostics": [
      {
        "label": "npm run custom-test",
        "command": "npm",
        "args": ["run", "custom-test"],
        "exitCode": 0,
        "stdout": "Custom test passed",
        "stderr": "",
        "duration": 3000
      }
    ],
    "expectedOutcome": "success"
  }
]
EOF
```

#### Time Range Analysis
```bash
# Analyze last 7 days (default)
tsx scripts/guardian/guardianopushDryRun.ts analyze

# Analyze specific date range
tsx scripts/guardian/guardianopushDryRun.ts analyze --time-range 2023-01-01,2023-01-31

# Analyze last 24 hours
tsx scripts/guardian/guardopushDryRun.ts analyze --time-range $(date -d '1 day' -I '%Y-%m-%d'),$(date -I '%Y-%m-%d')
```

#### Branch-Specific Analysis
```bash
# Analyze main branch
tsx scripts/guardian/guardopushDryRun.ts analyze --branch main

# Analyze feature branch
tsx scripts/guardian/guardopushDryRun.ts analyze --branch feature/new-feature

# Compare branches
tsx scripts/guardian/guardopushDryRun.ts analyze --branch main
tsx scripts/guardian/guardopushDryRun.ts analyze --branch develop
```

## Output Formats

### ASCII Dashboard
The ASCII dashboard provides a terminal-friendly visualization with:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    GUARDIAN AUTOPUSH DRY-RUN ANALYZER                      │
├─────────────────────────────────────────────────────────────────────────────────┤

📊 SESSION INFORMATION
├─────────────────────────────────────────────────────────────────────────────────┤
Session ID: guardian-dryrun-abc123
Timestamp: 2023-01-19T12:34:56.000Z
Simulation: synthetic
Stage: COMMIT
Status: SUCCESS
Branch: main
Duration: 14s

📈 SUMMARY METRICS
├─────────────────────────────────────────────────────────────────────────────────┤
Diagnostics: 5/5 successful
Duration: 14s
Avg Duration: 2.8s
Issues: 0 detected

💡 RECOMMENDATIONS
├─────────────────────────────────────────────────────────────────────────────────┤
✅ No issues detected - system operating normally
```

### JSON Format
```json
{
  "sessionId": "guardian-dryrun-abc123",
  "timestamp": "2023-01-19T12:34:56.000Z",
  "simulationType": "synthetic",
  "config": {
    "outputFormat": "ascii",
    "verbose": false,
    "syntheticScenarios": []
  },
  "result": {
    "sessionId": "guardian-dryrun-abc123",
    "startTime": "2023-01-19T12:34:56.000Z",
    "endTime": "2023-01-19T12:35:10.000Z",
    "duration": 14000,
    "stage": "commit",
    "status": "success",
    "entries": [],
    "diagnostics": [],
    "branch": "main",
    "summary": {
      "totalDiagnostics": 5,
      "successfulDiagnostics": 5,
      "failedDiagnostics": 0,
      "totalDuration": 14000,
      "averageDiagnosticDuration": 2800
    },
    "issues": []
  },
  "recommendations": [
    "✅ No issues detected - system operating normally"
  ]
}
```

### Markdown Format
```markdown
# Guardian Autopush Dry-Run Analysis

**Session ID:** guardian-dryrun-abc123
**Timestamp:** 2023-01-19T12:34:56.000Z
**Simulation Type:** synthetic
**Status:** success

## Session Information

- **Stage:** commit
- **Branch:** main
- **Duration:** 14s
- **Entries:** 2

## Summary Metrics

- **Diagnostics:** 5/5 successful
- **Total Duration:** 14s
- **Average Duration:** 2.8s
- **Issues Detected:** 0

## Recommendations

- ✅ No issues detected - system operating normally
```

## Data Structures

### Guardian Session Analysis
```typescript
interface GuardianSessionAnalysis {
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  stage: 'commit' | 'push';
  status: 'success' | 'failed' | 'incomplete';
  entries: GuardianLogEntry[];
  diagnostics: GuardianDiagnostic[];
  branch: string;
  summary: {
    totalDiagnostics: number;
    successfulDiagnostics: number;
    failedDiagnostics: number;
    totalDuration: number;
    averageDiagnosticDuration: number;
  };
  issues: GuardianIssue[];
}
```

### Guardian Issue Detection
```typescript
interface GuardianIssue {
  type: 'diagnostic_failure' | 'timeout' | 'network_error' | 'permission_error' | 'script_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  stage: 'commit' | 'push';
  message: string;
  diagnostic?: string;
  suggestion: string;
  timestamp: string;
}
```

### Synthetic Scenario
```typescript
interface SyntheticScenario {
  name: string;
  description: string;
  stage: 'commit' | 'push';
  branch: string;
  diagnostics: SyntheticDiagnostic[];
  expectedOutcome: 'success' | 'failure';
}
```

## Synthetic Scenarios

The analyzer includes built-in synthetic scenarios for testing:

### Success Scenarios
- **Successful Commit**: Normal commit with all diagnostics passing
- **Successful Push**: Normal push with all checks passing

### Failure Scenarios
- **Lint Failure**: Lint operation fails with error output
- **Push Timeout**: Push operation times out after 45 seconds
- **Network Error**: Network connectivity issues during deploy verification

### Custom Scenarios
Create custom scenarios by defining:
- Scenario name and description
- Target stage (commit/push)
- Branch name
- Diagnostic commands with expected outcomes
- Success/failure expectation

```json
{
  "name": "Custom Test",
  "description": "Custom test scenario",
  "stage": "commit",
  "branch": "feature-branch",
  "diagnostics": [
    {
      "label": "npm run custom-test",
      "command": "npm",
      "args": ["run", "custom-test"],
      "exitCode": 0,
      "stdout": "Custom test passed",
      "stderr": "",
      "duration": 3000
    }
  ],
  "expectedOutcome": "success"
}
```

## Issue Detection

### Diagnostic Failures
- **Severity Levels**: Low, Medium, High, Critical
- **Auto-Suggestion**: Context-aware fix recommendations
- **Stage Tracking**: Commit vs Push specific issues

### Timeout Detection
- **Threshold**: 30 seconds for operations
- **Suggestion**: Check network issues or slow operations

### Script Errors
- **Permission Issues**: Access denied errors
- **Configuration Problems**: Script setup issues
- **Suggestion**: Check permissions and dependencies

## Performance Metrics

### Operation Duration
| Operation | Expected Duration |
|-----------|------------------|
| npm run lint | < 3s |
| npm run test | < 10s |
| npm run build:check | < 5s |
| npm run kanban:lint | < 2s |
| npm run deploy:vercel:verify | < 3s |
| git push | < 30s |

### Success Rates
- **Healthy System**: > 95% success rate
- **Warning**: 80-95% success rate
- **Critical**: < 80% success rate

## Workflows

### Daily Health Check
```bash
# Quick health check
tsx scripts/guardian/guardianAutopushDryRun.ts analyze --synthetic

# Detailed analysis
tsx scripts/guardian/guardianopushDryRun.ts analyze --verbose --format markdown --output daily-health-$(date +%Y-%m-%d).md
```

### Pre-Deployment Validation
```bash
# Validate guardian setup
tsx scripts/guardian/guardAutopushDryRun.ts validate

# Run comprehensive analysis
tsx scripts/guardian/guardianopushDryRun.ts analyze --synthetic --verbose --format json --output pre-deploy-check.json
```

### Incident Investigation
```bash
# Analyze recent failures
tsx scripts/guardian/guardianAutopushDryRun.ts analyze --time-range $(date -d '7 days' -I '%Y-%m-%d'),$(date -I '%Y-%m-%d') --verbose

# Export findings for review
tsx scripts/guardian/guardianopushDryRun.ts analyze --format markdown --output incident-report-$(date +%Y-%m-%d).md
```

### Performance Monitoring
```bash
# Weekly performance report
tsx scripts/guardian/guardopushDryRun.ts info --stats

# Export metrics for dashboard
tsx scripts/guardian/guardopushDryRun.ts analyze --format json --output weekly-metrics-$(date +%Y-%m-%d).json
```

## Telemetry

The analyzer automatically emits telemetry events for tracking:

### Analysis Events
```typescript
{
  "event": "guardian_dryrun_analyzed",
  "timestamp": "2023-01-19T12:34:56.000Z",
  "data": {
    "sessionId": "guardian-dryrun-abc123",
    "simulationType": "synthetic",
    "status": "success",
    "stage": "commit",
    "branch": "main",
    "duration": 14000,
    "issuesCount": 0,
    "diagnosticsCount": 5,
    "successRate": 1.0,
    "recommendations": 1,
    "outputFile": "guardian-dryrun-2023-01-19.txt"
  }
}
```

### Telemetry Storage
- **Location**: `telemetry_guardian_dryrun_analyzed_<timestamp>`
- **Format**: JSON with metadata
- **Access**: Via PersistenceService
- **Retention**: Follows project retention policies

## Integration Points

### Guardian Autopush System
- **Log Directory**: `test-results/auto-commit-guardian/`
- **Commit Scripts**: `auto_commit_push.sh`
- **Monitor Script**: `scripts/autoCommit/commitFailureMonitor.js`
- **Mandate**: `docs/docs/operations/guardian_autopush_mandate.md`

### Persistence Service
- **Telemetry Storage**: Async telemetry emission
- **Configuration Management**: Load/save analysis results
- **Error Handling**: Graceful failure recovery

### Balancer Analytics
- **Analytics Module**: `src/analytics/guardian/`
- **Telemetry Router**: Centralized event routing
- **Storage Testing**: Framework integration

## Error Handling

### Common Errors
```bash
# No logs found
Error: No sessions found matching criteria
Solution: Check log directory and time range

# Invalid configuration
Error: Unsupported format: invalid
Solution: Use ascii, json, or markdown

# Parse errors
Error: Failed to parse log file
Solution: Check log file format and permissions
```

### Recovery Strategies
1. **Dry Run Mode**: Always test with `--dry-run` first
2. **Validation**: Use `validate` command to check setup
3. **Verbose Mode**: Use `--verbose` for detailed error information
4. **Synthetic Testing**: Use `--synthetic` to test without real data

## Best Practices

### Regular Monitoring
- **Daily Health Checks**: Run synthetic scenarios daily
- **Weekly Analysis**: Review performance trends
- **Monthly Reports**: Generate comprehensive reports
- **Incident Response**: Use for troubleshooting

### Configuration Management
- **Time Ranges**: Use consistent time ranges for comparisons
- **Branch Filtering**: Analyze specific branches separately
- **Output Organization**: Organize reports by date and type
- **Backup Strategy**: Keep historical analysis for trend analysis

### Synthetic Scenarios
- **Test Coverage**: Cover common failure scenarios
- **Custom Scenarios**: Create scenarios for specific issues
- **Regular Updates**: Update scenarios as system evolves
- **Validation**: Ensure scenarios match real-world conditions

## Troubleshooting

### Log File Issues
```bash
# Check log directory
ls -la test-results/auto-commit-guardian/

# Validate log files
tsx scripts/guardian/guardianAutopushDryRun.ts validate

# Check file permissions
ls -la test-results/auto-commit-guardian/*.log
```

### Analysis Failures
```bash
# Check with verbose output
tsx scripts/guardian/guardAutopushDryRun.ts analyze --verbose

# Test with synthetic scenarios
tsx scripts/guardian/guardopushDryRun.ts analyze --synthetic

# Validate configuration
tsx scripts/guardian/guardopushDryRun.ts validate
```

### Performance Issues
```bash
# Check system resources
tsx scripts/guardian/guardopushDryRun.ts info --stats

# Monitor operation duration
tsx scripts/guardian/guardianopushDryRun.ts analyze --verbose | grep "Duration"
```

## Future Enhancements

### Planned Features
- **Real-time Monitoring**: Live dashboard with WebSocket updates
- **Alert System**: Automatic notifications for critical issues
- **Trend Analysis**: Historical performance tracking
- **Integration API**: REST API for external monitoring
- **Custom Rules**: User-defined issue detection rules
- **Export Automation**: Scheduled report generation

### Extension Points
- **Custom Scenarios**: Plugin system for new test scenarios
- **Custom Formatters**: Additional output format support
- **Custom Analyzers**: Specialized analysis logic
- **Telemetry Hooks**: Custom telemetry event handlers
- **UI Components**: Reusable dashboard components

## Security Considerations

### Data Protection
- **No Sensitive Data**: Only analyzes operation metadata
- **Read-Only Access**: Never modifies guardian operations
- **Local Storage**: All analysis stored locally
- **Config-First**: No hardcoded credentials or secrets

### Operation Safety
- **Dry Run Mode**: Default safe mode without changes
- **Validation**: Comprehensive input validation
- **Error Handling**: Graceful failure recovery
- **Backup Protection**: Automatic backup creation

### Access Control
- **File System**: Limited to designated directories
- **Process Permissions**: No elevated privileges required
- **Network Access**: No external network calls
- **Script Execution**: No script execution in analysis mode

## Support

### Documentation
- **CLI Reference**: `tsx scripts/guardian/guardianAutopushDryRun.ts --help`
- **API Documentation**: JSDoc comments in source files
- **Configuration Guide**: This comprehensive guide
- **Troubleshooting**: Error handling section

### Examples and Templates
- **Synthetic Scenarios**: Default scenarios for testing
- **CLI Examples**: Usage examples for common tasks
- **Integration Examples**: CI/CD integration patterns

### Community
- **Issues**: Report via project issue tracker
- **Enhancements**: Suggest features via project discussions
- **Contributions**: Follow project contribution guidelines

## License

This tool is part of the RPG Balancer project and follows the same license terms.

---

**Version**: 1.0.0  
**Author**: Cascade  
**Last Updated**: 2023-01-19  
**Compatibility**: Node.js 20+
