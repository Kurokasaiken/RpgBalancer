# Minimal Gameplay QA Checklist Generator

This document describes the Minimal Gameplay QA Checklist Generator, a config-first tool that automatically generates comprehensive QA checklists based on Minimal Gameplay configuration.

## Overview

The QA Checklist Generator creates dynamic testing tasks by analyzing the Minimal Gameplay configuration and generating appropriate test cases for:

- UI elements and interactions
- Game mechanics and timing
- Location activities and rewards
- Resident stats and fatigue
- Edge cases and error conditions
- Performance requirements

## Architecture

### Config-Driven Generation

The generator reads the `MINIMAL_GAMEPLAY_CONFIG` and creates tasks based on:

- **Locations**: Display, activity execution, and stat requirement tasks
- **Residents**: Display, stats validation, and fatigue mechanics tasks
- **UI Elements**: Hero section, HUD fields, game over modals
- **Game Mechanics**: Loop timing, speed multipliers, resource management
- **Edge Cases**: Game over conditions, resource depletion, capacity limits
- **Performance**: Load times, game loop stability, autosave operations

### Dynamic Task Creation

Tasks are generated with:

- **Unique IDs**: For tracking and automation
- **Priority Levels**: Critical, High, Medium, Low
- **Time Estimates**: Based on task complexity
- **Prerequisites**: Dependencies between tasks
- **Automation Flags**: Whether tasks can be automated

## CLI Usage

### Basic Usage

```bash
# Generate both JSON and Markdown outputs
tsx scripts/idleVillage/minimalQAChecklist.ts \
  --output-json test-results/qa-checklist.json \
  --output-markdown test-results/qa-checklist.md

# Generate only Markdown output
tsx scripts/idleVillage/minimalQAChecklist.ts \
  --output-markdown docs/qa-checklist.md

# Show help
tsx scripts/idleVillage/minimalQAChecklist.ts --help
```

### Command Line Options

| Option | Short | Description | Required |
|--------|-------|-------------|----------|
| `--output-json <file>` | `-j` | Output checklist in JSON format | No |
| `--output-markdown <file>` | `-m` | Output checklist in Markdown format | No |
| `--verbose` | `-v` | Enable verbose logging | No |
| `--help` | `-h` | Show help message | No |

At least one output format must be specified.

### Output Formats

#### JSON Output
Structured data for automation and integration:

```json
{
  "generatedAt": "2026-01-20T12:00:00.000Z",
  "configVersion": "0.1.0-minimal-gameplay",
  "totalTasks": 25,
  "sections": [...],
  "estimatedTotalTime": 450,
  "coverage": {
    "uiElements": 5,
    "gameMechanics": 3,
    "locations": 9,
    "residents": 3,
    "edgeCases": 4,
    "performanceTests": 3
  }
}
```

#### Markdown Output
Human-readable checklist with formatted sections and tasks:

```markdown
# Minimal Gameplay QA Checklist

**Generated:** 1/20/2026, 12:00:00 PM
**Config Version:** 0.1.0-minimal-gameplay
**Total Tasks:** 25
**Estimated Time:** 7.5 hours

## Coverage Summary

| Category | Count | Percentage |
|----------|-------|------------|
| UI Elements | 5 | 20% |
| Game Mechanics | 3 | 12% |
| Locations | 9 | 36% |
| Residents | 3 | 12% |
| Edge Cases | 4 | 16% |
| Performance Tests | 3 | 12% |

## UI Testing

Comprehensive testing of all UI elements and displays.

**Tasks:** 5 | **Estimated Time:** 25 minutes

### 🔴 🤖 Hero Section Display

**Priority:** critical | **Time:** 5min | **Category:** ui

Verify hero section renders correctly with configured content.
```

## API Reference

### Core Functions

#### `generateQAChecklist(config)`

Generates a complete QA checklist from Minimal Gameplay configuration.

**Parameters:**
- `config`: `MinimalGameplayConfig` - The game configuration

**Returns:** `QAChecklistReport` - Complete checklist with sections and tasks

**Example:**
```typescript
import { generateQAChecklist } from '@/balancing/config/idleVillage/qaChecklistGenerator';
import { MINIMAL_GAMEPLAY_CONFIG } from '@/balancing/config/idleVillage/minimalGameplayConfig';

const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
console.log(`Generated ${checklist.totalTasks} QA tasks`);
```

### Type Definitions

#### `QAChecklistTask`
```typescript
interface QAChecklistTask {
  id: string;                          // Unique task identifier
  category: 'ui' | 'mechanics' | 'locations' | 'residents' | 'performance' | 'edge-cases';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;                       // Human-readable title
  description: string;                 // Detailed description
  steps: string[];                     // Step-by-step instructions
  expectedResult: string;              // Expected outcome
  automationReady: boolean;            // Whether task can be automated
  estimatedTimeMinutes: number;        // Time estimate in minutes
  prerequisites?: string[];           // Task dependencies
  relatedConfig?: string;             // Related config path
}
```

#### `QAChecklistSection`
```typescript
interface QAChecklistSection {
  sectionId: string;                   // Unique section identifier
  sectionName: string;                 // Human-readable name
  description: string;                 // Section description
  tasks: QAChecklistTask[];            // Tasks in this section
  estimatedTotalTime: number;          // Total time for all tasks
}
```

#### `QAChecklistReport`
```typescript
interface QAChecklistReport {
  generatedAt: string;                 // ISO timestamp
  configVersion: string;               // Config version used
  totalTasks: number;                  // Total number of tasks
  sections: QAChecklistSection[];      // All checklist sections
  estimatedTotalTime: number;          // Total estimated time
  coverage: {                          // Task distribution
    uiElements: number;
    gameMechanics: number;
    locations: number;
    residents: number;
    edgeCases: number;
    performanceTests: number;
  };
}
```

## Integration Examples

### CI/CD Pipeline Integration

```yaml
# .github/workflows/qa-checklist.yml
name: Generate QA Checklist

on:
  push:
    paths:
      - 'src/balancing/config/idleVillage/minimalGameplayConfig.ts'

jobs:
  generate-checklist:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx tsx scripts/idleVillage/minimalQAChecklist.ts \
          --output-markdown qa-checklist.md \
          --verbose
      - uses: actions/upload-artifact@v3
        with:
          name: qa-checklist
          path: qa-checklist.md
```

### Test Automation Integration

```typescript
// tests/integration/qa-checklist-validation.test.ts
import { generateQAChecklist } from '@/balancing/config/idleVillage/qaChecklistGenerator';
import { MINIMAL_GAMEPLAY_CONFIG } from '@/balancing/config/idleVillage/minimalGameplayConfig';

describe('QA Checklist Validation', () => {
  it('should generate valid checklist structure', () => {
    const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);

    expect(checklist.totalTasks).toBeGreaterThan(0);
    expect(checklist.sections.length).toBe(6); // All sections present

    // Validate task structure
    checklist.sections.forEach(section => {
      section.tasks.forEach(task => {
        expect(task.id).toMatch(/^[a-z-]+$/);
        expect(task.steps.length).toBeGreaterThan(0);
        expect(task.estimatedTimeMinutes).toBeGreaterThan(0);
      });
    });
  });
});
```

### Documentation Integration

```bash
# Generate checklist for documentation
npm run qa-checklist -- --output-markdown docs/qa-checklist.md

# Include in PR template
cat << EOF
## QA Checklist
Please verify the following QA tasks are completed:

$(cat docs/qa-checklist.md | grep -A 5 "###" | head -20)
EOF
```

## Task Categories

### UI Testing
- Hero section display and content
- HUD field rendering and updates
- Warning badge functionality
- Game over modal behavior
- Navigation and interaction flows

### Game Mechanics
- Game loop timing and intervals
- Speed multiplier functionality
- Resource management (gold/food)
- Autosave operations
- Event log accuracy

### Location Testing
- Location display and icons
- Activity assignment and execution
- Reward calculation and application
- Stat-based modifiers
- Telemetry event emission

### Resident Testing
- Resident roster display
- Stat value validation
- Fatigue accumulation and recovery
- Injury mechanics
- Activity performance correlation

### Edge Cases
- Game over conditions (food depletion, all injured)
- Resource boundary testing
- Maximum capacity scenarios
- Error recovery and fallback behavior

### Performance Testing
- Page load times
- Game loop stability over time
- Memory usage monitoring
- Autosave performance
- Frame rate consistency

## Priority System

### Critical (🔴)
Must pass for release. Core functionality that breaks the game if failing.

- Game loop timing
- Activity execution
- Resource management
- Game over conditions
- UI element display

### High (🟠)
Important functionality that affects user experience significantly.

- HUD updates
- Resident stats
- Fatigue mechanics
- Location interactions
- Performance baselines

### Medium (🟡)
Nice-to-have features that enhance gameplay but aren't critical.

- Stat-based modifiers
- Detailed telemetry
- Edge case handling
- UI polish

### Low (🟢)
Minor issues that can be addressed in future updates.

- Optimization opportunities
- Advanced features
- Nice-to-have improvements

## Automation Readiness

### Automation Ready (🤖)
Tasks that can be automated with current test framework:

- UI element presence and content
- Basic interactions
- Data validation
- Performance metrics
- Configuration compliance

### Manual Only (👤)
Tasks requiring human judgment:

- Visual design verification
- Subjective experience evaluation
- Complex scenario testing
- Edge case exploration
- Performance perception

## Time Estimation

Time estimates are based on:

- **Task Complexity**: Simple checks vs. complex scenarios
- **Setup Time**: Initial configuration and navigation
- **Execution Time**: Performing the actual test steps
- **Verification Time**: Confirming expected results
- **Documentation Time**: Recording findings

### Time Ranges
- **Critical Tasks**: 10-30 minutes (complex setup and verification)
- **High Priority**: 5-20 minutes (important functionality)
- **Medium Priority**: 3-15 minutes (enhancement features)
- **Low Priority**: 1-10 minutes (minor improvements)

## Configuration Updates

The checklist generator automatically adapts to configuration changes:

```typescript
// Adding a new location automatically generates:
{
  id: 'location-display-new-location',
  title: 'Location Display: New Location',
  // ... validation tasks
},
{
  id: 'location-activity-new-location',
  title: 'Activity Execution: New Location',
  // ... execution tasks
}
```

### Config Impact Analysis

| Config Change | Generated Tasks | Priority |
|---------------|-----------------|----------|
| New Location | Display + Activity + Stats (if applicable) | High |
| New Resident | Display + Stats + Fatigue | High |
| UI Changes | Hero + HUD validation | Critical |
| Mechanic Tweaks | Loop timing + resource validation | Critical |
| New Stats | Stat validation tasks | Medium |

## Testing Workflow Integration

### Development Workflow

1. **Config Changes**: Update `minimalGameplayConfig.ts`
2. **Generate Checklist**: Run QA checklist generator
3. **Review Tasks**: Ensure all critical tasks are covered
4. **Implement Tests**: Add automated tests for new functionality
5. **Manual Testing**: Execute remaining manual tasks
6. **Sign-off**: Verify all critical tasks pass

### Release Workflow

1. **Pre-Release**: Generate fresh checklist from production config
2. **Automated Testing**: Run all automation-ready tasks
3. **Manual QA**: Execute critical manual tasks
4. **Regression Testing**: Verify existing functionality
5. **Performance Validation**: Check performance requirements
6. **Release Approval**: Confirm all critical tasks pass

## Troubleshooting

### Common Issues

#### Checklist Not Generating
**Symptoms:** CLI exits with error or empty output
**Causes:**
- Invalid config structure
- Missing required config properties
- TypeScript compilation errors
**Solutions:**
- Validate config against schema
- Check TypeScript compilation
- Run with `--verbose` flag

#### Missing Tasks
**Symptoms:** Expected tasks not appearing in checklist
**Causes:**
- Config property not properly typed
- Generator logic not handling new config patterns
- Conditional task generation failing
**Solutions:**
- Check config type definitions
- Review generator logic for new patterns
- Add debug logging

#### Time Estimates Inaccurate
**Symptoms:** Estimated times don't match actual testing time
**Causes:**
- Task complexity changed
- Setup time variations
- Testing environment differences
**Solutions:**
- Update time estimates in generator
- Factor in setup time variations
- Consider testing environment impact

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
tsx scripts/idleVillage/minimalQAChecklist.ts \
  --output-json debug.json \
  --verbose
```

This provides:
- Config parsing details
- Task generation progress
- Section completion status
- Final statistics

## Future Enhancements

### Planned Features

1. **Custom Task Templates**: User-defined task patterns
2. **Priority Overrides**: Configurable priority adjustments
3. **Dependency Mapping**: Task prerequisite visualization
4. **Progress Tracking**: Test execution status integration
5. **Historical Comparisons**: Checklist diffing between versions

### Integration Opportunities

- **TestRail/Jira**: Automated ticket creation
- **GitHub Actions**: PR checklist validation
- **Playwright/Cypress**: Enhanced automation support
- **Performance Monitoring**: Real-time performance validation
- **Accessibility Testing**: WCAG compliance tasks

## Related Documentation

- [Minimal Gameplay Config](../minimal_gameplay_config.md)
- [Testing Strategy](../../testing_strategy.md)
- [CI/CD Pipeline](../../ci_cd_pipeline.md)
- [Performance Guidelines](../../performance_guidelines.md)
