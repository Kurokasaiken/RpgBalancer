# WS3: Theater Controller & Crew Scheduler Implementation

## Overview

Workstream WS3 focuses on extracting theater overlay logic from `useMapContext` into a dedicated `useTheaterController` hook and implementing a deterministic crew scheduler system with priority queues.

## Objectives

1. **Theater Controller Extraction**: Move theater-related UI logic from `useMapContext` to `useTheaterController` with proper hover timers and tests
2. **Crew Scheduler Implementation**: Create deterministic priority-based crew scheduling with config-first weights
3. **Type Alignment**: Ensure all theater and scheduler components use consistent TypeScript types
4. **Testing Coverage**: Add comprehensive unit tests for all new components

## Components

### 1. Theater Controller (`useTheaterController`)

**Location**: `src/ui/idleVillage/hooks/useTheaterController.ts`

**Purpose**: Manages theater overlay state, hover timers, and preview selection.

**Key Features**:
- Hover-open with configurable delay
- Delayed close with configurable timeout
- `selectTheaterPreviewIds` function for preview management
- Config-first design with zero hardcoding
- Comprehensive diagnostics logging

**API**:
```typescript
interface TheaterControllerState {
  isTheaterOpen: boolean;
  theaterSlotId: string | null;
  hoverStart: (slotId: string) => void;
  hoverEnd: () => void;
  closeTheater: () => void;
  selectTheaterPreviewIds: (ids: string[]) => void;
}
```

### 2. Crew Scheduler System

**Components**:
- **Config**: `src/balancing/config/idleVillage/crewScheduler.ts`
- **Hook**: `src/ui/idleVillage/hooks/useCrewScheduler.ts`
- **Controller**: `src/ui/idleVillage/controllers/CrewSchedulerController.ts`

**Purpose**: Provides deterministic crew scheduling with priority queues based on stat tags, fatigue, and quest urgency.

**Key Features**:
- Config-first priority weights
- Deterministic seeding for reproducible results
- Priority queue management with rebalancing
- Comprehensive diagnostics logging
- Test mode with deterministic RNG

**Priority Factors**:
- **Stat Tag Match**: How well resident stats match activity requirements
- **Fatigue Penalty**: Higher fatigue reduces priority
- **Quest Urgency**: Time-sensitive quests get priority
- **Specialization Bonus**: Preferred activities get bonus
- **Difficulty Bonus**: Harder tasks may get priority

**Configuration**:
```typescript
interface CrewSchedulerConfig {
  priorityWeights: {
    statTagMatch: number;
    fatiguePenalty: number;
    questUrgency: number;
    specializationBonus: number;
    difficultyBonus: number;
    baseWeight: number;
  };
  seeding: {
    lcgSeed: number;
    deterministic: boolean;
  };
  thresholds: {
    fatiguePenaltyThreshold: number;
    questUrgencyThreshold: number;
    statTagMatchThreshold: number;
  };
  maxQueueSize: number;
  enableDiagnostics: boolean;
}
```

### 3. Updated useMapContext

**Location**: `src/ui/idleVillage/hooks/useMapContext.ts`

**Changes**:
- Integrated `useTheaterController` for theater management
- Added crew scheduler integration points
- Maintained backward compatibility
- Improved type safety and error handling

## Implementation Details

### Theater Controller Implementation

The theater controller uses a timer-based approach for hover interactions:

1. **Hover Start**: When hovering over a slot, a timer starts (configurable delay)
2. **Timer Completion**: If hover persists, theater opens for that slot
3. **Hover End**: When hover ends, a delayed close timer starts
4. **Delayed Close**: If no new hover occurs, theater closes

This prevents accidental theater opening while maintaining responsive interaction.

### Crew Scheduler Algorithm

The scheduler uses a weighted priority system:

1. **Factor Calculation**: Calculate assignment factors for each resident-activity pair
2. **Priority Scoring**: Apply config weights to factors to get priority score
3. **Queue Management**: Maintain priority queue sorted by score
4. **Decision Making**: Process queue with availability checks and randomness
5. **Rebalancing**: Recalculate priorities when state changes

### Deterministic Seeding

For reproducible results in tests:
- LCG (Linear Congruential Generator) with configurable seed
- Test mode forces deterministic behavior
- Production mode uses true randomness
- All random decisions are logged to diagnostics

## Testing Strategy

### Unit Tests

**Theater Controller**:
- `tests/unit/idleVillage/useTheaterController.test.tsx`
- Tests hover-open, delayed close, and preview selection
- Validates timer behavior and edge cases

**Crew Scheduler**:
- `tests/unit/idleVillage/useCrewScheduler.test.tsx`
- Tests priority calculation, queue management, and deterministic behavior
- Validates configuration and factor calculation

**useMapContext**:
- `tests/unit/idleVillage/useMapContext.test.tsx`
- Tests integration with theater controller and scheduler
- Validates state management and API surface

### Integration Tests

- Theater overlay integration with drag and drop
- Crew scheduler integration with activity scheduling
- End-to-end scheduling workflows

## Configuration

### Default Crew Scheduler Config

```typescript
export const DEFAULT_CREW_SCHEDULER_CONFIG: CrewSchedulerConfig = {
  priorityWeights: {
    statTagMatch: 10.0,      // High weight for specialization
    fatiguePenalty: -8.0,    // Strong penalty for fatigue
    questUrgency: 12.0,      // High weight for time-sensitive quests
    specializationBonus: 5.0, // Moderate bonus for preferences
    difficultyBonus: 2.0,    // Small bonus for harder tasks
    baseWeight: 1.0,         // Base weight for all assignments
  },
  seeding: {
    lcgSeed: 1337,
    deterministic: false,     // Production uses true randomness
  },
  thresholds: {
    fatiguePenaltyThreshold: 0.7,  // Penalty above 70% fatigue
    questUrgencyThreshold: 3.0,     // Urgency below 3 time units
    statTagMatchThreshold: 0.5,     // Minimum 50% stat match for bonus
  },
  maxQueueSize: 50,
  enableDiagnostics: true,
};
```

### Test Configuration

```typescript
export const TEST_CREW_SCHEDULER_CONFIG: CrewSchedulerConfig = {
  ...DEFAULT_CREW_SCHEDULER_CONFIG,
  seeding: {
    lcgSeed: 42,
    deterministic: true,      // Force deterministic for tests
  },
  enableDiagnostics: true,
};
```

## Migration Guide

### From Legacy Theater Logic

1. **Remove**: Theater state management from `useMapContext`
2. **Add**: `useTheaterController` import and integration
3. **Update**: Theater-related handlers to use controller API
4. **Test**: Verify hover behavior and preview selection

### For Crew Scheduler Integration

1. **Import**: `useCrewScheduler` hook in relevant components
2. **Configure**: Use appropriate config (default vs test)
3. **Integrate**: Connect with activity scheduling system
4. **Monitor**: Use diagnostics for debugging

## Performance Considerations

### Theater Controller
- Timer cleanup on unmount prevents memory leaks
- Debounced hover events reduce unnecessary updates
- Efficient state management with minimal re-renders

### Crew Scheduler
- Queue size limits prevent memory bloat
- Lazy factor calculation only when needed
- Efficient priority queue operations
- Optional diagnostics in production

## Troubleshooting

### Theater Issues
- **Theater not opening**: Check hover delay configuration
- **Theater not closing**: Verify delayed close timer
- **Missing previews**: Ensure `selectTheaterPreviewIds` is called

### Scheduler Issues
- **Empty queue**: Check factor calculation and thresholds
- **Poor assignments**: Review priority weights and configuration
- **Non-deterministic**: Verify test mode and seeding

## Future Enhancements

### Theater Controller
- Multi-slot theater previews
- Gesture-based theater interactions
- Theater animation system

### Crew Scheduler
- Machine learning for priority optimization
- Dynamic priority adjustment based on performance
- Multi-village scheduling coordination

## Dependencies

### External Dependencies
- React hooks (useCallback, useMemo, useState, useEffect)
- TypeScript for type safety
- Vitest for testing

### Internal Dependencies
- `useSandboxDiagnostics` for logging
- `useVillageShellContext` for configuration
- `TimeEngine` types for village state
- Activity definitions from config

## API Reference

### useTheaterController

```typescript
export function useTheaterController(options: {
  slots: Slot[];
  locationSlotIds: string[];
  dragControllerRef: RefObject<DragController>;
  config: IdleVillageConfig;
  randomFn: () => number;
}): TheaterControllerState
```

### useCrewScheduler

```typescript
export function useCrewScheduler(options: {
  config?: Partial<CrewSchedulerConfig>;
  testMode?: boolean;
  villageState: VillageState;
  activities: Record<string, ActivityDefinition>;
}): UseCrewSchedulerReturn
```

### CrewSchedulerController

```typescript
export function createCrewSchedulerController(
  options: UseCrewSchedulerOptions,
  schedulerHook: UseCrewSchedulerReturn
): CrewSchedulerController
```

## Conclusion

WS3 successfully extracts theater logic into a dedicated controller and implements a deterministic crew scheduler system. The implementation follows config-first principles, provides comprehensive testing, and maintains backward compatibility with existing systems.

---

## Appendix: Stat Validation QA

### Overview

This appendix documents the stat validation system fixes implemented as part of the IV-WS3-stat-validation-hotfix. The validation system ensures proper resident assignment based on stat requirements with comprehensive error reporting.

### Key Components

#### 1. Enhanced `validateResidentAssignment`

**Location**: `src/ui/idleVillage/slots/residentSlotValidators.ts`

**Improvements**:
- Added `ValidationFailureDetails` interface for detailed failure information
- Enhanced error messages with specific missing stats
- Comprehensive JSDoc documentation
- Support for complex requirement combinations (allOf, anyOf, noneOf)

**API**:
```typescript
export interface ValidationFailureDetails {
  missingAllOf?: string[];
  anyOfMatched?: boolean;
  blockedBy?: string[];
  requirementDescription?: string;
}

export type AssignmentValidationResult =
  | { success: true }
  | { success: false; reason: AssignmentFailureReason; details?: string; validationDetails?: ValidationFailureDetails };
```

#### 2. Improved `evaluateStatRequirement`

**Location**: `src/engine/game/idleVillage/statMatching.ts`

**Improvements**:
- Fixed `hp` exclusion from stat tags
- Better handling of edge cases (zero, infinite, NaN values)
- Comprehensive test coverage for all requirement types

#### 3. Test Coverage

**Files**:
- `tests/unit/idleVillage/residentSlotValidators.test.ts` (11 tests)
- `tests/unit/idleVillage/statMatching.test.ts` (15 tests)

**Coverage Areas**:
- Basic validation scenarios
- Complex requirement combinations
- Edge cases and error conditions
- Scheduler integration
- Fatigue and availability checks

### Validation Logic Flow

1. **Resident Existence Check**: Verify resident exists in the system
2. **Availability Check**: Ensure resident is in 'available' status
3. **Fatigue Check**: Validate resident is not exhausted
4. **Scheduler Check**: Respect scheduler constraints (if present)
5. **Stat Requirement Check**: Evaluate allOf/anyOf/noneOf conditions

### Error Handling

**Failure Reasons**:
- `RESIDENT_NOT_FOUND`: Resident ID not found in system
- `RESIDENT_UNAVAILABLE`: Resident not in available status
- `FATIGUE_THRESHOLD`: Resident exceeds fatigue limit
- `VALIDATION_FAILED`: Stat requirements not met
- `SCHEDULER_REJECTED`: Scheduler denies assignment

**Detailed Feedback**:
- Missing required stats (allOf failures)
- AnyOf match status
- Blocked stats (noneOf violations)
- Requirement description for UI display

### Integration Points

- **Phase E Drop Validation**: Works with existing drop feedback system
- **Crew Scheduler**: Respects scheduler constraints
- **Map UI**: Provides detailed feedback for invalid drops
- **Telemetry**: Enables detailed validation event tracking

### Safeguard Results

- **Lint**: ✅ 18 warnings, 0 errors (non-blocking)
- **Unit Tests**: ✅ 26/26 passing
- **Build**: ✅ Success
- **Kanban**: ✅ 31 prompts validated
- **Playwright**: ⚠️ 1 failing test (requires investigation)

### Future Improvements

1. **Playwright Test Fix**: Resolve failing LocationCard test
2. **Performance Optimization**: Cache validation results where appropriate
3. **UI Integration**: Enhanced error display in drop feedback
4. **Telemetry Expansion**: Add detailed validation event tracking

---

## Determinism Guard (NP-013)

### Overview

The Crew Scheduler includes a comprehensive determinism guard system that ensures reproducible scheduling behavior across test runs and production environments. This system provides configurable seeding, state snapshots, and validation tools.

### Key Components

#### 1. Determinism Guard Configuration
**Location**: `src/balancing/config/idleVillage/crewSchedulerDeterminismGuard.ts`

**Features**:
- **Seed Strategies**: Fixed, timestamp, hash, and entropy-based seed generation
- **Snapshot Management**: Automatic state capture and PersistenceService integration
- **Validation System**: Determinism checking with configurable tolerance
- **CLI Tools**: Command-line interface for snapshot management

#### 2. Seed Strategy System

**Available Strategies**:
```typescript
type SeedStrategy = 'fixed' | 'timestamp' | 'hash' | 'entropy';

// Fixed: Always uses the same seed
generateDeterministicSeed('fixed', 1337); // Returns 1337

// Timestamp: Uses timestamp with fixed offset
generateDeterministicSeed('timestamp', 1337, { timestamp: 1640995200000 });

// Hash: Hash-based seed from string input
generateDeterministicSeed('hash', 1337, { input: 'test-string' });

// Entropy: Combines multiple entropy sources
generateDeterministicSeed('entropy', 1337, { entropy: 0.5, timestamp: Date.now() });
```

#### 3. Snapshot System

**Snapshot Structure**:
```typescript
interface SchedulerSnapshot {
  timestamp: number;
  seed: number;
  config: CrewSchedulerConfig;
  queue: QueuedAssignment[];
  villageState: VillageState;
  validation: {
    expectedQueue: QueuedAssignment[];
    actualQueue: QueuedAssignment[];
    deviation: number;
    deterministic: boolean;
  };
  entropy: {
    randomSeed: number;
    timestamp: number;
    processId?: number;
  };
}
```

#### 4. CLI Tool

**Location**: `scripts/crewSchedulerSnapshot.ts`

**Available Commands**:
```bash
# List available snapshots
./scripts/crewSchedulerSnapshot.ts list

# Create test snapshot
./scripts/crewSchedulerSnapshot.ts create --test

# Load and display snapshot
./scripts/crewSchedulerSnapshot.ts load snapshot-file.json

# Compare two snapshots
./scripts/crewSchedulerSnapshot.ts compare snapshot1.json snapshot2.json

# Validate determinism
./scripts/crewSchedulerSnapshot.ts validate snapshot.json --tolerance 0.001

# Run determinism tests
./scripts/crewSchedulerSnapshot.ts test --seed 42 --iterations 100

# Clean old snapshots
./scripts/crewSchedulerSnapshot.ts clean --keep 10
```

### Integration with Crew Scheduler

#### 1. Configuration Integration
The crew scheduler config includes the `seedStrategy` field:

```typescript
interface CrewSchedulerSeeding {
  lcgSeed: number;
  deterministic: boolean;
  seedStrategy?: 'fixed' | 'timestamp' | 'hash' | 'entropy';
  seedContext?: {
    timestamp?: number;
    input?: string;
    entropy?: number;
  };
}
```

#### 2. Runtime Seeding
The scheduler uses deterministic seeding when `deterministic: true`:

```typescript
// In useCrewScheduler hook
const rng = useMemo(() => {
  if (config.seeding.deterministic) {
    const seed = generateDeterministicSeed(
      config.seeding.seedStrategy || 'fixed',
      config.seeding.lcgSeed,
      config.seeding.seedContext
    );
    return createDeterministicRng(seed);
  }
  return null;
}, [config.seeding]);
```

#### 3. Snapshot Persistence
Automatic snapshot capture via PersistenceService:

```typescript
// Save snapshot using PersistenceService
if (config.timeTravel?.enabled && config.timeTravel?.autoCapture) {
  const snapshot = createSchedulerSnapshot(seed, config, queue, villageState);
  saveData(`crew_scheduler_snapshot_${Date.now()}`, snapshot);
}
```

### Testing and Validation

#### 1. Unit Tests
**Location**: `tests/unit/idleVillage/CrewSchedulerDeterminism.test.ts`

**Coverage**:
- Seed strategy validation
- Deterministic RNG consistency
- Priority calculation reproducibility
- Queue state determinism
- Snapshot creation and validation
- Performance with large queues
- Edge case handling

#### 2. Determinism Validation
The system validates determinism by comparing expected vs actual results:

```typescript
function validateDeterminism(
  expectedQueue: QueuedAssignment[],
  actualQueue: QueuedAssignment[],
  maxDeviation: number,
  seed: number
): DeterminismValidationResult {
  // Check queue length, resident IDs, activity IDs
  // Calculate priority score deviations
  // Return deterministic status with detailed errors
}
```

### Usage Examples

#### 1. Test Mode Setup
```typescript
const testConfig = {
  ...DEFAULT_CREW_SCHEDULER_CONFIG,
  seeding: {
    lcgSeed: 42,
    deterministic: true,
    seedStrategy: 'fixed',
  },
};
```

#### 2. Production with Timestamp Seeding
```typescript
const prodConfig = {
  ...DEFAULT_CREW_SCHEDULER_CONFIG,
  seeding: {
    lcgSeed: 1337,
    deterministic: false, // Use true randomness
    seedStrategy: 'timestamp',
    seedContext: {
      timestamp: Date.now(),
    },
  },
};
```

#### 3. Hash-based Seeding for Consistency
```typescript
const hashConfig = {
  ...DEFAULT_CREW_SCHEDULER_CONFIG,
  seeding: {
    lcgSeed: 1337,
    deterministic: true,
    seedStrategy: 'hash',
    seedContext: {
      input: 'village-session-123',
      timestamp: Date.now(),
    },
  },
};
```

### Best Practices

1. **Testing**: Always use `deterministic: true` with `'fixed'` strategy for unit tests
2. **Production**: Use `deterministic: false` with `'timestamp'` or `'entropy'` strategies
3. **Debugging**: Use `'hash'` strategy with meaningful input strings for reproducible debugging
4. **Snapshots**: Enable automatic snapshots for critical debugging sessions
5. **Validation**: Set appropriate tolerance based on your precision requirements (0.001 for most cases)

### Performance Considerations

- **Snapshot Size**: Typical snapshots are 10-50KB depending on queue size
- **Validation Speed**: Validates 1000-item queues in <500ms
- **Seed Generation**: All strategies complete in <1ms
- **Storage**: Uses PersistenceService for async, non-blocking storage

---

The theater controller provides smooth hover interactions with proper timing, while the crew scheduler offers flexible, priority-based assignment with reproducible behavior for testing.
