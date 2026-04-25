# Punch Club Combat HUD Analytics

## Overview

The Punch Club Combat HUD Analytics system provides granular telemetry collection and JSON dashboard export for combat interactions. It follows a config-first design with zero hardcoded values and integrates seamlessly with the PersistenceService for data storage.

## Features

### Event Tracking
- **Button Press Events**: Track combat button interactions (attack, defend, special, heal, retreat)
- **Ability Hover Events**: Monitor ability hover states with duration measurement
- **Timer Events**: Track timer lifecycle (start, pause, resume, complete, reset)
- **Latency Measurements**: Real-time performance monitoring with average calculations
- **Combat Session Events**: Session start/end tracking with metadata

### Dashboard Export
- **JSON Export**: Structured telemetry data with validation via Zod schemas
- **CSV Export**: Tabular format for external analysis tools
- **Performance Metrics**: Processing rates, memory usage, data size estimation
- **Aggregated Statistics**: Event counts, averages, most-used actions

### Configuration
- **Config-First Design**: All settings stored in configuration, no hardcoded values
- **Verbose Mode**: Detailed logging for debugging and development
- **Persistence Integration**: Automatic save/load via PersistenceService
- **Event Limits**: Configurable maximum events to prevent memory issues

## Architecture

### Components

#### CombatHUD Component
```typescript
interface CombatHUDProps {
  combatId?: string;
  showLatencyBadge?: boolean;
  telemetryEnabled?: boolean;
  onCombatAction?: (action: string, data?: any) => void;
}
```

The main UI component with minimal logic injection and telemetry integration. Features:
- Combat controls with telemetry tracking
- Real-time latency badge
- Timer display with event tracking
- Telemetry status indicator

#### useCombatHUDTelemetry Hook
```typescript
interface UseCombatHUDTelemetryProps {
  combatId?: string;
  enabled?: boolean;
}
```

Core telemetry hook providing:
- Event emission with Zod validation
- PersistenceService integration
- Configuration management
- Data export functionality

#### CombatHUDAnalytics Class
Analytics engine for dashboard generation:
- Event aggregation and statistics
- JSON/CSV export functionality
- Performance metrics calculation
- Data validation with Zod schemas

## Event Schemas

### Button Press Event
```typescript
{
  eventType: 'button_press',
  timestamp: number,
  combatId?: string,
  buttonId: string,
  action: 'basic_attack' | 'defend_stance' | 'special_move' | 'heal' | 'retreat',
  data?: Record<string, unknown>,
  latency?: number,
}
```

### Ability Hover Event
```typescript
{
  eventType: 'ability_hover',
  timestamp: number,
  combatId?: string,
  abilityId: string,
  action: 'enter' | 'leave',
  hoverDuration?: number,
}
```

### Timer Event
```typescript
{
  eventType: 'timer_event',
  timestamp: number,
  combatId?: string,
  action: 'start' | 'pause' | 'resume' | 'complete' | 'reset',
  timerValue?: number,
  elapsedTime?: number,
}
```

### Latency Measurement Event
```typescript
{
  eventType: 'latency_measurement',
  timestamp: number,
  combatId?: string,
  latency: number,
  averageLatency: number,
  sampleCount: number,
}
```

## Usage Examples

### Basic Combat HUD
```typescript
import CombatHUD from '@/ui/punchClub/components/CombatHUD';

function CombatArena() {
  const handleCombatAction = (action: string, data?: any) => {
    console.log('Combat action:', action, data);
  };

  return (
    <CombatHUD
      combatId="combat-session-123"
      showLatencyBadge={true}
      telemetryEnabled={true}
      onCombatAction={handleCombatAction}
    />
  );
}
```

### Custom Telemetry Hook Usage
```typescript
import { useCombatHUDTelemetry } from '@/ui/punchClub/hooks/useCombatHUDTelemetry';

function CustomCombatComponent() {
  const {
    trackButtonPress,
    trackAbilityHover,
    trackTimerEvent,
    trackLatency,
    startCombatSession,
    endCombatSession,
    events,
    latency,
    exportData,
  } = useCombatHUDTelemetry({
    combatId: 'custom-combat',
    enabled: true,
  });

  // Track custom combat actions
  const handleCustomAction = () => {
    trackButtonPress('custom-button', 'special_move', { power: 100 });
  };

  // Start combat session
  React.useEffect(() => {
    startCombatSession({ mode: 'pvp' });
    return () => endCombatSession({ completed: true });
  }, []);

  return (
    <div>
      <button onClick={handleCustomAction}>Custom Action</button>
      <div>Latency: {latency}ms</div>
      <div>Events: {events.length}</div>
    </div>
  );
}
```

### Analytics Dashboard Export
```typescript
import { createCombatHUDAnalytics, exportTelemetryJSON } from '@/analytics/punchClubHUD';

async function generateCombatReport(events: CombatHUDTelemetryEventData[]) {
  // Create analytics instance
  const analytics = createCombatHUDAnalytics('combat-123');
  analytics.addEvents(events);

  // Export JSON dashboard
  const dashboard = analytics.exportDashboard();
  console.log('Dashboard stats:', dashboard.stats);

  // Export CSV for analysis
  const csv = analytics.exportCSV();
  downloadFile('combat-telemetry.csv', csv);

  // Or use utility functions
  const jsonData = await exportTelemetryJSON(events, 'combat-123');
  const csvData = await exportTelemetryCSV(events, 'combat-123');
}
```

## Configuration

### Default Configuration
```typescript
const DEFAULT_CONFIG = {
  enabled: true,
  verbose: false,
  latencyInterval: 1000,
  maxEvents: 1000,
  persistEvents: true,
};
```

### Updating Configuration
```typescript
const { updateConfig } = useCombatHUDTelemetry();

// Enable verbose logging
updateConfig({ verbose: true });

// Adjust latency measurement interval
updateConfig({ latencyInterval: 500 });

// Disable persistence
updateConfig({ persistEvents: false });
```

## Performance Considerations

### Memory Management
- Events are automatically limited to `maxEvents` configuration
- Latency measurements maintain a rolling buffer of 100 samples
- Hover start times are cleaned up on leave events

### Latency Measurement
- Uses `performance.now()` for high-precision timing
- Automatic average calculation over rolling samples
- Minimal performance impact with configurable intervals

### Persistence
- Asynchronous save/load operations via PersistenceService
- Configurable persistence to disable if not needed
- Automatic cleanup of old events

## Testing

### Unit Tests
```bash
# Run Combat HUD tests
npm run test -- tests/unit/punchClub/CombatHUDTelemetry.test.tsx

# Run analytics tests
npm run test -- src/analytics/punchClubHUD.test.ts
```

### Test Coverage
- Component rendering and interaction
- Hook functionality and configuration
- Event emission and validation
- Analytics calculations and exports
- Persistence integration

## Data Export Formats

### JSON Dashboard Structure
```json
{
  "exportedAt": "2026-01-19T20:00:00.000Z",
  "combatId": "combat-123",
  "events": [...],
  "stats": {
    "totalEvents": 150,
    "buttonPresses": {
      "basic_attack": 45,
      "defend_stance": 30,
      "special_move": 15,
      "heal": 5,
      "retreat": 0
    },
    "abilityHovers": {
      "fireball": 25,
      "heal": 15,
      "shield": 10
    },
    "averageHoverDurations": {
      "fireball": 1250,
      "heal": 800,
      "shield": 600
    },
    "timerEvents": {
      "start": 1,
      "pause": 3,
      "resume": 3,
      "complete": 1,
      "reset": 0
    },
    "latencyStats": {
      "current": 45,
      "average": 52,
      "min": 12,
      "max": 120,
      "sampleCount": 89
    },
    "sessionDuration": 180000,
    "eventsPerSecond": 0.83,
    "mostUsedButton": "basic_attack",
    "mostHoveredAbility": "fireball"
  },
  "performance": {
    "processingRate": 1250,
    "memoryUsage": 30000,
    "dataSize": 12500
  }
}
```

### CSV Format
```csv
timestamp,eventType,combatId,action,buttonId,abilityId,latency,hoverDuration,timerValue,elapsedTime
"1642694400000","button_press","combat-123","basic_attack","attack","45","","",""
"1642694401000","ability_hover","combat-123","enter","","fireball","","",""
"1642694402500","ability_hover","combat-123","leave","","fireball","","1500",""
```

## Integration Points

### PersistenceService
- Configuration storage: `punch_club_hud_telemetry_config`
- Events storage: `punch_club_hud_telemetry_events`
- Async save/load operations with error handling

### Analytics Pipeline
- Compatible with existing STS telemetry infrastructure
- Export formats match analytics dashboard requirements
- Zod schema validation ensures data integrity

### UI Components
- Minimal injection into existing CombatHUD
- Latency badge with color-coded performance indicators
- Telemetry status indicator for debugging

## Troubleshooting

### Common Issues

**Telemetry not tracking events**
- Check `telemetryEnabled` prop and hook configuration
- Verify PersistenceService is functioning
- Check console for validation errors

**High memory usage**
- Reduce `maxEvents` configuration
- Disable `persistEvents` if not needed
- Clear events periodically with `clearEvents()`

**Latency measurements inaccurate**
- Ensure `performance.now()` is available
- Check `latencyInterval` configuration
- Verify browser performance API support

**Export data empty**
- Confirm events are being tracked
- Check combat ID is set correctly
- Verify export functions are called after events

### Debug Mode
Enable verbose logging for detailed telemetry information:
```typescript
updateConfig({ verbose: true });
```

This will log all events to console with full details.

## Future Enhancements

### Planned Features
- Real-time dashboard visualization
- Combat performance metrics
- Advanced filtering and search
- Integration with external analytics platforms
- Combat replay functionality

### Extension Points
- Custom event types and schemas
- Additional performance metrics
- Third-party analytics integrations
- Real-time streaming capabilities
