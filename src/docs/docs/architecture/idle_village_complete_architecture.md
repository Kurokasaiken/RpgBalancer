# Idle Village - Complete Architecture Documentation

**Status**: Active  
**Owner**: Strategy Team  
**Last Updated**: 2026-04-22  
**Scope**: Overview architetturale con link ai contratti componenti

---

## 1. Overview

Questo documento è un **overview architetturale** di Idle Village che fornisce una visione d'insieme del sistema, dei pattern e delle linee guida implementative. 

### 1.1 Governance Documentale

Per i contratti componenti specifici e le definizioni dettagliate, fare riferimento al **Master Index**:
- **Master Index**: `[src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md](../idle_village/COMPONENT_MASTER_INDEX.md)`
- **Documenti Trusted**: Contratti dettagliati per Time Engine, POI, Day/Night e altri componenti
- **Policy**: `[idle-village-documentation-governance-pack.md](../../idle-village-documentation-governance-pack.md)`

Questo documento:
- **Orienta** sull'architettura generale e i pattern
- **Indicizza** i componenti e i loro ruoli
- **Collega** ai documenti trusted per i dettagli
- **Non ridefinisce** i contratti dei componenti

### 1.2 Navigazione Documentale

- **Master Index**: `[COMPONENT_MASTER_INDEX.md](../idle_village/COMPONENT_MASTER_INDEX.md)` - Indice completo dei contratti componenti
- **Time Engine Contract**: Vedi Master Index per link al trusted doc
- **POI Contracts**: Vedi Master Index per POI Standard e Detail contracts
- **Day/Night Contract**: Vedi Master Index per link al trusted doc

### 1.3 Vertical Slice Target

La vertical slice completa include:
- **Time Engine** con tick streaming e activity resolution
- **Characters & Roster** con drag & drop assignment
- **Jobs & Quest System** con collect flow e reward application
- **Quest Success Modal** con outcome visualization
- **Reward Application System** con VillageState integration
- **Skin System** con balancer-skin.css su tutte le superfici

---

## 2. Component Architecture

### 2.1 Core Components

#### 2.1.1 Time Engine
- **File**: `src/engine/game/idleVillage/TimeEngine.ts`
- **Responsibility**: Gestisce il tempo di gioco, tick streaming, activity scheduling
- **Key APIs**: `tick()`, `scheduleActivity()`, `resolveActivity()`
- **Dependencies**: `GlobalRules`, `ActivityDefinition`, `VillageState`

#### 2.1.2 Activity System
- **Files**: 
  - `src/ui/idleVillage/components/ActiveActivityHUD.tsx`
  - `src/ui/idleVillage/components/ActivityCapsule.tsx`
- **Responsibility**: UI per attività attive e collect
- **Key APIs**: `onCollect()`, `canCollect`, activity status visualization
- **Dependencies**: `TimeEngine`, `QuestState`, `VillageState`

#### 2.1.3 Roster System
- **Files**:
  - `src/ui/idleVillage/TestRosterPage.tsx`
  - `src/ui/idleVillage/components/ResidentSlotRack.tsx`
  - `src/ui/idleVillage/components/PgCard.tsx`
- **Responsibility**: Gestione residenti, assignment, drag & drop
- **Key APIs**: `handleDragEnd()`, `handleRosterSelect()`, validation
- **Dependencies**: `dnd-kit`, `statMatching.ts`, `VillageState`

#### 2.1.4 Quest System
- **Files**:
  - `src/ui/idleVillage/components/QuestDetailPanel.tsx`
  - `src/ui/idleVillage/components/QuestDetailLens.tsx`
- **Responsibility**: UI per dettagli quest e outcome visualization
- **Key APIs**: Quest status display, reward preview
- **Dependencies**: `QuestState`, `QuestResult`, `ActivityDefinition`

### 2.2 Modal System

#### 2.2.1 Modal Pattern
- **Base Component**: `src/ui/idleVillage/components/MinimalGameOverModal.tsx`
- **Pattern**: Modali locali con portal, focus trap, escape handling
- **Key Features**: Telemetry integration, accessibility, backdrop handling
- **Usage**: Estendere pattern per `QuestSuccessModal`

### 2.3 Data Flow Architecture

#### 2.3.1 Quest Lifecycle
```
Quest Creation
    -> Activity Assignment (TimeEngine)
    -> Activity Execution (tick streaming)
    -> Activity Completion (resolveActivity)
    -> Quest State Update (QuestState)
    -> Collect Trigger (ActivityCapsule.onCollect)
    -> Quest Success Modal (UI)
    -> Reward Application (RewardService)
    -> VillageState Update (Persistence)
```

#### 2.3.2 Resource Flow
```
Activity Resolution
    -> Resource Calculation (FormulaEngine)
    -> VillageState Update (resources)
    -> UI Update (reactive components)
    -> Persistence (PersistenceService)
    -> Telemetry (trackTelemetryEvent)
```

#### 2.3.3 State Management
- **Primary Store**: `VillageState` in `src/store/useMinimalGameplay.ts`
- **Slices**: residents, resources, activities, quests
- **Persistence**: `PersistenceService` con async save/load
- **Validation**: Stat requirements, activity constraints

---

## 3. Skin System Architecture

### 3.1 Skin Configuration

#### 3.1.1 Core Skin Files
- **Balancer Skin**: `balancer-skin.css` (root file)
- **Slot Rack**: `src/ui/idleVillage/skins/slotRackSkinConfig.ts`
- **Individual Slot**: `src/ui/idleVillage/skins/slot/slotWildernessBronzeSkinConfig.ts`
- **Registry**: `src/ui/idleVillage/skins/SkinBindingRegistry.ts`

#### 3.1.2 Skin Binding Pattern
```typescript
// Component skin binding
const skinBinding = getComponentSkinBinding('ComponentId');
const skinClassName = generateSkinClassName('ComponentId', presetId, pillar);
const skinDataAttributes = useSkinDataAttributes();
```

### 3.2 Style Lab Integration

#### 3.2.1 Pillars
- **Frontier**: Minimal, rugged aesthetic
- **Wilderness**: Organic, natural elements
- **Empire**: Ornate, imperial styling

#### 3.2.2 Runtime Switching
- **Data Attributes**: `data-style-lab-pillar` per runtime switching
- **CSS Variables**: Token-driven styling per dynamic updates
- **Component Binding**: Certified components con skin contracts

### 3.3 Balancer Skin Mandate

#### 3.3.1 Target Surfaces
- **Balancer Dashboard**: High-density information panels
- **Spell Creator**: Configuration surfaces
- **Roster/Character**: Character management UI

#### 3.3.2 DOM Structure Requirements
```html
.card
  .card-overlay
  .card-inner
    .card-header
      .card-header-left
        .card-icon
        .card-title
      .card-actions
        .btn-card
    .plaques
      .plaque
        .stat-icon
        .stat-lbl
        .track-wrap
          .track
            .fill
            .thumb
```

---

## 4. Persistence Architecture

### 4.1 Persistence Service

#### 4.1.1 Core Service
- **File**: `src/shared/persistence/PersistenceService.ts`
- **API**: `saveData(key, data)`, `loadData(key)`, `clearData(key)`
- **Features**: Async operations, error handling, mobile-ready fallback

#### 4.1.2 Data Types
- **VillageState**: Complete game state
- **Config**: Game configuration and rules
- **Telemetry**: Event logs and analytics
- **Skin Preferences**: User skin selections

### 4.2 State Synchronization

#### 4.2.1 Autosave Strategy
- **Frequency**: Every 30 seconds or on significant state change
- **Triggers**: Activity completion, resource changes, quest resolution
- **Validation**: Schema validation before save

#### 4.2.2 Conflict Resolution
- **Last Write Wins**: For single-player local development
- **Versioning**: Timestamp-based conflict detection
- **Rollback**: Ability to revert to previous state

---

## 5. Telemetry Architecture

### 5.1 Event System

#### 5.1.1 Core Events
```typescript
// Quest events
'quest_started', 'quest_completed', 'quest_failed'
'quest_success_modal_shown', 'quest_rewards_collected'

// Activity events
'activity_scheduled', 'activity_completed', 'activity_collected'

// UI events
'skin_rendered', 'modal_shown', 'modal_closed'
'drag_start', 'drag_end', 'drop_success', 'drop_failed'
```

#### 5.1.2 Event Structure
```typescript
interface TelemetryEvent {
  eventType: string;
  timestamp: number;
  componentId?: string;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}
```

### 5.2 Tracking Strategy

#### 5.2.1 Event Batching
- **Batch Size**: 10 events per batch
- **Flush Interval**: 5 seconds
- **Local Storage**: Fallback for failed network requests

#### 5.2.2 Privacy Considerations
- **No PII**: No personally identifiable information
- **Local Only**: All telemetry stored locally for lab development
- **Opt-out**: Ability to disable telemetry collection

---

## 6. Testing Architecture

### 6.1 Test Strategy

#### 6.1.1 Test Types
- **Unit Tests**: Component logic, utility functions
- **Integration Tests**: Component interactions, data flow
- **E2E Tests**: Complete user flows
- **VRT Tests**: Visual regression testing

#### 6.1.2 Test Structure
```
tests/
  unit/
    idleVillage/
      TimeEngine.test.ts
      ActivityCapsule.test.ts
  integration/
    idleVillage/
      quest-flow.test.ts
      drag-drop.test.ts
  e2e/
    idleVillage/
      minimal-gameplay.e2e.spec.ts
      testRosterPgCards.spec.ts
  vrt/
    idleVillage/
      skin-vertical-slice.spec.ts
```

### 6.2 Test Data Management

#### 6.2.1 Fixtures
- **Location**: `tests/fixtures/idleVillage/`
- **Types**: Mock residents, quest definitions, village states
- **Usage**: Consistent test data across all test types

#### 6.2.2 Mock Providers
- **PersistenceService**: Mock for testing save/load
- **Telemetry**: Mock for event tracking
- **TimeEngine**: Mock for deterministic time progression

### 6.3 Quality Assurance

#### 6.3.1 Safeguard Suite
```bash
npm run lint -- <paths>
npm run test:unit -- <paths>
npm run build:check
npm run kanban:lint
```

#### 6.3.2 Evidence Logging
- **Location**: `test-results/<prompt-id>-<date>.log`
- **Content**: Lint output, test results, build status
- **Purpose**: Audit trail for all changes

---

## 7. Implementation Guidelines

### 7.1 Config-First Development

#### 7.1.1 Configuration Files
- **Location**: `src/balancing/config/idleVillage/`
- **Types**: `types.ts`, `minimalConfig.ts`, `testHarnessConfig.ts`
- **Validation**: Zod schemas for type safety

#### 7.1.2 No Hardcoding
- **All Values**: Must come from configuration
- **No Magic Numbers**: Use named constants from config
- **Dynamic Behavior**: Config-driven logic

### 7.2 Component Development

#### 7.2.1 Component Pattern
```typescript
// Standard component pattern
interface ComponentProps {
  // Props from config
  config?: ComponentConfig;
  // Skin data attributes
  skinDataAttributes?: Record<string, string>;
  // Test ID
  testId?: string;
}

const Component: React.FC<ComponentProps> = ({
  config,
  skinDataAttributes,
  testId
}) => {
  // Component logic
  return (
    <div {...skinDataAttributes} data-testid={testId}>
      {/* Component content */}
    </div>
  );
};
```

#### 7.2.2 Skin Integration
- **Data Attributes**: Always spread `skinDataAttributes`
- **CSS Classes**: Use generated classes from registry
- **Telemetry**: Track skin-related interactions

### 7.3 Error Handling

#### 7.3.1 Error Boundaries
- **Implementation**: React error boundaries for component trees
- **Fallback**: Graceful degradation for non-critical errors
- **Logging**: Error events to telemetry

#### 7.3.2 Validation
- **Input Validation**: Zod schemas for all external inputs
- **State Validation**: Runtime checks for state consistency
- **Recovery**: Automatic recovery where possible

---

## 8. Vertical Slice Implementation

### 8.1 Quest Success Modal (Task 12.4.6)

#### 8.1.1 Implementation Plan
```typescript
// Component structure
interface QuestSuccessModalProps {
  isOpen: boolean;
  questResult: QuestResult;
  rewards: ResourceDeltaDefinition[];
  onClose: () => void;
  onCollectRewards: () => void;
}

// Trigger point
const handleCollect = useCallback(() => {
  setShowQuestSuccessModal(true);
  trackTelemetryEvent('quest_success_modal_shown', {
    questId: activity.id,
    outcome: questResult.status
  });
}, [activity.id, questResult]);
```

#### 8.1.2 Data Requirements
- **Quest Result**: Status, duration, survivors, outcome details
- **Rewards**: Resources, XP, reputation, unlocks
- **Telemetry**: Modal shown, rewards collected, modal closed

### 8.2 Reward Application System (Task 12.4.7)

#### 8.2.1 Service Design
```typescript
// Reward service interface
interface RewardService {
  applyRewards(rewards: ResourceDeltaDefinition[]): Promise<void>;
  validateRewards(rewards: ResourceDeltaDefinition[]): boolean;
  rollbackRewards(rewards: ResourceDeltaDefinition[]): Promise<void>;
}

// Hook interface
interface UseRewardApplicationReturn {
  applyRewards: (rewards: ResourceDeltaDefinition[]) => Promise<void>;
  isApplying: boolean;
  error: string | null;
}
```

#### 8.2.2 Integration Points
- **VillageState**: Update resources, XP, resident stats
- **Persistence**: Save reward application
- **Telemetry**: Track reward collection

---

## 9. File Structure Reference

### 9.1 Core Files
```
src/
  engine/game/idleVillage/
    TimeEngine.ts
    statMatching.ts
  ui/idleVillage/
    components/
      ActiveActivityHUD.tsx
      ActivityCapsule.tsx
      QuestSuccessModal.tsx (to be created)
    hooks/
      useRewardApplication.ts (to be created)
    skins/
      SkinBindingRegistry.ts
      slotRackSkinConfig.ts
  balancing/config/idleVillage/
    types.ts
    minimalConfig.ts
  store/
    useMinimalGameplay.ts
  shared/persistence/
    PersistenceService.ts
```

### 9.2 Test Files
```
tests/
  unit/idleVillage/
    QuestSuccessModal.test.ts (to be created)
    RewardService.test.ts (to be created)
  e2e/idleVillage/
    quest-success-flow.e2e.spec.ts (to be created)
  vrt/idleVillage/
    quest-success-modal.vrt.spec.ts (to be created)
```

---

## 10. Maintenance Guidelines

### 10.1 Documentation Updates

#### 10.1.1 When to Update
- **New Components**: Add to component architecture section
- **New Features**: Update relevant sections
- **Breaking Changes**: Update all affected sections

#### 10.1.2 Review Process
- **Monthly Review**: Check for outdated information
- **Version Control**: Tag documentation versions
- **Peer Review**: Technical accuracy validation

### 10.2 Code Quality

#### 10.2.1 Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Custom rules for project consistency
- **Testing**: Minimum 80% coverage for new code

#### 10.2.2 Review Checklist
- [ ] Config-first implementation
- [ ] Proper error handling
- [ ] Telemetry integration
- [ ] Test coverage
- [ ] Documentation updates

---

## 11. References

### 11.1 Component Contracts & Governance
- **Master Index**: `[COMPONENT_MASTER_INDEX.md](../idle_village/COMPONENT_MASTER_INDEX.md)` - Single source of truth for component contracts
- **Time Engine Contract**: `[trusted/time_engine_trusted.md](../idle_village/trusted/time_engine_trusted.md)`
- **POI Standard Contract**: `[trusted/poi_standard_trusted.md](../idle_village/trusted/poi_standard_trusted.md)`
- **POI Detail Contract**: `[trusted/poi_detail_trusted.md](../idle_village/trusted/poi_detail_trusted.md)`
- **Day/Night Contract**: `[trusted/daynight_trusted.md](../idle_village/trusted/daynight_trusted.md)`
- **Governance Policy**: `[idle-village-documentation-governance-pack.md](../../idle-village-documentation-governance-pack.md)`

### 11.2 Project Philosophy
- **Weight-Based Creator Pattern**: All entity creation follows same pattern
- **Config-First Architecture**: No hardcoded values
- **Skin System**: Runtime pillar switching

### 11.3 Implementation Plans
- **Phase 12 Task Breakdown**: Complete vertical slice definition
- **Skin Rollout Plan**: Balancer skin application strategy
- **Testing Strategy**: Comprehensive test coverage

### 11.4 Style Guides
- **Art Direction Plan**: Visual design guidelines
- **Style Lab Flexibility**: Token system implementation
- **Game Feel Bible**: Interaction design patterns

---

## 12. Appendix

### 12.1 Glossary

- **Vertical Slice**: Complete implementation of core features
- **Config-First**: All behavior driven by configuration
- **Skin Binding**: Component-skin relationship
- **Pillar Switching**: Runtime theme switching
- **Telemetry**: Event tracking and analytics

### 12.2 Quick Reference

#### 12.2.1 Common Patterns
```typescript
// Skin binding pattern
const skinDataAttributes = useSkinDataAttributes();
const skinBinding = getComponentSkinBinding('ComponentId');

// Telemetry pattern
trackTelemetryEvent('event_name', {
  componentId: 'ComponentId',
  context: { key: 'value' },
  timestamp: Date.now()
});

// Persistence pattern
await PersistenceService.saveData('key', data);
const loaded = await PersistenceService.loadData('key');
```

#### 12.2.2 File Locations
- **Components**: `src/ui/idleVillage/components/`
- **Hooks**: `src/ui/idleVillage/hooks/`
- **Config**: `src/balancing/config/idleVillage/`
- **Types**: `src/balancing/config/idleVillage/types.ts`
- **Tests**: `tests/unit/idleVillage/`, `tests/e2e/idleVillage/`

---

**Questo documento fornisce un overview architetturale di Idle Village. Per i contratti componenti dettagliati, fare riferimento al Master Index e ai documenti trusted.**
