# Minimal HUD Tokens

This document describes the Minimal HUD Token Library, a config-first system for styling Minimal Gameplay HUD components with type-safe, maintainable design tokens.

## Overview

The Minimal HUD Token Library provides a centralized, type-safe system for managing visual design tokens used across Minimal Gameplay HUD components. It follows the config-first architecture principle, ensuring consistent styling while maintaining flexibility for future customization.

## Architecture

### Core Components

- **`MinimalHudTokensSchema`**: Zod schema defining the structure and validation rules
- **`defaultMinimalHudTokens`**: Default token configuration
- **`resolveHudToken()`**: Type-safe token resolution with fallback support
- **`mergeHudTokens()`**: Deep merge functionality for custom token overrides

### Token Categories

#### Typography
Font-related tokens for consistent text styling.

```typescript
typography: {
  fontFamily: string;      // Font stack for cross-platform compatibility
  baseFontSize: number;    // Base font size in pixels
  lineHeight: number;      // Line height multiplier
  fontWeightNormal: number;// Normal text weight
  fontWeightBold: number;  // Bold text weight
  letterSpacing: string;   // Letter spacing for readability
}
```

#### Gradients
Background gradient definitions for visual depth.

```typescript
gradients: {
  primary: string;   // Main HUD background gradient
  secondary: string; // Accent gradient for highlights
  warning: string;   // Warning state gradient
  danger: string;    // Error state gradient
}
```

#### Spacing
Consistent spacing scale for layout and positioning.

```typescript
spacing: {
  xs: string; // Extra small (0.25rem)
  sm: string; // Small (0.5rem)
  md: string; // Medium (1rem)
  lg: string; // Large (1.5rem)
  xl: string; // Extra large (2rem)
}
```

#### Badge Variants
Status indicator styling for different states.

```typescript
badgeVariants: {
  [variant: string]: {
    backgroundColor: string;
    color: string;
    borderRadius: string;
    padding: string;
  }
}
```

#### Warning Tokens
Severity-based styling for warning indicators.

```typescript
warningTokens: {
  [severity: string]: {
    backgroundColor: string;
    color: string;
    border: string;
    animation: string;
  }
}
```

## Usage

### Basic Token Resolution

```typescript
import { resolveHudToken } from '@/ui/idleVillage/tokens/minimalHudTokens';

// Resolve individual tokens
const fontSize = resolveHudToken('typography.baseFontSize'); // 14
const spacing = resolveHudToken('spacing.md'); // '1rem'
const gradient = resolveHudToken('gradients.primary');
```

### Component Integration

```typescript
import { defaultMinimalHudTokens } from '@/ui/idleVillage/tokens/minimalHudTokens';

function HudComponent() {
  const styles = {
    container: {
      background: defaultMinimalHudTokens.gradients.primary,
      padding: defaultMinimalHudTokens.spacing.md,
      fontFamily: defaultMinimalHudTokens.typography.fontFamily,
      fontSize: defaultMinimalHudTokens.typography.baseFontSize,
    },
    badge: defaultMinimalHudTokens.badgeVariants.success,
  };

  return (
    <div style={styles.container}>
      <span style={styles.badge}>Success</span>
    </div>
  );
}
```

### Custom Token Overrides

```typescript
import { mergeHudTokens, defaultMinimalHudTokens } from '@/ui/idleVillage/tokens/minimalHudTokens';

// Create custom theme
const darkTheme = mergeHudTokens(defaultMinimalHudTokens, {
  gradients: {
    primary: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
    secondary: 'linear-gradient(135deg, #3d3d3d, #4d4d4d)',
  },
  typography: {
    baseFontSize: 16,
  },
});

// Use custom theme
const customStyles = {
  background: darkTheme.gradients.primary,
  fontSize: darkTheme.typography.baseFontSize,
};
```

## Token Mapping

### HUD Component Integration

| Component | Token Path | Usage |
|-----------|------------|--------|
| Container | `gradients.primary` | Background gradient |
| Typography | `typography.*` | Font styling |
| Spacing | `spacing.*` | Padding, margins |
| Status Badges | `badgeVariants.*` | Status indicators |
| Warnings | `warningTokens.*` | Alert styling |

### Specific Component Examples

#### Resource Panel
```css
.resource-panel {
  background: /* gradients.primary */;
  padding: /* spacing.md */;
  border-radius: 24px; /* from minimalConfig.ui.tokens.cardRadiusPx */
}
```

#### Status Badge
```css
.status-badge {
  background-color: /* badgeVariants.success.backgroundColor */;
  color: /* badgeVariants.success.color */;
  padding: /* badgeVariants.success.padding */;
  border-radius: /* badgeVariants.success.borderRadius */;
}
```

#### Warning Indicator
```css
.warning-indicator {
  background-color: /* warningTokens.medium.backgroundColor */;
  color: /* warningTokens.medium.color */;
  border: /* warningTokens.medium.border */;
  animation: /* warningTokens.medium.animation */;
}
```

## Extending Tokens

### Adding New Token Categories

1. Define the schema in `MinimalHudTokensSchema`
2. Add default values to `defaultMinimalHudTokens`
3. Update the `MinimalHudTokens` type
4. Update `mergeHudTokens` to handle the new category

### Example: Adding Animation Tokens

```typescript
// 1. Extend schema
const AnimationTokensSchema = z.object({
  duration: z.string(),
  easing: z.string(),
});

// Add to main schema
export const MinimalHudTokensSchema = z.object({
  // ... existing fields
  animations: AnimationTokensSchema,
});

// 2. Add defaults
export const defaultMinimalHudTokens: MinimalHudTokens = {
  // ... existing fields
  animations: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// 3. Update merge function
export function mergeHudTokens(base: MinimalHudTokens, override: Partial<MinimalHudTokens>): MinimalHudTokens {
  return {
    // ... existing merges
    animations: { ...base.animations, ...override.animations },
  };
}
```

### Theme Preset Creation

```typescript
// Create preset configurations
export const highContrastTheme: Partial<MinimalHudTokens> = {
  badgeVariants: {
    success: {
      backgroundColor: '#00ff00',
      color: '#000000',
    },
    danger: {
      backgroundColor: '#ff0000',
      color: '#ffffff',
    },
  },
  warningTokens: {
    high: {
      backgroundColor: '#ff0000',
      color: '#ffffff',
      border: '2px solid #ffffff',
    },
  },
};

// Usage
const accessibleTheme = mergeHudTokens(defaultMinimalHudTokens, highContrastTheme);
```

## Best Practices

### Token Organization

- Group related properties together (colors, spacing, typography)
- Use semantic naming (`primary`, `secondary` vs `blue`, `red`)
- Maintain consistent value types within categories

### Component Integration

- Prefer token resolution over direct imports when possible
- Use `resolveHudToken()` for dynamic token access
- Cache resolved tokens to avoid repeated lookups
- Document token dependencies in component comments

### Theme Customization

- Create theme presets for different use cases
- Use `mergeHudTokens()` for theme composition
- Validate custom themes against the schema
- Test theme changes across all components

## Validation

### Schema Validation

All token configurations are validated against the Zod schema:

```typescript
import { MinimalHudTokensSchema } from '@/ui/idleVillage/tokens/minimalHudTokens';

const result = MinimalHudTokensSchema.safeParse(customTokens);
if (!result.success) {
  console.error('Invalid token configuration:', result.error);
}
```

### Runtime Safety

- `resolveHudToken()` provides fallback values for missing tokens
- Console warnings for invalid token paths
- TypeScript ensures compile-time safety

## Migration Guide

### Upgrading from Inline Styles

1. Identify repeated style values in components
2. Create appropriate token categories
3. Replace inline values with token references
4. Update component props to accept token overrides

### Example Migration

```typescript
// Before
const styles = {
  background: 'linear-gradient(135deg, rgba(14,22,30,0.92), rgba(7,11,17,0.8))',
  padding: '1rem',
  fontSize: 14,
};

// After
import { resolveHudToken } from '@/ui/idleVillage/tokens/minimalHudTokens';

const styles = {
  background: resolveHudToken('gradients.primary'),
  padding: resolveHudToken('spacing.md'),
  fontSize: resolveHudToken('typography.baseFontSize'),
};
```

## Troubleshooting

### Common Issues

#### Token Not Found
```
[MinimalHudTokens] Token not found: invalid.path
```

**Solution**: Check token path spelling and structure against the schema.

#### Schema Validation Errors
```
Invalid token configuration: { error details }
```

**Solution**: Ensure custom tokens match the expected structure and types.

#### Merge Conflicts
Theme merging may overwrite expected values.

**Solution**: Use deep merge carefully and test merged configurations.

## Future Enhancements

### Planned Features

1. **CSS Custom Properties**: Automatic CSS variable generation
2. **Theme Persistence**: Save/load custom themes
3. **Dynamic Theming**: Runtime theme switching
4. **Token Validation**: Enhanced schema validation with custom rules
5. **Documentation Generation**: Automatic token documentation

### Integration Points

- **Style Lab**: Enhanced theme management
- **Component Library**: Automatic token application
- **Design System**: Centralized token management
- **Accessibility**: High contrast theme support

## API Reference

### `resolveHudToken(path: string, fallback?: any): any`

Resolves a token value by dot-separated path.

**Parameters:**
- `path`: Dot-separated token path (e.g., `'typography.baseFontSize'`)
- `fallback`: Optional fallback value for missing tokens

**Returns:** Token value or fallback

### `mergeHudTokens(base: MinimalHudTokens, override: Partial<MinimalHudTokens>): MinimalHudTokens`

Deep merges base tokens with overrides.

**Parameters:**
- `base`: Base token configuration
- `override`: Partial override configuration

**Returns:** Merged token configuration

### `defaultMinimalHudTokens: MinimalHudTokens`

Default token configuration.

### `MinimalHudTokensSchema: ZodSchema`

Zod schema for token validation.

## Related Documentation

- [Minimal Gameplay Config](../balancing/config/idleVillage/minimalGameplayConfig.ts)
- [Style Lab Guidelines](../../docs/style_lab_guidelines.md)
- [Component Integration Patterns](../../docs/component_integration.md)
