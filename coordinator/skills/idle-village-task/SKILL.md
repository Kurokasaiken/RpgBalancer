---
name: idle-village-task
description: Use for any task touching idle village UI, gameplay, skin system, residents, POI, slots, or frozen kits.
---

# Idle Village Task Mandate

Purpose
The Idle Village Task mandate defines specific requirements for work on the Idle Village vertical slice, including skin system usage, i18n requirements, frozen kit integration, and resident system patterns.

Core Responsibilities
1. Frozen Kit Usage
MUST use frozen kits from @/ui/idleVillage/frozen/kits when available:

Create new kits via npm run freeze:kit when needed
Add hub metadata to kit definitions for TestHub generation
Keep TestHub generated from registry
Reference KIT_REGISTRY for available kits
Never bypass frozen kit system for idle village components
2. Skin System Requirements
All Idle Village UI MUST use the default skin system:

Use useSkinPreferences hook for skin management
Reference DEFAULT_SKIN_PRESET_ID for default skin
New skins implemented as presets in skinConfigRegistry
NEVER create standalone .css files for theming
Use Style Lab tokens for colors, spacing, typography
Apply skinConfigRegistry presets via context
3. i18n Requirements
All user-facing strings MUST pass through i18n:

Use react-i18next useTranslation hook
Namespaces: common, idleVillage
No hardcoded Italian/English strings in JSX
New keys added to locale resources (public/locales/)
Missing keys telemetered via translation_missing
Translation keys follow naming convention: feature.action
4. Persistence Requirements
All save/load operations MUST use PersistenceService:

Import from @/shared/persistence/PersistenceService
Use saveData(), loadData(), clearData() methods
No direct localStorage/sessionStorage access
Async operations with proper error handling
Resident state persisted via PersistenceService
Config persisted via PersistenceService
5. Config-First Design
All gameplay/UI values MUST come from config modules:

Read from src/ui/idleVillage/config/** for UI config
Read from src/balancing/config/** for gameplay config
New config modules use Zod schemas for validation
No hardcoded values in components
Config modules provide safe defaults
Config changes trigger re-renders via context
Idle Village Specific Invariants
POI System Requirements
Use POI Standard contract from poi_standard_trusted.md
Implement POI interface with required methods
Use POI config from poiConfigRegistry
POI telemetry events follow naming convention
POI state managed via usePOI hook
POI verification via PoiVerificationPage
Slot Rack Requirements
Use SlotRackKit for slot rendering
Slot state managed via useSlotRack hook
Slot config from slotRackConfig
Slot telemetry events for drag-drop
Slot validation via residentDropRules
Slot feedback via dropFeedback system
Resident System Requirements
Residents derived from Character storage
Use canonical Character → Resident conversion
Resident state in Village Resident Store
No page-level resident transformations
Resident fallback only in conversion pipeline
Resident telemetry for activity changes
Activity System Requirements
Use ActivitySlot component for activity display
Activity config from activityConfig
Activity state managed via useActivity hook
Activity telemetry for assignment changes
Activity validation via activityRules
Activity feedback via activityFeedback system
Component Reuse Rules
Primitive Directory Locations
Check for existing primitives in:

src/ui/atoms/ - General UI primitives
src/ui/fantasy/atoms/ - Fantasy-specific primitives
src/ui/idleVillage/skins/primitives/ - Idle village primitives
When to Use Existing Primitives
If primitive exists: reuse or extend via props
If no primitive exists: create in correct primitive directory
NEVER duplicate primitive markup/styling from scratch
Check atoms before creating new components
Check fantasy/atoms for fantasy-specific needs
Check skins/primitives for idle village needs
Extension vs Duplication
Extend existing primitives via props when possible
Create new primitive only if no equivalent exists
Document extension rationale in comments
Avoid creating isolated components that duplicate primitives
Add new primitives to correct directory for reuse
Telemetry Requirements
Event Emission
All Idle Village interactions MUST emit telemetry:

Use trackTelemetryEvent from telemetry system
Event naming: feature_action (e.g., resident_assign, poi_select)
Include context in event payload
Include residentId, activityId where applicable
Include timestamp automatically
Event Naming Conventions
Follow pattern: feature_action

resident_assign, resident_unassign
poi_select, poi_deselect
slot_drop, slot_drag
activity_start, activity_complete
skin_change, skin_preset_select
Payload Requirements
Every event MUST include:

eventType: string (event name)
data: object with relevant fields
context: string (where event occurred)
timestamp: number (auto-generated)
metadata: object (additional info)
Example:

typescript
{
  eventType: 'resident_assign',
  data: {
    residentId: 'resident-123',
    activityId: 'forest-work',
    locationId: 'foresta',
  },
  context: 'map-drag',
  timestamp: 1641894400000,
  metadata: {
    fatigue: 50,
    crewCapacity: 3,
  }
}
Testing Requirements
RTL Testing
Use React Testing Library for component tests:

Test user interactions (click, drag, hover)
Test state changes and re-renders
Test accessibility (ARIA labels, keyboard nav)
Test error handling and fallbacks
Use user-visible locators (getByRole, getByLabelText)
Avoid implementation details (className, internal state)
Contract Testing
For frozen kits, test contract compliance:

Test kit exports from frozen/kits/index.ts
Test KitShell provider chain
Test kit props interface
Test kit skin contract
Test kit telemetry events
Use contract sweep tests for certified kits
Visual Testing
For UI components, test visual regression:

Use Playwright for E2E visual tests
Test skin rendering with different presets
Test responsive layouts
Test drag-drop visual feedback
Test modal/overlay positioning
Use visual snapshots for regression detection
Domain-Specific Patterns
Resident Assignment Flow
User drags resident to activity slot
useResidentDropValidation validates assignment
If valid: assign resident, emit telemetry
If invalid: show feedback, emit telemetry
Update resident state in Village Resident Store
Persist via PersistenceService
POI Interaction Flow
User clicks POI on map
usePOI hook selects POI
POI details panel opens
POI config applied to UI
POI telemetry emitted
POI state persisted via PersistenceService
Slot Rack Flow
SlotRackKit renders slots from config
useSlotRack manages slot state
User drags resident to slot
Slot validation via residentDropRules
Slot feedback via dropFeedback system
Slot state persisted via PersistenceService
Quality Standards
Code Quality
Follow existing code style and patterns
Add JSDoc to all new functions/interfaces
No console.log in production code
No commented-out code
Proper error handling
Type safety (TypeScript)
Config Quality
Zod schemas for all config
Safe default values
Clear naming conventions
Comprehensive comments
Validation at config load time
Skin Quality
Presets in skinConfigRegistry
Consistent with Gilded Observatory theme
Accessible color contrast
Responsive design
Animation performance
Completion Protocol
Before marking Idle Village task complete:

All safeguards pass (lint, test, build:check, kanban:lint)
Frozen kits used where applicable
Skin system requirements met
i18n requirements met (no hardcoded strings)
Persistence via PersistenceService only
Config-first design implemented
Component reuse verified
Telemetry events emitted
Trusted docs updated if touching frozen components
COMPONENT_MASTER_INDEX updated if applicable
Evidence log created in test-results
Kanban status set to "Completato"
Response ends with: KANBAN STATUS: – Completato (Evidence: )
Failure Modes
If unable to complete Idle Village task:

Document blockers in evidence log
Set Kanban status appropriately
Flag for human review if needed
Provide clear next steps
Do not mark task complete if safeguards fail
