# Skin Binding Registry Guide

## Overview

The Skin Binding Registry is a centralized system for managing skin configurations and bindings for certified components in the Idle Village roster. It provides type-safe component certification, dynamic skin application, and telemetry integration.

## Architecture

### Core Components

1. **SkinBindingRegistry** - Central registry of certified component configurations
2. **useSkinHarness** - Hook for skin preferences and telemetry management
3. **Component Integration Pattern** - Standardized approach for applying skins to components

### Key Concepts

- **Certified Components**: Components approved for skin binding with predefined configurations
- **Skin Bindings**: Metadata describing how a component interacts with the skin system
- **Pillar Support**: Style Lab pillars (frontier, wilderness, empire) that components can support
- **Telemetry Events**: Automatic tracking of skin-related interactions

## Certified Components

### Current Certified Components

| Component | Default Preset | Supported Pillars | CSS Base | Data Prefix |
|-----------|----------------|-------------------|----------|-------------|
| PgCard | minimal-frontier | frontier, wilderness, empire | pgcard-skin | pgcard |
| ResidentSlotRack | minimal-frontier | frontier, wilderness, empire | slotrack-skin | slotrack |
| TimeEngineStrip | minimal-frontier | frontier, wilderness, empire | timeengine-skin | timeengine |
| ActiveHUD | minimal-frontier | frontier, wilderness, empire | activehud-skin | activehud |
| ActivityCapsule | minimal-frontier | frontier, wilderness, empire | activitycapsule-skin | activitycapsule |
| ActionHalo | minimal-frontier | frontier, wilderness, empire | actionhalo-skin | actionhalo |
| SlottedMedal | minimal-frontier | frontier, wilderness, empire | slottedmedal-skin | slottedmedal |
| VillageRosterSection | minimal-frontier | frontier, wilderness, empire | rostersection-skin | rostersection |

### Component Properties

Each certified component has specific skin properties:

#### PgCard
```typescript
{
  materialType: 'medal',
  interactionPhysics: true,
  audioHaptics: true,
}
```

#### ResidentSlotRack
```typescript
{
  slotType: 'resident',
  dropZones: true,
  dragFeedback: true,
}
```

#### SlottedMedal
```typescript
{
  medalType: 'bronze',
  interactionPhysics: true,
  resistRing: true,
  haloCanvas: true,
}
```

## API Reference

### Core Functions

#### getComponentSkinBinding(componentId)
Returns the skin binding configuration for a certified component.

```typescript
const binding = getComponentSkinBinding('PgCard');
// Returns: ComponentSkinBinding object
```

#### isCertifiedComponent(componentId)
Checks if a component is certified for skin binding.

```typescript
const isCertified = isCertifiedComponent('PgCard'); // true
const isCertified = isCertifiedComponent('RandomComponent'); // false
```

#### getCertifiedComponentIds()
Returns all certified component IDs.

```typescript
const componentIds = getCertifiedComponentIds();
// Returns: ['PgCard', 'ResidentSlotRack', ...]
```

#### getComponentsForPillar(pillar)
Returns components that support a specific pillar.

```typescript
const frontierComponents = getComponentsForPillar('frontier');
// Returns: All components that support frontier pillar
```

### Utility Functions

#### generateSkinClassName(componentId, presetId, pillar)
Generates CSS class names for a component.

```typescript
const className = generateSkinClassName('PgCard', 'wanderlust', 'wilderness');
// Returns: 'pgcard-skin-wanderlust pgcard-skin-wilderness'
```

#### generateSkinDataAttributes(componentId, presetId, pillar, motionLevel?)
Generates data attributes for a component.

```typescript
const attributes = generateSkinDataAttributes('PgCard', 'wanderlust', 'wilderness', 'minimal');
// Returns: {
//   'data-pgcard-preset': 'wanderlust',
//   'data-pgcard-pillar': 'wilderness',
//   'data-pgcard-motion': 'minimal'
// }
```

#### getComponentTelemetryEvent(componentId, action)
Generates telemetry event names.

```typescript
const eventName = getComponentTelemetryEvent('PgCard', 'rendered');
// Returns: 'skin_pgcard_rendered'
```

## Type Definitions

### CertifiedComponentId
```typescript
type CertifiedComponentId = 
  | 'PgCard'
  | 'ResidentSlotRack' 
  | 'TimeEngineStrip'
  | 'ActiveHUD'
  | 'ActivityCapsule'
  | 'ActionHalo'
  | 'SlottedMedal'
  | 'VillageRosterSection';
```

### ComponentSkinBinding
```typescript
interface ComponentSkinBinding {
  componentId: CertifiedComponentId;
  defaultPreset: SkinPresetId;
  supportedPillars: StyleLabPillar[];
  cssClassBase: string;
  dataAttributePrefix: string;
  supportsMotionLevel: boolean;
  supportsTelemetry: boolean;
  skinProperties?: Record<string, any>;
}
```

## Integration Patterns

### Basic Component Integration
```typescript
import { useSkinDataAttributes, useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { getComponentSkinBinding, generateSkinClassName, type CertifiedComponentId } from '@/ui/idleVillage/skins/SkinBindingRegistry';

function MyComponent() {
  // Get skin data attributes and telemetry
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('MyComponent' as CertifiedComponentId);
  
  // Get component binding and generate classes
  const skinBinding = getComponentSkinBinding('MyComponent' as CertifiedComponentId);
  const skinClassName = generateSkinClassName('MyComponent' as CertifiedComponentId, 
    skinDataAttributes['data-skin-preset'] as any, 
    skinDataAttributes['data-skin-pillar'] as any
  );

  // Track telemetry events
  useEffect(() => {
    trackComponentEvent('rendered', {
      componentId: 'MyComponent',
      skinBinding: skinBinding.componentId,
    });
  }, [trackComponentEvent, skinBinding.componentId]);

  return (
    <div 
      className={skinClassName}
      {...skinDataAttributes}
    >
      {/* Component content */}
    </div>
  );
}
```

### Advanced Integration with Motion Support
```typescript
function AdvancedComponent() {
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('AdvancedComponent' as CertifiedComponentId);
  const skinBinding = getComponentSkinBinding('AdvancedComponent' as CertifiedComponentId);
  
  const skinClassName = generateSkinClassName('AdvancedComponent' as CertifiedComponentId, 
    skinDataAttributes['data-skin-preset'] as any, 
    skinDataAttributes['data-skin-pillar'] as any
  );

  // Motion-specific telemetry
  useEffect(() => {
    if (skinBinding.supportsMotionLevel) {
      trackComponentEvent('motion_changed', {
        motionLevel: skinDataAttributes['data-motion-level'],
        componentId: 'AdvancedComponent',
      });
    }
  }, [skinDataAttributes['data-motion-level'], skinBinding.supportsMotionLevel, trackComponentEvent]);

  return (
    <div 
      className={`${skinClassName} ${skinBinding.supportsMotionLevel ? 'motion-enabled' : ''}`}
      {...skinDataAttributes}
    >
      {/* Component content */}
    </div>
  );
}
```

## Best Practices

### 1. Component Certification
- Only certified components should use the skin binding system
- Each component must have a unique identifier
- Components should support all three pillars (frontier, wilderness, empire)

### 2. CSS Class Naming
- Use the generated CSS classes from `generateSkinClassName`
- Don't hardcode skin-specific classes in components
- Follow the established naming convention: `{component}-skin-{preset}`

### 3. Data Attributes
- Always spread the `skinDataAttributes` object on the root element
- Don't manually create data attributes
- Use the generated attributes for CSS targeting and testing

### 4. Telemetry Events
- Track key interactions (render, click, drag_start, etc.)
- Include relevant context in event payloads
- Use the standardized event naming convention

### 5. Type Safety
- Always use `CertifiedComponentId` type for component IDs
- Don't use string literals for component IDs
- Leverage TypeScript for compile-time validation

## Adding New Components

### 1. Add to CertifiedComponentId Type
```typescript
type CertifiedComponentId = 
  | 'PgCard'
  | 'ResidentSlotRack'
  // ... existing components
  | 'NewComponent'; // Add new component
```

### 2. Create Component Binding
```typescript
export const CERTIFIED_COMPONENT_BINDINGS: Record<CertifiedComponentId, ComponentSkinBinding> = {
  // ... existing bindings
  NewComponent: {
    componentId: 'NewComponent',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    cssClassBase: 'newcomponent-skin',
    dataAttributePrefix: 'newcomponent',
    supportsMotionLevel: true,
    supportsTelemetry: true,
    skinProperties: {
      // Component-specific properties
    },
  },
};
```

### 3. Update Tests
Add tests for the new component in `SkinBindingRegistry.test.tsx`:
```typescript
describe('NewComponent', () => {
  it('should have correct binding configuration', () => {
    const binding = getComponentSkinBinding('NewComponent');
    expect(binding.componentId).toBe('NewComponent');
    expect(binding.cssClassBase).toBe('newcomponent-skin');
    // ... additional assertions
  });
});
```

### 4. Integrate Component
Follow the integration pattern in the component file:
```typescript
import { useSkinDataAttributes, useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { getComponentSkinBinding, generateSkinClassName, type CertifiedComponentId } from '@/ui/idleVillage/skins/SkinBindingRegistry';

function NewComponent() {
  // Integration code
}
```

## Testing

### Unit Tests
The registry includes comprehensive unit tests covering:
- Component certification
- Binding configuration
- Utility functions
- Type safety
- Edge cases

### Integration Tests
Test component integration by:
- Verifying CSS class generation
- Checking data attribute application
- Validating telemetry events
- Testing pillar switching

### Test Commands
```bash
# Run registry tests
npm run test -- tests/unit/idleVillage/SkinBindingRegistry.test.tsx

# Run all skin-related tests
npm run test -- tests/unit/idleVillage/useSkinHarness.test.tsx tests/unit/idleVillage/SkinBindingRegistry.test.tsx
```

## Troubleshooting

### Common Issues

1. **Component not certified**
   - Ensure component ID is in `CertifiedComponentId` type
   - Check if component is added to `CERTIFIED_COMPONENT_BINDINGS`

2. **CSS classes not applying**
   - Verify `generateSkinClassName` is called correctly
   - Check if classes are applied to the root element
   - Ensure CSS is loaded for the skin

3. **Telemetry events not firing**
   - Verify `useSkinTelemetry` hook is called
   - Check if component supports telemetry
   - Ensure events are tracked in correct lifecycle

4. **Type errors**
   - Use `CertifiedComponentId` type for component IDs
   - Don't use string literals for component identification
   - Check import paths are correct

### Debug Mode
Enable debug logging by setting the skin harness in debug mode:
```typescript
const skinHarness = useSkinHarness({
  enableTelemetry: true,
  // Debug mode will log all skin-related events
});
```

## Performance Considerations

### Optimization Tips
1. **Memoization**: Use `useMemo` for expensive skin calculations
2. **Conditional Rendering**: Only apply skin bindings when needed
3. **CSS Optimization**: Use CSS variables for dynamic skin properties
4. **Telemetry Throttling**: Throttle telemetry events for high-frequency interactions

### Bundle Size
- The registry is tree-shakeable
- Unused component bindings are eliminated in production
- Consider lazy loading for non-critical components

## Future Enhancements

### Planned Features
1. **Dynamic Component Certification**: Runtime component registration
2. **Skin Inheritance**: Component hierarchy and skin inheritance
3. **Plugin System**: Extensible skin system for third-party components
4. **Performance Monitoring**: Built-in performance metrics for skin operations

### Extension Points
- Custom skin property validators
- Component-specific skin hooks
- Advanced telemetry configurations
- Custom CSS generation strategies

## Conclusion

The Skin Binding Registry provides a robust, type-safe system for managing skin configurations across certified components. By following the established patterns and best practices, developers can ensure consistent skin behavior while maintaining flexibility for future enhancements.

For more information, see the Component Skin Integration Guide and the roster trusted components documentation.
