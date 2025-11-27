# Spell Creation UI - Source of Truth Specification

**Version:** 1.0  
**Last Updated:** 2025-11-27  
**Approved Commit:** ba86a1f

This document defines the exact specifications for the Spell Creation page. Any modifications MUST be checked against this document.

---

## 🎯 Core Stats Configuration

### Stat Groups (EXACT order and grouping)
```typescript
// Core Stats (3)
['effect', 'eco', 'dangerous']

// Advanced Stats (2)
['scale', 'precision']

// Optional Stats (5)
['aoe', 'cooldown', 'range', 'priority', 'manaCost']

// TOTAL: 10 stats (not more, not less)
```

### Default Stat Order
The default order MUST be:
```
effect → eco → dangerous → scale → precision → aoe → cooldown → range → priority → manaCost
```

---

## 🎨 EnhancedStatSlider Component Specifications

### Layout Structure
```
┌─────────────────────────────────────────┐
│ [Header: drag handle + label + collapse]│  <- Draggable ONLY
├─────────────────────────────────────────┤
│ [Row 1: Value inputs (14px wide each)]  │  <- NOT draggable
│ [Row 2: Slider track with ticks]        │  <- NOT draggable
│ [Row 3: Weight inputs (14px wide each)] │  <- NOT draggable
│ [Description text]                      │
└─────────────────────────────────────────┘
```

### Critical Specifications

#### 1. **Drag and Drop**
- **ONLY the header is draggable** (`draggable` prop on header div ONLY)
- The rest of the card MUST NOT be draggable
- This allows users to interact with sliders without triggering drag

#### 2. **Input Box Dimensions**
- Value inputs: `w-14` (14px/3.5rem width)
- Weight inputs: `w-14` (14px/3.5rem width)
- Text sizes: Values `text-sm`, Weights `text-xs`

#### 3. **Slider Alignment**
- Slider ticks MUST align **exactly** with the center of input boxes
- Use a flex layout with `justify-between` to distribute ticks
- Input boxes and ticks share the same parent width

#### 4. **Slider Implementation**
- Use native `<input type="range">` with custom styling
- **NO tick marks** - only the thumb (circle) is visible
- Min: `0`, Max: `ticks.length - 1`, Step: `1`
- Styling via `dangerouslySetInnerHTML` for WebKit and Mozilla thumbs
- Thumb: 20px diameter, blue gradient, white border, glowing shadow
- Track: gradient background (purple-blue) positioned absolutely
- **Thumb alignment:** Must center exactly on corresponding input box pair
  - Input boxes use `flex justify-between`
  - Slider must match this spacing for perfect alignment

#### 5. **Compact Dimensions**
- All 10 stats MUST be visible simultaneously without scrolling
- Inputs are compact (14px width)
- Minimal padding and gaps
- Collapsed cards show only header

#### 6. **Add/Remove Buttons**
- **Add buttons**: appear on hover, positioned between/after inputs
- **Remove buttons**: appear on hover below weight inputs
- Minimum 3 ticks required (hide remove if `ticks.length <= 3`)
- Small size: `w-4 h-4` or `text-[10px]`

#### 7. **Visual Feedback**
- Selected tick: blue glow on value input, purple glow on weight input
- Selected tick on slider: larger blue dot with shadow
- Hover states: subtle border color changes

---

## 📝 SpellCreation Component Specifications

### State Management
- Use `useDefaultStorage` hook for:
  - `spell`, `setSpell`
  - `statOrder`, `setStatOrder`
  - `collapsedStats`, `setCollapsedStats`
  - `statSteps`, `setStatSteps`
  - `selectedTicks`, `setSelectedTicks`
- Local state for `targetBudget` (number, default 0)

### Balance Calculation
**CRITICAL:** Balance is calculated INLINE, NOT via hook:
```typescript
const calculateBalance = (): number => {
  const allStats = [...coreStats, ...advancedStats, ...optionalStats];
  const totalWeightCost = allStats.reduce((sum, field) => {
    const steps = statSteps[field];
    if (steps && steps.length > 0) {
      const selectedIdx = selectedTicks[field] || 0;
      const selectedStep = steps[selectedIdx];
      return sum + (selectedStep?.weight || 0);
    }
    return sum;
  }, 0);
  
  return totalWeightCost - targetBudget;
};

const balance = calculateBalance();
```

**FORMULA:** Balance = Σ(selected weights) - targetBudget
- Use `ALL_SPELL_STATS` from `spellStatDefinitions.ts` for iteration
- Cost calculation (for spell level) uses `calculateSpellBudget()`

### SpellIdentityCard Specifications
**CRITICAL:** SpellIdentityCard has 3 fields in a custom layout:

```tsx
<div className="grid grid-cols-2 gap-4">
  {/* Name - left column */}
  <div className="flex flex-col gap-1">
    <label className="text-xs uppercase tracking-wider text-cyan-300/70 font-semibold">Name</label>
    <input ... />
  </div>
  
  {/* Type - right column */}
  <div className="flex flex-col gap-1">
    <label className="text-xs uppercase tracking-wider text-cyan-300/70 font-semibold">Type</label>
    <select ... />
  </div>
  
  {/* Target Cost - single row below, NOT in GlassInput */}
  <div className="flex flex-col gap-1">
    <label className="text-xs uppercase tracking-wider text-cyan-300/70 font-semibold">Target Cost</label>
    <input type="number" className="... font-mono text-right" />
  </div>
</div>
```

**Styling:** Custom cyan theme, NO atomic components (GlassInput/GlassSelect)
- Background: `bg-cyan-900/20`
- Border: `border-cyan-500/30`
- Inputs: `bg-black/20 text-cyan-50 border-cyan-500/20`
- Focus: `border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]`

### Layout Configuration
```tsx
// Top Section (Identity + Preview)
- Identity Card: 5/12 width
- Preview Card: 7/12 width
- Height: compact, auto-fit content

// Stats Grid
- All stats in flex-wrap layout
- Each stat card: flexible width, minimum to fit content
```

### localStorage Keys
- `userDefaultSpell`: Full configuration (spell, statOrder, collapsedStats, statSteps, selectedTicks)
- `userSpellBaseline`: Spell object used as baseline for budget calculation

---

## 🔧 StatsGrid Component Specifications

### Props Interface
```typescript
{
  statOrder: string[];                    // Order of stats
  get StatDescription: (field: string) => string;
  isMalus: (field: string) => boolean;
  collapsedStats: Set<string>;
  toggleCollapse: (field: string) => void;
  getStatSteps: (field: string) => Array<{value: number; weight: number}>;
  updateStatStep: (field: string, idx: number, step: {value: number; weight: number}) => void;
  addStatStep: (field: string, idx: number) => void;
  removeStatStep: (field: string, idx: number) => void;
  selectedTicks: Record<string, number>;
  onSelectTick: (field: string, idx: number) => void;
  onDragStart: (e: React.DragEvent, field: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, field: string) => void;
}
```

### Atomic Component Mapping
When using atomic components, they MUST maintain:
- Exact same visual appearance
- Same compact dimensions (14px inputs)
- Same behavior (drag only on header)
- Same alignment (slider ticks to input centers)

---

## ✅ Verification Checklist

Before any modification to Spell Creation:
- [ ] All 10 stats are present (no more, no less)
- [ ] Stat order matches default or saved configuration
- [ ] Drag and drop works ONLY on stat headers
- [ ] Slider ticks align perfectly with input box centers
- [ ] All stats visible simultaneously (no scrolling needed)
- [ ] Input widths are 14px (w-14)
- [ ] Slider thumb is 20px with blue gradient
- [ ] Add/remove buttons appear on hover
- [ ] Minimum 3 ticks enforced
- [ ] Visual feedback matches specification
- [ ] localStorage saves correctly
- [ ] Balance calculation uses `useWeightedBalance`

---

## 🚫 Common Regression Patterns to Avoid

1. **Adding extra stats** - Only 10 stats allowed
2. **Making entire card draggable** - Breaks slider interaction
3. **Misaligned slider** - Ticks must align with input centers
4. **Too large inputs** - Must be compact (14px)
5. **Wrong slider implementation** - Must use native range input with custom styling
6. **Missing compact layout** - All stats must fit on screen
7. **Changing stat order** - Must respect saved configuration
8. **Breaking localStorage** - Keys and structure must match

---

## 🔄 Atomic Design Migration Rules

When migrating to atomic components:
1. **Preserve dimensions** - Atomic components must accept custom width/size props
2. **Preserve behavior** - Props must map 1:1 to original functionality  
3. **Preserve alignment** - CSS Modules must maintain exact positioning
4. **Test against checklist** - Run full verification before committing
5. **No feature changes** - Atomic refactoring is ONLY about code organization

---

**Reference Commit:** ba86a1f  
**Working Version File:** `git show ba86a1f:src/ui/spell/components/EnhancedStatSlider.tsx`
