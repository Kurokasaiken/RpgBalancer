# POI Standard Contract

## Metadata
- Status: `trusted`
- Area: `poi`
- Canonical Name: `ActivityCapsule Standard Contract`
- Primary Files:
  - `src/ui/idleVillage/components/ActivityCapsule.tsx`
  - `src/ui/idleVillage/skins/activityCapsuleSkinConfig.ts`
  - `src/ui/idleVillage/skins/poi/poiAmberSkinConfig.ts`
- Runtime/Test Pages:
  - `/minimal-gameplay` (ActivityCapsule examples)
  - `/test` (TestRosterPage integration)
  - `/poi-verification` (RT-POI-S-001 verification harness)
- Last Certified: `2026-04-22`
- Last Updated By: `Cascade`
- Verification: `RT-POI-S-001` - 100% compliant, zero runtime corrections needed
- Related Contracts:
  - `[POI Detail Contract](poi_detail_trusted.md)`
  - `[Day/Night Contract](daynight_trusted.md)`

## 1. Purpose
Define the canonical contract for POI (Point of Interest) standard components in the Idle Village vertical slice. 

**Canonical Scope**: A "standard POI" is the ActivityCapsule component - a config-first capsule that displays activity details with slot grid, progress tracking, and collect functionality. 

**Clear Distinctions**:
- **Standard POI**: ActivityCapsule component (capsule with slots, progress, CTA)
- **POI Detail**: PoiDetailSkinWrapper - expanded detail view with enhanced information
- **Day/Night**: Time-based visual modifiers applied to any POI surface
- **Integration Contracts**: Data flow and interaction patterns between components

**Boundary**: Standard POI is the capsule component, NOT the map-level POI marker or the expanded detail view.

## 2. Source of Truth
**Canonical State Sources:**
- Component props contract: `ActivityCapsuleProps` interface in `ActivityCapsule.tsx`
- Skin configuration: `activityCapsuleSkinConfig.ts` with Style Lab token integration
- POI skin definitions: `poiAmberSkinConfig.ts` for specialized POI visualizations
- Style Lab preferences: `useSkinPreferences` hook for pillar and preset resolution

**Non-Authoritative Sources:**
- Individual component instances (must follow this contract)
- Test harness implementations (reference only)
- Inline styling or hardcoded values (forbidden)

## 3. Canonical Runtime Contract

**Contract Stability**: This section defines STABLE behavior requirements, not current implementation details. The capsule's fundamental contract must remain stable even if internal implementation changes.

### Deve (Stable Behavior Requirements)
- **Display activity metadata** with label, icon, subtitle, and helper text
- **Render slot grid** with configurable layout (columns, gap, size, border radius)
- **Show progress tracking** with liquid gold progress bar and percentage display
- **Provide timer display** showing remaining time in MM:SS format
- **Support collect CTA** when activity is completed and canCollect is true
- **Handle drag & drop** for resident assignment with visual feedback
- **Integrate Style Lab tokens** for pillar-specific visual variants
- **Support POI skin visualization** for specific activity patterns
- **Provide accessibility** with ARIA labels, live regions, and keyboard navigation
- **Emit telemetry events** for user interactions and state changes

### Non deve (Stable Prohibitions)
- **Hardcode visual values** (use Style Lab tokens only)
- **Create local timers** (use requestAnimationFrame for UI updates)
- **Bypass skin system** (always resolve through getActivityCapsuleSkinConfig)
- **Ignore pillar context** (respect Wilderness/Empire visual differences)
- **Duplicate state management** (read from props, maintain local UI state only)

## 4. Visual Contract

### Required Visual Elements
- **Frame**: Dark luxury capsule with configurable border, background, and shadow
- **Slot Grid**: Responsive layout with occupied/locked/empty states
- **Progress Bar**: Liquid gold effect with percentage and milestone indicators
- **Timer**: MM:SS format display under icon
- **Collect Button**: Prominent CTA with disabled state handling
- **Drop Feedback**: Visual bloom for valid drops, opacity for invalid

### Pillar Variants
- **Wilderness**: Organic materials (wood, stone, golden thatch), green accents, natural animations
- **Empire**: Monumental materials (basalt, bronze, silk), indigo accents, formal animations

### POI Skin Integration
- Auto-enable for activity patterns starting with 'slot-c-poi' or containing 'punto-di-interesse'
- SVG-based visualizations with configurable gradients and filters
- Amber skin as default POI visualization with wilderness pillar alignment

### Critical Visual Requirements
- **Standard POI must NOT appear as pseudo-detail on main page**
- **Must read as capsule component, not expanded detail view**
- **Clear visual hierarchy**: capsule frame > slots > progress > CTA

### Fallback/Mock/Regression Definition
- **Fallback**: Missing Style Lab tokens or pillar variants
- **Mock**: Placeholder JSX or "Coming Soon" content
- **Regression**: Hardcoded values, broken skin integration, missing pillar differences

### Forbidden Outcomes
- **Standard POI appearing as detail view on main page**
- Placeholder JSX as final solution
- Hardcoded color values or gradients
- Missing visual feedback for interactions
- Inconsistent styling across pillar variants
- **Capsule reading as map marker or expanded detail**

## 5. Interaction Contract

### Click Interactions
- **Activity Click**: Trigger `onActivityClick` for capsule-level actions
- **Slot Click**: Trigger `onSlotClick(slotId)` for slot-specific actions
- **Collect Click**: Trigger `onCollect()` when canCollect is true

### Drag & Drop
- **Drop Mode**: Enable with `enableDropMode` prop
- **Validation**: Respect `dropValidationConfig` for resident restrictions
- **Visual Feedback**: Show bloom for valid drops, opacity for invalid/locked
- **Assignment**: Trigger `onResidentDrop(residentId, slotId)` on successful drop
- **Detach**: Right-click to trigger `onResidentDetach(slotId)` for occupied slots

### Hover States
- **Slot Hover**: Trigger `onSlotHover(slotId, isHovering)` with visual scaling
- **Activity Hover**: Show enhanced glow and transform effects
- **Collect Hover**: Highlight CTA when available

## 6. Data / Props Contract

### Core Activity Data
```typescript
{
  activityId: string;           // Unique activity identifier
  label: string;               // Display name
  icon?: React.ReactNode;      // Optional icon component
  subtitle?: string;           // Optional subtitle text
  helperText?: string;         // Optional helper description
}
```

### Slot Configuration
```typescript
{
  slots: ActivitySlotData[];    // Array of slot objects
  maxSlots: number;            // Maximum slot capacity
}
```

### Progress Tracking
```typescript
{
  progressFraction: number;     // 0.0 to 1.0 progress
  elapsedSeconds: number;       // Time elapsed
  totalDurationSeconds: number; // Total duration
}
```

### Expiration / Time-Limited POI
```typescript
{
  timeRemainingMs?: number;     // Time remaining before expiration (optional)
  expirationThresholdMs?: number; // Threshold for "near expiration" visual warnings (default: 60000ms = 1 minute)
  isExpirable?: boolean;       // Whether this POI can expire and disappear (vs. countdown-only)
}
```

**Expiration Behavior:**
- **Expirable POI** (e.g., quests with start deadline): Must be started within timeRemainingMs, then disappears from map
- **Countdown-Only POI** (e.g., scheduled events): Uses timeRemainingMs as countdown display, but does not disappear
- **Near Expiration Visuals**: When timeRemainingMs < expirationThresholdMs:
  - Color transition: Orange → Red as timeRemainingMs approaches 0
  - Counterclockwise rotation animation to indicate urgency
  - No rotation speed acceleration (color change is the primary urgency indicator)

### Status and Actions
```typescript
{
  status: 'idle' | 'in-progress' | 'completed' | 'blocked';
  canCollect: boolean;         // Collection availability
  onCollect?: () => void;       // Collection handler
  collectLabel?: string;        // Custom CTA text
  collectDisabled?: boolean;    // CTA disabled state
}
```

### Skin Configuration
```typescript
{
  pillar?: StyleLabPillar;              // Wilderness/Empire
  skinPresetOverrideId?: string;        // Custom preset
  skinConfigOverride?: Partial<ActivityCapsuleSkinConfig>;
  enablePoiVisualization?: boolean;     // POI skin toggle
  poiSkinId?: string;                   // Specific POI skin
}
```

## 7. Integration Rules

### Style Lab Integration
- **Token Resolution**: Use `useStyleLabTokens` and `getActivityCapsuleSkinConfig`
- **Pillar Context**: Respect current pillar from `useSkinPreferences`
- **Override System**: Support preset and config overrides with fallback chain

### Skin System Integration
- **POI Auto-Detection**: Use `shouldAutoEnablePoiSkin(activityId)` for automatic enabling
- **Skin Registry**: Resolve through `getActivityCapsuleSkinOverrideById` for custom skins
- **Fallback Chain**: pillar preset -> override -> POI skin -> default

### Telemetry Integration
- **Event Tracking**: Use `trackTelemetryEvent` for all user interactions
- **Payload Structure**: Include activityId, interaction type, and context
- **Performance**: Track render performance and interaction latency

### Drag & Drop Integration
- **DnD Kit**: Use `useDroppable` with proper data attributes
- **Validation**: Integrate with `useResidentDropValidation` for rule enforcement
- **Feedback**: Use `DropFeedbackUI` for visual drop states

## 8. Acceptance Criteria
- [ ] Component renders with all required visual elements
- [ ] Style Lab tokens are properly resolved and applied
- [ ] Pillar variants show appropriate visual differences
- [ ] POI skin integration works for eligible activities
- [ ] Drag & drop functions with correct validation and feedback
- [ ] Progress tracking displays accurately with timer
- [ ] Collect CTA appears when canCollect is true
- [ ] Accessibility features work with screen readers
- [ ] Telemetry events are emitted for all interactions
- [ ] Component is responsive across mobile/tablet/desktop
- [ ] No hardcoded values or magic numbers in implementation

## 9. Verification Results (RT-POI-S-001)

### Compliance Status: 100% VERIFIED
**Verification Date**: 2026-04-22  
**Verification Harness**: `PoiVerificationPage.tsx` (`/poi-verification`)  
**Result**: Zero runtime corrections needed - ActivityCapsule fully compliant with trusted contract

### Verified Components
- **ActivityCapsule**: All contract requirements satisfied
- **Skin Configuration API**: Style Lab integration working correctly
- **POI Auto-Detection**: Automatic skin enabling for eligible activities
- **Pillar Variants**: Wilderness/Empire visual differences confirmed
- **Time Layer Usage**: Proper requestAnimationFrame timer implementation

### Verification Harness Features
The `PoiVerificationPage.tsx` provides comprehensive testing:
- **Multiple Rendering Modes**: Standard, POI auto-detection, specific POI skins
- **Pillar Switching**: Live Wilderness/Empire variant testing
- **Progress Simulation**: Real-time progress tracking and collect flow
- **Contract Checklist**: Visual verification of all requirements
- **Telemetry Integration**: Event tracking for all interactions

### Runtime verification
1. Navigate to `/minimal-gameplay` and verify ActivityCapsule renders
2. Test drag & drop functionality in `/test` TestRosterPage
3. Verify pillar switching changes visual appearance
4. Confirm POI skin auto-enables for eligible activities
5. Validate accessibility with screen reader testing
6. **NEW**: Use `/poi-verification` for comprehensive contract testing

### Test files
- `src/ui/idleVillage/components/ActivityCapsule.test.tsx`
- `tests/e2e/idleVillage/activity-capsule.spec.ts`
- `tests/unit/idleVillage/skins/activityCapsuleSkinConfig.test.ts`
- **NEW**: `src/ui/idleVillage/pages/PoiVerificationPage.tsx` (verification harness)

### Evidence
- `test-results/doc-poi-s-trusted-doc-2026-04-22.log`
- `test-results/rt-poi-s-001-verification-2026-04-22.log`

## 10. Anti-Patterns / Forbidden Outcomes
- **Local timers**: Use requestAnimationFrame, not setTimeout/setInterval
- **Hardcoded styling**: All visual values must come from Style Lab tokens
- **Bypassing skin system**: Always resolve through getActivityCapsuleSkinConfig
- **Placeholder components**: No "TODO" or "Coming Soon" JSX in production
- **Duplicate state**: Don't copy props to local state unnecessarily
- **Ignoring validation**: Drop validation must be enforced
- **Missing telemetry**: All user interactions must be tracked

## 11. Change Policy

If this component is `trusted` or `frozen`, every modification to:
- behavior (slot assignment, progress tracking, collect flow)
- visual grammar (frame styling, progress bar, pillar variants)
- runtime contract (props interface, event handlers)
- source-of-truth usage (Style Lab tokens, skin resolution)

requires:
1. update of the code
2. runtime verification
3. update of this trusted doc
4. update of test/evidence if necessary

## 12. Change Log

### 2026-04-22
- Created initial trusted documentation for POI Standard contract
- Defined canonical runtime contract based on ActivityCapsule.tsx implementation
- Documented Style Lab integration and pillar variant system
- Specified drag & drop interaction contract and validation requirements
- Added POI skin integration rules and auto-detection logic
- Established acceptance criteria and verification procedures
- Referenced governance pack for template compliance
- **RT-POI-S-001 VERIFICATION COMPLETED**: 100% compliance confirmed
- Added verification harness documentation and results
- Updated status to `trusted` with zero runtime corrections needed

## 13. Integration Readiness (RT-POI-D-001)

### Dependencies for RT-POI-D-001
The POI Standard contract is now ready for integration work with the following dependencies satisfied:

#### Prerequisites Met
- **ActivityCapsule Contract**: 100% verified, stable API
- **Skin Configuration API**: Style Lab integration confirmed
- **POI Auto-Detection**: Working for eligible activity patterns
- **Verification Harness**: `PoiVerificationPage.tsx` available for testing
- **Telemetry Integration**: Event tracking established

#### Integration Patterns for POI Detail
When implementing RT-POI-D-001 (POI Detail expansion), follow these patterns:

1. **Contract Extension**: Extend POI Standard contract without breaking existing API
2. **Skin System Reuse**: Leverage existing `poiAmberSkinConfig` patterns for new detail skins
3. **Style Lab Consistency**: Maintain pillar variant consistency with standard POI
4. **Verification Harness**: Use `PoiVerificationPage.tsx` as reference for testing patterns
5. **Telemetry Continuity**: Follow established event naming conventions

#### Usage of PoiVerificationPage as Reference
The verification harness demonstrates:
- **Multi-mode rendering**: Standard vs POI vs Detail visualization
- **Pillar switching**: Live Wilderness/Empire variant testing
- **Progress simulation**: Real-time state management patterns
- **Contract compliance**: Checklist verification approach
- **Telemetry integration**: Event tracking implementation

#### Recommended Integration Steps
1. **Extend Contract**: Add detail-specific props to POI Standard contract
2. **Create Detail Components**: Build on ActivityCapsule patterns
3. **Skin Integration**: Extend POI skin system for detail views
4. **Verification**: Adapt PoiVerificationPage for detail testing
5. **Documentation**: Update trusted docs with detail extensions

---

**Contract Status**: `trusted` - RT-POI-S-001 verification complete, 100% compliant
**Next Milestone**: Ready for RT-POI-D-001 integration work
**Freeze Requirements**: Contract stable, ready for production integration
