# Minimal Activity Log Panel

This document describes the Minimal Activity Log Panel component for displaying recent game events and activities in Minimal Gameplay.

## Overview

The Activity Log Panel provides a styled, accessible interface for displaying the most recent activity entries from Minimal Gameplay. It supports configurable severity levels, timestamps, and interactive selection with comprehensive accessibility features.

## Features

- **Config-First Design**: Fully configurable through `ActivityLogPanelConfig`
- **Severity-Based Styling**: Color-coded entries by severity (info, warning, error, success)
- **Interactive Selection**: Clickable entries with keyboard navigation
- **Accessibility**: Full ARIA support, keyboard navigation, screen reader compatibility
- **Style Lab Integration**: Uses HUD tokens for consistent theming
- **Telemetry Integration**: Tracks render and interaction events
- **Responsive Design**: Adapts to content with scrollable overflow

## Architecture

### Components

- **`ActivityLogPanel`**: Main component with props and event handling
- **`ActivityLogPanelConfig`**: Zod schema for configuration validation
- **HUD Tokens**: Integration with `minimalHudTokens` for styling

### Data Flow

```
Activity Entries → Config Validation → Style Resolution → Render → Telemetry
```

## Usage

### Basic Implementation

```typescript
import ActivityLogPanel from '@/ui/idleVillage/components/ActivityLogPanel';
import { MinimalActivityEntry } from '@/ui/idleVillage/config/activityLogPanelConfig';

const activities: MinimalActivityEntry[] = [
  {
    id: 'activity-1',
    timestamp: Date.now(),
    type: 'resource_gained',
    message: 'Gained 50 gold from mining',
    severity: 'success',
    metadata: { amount: 50, resource: 'gold' },
  },
];

function GameHUD() {
  return (
    <ActivityLogPanel
      entries={activities}
      onSelect={(entry) => console.log('Selected:', entry)}
    />
  );
}
```

### With Custom Configuration

```typescript
const customConfig = {
  maxEntries: 8,
  severityPalette: {
    error: {
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      color: '#dc2626',
      icon: '🚫',
    },
  },
  ariaLabels: {
    panelLabel: 'Game Activity Feed',
  },
};

<ActivityLogPanel
  entries={activities}
  config={customConfig}
  isLoading={false}
/>
```

## Configuration

### ActivityLogPanelConfig Schema

```typescript
interface ActivityLogPanelConfig {
  maxEntries: number;              // Maximum entries to display (1-50)
  badgeTokens: {                   // Badge styling
    borderRadius: string;
    padding: string;
    fontSize: string;
    fontWeight: number;
  };
  severityPalette: {               // Severity-specific styling
    [severity: string]: {
      backgroundColor: string;
      color: string;
      icon: string;
    };
  };
  ariaLabels: {                    // Accessibility labels
    panelLabel: string;
    entryLabel: string;
    emptyStateDescription: string;
    loadingLabel: string;
  };
  emptyState: {                    // Empty state content
    title: string;
    description: string;
    icon: string;
  };
}
```

### Default Configuration

The component ships with sensible defaults:

- **maxEntries**: 12 entries
- **Severity Icons**: ℹ️ (info), ✅ (success), ⚠️ (warning), ❌ (error)
- **ARIA Labels**: Comprehensive accessibility support
- **Empty State**: User-friendly "No Recent Activity" message

## Props API

### ActivityLogPanelProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `entries` | `MinimalActivityEntry[]` | Yes | - | Array of activity entries to display |
| `isLoading` | `boolean` | No | `false` | Shows loading state when true |
| `onSelect` | `(entry: MinimalActivityEntry) => void` | No | - | Callback when entry is selected |
| `config` | `Partial<ActivityLogPanelConfig>` | No | - | Custom configuration overrides |

### MinimalActivityEntry

```typescript
interface MinimalActivityEntry {
  id: string;                    // Unique entry identifier
  timestamp: number;             // Unix timestamp
  type: string;                  // Activity type (e.g., 'resource_gained')
  message: string;               // Human-readable message
  severity: 'info' | 'warning' | 'error' | 'success'; // Severity level
  metadata?: Record<string, any>; // Additional data
}
```

## Styling and Theming

### HUD Token Integration

The component uses `resolveHudToken()` for consistent styling:

```typescript
// Background gradient
background: resolveHudToken('gradients.primary');

// Spacing
padding: resolveHudToken('spacing.md');

// Typography
fontSize: resolveHudToken('typography.baseFontSize');
```

### Custom Themes

Override default tokens through configuration:

```typescript
const darkTheme = {
  gradients: {
    primary: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
  },
  spacing: {
    md: '1.25rem',
  },
};

// Apply to component
<ActivityLogPanel config={darkTheme} entries={activities} />
```

## Accessibility

### ARIA Support

- **Role**: `region` for main panel, `button` for entries
- **Labels**: Comprehensive `aria-label` attributes
- **Live Regions**: `aria-live="polite"` for dynamic content
- **Focus Management**: Proper tab order and keyboard navigation

### Keyboard Navigation

- **Tab**: Navigate between entries
- **Enter/Space**: Activate entry selection
- **Screen Readers**: Full compatibility with assistive technologies

### Loading States

```typescript
<ActivityLogPanel
  entries={[]}
  isLoading={true}
/>
// Shows: "Loading activity entries..."
```

## Telemetry

### Automatic Tracking

The component emits telemetry events:

- **`minimal_activity_log_rendered`**: When panel renders
  - `entryCount`: Number of entries displayed
  - `maxEntries`: Configured maximum
  - `isLoading`: Loading state
  - `configVersion`: Configuration version

- **`minimal_activity_log_entry_selected`**: When entry is clicked
  - `entryId`: Unique entry identifier
  - `severity`: Entry severity level
  - `type`: Activity type

### Example Telemetry

```json
{
  "eventType": "minimal_activity_log_rendered",
  "entryCount": 5,
  "maxEntries": 12,
  "isLoading": false,
  "configVersion": "1.0"
}
```

## Entry Display

### Layout Structure

```
┌─ Activity Log ──────────────────────────┐
│ 📝 Gold mining activity started        │
│    5m ago  [info] [activity_started]   │
│                                        │
│ ✅ Gained 50 gold from mining          │
│    10m ago [success] [resource_gained] │
│                                        │
│ ⚠️ Resident fatigue is high            │
│    15m ago [warning] [fatigue_warning] │
└────────────────────────────────────────┘
```

### Timestamp Formatting

- **< 1 minute**: "Just now"
- **< 1 hour**: "5m ago", "30m ago"
- **< 1 day**: "2h ago", "12h ago"
- **≥ 1 day**: "1d ago", "3d ago"

### Severity Indicators

| Severity | Icon | Badge Color | Use Case |
|----------|------|-------------|----------|
| info | ℹ️ | Blue | General information |
| success | ✅ | Green | Positive outcomes |
| warning | ⚠️ | Yellow | Caution required |
| error | ❌ | Red | Problems or failures |

## Integration Patterns

### With Game State

```typescript
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';

// Convert game events to activity entries
function useActivityLog() {
  const events = useMinimalGameplayStore(state => state.state.eventLog);

  return useMemo(() => events.map(event => ({
    id: event.id,
    timestamp: event.timestamp,
    type: event.type,
    message: event.message,
    severity: getSeverityForEvent(event.type),
  })), [events]);
}
```

### With Real-time Updates

```typescript
function LiveActivityPanel() {
  const [activities, setActivities] = useState<MinimalActivityEntry[]>([]);

  useEffect(() => {
    // Subscribe to game events
    const unsubscribe = gameEvents.subscribe((event) => {
      const activity: MinimalActivityEntry = {
        id: event.id,
        timestamp: Date.now(),
        type: event.type,
        message: event.message,
        severity: event.severity,
      };

      setActivities(prev => [activity, ...prev].slice(0, 12));
    });

    return unsubscribe;
  }, []);

  return <ActivityLogPanel entries={activities} />;
}
```

### Error Boundaries

```typescript
class ActivityLogErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="activity-log-error">
          Activity log temporarily unavailable
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ActivityLogErrorBoundary>
  <ActivityLogPanel entries={activities} />
</ActivityLogErrorBoundary>
```

## Performance Considerations

### Rendering Optimization

- **Memoization**: Entries are processed with `useMemo`
- **Virtual Scrolling**: For large entry lists (future enhancement)
- **Debounced Updates**: Prevents excessive re-renders

### Memory Management

- **Entry Limiting**: `maxEntries` prevents memory bloat
- **Cleanup**: Event listeners and timers are properly cleaned up
- **Immutable Updates**: Prevents unnecessary re-renders

## Testing Strategy

### RTL Testing

```typescript
import { render, screen } from '@testing-library/react';

it('renders activity entries', () => {
  render(<ActivityLogPanel entries={mockEntries} />);

  expect(screen.getByText('Gold mining started')).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### Accessibility Testing

```typescript
it('has proper ARIA labels', () => {
  render(<ActivityLogPanel entries={entries} />);

  expect(screen.getByRole('region', { name: 'Activity Log' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Activity entry/ })).toBeInTheDocument();
});
```

### Telemetry Testing

```typescript
it('emits render telemetry', () => {
  render(<ActivityLogPanel entries={entries} />);

  expect(trackTelemetryEvent).toHaveBeenCalledWith('minimal_activity_log_rendered', {
    entryCount: 2,
    maxEntries: 12,
    isLoading: false,
    configVersion: '1.0',
  });
});
```

## Troubleshooting

### Common Issues

#### Entries not displaying
**Check**: Ensure entries conform to `MinimalActivityEntry` interface
**Fix**: Validate entry structure and required fields

#### Styling issues
**Check**: HUD token resolution
**Fix**: Verify `minimalHudTokens` are properly imported

#### Telemetry not firing
**Check**: Telemetry provider configuration
**Fix**: Ensure `trackTelemetryEvent` is properly mocked in tests

#### Accessibility warnings
**Check**: ARIA attributes and keyboard navigation
**Fix**: Run accessibility audit and fix reported issues

## Future Enhancements

### Planned Features

1. **Virtual Scrolling**: For large activity logs
2. **Filtering**: By severity, type, or time range
3. **Search**: Find specific activities
4. **Export**: Save activity logs to file
5. **Real-time Updates**: WebSocket integration
6. **Custom Templates**: Pluggable entry renderers

### Integration Opportunities

- **Notification System**: Activity-based alerts
- **Analytics Dashboard**: Activity pattern analysis
- **Replay System**: Activity log playback
- **Multiplayer**: Shared activity feeds

## API Reference

### Components

#### `ActivityLogPanel`
Main component for displaying activity entries.

**Props**: `ActivityLogPanelProps`

**Returns**: JSX.Element

### Configuration

#### `ActivityLogPanelConfig`
Type-safe configuration interface.

#### `MinimalActivityEntry`
Activity entry data structure.

#### `ActivitySeverity`
Union type for severity levels.

### Hooks

#### `useActivityLog()`
Custom hook for converting game events to activity entries.

## Related Documentation

- [Minimal HUD Tokens](../tokens/minimalHudTokens.md)
- [Style Lab Guidelines](../../docs/style_lab_guidelines.md)
- [Accessibility Guidelines](../../docs/accessibility_guidelines.md)
- [Telemetry Integration](../../analytics/telemetry_integration.md)
