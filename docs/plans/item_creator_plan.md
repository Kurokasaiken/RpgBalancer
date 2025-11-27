# Item Creator Implementation Plan

## 🎯 Objective
Implement the `ItemCreator` using the `WeightBasedCreator` template. This will allow users to create weapons and armor using the same weight-based balancing logic as spells.

## 📊 Item Stat Definitions

We need to define the stats that make up an item. These stats must map to the game's balancing engine.

### Weapon Stats
| Stat | ID | Min | Max | Step | Default | Weight Impact |
|------|----|-----|-----|------|---------|---------------|
| **Damage** | `damage` | 1 | 100 | 1 | 10 | High (Positive) |
| **Speed** | `speed` | 0.5 | 2.0 | 0.1 | 1.0 | High (Positive) |
| **Range** | `range` | 1 | 10 | 1 | 1 | Medium (Positive) |
| **Crit Chance** | `critChance` | 0% | 50% | 1% | 5% | Medium (Positive) |
| **Durability** | `durability` | 10 | 1000 | 10 | 100 | Low (Positive) |
| **Weight** | `weight` | 0.1 | 50 | 0.1 | 5.0 | Low (Negative) |

### Armor Stats
| Stat | ID | Min | Max | Step | Default | Weight Impact |
|------|----|-----|-----|------|---------|---------------|
| **Defense** | `defense` | 1 | 100 | 1 | 10 | High (Positive) |
| **Mobility** | `mobility` | -50 | 0 | 1 | 0 | Medium (Negative) |
| **Durability** | `durability` | 10 | 1000 | 10 | 100 | Low (Positive) |
| **Weight** | `weight` | 1 | 100 | 1 | 10 | Low (Negative) |

## ⚖️ Balancing Logic

The "Cost" of an item is determined by its power.
`Item Power = (Damage * Speed * RangeMod) + (Crit * 2)`

The `WeightBasedCreator` will use this formula to calculate the "Budget" consumed by the selected stats.

## 🏗️ Implementation Steps

### 1. Define Stats
Create `src/balancing/itemStatDefinitions.ts` containing the `StatDefinition` arrays for Weapons and Armor.

### 2. Create Item Identity Component
Create `src/ui/items/components/ItemIdentityCard.tsx`.
- Name Input
- Type Select (Weapon / Armor)
- Subtype Select (Sword, Bow, Plate, Leather)
- Rarity Select (Common, Rare, Epic, Legendary)

### 3. Create Item Preview Component
Create `src/ui/items/components/ItemPreviewCard.tsx`.
- Visual representation of the item
- Calculated DPS display
- Description generation

### 4. Implement ItemCreator Page
Create `src/ui/items/ItemCreator.tsx`.
- Use `WeightBasedCreator` template
- Pass `itemStatDefinitions`
- Pass `ItemIdentityCard`
- Pass `ItemPreviewCard`

### 5. Add to App Navigation
- Update `App.tsx` to include the "Item Creator" tab.

## 🧪 Verification
- Create a "Longsword" (Damage 10, Speed 1.0) -> Verify Cost
- Create a "Dagger" (Damage 5, Speed 2.0) -> Verify Cost is similar (if DPS is key)
- Ensure "Weight" stat correctly reduces the item's "Value" or "Cost" (if we want heavier items to be cheaper/stronger for the same budget).
