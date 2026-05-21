# Vertical Slice Implementation Plan — Incremental Testing & Documentation Strategy

**Aligned with Semantic Constraints:** See [context/RPG_PROJECT_CONTEXT.md](../../context/RPG_PROJECT_CONTEXT.md) §3 for Core Semantic Constraints
**Aligned with Test Standards:** See [context/RPG_PROJECT_CONTEXT.md](../../context/RPG_PROJECT_CONTEXT.md) §5 for Test Standards
**Aligned with Documentation Standards:** See [context/RPG_PROJECT_CONTEXT.md](../../context/RPG_PROJECT_CONTEXT.md) §4 for Documentation Standards
**Aligned with File Organization:** See [context/RPG_PROJECT_CONTEXT.md](../../context/RPG_PROJECT_CONTEXT.md) §6 for File Organization

**Versione:** 1.0 (2026-05-20)
**Scopo:** Definire un approccio bilanciato per documentare e testare la vertical slice senza regressioni, costruendo incrementalmente da entità singole a interazioni multi-entità.

---

## Executive Summary

Vuoi evitare regressioni costruendo **incrementalmente**:
1. **Pagina vuota + 1 entità** (es. `pgToken` OR `roster`) con unit test e docs che spiegano il "congelamento" (freezing)
2. **Pagina con 2 entità** che interagiscono (es. `pgToken` + `slotRack`) con integration test e docs di interazione
3. **Ripeti** per ogni coppia di entità nella slice finale

Ogni livello ha docs `.md` dedicate che spiegano in linguaggio reale come le entità si comportano, cosa è "frozen" (immutabile durante la drag), cosa cambia stato.

Questo approccio:
- **Previene regressioni**: ogni nuova entità è aggiunta su baseline solida e testata
- **Facilita onboarding**: le docs spiegano il perché, non solo il cosa
- **Consente rollback**: se una coppia di entità crea problemi, puoi tornare alla slice precedente

---

## 1. Framework Concettuale

### 1.1 Definizione di "Congelamento" (Freezing)

Quando un'entità è **frozen** durante un'operazione:
- **Non cambia stato** interno (posizione, HP, status, etc.)
- **Non può essere assegnata** ad altre attività simultaneamente
- **Non genera side effects** finché l'operazione non è completata
- **Mantiene coerenza visiva** (medaglione evidenziato, hover state bloccato)

**Esempio**: `pgToken` durante drag è frozen —
- Non può essere assegnato da un'altra pagina
- Non produce HP, non progredisce job timer
- La sua posizione visiva è controllata da `CustomDragOverlay`, non da CSS del padre

### 1.2 Entità Primarie della Slice

Basato su `VERTICAL_SLICE_ROADMAP.md` e `roster_slot_integration_spec.md`:

| Entità | Ruolo | Interagisce con | Freezable |
|---|---|---|---|
| **PgToken** | Medaglione visivo del personaggio (draggable) | SlotRack, ResidentRosterPanel | ✓ Sì |
| **Roster** | Lista di token disponibili, ordinabile | PgToken (contiene), SlotRack (drag-from) | ✓ Parziale (lista può ordinare, ma token assignati no) |
| **SlotRack** | Contenitori di slot per attività | PgToken (riceve), StatusHUD (reflect state) | ✗ No (è contenitore statico) |
| **ActivityDefinition** | Meta-dati dell'attività (timer, ricompense, skill check) | SlotRack, PgToken, StatusHUD | ✗ No |
| **StatusHUD** | Display risorse + stato token assignati | Tutti (read-only) | ✗ No (view layer) |

### 1.3 Coppie Critiche di Interazione

Ordine di implementazione e test (dal semplice al complesso):

1. **Fase 1**: `PgToken` ↔ (nulla) — entità singola isolata
2. **Fase 2**: `PgToken` ↔ `Roster` — ordinamento e visibilità
3. **Fase 3**: `PgToken` ↔ `SlotRack` — drag-and-drop
4. **Fase 4**: `PgToken` + `Roster` ↔ `SlotRack` — assignment e state sync
5. **Fase 5**: Tutto ↔ `ActivityDefinition` — timing e outcome
6. **Fase 6**: Tutto ↔ `StatusHUD` — reflection di state

---

## 2. Struttura di Documentazione

### 2.1 Template di Pagina per Ogni Fase

Ogni pagina minimal avrà tre file:

```
/minimal-{entityA}-{entityB}/
├── page.tsx                 ← componente React minimalista
├── {entityA}_{entityB}.md   ← spec di interazione (linguaggio reale)
└── __tests__/
    ├── {entityA}.unit.test.ts
    └── {entityA}_{entityB}.integration.test.ts
```

### 2.2 Contenuto `.md` — Spec di Interazione

Ogni documento `.md` contiene (non è tecnico, è narrativo):

**Sezione 1: "Chi sono e cosa faccio"**
```
## PgToken

**Che cos'è**: Medaglione circolare visivo che rappresenta un personaggio giocabile.
Mostra il suo volto, nome, e status visivo (sano, ferito, occupato).

**Come si vede**: Cerchio 80px con portrait al centro, anello colorato per il livello
(bronzo=novizio, argento=esperto), icone di status agli angoli.

**Cosa puoi farci**: 
- Cliccare per auto-assegnare al primo slot libero
- Trascinare su uno slot specifico per assegnare
- Hover per vedere tooltip con nome + stat principali
- (Non puoi): cliccare durante drag, assegnare lo stesso token a due slot
```

**Sezione 2: "Quando sono congelato"**
```
## Freezing Rules for PgToken

**Scenario 1: Durante drag**
- Il token non cambia visivamente posizione (overlay lo segue)
- Non puoi cliccare su altri token
- Se rilasci fuori da uno slot, torna al posto originale (spring-return)
- Durata: da `pointerDown` a `pointerUp`

**Scenario 2: Dopo drag fallito**
- Rimane disabilitato per 900ms
- Non accetta click, non accetta auto-assign
- Mostra hint visivo: "...returning" status
- Durata: 900ms dopo `handleDragEnd` con `over === null`

**Scenario 3: In attività attiva**
- Se assegnato a un'attività in corso (job timer running)
- Non può essere spostato
- Il suo nome è visibile nello slot
- Durata: fino a `onActivityComplete()`
```

**Sezione 3: "Come interagisco con..."**
```
## PgToken ↔ Roster

**Cosa fa il Roster**:
- Contiene una lista di PgToken (ordinata per: name, rarity, status, etc.)
- Permette ordinamento (0.5s per aggiornare lista)
- Filtra token by availability (nasconde "away", "injured" se il flag è ON)

**Cosa succede quando un PgToken è in un'attività**:
- Roster non lo rimuove dalla lista
- Ma lo mostra come "dimmed" o con icona "busy"
- Non puoi trascinarlo (guard layer in DragTestContainer)
- Puoi comunque ordinare la lista

**Timing**:
- Ordinamento: istantaneo (sort in-memory) + 0.5s ripaint
- Aggiornamento "busy" status: 0-50ms (reaction a state change)
```

**Sezione 4: "Cosa può andare storto" (Test Cases)**
```
## Known Issues & Guard Layers

**Issue: Drag pickup alignment**
- Sintomo: il cursore non è centrato sul token quando inizi a trascinare
- Causa: CustomDragOverlay offset o transform-origin errato
- Fix: misurare DOM rect del token effettivo vs pointer event
- Regression test: `test('drag start position is center-aligned', ...)`

**Issue: Ghost click dopo drop fallito**
- Sintomo: il token viene assegnato anche se l'hai rilasciato fuori da qualsiasi slot
- Causa: synthetic click event del browser non bloccato
- Mitigazione: G1-G6 guard layers (vedi guard system in roster_slot_integration_spec.md)
- Regression test: `test('drop outside does not trigger auto-assign', ...)`

**Issue: Spring-return animation incompletato**
- Sintomo: il token rimane al posto in cui l'hai rilasciato, non torna indietro
- Causa: timing issue tra returnToToken animation e spring physics
- Mitigation: timeout di 250ms dopo drop per clearare ignoreNextSelectRef
- Regression test: `test('spring-return completes within 500ms', ...)`
```

---

## 3. Implementazione Incrementale: Le 6 Fasi

### Fase 1: PgToken Isolato (2-3 giorni)

**Obiettivo**: Pagina `/minimal-pgtoken` con un singolo token che non interagisce con nulla.

**File da creare/modificare**:
```
src/pages/minimal-pgtoken.tsx                    ← routing entry
src/ui/idleVillage/MinimalPgTokenPage.tsx        ← componente
src/docs/docs/minimal_slice/01_pgtoken.md        ← spec narrativa
src/ui/idleVillage/__tests__/PgToken.unit.test.ts ← unit test
```

**Spec da documentare** (`01_pgtoken.md`):
- Chi è PgToken, cosa è congelato, quali animazioni ha
- Hover state, rarity ring coloring, portrait URL resolution
- Status icon placement (injured, away, etc.)
- Niente interazione con Roster o Slot ancora

**Test Coverage** (goal: 85%+):
- Portrait rendering (URL resolve, fallback, CSS)
- Status icon visibility (when to show injured/away icon)
- Rarity ring colors (bronze/silver/gold for levels 1-3)
- Hover effect (opacity, scale, tooltip trigger)

**Definition of Done**:
```
- [ ] MinimalPgTokenPage carica e mostra 1 token con tutte le skin
- [ ] Token mostra: portrait, name, rarity ring, status icon
- [ ] Hover mostra tooltip (name + rarity)
- [ ] npm run test PgToken.unit.test.ts — tutti verdi
- [ ] Docs spiega visualmente "cosa è congelato" anche per questa semplice entità
- [ ] Zero regressions dal codice esistente
```

---

### Fase 2: Roster + PgToken (2-3 giorni)

**Obiettivo**: Pagina `/minimal-roster` con lista di token ordinabili, nessuna drag.

**File da creare/modificare**:
```
src/pages/minimal-roster.tsx
src/ui/idleVillage/MinimalRosterPage.tsx
src/docs/docs/minimal_slice/02_roster_pgtoken.md
src/ui/idleVillage/__tests__/Roster.unit.test.ts
src/ui/idleVillage/__tests__/Roster_PgToken.integration.test.ts
```

**Spec da documentare** (`02_roster_pgtoken.md`):
- Roster contiene lista di PgToken, li ordina
- Come PgToken mostra il suo stato di "disponibilità" dentro Roster
- Ordinamento per: Name A-Z, Name Z-A, Rarity desc, Status (available first)
- Freezing: durante ordinamento, nessun token è draggabile
- Quando un token è "busy" (in attività), Roster lo mostra come dimmed

**Test Coverage**:
- Roster renders all tokens (from CharacterStorage)
- Sort mode A-Z changes order (verify order in DOM)
- Sort mode Rarity sort per statSnapshot.rarity (verify order)
- Dimming logic: when token is "busy", CSS class changes
- Roster update < 100ms dopo sort mode change

**Definition of Done**:
```
- [ ] MinimalRosterPage carica 3+ token in una lista
- [ ] Dropdown "Sort by" cambia ordine visualmente
- [ ] Ogni token mostra disponibilità (colore verde se available, grigio se away/injured)
- [ ] npm run test Roster — tutti verdi
- [ ] Docs spiega "come il Roster mostra chi è congelato"
- [ ] Zero regressions dal Drag system
```

---

### Fase 3: SlotRack Isolato (1-2 giorni)

**Obiettivo**: Pagina `/minimal-slotRack` con rack di slot visibili ma non droppabili.

**File da creare/modificare**:
```
src/pages/minimal-slotRack.tsx
src/ui/idleVillage/MinimalSlotRackPage.tsx
src/docs/docs/minimal_slice/03_slotRack.md
src/ui/idleVillage/__tests__/SlotRack.unit.test.ts
```

**Spec da documentare** (`03_slotRack.md`):
- SlotRack è un contenitore statico di slot (BoardSlot o DetailSlot layout)
- Ogni slot ha:
  - `id` (unique, format `slot-{activity}-{index}`)
  - `state`: "empty" | "occupied" | "ready_to_complete"
  - Visual: box grigio vuoto, oppure il PgCard se occupato
- SlotRack NON è congelato (è data-less view layer)
- Niente interazione, solo rendering

**Test Coverage**:
- SlotRack renders 4 slots in BoardLayout
- Each slot has correct id attribute
- State CSS classes applied correctly (empty, occupied, ready)
- Slot layout responsive (grid 2x2 or 1x4 based on size)

**Definition of Done**:
```
- [ ] MinimalSlotRackPage mostra 4 slot in griglia 2x2
- [ ] Slot vuoto = box grigio con "+", slot occupied = box + PgCard placeholder
- [ ] Slot ha id nel DOM (`data-slot-id`)
- [ ] npm run test SlotRack — tutti verdi
- [ ] Docs spiega "SlotRack non è congelato perchè è stateless"
- [ ] Zero regressions
```

---

### Fase 4: Drag Roster → SlotRack (3-4 giorni)

**Obiettivo**: Pagina `/minimal-drag-roster-to-slot` con drag-and-drop funzionante.

**File da creare/modificare**:
```
src/pages/minimal-drag-roster-to-slot.tsx
src/ui/idleVillage/MinimalDragPage.tsx
src/docs/docs/minimal_slice/04_drag_roster_to_slot.md
src/ui/idleVillage/__tests__/Drag.unit.test.ts
src/ui/idleVillage/__tests__/Drag_Roster_SlotRack.integration.test.ts
```

**Spec da documentare** (`04_drag_roster_to_slot.md`):
- PgToken drag start: visivamente token rimane in Roster, overlay lo segue
- Durante drag: PgToken è congelato (niente click, niente ordinamento)
- SlotRack drop zone: hover mostra "drop here" feedback
- Drop on slot: token scompare da Roster, appare nel Slot (visivamente)
- Drop outside: token ritorna a Roster con spring-return animation
- Timing: drag può durare 0-30s, drop è istantaneo, spring-return 300-500ms

**Test Coverage** (integration):
- Drag start centers overlay on token (measure pixel offset < 5px)
- During drag, token in Roster is still visible but inert
- Drop on valid slot calls assignResident API
- Drop outside triggers spring-return (measure animation duration)
- After drop, token removed from Roster if assigned successfully
- Ghost click guard prevents auto-assign after failed drop
- Regression: no race conditions if user drags multiple tokens quickly

**Definition of Done**:
```
- [ ] Roster + SlotRack coesistono in pagina
- [ ] Drag PgToken da Roster a uno slot: token si assegna e scompare da Roster
- [ ] Overlay posizionato correttamente (drag pickup alignment test)
- [ ] Drop fuori slot: spring-return visibile, token torna a Roster in < 500ms
- [ ] Niente ghost click (drop outside non assegna)
- [ ] npm run test Drag — tutti verdi
- [ ] Docs spiega freezing durante drag + spring-return physics
- [ ] Zero regressions su Roster ordering e SlotRack layout
```

---

### Fase 5: ActivityDefinition + Timer (2-3 giorni)

**Obiettivo**: Pagina `/minimal-activity` con timer e outcome di attività.

**File da creare/modificare**:
```
src/pages/minimal-activity.tsx
src/ui/idleVillage/MinimalActivityPage.tsx
src/docs/docs/minimal_slice/05_activity_timer.md
src/ui/idleVillage/__tests__/Activity.unit.test.ts
src/ui/idleVillage/__tests__/Activity_Roster_SlotRack.integration.test.ts
```

**Spec da documentare** (`05_activity_timer.md`):
- ActivityDefinition meta-dati: nome, icon, durata, skill check, ricompense
- SlotRack mostra il timer dell'attività (countdown visibile)
- PgToken dentro SlotRack è congelato fino a `onActivityComplete()`
- Quando timer scade: attività transiziona a "ready_to_complete" (pulsante evidenziato)
- Cliccare "complete": outcome modal, ricompense applicate a token
- PgToken ritorna a Roster con experience gained

**Test Coverage**:
- Activity timer starts at correct duration (e.g., 30s for job, 120s for quest)
- Timer decrements visually (update every 100ms)
- Token in activity cannot be dragged (guard layer active)
- Timer scade, stato passa a "ready_to_complete"
- Click complete: outcome calculation (deterministico con seed)
- PgToken HP/XP aggiornati correttamente
- Token ritorna a Roster dopo outcome

**Definition of Done**:
```
- [ ] MinimalActivityPage mostra Roster + SlotRack + Activity HUD
- [ ] Assegno token a slot, timer parte
- [ ] Timer countdown visibile (30s → 0)
- [ ] Token in activity è indroppabile (guard layer blocca)
- [ ] Timer scade, slot mostra "READY"
- [ ] Clicco "Complete": outcome modal con ricompense
- [ ] Token guadagna XP visivamente (numeri flottanti)
- [ ] npm run test Activity — tutti verdi
- [ ] Docs spiega "token congelato durante attività"
- [ ] Zero regressions su drag, timer accuracy
```

---

### Fase 6: StatusHUD (1-2 giorni)

**Obiettivo**: Pagina `/minimal-gameplay` con HUD completo che reflecta tutto.

**File da creare/modificare** (ESISTE GIÀ, solo extending):
```
src/ui/idleVillage/MinimalGameplayPage.tsx (extends)
src/docs/docs/minimal_slice/06_complete_gameplay_hud.md
src/ui/idleVillage/__tests__/MinimalGameplay.integration.test.ts
```

**Spec da documentare** (`06_complete_gameplay_hud.md`):
- StatusHUD mostra: risorse globali (legno, ferro, cibo, gold, XP pool)
- Riflette i token in attività (mostra chi è occupato dove)
- Riflette i livelli token (medaglione ring color cambia dopo level-up)
- Riflette i risultati di attività (numerini flottanti quando ricompensa applicata)
- Real-time sync: ogni state change aggiorna HUD < 50ms

**Test Coverage**:
- HUD initial render shows all resources
- After assignment, HUD reflects "1 occupied slot"
- After activity complete, resources updated
- After level-up, medaglione ring changes color
- No prop drilling, all data from context/store

**Definition of Done**:
```
- [ ] MinimalGameplayPage mostra Roster + SlotRack + Clock + HUD
- [ ] Eseguo completo loop: assign → timer → complete → reward → level up
- [ ] HUD aggiorna correttamente dopo ogni step
- [ ] Gioco è giocabile per 5+ min senza crash
- [ ] npm run test MinimalGameplay — tutti verdi
- [ ] Docs completano il quadro narrativo di tutte le entità
- [ ] Zero regressions su nulla
```

---

## 4. Testing Strategy

### 4.1 Piramide di Test (Fase per Fase)

```
        / \
       /   \    E2E: "full playthrough" (Fase 6 only)
      /-----\
     /       \   Integration: cross-component (Fase 2+)
    /_________\
   /           \  Unit: single component (Fase 1+)
  /             \
 /_____________/
Regression: guard layers + animations (ongoing)
```

### 4.2 Regression Test Suite

Ogni fase aggiunge test di non-regressione per le fasi precedenti:

```typescript
// Ongoing regression tests

// Phase 1: PgToken rendering never breaks
test('PgToken portrait URL resolves correctly', ...)
test('PgToken rarity ring color correct', ...)

// Phase 2: Roster sorting never breaks Phase 1
test('Roster reorders without breaking PgToken display', ...)
test('Roster filtering does not change token internal state', ...)

// Phase 3: SlotRack never breaks Phase 1-2
test('SlotRack rendering independent of Roster', ...)

// Phase 4: Drag system never triggers Phase 1-3 regressions
test('Drag start does not change Roster order', ...)
test('Spring-return animation completes visually', ...)

// Phase 5: Activity timer never breaks Phase 1-4
test('Activity timer accuracy ± 50ms over 30s', ...)
test('Token in activity cannot be dragged (guard active)', ...)

// Phase 6: Full gameplay never breaks any phase
test('Full playthrough loop: assign → complete → reward', ...)
```

### 4.3 Manual Verification Checklist (per Fase)

Dopo ogni fase, manual test:

```
Fase 1: PgToken
- [ ] Apri /minimal-pgtoken in browser
- [ ] Token visibile, portrait centered, rarity ring colore corretto
- [ ] Hover mostra tooltip
- [ ] No console errors

Fase 2: Roster
- [ ] Apri /minimal-roster
- [ ] 5+ token in lista
- [ ] Sort dropdown cambia ordine visualmente
- [ ] All'ordine A-Z, nomi sono effettivamente ordinati
- [ ] No regressions Fase 1 (token ancora resi correttamente)

Fase 3: SlotRack
- [ ] Apri /minimal-slotRack
- [ ] 4 slot in griglia 2x2
- [ ] Slot vuoti grigi, con icona "+"
- [ ] No layout shift quando navigo tra pagine

Fase 4: Drag
- [ ] Apri /minimal-drag-roster-to-slot
- [ ] Clicco PgToken: no drag yet
- [ ] Trascino PgToken: overlay segue cursore
- [ ] Overlay CENTRATO sul token (pickup alignment OK?)
- [ ] Rilascio su slot: token assegnato, scompare da Roster
- [ ] Rilascio fuori: token ritorna con animazione spring
- [ ] Niente ghost click (drop outside non auto-assign)
- [ ] Drag un token 10 volte velocemente: no race conditions

Fase 5: Activity
- [ ] Apri /minimal-activity
- [ ] Assegno token a slot
- [ ] Timer parte (30s countdown visibile)
- [ ] Trascino lo stesso token: BLOCCATO (guard layer)
- [ ] Timer scade, slot mostra "READY"
- [ ] Clicco "Complete": outcome modal, ricompense visibili
- [ ] Token ritorna a Roster con +XP visibile
- [ ] No crash dopo 3 cicli completi

Fase 6: Full Gameplay
- [ ] Apri /minimal-gameplay
- [ ] HUD mostra risorse corrette
- [ ] Eseguo 1 assign + 1 complete + 1 level-up
- [ ] Tutto funziona, HUD aggiorna
- [ ] Riprovo senza refresh: state persiste (save/load OK)
```

---

## 5. Documentation Deliverables

### Per Ogni Fase:

1. **Spec narrativa** (`.md`)
   - Chi sono le entità, cosa è "congelato"
   - Come interagiscono
   - Cosa può andare storto (known issues)
   - Visual diagram (ASCII o link a Figma)

2. **Test file** (`__tests__/`)
   - Unit test per ogni componente
   - Integration test per interazioni
   - Regression test per guard layer

3. **Code comments** (nei `.tsx`)
   - Spiegare il perché degli if, non il cosa
   - Referenza ai guard layers quando bloccano
   - Link a spec narrativa per contesto

### Struttura finale di Docs:

```
src/docs/docs/minimal_slice/
├── README.md                      ← indice, ordine di lettura
├── 01_pgtoken.md                  ← Fase 1 spec
├── 02_roster_pgtoken.md           ← Fase 2 spec
├── 03_slotRack.md                 ← Fase 3 spec
├── 04_drag_roster_to_slot.md      ← Fase 4 spec
├── 05_activity_timer.md           ← Fase 5 spec
├── 06_complete_gameplay_hud.md    ← Fase 6 spec
├── guard_layers_reference.md      ← Dettaglio dei 6 guard layer
├── freezing_semantics.md          ← Cosa significa "frozen" in ogni contesto
└── regression_test_suite.md       ← Elenco di tutti i test critici
```

---

## 6. Risk Mitigation

| Rischio | Probabilità | Mitigazione |
|---|---|---|
| Fase precedente rompe quando aggiungo Fase N | Alta | Regression test suite aggiornata ogni fase. Manual test di Fase 1-N-1 prima di continuare. |
| Freezing semantics non è chiara | Media | Docs narrativa con esempi concreti. Guard layers well-commented. |
| Drag pickup alignment rimane rotto | Alta | Dedicare Fase 4.1 a measure + debug (prima di rest of phase 4). User manual verification before proceeding. |
| Test false positive (pass quando dovrebbe fail) | Media | Deterministic seed per outcome. Mock timers dove serve. |
| Scope creep verso entità non previste | Media | Stick to 6 Fasi. Negotia new entities come Fase 7+. |
| Docs diventano subito stale | Alta | Docs scritte DURANTE implementazione, non after. Link test nel README per auto-verify. |

---

## 7. Timeline e Checkpoints

```
Settimana 1:
  Lun-Mar  → Fase 1 (PgToken) DONE + Docs + Test
  Mer      → Fase 2 (Roster) DONE + Docs + Test
  Gio-Ven  → Fase 3 (SlotRack) DONE + Docs + Test
  
Settimana 2:
  Lun-Gio  → Fase 4 (Drag) DONE + Docs + Test
           (extra time for drag pickup alignment if needed)
  Ven      → Fase 5 (Activity) DONE + Docs + Test
  
Settimana 3:
  Lun      → Fase 6 (StatusHUD) DONE + Docs + Test
  Mar-Mer  → Regression testing + cleanup docs
  Gio      → Manual playtest (5+ min loop, no crash)
  Ven      → Buffer per unexpected issues
```

---

## 8. Definition of Success

Alla fine delle 6 Fasi:

- ✅ Zero regressioni dal baseline (`VERTICAL_SLICE_ROADMAP.md` Macro-Fase A.4)
- ✅ Drag pickup alignment centrato (manual verification)
- ✅ Spring-return completa in < 500ms (test + manual)
- ✅ Full playthrough di 5+ min senza crash
- ✅ Docs spiegano narrativamente come ogni entità si comporta
- ✅ Freezing semantics chiare e consistenti
- ✅ Test suite coprisce tutti i guard layer
- ✅ Nuovi dev possono leggere docs + test per capire come estendere slice

---

## Appendix: Guard Layer Reference

Riassunto dalle 6 guard layer di `roster_slot_integration_spec.md`:

| # | Nome | Dove | Trigger | Effetto |
|---|---|---|---|---|
| G1 | PgCard.didDragRef | PgCard.tsx | `dnd moving > 4px` | Blocca click post-drag |
| G2 | DragTestContainer.recentlyDraggedResidentId | DragTestContainer.tsx | `_handleDragEnd` (200ms) | Blocca click per 200ms |
| G3 | TestRosterPage.ignoreNextSelectRef | TestRosterPage.tsx | `drop outside` (one-shot) | Blocca uno select |
| G4 | TestRosterPage.timeSinceDragEnd | TestRosterPage.tsx | `drop` (160ms) | Blocca select < 160ms dopo drop |
| G5 | TestRosterPage.blockedAutoAssignReasonRef | TestRosterPage.tsx | `drop outside` (900ms) | Blocca select per resident per 900ms |
| G6 | TestRosterPage.activeId check | TestRosterPage.tsx | Durante `dndIsDragging` | Blocca select se dragging |

Ogni nuova fase aggiunge test che verifica almeno uno di questi guard layer non regredisce.

