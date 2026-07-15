# Shared Roster Bundle

## Overview

The shared roster bundle provides a complete, canonical roster pipeline extracted from the working TestRosterPage implementation. This bundle ensures functional parity across all Idle Village pages by providing a single source of truth for roster functionality.

## Based On

- **Trusted Baseline**: `src/docs/docs/idle_village/trusted/roster_drag_trusted.md`
- **Source Implementation**: `src/ui/idleVillage/TestRosterPage.tsx`
- **Data Contract**: Canonical Character → Resident conversion pipeline

## Bundle Structure

```
src/ui/idleVillage/roster/
├── index.ts                 # Main bundle export
├── CanonicalRosterBundle.ts # Data layer and resident creation
└── README.md               # This documentation
```

## Components

### Data Layer

#### `CanonicalRosterBundle`

**Functions:**
- `canonicalResidentData(defaultFatigue: number): ResidentState[]` - Creates canonical resident data
- `useCanonicalRosterData(defaultFatigue: number): ResidentState[]` - Memoized hook for resident data
- `createResidentsById(residents: ResidentState[]): Record<string, ResidentState>` - Creates resident lookup
- `useCanonicalRosterBundle(defaultFatigue: number): CanonicalRosterBundle` - Complete bundle hook

**Data Flow:**
1. Uses `TEST_ROSTER_HEROES` from config (preferred, full SavedCharacter schema)
2. Falls back to `MINIMAL_GAMEPLAY_RESIDENTS` if no heroes available
3. Applies `savedCharacterToResident` conversion for data integrity
4. Resolves portrait URLs via `getResidentPortraitUrl`
5. Returns memoized `CanonicalRosterBundle` with `residents` and `residentsById`

### UI Components

#### `VillageRosterSection`
Main roster rendering component with drag & drop support.

#### `ResidentRosterPanel`
Panel component for roster display with filtering and sorting.

#### `ResidentSlotRack`
Slot rack component for resident assignment and activity management.

#### `WanderlustRosterCard`
Card component for individual resident display in Wanderlust style.

#### `MatericRosterComponent`
Alternative roster component with material design.

### Drag & Drop Components

#### `DragProvider`
Context provider for drag state management.

#### `useDragContext`
Hook to access drag state (activeId, setActiveId, dragPreviewCenter, etc.).

#### `CustomDragOverlay`
Drag overlay component for visual feedback during drag operations.

#### `FlightProxy`
Flight animation component for resident handoff animations.

## Usage Pattern

### Basic Usage

```typescript
import { useCanonicalRosterBundle, VillageRosterSection, DragProvider } from '@/ui/idleVillage/roster';

function MyPage() {
  const { residents, residentsById } = useCanonicalRosterBundle(0);
  
  return (
    <DragProvider>
      <VillageRosterSection
        residents={residents}
        residentsById={residentsById}
        // ... other props
      />
    </DragProvider>
  );
}
```

### Complete Setup with Drag & Drop

```typescript
import { 
  useCanonicalRosterBundle, 
  VillageRosterSection, 
  DragProvider,
  CustomDragOverlay,
  FlightProxy 
} from '@/ui/idleVillage/roster';
import { DndContext } from '@dnd-kit/core';

function MyPage() {
  const { residents, residentsById } = useCanonicalRosterBundle(0);
  const [dragVisualState, setDragVisualState] = useState({ mode: 'idle' });
  
  return (
    <DragProvider>
      <DndContext>
        <VillageRosterSection
          residents={residents}
          residentsById={residentsById}
          onDragStart={(residentId) => setDragVisualState({ mode: 'dragging', residentId })}
          // ... other props
        />
        <CustomDragOverlay
          residentsById={residentsById}
          dragVisualState={dragVisualState}
        />
        {dragVisualState.mode === 'flight' && (
          <FlightProxy
            residentId={dragVisualState.residentId}
            fromX={dragVisualState.fromX}
            fromY={dragVisualState.fromY}
            toX={dragVisualState.toX}
            toY={dragVisualState.toY}
            residentsById={residentsById}
            onComplete={handleFlightComplete}
          />
        )}
      </DndContext>
    </DragProvider>
  );
}
```

## Data Contract

### ResidentState

The bundle uses the canonical `ResidentState` interface from `TimeEngine`:

```typescript
interface ResidentState {
  id: string;
  displayName: string;
  status: 'available' | 'busy' | 'injured' | 'dead';
  fatigue: number;
  currentHp: number;
  maxHp: number;
  isHero: boolean;
  isInjured: boolean;
  statSnapshot: Record<string, number>;
  statTags: string[];
  portraitUrl?: string;
  survivalCount: number;
  survivalScore: number;
  statProfileId?: string;
  visualProfileId?: string;
}
```

### CanonicalRosterBundle

```typescript
interface CanonicalRosterBundle {
  residents: ResidentState[];
  residentsById: Record<string, ResidentState>;
}
```

## Provider Requirements

### Required Providers

The bundle requires these providers to be mounted in the component tree:

1. **DragProvider** - From `@/ui/idleVillage/components/DragContext`
2. **DndContext** - From `@dnd-kit/core`
3. **SkinSystemProvider** - From `@/ui/idleVillage/hooks/useSkinSystem` (optional but recommended)

### Provider Order

The canonical provider chain is:
```
SkinSystemProvider → DragProvider → DndContext → children
```

## Configuration

### Default Fatigue

The `useCanonicalRosterBundle` hook accepts a `defaultFatigue` parameter:

```typescript
const { residents, residentsById } = useCanonicalRosterBundle(0); // Full stamina
const { residents, residentsById } = useCanonicalRosterBundle(50); // 50% fatigue
```

### Portrait Resolution

Portrait URLs are automatically resolved via `getResidentPortraitUrl` based on:
- `visualProfileId` from character data
- Fallback to default portrait if not specified

## Integration Points

### With TestRosterPage

The bundle is extracted from TestRosterPage and maintains 100% functional parity:

```typescript
// TestRosterPage uses the same data pipeline
const { residents, residentsById } = useCanonicalRosterBundle(harnessStartingFatigue);
```

### With MinimalGameplayPage

MinimalGameplayPage should consume this bundle instead of maintaining separate resident logic:

```typescript
// Replace local resident creation with canonical bundle
import { useCanonicalRosterBundle } from '@/ui/idleVillage/roster';

const { residents, residentsById } = useCanonicalRosterBundle(0);
```

## Telemetry

The bundle components emit telemetry events via `trackTelemetryEvent`:

- `drag_assignment_start` - When drag begins
- `drag_assignment_complete` - When drag completes
- `resident_assign` - When resident is assigned to slot
- `resident_unassign` - When resident is removed from slot

## Testing

### Unit Tests

Test the bundle functions:

```typescript
import { canonicalResidentData, createResidentsById } from '@/ui/idleVillage/roster';

describe('CanonicalRosterBundle', () => {
  it('should create resident data with correct structure', () => {
    const residents = canonicalResidentData(0);
    expect(residents).toHaveLength(expectedCount);
    expect(residents[0]).toHaveProperty('id');
    expect(residents[0]).toHaveProperty('displayName');
  });
  
  it('should create residentsById lookup', () => {
    const residents = canonicalResidentData(0);
    const residentsById = createResidentsById(residents);
    expect(residentsById[residents[0].id]).toEqual(residents[0]);
  });
});
```

### Integration Tests

Test the complete bundle in a page context:

```typescript
import { render, screen } from '@testing-library/react';
import { useCanonicalRosterBundle, VillageRosterSection } from '@/ui/idleVillage/roster';

describe('Roster Bundle Integration', () => {
  it('should render roster with canonical data', () => {
    const TestComponent = () => {
      const { residents, residentsById } = useCanonicalRosterBundle(0);
      return <VillageRosterSection residents={residents} residentsById={residentsById} />;
    };
    
    render(<TestComponent />);
    expect(screen.getByTestId('roster-section')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Residents Not Appearing

1. Check that `TEST_ROSTER_HEROES` has data in config
2. Verify `savedCharacterToResident` conversion is working
3. Check console for conversion errors
4. Ensure `defaultFatigue` parameter is appropriate

### Drag & Drop Not Working

1. Verify `DragProvider` is mounted
2. Check `DndContext` is properly configured
3. Ensure `useDragContext` is being called
4. Check that `CustomDragOverlay` is receiving `dragVisualState`

### Portrait Images Missing

1. Verify `visualProfileId` is set on residents
2. Check `getResidentPortraitUrl` is resolving correctly
3. Ensure portrait assets exist in `public/assets/characters/`

## Migration Guide

### From Page-Specific Roster

**Before:**
```typescript
// Page-specific resident creation
const residents = MINIMAL_GAMEPLAY_RESIDENTS.map(/* custom logic */);
const residentsById = residents.reduce(/* custom logic */);
```

**After:**
```typescript
// Use canonical bundle
import { useCanonicalRosterBundle } from '@/ui/idleVillage/roster';
const { residents, residentsById } = useCanonicalRosterBundle(0);
```

### From Custom Drag Setup

**Before:**
```typescript
// Custom drag context setup
const [activeId, setActiveId] = useState(null);
// Custom drag overlay implementation
```

**After:**
```typescript
// Use bundle drag components
import { DragProvider, useDragContext, CustomDragOverlay } from '@/ui/idleVillage/roster';
const { activeId, setActiveId } = useDragContext();
```

## Future Enhancements

- Add sorting configuration options
- Support for custom resident filters
- Configurable drag behavior
- Additional drag animation presets
- Performance optimization for large rosters

## Related Documentation

- **Trusted Contract**: `src/docs/docs/idle_village/trusted/roster_drag_trusted.md`
- **Character → Resident Architecture**: Memory `cb108a44-2693-459c-bf75-26819198ad87`
- **Component Master Index**: `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`

## Version History

- **v1.0.0** - Initial bundle extraction from TestRosterPage
  - CanonicalRosterBundle data layer
  - Complete UI component exports
  - Drag & drop integration
  - Full documentation
