# STS Simulator Troubleshooting Guide

**Version**: 1.0  
**Date**: 2026-01-12  
**Target**: STS Numeric Simulator Issue Resolution  

## Overview

This troubleshooting guide provides comprehensive solutions for common STS Simulator issues, including error codes, performance problems, data corruption, and debugging procedures.

## Table of Contents

1. [Error Codes & Solutions](#error-codes--solutions)
2. [Performance Issues](#performance-issues)
3. [Data Corruption & Recovery](#data-corruption--recovery)
4. [Debug Mode Activation](#debug-mode-activation)
5. [Common UI Issues](#common-ui-issues)
6. [CLI Troubleshooting](#cli-troubleshooting)
7. [Contact Escalation](#contact-escalation)

## Error Codes & Solutions

### STS-0001: Configuration Validation Failed

**Description**: Simulator configuration failed validation
**Common Causes**: Invalid preset structure, missing required fields, type mismatches

**Solutions**:
```bash
# Validate configuration
npm run sts:preset -- validate --file=./config.json

# Check preset schema
npm run sts:preset -- check-schema --id="problematic-preset"

# Reset to default configuration
npm run sts:simulator -- --reset-config
```

**Prevention**:
- Always validate presets before use
- Use preset templates for new configurations
- Run `npm run build:check` after configuration changes

### STS-0002: Simulation Engine Error

**Description**: Core simulation engine encountered an error
**Common Causes**: Invalid deck configuration, enemy data corruption, memory overflow

**Solutions**:
```bash
# Check deck integrity
npm run sts:deck -- validate --file=./deck.json

# Verify enemy configuration
npm run sts:enemy -- validate --file=./enemy.json

# Run with debug mode
npm run sts:simulator -- --debug --iterations=10

# Clear simulation cache
npm run sts:simulator -- --clear-cache
```

**Prevention**:
- Validate all input files before simulation
- Monitor memory usage during large simulations
- Use appropriate iteration counts for system capabilities

### STS-0003: Telemetry Connection Failed

**Description**: Unable to connect to telemetry dashboard
**Common Causes**: Server not running, network issues, database corruption

**Solutions**:
```bash
# Check server status
npm run sts:telemetry -- --status

# Restart telemetry service
npm run sts:telemetry -- --restart

# Check database integrity
npm run sts:telemetry -- --check-integrity --fix

# Reset telemetry database
npm run sts:telemetry -- --reset-database
```

**Prevention**:
- Monitor server health regularly
- Implement automatic backup procedures
- Use connection retry logic in applications

### STS-0004: Preset Import/Export Failed

**Description**: Unable to import or export presets
**Common Causes**: File corruption, permission issues, invalid format

**Solutions**:
```bash
# Check file permissions
ls -la ./presets/

# Validate file format
npm run sts:preset -- validate --file=./import.json

# Repair corrupted preset
npm run sts:preset -- repair --id="corrupted-preset"

# Export with different format
npm run sts:preset -- export --id="my-preset" --format=yaml
```

**Prevention**:
- Use version control for preset files
- Implement file integrity checks
- Create backup copies before modifications

### STS-0005: CLI Command Not Found

**Description**: CLI command not recognized or failed to execute
**Common Causes**: Installation incomplete, PATH issues, version mismatch

**Solutions**:
```bash
# Verify installation
npm run sts:cli -- --version

# Reinstall CLI tools
npm run build:cli

# Check PATH configuration
echo $PATH | grep -o "node_modules/.bin"

# Update package dependencies
npm update
```

**Prevention**:
- Keep dependencies up to date
- Use package scripts instead of direct CLI calls
- Verify installation after major updates

## Performance Issues

### Slow Simulation Performance

**Symptoms**: Simulations taking longer than expected, high CPU usage

**Diagnosis**:
```bash
# Profile simulation performance
npm run sts:simulator -- --profile --iterations=1000

# Check system resources
npm run sts:system -- --check-resources

# Benchmark current performance
npm run sts:benchmark -- --iterations=10000
```

**Solutions**:
```bash
# Reduce concurrent simulations
npm run sts:simulator -- --max-concurrent=1

# Use optimized configuration
npm run sts:simulator -- --preset="performance-optimized"

# Enable performance mode
npm run sts:simulator -- --performance-mode

# Clear simulation cache
npm run sts:simulator -- --clear-cache --deep
```

**Optimization Tips**:
- Use appropriate iteration counts (start with 1000, scale up as needed)
- Disable telemetry for large batch simulations
- Use deterministic seeds for reproducible results
- Monitor memory usage and adjust accordingly

### Memory Leaks

**Symptoms**: Memory usage increasing over time, system slowdowns

**Diagnosis**:
```bash
# Monitor memory usage
npm run sts:memory -- --monitor --duration=300

# Check for memory leaks
npm run sts:memory -- --leak-detection --iterations=10000

# Generate memory profile
npm run sts:memory -- --profile --output=./memory-profile.json
```

**Solutions**:
```bash
# Restart simulator service
npm run sts:simulator -- --restart

# Clear memory cache
npm run sts:simulator -- --clear-memory

# Use memory-efficient mode
npm run sts:simulator -- --memory-efficient

# Limit concurrent operations
npm run sts:simulator -- --max-concurrent=2
```

**Prevention**:
- Monitor memory usage regularly
- Implement automatic cache clearing
- Use memory profiling tools for optimization
- Set appropriate memory limits

### Dashboard Performance Issues

**Symptoms**: Slow dashboard updates, UI freezing, high latency

**Diagnosis**:
```bash
# Check dashboard performance
npm run sts:telemetry -- --dashboard-performance

# Monitor network requests
npm run sts:telemetry -- --network-monitor

# Analyze dashboard metrics
npm run sts:telemetry -- --analyze-dashboard
```

**Solutions**:
```bash
# Optimize dashboard refresh rate
npm run sts:telemetry -- --refresh-interval=10

# Enable dashboard caching
npm run sts:telemetry -- --enable-cache

# Reduce data payload
npm run sts:telemetry -- --reduce-payload

# Use performance mode
npm run sts:telemetry -- --performance-mode
```

## Data Corruption & Recovery

### Preset Data Corruption

**Symptoms**: Presets failing to load, invalid data errors

**Recovery Procedures**:
```bash
# Identify corrupted presets
npm run sts:preset -- --check-all --verbose

# Repair corrupted presets
npm run sts:preset -- --repair-all

# Restore from backup
npm run sts:preset -- --restore --backup=./preset-backup.json

# Reset to factory defaults
npm run sts:preset -- --factory-reset
```

**Prevention**:
```bash
# Create regular backups
npm run sts:preset -- --backup --interval=3600

# Validate presets before saving
npm run sts:preset -- --validate-on-save

# Use version control
git add ./presets/
git commit -m "Backup presets"
```

### Telemetry Data Corruption

**Symptoms**: Dashboard showing incorrect data, missing records

**Recovery Procedures**:
```bash
# Check telemetry integrity
npm run sts:telemetry -- --check-integrity

# Repair corrupted data
npm run sts:telemetry -- --repair-data

# Restore from backup
npm run sts:telemetry -- --restore --backup=./telemetry-backup.json

# Reset telemetry database
npm run sts:telemetry -- --reset-database
```

**Prevention**:
```bash
# Enable automatic backups
npm run sts:telemetry -- --auto-backup --interval=1800

# Validate data on write
npm run sts:telemetry -- --validate-on-write

# Monitor data integrity
npm run sts:telemetry -- --integrity-monitor
```

### Simulation Result Corruption

**Symptoms**: Inconsistent results, impossible values, calculation errors

**Recovery Procedures**:
```bash
# Validate recent results
npm run sts:simulator -- --validate-recent --days=7

# Re-run affected simulations
npm run sts:simulator -- --rerun-corrupted

# Clear result cache
npm run sts:simulator -- --clear-results-cache

# Reset simulation engine
npm run sts:simulator -- --reset-engine
```

**Prevention**:
```bash
# Enable result validation
npm run sts:simulator -- --validate-results

# Use deterministic seeds
npm run sts:simulator -- --deterministic-mode

# Implement result checksums
npm run sts:simulator -- --enable-checksums
```

## Debug Mode Activation

### Enabling Debug Mode

**Global Debug Mode**:
```bash
# Enable for all operations
export STS_DEBUG=true
npm run sts:simulator -- --debug

# Or use command flag
npm run sts:simulator -- --debug --verbose
```

**Component-Specific Debug**:
```bash
# Simulator debug
npm run sts:simulator -- --debug --component=engine

# Telemetry debug
npm run sts:telemetry -- --debug --component=dashboard

# CLI debug
npm run sts:cli -- --debug --command=preset
```

### Debug Information Collection

**System Information**:
```bash
# Generate system report
npm run sts:debug -- --system-info --output=./system-report.json

# Collect configuration
npm run sts:debug -- --config-dump --output=./config.json

# Export environment variables
npm run sts:debug -- --env-dump --output=./env.json
```

**Debug Logs**:
```bash
# Enable verbose logging
npm run sts:simulator -- --debug --log-level=verbose

# Save debug logs
npm run sts:simulator -- --debug --log-file=./debug.log

# Tail debug logs in real-time
npm run sts:simulator -- --debug --follow-logs
```

### Debug Scenarios

#### Scenario 1: Investigation Unexpected Results

```bash
# Run with same seed for comparison
npm run sts:simulator -- --seed=42 --debug --iterations=100

# Compare with baseline
npm run sts:simulator -- --seed=42 --baseline --iterations=100

# Generate detailed trace
npm run sts:simulator -- --trace --seed=42 --iterations=10
```

#### Scenario 2: Performance Investigation

```bash
# Profile with debug information
npm run sts:simulator -- --profile --debug --iterations=1000

# Memory debug
npm run sts:simulator -- --memory-debug --iterations=10000

# Network debug (if applicable)
npm run sts:simulator -- --network-debug --remote-mode
```

#### Scenario 3: Configuration Issues

```bash
# Debug preset loading
npm run sts:preset -- --debug --load --id="problematic-preset"

# Debug configuration parsing
npm run sts:simulator -- --debug --config-dump

# Debug validation process
npm run sts:preset -- --debug --validate --id="preset"
```

## Common UI Issues

### Dashboard Not Loading

**Symptoms**: Dashboard shows loading spinner, blank page, error messages

**Solutions**:
```bash
# Check server status
npm run sts:telemetry -- --status

# Clear browser cache
# In browser: Ctrl+Shift+R (hard refresh)

# Check console errors
# Open browser developer tools, check Console tab

# Restart development server
npm run dev
```

### Preset Manager Issues

**Symptoms**: Presets not loading, save failures, UI freezing

**Solutions**:
```bash
# Validate preset files
npm run sts:preset -- --validate-all

# Clear preset cache
npm run sts:preset -- --clear-cache

# Reset preset manager
npm run sts:preset -- --reset-manager

# Check file permissions
ls -la ./data/presets/
```

### Simulation Controls Not Working

**Symptoms**: Start/stop buttons not responding, parameter changes not applying

**Solutions**:
```bash
# Check simulator status
npm run sts:simulator -- --status

# Reset simulator state
npm run sts:simulator -- --reset-state

# Clear control cache
npm run sts:simulator -- --clear-controls-cache

# Check for JavaScript errors
# Open browser developer tools, check Console tab
```

## CLI Troubleshooting

### Command Not Found

**Symptoms**: `command not found` errors, CLI tools not working

**Solutions**:
```bash
# Verify installation
npm run sts:cli -- --version

# Rebuild CLI tools
npm run build:cli

# Check package.json scripts
cat package.json | grep -A 10 "scripts"

# Use npx to run directly
npx sts-simulator -- --help
```

### Permission Issues

**Symptoms**: Permission denied errors, unable to read/write files

**Solutions**:
```bash
# Check file permissions
ls -la ./data/sts/

# Fix permissions
chmod 755 ./data/sts/
chmod 644 ./data/sts/*.json

# Run with appropriate user
sudo npm run sts:simulator -- --system-mode
```

### Environment Issues

**Symptoms**: Environment variable errors, path issues

**Solutions**:
```bash
# Check environment
npm run env:check

# Set required variables
export STS_SIMULATOR_HOME=/path/to/sts
export STS_DEBUG=true

# Verify Node.js version
node --version
npm --version

# Use correct Node.js version
source ~/.nvm/nvm.sh && nvm use 20.19.6
```

## Contact Escalation

### When to Escalate

Escalate to the appropriate team when:

1. **Critical Issues**: Production downtime, data loss, security concerns
2. **Complex Problems**: Issues requiring deep technical expertise
3. **Documentation Gaps**: Missing information in troubleshooting guide
4. **Recurring Issues**: Problems that keep happening after fixes

### Escalation Procedures

#### Level 1: Self-Service
- Check this troubleshooting guide
- Review evidence logs
- Try basic recovery procedures
- Document attempted solutions

#### Level 2: Team Support
- Contact appropriate team via Slack
- Provide detailed issue description
- Include error logs and system information
- Share troubleshooting steps already attempted

#### Level 3: Lead Escalation
- Escalate to lead developer
- Provide full context and history
- Include impact assessment
- Request urgent attention if needed

### Issue Reporting Template

When creating issues, include:

```markdown
## Issue Description
[Brief description of the problem]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happened]

## Environment Information
- STS Simulator Version: [version]
- Node.js Version: [version]
- Operating System: [OS]
- Browser: [browser and version]

## Error Messages
[Include full error messages and stack traces]

## Troubleshooting Steps Taken
[Steps already attempted]

## Additional Information
[Any other relevant information]
```

### Support Channels

| Channel | Purpose | Response Time |
|---------|---------|---------------|
| Slack #sts-support | General support and questions | 4 hours |
| Slack #sts-urgent | Critical issues and downtime | 1 hour |
| GitHub Issues | Bug reports and feature requests | 1 week |
| Email sts-team@example.com | Formal escalation | 2 days |

### Documentation Feedback

For improvements to this troubleshooting guide:

1. **Missing Solutions**: Report issues that aren't covered
2. **Unclear Instructions**: Suggest clarifications for confusing steps
3. **New Issues**: Document new error codes and solutions
4. **Examples**: Provide real-world examples and use cases

```bash
# Generate feedback template
npm run sts:support -- feedback-template --output=./troubleshooting-feedback.md
```

---

**Guide Version**: 1.0  
**Last Updated**: 2026-01-12  
**Next Review**: 2026-02-12  
**Maintainers**: STS Development Team
