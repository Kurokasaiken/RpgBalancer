# RPG Balancer Components Gallery

This document provides a comprehensive overview of all React components in the RPG Balancer application, detailing their props, usage, and responsibilities.

## Balancing Components

### Archetype Components

#### ArchetypeBalanceCard

Displays combat metrics and balance analysis for an archetype in a 1v1 scenario.

**Props:**
- `archetype` (ArchetypeTemplate): The archetype template to analyze
- `budget` (number, optional, default: 50): The stat budget to use for calculations

**Usage:**
```tsx
<ArchetypeBalanceCard archetype={myArchetype} budget={60} />
```

**Features:**
- Calculates EDPT (Effective Damage Per Turn)
- Shows TTK (Time To Kill) for offense and defense
- Displays Early Impact metric
- Shows Stat Weight Impact (SWI) analysis with top 5 stats

---

#### ArchetypeBuilder

Interactive UI for creating custom archetypes with category selection, budget slider, and stat allocation controls.

**Props:**
- No props (stateless component)

**Usage:**
```tsx
<ArchetypeBuilder />
```

**Features:**
- Category selection (Tank, DPS, Assassin, Bruiser, Support, Hybrid)
- Budget slider with real-time stat calculation
- Stat allocation sliders with pie chart visualization
- Real-time stat preview

---

#### ArchetypeDetail

Detailed view of a single archetype with full stat breakdown, matchup predictions, and action buttons.

**Props:**
- `archetype` (ArchetypeTemplate): The archetype to display
- `onEdit` (() => void): Callback when edit button is clicked
- `onClone` (() => void): Callback when clone button is clicked
- `onDelete` (() => void): Callback when delete button is clicked
- `onClose` (() => void): Callback when close button is clicked

**Usage:**
```tsx
<ArchetypeDetail
  archetype={myArchetype}
  onEdit={() => console.log('Edit')}
  onClone={() => console.log('Clone')}
  onDelete={() => console.log('Delete')}
  onClose={() => console.log('Close')}
/>
```

**Features:**
- Displays archetype name and category
- Shows stat allocation at different budget levels (20, 50, 75, 100)
- Includes stat allocation pie chart
- Shows combat balance metrics via ArchetypeBalanceCard
- Action buttons for edit, clone, delete, and close

---

#### ArchetypeList

Grid/list view of saved archetypes with filtering and search capabilities.

**Props:**
- No props (stateless component)

**Usage:**
```tsx
<ArchetypeList />
```

**Features:**
- Toggle between grid and list view modes
- Search archetypes by name or description
- Filter by category (Tank, DPS, Assassin, etc.)
- Shows archetype count
- Displays archetype cards with key stats

---

#### ArchetypeManager

Main entry point for archetype management with navigation between list, detail, and builder views.

**Props:**
- No props (stateless component)

**Usage:**
```tsx
<ArchetypeManager />
```

**Features:**
- Navigation between list, detail, and builder views
- Archetype registry management
- Handlers for view, edit, clone, delete, and create operations
- Integration with ArchetypeBuilder and ArchetypeDetail components

---

#### ArchetypePreview

Shows final StatBlock values with warnings for imbalanced allocations and power level calculation.

**Props:**
- `statBlock` (StatBlock | null): The calculated stat block to display
- `budget` (number): The stat budget used for calculation
- `isValid` (boolean): Whether the stat allocation is valid (sums to 100%)

**Usage:**
```tsx
<ArchetypePreview
  statBlock={calculatedStats}
  budget={50}
  isValid={allocationValid}
/>
```

**Features:**
- Displays warning for invalid allocation (doesn't sum to 100%)
- Shows "Calculating..." state while processing
- Lists all final stat values
- Calculates and displays total power level
- Color-coded stat display with positive/negative indicators

---

#### StatAllocationPie

Interactive pie chart showing stat allocation percentages using Recharts.

**Props:**
- `allocation` (StatAllocation): The stat allocation object with percentage values

**Usage:**
```tsx
<StatAllocationPie allocation={statAllocation} />
```

**Features:**
- Filters out stats with 0% allocation
- Color-coded segments (offensive=red, defensive=blue/green, sustain=teal)
- Custom tooltip showing stat name and percentage
- Responsive container that adapts to parent size
- Legend showing all allocated stats

---

### MitigationCard

Manages defense parameters with armor and resistance controls.

**Props:**
- `stats` (StatBlock): The stat block containing mitigation parameters
- `lockedParam` (LockedParameter): Currently locked parameter for solver
- `onParamChange` ((param: keyof StatBlock, value: number) => void): Callback for parameter changes
- `onLockToggle` ((param: LockedParameter) => void): Callback for lock toggle
- `onResetParam` ((paramId: string) => void): Callback for individual parameter reset
- `onResetCard` (() => void): Callback for resetting all card parameters

**Usage:**
```tsx
<MitigationCard
  stats={currentStats}
  lockedParam="none"
  onParamChange={handleParamChange}
  onLockToggle={handleLockToggle}
  onResetParam={handleResetParam}
  onResetCard={handleResetCard}
/>
```

**Features:**
- Dual-column layout for Armor and Resistance parameters
- Configuration toggles for mitigation order (Flat→% vs %→Flat)
- Configuration toggle for damage order (Mitigation→Crit vs Crit→Mitigation)
- SmartInput components for ward, armor, resistance, armorPen, penPercent
- Parameter locking and reset functionality
- Card-level reset option

---

## Shared Components

### GenericParamCard

Configurable parameter card with sections and SmartInput components.

**Props:**
- `config` (ParamCardConfig): Card configuration with title, color, sections, and optional preview
- `stats` (StatBlock): Current stat block values
- `lockedParam` (LockedParameter): Currently locked parameter
- `onParamChange` ((param: keyof StatBlock, value: number) => void): Callback for parameter changes
- `onLockToggle` ((param: LockedParameter) => void): Callback for lock toggle
- `onResetParam` ((paramId: string) => void): Callback for parameter reset
- `onResetCard` (() => void): Callback for card reset

**Usage:**
```tsx
<GenericParamCard
  config={cardConfig}
  stats={currentStats}
  lockedParam="none"
  onParamChange={handleParamChange}
  onLockToggle={handleLockToggle}
  onResetParam={handleResetParam}
  onResetCard={handleResetCard}
/>
```

**Features:**
- Configurable sections with parameter groups
- SmartInput components for each parameter
- Single or multi-section layouts
- Preview component support
- Parameter locking and reset functionality
- Card-level reset option

---

## Notes

- All components follow the Gilded Observatory theme
- Props are validated using TypeScript interfaces
- Components are designed to be reusable across different contexts
- Config-first architecture ensures components read from centralized configs
