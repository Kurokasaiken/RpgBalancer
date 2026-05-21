# 🎯 Component Specifications — Vertical Slice Roadmap

**Data:** 2026-05-20  
**Source:** `VERTICAL_SLICE_ROADMAP.md` (Macro-Fase B) + `VERTICAL_SLICE_IMPLEMENTATION_PLAN.md` (6 Fasi)  
**Scope:** Core loop minimo girabile — Durata target 30-60 min di gameplay

---

## Architettura: Dal Roadmap al Componente

### Core Loop dal Roadmap

```
Personaggi normali producono materiali 
  ↓
Mercante fornisce equip 
  ↓
Eroi affrontano quest D&D 
  ↓
Skill check stile Cultist Simulator 
  ↓
Ricompense + Level up 
  ↓
Upgrade edificio (WoW moment)
```

### Implementazione Incrementale (6 Fasi)

```
Fase 1: PgToken isolato
Fase 2: Roster + PgToken (ordinabile)
Fase 3: SlotRack (contenitore statico)
Fase 4: Drag Roster → SlotRack
Fase 5: ActivityDefinition + Timer
Fase 6: StatusHUD (full gameplay)
```

---

## FASE 1: PgToken

### Spec da Roadmap

**Che cos'è**: Medaglione circolare che rappresenta un personaggio.

**Contesto Roadmap**:
- Utilizzato in `/minimal-gameplay` 
- Parte della "Roster iniziale" con 2 artigiani + 1 eroe
- Trascinabile via drag a JobCard / QuestCard
- Mostra status (sano, ferito, occupato)

**File associati** (da Roadmap B.2):
- Roster iniziale: 2 artigiani + 1 eroe
- Portrait rendering funziona (confermato da handoff)

### Spec Tecnica (da Implementation Plan Fase 1)

**Chi sono e cosa faccio**:
```
Medaglione circolare visivo che rappresenta un personaggio giocabile.
Mostra: portrait (volto), nome, anello colorato per livello (bronzo=novizio, argento=esperto), 
icone di status negli angoli (injured, away, occupato).
```

**Come si vede**:
- Cerchio 80px di diametro
- Portrait al centro (image URL resolve + fallback)
- Anello colorato: bronzo (lvl 1), argento (lvl 2), oro (lvl 3)
- Icone di status: 
  - 🩹 Injured (rosso, angolo basso-sinistra)
  - 🚫 Away (grigio, angolo basso-destra)
  - ⚙️ Occupato (giallo, angolo alto-destra)

**Cosa puoi farci**:
- [Da Fase 2+] Cliccare per auto-assegnare al primo slot libero
- [Da Fase 4] Trascinare su uno slot specifico
- Hover per tooltip (nome + stat principali)
- ❌ Non puoi cliccare durante drag
- ❌ Non puoi assegnare lo stesso token a due slot

**Freezing Rules** (da Implementation Plan §1.1):
```
Scenario 1: Durante drag
- Token non cambia posizione (overlay lo segue)
- Non puoi cliccare su altri token
- Se rilasci fuori da uno slot, torna al posto originale (spring-return)
- Durata: da pointerDown a pointerUp

Scenario 2: Dopo drag fallito
- Rimane disabilitato per 900ms
- Non accetta click, non accetta auto-assign
- Mostra hint "...returning"
- Durata: 900ms dopo handleDragEnd con over === null

Scenario 3: In attività attiva
- Se assegnato a un'attività in corso (job timer running)
- Non può essere spostato
- Nome visibile nello slot
- Durata: fino a onActivityComplete()
```

**File da creare**:
```
src/pages/minimal-pgtoken.tsx                           ← routing entry
src/ui/idleVillage/MinimalPgTokenPage.tsx              ← componente
src/docs/docs/minimal_slice/01_pgtoken.md              ← spec narrativa
src/ui/idleVillage/__tests__/PgToken.unit.test.ts     ← unit test
```

### Test Coverage (Fase 1)

**Unit Test Goals** (85%+):
- [ ] Portrait rendering (URL resolve, fallback, CSS)
- [ ] Status icon visibility (injured=true → icon visibile)
- [ ] Rarity ring colors (level 1 → bronze, level 2 → silver, level 3 → gold)
- [ ] Hover effect (opacity, scale, tooltip trigger)
- [ ] Name display (truncated se > 12 char)
- [ ] CSS layout (80px círcolo, centered)

**Manual Verification**:
- [ ] Apri `/minimal-pgtoken`
- [ ] Token visibile, portrait centrato, rarity ring colore corretto
- [ ] Hover mostra tooltip
- [ ] Nessun errore in console

**Definition of Done**:
- [ ] MinimalPgTokenPage carica e mostra 1 token con tutte le skin (5 token di test)
- [ ] Token mostra: portrait, name, rarity ring, status icon
- [ ] Hover mostra tooltip (name + rarity)
- [ ] `npm run test PgToken.unit.test.ts` — tutti verdi
- [ ] Docs spiega narrativamente "cosa è congelato" anche per questa entità semplice
- [ ] Zero regressioni dal codice esistente

---

## FASE 2: Roster + PgToken

### Spec da Roadmap

**Che cos'è**: Lista di personaggi disponibili, ordinabile.

**Contesto Roadmap**:
- Parte di `/minimal-gameplay` 
- Contiene "Roster iniziale" (2 artigiani + 1 eroe)
- Da cui si trascinano personaggi verso JobCard / QuestCard
- Mostra chi è disponibile, chi è occupato, chi è ferito

**File associati** (Roadmap B.2):
```
Roster iniziale: 2 artigiani + 1 eroe (Character → Resident pipeline)
Job "Taglia legna": assegnazione via drag medaglione
QuestCard: assegnazione eroe, timer, outcome
```

### Spec Tecnica (da Implementation Plan Fase 2)

**Cosa fa il Roster**:
- Contiene lista di PgToken (ordinata per: name, rarity, status, etc.)
- Permette ordinamento dropdown: A-Z, Z-A, Rarity desc, Status (available first)
- Filtra token by availability (nasconde "away", "injured" se flag ON)
- Quando un token è "occupato" (in attività), mostra come dimmed/grigio

**Freezing Rules**:
```
Durante ordinamento:
- Nessun token è draggabile
- Lista aggiorna in < 500ms
- Niente stato interno cambia sui token (congelati tutti)

Quando un token è "occupato":
- Roster non lo rimuove dalla lista
- Lo mostra come "dimmed" o con icona "busy"
- Non puoi trascinarlo (guard layer attivo)
- Puoi comunque ordinare la lista
```

**File da creare**:
```
src/pages/minimal-roster.tsx
src/ui/idleVillage/MinimalRosterPage.tsx
src/docs/docs/minimal_slice/02_roster_pgtoken.md
src/ui/idleVillage/__tests__/Roster.unit.test.ts
src/ui/idleVillage/__tests__/Roster_PgToken.integration.test.ts
```

### Test Coverage (Fase 2)

**Unit Test** (`Roster.unit.test.ts`):
- [ ] Roster renders all tokens (from CharacterStorage)
- [ ] Sort mode "A-Z" changes order (verify order in DOM)
- [ ] Sort mode "Rarity" sorts per statSnapshot.rarity descending
- [ ] Sort mode "Status" shows available tokens first
- [ ] Filter "hide injured" removes injured tokens visually
- [ ] Filter "hide away" removes away tokens visually
- [ ] Roster update < 100ms dopo sort mode change

**Integration Test** (`Roster_PgToken.integration.test.ts`):
- [ ] Roster reorders without breaking PgToken display
- [ ] Roster filtering does not change token internal state
- [ ] Busy token shows dimmed but still in list
- [ ] Ordinamento A-Z: nomi effettivamente ordinati (verifica alphabetico)

**Manual Verification**:
- [ ] Apri `/minimal-roster`
- [ ] 5+ token in lista
- [ ] Dropdown "Sort by" cambia ordine visualmente
- [ ] Verifica A-Z: token effettivamente ordinati
- [ ] Ogni token mostra disponibilità (colore verde se available, grigio se busy)
- [ ] Nessuna regressione Fase 1 (token ancora resi correttamente)

**Definition of Done**:
- [ ] MinimalRosterPage carica 3+ token in lista
- [ ] Dropdown "Sort by" cambia ordine visivamente
- [ ] Ogni token mostra disponibilità (colore verde se available, grigio se busy)
- [ ] `npm run test Roster` — tutti verdi
- [ ] Docs spiega "come Roster mostra chi è congelato"
- [ ] Zero regressioni dal Drag system

---

## FASE 3: SlotRack

### Spec da Roadmap

**Che cos'è**: Contenitore di slot dove si assegnano personaggi alle attività.

**Contesto Roadmap**:
- Utilizzato in JobCard (es. "Taglia legna") — 1 slot
- Utilizzato in QuestCard — 1 slot
- Viene da `/minimal-gameplay` 
- Mostra se lo slot è vuoto, occupato, pronto per completare

**File associati** (Roadmap B.3, B.7):
```
JobCard: "Taglia legna" — 1 slot, timer, output legname
QuestCard: quest narrativa — 1 slot, timer, outcome
```

### Spec Tecnica (da Implementation Plan Fase 3)

**Che cos'è**:
- Contenitore statico di slot (BoardSlot o DetailSlot layout)
- Ogni slot ha:
  - `id` (unique, format `slot-{activity}-{index}`)
  - `state`: "empty" | "occupied" | "ready_to_complete"
  - Visual: box grigio vuoto con "+", oppure PgCard se occupato

**Freezing**:
- SlotRack NON è congelato (è data-less, view layer)
- Niente interazione diretta, solo rendering
- Gli slot stessi non hanno stato mutevole

**File da creare**:
```
src/pages/minimal-slotRack.tsx
src/ui/idleVillage/MinimalSlotRackPage.tsx
src/docs/docs/minimal_slice/03_slotRack.md
src/ui/idleVillage/__tests__/SlotRack.unit.test.ts
```

### Test Coverage (Fase 3)

**Unit Test**:
- [ ] SlotRack renders 4 slots in BoardLayout
- [ ] Each slot has correct `id` attribute (`data-slot-id`)
- [ ] State CSS classes applied correctly (empty, occupied, ready)
- [ ] Slot layout responsive (grid 2x2 or 1x4 based on size)
- [ ] Slot visual feedback (grigio empty, verde occupied, giallo ready)

**Manual Verification**:
- [ ] Apri `/minimal-slotRack`
- [ ] 4 slot in griglia 2x2
- [ ] Slot vuoto = box grigio con "+"
- [ ] Slot occupied = box + PgCard placeholder
- [ ] Slot ha id nel DOM (`data-slot-id`)

**Definition of Done**:
- [ ] MinimalSlotRackPage mostra 4 slot in griglia 2x2
- [ ] Slot vuoto = box grigio con "+", occupied = box + PgCard placeholder
- [ ] Slot ha id nel DOM
- [ ] `npm run test SlotRack` — tutti verdi
- [ ] Docs spiega "SlotRack non è congelato perchè stateless"
- [ ] Zero regressions

---

## FASE 4: Drag Roster → SlotRack

### Spec da Roadmap

**Che cos'è**: Meccanica di assegnazione personaggi via drag-and-drop.

**Contesto Roadmap** (B.3):
```
Job "Taglia legna": assegnazione via drag medaglione, timer, output
```

**File associati**:
- CustomDragOverlay (esiste già, da verificare pickup alignment)
- PgCard draggable (esiste, proprietà dnd-kit)
- SlotRack drop zone (Fase 3)

### Spec Tecnica (da Implementation Plan Fase 4)

**Il flusso**:
```
1. PgToken drag start
   → Visivamente token rimane in Roster
   → CustomDragOverlay lo segue

2. Durante drag
   → PgToken è congelato (niente click, niente ordinamento)
   → Cursore CENTRATO sul token (pickup alignment FIX)

3. SlotRack drop zone
   → Hover mostra "drop here" feedback
   → Drop on valid slot: token scompare da Roster, appare nel Slot

4. Drop outside
   → Token ritorna a Roster con spring-return animation
   → Timing: 300-500ms

5. Guard Layers (da roster_slot_integration_spec.md)
   → G1: didDragRef blocca click post-drag
   → G2: recentlyDraggedResidentId (200ms)
   → G3: ignoreNextSelectRef (one-shot)
   → G4: timeSinceDragEnd (160ms)
   → G5: blockedAutoAssignReasonRef (900ms)
   → G6: activeId check durante dragging
```

**Freezing**:
```
Durante drag:
- PgToken è congelato (overlay lo segue)
- Non puoi cliccare su altri token
- Non puoi ordinare Roster durante drag
- Durata: da pointerDown a pointerUp (0-30s)

Dopo drag fallito:
- Token rimane disabilitato 900ms
- Non accetta click, non accetta auto-assign
- Spring-return mostra animazione
```

**File da creare/modificare**:
```
src/pages/minimal-drag-roster-to-slot.tsx
src/ui/idleVillage/MinimalDragPage.tsx
src/docs/docs/minimal_slice/04_drag_roster_to_slot.md
src/ui/idleVillage/__tests__/Drag.unit.test.ts
src/ui/idleVillage/__tests__/Drag_Roster_SlotRack.integration.test.ts
```

### Test Coverage (Fase 4)

**Critical Tests**:
- [ ] Drag start centers overlay on token (measure pixel offset < 5px) ⚠️ PICKUP ALIGNMENT FIX
- [ ] During drag, token in Roster is visible but inert
- [ ] Drop on valid slot calls assignResident API
- [ ] Drop outside triggers spring-return (measure animation 300-500ms)
- [ ] After drop, token removed from Roster if assigned
- [ ] Ghost click guard prevents auto-assign after failed drop
- [ ] No race conditions if user drags multiple tokens quickly
- [ ] Guard layers: all 6 working (G1-G6)

**Manual Verification**:
- [ ] Apri `/minimal-drag-roster-to-slot`
- [ ] Trascino PgToken: overlay CENTRATO sul token ✅
- [ ] Rilascio su slot: token assegnato, scompare da Roster
- [ ] Rilascio fuori: token ritorna con animazione spring < 500ms
- [ ] Niente ghost click (drop outside non auto-assign)
- [ ] Drag 10 volte velocemente: no race conditions

**Definition of Done**:
- [ ] Roster + SlotRack coesistono in pagina
- [ ] Drag PgToken da Roster a slot: token assegnato, scompare
- [ ] Overlay posizionato correttamente (pickup alignment FIXED)
- [ ] Drop fuori slot: spring-return visibile, < 500ms
- [ ] Niente ghost click
- [ ] `npm run test Drag` — tutti verdi
- [ ] Docs spiegano freezing durante drag + spring-return
- [ ] Zero regressioni Fase 1-3

---

## FASE 5: ActivityDefinition + Timer

### Spec da Roadmap

**Che cos'è**: Attività (job o quest) con timer e calcolo outcome.

**Contesto Roadmap**:
```
B.3: Job "Taglia legna" — assegnazione, timer, output legname
B.7: QuestCard — skill check, outcome
C: Skill check Cultist Simulator-style
D: Reward + Level up + Upgrade
```

### Spec Tecnica (da Implementation Plan Fase 5)

**ActivityDefinition meta-dati**:
```
{
  id: string
  name: string           // "Taglia legna", "Missione segreto della foresta"
  icon: string           // SVG/image path
  duration: number       // secondi (30 per job, 120 per quest)
  skillCheckRequired: boolean
  skillThreshold: { [stat]: number }  // es. { Strength: 10, Perception: 8 }
  rewards: {
    gold: number
    materials: { [type]: number }
    experience: number
  }
  onActivityComplete: (token, outcome) => void
}
```

**SlotRack durante activity**:
- Mostra il timer dell'attività (countdown visibile)
- PgToken dentro SlotRack è congelato fino a `onActivityComplete()`
- Quando timer scade: slot transiziona a "ready_to_complete" (pulsante evidenziato)

**Skill Check**:
```
Quando timer scade:
1. Calcolo: effettive stats del token vs skill threshold
2. Roll deterministico-probabilistico
3. Outcome tier: critical / success / partial / fail / disaster
4. Animazione roll: minimale, leggibile
5. Outcome feedback: tipografia chiara, copy narrativo
6. Transizione a reward modal
```

**Outcome Calculation** (da Roadmap C):
```
5 tier outcomes:
- Critical (e.g., +50% reward, +1 level)
- Success (100% reward)
- Partial (50% reward)
- Fail (0% reward, -1 morale)
- Disaster (-25% reward, character injured)

Deterministic con seed based on:
- token.statSnapshot.strength / perception / spirit vs skill threshold
- activity.difficulty
- random seed (per determinism in test)
```

**File da creare**:
```
src/pages/minimal-activity.tsx
src/ui/idleVillage/MinimalActivityPage.tsx
src/docs/docs/minimal_slice/05_activity_timer.md
src/ui/idleVillage/__tests__/Activity.unit.test.ts
src/ui/idleVillage/__tests__/Activity_Roster_SlotRack.integration.test.ts
```

### Test Coverage (Fase 5)

**Unit Tests**:
- [ ] Activity timer starts at correct duration (30s job, 120s quest)
- [ ] Timer decrements visually (update every 100ms)
- [ ] Token in activity cannot be dragged (guard layer active)
- [ ] Timer scade, stato passa a "ready_to_complete"
- [ ] Click complete: outcome calculation (deterministic con seed)
- [ ] PgToken HP/XP aggiornati correttamente
- [ ] Token ritorna a Roster dopo outcome
- [ ] Outcome modal visualizza ricompense correttamente

**Integration Tests**:
- [ ] Full cycle: assign → timer → complete → reward
- [ ] Token state sync tra Activity e Roster
- [ ] No crashes durante 3 cicli completi
- [ ] Timer accuracy ± 50ms over 30s

**Manual Verification**:
- [ ] Apri `/minimal-activity`
- [ ] Assegno token a slot, timer parte (30s countdown)
- [ ] Trascino lo stesso token: BLOCCATO (guard layer attivo)
- [ ] Timer scade, slot mostra "READY"
- [ ] Clicco "Complete": outcome modal, ricompense visibili
- [ ] Token ritorna a Roster con +XP visibile
- [ ] Niente crash dopo 3 cicli

**Definition of Done**:
- [ ] MinimalActivityPage mostra Roster + SlotRack + Activity HUD
- [ ] Assegno token, timer parte
- [ ] Timer countdown visibile (30s → 0)
- [ ] Token in activity è indroppabile
- [ ] Timer scade, slot mostra "READY"
- [ ] Clicco "Complete": outcome modal, ricompense
- [ ] Token guadagna XP visivamente
- [ ] `npm run test Activity` — tutti verdi
- [ ] Docs spiegano "token congelato durante attività"
- [ ] Zero regressioni Fase 1-4

---

## FASE 6: StatusHUD (Full Gameplay)

### Spec da Roadmap

**Che cos'è**: HUD che mostra stato completo del gioco.

**Contesto Roadmap** (B.4, D.1-D.6):
```
B.4: HUD risorse (legname, ferro, cibo, gold) aggiornate live
D.1-D.6: Reward modal, level-up notification, upgrade edificio
```

### Spec Tecnica (da Implementation Plan Fase 6)

**StatusHUD mostra**:
```
- Risorse globali: {
    wood: number
    iron: number
    food: number
    gold: number
    xpPool: number
  }
- Slot occupati (es. "1/4 slot ocupati")
- Clock del gioco (giorno X, ora Y)
- Token in attività: {
    id: string
    activityName: string
    timeRemaining: number
  }
- Livelli token: medaglione ring color cambia dopo level-up
- Risultati attività: floating numbers quando ricompensa applicata
```

**Real-time sync**:
- Ogni state change aggiorna HUD < 50ms
- Niente prop drilling, tutti dati da context/store
- Reactive updates via React hooks

**File da estendere**:
```
src/ui/idleVillage/MinimalGameplayPage.tsx (exists)
src/docs/docs/minimal_slice/06_complete_gameplay_hud.md (new)
src/ui/idleVillage/__tests__/MinimalGameplay.integration.test.ts (new)
```

### Test Coverage (Fase 6)

**Integration Tests**:
- [ ] HUD initial render shows all resources
- [ ] After assignment, HUD reflects "1 occupied slot"
- [ ] After activity complete, resources updated
- [ ] After level-up, medaglione ring changes color
- [ ] Floating numbers appear on reward
- [ ] No stale state in HUD

**Manual Verification**:
- [ ] Apri `/minimal-gameplay`
- [ ] HUD mostra risorse corrette
- [ ] Eseguo 1 assign + 1 complete + 1 level-up
- [ ] Tutto funziona, HUD aggiorna
- [ ] Riprovo senza refresh: state persiste (save/load OK)

**Definition of Done**:
- [ ] MinimalGameplayPage mostra Roster + SlotRack + Clock + HUD
- [ ] Eseguo completo loop: assign → timer → complete → reward → level-up
- [ ] HUD aggiorna correttamente dopo ogni step
- [ ] Gioco giocabile 5+ min senza crash
- [ ] `npm run test MinimalGameplay` — tutti verdi
- [ ] Docs completano quadro narrativo di tutte le entità
- [ ] Zero regressioni

---

## Riepilogo: Test Coverage per Componente

| Componente | Fase | Unit Test | Integration | Manual | Status |
|---|---|---|---|---|---|
| **PgToken** | 1 | Portrait, Rarity, Status icons, Hover | — | Visual render | ❌ TODO |
| **Roster** | 2 | Sort, Filter, Update timing | Reorder without breaking PgToken | Dropdown + list | ❌ TODO |
| **SlotRack** | 3 | Render slots, IDs, CSS classes, Layout | — | Grid 2x2 | ❌ TODO |
| **Drag** | 4 | Overlay position, Guard layers (G1-G6) | Roster↔Slot, Spring-return | Pickup alignment ✅, Ghost click ❌ | ❌ TODO |
| **Activity** | 5 | Timer accuracy, Outcome calc, State sync | Full cycle assign→complete | 3 cicli no crash | ❌ TODO |
| **StatusHUD** | 6 | HUD render, Resource sync, Color changes | Full gameplay loop | 5+ min playthrough | ❌ TODO |

---

## Timeline Proposto

```
Giorno 1-2:  Fase 1 (PgToken) DONE + Test + Docs
Giorno 3:    Fase 2 (Roster) DONE + Test + Docs
Giorno 4:    Fase 3 (SlotRack) DONE + Test + Docs
Giorno 5-6:  Fase 4 (Drag) DONE + Test + Docs + PICKUP ALIGNMENT FIX
Giorno 7:    Fase 5 (Activity) DONE + Test + Docs
Giorno 8:    Fase 6 (StatusHUD) DONE + Test + Docs
Giorno 9:    Regression testing + Manual playtest 5+ min
Giorno 10:   Polish + Buffer
```

---

## Definition of Success

Alla fine delle 6 Fasi:

- ✅ Zero regressioni dal baseline
- ✅ Drag pickup alignment centrato (manual verification)
- ✅ Spring-return completa in < 500ms
- ✅ Full playthrough 5+ min senza crash
- ✅ Docs spiegano narrativamente ogni entità
- ✅ Freezing semantics chiare e consistenti
- ✅ Test suite coprisce tutti i guard layer
- ✅ Nuovi dev capiscono come estendere slice da docs + test

---

**Status Generale:** ❌ Niente implementato ancora  
**Prossimo Step:** Iniziare Fase 1 — PgToken isolato
