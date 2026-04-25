# Style Laboratory Demo

A comprehensive component showcase demonstrating the Style Laboratory design system with advanced UI components, preset configurations, and real-time parameter controls.

## Overview

The Style Lab Demo provides an interactive playground for exploring Style Laboratory's design tokens, component behaviors, and preset configurations. It features 8 advanced components with automatic animations, real-time controls, and 3 distinct preset themes.

## Features

### Advanced Components
- **Slider**: Automatic movement with real-time value display
- **Toggle Switch**: Automatic on/off switching with configurable timing
- **Progress Ring**: Circular progress visualization with fill/drain animations
- **Text Field**: Auto-focus/unfocus loops with placeholder animations
- **Notification Toast**: Auto appear/disappear with position options
- **Hover Card**: Continuous hover effects with content rotation
- **Drag & Drop**: Physics-based interactions with spring animations
- **Button**: Squash animations with auto-click loops

### Preset System
Three distinct preset themes offering different interaction experiences:

#### Minimal Frontier 🌅
- **Feel**: Clean, balanced, professional
- **Speed**: Normal (1.0x)
- **Characteristics**: Subtle animations, balanced layout, clean effects
- **Best for**: Default user experience, professional environments

#### Obsidian Vault 🗿
- **Feel**: Heavy, dense, substantial
- **Speed**: Slower (0.7x)
- **Characteristics**: Deliberate timing, pronounced effects, larger components
- **Best for**: Users who prefer tactile, weighty interactions

#### Blizzard Rift ❄️
- **Feel**: Ultra-responsive, light, energetic
- **Speed**: Fast (1.3x)
- **Characteristics**: Quick animations, snappy responses, compact elements
- **Best for**: Users who prefer fast, dynamic interactions

### Real-time Controls
- **Component Selection**: Switch between all 8 components
- **Parameter Sliders**: Adjust timing, speed, sizes, and behaviors
- **Animation Controls**: Master animation toggle and speed adjustment
- **Preset Switcher**: Instant theme switching with visual feedback
- **Export/Import**: Save and load custom configurations

## Architecture

### Config-First Design
All component parameters are defined in `src/ui/styleLab/config/demoConfig.ts` using Zod schemas for type safety and validation.

### Preset Structure
```
src/ui/styleLab/presets/
├── index.ts              # Centralized exports
├── minimalFrontier.ts     # Clean, balanced preset
├── obsidianVault.ts       # Heavy, dense preset
└── blizzardRift.ts        # Fast, responsive preset
```

### Component Organization
```
src/ui/styleLab/
├── components/            # Advanced demo components
├── config/               # Configuration schemas
├── presets/              # Preset definitions
├── __stories__/           # Storybook stories
└── __tests__/             # Integration tests
```

## Usage

### Basic Usage
```tsx
import { StyleLabDemo } from './ui/styleLab/StyleLabDemo';

function App() {
  return <StyleLabDemo />;
}
```

### Applying Presets
```tsx
import { applyMinimalFrontierPreset } from './ui/styleLab/presets';
import { defaultDemoConfig } from './ui/styleLab/config/demoConfig';

const config = applyMinimalFrontierPreset(defaultDemoConfig);
```

### Custom Presets
```tsx
import type { DemoConfig } from './ui/styleLab/config/demoConfig';

const customPreset: Partial<DemoConfig> = {
  animation: {
    enabled: true,
    speed: 1.5,
    reducedMotion: false,
  },
  slider: {
    moveSpeed: 2.0,
    trackHeight: 10,
  },
  // ... other component configs
};
```

## Wanderlust Components (WL-STY-007)

### ActionCardBase – Detail Cards with Dual Pillar Styling

ActionCardBase provides the visual frame for activity cards with Wanderlust dual pillar theming.

```tsx
import { ActionCardBase } from './ui/idleVillage/map/actionCards/ActionCardBase';
import { useStyleLabTokens } from './ui/styleLab/hooks/useStyleLabTokens';

function ActivityCard({ activity, pillar }) {
  const { actionCardFrame } = useStyleLabTokens();
  
  return (
    <ActionCardBase
      label={activity.label}
      icon={activity.icon}
      subtitle={activity.description}
      statusLabel={activity.status}
      pillar={pillar} // 'wilderness' | 'empire'
      dataTestId={`action-card-${activity.id}`}
      className="action-card-base-preview"
    />
  );
}
```

**Pillar-Specific Styling**:
- **Wilderness**: Green accents, lighter animations, organic feel
- **Empire**: Gold accents, heavier animations, monumental feel

### ActionHalo – Map POI Indicators

ActionHalo provides pulsing ring indicators for map points of interest with Wanderlust styling.

```tsx
import { ActionHalo } from './ui/idleVillage/map/actionCards/ActionHalo';

function MapPOI({ poi, pillar }) {
  return (
    <ActionHalo
      iconText={poi.icon}
      size={poi.size} // 48-72px based on importance
      ringWidth={3}
      pulseIntensity={pillar === 'wilderness' ? 0.6 : 0.8}
      pulseSpeed={2.5}
      shadowBlur={pillar === 'wilderness' ? 8 : 12}
      pillar={pillar} // 'wilderness' | 'empire'
      dataTestId={`action-halo-${poi.id}`}
      data-wanderlust-pillar={pillar}
      onClick={() => handlePOIClick(poi)}
    />
  );
}
```

**Pillar-Specific Behavior**:
- **Wilderness**: 2.5s pulse cycle, lighter glow, natural feel
- **Empire**: 2s pulse cycle, stronger glow, imperial feel

### Wanderlust Preset Integration

```tsx
import { WANDERLUST_PRESETS, applyWanderlustPreset } from './ui/styleLab/presets/wanderlust';
import { useStyleLabTokens } from './ui/styleLab/hooks/useStyleLabTokens';

function WanderlustComponent() {
  const [pillar, setPillar] = useState('wilderness');
  const styleTokens = useStyleLabTokens();
  
  // Apply Wanderlust preset tokens
  const wanderlustTokens = applyWanderlustPreset(styleTokens, pillar);
  
  return (
    <div style={{ 
      backgroundColor: wanderlustTokens.backgroundColor,
      borderColor: wanderlustTokens.borderColor 
    }}>
      <ActionCardBase pillar={pillar} />
      <ActionHalo pillar={pillar} />
    </div>
  );
}
```

### Telemetry Integration

```tsx
import { trackTelemetryEvent } from './analytics/telemetry/telemetryProvider';

function handlePillarSwitch(newPillar) {
  setPillar(newPillar);
  
  trackTelemetryEvent('wanderlust_pillar_switch', {
    context: 'village_sandbox',
    pillar: newPillar,
    previousPillar: pillar,
    timestamp: Date.now(),
  });
  
  trackTelemetryEvent('action_halo_render', {
    context: 'village_sandbox',
    pillar: newPillar,
    haloCount: mapPOIs.length,
    timestamp: Date.now(),
  });
}
```

### Game Feel Configuration

```tsx
// Wilderness pillar configuration
const wildernessConfig = {
  hoverScale: 1.02,
  clickSquash: 0.95,
  collectOvershoot: 0.1,
  pulseSpeed: 2500,
  glowIntensity: 0.6,
  soundProfile: 'chime-harmonic',
  hapticIntensity: 'light'
};

// Empire pillar configuration
const empireConfig = {
  hoverScale: 1.03,
  clickSquash: 0.93,
  collectOvershoot: 0.15,
  pulseSpeed: 2000,
  glowIntensity: 0.8,
  soundProfile: 'bell-bronze',
  hapticIntensity: 'medium'
};
```

## Development

### Running the Demo
```bash
# Start development server
npm run dev

# Navigate to Style Lab Demo
# http://localhost:5173/style-lab-demo
```

### Storybook
```bash
# Run Storybook
npm run storybook

# View Style Lab Demo stories
# http://localhost:6006/?path=/story/style-lab-styledlabdemo--default
```

### Testing
```bash
# Run integration tests
npm run test -- src/ui/styleLab/__tests__/StyleLabDemo.integration.test.tsx

# Run all Style Lab tests
npm run test -- src/ui/styleLab/__tests__/
```

### Linting
```bash
# Lint Style Lab files
npm run lint -- src/ui/styleLab/
```

## Component Configuration

Each component accepts a configuration object with the following structure:

### Slider Configuration
```typescript
{
  minValue: number,           // Minimum value (0-100)
  maxValue: number,           // Maximum value (0-100)
  currentValue: number,       // Current value
  autoMove: boolean,         // Enable automatic movement
  moveSpeed: number,         // Movement speed (0.5-5)
  moveDirection: 'forward' | 'backward' | 'random',
  showValue: boolean,        // Show current value
  stepSize: number,          // Step increment
  trackHeight: number,       // Track height in pixels
}
```

### Toggle Configuration
```typescript
{
  isOn: boolean,             // Current state
  autoToggle: boolean,       // Enable automatic switching
  toggleInterval: number,    // Switch interval in ms
  showLabel: boolean,        // Show ON/OFF label
  toggleAnimation: boolean,  // Enable animation
  switchSize: 'small' | 'medium' | 'large',
}
```

### Progress Ring Configuration
```typescript
{
  percentage: number,        // Current percentage (0-100)
  autoFill: boolean,         // Enable auto fill/drain
  fillSpeed: number,         // Fill speed (0.5-5)
  strokeWidth: number,       // Stroke width in pixels
  ringSize: number,          // Ring diameter in pixels
  showPercentage: boolean,   // Show percentage text
  clockwise: boolean,        // Fill direction
}
```

## Preset Customization

### Creating New Presets
1. Create a new file in `src/ui/styleLab/presets/`
2. Export a `Partial<DemoConfig>` object
3. Export an `applyPresetNamePreset` function
4. Add to `src/ui/styleLab/presets/index.ts`

Example:
```typescript
// src/ui/styleLab/presets/customPreset.ts
import type { DemoConfig } from '../config/demoConfig';

export const customPreset: Partial<DemoConfig> = {
  animation: {
    enabled: true,
    speed: 1.2,
    reducedMotion: false,
  },
  // ... other configurations
};

export const applyCustomPreset = (baseConfig: DemoConfig): DemoConfig => {
  return {
    ...baseConfig,
    ...customPreset,
    // Deep merge nested objects
    layout: { ...baseConfig.layout, ...customPreset.layout },
    // ... other nested objects
  };
};
```

### Preset Metadata
Update `src/ui/styleLab/presets/index.ts` to include preset metadata:

```typescript
export const presetMetadata = {
  customPreset: {
    label: 'Custom Preset',
    description: 'Custom configuration description',
    icon: '🎨',
  },
  // ... other presets
} as const;
```

## Style Lab Tokens

The demo uses Style Laboratory tokens for all styling:

```tsx
import { useStyleLabTokens } from './hooks/useStyleLabTokens';

const tokens = useStyleLabTokens({});

// Access token values
const backgroundColor = tokens.preset.surfaces.panel.background;
const primaryColor = tokens.modifierStatus.active.background;
```

## Performance

### Optimization Features
- **Lazy Loading**: Components load on demand
- **Efficient Re-renders**: Minimal unnecessary updates
- **Memory Management**: Proper cleanup of intervals and timeouts
- **Bundle Optimization**: Tree-shaking for unused components

### Performance Metrics
- **Initial Load**: < 2s
- **Preset Switching**: < 100ms
- **Component Switching**: < 50ms
- **Animation Updates**: 60fps target

## Accessibility

### Features
- **ARIA Labels**: Proper labeling for all interactive elements
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Compatible with assistive technologies
- **Reduced Motion**: Respects user preferences
- **High Contrast**: Maintains readability

### Testing
Accessibility is tested in both integration tests and Storybook stories.

## Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Run the full test suite
5. Submit a pull request

### Code Standards
- Use TypeScript for all new code
- Follow ESLint configuration
- Add JSDoc comments for public APIs
- Include tests for new features

## License

Style Laboratory Demo is part of the RPG Balancer project and follows the same licensing terms.

## Support

For questions, issues, or contributions:
- Create an issue in the project repository
- Check the documentation in `docs/`
- Review existing examples in the codebase
