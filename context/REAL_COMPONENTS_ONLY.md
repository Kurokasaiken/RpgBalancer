# Real Components Only — Correct Inventory & True Interaction Pairs

**Version:** 1.0 (2026-05-20)  
**Purpose:** Strip away hooks/services/data models. Only visual React components that render UI.

---

## Part 1: Visual Components Only

Extracted from GAMEPLAY_DESIGN.md §9 + analysis:

| # | Component | Type | Exists? | Path | Role | Isolated Test? |
|---|-----------|------|---------|------|------|---|
| **1** | **PgCard** | Token (rect) | ✅ YES | components/PgCard.tsx | Display resident in roster | ✅ /minimal-pgcard |
| **2** | **SlottedMedal** | Token (circle) | ✅ YES | components/SlottedMedal.tsx | Display resident in slot | ✅ /minimal-slottedmedal |
| **3** | **CustomDragOverlay** | Overlay | ✅ YES | components/CustomDragOverlay.tsx | Visual during drag (follows cursor) | ⚠️ Tested with drag, not isolated |
| **4** | **VillageRosterSection** | Container | ✅ YES | components/VillageRosterSection.tsx | Lists all available tokens | ✅ /minimal-roster |
| **5** | **ResidentSlotRack** | Container | ✅ YES | components/ResidentSlotRack.tsx | Grid of 4-8 slots | ✅ /minimal-slotRack |
| **6** | **ActivitySlot** | Slot variant | ✅ YES | components/ActivitySlot.tsx | Individual slot (occupied/empty state) | ✅ Part of SlotRack test |
| **7** | **JobCard** | Action card | ✅ YES | components/JobCard.tsx | "Taglia legna" repeatable job on map | ✅ /minimal-jobcard |
| **8** | **QuestCard** | Action card | ✅ YES | components/QuestCard.tsx | "Quest narrativa" with skill check | ✅ /minimal-questcard |
| **9** | **SkillCheckPanel** | Modal | ❌ TODO | map/modals/SkillCheckPanel.tsx | Cultist Simulator-style roll display | ✅ /minimal-skillcheck |
| **10** | **OutcomeModal** | Modal | ❌ TODO | map/modals/OutcomeModal.tsx | Shows outcome + rewards after quest | ✅ /minimal-outcome |
| **11** | **ResourceHUD** | Status panel | ✅ YES (partial) | components/ResourcePanel.tsx | Displays gold, wood, food, iron | ✅ /minimal-resourcehud |
| **12** | **MarketActionCard** | Action card | ❌ TODO | map/actionCards/MarketActionCard.tsx | Traveling merchant buy/sell | ✅ /minimal-market |
| **13** | **LevelUpAnimation** | Animation | ❌ TODO | components/LevelUpAnimation.tsx | Hero level-up feedback (glow + ring color change) | ⚠️ Integrated with outcome |
| **14** | **UpgradeIcon** | UI element | ❌ TODO | components/UpgradeIcon.tsx | "Upgrade available" flashing icon on building | ⚠️ Integrated with levelup |
| **15** | **ClockWidget** | Time display | ✅ YES (partial) | components/minimal/ClockWidget.tsx | Shows day/hour, speed control | ✅ /minimal-clock |

**Total React Components:** 15  
**Existing (can reuse):** 10 ✅  
**TODO (need to create):** 5 ❌

---

## Part 2: TRUE Interaction Pairs (Not Combinatorial)

Based on GAMEPLAY_DESIGN.md §6 "loop di sessione", only pairs that:
1. User sees both together
2. Have real data flow between them
3. Are in the same "operation"

### Gameplay Loop Analysis

**User Session Flow:**
```
1. Apertura: Look at Roster (who's available, who's busy, who's injured)
   → Involves: VillageRosterSection + PgCard display
   → Interaction: None (pure render)

2. Assegnazione lavoratori: Drag PgCard to JobCard
   → Involves: PgCard + JobCard + CustomDragOverlay + ResidentSlotRack
   → Interaction: REAL (drag assignment)

3. Mercante: Click MarketActionCard (if spawned)
   → Involves: MarketActionCard + UI (buy/sell, not drag)
   → Interaction: REAL (click buy/sell)

4. Assegnazione eroi: Drag PgCard to QuestCard
   → Involves: PgCard + QuestCard + CustomDragOverlay + ResidentSlotRack
   → Interaction: REAL (drag assignment)

5. Attesa attiva: Timers run. HUD updates. No user interaction.
   → Involves: ResourceHUD + TimerDisplay (internal, silent)
   → Interaction: None (state update only)

6. Skill check scatta: SkillCheckPanel shows
   → Involves: QuestCard + SkillCheckPanel (modal)
   → Interaction: VISUAL TRIGGER (quest timer expires → panel opens)

7. Outcome: OutcomeModal shows, rewards applied
   → Involves: SkillCheckPanel + OutcomeModal (sequential, not concurrent)
   → Interaction: VISUAL TRIGGER (skill check closes → outcome opens)

8. Level up: Hero rings change color, Upgrade icon blinks
   → Involves: SlottedMedal (ring color change) + UpgradeIcon (blink)
   → Interaction: VISUAL CONSEQUENCE (levelup → unlock upgrade)
```

---

## Part 3: Actual Interaction Pairs (Verified)

Only pairs with real data flow or user interaction:

| # | Pair | Type | User Action? | Data Flow | Test Page |
|---|---|---|---|---|---|
| **P1** | PgCard ↔ VillageRosterSection | Display | None | Render list | /minimal-roster |
| **P2** | PgCard ↔ JobCard | Drag | YES (drag drop) | Assign resident → job starts | /minimal-pgcard-jobcard |
| **P3** | PgCard ↔ QuestCard | Drag | YES (drag drop) | Assign resident → quest starts | /minimal-pgcard-questcard |
| **P4** | PgCard ↔ ResidentSlotRack | Drop target | YES (drag end) | Occupies slot, shows state | /minimal-slotRack |
| **P5** | SlottedMedal ↔ ResidentSlotRack | Display variant | None | Same as P4, different visual | Part of slotRack test |
| **P6** | CustomDragOverlay ↔ PgCard | Visual follow | None (passive) | Follows cursor during drag | Part of drag test |
| **P7** | JobCard ↔ ResourceHUD | Update | None (auto) | Job completes → resources added | /minimal-jobcard (self-contained) |
| **P8** | QuestCard ↔ SkillCheckPanel | Trigger | None (auto) | Quest timer ends → panel opens (modal) | Integrated test |
| **P9** | SkillCheckPanel ↔ OutcomeModal | Trigger | YES (button: "Confirm") | Roll complete → show outcome | Integrated test |
| **P10** | OutcomeModal ↔ SlottedMedal (hero) | Update | None (auto) | Outcome apply → hero ring color change (levelup) | Integrated test |
| **P11** | SlottedMedal ↔ UpgradeIcon | Trigger | None (auto) | Hero levelup → upgrade icon blinks | Integrated test |
| **P12** | MarketActionCard ↔ ??? | Click/buy | YES (click buttons) | Buy equip → modify ResourceHUD | /minimal-market (self-contained) |

**Total TRUE Pairs:** 12  
**Standalone tests (isolated component):** 4  
**Integrated tests (multi-component, but sequential/causal):** 8

---

## Part 4: Recommended Test Pages (Not 35, Not 6)

Grouped intelligently:

### Tier 1: Isolated Component Pages (No cross-component interaction)
```
/minimal-pgcard              ← PgCard rendering (portrait, rarity ring, status icons)
/minimal-slottedmedal        ← SlottedMedal rendering (circle variant)
/minimal-roster              ← VillageRosterSection + list of PgCards (pure render)
/minimal-slotRack            ← ResidentSlotRack + ActivitySlots (empty/occupied states)
/minimal-resourcehud         ← ResourceHUD (displays numbers, updates on state change)
/minimal-jobcard             ← JobCard alone (timer, no interaction yet)
/minimal-questcard           ← QuestCard alone (timer, no interaction yet)
/minimal-market              ← MarketActionCard alone (click to buy/sell, UI only)
/minimal-skillcheck          ← SkillCheckPanel alone (shows roll, click confirm)
/minimal-outcome             ← OutcomeModal alone (shows rewards, click close)
```

**Count:** 10 pages. All can be tested in isolation.

### Tier 2: Interaction Pages (Two or more components together, causal flow)
```
/minimal-drag-pgcard-to-jobcard       ← P2: Drag PgCard → JobCard starts job
                                       ← Also tests CustomDragOverlay (P6)
/minimal-drag-pgcard-to-questcard     ← P3: Drag PgCard → QuestCard starts quest
                                       ← Also tests CustomDragOverlay (P6)
/minimal-full-quest-flow              ← P8-P11: Quest timer → SkillCheck → Outcome → LevelUp
```

**Count:** 3 pages. Only test things that must happen together.

### Total Pages Needed: **13** (10 + 3)

Much smaller than 35 or even 6-7. **Realistic & maintainable.**

---

## Part 5: Why This Count is Correct

### 10 Isolated Pages (Tier 1)
Each component has **one** minimal page showing it alone:
- PgCard: shows token, portrait loads, rarity ring colors, status icons visible/hidden
- VillageRosterSection: lists 3+ tokens, sorting works, filtering works
- ResidentSlotRack: shows 4 empty slots, then shows slots with tokens
- JobCard: shows timer, payoff happens, resource updates (internal)
- SkillCheckPanel: shows roll display, stat comparison, confirm button
- OutcomeModal: shows rewards, hero XP, gold delta
- Market: shows buy/sell buttons, inventory updates
- Clock: shows time, speed controls work
- ResourceHUD: shows resources, updates when changed
- SlottedMedal: same as PgCard but circular

**Test per page:** 5-8 tests (rendering + state change + edge cases)  
**Total unit tests:** ~60

### 3 Interaction Pages (Tier 2)
Only test things that **must** happen together:
- **Drag to JobCard:** User drags PgCard → JobCard receives it → timer starts → payoff applies
  - Tests: drag interaction + slot assignment + timer + resource update (all causal)
  
- **Drag to QuestCard:** User drags PgCard → QuestCard receives it → timer starts → skill check triggers
  - Tests: drag interaction + slot assignment + timer + skill check modal (causal chain)
  
- **Full Quest Flow:** Quest completes → SkillCheck opens → User confirms → Outcome opens → rewards apply → LevelUp triggers → Upgrade icon blinks
  - Tests: All final integrations in sequence (causal chain)

**Test per page:** 10-15 tests (multiple interactions, timing, state changes)  
**Total integration tests:** ~35

### Total Test Count
- **Unit/Isolated tests:** ~60
- **Integration tests:** ~35
- **Total:** ~95 tests

**Realistic:** 95 Playwright tests is doable. Each test 5-10 seconds = ~15-20 min full run.

---

## Part 6: Implementation Order (Dependency Graph)

```
Tier 0: FOUNDATION (no page, just existing code verified)
└─ TimeEngine (existing, just use it)
└─ ResidentState (existing, just use it)

Tier 1a: DRAGGABLES (render in isolation)
├─ /minimal-pgcard        ← Phase 1
└─ /minimal-slottedmedal   ← Phase 1 variant

Tier 1b: CONTAINERS (render in isolation)
├─ /minimal-roster         ← Phase 2
├─ /minimal-slotRack       ← Phase 3
└─ /minimal-jobcard        ← Phase 3

Tier 1c: INFO DISPLAYS (render in isolation)
├─ /minimal-resourcehud    ← Phase 3
├─ /minimal-clock          ← Phase 3
└─ /minimal-questcard      ← Phase 4

Tier 1d: MODALS (render in isolation)
├─ /minimal-skillcheck     ← Phase 5
├─ /minimal-outcome        ← Phase 5
└─ /minimal-market         ← Phase 5

Tier 2: INTERACTIONS (multi-component, sequential)
├─ /minimal-drag-pgcard-to-jobcard    ← Phase 4 (depends on: PgCard, JobCard, ResidentSlotRack)
├─ /minimal-drag-pgcard-to-questcard  ← Phase 4 (depends on: PgCard, QuestCard, ResidentSlotRack)
└─ /minimal-full-quest-flow           ← Phase 6 (depends on: all above + SkillCheckPanel + OutcomeModal + LevelUpAnimation)

Final:
└─ /minimal-gameplay (extends existing, uses all components above)
```

---

## Part 7: Test Estimate

| Page | Component Count | Test Cases | Duration (min) | Notes |
|------|---|---|---|---|
| pgcard | 1 | 8 | 1 | Portrait, rarity, icons, hover |
| slottedmedal | 1 | 6 | 1 | Same as pgcard but circle |
| roster | 2 (Section + PgCards) | 8 | 1.5 | Sorting, filtering, rendering |
| slotRack | 2 (Rack + Slots) | 8 | 1.5 | Empty slots, occupied slots, CSS |
| resourcehud | 1 | 6 | 1 | Display gold/wood/food/iron |
| clock | 1 | 5 | 1 | Day/hour display, speed control |
| jobcard | 1 | 7 | 1.5 | Timer, payoff, internal resource update |
| questcard | 1 | 7 | 1.5 | Timer, metadata display |
| skillcheck | 1 | 8 | 2 | Roll display, stat comparison, confirm |
| outcome | 1 | 8 | 2 | Rewards, XP, close |
| market | 1 | 8 | 2 | Buy/sell buttons, inventory |
| drag-to-job | 3 (PgCard, JobCard, Overlay) | 12 | 3 | Drag start, drop, assignment, timer, payoff |
| drag-to-quest | 3 (PgCard, QuestCard, Overlay) | 12 | 3 | Drag start, drop, assignment, timer, skill check |
| full-quest-flow | 8 (PgCard, QuestCard, Slot, SkillCheck, Outcome, LevelUp, Icon) | 15 | 4 | Complete playthrough from drag to upgrade |

**Total:** ~150 tests, ~30-35 minutes run time (acceptable)

---

## Summary

### Old Analysis (Wrong)
- 35 entities (including hooks, services, data models)
- 595 possible pairs
- Maintenance nightmare

### New Analysis (Correct)
- **15 visual components** (10 existing, 5 TODO)
- **12 TRUE interaction pairs** (not 595)
- **13 test pages** (10 isolated + 3 integration)
- **~150 tests** (~30 min run time)
- **4-5 weeks timeline** (realistic, sustainable)

### Key Insight You Were Right About
- "The same code is called from other pages, not modified" → Yes, components are pure, pages reuse them
- "Components shouldn't interact unless absolutely necessary" → Correct, only 12 real pairs exist
- "Victory modal only triggers when quest ends" → Yes, sequential trigger, not concurrent interaction

---

**Status:** ✅ Corrected analysis ready for implementation  
**Next step:** Confirm this is accurate, then create the 13 pages + 150 tests
