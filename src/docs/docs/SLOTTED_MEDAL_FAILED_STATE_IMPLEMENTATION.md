# SlottedMedal Failed State Implementation

## Overview

This document describes the implementation of the `failed` state for SlottedMedal components, enabling proper visual and behavioral feedback when activities fail in the Idle Village meta-game.

## Implementation Details

### 1. Type System Extensions

#### New Types Added
```typescript
// UI state for slot activity mapping from engine states
export type SlotActivityUIState = 'idle' | 'active' | 'locked' | 'completing' | 'failed' | 'done';

// Failure type classification for failed activities
export type ActivityFailureType = 'injury' | 'death' | 'mission_failure';

// Complete slot state combining UI state with metadata
export interface SlotActivityState {
  state: SlotActivityUIState;
  progress: number;
  remainingSeconds: number;
  isLockedByPhase: boolean;
  failureType?: ActivityFailureType;
  engineState?: ScheduledActivityState['status'];
}
```

### 2. State Mapping Utility

#### File: `src/ui/idleVillage/utils/slotStateMapping.ts`

Created a comprehensive mapping utility that converts engine states to UI states:

```typescript
export function resolveSlotState(
  scheduledState: ScheduledActivityState | null,
  isLockedByPhase: boolean,
  activityContext?: any
): SlotActivityState
```

**Key Features:**
- Maps engine `'failed'` status to UI `'failed'` state
- Handles phase lock precedence
- Calculates remaining time and progress
- Determines failure type from context

### 3. Medal Behavior Enhancements

#### Updated `useSlottedMedalBehavior` Hook

**New State Added:**
```typescript
export type MedalState = 'empty' | 'landing' | 'idle' | 'active' | 'locked' | 'unlocking' | 'failed';
```

**New Method Added:**
```typescript
handleFailed: (failureType?: 'injury' | 'death' | 'mission_failure') => void;
```

**Failed State Animation:**
- Shake animation with X/Y displacement
- Progressive opacity fade
- Brightness reduction
- Sound feedback based on failure type
- Auto-reset after 1.2s

### 4. Component Integration

#### Updated `ResidentSlotRack`

**New Props:**
```typescript
interface ResidentSlotRackProps {
  // ... existing props
  getSlotActivityState?: (slotId: string) => SlotActivityState | null;
}
```

**New Behavior:**
- Monitors activity state changes via `useEffect`
- Triggers medal animations based on state
- Emits telemetry events for failures
- Passes activity state to `DetailSlot` components

#### Updated `SlottedMedal`

**Enhanced with `forwardRef`:**
- Exposes behavior controls via `useImperativeHandle`
- Enables external control of failed state animations
- Maintains existing drag/drop functionality

### 5. Telemetry Integration

#### New Events Added

**Slot Activity Failed:**
```typescript
trackTelemetryEvent('slot_activity_failed', {
  slotId: string,
  residentId: string,
  failureType: ActivityFailureType,
  progress: number,
  timestamp: number,
});
```

**Existing Events Enhanced:**
- `slot_medal_dropped` - unchanged
- `slot_medal_detached` - unchanged

## Usage Examples

### Basic Integration

```typescript
// In your component that renders ResidentSlotRack
const getSlotActivityState = useCallback((slotId: string) => {
  const scheduledState = scheduler.getActivityState(activityId, residentId);
  const isLockedByPhase = !isDayPhase && !isCycleControl;
  
  return resolveSlotState(scheduledState, isLockedByPhase);
}, [scheduler, isDayPhase]);

<ResidentSlotRack
  slots={slots}
  getSlotActivityState={getSlotActivityState}
  // ... other props
/>
```

### Manual Failure Trigger

```typescript
// Access medal behavior controls via ref
const medalRef = useRef<MedalBehaviorControls>(null);

// Trigger failed animation
medalRef.current?.handleFailed('injury');
```

## Visual Design

### Failed State Animation Sequence

1. **Shake Phase (0-0.3s):** X/Y displacement
2. **Fade Phase (0.3-0.8s):** Opacity and brightness reduction  
3. **Hold Phase (0.8-1.2s):** Maintain failed appearance
4. **Reset Phase:** Return to empty state

### Color Scheme

- **Injury:** Red tint with shake animation
- **Death:** Dark red with prolonged fade
- **Mission Failure:** Amber with standard shake

## Configuration

### Behavior Configuration

All behavior parameters are configurable via `slottedMedalConfig.ts`:

```typescript
export const DEFAULT_SLOTTED_MEDAL_CONFIG = {
  behavior: {
    resistDurationMs: 600,
    springStiffness: 300,
    springDamping: 30,
    enableSound: true,
  },
  // ... other config sections
};
```

## Testing

### Unit Tests Coverage

- State mapping utility functions
- Medal behavior state transitions
- Component prop integration
- Telemetry event emission

### Integration Tests

- End-to-end activity failure flow
- Medal animation timing
- Sound effect playback
- Ref-based control access

## Migration Guide

### From Previous Implementation

1. **Update Props:** Add `getSlotActivityState` to `ResidentSlotRack`
2. **Import Types:** Import `SlotActivityState` and related types
3. **Implement Mapping:** Use `resolveSlotState` utility for state conversion
4. **Handle Telemetry:** Add failure event tracking

### Backward Compatibility

- All existing functionality preserved
- New props are optional
- No breaking changes to existing APIs

## Future Enhancements

### Planned Features

1. **Failure Context Analysis:** Enhanced failure type detection
2. **Custom Animations:** Per-failure-type animation variants  
3. **Recovery Mechanics:** Interactive failure recovery options
4. **Performance Metrics:** Failure rate tracking and analytics

### Extension Points

- Custom failure sound effects
- Additional failure types
- Visual theme variations
- Animation duration customization

## Troubleshooting

### Common Issues

1. **Missing Ref:** Ensure `forwardRef` is properly implemented
2. **State Not Updating:** Check `getSlotActivityState` implementation
3. **Animation Not Playing:** Verify behavior config and sound settings
4. **Telemetry Not Firing:** Confirm event payload structure

### Debug Tools

- Chrome DevTools React DevTools for state inspection
- Console logging for telemetry events
- Performance tab for animation timing

---

**Implementation Date:** 2026-03-01  
**Version:** 1.0.0  
**Status:** ✅ Complete and Tested
