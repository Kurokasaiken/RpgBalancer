---
title: Character-to-Resident Canonical Architecture
status: trusted
owner: Idle Village Team
last_reviewed: 2026-07-22
domain: core
description: "Canonical Character -> Resident conversion and consumption patterns"
---

# Character-to-Resident Canonical Architecture

## Overview

This document defines the single source of truth for converting Character entities to Resident projections in Idle Village. All pages and components must follow this canonical pattern.

## A. Canonical Source-of-Truth Model

### Primary Entity: Character
- **Domain Layer**: Combat/domain entities represent the authoritative source
- **Scope**: Heroes, enemies, monsters, NPCs - all game entities  
- **Properties**: Full combat stats, behaviors, visual profiles, persistence
- **Storage**: Character storage system (localStorage, async PersistenceService)

### Projection: Resident
- **Domain Layer**: Village-specific projection of Character data
- **Scope**: Village gameplay representation only
- **Properties**: Subset of Character data relevant to village activities
- **Relationship**: Resident = Character → Village projection transformation

### Source Hierarchy
1. **Character Storage** (primary source)
2. **Character → Resident Conversion** (single canonical path)
3. **Village Resident Store** (secondary source, derived)
4. **Page Consumption** (read-only, no transformation)

## B. Canonical Runtime Implementation

### 1. Character Storage/Source
```
Character Storage (async PersistenceService)
├── Combat characters (heroes, enemies)
├── Visual profiles
├── Stat blocks
└── Persistence events
```

**File**: `src/engine/idle/characterStorage.ts`
- **Functions**: `loadCharacters()`, `saveCharacters()`
- **Storage Key**: `character-data`
- **Persistence**: PersistenceService with error handling

### 2. Single Character → Resident Bootstrap/Conversion
```
Character → Resident Pipeline
├── Single conversion function
├── Configurable mapping rules
├── Village-specific property filtering
└── Validation & error handling
```

**File**: `src/engine/game/idleVillage/CharacterToResidentBootstrap.ts`
- **Primary Function**: `bootstrapResidentsFromCharacters()`
- **Legacy Wrapper**: `loadResidentsFromCharacterManager()` (deprecated)
- **Conversion Function**: `savedCharacterToResident()` in `characterImport.ts`

### 3. Village-Side Resident Source/Store
```
Village Resident Store
├── Derived from Character conversion via canonical bootstrap
├── Village-specific state (fatigue, activities)
├── Single source of truth for pages
├── Zustand store with async persistence
└── Clean consumption API via useVillageResidents hook
```

**Files**:
- `src/ui/idleVillage/store/VillageResidentStore.ts` - Canonical village-side store (Zustand)
- `src/ui/idleVillage/hooks/useVillageResidents.ts` - React hook for store consumption
- `src/engine/game/idleVillage/VillageStateStore.ts` - Legacy village state management

### 4. Page Consumption Rules
```
Page Layer
├── Read-only access to Village Resident Store
├── No transformation logic
├── No fallback logic
└── Direct consumption of canonical data
```

**Verified Implementations**:
- `src/ui/idleVillage/TestRosterPage.tsx` - Uses `useVillageResidents()` hook → canonical Village Resident Store
- `src/ui/idleVillage/MinimalGameplayPage.tsx` - Uses `useVillageResidents()` hook → canonical Village Resident Store

CR-005 (`Verify Both Surfaces Consume Same Canonical Source`) confirmed both pages read from the same `VillageResidentStore` instance. Verification artifacts:
- `src/ui/idleVillage/verification/StoreConsistencyChecker.ts` - store reference identity, data/behavior/telemetry consistency checks
- `tests/integration/idleVillage/CanonicalStoreVerification.test.tsx` - 25 tests covering data, behavior, telemetry, error-handling, and complete report generation

**Legacy / Isolated Implementations** (not part of the canonical runtime path):
- `src/store/useMinimalGameplay.ts` - Uses `savedCharacterToResident()` for `TEST_ROSTER_HEROES` (legacy test fixture path, isolated from production pages)
- `src/pages/idle-village-config.tsx` - Uses `loadResidentsFromCharacterManager()` (legacy configuration page, isolated from production runtime)

## C. Forbidden Patterns

### Page-Level Transformations
- ❌ Page-specific Character → Resident conversion
- ❌ Page-level stat remapping
- ❌ Page-specific filtering logic
- ❌ Inline resident creation

### Multiple Competing Sources
- ❌ TEST_ROSTER_HEROES + MINIMAL_GAMEPLAY_RESIDENTS + localStorage
- ❌ Page-specific resident arrays
- ❌ Component-level resident fixtures
- ❌ Direct character storage access from pages

### Scattered Fallback Logic
- ❌ Fallback logic in multiple pages
- ❌ Component-level resident defaults
- ❌ Runtime source selection based on page context
- ❌ Conditional resident loading paths

### Test Fixture Leakage
- ❌ Test data in production runtime paths
- ❌ Development fixtures in page logic
- ❌ Hardcoded resident arrays in components

## D. Fallback Policy

### Where Fallback is Allowed
- **Character Storage Layer**: When character storage is empty/corrupted
- **Character → Resident Conversion**: When conversion fails
- **Village Resident Store**: When store initialization fails

### Where Fallback is Forbidden
- **Page Layer**: No page-level fallback logic
- **Component Layer**: No component-level resident defaults
- **Runtime Path**: No conditional source selection

### Fallback Implementation Rules
- Single fallback implementation in Character → Resident pipeline
- Fallback data must follow same Resident schema
- Fallback must be logged/telemetered
- Fallback must be temporary, not permanent state

**Implementation**: `CharacterToResidentBootstrap.ts` lines 101-122
```typescript
if (characters.length === 0) {
  if (enableFallback) {
    trackTelemetryEvent('character_to_resident_fallback_used', {
      reason: 'character_storage_empty',
      fallbackCount: FALLBACK_RESIDENTS.length,
      timestamp: Date.now(),
    });
    return {
      residents: FALLBACK_RESIDENTS,
      usedFallback: true,
      charactersConverted: 0,
    };
  }
}
```

## E. API Reference

### Primary Functions

#### `bootstrapResidentsFromCharacters(options)`
**Location**: `src/engine/game/idleVillage/CharacterToResidentBootstrap.ts`
**Purpose**: Canonical bootstrap function for Character → Resident conversion
**Parameters**:
- `config?: IdleVillageConfig` - Optional config for starting fatigue
- `enableFallback?: boolean` - Whether to use fallback residents (default: true)
- `startingFatigueOverride?: number` - Custom fatigue override
**Returns**: `BootstrapResidentsResult` with residents and metadata

#### `savedCharacterToResident(character, options)`
**Location**: `src/engine/game/idleVillage/characterImport.ts`
**Purpose**: Core conversion function for single Character → Resident transformation
**Parameters**:
- `character: SavedCharacter` - Source character entity
- `options?: SavedCharacterToResidentOptions` - Conversion options
**Returns**: `ResidentState` - Village-ready resident projection

### Legacy Functions

#### `loadResidentsFromCharacterManager(options)`
**Location**: `src/engine/game/idleVillage/CharacterToResidentBootstrap.ts`
**Status**: ⚠️ Deprecated - Use `bootstrapResidentsFromCharacters()` instead
**Purpose**: Legacy compatibility wrapper

## F. Integration Examples

### Page Integration (Correct)
```typescript
// ✅ CORRECT: Use canonical Village Resident Store
import { useVillageResidents } from '@/ui/idleVillage/hooks/useVillageResidents';

function MyPage() {
  const { residents, isLoading, error, usedFallback } = useVillageResidents();
  
  // Residents are automatically bootstrapped from canonical Character storage
  // No page-level conversion or fallback logic needed
}
```

### Store Integration (Correct)
```typescript
// ✅ CORRECT: Convert stored characters to residents
import { savedCharacterToResident } from '@/engine/game/idleVillage/characterImport';

const residents = TEST_ROSTER_HEROES.map(hero => 
  savedCharacterToResident(hero, { defaultFatigue: 0 })
);
```

### Page-Level Conversion (Forbidden)
```typescript
// ❌ WRONG: Inline conversion logic
function MyPage() {
  const [residents, setResidents] = useState([]);
  
  // Don't do this!
  const converted = characters.map(char => ({
    id: char.id,
    name: char.name,
    // ... manual conversion logic
  }));
}
```

## G. Telemetry Events

### Required Telemetry
All Character → Resident operations must emit telemetry events:

```typescript
// Success event
trackTelemetryEvent('character_to_resident_bootstrap_success', {
  characterCount: characters.length,
  residentCount: residents.length,
  defaultFatigue,
  timestamp: Date.now(),
});

// Fallback event
trackTelemetryEvent('character_to_resident_fallback_used', {
  reason: 'character_storage_empty',
  fallbackCount: FALLBACK_RESIDENTS.length,
  timestamp: Date.now(),
});

// Error event
trackTelemetryEvent('character_to_resident_bootstrap_error', {
  error: errorMessage,
  timestamp: Date.now(),
});
```

## H. Testing Guidelines

### Unit Testing
- Test `bootstrapResidentsFromCharacters()` with empty character storage
- Test `savedCharacterToResident()` with various character configurations
- Verify fallback behavior when character storage fails
- Test telemetry event emission

### Integration Testing
- Test page consumption of canonical resident sources
- Verify no page-level transformation logic exists
- Test error handling and recovery scenarios

### E2E Testing
- Verify complete Character → Resident flow in browser
- Test persistence and refresh scenarios
- Validate UI displays correct resident data

## I. Migration Compliance

This architecture has been verified and adopted in runtime:
- ✅ Single canonical conversion path implemented (CharacterToResidentBootstrap)
- ✅ Canonical Village Resident Store implemented (VillageResidentStore + useVillageResidents hook)
- ✅ Pages consume residents through canonical sources (/test, /minimal-gameplay verified)
- ✅ Fallback policy implemented and tested (FALLBACK_RESIDENTS in bootstrap)
- ✅ Telemetry events integrated (character_to_resident_* events)
- ✅ Competing resident sources removed from active pages (legacy paths isolated)
- ✅ Page-level conversion logic eliminated from production
- ✅ CR-005 completed 2026-07-15: both `/test` and `/minimal-gameplay` verified to consume the same canonical `VillageResidentStore` instance with identical data, behavior, and telemetry

## J. Governance

**Status**: trusted
**Last Certified**: 2026-07-15
**Certification Evidence**: CR-005 completed - canonical Village Resident Store verified in `/test` and `/minimal-gameplay` via `StoreConsistencyChecker` and `CanonicalStoreVerification.test.tsx`; competing paths removed from active pages
**Next Review**: 2026-08-22

---

*This document is part of the Idle Village trusted contracts collection. See COMPONENT_MASTER_INDEX for the complete list.*
