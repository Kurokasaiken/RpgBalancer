# Generic Design Tokens for New Components

## Overview

This system provides a **global, skin-agnostic design token system** for all new components. Unlike WanderlustLayout (which is specific to Wanderlust skin), these tokens work across all skins and provide consistent defaults for typography, spacing, and borders.

## Token Categories

### Typography Tokens

```typescript
interface TypographyTokens {
  fontFamily: {
    display: string;   // Display/headline fonts
    heading: string;   // Heading fonts
    body: string;      // Body text fonts
    caption: string;   // Caption/small text fonts
    mono: string;     // Monospace fonts
  };
  fontSize: {
    xs: string;       // 11px
    sm: string;       // 12px
    base: string;     // 14px
    lg: string;       // 16px
    xl: string;       // 18px
    '2xl': string;    // 24px
    '3xl': string;    // 32px
  };
  fontWeight: {
    normal: number;   // 400
    medium: number;   // 500
    semibold: number; // 600
    bold: number;     // 700
  };
  lineHeight: {
    tight: number;    // 1.25
    normal: number;   // 1.5
    relaxed: number;  // 1.75
  };
  letterSpacing: {
    tight: string;    // -0.025em
    normal: string;   // 0
    wide: string;     // 0.025em
  };
  color: {
    primary: string;   // Main text color
    secondary: string; // Secondary text color
    tertiary: string;  // Tertiary/muted text color
    inverse: string;   // Inverse text color
  };
}
```

### Spacing Tokens

```typescript
interface SpacingTokens {
  xs: string;   // 4px
  sm: string;   // 8px
  md: string;   // 12px
  lg: string;   // 16px
  xl: string;   // 24px
  '2xl': string; // 32px
  '3xl': string; // 48px
}
```

### Border Tokens

```typescript
interface BorderTokens {
  width: {
    thin: string;   // 1px
    medium: string; // 2px
    thick: string;  // 3px
  };
  radius: {
    sm: string;   // 4px
    md: string;   // 8px
    lg: string;   // 12px
    xl: string;   // 16px
    full: string; // 9999px
  };
  color: {
    default: string; // Default border color
    subtle: string;  // Subtle border color
    strong: string;  // Strong border color
  };
}
```

## Usage

### Basic Usage

```tsx
import { useGenericTokens } from '@/ui/styleLab/hooks/useGenericTokens';

const MyComponent = () => {
  const { typography, spacing, border } = useGenericTokens();

  return (
    <div style={{
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.base,
      color: typography.color.primary,
      padding: spacing.md,
      border: `${border.width.medium} solid ${border.color.default}`,
      borderRadius: border.radius.md,
    }}>
      Content
    </div>
  );
};
```

### Individual Token Hooks

For finer control, you can use individual hooks:

```tsx
import { useTypographyTokens, useSpacingTokens, useBorderTokens } from '@/ui/styleLab/hooks/useGenericTokens';

const MyComponent = () => {
  const typography = useTypographyTokens();
  const spacing = useSpacingTokens();
  const border = useBorderTokens();

  return (
    <div style={{
      fontFamily: typography.fontFamily.heading,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      padding: spacing.lg,
      borderRadius: border.radius.lg,
    }}>
      Heading
    </div>
  );
};
```

## Best Practices

### 1. Always Use Tokens for New Components

When creating a new component, use generic tokens as the default styling:

```tsx
// ✅ Good - uses generic tokens
const NewCard = () => {
  const { typography, spacing, border } = useGenericTokens();
  
  return (
    <div style={{
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.base,
      padding: spacing.lg,
      border: `${border.width.thin} solid ${border.color.subtle}`,
      borderRadius: border.radius.md,
    }}>
      {/* content */}
    </div>
  );
};

// ❌ Bad - hardcoded values
const NewCard = () => {
  return (
    <div style={{
      fontFamily: 'Arial',
      fontSize: '14px',
      padding: '16px',
      border: '1px solid #ccc',
      borderRadius: '8px',
    }}>
      {/* content */}
    </div>
  );
};
```

### 2. Override for Skin-Specific Needs

If a component needs skin-specific styling (e.g., Wanderlust), use skin-aware components:

```tsx
// For Wanderlust-specific content, use WanderlustLayout primitives
import { WanderlustHeading, WanderlustField } from '@/ui/wanderlust-surface/layout';

// For generic content, use generic tokens
import { useGenericTokens } from '@/ui/styleLab/hooks/useGenericTokens';
```

### 3. Token Hierarchy

```
Generic Tokens (useGenericTokens)
  ↓
Skin-Specific Tokens (WanderlustLayout, etc.)
  ↓
Inline Styles (only for one-off exceptions)
```

## CSS Variables

All tokens use CSS variables with fallbacks, so they can be overridden globally:

```css
:root {
  --font-display: "Cinzel", serif;
  --font-size-base: 14px;
  --spacing-md: 12px;
  --border-radius-md: 8px;
  --text-primary: #e2e8f0;
}
```

## Integration with Existing Systems

### Style Lab Presets

The generic tokens are part of the `StyleLabPreset` interface:

```typescript
export interface StyleLabPreset {
  // ... existing tokens
  genericTypography: TypographyTokens;
  genericSpacing: SpacingTokens;
  genericBorder: BorderTokens;
}
```

### WanderlustLayout

WanderlustLayout is **NOT** replaced by generic tokens. They serve different purposes:

- **Generic Tokens**: For all new components, skin-agnostic defaults
- **WanderlustLayout**: For Wanderlust-specific content (fantasy/epic theme)

Use both together:
```tsx
<WanderlustSurface>
  <WanderlustAmbientField>
    {/* Use WanderlustLayout for content inside Wanderlust */}
    <WanderlustHeading title="Quest Title" />
    
    {/* Use generic tokens for generic UI elements */}
    <div style={{ padding: useSpacingTokens().md }}>
      <Button>Generic Button</Button>
    </div>
  </WanderlustAmbientField>
</WanderlustSurface>
```

## File Structure

```
src/ui/styleLab/
├── tokens/
│   └── defaultStyleLabPreset.ts    # Token definitions + presets
├── hooks/
│   └── useGenericTokens.ts         # Hook for accessing tokens
└── GENERIC_TOKENS_GUIDE.md          # This file
```

## Migration Guide

### Existing Components

Existing components don't need migration. Only use generic tokens for **new components**.

### New Components

When creating a new component:

1. Import `useGenericTokens` hook
2. Apply tokens to all styling properties
3. Test across different skins
4. Document any skin-specific overrides

## Examples

### Text Component

```tsx
import { useTypographyTokens } from '@/ui/styleLab/hooks/useGenericTokens';

const Text = ({ children, variant = 'body' }) => {
  const typography = useTypographyTokens();
  
  const variantStyles = {
    display: {
      fontFamily: typography.fontFamily.display,
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
    },
    heading: {
      fontFamily: typography.fontFamily.heading,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
    },
    body: {
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.normal,
    },
    caption: {
      fontFamily: typography.fontFamily.caption,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.normal,
    },
  };

  return <span style={variantStyles[variant]}>{children}</span>;
};
```

### Card Component

```tsx
import { useGenericTokens } from '@/ui/styleLab/hooks/useGenericTokens';

const Card = ({ children }) => {
  const { typography, spacing, border } = useGenericTokens();
  
  return (
    <div style={{
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.base,
      color: typography.color.primary,
      padding: spacing.lg,
      border: `${border.width.thin} solid ${border.color.default}`,
      borderRadius: border.radius.lg,
      backgroundColor: 'var(--surface-bg, rgba(15, 23, 42, 0.8))',
    }}>
      {children}
    </div>
  );
};
```

## Summary

- **Use generic tokens for all new components** as the default styling system
- **WanderlustLayout remains** for Wanderlust-specific content
- **Tokens are skin-agnostic** and work across all skins
- **CSS variables** allow global customization
- **Hook-based API** for easy React integration
