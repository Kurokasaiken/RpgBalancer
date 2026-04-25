# Coordinator Prompt Consistency CLI

## Overview

The Coordinator Prompt Consistency CLI is a command-line tool that verifies consistency between Kanban and documentation files. It detects duplicate prompts, invalid states, missing KPIs, and reference issues in the WS6 Prompt Kanban system.

## Features

### 🔍 Consistency Checks
- **Duplicate Detection**: Identifies duplicate prompt IDs across all documents
- **State Validation**: Validates prompt states against allowed values
- **KPI Requirements**: Checks for missing or incomplete KPI requirements
- **Reference Validation**: Verifies dependency references exist
- **Orphan Detection**: Finds prompts that are only referenced but not assigned

### 📊 Output Formats
- **JSON**: Machine-readable format for automated processing
- **Markdown**: Human-readable reports with detailed issue descriptions
- **CSV**: Spreadsheet-compatible format for data analysis

### 📈 Telemetry Integration
- Automatic emission of `coordinator_prompt_inconsistency_found` events
- Detailed metrics on issue types and severity breakdown
- Integration with existing coordinator monitoring systems

## Installation

The CLI is part of the RPG Balancer project and requires Node.js 20+.

## Usage

### Basic Usage

```bash
# Check the default Kanban file
npx tsx scripts/coordinator/promptConsistencyCheck.ts

# Specify input file
npx tsx scripts/coordinator/promptConsistencyCheck.ts -i path/to/kanban.md

# Output to file
npx tsx scripts/coordinator/promptConsistencyCheck.ts -o results.json

# Specify output format
npx tsx scripts/coordinator/promptConsistencyCheck.ts -f markdown

# Verbose output
npx tsx scripts/coordinator/promptConsistencyCheck.ts -v
```

### Command Options

| Option | Short | Long | Description | Default |
|--------|-------|-------|-------------|---------|
| Input file | `-i` | `--input` | Input file path | `src/docs/docs/coordinator/agent_assignments.md` |
| Output file | `-o` | `--output` | Output file path | Console output |
| Format | `-f` | `--format` | Output format (`json|markdown|csv`) | `json` |
| Verbose | `-v` | `--verbose` | Verbose output | `false` |
| Fix mode | | `--fix-mode` | Enable fix mode (not implemented) | `false` |
| No suggestions | | `--no-suggestions` | Disable suggestions in output | `false` |

### Exit Codes

- **0**: Success, no issues found
- **1**: Issues found (inconsistencies detected)
- **2**: Error (file not found, parsing error, etc.)

## Schema and Data Structures

### Prompt Entry Schema

```typescript
interface PromptEntry {
  id: string;                    // NP-XXX format
  title: string;                  // Prompt title
  description: string;             // Prompt description
  state: PromptState;             // Valid state value
  dependsOn?: string[];           // Dependency references
  assignedTo?: AgentAssignment;    // Agent assignment
  startTime?: string;             // Start timestamp
  endTime?: string;               // End timestamp
  duration?: number;              // Duration in hours
  estimated?: number;             // Estimated hours
  lastUpdate?: string;            // Last update timestamp
  kpiRequirements?: KPIRequirement[]; // KPI requirements
  notes?: string;                 // Additional notes
  evidenceLog?: string;           // Evidence log reference
}
```

### Valid States

- `Non assegnato` - Not assigned
- `In corso` - In progress
- `Completato` - Completed
- `Bloccato` - Blocked
- `Annullato` - Cancelled
- `Sospeso` - Suspended

### KPI Requirement Types

- `performance` - Performance metrics
- `quality` - Quality standards
- `documentation` - Documentation requirements
- `testing` - Testing requirements
- `integration` - Integration requirements
- `compliance` - Compliance requirements
- `accessibility` - Accessibility requirements
- `security` - Security requirements

## Examples

### Basic Consistency Check

```bash
npx tsx scripts/coordinator/promptConsistencyCheck.ts
```

Output:
```json
{
  "timestamp": "2026-01-20T10:00:00.000Z",
  "totalPrompts": 45,
  "issues": [
    {
      "type": "duplicate",
      "promptId": "NP-001",
      "description": "Duplicate prompt ID found: NP-001",
      "severity": "high",
      "suggestion": "Rename one of the duplicate prompts to use a unique ID"
    }
  ],
  "summary": {
    "duplicates": 1,
    "invalidStates": 0,
    "missingKpis": 3,
    "missingReferences": 2,
    "orphanedReferences": 1
  },
  "exportFormat": "json"
}
```

### Markdown Report

```bash
npx tsx scripts/coordinator/promptConsistencyCheck.ts -f markdown -o consistency-report.md
```

Output (consistency-report.md):
```markdown
# Prompt Consistency Check Results

**Timestamp:** 2026-01-20T10:00:00.000Z
**Total Prompts:** 45
**Issues Found:** 7

## Summary

| Issue Type | Count |
|------------|-------|
| Duplicates | 1 |
| Invalid States | 0 |
| Missing KPIs | 3 |
| Missing References | 2 |
| Orphaned References | 1 |

## Issues

### High Priority Issues

- **NP-001**: Duplicate prompt ID found: NP-001
  - *Suggestion:* Rename one of the duplicate prompts to use a unique ID
- **NP-015**: Missing dependency: NP-020
  - *Suggestion:* Create prompt NP-020 or remove the dependency

### Medium Priority Issues

- **NP-005**: No KPI requirements defined
  - *Suggestion:* Add KPI requirements to the prompt definition
- **NP-012**: No KPI requirements defined
  - *Suggestion:* Add KPI requirements to the prompt definition
- **NP-025**: No KPI requirements defined
  - *Suggestion:* Add KPI requirements to the prompt definition

### Low Priority Issues

- **NP-030**: Prompt exists but is only referenced as dependency and not assigned
  - *Suggestion:* Assign the prompt or remove references to it
```

### CSV Export

```bash
npx tsx scripts/coordinator/promptConsistencyCheck.ts -f csv -o issues.csv
```

Output (issues.csv):
```csv
Type,Prompt ID,Description,Severity,Suggestion
duplicate,NP-001,"Duplicate prompt ID found: NP-001",high,"Rename one of the duplicate prompts to use a unique ID"
missing_reference,NP-015,"Missing dependency: NP-020",high,"Create prompt NP-020 or remove the dependency"
missing_kpi,NP-005,"No KPI requirements defined",medium,"Add KPI requirements to the prompt definition"
```

### Verbose Output

```bash
npx tsx scripts/coordinator/promptConsistencyCheck.ts -v
```

Output:
```
Results written to: console
Processed 45 prompts
Found 7 issues
Exit code: 1
```

## Integration Examples

### CI/CD Pipeline Integration

```bash
#!/bin/bash
# Run consistency check in CI pipeline
echo "Running prompt consistency check..."

npx tsx scripts/coordinator/promptConsistencyCheck.ts \
  -i src/docs/docs/coordinator/agent_assignments.md \
  -o test-results/prompt-consistency-$(date +%Y-%m-%d).json \
  -f json

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ No consistency issues found"
else
  echo "❌ Consistency issues detected"
  exit 1
fi
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit
echo "Checking prompt consistency..."

npx tsx scripts/coordinator/promptConsistencyCheck.ts --no-suggestions
```

### GitHub Actions

```yaml
name: Prompt Consistency Check

on: [push, pull_request]

jobs:
  consistency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run consistency check
        run: |
          npx tsx scripts/coordinator/promptConsistencyCheck.ts \
            -o consistency-results.json \
            -f json
      
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: consistency-results
          path: consistency-results.json
```

## Telemetry Integration

### Event Emission

The CLI automatically emits telemetry events when issues are found:

```typescript
// Event: coordinator_prompt_inconsistency_found
{
  detail: {
    timestamp: "2026-01-20T10:00:00.000Z",
    totalIssues: 7,
    issuesByType: {
      duplicates: 1,
      invalidStates: 0,
      missingKpis: 3,
      missingReferences: 2,
      orphanedReferences: 1
    },
    severityBreakdown: {
      critical: 0,
      high: 2,
      medium: 3,
      low: 2
    }
  }
}
```

### Monitoring Setup

```typescript
// In your monitoring system
window.addEventListener('coordinator_prompt_inconsistency_found', (event) => {
  const { totalIssues, severityBreakdown } = event.detail;
  
  // Send to monitoring service
  analytics.track('prompt_consistency_issues', {
    totalIssues,
    criticalIssues: severityBreakdown.critical,
    highIssues: severityBreakdown.high,
    mediumIssues: severityBreakdown.medium,
    lowIssues: severityBreakdown.low,
  });
  
  // Create alert for critical issues
  if (severityBreakdown.critical > 0) {
    alerting.send('Critical prompt consistency issues detected');
  }
});
```

## Architecture

### Components

1. **Schema Definitions** (`promptConsistencySchema.ts`)
   - Zod schemas for data validation
   - Type definitions for all data structures
   - Exportable type definitions

2. **Markdown Parser** (`markdownPromptParser.ts`)
   - AST-based Markdown parsing
   - Table extraction and parsing
   - Prompt content analysis
   - KPI requirement extraction

3. **Consistency Checker** (`promptConsistencyCheck.ts`)
   - Main CLI implementation
   - Consistency check algorithms
   - Export functionality
   - Telemetry integration

4. **Unit Tests** (`PromptConsistencyCheck.test.ts`)
   - Comprehensive test coverage
   - Fixtures for different scenarios
   - Integration tests with real data

### Data Flow

```
Input File → Markdown Parser → Prompt Objects → Consistency Checker → Results → Export Formats
                                                    ↓
                                              Telemetry Events
```

### Error Handling

- **File Not Found**: Exit code 2, error message to stderr
- **Parse Errors**: Graceful handling, partial results when possible
- **Invalid Data**: Skip invalid entries, report as issues
- **Export Errors**: Fallback to console output

## Performance Considerations

### Large Files
- Streaming parser for large Markdown files
- Memory-efficient data structures
- Progress reporting for long operations

### Batch Processing
- Multiple file support (planned feature)
- Parallel processing capabilities
- Result aggregation

### Caching
- Parse result caching (planned feature)
- Incremental updates
- Change detection

## Troubleshooting

### Common Issues

#### File Not Found
```
Error: Input file not found: path/to/file.md
```
**Solution**: Verify the file path and ensure the file exists

#### Parse Errors
```
Error: Invalid table format at line 45
```
**Solution**: Check the Markdown table format, ensure proper pipe separators

#### Permission Errors
```
Error: EACCES: permission denied
```
**Solution**: Check file permissions, ensure read access to input file

### Debug Mode

For detailed debugging, use verbose mode:

```bash
npx tsx scripts/coordinator/promptConsistencyCheck.ts -v
```

This provides:
- Processing statistics
- Error details
- Performance metrics
- Exit code information

### Test Data

For testing purposes, you can use the provided fixtures in the test suite:

```typescript
// Example test data
const testContent = `
# Test Kanban

| Prompt ID/Descrizione | Stato |
| --- | --- |
| NP-001 – Test Prompt | Completato |
`;
```

## Future Enhancements

### Planned Features (Phase 2)

1. **Multi-file Support**: Process multiple Kanban files simultaneously
2. **Fix Mode**: Automatically fix common issues (renaming duplicates, fixing states)
3. **Configuration File**: Support for custom rules and thresholds
4. **Web Interface**: Browser-based consistency checker
5. **API Integration**: REST API for remote consistency checking

### Advanced Features

1. **Historical Analysis**: Track consistency issues over time
2. **Trend Detection**: Identify patterns in consistency issues
3. **Automated Suggestions**: AI-powered fix recommendations
4. **Integration Hooks**: Custom validation plugins
5. **Real-time Monitoring**: Live consistency checking with file watchers

## Contributing

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd rpg-balancer

# Install dependencies
npm install

# Run tests
npm run test -- tests/unit/coordinator/PromptConsistencyCheck.test.ts

# Run CLI
npx tsx scripts/coordinator/promptConsistencyCheck.ts --help
```

### Adding New Checks

1. Define check logic in `PromptConsistencyChecker`
2. Add corresponding tests
3. Update documentation
4. Ensure proper error handling

### Code Style

- Follow existing TypeScript patterns
- Use JSDoc for all public APIs
- Include comprehensive error handling
- Maintain test coverage above 90%

## License

This CLI is part of the RPG Balancer project and follows the same licensing terms.

## Support

For issues, questions, or contributions:
- Create an issue in the project repository
- Check existing issues for similar problems
- Review documentation for troubleshooting
- Contact the development team

---

**Last Updated:** 2026-01-20  
**Version:** 1.0.0  
**Maintainer:** Coordinator-Bot – Prompt QA
