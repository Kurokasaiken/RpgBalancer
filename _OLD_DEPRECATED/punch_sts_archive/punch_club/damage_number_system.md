# Punch Club Combat Damage Number Animation System

## Overview

Config-first system for rendering animated damage numbers during combat. Features object pooling, performance optimization, and configurable animations per damage type.

## Features

- **Config-First Design**: All animations, colors, and behavior defined in validated configuration
- **Object Pooling**: Reuses DOM nodes for optimal performance
- **Type-Specific Animations**: Different styles for normal, critical, miss, heal, and block
- **Performance Budget**: Monitors render time and warns on violations
- **Telemetry Integration**: Tracks rendering performance
- **Automatic Cleanup**: Numbers removed after animation duration

## Architecture

### Files

```
src/ui/punchClub/
├── hooks/
│   └── useDamageNumbers.ts              # Lifecycle management hook
└── combat/
    └── DamageNumberSystem.tsx           # UI component

tests/unit/punchClub/
└── DamageNumberSystem.test.tsx          # Unit tests

docs/punch_club/
└── damage_number_system.md              # This file
```

## Configuration

### Damage Number Configuration Schema

```typescript
interface DamageNumberConfig {
  enabled: boolean;
  maxActive: number;
  poolSize: number;
  defaultDuration: number;
  animations: {
    [type in DamageType]: {
      duration: number;
      easing: string;
      color: string;
      fontSize: number;
      offsetY: number;
      fadeStart: number;
    };
  };
  performance: {
    enablePooling: boolean;
    maxRenderTime: number;
    batchSize: number;
  };
  telemetry: {
    enabled: boolean;
    sampleRate: number;
  };
}
```

### Default Configuration

```typescript
{
  enabled: true,
  maxActive: 20,
  poolSize: 30,
  defaultDuration: 1000,
  animations: {
    normal: {
      duration: 1000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      color: '#ffffff',
      fontSize: 24,
      offsetY: -50,
      fadeStart: 0.7,
    },
    critical: {
      duration: 1200,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      color: '#ff4444',
      fontSize: 32,
      offsetY: -70,
      fadeStart: 0.6,
    },
    // ... miss, heal, block
  },
  performance: {
    enablePooling: true,
    maxRenderTime: 16,
    batchSize: 5,
  },
  telemetry: {
    enabled: true,
    sampleRate: 0.1,
  },
}
```

## Usage

### Basic Usage

```typescript
import { DamageNumberSystem, useDamageNumbers } from '@/ui/punchClub/combat/DamageNumberSystem';

// In combat component
function CombatArena() {
  const { spawnDamageNumber } = useDamageNumbers();

  const handleDamage = (damage: number, x: number, y: number) => {
    const isCritical = Math.random() > 0.9;
    spawnDamageNumber(damage, isCritical ? 'critical' : 'normal', x, y);
  };

  return (
    <div style={{ position: 'relative' }}>
      <DamageNumberSystem />
      {/* Combat UI */}
    </div>
  );
}
```

### Custom Configuration

```typescript
const { spawnDamageNumber } = useDamageNumbers({
  maxActive: 15,
  animations: {
    critical: {
      duration: 1500,
      color: '#ff0000',
      fontSize: 40,
      offsetY: -100,
      easing: 'ease-out',
      fadeStart: 0.5,
    },
  },
});
```

### Damage Types

- **normal**: Standard damage (white, 24px)
- **critical**: Critical hits (red, 32px, bouncy)
- **miss**: Missed attacks (gray, 20px, "MISS")
- **heal**: Healing (green, 24px, "+value")
- **block**: Blocked attacks (blue, 22px, "BLOCK")

## Performance Optimization

### Object Pooling

Reuses DOM nodes instead of creating/destroying:

```typescript
{
  performance: {
    enablePooling: true,
    maxRenderTime: 16,  // 60fps budget
    batchSize: 5,
  }
}
```

### Max Active Limit

Prevents performance degradation:

```typescript
{
  maxActive: 20,  // Maximum simultaneous numbers
}
```

### Render Time Monitoring

Warns when exceeding frame budget:

```
[DamageNumbers] Render time exceeded: 18.45ms
```

## Telemetry

### Event: pc_damage_numbers_rendered

Emitted for sampled damage numbers.

**Payload**:
```typescript
{
  type: 'critical',
  value: 250,
  renderTime: 2.5,
  activeCount: 5,
  pooled: true,
  timestamp: 1706097600000
}
```

## Statistics

```typescript
const { getStatistics } = useDamageNumbers();
const stats = getStatistics();

// {
//   activeCount: 5,
//   poolSize: 30,
//   pooledCount: 25,
//   maxActive: 20
// }
```

## Integration with Combat System

```typescript
// Listen to combat events
combatSystem.on('damage', (event) => {
  const { damage, isCritical, target } = event;
  const { x, y } = target.position;
  
  spawnDamageNumber(
    damage,
    isCritical ? 'critical' : 'normal',
    x,
    y
  );
});

combatSystem.on('miss', (event) => {
  const { target } = event;
  spawnDamageNumber(0, 'miss', target.x, target.y);
});

combatSystem.on('heal', (event) => {
  const { amount, target } = event;
  spawnDamageNumber(amount, 'heal', target.x, target.y);
});
```

## Best Practices

1. **Enable Pooling**: Always use object pooling in production
2. **Limit Active Numbers**: Keep maxActive reasonable (15-20)
3. **Monitor Performance**: Check render time warnings
4. **Sample Telemetry**: Use low sample rate (0.1) to reduce overhead
5. **Clear on Scene Change**: Call `clearAll()` when leaving combat
6. **Position Carefully**: Ensure x/y coordinates are within viewport

## Troubleshooting

### Numbers Not Appearing

- Check `enabled: true` in config
- Verify x/y coordinates are visible
- Check maxActive limit not exceeded

### Performance Issues

- Enable pooling
- Reduce maxActive
- Lower animation duration
- Simplify easing functions

### Numbers Disappearing Too Fast

- Increase animation duration
- Adjust fadeStart threshold

## Related Documentation

- [Frame Budget Monitor](./frame_budget_monitor.md)
- [PC-M2 Combat System](../plans/punch_club_m2_plan.md)

## Version History

- **v1.0.0** (2026-01-24): Initial implementation
  - Config-first animation system
  - 5 damage types with distinct styles
  - Object pooling for performance
  - Render time monitoring
  - Telemetry integration
  - Comprehensive unit tests
