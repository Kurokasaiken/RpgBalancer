# TimeEngine - Trusted Contract

## Metadata
- Status: `trusted`
- Area: `time`
- Canonical Name: TimeEngine - Core time & activity engine for Idle Village
- Primary Files:
  - `src/engine/game/idleVillage/TimeEngine.ts`
  - `src/engine/game/idleVillage/TimeEngine.unit.test.ts`
- Runtime/Test Pages:
  - `/minimal-gameplay`
  - `/test` (via useMinimalGameplay integration)
- Last Certified: `2026-08-15`
- Last Updated By: `Devin`
- Related Contracts:
  - `[COMPONENT_MASTER_INDEX.md](../COMPONENT_MASTER_INDEX.md)`

## 1. Purpose
TimeEngine is the pure domain module that provides the core time and activity simulation for the Idle Village meta-game. It handles resident scheduling, activity progression, resource management, fatigue systems, day/night cycles, and Trial of Fire mechanics. All domain values come from IdleVillageConfig following config-first philosophy.

## 2. Dual-Layer Time Architecture

### 2.1 Simulation Time Layer (Canonical)
**Purpose**: Pure domain simulation, deterministic state evolution
**Canonical State**: `VillageState.currentTime` (1:1 advancement)
**Characteristics**:
- **Source**: TimeEngine.advanceTime() always advances by 1 tick
- **Speed Multiplier**: FORBIDDEN - always 1:1 deterministic progression
- **Purpose**: Canonical simulation state, reproducible results
- **Domain**: Pure domain logic, no UI concerns

### 2.2 Gameplay/Store Time Layer (Player-Facing)
**Purpose**: Player pacing, pause/resume, speed control
**Canonical State**: `useMinimalGameplay state.currentTick`
**Characteristics**:
- **Source**: Integer ticks with speedMultiplier support
- **Speed Multiplier**: ALLOWED - for player pacing and game speed
- **Purpose**: Player-facing game state, save/load persistence
- **Domain**: Store layer, UI integration, player experience

### 2.3 UI-Facing Time Layer (Presentation)
**Purpose**: Visual display, animations, timer feedback
**Canonical State**: Derived from gameplay layer
**Characteristics**:
- **Source**: Speed-multiplied display time for user experience
- **Speed Multiplier**: APPLIED - only for visual presentation
- **Purpose**: Display consistency, responsive updates
- **Domain**: Visual layer, animations, user feedback

### 2.4 Configuration Source
**Global Source**: `IdleVillageConfig` - All domain values, formulas, and rules
**Non-authoritative Sources**: 
- Component props - presentation layer only
- Test fixtures - verification only

### 2.5 Layer Mapping & Conversion
```typescript
// Simulation -> Gameplay mapping
gameplayState.currentTick = Math.floor(simulationState.currentTime)

// Gameplay -> UI display
displayTime = gameplayState.currentTick * gameplayState.speedMultiplier
```

## 3. Canonical Runtime Contract

### Core Invariants

#### Simulation Layer Invariants
1. **Time Monotonicity**: `currentTime` never decreases and always advances forward
2. **Discrete Tick Model**: Time advances in integer `VillageTimeUnit` ticks - no fractional time
3. **Tick Atomicity**: Each tick processes all state changes atomically - no partial updates
4. **Resource Conservation**: Resource changes are always logged and traceable via events
5. **Resident Uniqueness**: Each resident ID maps to exactly one ResidentState
6. **Activity Atomicity**: Activities transition through strict state machine: pending -> running -> completed
7. **Fatigue Boundaries**: Resident fatigue is always clamped between 0 and maxFatigueBeforeExhausted
8. **Trial of Fire Determinism**: Death risk rolls use injected RNG, never Math.random()
9. **No Speed Multipliers**: Simulation time always advances 1:1 - no time compression or dilation
10. **No Local Timers**: All simulation timing derives from canonical `currentTime` - no independent clocks

#### Gameplay Layer Invariants
1. **Tick Integrity**: `currentTick` maintains integer consistency with simulation layer
2. **Speed Consistency**: `speedMultiplier` applies uniformly to all time-based displays
3. **Pause Atomicity**: Pause/resume affects all gameplay time uniformly
4. **Persistence Integrity**: Gameplay state persists and restores correctly
5. **UI Responsiveness**: UI updates reflect gameplay state changes promptly

#### UI Layer Invariants
1. **Display Consistency**: Visual time displays match gameplay layer state
2. **Animation Timing**: Animations respect speedMultiplier settings
3. **User Feedback**: Timer updates provide clear, accurate time information

### Must
- Use `IdleVillageConfig` for all domain values (no hardcoded numbers)
- Maintain event log for all state changes
- Return new state objects (pure functional updates)
- Validate activity scheduling against resident availability
- Apply fatigue progressively during activity execution
- Handle day/night cycles for fatigue recovery and food consumption
- Generate deterministic quest offers based on config rules

### Must Not
- Directly access localStorage or external storage
- Modify input state objects (always create new objects)
- Use hardcoded domain values (HP thresholds, fatigue rates, etc.)
- Skip event logging for state changes
- Allow negative resource amounts or infinite fatigue
- Schedule activities with unavailable residents

## 4. Visual Contract
TimeEngine has no direct visual contract - it's a pure domain module. However, its state changes drive visual updates through:

**Time Progression**: 
- Activity progress bars advance as `currentTime` increases
- Resident status indicators change (available -> away -> exhausted)
- Resource counters update in real-time

**Event Feedback**:
- Completion events trigger toast notifications
- Death events show Trial of Fire outcomes
- Fatigue warnings display when residents approach exhaustion

**Day/Night Cycle**:
- Visual theme changes based on time position in cycle
- Recovery indicators during night periods

## 5. Interaction Contract

### Scheduling Activities
```typescript
scheduleActivity(deps, state, input): ScheduleActivityResult
```
- Validates resident availability
- Calculates duration from activity definition
- Sets resident status to 'away'
- Emits 'activity_scheduled' event

### Time Advancement  
```typescript
advanceTime(deps, state, delta): AdvanceTimeResult
```
- Processes tick-by-tick progression
- Applies fatigue, food consumption, recovery
- Handles activity state transitions
- Returns completed activity IDs

### Activity Resolution
```typescript
resolveActivityOutcome(deps, state, scheduledId): { state, outcome }
```
- Executes Trial of Fire death risk rolls
- Applies stat bonuses for survivors
- Handles hero promotion
- Manages auto-rescheduling

## 6. Data / Props Contract

### VillageState (Core)
```typescript
interface VillageState {
  currentTime: VillageTimeUnit;
  resources: VillageResources;
  residents: Record<string, ResidentState>;
  activities: Record<string, ScheduledActivity>;
  eventLog: VillageEvent[];
  questOffers: Record<string, QuestOffer>;
}
```

### TimeEngineDeps (Required)
```typescript
interface TimeEngineDeps {
  config: IdleVillageConfig;  // Must be pre-loaded config
  rng: () => number;          // Deterministic RNG injection
}
```

### Key Input Types
- `ScheduleActivityInput`: activityId, characterIds, slotId, optional startTime/isAuto
- `VillageTimeUnit`: number (abstract time unit, not milliseconds)
- `ResidentStatus`: 'available' | 'away' | 'exhausted' | 'injured' | 'dead'

## 7. Integration Rules

### With useMinimalGameplay
- TimeEngine provides pure state updates
- useMinimalGameplay wraps TimeEngine with persistence and UI state
- All config transformations happen in useMinimalGameplay layer
- PersistenceService handles save/load, not TimeEngine

### With QuestEngine
- TimeEngine spawns quest offers via `spawnQuestOffersIfNeeded`
- QuestEngine handles quest acceptance and reward logic
- TimeEngine manages quest activity scheduling and completion

### With Config System
- All formulas come from `activityDef.durationFormula` strings
- Resource amounts from `delta.amountFormula` strings
- Global rules from `config.globalRules` object
- No hardcoded domain values anywhere

### Day/Night Integration

#### Calculation Layer
- **Source**: Calculated from simulation layer `currentTime`
- **Formula**: `dayPhase = (currentTime % totalCycleTime) < dayTimeUnits`
- **Canonical Config**: `config.globalRules.dayNightCycle` defines dayTimeUnits and nightTimeUnits

#### State Exposure
- **Gameplay Layer**: Exposed via `state.isDayPhase` boolean
- **UI Layer**: Visual themes and animations based on gameplay state
- **Determinism**: Maintained across all layers - same simulation time = same day/night state

#### Forbidden Patterns
- **Forbidden**: Separate day/night timers or independent day/night state
- **Forbidden**: Day/night logic outside TimeEngine calculation - always derive from canonical time
- **Forbidden**: Speed multiplier affecting day/night calculation (always based on simulation time)

## 8. Acceptance Criteria
- [ ] All state updates are pure functions (no mutations)
- [ ] Every state change has corresponding event log entry
- [ ] All domain values read from config, not hardcoded
- [ ] Resident availability validation prevents invalid scheduling
- [ ] Fatigue system respects day/night cycles and caps
- [ ] Trial of Fire uses injected RNG for determinism
- [ ] Resource amounts never go negative
- [ ] Activity state machine transitions are atomic
- [ ] Quest spawning follows config rules and weights

## 9. Verification

### Runtime verification
1. Schedule activity with unavailable residents -> error returned
2. Advance time with no activities -> only time changes, resources consumed
3. Complete high-risk activity -> death risk applied correctly
4. Exhaust resident -> status becomes 'exhausted', cannot schedule
5. Night time advance -> fatigue recovery applied

### Test files
- `src/engine/game/idleVillage/TimeEngine.test.ts` - Core functionality tests
- Integration tests in useMinimalGameplay test suites

### Evidence
- `test-results/doc-time-trusted-doc-2026-04-22.log`

## 10. Anti-Patterns / Forbidden Outcomes

#### Simulation Layer Anti-Patterns
- Never call `Math.random()` directly - use injected `deps.rng`
- Never hardcode domain values like `hp: 100` or `fatigueRate: 0.1`
- Never mutate input state objects - always return new objects
- Never skip event logging for state changes
- Never schedule activities without availability validation
- Never allow negative resource amounts
- Never use TimeEngine for UI state management
- **Never implement speed multipliers in simulation** - simulation time always advances 1:1
- **Never create local simulation timers** - all simulation timing derives from `currentTime`
- **Never duplicate simulation time loops** - single canonical advanceTime only
- **Never implement independent day/night state** - always derive from simulation `currentTime`
- **Never use fractional time units** - only integer VillageTimeUnit ticks

#### Gameplay Layer Anti-Patterns
- Never apply speedMultiplier to simulation layer calculations
- Never create independent timing sources outside gameplay store
- Never allow gameplay state to diverge from simulation state
- Never persist speedMultiplier as simulation-affecting value

#### UI Layer Anti-Patterns
- Never create UI timers that don't respect gameplay speedMultiplier
- Never display time that doesn't match gameplay layer state
- Never implement visual effects that break time consistency

## 11. Change Policy
TimeEngine is `trusted` - any changes to:
- Core state interfaces (VillageState, ResidentState, ScheduledActivity)
- Public API method signatures
- Domain value calculations (fatigue, death risk, resource formulas)
- Event types or payload structures

Requires:
1. Update of this trusted documentation
2. Update of dependent integration code (useMinimalGameplay)
3. Test coverage for changed behavior
4. Evidence log of verification

## 12. Change Log

### 2026-04-23 (Dual-Layer Revision)
- **Major Revision**: Added dual-layer time architecture based on RT-TIME-002 analysis
- **Simulation Layer**: Defined canonical 1:1 time advancement with speedMultiplier forbidden
- **Gameplay Layer**: Defined player-facing time with speedMultiplier allowed for pacing
- **UI Layer**: Defined presentation layer with speed-multiplied display time
- **Day/Night Integration**: Clarified calculation layering and forbidden patterns
- **Updated Invariants**: Separated simulation, gameplay, and UI layer invariants
- **Anti-Patterns**: Expanded to cover layer-specific forbidden patterns

### 2026-04-22 (Original)
- Created initial trusted documentation
- Documented complete API surface and contracts
- Defined invariants and anti-patterns
- Verified against current TimeEngine.ts implementation
