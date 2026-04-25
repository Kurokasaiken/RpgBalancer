# Idle Village Map Context Refactor Proposal

## 1. Contesto attuale
- `useMapContext` aggrega clock, stato residenti, drag & drop, telemetria, seed/reset, pannelli demo, HUD e heatmap in un unico hook da ~800 righe (@src/ui/idleVillage/hooks/useMapContext.ts#1-817). Il file contiene logica di orchestrazione, di derivazione view-model (es. `residentSlotRackSlots`) e di stato locale (es. `selectedResidentId`).
- La pagina principale (`MapPageContent` in @src/ui/idleVillage/map/MapPage.tsx#71-154) destruttura oltre 40 proprietà simultaneamente. Ogni `setState` interno al contesto (anche `setAssignmentFeedback`) causa un render completo di tutti i consumer.
- `useVillageSandbox` e strumenti come `ResidentRelationshipGraphTool` continuano ad esporre la stessa superficie monolitica, bloccando l'adozione di hook specializzati nei test (es. @tests/unit/idleVillage/useMapContext.test.tsx#1-314 ri-mocka l'intero contesto per verificare un singolo campo).
- L'assenza di memoizzazione mirata è evidente: solo pochi blocchi usano `useMemo`, mentre provider/consumer condividono referenze mutevoli (es. `activityAreaHandlers` viene ricreato ad ogni render).

## 2. Best practice di riferimento
- Thoughtspile — *How to destroy your app performance using React contexts* (Rule 1 e Rule 2) rimarca che ogni cambio `value` di un provider ri-renderizza tutti i consumer e consiglia context piccoli stabilizzati con `useMemo`.
- DeveloperWay — *How to write performant React apps with Context* spiega come separare stato (mutabile) da API (immutabile) per minimizzare invalidazioni e suggerisce provider multilivello.
- Axlight/Daishi Kato — *4 options to prevent extra rerenders with React context* illustra pattern con context multipli + selectors/memoized stores, anticipando l'architettura slice proposta.
- Frontend Armory — *React context and performance* mostra che aggiornare il `value` di un context monolitico forza re-render globali e suggerisce provider specializzati o store esterni.

## 3. Obiettivi del refactor
1. **Ridurre il perimetro di re-render**: i componenti devono sottoscriversi solo allo slice necessario (clock, roster, drag state, ecc.).
2. **Migliorare la composizione**: `useMapContext` diventa un orchestratore leggero che combina hook specializzati senza logica applicativa duplicata.
3. **Testabilità e osservabilità**: ogni slice avrà test dedicati (Vitest) e diagnostica mirata.

### Metriche di successo
- Profilo React DevTools: ridurre del ≥40% i render della `MapPage` quando cambia solo il clock (`cycleProgressFraction`).
- Coverage test: introdurre spec mirror per ogni provider (`useMapClockController.test.ts`, ecc.) con assert mirati (play/pause, seed/reset, drag flows).
- Bundle diff: `useMapContext.ts` ≤ 200 righe e rimozione di duplicazioni (slot rack, HUD) dai consumer per facilitare tree-shaking.

## 4. Architettura proposta
### 4.1 Slice hooks dedicati
| Slice | Hook proposto | Responsabilità |
| --- | --- | --- |
| Clock & ciclo giorno/notte | `useMapClockController` (wrap di `useSandboxClock`) | Espone `clockState` stabile (`isCyclePlaying`, `cycleProgress`, `toggleCyclePlaying`, `subscribeClock`). Configurare `useMemo` sul `value` per evitare nuove referenze quando nulla cambia. |
| Residenti & roster | `useMapResidents` | Incapsula reseed/reset (logica oggi in `useMapContext` righe 244-361), normalizza `residentsById`, calcola derived (`availableCount`, `compatibility`). Fornisce eventi (`scheduleRosterSeed`, `handleResetResidents`). |
| Drag & slot assignments | `useMapAssignments` (wrap di `useSandboxDragController` + `useSandboxSlotModels`) | Responsabile del binomio `dragController` + `slotAssignments`. Espone un `AssignmentsContextValue` con handler memoizzati (`handleWorkerDrop`, `canSlotAcceptDrop`, `slotDropStates`). |
| Telemetria & HUD | `useMapTelemetryBridge`, `useMapHudState` | Disaccoppia `useQuestTelemetry` e `selectActiveActivityHudData`. I consumer (`QuestChronicle`, HUD overlay) leggeranno context dedicati evitando di re-renderizzare il roster. |
| Demo / Interaction mode | `useMapDemoPanel`, `useMapInteraction` | Racchiude stato locale (demo panel, resident selection) che oggi attiva re-render per l’intera mappa. |

`useMapContext` continuerà a esportare un oggetto unico **ma ottenuto tramite `useMemo` che compone i slice**. Dove possibile, i consumer principali (Roster, LocationCard, HUD, ecc.) saranno convertiti per leggere direttamente il loro slice tramite hook pubblici (`useMapResidentsContext`, `useMapClockContext`, ...). Ciò consente di migrare gradualmente.

### 4.2 Provider multipli
Creiamo uno `IdleMapProvider` che annida provider specializzati:
```
<IdleMapClockProvider>
  <IdleMapResidentsProvider>
    <IdleMapAssignmentsProvider>
      ...
    </IdleMapAssignmentsProvider>
  </IdleMapResidentsProvider>
</IdleMapClockProvider>
```
Ogni provider stabilizza il proprio `value` (via `useMemo`) così da evitare cambi di referenza inutili, seguendo la regola 2 dell'articolo citato.

### 4.3 API pubblica
- `useMapContext` rimane per compatibilità ma leggero: legge i vari context slice e li riversa in un oggetto memoizzato. Segneremo l’API come *bridge* e incentiveremo i componenti a consumare direttamente i nuovi slice.
- Esponiamo tipi `MapClockState`, `MapResidentsState`, ecc., per chiarezza e per i test.

## 5. Piano di esecuzione
### Fase 1 – Strutturale (1.5 giorni)
1. **Clock slice**
   - Codice coinvolto: `useSandboxClock`, `useMapContext` (righe 193-238), `MapPage` e `VillageSandbox` per i controlli clock.
   - Strategia: creare `IdleMapClockProvider.tsx` che istanzia `useSandboxClock` e fornisce solo i valori necessari; `useMapContext` leggerà il nuovo contesto invece di creare direttamente il clock.
   - Ricerca online: memorizzare il `value` con `useMemo` seguendo DeveloperWay (separare API/stato) per mantenere stabile l'oggetto.
   - Test: aggiungere `useMapClockController.test.ts` che verifica `toggleCyclePlaying` richiama `resumeTimer/pauseTimer` (copiando gli assert presenti in `useMapContext.test.ts`).
2. **Residents slice**
   - Codice coinvolto: logica di seed/reset/resync in `useMapContext` righe 244-361, `StyleLaboratoryPanel`, `ResidentRosterSection`.
   - Strategia: estrarre `useMapResidents` che prende `villageState`, `config`, `resetState` e restituisce `residents`, `residentsById`, `scheduleRosterSeed`, diagnostica. Il provider limiterà i re-render del roster.
   - Ricerca online: Thoughtspile consiglia di isolare state rumorosi (roster cambia spesso) per ridurre invalidazioni globali.
   - Test: snapshot RTL per `Roster` che verifica nessun render extra quando cambia solo `clockState` (profiling con `jest.spyOn(console, 'warn')` + counters).
3. **Bridge aggiornato**
   - `useMapContext` diventa un compositore: `const clock = useMapClockContext(); const residents = useMapResidentsContext(); ...` e restituisce un oggetto memoizzato con `useMemo([clock, residents, assignments, ...])`.
   - Aggiornare `useVillageSandbox` per forwardare il bridge senza rotture.
   - Introdurre `IdleMapProviders` in `MapPage` (`<IdleMapProviders><MapPageContent/></IdleMapProviders>`).

### Fase 2 – Drag & Slot (1 giorno)
1. **Assignments provider**
   - Codice: `useSandboxSlotModels.ts`, `useSandboxDragController.ts`, sezione drag @useMapContext righe 363-451.
   - Strategia: creare `useMapAssignments` che riceve `clockState` (per `isDayPhase`), `residentsById` e `config` via parametri/contesti e restituisce `AssignmentsContextValue`.
   - Ricerca online: Axlight propone context separati con selectors; qui i componenti `ActivitySlotCard` e `LocationCard` useranno `useAssignmentsContext(selector)` per leggere solo lo stato necessario (slot map, drop state, handlers).
   - Test: portare i test di `useSandboxDragController` dentro `useMapAssignments.test.ts` con `act` su drop/drag per assicurare `setAssignmentFeedback` resta locale.
2. **Consumer update**
   - Files: `ActivitySlotCard.tsx`, `LocationCard.tsx`, `AssignmentFeedback.tsx`, `ResidentSlotRack.tsx`.
   - Cada componente importerà il nuovo hook invece di `useMapContext`. Introdurre fallback `useMemo` per calcolare derived UI (`progressFraction`).
   - Regressioni da monitorare: telemetria di drag (dipende da `dragController`), `DragErrorOverlay` (usa `dragErrorRecovery`).

### Fase 3 – Telemetria, Demo & HUD (0.5-1 giorno)
1. **Telemetry provider**: incapsula `useQuestTelemetry` + `questTelemetryPanelState`. La `QuestChronicle` leggerà solo questo contesto.
2. **HUD provider**: sposta `selectActiveActivityHudData` fuori da `useMapContext` e crea `useMapHudState` con memoization su `activities` e `residentsById`.
3. **Demo/interaction provider**: sposta `demoPanelState`/`handlers` e `useSandboxInteractionMode` in context opzionali caricati solo su MapPage (Style Lab può ometterli).
4. **Ricerca online**: Frontend Armory consiglia provider opzionali per sottosistemi rari, così i consumer non pagano re-render se disabilitati.

### Fase 4 – Rifinitura (0.5 giorno)
1. Aggiornare documentazione (`idle_village_plan`, `minimal_gameplay_implementation_plan`, questa scheda) con diagrammi provider e mapping consumer → slice.
2. Integrare `renderWithIdleMapProviders` nei test condivisi per ridurre boilerplate.
3. Integrare strumenti di profiling: `MapPage.rtl.test.tsx` misurerà i render usando `renderCount` pattern (React profiler API) per verificare che il roster non reagisca a `clockState`.
4. Ridurre `useMapContext.ts` a ≤ 200 righe, composto da: import hook, recupero contesti, `useMemo` e retro-compatibility shim.

## 6. Rischi & mitigazioni
| Rischio | Impatto | Mitigazione |
| --- | --- | --- |
| Refactor simultaneo crea regressioni di drag/hud | Alto | Procedere per fasi, mantenendo `useMapContext` come facciata fino alla fine. Coprire i nuovi provider con test unitari + smoke test di `MapPage`. |
| Provider annidati aumentano complessità dei test | Medio | Fornire helper `renderWithIdleMapProviders` con override selettivi e mocking di slice (es. `clockValueOverride`). Documentare l'helper nei piani di QA. |
| Cicli di re-render persistono per consumer legacy | Medio | Introdurre lint custom (AST) che vieta l'accesso diretto a `useMapContext` nei componenti aggiornati. Usare React Profiler e console diag per confermare riduzione render. |
| Stale data tra provider | Medio | Definire contratti espliciti (`MapResidentsState`, `MapAssignmentsState`) con dipendenze dichiarate. Se un provider dipende da un altro (es. assignments → residents), leggere il context e derivare `useEffect` di sync per mantenere coerenza. |

## 7. Deliverable per la fase successiva
- PR 1: Introduzione clock/residents provider + aggiornamento Roster/ResourcePanel.
- PR 2: Assignments provider + aggiornamento Activity grid.
- PR 3: Telemetry/HUD provider + cleanup residuo.
- Report al coordinatore dopo ogni PR con metriche di render count (profiling pre/post).

### Allegati richiesti per ogni PR
1. Diagramma provider (Mermaid) allegato nel PR description.
2. Tabella benchmarking render (prima/dopo) allegata a `test-results/idle-map-refactor-metrics.md`.
3. Evidenza `npm run lint -- src/ui/idleVillage`, `npm run test -- tests/unit/idleVillage`, `npm run build:check`, `npm run kanban:lint`.

## 8. Appendice – Ricerca online
| Fonte | Insight applicato |
| --- | --- |
| [Thoughtspile – React context dangers](https://thoughtspile.github.io/2021/10/04/react-context-dangers/) | Necessità di split & memoization dei provider; guida Rule 1/2 per evitare invalidazioni globali. |
| [DeveloperWay – Performant React Context](https://www.developerway.com/posts/how-to-write-performant-react-apps-with-context) | Separare API immutabili da stato mutabile e usare provider componibili. |
| [Axlight – 4 options to prevent extra rerenders](https://blog.axlight.com/posts/4-options-to-prevent-extra-rerenders-with-react-context/) | Implementare context slice + selectors/bridge per evitare re-render inutili (ispirazione per `AssignmentsContext`). |
| [Frontend Armory – React context and performance](https://frontarm.com/james-k-nelson/react-context-performance/) | Conferma che aggiornare un provider monolitico è costoso; raccomanda provider multipli e store esterni quando opportuno. |

Con questo approccio manteniamo il vantaggio di avere una “single source” ma evitiamo che `useMapContext` resti un *god object*, migliorando performance e manutenzione senza riscrivere l’intera pagina in un unico step.
