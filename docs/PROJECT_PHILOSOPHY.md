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

### Gilded Observatory Aesthetic (Current Canon)
```css
/* High-level visual intent, actual tokens live in the CSS/theme system */
background: radial-gradient(circle at top, #1f2933 0%, #020617 55%, #000000 100%);
border-color: rgba(245, 245, 244, 0.06);
color: #f5f5f4; /* Ivory text */
box-shadow: 0 18px 45px rgba(0, 0, 0, 0.75);
```

This project now treats the **Gilded Observatory** theme as the reference UI canon. All new UI work MUST:

- **Inherit from theme tokens** (Tailwind config, `fantasy-theme.css`, `color-palette.css`) instead of hardcoded hex values.
- Use **compact, information-dense layouts** by default, but remain touch-friendly on mobile.
- Keep visual hierarchy clear: cards, headers, and primary actions should stand out even in dense screens.

### Color System (Conceptual Roles)
- **Obsidian / Deep Space**: Backgrounds, large surfaces, modal backdrops.
- **Ivory / Warm Light**: Primary text, key labels, headings.
- **Teal / Arcane Accents**: Sliders, interactive controls, hover/active states.
- **Gold / Gilded Lines**: Section dividers, highlights, "premium" actions.
- **Error / Success / Warning**: Still exist, but must be routed through the centralized color palette.

> Implementation detail: the **authoritative mapping** between these roles and actual CSS tokens is maintained in the theme files and Tailwind config, not in components.

### Cinematic Key-Art Direction
To anchor future hero panels, splash art, and cinematic overlays in a consistent visual language, we adopt the following north-star brief:

> A majestic ancient dragon perched on an overgrown marble ruin in a lush tropical jungle. The dragon has iridescent emerald and gold scales, inspired by the realism of Jeff Easley (AD&D). The lighting is bright tropical sunlight with deep, rich shadows. Style: Hand-painted digital art, oil painting brushstrokes, heroic realism. Color palette: Vivid turquoise, lime green, bright orange flowers, and polished bronze. High detail, epic scale, serious adventurous tone.

This description should inform palette accents, lighting ratios, and compositional beats whenever we produce new illustrative assets or themed UI flourishes.

### Interaction Patterns
- **Horizontal Sliders:** Primary selection mechanism for weighted stats.
- **Tooltip-First Formulas:** Formulas live in docs and tooltips; UI shows human labels and results, not raw math in the main layout.
- **Drag Handle in Header:** Reordering and layout manipulation is initiated from card headers or dedicated handles, not from random surfaces.
- **Toast Notifications:** Success and error feedback use a unified toast system (no `alert()`), consistent with MASTER_PLAN guidelines.

For how this UI/UX direction links to the rest of the roadmap:
- See `docs/MASTER_PLAN.md` → **Future Direction**.
- See `docs/IMPLEMENTED_PLAN.md` for what is already in production vs. mock.

## Config-Driven Architecture (Phase 10+)

### Principio Fondamentale
**Niente hardcoded per layout, card, stat, formule.** Tutto è definito in JSON/config e modificabile da UI.

### Schema-First Development
1. **Schema JSON** definisce struttura (stat, card, formule)
2. **Zod** valida lo schema a runtime
3. **UI** legge lo schema e genera componenti dinamicamente
4. **Persistence** salva/carica lo schema + valori in localStorage

### Balancer Config-Driven
```typescript
// Esempio: stat definita in config, non hardcoded
const statDefinition: StatDefinition = {
  id: 'critChance',
  label: 'Critical Chance',
  type: 'percentage',
  min: 0, max: 100, step: 1,
  defaultValue: 5,
  weight: 4.0,
  isCore: false,
  isDerived: false,
};
```

### Formula Engine
Le formule derivate (es. `htk = hp / damage`) sono:
- **Editabili da UI** con validazione real-time
- **Validate** contro stat esistenti (no variabili sconosciute)
- **Estensibili** per aggiungere funzioni in futuro

### Core vs Custom
- **Core** (hp, damage, htk): sempre presenti, non eliminabili, ma pesi/range editabili
- **Custom**: tutto il resto è creabile/eliminabile da UI

Per dettagli implementativi:
- See `docs/plans/config_driven_balancer_plan.md`
- See `docs/plans/config_driven_balancer_tasks.md`

---

## Technology Stack

### Current
- **React 18+** with Hooks
- **TypeScript** for type safety
- **Tailwind CSS** for utilities
- **localStorage** for persistence
- **Zod** for schema validation

### Planned
- **@dnd-kit** for drag & drop
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
