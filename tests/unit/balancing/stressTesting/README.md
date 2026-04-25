# Stress Testing Test Suite

This directory contains comprehensive test suites for the Phase 10.5 stress testing pipeline, including:

## Test Coverage

### Core Components
- **StressTestArchetypeGenerator.test.ts** - Tests archetype generation with deterministic behavior
- **MarginalUtilityCalculator.test.ts** - Tests marginal utility analysis and statistical calculations
- **StressTelemetry.test.ts** - Tests telemetry event generation and validation

### Test Utilities
- **marginalUtilityFixtures.ts** - Mock data and fixtures for testing

## Running Tests

### Run All Stress Testing Tests
```bash
npm run test -- tests/unit/balancing/stressTesting/
```

### Run Specific Test File
```bash
npm run test -- tests/unit/balancing/stressTesting/MarginalUtilityCalculator.test.ts
```

### Run with Coverage
```bash
npm run test -- tests/unit/balancing/stressTesting/ --coverage
```

### Run Individual Test Pattern
```bash
npm run test -- tests/unit/balancing/stressTesting/ --grep "should generate"
```

## Test Structure

### Fixtures
- **Mock BalancerConfig** - Complete configuration for testing
- **Mock Archetypes** - Pre-generated baseline, single-stat, and pair-stat archetypes
- **Mock Analysis Results** - Expected results for validation

### Test Harnesses
- **Deterministic Behavior** - All tests use seeded RNG for reproducible results
- **Performance Testing** - Tests for scaling and efficiency
- **Error Handling** - Tests for malformed data and edge cases
- **Integration Testing** - End-to-end pipeline tests

## Configuration

### Vitest Configuration
The vite.config.ts includes specific patterns for stress testing tests:

```typescript
include: [
  'tests/unit/balancing/stressTesting/**/*.{test,spec}.{js,ts,jsx,tsx}',
  'tests/unit/balancing/**/*.{test,spec}.{js,ts,jsx,tsx}',
],
```

### Mock Services
- **PersistenceService** - Mocked for async storage operations
- **BalancerConfigStore** - Mocked for configuration access

## Test Data Principles

### Config-First
- All test data uses the mock BalancerConfig structure
- No hardcoded stat values or weights
- Tests validate against configuration changes

### Deterministic
- All tests use seeded random number generators
- Results are reproducible across test runs
- Seed values are documented in fixtures

### Comprehensive Coverage
- Unit tests for all public methods
- Integration tests for complete workflows
- Performance tests for scaling validation
- Error handling tests for edge cases

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use beforeEach for setup and cleanup
- Keep test descriptions clear and specific

### Data Validation
- Validate all generated data structures
- Check bounds and constraints
- Test both happy path and error cases

### Performance Considerations
- Use reasonable simulation counts for tests
- Monitor test execution time
- Batch expensive operations

## Debugging

### Test Failures
- Check mock configuration
- Verify fixture data consistency
- Review expected vs actual values

### Performance Issues
- Reduce simulation count for debugging
- Use performance profiling tools
- Check for memory leaks

## Maintenance

### Updating Tests
- Update fixtures when configuration changes
- Add new tests for new features
- Maintain mock data consistency

### Coverage Goals
- Aim for >90% line coverage
- Test all public APIs
- Cover critical error paths
