# Phase 6: StatusHUD (Day/Night + Resources) — Entity Specification

**Phase:** 6 of 6
**Estimated Duration:** 1-2 days
**Entità:** StatusHUD + Day/Night POI + ResourceTracker
**Page Route:** `/minimal-hud`
**Test Page Requirement:** MUST use real project components (StatusHUD, DayNightPOI, ResourceTracker) with mock data
**Last Updated:** 2026-05-21

---

**Aligned with Master Plan:** See [MASTER_PLAN.md](../MASTER_PLAN.md) for separation of concerns (plans vs tasks)
**Aligned with Semantic Constraints:** See [context/RPG_PROJECT_CONTEXT.md](../../context/RPG_PROJECT_CONTEXT.md) for freezing semantics
**Aligned with Time Engine Contract:** See [time_engine_trusted.md](../idle_village/trusted/time_engine_trusted.md) for TimeEngine dual-layer architecture
**Aligned with Day/Night Trusted:** See [daynight_trusted.md](../idle_village/trusted/daynight_trusted.md) for Day/Night Cycle System

---

## 1. Entity Overview

### 1.1 What is StatusHUD?

**StatusHUD** is the read-only display that shows:
- **Day/Night Cycle**: Current phase (day/night), progress through phase, speed controls (1x, 2x, 3x, 5x, stop)
- **POI Day/Night**: Embedded POI visual showing day/night state with halo and icon
- **Resources**: All game resources with small, non-invasive animation on update

**Architecture:**
```
StatusHUD (read-only view)
  ├─ Day/Night Cycle
  │   ├─ Speed Controls (1x, 2x, 3x, 5x, stop)
  │   ├─ POI Day/Night (embedded)
  │   │   ├─ Progress Halo (0-1 progress)
  │   │   ├─ Phase Icon (sun/moon/pause)
  │   │   └─ Color Coding (gold/purple/gray)
  │   └─ Day Counter
  └─ ResourceTracker
      ├─ All Resources (wood, metal, gold, etc.)
      └─ Animation on update (small, non-invasive)
```

**In the codebase:**
- `MinimalHUDPage.tsx` (305 lines) - Full gameplay loop with StatusHUD
- `DayNightPOI.tsx` - POI day/night visual component
- `DayNightPoiSkin.tsx` - Skin configuration for day/night POI
- `DayNightActionCard.tsx` - Action card for pause/resume
- `dayNightPoiSkinConfig.ts` - Visual configuration presets
- `useMinimalGameplay.ts` - State integration for temporal state

**Visually rendered as:**
```
┌─────────────────────────────────┐
│ [POI] Day 3  [1x][2x][3x][5x][■]│ ← Day/Night Cycle
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐  │
│ │ ☀ │ │ ☀ │ │ ☀ │ │ ☀ │ │ ■ │  │ ← Speed Controls
│ └───┘ └───┘ └───┘ └───┘ └───┘  │
│ ┌─────────────────────────┐     │
│ │  ╭───╮                  │     │ ← POI Day/Night (embedded)
│ │  │   │ 65%              │     │
│ │  ╰───╮                  │     │
│ │     ☀                   │     │
│ └─────────────────────────┘     │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐       │ ← Resources
│ │🪵 │ │⚙️ │ │💰 │ │⭐ │       │
│ │100│ │ 50 │ │ 25 │ │ 10 │       │
│ └───┘ └───┘ └───┘ └───┘       │
└─────────────────────────────────┘
```

### 1.2 Key Components

| Component | Type | Path | Purpose |
|-----------|------|------|---------|
| **StatusHUD** | Read-only HUD | MinimalHUDPage.tsx | Shows day/night, speed, resources |
| **DayNightPOI** | POI visual | components/minimal/DayNightPOI.tsx | Shows day/night state with halo |
| **DayNightPoiSkin** | Skin config | skins/dayNightPoiSkinConfig.ts | Visual configuration presets |
| **DayNightActionCard** | Action card | map/actionCards/DayNightActionCard.tsx | Pause/resume toggle |
| **ResourceTracker** | Resource display | (to be implemented) | Shows all resources with animation |
| **TimeEngine** | Timer engine | engine/game/idleVillage/TimeEngine.ts | Manages temporal state |

### 1.3 Key Properties

| Property | Type | Source | Example |
|----------|------|--------|---------|
| `isDayPhase` | `boolean` | useMinimalGameplay | true |
| `cycleProgress` | `number` (0-1) | useMinimalGameplay | 0.65 |
| `isPaused` | `boolean` | useMinimalGameplay | false |
| `currentTick` | `number` | useMinimalGameplay | 12345 |
| `dayTimeUnits` | `number` | config.globalRules.dayNightCycle | 100 |
| `nightTimeUnits` | `number` | config.globalRules.dayNightCycle | 50 |
| `speed` | `number` | TimeEngine | 1 |
| `resources` | `VillageResources` | TimeEngine | {wood: 100, metal: 50, gold: 25} |
| `dayCounter` | `number` | TimeEngine | 3 |

**Source of truth:** useMinimalGameplay store for temporal state, TimeEngine for resources and speed.

---

## 2. Visual Appearance & Rendering

### 2.1 Day/Night Cycle Visuals

**POI Day/Night (embedded):**
```
┌─────────────────────────┐
│  ╭───╮                  │ ← Progress Halo (0-1 progress)
│  │   │ 65%              │ ← Progress through phase
│  ╰───╮                  │
│     ☀                   │ ← Phase Icon (sun/moon/pause)
└─────────────────────────┘
```

**States:**
| State | Visual | When |
|-------|--------|------|
| **Day Running** | Gold ring, sun icon, full bloom intensity | Day phase, not paused |
| **Night Running** | Purple ring, moon icon, reduced bloom | Night phase, not paused |
| **Paused** | Gray ring, pause icon, minimal bloom (0.34 opacity) | Paused |
| **Transitions** | Smooth 220ms opacity changes | Phase change |

**Color Coding:**
- Day: Gold/amber palette (`#E3B24C`, `#F2C14E`)
- Night: Purple/indigo palette (`#7C5CFF`, `#8B5CF6`)
- Paused: Gray palette (`#8E97A8`)

### 2.2 Speed Controls Visuals

**Speed buttons:**
```
[1x] [2x] [3x] [5x] [■]
```

**States:**
| Speed | Visual | When |
|-------|--------|------|
| **1x** | Active (highlighted) | Normal speed |
| **2x** | Active (highlighted) | 2x speed |
| **3x** | Active (highlighted) | 3x speed |
| **5x** | Active (highlighted) | 5x speed |
| **Stop** | Active (highlighted) | Paused |

### 2.3 Resources Visuals

**Resource display:**
```
┌───┐ ┌───┐ ┌───┐ ┌───┐
│🪵 │ │⚙️ │ │💰 │ │⭐ │
│100│ │ 50 │ │ 25 │ │ 10 │
└───┘ └───┘ └───┘ └───┘
```

**Animation:**
- Small, non-invasive animation on update
- Subtle scale increase (1.05x) with transition
- Color flash on resource gain
- No animation on resource loss

---

## 3. Freezing Semantics (Quando sono congelato)

### 3.1 Freezing Rules

| Entity | When Frozen | Duration | Why |
|--------|----------|----------|-----|
| **StatusHUD** | Never | N/A | Read-only view |
| **Day/Night POI** | Never | N/A | Read-only visual |
| **Speed Controls** | During activity in-progress | Until activity completes | Prevents speed change during critical moments |
| **ResourceTracker** | Never | N/A | Read-only display |
| **TimeEngine** | Never | N/A | Continues ticking |

### 3.2 Freezing Implementation

**StatusHUD:**
- Always read-only, never frozen
- Continues to update during drag operations
- Updates only when day changes (not every tick)

**Speed Controls:**
- Disabled during activity in-progress
- Prevents speed change during critical moments
- Re-enabled when activity completes

**ResourceTracker:**
- Always read-only, never frozen
- Updates with small, non-invasive animation
- No freezing during drag or other operations

---

## 4. Cross-Entity Behavior (Come interagisco con...)

### 4.1 StatusHUD ↔ TimeEngine

**Temporal state:**
- StatusHUD reads day and speed from TimeEngine
- TimeEngine advances time and updates currentTick
- StatusHUD calculates phase and progress based on currentTick and dayNightCycle config
- StatusHUD displays phase icon (sun/moon/pause) and progress halo (0-1)

**Speed controls:**
- Speed buttons control TimeEngine speed multiplier
- TimeEngine applies speed multiplier to tick rate
- StatusHUD displays current speed (1x, 2x, 3x, 5x, stop)

**Sync:**
- StatusHUD must be synchronized (only when day passes, not every tick)
- Performance: Not too many updates, in case calculate everything per tick

### 4.2 StatusHUD ↔ Day/Night POI

**POI integration:**
- StatusHUD embeds POI Day/Night visual
- Day/Night POI shows current phase (day/night) with halo and icon
- Progress halo shows 0-1 progress through current phase
- Color coding: gold/amber for day, purple/indigo for night, gray for paused

**Visual states:**
- Day Running: Gold ring, sun icon, full bloom intensity
- Night Running: Purple ring, moon icon, reduced bloom
- Paused: Gray ring, pause icon, minimal bloom (0.34 opacity)
- Transitions: Smooth 220ms opacity changes between phase icons

### 4.3 StatusHUD ↔ ResourceTracker

**Resource display:**
- StatusHUD shows all resources via ResourceTracker
- Resources update with small, non-invasive animation
- Animation: Subtle scale increase (1.05x) with transition
- Color flash on resource gain
- No animation on resource loss

**Sync:**
- Resources must update correctly
- Updates only when day changes (not every tick)
- Performance: Calculate everything per tick if needed

### 4.4 StatusHUD ↔ useMinimalGameplay Store

**State integration:**
- StatusHUD reads temporal state from useMinimalGameplay store
- Reads: isDayPhase, cycleProgress, isPaused, currentTick
- Calculates phase and progress based on currentTick and dayNightCycle config
- Emits telemetry events on phase transitions

**Store actions:**
- Pause/resume functionality through store actions
- Call pauseGame()/resumeGame() for user interactions
- Listen to store updates for reactive rendering

---

## 5. Known Issues & Guard Layers (Cosa può andare storto)

### 5.1 Sync Issues

**Problem:** StatusHUD might not synchronize correctly with TimeEngine.

**Guard layer:** StatusHUD must be synchronized (only when day passes, not every tick). Performance: Not too many updates, in case calculate everything per tick.

**Status:** Works correctly.

### 5.2 Resource Tracking

**Problem:** Resources might not update correctly.

**Guard layer:** Resources must update correctly with small, non-invasive animation. Animation: Subtle scale increase (1.05x) with transition. Color flash on resource gain. No animation on resource loss.

**Status:** Works correctly.

### 5.3 Activity Tracking

**Problem:** Activity tracking might be in StatusHUD.

**Guard layer:** Activity tracking must be in a separate component (ActivityLog or ActivityTracker). StatusHUD only shows day/night, speed, and resources.

**Status:** Component separation required.

### 5.4 Performance

**Problem:** Too many updates might cause lag.

**Guard layer:** Not too many updates, in case calculate everything per tick. Updates only when day changes (not every tick).

**Status:** Works correctly.

---

## 6. Day/Night Cycle System (from daynight_trusted.md)

### 6.1 Source of Truth

**Authoritative State Source:** useMinimalGameplay store
- state.isDayPhase: Boolean indicating current phase (true = day, false = night)
- state.cycleProgress: Number 0-1 representing progress through current phase
- state.isPaused: Boolean indicating if the cycle is paused
- state.currentTick: Integer tick count (primary source for phase calculation)

**Configuration Source:** config.globalRules.dayNightCycle
- dayTimeUnits: Number of ticks for day phase
- nightTimeUnits: Number of ticks for night phase

**Visual Configuration:** dayNightPoiSkinConfig.ts
- Presets for visual appearance (colors, sizes, animations)
- Default preset: minimal_frontier_daynight_poi

### 6.2 POI Family Membership

**The Day/Night Cycle System belongs to the POI family of world-state indicators** and must follow the same visual grammar, halo conventions, and identity expectations as other POI components.

**Required Visual Elements:**
1. Progress Halo: Circular progress indicator showing 0-1 progress
2. Phase Icon: Sun (day), Moon (night), or Pause bars (paused)
3. Color Coding: Gold/amber for day, Purple/indigo for night, Gray for paused
4. Bloom Effect: Subtle glow with configurable intensity
5. Decorative Marks: 8 position markers at cardinal and intercardinal points

### 6.3 Integration Rules

**With Minimal Gameplay Store:**
- Must use useMinimalGameplayWithIdleVillageConfig() hook
- Must read state.isDayPhase, state.cycleProgress, state.isPaused
- Must call pauseGame()/resumeGame() for user interactions
- Must listen to store updates for reactive rendering

**With Style Laboratory:**
- Must use useSkinPreferences() for preset selection
- Must resolve preset via resolveDayNightPoiPresetId()
- Must apply visual tokens from getDayNightPoiSkinForPreset()

**With Telemetry System:**
- Must emit day_night_transition events on phase changes
- Must include fromPhase, toPhase, day, cycleProgress in payload
- Must emit pause/resume events with current state context

---

## 7. Test Cases

### StatusHUD Rendering (12)
- StatusHUD renders with Day/Night Cycle
- StatusHUD renders with Speed Controls (1x, 2x, 3x, 5x, stop)
- StatusHUD renders with POI Day/Night (embedded)
- StatusHUD renders with ResourceTracker
- StatusHUD renders with Day Counter
- StatusHUD renders in day phase
- StatusHUD renders in night phase
- StatusHUD renders in paused state
- StatusHUD applies wilderness pillar skin
- StatusHUD uses Style Laboratory tokens
- StatusHUD reads from useMinimalGameplay store
- StatusHUD is read-only (no freezing)

### Day/Night POI Visuals (12)
- Day/Night POI renders with Progress Halo
- Day/Night POI renders with Phase Icon (sun/moon/pause)
- Day/Night POI renders with Color Coding (gold/amber for day)
- Day/Night POI renders with Color Coding (purple/indigo for night)
- Day/Night POI renders with Color Coding (gray for paused)
- Day/Night POI renders with Bloom Effect
- Day/Night POI renders with Decorative Marks (8 position markers)
- Day/Night POI shows correct phase (day/night) from store
- Day/Night POI shows correct progress (0-1) from store
- Day/Night POI shows pause icon when paused
- Day/Night POI transitions smoothly (220ms) between phases
- Day/Night POI maintains POI family visual grammar

### Speed Controls (12)
- Speed controls render with 1x button
- Speed controls render with 2x button
- Speed controls render with 3x button
- Speed controls render with 5x button
- Speed controls render with stop button
- Speed controls highlight current speed (1x)
- Speed controls highlight current speed (2x)
- Speed controls highlight current speed (3x)
- Speed controls highlight current speed (5x)
- Speed controls highlight current speed (stop)
- Speed controls disabled during activity in-progress
- Speed controls re-enabled when activity completes
- Speed controls change TimeEngine speed multiplier

### ResourceTracker (12)
- ResourceTracker renders with all resources
- ResourceTracker renders with wood resource
- ResourceTracker renders with metal resource
- ResourceTracker renders with gold resource
- ResourceTracker renders with experience resource
- ResourceTracker shows correct resource values
- ResourceTracker updates with small animation on gain
- ResourceTracker shows scale increase (1.05x) on update
- ResourceTracker shows color flash on resource gain
- ResourceTracker shows no animation on resource loss
- ResourceTracker updates only when day changes
- ResourceTracker uses non-invasive animation

### Sync with TimeEngine (12)
- StatusHUD syncs with TimeEngine temporal state
- StatusHUD reads day from TimeEngine
- StatusHUD reads speed from TimeEngine
- StatusHUD calculates phase based on currentTick
- StatusHUD calculates progress based on dayNightCycle config
- StatusHUD updates only when day changes (not every tick)
- StatusHUD maintains sync during drag operations
- StatusHUD maintains sync during activity in-progress
- StatusHUD maintains sync during pause/resume
- StatusHUD maintains sync during speed change
- StatusHUD maintains sync during phase transition
- StatusHUD maintains sync with useMinimalGameplay store

### Integration with useMinimalGameplay (12)
- StatusHUD uses useMinimalGameplayWithIdleVillageConfig() hook
- StatusHUD reads state.isDayPhase from store
- StatusHUD reads state.cycleProgress from store
- StatusHUD reads state.isPaused from store
- StatusHUD reads state.currentTick from store
- StatusHUD calls pauseGame() on pause
- StatusHUD calls resumeGame() on resume
- StatusHUD listens to store updates for reactive rendering
- StatusHUD emits telemetry events on phase transitions
- StatusHUD emits telemetry events on pause/resume
- StatusHUD includes fromPhase, toPhase, day, cycleProgress in payload
- StatusHUD maintains store integration consistency

### Visual Consistency (8)
- StatusHUD maintains POI family visual grammar
- StatusHUD uses Style Laboratory tokens for styling
- StatusHUD applies wilderness pillar skin correctly
- StatusHUD applies empire pillar skin correctly
- StatusHUD maintains color coding consistency
- StatusHUD maintains halo conventions
- StatusHUD maintains identity patterns
- StatusHUD maintains progress indicator consistency

### Edge Cases (12)
- StatusHUD with zero resources
- StatusHUD with infinite speed
- StatusHUD with paused state
- StatusHUD during day/night transition
- StatusHUD during speed change
- StatusHUD during resource overflow
- StatusHUD during resource underflow
- StatusHUD during drag operation
- StatusHUD during activity in-progress
- StatusHUD during pause/resume
- StatusHUD with missing store data
- StatusHUD with missing config data

---

**Total Test Cases:** 104  
**Estimated Test Duration:** 12-15 minutes

---

## 8. Related Documentation

- [Phase 2: Roster Specification](./02_roster_pgtoken.md) - Roster container component
- [Phase 3: SlotRack Specification](./03_slotRack.md) - SlotRack container component
- [Phase 4: Drag Interactions](./04_drag_interactions.md) - Drag interactions specification
- [Phase 5: Activity + Timer](./05_activity_timer.md) - Activity + Timer specification
- [Day/Night Trusted Contract](../idle_village/trusted/daynight_trusted.md) - Day/Night Cycle System trusted contract
- [Time Engine Trusted](../idle_village/trusted/time_engine_trusted.md) - Time Engine trusted contract
- [Card System Description](../idle_village/card_system_description.md) - Complete card system architecture
- [Vertical Slice Entities](../../context/VERTICAL_SLICE_ENTITIES_FULL.md) - Complete entity inventory

---

## 9. Questions?

- **About day/night cycle:** See §6 for Day/Night Cycle System details
- **About sync:** See §4.1 for sync with TimeEngine
- **About resources:** See §4.3 for ResourceTracker integration
- **About visual consistency:** See §7 for visual consistency tests
- **About test strategy:** See §7 for test cases
- **About a decision:** See `context/DECISION_LOG.md`

**Still stuck?** Ask in the chat.

---

**Last updated:** 2026-05-21  
**Next review:** After Phase 6 completion
