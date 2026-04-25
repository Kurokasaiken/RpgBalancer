# Task Intake Validation Documentation

## Overview

The Task Intake Validator provides comprehensive validation for `strategy_tasks.md` entries, ensuring tasks have proper prompts and KPI definitions to maintain Kanban consistency. It detects missing information, validates formats, and generates detailed reports for maintaining task quality standards.

## Features

### 🔍 Validation Rules
- **Task ID Validation**: Checks for standard ID formats (NP-XXX, KS-XXX, PC-MX, etc.)
- **Title Requirements**: Enforces minimum and maximum title length constraints
- **Source Validation**: Ensures source documents follow expected patterns
- **Impact Specification**: Verifies impact areas are specified
- **Status Validation**: Validates against allowed status values
- **Prompt Detection**: Identifies tasks with prompt instructions (configurable)
- **KPI Detection**: Identifies tasks with KPI definitions (configurable)
- **Duplicate Detection**: Flags duplicate task IDs

### 📊 Metrics Collection
- **Task Statistics**: Total tasks, completed tasks, pending tasks
- **Issue Tracking**: Issues by type and severity
- **Coverage Analysis**: Prompt and KPI coverage percentages
- **Duplicate Detection**: Count of duplicate task IDs
- **Performance Metrics**: Validation duration and processing speed

### 📝 Report Generation
- **Markdown Reports**: Human-readable formatted reports with detailed issue breakdowns
- **JSON Reports**: Machine-readable reports for automation
- **Statistics Summary**: Quick overview of validation results
- **Issue Categorization**: Issues grouped by type and severity

## Architecture

### Core Components

#### TaskIntakeValidator
Main validation class that orchestrates parsing, validation, and reporting.

```typescript
import { TaskIntakeValidator } from '@/scripts/coordinator/taskIntakeValidator';

const validator = new TaskIntakeValidator({
  requirePrompt: true,
  requireKpi: true,
  minTitleLength: 10,
  maxTitleLength: 200,
});

const result = await validator.validateFile('src/docs/docs/coordinator/strategy_tasks.md');
```

#### Schema Definitions
Comprehensive Zod schemas for type safety and validation:

```typescript
// Task entry structure
export interface TaskEntry {
  taskId: string;
  title: string;
  source: string;
  impact: string;
  status: TaskStatus;
  priority: string;
  notes: string;
}

// Validation issue structure
export interface ValidationIssue {
  type: ValidationIssueType;
  severity: ValidationIssueSeverity;
  taskId: string;
  description: string;
  lineNumber: number;
  rawLine: string;
  suggestion?: string;
  autoFixable: boolean;
}
```

### Integration Points

#### Strategy Tasks Format
The validator is designed to work with the existing `strategy_tasks.md` format:

```markdown
|Task ID|Descrizione / Link piano|Origine (Strategia)|File / Aree impattate|Stato|Priorità / KPI|Note coordinator|
|-------|------------------------|-------------------|----------------------|-----|--------------|----------------|
|NP-040|Task Intake Validator|strategy_tasks.md|scripts/coordinator|pending|KPI: validation complete|Test task|
```

#### Kanban Integration
Validates tasks against Kanban requirements:
- Ensures tasks have proper prompts before assignment
- Validates KPI definitions for measurable tasks
- Maintains consistency with existing Kanban lint rules

## Configuration

### Default Configuration
```typescript
const DEFAULT_CONFIG = {
  requirePrompt: true,           // Require prompt instructions
  requireKpi: true,            // Require KPI definitions
  kpiExemptions: ['✅', '❌'], // Status exempt from KPI
  minTitleLength: 10,           // Minimum title length
  maxTitleLength: 200,          // Maximum title length
  requiredSourcePatterns: [        // Required source patterns
    '.md',
    'strategy/',
    'docs/',
  ],
  enableAutoFix: false,          // Auto-fix simple issues
  strictMode: false,           // Strict validation mode
};
```

### Custom Configuration
```typescript
const validator = new TaskIntakeValidator({
  requirePrompt: false,          // Don't require prompts
  requireKpi: false,            // Don't require KPI
  minTitleLength: 5,            // Shorter minimum length
  maxTitleLength: 100,           // Shorter maximum length
  kpiExemptions: ['✅', '❌', 'Completato'], // More status exemptions
});
```

## Usage

### Basic Validation
```typescript
import { TaskIntakeValidator } from '@/scripts/coordinator/taskIntakeValidator';

// Validate strategy_tasks.md
const validator = new TaskIntakeValidator();
const result = await validator.validateFile();

console.log(`Validation ${result.passed ? 'PASSED' : 'FAILED'}`);
console.log(`Tasks: ${result.totalTasks}, Issues: ${result.issues.length}`);
```

### CLI Usage

#### Basic Validation
```bash
# Validate strategy_tasks.md
npx tsx scripts/coordinator/taskIntakeValidatorCLI.ts validate

# Custom configuration
npx tsx scripts/coordinator/taskIntakeValidatorCLI.ts validate \
  --require-prompt \
  --require-kpi \
  --strict
```

#### Statistics
```bash
# Show validation statistics
npx tsx scripts/coordinator/taskIntakeValidatorCLI.ts statistics

# Check specific task text
npx tsx scripts/coordinator/taskIntakeValidatorCLI.ts check-rule \
  "Task with prompt instructions" --prompt
```

#### Report Generation
```bash
# Generate both JSON and markdown reports
npx tsx scripts/coordinator/intakeValidatorCLI.ts validate \
  --format both \
  --output test-results

# JSON only
npx tsx scripts/coordinator/intakeValidatorCLI.ts validate \
  --format json \
  --output test-results
```

### React Integration
```typescript
import { useState, useEffect } from 'react';
import { TaskIntakeValidator } from '@/scripts/coordinator/taskIntakeValidator';

export function useTaskValidation() {
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateTasks = async () => {
    setIsValidating(true);
    try {
      const validator = new TaskIntakeValidator();
      const result = await validator.validateFile();
      setValidationResult(result);
    } finally {
      setIsValidating(false);
    }
  };

  return { validationResult, isValidating, validateTasks };
}
```

## Validation Rules

### Task ID Formats
The validator recognizes these task ID patterns:

- **NP-XXX**: New prompts (e.g., NP-040, NP-041)
- **KS-XXX**: Knowledge System tasks (e.g., KS-081, KS-082)
- **PC-MX**: Punch Club tasks (e.g., PC-M1, PC-M2)
- **GT-X**: Goal/Target tasks (e.g., GT-1, GT-2)
- **IV-PSX**: Idle Village Phase tasks (e.g., IV-PS0, IV-PS1)
- **AM-X**: Archmage tasks (e.g., AM-1, AM-2)
- **E2E-VRT-X**: E2E testing tasks (e.g., E2E-VRT-001)
- **WS6.3-X**: Workstream tasks (e.g., WS6.3-S1, WS6.3-2)

### Status Values
Valid status values:
- `pending`
- `In corso`
- `Completato`
- `Non assegnato`
- `✅` (completion indicator)
- `❌` (failure indicator)

### KPI Detection Patterns
The validator identifies KPI definitions using these patterns:
- `KPI:` or `kpi:`
- `metric` or `threshold`
- `target` or `≤` or `>=`
- `% complete` or `success rate`
- `latency <` or `tempo <`
- `< Xms` or `< Xsecond`

### Prompt Detection Patterns
The validator identifies prompt instructions using these patterns:
- `prompt` or `istruzioni`
- `obiettivo` or `richiesta`
- `deliverable` or `requirements`
- `specifiche` or `specificare`

### Source Validation
Required source patterns:
- `.md` - Markdown documents
- `strategy/` - Strategy documents
- `docs/` - Documentation files

## Issue Types

### Critical Issues
- **file_error**: File not found or unreadable
- **data_corruption**: Invalid file structure or parsing errors

### High Issues
- **missing_task_id**: Invalid task ID format
- **missing_title**: Title too short or missing
- **missing_prompt**: Missing prompt instructions (when required)
- **missing_kpi**: Missing KPI definition (when required)

### Medium Issues
- **missing_source**: Invalid source format
- **missing_impact**: Missing impact specification
- **invalid_status**: Invalid status value

### Low Issues
- **duplicate_task_id**: Duplicate task ID detected
- **malformed_kpi**: Malformed KPI definition
- **inconsistent_format**: Minor formatting issues

## Reports

### Markdown Report Structure
```markdown
# Task Intake Validation Report

**Generated:** 2026-01-19T22:30:00.000Z  
**File:** src/docs/docs/coordinator/strategy_tasks.md  
**Duration:** 45ms  
**Status:** ✅ PASSED  

## Summary

- **Total Tasks:** 25
- **Tasks with Issues:** 3
- **Critical Issues:** 0
- **High Issues:** 2
- **Medium Issues:** 1
- **Low Issues:** 0

### Task Statistics

| Metric | Count |
|--------|-------|
| Tasks with Prompts: 22/25 (88.0%) |
| Tasks with KPI: 23/25 (92.0%) |
| Completed Tasks: 5/25 (20.0%) |
| Pending Tasks: 18/25 (72.0%) |
| Duplicate IDs: 0 |

## Issues

### HIGH (2)
- **missing_prompt**: Task WS6.3-S2 (Line 6)
  - **Description:** Missing prompt instructions in task description
  - **Suggestion:** Add prompt/mandate/objective in title or notes
- **missing_kpi**: Task GT-1 (Line 7)
  - **Description:** Missing KPI definition
  - **Suggestion:** Add KPI/metric/threshold in priority or notes

### MEDIUM (1)
- **missing_source**: Task AM-1 (Line 21)
  - **Description**: Missing source document
  - **Suggestion:** Specify source strategy document

## Issues by Type

### missing_prompt (1)
- **WS6.3-S2**: Missing prompt instructions in task description

### missing_kpi (1)
- **GT-1**: Missing KPI definition

### missing_source (1)
- **AM-1**: Missing source document
```

## CLI Reference

### Commands

#### `validate`
Validate strategy_tasks.md file.

```bash
npx tsx scripts/coordinator/taskIntakeValidatorCLI.ts validate [options]
```

**Options:**
- `-f, --file <path>`: Strategy tasks file path (default: src/docs/docs/coordinator/strategy_tasks.md)
- `-o, --output <path>`: Output directory (default: test-results)
- `--format <format>`: Output format - json|markdown|both (default: both)
- `--require-prompt`: Require prompt instructions (default: true)
- `--require-kpi`: Require KPI definitions (default: true)
- `--strict`: Enable strict validation mode (default: false)
- `--auto-fix`: Enable auto-fix for simple issues (default: false)
- `-q, --quiet`: Suppress console output

#### `statistics`
Show validation statistics for strategy_tasks.md.

```bash
npx tsx scripts/coordinator/taskIntakeValidatorCLI.ts statistics [options]
```

**Options:**
- `-f, --file <path>`: Strategy tasks file path (default: src/docs/docs/coordinator/strategy_tasks.md)
- `--require-prompt`: Require prompt instructions (default: true)
- `--require-kpi`: Require KPI definitions (default: true)

#### `check-rule`
Check if specific text has prompt or KPI.

```bash
npx tsx scripts/coordinator/taskIntakeValidatorCLI.ts check-rule "Task text" --prompt --kpi
```

**Options:**
- `--prompt`: Check for prompt instructions
- `--kpi`: Check for KPI definitions

### Exit Codes
- `0`: Validation passed (no critical issues)
- `1`: Validation failed (critical issues found)

## Testing

### Unit Tests
```bash
# Run all tests
npm run test -- tests/unit/coordinator/TaskIntakeValidator.test.ts

# Run with coverage
npm run test -- tests/unit/coordinator/TaskIntakeValidator.test.ts --coverage
```

### Test Coverage
- ✅ Schema validation functions
- ✅ Table row parsing
- ✅ Task validation logic
- ✅ CLI functionality
- ✅ Report generation
- ✅ Edge cases and error handling
- ✅ Statistics calculation

### Test Categories

#### Schema Tests
- Zod schema validation
- Pattern matching functions
- Type safety validation

#### Parser Tests
- Table row extraction
- Component parsing
- Malformed data handling

#### Validation Tests
- Task entry validation
- Issue detection
- Configuration options
- Edge cases

#### CLI Tests
- Command execution
- Report generation
- Statistics display
- Error handling

#### Integration Tests
- File system operations
- Mock scenarios
- End-to-end workflows

## Troubleshooting

### Common Issues

#### File Not Found
**Problem**: `File not found: strategy_tasks.md`
**Solution**: Check file path and ensure file exists

**Example:**
```bash
# Check if file exists
ls -la src/docs/docs/coordinator/strategy_tasks.md
```

#### Parsing Errors
**Problem**: Malformed markdown table rows
**Solution**: Ensure proper table format with correct number of columns

**Example:**
```markdown
|Task ID|Title|Source|Impact|Status|Priority|Notes|
|-------|------|-------|-------|-----|--------|------|
|NP-040|Task Title|source.md|impact|status|priority|notes|
```

#### Validation Failures
**Problem**: Tasks failing validation rules
**Solution**: Review specific issue descriptions and suggestions

**Example:**
```bash
# Check specific task
npx tsx scripts/coordinator/taskIntakeValidatorCLI.ts check-rule "Task ID" --prompt --kpi
```

### Performance Considerations

#### Large Files
- **Files > 1000 rows**: Validation time < 100ms
- **Files > 5000 rows**: Validation time < 500ms
- **Files > 10000 rows**: Validation time < 1s

#### Memory Usage
- **Small Files**: < 1MB memory usage
- **Large Files**: < 10MB memory usage
- **Very Large Files**: < 50MB memory usage

### Optimization Tips

#### For Large Files
- Consider streaming parsing for very large files
- Use line-by-line validation
- Implement progress reporting

#### For Frequent Validation
- Cache parsed results when file unchanged
- Implement incremental validation
- Use background processing

#### For CI/CD Integration
- Use JSON output for automation
- Set appropriate exit codes
- Integrate with existing workflows

## Best Practices

### File Organization
- Keep `strategy_tasks.md` in standard location
- Maintain consistent markdown table format
- Use standard task ID patterns
- Include complete source documentation

### Task Definition
- Use descriptive titles (10-200 characters)
- Include clear source references
- Define measurable KPI when possible
- Add prompt instructions for incomplete tasks

### Documentation
- Update task notes with validation results
- Link to validation reports in Kanban
- Document validation rule changes
- Maintain issue resolution history

### Validation Workflow
1. Run validation before Kanban updates
2. Review and fix critical issues first
3. Address medium issues systematically
4. Update Kanban with validation status
5. Archive validation reports

## Integration Examples

### CI/CD Pipeline
```yaml
# GitHub Actions example
name: Task Intake Validation
on: [push, pull_request]
jobs:
  - name: Validate Task Intake
    run: |
      npx tsx scripts/coordinator/taskIntakeValidatorCLI.ts validate --format json --quiet
    if [ ${{ steps.outcome }} == 'failure' ]; then
      echo "Task validation failed - check reports"
      exit 1
    fi
```

### Pre-commit Hooks
```bash
#!/bin/sh
# Pre-commit hook for task validation
npm run lint -- scripts/coordinator
npm run test:unit -- tests/unit/coordinator/TaskIntakeValidator.test.ts
npx tsx scripts/coordinator/taskIntakeValidatorCLI.ts validate --quiet
```

### Monitoring Integration
```typescript
// In monitoring system
import { TaskIntakeValidator } from '@/scripts/coordinator/taskIntakeValidator';

const monitorTaskQuality = async () => {
  const validator = new TaskIntakeValidator();
  const result = await validator.validateFile();
  
  if (!result.passed) {
    // Alert team to fix issues
    sendAlert('Task validation failed', {
      critical: result.issuesBySeverity.critical.length,
      high: result.issuesBySeverity.high.length,
      medium: result.issuesBySeverity.medium.length,
    });
  }
  
  return {
    totalTasks: result.totalTasks,
    issuesCount: result.issues.length,
    passed: result.passed,
    timestamp: result.timestamp,
  };
};
```

## Maintenance

### Regular Updates
- **Monthly**: Review validation rules and thresholds
- **Quarterly**: Update KPI patterns and prompt patterns
- **Annually**: Review task ID patterns and source document requirements

### Rule Updates
- Add new validation rules as task types evolve
- Update KPI patterns for new metrics
- Modify exempt status list as needed
- Adjust title length constraints

### Performance Monitoring
- Track validation duration trends
- Monitor file size growth
- Optimize for CI/CD pipelines

### Archive Management
- Archive old validation reports monthly
- Keep current reports accessible
- Maintain issue resolution history

## Security Considerations

### File Access
- Read-only access to strategy_tasks.md
- No modifications to original files
- Safe validation without side effects

### Data Privacy
- No external data transmission
- Local processing only
- No sensitive information exposed

### Error Handling
- Graceful degradation for parsing errors
- Clear error messages for debugging
- Safe fallback for missing dependencies

## Future Enhancements

### Planned Features
- [ ] Auto-fix simple formatting issues
- [ ] Integration with Kanban lint automation
- [ ] Real-time validation monitoring
- [ ] Advanced pattern matching
- [ ] Custom validation rules engine

### API Extensions
- [ ] REST API for remote validation
- [ ] WebSocket for real-time updates
- [ ] GraphQL interface for complex queries
- [ ] Plugin system for custom validators

### Advanced Analytics
- [ ] Task quality trends over time
- KPI coverage analysis
- Prompt effectiveness metrics
- Validation performance analytics

## Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Run tests
npm run test -- tests/unit/coordinator/TaskIntakeValidator.test.ts

# Run with coverage
npm run test -- tests/unit/coordinator/TaskIntakeValidator.test.ts --coverage
```

### Code Style
- Follow existing TypeScript patterns
- Use JSDoc for all public APIs
- Include comprehensive error handling
- Maintain test coverage above 90%

### Testing Requirements
- All public APIs must have tests
- Edge cases must be covered
- Performance benchmarks for large files
- Integration tests for CLI commands

### Documentation Updates
- Update this documentation for rule changes
- Add examples for new validation rules
- Include CLI usage examples
- Maintain API reference

### Pull Request Process
1. Create feature branch
2. Implement with tests
3. Update documentation
4. Add integration tests
5. Submit pull request with tests passing
6. Review and merge

## License

This validator is part of the RPG Balancer project and follows the same licensing terms.

## Support

For issues, questions, or contributions:
- Create an issue in the project repository
- Check existing issues for similar problems
- Review documentation for troubleshooting
- Contact the development team

---

**Last Updated:** 2026-01-19  
**Version:** 1.0.0  
**Maintainer:** Coordinator-Bot – Task Validator
