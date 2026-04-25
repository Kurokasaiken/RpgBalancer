# STS Combatant Preset Linter

## Overview

The STS Combatant Preset Linter is a CLI tool that validates STS combatant presets using config-first rules. It ensures data consistency, validates field requirements, checks value ranges, and verifies references to existing buffs and AI patterns.

## Features

- **Config-First Rules**: All validation rules defined in `DEFAULT_STS_PRESET_LINT_CONFIG`
- **Multiple Output Formats**: Console, JSON, and Markdown output
- **Flexible Filtering**: Lint specific presets or entire directories
- **Telemetry Integration**: Emits `sts_preset_lint_failed` events on failures
- **UI Integration**: Hook integration for real-time linting feedback

## Installation

The linter is included in the project. No additional installation required.

## Usage

### Basic Usage

```bash
# Lint all presets in data/presets/sts
npx tsx scripts/sts/combatantPresetLint.ts

# Lint specific preset
npx tsx scripts/sts/combatantPresetLint.ts --preset starter-defect

# Output in JSON format
npx tsx scripts/sts/combatantPresetLint.ts --format json

# Output in Markdown format
npx tsx scripts/sts/combatantPresetLint.ts --format markdown

# Save report to file
npx tsx scripts/sts/combatantPresetLint.ts --output lint-report.md

# Fail on warnings (exit code 1)
npx tsx scripts/sts/combatantPresetLint.ts --fail-on-warning
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --format <format>` | Output format (console|json|markdown) | console |
| `-p, --preset <id>` | Specific preset to lint | all presets |
| `--fail-on-warning` | Exit with code 1 on warnings | false |
| `-o, --output <path>` | Save report to file | stdout |

## Validation Rules

### 1. Required Fields (`required-fields`)

**Severity**: Error

Validates that all required fields are present in the preset:

- **Top-level fields**: `id`, `name`, `description`, `tags`, `difficulty`
- **Enemy fields**: `id`, `name`, `type`, `maxHp`, `damage`, `intents`, `modifiers`, `ai`
- **Deck fields**: `deckId`, `deckName`, `cards`, `ascension`, `seed`
- **Relics fields**: `relics`, `startingRelics`, `relicPool`

**Example Error**:
```
❌ starter-defect: Missing required field: enemy.maxHp
```

### 2. Value Ranges (`value-ranges`)

**Severity**: Error/Warning

Validates that numeric values are within acceptable ranges:

- **Enemy HP**: Must be positive (1-999)
- **Damage values**: Must be reasonable (0-200)
- **Card costs**: Must be non-negative (0-10)
- **Intent priorities**: Must be valid (1-10)

**Example Errors**:
```
❌ starter-defect: Enemy HP (-1) must be positive
⚠️  starter-defect: Damage base (999) seems excessive
```

### 3. AI Patterns (`ai-patterns`)

**Severity**: Error/Warning

Validates AI configuration:

- **Pattern types**: Must be valid (`aggressive`, `defensive`, `balanced`, `random`, `adaptive`)
- **Weight distribution**: Weights should sum to 1.0 (±0.1 tolerance)
- **Difficulty levels**: Must be valid (1-5)

**Example Errors**:
```
❌ starter-defect: Invalid AI pattern: invalid-pattern
⚠️  starter-defect: AI weights (attack: 0.8, defend: 0.5) should sum to 1.0
```

### 4. Buff References (`buff-references`)

**Severity**: Error

Validates that all buff references exist in the buff library:

- **Intent actions**: Buff names must be defined in buff library
- **Relic effects**: Buff references must be valid
- **Card effects**: Buff references must be valid

**Example Error**:
```
❌ starter-defect: Unknown buff reference: non-existent-buff
```

## Output Formats

### Console Output

```
STS Combatant Preset Linter
===========================

Linting 3 presets...

✅ starter-defect - No issues found
⚠️  starter-ironclad - 1 warning
❌ starter-silent - 2 errors

Summary:
- Total presets: 3
- Errors: 2
- Warnings: 1
- Duration: 45ms
```

### JSON Output

```json
{
  "summary": {
    "totalPresets": 3,
    "errors": 2,
    "warnings": 1,
    "durationMs": 45
  },
  "results": [
    {
      "ruleId": "required-fields",
      "severity": "error",
      "presetId": "starter-silent",
      "message": "Missing required field: enemy.maxHp",
      "details": {
        "field": "enemy.maxHp",
        "expected": "number > 0"
      }
    }
  ]
}
```

### Markdown Output

```markdown
# STS Combatant Preset Lint Report

## Summary

- **Total presets**: 3
- **Errors**: 2
- **Warnings**: 1
- **Duration**: 45ms

## Issues

### starter-silent ❌

| Rule | Severity | Message |
|------|----------|---------|
| required-fields | error | Missing required field: enemy.maxHp |
| value-ranges | warning | Damage base (999) seems excessive |

### starter-ironclad ⚠️

| Rule | Severity | Message |
|------|----------|---------|
| ai-patterns | warning | AI weights should sum to 1.0 |

### starter-defect ✅

No issues found.
```

## Configuration

### Lint Configuration

The lint rules are defined in `DEFAULT_STS_PRESET_LINT_CONFIG`:

```typescript
export const DEFAULT_STS_PRESET_LINT_CONFIG: STSPresetLintConfig = {
  rules: [
    {
      id: 'required-fields',
      name: 'Required Fields',
      description: 'Validates presence of required fields',
      severity: 'error',
      validate: validateRequiredFields
    },
    // ... other rules
  ],
  enabled: true,
  failOnWarning: false
};
```

### Adding New Rules

To add a new validation rule:

1. Create validation function:
```typescript
export function validateCustomRule(
  preset: STSCombatantPreset,
  config: STSCombatantsConfig
): LintResultItem[] {
  const results: LintResultItem[] = [];
  
  // Validation logic here
  
  return results;
}
```

2. Add to config:
```typescript
{
  id: 'custom-rule',
  name: 'Custom Rule',
  description: 'Custom validation logic',
  severity: 'warning',
  validate: validateCustomRule
}
```

## UI Integration

### Hook Usage

The `useSTSCombatantsConfig` hook provides lint integration:

```typescript
import { useSTSCombatantsConfig } from '@/ui/tools/sts/hooks/useSTSCombatantsConfig';

const { config, validation, lintPreset } = useSTSCombatantsConfig();

// Lint current preset
const lintResults = lintPreset(config.presets[0]);

// Check for errors
const hasErrors = validation.errors.length > 0;
```

### Persistence

Lint results are saved via PersistenceService:

```typescript
// Save lint state
await saveData('sts-preset-lint-state', {
  lastLinted: new Date().toISOString(),
  results: lintResults
});

// Load lint state
const lintState = await loadData('sts-preset-lint-state');
```

## Telemetry

The linter emits telemetry events on failures:

```typescript
// On lint failure
trackSTSTelemetry('sts_preset_lint_failed', {
  presetId: 'starter-defect',
  errorCount: 2,
  warningCount: 1,
  rules: ['required-fields', 'value-ranges'],
  duration: 45
});
```

## Pre-commit Integration

Add to `package.json` for pre-commit linting:

```json
{
  "scripts": {
    "precommit": "npx tsx scripts/sts/combatantPresetLint.ts --fail-on-warning"
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Lint STS Presets
  run: |
    npx tsx scripts/sts/combatantPresetLint.ts \
      --format json \
      --output lint-report.json \
      --fail-on-warning
    
    # Upload lint report
    upload-artifact lint-report.json
```

### Jenkins Pipeline

```groovy
stage('Lint STS Presets') {
    steps {
        sh 'npx tsx scripts/sts/combatantPresetLint.ts --fail-on-warning'
        archiveArtifacts artifacts: 'lint-report.*', fingerprint: true
    }
}
```

## Troubleshooting

### Common Issues

1. **JSON Parse Errors**: Preset files with control characters
   - Fix: Remove or escape control characters
   - Use `--preset` to lint specific files

2. **Missing Buff References**: Buffs not defined in library
   - Fix: Add buff definitions to buff library
   - Check for typos in buff names

3. **Invalid AI Patterns**: Unsupported AI pattern types
   - Fix: Use valid pattern types
   - Update AI pattern validation if needed

### Debug Mode

Enable verbose output for debugging:

```bash
# Verbose console output
DEBUG=sts:* npx tsx scripts/sts/combatantPresetLint.ts

# Debug specific preset
npx tsx scripts/sts/combatantPresetLint.ts --preset starter-defect --format console
```

## Performance

### Benchmarks

- **Single preset**: ~5ms
- **10 presets**: ~15ms
- **100 presets**: ~100ms
- **Memory usage**: <10MB for typical usage

### Optimization Tips

1. Use `--preset` for single preset validation
2. Cache lint results for unchanged presets
3. Run in parallel for large preset collections

## Contributing

### Adding Rules

1. Implement validation function
2. Add comprehensive tests
3. Update documentation
4. Add telemetry events if needed

### Testing

```bash
# Run lint tests
npm run test -- tests/unit/sts/CombatantPresetLint.test.ts

# Test CLI manually
npx tsx scripts/sts/combatantPresetLint.ts --help
```

## Version History

- **v1.0.0** (2026-01-19): Initial implementation
  - Basic validation rules
  - CLI with multiple output formats
  - UI integration hooks
  - Telemetry support

## License

This tool is part of the RPG Balancer project and follows the same license terms.
