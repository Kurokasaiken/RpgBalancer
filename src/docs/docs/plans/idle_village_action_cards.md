# Idle Village – ActionCard Architecture V2

> Fonte ufficiale per la nuova architettura wrapper-based (IV-ACT series).

## Overview

La nuova architettura ActionCard V2 utilizza un sistema di wrapper specializzati basati su `resolveActionCardProps` per eliminare hardcoding e fornire un'interfaccia config-first per tutte le attività del villaggio.

## 1. Architettura Wrapper-Based

### 1.1 Componenti Principali

```
ActionCardWrapper (centrale)
├── resolveActionCardProps() → ResolvedActionCardDescriptor
├── JobCard (per attività job)
├── QuestCard (per attività quest)  
├── TrainingCard (per attività training)
└── MaintenanceCard (per attività maintenance)
```

### 1.2 ActionCardWrapper

**File**: `src/ui/idleVillage/components/ActionCardWrapper.tsx`

Componente centrale che:
- Usa `resolveActionCardProps()` per generare props corrette
- Renderizza il wrapper appropriato basato su `cardKind`
- Supporta flag `VILLAGE_ACTIONCARDS_V2` per migrazione graduale
- Fallback a `JobCard` per tipi non riconosciuti

```typescript
interface ActionCardWrapperProps {
  activity: ActivityDefinition;
  scheduled?: ScheduledActivity;
  config: IdleVillageConfig;
  residents?: Record<string, ResidentState>;
  currentTime?: number;
  secondsPerTimeUnit?: number;
  onCollect?: () => void;
  dataTestId?: string;
}
```

### 1.3 resolveActionCardProps

**File**: `src/ui/idleVillage/utils/activityCardMapping.ts`

Funzione pura che:
- Prende `ActivityDefinition` + context
- Calcola `cardKind` (job/quest/training/maintenance)
- Genera `ActionCardProps` complete
- Gestisce progress, risk, assignees, telemetry

```typescript
export function resolveActionCardProps(
  params: ResolveActionCardPropsParams
): ResolvedActionCardDescriptor {
  // Calcola cardKind, props, metadati
  return { cardKind, props };
}
```

## 2. Wrapper Specializzati

### 2.1 JobCard

**File**: `src/ui/idleVillage/map/actionCards/wrappers/JobCard.tsx`

- Per attività di tipo lavoro (woodcutting, mining, etc.)
- Visual variant: `solar` (golden/heroic theme)
- Props semantiche ridotte, usa `ActionCard` base

### 2.2 QuestCard

**File**: `src/ui/idleVillage/map/actionCards/wrappers/QuestCard.tsx`

- Per attività quest con narrative e risk
- Visual variant: `amethyst` (mystical theme)
- Supporta heroic feedback, quest phases

### 2.3 TrainingCard

**File**: `src/ui/idleVillage/map/actionCards/wrappers/TrainingCard.tsx`

- Per attività di training/resident improvement
- Visual variant: `ember` (fire/training theme)
- Focus su stat progression e fatigue

### 2.4 MaintenanceCard

**File**: `src/ui/idleVillage/map/actionCards/wrappers/MaintenanceCard.tsx`

- Per attività di manutenzione (food upkeep, injury recovery)
- Visual variant: `jade` (nature/healing theme)
- Focus su resource management e recovery

## 3. Config-First Design

### 3.1 ActivityDefinition

Ogni attività definisce:
```typescript
interface ActivityDefinition {
  id: string;
  label: string;
  kind: 'job' | 'quest' | 'training' | 'maintenance';
  rewards: ResourceBundle;
  statRequirement?: StatRequirement;
  risk?: RiskProfile;
  // ... altre proprietà config-first
}
```

### 3.2 CardKind Resolution

```typescript
export function resolveCardKind(activity: ActivityDefinition): CardKind {
  return activity.kind ?? 'job'; // Fallback sicuro
}
```

### 3.3 Style Lab Integration

Tutti i wrapper usano:
- `useActionCardTheme()` per variant colors
- `useActionCardFeel()` per interactions
- Token system per consistenza visiva

## 4. Migration Strategy

### 4.1 Flag-Based Migration

```typescript
// .env.local
VILLAGE_ACTIONCARDS_V2=true  // Abilita nuovi wrapper
```

### 4.2 Conditional Rendering Pattern

```typescript
{useActionCardsV2() ? (
  <ActionCardWrapper {...newProps} />
) : (
  <ActivityActionCard {...legacyProps} />
)}
```

### 4.3 Consumer Status

✅ **Already Migrated**:
- ActiveActivityHUD
- BoutCard  
- GymShiftCard
- TestRosterPage

⏳ **Migration Needed**:
- Eventuali altri consumer diretti

## 5. Telemetry & Events

### 5.1 Telemetry Integration

Tutti i wrapper emettono:
- `action_card_rendered` (render)
- `action_card_clicked` (interaction)
- `action_card_collected` (completion)
- `wrapper_specific_events` (per tipo)

### 5.2 Event Payload

```typescript
interface ActionCardTelemetryEvent {
  cardKind: CardKind;
  activityId: string;
  wrapperType: string;
  timestamp: number;
  metadata: Record<string, any>;
}
```

## 6. Testing Strategy

### 6.1 Unit Tests

**File**: `tests/unit/idleVillage/ActionCardWrappers.test.tsx`

Coverage:
- `resolveActionCardProps` logic
- Wrapper rendering per cardKind
- Props forwarding
- Edge cases (fallback, missing data)

### 6.2 Integration Tests

- ActiveActivityHUD integration
- Drag/drop functionality
- Telemetry events

> **Update – 2026-03-02**  
> Il panel di anteprima ActionCard su TestRosterPage è stato rimosso per ridurre il rumore visivo nel test harness.  Le suite `/tests/unit/testRosterPage/*` ora verificano esclusivamente roster, rack e HUD: nessun `data-testid="action-preview-panel"` o evento `slot_lab_action_preview_ready` è più atteso.

### 6.3 Visual Regression

- Playwright snapshots per tutti i wrapper
- Variant testing (solar/ember/jade/amethyst)
- State testing (idle/active/completed)

## 7. Performance Considerations

### 7.1 Memoization

- `resolveActionCardProps` è pura e memoizzabile
- Wrapper components usano `React.memo`
- Props minimali per ridurre re-renders

### 7.2 Bundle Size

- Wrapper condividono `ActionCard` base
- Code splitting per variant specifiche
- Tree-shaking per unused wrappers

## 8. Future Extensions

### 8.1 New Card Types

Aggiungere nuovi wrapper:
1. Definire nuovo `CardKind`
2. Creare wrapper component
3. Aggiungere case in `ActionCardWrapper`
4. Estendere test coverage

### 8.2 Advanced Features

- Animated transitions between wrapper types
- Dynamic variant selection
- Custom wrapper registration
- Plugin system per card behaviors

## 9. Deprecation Path

### 9.1 ActivityActionCard Deprecation

**Status**: Deprecated (IV-ACT-LEGACY-CLEANUP-006)

- JSDoc `@deprecated` tags
- Runtime console warnings
- Migration guide available
- Removal planned for future release

### 9.2 Cleanup Timeline

1. ✅ Phase 1: Add deprecation warnings
2. ✅ Phase 2: Migrate all consumers  
3. ⏳ Phase 3: Remove ActivityActionCard
4. ⏳ Phase 4: Remove fallback logic

## 10. Documentation References

- [Migration Guide](/docs/ACTIVITY_ACTION_CARD_MIGRATION.md)
- [Style Lab Tokens](/src/ui/styleLab/tokens/)
- [Idle Village Plan §12.9](/src/docs/docs/plans/idle_village_plan.md#528-537)
- [Test Evidence](/test-results/iv-act-doc-007-2026-02-25.log)

---

**Last Updated**: 2026-02-25  
**Related Tasks**: IV-ACT-001 through IV-ACT-006  
**Maintainer**: Cascade (RPG Balancer Team)
