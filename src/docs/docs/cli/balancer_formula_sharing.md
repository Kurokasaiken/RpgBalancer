# Balancer Formula Sharing CLI - NP-037

## Overview

The Balancer Formula Sharing CLI provides a comprehensive command-line interface for exporting and importing balancer configurations, including formulas, cards, and presets. This tool enables teams to share, backup, and manage balancer configurations with validation and documentation generation.

## Features

### Export Capabilities
- **Multiple Scopes**: Export formulas, cards, presets, or full configuration
- **Multiple Formats**: JSON, Markdown, YAML (JSON and Markdown implemented)
- **Validation**: Automatic formula validation during export
- **Metadata**: Rich metadata including author, timestamps, and checksums
- **Documentation**: Auto-generated Markdown documentation for exports

### Import Capabilities
- **Validation**: Comprehensive import validation with conflict detection
- **Backup**: Automatic backup creation before importing
- **Dry Run**: Preview import changes without applying them
- **Conflict Resolution**: Options for handling existing configurations
- **Formula Validation**: Optional formula validation during import

### Management Features
- **List**: Browse available exports and imports
- **Validate**: Verify export file integrity without importing
- **Info**: Detailed information about export files
- **Telemetry**: Operation tracking and analytics

## Installation

The CLI is included in the RPG Balancer project. No additional installation required.

```bash
# Ensure Node.js 20+ is active
source ~/.nvm/nvm.sh && nvm use

# Make CLI executable (optional)
chmod +x scripts/balancing/formulaSharingCLI.ts
```

## Usage

### Basic Commands

#### Export Configuration

```bash
# Export full configuration in JSON format
tsx scripts/balancing/formulaSharingCLI.ts export

# Export only formulas
tsx scripts/balancing/formulaSharingCLI.ts export --scope formulas

# Export in Markdown format
tsx scripts/balancing/formulaSharingCLI.ts export --format markdown

# Specify output file and author
tsx scripts/balancing/formulaSharingCLI.ts export \
  --output my-config.json \
  --author "John Doe"
```

#### Import Configuration

```bash
# Import from file (dry run by default)
tsx scripts/balancing/formulaSharingCLI.ts import my-config.json

# Import with overwrite
tsx scripts/balancing/formulaSharingCLI.ts import my-config.json --overwrite

# Skip built-in presets
tsx scripts/balancing/formulaSharingCLI.ts import my-config.json --skip-built-in

# Create backup before import
tsx scripts/balancing/formulaSharingCLI.ts import my-config.json --backup
```

#### Validation and Information

```bash
# Validate export file
tsx scripts/balancing/formulaSharingCLI.ts validate my-config.json

# Show file information
tsx scripts/balancing/formulaSharingCLI.ts info my-config.json

# List available exports
tsx scripts/balancing/formulaSharingCLI.ts list --type exports
```

### Advanced Usage

#### Export Scenarios

```bash
# Export formulas for team sharing
tsx scripts/balancing/formulaSharingCLI.ts export \
  --scope formulas \
  --format markdown \
  --author "Balance Team" \
  --output team-formulas.md

# Export full configuration for backup
tsx scripts/balancing/formulaSharingCLI.ts export \
  --scope full \
  --format json \
  --author "System Backup" \
  --output backup-$(date +%Y%m%d).json

# Export cards for design review
tsx scripts/balancing/formulaSharingCLI.ts export \
  --scope cards \
  --format markdown \
  --author "Design Team" \
  --output card-review.md
```

#### Import Scenarios

```bash
# Preview import changes
tsx scripts/balancing/formulaSharingCLI.ts import new-config.json --dry-run

# Import with full validation
tsx scripts/balancing/formulaSharingCLI.ts import new-config.json \
  --validate \
  --backup \
  --overwrite

# Import only custom presets (skip built-in)
tsx scripts/balancing/formulaSharingCLI.ts import presets.json \
  --skip-built-in \
  --dry-run
```

## Command Reference

### Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `-v, --verbose` | Enable verbose logging | false |
| `-d, --dry-run` | Perform operations without changes | false |
| `--output-dir <dir>` | Output directory for exports | `./data/exports/balancer/formulas` |
| `--backup-dir <dir>` | Backup directory for imports | `./data/exports/balancer/backups` |

### Export Command

```bash
tsx scripts/balancing/formulaSharingCLI.ts export [options]
```

#### Options

| Option | Description | Values | Default |
|--------|-------------|--------|---------|
| `-s, --scope <scope>` | Export scope | `formulas`, `cards`, `presets`, `full` | `full` |
| `-f, --format <format>` | Export format | `json`, `markdown`, `yaml` | `json` |
| `-o, --output <file>` | Output filename | auto-generated | |
| `--no-metadata` | Exclude metadata from export | | false |
| `--author <name>` | Author for export metadata | env.USER | |

#### Examples

```bash
# Export all formulas in JSON
tsx scripts/balancing/formulaSharingCLI.ts export --scope formulas --format json

# Export cards in Markdown with custom author
tsx scripts/balancing/formulaSharingCLI.ts export --scope cards --format markdown --author "Alice"

# Export full config to specific file
tsx scripts/balancing/formulaSharingCLI.ts export --output my-balance.json
```

### Import Command

```bash
tsx scripts/balancing/formulaSharingCLI.ts import <file> [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--overwrite` | Overwrite existing configurations | false |
| `--skip-built-in` | Skip built-in presets | false |
| `--no-validate` | Skip formula validation | false |
| `--no-backup` | Skip creating backup | false |
| `--dry-run` | Validate without applying | false |

#### Examples

```bash
# Import with validation and backup
tsx scripts/balancing/formulaSharingCLI.ts import config.json --validate --backup

# Import and overwrite existing
tsx scripts/balancing/formulaSharingCLI.ts import config.json --overwrite

# Dry run to preview changes
tsx scripts/balancing/formulaSharingCLI.ts import config.json --dry-run
```

### Validate Command

```bash
tsx scripts/balancing/formulaSharingCLI.ts validate <file>
```

Validates an export file without importing it.

#### Examples

```bash
# Validate export file
tsx scripts/balancing/formulaSharingCLI.ts validate my-config.json

# Validate with verbose output
tsx scripts/balancing/formulaSharingCLI.ts validate my-config.json --verbose
```

### List Command

```bash
tsx scripts/balancing/formulaSharingCLI.ts list [options]
```

#### Options

| Option | Description | Values | Default |
|--------|-------------|--------|---------|
| `--type <type>` | Filter by type | `exports`, `imports` | `exports` |

#### Examples

```bash
# List all exports
tsx scripts/balancing/formulaSharingCLI.ts list --type exports

# List all imports
tsx scripts/balancing/formulaSharingCLI.ts list --type imports
```

### Info Command

```bash
tsx scripts/balancing/formulaSharingCLI.ts info <file>
```

Shows detailed information about an export file.

#### Examples

```bash
# Show file information
tsx scripts/balancing/formulaSharingCLI.ts info my-config.json

# Show information with verbose output
tsx scripts/balancing/formulaSharingCLI.ts info my-config.json --verbose
```

## Export Formats

### JSON Format

The JSON format provides complete data structure preservation and is ideal for programmatic use.

```json
{
  "version": "1.1.0",
  "exportedAt": "2023-01-19T10:30:00.000Z",
  "exportedBy": "John Doe",
  "scope": "full",
  "format": "json",
  "checksum": "a1b2c3d4e5f6...",
  "metadata": {
    "totalFormulas": 5,
    "totalCards": 8,
    "totalPresets": 3,
    "balancerVersion": "1.1.0"
  },
  "formulas": [...],
  "cards": [...],
  "presets": [...]
}
```

### Markdown Format

The Markdown format provides human-readable documentation suitable for reviews and sharing.

```markdown
# Balancer Formula Export

**Version:** 1.1.0
**Exported:** 1/19/2023, 10:30:00 AM
**By:** John Doe
**Scope:** full

## Metadata

| Metric | Count |
|--------|-------|
| Formulas | 5 |
| Cards | 8 |
| Presets | 3 |
| Balancer Version | 1.1.0 |

## Formulas

### Derived Stat
**ID:** `derived_stat`
**Formula:** `hp * 0.5 + damage * 0.3`
**Valid:** ✅
**Derived:** Yes
**Weight:** 0.5
```

## Data Structures

### Formula Export Entry

```typescript
interface FormulaExportEntry {
  statId: string;
  statName: string;
  formula: string;
  validation: FormulaValidationResult;
  metadata: {
    isDerived: boolean;
    isCore: boolean;
    weight: number;
    description?: string;
  };
}
```

### Card Export Entry

```typescript
interface CardExportEntry {
  cardId: string;
  title: string;
  color: string;
  icon?: string;
  statIds: string[];
  isCore: boolean;
  order: number;
  metadata: {
    isLocked?: boolean;
    isHidden?: boolean;
  };
}
```

### Preset Export Entry

```typescript
interface PresetExportEntry {
  presetId: string;
  name: string;
  description: string;
  weights: Record<string, number>;
  isBuiltIn: boolean;
  metadata: {
    createdAt: string;
    modifiedAt: string;
    targetTurns?: Record<string, number>;
  };
}
```

## Validation

### Export Validation

The CLI automatically validates exports during the export process:

- **Formula Validation**: Checks formula syntax and dependencies
- **Schema Validation**: Ensures data structure compliance
- **Checksum Generation**: Creates integrity checksums
- **Version Compatibility**: Validates balancer version compatibility

### Import Validation

Import validation includes comprehensive checks:

- **Package Structure**: Validates export package format
- **Version Compatibility**: Checks balancer version compatibility
- **Formula Validation**: Optional formula syntax validation
- **Conflict Detection**: Identifies existing configuration conflicts
- **Dependency Validation**: Ensures all referenced stats exist
- **Data Integrity**: Validates data types and ranges

### Validation Results

```bash
📊 Import Validation Results:
Valid: ✅

📈 Summary:
  Formulas to import: 3
  Cards to import: 2
  Presets to import: 1
  Conflicts: 1

⚠️  Warnings:
  - Formula warnings for derived_stat: Division by zero risk
  - Skipping built-in preset balanced
```

## Workflows

### Team Sharing Workflow

1. **Export Configuration**
   ```bash
   tsx scripts/balancing/formulaSharingCLI.ts export \
     --scope formulas \
     --format markdown \
     --author "Balance Team" \
     --output shared-formulas.md
   ```

2. **Review Documentation**
   - Open `shared-formulas.md` in editor
   - Review formulas and validation results
   - Add comments or annotations

3. **Import Changes**
   ```bash
   tsx scripts/balancing/formulaSharingCLI.ts import updated-config.json \
     --validate \
     --backup \
     --dry-run
   ```

4. **Apply Changes**
   ```bash
   tsx scripts/balancing/formulaSharingCLI.ts import updated-config.json \
     --validate \
     --backup
   ```

### Backup Workflow

1. **Create Backup**
   ```bash
   tsx scripts/balancing/formulaSharingCLI.ts export \
     --scope full \
     --format json \
     --author "System Backup" \
     --output "backup-$(date +%Y%m%d-%H%M%S).json"
   ```

2. **List Backups**
   ```bash
   tsx scripts/balancing/formulaSharingCLI.ts list --type exports
   ```

3. **Restore from Backup**
   ```bash
   tsx scripts/balancing/formulaSharingCLI.ts import backup-20230119-103000.json \
     --overwrite \
     --backup
   ```

### Environment Setup Workflow

1. **Export Base Configuration**
   ```bash
   tsx scripts/balancing/formulaSharingCLI.ts export \
     --scope full \
     --format json \
     --author "Environment Setup" \
     --output base-config.json
   ```

2. **Customize for Environment**
   - Edit `base-config.json` as needed
   - Validate changes
   ```bash
   tsx scripts/balancing/formulaSharingCLI.ts validate base-config.json
   ```

3. **Import to Environment**
   ```bash
   tsx scripts/balancing/formulaSharingCLI.ts import base-config.json \
     --overwrite \
     --backup
   ```

## Telemetry

The CLI automatically emits telemetry events for tracking:

### Export Events

```typescript
{
  event: "balancer_formula_exported",
  timestamp: "2023-01-19T10:30:00.000Z",
  data: {
    scope: "formulas",
    format: "json",
    filename: "export-20230119-103000.json",
    totalFormulas: 5,
    totalCards: 0,
    totalPresets: 0
  }
}
```

### Import Events

```typescript
{
  event: "balancer_formula_imported",
  timestamp: "2023-01-19T10:35:00.000Z",
  data: {
    sourceFile: "import-config.json",
    formulasImported: 3,
    cardsImported: 2,
    presetsImported: 1,
    conflicts: 1
  }
}
```

## Error Handling

### Common Errors

#### Export Errors

```bash
# Invalid scope
Error: Invalid scope: invalid
Solution: Use one of: formulas, cards, presets, full

# Invalid format
Error: Invalid format: invalid
Solution: Use one of: json, markdown, yaml

# Missing configuration
Error: Failed to load balancer configuration
Solution: Ensure BalancerConfigStore has valid configuration
```

#### Import Errors

```bash
# Invalid file format
Error: Unsupported file extension: .txt
Solution: Use .json, .md, or .yaml files

# Validation errors
Error: Import failed due to validation errors
Solution: Review validation errors and fix issues

# Conflicts without overwrite
Error: Stat hp already exists
Solution: Use --overwrite flag or resolve conflicts manually
```

### Recovery Strategies

1. **Use Dry Run**: Always test imports with `--dry-run` first
2. **Create Backups**: Use `--backup` before importing
3. **Validate First**: Use `validate` command to check files
4. **Verbose Mode**: Use `--verbose` for detailed error information

## Best Practices

### Export Best Practices

1. **Use Descriptive Names**: Include date and purpose in filenames
2. **Choose Appropriate Format**: JSON for automation, Markdown for reviews
3. **Include Author Information**: Always specify `--author`
4. **Validate Exports**: Use `validate` command after export
5. **Document Changes**: Add comments to Markdown exports

### Import Best Practices

1. **Always Dry Run**: Preview changes before applying
2. **Create Backups**: Use `--backup` for safety
3. **Validate Thoroughly**: Use `--validate` for formula checking
4. **Review Conflicts**: Check conflict reports carefully
5. **Test Incrementally**: Import smaller changes first

### File Management

1. **Organize by Date**: Use date-based naming conventions
2. **Separate Environments**: Different folders for dev/staging/prod
3. **Version Control**: Track important configurations in version control
4. **Regular Backups**: Schedule regular export backups
5. **Cleanup Old Files**: Remove outdated exports periodically

## Integration Examples

### CI/CD Integration

```bash
#!/bin/bash
# Export configuration as part of build process
echo "Exporting balancer configuration..."
tsx scripts/balancing/formulaSharingCLI.ts export \
  --scope full \
  --format json \
  --author "CI/CD Pipeline" \
  --output "build/balancer-config.json"

# Validate configuration
tsx scripts/balancing/formulaSharingCLI.ts validate "build/balancer-config.json"
```

### Git Hooks

```bash
#!/bin/bash
# Pre-commit hook to validate balancer changes
echo "Validating balancer configuration..."
tsx scripts/balancing/formulaSharingCLI.ts export \
  --scope formulas \
  --format json \
  --author "Pre-commit Hook" \
  --output ".git/hooks/temp-export.json"

tsx scripts/balancing/formulaSharingCLI.ts validate ".git/hooks/temp-export.json"
rm ".git/hooks/temp-export.json"
```

### Automation Scripts

```typescript
// Automated backup script
import { execSync } from 'child_process';

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.json`;
  
  execSync(`tsx scripts/balancing/formulaSharingCLI.ts export \
    --scope full \
    --format json \
    --author "Automated Backup" \
    --output "backups/${filename}"`, 
    { stdio: 'inherit' }
  );
  
  console.log(`Backup created: ${filename}`);
}

// Run daily backup
createBackup();
```

## Troubleshooting

### Performance Issues

1. **Large Exports**: Use `--scope` to limit export size
2. **Slow Validation**: Use `--no-validate` for faster imports
3. **Memory Usage**: Process large files in chunks

### File Issues

1. **Permission Errors**: Check file/directory permissions
2. **Disk Space**: Monitor available disk space for large exports
3. **Network Issues**: Use local files for better reliability

### Configuration Issues

1. **Missing Dependencies**: Ensure all required stats exist
2. **Version Mismatches**: Check balancer version compatibility
3. **Circular Dependencies**: Review formula dependencies

## Future Enhancements

### Planned Features

1. **YAML Support**: Complete YAML format implementation
2. **Batch Operations**: Process multiple files at once
3. **Web Interface**: Browser-based management tool
4. **API Integration**: REST API for remote operations
5. **Advanced Validation**: Custom validation rules
6. **Template System**: Export/import templates
7. **Diff Tools**: Visual configuration differences
8. **Merge Tools**: Intelligent conflict resolution

### Extension Points

1. **Custom Formats**: Plugin system for new export formats
2. **Validation Rules**: Custom validation rule definitions
3. **Telemetry Hooks**: Custom telemetry event handlers
4. **File Processors**: Custom file processing logic
5. **UI Components**: Reusable UI components for integration

## Support

For issues, questions, or contributions:

1. **Documentation**: Check this guide and code comments
2. **Examples**: Review the test files for usage patterns
3. **Issues**: Report bugs in the project issue tracker
4. **Contributions**: Follow the project contribution guidelines

## License

This CLI is part of the RPG Balancer project and follows the same license terms.
