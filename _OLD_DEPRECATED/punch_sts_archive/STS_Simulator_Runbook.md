# STS Simulator Runbook & Operations Guide

**Version**: 1.0  
**Date**: 2026-01-12  
**Target**: STS Numeric Simulator Handoff Documentation  

## Overview

This runbook provides comprehensive operational guidance for the STS (Slay the Spire) Numeric Simulator, covering quick start procedures, preset workflows, CLI commands, telemetry dashboard usage, and common operational scenarios.

## Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [Preset Workflow](#preset-workflow)
3. [CLI Commands Reference](#cli-commands-reference)
4. [Telemetry Dashboard Usage](#telemetry-dashboard-usage)
5. [Common Scenarios](#common-scenarios)
6. [Evidence Log References](#evidence-log-references)

## Quick Start Guide

### Access Requirements

- **Node.js**: 20.19.6+ (`source ~/.nvm/nvm.sh && nvm use 20.19.6`)
- **Build Status**: `npm run build:check` must pass
- **Environment**: Development or production build

### Initial Configuration

```bash
# Verify installation
npm run build:check

# Start development server
npm run dev

# Access STS Simulator UI
# Navigate to: http://localhost:5173/tools/sts/simulator
```

### Basic Setup

1. **Load Default Configuration**
   ```bash
   npm run sts:simulator -- --preset=default
   ```

2. **Verify Telemetry Connection**
   ```bash
   npm run sts:telemetry -- --check-connection
   ```

3. **Run Quick Simulation**
   ```bash
   npm run sts:simulator -- --iterations=100 --seed=42
   ```

## Preset Workflow

### Creating Presets

#### 1. Access Preset Manager
```bash
# Open preset management UI
npm run dev
# Navigate to: /tools/sts/presets
```

#### 2. Define Preset Structure
```typescript
interface STSPreset {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  metadata: {
    author: string;
    tags: string[];
    difficulty: 'easy' | 'normal' | 'hard' | 'expert';
    estimatedTime: number; // minutes
  };
  configuration: {
    deckConfig: DeckConfiguration;
    enemyConfig: EnemyConfiguration;
    simulationConfig: SimulationConfiguration;
  };
}
```

#### 3. Create Preset via CLI
```bash
# Create new preset from template
npm run sts:preset -- create --template=basic --name="My Custom Preset"

# Import preset from JSON
npm run sts:preset -- import --file=./my-preset.json

# Validate preset structure
npm run sts:preset -- validate --file=./my-preset.json
```

### Applying Presets

#### Via CLI
```bash
# Apply preset to simulator
npm run sts:simulator -- --preset="my-custom-preset"

# Apply with overrides
npm run sts:simulator -- --preset="my-custom-preset" --iterations=1000 --seed=123
```

#### Via UI
1. Open Preset Manager: `/tools/sts/presets`
2. Select preset from dropdown
3. Click "Apply to Simulator"
4. Adjust parameters as needed
5. Click "Run Simulation"

### Sharing Presets

#### Export Preset
```bash
# Export to JSON
npm run sts:preset -- export --id="my-custom-preset" --format=json --output=./shared-preset.json

# Export to Markdown
npm run sts:preset -- export --id="my-custom-preset" --format=markdown --output=./README.md
```

#### Import Preset
```bash
# Import from URL
npm run sts:preset -- import --url="https://example.com/preset.json"

# Import from file
npm run sts:preset -- import --file=./downloaded-preset.json
```

## CLI Commands Reference

### Simulator Commands

#### Basic Simulation
```bash
# Run simulation with default settings
npm run sts:simulator

# Custom iterations and seed
npm run sts:simulator -- --iterations=10000 --seed=1337

# With preset
npm run sts:simulator -- --preset="ironclad-starter"

# With output file
npm run sts:simulator -- --output=./results.json --format=json
```

#### Advanced Options
```bash
# Verbose output
npm run sts:simulator -- --verbose

# Debug mode
npm run sts:simulator -- --debug

# Performance profiling
npm run sts:simulator -- --profile

# Custom deck file
npm run sts:simulator -- --deck=./custom-deck.json

# Custom enemy configuration
npm run sts:simulator -- --enemy=./act1-boss.json
```

### Preset Commands

#### Management
```bash
# List all presets
npm run sts:preset -- list

# Show preset details
npm run sts:preset -- show --id="my-preset"

# Create from template
npm run sts:preset -- create --template=ironclad --name="My Ironclad"

# Delete preset
npm run sts:preset -- delete --id="my-preset"
```

#### Validation
```bash
# Validate preset structure
npm run sts:preset -- validate --file=./preset.json

# Validate all presets
npm run sts:preset -- validate --all

# Check preset compatibility
npm run sts:preset -- check-compatibility --id="my-preset"
```

### Telemetry Commands

#### Export
```bash
# Export all telemetry data
npm run sts:telemetry -- export --all --format=csv --output=./telemetry.csv

# Export specific run
npm run sts:telemetry -- export --run-id="run-123" --format=json

# Export date range
npm run sts:telemetry -- export --from="2026-01-01" --to="2026-01-12"
```

#### Analysis
```bash
# Generate summary report
npm run sts:telemetry -- summary --output=./report.md

# Performance analysis
npm run sts:telemetry -- analyze --metric=winrate --group-by=preset

# Compare runs
npm run sts:telemetry -- compare --run-ids="run-123,run-456"
```

### Seed Inspector Commands

#### Seed Analysis
```bash
# Inspect specific seed
npm run sts:seed-inspector -- seed=42 --iterations=1000

# Generate seed sequence
npm run sts:seed-inspector -- generate --count=10 --seed=1337

# Validate determinism
npm run sts:seed-inspector -- validate --seed=42 --runs=5
```

#### RNG Testing
```bash
# Test RNG distribution
npm run sts:seed-inspector -- test-distribution --samples=10000

# Benchmark RNG performance
npm run sts:seed-inspector -- benchmark --iterations=100000
```

## Telemetry Dashboard Usage

### Access Dashboard

```bash
# Start development server
npm run dev

# Navigate to telemetry dashboard
# http://localhost:5173/tools/sts/telemetry
```

### Dashboard Features

#### 1. Real-time Monitoring
- **Live Updates**: 5-second refresh interval
- **Current Runs**: Active simulations and progress
- **System Metrics**: CPU, memory, simulation throughput

#### 2. Historical Analysis
- **Run History**: Complete simulation log
- **Performance Trends**: Win rate over time
- **Preset Comparison**: Side-by-side analysis

#### 3. Data Export
```bash
# Export dashboard data
npm run sts:telemetry -- dashboard-export --format=csv

# Generate custom report
npm run sts:telemetry -- custom-report --template=performance
```

### Dashboard Configuration

#### Filters and Search
```typescript
interface TelemetryFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  presetIds: string[];
  runIds: string[];
  metrics: string[];
}
```

#### Custom Metrics
```bash
# Add custom metric
npm run sts:telemetry -- add-metric --name="custom-winrate" --formula="wins/total"

# Configure dashboard layout
npm run sts:telemetry -- config --layout="compact"
```

## Common Scenarios

### Scenario 1: Deck Testing

#### Objective
Test deck performance against various enemies and configurations.

#### Procedure
```bash
# 1. Load deck configuration
npm run sts:deck -- load --file=./test-deck.json

# 2. Run comprehensive test
npm run sts:simulator -- \
  --deck=./test-deck.json \
  --iterations=10000 \
  --seed=42 \
  --enemies="act1-boss,act2-boss,act3-boss" \
  --output=./deck-test-results.json

# 3. Analyze results
npm run sts:telemetry -- analyze --input=./deck-test-results.json --metric=winrate
```

#### Expected Output
- Win rate percentages for each enemy
- Average turn count
- Card play frequency analysis
- Performance bottlenecks

### Scenario 2: Enemy Balance Testing

#### Objective
Validate enemy difficulty and balance across different decks.

#### Procedure
```bash
# 1. Test enemy against multiple decks
npm run sts:simulator -- \
  --enemy=./new-boss.json \
  --decks="ironclad-starter,silent-starter,defect-starter" \
  --iterations=5000 \
  --seed=123 \
  --output=./boss-balance-test.json

# 2. Generate balance report
npm run sts:telemetry -- balance-report --input=./boss-balance-test.json

# 3. Compare with existing enemies
npm run sts:telemetry -- compare --baseline="act1-boss" --target="new-boss"
```

#### Success Criteria
- Win rates between 40-60% for balanced difficulty
- Consistent performance across character classes
- No extreme outliers in turn counts

### Scenario 3: Preset Validation

#### Objective
Ensure preset compatibility and correctness.

#### Procedure
```bash
# 1. Validate preset structure
npm run sts:preset -- validate --id="my-preset"

# 2. Test preset with multiple seeds
npm run sts:simulator -- \
  --preset="my-preset" \
  --seeds="42,123,456,789,999" \
  --iterations=1000 \
  --output=./preset-validation.json

# 3. Check determinism
npm run sts:seed-inspector -- validate --preset="my-preset" --runs=3
```

#### Validation Checklist
- [ ] Preset structure is valid
- [ ] Simulation runs without errors
- [ ] Results are deterministic across seeds
- [ ] Performance is within acceptable range
- [ ] All required fields are present

### Scenario 4: Performance Benchmarking

#### Objective
Measure simulator performance and identify bottlenecks.

#### Procedure
```bash
# 1. Benchmark simulation speed
npm run sts:simulator -- \
  --iterations=100000 \
  --seed=42 \
  --profile \
  --output=./benchmark.json

# 2. Memory usage analysis
npm run sts:simulator -- \
  --iterations=10000 \
  --seed=42 \
  --memory-profile \
  --output=./memory-profile.json

# 3. Generate performance report
npm run sts:telemetry -- performance-report --input=./benchmark.json
```

#### Performance Targets
- **Simulation Speed**: > 1000 iterations/second
- **Memory Usage**: < 100MB for 10k iterations
- **Startup Time**: < 2 seconds
- **UI Responsiveness**: < 100ms for dashboard updates

### Scenario 5: Data Recovery

#### Objective
Recover from corrupted data or simulation failures.

#### Recovery Procedures
```bash
# 1. Check telemetry integrity
npm run sts:telemetry -- check-integrity --fix

# 2. Recover from backup
npm run sts:telemetry -- restore --backup=./latest-backup.json

# 3. Validate recovered data
npm run sts:telemetry -- validate --all
```

#### Backup Procedures
```bash
# Create manual backup
npm run sts:telemetry -- backup --output=./manual-backup.json

# Schedule automatic backup
npm run sts:telemetry -- auto-backup --interval=3600 # 1 hour
```

## Evidence Log References

### Implementation Evidence

| Component | Evidence Log | Status |
|-----------|--------------|--------|
| Core Simulator | `test-results/ks-081-sts-core-simulator-2026-01-11.log` | ✅ Complete |
| Preset System | `test-results/ks-081-sts-preset-bridge-2026-01-11.log` | ✅ Complete |
| Telemetry Dashboard | `test-results/ks-081-sts-telemetry-dashboard-2026-01-11.log` | ✅ Complete |
| CLI Tools | `test-results/ks-081-sts-cli-tools-2026-01-11.log` | ✅ Complete |
| Terminal Theme | `test-results/ks-081-sts-terminal-theme-2026-01-11.log` | ✅ Complete |
| QA Handoff | `test-results/ks-081-sts-qa-handoff-2026-01-11.log` | ✅ Complete |

### Configuration References

#### Default Simulator Configuration
```typescript
// From: src/balancing/config/sts/defaultSimulatorConfig.ts
export const DEFAULT_SIMULATOR_CONFIG = {
  iterations: 1000,
  seed: 42,
  debugMode: false,
  enableTelemetry: true,
  maxConcurrentSimulations: 10,
};
```

#### Preset Schema
```typescript
// From: src/balancing/config/sts/presetSchema.ts
export const PRESET_SCHEMA = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  configuration: z.object({
    deckConfig: DECK_CONFIG_SCHEMA,
    enemyConfig: ENEMY_CONFIG_SCHEMA,
    simulationConfig: SIMULATION_CONFIG_SCHEMA,
  }),
});
```

### Troubleshooting References

For detailed troubleshooting procedures, see:
- [STS Troubleshooting Guide](./STS_Troubleshooting_Guide.md)
- [Error Codes Reference](./STS_Error_Codes.md)
- [Performance Optimization Guide](./STS_Performance_Guide.md)

## Support and Escalation

### Contact Matrix

| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| Critical Bugs | Development Team | 2 hours |
| Performance Issues | Performance Team | 4 hours |
| Documentation | Documentation Team | 8 hours |
| Feature Requests | Product Team | 1 week |

### Escalation Procedures

1. **First Level**: Check troubleshooting guide and evidence logs
2. **Second Level**: Contact appropriate team via Slack channel
3. **Third Level**: Escalate to lead developer with full context

### Reporting Issues

When reporting issues, include:
- STS Simulator version
- Error messages and stack traces
- Steps to reproduce
- Relevant configuration files
- Telemetry data (if applicable)

```bash
# Generate issue report template
npm run sts:support -- issue-template --output=./issue-report.md
```

## Appendix

### A. Configuration File Locations

```
src/balancing/config/sts/
├── defaultSimulatorConfig.ts
├── presetSchema.ts
├── telemetryConfig.ts
└── cliConfig.ts
```

### B. Data Storage Locations

```
data/sts/
├── presets/
├── telemetry/
├── backups/
└── exports/
```

### C. Log File Locations

```
logs/sts/
├── simulator.log
├── telemetry.log
├── cli.log
└── performance.log
```

### D. Environment Variables

```bash
# STS Simulator Configuration
STS_SIMULATOR_DEBUG=false
STS_SIMULATOR_TELEMETRY_ENABLED=true
STS_SIMULATOR_MAX_ITERATIONS=1000000
STS_SIMULATOR_BACKUP_INTERVAL=3600
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-12  
**Next Review**: 2026-02-12  
**Maintainers**: STS Development Team
