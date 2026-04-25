# Phase 10 Telemetry Router Documentation - NP-057

## Overview

The Phase 10 Telemetry Router provides a centralized system for routing and managing telemetry events from the Config-Driven Balancer Phase 10 components. It normalizes event payloads, validates schemas, and routes events to appropriate collectors with comprehensive error handling and retry mechanisms.

## Features

### Event Types
- **Formula Safety Events**: Track formula validation, safety checks, and performance metrics
- **Undo/Redo Events**: Monitor configuration history operations and state changes
- **Stress Testing Events**: Capture stress testing results, performance metrics, and test outcomes

### Core Capabilities
- **Schema Validation**: Zod-based validation for all event types
- **Event Normalization**: Automatic timestamp formatting and session ID generation
- **Flexible Routing**: Plugin-based collector system for extensible event handling
- **Queue Management**: Event queuing with retry logic and overflow protection
- **Telemetry Integration**: Automatic emission of routing metrics and statistics
- **Error Handling**: Comprehensive error handling with detailed reporting

### Architecture
- **Router Core**: Central event processing and routing logic
- **Collector System**: Plugin-based collectors for different event types
- **Queue System**: Asynchronous event processing with retry mechanisms
- **Telemetry Layer**: Metrics collection and reporting
- **UI Integration**: React hooks for easy component integration

## Installation

The Phase 10 Telemetry Router is included in the RPG Balancer project. No additional installation required.

```bash
# Ensure Node.js 20+ is active
source ~/.nvm/nvm.sh && nvm use

# The router is ready to use
```

## Usage

### Basic Event Routing

```typescript
import { Phase10TelemetryRouter } from '@/balancing/telemetry/Phase10TelemetryRouter';

// Route a formula safety event
const result = await Phase10TelemetryRouter.routeEvent({
  eventType: 'formula_safety',
  timestamp: '2023-01-19T12:00:00.000Z',
  sessionId: 'session-123',
  formulaId: 'formula-1',
  formula: 'strength * 1.2 + stamina * 0.8',
  validation: {
    valid: true,
    usedStats: ['strength', 'stamina'],
    warnings: [],
    safety: {
      hasCycles: false,
      complexity: 'low',
      estimatedOperations: 2,
      divisionRisk: false,
      rangeIssues: [],
    },
  },
  context: {
    stats: {
      strength: { min: 1, max: 100, current: 10 },
      stamina: { min: 1, max: 200, current: 50 },
    },
  },
});

console.log('Event routed:', result.success);
```

### React Hook Integration

```typescript
import { useTelemetryRouter } from '@/ui/balancing/hooks/useTelemetryRouter';

function FormulaEditor() {
  const { 
    emitFormulaSafetyEvent, 
    emitUndoRedoEvent, 
    emitStressTestingEvent,
    sessionId,
    isInitialized 
  } = useTelemetryRouter({
    enableConsoleLogging: true,
    enableTelemetry: true,
    sessionId: 'custom-session',
  });

  const handleFormulaChange = async (formula: string) => {
    await emitFormulaSafetyEvent({
      formulaId: 'formula-1',
      formula,
      validation: {
        valid: true,
        usedStats: ['strength', 'stamina'],
        warnings: [],
        safety: {
          hasCycles: false,
          complexity: 'low',
          estimatedOperations: 2,
          divisionRisk: false,
          rangeIssues: [],
        },
      },
      context: {
        stats: {
          strength: { min: 1, max: 100, current: 10 },
          stamina: { min: 1, max: 200, current: 50 },
        },
      },
    });
  };

  return (
    <div>
      <p>Session: {sessionId}</p>
      <p>Router Status: {isInitialized ? 'Ready' : 'Initializing'}</p>
    </div>
  );
}
```

### Specialized Hooks

```typescript
// Formula safety telemetry
import { useFormulaSafetyTelemetry } from '@/ui/balancing/hooks/useTelemetryRouter';

function FormulaComponent() {
  const { emitFormulaSafetyEvent } = useFormulaSafetyTelemetry();
  
  // Emit formula safety events
}

// Undo/redo telemetry
import { useUndoRedoTelemetry } from '@/ui/balancing/hooks/useTelemetryRouter';

function HistoryComponent() {
  const { emitUndoRedoEvent } = useUndoRedoTelemetry();
  
  // Emit undo/redo events
}

// Stress testing telemetry
import { useStressTestingTelemetry } from '@/ui/balancing/hooks/useTelemetryRouter';

function StressTestComponent() {
  const { emitStressTestingEvent } = useStressTestingTelemetry();
  
  // Emit stress testing events
}
```

## Event Schemas

### Formula Safety Event

```typescript
interface FormulaSafetyEvent {
  eventType: 'formula_safety';
  timestamp: string;
  sessionId: string;
  formulaId: string;
  formula: string;
  validation: {
    valid: boolean;
    error?: string;
    usedStats: string[];
    warnings: FormulaWarning[];
    safety?: FormulaSafetyReport;
  };
  context: FormulaContext;
  metadata?: Record<string, unknown>;
}

interface FormulaWarning {
  type: 'range' | 'division' | 'complexity' | 'performance';
  message: string;
  severity: 'info' | 'warning' | 'error';
  position?: { start: number; end: number };
}

interface FormulaSafetyReport {
  hasCycles: boolean;
  complexity: 'low' | 'medium' | 'high';
  estimatedOperations: number;
  divisionRisk: boolean;
  rangeIssues: RangeIssue[];
}

interface RangeIssue {
  stat: string;
  issue: 'negative_input' | 'zero_division' | 'overflow_risk';
  message: string;
}

interface FormulaContext {
  stats: Record<string, { min: number; max: number; current: number }>;
  maxOperations?: number;
  allowNegative?: boolean;
}
```

### Undo/Redo Event

```typescript
interface UndoRedoEvent {
  eventType: 'undo_redo';
  timestamp: string;
  sessionId: string;
  operation: 'undo' | 'redo';
  snapshotId: string;
  beforeState: ConfigSnapshot;
  afterState: ConfigSnapshot;
  historySize: number;
  operationDuration: number;
  metadata?: Record<string, unknown>;
}

interface ConfigSnapshot {
  configId: string;
  version: string;
  checksum: string;
  timestamp: string;
}
```

### Stress Testing Event

```typescript
interface StressTestingEvent {
  eventType: 'stress_testing';
  timestamp: string;
  sessionId: string;
  testType: 'archetype_generation' | 'marginal_utility' | 'synergy_analysis' | 'performance';
  testId: string;
  parameters: Record<string, unknown>;
  results: {
    success: boolean;
    duration: number;
    iterations: number;
    dataPoints: number;
    metrics: Record<string, number>;
    errors?: string[];
    warnings?: string[];
  };
  environment: {
    nodeVersion: string;
    platform: string;
    memory: number;
    cpu: number;
  };
  metadata?: Record<string, unknown>;
}
```

## Configuration

### Router Configuration

```typescript
interface EventRouterConfig {
  enableConsoleLogging: boolean;
  enablePersistence: boolean;
  enableTelemetry: boolean;
  maxQueueSize: number;
  fallbackTimeout: number;
  retryAttempts: number;
}

// Configure router
Phase10TelemetryRouter.configure({
  enableConsoleLogging: true,
  enablePersistence: true,
  enableTelemetry: true,
  maxQueueSize: 1000,
  fallbackTimeout: 5000,
  retryAttempts: 3,
});
```

### Hook Configuration

```typescript
interface UseTelemetryRouterOptions {
  enableAutoInit?: boolean;
  sessionId?: string;
  enableConsoleLogging?: boolean;
  enablePersistence?: boolean;
  enableTelemetry?: boolean;
}

// Configure hook
const { emitFormulaSafetyEvent } = useTelemetryRouter({
  enableAutoInit: true,
  sessionId: 'custom-session',
  enableConsoleLogging: true,
  enableTelemetry: true,
});
```

## Collectors

### Built-in Collectors

#### Formula Safety Collector
```typescript
import { FormulaSafetyCollector } from '@/balancing/telemetry/Phase10TelemetryRouter';

const collector = new FormulaSafetyCollector();
Phase10TelemetryRouter.registerCollector(collector);
```

#### Undo/Redo Collector
```typescript
import { UndoRedoCollector } from '@/balancing/telemetry/Phase10TelemetryRouter';

const collector = new UndoRedoCollector();
Phase10TelemetryRouter.registerCollector(collector);
```

#### Stress Testing Collector
```typescript
import { StressTestingCollector } from '@/balancing/telemetry/Phase10TelemetryRouter';

const collector = new StressTestingCollector();
Phase10TelemetryRouter.registerCollector(collector);
```

### Custom Collectors

```typescript
import { type EventCollector, type Phase10Event } from '@/balancing/telemetry/Phase10TelemetryRouter';

class CustomCollector implements EventCollector {
  name = 'custom-collector';
  
  async collect(event: Phase10Event): Promise<boolean> {
    // Custom collection logic
    console.log(`Collecting event: ${event.eventType}`);
    
    // Route to external system
    await this.sendToExternalSystem(event);
    
    return true;
  }
  
  validate(event: Phase10Event): boolean {
    // Custom validation logic
    return event.eventType === 'custom_type';
  }
  
  private async sendToExternalSystem(event: Phase10Event): Promise<void> {
    // Implementation for external system integration
  }
}

// Register custom collector
Phase10TelemetryRouter.registerCollector(new CustomCollector());
```

## Event Processing

### Validation Pipeline

1. **Schema Validation**: Events are validated against Zod schemas
2. **Type Checking**: Event types are verified and routed appropriately
3. **Field Validation**: Required fields are checked for presence and format
4. **Business Rules**: Custom validation rules are applied

### Normalization Process

1. **Timestamp Formatting**: Numbers are converted to ISO strings
2. **Session ID Generation**: Missing session IDs are automatically generated
3. **Metadata Addition**: Processing metadata is added to all events
4. **Version Tracking**: Router version information is included

### Routing Logic

1. **Collector Selection**: Events are matched to appropriate collectors
2. **Validation Check**: Collectors validate event compatibility
3. **Collection Execution**: Events are sent to collectors for processing
4. **Result Aggregation**: Results from all collectors are combined
5. **Error Handling**: Collection errors are logged and reported

### Queue Management

1. **Event Queuing**: Events are queued when no collectors are available
2. **Retry Logic**: Failed events are retried with exponential backoff
3. **Overflow Protection**: Queue size limits prevent memory issues
4. **Processing**: Background processing handles queued events asynchronously

## Error Handling

### Validation Errors

```typescript
const result = await Phase10TelemetryRouter.routeEvent(invalidEvent);

if (!result.success) {
  console.error('Event validation failed:', result.errors);
  console.error('Event warnings:', result.warnings);
}
```

### Collection Errors

```typescript
// Collector errors are logged but don't stop processing
const result = await Phase10TelemetryRouter.routeEvent(event);

if (result.errors.length > 0) {
  console.warn('Collection errors occurred:', result.errors);
}
```

### Queue Errors

```typescript
// Queue overflow is handled gracefully
const stats = Phase10TelemetryRouter.getStatistics();
if (stats.queueSize > stats.config.maxQueueSize * 0.9) {
  console.warn('Queue approaching capacity limit');
}
```

## Monitoring and Statistics

### Router Statistics

```typescript
const stats = Phase10TelemetryRouter.getStatistics();

console.log('Router Statistics:', {
  collectorsCount: stats.collectorsCount,
  queueSize: stats.queueSize,
  isProcessing: stats.isProcessing,
  registeredCollectors: stats.registeredCollectors,
});
```

### Health Status

```typescript
const health = Phase10TelemetryRouter.getHealthStatus();

console.log('Health Status:', {
  status: health.status,
  queueSize: health.queueSize,
  collectorsCount: health.collectorsCount,
  uptime: health.uptime,
  memory: health.memory,
});
```

### Telemetry Events

```typescript
// Router emits telemetry events for monitoring
// These are automatically saved to persistence

// Example telemetry event structure
{
  "event": "balancer_phase10_event_routed",
  "timestamp": "2023-01-19T12:00:00.000Z",
  "data": {
    "originalEvent": { /* original event */ },
    "routingResults": [
      {
        "success": true,
        "routed": true,
        "errors": [],
        "warnings": [],
        "duration": 150,
        "collector": "formula_safety"
      }
    ],
    "routerConfig": { /* router configuration */ },
    "queueSize": 0,
    "isProcessing": false
  }
}
```

## Performance Considerations

### Event Processing

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Small Event | < 10ms | Simple validation and routing |
| Complex Event | < 50ms | Full validation with multiple collectors |
| Queue Processing | < 100ms | Background processing |
| Batch Operations | < 500ms | Multiple events processed together |

### Memory Usage

- **Queue Size**: Configurable (default: 1000 events)
- **Collector Memory**: Depends on collector implementation
- **Event Size**: Typically 1-5KB per event
- **Router Overhead**: Minimal (state management only)

### Optimization Tips

1. **Configure Appropriate Queue Size**: Balance between memory usage and reliability
2. **Use Efficient Collectors**: Avoid heavy processing in collectors
3. **Batch Operations**: Process multiple events together when possible
4. **Monitor Queue Size**: Watch for queue buildup and adjust accordingly
5. **Enable Telemetry**: Use telemetry for production monitoring

## Best Practices

### Event Design

1. **Keep Events Small**: Include only necessary data
2. **Use Strong Typing**: Leverage TypeScript for type safety
3. **Include Context**: Add relevant context information
4. **Version Events**: Include version information for compatibility
5. **Document Schemas**: Provide clear documentation for event structures

### Collector Implementation

1. **Handle Errors Gracefully**: Don't let collector failures stop processing
2. **Validate Events**: Implement proper validation logic
3. **Use Async Operations**: Avoid blocking the event processing pipeline
4. **Log Appropriately**: Use appropriate log levels for different scenarios
5. **Test Thoroughly**: Include comprehensive test coverage

### Router Usage

1. **Configure Early**: Configure router before first use
2. **Handle Errors**: Always check result.success and result.errors
3. **Monitor Performance**: Use statistics and health status for monitoring
4. **Clean Up Properly**: Shutdown router when no longer needed
5. **Test Integration**: Include router testing in integration tests

## Troubleshooting

### Common Issues

#### Events Not Being Routed
```typescript
// Check if collectors are registered
const collectors = Phase10TelemetryRouter.getCollectors();
console.log('Registered collectors:', collectors);

// Check if event validation is failing
const result = Phase10TelemetryRouter.routeEvent(event);
if (!result.success) {
  console.error('Validation errors:', result.errors);
}
```

#### Queue Building Up
```typescript
// Check queue size
const stats = Phase10TelemetryRouter.getStatistics();
if (stats.queueSize > stats.config.maxQueueSize * 0.8) {
  console.warn('Queue approaching capacity limit');
  
  // Consider increasing queue size or processing rate
  Phase10TelemetryRouter.configure({
    maxQueueSize: stats.config.maxQueueSize * 2,
  });
}
```

#### Collector Errors
```typescript
// Check collector health
const health = Phase10TelemetryRouter.getHealthStatus();
console.log('Router health:', health);

// Check recent routing results
const result = Phase10TelemetryRouter.routeEvent(event);
if (result.errors.length > 0) {
  console.error('Collection errors:', result.errors);
}
```

### Debug Mode

```typescript
// Enable console logging for debugging
Phase10TelemetryRouter.configure({
  enableConsoleLogging: true,
});

// Enable detailed telemetry
Phase10TelemetryRouter.configure({
  enableTelemetry: true,
});

// Monitor router statistics
const stats = Phase10TelemetryRouter.getStatistics();
console.log('Router stats:', stats);
```

## Integration Examples

### Formula Editor Integration

```typescript
import { useFormulaSafetyTelemetry } from '@/ui/balancing/hooks/useTelemetryRouter';

function FormulaEditor() {
  const { emitFormulaSafetyEvent } = useFormulaSafetyTelemetry();
  
  const handleFormulaChange = async (formula: string) => {
    // Validate formula
    const validation = validateFormula(formula);
    
    // Emit telemetry event
    await emitFormulaSafetyEvent({
      formulaId: 'formula-1',
      formula,
      validation,
      context: {
        stats: getCurrentStats(),
      maxOperations: 1000,
        allowNegative: false,
      },
    });
  };
  
  return <FormulaInput onChange={handleFormulaChange} />;
}
```

### History Management Integration

```typescript
import { useUndoRedoTelemetry } from '@/ui/balancing/hooks/useTelemetryRouter';

function HistoryManager() {
  const { emitUndoRedoEvent } = useUndoRedoTelemetry();
  
  const handleUndo = async (snapshotId: string) => {
    const beforeState = getSnapshotBefore(snapshotId);
    const afterState = getCurrentState();
    
    await emitUndoRedoEvent({
      operation: 'undo',
      snapshotId,
      beforeState,
      afterState,
      historySize: getHistorySize(),
      operationDuration: performance.now() - startTime,
    });
  };
  
  return <HistoryControls onUndo={handleUndo} />;
}
```

### Stress Testing Integration

```typescript
import { useStressTestingTelemetry } from '@/ui/balancing/hooks/useTelemetryRouter';

function StressTestRunner() {
  const { emitStressTestingEvent } = useStressTestingTelemetry();
  
  const runStressTest = async (testConfig: StressTestConfig) => {
    const startTime = Date.now();
    
    try {
      const results = await runStressTest(testConfig);
      
      await emitStressTestingEvent({
        testType: testConfig.type,
        testId: testConfig.id,
        parameters: testConfig.parameters,
        results: {
          success: true,
          duration: Date.now() - startTime,
          iterations: results.iterations,
          dataPoints: results.dataPoints,
          metrics: results.metrics,
        },
        environment: getEnvironmentInfo(),
      });
    } catch (error) {
      await emitStressTestingEvent({
        testType: testConfig.type,
        testId: testConfig.id,
        parameters: testConfig.parameters,
        results: {
          success: false,
          duration: Date.now() - startTime,
          iterations: 0,
          dataPoints: 0,
          metrics: {},
          errors: [error.message],
        },
        environment: getEnvironmentInfo(),
      });
    }
  };
  
  return <StressTestControls onRun={runStressTest} />;
}
```

## Migration Guide

### From Direct Telemetry

**Before:**
```typescript
// Direct telemetry emission
await saveData('telemetry_formula_safety', {
  event: 'formula_safety',
  data: formulaData,
  timestamp: new Date().toISOString(),
});
```

**After:**
```typescript
// Router-based telemetry emission
await Phase10TelemetryRouter.routeEvent({
  eventType: 'formula_safety',
  timestamp: new Date().toISOString(),
  sessionId: 'session-123',
  formulaId: 'formula-1',
  formula: formulaData.formula,
  validation: formulaData.validation,
  context: formulaData.context,
});
```

### From Multiple Telemetry Systems

**Before:**
```typescript
// Multiple telemetry systems
await saveData('formula_safety_events', formulaData);
await sendToAnalytics(formulaData);
await logToConsole(formulaData);
```

**After:**
```typescript
// Single router system
await Phase10TelemetryRouter.routeEvent({
  eventType: 'formula_safety',
  ...formulaData,
});

// Router handles all routing automatically
```

## API Reference

### Phase10TelemetryRouter Class

#### Static Methods

- **configure(config: Partial<EventRouterConfig>)**: Configure router settings
- **routeEvent(event: Phase10Event)**: Route a single event
- **routeEventAsync(event: Phase10Event)**: Route event asynchronously (with queuing)
- **registerCollector(collector: EventCollector)**: Register an event collector
- **unregisterCollector(name: string)**: Unregister an event collector
- **getCollectors()**: Get list of registered collectors
- **getStatistics()**: Get router statistics
- **getHealthStatus()**: Get router health status
- **clearQueue()**: Clear event queue
- **shutdown()**: Shutdown router and clean up resources

#### Configuration Options

```typescript
interface EventRouterConfig {
  enableConsoleLogging: boolean;    // Enable console logging
  enablePersistence: boolean;      // Enable persistence
  enableTelemetry: boolean;       // Enable telemetry emission
  maxQueueSize: number;           // Maximum queue size
  fallbackTimeout: number;         // Fallback timeout (ms)
  retryAttempts: number;           // Retry attempts
}
```

### Event Collector Interface

```typescript
interface EventCollector {
  name: string;
  collect(event: Phase10Event): Promise<boolean>;
  validate(event: Phase10Event): boolean;
}
```

### Event Processing Result

```typescript
interface EventProcessingResult {
  success: boolean;
  routed: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
  collector: string;
}
```

### React Hook Return Value

```typescript
interface UseTelemetryRouterReturn {
  // Event emission functions
  emitFormulaSafetyEvent: (event: Omit<FormulaSafetyEvent, 'timestamp' | 'sessionId'>) => Promise<void>;
  emitUndoRedoEvent: (event: Omit<UndoRedoEvent, 'timestamp' | 'sessionId'>) => Promise<void>;
  emitStressTestingEvent: (event: Omit<StressTestingEvent, 'timestamp' | 'sessionId'>) => Promise<void>;
  emitEvent: (event: Omit<Phase10Event, 'timestamp' | 'sessionId'>) => Promise<void>;
  
  // Router status
  isInitialized: boolean;
  statistics: ReturnType<typeof Phase10TelemetryRouter.getStatistics>;
  healthStatus: ReturnType<typeof Phase10TelemetryRouter.getHealthStatus>;
  
  // Session management
  sessionId: string;
  generateNewSessionId: () => string;
  
  // Router control
  configure: (config: Parameters<typeof Phase10TelemetryRouter.configure>[0]) => void;
  shutdown: () => void;
  clearQueue: () => number;
}
```

## Security Considerations

### Data Protection

- **Validation**: All events are validated before processing
- **Sanitization**: Event payloads are normalized and sanitized
- **Type Safety**: Strong typing prevents runtime errors
- **Error Boundaries**: Errors are contained and logged appropriately

### Access Control

- **Collector Registration**: Only registered collectors can receive events
- **Configuration**: Router settings control behavior
- **Session Management**: Session IDs are automatically generated and managed
- **Telemetry Control**: Telemetry emission can be disabled

### Performance Protection

- **Queue Limits**: Queue size prevents memory exhaustion
- **Retry Limits**: Retry attempts prevent infinite loops
- **Timeout Protection**: Fallback timeouts prevent hanging operations
- **Resource Management**: Automatic cleanup prevents resource leaks

## Testing

### Unit Tests

```typescript
// Test event validation
describe('Event Validation', () => {
  it('should validate formula safety event', () => {
    const result = Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
    expect(result.success).toBe(true);
  });
  
  it('should reject invalid event', () => {
    const result = Phase10TelemetryRouter.routeEvent(invalidEvent);
    expect(result.success).toBe(false);
  });
});
```

### Integration Tests

```typescript
// Test end-to-end routing
describe('Integration Tests', () => {
  it('should route events to correct collectors', async () => {
    const result = await Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
    expect(result.collector).toBe('formula_safety');
  });
});
```

### Performance Tests

```typescript
// Test performance under load
describe('Performance Tests', () => {
  it('should handle high volume events efficiently', async () => {
    const events = Array(1000).fill(null).map(createMockEvent);
    const startTime = Date.now();
    
    await Promise.all(events.map(event => Phase10TelemetryRouter.routeEvent(event)));
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000);
  });
});
```

## Future Enhancements

### Planned Features

- **Event Filtering**: Client-side event filtering before routing
- **Event Transformation**: Event payload transformation capabilities
- **Batch Processing**: Optimized batch event processing
- **Real-time Monitoring**: Real-time event monitoring dashboard
- **Advanced Analytics**: Advanced analytics and reporting

### Extension Points

- **Custom Collectors**: Plugin-based collector system
- **Event Transformers**: Event transformation pipeline
- **Validation Rules**: Custom validation rule engine
- **Output Formats**: Multiple output format support
- **Integration APIs**: External system integration APIs

## Support

### Getting Help

- **Documentation**: This comprehensive guide covers all aspects of the telemetry router
- **Code Examples**: Extensive examples throughout the documentation
- **API Reference**: Complete API reference for all classes and interfaces
- **Troubleshooting**: Common issues and solutions

### Reporting Issues

When reporting issues, please include:
- Event type and structure
- Router configuration
- Error messages and stack traces
- Environment details
- Expected vs actual behavior

### Contributing

When contributing to the telemetry router:
- Follow the existing code style and patterns
- Add comprehensive tests for new features
- Update documentation for API changes
- Include JSDoc comments for all public methods
- Test with different event types and configurations

---

**Version**: 1.0.0  
**Author**: Vector-Balancer  
**Last Updated**: 2023-01-20  
**Compatibility**: Node.js 20+, TypeScript 4.8+
