# Minimal Gameplay – Prompts per Coordinator

## Obiettivo

Creare una pagina testabile del gameplay loop minimo (1 residente, 3 slot, HUD) e renderla landing temporanea per validare il loop prima di proseguire con Phase E.

> **Protocollo obbligatorio per gli agenti**
>
> 1. Invocare sempre `agent-execution-mandate`.
> 2. Subito dopo, invocare la skill `idle-village-task` (`.windsurf/skills/idle-village-task/SKILL.md`) per caricare i requisiti Idle Village (config-first, Style Lab, PersistenceService, telemetry, audio FX, drag & drop, safeguard suite, Kanban workflow).
> 3. Usare `/kanban-update` per qualsiasi modifica alla board.
> 4. Ogni prompt/risposta deve indicare esplicitamente la **Config-first reference** (quali file di config/hook/componenti vengono riusati). Senza questa nota il coordinator respinge il lavoro.
>
> **Frase obbligatoria del coordinator**
> In fase di assegnazione il coordinator deve scrivere **solo**: `@Cascade prendi <PROMPT_ID> (vedi doc prompts) usando la skill Idle Village Task.`

---

### Test Harness QA – comando unico

Per eseguire l'intera suite di test unitari RTL/integrazione legati a `TestRosterPage` utilizzare **sempre**:

```bash
npm run test:test-roster
```

Il comando esegue automaticamente:

1. **Vitest** (`tests/unit/testRosterPage/TestRosterPage.integration.test.tsx`, `tests/unit/testRosterPage/TestRosterPage.rtl.test.tsx`).
2. **Playwright** su tutte le spec che montano la route `/test` (`tests/e2e/idleVillage/testRosterPgCards.spec.ts`, `workerPanelTestRoute.spec.ts`, `test-route-drag-offset.spec.ts`, tutte le suite `drag-drop-*.spec.ts`, `interactive-drag-test.spec.ts`, `simple-debug-test.spec.ts`).

Usarlo come singolo “ingresso” per QA `/test`, citandolo nei log evidence IV-TEST-* e quando si richiede copertura bundle nel Kanban.

---

## Prompt 1 – Config Minima (NP-MIN-001)

**AGENT:** Config-Manager  
**SCOPE:** Creare `src/balancing/config/idleVillage/minimalConfig.ts` con definizioni minime per 1 residente, 3 slot, risorse e global rules.

**OPERAZIONI:**

1. Definire `IdleVillageConfig` con:
   - `activities`: Gold Mine (job), Forest Hunt (quest), Market (shop)
   - `globalRules`: dayLengthInTimeUnits, fatigueRecoveryPerDay, foodConsumptionPerResidentPerDay
   - `startingResources`: gold: 10, food: 5
2. Definire tipi riutilizzati: `ActivityDefinition`, `VillageResources`
3. Esportare `minimalConfig` come default export
4. Aggiungere JSDoc con descrizione attività e reward

**FILE TARGET:** `src/balancing/config/idleVillage/minimalConfig.ts`

**SAFE:** lint, build:check, kanban:lint  
**EVIDENCE:** `test-results/np-min-001-config.log`

---

## Prompt 2 – Pagina Core (NP-MIN-002)

**AGENT:** UI-Engineer  
**SCOPE:** Creare `src/ui/idleVillage/MinimalGameplayPage.tsx` con drag-and-drop, scheduler, HUD e log eventi.

**OPERAZIONI:**

1. Importare `useActivityScheduler` con `autoAdvance=true`
2. Importare `useDropFeedback` per validazione 1:1
3. Renderizzare:
   - 1 residente draggabile (riusa `WorkerCard` o custom)
   - 3 `ActivitySlot` con etichette e icone
   - HUD: Gold | Food | Fatigue%
   - Log eventi (max 3 righe, timestamp + testo)
4. Collegare `tickIdleVillage` ogni secondo
5. Integrare `PersistenceService` per salvare/ caricare stato

**FILE TARGET:** `src/ui/idleVillage/MinimalGameplayPage.tsx`

**SAFE:** lint, build:check, kanban:lint  
**EVIDENCE:** `test-results/np-min-002-page.log`

---

## Prompt 3 – HUD e Log (NP-MIN-003)

**AGENT:** UI-Engineer  
**SCOPE:** Completare HUD e log eventi nella pagina creata in NP-MIN-002.

**OPERAZIONI:**

1. Creare componente `MinimalHUD` con:
   - `Gold: X | Food: Y | Fatigue: Z%`
   - Aggiornamento reattivo su `VillageState`
2. Creare componente `EventLog` con:
   - Array max 3 righe
   - Timestamp + testo per evento
   - Auto-scroll su nuovo evento
3. Integrare entrambi in `MinimalGameplayPage`
4. Testare aggiornamento in tempo reale

**FILE TARGET:** `src/ui/idleVillage/MinimalGameplayPage.tsx` (estensione)

**SAFE:** lint, build:check, kanban:lint  
**EVIDENCE:** `test-results/np-min-003-hud.log`

---

## Prompt 4 – Persistenza (NP-MIN-004)

**AGENT:** Storage-Engineer  
**SCOPE:** Integrare `PersistenceService` per salvare/ricaricare `VillageState` della pagina minima.

**OPERAZIONI:**

1. In `MinimalGameplayPage`:
   - `useEffect` per salvare stato su ogni tick
   - `useEffect` per caricare stato al mount
   - Chiave: `minimal-gameplay-state`
2. Gestire errori silenziosamente (fallback a stato default)
3. Aggiungere pulsante “Reset” per test persistenza
4. Verificare che ricarica mantenga risorse e attività

**FILE TARGET:** `src/ui/idleVillage/MinimalGameplayPage.tsx` (estensione)

**SAFE:** lint, build:check, kanban:lint  
**EVIDENCE:** `test-results/np-min-004-storage.log`

---

## Prompt 5 – Routing Temporaneo (NP-MIN-005)

**AGENT:** Router-Engineer  
**SCOPE:** Aggiungere route `/minimal-gameplay` e renderla landing temporanea.

**OPERAZIONI:**

1. Aggiungere route in `App.tsx` o router principale:
   - `/minimal-gameplay` → `MinimalGameplayPage`
2. Impostare redirect temporaneo da root se `process.env.MINIMAL_MODE === 'true'`
3. Aggiungere link “Minimal Gameplay” in navigazione principale
4. Testare accesso diretto e redirect

**FILE TARGET:** `src/App.tsx` (o router principale)

**SAFE:** lint, build:check, kanban:lint  
**EVIDENCE:** `test-results/np-min-005-routing.log`

---

## Prompt 6 – Test Unitari (NP-MIN-006)

**AGENT:** Test-Engineer  
**SCOPE:** Scrivere unit test per pagina minima, drag-drop, loop e persistenza.

**OPERAZIONI:**

1. Test drag-and-drop validazione 1:1
2. Test avanzamento tempo e reward (mock `tickIdleVillage`)
3. Test persistenza (mock `PersistenceService`)
4. Test HUD aggiornamento
5. Test log eventi
6. Copertura >80%

**FILE TARGET:** `tests/unit/idleVillage/MinimalGameplayPage.test.tsx`

**SAFE:** lint, build:check, kanban:lint  
**EVIDENCE:** `test-results/np-min-006-tests.log`

---

## Prompt 7 – Test Roster Card Density (IV-ROSTER-DENSITY)

**AGENT:** Idle Village Interaction Engineer  
**SCOPE:** Ridurre l'altezza delle carte PG (PgCard) nella TestRosterPage assicurando che il roster harness resti leggibile e pienamente draggabile seguendo lo Style Laboratory canon.

**OPERAZIONI:**

1. Analizzare `PgCard` e `DragTestContainer` per identificare classi/varianti che determinano l'altezza verticale vs. orizzontale delle carte nel roster `/test`.
2. Introdurre una variante di densità config-first (es. `compact`) dentro `PgCard`, pilotata da `DragTestContainer` in modo che TestRosterPage possa ridurre padding/tipografia senza toccare altri consumer.
3. Aggiornare `DragTestContainer` e `VillageRosterSection` affinché leggano i nuovi token di densità da config (`useMinimalStyleLabTokens` oppure nuovo campo nel config harness) invece di hardcodare valori.
4. Garantire che la virtualization (scroll) continui a funzionare con le nuove altezze aggiornando eventuali costanti `itemHeight`.
5. Aggiornare gli snapshot/test RTL pertinenti (`tests/unit/idleVillage/PgCard.interactions.test.tsx`, `tests/unit/testRosterPage/TestRosterPage.integration.test.tsx`) per riflettere la nuova densità e assicurare che i drag events restino verdi.
6. Rimuovere eventuali `console.log` diagnostici rimasti in PgCard/DragTestContainer per mantenere pulizia log come richiesto da Idle Village Task skill.

**FILE TARGET:**
- [esistente] `src/ui/idleVillage/components/PgCard.tsx`
- [esistente] `src/ui/idleVillage/components/DragTestContainer.tsx`
- [esistente] `src/ui/idleVillage/components/VillageRosterSection.tsx` (solo wiring config)
- [esistente] `tests/unit/idleVillage/PgCard.interactions.test.tsx`
- [esistente] `tests/unit/testRosterPage/TestRosterPage.integration.test.tsx`

**CONFIG REFERENCES:**
- `src/balancing/config/idleVillage/testHarnessConfig.ts` (per eventuali override densità)
- `src/ui/styleLab/StyleLabSurface.tsx` e token Style Lab per spacing/tipografia

**SAFE:** lint, targeted tests, build:check, kanban:lint  
**EVIDENCE:** `test-results/iv-roster-density-<data>.log`

---

## Prompt 8 – Test Harness Cleanup (IV-TEST-CLEANUP)

**AGENT:** Idle Village Interaction Engineer  
**SCOPE:** Ridurre la pagina `/test` al solo roster + controlli essenziali, rimuovendo HUD/Warning/Minimal gameplay elementi non richiesti e riallineando i controlli rimasti.

**OPERAZIONI:**

1. Aggiornare `TestRosterPage.tsx` per eliminare:
   - Sezione Minimal HUD/Active HUD/Warning System.
   - Telemetria e pannelli Time Engine non necessari (Tick Interval, Warmup Delay copy).
2. Rendere la card "Time Engine" compatta:
   - Mantenere solo badge stato (Day/Night) + controlli di base (ClockWidget senza dettagli tecnici, DayNightActionCard, pulsanti Clear Slots/Restore Stamina) allineati in griglia 2 colonne.
   - Usare i token esistenti (`useMinimalStyleLabTokens`) per spacing/colore (no hardcode).
3. Garantire che `ClockWidget` supporti la prop `showTimingDetails` (già disponibile) e impostarla su `false` per il test harness.
4. Ripulire `TestRosterPage` da `console.log` superflui relativi alle sezioni rimosse.
5. Aggiornare eventuali riferimenti di tipo/telemetria conseguenti all'eliminazione dei pannelli.

**CONFIG REFERENCES:**
- `src/balancing/config/idleVillage/testHarnessConfig.ts` (timing/threshold);  
- `src/ui/idleVillage/hooks/useMinimalStyleLabTokens.ts`;  
- `src/ui/idleVillage/components/minimal/ClockWidget.tsx` (prop toggle).

**FILE TARGET:**
- [esistente] `src/ui/idleVillage/TestRosterPage.tsx`;  
- [esistente] `src/ui/idleVillage/components/minimal/ClockWidget.tsx` (solo wiring);  
- [esistente] `src/ui/idleVillage/components/DragTestContainer.tsx` (verifica densità se necessario).

**REGRESSION SAFEGUARDS:**
- `npm run lint -- src/ui/idleVillage/TestRosterPage.tsx src/ui/idleVillage/components/minimal/ClockWidget.tsx`  
- `npm run test -- tests/unit/testRosterPage/TestRosterPage.integration.test.tsx`  
- `npm run build:check`  
- `npm run kanban:lint`

**EVIDENCE:** `test-results/iv-test-cleanup-<data>.log`

**NOTE:**
- Non toccare i flussi di validazione drag/slot; focus solo sulla UI superflua.  
- Seguire `src/docs/docs/QA/test-route-drag-guidelines.md` (pagina `/test`).

---

## Prompt 9 – Picker Portrait Parity (IV-PICKER-PORTRAITS)

**AGENT:** Idle Village Interaction Engineer  
**SCOPE:** Allineare il `CertifiedWorkerPickerSheet`/`WorkerPickerSheet` al rendering delle carte roster (`PgCard`), mostrando i portrait reali invece delle iniziali quando disponibili.

**OPERAZIONI:**

1. Analizzare `PgCard` e `InlineResidentChips` per capire come vengono letti `portraitUrl`, fallback cromatici e glifi.  
2. Aggiornare `CertifiedWorkerPickerSheet` (test harness) e, se necessario, `WorkerPickerSheet` principale per:
   - Usare la stessa logica `PortraitAvatar`/`ResidentPortraitChip` dei roster (importa componenti centralizzati, nessuna duplicazione).  
   - Applicare cornici/tokens Style Lab (border, glow) presi da `useMinimalStyleLabTokens` o dallo stesso set usato in `PgCard`.
3. Assicurarsi che `resolvePickerCandidates` su `TestRosterPage` passi sempre `portraitUrl` coerente con le definizioni residenti (0 hardcode).  
4. Implementare fallback consistente: se manca il portrait, mostra iniziali + background dallo stesso token set del roster.  
5. Aggiornare i test (`WorkerPickerSheet.test.tsx`) con snapshot/asserzioni per portrait + fallback.

**CONFIG REFERENCES:**
- `src/data/characters.json` / `SLOT_LAB_CONFIG` per sorgente portrait.  
- `src/ui/idleVillage/components/PgCard.tsx` e `src/ui/idleVillage/roster/ResidentPortrait` (token ufficiale).  
- `src/ui/idleVillage/hooks/useMinimalStyleLabTokens.ts` per colori/border.

**FILE TARGET:**
- [esistente] `src/ui/idleVillage/testHarness/components/CertifiedWorkerPickerSheet.tsx`  
- [esistente] `src/ui/idleVillage/components/WorkerPickerSheet.tsx`  
- [esistente] `src/ui/idleVillage/TestRosterPage.tsx` (solo wiring `portraitUrl`)  
- [esistente] `tests/unit/idleVillage/WorkerPickerSheet.test.tsx`

**REGRESSION SAFEGUARDS:**
- `npm run lint -- src/ui/idleVillage/testHarness/components/CertifiedWorkerPickerSheet.tsx src/ui/idleVillage/components/WorkerPickerSheet.tsx src/ui/idleVillage/TestRosterPage.tsx`  
- `npm run test -- tests/unit/idleVillage/WorkerPickerSheet.test.tsx`  
- `npm run build:check`  
- `npm run kanban:lint`

**EVIDENCE:** `test-results/iv-picker-portraits-<data>.log`

**NOTE:**
- Vietato creare nuove palette locali: usare tokens Style Lab/Minimal HUD esistenti.  
- Documentare nel log eventuali residenti senza portrait (serve per QA).

---

## Priorità Esecuzione

1. **NP-MIN-001** (Config) – bloccante per i successivi
2. **NP-MIN-002** (Pagina) – bloccante per UI
3. **NP-MIN-003** (HUD/Log) – parallelo a 002
4. **NP-MIN-004** (Persistenza) – parallelo a 002/003
5. **NP-MIN-005** (Routing) – dopo 004
6. **NP-MIN-006** (Test) – dopo 005

---

## Success Criteria Complessivi

- ✅ Pagina caricabile su `/minimal-gameplay`
- ✅ Residente draggabile su slot
- ✅ Loop avanza ogni secondo
- ✅ HUD mostra risorse in tempo reale
- ✅ Log eventi mostra ultime 3 azioni
- ✅ Stato salvato e ricaricabile
- ✅ Test unitari passanti
- ✅ Nessun errore console

---

## Note per Coordinator

- Assegnare i prompt in ordine di priorità.
- Verificare che ogni agente usi `agent-execution-mandate` prima di iniziare.
- Bloccare task successivi finché il precedente non è “Completato”.
- Usare `SAFE suite` standard per ogni prompt.
