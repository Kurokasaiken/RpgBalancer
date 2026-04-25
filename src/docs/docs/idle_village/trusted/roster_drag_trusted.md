# Roster/Drag System Trusted Contract

**Status**: APPROVED as Verification Pass  
**Last Certified**: 2026-04-23  
**Area**: Drag & Drop System Architecture  
**Verification**: RT-ROSTER-001 Evidence Log  

---

## Canonical Components Identification

### 1. VillageRosterSection (Static Roster Component)
**Source**: `@/ui/idleVillage/roster/index.ts`  
**Role**: Canonical roster static component  
**Contract**: 
- Provides resident cards (PgCard) as drag sources
- Manages roster state and resident availability
- Integrates with Style Laboratory for consistent theming
- Uses config-first design for resident data

### 2. DragOverlay (Drag Preview Component)
**Source**: `@dnd-kit/core` with WorkerCard content  
**Role**: Canonical drag preview  
**Contract**:
- Renders drag preview during active drag operations
- Uses WorkerCard component for consistent visual representation
- Provides visual feedback during drag operations
- Maintains pointer-events-none for proper drop target interaction

### 3. DragContext (State Management)
**Source**: `src/ui/idleVillage/roster/DragContext.tsx`  
**Role**: State-management provider (not visual overlay)  
**Contract**:
- Manages drag state (activeId, cursor offset, preview center)
- Provides clean state cleanup on drag end
- Uses React context pattern for state distribution
- No direct TimeEngine mutations (state management only)

### 4. TestRosterPage (Integration Harness)
**Source**: `src/ui/idleVillage/TestRosterPage.tsx`  
**Role**: Verification harness and integration reference  
**Contract**:
- Sufficiently faithful integration reference
- Not the final assembly target but provides solid foundation
- Functions as comprehensive drag & drop verification harness
- Exposes multiple test scenarios (open/restricted slots)

---

## Verification Results (RT-ROSTER-001)

### Zero Runtime Corrections Needed
All components already compliant with trusted contracts:
- DragContext provides proper drag state management
- TestRosterPage functions as effective verification harness
- statMatching implements robust validation without state mutations
- No parallel drag systems created

### Time Layer Integrity Maintained
**Dual-Layer Architecture Separation**:
- Drag system uses gameplay layer time via useMinimalGameplay
- No direct TimeEngine.currentTime access in drag components
- speedMultiplier properly handled at gameplay layer
- Simulation layer (TimeEngine) remains isolated from drag operations

### Contract Consistency Confirmed
**Trusted contracts truly consistent with verified runtime path**:
- Drag operations: DragContext -> TestRosterPage -> useMinimalGameplay
- Validation: statMatching -> requirement evaluation -> assignment result
- Time flow: Gameplay layer (speedMultiplier) -> UI display -> User interaction
- State isolation: Simulation layer (TimeEngine) remains unaffected

### Integration Foundation Established
**TestRosterPage provides solid reference for future integration work**:
- Config-first design with proper test data management
- Integrates with Style Laboratory for consistent theming
- Implements multiple test scenarios for comprehensive coverage
- Provides visual feedback systems for drag operations

---

## System Architecture

### Drag & Drop Flow
1. **User Interaction**: User drags resident card (DragContext manages drag state)
2. **Drop Validation**: Drop validation occurs (statMatching validates requirements)
3. **Assignment Processing**: Assignment processed (useMinimalGameplay handles state updates)
4. **Visual Feedback**: Visual feedback provided (TestRosterPage displays results)
5. **Time Layer Separation**: Time layers remain properly separated (gameplay vs simulation)

### Component Interactions
```
VillageRosterSection -> PgCard (draggable)
          |
          v
    DragContext (state management)
          |
          v
    statMatching (validation)
          |
          v
  useMinimalGameplay (assignment)
          |
          v
    TestRosterPage (feedback)
```

### Time Layer Usage
**Gameplay Layer**:
- useMinimalGameplay for time and state management
- speedMultiplier handling
- UI interaction timing
- Day/night calculations from gameplay state

**Simulation Layer**:
- TimeEngine isolated from drag operations
- No direct access by drag components
- Maintains simulation integrity
- Proper state boundary enforcement

---

## Integration Patterns

### Config-First Design
- All test scenarios defined in configuration (RACK_SCENARIOS)
- Stat requirements read from config objects
- No hardcoded validation logic outside config
- Style Laboratory tokens used for visual presentation
- Test data managed through proper config channels

### Validation System
**statMatching Engine**:
- Comprehensive stat requirement validation (allOf/anyOf/noneOf)
- Supports both tag-based and numeric stat requirements
- Properly excludes HP from stat tags
- Handles edge cases (missing stats, zero values, NaN)
- Returns detailed validation results with specific failure reasons

### Visual Feedback
**Drag State Management**:
- Real-time drag state updates
- Visual bloom effects for valid drops
- Opacity changes for invalid drops
- Tooltip feedback for validation failures
- Consistent theming through Style Laboratory

---

## Usage Guidelines

### For Integration Development
1. **Reference TestRosterPage**: Use as integration guide for future development
2. **Follow DragContext Pattern**: Maintain state management separation
3. **Use statMatching**: Leverage existing validation engine
4. **Respect Time Layers**: Maintain gameplay vs simulation separation
5. **Config-First**: All new requirements should follow config-first pattern

### For Testing
1. **Use /test Route**: Leverage TestRosterPage as verification harness
2. **Follow Test Route Guidelines**: Reference `test-route-drag-guidelines.md`
3. **Validate Time Layer Separation**: Ensure no TimeEngine direct access
4. **Test Visual Feedback**: Verify bloom, opacity, and tooltip states
5. **Check Config Compliance**: Ensure no hardcoded validation logic

### For Future Tasks
**RT-INT-DRAG-POI-001 Dependencies**:
- Use VillageRosterSection as canonical roster source
- Leverage DragContext for state management
- Follow established validation patterns via statMatching
- Maintain time layer separation principles
- Reference TestRosterPage for integration patterns

---

## Compliance Status

### Time Engine Contract
- **Status**: COMPLIANT
- **Requirements Met**:
  - No direct TimeEngine mutations by drag system
  - Proper separation of simulation vs gameplay layers
  - Assignment APIs respect TimeEngine state boundaries
  - Time advancement occurs through proper gameplay layer

### Drag System Contract
- **Status**: COMPLIANT
- **Requirements Met**:
  - Drag state management follows React patterns
  - Visual feedback systems properly implemented
  - Assignment validation respects stat requirements
  - No parallel drag systems created

### Config-First Contract
- **Status**: COMPLIANT
- **Requirements Met**:
  - All test scenarios defined in configuration
  - Stat requirements read from config objects
  - No hardcoded validation logic outside config
  - Style Laboratory tokens used for visual presentation

---

## Evidence and Verification

### RT-ROSTER-001 Evidence Log
- **File**: `test-results/rt-roster-001-alignment-2026-04-23.log`
- **Status**: COMPLETATO
- **Key Findings**: Zero runtime corrections needed, full compliance verified

### Runtime Verification
- **Critical Path**: Drag & drop system integration with TimeEngine state
- **Method**: Code review + structural analysis + time layer mapping
- **Result**: All drag system components properly aligned with trusted contracts

### System Reuse Audit
- **Existing Systems Verified**: DragContext, TestRosterPage, statMatching, useMinimalGameplay, TimeEngine
- **Reuse Decision**: All existing systems comply with trusted contracts
- **Parallel Systems**: None created (verification-only task)

---

## Maintenance and Updates

### Update Triggers
This trusted document should be updated when:
- Drag system architecture changes
- Time layer separation patterns evolve
- New canonical components identified
- Contract requirements modified
- Integration patterns change

### Update Process
1. Verify changes through RT-ROSTER-001 or equivalent verification
2. Update this document with new component identification
3. Update COMPONENT_MASTER_INDEX.md with new status
4. Log evidence in appropriate test results file
5. Update last certified date

### Governance
- **Single Source of Truth**: This document is the authoritative source for roster/drag contracts
- **No Duplication**: Component details live here, not in COMPONENT_MASTER_INDEX.md
- **Version Control**: All changes tracked through git and evidence logs
- **Verification Required**: All updates must pass RT-ROSTER-001 equivalent verification

---

*Last Updated: 2026-04-23*  
*Status: APPROVED - Ready for production integration*  
*Next Review: Upon architectural changes or new component identification*
