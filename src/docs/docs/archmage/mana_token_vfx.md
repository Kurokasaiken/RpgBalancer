# Mana Token Visual Effects System

## Overview

The Mana Token Visual Effects (VFX) system is a high-performance, config-first particle effects system designed for Archmage mana tokens. Following the "Il Drago" art direction, it provides beautiful visual feedback for mana token lifecycle events while maintaining strict performance constraints.

## Architecture

### Core Components

1. **ManaVFXConfig** - Configuration schemas and default settings
2. **ManaTokenVFX** - Main VFX engine with canvas/WebGL rendering
3. **ManaTokenVFXIntegration** - Lifecycle event integration layer
4. **ManaTokenVFXUtils** - Utility functions and event emitters

### Key Features

- **Config-First Design**: All effects defined in configuration with Zod validation
- **Performance Optimized**: 16ms render budget constraint with quality scaling
- **Canvas/WebGL Support**: Automatic fallback from WebGL to 2D canvas
- **Particle Physics**: Realistic particle movement with gravity and air resistance
- **Event-Driven**: Automatic VFX triggering for mana token lifecycle events
- **Telemetry Integration**: Performance tracking and event analytics
- **Type Safety**: Full TypeScript support with comprehensive interfaces

## Configuration System

### Mana Families and Colors

The system supports four mana families, each with distinct color palettes following "Il Drago" art direction:

| Mana Type | Primary Color | Secondary Color | Theme |
|-----------|---------------|-----------------|-------|
| **Alteration** | `#4A90E2` (Blue) | `#7BB8F0` (Light Blue) | Control/Magic |
| **Bio** | `#52C41A` (Green) | `#73D13D` (Light Green) | Life/Growth |
| **Wave** | `#722ED1` (Purple) | `#9254DE` (Medium Purple) | Temporal/Flow |
| **Entropy** | `#F5222D` (Red) | `#FF4D4F` (Light Red) | Chaos/Destruction |

### Event Types

| Event | Description | Typical Use |
|-------|-------------|------------|
| `token_spawn` | Token creation effect | New mana tokens appearing |
| `token_stabilize` | Stabilization success | Temporary → permanent conversion |
| `token_break` | Token destruction | Broken mana tokens |
| `token_consume` | Token consumption | Using mana for spells |
| `token_hover` | Hover interaction | UI feedback |
| `token_select` | Selection feedback | Token selection state |

### Particle Configuration

```typescript
interface ManaParticleConfig {
  count: number;           // 1-100 particles
  size: { min: 2, max: 8 }; // Particle size range
  lifetime: { min: 800, max: 2000 }; // Lifetime in ms
  velocity: { min: 50, max: 200 }; // Speed in pixels/second
  physics: {
    enabled: true,
    gravity: -100,        // Gravity acceleration
    airResistance: 0.02,  // Air resistance factor
  };
  emissionShape: 'circle' | 'cone' | 'line' | 'point';
  spread: 360;           // Emission spread angle
}
```

### Animation Configuration

```typescript
interface ManaAnimationConfig {
  duration: 1000;        // Animation duration in ms
  easing: 'easeOutQuad';  // Easing function
  scale: { from: 1, to: 1.5 }; // Scale transformation
  rotation: { from: 0, to: 360 }; // Rotation transformation
  fade: { from: 1, to: 0 }; // Opacity transition
  loop: false;           // Animation looping
}
```

## Usage Examples

### Basic VFX Playing

```typescript
import { manaTokenVFX } from '@/ui/archmage/effects/ManaTokenVFX';

// Play a spawn effect at specific position
const effectId = manaTokenVFX.playEffect(
  'token_spawn',           // Event type
  { x: 100, y: 100 },    // Position
  'alteration',           // Mana type (optional)
  {                       // Configuration overrides (optional)
    particles: {
      count: 50,
      size: { min: 3, max: 12 },
    },
  }
);

// Stop the effect later
manaTokenVFX.stopEffect(effectId);
```

### Integration with Mana Token Lifecycle

```typescript
import { ManaTokenVFXUtils } from '@/ui/archmage/integration/ManaTokenVFXIntegration';
import type { ArcimagoManaToken } from '@/balancing/hooks/archmage/ArcimagoManaSystem';

// When a token is created
function onTokenCreated(token: ArcimagoManaToken, position: { x: number; y: number }) {
  ManaTokenVFXUtils.emitTokenCreated(token, position);
}

// When a token is stabilized
function onTokenStabilized(token: ArcimagoManaToken, position: { x: number; y: number }) {
  ManaTokenVFXUtils.emitTokenStabilized(token, position);
}

// When a token is consumed
function onTokenConsumed(token: ArcimagoManaToken, position: { x: number; y: number }) {
  ManaTokenVFXUtils.emitTokenConsumed(token, position);
}
```

### React Hook Integration

```typescript
import { useManaTokenVFX } from '@/ui/archmage/effects/ManaTokenVFX';

function ManaTokenComponent({ token, position }: { token: ArcimagoManaToken, position: { x: number; y: number } }) {
  const { playEffect, stopEffect } = useManaTokenVFX();

  const handleMouseEnter = () => {
    playEffect('token_hover', position, token.family);
  };

  const handleMouseLeave = () => {
    // Hover effects auto-stop when mouse leaves
  };

  const handleClick = () => {
    playEffect('token_select', position, token.family);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="mana-token"
    >
      {/* Token content */}
    </div>
  );
}
```

### Custom Configuration

```typescript
import { ManaVFXConfigUtils, DEFAULT_MANA_VFX_CONFIG } from '@/ui/archmage/config/manaVFXConfig';

// Create custom configuration for a special effect
const customConfig = ManaVFXConfigUtils.createConfig(
  'token_spawn',           // Event type
  'entropy',              // Mana type
  {                       // Overrides
    particles: {
      count: 100,
      spread: 720,        // Full circle spread
      velocity: { min: 300, max: 500 },
      lifetime: { min: 1500, max: 3000 },
      emissionShape: 'circle',
    },
    colors: {
      primary: '#FF0000',
      secondary: '#FF6666',
      glow: '#FFAAAA',
      particleColors: ['#FF0000', '#FF3333', '#FF6666', '#FF9999', '#FFCCCC'],
      blendMode: 'add',
    },
    animation: {
      duration: 2000,
      easing: 'easeOutCubic',
      scale: { from: 0.1, to: 2.0 },
      rotation: { from: 0, to: 720 },
    },
  }
);

// Validate performance constraints
if (ManaVFXConfigUtils.validatePerformance(customConfig)) {
  // Configuration is valid
} else {
  // Configuration exceeds performance limits
}
```

## Performance Optimization

### Quality Settings

The system automatically adjusts particle counts and render budgets based on quality settings:

| Quality | Particle Multiplier | Render Time Budget | Max Concurrent Effects |
|---------|-------------------|-------------------|------------------------|
| **Low** | 0.5x | 12.8ms | 8 |
| **Medium** | 1.0x | 16ms | 10 |
| **High** | 1.5x | 19.2ms | 12 |
| **Ultra** | 2.0x | 24ms | 15 |

### Performance Constraints

- **Maximum Render Time**: 16ms per frame (60 FPS target)
- **Maximum Particles**: 100 per effect
- **Maximum Concurrent Effects**: 10 (configurable)
- **Viewport Culling**: Particles outside viewport are skipped
- **Automatic Fallback**: WebGL → 2D canvas if needed

### Performance Monitoring

```typescript
import { manaTokenVFX } from '@/ui/archmage/effects/ManaTokenVFX';

// Get performance metrics
const metrics = manaTokenVFX.getPerformanceMetrics();
console.log('Average frame time:', metrics.averageFrameTime);
console.log('Dropped frames:', metrics.droppedFrames);
console.log('Total frames:', metrics.totalFrames);

// Get active effects count
const activeEffects = manaTokenVFX.getActiveEffectsCount();
console.log('Active effects:', activeEffects);
```

## Telemetry and Analytics

### Event Tracking

The system automatically emits telemetry events for performance monitoring:

```typescript
// Telemetry event structure
interface ManaVFXTelemetryEvent {
  eventType: 'archmage_mana_vfx_played';
  detail: {
    eventType: 'token_spawn' | 'token_stabilize' | 'token_break' | 'token_consume' | 'token_hover' | 'token_select';
    manaType?: 'alteration' | 'bio' | 'wave' | 'entropy';
    effectId: string;
    timestamp: number;
    activeEffectsCount: number;
    performanceMetrics: {
      averageFrameTime: number;
      droppedFrames: number;
      totalFrames: number;
    };
  };
}
```

### Performance Analytics

```typescript
// Listen for VFX telemetry events
window.addEventListener('archmage_mana_vfx_played', (event: CustomEvent) => {
  const { eventType, manaType, performanceMetrics } = event.detail;
  
  // Track performance by mana type
  if (performanceMetrics.averageFrameTime > 16) {
    console.warn(`VFX performance issue detected for ${manaType} ${eventType}`);
  }
  
  // Track effect popularity
  analytics.track('mana_vfx_played', {
    eventType,
    manaType,
    renderTime: performanceMetrics.averageFrameTime,
  });
});
```

## Advanced Features

### Custom Emission Shapes

```typescript
// Cone emission for directional effects
const coneConfig = {
  particles: {
    emissionShape: 'cone',
    spread: 45,  // 45-degree cone
    count: 30,
  },
};

// Line emission for linear effects
const lineConfig = {
  particles: {
    emissionShape: 'line',
    count: 20,
  },
};

// Point emission for centralized effects
const pointConfig = {
  particles: {
    emissionShape: 'point',
    count: 15,
  },
};
```

### Physics Simulation

```typescript
// Custom physics settings
const physicsConfig = {
  particles: {
    physics: {
      enabled: true,
      gravity: -200,        // Stronger gravity
      airResistance: 0.05,  // More air resistance
    },
    acceleration: {
      x: 50,               // Horizontal acceleration
      y: -150,             // Upward acceleration
    },
  },
};
```

### Blend Modes

```typescript
// Different visual effects with blend modes
const blendModeConfigs = {
  // Additive blending for bright effects
  additive: {
    colors: {
      blendMode: 'add',
      primary: '#FFFFFF',
      glow: '#FFFF00',
    },
  },
  
  // Screen blending for soft effects
  screen: {
    colors: {
      blendMode: 'screen',
      primary: '#4A90E2',
      glow: '#B8D4F1',
    },
  },
  
  // Multiply blending for dark effects
  multiply: {
    colors: {
      blendMode: 'multiply',
      primary: '#1A1A1A',
      glow: '#333333',
    },
  },
};
```

## Testing

### Unit Tests

```bash
# Run VFX system tests
npm run test -- tests/unit/archmage/ManaTokenVFX.test.ts

# Run with coverage
npm run test -- tests/unit/archmage/ManaTokenVFX.test.ts --coverage
```

### Test Coverage Areas

1. **Configuration Validation**: Schema validation and performance constraints
2. **Effect Lifecycle**: Creation, animation, and cleanup
3. **Performance Monitoring**: Frame time tracking and dropped frames
4. **Canvas Rendering**: WebGL and 2D canvas fallback
5. **Event Integration**: Mana token lifecycle events
6. **Quality Scaling**: Performance adjustment by quality level

### Performance Testing

```typescript
// Performance benchmark test
describe('VFX Performance', () => {
  it('should maintain 60fps with 10 concurrent effects', async () => {
    const vfx = new ManaTokenVFX();
    await vfx.initialize();
    
    // Start multiple effects
    for (let i = 0; i < 10; i++) {
      vfx.playEffect('token_spawn', { x: i * 50, y: i * 50 }, 'alteration');
    }
    
    // Wait for animations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const metrics = vfx.getPerformanceMetrics();
    expect(metrics.averageFrameTime).toBeLessThan(16);
    expect(metrics.droppedFrames).toBeLessThan(metrics.totalFrames * 0.05); // < 5% dropped frames
    
    vfx.destroy();
  });
});
```

## Troubleshooting

### Common Issues

1. **Effects Not Playing**
   - Check if VFX system is initialized
   - Verify configuration is enabled
   - Check browser canvas support

2. **Performance Issues**
   - Reduce particle count in configuration
   - Lower quality setting
   - Enable viewport culling

3. **WebGL Fallback Issues**
   - Check browser WebGL support
   - Verify 2D canvas fallback is enabled
   - Test with different browsers

4. **Memory Leaks**
   - Ensure effects are properly stopped
   - Check for orphaned canvas elements
   - Monitor active effects count

### Debug Tools

```typescript
// Enable debug mode
const debugConfig = {
  ...DEFAULT_MANA_VFX_CONFIG,
  effects: [{
    ...defaultEffect,
    debug: {
      showBounds: true,        // Show particle bounds
      showMetrics: true,       // Show performance metrics
      logPerformanceWarnings: true,
    },
  }],
};

const vfx = new ManaTokenVFX(debugConfig);

// Monitor performance
setInterval(() => {
  const metrics = vfx.getPerformanceMetrics();
  console.log('VFX Performance:', {
    avgFrameTime: metrics.averageFrameTime.toFixed(2) + 'ms',
    droppedFrames: metrics.droppedFrames,
    activeEffects: vfx.getActiveEffectsCount(),
  });
}, 1000);
```

## Best Practices

### Performance Guidelines

1. **Particle Count**: Keep under 50 particles for most effects
2. **Effect Duration**: Limit to 1-2 seconds for UI feedback
3. **Concurrent Effects**: Maximum 10 effects at once
4. **Quality Scaling**: Automatically adjust for device capabilities
5. **Cleanup**: Always stop effects when no longer needed

### Design Guidelines

1. **Color Consistency**: Use defined mana family colors
2. **Effect Appropriateness**: Match effect intensity to event importance
3. **User Feedback**: Provide clear visual feedback for interactions
4. **Accessibility**: Respect user preferences for reduced motion

### Integration Guidelines

1. **Event-Driven**: Use lifecycle events rather than direct calls
2. **Position Accuracy**: Provide precise coordinates for effects
3. **Error Handling**: Gracefully handle VFX system failures
4. **Configuration**: Use config-first approach for customization

## API Reference

### ManaTokenVFX Class

```typescript
class ManaTokenVFX {
  constructor(config?: Partial<ManaVFXSystemConfig>);
  async initialize(): Promise<void>;
  playEffect(eventType: ManaVFXEventType, position: { x: number; y: number }, manaType?: STSManaType, overrides?: Partial<ManaVFXConfig>): string;
  stopEffect(effectId: string): void;
  stopAllEffects(): void;
  updateConfig(newConfig: Partial<ManaVFXSystemConfig>): void;
  getPerformanceMetrics(): PerformanceMetrics;
  getActiveEffectsCount(): number;
  destroy(): void;
}
```

### ManaTokenVFXIntegration Class

```typescript
class ManaTokenVFXIntegration {
  async initialize(): Promise<void>;
  setEnabled(enabled: boolean): void;
  onTokenCreated(token: ArcimagoManaToken, position: { x: number; y: number }): void;
  onTokenStabilized(token: ArcimagoManaToken, position: { x: number; y: number }): void;
  onTokenBroken(token: ArcimagoManaToken, position: { x: number; y: number }): void;
  onTokenConsumed(token: ArcimagoManaToken, position: { x: number; y: number }): void;
  onTokenHoverStart(token: ArcimagoManaToken, position: { x: number; y: number }): void;
  onTokenHoverEnd(token: ArcimagoManaToken): void;
  onTokenSelected(token: ArcimagoManaToken, position: { x: number; y: number }): void;
  onTokenDeselected(token: ArcimagoManaToken, position: { x: number; y: number }): void;
  clearAllEffects(): void;
  getActiveEffectsCount(): number;
  getPerformanceMetrics(): PerformanceMetrics;
  destroy(): void;
}
```

### Configuration Types

```typescript
interface ManaVFXSystemConfig {
  enabled: boolean;
  performance: {
    targetFPS: number;
    maxFrameTime: number;
    useRequestAnimationFrame: boolean;
    pauseWhenHidden: boolean;
  };
  quality: 'low' | 'medium' | 'high' | 'ultra';
  effects: ManaVFXConfig[];
  globalColors: Record<STSManaType, ManaColorConfig>;
  telemetry: {
    enabled: boolean;
    sampleRate: number;
    trackIndividualEvents: boolean;
  };
}
```

## Future Enhancements

### Planned Features

1. **Advanced Particle Systems**: 3D particles and complex physics
2. **Shader Effects**: Custom WebGL shaders for advanced effects
3. **Sound Integration**: Audio effects synchronized with VFX
4. **Mobile Optimization**: Touch-specific effects and performance tuning
5. **Accessibility**: Reduced motion modes and contrast adjustments

### Extension Points

- Custom particle behaviors and physics
- Additional emission shapes and patterns
- Custom blend modes and rendering techniques
- Third-party effect plugins

## Conclusion

The Mana Token VFX system provides a robust, performant, and configurable solution for visual effects in the Archmage system. With its config-first architecture, performance optimization, and comprehensive testing, it delivers beautiful visual feedback while maintaining strict performance constraints.

The system is designed to be easily extensible and customizable, allowing developers to create stunning visual effects that enhance the user experience without compromising performance.
