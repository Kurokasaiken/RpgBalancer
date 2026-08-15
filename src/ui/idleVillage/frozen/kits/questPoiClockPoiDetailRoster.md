# questPoiClockPoiDetailRoster — Architettura di integrazione

**Pagina di riferimento:** `PoiDetailQuestRosterTimeClockIntegrationPage`
**Route:** `/poi-quest-detail-roster-time-clock`
**Spec:** desiderata v3 + v4 FROZEN 2026-08-12 (R-005)

Questo documento descrive come tutti i pezzi del sistema quest-POI si tengono insieme: chi possiede cosa, come si parla il clock con il halo, come il pannello detail diventa la quest card, e come le fasi si risolvono una ad una senza bloccare il resto dell'interfaccia.

---

## Vista d'insieme

```
┌────────────────────────────────────────────────────────────┐
│  worldElapsedMs (unica sorgente del tempo)                 │
│         │                                                  │
│    ┌────┴─────────────┐   ┌─────────────────┐             │
│    │  ClockWidget     │   │  DayNightPOI    │             │
│    │  (display)       │   │  (fase visiva)  │             │
│    └────┬─────────────┘   └────────┬────────┘             │
│         │ speed, isPaused           │ isDayPhase           │
│         │                           │ cycleProgress        │
│         ▼                           │                      │
│   ┌─────────────────────────────────┘                      │
│   │  setInterval (COUNTDOWN_TICK_MS = 100ms)               │
│   │  ↓ quando: isQuestRunning && !isPaused && !isCheckAwaiting
│   │  setElapsedMs += COUNTDOWN_TICK_MS * speed             │
│   └─────────────────────────────────────────────────────── │
│                  elapsedMs                                  │
│                     │                                      │
│              ┌──────┴──────────────────────┐              │
│              │  useMilestoneEngine          │              │
│              │  (soglie equispaziate)        │              │
│              └──────────────┬───────────────┘              │
│                             │ onMilestone(event)           │
│                             ▼                              │
│                    milestoneQueue[]                        │
│                             │                              │
│                     activeMilestone?                       │
│                             │                              │
│                    FloatingPanel "milestone-check"         │
│                    └─ MilestoneCheckModal                  │
│                       └─ Destiny Astrolabe V1              │
└────────────────────────────────────────────────────────────┘
```

---

## Sorgente unica del tempo

`worldElapsedMs` è **l'unico stato temporale** della pagina. Tutti gli altri valori derivano da esso o da `elapsedMs` (che è il sottoinsieme di `worldElapsedMs` consumato dalla quest).

| Stato | Alimentato da | Usa |
|---|---|---|
| `worldElapsedMs` | `setInterval` fisso a 100ms × speed | base di tutto |
| `isDayPhase`, `cycleProgress`, `currentDay` | `deriveDayNight(worldElapsedMs)` | `ClockWidget`, `DayNightPOI` |
| `elapsedMs` | `setInterval` fisso a 100ms × speed, solo quando la quest gira | `MagicCircleHalo`, `useMilestoneEngine`, countdown display |
| `questProgress` | `elapsedMs / questDurationMs` | `QuestPOI`, `QuestChronicle`, `MagicCircleHalo` |

Il `ClockWidget` **non possiede il tempo**: riceve `isPaused`, `speedMultiplier`, `currentDay` come prop e notifica tramite `onTogglePause` / `onSpeedChange`. Il tempo vive nella pagina.

---

## Perché c'è sia `worldElapsedMs` che `elapsedMs`

`worldElapsedMs` avanza sempre (quando non in pausa), anche tra una quest e l'altra.
`elapsedMs` avanza **solo** quando `isQuestRunning && !isPaused && !isCheckAwaiting`.

Questo permette al `DayNightPOI` di continuare a girare anche dopo che la quest è finita, mentre il halo rimane a 100% (iscrizione chiusa, non si cancella).

---

## Provider chain della pagina

```tsx
<TooltipProvider>                  // Radix tooltip
  <RosterKitShell>                 // SkinSystemProvider + store roster
    <DndContext ...>               // drag-and-drop dei residenti
      ...pagina...
    </DndContext>
  </RosterKitShell>
</TooltipProvider>
```

`FloatingPanel` usa pointer events nativi e **non** vive dentro un secondo `DndContext`. Questo è un vincolo architetturale: `onDragEnd` del `DndContext` esterno interpreta ogni `active.id` come `residentId`; un secondo contesto dnd-kit colliderebbe con quello.

---

## Ciclo di vita della quest — state machine completa

```
IDLE
  │  handleEmbark() se preview.canEmbark && !isQuestRunning
  ▼
RUNNING
  │  isQuestRunning = true, elapsedMs avanza
  │  useMilestoneEngine emette eventi sulle soglie
  │
  ├──[milestone event]──▶ milestoneQueue.push(event)
  │                              │
  │                         [effetto drain queue]
  │                              │
  │                    isQuestCardOpen?
  │                    ├─ sì ──▶ activeMilestone = event   (CHECK_AWAITING)
  │                    └─ no ──▶ risolve off-screen, nessuna pausa
  │
CHECK_AWAITING (isCheckAwaiting = true, countdown fermo)
  │
  ├──[Astrolabe completa il tiro]
  │     handleMilestoneResolved(result)
  │     recordPhaseResult(index, result)
  │     setActiveMilestone(null)   →   RUNNING
  │
  ├──[utente minimizza il pannello]
  │     setIsMilestoneMinimized(true)
  │     [useEffect] risolve off-screen con consumabili già spesi
  │     setActiveMilestone(null)   →   RUNNING
  │
  └──[utente chiude il pannello]
       setActiveMilestone(null)    →   RUNNING (fase non registrata)

RUNNING → COMPLETE
  quando: elapsedMs >= questDurationMs
       && milestoneQueue vuota
       && activeMilestone === null
       && tutti i phaseResults compilati
  ↓
  resolveQuestOutcomeTier(phaseResults) → outcome tier
  resolveQuestPower(...)               → conseguenze party
  setEmbarkResult(result)
  setIsQuestRunning(false)

COMPLETE → REWARD (stessa FloatingPanel "quest-card")
  quando: embarkResult !== null
  il pannello mostra QuestRewardPanel invece di QuestChronicle

REWARD → IDLE
  handleCollect() → resetQuestRun()
  svuota: elapsedMs, phaseResults, milestoneQueue, assignments
```

---

## `isCheckAwaiting` — la chiave della risoluzione fase per fase

```ts
const isCheckAwaiting = activeMilestone !== null && !isMilestoneMinimized;
```

Il countdown `setInterval` ha tre condizioni per girare:
```ts
if (!isQuestRunning || isPaused || isCheckAwaiting) return;
```

Finché un check è sul tavolo e non è minimizzato, il tempo della quest non avanza. Questo garantisce che la prossima soglia non venga mai attraversata prima che quella corrente sia risolta, anche a speed ×8.

---

## Queue delle milestone — perché c'è una coda

A speed ×8 o dopo che la tab torna in foreground, più soglie possono essere attraversate nello stesso `setInterval`. `useMilestoneEngine` le emette tutte in ordine; la pagina le mette in `milestoneQueue[]` invece di mostrarne solo l'ultima. L'effetto drain prende la prima e la mostra; le successive aspettano.

```
milestone 0 emessa │ queue: [0]
drain effect        │ queue: [] → activeMilestone = 0
milestone 1 emessa │ queue: [1]   (mentre 0 è ancora aperta)
                    │
utente risolve 0   │ activeMilestone = null
drain effect        │ queue: [] → activeMilestone = 1
```

---

## FloatingPanel — quale pannello è aperto quando

| Pannello | `panelId` | Condizione di mount | Contenuto |
|---|---|---|---|
| Detail | `"poi-detail"` | `isDetailOpen && !isQuestCardOpen` | `ActivityCapsuleDetailSkinAware` |
| Quest card | `"quest-card"` | `isQuestCardOpen` | `QuestChronicle` oppure `QuestRewardPanel` |
| Skill check | `"milestone-check"` | `activeMilestone !== null` | `MilestoneCheckModal` |

I tre pannelli sono indipendenti: possono essere aperti contemporaneamente, spostati liberamente, e non si bloccano a vicenda.

**Transizione detail → quest card:**
```ts
if (isDetailOpen) {
  setIsDetailOpen(false);   // chiude detail
  setIsQuestCardOpen(true); // apre quest card
}
```
L'utente che stava guardando il detail non perde il contesto: la finestra si trasforma in quest card.

**Transizione QuestChronicle → QuestRewardPanel (dentro "quest-card"):**
```tsx
{embarkResult ? (
  <QuestRewardPanel ... />
) : (
  <QuestChronicle ... />
)}
```
Stessa `FloatingPanel`, stesso `panelId`, contenuto che cambia quando `embarkResult` si popola.

---

## `MagicCircleHalo` — come si centra sul medaglione

Il halo è figlio di `QuestPOI` via `medallionOverlay`, non del container esterno che include badge e label:

```tsx
<QuestPOI
  size={QUEST_POI_SIZE}  // 200px
  medallionOverlay={
    <MagicCircleHalo
      progress={activityProgress}
      isComplete={isHaloComplete && (isQuestRunning || !!embarkResult)}
      size={QUEST_POI_SIZE}
    />
  }
  // ...altri props
/>
```

`QuestPOI` posiziona `medallionOverlay` con:
```css
position: absolute;
top: renderSize / 2;
transform: translate(-50%, -50%);
```

`size` del halo deve coincidere con `size` del POI (entrambi 200) per far combaciare il cerchio con il medaglione.

`isComplete` diventa `true` solo quando `questProgress >= 1` **e** la quest è in corso o conclusa — non appena l'utente apre la pagina.

---

## DayNightPOI — modalità controllata

`DayNightPOI` in questa pagina non legge lo store globale. Riceve le props derivate da `worldElapsedMs`:

```tsx
<DayNightPOI
  isDayPhase={isDayPhase}
  cycleProgress={cycleProgress}
  isPaused={isPaused}
  onTogglePause={() => setIsPaused(p => !p)}
/>
```

Quando `isDayPhase !== undefined` il componente usa le props; altrimenti legge lo store. Questo garantisce che l'orologio visivo non possa mai divergere dal clock della pagina.

---

## Drag-and-drop dei residenti

Il drag usa `@dnd-kit` con un singolo `DndContext` per tutta la pagina.

```
ResidentCard (draggable via RosterDraggable)
    ↓ onDragEnd(event)
handleDragEnd
    └─ event.over.id === poiDropId?
       └─ findAcceptingSlot(residentId)   → primo slot libero che matcha i requisiti
       └─ { flightToSlot: { slotId, element } }  → avvia DragOutcomeFlight
           ↓ onComplete
       handleFlightComplete(residentId, slotId)
           └─ handleAssign(slotId, residentId)
```

Il POI stesso è un droppable (`useDroppable`) con `id = poiDropId`. Quando un residente viene droppato sul medaglione invece che su uno slot specifico, `findAcceptingSlot` trova il primo slot libero compatibile.

`lockedResidentIds` in `RosterDraggable` blocca i residenti già assegnati (e quello in volo) con label "Away".

---

## `resolveQuestOutcomeTier` vs `resolveQuestPower`

Alla fine della quest la pagina chiama entrambi:

| Funzione | Produce | Usata per |
|---|---|---|
| `resolveQuestOutcomeTier(phaseResults)` | `outcome: QuestOutcomeTier` | Titolo dell'esito (`'perfect'`, `'success'`, ecc.) |
| `resolveQuestPower(partyResidents, activity, rules, rng)` | `consequences[]`, `powerRatio`, `rewardMultiplier` | Conseguenze del party (ferito/morto), moltiplicatore ricompense |

L'outcome del `QuestPowerResult` finale viene **sovrascritto** da `resolveQuestOutcomeTier`: il power engine potrebbe annunciare "perfetto" anche su tre fasi fallite; il tier engine usa ciò che è davvero accaduto.

```ts
const powerResult = resolveQuestPower(...);
const outcome = resolveQuestOutcomeTier(phaseResults);  // override
const result = { ...powerResult, outcome, rewardMultiplier: rules.rewardMultipliers[outcome] };
```

---

## Milestone risolta off-screen — due casi

**Caso 1: quest card chiusa quando arriva la milestone.**
Il drain effect non imposta `activeMilestone`; risolve direttamente:
```ts
recordPhaseResult(
  next.milestoneIndex,
  resolveMilestoneWithoutAnimation({ skills, risk }),
);
```
La quest non si ferma mai.

**Caso 2: utente minimizza il pannello check.**
L'useEffect che osserva `isMilestoneMinimized && activeMilestone !== null`:
- applica i consumabili già selezionati al risk profile
- risolve off-screen
- svuota `activeMilestone`
- il countdown riprende

```ts
useEffect(() => {
  if (!activeMilestone || !isMilestoneMinimized) return;
  const risk = applyConsumableRiskEffects({ ... }, spentConsumables);
  recordPhaseResult(index, resolveMilestoneWithoutAnimation({ skills, risk }));
  setActiveMilestone(null);
  setIsMilestoneMinimized(false);
}, [activeMilestone, isMilestoneMinimized, ...]);
```

---

## Reset — cosa svuota `resetQuestRun()`

```ts
setElapsedMs(0);           // halo torna a 0 (non disegnato)
setEmbarkResult(null);     // nessun outcome
setIsQuestRunning(false);
setPhaseResults([]);        // dots del POI tornano a 'locked'
setMilestoneQueue([]);
setActiveMilestone(null);  // chiude il pannello skill check
setMilestoneConsumableIds([]);
setIsQuestCardOpen(false); // chiude la quest card
setIsConsequencesOpen(true);
setIsMilestoneMinimized(false);
setAssignments({});        // libera tutti gli slot
setSelectedItemIds([]);    // deseleziona consumabili
resetMilestones();          // svuota il set fired di useMilestoneEngine
```

`worldElapsedMs` non viene resettato: l'orologio del mondo continua.

---

## Telemetry

Ogni azione significativa emette un evento locale (`setTelemetry`) e uno verso `trackTelemetryEvent`:

| Evento | Quando |
|---|---|
| `poi_detail_quest_roster_assign` | residente assegnato a uno slot |
| `poi_detail_quest_roster_detach` | residente rimosso da uno slot |
| `poi_detail_quest_roster_start` | quest avviata |
| `quest_phase_resolved` | milestone risolta (on-screen o off) |
| `quest_completed` | countdown esaurito, tutte le fasi risolte |
| `quest_rewards_collected` | `handleCollect()` chiamato |
| `quest_abandoned` | `handleAbandon()` chiamato |

---

*Last Updated: 2026-08-13*
