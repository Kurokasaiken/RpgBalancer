# Spell Type Extension Guidelines

**⚠️ IMPORTANT: When adding new spell types, ALL of the following must be updated!**

When you add a new spell type (e.g., `'buff'`, `'debuff'`, `'summon'`, etc.) to the `SpellType` union in `spellTypes.ts`, you MUST update these files to maintain consistency:

## 📋 Required Updates Checklist

### 1. **Type Definitions** (`src/balancing/spellTypes.ts`)
- [ ] Add type to `SpellType` union
- [ ] Add type-specific fields to `Spell` interface if needed
- [ ] Update `createEmptySpell()` factory with defaults

### 2. **UI - Spell Creation** (`src/ui/spell/`)
- [ ] **SpellCreation.tsx**: Add type option to spell type selector
- [ ] **SpellIdentityCard.tsx**: Add visual distinction/icon for new type
- [ ] **SpellMetadataCard.tsx**: Add conditional fields for type-specific config
- [ ] **SpellInfoForm.tsx**: Add any additional input fields

### 3. **UI - Spell Editor** (`src/ui/spell/SpellEditor.tsx`)
- [ ] Add type option to selector
- [ ] Add conditional rendering for type-specific fields
- [ ] Update validation logic if needed

### 4. **Combat Engine** (`src/engine/`)
- [ ] **combat/logic.ts**: Add spell type handling in combat resolution
- [ ] **idle/ai.ts**: Update AI spell selection logic
- [ ] **core/spell.ts**: Add casting logic if needed

### 5. **Balancing** (`src/balancing/`)
- [ ] **spellCost.ts**: Add cost calculation for new type
- [ ] **spellBalancingConfig.ts**: Add balance parameters
- [ ] **spell/SpellBuilder.ts**: Add builder support

### 6. **Preview/Simulation** (`src/ui/balancing/`)
- [ ] **SpellBalancingLab.tsx**: Add preview rendering
- [ ] **SimulationDashboard.tsx**: Add metrics tracking

### 7. **Testing**
- [ ] Add unit tests for new spell type behavior
- [ ] Add integration tests with combat simulator
- [ ] Test UI creation/editing flow

---

## 📝 Example: Adding a "Heal" Spell Type

```typescript
// 1. spellTypes.ts
export type SpellType = 'damage' | 'heal' | 'buff' | ...;

export interface Spell {
  // ...
  healingModifier?: number; // For type === 'heal'
}

// 2. SpellCreation.tsx
<option value="heal">Heal</option>

// 3. SpellMetadataCard.tsx
{spell.type === 'heal' && (
  <input 
    label="Healing Modifier" 
    value={spell.healingModifier}
    onChange={...}
  />
)}

// 4. combat/logic.ts
if (spell.type === 'heal') {
  targetEntity.currentHp += calculateHealing(spell);
}

// 5. spellCost.ts
if (spell.type === 'heal') {
  cost += spell.healingModifier * HEAL_COST_MULTIPLIER;
}
```

---

## 🔄 Current Spell Types Status

| Type | UI Creation | UI Editor | Combat Engine | AI Logic | Cost Calc | Preview |
|------|-------------|-----------|---------------|----------|-----------|---------|
| `damage` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `heal` | ✅ | ✅ | ⚠️ Partial | ⚠️ Partial | ✅ | ⚠️ Partial |
| `shield` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| `buff` | ✅ | ✅ | ❌ **NEEDS IMPL** | ❌ | ✅ | ❌ |
| `debuff` | ✅ | ✅ | ❌ **NEEDS IMPL** | ❌ | ✅ | ❌ |
| `cc` | ✅ | ✅ | ⚠️ Partial (Stun only) | ⚠️ Partial | ✅ | ⚠️ Partial |

**Legend:**
- ✅ Fully implemented
- ⚠️ Partially implemented
- ❌ Not implemented

---

## 🚨 Common Pitfalls

1. **Forgetting UI update**: Adding backend logic but no way to configure in UI → users can't create the spell
2. **Missing cost calculation**: New spell type not priced → balance broken
3. **No combat integration**: Spell can be created but does nothing in combat
4. **Inconsistent preview**: Spell works in combat but preview shows wrong info
5. **AI doesn't use it**: AI ignores new spell type → never gets tested

---

## 📚 Related Documents

- [DEVELOPMENT_GUIDELINES.md](../DEVELOPMENT_GUIDELINES.md) - General code guidelines
- [BALANCING_SYSTEM.md](BALANCING_SYSTEM.md) - Balance philosophy
- [docs/plans/combat_expansion_plan.md](plans/combat_expansion_plan.md) - Combat system roadmap
