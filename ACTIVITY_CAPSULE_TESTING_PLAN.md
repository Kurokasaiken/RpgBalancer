# ActivityCapsule Testing Plan
## POI Behavior Analysis & Integration Testing

### 📋 **CURRENT STATE ANALYSIS**

#### **Component Overview:**
- **File**: `src/ui/idleVillage/components/ActivityCapsule.tsx`
- **Purpose**: POI (Point of Interest) capsule for activity details with slot display
- **Integration**: Used in `VerticalSliceTestSection` on test page
- **Design Reference**: `capsule-detail-window.html` (HTML prototype)

#### **Current Implementation:**
```typescript
export interface ActivityCapsuleProps {
  activityId: string;
  label: string;
  icon?: React.ReactNode;
  slots: ActivitySlotData[];
  progressFraction: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  status: 'idle' | 'in-progress' | 'completed' | 'blocked';
  canCollect: boolean;
  onCollect?: () => void;
  onSlotClick?: (slotId: string) => void;
  onSlotHover?: (slotId: string, isHovering: boolean) => void;
  pillar?: StyleLabPillar;
  skinPresetOverrideId?: string;
  // ... display and accessibility options
}
```

---

### 🎯 **DOCUMENTATION ANALYSIS**

#### **What Documentation Says:**

**1. From `ACTIVITY_ACTION_CARD_MIGRATION.md`:**
- ActivityCapsule replaces deprecated ActivityActionCard
- Uses config-first architecture with `ActivityCapsuleWrapper`
- Integration with `resolveActionCardProps` for prop generation
- Flag-controlled: `VILLAGE_ACTIONCARDS_V2=true`

**2. From `idle_village_plan.md`:**
- Mini ActivitySlot cards support focus management
- ARIA labels auto-generation with activity status and resident info
- Keyboard shortcuts (Enter/Space for activation)
- Arrow key navigation between cards
- Screen reader support with `sr-only` labels
- Data attributes for testing: `data-activity-id`, `data-resident`, `data-progress`

**3. From Component Code:**
- Config-first skin system with Style Lab tokens
- Telemetry events: `activity_capsule_rendered`, `activity_capsule_collect`, `activity_capsule_slot_click`
- CSS custom properties for theming
- Responsive grid layout for slots
- Progress bar with liquid gold shimmer effect

---

### 🛠️ **PRELIMINARY IMPLEMENTATION STEPS (COORDINATOR CHECKLIST)**

1. **Decisione Coverage POI `/test` (viewer vs drop-enabled)**
   - Fonte: `DEFAULT_TEST_HARNESS_CONFIG.poi` @src/balancing/config/idleVillage/testHarnessConfig.ts#60-84.
   - Azione: definire se l’istanza POI resta *read-only* (solo telemetria/collect) o se riceve drop diretto di PgCard (mini rack interno).
   - Dipendenze: `ResidentSlotRack` behaviors @src/ui/idleVillage/components/ResidentSlotRack.tsx#400-604, `useResidentDropValidation` hook.
   - Output: nota nel piano + update in `docs/plans/idle_village_plan.md` (se influisce su roadmap Fase 12).

2. **Matrice stato reale vs gap (baseline QA)**
   - Inserire tabella “Implementato / Da implementare prima dei test” per Display, Interaction, Accessibility, Drag & Drop, Telemetry, Performance.
   - Stato attuale (POI `/test`):

     | Sezione | Implementato | Gap |
     | --- | --- | --- |
     | Display/Status | ✅ label, progress, timer, CTA, skin override (fix) | ⚠️ nessun stress test > gridColumns |
     | Interaction | ✅ click/hover/collect | ❌ keyboard nav, focus ring |
     | Accessibility | ⚠️ aria-label generico, aria-live on/off | ❌ annunci puntuali slot/progress |
     | Drag & Drop | ⚠️ solo tramite ResidentSlotRack | ❓ drop diretto se richiesto |
     | Telemetry | ✅ rendered/collect/slot_click | ❓ drag events se drop diretto |
     | Performance/VRT | ❌ assenti | Implementare instrumentation/test |

   - Aggiorna la tabella quando i gap vengono colmati.

3. **Implementare gap funzionali prioritari**
   - **Keyboard & Focus sugli slot**:
     - Reusa `useActivitySlotInteractions` @src/ui/idleVillage/hooks/useActivitySlotInteractions.ts#1-226.
     - Ogni slot deve avere `role="button"`, `tabIndex`, gestione `Arrow/Enter/Space`, focus ring Style Lab (`skinConfig.layout.focusRing`).
   - **ARIA live granulari**:
     - Se `skinConfig.enableAriaLive`, aggiungere annunci specifici per progress/occupancy (`aria-live="polite"` + region dedicata) @ActivityCapsule.tsx#291-447.
   - **Drop diretto (se deciso al punto 1)**:
     - Integrare `useResidentDropValidation` e gli attributi `data-drop-*` come in `ResidentSlotRack`.
     - Propagare eventi `dragEnter/Leave/Drop` e telemetria `activity_capsule_drop_attempt`.
   - **POI Viewer: mantenere i dati reali**
     - In `TestRosterPage.tsx` l'istanza POI deve continuare a usare `poiCapsuleData` completo (label, subtitle, helper, slots, progress, CTA). L'iniezione della skin (`enablePoiVisualization`, `poiSkinId`) va applicata sopra la versione config-driven esistente, non sostituendola con uno stub vuoto.
     - Ogni modifica al rendering POI deve preservare telemetria e logica di business (collect, slot occupancy) per consentire test end-to-end.

4. **Aggiornare piano + documentazione dopo i merge**
   - Annotare nelle fasi test quali prerequisiti sono “Done / Pending”.
   - Aggiornare `Documentation Analysis` con i nuovi file (es. `ActivityCapsuleKeyboard.md` se creato) e con eventuali nuovi token in `skinConfigRegistry`.
   - Aggiungere reference incrociati (file, commit) in appendice.

5. **Esecuzione test solo dopo i prerequisiti**
   - RTL A11y + keyboard (ispirati a `ActivitySlotMiniCard.a11y.test.tsx`).
   - Playwright `/test` per verifying drop/telemetry (se abilitato).
   - Performance (profiling render) e VRT vs `capsule-detail-window.html` una volta che i gap visivi sono chiusi.

### Manual QA Feedback Gate

- **Requirement:** ogni nuova funzionalità o surface verificabile manualmente deve essere presentata all'owner (utente) per conferma esplicita prima di chiudere il task.
- **Applicazione:** aggiungere, per ciascun punto del piano (display, interaction, dnd, telemetry, ecc.), una checklist “Cosa mostrare al tester” e il canale dove inviare screenshot/video/URL `/test`.
- **Exit Criteria:** il coordinator considera il punto “Done” solo dopo che l’utente ha dato feedback “implementazione corretta”; senza questo check il passo resta aperto anche se i test automatici passano.

### EXPECTED BEHAVIORS

#### 1. Display Behaviors

```typescript
// Visual States
status: 'idle' | 'in-progress' | 'completed' | 'blocked'
// → Different CSS classes and visual indicators

// Progress Display
progressFraction: 0.65  // → 65% progress bar
elapsedSeconds: 45      // → Timer shows remaining time
totalDurationSeconds: 120

// Slot Display
slots: [
  {slotId: 'slot-1', assignedWorkerName: 'John', isOccupied: true},
  {slotId: 'slot-2', assignedWorkerName: null, isOccupied: false}
]
// → Grid layout with worker avatars/initials
```

#### **2. Interaction Behaviors:**
```typescript
// Slot Interactions
onSlotClick?: (slotId: string) => void
onSlotHover?: (slotId: string, isHovering: boolean) => void
// → Should trigger hover effects and click handlers

// Collect Action
canCollect: boolean
onCollect?: () => void
// → Show/hide CTA button, handle collect with loading state

// Activity Click
onActivityClick?: () => void
// → Make entire capsule clickable
```

#### **3. Accessibility Behaviors:**
```typescript
// ARIA Support
ariaLabel?: string
ariaLive?: 'polite' | 'assertive' | 'off'
// → Auto-generate labels if not provided

// Screen Reader
// → Announce status changes, progress updates, slot assignments
```

#### **4. Skin/Theme Behaviors:**
```typescript
// Pillar Variants
pillar?: 'frontier' | 'wilderness' | 'empire'
// → Different color schemes and styling

// Skin Overrides
skinPresetOverrideId?: string
skinConfigOverride?: Partial<ActivityCapsuleSkinConfig>
// → Custom styling and animations
```

---

### 🔗 **PG TOKEN INTEGRATION BEHAVIORS**

#### **Expected Drag & Drop Integration:**
```typescript
// From documentation analysis:
// 1. PgCard (draggable) → ActivityCapsule (droppable slots)
// 2. Drop validation via useDropValidation
// 3. Visual feedback during drag operations
// 4. Slot assignment updates
// 5. Telemetry tracking for drag/drop events

// Expected Integration Points:
interface SlotIntegration {
  // Drop Validation
  canAcceptDrop: (residentId: string, slotId: string) => boolean;
  
  // Drop Handler
  onResidentDrop: (slotId: string, residentId: string) => void;
  
  // Visual Feedback
  dropState: 'idle' | 'valid' | 'invalid' | 'blocked';
  
  // Slot Updates
  updateSlotAssignment: (slotId: string, resident: ResidentState | null) => void;
}
```

#### **Current Integration Status:**
- ✅ **ActivityCapsule**: Has `onSlotClick` and `onSlotHover` handlers
- ✅ **PgCard**: Implements `useDraggable` from dnd-kit
- ❓ **Drop Validation**: Needs verification in current implementation
- ❓ **Visual Feedback**: Needs testing for drag-over states
- ❓ **Telemetry**: Has basic events but needs drag/drop specific ones

---

### 🧪 **TESTING PLAN**

#### **Phase 1: Basic Behavior Testing**

**1.1 Display Tests:**
```typescript
// Test 1: Basic Render
test('renders capsule with basic props', () => {
  render(<ActivityCapsule {...basicProps} />);
  expect(screen.getByTestId('activity-capsule')).toBeInTheDocument();
  expect(screen.getByText('Test Activity')).toBeInTheDocument();
});

// Test 2: Status Variants
test.each(['idle', 'in-progress', 'completed', 'blocked'])(
  'applies correct CSS classes for %s status',
  (status) => {
    render(<ActivityCapsule {...basicProps} status={status} />);
    expect(screen.getByTestId('activity-capsule')).toHaveClass(`activity-capsule--${status}`);
  }
);

// Test 3: Progress Display
test('displays progress correctly', () => {
  render(<ActivityCapsule {...basicProps} progressFraction={0.65} />);
  const progressBar = screen.getByRole('progressbar') || 
                     document.querySelector('.activity-capsule__progress-fill');
  expect(progressBar).toHaveStyle('width: 65%');
});
```

**1.2 Slot Display Tests:**
```typescript
// Test 4: Empty Slots
test('displays empty slots correctly', () => {
  const slots = [
    {slotId: 'slot-1', isOccupied: false, isLocked: false},
    {slotId: 'slot-2', isOccupied: false, isLocked: false}
  ];
  render(<ActivityCapsule {...basicProps} slots={slots} />);
  expect(screen.getAllByTestId(/slot-.*-empty/)).toHaveLength(2);
});

// Test 5: Occupied Slots
test('displays occupied slots with worker info', () => {
  const slots = [
    {slotId: 'slot-1', assignedWorkerName: 'John Doe', isOccupied: true, isLocked: false}
  ];
  render(<ActivityCapsule {...basicProps} slots={slots} />);
  expect(screen.getByText('JD')).toBeInTheDocument(); // Initials
});

// Test 6: Locked Slots
test('displays locked slots with correct styling', () => {
  const slots = [
    {slotId: 'slot-1', isOccupied: false, isLocked: true}
  ];
  render(<ActivityCapsule {...basicProps} slots={slots} />);
  const slot = screen.getByTestId('slot-slot-1');
  expect(slot).toHaveClass('activity-capsule__slot--locked');
});
```

#### **Phase 2: Interaction Testing**

**2.1 Click/Hover Tests:**
```typescript
// Test 7: Slot Click
test('calls onSlotClick when slot is clicked', () => {
  const onSlotClick = vi.fn();
  const slots = [{slotId: 'slot-1', isOccupied: false, isLocked: false}];
  render(<ActivityCapsule {...basicProps} slots={slots} onSlotClick={onSlotClick} />);
  
  fireEvent.click(screen.getByTestId('slot-slot-1'));
  expect(onSlotClick).toHaveBeenCalledWith('slot-1');
});

// Test 8: Slot Hover
test('calls onSlotHover when slot is hovered', () => {
  const onSlotHover = vi.fn();
  const slots = [{slotId: 'slot-1', isOccupied: false, isLocked: false}];
  render(<ActivityCapsule {...basicProps} slots={slots} onSlotHover={onSlotHover} />);
  
  const slot = screen.getByTestId('slot-slot-1');
  fireEvent.mouseEnter(slot);
  expect(onSlotHover).toHaveBeenCalledWith('slot-1', true);
  
  fireEvent.mouseLeave(slot);
  expect(onSlotHover).toHaveBeenCalledWith('slot-1', false);
});

// Test 9: Collect Action
test('calls onCollect when collect button is clicked', async () => {
  const onCollect = vi.fn().mockResolvedValue(undefined);
  render(<ActivityCapsule {...basicProps} canCollect={true} onCollect={onCollect} />);
  
  fireEvent.click(screen.getByRole('button', {name: /collect/i}));
  await waitFor(() => expect(onCollect).toHaveBeenCalled());
});
```

#### **Phase 3: Drag & Drop Integration Testing**

**3.1 Drop Zone Tests:**
```typescript
// Test 10: Drop Zone Setup
test('sets up drop zones for slots', () => {
  const slots = [{slotId: 'slot-1', isOccupied: false, isLocked: false}];
  render(<ActivityCapsule {...basicProps} slots={slots} />);
  
  // Verify dnd-kit drop functionality
  const slot = screen.getByTestId('slot-slot-1');
  expect(slot).toHaveAttribute('data-dnd-drop-zone');
});

// Test 11: Drop Validation
test('validates drops correctly', async () => {
  const mockResident = {id: 'resident-1', name: 'John'};
  const slots = [{slotId: 'slot-1', isOccupied: false, isLocked: false}];
  
  render(<ActivityCapsule {...basicProps} slots={slots} />);
  
  // Simulate drop
  const slot = screen.getByTestId('slot-slot-1');
  fireEvent.dragOver(slot);
  fireEvent.drop(slot, {dataTransfer: {getData: () => JSON.stringify(mockResident)}});
  
  // Verify validation and assignment
  expect(screen.getByText('J')).toBeInTheDocument(); // Updated initials
});

// Test 12: Visual Feedback During Drag
test('shows visual feedback during drag operations', () => {
  const slots = [{slotId: 'slot-1', isOccupied: false, isLocked: false}];
  render(<ActivityCapsule {...basicProps} slots={slots} />);
  
  const slot = screen.getByTestId('slot-slot-1');
  fireEvent.dragEnter(slot);
  expect(slot).toHaveClass('activity-capsule__slot--drag-over');
  
  fireEvent.dragLeave(slot);
  expect(slot).not.toHaveClass('activity-capsule__slot--drag-over');
});
```

**3.2 PgCard Integration Tests:**
```typescript
// Test 13: PgCard to ActivityCapsule Drop
test('allows dropping PgCard into ActivityCapsule slot', async () => {
  // Setup PgCard as draggable
  const mockResident = {id: 'resident-1', name: 'John Doe'};
  render(<PgCard workerId="resident-1" label="John Doe" />);
  
  // Setup ActivityCapsule with empty slot
  const slots = [{slotId: 'slot-1', isOccupied: false, isLocked: false}];
  render(<ActivityCapsule {...basicProps} slots={slots} />);
  
  // Simulate drag and drop
  const pgCard = screen.getByTestId('pg-card-resident-1');
  const slot = screen.getByTestId('slot-slot-1');
  
  fireEvent.dragStart(pgCard);
  fireEvent.dragOver(slot);
  fireEvent.drop(slot);
  
  // Verify assignment
  expect(screen.getByText('JD')).toBeInTheDocument();
});

// Test 14: Drop Prevention for Locked Slots
test('prevents dropping into locked slots', () => {
  const slots = [{slotId: 'slot-1', isOccupied: false, isLocked: true}];
  render(<ActivityCapsule {...basicProps} slots={slots} />);
  
  const slot = screen.getByTestId('slot-slot-1');
  expect(slot).toHaveAttribute('data-drop-allowed', 'false');
});
```

#### **Phase 4: Accessibility Testing**

**4.1 ARIA Tests:**
```typescript
// Test 15: Auto-generated ARIA Labels
test('generates proper ARIA labels', () => {
  render(<ActivityCapsule 
    {...basicProps} 
    status="in-progress"
    progressFraction={0.5}
  />);
  
  const capsule = screen.getByTestId('activity-capsule');
  expect(capsule).toHaveAttribute('aria-label', expect.stringContaining('Test Activity'));
  expect(capsule).toHaveAttribute('aria-label', expect.stringContaining('in-progress'));
  expect(capsule).toHaveAttribute('aria-label', expect.stringContaining('50%'));
});

// Test 16: Screen Reader Announcements
test('announces status changes to screen readers', () => {
  const {rerender} = render(<ActivityCapsule {...basicProps} status="idle" />);
  
  rerender(<ActivityCapsule {...basicProps} status="completed" />);
  
  // Verify aria-live announcement
  const capsule = screen.getByTestId('activity-capsule');
  expect(capsule).toHaveAttribute('aria-live', 'polite');
});
```

**4.2 Keyboard Navigation Tests:**
```typescript
// Test 17: Keyboard Slot Navigation
test('supports keyboard navigation between slots', () => {
  const slots = [
    {slotId: 'slot-1', isOccupied: false, isLocked: false},
    {slotId: 'slot-2', isOccupied: false, isLocked: false}
  ];
  render(<ActivityCapsule {...basicProps} slots={slots} />);
  
  const firstSlot = screen.getByTestId('slot-slot-1');
  firstSlot.focus();
  
  fireEvent.keyDown(firstSlot, {key: 'ArrowRight'});
  expect(screen.getByTestId('slot-slot-2')).toHaveFocus();
});

// Test 18: Keyboard Activation
test('activates slots with Enter/Space keys', () => {
  const onSlotClick = vi.fn();
  const slots = [{slotId: 'slot-1', isOccupied: false, isLocked: false}];
  render(<ActivityCapsule {...basicProps} slots={slots} onSlotClick={onSlotClick} />);
  
  const slot = screen.getByTestId('slot-slot-1');
  slot.focus();
  
  fireEvent.keyDown(slot, {key: 'Enter'});
  expect(onSlotClick).toHaveBeenCalledWith('slot-1');
  
  fireEvent.keyDown(slot, {key: ' '});
  expect(onSlotClick).toHaveBeenCalledTimes(2);
});
```

#### **Phase 5: Performance & Telemetry Testing**

**5.1 Performance Tests:**
```typescript
// Test 19: Render Performance
test('renders within performance budget', () => {
  const startTime = performance.now();
  
  render(<ActivityCapsule {...basicProps} />);
  
  const endTime = performance.now();
  expect(endTime - startTime).toBeLessThan(16); // < 16ms for 60fps
});

// Test 20: Large Slot Count Performance
test('handles large slot counts efficiently', () => {
  const slots = Array.from({length: 20}, (_, i) => ({
    slotId: `slot-${i}`,
    isOccupied: false,
    isLocked: false
  }));
  
  const startTime = performance.now();
  render(<ActivityCapsule {...basicProps} slots={slots} />);
  const endTime = performance.now();
  
  expect(endTime - startTime).toBeLessThan(50); // < 50ms for 20 slots
});
```

**5.2 Telemetry Tests:**
```typescript
// Test 21: Telemetry Events
test('emits telemetry events correctly', () => {
  const trackTelemetryEvent = vi.fn();
  vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
    trackTelemetryEvent
  }));
  
  render(<ActivityCapsule {...basicProps} />);
  
  expect(trackTelemetryEvent).toHaveBeenCalledWith('activity_capsule_rendered', {
    activityId: 'test-activity',
    status: 'in-progress',
    progressFraction: 0.65,
    slotCount: 3,
    pillar: 'frontier',
    skinPresetId: 'wanderlust',
    compact: false,
    timestamp: expect.any(Number)
  });
});

// Test 22: Interaction Telemetry
test('tracks slot click telemetry', () => {
  const trackTelemetryEvent = vi.fn();
  vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
    trackTelemetryEvent
  }));
  
  const onSlotClick = vi.fn();
  const slots = [{slotId: 'slot-1', isOccupied: false, isLocked: false}];
  render(<ActivityCapsule {...basicProps} slots={slots} onSlotClick={onSlotClick} />);
  
  fireEvent.click(screen.getByTestId('slot-slot-1'));
  
  expect(trackTelemetryEvent).toHaveBeenCalledWith('activity_capsule_slot_click', {
    activityId: 'test-activity',
    slotId: 'slot-1',
    pillar: 'frontier',
    skinPresetId: 'wanderlust',
    timestamp: expect.any(Number)
  });
});
```

---

### 🚀 **TEST IMPLEMENTATION PRIORITY**

#### **High Priority (Core Functionality):**
1. ✅ Basic render and display tests
2. ✅ Slot display (empty/occupied/locked)
3. ✅ Click and hover interactions
4. ✅ Collect action functionality
5. ✅ Status variant styling

#### **Medium Priority (Integration):**
6. 🔄 Drag & drop setup
7. 🔄 Drop validation
8. 🔄 PgCard integration
9. 🔄 Visual feedback during drag
10. 🔄 ARIA label generation

#### **Low Priority (Advanced Features):**
11. 📋 Keyboard navigation
12. 📋 Performance benchmarks
13. 📋 Telemetry verification
14. 📋 Screen reader announcements
15. 📋 Large slot count handling

---

### 📁 **FILES TO CREATE/MODIFY**

#### **New Test Files:**
- `tests/unit/idleVillage/ActivityCapsule.basic.test.tsx` (Phases 1-2)
- `tests/unit/idleVillage/ActivityCapsule.integration.test.tsx` (Phase 3)
- `tests/unit/idleVillage/ActivityCapsule.a11y.test.tsx` (Phase 4)
- `tests/unit/idleVillage/ActivityCapsule.performance.test.tsx` (Phase 5)

#### **Component Modifications:**
- `ActivityCapsule.tsx` - Add drop zone attributes if missing
- `ActivityCapsule.tsx` - Add keyboard navigation if missing
- `ActivityCapsule.tsx` - Enhance ARIA support if needed

---

### 🎯 **SUCCESS CRITERIA**

#### **Functional Requirements:**
✅ All basic interactions work correctly
✅ Drag & drop integration with PgCard
✅ Visual feedback during operations
✅ Status and progress display accurate
✅ Slot assignment/removal works

#### **Accessibility Requirements:**
✅ ARIA labels auto-generated correctly
✅ Keyboard navigation functional
✅ Screen reader announcements work
✅ Focus management proper
✅ Color contrast compliant

#### **Performance Requirements:**
✅ Render < 16ms for normal cases
✅ Render < 50ms for large slot counts
✅ Smooth animations and transitions
✅ No memory leaks during drag/drop
✅ Efficient re-renders on prop changes

#### **Integration Requirements:**
✅ Seamless PgCard drag & drop
✅ Proper drop validation
✅ Visual feedback states
✅ Telemetry events emitted
✅ Error handling graceful

This comprehensive testing plan ensures ActivityCapsule behaves correctly in all scenarios and integrates properly with the existing drag & drop system.
