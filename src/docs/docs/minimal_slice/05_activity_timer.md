# Phase 5: Activity + Timer (POI Detail) — Entity Specification

**Phase:** 5 of 6
**Estimated Duration:** 2-3 days
**Entità:** ActivityCapsule + ActivityCapsuleDetail + TimeEngine
**Page Route:** `/minimal-activity`
**Test Page Requirement:** MUST use real project components (ActivityCapsule, ActivityCapsuleDetail, TimeEngine) with mock data
**Last Updated:** 2026-05-21

---

**Aligned with Master Plan:** See [MASTER_PLAN.md](../MASTER_PLAN.md) for separation of concerns (plans vs tasks)
**Aligned with Semantic Constraints:** See [context/RPG_PROJECT_CONTEXT.md](../../context/RPG_PROJECT_CONTEXT.md) for freezing semantics
**Aligned with Time Engine Contract:** See [time_engine_trusted.md](../idle_village/trusted/time_engine_trusted.md) for TimeEngine dual-layer architecture
**Aligned with POI Detail Contract:** See [poi_detail_trusted.md](../idle_village/trusted/poi_detail_trusted.md) for ActivityCapsuleDetail skin system
**Aligned with Roster-Slot Integration:** See [roster_slot_integration_spec.md](../idle_village/roster_slot_integration_spec.md) for complete drag-and-drop integration

---

## 1. Entity Overview

### 1.1 What are ActivityCapsule and ActivityCapsuleDetail?

**ActivityCapsule** is the compact POI representation that shows:
- Halo/progress bar (ActionHalo component)
- Bloom functions (if has free slots where pgToken can be dragged)
- Timer display (elapsed/remaining time)
- Activity label and metadata

**ActivityCapsuleDetail** is the expanded POI detail view that shows:
- Full activity information
- SlotRack with slots (ActivityCapsuleDetailSkinAware)
- Progress bar and timer
- CTA Collect button
- Reward information

**Architecture:**
```
ActivityCapsule (compact view)
  └─ ActionHalo (halo/progress bar)
  └─ Bloom indicator (if free slots)
  └─ Timer display

ActivityCapsuleDetail (expanded view)
  └─ ActivityCapsuleDetailSkinAware
      └─ SlotRack
          └─ ActivitySlot (slots with SlottedMedal)
      └─ Progress bar
      └─ Timer display
      └─ CTA Collect button
```

**In the codebase:**
- `ActivityCapsule.tsx` (1097 lines) - Compact POI representation with halo/progress bar
- `PoiDetailSkinWrapper.tsx` (510 lines) - Wrapper for POI detail with skin integration
- `ActivityCapsuleDetailSkinAware.tsx` - Expanded POI detail view
- `TimeEngine.ts` - Manages timer and progress tracking

**Visually rendered as:**
```
ActivityCapsule (compact)
┌─────────────┐
│ [Halo]      │ ← ActionHalo with progress
│ [Bloom]     │ ← Bloom indicator if free slots
│ [Label]     │ ← Activity name
│ [Timer]     │ ← Elapsed/remaining time
└─────────────┘

ActivityCapsuleDetail (expanded)
┌─────────────────────────┐
│ [POI Info]              │
│ [Progress Bar]          │
│ [Timer]                 │
│ [SlotRack]              │ ← Slots with SlottedMedal
│   [Slot0] [Slot1]       │
│ [CTA Collect]           │
└─────────────────────────┘
```

### 1.2 Key Components

| Component | Type | Path | Purpose |
|-----------|------|------|---------|
| **ActivityCapsule** | Compact POI | components/ActivityCapsule.tsx | Shows halo/progress bar, bloom, timer |
| **ActivityCapsuleDetail** | Expanded POI | skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware.tsx | Shows full activity info with slots |
| **PoiDetailSkinWrapper** | POI wrapper | components/PoiDetailSkinWrapper.tsx | Integrates POI skin with ActivityCapsuleDetail |
| **ActionHalo** | Halo/progress | map/actionCards/ActionHalo.tsx | Shows circular progress halo |
| **TimeEngine** | Timer engine | engine/game/idleVillage/TimeEngine.ts | Manages timer and progress tracking |
| **ActivitySlot** | Slot component | components/ActivitySlot.tsx | Individual slot in SlotRack |
| **SlottedMedal** | Medal visual | components/SlottedMedal.tsx | Shows assigned resident in slot |

### 1.3 Key Properties

| Property | Type | Source | Example |
|----------|------|--------|---------|
| `activityId` | `string` | ActivityDefinition | 'job-woodcutting' |
| `status` | `'idle' \| 'in-progress' \| 'completed' \| 'blocked'` | TimeEngine | 'in-progress' |
| `progressFraction` | `number` (0-1) | TimeEngine | 0.65 |
| `elapsedSeconds` | `number` | TimeEngine | 2340 |
| `totalDurationSeconds` | `number` | ActivityDefinition | 3600 |
| `remainingSeconds` | `number` | Computed | 1260 |
| `slots` | `ActivitySlotData[]` | ActivityDefinition | [{slotId, assignedWorkerName, isOccupied, isLocked}] |
| `maxSlots` | `number` | ActivityDefinition | 3 |
| `canCollect` | `boolean` | TimeEngine + flag | true |
| `supportsPartialResolution` | `boolean` | ActivityDefinition | true (for jobs) |
| `continuousJob` | `boolean` | ActivityDefinition | false |
| `isAuto` | `boolean` | ActivityDefinition | false |

**Source of truth:** TimeEngine for timer and progress, ActivityDefinition for metadata.

---

## 2. Visual Appearance & Rendering

### 2.1 ActivityCapsule Visuals

**Compact view:**
```
┌─────────────┐
│  ╭───╮      │ ← ActionHalo (circular progress)
│  │   │ 65%  │ ← Progress fraction
│  ╰───╮      │
│     ★       │ ← Bloom indicator (if free slots)
│  Taglia Legna│ ← Activity label
│  23:40      │ ← Timer (elapsed)
└─────────────┘
```

**States:**
| State | Visual | When |
|-------|--------|------|
| **Idle** | Empty halo, no progress | Activity not started |
| **In-progress** | Filled halo with progress, pulsing | Activity running |
| **Completed** | Full halo, CTA Collect button | Activity finished |
| **Blocked** | Red halo, no interaction | Activity blocked |

### 2.2 ActivityCapsuleDetail Visuals

**Expanded view:**
```
┌─────────────────────────┐
│ Bosco Sacro              │ ← Activity name
│ Punto di interesse       │ ← Subtitle
│ Raccogli risorse         │ ← Helper text
│ ━━━━━━━━━━━━━━ 65%      │ ← Progress bar
│ 23:40 / 60:00            │ ← Timer (elapsed / total)
│ ┌───┐ ┌───┐ ┌───┐       │ ← SlotRack
│ │ A │ │ B │ │   │       │ ← Slots with SlottedMedal
│ └───┘ └───┘ └───┘       │
│ Risorse + XP             │ ← Reward display
│ [COLLECT]                │ ← CTA Collect button
└─────────────────────────┘
```

**Slot states:**
| State | Visual | When |
|-------|--------|------|
| **Empty** | Empty slot with drop hint | No resident assigned |
| **Occupied** | SlottedMedal with portrait | Resident assigned |
| **Locked** | Locked slot icon | Slot not available |

### 2.3 Bloom Indicator

**Bloom functions:**
- Shows when ActivityCapsule has free slots
- Indicates pgToken can be dragged to this activity
- Visual: ★ star icon with glow effect
- Disabled when all slots occupied

---

## 3. Freezing Semantics (Quando sono congelato)

### 3.1 Freezing Rules

| Entity | When Frozen | Duration | Why |
|--------|----------|----------|-----|
| **ActivityCapsule** | During drag over | Drag duration | Prevents interaction during drag |
| **ActivityCapsule** | When activity is 'in-progress' | Until timer completes | Cannot cancel mid-activity |
| **ActivityCapsule** | When all slots occupied | Until slot freed | Cannot receive new assignment |
| **ActivityCapsuleDetail** | When activity is 'in-progress' | Until timer completes | Cannot cancel mid-activity |
| **ActivityCapsuleDetail** | When status is 'blocked' | Until unblocked | Cannot interact |
| **Slot** | When occupied | Until extraction or completion | Cannot receive new assignment |
| **CTA Collect** | When canCollect is false | Until canCollect is true | Cannot collect rewards |
| **TimeEngine** | Never | N/A | Continues ticking |

### 3.2 Freezing Implementation

**During activity in-progress:**
- ActivityCapsule shows 'in-progress' status
- Cannot be cancelled or modified
- Timer continues ticking
- Progress bar fills based on TimeEngine

**When all slots occupied:**
- Bloom indicator disabled
- Cannot receive new assignments via drag
- Existing assignments locked in place

**When activity completed:**
- Status changes to 'completed'
- CTA Collect button enabled
- Halo remains full
- Timer stops

**When activity blocked:**
- Status shows 'blocked'
- No interaction allowed
- Timer may pause or continue based on config

---

## 4. Cross-Entity Behavior (Come interagisco con...)

### 4.1 ActivityCapsule ↔ TimeEngine

**Timer tracking:**
- TimeEngine advances time and updates elapsedSeconds
- ActivityCapsule calculates remainingSeconds = totalDurationSeconds - elapsedSeconds
- Progress bar fills based on progressFraction = elapsedSeconds / totalDurationSeconds
- Timer display shows elapsed/remaining time in MM:SS format

**Progress bar:**
- Governed by TimeEngine to understand how much and when it fills or stops
- Progress bar fills linearly during activity
- Halo fills circularly around ActivityCapsule
- Pulsing effect when activity is in-progress

**Tick-based system (from idle_village_tick_fatigue_plan.md):**
- **Jobs**: Tendenzialmente per tick, supportano partial resolution
  - `supportsPartialResolution: true`
  - Rewards and fatigue distributed per tick
  - Partial completion semantics
- **Quests**: Tendenzialmente per completamento
  - `supportsPartialResolution: false` (default)
  - All-or-nothing payouts
  - Rewards granted only at completion

### 4.2 ActivityCapsule ↔ SlotRack

**Slot display:**
- ActivityCapsule (compact) does NOT show slots
- ActivityCapsuleDetail (expanded) shows SlotRack with slots
- Click on ActivityCapsule opens ActivityCapsuleDetail
- ActivityCapsuleDetail contains SlotRack with ActivitySlot components

**Slot assignment:**
- Slots receive assignments via drag-drop from Roster
- SlottedMedal shows assigned resident in slot (exactly the pgToken/medaglia being dragged)
- Slot states: empty, occupied, locked (locked is NOT a state, it's a property)

### 4.3 ActivityCapsule ↔ Roster

**Resident assignment:**
- When resident assigned to activity, Roster marks resident as locked
- Resident cannot be assigned to other activities
- Resident status changes from 'available' to 'busy'
- Resident fatigue updated based on activity type

**Bloom indicator:**
- ActivityCapsule shows bloom when has free slots
- Indicates pgToken can be dragged to this activity
- Disabled when all slots occupied

### 4.4 ActivityCapsule ↔ Drag System

**Drop validation:**
- ActivityCapsule validates drop via useResidentDropValidation
- Validates resident availability, fatigue threshold, stat requirements
- Shows valid/invalid state during drag
- Accepts only pgToken (medaglia) being dragged

**Bloom during drag:**
- Bloom indicator shows when activity can receive drop
- Visual feedback during drag over
- Disabled when validation fails or slots full

### 4.5 ActivityCapsuleDetail ↔ SlottedMedal

**Slot display:**
- ActivityCapsuleDetail shows SlottedMedal in occupied slots
- SlottedMedal shows exactly the pgToken (medaglia) being dragged
- Portrait, rarity ring, status icons displayed
- Extraction mechanism (press-and-hold 560ms)

---

## 5. Known Issues & Guard Layers (Cosa può andare storto)

### 5.1 Progress Tracking

**Problem:** Progress bar may not fill correctly if TimeEngine updates are delayed.

**Guard layer:** Progress bar uses progressFraction from TimeEngine, calculated as elapsedSeconds / totalDurationSeconds. Clamped to 0-1 range.

**Status:** Works correctly.

### 5.2 Collect Availability

**Problem:** canCollect flag may not be set correctly for all activity types.

**Guard layer:** canCollect is governed by a flag that determines this behavior. Info is for Tick instead of completion:
- Jobs: Tendenzialmente per tick, support partial resolution
- Quests: Tendenzialmente per completamento, all-or-nothing payouts

**Status:** Mi pare di si.

### 5.3 Drop Validation

**Problem:** Drop validation may not show exactly the pgToken being dragged.

**Guard layer:** Drop validation via useResidentDropValidation. Should show exactly the pgToken (medaglia) being dragged.

**Status:** Si, ma vorrei che fosse esattamente il pgToken che viene trascinato (la medaglia).

### 5.4 POI Skin

**Problem:** POI skin may not be applied correctly.

**Guard layer:** POI skin auto-detection based on activityId pattern ('slot-c-poi'). POI skin applied via PoiDetailSkinWrapper.

**Status:** Corretto.

### 5.5 Telemetry

**Problem:** Telemetry events may not be emitted correctly.

**Guard layer:** ActivityCapsule emits telemetry events for collect, slot click, render, etc. Configured via skinConfig.enableTelemetry.

**Status:** Non so.

---

## 6. Tick-Based System

### 6.1 Tick Definition

**From idle_village_tick_fatigue_plan.md:**
- 1 tick = 1 VillageTimeUnit for every system
- Ticks per day = dayLengthInTimeUnits / ticksPerDay
- Ticks per night = nightTimeUnits / ticksPerNight

### 6.2 Job vs Quest Behavior

**Jobs (tick-based):**
- `supportsPartialResolution: true`
- Rewards and fatigue distributed per tick
- Partial completion semantics
- `dailyFatigueCost` / ticksPerDay
- `dailyRewardProfile[*].amountPerDay / ticksPerDay`

**Quests (completion-based):**
- `supportsPartialResolution: false` (default)
- All-or-nothing payouts
- Rewards granted only at completion
- No partial progress tracking

### 6.3 Continuous Jobs

**Continuous assignment mode:**
- `continuousJob: true` or `supportsAutoRepeat: true`
- Residents remain bound indefinitely
- Producing during day ticks, resting at night
- Auto-reschedule on completion
- Enforce fatigue check + housing/slot availability

---

## 7. Test Cases

### ActivityCapsule Rendering (12)
- ActivityCapsule renders with halo
- ActivityCapsule renders with progress bar
- ActivityCapsule renders with timer display
- ActivityCapsule renders with activity label
- ActivityCapsule renders with bloom indicator when free slots
- ActivityCapsule hides bloom indicator when all slots occupied
- ActivityCapsule renders in idle status
- ActivityCapsule renders in in-progress status
- ActivityCapsule renders in completed status
- ActivityCapsule renders in blocked status
- ActivityCapsule applies POI skin for activityId starting with 'slot-c-poi'
- ActivityCapsule applies wilderness pillar skin

### ActivityCapsuleDetail Rendering (12)
- ActivityCapsuleDetail renders with POI info
- ActivityCapsuleDetail renders with progress bar
- ActivityCapsuleDetail renders with timer display
- ActivityCapsuleDetail renders with SlotRack
- ActivityCapsuleDetail renders with CTA Collect button
- ActivityCapsuleDetail renders with reward display
- ActivityCapsuleDetail renders in idle status
- ActivityCapsuleDetail renders in in-progress status
- ActivityCapsuleDetail renders in completed status
- ActivityCapsuleDetail renders in blocked status
- ActivityCapsuleDetail applies POI skin via PoiDetailSkinWrapper
- ActivityCapsuleDetail applies wilderness pillar skin

### Timer Tracking (12)
- Timer displays elapsed time in MM:SS format
- Timer displays remaining time in MM:SS format
- Timer updates during activity in-progress
- Timer stops when activity completed
- Timer pauses when activity blocked
- Progress bar fills based on progressFraction
- Progress bar fills linearly during activity
- Halo fills circularly around ActivityCapsule
- Halo pulsing effect when in-progress
- Halo remains full when completed
- Progress bar governed by TimeEngine
- Timer governed by TimeEngine

### Slot States (12)
- Slot renders in empty state
- Slot renders in occupied state with SlottedMedal
- Slot renders in locked state
- Slot shows drop hint when empty
- Slot shows assigned resident portrait when occupied
- Slot shows assigned resident initials when occupied (no portrait)
- Slot receives drop via drag from Roster
- Slot validates drop via useResidentDropValidation
- Slot shows valid state during drag
- Slot shows invalid state during drag
- Slot shows alpha 35% for invalid state
- Slot allows extraction via press-and-hold (560ms)

### Collect Availability (12)
- CTA Collect button enabled when canCollect is true
- CTA Collect button disabled when canCollect is false
- CTA Collect button enabled when status is 'completed'
- CTA Collect button disabled when status is 'in-progress'
- CTA Collect button disabled when status is 'blocked'
- CTA Collect button shows 'Collecting...' during collection
- CTA Collect button emits telemetry event on click
- Collect availability governed by flag for Tick vs completion
- Jobs support partial resolution (collect per tick)
- Quests support completion (collect at end)
- Continuous jobs auto-reschedule on completion
- Collect rewards persisted via PersistenceService

### Bloom Indicator (8)
- Bloom indicator shows when free slots available
- Bloom indicator hides when all slots occupied
- Bloom indicator shows during drag over
- Bloom indicator shows visual glow effect
- Bloom indicator indicates pgToken can be dragged
- Bloom indicator disabled when validation fails
- Bloom indicator disabled when slots full
- Bloom indicator updates when slot assignment changes

### Tick-Based System (12)
- Job with supportsPartialResolution distributes rewards per tick
- Job with supportsPartialResolution distributes fatigue per tick
- Quest without supportsPartialResolution grants rewards at completion
- Tick size derived from dayLengthInTimeUnits / ticksPerDay
- Night ticks restore fatigue per resident
- Continuous jobs auto-reschedule on completion
- Continuous jobs rest at night ticks
- Partial completion semantics for jobs
- All-or-nothing payouts for quests
- Tick events emitted for HUD feedback
- Fatigue clamped by slot modifiers
- Rewards accumulated into updatedResources

### POI Skin (8)
- POI skin auto-detects for activityId starting with 'slot-c-poi'
- POI skin applied via PoiDetailSkinWrapper
- POI skin uses wilderness pillar by default
- POI skin applies color tokens from skin config
- POI skin emits telemetry event when rendered
- POI skin validation errors logged
- POI skin fallback renders when skin not found
- POI skin CSS injected when amber skin used

### Interactions (12)
- Click on ActivityCapsule opens ActivityCapsuleDetail
- Click on CTA Collect triggers collect action
- Click on slot triggers slot click handler
- Hover on slot triggers slot hover handler
- Right-click on slot triggers extraction
- Drag over slot shows valid state
- Drag over slot shows invalid state
- Drop on slot assigns resident
- Drop validation checks resident availability
- Drop validation checks fatigue threshold
- Drop validation checks stat requirements
- Drop validation checks crew capacity

### Edge Cases (12)
- Activity with zero duration
- Activity with infinite duration
- Activity with zero slots
- Activity with all slots occupied
- Activity with no free slots
- Activity with no residents assigned
- Activity with all residents exhausted
- Activity with no rewards
- Activity with partial rewards
- Activity during day/night cycle
- Activity during fatigue recovery
- Activity during auto-repeat

---

**Total Test Cases:** 124  
**Estimated Test Duration:** 15-18 minutes

---

## 8. Related Documentation

- [Phase 2: Roster Specification](./02_roster_pgtoken.md) - Roster container component
- [Phase 3: SlotRack Specification](./03_slotRack.md) - SlotRack container component
- [Phase 4: Drag Interactions](./04_drag_interactions.md) - Drag interactions specification
- [Phase 6: StatusHUD](./06_status_hud.md) - StatusHUD component
- [Tick Fatigue Plan](../plans/idle_village_tick_fatigue_plan.md) - Tick-based system specification
- [Card System Description](../idle_village/card_system_description.md) - Complete card system architecture
- [Vertical Slice Entities](../../context/VERTICAL_SLICE_ENTITIES_FULL.md) - Complete entity inventory

---

## 9. Questions?

- **About tick-based system:** See §6 for tick-based job vs quest behavior
- **About partial resolution:** See §6.2 for job vs quest completion semantics
- **About continuous jobs:** See §6.3 for continuous assignment mode
- **About POI skin:** See §7 for POI skin auto-detection
- **About test strategy:** See §7 for test cases
- **About a decision:** See `context/DECISION_LOG.md`

**Still stuck?** Ask in the chat.

---

**Last updated:** 2026-05-21  
**Next review:** After Phase 5 completion
