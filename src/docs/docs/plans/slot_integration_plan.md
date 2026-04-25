# Slot Rack Vertical Slice – Integration Plan

## Obiettivo
Portare tutti i componenti del sistema slot rack (ghiera, medaglia, PG token, drag overlay, flight proxy) a funzionare correttamente insieme, con animazioni sincronizzate e testati con Playwright, per poi trapiantare il risultato nella pagina `/test`.

---

## Analisi Problemi Attuali

### Root Cause: `DetailSlot` ha troppa responsabilità (~400 righe)
Il componente `DetailSlot` dentro `ResidentSlotRack.tsx` gestisce:
- Stato di estrazione (timer, progress, spring)
- Rendering del PG token (verde)
- Rendering della medaglia (rosso) via `SlottedMedal`
- Rendering della ghiera via `SlotV12Renderer`
- Animazioni di transizione (drop impact, extraction spring)
- Suoni e telemetry
- Logica droppable (`useDroppable`)

**Questo rende impossibile:**
1. Testare le animazioni in isolamento
2. Sincronizzare timing tra componenti
3. Debuggare quale componente causa il problema

### Bug Attivi
| Bug | Componente | Causa |
|-----|-----------|-------|
| PG token (verde) balla prima che finisca l'animazione della ghiera | `DetailSlot` | `isExtractionSpringAnimating` parte prima che la ghiera CSS (560ms) abbia finito |
| Medaglia (rosso) si teleporta | `SlottedMedal` wrapper | Nessuna transizione CSS sul container |
| PG token sparisce senza motivo | `DetailSlot` | Condizione `!isExtracting` troppo aggressiva |

---

## Strategia: Isolamento Progressivo → Micro-Integrazione → Trapianto

### Principio Chiave (da ricerca)
> "Develop UI components in isolation, outside the application. This removes dependency on unstable state management, data sources, and layout contexts."
> — Isolated Components Driven Development

### Perché NON Storybook
Per questo progetto usiamo **pagine di isolamento dedicate** dentro il router Vite, non Storybook:
- Già abbiamo il pattern con `/test`
- Le pagine condividono lo stesso provider stack (StyleLab, DndContext)
- Zero overhead di configurazione

---

## Piano in 6 Fasi

### Fase 1: Estrazione Hook `useExtractionStateMachine`
**Goal**: Estrarre tutta la logica di estrazione da `DetailSlot` in un hook puro con stati discreti.

**Stati della macchina:**
```
idle → extracting → bezelAnimating → springBack → clearing → idle
```

**File**: `src/ui/idleVillage/hooks/useExtractionStateMachine.ts`

**Contratto:**
```typescript
interface ExtractionState {
  phase: 'idle' | 'extracting' | 'bezelAnimating' | 'springBack' | 'clearing';
  extractionProgress: number;     // 0-1 for extracting, 1+ for spring overshoot
  isBezelAnimationDone: boolean;  // true after 560ms CSS transition
  isPgTokenVisible: boolean;      // true in idle/extracting, false in springBack/clearing
  isMedalFadingOut: boolean;      // true during bezelAnimating
}

interface UseExtractionStateMachineReturn {
  state: ExtractionState;
  startExtraction: () => void;
  cancelExtraction: () => void;
}
```

**Regole di sincronizzazione:**
- PG token (verde): visibile quando `phase === 'idle' || phase === 'extracting'`
- Medaglia (rosso): fade-out inizia quando `phase === 'bezelAnimating'`
- Spring-back: parte SOLO quando `phase === 'springBack'` (dopo bezel 560ms)
- Clear slot: avviene SOLO quando `phase === 'clearing'` (dopo spring 600ms)

**Test unitari** (Vitest):
- `useExtractionStateMachine.test.ts` — verifica transizioni di stato, timing, cleanup

---

### Fase 2: Pagine di Isolamento per Componente
Creare route dedicate per ogni componente chiave:

#### 2A: `/idle-village/iso/slot-renderer`
**Componente**: `SlotV12Renderer` da solo
**Cosa testa**:
- Rendering empty vs occupied
- Animazione bezel con progress slider (0 → 1)
- Debug visualization on/off
- Timing CSS transition (560ms)

#### 2B: `/idle-village/iso/extraction`
**Componente**: `DetailSlot` con il nuovo hook `useExtractionStateMachine`
**Cosa testa**:
- Press and hold → extraction progress
- Bezel animation → spring back → clear
- PG token visibilità durante ogni fase
- Medaglia fade-out timing
- Cancel extraction (rilascio anticipato)

#### 2C: `/idle-village/iso/drag-overlay`
**Componente**: `CustomDragOverlay` + `WanderlustMedalOverlay` + mock `DndContext`
**Cosa testa**:
- Drag start → medaglia appare nell'overlay
- Drag move → medaglia segue il cursore
- Drag end su slot valido → flight proxy animation
- Drag end su area invalida → spring-back al roster

#### 2D: `/idle-village/iso/flight-proxy`
**Componente**: `FlightProxy` con coordinate hardcoded
**Cosa testa**:
- Animazione da punto A a punto B
- onComplete callback timing (160ms)
- Visual: `WanderlustMedalOverlay` durante il volo

**File struttura:**
```
src/ui/idleVillage/isolation/
├── SlotRendererIso.tsx        # 2A
├── ExtractionIso.tsx          # 2B
├── DragOverlayIso.tsx         # 2C
├── FlightProxyIso.tsx         # 2D
└── index.ts                   # Route registration
```

---

### Fase 3: Test Playwright per Componente Isolato
Un file di test per ogni pagina di isolamento:

#### 3A: `slot-renderer-iso.spec.ts`
```typescript
test('bezel transition completes in ~560ms', async ({ page }) => {
  // Imposta extraction progress a 1
  // Verifica che il transform del bezel cambi entro 560ms±50ms
});

test('debug visualization shows correct colors', async ({ page }) => {
  // Abilita debug mode
  // Verifica colori: bezel=#FF5C8D, medal=#FF1744, pgToken=#4FD1C5
});
```

#### 3B: `extraction-iso.spec.ts`
```typescript
test('PG token stays visible during extraction progress', async ({ page }) => {
  // Triggera press-and-hold
  // Verifica che il PG token sia visibile durante l'animazione
  // Verifica che sparisca SOLO dopo springBack
});

test('spring animation starts AFTER bezel animation (560ms)', async ({ page }) => {
  // Triggera estrazione completa
  // Misura timing: bezel finish → spring start
  // Assert: delay >= 500ms (560ms target)
});

test('medal fades out smoothly during bezel animation', async ({ page }) => {
  // Triggera estrazione
  // Verifica opacity della medaglia: 1 → 0 durante bezelAnimating
});
```

#### 3C: `drag-overlay-iso.spec.ts`
```typescript
test('drag overlay shows WanderlustMedalOverlay during drag', async ({ page }) => {
  // Simula drag start con mouse.down + mouse.move
  // Verifica che l'overlay mostri la medaglia (non il PG token)
});

test('drag to invalid area returns to roster position', async ({ page }) => {
  // Simula drag + drop fuori da uno slot
  // Verifica spring-back animation
});
```

#### 3D: `flight-proxy-iso.spec.ts`
```typescript
test('flight animation completes in ~160ms', async ({ page }) => {
  // Triggera flight
  // Verifica timing onComplete callback
});
```

**File struttura:**
```
tests/e2e/idleVillage/isolation/
├── slot-renderer-iso.spec.ts   # 3A
├── extraction-iso.spec.ts      # 3B
├── drag-overlay-iso.spec.ts    # 3C
└── flight-proxy-iso.spec.ts    # 3D
```

---

### Fase 4: Pagina di Micro-Integrazione
Creare `/idle-village/iso/full-integration` con tutti i componenti insieme:

**Cosa include:**
- Roster con 2-3 PG cards draggabili
- 3 slot con `DetailSlot` (usa il nuovo hook)
- `CustomDragOverlay`
- `FlightProxy`
- `DndContext` provider
- Pannello di stato che mostra: fase corrente, timing, quale componente è attivo

**Test Playwright:** `full-integration-iso.spec.ts`
```typescript
test('drag PG to slot → flight → slot occupied', async ({ page }) => {
  // Drag PG card su slot
  // Verifica flight animation
  // Verifica slot mostra PG assegnato
});

test('extraction complete sequence: extraction → bezel → spring → clear', async ({ page }) => {
  // Assegna PG a slot
  // Press-and-hold su slot
  // Verifica sequenza completa:
  //   1. PG token visibile durante extraction
  //   2. Bezel anima per 560ms
  //   3. PG token sparisce
  //   4. Spring-back per 600ms
  //   5. Slot si svuota
});

test('no PG token movement during bezel animation', async ({ page }) => {
  // IL TEST CHIAVE: verifica che il PG token non si muova
  // durante l'animazione della ghiera
  // Cattura posizione PG token prima e durante bezel
  // Assert: posizione non cambia
});
```

---

### Fase 5: Trapianto nella `/test` Page
Una volta che **tutti i test della Fase 4 passano**, trapiantare:

1. **Sostituire** `DetailSlot` in `ResidentSlotRack.tsx` con la versione che usa `useExtractionStateMachine`
2. **Aggiornare** `TestRosterPage.tsx` per usare il componente aggiornato
3. **Eseguire** tutti i test Playwright esistenti per verificare zero regressioni
4. **Rimuovere** le pagine di isolamento (opzionale, possono restare come dev tools)

**Checklist trapianto:**
- [ ] `useExtractionStateMachine` hook funziona nel contesto TestRosterPage
- [ ] Tutti i provider (StyleLab, DndContext, DragProvider) sono presenti
- [ ] CSS stacking context non rompe z-index overlay
- [ ] Telemetry eventi continuano a funzionare
- [ ] Suoni slot non duplicati
- [ ] Test e2e esistenti passano

---

### Fase 6: Safeguard Suite
```bash
npm run lint -- src/ui/idleVillage
npm run test -- src/ui/idleVillage
npm run build:check
npm run kanban:lint
```

---

## Timeline Stimata

| Fase | Effort | Dipendenze |
|------|--------|------------|
| **1. Hook useExtractionStateMachine** | 2-3h | Nessuna |
| **2. Pagine isolamento** | 3-4h | Fase 1 |
| **3. Test Playwright isolati** | 2-3h | Fase 2 |
| **4. Micro-integrazione** | 2-3h | Fasi 2+3 |
| **5. Trapianto** | 1-2h | Fase 4 ✅ |
| **6. Safeguard** | 30min | Fase 5 |

**Totale: ~12-16h di lavoro**

---

## Rischi e Mitigazioni

| Rischio | Mitigazione |
|---------|-------------|
| CSS context diverso nel trapianto | Pagine isolamento usano stessi provider StyleLab |
| z-index conflitti | Test isolamento verifica stacking |
| Timing flaky nei test Playwright | Usa `expect.poll` con tolerance, no hard delays |
| `useSandboxDragController` ha merge conflict | Risolvere il conflict in `useSandboxDragController.ts` linea 780+ prima di iniziare |

---

## Best Practices Applicate (da ricerca)

1. **Isolated Component Development**: Ogni componente testato fuori dall'app, come una funzione pura `f(props) → UI`
2. **State Machine per animazioni**: Stati discreti eliminano bug di timing (no more `isExtracting && !isSpringAnimating && ...`)
3. **Manual Playwright drag**: `mouse.down → mouse.move(steps:15) → mouse.up` per dnd-kit (non `dragTo`)
4. **Bounding box verification**: Catturare `boundingBox()` multipli per verificare assenza di movimento
5. **Tolerance-based timing**: `560ms ± 100ms` non `=== 560ms`
