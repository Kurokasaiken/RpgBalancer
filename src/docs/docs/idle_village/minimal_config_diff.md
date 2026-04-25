# Minimal Config Diff Reporter

This document describes the Minimal Config Diff Reporter CLI tool for comparing Minimal Gameplay configuration files and generating detailed difference reports.

## Overview

The Minimal Config Diff Reporter provides a command-line tool to compare two versions of Minimal Gameplay configuration exported as JSON files. It validates configurations against the MinimalConfigSchema, calculates differences across all configuration sections, and generates reports in JSON or Markdown format.

## Features

- **Schema Validation**: Ensures both input configs are valid according to MinimalConfigSchema
- **Section-Based Diffing**: Calculates changes in resources, UI, loop, and warnings sections
- **Multiple Output Formats**: Generates reports in JSON or human-readable Markdown
- **Detailed Change Tracking**: Provides before/after values for all modifications
- **CLI Interface**: Simple command-line interface with flexible options

## Usage

### Basic Comparison

```bash
npm run minimal-config-diff -- --from config-v1.json --to config-v2.json
```

### Markdown Output

```bash
npm run minimal-config-diff -- --from config-v1.json --to config-v2.json --format md
```

### Save to File

```bash
npm run minimal-config-diff -- --from config-v1.json --to config-v2.json --output diff-report
```

### Complete Example

```bash
npm run minimal-config-diff -- \
  --from exported-config-v1.json \
  --to exported-config-v2.json \
  --format md \
  --output config-changes-report.md
```

## Command Line Options

| Option | Required | Description | Default | Example |
|--------|----------|-------------|---------|---------|
| `--from <file>` | Yes | Path to first config JSON file | - | `config-v1.json` |
| `--to <file>` | Yes | Path to second config JSON file | - | `config-v2.json` |
| `--format <type>` | No | Output format: `json` or `md` | `json` | `md` |
| `--output <file>` | No | Output file path (without extension) | Console | `diff-report` |
| `--help` | No | Show help message | - | - |

## Configuration Sections

The tool analyzes differences across four main configuration sections:

### Resources Section
- **Residents**: Array of resident definitions with stats, levels, and attributes
- **Locations**: Array of location definitions with activities and requirements

### UI Section
- **Hero**: Hero section configuration (subtitle, description, theme)
- **HUD Fields**: Array of HUD field definitions (id, label, format)
- **Tokens**: UI styling tokens (colors, gradients, spacing)
- **Settings**: UI behavior settings (limits, panels, copy)

### Loop Section
- **Timings**: Game loop timing parameters (tick interval, autosave)
- **Multipliers**: Speed and performance multipliers

### Warnings Section
- **Thresholds**: Warning trigger thresholds (fatigue, food levels)
- **Copy**: Warning message text and labels

## Output Formats

### JSON Format

```json
{
  "summary": {
    "hasChanges": true,
    "sectionsChanged": ["resources", "ui"],
    "totalChanges": 5
  },
  "sections": {
    "resources": {
      "hasChanges": true,
      "changes": [
        {
          "path": "resources.residents",
          "type": "modified",
          "from": [...],
          "to": [...]
        }
      ],
      "changeCount": 1
    },
    "ui": { /* ... */ },
    "loop": { /* ... */ },
    "warnings": { /* ... */ }
  },
  "metadata": {
    "fromFile": "config-v1.json",
    "toFile": "config-v2.json",
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Markdown Format

```markdown
# Config Diff Report

**From:** `config-v1.json`
**To:** `config-v2.json`
**Generated:** 2024-01-15T10:30:00.000Z

## Summary

- **Changes Detected:** Yes
- **Sections Changed:** resources, ui
- **Total Changes:** 5

## Resources Section

**Changes:** 1

### resources.residents

**Type:** modified

**From:**
```json
[{"id": "resident-1", "level": 1}]
```

**To:**
```json
[{"id": "resident-1", "level": 2}]
```

## UI Section

**Changes:** 2

[Additional sections...]
```

## Change Types

### Modified
Indicates a value has changed between versions.

```json
{
  "path": "ui.logDisplayLimit",
  "type": "modified",
  "from": 5,
  "to": 10
}
```

### Added (Future)
Indicates a new configuration key has been added.

### Removed (Future)
Indicates a configuration key has been removed.

## Validation

### Schema Validation

Both input configuration files are validated against the MinimalConfigSchema:

```typescript
import { MinimalConfigSchema } from '@/balancing/config/idleVillage/minimalConfig';

const result = MinimalConfigSchema.safeParse(configData);
if (!result.success) {
  throw new Error(`Invalid config: ${result.error.message}`);
}
```

### File Validation

- Files must exist and be readable
- Content must be valid JSON
- Files must conform to the expected configuration structure

### Error Messages

- **Missing file**: `Required [section] file not found: /path/to/file`
- **Invalid JSON**: `Failed to load config from /path/to/file: Unexpected token`
- **Schema violation**: `Invalid config in /path/to/file: [validation error]`

## Integration Examples

### CI/CD Pipeline

```yaml
# .github/workflows/config-diff.yml
name: Config Diff Check
on: pull_request

jobs:
  config-diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with: node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Export configs
        run: |
          npm run export-config -- --output config-main.json
          # Checkout PR branch and export
          # Compare configs
      - name: Generate diff report
        run: |
          npm run minimal-config-diff -- \
            --from config-main.json \
            --to config-pr.json \
            --format md \
            --output config-diff-report.md
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: config-diff-report
          path: test-results/config-diff-report.md
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Export current config
npm run export-config -- --output .git/config-current.json

# Compare with last committed version
if [ -f ".git/config-last.json" ]; then
  npm run minimal-config-diff -- \
    --from .git/config-last.json \
    --to .git/config-current.json \
    --output .git/config-diff.md

  # Check if there are changes
  if grep -q "Changes Detected: Yes" .git/config-diff.md; then
    echo "⚠️  Config changes detected. Please review:"
    cat .git/config-diff.md
    echo "Press enter to continue or Ctrl+C to abort"
    read
  fi
fi

# Update last known config
cp .git/config-current.json .git/config-last.json
```

### Version Control Workflow

```bash
# After config changes
npm run export-config -- --output config-new.json
npm run minimal-config-diff -- \
  --from config-base.json \
  --to config-new.json \
  --format md \
  --output config-migration-guide.md

# Review and commit
git add config-migration-guide.md
git commit -m "Update config: [summary from diff report]"
```

## Best Practices

### File Organization

- Store exported configs in version control
- Use descriptive filenames: `config-v1.2.0.json`
- Keep diff reports in `test-results/` directory
- Archive important diff reports for reference

### Output Selection

- Use **JSON** for automated processing and API integration
- Use **Markdown** for human review and documentation
- Save outputs to files for sharing and archiving

### Error Handling

- Always check exit codes in scripts
- Log diff operations for debugging
- Validate config exports before comparison

## Troubleshooting

### Common Issues

#### "File not found" errors
**Solution**: Verify file paths and ensure export commands completed successfully

#### Schema validation failures
**Solution**: Check that config exports use the latest schema version

#### Empty diff reports
**Solution**: Confirm that configs are actually different (use `diff` command)

#### Memory issues with large configs
**Solution**: Ensure sufficient Node.js memory allocation

### Debug Mode

Enable verbose output by modifying the CLI:

```typescript
console.log('🔍 Comparing:', fromConfig, '→', toConfig);
console.log('📊 Diff result:', diffResult);
```

## API Reference

### `calculateConfigDiff(fromConfig, toConfig)`

Calculates differences between two configuration objects.

**Parameters:**
- `fromConfig`: First configuration object
- `toConfig`: Second configuration object

**Returns:** ConfigDiff object with summary and section details

### `generateMarkdownReport(diff)`

Generates Markdown report from diff data.

**Parameters:**
- `diff`: ConfigDiff object

**Returns:** Markdown string

## Related Documentation

- [Minimal Gameplay Config Schema](../../balancing/config/idleVillage/minimalConfig.ts)
- [Evidence Pipeline](../../docs/ops/minimal_evidence_pipeline.md)
- [Configuration Management](../../docs/minimal_config_management.md)

## Future Enhancements

### Planned Features

1. **Git Integration**: Automatic comparison with git history
2. **Interactive Mode**: Web-based diff viewer
3. **Change Impact Analysis**: Predict effects of config changes
4. **Bulk Comparison**: Compare multiple config versions
5. **Export Formats**: Support for CSV, HTML, and PDF outputs
