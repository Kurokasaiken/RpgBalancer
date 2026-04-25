# Formula Safety Storage Test Suite

## Overview

The Formula Safety Storage Test Suite is a comprehensive testing system for verifying the safety and reliability of formulas in the Balancer configuration system. It provides config-first analysis, storage integration, and detailed reporting capabilities.

## Features

### 🔍 Formula Safety Analysis
- **Cycle Detection**: Identifies circular dependencies in formulas
- **Complexity Analysis**: Evaluates formula complexity (low/medium/high)
- **Range Validation**: Checks for potential overflow/underflow issues
- **Division Risk**: Detects potential division by zero scenarios
- **Custom Rules**: Extensible rule system for custom safety checks

### 🗄️ Storage Integration
- **Storage Testing Framework**: Integrates with existing storage testing infrastructure
- **Persistence Service**: Uses async PersistenceService for data operations
- **Telemetry Integration**: Emits detailed telemetry events for monitoring
- **Config-First Design**: All configurations are externalized and customizable

### 📊 Reporting & CLI
- **Multiple Formats**: JSON, Markdown, and CSV output formats
- **CLI Interface**: Command-line tool with comprehensive options
- **Verbose Logging**: Detailed output for debugging and analysis
- **Recommendations**: Automated suggestions for formula improvements

## Architecture

### Core Components

#### FormulaSafetyAnalyzer
The main analysis engine that processes formulas and generates safety reports.

```typescript
const analyzer = new FormulaSafetyAnalyzer({
  maxComplexity: 'medium',
  maxOperations: 1000,
  allowNegative: false,
  allowDivision: true,
  allowCycles: false,
});

const result = analyzer.analyzeFormula(formula, formulaId, context);
```

#### FormulaSafetyStorageTestSuite
The test suite that orchestrates testing operations and integrates with storage systems.

```typescript
const testSuite = new FormulaSafetyStorageTestSuite({
  outputFormat: 'markdown',
  verbose: true,
  includeRecommendations: true,
});

const results = await testSuite.runTestSuite();
```

#### FormulaSafetyTestCLI
Command-line interface for running tests and generating reports.

```bash
npm run formula-safety-test --formula basic-damage --output markdown
npm run formula-safety-test --verbose --recommendations
npm run formula-safety-test --max-complexity low --max-operations 500
```

## Safety Rules

### Default Rules

1. **No Hardcoded Values**: Warns against hardcoded numeric values in formulas
2. **Balanced Operations**: Ensures formulas have a reasonable number of operations
3. **No Deeply Nested Functions**: Prevents excessive function nesting

### Custom Rules

Add custom safety rules using the `SafetyRule` interface:

```typescript
const customRule: SafetyRule = {
  id: 'no-magic-numbers',
  name: 'No Magic Numbers',
  description: 'Formulas should not contain magic numbers',
  enabled: true,
  severity: 'warning',
  check: (formula: string, context: FormulaContext) => {
    return !/\b(13|42|666)\b/.test(formula);
  },
};

analyzer.addRule(customRule);
```

## Configuration

### Safety Analysis Configuration

```typescript
const config: SafetyAnalysisConfig = {
  maxComplexity: 'medium',      // 'low' | 'medium' | 'high'
  maxOperations: 1000,         // Maximum allowed operations
  allowNegative: false,        // Allow negative numbers
  allowDivision: true,          // Allow division operations
  allowCycles: false,           // Allow circular dependencies
  customRules: [],             // Custom safety rules
};
```

### Test Configuration

```typescript
const testConfig: FormulaSafetyTestConfig = {
  formulaId: 'basic-damage',   // Test specific formula
  rules: ['no-hardcoded-values'], // Specific rules to apply
  outputFormat: 'markdown',    // 'json' | 'markdown' | 'csv'
  verbose: true,               // Enable verbose output
  includeRecommendations: true, // Include recommendations
  customThresholds: {
    maxComplexity: 'low',
    maxOperations: 500,
  },
};
```

## Usage Examples

### Basic Usage

```typescript
import { FormulaSafetyStorageTestSuite, DEFAULT_TEST_FORMULAS } from './FormulaSafetyStorageTest';

// Create test suite
const testSuite = new FormulaSafetyStorageTestSuite();

// Run tests
const results = await testSuite.runTestSuite(DEFAULT_TEST_FORMULAS);

// Generate report
const report = testSuite.generateReport(results, 'markdown');
console.log(report);
```

### CLI Usage

```bash
# Run all tests
npm run formula-safety-test

# Test specific formula
npm run formula-safety-test --formula basic-damage

# Generate markdown report
npm run formula-safety-test --output markdown

# Verbose output with recommendations
npm run formula-safety-test --verbose --recommendations

# Custom thresholds
npm run formula-safety-test --max-complexity low --max-operations 500
```

### Storage Integration

```typescript
// Test storage operations
const storageResults = await testSuite.runStorageTests();

// Emit telemetry
await testSuite.emitTelemetry(testResults);
```

## Test Data

### Default Test Formulas

The suite includes comprehensive test formulas covering various scenarios:

```typescript
const testFormulas = [
  {
    id: 'basic-damage',
    formula: 'damage + strength * 0.5',
    context: {
      stats: {
        damage: { min: 10, max: 100, current: 50 },
        strength: { min: 5, max: 20, current: 10 },
      },
    },
    expectedSafety: 'safe',
  },
  {
    id: 'complex-nested',
    formula: 'max(0, min(100, (base + bonus) * multiplier * (1 + critChance)))',
    context: { /* ... */ },
    expectedSafety: 'warning',
  },
  // ... more test cases
];
```

## Safety Levels

### Safe
- No cycles detected
- Low to medium complexity
- No division risks
- No range issues

### Warning
- High complexity
- Minor range issues
- Custom rule violations

### Unsafe
- Division risks
- Multiple range issues
- Error-level rule violations

### Critical
- Circular dependencies
- Critical rule violations
- Multiple safety issues

## Reporting

### JSON Report
```json
{
  "summary": {
    "total": 4,
    "passed": 3,
    "failed": 1,
    "successRate": 75.0,
    "duration": 1250
  },
  "results": [
    {
      "formulaId": "basic-damage",
      "formula": "damage + strength * 0.5",
      "expected": "safe",
      "actual": "safe",
      "passed": true,
      "result": { /* detailed analysis */ }
    }
  ],
  "storageAnalysis": {
    "overallHealth": "good",
    "safeFormulas": 2,
    "warningFormulas": 1,
    "unsafeFormulas": 1,
    "criticalFormulas": 0
  }
}
```

### Markdown Report
```markdown
# Formula Safety Storage Test Report

**Generated:** 2024-01-24T12:00:00.000Z

## Summary
- **Total Tests:** 4
- **Passed:** 3
- **Failed:** 1
- **Success Rate:** 75.0%
- **Duration:** 1250ms

## Storage Analysis
- **Overall Health:** good
- **Safe Formulas:** 2
- **Warning Formulas:** 1
- **Unsafe Formulas:** 1
- **Critical Formulas:** 0

## Detailed Results
| Formula ID | Formula | Expected | Actual | Status |
|------------|---------|----------|--------|--------|
| basic-damage | `damage + strength * 0.5` | safe | safe | ✅ PASS |
```

### CSV Report
```csv
Formula ID,Formula,Expected,Actual,Status,Timestamp
basic-damage,"damage + strength * 0.5",safe,safe,PASS,1706094400000
complex-nested,"max(0, min(100, ...))",warning,warning,✅ PASS,1706094400000
```

## Telemetry Integration

The test suite emits comprehensive telemetry events:

```typescript
{
  eventType: 'balancer_formula_safety_storage_test',
  data: {
    timestamp: 1706094400000,
    summary: {
      total: 4,
      passed: 3,
      failed: 1,
      successRate: 75.0,
      duration: 1250,
    },
    storageHealth: 'good',
    totalFormulas: 4,
    criticalIssues: 0,
    recommendations: ['Simplify complex formulas', 'Add division protection'],
  },
}
```

## Performance Characteristics

### Benchmarks
- **Single Formula Analysis**: < 10ms
- **Full Test Suite (4 formulas)**: < 50ms
- **Storage Tests**: < 100ms
- **Report Generation**: < 20ms

### Memory Usage
- **Base Framework**: ~2MB
- **Test Data**: ~1MB
- **Reports**: ~500KB

## Integration Points

### Balancer Config System
```typescript
import { BalancerConfigStore } from './config/BalancerConfigStore';

// Load formulas from config
const config = await BalancerConfigStore.load();
const formulas = config.cards.map(card => ({
  id: card.id,
  formula: card.formula,
  context: config.stats,
}));

// Run safety tests
const results = await testSuite.runTestSuite(formulas);
```

### Storage Testing Framework
```typescript
import { StorageTestFramework } from '../../../shared/testing/StorageTestFramework';

// Test formula persistence
const storageTest = new StorageTestFramework('formula-safety', {
  save: async (data) => { /* save implementation */ },
  load: async () => { /* load implementation */ },
  clear: async () => { /* clear implementation */ },
});

const storageResults = await storageTest.runFullTest(formulas);
```

### Persistence Service
```typescript
import { PersistenceService } from '../../../shared/persistence/PersistenceService';

// Save test results
await PersistenceService.saveData('formula-safety-results', results);

// Load previous results
const previousResults = await PersistenceService.loadData('formula-safety-results');
```

## Error Handling

### Common Errors and Solutions

1. **Formula Parse Errors**
   ```typescript
   try {
     const result = analyzer.analyzeFormula(formula, id, context);
   } catch (error) {
     console.error('Formula analysis failed:', error.message);
     // Handle parse errors gracefully
   }
   ```

2. **Storage Failures**
   ```typescript
   try {
     await testSuite.runStorageTests();
   } catch (error) {
     console.warn('Storage tests failed, continuing with analysis');
     // Continue with formula analysis
   }
   ```

3. **Telemetry Failures**
   ```typescript
   try {
     await testSuite.emitTelemetry(results);
   } catch (error) {
     console.warn('Telemetry emission failed:', error);
     // Don't fail the test suite for telemetry issues
   }
   ```

## Best Practices

### Formula Design
1. **Keep formulas simple** - Avoid excessive nesting
2. **Use meaningful variable names** - Improve readability
3. **Add comments** - Document complex logic
4. **Test edge cases** - Consider boundary conditions

### Safety Rules
1. **Start with default rules** - Use built-in safety checks
2. **Add custom rules gradually** - Extend based on specific needs
3. **Test rule effectiveness** - Validate rule behavior
4. **Document custom rules** - Explain purpose and logic

### Testing Strategy
1. **Test regularly** - Run tests on formula changes
2. **Monitor trends** - Track safety metrics over time
3. **Review failures** - Investigate and fix issues
4. **Update expectations** - Adjust expected results as needed

## Troubleshooting

### Common Issues

1. **Import Errors**
   - Check file paths
   - Verify module exports
   - Ensure TypeScript configuration

2. **Type Errors**
   - Review type definitions
   - Check Zod schemas
   - Verify interface compatibility

3. **Runtime Errors**
   - Check formula syntax
   - Verify context data
   - Review rule implementations

### Debug Mode

Enable verbose logging for detailed debugging:

```typescript
const testSuite = new FormulaSafetyStorageTestSuite({
  verbose: true,
  outputFormat: 'json',
});

const results = await testSuite.runTestSuite();
console.log(JSON.stringify(results, null, 2));
```

## Future Enhancements

### Planned Features
1. **Visual Formula Editor** - GUI for formula creation and testing
2. **Real-time Validation** - Live formula safety checking
3. **Performance Profiling** - Formula performance analysis
4. **Integration Tests** - End-to-end testing scenarios

### Extension Points
1. **Custom Analyzers** - Plugin system for specialized analysis
2. **Report Templates** - Customizable report formats
3. **Rule Marketplace** - Shared safety rules library
4. **Integration Hooks** - External system integrations

## Contributing

### Adding New Safety Rules
1. Define rule interface
2. Implement rule logic
3. Add test cases
4. Update documentation

### Extending Test Coverage
1. Add new test formulas
2. Create edge case scenarios
3. Update expected results
4. Verify integration

### Improving Documentation
1. Update usage examples
2. Add troubleshooting guides
3. Enhance API documentation
4. Review and edit

---

This Formula Safety Storage Test Suite provides a comprehensive foundation for ensuring formula safety and reliability in the Balancer configuration system. It follows config-first principles and integrates seamlessly with existing infrastructure while providing extensibility for future enhancements.
