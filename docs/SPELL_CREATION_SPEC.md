# Spell Creation UI - Feature Specification

**Component:** `FantasySpellCreation.tsx`  
**Based On:** Original `SpellCreation.tsx` (fully functional version)  
**Status:** ✅ Restored

---

## 🎯 Required Features

### 1. Spell Identity Card
- Name input
- Type selection (damage/heal/buff/debuff/cc/shield)
- Target budget slider (0-100)
- Target stat selector (for buffs/debuffs)

### 2. Combat Preview Card
- **Damage calculation:** `effect% × baseDamage × eco`
- **Buff/Debuff:** Show modification %, duration (turns), target stat
- **Dynamic stat display:** Only non-default values from spell object
- **Real-time updates:** As sliders change

### 3. Stats Grid (Core Feature)
- **Drag & Drop Reordering:** Cards can be rearranged
- **Collapsible Cards:** Click to expand/collapse each stat
- **Multi-Step Ticks:** Each stat has 3+ customizable ticks
  - Add/remove tick buttons (`+` / `-`)
  - Each tick has:
    - **Value** (stat value at that point)
    - **Weight** (cost multiplier)
- **Selected Tick Indicator:** Shows current active tick
- **Stat Descriptions:** Malus warnings (red) for negative stats

### 4. Advanced Configuration
- **Save Default Config:** Stores:
  - Current spell state
  - Card order (drag/drop positions)
  - Collapsed states
  - Stat steps (all ticks + weights)
  - Selected tick indices
- **Reset to Defaults:** Restores from localStorage

### 5. Actions Bar
- **Reset Button:** Clear all to empty spell
- **Save Button:** Persist spell to library
- **Save Default Button:** Save current config as baseline
- **Balance Display:** `totalWeight - targetBudget` (±0.00)

### 6. Persistence
- **Custom Baseline:** User can set own spell as baseline (via localStorage `userSpellBaseline`)
- **Custom Weights:** Each stat can have custom weight curve
- **Minimal Save:** Only save fields that differ from default spell

---

## 🔧 Implementation Details

### Key Functions
```typescript
- handleDragStart(e, field): Initialize drag
- handleDragOver(e): Allow drop
- handleDrop(e, targetField): Reorder stat cards
- getStatSteps(field): Get tick array for stat
- updateStatStep(field, idx, step): Modify tick value/weight
- handleSelectTick(field, idx): Switch active tick
- addStatStep(field, idx): Insert new tick
- removeStatStep(field, idx): Delete tick (min 3)
- toggleCollapse(field): Expand/collapse card
- calculateBalance(): Sum(weights) - target
- getUserBaseline(): Load custom baseline
- getCustomWeights(): Extract weight per stat from ticks
- handleSave(): Save minimal spell to library
- handleSaveDefault(): Persist full config to localStorage
```

### React Hooks Used
- `useDefaultStorage()`: Centralized state for spell, order, steps, ticks
- `useState`: Local component state (targetBudget)

---

## ⚠️ Non-Negotiable Requirements

1. **All stat configuration MUST be via StatsGrid** (no placeholder "coming soon")
2. **Drag & Drop MUST work** for card reordering
3. **Multi-step ticks MUST be editable** (add/remove/modify)
4. **Save Default MUST persist** all configuration
5. **Balance calculation MUST use custom weights** from ticks

---

## 🧪 Testing Checklist

- [ ] Create spell → Modify stats → Save → Reload → Stats persist
- [ ] Drag stat card → Order changes and persists
- [ ] Add tick → New tick appears → Save Default → Reload → New tick still there
- [ ] Collapse card → Space reclaimed → Reload → Collapsed state persists
- [ ] Change target budget → Balance updates in real-time
- [ ] Save Default → Reset → Spell reverts to saved default (not empty)
- [ ] Combat preview shows correct damage (effect × baseDamage × eco)

---

## 📄 Related Files

- `src/ui/spell/SpellCreation.tsx` - Original fully-functional implementation
- `src/ui/fantasy/FantasySpellCreation.tsx` - Fantasy UI wrapper (MUST maintain all features)
- `src/ui/spell/components/StatsGrid.tsx` - Core stats configuration component
- `src/ui/spell/components/SpellIdentityCard.tsx` - Identity + target budget
- `src/ui/spell/components/ActionsBar.tsx` - Save/Reset/SaveDefault buttons
- `src/shared/hooks/useDefaultStorage.ts` - State management hook

---

**Last Verified:** 2025-12-01  
**Restoration Method:** Direct copy from `SpellCreation.tsx` + `FantasyLayout` wrapper
