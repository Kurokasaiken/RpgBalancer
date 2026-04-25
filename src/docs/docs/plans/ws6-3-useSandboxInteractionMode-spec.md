# WS6.3 useSandboxInteractionMode Specification

**Status:** Completed — Specification document for cross-device interaction & picker alignment
**Owner:** Cascade (Village Sandbox pod)
**Last Updated:** 2026-01-11

## Overview

The `useSandboxInteractionMode` hook is the central adapter for unified cross-device UX in the Village Sandbox. It provides a config-first interface for managing interaction modes (desktop drag vs mobile tap) while maintaining consistent picker alignment, telemetry, and KPI tracking.

This specification documents the hook's API, behavior, and integration patterns to ensure consistent implementation across the Idle Village ecosystem.

## Core Concepts

### Interaction Modes

| Mode | Device Type | Primary Interaction | Picker Behavior |
|------|-------------|---------------------|-----------------|
| `desktop` | Mouse/Keyboard | Drag & Drop | Inline chips, no overlay |
| `mobile` | Touch devices | Tap-first | Overlay picker sheet |

### Picker Alignment

The picker maintains consistent positioning and behavior across devices:

- **Desktop**: Inline chip selection, keyboard navigation
- **Mobile**: Bottom sheet overlay, touch-optimized CTAs
- **Alignment**: Always centers on target slot, respects safe areas

## Hook API Specification

### Parameters

```typescript
interface UseSandboxInteractionModeParams {
  // Core configuration
  forceMode?: InteractionMode;        // Override auto-detection
  isMobile?: boolean;                // Mobile detection override

  // Event callbacks
  handleResidentSelect?: (residentId: string) => void;
  onDesktopSlotFocus?: (slotId: string | null) => void;
  onPickerOpen?: (slotId: string | null, source: InteractionSource) => void;
  onPickerClose?: (slotId: string | null, reason?: string) => void;
  onResidentAssign?: (slotId: string | null, residentId: string, tapCount: number) => void;

  // Diagnostics
  enableDiagnostics?: boolean;
  diagnosticsScope?: string;
}
```

### Return Interface

```typescript
interface UseSandboxInteractionModeReturn {
  // State
  mode: InteractionMode;
  isPickerActive: boolean;
  ctaHighlightState: CtaHighlightState;
  currentTapCount: number;
  maxTapsPerAssignment: number;  // KPI: ≤3

  // Actions
  openPicker: (slotId: string | null, source?: InteractionSource) => void;
  closePicker: (reason?: string) => void;
  assignResident: (slotId: string | null, residentId: string) => void;
  resetInteractionState: () => void;
  highlightCta: (state: CtaHighlightState, durationMs?: number) => void;

  // Event handlers
  handleResidentSelect: (residentId: string) => void;
  handleSlotClick: (slotId: string) => void;

  // Exposed state (diagnostics)
  pickerState: { slotId: string | null; trigger: InteractionSource };
  interactionMode: 'drag' | 'tap';
}
```

## Interaction Flow Specifications

### Desktop Mode (Drag)

```
Slot Click → Focus slot → Show inline chips → Drag resident → Drop on slot → Assign
```

**Key Behaviors:**
- No picker overlay
- Direct drag feedback
- Keyboard shortcuts supported
- Multi-selection via modifier keys

### Mobile Mode (Tap)

```
Slot Tap → Open picker sheet → Select resident → Tap assign → Close picker
```

**Key Behaviors:**
- Bottom sheet picker
- Tap count tracking (KPI ≤3)
- CTA highlighting for affordance
- Touch gesture support

## Picker Alignment & Positioning

### Desktop Layout
```
┌─────────────────────────────────────────────────┐
│  Slot Area                                      │
├─────────────────────────────────────────────────┤
│  [Inline Chips] [Chip] [Chip] [Chip]           │
│                                                 │
│  Drag indicator: "Drag resident here"          │
└─────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────────────────────────────┐
│  Slot Area                                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Picker Trigger]                               │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Picker Sheet (Bottom Overlay)                 │
├─────────────────────────────────────────────────┤
│  Slot: [Slot Name] [Activity Icon]             │
│                                                 │
│  Residents:                                    │
│  ┌─────────────────────────────────────────┐   │
│  │ [Resident 1] [Compat: 95%] ✓           │   │
│  │ [Resident 2] [Compat: 87%]             │   │
│  │ [Resident 3] [Compat: 72%]             │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Assign CTA] [Cancel]                         │
└─────────────────────────────────────────────────┘
```

### Alignment Rules

1. **Horizontal**: Center picker on slot X coordinate
2. **Vertical**: Desktop inline, Mobile bottom sheet
3. **Safe Areas**: Respect device notches/safe areas
4. **Z-Index**: Picker > HUD > Content

## Cross-Device UX Specifications

### Consistent Behaviors

| Interaction | Desktop | Mobile | Notes |
|-------------|---------|--------|-------|
| Slot Focus | Click → highlight | Tap → picker open | Immediate feedback |
| Resident Select | Drag start | Picker list | Visual affordance |
| Assignment | Drop on slot | Tap "Assign" | Confirmation required |
| Cancellation | ESC key | Swipe down | Graceful close |

### State Preservation

- **Mode Changes**: Persist interaction mode across sessions
- **Picker State**: Clear on navigation, preserve during config changes
- **Assignment Feedback**: Consistent across devices

### Accessibility

- **Keyboard**: Full navigation, shortcuts
- **Screen Reader**: ARIA labels, live regions
- **Touch Targets**: Minimum 44px touch targets
- **Focus Management**: Focus trap in picker, restore on close

## KPI & Metrics

### Mind Studios KPIs

| Metric | Target | Tracking |
|--------|--------|----------|
| Taps per assignment | ≤ 3 | `tapCount` in telemetry |
| Assignment latency | < 450ms | `assignment_latency_ms` |
| Picker close rate | ≥ 98% within 1s | `close_duration_ms` |

### Telemetry Events

```typescript
// Picker lifecycle
{
  type: 'open' | 'close' | 'assignment_success',
  slotId: string,
  residentId?: string,
  tapCount?: number,
  latencyMs?: number,
  compatibilityScore?: number
}

// Interaction tracking
{
  method: 'drag' | 'tap',
  slotId: string,
  residentId: string,
  timestamp: number
}
```

## Implementation Details

### Mode Detection

```typescript
function detectInteractionMode(): InteractionMode {
  // Priority: forceMode > isMobile > auto-detection
  // Auto: touch capability + user agent heuristics
}
```

### State Management

- **React State**: UI state (picker active, CTA highlight)
- **Refs**: Performance-critical values (current tap count)
- **Effects**: Cleanup, diagnostics logging

### Performance Optimizations

- **Memoization**: Expensive computations (compatibility checks)
- **Debouncing**: Rapid interactions
- **Cleanup**: Timeout refs, event listeners

## Testing Strategy

### Unit Tests

```typescript
describe('useSandboxInteractionMode', () => {
  it('desktop mode: drag interaction', () => {
    // Test drag assignment flow
  });

  it('mobile mode: tap interaction with KPI tracking', () => {
    // Test tap count ≤ 3, CTA highlighting
  });

  it('picker alignment: consistent positioning', () => {
    // Test slot centering, safe areas
  });
});
```

### Integration Tests

- **Playwright**: Cross-device E2E flows
- **Component**: Picker sheet behavior
- **Hook**: State transitions, telemetry

### Test Fixtures

```typescript
const interactionTestFixture = {
  desktopMode: { mode: 'desktop', isMobile: false },
  mobileMode: { mode: 'mobile', isMobile: true },
  pickerState: { isActive: true, slotId: 'test-slot' }
};
```

## Integration Patterns

### VillageSandbox Integration

```typescript
const interaction = useSandboxInteractionMode({
  isMobile,
  handleResidentSelect: baseHandleResidentSelect,
  onDesktopSlotFocus: setSelectedSlot,
  onPickerOpen: (slotId) => diagnostics.debug('picker-open', { slotId }),
  diagnosticsScope: 'VillageSandbox:interaction',
});

const sandboxLayout: 'board' | 'stacked' = interaction.isPickerActive ? 'stacked' : 'board';
```

### Component Props

```typescript
<ActivityArea
  layout={sandboxLayout}
  interactionMode={interaction.interactionMode}
  onSlotClick={interaction.handleSlotClick}
/>
```

## Configuration & Theming

### Config-First Design

All interaction parameters configurable via theme:

```typescript
const interactionConfig = {
  tapTimeoutMs: 300,
  ctaHighlightDurationMs: 800,
  pickerZIndex: 1000,
  minTouchTargetSize: 44,
  dragThresholdPx: 10
};
```

### Theme Integration

```typescript
const theme = useVillageSandboxTheme();
const interaction = useSandboxInteractionMode({
  ...theme.interaction,
  // Override with props
});
```

## Error Handling & Recovery

### Graceful Degradation

- **Unsupported Devices**: Fallback to desktop mode
- **Picker Failures**: Close picker, log error, show fallback
- **State Corruption**: Reset to idle state, clear refs

### Diagnostics

```typescript
const diagnostics = createSandboxDiagnostics('interaction', 'picker');

// Log state changes
diagnostics.info('Mode changed', { from: oldMode, to: newMode });

// Warn on KPI violations
diagnostics.warn('Tap count exceeded', { count: tapCount, limit: MAX_TAPS });
```

## Migration Guide

### From Legacy Interaction

1. **Replace direct mode detection** with hook
2. **Migrate event handlers** to hook callbacks
3. **Update component props** to accept `interactionMode`
4. **Integrate telemetry** from hook return

### Breaking Changes

- `isDragMode` → `interaction.interactionMode === 'drag'`
- Direct picker management → `interaction.openPicker()` / `closePicker()`
- Manual CTA highlighting → `interaction.highlightCta()`

## Future Extensions

### Planned Features

- **Gesture Support**: Multi-touch gestures, swipe assignments
- **Voice Control**: Accessibility voice commands
- **Gamepad**: Controller support for desktop
- **Haptic Feedback**: Vibration on mobile interactions

### API Extensions

```typescript
interface ExtendedParams extends UseSandboxInteractionModeParams {
  enableGestures?: boolean;
  enableHaptics?: boolean;
  voiceCommands?: boolean;
}
```

---

*Specification Version: 1.0*  
*Implementation Status: ✅ Complete*  
*Test Coverage: ✅ Unit + Integration*  
*Documentation: ✅ This document*
