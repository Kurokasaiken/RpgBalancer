# PWA Install Banner Variant Generator - NP-192

**Date:** 2026-01-24  
**Agent:** Vector-PC  
**Status:** ✅ COMPLETED  

## Executive Summary

Config-first generator for PWA install banner variants with live preview tool, Zod validation, and A/B testing integration. Supports 5 layout types, 5 CTA styles, and comprehensive customization options.

## Overview

The Install Banner Variant Generator provides:
- **Config-First Design** - Zod schema validation for all configurations
- **5 Layout Types** - Compact, Standard, Expanded, Minimal, Card
- **5 CTA Styles** - Primary, Secondary, Outline, Ghost, Gradient
- **Live Preview** - Real-time banner rendering
- **Variant Management** - Add, edit, duplicate, delete variants
- **A/B Testing Export** - JSON export for NP-170 integration
- **Responsive Design** - All layouts mobile-friendly
- **i18n Ready** - Locale support for copy

## Variant Schema

### Copy Configuration

```typescript
{
  headline: string,        // 1-100 characters
  description: string,     // 1-200 characters
  ctaText: string,        // 1-30 characters
  dismissText?: string,   // 1-20 characters
  locale: string,         // Default: 'en'
}
```

### Layout Configuration

```typescript
{
  type: 'compact' | 'standard' | 'expanded' | 'minimal' | 'card',
  position: 'top' | 'bottom' | 'center' | 'top-right' | 'bottom-right',
  showIcon: boolean,
  iconSize?: 'small' | 'medium' | 'large',
  showDismiss: boolean,
  animation: 'slide' | 'fade' | 'bounce' | 'none',
}
```

### CTA Configuration

```typescript
{
  style: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient',
  size: 'small' | 'medium' | 'large',
  fullWidth: boolean,
  icon?: string,
  showLoading: boolean,
}
```

### Banner Variant

```typescript
{
  id: string,
  name: string,
  description: string,
  copy: CopyConfig,
  layout: LayoutConfig,
  cta: CTAConfig,
  enabled: boolean,
  weight: number,        // 0-100 for A/B testing
  tags: string[],
}
```

## Default Variants (5 included)

### 1. Compact Primary

**Layout:** Compact, Bottom  
**CTA:** Primary, Medium  
**Copy:**
- Headline: "Install Punch Club"
- Description: "Get the full experience with offline access"
- CTA: "Install Now"

**Use Case:** Non-intrusive, bottom banner for general users

### 2. Standard Gradient

**Layout:** Standard, Top  
**CTA:** Gradient, Large, Full Width  
**Copy:**
- Headline: "Take Punch Club Anywhere"
- Description: "Install our app for a faster, offline experience"
- CTA: "⚡ Get the App"

**Use Case:** Eye-catching top banner for engaged users

### 3. Expanded Outline

**Layout:** Expanded, Center  
**CTA:** Outline, Large, Full Width  
**Copy:**
- Headline: "Ready to Fight Offline?"
- Description: "Install Punch Club and train anytime, anywhere - even without internet"
- CTA: "Install App"

**Use Case:** Modal-style center banner for high-intent moments

### 4. Minimal Ghost

**Layout:** Minimal, Top-Right  
**CTA:** Ghost, Small  
**Copy:**
- Headline: "Install for Offline Access"
- Description: "Quick install, no app store needed"
- CTA: "Install"

**Use Case:** Subtle corner banner for power users

### 5. Card Secondary

**Layout:** Card, Bottom-Right  
**CTA:** Secondary, Medium  
**Copy:**
- Headline: "Join the Fight"
- Description: "Install Punch Club for the ultimate boxing experience"
- CTA: "🥊 Get Started"

**Use Case:** Card-style banner with boxing theme

## Usage

### Generator Tool

```bash
# Access the generator tool
# Navigate to: /tools/banner-variant-generator
```

### Hook Usage

```typescript
import { useBannerVariants } from '@/ui/punchClub/hooks/useBannerVariants';

function MyComponent() {
  const {
    variants,
    selectedVariant,
    addVariant,
    updateVariant,
    selectVariant,
    exportVariants,
  } = useBannerVariants();

  // Create new variant
  const newVariant = {
    id: 'custom-variant',
    name: 'Custom Variant',
    description: 'My custom banner',
    copy: {
      headline: 'Install Now',
      description: 'Get the app',
      ctaText: 'Install',
      locale: 'en',
    },
    layout: {
      type: 'compact',
      position: 'bottom',
      showIcon: true,
      showDismiss: true,
      animation: 'slide',
    },
    cta: {
      style: 'primary',
      size: 'medium',
      fullWidth: false,
      showLoading: false,
    },
    enabled: true,
    weight: 50,
    tags: ['custom'],
  };

  addVariant(newVariant);
}
```

### Export for A/B Testing

```typescript
// Export variants
const json = exportVariants();

// Result format
{
  "name": "Punch Club Install Banner Variants",
  "description": "Generated banner variants for A/B testing",
  "variants": [...],
  "defaultVariantId": "compact-primary",
  "createdAt": "2026-01-24T10:00:00.000Z",
  "updatedAt": "2026-01-24T10:00:00.000Z"
}
```

## Layout Types

### Compact
- **Size:** Small, minimal space
- **Best For:** Bottom banners, non-intrusive
- **Features:** Icon, headline, description, CTA
- **Max Width:** 400px

### Standard
- **Size:** Medium, balanced
- **Best For:** Top/bottom banners, general use
- **Features:** Icon, headline, description, CTA, dismiss
- **Max Width:** 500px

### Expanded
- **Size:** Large, detailed
- **Best For:** Center modals, high-intent
- **Features:** Large icon, headline, long description, CTA
- **Max Width:** 500px

### Minimal
- **Size:** Extra small, subtle
- **Best For:** Corner banners, power users
- **Features:** Headline, short description, small CTA
- **Max Width:** 300px

### Card
- **Size:** Medium, styled
- **Best For:** Themed banners, special promotions
- **Features:** Border, icon, headline, description, CTA
- **Max Width:** 500px

## CTA Styles

### Primary
- **Background:** Gold (#ffd700)
- **Text:** Dark (#1a1a2e)
- **Use Case:** Main action, high conversion

### Secondary
- **Background:** Dark (#2a2a4e)
- **Text:** Gold (#ffd700)
- **Border:** Gold
- **Use Case:** Alternative action

### Outline
- **Background:** Transparent
- **Text:** Gold (#ffd700)
- **Border:** Gold (2px)
- **Use Case:** Subtle emphasis

### Ghost
- **Background:** Transparent
- **Text:** Gold (#ffd700)
- **Border:** None
- **Use Case:** Minimal design

### Gradient
- **Background:** Gold to Orange gradient
- **Text:** Dark (#1a1a2e)
- **Use Case:** Eye-catching, premium

## Banner Positions

### Top
- Fixed to top of viewport
- Full width
- Slides down on appear

### Bottom
- Fixed to bottom of viewport
- Full width
- Slides up on appear

### Center
- Centered in viewport
- Modal-style
- Fades in on appear

### Top-Right
- Fixed to top-right corner
- Compact size
- Fades in on appear

### Bottom-Right
- Fixed to bottom-right corner
- Card-style
- Slides in from right

## Generator Tool Features

### 1. Variant List
- View all variants
- Select variant to edit
- Duplicate existing variants
- Delete variants
- See variant count

### 2. Live Preview
- Real-time rendering
- Toggle preview on/off
- See exact appearance
- Test different positions

### 3. Editor
- Edit copy (headline, description, CTA)
- Configure layout (type, position, icon)
- Customize CTA (style, size, width)
- Character limits enforced

### 4. Export/Import
- Export to JSON
- Download JSON file
- Copy to clipboard
- Import from JSON
- Reset to defaults

### 5. Variant Management
- Add new variants
- Update existing variants
- Duplicate variants
- Remove variants
- Validate all changes

## A/B Testing Integration (NP-170)

### Export Format

```json
{
  "name": "Punch Club Install Banner Variants",
  "description": "Generated banner variants for A/B testing",
  "variants": [
    {
      "id": "compact-primary",
      "name": "Compact Primary",
      "weight": 50,
      ...
    },
    {
      "id": "standard-gradient",
      "name": "Standard Gradient",
      "weight": 50,
      ...
    }
  ],
  "defaultVariantId": "compact-primary"
}
```

### Weight Distribution

- **Weight:** 0-100 per variant
- **Total:** Sum of all weights determines distribution
- **Example:** 
  - Variant A: weight 50 (50%)
  - Variant B: weight 30 (30%)
  - Variant C: weight 20 (20%)

### Integration Steps

1. Generate variants in tool
2. Export JSON
3. Import into NP-170 A/B framework
4. Configure test parameters
5. Deploy and track metrics

## Variant Examples

### High Conversion Variant

```typescript
{
  id: 'high-conversion',
  name: 'High Conversion',
  copy: {
    headline: 'Get Offline Access Now',
    description: 'Install in seconds. No app store required.',
    ctaText: 'Install Free',
  },
  layout: {
    type: 'standard',
    position: 'top',
    showIcon: true,
    iconSize: 'large',
    showDismiss: false,
    animation: 'slide',
  },
  cta: {
    style: 'gradient',
    size: 'large',
    fullWidth: true,
    icon: '⚡',
  },
  weight: 60,
}
```

### Minimal Distraction Variant

```typescript
{
  id: 'minimal-distraction',
  name: 'Minimal Distraction',
  copy: {
    headline: 'Install App',
    description: 'Offline access',
    ctaText: 'Install',
  },
  layout: {
    type: 'minimal',
    position: 'top-right',
    showIcon: false,
    showDismiss: false,
    animation: 'fade',
  },
  cta: {
    style: 'ghost',
    size: 'small',
    fullWidth: false,
  },
  weight: 20,
}
```

### Themed Variant

```typescript
{
  id: 'boxing-theme',
  name: 'Boxing Theme',
  copy: {
    headline: 'Train Anywhere, Anytime',
    description: 'Install Punch Club and become the champion',
    ctaText: 'Start Training',
  },
  layout: {
    type: 'card',
    position: 'bottom-right',
    showIcon: true,
    iconSize: 'medium',
    showDismiss: true,
    animation: 'bounce',
  },
  cta: {
    style: 'primary',
    size: 'medium',
    fullWidth: false,
    icon: '🥊',
  },
  weight: 40,
}
```

## Best Practices

### Copy Guidelines

1. **Headline** - Clear, action-oriented (5-10 words)
2. **Description** - Benefits-focused (10-20 words)
3. **CTA** - Verb-first, specific (1-3 words)
4. **Tone** - Match brand voice
5. **Length** - Respect character limits

### Layout Selection

1. **Compact** - General use, non-intrusive
2. **Standard** - Balanced visibility
3. **Expanded** - High-intent moments
4. **Minimal** - Power users, subtle
5. **Card** - Themed campaigns

### CTA Optimization

1. **Primary** - Main conversion goal
2. **Gradient** - Premium features
3. **Outline** - Secondary actions
4. **Ghost** - Minimal design
5. **Secondary** - Alternative paths

### Position Strategy

1. **Top** - High visibility, may be intrusive
2. **Bottom** - Less intrusive, good mobile UX
3. **Center** - Modal-style, high intent
4. **Top-Right** - Subtle, desktop-friendly
5. **Bottom-Right** - Card-style, non-blocking

### A/B Testing Tips

1. Test one variable at a time
2. Run tests for statistical significance
3. Track conversion rates
4. Consider user segments
5. Iterate based on data

## Prohibited Operations (Enforced)

✅ **No Hardcoded Copy** - All text in config  
✅ **Responsive Layouts** - All variants mobile-friendly  
✅ **Validated Variants** - Zod schema validation required  

## Troubleshooting

### Issue: Variant Not Saving

**Solution:** Check Zod validation errors
```typescript
try {
  BannerVariantSchema.parse(variant);
} catch (error) {
  console.error('Validation error:', error);
}
```

### Issue: Preview Not Updating

**Solution:** Ensure selectedVariant is set
```typescript
selectVariant(variantId);
```

### Issue: Export Fails

**Solution:** Verify all variants are valid
```typescript
variants.forEach(v => validateVariant(v));
```

## Future Enhancements

- [ ] Visual editor with drag-and-drop
- [ ] Image upload for custom icons
- [ ] Animation preview
- [ ] Mobile device preview
- [ ] Multi-language copy management
- [ ] Template library
- [ ] Analytics integration
- [ ] Conversion tracking

## Resources

### Internal Documentation
- `src/ui/punchClub/hooks/useBannerVariants.ts` - Hook
- `src/ui/punchClub/tools/InstallBannerVariantGenerator.tsx` - Generator tool

### Related Documentation
- NP-170 A/B Test Framework
- PC-M2E Install Flow
- PWA Install Guidelines

## Conclusion

The PWA Install Banner Variant Generator provides comprehensive config-first tooling for creating, previewing, and exporting banner variants with Zod validation and A/B testing integration. Supports 5 layout types, 5 CTA styles, and complete customization for optimal install conversion rates.

---

**Last Updated:** 2026-01-24  
**Next Review:** 2026-04-24  
**Maintainer:** Vector-PC (Cascade AI)
