# Idle Village Drag Animation System

## Overview

The Drag Animation System provides smooth, configurable animations for drag-and-drop operations in the Idle Village interface. Built with a config-first philosophy, it offers customizable easing functions, transforms, and timing for all drag phases.

## Features

- **Config-First Design**: All animation parameters defined in Zod-validated config
- **Multiple Animation Phases**: Pickup, dragging, hover, drop, cancel, and invalid states
- **Custom Easing Functions**: 17 built-in easing functions including cubic-bezier curves
- **GPU Acceleration**: Optional hardware acceleration for smooth performance
- **Reduced Motion Support**: Respects `prefers-reduced-motion` user preference
- **Telemetry Integration**: Tracks animation performance and usage
- **Type-Safe**: Full TypeScript support with strict type checking

## Architecture

### Files

```
src/ui/idleVillage/animations/
└── dragAnimationConfig.ts          # Config schemas and defaults

src/ui/idleVillage/hooks/
└── useDragAnimation.ts             # React hook for animation state

tests/unit/idleVillage/
└── DragAnimation.test.ts           # Unit tests

docs/idle_village/
└── drag_animation_system.md        # This file
```

## Configuration

### Animation Phases

The system supports six distinct animation phases:

1. **Pickup**: When an item is first picked up
2. **Dragging**: While actively dragging
3. **Hover**: When hovering over a valid drop target
4. **Invalid**: When hovering over an invalid drop target
5. **Drop**: When successfully dropping an item
6. **Cancel**: When cancelling a drag operation

### Default Configuration

```typescript
import { DEFAULT_DRAG_ANIMATION_CONFIG } from '@/ui/idleVillage/animations/dragAnimationConfig';

// Default config includes:
{
  enabled: true,
  pickup: {
    duration: 150,
    easing: 'ease-out-back',
    transform: { scale: 1.05, rotate: 2, translateZ: 10, opacity: 0.95 }
  },
  dragging: {
    duration: 100,
    easing: 'ease-out',
    transform: { scale: 1.08, rotate: 3, translateZ: 20, opacity: 0.9 }
  },
  // ... other phases
}
```

### Easing Functions

Available easing functions:

- **Linear**: `linear`
- **Standard**: `ease`, `ease-in`, `ease-out`, `ease-in-out`
- **Quadratic**: `ease-in-quad`, `ease-out-quad`, `ease-in-out-quad`
- **Cubic**: `ease-in-cubic`, `ease-out-cubic`, `ease-in-out-cubic`
- **Quartic**: `ease-in-quart`, `ease-out-quart`, `ease-in-out-quart`
- **Back**: `ease-in-back`, `ease-out-back`, `ease-in-out-back`
- **Spring**: `spring`

### Transform Properties

Each phase can configure:

- **scale**: `0-2` (default: 1.0)
- **rotate**: `-180° to 180°` (default: 0)
- **translateZ**: `0-100px` (default: 0)
- **opacity**: `0-1` (default: 1.0)

## Usage

### Basic Usage

```typescript
import { useDragAnimation } from '@/ui/idleVillage/hooks/useDragAnimation';

function DraggableItem() {
  const animation = useDragAnimation({
    elementId: 'resident-123',
    onAnimationComplete: (phase) => {
      console.log(`Animation ${phase} completed`);
    }
  });

  const handleDragStart = () => {
    animation.onPickup();
  };

  const handleDrag = () => {
    animation.onDragStart();
  };

  const handleDragEnd = (isValid: boolean) => {
    if (isValid) {
      animation.onDrop();
    } else {
      animation.onCancel();
    }
  };

  return (
    <div
      ref={(el) => animation.applyStyles(el)}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={() => handleDragEnd(true)}
    >
      Drag me!
    </div>
  );
}
```

### Using Ref Hook

```typescript
import { useDragAnimationRef } from '@/ui/idleVillage/hooks/useDragAnimation';

function DraggableItem() {
  const { ref, onPickup, onDrop, state } = useDragAnimationRef({
    elementId: 'resident-123'
  });

  return (
    <div
      ref={ref}
      onDragStart={onPickup}
      onDragEnd={onDrop}
      className={state.isAnimating ? 'animating' : ''}
    >
      Drag me!
    </div>
  );
}
```

### Custom Configuration

```typescript
import { useDragAnimation } from '@/ui/idleVillage/hooks/useDragAnimation';

function CustomDraggable() {
  const animation = useDragAnimation({
    config: {
      pickup: {
        duration: 200,
        easing: 'ease-out-back',
        transform: {
          scale: 1.15,
          rotate: 5,
          translateZ: 20,
          opacity: 0.85
        }
      },
      drop: {
        duration: 300,
        easing: 'spring',
        transform: {
          scale: 1.0,
          rotate: 0,
          translateZ: 0,
          opacity: 1.0
        }
      }
    }
  });

  // ... use animation
}
```

### Integration with Drag Controller

```typescript
import { useSandboxDragController } from '@/ui/idleVillage/hooks/useSandboxDragController';
import { useDragAnimation } from '@/ui/idleVillage/hooks/useDragAnimation';

function ActivitySlot({ activity, slotIndex }) {
  const dragController = useSandboxDragController();
  const animation = useDragAnimation({ elementId: `slot-${slotIndex}` });

  const handleDragOver = (e: DragEvent) => {
    const isValid = dragController.canDrop(activity, slotIndex);
    
    if (isValid) {
      animation.onHoverValid();
    } else {
      animation.onHoverInvalid();
    }
  };

  const handleDrop = () => {
    if (dragController.applyDrop()) {
      animation.onDrop();
    } else {
      animation.onCancel();
    }
  };

  return (
    <div
      ref={(el) => animation.applyStyles(el)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* slot content */}
    </div>
  );
}
```

## API Reference

### `useDragAnimation(options)`

Main hook for drag animation control.

**Options:**
- `config?: Partial<DragAnimationConfig>` - Custom animation config
- `onAnimationComplete?: (phase: DragAnimationPhase) => void` - Callback on completion
- `elementId?: string` - Element identifier for telemetry

**Returns:**
- `state: DragAnimationState` - Current animation state
- `onPickup: () => void` - Trigger pickup animation
- `onDragStart: () => void` - Trigger dragging animation
- `onHoverValid: () => void` - Trigger valid hover animation
- `onHoverInvalid: () => void` - Trigger invalid hover animation
- `onDrop: () => void` - Trigger drop animation
- `onCancel: () => void` - Trigger cancel animation
- `reset: () => void` - Reset to idle state
- `applyStyles: (element: HTMLElement | null) => void` - Apply styles to element

### `useDragAnimationRef(options)`

Convenience hook with automatic ref management.

**Returns:** Same as `useDragAnimation` plus:
- `ref: RefObject<HTMLElement>` - Ref to attach to element

## Telemetry

### Event: `iv_drag_animation_played`

Emitted when an animation phase completes.

**Payload:**
```typescript
{
  phase: 'pickup' | 'dragging' | 'hover' | 'drop' | 'cancel' | 'invalid',
  elementId: string,
  duration: number,              // Animation duration in ms
  performanceDuration: number    // Actual execution time in ms
}
```

### Configuration

```typescript
{
  telemetry: {
    enabled: true,
    eventName: 'iv_drag_animation_played',
    includePerformance: true,
    includeDuration: true
  }
}
```

## Performance

### GPU Acceleration

Enabled by default, uses CSS transforms and will-change for optimal performance:

```typescript
{
  performance: {
    useGPUAcceleration: true,
    willChange: ['transform', 'opacity']
  }
}
```

### Reduced Motion

Automatically respects user's `prefers-reduced-motion` setting:

```typescript
{
  performance: {
    reducedMotion: true  // Disables animations when user prefers reduced motion
  }
}
```

## Testing

### Unit Tests

Run tests with:

```bash
npm run test -- tests/unit/idleVillage/DragAnimation.test.ts
```

### Test Coverage

- Config validation (schema, easing, transforms)
- Phase transitions (pickup, drag, hover, drop, cancel)
- Animation timing and completion
- Telemetry emission
- Performance metrics
- Reduced motion support
- GPU acceleration
- Ref management

## Best Practices

1. **Use Appropriate Easing**: Choose easing functions that match the interaction
   - `ease-out-back` for pickup (slight overshoot)
   - `ease-out` for smooth deceleration
   - `spring` for playful, bouncy effects

2. **Keep Durations Short**: Aim for 100-300ms to maintain responsiveness

3. **Respect User Preferences**: Always enable `reducedMotion` support

4. **Provide Visual Feedback**: Use distinct animations for valid/invalid states

5. **Clean Up**: Call `reset()` when drag operations are cancelled

6. **Monitor Performance**: Enable telemetry to track animation performance

## Integration Points

- **Phase E Drag/Drop**: Integrates with `useSandboxDragController`
- **Activity Slots**: Provides visual feedback for slot validation
- **Resident Cards**: Animates resident drag operations
- **Drop Validation**: Coordinates with drop validation system

## Future Enhancements

- [ ] Custom cubic-bezier editor in UI
- [ ] Animation presets library
- [ ] Chained animation sequences
- [ ] Physics-based animations
- [ ] Gesture velocity integration
- [ ] Animation recording/replay for debugging

## Troubleshooting

### Animations Not Playing

1. Check `enabled: true` in config
2. Verify element ref is attached
3. Check browser console for errors
4. Ensure `prefers-reduced-motion` is not blocking

### Performance Issues

1. Enable GPU acceleration
2. Reduce animation duration
3. Simplify transform properties
4. Check for concurrent animations

### Telemetry Not Emitting

1. Set `window.__TELEMETRY_ENABLED__ = true`
2. Verify `telemetry.enabled: true` in config
3. Check browser console for telemetry logs

## Related Documentation

- [Phase E Drag/Drop Plan](../plans/idle_village_plan.md)
- [Sandbox Drag Controller](./sandbox_drag_controller.md)
- [Drop Validation System](./drop_validation.md)

## Version History

- **v1.0.0** (2026-01-23): Initial implementation
  - Config-first architecture
  - Six animation phases
  - 17 easing functions
  - GPU acceleration
  - Reduced motion support
  - Telemetry integration
