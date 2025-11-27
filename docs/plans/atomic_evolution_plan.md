# Project Architecture Refactoring - Modern Best Practices 2024

## Executive Summary

This plan refactors the RPG Balancer application to follow 2024 best practices for maintainability, scalability, and extensibility. The core innovation—**weight-based creator systems**—will be documented as the project's architectural backbone, enabling consistent patterns across all entity creators (spells, items, characters, races, etc.).

## Project Philosophy: Weight-Based Creator System

### Core Concept
The Spell Creator represents the foundational pattern for ALL entity creation in this project:

**System Formula:**
```
Balance = Σ(selected_weights) - Target_Cost
```

**Key Principles:**
1. **Configurable Ticks:** Each stat has multiple ticks (value/weight pairs)
2. **Slider Selection:** User selects active tick via horizontal slider
3. **Weight-Based Cost:** Balance calculated from sum of selected weights
4. **User-Defined Baseline:** "Save Default" sets the reference configuration
5. **Dynamic Recalculation:** All changes trigger automatic balance updates

This pattern will be applied to:
- ✅ Spell Creation (implemented)
- 🔲 Item Creation
- 🔲 Character Creation  
- 🔲 Race/Class Creation
- 🔲 Ability Creation

---

## User Review Required

> [!WARNING]
> **Breaking Changes:**  
> - Component file restructuring (imports will change)
> - Notification API change (removing `alert()` calls)
> - CSS extraction (inline Tailwind → extracted classes)

> [!IMPORTANT]
> **Timeline:** This is a multi-phase refactoring. Phase 1 (notifications + basic cleanup) can be done immediately. Phase 2 (full restructure) should be scheduled when you have time for testing.

---

## Research Findings

### 1. Component Architecture (2024 Best Practices)

**Recommended Approach:**
- **Feature-Based Structure** (not type-based)
- **Atomic Design** for reusable components
- **Single Responsibility Principle**
- **Custom Hooks** for shared logic
- **Composition over Inheritance**

**Applied to This Project:**
```
src/
  features/
    spellCreation/
      components/
        SpellCreation.tsx
        SpellIdentityCard/
          index.tsx
         styles.module.css
        EnhancedStatSlider/
          index.tsx
          StatSliderTrack.tsx
          StatSliderTick.tsx
          styles.module.css
      hooks/
        useSpellBalance.ts
        useSpellStorage.ts
        useStatSteps.ts
      utils/
        calculateBalance.ts
        damageFormulas.ts
  shared/
    components/
      WeightBasedCreator/
        index.tsx
        useWeightedBalance.ts
```

### 2. CSS Organization

**Recommended: Hybrid Approach**
- **Tailwind CSS:** For utility classes and rapid prototyping
- **CSS Modules:** For component-specific complex styles
- **Design Tokens:** Centralized theme configuration

**Benefits:**
- Scoped styles prevent conflicts
- Tailwind for quick iterations
- CSS Modules for complex animations/custom slider styles
- Better organization and maintainability

### 3. Modern Notifications

**Winner: Sonner**
- ✅ Lightweight (~3KB)
- ✅ Beautiful default animations
- ✅ Accessibility-first (ARIA, keyboard nav)
- ✅ Official shadcn/ui toast component
- ✅ Promise API for async operations
- ✅ Perfect for modern glassmorphic UI

---

## Implementation Plan

### Phase 1: Quick Wins (Immediate)

#### 1.1 Implement Sonner Notifications
**Files to Modify:**
- `package.json` (add sonner dependency)
- Create `src/shared/components/Toaster.tsx`
- Update `src/ui/spell/SpellCreation.tsx` (replace alerts)
- Update `src/ui/spell/components/ActionsBar.tsx`

**Changes:**
```tsx
// Before
alert('Spell saved!');

// After
toast.success('Spell saved successfully!', {
  description: `"${spell.name}" has been added to your library`
});
```

#### 1.2 Extract Shared Logic
Create custom hooks:
- `useWeightedBalance.ts` - Generic balance calculation
- `useStatSteps.ts` - Stat step management
- `useDefaultStorage.ts` - User defaults persistence

### Phase 2: Component Restructuring

#### 2.1 Break Down EnhancedStatSlider
**Current:** 220 lines, handles everything  
**New Structure:**
```
EnhancedStatSlider/
  index.tsx (60 lines - orchestrator)
  StatSliderHeader.tsx (30 lines)
  StatSliderTrack.tsx (50 lines)
  StatSliderTick.tsx (40 lines)
  styles.module.css (slider-specific styles)
  useStatSlider.ts (logic hook)
```

#### 2.2 Extract CSS to Modules
Currently: Inline styles + JSX `<style>` tags  
New:  
```css
/* EnhancedStatSlider/styles.module.css */
.sliderThumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  box-shadow: 
    0 0 12px rgba(59, 130, 246, 0.6),
    0 0 20px rgba(59, 130, 246, 0.4);
  transition: all 0.2s ease;
}

.sliderThumb:hover {
  transform: scale(1.15);
  box-shadow: 
    0 0 16px rgba(59, 130, 246, 0.8),
    0 0 28px rgba(59, 130, 246, 0.6);
}
```

#### 2.3 Create Abstract WeightBasedCreator
**New Component:**
```tsx
// src/shared/components/WeightBasedCreator.tsx
interface WeightBasedCreatorProps<T> {
  entity: T;
  statDefinitions: StatDefinition[];
  onSave: (entity: T) => void;
  calculateBalance: (entity: T, weights: Record<string, number>) => number;
}

// This can be reused for Items, Characters, etc.
```

### Phase 3: Documentation

#### 3.1 Create Architecture Doc
**File:** `docs/ARCHITECTURE.md`
**Contents:**
- Weight-based creator pattern explanation
- Component hierarchy diagrams  
- Data flow diagrams
- Extension guide for new entity types

#### 3.2 Update Project Philosophy Doc
**File:** `docs/PROJECT_PHILOSOPHY.md`
**Contents:**
- Core design principles
- Weight-based balancing system
- UI/UX guidelines (glassmorphism)
- Pattern library for future features

---

## File-by-File Changes

### MODIFY: `package.json`
```json
{
  "dependencies": {
    "sonner": "^1.3.1"
  }
}
```

### CREATE: `src/shared/components/Toaster.tsx`
```tsx
import { Toaster as SonnerToaster } from 'sonner';

export const Toaster = () => (
  <SonnerToaster 
    position="top-right"
    theme="dark"
    richColors
    expand={true}
    closeButton
  />
);
```

### MODIFY: `src/main.tsx` or `App.tsx`
Add `<Toaster />` at root level

### MODIFY: `src/ui/spell/SpellCreation.tsx`
- Replace all `alert()` calls with `toast.success/error/info()`
- Extract balance calculation to `useWeightedBalance` hook
- Extract stat steps logic to `useStatSteps` hook
- Reduce component size from 380+ lines to ~200 lines

### CREATE: `src/shared/hooks/useWeightedBalance.ts`
```tsx
export const useWeightedBalance = <T,>(
  entity: T,
  statSteps: Record<string, Array<{value: number, weight: number}>>,
  selectedTicks: Record<string, number>,
  targetCost: number,
  statFields: string[]
): number => {
  // Generic balance calculation logic
  return useMemo(() => {
    const totalWeight = statFields.reduce((sum, field) => {
      const steps = statSteps[field];
      if (steps && steps.length > 0) {
        const idx = selectedTicks[field] || 0;
        return sum + (steps[idx]?.weight || 0);
      }
      return sum;
    }, 0);
    
    return totalWeight - targetCost;
  }, [entity, statSteps, selectedTicks, targetCost]);
};
```

### CREATE: `docs/ARCHITECTURE.md`
(Full architecture documentation)

### CREATE: `docs/PROJECT_PHILOSOPHY.md`
(Design system and patterns)

---

## Verification Plan

### Phase 1 Verification
1. Install Sonner and verify no console errors
2. Replace one `alert()` → test toast appearance
3. Replace all `alert()` calls → verify all notifications work
4. Test different toast types (success, error, info)

### Phase 2 Verification
1. Extract one hook → verify functionality unchanged
2. Break down EnhancedStatSlider → verify slider still works
3. Extract CSS → verify styling matches original
4. Run full UI test suite

### Phase 3 Verification
1. Documentation review
2. Attempt to create Item Creator following pattern
3. Verify all diagrams are clear

---

## Timeline Recommendation

**Phase 1 (Immediate):** 1-2 hours
- Notifications are critical UX improvement
- Low risk, high impact

**Phase 2 (Next Session):** 4-6 hours
- Component restructuring needs careful testing
- Can be done incrementally (one component at a time)

**Phase 3 (Ongoing):** 2-3 hours
- Documentation can be done alongside Phase 2
- Living documents, updated as patterns evolve

---

## Next Steps After This Refactoring

1. **Create Item Creator** using WeightBasedCreator pattern
2. **Create Character Creator** using same pattern
3. **Build shared UI component library** (glassmorphic cards, buttons, inputs)
4. **Implement formula system** for damage calculations
5. **Add comprehensive testing** (Jest + React Testing Library)
