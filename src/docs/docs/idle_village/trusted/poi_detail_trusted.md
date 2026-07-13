# POI Detail Contract - Trusted Documentation

## Metadata
- Status: `trusted`
- Area: `poi-detail`
- Canonical Name: `ActivityCapsuleDetail Skin System`
- Primary Files:
  - `src/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinSchema.ts`
  - `src/ui/idleVillage/skins/activityCapsuleDetail/useActivityCapsuleDetailSkin.tsx`
  - `src/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware.tsx`
  - `src/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinPresets.ts`
- Runtime/Test Pages:
  - ActivityCapsuleDetailSkinHarness.tsx
  - ActivityCapsuleDetailSkinExamples.tsx
- Last Certified: `2026-04-27`
- Last Updated By: `Cascade`
- Related Contracts:
  - `[POI Standard Contract](poi_standard_trusted.md)`
  - `[Time Engine Contract](time_engine_trusted.md)`

## 1. Purpose
The POI Detail system provides advanced page-integrated detail panels for Points of Interest in Idle Village. It extends the standard POI system with comprehensive theming, slot management, telemetry, and panel decorations while maintaining full compatibility with the TS-Series skin system.

## 2. Source of Truth
The canonical source of truth for POI Detail configuration lives in:
- **Schema Definition**: `ActivityCapsuleDetailSkinSchema.ts` - Zod schema defining all configuration interfaces
- **Hook Implementation**: `useActivityCapsuleDetailSkin.tsx` - Primary React hook for skin management
- **Component Implementation**: `ActivityCapsuleDetailSkinAware.tsx` - Main component with full skin integration
- **Configuration Presets**: `ActivityCapsuleDetailSkinPresets.ts` - Predefined style configurations

Non-authoritative sources:
- Legacy POI components (for reference only)
- Test harness files (for development only)
- Example files (for documentation only)

## 3. Canonical Runtime Contract

### Deve
- **Panel Management**: Provide panel frame, backdrop, and container with configurable styling
- **POI Visualization**: Display POI information with configurable icons, labels, and progress indicators
- **Slot System**: Support activity slots with states (empty, ghost, idle, active, done, locked)
- **Telemetry Integration**: Emit telemetry events for all user interactions and state changes
- **Skin Binding**: Integrate with TS-Series skin system for complete theming control
- **Progress Tracking**: Display real-time progress for activities with liquid gold progress bars
- **CTA Management**: Provide collect/start/cancel actions with proper state management
- **Motion Support**: Respect motion level settings (full, reduced, minimal)
- **Pillar Switching**: Support Wilderness/Empire pillar switching with appropriate visual changes
- **Accessibility**: Provide full ARIA labels, keyboard navigation, and screen reader support

### Non deve
- **Direct localStorage**: Must use PersistenceService for all storage operations
- **Hardcoded Values**: All visual properties must come from skin configuration
- **Timer Pollution**: Must not introduce timers < 500ms without proper cleanup
- **Legacy Dependencies**: Must not depend on deprecated POI or skin systems
- **Placeholder JSX**: Must not use placeholder components as final implementation
- **Inline Styles**: Must use CSS classes and tokens from skin configuration

## 4. Visual Contract

### Required Visual Elements
- **Panel Frame**: Gradient frame with corner decorations and ambient glow
- **Header**: Configurable height with background, border, and padding
- **POI Display**: Icon, name, and description with proper typography
- **Slot Rack**: Grid layout for activity slots with proper spacing
- **Progress Indicators**: Liquid gold progress bars with smooth animations
- **CTA Buttons**: Collect/start/cancel buttons with proper hover states
- **Telemetry Panel**: Optional telemetry display with event history

### Visual States
- **Panel States**: Open, closing, minimized, maximized
- **Slot States**: Empty (placeholder), ghost (preview), idle (ready), active (working), done (complete), locked (unavailable)
- **Progress States**: In-progress (animated), complete (full), paused (static)
- **CTA States**: Enabled, disabled, loading, success, error

### Fallback Behavior
- **Missing Skin**: Gracefully degrade to default configuration
- **Missing POI Data**: Display placeholder with proper error handling
- **Network Issues**: Maintain UI state with offline indicators
- **Performance**: Reduce animations and effects for low-end devices

## 5. Interaction Contract

### Click
- **POI Header**: Toggle panel minimize/maximize
- **Slot**: Open slot detail view or assign worker
- **CTA Collect**: Trigger collect action with success feedback
- **CTA Start**: Begin activity with progress tracking
- **CTA Cancel**: Stop activity with confirmation dialog
- **Close Button**: Close panel with state preservation

### Drag
- **Worker Cards**: Drag from roster to slots with visual feedback
- **Slot Reordering**: Drag slots to reorder (if enabled)
- **Panel Movement**: Drag panel header to reposition

### Hover
- **Interactive Elements**: Show hover states with proper visual feedback
- **Tooltips**: Display contextual information for complex elements
- **Progress Bars**: Show detailed progress information

### Open Detail
- **POI Selection**: Open detail panel with smooth animation
- **Slot Selection**: Open slot configuration panel
- **Telemetry Panel**: Expand telemetry history view

### Assign/Remove
- **Worker Assignment**: Assign worker to slot with validation
- **Worker Removal**: Remove worker with confirmation
- **Auto-assignment**: Suggest best worker for slot based on stats

### Collect/Start/Cancel
- **Collect Action**: Complete activity and distribute rewards
- **Start Action**: Begin activity with resource consumption
- **Cancel Action**: Stop activity with partial refund

## 6. Data / Props Contract

### Core Props
```typescript
interface ActivityCapsuleDetailSkinAwareProps {
  activityId: string;
  name: string;
  type: string;
  subtitle?: string;
  status: 'idle' | 'in-progress' | 'completed' | 'blocked';
  progress: number;
  duration: number;
  elapsed: number;
  slots: ActivityDetailSlotData[];
  maxSlots: number;
  draggingResidentId?: string | null;
  requirements?: StatRequirementRow[];
  durationDisplay: string;
  rewardDisplay: string;
  etaDisplay: string;
  telemetry: TelemetryEntry[];
  onStart?: () => void;
  onCancel?: () => void;
  onCollect?: () => void;
  onSlotAssign?: (slotId: string) => void;
  onSlotDetach?: (slotId: string) => void;
  /** Explicit override for the Start/Embark CTA disabled state.
   *  Pages that validate required slots (e.g. quest assignment) must pass this
   *  from upstream state such as `useQuestAssignmentPreview().canEmbark`. */
  startDisabled?: boolean;
  isOpen: boolean;
  onClose?: () => void;
  pillar?: StyleLabPillar;
  skinPresetId?: SkinPresetId;
  motionLevel?: MotionLevel;
  skinConfigOverride?: Partial<ActivityCapsuleDetailSkinConfig>;
  showTelemetry?: boolean;
  showSlots?: boolean;
  showInfo?: boolean;
  compact?: boolean;
  ariaLabel?: string;
  dataTestId?: string;
  poiIcon?: string;
  questTags?: string[];
}
```

### Slot Data Contract
```typescript
interface ActivityDetailSlotData {
  id: string;
  residentId?: string;
  state: 'empty' | 'ghost' | 'idle' | 'active' | 'done' | 'locked';
  initial: string;
  progress: number;
  assignedWorkerName?: string;
  assignedWorkerAvatarUrl?: string;
  visualProfileId?: string;
  statProfileId?: string;
  dropState?: DropState;
  /** Semantic role of this slot (e.g. 'combatant', 'support'), forwarded from ResidentSlotBlueprint.role. */
  role?: string;
  /** Human-readable label for the role, shown instead of the generic "Slot N". */
  roleLabel?: string;
  /** Whether this slot must be filled before the activity can start. */
  required?: boolean;
}
```

### Configuration Props
```typescript
interface ActivityCapsuleDetailSkinConfig {
  window: ActivityCapsuleDetailWindowConfig;
  poi: POIDisplayConfig;
  slots: SlotDisplayConfig;
  progress: ProgressDisplayConfig;
  cta: CTADisplayConfig;
  telemetry: TelemetryDisplayConfig;
  animations: AnimationConfig;
  accessibility: AccessibilityConfig;
}
```

### State Management
- **Panel State**: Open/closed/minimized/maximized position
- **Slot States**: Individual slot states and assignments
- **Progress States**: Real-time progress tracking
- **Telemetry State**: Event history and filtering
- **Skin State**: Current pillar, preset, and overrides

## 7. Integration Rules

### Required Integrations
- **TS-Series Skin System**: Must use `useSkinSystem` and `useSkinSlot` hooks
- **Telemetry System**: Must emit events via `trackTelemetryEvent`
- **Persistence Service**: Must save state via PersistenceService helpers
- **Style Lab Tokens**: Must respect spacing, color, typography tokens
- **Drag & Drop**: Must use `dnd-kit` helpers for worker assignment

### Integration Points
- **POI Standard System**: Extend and enhance standard POI functionality
- **Worker Roster**: Integrate with resident assignment system
- **Activity Engine**: Connect with activity progression and completion
- **Time Engine**: Sync with game time for progress calculations
- **Resource System**: Consume and produce resources through activities

### Data Flow
1. **POI Selection** -> Load POI data and configuration
2. **Skin Resolution** -> Resolve current pillar and preset configuration
3. **Panel Render** -> Render panel with resolved skin tokens
4. **Slot Management** -> Handle slot assignments and state changes
5. **Progress Tracking** -> Update progress based on time engine
6. **Event Emission** -> Emit telemetry for all interactions
7. **State Persistence** -> Save state changes via PersistenceService

## 8. Acceptance Criteria
- [ ] runtime corretto - Panel opens, displays POI, manages slots correctly
- [ ] usa la source of truth giusta - Reads from ActivityCapsuleDetailSkinSchema
- [ ] visual contract rispettato - All visual elements match configuration
- [ ] interaction contract rispettato - All interactions work as specified
- [ ] nessun fallback/mock nel runtime target - No placeholder components in production
- [ ] test/verifica completati - Component tests and integration tests pass
- [ ] skin system integration - Full TS-Series skin system compatibility
- [ ] telemetry emission - All required events are emitted correctly
- [ ] persistence integration - State is saved and restored correctly
- [ ] accessibility compliance - Full WCAG 2.1 AA compliance

## 9. Verification

### Runtime verification
1. **Panel Operations**: Open, close, minimize, maximize panel correctly
2. **Slot Operations**: Assign, remove, and manage worker slots properly
3. **Progress Tracking**: Monitor and display activity progress accurately
4. **Skin Switching**: Switch between Wilderness/Empire pillars seamlessly
5. **Telemetry Events**: Verify all required events are emitted with correct payload
6. **State Persistence**: Confirm state is saved and restored across sessions
7. **Performance**: Ensure smooth animations and responsive interactions
8. **Accessibility**: Test keyboard navigation and screen reader compatibility

### Test files
- `src/ui/idleVillage/skins/activityCapsuleDetail/__tests__/ActivityCapsuleDetailSkinSchema.test.ts`
- `src/ui/idleVillage/skins/activityCapsuleDetail/__tests__/useActivityCapsuleDetailSkin.test.tsx`
- `src/ui/idleVillage/skins/activityCapsuleDetail/__tests__/ActivityCapsuleDetailSkinAware.test.tsx`
- `tests/e2e/idleVillage/poiDetail.spec.ts`

### Evidence
- `test-results/doc-poi-d-trusted-doc-2026-04-22.log`

## 10. Anti-Patterns / Forbidden Outcomes
- **Non introdurre timer locali**: Use SchedulerService or useSandboxClock for timers
- **Non usare placeholder JSX come soluzione finale**: All components must be fully implemented
- **Non reintrodurre componenti legacy/wrong-branch**: Use only current TS-Series integration
- **Non duplicare source of truth**: Single source of truth in ActivityCapsuleDetailSkinSchema
- **Non usare `/test` come proof architetturale**: Use dedicated integration pages
- **Non hardcoded visual properties**: All visual properties must come from skin configuration
- **Non bypassare PersistenceService**: Must use async storage for all state operations
- **Non ignorare telemetry**: Must emit events for all significant interactions
- **Non detached window-like paradigm**: Must use page-integrated panel extrusion, not detached windows
- **Non pseudo-detail on main surface**: Must use dedicated detail panel, not inline expansion
- **Non duplicated state ownership**: Must maintain single source of truth for panel state
- **Non placeholder/fallback detail UI**: Must implement full detail functionality

## 11. Change Policy

If this component is `trusted` or `frozen`, every modification to:
- behavior (panel operations, slot management, progress tracking)
- visual grammar (panel frame, POI display, slot appearance)
- runtime contract (props, state management, data flow)
- source-of-truth usage (schema, hooks, configuration)

richiede:
1. update del codice (modify schema, hooks, or component files)
2. verifica runtime (test all affected functionality)
3. update del trusted doc (update this documentation)
4. update dei test/evidence se necessario (update test files and evidence)

## 12. Change Log

### 2026-04-22
- **Created**: Initial trusted documentation for POI Detail contract
- **Scope**: Complete ActivityCapsuleDetail skin system documentation
- **Reference**: DOC-POI-D task completion
- **Evidence**: `test-results/doc-poi-d-trusted-doc-2026-04-22.log`

---

## Configuration Examples

### Basic POI Detail Configuration
```typescript
const basicPOIDetailConfig: ActivityCapsuleDetailSkinConfig = {
  window: {
    windowBackground: 'rgba(30, 41, 59, 0.95)',
    windowBorder: '2px solid rgb(71, 85, 105)',
    windowBorderRadius: '12px',
    windowBoxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    windowWidth: '600px',
    windowMinHeight: '400px',
    windowMaxWidth: '800px',
    windowBackdrop: 'rgba(0, 0, 0, 0.5)',
    frameGradient: 'linear-gradient(135deg, rgb(205, 127, 50), rgb(139, 69, 19))',
    headerHeight: '60px',
    headerBackground: 'rgba(15, 23, 42, 0.95)',
    headerBorder: '1px solid rgb(71, 85, 105)',
    headerPadding: '16px 24px',
  },
  poi: {
    iconSize: '48px',
    iconBorderRadius: '8px',
    nameFontSize: '18px',
    descriptionFontSize: '14px',
    nameColor: 'rgb(248, 250, 252)',
    descriptionColor: 'rgb(148, 163, 184)',
  },
  // ... additional configuration sections
};
```

### Wilderness Pillar Configuration
```typescript
const wildernessPOIDetailConfig: Partial<ActivityCapsuleDetailSkinConfig> = {
  window: {
    frameGradient: 'linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74))',
    frameBorderGradient: 'linear-gradient(90deg, rgb(44, 116, 66), rgb(74, 222, 128))',
  },
  poi: {
    nameColor: 'rgb(134, 239, 172)',
    descriptionColor: 'rgb(110, 231, 183)',
  },
  animations: {
    windowOpenDuration: 300,
    windowCloseDuration: 250,
    slotAssignDuration: 200,
    progressUpdateDuration: 100,
  },
};
```

### Empire Pillar Configuration
```typescript
const empirePOIDetailConfig: Partial<ActivityCapsuleDetailSkinConfig> = {
  window: {
    frameGradient: 'linear-gradient(135deg, rgb(205, 127, 50), rgb(180, 83, 38))',
    frameBorderGradient: 'linear-gradient(90deg, rgb(217, 119, 6), rgb(245, 158, 11))',
  },
  poi: {
    nameColor: 'rgb(251, 191, 36)',
    descriptionColor: 'rgb(252, 211, 77)',
  },
  animations: {
    windowOpenDuration: 400,
    windowCloseDuration: 350,
    slotAssignDuration: 300,
    progressUpdateDuration: 150,
  },
};
```

---

## Integration Examples

### Basic Usage
```typescript
import { ActivityCapsuleDetailSkinAware } from './ActivityCapsuleDetailSkinAware';
import { useActivityCapsuleDetailSkin } from './useActivityCapsuleDetailSkin';

function POIDetailExample() {
  const { skinConfig, skinBinding } = useActivityCapsuleDetailSkin({
    pillar: 'wilderness',
    skinPresetId: 'default-wilderness-poi-detail',
    enableTelemetry: true,
  });

  return (
    <ActivityCapsuleDetailSkinAware
      poiId="forest-gathering"
      poiData={forestPOIData}
      slots={forestSlots}
      telemetry={telemetryEvents}
      skinConfig={skinConfig}
      onSlotAssign={handleSlotAssign}
      onSlotRemove={handleSlotRemove}
      onCollect={handleCollect}
      onStart={handleStart}
      onCancel={handleCancel}
      onClose={handleClose}
    />
  );
}
```

### Advanced Configuration
```typescript
function AdvancedPOIDetailExample() {
  const { skinConfig, skinBinding } = useActivityCapsuleDetailSkin({
    pillar: 'empire',
    skinPresetId: 'imperial-poi-detail',
    motionLevel: 'reduced',
    enableValidation: true,
    enableHotReload: process.env.NODE_ENV === 'development',
    skinConfigOverride: {
      window: {
        windowWidth: '700px',
        windowMinHeight: '500px',
      },
      animations: {
        windowOpenDuration: 500,
      },
    },
  });

  return (
    <ActivityCapsuleDetailSkinAware
      poiId="imperial-forge"
      poiData={forgePOIData}
      slots={forgeSlots}
      telemetry={telemetryEvents}
      skinConfig={skinConfig}
      enableTelemetry={true}
      enableDevTools={process.env.NODE_ENV === 'development'}
      onSlotAssign={handleSlotAssign}
      onSlotRemove={handleSlotRemove}
      onCollect={handleCollect}
      onStart={handleStart}
      onCancel={handleCancel}
      onClose={handleClose}
    />
  );
}
```

---

*Last Updated: 2026-04-27*  
*Version: 1.0*  
*Status: trusted*
