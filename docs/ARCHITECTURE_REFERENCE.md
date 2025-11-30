# Single Source of Truth - Architecture Reference

**Version:** 1.0  
**Date:** 2025-11-30  
**Status:** 🚨 **MANDATORY** - All new code MUST follow these principles

---

## Core Principle

> **"Inherit, Never Redefine"**

All stats, formulas, and calculations must originate from the Balancing System. No duplication, no hardcoding.

---

## Architecture Hierarchy

```
┌─────────────────────────────────────────────────┐
│         BALANCING SYSTEM (MASTER)               │
│  • StatBlock definitions                        │
│  • BASELINE_STATS                               │
│  • All balancing formulas                       │
└─────────────────────────────────────────────────┘
                    ↓ INHERITS
┌─────────────────────────────────────────────────┐
│         ARCHETYPE SYSTEM                         │
│  • ArchetypeRegistry (loads from files)         │
│  • ArchetypeBuilder (creates from templates)    │
│  • Pure archetypes + variants                   │
└─────────────────────────────────────────────────┘
                    ↓ USES
┌─────────────────────────────────────────────────┐
│         UI MODULES                               │
│  • Character Creator → uses ArchetypeRegistry   │
│  • Spell Creator → uses Spell balancing         │
│  • Balancer UI → displays StatBlock            │
└─────────────────────────────────────────────────┘
```

---

## Single Source of Truth Definitions

### 1. Character Stats
**MASTER:** `src/balancing/types.ts` → `StatBlock`

```typescript
// ✅ CORRECT - Inherit from balancing
import type { StatBlock } from '../../balancing/types';
import { BASELINE_STATS } from '../../balancing/baseline';

const characterStats: StatBlock = {
    ...BASELINE_STATS,
    hp: 120,
    damage: 25
};

// ❌ WRONG - Custom stat definition
interface CharacterStats {
    health: number;  // NO! Use StatBlock.hp
    attack: number;  // NO! Use StatBlock.damage
}
```

**Rule:** Character Creator MUST use `StatBlock` from balancing, NOT custom interfaces.

---

### 2. Archetypes

**MASTER:**
- **Registry:** `src/balancing/archetype/ArchetypeRegistry.ts`
- **Storage:** `src/balancing/archetype/archetypes.json`
- **Builder:** `src/balancing/archetype/ArchetypeBuilder.ts`

```typescript
// ✅ CORRECT - Load from registry
import { ArchetypeRegistry } from '../../balancing/archetype/ArchetypeRegistry';

const tank = ArchetypeRegistry.getArchetype('Tank');

// ❌ WRONG - Hardcoded archetypes
const testArchetypes = [
    { id: 'Tank', stats: { hp: 150, damage: 15 } } // NO!
];
```

**Rules:**
1. **Pure Archetypes:** Defined in `archetypes.json`, loaded via `ArchetypeRegistry`
2. **Variants:** Generated dynamically via `ArchetypeBuilder`
3. **Test Data:** Use `ArchetypeRegistry` with test fixtures, NOT hardcoded arrays
4. **NO hardcoding** in `testArchetypes.ts` - use registry!

---

### 3. Spell Stats

**MASTER:** `src/balancing/spell/` (Spell balancing module)

```typescript
// ✅ CORRECT - Inherit from spell balancing
import { SpellCostModule } from '../../balancing/spell/SpellCostModule';

const spellCost = SpellCostModule.calculateSpellCost(spellStats);

// ❌ WRONG - Custom spell cost calculation
const customCost = damage * 2 + duration * 3; // NO!
```

**Rule:** Spell Creator MUST use SpellCostModule formulas, NOT custom calculations.

---

### 4. Combat Formulas

**MASTER:** `src/balancing/modules/`

| Formula | Module | Usage |
|---------|--------|-------|
| Damage | `MitigationModule` | Use `calculateEffectiveDamage()` |
| Hit Chance | `HitChanceModule` | Use `calculateHitChance()` |
| Critical | `CriticalModule` | Use `calculateCriticalDamage()` |
| Sustain | `SustainModule` | Use `calculateRegenHeal()` |

```typescript
// ✅ CORRECT
import { MitigationModule } from '../../balancing/modules/mitigation';

const finalDamage = MitigationModule.calculateEffectiveDamage(
    rawDamage, armor, resistance, armorPen, penPercent, configFlatFirst
);

// ❌ WRONG - Custom damage formula
const customDamage = rawDamage - (armor * 0.5); // NO!
```

**Rule:** NEVER reimplement formulas. Import and use existing modules.

---

## File Organization Rules

### Balancing Layer (MASTER)
```
src/balancing/
├── types.ts                 # StatBlock definition (MASTER)
├── baseline.ts              # BASELINE_STATS (MASTER)
├── modules/                 # All formulas (MASTER)
├── archetype/
│   ├── ArchetypeRegistry.ts # Load from files (REQUIRED)
│   ├── ArchetypeBuilder.ts  # Generate variants (REQUIRED)
│   └── archetypes.json      # Pure archetype definitions
└── spell/                   # Spell balancing (MASTER)
```

### UI Layer (CONSUMER)
```
src/ui/
├── character/
│   └── CharacterCreator.tsx # MUST use ArchetypeRegistry
├── spell/
│   └── SpellCreator.tsx     # MUST use SpellCostModule
└── balancing/
    └── Balancer.tsx         # Display StatBlock
```

---

## Violation Examples & Fixes

### ❌ VIOLATION 1: Hardcoded Archetypes
```typescript
// src/balancing/1v1/testArchetypes.ts (CURRENT - WRONG)
export const TEST_ARCHETYPES: Archetype[] = [
    { id: 'Tank', stats: { hp: 160, damage: 22 } },
    // ... hardcoded list
];
```

**✅ FIX:**
```typescript
// Use ArchetypeRegistry instead
import { ArchetypeRegistry } from '../archetype/ArchetypeRegistry';

export async function getTestArchetypes(): Promise<Archetype[]> {
    return ArchetypeRegistry.loadArchetypes([
        'Tank', 'DPS', 'Assassin', 'Bruiser', 'Evasive', 'Sustain'
    ]);
}
```

---

### ❌ VIOLATION 2: Custom Character Stats
```typescript
// src/ui/character/CharacterCreator.tsx (HYPOTHETICAL - WRONG)
interface CharacterData {
    name: string;
    health: number;
    attack: number;
}
```

**✅ FIX:**
```typescript
import type { StatBlock } from '../../balancing/types';

interface CharacterData {
    name: string;
    stats: StatBlock; // Use StatBlock from balancing
}
```

---

### ❌ VIOLATION 3: Duplicate Formula
```typescript
// UI component (WRONG)
const effectiveDamage = baseDamage - (targetArmor * 0.6);
```

**✅ FIX:**
```typescript
import { MitigationModule } from '../../balancing/modules/mitigation';

const effectiveDamage = MitigationModule.calculateEffectiveDamage(
    baseDamage, targetArmor, targetResistance, armorPen, penPercent, configFlatFirst
);
```

---

## Enforcement Checklist

Before committing code, verify:

- [ ] All character stats use `StatBlock` from `src/balancing/types.ts`
- [ ] All archetypes loaded via `ArchetypeRegistry`, NOT hardcoded
- [ ] All formulas use modules from `src/balancing/modules/`, NOT reimplemented
- [ ] Character Creator uses `ArchetypeRegistry` / `ArchetypeBuilder`
- [ ] Spell Creator uses `SpellCostModule`
- [ ] No duplicate stat definitions
- [ ] No custom calculation formulas

---

## Migration Path

1. **Audit existing code** - Find violations
2. **Create ArchetypeRegistry fixtures** - Replace hardcoded arrays
3. **Unify Character Creator** - Use StatBlock, remove custom stats
4. **Remove formula duplicates** - Import from modules
5. **Update tests** - Use fixtures instead of hardcoded data
6. **Document dependencies** - Update README with architecture

---

## Enforcement

**This is a MANDATORY architecture.** Code reviews will REJECT:
- Hardcoded archetypes
- Custom stat interfaces
- Reimplemented formulas
- Stat definitions outside `src/balancing/`

**Approved exceptions:** NONE. Use the proper modules.
