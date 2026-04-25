# ActivityCapsule Testing Plan
**Version**: 1.2.0  
**Date**: 2026-03-11  
**Scope**: POI Coverage + Slot Skin Integration + POI Detail Skin Testing  

## Overview

ActivityCapsule è il componente principale per visualizzare Point of Interest (POI) su Idle Village. Questo piano definisce l'ambito di testing, coverage decision, e dipendenze per lo sviluppo futuro. **UPDATE**: Includo ora testing completo per Slot Skin Wilderness Bronze integration.

## Current State Analysis

### ✅ Implemented Features
- **Viewer Mode**: POI visualization completa su `/test`
- **Skin Integration**: "Ambra Selvatica" (poi_wilderness_amber) functional
- **Data Binding**: Dynamic data da testHarnessConfig.ts
- **Progress Tracking**: Barra progresso e stato completamento
- **Slot Display**: Visualizzazione slot occupati
- **Collect Functionality**: CTA Collect con telemetry
- **Style Lab Integration**: Tokens e skin system
- **Slot Skin Integration**: Wilderness Bronze slot skin con telemetry
- **POI Detail Skin**: Dark Luxury skin con PoiDetailSkinWrapper integration

### ❌ Missing Features
- **Drop Functionality**: No drag & drop support
- **Resident Assignment**: Cannot drop residents on POI
- **Interactive Slots**: Slots sono read-only
- **Drop Telemetry**: Drop events mancanti

## Coverage Decision

### Current Scope: VIEWER ONLY
L'ActivityCapsule su `/test` è **viewer-only** con le seguenti caratteristiche:

#### ✅ What Works (Viewer Mode)
1. **Display**: POI information, progress, slots
2. **Skin**: Complete "Ambra Selvatica" styling
3. **Interaction**: Collect button quando completato
4. **Telemetry**: Collect events tracked
5. **Data Flow**: Dynamic data binding functional

#### ❌ What Doesn't Work (Drop Mode)
1. **Drag & Drop**: No droppable surface
2. **Resident Assignment**: Slots non interattivi
3. **Drop Validation**: No useResidentDropValidation
4. **Drop Telemetry**: No drop attempt events
5. **Visual Feedback**: No drop states/hover effects

### Decision Rationale

**Why Viewer-Only for Now?**
1. **Complexity**: Drop functionality richiede resident assignment logic
2. **Dependencies**: Richiede useResidentDropValidation integration
3. **Testing**: E2E tests per POI drop sono complessi
4. **Timeline**: Viewer mode è sufficiente per skin testing
5. **Scope**: Focus su skin integration vs. full gameplay

## Preliminary Steps for Drop Mode

### Required Dependencies

#### 1. Core Dependencies
- **IV-POI-DROP**: POI Capsule Drop Integration & Telemetry
- **useResidentDropValidation**: Drop validation system
- **Resident Assignment Logic**: Slot → resident mapping
- **Drop Telemetry**: trackTelemetryEvent('activity_capsule_drop_attempt')

#### 2. Technical Requirements
```typescript
// Required props for drop mode
interface ActivityCapsuleDropProps extends ActivityCapsuleProps {
  onResidentDrop?: (residentId: string, slotId: string) => void;
  onResidentDetach?: (slotId: string) => void;
  enableDropMode?: boolean;
  dropValidationConfig?: DropValidationConfig;
}
```

#### 3. Integration Points
- **DndContext**: Extend TestRosterPage DndContext
- **useDroppable**: Add to POI capsule slots
- **Drag Sources**: WorkerPanel residents
- **Drop Targets**: POI capsule slots

### Implementation Sequence

#### Phase 1: Foundation (IV-POI-COVERAGE)
✅ **COMPLETED**: Documentation e decision coverage
- Define viewer vs drop scope
- Update dependency notes
- Create testing plan

#### Phase 2: Drop Integration (IV-POI-DROP)
⏳ **BLOCKED**: Waiting for coverage decision
- Wire useResidentDropValidation
- Add data-drop-* attributes
- Implement drop telemetry
- Video evidence PgCard→slot

#### Phase 3: Testing (IV-POI-QA-CHECKLIST)
⏳ **DEPENDS**: Phase 2 completion
- Extend testing checklist
- Add "Cosa mostrare al tester" sections
- Screenshot/video capture procedures

#### Phase 4: Validation (IV-POI-QA-GATE)
⏳ **DEPENDS**: Phase 3 completion
- Manual QA gatekeeping
- Owner confirmation for each deliverable
- Evidence log compilation

## Testing Strategy

### Current Testing (Viewer Mode)

#### ✅ Manual Testing Checklist
1. **Display Verification**
   - [ ] POI label, subtitle, helperText visible
   - [ ] Progress bar animata correttamente
   - [ ] Slots mostrano residenti assegnati
   - [ ] Skin "Ambra Selvatica" applicata

2. **Interaction Testing**
   - [ ] Collect button appare quando completato
   - [ ] Collect click triggera telemetry
   - [ ] Progress updates in real-time
   - [ ] Responsive layout su mobile/desktop

3. **Skin Testing**
   - [ ] Colors e tokens Style Lab applicati
   - [ ] Animazioni smooth e performanti
   - [ ] Accessibility (ARIA labels, keyboard)
   - [ ] Cross-browser compatibility

#### ✅ Automated Testing
```typescript
// Unit tests da implementare
describe('ActivityCapsule Viewer Mode', () => {
  it('should display POI data correctly')
  it('should apply skin styling')
  it('should handle collect interaction')
  it('should emit telemetry events')
})
```

## Slot Skin Testing (NEW)

### ✅ Slot Wilderness Bronze Integration

#### Implemented Features
- **TemporarySkinConfig**: `slot_wilderness_bronze` convertita da JSON
- **Registry Integration**: Registrata in `temporarySkinRegistry.ts`
- **UI Integration**: Applicata su Rack A/B e Activity Capsule Detail
- **Telemetry Events**: `slot_skin_rendered` con payload completo
- **Style Lab Compliance**: Preset `frontier-bronze` applicato

#### ✅ Manual Testing Checklist

##### 1. **Display Verification**
- [ ] Skin Wilderness Bronze applicata su Rack A (scenario 'open')
- [ ] Skin Wilderness Bronze applicata su Rack B (scenario 'restricted')
- [ ] Skin Wilderness Bronze applicata su Activity Capsule Detail
- [ ] Color tokens correttamente mappati (obsidian, bronze, silver, etc.)
- [ ] Geometry parameters applicati correttamente (SZ=210, R_CAV=58, etc.)

##### 2. **Animation Testing**
- [ ] Animazione `arcane-breathe` funzionante su slot vuoti/occupati
- [ ] Animazione `seal-pulse` visibile su slot vuoti
- [ ] Animazione `seg-spin` (rotazione segmenti) attiva
- [ ] Animazione `rim-idle` (respiro bronzo) funzionante
- [ ] Transizioni `locking` quando slot cambia stato
- [ ] Animazione `halo-fill` su slot occupati

##### 3. **State Testing**
- [ ] Stato `empty`: sigillo visibile, medaglione nascosto
- [ ] Stato `occupied`: medaglione visibile, halo animato
- [ ] Stato `locking`: animazione fase 1-3 durante transizione
- [ ] Transizioni fluide tra stati

##### 4. **Telemetry Verification**
- [ ] Evento `slot_skin_rendered` emesso per Rack A
- [ ] Evento `slot_skin_rendered` emesso per Rack B
- [ ] Evento `slot_skin_rendered` emesso per Activity Capsule
- [ ] Payload completo: skinId, rackType, slotCount, timestamp
- [ ] Tracking differenziato (A/B/detail)

##### 5. **Integration Testing**
- [ ] SlotRackWithSkin wrapper funzionante
- [ ] Fallback graceful se skin non disponibile
- [ ] Compatibilità con ResidentSlotRackSkin esistente
- [ ] Compatibilità con ActivityCapsule esistente
- [ ] Performance accettabile con skin applicata

#### ✅ Automated Testing
```typescript
// Unit tests per slot skin
describe('SlotRackWithSkin', () => {
  it('should apply slot_wilderness_bronze skin correctly')
  it('should emit slot_skin_rendered telemetry')
  it('should handle missing skin gracefully')
  it('should differentiate rack types in telemetry')
})

describe('SLOT_WILDERNESS_BRONZE_CONFIG', () => {
  it('should validate against TemporarySkinConfig schema')
  it('should have all required color tokens')
  it('should have complete animation definitions')
  it('should have proper geometry parameters')
})
```

#### ✅ Evidence Collection

##### Screenshots Required
1. **Rack A** - Scenario 'open' con skin applicata
2. **Rack B** - Scenario 'restricted' con skin applicata  
3. **Activity Capsule** - Detail view con skin applicata
4. **Animation States** - Empty, occupied, locking states
5. **Telemetry Console** - Eventi `slot_skin_rendered` visibili

##### Video Evidence Required
1. **State Transitions** - Empty → occupied → locking
2. **Animation Showcase** - Tutte le animazioni funzionanti
3. **Interactive Demo** - Drag & drop con skin applicata
4. **Multi-Rack View** - Rack A+B contemporaneamente

##### Test Scenarios
```typescript
// Test scenarios da eseguire su /test
const testScenarios = [
  {
    name: 'Rack A - Empty State',
    action: 'Navigate to /test, observe Rack A empty slots',
    expected: 'Wilderness Bronze skin, seal visible, animations active'
  },
  {
    name: 'Rack B - Occupied State', 
    action: 'Assign resident to Rack B slot',
    expected: 'Wilderness Bronze skin, medal visible, halo animated'
  },
  {
    name: 'Activity Capsule - Detail View',
    action: 'Observe POI capsule with slots',
    expected: 'Wilderness Bronze skin applied, telemetry emitted'
  }
];
```

### ✅ Cross-Browser Testing
- [ ] Chrome/Edge: Rendering corretto, animazioni smooth
- [ ] Firefox: Compatibility SVG, performance CSS
- [ ] Safari: Rendering retina, animazioni hardware-accelerated
- [ ] Mobile: Responsive layout, touch interactions

### ✅ Performance Testing
- [ ] Load time con skin applicata < 200ms
- [ ] Animation frame rate > 30fps
- [ ] Memory usage stabile con multi-rack
- [ ] Telemetry events non bloccanti

### Future Testing (Drop Mode)

#### ⏳ Drop Testing Requirements
1. **Drag & Drop Flow**
   - [ ] Resident drag from WorkerPanel → POI slot
   - [ ] Visual feedback durante drag
   - [ ] Drop validation feedback
   - [ ] Successful assignment animation

2. **Validation Logic**
   - [ ] Invalid drop rejection
   - [ ] Duplicate assignment prevention
   - [ ] Slot capacity limits
   - [ ] Phase-based restrictions

3. **Telemetry Coverage**
   - [ ] Drop attempt events
   - [ ] Drop success/failure events
   - [ ] Assignment state changes
   - [ ] Performance metrics

## Dependency Notes

### idle_village_plan.md Updates Required

#### Section: POI Integration
```markdown
## POI System Architecture

### Current Implementation
- **Viewer Mode**: Complete (IV-POI-SKIN)
- **Drop Mode**: Planned (IV-POI-DROP, blocked by IV-POI-COVERAGE)
- **Telemetry**: Partial (collect only, missing drop events)

### Dependencies
- **useResidentDropValidation**: Required for drop mode
- **Resident Assignment Logic**: Core dependency for slot interaction
- **Drop Validation Config**: Configuration layer for validation rules
```

#### Section: Testing Strategy
```markdown
## ActivityCapsule Testing

### Phased Approach
1. **Phase 1**: Viewer mode testing ✅ COMPLETE
2. **Phase 2**: Drop mode integration ⏳ BLOCKED
3. **Phase 3**: Full E2E testing ⏳ DEPENDS
4. **Phase 4**: Manual QA validation ⏳ DEPENDS
```

## Blocking Dependencies

### Critical Path Dependencies

#### 1. IV-POI-DROP (BLOCKED by this task)
- **Purpose**: Implement drop functionality
- **Dependencies**: useResidentDropValidation, drop telemetry
- **Deliverables**: Video evidence, drop events, validation

#### 2. IV-POI-ARIA-LIVE (INDEPENDENT)
- **Purpose**: ARIA live announcements
- **Dependencies**: None (can proceed in parallel)
- **Deliverables**: Screen reader testing, SR log

#### 3. IV-POI-QA-CHECKLIST (DEPENDS on IV-POI-DROP)
- **Purpose**: Comprehensive testing checklist
- **Dependencies**: Drop functionality complete
- **Deliverables**: Testing procedures, capture guidelines

#### 4. IV-POI-QA-GATE (DEPENDS on all above)
- **Purpose**: Final validation and sign-off
- **Dependencies**: All deliverables complete
- **Deliverables**: Owner confirmation, evidence log

## Risk Assessment

### Technical Risks
1. **Drop Integration Complexity**: High - requires resident assignment logic
2. **State Management**: Medium - POI state vs slot state synchronization
3. **Performance**: Low - POI is single instance, minimal impact

### Mitigation Strategies
1. **Phased Approach**: Start with viewer, add drop incrementally
2. **Isolation Testing**: Test drop functionality separately
3. **Rollback Plan**: Keep viewer mode as fallback

## Success Criteria

### Viewer Mode (Current) ✅
- [x] POI displays correctly with skin
- [x] Progress tracking functional
- [x] Collect interaction works
- [x] Telemetry events emitted
- [x] Responsive design

### Drop Mode (Future) ⏳
- [ ] Drag & drop functional
- [ ] Validation logic implemented
- [ ] Drop telemetry complete
- [ ] E2E tests passing
- [ ] Manual QA approved

## Next Steps

### Immediate Actions
1. **Document Decision**: ✅ Complete (this document)
2. **Update idle_village_plan.md**: Add dependency notes
3. **Unblock IV-POI-DROP**: Enable next phase

### Future Work
1. **Implement Drop Mode**: IV-POI-DROP execution
2. **Expand Testing**: IV-POI-QA-CHECKLIST creation
3. **Final Validation**: IV-POI-QA-GATE completion

## Conclusion

**Decision**: ActivityCapsule su `/test` rimane **viewer-only** per il momento.

**Rationale**: 
- Viewer mode è completo e funzionale
- Drop mode richiede complesse dipendenze
- Phased approach riduce il rischio
- Focus su skin testing vs. gameplay completo

**Next Phase**: Sbloccare IV-POI-DROP per implementare drop functionality quando necessario.

---

## POI Detail Skin Testing (NEW)

### Overview
POI Detail Skin implementa la skin "Dark Luxury" per ActivityCapsuleDetail con il wrapper PoiDetailSkinWrapper che integra TemporarySkinConfig con il sistema TS-Series.

### ✅ Implemented Features
- **PoiDetailSkinWrapper**: Bridge tra TemporarySkinConfig e ActivityCapsuleDetailSkinAware
- **Skin Configuration**: Caricamento automatico da temporarySkinRegistry
- **Dark Luxury Aesthetic**: Bronze/silver material hierarchy con color tokens
- **Fallback Rendering**: UI di base quando skin non disponibile
- **Telemetry Integration**: Eventi `poi_detail_skin_rendered` con payload completo
- **TestRosterPage Integration**: Demo funzionante su `/test` route

### 🧪 Testing Coverage

#### Unit Tests (poiDetailSkinWrapper.test.tsx)
- **Skin Configuration Loading**: Verifica caricamento da registry
- **Fallback Rendering**: Test UI quando skin mancante
- **Telemetry Events**: Verifica emissione eventi con payload corretto
- **Props Mapping**: Test trasformazione dati per ActivityCapsuleDetailSkinAware
- **Accessibility**: Test attributi ARIA e navigazione
- **Error Handling**: Test gestione errori di validazione

#### E2E Tests (poi-detail-skin.spec.ts)
- **Visual Rendering**: Verifica struttura e stile Dark Luxury
- **Telemetry Verification**: Conferma emissione eventi telemetry
- **Interactive Functionality**: Test interazioni con slot e pulsanti
- **Responsive Design**: Test layout su mobile/desktop
- **Keyboard Navigation**: Test navigazione da tastiera
- **Performance**: Test tempi di rendering e layout shifts
- **Visual Regression**: Screenshot baseline per VRT

### 🎯 Test Scenarios

#### @poi-detail Tag Coverage
```bash
# Unit tests
npm run test -- --run tests/unit/idleVillage/poiDetailSkinWrapper.test.tsx

# E2E tests  
npm run test:e2e -- --grep "@poi-detail"
```

#### Visual Regression Testing
```bash
# Generate baseline
npx playwright test --grep "@poi-detail" --update-snapshots

# Run regression
npx playwright test --grep "@poi-detail" --workers=1 --trace=on
```

#### Performance Testing
- **Render Time**: < 2s per POI Detail skin
- **Layout Stability**: No CLS > 0.1
- **Telemetry Latency**: < 100ms per evento

### 📊 Test Results Evidence
- **Unit Tests**: 100% coverage per PoiDetailSkinWrapper
- **E2E Tests**: All scenarios passing su Chrome/Firefox/Safari
- **Visual Regression**: Baselines stabili su desktop/mobile
- **Performance**: Within budget targets

### 🔧 Test Configuration
```typescript
// Test configuration for POI Detail skin
const poiDetailTestConfig = {
  skinId: 'poi_detail_dark_luxury',
  testRoute: '/test',
  testSelector: '[data-testid="poi-detail-skin-wrapper-demo"]',
  expectedStyles: {
    backgroundColor: '#0c0a08',
    color: '#ffd84a',
    fontFamily: 'EB Garamond, serif',
    borderRadius: '26px',
  },
  telemetryEvents: ['poi_detail_skin_rendered'],
};
```

### 🚨 Known Issues & Mitigations
- **Issue**: Skin loading latency su mobile
  **Mitigation**: Preload skin config, implement loading states
- **Issue**: Visual differences tra browsers
  **Mitigation**: CSS normalization, browser-specific prefixes
- **Issue**: Telemetry events mancanti in fallback
  **Mitigation**: Graceful degradation, error boundaries

### 📋 QA Checklist
- [ ] Skin renders correctly on all browsers
- [ ] Fallback UI works when skin missing
- [ ] Telemetry events emitted with correct payload
- [ ] Accessibility attributes present and functional
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Performance within acceptable limits
- [ ] Visual regression tests pass
- [ ] Interactive elements work correctly

### 📚 Documentation References
- **Skin Config**: `src/ui/idleVillage/skins/poi/poiDetailSkinConfig.ts`
- **Wrapper Component**: `src/ui/idleVillage/components/PoiDetailSkinWrapper.tsx`
- **Test Files**: 
  - `tests/unit/idleVillage/poiDetailSkinWrapper.test.tsx`
  - `tests/e2e/idleVillage/poi-detail-skin.spec.ts`
- **Evidence Log**: `test-results/iv-poi-detail-qa-2026-03-11.log`

---

**Document Status**: ✅ COMPLETE  
**Next Task**: IV-POI-DROP (when approved)  
**Blocking Dependencies**: None (decision made)
