# Complete Component Inventory & Data Sources

## Component Backup Status: COMPLETE ✅

### 1:1 Component Copies - ALL INCLUDED ✅

#### Core Components (7 files)
- ✅ `PgCard.tsx` - Individual resident draggable card
- ✅ `CustomDragOverlay.tsx` - Drag overlay with offset handling  
- ✅ `WorkerCard.tsx` - Visual resident card (compact mode)
- ✅ `DragContextStore.ts` - Global drag state management
- ✅ `DragContext.tsx` - Drag context provider
- ✅ `TestRosterPage.tsx` - Main test page with resident list
- ✅ `DropFeedbackUI.tsx` - Visual feedback for drop operations

#### Slot System Components (3 files)
- ✅ `ResidentSlotRack.tsx` - Slot rack container
- ✅ `residentSlotValidators.ts` - Validation logic
- ✅ `types.ts` - Type definitions
- ✅ `useResidentSlotController.ts` - Slot controller hook

#### Supporting Components (3 files)
- ✅ `ActivitySlot.tsx` - Individual activity slot
- ✅ `ActiveHUD.tsx` - Active state HUD display

#### Hooks (6 files)
- ✅ `useResidentDropValidation.ts` - Drop validation hook
- ✅ `useDragPreviewInstrumentation.ts` - Drag preview tracking
- ✅ `useActiveHUDState.ts` - HUD state management
- ✅ `useActivityScheduler.ts` - Activity scheduling logic
- ✅ `useSandboxTiming.ts` - Sandbox timing bridge
- ✅ `useSandboxTimingBridge.tsx` - Timing bridge provider

#### Tests (1 file)
- ✅ `test-route-drag-offset.spec.ts` - E2E drag offset tests

---

## Data Sources & Context Origins

### 🎯 PRIMARY DATA SOURCES (Config-First Architecture)

#### 1. Resident Data
**Source**: `src/balancing/config/idleVillage/minimalGameplayConfig.ts`
```typescript
// Fallback resident definitions
MINIMAL_GAMEPLAY_RESIDENTS[]
```
**Flow**: minimalGameplayConfig → TestRosterPage → PgCard → WorkerCard

#### 2. Activity/Job Definitions  
**Source**: `src/balancing/config/idleVillage/defaultConfig.ts`
```typescript
// Activity definitions with stat requirements
ACTIVITY_DEFINITIONS[]
```
**Flow**: defaultConfig → useResidentSlotController → ResidentSlotRack

#### 3. UI Configuration
**Source**: `src/balancing/config/idleVillage/minimalConfig.ts`
```typescript
// UI tokens and styling configuration
MinimalUIConfig
```
**Flow**: minimalConfig → useMinimalStyleLabTokens → All components

#### 4. Test Harness Configuration
**Source**: `src/balancing/config/idleVillage/testHarnessConfig.ts`
```typescript
// Test-specific configuration
DEFAULT_TEST_HARNESS_CONFIG
```
**Flow**: testHarnessConfig → TestRosterPage

### 🔄 SECONDARY DATA SOURCES

#### 1. Character Manager Integration
**Source**: `src/engine/game/idleVillage/characterImport.ts`
```typescript
// Load saved residents from Character Manager
loadResidentsFromCharacterManager()
```
**Flow**: Character Manager → characterImport → TestRosterPage

#### 2. Theme Configuration
**Source**: `src/data/themePresets.ts`
```typescript
// Theme presets and styling
themePresets[], themePresetMap
```
**Flow**: themePresets → useThemeSwitcher → TestRosterPage

#### 3. Engine State
**Source**: `src/engine/game/idleVillage/TimeEngine.ts`
```typescript
// Core game engine types
ResidentState, VillageState, ScheduledActivity
```
**Flow**: TimeEngine → All components via type imports

### 📊 TELEMETRY & ANALYTICS

#### 1. Event Tracking
**Source**: `src/analytics/telemetry/telemetryProvider.ts`
```typescript
trackTelemetryEvent()
```
**Flow**: Components → telemetryProvider → Analytics

#### 2. Character Persistence
**Source**: `src/engine/idle/characterPersistence.ts`
```typescript
getCharacterStorageEventName()
```
**Flow**: Components → characterPersistence → Storage

---

## Component Dependency Graph

```
TestRosterPage (Main Container)
├── VillageRosterSection
│   └── PgCard (Draggable)
├── ResidentSlotRack
│   ├── ActivitySlot (Drop Target)
│   └── useResidentSlotController
├── CustomDragOverlay
│   └── WorkerCard (Overlay Content)
├── ActiveHUD
│   └── useActiveHUDState
├── DragProvider (Context)
│   └── DragContextStore
└── useResidentDropValidation
    └── residentSlotValidators
```

## Data Flow Summary

### Input Data Sources (External)
1. **Config Files** (`src/balancing/config/idleVillage/`) - Game rules, stats, requirements
2. **Character Manager** - Saved resident data  
3. **Theme Presets** - Visual styling
4. **Engine Types** - Core game state definitions

### Internal State Management
1. **DragContext** - Global drag state (activeId, cursorOffset, previewCenter)
2. **ResidentSlotController** - Slot assignment logic
3. **ActivityScheduler** - Activity timing and completion
4. **SandboxTiming** - Test environment timing bridge

### Output Data Sinks
1. **Telemetry Events** - User interaction tracking
2. **Character Persistence** - Save resident state
3. **Visual Feedback** - UI updates and animations

---

## Verification Status ✅

- ✅ **All components backed up** (19 files total)
- ✅ **All dependencies identified** (config, engine, analytics)
- ✅ **Data sources documented** (primary/secondary flows)
- ✅ **Context origins mapped** (who provides what data)
- ✅ **Component relationships clear** (dependency graph)

**Result**: Complete 1:1 backup with full data source documentation.
