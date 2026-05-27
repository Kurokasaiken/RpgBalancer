# Postmortem: `_ARCHIVED_ROSTER_SLOT_INTERACTION/`

**Author:** Wave 0 Day 1
**Date:** 2026-05-21
**Status:** Reference document for Component Freezing & Certification Plan v2

---

## TL;DR — riformulazione rispetto al piano v2

Il piano v2 (Sezione 9, Rischio 3) presumeva che `_ARCHIVED_ROSTER_SLOT_INTERACTION/` fosse "un tentativo precedente fallito". Lettura del README e del COMPONENT_INVENTORY.md mostra che **non è così**: è un **backup 1:1 di sicurezza** preso il 2026-02-20 come snapshot stabile prima di "final freeze and bug fixes".

Quindi non c'è un fallimento da evitare. C'è invece un **reference point** che possiamo usare a nostro vantaggio.

Questo cambia due cose nel piano:
1. Wave 0 Day 1 — il postmortem si trasforma da "capire perché è fallito" a "capitalizzare sul reference che già abbiamo".
2. La task "audit subtree TestRosterPage" beneficia direttamente: il COMPONENT_INVENTORY.md fornisce già la dependency graph che dovevamo costruire.

---

## 1. Cosa contiene l'archivio

Backup 1:1 di **19 file** che compongono il sistema di drag-and-drop roster↔slot, congelato il 2026-02-20. La struttura:

- **7 componenti core:** `PgCard.tsx`, `CustomDragOverlay.tsx`, `WorkerCard.tsx`, `DragContextStore.ts`, `DragContext.tsx`, `TestRosterPage.tsx`, `DropFeedbackUI.tsx`.
- **4 componenti slot system:** `ResidentSlotRack.tsx`, `residentSlotValidators.ts`, `useResidentSlotController.ts`, `types.ts`.
- **6 hook:** `useResidentDropValidation.ts`, `useDragPreviewInstrumentation.ts`, `useActiveHUDState.ts`, `useActivityScheduler.ts`, `useSandboxTiming.ts`, `useSandboxTimingBridge.tsx`.
- **2 supporting:** `ActivitySlot.tsx`, `ActiveHUD.tsx`.
- **1 test:** `test-route-drag-offset.spec.ts`.
- **2 doc:** `README.md`, `COMPONENT_INVENTORY.md`.

Inoltre il `COMPONENT_INVENTORY.md` documenta in modo già strutturato:

- **Dependency graph completo** del sistema TestRosterPage (vedi sezione 4 più avanti).
- **Data sources canoniche** (config-first architecture).
- **Telemetry & persistence flows.**

Lavoro che il piano v2 avrebbe dovuto rifare nel "Day 1 audit subtree". Da non rifare.

---

## 2. Drift quantificato — i 3 mesi tra archive e oggi

| File | Archived (Feb 20) | Current (May 21) | Delta LOC |
|------|---|---|---|
| `PgCard.tsx` | 431 | 607 | **+176** (+41%) |
| `CustomDragOverlay.tsx` | 183 | 393 | **+210** (+115%) |
| `TestRosterPage.tsx` | 1330 | 1994 | **+664** (+50%) |
| `DragContextStore.ts` | 41 | 45 | +4 |
| `DragContext.tsx` | 23 | 30 | +7 |
| `ResidentSlotRack.tsx` | n/a | 821 | n/a |
| `residentSlotValidators.ts` | 133 | 133 | 0 |
| `useResidentSlotController.ts` | 401 | 402 | +1 |

**Lettura:**

- Tre file hanno avuto crescita massiccia: `PgCard`, `CustomDragOverlay`, `TestRosterPage`. Questi sono anche i tre file con la più alta densità di "portrait-fix" / "drag-fix" nei test-results del periodo aprile-maggio.
- Sei file sono restati stabili (validators, controller, types, hooks). Sono i candidati naturali per la prima certificazione: bassa volatilità → freeze a basso rischio.
- La crescita LOC non è di per sé un bug, ma significa che ogni `minimal-*` che dipende da questi file ha visto la propria superficie di rendering cambiare sotto i piedi senza un contratto che la regolasse — esattamente il vuoto che il piano v2 vuole riempire.

---

## 3. Tre lezioni dall'archivio

### Lezione 1 — Il backup 1:1 è un *artefatto fragile*

Il pattern "copio tutto in una cartella prima di toccare" ha tre problemi che il freeze v2 risolve:

1. **Non è eseguibile.** L'archivio non viene mai montato in nessuna route, quindi nessuno verifica che renderizzi correttamente in produzione. Diventa codice morto in 30 giorni.
2. **Non ha un contratto.** Niente impedisce alle dipendenze esterne (engine types, config) di cambiare in modo incompatibile con l'archivio. La "copia 1:1" non immunizza da dipendenze condivise.
3. **Non ha un trigger di drift.** Niente segnala "il file canonico è cambiato del 41% rispetto all'archivio". Solo il `wc -l` manuale del postmortem lo svela, 3 mesi dopo.

**Implicazione per v2:** il freeze deve essere (a) eseguibile (kit montabile via route), (b) contrattualizzato (`contract.ts`, `fixture.ts`, snapshot), (c) auto-alert (contract test CI che fallisce su drift).

### Lezione 2 — La data-source architecture è già canonica

Il COMPONENT_INVENTORY.md descrive una **config-first architecture** già in essere:

- Residents → `MINIMAL_GAMEPLAY_RESIDENTS` da `minimalGameplayConfig.ts`
- Activities → `ACTIVITY_DEFINITIONS` da `defaultConfig.ts`
- UI tokens → `MinimalUIConfig` da `minimalConfig.ts`
- Test harness → `DEFAULT_TEST_HARNESS_CONFIG` da `testHarnessConfig.ts`

Questa è la stessa decisione di S1 (Shift #1 del piano v2: "niente mock, usa le fonti canoniche"). Non stiamo inventando una convenzione: stiamo **riallineando le `minimal-*` a una convenzione che già esiste in `TestRosterPage`** e che le `minimal-*` hanno bypassato con mock inline.

### Lezione 3 — Sei file stabili identificano il "core invariante"

I file che non sono drifted in 3 mesi (`residentSlotValidators`, `useResidentSlotController`, `types`, gli hook timing/audio) sono il **core invariante** del sistema drag-and-drop. Sono i primi candidati per il freeze in Wave 0/1 perché sono già stati implicitamente "freezati" dal disuso.

I file volatili (`PgCard`, `CustomDragOverlay`, `TestRosterPage`) sono il **front-end attivo** e richiedono attenzione maggiore: contract test più stringenti, baseline visuale, monitoring continuo del LOC delta come early signal.

---

## 4. Dependency graph (ripreso da COMPONENT_INVENTORY.md, validato)

```
TestRosterPage (mount point /test/roster)
│
├── VillageRosterSection      [data-testid="village-roster-section"] ✓
│   └── PgCard (draggable)    [data-testid="pg-card"] ✓
│
├── ResidentSlotRack          [data-testid="resident-slot-rack-root"] ✓ (aggiunto 2026-05-21)
│   ├── ActivitySlot          [data-testid="slot-button-${slotId}"]
│   └── useResidentSlotController
│
├── CustomDragOverlay
│   └── WorkerCard
│
├── ActiveHUD                 [data-testid="active-hud"] ✓
│   └── useActiveHUDState
│
├── DragProvider
│   └── DragContextStore
│
└── useResidentDropValidation
    └── residentSlotValidators
```

I quattro componenti con testid sul root coprono le quattro `minimal-*` di prima priorità: `minimal-roster`, `minimal-pgcard`, `minimal-slotRack`, `minimal-hud`. Wave 0 può procedere su `minimal-roster` senza prerequisiti aggiuntivi.

---

## 5. Cosa fare dell'archivio dopo il freeze

L'archivio resta utile come **fossile diagnostico**:

- Quando un contract test fallisce, `diff` con la versione archived può aiutare a identificare regressioni.
- Le note "Known Limitations" del README (drag offset 46px, Playwright pointer events, portal timing) sono ancora vere e sono fonti note di flakiness per i visual test.

**Disposizione proposta (Hardening fase):**

- Mantenere l'archivio per riferimento storico ma rimuoverlo dalle `tsconfig` paths se incluso (nessuna build dependency).
- Aggiungere `_ARCHIVED_*` al `.gitignore` per nuovi log non necessari? No: è già committato, lasciare in repo.
- Linkare l'archivio dalla `kit.md` di ciascun kit interessato come "historical reference".

---

## 6. Aggiornamenti al piano v2 derivanti da questo postmortem

1. **Sezione 9, Rischio 3:** riformulare. Non c'è un "tentativo fallito" — c'è un backup di sicurezza utile. Il rischio reale è il drift non monitorato (lezione 1), gestito dai contract test CI di Sezione 7.
2. **Wave 0 Day 1, task 2 (audit subtree):** il `COMPONENT_INVENTORY.md` dell'archivio fornisce già ~80% del lavoro. Resta da fare solo l'audit *fine-grained* del JSX di TestRosterPage per identificare il subtree esatto della contract surface.
3. **Wave 0 prioritizzazione:** i sei file stabili (validators, controller, types, hooks) sono candidati per "fast-track freeze" — non richiedono il pattern completo con visual baseline, basta contract.ts + tests.
4. **Sequencing kit:** rivedere l'ordine settimanale di Sezione 5 mettendo `slotRack` e `validators-driven` PRIMA dei kit basati su `PgCard`/`CustomDragOverlay` (volatili). I "low-volatility kit" generano il momentum, quelli volatili richiedono attenzione extra.

---

## 7. Conclusione

L'archivio NON è un cimitero. È un **manifest dichiarativo** di "cosa volevamo che fosse stabile" 3 mesi fa. Il piano v2 trasforma quel manifest implicito in contratti espliciti, eseguibili e monitorati.

Wave 0 Day 1 si chiude qui. Procede l'audit fine-grained di `TestRosterPage.tsx` (task #7).
