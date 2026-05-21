# Vertical Slice — Complete Entity Inventory & Interaction Matrix

**Version:** 1.0 (2026-05-20)  
**Purpose:** Exhaustive list of all entities needed for vertical slice, with existence status and interaction rules.

---

## Part 1: All Entities Required (Grouped by Category)

### A. CORE DRAGGABLE ENTITIES

These are what the player interacts with via drag-and-drop.

| # | Entity Name | Type | Exists? | Path | Status | Description |
|---|---|---|---|---|---|---|
| **A.1** | **PgToken** | Draggable component | ✅ YES | `components/PgCard.tsx` | 607 lines | Rectangular token with portrait, rarity ring, status icons. Used in Roster. |
| **A.2** | **SlottedMedal** | Draggable component | ✅ YES | `components/SlottedMedal.tsx` | 203 lines | Circular board game token. Used in ActivitySlot. Better visual polish than PgCard. |
| **A.3** | **CustomDragOverlay** | Overlay visual | ✅ YES | `components/CustomDragOverlay.tsx` | 393 lines | Follows cursor during drag. Must fix pickup alignment (regression). |

### B. CONTAINER/RECEIVER ENTITIES

These receive draggable entities (slots, racks, activity cards).

| # | Entity Name | Type | Exists? | Path | Status | Description |
|---|---|---|---|---|---|---|
| **B.1** | **ResidentRoster** | Container | ✅ YES | `components/ResidentRosterPanel.tsx` | 143 lines | List of available tokens. Sortable. |
| **B.2** | **ResidentSlotRack** | Container | ✅ YES | `components/ResidentSlotRack.tsx` | 402 lines | Grid of slots for activity assignments. |
| **B.3** | **ActivitySlot** | Slot receiver | ✅ YES | `components/ActivitySlot.tsx` | 588 lines | Individual slot within rack. Shows occupied/empty state. |
| **B.4** | **BoardSlot** | Slot variant | ✅ YES | Inline in SlotRack | ~100 lines | Board-style slot layout. |
| **B.5** | **DetailSlot** | Slot variant | ✅ YES | Inline in SlotRack | ~100 lines | Detail-style slot layout. |

### C. ACTION CARD ENTITIES (POI on Map)

These spawn on the map and accept dragged tokens.

| # | Entity Name | Type | Exists? | Path | Status | Description |
|---|---|---|---|---|---|---|
| **C.1** | **JobCard** | Action card | ✅ YES | `components/JobCard.tsx` | 409 lines | Repeatable job (e.g., "Gather wood"). Timer + simple payoff. |
| **C.2** | **QuestCard** | Action card | ✅ YES | `components/QuestCard.tsx` | TBD | Quest with narrative + skill check. |
| **C.3** | **MarketActionCard** | Action card | ❌ TODO | `map/actionCards/MarketActionCard.tsx` | N/A | Traveling merchant. Appears periodically. Allows buy/sell. |
| **C.4** | **ActionCardBase** | Base class | ✅ YES | `map/actionCards/ActionCardBase.tsx` | TBD | Parent class for all action cards. |

### D. GAMEPLAY STATE ENTITIES

These manage state, not visually rendered (or minimal UI).

| # | Entity Name | Type | Exists? | Path | Status | Description |
|---|---|---|---|---|---|---|
| **D.1** | **ResidentState** | Data model | ✅ YES | (In TimeEngine store) | N/A | Character with status: available, busy, injured, away. |
| **D.2** | **ActivityDefinition** | Data model | ✅ YES | (In config) | N/A | Meta-data for activity: duration, icon, skill threshold, rewards. |
| **D.3** | **Outcome** | Data model | ❌ TODO | N/A | N/A | Result of skill check: critical/success/partial/fail/disaster. |
| **D.4** | **Equipment** | Data model | ✅ PARTIAL | (In balancing config) | Stat mods only | Item with stat bonuses. No UI for equip panel yet. |
| **D.5** | **Reputation** | Data model | ❌ TODO | N/A | N/A | Village reputation tracking. Unlocks events, heroes. |
| **D.6** | **HeroSpawn** | Logic | ❌ TODO | N/A | N/A | Rule: when does new hero appear at tavern? |

### E. UI PANELS / VIEWS (Non-draggable)

| # | Entity Name | Type | Exists? | Path | Status | Description |
|---|---|---|---|---|---|---|
| **E.1** | **ResourceHUD** | Status panel | ✅ YES | `components/ResourcePanel.tsx` | 169 lines | Displays wood, iron, food, gold, XP. |
| **E.2** | **StatusHUD** | Status panel | ✅ PARTIAL | `components/ActiveHUD.tsx` | 1042 lines | Shows occupied slots, resident status. Complex. |
| **E.3** | **SkillCheckPanel** | Modal | ❌ TODO | N/A | N/A | Cultist Simulator-style skill check UI. |
| **E.4** | **OutcomeModal** | Modal | ❌ TODO | N/A | N/A | Shows outcome + rewards after activity completes. |
| **E.5** | **LevelUpAnimation** | Animation | ❌ TODO | N/A | N/A | Eroe level up feedback (glow medaglione, notification). |
| **E.6** | **UpgradeAvailableIcon** | Animation | ❌ TODO | N/A | N/A | Building icon flashes when upgrade unlocked. |

### F. HOOKS / BUSINESS LOGIC (Invisible)

| # | Entity Name | Type | Exists? | Path | Status | Description |
|---|---|---|---|---|---|---|
| **F.1** | **useVillageResidents** | Hook | ✅ YES | `hooks/useVillageResidents.ts` | TBD | Loads residents from Character storage. |
| **F.2** | **useResidentSlotController** | Hook | ✅ YES | `slots/useResidentSlotController.ts` | 403 lines | Assignment logic. Validation. |
| **F.3** | **useActionCardsV2** | Hook | ✅ YES | `hooks/useActionCardsV2.ts` | TBD | Activity lifecycle (start, progress, complete). |
| **F.4** | **useMinimalGameplayWithIdleVillageConfig** | Hook | ✅ YES | (In store) | TBD | Central game state + time engine. |
| **F.5** | **useDragContext** | Hook | ✅ YES | `components/DragContext.tsx` | TBD | Drag state (active resident, drag time, etc). |
| **F.6** | **useOutcomeCalculation** | Hook | ❌ TODO | N/A | N/A | Skill check roll + result determination. |
| **F.7** | **useReputationSystem** | Hook | ❌ TODO | N/A | N/A | Track reputation, unlock events. |
| **F.8** | **useHeroSpawning** | Hook | ❌ TODO | N/A | N/A | Logic: when/how do new heroes appear? |

### G. INFRASTRUCTURE ENTITIES

| # | Entity Name | Type | Exists? | Path | Status | Description |
|---|---|---|---|---|---|---|
| **G.1** | **MinimalGameplayPage** | Page | ✅ YES | `MinimalGameplayPage.tsx` | 1400+ lines | Canonical gameplay surface. Entry point. |
| **G.2** | **Map / POI Layout** | Component | ✅ PARTIAL | `components/PoiDetailSkinWrapper.tsx` | TBD | Renders POI on map. |
| **G.3** | **TimeEngine** | Service | ✅ YES | `src/engine/game/idleVillage/TimeEngine.ts` | TBD | Day/night cycle, timer management. |
| **G.4** | **PersistenceService** | Service | ✅ YES (3 versions) | `services/PersistenceService.ts` | TBD | Save/load game state. Needs consolidation. |
| **G.5** | **LocalizationService** | Service | ✅ YES | N/A | TBD | Text strings EN + IT stub. |
| **G.6** | **DndContext** | Provider | ✅ YES | `components/DndContext.tsx` | TBD | @dnd-kit drag-drop setup. |

---

## Part 2: Interaction Matrix (What Interacts With What)

### Key Rules

1. **Draggable → Container** only valid interaction path
2. **Guard layers G1-G6** protect against unintended state mutations
3. **Freezing semantics** define what cannot be done during each operation
4. **State flow** is always: User action → Hook logic → State update → UI re-render

### Complete Interaction Map

```
┌─ DRAGGABLE ENTITIES (what user picks up)
│
├─ PgToken (A.1)
│   ├─→ ResidentRoster (B.1): click to auto-assign OR ordered re-render
│   ├─→ ResidentSlotRack (B.2): drag-and-drop to assign
│   │   ├─→ ActivitySlot (B.3): one token per slot
│   │   ├─→ BoardSlot (B.4): visual variant
│   │   └─→ DetailSlot (B.5): visual variant
│   ├─→ JobCard (C.1): drag to start job
│   ├─→ QuestCard (C.2): drag to start quest
│   └─→ MarketActionCard (C.3): no drag, click to interact
│
├─ SlottedMedal (A.2)
│   ├─→ ResidentSlotRack (B.2): same as PgToken (visual variant)
│   └─→ ActivitySlot (B.3): occupied state
│
└─ CustomDragOverlay (A.3)
    └─→ Follows cursor (no state mutation)

┌─ CONTAINER ENTITIES (what receives draggables)
│
├─ ResidentRoster (B.1)
│   ├─← PgToken updates (when assigned/unassigned)
│   ├─← Sort order changes
│   ├─← Availability filter changes
│   └─→ StatusHUD (E.2): visual feedback
│
├─ ResidentSlotRack (B.2)
│   ├─← PgToken assignment (from drag)
│   ├─← Activity timer updates
│   └─→ StatusHUD (E.2): visual feedback
│
└─ ActivitySlot (B.3)
    ├─← PgToken assignment
    ├─← Timer progress
    └─← Outcome results

┌─ ACTION CARDS (map POI)
│
├─ JobCard (C.1)
│   ├─← PgToken drag (assignment)
│   ├─← useActionCardsV2 (timer, payoff)
│   └─→ ResourceHUD (E.1): gold/material reward
│
├─ QuestCard (C.2)
│   ├─← PgToken drag (assignment)
│   ├─← useActionCardsV2 (timer)
│   ├─← useOutcomeCalculation (skill check)
│   ├─→ SkillCheckPanel (E.3): show roll
│   └─→ OutcomeModal (E.4): show rewards
│
└─ MarketActionCard (C.3) [TODO]
    ├─← Click to open
    ├─← useBuyEquipment hook [TODO]
    └─→ Equipment in inventory [TODO]

┌─ STATE ENTITIES (invisible, but critical)
│
├─ ResidentState (D.1)
│   ├─← Character storage (source of truth)
│   ├─→ PgToken (visual render)
│   ├─→ ResidentRoster (list render)
│   ├─→ ResidentSlotRack (slot render)
│   ├─→ StatusHUD (status display)
│   └─→ ActivitySlot (occupied display)
│
├─ ActivityDefinition (D.2)
│   ├─← Config / map POI definition
│   ├─→ ActionCardBase (visual render)
│   ├─→ useActionCardsV2 (lifecycle)
│   └─→ useOutcomeCalculation (rewards/penalty)
│
├─ Outcome (D.3) [TODO]
│   ├─← useOutcomeCalculation (generated)
│   ├─→ SkillCheckPanel (display)
│   ├─→ OutcomeModal (display)
│   ├─→ ResidentState (apply rewards/penalties)
│   └─→ ResourceHUD (update resources)
│
├─ Equipment (D.4)
│   ├─← Balancing config
│   ├─→ ResidentState (stat mods)
│   ├─→ StatusHUD (show equipped)
│   └─→ useOutcomeCalculation (stat threshold check)
│
├─ Reputation (D.5) [TODO]
│   ├─← Activity outcomes
│   ├─→ useHeroSpawning (unlock heroes)
│   └─→ StatusHUD (display reputation bar)
│
└─ HeroSpawn (D.6) [TODO]
    ├─← Reputation reaches threshold
    ├─← New hero appears at tavern
    └─→ ResidentRoster (add to list)

┌─ UI PANELS
│
├─ ResourceHUD (E.1)
│   └─← ResourceState (gold, food, wood, iron)
│
├─ StatusHUD (E.2)
│   ├─← ResidentRoster state
│   ├─← ResidentSlotRack state
│   ├─← ActivitySlot state (timers)
│   └─← Reputation state
│
├─ SkillCheckPanel (E.3) [TODO]
│   ├─← ActivityDefinition (quest meta)
│   ├─← ResidentState (hero stats + equip)
│   ├─← Outcome (roll result)
│   └─→ OutcomeModal (on close)
│
└─ OutcomeModal (E.4) [TODO]
    ├─← Outcome (rewards/narrative)
    ├─→ ResidentState (apply XP, level up)
    ├─→ ResourceHUD (apply rewards)
    ├─→ LevelUpAnimation (if level up)
    └─→ UpgradeAvailableIcon (if upgrade unlocked)

┌─ HOOKS (Orchestrators)
│
├─ useVillageResidents (F.1)
│   └─→ ResidentState array
│
├─ useResidentSlotController (F.2)
│   ├─← Drag assignment requests
│   ├─→ Validates assignment
│   └─→ Applies to state
│
├─ useActionCardsV2 (F.3)
│   ├─← Activity start request
│   ├─→ Timer tick
│   ├─→ Completion event
│   └─→ useOutcomeCalculation
│
├─ useOutcomeCalculation (F.6) [TODO]
│   ├─← ActivityDefinition
│   ├─← ResidentState (hero + equip)
│   ├─→ Generates Outcome
│   └─→ Applies rewards to state
│
├─ useReputationSystem (F.7) [TODO]
│   ├─← Activity outcomes
│   ├─→ Updates Reputation
│   └─→ Signals for hero spawn
│
└─ useHeroSpawning (F.8) [TODO]
    ├─← Reputation threshold
    ├─→ Adds hero to ResidentState
    └─→ Triggers tavern animation
```

---

## Part 3: Entity Dependencies (Topological Order)

**Order to implement for minimal regressions:**

1. **Foundation (must be first):**
   - ResidentState (D.1) — all entities depend on this
   - ActivityDefinition (D.2) — POI depend on this

2. **Draggables + Containers (Phase 1-3):**
   - PgToken (A.1) + SlottedMedal (A.2) — core visual
   - ResidentRoster (B.1) — lists draggables
   - ResidentSlotRack (B.2) + ActivitySlot (B.3) — receives draggables
   - CustomDragOverlay (A.3) — visual during drag

3. **Guard Layers (Phase 4):**
   - useResidentSlotController (F.2) — validates assignments
   - G1-G6 guard system — prevents ghost clicks, race conditions

4. **Action Cards (Phase 4-5):**
   - JobCard (C.1) — simplest action card
   - QuestCard (C.2) — requires skill check
   - MarketActionCard (C.3) — requires equip UI

5. **Outcome System (Phase 5-6):**
   - useOutcomeCalculation (F.6) [TODO] — skill check roll
   - Outcome (D.3) [TODO] — result model
   - SkillCheckPanel (E.3) [TODO] — UI for roll
   - OutcomeModal (E.4) [TODO] — UI for rewards

6. **Progression (Phase 6):**
   - LevelUpAnimation (E.5) [TODO]
   - UpgradeAvailableIcon (E.6) [TODO]
   - Equipment (D.4) — stat bonuses
   - Reputation (D.5) [TODO]
   - HeroSpawn (D.6) [TODO]

7. **Infrastructure:**
   - MinimalGameplayPage (G.1) — orchestrates all
   - TimeEngine (G.3) — tick updates
   - PersistenceService (G.4) — save/load
   - LocalizationService (G.5) — strings

---

## Part 4: Entities By Implementation Phase

### Phase 1: PgToken Isolated
- **A.1** PgToken (verify existing)
- **D.1** ResidentState (verify existing)

### Phase 2: Roster + PgToken
- **B.1** ResidentRoster (verify existing)
- **F.1** useVillageResidents (verify existing)

### Phase 3: SlotRack
- **B.2** ResidentSlotRack (verify existing)
- **B.3** ActivitySlot (verify existing)
- **B.4** BoardSlot (verify existing)
- **B.5** DetailSlot (verify existing)

### Phase 4: Drag + JobCard
- **A.3** CustomDragOverlay (fix pickup alignment)
- **F.2** useResidentSlotController (verify/fix guard layers)
- **C.1** JobCard (verify existing)
- **D.2** ActivityDefinition (verify existing)

### Phase 5: QuestCard + SkillCheck
- **C.2** QuestCard (verify existing)
- **D.3** Outcome [TODO IMPLEMENT]
- **F.6** useOutcomeCalculation [TODO IMPLEMENT]
- **E.3** SkillCheckPanel [TODO IMPLEMENT]
- **E.4** OutcomeModal [TODO IMPLEMENT]

### Phase 6: Progression + Polish
- **D.4** Equipment (extend, add UI)
- **D.5** Reputation [TODO IMPLEMENT]
- **D.6** HeroSpawn [TODO IMPLEMENT]
- **F.7** useReputationSystem [TODO IMPLEMENT]
- **F.8** useHeroSpawning [TODO IMPLEMENT]
- **E.5** LevelUpAnimation [TODO IMPLEMENT]
- **E.6** UpgradeAvailableIcon [TODO IMPLEMENT]
- **E.2** StatusHUD (extend)
- **C.3** MarketActionCard [TODO IMPLEMENT]

---

**Total Entities:** 35  
**Existing:** 24 ✅  
**TODO (New/Incomplete):** 11 ❌

---

**Last Updated:** 2026-05-20  
**Status:** Complete inventory for Phase 1-6 planning
