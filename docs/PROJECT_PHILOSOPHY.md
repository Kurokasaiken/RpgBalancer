# RPG Balancer - Project Philosophy & Design System

## Core Philosophy: Weight-Based Creator Pattern

### The Foundational Concept

The **Spell Creator** is not just a feature—it's the **architectural template** for ALL entity creation in this project. Every creator (spells, items, characters, races, abilities) follows the same fundamental pattern.

## The Weight-Based System

### Formula
```
Balance = Σ(selected_weights) - Target_Cost
```

### How It Works

1. **Configurable Ticks**
   - Each stat has multiple "ticks" (configuration points)
   - Each tick = `{value, weight}` pair
   - Example: Effect stat might have ticks:
     - Tick 0: `{value: 50, weight: -2}`  (weak, reduces cost)
     - Tick 1: `{value: 100, weight: 0}`  (baseline)
     - Tick 2: `{value: 150, weight: 3}`  (powerful, increases cost)

2. **Slider Selection**
   - User positions slider on desired tick
   - Selected tick's **value** → applied to entity
   - Selected tick's **weight** → contributes to balance

3. **Balance Calculation**
   - Sum ALL selected weights across ALL stats
   - Subtract target cost
   - Result = 0 → perfectly balanced
   - Result > 0 → over-budget
   - Result < 0 → under-budget

4. **User-Defined Baseline**
   - "Save Default" captures current configuration
   - Becomes the reference for future creations
   - Enables iterative game balancing

### Example Flow

**Creating a Fireball Spell:**
```
Stats Configuration:
- Effect: Slider on tick 2 (value=150, weight=3)
- Eco: Slider on tick 1 (value=1, weight=0)
- Dangerous: Slider on tick 3 (value=120, weight=2)
- AOE: Slider on tick 2 (value=3, weight=1.5)

Balance = 3 + 0 + 2 + 1.5 - Target(0) = 6.5

User adjusts until Balance ≈ 0, then saves.
```

## Design Principles

### 1. Modularity & Reusability
- Each stat card is independent
- Drag-and-drop reordering
- Collapsible for focus
- **Same component pattern** for all entity types

### 2. Visual Hierarchy
- **Glassmorphic Design** throughout
- Cyan/Blue theme for "Identity" (definition)
- Purple theme for "Stats" (configuration)
- Clear visual separation of concerns

### 3. Progressive Disclosure
- Top section: Core identity (Name, Type, Target Cost)
- Middle section: Stat configuration (where the magic happens)
- Bottom section: Actions (Save, Reset, Save Default)

### 4. Immediate Feedback
- **Real-time recalculation** on any change
- Balance indicator always visible
- Preview updates automatically
- Visual highlighting of active selections

## Extending the Pattern

### Creating a New Entity Type (e.g., Items)

1. **Define Item Stats**
   ```typescript
   const itemStats = ['power', 'durability', 'rarity', 'weight'];
   ```

2. **Create Tick Configurations**
   ```typescript
   const defaultItemSteps = {
     power: [
       {value: 10, weight: -1},
       {value: 50, weight: 0},
       {value: 100, weight: 2}
     ],
     // ... other stats
   };
   ```

3. **Use WeightBasedCreator Component**
   ```tsx
   <WeightBasedCreator
     entityType="item"
     stats={itemStats}
     defaultSteps={defaultItemSteps}
     onSave={saveItem}
   />
   ```

4. **Done!** The entire UI, balance calculation, and persistence logic is handled.

## UI/UX Guidelines

### Glassmorphism Aesthetic
```css
backdrop-filter: blur(12px);
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.1);
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
```

### Color System
- **Cyan/Blue** (`#06b6d4`): Identity, Definition, Static Info
- **Purple** (`#a855f7`): Configuration, Dynamic, Interactive
- **Green** (`#34d399`): Success, Balanced
- **Red** (`#f87171`): Error, Unbalanced
- **Amber** (`#fbbf24`): Warning, Malus

### Interaction Patterns
- **Horizontal Sliders:** Primary selection mechanism
- **Eye Icon:** Collapse/expand (right-aligned)
- **Drag Handle:** Header area (cursor: move)
- **Toast Notifications:** Success feedback (no alerts!)

## Technology Stack

### Current
- **React 18+** with Hooks
- **TypeScript** for type safety
- **Tailwind CSS** for utilities
- **localStorage** for persistence

### Planned
- **CSS Modules** for complex component styles
- **Sonner** for toast notifications
- **Custom Hooks** for shared logic
- **Zustand/Context** for global state (if needed)

## File Organization

### Recommended Structure
```
src/
  features/
    spellCreation/      # Feature-specific
    itemCreation/       # ...
    characterCreation/  # ...
  shared/
    components/
      WeightBasedCreator/
      GlassCard/
      StatSlider/
    hooks/
      useWeightedBalance.ts
      useStatSteps.ts
    utils/
      balanceCalculations.ts
```

### Current (Needs Refactoring)
```
src/
  ui/
    spell/              # Mixed concerns
      SpellCreation.tsx # Too large (380+ lines)
      components/       # Some reusable, some not
```

## Key Decisions & Rationale

### Why Weight-Based?
- **Flexible:** Any value can have any cost
- **Designer-Friendly:** Non-programmers can balance
- **Iterative:** Test, adjust weights, repeat
- **Extensible:** Same pattern for all entities

### Why Horizontal Sliders?
- **Spatial Reasoning:** Position = value (intuitive)
- **Visual Feedback:** See all options at once
- **No Conflicts:** D&D restricted to header

### Why User-Defined Baselines?
- **Game is in Development:** Balance changes frequently
- **Designer Control:** YOU define "normal"
- **Evolution:** Baseline grows with game design

### Why No Global State Manager (Yet)?
- **Simplicity:** localStorage sufficient for now
- **Performance:** No cross-component dependencies
- **Future-Proof:** Easy to add Zustand later if needed

## Common Pitfalls to Avoid

1. **❌ Hardcoding Values**
   - Don't: `const damage = effect * 1.5`
   - Do: Use configurable formulas with weights

2. **❌ Mixing Concerns**
   - Don't: Put balance logic in UI components
   - Do: Extract to custom hooks

3. **❌ Inline Styles Everywhere**
   - Don't: `<div style={{...complexStyles}}>`
   - Do: Use Tailwind utilities or CSS Modules

4. **❌ Alert() for Feedback**
   - Don't: `alert('Saved!')`
   - Do: `toast.success('Saved!')`

5. **❌ Prop Drilling**
   - Don't: Pass props through 5+ levels
   - Do: Use Context or custom hooks

## 🚨 CRITICAL: Single Source of Truth - ZERO Hardcoding

### The Inheritance Rule

**EVERY component, function, and module MUST inherit from existing sources:**

```typescript
// ✅ CORRECT: Import from single source
import { BASELINE_STATS } from './balancing/baseline';
import { DEFAULT_STATS } from './balancing/types';
import { getStatWeight } from './balancing/statWeights';
import { MitigationModule } from './balancing/modules/mitigation';

const entity = { ...BASELINE_STATS };
const weight = getStatWeight('damage');
const damage = MitigationModule.calculateEffectiveDamage(...);
```

```typescript
// ❌ WRONG: Hardcoded values
const entity = {
  hp: 100,          // VIOLAZIONE!
  attack: 20,       // VIOLAZIONE!
  defense: 10       // VIOLAZIONE!
};

const weight = 5.0; // VIOLAZIONE - use getStatWeight()!
```

### Why This is Non-Negotiable

1. **Maintainability:** Change formula once, updates everywhere
2. **Testing:** Simulations use same values as production
3. **Consistency:** No drift between modules
4. **Debugging:** Single point of failure, easy to fix
5. **Evolution:** Game balance can evolve without code changes

### Enforcement Checklist

Before committing code, verify:
- [ ] No hardcoded stat values (hp, damage, etc.)
- [ ] No hardcoded weights or ratios
- [ ] No duplicated formulas (use modules)
- [ ] All imports from `/balancing/*`
- [ ] TypeScript types match `StatBlock` interface

### Where to Import From

| Need | Import From | Example |
|------|-------------|---------|
| Balanced baseline | `baseline.ts` | `BASELINE_STATS` |
| Default UI values | `types.ts` | `DEFAULT_STATS` |
| Stat weights | `statWeights.ts` | `getStatWeight('damage')` |
| Damage calculations | `modules/mitigation.ts` | `MitigationModule.calculateEffectiveDamage()` |
| Hit chance | `modules/hitchance.ts` | `HitChanceModule.calculateHitChance()` |
| Critical hits | `modules/critical.ts` | `CriticalModule.calculateCriticalDamage()` |

---

### Short Term (Next 3 Months)
- Item Creator using weight-based pattern
- Character Creator using weight-based pattern
- Shared component library
- Modern toast notifications

### Medium Term (6 Months)
- Formula editor for damage calculations
- Visual formula builder
- Import/Export configurations
- Collaborative balancing tools

### Long Term (1 Year+)
- AI-assisted balancing suggestions
- Playtest data integration
- Version control for configurations
- Multi-game support

---

## For New Developers

### Getting Started
1. Read `ARCHITECTURE.md` for technical details
2. Study `SpellCreation.tsx` as the reference implementation
3. Review `implementation_plan.md` for refactoring roadmap
4. Follow the pattern when adding new features

### Key Takeaway
> "Everything is a weight-based creator. If it needs balance, it uses this pattern."

---

*Last Updated: 2024-11-27*  
*Version: 1.0*
