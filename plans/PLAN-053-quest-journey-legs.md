# PLAN-053: Quest journey — andata/svolgimento/ritorno come fasi temporali + tragitto riempito sulla mappa (R-226)

**Status:** `baptized` — Director 2026-10-19 («procedi»)
**Desiderata:** R-226 `in corso` (2026-10-18, emersa dall'eye-check OB-8 di PLAN-050)
**Dibattito multi-AI web:** run `mind-weaver/.mw/runs/20261018-2119-plan053-quest-legs/` —
chiuso via **`decision_memo`** (cap meccanico MAX_ROUNDS=10 in fase di convergenza;
~3 round bruciati dal thread chatgpt morto in trasporto, poi reseed riuscito).
4/5 ACCEPT su r010 (claude, gemini, grok, deepseek); l'OBJECT di chatgpt su r010 è
**interamente adottato in r011** — acceptance su r011 non raccoglibile per il cap.
Artifact finale: `artifact-r011.md`, sha256 `d9f30bf4afa707d8a6859d3189e503b7e6751189d0e781f53f7d072cbcd2672a`.
**Relazioni:** figlio concettuale di PLAN-050 (il feedback che lo ha generato);
precedente diretto: la marcia del goblin host PLAN-033 (`INVASION_MARCH_DAYS`,
`INVASION_LAND`/`INVASION_VILLAGE`) — meccanismo da generalizzare, non duplicare.
La scena cinematica `ritorno` esce dal flusso fasi (sorte a OB-7).

**Richiesta Director (verbatim):**
> *"Andata e ritorno dovrebbero essere tipo un tragitto che viene riempito che
> parte dal villaggio e arriva a dove c'è il POI sulla mappa […] Quando finisce
> la quest un tragitto x tornare al villaggio che si riempie in base al tempo.
> Le quest dovrebbero avere un valore in giorni di Andata, Svolgimento e
> ritorno (che dovrebbe essere uguale ad andata)."*

## 1. Grounding (corretto dal dibattito — il draft iniziale aveva errori fattuali)

- **Svolgimento ≠ somma fasi blueprint.** Il run `/game` è il motore S1 a nodi con
  **durata emergente**: `estimatedDurationTicks` (authored, denominatore iniziale)
  + nodi extra visitati + attese frontier del giocatore. Le durate fisse authored
  si applicano **solo** ad andata e ritorno.
- **Clock corretto**: giorni di gioco → tick via `dayLengthInTimeUnits` (stessa
  famiglia della marcia goblin). **Non** `msPerDay` di `questTimeScale` — quello
  serve il sottosistema planner/kit, non questo.
- **Gate globale "one expedition out"**: oggi una sola rotta alla volta è
  possibile; la struttura dati resta multi-run-ready (journal keyed su `runId`)
  ma nessuna gestione concorrenza è richiesta ora — solo difensiva.
- **Il viaggio esiste già nella fiction**: `viaggio`/`START_NODE` (con mercante
  interattivo), `gob-ritorno` → agguato, `rv-ritorno-evento`, `mi-ritorno` sono
  nodi authored dello scenario — DQ-2-B li mappa sulle fasi.
- **`run.ended` oggi è l'autorità unica** per release residenti, gating, report,
  ricompense — PLAN-053 lo splitta (§4).

## 2. Ruling Director acquisiti (non rinegoziabili)

- **Terminologia**: **fasi** — `andata` / `svolgimento` / `ritorno` (non "gambe",
  anglicismo rigettato dal Director).
- **DQ-1**: i residenti restano **bloccati fino all'arrivo al villaggio**; il
  ritorno è **una fase speciale della quest** (non cosmetica).
- **DQ-2-B**: i nodi viaggio dello scenario si **ri-authorano sulle fasi**; lo
  scenario interattivo gira **durante** il viaggio (non solo dopo andata).
- **DQ-3-α (2026-10-19)**: loot **encumbered-until-arrival** — viaggia col party,
  **visibile sul marker** durante il ritorno, perso **solo su wipe** (non su
  ferite/morti/ambush vinto). Nessun flag `ritornoRisk`, nessun sealed loot.
- **D-x del draft originale, ora risolte**: D-1 `travelDays` su `QuestPoi`
  (assenza → `fasi === null`, comportamento legacy); D-2 retta di default +
  waypoints opzionali; D-3 ritorno = stessa polyline in direzione inversa;
  D-4 scena `ritorno` esce dal flusso (sorte a OB-7); D-5 wipe = nessun ritorno,
  fail con sopravvissuti = ritorno; D-6 nessuna migrazione mid-flight.

## 3. Decisioni ancora dovute al Director (marcate, non decise in silenzio)

- **Rollback policy** — al PR di T-003: `questJourneyEnabled` off + i run journey
  in volo completano su codice shippato per una release, **oppure** shim
  hydrate-time `returning → ended, settle now` keyed su `engineSchemaVersion <
  N_journey` (`N_journey` = costante in codice = engineSchemaVersion corrente
  + 1). Lo shim **non** è downgrade support per un vecchio binario su save nuovo.
- **XP su wipe-in-ritorno dopo success-al-POI** — DQ-3-α copre il loot, non l'XP.
  Default provvisorio "no XP" pinnato da **test nuovo in T-003**: il PR del
  ruling aggiorna il test nello stesso commit (caso nuovo, non regola esistente —
  la characterization T-002 non lo può coprire).
- **Rappresentazione loot badge** (icone item vs count chip) — fissata in T-006
  prima della card di visual-fork.
- **Sorte scena `ritorno`** — epilogo d'arrivo o dismissione: eye-check OB-7.

## 4. Runtime model (artifact r011)

### Autorità temporali (una sola per dominio)
- **Travel clock**: `travelDays` authored (giorni di gioco) × `dayLengthInTimeUnits`,
  congelato al launch come `ticksPerDay` (mai riletto live). Unica fonte per il
  fill della rotta e per `faseElapsedTicks` di andata/ritorno.
- **Motore scenario**: unica autorità per svolgimento (denominatore emergente).
  Nessun secondo scheduler.
- **Frontier**: unica autorità per pending/waiting dei beat. Nessun pin-scheduler.

`faseAt(run, nowTick)` = **proiezione pura** dello stato autorevole →
`{ fase, faseElapsedTicks, faseProgress, routeProgress, parked, pendingDecision,
endpointResolving }`. Progressi separati, mai fusi:
- `faseProgress` = avanzamento temporale della fase (clock / travelDays, include
  il tempo parcheggiato).
- `routeProgress` = posizione geometrica (arc-length, escluso tempo parcheggiato).
- **Nessun "journey progress globale"** comanda il marker: in svolgimento
  emergente un rapporto globale può regredire quando cresce il denominatore.

### Frozen at launch vs journal mutabile
- **Frozen**: `travelDays`, `ticksPerDay`, polyline rotta (waypoints risolti),
  pin dei beat, `runSeed`, `engineSchemaVersion`, content hash scenario,
  `questJourneyEnabled` (letto solo al launch).
- **Mutabile (journal)**: `currentFase`, beat journal
  `{nodeId, pin, openedAtTick, resolvedAtTick}`, `accumulatedParkedTicks`,
  `parkedNodeId`, `processedUpToTick`, stato party live.
- `endpointResolving` è **derivato** (`routeProgress ≥ 1` ∧ pin irrisolti nel
  journal — NON `faseProgress`), mai persistito.
- `travelTicksConsumed`: **doppia misura del tempo** — `rawElapsed =
  nowTick − launchedAtTick` (timestamp UI/journal) vs `consumedTravel =
  processedUpToTick − launchedAtTick − accumulatedParkedTicks` (routeProgress).

### Beat di viaggio — regola ALPHA ibrida (convergenza 5/5)
- **waiting frontier** (choice/combat: mercante, agguato): **parcheggia** il marker.
- **pending/auto-risolvibili** (info/harm/check): **non parcheggiano** — si aprono
  al pin (`openedAtTick`) e maturano con una sola regola deterministica:
  `resolvedAtTick = openedAtTick + authoredDurationTicks` sul tick quest condiviso,
  indipendente da posizione marker e stato parked. Il marker li **supera** mentre
  maturano; un pending aperto non ancora maturo a fill 100% produce
  `endpointResolving` (stato `arrived-resolving` distinto, non parked).
- Un pending pinnato **dopo** un waiting parcheggiato si apre solo dopo la
  risoluzione + ripresa (i pin oltre il park non si aprono durante il park).
- **RNG beat**: `seedString = "${runSeed}:${nodeId}"` (nodeId raw), hashed 32-bit
  con la stessa derivazione seeded-RNG del motore scenario; validatore vieta `:`
  nei nodeId.
- **Fine fase** = fill 100% **AND** tutti i beat richiesti risolti. Beat pinnato
  a 1.0 si risolve prima dell'apertura di svolgimento.
- **Disciplina authoring asimmetrica**: `andata` = **reject** su ≥2 waiting;
  `ritorno` = **warning** (contenuto authored può legittimamente avere più beat).
  Pending che dominerebbe il segmento residuo → warning su entrambe.
- **Leggibilità del park — requisito, non polish**: badge crossroads sul marker;
  chip HUD "attende una decisione" (la mappa può non essere visibile); `parked` +
  `pendingDecision` esposti dal selector; parked ≠ paused visivamente; camera
  re-center on park/arrival.

### Avanzamento deterministico (il nucleo del dibattito r4→r10)
`advance` = **loop discreto-eventi con ri-scoperta** — dopo ogni transizione
ri-calcola il prossimo evento sul residuo (aprire un pin può creare nuove
interruzioni: un check che wipe-a, un pending che matura subito):

```
t = processedUpToTick
loop finché residuo [t, t1) non vuoto:
  E = evento più precoce nello stato CORRENTE su [t, t1):
      crossing prossimo pin | maturazione beat aperto | fill 100% fase | outcome/wipe
  nessun evento → consuma travel fino a t1; break
  consuma travel in [t, t_E) → travelTicksConsumed / routeProgress
  applica transizione di E (pin → apre; waiting → PARK, residuo → parked; break)
  t = t_E; ri-scopre E' sul residuo
```

- **Watermark `processedUpToTick`**: unico t0 di ogni `advance` — il caller non
  fornisce mai un t0 arbitrario. `t1 < processedUpToTick` rejected: throw in
  dev/test, clamp + warning strutturato in produzione. `processedUpToTick ≥ t1`
  → no-op side-effect-free; il commit per-tick di transizioni/settlement è un
  **passo separato** che gira comunque.
- **Risoluzione waiting a T** = mutazione di stato con contabilità immediata +
  **drain idempotente degli eventi a T** in ordine canonico (risoluzione input
  → aperture pin a T → maturazioni `resolvedAtTick = T` → terminali/confine),
  **prima** di qualsiasi avanzamento oltre T. Pone `parkedNodeId = null`,
  `processedUpToTick = T`; per una waiting `openedAtTick = parkStartTick`.
  Idempotenza via journal (voce già registrata mai ri-processata) → reload tra
  risoluzione e prossima advance sicuro. Nessuna chiamata zero-length.
- **Ordinamento tie a pari tick**: risoluzione input-driven → aperture pin
  (ordine progressione) → maturazioni → effetti terminali → confine fase →
  settlement.
- Durante il park la scoperta è limitata a eventi clock-driven (maturazioni,
  outcome) — il moto è congelato ma i beat timed continuano a maturare.
- Troncamento: `truncationPin = travelTicksConsumed(tTravelEnd)/totalTravelTicks`
  — pin in pin-space, il pin esattamente al park apre (è lui che ha causato il park).
- Guardia `maxIterations` bounded; `maxIterations` superato → throw dev/test,
  defer + warning strutturato in produzione.
- Selector: `pendingDecision` (waiting attende input, implica `parked`) vs
  `endpointResolving` (fill 100% con pending aperto) — mai entrambi con `parked`
  (precedenza parked > endpointResolving).

### Contratto pin (Zod, validazione dura)
- `travelDays`: Zod **integer ≥ 1**. Ritorno eredita lo stesso valore, esatto.
- `pin`: numero in `[0,1]` = frazione arc-length nel progress space **della fase**
  (andata: 0=villaggio→1=POI; ritorno: 0=POI→1=villaggio). Monotoni non-decrescenti;
  duplicati solo se espliciti; invalidi → reject, mai clamp silenzioso.
- Nodo raggiunto da edge di nodo pinnato eredita il pin.
- Dentro andata/ritorno i nodi **non consumano travel budget**;
  `estimatedDurationTicks` conta solo nodi svolgimento.

### Outcome vs settlement — split del lifecycle
`run.ended` diventa due tick distinti:
- `outcomeResolvedAtTick`: verdetto motore (fine svolgimento) **o** wipe in
  qualunque fase.
- `settledAtTick`: primo tick con fill ritorno 100% **AND** tutti i beat di
  ritorno risolti (derivato dal journal, non precomputabile) — **oppure**
  `outcomeResolvedAtTick` se wiped (un wipe non arriva mai: settle immediato,
  altrimenti gate morto).
- `runPhaseStatus(run, nowTick)` → `active | returning | settled | wiped`
  (+`lastFase` per il report).
- `settleIfArrived(run, nowTick)`: reducer puro idempotente su tick e hydrate,
  journal key `settle:<runId>` — conseguenze (XP, ferite, morti, release
  `isOnExpedition`, report, gate) applicate **una sola volta**.
- **Frozen a fine svolgimento**: verdetto quest + loot manifest (snapshot
  encumbered). **Live fino all'arrivo**: stato party (ferite/morti — i beat di
  ritorno lo mutano).
- **Wipe in ritorno**: override verdetto → `wiped`, loot encumbered perso; report
  = doppio-verdetto (verdetto al POI + `lastFase` — success-al-POI ≠ run-success).
- Loot di un morto con sopravvissuti: il manifest non cambia.
- **Grep/lint guard**: nessun consumer legge `run.ended` per release/gating/report.
- **Ordine di fine viaggio**: marker → villaggio → `settledAtTick` → report apre
  → rotta **fade on dismiss**. Reduced-motion: stessa sequenza di stati, tween
  saltati.
- **Terminali tipizzati**: `contentCompleteAtPoi | returnWithSurvivors | wiped`
  (+ terminalità durante ritorno); `contentCompleteAtPoi` è il trigger che apre
  la fase ritorno. Un solo wiped-terminal path con `lastFase` nel report.

## 5. Map layer (QuestRouteFill)

- Una rotta per run attivo (`runId` stabile; gate sequenziale oggi — struttura
  multi-run-ready, niente gate nascosti).
- Arc-length interpolation: cumulative segment lengths precomputate + memoized;
  `pointAt` unit-testato (monotonia, simmetria inversa ritorno(t)=andata(1−t)).
  Polyline validata (no zero-length, no endpoint coincidenti, waypoint duplicati
  → reject). Una sola funzione di conversione coordinate condivisa
  anchor↔POI.
- `vector-effect: non-scaling-stroke` (o equivalente Pixi) sotto zoom camera —
  verificato su entrambi i meccanismi (SVG polyline + marker Pixi/sticker).
- Marker: badge crossroads quando parked, indicatore loot encumbered in ritorno,
  direzione invertita su ritorno, fill continuo al cambio fase.
- Reduced-motion: salto istantaneo al progress corrente.
- Reload mid-route: ricostruzione esatta da journal (fase, parked, arc offset).

## 6. UI dettaglio (convergenza 5/5)

Tre sub-barre, **nessun totale esatto** (svolgimento è emergente — il totale
mentirebbe):
- Andata: **Nd** (esatto, authored).
- Svolgimento: **~Nd** = `estimatedDurationTicks`→giorni, aggiornato live dal
  denominatore. Nessun campo `svolgimentoDays` nuovo (seconda fonte di verità).
- Ritorno: **Nd** (esatto, = andata — verbatim Director).
- Chip parked "attende una decisione". i18n `idleVillage.questJourney.*` IT+EN.

## 7. Validazione authoring (CI, con allow-list)

DAG delle fasi — **solo su POI con `travelDays`** (scenari legacy untagged
esenti): START ∈ andata; ogni path da START raggiunge un'ancora ritorno; ogni
terminale è wipe o ancora ritorno; nessun ciclo attraversa fasi; nessun beat
irrisolvibile; ≥1 nodo svolgimento; pin monotoni; ≥2 waiting in andata = reject,
in ritorno = warn. Copertura esplicita: `viaggio`, `gob-ritorno`, `gob-agguato`,
`gob-fine`, `rv-ritorno-evento`, `mi-ritorno`.

## 8. Compatibilità / rollout

- `travelDays` opzionale nello schema (retro-compat); **policy authoring**: ogni
  POI con quest lo authora (esistenti re-authored in T-004); assenza = solo legacy.
- Convenzione valori placeholder documentata con **entrambi** i bound: troppo
  corto → andata "loading screen"; troppo lungo → ritorno invisibile entro la
  finestra di check-in. Balancing numerico fuori scope.
- Run pre-deploy: nessuna migrazione mid-flight. Interpretazione gated su
  `engineSchemaVersion` + `fasi !== null` + content hash congelato — mai sul
  file scenario live. Test: snapshot old-version → poiView byte-identico.
- **Characterization suite PRIMA dei cambi** (T-002): golden snapshot
  poiView/halo/journal/settlement per run `fasi === null`, a ogni commit; solo
  i test che coprono run con fasi possono cambiare, lista esplicita in PR.
  T-001 deve essere **strettamente additivo** — nessun default iniettato nei
  POI esistenti.

## 9. Visual fork gate (v35)

- **Rotta sulla mappa (T-005)**: `visual-fork: REQUIRED` — card + preview su
  localhost + ruling Director **prima** di scrivere il layer (stile linea,
  marker party, badge). Il precedente marcia-invasione è input, non baseline
  ratificata. Loot badge: rappresentazione fissata in T-006 prima della card.
- Layout fasi nel dettaglio: `visual-fork: skipped` — riuso primitives
  HudChip/seal esistenti (puntatore: ResidentSlotRack marching rows).

## 10. Task

| ID | Cosa | Acceptance |
|----|------|-----------|
| T-001 ✅ 2026-10-19 | **Modello puro** — schema Zod (`travelDays` int ≥1, `pin` [0,1], waypoints, `fasi` su QuestPoi), `faseAt`, `travelTicksConsumed`, seeded-RNG beat. Strettamente additivo (nessun default nei POI esistenti) | FATTO — 31 test verdi; bundle `.mw/runs/plan053-t001-quest-journey-model/` PASS; evidence `test-results/PLAN-053-T-001-evidence.md` |
| T-002 ✅ 2026-10-19 | **Characterization suite legacy** — golden snapshot poiView/halo/journal/settlement per run `fasi === null`, catturata **prima** di ogni cambio comportamentale | FATTO — `questJourneyCharacterization.test.ts` (5 test, golden su journal/poiView/terminal/settlement + revive D-6); bundle `plan053-t002-legacy-characterization` PASS 4/4; evidence `test-results/PLAN-053-T-002-evidence.md` |
| T-003 ✅ 2026-10-19 | **Motore** — split outcome/settlement, `settleIfArrived` idempotente, `runPhaseStatus`, advance loop + watermark + drain-at-T, beat journal, parked/endpointResolving, terminali tipizzati, wipe settle | FATTO — `questJourneyEngine.ts` (DES + watermark + drain) + patch `questRun.ts`/`useQuestRun.ts`/`questJourney.ts`; seam `CreateRunInput.journey`; 19 test §11 verdi + golden legacy invariati; bundle `plan053-t003-journey-engine` PASS 5/5; evidence `test-results/PLAN-053-T-003-evidence.md`; ruling rollback+XP Director **ancora dovuti al merge** |
| T-004 ✅ 2026-10-19 | **Migrazione nodi + validatore DAG + re-authoring scenari** (DQ-2-B): `QuestNode.fase` (type+schema parity), `fasi` authored su poi-goblin/poi-rovine, `questJourneyAuthoring.ts` (DAG §7 + resolver launch-spec), gate `quest:journey:lint`, wiring `send` | FATTO — `QuestNode.fase?: 'andata'/'svolgimento'/'ritorno'` (assente = svolgimento) su `questScenario.ts` + `QuestNodeSchema`; `QuestJourneyFasiSchema.svolgimentoEntryNodeId`; 5 nodi ritorno goblin + 2 rovine (+2 miniera, POI legacy inerte); `questJourneyAuthoring.ts` validatore DAG §7 (pin↔fasi, forward-only, reachability con seed da pin/boundary, non-decreasing pins, waiting/pending warnings) + `resolveQuestJourneyLaunchSpec`; probe routing reale `probeQuestJourneyEdges` (check verdicts + extras `gob-ritorno→gob-fine`); runtime: boundary svolgimento→ritorno con freeze verdetto, chain-protection dei beat pinnati, end-in-ritorno ripristina sentinel; session `send` costruisce e passa lo spec; CI gate = `npm run quest:journey:lint` (vitest, alias npm); test: 19 validator + 2 E2E authored verdi; golden legacy byte-identici (fasi inerti senza spec); bundle `plan053-t004-journey-authoring` OB-1..6 PASS, verdict BLOCKED solo su trust-set drift parallelo `scripts/verification/*` (T-13, non scope); evidence `test-results/PLAN-053-T-004-evidence.md` |
| T-005 | **Rotta sulla mappa** — `QuestRouteFill`: polyline + fill + marker + badge; **visual-fork card + preview + ruling PRIMA del codice layer** | OB-3; e2e headless fill 0→1 su clock finto; eye-check Director |
| T-006 | **UI dettaglio** — 3 sub-barre (Nd/~Nd/Nd), chip parked, loot badge (repr fissata qui, prima della visual-fork card) | vitest render; i18n:validate; nessuna stringa hardcoded |
| T-007 | **Closure** — docs trusted, R-226, evidence, edge cases residui, scena `ritorno` ruling applicato | safeguards verdi + `verify:bundle` |

## 11. Contratto (obbligazioni verificabili)

- **OB-1** `faseAt`/`travelTicksConsumed` property-tested: pause, park,
  big-jump ≡ tick-by-tick, confini fase, ritorno=andata, watermark (no gap,
  no pin skipped), drain-at-T con evento coincidente incl. reload.
- **OB-2** `settleIfArrived` idempotente: journal identico tick/big-jump,
  nessun doppio effetto, gate riaperto; reload in ogni stato (transito, parked,
  endpointResolving, confine, ritorno, outcome-prima-arrivo); salto singolo
  che attraversa ≥2 pin + confine ≡ tick-by-tick.
- **OB-3** rotta fill + marker + parked badge + loot badge + reversal symmetry
  + eye-check Director (visual-fork). Stroke sotto zoom su entrambi i meccanismi.
- **OB-4** E2E deterministico: svolgimento → ritorno con ≥1 beat interattivo →
  reload durante park → arrivo → residenti rilasciati, settlement ×1, report,
  rotta fade; wipe-in-ritorno (doppio-verdetto), wipe-in-andata,
  wipe-in-svolgimento, success-al-POI → agguato vinto con 1 morto → loot
  tenuto; success-al-POI → morto → secondo agguato → wipe → loot perso, morti
  accumulate, XP per regola provvisor pinned.
- **OB-5** validatore DAG in CI su tutti gli scenari (allow-list legacy).
- **OB-6** lint/test/build:check/closure:lint/verify:bundle + characterization
  suite legacy verde a ogni commit.
- **OB-7** eye-check Director su rotta/marker/parked + sorte scena `ritorno`;
  claim visivi solo con testimone (T-04); dichiarato ciò che non è verificato.

## 12. Fuori scope (esplicito)

- Balancing numerico di `travelDays` (valori authored a buonsenso; calibrazione
  futura con bound documentati).
- Migrazione dei run in corso (D-6); downgrade support (lo shim hydrate-time
  non lo è).
- Nuove meccaniche di viaggio simulative (razioni, incontri casuali non authored).
- Modifica del depth-parallax/cinematica PLAN-046/050 (closed-scope).
- Ruling XP-wipe e rollback: **decisioni dovute** al PR di T-003, non silent.

## 13. Note operative

- Config-first: `travelDays`, waypoints, stile rotta in
  `src/balancing/config/idleVillage/**` (Zod), niente hardcode.
- Persistenza solo via `@/shared/persistence/PersistenceService`.
- i18n: chiavi `idleVillage.questJourney.*` (it+en).
- Precedente: `INVASION_MARCH_DAYS` (game-frame-pixi) — generalizzare, non
  duplicare.
- Provenienza design: `artifact-r011.md` + `decision_memo.md` +
  `grounding-ledger.md` in
  `mind-weaver/.mw/runs/20261018-2119-plan053-quest-legs/`; copia in
  `test-results/plan-053/`.
