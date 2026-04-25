# Crew Scheduler Alert Rules - NP-031

## Overview

The Crew Scheduler Alert Rules system provides configurable, real-time monitoring and alerting for Idle Village crew operations. This system evaluates crew metrics against user-defined rules and triggers alerts in the Active HUD when conditions are met.

## Features

### Configurable Alert Rules
- **Rule Types**: Fatigue thresholds, crew imbalance, queue overload, response time, injury rate, exhaustion rate, activity bottlenecks, priority backlog
- **Condition Operators**: Greater than, less than, equal, percentage comparisons
- **Severity Levels**: Info, Warning, Error, Critical
- **Alert Levels**: None, Low, Medium, High, Critical
- **Cooldown Periods**: Prevent alert spam with configurable cooldowns
- **Message Templates**: Dynamic message formatting with metric variables

### Real-time Monitoring
- **Crew Metrics**: Fatigue levels, status distribution, queue metrics, response times
- **Automatic Evaluation**: Periodic rule evaluation against current state
- **Alert History**: Persistent alert history with retention policies
- **Statistics**: Alert analytics and reporting

### Integration Points
- **Active HUD**: Seamless integration with existing HUD system
- **PersistenceService**: Config persistence and alert history storage
- **Crew Scheduler Controller**: Real-time crew state monitoring
- **Telemetry**: Optional alert tracking and analytics

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Crew Alert Rules System                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Crew State → Metrics Calculation → Rule Evaluation     │
│       ↓              ↓                  ↓             │
│   Controller    CrewMetrics        AlertEngine         │
│       ↓              ↓                  ↓             │
│   Real-time    Statistical       ConditionCheck        │
│   Updates       Aggregation        CooldownMgmt        │
│                                                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Configuration System                │ │
│  │  • Rule Definitions  • Thresholds  • Templates      │ │
│  │  • Cooldown Settings • Persistence • Tags           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 Alert Pipeline                      │ │
│  │  • Alert Generation  • Message Formatting           │ │
│  │  • HUD Integration   • History Management          │ │
│  │  • Statistics        • Cleanup & Retention          │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Configuration

### Alert Rule Structure

```typescript
interface CrewAlertRule {
  id: string;                    // Unique identifier
  type: CrewAlertRuleType;       // Rule category
  name: string;                  // Display name
  description: string;           // Rule description
  enabled: boolean;              // Active/inactive
  severity: CrewAlertRuleSeverity; // Impact level
  alertLevel: CrewAlertLevel;    // HUD alert level
  conditions: CrewAlertCondition[]; // Evaluation conditions
  cooldownMs: number;            // Cooldown period
  showNotification: boolean;     // Desktop notifications
  addToHUD: boolean;             // Add to HUD queue
  messageTemplate?: string;      // Custom message template
  tags: string[];                // Categorization tags
  priority: number;             // Rule priority (0-100)
}
```

### Condition Structure

```typescript
interface CrewAlertCondition {
  field: string;                 // Metric field name
  operator: ConditionOperator;   // Comparison operator
  threshold: number;             // Threshold value
  secondaryThreshold?: number;   // Range condition upper bound
  timeWindow?: number;           // Temporal condition window
}
```

### Default Rules

The system includes 8 pre-configured alert rules:

1. **High Fatigue Alert** - Triggers when average fatigue > 70% and crew exhausted
2. **Critical Fatigue Alert** - Triggers when ≥2 crew exhausted and average fatigue > 85%
3. **Crew Imbalance Alert** - Triggers when <30% of crew is working
4. **Queue Overload Alert** - Triggers when queue ≥5 and wait time >30s
5. **Slow Response Alert** - Triggers when response time >20s
6. **High Injury Rate Alert** - Triggers when >20% of crew injured
7. **Activity Bottleneck Alert** - Triggers when activities are bottlenecked
8. **Priority Backlog Alert** - Triggers when high-priority tasks are backlogged

## Usage Examples

### Basic Hook Usage

```typescript
import { useCrewAlertRules } from '@/ui/idleVillage/hooks/useCrewAlertRules';
import { crewSchedulerController } from '@/ui/idleVillage/controllers/CrewSchedulerController';

function CrewMonitoringComponent() {
  const {
    config,
    alerts,
    metrics,
    enabled,
    updateConfig,
    addRule,
    updateRule,
    removeRule,
    toggleRule,
    clearAlerts,
    dismissAlert,
    getAlertStats,
  } = useCrewAlertRules({ 
    controller: crewSchedulerController,
    debug: true 
  });

  return (
    <div>
      <h2>Crew Alerts ({alerts.length})</h2>
      {alerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} onDismiss={dismissAlert} />
      ))}
      
      <CrewMetricsDisplay metrics={metrics} />
      <AlertStatistics stats={getAlertStats()} />
    </div>
  );
}
```

### Custom Alert Rule

```typescript
// Add a custom rule for low crew availability
const customRule = {
  type: 'crew_imbalance',
  name: 'Critical Staff Shortage',
  description: 'Alert when crew availability is critically low',
  enabled: true,
  severity: 'critical',
  alertLevel: 'critical',
  conditions: [
    {
      field: 'availableCount',
      operator: '<=',
      threshold: 1, // Only 1 or 0 crew available
    },
    {
      field: 'totalCrew',
      operator: '>',
      threshold: 2, // Only if we have more than 2 total crew
    },
  ],
  cooldownMs: 120000, // 2 minutes
  showNotification: true,
  addToHUD: true,
  messageTemplate: 'CRITICAL: Only {{availableCount}}/{{totalCrew}} crew available!',
  tags: ['critical', 'staffing'],
  priority: 95,
};

addRule(customRule);
```

### Configuration Updates

```typescript
// Update global settings
updateConfig({
  enabled: true,
  maxAlertHistory: 200,
  defaultCooldownMs: 45000,
  notifications: {
    enableDesktop: true,
    enableSound: true,
    soundVolume: 0.7,
  },
});

// Modify existing rule
updateRule('fatigue-high', {
  threshold: 0.65, // Lower fatigue threshold
  cooldownMs: 90000, // Longer cooldown
});
```

### Alert Statistics

```typescript
const stats = getAlertStats();
console.log(`Total alerts: ${stats.total}`);
console.log(`Active alerts: ${stats.active}`);
console.log('By level:', stats.byLevel);
console.log('By severity:', stats.bySeverity);

// Output:
// Total alerts: 15
// Active alerts: 3
// By level: { high: 2, medium: 1 }
// By severity: { warning: 2, error: 1 }
```

## Crew Metrics

The system tracks the following metrics for rule evaluation:

| Metric | Type | Description |
|--------|------|-------------|
| `totalCrew` | number | Total crew members |
| `availableCount` | number | Available crew members |
| `workingCount` | number | Currently working crew |
| `restingCount` | number | Currently resting crew |
| `injuredCount` | number | Injured crew members |
| `exhaustedCount` | number | Exhausted crew members |
| `averageFatigue` | number | Average fatigue (0-1) |
| `queueSize` | number | Activities in queue |
| `averageWaitTime` | number | Average queue wait time (ms) |
| `averageResponseTime` | number | Average response time (ms) |
| `pendingCount` | number | Pending tasks |
| `injuryRate` | number | Injury rate (0-1) |
| `exhaustionRate` | number | Exhaustion rate (0-1) |
| `bottleneckActivities` | number | Bottlenecked activities |
| `queueUtilization` | number | Queue utilization (0-1) |
| `highPriorityBacklog` | number | High-priority backlog |
| `averagePriority` | number | Average priority score |

## Message Templates

Alert messages support variable substitution using double curly braces:

```typescript
// Template: "Crew fatigue is high: {{exhaustedCount}} exhausted, {{averageFatigue}}% average"
// Result: "Crew fatigue is high: 2 exhausted, 75% average"

// Template: "Queue overloaded: {{queueSize}} activities waiting"
// Result: "Queue overloaded: 7 activities waiting"

// Template: "High injury rate: {{injuredCount}}/{{totalCrew}} crew injured"
// Result: "High injury rate: 3/8 crew injured"
```

Available variables correspond to the crew metrics fields.

## Rule Evaluation

### Condition Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `>` | Greater than | `fatigue > 0.8` |
| `>=` | Greater than or equal | `exhaustedCount >= 2` |
| `<` | Less than | `availableCount < 2` |
| `<=` | Less than or equal | `workingCount <= 1` |
| `==` | Equal | `injuredCount == 0` |
| `!=` | Not equal | `queueSize != 0` |
| `%>` | Percentage greater than | `injuryRate %> 0.2` |
| `%<` | Percentage less than | `exhaustionRate %< 0.1` |

### Rule Logic

1. **Condition Evaluation**: All conditions must be met (AND logic)
2. **Cooldown Check**: Rule must not be in cooldown period
3. **Alert Generation**: Create alert with formatted message
4. **Cooldown Update**: Set rule cooldown timestamp
5. **HUD Integration**: Add alert to Active HUD if enabled
6. **Persistence**: Save alert to history

### Performance Considerations

- Rules are evaluated every 5 seconds by default
- Cooldown periods prevent alert spam
- Metrics are calculated once per evaluation cycle
- Alert history is automatically cleaned up based on retention policy

## Persistence

### Configuration Storage

```typescript
// Storage key: 'crew_alert_rules_config'
const config = {
  enabled: true,
  rules: [...],
  maxAlertHistory: 100,
  // ... other settings
};
```

### Alert History Storage

```typescript
// Storage key: 'crew_alerts_history'
const alerts = [
  {
    id: 'alert_fatigue-high_1642678800000',
    ruleId: 'fatigue-high',
    ruleName: 'High Fatigue Alert',
    alertLevel: 'high',
    message: 'Crew fatigue is high: 2 exhausted, 75% average',
    timestamp: 1642678800000,
    severity: 'warning',
    active: true,
    context: { /* metrics snapshot */ },
    tags: ['fatigue', 'health'],
  },
  // ... more alerts
];
```

## Testing

### Unit Tests

The system includes comprehensive unit tests covering:

- Configuration initialization and persistence
- Rule evaluation logic and conditions
- Alert generation and management
- Error handling and edge cases
- Statistics and reporting

### Test Coverage

```bash
# Run crew alert rules tests
npm run test -- tests/unit/idleVillage/CrewAlertRules.test.tsx

# Run with coverage
npm run test -- tests/unit/idleVillage/CrewAlertRules.test.tsx --coverage
```

### Mock Data

Tests use mock crew scheduler controller data:

```typescript
const mockController = {
  getState: () => ({
    residents: [
      { id: '1', status: 'working', fatigue: 0.8, responseTime: 15000 },
      { id: '2', status: 'exhausted', fatigue: 0.95, responseTime: 25000 },
    ],
    queue: [
      { id: 'q1', priority: 0.8, waitTime: 35000, started: false },
    ],
    activities: [
      { type: 'work', count: 2 },
      { type: 'rest', count: 1 },
    ],
  }),
};
```

## Integration with Active HUD

Alerts are automatically integrated with the Active HUD system:

```typescript
// Alert structure for HUD
interface CrewAlert {
  id: string;
  ruleName: string;
  alertLevel: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  active: boolean;
  context: Record<string, any>;
  tags: string[];
}
```

The HUD displays alerts with appropriate styling based on alert level and provides dismiss functionality.

## Best Practices

### Rule Design

1. **Specific Conditions**: Use precise thresholds to avoid false positives
2. **Appropriate Cooldowns**: Set cooldowns based on alert frequency and urgency
3. **Clear Messages**: Use descriptive message templates with relevant metrics
4. **Logical Grouping**: Use tags to categorize related alerts
5. **Priority Ordering**: Set higher priorities for more critical alerts

### Performance

1. **Limit Rules**: Avoid too many simultaneous rules (recommend <20)
2. **Optimize Conditions**: Use simple, fast-evaluating conditions
3. **Reasonable Cooldowns**: Prevent excessive alert generation
4. **Monitor Metrics**: Track alert frequency and system performance

### Maintenance

1. **Regular Review**: Periodically review and update rule thresholds
2. **Alert Audit**: Monitor alert history for patterns and adjustments
3. **User Feedback**: Collect feedback on alert usefulness and accuracy
4. **Documentation**: Keep rule documentation updated with changes

## Troubleshooting

### Common Issues

1. **Alerts Not Triggering**
   - Check if rules are enabled
   - Verify metric values and thresholds
   - Check cooldown periods
   - Ensure controller state is updating

2. **Too Many Alerts**
   - Increase cooldown periods
   - Adjust thresholds to be less sensitive
   - Disable unnecessary rules
   - Check for rule conflicts

3. **Performance Issues**
   - Reduce number of rules
   - Optimize condition logic
   - Increase evaluation interval
   - Monitor metrics calculation

4. **Persistence Issues**
   - Check PersistenceService functionality
   - Verify storage quota
   - Clear corrupted data
   - Check for save/load errors

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const { alerts, metrics } = useCrewAlertRules({ 
  controller: crewSchedulerController,
  debug: true // Enables console logging
});
```

## Future Enhancements

### Planned Features

1. **Advanced Conditions**: Range conditions, temporal patterns, trend analysis
2. **Alert Aggregation**: Group similar alerts and provide summaries
3. **Machine Learning**: Predictive alerting based on historical patterns
4. **Custom Actions**: Automated responses to specific alerts
5. **Dashboard Integration**: Web-based alert management interface
6. **Multi-Channel Notifications**: Email, SMS, Slack integration
7. **Alert Escalation**: Progressive alert severity over time
8. **Performance Analytics**: Detailed alert system performance metrics

### Extension Points

The system is designed for extensibility:

- **Custom Rule Types**: Add new rule categories
- **Custom Metrics**: Define additional crew metrics
- **Custom Actions**: Implement alert response automation
- **Custom Notifications**: Add new notification channels
- **Custom UI Components**: Create specialized alert displays

## Conclusion

The Crew Scheduler Alert Rules system provides a robust, configurable foundation for real-time crew monitoring and alerting in Idle Village. With its config-first design, comprehensive rule engine, and seamless HUD integration, it enables proactive management of crew operations and helps maintain optimal village productivity.

The system follows RPG Balancer philosophy with proper type safety, comprehensive testing, detailed documentation, and extensible architecture for future enhancements.
